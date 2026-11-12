import { describe, expect, it } from 'vitest';
import type { Etiqueta } from './etiqueta';
import { fusionDeDuplicadas } from './fusion-de-etiquetas';
import type { TareaPuntual } from './tarea';

const etiqueta = (id: string, nombre: string): Etiqueta => ({ id, nombre, color: 'gris' });
const tarea = (id: string, etiquetas?: string[]): TareaPuntual => ({
	id,
	titulo: id,
	tipo: 'puntual',
	creadaEn: new Date(2026, 6, 1),
	...(etiquetas && { etiquetas })
});

describe('fusionDeDuplicadas', () => {
	it('sin duplicadas, nada que fusionar', () => {
		expect(fusionDeDuplicadas([etiqueta('a', 'Cocina'), etiqueta('b', 'Baño')], [tarea('t', ['a', 'b'])])).toStrictEqual({
			borradas: [],
			referencias: []
		});
	});

	it('sobrevive la de id menor; las tareas de la otra pasan a la sobreviviente, sin repetirla', () => {
		const etiquetas = [etiqueta('b', 'cocina'), etiqueta('a', 'Cocina'), etiqueta('c', 'Baño')];
		const tareas = [tarea('pagar', ['a', 'b', 'c']), tarea('regar', ['b']), tarea('barrer', ['c']), tarea('lavar')];

		expect(fusionDeDuplicadas(etiquetas, tareas)).toStrictEqual({
			borradas: ['b'],
			referencias: [
				{ tareaId: 'pagar', quitar: ['b'], poner: ['a'] },
				{ tareaId: 'regar', quitar: ['b'], poner: ['a'] }
			]
		});
	});

	it('el id menor se compara por unidades de código, no por el orden de la lista', () => {
		const etiquetas = [etiqueta('a2', 'Cocina'), etiqueta('a10', 'COCINA'), etiqueta('a1', 'cocina')];

		expect(fusionDeDuplicadas(etiquetas, []).borradas).toStrictEqual(['a2', 'a10']);
	});

	it('los acentos distinguen: Árbol y Arbol no son duplicadas', () => {
		expect(fusionDeDuplicadas([etiqueta('a', 'Árbol'), etiqueta('b', 'Arbol')], []).borradas).toStrictEqual([]);
	});

	it('una referencia a una etiqueta que no existe queda como está', () => {
		const etiquetas = [etiqueta('a', 'Cocina'), etiqueta('b', 'cocina')];

		expect(fusionDeDuplicadas(etiquetas, [tarea('pagar', ['borrada', 'b'])]).referencias).toStrictEqual([
			{ tareaId: 'pagar', quitar: ['b'], poner: ['a'] }
		]);
	});

	it('una tarea con duplicadas de dos nombres las reemplaza por las dos sobrevivientes, una vez cada una', () => {
		const etiquetas = [etiqueta('a', 'Cocina'), etiqueta('b', 'cocina'), etiqueta('c', 'COCINA'), etiqueta('d', 'Baño'), etiqueta('e', 'baño')];

		expect(fusionDeDuplicadas(etiquetas, [tarea('pagar', ['e', 'b', 'c'])]).referencias).toStrictEqual([
			{ tareaId: 'pagar', quitar: ['e', 'b', 'c'], poner: ['d', 'a'] }
		]);
	});
});
