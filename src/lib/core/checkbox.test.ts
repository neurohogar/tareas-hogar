import { describe, expect, it } from 'vitest';
import { checkboxAction, checkboxEnabled } from './checkbox';
import type { Completion, Task } from './task';

const CREATED = new Date(2026, 6, 1);
const oneOff: Task = { id: 'p', title: 'Pagar', kind: 'puntual', createdAt: CREATED };
const relative: Task = { id: 'r', title: 'Regar', kind: 'periodica', recurrence: { mode: 'relativo', every: 2, unit: 'dias' }, createdAt: CREATED };
const weekly: Task = {
	id: 's',
	title: 'Basura',
	kind: 'periodica',
	recurrence: { mode: 'calendario', weekdays: ['martes', 'jueves'] },
	createdAt: CREATED
};
const completion = (id: string, taskId: string, completedAt: Date, coveredOccurrence?: Date): Completion => ({
	id,
	taskId,
	completedAt,
	...(coveredOccurrence && { coveredOccurrence })
});

describe('accionDelCheckbox (spec §6.1)', () => {
	it('una tarea no completada se completa', () => {
		expect(checkboxAction(oneOff, [], new Date(2026, 6, 15, 8, 0, 0))).toEqual({ kind: 'completar' });
	});

	it('una periódica con completados pero pendiente se completa (no borra el anterior)', () => {
		const previous = completion('c1', 'r', new Date(2026, 6, 10, 8, 0, 0));
		expect(checkboxAction(relative, [previous], new Date(2026, 6, 15, 8, 0, 0))).toEqual({ kind: 'completar' });
	});

	it('una puntual completada borra su completado más reciente, aunque sea de otro día', () => {
		const oldOne = completion('c1', 'p', new Date(2026, 6, 10, 9, 0, 0));
		const recent = completion('c2', 'p', new Date(2026, 6, 12, 9, 0, 0));
		expect(checkboxAction(oneOff, [recent, oldOne], new Date(2026, 6, 15, 8, 0, 0))).toEqual({ kind: 'borrar', completion: recent });
	});

	it('una periódica completada hoy borra el completado más reciente', () => {
		const yesterday = completion('c1', 'r', new Date(2026, 6, 13, 9, 0, 0));
		const today = completion('c2', 'r', new Date(2026, 6, 15, 0, 0, 0));
		expect(checkboxAction(relative, [today, yesterday], new Date(2026, 6, 15, 23, 59, 59))).toEqual({ kind: 'borrar', completion: today });
	});

	it('una periódica con un completado "del futuro" (relojes desfasados) lo borra', () => {
		const upcoming = completion('c1', 'r', new Date(2026, 6, 16, 9, 0, 0));
		expect(checkboxAction(relative, [upcoming], new Date(2026, 6, 15, 12, 0, 0))).toEqual({ kind: 'borrar', completion: upcoming });
	});

	it('una periódica completada un día anterior se completa de nuevo', () => {
		const yesterday = completion('c1', 'r', new Date(2026, 6, 14, 23, 59, 59));
		expect(checkboxAction(relative, [yesterday], new Date(2026, 6, 15, 0, 0, 0))).toEqual({ kind: 'completar' });
	});

	it('una semanal completada un día anterior se completa de nuevo', () => {
		const monday = completion('c1', 's', new Date(2026, 6, 13, 10, 0, 0), new Date(2026, 6, 14));
		expect(checkboxAction(weekly, [monday], new Date(2026, 6, 14, 8, 0, 0))).toEqual({ kind: 'completar' });
	});

	it('solo cuentan los completados de la tarea', () => {
		const ofOther = completion('c1', 'otra', new Date(2026, 6, 15, 9, 0, 0));
		expect(checkboxAction(oneOff, [ofOther], new Date(2026, 6, 15, 10, 0, 0))).toEqual({ kind: 'completar' });
	});
});

describe('checkbox con horario (spec §5.5, §6.1)', () => {
	const schedule = [{ from: '08:00', to: '11:00' }];
	const withSchedule = <T extends Task>(task: T): T => ({ ...task, schedule });

	it.each([new Date(2026, 6, 15, 8, 0, 0), new Date(2026, 6, 15, 10, 59, 59)])('dentro de la ventana completa (%s)', (now) => {
		expect(checkboxAction(withSchedule(oneOff), [], now)).toEqual({ kind: 'completar' });
		expect(checkboxEnabled(withSchedule(oneOff), [], now)).toBe(true);
	});

	it.each([new Date(2026, 6, 15, 7, 59, 59), new Date(2026, 6, 15, 11, 0, 0), new Date(2026, 6, 16, 3, 0, 0)])(
		'fuera de la ventana, lo que completaría no hace nada y está deshabilitado (%s)',
		(now) => {
			expect(checkboxAction(withSchedule(oneOff), [], now)).toEqual({ kind: 'ninguna' });
			expect(checkboxEnabled(withSchedule(oneOff), [], now)).toBe(false);
		}
	);

	it('una periódica completada un día anterior, fuera de la ventana, no se completa de nuevo', () => {
		const previous = completion('c1', 'r', new Date(2026, 6, 14, 9, 0, 0));
		const everyThreeDays = withSchedule({ ...relative, recurrence: { mode: 'relativo' as const, every: 3, unit: 'dias' as const } });
		expect(checkboxAction(everyThreeDays, [previous], new Date(2026, 6, 15, 12, 0, 0))).toEqual({ kind: 'ninguna' });
		expect(checkboxAction(everyThreeDays, [previous], new Date(2026, 6, 15, 9, 0, 0))).toEqual({ kind: 'completar' });
	});

	it('lo que borraría está habilitado a cualquier hora', () => {
		const doneItem = completion('c1', 'p', new Date(2026, 6, 15, 9, 0, 0));
		expect(checkboxAction(withSchedule(oneOff), [doneItem], new Date(2026, 6, 15, 20, 0, 0))).toEqual({ kind: 'borrar', completion: doneItem });
		expect(checkboxEnabled(withSchedule(oneOff), [doneItem], new Date(2026, 6, 15, 20, 0, 0))).toBe(true);
	});

	it('sin horario, siempre está habilitado', () => {
		expect(checkboxEnabled(oneOff, [], new Date(2026, 6, 16, 3, 0, 0))).toBe(true);
	});
});

describe('checkbox con varias ventanas (spec §5.5, §6.1)', () => {
	const schedule = [
		{ from: '07:00', to: '10:00' },
		{ from: '18:00', to: '21:00' }
	];

	it('completa dentro de cualquiera de las ventanas y está deshabilitado entre ellas', () => {
		const task = { ...oneOff, schedule };
		expect(checkboxEnabled(task, [], new Date(2026, 6, 15, 9, 0, 0))).toBe(true);
		expect(checkboxEnabled(task, [], new Date(2026, 6, 15, 12, 0, 0))).toBe(false);
		expect(checkboxEnabled(task, [], new Date(2026, 6, 15, 18, 0, 0))).toBe(true);
	});
});

describe('el checkbox de una pausada o reanudada (spec §5.8)', () => {
	const NOW = new Date(2026, 6, 15, 12, 0, 0);

	it('de una pausada está deshabilitado, completada o no', () => {
		const ofToday = completion('c1', 'r', new Date(2026, 6, 15, 9, 0, 0));

		expect(checkboxAction({ ...relative, paused: true }, [], NOW)).toEqual({ kind: 'ninguna' });
		expect(checkboxEnabled({ ...relative, paused: true }, [ofToday], NOW)).toBe(false);
	});

	it('de una reanudada completada hoy antes de la pausa la completa, en lugar de borrar ese completado', () => {
		const ofToday = completion('c1', 'r', new Date(2026, 6, 15, 9, 0, 0));
		const resumed = { ...relative, resumedAt: new Date(2026, 6, 15, 11, 0, 0) };

		expect(checkboxAction(resumed, [ofToday], NOW)).toEqual({ kind: 'completar' });
	});

	it('de una de calendario reanudada en espera sin completados desde la reanudación la completa', () => {
		// Miércoles: espera al jueves; el completado de esta mañana es de antes de reanudar.
		const ofToday = completion('c1', 's', new Date(2026, 6, 15, 9, 0, 0), new Date(2026, 6, 14));
		const resumed = { ...weekly, resumedAt: new Date(2026, 6, 15, 11, 0, 0) };

		expect(checkboxAction(resumed, [ofToday], NOW)).toEqual({ kind: 'completar' });
	});

	it('de una reanudada completada después de reanudar borra ese completado', () => {
		const after = completion('c2', 'r', new Date(2026, 6, 15, 11, 30, 0));
		const resumed = { ...relative, resumedAt: new Date(2026, 6, 15, 11, 0, 0) };

		expect(checkboxAction(resumed, [completion('c1', 'r', new Date(2026, 6, 15, 9, 0, 0)), after], NOW)).toEqual({
			kind: 'borrar',
			completion: after
		});
	});
});

describe('accionDelCheckbox de una pospuesta (spec §5.9)', () => {
	const postponed = { from: new Date(2026, 6, 15, 12, 0, 0), to: new Date(2026, 6, 15, 15, 0, 0) };
	const NOW = new Date(2026, 6, 15, 13, 0, 0);

	it('una periódica pospuesta con un completado de hoy se completa de nuevo', () => {
		const task: Task = { ...relative, recurrence: { mode: 'relativo', every: 4, unit: 'horas' }, postponed };

		expect(checkboxAction(task, [completion('c', 'r', new Date(2026, 6, 15, 8, 0, 0))], NOW)).toStrictEqual({ kind: 'completar' });
	});

	it('fuera de la ventana de su horario, el checkbox está deshabilitado', () => {
		const task: Task = { ...oneOff, postponed, schedule: [{ from: '08:00', to: '11:00' }] };

		expect(checkboxEnabled(task, [], NOW)).toBe(false);
	});

	it('dentro de la ventana de su horario, está habilitado', () => {
		const task: Task = { ...oneOff, postponed, schedule: [{ from: '08:00', to: '14:00' }] };

		expect(checkboxEnabled(task, [], NOW)).toBe(true);
	});
});
