// Spec §4.3 (Orden): el mismo en todos lados.
import { compararIds } from './compare-ids';
import type { Etiqueta } from './label';
import { compararTitulos } from './alphabetical-order';

/** Alfabético en español como los títulos (§6.1); si empatan, por id. */
export function ordenarEtiquetas<T extends Etiqueta>(etiquetas: readonly T[]): T[] {
	return [...etiquetas].sort((a, b) => compararTitulos(a.nombre, b.nombre) || compararIds(a.id, b.id));
}
