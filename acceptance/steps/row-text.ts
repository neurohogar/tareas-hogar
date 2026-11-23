// The date text of the Pendientes row («Tocaba …», «Vuelve …», spec §6.1) and the
// return of the completion notice (§5.4).
import { expect } from 'vitest';
import { noticeReturn } from '../../src/lib/core/notice';
import { queriedCompletionNotice } from './undo';
import { P, TITLE } from './values';
import { theTask, type World, type StepDefinition } from './world';

/** The return the queried notice states, which has to be visible and name the task. */
function completionReturn(world: World): string | undefined {
	if (!world.noticeQueried) throw new Error('The notice was not queried');
	const notice = queriedCompletionNotice(world);
	expect(notice?.name).toBe(theTask(world).title);
	return notice && noticeReturn(notice, world.noticeQueried.now);
}

/** At each queried moment, the list has a single row and its date text is `text`. */
function theRowShowsText(world: World, text: string | undefined): void {
	expect(world.pendingQueries.length).toBeGreaterThan(0);
	for (const rows of world.pendingQueries) {
		expect(rows).toHaveLength(1);
		expect(rows[0].dateText).toBe(text);
	}
}

export const rowTextSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^the task row shows the text ${P}$`),
		run: (world, text) => theRowShowsText(world, text)
	},
	{
		pattern: new RegExp(`^the row of ${TITLE} shows the text ${P}$`),
		run: (world, title, text) => {
			expect(world.pendingQueries.length).toBeGreaterThan(0);
			for (const rows of world.pendingQueries) {
				const ofTitle = rows.filter((row) => row.title === title);
				expect(ofTitle).toHaveLength(1);
				expect(ofTitle[0].dateText).toBe(text);
			}
		}
	},
	{
		pattern: /^the task row shows no date text$/,
		run: (world) => theRowShowsText(world, undefined)
	},
	{
		pattern: new RegExp(`^the completion notice shows the return ${P}$`),
		run: (world, returned) => expect(completionReturn(world)).toBe(returned)
	},
	{
		pattern: /^the completion notice shows no return$/,
		run: (world) => expect(completionReturn(world)).toBeUndefined()
	}
];
