import { describe, expect, it } from 'vitest';
import { createFromPanel, editFromPanel } from './unsaved-changes-saved';
import type { TaskData } from './task-data';
import type { Task } from './task';

const NOW = new Date(2026, 6, 15, 8, 0, 0);
const PAY: Task = { id: 't', title: 'Pagar', kind: 'puntual', createdAt: NOW };
const DATA: TaskData = { shape: 'puntual', title: 'Pagar luz' };

describe('editFromPanel (spec §6.2): Save with what is written in the panel', () => {
	it('stores only what changed', () => {
		expect(editFromPanel(PAY, { data: DATA }, NOW)).toEqual({ ok: true, change: { title: 'Pagar luz' } });
	});

	it('with an invalid field it fails with its error', () => {
		expect(editFromPanel(PAY, { data: { shape: 'puntual', title: '' } }, NOW)).toEqual({ ok: false, errors: { title: 'vacio' } });
	});

	it('passes the now: turning a paused one into a one-off resumes it (§5.8)', () => {
		const paused: Task = { id: 't', title: 'Pagar luz', kind: 'periodica', recurrence: { mode: 'relativo', every: 2, unit: 'dias' }, paused: true, createdAt: NOW };
		const result = editFromPanel(paused, { data: DATA }, NOW);
		expect(result.ok && result.change.resumedAt).toEqual(NOW);
	});
});

describe('createFromPanel (spec §6.2)', () => {
	it('creates the task with what is written, the id and the now', () => {
		expect(createFromPanel({ data: DATA }, 'id', NOW)).toEqual({ ok: true, task: { id: 'id', title: 'Pagar luz', kind: 'puntual', createdAt: NOW } });
	});

	it('with an invalid field it fails and does not create the task', () => {
		expect(createFromPanel({ data: { shape: 'puntual', title: '  ' } }, 'id', NOW)).toEqual({ ok: false, errors: { title: 'vacio' } });
	});
});
