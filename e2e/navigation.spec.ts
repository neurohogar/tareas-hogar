import { expect, test, type Page } from '@playwright/test';
import {
	advance,
	cleanEmulators,
	complete,
	create,
	goA,
	openSelector,
	openTask,
	row,
	selectorEmoji,
	turnOnCompleted,
	sessionWithClock,
} from './support';
import { AUTH, retain, screenName } from './screen-support';

const TODAY = '2026-07-15T08:00:00';
const PHONE = { width: 390, height: 844 };
const WIDE = { width: 1280, height: 800 };

test.beforeEach(async () => {
	await cleanEmulators();
});

const bar = (page: Page) => page.getByRole('navigation');
const tab = (page: Page, name: 'Pendientes' | 'Historial') => bar(page).getByRole('link', { name, exact: true });
const path = (page: Page) => new URL(page.url()).pathname;

/** Only the two tabs, in order, and `current` is the one that has `aria-current="page"`. */
async function barIs(page: Page, current: 'Pendientes' | 'Historial') {
	await expect(bar(page).getByRole('link')).toHaveText(['Pendientes', 'Historial']);
	const other = current === 'Pendientes' ? 'Historial' : 'Pendientes';
	await expect(tab(page, current)).toHaveAttribute('aria-current', 'page');
	await expect(tab(page, other)).not.toHaveAttribute('aria-current', 'page');
	await expect(bar(page).getByRole('link', { name: 'Anotaciones' })).toHaveCount(0);
	await expect(bar(page).getByRole('button')).toHaveCount(0);
}

/** Pendientes is shown, at `/`, with no notice or message of a missing page. */
async function pendingWithoutNotice(page: Page) {
	await expect(page.getByRole('heading', { name: 'Pendientes', level: 1 })).toBeVisible();
	await expect.poll(() => path(page)).toBe('/');
	await expect(tab(page, 'Pendientes')).toHaveAttribute('aria-current', 'page');
	await expect(page.getByRole('status')).toHaveCount(0);
	await expect(page.getByRole('alert')).toHaveCount(0);
	await expect(page.getByText(/no existe|no encontrad|404|not found/i)).toHaveCount(0);
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

test('Flow 1: two tabs', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	for (const size of [PHONE, WIDE]) {
		await page.setViewportSize(size);
		await page.goto('/');
		await barIs(page, 'Pendientes');
		await goA(page, 'Historial');
		expect(path(page)).toBe('/historial');
		await barIs(page, 'Historial');
		await goA(page, 'Pendientes');
		expect(path(page)).toBe('/');
		await barIs(page, 'Pendientes');
	}

	await create(page, { title: 'Regar', kind: 'No se repite' });
	await complete(page, 'Regar');
	for (const screen of ['Historial', 'Pendientes', 'Historial', 'Pendientes'] as const) {
		await goA(page, screen);
		await barIs(page, screen);
	}
});

for (const [flow, removed] of [
	['Flow 2', '/anotaciones'],
	['Flow 3', '/etiquetas'],
] as const) {
	test(`${flow}: ${removed} opens Pendientes`, async ({ page }) => {
		await sessionWithClock(page, TODAY);
		await page.setViewportSize(PHONE);

		// Step 1.
		await page.goto('/historial');
		await expect(page.getByRole('heading', { name: 'Historial', level: 1 })).toBeVisible();
		await page.goto(removed);
		await pendingWithoutNotice(page);

		// Step 2: Atrás does not go back to the removed route.
		await page.goBack();
		await expect(page.getByRole('heading', { name: 'Historial', level: 1 })).toBeVisible();
		expect(path(page)).toBe('/historial');
		await expect(tab(page, 'Historial')).toHaveAttribute('aria-current', 'page');

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
		await create(page, { title: 'Regar', kind: 'No se repite' });
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
