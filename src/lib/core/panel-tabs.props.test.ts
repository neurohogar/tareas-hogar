// Spec §6.2: panel in tabs.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
	saveBarVisible,
	fieldsWithError,
	destinationOnSaveFailure,
	panelPresentation,
	repetitionOnOpen,
	panelSections,
	markedSections,
	type FieldWithError,
	type RepetitionOption
} from './panel-tabs';

const FIELDS: FieldWithError[] = ['Título', 'fecha límite', 'Cada', 'días', 'horario'];
const fields = fc.subarray(FIELDS).chain((subset) => fc.shuffledSubarray(subset));
const presentation = fc.constantFrom('pestanas' as const, 'secciones' as const);
const repetition = fc.constantFrom<RepetitionOption>('puntual', 'relativo', 'semanal', 'mensual');

describe('panelPresentation (properties)', () => {
	it('is in tabs exactly up to 40rem inclusive and is monotonic', () => {
		fc.assert(
			fc.property(fc.double({ min: 0, max: 200, noNaN: true }), fc.double({ min: 0, max: 200, noNaN: true }), (a, b) => {
				expect(panelPresentation(a) === 'pestanas').toBe(a <= 40);
				if (a <= b && panelPresentation(b) === 'pestanas') expect(panelPresentation(a)).toBe('pestanas');
			})
		);
	});
});

describe('panelSections (properties)', () => {
	it('when editing they are those of creating plus Acciones, without repeating', () => {
		expect(panelSections('editar')).toEqual([...panelSections('crear'), 'Acciones']);
	});
});

describe('markedSections (properties)', () => {
	it('does not depend on order or repetitions, and follows the tab order', () => {
		fc.assert(
			fc.property(fields, (c) => {
				const marked = markedSections(c);
				expect(markedSections([...c].reverse())).toEqual(marked);
				expect(markedSections([...c, ...c])).toEqual(marked);
				expect(marked).toEqual(panelSections('editar').filter((s) => marked.includes(s)));
				expect(marked.length === 0).toBe(c.length === 0);
			})
		);
	});

	it('never marks Acciones', () => {
		fc.assert(fc.property(fields, (c) => {
			expect(markedSections(c)).not.toContain('Acciones');
		}));
	});
});

describe('destinationOnSaveFailure (properties)', () => {
	it('points to the first field in reading order, regardless of the order received', () => {
		fc.assert(
			fc.property(fields, presentation, (c, p) => {
				const destination = destinationOnSaveFailure(c, p);
				if (c.length === 0) {
					expect(destination).toBeUndefined();
					return;
				}
				expect(destination?.field).toBe(FIELDS.find((field) => c.includes(field)));
				expect(destinationOnSaveFailure([...c].reverse(), p)).toEqual(destination);
			})
		);
	});

	it('the tab exists only in tabs and is the first marked one (Tarea before Cuándo)', () => {
		fc.assert(
			fc.property(fields, (c) => {
				expect(destinationOnSaveFailure(c, 'secciones')?.tab).toBeUndefined();
				expect(destinationOnSaveFailure(c, 'pestanas')?.tab).toBe(markedSections(c)[0]);
			})
		);
	});
});

describe('fieldsWithError (properties)', () => {
	const errors = fc.record(
		{
			title: fc.constant('vacio' as const),
			every: fc.constant('invalido' as const),
			days: fc.constantFrom('faltan' as const, 'combinados' as const),
			dueDate: fc.constant('invalida' as const),
			schedule: fc.constant('incompleto' as const)
		},
		{ requiredKeys: [] }
	);

	it('is a subset without repeats of the fields, in reading order', () => {
		fc.assert(
			fc.property(errors, repetition, (e, r) => {
				const result = fieldsWithError(e, r);
				expect(result).toEqual(FIELDS.filter((c) => result.includes(c)));
			})
		);
	});

	it('the fields of the other Se repite options never count', () => {
		fc.assert(
			fc.property(errors, repetition, (e, r) => {
				const result = fieldsWithError(e, r);
				expect(result.includes('fecha límite')).toBe(r === 'puntual' && e.dueDate !== undefined);
				expect(result.includes('Cada')).toBe(r === 'relativo' && e.every !== undefined);
				expect(result.includes('días')).toBe((r === 'semanal' || r === 'mensual') && e.days !== undefined);
			})
		);
	});
});

describe('saveBarVisible (properties)', () => {
	it('is the negation of the open keyboard', () => {
		fc.assert(fc.property(fc.boolean(), (t) => {
			expect(saveBarVisible(t)).toBe(!t);
		}));
	});
});

describe('repetitionOnOpen: properties (spec §6.2, S23)', () => {
	it('when creating it opens on No se repite, and is the option matching the task data when editing', () => {
		expect(repetitionOnOpen()).toBe('puntual');
		fc.assert(
			fc.property(fc.constantFrom('puntual' as const, 'relativa' as const), (shape) => {
				const data = shape === 'puntual' ? { shape, title: 't' } : { shape, title: 't', every: 1, unit: 'dias' as const };
				expect(repetitionOnOpen(data)).toBe(shape === 'puntual' ? 'puntual' : 'relativo');
			})
		);
	});
});
