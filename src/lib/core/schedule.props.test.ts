import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { addDays } from './days';
import { endOfDay, withinSchedule, readSchedule, occurrencesOfDay, scheduleText, lastClosing, availableWindow } from './schedule';
import type { Schedule } from './task';

const hour = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
const minutesOfDay = fc.integer({ min: 0, max: 1439 });
/** Un horario válido (§4.1): de una a cuatro ventanas ordenadas y sin superponerse. */
const schedule: fc.Arbitrary<Schedule> = fc
	.integer({ min: 1, max: 4 })
	.chain((n) => fc.uniqueArray(minutesOfDay, { minLength: 2 * n, maxLength: 2 * n }))
	.map((minutes) => {
		const order = [...minutes].sort((a, b) => a - b);
		return order.flatMap((m, i) => (i % 2 === 0 ? [{ from: hour(m), to: hour(order[i + 1]) }] : []));
	});
const instant = fc.integer({ min: 0, max: 4_102_444_800_000 }).map((ms) => new Date(ms));
/** Minutos locales desde las 00:00 del momento (solo para comparar con las horas HH:MM). */
const localMinute = (moment: Date) => moment.getHours() * 60 + moment.getMinutes();
const minutesOf = (text: string) => Number(text.slice(0, 2)) * 60 + Number(text.slice(3));

describe('leerHorario (propiedades)', () => {
	it('un horario válido se lee tal cual: leer es idempotente sobre lo guardado', () => {
		fc.assert(
			fc.property(schedule, (h) => {
				expect(readSchedule(h)).toEqual({ ok: true, schedule: h });
			})
		);
	});

	it('dos horas con desde ≥ hasta: la de fin no es posterior', () => {
		fc.assert(
			fc.property(minutesOfDay, minutesOfDay, (a, b) => {
				fc.pre(a >= b);
				expect(readSchedule([{ from: hour(a), to: hour(b) }])).toEqual({
					ok: false,
					error: 'finNoPosterior'
				});
			})
		);
	});

	it('si falta una de las dos horas, está incompleto', () => {
		fc.assert(
			fc.property(minutesOfDay, fc.boolean(), fc.constantFrom(undefined, ''), (m, missingFrom, missing) => {
				const typedOne = missingFrom ? { from: missing, to: hour(m) } : { from: hour(m), to: missing };
				expect(readSchedule([typedOne])).toEqual({
					ok: false,
					error: 'incompleto'
				});
			})
		);
	});

	it('el orden en que se escriben las ventanas no importa: se guardan ordenadas por desde', () => {
		fc.assert(
			fc.property(
				schedule.chain((h) => fc.tuple(fc.constant(h), fc.shuffledSubarray(h, { minLength: h.length, maxLength: h.length }))),
				([h, typedOne]) => {
					expect(readSchedule(typedOne)).toEqual({ ok: true, schedule: h });
				}
			)
		);
	});

	it('dos ventanas que se pisan están superpuestas, en cualquier orden', () => {
		fc.assert(
			fc.property(fc.uniqueArray(minutesOfDay, { minLength: 3, maxLength: 3 }), minutesOfDay, fc.boolean(), (three, extra, invert) => {
				// a < b < c ≤ max(c, extra): [a, c) y [b, max(c, extra)) comparten [b, c).
				const [a, b, c] = [...three].sort((x, y) => x - y);
				const timeWindows = [
					{ from: hour(a), to: hour(c) },
					{ from: hour(b), to: hour(Math.max(c, extra)) }
				];
				expect(readSchedule(invert ? timeWindows.reverse() : timeWindows)).toEqual({ ok: false, error: 'superpuestos' });
			})
		);
	});

	it('el texto de la fila nombra cada ventana, en orden, separadas por " · "', () => {
		fc.assert(
			fc.property(schedule, (h) => {
				const parts = scheduleText(h).split(' · ');
				expect(parts).toEqual(h.map(({ from, to }) => `${from}–${to}`));
			})
		);
	});
});

describe('ventana del horario (propiedades)', () => {
	it('dentro del horario: el minuto local está en [desde, hasta) de alguna ventana', () => {
		fc.assert(
			fc.property(schedule, instant, (h, now) => {
				const minute = localMinute(now);
				expect(withinSchedule(h, now)).toBe(h.some(({ from, to }) => minute >= minutesOf(from) && minute < minutesOf(to)));
			})
		);
	});

	it('A es el primer instante ≥ desde dentro de una ventana, y C el hasta de esa ventana', () => {
		fc.assert(
			fc.property(schedule, instant, (h, from) => {
				const { available, closing } = availableWindow(h, from);
				expect(available).toBeGreaterThanOrEqual(from.getTime());
				expect(withinSchedule(h, new Date(available))).toBe(true);
				// C es el hasta de la ventana del día de A que contiene A.
				const timeWindow = occurrencesOfDay(h, new Date(available)).find(({ start, closing }) => start <= available && available < closing);
				expect(closing).toBe(timeWindow?.closing);
				// Entre desde y A no hay instante dentro de una ventana: A es el primero.
				if (available > from.getTime()) expect(withinSchedule(h, new Date(available - 1))).toBe(false);
			})
		);
	});

	it('A es idempotente: desde A, la ventana disponible es la misma', () => {
		fc.assert(
			fc.property(schedule, instant, (h, from) => {
				const timeWindow = availableWindow(h, from);
				expect(availableWindow(h, new Date(timeWindow.available))).toEqual(timeWindow);
			})
		);
	});

	it('el último cierre ya pasó y no hay otro cierre entre él y ahora', () => {
		fc.assert(
			fc.property(schedule, instant, (h, now) => {
				const closing = lastClosing(h, now);
				expect(closing).toBeLessThanOrEqual(now.getTime());
				const closings = [-1, 0, 1].flatMap((d) => occurrencesOfDay(h, addDays(now, d)).map((o) => o.closing));
				expect(closings).toContain(closing);
				expect(closings.filter((c) => c > closing && c <= now.getTime())).toEqual([]);
			})
		);
	});

	it('el cierre del día es el hasta de su última ventana', () => {
		fc.assert(
			fc.property(schedule, instant, (h, day) => {
				expect(endOfDay(h, day)).toBe(Math.max(...occurrencesOfDay(h, day).map((o) => o.closing)));
			})
		);
	});
});
