import { describe, expect, it } from 'vitest';
import type { PendingRow } from './pending';
import { filterQuickOnly, emptyListText } from './quick-only';
import type { Effort } from './task';

const row = (id: string, effort?: Effort): PendingRow => ({
	task: { id, title: id, kind: 'puntual', createdAt: new Date(2026, 6, 1), ...(effort && { effort }) },
	status: { kind: 'pendiente' },
	completed: false
});

describe('filtrarSoloRapidas', () => {
	const rows = [row('foco', 'rapida'), row('regar', 'media'), row('pagar'), row('lavar', 'larga'), row('barrer', 'rapida')];

	it('apagado deja la lista entera', () => {
		expect(filterQuickOnly(rows, false)).toStrictEqual(rows);
	});

	it('encendido deja solo las rápidas, en el mismo orden', () => {
		expect(filterQuickOnly(rows, true)).toStrictEqual([rows[0], rows[4]]);
	});

	it('también aplica a las completadas', () => {
		const done = (id: string, effort?: Effort): PendingRow => ({
			task: row(id, effort).task,
			status: { kind: 'completada' },
			completed: true
		});
		const completed = done('hecha');
		const quickCompleted = done('hecha2', 'rapida');

		expect(filterQuickOnly([completed, quickCompleted], true)).toStrictEqual([quickCompleted]);
	});
});

describe('textoDeListaVacia', () => {
	it('encendido y sin etiqueta elegida: "No hay tareas rápidas"', () => {
		expect(emptyListText(undefined, true)).toBe('No hay tareas rápidas');
	});

	it('con una etiqueta elegida, encendido o apagado: "No hay tareas con esta etiqueta"', () => {
		expect(emptyListText('e1', true)).toBe('No hay tareas con esta etiqueta');
		expect(emptyListText('e1', false)).toBe('No hay tareas con esta etiqueta');
	});

	it('apagado y sin etiqueta elegida, ningún texto', () => {
		expect(emptyListText(undefined, false)).toBeUndefined();
	});
});
