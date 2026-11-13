// Spec §4.1 (Pasos): la lista se normaliza sin perder pasos con texto, y el avance nunca sale de la lista.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { accionDeHecho, cambioDePasoAnterior } from './paso-actual';
import { normalizarPasos, pasoEnQueVa, pasosDeLaTarea } from './pasos';
import type { TareaPuntual } from './tarea';

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
});
