import { describe, expect, it } from 'vitest';
import type { Label } from './label';
import { taskLabels } from './task-labels';
import type { OneOffTask } from './task';

const KITCHEN: Label = { id: 'e1', name: 'Cocina', color: 'rojo' };
const BATHROOM: Label = { id: 'e2', name: 'Baño', color: 'gris' };
const PAY: OneOffTask = { id: 't1', title: 'Pagar', kind: 'puntual', createdAt: new Date(2026, 6, 1) };

describe('etiquetasDeTarea', () => {
	it('las etiquetas de la tarea, en orden alfabético', () => {
		expect(taskLabels({ ...PAY, labels: ['e1', 'e2'] }, [KITCHEN, BATHROOM])).toStrictEqual([BATHROOM, KITCHEN]);
	});

	it('sin el campo, ninguna', () => {
		expect(taskLabels(PAY, [KITCHEN])).toStrictEqual([]);
	});

	it('ignora las referencias a etiquetas que no existen', () => {
		expect(taskLabels({ ...PAY, labels: ['borrada', 'e1'] }, [KITCHEN, BATHROOM])).toStrictEqual([KITCHEN]);
	});
});
