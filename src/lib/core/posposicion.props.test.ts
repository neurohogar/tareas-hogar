import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { aplicarCambio, tareaDesdeDocumento } from './documento-de-tarea';
import { estadoDeTarea } from './estado-de-tarea';
import { accionDePosponer, textoDePosposicion } from './posposicion-en-panel';
import { OPCIONES_DE_POSPONER, posponer, quitarPosponer } from './posposicion';
import { posposicionVigente } from './posposicion-vigente';
import type { Tarea } from './tarea';

const instante = fc.integer({ min: 0, max: 4_000_000_000_000 }).map((ms) => new Date(ms));
const opcion = fc.constantFrom(...OPCIONES_DE_POSPONER.map(({ opcion }) => opcion));
const posposicion = fc
	.tuple(instante, fc.integer({ min: 1, max: 100_000_000 }))
	.map(([desde, duracion]) => ({ desde, hasta: new Date(desde.getTime() + duracion) }));
/** Puntual o periódica relativa, con o sin posposición; pausada solo la periódica. */
const tarea = fc
	.tuple(fc.boolean(), instante, fc.option(instante, { nil: undefined }), fc.integer({ min: 1, max: 100 }), fc.option(posposicion, { nil: undefined }), fc.boolean())
	.map(([esPuntual, creadaEn, fechaLimite, cada, pospuesta, pausada]): Tarea => {
		const comun = { id: 't', titulo: 'T', creadaEn, ...(pospuesta && { pospuesta }) };
		if (esPuntual) return { ...comun, tipo: 'puntual', ...(fechaLimite && { fechaLimite }) };
		return { ...comun, tipo: 'periodica', recurrencia: { modo: 'relativo', cada, unidad: 'dias' }, ...(pausada && { pausada }) };
	});
const sinPosposicion = ({ pospuesta: _, ...resto }: Tarea): Tarea => resto;

describe('posponer (propiedades, spec §5.9)', () => {
	it('desde es ahora y hasta es posterior, a lo sumo en un día y medio', () => {
		fc.assert(
			fc.property(opcion, instante, (o, ahora) => {
				const { desde, hasta } = posponer(o, ahora).pospuesta!;
				expect(desde).toEqual(ahora);
				expect(hasta.getTime()).toBeGreaterThan(ahora.getTime());
				expect(hasta.getTime() - ahora.getTime()).toBeLessThanOrEqual(32 * 60 * 60 * 1000);
			})
		);
	});

	it('posponer escribe el campo entero y quitar posponer lo borra', () => {
		fc.assert(
			fc.property(tarea, opcion, instante, (t, o, ahora) => {
				const pospuesta = aplicarCambio([t], 't', posponer(o, ahora));
				expect(tareaDesdeDocumento(pospuesta[0]).pospuesta).toEqual(posponer(o, ahora).pospuesta);
				expect(tareaDesdeDocumento(aplicarCambio(pospuesta, 't', quitarPosponer())[0]).pospuesta).toBeUndefined();
			})
		);
	});
});

describe('estado de una pospuesta (propiedades, spec §5.9)', () => {
	it('vencida (ahora >= hasta), no cambia nada del estado', () => {
		fc.assert(
			fc.property(tarea, instante, (t, ahora) => {
				fc.pre(t.pospuesta !== undefined && ahora.getTime() >= t.pospuesta.hasta.getTime());
				expect(estadoDeTarea(t, [], ahora)).toEqual(estadoDeTarea(sinPosposicion(t), [], ahora));
			})
		);
	});

	it('vigente, solo cambia pendiente o atrasada, que pasan a en espera con progreso en [0, 1)', () => {
		fc.assert(
			fc.property(tarea, instante, (t, ahora) => {
				fc.pre(posposicionVigente(t, ahora) !== undefined);
				const propio = estadoDeTarea(sinPosposicion(t), [], ahora);
				const estado = estadoDeTarea(t, [], ahora);
				if (propio.tipo !== 'pendiente' && propio.tipo !== 'atrasada') {
					expect(estado).toEqual(propio);
				} else {
					expect(estado).toMatchObject({ tipo: 'en espera' });
					const { progreso } = estado as { progreso: number };
					expect(progreso).toBeGreaterThanOrEqual(0);
					expect(progreso).toBeLessThan(1);
				}
			})
		);
	});

	it('el progreso nunca baja al avanzar el reloj', () => {
		fc.assert(
			fc.property(posposicion, instante, fc.integer({ min: 0, max: 100_000_000 }), (pospuesta, ahora, salto) => {
				const t: Tarea = { id: 't', titulo: 'T', tipo: 'puntual', creadaEn: new Date(0), pospuesta };
				const antes = estadoDeTarea(t, [], ahora);
				const despues = estadoDeTarea(t, [], new Date(ahora.getTime() + salto));
				fc.pre(antes.tipo === 'en espera' && despues.tipo === 'en espera');
				expect((despues as { progreso: number }).progreso).toBeGreaterThanOrEqual((antes as { progreso: number }).progreso);
			})
		);
	});
});

describe('panel de una pospuesta (propiedades, spec §6.2)', () => {
	it('con una posposición vigente ofrece Quitar posponer y muestra el texto; sin ella, no hay texto', () => {
		fc.assert(
			fc.property(tarea, instante, (t, ahora) => {
				const vigente = posposicionVigente(t, ahora) !== undefined;
				expect(accionDePosponer(t, [], ahora) === 'quitar').toBe(vigente);
				expect(textoDePosposicion(t, ahora) !== undefined).toBe(vigente);
			})
		);
	});

	it('una pausada sin posposición vigente no ofrece Posponer', () => {
		fc.assert(
			fc.property(tarea, instante, (t, ahora) => {
				fc.pre(t.tipo === 'periodica' && t.pausada === true && posposicionVigente(t, ahora) === undefined);
				expect(accionDePosponer(t, [], ahora)).toBeUndefined();
			})
		);
	});
});
