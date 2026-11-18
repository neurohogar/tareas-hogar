// First step of the task (spec §4.1, §6.1, §6.2): written in the panel and the row shows it
// only when pending and overdue. A single trimmed line; empty means no field; never invalid.
import { expect } from 'vitest';
import { createOneOff, type OneOffData } from '../../src/lib/core/create-one-off';
import { createRecurringCalendar } from '../../src/lib/core/create-recurring-calendar';
import { taskData } from '../../src/lib/core/task-data';
import type { Task } from '../../src/lib/core/task';
import { NOW, createInWorld, recordCreation } from './create';
import { editsOther, editMe } from './editing';
import { daysOf, shapeOf } from './recurring-calendar';
import { P, TITLE, numeric } from './values';
import { OTHER, theDoc, theTask, theTaskTitled, type StepDefinition, type World } from './world';

const STATUSES = ['pendiente', 'en espera', 'atrasada'];
const ONLY_SPACES = '   ';

/** A first step written with extra spaces at the start and end. */
const withMargins = (text: string) => `  ${text}  `;

/** The task data with the first step written; the rest as it was. */
const withFirstStep = (firstStep: string) => (task: Task) => ({ ...taskData(task), firstStep });

/** A save with a first step is accepted: it never rejects (§4.1). */
function withoutRejection(world: World): void {
	expect(world.errors).toBeUndefined();
}

function createOneOffWithFirstStep(world: World, data: OneOffData): void {
	recordCreation(world, (id) => createOneOff(data, id, NOW));
	withoutRejection(world);
}

/** Leaves the task already saved with that first step, without going through editing (it is not a change "de mi lado"). */
function savedWithFirstStep(world: World, task: Task, firstStep: string): void {
	world.docs = world.docs.map((doc) => (doc.id === task.id ? { ...doc, firstStep } : doc));
}

/** Each form of first-step change: "<subject> el primer paso a ...". */
const CHANGES: { text: string; value: (...values: string[]) => string }[] = [
	{ text: P, value: (firstStep) => firstStep },
	{ text: `${P} con espacios al inicio y al final`, value: (firstStep) => withMargins(firstStep) },
	{ text: 'uno de solo espacios', value: () => ONLY_SPACES },
	{ text: `uno de ${P} caracteres`, value: (length) => 'x'.repeat(numeric(length)) }
];

const EDITORS = [
	{ subject: 'edito', edit: editMe },
	{ subject: `${OTHER} edita`, edit: editsOther }
];

const editSteps: StepDefinition[] = EDITORS.flatMap(({ subject, edit }) =>
	CHANGES.map(({ text, value }) => ({
		pattern: new RegExp(`^${subject} el primer paso a ${text}$`),
		run: (world: World, ...values: string[]) => {
			edit(world, withFirstStep(value(...values)));
			withoutRejection(world);
		}
	}))
);

/** At each queried moment, the list has a single row and it shows that first-step text. */
function theRowShowsFirstStep(world: World, text: string | undefined): void {
	expect(world.pendingQueries.length).toBeGreaterThan(0);
	for (const rows of world.pendingQueries) expect(rows.map(({ firstStepText: textOfFirstStep }) => textOfFirstStep)).toEqual([text]);
}

export const firstStepSteps: StepDefinition[] = [
	...editSteps,
	{
		pattern: new RegExp(`^creo una tarea puntual con título ${P} y primer paso ${P}$`),
		run: (world, title, firstStep) => createOneOffWithFirstStep(world, { title, firstStep })
	},
	{
		pattern: new RegExp(`^creo una tarea periódica relativa con título ${P} cada 2 dias y primer paso ${P}$`),
		run: (world, title, firstStep) => {
			createInWorld(world, { title, every: 2, unit: 'dias', firstStep });
			withoutRejection(world);
		}
	},
	{
		pattern: new RegExp(`^creo una tarea periódica (semanal|mensual) con título ${P} (los|los días) ${P} y primer paso ${P}$`),
		run: (world, shape, title, connector, days, firstStep) => {
			const data = { title, firstStep, ...daysOf(shapeOf(`${shape} ${connector}`), days) };
			recordCreation(world, (id) => createRecurringCalendar(data, id, NOW));
			withoutRejection(world);
		}
	},
	{
		pattern: new RegExp(`^creo una tarea puntual con título ${P} y un primer paso de solo espacios$`),
		run: (world, title) => createOneOffWithFirstStep(world, { title, firstStep: ONLY_SPACES })
	},
	{
		pattern: new RegExp(`^el primer paso de la tarea es ${P}$`),
		run: (world, firstStep) => savedWithFirstStep(world, theTask(world), firstStep)
	},
	{
		pattern: new RegExp(`^el primer paso de la tarea ${TITLE} es ${P}$`),
		run: (world, title, firstStep) => savedWithFirstStep(world, theTaskTitled(world, title), firstStep)
	},
	{
		// Removing means emptying the field: the task is left without a first step.
		pattern: /^quito el primer paso$/,
		run: (world) => {
			editMe(world, withFirstStep(''));
			withoutRejection(world);
		}
	},
	{
		pattern: new RegExp(`^${OTHER} quita el primer paso$`),
		run: (world) => {
			editsOther(world, withFirstStep(''));
			withoutRejection(world);
		}
	},
	{
		pattern: new RegExp(`^la tarea tiene primer paso ${P}$`),
		run: (world, firstStep) => expect(theTask(world).firstStep).toBe(firstStep)
	},
	{
		pattern: /^la tarea no tiene primer paso$/,
		run: (world) => expect(theDoc(world)).not.toHaveProperty('firstStep')
	},
	{
		pattern: new RegExp(`^la tarea tiene un primer paso de ${P} caracteres$`),
		run: (world, length) => expect(theTask(world).firstStep).toHaveLength(numeric(length))
	},
	{
		// The expected status arrives as a table value; the first step's is the usual one (§5).
		pattern: new RegExp(`^el estado es ${P}$`),
		run: (world, kind) => {
			expect(STATUSES).toContain(kind);
			expect(world.statuses.length).toBeGreaterThan(0);
			for (const status of world.statuses) expect(status.kind).toBe(kind);
		}
	},
	{
		pattern: new RegExp(`^la fila de la tarea muestra el primer paso ${P}$`),
		run: (world, text) => theRowShowsFirstStep(world, text)
	},
	{
		pattern: /^la fila de la tarea no muestra primer paso$/,
		run: (world) => theRowShowsFirstStep(world, undefined)
	}
];
