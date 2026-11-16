import { describe, expect, it } from 'vitest';
import { onClosePanel, CLOSE_NOTICE, CHANGES_MESSAGE } from './unsaved-changes-notice';

describe('alCerrarElPanel (spec §6.2)', () => {
	it('sin cambios cierra directo; con cambios abre el aviso de cierre', () => {
		expect(onClosePanel(false)).toBe('cierra el panel');
		expect(onClosePanel(true)).toBe('abre el aviso de cierre');
	});
});

describe('AVISO_DE_CIERRE (spec §6.2)', () => {
	it('dice "Tenés cambios sin guardar"', () => {
		expect(CHANGES_MESSAGE).toBe('Tenés cambios sin guardar');
		expect(CLOSE_NOTICE.message).toBe('Tenés cambios sin guardar');
	});

	it('ofrece Seguir editando, Descartar y Guardar, en ese orden y cada uno con su efecto', () => {
		expect(CLOSE_NOTICE.buttons).toEqual([
			{ text: 'Seguir editando', effect: 'seguir editando' },
			{ text: 'Descartar', effect: 'descartar' },
			{ text: 'Guardar', effect: 'guardar' }
		]);
	});
});
