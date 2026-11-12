// Spec §6.2: panel en pestañas.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
	barraDeGuardarVisible,
	camposConError,
	destinoAlFallarGuardar,
	presentacionDelPanel,
	repeticionAlAbrir,
	seccionesDelPanel,
	seccionesMarcadas,
	type CampoConError,
	type OpcionDeRepeticion
} from './panel-en-pestanas';

const CAMPOS: CampoConError[] = ['Título', 'Etiquetas', 'fecha límite', 'Cada', 'días', 'horario'];
const campos = fc.subarray(CAMPOS).chain((subconjunto) => fc.shuffledSubarray(subconjunto));
const presentacion = fc.constantFrom('pestanas' as const, 'secciones' as const);
const repeticion = fc.constantFrom<OpcionDeRepeticion>('puntual', 'relativo', 'semanal', 'mensual');

describe('presentacionDelPanel (propiedades)', () => {
	it('es en pestañas exactamente hasta 40rem inclusive y es monótona', () => {
		fc.assert(
			fc.property(fc.double({ min: 0, max: 200, noNaN: true }), fc.double({ min: 0, max: 200, noNaN: true }), (a, b) => {
				expect(presentacionDelPanel(a) === 'pestanas').toBe(a <= 40);
				if (a <= b && presentacionDelPanel(b) === 'pestanas') expect(presentacionDelPanel(a)).toBe('pestanas');
			})
		);
	});
});

describe('seccionesDelPanel (propiedades)', () => {
	it('al editar son las de crear más Acciones, sin repetir', () => {
		expect(seccionesDelPanel('editar')).toEqual([...seccionesDelPanel('crear'), 'Acciones']);
	});
});

describe('seccionesMarcadas (propiedades)', () => {
	it('no depende del orden ni de repeticiones, y sigue el orden de las pestañas', () => {
		fc.assert(
			fc.property(campos, (c) => {
				const marcadas = seccionesMarcadas(c);
				expect(seccionesMarcadas([...c].reverse())).toEqual(marcadas);
				expect(seccionesMarcadas([...c, ...c])).toEqual(marcadas);
				expect(marcadas).toEqual(seccionesDelPanel('editar').filter((s) => marcadas.includes(s)));
				expect(marcadas.length === 0).toBe(c.length === 0);
			})
		);
	});

	it('nunca marca Acciones', () => {
		fc.assert(fc.property(campos, (c) => {
			expect(seccionesMarcadas(c)).not.toContain('Acciones');
		}));
	});
});

describe('destinoAlFallarGuardar (propiedades)', () => {
	it('apunta al primer campo en orden de lectura, sin importar el orden recibido', () => {
		fc.assert(
			fc.property(campos, presentacion, (c, p) => {
				const destino = destinoAlFallarGuardar(c, p);
				if (c.length === 0) {
					expect(destino).toBeUndefined();
					return;
				}
				expect(destino?.campo).toBe(CAMPOS.find((campo) => c.includes(campo)));
				expect(destinoAlFallarGuardar([...c].reverse(), p)).toEqual(destino);
			})
		);
	});

	it('la pestaña existe solo en pestañas y es la primera marcada (Tarea antes que Cuándo)', () => {
		fc.assert(
			fc.property(campos, (c) => {
				expect(destinoAlFallarGuardar(c, 'secciones')?.pestana).toBeUndefined();
				expect(destinoAlFallarGuardar(c, 'pestanas')?.pestana).toBe(seccionesMarcadas(c)[0]);
			})
		);
	});
});

describe('camposConError (propiedades)', () => {
	const errores = fc.record(
		{
			titulo: fc.constant('vacio' as const),
			cada: fc.constant('invalido' as const),
			dias: fc.constantFrom('faltan' as const, 'combinados' as const),
			fechaLimite: fc.constant('invalida' as const),
			horario: fc.constant('incompleto' as const)
		},
		{ requiredKeys: [] }
	);

	it('es un subconjunto sin repetidos de los campos, en orden de lectura', () => {
		fc.assert(
			fc.property(errores, repeticion, fc.boolean(), (e, r, et) => {
				const resultado = camposConError(e, r, et);
				expect(resultado).toEqual(CAMPOS.filter((c) => resultado.includes(c)));
				expect(resultado.includes('Etiquetas')).toBe(et);
			})
		);
	});

	it('los campos de las otras opciones de Se repite nunca cuentan', () => {
		fc.assert(
			fc.property(errores, repeticion, (e, r) => {
				const resultado = camposConError(e, r, false);
				expect(resultado.includes('fecha límite')).toBe(r === 'puntual' && e.fechaLimite !== undefined);
				expect(resultado.includes('Cada')).toBe(r === 'relativo' && e.cada !== undefined);
				expect(resultado.includes('días')).toBe((r === 'semanal' || r === 'mensual') && e.dias !== undefined);
			})
		);
	});
});

describe('barraDeGuardarVisible (propiedades)', () => {
	it('es la negación del teclado abierto', () => {
		fc.assert(fc.property(fc.boolean(), (t) => {
			expect(barraDeGuardarVisible(t)).toBe(!t);
		}));
	});
});

describe('repeticionAlAbrir: propiedades (spec §6.2, S23)', () => {
	it('al crear abre en No se repite, y es la opción que corresponde a los datos de la tarea al editar', () => {
		expect(repeticionAlAbrir()).toBe('puntual');
		fc.assert(
			fc.property(fc.constantFrom('puntual' as const, 'relativa' as const), (forma) => {
				const datos = forma === 'puntual' ? { forma, titulo: 't' } : { forma, titulo: 't', cada: 1, unidad: 'dias' as const };
				expect(repeticionAlAbrir(datos)).toBe(forma === 'puntual' ? 'puntual' : 'relativo');
			})
		);
	});
});
