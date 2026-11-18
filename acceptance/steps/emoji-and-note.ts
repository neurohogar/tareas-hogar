// Emoji y nota de la tarea (spec §4.1), su edición (§6.2), el nombre de la
// tarea y los conflictos entre dispositivos (§7).
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

/** Lo que el panel escribe en los campos que cambian; el resto queda como estaba. */
type Fields = Partial<Pick<TaskData, 'title' | 'emoji' | 'note'>>;
const withFields = (fields: Fields) => (task: Task) => ({ ...taskData(task), ...fields });

/** Una nota escrita con espacios y saltos de línea de más al inicio y al final. */
const withMargins = (note: string) => `  \n ${note} \n  `;

const create = (world: World, data: OneOffData, now = SCENARIO_BEFORE) =>
	recordCreation(world, (id) => createOneOff(data, id, now));

/** Quién edita la nota: yo, o el otro dispositivo sin ver mi último cambio. */
const EDITORS = [
	{ subject: 'edito', edit: editMe },
	{ subject: `${OTHER} edita`, edit: editsOther }
];

/** Elegir un emoji en el selector: se asigna a la tarea que se edita, si hay una, y pasa a los recientes. */
function choose(world: World, emoji: string, fields: Fields = {}): void {
	recordChoice(world, emoji);
	if (world.docs.length > 0) editMe(world, withFields({ emoji, ...fields }));
}

/** Cada forma de cambio de la nota: "<sujeto> la nota a ...". */
const CHANGES: { text: string; fields: (...values: string[]) => Fields }[] = [
	{ text: `la nota a ${P}`, fields: (note) => ({ note }) },
	{ text: `la nota a ${P} con espacios al inicio y al final`, fields: (note) => ({ note: withMargins(note) }) },
	{ text: `la nota a ${P} y ${P} en líneas separadas`, fields: (first, second) => ({ note: `${first}\n${second}` }) },
	{ text: 'la nota a una de solo espacios', fields: () => ({ note: ONLY_SPACES }) },
	{ text: `la nota a una de ${P} caracteres`, fields: (length) => ({ note: 'x'.repeat(numeric(length)) }) }
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
		pattern: new RegExp(`^elijo el emoji ${P}$`),
		run: (world, emoji) => choose(world, emoji)
	},
	{
		pattern: new RegExp(`^elijo el emoji ${P} y edito la nota a ${P}$`),
		run: (world, emoji, note) => choose(world, emoji, { note })
	},
	{
		pattern: new RegExp(`^${OTHER} elige el emoji ${P}$`),
		run: (world, emoji) => editsOther(world, withFields({ emoji }))
	},
	{
		// Quitar es dejar la tarea sin emoji; no pasa por los recientes.
		pattern: /^quito el emoji$/,
		run: (world) => editMe(world, withFields({ emoji: '' }))
	},
	{
		pattern: new RegExp(`^una tarea puntual sin fecha límite con emoji ${P}$`),
		run: (world, emoji) => create(world, { title: 'Tarea', emoji }, NOW)
	},
	{
		pattern: new RegExp(`^una tarea puntual ${TITLE} sin fecha límite con emoji ${P}$`),
		run: (world, title, emoji) => create(world, { title, emoji })
	},
	{
		pattern: new RegExp(`^una tarea puntual sin fecha límite con nota ${P}$`),
		run: (world, note) => create(world, { title: 'Tarea', note }, NOW)
	},
	{
		pattern: new RegExp(`^creo una tarea puntual con título ${P}, emoji ${P} y nota ${P}$`),
		run: (world, title, emoji, note) => create(world, { title, emoji, note }, NOW)
	},
	{
		pattern: new RegExp(`^la tarea tiene emoji ${P}$`),
		run: (world, emoji) => expect(theTask(world).emoji).toBe(emoji)
	},
	{
		pattern: /^la tarea no tiene emoji$/,
		run: (world) => expect(theDoc(world)).not.toHaveProperty('emoji')
	},
	{
		pattern: new RegExp(`^la tarea tiene nota ${P}$`),
		run: (world, note) => expect(theTask(world).note).toBe(note)
	},
	{
		pattern: new RegExp(`^la nota de la tarea tiene dos líneas: ${P} y ${P}$`),
		run: (world, first, second) => expect(theTask(world).note?.split('\n')).toEqual([first, second])
	},
	{
		pattern: /^la tarea no tiene nota$/,
		run: (world) => expect(theDoc(world)).not.toHaveProperty('note')
	},
	{
		pattern: new RegExp(`^la tarea tiene una nota de ${P} caracteres$`),
		run: (world, length) => expect(theTask(world).note).toHaveLength(numeric(length))
	},
	{
		pattern: new RegExp(`^el nombre de la tarea es ${P}$`),
		run: (world, name) => expect(taskName(theTask(world))).toBe(name)
	}
];
