import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { estaCompletada } from './completada';
import { completadosDeTarea, ultimoCompletadoEn } from './completados';
import { estadoDeTarea } from './estado-de-tarea';
import { filasDePendientes } from './pendientes';
import type { Completado, Tarea } from './tarea';
import { instanteDeUrgencia } from './urgencia';

const instante = fc.integer({ min: 0, max: 4_102_444_800_000 }).map((ms) => new Date(ms));
const dia = fc.integer({ min: 0, max: 47_000 }).map((n) => new Date(1970, 0, 1 + n));
const recurrencia = fc.oneof(
	fc.record({ modo: fc.constant('relativo' as const), cada: fc.integer({ min: 1, max: 1000 }), unidad: fc.constantFrom('horas' as const, 'dias' as const) }),
	fc.record({
		modo: fc.constant('calendario' as const),
		diasMes: fc.uniqueArray(fc.integer({ min: 1, max: 31 }), { minLength: 1, maxLength: 3 }).map((d) => d.sort((a, b) => a - b))
	})
);
const hora = (minutos: number) => `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
/** Un horario válido (§4.1), o ninguno. */
const horario = fc.option(
	fc.uniqueArray(fc.integer({ min: 0, max: 1439 }), { minLength: 2, maxLength: 2 }).map(([a, b]) => [{ desde: hora(Math.min(a, b)), hasta: hora(Math.max(a, b)) }]),
	{ nil: undefined }
);
/** Una tarea puntual (con o sin fecha límite) o periódica, con o sin horario, con id t<i>. */
const tareaNumero = (i: number) =>
	fc.tuple(fc.option(dia, { nil: undefined }), fc.option(recurrencia, { nil: undefined }), dia, horario).map(
		([fechaLimite, recurrencia, creadaEn, horario]): Tarea => {
			const comun = { id: `t${i}`, titulo: `T${i % 2}`, creadaEn, ...(horario && { horario }) };
			if (recurrencia) return { ...comun, tipo: 'periodica', recurrencia };
			return { ...comun, tipo: 'puntual', ...(fechaLimite && { fechaLimite }) };
		}
	);
const tareas = fc.integer({ min: 0, max: 6 }).chain((n) => fc.tuple(...Array.from({ length: n }, (_, i) => tareaNumero(i))));
const tareasPermutadas = tareas.chain((lista) =>
	fc.shuffledSubarray(lista, { minLength: lista.length, maxLength: lista.length }).map((permutadas) => [lista, permutadas] as const)
);
const completados = fc
	.array(fc.tuple(fc.integer({ min: 0, max: 7 }), instante), { maxLength: 8 })
	.map((lista) => lista.map(([t, completadoEn], i): Completado => ({ id: `c${i}`, tareaId: `t${t}`, completadoEn })));

describe('filasDePendientes (propiedades)', () => {
	it('con Mostrar completadas apagado, son exactamente las tareas no completadas, con su estado (el orden es de §6.1)', () => {
		fc.assert(
			fc.property(tareas, completados, instante, (lista, hechos, ahora) => {
				const esperadas = lista
					.map((tarea) => ({ tarea, estado: estadoDeTarea(tarea, hechos, ahora), completada: false }))
					.filter(({ tarea, estado }) => !estaCompletada(tarea, hechos, ahora));
				const porId = (a: { tarea: Tarea }, b: { tarea: Tarea }) => a.tarea.id.localeCompare(b.tarea.id);
				expect([...filasDePendientes(lista, hechos, ahora)].sort(porId)).toEqual(esperadas.sort(porId));
			})
		);
	});

	it('una puntual con algún completado nunca es una fila', () => {
		fc.assert(
			fc.property(tareas, completados, instante, (lista, hechos, ahora) => {
				const hechas = new Set(hechos.map(({ tareaId }) => tareaId));
				for (const { tarea } of filasDePendientes(lista, hechos, ahora))
					expect(tarea.tipo === 'puntual' && hechas.has(tarea.id)).toBe(false);
			})
		);
	});

	it('el orden no depende del orden en que llegan las tareas', () => {
		fc.assert(
			fc.property(tareasPermutadas, completados, instante, ([lista, permutadas], hechos, ahora) => {
				expect(filasDePendientes(permutadas, hechos, ahora)).toEqual(filasDePendientes(lista, hechos, ahora));
			})
		);
	});

	it('los grupos quedan contiguos: atrasada, pendiente, en espera', () => {
		const rango = { atrasada: 0, pendiente: 1, 'en espera': 2, completada: 3, pausada: 4 };
		fc.assert(
			fc.property(tareas, completados, instante, (lista, hechos, ahora) => {
				const rangos = filasDePendientes(lista, hechos, ahora).map(({ estado }) => rango[estado.tipo]);
				expect(rangos).toEqual([...rangos].sort((a, b) => a - b));
			})
		);
	});

	it('dentro de cada grupo, del instante de urgencia más antiguo al más reciente, y sin instante al final', () => {
		fc.assert(
			fc.property(tareas, completados, instante, (lista, hechos, ahora) => {
				const filas = filasDePendientes(lista, hechos, ahora).flatMap(({ tarea, completada, estado }) => (completada || estado.tipo === 'pausada' ? [] : [{ tarea, estado }]));
				const clave = ({ tarea, estado }: (typeof filas)[number]) => instanteDeUrgencia(tarea, hechos, estado, ahora)?.getTime() ?? Infinity;
				for (let i = 1; i < filas.length; i++)
					if (filas[i - 1].estado.tipo === filas[i].estado.tipo) expect(clave(filas[i - 1])).toBeLessThanOrEqual(clave(filas[i]));
			})
		);
	});

	it('con Mostrar completadas encendido, cada tarea es una fila exactamente una vez', () => {
		fc.assert(
			fc.property(tareas, completados, instante, (lista, hechos, ahora) => {
				const ids = filasDePendientes(lista, hechos, ahora, true).map(({ tarea }) => tarea.id);
				expect([...ids].sort()).toEqual(lista.map(({ id }) => id).sort());
			})
		);
	});

	it('encender Mostrar completadas solo agrega las completadas al final, sin tocar las demás', () => {
		fc.assert(
			fc.property(tareas, completados, instante, (lista, hechos, ahora) => {
				const sin = filasDePendientes(lista, hechos, ahora);
				const con = filasDePendientes(lista, hechos, ahora, true);
				expect(con.slice(0, sin.length)).toEqual(sin);
				expect(con.slice(sin.length).every(({ completada }) => completada)).toBe(true);
			})
		);
	});

	it('las completadas van de la de completadoEn más reciente a la más antigua', () => {
		fc.assert(
			fc.property(tareas, completados, instante, (lista, hechos, ahora) => {
				const ultimos = filasDePendientes(lista, hechos, ahora, true)
					.filter(({ completada }) => completada)
					.map(({ tarea }) => ultimoCompletadoEn(completadosDeTarea(hechos, tarea.id)));
				expect(ultimos).toEqual([...ultimos].sort((a, b) => b - a));
			})
		);
	});

	it('con Mostrar completadas encendido, el orden tampoco depende del orden en que llegan las tareas', () => {
		fc.assert(
			fc.property(tareasPermutadas, completados, instante, ([lista, permutadas], hechos, ahora) => {
				expect(filasDePendientes(permutadas, hechos, ahora, true)).toEqual(filasDePendientes(lista, hechos, ahora, true));
			})
		);
	});
});
