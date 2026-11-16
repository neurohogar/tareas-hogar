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
/** Puntual o periódica relativa, con o sin posposición; pausada solo la periódica. */
const task = fc
	.tuple(fc.boolean(), instant, fc.option(instant, { nil: undefined }), fc.integer({ min: 1, max: 100 }), fc.option(postponement, { nil: undefined }), fc.boolean())
	.map(([isOneOff, createdAt, dueDate, every, postponed, paused]): Task => {
		const common = { id: 't', title: 'T', createdAt, ...(postponed && { postponed }) };
		if (isOneOff) return { ...common, kind: 'puntual', ...(dueDate && { dueDate }) };
		return { ...common, kind: 'periodica', recurrence: { mode: 'relativo', every, unit: 'dias' }, ...(paused && { paused }) };
	});
const withoutPostponement = ({ postponed: _, ...rest }: Task): Task => rest;

describe('posponer (propiedades, spec §5.9)', () => {
	it('desde es ahora y hasta es posterior, a lo sumo en un día y medio', () => {
		fc.assert(
			fc.property(option, instant, (o, now) => {
				const { from, to } = postpone(o, now).postponed!;
				expect(from).toEqual(now);
				expect(to.getTime()).toBeGreaterThan(now.getTime());
				expect(to.getTime() - now.getTime()).toBeLessThanOrEqual(32 * 60 * 60 * 1000);
			})
		);
	});

	it('posponer escribe el campo entero y quitar posponer lo borra', () => {
		fc.assert(
			fc.property(task, option, instant, (t, o, now) => {
				const postponed = applyChange([t], 't', postpone(o, now));
				expect(taskFromDocument(postponed[0]).postponed).toEqual(postpone(o, now).postponed);
				expect(taskFromDocument(applyChange(postponed, 't', removePostpone())[0]).postponed).toBeUndefined();
			})
		);
	});
});

describe('estado de una pospuesta (propiedades, spec §5.9)', () => {
	it('vencida (ahora >= hasta), no cambia nada del estado', () => {
		fc.assert(
			fc.property(task, instant, (t, now) => {
				fc.pre(t.postponed !== undefined && now.getTime() >= t.postponed.to.getTime());
				expect(taskStatus(t, [], now)).toEqual(taskStatus(withoutPostponement(t), [], now));
			})
		);
	});

	it('vigente, solo cambia pendiente o atrasada, que pasan a en espera con progreso en [0, 1)', () => {
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

	it('el progreso nunca baja al avanzar el reloj', () => {
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

describe('panel de una pospuesta (propiedades, spec §6.2)', () => {
	it('con una posposición vigente ofrece Quitar posponer y muestra el texto; sin ella, no hay texto', () => {
		fc.assert(
			fc.property(task, instant, (t, now) => {
				const active = activePostponement(t, now) !== undefined;
				expect(postponeAction(t, [], now) === 'quitar').toBe(active);
				expect(postponementText(t, now) !== undefined).toBe(active);
			})
		);
	});

	it('una pausada sin posposición vigente no ofrece Posponer', () => {
		fc.assert(
			fc.property(task, instant, (t, now) => {
				fc.pre(t.kind === 'periodica' && t.paused === true && activePostponement(t, now) === undefined);
				expect(postponeAction(t, [], now)).toBeUndefined();
			})
		);
	});
});
