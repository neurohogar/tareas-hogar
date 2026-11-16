import { describe, expect, it } from 'vitest';
import { latestCompletion } from '../../src/lib/core/completions';
import { pendingRows } from '../../src/lib/core/pending';
import type { Completion, Task } from '../../src/lib/core/task';

const completion = (id: string, completedAt: Date): Completion => ({ id, taskId: 't', completedAt });

describe('completadoMasReciente: empate', () => {
	it('con el mismo completadoEn devuelve el primero', () => {
		const moment = new Date(2026, 6, 15, 10, 0);
		const a = completion('a', moment);
		const b = completion('b', new Date(moment.getTime()));
		expect(latestCompletion([a, b])).toBe(a);
		expect(latestCompletion([b, a])).toBe(b);
	});
});

describe('filasDePendientes: Mostrar completadas apagado por defecto', () => {
	it('sin el cuarto argumento no incluye las completadas', () => {
		const task: Task = { id: 't', title: 't', kind: 'puntual', createdAt: new Date(2026, 0, 1) };
		const now = new Date(2026, 6, 15, 12, 0);
		const rows = pendingRows([task], [completion('c', new Date(2026, 6, 15, 10, 0))], now);
		expect(rows).toEqual([]);
	});
});
