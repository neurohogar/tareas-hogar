// Spec §4.1 (Minimal version), §5.4, §6.1, §6.3: properties of the minimal version.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { noticeOnComplete, noticeText } from './notice';
import { checkboxAction } from './checkbox';
import { classifyInPending } from './completed';
import { complete } from './completions';
import { taskData } from './task-data';
import { edit } from './editing';
import { taskStatus } from './task-status';
import { history } from './history';
import { changeOnDeleteCompletion, changeOnComplete } from './current-step';
import { stepItIsOn } from './steps';
import type { Completion, Schedule, Task } from './task';
import { doTheMinimal, minimalLine } from './minimal-version';

const instant = fc.integer({ min: 0, max: 4_102_444_800_000 }).map((ms) => new Date(ms));
const day = fc.integer({ min: 0, max: 47_000 }).map((n) => new Date(1970, 0, 1 + n));
const textWithLetters = fc.stringMatching(/^[a-zA-Z]{1,10}$/);
const timeWindow = fc.constantFrom<Schedule | undefined>([{ from: '08:00', to: '12:00' }], [{ from: '00:00', to: '06:00' }], undefined);
const taskWithMinimal = fc
	.record({
		kind: fc.constantFrom('puntual' as const, 'relativa' as const, 'calendario' as const),
		createdAt: day,
		schedule: timeWindow,
		minimalVersion: fc.option(textWithLetters, { nil: undefined }),
		steps: fc.array(textWithLetters, { maxLength: 3 }),
		currentStep: fc.integer({ min: 2, max: 4 })
	})
	.map(({ kind, createdAt, schedule, minimalVersion, steps, currentStep }): Task => {
		const common = { id: 't', title: 'T', createdAt, ...(schedule && { schedule }), ...(minimalVersion && { minimalVersion }), ...(steps.length > 0 && { steps, currentStep }) };
		if (kind === 'puntual') return { ...common, kind: 'puntual' };
		const recurrence = kind === 'relativa' ? { mode: 'relativo' as const, every: 2, unit: 'dias' as const } : { mode: 'calendario' as const, monthDays: [1, 15] };
		return { ...common, kind: 'periodica', recurrence };
	});
const completions = fc
	.array(fc.tuple(fc.constantFrom('t', 'otra'), instant), { maxLength: 4 })
	.map((list) => list.map(([taskId, completedAt], i): Completion => ({ id: `c${i}`, taskId, completedAt })));

describe('minimal version (properties)', () => {
	it('looking at the minimal version changes neither the task, the completions nor its status', () => {
		fc.assert(
			fc.property(taskWithMinimal, completions, instant, (t, doneOnes, now) => {
				const before = structuredClone({ t, doneOnes, status: taskStatus(t, doneOnes, now) });
				const status = classifyInPending(t, doneOnes, now).status;
				minimalLine(t, status, doneOnes, now);
				doTheMinimal(t, doneOnes, 'n', now);
				expect(structuredClone({ t, doneOnes, status: taskStatus(t, doneOnes, now) })).toEqual(before);
			})
		);
	});

	it('doTheMinimal offers something only with a minimal version, a pending or overdue row and an enabled checkbox', () => {
		fc.assert(
			fc.property(taskWithMinimal, completions, instant, (t, doneOnes, now) => {
				const status = taskStatus(t, doneOnes, now);
				const doneItem = doTheMinimal(t, doneOnes, 'n', now);
				const shouldOffer = t.minimalVersion !== undefined && (status.kind === 'pendiente' || status.kind === 'atrasada') && checkboxAction(t, doneOnes, now).kind === 'completar';
				expect(doneItem !== undefined).toBe(shouldOffer);
			})
		);
	});

	it('the minimal line is «Mínima: » plus the full text, and only with a minimal version', () => {
		fc.assert(
			fc.property(taskWithMinimal, completions, instant, (t, doneOnes, now) => {
				const { status } = classifyInPending(t, doneOnes, now);
				const line = minimalLine(t, status, doneOnes, now);
				if (t.minimalVersion === undefined) expect(line).toBeUndefined();
				else if (line) expect(line.text).toBe(`Mínima: ${t.minimalVersion}`);
			})
		);
	});

	it('completing with the minimal version leaves the same status as the checkbox, and is told apart only by wasMinimal', () => {
		fc.assert(
			fc.property(taskWithMinimal, completions, instant, (t, doneOnes, now) => {
				const minimal = doTheMinimal(t, doneOnes, 'n', now);
				fc.pre(minimal !== undefined);
				const whole = complete(t, doneOnes, 'n', now);
				expect(minimal).toEqual({ ...whole, wasMinimal: true });
				expect(taskStatus(t, [...doneOnes, minimal!], now)).toEqual(taskStatus(t, [...doneOnes, whole], now));
			})
		);
	});

	it('a full completion never carries wasMinimal', () => {
		fc.assert(
			fc.property(taskWithMinimal, completions, instant, (t, doneOnes, now) => {
				expect('wasMinimal' in complete(t, doneOnes, 'n', now)).toBe(false);
				expect('wasMinimal' in complete(t, doneOnes, 'n', now, false)).toBe(false);
				expect(complete(t, doneOnes, 'n', now, true).wasMinimal).toBe(true);
			})
		);
	});

	it('completing with the minimal version and undoing returns the same current step', () => {
		fc.assert(
			fc.property(taskWithMinimal, instant, (t, now) => {
				const minimal = doTheMinimal(t, [], 'n', now);
				fc.pre(minimal !== undefined);
				const onComplete = changeOnComplete(t);
				const isComplete: Task = { ...t, ...(onComplete.currentStep === null ? { currentStep: undefined } : onComplete) } as Task;
				const undoneItem = { ...isComplete, ...changeOnDeleteCompletion(isComplete, [minimal!], minimal!) } as Task;
				expect(stepItIsOn(undoneItem)).toBe(stepItIsOn(t));
			})
		);
	});

	it('the notice and History text ends in «mínima»/«Mínima» only if it was the minimal version', () => {
		fc.assert(
			fc.property(taskWithMinimal, instant, fc.boolean(), (t, now, wasMinimal) => {
				const completion = complete(t, [], 'n', now, wasMinimal);
				expect(noticeText(noticeOnComplete(t, completion)).endsWith(' · mínima')).toBe(wasMinimal);
				const { timeText, hour } = history([t], [completion], now)[0].entries[0];
				expect(timeText.endsWith(' Mínima')).toBe(wasMinimal);
				expect(timeText).toBe(wasMinimal ? `${hour} Mínima` : hour);
			})
		);
	});

	it('editing writes minimalVersion only if it changed', () => {
		fc.assert(
			fc.property(taskWithMinimal, fc.option(textWithLetters, { nil: undefined }), (t, newLabel) => {
				const data = taskData(t);
				const result = edit(t, { ...data, minimalVersion: newLabel ?? '' });
				fc.pre(result.ok);
				if (!result.ok) return;
				expect('minimalVersion' in result.change).toBe(newLabel !== t.minimalVersion);
				const unchanged = edit(t, data);
				if (unchanged.ok) expect('minimalVersion' in unchanged.change).toBe(false);
			})
		);
	});
});
