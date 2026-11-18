// The date text of the Pendientes row («Tocaba …», «Vuelve …», spec §6.1) and the
// return of the completion notice (§5.4).
import { expect } from 'vitest';
import { noticeReturn } from '../../src/lib/core/notice';
import { P, TITLE } from './values';
import { theTask, type World, type StepDefinition } from './world';

/** The return the queried notice states, which has to be visible and name the task. */
function completionReturn(world: World): string | undefined {
	if (!world.noticeQueried) throw new Error('The notice was not queried');
	const { notice, now } = world.noticeQueried;
	expect(notice?.name).toBe(theTask(world).title);
	return notice && noticeReturn(notice, now);
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
		pattern: new RegExp(`^la fila de la tarea muestra el texto ${P}$`),
		run: (world, text) => theRowShowsText(world, text)
	},
	{
		pattern: new RegExp(`^la fila de ${TITLE} muestra el texto ${P}$`),
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
		pattern: /^la fila de la tarea no muestra texto de fecha$/,
		run: (world) => theRowShowsText(world, undefined)
	},
	{
		pattern: new RegExp(`^el aviso del completado muestra el regreso ${P}$`),
		run: (world, returned) => expect(completionReturn(world)).toBe(returned)
	},
	{
		pattern: /^el aviso del completado no muestra regreso$/,
		run: (world) => expect(completionReturn(world)).toBeUndefined()
	}
];
