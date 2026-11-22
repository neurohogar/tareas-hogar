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
		minimalModeOn: false,
		form: { data: { ...taskData(task), title: `${task.title} nuevo` } },
		...changes
	};
}

const texts = (context: NoticeAction) => actionNotice(context)?.buttons.map(({ text }) => text);

describe('whatTheActionDoes (spec §6.2)', () => {
	const ACTIONS: PanelAction[] = ['pausar', 'reanudar', 'posponer 1 hora', 'posponer 3 horas', 'posponer hasta mañana', 'quitar posponer'];

	it('without changes, each action acts at once', () => {
		for (const action of ACTIONS) expect(whatTheActionDoes(action, false)).toBe('acts');
	});

	it('with changes, each action opens the notice', () => {
		for (const action of ACTIONS) expect(whatTheActionDoes(action, true)).toBe('opensActionNotice');
	});

	it('Borrar tarea does not add the notice: with or without changes, only its confirmation', () => {
		expect(whatTheActionDoes('borrar tarea', true)).toBe('asksDeleteConfirmation');
		expect(whatTheActionDoes('borrar tarea', false)).toBe('asksDeleteConfirmation');
	});
});

describe('optionAction', () => {
	it('names the action with the option tapped', () => {
		expect(optionAction('1 hora')).toBe('posponer 1 hora');
		expect(optionAction('3 horas')).toBe('posponer 3 horas');
		expect(optionAction('hasta mañana')).toBe('posponer hasta mañana');
	});
});

describe('actionNotice (spec §6.2)', () => {
	it('says "Tenés cambios sin guardar" and offers the three buttons, with the effect of each', () => {
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
	])('names the action in its buttons: %s', (action, task) => {
		expect(texts(inNotice(action, task))).toEqual(['Seguir editando', `Descartar y ${action}`, `Guardar y ${action}`]);
	});

	describe('if what is saved leaves the action meaningless', () => {
		it('Pausar a task changed to No se repite: says so and does not offer Guardar', () => {
			const notice = actionNotice(inNotice('pausar', WATER, { form: { data: TO_ONE_OFF('Regar') } }));
			expect(notice).toEqual({
				message: 'Con estos cambios la tarea ya no se puede pausar',
				buttons: [
					{ text: 'Seguir editando', effect: 'seguir editando' },
					{ text: 'Descartar y pausar', effect: 'descartar' }
				]
			});
		});

		it('Reanudar a paused task changed to No se repite: saving already resumes it', () => {
			const notice = actionNotice(inNotice('reanudar', PAUSED, { form: { data: TO_ONE_OFF('Regar') } }));
			expect(notice?.message).toBe('Con estos cambios la tarea ya no se puede reanudar');
			expect(notice?.buttons.map(({ text }) => text)).toEqual(['Seguir editando', 'Descartar y reanudar']);
		});

		it('Posponer a recurring task with completions changed to No se repite: it would be completed', () => {
			const completions: Completion[] = [{ id: 'c', taskId: 'r', completedAt: new Date(2026, 6, 12, 9, 0, 0) }];
			const notice = actionNotice(inNotice('posponer 1 hora', WATER, { completions, form: { data: TO_ONE_OFF('Regar') } }));
			expect(notice?.message).toBe('Con estos cambios la tarea ya no se puede posponer 1 hora');
			expect(notice?.buttons.map(({ text }) => text)).toEqual(['Seguir editando', 'Descartar y posponer 1 hora']);
		});

		it('the same recurring task, without completions, can be postponed as one-off', () => {
			expect(texts(inNotice('posponer 1 hora', WATER, { form: { data: TO_ONE_OFF('Regar') } }))).toContain('Guardar y posponer 1 hora');
		});
	});

	describe('if what is written is invalid there is no way to evaluate it: Guardar is offered', () => {
		it('because of one field', () => {
			const notice = actionNotice(inNotice('pausar', WATER, { form: { data: TO_ONE_OFF('') } }));
			expect(notice?.message).toBe('Tenés cambios sin guardar');
			expect(notice?.buttons.map(({ text }) => text)).toContain('Guardar y pausar');
		});
	});

	describe('it stays up to date with the task and the now of the moment', () => {
		it('if another device makes the action no longer apply, there is no notice', () => {
			expect(actionNotice(inNotice('pausar', WATER, { task: PAUSED }))).toBeUndefined();
			expect(actionNotice(inNotice('reanudar', PAUSED, { task: WATER }))).toBeUndefined();
			expect(actionNotice(inNotice('posponer 1 hora', PAY, { task: POSTPONED }))).toBeUndefined();
		});

		it('if the postponement expires right now, Quitar posponer no longer applies', () => {
			const to = new Date(2026, 6, 15, 9, 0, 0);
			expect(actionNotice(inNotice('quitar posponer', POSTPONED, { now: new Date(to.getTime() - 1) }))).toBeDefined();
			expect(actionNotice(inNotice('quitar posponer', POSTPONED, { now: to }))).toBeUndefined();
		});

		it('what is saved is evaluated on the task as of now: a remote postponement stays active', () => {
			const remote: Task = { ...WATER, postponed: { from: NOW, to: new Date(2026, 6, 15, 9, 0, 0) } };
			expect(texts(inNotice('quitar posponer', WATER, { task: remote }))).toContain('Guardar y quitar posponer');
		});

		it('Guardar can appear over time: what is saved becomes pending again', () => {
			// Due on the 14th; with every 5 days it would be waiting until the 17th at 9.
			const completions: Completion[] = [{ id: 'c', taskId: 'r', completedAt: new Date(2026, 6, 12, 9, 0, 0) }];
			const data: TaskData = { shape: 'relativa', title: 'Regar', every: 5, unit: 'dias' };
			const context = inNotice('posponer 1 hora', WATER, { completions, form: { data } });
			expect(texts(context)).toEqual(['Seguir editando', 'Descartar y posponer 1 hora']);
			expect(texts({ ...context, now: new Date(2026, 6, 17, 10, 0, 0) })).toContain('Guardar y posponer 1 hora');
		});
	});
});

describe('changeOfAction (spec §5.8, §5.9, §6.2): "now" is the moment the button is tapped', () => {
	it('pause, resume and remove postponement', () => {
		expect(changeOfAction('pausar', LATER)).toEqual({ paused: true });
		expect(changeOfAction('reanudar', LATER)).toEqual({ paused: null, resumedAt: LATER });
		expect(changeOfAction('quitar posponer', LATER)).toEqual({ postponed: null });
	});

	it('postpone, with the option tapped', () => {
		expect(changeOfAction('posponer 1 hora', LATER)).toEqual({ postponed: { from: LATER, to: new Date(2026, 6, 15, 9, 3, 0) } });
		expect(changeOfAction('posponer 3 horas', LATER)).toEqual({ postponed: { from: LATER, to: new Date(2026, 6, 15, 11, 3, 0) } });
		const midnight = new Date(2026, 6, 16, 0, 1, 0);
		expect(changeOfAction('posponer hasta mañana', midnight)).toEqual({ postponed: { from: midnight, to: new Date(2026, 6, 17, 7, 0, 0) } });
	});
});

describe('discardAndAct (spec §6.2)', () => {
	it('acts on the task as it was, without anything that was written', () => {
		expect(discardAndAct(inNotice('pausar', WATER, { now: LATER }))).toEqual({ paused: true });
		expect(discardAndAct(inNotice('posponer 1 hora', WATER, { now: LATER }))).toEqual({ postponed: { from: LATER, to: new Date(2026, 6, 15, 9, 3, 0) } });
	});

	it('also if what is saved would leave the action meaningless', () => {
		expect(discardAndAct(inNotice('pausar', WATER, { form: { data: TO_ONE_OFF('Regar') } }))).toEqual({ paused: true });
	});

	it('if the action no longer applies, it does not act', () => {
		expect(discardAndAct(inNotice('pausar', WATER, { task: PAUSED }))).toBeUndefined();
	});
});

describe('saveAndAct (spec §6.2): evaluated again when tapped', () => {
	it('saves and acts in a single change, with the now of the tap', () => {
		const result = saveAndAct(inNotice('posponer 1 hora', PAY, { now: LATER }));
		expect(result).toEqual({
			result: 'guardado',
			change: { title: 'Pagar nuevo', postponed: { from: LATER, to: new Date(2026, 6, 15, 9, 3, 0) } }
		});
	});

	it('if Guardar fails validation, nothing runs', () => {
		const context = inNotice('pausar', WATER, { form: { data: TO_ONE_OFF('') } });
		expect(saveAndAct(context)).toEqual({ result: 'rechazado', errors: { title: 'vacio' } });
	});

	it('if the action became meaningless, it neither saves nor acts and the notice is updated', () => {
		const context = inNotice('pausar', WATER, { form: { data: TO_ONE_OFF('Regar') } });
		expect(saveAndAct(context)).toEqual({ result: 'aviso actualizado', notice: actionNotice(context) });
	});

	it('if the action no longer applies, it neither saves nor acts and the notice closes', () => {
		expect(saveAndAct(inNotice('pausar', WATER, { task: PAUSED }))).toEqual({ result: 'aviso cerrado' });
	});

	it('measures what is written against the task as opened: it does not overwrite what another device changed', () => {
		const remote: Task = { ...WATER, note: 'Remota' };
		const result = saveAndAct(inNotice('pausar', WATER, { task: remote }));
		expect(result).toEqual({ result: 'guardado', change: { title: 'Regar nuevo', paused: true } });
	});
});
