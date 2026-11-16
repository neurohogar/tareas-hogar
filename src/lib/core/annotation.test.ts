import { describe, expect, it } from 'vitest';
import { annotate, editText, normalizeAnnotationText, type Annotation, type AnnotateContext } from './annotation';
import type { Notice } from './notice';

const now = new Date(2026, 6, 15, 8, 0, 2);

const notice = (taskId: string, completedAt: Date): Notice => ({ name: taskId, completion: { id: 'c1', taskId, completedAt } });

const inPending: AnnotateContext = { screen: 'Pendientes' };

describe('normalizarTextoDeAnotacion (spec §4.5)', () => {
	it('recorta los espacios del inicio y del final y conserva los de adentro', () => {
		expect(normalizeAnnotationText('   quedó  lindo   ')).toBe('quedó  lindo');
	});

	it.each(['', ' ', '    ', '\t \n'])('vacío o solo espacios (%j) es sin texto', (text) => {
		expect(normalizeAnnotationText(text)).toBeUndefined();
	});

	it('es una sola línea: los saltos de línea se quitan, como en un campo de una línea', () => {
		expect(normalizeAnnotationText('quedó\nlin\r\ndo')).toBe('quedólindo');
	});

	it('no tiene largo máximo', () => {
		expect(normalizeAnnotationText('x'.repeat(5000))).toHaveLength(5000);
	});
});

describe('anotar (spec §5.10)', () => {
	it('guarda el id, el sentido, el instante y la pantalla donde está la persona, sin tarea ni texto', () => {
		expect(annotate('a1', 'Me molestó', now, { screen: 'Historial' })).toStrictEqual({
			id: 'a1',
			sense: 'Me molestó',
			annotatedAt: now,
			screen: 'Historial'
		});
	});

	it('guarda el texto recortado', () => {
		expect(annotate('a1', 'Me sirvió', now, inPending, '  quedó lindo ').text).toBe('quedó lindo');
	});

	it('solo espacios como texto no guarda el campo', () => {
		expect(annotate('a1', 'Me sirvió', now, inPending, '   ')).not.toHaveProperty('text');
	});

	it('con el panel abierto al editar, la pantalla es el Panel de edición y la tarea la del panel', () => {
		const annotation = annotate('a1', 'Me sirvió', now, { screen: 'Etiquetas', panel: { taskId: 'regar' } });

		expect(annotation).toMatchObject({ screen: 'Panel de edición', taskId: 'regar' });
	});

	it('con el panel abierto al crear, la pantalla es el Panel de edición y no hay tarea', () => {
		const annotation = annotate('a1', 'Me sirvió', now, { screen: 'Historial', panel: {} });

		expect(annotation.screen).toBe('Panel de edición');
		expect(annotation).not.toHaveProperty('taskId');
	});

	it.each([new Date(2026, 6, 15, 8, 0, 0), new Date(2026, 6, 15, 7, 59, 57, 1)])('con el aviso de deshacer visible (completado %s), la tarea es la que nombra', (completedAt) => {
		expect(annotate('a1', 'Me sirvió', now, { ...inPending, notice: notice('regar', completedAt) }).taskId).toBe('regar');
	});

	it.each([new Date(2026, 6, 15, 7, 59, 57), new Date(2026, 6, 15, 8, 0, 3)])('con el aviso de deshacer no visible (completado %s), no hay tarea', (completedAt) => {
		expect(annotate('a1', 'Me sirvió', now, { ...inPending, notice: notice('regar', completedAt) })).not.toHaveProperty('taskId');
	});

	it('con el panel abierto al editar manda la tarea del panel aunque el aviso se vea', () => {
		const context = { ...inPending, panel: { taskId: 'pagar' }, notice: notice('regar', now) };

		expect(annotate('a1', 'Me sirvió', now, context).taskId).toBe('pagar');
	});

	it('con el panel abierto al crear no hay tarea aunque el aviso se vea', () => {
		const context = { ...inPending, panel: {}, notice: notice('regar', now) };

		expect(annotate('a1', 'Me sirvió', now, context)).not.toHaveProperty('taskId');
	});
});

describe('editarTexto (spec §6.7, §7)', () => {
	const withText: Annotation = { id: 'a1', sense: 'Me molestó', annotatedAt: now, screen: 'Panel de edición', taskId: 'regar', text: 'uno' };
	const other: Annotation = { id: 'a2', sense: 'Me sirvió', annotatedAt: now, screen: 'Pendientes', text: 'dos' };

	it('cambia solo el texto, recortado, de la anotación elegida', () => {
		expect(editText([withText, other], 'a1', '  tres ')).toStrictEqual([{ ...withText, text: 'tres' }, other]);
	});

	it('vaciarlo la deja sin texto', () => {
		const { text: _, ...withoutText } = withText;

		expect(editText([withText], 'a1', '  ')).toStrictEqual([withoutText]);
	});

	it('una anotación sin texto puede recibir uno', () => {
		const { text: _, ...withoutText } = other;

		expect(editText([withoutText], 'a2', 'tres')).toStrictEqual([{ ...withoutText, text: 'tres' }]);
	});

	it('editar una anotación ya borrada no la revive', () => {
		expect(editText([other], 'a1', 'tres')).toStrictEqual([other]);
	});
});
