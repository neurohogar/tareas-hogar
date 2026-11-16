import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { Status } from './status';
import { taskStatus } from './task-status';
import { WEEKDAYS, type Completion, type Task } from './task';
import { urgencyInstant } from './urgency';

const instant = fc.integer({ min: 0, max: 4_102_444_800_000 }).map((ms) => new Date(ms));
const day = fc.integer({ min: 0, max: 47_000 }).map((n) => new Date(1970, 0, 1 + n));
const recurrence = fc.oneof(
	fc.record({ mode: fc.constant('relativo' as const), every: fc.integer({ min: 1, max: 1000 }), unit: fc.constantFrom('horas' as const, 'dias' as const) }),
	fc.record({
		mode: fc.constant('calendario' as const),
		monthDays: fc.uniqueArray(fc.integer({ min: 1, max: 31 }), { minLength: 1, maxLength: 3 }).map((d) => d.sort((a, b) => a - b))
	}),
	fc.record({
		mode: fc.constant('calendario' as const),
		weekdays: fc.subarray([...WEEKDAYS], { minLength: 1 })
	})
);
const task = fc.tuple(fc.option(day, { nil: undefined }), fc.option(recurrence, { nil: undefined }), day).map(
	([dueDate, recurrence, createdAt]): Task => {
		const common = { id: 't', title: 'T', createdAt };
		if (recurrence) return { ...common, kind: 'periodica', recurrence };
		return { ...common, kind: 'puntual', ...(dueDate && { dueDate }) };
	}
);
const completions = fc
	.array(fc.tuple(instant, fc.option(day, { nil: undefined })), { maxLength: 4 })
	.map((list) =>
		list.map(([completedAt, coveredOccurrence], i): Completion => ({ id: `c${i}`, taskId: 't', completedAt, ...(coveredOccurrence && { coveredOccurrence }) }))
	);

/** El estado justo antes del instante de urgencia y en él (spec §6.1: "desde cuándo", "cuándo vuelve"). */
const transition = (t: Task, cs: readonly Completion[], moment: Date): [Status['kind'], Status['kind']] => [
	taskStatus(t, cs, new Date(moment.getTime() - 1)).kind,
	taskStatus(t, cs, moment).kind
];

describe('instanteDeUrgencia (propiedades)', () => {
	it('es el momento en que la tarea entró en su estado (atrasada, pendiente) o en que sale de la espera', () => {
		fc.assert(
			fc.property(task, completions, instant, (t, cs, now) => {
				const status = taskStatus(t, cs, now);
				if (status.kind === 'completada' || status.kind === 'pausada') return;
				const moment = urgencyInstant(t, cs, status, now);
				// Una puntual pendiente cuenta desde su fecha límite (o no tiene instante) y una relativa nunca completada desde creadaEn: no son transiciones.
				const withoutTransition = status.kind === 'pendiente' && (t.kind === 'puntual' || (t.recurrence.mode === 'relativo' && cs.length === 0));
				if (withoutTransition || moment === undefined) return;
				if (status.kind === 'en espera') {
					expect(moment.getTime()).toBeGreaterThan(now.getTime());
					expect(transition(t, cs, moment)).toEqual(['en espera', 'pendiente']);
				} else {
					expect(moment.getTime()).toBeLessThanOrEqual(now.getTime());
					expect(transition(t, cs, moment)).toEqual([status.kind === 'atrasada' ? 'pendiente' : 'en espera', status.kind]);
				}
			})
		);
	});

	it('una puntual pendiente cuenta desde su fecha límite y, sin ella, no tiene instante', () => {
		fc.assert(
			fc.property(task, instant, (t, now) => {
				fc.pre(t.kind === 'puntual');
				const status = taskStatus(t, [], now);
				fc.pre(status.kind === 'pendiente');
				expect(urgencyInstant(t, [], status, now)).toEqual(t.kind === 'puntual' ? t.dueDate : undefined);
			})
		);
	});
});
