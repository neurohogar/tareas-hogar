import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { applyChange, taskFromDocument } from './task-document';
import { taskStatus } from './task-status';
import { postponeAction, postponementText } from './postponement-in-panel';
import { POSTPONE_OPTIONS, postpone, removePostpone } from './postponement';
import { activePostponement } from './active-postponement';
import type { Task } from './task';

const instant = fc.integer({ min: 0, max: 4_000_000_000_000 }).map((ms) => new Date(ms));
const option = fc.constantFrom(...POSTPONE_OPTIONS.map(({ option }) => option));
const postponement = fc
	.tuple(instant, fc.integer({ min: 1, max: 100_000_000 }))
	.map(([from, duration]) => ({ from, to: new Date(from.getTime() + duration) }));
/** One-off or relative recurring, with or without postponement; paused only the recurring one. */
const task = fc
	.tuple(fc.boolean(), instant, fc.option(instant, { nil: undefined }), fc.integer({ min: 1, max: 100 }), fc.option(postponement, { nil: undefined }), fc.boolean())
	.map(([isOneOff, createdAt, dueDate, every, postponed, paused]): Task => {
		const common = { id: 't', title: 'T', createdAt, ...(postponed && { postponed }) };
		if (isOneOff) return { ...common, kind: 'puntual', ...(dueDate && { dueDate }) };
		return { ...common, kind: 'periodica', recurrence: { mode: 'relativo', every, unit: 'dias' }, ...(paused && { paused }) };
	});
const withoutPostponement = ({ postponed: _, ...rest }: Task): Task => rest;

describe('postpone (properties, spec §5.9)', () => {
	it('from is now and to is later, at most a day and a half', () => {
		fc.assert(
			fc.property(option, instant, (o, now) => {
				const { from, to } = postpone(o, now).postponed!;
				expect(from).toEqual(now);
				expect(to.getTime()).toBeGreaterThan(now.getTime());
				expect(to.getTime() - now.getTime()).toBeLessThanOrEqual(32 * 60 * 60 * 1000);
			})
		);
	});

	it('postponing writes the whole field and removing the postponement deletes it', () => {
		fc.assert(
			fc.property(task, option, instant, (t, o, now) => {
				const postponed = applyChange([t], 't', postpone(o, now));
				expect(taskFromDocument(postponed[0]).postponed).toEqual(postpone(o, now).postponed);
				expect(taskFromDocument(applyChange(postponed, 't', removePostpone())[0]).postponed).toBeUndefined();
			})
		);
	});
});

describe('status of a postponed task (properties, spec §5.9)', () => {
	it('expired (now >= to), it changes nothing about the status', () => {
		fc.assert(
			fc.property(task, instant, (t, now) => {
				fc.pre(t.postponed !== undefined && now.getTime() >= t.postponed.to.getTime());
				expect(taskStatus(t, [], now)).toEqual(taskStatus(withoutPostponement(t), [], now));
			})
		);
	});

	it('active, it only changes pending or overdue, which become waiting with progress in [0, 1)', () => {
		fc.assert(
			fc.property(task, instant, (t, now) => {
				fc.pre(activePostponement(t, now) !== undefined);
				const own = taskStatus(withoutPostponement(t), [], now);
				const status = taskStatus(t, [], now);
				if (own.kind !== 'pendiente' && own.kind !== 'atrasada') {
					expect(status).toEqual(own);
				} else {
					expect(status).toMatchObject({ kind: 'en espera' });
					const { progress } = status as { progress: number };
					expect(progress).toBeGreaterThanOrEqual(0);
					expect(progress).toBeLessThan(1);
				}
			})
		);
	});

	it('the progress never goes down as the clock advances', () => {
		fc.assert(
			fc.property(postponement, instant, fc.integer({ min: 0, max: 100_000_000 }), (postponed, now, jump) => {
				const t: Task = { id: 't', title: 'T', kind: 'puntual', createdAt: new Date(0), postponed };
				const before = taskStatus(t, [], now);
				const after = taskStatus(t, [], new Date(now.getTime() + jump));
				fc.pre(before.kind === 'en espera' && after.kind === 'en espera');
				expect((after as { progress: number }).progress).toBeGreaterThanOrEqual((before as { progress: number }).progress);
			})
		);
	});
});

describe('panel of a postponed task (properties, spec §6.2)', () => {
	it('with an active postponement it offers Quitar posponer and shows the text; without it, there is no text', () => {
		fc.assert(
			fc.property(task, instant, (t, now) => {
				const active = activePostponement(t, now) !== undefined;
				expect(postponeAction(t, [], now) === 'quitar').toBe(active);
				expect(postponementText(t, now) !== undefined).toBe(active);
			})
		);
	});

	it('a paused one without an active postponement does not offer Posponer', () => {
		fc.assert(
			fc.property(task, instant, (t, now) => {
				fc.pre(t.kind === 'periodica' && t.paused === true && activePostponement(t, now) === undefined);
				expect(postponeAction(t, [], now)).toBeUndefined();
			})
		);
	});
});
