import { describe, expect, it } from 'vitest';
import { annotate, editText, normalizeAnnotationText, type Annotation, type AnnotateContext } from './annotation';
import type { Notice } from './notice';

const now = new Date(2026, 6, 15, 8, 0, 2);

const notice = (taskId: string, completedAt: Date): Notice => ({ name: taskId, completion: { id: 'c1', taskId, completedAt } });

const inPending: AnnotateContext = { screen: 'Pendientes' };

describe('normalizeAnnotationText (spec §4.5)', () => {
	it('trims the spaces at the start and end and keeps the inner ones', () => {
		expect(normalizeAnnotationText('   quedó  lindo   ')).toBe('quedó  lindo');
	});

	it.each(['', ' ', '    ', '\t \n'])('empty or only spaces (%j) is no text', (text) => {
		expect(normalizeAnnotationText(text)).toBeUndefined();
	});

	it('is a single line: line breaks are removed, as in a one-line field', () => {
		expect(normalizeAnnotationText('quedó\nlin\r\ndo')).toBe('quedólindo');
	});

	it('has no maximum length', () => {
		expect(normalizeAnnotationText('x'.repeat(5000))).toHaveLength(5000);
	});
});

describe('annotate (spec §5.10)', () => {
	it('saves the id, the sense, the instant and the screen where the person is, without a task or text', () => {
		expect(annotate('a1', 'Me molestó', now, { screen: 'Historial' })).toStrictEqual({
			id: 'a1',
			sense: 'Me molestó',
			annotatedAt: now,
			screen: 'Historial'
		});
	});

	it('saves the trimmed text', () => {
		expect(annotate('a1', 'Me sirvió', now, inPending, '  quedó lindo ').text).toBe('quedó lindo');
	});

	it('only spaces as text does not save the field', () => {
		expect(annotate('a1', 'Me sirvió', now, inPending, '   ')).not.toHaveProperty('text');
	});

	it('with the panel open when editing, the screen is the Panel de edición and the task is the panel one', () => {
		const annotation = annotate('a1', 'Me sirvió', now, { screen: 'Anotaciones', panel: { taskId: 'regar' } });

		expect(annotation).toMatchObject({ screen: 'Panel de edición', taskId: 'regar' });
	});

	it('with the panel open when creating, the screen is the Panel de edición and there is no task', () => {
		const annotation = annotate('a1', 'Me sirvió', now, { screen: 'Historial', panel: {} });

		expect(annotation.screen).toBe('Panel de edición');
		expect(annotation).not.toHaveProperty('taskId');
	});

	it.each([new Date(2026, 6, 15, 8, 0, 0), new Date(2026, 6, 15, 7, 59, 57, 1)])('with the undo notice visible (completed %s), the task is the one it names', (completedAt) => {
		expect(annotate('a1', 'Me sirvió', now, { ...inPending, notice: notice('regar', completedAt) }).taskId).toBe('regar');
	});

	it.each([new Date(2026, 6, 15, 7, 59, 57), new Date(2026, 6, 15, 8, 0, 3)])('with the undo notice not visible (completed %s), there is no task', (completedAt) => {
		expect(annotate('a1', 'Me sirvió', now, { ...inPending, notice: notice('regar', completedAt) })).not.toHaveProperty('taskId');
	});

	it('with the panel open when editing the panel task wins even if the notice is visible', () => {
		const context = { ...inPending, panel: { taskId: 'pagar' }, notice: notice('regar', now) };

		expect(annotate('a1', 'Me sirvió', now, context).taskId).toBe('pagar');
	});

	it('with the panel open when creating there is no task even if the notice is visible', () => {
		const context = { ...inPending, panel: {}, notice: notice('regar', now) };

		expect(annotate('a1', 'Me sirvió', now, context)).not.toHaveProperty('taskId');
	});
});

describe('editText (spec §6.7, §7)', () => {
	const withText: Annotation = { id: 'a1', sense: 'Me molestó', annotatedAt: now, screen: 'Panel de edición', taskId: 'regar', text: 'uno' };
	const other: Annotation = { id: 'a2', sense: 'Me sirvió', annotatedAt: now, screen: 'Pendientes', text: 'dos' };

	it('changes only the trimmed text of the chosen annotation', () => {
		expect(editText([withText, other], 'a1', '  tres ')).toStrictEqual([{ ...withText, text: 'tres' }, other]);
	});

	it('emptying it leaves it without text', () => {
		const { text: _, ...withoutText } = withText;

		expect(editText([withText], 'a1', '  ')).toStrictEqual([withoutText]);
	});

	it('an annotation without text can receive one', () => {
		const { text: _, ...withoutText } = other;

		expect(editText([withoutText], 'a2', 'tres')).toStrictEqual([{ ...withoutText, text: 'tres' }]);
	});

	it('editing an already deleted annotation does not revive it', () => {
		expect(editText([other], 'a1', 'tres')).toStrictEqual([other]);
	});
	it('an annotation saved in Etiquetas, when that screen existed, keeps its screen (§4.5)', () => {
		const onLabels: Annotation = { ...other, screen: 'Etiquetas' };

		expect(editText([onLabels], 'a2', 'tres')).toStrictEqual([{ ...onLabels, text: 'tres' }]);
	});
});

describe('the screens where one annotates (spec §4.5, §5.10)', () => {
	it('a new annotation cannot be taken in Etiquetas: that screen no longer exists', () => {
		// @ts-expect-error Etiquetas is no longer a screen where one can be (§5.10).
		const onLabels: AnnotateContext = { screen: 'Etiquetas' };

		expect(onLabels.screen).toBe('Etiquetas');
	});
});
