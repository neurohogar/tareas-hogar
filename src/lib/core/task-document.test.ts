import { describe, expect, it } from 'vitest';
import { applyChange, applyReferenceChanges, taskFromDocument, type TaskDocument } from './task-document';
import type { Recurrence } from './task';

const CREATED = new Date(2026, 6, 1, 8, 0, 0);
const RELATIVE = { mode: 'relativo', every: 2, unit: 'dias' } as const;
const LIMIT = new Date(2026, 6, 14);

const ONE_OFF: TaskDocument = { id: 't1', title: 'Pagar', kind: 'puntual', dueDate: LIMIT, createdAt: CREATED };
const RECURRING: TaskDocument = { id: 't2', title: 'Regar', kind: 'periodica', recurrence: RELATIVE, createdAt: CREATED };

describe('tareaDesdeDocumento', () => {
	it('una puntual conserva su fecha límite e ignora una recurrencia que no le corresponde', () => {
		expect(taskFromDocument({ ...ONE_OFF, recurrence: RELATIVE })).toStrictEqual(ONE_OFF);
	});

	it('una puntual sin fecha límite queda sin el campo', () => {
		const { dueDate: _, ...withoutLimit } = ONE_OFF;

		expect(taskFromDocument(withoutLimit)).toStrictEqual(withoutLimit);
	});

	it('una periódica conserva su recurrencia e ignora una fecha límite que no le corresponde', () => {
		expect(taskFromDocument({ ...RECURRING, dueDate: LIMIT })).toStrictEqual(RECURRING);
	});

	it('las dos formas conservan su emoji y su nota', () => {
		const fields = { emoji: '🌱', note: 'Usar guantes' };

		expect(taskFromDocument({ ...ONE_OFF, ...fields })).toStrictEqual({ ...ONE_OFF, ...fields });
		expect(taskFromDocument({ ...RECURRING, ...fields })).toStrictEqual({ ...RECURRING, ...fields });
	});

	it('las dos formas conservan sus etiquetas', () => {
		expect(taskFromDocument({ ...ONE_OFF, labels: ['e1'] })).toStrictEqual({ ...ONE_OFF, labels: ['e1'] });
		expect(taskFromDocument({ ...RECURRING, labels: ['e1', 'e2'] })).toStrictEqual({ ...RECURRING, labels: ['e1', 'e2'] });
	});

	it('una periódica sin recurrencia viola el modelo', () => {
		const { recurrence: _, ...withoutRecurrence } = RECURRING;

		expect(() => taskFromDocument(withoutRecurrence)).toThrow();
	});
});

describe('aplicarCambio', () => {
	it('escribe solo los campos del cambio y deja los demás', () => {
		const [editedDocument] = applyChange([ONE_OFF], 't1', { title: 'Pagar la luz' });

		expect(editedDocument).toStrictEqual({ ...ONE_OFF, title: 'Pagar la luz' });
	});

	it('un campo en null se quita del documento', () => {
		const [editedDocument] = applyChange([ONE_OFF], 't1', { kind: 'periodica', recurrence: RELATIVE, dueDate: null });

		expect(editedDocument).toStrictEqual({ id: 't1', title: 'Pagar', kind: 'periodica', recurrence: RELATIVE, createdAt: CREATED });
	});

	it('la recurrencia se reemplaza entera, sin mezclar subcampos', () => {
		const weekly: Recurrence = { mode: 'calendario', weekdays: ['martes'] };
		const [editedDocument] = applyChange([RECURRING], 't2', { recurrence: weekly });

		expect(editedDocument.recurrence).toStrictEqual(weekly);
	});

	it('solo cambia el documento de esa tarea', () => {
		expect(applyChange([ONE_OFF, RECURRING], 't2', { title: 'Otro' })[0]).toBe(ONE_OFF);
	});

	it('gana el borrado: un cambio sobre una tarea que no existe no la crea', () => {
		expect(applyChange([ONE_OFF], 'borrada', { title: 'Revivida' })).toStrictEqual([ONE_OFF]);
	});

	it('no modifica el documento original', () => {
		applyChange([ONE_OFF], 't1', { title: 'Otro', dueDate: null });

		expect(ONE_OFF).toStrictEqual({ id: 't1', title: 'Pagar', kind: 'puntual', dueDate: LIMIT, createdAt: CREATED });
	});
});

describe('aplicarCambio con emoji y nota', () => {
	it('escribe el emoji y la nota, y null los quita', () => {
		const withFields = applyChange([ONE_OFF], 't1', { emoji: '🌱', note: 'Hola' });

		expect(withFields[0]).toStrictEqual({ ...ONE_OFF, emoji: '🌱', note: 'Hola' });
		expect(applyChange(withFields, 't1', { emoji: null, note: null })[0]).toStrictEqual(ONE_OFF);
	});

	it('un cambio de nota no toca el emoji', () => {
		expect(applyChange([{ ...ONE_OFF, emoji: '🌱' }], 't1', { note: 'Hola' })[0]).toStrictEqual({ ...ONE_OFF, emoji: '🌱', note: 'Hola' });
	});
});

describe('aplicarCambio con etiquetas', () => {
	it('el campo etiquetas se reemplaza entero: gana el último cambio, sin unir', () => {
		const withKitchen = applyChange([{ ...ONE_OFF, labels: ['cocina'] }], 't1', { labels: ['cocina', 'bano'] });
		const [editedDocument] = applyChange(withKitchen, 't1', { labels: ['cocina', 'patio'] });

		expect(editedDocument.labels).toStrictEqual(['cocina', 'patio']);
	});
});

describe('aplicarCambiosDeReferencias', () => {
	it('quita las etiquetas nombradas de las tareas nombradas y deja sus otras etiquetas', () => {
		const pay = { ...ONE_OFF, labels: ['bano', 'cocina'] };
		const water = { ...RECURRING, labels: ['cocina'] };
		const removeKitchen = (taskId: string) => ({ taskId, remove: ['cocina'], put: [] });

		expect(applyReferenceChanges([pay, water], [removeKitchen('t1'), removeKitchen('t2')])).toStrictEqual([
			{ ...pay, labels: ['bano'] },
			{ ...water, labels: [] }
		]);
	});

	it('pone al final las que no estaban, sin repetir', () => {
		const pay = { ...ONE_OFF, labels: ['b', 'c', 'a'] };

		expect(applyReferenceChanges([pay], [{ taskId: 't1', remove: ['b'], put: ['a', 'd'] }])).toStrictEqual([
			{ ...pay, labels: ['c', 'a', 'd'] }
		]);
	});

	it('no toca las tareas no nombradas, aunque tengan la etiqueta', () => {
		const water = { ...RECURRING, labels: ['cocina'] };

		expect(applyReferenceChanges([water], [{ taskId: 't1', remove: ['cocina'], put: [] }])).toStrictEqual([water]);
	});

	it('una tarea que ya no existe se saltea', () => {
		expect(applyReferenceChanges([ONE_OFF], [{ taskId: 'borrada', remove: [], put: ['a'] }])).toStrictEqual([ONE_OFF]);
	});

	it('aplica en orden varios cambios a la misma tarea', () => {
		const pay = { ...ONE_OFF, labels: ['a'] };
		const changes = [
			{ taskId: 't1', remove: ['a'], put: ['b'] },
			{ taskId: 't1', remove: ['b'], put: ['c'] }
		];

		expect(applyReferenceChanges([pay], changes)).toStrictEqual([{ ...pay, labels: ['c'] }]);
	});
});

describe('tareaDesdeDocumento y aplicarCambio con pausa (spec §5.8, §7)', () => {
	const RESUMED = new Date(2026, 6, 15, 10, 0, 0);

	it('una periódica conserva pausada y reanudadaEn', () => {
		const doc = { ...RECURRING, paused: true, resumedAt: RESUMED };

		expect(taskFromDocument(doc)).toStrictEqual(doc);
	});

	it('una puntual ignora pausada y reanudadaEn', () => {
		expect(taskFromDocument({ ...ONE_OFF, paused: true, resumedAt: RESUMED })).toStrictEqual(ONE_OFF);
	});

	it('reanudar quita pausada y guarda reanudadaEn; pausar en otro dispositivo después la deja pausada', () => {
		const paused = { ...RECURRING, paused: true };
		const resumed = applyChange([paused], 't2', { paused: null, resumedAt: RESUMED });

		expect(resumed).toStrictEqual([{ ...RECURRING, resumedAt: RESUMED }]);
		expect(applyChange(resumed, 't2', { paused: true })).toStrictEqual([{ ...RECURRING, resumedAt: RESUMED, paused: true }]);
	});
});

describe('pospuesta en el documento (spec §4.1, §7)', () => {
	const FIRST = { from: new Date(2026, 6, 15, 10, 0, 0), to: new Date(2026, 6, 15, 13, 0, 0) };
	const SECOND = { from: new Date(2026, 6, 15, 10, 5, 0), to: new Date(2026, 6, 15, 11, 5, 0) };

	it.each([
		['una puntual', ONE_OFF],
		['una periódica', RECURRING]
	])('%s conserva pospuesta', (_, doc) => {
		expect(taskFromDocument({ ...doc, postponed: FIRST }).postponed).toStrictEqual(FIRST);
	});

	it('sin pospuesta, la tarea queda sin el campo', () => {
		expect(taskFromDocument(ONE_OFF)).not.toHaveProperty('postponed');
	});

	it('es un solo campo: el último cambio queda entero, sin mezclar desde y hasta', () => {
		const [doc] = applyChange([{ ...ONE_OFF, postponed: FIRST }], ONE_OFF.id, { postponed: SECOND });

		expect(doc.postponed).toStrictEqual(SECOND);
	});

	it('en null, se quita del documento', () => {
		const [doc] = applyChange([{ ...ONE_OFF, postponed: FIRST }], ONE_OFF.id, { postponed: null });

		expect(doc).not.toHaveProperty('postponed');
	});
});

describe('el esfuerzo en el documento', () => {
	it('las dos formas conservan su esfuerzo', () => {
		expect(taskFromDocument({ ...ONE_OFF, effort: 'rapida' })).toStrictEqual({ ...ONE_OFF, effort: 'rapida' });
		expect(taskFromDocument({ ...RECURRING, effort: 'larga' })).toStrictEqual({ ...RECURRING, effort: 'larga' });
	});

	it('sin el campo, la tarea queda sin estimar', () => {
		expect(taskFromDocument(ONE_OFF)).not.toHaveProperty('effort');
	});

	it('es un campo independiente: se combina con un cambio de título de otro dispositivo (§7)', () => {
		const withEffort: TaskDocument = { ...ONE_OFF, effort: 'media' };
		const [result] = applyChange(applyChange([withEffort], 't1', { title: 'Pagar la luz' }), 't1', { effort: 'rapida' });

		expect(result).toStrictEqual({ ...ONE_OFF, title: 'Pagar la luz', effort: 'rapida' });
	});

	it('el último cambio gana, también si lo quita con null (§7)', () => {
		const withEffort: TaskDocument = { ...ONE_OFF, effort: 'media' };
		const [removed] = applyChange(applyChange([withEffort], 't1', { effort: 'rapida' }), 't1', { effort: null });
		const [updated] = applyChange(applyChange([withEffort], 't1', { effort: null }), 't1', { effort: 'larga' });

		expect(removed).toStrictEqual(ONE_OFF);
		expect(updated).toStrictEqual({ ...ONE_OFF, effort: 'larga' });
	});
});
