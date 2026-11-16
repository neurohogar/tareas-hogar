// Spec §6.1 (Solo rápidas) y §4.1 (esfuerzo).
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { EFFORT_OPTIONS, effortText } from './effort';
import type { PendingRow } from './pending';
import { filterQuickOnly, emptyListText } from './quick-only';
import type { Effort } from './task';

const effort = fc.constantFrom<Effort | undefined>(undefined, 'rapida', 'media', 'larga');
const rows = fc.array(effort, { maxLength: 10 }).map((list) =>
	list.map((e, i): PendingRow => ({
		task: { id: `t${i}`, title: `T${i}`, kind: 'puntual', createdAt: new Date(0), labels: [], ...(e && { effort: e }) },
		status: { kind: 'pendiente' },
		completed: false
	}))
);

describe('filtrarSoloRapidas (propiedades)', () => {
	it('apagado devuelve las mismas filas', () => {
		fc.assert(fc.property(rows, (list) => {
				expect(filterQuickOnly(list, false)).toStrictEqual(list);
			}));
	});

	it('encendido es la subsecuencia de las rápidas, en el mismo orden', () => {
		fc.assert(
			fc.property(rows, (list) => {
				expect(filterQuickOnly(list, true)).toStrictEqual(list.filter(({ task }) => task.effort === 'rapida'));
			})
		);
	});

	it('es idempotente', () => {
		fc.assert(
			fc.property(rows, fc.boolean(), (list, on) => {
				const one = filterQuickOnly(list, on);
				expect(filterQuickOnly(one, on)).toStrictEqual(one);
			})
		);
	});
});

describe('textoDeListaVacia (propiedades)', () => {
	it('con etiqueta manda la etiqueta; sin etiqueta, el texto de rápidas solo si está encendido', () => {
		fc.assert(
			fc.property(fc.option(fc.string(), { nil: undefined }), fc.boolean(), (label, quickOnly) => {
				const text = emptyListText(label, quickOnly);
				if (label !== undefined) expect(text).toBe('No hay tareas con esta etiqueta');
				else expect(text).toBe(quickOnly ? 'No hay tareas rápidas' : undefined);
			})
		);
	});
});

describe('esfuerzo (propiedades)', () => {
	it('tiene texto si y solo si hay esfuerzo', () => {
		fc.assert(fc.property(effort, (e) => {
				expect(effortText(e) !== undefined).toBe(e !== undefined);
			}));
	});

	it('cada opción del selector cubre un valor distinto, con "Sin estimar" primero', () => {
		expect(EFFORT_OPTIONS[0]).toEqual({ value: undefined, text: 'Sin estimar' });
		expect(new Set(EFFORT_OPTIONS.map((o) => o.value)).size).toBe(EFFORT_OPTIONS.length);
	});
});
