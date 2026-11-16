import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { pauseAction, asJustCreated, isPaused } from './pause';
import type { Completion, Task } from './task';

const instant = fc.integer({ min: 0, max: 4_102_444_800_000 }).map((ms) => new Date(ms));
const recurring = fc
	.record({ createdAt: instant, paused: fc.boolean(), resumedAt: fc.option(instant, { nil: undefined }) })
	.map(({ createdAt, paused, resumedAt }): Task => ({
		id: 't',
		title: 'T',
		kind: 'periodica',
		recurrence: { mode: 'relativo', every: 1, unit: 'dias' },
		createdAt,
		...(paused && { paused }),
		...(resumedAt && { resumedAt })
	}));
const oneOff = fc
	.record({ createdAt: instant, resumedAt: fc.option(instant, { nil: undefined }), paused: fc.boolean() })
	.map(({ createdAt, resumedAt, paused }): Task => ({ id: 't', title: 'T', kind: 'puntual', createdAt, ...(paused && { paused }), ...(resumedAt && { resumedAt }) }) as Task);
const completions = fc
	.array(instant, { maxLength: 8 })
	.map((list) => list.map((completedAt, i): Completion => ({ id: `c${i}`, taskId: 't', completedAt })));

describe('pausa: propiedades (spec §5.8)', () => {
	it('una puntual nunca está pausada ni tiene botón de pausa', () => {
		fc.assert(
			fc.property(oneOff, instant, (task, now) => {
				expect(isPaused(task)).toBe(false);
				expect(pauseAction(task)).toBeUndefined();
			})
		);
	});

	it('el botón de una periódica es pausar o reanudar según esté pausada', () => {
		fc.assert(
			fc.property(recurring, (task) => {
				expect(pauseAction(task)).toBe(isPaused(task) ? 'reanudar' : 'pausar');
			})
		);
	});

	it('comoRecienCreada: una puntual o una periódica sin reanudadaEn queda igual', () => {
		fc.assert(
			fc.property(fc.oneof(oneOff, recurring.filter((t) => t.kind === 'periodica' && !t.resumedAt)), completions, (task, owns) => {
				expect(asJustCreated(task, owns)).toStrictEqual({ task, owns });
			})
		);
	});

	it('comoRecienCreada: con reanudadaEn, creadaEn = reanudadaEn y solo quedan los completados desde ahí', () => {
		fc.assert(
			fc.property(recurring.filter((t) => t.kind === 'periodica' && !!t.resumedAt), completions, (task, owns) => {
				const from = task.kind === 'periodica' ? task.resumedAt! : task.createdAt;
				const result = asJustCreated(task, owns);
				expect(result.task.createdAt).toStrictEqual(from);
				expect(result.owns).toStrictEqual(owns.filter((c) => c.completedAt.getTime() >= from.getTime()));
			})
		);
	});

	it('comoRecienCreada es idempotente', () => {
		fc.assert(
			fc.property(recurring, completions, (task, owns) => {
				const one = asJustCreated(task, owns);
				expect(asJustCreated(one.task, one.owns)).toStrictEqual(one);
			})
		);
	});
});
