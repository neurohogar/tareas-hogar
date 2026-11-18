// Spec §6.2 (Close notice): what closing the panel does and what its notice offers.

/** Spec §6.2: the name of the notice, close or action. */
export const CHANGES_MESSAGE = 'Tenés cambios sin guardar';

export interface NoticeButton {
	text: string;
	effect: 'seguir editando' | 'descartar' | 'guardar';
}

export interface ChangesNotice {
	message: string;
	buttons: readonly NoticeButton[];
}

/** Spec §6.2: the button that closes the notice and leaves the panel as it was. */
export const KEEP_EDITING: NoticeButton = { text: 'Seguir editando', effect: 'seguir editando' };

/** Spec §6.2: the close notice, with its three buttons in order. */
export const CLOSE_NOTICE: ChangesNotice = {
	message: CHANGES_MESSAGE,
	buttons: [KEEP_EDITING, { text: 'Descartar', effect: 'descartar' }, { text: 'Guardar', effect: 'guardar' }]
};

export type CloseEffect = 'cierra el panel' | 'abre el aviso de cierre';

/** Spec §6.2: closing with changes asks for confirmation; without changes it closes directly. */
export function onClosePanel(hasChanges: boolean): CloseEffect {
	return hasChanges ? 'abre el aviso de cierre' : 'cierra el panel';
}
