import { describe, expect, it } from 'vitest';
import { alCerrarElPanel, AVISO_DE_CIERRE, MENSAJE_DE_CAMBIOS } from './cambios-sin-guardar-aviso';

describe('alCerrarElPanel (spec §6.2)', () => {
	it('sin cambios cierra directo; con cambios abre el aviso de cierre', () => {
		expect(alCerrarElPanel(false)).toBe('cierra el panel');
		expect(alCerrarElPanel(true)).toBe('abre el aviso de cierre');
	});
});

describe('AVISO_DE_CIERRE (spec §6.2)', () => {
	it('dice "Tenés cambios sin guardar"', () => {
		expect(MENSAJE_DE_CAMBIOS).toBe('Tenés cambios sin guardar');
		expect(AVISO_DE_CIERRE.mensaje).toBe('Tenés cambios sin guardar');
	});

	it('ofrece Seguir editando, Descartar y Guardar, en ese orden y cada uno con su efecto', () => {
		expect(AVISO_DE_CIERRE.botones).toEqual([
			{ texto: 'Seguir editando', efecto: 'seguir editando' },
			{ texto: 'Descartar', efecto: 'descartar' },
			{ texto: 'Guardar', efecto: 'guardar' }
		]);
	});
});
