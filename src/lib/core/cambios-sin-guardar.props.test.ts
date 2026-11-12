// Spec §6.2 (Cambios sin guardar): hay cambios es una sola definición, medida contra los valores al abrir.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { hayCambios, type FormularioDelPanel, type ValoresDelPanel } from './cambios-sin-guardar';
import type { DatosDeTarea } from './datos-de-tarea';

/** Lo que carga el panel, válido o no: la definición no depende de que Guardar tenga éxito. */
const datos: fc.Arbitrary<DatosDeTarea> = fc.oneof(
	fc.record({ forma: fc.constant('puntual' as const), titulo: fc.string({ maxLength: 6 }), nota: fc.option(fc.string({ maxLength: 6 }), { nil: undefined }) }),
	fc.record({ forma: fc.constant('relativa' as const), titulo: fc.string({ maxLength: 6 }), cada: fc.integer({ min: 0, max: 50 }), unidad: fc.constantFrom('horas' as const, 'dias' as const) }),
	fc.record({ forma: fc.constant('calendario' as const), titulo: fc.string({ maxLength: 6 }), diasSemana: fc.constantFrom([], ['lunes' as const]), diasMes: fc.constantFrom([], [3, 17]) })
);
const nombres = fc.uniqueArray(fc.stringMatching(/^[a-z]{1,6}$/), { maxLength: 5 });
const valores: fc.Arbitrary<ValoresDelPanel> = fc.record({ datos, etiquetas: nombres });
const soloEspacios = fc.stringMatching(/^[ \t\n]{0,5}$/);
const sinTocar = (v: ValoresDelPanel, sinConfirmar = ''): FormularioDelPanel => ({ ...v, sinConfirmar });

describe('hayCambios: propiedades (spec §6.2)', () => {
	it('un panel que sigue como se abrió no tiene cambios', () => {
		fc.assert(fc.property(valores, (v) => {
			expect(hayCambios(v, sinTocar(v))).toBe(false);
		}));
	});

	it('el texto sin confirmar de solo espacios no cuenta', () => {
		fc.assert(fc.property(valores, soloEspacios, (v, espacios) => {
			expect(hayCambios(v, sinTocar(v, espacios))).toBe(false);
		}));
	});

	it('el texto sin confirmar con algo más que espacios siempre cuenta, haya o no otros cambios', () => {
		fc.assert(
			fc.property(valores, valores, fc.stringMatching(/^[a-z]{1,6}$/), (alAbrir, actual, texto) => {
				expect(hayCambios(alAbrir, sinTocar(actual, `  ${texto} `))).toBe(true);
			})
		);
	});

	it('medir al revés da lo mismo: la diferencia es simétrica', () => {
		fc.assert(fc.property(valores, valores, (a, b) => {
			expect(hayCambios(a, sinTocar(b))).toBe(hayCambios(b, sinTocar(a)));
		}));
	});

	it('el orden y las mayúsculas de las etiquetas no cuentan: son un conjunto de nombres', () => {
		fc.assert(
			fc.property(valores, fc.nat(), (v, vuelta) => {
				const giradas = v.etiquetas.map((_, i) => v.etiquetas[(i + vuelta) % v.etiquetas.length].toUpperCase());
				expect(hayCambios(v, sinTocar({ ...v, etiquetas: giradas }))).toBe(false);
			})
		);
	});

	it('quitar una etiqueta o agregar una nueva cuenta', () => {
		fc.assert(
			fc.property(valores, (v) => {
				expect(hayCambios(v, sinTocar({ ...v, etiquetas: [...v.etiquetas, 'ZZZZZZZ'] }))).toBe(true);
				if (v.etiquetas.length > 0) expect(hayCambios(v, sinTocar({ ...v, etiquetas: v.etiquetas.slice(1) }))).toBe(true);
			})
		);
	});

	it('los espacios alrededor del título, que Guardar recorta, no cuentan', () => {
		fc.assert(fc.property(valores, (v) => {
			expect(hayCambios(v, sinTocar({ ...v, datos: { ...v.datos, titulo: `  ${v.datos.titulo}\t` } }))).toBe(false);
		}));
	});
});
