import { describe, expect, it } from 'vitest';
import type { EstadoEnPendientes } from './estado';
import type { Completado, Tarea } from './tarea';
import { instanteDeUrgencia } from './urgencia';

const CREADA = new Date(2026, 6, 1, 9, 30, 0);
const PENDIENTE: EstadoEnPendientes = { tipo: 'pendiente' };
const ATRASADA: EstadoEnPendientes = { tipo: 'atrasada' };
const EN_ESPERA: EstadoEnPendientes = { tipo: 'en espera', progreso: 0.5 };
/** Sin horario, el instante no depende de ahora. */
const SIN_HORARIO_AHORA_NO_INFLUYE = new Date(2026, 6, 15, 12, 0, 0);

const puntual = (fechaLimite?: Date): Tarea => ({ id: 'p', titulo: 'P', tipo: 'puntual', creadaEn: CREADA, ...(fechaLimite && { fechaLimite }) });
const relativa: Tarea = { id: 'r', titulo: 'R', tipo: 'periodica', recurrencia: { modo: 'relativo', cada: 6, unidad: 'horas' }, creadaEn: CREADA };
const semanal: Tarea = { id: 's', titulo: 'S', tipo: 'periodica', recurrencia: { modo: 'calendario', diasSemana: ['martes', 'jueves'] }, creadaEn: CREADA };
const completado = (tareaId: string, completadoEn: Date, ocurrenciaCubierta?: Date): Completado => ({
	id: `c-${tareaId}-${completadoEn.getTime()}`,
	tareaId,
	completadoEn,
	...(ocurrenciaCubierta && { ocurrenciaCubierta })
});

describe('instanteDeUrgencia (spec §6.1)', () => {
	describe('puntual', () => {
		it('pendiente: las 00:00 de la fecha límite', () => {
			expect(instanteDeUrgencia(puntual(new Date(2026, 6, 15)), [], PENDIENTE, SIN_HORARIO_AHORA_NO_INFLUYE)).toEqual(new Date(2026, 6, 15));
		});

		it('atrasada: las 00:00 del día siguiente a la fecha límite', () => {
			expect(instanteDeUrgencia(puntual(new Date(2026, 6, 31)), [], ATRASADA, SIN_HORARIO_AHORA_NO_INFLUYE)).toEqual(new Date(2026, 7, 1));
		});

		it('sin fecha límite no tiene instante', () => {
			expect(instanteDeUrgencia(puntual(), [], PENDIENTE, SIN_HORARIO_AHORA_NO_INFLUYE)).toBeUndefined();
		});
	});

	describe('relativa', () => {
		const completados = [
			completado('r', new Date(2026, 6, 14, 8, 0, 0)),
			completado('r', new Date(2026, 6, 15, 7, 0, 0)),
			completado('otra', new Date(2026, 6, 15, 11, 0, 0))
		];

		it('nunca completada: creadaEn', () => {
			expect(instanteDeUrgencia(relativa, [completado('otra', new Date(2026, 6, 15))], PENDIENTE, SIN_HORARIO_AHORA_NO_INFLUYE)).toEqual(CREADA);
		});

		it('pendiente y en espera: V, desde el completado más reciente de la tarea', () => {
			expect(instanteDeUrgencia(relativa, completados, PENDIENTE, SIN_HORARIO_AHORA_NO_INFLUYE)).toEqual(new Date(2026, 6, 15, 13, 0, 0));
			expect(instanteDeUrgencia(relativa, completados, EN_ESPERA, SIN_HORARIO_AHORA_NO_INFLUYE)).toEqual(new Date(2026, 6, 15, 13, 0, 0));
		});

		it('atrasada: V + intervalo', () => {
			expect(instanteDeUrgencia(relativa, completados, ATRASADA, SIN_HORARIO_AHORA_NO_INFLUYE)).toEqual(new Date(2026, 6, 15, 19, 0, 0));
		});

		it('en días cuenta 24 horas por día', () => {
			const deDias: Tarea = { ...relativa, recurrencia: { modo: 'relativo', cada: 2, unidad: 'dias' } };
			expect(instanteDeUrgencia(deDias, completados, ATRASADA, SIN_HORARIO_AHORA_NO_INFLUYE)).toEqual(new Date(2026, 6, 19, 7, 0, 0));
		});
	});

	describe('calendario', () => {
		// P = martes 14, N = jueves 16.
		const completados = [completado('s', new Date(2026, 6, 14, 9, 0, 0), new Date(2026, 6, 14)), completado('otra', new Date(2026, 6, 15), new Date(2026, 6, 21))];

		it('pendiente y en espera: las 00:00 de N', () => {
			expect(instanteDeUrgencia(semanal, completados, PENDIENTE, SIN_HORARIO_AHORA_NO_INFLUYE)).toEqual(new Date(2026, 6, 16));
			expect(instanteDeUrgencia(semanal, completados, EN_ESPERA, SIN_HORARIO_AHORA_NO_INFLUYE)).toEqual(new Date(2026, 6, 16));
		});

		it('atrasada: las 00:00 del día siguiente a N', () => {
			expect(instanteDeUrgencia(semanal, completados, ATRASADA, SIN_HORARIO_AHORA_NO_INFLUYE)).toEqual(new Date(2026, 6, 17));
		});

		it('sin completados, N es la primera ocurrencia desde creadaEn', () => {
			// Creada el miércoles 1: N = jueves 2.
			expect(instanteDeUrgencia(semanal, [], PENDIENTE, SIN_HORARIO_AHORA_NO_INFLUYE)).toEqual(new Date(2026, 6, 2));
		});
	});
});

describe('instanteDeUrgencia de una reanudada (spec §5.8, §6.1)', () => {
	const REANUDADA = new Date(2026, 6, 15, 10, 0, 0);

	it('de calendario en espera: la próxima ocurrencia desde reanudadaEn, sin contar lo cubierto antes', () => {
		const cubrioElJueves = completado('s', new Date(2026, 6, 14, 9, 0, 0), new Date(2026, 6, 16));

		expect(instanteDeUrgencia({ ...semanal, reanudadaEn: REANUDADA }, [cubrioElJueves], EN_ESPERA, SIN_HORARIO_AHORA_NO_INFLUYE)).toEqual(
			new Date(2026, 6, 16)
		);
	});

	it('relativa nunca completada desde la reanudación: pendiente desde reanudadaEn', () => {
		const deAntes = completado('r', new Date(2026, 6, 14, 9, 0, 0));

		expect(instanteDeUrgencia({ ...relativa, reanudadaEn: REANUDADA }, [deAntes], PENDIENTE, SIN_HORARIO_AHORA_NO_INFLUYE)).toEqual(REANUDADA);
	});
});

describe('instanteDeUrgencia de una pospuesta (spec §5.9)', () => {
	it('en espera por la posposición, vuelve en hasta', () => {
		const hasta = new Date(2026, 6, 15, 13, 0, 0);
		const tarea = { ...puntual(new Date(2026, 6, 20)), pospuesta: { desde: new Date(2026, 6, 15, 10, 0, 0), hasta } };

		expect(instanteDeUrgencia(tarea, [], EN_ESPERA, SIN_HORARIO_AHORA_NO_INFLUYE)).toBe(hasta);
	});

	it('al vencer, vuelve a su clave de siempre', () => {
		const limite = new Date(2026, 6, 20);
		const pospuesta = { desde: new Date(2026, 6, 15, 9, 0, 0), hasta: new Date(2026, 6, 15, 11, 0, 0) };

		expect(instanteDeUrgencia({ ...puntual(limite), pospuesta }, [], PENDIENTE, SIN_HORARIO_AHORA_NO_INFLUYE)).toBe(limite);
	});
});
