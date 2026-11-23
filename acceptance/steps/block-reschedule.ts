// The block rescheduling (spec §5.11, §6.1, §5.4, §7): «Reprogramar vencidas» from the ⋮ menu of Pendientes, its
// preview and its notice with Deshacer. The core decides which tasks it reschedules and what confirming writes.
import { expect } from 'vitest';
import { confirmReschedule, rescheduleEnabled, tasksToReschedule } from '../../src/lib/core/block-reschedule';
import { noticeText, rescheduleToUndo } from '../../src/lib/core/notice';
import { createRecurringCalendar } from '../../src/lib/core/create-recurring-calendar';
import { applyChange } from '../../src/lib/core/task-document';
import { recordCreation } from './create';
import { daysOf, shapeOf } from './recurring-calendar';
import { ANY_MOMENT } from './recurring-relative';
import { P, TITLE, dateHour, list } from './values';
import { minimalOn, rememberBeforeOfMyChange, tasksOf, theDoc, theTaskTitled, type Saved, type StepDefinition, type World } from './world';
import { theNoticeQueried } from './undo';

/** What the preview shows at the last queried moment: the titles, from top to bottom. */
const previews = new WeakMap<World, string[]>();

/** What was stored just before the last rescheduling, to assert that it wrote only reanudadaEn (§5.11). */
const beforeReschedule = new WeakMap<World, Saved>();

function thePreview(world: World): string[] {
	const titles = previews.get(world);
	if (!titles) throw new Error('The preview was not queried');
	return titles;
}

/** Reprogramar in the preview at `now` (§5.11): a Reanudar of every task in it, with that moment as "now", in one batch. */
function reschedule(world: World, now: Date): void {
	if (!rescheduleEnabled(tasksOf(world), world.completions, now, minimalOn(world))) return;
	rememberBeforeOfMyChange(world);
	beforeReschedule.set(world, structuredClone({ docs: world.docs, completions: world.completions }));
	const { changes, notice } = confirmReschedule(tasksOf(world), world.completions, now, minimalOn(world));
	for (const { taskId, change } of changes) world.docs = applyChange(world.docs, taskId, change);
	world.changeMoment = now;
	world.notice = notice;
}

/** A reanudadaEn already stored before any other date: it is not a change of mine. */
function resumedEarlier(world: World, title: string | undefined, moment: string): void {
	const task = title === undefined ? tasksOf(world)[0] : theTaskTitled(world, title);
	world.docs = applyChange(world.docs, task.id, { resumedAt: dateHour(moment) });
	expect(world.docs.find(({ id }) => id === task.id)?.resumedAt).toEqual(dateHour(moment));
}

/** The document of the only task or of the one with that title. */
function docOf(world: World, title: string | undefined) {
	if (title === undefined) return theDoc(world);
	const { id } = theTaskTitled(world, title);
	return world.docs.find((doc) => doc.id === id)!;
}

/** The moments at which Pendientes was last queried: the one given, or the arbitrary ones of "at any moment". */
function momentsQueried(world: World): Date[] {
	expect(world.pendingQueries.length).toBeGreaterThan(0);
	return world.pendingQueries.length === 1 ? world.statusMoments : ANY_MOMENT;
}

function enabledState(state: string): boolean {
	if (state !== 'enabled' && state !== 'disabled') throw new Error(`Invalid item state: "${state}"`);
	return state === 'enabled';
}

function itemEnabled(world: World, enabled: boolean): void {
	for (const now of momentsQueried(world)) expect(rescheduleEnabled(tasksOf(world), world.completions, now, minimalOn(world))).toBe(enabled);
}

export const blockRescheduleSteps: StepDefinition[] = [
	{
		// The shape and its connector come as two columns of the Examples («weekly» «on», «monthly» «on days»).
		pattern: new RegExp(`^a ${P} recurring task ${P} ${P} created on ${P}$`),
		run: (world, shape, connector, days, created) =>
			recordCreation(world, (id) => createRecurringCalendar({ title: 'Tarea', ...daysOf(shapeOf(`${shape} ${connector}`), days) }, id, dateHour(created)))
	},
	{
		pattern: new RegExp(`^I reschedule the overdue tasks on ${P}$`),
		run: (world, moment) => reschedule(world, dateHour(moment))
	},
	{
		// §5.11: Cancelar closes the preview and changes nothing.
		pattern: new RegExp(`^I tap Cancelar in the preview on ${P}$`),
		run: (world, moment) => {
			dateHour(moment);
			previews.delete(world);
		}
	},
	{
		pattern: new RegExp(`^I query the preview on ${P}$`),
		run: (world, moment) => {
			previews.set(world, tasksToReschedule(tasksOf(world), world.completions, dateHour(moment), minimalOn(world)).map(({ title }) => title));
		}
	},
	{
		pattern: new RegExp(`^the preview lists ${P}$`),
		run: (world, titles) => expect(thePreview(world)).toEqual(list(titles))
	},
	{
		pattern: /^the preview lists no task$/,
		run: (world) => expect(thePreview(world)).toEqual([])
	},
	{
		// §6.1: with no task in the preview, Reprogramar is disabled.
		pattern: /^the Reprogramar button is (enabled|disabled)$/,
		run: (world, state) => expect(thePreview(world).length > 0).toBe(state === 'enabled')
	},
	{
		pattern: /^the Reprogramar vencidas item is (enabled|disabled|<[A-Za-z0-9_]+>)$/,
		run: (world, state) => itemEnabled(world, enabledState(state))
	},
	{
		pattern: /^the notice offers to undo the rescheduling$/,
		run: (world) => {
			const notice = theNoticeQueried(world);
			expect(notice).toBeDefined();
			expect(noticeText(notice!)).toBe('Tareas reprogramadas');
			expect(rescheduleToUndo(notice, world.noticeQueried!.now, tasksOf(world))).toBeDefined();
		}
	},
	{
		pattern: new RegExp(`^the task was resumed earlier on ${P}$`),
		run: (world, moment) => resumedEarlier(world, undefined, moment)
	},
	{
		pattern: new RegExp(`^the task ${TITLE} was resumed earlier on ${P}$`),
		run: (world, title, moment) => resumedEarlier(world, title, moment)
	},
	{
		pattern: new RegExp(`^the task resume moment is ${P}$`),
		run: (world, moment) => expect(docOf(world, undefined).resumedAt).toEqual(dateHour(moment))
	},
	{
		pattern: new RegExp(`^the task ${TITLE} resume moment is ${P}$`),
		run: (world, title, moment) => expect(docOf(world, title).resumedAt).toEqual(dateHour(moment))
	},
	{
		pattern: new RegExp(`^the task ${TITLE} was resumed at that moment$`),
		run: (world, title) => {
			expect(world.changeMoment).toBeDefined();
			expect(docOf(world, title).resumedAt).toEqual(world.changeMoment);
		}
	},
	{
		pattern: new RegExp(`^the task ${TITLE} has no resume moment$`),
		run: (world, title) => expect(docOf(world, title)).not.toHaveProperty('resumedAt')
	},
	{
		// §5.11 (Only reanudadaEn): the stored task is what it was, except reanudadaEn, and no completion was added or deleted.
		pattern: /^only the resume moment of the task changed$/,
		run: (world) => {
			const before = beforeReschedule.get(world);
			if (!before) throw new Error('There was no rescheduling');
			const after = theDoc(world);
			const { resumedAt, ...rest } = after;
			const { resumedAt: replaced, ...restBefore } = before.docs.find(({ id }) => id === after.id)!;
			expect(resumedAt).toEqual(world.changeMoment);
			expect(rest).toStrictEqual(restBefore);
			expect(world.docs).toHaveLength(before.docs.length);
			expect(world.completions).toStrictEqual(before.completions);
		}
	}
];
