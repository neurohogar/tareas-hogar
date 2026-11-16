// Spec §4.1, §6.2 y §7: el horario al crear, al editar y en el documento guardado.
import { describe, expect, it } from 'vitest';
import { createFromData, taskData } from './task-data';
import { applyChange, taskFromDocument, type TaskDocument } from './task-document';
import { edit } from './editing';
import type { OneOffTask } from './task';

const NOW = new Date(2026, 6, 15, 8, 0, 0);
const MORNING = [{ from: '08:00', to: '11:00' }];

describe('crear con horario (spec §4.1)', () => {
	it.each([
		{ shape: 'puntual' as const, title: 'Regar' },
		{ shape: 'relativa' as const, title: 'Regar', every: 2, unit: 'dias' as const },
		{ shape: 'calendario' as const, title: 'Basura', weekdays: ['martes' as const], monthDays: [] }
	])('cualquier tipo de tarea guarda el horario tal cual ($forma)', (data) => {
		const result = createFromData({ ...data, schedule: MORNING }, 't1', NOW);
		expect(result.ok && result.task.schedule).toStrictEqual(MORNING);
	});

	it('sin horario, la tarea no tiene el campo', () => {
		const result = createFromData({ shape: 'puntual', title: 'Regar' }, 't1', NOW);
		expect(result.ok && result.task).not.toHaveProperty('schedule');
	});

	it('con desde ≥ hasta se rechaza entera, junto con los otros errores', () => {
		expect(createFromData({ shape: 'puntual', title: ' ', schedule: [{ from: '11:00', to: '08:00' }] }, 't1', NOW)).toStrictEqual({
			ok: false,
			errors: { title: 'vacio', schedule: 'finNoPosterior' }
		});
	});

	it('con una sola de las dos horas se rechaza por horario incompleto', () => {
		expect(createFromData({ shape: 'relativa', title: 'Regar', every: 1, unit: 'dias', schedule: [{ from: '08:00' }] }, 't1', NOW)).toStrictEqual({
			ok: false,
			errors: { schedule: 'incompleto' }
		});
	});
});

const WITH_SCHEDULE: OneOffTask = { id: 't1', title: 'Regar', kind: 'puntual', schedule: MORNING, createdAt: NOW };

describe('editar el horario (spec §6.2, §7)', () => {
	it('el panel carga el horario de la tarea', () => {
		expect(taskData(WITH_SCHEDULE)).toStrictEqual({ shape: 'puntual', title: 'Regar', schedule: MORNING });
	});

	it('cambiarlo escribe el horario entero, como un solo campo', () => {
		const result = edit(WITH_SCHEDULE, { ...taskData(WITH_SCHEDULE), schedule: [{ from: '07:00', to: '11:00' }] });
		expect(result).toStrictEqual({ ok: true, change: { schedule: [{ from: '07:00', to: '11:00' }] } });
	});

	it('quitarlo lo escribe como null', () => {
		const { schedule: _, ...withoutSchedule } = taskData(WITH_SCHEDULE);
		expect(edit(WITH_SCHEDULE, withoutSchedule)).toStrictEqual({ ok: true, change: { schedule: null } });
	});

	it('sin cambios en el horario no lo escribe, tampoco al cambiar de tipo', () => {
		expect(edit(WITH_SCHEDULE, taskData(WITH_SCHEDULE))).toStrictEqual({ ok: true, change: {} });
		const result = edit(WITH_SCHEDULE, { shape: 'relativa', title: 'Regar', every: 2, unit: 'dias', schedule: MORNING });
		expect(result.ok && result.change).not.toHaveProperty('schedule');
	});

	it('una edición con horario inválido se rechaza entera', () => {
		expect(edit(WITH_SCHEDULE, { shape: 'puntual', title: 'Barrer', schedule: [{ from: '10:00', to: '10:00' }] })).toStrictEqual({
			ok: false,
			errors: { schedule: 'finNoPosterior' }
		});
	});
});

describe('el horario en el documento (spec §7)', () => {
	const DOC: TaskDocument = { id: 't1', title: 'Regar', kind: 'puntual', createdAt: NOW };

	it('la tarea del documento conserva su horario', () => {
		expect(taskFromDocument({ ...DOC, schedule: MORNING })).toStrictEqual({ ...DOC, schedule: MORNING });
		expect(taskFromDocument({ ...DOC, recurrence: { mode: 'relativo', every: 1, unit: 'dias' }, kind: 'periodica', schedule: MORNING }).schedule).toStrictEqual(MORNING);
	});

	it('un cambio de horario reemplaza el campo entero, y null lo quita', () => {
		const [changed] = applyChange([{ ...DOC, schedule: MORNING }], 't1', { schedule: [{ from: '07:00', to: '12:00' }] });
		expect(changed.schedule).toStrictEqual([{ from: '07:00', to: '12:00' }]);
		const [removed] = applyChange([changed], 't1', { schedule: null });
		expect(removed).not.toHaveProperty('schedule');
	});
});

const MORNING_AND_AFTERNOON = [
	{ from: '07:00', to: '10:00' },
	{ from: '18:00', to: '21:00' }
];

describe('varios horarios (spec §4.1, §6.2, §7)', () => {
	it.each([
		{ shape: 'puntual' as const, title: 'Perros' },
		{ shape: 'relativa' as const, title: 'Perros', every: 1, unit: 'dias' as const },
		{ shape: 'calendario' as const, title: 'Perros', weekdays: ['miércoles' as const], monthDays: [] }
	])('cualquier tipo de tarea guarda varias ventanas, ordenadas por desde ($forma)', (data) => {
		const result = createFromData({ ...data, schedule: [MORNING_AND_AFTERNOON[1], MORNING_AND_AFTERNOON[0]] }, 't1', NOW);
		expect(result.ok && result.task.schedule).toStrictEqual(MORNING_AND_AFTERNOON);
	});

	it('una relativa en horas con más de una ventana se rechaza entera', () => {
		expect(createFromData({ shape: 'relativa', title: ' ', every: 8, unit: 'horas', schedule: MORNING_AND_AFTERNOON }, 't1', NOW)).toStrictEqual({
			ok: false,
			errors: { title: 'vacio', schedule: 'variasEnHoras' }
		});
	});

	it('una relativa en horas con una sola ventana es válida', () => {
		const result = createFromData({ shape: 'relativa', title: 'Remedio', every: 8, unit: 'horas', schedule: [MORNING_AND_AFTERNOON[0]] }, 't1', NOW);
		expect(result.ok).toBe(true);
	});

	it('un error del horario mismo tiene prioridad sobre el de la relativa en horas', () => {
		const overlapping = [MORNING_AND_AFTERNOON[0], { from: '09:00', to: '12:00' }];
		expect(createFromData({ shape: 'relativa', title: 'Remedio', every: 8, unit: 'horas', schedule: overlapping }, 't1', NOW)).toStrictEqual({
			ok: false,
			errors: { schedule: 'superpuestos' }
		});
	});

	it('pasar a relativa en horas una tarea con dos ventanas se rechaza', () => {
		const task: OneOffTask = { ...WITH_SCHEDULE, schedule: MORNING_AND_AFTERNOON };
		expect(edit(task, { shape: 'relativa', title: 'Regar', every: 8, unit: 'horas', schedule: MORNING_AND_AFTERNOON })).toStrictEqual({
			ok: false,
			errors: { schedule: 'variasEnHoras' }
		});
	});

	it('agregar una ventana escribe la lista entera; dejarla igual no escribe nada', () => {
		expect(edit(WITH_SCHEDULE, { ...taskData(WITH_SCHEDULE), schedule: [...MORNING, MORNING_AND_AFTERNOON[1]] })).toStrictEqual({
			ok: true,
			change: { schedule: [...MORNING, MORNING_AND_AFTERNOON[1]] }
		});
		const task: OneOffTask = { ...WITH_SCHEDULE, schedule: MORNING_AND_AFTERNOON };
		expect(edit(task, taskData(task))).toStrictEqual({ ok: true, change: {} });
		expect(edit(task, { ...taskData(task), schedule: [MORNING_AND_AFTERNOON[1]] })).toStrictEqual({ ok: true, change: { schedule: [MORNING_AND_AFTERNOON[1]] } });
	});

	it('el panel carga una copia de las ventanas', () => {
		const task: OneOffTask = { ...WITH_SCHEDULE, schedule: MORNING_AND_AFTERNOON };
		const data = taskData(task);
		expect(data.schedule).toStrictEqual(MORNING_AND_AFTERNOON);
		expect(data.schedule?.[0]).not.toBe(MORNING_AND_AFTERNOON[0]);
	});

	it('un documento guardado con una sola ventana (formato anterior) se lee como una lista de una', () => {
		const doc: TaskDocument = { id: 't1', title: 'Regar', kind: 'puntual', createdAt: NOW, schedule: { from: '08:00', to: '11:00' } };
		expect(taskFromDocument(doc).schedule).toStrictEqual(MORNING);
	});
});
