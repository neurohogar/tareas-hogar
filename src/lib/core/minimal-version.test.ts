import { describe, expect, it } from 'vitest';
import { noticeOnComplete, noticeText } from './notice';
import { hasChanges } from './unsaved-changes';
import { checkboxAction } from './checkbox';
import { complete } from './completions';
import { createRecurringCalendar } from './create-recurring-calendar';
import { createRecurringRelative } from './create-recurring-relative';
import { createOneOff } from './create-one-off';
import { createFromData, taskData, type TaskData } from './task-data';
import { applyChange, taskFromDocument, type TaskDocument } from './task-document';
import { edit } from './editing';
import { taskStatus } from './task-status';
import { history } from './history';
import { changeOnDeleteCompletion, changeOnComplete } from './current-step';
import { pendingRows } from './pending';
import type { Completion, RecurringTask, OneOffTask } from './task';
import { doTheMinimal, minimalLine } from './minimal-version';

const CREATED = new Date(2026, 10, 1, 8, 0, 0);
const NOW = new Date(2026, 10, 13, 10, 0, 0);
const MINIMAL = 'Solo el inodoro';
const ONE_OFF: OneOffTask = { id: 't1', title: 'Baño', kind: 'puntual', createdAt: CREATED, minimalVersion: MINIMAL };
const RELATIVE: RecurringTask = {
	id: 't2',
	title: 'Regar',
	kind: 'periodica',
	recurrence: { mode: 'relativo', every: 2, unit: 'dias' },
	createdAt: CREATED,
	minimalVersion: MINIMAL
};
const WITH_STEPS: OneOffTask = { ...ONE_OFF, firstStep: 'Guantes', steps: ['Inodoro', 'Pileta'], currentStep: 2 };

describe('crear con versión mínima (spec §4.1)', () => {
	it('las tres formas guardan la versión mínima recortada', () => {
		const commons = { title: 'Baño', minimalVersion: `  ${MINIMAL} ` };

		expect(createOneOff(commons, 'p', CREATED)).toMatchObject({ ok: true, task: { minimalVersion: MINIMAL } });
		expect(createRecurringRelative({ ...commons, every: 2, unit: 'dias' }, 'r', CREATED)).toMatchObject({ ok: true, task: { minimalVersion: MINIMAL } });
		expect(createRecurringCalendar({ ...commons, weekdays: ['lunes'], monthDays: [] }, 'c', CREATED)).toMatchObject({
			ok: true,
			task: { minimalVersion: MINIMAL }
		});
	});

	it.each(['', '   ', ' \t '])('vacía o solo espacios (%j) es sin versión mínima: el campo no se guarda', (minimalVersion) => {
		expect(createOneOff({ title: 'Baño', minimalVersion }, 't1', CREATED)).toStrictEqual({
			ok: true,
			task: { id: 't1', title: 'Baño', kind: 'puntual', createdAt: CREATED }
		});
	});

	it('nunca es inválida ni tiene largo máximo, y no reemplaza la nota ni el primer paso', () => {
		const long = 'x'.repeat(5000);
		const result = createOneOff({ title: 'Baño', note: 'Guantes', firstStep: 'Lavandina', minimalVersion: long }, 't1', CREATED);

		expect(result).toMatchObject({ ok: true, task: { note: 'Guantes', firstStep: 'Lavandina', minimalVersion: long } });
	});
});

describe('datosDeTarea y documento con versión mínima (spec §6.2, §7)', () => {
	it('al editar, el panel la carga, y crearSegunDatos la devuelve igual', () => {
		const data = taskData(RELATIVE);

		expect(data).toMatchObject({ minimalVersion: MINIMAL });
		expect(createFromData(data, RELATIVE.id, CREATED)).toStrictEqual({ ok: true, task: RELATIVE });
	});

	it('una tarea sin el campo abre el panel sin versión mínima', () => {
		const { minimalVersion: _, ...withoutMinimal } = ONE_OFF;

		expect(taskData(withoutMinimal)).not.toHaveProperty('minimalVersion');
	});

	it('el documento la conserva; sin el campo, la tarea no la tiene (no hay migración)', () => {
		const doc: TaskDocument = { id: 't1', title: 'Baño', kind: 'puntual', createdAt: CREATED };

		expect(taskFromDocument({ ...doc, minimalVersion: MINIMAL })).toMatchObject({ minimalVersion: MINIMAL });
		expect(taskFromDocument(doc)).not.toHaveProperty('minimalVersion');
	});
});

describe('editar la versión mínima (spec §6.2, §7)', () => {
	const withMinimal = (minimalVersion: string): TaskData => ({ ...taskData(ONE_OFF), minimalVersion });

	it('solo entra en el cambio si cambió, recortada', () => {
		expect(edit(ONE_OFF, withMinimal(` ${MINIMAL}  `))).toStrictEqual({ ok: true, change: {} });
		expect(edit(ONE_OFF, withMinimal(' Solo la pileta '))).toStrictEqual({ ok: true, change: { minimalVersion: 'Solo la pileta' } });
	});

	it('vaciarla la quita con null, y aplicar el cambio deja el documento sin el campo', () => {
		const result = edit(ONE_OFF, withMinimal('  '));
		const doc: TaskDocument = { ...ONE_OFF };

		expect(result).toStrictEqual({ ok: true, change: { minimalVersion: null } });
		if (!result.ok) return;
		expect(applyChange([doc], ONE_OFF.id, result.change)[0]).not.toHaveProperty('minimalVersion');
	});

	it('cambiar el tipo no la toca', () => {
		const data: TaskData = { ...taskData(ONE_OFF), shape: 'relativa', every: 2, unit: 'dias' };
		const result = edit(ONE_OFF, data);

		expect(result.ok && result.change).not.toHaveProperty('minimalVersion');
	});
});

describe('Cambios sin guardar con versión mínima (spec §6.2)', () => {
	const values = (data: TaskData) => ({ data, labels: [] });
	const onOpen = values(taskData(ONE_OFF));
	const withMinimal = (minimalVersion: string | undefined) => ({ ...values({ ...taskData(ONE_OFF), minimalVersion }), unconfirmed: '' });

	it('escribir otra cuenta; volver al valor original o agregarle espacios no', () => {
		expect(hasChanges(onOpen, withMinimal('Solo la pileta'))).toBe(true);
		expect(hasChanges(onOpen, withMinimal(MINIMAL))).toBe(false);
		expect(hasChanges(onOpen, withMinimal(`  ${MINIMAL} `))).toBe(false);
	});

	it('vaciar una existente cuenta; vacío y sin el campo son lo mismo', () => {
		expect(hasChanges(onOpen, withMinimal(''))).toBe(true);
		const withoutMinimal = values({ shape: 'puntual', title: 'Baño' });
		expect(hasChanges(withoutMinimal, { ...values({ shape: 'puntual', title: 'Baño', minimalVersion: '  ' }), unconfirmed: '' })).toBe(false);
	});

	it('con una repetición inválida, una versión mínima vacía no cuenta como cambio', () => {
		const invalid: TaskData = { shape: 'relativa', title: 'Regar', every: 0, unit: 'dias' };

		expect(hasChanges(values(invalid), { ...values({ ...invalid, minimalVersion: '' }), unconfirmed: '' })).toBe(false);
	});
});

describe('lineaDeMinima: la fila ofrece la mínima (spec §6.1)', () => {
	it('en una pendiente, «Mínima: » y el texto completo, con el botón habilitado', () => {
		expect(minimalLine(ONE_OFF, { kind: 'pendiente' }, [], NOW)).toStrictEqual({ text: `Mínima: ${MINIMAL}`, enabled: true });
	});

	it('en una atrasada también, aunque la tarea no tenga primer paso', () => {
		expect(minimalLine(ONE_OFF, { kind: 'atrasada' }, [], NOW)?.text).toBe(`Mínima: ${MINIMAL}`);
	});

	it.each([{ kind: 'en espera', progress: 0.5 }, { kind: 'completada' }, { kind: 'pausada' }] as const)('no se ve en una fila %o', (status) => {
		expect(minimalLine(ONE_OFF, status, [], NOW)).toBeUndefined();
	});

	it('sin versión mínima no se ve', () => {
		const { minimalVersion: _, ...withoutMinimal } = ONE_OFF;

		expect(minimalLine(withoutMinimal, { kind: 'pendiente' }, [], NOW)).toBeUndefined();
	});

	it('fuera de la ventana el botón está deshabilitado, como el checkbox (§5.5)', () => {
		const withSchedule: OneOffTask = { ...ONE_OFF, schedule: [{ from: '08:00', to: '09:00' }] };

		expect(minimalLine(withSchedule, { kind: 'atrasada' }, [], NOW)).toStrictEqual({ text: `Mínima: ${MINIMAL}`, enabled: false });
	});
});

describe('filasDePendientes con la mínima (spec §6.1)', () => {
	it('la fila pendiente la lleva, la completada no', () => {
		const completion: Completion = { id: 'c1', taskId: ONE_OFF.id, completedAt: CREATED };
		const other: OneOffTask = { ...ONE_OFF, id: 't9', title: 'Cocina' };
		const rows = pendingRows([ONE_OFF, other], [completion], NOW, true);

		expect(rows.map(({ task, minimal }) => [task.id, minimal?.text])).toStrictEqual([
			['t9', `Mínima: ${MINIMAL}`],
			['t1', undefined]
		]);
	});

	it('una pospuesta no la ofrece', () => {
		const postponed: OneOffTask = { ...ONE_OFF, postponed: { from: CREATED, to: new Date(2026, 10, 20) } };

		expect(pendingRows([postponed], [], NOW)[0]).not.toHaveProperty('minimal');
	});

	it('el orden no cambia por tener mínima', () => {
		const { minimalVersion: _, ...withoutMinimal } = ONE_OFF;
		const a: OneOffTask = { ...withoutMinimal, id: 'a', title: 'A' };
		const b: OneOffTask = { ...ONE_OFF, id: 'b', title: 'B' };

		expect(pendingRows([b, a], [], NOW).map(({ task }) => task.id)).toStrictEqual(['a', 'b']);
	});
});

describe('hacerLaMinima (spec §6.1, §4.4)', () => {
	it('completa como el checkbox, con fueMinima en true', () => {
		expect(doTheMinimal(ONE_OFF, [], 'c1', NOW)).toStrictEqual({ id: 'c1', taskId: ONE_OFF.id, completedAt: NOW, wasMinimal: true });
	});

	it('en una de calendario cubre la misma ocurrencia que un completado entero', () => {
		const weekly: RecurringTask = { ...RELATIVE, recurrence: { mode: 'calendario', weekdays: ['jueves'] } };
		const { wasMinimal, ...rest } = doTheMinimal(weekly, [], 'c1', NOW) ?? {};

		expect(wasMinimal).toBe(true);
		expect(rest).toStrictEqual(complete(weekly, [], 'c1', NOW));
	});

	it('cuenta para el estado como cualquier completado: la relativa queda en espera', () => {
		const completion = doTheMinimal(RELATIVE, [], 'c1', NOW);

		expect(completion && taskStatus(RELATIVE, [completion], NOW).kind).toBe('en espera');
	});

	it('en cualquier paso guarda pasoAlCompletar y la tarea vuelve al paso 1; borrarlo devuelve el paso', () => {
		const completion = doTheMinimal(WITH_STEPS, [], 'c1', NOW);

		expect(completion).toMatchObject({ stepAtCompletion: 2, wasMinimal: true });
		expect(changeOnComplete(WITH_STEPS)).toStrictEqual({ currentStep: null });
		if (!completion) return;
		expect(changeOnDeleteCompletion({ ...WITH_STEPS, currentStep: undefined }, [completion], completion)).toStrictEqual({ currentStep: 2 });
	});

	it('no completa si no hay versión mínima', () => {
		const { minimalVersion: _, ...withoutMinimal } = ONE_OFF;

		expect(doTheMinimal(withoutMinimal, [], 'c1', NOW)).toBeUndefined();
	});

	it('no completa una completada, una pospuesta, una pausada ni fuera de la ventana', () => {
		const doneItem: Completion = { id: 'c0', taskId: ONE_OFF.id, completedAt: CREATED };
		const postponed: OneOffTask = { ...ONE_OFF, postponed: { from: CREATED, to: new Date(2026, 10, 20) } };
		const paused: RecurringTask = { ...RELATIVE, paused: true };
		const outsideSchedule: OneOffTask = { ...ONE_OFF, schedule: [{ from: '08:00', to: '09:00' }] };

		expect(doTheMinimal(ONE_OFF, [doneItem], 'c1', NOW)).toBeUndefined();
		expect(doTheMinimal(postponed, [], 'c1', NOW)).toBeUndefined();
		expect(doTheMinimal(paused, [], 'c1', NOW)).toBeUndefined();
		expect(doTheMinimal(outsideSchedule, [], 'c1', NOW)).toBeUndefined();
	});

	it('un completado entero no lleva el campo', () => {
		expect(complete(ONE_OFF, [], 'c1', NOW)).not.toHaveProperty('wasMinimal');
	});

	it('editar o vaciar la versión mínima no toca los completados', () => {
		const result = edit(ONE_OFF, { ...taskData(ONE_OFF), minimalVersion: '' });

		expect(result.ok && Object.keys(result.change)).toStrictEqual(['minimalVersion']);
	});
});

describe('checkbox de una completada con la mínima (spec §5.4, §6.1)', () => {
	it('borra el completado más reciente, sea entero o mínimo', () => {
		const whole: Completion = { id: 'c1', taskId: ONE_OFF.id, completedAt: CREATED };
		const minimum: Completion = { id: 'c2', taskId: ONE_OFF.id, completedAt: new Date(2026, 10, 2), wasMinimal: true };

		expect(checkboxAction(ONE_OFF, [whole, minimum], NOW)).toStrictEqual({ kind: 'borrar', completion: minimum });
	});

	it('una periódica completada con la mínima un día anterior se completa de nuevo, entera', () => {
		const minimum: Completion = { id: 'c1', taskId: RELATIVE.id, completedAt: new Date(2026, 10, 12, 9, 0, 0), wasMinimal: true };
		const daily: RecurringTask = { ...RELATIVE, recurrence: { mode: 'relativo', every: 2, unit: 'horas' } };

		expect(checkboxAction(daily, [minimum], NOW)).toStrictEqual({ kind: 'completar' });
		expect(complete(daily, [minimum], 'c2', NOW)).not.toHaveProperty('wasMinimal');
	});
});

describe('textoDelAviso (spec §5.4)', () => {
	const task: OneOffTask = { ...ONE_OFF, title: 'Regar', emoji: '🌱' };

	it('un completado de la mínima suma « · mínima», sin el texto de la mínima', () => {
		const completion: Completion = { id: 'c1', taskId: task.id, completedAt: NOW, wasMinimal: true };

		expect(noticeText(noticeOnComplete(task, completion))).toBe('Completaste «🌱 Regar» · mínima');
	});

	it('un completado entero no suma nada', () => {
		const completion: Completion = { id: 'c1', taskId: task.id, completedAt: NOW };

		expect(noticeText(noticeOnComplete(task, completion))).toBe('Completaste «🌱 Regar»');
	});
});

describe('Historial con la mínima (spec §6.3)', () => {
	it('la hora de un completado de la mínima suma «Mínima», la de uno entero no', () => {
		const minimum: Completion = { id: 'c1', taskId: ONE_OFF.id, completedAt: new Date(2026, 10, 13, 8, 5), wasMinimal: true };
		const whole: Completion = { id: 'c2', taskId: ONE_OFF.id, completedAt: new Date(2026, 10, 13, 9, 0) };
		const [today] = history([ONE_OFF], [minimum, whole], NOW);

		expect(today?.entries.map(({ hour, timeText }) => [hour, timeText])).toStrictEqual([
			['09:00', '09:00'],
			['08:05', '08:05 Mínima']
		]);
	});
});
