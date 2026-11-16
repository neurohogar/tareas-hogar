import { describe, expect, it } from 'vitest';
import { hasChanges, type PanelValues } from './unsaved-changes';
import { DATA_ON_CREATE, taskData, type TaskData } from './task-data';
import type { Task } from './task';

const CREATED = new Date(2026, 6, 13, 8, 0, 0);
const ONE_OFF: TaskData = { shape: 'puntual', title: 'Pagar', note: 'Luz' };
const RELATIVE: TaskData = { shape: 'relativa', title: 'Regar', every: 2, unit: 'dias' };
const WEEKLY: TaskData = { shape: 'calendario', title: 'Regar', weekdays: ['lunes', 'jueves'], monthDays: [] };
const WITH_SCHEDULES: TaskData = {
	shape: 'puntual',
	title: 'Pagar',
	schedule: [
		{ from: '08:00', to: '10:00' },
		{ from: '12:00', to: '14:00' }
	]
};
/** Como abre el panel al crear: nada escrito. */
const ON_CREATE: TaskData = { shape: 'puntual', title: '', emoji: '', note: '', dueDate: undefined };

const open = (data: TaskData, labels: readonly string[] = []): PanelValues => ({ data, labels });
const doesChange = (onOpen: TaskData, data: TaskData, unconfirmed = '') => hasChanges(open(onOpen), { data, labels: [], unconfirmed });

describe('hayCambios (spec §6.2): Guardar cambiaría algo respecto de los valores al abrir', () => {
	it('los mismos valores no son un cambio', () => {
		expect(doesChange(ONE_OFF, { ...ONE_OFF })).toBe(false);
	});

	it('otro título, otra nota, otro emoji u otro esfuerzo son un cambio', () => {
		expect(doesChange(ONE_OFF, { ...ONE_OFF, title: 'Pagar luz' })).toBe(true);
		expect(doesChange(ONE_OFF, { ...ONE_OFF, note: 'Gas' })).toBe(true);
		expect(doesChange(ONE_OFF, { ...ONE_OFF, emoji: '🌱' })).toBe(true);
		expect(doesChange(ONE_OFF, { ...ONE_OFF, effort: 'media' })).toBe(true);
	});

	it('los espacios que Guardar recorta no cuentan', () => {
		expect(doesChange(ONE_OFF, { ...ONE_OFF, title: '  Pagar  ', note: '  Luz \n' })).toBe(false);
		expect(doesChange({ ...ONE_OFF, emoji: '🌱' }, { ...ONE_OFF, emoji: ' 🌱 ' })).toBe(false);
	});

	it('un valor que no es un solo emoji se compara tal cual: otro texto es un cambio', () => {
		expect(doesChange({ ...ONE_OFF, emoji: '🌱' }, { ...ONE_OFF, emoji: '🌱🌱' })).toBe(true);
	});

	it('un campo vaciado cuenta aunque sea inválido, y solo espacios es vaciarlo', () => {
		expect(doesChange(ONE_OFF, { ...ONE_OFF, title: '' })).toBe(true);
		expect(doesChange(ONE_OFF, { ...ONE_OFF, title: '   ' })).toBe(true);
		expect(doesChange(ONE_OFF, { ...ONE_OFF, note: '' })).toBe(true);
		expect(doesChange(ONE_OFF, { ...ONE_OFF, note: '   ' })).toBe(true);
	});

	it('sin el campo y el campo vacío son lo mismo', () => {
		expect(doesChange({ shape: 'puntual', title: 'Pagar' }, { shape: 'puntual', title: 'Pagar', emoji: '', note: '', schedule: undefined, dueDate: undefined })).toBe(false);
	});

	it('los valores con que el panel abre una tarea coinciden con el formulario recién abierto', () => {
		const task: Task = { id: 't', title: 'Pagar', kind: 'puntual', dueDate: new Date(2026, 6, 20), createdAt: CREATED };
		expect(doesChange(taskData(task), { shape: 'puntual', title: 'Pagar', emoji: '', note: '', schedule: undefined, dueDate: '2026-07-20' })).toBe(false);
	});

	describe('Se repite', () => {
		it('otra opción es un cambio, aunque sus campos estén vacíos', () => {
			expect(doesChange(ONE_OFF, { ...ONE_OFF, shape: 'relativa', every: Number.NaN, unit: 'horas' })).toBe(true);
			expect(doesChange(RELATIVE, { shape: 'puntual', title: 'Regar' })).toBe(true);
			expect(doesChange(WEEKLY, { ...WEEKLY, weekdays: [], monthDays: [1] })).toBe(true);
		});

		it('otro valor de sus campos es un cambio', () => {
			expect(doesChange(RELATIVE, { ...RELATIVE, every: 3 } as TaskData)).toBe(true);
			expect(doesChange(RELATIVE, { ...RELATIVE, unit: 'horas' } as TaskData)).toBe(true);
			expect(doesChange(RELATIVE, { ...RELATIVE, every: Number.NaN } as TaskData)).toBe(true);
			expect(doesChange(ONE_OFF, { ...ONE_OFF, dueDate: '2026-07-20' } as TaskData)).toBe(true);
			expect(doesChange(WEEKLY, { ...WEEKLY, weekdays: ['lunes'] } as TaskData)).toBe(true);
		});

		it('una fecha a medio escribir es un cambio aunque tenga valor vacío', () => {
			expect(doesChange(ONE_OFF, { ...ONE_OFF, dueDate: '' } as TaskData)).toBe(true);
		});

		it('los días son un conjunto: el orden en que se tocaron no cuenta', () => {
			expect(doesChange(WEEKLY, { ...WEEKLY, weekdays: ['jueves', 'lunes'] } as TaskData)).toBe(false);
			const monthly: TaskData = { shape: 'calendario', title: 'Regar', weekdays: [], monthDays: [1, 15] };
			expect(doesChange(monthly, { ...monthly, monthDays: [15, 1] })).toBe(false);
		});

		it('un formulario inválido sin tocar no es un cambio', () => {
			const withoutEvery: TaskData = { ...RELATIVE, every: Number.NaN } as TaskData;
			expect(doesChange(withoutEvery, { ...withoutEvery })).toBe(false);
		});
	});

	describe('Horario', () => {
		it('intercambiar dos ventanas no cambia nada: Guardar las ordena', () => {
			const [first, second] = WITH_SCHEDULES.schedule!;
			expect(doesChange(WITH_SCHEDULES, { ...WITH_SCHEDULES, schedule: [second, first] })).toBe(false);
		});

		it('cambiar una ventana sí', () => {
			const [first] = WITH_SCHEDULES.schedule!;
			expect(doesChange(WITH_SCHEDULES, { ...WITH_SCHEDULES, schedule: [first, { from: '12:00', to: '15:00' }] })).toBe(true);
		});

		it('una fila vacía cuenta aunque sea inválida', () => {
			expect(doesChange(WITH_SCHEDULES, { ...WITH_SCHEDULES, schedule: [...WITH_SCHEDULES.schedule!, { from: '', to: '' }] })).toBe(true);
			expect(doesChange(ONE_OFF, { ...ONE_OFF, schedule: [{ from: '', to: '' }] })).toBe(true);
		});

		it('apagar el horario es un cambio; sin ventanas es lo mismo que sin horario', () => {
			expect(doesChange(WITH_SCHEDULES, { ...WITH_SCHEDULES, schedule: undefined })).toBe(true);
			expect(doesChange(ONE_OFF, { ...ONE_OFF, schedule: [] })).toBe(false);
		});

		it('varias ventanas en una relativa en horas se miden igual, aunque Guardar las rechace', () => {
			const inHours = { shape: 'relativa', title: 'Regar', every: 2, unit: 'horas', schedule: WITH_SCHEDULES.schedule } as TaskData;
			expect(doesChange(inHours, { ...inHours })).toBe(false);
		});
	});

	describe('Etiquetas', () => {
		const withLabels = (onOpen: readonly string[], labels: readonly string[]) => hasChanges(open(ONE_OFF, onOpen), { data: ONE_OFF, labels, unconfirmed: '' });

		it('agregar o quitar una etiqueta es un cambio', () => {
			expect(withLabels([], ['casa'])).toBe(true);
			expect(withLabels(['casa'], [])).toBe(true);
			expect(withLabels(['casa'], ['auto'])).toBe(true);
		});

		it('agregarla y quitarla, cambiarlas de orden o de mayúsculas no cambia nada', () => {
			expect(withLabels(['casa', 'auto'], ['auto', 'casa'])).toBe(false);
			expect(withLabels(['casa'], ['Casa'])).toBe(false);
		});
	});

	describe('Texto sin confirmar en Etiquetas (única excepción)', () => {
		it('cuenta aunque Guardar no cambie nada por él', () => {
			expect(doesChange(ONE_OFF, ONE_OFF, 'casa')).toBe(true);
			expect(doesChange(ONE_OFF, ONE_OFF, '  casa  ')).toBe(true);
		});

		it('solo espacios no cuenta', () => {
			expect(doesChange(ONE_OFF, ONE_OFF, '   ')).toBe(false);
		});
	});

	describe('Al crear', () => {
		it('se mide contra No se repite, la opción que viene elegida (S23, S5)', () => {
			const interval: TaskData = { ...ON_CREATE, shape: 'relativa', every: Number.NaN, unit: 'horas' };
			expect(doesChange(DATA_ON_CREATE, ON_CREATE)).toBe(false);
			expect(doesChange(DATA_ON_CREATE, interval)).toBe(true);
		});

		it('el formulario como se abrió, o con solo espacios, no es un cambio', () => {
			expect(doesChange(ON_CREATE, ON_CREATE)).toBe(false);
			expect(doesChange(ON_CREATE, { ...ON_CREATE, title: '   ' })).toBe(false);
			expect(doesChange(ON_CREATE, { ...ON_CREATE, note: '   ' })).toBe(false);
			expect(doesChange(ON_CREATE, ON_CREATE, '   ')).toBe(false);
		});

		it('cargar cualquier campo es un cambio', () => {
			expect(doesChange(ON_CREATE, { ...ON_CREATE, title: 'Pagar' })).toBe(true);
			expect(doesChange(ON_CREATE, { ...ON_CREATE, effort: 'media' })).toBe(true);
			expect(doesChange(ON_CREATE, { ...ON_CREATE, shape: 'relativa', every: Number.NaN, unit: 'horas' })).toBe(true);
			expect(doesChange(ON_CREATE, ON_CREATE, 'casa')).toBe(true);
		});
	});

	it('se mide contra los valores al abrir, no contra los de otro dispositivo', () => {
		const remote: Task = { id: 't', title: 'Pagar luz', note: 'Luz', kind: 'puntual', createdAt: CREATED };
		expect(doesChange(ONE_OFF, taskData(remote))).toBe(true);
		expect(doesChange(ONE_OFF, ONE_OFF)).toBe(false);
	});
});
