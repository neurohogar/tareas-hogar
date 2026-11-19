// Schedule of the task (spec §4.1, §6.1, §6.2) and its conflicts between devices (§7).
// "la tarea se puede completar de D a H [y de D2 a H2]" is an already saved schedule.
import { expect } from 'vitest';
import { createFromData, taskData, type TaskData } from '../../src/lib/core/task-data';
import { scheduleText, type TypedSchedule } from '../../src/lib/core/schedule';
import type { Task } from '../../src/lib/core/task';
import { NOW, TITLE_VALID, recordCreation } from './create';
import { editsOther, editAndSave, editMe } from './editing';
import { daysOf } from './recurring-calendar';
import { P, TITLE, numeric, unit } from './values';
import { OTHER, theTask, theTaskTitled, type StepDefinition, type World } from './world';

/** One or two windows: "de D a H" or "de D a H y de D2 a H2". */
const SCHEDULE = `from ${P} to ${P}(?: and from ${P} to ${P})?`;

/** The windows of the step; the second, if the step names it. */
function scheduleOf(from: string, to: string, from2?: string, to2?: string): TypedSchedule {
	return from2 === undefined ? [{ from, to }] : [{ from, to }, { from: from2, to: to2 }];
}

/** What the panel loads: the task values with another schedule, or without a schedule. */
function withSchedule(schedule: TypedSchedule | undefined, fields: Partial<TaskData> = {}) {
	return (task: Task): TaskData => {
		const { schedule: _, ...withoutSchedule } = taskData(task);
		return { ...withoutSchedule, ...fields, ...(schedule && { schedule }) } as TaskData;
	};
}

const create = (world: World, data: TaskData) => recordCreation(world, (id) => createFromData(data, id, NOW));

/** Who changes the schedule: me, or the other device without seeing my last change. */
const EDITORS = [
	{ puts: 'I set', removes: 'I remove', edit: editMe },
	{ puts: `${OTHER} sets`, removes: `${OTHER} removes`, edit: editsOther }
];

const editSteps: StepDefinition[] = EDITORS.flatMap(({ puts, removes, edit }) => [
	{
		pattern: new RegExp(`^${puts} the schedule ${SCHEDULE}$`),
		run: (world: World, from: string, to: string, from2?: string, to2?: string) =>
			edit(world, withSchedule(scheduleOf(from, to, from2, to2)))
	},
	{
		pattern: new RegExp(`^${removes} the schedule$`),
		run: (world: World) => edit(world, withSchedule(undefined))
	}
]);

/** An already saved schedule: it is not a change from this device. */
function saveSchedule(world: World, task: Task, schedule: TypedSchedule): void {
	editAndSave(world, task, withSchedule(schedule));
	expect(world.errors, 'el horario ya guardado debe ser válido').toBeUndefined();
}

export const scheduleSteps: StepDefinition[] = [
	...editSteps,
	{
		pattern: new RegExp(`^the task can be completed ${SCHEDULE}$`),
		run: (world, from, to, from2, to2) => saveSchedule(world, theTask(world), scheduleOf(from, to, from2, to2))
	},
	{
		pattern: new RegExp(`^the task ${TITLE} can be completed ${SCHEDULE}$`),
		run: (world, title, from, to, from2, to2) =>
			saveSchedule(world, theTaskTitled(world, title), scheduleOf(from, to, from2, to2))
	},
	{
		// The document as the single-window version left it: the schedule is an object.
		pattern: new RegExp(`^a one-off task without a due date saved in the previous format with schedule from ${P} to ${P}$`),
		run: (world, from, to) => {
			create(world, { shape: 'puntual', title: 'Tarea' });
			world.docs = world.docs.map((doc) => ({ ...doc, schedule: { from, to } }));
		}
	},
	{
		pattern: new RegExp(`^I create a one-off task with title ${P} and schedule ${SCHEDULE}$`),
		run: (world, title, from, to, from2, to2) =>
			create(world, { shape: 'puntual', title, schedule: scheduleOf(from, to, from2, to2) })
	},
	{
		pattern: new RegExp(`^I create a one-off task with a valid title and schedule ${SCHEDULE}$`),
		run: (world, from, to, from2, to2) =>
			create(world, { shape: 'puntual', title: TITLE_VALID, schedule: scheduleOf(from, to, from2, to2) })
	},
	{
		pattern: new RegExp(`^I create a one-off task with a valid title and a schedule with only the start time ${P}$`),
		run: (world, from) => create(world, { shape: 'puntual', title: TITLE_VALID, schedule: [{ from }] })
	},
	{
		pattern: new RegExp(`^I create a one-off task with a valid title and a schedule with only the end time ${P}$`),
		run: (world, to) => create(world, { shape: 'puntual', title: TITLE_VALID, schedule: [{ to }] })
	},
	{
		pattern: new RegExp(`^I create a one-off task with a valid title, schedule from ${P} to ${P} and another schedule with only the start time ${P}$`),
		run: (world, from, to, from2) =>
			create(world, { shape: 'puntual', title: TITLE_VALID, schedule: [{ from, to }, { from: from2 }] })
	},
	{
		pattern: new RegExp(`^I create a relative recurring task with title ${P} every ${P} ${P} and schedule ${SCHEDULE}$`),
		run: (world, title, every, u, from, to, from2, to2) =>
			create(world, { shape: 'relativa', title, every: numeric(every), unit: unit(u), schedule: scheduleOf(from, to, from2, to2) })
	},
	{
		pattern: new RegExp(`^I create a weekly recurring task with title ${P} on ${P} and schedule ${SCHEDULE}$`),
		run: (world, title, days, from, to, from2, to2) =>
			create(world, { shape: 'calendario', title, ...daysOf('weekly', days), schedule: scheduleOf(from, to, from2, to2) })
	},
	{
		pattern: new RegExp(`^I set a schedule with only the start time ${P}$`),
		run: (world, from) => editMe(world, withSchedule([{ from }]))
	},
	{
		pattern: new RegExp(`^in a single edit I edit the title to ${P} and the schedule ${SCHEDULE}$`),
		run: (world, title, from, to, from2, to2) => editMe(world, withSchedule(scheduleOf(from, to, from2, to2), { title }))
	},
	{
		pattern: new RegExp(`^the task has schedule ${SCHEDULE}$`),
		run: (world, from, to, from2, to2) => expect(theTask(world).schedule).toStrictEqual(scheduleOf(from, to, from2, to2))
	},
	{
		pattern: /^the task has no schedule$/,
		run: (world) => expect(theTask(world)).not.toHaveProperty('schedule')
	},
	{
		pattern: new RegExp(`^the task row shows the schedule ${P}$`),
		run: (world, text) => expect(scheduleText(theTask(world).schedule ?? [])).toBe(text)
	},
	{
		pattern: /^(?:creation|editing) is rejected because the end time is not after the start time$/,
		run: (world) => expect(world.errors).toEqual({ schedule: 'endNotAfterStart' })
	}
];
