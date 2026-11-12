import { describe, expect, it } from 'vitest';
import { crearPeriodicaCalendario } from './crear-periodica-calendario';
import { crearPeriodicaRelativa } from './crear-periodica-relativa';
import { crearPuntual } from './crear-puntual';
import { crearSegunDatos, datosDeTarea } from './datos-de-tarea';
import { OPCIONES_DE_ESFUERZO, textoDeEsfuerzo } from './esfuerzo';
import type { Esfuerzo, Tarea } from './tarea';

const AHORA = new Date(2026, 6, 15, 8, 0, 0);

describe('textoDeEsfuerzo', () => {
	it('da el nivel en texto', () => {
		expect(textoDeEsfuerzo('rapida')).toBe('Rápida');
		expect(textoDeEsfuerzo('media')).toBe('Media');
		expect(textoDeEsfuerzo('larga')).toBe('Larga');
	});

	it('sin esfuerzo, nada', () => {
		expect(textoDeEsfuerzo(undefined)).toBeUndefined();
	});
});

describe('OPCIONES_DE_ESFUERZO', () => {
	it('el selector empieza en "Sin estimar", que es sin el campo, y sigue con los tres niveles', () => {
		expect(OPCIONES_DE_ESFUERZO).toStrictEqual([
			{ valor: undefined, texto: 'Sin estimar' },
			{ valor: 'rapida', texto: 'Rápida (≤ 5 min)' },
			{ valor: 'media', texto: 'Media (≈ 15 min)' },
			{ valor: 'larga', texto: 'Larga' }
		]);
	});
});

describe('crear con esfuerzo', () => {
	it.each<Esfuerzo>(['rapida', 'media', 'larga'])('una puntual guarda el esfuerzo %s', (esfuerzo) => {
		expect(crearPuntual({ titulo: 'Pagar', esfuerzo }, 't1', AHORA)).toStrictEqual({
			ok: true,
			tarea: { id: 't1', titulo: 'Pagar', esfuerzo, tipo: 'puntual', creadaEn: AHORA }
		});
	});

	it('sin esfuerzo, la tarea queda sin el campo', () => {
		expect(crearPuntual({ titulo: 'Pagar', esfuerzo: undefined }, 't1', AHORA)).toStrictEqual({
			ok: true,
			tarea: { id: 't1', titulo: 'Pagar', tipo: 'puntual', creadaEn: AHORA }
		});
	});

	it('una periódica relativa guarda el esfuerzo', () => {
		expect(crearPeriodicaRelativa({ titulo: 'Regar', cada: 2, unidad: 'dias', esfuerzo: 'rapida' }, 't1', AHORA)).toStrictEqual({
			ok: true,
			tarea: {
				id: 't1',
				titulo: 'Regar',
				esfuerzo: 'rapida',
				tipo: 'periodica',
				recurrencia: { modo: 'relativo', cada: 2, unidad: 'dias' },
				creadaEn: AHORA
			}
		});
	});

	it('una periódica de calendario guarda el esfuerzo', () => {
		const datos = { titulo: 'Basura', diasSemana: ['martes'] as const, diasMes: [], esfuerzo: 'larga' as const };

		expect(crearPeriodicaCalendario(datos, 't1', AHORA)).toStrictEqual({
			ok: true,
			tarea: {
				id: 't1',
				titulo: 'Basura',
				esfuerzo: 'larga',
				tipo: 'periodica',
				recurrencia: { modo: 'calendario', diasSemana: ['martes'] },
				creadaEn: AHORA
			}
		});
	});
});

describe('datosDeTarea con esfuerzo', () => {
	const PUNTUAL: Tarea = { id: 't1', titulo: 'Pagar', tipo: 'puntual', creadaEn: AHORA };

	it('carga el esfuerzo de la tarea', () => {
		expect(datosDeTarea({ ...PUNTUAL, esfuerzo: 'media' })).toStrictEqual({ forma: 'puntual', titulo: 'Pagar', esfuerzo: 'media' });
	});

	it('sin esfuerzo, sin la clave', () => {
		expect(datosDeTarea(PUNTUAL)).toStrictEqual({ forma: 'puntual', titulo: 'Pagar' });
	});

	it('es la inversa de crearSegunDatos', () => {
		const tarea: Tarea = { ...PUNTUAL, esfuerzo: 'larga' };

		expect(crearSegunDatos(datosDeTarea(tarea), 't1', AHORA)).toStrictEqual({ ok: true, tarea });
	});
});
