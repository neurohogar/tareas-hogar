// Edit and delete tasks (spec §6.2) and conflicts between devices (§7).
// "otro dispositivo, sin ver ese cambio, ..." acts on what was stored before
// my last change, and its change arrives after mine.
import { expect } from 'vitest';
import { deletion, orphanCompletions } from '../../src/lib/core/deletion';
import { completionsOfTask, complete } from '../../src/lib/core/completions';
import { taskData, type TaskData } from '../../src/lib/core/task-data';
import { applyChange } from '../../src/lib/core/task-document';
import { edit } from '../../src/lib/core/editing';
import { changeOnComplete } from '../../src/lib/core/current-step';
import type { Task } from '../../src/lib/core/task';
import { DAYS_VALID, SHAPE_RECURRING_AND_DAYS, WITHOUT_DAYS, daysOf, shapeOf } from './recurring-calendar';
import { P, TITLE, dateHour, numeric, unit } from './values';
import {
	OTHER,
	deleteSaved,
	theDoc,
	theTask,
	theTaskTitled,
	thatWasSaved,
	thatSawOther,
	newId,
	rememberBeforeOfMyChange,
	tasksOf,
	type Saved,
	type StepDefinition,
	type World
} from './world';

/** The new data loaded into the panel, starting from the task being edited. */
type DataNew = (task: Task) => TaskData;

/** Who edits and which task they pick, according to what they see. */
interface Editor {
	subject: string;
	/** The subject names the task by its title (the first capture). */
	namesTask: boolean;
	edit: (world: World, data: DataNew, title?: string) => void;
}

/** `now`: the moment of saving, if the step gives it (turning a paused task into a one-off resumes it, §5.8). */
export function editAndSave(world: World, task: Task, data: DataNew, now?: Date): void {
	const result = edit(task, data(task), now);
	if (!result.ok) world.errors = result.errors;
	else world.docs = applyChange(world.docs, task.id, result.change);
}

const taskChosen = (saved: Saved, title?: string) =>
	title === undefined ? theTask(saved) : theTaskTitled(saved, title);

export function editMe(world: World, data: DataNew, title?: string, now?: Date): void {
	rememberBeforeOfMyChange(world);
	editAndSave(world, taskChosen(world, title), data, now);
}

export function editsOther(world: World, data: DataNew): void {
	editAndSave(world, theTask(thatSawOther(world)), data);
}

/** Deletes the task and its completions and annotations known to whoever deletes (§6.2, §7). */
function remove(world: World, task: Task, completionsKnown: Saved['completions']): void {
	const { taskId, completionIds, annotationIds } = deletion(task.id, completionsKnown, world.annotations);
	deleteSaved(world, [taskId], completionIds, annotationIds);
}

const EDITORS: Editor[] = [
	{ subject: 'I edit the task', namesTask: false, edit: editMe },
	{ subject: `I edit the task ${TITLE}`, namesTask: true, edit: editMe },
	{ subject: `${OTHER} edits the task`, namesTask: false, edit: editsOther }
];

/** Each form of "... a <definition>": the data it loads, with the current title. */
const DEFINITIONS: { text: string; data: (title: string, ...values: string[]) => TaskData }[] = [
	{
		text: `one-off with due date ${P}`,
		data: (title, dueDate) => ({ shape: 'puntual', title, dueDate })
	},
	{ text: 'one-off without a due date', data: (title) => ({ shape: 'puntual', title }) },
	{
		text: `relative recurring every ${P} ${P}`,
		data: (title, every, u) => ({ shape: 'relativa', title, every: numeric(every), unit: unit(u) })
	},
	{
		text: SHAPE_RECURRING_AND_DAYS,
		data: (title, shape, connector, days) => ({ shape: 'calendario', title, ...daysOf(shapeOf(`${shape} ${connector}`), days) })
	},
	{ text: '(?:weekly|monthly) recurring without days', data: (title) => ({ shape: 'calendario', title, ...WITHOUT_DAYS }) },
	{
		text: 'calendar recurring with weekdays and month days at once',
		data: (title) => ({
			shape: 'calendario',
			title,
			weekdays: DAYS_VALID.weekly.weekdays,
			monthDays: DAYS_VALID.monthly.monthDays
		})
	}
];

/** Changing the kind in the panel leaves the emoji, note, steps, minimal version and schedule as they were. */
function fieldsThatKeeps(task: Task): Pick<TaskData, 'emoji' | 'note' | 'firstStep' | 'steps' | 'minimalVersion' | 'schedule'> {
	const { emoji, note, firstStep, steps, minimalVersion, schedule } = taskData(task);
	return { ...(emoji && { emoji }), ...(note && { note }), ...(firstStep && { firstStep }), ...(steps && { steps }), ...(minimalVersion && { minimalVersion }), ...(schedule && { schedule }) };
}

const stepsOfEditA: StepDefinition[] = EDITORS.flatMap((editor) =>
	DEFINITIONS.map(({ text, data }) => ({
		pattern: new RegExp(`^${editor.subject} to ${text}$`),
		run: (world: World, ...values: string[]) => {
			const title = editor.namesTask ? values.shift() : undefined;
			editor.edit(world, (task) => ({ ...fieldsThatKeeps(task), ...data(task.title, ...values) }), title);
		}
	}))
);

const withTitle = (title: string) => (task: Task) => ({ ...taskData(task), title });

/**
 * The task has a single completion, of that moment. If it is a calendar one it also carries
 * its coveredOccurrence (§5.3) and, if it was the minimal one, its wasMinimal (§4.4), which this step does not assert; no other field.
 */
function theOnlyCompletionIs(world: World, task: Task, completed: string): void {
	const completions = completionsOfTask(world.completions, task.id);
	expect(completions).toHaveLength(1);
	const { coveredOccurrence: occurrenceCovered, wasMinimal, ...rest } = completions[0];
	expect(rest).toStrictEqual({ id: expect.any(String), taskId: task.id, completedAt: dateHour(completed) });
	if (occurrenceCovered !== undefined) expect(occurrenceCovered).toBeInstanceOf(Date);
	// If it was the minimal one (§4.4), the minimal-version steps assert it; it is only ever written as true.
	if (wasMinimal !== undefined) expect(wasMinimal).toBe(true);
}

/** The task with that title, even if it has been deleted. */
const theOneThatHadBefore = (world: World, title: string) => theTaskTitled(thatWasSaved(world), title);

export const editingSteps: StepDefinition[] = [
	...stepsOfEditA,
	{
		pattern: new RegExp(`^I edit the task to one-off without a due date on ${P}$`),
		run: (world, moment) =>
			editMe(world, (task) => ({ ...fieldsThatKeeps(task), shape: 'puntual', title: task.title }), undefined, dateHour(moment))
	},
	{
		pattern: new RegExp(`^I edit the title to ${P}$`),
		run: (world, title) => editMe(world, withTitle(title))
	},
	{
		pattern: /^I edit the title to one of only spaces$/,
		run: (world) => editMe(world, withTitle('   '))
	},
	{
		pattern: new RegExp(`^${OTHER} edits the title to ${P}$`),
		run: (world, title) => editsOther(world, withTitle(title))
	},
	{
		pattern: new RegExp(`^in a single edit I edit the title to ${P} and the due date to ${P}$`),
		run: (world, title, dueDate) => editMe(world, () => ({ shape: 'puntual', title, dueDate }))
	},
	{
		pattern: new RegExp(`^${OTHER} edits the title de the task ${TITLE} to ${TITLE}$`),
		run: (world, title, updated) => editAndSave(world, theTaskTitled(thatSawOther(world), title), withTitle(updated))
	},
	{
		pattern: new RegExp(`^${OTHER} saves the task without changes$`),
		run: (world) => editsOther(world, taskData)
	},
	{
		pattern: /^I delete the task$/,
		run: (world) => {
			rememberBeforeOfMyChange(world);
			remove(world, theTask(world), world.completions);
		}
	},
	{
		pattern: new RegExp(`^I delete the task ${TITLE}$`),
		run: (world, title) => {
			rememberBeforeOfMyChange(world);
			remove(world, theTaskTitled(world, title), world.completions);
		}
	},
	{
		pattern: new RegExp(`^${OTHER} deletes the task$`),
		run: (world) => {
			const seen = thatSawOther(world);
			remove(world, theTask(seen), seen.completions);
		}
	},
	{
		pattern: new RegExp(`^${OTHER} completes the task ${TITLE} on ${P}$`),
		run: (world, title, moment) => {
			const seen = thatSawOther(world);
			const task = theTaskTitled(seen, title);
			const completion = complete(task, seen.completions, newId(world, 'completado'), dateHour(moment));
			world.completions = [...world.completions, completion];
			// Completing, from any device, returns the task to step 1 (§4.1, Pasos).
			world.docs = applyChange(world.docs, task.id, changeOnComplete(task));
		}
	},
	{
		pattern: /^the task does not change$/,
		run: (world) => expect(world.docs).toStrictEqual(thatSawOther(world).docs)
	},
	{
		pattern: /^the task is (one-off|recurring)$/,
		run: (world, kind) => expect(theTask(world).kind).toBe(kind === 'one-off' ? 'puntual' : 'periodica')
	},
	{
		pattern: /^the task has no recurrence$/,
		run: (world) => expect(theDoc(world)).not.toHaveProperty('recurrence')
	},
	{
		pattern: new RegExp(`^the task has title ${P}$`),
		run: (world, title) => expect(theTask(world).title).toBe(title)
	},
	{
		pattern: new RegExp(`^the task is still created on ${P}$`),
		run: (world, created) => expect(theTask(world).createdAt).toEqual(dateHour(created))
	},
	{
		pattern: /^the task keeps its id$/,
		run: (world) => expect(theTask(world).id).toBe(theTask(thatSawOther(world)).id)
	},
	{
		pattern: new RegExp(`^the task keeps a single completion, from ${P}$`),
		run: (world, completed) => theOnlyCompletionIs(world, theTask(world), completed)
	},
	{
		pattern: new RegExp(`^the task ${TITLE} keeps a single completion, from ${P}$`),
		run: (world, title, completed) => theOnlyCompletionIs(world, theTaskTitled(world, title), completed)
	},
	{
		pattern: new RegExp(`^there is no task ${TITLE}$`),
		run: (world, title) => {
			const id = theOneThatHadBefore(world, title).id;
			expect(world.docs.map((doc) => doc.id)).not.toContain(id);
			expect(tasksOf(world).map((task) => task.title)).not.toContain(title);
		}
	},
	{
		pattern: new RegExp(`^no completion remains of ${TITLE}$`),
		run: (world, title) => expect(completionsOfTask(world.completions, theOneThatHadBefore(world, title).id)).toEqual([])
	},
	{
		pattern: /^no task remains$/,
		run: (world) => expect(world.docs).toEqual([])
	},
	{
		pattern: new RegExp(`^the orphan completions to clean are only the one of ${TITLE} from ${P}$`),
		run: (world, title, completed) => {
			expect(orphanCompletions(tasksOf(world), world.completions)).toEqual([
				{ id: expect.any(String), taskId: theOneThatHadBefore(world, title).id, completedAt: dateHour(completed) }
			]);
		}
	}
];
