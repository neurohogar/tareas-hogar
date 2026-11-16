// Spec §6.2 (Atrás): qué hace Atrás con el panel abierto.
import { onClosePanel, type CloseEffect } from './unsaved-changes-notice';

/**
 * Lo que puede estar abierto sobre el panel; las sugerencias y el aviso de
 * deshacer no cuentan. El recuadro de Anotar (§5.10) se cierra sin anotar.
 */
export type OnTop = 'nada' | 'aviso de cierre' | 'aviso de acción' | 'confirmación de Borrar tarea' | 'selector de emoji' | 'recuadro de Anotar' | 'sugerencias de Etiquetas' | 'aviso de deshacer';

export type BackEffect = 'cierra el teclado' | 'cierra lo de arriba' | CloseEffect;

const NOT_COUNTED: readonly OnTop[] = ['nada', 'sugerencias de Etiquetas', 'aviso de deshacer'];

export interface PanelOnBack {
	top: OnTop;
	hasChanges: boolean;
	keyboardOpen: boolean;
}

/**
 * Spec §6.2: con el teclado abierto lo cierra el sistema y lo demás sigue igual;
 * si no, cierra solo lo de arriba; con el panel solo, es como cerrarlo.
 */
export function whatBackDoes({ top, hasChanges, keyboardOpen }: PanelOnBack): BackEffect {
	if (keyboardOpen) return 'cierra el teclado';
	return NOT_COUNTED.includes(top) ? onClosePanel(hasChanges) : 'cierra lo de arriba';
}
