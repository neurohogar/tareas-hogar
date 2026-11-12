import { describe, expect, it } from 'vitest';
import type { Anotacion } from './anotacion';
import { textoDeAnotaciones } from './anotaciones-copiadas';
import type { Tarea } from './tarea';

const regar: Tarea = { id: 'regar', titulo: 'Regar', emoji: '🌱', tipo: 'puntual', creadaEn: new Date(2026, 0, 1) };
const pagar: Tarea = { id: 'pagar', titulo: 'Pagar', tipo: 'puntual', creadaEn: new Date(2026, 0, 1) };

describe('textoDeAnotaciones (spec §6.7, Copiar)', () => {
	it('los dos ejemplos del spec, de la más antigua a la más reciente aunque se hayan anotado en otro orden', () => {
		const anotaciones: Anotacion[] = [
			{ id: 'a1', sentido: 'Me molestó', anotadaEn: new Date(2026, 6, 15, 9, 10, 30), pantalla: 'Historial' },
			{ id: 'a2', sentido: 'Me sirvió', anotadaEn: new Date(2026, 6, 15, 8, 5), pantalla: 'Pendientes', tareaId: 'regar', texto: 'quedó lindo' }
		];

		expect(textoDeAnotaciones([regar], anotaciones)).toBe('2026-07-15 08:05 · Me sirvió · Pendientes · 🌱 Regar · quedó lindo\n2026-07-15 09:10 · Me molestó · Historial');
	});

	it('con tarea sin texto, y con texto sin tarea: cada parte solo si la hay', () => {
		const anotaciones: Anotacion[] = [
			{ id: 'a1', sentido: 'Me molestó', anotadaEn: new Date(2026, 6, 15, 8, 0), pantalla: 'Panel de edición', tareaId: 'pagar' },
			{ id: 'a2', sentido: 'Me sirvió', anotadaEn: new Date(2026, 6, 15, 9, 0), pantalla: 'Anotaciones', texto: 'quedó lindo' }
		];

		expect(textoDeAnotaciones([pagar], anotaciones)).toBe('2026-07-15 08:00 · Me molestó · Panel de edición · Pagar\n2026-07-15 09:00 · Me sirvió · Anotaciones · quedó lindo');
	});

	it('si dos tienen el mismo instante va primero la de id menor', () => {
		const momento = new Date(2026, 6, 15, 10, 0);
		const a1: Anotacion = { id: 'a1', sentido: 'Me sirvió', anotadaEn: momento, pantalla: 'Pendientes' };
		const a2: Anotacion = { id: 'a2', sentido: 'Me molestó', anotadaEn: momento, pantalla: 'Pendientes' };
		const esperado = '2026-07-15 10:00 · Me sirvió · Pendientes\n2026-07-15 10:00 · Me molestó · Pendientes';

		expect(textoDeAnotaciones([], [a2, a1])).toBe(esperado);
		expect(textoDeAnotaciones([], [a1, a2])).toBe(esperado);
	});

	it('no copia las anotaciones de una tarea que ya no existe', () => {
		const huerfana: Anotacion = { id: 'a1', sentido: 'Me sirvió', anotadaEn: new Date(2026, 6, 15, 8, 0), pantalla: 'Etiquetas', tareaId: 'borrada' };
		const sinTarea: Anotacion = { id: 'a2', sentido: 'Me sirvió', anotadaEn: new Date(2026, 6, 15, 9, 0), pantalla: 'Etiquetas' };

		expect(textoDeAnotaciones([regar], [huerfana, sinTarea])).toBe('2026-07-15 09:00 · Me sirvió · Etiquetas');
	});

	it('sin anotaciones que mostrar no hay nada para copiar', () => {
		const huerfana: Anotacion = { id: 'a1', sentido: 'Me sirvió', anotadaEn: new Date(2026, 6, 15, 8, 0), pantalla: 'Etiquetas', tareaId: 'borrada' };

		expect(textoDeAnotaciones([regar], [])).toBeUndefined();
		expect(textoDeAnotaciones([regar], [huerfana])).toBeUndefined();
	});
});
