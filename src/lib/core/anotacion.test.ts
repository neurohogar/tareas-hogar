import { describe, expect, it } from 'vitest';
import { anotar, editarTexto, normalizarTextoDeAnotacion, type Anotacion, type ContextoAlAnotar } from './anotacion';
import type { Aviso } from './aviso';

const ahora = new Date(2026, 6, 15, 8, 0, 2);

const aviso = (tareaId: string, completadoEn: Date): Aviso => ({ nombre: tareaId, completado: { id: 'c1', tareaId, completadoEn } });

const enPendientes: ContextoAlAnotar = { pantalla: 'Pendientes' };

describe('normalizarTextoDeAnotacion (spec §4.5)', () => {
	it('recorta los espacios del inicio y del final y conserva los de adentro', () => {
		expect(normalizarTextoDeAnotacion('   quedó  lindo   ')).toBe('quedó  lindo');
	});

	it.each(['', ' ', '    ', '\t \n'])('vacío o solo espacios (%j) es sin texto', (texto) => {
		expect(normalizarTextoDeAnotacion(texto)).toBeUndefined();
	});

	it('es una sola línea: los saltos de línea se quitan, como en un campo de una línea', () => {
		expect(normalizarTextoDeAnotacion('quedó\nlin\r\ndo')).toBe('quedólindo');
	});

	it('no tiene largo máximo', () => {
		expect(normalizarTextoDeAnotacion('x'.repeat(5000))).toHaveLength(5000);
	});
});

describe('anotar (spec §5.10)', () => {
	it('guarda el id, el sentido, el instante y la pantalla donde está la persona, sin tarea ni texto', () => {
		expect(anotar('a1', 'Me molestó', ahora, { pantalla: 'Historial' })).toStrictEqual({
			id: 'a1',
			sentido: 'Me molestó',
			anotadaEn: ahora,
			pantalla: 'Historial'
		});
	});

	it('guarda el texto recortado', () => {
		expect(anotar('a1', 'Me sirvió', ahora, enPendientes, '  quedó lindo ').texto).toBe('quedó lindo');
	});

	it('solo espacios como texto no guarda el campo', () => {
		expect(anotar('a1', 'Me sirvió', ahora, enPendientes, '   ')).not.toHaveProperty('texto');
	});

	it('con el panel abierto al editar, la pantalla es el Panel de edición y la tarea la del panel', () => {
		const anotacion = anotar('a1', 'Me sirvió', ahora, { pantalla: 'Etiquetas', panel: { tareaId: 'regar' } });

		expect(anotacion).toMatchObject({ pantalla: 'Panel de edición', tareaId: 'regar' });
	});

	it('con el panel abierto al crear, la pantalla es el Panel de edición y no hay tarea', () => {
		const anotacion = anotar('a1', 'Me sirvió', ahora, { pantalla: 'Historial', panel: {} });

		expect(anotacion.pantalla).toBe('Panel de edición');
		expect(anotacion).not.toHaveProperty('tareaId');
	});

	it.each([new Date(2026, 6, 15, 8, 0, 0), new Date(2026, 6, 15, 7, 59, 57, 1)])('con el aviso de deshacer visible (completado %s), la tarea es la que nombra', (completadoEn) => {
		expect(anotar('a1', 'Me sirvió', ahora, { ...enPendientes, aviso: aviso('regar', completadoEn) }).tareaId).toBe('regar');
	});

	it.each([new Date(2026, 6, 15, 7, 59, 57), new Date(2026, 6, 15, 8, 0, 3)])('con el aviso de deshacer no visible (completado %s), no hay tarea', (completadoEn) => {
		expect(anotar('a1', 'Me sirvió', ahora, { ...enPendientes, aviso: aviso('regar', completadoEn) })).not.toHaveProperty('tareaId');
	});

	it('con el panel abierto al editar manda la tarea del panel aunque el aviso se vea', () => {
		const contexto = { ...enPendientes, panel: { tareaId: 'pagar' }, aviso: aviso('regar', ahora) };

		expect(anotar('a1', 'Me sirvió', ahora, contexto).tareaId).toBe('pagar');
	});

	it('con el panel abierto al crear no hay tarea aunque el aviso se vea', () => {
		const contexto = { ...enPendientes, panel: {}, aviso: aviso('regar', ahora) };

		expect(anotar('a1', 'Me sirvió', ahora, contexto)).not.toHaveProperty('tareaId');
	});
});

describe('editarTexto (spec §6.7, §7)', () => {
	const conTexto: Anotacion = { id: 'a1', sentido: 'Me molestó', anotadaEn: ahora, pantalla: 'Panel de edición', tareaId: 'regar', texto: 'uno' };
	const otra: Anotacion = { id: 'a2', sentido: 'Me sirvió', anotadaEn: ahora, pantalla: 'Pendientes', texto: 'dos' };

	it('cambia solo el texto, recortado, de la anotación elegida', () => {
		expect(editarTexto([conTexto, otra], 'a1', '  tres ')).toStrictEqual([{ ...conTexto, texto: 'tres' }, otra]);
	});

	it('vaciarlo la deja sin texto', () => {
		const { texto: _, ...sinTexto } = conTexto;

		expect(editarTexto([conTexto], 'a1', '  ')).toStrictEqual([sinTexto]);
	});

	it('una anotación sin texto puede recibir uno', () => {
		const { texto: _, ...sinTexto } = otra;

		expect(editarTexto([sinTexto], 'a2', 'tres')).toStrictEqual([{ ...sinTexto, texto: 'tres' }]);
	});

	it('editar una anotación ya borrada no la revive', () => {
		expect(editarTexto([otra], 'a1', 'tres')).toStrictEqual([otra]);
	});
});
