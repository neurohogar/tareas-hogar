import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { clasificarEnPendientes, estaCompletada } from './completada';
import { completadosDeTarea } from './completados';
import { estadoDeTarea } from './estado-de-tarea';
import { posposicionVigente } from './posposicion-vigente';
import type { Completado, Tarea } from './tarea';

const instante = fc.integer({ min: 0, max: 4_000_000_000_000 }).map((ms) => new Date(ms));
const posposicion = fc
	.tuple(instante, fc.integer({ min: 1, max: 100_000_000 }))
	.map(([desde, duracion]) => ({ desde, hasta: new Date(desde.getTime() + duracion) }));
/** Puntual o periódica relativa, con o sin posposición, pausada o no. */
const tarea = fc
	.tuple(
		fc.boolean(),
		instante,
		fc.option(instante, { nil: undefined }),
		fc.integer({ min: 1, max: 100 }),
		fc.constantFrom('horas' as const, 'dias' as const),
		fc.option(posposicion, { nil: undefined }),
		fc.boolean()
	)
	.map(([esPuntual, creadaEn, fechaLimite, cada, unidad, pospuesta, pausada]): Tarea => {
		const comun = { id: 't', titulo: 'T', creadaEn, ...(pospuesta && { pospuesta }) };
		if (esPuntual) return { ...comun, tipo: 'puntual', ...(fechaLimite && { fechaLimite }) };
		return { ...comun, tipo: 'periodica', recurrencia: { modo: 'relativo', cada, unidad }, ...(pausada && { pausada }) };
	});
const completados = fc.array(
	fc.record({ id: fc.uuid(), tareaId: fc.constantFrom('t', 'otra'), completadoEn: instante }) as fc.Arbitrary<Completado>,
	{ maxLength: 5 }
);

describe('clasificarEnPendientes (propiedades)', () => {
	it('conserva el estado de la tarea y coincide con estaCompletada', () => {
		fc.assert(
			fc.property(tarea, completados, instante, (t, cs, ahora) => {
				const clasificada = clasificarEnPendientes(t, cs, ahora);
				expect(clasificada.estado).toEqual(estadoDeTarea(t, cs, ahora));
				expect(clasificada.completada).toBe(estaCompletada(t, cs, ahora));
			})
		);
	});

	it('una tarea sin completados propios nunca está completada', () => {
		fc.assert(
			fc.property(tarea, completados, instante, (t, cs, ahora) => {
				fc.pre(completadosDeTarea(cs, t.id).length === 0);
				expect(estaCompletada(t, cs, ahora)).toBe(false);
			})
		);
	});

	it('una pendiente o atrasada nunca está completada', () => {
		fc.assert(
			fc.property(tarea, completados, instante, (t, cs, ahora) => {
				const { tipo } = estadoDeTarea(t, cs, ahora);
				fc.pre(tipo === 'pendiente' || tipo === 'atrasada');
				expect(estaCompletada(t, cs, ahora)).toBe(false);
			})
		);
	});

	it('una puntual con completados está completada, esté o no pospuesta (§5.1)', () => {
		fc.assert(
			fc.property(tarea, completados, instante, (t, cs, ahora) => {
				fc.pre(t.tipo === 'puntual' && completadosDeTarea(cs, t.id).length > 0);
				expect(estaCompletada(t, cs, ahora)).toBe(true);
			})
		);
	});

	it('una pospuesta vigente cuya regla propia es pendiente o atrasada no está completada (§5.9)', () => {
		fc.assert(
			fc.property(tarea, completados, instante, (t, cs, ahora) => {
				fc.pre(posposicionVigente(t, ahora) !== undefined);
				const { pospuesta: _, ...sinPosposicion } = t;
				const { tipo } = estadoDeTarea(sinPosposicion, cs, ahora);
				fc.pre(tipo === 'pendiente' || tipo === 'atrasada');
				expect(estaCompletada(t, cs, ahora)).toBe(false);
			})
		);
	});

	it('una pausada nunca está completada (§5.8)', () => {
		fc.assert(
			fc.property(tarea, completados, instante, (t, cs, ahora) => {
				fc.pre(t.tipo === 'periodica' && t.pausada === true);
				expect(estaCompletada(t, cs, ahora)).toBe(false);
			})
		);
	});
});
