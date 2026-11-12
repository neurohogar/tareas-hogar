import { describe, expect, it } from 'vitest';
import { estadoDeTarea } from './estado-de-tarea';
import type { Completado, Horario, Tarea } from './tarea';
import { instanteDeUrgencia } from './urgencia';

const MANANA: Horario = [{ desde: '08:00', hasta: '11:00' }];
const en = (dia: number, hora = 0, minuto = 0, segundo = 0) => new Date(2026, 6, dia, hora, minuto, segundo);
const completado = (completadoEn: Date, ocurrenciaCubierta?: Date): Completado => ({
	id: `c-${completadoEn.getTime()}`,
	tareaId: 't',
	completadoEn,
	...(ocurrenciaCubierta && { ocurrenciaCubierta })
});

const puntual = (creadaEn: Date, fechaLimite?: Date): Tarea => ({
	id: 't',
	titulo: 'Foco',
	tipo: 'puntual',
	...(fechaLimite && { fechaLimite }),
	horario: MANANA,
	creadaEn
});
const relativa = (cada: number, unidad: 'horas' | 'dias', creadaEn = en(1)): Tarea => ({
	id: 't',
	titulo: 'Regar',
	tipo: 'periodica',
	recurrencia: { modo: 'relativo', cada, unidad },
	horario: MANANA,
	creadaEn
});
const martesYJueves = (creadaEn = en(1)): Tarea => ({
	id: 't',
	titulo: 'Basura',
	tipo: 'periodica',
	recurrencia: { modo: 'calendario', diasSemana: ['martes', 'jueves'] },
	horario: MANANA,
	creadaEn
});

describe('estado de una puntual con horario (spec §5.5)', () => {
	it('antes de la primera ventana está en espera, con progreso desde creadaEn hasta el desde', () => {
		expect(estadoDeTarea(puntual(en(15, 6)), [], en(15, 7))).toEqual({ tipo: 'en espera', progreso: 0.5 });
	});

	it.each([en(15, 8), en(15, 10, 59, 59), en(17, 9)])('dentro de una ventana está pendiente (%s)', (ahora) => {
		expect(estadoDeTarea(puntual(en(15, 6)), [], ahora)).toEqual({ tipo: 'pendiente' });
	});

	it('después del cierre, fuera de la ventana, está en espera con progreso desde el hasta anterior', () => {
		expect(estadoDeTarea(puntual(en(15, 6)), [], en(15, 11))).toEqual({ tipo: 'en espera', progreso: 0 });
		expect(estadoDeTarea(puntual(en(15, 6)), [], en(15, 21, 30))).toEqual({ tipo: 'en espera', progreso: 0.5 });
		expect(estadoDeTarea(puntual(en(15, 6)), [], en(20, 2, 45))).toEqual({ tipo: 'en espera', progreso: 0.75 });
	});

	it('creada después de la ventana, espera desde creadaEn hasta el desde del día siguiente', () => {
		expect(estadoDeTarea(puntual(en(15, 12)), [], en(16, 2))).toEqual({ tipo: 'en espera', progreso: 0.7 });
	});

	it('con fecha límite, atrasada desde el hasta de la ventana de ese día, también fuera de las ventanas', () => {
		const tarea = puntual(en(15, 6), en(16));
		expect(estadoDeTarea(tarea, [], en(16, 10, 59, 59))).toEqual({ tipo: 'pendiente' });
		expect(estadoDeTarea(tarea, [], en(16, 11))).toEqual({ tipo: 'atrasada' });
		expect(estadoDeTarea(tarea, [], en(17, 7))).toEqual({ tipo: 'atrasada' });
	});

	it('con el atraso cumplido al crearla, está atrasada aunque la ventana no abrió', () => {
		expect(estadoDeTarea(puntual(en(15, 12), en(15)), [], en(15, 12))).toEqual({ tipo: 'atrasada' });
	});

	it('con un completado está completada a cualquier hora', () => {
		expect(estadoDeTarea(puntual(en(15, 6)), [completado(en(15, 9))], en(15, 20))).toEqual({ tipo: 'completada' });
	});
});

describe('estado de una relativa con horario (spec §5.5)', () => {
	it('antes de A está en espera con progreso (ahora − U) / (A − U)', () => {
		expect(estadoDeTarea(relativa(1, 'dias'), [completado(en(15, 9))], en(15, 15))).toEqual({ tipo: 'en espera', progreso: 0.25 });
		expect(estadoDeTarea(relativa(1, 'dias'), [completado(en(15, 12))], en(16, 10))).toEqual({ tipo: 'en espera', progreso: 0.5 });
	});

	it('con relojes desfasados (ahora < U) el progreso es 0', () => {
		expect(estadoDeTarea(relativa(1, 'dias'), [completado(en(15, 9))], en(15, 8))).toEqual({ tipo: 'en espera', progreso: 0 });
	});

	it('pasado V pero fuera de la ventana sigue en espera; desde A, pendiente', () => {
		const completados = [completado(en(15, 12))];
		expect(estadoDeTarea(relativa(1, 'dias'), completados, en(17, 7, 59, 59)).tipo).toBe('en espera');
		expect(estadoDeTarea(relativa(1, 'dias'), completados, en(17, 8))).toEqual({ tipo: 'pendiente' });
	});

	it('atrasada desde el primero entre C y V + intervalo', () => {
		expect(estadoDeTarea(relativa(1, 'dias'), [completado(en(15, 9))], en(16, 10, 59, 59))).toEqual({ tipo: 'pendiente' });
		expect(estadoDeTarea(relativa(1, 'dias'), [completado(en(15, 9))], en(16, 11))).toEqual({ tipo: 'atrasada' });
		expect(estadoDeTarea(relativa(1, 'horas'), [completado(en(15, 8, 30))], en(15, 10, 29, 59))).toEqual({ tipo: 'pendiente' });
		expect(estadoDeTarea(relativa(1, 'horas'), [completado(en(15, 8, 30))], en(15, 10, 30))).toEqual({ tipo: 'atrasada' });
	});

	it('atrasada aunque la ventana no abrió si V + intervalo ya pasó', () => {
		expect(estadoDeTarea(relativa(4, 'horas'), [completado(en(15, 10))], en(15, 18))).toEqual({ tipo: 'atrasada' });
	});

	it('nunca completada: en espera desde creadaEn hasta el desde; atrasada si pasa la primera ventana', () => {
		const tarea = relativa(1, 'dias', en(15, 12));
		expect(estadoDeTarea(tarea, [], en(15, 20))).toEqual({ tipo: 'en espera', progreso: 0.4 });
		expect(estadoDeTarea(tarea, [], en(16, 8))).toEqual({ tipo: 'pendiente' });
		expect(estadoDeTarea(tarea, [], en(16, 11))).toEqual({ tipo: 'atrasada' });
	});
});

describe('estado de una de calendario con horario (spec §5.5)', () => {
	const completados = [completado(en(14, 8), en(14))];

	it('antes del desde del día N está en espera, con progreso hasta el desde', () => {
		expect(estadoDeTarea(martesYJueves(), completados, en(16, 2))).toEqual({ tipo: 'en espera', progreso: 0.875 });
		expect(estadoDeTarea(martesYJueves(), completados, en(16, 7, 59, 59)).tipo).toBe('en espera');
	});

	it('el día N dentro de la ventana está pendiente; desde su hasta, atrasada', () => {
		expect(estadoDeTarea(martesYJueves(), completados, en(16, 10, 59, 59))).toEqual({ tipo: 'pendiente' });
		expect(estadoDeTarea(martesYJueves(), completados, en(16, 11))).toEqual({ tipo: 'atrasada' });
	});

	it('creada un día de ocurrencia después de la ventana queda atrasada en el acto', () => {
		expect(estadoDeTarea(martesYJueves(en(16, 12)), [], en(16, 12))).toEqual({ tipo: 'atrasada' });
	});
});

describe('instante de urgencia con horario (spec §5.5, §6.1)', () => {
	function instante(tarea: Tarea, completados: Completado[], ahora: Date) {
		const estado = estadoDeTarea(tarea, completados, ahora);
		if (estado.tipo === 'completada' || estado.tipo === 'pausada') throw new Error('Una completada no se ordena por urgencia');
		return instanteDeUrgencia(tarea, completados, estado, ahora);
	}

	it('una periódica atrasada, desde el atraso (C, o V + intervalo si es anterior)', () => {
		expect(instante(relativa(1, 'dias'), [completado(en(15, 9))], en(16, 12))).toEqual(en(16, 11));
		expect(instante(relativa(1, 'horas'), [completado(en(16, 8, 30))], en(16, 12))).toEqual(en(16, 10, 30));
	});

	it('una periódica pendiente o en espera, A', () => {
		expect(instante(relativa(1, 'dias'), [completado(en(14, 12))], en(16, 9))).toEqual(en(16, 8));
		expect(instante(relativa(1, 'dias'), [completado(en(15, 12))], en(16, 14))).toEqual(en(17, 8));
	});

	it('una puntual atrasada, desde el hasta de la ventana del día límite', () => {
		expect(instante(puntual(en(1), en(15)), [], en(16, 12))).toEqual(en(15, 11));
	});

	it('una puntual pendiente conserva la clave de §6.1: su fecha límite, o ninguna', () => {
		expect(instante(puntual(en(1), en(16)), [], en(16, 9))).toEqual(en(16));
		expect(instante(puntual(en(1)), [], en(16, 9))).toBeUndefined();
	});

	it('una puntual en espera, cuando vuelve: el desde de la próxima ventana', () => {
		expect(instante(puntual(en(15, 12)), [], en(15, 14))).toEqual(en(16, 8));
		expect(instante(puntual(en(1)), [], en(15, 14))).toEqual(en(16, 8));
	});
});

describe('estado con varias ventanas (spec §5.6, §5.7)', () => {
	const DOS: Horario = [
		{ desde: '07:00', hasta: '10:00' },
		{ desde: '18:00', hasta: '21:00' }
	];
	const cubre = (completadoEn: Date, inicio: Date): Completado => ({ id: `c-${completadoEn.getTime()}`, tareaId: 't', completadoEn, ocurrenciaCubierta: { inicio } });
	const miercoles = (horario = DOS): Tarea => ({
		id: 't',
		titulo: 'Perros',
		tipo: 'periodica',
		recurrencia: { modo: 'calendario', diasSemana: ['miércoles', 'jueves'] },
		horario,
		creadaEn: en(1)
	});
	const cada2Dias = (creadaEn = en(1)): Tarea => ({
		id: 't',
		titulo: 'Perros',
		tipo: 'periodica',
		recurrencia: { modo: 'relativo', cada: 2, unidad: 'dias' },
		horario: DOS,
		creadaEn
	});

	it('calendario con la mañana cubierta: en espera hasta la tarde, pendiente en ella y atrasada desde su hasta', () => {
		const hecha = [cubre(en(15, 8), en(15, 7))];
		expect(estadoDeTarea(miercoles(), hecha, en(15, 13))).toEqual({ tipo: 'en espera', progreso: 0.5 });
		expect(estadoDeTarea(miercoles(), hecha, en(15, 18))).toEqual({ tipo: 'pendiente' });
		expect(estadoDeTarea(miercoles(), hecha, en(15, 21))).toEqual({ tipo: 'atrasada' });
	});

	it('calendario con la fecha sola cubierta: el día entero, en espera hasta la mañana siguiente', () => {
		expect(estadoDeTarea(miercoles(), [completado(en(15, 8), en(15))], en(15, 19, 30))).toEqual({ tipo: 'en espera', progreso: 0.5 });
	});

	it('calendario: mover la única ventana más tarde el mismo día vuelve a abrir la ocurrencia hecha', () => {
		const hecha = [cubre(en(15, 8, 30), en(15, 8))];
		expect(estadoDeTarea(miercoles([{ desde: '09:00', hasta: '12:00' }]), hecha, en(15, 9))).toEqual({ tipo: 'pendiente' });
	});

	it('puntual: entre ventanas en espera hasta la próxima; atrasada desde el hasta de la última ventana del día límite', () => {
		const puntualDos: Tarea = { id: 't', titulo: 'Pan', tipo: 'puntual', fechaLimite: en(15), horario: DOS, creadaEn: en(15, 6) };
		expect(estadoDeTarea(puntualDos, [], en(15, 14))).toEqual({ tipo: 'en espera', progreso: 0.5 });
		expect(estadoDeTarea(puntualDos, [], en(15, 18))).toEqual({ tipo: 'pendiente' });
		expect(estadoDeTarea(puntualDos, [], en(15, 21))).toEqual({ tipo: 'atrasada' });
	});

	it('relativa en días: la ronda del día sigue y después espera cada `cada` días; el atraso es C', () => {
		expect(estadoDeTarea(cada2Dias(), [cubre(en(13, 8), en(13, 7))], en(13, 13))).toEqual({ tipo: 'en espera', progreso: 0.5 });
		expect(estadoDeTarea(cada2Dias(), [cubre(en(13, 8), en(13, 7))], en(13, 21))).toEqual({ tipo: 'atrasada' });
		expect(estadoDeTarea(cada2Dias(), [cubre(en(13, 19), en(13, 18))], en(14, 13))).toEqual({ tipo: 'en espera', progreso: 0.5 });
		expect(estadoDeTarea(cada2Dias(), [cubre(en(13, 19), en(13, 18))], en(15, 7))).toEqual({ tipo: 'pendiente' });
	});

	it('relativa en días nunca completada: espera desde creadaEn la primera ventana que no cerró', () => {
		expect(estadoDeTarea(cada2Dias(en(13, 12)), [], en(13, 15))).toEqual({ tipo: 'en espera', progreso: 0.5 });
		expect(estadoDeTarea(cada2Dias(en(13, 12)), [], en(14, 8))).toEqual({ tipo: 'atrasada' });
	});

	it('el instante de urgencia es A de N (pendiente) o su C (atrasada)', () => {
		const hecha = [cubre(en(15, 8), en(15, 7))];
		expect(instanteDeUrgencia(miercoles(), hecha, { tipo: 'pendiente' }, en(15, 19))).toStrictEqual(en(15, 18));
		expect(instanteDeUrgencia(miercoles(), hecha, { tipo: 'atrasada' }, en(15, 22))).toStrictEqual(en(15, 21));
	});
});
