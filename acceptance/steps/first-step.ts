// Primer paso de la tarea (spec §4.1, §6.1, §6.2): se escribe en el panel y la fila lo muestra
// solo en pendiente y atrasada. Una sola línea, recortada; vacío es sin campo; nunca inválido.
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

/** Un primer paso escrito con espacios de más al inicio y al final. */
const withMargins = (text: string) => `  ${text}  `;

/** Los datos de la tarea con el primer paso escrito; el resto como estaba. */
const withFirstStep = (firstStep: string) => (task: Task) => ({ ...taskData(task), firstStep });

/** Un guardado con primer paso es aceptado: nunca rechaza (§4.1). */
function withoutRejection(world: World): void {
	expect(world.errors).toBeUndefined();
}

function createOneOffWithFirstStep(world: World, data: OneOffData): void {
	recordCreation(world, (id) => createOneOff(data, id, NOW));
	withoutRejection(world);
}

/** Deja la tarea ya guardada con ese primer paso, sin pasar por editar (no es un cambio "de mi lado"). */
function savedWithFirstStep(world: World, task: Task, firstStep: string): void {
	world.docs = world.docs.map((doc) => (doc.id === task.id ? { ...doc, firstStep } : doc));
}

/** Cada forma de cambio del primer paso: "<sujeto> el primer paso a ...". */
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

/** En cada momento consultado, la lista tiene una sola fila y muestra ese texto de primer paso. */
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
		// Quitar es vaciar el campo: la tarea queda sin primer paso.
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
		// El estado esperado llega como valor de la tabla; el del primer paso es el de siempre (§5).
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
