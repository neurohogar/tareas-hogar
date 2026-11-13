// Spec §4.1 y §6.1: el primer paso se recorta, vacío es sin campo, y solo se ve en pendiente y atrasada.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { crearPuntual } from './crear-puntual';
import { datosDeTarea } from './datos-de-tarea';
import { editar } from './edicion';
import type { Estado } from './estado';
import { textoDePrimerPaso } from './primer-paso';
import type { Tarea } from './tarea';

const CREADA = new Date(2026, 6, 1, 8, 0, 0);
const texto = fc.string({ maxLength: 20 });
const crear = (primerPaso: string): Tarea => {
	const r = crearPuntual({ titulo: 'Ropa', primerPaso }, 't', CREADA);
	if (!r.ok) throw new Error('debía crearse');
	return r.tarea;
};

describe('primer paso (propiedades)', () => {
	it('crear lo recorta, es idempotente y vacío o solo espacios no deja el campo', () => {
		fc.assert(
			fc.property(texto, (primerPaso) => {
				const tarea = crear(primerPaso);
				expect(tarea.primerPaso).toBe(primerPaso.trim() === '' ? undefined : primerPaso.trim());
				expect('primerPaso' in tarea).toBe(primerPaso.trim() !== '');
				expect(crear(tarea.primerPaso ?? '')).toStrictEqual(tarea);
			})
		);
	});

	it('textoDePrimerPaso solo devuelve texto en pendiente y atrasada, y solo con primer paso', () => {
		const estados: Estado[] = [{ tipo: 'pendiente' }, { tipo: 'atrasada' }, { tipo: 'espera' }, { tipo: 'completada' }, { tipo: 'pausada' }] as Estado[];
		fc.assert(
			fc.property(texto, fc.constantFrom(...estados), (primerPaso, estado) => {
				const tarea = crear(primerPaso);
				const visible = estado.tipo === 'pendiente' || estado.tipo === 'atrasada';
				const esperado = visible && tarea.primerPaso ? `Primer paso: ${tarea.primerPaso}` : undefined;
				expect(textoDePrimerPaso(tarea, estado)).toBe(esperado);
			})
		);
	});

	it('editar solo escribe primerPaso si cambió', () => {
		fc.assert(
			fc.property(texto, texto, (antes, despues) => {
				const tarea = crear(antes);
				const resultado = editar(tarea, { ...datosDeTarea(tarea), primerPaso: despues });
				if (!resultado.ok) throw new Error('debía editarse');
				const nuevo = despues.trim() === '' ? undefined : despues.trim();
				if (nuevo === tarea.primerPaso) expect('primerPaso' in resultado.cambio).toBe(false);
				else expect(resultado.cambio.primerPaso).toBe(nuevo ?? null);
			})
		);
	});
});
