// Spec §4.1 (Pasos): la lista se normaliza sin perder pasos con texto, y el avance nunca sale de la lista.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { completar } from './completions';
import { datosDeTarea } from './task-data';
import type { CambioDeTarea } from './task-document';
import { editar } from './editing';
import { accionDeHecho, cambioAlBorrarCompletado, cambioAlCompletar, cambioDePasoAnterior } from './current-step';
import { normalizarPasos, pasoConTope, pasoEnQueVa, pasosDeLaTarea, tieneVariosPasos } from './steps';
import type { Tarea, TareaPuntual } from './task';

const CREADA = new Date(2026, 6, 1, 8, 0, 0);
const texto = fc.string({ maxLength: 8 });
const lista = fc.array(texto, { maxLength: 6 });

const tareaCon = (primerPaso: string, pasos: string[], pasoActual: number): TareaPuntual => ({
	id: 't',
	titulo: 'Ropa',
	tipo: 'puntual',
	creadaEn: CREADA,
	...normalizarPasos(primerPaso, pasos),
	pasoActual
});

/** Aplica el cambio parcial a la tarea: null quita pasoActual, ausente lo deja. */
const aplicar = (tarea: TareaPuntual, cambio: CambioDeTarea): TareaPuntual => {
	if (!('pasoActual' in cambio)) return tarea;
	const { pasoActual: _antes, ...resto } = tarea;
	return cambio.pasoActual == null ? resto : { ...resto, pasoActual: cambio.pasoActual };
};

describe('pasos (propiedades)', () => {
	it('normalizar conserva en orden los pasos con texto, recortados, y es idempotente', () => {
		fc.assert(
			fc.property(texto, lista, (primerPaso, pasos) => {
				const normalizados = normalizarPasos(primerPaso, pasos);
				const conTexto = [primerPaso, ...pasos].map((paso) => paso.trim()).filter((paso) => paso !== '');
				expect(pasosDeLaTarea(normalizados)).toStrictEqual(conTexto);
				expect(normalizarPasos(normalizados.primerPaso, normalizados.pasos)).toStrictEqual(normalizados);
				expect(normalizados.pasos?.length).not.toBe(0);
			})
		);
	});

	it('el paso en que va, «Hecho» y «Paso anterior» nunca salen del primero ni del último', () => {
		fc.assert(
			fc.property(texto, lista, fc.integer({ min: -3, max: 10 }), (primerPaso, pasos, pasoActual) => {
				const tarea = tareaCon(primerPaso, pasos, pasoActual);
				const cantidad = Math.max(1, pasosDeLaTarea(tarea).length);
				const enRango = (paso: number) => paso >= 1 && paso <= cantidad;
				expect(enRango(pasoEnQueVa(tarea))).toBe(true);
				const accion = accionDeHecho(tarea, [], CREADA);
				if (accion.tipo === 'avanzar') expect(enRango(pasoEnQueVa({ ...tarea, pasoActual: accion.cambio.pasoActual ?? 1 }))).toBe(true);
				const anterior = cambioDePasoAnterior(tarea).pasoActual;
				expect(enRango(anterior ?? 1)).toBe(true);
			})
		);
	});

	it('pasoConTope siempre cae entre 1 y la cantidad de pasos (1 si no hay)', () => {
		fc.assert(
			fc.property(texto, lista, fc.integer({ min: -50, max: 50 }), (primerPaso, pasos, paso) => {
				const tarea = tareaCon(primerPaso, pasos, 1);
				const tope = pasoConTope(tarea, paso);
				expect(tope).toBeGreaterThanOrEqual(1);
				expect(tope).toBeLessThanOrEqual(Math.max(1, pasosDeLaTarea(tarea).length));
				expect(pasoConTope(tarea, tope)).toBe(tope);
			})
		);
	});

	it('completar y luego deshacer devuelve el mismo paso en que iba', () => {
		fc.assert(
			fc.property(texto, lista, fc.integer({ min: 1, max: 10 }), (primerPaso, pasos, pasoActual) => {
				const tarea = tareaCon(primerPaso, pasos, pasoActual);
				fc.pre(tieneVariosPasos(tarea));
				const completado = completar(tarea, [], 'c', CREADA);
				const completada = aplicar(tarea, cambioAlCompletar(tarea));
				expect(pasoEnQueVa(completada)).toBe(1);
				const deshecha = aplicar(completada, cambioAlBorrarCompletado(completada, [completado], completado));
				expect(pasoEnQueVa(deshecha)).toBe(pasoEnQueVa(tarea));
			})
		);
	});

	it('editar solo escribe pasos si cambiaron y nunca pasoActual', () => {
		fc.assert(
			fc.property(texto, lista, texto, lista, fc.integer({ min: 1, max: 10 }), (primeroAntes, antes, primeroDespues, despues, pasoActual) => {
				const tarea: Tarea = tareaCon(primeroAntes, antes, pasoActual);
				const resultado = editar(tarea, { ...datosDeTarea(tarea), primerPaso: primeroDespues, pasos: despues });
				if (!resultado.ok) throw new Error('debía editarse');
				const nuevos = normalizarPasos(primeroDespues, despues);
				const cambiaron = JSON.stringify(nuevos.pasos) !== JSON.stringify(tarea.pasos);
				expect('pasos' in resultado.cambio).toBe(cambiaron);
				expect('pasoActual' in resultado.cambio).toBe(false);
			})
		);
	});
});
