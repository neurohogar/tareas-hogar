import { describe, expect, it } from 'vitest';
import type { Label } from './label';
import { mergeOfDuplicates } from './label-merge';
import type { OneOffTask } from './task';

const label = (id: string, name: string): Label => ({ id, name, color: 'gris' });
const task = (id: string, labels?: string[]): OneOffTask => ({
	id,
	title: id,
	kind: 'puntual',
	createdAt: new Date(2026, 6, 1),
	...(labels && { labels })
});

describe('fusionDeDuplicadas', () => {
	it('sin duplicadas, nada que fusionar', () => {
		expect(mergeOfDuplicates([label('a', 'Cocina'), label('b', 'Baño')], [task('t', ['a', 'b'])])).toStrictEqual({
			deletedItems: [],
			references: []
		});
	});

	it('sobrevive la de id menor; las tareas de la otra pasan a la sobreviviente, sin repetirla', () => {
		const labels = [label('b', 'cocina'), label('a', 'Cocina'), label('c', 'Baño')];
		const tasks = [task('pagar', ['a', 'b', 'c']), task('regar', ['b']), task('barrer', ['c']), task('lavar')];

		expect(mergeOfDuplicates(labels, tasks)).toStrictEqual({
			deletedItems: ['b'],
			references: [
				{ taskId: 'pagar', remove: ['b'], put: ['a'] },
				{ taskId: 'regar', remove: ['b'], put: ['a'] }
			]
		});
	});

	it('el id menor se compara por unidades de código, no por el orden de la lista', () => {
		const labels = [label('a2', 'Cocina'), label('a10', 'COCINA'), label('a1', 'cocina')];

		expect(mergeOfDuplicates(labels, []).deletedItems).toStrictEqual(['a2', 'a10']);
	});

	it('los acentos distinguen: Árbol y Arbol no son duplicadas', () => {
		expect(mergeOfDuplicates([label('a', 'Árbol'), label('b', 'Arbol')], []).deletedItems).toStrictEqual([]);
	});

	it('una referencia a una etiqueta que no existe queda como está', () => {
		const labels = [label('a', 'Cocina'), label('b', 'cocina')];

		expect(mergeOfDuplicates(labels, [task('pagar', ['borrada', 'b'])]).references).toStrictEqual([
			{ taskId: 'pagar', remove: ['b'], put: ['a'] }
		]);
	});

	it('una tarea con duplicadas de dos nombres las reemplaza por las dos sobrevivientes, una vez cada una', () => {
		const labels = [label('a', 'Cocina'), label('b', 'cocina'), label('c', 'COCINA'), label('d', 'Baño'), label('e', 'baño')];

		expect(mergeOfDuplicates(labels, [task('pagar', ['e', 'b', 'c'])]).references).toStrictEqual([
			{ taskId: 'pagar', remove: ['e', 'b', 'c'], put: ['d', 'a'] }
		]);
	});
});
