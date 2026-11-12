import { describe, expect, it } from 'vitest';
import { avisoAlCompletar, avisoVisible, completadoADeshacer, msHastaQueVence } from './aviso';
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
