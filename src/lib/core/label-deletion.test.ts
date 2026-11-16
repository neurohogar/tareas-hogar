import { describe, expect, it } from 'vitest';
import { labelDeletion, brokenReferences } from './label-deletion';
import type { Label } from './label';
import type { OneOffTask } from './task';

const task = (id: string, labels?: string[]): OneOffTask => ({
	id,
	title: id,
	kind: 'puntual',
	createdAt: new Date(2026, 6, 1),
	...(labels && { labels })
});
const label = (id: string): Label => ({ id, name: id, color: 'gris' });

describe('borradoDeEtiqueta', () => {
	it('nombra las tareas que tienen la etiqueta, y solo esas', () => {
		const tasks = [task('pagar', ['bano', 'cocina']), task('regar', ['bano']), task('barrer'), task('lavar', ['cocina'])];

		expect(labelDeletion('cocina', tasks)).toStrictEqual({
			labelId: 'cocina',
			references: [
				{ taskId: 'pagar', remove: ['cocina'], put: [] },
				{ taskId: 'lavar', remove: ['cocina'], put: [] }
			]
		});
	});
});

describe('referenciasRotas', () => {
	it('las tareas que referencian etiquetas que no existen, con esas referencias', () => {
		const tasks = [task('pagar', ['bano']), task('regar', ['cocina', 'bano', 'patio']), task('barrer')];

		expect(brokenReferences(tasks, [label('bano')])).toStrictEqual([
			{ taskId: 'regar', remove: ['cocina', 'patio'], put: [] }
		]);
	});

	it('sin referencias rotas, nada que limpiar', () => {
		expect(brokenReferences([task('pagar', ['bano'])], [label('bano')])).toStrictEqual([]);
	});
});
