import { describe, expect, it } from 'vitest';
import { crearDesdePanel, editarDesdePanel } from './cambios-sin-guardar-guardado';
import type { DatosDeTarea } from './datos-de-tarea';
import type { Etiqueta } from './etiqueta';
import type { Tarea } from './tarea';

const AHORA = new Date(2026, 6, 15, 8, 0, 0);
const PAGAR: Tarea = { id: 't', titulo: 'Pagar', tipo: 'puntual', creadaEn: AHORA };
const DATOS: DatosDeTarea = { forma: 'puntual', titulo: 'Pagar luz' };
const LARGO = 'abcdefghijklmnopqrstuvwxyz12345';
const CASA: Etiqueta = { id: 'e1', nombre: 'casa', color: 'gris' };
const etiquetas = { existentes: [CASA], nuevoId: () => 'nueva' };

describe('editarDesdePanel (spec §6.2): Guardar con texto sin confirmar en Etiquetas', () => {
	const formulario = (sinConfirmar: string, datos = DATOS) => ({ datos, etiquetas: [], sinConfirmar });

	it('el texto válido no crea la etiqueta ni cambia lo que se guarda', () => {
		const resultado = editarDesdePanel(PAGAR, formulario('auto'), etiquetas, AHORA);
		expect(resultado).toEqual({ ok: true, cambio: { titulo: 'Pagar luz' }, nuevas: [] });
	});

	it('el texto de solo espacios no hace fallar Guardar', () => {
		expect(editarDesdePanel(PAGAR, formulario('   '), etiquetas, AHORA)).toEqual({ ok: true, cambio: { titulo: 'Pagar luz' }, nuevas: [] });
	});

	it('un nombre inválido hace fallar Guardar', () => {
		const resultado = editarDesdePanel(PAGAR, formulario(LARGO), etiquetas, AHORA);
		expect(resultado).toEqual({ ok: false, errores: { etiquetas: 'largo' } });
	});

	it('junta ese error con los de los otros campos', () => {
		const resultado = editarDesdePanel(PAGAR, formulario(LARGO, { forma: 'puntual', titulo: '' }), etiquetas, AHORA);
		expect(resultado).toEqual({ ok: false, errores: { titulo: 'vacio', etiquetas: 'largo' } });
	});

	it('sin texto inválido, los errores son los de Guardar', () => {
		const resultado = editarDesdePanel(PAGAR, formulario('', { forma: 'puntual', titulo: '' }), etiquetas, AHORA);
		expect(resultado).toEqual({ ok: false, errores: { titulo: 'vacio' } });
	});

	it('guarda las etiquetas confirmadas', () => {
		const resultado = editarDesdePanel(PAGAR, { datos: DATOS, etiquetas: ['casa'], sinConfirmar: '' }, etiquetas, AHORA);
		expect(resultado).toEqual({ ok: true, cambio: { titulo: 'Pagar luz', etiquetas: ['e1'] }, nuevas: [] });
	});

	it('pasa el ahora: pasar a puntual una pausada la reanuda (§5.8)', () => {
		const pausada: Tarea = { id: 't', titulo: 'Pagar luz', tipo: 'periodica', recurrencia: { modo: 'relativo', cada: 2, unidad: 'dias' }, pausada: true, creadaEn: AHORA };
		const resultado = editarDesdePanel(pausada, formulario(''), etiquetas, AHORA);
		expect(resultado.ok && resultado.cambio.reanudadaEn).toEqual(AHORA);
	});
});

describe('crearDesdePanel (spec §6.2)', () => {
	const formulario = (sinConfirmar: string, datos = DATOS) => ({ datos, etiquetas: [], sinConfirmar });

	it('el texto válido no crea la etiqueta', () => {
		const resultado = crearDesdePanel(formulario('auto'), 'id', AHORA, etiquetas);
		expect(resultado).toEqual({ ok: true, tarea: { id: 'id', titulo: 'Pagar luz', tipo: 'puntual', creadaEn: AHORA }, nuevas: [] });
	});

	it('un nombre inválido hace fallar Guardar y no crea la tarea', () => {
		expect(crearDesdePanel(formulario(LARGO), 'id', AHORA, etiquetas)).toEqual({ ok: false, errores: { etiquetas: 'largo' } });
	});
});
