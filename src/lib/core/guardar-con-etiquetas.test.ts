import { describe, expect, it } from 'vitest';
import type { DatosDeTarea } from './datos-de-tarea';
import type { Etiqueta } from './etiqueta';
import { crearConEtiquetas, editarConEtiquetas } from './guardar-con-etiquetas';
import type { TareaPuntual } from './tarea';

const AHORA = new Date(2026, 6, 15, 8, 0, 0);
const COCINA: Etiqueta = { id: 'e1', nombre: 'Cocina', color: 'gris' };
const BANO: Etiqueta = { id: 'e2', nombre: 'Baño', color: 'rojo' };
const PAGAR: TareaPuntual = { id: 't1', titulo: 'Pagar', tipo: 'puntual', creadaEn: AHORA };
const DATOS: DatosDeTarea = { forma: 'puntual', titulo: 'Pagar' };

const ids = (...lista: string[]) => () => lista.shift() as string;

describe('crearConEtiquetas', () => {
	it('crea la tarea con sus etiquetas y las nuevas', () => {
		const resultado = crearConEtiquetas(DATOS, ['Patio', 'cocina'], 't1', AHORA, { existentes: [COCINA], nuevoId: ids('e9') });

		expect(resultado).toStrictEqual({
			ok: true,
			tarea: { ...PAGAR, etiquetas: ['e9', 'e1'] },
			nuevas: [{ id: 'e9', nombre: 'Patio', color: 'rojo' }]
		});
	});

	it('sin etiquetas, la tarea queda sin el campo', () => {
		expect(crearConEtiquetas(DATOS, [], 't1', AHORA, { existentes: [], nuevoId: ids() })).toStrictEqual({ ok: true, tarea: PAGAR, nuevas: [] });
	});

	it('un nombre de etiqueta inválido rechaza la creación entera, junto con los otros errores', () => {
		const resultado = crearConEtiquetas({ forma: 'puntual', titulo: ' ' }, ['x'.repeat(31)], 't1', AHORA, { existentes: [], nuevoId: ids('e9') });

		expect(resultado).toStrictEqual({ ok: false, errores: { titulo: 'vacio', etiquetas: 'largo' } });
	});
});

describe('editarConEtiquetas', () => {
	const contexto = { existentes: [COCINA, BANO], nuevoId: ids('e9') };

	it('reemplaza las etiquetas de la tarea por las escritas', () => {
		const resultado = editarConEtiquetas({ ...PAGAR, etiquetas: ['e1'] }, DATOS, ['Baño', 'Patio'], contexto);

		expect(resultado).toStrictEqual({
			ok: true,
			cambio: { etiquetas: ['e2', 'e9'] },
			nuevas: [{ id: 'e9', nombre: 'Patio', color: 'naranja' }]
		});
	});

	it('las mismas etiquetas, en otro orden, no son un cambio', () => {
		const resultado = editarConEtiquetas({ ...PAGAR, etiquetas: ['e1', 'e2'] }, DATOS, ['Baño', 'Cocina'], contexto);

		expect(resultado).toStrictEqual({ ok: true, cambio: {}, nuevas: [] });
	});

	it('quitar todas es un cambio a ninguna', () => {
		expect(editarConEtiquetas({ ...PAGAR, etiquetas: ['e1'] }, DATOS, [], contexto)).toStrictEqual({ ok: true, cambio: { etiquetas: [] }, nuevas: [] });
	});

	it('una tarea sin el campo y sin etiquetas escritas no cambia', () => {
		expect(editarConEtiquetas(PAGAR, DATOS, [], contexto)).toStrictEqual({ ok: true, cambio: {}, nuevas: [] });
	});

	it('se combina con los cambios de los otros campos', () => {
		const resultado = editarConEtiquetas(PAGAR, { ...DATOS, titulo: 'Pagar la luz' }, ['Cocina'], contexto);

		expect(resultado).toStrictEqual({ ok: true, cambio: { titulo: 'Pagar la luz', etiquetas: ['e1'] }, nuevas: [] });
	});

	it('un error en otro campo rechaza la edición entera: no se crea ninguna etiqueta', () => {
		expect(editarConEtiquetas(PAGAR, { ...DATOS, titulo: '' }, ['Patio'], contexto)).toStrictEqual({ ok: false, errores: { titulo: 'vacio' } });
	});

	it('un nombre de etiqueta vacío rechaza la edición entera', () => {
		expect(editarConEtiquetas(PAGAR, DATOS, ['  '], contexto)).toStrictEqual({ ok: false, errores: { etiquetas: 'vacio' } });
	});
});

describe('editarConEtiquetas de una pausada (spec §5.8)', () => {
	it('pasarla a puntual la reanuda en ese momento', () => {
		const pausada = { id: 't2', titulo: 'Regar', tipo: 'periodica', recurrencia: { modo: 'relativo', cada: 2, unidad: 'dias' }, creadaEn: AHORA, pausada: true } as const;
		const resultado = editarConEtiquetas({ ...pausada }, DATOS, [], { existentes: [], nuevoId: ids() }, AHORA);

		expect(resultado.ok && resultado.cambio).toMatchObject({ pausada: null, reanudadaEn: AHORA });
	});
});
