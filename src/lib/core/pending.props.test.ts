import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { isCompleted } from './completed';
import { completionsOfTask, lastCompletedAt } from './completions';
import { taskStatus } from './task-status';
import { pendingRows } from './pending';
import type { Completion, Task } from './task';
import { urgencyInstant } from './urgency';

const instant = fc.integer({ min: 0, max: 4_102_444_800_000 }).map((ms) => new Date(ms));
const day = fc.integer({ min: 0, max: 47_000 }).map((n) => new Date(1970, 0, 1 + n));
const recurrence = fc.oneof(
	fc.record({ mode: fc.constant('relativo' as const), every: fc.integer({ min: 1, max: 1000 }), unit: fc.constantFrom('horas' as const, 'dias' as const) }),
	fc.record({
		mode: fc.constant('calendario' as const),
		monthDays: fc.uniqueArray(fc.integer({ min: 1, max: 31 }), { minLength: 1, maxLength: 3 }).map((d) => d.sort((a, b) => a - b))
	})
);
const hour = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
/** Un horario válido (§4.1), o ninguno. */
const schedule = fc.option(
	fc.uniqueArray(fc.integer({ min: 0, max: 1439 }), { minLength: 2, maxLength: 2 }).map(([a, b]) => [{ from: hour(Math.min(a, b)), to: hour(Math.max(a, b)) }]),
	{ nil: undefined }
);
/** Una tarea puntual (con o sin fecha límite) o periódica, con o sin horario, con id t<i>. */
const taskNumber = (i: number) =>
	fc.tuple(fc.option(day, { nil: undefined }), fc.option(recurrence, { nil: undefined }), day, schedule).map(
		([dueDate, recurrence, createdAt, schedule]): Task => {
			const common = { id: `t${i}`, title: `T${i % 2}`, createdAt, ...(schedule && { schedule }) };
			if (recurrence) return { ...common, kind: 'periodica', recurrence };
			return { ...common, kind: 'puntual', ...(dueDate && { dueDate }) };
		}
	);
const tasks = fc.integer({ min: 0, max: 6 }).chain((n) => fc.tuple(...Array.from({ length: n }, (_, i) => taskNumber(i))));
const permutedTasks = tasks.chain((list) =>
	fc.shuffledSubarray(list, { minLength: list.length, maxLength: list.length }).map((permutedItems) => [list, permutedItems] as const)
);
const completions = fc
	.array(fc.tuple(fc.integer({ min: 0, max: 7 }), instant), { maxLength: 8 })
	.map((list) => list.map(([t, completedAt], i): Completion => ({ id: `c${i}`, taskId: `t${t}`, completedAt })));

describe('filasDePendientes (propiedades)', () => {
	it('con Mostrar completadas apagado, son exactamente las tareas no completadas, con su estado (el orden es de §6.1)', () => {
		fc.assert(
			fc.property(tasks, completions, instant, (list, doneOnes, now) => {
				const expectedValues = list
					.map((task) => ({ task, status: taskStatus(task, doneOnes, now), completed: false }))
					.filter(({ task, status }) => !isCompleted(task, doneOnes, now));
				const byId = (a: { task: Task }, b: { task: Task }) => a.task.id.localeCompare(b.task.id);
				const rows = pendingRows(list, doneOnes, now).map(({ task, status, completed }) => ({ task, status, completed }));
				expect(rows.sort(byId)).toEqual(expectedValues.sort(byId));
			})
		);
	});

	it('el texto de fecha es «Tocaba …» en una atrasada, «Vuelve …» en una en espera y ninguno en las demás (§6.1)', () => {
		fc.assert(
			fc.property(tasks, completions, instant, (list, doneOnes, now) => {
				for (const { status, dateText } of pendingRows(list, doneOnes, now, true, true)) {
					const verb = { atrasada: 'Tocaba ', 'en espera': 'Vuelve ' }[status.kind as string];
					if (verb) expect(dateText?.startsWith(verb)).toBe(true);
					else expect(dateText).toBeUndefined();
				}
			})
		);
	});

	it('una puntual con algún completado nunca es una fila', () => {
		fc.assert(
			fc.property(tasks, completions, instant, (list, doneOnes, now) => {
				const doneItems = new Set(doneOnes.map(({ taskId }) => taskId));
				for (const { task } of pendingRows(list, doneOnes, now))
					expect(task.kind === 'puntual' && doneItems.has(task.id)).toBe(false);
			})
		);
	});

	it('el orden no depende del orden en que llegan las tareas', () => {
		fc.assert(
			fc.property(permutedTasks, completions, instant, ([list, permutedItems], doneOnes, now) => {
				expect(pendingRows(permutedItems, doneOnes, now)).toEqual(pendingRows(list, doneOnes, now));
			})
		);
	});

	it('los grupos quedan contiguos: atrasada, pendiente, en espera', () => {
		const range = { atrasada: 0, pendiente: 1, 'en espera': 2, completada: 3, pausada: 4 };
		fc.assert(
			fc.property(tasks, completions, instant, (list, doneOnes, now) => {
				const ranges = pendingRows(list, doneOnes, now).map(({ status }) => range[status.kind]);
				expect(ranges).toEqual([...ranges].sort((a, b) => a - b));
			})
		);
	});

	it('dentro de cada grupo, del instante de urgencia más antiguo al más reciente, y sin instante al final', () => {
		fc.assert(
			fc.property(tasks, completions, instant, (list, doneOnes, now) => {
				const rows = pendingRows(list, doneOnes, now).flatMap(({ task, completed, status }) => (completed || status.kind === 'pausada' ? [] : [{ task, status }]));
				const key = ({ task, status }: (typeof rows)[number]) => urgencyInstant(task, doneOnes, status, now)?.getTime() ?? Infinity;
				for (let i = 1; i < rows.length; i++)
					if (rows[i - 1].status.kind === rows[i].status.kind) expect(key(rows[i - 1])).toBeLessThanOrEqual(key(rows[i]));
			})
		);
	});

	it('con Mostrar completadas encendido, cada tarea es una fila exactamente una vez', () => {
		fc.assert(
			fc.property(tasks, completions, instant, (list, doneOnes, now) => {
				const ids = pendingRows(list, doneOnes, now, true).map(({ task }) => task.id);
				expect([...ids].sort()).toEqual(list.map(({ id }) => id).sort());
			})
		);
	});

	it('encender Mostrar completadas solo agrega las completadas al final, sin tocar las demás', () => {
		fc.assert(
			fc.property(tasks, completions, instant, (list, doneOnes, now) => {
				const without = pendingRows(list, doneOnes, now);
				const having = pendingRows(list, doneOnes, now, true);
				expect(having.slice(0, without.length)).toEqual(without);
				expect(having.slice(without.length).every(({ completed }) => completed)).toBe(true);
			})
		);
	});

	it('las completadas van de la de completadoEn más reciente a la más antigua', () => {
		fc.assert(
			fc.property(tasks, completions, instant, (list, doneOnes, now) => {
				const lastOnes = pendingRows(list, doneOnes, now, true)
					.filter(({ completed }) => completed)
					.map(({ task }) => lastCompletedAt(completionsOfTask(doneOnes, task.id)));
				expect(lastOnes).toEqual([...lastOnes].sort((a, b) => b - a));
			})
		);
	});

	it('con Mostrar completadas encendido, el orden tampoco depende del orden en que llegan las tareas', () => {
		fc.assert(
			fc.property(permutedTasks, completions, instant, ([list, permutedItems], doneOnes, now) => {
				expect(pendingRows(permutedItems, doneOnes, now, true)).toEqual(pendingRows(list, doneOnes, now, true));
			})
		);
	});
});
