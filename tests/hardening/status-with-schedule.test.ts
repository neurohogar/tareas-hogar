import { describe, expect, it } from 'vitest';
import { recurringStatusWithSchedule, deadlinesFromMoments } from '../../src/lib/core/status-with-schedule';

const schedule = [{ from: '08:00', to: '11:00' }];

describe('recurringStatusWithSchedule: overdue without schedule at instant 0', () => {
	it('an overdue without schedule at instant 0 counts as overdue (not as absent)', () => {
		const moments = { becomesPending: new Date(1970, 0, 1, 9, 0).getTime(), waitStart: 0, overdueWithoutSchedule: 0 };
		expect(recurringStatusWithSchedule(deadlinesFromMoments(schedule, moments), new Date(1970, 0, 1, 9, 30))).toEqual({ kind: 'atrasada' });
	});
});
