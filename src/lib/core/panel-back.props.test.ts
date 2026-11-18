// Spec §6.2 (Back and close): what Back does depending on what is open.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { whatBackDoes, type OnTop } from './panel-back';
import { onClosePanel } from './unsaved-changes-notice';

const top = fc.constantFrom<OnTop>('nada', 'aviso de cierre', 'aviso de acción', 'confirmación de Borrar tarea', 'selector de emoji', 'recuadro de Anotar', 'aviso de deshacer');
const LAYERS: readonly OnTop[] = ['aviso de cierre', 'aviso de acción', 'confirmación de Borrar tarea', 'selector de emoji', 'recuadro de Anotar'];

describe('whatBackDoes: properties (spec §6.2)', () => {
	it('with the keyboard open only the system closes it, whatever happens', () => {
		fc.assert(fc.property(top, fc.boolean(), (low, changes) => {
			expect(whatBackDoes({ top: low, hasChanges: changes, keyboardOpen: true })).toBe('cierra el teclado');
		}));
	});

	it('with a layer open it closes only the layer, with or without changes', () => {
		fc.assert(
			fc.property(fc.constantFrom(...LAYERS), fc.boolean(), (low, changes) => {
				expect(whatBackDoes({ top: low, hasChanges: changes, keyboardOpen: false })).toBe('cierra lo de arriba');
			})
		);
	});

	it('without an open layer it is like closing the panel', () => {
		fc.assert(
			fc.property(top, fc.boolean(), (low, changes) => {
				fc.pre(!LAYERS.includes(low));
				expect(whatBackDoes({ top: low, hasChanges: changes, keyboardOpen: false })).toBe(onClosePanel(changes));
			})
		);
	});

	it('never discards changes without asking: with changes, closing the panel goes through the notice', () => {
		fc.assert(fc.property(top, (low) => {
			expect(whatBackDoes({ top: low, hasChanges: true, keyboardOpen: false })).not.toBe('cierra el panel');
		}));
	});
});
