import { describe, expect, it } from 'vitest';
import { deletion, orphanCompletions, taskExists } from './deletion';
import type { Completion, OneOffTask } from './task';

const task = (id: string): OneOffTask => ({ id, title: id, kind: 'puntual', createdAt: new Date(2026, 6, 1) });
const completion = (id: string, taskId: string): Completion => ({ id, taskId, completedAt: new Date(2026, 6, 2) });

describe('deletion', () => {
	it('deletes the task and all its completions, and only its own: nothing else', () => {
		const completions = [completion('c1', 'regar'), completion('c2', 'pagar'), completion('c3', 'regar')];

		expect(deletion('regar', completions)).toStrictEqual({ taskId: 'regar', completionIds: ['c1', 'c3'] });
	});

	it('a task that was never completed is deleted alone', () => {
		expect(deletion('regar', [completion('c2', 'pagar')])).toStrictEqual({ taskId: 'regar', completionIds: [] });
	});
});

describe('orphanCompletions', () => {
	it('are the completions whose task no longer exists', () => {
		const orphanOne = completion('c2', 'borrada');
		const completions = [completion('c1', 'regar'), orphanOne, completion('c3', 'pagar')];

		expect(orphanCompletions([task('regar'), task('pagar')], completions)).toStrictEqual([orphanOne]);
	});

	it('without tasks, all the completions are orphans', () => {
		const completions = [completion('c1', 'regar')];

		expect(orphanCompletions([], completions)).toStrictEqual(completions);
	});
});

describe('taskExists', () => {
	it('exists if some task has that id', () => {
		expect(taskExists([task('pagar'), task('regar')], 'regar')).toBe(true);
	});

	it('no longer exists if none has it', () => {
		expect(taskExists([task('pagar')], 'regar')).toBe(false);
	});
});
