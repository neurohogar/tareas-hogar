import { describe, expect, it } from 'vitest';
import { createFromPanel, editFromPanel } from './unsaved-changes-saved';
import type { TaskData } from './task-data';
import type { Label } from './label';
import type { Task } from './task';

const NOW = new Date(2026, 6, 15, 8, 0, 0);
const PAY: Task = { id: 't', title: 'Pagar', kind: 'puntual', createdAt: NOW };
const DATA: TaskData = { shape: 'puntual', title: 'Pagar luz' };
const LONG = 'abcdefghijklmnopqrstuvwxyz12345';
const HOME: Label = { id: 'e1', name: 'casa', color: 'gris' };
const labels = { existings: [HOME], newId: () => 'nueva' };

describe('editarDesdePanel (spec §6.2): Guardar con texto sin confirmar en Etiquetas', () => {
	const form = (unconfirmed: string, data = DATA) => ({ data, labels: [], unconfirmed });

	it('el texto válido no crea la etiqueta ni cambia lo que se guarda', () => {
		const result = editFromPanel(PAY, form('auto'), labels, NOW);
		expect(result).toEqual({ ok: true, change: { title: 'Pagar luz' }, newLabels: [] });
	});

	it('el texto de solo espacios no hace fallar Guardar', () => {
		expect(editFromPanel(PAY, form('   '), labels, NOW)).toEqual({ ok: true, change: { title: 'Pagar luz' }, newLabels: [] });
	});

	it('un nombre inválido hace fallar Guardar', () => {
		const result = editFromPanel(PAY, form(LONG), labels, NOW);
		expect(result).toEqual({ ok: false, errors: { labels: 'largo' } });
	});

	it('junta ese error con los de los otros campos', () => {
		const result = editFromPanel(PAY, form(LONG, { shape: 'puntual', title: '' }), labels, NOW);
		expect(result).toEqual({ ok: false, errors: { title: 'vacio', labels: 'largo' } });
	});

	it('sin texto inválido, los errores son los de Guardar', () => {
		const result = editFromPanel(PAY, form('', { shape: 'puntual', title: '' }), labels, NOW);
		expect(result).toEqual({ ok: false, errors: { title: 'vacio' } });
	});

	it('guarda las etiquetas confirmadas', () => {
		const result = editFromPanel(PAY, { data: DATA, labels: ['casa'], unconfirmed: '' }, labels, NOW);
		expect(result).toEqual({ ok: true, change: { title: 'Pagar luz', labels: ['e1'] }, newLabels: [] });
	});

	it('pasa el ahora: pasar a puntual una pausada la reanuda (§5.8)', () => {
		const paused: Task = { id: 't', title: 'Pagar luz', kind: 'periodica', recurrence: { mode: 'relativo', every: 2, unit: 'dias' }, paused: true, createdAt: NOW };
		const result = editFromPanel(paused, form(''), labels, NOW);
		expect(result.ok && result.change.resumedAt).toEqual(NOW);
	});
});

describe('crearDesdePanel (spec §6.2)', () => {
	const form = (unconfirmed: string, data = DATA) => ({ data, labels: [], unconfirmed });

	it('el texto válido no crea la etiqueta', () => {
		const result = createFromPanel(form('auto'), 'id', NOW, labels);
		expect(result).toEqual({ ok: true, task: { id: 'id', title: 'Pagar luz', kind: 'puntual', createdAt: NOW }, newLabels: [] });
	});

	it('un nombre inválido hace fallar Guardar y no crea la tarea', () => {
		expect(createFromPanel(form(LONG), 'id', NOW, labels)).toEqual({ ok: false, errors: { labels: 'largo' } });
	});
});
