// Spec §5.6 y §5.7: qué ocurrencia (día, ventana) cubre cada completado de una
// periódica con horario, ejercitado a través de `completar`.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { completar } from './completados';
import { ocurrenciasDelDia } from './horario';
import { ultimaCubierta } from './ocurrencia-cubierta';
import { esOcurrencia } from './ocurrencias';
import { proximaOcurrenciaCalendario, proximaOcurrenciaPorVentana } from './ocurrencias-con-horario';
import { DIAS_DE_LA_SEMANA, type Completado, type Horario, type InicioDeOcurrencia, type TareaPeriodica } from './tarea';

const HORA_MS = 3_600_000;
const hora = (minutos: number) => `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
/** Un horario válido (§4.1) de `n` ventanas ordenadas y sin superponerse. */
const horarioDe = (min: number) =>
	fc
		.integer({ min, max: 4 })
		.chain((n) => fc.uniqueArray(fc.integer({ min: 0, max: 1439 }), { minLength: 2 * n, maxLength: 2 * n }))
		.map((minutos): Horario => {
			const orden = [...minutos].sort((a, b) => a - b);
			return orden.flatMap((m, i) => (i % 2 === 0 ? [{ desde: hora(m), hasta: hora(orden[i + 1]) }] : []));
		});
const calendario = fc.oneof(
	fc.subarray([...DIAS_DE_LA_SEMANA], { minLength: 1 }).map((d) => ({ modo: 'calendario' as const, diasSemana: d })),
	fc
		.uniqueArray(fc.integer({ min: 1, max: 31 }), { minLength: 1, maxLength: 6 })
		.map((d) => ({ modo: 'calendario' as const, diasMes: d.sort((a, b) => a - b) }))
);
/** §5.7: una relativa se completa por ventana con el intervalo en días y más de una ventana. */
const porVentana = fc.integer({ min: 1, max: 30 }).map((cada) => ({ modo: 'relativo' as const, cada, unidad: 'dias' as const }));
const creadaEn = fc.tuple(fc.integer({ min: 0, max: 30_000 }), fc.integer({ min: 0, max: 1439 })).map(([dia, m]) => new Date(1990, 0, 1 + dia, 0, m));

type TareaConHorario = TareaPeriodica & { horario: Horario };
const tareaCalendario = fc
	.tuple(calendario, horarioDe(1), creadaEn)
	.map(([recurrencia, horario, creada]): TareaConHorario => ({ id: 't', titulo: 'T', tipo: 'periodica', recurrencia, horario, creadaEn: creada }));
const tareaPorVentana = fc
	.tuple(porVentana, horarioDe(2), creadaEn)
	.map(([recurrencia, horario, creada]): TareaConHorario => ({ id: 't', titulo: 'T', tipo: 'periodica', recurrencia, horario, creadaEn: creada }));
const tarea = fc.oneof(tareaCalendario, tareaPorVentana);

/** Momentos relativos a creadaEn, en horas: hasta ~4 meses después (y alguno antes, otro reloj). */
const desplazamientos = fc.array(fc.integer({ min: -48, max: 3_000 }), { maxLength: 10 });
const enHoras = (t: TareaPeriodica, horas: number) => new Date(t.creadaEn.getTime() + horas * HORA_MS);

/** Completa la tarea en cada momento, en ese orden, como lo haría la app. */
function completarEn(t: TareaPeriodica, momentos: readonly Date[]): Completado[] {
	return momentos.reduce<Completado[]>((cs, m) => [...cs, completar(t, cs, `c${cs.length}`, m)], []);
}
const inicioCubierto = (c: Completado) => (c.ocurrenciaCubierta as InicioDeOcurrencia).inicio.getTime();
/** N: la próxima ocurrencia (día, ventana) según la recurrencia. */
function proxima({ recurrencia, horario, creadaEn: creada }: TareaConHorario, cs: readonly Completado[]) {
	if (recurrencia.modo === 'calendario') return proximaOcurrenciaCalendario(recurrencia, horario, creada, cs);
	return proximaOcurrenciaPorVentana(recurrencia, horario, creada, cs);
}

describe('ocurrencias con horario (propiedades, spec §5.6 y §5.7)', () => {
	it('cada completado cubre el inicio de una ventana de un día que cuenta', () => {
		fc.assert(
			fc.property(tarea, desplazamientos, (t, horas) => {
				for (const c of completarEn(t, horas.map((h) => enHoras(t, h)))) {
					const inicio = (c.ocurrenciaCubierta as InicioDeOcurrencia).inicio;
					expect(ocurrenciasDelDia(t.horario, inicio).map((o) => o.inicio)).toContain(inicio.getTime());
					if (t.recurrencia.modo === 'calendario') expect(esOcurrencia(t.recurrencia, inicio)).toBe(true);
				}
			})
		);
	});

	it('P solo crece: cada completado cubre una ocurrencia posterior a P, nunca anterior a N', () => {
		fc.assert(
			fc.property(tarea, desplazamientos, (t, horas) => {
				const cs = completarEn(t, horas.map((h) => enHoras(t, h)));
				cs.forEach((c, i) => {
					const antes = cs.slice(0, i);
					expect(inicioCubierto(c)).toBeGreaterThan(ultimaCubierta(t.creadaEn, antes));
					expect(inicioCubierto(c)).toBeGreaterThanOrEqual(proxima(t, antes).inicio);
				});
			})
		);
	});

	it('no se adelanta: cubre N o una ocurrencia que ya empezó', () => {
		fc.assert(
			fc.property(tarea, desplazamientos, (t, horas) => {
				const cs = completarEn(t, horas.map((h) => enHoras(t, h)));
				cs.forEach((c, i) => {
					const n = proxima(t, cs.slice(0, i)).inicio;
					expect(inicioCubierto(c) === n || inicioCubierto(c) <= c.completadoEn.getTime()).toBe(true);
				});
			})
		);
	});

	it('N empieza después de P, es una ventana válida y avanza al completar', () => {
		fc.assert(
			fc.property(tarea, desplazamientos, (t, horas) => {
				const cs = completarEn(t, horas.map((h) => enHoras(t, h)));
				const n = proxima(t, cs);
				expect(n.inicio).toBeGreaterThan(ultimaCubierta(t.creadaEn, cs));
				expect(ocurrenciasDelDia(t.horario, new Date(n.inicio))).toContainEqual(n);
				if (cs.length > 0) expect(n.inicio).toBeGreaterThan(inicioCubierto(cs[cs.length - 1]));
			})
		);
	});

	it('P no depende del orden de los completados', () => {
		fc.assert(
			fc.property(tarea, desplazamientos, fc.nat(), (t, horas, giro) => {
				const cs = completarEn(t, horas.map((h) => enHoras(t, h)));
				const k = giro % Math.max(cs.length, 1);
				expect(ultimaCubierta(t.creadaEn, [...cs.slice(k), ...cs.slice(0, k)])).toBe(ultimaCubierta(t.creadaEn, cs));
				expect(ultimaCubierta(t.creadaEn, [...cs].reverse())).toBe(ultimaCubierta(t.creadaEn, cs));
			})
		);
	});
});
