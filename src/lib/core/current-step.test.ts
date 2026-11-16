import { describe, expect, it } from 'vitest';
import { complete } from './completions';
import {
	doneAction,
	stepButtons,
	changeOnDeleteCompletion,
	changeOnComplete,
	previousStepChange,
	stepText
} from './current-step';
import { pendingRows } from './pending';
import type { Completion, RecurringTask, OneOffTask } from './task';

const CREATED = new Date(2026, 6, 1, 8, 0, 0);
const NOW = new Date(2026, 6, 15, 8, 0, 0);
const THREE: OneOffTask = { id: 't1', title: 'Ropa', kind: 'puntual', createdAt: CREATED, firstStep: 'Separar', steps: ['Lavar', 'Tender'] };
const { steps: _, ...ONE_STEP } = THREE;
const atStep = (currentStep: number): OneOffTask => ({ ...THREE, currentStep });
const RELATIVE: RecurringTask = {
	id: 't2',
	title: 'Regar',
	kind: 'periodica',
	recurrence: { mode: 'relativo', every: 1, unit: 'dias' },
	createdAt: CREATED,
	firstStep: 'Llenar',
	steps: ['Regar']
};
const completionOf = (taskId: string, completedAt: Date, stepAtCompletion?: number): Completion => ({
	id: `c-${completedAt.getTime()}`,
	taskId,
	completedAt,
	...(stepAtCompletion !== undefined && { stepAtCompletion })
});

describe('textoDelPaso (spec §6.1)', () => {
	it('en el paso 1, «Primer paso: …»', () => {
		expect(stepText(THREE, { kind: 'pendiente' })).toBe('Primer paso: Separar');
	});

	it('en otro paso, «Paso: …» con el texto de ese paso, sin número ni total', () => {
		expect(stepText(atStep(2), { kind: 'pendiente' })).toBe('Paso: Lavar');
		expect(stepText(atStep(3), { kind: 'atrasada' })).toBe('Paso: Tender');
	});

	it('con menos pasos que pasoActual, el último', () => {
		expect(stepText(atStep(9), { kind: 'pendiente' })).toBe('Paso: Tender');
	});

	it('una tarea de un solo paso, «Primer paso: …» aunque tenga un pasoActual viejo', () => {
		expect(stepText({ ...ONE_STEP, currentStep: 3 }, { kind: 'pendiente' })).toBe('Primer paso: Separar');
	});

	it.each(['en espera', 'completada', 'pausada'] as const)('una fila %s no la muestra', (kind) => {
		expect(stepText(atStep(2), { kind })).toBeUndefined();
	});

	it('sin primer paso, no hay línea', () => {
		expect(stepText({ ...THREE, firstStep: undefined }, { kind: 'pendiente' })).toBeUndefined();
	});

	it('no lo corta, aunque sea largo', () => {
		const tooLong = 'x'.repeat(500);

		expect(stepText({ ...atStep(2), steps: [tooLong] }, { kind: 'pendiente' })).toBe(`Paso: ${tooLong}`);
	});
});

describe('accionDeHecho (spec §4.1 y §6.1)', () => {
	it('en un paso que no es el último, pasa al siguiente', () => {
		expect(doneAction(THREE, [], NOW)).toStrictEqual({ kind: 'avanzar', change: { currentStep: 2 } });
		expect(doneAction(atStep(2), [], NOW)).toStrictEqual({ kind: 'avanzar', change: { currentStep: 3 } });
	});

	it('en el último paso completa la tarea', () => {
		expect(doneAction(atStep(3), [], NOW)).toStrictEqual({ kind: 'completar' });
	});

	it('con menos pasos que pasoActual actúa sobre el último: completa', () => {
		expect(doneAction(atStep(8), [], NOW)).toStrictEqual({ kind: 'completar' });
	});

	it('un pasoActual 0 de un dato viejo es el paso 1: pasa al 2', () => {
		expect(doneAction(atStep(0), [], NOW)).toStrictEqual({ kind: 'avanzar', change: { currentStep: 2 } });
	});

	it('en el último paso, fuera de la ventana del horario, nada (como el checkbox)', () => {
		const withSchedule = { ...atStep(3), schedule: [{ from: '18:00', to: '20:00' }] };

		expect(doneAction(withSchedule, [], NOW)).toStrictEqual({ kind: 'ninguna' });
		expect(doneAction(withSchedule, [], new Date(2026, 6, 15, 19, 0, 0))).toStrictEqual({ kind: 'completar' });
	});

	it('fuera de la ventana, en un paso que no es el último, pasa igual', () => {
		const withSchedule = { ...THREE, schedule: [{ from: '18:00', to: '20:00' }] };

		expect(doneAction(withSchedule, [], NOW)).toStrictEqual({ kind: 'avanzar', change: { currentStep: 2 } });
	});

	it('en el último paso de una completada no completa de nuevo', () => {
		expect(doneAction(atStep(3), [completionOf('t1', CREATED)], NOW)).toStrictEqual({ kind: 'ninguna' });
	});

	it('una tarea de un solo paso no tiene «Hecho»', () => {
		expect(doneAction(ONE_STEP, [], NOW)).toStrictEqual({ kind: 'ninguna' });
	});

	it('dos «Hecho» desde el mismo paso escriben el mismo paso siguiente', () => {
		expect(doneAction(THREE, [], NOW)).toStrictEqual(doneAction(THREE, [], NOW));
	});
});

describe('cambioDePasoAnterior (spec §4.1 y §6.1)', () => {
	it('vuelve al paso de antes', () => {
		expect(previousStepChange(atStep(3))).toStrictEqual({ currentStep: 2 });
	});

	it('al paso 1 quita el campo (sin el campo, el paso 1)', () => {
		expect(previousStepChange(atStep(2))).toStrictEqual({ currentStep: null });
	});

	it('en el paso 1 no pasa del primero: no cambia nada', () => {
		expect(previousStepChange(THREE)).toStrictEqual({});
	});

	it('con menos pasos que pasoActual, vuelve al de antes del último', () => {
		expect(previousStepChange(atStep(9))).toStrictEqual({ currentStep: 2 });
	});
});

describe('botonesDePaso (spec §6.1)', () => {
	it('en el paso 1: «Hecho» y no «Paso anterior»', () => {
		expect(stepButtons(THREE, { kind: 'pendiente' }, [], NOW)).toStrictEqual({ previousStep: false, doneEnabled: true });
	});

	it('en otro paso: «Paso anterior» y «Hecho»', () => {
		expect(stepButtons(atStep(2), { kind: 'atrasada' }, [], NOW)).toStrictEqual({ previousStep: true, doneEnabled: true });
	});

	it('«Hecho» del último paso, deshabilitado si el checkbox lo está; el de otro paso, no', () => {
		const schedule = [{ from: '18:00', to: '20:00' }];

		expect(stepButtons({ ...atStep(3), schedule }, { kind: 'atrasada' }, [], NOW)).toStrictEqual({ previousStep: true, doneEnabled: false });
		expect(stepButtons({ ...atStep(2), schedule }, { kind: 'atrasada' }, [], NOW)).toStrictEqual({ previousStep: true, doneEnabled: true });
	});

	it('una tarea de un solo paso no tiene botones', () => {
		expect(stepButtons(ONE_STEP, { kind: 'pendiente' }, [], NOW)).toBeUndefined();
	});

	it.each(['en espera', 'completada', 'pausada'] as const)('una fila %s no los muestra', (kind) => {
		expect(stepButtons(atStep(2), { kind }, [], NOW)).toBeUndefined();
	});
});

describe('completar y cambioAlCompletar (spec §4.1, Completar; §4.4)', () => {
	it('el completado de una tarea de dos pasos o más guarda el paso en que iba', () => {
		expect(complete(atStep(2), [], 'c', NOW)).toStrictEqual({ id: 'c', taskId: 't1', completedAt: NOW, stepAtCompletion: 2 });
		expect(complete(THREE, [], 'c', NOW)).toMatchObject({ stepAtCompletion: 1 });
	});

	it('con menos pasos que pasoActual, guarda el último', () => {
		expect(complete(atStep(9), [], 'c', NOW)).toMatchObject({ stepAtCompletion: 3 });
	});

	it('una periódica también lo guarda', () => {
		expect(complete({ ...RELATIVE, currentStep: 2 }, [], 'c', NOW)).toMatchObject({ stepAtCompletion: 2 });
	});

	it('en una tarea de un solo paso el completado no guarda paso', () => {
		expect(complete({ ...ONE_STEP, currentStep: 2 }, [], 'c', NOW)).toStrictEqual({ id: 'c', taskId: 't1', completedAt: NOW });
	});

	it('completar vuelve al paso 1: quita pasoActual', () => {
		expect(changeOnComplete(atStep(3))).toStrictEqual({ currentStep: null });
	});

	it('si ya va en el paso 1 sin el campo, no cambia nada', () => {
		expect(changeOnComplete(THREE)).toStrictEqual({});
	});
});

describe('cambioAlBorrarCompletado (spec §4.1, Deshacer; §5.4)', () => {
	const previous = completionOf('t1', new Date(2026, 6, 10, 8, 0, 0), 1);
	const recent = completionOf('t1', new Date(2026, 6, 14, 8, 0, 0), 2);
	const ofOther = completionOf('t9', new Date(2026, 6, 14, 9, 0, 0), 3);
	const completions = [previous, recent, ofOther];

	it('borrar el más reciente devuelve pasoActual a su pasoAlCompletar', () => {
		expect(changeOnDeleteCompletion(THREE, completions, recent)).toStrictEqual({ currentStep: 2 });
	});

	it('vale también si los completados ya no lo incluyen', () => {
		expect(changeOnDeleteCompletion(THREE, [previous], recent)).toStrictEqual({ currentStep: 2 });
	});

	it('borrar uno que no es el más reciente no cambia el avance', () => {
		expect(changeOnDeleteCompletion(atStep(3), completions, previous)).toStrictEqual({});
	});

	it('al paso 1 quita el campo', () => {
		expect(changeOnDeleteCompletion(atStep(3), [completionOf('t1', NOW, 1)], completionOf('t1', NOW, 1))).toStrictEqual({ currentStep: null });
	});

	it('con el tope del último paso', () => {
		const ofFifth = completionOf('t1', NOW, 5);

		expect(changeOnDeleteCompletion(THREE, [ofFifth], ofFifth)).toStrictEqual({ currentStep: 3 });
	});

	it('un pasoAlCompletar 0 de un dato viejo es el paso 1', () => {
		const fromZero = completionOf('t1', NOW, 0);

		expect(changeOnDeleteCompletion(atStep(2), [fromZero], fromZero)).toStrictEqual({ currentStep: null });
	});

	it('un completado sin pasoAlCompletar no cambia el avance', () => {
		const withoutStep = completionOf('t1', NOW);

		expect(changeOnDeleteCompletion(atStep(2), [withoutStep], withoutStep)).toStrictEqual({});
	});

	it('una tarea que ahora tiene un solo paso no cambia', () => {
		expect(changeOnDeleteCompletion({ ...ONE_STEP, currentStep: 2 }, completions, recent)).toStrictEqual({});
	});

	it('si ya va en ese paso, no cambia nada', () => {
		expect(changeOnDeleteCompletion(atStep(2), completions, recent)).toStrictEqual({});
	});
});

describe('filasDePendientes con pasos (spec §6.1)', () => {
	it('la fila lleva la línea del paso y sus botones', () => {
		expect(pendingRows([atStep(2)], [], NOW)[0]).toMatchObject({
			firstStepText: 'Paso: Lavar',
			stepButtons: { previousStep: true, doneEnabled: true }
		});
	});

	it('una tarea de un solo paso lleva la línea y no botones', () => {
		const [row] = pendingRows([ONE_STEP], [], NOW);

		expect(row).toMatchObject({ firstStepText: 'Primer paso: Separar' });
		expect('stepButtons' in row).toBe(false);
	});

	it('una completada (con Mostrar completadas) y una pausada no llevan línea ni botones', () => {
		const rows = pendingRows([atStep(2), { ...RELATIVE, paused: true }], [completionOf('t1', CREATED)], NOW, true, true);

		for (const row of rows) {
			expect('firstStepText' in row).toBe(false);
			expect('stepButtons' in row).toBe(false);
		}
	});

	it('el avance no cambia el orden de la lista', () => {
		const order = (tasks: (OneOffTask | RecurringTask)[]) => pendingRows(tasks, [], NOW).map(({ task }) => task.id);

		expect(order([atStep(3), RELATIVE])).toStrictEqual(order([THREE, { ...RELATIVE, currentStep: 2 }]));
	});
});
