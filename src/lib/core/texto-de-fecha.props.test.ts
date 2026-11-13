// Spec §6.1 (Fecha y distancia): invariantes del texto «Tocaba …» / «Vuelve …».
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { estadoDeTarea } from './estado-de-tarea';
import { DIAS_DE_LA_SEMANA, type Completado, type Horario, type Recurrencia, type Tarea } from './tarea';
import { fraseDeFecha } from './texto-de-fecha';
import { textoDeFecha } from './texto-de-fecha-de-tarea';
import { instanteDeTocaba, instanteDeVuelve } from './texto-de-fecha-instantes';

const MINUTO = 60_000;
const DIA = 86_400_000;
/** Un momento local entre 2020 y ~2030, a minuto entero. */
const momento = fc.integer({ min: 0, max: 5_000_000 }).map((n) => new Date(2020, 0, 1, 0, n * 2));
const verbo = fc.constantFrom('Tocaba' as const, 'Vuelve' as const);

describe('fraseDeFecha (propiedades)', () => {
	it('empieza con el verbo, nunca dice «en 0 …» y es función pura de sus entradas', () => {
		fc.assert(
			fc.property(verbo, momento, momento, (v, instante, ahora) => {
				const frase = fraseDeFecha(v, instante, ahora);
				expect(frase.startsWith(`${v} `)).toBe(true);
				expect(frase).not.toMatch(/ · (en|hace) 0 /);
				expect(fraseDeFecha(v, new Date(instante), new Date(ahora))).toBe(frase);
			})
		);
	});

	it('lo pasado nunca dice «en N» y lo futuro nunca dice «hace N»', () => {
		fc.assert(
			fc.property(verbo, momento, fc.integer({ min: -400 * 24 * 60, max: 400 * 24 * 60 }), (v, ahora, minutos) => {
				const instante = new Date(ahora.getTime() + minutos * MINUTO);
				const frase = fraseDeFecha(v, instante, ahora);
				if (minutos <= 0) expect(frase).not.toMatch(/ · en /);
				if (minutos >= 0) expect(frase).not.toMatch(/ · hace /);
			})
		);
	});

	it('S16: lo pasado a menos de un minuto con hora termina en « · ahora»', () => {
		fc.assert(
			fc.property(verbo, momento, fc.integer({ min: 0, max: MINUTO - 1 }), (v, ahora, ms) => {
				const instante = new Date(ahora.getTime() - ms);
				fc.pre(instante.getTime() !== new Date(instante.getFullYear(), instante.getMonth(), instante.getDate()).getTime());
				const frase = fraseDeFecha(v, instante, ahora);
				expect(frase.endsWith(' · ahora')).toBe(true);
				expect(frase).not.toMatch(/hace 0/);
			})
		);
	});

	it('S16: lo futuro a menos de un minuto nunca dice «en 0» y redondea a «en 1 minuto»', () => {
		fc.assert(
			fc.property(verbo, momento, fc.integer({ min: 1, max: MINUTO }), (v, ahora, ms) => {
				const instante = new Date(ahora.getTime() + ms);
				fc.pre(instante.getTime() !== new Date(instante.getFullYear(), instante.getMonth(), instante.getDate()).getTime());
				const frase = fraseDeFecha(v, instante, ahora);
				expect(frase).not.toMatch(/en 0/);
				expect(frase.endsWith(' · en 1 minuto')).toBe(true);
			})
		);
	});

	it('«el» va solo delante de la fecha con día de la semana', () => {
		fc.assert(
			fc.property(verbo, momento, momento, (v, instante, ahora) => {
				const frase = fraseDeFecha(v, instante, ahora);
				const conPalabra = /^(Tocaba|Vuelve) (hoy|ayer|mañana)\b/.test(frase);
				expect(/^(Tocaba|Vuelve) el /.test(frase)).toBe(!conPalabra);
			})
		);
	});

	it('con hoy, ayer o mañana y sin hora no hay distancia', () => {
		fc.assert(
			fc.property(verbo, momento, fc.integer({ min: -1, max: 1 }), (v, ahora, dias) => {
				const instante = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + dias);
				expect(fraseDeFecha(v, instante, ahora)).not.toContain('·');
			})
		);
	});
});

const horarioAleatorio = fc.option(
	fc.constantFrom<Horario>([{ desde: '08:00', hasta: '11:00' }], [{ desde: '06:00', hasta: '07:00' }, { desde: '18:00', hasta: '20:00' }]),
	{ nil: undefined }
);
const recurrencia = fc.oneof(
	fc.record({ modo: fc.constant('relativo' as const), cada: fc.integer({ min: 1, max: 10 }), unidad: fc.constantFrom('horas' as const, 'dias' as const) }),
	fc.uniqueArray(fc.constantFrom(...DIAS_DE_LA_SEMANA), { minLength: 1, maxLength: 7 }).map((dias): Recurrencia => ({
		modo: 'calendario',
		diasSemana: DIAS_DE_LA_SEMANA.filter((d) => dias.includes(d))
	})),
	fc.uniqueArray(fc.integer({ min: 1, max: 31 }), { minLength: 1, maxLength: 5 }).map((dias): Recurrencia => ({ modo: 'calendario', diasMes: dias.sort((a, b) => a - b) }))
);
const escenario = fc.record({
	creada: momento,
	horario: horarioAleatorio,
	tipo: fc.oneof(
		recurrencia.map((r) => ({ recurrencia: r, limite: undefined as number | undefined })),
		fc.option(fc.integer({ min: -5, max: 30 }), { nil: undefined }).map((limite) => ({ recurrencia: undefined, limite }))
	),
	completadoDespues: fc.option(fc.integer({ min: 0, max: 20 * DIA }), { nil: undefined }),
	despues: fc.integer({ min: 0, max: 40 * DIA })
});

type Escenario = typeof escenario extends fc.Arbitrary<infer T> ? T : never;

function armar(e: Escenario) {
	const base = { id: 't', titulo: 'T', creadaEn: e.creada, ...(e.horario && { horario: e.horario }) };
	const { recurrencia: r, limite } = e.tipo;
	const tarea: Tarea = r
		? { ...base, tipo: 'periodica', recurrencia: r }
		: { ...base, tipo: 'puntual', ...(limite !== undefined && { fechaLimite: new Date(e.creada.getFullYear(), e.creada.getMonth(), e.creada.getDate() + limite) }) };
	const completados: Completado[] =
		e.completadoDespues === undefined ? [] : [{ id: 'c', tareaId: 't', completadoEn: new Date(e.creada.getTime() + e.completadoDespues) }];
	const ahora = new Date(e.creada.getTime() + e.despues);
	return { tarea, completados, ahora, estado: estadoDeTarea(tarea, completados, ahora) };
}

describe('texto de fecha de una tarea (propiedades)', () => {
	it('«Tocaba» nunca nombra un instante futuro: el instante es <= ahora y el texto no dice «en N»', () => {
		fc.assert(
			fc.property(escenario, (e) => {
				const { tarea, completados, ahora, estado } = armar(e);
				fc.pre(estado.tipo === 'atrasada');
				const tocaba = instanteDeTocaba(tarea, completados, ahora);
				if (tocaba) expect(tocaba.getTime()).toBeLessThanOrEqual(ahora.getTime());
				const texto = textoDeFecha(tarea, completados, estado, ahora);
				expect(texto === undefined || (texto.startsWith('Tocaba ') && !texto.includes(' · en '))).toBe(true);
			})
		);
	});

	it('«Vuelve» nombra un instante posterior a ahora y el texto no dice «hace N»', () => {
		fc.assert(
			fc.property(escenario, (e) => {
				const { tarea, completados, ahora, estado } = armar(e);
				fc.pre(estado.tipo === 'en espera');
				expect(instanteDeVuelve(tarea, completados, estado, ahora).getTime()).toBeGreaterThan(ahora.getTime());
				const texto = textoDeFecha(tarea, completados, estado, ahora) as string;
				expect(texto.startsWith('Vuelve ')).toBe(true);
				expect(texto).not.toContain(' · hace ');
			})
		);
	});

	it('una pendiente no lleva texto y el texto es función pura de ahora', () => {
		fc.assert(
			fc.property(escenario, (e) => {
				const { tarea, completados, ahora, estado } = armar(e);
				if (estado.tipo === 'pendiente') expect(textoDeFecha(tarea, completados, estado, ahora)).toBeUndefined();
				const otra = new Date(ahora);
				expect(textoDeFecha(tarea, completados, estadoDeTarea(tarea, completados, otra), otra)).toBe(textoDeFecha(tarea, completados, estado, ahora));
			})
		);
	});
});
