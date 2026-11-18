// Steps of the task (spec §4.1 Pasos, §4.4, §6.1, §6.2, §7): the first step is step 1 and `steps` stores the
// rest; `currentStep` is the step the task is on. Never invalid; «Hecho» and «Paso anterior» move the progress.
import { expect } from 'vitest';
import { latestCompletion, completionsOfTask, complete } from '../../src/lib/core/completions';
import { createOneOff, type OneOffData } from '../../src/lib/core/create-one-off';
import { createRecurringCalendar } from '../../src/lib/core/create-recurring-calendar';
import { taskData } from '../../src/lib/core/task-data';
import { applyChange, type TaskChange } from '../../src/lib/core/task-document';
import { doneAction, changeOnComplete, previousStepChange, type StepButtons } from '../../src/lib/core/current-step';
import { stepItIsOn, taskSteps } from '../../src/lib/core/steps';
import type { Task } from '../../src/lib/core/task';
import { NOW, createInWorld, recordCreation } from './create';
import { editsOther, editMe } from './editing';
import { daysOf, shapeOf } from './recurring-calendar';
import { completeMe, recordCompletion } from './recurring-relative';
import { P, TITLE, dateHour, list, numeric } from './values';
import { OTHER, theDoc, theTask, theTaskTitled, thatSawOther, newId, rememberBeforeOfMyChange, type StepDefinition, type World } from './world';

/** A step number: written in the step or as `<placeholder>`. */
const N = '(\\d+|<[A-Za-z0-9_]+>)';

const ONLY_SPACES = '   ';

/** A step number is an integer from 1 (§4.1): a malformed value fails the scenario. */
function stepNumber(value: string): number {
	if (!/^[1-9]\d*$/.test(value)) throw new Error(`Invalid step: "${value}"`);
	return Number(value);
}

/** A save with steps is accepted: it never rejects (§4.1). */
function withoutRejection(world: World): void {
	expect(world.errors).toBeUndefined();
}

/** The full list ("A, B, C") as the first step plus the other steps. */
function listData(text: string, extra: string[] = []) {
	const [firstStep, ...steps] = list(text);
	return { firstStep, steps: [...steps, ...extra] };
}

function createOneOffWithSteps(world: World, data: OneOffData): void {
	recordCreation(world, (id) => createOneOff(data, id, NOW));
	withoutRejection(world);
}

/** Leaves the task already saved with those steps, without going through editing (it is not a change "de mi lado"). */
function savedWithSteps(world: World, task: Task, text: string): void {
	const { firstStep, steps } = listData(text);
	world.docs = world.docs.map((doc) => {
		if (doc.id !== task.id) return doc;
		const { steps: _previous, ...rest } = doc;
		return { ...rest, firstStep, ...(steps.length > 0 && { steps }) };
	});
}

/** Leaves the task already saved on that step; step 1 is the one without a field (§4.1). */
function savedInStep(world: World, task: Task, step: number): void {
	world.docs = world.docs.map((doc) => {
		if (doc.id !== task.id) return doc;
		const { currentStep: _previous, ...rest } = doc;
		return step === 1 ? rest : { ...rest, currentStep: step };
	});
}

/** The task's list of steps with step `number` changed; one more than the count appends it at the end. */
function withStep(task: Task, numeric: number, text: string): string[] {
	const steps = taskSteps(task);
	if (numeric < 1 || numeric > steps.length + 1) throw new Error(`There is no step ${numeric}`);
	return numeric === steps.length + 1 ? [...steps, text] : steps.map((step, place) => (place === numeric - 1 ? text : step));
}

/** The task data with that list of steps written; the rest as it was. */
const withSteps = (steps: readonly string[]) => (task: Task) => {
	const [firstStep = '', ...more] = steps;
	return { ...taskData(task), firstStep, steps: more };
};

/** Each form of step change: "<subject> el paso N a ...". */
const CHANGES: { text: string; value: (...values: string[]) => string }[] = [
	{ text: P, value: (step) => step },
	{ text: `${P} con espacios al inicio y al final`, value: (step) => `  ${step}  ` },
	{ text: 'uno de solo espacios', value: () => ONLY_SPACES },
	{ text: `uno de ${P} caracteres`, value: (length) => 'x'.repeat(numeric(length)) }
];

const EDITORS = [
	{ subject: 'edito', edit: editMe },
	{ subject: `${OTHER} edita`, edit: editsOther }
];

const editSteps: StepDefinition[] = EDITORS.flatMap(({ subject, edit }) =>
	CHANGES.map(({ text, value }) => ({
		pattern: new RegExp(`^${subject} el paso ${N} a ${text}$`),
		run: (world: World, step: string, ...values: string[]) => {
			edit(world, (task) => withSteps(withStep(task, numeric(step), value(...values)))(task));
			withoutRejection(world);
		}
	}))
);

/** Moving to a step or completing from the row: what the core decides, written as that device would. */
function tapDone(world: World, task: Task, moment: Date): void {
	world.checkboxTouched = true;
	// Without a prior query, what is asserted afterwards belongs to the moment of the tap.
	if (world.statusMoments.length === 0) world.statusMoments = [moment];
	const action = doneAction(task, world.completions, moment);
	if (action.kind === 'complete') return completeMe(world, moment, task);
	if (action.kind === 'advance') {
		rememberBeforeOfMyChange(world);
		writeChange(world, task, action.change);
	}
}

function writeChange(world: World, task: Task, change: TaskChange): void {
	world.docs = applyChange(world.docs, task.id, change);
}

/** The other device decides with what it saw; its change reaches what is stored. */
function dueDoneOther(world: World, moment: Date): void {
	const seen = thatSawOther(world);
	const task = theTask(seen);
	const action = doneAction(task, seen.completions, moment);
	if (action.kind === 'advance') writeChange(world, task, action.change);
	if (action.kind === 'complete') {
		world.completions = [...world.completions, complete(task, seen.completions, newId(world, 'completado'), moment)];
		writeChange(world, task, changeOnComplete(task));
	}
}

const buttonsText = ({ previousStep: stepPrevious }: StepButtons) => (stepPrevious ? 'Paso anterior y Hecho' : 'Hecho');

/** At each queried moment, the list has a single row and its step buttons are those. */
function theRowShowsButtons(world: World, expected: string | undefined): void {
	expect(world.pendingQueries.length).toBeGreaterThan(0);
	for (const rows of world.pendingQueries) expect(rows.map(({ stepButtons }) => stepButtons && buttonsText(stepButtons))).toEqual([expected]);
}

const BUTTON_STATUSES: Record<string, boolean> = { habilitado: true, deshabilitado: false };

export const taskStepsSteps: StepDefinition[] = [
	...editSteps,
	{
		pattern: new RegExp(`^creo una tarea puntual con título ${P} y pasos ${P}$`),
		run: (world, title, steps) => createOneOffWithSteps(world, { title, ...listData(steps) })
	},
	{
		pattern: new RegExp(`^creo una tarea puntual con título ${P} y pasos ${P} y un paso más de solo espacios$`),
		run: (world, title, steps) => createOneOffWithSteps(world, { title, ...listData(steps, [ONLY_SPACES]) })
	},
	{
		pattern: new RegExp(`^creo una tarea periódica relativa con título ${P} cada 2 dias y pasos ${P}$`),
		run: (world, title, steps) => {
			createInWorld(world, { title, every: 2, unit: 'dias', ...listData(steps) });
			withoutRejection(world);
		}
	},
	{
		pattern: new RegExp(`^creo una tarea periódica semanal con título ${P} los ${P} y pasos ${P}$`),
		run: (world, title, days, steps) => {
			const data = { title, ...listData(steps), ...daysOf(shapeOf('semanal los'), days) };
			recordCreation(world, (id) => createRecurringCalendar(data, id, NOW));
			withoutRejection(world);
		}
	},
	{
		pattern: new RegExp(`^los pasos de la tarea son ${P}$`),
		run: (world, steps) => savedWithSteps(world, theTask(world), steps)
	},
	{
		pattern: new RegExp(`^los pasos de la tarea ${TITLE} son ${P}$`),
		run: (world, title, steps) => savedWithSteps(world, theTaskTitled(world, title), steps)
	},
	{
		pattern: new RegExp(`^el paso actual de la tarea es ${P}$`),
		run: (world, current) => savedInStep(world, theTask(world), stepNumber(current))
	},
	{
		// A completion with stepAtCompletion (§4.4) without touching the step the task is on.
		pattern: new RegExp(`^la tarea fue completada el ${P} en el paso ${P}$`),
		run: (world, moment, step) => {
			const { id } = recordCompletion(world, dateHour(moment));
			world.completions = world.completions.map((completion) => (completion.id === id ? { ...completion, stepAtCompletion: stepNumber(step) } : completion));
		}
	},
	{
		pattern: new RegExp(`^vacío el paso ${N}$`),
		run: (world, step) => {
			editMe(world, (task) => withSteps(withStep(task, numeric(step), ''))(task));
			withoutRejection(world);
		}
	},
	{
		pattern: new RegExp(`^edito la tarea con ${P} pasos$`),
		run: (world, count) => {
			editMe(world, withSteps(Array.from({ length: numeric(count) }, (_, place) => `Paso ${place + 1}`)));
			withoutRejection(world);
		}
	},
	{
		pattern: new RegExp(`^toco Hecho el ${P}$`),
		run: (world, moment) => tapDone(world, theTask(world), dateHour(moment))
	},
	{
		pattern: new RegExp(`^toco Hecho en la tarea ${TITLE} el ${P}$`),
		run: (world, title, moment) => tapDone(world, theTaskTitled(world, title), dateHour(moment))
	},
	{
		pattern: /^toco Paso anterior$/,
		run: (world) => {
			const task = theTask(world);
			rememberBeforeOfMyChange(world);
			writeChange(world, task, previousStepChange(task));
		}
	},
	{
		pattern: new RegExp(`^${OTHER} toca Hecho el ${P}$`),
		run: (world, moment) => dueDoneOther(world, dateHour(moment))
	},
	{
		pattern: new RegExp(`^la tarea tiene los pasos ${P}$`),
		run: (world, steps) => expect(taskSteps(theTask(world))).toEqual(list(steps))
	},
	{
		pattern: /^la tarea no tiene más pasos$/,
		run: (world) => expect(theDoc(world)).not.toHaveProperty('steps')
	},
	{
		pattern: new RegExp(`^la tarea tiene ${P} pasos$`),
		run: (world, count) => expect(taskSteps(theTask(world))).toHaveLength(numeric(count))
	},
	{
		pattern: new RegExp(`^el paso ${N} de la tarea tiene ${P} caracteres$`),
		run: (world, step, length) => expect(taskSteps(theTask(world))[numeric(step) - 1]).toHaveLength(numeric(length))
	},
	{
		pattern: new RegExp(`^la tarea va en el paso ${N}$`),
		run: (world, step) => expect(stepItIsOn(theTask(world))).toBe(numeric(step))
	},
	{
		pattern: new RegExp(`^el último completado de la tarea guarda el paso ${P}$`),
		run: (world, step) => expect(latestCompletion(completionsOfTask(world.completions, theTask(world).id)).stepAtCompletion).toBe(numeric(step))
	},
	{
		pattern: /^el último completado de la tarea no guarda paso$/,
		run: (world) => {
			const completions = completionsOfTask(world.completions, theTask(world).id);
			expect(completions.length).toBeGreaterThan(0);
			expect(latestCompletion(completions)).not.toHaveProperty('stepAtCompletion');
		}
	},
	{
		pattern: new RegExp(`^la fila de la tarea muestra el paso ${P}$`),
		run: (world, text) => {
			expect(world.pendingQueries.length).toBeGreaterThan(0);
			for (const rows of world.pendingQueries) expect(rows.map(({ firstStepText: textOfFirstStep }) => textOfFirstStep)).toEqual([text]);
		}
	},
	{
		pattern: new RegExp(`^la fila de la tarea muestra los botones ${P}$`),
		run: (world, buttons) => theRowShowsButtons(world, buttons)
	},
	{
		pattern: /^la fila de la tarea no muestra botones de paso$/,
		run: (world) => theRowShowsButtons(world, undefined)
	},
	{
		pattern: new RegExp(`^el botón Hecho de la tarea está ${P}$`),
		run: (world, status) => {
			expect(Object.hasOwn(BUTTON_STATUSES, status)).toBe(true);
			expect(world.pendingQueries.length).toBeGreaterThan(0);
			for (const rows of world.pendingQueries) expect(rows.map(({ stepButtons }) => stepButtons?.doneEnabled)).toEqual([BUTTON_STATUSES[status]]);
		}
	}
];
