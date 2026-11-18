import { describe, expect, it } from 'vitest';
import type { Annotation, AnnotationScreen, Sense } from './annotation';
import { annotationsOnScreen, type AnnotationsGroup } from './annotations';
import type { Task } from './task';

const task = (id: string, emoji?: string): Task => ({ id, title: id, kind: 'puntual', createdAt: new Date(2026, 0, 1), ...(emoji ? { emoji } : {}) });

function annotation(id: string, annotatedAt: Date, extra: Partial<Annotation> = {}): Annotation {
	const sense: Sense = 'Me sirvió';
	const screen: AnnotationScreen = 'Pendientes';
	return { id, sense, annotatedAt, screen, ...extra };
}

const now = new Date(2026, 6, 15, 12, 0, 0);

/** "Hoy: a2 09:10 Regar, a1 08:05; Ayer: ..." */
function inText(groups: AnnotationsGroup[]): string {
	return groups
		.map(({ header, entries }) => `${header}: ${entries.map(({ annotation, hour, taskName }) => [annotation.id, hour, taskName].filter(Boolean).join(' ')).join(', ')}`)
		.join('; ');
}

describe('annotationsOnScreen (spec §6.7)', () => {
	it('without annotations it has no groups', () => {
		expect(annotationsOnScreen([task('regar')], [], now)).toEqual([]);
	});

	it('goes from most recent to oldest and groups by local day, even if annotated in another order', () => {
		const annotations = [
			annotation('a1', new Date(2026, 6, 15, 8, 5)),
			annotation('a2', new Date(2026, 6, 15, 9, 10)),
			annotation('a3', new Date(2026, 6, 14, 21, 30)),
			annotation('a4', new Date(2026, 6, 13, 7, 0))
		];

		expect(inText(annotationsOnScreen([], annotations, now))).toBe('Hoy: a2 09:10, a1 08:05; Ayer: a3 21:30; lunes 13 de julio: a4 07:00');
	});

	it('if two have the same instant, the one with the lower id goes first', () => {
		const moment = new Date(2026, 6, 15, 10, 0);

		expect(inText(annotationsOnScreen([], [annotation('a2', moment), annotation('a1', moment)], now))).toBe('Hoy: a1 10:00, a2 10:00');
		expect(inText(annotationsOnScreen([], [annotation('a1', moment), annotation('a2', moment)], now))).toBe('Hoy: a1 10:00, a2 10:00');
	});

	it('shows the current name of the task, with its emoji if it has one', () => {
		const annotations = [annotation('a1', new Date(2026, 6, 15, 8, 0), { taskId: 'regar' }), annotation('a2', new Date(2026, 6, 15, 9, 0), { taskId: 'pagar' })];

		expect(inText(annotationsOnScreen([task('regar', '🌱'), task('pagar')], annotations, now))).toBe('Hoy: a2 09:00 pagar, a1 08:00 🌱 regar');
	});

	it('does not show the annotations of a task that no longer exists, but does show those without a task', () => {
		const annotations = [annotation('a1', new Date(2026, 6, 15, 8, 0), { taskId: 'borrada' }), annotation('a2', new Date(2026, 6, 15, 9, 0))];

		expect(inText(annotationsOnScreen([task('regar')], annotations, now))).toBe('Hoy: a2 09:00');
	});
});
