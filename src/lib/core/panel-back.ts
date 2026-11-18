// Spec §6.2 (Back): what Back does with the panel open.
import { onClosePanel, type CloseEffect } from './unsaved-changes-notice';

/**
 * What can be open on top of the panel; the undo notice does not count. The Annotate box (§5.10) closes without annotating.
 */
export type OnTop = 'nothing' | 'closeNotice' | 'actionNotice' | 'deleteConfirmation' | 'emojiPicker' | 'annotateBox' | 'undoNotice';

export type BackEffect = 'closesKeyboard' | 'closesTopLayer' | CloseEffect;

const NOT_COUNTED: readonly OnTop[] = ['nothing', 'undoNotice'];

export interface PanelOnBack {
	top: OnTop;
	hasChanges: boolean;
	keyboardOpen: boolean;
}

/**
 * Spec §6.2: with the keyboard open the system closes it and everything else stays the same;
 * otherwise it closes only what is on top; with the panel alone, it is like closing it.
 */
export function whatBackDoes({ top, hasChanges, keyboardOpen }: PanelOnBack): BackEffect {
	if (keyboardOpen) return 'closesKeyboard';
	return NOT_COUNTED.includes(top) ? onClosePanel(hasChanges) : 'closesTopLayer';
}
