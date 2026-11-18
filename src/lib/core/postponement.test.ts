import { describe, expect, it } from 'vitest';
import { POSTPONE_OPTIONS, postpone, removePostpone } from './postponement';

describe('postpone (spec §5.9)', () => {
	it('1 hora and 3 horas add to the moment, with the seconds', () => {
		const now = new Date(2026, 6, 15, 10, 15, 30);

		expect(postpone('1 hora', now)).toStrictEqual({ postponed: { from: now, to: new Date(2026, 6, 15, 11, 15, 30) } });
		expect(postpone('3 horas', now)).toStrictEqual({ postponed: { from: now, to: new Date(2026, 6, 15, 13, 15, 30) } });
	});

	it('the hours cross midnight and the end of the month', () => {
		const now = new Date(2026, 6, 31, 22, 30, 0);

		expect(postpone('3 horas', now).postponed).toStrictEqual({ from: now, to: new Date(2026, 7, 1, 1, 30, 0) });
	});

	it.each([
		['by day', new Date(2026, 6, 15, 10, 0, 0), new Date(2026, 6, 16, 7, 0, 0)],
		['in the early hours: it is not at 07:00 today', new Date(2026, 6, 15, 0, 30, 0), new Date(2026, 6, 16, 7, 0, 0)],
		['the last second of the day', new Date(2026, 6, 15, 23, 59, 59), new Date(2026, 6, 16, 7, 0, 0)],
		['the last day of the year', new Date(2026, 11, 31, 8, 0, 0), new Date(2027, 0, 1, 7, 0, 0)]
	])('the "hasta mañana" option is at 07:00 of the next day: %s', (_, now, to) => {
		expect(postpone('hasta mañana', now)).toStrictEqual({ postponed: { from: now, to } });
	});

	it('offers the three options, with their panel text', () => {
		expect(POSTPONE_OPTIONS).toStrictEqual([
			{ option: '1 hora', label: '1 hora' },
			{ option: '3 horas', label: '3 horas' },
			{ option: 'hasta mañana', label: 'Hasta mañana' }
		]);
	});
});

describe('removePostpone (spec §5.9)', () => {
	it('deletes postponed', () => {
		expect(removePostpone()).toStrictEqual({ postponed: null });
	});
});
