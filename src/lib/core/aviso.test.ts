import { describe, expect, it } from 'vitest';
import { avisoAlCompletar, avisoVisible, completadoADeshacer, msHastaQueVence, regresoDelAviso } from './aviso';
import { completar } from './completados';
import type { Completado, Tarea } from './tarea';

const regar: Tarea = { id: 'regar', titulo: 'Regar', tipo: 'puntual', creadaEn: new Date(2026, 0, 1) };
const completadoEn = new Date(2026, 6, 15, 8, 0, 0);
const completado: Completado = { id: 'c1', tareaId: 'regar', completadoEn };
const aviso = avisoAlCompletar(regar, completado);
const masMs = (ms: number) => new Date(completadoEn.getTime() + ms);

describe('avisoAlCompletar', () => {
	it('nombra la tarea por su título al completar y ofrece deshacer ese completado', () => {
		expect(aviso).toStrictEqual({ nombre: 'Regar', completado });
	});

	it('con emoji nombra la tarea «emoji título»', () => {
		expect(avisoAlCompletar({ ...regar, emoji: '🌱' }, completado).nombre).toBe('🌱 Regar');
	});
});

describe('regresoDelAviso (spec §5.4: el aviso dice cuándo vuelve la tarea)', () => {
	const COMPLETADA_EN = new Date(2026, 10, 13, 10, 0, 0);
	const relativa = (cada: number, unidad: 'horas' | 'dias'): Tarea => ({
		id: 'r',
		titulo: 'Regar',
		tipo: 'periodica',
		recurrencia: { modo: 'relativo', cada, unidad },
		creadaEn: new Date(2026, 10, 1)
	});
	/** Completa la tarea con los completados que ya tenía y consulta el regreso del aviso. */
	const regreso = (tarea: Tarea, antes: Completado[] = [], ahora = COMPLETADA_EN) =>
		regresoDelAviso(avisoAlCompletar(tarea, completar(tarea, antes, 'nuevo', COMPLETADA_EN), antes), ahora);

	it('una periódica dice cuándo vuelve, con el instante calculado después del completado', () => {
		expect(regreso(relativa(8, 'horas'))).toBe('Vuelve hoy 18:00 · en 8 horas');
		expect(regreso(relativa(6, 'dias'))).toBe('Vuelve el jueves 19 10:00 · en 6 días');
		const viejo: Completado = { id: 'v', tareaId: 'r', completadoEn: new Date(2026, 10, 12, 8, 0) };
		expect(regreso(relativa(1, 'dias'), [viejo])).toBe('Vuelve mañana 10:00 · en 24 horas');
	});

	it('la distancia se cuenta desde ahora, mientras el aviso se ve', () => {
		expect(regreso(relativa(8, 'horas'), [], new Date(2026, 10, 13, 10, 0, 4))).toBe('Vuelve hoy 18:00 · en 8 horas');
		expect(regreso(relativa(1, 'horas'), [], new Date(2026, 10, 13, 10, 0, 4))).toBe('Vuelve hoy 11:00 · en 1 hora');
	});

	it('una de calendario vuelve en su próxima ocurrencia, a las 00:00', () => {
		const jueves: Tarea = { id: 's', titulo: 'Regar', tipo: 'periodica', recurrencia: { modo: 'calendario', diasSemana: ['jueves'] }, creadaEn: new Date(2026, 10, 1) };
		expect(regreso(jueves)).toBe('Vuelve el jueves 19 · en 6 días');
	});

	it('una puntual no vuelve: el aviso no lleva regreso', () => {
		const pagar: Tarea = { id: 'p', titulo: 'Pagar', tipo: 'puntual', creadaEn: new Date(2026, 10, 1), fechaLimite: new Date(2026, 10, 20) };
		expect(regreso(pagar)).toBeUndefined();
		expect(avisoAlCompletar(pagar, completar(pagar, [], 'nuevo', COMPLETADA_EN))).not.toHaveProperty('vuelve');
	});
});

describe('avisoVisible', () => {
	it('se ve mientras completadoEn <= ahora < completadoEn + 5 s', () => {
		expect(avisoVisible(aviso, completadoEn)).toBe(aviso);
		expect(avisoVisible(aviso, masMs(4_999))).toBe(aviso);
	});

	it('a los 5 segundos ya no se ve', () => {
		expect(avisoVisible(aviso, masMs(5_000))).toBeUndefined();
		expect(avisoVisible(aviso, masMs(3_600_000))).toBeUndefined();
	});

	it('antes de completadoEn no se ve', () => {
		expect(avisoVisible(aviso, masMs(-1))).toBeUndefined();
	});

	it('sin aviso no hay nada que ver', () => {
		expect(avisoVisible(undefined, completadoEn)).toBeUndefined();
	});
});

describe('msHastaQueVence', () => {
	it('es lo que falta para los 5 segundos desde completadoEn', () => {
		expect(msHastaQueVence(aviso, completadoEn)).toBe(5_000);
		expect(msHastaQueVence(aviso, masMs(4_999))).toBe(1);
	});
});

describe('completadoADeshacer', () => {
	it('es el completado que nombra el aviso, mientras el aviso se ve', () => {
		expect(completadoADeshacer(aviso, completadoEn)).toBe(completado);
		expect(completadoADeshacer(aviso, masMs(4_999))).toBe(completado);
	});

	it('con el aviso vencido no hay nada que deshacer', () => {
		expect(completadoADeshacer(aviso, masMs(5_000))).toBeUndefined();
	});

	it('sin aviso no hay nada que deshacer', () => {
		expect(completadoADeshacer(undefined, completadoEn)).toBeUndefined();
	});
});
