import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { classifyInPending, isCompleted } from './completed';
import { completionsOfTask } from './completions';
import { taskStatus } from './task-status';
import { activePostponement } from './active-postponement';
import type { Completion, Task } from './task';

const instant = fc.integer({ min: 0, max: 4_000_000_000_000 }).map((ms) => new Date(ms));
const postponement = fc
	.tuple(instant, fc.integer({ min: 1, max: 100_000_000 }))
	.map(([from, duration]) => ({ from, to: new Date(from.getTime() + duration) }));
/** Puntual o periódica relativa, con o sin posposición, pausada o no. */
const task = fc
	.tuple(
		fc.boolean(),
		instant,
		fc.option(instant, { nil: undefined }),
		fc.integer({ min: 1, max: 100 }),
		fc.constantFrom('horas' as const, 'dias' as const),
		fc.option(postponement, { nil: undefined }),
		fc.boolean()
	)
	.map(([isOneOff, createdAt, dueDate, every, unit, postponed, paused]): Task => {
		const common = { id: 't', title: 'T', createdAt, ...(postponed && { postponed }) };
		if (isOneOff) return { ...common, kind: 'puntual', ...(dueDate && { dueDate }) };
		return { ...common, kind: 'periodica', recurrence: { mode: 'relativo', every, unit }, ...(paused && { paused }) };
	});
const completions = fc.array(
	fc.record({ id: fc.uuid(), taskId: fc.constantFrom('t', 'otra'), completedAt: instant }) as fc.Arbitrary<Completion>,
	{ maxLength: 5 }
);

describe('clasificarEnPendientes (propiedades)', () => {
	it('conserva el estado de la tarea y coincide con estaCompletada', () => {
		fc.assert(
			fc.property(task, completions, instant, (t, cs, now) => {
				const classified = classifyInPending(t, cs, now);
				expect(classified.status).toEqual(taskStatus(t, cs, now));
				expect(classified.completed).toBe(isCompleted(t, cs, now));
			})
		);
	});

	it('una tarea sin completados propios nunca está completada', () => {
		fc.assert(
			fc.property(task, completions, instant, (t, cs, now) => {
				fc.pre(completionsOfTask(cs, t.id).length === 0);
				expect(isCompleted(t, cs, now)).toBe(false);
			})
		);
	});

	it('una pendiente o atrasada nunca está completada', () => {
		fc.assert(
			fc.property(task, completions, instant, (t, cs, now) => {
				const { kind } = taskStatus(t, cs, now);
				fc.pre(kind === 'pendiente' || kind === 'atrasada');
				expect(isCompleted(t, cs, now)).toBe(false);
			})
		);
	});

	it('una puntual con completados está completada, esté o no pospuesta (§5.1)', () => {
		fc.assert(
			fc.property(task, completions, instant, (t, cs, now) => {
				fc.pre(t.kind === 'puntual' && completionsOfTask(cs, t.id).length > 0);
				expect(isCompleted(t, cs, now)).toBe(true);
			})
		);
	});

	it('una pospuesta vigente cuya regla propia es pendiente o atrasada no está completada (§5.9)', () => {
		fc.assert(
			fc.property(task, completions, instant, (t, cs, now) => {
				fc.pre(activePostponement(t, now) !== undefined);
				const { postponed: _, ...withoutPostponement } = t;
				const { kind } = taskStatus(withoutPostponement, cs, now);
				fc.pre(kind === 'pendiente' || kind === 'atrasada');
				expect(isCompleted(t, cs, now)).toBe(false);
			})
		);
	});

	it('una pausada nunca está completada (§5.8)', () => {
		fc.assert(
			fc.property(task, completions, instant, (t, cs, now) => {
				fc.pre(t.kind === 'periodica' && t.paused === true);
				expect(isCompleted(t, cs, now)).toBe(false);
			})
		);
	});
});
