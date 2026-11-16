import { describe, expect, it } from 'vitest';
import { hasChanges } from './unsaved-changes';
import { createRecurringCalendar } from './create-recurring-calendar';
import { createRecurringRelative } from './create-recurring-relative';
import { createOneOff } from './create-one-off';
import { createFromData, taskData, type TaskData } from './task-data';
import { applyChange, taskFromDocument, type TaskDocument } from './task-document';
import { edit } from './editing';
import { normalizeSteps, stepItIsOn, taskSteps, hasSeveralSteps } from './steps';
import type { RecurringTask, OneOffTask } from './task';

const CREATED = new Date(2026, 6, 1, 8, 0, 0);
const ONE_OFF: OneOffTask = { id: 't1', title: 'Ropa', kind: 'puntual', createdAt: CREATED, firstStep: 'Separar', steps: ['Lavar', 'Tender'] };

describe('normalizarPasos (spec §4.1, Pasos: Texto)', () => {
	it('recorta cada paso', () => {
		expect(normalizeSteps(' Separar ', ['  Lavar', 'Tender  '])).toStrictEqual({ firstStep: 'Separar', steps: ['Lavar', 'Tender'] });
	});

	it('descarta los vacíos o de solo espacios y los de abajo suben', () => {
		expect(normalizeSteps('Separar', ['', 'Lavar', ' \t ', 'Tender'])).toStrictEqual({ firstStep: 'Separar', steps: ['Lavar', 'Tender'] });
	});

	it('si el primer paso queda vacío y el paso 2 no, el paso 2 pasa a ser el primer paso', () => {
		expect(normalizeSteps('  ', ['Lavar', 'Tender'])).toStrictEqual({ firstStep: 'Lavar', steps: ['Tender'] });
	});

	it('sin pasos más allá del primero, no hay campo pasos', () => {
		expect(normalizeSteps('Separar', ['', '  '])).toStrictEqual({ firstStep: 'Separar' });
		expect(normalizeSteps('Separar')).toStrictEqual({ firstStep: 'Separar' });
	});

	it('todo vacío es sin primer paso y sin pasos', () => {
		expect(normalizeSteps(' ', [' '])).toStrictEqual({});
		expect(normalizeSteps()).toStrictEqual({});
	});

	it('no hay máximo de pasos ni de largo', () => {
		const many = Array.from({ length: 200 }, (_, i) => `Paso ${i + 2} ${'x'.repeat(1000)}`);

		expect(normalizeSteps('Separar', many)).toStrictEqual({ firstStep: 'Separar', steps: many });
	});
});

describe('pasosDeLaTarea y tieneVariosPasos (spec §4.1)', () => {
	it('el primer paso es el paso 1 y siguen los de pasos, en orden', () => {
		expect(taskSteps(ONE_OFF)).toStrictEqual(['Separar', 'Lavar', 'Tender']);
		expect(hasSeveralSteps(ONE_OFF)).toBe(true);
	});

	it('con primer paso y sin pasos, un solo paso', () => {
		const { steps: _, ...aStep } = ONE_OFF;

		expect(taskSteps(aStep)).toStrictEqual(['Separar']);
		expect(hasSeveralSteps(aStep)).toBe(false);
	});

	it('sin primer paso, ningún paso', () => {
		expect(taskSteps({ steps: ['Lavar'] })).toStrictEqual([]);
		expect(hasSeveralSteps({ steps: ['Lavar'] })).toBe(false);
	});
});

describe('pasoEnQueVa (spec §4.1, Pasos: Avance)', () => {
	it('sin pasoActual, el paso 1', () => {
		expect(stepItIsOn(ONE_OFF)).toBe(1);
	});

	it('el pasoActual guardado', () => {
		expect(stepItIsOn({ ...ONE_OFF, currentStep: 2 })).toBe(2);
		expect(stepItIsOn({ ...ONE_OFF, currentStep: 3 })).toBe(3);
	});

	it('con menos pasos que pasoActual, el último', () => {
		expect(stepItIsOn({ ...ONE_OFF, currentStep: 7 })).toBe(3);
	});

	it.each([0, -2])('un pasoActual %i de un dato viejo es el paso 1', (currentStep) => {
		expect(stepItIsOn({ ...ONE_OFF, currentStep })).toBe(1);
	});

	it('sin pasos, el paso 1', () => {
		expect(stepItIsOn({ currentStep: 3 })).toBe(1);
	});
});

describe('crear con pasos (spec §4.1)', () => {
	const commons = { title: 'Ropa', firstStep: ' Separar', steps: ['Lavar ', '', 'Tender'] };

	it('las tres formas guardan los pasos normalizados', () => {
		const expected = { firstStep: 'Separar', steps: ['Lavar', 'Tender'] };

		expect(createOneOff(commons, 'p', CREATED)).toMatchObject({ ok: true, task: expected });
		expect(createRecurringRelative({ ...commons, every: 2, unit: 'dias' }, 'r', CREATED)).toMatchObject({ ok: true, task: expected });
		expect(createRecurringCalendar({ ...commons, weekdays: ['lunes'], monthDays: [] }, 'c', CREATED)).toMatchObject({ ok: true, task: expected });
	});

	it('un paso de solo espacios no rechaza la creación: se crea sin él, sin campo pasos', () => {
		expect(createOneOff({ title: 'Ropa', firstStep: 'Separar', steps: ['   '] }, 't1', CREATED)).toStrictEqual({
			ok: true,
			task: { id: 't1', title: 'Ropa', kind: 'puntual', createdAt: CREATED, firstStep: 'Separar' }
		});
	});

	it('con el primer paso vacío, el paso 2 pasa a ser el primer paso', () => {
		expect(createOneOff({ title: 'Ropa', firstStep: '', steps: ['Lavar'] }, 't1', CREATED)).toMatchObject({
			ok: true,
			task: { firstStep: 'Lavar' }
		});
	});

	it('crear no guarda pasoActual', () => {
		const created = createOneOff(commons, 'p', CREATED);

		expect(created.ok && 'currentStep' in created.task).toBe(false);
	});
});

describe('datosDeTarea con pasos (spec §6.2)', () => {
	it('carga los pasos más, y crearSegunDatos lo devuelve igual', () => {
		const relative: RecurringTask = {
			id: 't2',
			title: 'Regar',
			kind: 'periodica',
			recurrence: { mode: 'relativo', every: 1, unit: 'dias' },
			createdAt: CREATED,
			firstStep: 'Llenar',
			steps: ['Regar']
		};
		const data = taskData(relative);

		expect(data).toMatchObject({ firstStep: 'Llenar', steps: ['Regar'] });
		expect(createFromData(data, relative.id, CREATED)).toStrictEqual({ ok: true, task: relative });
	});

	it('los pasos cargados son una copia', () => {
		const data = taskData(ONE_OFF);

		expect(data.steps).not.toBe(ONE_OFF.steps);
	});

	it('sin pasos, los datos no tienen el campo', () => {
		const { steps: _, ...aStep } = ONE_OFF;

		expect('steps' in taskData(aStep)).toBe(false);
	});
});

describe('tareaDesdeDocumento y aplicarCambio con pasos (spec §7)', () => {
	const DOC: TaskDocument = { id: 't1', title: 'Ropa', kind: 'puntual', createdAt: CREATED, firstStep: 'Separar' };

	it('la tarea conserva pasos y pasoActual del documento', () => {
		expect(taskFromDocument({ ...DOC, steps: ['Lavar'], currentStep: 2 })).toStrictEqual({ ...DOC, steps: ['Lavar'], currentStep: 2 });
	});

	it('una periódica también', () => {
		const recurring: TaskDocument = { ...DOC, kind: 'periodica', recurrence: { mode: 'relativo', every: 1, unit: 'dias' } };

		expect(taskFromDocument({ ...recurring, steps: ['Lavar'], currentStep: 2 })).toMatchObject({ steps: ['Lavar'], currentStep: 2 });
	});

	it('sin los campos, o con pasos vacío, no los tiene', () => {
		expect(taskFromDocument(DOC)).toStrictEqual(DOC);
		expect(taskFromDocument({ ...DOC, steps: [] })).toStrictEqual(DOC);
	});

	it('pasos se reemplaza entero y pasoActual es otro campo', () => {
		const [withSteps] = applyChange([{ ...DOC, steps: ['Lavar', 'Tender'], currentStep: 2 }], 't1', { steps: ['Planchar'] });

		expect(withSteps).toStrictEqual({ ...DOC, steps: ['Planchar'], currentStep: 2 });
		expect(applyChange([withSteps], 't1', { steps: null, currentStep: null })[0]).toStrictEqual(DOC);
	});
});

describe('editar los pasos (spec §4.1, §7)', () => {
	const data = (changes: Partial<TaskData>) => ({ ...taskData(ONE_OFF), ...changes }) as TaskData;

	it('cambiar un paso escribe la lista entera, recortada', () => {
		expect(edit(ONE_OFF, data({ steps: ['Lavar', ' Planchar '] }))).toStrictEqual({ ok: true, change: { steps: ['Lavar', 'Planchar'] } });
	});

	it('agregar un paso escribe la lista entera', () => {
		expect(edit(ONE_OFF, data({ steps: ['Lavar', 'Tender', 'Guardar'] }))).toStrictEqual({ ok: true, change: { steps: ['Lavar', 'Tender', 'Guardar'] } });
	});

	it('los mismos pasos, con espacios o un vacío que se descarta, no cambian nada', () => {
		expect(edit(ONE_OFF, data({ steps: [' Lavar ', '', 'Tender'] }))).toStrictEqual({ ok: true, change: {} });
	});

	it('quitar todos los pasos más lo quita (null)', () => {
		expect(edit(ONE_OFF, data({ steps: ['', ' '] }))).toStrictEqual({ ok: true, change: { steps: null } });
	});

	it('vaciar el primer paso sube el paso 2: cambian los dos campos', () => {
		expect(edit(ONE_OFF, data({ firstStep: '' }))).toStrictEqual({ ok: true, change: { firstStep: 'Lavar', steps: ['Tender'] } });
	});

	it('nunca escribe pasoActual, aunque queden menos pasos', () => {
		const result = edit({ ...ONE_OFF, currentStep: 3 }, data({ steps: [] }));

		expect(result).toStrictEqual({ ok: true, change: { steps: null } });
	});

	it('cambiar el tipo no toca los pasos', () => {
		const toRelative: TaskData = { ...taskData(ONE_OFF), shape: 'relativa', every: 1, unit: 'dias' } as TaskData;
		const result = edit({ ...ONE_OFF, currentStep: 2 }, toRelative);

		expect(result.ok && ('steps' in result.change || 'currentStep' in result.change)).toBe(false);
	});
});

describe('hayCambios con pasos (spec §6.2)', () => {
	const OPEN: TaskData = { shape: 'puntual', title: 'Ropa', firstStep: 'Separar', steps: ['Lavar'] };
	const doesChange = (current: TaskData, onOpen: TaskData = OPEN) =>
		hasChanges({ data: onOpen, labels: [] }, { data: current, labels: [], unconfirmed: '' });

	it('cambiar un paso cuenta; el mismo con espacios alrededor, no', () => {
		expect(doesChange({ ...OPEN, steps: ['Tender'] })).toBe(true);
		expect(doesChange({ ...OPEN, steps: ['  Lavar '] })).toBe(false);
	});

	it('vaciar o dejar en solo espacios un paso existente cuenta', () => {
		expect(doesChange({ ...OPEN, steps: [''] })).toBe(true);
		expect(doesChange({ ...OPEN, steps: ['   '] })).toBe(true);
	});

	it('agregar un paso vacío o de solo espacios no cuenta; escrito, sí', () => {
		expect(doesChange({ ...OPEN, steps: ['Lavar', ''] })).toBe(false);
		expect(doesChange({ ...OPEN, steps: ['Lavar', '  '] })).toBe(false);
		expect(doesChange({ ...OPEN, steps: ['Lavar', 'Tender'] })).toBe(true);
	});

	it('quitar un paso existente cuenta', () => {
		expect(doesChange({ ...OPEN, steps: [] })).toBe(true);
	});

	it('al crear, agregar un paso vacío no cuenta y escribirlo sí', () => {
		const onCreate: TaskData = { shape: 'puntual', title: '' };

		expect(doesChange({ ...onCreate, steps: [''] }, onCreate)).toBe(false);
		expect(doesChange({ ...onCreate, steps: ['Lavar'] }, onCreate)).toBe(true);
	});

	it('con una repetición inválida, un paso vacío tampoco cuenta', () => {
		const invalid: TaskData = { shape: 'relativa', title: 'Ropa', every: 0, unit: 'dias' };

		expect(doesChange({ ...invalid, steps: [' '] }, invalid)).toBe(false);
	});
});
