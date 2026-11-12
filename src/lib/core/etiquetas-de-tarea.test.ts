import { describe, expect, it } from 'vitest';
import type { Etiqueta } from './etiqueta';
import { etiquetasDeTarea } from './etiquetas-de-tarea';
import type { TareaPuntual } from './tarea';

const COCINA: Etiqueta = { id: 'e1', nombre: 'Cocina', color: 'rojo' };
const BANO: Etiqueta = { id: 'e2', nombre: 'Baño', color: 'gris' };
const PAGAR: TareaPuntual = { id: 't1', titulo: 'Pagar', tipo: 'puntual', creadaEn: new Date(2026, 6, 1) };

describe('etiquetasDeTarea', () => {
	it('las etiquetas de la tarea, en orden alfabético', () => {
		expect(etiquetasDeTarea({ ...PAGAR, etiquetas: ['e1', 'e2'] }, [COCINA, BANO])).toStrictEqual([BANO, COCINA]);
	});

	it('sin el campo, ninguna', () => {
		expect(etiquetasDeTarea(PAGAR, [COCINA])).toStrictEqual([]);
	});

	it('ignora las referencias a etiquetas que no existen', () => {
		expect(etiquetasDeTarea({ ...PAGAR, etiquetas: ['borrada', 'e1'] }, [COCINA, BANO])).toStrictEqual([COCINA]);
	});
});
