import { describe, expect, it } from 'vitest';
import { queHaceAtras, type LoDeArriba } from './atras-del-panel';

const CAPAS: LoDeArriba[] = ['aviso de cierre', 'aviso de acción', 'confirmación de Borrar tarea', 'selector de emoji', 'recuadro de Anotar'];
const SIN_CAPA: LoDeArriba[] = ['nada', 'sugerencias de Etiquetas', 'aviso de deshacer'];

describe('queHaceAtras (spec §6.2)', () => {
	it.each(CAPAS)('cierra solo %s, con o sin cambios', (encima) => {
		expect(queHaceAtras({ encima, hayCambios: true, tecladoAbierto: false })).toBe('cierra lo de arriba');
		expect(queHaceAtras({ encima, hayCambios: false, tecladoAbierto: false })).toBe('cierra lo de arriba');
	});

	it.each(SIN_CAPA)('con %s, sin cambios cierra el panel', (encima) => {
		expect(queHaceAtras({ encima, hayCambios: false, tecladoAbierto: false })).toBe('cierra el panel');
	});

	it.each(SIN_CAPA)('con %s, con cambios abre el aviso de cierre', (encima) => {
		expect(queHaceAtras({ encima, hayCambios: true, tecladoAbierto: false })).toBe('abre el aviso de cierre');
	});

	it.each<LoDeArriba>([...CAPAS, ...SIN_CAPA])('con el teclado abierto lo cierra el sistema y lo demás sigue igual (%s)', (encima) => {
		expect(queHaceAtras({ encima, hayCambios: true, tecladoAbierto: true })).toBe('cierra el teclado');
		expect(queHaceAtras({ encima, hayCambios: false, tecladoAbierto: true })).toBe('cierra el teclado');
	});
});
