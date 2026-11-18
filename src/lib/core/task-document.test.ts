import { describe, expect, it } from 'vitest';
import { applyChange, taskFromDocument, type TaskDocument } from './task-document';
import type { Recurrence } from './task';

const CREATED = new Date(2026, 6, 1, 8, 0, 0);
const RELATIVE = { mode: 'relativo', every: 2, unit: 'dias' } as const;
const LIMIT = new Date(2026, 6, 14);

const ONE_OFF: TaskDocument = { id: 't1', title: 'Pagar', kind: 'puntual', dueDate: LIMIT, createdAt: CREATED };
const RECURRING: TaskDocument = { id: 't2', title: 'Regar', kind: 'periodica', recurrence: RELATIVE, createdAt: CREATED };

describe('taskFromDocument', () => {
	it('a one-off keeps its due date and ignores a recurrence that does not apply to it', () => {
		expect(taskFromDocument({ ...ONE_OFF, recurrence: RELATIVE })).toStrictEqual(ONE_OFF);
	});

	it('a one-off without a due date ends up without the field', () => {
		const { dueDate: _, ...withoutLimit } = ONE_OFF;

		expect(taskFromDocument(withoutLimit)).toStrictEqual(withoutLimit);
	});

	it('a recurring task keeps its recurrence and ignores a due date that does not apply to it', () => {
		expect(taskFromDocument({ ...RECURRING, dueDate: LIMIT })).toStrictEqual(RECURRING);
	});

	it('both shapes keep their emoji and their note', () => {
		const fields = { emoji: '🌱', note: 'Usar guantes' };

		expect(taskFromDocument({ ...ONE_OFF, ...fields })).toStrictEqual({ ...ONE_OFF, ...fields });
		expect(taskFromDocument({ ...RECURRING, ...fields })).toStrictEqual({ ...RECURRING, ...fields });
	});

	it('a recurring task without a recurrence violates the model', () => {
		const { recurrence: _, ...withoutRecurrence } = RECURRING;

		expect(() => taskFromDocument(withoutRecurrence)).toThrow();
	});
});

describe('applyChange', () => {
	it('writes only the fields of the change and leaves the others', () => {
		const [editedDocument] = applyChange([ONE_OFF], 't1', { title: 'Pagar la luz' });

		expect(editedDocument).toStrictEqual({ ...ONE_OFF, title: 'Pagar la luz' });
	});

	it('a field set to null is removed from the document', () => {
		const [editedDocument] = applyChange([ONE_OFF], 't1', { kind: 'periodica', recurrence: RELATIVE, dueDate: null });

		expect(editedDocument).toStrictEqual({ id: 't1', title: 'Pagar', kind: 'periodica', recurrence: RELATIVE, createdAt: CREATED });
	});

	it('the recurrence is replaced whole, without mixing subfields', () => {
		const weekly: Recurrence = { mode: 'calendario', weekdays: ['martes'] };
		const [editedDocument] = applyChange([RECURRING], 't2', { recurrence: weekly });

		expect(editedDocument.recurrence).toStrictEqual(weekly);
	});

	it('only the document of that task changes', () => {
		expect(applyChange([ONE_OFF, RECURRING], 't2', { title: 'Otro' })[0]).toBe(ONE_OFF);
	});

	it('deletion wins: a change on a task that does not exist does not create it', () => {
		expect(applyChange([ONE_OFF], 'borrada', { title: 'Revivida' })).toStrictEqual([ONE_OFF]);
	});

	it('does not modify the original document', () => {
		applyChange([ONE_OFF], 't1', { title: 'Otro', dueDate: null });

		expect(ONE_OFF).toStrictEqual({ id: 't1', title: 'Pagar', kind: 'puntual', dueDate: LIMIT, createdAt: CREATED });
	});
});

describe('applyChange with emoji and note', () => {
	it('writes the emoji and the note, and null removes them', () => {
		const withFields = applyChange([ONE_OFF], 't1', { emoji: '🌱', note: 'Hola' });

		expect(withFields[0]).toStrictEqual({ ...ONE_OFF, emoji: '🌱', note: 'Hola' });
		expect(applyChange(withFields, 't1', { emoji: null, note: null })[0]).toStrictEqual(ONE_OFF);
	});

	it('a note change does not touch the emoji', () => {
		expect(applyChange([{ ...ONE_OFF, emoji: '🌱' }], 't1', { note: 'Hola' })[0]).toStrictEqual({ ...ONE_OFF, emoji: '🌱', note: 'Hola' });
	});
});

describe('taskFromDocument and applyChange with pause (spec §5.8, §7)', () => {
	const RESUMED = new Date(2026, 6, 15, 10, 0, 0);

	it('a recurring task keeps paused and resumedAt', () => {
		const doc = { ...RECURRING, paused: true, resumedAt: RESUMED };

		expect(taskFromDocument(doc)).toStrictEqual(doc);
	});

	it('a one-off ignores paused and resumedAt', () => {
		expect(taskFromDocument({ ...ONE_OFF, paused: true, resumedAt: RESUMED })).toStrictEqual(ONE_OFF);
	});

	it('resuming removes paused and stores resumedAt; pausing on another device afterwards leaves it paused', () => {
		const paused = { ...RECURRING, paused: true };
		const resumed = applyChange([paused], 't2', { paused: null, resumedAt: RESUMED });

		expect(resumed).toStrictEqual([{ ...RECURRING, resumedAt: RESUMED }]);
		expect(applyChange(resumed, 't2', { paused: true })).toStrictEqual([{ ...RECURRING, resumedAt: RESUMED, paused: true }]);
	});
});

describe('postponed in the document (spec §4.1, §7)', () => {
	const FIRST = { from: new Date(2026, 6, 15, 10, 0, 0), to: new Date(2026, 6, 15, 13, 0, 0) };
	const SECOND = { from: new Date(2026, 6, 15, 10, 5, 0), to: new Date(2026, 6, 15, 11, 5, 0) };

	it.each([
		['una puntual', ONE_OFF],
		['una periódica', RECURRING]
	])('%s conserva pospuesta', (_, doc) => {
		expect(taskFromDocument({ ...doc, postponed: FIRST }).postponed).toStrictEqual(FIRST);
	});

	it('without postponed, the task ends up without the field', () => {
		expect(taskFromDocument(ONE_OFF)).not.toHaveProperty('postponed');
	});

	it('it is a single field: the last change stays whole, without mixing from and to', () => {
		const [doc] = applyChange([{ ...ONE_OFF, postponed: FIRST }], ONE_OFF.id, { postponed: SECOND });

		expect(doc.postponed).toStrictEqual(SECOND);
	});

	it('with null, it is removed from the document', () => {
		const [doc] = applyChange([{ ...ONE_OFF, postponed: FIRST }], ONE_OFF.id, { postponed: null });

		expect(doc).not.toHaveProperty('postponed');
	});
});

describe('data no longer used (spec §7)', () => {
	/** A document stored before removing the labels and the effort: the old fields are still there. */
	const withOldFields = (doc: TaskDocument) => ({ ...doc, esfuerzo: 'rapida', etiquetas: ['e1', 'e2'] }) as TaskDocument;

	it('the task does not read effort or labels', () => {
		expect(taskFromDocument(withOldFields(ONE_OFF))).toStrictEqual(taskFromDocument(ONE_OFF));
		expect(taskFromDocument(withOldFields(RECURRING))).toStrictEqual(taskFromDocument(RECURRING));
	});

	it('an edit leaves them intact', () => {
		const [edited] = applyChange([withOldFields(ONE_OFF)], 't1', { title: 'Pagar la luz', note: 'Antes del 10' });

		expect(edited).toStrictEqual(withOldFields({ ...ONE_OFF, title: 'Pagar la luz', note: 'Antes del 10' }));
	});

	it('a kind change removes only the kind fields', () => {
		const [changed] = applyChange([withOldFields(ONE_OFF)], 't1', { kind: 'periodica', dueDate: null, recurrence: RELATIVE });
		const { dueDate: _, ...withoutDueDate } = ONE_OFF;

		expect(changed).toStrictEqual(withOldFields({ ...withoutDueDate, kind: 'periodica', recurrence: RELATIVE }));
	});
});
