// Spec §5.8, §5.9 and §6.2: the actions the panel offers on a task
// (Pausar, Reanudar, Posponer, Quitar posponer), what tapping them does and what they write.
import { pause, resume } from './pause';
import { postpone, removePostpone, type PostponeOption } from './postponement';
import type { TaskChange } from './task-document';

/** Spec §6.2: the actions with a notice, with the option tapped when postponing; this is how they are named on their buttons. */
export type PanelAction = 'pausar' | 'reanudar' | `posponer ${PostponeOption}` | 'quitar posponer';

/** Spec §6.2: the postpone action with the option tapped. */
export function optionAction(option: PostponeOption): PanelAction {
	return `posponer ${option}`;
}

export type ActionEffect = 'actúa' | 'abre el aviso de acción' | 'pide confirmar el borrado';

/** Spec §6.2: with changes the action opens its notice and without changes it acts; Delete task only asks for its confirmation. */
export function whatTheActionDoes(action: PanelAction | 'borrar tarea', hasChanges: boolean): ActionEffect {
	if (action === 'borrar tarea') return 'pide confirmar el borrado';
	return hasChanges ? 'abre el aviso de acción' : 'actúa';
}

const COMMANDS: Readonly<Record<PanelAction, (now: Date) => TaskChange>> = {
	pausar: () => pause(),
	reanudar: (now) => resume(now),
	'posponer 1 hora': (now) => postpone('1 hora', now),
	'posponer 3 horas': (now) => postpone('3 horas', now),
	'posponer hasta mañana': (now) => postpone('hasta mañana', now),
	'quitar posponer': () => removePostpone()
};

/** Spec §5.8, §5.9 and §6.2: what the action writes; `now` is the moment of tapping the button. */
export function changeOfAction(action: PanelAction, now: Date): TaskChange {
	return COMMANDS[action](now);
}
