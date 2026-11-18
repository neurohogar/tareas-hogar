import { describe, expect, it } from 'vitest';
import { pendingRows } from './pending';
import type { Completion, Weekday, Task, RecurringTask } from './task';

const CREATED = new Date(2026, 6, 1);
const NOW = new Date(2026, 6, 15, 8, 0, 0);
interface Data {
	title?: string;
	createdAt?: Date;
}
const oneOff = (id: string, dueDate?: Date, { title = id, createdAt = CREATED }: Data = {}): Task => ({
	id,
	title,
	kind: 'puntual',
	createdAt,
	...(dueDate && { dueDate })
});
const relative = (id: string, { title = id, createdAt = CREATED }: Data = {}): Task => ({
	id,
	title,
	kind: 'periodica',
	recurrence: { mode: 'relativo', every: 1, unit: 'dias' },
	createdAt
});
/** Weekly created today at 07:00, before its first occurrence: waiting without completions. */
const weekly = (id: string, day: Weekday, { title = id, createdAt = new Date(2026, 6, 15, 7, 0, 0) }: Data = {}): Task => ({
	id,
	title,
	kind: 'periodica',
	recurrence: { mode: 'calendario', weekdays: [day] },
	createdAt
});
const completionOf = (taskId: string, completedAt = new Date(2026, 6, 15, 7, 0, 0)): Completion => ({ id: `c-${taskId}`, taskId, completedAt });
const ids = (tasks: Task[], completions: Completion[] = [], now = NOW) =>
	pendingRows(tasks, completions, now).map(({ task }) => task.id);
const withCompleted = (tasks: Task[], completions: Completion[] = [], now = NOW) =>
	pendingRows(tasks, completions, now, true).map(({ task, completed }) => [task.id, completed]);

describe('pendingRows (spec §6.1)', () => {
	it('gives each task that appears with its status and whether it is completed', () => {
		const waiting = relative('r');
		const overdue = oneOff('a', new Date(2026, 6, 10));
		expect(pendingRows([waiting, overdue], [completionOf('r')], NOW, true)).toEqual([
			{ task: overdue, status: { kind: 'atrasada' }, completed: false, dateText: 'Tocaba el viernes 10 · hace 5 días' },
			{ task: waiting, status: { kind: 'en espera', progress: 1 / 24 }, completed: true, dateText: 'Vuelve mañana 07:00 · en 23 horas' }
		]);
	});

	it('each row carries its date text (§6.1): «Tocaba …» if overdue, «Vuelve …» if waiting, none otherwise', () => {
		const pending = oneOff('p', NOW);
		const postponed: Task = { ...oneOff('e'), postponed: { from: NOW, to: new Date(2026, 6, 15, 9, 0, 0) } };
		const paused: Task = { ...(relative('z') as RecurringTask), paused: true };
		const texts = pendingRows([pending, postponed, paused], [], NOW, true, true).map(({ task, dateText }) => [task.id, dateText]);
		expect(texts).toEqual([
			['p', undefined],
			['e', 'Vuelve hoy 09:00 · en 1 hora'],
			['z', undefined]
		]);
	});

	it('the date text is derived from now: it updates on its own as time passes (§6.1)', () => {
		const overdue = oneOff('a', new Date(2026, 6, 14));
		const text = (now: Date) => pendingRows([overdue], [], now)[0].dateText;
		expect(text(new Date(2026, 6, 15, 23, 59, 59))).toBe('Tocaba ayer');
		expect(text(new Date(2026, 6, 16, 0, 0, 0))).toBe('Tocaba el martes 14 · hace 2 días');
	});

	describe('Mostrar completadas off (the initial value)', () => {
		it('leaves out the completed one-offs', () => {
			const notDone = oneOff('s');
			expect(pendingRows([oneOff('h'), notDone], [completionOf('h')], NOW)).toEqual([
				{ task: notDone, status: { kind: 'pendiente' }, completed: false }
			]);
		});

		it('leaves out the waiting recurring tasks with completions', () => {
			expect(ids([relative('r'), oneOff('s')], [completionOf('r')])).toEqual(['s']);
		});

		it('shows the pending recurring task with completions and the waiting weekly one without completions', () => {
			const pending = relative('r');
			expect(ids([weekly('s', 'sábado'), pending], [completionOf('r', new Date(2026, 6, 14, 7, 0, 0))])).toEqual(['r', 's']);
		});

		it('explicitly off is the same as the initial value', () => {
			expect(pendingRows([relative('r')], [completionOf('r')], NOW, false)).toEqual([]);
		});
	});

	describe('Mostrar completadas on', () => {
		it('the completed ones go after the non-completed ones, even if those are waiting', () => {
			const completed = oneOff('hecha');
			expect(withCompleted([completed, weekly('s', 'sábado')], [completionOf('hecha')])).toEqual([
				['s', false],
				['hecha', true]
			]);
		});

		it('the completed ones go from the one with the most recent completedAt to the oldest, regardless of kind', () => {
			const completions = [
				completionOf('vieja', new Date(2026, 6, 13, 9, 0, 0)),
				completionOf('r', new Date(2026, 6, 15, 7, 0, 0)),
				completionOf('nueva', new Date(2026, 6, 15, 7, 30, 0))
			];
			expect(withCompleted([oneOff('vieja'), relative('r'), oneOff('nueva')], completions)).toEqual([
				['nueva', true],
				['r', true],
				['vieja', true]
			]);
		});

		it('orders a completed one by its most recent completion', () => {
			const completions = [
				{ id: 'c1', taskId: 'dos', completedAt: new Date(2026, 6, 15, 7, 0, 0) },
				{ id: 'c2', taskId: 'dos', completedAt: new Date(2026, 6, 10, 7, 0, 0) },
				completionOf('una', new Date(2026, 6, 14, 7, 0, 0))
			];
			expect(ids([oneOff('una'), oneOff('dos')], completions, NOW)).toEqual([]);
			expect(withCompleted([oneOff('una'), oneOff('dos')], completions)).toEqual([
				['dos', true],
				['una', true]
			]);
		});

		it('if completedAt ties: oldest createdAt, then title in Spanish, then id', () => {
			const moment = new Date(2026, 6, 15, 7, 0, 0);
			const tasks = [
				oneOff('t3', undefined, { title: 'Ñandú' }),
				oneOff('t2', undefined, { title: 'Nube' }),
				oneOff('t1', undefined, { title: 'nube' }),
				oneOff('t0', undefined, { title: 'Zeta', createdAt: new Date(2020, 0, 1) })
			];
			const completions = tasks.map(({ id }) => ({ id: `c-${id}`, taskId: id, completedAt: moment }));
			expect(withCompleted(tasks, completions).map(([id]) => id)).toEqual(['t0', 't1', 't2', 't3']);
		});
	});

	it('without tasks there are no rows', () => {
		expect(pendingRows([], [], NOW)).toEqual([]);
	});

	it('does not modify the received list', () => {
		const tasks = [relative('r'), oneOff('a', new Date(2026, 6, 10))];
		const copy = [...tasks];
		pendingRows(tasks, [completionOf('r')], NOW);
		expect(tasks).toEqual(copy);
	});

	describe('order by urgency', () => {
		it('groups overdue, pending and waiting, in that order', () => {
			const waiting = weekly('espera', 'sábado');
			const pending = oneOff('pendiente', new Date(2026, 6, 15));
			const overdue = oneOff('atrasada', new Date(2026, 6, 14));
			expect(ids([waiting, pending, overdue])).toEqual(['atrasada', 'pendiente', 'espera']);
		});

		it('the group rules even if the instant of another group is earlier', () => {
			// The relative one is overdue only from 07:00 today; the one-off, pending from 00:00.
			const overdueRelative = relative('r');
			const pending = oneOff('p', new Date(2026, 6, 15));
			expect(ids([pending, overdueRelative], [completionOf('r', new Date(2026, 6, 13, 7, 0, 0))])).toEqual(['r', 'p']);
		});

		it('overdue: first the one that has been overdue longest', () => {
			// One-off overdue since the 12th at 00:00; relative since the 11th at 20:00 (V + interval).
			const p = oneOff('p', new Date(2026, 6, 11));
			const r = relative('r');
			expect(ids([p, r], [completionOf('r', new Date(2026, 6, 9, 20, 0, 0))])).toEqual(['r', 'p']);
			expect(ids([p, r], [completionOf('r', new Date(2026, 6, 10, 0, 0, 1))])).toEqual(['p', 'r']);
		});

		it('pending: first the one that has been pending since earlier', () => {
			const p = oneOff('p', new Date(2026, 6, 15));
			const r = relative('r');
			// V = the 15th at 00:00:01, after the due date.
			expect(ids([r, p], [completionOf('r', new Date(2026, 6, 14, 0, 0, 1))])).toEqual(['p', 'r']);
			// V = the 14th at 23:59:59, before.
			expect(ids([p, r], [completionOf('r', new Date(2026, 6, 13, 23, 59, 59))])).toEqual(['r', 'p']);
		});

		it('waiting: first the one that returns earlier', () => {
			const soon = weekly('pronto', 'jueves', { createdAt: new Date(2026, 6, 15, 7, 30, 0) });
			const afternoon = weekly('tarde', 'sábado');
			expect(ids([afternoon, soon])).toEqual(['pronto', 'tarde']);
		});

		it('one-offs without a due date go at the end of the pending group, by createdAt', () => {
			const old = oneOff('vieja', undefined, { createdAt: new Date(2020, 0, 1) });
			const newLabel = oneOff('nueva', undefined, { createdAt: new Date(2020, 0, 2) });
			const withDate = oneOff('conFecha', new Date(2026, 11, 31));
			const waiting = weekly('espera', 'sábado');
			expect(ids([newLabel, waiting, old, withDate])).toEqual(['conFecha', 'vieja', 'nueva', 'espera']);
		});

		it('if the instant ties, first the one with the oldest createdAt', () => {
			const limit = new Date(2026, 6, 20);
			const before = oneOff('b', limit, { title: 'Zeta', createdAt: new Date(2026, 6, 1, 8, 0, 0) });
			const after = oneOff('a', limit, { title: 'Alfa', createdAt: new Date(2026, 6, 1, 8, 0, 1) });
			expect(ids([after, before])).toEqual(['b', 'a']);
		});

		it('if createdAt also ties, by title in Spanish alphabetical order', () => {
			const cloud = oneOff('z', undefined, { title: 'Nube' });
			const rhea = oneOff('a', undefined, { title: 'Ñandú' });
			expect(ids([rhea, cloud])).toEqual(['z', 'a']);
		});

		it('if the title also ties, by id', () => {
			const second = oneOff('t2', undefined, { title: 'Barrer' });
			const first = oneOff('t1', undefined, { title: 'barrer' });
			expect(ids([second, first])).toEqual(['t1', 't2']);
			expect(ids([first, second])).toEqual(['t1', 't2']);
		});
	});
});

describe('pendingRows with paused and resumed tasks (spec §5.8, §6.1)', () => {
	const paused = (task: Task): Task => ({ ...task, paused: true }) as Task;
	const withPaused = (tasks: Task[], completions: Completion[] = [], showCompleted = false) =>
		pendingRows(tasks, completions, NOW, showCompleted, true).map(({ task, status }) => [task.id, status.kind]);

	it('without Mostrar pausadas, the paused ones are not seen', () => {
		expect(ids([paused(relative('p')), relative('r')])).toEqual(['r']);
		expect(pendingRows([paused(relative('p'))], [], NOW, true).map(({ task }) => task.id)).toEqual([]);
	});

	it('with Mostrar pausadas, they go at the end by title, regardless of urgency or createdAt, without status and not completed', () => {
		const tasks = [
			paused(relative('b', { title: 'Ñandú' })),
			paused(relative('a', { title: 'Árbol', createdAt: new Date(2026, 6, 10) })),
			paused(relative('c', { title: 'nube' })),
			oneOff('x', new Date(2026, 6, 10))
		];

		expect(withPaused(tasks)).toEqual([
			['x', 'atrasada'],
			['a', 'pausada'],
			['c', 'pausada'],
			['b', 'pausada']
		]);
		expect(pendingRows(tasks, [], NOW, false, true).at(-1)).toEqual({ task: tasks[0], status: { kind: 'pausada' }, completed: false });
	});

	it('the paused ones go after the completed ones', () => {
		expect(withPaused([paused(relative('p')), relative('r')], [completionOf('r'), completionOf('p')], true)).toEqual([
			['r', 'en espera'],
			['p', 'pausada']
		]);
	});

	it('a resumed calendar task waiting, with completions only from before resuming, is not completed', () => {
		const resumed = { ...weekly('s', 'jueves'), resumedAt: new Date(2026, 6, 15, 7, 30, 0) } as Task;

		expect(withCompleted([resumed], [completionOf('s')])).toEqual([['s', false]]);
	});

	it('a resumed relative task is pending since resumedAt; if it ties, its real createdAt breaks the tie', () => {
		const resumedAt = new Date(2026, 6, 10);
		const resumed = { ...relative('z', { createdAt: new Date(2026, 5, 1) }), resumedAt } as Task;
		const previous = relative('m', { createdAt: new Date(2026, 6, 5) });
		const ties = relative('a', { createdAt: resumedAt });

		expect(ids([resumed, previous])).toEqual(['m', 'z']);
		expect(ids([ties, resumed])).toEqual(['z', 'a']);
	});
});

describe('pendingRows with postponed tasks (spec §5.9, §6.1)', () => {
	const FROM = new Date(2026, 6, 15, 7, 30, 0);
	const postponedUntil = (to: Date) => ({ postponed: { from: FROM, to } });

	it('a postponed task with a completion from today is seen with Mostrar completadas off', () => {
		const task: Task = {
			id: 'r',
			title: 'r',
			kind: 'periodica',
			recurrence: { mode: 'relativo', every: 4, unit: 'horas' },
			createdAt: CREATED,
			...postponedUntil(new Date(2026, 6, 15, 10, 0, 0))
		};
		const ofToday: Completion = { id: 'c', taskId: 'r', completedAt: new Date(2026, 6, 15, 3, 0, 0) };

		expect(pendingRows([task], [ofToday], NOW).map(({ completed }) => completed)).toStrictEqual([false]);
	});

	it('the postponed ones go in the waiting group, ordered by to', () => {
		const afternoon = { ...oneOff('tarde'), ...postponedUntil(new Date(2026, 6, 15, 12, 0, 0)) };
		const early = { ...oneOff('temprano', new Date(2026, 6, 10)), ...postponedUntil(new Date(2026, 6, 15, 9, 0, 0)) };
		const titles = pendingRows([afternoon, early, oneOff('libre')], [], NOW).map(({ task }) => task.title);

		expect(titles).toStrictEqual(['libre', 'temprano', 'tarde']);
	});
});
