import { expect, test, type Page } from '@playwright/test';
import {
	advance,
	arrivesOnServer,
	cleanEmulators,
	close,
	complete,
	create,
	createAndView,
	edit,
	expectShowCompleted,
	expectShowPaused,
	goA,
	listIs,
	menu,
	menuButton,
	menuSwitch,
	openMenu,
	openTask,
	row,
	rowTitle,
	sessionWithClock,
	settle,
	stop,
	toggleShowCompleted,
	toggleShowPaused,
	twoDevices,
	viewHistory,
	waitStatus,
	withClock
} from './support';

// qa/menu-toggles.md: Completadas and Pausadas as on/off items of the ⋮ menu.

const TODAY = '2026-07-15T08:00:00';

test.beforeEach(async () => {
	await cleanEmulators();
});

const items = (page: Page) => menu(page).locator('[role^="menuitem"]');
const modeItem = (page: Page) => menuSwitch(page, 'Modo mínimo');
const notice = (page: Page) => page.getByRole('status');

/** No notice, toast, dialog or alert (the "Sin conexión" strip is not about the menu). */
async function noMessage(page: Page) {
	await expect(page.getByRole('status').filter({ hasNotText: 'Sin conexión' })).toHaveCount(0);
	await expect(page.getByRole('alert')).toHaveCount(0);
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
	await expect(page.getByRole('dialog')).toHaveCount(0);
}

/** Nothing outside the menu shows the value of Completadas or Pausadas (menu closed). */
async function nothingOutsideMenu(page: Page) {
	await expect(menu(page)).toHaveCount(0);
	await expect(page.getByRole('checkbox', { name: /^(Mostrar )?(completadas|pausadas)$/i })).toHaveCount(0);
	await expect(page.getByRole('menuitemcheckbox')).toHaveCount(0);
	await expect(page.getByText(/^(Mostrar )?(completadas|pausadas)$/i)).toHaveCount(0);
}

/** Opens the menu, taps the item and verifies it closed the menu with no message. */
async function tapSwitch(page: Page, name: string) {
	await openMenu(page);
	await menuSwitch(page, name).click();
	await expect(menu(page)).toHaveCount(0);
	await noMessage(page);
	await nothingOutsideMenu(page);
}

async function checked(page: Page, name: string, on: boolean) {
	await openMenu(page);
	await expect(menuSwitch(page, name)).toHaveAttribute('aria-checked', String(on));
}

test('Flow 1: the menu and its items', async ({ page }) => {
	await sessionWithClock(page, TODAY);

	// Step 1.
	await expect(page.getByRole('checkbox', { name: /completadas|pausadas/i })).toHaveCount(0);
	await menuButton(page).click();
	await expect(menu(page)).toBeVisible();
	await expect(items(page)).toHaveCount(4);
	await expect(items(page)).toHaveText([/Modo mínimo/, /Completadas/, /Pausadas/, /Reprogramar vencidas/]);
	await expect(menu(page).getByRole('menuitemcheckbox')).toHaveText([/Modo mínimo/, /Completadas/, /Pausadas/]);
	await expect(menu(page).getByRole('menuitem')).toHaveText([/Reprogramar vencidas/]);
	for (const name of ['Modo mínimo', 'Completadas', 'Pausadas']) {
		await expect(menuSwitch(page, name)).toHaveAttribute('aria-checked', 'false');
		await expect(menuSwitch(page, name)).toBeEnabled();
		await expect(menuSwitch(page, name)).not.toHaveAttribute('aria-disabled', 'true');
	}
	await page.getByRole('heading', { name: 'Pendientes' }).click();
	await expect(menu(page)).toHaveCount(0);
	await listIs(page, []);
	await expectShowCompleted(page, false);
	await expectShowPaused(page, false);

	// Step 2.
	await create(page, { title: 'Cambiar foco', kind: 'No se repite' });
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await create(page, { title: 'Sacar la basura', kind: 'Días de la semana', days: ['sábado'] });
	await advance(page, '2026-07-15T08:05:00');
	await complete(page, 'Regar');
	await expect(row(page, 'Regar')).toHaveCount(0);

	// Step 3.
	await tapSwitch(page, 'Completadas');
	await listIs(page, ['Cambiar foco', 'Sacar la basura', 'Regar']);
	await waitStatus(page, 'Regar', 'en espera', 0);

	// Step 4.
	await checked(page, 'Completadas', true);
	await expect(menuSwitch(page, 'Modo mínimo')).toHaveAttribute('aria-checked', 'false');
	await expect(menuSwitch(page, 'Pausadas')).toHaveAttribute('aria-checked', 'false');
	await menuSwitch(page, 'Completadas').click();
	await expect(menu(page)).toHaveCount(0);
	await listIs(page, ['Cambiar foco', 'Sacar la basura']);
	await expect(row(page, 'Regar')).toHaveCount(0);

	// Step 5.
	await tapSwitch(page, 'Pausadas');
	await listIs(page, ['Cambiar foco', 'Sacar la basura']);
	await checked(page, 'Pausadas', true);
	await menuSwitch(page, 'Pausadas').click();
	await expect(menu(page)).toHaveCount(0);
	await checked(page, 'Pausadas', false);
	await page.keyboard.press('Escape');

	// Step 6.
	await toggleShowCompleted(page, true);
	await openTask(page, 'Regar');
	await page.getByRole('button', { name: 'Pausar', exact: true }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await listIs(page, ['Cambiar foco', 'Sacar la basura']);
	await toggleShowPaused(page, true);
	await listIs(page, ['Cambiar foco', 'Sacar la basura', 'Regar']);
	const paused = row(page, 'Regar');
	await expect(paused.getByText('Pausada')).toHaveCount(1);
	await expect(paused.getByRole('checkbox')).toBeDisabled();
	await toggleShowCompleted(page, false);
	await toggleShowPaused(page, false);
	await listIs(page, ['Cambiar foco', 'Sacar la basura']);
});

test('Flow 2: always enabled, also with the mode on and with nothing to show', async ({ page }) => {
	await sessionWithClock(page, TODAY);

	// Step 1.
	await listIs(page, []);
	await openMenu(page);
	await expect(menuSwitch(page, 'Completadas')).toBeEnabled();
	await expect(menuSwitch(page, 'Pausadas')).toBeEnabled();
	await menuSwitch(page, 'Completadas').click();
	await expect(menu(page)).toHaveCount(0);
	await listIs(page, []);
	await checked(page, 'Completadas', true);
	await menuSwitch(page, 'Completadas').click();
	await expect(menu(page)).toHaveCount(0);
	await expectShowCompleted(page, false);

	// Step 2.
	await create(page, { title: 'Foco', kind: 'No se repite', essential: true });
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días', essential: false });
	await tapSwitch(page, 'Modo mínimo');
	const line = page.getByText('Modo mínimo', { exact: true });
	await expect(line).toBeVisible();
	await listIs(page, ['Foco']);

	// Step 3.
	await openMenu(page);
	await expect(items(page)).toHaveCount(4);
	await expect(menuSwitch(page, 'Completadas')).toBeEnabled();
	await expect(menuSwitch(page, 'Pausadas')).toBeEnabled();
	await expect(menuSwitch(page, 'Completadas')).not.toHaveAttribute('aria-disabled', 'true');
	await expect(menuSwitch(page, 'Pausadas')).not.toHaveAttribute('aria-disabled', 'true');
	await expect(modeItem(page)).toHaveAttribute('aria-checked', 'true');
	await menuSwitch(page, 'Completadas').click();
	await expect(menu(page)).toHaveCount(0);
	await noMessage(page);
	await expect(line).toBeVisible();
	await tapSwitch(page, 'Pausadas');
	await expect(line).toBeVisible();
	await listIs(page, ['Foco']);
	await expect(row(page, 'Regar')).toHaveCount(0);

	// Step 4.
	await tapSwitch(page, 'Modo mínimo');
	await expect(line).toHaveCount(0);
	await listIs(page, ['Regar', 'Foco']);
	await expectShowCompleted(page, true);
	await expectShowPaused(page, true);
});

test('Flow 3: the value is saved on the device', async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await sessionWithClock(page, TODAY);

	// Step 1.
	await create(page, { title: 'Cambiar foco', kind: 'No se repite' });
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await complete(page, 'Regar');
	await create(page, { title: 'Sacar basura', kind: 'Intervalo', every: '1', unit: 'días' });
	await openTask(page, 'Sacar basura');
	await page.getByRole('button', { name: 'Pausar', exact: true }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await listIs(page, ['Cambiar foco']);

	// Step 2.
	await toggleShowCompleted(page, true);
	await toggleShowPaused(page, true);
	await listIs(page, ['Cambiar foco', 'Regar', 'Sacar basura']);
	await waitStatus(page, 'Regar', 'en espera', 0);
	await expect(row(page, 'Sacar basura').getByText('Pausada')).toHaveCount(1);

	// Step 3.
	await page.reload();
	await expectShowCompleted(page, true);
	await expectShowPaused(page, true);
	await listIs(page, ['Cambiar foco', 'Regar', 'Sacar basura']);

	// Step 4.
	await page.close();
	const fresh = await context.newPage();
	await fresh.clock.install({ time: new Date(TODAY) });
	await fresh.goto('/');
	await expect(fresh.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
	await expect(fresh.getByRole('button', { name: 'Entrar con Google' })).toHaveCount(0);
	await expectShowCompleted(fresh, true);
	await expectShowPaused(fresh, true);
	await listIs(fresh, ['Cambiar foco', 'Regar', 'Sacar basura']);

	// Step 5.
	await toggleShowCompleted(fresh, false);
	await fresh.reload();
	await expectShowCompleted(fresh, false);
	await expectShowPaused(fresh, true);
	await listIs(fresh, ['Cambiar foco', 'Sacar basura']);
	await context.close();
});

test('Flow 4: the value is not synced between devices', async ({ browser }) => {
	const { a, b, close: end } = await twoDevices(browser, TODAY);

	// Step 1.
	await create(a, { title: 'Cambiar foco', kind: 'No se repite' });
	await create(a, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await complete(a, 'Regar');
	await listIs(b, ['Cambiar foco']);

	// Step 2.
	await toggleShowCompleted(a, true);
	await listIs(a, ['Cambiar foco', 'Regar']);
	await expectShowCompleted(b, false);
	await listIs(b, ['Cambiar foco']);
	await b.reload();
	await expectShowCompleted(b, false);
	await listIs(b, ['Cambiar foco']);

	// Step 3.
	await toggleShowCompleted(b, true);
	await toggleShowCompleted(a, false);
	await listIs(a, ['Cambiar foco']);
	await expectShowCompleted(b, true);
	await listIs(b, ['Cambiar foco', 'Regar']);
	await end();
});

test('Flow 5: a completed one-off task never has a row', async ({ page }) => {
	const start = new Date(new Date(TODAY).getTime() - 600_000).toISOString();
	await sessionWithClock(page, start);
	await toggleShowCompleted(page, true);

	// Step 1.
	await createAndView(page, { title: 'Pagar la luz', kind: 'No se repite' });
	await createAndView(page, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await createAndView(page, { title: 'Cambiar foco', kind: 'No se repite' });
	await stop(page, TODAY);

	// Step 2.
	await complete(page, 'Pagar la luz');
	await page.clock.runFor(2000);
	await complete(page, 'Regar');
	await expect(notice(page)).toContainText('Completaste «Regar»');
	await withClock(page, async () => {
		await listIs(page, ['Cambiar foco', 'Regar']);
		await waitStatus(page, 'Regar', 'en espera', 0);
		await expect(row(page, 'Pagar la luz')).toHaveCount(0);
	});

	// Step 3.
	await page.clock.runFor(1000);
	await notice(page).getByRole('button', { name: 'Deshacer' }).click();
	await settle(page);
	await withClock(page, () => waitStatus(page, 'Regar', 'pendiente'));
	await complete(page, 'Regar');
	await page.clock.runFor(10_000);
	await withClock(page, async () => {
		await listIs(page, ['Cambiar foco', 'Regar']);
		await waitStatus(page, 'Regar', 'en espera', 0);
	});

	// Step 4.
	await toggleShowCompleted(page, false);
	await withClock(page, async () => {
		await listIs(page, ['Cambiar foco']);
		await expect(row(page, 'Pagar la luz')).toHaveCount(0);
	});
	await toggleShowCompleted(page, true);
	await withClock(page, async () => {
		await listIs(page, ['Cambiar foco', 'Regar']);
		await expect(row(page, 'Pagar la luz')).toHaveCount(0);
	});

	// Step 5.
	await goA(page, 'Historial');
	await withClock(page, () => expect(page.getByRole('listitem').filter({ hasText: 'Pagar la luz' })).toHaveCount(1));
	await openTask(page, 'Pagar la luz');
	await close(page);
	await expect(page.getByRole('heading', { name: 'Historial', level: 1 })).toBeVisible();
	await page.getByRole('listitem').filter({ hasText: 'Pagar la luz' }).getByRole('button', { name: 'Borrar', exact: true }).click();
	await page.getByRole('alertdialog').getByRole('button', { name: 'Borrar', exact: true }).click();
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
	await goA(page, 'Pendientes');
	await withClock(page, async () => {
		await listIs(page, ['Pagar la luz', 'Cambiar foco', 'Regar']);
		await waitStatus(page, 'Pagar la luz', 'pendiente');
	});

	// Step 6.
	await create(page, { title: 'Planchar', kind: 'Intervalo', every: '2', unit: 'días' });
	await withClock(page, () => expect(row(page, 'Planchar')).toBeVisible());
	await complete(page, 'Planchar');
	await withClock(page, () => waitStatus(page, 'Planchar', 'en espera', 0));
	await edit(page, 'Planchar', { kind: 'No se repite' });
	await withClock(page, async () => {
		await expect(row(page, 'Planchar')).toHaveCount(0);
	});
	await toggleShowCompleted(page, false);
	await withClock(page, () => expect(row(page, 'Planchar')).toHaveCount(0));
	await toggleShowCompleted(page, true);
	await withClock(page, () => expect(row(page, 'Planchar')).toHaveCount(0));
	await goA(page, 'Historial');
	await withClock(page, () => openTask(page, 'Planchar'));
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
});
