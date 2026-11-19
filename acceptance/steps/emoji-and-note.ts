// Emoji and note of the task (spec §4.1), their editing (§6.2), the name of the
// task and conflicts between devices (§7).
import { expect } from 'vitest';
import { createOneOff, type OneOffData } from '../../src/lib/core/create-one-off';
import { taskData, type TaskData } from '../../src/lib/core/task-data';
import { taskName } from '../../src/lib/core/task-name';
import type { Task } from '../../src/lib/core/task';
import { NOW, SCENARIO_BEFORE, recordCreation } from './create';
import { editsOther, editMe } from './editing';
import { recordChoice } from './recent-emojis';
import { P, TITLE, numeric } from './values';
import { OTHER, theDoc, theTask, type StepDefinition, type World } from './world';

const ONLY_SPACES = '   ';

/** What the panel writes in the fields that change; the rest stays as it was. */
type Fields = Partial<Pick<TaskData, 'title' | 'emoji' | 'note'>>;
const withFields = (fields: Fields) => (task: Task) => ({ ...taskData(task), ...fields });

/** A note written with extra spaces and line breaks at the start and end. */
const withMargins = (note: string) => `  \n ${note} \n  `;

const create = (world: World, data: OneOffData, now = SCENARIO_BEFORE) =>
	recordCreation(world, (id) => createOneOff(data, id, now));

/** Who edits the note: me, or the other device without seeing my last change. */
const EDITORS = [
	{ subject: 'I edit', edit: editMe },
	{ subject: `${OTHER} edits`, edit: editsOther }
];

/** Choosing an emoji in the picker: it is assigned to the task being edited, if there is one, and goes to the recents. */
function choose(world: World, emoji: string, fields: Fields = {}): void {
	recordChoice(world, emoji);
	if (world.docs.length > 0) editMe(world, withFields({ emoji, ...fields }));
}

/** Each form of note change: "<subject> the note to ...". */
const CHANGES: { text: string; fields: (...values: string[]) => Fields }[] = [
	{ text: `the note to ${P}`, fields: (note) => ({ note }) },
	{ text: `the note to ${P} with spaces at the start and end`, fields: (note) => ({ note: withMargins(note) }) },
	{ text: `the note to ${P} and ${P} on separate lines`, fields: (first, second) => ({ note: `${first}\n${second}` }) },
	{ text: 'the note to one of only spaces', fields: () => ({ note: ONLY_SPACES }) },
	{ text: `the note to one of ${P} characters`, fields: (length) => ({ note: 'x'.repeat(numeric(length)) }) }
];

const editSteps: StepDefinition[] = EDITORS.flatMap(({ subject, edit }) =>
	CHANGES.map(({ text, fields }) => ({
		pattern: new RegExp(`^${subject} ${text}$`),
		run: (world: World, ...values: string[]) => edit(world, withFields(fields(...values)))
	}))
);

export const emojiAndNoteSteps: StepDefinition[] = [
	...editSteps,
	{
		pattern: new RegExp(`^I choose the emoji ${P}$`),
		run: (world, emoji) => choose(world, emoji)
	},
	{
		pattern: new RegExp(`^I choose the emoji ${P} and edit the note to ${P}$`),
		run: (world, emoji, note) => choose(world, emoji, { note })
	},
	{
		pattern: new RegExp(`^${OTHER} chooses the emoji ${P}$`),
		run: (world, emoji) => editsOther(world, withFields({ emoji }))
	},
	{
		// Removing means leaving the task without an emoji; it does not go through the recents.
		pattern: /^I remove the emoji$/,
		run: (world) => editMe(world, withFields({ emoji: '' }))
	},
	{
		pattern: new RegExp(`^a one-off task without a due date with emoji ${P}$`),
		run: (world, emoji) => create(world, { title: 'Tarea', emoji }, NOW)
	},
	{
		pattern: new RegExp(`^a one-off task ${TITLE} without a due date with emoji ${P}$`),
		run: (world, title, emoji) => create(world, { title, emoji })
	},
	{
		pattern: new RegExp(`^a one-off task without a due date with note ${P}$`),
		run: (world, note) => create(world, { title: 'Tarea', note }, NOW)
	},
	{
		pattern: new RegExp(`^I create a one-off task with title ${P}, emoji ${P} and note ${P}$`),
		run: (world, title, emoji, note) => create(world, { title, emoji, note }, NOW)
	},
	{
		pattern: new RegExp(`^the task has emoji ${P}$`),
		run: (world, emoji) => expect(theTask(world).emoji).toBe(emoji)
	},
	{
		pattern: /^the task has no emoji$/,
		run: (world) => expect(theDoc(world)).not.toHaveProperty('emoji')
	},
	{
		pattern: new RegExp(`^the task has note ${P}$`),
		run: (world, note) => expect(theTask(world).note).toBe(note)
	},
	{
		pattern: new RegExp(`^the task note has two lines: ${P} and ${P}$`),
		run: (world, first, second) => expect(theTask(world).note?.split('\n')).toEqual([first, second])
	},
	{
		pattern: /^the task has no note$/,
		run: (world) => expect(theDoc(world)).not.toHaveProperty('note')
	},
	{
		pattern: new RegExp(`^the task has a note of ${P} characters$`),
		run: (world, length) => expect(theTask(world).note).toHaveLength(numeric(length))
	},
	{
		pattern: new RegExp(`^the task name is ${P}$`),
		run: (world, name) => expect(taskName(theTask(world))).toBe(name)
	}
];
