import { describe, expect, it } from 'vitest';
import { whatBackDoes, type OnTop } from './panel-back';

const LAYERS: OnTop[] = ['closeNotice', 'actionNotice', 'deleteConfirmation', 'emojiPicker'];
const NO_LAYER: OnTop[] = ['nothing', 'undoNotice'];

describe('whatBackDoes (spec §6.2)', () => {
	it.each(LAYERS)('closes only %s, with or without changes', (top) => {
		expect(whatBackDoes({ top, hasChanges: true, keyboardOpen: false })).toBe('closesTopLayer');
		expect(whatBackDoes({ top, hasChanges: false, keyboardOpen: false })).toBe('closesTopLayer');
	});

	it.each(NO_LAYER)('with %s, without changes it closes the panel', (top) => {
		expect(whatBackDoes({ top, hasChanges: false, keyboardOpen: false })).toBe('closesPanel');
	});

	it.each(NO_LAYER)('with %s, with changes it opens the close notice', (top) => {
		expect(whatBackDoes({ top, hasChanges: true, keyboardOpen: false })).toBe('opensCloseNotice');
	});

	it.each<OnTop>([...LAYERS, ...NO_LAYER])('with the keyboard open the system closes it and everything else stays the same (%s)', (top) => {
		expect(whatBackDoes({ top, hasChanges: true, keyboardOpen: true })).toBe('closesKeyboard');
		expect(whatBackDoes({ top, hasChanges: false, keyboardOpen: true })).toBe('closesKeyboard');
	});
});
