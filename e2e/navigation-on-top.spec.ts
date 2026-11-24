import { expect, test, type Locator, type Page } from '@playwright/test';
import { complete, create, row, goA, cleanEmulators, sessionWithClock } from './support';

const TODAY = '2026-07-15T08:00:00';
const TITLES = ['Regar', 'Barrer', 'Lavar'];

test.beforeEach(async () => {
	await cleanEmulators();
});

const plus = (page: Page) => page.getByRole('button', { name: '+' });
const notice = (page: Page) => page.getByRole('status').filter({ hasText: /^Completaste/ });

/** Short screen, so that three rows do not fit and the list has to scroll (qa/navigation.md, Flow 4). */
async function shortScreen(page: Page) {
	await page.setViewportSize({ width: 390, height: 300 });
}

/** Scrolled to the end, `last` is wholly above whatever sits at the bottom edge and nothing is drawn over it. */
async function lastIsNotCovered(page: Page, last: Locator, atTheEdge: Locator[]) {
	await page.waitForTimeout(300);
	await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
	await page.clock.runFor(100);
	const box = (await last.boundingBox())!;
	expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
	for (const element of atTheEdge) {
		await expect(element).toBeVisible();
		const b = (await element.boundingBox())!;
		expect(box.y + box.height, `the last row or entry (bottom ${box.y + box.height}) is behind the element at the bottom edge (${JSON.stringify(b)})`).toBeLessThanOrEqual(b.y + 0.5);
	}
	const covered = await last.evaluate((e) => {
		const r = e.getBoundingClientRect();
		const top = document.elementFromPoint(r.left + 20, r.top + r.height / 2);
		return !top || !e.contains(top);
	});
	expect(covered).toBe(false);
}

async function createAndComplete(page: Page) {
	for (const title of TITLES) await create(page, { title, kind: 'Intervalo', every: '2', unit: 'días' });
	for (const title of TITLES) await complete(page, title);
}

test('the last pending row is not covered by the + button', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	for (const title of TITLES) await create(page, { title, kind: 'Intervalo', every: '2', unit: 'días' });
	await shortScreen(page);
	await lastIsNotCovered(page, row(page, TITLES[2]), [plus(page)]);
});

test('the last history entry is not covered by the bottom edge', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	await createAndComplete(page);
	await page.clock.runFor(5100);
	await expect(notice(page)).toHaveCount(0);
	await goA(page, 'Historial');
	await expect(page.getByRole('listitem')).toHaveCount(3);
	await shortScreen(page);
	await lastIsNotCovered(page, page.getByRole('listitem').last(), []);
});

test('the last history entry is not covered by the undo notice', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	await createAndComplete(page);
	await goA(page, 'Historial');
	await expect(page.getByRole('listitem')).toHaveCount(3);
	await shortScreen(page);
	await lastIsNotCovered(page, page.getByRole('listitem').last(), [notice(page)]);
});

test('the task panel covers the + button', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	await plus(page).click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();

	expect(
		await plus(page).evaluate((e) => {
			const r = e.getBoundingClientRect();
			const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
			return top === e || e.contains(top);
		}),
	).toBe(false);
});

test('the history delete confirmation covers Volver', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	await create(page, { title: 'Regar', kind: 'No se repite', date: '2026-07-15' });
	await complete(page, 'Regar');
	await goA(page, 'Historial');
	await page.getByRole('listitem').filter({ hasText: 'Regar' }).getByRole('button', { name: 'Borrar' }).click();
	await expect(page.getByRole('alertdialog')).toBeVisible();

	const back = page.getByRole('button', { name: 'Volver', exact: true });
	expect(
		await back.evaluate((e) => {
			const r = e.getBoundingClientRect();
			const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
			return top === e || e.contains(top);
		}),
	).toBe(false);
});
