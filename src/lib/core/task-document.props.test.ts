// Spec §7 (Datos que ya no se usan): los campos viejos `etiquetas` y `esfuerzo` de un documento ni se leen ni se tocan.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { applyChange, taskFromDocument, type TaskChange, type TaskDocument } from './task-document';

const RELATIVE = { mode: 'relativo', every: 2, unit: 'dias' } as const;
const base = fc.record({ title: fc.string({ maxLength: 8 }), note: fc.option(fc.string({ maxLength: 8 }), { nil: undefined }) });
const document = base.chain(
	(fields): fc.Arbitrary<TaskDocument> =>
		fc.constantFrom<TaskDocument>(
			{ id: 't', kind: 'puntual', createdAt: new Date(0), ...fields, title: fields.title },
			{ id: 't', kind: 'periodica', createdAt: new Date(0), recurrence: RELATIVE, ...fields, title: fields.title }
		)
);
const oldFields = fc.record({
	esfuerzo: fc.constantFrom('rapida', 'media', 'larga', 42, null),
	etiquetas: fc.oneof(fc.array(fc.string({ maxLength: 4 }), { maxLength: 3 }), fc.constant(null))
});
const withOldFields = (doc: TaskDocument, old: object) => ({ ...doc, ...old }) as TaskDocument;
const change: fc.Arbitrary<TaskChange> = fc.constantFrom<TaskChange>(
	{ title: 'x' },
	{ note: null },
	{ steps: ['a', 'b'], currentStep: 1 },
	{ paused: true },
	{ kind: 'periodica', dueDate: null, recurrence: RELATIVE },
	{ kind: 'puntual', recurrence: null }
);

describe('campos viejos del documento (propiedades, spec §7)', () => {
	it('la tarea que se lee es la misma con o sin ellos', () => {
		fc.assert(
			fc.property(document, oldFields, (doc, old) => {
				expect(taskFromDocument(withOldFields(doc, old))).toStrictEqual(taskFromDocument(doc));
			})
		);
	});

	it('ningún cambio, ni de campos ni de tipo, los quita ni los modifica', () => {
		fc.assert(
			fc.property(document, oldFields, change, (doc, old, aChange) => {
				const [edited] = applyChange([withOldFields(doc, old)], 't', aChange);
				expect(edited).toMatchObject(old);
				expect(Object.keys(edited)).toEqual(expect.arrayContaining(['esfuerzo', 'etiquetas']));
			})
		);
	});

	it('el resto del documento queda igual que sin los campos viejos', () => {
		fc.assert(
			fc.property(document, oldFields, change, (doc, old, aChange) => {
				const [edited] = applyChange([withOldFields(doc, old)], 't', aChange);
				const [clean] = applyChange([doc], 't', aChange);
				expect(edited).toStrictEqual(withOldFields(clean, old));
			})
		);
	});
});
