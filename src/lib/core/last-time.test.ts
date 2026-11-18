import { describe, expect, it } from 'vitest';
import type { Completion } from './task';
import { lastTime } from './last-time';

const now = new Date(2026, 6, 15, 12, 0, 0);

const completion = (id: string, completedAt: Date, taskId = 't1'): Completion => ({ id, taskId, completedAt });

const from = (completedAt: Date, moment = now) => lastTime('t1', [completion('c1', completedAt)], moment);

describe('lastTime', () => {
	it('without completions of the task it is "nunca", even if other tasks have some', () => {
		expect(lastTime('t1', [], now)).toBe('nunca');
		expect(lastTime('t1', [completion('c1', new Date(2026, 6, 15, 8, 0), 't2')], now)).toBe('nunca');
	});

	it('from the day of now it is "hoy" with the time without seconds, also later than now', () => {
		expect(from(new Date(2026, 6, 15, 8, 5, 59))).toBe('hoy 08:05');
		expect(from(new Date(2026, 6, 15, 0, 0, 0))).toBe('hoy 00:00');
		expect(from(new Date(2026, 6, 15, 23, 59, 59))).toBe('hoy 23:59');
	});

	it('from the previous day it is "ayer" with the time, also across the year change', () => {
		expect(from(new Date(2026, 6, 14, 19, 30))).toBe('ayer 19:30');
		expect(from(new Date(2026, 6, 14, 23, 59, 59), new Date(2026, 6, 15, 0, 0, 0))).toBe('ayer 23:59');
		expect(from(new Date(2025, 11, 31, 22, 0), new Date(2026, 0, 1, 10, 0))).toBe('ayer 22:00');
	});

	it('from two or more days before it is "hace N días", counting local days and not hours', () => {
		expect(from(new Date(2026, 6, 13, 23, 59, 59), new Date(2026, 6, 15, 0, 0, 0))).toBe('hace 2 días');
		expect(from(new Date(2026, 6, 13, 0, 0, 0), new Date(2026, 6, 15, 23, 59, 59))).toBe('hace 2 días');
		expect(from(new Date(2026, 5, 15, 8, 0), new Date(2026, 6, 15, 7, 0))).toBe('hace 30 días');
		expect(from(new Date(2025, 11, 30, 22, 0), new Date(2026, 0, 2, 8, 0))).toBe('hace 3 días');
	});

	it('from a day after today it carries the date and the time, with the year if it is not the one of now', () => {
		expect(from(new Date(2026, 6, 16, 8, 5))).toBe('jueves 16 de julio 08:05');
		expect(from(new Date(2027, 0, 1, 8, 0), new Date(2026, 11, 31, 20, 0))).toBe('viernes 1 de enero de 2027 08:00');
	});

	it('counts the most recent completedAt, regardless of the order in which they were recorded', () => {
		const completions = [completion('c1', new Date(2026, 6, 15, 9, 0)), completion('c2', new Date(2026, 6, 14, 10, 0))];
		expect(lastTime('t1', completions, now)).toBe('hoy 09:00');
		expect(lastTime('t1', [...completions].reverse(), now)).toBe('hoy 09:00');
	});
});
