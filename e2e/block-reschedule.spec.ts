import { expect, test, type Browser, type Page } from '@playwright/test';
import {
	advance,
	arrivesOnServer,
	cleanEmulators,
	complete,

	createAndView,
	device,
	goA,
	goBack,
	openTask,
	opacityEffective,
	remove,
	row,
	sessionWithClock,
	turnOnCompleted,
	settle,
	stop,
	waitStatus,
	withClock
} from './support';

test.beforeEach(async () => {
	await cleanEmulators();
});

// ---------------------------------------------------------------------------
// Helpers (everything goes through the interface)
// ---------------------------------------------------------------------------

const menuButton = (page: Page) => page.getByRole('button', { name: 'Menú' });
const menu = (page: Page) => page.getByRole('menu');
const modeItem = (page: Page) => page.getByRole('menuitemcheckbox', { name: 'Modo mínimo' });
const item = (page: Page) => page.getByRole('menuitem', { name: 'Reprogramar vencidas' });
const preview = (page: Page) => page.getByRole('dialog', { name: 'Reprogramar vencidas' });
const previewButton = (page: Page, name: 'Reprogramar' | 'Cancelar') =>
	preview(page).getByRole('button', { name, exact: true });
const previewRows = (page: Page) => preview(page).getByRole('listitem');
const notice = (page: Page) => page.getByRole('status').filter({ hasNotText: 'Sin conexión' });
const undo = (page: Page) => notice(page).getByRole('button', { name: 'Deshacer' }).click();
const showPaused = (page: Page) => page.getByRole('checkbox', { name: 'Pausadas' });
const line = (page: Page) => page.getByText('Modo mínimo', { exact: true });
const tasks = (page: Page) => page.getByRole('listitem').filter({ has: page.getByRole('checkbox') });

/** Moves the simulated clock to `hour` firing the timers on the way (clock stopped). */
async function at(page: Page, hour: string) {
	const missing = new Date(hour).getTime() - (await page.evaluate(() => Date.now()));
	if (missing <= 10_000) await page.clock.runFor(missing);
	else await advance(page, hour);
}

async function openMenu(page: Page) {
	await menuButton(page).click();
	await expect(menu(page)).toBeVisible();
	await expect(page.getByRole('menuitem')).toHaveCount(1);
	await expect(page.getByRole('menuitemcheckbox')).toHaveCount(1);
}

async function closeMenu(page: Page) {
	await page.getByRole('heading', { name: 'Pendientes', level: 1 }).click();
	await expect(menu(page)).toHaveCount(0);
}

/** The item is dimmed (aria-disabled and less opaque than Modo mínimo). */
async function viewDimmed(page: Page) {
	await expect(item(page)).toHaveAttribute('aria-disabled', 'true');
	expect(await opacityEffective(item(page))).toBeLessThan(await opacityEffective(modeItem(page)));
}

async function viewEnabled(page: Page) {
	await expect(item(page)).not.toHaveAttribute('aria-disabled', /.*/);
	expect(await opacityEffective(item(page))).toBe(await opacityEffective(modeItem(page)));
}

/** Tapping the dimmed item does nothing: the menu stays open and no preview opens. */
async function tapDimmed(page: Page) {
	await item(page).click({ force: true });
	await expect(menu(page)).toBeVisible();
	await expect(preview(page)).toHaveCount(0);
}

/** Opens the menu, taps the enabled item and verifies the preview. */
async function openPreview(page: Page) {
	await openMenu(page);
	await viewEnabled(page);
	await item(page).click();
	await expect(menu(page)).toHaveCount(0);
	await expect(preview(page)).toBeVisible();
	await expect(preview(page).getByRole('heading', { name: 'Reprogramar vencidas' })).toBeVisible();
	await expect(preview(page).getByText('Vuelven como recién creadas, desde ahora.')).toBeVisible();
	await expect(previewButton(page, 'Cancelar')).toBeEnabled();
}

async function previewIs(page: Page, titles: string[]) {
	await expect(previewRows(page)).toHaveCount(titles.length);
	await expect(previewRows(page)).toHaveText(titles.map((t) => new RegExp(`^\\s*${t}\\s*$`)));
	await expect(preview(page)).not.toContainText(/\d+ tareas?|tocaba|atrasada/i);
	await expect(preview(page).getByRole('checkbox')).toHaveCount(0);
}

async function confirm(page: Page) {
	await previewButton(page, 'Reprogramar').click();
	await expect(preview(page)).toHaveCount(0);
}

async function viewNotice(page: Page) {
	await expect(notice(page)).toHaveCount(1);
	await expect(notice(page)).toHaveText(/^\s*Tareas reprogramadas\s*Deshacer\s*$/);
	await expect(notice(page)).not.toContainText(/\d|Completaste/);
}

async function noNotice(page: Page) {
	await expect(notice(page)).toHaveCount(0);
}

const textOf = (page: Page, title: string) => row(page, title).innerText();

const overdue = (page: Page, title: string) => waitStatus(page, title, 'atrasada');
const pending = (page: Page, title: string) => waitStatus(page, title, 'pendiente');
const waiting = (page: Page, title: string) => waitStatus(page, title, 'en espera');

async function pause(page: Page, title: string) {
	await openTask(page, title);
	await page.getByRole('button', { name: 'Pausar', exact: true }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
}

async function lastTime(page: Page, title: string, text: string) {
	await openTask(page, title);
	await expect(page.getByText(/^Última vez/)).toHaveText(`Última vez: ${text}`);
	await page.getByRole('button', { name: 'Cerrar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
}

/**
 * Session with a clock and Mostrar completadas on: a completed recurring task that is `en espera`
 * is hidden otherwise (spec §6.1), and the flows look at those rows.
 */
async function session(page: Page, hour: string) {
	await sessionWithClock(page, hour);
	await turnOnCompleted(page);
}

const REGAR = { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' } as const;

/** Precondition of Flows 3 and 4: Regar completed on the 8th, stopped at `hour` of the 16th with Regar overdue. */
async function stoppedOn16(page: Page, withDinner: boolean) {
	await session(page, '2026-07-08T09:00:00');
	await createAndView(page, REGAR);
	await complete(page, 'Regar');
	await waiting(page, 'Regar');
	if (withDinner) await createAndView(page, { title: 'Cena', kind: 'No se repite' });
	await advance(page, '2026-07-16T09:59:00');
	await stop(page, '2026-07-16T10:00:00');
	await withClock(page, () => overdue(page, 'Regar'));
	// The assertions above let some milliseconds run: back to the exact instant, so the 5 s are exact.
	await page.clock.setSystemTime(new Date('2026-07-16T10:00:00'));
}

// ---------------------------------------------------------------------------
// Flow 1
// ---------------------------------------------------------------------------

test('Flow 1: the menu item and when it is disabled', async ({ page }) => {
	await session(page, '2026-07-08T09:00:00');

	// Step 1.
	await openMenu(page);
	await expect(page.getByRole('menu').getByRole('menuitemcheckbox')).toHaveText(/Modo mínimo/);
	const below = (await item(page).boundingBox())!.y;
	expect(below).toBeGreaterThan((await modeItem(page).boundingBox())!.y);
	await viewDimmed(page);
	const looks = await menu(page).innerHTML();
	await tapDimmed(page);
	await closeMenu(page);
	await openMenu(page);
	await viewDimmed(page);
	expect(await menu(page).innerHTML()).toBe(looks);
	await closeMenu(page);

	// Step 2.
	await createAndView(page, { title: 'Pagar', kind: 'No se repite', date: '2026-07-10' });
	await advance(page, '2026-07-11T10:00:00');
	await overdue(page, 'Pagar');
	await expect(row(page, 'Pagar').getByText(/^Tocaba /)).toHaveCount(1);
	await openMenu(page);
	await viewDimmed(page);
	await tapDimmed(page);
	await closeMenu(page);

	// Step 3.
	await createAndView(page, REGAR);
	await complete(page, 'Regar');
	await waiting(page, 'Regar');
	await advance(page, '2026-07-12T10:00:00');
	await waiting(page, 'Regar');
	await openMenu(page);
	await viewDimmed(page);
	await closeMenu(page);
	await advance(page, '2026-07-15T10:00:00');
	await overdue(page, 'Regar');
	await expect(row(page, 'Regar').getByText(/^Tocaba /)).toHaveCount(1);
	await openMenu(page);
	await viewEnabled(page);
	await closeMenu(page);

	// Step 4.
	await pause(page, 'Regar');
	await openMenu(page);
	await viewDimmed(page);
	await closeMenu(page);
	await showPaused(page).click();
	await expect(showPaused(page)).toBeChecked();
	await openTask(page, 'Regar');
	await page.getByRole('button', { name: 'Reanudar', exact: true }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await pending(page, 'Regar');
	await expect(row(page, 'Regar').getByText(/^Tocaba /)).toHaveCount(0);
	await openMenu(page);
	await viewDimmed(page);
	await closeMenu(page);

	// Step 5.
	await createAndView(page, { title: 'Basura', kind: 'Días de la semana', days: ['miércoles'] });
	await pending(page, 'Basura');
	await advance(page, '2026-07-15T23:59:59');
	await openMenu(page);
	await viewDimmed(page);
	await advance(page, '2026-07-16T00:00:00');
	await expect(menu(page)).toBeVisible();
	await expect(item(page)).not.toHaveAttribute('aria-disabled', /.*/);
	await viewEnabled(page);
	await closeMenu(page);
	await overdue(page, 'Basura');
});

// ---------------------------------------------------------------------------
// Flow 2
// ---------------------------------------------------------------------------

test('Flow 2: preview, confirming and what is left untouched', async ({ page }) => {
	await session(page, '2026-07-08T09:00:00');

	// Step 1.
	await createAndView(page, { ...REGAR, emoji: '💧' });
	await complete(page, 'Regar');
	await waiting(page, 'Regar');
	await createAndView(page, { title: 'Basura', kind: 'Días de la semana', days: ['martes', 'jueves'] });
	await createAndView(page, { title: 'Pagar', kind: 'No se repite', date: '2026-07-10' });
	await createAndView(page, { title: 'Dormida', kind: 'Intervalo', every: '2', unit: 'días' });
	await complete(page, 'Dormida');
	await waiting(page, 'Dormida');
	await pause(page, 'Dormida');
	await createAndView(page, { title: 'Luego', kind: 'Intervalo', every: '2', unit: 'días' });
	await complete(page, 'Luego');
	await waiting(page, 'Luego');
	await createAndView(page, { title: 'Barrer', kind: 'Intervalo', every: '7', unit: 'días' });

	// Step 2.
	await advance(page, '2026-07-16T09:00:00');
	await complete(page, 'Barrer');
	await waiting(page, 'Barrer');
	await advance(page, '2026-07-16T09:30:00');
	await openTask(page, 'Luego');
	await page.getByRole('group', { name: 'Posponer' }).getByRole('button', { name: '3 horas', exact: true }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await waitStatus(page, 'Luego', 'en espera', undefined, false);

	// Step 3.
	await advance(page, '2026-07-16T10:00:00');
	for (const t of ['Basura', 'Regar', 'Pagar']) {
		await overdue(page, t);
		await expect(row(page, t).getByText(/^Tocaba /)).toHaveCount(1);
	}
	await waiting(page, 'Barrer');
	await waitStatus(page, 'Luego', 'en espera', undefined, false);
	await expect(row(page, 'Dormida')).toHaveCount(0);
	const before = { Basura: await textOf(page, 'Basura'), Regar: await textOf(page, 'Regar'), Pagar: await textOf(page, 'Pagar') };
	await noNotice(page);
	await expect(preview(page)).toHaveCount(0);
	await page.reload();
	await expect(page.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
	await overdue(page, 'Regar');
	await noNotice(page);
	await expect(preview(page)).toHaveCount(0);

	// Step 4.
	await openPreview(page);
	await previewIs(page, ['Basura', '💧 Regar']);
	await expect(previewButton(page, 'Reprogramar')).toBeEnabled();

	// Step 5.
	await previewButton(page, 'Cancelar').click();
	await expect(preview(page)).toHaveCount(0);
	await noNotice(page);
	for (const t of ['Basura', 'Regar', 'Pagar']) expect(await textOf(page, t)).toBe(before[t as keyof typeof before]);
	await openPreview(page);

	// Step 6.
	await confirm(page);
	await viewNotice(page);
	await pending(page, 'Basura');
	await pending(page, 'Regar');
	for (const t of ['Basura', 'Regar']) {
		await expect(row(page, t).getByText('Atrasada')).toHaveCount(0);
		await expect(row(page, t).getByText(/^Tocaba /)).toHaveCount(0);
	}
	await overdue(page, 'Pagar');
	expect(await textOf(page, 'Pagar')).toBe(before.Pagar);
	await waiting(page, 'Barrer');
	await waitStatus(page, 'Luego', 'en espera', undefined, false);
	await expect(row(page, 'Dormida')).toHaveCount(0);
	await showPaused(page).click();
	await expect(row(page, 'Dormida').getByText('Pausada')).toHaveCount(1);
	await showPaused(page).click();
	await expect(row(page, 'Dormida')).toHaveCount(0);

	// Step 7.
	await lastTime(page, 'Regar', 'hace 8 días');
	await lastTime(page, 'Basura', 'nunca');
	await goA(page, 'Historial');
	await expect(page.getByRole('listitem').filter({ hasText: /Regar/ })).toHaveCount(1);
	await expect(page.getByRole('listitem').filter({ hasText: /Luego/ })).toHaveCount(1);
	await expect(page.getByRole('listitem').filter({ hasText: /Dormida/ })).toHaveCount(1);
	await expect(page.getByRole('listitem').filter({ hasText: /Barrer/ })).toHaveCount(1);
	await expect(page.getByRole('listitem')).toHaveCount(4);
	await goA(page, 'Pendientes');

	// Step 8.
	await openMenu(page);
	await viewDimmed(page);
	await closeMenu(page);

	// Step 9.
	await advance(page, '2026-07-16T10:00:06');
	await noNotice(page);
	await page.reload();
	await expect(page.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
	await pending(page, 'Basura');
	await pending(page, 'Regar');
	await overdue(page, 'Pagar');
	await noNotice(page);

	// Step 10.
	await advance(page, '2026-07-17T00:00:00');
	await overdue(page, 'Basura');
	await expect(row(page, 'Basura').getByText(/^Tocaba /)).toHaveText("Tocaba ayer");
	await pending(page, 'Regar');
});

// ---------------------------------------------------------------------------
// Flow 3
// ---------------------------------------------------------------------------

test('Flow 3 step 1: the notice lasts 5 seconds', async ({ page }) => {
	await stoppedOn16(page, true);
	await openPreview(page);
	await confirm(page);
	await viewNotice(page);
	await at(page, '2026-07-16T10:00:04');
	await viewNotice(page);
	await at(page, '2026-07-16T10:00:05');
	await noNotice(page);
	await withClock(page, () => pending(page, 'Regar'));
});

test('Flow 3 step 2: Deshacer gives back the tasks', async ({ page }) => {
	await stoppedOn16(page, true);
	const before = await textOf(page, 'Regar');
	await openPreview(page);
	await confirm(page);
	await viewNotice(page);
	await withClock(page, () => pending(page, 'Regar'));
	await at(page, '2026-07-16T10:00:03');
	await undo(page);
	await noNotice(page);
	await expect(page.getByRole('alert')).toHaveCount(0);
	await settle(page);
	await withClock(page, () => overdue(page, 'Regar'));
	expect(await textOf(page, 'Regar')).toBe(before);
});

test('Flow 3 step 3: the completion notice replaces it', async ({ page }) => {
	await stoppedOn16(page, true);
	await openPreview(page);
	await confirm(page);
	await viewNotice(page);
	await at(page, '2026-07-16T10:00:02');
	await complete(page, 'Cena');
	await expect(notice(page)).toHaveCount(1);
	await expect(notice(page)).toContainText('Completaste «Cena»');
	await expect(notice(page)).not.toContainText('Tareas reprogramadas');
	await at(page, '2026-07-16T10:00:03');
	await undo(page);
	await noNotice(page);
	await settle(page);
	await withClock(page, () => waitStatus(page, 'Cena', 'pendiente', undefined, false));
	await withClock(page, () => pending(page, 'Regar'));
});

test('Flow 3 step 4: the rescheduling notice replaces the completion one', async ({ page }) => {
	await stoppedOn16(page, true);
	await goBack(page, '2026-07-16T09:59:57');
	await complete(page, 'Cena');
	await expect(notice(page)).toContainText('Completaste «Cena»');
	await at(page, '2026-07-16T10:00:00');
	await openPreview(page);
	await confirm(page);
	await viewNotice(page);
	await expect(notice(page)).not.toContainText('Completaste');
	await at(page, '2026-07-16T10:00:02');
	await undo(page);
	await noNotice(page);
	await settle(page);
	await withClock(page, () => overdue(page, 'Regar'));
	await withClock(page, () => waitStatus(page, 'Cena', 'pendiente', undefined, true));
});

test('Flow 3 step 5: the notice stays across screens', async ({ page }) => {
	await stoppedOn16(page, true);
	await openPreview(page);
	await confirm(page);
	await viewNotice(page);
	await at(page, '2026-07-16T10:00:01');
	await goA(page, 'Historial');
	await viewNotice(page);
	await at(page, '2026-07-16T10:00:03');
	await goA(page, 'Pendientes');
	await viewNotice(page);
	await at(page, '2026-07-16T10:00:05');
	await noNotice(page);
});

// ---------------------------------------------------------------------------
// Flow 4
// ---------------------------------------------------------------------------

async function setMode(page: Page, on: boolean) {
	await openMenu(page);
	await modeItem(page).click();
	await expect(menu(page)).toHaveCount(0);
	if (on) await expect(line(page)).toBeVisible();
	else await expect(line(page)).toHaveCount(0);
}

test('Flow 4: the minimal mode', async ({ page }) => {
	await session(page, '2026-07-08T09:00:00');
	await createAndView(page, { ...REGAR, essential: true });
	await createAndView(page, { title: 'Basura', kind: 'Intervalo', every: '2', unit: 'días' });
	await complete(page, 'Regar');
	await complete(page, 'Basura');
	await waiting(page, 'Basura');
	await advance(page, '2026-07-16T10:00:00');
	await overdue(page, 'Regar');
	await overdue(page, 'Basura');

	await setMode(page, true);
	await expect(tasks(page)).toHaveCount(1);
	await overdue(page, 'Regar');
	await openMenu(page);
	await viewEnabled(page);
	await item(page).click();
	await expect(preview(page)).toBeVisible();
	await previewIs(page, ['Regar']);

	await confirm(page);
	await viewNotice(page);
	await pending(page, 'Regar');
	await openMenu(page);
	await viewDimmed(page);
	await closeMenu(page);
	await setMode(page, false);
	await pending(page, 'Basura');
	await expect(row(page, 'Basura').getByText(/^Tocaba /)).toHaveCount(0);
});

test('Flow 4 step 4: a non essential overdue task is not in view', async ({ page }) => {
	await session(page, '2026-07-08T09:00:00');
	await createAndView(page, { title: 'Basura', kind: 'Intervalo', every: '2', unit: 'días' });
	await complete(page, 'Basura');
	await waiting(page, 'Basura');
	await advance(page, '2026-07-16T10:00:00');
	await overdue(page, 'Basura');
	await setMode(page, true);
	await expect(tasks(page)).toHaveCount(0);
	await openMenu(page);
	await viewDimmed(page);
	await closeMenu(page);
	await setMode(page, false);
	await pending(page, 'Basura');
});

// ---------------------------------------------------------------------------
// Flow 5
// ---------------------------------------------------------------------------

test('Flow 5: the preview follows the data and the clock', async ({ browser }) => {
	const A = await device(browser, '2026-07-08T09:00:00', true);
	const B = await device(browser, '2026-07-08T09:00:00', false);
	const [a, b] = [A.page, B.page];
	await turnOnCompleted(a);
	await turnOnCompleted(b);
	await createAndView(a, REGAR);
	await createAndView(a, { title: 'Basura', kind: 'Intervalo', every: '2', unit: 'días' });
	// The clock runs while QA acts: Basura is completed first so that it is the oldest overdue one.
	await complete(a, 'Basura');
	await complete(a, 'Regar');
	await waiting(b, 'Basura');
	await waiting(b, 'Regar');
	await advance(a, '2026-07-14T09:00:00');
	await advance(b, '2026-07-14T09:00:00');
	await createAndView(a, { title: 'Mesa', kind: 'Días de la semana', days: ['jueves'] });
	await waitStatus(b, 'Mesa', 'en espera', undefined, false);
	await advance(a, '2026-07-16T10:00:00');
	await advance(b, '2026-07-16T10:00:00');
	await overdue(a, 'Regar');
	await overdue(a, 'Basura');
	await pending(a, 'Mesa');
	await overdue(b, 'Basura');

	// Step 1.
	await openPreview(a);
	await previewIs(a, ['Basura', 'Regar']);

	// Step 2.
	await complete(b, 'Basura');
	await waiting(b, 'Basura');
	await expect(previewRows(a)).toHaveText([/^\s*Regar\s*$/]);
	await expect(previewButton(a, 'Reprogramar')).toBeEnabled();
	await remove(b, 'Regar');
	await expect(previewRows(a)).toHaveCount(0);
	await expect(previewButton(a, 'Reprogramar')).toBeDisabled();
	await previewButton(a, 'Reprogramar').click({ force: true });
	await expect(preview(a)).toBeVisible();
	await noNotice(a);
	await expect(previewButton(a, 'Cancelar')).toBeEnabled();

	// Step 3.
	await previewButton(a, 'Cancelar').click();
	await expect(preview(a)).toHaveCount(0);
	await goA(b, 'Historial');
	await b.getByRole('listitem').filter({ hasText: /^Basura/ }).first().getByRole('button', { name: 'Borrar', exact: true }).click();
	await b.getByRole('alertdialog').getByRole('button', { name: 'Borrar', exact: true }).click();
	await expect(b.getByRole('alertdialog')).toHaveCount(0);
	await goA(b, 'Pendientes');
	await overdue(b, 'Basura');
	await overdue(a, 'Basura');
	await openPreview(a);
	await previewIs(a, ['Basura']);
	await advance(a, '2026-07-16T23:59:59');
	await advance(b, '2026-07-16T23:59:59');
	await expect(previewRows(a)).toHaveCount(1);
	await advance(a, '2026-07-17T00:00:00');
	await advance(b, '2026-07-17T00:00:00');
	await previewIs(a, ['Basura', 'Mesa']);

	// Step 4.
	await confirm(a);
	await viewNotice(a);
	await pending(a, 'Basura');
	// Friday 17: a calendar task comes back as newly created, so Mesa (Thursdays) waits for the next one.
	await waitStatus(a, 'Mesa', 'en espera', undefined, false);
	await A.ctx.close();
	await B.ctx.close();
});

// ---------------------------------------------------------------------------
// Flow 6
// ---------------------------------------------------------------------------

/** Two devices with Regar overdue and both clocks stopped at 2026-07-16T10:00:00. */
async function twoOverdue(browser: Browser) {
	const A = await device(browser, '2026-07-08T09:00:00', true);
	const B = await device(browser, '2026-07-08T09:00:00', false);
	const [a, b] = [A.page, B.page];
	await turnOnCompleted(a);
	await turnOnCompleted(b);
	await createAndView(a, REGAR);
	await complete(a, 'Regar');
	await waiting(a, 'Regar');
	await waiting(b, 'Regar');
	for (const p of [a, b]) {
		await advance(p, '2026-07-16T09:59:00');
		await stop(p, '2026-07-16T10:00:00');
	}
	await withClock(a, () => overdue(a, 'Regar'));
	await withClock(b, () => overdue(b, 'Regar'));
	return { a, b, ctxA: A.ctx, ctxB: B.ctx, end: async () => { await A.ctx.close(); await B.ctx.close(); } };
}

/** Runs the clocks of both stopped devices while the assertions wait: the reconnection of each one needs its timers. */
const both = (a: Page, b: Page, assertions: () => Promise<void>) => withClock(a, () => withClock(b, assertions));

test('Flow 6 step 1: A offline reschedules', async ({ browser }) => {
	const { a, b, ctxA, end } = await twoOverdue(browser);
	await ctxA.setOffline(true);
	await openPreview(a);
	await confirm(a);
	await viewNotice(a);
	await expect(a.getByRole('alert')).toHaveCount(0);
	await withClock(a, () => pending(a, 'Regar'));
	await withClock(b, () => overdue(b, 'Regar'));
	await ctxA.setOffline(false);
	await arrivesOnServer(a);
	await both(a, b, () => pending(b, 'Regar'));
	await expect(row(b, 'Regar').getByText(/^Tocaba /)).toHaveCount(0);
	await end();
});

test('Flow 6 step 2: B completes offline, A undoes', async ({ browser }) => {
	const { a, b, ctxB, end } = await twoOverdue(browser);
	await ctxB.setOffline(true);
	await openPreview(a);
	await confirm(a);
	await viewNotice(a);
	await at(b, '2026-07-16T10:00:02');
	await complete(b, 'Regar');
	await withClock(b, () => waiting(b, 'Regar'));
	await at(a, '2026-07-16T10:00:03');
	await undo(a);
	await arrivesOnServer(a);
	await ctxB.setOffline(false);
	await arrivesOnServer(b);
	await both(a, b, async () => {
		await waiting(a, 'Regar');
		await waiting(b, 'Regar');
	});
	await end();
});

test('Flow 6 step 3: B deletes offline, A undoes', async ({ browser }) => {
	const { a, b, ctxB, end } = await twoOverdue(browser);
	await ctxB.setOffline(true);
	await openPreview(a);
	await confirm(a);
	await viewNotice(a);
	await withClock(b, () => remove(b, 'Regar'));
	await arrivesOnServer(a);
	await ctxB.setOffline(false);
	await arrivesOnServer(b);
	await at(a, '2026-07-16T10:00:03');
	await undo(a);
	await settle(a);
	await both(a, b, async () => {
		await expect(tasks(a)).toHaveCount(0);
		await expect(tasks(b)).toHaveCount(0);
	});
	await end();
});

test('Flow 6 step 4: A offline reschedules and undoes', async ({ browser }) => {
	const { a, b, ctxA, end } = await twoOverdue(browser);
	await ctxA.setOffline(true);
	await openPreview(a);
	await confirm(a);
	await viewNotice(a);
	await at(a, '2026-07-16T10:00:03');
	await undo(a);
	await noNotice(a);
	await expect(a.getByRole('alert')).toHaveCount(0);
	await settle(a);
	await withClock(a, () => overdue(a, 'Regar'));
	await ctxA.setOffline(false);
	await arrivesOnServer(a);
	await both(a, b, () => overdue(b, 'Regar'));
	await end();
});

// ---------------------------------------------------------------------------
// Flow 7
// ---------------------------------------------------------------------------

async function nothingOffered(page: Page) {
	await expect(page.getByText(/reprogram|vencid|acumul|\d+ tareas?/i)).toHaveCount(0);
	await noNotice(page);
	await expect(page.getByRole('alert')).toHaveCount(0);
	await expect(page.getByRole('dialog')).toHaveCount(0);
}

test('Flow 7: nothing is offered and no summary', async ({ page }) => {
	await session(page, '2026-07-08T09:00:00');
	await createAndView(page, REGAR);
	await createAndView(page, { title: 'Basura', kind: 'Intervalo', every: '2', unit: 'días' });
	await complete(page, 'Basura');
	await complete(page, 'Regar');
	await createAndView(page, { title: 'Pagar', kind: 'No se repite', date: '2026-07-10' });
	await waiting(page, 'Basura');

	// Step 1.
	// No reload here: with the simulated clock six weeks ahead the sign-in token refresh never ends (Flow 2 reloads).
	await advance(page, '2026-08-20T10:00:00');
	for (const t of ['Regar', 'Basura', 'Pagar']) await overdue(page, t);
	await nothingOffered(page);
	await goA(page, 'Historial');
	await nothingOffered(page);
	await goA(page, 'Pendientes');
	await openMenu(page);
	await closeMenu(page);

	// Step 2.
	await openPreview(page);
	await previewIs(page, ['Basura', 'Regar']);
	await confirm(page);
	await viewNotice(page);
	await pending(page, 'Regar');
	await expect(page.getByText(/\d+ tareas?|reprogramaron|felicit/i)).toHaveCount(0);

	// Step 3.
	await undo(page);
	await noNotice(page);
	await overdue(page, 'Regar');
	await expect(page.getByText(/\d+ tareas?|reprogramaron|felicit/i)).toHaveCount(0);
});
