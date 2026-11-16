import { describe, expect, it } from 'vitest';
import { history } from '../../src/lib/core/history';
import type { Completion, Task } from '../../src/lib/core/task';

const task = (id: string): Task => ({ id, title: id, kind: 'puntual', createdAt: new Date(2026, 0, 1) });
const completion = (id: string, completedAt: Date): Completion => ({ id, taskId: 't', completedAt });
const now = new Date(2026, 6, 15, 12, 0, 0);

const permutations = <T>(xs: T[]): T[][] =>
	xs.length <= 1 ? [xs] : xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((rest) => [x, ...rest]));

describe('historial: orden y agrupación estables', () => {
	it('con el mismo completadoEn el orden es por id, sea cual sea el orden de entrada', () => {
		const moment = new Date(2026, 6, 15, 10, 0);
		const cs = ['c1', 'c2', 'c3'].map((id) => completion(id, moment));
		for (const entry of permutations(cs)) {
			const ids = history([task('t')], entry, now).flatMap((g) => g.entries.map((e) => e.completion.id));
			expect(ids).toEqual(['c1', 'c2', 'c3']);
		}
	});

	it('todas las entradas de un día quedan en un solo grupo aunque haya días anteriores', () => {
		const cs = [
			completion('a', new Date(2026, 6, 15, 10, 0)),
			completion('b', new Date(2026, 6, 14, 10, 0)),
			completion('c', new Date(2026, 6, 14, 9, 0)),
			completion('d', new Date(2026, 6, 14, 8, 0))
		];
		const groups = history([task('t')], cs, now);
		expect(groups.map((g) => [g.header, g.entries.length])).toEqual([
			['Hoy', 1],
			['Ayer', 3]
		]);
	});
});
