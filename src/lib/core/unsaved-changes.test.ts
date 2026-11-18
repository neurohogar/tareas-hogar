import { describe, expect, it } from 'vitest';
import { hasChanges } from './unsaved-changes';
import { DATA_ON_CREATE, taskData, type TaskData } from './task-data';
import type { Task } from './task';

const CREATED = new Date(2026, 6, 13, 8, 0, 0);
const ONE_OFF: TaskData = { shape: 'puntual', title: 'Pagar', note: 'Luz' };
const RELATIVE: TaskData = { shape: 'relativa', title: 'Regar', every: 2, unit: 'dias' };
const WEEKLY: TaskData = { shape: 'calendario', title: 'Regar', weekdays: ['lunes', 'jueves'], monthDays: [] };
const WITH_SCHEDULES: TaskData = {
	shape: 'puntual',
	title: 'Pagar',
	schedule: [
		{ from: '08:00', to: '10:00' },
		{ from: '12:00', to: '14:00' }
	]
};
/** How the panel opens when creating: nothing written. */
const ON_CREATE: TaskData = { shape: 'puntual', title: '', emoji: '', note: '', dueDate: undefined };

const doesChange = (onOpen: TaskData, data: TaskData) => hasChanges({ data: onOpen }, { data });

describe('hasChanges (spec §6.2): Save would change something compared to the values on opening', () => {
	it('the same values are not a change', () => {
		expect(doesChange(ONE_OFF, { ...ONE_OFF })).toBe(false);
	});

	it('another title, another note or another emoji are a change', () => {
		expect(doesChange(ONE_OFF, { ...ONE_OFF, title: 'Pagar luz' })).toBe(true);
		expect(doesChange(ONE_OFF, { ...ONE_OFF, note: 'Gas' })).toBe(true);
		expect(doesChange(ONE_OFF, { ...ONE_OFF, emoji: '🌱' })).toBe(true);
	});

	it('the spaces that Save trims do not count', () => {
		expect(doesChange(ONE_OFF, { ...ONE_OFF, title: '  Pagar  ', note: '  Luz \n' })).toBe(false);
		expect(doesChange({ ...ONE_OFF, emoji: '🌱' }, { ...ONE_OFF, emoji: ' 🌱 ' })).toBe(false);
	});

	it('a value that is not a single emoji is compared as is: another text is a change', () => {
		expect(doesChange({ ...ONE_OFF, emoji: '🌱' }, { ...ONE_OFF, emoji: '🌱🌱' })).toBe(true);
	});

	it('an emptied field counts even if invalid, and only whitespace is emptying it', () => {
		expect(doesChange(ONE_OFF, { ...ONE_OFF, title: '' })).toBe(true);
		expect(doesChange(ONE_OFF, { ...ONE_OFF, title: '   ' })).toBe(true);
		expect(doesChange(ONE_OFF, { ...ONE_OFF, note: '' })).toBe(true);
		expect(doesChange(ONE_OFF, { ...ONE_OFF, note: '   ' })).toBe(true);
	});

	it('without the field and the empty field are the same', () => {
		expect(doesChange({ shape: 'puntual', title: 'Pagar' }, { shape: 'puntual', title: 'Pagar', emoji: '', note: '', schedule: undefined, dueDate: undefined })).toBe(false);
	});

	it('the values the panel opens a task with match the freshly opened form', () => {
		const task: Task = { id: 't', title: 'Pagar', kind: 'puntual', dueDate: new Date(2026, 6, 20), createdAt: CREATED };
		expect(doesChange(taskData(task), { shape: 'puntual', title: 'Pagar', emoji: '', note: '', schedule: undefined, dueDate: '2026-07-20' })).toBe(false);
	});

	describe('Se repite', () => {
		it('another option is a change, even if its fields are empty', () => {
			expect(doesChange(ONE_OFF, { ...ONE_OFF, shape: 'relativa', every: Number.NaN, unit: 'horas' })).toBe(true);
			expect(doesChange(RELATIVE, { shape: 'puntual', title: 'Regar' })).toBe(true);
			expect(doesChange(WEEKLY, { ...WEEKLY, weekdays: [], monthDays: [1] })).toBe(true);
		});

		it('another value of its fields is a change', () => {
			expect(doesChange(RELATIVE, { ...RELATIVE, every: 3 } as TaskData)).toBe(true);
			expect(doesChange(RELATIVE, { ...RELATIVE, unit: 'horas' } as TaskData)).toBe(true);
			expect(doesChange(RELATIVE, { ...RELATIVE, every: Number.NaN } as TaskData)).toBe(true);
			expect(doesChange(ONE_OFF, { ...ONE_OFF, dueDate: '2026-07-20' } as TaskData)).toBe(true);
			expect(doesChange(WEEKLY, { ...WEEKLY, weekdays: ['lunes'] } as TaskData)).toBe(true);
		});

		it('a half-written date is a change even if it has an empty value', () => {
			expect(doesChange(ONE_OFF, { ...ONE_OFF, dueDate: '' } as TaskData)).toBe(true);
		});

		it('the days are a set: the order in which they were touched does not count', () => {
			expect(doesChange(WEEKLY, { ...WEEKLY, weekdays: ['jueves', 'lunes'] } as TaskData)).toBe(false);
			const monthly: TaskData = { shape: 'calendario', title: 'Regar', weekdays: [], monthDays: [1, 15] };
			expect(doesChange(monthly, { ...monthly, monthDays: [15, 1] })).toBe(false);
		});

		it('an invalid form without touching is not a change', () => {
			const withoutEvery: TaskData = { ...RELATIVE, every: Number.NaN } as TaskData;
			expect(doesChange(withoutEvery, { ...withoutEvery })).toBe(false);
		});
	});

	describe('Schedule', () => {
		it('swapping two windows changes nothing: Save orders them', () => {
			const [first, second] = WITH_SCHEDULES.schedule!;
			expect(doesChange(WITH_SCHEDULES, { ...WITH_SCHEDULES, schedule: [second, first] })).toBe(false);
		});

		it('changing a window does', () => {
			const [first] = WITH_SCHEDULES.schedule!;
			expect(doesChange(WITH_SCHEDULES, { ...WITH_SCHEDULES, schedule: [first, { from: '12:00', to: '15:00' }] })).toBe(true);
		});

		it('an empty row counts even if invalid', () => {
			expect(doesChange(WITH_SCHEDULES, { ...WITH_SCHEDULES, schedule: [...WITH_SCHEDULES.schedule!, { from: '', to: '' }] })).toBe(true);
			expect(doesChange(ONE_OFF, { ...ONE_OFF, schedule: [{ from: '', to: '' }] })).toBe(true);
		});

		it('turning the schedule off is a change; without windows is the same as without a schedule', () => {
			expect(doesChange(WITH_SCHEDULES, { ...WITH_SCHEDULES, schedule: undefined })).toBe(true);
			expect(doesChange(ONE_OFF, { ...ONE_OFF, schedule: [] })).toBe(false);
		});

		it('several windows in a relative task in hours are measured the same, even if Save rejects them', () => {
			const inHours = { shape: 'relativa', title: 'Regar', every: 2, unit: 'horas', schedule: WITH_SCHEDULES.schedule } as TaskData;
			expect(doesChange(inHours, { ...inHours })).toBe(false);
		});
	});

	describe('On creating', () => {
		it('is measured against No se repite, the one that comes selected (S23, S5)', () => {
			const interval: TaskData = { ...ON_CREATE, shape: 'relativa', every: Number.NaN, unit: 'horas' };
			expect(doesChange(DATA_ON_CREATE, ON_CREATE)).toBe(false);
			expect(doesChange(DATA_ON_CREATE, interval)).toBe(true);
		});

		it('the form as it was opened, or with only whitespace, is not a change', () => {
			expect(doesChange(ON_CREATE, ON_CREATE)).toBe(false);
			expect(doesChange(ON_CREATE, { ...ON_CREATE, title: '   ' })).toBe(false);
			expect(doesChange(ON_CREATE, { ...ON_CREATE, note: '   ' })).toBe(false);
		});

		it('loading any field is a change', () => {
			expect(doesChange(ON_CREATE, { ...ON_CREATE, title: 'Pagar' })).toBe(true);
			expect(doesChange(ON_CREATE, { ...ON_CREATE, emoji: '🌱' })).toBe(true);
			expect(doesChange(ON_CREATE, { ...ON_CREATE, shape: 'relativa', every: Number.NaN, unit: 'horas' })).toBe(true);
		});
	});

	it('is measured against the values on opening, not against those of another device', () => {
		const remote: Task = { id: 't', title: 'Pagar luz', note: 'Luz', kind: 'puntual', createdAt: CREATED };
		expect(doesChange(ONE_OFF, taskData(remote))).toBe(true);
		expect(doesChange(ONE_OFF, ONE_OFF)).toBe(false);
	});
});
