import { describe, expect, it } from 'vitest';
import { taskData } from './task-data';
import { edit } from './editing';
import type { RecurringTask, OneOffTask } from './task';

const CREATED = new Date(2026, 6, 1, 8, 0, 0);
const ONE_OFF: OneOffTask = { id: 't1', title: 'Pagar', kind: 'puntual', dueDate: new Date(2026, 6, 14), createdAt: CREATED };
const RELATIVE: RecurringTask = {
	id: 't2',
	title: 'Regar',
	kind: 'periodica',
	recurrence: { mode: 'relativo', every: 2, unit: 'dias' },
	createdAt: CREATED
};
const WEEKLY: RecurringTask = {
	id: 't3',
	title: 'Basura',
	kind: 'periodica',
	recurrence: { mode: 'calendario', weekdays: ['martes', 'jueves'] },
	createdAt: CREATED
};
const MONTHLY: RecurringTask = { ...WEEKLY, recurrence: { mode: 'calendario', monthDays: [10, 31] } };

describe('datosDeTarea', () => {
	it('da los valores actuales de cada forma, como los carga el panel', () => {
		expect(taskData(ONE_OFF)).toStrictEqual({ shape: 'puntual', title: 'Pagar', dueDate: '2026-07-14' });
		expect(taskData({ ...ONE_OFF, dueDate: undefined })).toStrictEqual({ shape: 'puntual', title: 'Pagar' });
		expect(taskData(RELATIVE)).toStrictEqual({ shape: 'relativa', title: 'Regar', every: 2, unit: 'dias' });
		expect(taskData(WEEKLY)).toStrictEqual({
			shape: 'calendario',
			title: 'Basura',
			weekdays: ['martes', 'jueves'],
			monthDays: []
		});
		expect(taskData(MONTHLY)).toStrictEqual({ shape: 'calendario', title: 'Basura', weekdays: [], monthDays: [10, 31] });
	});
});

describe('datosDeTarea con emoji y nota', () => {
	it('los incluye cuando la tarea los tiene', () => {
		expect(taskData({ ...ONE_OFF, emoji: '🌱', note: 'Usar guantes' })).toStrictEqual({
			shape: 'puntual',
			title: 'Pagar',
			emoji: '🌱',
			note: 'Usar guantes',
			dueDate: '2026-07-14'
		});
		expect(taskData({ ...RELATIVE, emoji: '🌱' })).toMatchObject({ shape: 'relativa', emoji: '🌱' });
		expect(taskData({ ...WEEKLY, note: 'x' })).toMatchObject({ shape: 'calendario', note: 'x' });
		expect(taskData({ ...MONTHLY, note: 'x' })).toMatchObject({ shape: 'calendario', note: 'x' });
	});
});

describe('editar emoji y nota', () => {
	it('escribe solo el campo que cambió', () => {
		const withEmoji = { ...ONE_OFF, emoji: '🌱', note: 'Usar guantes' };

		expect(edit(withEmoji, { ...taskData(withEmoji), emoji: '🔥' })).toStrictEqual({ ok: true, change: { emoji: '🔥' } });
		expect(edit(withEmoji, { ...taskData(withEmoji), note: '  Ventilar ' })).toStrictEqual({ ok: true, change: { note: 'Ventilar' } });
	});

	it('guardar el mismo emoji o la misma nota, aunque con espacios alrededor, no cambia nada', () => {
		const withEmoji = { ...ONE_OFF, emoji: '🌱', note: 'Usar guantes' };

		expect(edit(withEmoji, { ...taskData(withEmoji), emoji: ' 🌱 ', note: ' Usar guantes ' })).toStrictEqual({ ok: true, change: {} });
	});

	it('poner emoji y nota a una tarea que no los tenía los escribe', () => {
		expect(edit(ONE_OFF, { ...taskData(ONE_OFF), emoji: '👍🏽', note: 'Hola' })).toStrictEqual({
			ok: true,
			change: { emoji: '👍🏽', note: 'Hola' }
		});
	});

	it('vaciarlos o dejarlos en espacios los quita (null)', () => {
		const withEmoji = { ...ONE_OFF, emoji: '🌱', note: 'Usar guantes' };

		expect(edit(withEmoji, { ...taskData(withEmoji), emoji: '   ', note: '' })).toStrictEqual({
			ok: true,
			change: { emoji: null, note: null }
		});
	});

	it('un emoji inválido rechaza la edición entera, también el título válido', () => {
		expect(edit(ONE_OFF, { ...taskData(ONE_OFF), title: 'Pagar la luz', emoji: '🌱🔥' })).toStrictEqual({
			ok: false,
			errors: { emoji: 'invalido' }
		});
	});
});

describe('editar', () => {
	it('guardar sin cambios no cambia ningún campo', () => {
		for (const task of [ONE_OFF, RELATIVE, WEEKLY, MONTHLY])
			expect(edit(task, taskData(task))).toStrictEqual({ ok: true, change: {} });
	});

	it('cambiar el título cambia solo el título, sin los espacios de los extremos', () => {
		expect(edit(RELATIVE, { ...taskData(RELATIVE), title: '  Regar plantas ' })).toStrictEqual({
			ok: true,
			change: { title: 'Regar plantas' }
		});
	});

	it('cambiar la fecha límite, quitarla o agregarla', () => {
		expect(edit(ONE_OFF, { shape: 'puntual', title: 'Pagar', dueDate: '2026-07-20' })).toStrictEqual({
			ok: true,
			change: { dueDate: new Date(2026, 6, 20) }
		});
		expect(edit(ONE_OFF, { shape: 'puntual', title: 'Pagar' })).toStrictEqual({ ok: true, change: { dueDate: null } });
		const withoutLimit: OneOffTask = { id: 't1', title: 'Pagar', kind: 'puntual', createdAt: CREATED };
		expect(edit(withoutLimit, { shape: 'puntual', title: 'Pagar' })).toStrictEqual({ ok: true, change: {} });
		expect(edit(withoutLimit, { shape: 'puntual', title: 'Pagar', dueDate: '2026-07-14' })).toStrictEqual({
			ok: true,
			change: { dueDate: new Date(2026, 6, 14) }
		});
	});

	it('la recurrencia se cambia entera, aunque cambie un solo subcampo', () => {
		expect(edit(RELATIVE, { shape: 'relativa', title: 'Regar', every: 2, unit: 'horas' })).toStrictEqual({
			ok: true,
			change: { recurrence: { mode: 'relativo', every: 2, unit: 'horas' } }
		});
		expect(edit(RELATIVE, { shape: 'relativa', title: 'Regar', every: 3, unit: 'dias' })).toStrictEqual({
			ok: true,
			change: { recurrence: { mode: 'relativo', every: 3, unit: 'dias' } }
		});
	});

	it('los días se comparan como conjunto: el orden en que se eligen no es un cambio', () => {
		const data = { shape: 'calendario', title: 'Basura', weekdays: ['jueves', 'martes'], monthDays: [] } as const;

		expect(edit(WEEKLY, { ...data, weekdays: [...data.weekdays] })).toStrictEqual({ ok: true, change: {} });
		expect(edit(MONTHLY, { shape: 'calendario', title: 'Basura', weekdays: [], monthDays: [31, 10] })).toStrictEqual({
			ok: true,
			change: {}
		});
	});

	it('cambiar de semanal a mensual con los mismos números no es lo mismo', () => {
		expect(edit(WEEKLY, { shape: 'calendario', title: 'Basura', weekdays: [], monthDays: [2, 4] })).toStrictEqual({
			ok: true,
			change: { recurrence: { mode: 'calendario', monthDays: [2, 4] } }
		});
		expect(edit(WEEKLY, { shape: 'calendario', title: 'Basura', weekdays: ['martes'], monthDays: [] })).toStrictEqual({
			ok: true,
			change: { recurrence: { mode: 'calendario', weekdays: ['martes'] } }
		});
	});

	it('pasar a puntual quita la recurrencia y escribe la fecha límite, aunque no tenga', () => {
		expect(edit(WEEKLY, { shape: 'puntual', title: 'Basura', dueDate: '2026-07-20' })).toStrictEqual({
			ok: true,
			change: { kind: 'puntual', dueDate: new Date(2026, 6, 20), recurrence: null }
		});
		expect(edit(WEEKLY, { shape: 'puntual', title: 'Basura' })).toStrictEqual({
			ok: true,
			change: { kind: 'puntual', dueDate: null, recurrence: null }
		});
	});

	it('pasar a periódica quita la fecha límite, la tuviera o no', () => {
		const relative = { mode: 'relativo', every: 2, unit: 'dias' } as const;

		expect(edit(ONE_OFF, { shape: 'relativa', title: 'Pagar', every: 2, unit: 'dias' })).toStrictEqual({
			ok: true,
			change: { kind: 'periodica', recurrence: relative, dueDate: null }
		});
		const withoutLimit: OneOffTask = { id: 't1', title: 'Pagar', kind: 'puntual', createdAt: CREATED };
		expect(edit(withoutLimit, { shape: 'relativa', title: 'Pagar', every: 2, unit: 'dias' })).toStrictEqual({
			ok: true,
			change: { kind: 'periodica', recurrence: relative, dueDate: null }
		});
	});

	it('con algún campo inválido la edición se rechaza entera, con los mismos errores que al crear', () => {
		expect(edit(ONE_OFF, { shape: 'puntual', title: 'Pagar la luz', dueDate: '2026-04-31' })).toStrictEqual({
			ok: false,
			errors: { dueDate: 'invalida' }
		});
		expect(edit(RELATIVE, { shape: 'relativa', title: '   ', every: 0, unit: 'dias' })).toStrictEqual({
			ok: false,
			errors: { title: 'vacio', every: 'invalido' }
		});
		expect(edit(WEEKLY, { shape: 'calendario', title: 'Basura', weekdays: [], monthDays: [] })).toStrictEqual({
			ok: false,
			errors: { days: 'faltan' }
		});
	});
});

describe('editar una pausada (spec §5.8)', () => {
	const PAUSED: RecurringTask = { ...RELATIVE, paused: true };
	const NOW = new Date(2026, 6, 15, 10, 0, 0);

	it('pasarla a puntual la reanuda: quita pausada y guarda reanudadaEn = ahora', () => {
		const result = edit(PAUSED, { shape: 'puntual', title: 'Regar' }, NOW);

		expect(result).toStrictEqual({
			ok: true,
			change: { kind: 'puntual', dueDate: null, recurrence: null, paused: null, resumedAt: NOW }
		});
	});

	it('editar otros campos, o el modo, la deja pausada', () => {
		expect(edit(PAUSED, { shape: 'calendario', title: 'Regar plantas', weekdays: ['jueves'], monthDays: [] }, NOW)).toStrictEqual({
			ok: true,
			change: { title: 'Regar plantas', recurrence: { mode: 'calendario', weekdays: ['jueves'] } }
		});
	});

	it('pasar a puntual una que no está pausada no la reanuda', () => {
		expect(edit(RELATIVE, { shape: 'puntual', title: 'Regar' }, NOW)).toStrictEqual({
			ok: true,
			change: { kind: 'puntual', dueDate: null, recurrence: null }
		});
	});
});

describe('editar el esfuerzo', () => {
	const WITH_EFFORT: OneOffTask = { ...ONE_OFF, effort: 'media' };

	it('elegir otro nivel entra en el cambio, y solo él', () => {
		expect(edit(WITH_EFFORT, { ...taskData(WITH_EFFORT), effort: 'rapida' })).toStrictEqual({
			ok: true,
			change: { effort: 'rapida' }
		});
	});

	it('poner uno a una tarea sin estimar entra en el cambio', () => {
		expect(edit(ONE_OFF, { ...taskData(ONE_OFF), effort: 'larga' })).toStrictEqual({ ok: true, change: { effort: 'larga' } });
	});

	it('elegir "Sin estimar" lo quita con null', () => {
		expect(edit(WITH_EFFORT, { ...taskData(WITH_EFFORT), effort: undefined })).toStrictEqual({
			ok: true,
			change: { effort: null }
		});
	});

	it('sin cambiarlo, no entra en el cambio', () => {
		expect(edit(WITH_EFFORT, taskData(WITH_EFFORT))).toStrictEqual({ ok: true, change: {} });
	});

	it('cambiar el tipo no lo toca', () => {
		const result = edit(WITH_EFFORT, { shape: 'relativa', title: 'Pagar', effort: 'media', every: 3, unit: 'dias' });

		expect(result).toStrictEqual({
			ok: true,
			change: { kind: 'periodica', dueDate: null, recurrence: { mode: 'relativo', every: 3, unit: 'dias' } }
		});
	});
});
