import { describe, expect, it } from 'vitest';
import { minimalModeOn, resumesOnTurningOff } from './minimal-mode';
import { isPaused, pausedByMinimalMode, pauseAction, pauseText } from './pause';
import { taskStatus, waitForPostponement } from './task-status';
import { checkboxAction, checkboxEnabled } from './checkbox';
import { postponeAction } from './postponement-in-panel';
import { pendingRows } from './pending';
import { edit } from './editing';
import { taskData } from './task-data';
import { applyChange, taskFromDocument, type TaskDocument } from './task-document';
import { loadingScreenLeaves, type WaitStatus } from './loading-screen';
import type { Completion, OneOffTask, RecurringTask, Task } from './task';

const CREATED = new Date(2026, 6, 1, 8, 0, 0);
const NOW = new Date(2026, 6, 15, 12, 0, 0);
const OFF = new Date(2026, 6, 20, 10, 0, 0);
const RELATIVE: RecurringTask = { id: 'r', title: 'Regar', kind: 'periodica', recurrence: { mode: 'relativo', every: 2, unit: 'dias' }, createdAt: CREATED };
const CALENDAR: RecurringTask = { id: 'k', title: 'Basura', kind: 'periodica', recurrence: { mode: 'calendario', weekdays: ['martes', 'jueves'] }, createdAt: CREATED };
const ONE_OFF: OneOffTask = { id: 'p', title: 'Pagar', kind: 'puntual', dueDate: new Date(2026, 6, 14), createdAt: CREATED };
const ESSENTIAL: RecurringTask = { ...RELATIVE, essential: true };
const BY_HAND: RecurringTask = { ...RELATIVE, paused: true };
/** Completed long ago: without the mode, overdue. */
const OVERDUE: Completion[] = [{ id: 'c', taskId: 'r', completedAt: new Date(2026, 6, 1, 9, 0, 0) }];
const POSTPONED: RecurringTask = { ...RELATIVE, postponed: { from: new Date(2026, 6, 15, 11, 0, 0), to: new Date(2026, 6, 15, 13, 0, 0) } };

describe('the state of the mode (spec §5.8, §7)', () => {
	it('without the document the mode is off; otherwise it is its active field', () => {
		expect(minimalModeOn(undefined)).toBe(false);
		expect(minimalModeOn({ active: false })).toBe(false);
		expect(minimalModeOn({ active: true })).toBe(true);
	});
});

describe('paused by the minimal mode (spec §5.8)', () => {
	it('with the mode on, a non-essential recurring task is paused by the mode, of any recurrence', () => {
		expect(pausedByMinimalMode(RELATIVE, true)).toBe(true);
		expect(pausedByMinimalMode(CALENDAR, true)).toBe(true);
		expect(isPaused(RELATIVE, true)).toBe(true);
	});

	it('never with the mode off, never an essential one and never a one-off', () => {
		expect(pausedByMinimalMode(RELATIVE, false)).toBe(false);
		expect(pausedByMinimalMode(ESSENTIAL, true)).toBe(false);
		expect(pausedByMinimalMode(ONE_OFF, true)).toBe(false);
		expect(isPaused(ONE_OFF, true)).toBe(false);
		expect(isPaused(RELATIVE, false)).toBe(false);
		expect(isPaused(RELATIVE)).toBe(false);
	});

	it('it does not depend on the manual pause: paused by hand and by the mode is paused by both', () => {
		expect(pausedByMinimalMode(BY_HAND, true)).toBe(true);
		expect(isPaused({ ...ESSENTIAL, paused: true }, true)).toBe(true);
	});

	it('a paused task by the mode has no status and its checkbox is disabled', () => {
		expect(taskStatus(RELATIVE, OVERDUE, NOW, true)).toStrictEqual({ kind: 'pausada' });
		expect(checkboxAction(RELATIVE, OVERDUE, NOW, true)).toStrictEqual({ kind: 'none' });
		expect(checkboxEnabled(RELATIVE, OVERDUE, NOW, true)).toBe(false);
	});

	it('an essential task, and a non-essential one-off, keep their status and checkbox', () => {
		expect(taskStatus(ESSENTIAL, OVERDUE, NOW, true)).toStrictEqual({ kind: 'atrasada' });
		expect(checkboxEnabled(ESSENTIAL, OVERDUE, NOW, true)).toBe(true);
		expect(taskStatus(ONE_OFF, [], NOW, true)).toStrictEqual({ kind: 'atrasada' });
		expect(checkboxEnabled(ONE_OFF, [], NOW, true)).toBe(true);
	});

	it('the mode off leaves the status as without it', () => {
		expect(taskStatus(RELATIVE, OVERDUE, NOW, false)).toStrictEqual({ kind: 'atrasada' });
		expect(checkboxEnabled(RELATIVE, OVERDUE, NOW, false)).toBe(true);
	});
});

describe('postponement and the mode (spec §5.9, §6.2)', () => {
	it('a task paused by the mode keeps its postponement but cannot be postponed and has no Quitar posponer', () => {
		expect(postponeAction(RELATIVE, OVERDUE, NOW, true)).toBeUndefined();
		expect(postponeAction(POSTPONED, OVERDUE, NOW, true)).toBeUndefined();
		expect(waitForPostponement(POSTPONED, OVERDUE, NOW, true)).toBeUndefined();
		expect(postponeAction({ ...BY_HAND, postponed: POSTPONED.postponed }, OVERDUE, NOW, true)).toBeUndefined();
	});

	it('an essential one is postponed as with the mode off', () => {
		expect(postponeAction(ESSENTIAL, OVERDUE, NOW, true)).toBe('posponer');
		expect(postponeAction({ ...POSTPONED, essential: true }, OVERDUE, NOW, true)).toBe('quitar');
		expect(waitForPostponement({ ...POSTPONED, essential: true }, OVERDUE, NOW, true)).toStrictEqual(POSTPONED.postponed);
	});

	it('the mode off changes nothing', () => {
		expect(postponeAction(POSTPONED, OVERDUE, NOW)).toBe('quitar');
		expect(postponeAction(RELATIVE, OVERDUE, NOW, false)).toBe('posponer');
	});
});

describe('the panel with the mode on (spec §6.2)', () => {
	it('non-essential not paused by hand: «Pausada por el modo mínimo», neither Pausar nor Reanudar', () => {
		expect(pauseText(RELATIVE, true)).toBe('Pausada por el modo mínimo');
		expect(pauseAction(RELATIVE, true)).toBeUndefined();
	});

	it('non-essential paused by hand: «Pausada» and Reanudar', () => {
		expect(pauseText(BY_HAND, true)).toBe('Pausada');
		expect(pauseAction(BY_HAND, true)).toBe('reanudar');
	});

	it('an essential task, a one-off and the mode off: the usual panel', () => {
		expect(pauseText(ESSENTIAL, true)).toBeUndefined();
		expect(pauseAction(ESSENTIAL, true)).toBe('pausar');
		expect(pauseText({ ...ESSENTIAL, paused: true }, true)).toBe('Pausada');
		expect(pauseAction({ ...ESSENTIAL, paused: true }, true)).toBe('reanudar');
		expect(pauseText(ONE_OFF, true)).toBeUndefined();
		expect(pauseAction(ONE_OFF, true)).toBeUndefined();
		expect(pauseText(RELATIVE, false)).toBeUndefined();
		expect(pauseText(BY_HAND)).toBe('Pausada');
		expect(pauseAction(RELATIVE, false)).toBe('pausar');
	});
});

describe('the rows of Pendientes with the mode on (spec §6.1)', () => {
	const titles = (rows: ReturnType<typeof pendingRows>) => rows.map(({ task }) => task.title);
	const focus: OneOffTask = { id: 'f', title: 'Foco', kind: 'puntual', createdAt: CREATED, essential: true };
	const dinner: OneOffTask = { id: 'd', title: 'Cena', kind: 'puntual', createdAt: CREATED };
	const pay: OneOffTask = { ...ONE_OFF, essential: true };

	it('only the essential tasks, in the same order as with the mode off', () => {
		expect(titles(pendingRows([focus, dinner, pay], [], NOW))).toStrictEqual(['Pagar', 'Cena', 'Foco']);
		expect(titles(pendingRows([focus, dinner, pay], [], NOW, false, false, true))).toStrictEqual(['Pagar', 'Foco']);
	});

	it('the non-essential ones are out of view even with Mostrar completadas and Mostrar pausadas', () => {
		const done: Completion[] = [
			{ id: 'c1', taskId: 'd', completedAt: new Date(2026, 6, 15, 9, 0, 0) },
			{ id: 'c2', taskId: 'r', completedAt: new Date(2026, 6, 15, 8, 0, 0) },
			{ id: 'c3', taskId: 'e', completedAt: new Date(2026, 6, 15, 8, 0, 0) }
		];
		const sweep: RecurringTask = { ...RELATIVE, id: 'e', title: 'Barrer', essential: true };
		const water: RecurringTask = { ...RELATIVE, id: 'w', title: 'Agua', essential: true, paused: true };
		const trash: RecurringTask = { ...RELATIVE, id: 't', title: 'Basura', paused: true };
		const tasks: Task[] = [focus, dinner, sweep, RELATIVE, water, trash];
		const rows = pendingRows(tasks, done, NOW, true, true, true);
		expect(titles(rows)).toStrictEqual(['Foco', 'Barrer', 'Agua']);
		expect(rows.map(({ status }) => status.kind)).toStrictEqual(['pendiente', 'en espera', 'pausada']);
	});

	it('an essential task paused by hand is shown only with Mostrar pausadas', () => {
		const water: RecurringTask = { ...ESSENTIAL, paused: true };
		expect(titles(pendingRows([focus, water], [], NOW, false, false, true))).toStrictEqual(['Foco']);
	});

	it('with no essential task, the list is empty', () => {
		expect(pendingRows([dinner, RELATIVE], [], NOW, true, true, true)).toStrictEqual([]);
	});
});

describe('turning the mode off (spec §5.8, §7)', () => {
	it('resumes at that moment every non-essential recurring task not paused by hand, and only writes resumedAt', () => {
		const tasks: Task[] = [RELATIVE, CALENDAR, ESSENTIAL, BY_HAND, ONE_OFF, { ...ONE_OFF, id: 'q', essential: true }];
		expect(resumesOnTurningOff(tasks, OFF)).toStrictEqual([
			{ taskId: 'r', change: { resumedAt: OFF } },
			{ taskId: 'k', change: { resumedAt: OFF } }
		]);
	});

	it('nothing for essential tasks, tasks paused by hand or one-off tasks', () => {
		expect(resumesOnTurningOff([ESSENTIAL, BY_HAND, { ...ESSENTIAL, paused: true }, ONE_OFF], OFF)).toStrictEqual([]);
	});

	it('a relative task comes back pending, not overdue, as just created at that moment', () => {
		const doc: TaskDocument = { ...RELATIVE };
		const [{ change }] = resumesOnTurningOff([RELATIVE], OFF);
		const back = taskFromDocument(applyChange([doc], 'r', change)[0]);
		const doneBefore: Completion[] = [{ id: 'c', taskId: 'r', completedAt: new Date(2026, 6, 19, 9, 0, 0) }];
		expect(taskStatus(back, OVERDUE, OFF)).toStrictEqual({ kind: 'pendiente' });
		expect(taskStatus(back, doneBefore, OFF)).toStrictEqual({ kind: 'pendiente' });
	});

	it('a calendar task comes back pending on one of its days and waiting otherwise', () => {
		const thursday = new Date(2026, 6, 16, 10, 0, 0);
		const wednesday = new Date(2026, 6, 15, 10, 0, 0);
		const back = (now: Date) => taskFromDocument(applyChange([{ ...CALENDAR }], 'k', resumesOnTurningOff([CALENDAR], now)[0].change)[0]);
		expect(taskStatus(back(thursday), [], thursday)).toStrictEqual({ kind: 'pendiente' });
		expect(taskStatus(back(wednesday), [], wednesday).kind).toBe('en espera');
	});

	it('at the very moment of turning it off a relative task in hours is pending', () => {
		const hourly: RecurringTask = { ...RELATIVE, recurrence: { mode: 'relativo', every: 3, unit: 'horas' } };
		const back = taskFromDocument(applyChange([{ ...hourly }], 'r', resumesOnTurningOff([hourly], OFF)[0].change)[0]);
		expect(taskStatus(back, OVERDUE, OFF)).toStrictEqual({ kind: 'pendiente' });
	});
});

describe('editing with the mode on (spec §5.8)', () => {
	it('marking a non-essential recurring task essential resumes it at the moment of saving, without touching paused', () => {
		expect(edit(RELATIVE, { ...taskData(RELATIVE), essential: true }, NOW, true)).toStrictEqual({ ok: true, change: { essential: true, resumedAt: NOW } });
	});

	it('if it is also paused by hand, marking it essential leaves it paused, without resumedAt', () => {
		expect(edit(BY_HAND, { ...taskData(BY_HAND), essential: true }, NOW, true)).toStrictEqual({ ok: true, change: { essential: true } });
	});

	it('with the mode off, marking essential does not resume', () => {
		expect(edit(RELATIVE, { ...taskData(RELATIVE), essential: true }, NOW, false)).toStrictEqual({ ok: true, change: { essential: true } });
		expect(edit(RELATIVE, { ...taskData(RELATIVE), essential: true }, NOW)).toStrictEqual({ ok: true, change: { essential: true } });
	});

	it('without the moment of saving, it does not resume', () => {
		expect(edit(RELATIVE, { ...taskData(RELATIVE), essential: true }, undefined, true)).toStrictEqual({ ok: true, change: { essential: true } });
	});

	it('unmarking an essential recurring task writes only the mark: the mode pauses it', () => {
		expect(edit(ESSENTIAL, { ...taskData(ESSENTIAL), essential: false }, NOW, true)).toStrictEqual({ ok: true, change: { essential: null } });
	});

	it('marking a non-essential one-off essential brings it back as it was', () => {
		expect(edit(ONE_OFF, { ...taskData(ONE_OFF), essential: true }, NOW, true)).toStrictEqual({ ok: true, change: { essential: true } });
	});

	it('a non-essential recurring task that becomes one-off is resumed at the moment of saving', () => {
		const result = edit(RELATIVE, { shape: 'puntual', title: 'Regar' }, NOW, true);
		expect(result.ok && result.change).toStrictEqual({ kind: 'puntual', dueDate: null, recurrence: null, resumedAt: NOW });
	});

	it('a task paused by hand that becomes one-off is resumed as with the mode off', () => {
		const result = edit(BY_HAND, { shape: 'puntual', title: 'Regar' }, NOW, true);
		expect(result.ok && result.change).toStrictEqual({ kind: 'puntual', dueDate: null, recurrence: null, paused: null, resumedAt: NOW });
	});

	it('a non-essential one-off that becomes recurring is not resumed: the mode pauses it', () => {
		const result = edit(ONE_OFF, { shape: 'relativa', title: 'Pagar', every: 2, unit: 'dias' }, NOW, true);
		expect(result.ok && 'resumedAt' in result.change).toBe(false);
	});

	it('an essential recurring task that is edited, or becomes one-off, is not resumed', () => {
		const renamed = edit(ESSENTIAL, { ...taskData(ESSENTIAL), title: 'Regar plantas' }, NOW, true);
		expect(renamed).toStrictEqual({ ok: true, change: { title: 'Regar plantas' } });
		const toOneOff = edit(ESSENTIAL, { shape: 'puntual', title: 'Regar', essential: true }, NOW, true);
		expect(toOneOff.ok && 'resumedAt' in toOneOff.change).toBe(false);
	});
});

describe('the loading screen waits for the mode with a session (spec §6.6)', () => {
	const wait = (changes: Partial<WaitStatus>): WaitStatus => ({
		secondsSinceStart: 2,
		auth: 'signedIn',
		tasksResponded: true,
		completionsResponded: true,
		minimalModeResponded: true,
		atkinson: 'ready',
		noto: 'ready',
		online: true,
		remembersNotoLimit: false,
		...changes
	});

	it('with a session it does not leave until the mode responds, up to the limit of 10 s', () => {
		expect(loadingScreenLeaves(wait({ minimalModeResponded: false }))).toBe(false);
		expect(loadingScreenLeaves(wait({ minimalModeResponded: false, secondsSinceStart: 10 }))).toBe(true);
		expect(loadingScreenLeaves(wait({}))).toBe(true);
	});

	it('without a session it does not wait for the mode', () => {
		expect(loadingScreenLeaves(wait({ auth: 'signedOut', minimalModeResponded: false }))).toBe(true);
	});
});
