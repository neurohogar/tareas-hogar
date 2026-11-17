// Spec §6.2: panel en pestañas.
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

describe('presentacionDelPanel (propiedades)', () => {
	it('es en pestañas exactamente hasta 40rem inclusive y es monótona', () => {
		fc.assert(
			fc.property(fc.double({ min: 0, max: 200, noNaN: true }), fc.double({ min: 0, max: 200, noNaN: true }), (a, b) => {
				expect(panelPresentation(a) === 'pestanas').toBe(a <= 40);
				if (a <= b && panelPresentation(b) === 'pestanas') expect(panelPresentation(a)).toBe('pestanas');
			})
		);
	});
});

describe('seccionesDelPanel (propiedades)', () => {
	it('al editar son las de crear más Acciones, sin repetir', () => {
		expect(panelSections('editar')).toEqual([...panelSections('crear'), 'Acciones']);
	});
});

describe('seccionesMarcadas (propiedades)', () => {
	it('no depende del orden ni de repeticiones, y sigue el orden de las pestañas', () => {
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

	it('nunca marca Acciones', () => {
		fc.assert(fc.property(fields, (c) => {
			expect(markedSections(c)).not.toContain('Acciones');
		}));
	});
});

describe('destinoAlFallarGuardar (propiedades)', () => {
	it('apunta al primer campo en orden de lectura, sin importar el orden recibido', () => {
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

	it('la pestaña existe solo en pestañas y es la primera marcada (Tarea antes que Cuándo)', () => {
		fc.assert(
			fc.property(fields, (c) => {
				expect(destinationOnSaveFailure(c, 'secciones')?.tab).toBeUndefined();
				expect(destinationOnSaveFailure(c, 'pestanas')?.tab).toBe(markedSections(c)[0]);
			})
		);
	});
});

describe('camposConError (propiedades)', () => {
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

	it('es un subconjunto sin repetidos de los campos, en orden de lectura', () => {
		fc.assert(
			fc.property(errors, repetition, (e, r) => {
				const result = fieldsWithError(e, r);
				expect(result).toEqual(FIELDS.filter((c) => result.includes(c)));
			})
		);
	});

	it('los campos de las otras opciones de Se repite nunca cuentan', () => {
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

describe('barraDeGuardarVisible (propiedades)', () => {
	it('es la negación del teclado abierto', () => {
		fc.assert(fc.property(fc.boolean(), (t) => {
			expect(saveBarVisible(t)).toBe(!t);
		}));
	});
});

describe('repeticionAlAbrir: propiedades (spec §6.2, S23)', () => {
	it('al crear abre en No se repite, y es la opción que corresponde a los datos de la tarea al editar', () => {
		expect(repetitionOnOpen()).toBe('puntual');
		fc.assert(
			fc.property(fc.constantFrom('puntual' as const, 'relativa' as const), (shape) => {
				const data = shape === 'puntual' ? { shape, title: 't' } : { shape, title: 't', every: 1, unit: 'dias' as const };
				expect(repetitionOnOpen(data)).toBe(shape === 'puntual' ? 'puntual' : 'relativo');
			})
		);
	});
});
