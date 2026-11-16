import { describe, expect, it } from 'vitest';
import { hasChanges } from './unsaved-changes';
import { createRecurringCalendar } from './create-recurring-calendar';
import { createRecurringRelative } from './create-recurring-relative';
import { createOneOff } from './create-one-off';
import { createFromData, taskData, type TaskData } from './task-data';
import { applyChange, taskFromDocument, type TaskDocument } from './task-document';
import { edit } from './editing';
import { pendingRows } from './pending';
import { stepText } from './current-step';
import type { Completion, RecurringTask, OneOffTask } from './task';

const CREATED = new Date(2026, 6, 1, 8, 0, 0);
const NOW = new Date(2026, 6, 15, 8, 0, 0);
const STEP = 'Separar la ropa blanca';
const ONE_OFF: OneOffTask = { id: 't1', title: 'Ropa', kind: 'puntual', createdAt: CREATED, firstStep: STEP };
const RELATIVE: RecurringTask = {
	id: 't2',
	title: 'Regar',
	kind: 'periodica',
	recurrence: { mode: 'relativo', every: 1, unit: 'dias' },
	createdAt: CREATED,
	firstStep: STEP
};

describe('crear con primer paso (spec §4.1)', () => {
	it('las tres formas guardan el primer paso recortado', () => {
		const commons = { title: 'Ropa', firstStep: `  ${STEP} ` };

		expect(createOneOff(commons, 'p', CREATED)).toMatchObject({ ok: true, task: { firstStep: STEP } });
		expect(createRecurringRelative({ ...commons, every: 2, unit: 'dias' }, 'r', CREATED)).toMatchObject({ ok: true, task: { firstStep: STEP } });
		expect(createRecurringCalendar({ ...commons, weekdays: ['lunes'], monthDays: [] }, 'c', CREATED)).toMatchObject({
			ok: true,
			task: { firstStep: STEP }
		});
	});

	it.each(['', '   ', ' \t '])('vacío o solo espacios (%j) es sin primer paso: el campo no se guarda', (firstStep) => {
		const result = createOneOff({ title: 'Ropa', firstStep }, 't1', CREATED);

		expect(result).toStrictEqual({ ok: true, task: { id: 't1', title: 'Ropa', kind: 'puntual', createdAt: CREATED } });
	});

	it('nunca es inválido ni tiene largo máximo: no rechaza la creación', () => {
		const tooLong = 'x'.repeat(5000);

		expect(createOneOff({ title: 'Ropa', firstStep: tooLong }, 't1', CREATED)).toMatchObject({ ok: true, task: { firstStep: tooLong } });
	});

	it('no reemplaza la nota: son campos distintos', () => {
		const result = createOneOff({ title: 'Ropa', note: 'Usar guantes', firstStep: STEP }, 't1', CREATED);

		expect(result).toMatchObject({ ok: true, task: { note: 'Usar guantes', firstStep: STEP } });
	});
});

describe('datosDeTarea con primer paso (spec §6.2)', () => {
	it('al editar, el panel carga el primer paso actual, y crearSegunDatos lo devuelve igual', () => {
		const data = taskData(RELATIVE);

		expect(data).toMatchObject({ shape: 'relativa', firstStep: STEP });
		expect(createFromData(data, RELATIVE.id, CREATED)).toStrictEqual({ ok: true, task: RELATIVE });
	});

	it('una tarea sin primer paso carga los datos sin el campo', () => {
		const { firstStep: _, ...withoutStep } = ONE_OFF;

		expect(taskData(withoutStep)).toStrictEqual({ shape: 'puntual', title: 'Ropa' });
	});
});

describe('tareaDesdeDocumento y aplicarCambio con primer paso (spec §7)', () => {
	const DOC: TaskDocument = { id: 't1', title: 'Ropa', kind: 'puntual', createdAt: CREATED };

	it('la tarea conserva el primer paso del documento; sin el campo, no tiene', () => {
		expect(taskFromDocument({ ...DOC, firstStep: STEP })).toStrictEqual({ ...DOC, firstStep: STEP });
		expect(taskFromDocument(DOC)).toStrictEqual(DOC);
	});

	it('un cambio escribe el primer paso, null lo quita, y no toca la nota', () => {
		const withNote = { ...DOC, note: 'Usar guantes' };
		const [withStep] = applyChange([withNote], 't1', { firstStep: STEP });

		expect(withStep).toStrictEqual({ ...withNote, firstStep: STEP });
		expect(applyChange([withStep], 't1', { firstStep: null })[0]).toStrictEqual(withNote);
	});
});

describe('editar el primer paso (spec §4.1, §7)', () => {
	const data = (changes: Partial<TaskData>) => ({ ...taskData(ONE_OFF), ...changes }) as TaskData;

	it('otro primer paso entra en el cambio, recortado', () => {
		expect(edit(ONE_OFF, data({ firstStep: ' Lavar ' }))).toStrictEqual({ ok: true, change: { firstStep: 'Lavar' } });
	});

	it('el mismo, aunque con espacios alrededor, no cambia nada', () => {
		expect(edit(ONE_OFF, data({ firstStep: `  ${STEP}  ` }))).toStrictEqual({ ok: true, change: {} });
	});

	it('vacío o solo espacios lo quita (null)', () => {
		expect(edit(ONE_OFF, data({ firstStep: '   ' }))).toStrictEqual({ ok: true, change: { firstStep: null } });
	});

	it('cambiar el tipo no lo toca', () => {
		const toRelative: TaskData = { shape: 'relativa', title: 'Ropa', firstStep: STEP, every: 1, unit: 'dias' };
		const result = edit(ONE_OFF, toRelative);

		expect(result.ok && 'firstStep' in result.change).toBe(false);
	});
});

describe('hayCambios con primer paso (spec §6.2)', () => {
	const OPEN: TaskData = { shape: 'puntual', title: 'Ropa', firstStep: STEP };
	const doesChange = (current: TaskData, onOpen: TaskData = OPEN) =>
		hasChanges({ data: onOpen, labels: [] }, { data: current, labels: [], unconfirmed: '' });

	it('otro primer paso es un cambio; el mismo con espacios alrededor, no', () => {
		expect(doesChange({ ...OPEN, firstStep: 'Lavar' })).toBe(true);
		expect(doesChange({ ...OPEN, firstStep: `  ${STEP} ` })).toBe(false);
	});

	it('vaciar un primer paso existente es un cambio', () => {
		expect(doesChange({ ...OPEN, firstStep: '' })).toBe(true);
	});

	it('sin el campo, vacío y solo espacios son lo mismo', () => {
		const withoutStep: TaskData = { shape: 'puntual', title: 'Ropa' };

		expect(doesChange({ ...withoutStep, firstStep: '   ' }, withoutStep)).toBe(false);
		expect(doesChange({ ...withoutStep, firstStep: '' }, { ...withoutStep, firstStep: '  ' })).toBe(false);
	});

	it('con una repetición inválida, los espacios del primer paso tampoco cuentan', () => {
		const invalid: TaskData = { shape: 'relativa', title: 'Ropa', every: 0, unit: 'dias' };

		expect(doesChange({ ...invalid, firstStep: '  ' }, invalid)).toBe(false);
	});
});

describe('textoDelPaso con un solo paso (spec §6.1)', () => {
	it.each(['pendiente', 'atrasada'] as const)('una fila %s lo muestra con el prefijo y el texto completo', (kind) => {
		expect(stepText(ONE_OFF, { kind })).toBe(`Primer paso: ${STEP}`);
	});

	it.each(['en espera', 'completada', 'pausada'] as const)('una fila %s no lo muestra', (kind) => {
		expect(stepText(ONE_OFF, { kind })).toBeUndefined();
	});

	it('una tarea sin primer paso no lo muestra', () => {
		const { firstStep: _, ...withoutStep } = ONE_OFF;

		expect(stepText(withoutStep, { kind: 'pendiente' })).toBeUndefined();
	});

	it('no lo corta, aunque sea largo', () => {
		const tooLong = 'x'.repeat(500);

		expect(stepText({ ...ONE_OFF, firstStep: tooLong }, { kind: 'pendiente' })).toBe(`Primer paso: ${tooLong}`);
	});
});

describe('filasDePendientes con primer paso (spec §6.1)', () => {
	const completion: Completion = { id: 'c', taskId: RELATIVE.id, completedAt: new Date(2026, 6, 15, 7, 0, 0) };
	const texts = (completions: Completion[], tasks = [ONE_OFF, RELATIVE]) =>
		pendingRows(tasks, completions, NOW, true, true).map(({ task, firstStepText }) => [task.id, firstStepText]);

	it('las filas pendiente y atrasada lo llevan; una completada en espera, no', () => {
		expect(texts([])).toStrictEqual([
			['t2', `Primer paso: ${STEP}`],
			['t1', `Primer paso: ${STEP}`]
		]);
		expect(texts([completion])).toStrictEqual([
			['t1', `Primer paso: ${STEP}`],
			['t2', undefined]
		]);
	});

	it('una pausada no lo lleva', () => {
		expect(texts([], [{ ...RELATIVE, paused: true }])).toStrictEqual([['t2', undefined]]);
	});

	it('completar la tarea no lo borra: vuelve cuando la periódica vuelve a estar pendiente', () => {
		const onNextDay = new Date(2026, 6, 16, 7, 30, 0);

		expect(pendingRows([RELATIVE], [completion], onNextDay)[0]).toMatchObject({ firstStepText: `Primer paso: ${STEP}` });
	});

	it('no cambia el orden de la lista', () => {
		const { firstStep: _p, ...oneOffWithoutStep } = ONE_OFF;
		const { firstStep: _r, ...relativeWithoutStep } = RELATIVE;
		const order = (tasks: (OneOffTask | RecurringTask)[]) => pendingRows(tasks, [], NOW).map(({ task }) => task.id);

		expect(order([ONE_OFF, RELATIVE])).toStrictEqual(order([oneOffWithoutStep, relativeWithoutStep]));
	});
});
