import { describe, expect, it } from 'vitest';
import {
	endOfDay,
	withinSchedule,
	savedSchedule,
	readSchedule,
	occurrencesOfDay,
	scheduleText,
	lastClosing,
	availableWindow
} from './schedule';
import type { Schedule } from './task';

const MORNING: Schedule = [{ from: '08:00', to: '11:00' }];
const MORNING_AND_AFTERNOON: Schedule = [
	{ from: '07:00', to: '10:00' },
	{ from: '18:00', to: '21:00' }
];
const ms = (...parts: [number, number, number, number?, number?, number?]) => new Date(...parts).getTime();

describe('leerHorario (spec §4.1)', () => {
	it('sin horario escrito, la tarea no tiene horario', () => {
		expect(readSchedule(undefined)).toStrictEqual({ ok: true });
		expect(readSchedule([])).toStrictEqual({ ok: true });
	});

	it.each([
		['08:00', '11:00'],
		['00:00', '23:59'],
		['09:00', '09:01']
	])('con desde < hasta (%s a %s) es válido y se guarda tal cual', (from, to) => {
		expect(readSchedule([{ from, to }])).toStrictEqual({ ok: true, schedule: [{ from, to }] });
	});

	it.each([
		['11:00', '08:00'],
		['09:00', '09:00'],
		['22:00', '02:00']
	])('con desde ≥ hasta (%s a %s) la hora de fin no es posterior', (from, to) => {
		expect(readSchedule([{ from, to }])).toStrictEqual({ ok: false, error: 'finNoPosterior' });
	});

	it.each([{ from: '08:00' }, { to: '11:00' }, { from: '08:00', to: '' }, { from: '', to: '' }, { from: '8:00', to: '11:00' }, { from: '24:00', to: '11:00' }])(
		'con una hora que falta o no es HH:MM está incompleto (%o)',
		(typedOne) => {
			expect(readSchedule([typedOne])).toStrictEqual({ ok: false, error: 'incompleto' });
		}
	);

	it('varias ventanas se guardan ordenadas por desde', () => {
		expect(readSchedule([MORNING_AND_AFTERNOON[1], MORNING_AND_AFTERNOON[0]])).toStrictEqual({ ok: true, schedule: MORNING_AND_AFTERNOON });
	});

	it('una ventana que empieza justo cuando termina otra es válida', () => {
		const contiguous = [
			{ from: '10:00', to: '12:00' },
			{ from: '08:00', to: '10:00' }
		];
		expect(readSchedule(contiguous)).toStrictEqual({ ok: true, schedule: [contiguous[1], contiguous[0]] });
	});

	it.each([
		[{ from: '08:00', to: '11:00' }, { from: '10:00', to: '12:00' }],
		[{ from: '08:00', to: '11:00' }, { from: '08:00', to: '11:00' }],
		[{ from: '08:00', to: '12:00' }, { from: '09:00', to: '10:00' }],
		[{ from: '10:00', to: '12:00' }, { from: '08:00', to: '10:01' }]
	])('ventanas superpuestas se rechazan (%o y %o)', (one, other) => {
		expect(readSchedule([one, other])).toStrictEqual({ ok: false, error: 'superpuestos' });
	});

	it('una segunda ventana incompleta o con desde ≥ hasta rechaza el horario entero', () => {
		expect(readSchedule([MORNING_AND_AFTERNOON[0], { from: '18:00' }])).toStrictEqual({ ok: false, error: 'incompleto' });
		expect(readSchedule([MORNING_AND_AFTERNOON[0], { from: '21:00', to: '18:00' }])).toStrictEqual({ ok: false, error: 'finNoPosterior' });
	});
});

describe('horarioGuardado (spec §4.1)', () => {
	it('un documento con una sola ventana (formato anterior) se lee como una lista de una', () => {
		expect(savedSchedule({ from: '08:00', to: '11:00' })).toStrictEqual(MORNING);
	});

	it('una lista se lee tal cual', () => {
		expect(savedSchedule(MORNING_AND_AFTERNOON)).toStrictEqual(MORNING_AND_AFTERNOON);
	});
});

describe('ventanas del horario (spec §5.5)', () => {
	it('antes de la ventana de su día, disponible desde el desde de ese día y cierra en su hasta', () => {
		expect(availableWindow(MORNING, new Date(2026, 6, 15, 6, 0, 0))).toStrictEqual({
			available: ms(2026, 6, 15, 8),
			closing: ms(2026, 6, 15, 11)
		});
	});

	it('dentro de la ventana, disponible en ese mismo instante (desde inclusive)', () => {
		expect(availableWindow(MORNING, new Date(2026, 6, 15, 8, 0, 0))).toStrictEqual({
			available: ms(2026, 6, 15, 8),
			closing: ms(2026, 6, 15, 11)
		});
		expect(availableWindow(MORNING, new Date(2026, 6, 15, 10, 59, 59)).available).toBe(ms(2026, 6, 15, 10, 59, 59));
	});

	it('desde el hasta (exclusive), disponible en la ventana del día siguiente', () => {
		expect(availableWindow(MORNING, new Date(2026, 6, 15, 11, 0, 0))).toStrictEqual({
			available: ms(2026, 6, 16, 8),
			closing: ms(2026, 6, 16, 11)
		});
	});

	it('con varias ventanas, entre ventanas está disponible desde el desde de la próxima', () => {
		expect(availableWindow(MORNING_AND_AFTERNOON, new Date(2026, 6, 15, 10, 0, 0))).toStrictEqual({
			available: ms(2026, 6, 15, 18),
			closing: ms(2026, 6, 15, 21)
		});
		expect(availableWindow(MORNING_AND_AFTERNOON, new Date(2026, 6, 15, 21, 0, 0))).toStrictEqual({
			available: ms(2026, 6, 16, 7),
			closing: ms(2026, 6, 16, 10)
		});
	});

	it('dentro del horario es [desde, hasta) de alguna ventana', () => {
		expect(withinSchedule(MORNING, new Date(2026, 6, 15, 7, 59, 59))).toBe(false);
		expect(withinSchedule(MORNING, new Date(2026, 6, 15, 8, 0, 0))).toBe(true);
		expect(withinSchedule(MORNING, new Date(2026, 6, 15, 10, 59, 59))).toBe(true);
		expect(withinSchedule(MORNING, new Date(2026, 6, 15, 11, 0, 0))).toBe(false);
		expect(withinSchedule(MORNING_AND_AFTERNOON, new Date(2026, 6, 15, 12, 0, 0))).toBe(false);
		expect(withinSchedule(MORNING_AND_AFTERNOON, new Date(2026, 6, 15, 18, 0, 0))).toBe(true);
	});

	it('el cierre de un día es el hasta de su última ventana', () => {
		expect(endOfDay(MORNING, new Date(2026, 6, 16))).toBe(ms(2026, 6, 16, 11));
		expect(endOfDay(MORNING_AND_AFTERNOON, new Date(2026, 6, 16))).toBe(ms(2026, 6, 16, 21));
	});

	it('el último cierre es el hasta más reciente que ya pasó, de hoy o de ayer', () => {
		expect(lastClosing(MORNING, new Date(2026, 6, 15, 11, 0, 0))).toBe(ms(2026, 6, 15, 11));
		expect(lastClosing(MORNING, new Date(2026, 6, 15, 21, 30, 0))).toBe(ms(2026, 6, 15, 11));
		expect(lastClosing(MORNING, new Date(2026, 6, 16, 2, 0, 0))).toBe(ms(2026, 6, 15, 11));
		expect(lastClosing(MORNING_AND_AFTERNOON, new Date(2026, 6, 15, 14, 0, 0))).toBe(ms(2026, 6, 15, 10));
		expect(lastClosing(MORNING_AND_AFTERNOON, new Date(2026, 6, 16, 2, 0, 0))).toBe(ms(2026, 6, 15, 21));
	});

	it('las ocurrencias de un día son sus ventanas en orden, con inicio y cierre', () => {
		expect(occurrencesOfDay(MORNING_AND_AFTERNOON, new Date(2026, 6, 15))).toStrictEqual([
			{ start: ms(2026, 6, 15, 7), closing: ms(2026, 6, 15, 10) },
			{ start: ms(2026, 6, 15, 18), closing: ms(2026, 6, 15, 21) }
		]);
	});
});

describe('textoDelHorario (spec §6.1)', () => {
	it('muestra desde y hasta separados por una raya', () => {
		expect(scheduleText(MORNING)).toBe('08:00–11:00');
	});

	it('con varias ventanas, en orden y separadas por " · "', () => {
		expect(scheduleText(MORNING_AND_AFTERNOON)).toBe('07:00–10:00 · 18:00–21:00');
	});
});
