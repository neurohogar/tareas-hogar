// Spec §6.1 (Fecha y distancia): invariants of the text «Tocaba …» / «Vuelve …».
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { taskStatus } from './task-status';
import { WEEKDAYS, type Completion, type Schedule, type Recurrence, type Task } from './task';
import { datePhrase } from './date-text';
import { dateText } from './task-date-text';
import { dueInstant, returnInstant } from './date-text-instants';

const MINUTE = 60_000;
const DAY = 86_400_000;
/** A local moment between 2020 and ~2030, at a whole minute. */
const moment = fc.integer({ min: 0, max: 5_000_000 }).map((n) => new Date(2020, 0, 1, 0, n * 2));
const verb = fc.constantFrom('Tocaba' as const, 'Vuelve' as const);

describe('dateText (properties)', () => {
	it('starts with the verb, never says «en 0 …» and is a pure function of its inputs', () => {
		fc.assert(
			fc.property(verb, moment, moment, (v, instant, now) => {
				const phrase = datePhrase(v, instant, now);
				expect(phrase.startsWith(`${v} `)).toBe(true);
				expect(phrase).not.toMatch(/ · (en|hace) 0 /);
				expect(datePhrase(v, new Date(instant), new Date(now))).toBe(phrase);
			})
		);
	});

	it('the past never says «en N» and the future never says «hace N»', () => {
		fc.assert(
			fc.property(verb, moment, fc.integer({ min: -400 * 24 * 60, max: 400 * 24 * 60 }), (v, now, minutes) => {
				const instant = new Date(now.getTime() + minutes * MINUTE);
				const phrase = datePhrase(v, instant, now);
				if (minutes <= 0) expect(phrase).not.toMatch(/ · en /);
				if (minutes >= 0) expect(phrase).not.toMatch(/ · hace /);
			})
		);
	});

	it('S16: the past under a minute with a time ends in « · ahora»', () => {
		fc.assert(
			fc.property(verb, moment, fc.integer({ min: 0, max: MINUTE - 1 }), (v, now, ms) => {
				const instant = new Date(now.getTime() - ms);
				fc.pre(instant.getTime() !== new Date(instant.getFullYear(), instant.getMonth(), instant.getDate()).getTime());
				const phrase = datePhrase(v, instant, now);
				expect(phrase.endsWith(' · ahora')).toBe(true);
				expect(phrase).not.toMatch(/hace 0/);
			})
		);
	});

	it('S16: the future under a minute never says «en 0» and rounds to «en 1 minuto»', () => {
		fc.assert(
			fc.property(verb, moment, fc.integer({ min: 1, max: MINUTE }), (v, now, ms) => {
				const instant = new Date(now.getTime() + ms);
				fc.pre(instant.getTime() !== new Date(instant.getFullYear(), instant.getMonth(), instant.getDate()).getTime());
				const phrase = datePhrase(v, instant, now);
				expect(phrase).not.toMatch(/en 0/);
				expect(phrase.endsWith(' · en 1 minuto')).toBe(true);
			})
		);
	});

	it('«el» goes only before the date with a weekday', () => {
		fc.assert(
			fc.property(verb, moment, moment, (v, instant, now) => {
				const phrase = datePhrase(v, instant, now);
				const withWord = /^(Tocaba|Vuelve) (hoy|ayer|mañana)\b/.test(phrase);
				expect(/^(Tocaba|Vuelve) el /.test(phrase)).toBe(!withWord);
			})
		);
	});

	it('with hoy, ayer or mañana and without a time there is no distance', () => {
		fc.assert(
			fc.property(verb, moment, fc.integer({ min: -1, max: 1 }), (v, now, days) => {
				const instant = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
				expect(datePhrase(v, instant, now)).not.toContain('·');
			})
		);
	});
});

const randomSchedule = fc.option(
	fc.constantFrom<Schedule>([{ from: '08:00', to: '11:00' }], [{ from: '06:00', to: '07:00' }, { from: '18:00', to: '20:00' }]),
	{ nil: undefined }
);
const recurrence = fc.oneof(
	fc.record({ mode: fc.constant('relativo' as const), every: fc.integer({ min: 1, max: 10 }), unit: fc.constantFrom('horas' as const, 'dias' as const) }),
	fc.uniqueArray(fc.constantFrom(...WEEKDAYS), { minLength: 1, maxLength: 7 }).map((days): Recurrence => ({
		mode: 'calendario',
		weekdays: WEEKDAYS.filter((d) => days.includes(d))
	})),
	fc.uniqueArray(fc.integer({ min: 1, max: 31 }), { minLength: 1, maxLength: 5 }).map((days): Recurrence => ({ mode: 'calendario', monthDays: days.sort((a, b) => a - b) }))
);
const scenario = fc.record({
	created: moment,
	schedule: randomSchedule,
	kind: fc.oneof(
		recurrence.map((r) => ({ recurrence: r, limit: undefined as number | undefined })),
		fc.option(fc.integer({ min: -5, max: 30 }), { nil: undefined }).map((limit) => ({ recurrence: undefined, limit }))
	),
	completedAfter: fc.option(fc.integer({ min: 0, max: 20 * DAY }), { nil: undefined }),
	after: fc.integer({ min: 0, max: 40 * DAY })
});

type Scenario = typeof scenario extends fc.Arbitrary<infer T> ? T : never;

function assemble(e: Scenario) {
	const base = { id: 't', title: 'T', createdAt: e.created, ...(e.schedule && { schedule: e.schedule }) };
	const { recurrence: r, limit } = e.kind;
	const task: Task = r
		? { ...base, kind: 'periodica', recurrence: r }
		: { ...base, kind: 'puntual', ...(limit !== undefined && { dueDate: new Date(e.created.getFullYear(), e.created.getMonth(), e.created.getDate() + limit) }) };
	const completions: Completion[] =
		e.completedAfter === undefined ? [] : [{ id: 'c', taskId: 't', completedAt: new Date(e.created.getTime() + e.completedAfter) }];
	const now = new Date(e.created.getTime() + e.after);
	return { task, completions, now, status: taskStatus(task, completions, now) };
}

describe('task date text (properties)', () => {
	it('«Tocaba» never names a future instant: the instant is <= now and the text does not say «en N»', () => {
		fc.assert(
			fc.property(scenario, (e) => {
				const { task, completions, now, status } = assemble(e);
				fc.pre(status.kind === 'atrasada');
				const wasDue = dueInstant(task, completions, now);
				if (wasDue) expect(wasDue.getTime()).toBeLessThanOrEqual(now.getTime());
				const text = dateText(task, completions, status, now);
				expect(text === undefined || (text.startsWith('Tocaba ') && !text.includes(' · en '))).toBe(true);
			})
		);
	});

	it('«Vuelve» names an instant after now and the text does not say «hace N»', () => {
		fc.assert(
			fc.property(scenario, (e) => {
				const { task, completions, now, status } = assemble(e);
				fc.pre(status.kind === 'en espera');
				expect(returnInstant(task, completions, status, now).getTime()).toBeGreaterThan(now.getTime());
				const text = dateText(task, completions, status, now) as string;
				expect(text.startsWith('Vuelve ')).toBe(true);
				expect(text).not.toContain(' · hace ');
			})
		);
	});

	it('a pending one carries no text and the text is a pure function of now', () => {
		fc.assert(
			fc.property(scenario, (e) => {
				const { task, completions, now, status } = assemble(e);
				if (status.kind === 'pendiente') expect(dateText(task, completions, status, now)).toBeUndefined();
				const other = new Date(now);
				expect(dateText(task, completions, taskStatus(task, completions, other), other)).toBe(dateText(task, completions, status, now));
			})
		);
	});
});
