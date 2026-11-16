// Spec §6.2 (Aviso de cierre): qué hace cerrar el panel y qué ofrece su aviso.

/** Spec §6.2: el nombre del aviso, de cierre o de acción. */
export const CHANGES_MESSAGE = 'Tenés cambios sin guardar';

export interface NoticeButton {
	text: string;
	effect: 'seguir editando' | 'descartar' | 'guardar';
}

export interface ChangesNotice {
	message: string;
	buttons: readonly NoticeButton[];
}

/** Spec §6.2: el botón que cierra el aviso y deja el panel como estaba. */
export const KEEP_EDITING: NoticeButton = { text: 'Seguir editando', effect: 'seguir editando' };

/** Spec §6.2: el aviso de cierre, con sus tres botones en orden. */
export const CLOSE_NOTICE: ChangesNotice = {
	message: CHANGES_MESSAGE,
	buttons: [KEEP_EDITING, { text: 'Descartar', effect: 'descartar' }, { text: 'Guardar', effect: 'guardar' }]
};

export type CloseEffect = 'cierra el panel' | 'abre el aviso de cierre';

/** Spec §6.2: cerrar con cambios pide confirmación; sin cambios cierra directo. */
export function onClosePanel(hasChanges: boolean): CloseEffect {
	return hasChanges ? 'abre el aviso de cierre' : 'cierra el panel';
}
