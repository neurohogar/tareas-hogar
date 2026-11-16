// Spec §4.1 y §6.1: el primer paso se recorta, vacío es sin campo, y solo se ve en pendiente y atrasada.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createOneOff } from './create-one-off';
import { taskData } from './task-data';
import { edit } from './editing';
import type { Status } from './status';
import { stepText } from './current-step';
import type { Task } from './task';

const CREATED = new Date(2026, 6, 1, 8, 0, 0);
const text = fc.string({ maxLength: 20 });
const create = (firstStep: string): Task => {
	const r = createOneOff({ title: 'Ropa', firstStep }, 't', CREATED);
	if (!r.ok) throw new Error('debía crearse');
	return r.task;
};

describe('primer paso (propiedades)', () => {
	it('crear lo recorta, es idempotente y vacío o solo espacios no deja el campo', () => {
		fc.assert(
			fc.property(text, (firstStep) => {
				const task = create(firstStep);
				expect(task.firstStep).toBe(firstStep.trim() === '' ? undefined : firstStep.trim());
				expect('firstStep' in task).toBe(firstStep.trim() !== '');
				expect(create(task.firstStep ?? '')).toStrictEqual(task);
			})
		);
	});

	it('textoDelPaso solo devuelve texto en pendiente y atrasada, y solo con primer paso', () => {
		const statuses: Status[] = [{ kind: 'pendiente' }, { kind: 'atrasada' }, { kind: 'espera' }, { kind: 'completada' }, { kind: 'pausada' }] as Status[];
		fc.assert(
			fc.property(text, fc.constantFrom(...statuses), (firstStep, status) => {
				const task = create(firstStep);
				const visible = status.kind === 'pendiente' || status.kind === 'atrasada';
				const expected = visible && task.firstStep ? `Primer paso: ${task.firstStep}` : undefined;
				expect(stepText(task, status)).toBe(expected);
			})
		);
	});

	it('editar solo escribe primerPaso si cambió', () => {
		fc.assert(
			fc.property(text, text, (before, after) => {
				const task = create(before);
				const result = edit(task, { ...taskData(task), firstStep: after });
				if (!result.ok) throw new Error('debía editarse');
				const newValue = after.trim() === '' ? undefined : after.trim();
				if (newValue === task.firstStep) expect('firstStep' in result.change).toBe(false);
				else expect(result.change.firstStep).toBe(newValue ?? null);
			})
		);
	});
});
