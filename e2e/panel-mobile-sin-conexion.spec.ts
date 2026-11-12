import { expect, test } from '@playwright/test';
import { abrir, crear, dispositivo, fila, limpiarEmuladores } from './apoyo';

// qa/panel-mobile.md Flujo 7 paso 4: los iconos viajan con la app (con service worker).
test.use({ serviceWorkers: 'allow' });

test.beforeEach(async () => {
	await limpiarEmuladores();
});

test('Flujo 7 paso 4: los iconos se ven sin conexión', async ({ browser }) => {
	const { ctx, page } = await dispositivo(browser, '2026-07-15T10:00:00', true);
	await page.setViewportSize({ width: 360, height: 640 });
	await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
	await expect(async () => {
		if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) await page.reload();
		expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
	}).toPass();
	await crear(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await expect(fila(page, 'Regar')).toBeVisible();

	await ctx.setOffline(true);
	await page.reload();
	await expect(fila(page, 'Regar')).toBeVisible();
	await abrir(page, 'Regar');
	for (const n of ['Tarea', 'Cuándo', 'Acciones'])
		await expect(page.getByRole('tab', { name: new RegExp(`^${n}`) }).locator('svg')).toHaveCount(1);
	await page.getByRole('tab', { name: /^Acciones/ }).click();
	for (const a of ['1 hora', '3 horas', 'Hasta mañana', 'Pausar', 'Borrar tarea'])
		await expect(page.getByRole('button', { name: a, exact: true }).locator('svg')).toHaveCount(1);
	await ctx.setOffline(false);
	await ctx.close();
});
