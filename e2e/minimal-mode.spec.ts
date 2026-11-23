import { expect, test, type Page } from '@playwright/test';
import {
	advance,
	arrivesOnServer,
	cleanEmulators,
	close,
	complete,
	completePanel,
	create,
	dimmed,
	edit,
	goA,
	listIs,
	openTask,
	row,
	rowTitle,
	sessionWithClock,
	toggleShowCompleted,
	twoDevices,
	waitStatus
} from './support';
import { DATA, otherDeviceWithSession, retain, screenName } from './screen-support';

test.beforeEach(async () => {
	await cleanEmulators();
});

// ---------------------------------------------------------------------------
// Helpers (everything goes through the interface)
// ---------------------------------------------------------------------------

const menuButton = (page: Page) => page.getByRole('button', { name: 'Menú' });
const menu = (page: Page) => page.getByRole('menu');
const modeItem = (page: Page) => page.getByRole('menuitemcheckbox', { name: 'Modo mínimo' });
/** The line above the list (only meaningful with the menu closed). */
const line = (page: Page) => page.getByText('Modo mínimo', { exact: true });
const essentialCheck = (page: Page) => page.getByRole('checkbox', { name: 'Esencial' });
const star = (page: Page, title: string) => row(page, title).getByRole('img', { name: 'Esencial' });
const showPaused = (page: Page) => page.getByRole('checkbox', { name: 'Pausadas' });
const buttonNamed = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const dialog = (page: Page) => page.getByRole('dialog');

/** No notice, toast, dialog or count (the "Sin conexión" strip is not a message about the mode). */
async function noMessage(page: Page) {
	await expect(page.getByRole('status').filter({ hasNotText: 'Sin conexión' })).toHaveCount(0);
	await expect(page.getByRole('alert')).toHaveCount(0);
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
	await expect(page.getByRole('dialog')).toHaveCount(0);
}

/** Opens the menu, taps Modo mínimo and verifies the result: closed menu, line, no message. */
async function setMode(page: Page, on: boolean, checkMessage = true) {
	await menuButton(page).click();
	await expect(modeItem(page)).toHaveAttribute('aria-checked', String(!on));
	await modeItem(page).click();
	await expect(menu(page)).toHaveCount(0);
	if (on) await expect(line(page)).toBeVisible();
	else await expect(line(page)).toHaveCount(0);
	if (checkMessage) await noMessage(page);
}

async function togglePaused(page: Page, on: boolean) {
	await showPaused(page).click();
	if (on) await expect(showPaused(page)).toBeChecked();
	else await expect(showPaused(page)).not.toBeChecked();
}

/** Opens the task and taps Pausar: the panel closes by itself. */
async function pause(page: Page, title: string) {
	await openTask(page, title);
	await buttonNamed(page, 'Pausar').click();
	await expect(dialog(page)).toHaveCount(0);
}

/** Titles of the rows of the list (only the ones with a checkbox), among the `known` ones, in order. */
async function titles(page: Page, known: string[]): Promise<string[]> {
	const items = page.getByRole('listitem').filter({ has: page.getByRole('checkbox') });
	const texts = await items.evaluateAll((els) => els.map((e) => (e as HTMLElement).innerText.trim()));
	return texts.map((t) => known.find((k) => t.startsWith(k)) ?? t);
}

/** The list has exactly these rows, in any order. */
async function listHas(page: Page, expected: string[]) {
	const items = page.getByRole('listitem').filter({ has: page.getByRole('checkbox') });
	await expect(items).toHaveCount(expected.length);
	for (const t of expected) await expect(row(page, t)).toHaveCount(1);
}

/** Paused row: «Pausada», disabled checkbox, dimmed. */
async function viewPaused(page: Page, title: string) {
	const f = row(page, title);
	await expect(f).toBeVisible();
	await expect(f.getByText('Pausada')).toHaveCount(1);
	await expect(f.getByRole('checkbox')).toBeDisabled();
	expect(await dimmed(f)).toBe(true);
}

/** Opens the panel of a task from its entry in the Historial (stays on Historial). */
async function openEntry(page: Page, title: string) {
	await goA(page, 'Historial');
	await page.getByRole('listitem').getByRole('button', { name: title, exact: true }).first().click();
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
}

async function save(page: Page) {
	await buttonNamed(page, 'Guardar').click();
	await expect(dialog(page)).toHaveCount(0);
}

const textInPanel = (page: Page, text: string | RegExp, exact = false) =>
	dialog(page).getByText(text, { exact });

async function overdueTextAbsent(page: Page, title: string) {
	await expect(row(page, title).getByText('Atrasada')).toHaveCount(0);
	await expect(row(page, title).getByText(/^Tocaba /)).toHaveCount(0);
}

// ---------------------------------------------------------------------------
// Flow 1
// ---------------------------------------------------------------------------

test('Flow 1: the Esencial check and the star', async ({ page }) => {
	await sessionWithClock(page, '2026-07-14T09:00:00');

	// Step 1.
	await page.getByRole('button', { name: '+' }).click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await expect(essentialCheck(page)).not.toBeChecked();
	const noteBox = await page.getByLabel('Nota').boundingBox();
	const checkBox = await essentialCheck(page).boundingBox();
	expect(checkBox!.y).toBeGreaterThan(noteBox!.y);
	await expect(essentialCheck(page).locator('xpath=..').locator('svg, img')).toHaveCount(0);
	await close(page);
	await create(page, { title: 'Pagar la luz', kind: 'No se repite' });
	await expect(row(page, 'Pagar la luz')).toBeVisible();
	await expect(star(page, 'Pagar la luz')).toHaveCount(0);

	// Step 2.
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días', essential: true });
	await expect(star(page, 'Regar')).toHaveCount(1);
	const t = await rowTitle(row(page, 'Regar')).boundingBox();
	const s = await star(page, 'Regar').boundingBox();
	expect(s!.x).toBeGreaterThanOrEqual(t!.x + t!.width - 1);
	expect(s!.y + s!.height).toBeGreaterThan(t!.y);
	expect(s!.y).toBeLessThan(t!.y + t!.height);
	const colorTitle = await rowTitle(row(page, 'Regar')).evaluate((e) => getComputedStyle(e).color);
	expect(await star(page, 'Regar').evaluate((e) => getComputedStyle(e).color)).toBe(colorTitle);
	// The star lets the tap through to the row: force skips the actionability check, the click still lands on the row.
	await star(page, 'Regar').click({ force: true });
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await expect(essentialCheck(page)).toBeChecked();
	await close(page);

	// Step 3.
	const before = await titles(page, ['Pagar la luz', 'Regar']);
	await openTask(page, 'Pagar la luz');
	await essentialCheck(page).check();
	await page.getByRole('button', { name: 'Cerrar' }).click();
	const notice = page.getByRole('alertdialog', { name: 'Tenés cambios sin guardar' });
	await expect(notice).toBeVisible();
	await notice.getByRole('button', { name: 'Seguir editando' }).click();
	await expect(notice).toHaveCount(0);
	await essentialCheck(page).uncheck();
	await close(page);
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
	await openTask(page, 'Pagar la luz');
	await essentialCheck(page).check();
	await save(page);
	await expect(star(page, 'Pagar la luz')).toHaveCount(1);
	expect(await titles(page, ['Pagar la luz', 'Regar'])).toEqual(before);

	// Step 4.
	await create(page, {
		title: 'Basura',
		kind: 'Días de la semana',
		days: ['martes', 'jueves'],
		essential: true
	});
	await toggleShowCompleted(page, true);
	await complete(page, 'Basura');
	await complete(page, 'Pagar la luz');
	await waitStatus(page, 'Basura', 'en espera');
	await waitStatus(page, 'Pagar la luz', 'pendiente', undefined, true);
	await expect(star(page, 'Basura')).toHaveCount(1);
	await expect(star(page, 'Pagar la luz')).toHaveCount(1);
	await pause(page, 'Regar');
	await togglePaused(page, true);
	await viewPaused(page, 'Regar');
	await expect(star(page, 'Regar')).toHaveCount(1);
	const allRows = page.getByRole('listitem').filter({ has: page.getByRole('checkbox') });
	await expect(allRows).toHaveCount(3);
	await expect(page.getByRole('img', { name: 'Esencial' })).toHaveCount(3);

	// Step 5.
	await edit(page, 'Regar', { essential: false });
	await expect(star(page, 'Regar')).toHaveCount(0);

	// Step 6.
	await page.reload();
	await expect(row(page, 'Basura')).toBeVisible();
	await expect(star(page, 'Basura')).toHaveCount(1);
	await expect(star(page, 'Pagar la luz')).toHaveCount(1);
	await expect(star(page, 'Regar')).toHaveCount(0);
	await openTask(page, 'Pagar la luz');
	await essentialCheck(page).uncheck();
	await page.getByLabel('Título').press('Enter');
	await expect(dialog(page)).toHaveCount(0);
	await expect(star(page, 'Pagar la luz')).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// Flow 2
// ---------------------------------------------------------------------------

test('Flow 2: the menu, the mode and the line', async ({ page }) => {
	await sessionWithClock(page, '2026-07-14T09:00:00');

	// Step 1.
	await expect(menuButton(page)).toBeVisible();
	await expect(menuButton(page)).toHaveAttribute('aria-haspopup', 'menu');
	await menuButton(page).click();
	await expect(menu(page)).toBeVisible();
	await expect(menu(page).getByRole('menuitemcheckbox')).toHaveCount(1);
	// The second item, Reprogramar vencidas, is below Modo mínimo (qa/block-reschedule.md); nothing else.
	await expect(menu(page).getByRole('menuitem')).toHaveCount(1);
	await expect(menu(page).getByRole('menuitem')).toHaveText(/Reprogramar vencidas/);
	await expect(modeItem(page)).toHaveAttribute('aria-checked', 'false');
	await expect(menu(page).getByRole('button')).toHaveCount(0);
	const [top, below] = [await modeItem(page).boundingBox(), await menu(page).getByRole('menuitem').boundingBox()];
	expect(below!.y).toBeGreaterThan(top!.y);
	await page.getByRole('heading', { name: 'Pendientes' }).click();
	await expect(menu(page)).toHaveCount(0);
	await expect(line(page)).toHaveCount(0);

	// Step 2.
	await setMode(page, true);
	await listIs(page, []);

	// Step 3.
	const lineColor = await line(page).evaluate((e) => getComputedStyle(e).color);
	const headingColor = await page
		.getByRole('heading', { name: 'Pendientes' })
		.evaluate((e) => getComputedStyle(e).color);
	expect(lineColor).not.toBe(headingColor);
	await expect(line(page).locator('svg, img')).toHaveCount(0);
	await line(page).click();
	await expect(menu(page)).toHaveCount(0);
	await noMessage(page);
	await expect(line(page)).toBeVisible();
	await menuButton(page).click();
	await expect(modeItem(page)).toHaveAttribute('aria-checked', 'true');
	await modeItem(page).click();
	await expect(menu(page)).toHaveCount(0);
	await expect(line(page)).toHaveCount(0);
	await noMessage(page);
	await expect(page.getByRole('checkbox', { name: 'Completadas' })).toBeVisible();
	await expect(showPaused(page)).toBeVisible();

	// Step 4.
	await create(page, { title: 'Foco', kind: 'No se repite', essential: true });
	await setMode(page, true);
	await listIs(page, ['Foco']);
	await page.reload();
	await expect(line(page)).toBeVisible();
	await listIs(page, ['Foco']);
	await page.close();
	const again = await page.context().newPage();
	await again.goto('/');
	await expect(again.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
	await expect(line(again)).toBeVisible();
	await listIs(again, ['Foco']);

	// Step 5.
	await advance(again, '2026-07-30T09:00:00');
	await expect(line(again)).toBeVisible();
	await listIs(again, ['Foco']);
	await setMode(again, false);
});

// ---------------------------------------------------------------------------
// Flow 3
// ---------------------------------------------------------------------------

const ALL = ['Cena', 'Foco', 'Pagar', 'Barrer', 'Lavar', 'Basura', 'Planchar', 'Regar', 'Secar'];

test('Flow 3: which rows are in view', async ({ page }) => {
	await sessionWithClock(page, '2026-07-15T09:00:00');

	// Step 1.
	const every2 = { kind: 'Intervalo', every: '2', unit: 'días' } as const;
	await create(page, { title: 'Cena', kind: 'No se repite' });
	await create(page, { title: 'Foco', kind: 'No se repite', essential: true });
	await create(page, { title: 'Pagar', kind: 'No se repite', date: '2026-07-14', essential: true });
	await create(page, { title: 'Barrer', ...every2, essential: true });
	await create(page, { title: 'Lavar', ...every2 });
	await create(page, { title: 'Basura', kind: 'Días de la semana', days: ['miércoles'], essential: true });
	await create(page, { title: 'Planchar', kind: 'Días de la semana', days: ['jueves'] });
	await create(page, { title: 'Regar', ...every2, essential: true });
	await create(page, { title: 'Secar', ...every2 });

	// Step 2.
	await toggleShowCompleted(page, true);
	await complete(page, 'Barrer');
	await complete(page, 'Lavar');
	await toggleShowCompleted(page, false);
	await togglePaused(page, true);
	await pause(page, 'Regar');
	await pause(page, 'Secar');
	await togglePaused(page, false);
	await listHas(page, ['Pagar', 'Basura', 'Cena', 'Foco', 'Planchar']);
	const l0 = await titles(page, ALL);
	for (const t of l0) await expect(star(page, t)).toHaveCount(['Pagar', 'Basura', 'Foco'].includes(t) ? 1 : 0);

	// Step 3.
	await setMode(page, true);
	const inMode = l0.filter((t) => ['Pagar', 'Basura', 'Foco'].includes(t));
	await listIs(page, inMode);
	for (const t of ['Cena', 'Planchar', 'Lavar']) await expect(row(page, t)).toHaveCount(0);

	// Step 4.
	await toggleShowCompleted(page, true);
	await listIs(page, [...inMode, 'Barrer']);
	await waitStatus(page, 'Barrer', 'en espera', undefined, true);
	await expect(star(page, 'Barrer')).toHaveCount(1);
	await expect(row(page, 'Lavar')).toHaveCount(0);

	// Step 5.
	await togglePaused(page, true);
	await listIs(page, [...inMode, 'Barrer', 'Regar']);
	await viewPaused(page, 'Regar');
	await expect(star(page, 'Regar')).toHaveCount(1);
	for (const t of ['Secar', 'Lavar', 'Planchar', 'Cena']) await expect(row(page, t)).toHaveCount(0);

	// Step 6.
	await toggleShowCompleted(page, false);
	await togglePaused(page, false);
	await goA(page, 'Historial');
	await expect(page.getByRole('listitem').filter({ hasText: /^Barrer/ })).toHaveCount(1);
	await expect(page.getByRole('listitem').filter({ hasText: /^Lavar/ })).toHaveCount(1);
	await openEntry(page, 'Lavar');
	await expect(textInPanel(page, 'Pausada por el modo mínimo')).toBeVisible();
	await close(page);
	await goA(page, 'Pendientes');

	// Step 7.
	await setMode(page, false);
	await listHas(page, [...l0, 'Lavar']);
	await waitStatus(page, 'Lavar', 'pendiente', undefined, false);
	await expect(row(page, 'Regar')).toHaveCount(0);
	await expect(row(page, 'Secar')).toHaveCount(0);
	await togglePaused(page, true);
	await viewPaused(page, 'Regar');
	await viewPaused(page, 'Secar');
});

// ---------------------------------------------------------------------------
// Flow 4
// ---------------------------------------------------------------------------

test('Flow 4: return without debt', async ({ page }) => {
	await sessionWithClock(page, '2026-07-10T09:00:00');

	// Step 1.
	const every2 = { kind: 'Intervalo', every: '2', unit: 'días' } as const;
	await create(page, { title: 'Regar', ...every2 });
	await complete(page, 'Regar');
	await create(page, { title: 'Barrer', ...every2 });
	await create(page, { title: 'Sacar la basura', kind: 'Días de la semana', days: ['martes', 'jueves'] });
	await create(page, { title: 'Foco', kind: 'No se repite', essential: true });
	await create(page, { title: 'Pagar', kind: 'No se repite', date: '2026-07-14' });

	// Step 2.
	await advance(page, '2026-07-14T08:00:00');
	await setMode(page, true);
	await listIs(page, ['Foco']);

	// Step 3.
	await advance(page, '2026-07-20T10:00:00');
	await listIs(page, ['Foco']);
	await expect(line(page)).toBeVisible();
	await expect(page.getByText('Atrasada')).toHaveCount(0);
	await expect(page.getByText(/^Tocaba /)).toHaveCount(0);

	// Step 4.
	await setMode(page, false);
	for (const t of ['Regar', 'Barrer']) {
		await waitStatus(page, t, 'pendiente', undefined, false);
		await overdueTextAbsent(page, t);
	}
	await waitStatus(page, 'Pagar', 'atrasada', undefined, false);
	await waitStatus(page, 'Sacar la basura', 'en espera', undefined, false);
	await overdueTextAbsent(page, 'Sacar la basura');

	// Step 5.
	await advance(page, '2026-07-21T00:00:00');
	await waitStatus(page, 'Sacar la basura', 'pendiente', undefined, false);

	// Step 6.
	await advance(page, '2026-07-23T09:00:00');
	await complete(page, 'Regar');
	await complete(page, 'Barrer');
	await expect(row(page, 'Regar')).toHaveCount(0);
	await expect(row(page, 'Barrer')).toHaveCount(0);
	await setMode(page, true);
	await advance(page, '2026-07-24T10:00:00');
	await setMode(page, false);
	await waitStatus(page, 'Regar', 'pendiente', undefined, false);
	await waitStatus(page, 'Barrer', 'pendiente', undefined, false);
});

// ---------------------------------------------------------------------------
// Flow 5
// ---------------------------------------------------------------------------

test('Flow 5: panel of a non-essential task during the mode', async ({ page }) => {
	await sessionWithClock(page, '2026-07-15T09:00:00');

	// Step 1.
	const every2 = { kind: 'Intervalo', every: '2', unit: 'días' } as const;
	await create(page, { title: 'Regar', ...every2 });
	await create(page, { title: 'Limpiar', ...every2 });
	await create(page, { title: 'Pagar', kind: 'No se repite', date: '2026-07-14' });
	await create(page, { title: 'Basura', kind: 'Días de la semana', days: ['miércoles'] });
	await toggleShowCompleted(page, true);
	for (const t of ['Regar', 'Limpiar', 'Pagar', 'Basura']) await complete(page, t);
	await waitStatus(page, 'Limpiar', 'en espera');
	await pause(page, 'Limpiar');
	await setMode(page, true);

	// Step 2.
	await openEntry(page, 'Regar');
	await expect(textInPanel(page, 'Pausada por el modo mínimo')).toBeVisible();
	await expect(page.getByText(/^Última vez/)).toBeVisible();
	await expect(buttonNamed(page, 'Borrar tarea')).toBeVisible();
	for (const b of ['Pausar', 'Reanudar', 'Posponer', 'Quitar posponer'])
		await expect(buttonNamed(page, b)).toHaveCount(0);
	await expect(essentialCheck(page)).not.toBeChecked();
	await close(page);

	// Step 3.
	await openEntry(page, 'Pagar');
	await expect(textInPanel(page, /^Pausada/)).toHaveCount(0);
	for (const b of ['Pausar', 'Reanudar'])
		await expect(buttonNamed(page, b)).toHaveCount(0);
	await close(page);

	// Step 4.
	await openEntry(page, 'Limpiar');
	await expect(textInPanel(page, 'Pausada', true)).toBeVisible();
	await expect(textInPanel(page, 'Pausada por el modo mínimo')).toHaveCount(0);
	await expect(buttonNamed(page, 'Reanudar')).toBeVisible();
	await expect(buttonNamed(page, 'Pausar')).toHaveCount(0);
	await expect(buttonNamed(page, 'Posponer')).toHaveCount(0);
	await buttonNamed(page, 'Reanudar').click();
	await expect(dialog(page)).toHaveCount(0);
	await openEntry(page, 'Limpiar');
	await expect(textInPanel(page, 'Pausada por el modo mínimo')).toBeVisible();
	await expect(buttonNamed(page, 'Reanudar')).toHaveCount(0);
	await expect(buttonNamed(page, 'Pausar')).toHaveCount(0);
	await close(page);

	// Step 5.
	await goA(page, 'Pendientes');
	await setMode(page, false);
	await waitStatus(page, 'Limpiar', 'pendiente', undefined, false);
});

// ---------------------------------------------------------------------------
// Flow 6
// ---------------------------------------------------------------------------

test('Flow 6: changing the Esencial mark or the kind with the mode on', async ({ page }) => {
	await sessionWithClock(page, '2026-07-15T09:00:00');

	// Step 1.
	await create(page, { title: 'Foco', kind: 'No se repite', essential: true });
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días', essential: true });
	await create(page, { title: 'Cena', kind: 'No se repite' });
	await complete(page, 'Regar');
	await complete(page, 'Cena');
	await setMode(page, true);
	await listIs(page, ['Foco']);

	// Step 2.
	await edit(page, 'Foco', { essential: false });
	await listIs(page, []);
	await expect(line(page)).toBeVisible();

	// Step 3.
	await toggleShowCompleted(page, true);
	await listIs(page, ['Regar']);
	await edit(page, 'Regar', { essential: false });
	await listIs(page, []);
	await toggleShowCompleted(page, false);
	await listIs(page, []);

	// Step 4.
	await advance(page, '2026-07-20T10:00:00');
	await openEntry(page, 'Regar');
	await expect(textInPanel(page, 'Pausada por el modo mínimo')).toBeVisible();
	await completePanel(page, { essential: true });
	await save(page);
	await goA(page, 'Pendientes');
	await waitStatus(page, 'Regar', 'pendiente', undefined, false);
	await overdueTextAbsent(page, 'Regar');

	// Step 5.
	await openEntry(page, 'Cena');
	await completePanel(page, { essential: true });
	await save(page);
	await goA(page, 'Pendientes');
	await toggleShowCompleted(page, true);
	await waitStatus(page, 'Cena', 'pendiente', undefined, true);
	await expect(star(page, 'Cena')).toHaveCount(1);

	// Step 6.
	await edit(page, 'Regar', { kind: 'No se repite' });
	await expect(row(page, 'Regar')).toBeVisible();
	await edit(page, 'Regar', { essential: false });
	await expect(row(page, 'Regar')).toHaveCount(0);
	await openEntry(page, 'Regar');
	await completePanel(page, { kind: 'Intervalo', every: '2', unit: 'días' });
	await save(page);
	await goA(page, 'Pendientes');
	await expect(row(page, 'Regar')).toHaveCount(0);
	await openEntry(page, 'Regar');
	await expect(textInPanel(page, 'Pausada por el modo mínimo')).toBeVisible();
	await close(page);
	await goA(page, 'Pendientes');

	// Step 7.
	await page.getByRole('button', { name: '+' }).click();
	await expect(essentialCheck(page)).toBeChecked();
	await close(page);
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
	await page.getByRole('button', { name: '+' }).click();
	await essentialCheck(page).uncheck();
	await page.getByRole('button', { name: 'Cerrar' }).click();
	const notice = page.getByRole('alertdialog', { name: 'Tenés cambios sin guardar' });
	await expect(notice).toBeVisible();
	await notice.getByRole('button', { name: 'Seguir editando' }).click();
	await completePanel(page, { title: 'Barrer', kind: 'Intervalo', every: '2', unit: 'días' });
	await save(page);
	await expect(row(page, 'Barrer')).toHaveCount(0);
	await create(page, { title: 'Foco 2', kind: 'No se repite' });
	await expect(row(page, 'Foco 2')).toBeVisible();
	await expect(star(page, 'Foco 2')).toHaveCount(1);
});

// ---------------------------------------------------------------------------
// Flow 7
// ---------------------------------------------------------------------------

test('Flow 7: the loading screen', async ({ page, browser }) => {
	await sessionWithClock(page, '2026-07-15T09:00:00');
	await setMode(page, true);
	await create(page, { title: 'Foco', kind: 'No se repite', essential: true });
	await create(page, { title: 'Cena', kind: 'No se repite', essential: false });
	await listIs(page, ['Foco']);

	// Another device with the same account and nothing stored: the data really has to come over the network.
	for (const on of [true, false]) {
		if (!on) await setMode(page, false);
		const device = await otherDeviceWithSession(browser, page);
		const d = device.page;
		// Records whether, once the screen is gone, a wrong first state was ever shown.
		await d.addInitScript((isOn) => {
			const w = window as unknown as { qaWrong: string[] };
			w.qaWrong = [];
			document.addEventListener('DOMContentLoaded', () => {
				const check = () => {
					const main = document.querySelector('main');
					if (!main || getComputedStyle(main).visibility === 'hidden') return;
					const text = (main as HTMLElement).innerText;
					if (!text.includes('Completadas')) return;
					const hasLine = text.split('\n').some((l) => l.trim() === 'Modo mínimo');
					if (hasLine !== isOn || text.includes('Cena') === isOn) w.qaWrong.push(text);
				};
				new MutationObserver(check).observe(document, {
					subtree: true,
					childList: true,
					attributes: true,
					characterData: true
				});
			});
		}, on);
		// Steps 1 and 2.
		const data = await retain(d, DATA);
		await d.goto('/', { waitUntil: 'commit' });
		await expect(screenName(d)).toBeVisible();
		await d.waitForTimeout(3000);
		await expect(screenName(d)).toBeVisible();
		data.release();
		await expect(screenName(d)).toHaveCount(0);
		await expect(d.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
		if (on) {
			await expect(line(d)).toBeVisible();
			await listIs(d, ['Foco']);
			await expect(row(d, 'Cena')).toHaveCount(0);
		} else {
			await expect(line(d)).toHaveCount(0);
			await listHas(d, ['Foco', 'Cena']);
		}
		expect(await d.evaluate(() => (window as unknown as { qaWrong?: string[] }).qaWrong ?? [])).toEqual([]);
		await device.ctx.close();
	}

	// Step 3: without a session the screen does not wait for the mode.
	const visitor = await browser.newContext({ baseURL: 'http://127.0.0.1:4173', locale: 'es-AR' });
	const anon = await visitor.newPage();
	await retain(anon, DATA);
	await anon.goto('/', { waitUntil: 'commit' });
	await expect(anon.getByRole('button', { name: 'Entrar con Google' })).toBeVisible();
	await expect(screenName(anon)).toHaveCount(0);
	await visitor.close();
});

// ---------------------------------------------------------------------------
// Flow 8
// ---------------------------------------------------------------------------

test('Flow 8: two devices', async ({ browser }) => {
	const { a, b, ctxB, close: end } = await twoDevices(browser, '2026-07-14T08:00:00');

	// Step 1.
	await create(a, { title: 'Foco', kind: 'No se repite', essential: true });
	await create(a, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await expect(row(b, 'Foco')).toBeVisible();
	await expect(row(b, 'Regar')).toBeVisible();

	// Step 2.
	await setMode(a, true);
	await expect(line(b)).toBeVisible();
	await listIs(b, ['Foco']);
	await menuButton(b).click();
	await expect(modeItem(b)).toHaveAttribute('aria-checked', 'true');
	await page2close(b);

	// Step 3.
	await ctxB.setOffline(true);
	await advance(a, '2026-07-20T10:00:00');
	await advance(b, '2026-07-20T10:00:00');
	await setMode(a, false);
	await waitStatus(a, 'Regar', 'pendiente', undefined, false);
	await arrivesOnServer(a);
	await expect(line(b)).toBeVisible();
	await listIs(b, ['Foco']);

	// Step 4.
	await ctxB.setOffline(false);
	await arrivesOnServer(b);
	for (const p of [a, b]) {
		await expect(line(p)).toHaveCount(0);
		await waitStatus(p, 'Regar', 'pendiente', undefined, false);
	}

	// Step 5.
	await ctxB.setOffline(true);
	await setMode(a, true);
	await arrivesOnServer(a);
	await setMode(b, true, false);
	await setMode(b, false, false);
	await ctxB.setOffline(false);
	await arrivesOnServer(b);
	await expect(line(a)).toHaveCount(0);
	await expect(line(b)).toHaveCount(0);

	// Step 6.
	await ctxB.setOffline(true);
	await edit(a, 'Regar', { essential: true });
	await arrivesOnServer(a);
	await edit(b, 'Regar', { title: 'Regar plantas' });
	await ctxB.setOffline(false);
	await arrivesOnServer(b);
	for (const p of [a, b]) {
		await expect(row(p, 'Regar plantas')).toBeVisible();
		await expect(star(p, 'Regar plantas')).toHaveCount(1);
	}

	// Step 7.
	await setMode(a, true);
	await expect(line(b)).toBeVisible();
	await a.getByRole('button', { name: '+' }).click();
	await expect(essentialCheck(a)).toBeChecked();
	await setMode(b, false);
	await expect(line(a)).toHaveCount(0);
	await expect(essentialCheck(a)).toBeChecked();
	await close(a);
	await expect(a.getByRole('alertdialog')).toHaveCount(0);

	// Step 8.
	await setMode(b, true);
	await a.reload();
	await expect(line(a)).toBeVisible();
	await end();
});

/** Closes an open menu by tapping outside it. */
async function page2close(page: Page) {
	await page.getByRole('heading', { name: 'Pendientes' }).click();
	await expect(menu(page)).toHaveCount(0);
}
