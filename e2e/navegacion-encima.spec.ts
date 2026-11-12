import { expect, test, type Locator, type Page } from '@playwright/test';
import { completar, crear, fila, irA, limpiarEmuladores, sesionConReloj } from './apoyo';

const HOY = '2026-07-15T08:00:00';
const REGAR = { titulo: 'Regar', tipo: 'No se repite', fecha: '2026-07-15' } as const;

test.beforeEach(async () => {
	await limpiarEmuladores();
});

/** For each tab, whether the topmost element at its center belongs to the navigation bar. */
async function pestanasAlFrente(page: Page): Promise<boolean[]> {
	return page.getByRole('navigation').getByRole('link').evaluateAll((links) =>
		links.map((link) => {
			const r = link.getBoundingClientRect();
			const arriba = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
			return arriba?.closest('nav') === link.closest('nav');
		})
	);
}

/** Shrinks the screen so `fila` ends behind the fixed navigation bar. */
async function dejarDetrasDeLaNavegacion(page: Page, fila: Locator): Promise<void> {
	const caja = await fila.boundingBox();
	if (!caja) throw new Error('the row is not on screen');
	const ancho = page.viewportSize()?.width ?? 390;
	await page.setViewportSize({ width: ancho, height: Math.round(caja.y + caja.height + 8) });
	await page.evaluate(() => window.scrollTo(0, 0));
}

/** Every tab is on top (`true`) or every tab is covered (`false`). */
async function pestanas(page: Page, alFrente: boolean): Promise<void> {
	const estado = await pestanasAlFrente(page);
	expect(estado.length).toBeGreaterThan(0);
	expect(estado).toEqual(estado.map(() => alFrente));
}

test('the history entries do not cover the navigation tabs', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await crear(page, REGAR);
	await completar(page, 'Regar');
	await irA(page, 'Historial');
	const entrada = page.getByRole('listitem').filter({ hasText: 'Regar' });
	await expect(entrada).toBeVisible();

	await dejarDetrasDeLaNavegacion(page, entrada);
	await pestanas(page, true);
});

test('the pending rows do not cover the navigation tabs', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await crear(page, REGAR);
	await expect(fila(page, 'Regar')).toBeVisible();

	await dejarDetrasDeLaNavegacion(page, fila(page, 'Regar'));
	await pestanas(page, true);
});

test('the task panel covers the navigation tabs', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await page.getByRole('button', { name: '+' }).click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();

	await pestanas(page, false);
});

test('the history delete confirmation covers the navigation tabs', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await crear(page, REGAR);
	await completar(page, 'Regar');
	await irA(page, 'Historial');
	await page.getByRole('listitem').filter({ hasText: 'Regar' }).getByRole('button', { name: 'Borrar' }).click();
	await expect(page.getByRole('alertdialog')).toBeVisible();

	await pestanas(page, false);
});

test('the label dialogs cover the navigation tabs', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await crear(page, { ...REGAR, etiquetas: ['Patio'] });
	await irA(page, 'Etiquetas');
	await page.getByRole('button', { name: 'Renombrar' }).click();
	await expect(page.getByRole('dialog')).toBeVisible();

	await pestanas(page, false);
});
