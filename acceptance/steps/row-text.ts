// El texto de fecha de la fila de Pendientes («Tocaba …», «Vuelve …», spec §6.1) y el
// regreso del aviso de completar (§5.4).
import { expect } from 'vitest';
import { noticeReturn } from '../../src/lib/core/notice';
import { P, TITLE } from './values';
import { theTask, type World, type StepDefinition } from './world';

/** El regreso que dice el aviso consultado, que tiene que verse y nombrar la tarea. */
function completionReturn(world: World): string | undefined {
	if (!world.noticeQueried) throw new Error('No se consultó el aviso');
	const { notice, now } = world.noticeQueried;
	expect(notice?.name).toBe(theTask(world).title);
	return notice && noticeReturn(notice, now);
}

/** En cada momento consultado, la lista tiene una sola fila y su texto de fecha es `texto`. */
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
