// Spec §5.3: qué ocurrencia cubre cada completado, ejercitado a través de `completar`.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { completar } from './completados';
import { inicioDelDia, sumarDias } from './dias';
import { estadoPeriodicaCalendario } from './estado-periodica-calendario';
import { ultimaOcurrenciaCubierta } from './ocurrencia-cubierta';
import { esOcurrencia, primeraOcurrenciaPosterior } from './ocurrencias';
import { DIAS_DE_LA_SEMANA, type Completado, type RecurrenciaCalendario, type TareaPeriodica } from './tarea';

const HORA_MS = 3_600_000;
const recurrencia: fc.Arbitrary<RecurrenciaCalendario> = fc.oneof(
	fc.subarray([...DIAS_DE_LA_SEMANA], { minLength: 1 }).map((d) => ({ modo: 'calendario' as const, diasSemana: d })),
	fc
		.uniqueArray(fc.integer({ min: 1, max: 31 }), { minLength: 1, maxLength: 6 })
		.map((d) => ({ modo: 'calendario' as const, diasMes: d.sort((a, b) => a - b) }))
);
const tarea = fc
	.tuple(recurrencia, fc.integer({ min: 0, max: 30_000 }), fc.integer({ min: 0, max: 23 }))
	.map(
		([r, dia, hora]): TareaPeriodica => ({
			id: 't',
			titulo: 'T',
			tipo: 'periodica',
			recurrencia: r,
			creadaEn: new Date(1990, 0, 1 + dia, hora)
		})
	);
/** Momentos relativos a creadaEn, en horas: hasta ~4 meses después (y alguno antes, otro reloj). */
const desplazamientos = fc.array(fc.integer({ min: -48, max: 3_000 }), { maxLength: 12 });
const enHoras = (t: TareaPeriodica, horas: number) => new Date(t.creadaEn.getTime() + horas * HORA_MS);

/** Completa la tarea en cada momento, en ese orden, como lo haría la app. */
function completarEn(t: TareaPeriodica, momentos: readonly Date[]): Completado[] {
	return momentos.reduce<Completado[]>((cs, m) => [...cs, completar(t, cs, `c${cs.length}`, m)], []);
}
const pDe = (t: TareaPeriodica, cs: readonly Completado[]) => ultimaOcurrenciaCubierta(t.creadaEn, cs);
const r = (t: TareaPeriodica) => t.recurrencia as RecurrenciaCalendario;

describe('ocurrencia cubierta (propiedades)', () => {
	it('cubre siempre una ocurrencia real del patrón, a las 00:00 locales', () => {
		fc.assert(
			fc.property(tarea, desplazamientos, (t, horas) => {
				for (const c of completarEn(t, horas.map((h) => enHoras(t, h)))) {
					const cubierta = c.ocurrenciaCubierta as Date;
					expect(inicioDelDia(cubierta)).toEqual(cubierta);
					expect(esOcurrencia(r(t), cubierta)).toBe(true);
				}
			})
		);
	});

	it('P solo crece: cada completado nuevo cubre una ocurrencia posterior a P', () => {
		fc.assert(
			fc.property(tarea, desplazamientos, (t, horas) => {
				const cs = completarEn(t, horas.map((h) => enHoras(t, h)));
				cs.forEach((c, i) => {
					expect((c.ocurrenciaCubierta as Date) > pDe(t, cs.slice(0, i))).toBe(true);
				});
			})
		);
	});

	it('completar k veces sin atrasos (cada vez el día N) cubre k ocurrencias consecutivas', () => {
		fc.assert(
			fc.property(tarea, fc.array(fc.integer({ min: 0, max: 23 }), { minLength: 1, maxLength: 10 }), (t, horasDelDia) => {
				let esperada = sumarDias(inicioDelDia(t.creadaEn), -1);
				const cs: Completado[] = [];
				for (const hora of horasDelDia) {
					esperada = primeraOcurrenciaPosterior(r(t), esperada);
					const ahora = new Date(esperada.getTime() + hora * HORA_MS);
					expect(estadoPeriodicaCalendario(r(t), t.creadaEn, cs, ahora).tipo).toBe('pendiente');
					cs.push(completar(t, cs, `c${cs.length}`, ahora));
					expect(cs.at(-1)?.ocurrenciaCubierta).toEqual(esperada);
				}
			})
		);
	});

	it('cada completado extra en el mismo momento avanza exactamente una ocurrencia', () => {
		fc.assert(
			fc.property(tarea, desplazamientos, fc.integer({ min: 0, max: 3_000 }), fc.integer({ min: 2, max: 6 }), (t, horas, h, extras) => {
				const ahora = enHoras(t, h);
				const previos = horas.length;
				const cs = completarEn(t, [...horas.map((x) => enHoras(t, x)), ...Array<Date>(extras).fill(ahora)]);
				for (let i = previos + 1; i < cs.length; i++)
					expect(cs[i].ocurrenciaCubierta).toEqual(primeraOcurrenciaPosterior(r(t), cs[i - 1].ocurrenciaCubierta as Date));
			})
		);
	});

	it('el orden de los completados guardados no cambia la ocurrencia que cubre el siguiente', () => {
		const conPermutacion = fc
			.tuple(tarea, desplazamientos)
			.map(([t, horas]) => [t, completarEn(t, horas.map((h) => enHoras(t, h)))] as const)
			.chain(([t, cs]) => fc.shuffledSubarray(cs, { minLength: cs.length }).map((otro) => [t, cs, otro] as const));
		fc.assert(
			fc.property(conPermutacion, fc.integer({ min: -48, max: 3_000 }), ([t, cs, otro], h) => {
				const ahora = enHoras(t, h);
				expect(completar(t, otro, 'x', ahora)).toEqual(completar(t, cs, 'x', ahora));
			})
		);
	});

	it('después de completar, en ese mismo momento la tarea queda en espera', () => {
		fc.assert(
			fc.property(tarea, desplazamientos, fc.integer({ min: 0, max: 3_000 }), (t, horas, h) => {
				const ahora = enHoras(t, Math.max(h, ...horas));
				const cs = completarEn(t, [...horas.map((x) => enHoras(t, x)), ahora]);
				expect(estadoPeriodicaCalendario(r(t), t.creadaEn, cs, ahora)).toEqual({ tipo: 'en espera', progreso: 0 });
			})
		);
	});
});

describe('P con completados de antes de ser de calendario (propiedades)', () => {
	/** Completados mezclados: de calendario (con ocurrenciaCubierta) y de cuando era relativa o puntual (sin ella). */
	const completados = fc.array(
		fc.record(
			{
				id: fc.uuid(),
				tareaId: fc.constant('t'),
				completadoEn: fc.date({ min: new Date(1990, 0, 1), max: new Date(2100, 0, 1), noInvalidDate: true }),
				ocurrenciaCubierta: fc
					.date({ min: new Date(1990, 0, 1), max: new Date(2100, 0, 1), noInvalidDate: true })
					.map(inicioDelDia)
			},
			{ requiredKeys: ['id', 'tareaId', 'completadoEn'] }
		),
		{ minLength: 1, maxLength: 8 }
	);
	/** Los completados de estas propiedades cubren fechas (sin hora). */
	const diaDe = (c: Completado) => (c.ocurrenciaCubierta as Date | undefined) ?? inicioDelDia(c.completadoEn);
	const creada = new Date(1990, 0, 1);

	it('P es el día cubierto por alguno de ellos y ninguno cubre uno posterior', () => {
		fc.assert(
			fc.property(completados, (cs) => {
				const p = ultimaOcurrenciaCubierta(creada, cs);
				expect(cs.some((c) => diaDe(c).getTime() === p.getTime())).toBe(true);
				expect(cs.every((c) => diaDe(c).getTime() <= p.getTime())).toBe(true);
				expect(inicioDelDia(p)).toEqual(p);
			})
		);
	});

	it('P no depende del orden de los completados', () => {
		fc.assert(
			fc.property(completados, (cs) => {
				expect(ultimaOcurrenciaCubierta(creada, [...cs].reverse())).toEqual(ultimaOcurrenciaCubierta(creada, cs));
			})
		);
	});

	it('un completado más nunca baja P', () => {
		fc.assert(
			fc.property(completados, completados, (cs, mas) => {
				const antes = ultimaOcurrenciaCubierta(creada, cs);
				expect(ultimaOcurrenciaCubierta(creada, [...cs, mas[0]]).getTime()).toBeGreaterThanOrEqual(antes.getTime());
			})
		);
	});
});
