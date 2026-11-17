import { describe, expect, it } from 'vitest';
import { createFromPanel, editFromPanel } from './unsaved-changes-saved';
import type { TaskData } from './task-data';
import type { Task } from './task';

const NOW = new Date(2026, 6, 15, 8, 0, 0);
const PAY: Task = { id: 't', title: 'Pagar', kind: 'puntual', createdAt: NOW };
const DATA: TaskData = { shape: 'puntual', title: 'Pagar luz' };

describe('editarDesdePanel (spec §6.2): Guardar con lo escrito en el panel', () => {
	it('guarda solo lo que cambió', () => {
		expect(editFromPanel(PAY, { data: DATA }, NOW)).toEqual({ ok: true, change: { title: 'Pagar luz' } });
	});

	it('con un campo inválido falla con su error', () => {
		expect(editFromPanel(PAY, { data: { shape: 'puntual', title: '' } }, NOW)).toEqual({ ok: false, errors: { title: 'vacio' } });
	});

	it('pasa el ahora: pasar a puntual una pausada la reanuda (§5.8)', () => {
		const paused: Task = { id: 't', title: 'Pagar luz', kind: 'periodica', recurrence: { mode: 'relativo', every: 2, unit: 'dias' }, paused: true, createdAt: NOW };
		const result = editFromPanel(paused, { data: DATA }, NOW);
		expect(result.ok && result.change.resumedAt).toEqual(NOW);
	});
});

describe('crearDesdePanel (spec §6.2)', () => {
	it('crea la tarea con lo escrito, el id y el ahora', () => {
		expect(createFromPanel({ data: DATA }, 'id', NOW)).toEqual({ ok: true, task: { id: 'id', title: 'Pagar luz', kind: 'puntual', createdAt: NOW } });
	});

	it('con un campo inválido falla y no crea la tarea', () => {
		expect(createFromPanel({ data: { shape: 'puntual', title: '  ' } }, 'id', NOW)).toEqual({ ok: false, errors: { title: 'vacio' } });
	});
});
