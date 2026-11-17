// Spec §6.2 (Atrás y cerrar): qué hace Atrás según lo que hay abierto.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { whatBackDoes, type OnTop } from './panel-back';
import { onClosePanel } from './unsaved-changes-notice';

const top = fc.constantFrom<OnTop>('nada', 'aviso de cierre', 'aviso de acción', 'confirmación de Borrar tarea', 'selector de emoji', 'recuadro de Anotar', 'aviso de deshacer');
const LAYERS: readonly OnTop[] = ['aviso de cierre', 'aviso de acción', 'confirmación de Borrar tarea', 'selector de emoji', 'recuadro de Anotar'];

describe('queHaceAtras: propiedades (spec §6.2)', () => {
	it('con el teclado abierto solo lo cierra el sistema, pase lo que pase', () => {
		fc.assert(fc.property(top, fc.boolean(), (low, changes) => {
			expect(whatBackDoes({ top: low, hasChanges: changes, keyboardOpen: true })).toBe('cierra el teclado');
		}));
	});

	it('con una capa abierta cierra solo la capa, con o sin cambios', () => {
		fc.assert(
			fc.property(fc.constantFrom(...LAYERS), fc.boolean(), (low, changes) => {
				expect(whatBackDoes({ top: low, hasChanges: changes, keyboardOpen: false })).toBe('cierra lo de arriba');
			})
		);
	});

	it('sin capa abierta es como cerrar el panel', () => {
		fc.assert(
			fc.property(top, fc.boolean(), (low, changes) => {
				fc.pre(!LAYERS.includes(low));
				expect(whatBackDoes({ top: low, hasChanges: changes, keyboardOpen: false })).toBe(onClosePanel(changes));
			})
		);
	});

	it('nunca descarta cambios sin preguntar: con cambios, cerrar el panel pasa por el aviso', () => {
		fc.assert(fc.property(top, (low) => {
			expect(whatBackDoes({ top: low, hasChanges: true, keyboardOpen: false })).not.toBe('cierra el panel');
		}));
	});
});
