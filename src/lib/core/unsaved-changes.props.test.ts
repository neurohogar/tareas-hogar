// Spec §6.2 (Unsaved changes): has changes is a single definition, measured against the values on opening.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { hasChanges, type PanelForm } from './unsaved-changes';
import type { TaskData } from './task-data';

/** What the panel loads, valid or not: the definition does not depend on Save succeeding. */
const data: fc.Arbitrary<TaskData> = fc.oneof(
	fc.record({ shape: fc.constant('puntual' as const), title: fc.string({ maxLength: 6 }), note: fc.option(fc.string({ maxLength: 6 }), { nil: undefined }) }),
	fc.record({ shape: fc.constant('relativa' as const), title: fc.string({ maxLength: 6 }), every: fc.integer({ min: 0, max: 50 }), unit: fc.constantFrom('horas' as const, 'dias' as const) }),
	fc.record({ shape: fc.constant('calendario' as const), title: fc.string({ maxLength: 6 }), weekdays: fc.constantFrom([], ['lunes' as const]), monthDays: fc.constantFrom([], [3, 17]) })
);
const values: fc.Arbitrary<PanelForm> = fc.record({ data });

describe('hasChanges: properties (spec §6.2)', () => {
	it('a panel that stays as it was opened has no changes', () => {
		fc.assert(fc.property(values, (v) => {
			expect(hasChanges(v, { ...v })).toBe(false);
		}));
	});

	it('measuring backwards gives the same: the difference is symmetric', () => {
		fc.assert(fc.property(values, values, (a, b) => {
			expect(hasChanges(a, b)).toBe(hasChanges(b, a));
		}));
	});

	it('a title that Save would store differently is always a change, without exceptions', () => {
		fc.assert(fc.property(values, fc.stringMatching(/^[a-z]{1,6}$/), (v, extra) => {
			expect(hasChanges(v, { data: { ...v.data, title: `${v.data.title.trim()}${extra}` } })).toBe(true);
		}));
	});

	it('the spaces around the title, which Save trims, do not count', () => {
		fc.assert(fc.property(values, (v) => {
			expect(hasChanges(v, { data: { ...v.data, title: `  ${v.data.title}\t` } })).toBe(false);
		}));
	});
});

describe('hasChanges without labels or effort (properties, spec §6.2)', () => {
	it('a value of labels or of effort in the data does not change the answer', () => {
		const legacy = fc.record({ etiquetas: fc.array(fc.string({ maxLength: 3 }), { maxLength: 3 }), esfuerzo: fc.constantFrom('rapida', 'media', 'larga') });
		fc.assert(fc.property(values, values, legacy, (a, b, extra) => {
			const withExtra = { data: { ...b.data, ...extra } as TaskData };
			expect(hasChanges(a, withExtra)).toBe(hasChanges(a, b));
		}));
	});
});
