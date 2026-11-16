import { describe, expect, it } from 'vitest';
import type { Annotation } from './annotation';
import { orphanAnnotations, deletion, orphanCompletions, taskExists } from './deletion';
import type { Completion, OneOffTask } from './task';

const task = (id: string): OneOffTask => ({ id, title: id, kind: 'puntual', createdAt: new Date(2026, 6, 1) });
const completion = (id: string, taskId: string): Completion => ({ id, taskId, completedAt: new Date(2026, 6, 2) });
const annotation = (id: string, taskId?: string): Annotation => ({
	id,
	sense: 'Me sirvió',
	annotatedAt: new Date(2026, 6, 2),
	screen: 'Pendientes',
	...(taskId === undefined ? {} : { taskId })
});

describe('borrado', () => {
	it('borra la tarea y todos sus completados, y solo los suyos', () => {
		const completions = [completion('c1', 'regar'), completion('c2', 'pagar'), completion('c3', 'regar')];

		expect(deletion('regar', completions, [])).toStrictEqual({ taskId: 'regar', completionIds: ['c1', 'c3'], annotationIds: [] });
	});

	it('borra también todas sus anotaciones, y solo las suyas: no las de otra tarea ni las sin tarea', () => {
		const annotations = [annotation('a1', 'regar'), annotation('a2', 'pagar'), annotation('a3'), annotation('a4', 'regar')];

		expect(deletion('regar', [], annotations).annotationIds).toStrictEqual(['a1', 'a4']);
	});

	it('una tarea nunca completada se borra sola', () => {
		expect(deletion('regar', [completion('c2', 'pagar')], [])).toStrictEqual({ taskId: 'regar', completionIds: [], annotationIds: [] });
	});
});

describe('completadosHuerfanos', () => {
	it('son los completados cuya tarea ya no existe', () => {
		const orphanOne = completion('c2', 'borrada');
		const completions = [completion('c1', 'regar'), orphanOne, completion('c3', 'pagar')];

		expect(orphanCompletions([task('regar'), task('pagar')], completions)).toStrictEqual([orphanOne]);
	});

	it('sin tareas, todos los completados son huérfanos', () => {
		const completions = [completion('c1', 'regar')];

		expect(orphanCompletions([], completions)).toStrictEqual(completions);
	});
});

describe('anotacionesHuerfanas', () => {
	it('son las anotaciones cuya tarea ya no existe; las sin tarea no lo son', () => {
		const orphan = annotation('a2', 'borrada');
		const annotations = [annotation('a1', 'regar'), orphan, annotation('a3')];

		expect(orphanAnnotations([task('regar')], annotations)).toStrictEqual([orphan]);
	});
});

describe('existeTarea', () => {
	it('existe si alguna tarea tiene ese id', () => {
		expect(taskExists([task('pagar'), task('regar')], 'regar')).toBe(true);
	});

	it('no existe si ninguna lo tiene', () => {
		expect(taskExists([task('pagar')], 'regar')).toBe(false);
	});
});
