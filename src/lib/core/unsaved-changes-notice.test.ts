import { describe, expect, it } from 'vitest';
import { onClosePanel, CLOSE_NOTICE, CHANGES_MESSAGE } from './unsaved-changes-notice';

describe('onClosePanel (spec §6.2)', () => {
	it('without changes it closes directly; with changes it opens the close notice', () => {
		expect(onClosePanel(false)).toBe('closesPanel');
		expect(onClosePanel(true)).toBe('opensCloseNotice');
	});
});

describe('CLOSE_NOTICE (spec §6.2)', () => {
	it('says "Tenés cambios sin guardar"', () => {
		expect(CHANGES_MESSAGE).toBe('Tenés cambios sin guardar');
		expect(CLOSE_NOTICE.message).toBe('Tenés cambios sin guardar');
	});

	it('offers Seguir editando, Descartar and Guardar, in that order and each with its effect', () => {
		expect(CLOSE_NOTICE.buttons).toEqual([
			{ text: 'Seguir editando', effect: 'seguir editando' },
			{ text: 'Descartar', effect: 'descartar' },
			{ text: 'Guardar', effect: 'guardar' }
		]);
	});
});
