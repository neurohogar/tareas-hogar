import { describe, expect, it } from 'vitest';
import { completionsOfTask, complete } from './completions';
import type { Completion, RecurringTask, OneOffTask } from './task';

const TASK: RecurringTask = {
	id: 'tarea-1',
	title: 'Ventilar',
	kind: 'periodica',
	recurrence: { mode: 'relativo', every: 4, unit: 'horas' },
	createdAt: new Date(2026, 6, 1, 8, 0, 0)
};

const TUESDAY_AND_THURSDAY: RecurringTask = {
	id: 'tarea-2',
	title: 'Sacar la basura',
	kind: 'periodica',
	recurrence: { mode: 'calendario', weekdays: ['martes', 'jueves'] },
	createdAt: new Date(2026, 6, 13, 8, 0, 0)
};
const day = (d: number) => new Date(2026, 6, d);

const ONE_OFF: OneOffTask = {
	id: 'tarea-3',
	title: 'Pagar la luz',
	kind: 'puntual',
	dueDate: new Date(2026, 6, 15),
	createdAt: new Date(2026, 6, 1, 8, 0, 0)
};

describe('completar', () => {
	it('registra el completado de una puntual en ese momento, sin ocurrencia cubierta', () => {
		const moment = new Date(2026, 6, 16, 10, 0, 0);

		expect(complete(ONE_OFF, [], 'c1', moment)).toStrictEqual({ id: 'c1', taskId: 'tarea-3', completedAt: moment });
	});

	it('registra un completado de la tarea en ese momento, sin ocurrencia cubierta', () => {
		const moment = new Date(2026, 6, 15, 9, 30, 0);

		const completion = complete(TASK, [], 'c1', moment);

		expect(completion).toStrictEqual({ id: 'c1', taskId: 'tarea-1', completedAt: moment });
	});

	it('en modo calendario cubre la ocurrencia más reciente sin cubrir hasta hoy', () => {
		const friday = new Date(2026, 6, 17, 10, 0, 0);

		expect(complete(TUESDAY_AND_THURSDAY, [], 'c1', friday)).toStrictEqual({
			id: 'c1',
			taskId: 'tarea-2',
			completedAt: friday,
			coveredOccurrence: day(16)
		});
	});

	it('en modo calendario, sin ocurrencias sin cubrir hasta hoy, cubre la próxima', () => {
		const monday = new Date(2026, 6, 13, 10, 0, 0);

		expect(complete(TUESDAY_AND_THURSDAY, [], 'c1', monday).coveredOccurrence).toEqual(day(14));
	});

	it('parte de lo que cubrieron los completados anteriores de la tarea, no de otras', () => {
		const monday = new Date(2026, 6, 13, 20, 0, 0);
		const previous: Completion = {
			id: 'c1',
			taskId: 'tarea-2',
			completedAt: new Date(2026, 6, 13, 9),
			coveredOccurrence: day(14)
		};
		const ofOther: Completion = { ...previous, id: 'c2', taskId: 'otra', coveredOccurrence: day(16) };

		expect(complete(TUESDAY_AND_THURSDAY, [previous, ofOther], 'c3', monday).coveredOccurrence).toEqual(day(16));
		expect(complete(TUESDAY_AND_THURSDAY, [ofOther], 'c3', monday).coveredOccurrence).toEqual(day(14));
	});
});

describe('completadosDeTarea', () => {
	const of = (id: string, taskId: string): Completion => ({ id, taskId, completedAt: new Date(2026, 6, 15) });

	it('devuelve solo los completados de la tarea pedida, en su orden', () => {
		const completions = [of('a', 'tarea-1'), of('b', 'tarea-2'), of('c', 'tarea-1')];

		expect(completionsOfTask(completions, 'tarea-1').map((c) => c.id)).toEqual(['a', 'c']);
	});

	it('devuelve una lista vacía si la tarea no tiene completados', () => {
		expect(completionsOfTask([of('b', 'tarea-2')], 'tarea-1')).toEqual([]);
	});
});

describe('completar con horario (spec §4.4, §5.6, §5.7)', () => {
	const MORNING_AND_AFTERNOON = [
		{ from: '07:00', to: '10:00' },
		{ from: '18:00', to: '21:00' }
	];
	const at = (d: number, hour: number) => new Date(2026, 6, d, hour, 0, 0);

	it('de calendario con horario, guarda el inicio de la ocurrencia que cubre', () => {
		const task: RecurringTask = { ...TUESDAY_AND_THURSDAY, schedule: MORNING_AND_AFTERNOON };
		expect(complete(task, [], 'c', at(14, 19)).coveredOccurrence).toStrictEqual({ start: at(14, 18) });
	});

	it('de calendario con una sola ventana, también con hora', () => {
		const task: RecurringTask = { ...TUESDAY_AND_THURSDAY, schedule: [{ from: '08:00', to: '11:00' }] };
		expect(complete(task, [], 'c', at(14, 9)).coveredOccurrence).toStrictEqual({ start: at(14, 8) });
	});

	it('relativa en días con varias ventanas, guarda el inicio de la ventana que cubre', () => {
		const task: RecurringTask = { ...TASK, recurrence: { mode: 'relativo', every: 2, unit: 'dias' }, schedule: MORNING_AND_AFTERNOON };
		const previous: Completion = { id: 'a', taskId: task.id, completedAt: at(13, 8), coveredOccurrence: { start: at(13, 7) } };
		expect(complete(task, [previous], 'c', at(13, 19)).coveredOccurrence).toStrictEqual({ start: at(13, 18) });
	});

	it('relativa con una sola ventana, o en horas, no cubre ninguna ocurrencia', () => {
		const inDays: RecurringTask = { ...TASK, recurrence: { mode: 'relativo', every: 2, unit: 'dias' }, schedule: [MORNING_AND_AFTERNOON[0]] };
		expect(complete(inDays, [], 'c', at(13, 8))).not.toHaveProperty('coveredOccurrence');
		const inHours: RecurringTask = { ...TASK, schedule: MORNING_AND_AFTERNOON };
		expect(complete(inHours, [], 'c', at(13, 8))).not.toHaveProperty('coveredOccurrence');
	});
});

describe('completar una reanudada (spec §5.8)', () => {
	const RESUMED_WEDNESDAY = new Date(2026, 6, 15, 10, 0, 0);

	it('de calendario, reanudada un día sin ocurrencia, cubre la próxima, no la perdida en la pausa', () => {
		const task = { ...TUESDAY_AND_THURSDAY, resumedAt: RESUMED_WEDNESDAY };

		expect(complete(task, [], 'c1', new Date(2026, 6, 15, 12, 0, 0)).coveredOccurrence).toEqual(day(16));
	});

	it('de calendario, ignora los completados de antes de reanudar', () => {
		const coveredOnThursday = { id: 'c0', taskId: 'tarea-2', completedAt: new Date(2026, 6, 14, 9, 0, 0), coveredOccurrence: day(16) };
		const task = { ...TUESDAY_AND_THURSDAY, resumedAt: RESUMED_WEDNESDAY };

		expect(complete(task, [coveredOnThursday], 'c1', new Date(2026, 6, 15, 12, 0, 0)).coveredOccurrence).toEqual(day(16));
	});

	it('con horario, una ventana que cerró antes de reanudar no se cubre', () => {
		const task = { ...TUESDAY_AND_THURSDAY, schedule: [{ from: '08:00', to: '09:00' }], resumedAt: new Date(2026, 6, 14, 10, 0, 0) };

		expect(complete(task, [], 'c1', new Date(2026, 6, 14, 11, 0, 0)).coveredOccurrence).toEqual({ start: new Date(2026, 6, 16, 8, 0, 0) });
	});
});
