import { expect } from 'vitest';
import {
	createRecurringCalendar,
	type RecurringCalendarData
} from '../../src/lib/core/create-recurring-calendar';
import type { Completion, CoveredOccurrence, Task } from '../../src/lib/core/task';
import { NOW, SCENARIO_BEFORE, TITLE_VALID, recordCreation } from './create';
import { P, TITLE, monthDays, weekdays, date, dateHour, occurrence } from './values';
import { theTask, theTaskOfKind, theTaskTitled, newId, type StepDefinition, type World } from './world';

export type Shape = 'semanal' | 'mensual';

/** How the days of each form are named: "los martes" or "los días 10". */
const CONNECTOR: Record<Shape, string> = { semanal: 'los', mensual: 'los días' };
export const SHAPE_AND_DAYS = `(semanal los|mensual los días) ${P}`;
/** "semanal Basura los martes": the title goes between the shape and the connector. */
const SHAPE_TITLE_AND_DAYS = `(semanal|mensual) ${TITLE} (los|los días) ${P}`;

export const DAYS_VALID: Record<Shape, Pick<RecurringCalendarData, 'weekdays' | 'monthDays'>> = {
	semanal: { weekdays: ['martes'], monthDays: [] },
	mensual: { weekdays: [], monthDays: [15] }
};
export const WITHOUT_DAYS = { weekdays: [], monthDays: [] };

export function daysOf(shape: Shape, days: string): Pick<RecurringCalendarData, 'weekdays' | 'monthDays'> {
	return shape === 'semanal' ? { weekdays: weekdays(days), monthDays: [] } : { weekdays: [], monthDays: monthDays(days) };
}

/** "semanal los" or "mensual los días": the shape, validating that the connector corresponds to it. */
export function shapeOf(shapeAndConnector: string): Shape {
	const [shape] = shapeAndConnector.split(' ') as [Shape];
	if (`${shape} ${CONNECTOR[shape]}` !== shapeAndConnector) throw new Error(`Invalid shape: "${shapeAndConnector}"`);
	return shape;
}

function create(world: World, data: RecurringCalendarData, now = NOW): void {
	recordCreation(world, (id) => createRecurringCalendar(data, id, now));
}

/** Completion already saved (for example, synced), with its coveredOccurrence as is. */
function addCompletion(world: World, completedAt: Date, occurrenceCovered: CoveredOccurrence, task: Task = theTask(world)): void {
	const completion: Completion = {
		id: newId(world, 'completado'),
		taskId: task.id,
		completedAt,
		coveredOccurrence: occurrenceCovered
	};
	world.completions = [...world.completions, completion];
}

const DAY_MS = 86_400_000;

function theLastCompletion(world: World): Completion {
	const last = world.completions.at(-1);
	if (!last) throw new Error('The task has no completions');
	return last;
}

export const recurringCalendarSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^creo una tarea periódica (semanal|mensual) con título ${P} (los|los días) ${P}$`),
		run: (world, shape, title, connector, days) => {
			const theShape = shapeOf(`${shape} ${connector}`);
			create(world, { title, ...daysOf(theShape, days) });
		}
	},
	{
		pattern: new RegExp(`^creo una tarea periódica (semanal|mensual) con título ${P} y días válidos$`),
		run: (world, shape, title) => create(world, { title, ...DAYS_VALID[shape as Shape] })
	},
	{
		pattern: /^creo una tarea periódica (semanal|mensual) con un título de solo espacios y días válidos$/,
		run: (world, shape) => create(world, { title: '   ', ...DAYS_VALID[shape as Shape] })
	},
	{
		pattern: /^creo una tarea periódica (semanal|mensual) con un título válido y sin días$/,
		run: (world) => create(world, { title: TITLE_VALID, ...WITHOUT_DAYS })
	},
	{
		pattern: new RegExp(`^creo una tarea periódica mensual con un título válido los días ${P}$`),
		run: (world, days) => create(world, { title: TITLE_VALID, ...daysOf('mensual', days) })
	},
	{
		pattern:
			/^creo una tarea periódica de calendario con un título válido y días de la semana y del mes a la vez$/,
		run: (world) =>
			create(world, {
				title: TITLE_VALID,
				weekdays: DAYS_VALID.semanal.weekdays,
				monthDays: DAYS_VALID.mensual.monthDays
			})
	},
	{
		pattern: new RegExp(`^su recurrencia es ${SHAPE_AND_DAYS}$`),
		run: (world, shapeAndConnector, days) => {
			const shape = shapeOf(shapeAndConnector);
			const { weekdays: week, monthDays: month } = daysOf(shape, days);
			const expected = shape === 'semanal' ? { weekdays: week } : { monthDays: month };
			expect(theTaskOfKind(world, 'periodica').recurrence).toStrictEqual({ mode: 'calendario', ...expected });
		}
	},
	{
		pattern: new RegExp(`^una tarea periódica ${SHAPE_AND_DAYS} creada el ${P}$`),
		run: (world, shapeAndConnector, days, created) =>
			create(world, { title: 'Tarea', ...daysOf(shapeOf(shapeAndConnector), days) }, dateHour(created))
	},
	{
		pattern: new RegExp(`^una tarea periódica ${SHAPE_AND_DAYS}$`),
		run: (world, shapeAndConnector, days) => create(world, { title: 'Tarea', ...daysOf(shapeOf(shapeAndConnector), days) })
	},
	{
		pattern: new RegExp(`^una tarea periódica ${SHAPE_TITLE_AND_DAYS}$`),
		run: (world, shape, title, connector, days) =>
			create(world, { title, ...daysOf(shapeOf(`${shape} ${connector}`), days) }, SCENARIO_BEFORE)
	},
	{
		pattern: new RegExp(`^una tarea periódica ${SHAPE_TITLE_AND_DAYS} creada el ${P}$`),
		run: (world, shape, title, connector, days, created) =>
			create(world, { title, ...daysOf(shapeOf(`${shape} ${connector}`), days) }, dateHour(created))
	},
	{
		pattern: new RegExp(`^la tarea ${TITLE} tiene un completado que cubre el ${P}$`),
		run: (world, title, covered) =>
			addCompletion(world, date(covered), date(covered), theTaskTitled(world, title))
	},
	{
		pattern: new RegExp(`^la tarea ${TITLE} tiene un completado del ${P} que cubre el ${P}$`),
		run: (world, title, completed, covered) =>
			addCompletion(world, dateHour(completed), occurrence(covered), theTaskTitled(world, title))
	},
	{
		pattern: new RegExp(`^la tarea tiene un completado del ${P} que cubre el ${P}$`),
		run: (world, completed, covered) => addCompletion(world, dateHour(completed), occurrence(covered))
	},
	{
		// The moment does not influence the result: the start of the covered day is used.
		pattern: new RegExp(`^la tarea tiene un completado que cubre el ${P}$`),
		run: (world, covered) => addCompletion(world, date(covered), date(covered))
	},
	{
		pattern: /^la tarea tiene otro completado más antiguo que cubre la misma ocurrencia$/,
		run: (world) => {
			const last = theLastCompletion(world);
			if (!last.coveredOccurrence) throw new Error('The last completion does not cover any occurrence');
			addCompletion(world, new Date(last.completedAt.getTime() - DAY_MS), last.coveredOccurrence);
		}
	},
	{
		pattern: new RegExp(`^se registró un completado que cubre el ${P}$`),
		run: (world, covered) => {
			const { wasMinimal, ...rest } = world.newCompletion ?? {};
			expect(rest).toStrictEqual({
				id: expect.any(String),
				taskId: theTask(world).id,
				completedAt: world.momentOfNewCompletion,
				coveredOccurrence: occurrence(covered)
			});
			// That it was the minimal one (§4.4) is asserted by the minimal-version steps; it is only ever written as true.
			if (wasMinimal !== undefined) expect(wasMinimal).toBe(true);
		}
	}
];
