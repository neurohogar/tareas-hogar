// Spec §4.3 (Color de una etiqueta nueva).
import { PALETTE, type Color } from './label';

/**
 * El color de la paleta que menos etiquetas existentes tienen; si empatan, el
 * primero de la paleta. `usados` es el color de cada etiqueta existente.
 */
export function leastUsedColor(usedOnes: readonly Color[]): Color {
	const times = (color: Color) => usedOnes.filter((used) => used === color).length;
	return PALETTE.reduce((less, color) => (times(color) < times(less) ? color : less));
}
