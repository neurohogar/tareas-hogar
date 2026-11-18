// Horario de la tarea (spec §4.1, §6.1, §6.2) y sus conflictos entre dispositivos (§7).
// "la tarea se puede completar de D a H [y de D2 a H2]" es un horario ya guardado.
import { expect } from 'vitest';
import { createFromData, taskData, type TaskData } from '../../src/lib/core/task-data';
import { scheduleText, type TypedSchedule } from '../../src/lib/core/schedule';
import type { Task } from '../../src/lib/core/task';
import { NOW, TITLE_VALID, recordCreation } from './create';
import { editsOther, editAndSave, editMe } from './editing';
import { daysOf } from './recurring-calendar';
import { P, TITLE, numeric, unit } from './values';
import { OTHER, theTask, theTaskTitled, type StepDefinition, type World } from './world';

/** Una o dos ventanas: "de D a H" o "de D a H y de D2 a H2". */
const SCHEDULE = `de ${P} a ${P}(?: y de ${P} a ${P})?`;

/** Las ventanas del paso; la segunda, si el paso la nombra. */
function scheduleOf(from: string, to: string, from2?: string, to2?: string): TypedSchedule {
	return from2 === undefined ? [{ from, to }] : [{ from, to }, { from: from2, to: to2 }];
}

/** Lo que carga el panel: los valores de la tarea con otro horario, o sin horario. */
function withSchedule(schedule: TypedSchedule | undefined, fields: Partial<TaskData> = {}) {
	return (task: Task): TaskData => {
		const { schedule: _, ...withoutSchedule } = taskData(task);
		return { ...withoutSchedule, ...fields, ...(schedule && { schedule }) } as TaskData;
	};
}

const create = (world: World, data: TaskData) => recordCreation(world, (id) => createFromData(data, id, NOW));

/** Quién cambia el horario: yo, o el otro dispositivo sin ver mi último cambio. */
const EDITORS = [
	{ puts: 'pongo', removes: 'quito', edit: editMe },
	{ puts: `${OTHER} pone`, removes: `${OTHER} quita`, edit: editsOther }
];

const editSteps: StepDefinition[] = EDITORS.flatMap(({ puts, removes, edit }) => [
	{
		pattern: new RegExp(`^${puts} el horario ${SCHEDULE}$`),
		run: (world: World, from: string, to: string, from2?: string, to2?: string) =>
			edit(world, withSchedule(scheduleOf(from, to, from2, to2)))
	},
	{
		pattern: new RegExp(`^${removes} el horario$`),
		run: (world: World) => edit(world, withSchedule(undefined))
	}
]);

/** Un horario ya guardado: no es un cambio de este dispositivo. */
function saveSchedule(world: World, task: Task, schedule: TypedSchedule): void {
	editAndSave(world, task, withSchedule(schedule));
	expect(world.errors, 'el horario ya guardado debe ser válido').toBeUndefined();
}

export const scheduleSteps: StepDefinition[] = [
	...editSteps,
	{
		pattern: new RegExp(`^la tarea se puede completar ${SCHEDULE}$`),
		run: (world, from, to, from2, to2) => saveSchedule(world, theTask(world), scheduleOf(from, to, from2, to2))
	},
	{
		pattern: new RegExp(`^la tarea ${TITLE} se puede completar ${SCHEDULE}$`),
		run: (world, title, from, to, from2, to2) =>
			saveSchedule(world, theTaskTitled(world, title), scheduleOf(from, to, from2, to2))
	},
	{
		// El documento tal como lo dejaba la versión con una sola ventana: el horario es un objeto.
		pattern: new RegExp(`^una tarea puntual sin fecha límite guardada en el formato anterior con horario de ${P} a ${P}$`),
		run: (world, from, to) => {
			create(world, { shape: 'puntual', title: 'Tarea' });
			world.docs = world.docs.map((doc) => ({ ...doc, schedule: { from, to } }));
		}
	},
	{
		pattern: new RegExp(`^creo una tarea puntual con título ${P} y horario ${SCHEDULE}$`),
		run: (world, title, from, to, from2, to2) =>
			create(world, { shape: 'puntual', title, schedule: scheduleOf(from, to, from2, to2) })
	},
	{
		pattern: new RegExp(`^creo una tarea puntual con un título válido y horario ${SCHEDULE}$`),
		run: (world, from, to, from2, to2) =>
			create(world, { shape: 'puntual', title: TITLE_VALID, schedule: scheduleOf(from, to, from2, to2) })
	},
	{
		pattern: new RegExp(`^creo una tarea puntual con un título válido y un horario con solo la hora de inicio ${P}$`),
		run: (world, from) => create(world, { shape: 'puntual', title: TITLE_VALID, schedule: [{ from }] })
	},
	{
		pattern: new RegExp(`^creo una tarea puntual con un título válido y un horario con solo la hora de fin ${P}$`),
		run: (world, to) => create(world, { shape: 'puntual', title: TITLE_VALID, schedule: [{ to }] })
	},
	{
		pattern: new RegExp(`^creo una tarea puntual con un título válido, horario de ${P} a ${P} y otro horario con solo la hora de inicio ${P}$`),
		run: (world, from, to, from2) =>
			create(world, { shape: 'puntual', title: TITLE_VALID, schedule: [{ from, to }, { from: from2 }] })
	},
	{
		pattern: new RegExp(`^creo una tarea periódica relativa con título ${P} cada ${P} ${P} y horario ${SCHEDULE}$`),
		run: (world, title, every, u, from, to, from2, to2) =>
			create(world, { shape: 'relativa', title, every: numeric(every), unit: unit(u), schedule: scheduleOf(from, to, from2, to2) })
	},
	{
		pattern: new RegExp(`^creo una tarea periódica semanal con título ${P} los ${P} y horario ${SCHEDULE}$`),
		run: (world, title, days, from, to, from2, to2) =>
			create(world, { shape: 'calendario', title, ...daysOf('semanal', days), schedule: scheduleOf(from, to, from2, to2) })
	},
	{
		pattern: new RegExp(`^pongo un horario con solo la hora de inicio ${P}$`),
		run: (world, from) => editMe(world, withSchedule([{ from }]))
	},
	{
		pattern: new RegExp(`^edito en una misma edición el título a ${P} y el horario ${SCHEDULE}$`),
		run: (world, title, from, to, from2, to2) => editMe(world, withSchedule(scheduleOf(from, to, from2, to2), { title }))
	},
	{
		pattern: new RegExp(`^la tarea tiene horario ${SCHEDULE}$`),
		run: (world, from, to, from2, to2) => expect(theTask(world).schedule).toStrictEqual(scheduleOf(from, to, from2, to2))
	},
	{
		pattern: /^la tarea no tiene horario$/,
		run: (world) => expect(theTask(world)).not.toHaveProperty('schedule')
	},
	{
		pattern: new RegExp(`^la fila de la tarea muestra el horario ${P}$`),
		run: (world, text) => expect(scheduleText(theTask(world).schedule ?? [])).toBe(text)
	},
	{
		pattern: /^la (?:creación|edición) se rechaza porque la hora de fin no es posterior a la de inicio$/,
		run: (world) => expect(world.errors).toEqual({ schedule: 'finNoPosterior' })
	}
];
