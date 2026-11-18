import { expect, test, type Locator, type Page } from '@playwright/test';
import { complete, create, row, goA, cleanEmulators, sessionWithClock } from './support';

const TODAY = '2026-07-15T08:00:00';
const WATER = { title: 'Regar', kind: 'No se repite', date: '2026-07-15' } as const;

test.beforeEach(async () => {
	await cleanEmulators();
});

/** For each tab, whether the topmost element at its center belongs to the navigation bar. */
async function tabsOnFront(page: Page): Promise<boolean[]> {
	return page.getByRole('navigation').getByRole('link').evaluateAll((links) =>
		links.map((link) => {
			const r = link.getBoundingClientRect();
			const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
			return top?.closest('nav') === link.closest('nav');
		})
	);
}

/** Shrinks the screen so `fila` ends behind the fixed navigation bar. */
async function leaveBehindOfNavigation(page: Page, row: Locator): Promise<void> {
	const box = await row.boundingBox();
	if (!box) throw new Error('the row is not on screen');
	const width = page.viewportSize()?.width ?? 390;
	await page.setViewportSize({ width, height: Math.round(box.y + box.height + 8) });
	await page.evaluate(() => window.scrollTo(0, 0));
}

/** Every tab is on top (`true`) or every tab is covered (`false`). */
async function tabs(page: Page, onFront: boolean): Promise<void> {
	const status = await tabsOnFront(page);
	expect(status.length).toBeGreaterThan(0);
	expect(status).toEqual(status.map(() => onFront));
}

test('the history entries do not cover the navigation tabs', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	await create(page, WATER);
	await complete(page, 'Regar');
	await goA(page, 'Historial');
	const entry = page.getByRole('listitem').filter({ hasText: 'Regar' });
	await expect(entry).toBeVisible();

	await leaveBehindOfNavigation(page, entry);
	await tabs(page, true);
});

test('the pending rows do not cover the navigation tabs', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	await create(page, WATER);
	await expect(row(page, 'Regar')).toBeVisible();

	await leaveBehindOfNavigation(page, row(page, 'Regar'));
	await tabs(page, true);
});

test('the task panel covers the navigation tabs', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	await page.getByRole('button', { name: '+' }).click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();

	await tabs(page, false);
});

test('the history delete confirmation covers the navigation tabs', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	await create(page, WATER);
	await complete(page, 'Regar');
	await goA(page, 'Historial');
	await page.getByRole('listitem').filter({ hasText: 'Regar' }).getByRole('button', { name: 'Borrar' }).click();
	await expect(page.getByRole('alertdialog')).toBeVisible();

	await tabs(page, false);
});
