import { expect, test, type Locator, type Page } from '@playwright/test';
import {
	advance,
	cleanEmulators,
	complete,
	create,
	goA,
	menu,
	menuButton,
	openMenu,
	openSelector,
	openTask,
	row,
	selectorEmoji,
	stop,
	toggleSwitch,
	turnOnCompleted,
	sessionWithClock,
	viewHistory,
	withClock,
} from './support';
import { AUTH, retain, screenName } from './screen-support';

const TODAY = '2026-07-15T08:00:00';
const PHONE = { width: 390, height: 844 };
const WIDE = { width: 1280, height: 800 };

test.beforeEach(async () => {
	await cleanEmulators();
});

const path = (page: Page) => new URL(page.url()).pathname;
const volver = (page: Page) => page.getByRole('button', { name: 'Volver', exact: true });
const historialItem = (page: Page) => menu(page).getByRole('menuitem', { name: 'Historial', exact: true });
const plus = (page: Page) => page.getByRole('button', { name: '+' });
const notice = (page: Page) => page.getByRole('status').filter({ hasText: /^Completaste/ });
const MENU_ITEMS = [/Historial/, /Modo mínimo/, /Completadas/, /Pausadas/, /Reprogramar vencidas/];

/** There is no navigation bar: no region and no link named after the screens. */
async function noBar(page: Page) {
	await expect(page.getByRole('navigation')).toHaveCount(0);
	await expect(page.getByRole('link', { name: /^(Pendientes|Historial)$/ })).toHaveCount(0);
}

/** The Historial is shown at `/history`, with Volver and without the Menú button. */
async function historyIsShown(page: Page) {
	await expect(page.getByRole('heading', { name: 'Historial', level: 1 })).toBeVisible();
	await expect.poll(() => path(page)).toBe('/history');
	await expect(volver(page)).toBeVisible();
	await expect(menuButton(page)).toHaveCount(0);
	await noBar(page);
}

/** Pendientes is shown, at `/`, with no notice or message of a missing page. */
async function pendingWithoutNotice(page: Page) {
	await expect(page.getByRole('heading', { name: 'Pendientes', level: 1 })).toBeVisible();
	await expect.poll(() => path(page)).toBe('/');
	await noBar(page);
	await expect(page.getByRole('status')).toHaveCount(0);
	await expect(page.getByRole('alert')).toHaveCount(0);
	await expect(page.getByText(/no existe|no encontrad|404|not found/i)).toHaveCount(0);
}

/** The element is at the bottom edge of the viewport (a rem and a quarter at most from it). */
async function atBottomEdge(page: Page, l: Locator) {
	const box = (await l.boundingBox())!;
	const height = page.viewportSize()!.height;
	expect(box.y + box.height).toBeLessThanOrEqual(height);
	expect(height - (box.y + box.height)).toBeLessThanOrEqual(24);
}

/** Scrolled to the end, `last` is wholly in view and above the top of every `over` element shown. */
async function lastIsClear(page: Page, last: Locator, over: Locator[]) {
	await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
	await page.clock.runFor(100);
	const box = (await last.boundingBox())!;
	expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
	for (const o of over) {
		if ((await o.count()) === 0) continue;
		const ob = (await o.boundingBox())!;
		// Only what sits below the entry can cover it.
		if (ob.y > box.y) expect(box.y + box.height).toBeLessThanOrEqual(ob.y + 0.5);
	}
	const covered = await last.evaluate((e) => {
		const r = e.getBoundingClientRect();
		const top = document.elementFromPoint(r.left + 20, r.top + r.height / 2);
		return !top || !e.contains(top);
	});
	expect(covered, 'the last row or entry is covered').toBe(false);
}

/** Nothing of annotations: no control, no text of the removed concept. */
async function nothingOfAnnotations(page: Page) {
	await expect(
		page.getByRole('button', { name: /^(Anotar|Copiar|Editar texto|Me sirvió|Me molestó)$/ }),
	).toHaveCount(0);
	await expect(page.getByRole('link', { name: 'Anotaciones' })).toHaveCount(0);
	await expect(
		page.getByText(/Anotación guardada|Anotaciones copiadas|No se pudo copiar|Todavía no hay anotaciones/),
	).toHaveCount(0);
}

/** Flow 1 steps 1 to 6 on the current screen size. */
async function menuItemAndVolver(page: Page) {
	// Step 1.
	await page.goto('/');
	await pendingWithoutNotice(page);
	await expect(page.getByRole('listitem')).toHaveCount(0);
	await atBottomEdge(page, plus(page));

	// Step 2.
	await openMenu(page);
	await expect(menu(page).locator('[role^="menuitem"]')).toHaveText(MENU_ITEMS);
	await expect(historialItem(page)).toBeEnabled();
	await expect(historialItem(page)).not.toHaveAttribute('aria-disabled', 'true');
	await expect(historialItem(page)).not.toHaveAttribute('aria-checked', /.*/);
	await page.mouse.click(5, 5);
	await expect(menu(page)).toHaveCount(0);
	await pendingWithoutNotice(page);

	// Step 3.
	await openMenu(page);
	await historialItem(page).click();
	await expect(menu(page)).toHaveCount(0);
	await historyIsShown(page);
	await expect(page.getByText('Todavía no completaste nada')).toBeVisible();

	// Step 4.
	await volver(page).click();
	await pendingWithoutNotice(page);
	await page.goForward();
	await historyIsShown(page);
	await volver(page).click();
	await pendingWithoutNotice(page);

	// Step 5.
	await openMenu(page);
	await historialItem(page).click();
	await historyIsShown(page);
	await page.goBack();
	await pendingWithoutNotice(page);
	await page.goForward();
	await historyIsShown(page);
	await volver(page).click();
	await pendingWithoutNotice(page);

	// Step 6.
	await openMenu(page);
	await historialItem(page).click();
	await historyIsShown(page);
	await volver(page).click();
	await pendingWithoutNotice(page);
	await page.goForward();
	await historyIsShown(page);
	await volver(page).click();
	await pendingWithoutNotice(page);
}

test('Flow 1: no bar, the menu item and Volver', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	for (const size of [PHONE, WIDE]) {
		await page.setViewportSize(size);
		await menuItemAndVolver(page);
	}

	// Step 8.
	await create(page, { title: 'Regar', kind: 'No se repite' });
	await complete(page, 'Regar');
	await openMenu(page);
	await expect(menu(page).locator('[role^="menuitem"]')).toHaveText(MENU_ITEMS);
	await historialItem(page).click();
	await historyIsShown(page);
	await viewHistory(page, [['Hoy', [['Regar', '08:00']]]]);
});

test('Flow 2: the Historial opened directly', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	await page.setViewportSize(PHONE);
	const context = page.context();

	// Step 1 and 2: first address of a new tab.
	const first = await context.newPage();
	await first.goto('/history');
	await historyIsShown(first);
	await volver(first).click();
	await pendingWithoutNotice(first);
	await first.goBack();
	// The entry of /history was replaced: Back does not show the Historial again.
	expect(path(first)).not.toBe('/history');
	await first.close();

	// Step 3.
	const second = await context.newPage();
	await second.goto('/history');
	await historyIsShown(second);
	await second.reload();
	await historyIsShown(second);
	await volver(second).click();
	await pendingWithoutNotice(second);
	await second.close();

	// Step 4.
	await page.goto('/');
	await openMenu(page);
	await historialItem(page).click();
	await historyIsShown(page);
	await page.reload();
	await historyIsShown(page);
});

test('Flow 3: minimal mode and the notice', async ({ page }) => {
	await sessionWithClock(page, '2026-07-15T07:50:00');
	await page.setViewportSize(PHONE);
	const hit = (x: number, y: number) => page.mouse.click(x, y);
	const at = async (hour: string) => {
		const missing = new Date(hour).getTime() - (await page.evaluate(() => Date.now()));
		if (missing > 0) await page.clock.runFor(missing);
	};

	// Step 1.
	await create(page, { title: 'Foco', kind: 'No se repite', essential: true });
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días', essential: false });
	await stop(page, TODAY);
	await complete(page, 'Regar');
	await withClock(page, () => expect(notice(page)).toHaveText(/Completaste «Regar»/));
	await atBottomEdge(page, notice(page));
	await lastIsClear(page, page.getByRole('listitem').last(), [notice(page), plus(page)]);

	// Step 2.
	await at('2026-07-15T08:00:01');
	await goA(page, 'Historial');
	await expect(notice(page)).toHaveCount(1);
	await atBottomEdge(page, notice(page));
	await at('2026-07-15T08:00:03');
	await goA(page, 'Pendientes');
	await expect(notice(page)).toHaveCount(1);
	await at('2026-07-15T08:00:05');
	await expect(notice(page)).toHaveCount(0);

	// Step 3.
	await withClock(page, () => toggleSwitch(page, 'Modo mínimo', true));
	await openMenu(page);
	await expect(historialItem(page)).toBeEnabled();
	await historialItem(page).click();
	await historyIsShown(page);
	await viewHistory(page, [['Hoy', [['Regar', '08:00']]]]);
	const back = (await volver(page).boundingBox())!;
	await page.getByRole('listitem').getByRole('button', { name: 'Regar', exact: true }).click();
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await hit(back.x + back.width / 2, back.y + back.height / 2);
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	expect(path(page)).toBe('/history');
	await page.goBack();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await historyIsShown(page);

	// Step 4.
	await page.getByRole('listitem').getByRole('button', { name: 'Borrar', exact: true }).click();
	await expect(page.getByRole('alertdialog')).toBeVisible();
	await hit(back.x + back.width / 2, back.y + back.height / 2);
	await expect(page.getByRole('alertdialog')).toBeVisible();
	expect(path(page)).toBe('/history');
	await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar' }).click();
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
	await volver(page).click();
	await pendingWithoutNotice(page);
	await expect(page.getByText('Modo mínimo', { exact: true })).toBeVisible();

	// Step 5.
	await withClock(page, () => toggleSwitch(page, 'Modo mínimo', false));
	await goA(page, 'Historial');
	await page.getByRole('listitem').getByRole('button', { name: 'Borrar', exact: true }).click();
	await page.getByRole('alertdialog').getByRole('button', { name: 'Borrar', exact: true }).click();
	await withClock(page, () => viewHistory(page, []));
	await goA(page, 'Pendientes');
	await openMenu(page);
	await expect(historialItem(page)).toBeEnabled();
	await historialItem(page).click();
	await historyIsShown(page);
	await withClock(page, () => viewHistory(page, []));
});

/** Flow 4 steps 1 and 2: the end of Pendientes and of the Historial, at the given screen size. */
async function scrollAndBottomEdge(page: Page, size: { width: number; height: number }) {
	await sessionWithClock(page, TODAY);
	await page.setViewportSize(size);
	const names = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);
	for (const n of names) await create(page, { title: n, kind: 'Intervalo', every: '2', unit: 'días' });
	const check = (n: string) => page.getByRole('checkbox', { name: new RegExp(`\\b${n}(?!\\d)`) });

	// Step 1 (with a short screen, so that the 12 rows and entries have to scroll).
	await page.setViewportSize({ width: size.width, height: 400 });
	await lastIsClear(page, row(page, 'T12'), [plus(page)]);
	await atBottomEdge(page, plus(page));

	// Step 2.
	for (const n of names) {
		await check(n).click();
		await expect(notice(page)).toHaveText(new RegExp(`Completaste «${n}»`));
		await page.clock.runFor(5100);
		await expect(notice(page)).toHaveCount(0);
	}
	await goA(page, 'Historial');
	const entries = page.getByRole('listitem');
	await expect(entries).toHaveCount(12);
	await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
	await page.clock.runFor(100);
	const header = (await volver(page).boundingBox())!;
	expect(header.y + header.height, 'the header scrolls away with the content').toBeLessThanOrEqual(0);
	await lastIsClear(page, entries.last(), []);
}

test('Flow 4: scroll and bottom edge (phone)', async ({ page }) => {
	test.setTimeout(240_000);
	await scrollAndBottomEdge(page, PHONE);

	// Step 3.
	await goA(page, 'Pendientes');
	await create(page, { title: 'T13', kind: 'Intervalo', every: '2', unit: 'días' });
	await complete(page, 'T13');
	await expect(notice(page)).toHaveText(/Completaste «T13»/);
	await goA(page, 'Historial');
	await expect(notice(page)).toHaveCount(1);
	await expect(page.getByRole('listitem')).toHaveCount(13);
	await lastIsClear(page, page.getByRole('listitem').last(), [notice(page), plus(page)]);
	await page.clock.runFor(5100);
	await expect(notice(page)).toHaveCount(0);

	// Step 4.
	await goA(page, 'Pendientes');
	await turnOnCompleted(page);
	await goA(page, 'Historial');
	await page.context().setOffline(true);
	const strip = page.getByRole('status').filter({ hasText: 'Sin conexión' });
	await expect(strip).toBeVisible();
	await lastIsClear(page, page.getByRole('listitem').last(), [strip]);
	await goA(page, 'Pendientes');
	await expect(strip).toBeVisible();
	await lastIsClear(page, page.getByRole('listitem').last(), [strip, plus(page)]);
	const [s, p] = [(await strip.boundingBox())!, (await plus(page).boundingBox())!];
	expect(s.y + s.height <= p.y || p.y + p.height <= s.y, 'the strip and + overlap').toBe(true);
	await page.context().setOffline(false);
});

test('Flow 4: scroll and bottom edge (wide screen)', async ({ page }) => {
	test.setTimeout(240_000);
	await scrollAndBottomEdge(page, WIDE);
});

for (const [flow, removed] of [
	['Flow 2', '/anotaciones'],
	['Flow 3', '/etiquetas'],
] as const) {
	test(`${flow}: ${removed} opens Pendientes`, async ({ page }) => {
		await sessionWithClock(page, TODAY);
		await page.setViewportSize(PHONE);

		// Step 1.
		await page.goto('/history');
		await expect(page.getByRole('heading', { name: 'Historial', level: 1 })).toBeVisible();
		await page.goto(removed);
		await pendingWithoutNotice(page);

		// Step 2: Atrás does not go back to the removed route.
		await page.goBack();
		await expect(page.getByRole('heading', { name: 'Historial', level: 1 })).toBeVisible();
		expect(path(page)).toBe('/history');
		await noBar(page);

		// Step 3: as the first address of a new tab of the same context.
		const other = await page.context().newPage();
		await other.goto(removed);
		await pendingWithoutNotice(other);
		await other.close();
	});
}

for (const [name, size] of [
	['phone', PHONE],
	['wide screen', WIDE],
] as const) {
	test(`Flow 4: nothing of annotations is left (${name})`, async ({ browser, page }) => {
		// Step 1: without a session, and while the loading screen is shown.
		const entry = await browser.newContext({ baseURL: 'http://127.0.0.1:4173', locale: 'es-AR', viewport: size });
		const visitor = await entry.newPage();
		const auth = await retain(visitor, AUTH);
		await visitor.goto('/', { waitUntil: 'commit' });
		await expect(screenName(visitor)).toBeVisible();
		await nothingOfAnnotations(visitor);
		auth.release();
		await expect(visitor.getByRole('button', { name: 'Entrar con Google' })).toBeVisible();
		await nothingOfAnnotations(visitor);
		await entry.close();

		// Step 2: with a session, in Pendientes and in Historial.
		await sessionWithClock(page, TODAY);
		await page.setViewportSize(size);
		await page.goto('/');
		await nothingOfAnnotations(page);
		await goA(page, 'Historial');
		await nothingOfAnnotations(page);
		await goA(page, 'Pendientes');

		// Step 3: in the panel of a task and in the creation panel.
		await create(page, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
		await openTask(page, 'Regar');
		await nothingOfAnnotations(page);
		await page.getByRole('button', { name: 'Cerrar' }).click();
		await expect(page.getByRole('dialog')).toHaveCount(0);
		await page.getByRole('button', { name: '+' }).click();
		await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
		await nothingOfAnnotations(page);
		await page.getByRole('button', { name: 'Cerrar' }).click();
		await expect(page.getByRole('dialog')).toHaveCount(0);

		// Step 4: the undo notice has no annotation text.
		await complete(page, 'Regar');
		const notice = page.getByRole('status').filter({ hasText: 'Completaste «Regar»' });
		await expect(notice).toBeVisible();
		await expect(notice.getByRole('button', { name: 'Deshacer' })).toBeVisible();
		await nothingOfAnnotations(page);

		// Step 5: Atrás closes the picker first and then the panel.
		await turnOnCompleted(page);
		await openTask(page, 'Regar');
		await openSelector(page);
		await page.goBack();
		await expect(selectorEmoji(page)).toHaveCount(0);
		await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
		await nothingOfAnnotations(page);
		await page.goBack();
		await expect(page.getByRole('dialog')).toHaveCount(0);

		// Step 6: after a simulated week nothing about annotations appears.
		for (const day of ['16', '17', '18', '19', '20', '21', '22']) {
			await advance(page, `2026-07-${day}T08:00:00`);
			await nothingOfAnnotations(page);
			await goA(page, 'Historial');
			await nothingOfAnnotations(page);
			await goA(page, 'Pendientes');
		}
		await expect(row(page, 'Regar')).toBeVisible();
		await expect(page.getByRole('status').filter({ hasNotText: /Completaste|Sin conexión/ })).toHaveCount(0);
		await nothingOfAnnotations(page);
	});
}
