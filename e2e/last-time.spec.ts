import { expect, test, type Browser, type Page } from '@playwright/test';
import {
	openTask,
	advance,
	close,
	complete,
	completePanel,
	toggleShowCompleted,
	create,
	device,
	turnOnCompleted,
	row,
	goA,
	cleanEmulators,
	sessionWithClock
} from './support';

test.beforeEach(async () => {
	await cleanEmulators();
});

async function session(page: Page, hour: string) {
	await sessionWithClock(page, hour);
	await turnOnCompleted(page);
}

async function two(browser: Browser, hourA: string, hourB: string) {
	const a = await device(browser, hourA, true);
	const b = await device(browser, hourB, false);
	await turnOnCompleted(a.page);
	await turnOnCompleted(b.page);
	return {
		a: a.page,
		b: b.page,
		end: async () => {
			await a.ctx.close();
			await b.ctx.close();
		}
	};
}

const textLastTime = (page: Page) => page.getByText(/^Última vez/);

/** El panel dice `Última vez: T`, inmediatamente debajo del encabezado Editar tarea. */
async function says(page: Page, t: string) {
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await expect(textLastTime(page)).toHaveCount(1);
	await expect(textLastTime(page)).toHaveText(`Última vez: ${t}`);
}

async function headingBelow(page: Page) {
	const h = (await page.getByRole('heading', { name: 'Editar tarea' }).boundingBox())!;
	const u = (await textLastTime(page).boundingBox())!;
	expect(u.y).toBeGreaterThanOrEqual(h.y + h.height - 1);
	const others = await page
		.getByRole('dialog')
		.locator('label, input, textarea, select')
		.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().y));
	for (const y of others) expect(y).toBeGreaterThanOrEqual(u.y + u.height - 1);
}

const notice = (page: Page) => page.getByRole('status');

async function deleteEntry(page: Page, title: string, hour: string, heading: string) {
	const list = page.locator(`xpath=//h2[normalize-space()="${heading}"]/following-sibling::ul[1]`);
	await list
		.getByRole('listitem')
		.filter({ hasText: new RegExp(`^${title}\\s*${hour}`) })
		.getByRole('button', { name: 'Borrar', exact: true })
		.click();
	const dialog = page.getByRole('alertdialog');
	await expect(dialog).toHaveText(new RegExp(`¿Borrar «${title}» de ${heading}, ${hour}\\?`));
	await dialog.getByRole('button', { name: 'Borrar', exact: true }).click();
	await expect(dialog).toHaveCount(0);
}

test('Flujo 1: crear no la muestra; sin completados, "nunca"', async ({ page }) => {
	await session(page, '2026-07-15T08:00:00');
	await page.getByRole('button', { name: '+' }).click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await expect(textLastTime(page)).toHaveCount(0);
	await completePanel(page, { title: 'Regar', kind: 'Intervalo', every: '1', unit: 'días' });
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await openTask(page, 'Regar');
	await says(page, 'nunca');
	await headingBelow(page);
	await close(page);
	await expect(row(page, 'Regar')).toBeVisible();
	await expect(page.getByText('Última vez')).toHaveCount(0);
});

test('Flujo 2: hoy, ayer y hace N días, con el panel abierto al pasar la medianoche', async ({ page }) => {
	await session(page, '2026-07-13T08:00:00');
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '10', unit: 'días' });
	await advance(page, '2026-07-13T08:05:30');
	await complete(page, 'Regar');
	await expect(notice(page)).toHaveCount(1);
	await openTask(page, 'Regar');
	await says(page, 'hoy 08:05');
	await advance(page, '2026-07-13T23:59:59');
	await says(page, 'hoy 08:05');
	await advance(page, '2026-07-14T00:00:00');
	await says(page, 'ayer 08:05');
	await advance(page, '2026-07-15T00:00:00');
	await says(page, 'hace 2 días');
	await advance(page, '2026-07-23T10:00:00');
	await says(page, 'hace 10 días');
	await close(page);
	await expect(row(page, 'Regar')).not.toContainText('Última vez');
	await page.reload();
	await openTask(page, 'Regar');
	await says(page, 'hace 10 días');
});

test('Flujo 3: borrar completados la recalcula', async ({ page }) => {
	await session(page, '2026-07-14T10:00:00');
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '1', unit: 'horas' });
	await complete(page, 'Regar');
	await advance(page, '2026-07-15T09:00:00');
	await complete(page, 'Regar');
	await expect(notice(page)).toHaveCount(1);
	await notice(page).getByRole('button', { name: 'Deshacer' }).click();
	await expect(notice(page)).toHaveCount(0);
	await openTask(page, 'Regar');
	await says(page, 'ayer 10:00');
	await close(page);

	await advance(page, '2026-07-15T09:30:00');
	await complete(page, 'Regar');
	await expect(notice(page)).toHaveCount(1);
	await advance(page, '2026-07-15T09:30:06');
	await expect(notice(page)).toHaveCount(0);
	await openTask(page, 'Regar');
	await says(page, 'hoy 09:30');
	await close(page);

	await row(page, 'Regar').getByRole('checkbox', { checked: true }).click();
	await expect(row(page, 'Regar').getByRole('checkbox')).not.toBeChecked();
	await openTask(page, 'Regar');
	await says(page, 'ayer 10:00');
	await close(page);

	await goA(page, 'Historial');
	await deleteEntry(page, 'Regar', '10:00', 'Ayer');
	await goA(page, 'Pendientes');
	await openTask(page, 'Regar');
	await says(page, 'nunca');
});

test('Flujo 4: una puntual completada, abierta desde el Historial', async ({ page }) => {
	await session(page, '2026-07-15T08:00:00');
	await create(page, { title: 'Pagar la luz', kind: 'No se repite' });
	await advance(page, '2026-07-15T08:20:00');
	await complete(page, 'Pagar la luz');
	await expect(row(page, 'Pagar la luz').getByRole('checkbox')).toBeChecked();
	await toggleShowCompleted(page, false);
	await expect(row(page, 'Pagar la luz')).toHaveCount(0);

	await goA(page, 'Historial');
	await openTask(page, 'Pagar la luz');
	await says(page, 'hoy 08:20');
	await completePanel(page, { kind: 'Intervalo', every: '4', unit: 'horas' });
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await openTask(page, 'Pagar la luz');
	await says(page, 'hoy 08:20');
});

test('Flujo 5: otro dispositivo completa y borra con el panel abierto', async ({ browser }) => {
	const { a, b, end } = await two(browser, '2026-07-15T08:00:00', '2026-07-15T08:00:00');
	await create(a, { title: 'Regar', kind: 'Intervalo', every: '1', unit: 'horas' });
	await complete(a, 'Regar');
	await expect(row(a, 'Regar').getByRole('checkbox')).toBeChecked();
	await openTask(a, 'Regar');
	await says(a, 'hoy 08:00');

	await advance(a, '2026-07-15T09:15:00');
	await advance(b, '2026-07-15T09:15:00');
	await expect(row(b, 'Regar')).toBeVisible();
	await complete(b, 'Regar');
	await says(a, 'hoy 09:15');

	await goA(b, 'Historial');
	await deleteEntry(b, 'Regar', '09:15', 'Hoy');
	await says(a, 'hoy 08:00');

	await deleteEntry(b, 'Regar', '08:00', 'Hoy');
	await says(a, 'nunca');
	await end();
});

test('Flujo 6: completado "del futuro"', async ({ browser }) => {
	const { a, b, end } = await two(browser, '2026-12-31T20:00:00', '2027-01-01T08:00:00');
	await create(a, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await expect(row(b, 'Regar')).toBeVisible();
	await complete(b, 'Regar');
	await expect(row(b, 'Regar').getByRole('checkbox')).toBeChecked();

	await expect(async () => {
		await openTask(a, 'Regar');
		await says(a, 'viernes 1 de enero de 2027 08:00');
	}).toPass();
	await advance(a, '2027-01-01T07:00:00');
	await says(a, 'hoy 08:00');
	await advance(a, '2027-01-02T10:00:00');
	await says(a, 'ayer 08:00');

	await openTask(b, 'Regar');
	await says(b, 'hoy 08:00');
	await end();
});
