import { describe, expect, it } from 'vitest';
import { estadoDeTarea } from './estado-de-tarea';
import type { Completado, Horario, Recurrencia, Tarea } from './tarea';
import { instanteDeTocaba, instanteDeVuelve } from './texto-de-fecha-instantes';

const CREADA = new Date(2026, 10, 1, 9, 0);
const AHORA = new Date(2026, 10, 13, 10, 0);

const puntual = (extra: Partial<Extract<Tarea, { tipo: 'puntual' }>> = {}): Tarea => ({ id: 't', titulo: 'T', tipo: 'puntual', creadaEn: CREADA, ...extra });
const periodica = (recurrencia: Recurrencia, extra: Partial<Extract<Tarea, { tipo: 'periodica' }>> = {}): Tarea => ({
	id: 't',
	titulo: 'T',
	tipo: 'periodica',
	recurrencia,
	creadaEn: CREADA,
	...extra
});
const completado = (completadoEn: Date): Completado => ({ id: `c${completadoEn.getTime()}`, tareaId: 't', completadoEn });
const horario = (...ventanas: [string, string][]): Horario => ventanas.map(([desde, hasta]) => ({ desde, hasta }));

/** El instante de «Vuelve» con el estado que da el core, que tiene que ser en espera. */
function vuelve(tarea: Tarea, completados: Completado[], ahora: Date): Date {
	const estado = estadoDeTarea(tarea, completados, ahora);
	if (estado.tipo !== 'en espera') throw new Error(`se esperaba en espera y está ${estado.tipo}`);
	return instanteDeVuelve(tarea, completados, estado, ahora);
}

describe('instanteDeTocaba (spec §6.1, instante de «Tocaba»)', () => {
	it('puntual: el día de la fecha límite, a las 00:00', () => {
		expect(instanteDeTocaba(puntual({ fechaLimite: new Date(2026, 10, 10) }), [], AHORA)).toEqual(new Date(2026, 10, 10));
	});

	it('puntual con horario: el día de la fecha límite, sin hora, aunque su primera ventana haya sido semanas antes', () => {
		const tarea = puntual({ fechaLimite: new Date(2026, 10, 10), horario: horario(['08:00', '11:00']) });
		expect(instanteDeTocaba(tarea, [], AHORA)).toEqual(new Date(2026, 10, 10));
	});

	it('puntual sin fecha límite: no tiene instante', () => {
		expect(instanteDeTocaba(puntual(), [], AHORA)).toBeUndefined();
	});

	it('relativa: V (desde cuándo toca), no V + intervalo (desde cuándo está atrasada)', () => {
		const tarea = periodica({ modo: 'relativo', cada: 2, unidad: 'dias' });
		expect(instanteDeTocaba(tarea, [completado(new Date(2026, 10, 8, 9, 0))], AHORA)).toEqual(new Date(2026, 10, 10, 9, 0));
	});

	it('calendario: el día de N, no el día siguiente', () => {
		const tarea = periodica({ modo: 'calendario', diasSemana: ['martes', 'jueves'] }, { creadaEn: new Date(2026, 10, 2, 8, 0) });
		expect(instanteDeTocaba(tarea, [], AHORA)).toEqual(new Date(2026, 10, 3));
		const mensual = periodica({ modo: 'calendario', diasMes: [10] });
		expect(instanteDeTocaba(mensual, [], AHORA)).toEqual(new Date(2026, 10, 10));
	});

	it('con horario: A, el inicio de la ventana en que pasó a tocar', () => {
		const relativa = periodica({ modo: 'relativo', cada: 3, unidad: 'horas' }, { horario: horario(['08:00', '09:00']) });
		expect(instanteDeTocaba(relativa, [completado(new Date(2026, 10, 13, 4, 0))], AHORA)).toEqual(new Date(2026, 10, 13, 8, 0));
		const semanal = periodica({ modo: 'calendario', diasSemana: ['viernes'] }, { creadaEn: new Date(2026, 10, 12, 8, 0), horario: horario(['09:20', '09:50']) });
		expect(instanteDeTocaba(semanal, [], AHORA)).toEqual(new Date(2026, 10, 13, 9, 20));
	});

	it('con varias ventanas: el inicio de la ocurrencia N', () => {
		const tarea = (creadaEn: Date) =>
			periodica({ modo: 'relativo', cada: 2, unidad: 'dias' }, { creadaEn, horario: horario(['07:00', '10:00'], ['18:00', '21:00']) });
		expect(instanteDeTocaba(tarea(new Date(2026, 10, 10, 8, 0)), [], AHORA)).toEqual(new Date(2026, 10, 10, 7, 0));
		expect(instanteDeTocaba(tarea(new Date(2026, 10, 10, 12, 0)), [], AHORA)).toEqual(new Date(2026, 10, 10, 18, 0));
	});

	it('con horario y A todavía no llegó: el instante sin horario (V), nunca uno futuro', () => {
		const tarea = periodica({ modo: 'relativo', cada: 3, unidad: 'horas' }, { horario: horario(['20:00', '22:00']) });
		expect(instanteDeTocaba(tarea, [completado(new Date(2026, 10, 13, 2, 0))], AHORA)).toEqual(new Date(2026, 10, 13, 5, 0));
	});

	it('con horario y A justo ahora: A', () => {
		const tarea = periodica({ modo: 'relativo', cada: 3, unidad: 'horas' }, { horario: horario(['10:00', '22:00']) });
		expect(instanteDeTocaba(tarea, [completado(new Date(2026, 10, 13, 2, 0))], AHORA)).toEqual(new Date(2026, 10, 13, 10, 0));
	});

	it('reanudada: como recién creada en reanudadaEn (§5.8)', () => {
		const tarea = periodica({ modo: 'calendario', diasSemana: ['martes'] }, { creadaEn: new Date(2026, 9, 1), reanudadaEn: new Date(2026, 10, 2, 8, 0) });
		expect(instanteDeTocaba(tarea, [], AHORA)).toEqual(new Date(2026, 10, 3));
	});
});

describe('instanteDeVuelve (spec §6.1, instante de «Vuelve»)', () => {
	it('relativa: V', () => {
		const tarea = periodica({ modo: 'relativo', cada: 8, unidad: 'horas' });
		expect(vuelve(tarea, [completado(AHORA)], AHORA)).toEqual(new Date(2026, 10, 13, 18, 0));
	});

	it('calendario: las 00:00 de N', () => {
		const tarea = periodica({ modo: 'calendario', diasSemana: ['sábado'] }, { creadaEn: new Date(2026, 10, 13, 8, 0) });
		expect(vuelve(tarea, [], AHORA)).toEqual(new Date(2026, 10, 14));
	});

	it('con horario: A', () => {
		const tarea = periodica({ modo: 'relativo', cada: 12, unidad: 'horas' }, { horario: horario(['08:00', '10:30']) });
		expect(vuelve(tarea, [completado(AHORA)], AHORA)).toEqual(new Date(2026, 10, 14, 8, 0));
	});

	it('puntual fuera de ventana: el desde de la próxima', () => {
		const tarea = puntual({ creadaEn: new Date(2026, 10, 13, 12, 0), horario: horario(['08:00', '11:00']) });
		expect(vuelve(tarea, [], new Date(2026, 10, 13, 12, 0))).toEqual(new Date(2026, 10, 14, 8, 0));
	});

	it('pospuesta: pospuesta.hasta', () => {
		const tarea = puntual({ pospuesta: { desde: AHORA, hasta: new Date(2026, 10, 13, 11, 0) } });
		expect(vuelve(tarea, [], AHORA)).toEqual(new Date(2026, 10, 13, 11, 0));
	});

	it('con dos causas, el instante en que deja de estar en espera: el más tarde de los dos', () => {
		const pospuesta = { desde: AHORA, hasta: new Date(2026, 10, 13, 13, 0) };
		const completadoA = [completado(new Date(2026, 10, 13, 10, 30))];
		const cadaHora = periodica({ modo: 'relativo', cada: 1, unidad: 'horas' }, { pospuesta });
		expect(vuelve(cadaHora, completadoA, new Date(2026, 10, 13, 10, 30))).toEqual(new Date(2026, 10, 13, 13, 0));
		const cadaOcho = periodica({ modo: 'relativo', cada: 8, unidad: 'horas' }, { pospuesta });
		expect(vuelve(cadaOcho, completadoA, new Date(2026, 10, 13, 10, 30))).toEqual(new Date(2026, 10, 13, 18, 30));
	});
});
