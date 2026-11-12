import { describe, expect, it } from 'vitest';
import {
	cierreDelDia,
	dentroDelHorario,
	horarioGuardado,
	leerHorario,
	ocurrenciasDelDia,
	textoDelHorario,
	ultimoCierre,
	ventanaDisponible
} from './horario';
import type { Horario } from './tarea';

const MANANA: Horario = [{ desde: '08:00', hasta: '11:00' }];
const MANANA_Y_TARDE: Horario = [
	{ desde: '07:00', hasta: '10:00' },
	{ desde: '18:00', hasta: '21:00' }
];
const ms = (...partes: [number, number, number, number?, number?, number?]) => new Date(...partes).getTime();

describe('leerHorario (spec §4.1)', () => {
	it('sin horario escrito, la tarea no tiene horario', () => {
		expect(leerHorario(undefined)).toStrictEqual({ ok: true });
		expect(leerHorario([])).toStrictEqual({ ok: true });
	});

	it.each([
		['08:00', '11:00'],
		['00:00', '23:59'],
		['09:00', '09:01']
	])('con desde < hasta (%s a %s) es válido y se guarda tal cual', (desde, hasta) => {
		expect(leerHorario([{ desde, hasta }])).toStrictEqual({ ok: true, horario: [{ desde, hasta }] });
	});

	it.each([
		['11:00', '08:00'],
		['09:00', '09:00'],
		['22:00', '02:00']
	])('con desde ≥ hasta (%s a %s) la hora de fin no es posterior', (desde, hasta) => {
		expect(leerHorario([{ desde, hasta }])).toStrictEqual({ ok: false, error: 'finNoPosterior' });
	});

	it.each([{ desde: '08:00' }, { hasta: '11:00' }, { desde: '08:00', hasta: '' }, { desde: '', hasta: '' }, { desde: '8:00', hasta: '11:00' }, { desde: '24:00', hasta: '11:00' }])(
		'con una hora que falta o no es HH:MM está incompleto (%o)',
		(escrito) => {
			expect(leerHorario([escrito])).toStrictEqual({ ok: false, error: 'incompleto' });
		}
	);

	it('varias ventanas se guardan ordenadas por desde', () => {
		expect(leerHorario([MANANA_Y_TARDE[1], MANANA_Y_TARDE[0]])).toStrictEqual({ ok: true, horario: MANANA_Y_TARDE });
	});

	it('una ventana que empieza justo cuando termina otra es válida', () => {
		const contiguas = [
			{ desde: '10:00', hasta: '12:00' },
			{ desde: '08:00', hasta: '10:00' }
		];
		expect(leerHorario(contiguas)).toStrictEqual({ ok: true, horario: [contiguas[1], contiguas[0]] });
	});

	it.each([
		[{ desde: '08:00', hasta: '11:00' }, { desde: '10:00', hasta: '12:00' }],
		[{ desde: '08:00', hasta: '11:00' }, { desde: '08:00', hasta: '11:00' }],
		[{ desde: '08:00', hasta: '12:00' }, { desde: '09:00', hasta: '10:00' }],
		[{ desde: '10:00', hasta: '12:00' }, { desde: '08:00', hasta: '10:01' }]
	])('ventanas superpuestas se rechazan (%o y %o)', (una, otra) => {
		expect(leerHorario([una, otra])).toStrictEqual({ ok: false, error: 'superpuestos' });
	});

	it('una segunda ventana incompleta o con desde ≥ hasta rechaza el horario entero', () => {
		expect(leerHorario([MANANA_Y_TARDE[0], { desde: '18:00' }])).toStrictEqual({ ok: false, error: 'incompleto' });
		expect(leerHorario([MANANA_Y_TARDE[0], { desde: '21:00', hasta: '18:00' }])).toStrictEqual({ ok: false, error: 'finNoPosterior' });
	});
});

describe('horarioGuardado (spec §4.1)', () => {
	it('un documento con una sola ventana (formato anterior) se lee como una lista de una', () => {
		expect(horarioGuardado({ desde: '08:00', hasta: '11:00' })).toStrictEqual(MANANA);
	});

	it('una lista se lee tal cual', () => {
		expect(horarioGuardado(MANANA_Y_TARDE)).toStrictEqual(MANANA_Y_TARDE);
	});
});

describe('ventanas del horario (spec §5.5)', () => {
	it('antes de la ventana de su día, disponible desde el desde de ese día y cierra en su hasta', () => {
		expect(ventanaDisponible(MANANA, new Date(2026, 6, 15, 6, 0, 0))).toStrictEqual({
			disponible: ms(2026, 6, 15, 8),
			cierre: ms(2026, 6, 15, 11)
		});
	});

	it('dentro de la ventana, disponible en ese mismo instante (desde inclusive)', () => {
		expect(ventanaDisponible(MANANA, new Date(2026, 6, 15, 8, 0, 0))).toStrictEqual({
			disponible: ms(2026, 6, 15, 8),
			cierre: ms(2026, 6, 15, 11)
		});
		expect(ventanaDisponible(MANANA, new Date(2026, 6, 15, 10, 59, 59)).disponible).toBe(ms(2026, 6, 15, 10, 59, 59));
	});

	it('desde el hasta (exclusive), disponible en la ventana del día siguiente', () => {
		expect(ventanaDisponible(MANANA, new Date(2026, 6, 15, 11, 0, 0))).toStrictEqual({
			disponible: ms(2026, 6, 16, 8),
			cierre: ms(2026, 6, 16, 11)
		});
	});

	it('con varias ventanas, entre ventanas está disponible desde el desde de la próxima', () => {
		expect(ventanaDisponible(MANANA_Y_TARDE, new Date(2026, 6, 15, 10, 0, 0))).toStrictEqual({
			disponible: ms(2026, 6, 15, 18),
			cierre: ms(2026, 6, 15, 21)
		});
		expect(ventanaDisponible(MANANA_Y_TARDE, new Date(2026, 6, 15, 21, 0, 0))).toStrictEqual({
			disponible: ms(2026, 6, 16, 7),
			cierre: ms(2026, 6, 16, 10)
		});
	});

	it('dentro del horario es [desde, hasta) de alguna ventana', () => {
		expect(dentroDelHorario(MANANA, new Date(2026, 6, 15, 7, 59, 59))).toBe(false);
		expect(dentroDelHorario(MANANA, new Date(2026, 6, 15, 8, 0, 0))).toBe(true);
		expect(dentroDelHorario(MANANA, new Date(2026, 6, 15, 10, 59, 59))).toBe(true);
		expect(dentroDelHorario(MANANA, new Date(2026, 6, 15, 11, 0, 0))).toBe(false);
		expect(dentroDelHorario(MANANA_Y_TARDE, new Date(2026, 6, 15, 12, 0, 0))).toBe(false);
		expect(dentroDelHorario(MANANA_Y_TARDE, new Date(2026, 6, 15, 18, 0, 0))).toBe(true);
	});

	it('el cierre de un día es el hasta de su última ventana', () => {
		expect(cierreDelDia(MANANA, new Date(2026, 6, 16))).toBe(ms(2026, 6, 16, 11));
		expect(cierreDelDia(MANANA_Y_TARDE, new Date(2026, 6, 16))).toBe(ms(2026, 6, 16, 21));
	});

	it('el último cierre es el hasta más reciente que ya pasó, de hoy o de ayer', () => {
		expect(ultimoCierre(MANANA, new Date(2026, 6, 15, 11, 0, 0))).toBe(ms(2026, 6, 15, 11));
		expect(ultimoCierre(MANANA, new Date(2026, 6, 15, 21, 30, 0))).toBe(ms(2026, 6, 15, 11));
		expect(ultimoCierre(MANANA, new Date(2026, 6, 16, 2, 0, 0))).toBe(ms(2026, 6, 15, 11));
		expect(ultimoCierre(MANANA_Y_TARDE, new Date(2026, 6, 15, 14, 0, 0))).toBe(ms(2026, 6, 15, 10));
		expect(ultimoCierre(MANANA_Y_TARDE, new Date(2026, 6, 16, 2, 0, 0))).toBe(ms(2026, 6, 15, 21));
	});

	it('las ocurrencias de un día son sus ventanas en orden, con inicio y cierre', () => {
		expect(ocurrenciasDelDia(MANANA_Y_TARDE, new Date(2026, 6, 15))).toStrictEqual([
			{ inicio: ms(2026, 6, 15, 7), cierre: ms(2026, 6, 15, 10) },
			{ inicio: ms(2026, 6, 15, 18), cierre: ms(2026, 6, 15, 21) }
		]);
	});
});

describe('textoDelHorario (spec §6.1)', () => {
	it('muestra desde y hasta separados por una raya', () => {
		expect(textoDelHorario(MANANA)).toBe('08:00–11:00');
	});

	it('con varias ventanas, en orden y separadas por " · "', () => {
		expect(textoDelHorario(MANANA_Y_TARDE)).toBe('07:00–10:00 · 18:00–21:00');
	});
});
