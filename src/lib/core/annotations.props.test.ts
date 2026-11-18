// Spec §6.7: which annotations are shown, their order, their grouping by day and the copied text.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { Annotation } from './annotation';
import { annotationsOnScreen, visibleAnnotations } from './annotations';
import { annotationsText } from './copied-annotations';
import { orphanAnnotations, deletion } from './deletion';
import { compareIds } from './compare-ids';
import type { Task } from './task';

const IDS = ['t1', 't2', 't3'];
const tasks = fc.subarray(IDS).map((ids) => ids.map((id): Task => ({ id, title: id, kind: 'puntual', createdAt: new Date(0) })));
const annotation = fc.record(
	{
		id: fc.uuid(),
		sense: fc.constantFrom('Me sirvió' as const, 'Me molestó' as const),
		annotatedAt: fc.date({ min: new Date('2026-01-01T00:00:00'), max: new Date('2026-01-05T00:00:00'), noInvalidDate: true }),
		screen: fc.constantFrom('Pendientes' as const, 'Panel de edición' as const),
		taskId: fc.constantFrom(...IDS, 'borrada'),
		text: fc.constantFrom('uno', 'dos')
	},
	{ requiredKeys: ['id', 'sense', 'annotatedAt', 'screen'] }
);
const annotations = fc.uniqueArray(annotation, { selector: ({ id }) => id, maxLength: 12 }) as fc.Arbitrary<Annotation[]>;
const now = fc.date({ min: new Date('2026-01-01T00:00:00'), max: new Date('2026-02-01T00:00:00'), noInvalidDate: true });
const oldestFirst = (a: Date, b: Date) => a.getTime() - b.getTime();
const idsOf = (list: readonly { id: string }[]) => list.map(({ id }) => id);

describe('visibleAnnotations (properties)', () => {
	it('they are those that are not orphans, without repeating or losing any', () => {
		fc.assert(
			fc.property(tasks, annotations, (ts, as) => {
				const visibleOnes = visibleAnnotations(ts, as, oldestFirst).map((v) => v.annotation);
				const orphans = orphanAnnotations(ts, as);
				expect([...idsOf(visibleOnes), ...idsOf(orphans)].sort()).toStrictEqual(idsOf(as).sort());
			})
		);
	});

	it('they are sorted by annotatedAt and, on a tie, by id', () => {
		fc.assert(
			fc.property(tasks, annotations, (ts, as) => {
				const visibleOnes = visibleAnnotations(ts, as, oldestFirst).map((v) => v.annotation);
				for (let i = 1; i < visibleOnes.length; i++) {
					const [a, b] = [visibleOnes[i - 1], visibleOnes[i]];
					const order = a.annotatedAt.getTime() - b.annotatedAt.getTime() || compareIds(a.id, b.id);
					expect(order).toBeLessThan(0);
				}
			})
		);
	});

	it('does not depend on the order they arrive in', () => {
		fc.assert(
			fc.property(tasks, annotations, (ts, as) => {
				const right = visibleAnnotations(ts, as, oldestFirst);
				expect(visibleAnnotations(ts, [...as].reverse(), oldestFirst)).toStrictEqual(right);
			})
		);
	});
});

describe('annotationsOnScreen (properties)', () => {
	it('shows the same annotations as the visible ones, from most recent to oldest, with distinct headers', () => {
		fc.assert(
			fc.property(tasks, annotations, now, (ts, as, today) => {
				const groups = annotationsOnScreen(ts, as, today);
				const entries = groups.flatMap((g) => g.entries.map((e) => e.annotation));
				expect(idsOf(entries)).toStrictEqual(idsOf(visibleAnnotations(ts, as, (a, b) => b.getTime() - a.getTime()).map((v) => v.annotation)));
				const headers = groups.map((g) => g.header);
				expect(new Set(headers).size).toBe(headers.length);
				for (const g of groups) expect(g.entries.length).toBeGreaterThan(0);
			})
		);
	});
});

describe('annotationsText (properties)', () => {
	it('has one line per visible annotation and is undefined if there are none', () => {
		fc.assert(
			fc.property(tasks, annotations, (ts, as) => {
				const copied = annotationsText(ts, as);
				const howMany = visibleAnnotations(ts, as, oldestFirst).length;
				if (howMany === 0) expect(copied).toBeUndefined();
				else expect(copied?.split('\n')).toHaveLength(howMany);
			})
		);
	});
});

describe('deletion and orphans of annotations (properties)', () => {
	it('deleting a task deletes its annotations and only those', () => {
		fc.assert(
			fc.property(fc.constantFrom(...IDS), annotations, (id, as) => {
				expect(deletion(id, [], as).annotationIds).toStrictEqual(idsOf(as.filter((a) => a.taskId === id)));
			})
		);
	});

	it('orphans are idempotent, keep the order and never include those without a task', () => {
		fc.assert(
			fc.property(tasks, annotations, (ts, as) => {
				const orphans = orphanAnnotations(ts, as);
				expect(orphanAnnotations(ts, orphans)).toStrictEqual(orphans);
				expect(orphans).toStrictEqual(as.filter((a) => orphans.includes(a)));
				expect(orphans.every((a) => a.taskId !== undefined)).toBe(true);
			})
		);
	});
});

describe('annotations saved in Etiquetas (properties, spec §4.5)', () => {
	const onLabels = fc.array(annotation, { maxLength: 6 }).map((as) => as.map((a, i): Annotation => ({ ...a, id: `e${i}`, screen: 'Etiquetas' })));

	it('they are still shown and copied, with Etiquetas as their screen', () => {
		fc.assert(
			fc.property(tasks, onLabels, now, (ts, as, at) => {
				const shown = annotationsOnScreen(ts, as, at).flatMap((g) => g.entries);
				const visibleCount = visibleAnnotations(ts, as, oldestFirst).length;
				expect(shown).toHaveLength(visibleCount);
				const copied = annotationsText(ts, as);
				expect(copied === undefined ? 0 : copied.split('\n').length).toBe(visibleCount);
				for (const line of copied?.split('\n') ?? []) expect(line.split(' · ')).toContain('Etiquetas');
			})
		);
	});
});
