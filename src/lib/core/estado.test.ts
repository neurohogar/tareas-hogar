import { describe, expect, it } from 'vitest';
import { porcentajeDeProgreso } from './estado';

describe('porcentajeDeProgreso', () => {
	it.each([
		[0, 0],
		[0.5, 50],
		[47 / 48, 98],
		[0.994, 99],
		[0.125, 13]
	])('progreso %s → %s %%, redondeado a entero', (progreso, porcentaje) => {
		expect(porcentajeDeProgreso(progreso)).toBe(porcentaje);
	});
});
