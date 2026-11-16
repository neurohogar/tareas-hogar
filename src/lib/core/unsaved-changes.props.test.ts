// Spec §6.2 (Cambios sin guardar): hay cambios es una sola definición, medida contra los valores al abrir.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { hasChanges, type PanelForm, type PanelValues } from './unsaved-changes';
import type { TaskData } from './task-data';

/** Lo que carga el panel, válido o no: la definición no depende de que Guardar tenga éxito. */
const data: fc.Arbitrary<TaskData> = fc.oneof(
	fc.record({ shape: fc.constant('puntual' as const), title: fc.string({ maxLength: 6 }), note: fc.option(fc.string({ maxLength: 6 }), { nil: undefined }) }),
	fc.record({ shape: fc.constant('relativa' as const), title: fc.string({ maxLength: 6 }), every: fc.integer({ min: 0, max: 50 }), unit: fc.constantFrom('horas' as const, 'dias' as const) }),
	fc.record({ shape: fc.constant('calendario' as const), title: fc.string({ maxLength: 6 }), weekdays: fc.constantFrom([], ['lunes' as const]), monthDays: fc.constantFrom([], [3, 17]) })
);
const names = fc.uniqueArray(fc.stringMatching(/^[a-z]{1,6}$/), { maxLength: 5 });
const values: fc.Arbitrary<PanelValues> = fc.record({ data, labels: names });
const onlySpaces = fc.stringMatching(/^[ \t\n]{0,5}$/);
const untouched = (v: PanelValues, unconfirmed = ''): PanelForm => ({ ...v, unconfirmed });

describe('hayCambios: propiedades (spec §6.2)', () => {
	it('un panel que sigue como se abrió no tiene cambios', () => {
		fc.assert(fc.property(values, (v) => {
			expect(hasChanges(v, untouched(v))).toBe(false);
		}));
	});

	it('el texto sin confirmar de solo espacios no cuenta', () => {
		fc.assert(fc.property(values, onlySpaces, (v, spaces) => {
			expect(hasChanges(v, untouched(v, spaces))).toBe(false);
		}));
	});

	it('el texto sin confirmar con algo más que espacios siempre cuenta, haya o no otros cambios', () => {
		fc.assert(
			fc.property(values, values, fc.stringMatching(/^[a-z]{1,6}$/), (onOpen, current, text) => {
				expect(hasChanges(onOpen, untouched(current, `  ${text} `))).toBe(true);
			})
		);
	});

	it('medir al revés da lo mismo: la diferencia es simétrica', () => {
		fc.assert(fc.property(values, values, (a, b) => {
			expect(hasChanges(a, untouched(b))).toBe(hasChanges(b, untouched(a)));
		}));
	});

	it('el orden y las mayúsculas de las etiquetas no cuentan: son un conjunto de nombres', () => {
		fc.assert(
			fc.property(values, fc.nat(), (v, lap) => {
				const rotatedLabels = v.labels.map((_, i) => v.labels[(i + lap) % v.labels.length].toUpperCase());
				expect(hasChanges(v, untouched({ ...v, labels: rotatedLabels }))).toBe(false);
			})
		);
	});

	it('quitar una etiqueta o agregar una nueva cuenta', () => {
		fc.assert(
			fc.property(values, (v) => {
				expect(hasChanges(v, untouched({ ...v, labels: [...v.labels, 'ZZZZZZZ'] }))).toBe(true);
				if (v.labels.length > 0) expect(hasChanges(v, untouched({ ...v, labels: v.labels.slice(1) }))).toBe(true);
			})
		);
	});

	it('los espacios alrededor del título, que Guardar recorta, no cuentan', () => {
		fc.assert(fc.property(values, (v) => {
			expect(hasChanges(v, untouched({ ...v, data: { ...v.data, title: `  ${v.data.title}\t` } }))).toBe(false);
		}));
	});
});
