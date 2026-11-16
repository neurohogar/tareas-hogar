import { describe, expect, it } from 'vitest';
import type { Label } from './label';
import { filterByLabel, activeFilter } from './label-filter';
import type { PendingRow } from './pending';
import type { Task } from './task';

const KITCHEN: Label = { id: 'e1', name: 'Cocina', color: 'rojo' };
const BATHROOM: Label = { id: 'e2', name: 'Baño', color: 'gris' };

const row = (id: string, labels?: string[]): PendingRow => ({
	task: { id, title: id, kind: 'puntual', createdAt: new Date(2026, 6, 1), ...(labels && { labels }) } as Task,
	status: { kind: 'pendiente' },
	completed: false
});

describe('filtroVigente', () => {
	it('"Todas" (sin etiqueta) sigue en "Todas"', () => {
		expect(activeFilter(undefined, [KITCHEN])).toBeUndefined();
	});

	it('una etiqueta que existe sigue elegida', () => {
		expect(activeFilter('e1', [KITCHEN, BATHROOM])).toBe('e1');
	});

	it('si la etiqueta elegida ya no existe, vuelve a "Todas"', () => {
		expect(activeFilter('e1', [BATHROOM])).toBeUndefined();
	});
});

describe('filtrarPorEtiqueta', () => {
	const rows = [row('pagar', ['e1', 'e2']), row('basura', ['e2']), row('regar'), row('lavar', ['e1'])];

	it('"Todas" deja la lista entera', () => {
		expect(filterByLabel(rows, undefined)).toStrictEqual(rows);
	});

	it('una etiqueta deja solo las tareas que la tienen, en el mismo orden', () => {
		expect(filterByLabel(rows, 'e1')).toStrictEqual([rows[0], rows[3]]);
		expect(filterByLabel(rows, 'e2')).toStrictEqual([rows[0], rows[1]]);
	});
});
