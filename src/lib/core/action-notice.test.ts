import { describe, expect, it } from 'vitest';
import { optionAction, changeOfAction, whatTheActionDoes, type PanelAction } from './panel-action';
import { actionNotice, discardAndAct, saveAndAct, type NoticeAction } from './action-notice';
import { taskData, type TaskData } from './task-data';
import type { Completion, Task } from './task';

const CREATED = new Date(2026, 6, 13, 8, 0, 0);
const NOW = new Date(2026, 6, 15, 8, 0, 0);
const LATER = new Date(2026, 6, 15, 8, 3, 0);
const WATER: Task = { id: 'r', title: 'Regar', kind: 'periodica', recurrence: { mode: 'relativo', every: 2, unit: 'dias' }, createdAt: CREATED };
const PAUSED: Task = { ...WATER, paused: true } as Task;
const PAY: Task = { id: 'p', title: 'Pagar', kind: 'puntual', createdAt: CREATED };
const POSTPONED: Task = { ...PAY, postponed: { from: NOW, to: new Date(2026, 6, 15, 9, 0, 0) } };
const TO_ONE_OFF = (title: string): TaskData => ({ shape: 'puntual', title });

function inNotice(action: PanelAction, task: Task, changes: Partial<NoticeAction> = {}): NoticeAction {
	return {
		action,
		taskOnOpen: task,
		task,
		completions: [],
		now: NOW,
		form: { data: { ...taskData(task), title: `${task.title} nuevo` } },
		...changes
	};
}

const texts = (context: NoticeAction) => actionNotice(context)?.buttons.map(({ text }) => text);

describe('queHaceLaAccion (spec §6.2)', () => {
	const ACTIONS: PanelAction[] = ['pausar', 'reanudar', 'posponer 1 hora', 'posponer 3 horas', 'posponer hasta mañana', 'quitar posponer'];

	it('sin cambios, cada acción actúa en el momento', () => {
		for (const action of ACTIONS) expect(whatTheActionDoes(action, false)).toBe('actúa');
	});

	it('con cambios, cada acción abre el aviso', () => {
		for (const action of ACTIONS) expect(whatTheActionDoes(action, true)).toBe('abre el aviso de acción');
	});

	it('Borrar tarea no suma el aviso: con o sin cambios, solo su confirmación', () => {
		expect(whatTheActionDoes('borrar tarea', true)).toBe('pide confirmar el borrado');
		expect(whatTheActionDoes('borrar tarea', false)).toBe('pide confirmar el borrado');
	});
});

describe('accionDeLaOpcion', () => {
	it('nombra la acción con la opción tocada', () => {
		expect(optionAction('1 hora')).toBe('posponer 1 hora');
		expect(optionAction('3 horas')).toBe('posponer 3 horas');
		expect(optionAction('hasta mañana')).toBe('posponer hasta mañana');
	});
});

describe('avisoDeAccion (spec §6.2)', () => {
	it('dice "Tenés cambios sin guardar" y ofrece los tres botones, con el efecto de cada uno', () => {
		expect(actionNotice(inNotice('pausar', WATER))).toEqual({
			message: 'Tenés cambios sin guardar',
			buttons: [
				{ text: 'Seguir editando', effect: 'seguir editando' },
				{ text: 'Descartar y pausar', effect: 'descartar' },
				{ text: 'Guardar y pausar', effect: 'guardar' }
			]
		});
	});

	it.each<[PanelAction, Task]>([
		['reanudar', PAUSED],
		['posponer 1 hora', PAY],
		['posponer 3 horas', PAY],
		['posponer hasta mañana', PAY],
		['quitar posponer', POSTPONED]
	])('nombra la acción en sus botones: %s', (action, task) => {
		expect(texts(inNotice(action, task))).toEqual(['Seguir editando', `Descartar y ${action}`, `Guardar y ${action}`]);
	});

	describe('si lo guardado deja la acción sin sentido', () => {
		it('Pausar una tarea cambiada a No se repite: lo dice y no ofrece Guardar', () => {
			const notice = actionNotice(inNotice('pausar', WATER, { form: { data: TO_ONE_OFF('Regar') } }));
			expect(notice).toEqual({
				message: 'Con estos cambios la tarea ya no se puede pausar',
				buttons: [
					{ text: 'Seguir editando', effect: 'seguir editando' },
					{ text: 'Descartar y pausar', effect: 'descartar' }
				]
			});
		});

		it('Reanudar una pausada cambiada a No se repite: guardar ya la reanuda', () => {
			const notice = actionNotice(inNotice('reanudar', PAUSED, { form: { data: TO_ONE_OFF('Regar') } }));
			expect(notice?.message).toBe('Con estos cambios la tarea ya no se puede reanudar');
			expect(notice?.buttons.map(({ text }) => text)).toEqual(['Seguir editando', 'Descartar y reanudar']);
		});

		it('Posponer una periódica con completados cambiada a No se repite: quedaría completada', () => {
			const completions: Completion[] = [{ id: 'c', taskId: 'r', completedAt: new Date(2026, 6, 12, 9, 0, 0) }];
			const notice = actionNotice(inNotice('posponer 1 hora', WATER, { completions, form: { data: TO_ONE_OFF('Regar') } }));
			expect(notice?.message).toBe('Con estos cambios la tarea ya no se puede posponer 1 hora');
			expect(notice?.buttons.map(({ text }) => text)).toEqual(['Seguir editando', 'Descartar y posponer 1 hora']);
		});

		it('la misma periódica, sin completados, se puede posponer como puntual', () => {
			expect(texts(inNotice('posponer 1 hora', WATER, { form: { data: TO_ONE_OFF('Regar') } }))).toContain('Guardar y posponer 1 hora');
		});
	});

	describe('si lo escrito es inválido no hay cómo evaluarlo: se ofrece Guardar', () => {
		it('por un campo', () => {
			const notice = actionNotice(inNotice('pausar', WATER, { form: { data: TO_ONE_OFF('') } }));
			expect(notice?.message).toBe('Tenés cambios sin guardar');
			expect(notice?.buttons.map(({ text }) => text)).toContain('Guardar y pausar');
		});
	});

	describe('se mantiene al día con la tarea y el ahora del momento', () => {
		it('si otro dispositivo hace que la acción no corresponda, no hay aviso', () => {
			expect(actionNotice(inNotice('pausar', WATER, { task: PAUSED }))).toBeUndefined();
			expect(actionNotice(inNotice('reanudar', PAUSED, { task: WATER }))).toBeUndefined();
			expect(actionNotice(inNotice('posponer 1 hora', PAY, { task: POSTPONED }))).toBeUndefined();
		});

		it('si la posposición vence justo, Quitar posponer deja de corresponder', () => {
			const to = new Date(2026, 6, 15, 9, 0, 0);
			expect(actionNotice(inNotice('quitar posponer', POSTPONED, { now: new Date(to.getTime() - 1) }))).toBeDefined();
			expect(actionNotice(inNotice('quitar posponer', POSTPONED, { now: to }))).toBeUndefined();
		});

		it('lo guardado se evalúa sobre la tarea de ahora: una posposición remota sigue vigente', () => {
			const remote: Task = { ...WATER, postponed: { from: NOW, to: new Date(2026, 6, 15, 9, 0, 0) } };
			expect(texts(inNotice('quitar posponer', WATER, { task: remote }))).toContain('Guardar y quitar posponer');
		});

		it('Guardar puede aparecer con el tiempo: lo guardado vuelve a estar pendiente', () => {
			// Vence el 14; con cada 5 días estaría en espera hasta el 17 a las 9.
			const completions: Completion[] = [{ id: 'c', taskId: 'r', completedAt: new Date(2026, 6, 12, 9, 0, 0) }];
			const data: TaskData = { shape: 'relativa', title: 'Regar', every: 5, unit: 'dias' };
			const context = inNotice('posponer 1 hora', WATER, { completions, form: { data } });
			expect(texts(context)).toEqual(['Seguir editando', 'Descartar y posponer 1 hora']);
			expect(texts({ ...context, now: new Date(2026, 6, 17, 10, 0, 0) })).toContain('Guardar y posponer 1 hora');
		});
	});
});

describe('cambioDeAccion (spec §5.8, §5.9, §6.2): "ahora" es el momento de tocar el botón', () => {
	it('pausar, reanudar y quitar posponer', () => {
		expect(changeOfAction('pausar', LATER)).toEqual({ paused: true });
		expect(changeOfAction('reanudar', LATER)).toEqual({ paused: null, resumedAt: LATER });
		expect(changeOfAction('quitar posponer', LATER)).toEqual({ postponed: null });
	});

	it('posponer, con la opción tocada', () => {
		expect(changeOfAction('posponer 1 hora', LATER)).toEqual({ postponed: { from: LATER, to: new Date(2026, 6, 15, 9, 3, 0) } });
		expect(changeOfAction('posponer 3 horas', LATER)).toEqual({ postponed: { from: LATER, to: new Date(2026, 6, 15, 11, 3, 0) } });
		const midnight = new Date(2026, 6, 16, 0, 1, 0);
		expect(changeOfAction('posponer hasta mañana', midnight)).toEqual({ postponed: { from: midnight, to: new Date(2026, 6, 17, 7, 0, 0) } });
	});
});

describe('descartarYActuar (spec §6.2)', () => {
	it('actúa sobre la tarea como estaba, sin nada de lo escrito', () => {
		expect(discardAndAct(inNotice('pausar', WATER, { now: LATER }))).toEqual({ paused: true });
		expect(discardAndAct(inNotice('posponer 1 hora', WATER, { now: LATER }))).toEqual({ postponed: { from: LATER, to: new Date(2026, 6, 15, 9, 3, 0) } });
	});

	it('también si lo guardado dejaría la acción sin sentido', () => {
		expect(discardAndAct(inNotice('pausar', WATER, { form: { data: TO_ONE_OFF('Regar') } }))).toEqual({ paused: true });
	});

	it('si la acción ya no corresponde, no actúa', () => {
		expect(discardAndAct(inNotice('pausar', WATER, { task: PAUSED }))).toBeUndefined();
	});
});

describe('guardarYActuar (spec §6.2): se vuelve a evaluar al tocarlo', () => {
	it('guarda y actúa en un solo cambio, con el ahora del toque', () => {
		const result = saveAndAct(inNotice('posponer 1 hora', PAY, { now: LATER }));
		expect(result).toEqual({
			result: 'guardado',
			change: { title: 'Pagar nuevo', postponed: { from: LATER, to: new Date(2026, 6, 15, 9, 3, 0) } }
		});
	});

	it('si Guardar falla por validación, no se ejecuta nada', () => {
		const context = inNotice('pausar', WATER, { form: { data: TO_ONE_OFF('') } });
		expect(saveAndAct(context)).toEqual({ result: 'rechazado', errors: { title: 'vacio' } });
	});

	it('si la acción quedó sin sentido, no guarda ni actúa y el aviso queda actualizado', () => {
		const context = inNotice('pausar', WATER, { form: { data: TO_ONE_OFF('Regar') } });
		expect(saveAndAct(context)).toEqual({ result: 'aviso actualizado', notice: actionNotice(context) });
	});

	it('si la acción ya no corresponde, no guarda ni actúa y el aviso se cierra', () => {
		expect(saveAndAct(inNotice('pausar', WATER, { task: PAUSED }))).toEqual({ result: 'aviso cerrado' });
	});

	it('mide lo escrito contra la tarea al abrir: no pisa lo que otro dispositivo cambió', () => {
		const remote: Task = { ...WATER, note: 'Remota' };
		const result = saveAndAct(inNotice('pausar', WATER, { task: remote }));
		expect(result).toEqual({ result: 'guardado', change: { title: 'Regar nuevo', paused: true } });
	});
});
