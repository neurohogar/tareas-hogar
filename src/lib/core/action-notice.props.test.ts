// Spec §6.2 (Aviso de acción): qué ofrece el aviso y cuándo una acción pide confirmación.
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

/** Pausar una periódica activa con lo escrito en el formulario. */
const pausing = (data: TaskData, moment: Date): NoticeAction => ({
	action: 'pausar',
	taskOnOpen: RELATIVE,
	task: RELATIVE,
	completions: [],
	now: moment,
	form: { data }
});
const staysRelative = (t: string): TaskData => ({ shape: 'relativa', title: t, every: 2, unit: 'dias' });
const becomesOneOff = (t: string): TaskData => ({ shape: 'puntual', title: t });

describe('queHaceLaAccion: propiedades (spec §6.2)', () => {
	it('con cambios abre su aviso y sin cambios actúa', () => {
		fc.assert(fc.property(fc.constantFrom(...ACTIONS), fc.boolean(), (action, changes) => {
			expect(whatTheActionDoes(action, changes)).toBe(changes ? 'abre el aviso de acción' : 'actúa');
		}));
	});

	it('Borrar tarea solo pide su confirmación, con o sin cambios', () => {
		fc.assert(fc.property(fc.boolean(), (changes) => {
			expect(whatTheActionDoes('borrar tarea', changes)).toBe('pide confirmar el borrado');
		}));
	});
});

describe('cambioDeAccion: propiedades (spec §5.8, §5.9)', () => {
	it('es una función del ahora: el mismo momento da el mismo cambio, y reanudar lo guarda', () => {
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

describe('avisoDeAccion: propiedades (spec §6.2)', () => {
	it('siempre ofrece Seguir editando primero y Descartar y <acción> después', () => {
		fc.assert(
			fc.property(title, fc.boolean(), now, (t, stays, moment) => {
				const notice = actionNotice(pausing(stays ? staysRelative(t) : becomesOneOff(t), moment));
				expect(notice?.buttons.slice(0, 2)).toEqual([KEEP_EDITING, { text: 'Descartar y pausar', effect: 'descartar' }]);
			})
		);
	});

	it('ofrece Guardar y <acción> exactamente cuando lo guardado deja la acción con sentido', () => {
		fc.assert(
			fc.property(title, fc.boolean(), now, (t, stays, moment) => {
				const notice = actionNotice(pausing(stays ? staysRelative(t) : becomesOneOff(t), moment));
				expect(notice?.buttons.some(({ effect }) => effect === 'guardar')).toBe(stays);
				expect(notice?.message).toBe(stays ? CHANGES_MESSAGE : 'Con estos cambios la tarea ya no se puede pausar');
			})
		);
	});

	it('si la acción ya no corresponde, no hay aviso y ningún botón actúa', () => {
		fc.assert(
			fc.property(title, now, (t, moment) => {
				const context = { ...pausing(staysRelative(t), moment), action: 'reanudar' as const };
				expect(actionNotice(context)).toBeUndefined();
				expect(discardAndAct(context)).toBeUndefined();
				expect(saveAndAct(context)).toEqual({ result: 'aviso cerrado' });
			})
		);
	});

	it('Descartar y actuar escribe solo la acción, sin lo escrito en el formulario', () => {
		fc.assert(fc.property(title, now, (t, moment) => {
			expect(discardAndAct(pausing(staysRelative(t), moment))).toEqual(changeOfAction('pausar', moment));
		}));
	});

	it('Guardar y actuar guarda lo escrito y la acción en un solo cambio', () => {
		fc.assert(
			fc.property(title, now, (t, moment) => {
				const result = saveAndAct(pausing(staysRelative(t), moment));
				expect(result.result).toBe('guardado');
				if (result.result === 'guardado') expect(result.change).toMatchObject({ paused: true });
			})
		);
	});

	it('si lo guardado deja la acción sin sentido, Guardar y actuar no guarda nada', () => {
		fc.assert(
			fc.property(title, now, (t, moment) => {
				const result = saveAndAct(pausing(becomesOneOff(t), moment));
				expect(result.result).toBe('aviso actualizado');
			})
		);
	});
});
