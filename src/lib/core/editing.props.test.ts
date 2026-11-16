// Spec §6.2 (Editar) y §7 (Conflictos): editar produce un cambio parcial que,
// aplicado al documento guardado, deja la tarea que describen los datos.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createFromData, taskData, type TaskData } from './task-data';
import { isoDay } from './days';
import { applyChange, taskFromDocument, type TaskChange, type TaskDocument } from './task-document';
import { edit } from './editing';
import { WEEKDAYS, type Recurrence, type Task } from './task';

const ID = 't';
const createdAt = fc.date({ min: new Date(1990, 0, 1), max: new Date(2100, 0, 1), noInvalidDate: true });

/** Un título con algo más que espacios (con espacios en los extremos, que se recortan). */
const validTitle = fc
	.tuple(fc.string({ maxLength: 3 }).map((s) => s.replace(/\S/g, ' ')), fc.string({ minLength: 1, maxLength: 12 }))
	.filter(([, text]) => text.trim() !== '')
	.map(([spaces, text]) => `${spaces}${text}${spaces}`);
const isoDate = createdAt.map(isoDay);
const unit = fc.constantFrom('horas' as const, 'dias' as const);
/** Días de la semana en cualquier orden y con repetidos: crear los guarda como conjunto. */
const weekdays = fc.array(fc.constantFrom(...WEEKDAYS), { minLength: 1, maxLength: 9 });
const monthDays = fc.array(fc.integer({ min: 1, max: 31 }), { minLength: 1, maxLength: 8 });

const hour = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
const minutesOfDay = fc.integer({ min: 0, max: 1439 });
/** Un horario válido (§4.1), o ninguno. */
const validSchedule = fc.option(
	fc.uniqueArray(minutesOfDay, { minLength: 2, maxLength: 2 }).map(([a, b]) => [{ from: hour(Math.min(a, b)), to: hour(Math.max(a, b)) }]),
	{ nil: undefined }
);
/** Cualquier horario que escriba el panel: horas vacías, invertidas o iguales. */
const anySchedule = fc.option(
	fc.record({ from: fc.oneof(minutesOfDay.map(hour), fc.constant('')), to: fc.oneof(minutesOfDay.map(hour), fc.constant('')) }).map((timeWindow) => [timeWindow]),
	{ nil: undefined }
);
const withSchedule = (data: fc.Arbitrary<TaskData>, schedule: typeof anySchedule) =>
	fc.tuple(data, schedule).map(([d, h]): TaskData => ({ ...d, ...(h && { schedule: h }) }));

/** Datos que pasan las validaciones de crear (§4.1–§4.2), sin horario. */
const dataWithoutSchedule: fc.Arbitrary<TaskData> = fc.oneof(
	fc.record({ shape: fc.constant('puntual' as const), title: validTitle }),
	fc.record({ shape: fc.constant('puntual' as const), title: validTitle, dueDate: isoDate }),
	fc.record({ shape: fc.constant('relativa' as const), title: validTitle, every: fc.integer({ min: 1, max: 1000 }), unit }),
	fc.record({ shape: fc.constant('calendario' as const), title: validTitle, weekdays, monthDays: fc.constant([]) }),
	fc.record({ shape: fc.constant('calendario' as const), title: validTitle, weekdays: fc.constant([]), monthDays })
);
/** Datos que pasan las validaciones de crear, con o sin horario. */
const validData = withSchedule(dataWithoutSchedule, validSchedule);

/** Cualquier dato que pueda cargar el panel, válido o no. */
const anyData: fc.Arbitrary<TaskData> = withSchedule(
	fc.oneof(
		dataWithoutSchedule,
		fc.record({
			shape: fc.constant('puntual' as const),
			title: fc.string({ maxLength: 4 }),
			dueDate: fc.oneof(isoDate, fc.constantFrom('', '2026-02-30', '2026-13-01', 'mañana'))
		}),
		fc.record({
			shape: fc.constant('relativa' as const),
			title: fc.string({ maxLength: 4 }),
			every: fc.oneof(fc.integer({ min: -3, max: 3 }), fc.double({ noNaN: false })),
			unit
		}),
		fc.record({
			shape: fc.constant('calendario' as const),
			title: fc.string({ maxLength: 4 }),
			weekdays: fc.array(fc.constantFrom(...WEEKDAYS), { maxLength: 3 }),
			monthDays: fc.array(fc.integer({ min: -1, max: 33 }), { maxLength: 3 })
		})
	),
	anySchedule
);

function create(data: TaskData, created: Date): Task {
	const result = createFromData(data, ID, created);
	if (!result.ok) throw new Error('los datos válidos siempre crean');
	return result.task;
}

/** Una tarea guardada, como la deja crear. */
const task = fc.tuple(validData, createdAt).map(([data, created]) => create(data, created));

function editOk(t: Task, data: TaskData): TaskChange {
	const result = edit(t, data);
	if (!result.ok) throw new Error('los datos válidos siempre editan');
	return result.change;
}

const apply = (doc: TaskDocument, ...changes: TaskChange[]): TaskDocument =>
	changes.reduce<TaskDocument>((doc, change) => applyChange([doc], doc.id, change)[0], doc);

/** Una recurrencia de un solo modo, con exactamente sus campos (§7: nunca se mezcla por subcampo). */
function isRecurrenceOfOneMode(recurrence: Recurrence): boolean {
	const fields = Object.keys(recurrence).sort().join(',');
	return ['every,mode,unit', 'mode,weekdays', 'mode,monthDays'].includes(fields);
}

describe('datosDeTarea (propiedades)', () => {
	it('es la inversa de crear: crear con los datos de una tarea da la misma tarea', () => {
		fc.assert(
			fc.property(task, (t) => {
				expect(createFromData(taskData(t), t.id, t.createdAt)).toStrictEqual({ ok: true, task: t });
			})
		);
	});
});

describe('editar (propiedades)', () => {
	it('guardar con los valores que cargó el panel no cambia ningún campo', () => {
		fc.assert(
			fc.property(task, (t) => {
				expect(editOk(t, taskData(t))).toStrictEqual({});
			})
		);
	});

	it('valida exactamente como crear: se rechaza con los mismos errores', () => {
		fc.assert(
			fc.property(task, anyData, (t, data) => {
				const creation = createFromData(data, t.id, t.createdAt);
				const editing = edit(t, data);
				expect(editing.ok).toBe(creation.ok);
				if (!creation.ok) expect(editing).toStrictEqual(creation);
			})
		);
	});

	it('aplicado al documento, deja la tarea que se crearía con esos datos, con el mismo id y creadaEn', () => {
		fc.assert(
			fc.property(task, validData, (t, data) => {
				const doc = apply(t, editOk(t, data));
				// Igualdad estricta del documento: ningún campo del otro tipo, ninguna recurrencia mezclada.
				expect(doc).toStrictEqual(create(data, t.createdAt));
			})
		);
	});

	it('escribe solo los campos que cambiaron y, al cambiar de tipo, los dos campos de tipo', () => {
		fc.assert(
			fc.property(task, validData, (t, data) => {
				const newLabel = create(data, t.createdAt) as unknown as Record<string, unknown>;
				const before = t as unknown as Record<string, unknown>;
				const change = editOk(t, data);
				const expectedItems = ['title', 'kind', 'dueDate', 'recurrence'].filter(
					(field) => newLabel.kind !== before.kind || JSON.stringify(newLabel[field]) !== JSON.stringify(before[field])
				);
				// El horario es un campo común: se escribe solo si cambió, también al cambiar de tipo.
				const schedule = JSON.stringify(newLabel.schedule) !== JSON.stringify(before.schedule) ? ['schedule'] : [];
				expect(Object.keys(change).sort()).toEqual(
					[...expectedItems.filter((field) => field !== 'title' || newLabel.title !== before.title), ...schedule].sort()
				);
			})
		);
	});

	it('una recurrencia escrita es siempre entera y de un solo modo', () => {
		fc.assert(
			fc.property(task, validData, (t, data) => {
				const { recurrence } = editOk(t, data);
				if (recurrence) expect(isRecurrenceOfOneMode(recurrence)).toBe(true);
			})
		);
	});

	it('al cambiar de tipo quita el campo del otro tipo, aunque una edición concurrente lo haya dejado', () => {
		const foreign = { dueDate: new Date(2026, 6, 14), recurrence: { mode: 'relativo', every: 3, unit: 'horas' } } as const;
		fc.assert(
			fc.property(task, validData, (t, data) => {
				const newLabel = create(data, t.createdAt);
				fc.pre(newLabel.kind !== t.kind);
				const withForeignField = { ...t, ...(t.kind === 'puntual' ? { recurrence: foreign.recurrence } : { dueDate: foreign.dueDate }) };
				expect(apply(withForeignField, editOk(t, data))).toStrictEqual(newLabel);
			})
		);
	});

	it('dos ediciones concurrentes de campos distintos (el título y la definición) conmutan', () => {
		fc.assert(
			fc.property(task, validTitle, validData, (t, title, definition) => {
				const c1 = editOk(t, { ...taskData(t), title });
				const c2 = editOk(t, { ...definition, title: t.title });
				expect(apply(t, c2, c1)).toStrictEqual(apply(t, c1, c2));
				expect(taskFromDocument(apply(t, c1, c2))).toStrictEqual(create({ ...definition, title }, t.createdAt));
			})
		);
	});

	it('gana el último cambio por campo', () => {
		fc.assert(
			fc.property(task, validData, validData, (t, data1, data2) => {
				const c2 = editOk(t, data2);
				const doc = apply(t, editOk(t, data1), c2) as unknown as Record<string, unknown>;
				for (const [field, value] of Object.entries(c2)) {
					if (value === null) expect(doc).not.toHaveProperty(field);
					else expect(doc[field]).toStrictEqual(value);
				}
			})
		);
	});
});

describe('aplicarCambio (propiedades)', () => {
	const otherOnes = fc.array(task, { maxLength: 3 }).map((ts) => ts.map((t, i) => ({ ...t, id: `otra-${i}` })));

	it('aplicar el mismo cambio dos veces es como aplicarlo una', () => {
		fc.assert(
			fc.property(task, validData, (t, data) => {
				const change = editOk(t, data);
				expect(apply(t, change, change)).toStrictEqual(apply(t, change));
			})
		);
	});

	it('gana el borrado: ningún cambio revive una tarea que ya no existe ni toca las demás', () => {
		fc.assert(
			fc.property(task, validData, otherOnes, (t, data, docs) => {
				expect(applyChange(docs, t.id, editOk(t, data))).toStrictEqual(docs);
			})
		);
	});

	it('cambia solo el documento de esa tarea', () => {
		fc.assert(
			fc.property(task, validData, otherOnes, (t, data, docs) => {
				const change = editOk(t, data);
				const result = applyChange([...docs, t], t.id, change);
				expect(result.slice(0, -1)).toStrictEqual(docs);
				expect(taskFromDocument(result[result.length - 1])).toStrictEqual(create(data, t.createdAt));
			})
		);
	});
});
