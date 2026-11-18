import { expect, test, type Locator, type Page } from '@playwright/test';
import {
	openTask,
	advance,
	settle,
	close,
	complete,
	withClock,
	createAndView,
	stop,
	turnOnCompleted,
	waitStatus,
	row,
	cleanEmulators,
	listIs,
	sessionWithClock
} from './support';

test.beforeEach(async () => {
	await cleanEmulators();
});

const notice = (page: Page) => page.getByRole('status').filter({ hasText: 'Completaste' });
const showPaused = (page: Page) => page.getByRole('checkbox', { name: 'Pausadas' });
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const textOf = (page: Page, title: string) => row(page, title).getByText(/^(Tocaba|Vuelve) /);

/** Session with the clock running 10 minutes before `hora` (tasks are created that way) and Mostrar completadas if requested. */
async function session(page: Page, hour: string, completedList = false) {
	await sessionWithClock(page, new Date(new Date(hour).getTime() - 600_000).toISOString());
	if (completedList) await turnOnCompleted(page);
}

/** Advances the stopped clock to `hora` and lets one second run so the screen updates by itself. */
async function go(page: Page, hour: string) {
	const missing = new Date(hour).getTime() - (await page.evaluate(() => Date.now()));
	if (missing <= 10_000) await page.clock.runFor(missing);
	else await advance(page, hour);
	await page.clock.runFor(1000);
}

/** With the clock stopped, sets it exactly at `hora` (without firing timers) before an action that gets dated. */
const setTime = (page: Page, hour: string) => page.clock.setSystemTime(new Date(hour));

/** The row of `titulo` says exactly `texto` (once). */
async function says(page: Page, title: string, text: string) {
	await expect(textOf(page, title)).toHaveCount(1);
	await expect(textOf(page, title)).toHaveText(text);
}

/** The row contains no date or distance text. */
async function withoutText(page: Page, title: string) {
	const f = row(page, title);
	await expect(f).toBeVisible();
	await expect(f.getByText(/Tocaba|Vuelve/)).toHaveCount(0);
	await expect(f.getByText(/\b(hace|en) \d+/)).toHaveCount(0);
}

const withoutOverdue = (page: Page) => expect(page.getByText('Atrasada')).toHaveCount(0);

const style = (l: Locator) =>
	l.evaluate((e) => {
		const s = getComputedStyle(e);
		return { color: s.color, size: s.fontSize, weight: Number(s.fontWeight), line: s.textDecorationLine, background: s.backgroundColor };
	});

/** The overdue text shares color and size with `referencia`, and is not reddish, bold or underlined. */
async function latenessStyle(text: Locator, reference: Locator) {
	const a = await style(text);
	const r = await style(reference);
	expect(a.color).toBe(r.color);
	expect(a.size).toBe(r.size);
	const [red, green, blue] = a.color.match(/\d+/g)!.map(Number);
	expect(red > green && red > blue).toBe(false);
	expect(a.weight).toBeLessThan(600);
	expect(a.line).not.toContain('underline');
}

async function pause(page: Page, title: string) {
	await openTask(page, title);
	await button(page, 'Pausar').click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
}

async function postpone(page: Page, title: string, option: '3 horas' | 'Hasta mañana') {
	await openTask(page, title);
	await button(page, option).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
}

test('Flujo 1: atraso con fecha y distancia, sin color de alarma', async ({ page }) => {
	await session(page, '2026-11-13T10:00:00');
	await createAndView(page, { title: 'Pagar la luz', kind: 'No se repite', date: '2026-11-10' });
	await createAndView(page, { title: 'Pagar agua', kind: 'No se repite', date: '2026-11-12' });
	await createAndView(page, { title: 'Cambiar foco', kind: 'No se repite' });
	await createAndView(page, { title: 'Barrer', kind: 'Días de la semana', days: ['viernes'] });
	await stop(page, '2026-11-13T10:00:00');

	// 2
	await withClock(page, async () => {
		await listIs(page, ['Pagar la luz', 'Pagar agua', 'Barrer', 'Cambiar foco']);
		await waitStatus(page, 'Pagar la luz', 'atrasada', undefined, false);
		await waitStatus(page, 'Pagar agua', 'atrasada', undefined, false);
		await waitStatus(page, 'Barrer', 'pendiente');
		await waitStatus(page, 'Cambiar foco', 'pendiente');
		await says(page, 'Pagar la luz', 'Tocaba el martes 10 · hace 3 días');
		await says(page, 'Pagar agua', 'Tocaba ayer');
		await withoutOverdue(page);
		await withoutText(page, 'Cambiar foco');
		await withoutText(page, 'Barrer');
	});

	// 3
	await withClock(page, () => createAndView(page, { title: 'Lavar', kind: 'No se repite', date: '2026-11-13', schedule: { from: '08:00', to: '11:00' } }));
	await go(page, '2026-11-13T10:59:00');
	await waitStatus(page, 'Lavar', 'pendiente');
	await withoutText(page, 'Lavar');
	await latenessStyle(textOf(page, 'Pagar la luz'), row(page, 'Lavar').getByText(/\d\d:\d\d–\d\d:\d\d/));
	expect((await style(row(page, 'Pagar la luz'))).background).toBe((await style(row(page, 'Cambiar foco'))).background);
	await go(page, '2026-11-13T11:00:00');
	await waitStatus(page, 'Lavar', 'atrasada', undefined, false, false);
	await says(page, 'Lavar', 'Tocaba hoy');
	await latenessStyle(textOf(page, 'Lavar'), row(page, 'Lavar').getByText(/\d\d:\d\d–\d\d:\d\d/));

	// 4
	await setTime(page, '2026-11-13T10:59:50');
	await withClock(page, () => createAndView(page, { title: 'Regar', kind: 'Intervalo', every: '1', unit: 'horas' }));
	await setTime(page, '2026-11-13T11:00:00');
	await page.clock.runFor(1000);
	await complete(page, 'Regar');
	await withClock(page, () => expect(notice(page)).toHaveText(/^Completaste «Regar»\s*Vuelve hoy 12:00 · en 1 hora\s*Deshacer$/));
	await go(page, '2026-11-13T13:00:00');
	await waitStatus(page, 'Regar', 'atrasada', undefined, false);
	await says(page, 'Regar', 'Tocaba hoy 12:00 · hace 1 hora');
	await go(page, '2026-11-13T14:30:00');
	await says(page, 'Regar', 'Tocaba hoy 12:00 · hace 2 horas');

	// 5
	await go(page, '2026-11-14T00:00:00');
	await waitStatus(page, 'Barrer', 'atrasada', undefined, false);
	await says(page, 'Barrer', 'Tocaba ayer');
	await says(page, 'Regar', 'Tocaba ayer 12:00 · hace 12 horas');

	// 6
	await go(page, '2026-11-15T10:00:00');
	await says(page, 'Barrer', 'Tocaba el viernes 13 · hace 2 días');
	await says(page, 'Pagar la luz', 'Tocaba el martes 10 · hace 5 días');
	await withoutOverdue(page);
});

test('Flujo 2: «Vuelve …» en las filas en espera', async ({ page }) => {
	await session(page, '2026-11-13T10:00:00', true);
	await createAndView(page, { title: 'Regar', kind: 'Intervalo', every: '8', unit: 'horas' });
	await createAndView(page, { title: 'Sacar la basura', kind: 'Días de la semana', days: ['jueves'] });
	await createAndView(page, { title: 'Barrer', kind: 'Días de la semana', days: ['sábado'] });
	await createAndView(page, { title: 'Dormir', kind: 'Intervalo', every: '6', unit: 'días' });
	await createAndView(page, { title: 'Llamar', kind: 'No se repite', schedule: { from: '08:00', to: '09:00' } });
	await createAndView(page, { title: 'Cambiar foco', kind: 'No se repite' });
	await createAndView(page, { title: 'Pagar la luz', kind: 'No se repite', date: '2026-11-10' });
	await stop(page, '2026-11-13T10:00:00');

	// 1 and 3: complete with the exact clock
	await complete(page, 'Regar');
	await complete(page, 'Dormir');
	await withClock(page, async () => {
		await waitStatus(page, 'Regar', 'en espera', 0);
		await says(page, 'Regar', 'Vuelve hoy 18:00 · en 8 horas');
		await waitStatus(page, 'Dormir', 'en espera', undefined, true);
		await says(page, 'Dormir', 'Vuelve el jueves 19 10:00 · en 6 días');

		// 2
		await waitStatus(page, 'Sacar la basura', 'en espera', undefined, false);
		await says(page, 'Sacar la basura', 'Vuelve el jueves 19 · en 6 días');
		await waitStatus(page, 'Barrer', 'en espera', undefined, false);
		await says(page, 'Barrer', 'Vuelve mañana');

		// 4
		await waitStatus(page, 'Llamar', 'en espera', undefined, false, false);
		await says(page, 'Llamar', 'Vuelve mañana 08:00 · en 22 horas');
	});

	// 5
	await postpone(page, 'Cambiar foco', '3 horas');
	await withClock(page, async () => {
		await waitStatus(page, 'Cambiar foco', 'en espera', 0, false);
		await says(page, 'Cambiar foco', 'Vuelve hoy 13:00 · en 3 horas');
		await expect(row(page, 'Cambiar foco').getByText(/Pospuesta/)).toHaveCount(0);
		await openTask(page, 'Cambiar foco');
		await expect(page.getByRole('dialog').getByText('Pospuesta hasta 13:00', { exact: true })).toBeVisible();
		await close(page);
	});

	// 6
	await postpone(page, 'Pagar la luz', 'Hasta mañana');
	await withClock(page, async () => {
		await waitStatus(page, 'Pagar la luz', 'en espera', undefined, false);
		await says(page, 'Pagar la luz', 'Vuelve mañana 07:00 · en 21 horas');
		await expect(row(page, 'Pagar la luz').getByText(/Tocaba/)).toHaveCount(0);

		// 7
		await withoutOverdue(page);
		for (const t of ['Regar', 'Sacar la basura', 'Barrer', 'Dormir', 'Llamar', 'Cambiar foco', 'Pagar la luz'])
			await expect(row(page, t).getByRole('progressbar')).toHaveCount(1);
	});
});

test('Flujo 3: filas sin texto de fecha', async ({ page }) => {
	await session(page, '2026-11-13T10:00:00');
	await createAndView(page, { title: 'Barrer', kind: 'No se repite' });
	await createAndView(page, { title: 'Pagar', kind: 'No se repite', date: '2026-11-13' });
	await createAndView(page, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await stop(page, '2026-11-13T10:00:00');

	// 1
	await withClock(page, async () => {
		for (const t of ['Barrer', 'Pagar', 'Regar']) {
			await waitStatus(page, t, 'pendiente');
			await withoutText(page, t);
		}
	});

	// 2
	await go(page, '2026-12-13T10:00:00');
	await waitStatus(page, 'Barrer', 'pendiente');
	await waitStatus(page, 'Regar', 'pendiente');
	await withoutText(page, 'Barrer');
	await withoutText(page, 'Regar');
	await waitStatus(page, 'Pagar', 'atrasada', undefined, false);
	await says(page, 'Pagar', 'Tocaba el viernes 13 de noviembre · hace 30 días');

	// 3
	await withClock(page, async () => {
		await turnOnCompleted(page);
		await complete(page, 'Barrer');
		await waitStatus(page, 'Barrer', 'pendiente', undefined, true);
		await withoutText(page, 'Barrer');
	});

	// 4
	await withClock(page, async () => {
		await pause(page, 'Regar');
		await showPaused(page).click();
		await expect(showPaused(page)).toBeChecked();
		const f = row(page, 'Regar');
		await expect(f.getByText('Pausada')).toHaveCount(1);
		await expect(f.getByText(/Tocaba|Vuelve/)).toHaveCount(0);
		await says(page, 'Pagar', 'Tocaba el viernes 13 de noviembre · hace 30 días');
	});

	// 5
	await showPaused(page).click();
	await expect(showPaused(page)).not.toBeChecked();
	await expect(row(page, 'Regar')).toHaveCount(0);
	await says(page, 'Pagar', 'Tocaba el viernes 13 de noviembre · hace 30 días');
});

test('Flujo 4: se actualiza solo y no cambia el orden', async ({ page }) => {
	await session(page, '2026-11-12T20:00:00', true);
	await createAndView(page, { title: 'Pagar', kind: 'No se repite', date: '2026-11-10' });
	await createAndView(page, { title: 'Barrer', kind: 'Días de la semana', days: ['sábado'] });
	await createAndView(page, { title: 'Regar', kind: 'Intervalo', every: '1', unit: 'horas' });
	await stop(page, '2026-11-12T20:00:00');
	await complete(page, 'Regar');
	await withClock(page, () => waitStatus(page, 'Regar', 'en espera', 0));

	// 2
	await go(page, '2026-11-12T20:30:00');
	await says(page, 'Regar', 'Vuelve hoy 21:00 · en 30 minutos');
	await go(page, '2026-11-12T20:31:00');
	await says(page, 'Regar', 'Vuelve hoy 21:00 · en 29 minutos');
	await listIs(page, ['Pagar', 'Barrer', 'Regar']);

	// 3
	await go(page, '2026-11-12T21:00:00');
	await waitStatus(page, 'Regar', 'pendiente');
	await withoutText(page, 'Regar');

	// 4
	await go(page, '2026-11-12T22:00:00');
	await waitStatus(page, 'Regar', 'atrasada', undefined, false);
	await says(page, 'Regar', 'Tocaba hoy 21:00 · hace 1 hora');
	await listIs(page, ['Pagar', 'Regar', 'Barrer']);
	await go(page, '2026-11-12T23:59:00');
	await says(page, 'Regar', 'Tocaba hoy 21:00 · hace 2 horas');
	await go(page, '2026-11-13T00:00:00');
	await says(page, 'Regar', 'Tocaba ayer 21:00 · hace 3 horas');
	await listIs(page, ['Pagar', 'Regar', 'Barrer']);

	// 5
	await go(page, '2026-11-14T00:00:00');
	await says(page, 'Regar', 'Tocaba el jueves 12 21:00 · hace 2 días');
	await waitStatus(page, 'Barrer', 'pendiente');
	await withoutText(page, 'Barrer');

	// 6
	await listIs(page, ['Pagar', 'Regar', 'Barrer']);
	await page.reload();
	await withClock(page, async () => {
		await expect(page.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
		await listIs(page, ['Pagar', 'Regar', 'Barrer']);
		await says(page, 'Regar', 'Tocaba el jueves 12 21:00 · hace 2 días');
		await withoutText(page, 'Barrer');
	});
});

test('Flujo 5: el cierre al completar', async ({ page }) => {
	await session(page, '2026-11-02T10:00:00', true);
	await createAndView(page, { title: 'Regar', kind: 'Intervalo', every: '8', unit: 'horas' });
	await createAndView(page, { title: 'Sacar la basura', kind: 'Días de la semana', days: ['jueves'] });
	await createAndView(page, { title: 'Barrer', kind: 'Días de la semana', days: ['sábado'] });
	await createAndView(page, { title: 'Pagar la luz', kind: 'No se repite' });
	await createAndView(page, { title: 'Comprar pan', kind: 'No se repite', date: '2026-11-05' });
	await stop(page, '2026-11-02T10:00:00');

	// 2
	await go(page, '2026-11-13T10:00:00');
	await setTime(page, '2026-11-13T10:00:00');
	await complete(page, 'Regar');
	await withClock(page, async () => {
		await expect(notice(page)).toHaveCount(1);
		await expect(notice(page)).toHaveText(/^Completaste «Regar»\s*Vuelve hoy 18:00 · en 8 horas\s*Deshacer$/);
		await expect(notice(page).getByRole('button', { name: 'Deshacer' })).toBeVisible();
	});
	await page.clock.runFor(5000);
	await expect(notice(page)).toHaveCount(0);
	await says(page, 'Regar', 'Vuelve hoy 18:00 · en 8 horas');

	// 3
	await complete(page, 'Sacar la basura');
	await withClock(page, async () => {
		await expect(notice(page)).toHaveCount(1);
		await expect(notice(page)).toHaveText(/^Completaste «Sacar la basura»\s*Vuelve el jueves 19 · en 6 días\s*Deshacer$/);
	});
	await complete(page, 'Barrer');
	await withClock(page, async () => {
		await expect(notice(page)).toHaveCount(1);
		await expect(notice(page)).toHaveText(/^Completaste «Barrer»\s*Vuelve mañana\s*Deshacer$/);
	});

	// 4
	await complete(page, 'Pagar la luz');
	await withClock(page, async () => {
		await expect(notice(page)).toHaveCount(1);
		await expect(notice(page)).toHaveText(/^Completaste «Pagar la luz»\s*Deshacer$/);
	});
	await complete(page, 'Comprar pan');
	await withClock(page, async () => {
		await expect(notice(page)).toHaveCount(1);
		await expect(notice(page)).toHaveText(/^Completaste «Comprar pan»\s*Deshacer$/);
	});

	// 5
	await go(page, '2026-11-13T18:00:00');
	await withClock(page, () => waitStatus(page, 'Regar', 'pendiente'));
	await complete(page, 'Regar');
	await withClock(page, async () => {
		await expect(notice(page)).toHaveCount(1);
		await expect(notice(page)).toHaveText(/^Completaste «Regar»\s*Vuelve mañana 02:00 · en 8 horas\s*Deshacer$/);
	});
	await notice(page).getByRole('button', { name: 'Deshacer' }).click();
	await expect(notice(page)).toHaveCount(0);
	await settle(page);
	await withClock(page, async () => {
		await waitStatus(page, 'Regar', 'pendiente');
		await withoutText(page, 'Regar');
	});
});
