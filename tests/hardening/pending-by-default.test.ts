import { describe, expect, it } from 'vitest';
import { pendingRows } from '../../src/lib/core/pending';
import type { Task } from '../../src/lib/core/task';

const NOW = new Date(2026, 6, 15, 8, 0, 0);
const oneOff = (id: string, extra: object = {}): Task =>
	({ id, title: id, kind: 'puntual', createdAt: new Date(2026, 6, 1), ...extra }) as Task;

describe('pendingRows: by default it shows neither completed nor paused', () => {
	it('without the flags, only the pending task appears', () => {
		const tasks = [oneOff('a'), oneOff('c'), { ...oneOff('p'), kind: 'periodica', recurrence: { mode: 'relativo', every: 1, unit: 'dias' }, paused: true } as Task];
		const completions = [{ id: 'x', taskId: 'c', completedAt: new Date(2026, 6, 14) }];
		expect(pendingRows(tasks, completions, NOW).map(({ task }) => task.id)).toEqual(['a']);
	});
});
