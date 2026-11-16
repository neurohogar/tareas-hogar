// Spec §5.3: qué ocurrencia cubre cada completado, ejercitado a través de `completar`.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { complete } from './completions';
import { startOfDay, addDays } from './days';
import { recurringCalendarStatus } from './recurring-calendar-status';
import { lastCoveredOccurrence } from './covered-occurrence';
import { isOccurrence, firstLaterOccurrence } from './occurrences';
import { WEEKDAYS, type Completion, type CalendarRecurrence, type RecurringTask } from './task';

const HOUR_MS = 3_600_000;
const recurrence: fc.Arbitrary<CalendarRecurrence> = fc.oneof(
	fc.subarray([...WEEKDAYS], { minLength: 1 }).map((d) => ({ mode: 'calendario' as const, weekdays: d })),
	fc
		.uniqueArray(fc.integer({ min: 1, max: 31 }), { minLength: 1, maxLength: 6 })
		.map((d) => ({ mode: 'calendario' as const, monthDays: d.sort((a, b) => a - b) }))
);
const task = fc
	.tuple(recurrence, fc.integer({ min: 0, max: 30_000 }), fc.integer({ min: 0, max: 23 }))
	.map(
		([r, day, hour]): RecurringTask => ({
			id: 't',
			title: 'T',
			kind: 'periodica',
			recurrence: r,
			createdAt: new Date(1990, 0, 1 + day, hour)
		})
	);
/** Momentos relativos a creadaEn, en horas: hasta ~4 meses después (y alguno antes, otro reloj). */
const shifts = fc.array(fc.integer({ min: -48, max: 3_000 }), { maxLength: 12 });
const inHours = (t: RecurringTask, hours: number) => new Date(t.createdAt.getTime() + hours * HOUR_MS);

/** Completa la tarea en cada momento, en ese orden, como lo haría la app. */
function completeAt(t: RecurringTask, moments: readonly Date[]): Completion[] {
	return moments.reduce<Completion[]>((cs, m) => [...cs, complete(t, cs, `c${cs.length}`, m)], []);
}
const lastCoveredOf = (t: RecurringTask, cs: readonly Completion[]) => lastCoveredOccurrence(t.createdAt, cs);
const r = (t: RecurringTask) => t.recurrence as CalendarRecurrence;

describe('ocurrencia cubierta (propiedades)', () => {
	it('cubre siempre una ocurrencia real del patrón, a las 00:00 locales', () => {
		fc.assert(
			fc.property(task, shifts, (t, hours) => {
				for (const c of completeAt(t, hours.map((h) => inHours(t, h)))) {
					const covered = c.coveredOccurrence as Date;
					expect(startOfDay(covered)).toEqual(covered);
					expect(isOccurrence(r(t), covered)).toBe(true);
				}
			})
		);
	});

	it('P solo crece: cada completado nuevo cubre una ocurrencia posterior a P', () => {
		fc.assert(
			fc.property(task, shifts, (t, hours) => {
				const cs = completeAt(t, hours.map((h) => inHours(t, h)));
				cs.forEach((c, i) => {
					expect((c.coveredOccurrence as Date) > lastCoveredOf(t, cs.slice(0, i))).toBe(true);
				});
			})
		);
	});

	it('completar k veces sin atrasos (cada vez el día N) cubre k ocurrencias consecutivas', () => {
		fc.assert(
			fc.property(task, fc.array(fc.integer({ min: 0, max: 23 }), { minLength: 1, maxLength: 10 }), (t, hoursOfDay) => {
				let expectedValue = addDays(startOfDay(t.createdAt), -1);
				const cs: Completion[] = [];
				for (const hour of hoursOfDay) {
					expectedValue = firstLaterOccurrence(r(t), expectedValue);
					const now = new Date(expectedValue.getTime() + hour * HOUR_MS);
					expect(recurringCalendarStatus(r(t), t.createdAt, cs, now).kind).toBe('pendiente');
					cs.push(complete(t, cs, `c${cs.length}`, now));
					expect(cs.at(-1)?.coveredOccurrence).toEqual(expectedValue);
				}
			})
		);
	});

	it('cada completado extra en el mismo momento avanza exactamente una ocurrencia', () => {
		fc.assert(
			fc.property(task, shifts, fc.integer({ min: 0, max: 3_000 }), fc.integer({ min: 2, max: 6 }), (t, hours, h, extras) => {
				const now = inHours(t, h);
				const priorCount = hours.length;
				const cs = completeAt(t, [...hours.map((x) => inHours(t, x)), ...Array<Date>(extras).fill(now)]);
				for (let i = priorCount + 1; i < cs.length; i++)
					expect(cs[i].coveredOccurrence).toEqual(firstLaterOccurrence(r(t), cs[i - 1].coveredOccurrence as Date));
			})
		);
	});

	it('el orden de los completados guardados no cambia la ocurrencia que cubre el siguiente', () => {
		const withPermutation = fc
			.tuple(task, shifts)
			.map(([t, hours]) => [t, completeAt(t, hours.map((h) => inHours(t, h)))] as const)
			.chain(([t, cs]) => fc.shuffledSubarray(cs, { minLength: cs.length }).map((another) => [t, cs, another] as const));
		fc.assert(
			fc.property(withPermutation, fc.integer({ min: -48, max: 3_000 }), ([t, cs, another], h) => {
				const now = inHours(t, h);
				expect(complete(t, another, 'x', now)).toEqual(complete(t, cs, 'x', now));
			})
		);
	});

	it('después de completar, en ese mismo momento la tarea queda en espera', () => {
		fc.assert(
			fc.property(task, shifts, fc.integer({ min: 0, max: 3_000 }), (t, hours, h) => {
				const now = inHours(t, Math.max(h, ...hours));
				const cs = completeAt(t, [...hours.map((x) => inHours(t, x)), now]);
				expect(recurringCalendarStatus(r(t), t.createdAt, cs, now)).toEqual({ kind: 'en espera', progress: 0 });
			})
		);
	});
});

describe('P con completados de antes de ser de calendario (propiedades)', () => {
	/** Completados mezclados: de calendario (con ocurrenciaCubierta) y de cuando era relativa o puntual (sin ella). */
	const completions = fc.array(
		fc.record(
			{
				id: fc.uuid(),
				taskId: fc.constant('t'),
				completedAt: fc.date({ min: new Date(1990, 0, 1), max: new Date(2100, 0, 1), noInvalidDate: true }),
				coveredOccurrence: fc
					.date({ min: new Date(1990, 0, 1), max: new Date(2100, 0, 1), noInvalidDate: true })
					.map(startOfDay)
			},
			{ requiredKeys: ['id', 'taskId', 'completedAt'] }
		),
		{ minLength: 1, maxLength: 8 }
	);
	/** Los completados de estas propiedades cubren fechas (sin hora). */
	const dayOf = (c: Completion) => (c.coveredOccurrence as Date | undefined) ?? startOfDay(c.completedAt);
	const created = new Date(1990, 0, 1);

	it('P es el día cubierto por alguno de ellos y ninguno cubre uno posterior', () => {
		fc.assert(
			fc.property(completions, (cs) => {
				const p = lastCoveredOccurrence(created, cs);
				expect(cs.some((c) => dayOf(c).getTime() === p.getTime())).toBe(true);
				expect(cs.every((c) => dayOf(c).getTime() <= p.getTime())).toBe(true);
				expect(startOfDay(p)).toEqual(p);
			})
		);
	});

	it('P no depende del orden de los completados', () => {
		fc.assert(
			fc.property(completions, (cs) => {
				expect(lastCoveredOccurrence(created, [...cs].reverse())).toEqual(lastCoveredOccurrence(created, cs));
			})
		);
	});

	it('un completado más nunca baja P', () => {
		fc.assert(
			fc.property(completions, completions, (cs, more) => {
				const before = lastCoveredOccurrence(created, cs);
				expect(lastCoveredOccurrence(created, [...cs, more[0]]).getTime()).toBeGreaterThanOrEqual(before.getTime());
			})
		);
	});
});
