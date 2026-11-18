// Spec §6.2 (Editar) and §7 (Conflictos): editing produces a partial change that,
// applied to the stored document, leaves the task that the data describes.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createFromData, taskData, type TaskData } from './task-data';
import { isoDay } from './days';
import { applyChange, taskFromDocument, type TaskChange, type TaskDocument } from './task-document';
import { edit } from './editing';
import { WEEKDAYS, type Recurrence, type Task } from './task';

const ID = 't';
const createdAt = fc.date({ min: new Date(1990, 0, 1), max: new Date(2100, 0, 1), noInvalidDate: true });

/** A title with something more than spaces (with spaces at the ends, which are trimmed). */
const validTitle = fc
	.tuple(fc.string({ maxLength: 3 }).map((s) => s.replace(/\S/g, ' ')), fc.string({ minLength: 1, maxLength: 12 }))
	.filter(([, text]) => text.trim() !== '')
	.map(([spaces, text]) => `${spaces}${text}${spaces}`);
const isoDate = createdAt.map(isoDay);
const unit = fc.constantFrom('horas' as const, 'dias' as const);
/** Weekdays in any order and with repeats: creating saves them as a set. */
const weekdays = fc.array(fc.constantFrom(...WEEKDAYS), { minLength: 1, maxLength: 9 });
const monthDays = fc.array(fc.integer({ min: 1, max: 31 }), { minLength: 1, maxLength: 8 });

const hour = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
const minutesOfDay = fc.integer({ min: 0, max: 1439 });
/** A valid schedule (§4.1), or none. */
const validSchedule = fc.option(
	fc.uniqueArray(minutesOfDay, { minLength: 2, maxLength: 2 }).map(([a, b]) => [{ from: hour(Math.min(a, b)), to: hour(Math.max(a, b)) }]),
	{ nil: undefined }
);
/** Any schedule the panel may write: empty, inverted or equal hours. */
const anySchedule = fc.option(
	fc.record({ from: fc.oneof(minutesOfDay.map(hour), fc.constant('')), to: fc.oneof(minutesOfDay.map(hour), fc.constant('')) }).map((timeWindow) => [timeWindow]),
	{ nil: undefined }
);
const withSchedule = (data: fc.Arbitrary<TaskData>, schedule: typeof anySchedule) =>
	fc.tuple(data, schedule).map(([d, h]): TaskData => ({ ...d, ...(h && { schedule: h }) }));

/** Data that passes the creation validations (§4.1–§4.2), without a schedule. */
const dataWithoutSchedule: fc.Arbitrary<TaskData> = fc.oneof(
	fc.record({ shape: fc.constant('puntual' as const), title: validTitle }),
	fc.record({ shape: fc.constant('puntual' as const), title: validTitle, dueDate: isoDate }),
	fc.record({ shape: fc.constant('relativa' as const), title: validTitle, every: fc.integer({ min: 1, max: 1000 }), unit }),
	fc.record({ shape: fc.constant('calendario' as const), title: validTitle, weekdays, monthDays: fc.constant([]) }),
	fc.record({ shape: fc.constant('calendario' as const), title: validTitle, weekdays: fc.constant([]), monthDays })
);
/** Data that passes the creation validations, with or without a schedule. */
const validData = withSchedule(dataWithoutSchedule, validSchedule);

/** Any data the panel may load, valid or not. */
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
	if (!result.ok) throw new Error('valid data always creates');
	return result.task;
}

/** A stored task, as creating leaves it. */
const task = fc.tuple(validData, createdAt).map(([data, created]) => create(data, created));

function editOk(t: Task, data: TaskData): TaskChange {
	const result = edit(t, data);
	if (!result.ok) throw new Error('valid data always edits');
	return result.change;
}

const apply = (doc: TaskDocument, ...changes: TaskChange[]): TaskDocument =>
	changes.reduce<TaskDocument>((doc, change) => applyChange([doc], doc.id, change)[0], doc);

/** A recurrence of a single mode, with exactly its fields (§7: never mixed by subfield). */
function isRecurrenceOfOneMode(recurrence: Recurrence): boolean {
	const fields = Object.keys(recurrence).sort().join(',');
	return ['every,mode,unit', 'mode,weekdays', 'mode,monthDays'].includes(fields);
}

describe('taskData (properties)', () => {
	it('is the inverse of creating: creating with the data of a task gives the same task', () => {
		fc.assert(
			fc.property(task, (t) => {
				expect(createFromData(taskData(t), t.id, t.createdAt)).toStrictEqual({ ok: true, task: t });
			})
		);
	});
});

describe('edit (properties)', () => {
	it('saving with the values the panel loaded changes no field', () => {
		fc.assert(
			fc.property(task, (t) => {
				expect(editOk(t, taskData(t))).toStrictEqual({});
			})
		);
	});

	it('validates exactly like creating: it is rejected with the same errors', () => {
		fc.assert(
			fc.property(task, anyData, (t, data) => {
				const creation = createFromData(data, t.id, t.createdAt);
				const editing = edit(t, data);
				expect(editing.ok).toBe(creation.ok);
				if (!creation.ok) expect(editing).toStrictEqual(creation);
			})
		);
	});

	it('applied to the document, leaves the task that would be created with that data, with the same id and createdAt', () => {
		fc.assert(
			fc.property(task, validData, (t, data) => {
				const doc = apply(t, editOk(t, data));
				// Strict equality of the document: no field of the other kind, no mixed recurrence.
				expect(doc).toStrictEqual(create(data, t.createdAt));
			})
		);
	});

	it('writes only the fields that changed and, when the kind changes, both kind fields', () => {
		fc.assert(
			fc.property(task, validData, (t, data) => {
				const newLabel = create(data, t.createdAt) as unknown as Record<string, unknown>;
				const before = t as unknown as Record<string, unknown>;
				const change = editOk(t, data);
				const expectedItems = ['title', 'kind', 'dueDate', 'recurrence'].filter(
					(field) => newLabel.kind !== before.kind || JSON.stringify(newLabel[field]) !== JSON.stringify(before[field])
				);
				// The schedule is a common field: it is written only if it changed, also when the kind changes.
				const schedule = JSON.stringify(newLabel.schedule) !== JSON.stringify(before.schedule) ? ['schedule'] : [];
				expect(Object.keys(change).sort()).toEqual(
					[...expectedItems.filter((field) => field !== 'title' || newLabel.title !== before.title), ...schedule].sort()
				);
			})
		);
	});

	it('a written recurrence is always whole and of a single mode', () => {
		fc.assert(
			fc.property(task, validData, (t, data) => {
				const { recurrence } = editOk(t, data);
				if (recurrence) expect(isRecurrenceOfOneMode(recurrence)).toBe(true);
			})
		);
	});

	it('when the kind changes it removes the field of the other kind, even if a concurrent edit left it', () => {
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

	it('two concurrent edits of different fields (the title and the definition) commute', () => {
		fc.assert(
			fc.property(task, validTitle, validData, (t, title, definition) => {
				const c1 = editOk(t, { ...taskData(t), title });
				const c2 = editOk(t, { ...definition, title: t.title });
				expect(apply(t, c2, c1)).toStrictEqual(apply(t, c1, c2));
				expect(taskFromDocument(apply(t, c1, c2))).toStrictEqual(create({ ...definition, title }, t.createdAt));
			})
		);
	});

	it('the last change per field wins', () => {
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

describe('applyChange (properties)', () => {
	const otherOnes = fc.array(task, { maxLength: 3 }).map((ts) => ts.map((t, i) => ({ ...t, id: `otra-${i}` })));

	it('applying the same change twice is like applying it once', () => {
		fc.assert(
			fc.property(task, validData, (t, data) => {
				const change = editOk(t, data);
				expect(apply(t, change, change)).toStrictEqual(apply(t, change));
			})
		);
	});

	it('deletion wins: no change revives a task that no longer exists or touches the others', () => {
		fc.assert(
			fc.property(task, validData, otherOnes, (t, data, docs) => {
				expect(applyChange(docs, t.id, editOk(t, data))).toStrictEqual(docs);
			})
		);
	});

	it('changes only the document of that task', () => {
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
