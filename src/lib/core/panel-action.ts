// Spec §5.8, §5.9 y §6.2: las acciones que el panel ofrece sobre una tarea
// (Pausar, Reanudar, Posponer, Quitar posponer), qué hace tocarlas y qué escriben.
import { pause, resume } from './pause';
import { postpone, removePostpone, type PostponeOption } from './postponement';
import type { TaskChange } from './task-document';

/** Spec §6.2: las acciones con aviso, con la opción tocada al posponer; así se nombran en sus botones. */
export type PanelAction = 'pausar' | 'reanudar' | `posponer ${PostponeOption}` | 'quitar posponer';

/** Spec §6.2: la acción de posponer con la opción tocada. */
export function optionAction(option: PostponeOption): PanelAction {
	return `posponer ${option}`;
}

export type ActionEffect = 'actúa' | 'abre el aviso de acción' | 'pide confirmar el borrado';

/** Spec §6.2: con cambios la acción abre su aviso y sin cambios actúa; Borrar tarea solo pide su confirmación. */
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

/** Spec §5.8, §5.9 y §6.2: lo que escribe la acción; `ahora` es el momento de tocar el botón. */
export function changeOfAction(action: PanelAction, now: Date): TaskChange {
	return COMMANDS[action](now);
}
