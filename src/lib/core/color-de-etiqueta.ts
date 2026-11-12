// Spec §4.3 (Color de una etiqueta nueva).
import { PALETA, type Color } from './etiqueta';

/**
 * El color de la paleta que menos etiquetas existentes tienen; si empatan, el
 * primero de la paleta. `usados` es el color de cada etiqueta existente.
 */
export function colorMenosUsado(usados: readonly Color[]): Color {
	const veces = (color: Color) => usados.filter((usado) => usado === color).length;
	return PALETA.reduce((menos, color) => (veces(color) < veces(menos) ? color : menos));
}
