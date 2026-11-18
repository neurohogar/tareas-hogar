import { describe, expect, it } from 'vitest';
import { history, type HistoryGroup } from './history';
import type { Completion, Task } from './task';

const task = (id: string, title = id): Task => ({ id, title, kind: 'puntual', createdAt: new Date(2026, 0, 1) });
const completion = (id: string, taskId: string, completedAt: Date): Completion => ({ id, taskId, completedAt });

const now = new Date(2026, 6, 15, 12, 0, 0);

/** "Hoy: Pagar 10:00, Regar 08:05; Ayer: ..." */
function inText(groups: HistoryGroup[]): string {
	return groups
		.map(({ header, entries }) => `${header}: ${entries.map(({ task, hour }) => `${task.title} ${hour}`).join(', ')}`)
		.join('; ');
}

describe('history', () => {
	it('without completions it has no groups', () => {
		expect(history([task('regar')], [], now)).toEqual([]);
	});

	it('goes from most recent to oldest and groups by local day, even if completed in another order', () => {
		const completions = [
			completion('c1', 'regar', new Date(2026, 6, 15, 8, 5)),
			completion('c2', 'pagar', new Date(2026, 6, 15, 10, 0)),
			completion('c3', 'regar', new Date(2026, 6, 13, 9, 0)),
			completion('c4', 'basura', new Date(2026, 6, 14, 21, 30))
		];

		expect(inText(history([task('regar'), task('basura'), task('pagar')], completions, now))).toBe(
			'Hoy: pagar 10:00, regar 08:05; Ayer: basura 21:30; lunes 13 de julio: regar 09:00'
		);
	});

	it('with the same completedAt the lower id goes first', () => {
		const moment = new Date(2026, 6, 15, 10, 0);
		const tasks = [task('regar'), task('pagar')];

		expect(inText(history(tasks, [completion('c2', 'regar', moment), completion('c1', 'pagar', moment)], now))).toBe(
			'Hoy: pagar 10:00, regar 10:00'
		);
		expect(inText(history(tasks, [completion('c1', 'regar', moment), completion('c2', 'pagar', moment)], now))).toBe(
			'Hoy: regar 10:00, pagar 10:00'
		);
	});

	it('each entry carries its completion and the current task (with its current title)', () => {
		const watered = completion('c1', 'regar', new Date(2026, 6, 15, 8, 0));
		const renamed = task('regar', 'Plantas');

		expect(history([renamed], [watered], now)).toStrictEqual([
			{ header: 'Hoy', entries: [{ completion: watered, task: renamed, hour: '08:00', timeText: '08:00' }] }
		]);
	});

	it('does not show the completions of tasks that do not exist (deleted or orphans)', () => {
		const completions = [
			completion('c1', 'borrada', new Date(2026, 6, 15, 9, 0)),
			completion('c2', 'pagar', new Date(2026, 6, 15, 8, 0))
		];

		expect(inText(history([task('pagar')], completions, now))).toBe('Hoy: pagar 08:00');
	});

	it('the headers depend on now: the same day goes from "Hoy" to "Ayer" and then to the date', () => {
		const completions = [completion('c1', 'regar', new Date(2026, 6, 14, 23, 59, 59))];
		const tasks = [task('regar')];

		expect(inText(history(tasks, completions, new Date(2026, 6, 14, 23, 59, 59)))).toBe('Hoy: regar 23:59');
		expect(inText(history(tasks, completions, now))).toBe('Ayer: regar 23:59');
		expect(inText(history(tasks, completions, new Date(2026, 6, 16)))).toBe('martes 14 de julio: regar 23:59');
	});
});
