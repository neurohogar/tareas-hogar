import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { addDays } from './days';
import { oneOffStatus } from './one-off-status';
import type { Completion } from './task';

/** Un día local entre 1970 y ~2100 (a las 00:00), como una fecha límite guardada. */
const day = fc.integer({ min: 0, max: 47_000 }).map((n) => new Date(1970, 0, 1 + n));
/** Un instante cualquiera en el mismo rango, al milisegundo. */
const instant = fc.integer({ min: 0, max: 4_102_444_800_000 }).map((ms) => new Date(ms));
const completions = fc
	.array(instant, { minLength: 1, maxLength: 5 })
	.map((moments) => moments.map((completedAt, i): Completion => ({ id: `c${i}`, taskId: 't', completedAt })));

describe('estadoPuntual (propiedades, spec §5.1)', () => {
	it('sin completados ni fecha límite, siempre está pendiente', () => {
		fc.assert(
			fc.property(instant, (now) => {
				expect(oneOffStatus(undefined, [], now)).toEqual({ kind: 'pendiente' });
			})
		);
	});

	it('sin completados, pasa de pendiente a atrasada exactamente al empezar el día siguiente a la fecha límite', () => {
		fc.assert(
			fc.property(day, instant, (dueDate, now) => {
				const overdueFrom = addDays(dueDate, 1).getTime();
				const expected = now.getTime() >= overdueFrom ? 'atrasada' : 'pendiente';
				expect(oneOffStatus(dueDate, [], now)).toEqual({ kind: expected });
			})
		);
	});

	it('el borde es exacto: el último milisegundo del día límite está pendiente y el primero del siguiente, atrasada', () => {
		fc.assert(
			fc.property(day, (dueDate) => {
				const following = addDays(dueDate, 1).getTime();
				expect(oneOffStatus(dueDate, [], new Date(following - 1))).toEqual({ kind: 'pendiente' });
				expect(oneOffStatus(dueDate, [], new Date(following))).toEqual({ kind: 'atrasada' });
			})
		);
	});

	it('con cualquier completado está completada, con o sin fecha límite y en cualquier momento', () => {
		fc.assert(
			fc.property(fc.option(day, { nil: undefined }), completions, instant, (dueDate, doneOnes, now) => {
				expect(oneOffStatus(dueDate, doneOnes, now)).toEqual({ kind: 'completada' });
			})
		);
	});
});
