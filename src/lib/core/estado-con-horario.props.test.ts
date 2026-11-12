import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { checkboxHabilitado } from './checkbox';
import { estaCompletada } from './completada';
import { estadoDeTarea } from './estado-de-tarea';
import { cierreDelDia, dentroDelHorario } from './horario';
import { DIAS_DE_LA_SEMANA, type Completado, type Horario, type Tarea } from './tarea';
import { instanteDeUrgencia } from './urgencia';

const hora = (minutos: number) => `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
/** Un horario válido (§4.1): de una a cuatro ventanas ordenadas y sin superponerse. */
const horario: fc.Arbitrary<Horario> = fc
	.integer({ min: 1, max: 4 })
	.chain((n) => fc.uniqueArray(fc.integer({ min: 0, max: 1439 }), { minLength: 2 * n, maxLength: 2 * n }))
	.map((minutos) => {
		const orden = [...minutos].sort((a, b) => a - b);
		return orden.flatMap((m, i) => (i % 2 === 0 ? [{ desde: hora(m), hasta: hora(orden[i + 1]) }] : []));
	});
const instante = fc.integer({ min: 0, max: 4_102_444_800_000 }).map((ms) => new Date(ms));
const dia = fc.integer({ min: 0, max: 47_000 }).map((n) => new Date(1970, 0, 1 + n));
const recurrencia = fc.oneof(
	fc.record({
		modo: fc.constant('relativo' as const),
		cada: fc.integer({ min: 1, max: 1000 }),
		unidad: fc.constantFrom('horas' as const, 'dias' as const)
	}),
	fc.record({
		modo: fc.constant('calendario' as const),
		diasMes: fc
			.uniqueArray(fc.integer({ min: 1, max: 31 }), {
				minLength: 1,
				maxLength: 3
			})
			.map((d) => d.sort((a, b) => a - b))
	}),
	fc.record({
		modo: fc.constant('calendario' as const),
		diasSemana: fc.subarray([...DIAS_DE_LA_SEMANA], { minLength: 1 })
	})
);
/** Una tarea con horario, de cualquier tipo y recurrencia. */
const tarea = fc.tuple(horario, fc.option(dia, { nil: undefined }), fc.option(recurrencia, { nil: undefined }), instante).map(
	([horario, fechaLimite, recurrencia, creadaEn]): Tarea & {
		horario: Horario;
	} => {
		const comun = { id: 't', titulo: 'T', horario, creadaEn };
		// §4.1: una relativa en horas tiene una sola ventana.
		if (recurrencia?.modo === 'relativo' && recurrencia.unidad === 'horas') return { ...comun, horario: [horario[0]], tipo: 'periodica', recurrencia };
		if (recurrencia) return { ...comun, tipo: 'periodica', recurrencia };
		return { ...comun, tipo: 'puntual', ...(fechaLimite && { fechaLimite }) };
	}
);
const completados = fc.array(instante, { maxLength: 4 }).map((lista) =>
	lista.map((completadoEn, i): Completado => ({
		id: `c${i}`,
		tareaId: 't',
		completadoEn
	}))
);

const sinHorario = ({ horario: _, ...resto }: Tarea): Tarea => resto as Tarea;

describe('estado con horario (propiedades, spec §5.5)', () => {
	it('fuera de su ventana, una tarea con horario nunca está pendiente', () => {
		fc.assert(
			fc.property(tarea, completados, instante, (t, cs, ahora) => {
				if (!dentroDelHorario(t.horario, ahora)) expect(estadoDeTarea(t, cs, ahora).tipo).not.toBe('pendiente');
			})
		);
	});

	it('con horario o sin él, la tarea está completada en los mismos casos', () => {
		fc.assert(
			fc.property(tarea, completados, instante, (t, cs, ahora) => {
				const conHorario = estadoDeTarea(t, cs, ahora);
				const sin = estadoDeTarea(sinHorario(t), cs, ahora);
				expect(conHorario.tipo === 'completada').toBe(sin.tipo === 'completada');
			})
		);
	});

	it('una puntual con horario sin completar se atrasa justo al cierre de la última ventana de su fecha límite', () => {
		fc.assert(
			fc.property(tarea, instante, (t, ahora) => {
				fc.pre(t.tipo === 'puntual');
				const atraso = t.tipo === 'puntual' && t.fechaLimite ? cierreDelDia(t.horario, t.fechaLimite) : Number.POSITIVE_INFINITY;
				expect(estadoDeTarea(t, [], ahora).tipo === 'atrasada').toBe(ahora.getTime() >= atraso);
			})
		);
	});

	// En espera, el instante es A (§5.5): ahí ya no espera, aunque el atraso pueda haber llegado antes.
	it('el instante de urgencia es A para una en espera y desde cuándo está atrasada para una atrasada', () => {
		fc.assert(
			fc.property(tarea, completados, instante, (t, cs, ahora) => {
				const estado = estadoDeTarea(t, cs, ahora);
				if (estado.tipo !== 'en espera' && estado.tipo !== 'atrasada') return;
				const momento = instanteDeUrgencia(t, cs, estado, ahora) as Date;
				const en = estadoDeTarea(t, cs, momento).tipo;
				if (estado.tipo === 'en espera') {
					expect(momento.getTime()).toBeGreaterThan(ahora.getTime());
					expect(en).not.toBe('en espera');
				} else {
					const antes = estadoDeTarea(t, cs, new Date(momento.getTime() - 1)).tipo;
					expect(momento.getTime()).toBeLessThanOrEqual(ahora.getTime());
					expect([antes === 'atrasada', en]).toEqual([false, 'atrasada']);
				}
			})
		);
	});
});

describe('checkbox con horario (propiedades, spec §5.5 y §6.1)', () => {
	it('dentro de la ventana el checkbox siempre está habilitado', () => {
		fc.assert(
			fc.property(tarea, completados, instante, (t, cs, ahora) => {
				fc.pre(dentroDelHorario(t.horario, ahora));
				expect(checkboxHabilitado(t, cs, ahora)).toBe(true);
			})
		);
	});

	it('fuera de la ventana, solo está habilitado para borrar un completado', () => {
		fc.assert(
			fc.property(tarea, completados, instante, (t, cs, ahora) => {
				fc.pre(!dentroDelHorario(t.horario, ahora));
				const completada = estaCompletada(t, cs, ahora);
				if (!completada) expect(checkboxHabilitado(t, cs, ahora)).toBe(false);
			})
		);
	});
});
