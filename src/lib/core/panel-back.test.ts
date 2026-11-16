import { describe, expect, it } from 'vitest';
import { whatBackDoes, type OnTop } from './panel-back';

const LAYERS: OnTop[] = ['aviso de cierre', 'aviso de acción', 'confirmación de Borrar tarea', 'selector de emoji', 'recuadro de Anotar'];
const NO_LAYER: OnTop[] = ['nada', 'sugerencias de Etiquetas', 'aviso de deshacer'];

describe('queHaceAtras (spec §6.2)', () => {
	it.each(LAYERS)('cierra solo %s, con o sin cambios', (top) => {
		expect(whatBackDoes({ top, hasChanges: true, keyboardOpen: false })).toBe('cierra lo de arriba');
		expect(whatBackDoes({ top, hasChanges: false, keyboardOpen: false })).toBe('cierra lo de arriba');
	});

	it.each(NO_LAYER)('con %s, sin cambios cierra el panel', (top) => {
		expect(whatBackDoes({ top, hasChanges: false, keyboardOpen: false })).toBe('cierra el panel');
	});

	it.each(NO_LAYER)('con %s, con cambios abre el aviso de cierre', (top) => {
		expect(whatBackDoes({ top, hasChanges: true, keyboardOpen: false })).toBe('abre el aviso de cierre');
	});

	it.each<OnTop>([...LAYERS, ...NO_LAYER])('con el teclado abierto lo cierra el sistema y lo demás sigue igual (%s)', (top) => {
		expect(whatBackDoes({ top, hasChanges: true, keyboardOpen: true })).toBe('cierra el teclado');
		expect(whatBackDoes({ top, hasChanges: false, keyboardOpen: true })).toBe('cierra el teclado');
	});
});
