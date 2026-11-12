// Spec §6.1 (Solo rápidas) y §4.1 (esfuerzo).
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { OPCIONES_DE_ESFUERZO, textoDeEsfuerzo } from './esfuerzo';
import type { FilaDePendientes } from './pendientes';
import { filtrarSoloRapidas, textoDeListaVacia } from './solo-rapidas';
import type { Esfuerzo } from './tarea';

const esfuerzo = fc.constantFrom<Esfuerzo | undefined>(undefined, 'rapida', 'media', 'larga');
const filas = fc.array(esfuerzo, { maxLength: 10 }).map((lista) =>
	lista.map((e, i): FilaDePendientes => ({
		tarea: { id: `t${i}`, titulo: `T${i}`, tipo: 'puntual', creadaEn: new Date(0), etiquetas: [], ...(e && { esfuerzo: e }) },
		estado: { tipo: 'pendiente' },
		completada: false
	}))
);

describe('filtrarSoloRapidas (propiedades)', () => {
	it('apagado devuelve las mismas filas', () => {
		fc.assert(fc.property(filas, (lista) => {
				expect(filtrarSoloRapidas(lista, false)).toStrictEqual(lista);
			}));
	});

	it('encendido es la subsecuencia de las rápidas, en el mismo orden', () => {
		fc.assert(
			fc.property(filas, (lista) => {
				expect(filtrarSoloRapidas(lista, true)).toStrictEqual(lista.filter(({ tarea }) => tarea.esfuerzo === 'rapida'));
			})
		);
	});

	it('es idempotente', () => {
		fc.assert(
			fc.property(filas, fc.boolean(), (lista, encendido) => {
				const una = filtrarSoloRapidas(lista, encendido);
				expect(filtrarSoloRapidas(una, encendido)).toStrictEqual(una);
			})
		);
	});
});

describe('textoDeListaVacia (propiedades)', () => {
	it('con etiqueta manda la etiqueta; sin etiqueta, el texto de rápidas solo si está encendido', () => {
		fc.assert(
			fc.property(fc.option(fc.string(), { nil: undefined }), fc.boolean(), (etiqueta, soloRapidas) => {
				const texto = textoDeListaVacia(etiqueta, soloRapidas);
				if (etiqueta !== undefined) expect(texto).toBe('No hay tareas con esta etiqueta');
				else expect(texto).toBe(soloRapidas ? 'No hay tareas rápidas' : undefined);
			})
		);
	});
});

describe('esfuerzo (propiedades)', () => {
	it('tiene texto si y solo si hay esfuerzo', () => {
		fc.assert(fc.property(esfuerzo, (e) => {
				expect(textoDeEsfuerzo(e) !== undefined).toBe(e !== undefined);
			}));
	});

	it('cada opción del selector cubre un valor distinto, con "Sin estimar" primero', () => {
		expect(OPCIONES_DE_ESFUERZO[0]).toEqual({ valor: undefined, texto: 'Sin estimar' });
		expect(new Set(OPCIONES_DE_ESFUERZO.map((o) => o.valor)).size).toBe(OPCIONES_DE_ESFUERZO.length);
	});
});
