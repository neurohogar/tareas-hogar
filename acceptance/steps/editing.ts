// Editar y borrar tareas (spec §6.2) y conflictos entre dispositivos (§7).
// "otro dispositivo, sin ver ese cambio, ..." actúa sobre lo guardado antes
// de mi último cambio, y su cambio llega después del mío.
import { expect } from 'vitest';
import { deletion, orphanCompletions } from '../../src/lib/core/deletion';
import { completionsOfTask, complete } from '../../src/lib/core/completions';
import { taskData, type TaskData } from '../../src/lib/core/task-data';
import { applyChange } from '../../src/lib/core/task-document';
import { edit } from '../../src/lib/core/editing';
import { changeOnComplete } from '../../src/lib/core/current-step';
import type { Task } from '../../src/lib/core/task';
import { DAYS_VALID, SHAPE_AND_DAYS, WITHOUT_DAYS, daysOf, shapeOf } from './recurring-calendar';
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

/** Los datos nuevos que se cargan en el panel, a partir de la tarea que se edita. */
type DataNew = (task: Task) => TaskData;

/** Quién edita y qué tarea elige, según lo que ve. */
interface Editor {
	subject: string;
	/** El sujeto nombra la tarea por su título (la primera captura). */
	namesTask: boolean;
	edit: (world: World, data: DataNew, title?: string) => void;
}

/** `ahora`: el momento de guardar, si el paso lo da (pasar una pausada a puntual la reanuda, §5.8). */
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

/** Borra la tarea y los completados y anotaciones suyos que conoce quien borra (§6.2, §7). */
function remove(world: World, task: Task, completionsKnown: Saved['completions']): void {
	const { taskId, completionIds, annotationIds } = deletion(task.id, completionsKnown, world.annotations);
	deleteSaved(world, [taskId], completionIds, annotationIds);
}

const EDITORS: Editor[] = [
	{ subject: 'edito la tarea', namesTask: false, edit: editMe },
	{ subject: `edito la tarea ${TITLE}`, namesTask: true, edit: editMe },
	{ subject: `${OTHER} edita la tarea`, namesTask: false, edit: editsOther }
];

/** Cada forma de "... a <definición>": los datos que carga, con el título actual. */
const DEFINITIONS: { text: string; data: (title: string, ...values: string[]) => TaskData }[] = [
	{
		text: `puntual con fecha límite ${P}`,
		data: (title, dueDate) => ({ shape: 'puntual', title, dueDate })
	},
	{ text: 'puntual sin fecha límite', data: (title) => ({ shape: 'puntual', title }) },
	{
		text: `periódica relativa cada ${P} ${P}`,
		data: (title, every, u) => ({ shape: 'relativa', title, every: numeric(every), unit: unit(u) })
	},
	{
		text: `periódica ${SHAPE_AND_DAYS}`,
		data: (title, shapeAndConnector, days) => ({ shape: 'calendario', title, ...daysOf(shapeOf(shapeAndConnector), days) })
	},
	{ text: 'periódica (?:semanal|mensual) sin días', data: (title) => ({ shape: 'calendario', title, ...WITHOUT_DAYS }) },
	{
		text: 'periódica de calendario con días de la semana y del mes a la vez',
		data: (title) => ({
			shape: 'calendario',
			title,
			weekdays: DAYS_VALID.semanal.weekdays,
			monthDays: DAYS_VALID.mensual.monthDays
		})
	}
];

/** Cambiar el tipo en el panel deja como estaban el emoji, la nota, los pasos, la versión mínima y el horario. */
function fieldsThatKeeps(task: Task): Pick<TaskData, 'emoji' | 'note' | 'firstStep' | 'steps' | 'minimalVersion' | 'schedule'> {
	const { emoji, note, firstStep, steps, minimalVersion, schedule } = taskData(task);
	return { ...(emoji && { emoji }), ...(note && { note }), ...(firstStep && { firstStep }), ...(steps && { steps }), ...(minimalVersion && { minimalVersion }), ...(schedule && { schedule }) };
}

const stepsOfEditA: StepDefinition[] = EDITORS.flatMap((editor) =>
	DEFINITIONS.map(({ text, data }) => ({
		pattern: new RegExp(`^${editor.subject} a ${text}$`),
		run: (world: World, ...values: string[]) => {
			const title = editor.namesTask ? values.shift() : undefined;
			editor.edit(world, (task) => ({ ...fieldsThatKeeps(task), ...data(task.title, ...values) }), title);
		}
	}))
);

const withTitle = (title: string) => (task: Task) => ({ ...taskData(task), title });

/**
 * La tarea tiene un solo completado, de ese momento. Si es de calendario lleva
 * además su ocurrenciaCubierta (§5.3) y, si fue la mínima, su fueMinima (§4.4), que este paso no afirma; ningún otro campo.
 */
function theOnlyCompletionIs(world: World, task: Task, completed: string): void {
	const completions = completionsOfTask(world.completions, task.id);
	expect(completions).toHaveLength(1);
	const { coveredOccurrence: occurrenceCovered, wasMinimal, ...rest } = completions[0];
	expect(rest).toStrictEqual({ id: expect.any(String), taskId: task.id, completedAt: dateHour(completed) });
	if (occurrenceCovered !== undefined) expect(occurrenceCovered).toBeInstanceOf(Date);
	// Si fue la mínima (§4.4), lo afirman los pasos de la mínima; solo se escribe en true.
	if (wasMinimal !== undefined) expect(wasMinimal).toBe(true);
}

/** La tarea con ese título, aunque ya se haya borrado. */
const theOneThatHadBefore = (world: World, title: string) => theTaskTitled(thatWasSaved(world), title);

export const editingSteps: StepDefinition[] = [
	...stepsOfEditA,
	{
		pattern: new RegExp(`^edito la tarea a puntual sin fecha límite el ${P}$`),
		run: (world, moment) =>
			editMe(world, (task) => ({ ...fieldsThatKeeps(task), shape: 'puntual', title: task.title }), undefined, dateHour(moment))
	},
	{
		pattern: new RegExp(`^edito el título a ${P}$`),
		run: (world, title) => editMe(world, withTitle(title))
	},
	{
		pattern: /^edito el título a uno de solo espacios$/,
		run: (world) => editMe(world, withTitle('   '))
	},
	{
		pattern: new RegExp(`^${OTHER} edita el título a ${P}$`),
		run: (world, title) => editsOther(world, withTitle(title))
	},
	{
		pattern: new RegExp(`^edito en una misma edición el título a ${P} y la fecha límite a ${P}$`),
		run: (world, title, dueDate) => editMe(world, () => ({ shape: 'puntual', title, dueDate }))
	},
	{
		pattern: new RegExp(`^${OTHER} edita el título de la tarea ${TITLE} a ${TITLE}$`),
		run: (world, title, updated) => editAndSave(world, theTaskTitled(thatSawOther(world), title), withTitle(updated))
	},
	{
		pattern: new RegExp(`^${OTHER} guarda la tarea sin cambios$`),
		run: (world) => editsOther(world, taskData)
	},
	{
		pattern: /^borro la tarea$/,
		run: (world) => {
			rememberBeforeOfMyChange(world);
			remove(world, theTask(world), world.completions);
		}
	},
	{
		pattern: new RegExp(`^borro la tarea ${TITLE}$`),
		run: (world, title) => {
			rememberBeforeOfMyChange(world);
			remove(world, theTaskTitled(world, title), world.completions);
		}
	},
	{
		pattern: new RegExp(`^${OTHER} borra la tarea$`),
		run: (world) => {
			const seen = thatSawOther(world);
			remove(world, theTask(seen), seen.completions);
		}
	},
	{
		pattern: new RegExp(`^${OTHER} completa la tarea ${TITLE} el ${P}$`),
		run: (world, title, moment) => {
			const seen = thatSawOther(world);
			const task = theTaskTitled(seen, title);
			const completion = complete(task, seen.completions, newId(world, 'completado'), dateHour(moment));
			world.completions = [...world.completions, completion];
			// Completar, desde cualquier dispositivo, vuelve la tarea al paso 1 (§4.1, Pasos).
			world.docs = applyChange(world.docs, task.id, changeOnComplete(task));
		}
	},
	{
		pattern: /^la tarea no cambia$/,
		run: (world) => expect(world.docs).toStrictEqual(thatSawOther(world).docs)
	},
	{
		pattern: /^la tarea es (puntual|periódica)$/,
		run: (world, kind) => expect(theTask(world).kind).toBe(kind === 'puntual' ? 'puntual' : 'periodica')
	},
	{
		pattern: /^la tarea no tiene recurrencia$/,
		run: (world) => expect(theDoc(world)).not.toHaveProperty('recurrence')
	},
	{
		pattern: new RegExp(`^la tarea tiene título ${P}$`),
		run: (world, title) => expect(theTask(world).title).toBe(title)
	},
	{
		pattern: new RegExp(`^la tarea sigue creada el ${P}$`),
		run: (world, created) => expect(theTask(world).createdAt).toEqual(dateHour(created))
	},
	{
		pattern: /^la tarea conserva su id$/,
		run: (world) => expect(theTask(world).id).toBe(theTask(thatSawOther(world)).id)
	},
	{
		pattern: new RegExp(`^la tarea conserva un solo completado, del ${P}$`),
		run: (world, completed) => theOnlyCompletionIs(world, theTask(world), completed)
	},
	{
		pattern: new RegExp(`^la tarea ${TITLE} conserva un solo completado, del ${P}$`),
		run: (world, title, completed) => theOnlyCompletionIs(world, theTaskTitled(world, title), completed)
	},
	{
		pattern: new RegExp(`^no existe la tarea ${TITLE}$`),
		run: (world, title) => {
			const id = theOneThatHadBefore(world, title).id;
			expect(world.docs.map((doc) => doc.id)).not.toContain(id);
			expect(tasksOf(world).map((task) => task.title)).not.toContain(title);
		}
	},
	{
		pattern: new RegExp(`^no queda ningún completado de ${TITLE}$`),
		run: (world, title) => expect(completionsOfTask(world.completions, theOneThatHadBefore(world, title).id)).toEqual([])
	},
	{
		pattern: /^no queda ninguna tarea$/,
		run: (world) => expect(world.docs).toEqual([])
	},
	{
		pattern: new RegExp(`^los completados huérfanos a limpiar son solo el de ${TITLE} del ${P}$`),
		run: (world, title, completed) => {
			expect(orphanCompletions(tasksOf(world), world.completions)).toEqual([
				{ id: expect.any(String), taskId: theOneThatHadBefore(world, title).id, completedAt: dateHour(completed) }
			]);
		}
	}
];
