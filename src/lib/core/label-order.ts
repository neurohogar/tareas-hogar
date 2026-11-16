// Spec §4.3 (Orden): el mismo en todos lados.
import { compareIds } from './compare-ids';
import type { Label } from './label';
import { compareTitles } from './alphabetical-order';

/** Alfabético en español como los títulos (§6.1); si empatan, por id. */
export function sortLabels<T extends Label>(labels: readonly T[]): T[] {
	return [...labels].sort((a, b) => compareTitles(a.name, b.name) || compareIds(a.id, b.id));
}
