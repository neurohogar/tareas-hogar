import { expect, it } from 'vitest';
import type { Annotation } from '../../src/lib/core/annotation';
import { annotationsOnScreen } from '../../src/lib/core/annotations';

const annotation = (id: string, annotatedAt: Date): Annotation => ({ id, sense: 'Me sirvió', annotatedAt, screen: 'Pendientes' });

it('agrupa junto a la última anotación del grupo, no del primero, cuando hay un día antes', () => {
	const now = new Date(2026, 6, 15, 12, 0);
	const groups = annotationsOnScreen([], [annotation('a1', new Date(2026, 6, 15, 9, 0)), annotation('a2', new Date(2026, 6, 14, 9, 0)), annotation('a3', new Date(2026, 6, 14, 8, 0))], now);

	expect(groups.map((g) => [g.header, g.entries.map((e) => e.annotation.id)])).toEqual([
		['Hoy', ['a1']],
		['Ayer', ['a2', 'a3']]
	]);
});
