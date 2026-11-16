import { describe, expect, it } from 'vitest';
import { taskStatus } from './task-status';
import type { Completion, Schedule, Task } from './task';
import { urgencyInstant } from './urgency';

const MORNING: Schedule = [{ from: '08:00', to: '11:00' }];
const at = (day: number, hour = 0, minute = 0, secondOne = 0) => new Date(2026, 6, day, hour, minute, secondOne);
const completion = (completedAt: Date, coveredOccurrence?: Date): Completion => ({
	id: `c-${completedAt.getTime()}`,
	taskId: 't',
	completedAt,
	...(coveredOccurrence && { coveredOccurrence })
});

const oneOff = (createdAt: Date, dueDate?: Date): Task => ({
	id: 't',
	title: 'Foco',
	kind: 'puntual',
	...(dueDate && { dueDate }),
	schedule: MORNING,
	createdAt
});
const relative = (every: number, unit: 'horas' | 'dias', createdAt = at(1)): Task => ({
	id: 't',
	title: 'Regar',
	kind: 'periodica',
	recurrence: { mode: 'relativo', every, unit },
	schedule: MORNING,
	createdAt
});
const tuesdayAndThursday = (createdAt = at(1)): Task => ({
	id: 't',
	title: 'Basura',
	kind: 'periodica',
	recurrence: { mode: 'calendario', weekdays: ['martes', 'jueves'] },
	schedule: MORNING,
	createdAt
});

describe('estado de una puntual con horario (spec §5.5)', () => {
	it('antes de la primera ventana está en espera, con progreso desde creadaEn hasta el desde', () => {
		expect(taskStatus(oneOff(at(15, 6)), [], at(15, 7))).toEqual({ kind: 'en espera', progress: 0.5 });
	});

	it.each([at(15, 8), at(15, 10, 59, 59), at(17, 9)])('dentro de una ventana está pendiente (%s)', (now) => {
		expect(taskStatus(oneOff(at(15, 6)), [], now)).toEqual({ kind: 'pendiente' });
	});

	it('después del cierre, fuera de la ventana, está en espera con progreso desde el hasta anterior', () => {
		expect(taskStatus(oneOff(at(15, 6)), [], at(15, 11))).toEqual({ kind: 'en espera', progress: 0 });
		expect(taskStatus(oneOff(at(15, 6)), [], at(15, 21, 30))).toEqual({ kind: 'en espera', progress: 0.5 });
		expect(taskStatus(oneOff(at(15, 6)), [], at(20, 2, 45))).toEqual({ kind: 'en espera', progress: 0.75 });
	});

	it('creada después de la ventana, espera desde creadaEn hasta el desde del día siguiente', () => {
		expect(taskStatus(oneOff(at(15, 12)), [], at(16, 2))).toEqual({ kind: 'en espera', progress: 0.7 });
	});

	it('con fecha límite, atrasada desde el hasta de la ventana de ese día, también fuera de las ventanas', () => {
		const task = oneOff(at(15, 6), at(16));
		expect(taskStatus(task, [], at(16, 10, 59, 59))).toEqual({ kind: 'pendiente' });
		expect(taskStatus(task, [], at(16, 11))).toEqual({ kind: 'atrasada' });
		expect(taskStatus(task, [], at(17, 7))).toEqual({ kind: 'atrasada' });
	});

	it('con el atraso cumplido al crearla, está atrasada aunque la ventana no abrió', () => {
		expect(taskStatus(oneOff(at(15, 12), at(15)), [], at(15, 12))).toEqual({ kind: 'atrasada' });
	});

	it('con un completado está completada a cualquier hora', () => {
		expect(taskStatus(oneOff(at(15, 6)), [completion(at(15, 9))], at(15, 20))).toEqual({ kind: 'completada' });
	});
});

describe('estado de una relativa con horario (spec §5.5)', () => {
	it('antes de A está en espera con progreso (ahora − U) / (A − U)', () => {
		expect(taskStatus(relative(1, 'dias'), [completion(at(15, 9))], at(15, 15))).toEqual({ kind: 'en espera', progress: 0.25 });
		expect(taskStatus(relative(1, 'dias'), [completion(at(15, 12))], at(16, 10))).toEqual({ kind: 'en espera', progress: 0.5 });
	});

	it('con relojes desfasados (ahora < U) el progreso es 0', () => {
		expect(taskStatus(relative(1, 'dias'), [completion(at(15, 9))], at(15, 8))).toEqual({ kind: 'en espera', progress: 0 });
	});

	it('pasado V pero fuera de la ventana sigue en espera; desde A, pendiente', () => {
		const completions = [completion(at(15, 12))];
		expect(taskStatus(relative(1, 'dias'), completions, at(17, 7, 59, 59)).kind).toBe('en espera');
		expect(taskStatus(relative(1, 'dias'), completions, at(17, 8))).toEqual({ kind: 'pendiente' });
	});

	it('atrasada desde el primero entre C y V + intervalo', () => {
		expect(taskStatus(relative(1, 'dias'), [completion(at(15, 9))], at(16, 10, 59, 59))).toEqual({ kind: 'pendiente' });
		expect(taskStatus(relative(1, 'dias'), [completion(at(15, 9))], at(16, 11))).toEqual({ kind: 'atrasada' });
		expect(taskStatus(relative(1, 'horas'), [completion(at(15, 8, 30))], at(15, 10, 29, 59))).toEqual({ kind: 'pendiente' });
		expect(taskStatus(relative(1, 'horas'), [completion(at(15, 8, 30))], at(15, 10, 30))).toEqual({ kind: 'atrasada' });
	});

	it('atrasada aunque la ventana no abrió si V + intervalo ya pasó', () => {
		expect(taskStatus(relative(4, 'horas'), [completion(at(15, 10))], at(15, 18))).toEqual({ kind: 'atrasada' });
	});

	it('nunca completada: en espera desde creadaEn hasta el desde; atrasada si pasa la primera ventana', () => {
		const task = relative(1, 'dias', at(15, 12));
		expect(taskStatus(task, [], at(15, 20))).toEqual({ kind: 'en espera', progress: 0.4 });
		expect(taskStatus(task, [], at(16, 8))).toEqual({ kind: 'pendiente' });
		expect(taskStatus(task, [], at(16, 11))).toEqual({ kind: 'atrasada' });
	});
});

describe('estado de una de calendario con horario (spec §5.5)', () => {
	const completions = [completion(at(14, 8), at(14))];

	it('antes del desde del día N está en espera, con progreso hasta el desde', () => {
		expect(taskStatus(tuesdayAndThursday(), completions, at(16, 2))).toEqual({ kind: 'en espera', progress: 0.875 });
		expect(taskStatus(tuesdayAndThursday(), completions, at(16, 7, 59, 59)).kind).toBe('en espera');
	});

	it('el día N dentro de la ventana está pendiente; desde su hasta, atrasada', () => {
		expect(taskStatus(tuesdayAndThursday(), completions, at(16, 10, 59, 59))).toEqual({ kind: 'pendiente' });
		expect(taskStatus(tuesdayAndThursday(), completions, at(16, 11))).toEqual({ kind: 'atrasada' });
	});

	it('creada un día de ocurrencia después de la ventana queda atrasada en el acto', () => {
		expect(taskStatus(tuesdayAndThursday(at(16, 12)), [], at(16, 12))).toEqual({ kind: 'atrasada' });
	});
});

describe('instante de urgencia con horario (spec §5.5, §6.1)', () => {
	function instant(task: Task, completions: Completion[], now: Date) {
		const status = taskStatus(task, completions, now);
		if (status.kind === 'completada' || status.kind === 'pausada') throw new Error('Una completada no se ordena por urgencia');
		return urgencyInstant(task, completions, status, now);
	}

	it('una periódica atrasada, desde el atraso (C, o V + intervalo si es anterior)', () => {
		expect(instant(relative(1, 'dias'), [completion(at(15, 9))], at(16, 12))).toEqual(at(16, 11));
		expect(instant(relative(1, 'horas'), [completion(at(16, 8, 30))], at(16, 12))).toEqual(at(16, 10, 30));
	});

	it('una periódica pendiente o en espera, A', () => {
		expect(instant(relative(1, 'dias'), [completion(at(14, 12))], at(16, 9))).toEqual(at(16, 8));
		expect(instant(relative(1, 'dias'), [completion(at(15, 12))], at(16, 14))).toEqual(at(17, 8));
	});

	it('una puntual atrasada, desde el hasta de la ventana del día límite', () => {
		expect(instant(oneOff(at(1), at(15)), [], at(16, 12))).toEqual(at(15, 11));
	});

	it('una puntual pendiente conserva la clave de §6.1: su fecha límite, o ninguna', () => {
		expect(instant(oneOff(at(1), at(16)), [], at(16, 9))).toEqual(at(16));
		expect(instant(oneOff(at(1)), [], at(16, 9))).toBeUndefined();
	});

	it('una puntual en espera, cuando vuelve: el desde de la próxima ventana', () => {
		expect(instant(oneOff(at(15, 12)), [], at(15, 14))).toEqual(at(16, 8));
		expect(instant(oneOff(at(1)), [], at(15, 14))).toEqual(at(16, 8));
	});
});

describe('estado con varias ventanas (spec §5.6, §5.7)', () => {
	const TWO: Schedule = [
		{ from: '07:00', to: '10:00' },
		{ from: '18:00', to: '21:00' }
	];
	const covers = (completedAt: Date, start: Date): Completion => ({ id: `c-${completedAt.getTime()}`, taskId: 't', completedAt, coveredOccurrence: { start } });
	const wednesday = (schedule = TWO): Task => ({
		id: 't',
		title: 'Perros',
		kind: 'periodica',
		recurrence: { mode: 'calendario', weekdays: ['miércoles', 'jueves'] },
		schedule,
		createdAt: at(1)
	});
	const every2Days = (createdAt = at(1)): Task => ({
		id: 't',
		title: 'Perros',
		kind: 'periodica',
		recurrence: { mode: 'relativo', every: 2, unit: 'dias' },
		schedule: TWO,
		createdAt
	});

	it('calendario con la mañana cubierta: en espera hasta la tarde, pendiente en ella y atrasada desde su hasta', () => {
		const done = [covers(at(15, 8), at(15, 7))];
		expect(taskStatus(wednesday(), done, at(15, 13))).toEqual({ kind: 'en espera', progress: 0.5 });
		expect(taskStatus(wednesday(), done, at(15, 18))).toEqual({ kind: 'pendiente' });
		expect(taskStatus(wednesday(), done, at(15, 21))).toEqual({ kind: 'atrasada' });
	});

	it('calendario con la fecha sola cubierta: el día entero, en espera hasta la mañana siguiente', () => {
		expect(taskStatus(wednesday(), [completion(at(15, 8), at(15))], at(15, 19, 30))).toEqual({ kind: 'en espera', progress: 0.5 });
	});

	it('calendario: mover la única ventana más tarde el mismo día vuelve a abrir la ocurrencia hecha', () => {
		const done = [covers(at(15, 8, 30), at(15, 8))];
		expect(taskStatus(wednesday([{ from: '09:00', to: '12:00' }]), done, at(15, 9))).toEqual({ kind: 'pendiente' });
	});

	it('puntual: entre ventanas en espera hasta la próxima; atrasada desde el hasta de la última ventana del día límite', () => {
		const oneOffTwo: Task = { id: 't', title: 'Pan', kind: 'puntual', dueDate: at(15), schedule: TWO, createdAt: at(15, 6) };
		expect(taskStatus(oneOffTwo, [], at(15, 14))).toEqual({ kind: 'en espera', progress: 0.5 });
		expect(taskStatus(oneOffTwo, [], at(15, 18))).toEqual({ kind: 'pendiente' });
		expect(taskStatus(oneOffTwo, [], at(15, 21))).toEqual({ kind: 'atrasada' });
	});

	it('relativa en días: la ronda del día sigue y después espera cada `cada` días; el atraso es C', () => {
		expect(taskStatus(every2Days(), [covers(at(13, 8), at(13, 7))], at(13, 13))).toEqual({ kind: 'en espera', progress: 0.5 });
		expect(taskStatus(every2Days(), [covers(at(13, 8), at(13, 7))], at(13, 21))).toEqual({ kind: 'atrasada' });
		expect(taskStatus(every2Days(), [covers(at(13, 19), at(13, 18))], at(14, 13))).toEqual({ kind: 'en espera', progress: 0.5 });
		expect(taskStatus(every2Days(), [covers(at(13, 19), at(13, 18))], at(15, 7))).toEqual({ kind: 'pendiente' });
	});

	it('relativa en días nunca completada: espera desde creadaEn la primera ventana que no cerró', () => {
		expect(taskStatus(every2Days(at(13, 12)), [], at(13, 15))).toEqual({ kind: 'en espera', progress: 0.5 });
		expect(taskStatus(every2Days(at(13, 12)), [], at(14, 8))).toEqual({ kind: 'atrasada' });
	});

	it('el instante de urgencia es A de N (pendiente) o su C (atrasada)', () => {
		const done = [covers(at(15, 8), at(15, 7))];
		expect(urgencyInstant(wednesday(), done, { kind: 'pendiente' }, at(15, 19))).toStrictEqual(at(15, 18));
		expect(urgencyInstant(wednesday(), done, { kind: 'atrasada' }, at(15, 22))).toStrictEqual(at(15, 21));
	});
});
