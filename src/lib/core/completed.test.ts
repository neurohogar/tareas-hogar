import { describe, expect, it } from 'vitest';
import { classifyInPending, isCompleted } from './completed';
import type { Completion, Task } from './task';

const NOW = new Date(2026, 6, 15, 12, 0, 0);
const ONE_COMPLETION: Completion[] = [{ id: 'c', taskId: 't', completedAt: new Date(2026, 6, 15, 8, 0, 0) }];

const oneOff: Task = { id: 't', title: 'T', kind: 'puntual', createdAt: new Date(2026, 6, 1) };
const recurring: Task = { id: 't', title: 'T', kind: 'periodica', recurrence: { mode: 'relativo', every: 1, unit: 'dias' }, createdAt: new Date(2026, 6, 1) };
const postponed = (task: Task): Task => ({ ...task, postponed: { from: new Date(2026, 6, 15, 11, 0, 0), to: new Date(2026, 6, 15, 14, 0, 0) } });

describe('isCompleted (spec §6.1)', () => {
	it('a one-off with completions is completed', () => {
		expect(isCompleted(oneOff, ONE_COMPLETION, NOW)).toBe(true);
	});

	it('a waiting recurring task with completions is completed', () => {
		expect(isCompleted(recurring, ONE_COMPLETION, NOW)).toBe(true);
	});

	it('a waiting recurring task without completions (before its first occurrence) is not completed', () => {
		const future = { ...recurring, createdAt: new Date(2026, 6, 20) };

		expect(isCompleted(future, [], NOW)).toBe(false);
	});

	it('a pending or overdue task is not completed even if it has completions', () => {
		const old = { ...recurring, createdAt: new Date(2026, 5, 1) };

		expect(isCompleted(oneOff, [], NOW)).toBe(false);
		expect(isCompleted(old, [{ ...ONE_COMPLETION[0], completedAt: new Date(2026, 5, 2) }], NOW)).toBe(false);
	});

	it('a paused one is not completed (spec §5.8)', () => {
		expect(isCompleted({ ...recurring, paused: true }, ONE_COMPLETION, NOW)).toBe(false);
	});
});

describe('classifyInPending', () => {
	it('keeps the status of a non-completed one to order it by urgency', () => {
		expect(classifyInPending(oneOff, [], NOW)).toEqual({ completed: false, status: { kind: 'pendiente' } });
	});

	it('marks the completed one with its status', () => {
		expect(classifyInPending(oneOff, ONE_COMPLETION, NOW)).toEqual({ completed: true, status: { kind: 'completada' } });
	});
});

describe('a postponed one is not completed (spec §5.9)', () => {
	it('a completed one-off stays completed even if postponed', () => {
		expect(isCompleted(postponed(oneOff), ONE_COMPLETION, NOW)).toBe(true);
	});

	it('waiting because of the postponement, with completions, is not completed', () => {
		const classified = classifyInPending(postponed({ ...recurring, createdAt: new Date(2026, 5, 1) }), [{ ...ONE_COMPLETION[0], completedAt: new Date(2026, 5, 2) }], NOW);

		expect(classified.completed).toBe(false);
		expect(classified.status.kind).toBe('en espera');
	});

	it('a recurring task waiting by its own rule, with completions, stays completed even if the postponement already expired', () => {
		const expired = { ...recurring, postponed: { from: new Date(2026, 6, 15, 6, 0, 0), to: new Date(2026, 6, 15, 7, 0, 0) } };

		expect(isCompleted(expired, ONE_COMPLETION, NOW)).toBe(true);
	});
});
