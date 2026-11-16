// Spec §5.6 y §5.7: ocurrencias de una periódica con horario.
import { describe, expect, it } from 'vitest';
import {
	calendarOccurrenceThatCovers,
	windowOccurrenceThatCovers,
	nextCalendarOccurrence,
	nextWindowOccurrence,
	completesByWindow
} from './occurrences-with-schedule';
import type { Completion, Schedule, CalendarRecurrence, RelativeRecurrence } from './task';

const MORNING_AND_AFTERNOON: Schedule = [
	{ from: '07:00', to: '10:00' },
	{ from: '18:00', to: '21:00' }
];
const at = (day: number, hour = 0, minute = 0, secondOne = 0) => new Date(2026, 6, day, hour, minute, secondOne);
const ms = (day: number, hour = 0, minute = 0) => at(day, hour, minute).getTime();
const occurrence = (day: number, from: number, to: number) => ({ start: ms(day, from), closing: ms(day, to) });
const completion = (completedAt: Date, coveredOccurrence?: Completion['coveredOccurrence']): Completion => ({
	id: `c-${completedAt.getTime()}`,
	taskId: 't',
	completedAt,
	...(coveredOccurrence && { coveredOccurrence })
});
const coversStart = (completedAt: Date, start: Date) => completion(completedAt, { start });

/** Miércoles 15 y jueves 16 de julio de 2026. */
const WEDNESDAY_AND_THURSDAY: CalendarRecurrence = { mode: 'calendario', weekdays: ['miércoles', 'jueves'] };
const EVERY_2_DAYS: RelativeRecurrence = { mode: 'relativo', every: 2, unit: 'dias' };

describe('próxima ocurrencia de calendario con horario (spec §5.6)', () => {
	it('con la mañana cubierta, es la tarde del mismo día', () => {
		const n = nextCalendarOccurrence(WEDNESDAY_AND_THURSDAY, MORNING_AND_AFTERNOON, at(1), [coversStart(at(15, 8), at(15, 7))]);
		expect(n).toStrictEqual(occurrence(15, 18, 21));
	});

	it('con la tarde cubierta, es la mañana del próximo día de ocurrencia', () => {
		const n = nextCalendarOccurrence(WEDNESDAY_AND_THURSDAY, MORNING_AND_AFTERNOON, at(1), [coversStart(at(9, 19), at(9, 18))]);
		expect(n).toStrictEqual(occurrence(15, 7, 10));
	});

	it('con el día cubierto entero, es la mañana del próximo día de ocurrencia', () => {
		const n = nextCalendarOccurrence(WEDNESDAY_AND_THURSDAY, MORNING_AND_AFTERNOON, at(1), [completion(at(15, 8), at(15))]);
		expect(n).toStrictEqual(occurrence(16, 7, 10));
	});

	it('sin completados, creada un día de ocurrencia, es la primera ventana de ese día aunque ya haya pasado', () => {
		expect(nextCalendarOccurrence(WEDNESDAY_AND_THURSDAY, MORNING_AND_AFTERNOON, at(15, 12), [])).toStrictEqual(occurrence(15, 7, 10));
	});

	it('con una ventana que empieza a las 00:00 justo después de un día cubierto entero, es esa', () => {
		const midnight: Schedule = [{ from: '00:00', to: '02:00' }];
		const n = nextCalendarOccurrence(WEDNESDAY_AND_THURSDAY, midnight, at(1), [completion(at(15, 1), at(15))]);
		expect(n).toStrictEqual(occurrence(16, 0, 2));
	});
});

describe('qué ocurrencia cubre un completado de calendario con horario (spec §5.6)', () => {
	const thursdayAfternoon9 = [coversStart(at(9, 19), at(9, 18))];

	it('en la mañana, la mañana', () => {
		expect(calendarOccurrenceThatCovers(WEDNESDAY_AND_THURSDAY, MORNING_AND_AFTERNOON, at(1), thursdayAfternoon9, at(15, 8))).toStrictEqual(at(15, 7));
	});

	it('perdida la mañana, en la tarde cubre la tarde (la mañana se descarta)', () => {
		expect(calendarOccurrenceThatCovers(WEDNESDAY_AND_THURSDAY, MORNING_AND_AFTERNOON, at(1), thursdayAfternoon9, at(15, 18, 30))).toStrictEqual(
			at(15, 18)
		);
	});

	it('atrasada entre ventanas, la más reciente sin cubrir', () => {
		expect(calendarOccurrenceThatCovers(WEDNESDAY_AND_THURSDAY, MORNING_AND_AFTERNOON, at(1), thursdayAfternoon9, at(15, 12))).toStrictEqual(at(15, 7));
	});

	it('antes de N, cubre N', () => {
		const wednesdayAfternoon = [coversStart(at(15, 19), at(15, 18))];
		const recurrence: CalendarRecurrence = { mode: 'calendario', weekdays: ['miércoles'] };
		expect(calendarOccurrenceThatCovers(recurrence, MORNING_AND_AFTERNOON, at(1), wednesdayAfternoon, at(16, 8))).toStrictEqual(at(22, 7));
	});
});

describe('relativa con varias ventanas (spec §5.7)', () => {
	it('se completa por ventana solo con más de una ventana y el intervalo en días', () => {
		expect(completesByWindow(EVERY_2_DAYS, MORNING_AND_AFTERNOON)).toBe(true);
		expect(completesByWindow(EVERY_2_DAYS, [MORNING_AND_AFTERNOON[0]])).toBe(false);
		expect(completesByWindow({ mode: 'relativo', every: 8, unit: 'horas' }, MORNING_AND_AFTERNOON)).toBe(false);
	});

	it('nunca completada, N es la primera ventana cuyo hasta es posterior a creadaEn', () => {
		expect(nextWindowOccurrence(EVERY_2_DAYS, MORNING_AND_AFTERNOON, at(13, 6), [])).toStrictEqual(occurrence(13, 7, 10));
		expect(nextWindowOccurrence(EVERY_2_DAYS, MORNING_AND_AFTERNOON, at(13, 8), [])).toStrictEqual(occurrence(13, 7, 10));
		expect(nextWindowOccurrence(EVERY_2_DAYS, MORNING_AND_AFTERNOON, at(13, 10), [])).toStrictEqual(occurrence(13, 18, 21));
		expect(nextWindowOccurrence(EVERY_2_DAYS, MORNING_AND_AFTERNOON, at(13, 21), [])).toStrictEqual(occurrence(14, 7, 10));
	});

	it('con la mañana cubierta, la ronda del día sigue', () => {
		expect(nextWindowOccurrence(EVERY_2_DAYS, MORNING_AND_AFTERNOON, at(1), [coversStart(at(13, 8), at(13, 7))])).toStrictEqual(
			occurrence(13, 18, 21)
		);
	});

	it('con la ronda completa, la primera ventana cada `cada` días', () => {
		expect(nextWindowOccurrence(EVERY_2_DAYS, MORNING_AND_AFTERNOON, at(1), [coversStart(at(13, 19), at(13, 18))])).toStrictEqual(
			occurrence(15, 7, 10)
		);
		const every3: RelativeRecurrence = { mode: 'relativo', every: 3, unit: 'dias' };
		expect(nextWindowOccurrence(every3, MORNING_AND_AFTERNOON, at(1), [coversStart(at(13, 19), at(13, 18))])).toStrictEqual(
			occurrence(16, 7, 10)
		);
	});

	it('un completado sin ocurrenciaCubierta cubre el día entero de su completadoEn', () => {
		expect(nextWindowOccurrence(EVERY_2_DAYS, MORNING_AND_AFTERNOON, at(1), [completion(at(13, 8))])).toStrictEqual(occurrence(15, 7, 10));
	});

	it('antes del cierre de N, un completado cubre N', () => {
		const mondayRound = [coversStart(at(13, 19), at(13, 18))];
		expect(windowOccurrenceThatCovers(EVERY_2_DAYS, MORNING_AND_AFTERNOON, at(1), mondayRound, at(14, 19))).toStrictEqual(at(15, 7));
		expect(windowOccurrenceThatCovers(EVERY_2_DAYS, MORNING_AND_AFTERNOON, at(1), mondayRound, at(15, 8))).toStrictEqual(at(15, 7));
	});

	it('atrasada, cubre la ventana con el inicio más reciente, de cualquier día', () => {
		const mondayRound = [coversStart(at(13, 19), at(13, 18))];
		expect(windowOccurrenceThatCovers(EVERY_2_DAYS, MORNING_AND_AFTERNOON, at(1), mondayRound, at(16, 8))).toStrictEqual(at(16, 7));
		expect(windowOccurrenceThatCovers(EVERY_2_DAYS, MORNING_AND_AFTERNOON, at(1), mondayRound, at(15, 19))).toStrictEqual(at(15, 18));
		expect(windowOccurrenceThatCovers(EVERY_2_DAYS, MORNING_AND_AFTERNOON, at(1), mondayRound, at(16, 5))).toStrictEqual(at(15, 18));
	});
});
