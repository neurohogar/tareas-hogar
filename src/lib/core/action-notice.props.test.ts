// Spec §6.2 (Action notice): what the notice offers and when an action asks for confirmation.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { changeOfAction, whatTheActionDoes, type PanelAction } from './panel-action';
import { actionNotice, discardAndAct, saveAndAct, type NoticeAction } from './action-notice';
import { CHANGES_MESSAGE, KEEP_EDITING } from './unsaved-changes-notice';
import type { TaskData } from './task-data';
import type { RecurringTask } from './task';

const ACTIONS: PanelAction[] = ['pausar', 'reanudar', 'posponer 1 hora', 'posponer 3 horas', 'posponer hasta mañana', 'quitar posponer'];
const now = fc.date({ min: new Date(2000, 0, 1), max: new Date(2100, 0, 1), noInvalidDate: true });
const title = fc.stringMatching(/^[a-z]{1,8}$/);
const RELATIVE: RecurringTask = { id: 't', title: 'Regar', kind: 'periodica', recurrence: { mode: 'relativo', every: 2, unit: 'dias' }, createdAt: new Date(2026, 0, 1) };

/** Pause an active recurring task with what is written in the form. */
const pausing = (data: TaskData, moment: Date): NoticeAction => ({
	action: 'pausar',
	taskOnOpen: RELATIVE,
	task: RELATIVE,
	completions: [],
	now: moment,
	minimalModeOn: false,
	form: { data }
});
const staysRelative = (t: string): TaskData => ({ shape: 'relativa', title: t, every: 2, unit: 'dias' });
const becomesOneOff = (t: string): TaskData => ({ shape: 'puntual', title: t });

describe('whatTheActionDoes: properties (spec §6.2)', () => {
	it('with changes it opens its notice and without changes it acts', () => {
		fc.assert(fc.property(fc.constantFrom(...ACTIONS), fc.boolean(), (action, changes) => {
			expect(whatTheActionDoes(action, changes)).toBe(changes ? 'opensActionNotice' : 'acts');
		}));
	});

	it('Borrar tarea only asks for its confirmation, with or without changes', () => {
		fc.assert(fc.property(fc.boolean(), (changes) => {
			expect(whatTheActionDoes('borrar tarea', changes)).toBe('asksDeleteConfirmation');
		}));
	});
});

describe('changeOfAction: properties (spec §5.8, §5.9)', () => {
	it('is a function of now: the same moment gives the same change, and resume saves it', () => {
		fc.assert(
			fc.property(fc.constantFrom(...ACTIONS), now, (action, moment) => {
				expect(changeOfAction(action, moment)).toStrictEqual(changeOfAction(action, new Date(moment.getTime())));
			})
		);
		fc.assert(fc.property(now, (moment) => {
			expect(changeOfAction('reanudar', moment).resumedAt).toEqual(moment);
		}));
	});
});

describe('actionNotice: properties (spec §6.2)', () => {
	it('always offers Seguir editando first and Descartar y <action> after', () => {
		fc.assert(
			fc.property(title, fc.boolean(), now, (t, stays, moment) => {
				const notice = actionNotice(pausing(stays ? staysRelative(t) : becomesOneOff(t), moment));
				expect(notice?.buttons.slice(0, 2)).toEqual([KEEP_EDITING, { text: 'Descartar y pausar', effect: 'descartar' }]);
			})
		);
	});

	it('offers Guardar y <action> exactly when what is saved leaves the action meaningful', () => {
		fc.assert(
			fc.property(title, fc.boolean(), now, (t, stays, moment) => {
				const notice = actionNotice(pausing(stays ? staysRelative(t) : becomesOneOff(t), moment));
				expect(notice?.buttons.some(({ effect }) => effect === 'guardar')).toBe(stays);
				expect(notice?.message).toBe(stays ? CHANGES_MESSAGE : 'Con estos cambios la tarea ya no se puede pausar');
			})
		);
	});

	it('if the action no longer applies, there is no notice and no button acts', () => {
		fc.assert(
			fc.property(title, now, (t, moment) => {
				const context = { ...pausing(staysRelative(t), moment), action: 'reanudar' as const };
				expect(actionNotice(context)).toBeUndefined();
				expect(discardAndAct(context)).toBeUndefined();
				expect(saveAndAct(context)).toEqual({ result: 'aviso cerrado' });
			})
		);
	});

	it('Descartar y actuar writes only the action, without what is written in the form', () => {
		fc.assert(fc.property(title, now, (t, moment) => {
			expect(discardAndAct(pausing(staysRelative(t), moment))).toEqual(changeOfAction('pausar', moment));
		}));
	});

	it('Guardar y actuar saves what is written and the action in a single change', () => {
		fc.assert(
			fc.property(title, now, (t, moment) => {
				const result = saveAndAct(pausing(staysRelative(t), moment));
				expect(result.result).toBe('guardado');
				if (result.result === 'guardado') expect(result.change).toMatchObject({ paused: true });
			})
		);
	});

	it('if what is saved leaves the action meaningless, Guardar y actuar saves nothing', () => {
		fc.assert(
			fc.property(title, now, (t, moment) => {
				const result = saveAndAct(pausing(becomesOneOff(t), moment));
				expect(result.result).toBe('aviso actualizado');
			})
		);
	});
});
