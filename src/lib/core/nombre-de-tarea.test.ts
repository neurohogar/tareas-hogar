import { describe, expect, it } from 'vitest';
import { nombreDeTarea } from './nombre-de-tarea';
import type { Tarea } from './tarea';

const REGAR: Tarea = { id: 't1', titulo: 'Regar', tipo: 'puntual', creadaEn: new Date(2026, 0, 1) };

describe('nombreDeTarea', () => {
	it('con emoji es «emoji título», con un solo espacio', () => {
		expect(nombreDeTarea({ ...REGAR, emoji: '🌱' })).toBe('🌱 Regar');
	});

	it('sin emoji es solo el título, sin espacio inicial', () => {
		expect(nombreDeTarea(REGAR)).toBe('Regar');
	});

	it('no incluye la nota', () => {
		expect(nombreDeTarea({ ...REGAR, ...{ nota: 'Usar guantes' } })).toBe('Regar');
	});
});
