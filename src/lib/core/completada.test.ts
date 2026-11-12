import { describe, expect, it } from 'vitest';
import { clasificarEnPendientes, estaCompletada } from './completada';
import type { Completado, Tarea } from './tarea';

const AHORA = new Date(2026, 6, 15, 12, 0, 0);
const UN_COMPLETADO: Completado[] = [{ id: 'c', tareaId: 't', completadoEn: new Date(2026, 6, 15, 8, 0, 0) }];

const puntual: Tarea = { id: 't', titulo: 'T', tipo: 'puntual', creadaEn: new Date(2026, 6, 1) };
const periodica: Tarea = { id: 't', titulo: 'T', tipo: 'periodica', recurrencia: { modo: 'relativo', cada: 1, unidad: 'dias' }, creadaEn: new Date(2026, 6, 1) };
const pospuesta = (tarea: Tarea): Tarea => ({ ...tarea, pospuesta: { desde: new Date(2026, 6, 15, 11, 0, 0), hasta: new Date(2026, 6, 15, 14, 0, 0) } });

describe('estaCompletada (spec §6.1)', () => {
	it('una puntual con completados está completada', () => {
		expect(estaCompletada(puntual, UN_COMPLETADO, AHORA)).toBe(true);
	});

	it('una periódica en espera con completados está completada', () => {
		expect(estaCompletada(periodica, UN_COMPLETADO, AHORA)).toBe(true);
	});

	it('una periódica en espera sin completados (antes de su primera ocurrencia) no está completada', () => {
		const futura = { ...periodica, creadaEn: new Date(2026, 6, 20) };

		expect(estaCompletada(futura, [], AHORA)).toBe(false);
	});

	it('una tarea pendiente o atrasada no está completada aunque tenga completados', () => {
		const vieja = { ...periodica, creadaEn: new Date(2026, 5, 1) };

		expect(estaCompletada(puntual, [], AHORA)).toBe(false);
		expect(estaCompletada(vieja, [{ ...UN_COMPLETADO[0], completadoEn: new Date(2026, 5, 2) }], AHORA)).toBe(false);
	});

	it('una pausada no está completada (spec §5.8)', () => {
		expect(estaCompletada({ ...periodica, pausada: true }, UN_COMPLETADO, AHORA)).toBe(false);
	});
});

describe('clasificarEnPendientes', () => {
	it('conserva el estado de una no completada para ordenarla por urgencia', () => {
		expect(clasificarEnPendientes(puntual, [], AHORA)).toEqual({ completada: false, estado: { tipo: 'pendiente' } });
	});

	it('marca la completada con su estado', () => {
		expect(clasificarEnPendientes(puntual, UN_COMPLETADO, AHORA)).toEqual({ completada: true, estado: { tipo: 'completada' } });
	});
});

describe('una pospuesta no está completada (spec §5.9)', () => {
	it('una puntual completada sigue completada aunque esté pospuesta', () => {
		expect(estaCompletada(pospuesta(puntual), UN_COMPLETADO, AHORA)).toBe(true);
	});

	it('en espera por la posposición, con completados, no está completada', () => {
		const clasificada = clasificarEnPendientes(pospuesta({ ...periodica, creadaEn: new Date(2026, 5, 1) }), [{ ...UN_COMPLETADO[0], completadoEn: new Date(2026, 5, 2) }], AHORA);

		expect(clasificada.completada).toBe(false);
		expect(clasificada.estado.tipo).toBe('en espera');
	});

	it('una periódica en espera por su propia regla, con completados, sigue completada aunque la posposición ya venciera', () => {
		const vencida = { ...periodica, pospuesta: { desde: new Date(2026, 6, 15, 6, 0, 0), hasta: new Date(2026, 6, 15, 7, 0, 0) } };

		expect(estaCompletada(vencida, UN_COMPLETADO, AHORA)).toBe(true);
	});
});
