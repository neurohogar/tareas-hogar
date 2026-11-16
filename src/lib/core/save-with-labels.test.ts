import { describe, expect, it } from 'vitest';
import type { TaskData } from './task-data';
import type { Label } from './label';
import { createWithLabels, editWithLabels } from './save-with-labels';
import type { OneOffTask } from './task';

const NOW = new Date(2026, 6, 15, 8, 0, 0);
const KITCHEN: Label = { id: 'e1', name: 'Cocina', color: 'gris' };
const BATHROOM: Label = { id: 'e2', name: 'Baño', color: 'rojo' };
const PAY: OneOffTask = { id: 't1', title: 'Pagar', kind: 'puntual', createdAt: NOW };
const DATA: TaskData = { shape: 'puntual', title: 'Pagar' };

const ids = (...list: string[]) => () => list.shift() as string;

describe('crearConEtiquetas', () => {
	it('crea la tarea con sus etiquetas y las nuevas', () => {
		const result = createWithLabels(DATA, ['Patio', 'cocina'], 't1', NOW, { existings: [KITCHEN], newId: ids('e9') });

		expect(result).toStrictEqual({
			ok: true,
			task: { ...PAY, labels: ['e9', 'e1'] },
			newLabels: [{ id: 'e9', name: 'Patio', color: 'rojo' }]
		});
	});

	it('sin etiquetas, la tarea queda sin el campo', () => {
		expect(createWithLabels(DATA, [], 't1', NOW, { existings: [], newId: ids() })).toStrictEqual({ ok: true, task: PAY, newLabels: [] });
	});

	it('un nombre de etiqueta inválido rechaza la creación entera, junto con los otros errores', () => {
		const result = createWithLabels({ shape: 'puntual', title: ' ' }, ['x'.repeat(31)], 't1', NOW, { existings: [], newId: ids('e9') });

		expect(result).toStrictEqual({ ok: false, errors: { title: 'vacio', labels: 'largo' } });
	});
});

describe('editarConEtiquetas', () => {
	const context = { existings: [KITCHEN, BATHROOM], newId: ids('e9') };

	it('reemplaza las etiquetas de la tarea por las escritas', () => {
		const result = editWithLabels({ ...PAY, labels: ['e1'] }, DATA, ['Baño', 'Patio'], context);

		expect(result).toStrictEqual({
			ok: true,
			change: { labels: ['e2', 'e9'] },
			newLabels: [{ id: 'e9', name: 'Patio', color: 'naranja' }]
		});
	});

	it('las mismas etiquetas, en otro orden, no son un cambio', () => {
		const result = editWithLabels({ ...PAY, labels: ['e1', 'e2'] }, DATA, ['Baño', 'Cocina'], context);

		expect(result).toStrictEqual({ ok: true, change: {}, newLabels: [] });
	});

	it('quitar todas es un cambio a ninguna', () => {
		expect(editWithLabels({ ...PAY, labels: ['e1'] }, DATA, [], context)).toStrictEqual({ ok: true, change: { labels: [] }, newLabels: [] });
	});

	it('una tarea sin el campo y sin etiquetas escritas no cambia', () => {
		expect(editWithLabels(PAY, DATA, [], context)).toStrictEqual({ ok: true, change: {}, newLabels: [] });
	});

	it('se combina con los cambios de los otros campos', () => {
		const result = editWithLabels(PAY, { ...DATA, title: 'Pagar la luz' }, ['Cocina'], context);

		expect(result).toStrictEqual({ ok: true, change: { title: 'Pagar la luz', labels: ['e1'] }, newLabels: [] });
	});

	it('un error en otro campo rechaza la edición entera: no se crea ninguna etiqueta', () => {
		expect(editWithLabels(PAY, { ...DATA, title: '' }, ['Patio'], context)).toStrictEqual({ ok: false, errors: { title: 'vacio' } });
	});

	it('un nombre de etiqueta vacío rechaza la edición entera', () => {
		expect(editWithLabels(PAY, DATA, ['  '], context)).toStrictEqual({ ok: false, errors: { labels: 'vacio' } });
	});
});

describe('editarConEtiquetas de una pausada (spec §5.8)', () => {
	it('pasarla a puntual la reanuda en ese momento', () => {
		const paused = { id: 't2', title: 'Regar', kind: 'periodica', recurrence: { mode: 'relativo', every: 2, unit: 'dias' }, createdAt: NOW, paused: true } as const;
		const result = editWithLabels({ ...paused }, DATA, [], { existings: [], newId: ids() }, NOW);

		expect(result.ok && result.change).toMatchObject({ paused: null, resumedAt: NOW });
	});
});
