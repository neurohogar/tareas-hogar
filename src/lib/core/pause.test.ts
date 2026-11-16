import { describe, expect, it } from 'vitest';
import { pauseAction, asJustCreated, isPaused, pause, resume } from './pause';
import type { Completion, RecurringTask, OneOffTask } from './task';

const CREATED = new Date(2026, 6, 1, 8, 0, 0);
const RESUMED = new Date(2026, 6, 15, 10, 0, 0);
const RELATIVE: RecurringTask = {
	id: 'r',
	title: 'Regar',
	kind: 'periodica',
	recurrence: { mode: 'relativo', every: 2, unit: 'dias' },
	createdAt: CREATED
};
const ONE_OFF: OneOffTask = { id: 'p', title: 'Pagar', kind: 'puntual', createdAt: CREATED };
const completion = (id: string, completedAt: Date): Completion => ({ id, taskId: 'r', completedAt });

describe('pausar y reanudar (spec §5.8, §7)', () => {
	it('pausar escribe pausada', () => {
		expect(pause()).toStrictEqual({ paused: true });
	});

	it('reanudar quita pausada y guarda reanudadaEn = ahora, en el mismo cambio', () => {
		expect(resume(RESUMED)).toStrictEqual({ paused: null, resumedAt: RESUMED });
	});
});

describe('estaPausada (spec §4.1, §5.8)', () => {
	it('una periódica con pausada está pausada; sin el campo, no', () => {
		expect(isPaused({ ...RELATIVE, paused: true })).toBe(true);
		expect(isPaused(RELATIVE)).toBe(false);
		expect(isPaused({ ...RELATIVE, paused: false })).toBe(false);
	});

	it('una puntual nunca está pausada', () => {
		expect(isPaused(ONE_OFF)).toBe(false);
	});
});

describe('accionDePausa (spec §6.2)', () => {
	it('al editar una periódica ofrece pausar; si está pausada, reanudar', () => {
		expect(pauseAction(RELATIVE)).toBe('pausar');
		expect(pauseAction({ ...RELATIVE, paused: true })).toBe('reanudar');
	});

	it('una puntual no se puede pausar', () => {
		expect(pauseAction(ONE_OFF)).toBeUndefined();
	});
});

describe('comoRecienCreada (spec §5.8)', () => {
	it('una reanudada se evalúa con creadaEn = reanudadaEn y sin los completados anteriores a reanudadaEn', () => {
		const task = { ...RELATIVE, resumedAt: RESUMED };
		const before = completion('c1', new Date(2026, 6, 15, 9, 59, 59));
		const atTheInstant = completion('c2', RESUMED);
		const after = completion('c3', new Date(2026, 6, 16, 8, 0, 0));

		expect(asJustCreated(task, [before, atTheInstant, after])).toStrictEqual({
			task: { ...task, createdAt: RESUMED },
			owns: [atTheInstant, after]
		});
	});

	it('una que nunca se reanudó se evalúa tal cual', () => {
		const owns = [completion('c1', new Date(2026, 6, 2))];

		expect(asJustCreated(RELATIVE, owns)).toStrictEqual({ task: RELATIVE, owns });
		expect(asJustCreated(ONE_OFF, [])).toStrictEqual({ task: ONE_OFF, owns: [] });
	});
});
