// Minimal version of the task (spec §4.1, §4.4, §5.4, §6.1, §6.2, §6.3, §7): an optional one-line field that
// the row shows when pending and overdue with the «Hice la mínima» button, which completes like the checkbox and leaves
// `wasMinimal` in the completion. Never invalid: empty or only spaces means no minimal version.
import { expect } from 'vitest';
import { noticeText } from '../../src/lib/core/notice';
import { latestCompletion, completionsOfTask } from '../../src/lib/core/completions';
import { createRecurringCalendar } from '../../src/lib/core/create-recurring-calendar';
import { createOneOff, type OneOffData } from '../../src/lib/core/create-one-off';
import { taskData } from '../../src/lib/core/task-data';
import { applyChange } from '../../src/lib/core/task-document';
import { changeOnComplete } from '../../src/lib/core/current-step';
import type { Task } from '../../src/lib/core/task';
import { doTheMinimal } from '../../src/lib/core/minimal-version';
import { NOW, createInWorld, recordCreation } from './create';
import { editsOther, editMe } from './editing';
import { daysOf, shapeOf } from './recurring-calendar';
import { completeMe, recordCompletion } from './recurring-relative';
import { P, TITLE, dateHour, numeric } from './values';
import { OTHER, theDoc, theTask, theTaskTitled, thatSawOther, newId, type StepDefinition, type World } from './world';

const ONLY_SPACES = '   ';

/** A minimal version written with extra spaces at the start and end. */
const withMargins = (text: string) => `  ${text}  `;

/** The task data with the minimal version written; the rest as it was. */
const withMinimalVersion = (minimalVersion: string) => (task: Task) => ({ ...taskData(task), minimalVersion });

/** A save with a minimal version is accepted: it never rejects (§4.1). */
function withoutRejection(world: World): void {
	expect(world.errors).toBeUndefined();
}

function createOneOffWithMinimal(world: World, data: OneOffData): void {
	recordCreation(world, (id) => createOneOff(data, id, NOW));
	withoutRejection(world);
}

/** Leaves the task already saved with that minimal version, without going through editing (it is not a change "de mi lado"). */
function savedWithMinimal(world: World, task: Task, minimalVersion: string): void {
	expect(minimalVersion.trim()).not.toBe('');
	world.docs = world.docs.map((doc) => (doc.id === task.id ? { ...doc, minimalVersion } : doc));
}

/** Each form of minimal-version change: "<subject> la versión mínima a ...". */
const CHANGES: { text: string; value: (...values: string[]) => string }[] = [
	{ text: P, value: (minimal) => minimal },
	{ text: `${P} with spaces at the start and end`, value: (minimal) => withMargins(minimal) },
	{ text: 'one of only spaces', value: () => ONLY_SPACES },
	{ text: `one of ${P} characters`, value: (length) => 'x'.repeat(numeric(length)) }
];

const EDITORS = [
	{ subject: 'I edit', edit: editMe },
	{ subject: `${OTHER} edits`, edit: editsOther }
];

const editSteps: StepDefinition[] = EDITORS.flatMap(({ subject, edit }) =>
	CHANGES.map(({ text, value }) => ({
		pattern: new RegExp(`^${subject} the minimal version to ${text}$`),
		run: (world: World, ...values: string[]) => {
			edit(world, withMinimalVersion(value(...values)));
			withoutRejection(world);
		}
	}))
);

/** A completion already saved with `wasMinimal`, without a notice and without touching the step the task is on. */
function completedWithMinimal(world: World, task: Task, moment: string, step?: string): void {
	const { id } = recordCompletion(world, dateHour(moment), task, true);
	if (step === undefined) return;
	const stepOnComplete = numeric(step);
	expect(Number.isInteger(stepOnComplete) && stepOnComplete >= 1).toBe(true);
	world.completions = world.completions.map((completion) => (completion.id === id ? { ...completion, stepAtCompletion: stepOnComplete } : completion));
}

/** «Hice la mínima» from this device: what the core decides, with the notice and step 1 like the checkbox. */
function tapMinimal(world: World, task: Task, moment: Date): void {
	world.checkboxTouched = true;
	// Without a prior query, what is asserted afterwards belongs to the moment of the tap.
	if (world.statusMoments.length === 0) world.statusMoments = [moment];
	completeMe(world, moment, task, doTheMinimal);
}

/** The other device decides with what it saw; its completion reaches what is stored. */
function dueMinimalOther(world: World, moment: Date): void {
	const seen = thatSawOther(world);
	const task = theTask(seen);
	const completion = doTheMinimal(task, seen.completions, newId(world, 'completado'), moment);
	if (!completion) return;
	world.completions = [...world.completions, completion];
	world.docs = applyChange(world.docs, task.id, changeOnComplete(task));
}

const theLastCompletion = (world: World) => {
	const completions = completionsOfTask(world.completions, theTask(world).id);
	expect(completions.length).toBeGreaterThan(0);
	return latestCompletion(completions);
};

/** At each queried moment, the list has a single row and that is its minimal line. */
function theRowShowsMinimal(world: World, line: string | undefined): void {
	expect(world.pendingQueries.length).toBeGreaterThan(0);
	for (const rows of world.pendingQueries) expect(rows.map(({ minimal }) => minimal?.text)).toEqual([line]);
}

const BUTTON_STATUSES: Record<string, boolean> = { enabled: true, disabled: false };

export const minimalVersionSteps: StepDefinition[] = [
	...editSteps,
	{
		pattern: new RegExp(`^I create a one-off task with title ${P} and minimal version ${P}$`),
		run: (world, title, minimalVersion) => createOneOffWithMinimal(world, { title, minimalVersion })
	},
	{
		pattern: new RegExp(`^I create a relative recurring task with title ${P} every 2 days and minimal version ${P}$`),
		run: (world, title, minimalVersion) => {
			createInWorld(world, { title, every: 2, unit: 'dias', minimalVersion });
			withoutRejection(world);
		}
	},
	{
		pattern: new RegExp(`^I create a weekly recurring task with title ${P} on ${P} and minimal version ${P}$`),
		run: (world, title, days, minimalVersion) => {
			const data = { title, minimalVersion, ...daysOf(shapeOf('weekly on'), days) };
			recordCreation(world, (id) => createRecurringCalendar(data, id, NOW));
			withoutRejection(world);
		}
	},
	{
		pattern: new RegExp(`^I create a one-off task with title ${P} and a minimal version of only spaces$`),
		run: (world, title) => createOneOffWithMinimal(world, { title, minimalVersion: ONLY_SPACES })
	},
	{
		pattern: new RegExp(`^the minimal version of the task is ${P}$`),
		run: (world, minimalVersion) => savedWithMinimal(world, theTask(world), minimalVersion)
	},
	{
		pattern: new RegExp(`^the minimal version of the task ${TITLE} is ${P}$`),
		run: (world, title, minimalVersion) => savedWithMinimal(world, theTaskTitled(world, title), minimalVersion)
	},
	{
		// Removing means emptying the field: the task is left without a minimal version.
		pattern: /^I remove the minimal version$/,
		run: (world) => {
			editMe(world, withMinimalVersion(''));
			withoutRejection(world);
		}
	},
	{
		pattern: new RegExp(`^${OTHER} removes the minimal version$`),
		run: (world) => {
			editsOther(world, withMinimalVersion(''));
			withoutRejection(world);
		}
	},
	{
		pattern: new RegExp(`^the task has minimal version ${P}$`),
		run: (world, minimalVersion) => expect(theTask(world).minimalVersion).toBe(minimalVersion)
	},
	{
		pattern: /^the task has no minimal version$/,
		run: (world) => expect(theDoc(world)).not.toHaveProperty('minimalVersion')
	},
	{
		pattern: new RegExp(`^the task has a minimal version of ${P} characters$`),
		run: (world, length) => expect(theTask(world).minimalVersion).toHaveLength(numeric(length))
	},
	{
		pattern: new RegExp(`^the task row shows the minimal one ${P}$`),
		run: (world, text) => theRowShowsMinimal(world, text)
	},
	{
		pattern: /^the task row shows no minimal one$/,
		run: (world) => theRowShowsMinimal(world, undefined)
	},
	{
		pattern: /^the Hice la mínima button of the task is (enabled|disabled)$/,
		run: (world, status) => {
			expect(Object.hasOwn(BUTTON_STATUSES, status)).toBe(true);
			expect(world.pendingQueries.length).toBeGreaterThan(0);
			for (const rows of world.pendingQueries) expect(rows.map(({ minimal }) => minimal?.enabled)).toEqual([BUTTON_STATUSES[status]]);
		}
	},
	{
		pattern: new RegExp(`^I tap Hice la mínima on ${P}$`),
		run: (world, moment) => tapMinimal(world, theTask(world), dateHour(moment))
	},
	{
		pattern: new RegExp(`^I tap Hice la mínima in the task ${TITLE} on ${P}$`),
		run: (world, title, moment) => tapMinimal(world, theTaskTitled(world, title), dateHour(moment))
	},
	{
		pattern: new RegExp(`^${OTHER} taps Hice la mínima on ${P}$`),
		run: (world, moment) => dueMinimalOther(world, dateHour(moment))
	},
	{
		pattern: new RegExp(`^the task was completed on ${P} with the minimal one$`),
		run: (world, moment) => completedWithMinimal(world, theTask(world), moment)
	},
	{
		pattern: new RegExp(`^the task ${TITLE} was completed on ${P} with the minimal one$`),
		run: (world, title, moment) => completedWithMinimal(world, theTaskTitled(world, title), moment)
	},
	{
		pattern: new RegExp(`^the task was completed on ${P} at step ${P} with the minimal one$`),
		run: (world, moment, step) => completedWithMinimal(world, theTask(world), moment, step)
	},
	{
		pattern: /^the last completion of the task was the minimal one$/,
		run: (world) => expect(theLastCompletion(world).wasMinimal).toBe(true)
	},
	{
		pattern: /^the last completion of the task was whole$/,
		run: (world) => expect(theLastCompletion(world)).not.toHaveProperty('wasMinimal')
	},
	{
		pattern: new RegExp(`^the completion notice says ${P}$`),
		run: (world, text) => {
			const notice = world.noticeQueried?.notice;
			expect(notice).toBeDefined();
			expect(noticeText(notice!)).toBe(text);
		}
	},
	{
		pattern: /^the task has two completions, one whole and one minimal$/,
		run: (world) => {
			const completions = completionsOfTask(world.completions, theTask(world).id);
			expect(completions.map(({ wasMinimal }) => wasMinimal === true).sort()).toEqual([false, true]);
		}
	}
];
