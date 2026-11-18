import { describe, expect, it } from 'vitest';
import type { Annotation } from './annotation';
import { orphanAnnotations, deletion, orphanCompletions, taskExists } from './deletion';
import type { Completion, OneOffTask } from './task';

const task = (id: string): OneOffTask => ({ id, title: id, kind: 'puntual', createdAt: new Date(2026, 6, 1) });
const completion = (id: string, taskId: string): Completion => ({ id, taskId, completedAt: new Date(2026, 6, 2) });
const annotation = (id: string, taskId?: string): Annotation => ({
	id,
	sense: 'Me sirvió',
	annotatedAt: new Date(2026, 6, 2),
	screen: 'Pendientes',
	...(taskId === undefined ? {} : { taskId })
});

describe('deletion', () => {
	it('deletes the task and all its completions, and only its own', () => {
		const completions = [completion('c1', 'regar'), completion('c2', 'pagar'), completion('c3', 'regar')];

		expect(deletion('regar', completions, [])).toStrictEqual({ taskId: 'regar', completionIds: ['c1', 'c3'], annotationIds: [] });
	});

	it('also deletes all its annotations, and only its own: not those of another task nor those without a task', () => {
		const annotations = [annotation('a1', 'regar'), annotation('a2', 'pagar'), annotation('a3'), annotation('a4', 'regar')];

		expect(deletion('regar', [], annotations).annotationIds).toStrictEqual(['a1', 'a4']);
	});

	it('a task that was never completed is deleted alone', () => {
		expect(deletion('regar', [completion('c2', 'pagar')], [])).toStrictEqual({ taskId: 'regar', completionIds: [], annotationIds: [] });
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

describe('orphanAnnotations', () => {
	it('are the annotations whose task no longer exists; those without a task are not', () => {
		const orphan = annotation('a2', 'borrada');
		const annotations = [annotation('a1', 'regar'), orphan, annotation('a3')];

		expect(orphanAnnotations([task('regar')], annotations)).toStrictEqual([orphan]);
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
