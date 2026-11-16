import { describe, expect, it } from 'vitest';
import { noticeOnComplete, visibleNotice, completionToUndo, msUntilDue, noticeReturn } from './notice';
import { complete } from './completions';
import type { Completion, Task } from './task';

const water: Task = { id: 'regar', title: 'Regar', kind: 'puntual', createdAt: new Date(2026, 0, 1) };
const completedAt = new Date(2026, 6, 15, 8, 0, 0);
const completion: Completion = { id: 'c1', taskId: 'regar', completedAt };
const notice = noticeOnComplete(water, completion);
const plusMs = (ms: number) => new Date(completedAt.getTime() + ms);

describe('avisoAlCompletar', () => {
	it('nombra la tarea por su título al completar y ofrece deshacer ese completado', () => {
		expect(notice).toStrictEqual({ name: 'Regar', completion });
	});

	it('con emoji nombra la tarea «emoji título»', () => {
		expect(noticeOnComplete({ ...water, emoji: '🌱' }, completion).name).toBe('🌱 Regar');
	});
});

describe('regresoDelAviso (spec §5.4: el aviso dice cuándo vuelve la tarea)', () => {
	const COMPLETED_AT = new Date(2026, 10, 13, 10, 0, 0);
	const relative = (every: number, unit: 'horas' | 'dias'): Task => ({
		id: 'r',
		title: 'Regar',
		kind: 'periodica',
		recurrence: { mode: 'relativo', every, unit },
		createdAt: new Date(2026, 10, 1)
	});
	/** Completa la tarea con los completados que ya tenía y consulta el regreso del aviso. */
	const returnNotice = (task: Task, before: Completion[] = [], now = COMPLETED_AT) =>
		noticeReturn(noticeOnComplete(task, complete(task, before, 'nuevo', COMPLETED_AT), before), now);

	it('una periódica dice cuándo vuelve, con el instante calculado después del completado', () => {
		expect(returnNotice(relative(8, 'horas'))).toBe('Vuelve hoy 18:00 · en 8 horas');
		expect(returnNotice(relative(6, 'dias'))).toBe('Vuelve el jueves 19 10:00 · en 6 días');
		const oldOne: Completion = { id: 'v', taskId: 'r', completedAt: new Date(2026, 10, 12, 8, 0) };
		expect(returnNotice(relative(1, 'dias'), [oldOne])).toBe('Vuelve mañana 10:00 · en 24 horas');
	});

	it('la distancia se cuenta desde ahora, mientras el aviso se ve', () => {
		expect(returnNotice(relative(8, 'horas'), [], new Date(2026, 10, 13, 10, 0, 4))).toBe('Vuelve hoy 18:00 · en 8 horas');
		expect(returnNotice(relative(1, 'horas'), [], new Date(2026, 10, 13, 10, 0, 4))).toBe('Vuelve hoy 11:00 · en 1 hora');
	});

	it('una de calendario vuelve en su próxima ocurrencia, a las 00:00', () => {
		const thursday: Task = { id: 's', title: 'Regar', kind: 'periodica', recurrence: { mode: 'calendario', weekdays: ['jueves'] }, createdAt: new Date(2026, 10, 1) };
		expect(returnNotice(thursday)).toBe('Vuelve el jueves 19 · en 6 días');
	});

	it('una puntual no vuelve: el aviso no lleva regreso', () => {
		const pay: Task = { id: 'p', title: 'Pagar', kind: 'puntual', createdAt: new Date(2026, 10, 1), dueDate: new Date(2026, 10, 20) };
		expect(returnNotice(pay)).toBeUndefined();
		expect(noticeOnComplete(pay, complete(pay, [], 'nuevo', COMPLETED_AT))).not.toHaveProperty('returns');
	});
});

describe('avisoVisible', () => {
	it('se ve mientras completadoEn <= ahora < completadoEn + 5 s', () => {
		expect(visibleNotice(notice, completedAt)).toBe(notice);
		expect(visibleNotice(notice, plusMs(4_999))).toBe(notice);
	});

	it('a los 5 segundos ya no se ve', () => {
		expect(visibleNotice(notice, plusMs(5_000))).toBeUndefined();
		expect(visibleNotice(notice, plusMs(3_600_000))).toBeUndefined();
	});

	it('antes de completadoEn no se ve', () => {
		expect(visibleNotice(notice, plusMs(-1))).toBeUndefined();
	});

	it('sin aviso no hay nada que ver', () => {
		expect(visibleNotice(undefined, completedAt)).toBeUndefined();
	});
});

describe('msHastaQueVence', () => {
	it('es lo que falta para los 5 segundos desde completadoEn', () => {
		expect(msUntilDue(notice, completedAt)).toBe(5_000);
		expect(msUntilDue(notice, plusMs(4_999))).toBe(1);
	});
});

describe('completadoADeshacer', () => {
	it('es el completado que nombra el aviso, mientras el aviso se ve', () => {
		expect(completionToUndo(notice, completedAt)).toBe(completion);
		expect(completionToUndo(notice, plusMs(4_999))).toBe(completion);
	});

	it('con el aviso vencido no hay nada que deshacer', () => {
		expect(completionToUndo(notice, plusMs(5_000))).toBeUndefined();
	});

	it('sin aviso no hay nada que deshacer', () => {
		expect(completionToUndo(undefined, completedAt)).toBeUndefined();
	});
});
