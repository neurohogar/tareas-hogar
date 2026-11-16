import { describe, expect, it } from 'vitest';
import { oneOffStatus } from './one-off-status';
import type { Completion } from './task';

const LIMIT = new Date(2026, 6, 15);
const ONE_COMPLETION: Completion[] = [{ id: 'c1', taskId: 't1', completedAt: new Date(2026, 6, 10, 9, 0, 0) }];

describe('estadoPuntual (spec §5.1)', () => {
	it('sin completado ni fecha límite está pendiente', () => {
		expect(oneOffStatus(undefined, [], new Date(2099, 0, 1))).toEqual({ kind: 'pendiente' });
	});

	it.each([new Date(2026, 6, 14, 23, 59, 59), new Date(2026, 6, 15, 0, 0, 0), new Date(2026, 6, 15, 23, 59, 59)])(
		'hasta el último segundo del día límite está pendiente (%s)',
		(now) => {
			expect(oneOffStatus(LIMIT, [], now)).toEqual({ kind: 'pendiente' });
		}
	);

	it.each([new Date(2026, 6, 16, 0, 0, 0), new Date(2026, 8, 1, 8, 0, 0)])(
		'desde el día siguiente al límite está atrasada (%s)',
		(now) => {
			expect(oneOffStatus(LIMIT, [], now)).toEqual({ kind: 'atrasada' });
		}
	);

	it.each([undefined, LIMIT])('con un completado está completada, con o sin fecha límite (%s)', (dueDate) => {
		expect(oneOffStatus(dueDate, ONE_COMPLETION, new Date(2026, 8, 1))).toEqual({ kind: 'completada' });
	});
});
