// Spec §6.2 (Atrás y cerrar): qué hace Atrás según lo que hay abierto.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { queHaceAtras, type LoDeArriba } from './atras-del-panel';
import { alCerrarElPanel } from './cambios-sin-guardar-aviso';

const encima = fc.constantFrom<LoDeArriba>('nada', 'aviso de cierre', 'aviso de acción', 'confirmación de Borrar tarea', 'selector de emoji', 'sugerencias de Etiquetas', 'aviso de deshacer');
const CAPAS: readonly LoDeArriba[] = ['aviso de cierre', 'aviso de acción', 'confirmación de Borrar tarea', 'selector de emoji'];

describe('queHaceAtras: propiedades (spec §6.2)', () => {
	it('con el teclado abierto solo lo cierra el sistema, pase lo que pase', () => {
		fc.assert(fc.property(encima, fc.boolean(), (lo, cambios) => {
			expect(queHaceAtras({ encima: lo, hayCambios: cambios, tecladoAbierto: true })).toBe('cierra el teclado');
		}));
	});

	it('con una capa abierta cierra solo la capa, con o sin cambios', () => {
		fc.assert(
			fc.property(fc.constantFrom(...CAPAS), fc.boolean(), (lo, cambios) => {
				expect(queHaceAtras({ encima: lo, hayCambios: cambios, tecladoAbierto: false })).toBe('cierra lo de arriba');
			})
		);
	});

	it('sin capa abierta es como cerrar el panel', () => {
		fc.assert(
			fc.property(encima, fc.boolean(), (lo, cambios) => {
				fc.pre(!CAPAS.includes(lo));
				expect(queHaceAtras({ encima: lo, hayCambios: cambios, tecladoAbierto: false })).toBe(alCerrarElPanel(cambios));
			})
		);
	});

	it('nunca descarta cambios sin preguntar: con cambios, cerrar el panel pasa por el aviso', () => {
		fc.assert(fc.property(encima, (lo) => {
			expect(queHaceAtras({ encima: lo, hayCambios: true, tecladoAbierto: false })).not.toBe('cierra el panel');
		}));
	});
});
