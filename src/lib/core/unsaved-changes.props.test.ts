// Spec §6.2 (Cambios sin guardar): hay cambios es una sola definición, medida contra los valores al abrir.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { hasChanges, type PanelForm } from './unsaved-changes';
import type { TaskData } from './task-data';

/** Lo que carga el panel, válido o no: la definición no depende de que Guardar tenga éxito. */
const data: fc.Arbitrary<TaskData> = fc.oneof(
	fc.record({ shape: fc.constant('puntual' as const), title: fc.string({ maxLength: 6 }), note: fc.option(fc.string({ maxLength: 6 }), { nil: undefined }) }),
	fc.record({ shape: fc.constant('relativa' as const), title: fc.string({ maxLength: 6 }), every: fc.integer({ min: 0, max: 50 }), unit: fc.constantFrom('horas' as const, 'dias' as const) }),
	fc.record({ shape: fc.constant('calendario' as const), title: fc.string({ maxLength: 6 }), weekdays: fc.constantFrom([], ['lunes' as const]), monthDays: fc.constantFrom([], [3, 17]) })
);
const values: fc.Arbitrary<PanelForm> = fc.record({ data });

describe('hayCambios: propiedades (spec §6.2)', () => {
	it('un panel que sigue como se abrió no tiene cambios', () => {
		fc.assert(fc.property(values, (v) => {
			expect(hasChanges(v, { ...v })).toBe(false);
		}));
	});

	it('medir al revés da lo mismo: la diferencia es simétrica', () => {
		fc.assert(fc.property(values, values, (a, b) => {
			expect(hasChanges(a, b)).toBe(hasChanges(b, a));
		}));
	});

	it('un título que Guardar guardaría distinto siempre es un cambio, sin excepciones', () => {
		fc.assert(fc.property(values, fc.stringMatching(/^[a-z]{1,6}$/), (v, extra) => {
			expect(hasChanges(v, { data: { ...v.data, title: `${v.data.title.trim()}${extra}` } })).toBe(true);
		}));
	});

	it('los espacios alrededor del título, que Guardar recorta, no cuentan', () => {
		fc.assert(fc.property(values, (v) => {
			expect(hasChanges(v, { data: { ...v.data, title: `  ${v.data.title}\t` } })).toBe(false);
		}));
	});
});
