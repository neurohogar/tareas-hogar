import { describe, expect, it } from 'vitest';
import type { Annotation } from './annotation';
import { annotationsText } from './copied-annotations';
import type { Task } from './task';

const water: Task = { id: 'regar', title: 'Regar', emoji: '🌱', kind: 'puntual', createdAt: new Date(2026, 0, 1) };
const pay: Task = { id: 'pagar', title: 'Pagar', kind: 'puntual', createdAt: new Date(2026, 0, 1) };

describe('textoDeAnotaciones (spec §6.7, Copiar)', () => {
	it('los dos ejemplos del spec, de la más antigua a la más reciente aunque se hayan anotado en otro orden', () => {
		const annotations: Annotation[] = [
			{ id: 'a1', sense: 'Me molestó', annotatedAt: new Date(2026, 6, 15, 9, 10, 30), screen: 'Historial' },
			{ id: 'a2', sense: 'Me sirvió', annotatedAt: new Date(2026, 6, 15, 8, 5), screen: 'Pendientes', taskId: 'regar', text: 'quedó lindo' }
		];

		expect(annotationsText([water], annotations)).toBe('2026-07-15 08:05 · Me sirvió · Pendientes · 🌱 Regar · quedó lindo\n2026-07-15 09:10 · Me molestó · Historial');
	});

	it('con tarea sin texto, y con texto sin tarea: cada parte solo si la hay', () => {
		const annotations: Annotation[] = [
			{ id: 'a1', sense: 'Me molestó', annotatedAt: new Date(2026, 6, 15, 8, 0), screen: 'Panel de edición', taskId: 'pagar' },
			{ id: 'a2', sense: 'Me sirvió', annotatedAt: new Date(2026, 6, 15, 9, 0), screen: 'Anotaciones', text: 'quedó lindo' }
		];

		expect(annotationsText([pay], annotations)).toBe('2026-07-15 08:00 · Me molestó · Panel de edición · Pagar\n2026-07-15 09:00 · Me sirvió · Anotaciones · quedó lindo');
	});

	it('si dos tienen el mismo instante va primero la de id menor', () => {
		const moment = new Date(2026, 6, 15, 10, 0);
		const a1: Annotation = { id: 'a1', sense: 'Me sirvió', annotatedAt: moment, screen: 'Pendientes' };
		const a2: Annotation = { id: 'a2', sense: 'Me molestó', annotatedAt: moment, screen: 'Pendientes' };
		const expected = '2026-07-15 10:00 · Me sirvió · Pendientes\n2026-07-15 10:00 · Me molestó · Pendientes';

		expect(annotationsText([], [a2, a1])).toBe(expected);
		expect(annotationsText([], [a1, a2])).toBe(expected);
	});

	it('no copia las anotaciones de una tarea que ya no existe', () => {
		const orphan: Annotation = { id: 'a1', sense: 'Me sirvió', annotatedAt: new Date(2026, 6, 15, 8, 0), screen: 'Etiquetas', taskId: 'borrada' };
		const withoutTask: Annotation = { id: 'a2', sense: 'Me sirvió', annotatedAt: new Date(2026, 6, 15, 9, 0), screen: 'Etiquetas' };

		expect(annotationsText([water], [orphan, withoutTask])).toBe('2026-07-15 09:00 · Me sirvió · Etiquetas');
	});

	it('sin anotaciones que mostrar no hay nada para copiar', () => {
		const orphan: Annotation = { id: 'a1', sense: 'Me sirvió', annotatedAt: new Date(2026, 6, 15, 8, 0), screen: 'Etiquetas', taskId: 'borrada' };

		expect(annotationsText([water], [])).toBeUndefined();
		expect(annotationsText([water], [orphan])).toBeUndefined();
	});
});
