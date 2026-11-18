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

/** Cómo se nombran los días de cada forma: "los martes" o "los días 10". */
const CONNECTOR: Record<Shape, string> = { semanal: 'los', mensual: 'los días' };
export const SHAPE_AND_DAYS = `(semanal los|mensual los días) ${P}`;
/** "semanal Basura los martes": el título va entre la forma y el conector. */
const SHAPE_TITLE_AND_DAYS = `(semanal|mensual) ${TITLE} (los|los días) ${P}`;

export const DAYS_VALID: Record<Shape, Pick<RecurringCalendarData, 'weekdays' | 'monthDays'>> = {
	semanal: { weekdays: ['martes'], monthDays: [] },
	mensual: { weekdays: [], monthDays: [15] }
};
export const WITHOUT_DAYS = { weekdays: [], monthDays: [] };

export function daysOf(shape: Shape, days: string): Pick<RecurringCalendarData, 'weekdays' | 'monthDays'> {
	return shape === 'semanal' ? { weekdays: weekdays(days), monthDays: [] } : { weekdays: [], monthDays: monthDays(days) };
}

/** "semanal los" o "mensual los días": la forma, validando que el conector le corresponda. */
export function shapeOf(shapeAndConnector: string): Shape {
	const [shape] = shapeAndConnector.split(' ') as [Shape];
	if (`${shape} ${CONNECTOR[shape]}` !== shapeAndConnector) throw new Error(`Forma inválida: "${shapeAndConnector}"`);
	return shape;
}

function create(world: World, data: RecurringCalendarData, now = NOW): void {
	recordCreation(world, (id) => createRecurringCalendar(data, id, now));
}

/** Completado ya guardado (por ejemplo, sincronizado), con su ocurrenciaCubierta tal cual. */
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
	if (!last) throw new Error('La tarea no tiene completados');
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
		// El momento no influye en el resultado: se usa el inicio del día cubierto.
		pattern: new RegExp(`^la tarea tiene un completado que cubre el ${P}$`),
		run: (world, covered) => addCompletion(world, date(covered), date(covered))
	},
	{
		pattern: /^la tarea tiene otro completado más antiguo que cubre la misma ocurrencia$/,
		run: (world) => {
			const last = theLastCompletion(world);
			if (!last.coveredOccurrence) throw new Error('El último completado no cubre ninguna ocurrencia');
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
			// Que fue la mínima (§4.4) lo afirman los pasos de la mínima; solo se escribe en true.
			if (wasMinimal !== undefined) expect(wasMinimal).toBe(true);
		}
	}
];
