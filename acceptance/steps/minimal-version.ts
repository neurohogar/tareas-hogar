// Versión mínima de la tarea (spec §4.1, §4.4, §5.4, §6.1, §6.2, §6.3, §7): un campo opcional de una línea que
// la fila muestra en pendiente y atrasada con el botón «Hice la mínima», que completa como el checkbox y deja
// `fueMinima` en el completado. Nunca inválida: vacío o solo espacios es sin versión mínima.
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

/** Una versión mínima escrita con espacios de más al inicio y al final. */
const withMargins = (text: string) => `  ${text}  `;

/** Los datos de la tarea con la versión mínima escrita; el resto como estaba. */
const withMinimalVersion = (minimalVersion: string) => (task: Task) => ({ ...taskData(task), minimalVersion });

/** Un guardado con versión mínima es aceptado: nunca rechaza (§4.1). */
function withoutRejection(world: World): void {
	expect(world.errors).toBeUndefined();
}

function createOneOffWithMinimal(world: World, data: OneOffData): void {
	recordCreation(world, (id) => createOneOff(data, id, NOW));
	withoutRejection(world);
}

/** Deja la tarea ya guardada con esa versión mínima, sin pasar por editar (no es un cambio "de mi lado"). */
function savedWithMinimal(world: World, task: Task, minimalVersion: string): void {
	expect(minimalVersion.trim()).not.toBe('');
	world.docs = world.docs.map((doc) => (doc.id === task.id ? { ...doc, minimalVersion } : doc));
}

/** Cada forma de cambio de la versión mínima: "<sujeto> la versión mínima a ...". */
const CHANGES: { text: string; value: (...values: string[]) => string }[] = [
	{ text: P, value: (minimal) => minimal },
	{ text: `${P} con espacios al inicio y al final`, value: (minimal) => withMargins(minimal) },
	{ text: 'una de solo espacios', value: () => ONLY_SPACES },
	{ text: `una de ${P} caracteres`, value: (length) => 'x'.repeat(numeric(length)) }
];

const EDITORS = [
	{ subject: 'edito', edit: editMe },
	{ subject: `${OTHER} edita`, edit: editsOther }
];

const editSteps: StepDefinition[] = EDITORS.flatMap(({ subject, edit }) =>
	CHANGES.map(({ text, value }) => ({
		pattern: new RegExp(`^${subject} la versión mínima a ${text}$`),
		run: (world: World, ...values: string[]) => {
			edit(world, withMinimalVersion(value(...values)));
			withoutRejection(world);
		}
	}))
);

/** Un completado ya guardado con `fueMinima`, sin aviso y sin tocar el paso en que va la tarea. */
function completedWithMinimal(world: World, task: Task, moment: string, step?: string): void {
	const { id } = recordCompletion(world, dateHour(moment), task, true);
	if (step === undefined) return;
	const stepOnComplete = numeric(step);
	expect(Number.isInteger(stepOnComplete) && stepOnComplete >= 1).toBe(true);
	world.completions = world.completions.map((completion) => (completion.id === id ? { ...completion, stepAtCompletion: stepOnComplete } : completion));
}

/** «Hice la mínima» desde este dispositivo: lo que decide el core, con el aviso y el paso 1 como el checkbox. */
function tapMinimal(world: World, task: Task, moment: Date): void {
	world.checkboxTouched = true;
	// Sin una consulta antes, lo que se afirma después es del momento en que se tocó.
	if (world.statusMoments.length === 0) world.statusMoments = [moment];
	completeMe(world, moment, task, doTheMinimal);
}

/** El otro dispositivo decide con lo que veía; su completado llega a lo guardado. */
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

/** En cada momento consultado, la lista tiene una sola fila y esa es su línea de mínima. */
function theRowShowsMinimal(world: World, line: string | undefined): void {
	expect(world.pendingQueries.length).toBeGreaterThan(0);
	for (const rows of world.pendingQueries) expect(rows.map(({ minimal }) => minimal?.text)).toEqual([line]);
}

const BUTTON_STATUSES: Record<string, boolean> = { habilitado: true, deshabilitado: false };

export const minimalVersionSteps: StepDefinition[] = [
	...editSteps,
	{
		pattern: new RegExp(`^creo una tarea puntual con título ${P} y versión mínima ${P}$`),
		run: (world, title, minimalVersion) => createOneOffWithMinimal(world, { title, minimalVersion })
	},
	{
		pattern: new RegExp(`^creo una tarea periódica relativa con título ${P} cada 2 dias y versión mínima ${P}$`),
		run: (world, title, minimalVersion) => {
			createInWorld(world, { title, every: 2, unit: 'dias', minimalVersion });
			withoutRejection(world);
		}
	},
	{
		pattern: new RegExp(`^creo una tarea periódica semanal con título ${P} los ${P} y versión mínima ${P}$`),
		run: (world, title, days, minimalVersion) => {
			const data = { title, minimalVersion, ...daysOf(shapeOf('semanal los'), days) };
			recordCreation(world, (id) => createRecurringCalendar(data, id, NOW));
			withoutRejection(world);
		}
	},
	{
		pattern: new RegExp(`^creo una tarea puntual con título ${P} y una versión mínima de solo espacios$`),
		run: (world, title) => createOneOffWithMinimal(world, { title, minimalVersion: ONLY_SPACES })
	},
	{
		pattern: new RegExp(`^la versión mínima de la tarea es ${P}$`),
		run: (world, minimalVersion) => savedWithMinimal(world, theTask(world), minimalVersion)
	},
	{
		pattern: new RegExp(`^la versión mínima de la tarea ${TITLE} es ${P}$`),
		run: (world, title, minimalVersion) => savedWithMinimal(world, theTaskTitled(world, title), minimalVersion)
	},
	{
		// Quitar es vaciar el campo: la tarea queda sin versión mínima.
		pattern: /^quito la versión mínima$/,
		run: (world) => {
			editMe(world, withMinimalVersion(''));
			withoutRejection(world);
		}
	},
	{
		pattern: new RegExp(`^${OTHER} quita la versión mínima$`),
		run: (world) => {
			editsOther(world, withMinimalVersion(''));
			withoutRejection(world);
		}
	},
	{
		pattern: new RegExp(`^la tarea tiene versión mínima ${P}$`),
		run: (world, minimalVersion) => expect(theTask(world).minimalVersion).toBe(minimalVersion)
	},
	{
		pattern: /^la tarea no tiene versión mínima$/,
		run: (world) => expect(theDoc(world)).not.toHaveProperty('minimalVersion')
	},
	{
		pattern: new RegExp(`^la tarea tiene una versión mínima de ${P} caracteres$`),
		run: (world, length) => expect(theTask(world).minimalVersion).toHaveLength(numeric(length))
	},
	{
		pattern: new RegExp(`^la fila de la tarea muestra la mínima ${P}$`),
		run: (world, text) => theRowShowsMinimal(world, text)
	},
	{
		pattern: /^la fila de la tarea no muestra mínima$/,
		run: (world) => theRowShowsMinimal(world, undefined)
	},
	{
		pattern: /^el botón Hice la mínima de la tarea está (habilitado|deshabilitado)$/,
		run: (world, status) => {
			expect(Object.hasOwn(BUTTON_STATUSES, status)).toBe(true);
			expect(world.pendingQueries.length).toBeGreaterThan(0);
			for (const rows of world.pendingQueries) expect(rows.map(({ minimal }) => minimal?.enabled)).toEqual([BUTTON_STATUSES[status]]);
		}
	},
	{
		pattern: new RegExp(`^toco Hice la mínima el ${P}$`),
		run: (world, moment) => tapMinimal(world, theTask(world), dateHour(moment))
	},
	{
		pattern: new RegExp(`^toco Hice la mínima en la tarea ${TITLE} el ${P}$`),
		run: (world, title, moment) => tapMinimal(world, theTaskTitled(world, title), dateHour(moment))
	},
	{
		pattern: new RegExp(`^${OTHER} toca Hice la mínima el ${P}$`),
		run: (world, moment) => dueMinimalOther(world, dateHour(moment))
	},
	{
		pattern: new RegExp(`^la tarea fue completada el ${P} con la mínima$`),
		run: (world, moment) => completedWithMinimal(world, theTask(world), moment)
	},
	{
		pattern: new RegExp(`^la tarea ${TITLE} fue completada el ${P} con la mínima$`),
		run: (world, title, moment) => completedWithMinimal(world, theTaskTitled(world, title), moment)
	},
	{
		pattern: new RegExp(`^la tarea fue completada el ${P} en el paso ${P} con la mínima$`),
		run: (world, moment, step) => completedWithMinimal(world, theTask(world), moment, step)
	},
	{
		pattern: /^el último completado de la tarea fue la mínima$/,
		run: (world) => expect(theLastCompletion(world).wasMinimal).toBe(true)
	},
	{
		pattern: /^el último completado de la tarea fue entero$/,
		run: (world) => expect(theLastCompletion(world)).not.toHaveProperty('wasMinimal')
	},
	{
		pattern: new RegExp(`^el aviso del completado dice ${P}$`),
		run: (world, text) => {
			const notice = world.noticeQueried?.notice;
			expect(notice).toBeDefined();
			expect(noticeText(notice!)).toBe(text);
		}
	},
	{
		pattern: /^la tarea tiene dos completados, uno entero y uno de la mínima$/,
		run: (world) => {
			const completions = completionsOfTask(world.completions, theTask(world).id);
			expect(completions.map(({ wasMinimal }) => wasMinimal === true).sort()).toEqual([false, true]);
		}
	}
];
