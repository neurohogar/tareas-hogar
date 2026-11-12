import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { porcentajeDeProgreso } from './estado';

const progreso = fc.double({ min: 0, max: 1, noNaN: true });

describe('porcentajeDeProgreso (propiedades)', () => {
	it('da un entero entre 0 y 100 a menos de medio punto del progreso', () => {
		fc.assert(
			fc.property(progreso, (p) => {
				const porcentaje = porcentajeDeProgreso(p);
				expect(Number.isInteger(porcentaje)).toBe(true);
				expect(porcentaje).toBeGreaterThanOrEqual(0);
				expect(porcentaje).toBeLessThanOrEqual(100);
				expect(Math.abs(porcentaje - p * 100)).toBeLessThanOrEqual(0.5);
			})
		);
	});

	it('es monótono', () => {
		fc.assert(
			fc.property(progreso, progreso, (a, b) => {
				expect(porcentajeDeProgreso(Math.min(a, b))).toBeLessThanOrEqual(porcentajeDeProgreso(Math.max(a, b)));
			})
		);
	});
});
