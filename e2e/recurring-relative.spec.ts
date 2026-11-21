import { expect, test } from '@playwright/test';
import { advance, createTask, discard, turnOnCompleted, enter, waitStatus, row, cleanEmulators, goBack, sessionWithClock } from './support';

const START = '2026-07-15T08:00:00';

test.beforeEach(async () => {
	await cleanEmulators();
});

test('Flow 1: entrar con Google', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'Entrar con Google' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Pendientes' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: '+' })).toHaveCount(0);
	await enter(page);
	await expect(page.getByRole('button', { name: '+' })).toBeVisible();
	await expect(page.getByRole('listitem')).toHaveCount(0);
	await page.reload();
	await expect(page.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Entrar con Google' })).toHaveCount(0);
});

test('Flow 2: validación al crear', async ({ page }) => {
	await sessionWithClock(page, START);
	const panel = page.getByRole('dialog');
	const save = page.getByRole('button', { name: 'Guardar' });
	await page.getByRole('button', { name: '+' }).click();
	await expect(panel).toBeVisible();
	await expect(page.getByLabel('Título')).toBeVisible();
	await expect(page.getByRole('radio', { name: 'No se repite' })).toBeChecked();
	await page.getByRole('radio', { name: 'Intervalo' }).check();
	await expect(page.getByRole('spinbutton', { name: 'Cada' })).toBeVisible();
	await expect(page.getByLabel('Unidad')).toBeVisible();
	await expect(page.getByRole('radio', { name: 'Intervalo' })).toBeChecked();

	await page.getByRole('spinbutton', { name: 'Cada' }).fill('2');
	await page.getByLabel('Unidad').selectOption({ label: 'días' });
	await save.click();
	await expect(page.getByLabel('Título')).toHaveAccessibleDescription(/título/i);
	await expect(panel).toBeVisible();
	await expect(page.getByRole('listitem')).toHaveCount(0);

	await page.getByLabel('Título').fill('   ');
	await save.click();
	await expect(page.getByLabel('Título')).toHaveAccessibleDescription(/título/i);
	await expect(panel).toBeVisible();
	await expect(page.getByRole('listitem')).toHaveCount(0);

	await page.getByLabel('Título').fill('Regar plantas');
	await page.getByRole('spinbutton', { name: 'Cada' }).fill('0');
	await save.click();
	await expect(page.getByRole('spinbutton', { name: 'Cada' })).toHaveAccessibleDescription(/Cada/);
	await expect(page.getByRole('listitem')).toHaveCount(0);

	await page.getByRole('spinbutton', { name: 'Cada' }).fill('1.5');
	await save.click();
	await expect(page.getByRole('spinbutton', { name: 'Cada' })).toHaveAccessibleDescription(/Cada/);
	await expect(panel).toBeVisible();
	await expect(page.getByRole('listitem')).toHaveCount(0);

	await discard(page);
	await expect(panel).toHaveCount(0);
	await expect(page.getByRole('listitem')).toHaveCount(0);
});

test('Flow 3 pasos 1-2: una tarea nunca completada no se atrasa', async ({ page }) => {
	const T = 'Regar plantas';
	await sessionWithClock(page, START);
	await createTask(page, T, '2', 'días');
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await waitStatus(page, T, 'pendiente');
	await advance(page, '2026-07-18T08:00:00');
	await waitStatus(page, T, 'pendiente');
});

test('Flow 3 pasos 3-13: ciclo de estados de Regar plantas cada 2 días (contexto limpio)', async ({ page }) => {
	const T = 'Regar plantas';
	await sessionWithClock(page, START);
	await turnOnCompleted(page);
	await createTask(page, T, '2', 'días');
	await waitStatus(page, T, 'pendiente');

	await row(page, T).getByRole('checkbox').click();
	await waitStatus(page, T, 'en espera', 0);
	await advance(page, '2026-07-16T08:00:00');
	await waitStatus(page, T, 'en espera', 50);
	await advance(page, '2026-07-17T07:00:00');
	await waitStatus(page, T, 'en espera', 98);
	await advance(page, '2026-07-17T08:00:00');
	await waitStatus(page, T, 'pendiente');
	await advance(page, '2026-07-19T07:00:00');
	await waitStatus(page, T, 'pendiente');
	await advance(page, '2026-07-19T08:00:00');
	await waitStatus(page, T, 'atrasada');

	// Step 10: reloading keeps the state (the installed clock persists in the page on reload).
	await page.reload();
	await waitStatus(page, T, 'atrasada');

	await row(page, T).getByRole('checkbox').click();
	await waitStatus(page, T, 'en espera', 0);
	await advance(page, '2026-07-20T08:00:00');
	await waitStatus(page, T, 'en espera', 50);
	await advance(page, '2026-07-21T08:00:00');
	await waitStatus(page, T, 'pendiente');
});

test('Flow 4: el checkbox en espera borra el completado de hoy; completar de nuevo reinicia el intervalo (horas)', async ({ page }) => {
	const T = 'Ventilar';
	await sessionWithClock(page, START);
	await turnOnCompleted(page);
	await createTask(page, T, '4', 'horas');
	await waitStatus(page, T, 'pendiente');
	await row(page, T).getByRole('checkbox').click();
	await waitStatus(page, T, 'en espera', 0);
	await advance(page, '2026-07-15T09:00:00');
	await waitStatus(page, T, 'en espera', 25);
	await row(page, T).getByRole('checkbox').click();
	await waitStatus(page, T, 'pendiente');
	await row(page, T).getByRole('checkbox').click();
	await waitStatus(page, T, 'en espera', 0);
	await advance(page, '2026-07-15T12:00:00');
	await waitStatus(page, T, 'en espera', 75);
	await advance(page, '2026-07-15T13:00:00');
	await waitStatus(page, T, 'pendiente');
	await advance(page, '2026-07-15T17:00:00');
	await waitStatus(page, T, 'atrasada');
});

test('Flow 5: persistencia entre sesiones', async ({ browser }) => {
	const T = 'Regar plantas';
	const context = await browser.newContext();
	const page = await context.newPage();
	await sessionWithClock(page, START);
	await turnOnCompleted(page);
	await createTask(page, T, '2', 'días');
	await row(page, T).getByRole('checkbox').click();
	await waitStatus(page, T, 'en espera', 0);
	await advance(page, '2026-07-16T08:00:00');
	await waitStatus(page, T, 'en espera', 50);

	// Close the tab and open the app again with the same clock, in the same profile.
	await page.close();
	const fresh = await context.newPage();
	await fresh.clock.install({ time: new Date('2026-07-16T08:00:00') });
	await fresh.goto('/');
	await expect(fresh.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
	await expect(fresh.getByRole('button', { name: 'Entrar con Google' })).toHaveCount(0);
	await waitStatus(fresh, T, 'en espera', 50);
	await context.close();
});

test('Flow 6: relojes desfasados (completado del futuro)', async ({ page }) => {
	await sessionWithClock(page, START);
	await turnOnCompleted(page);
	await createTask(page, 'Ventilar', '4', 'horas');
	await row(page, 'Ventilar').getByRole('checkbox').click();
	await waitStatus(page, 'Ventilar', 'en espera', 0);
	await goBack(page, '2026-07-15T07:00:00');
	await waitStatus(page, 'Ventilar', 'en espera', 0);
	await page.reload();
	await waitStatus(page, 'Ventilar', 'en espera', 0);
	await advance(page, '2026-07-15T08:00:00');
	await waitStatus(page, 'Ventilar', 'en espera', 0);
	await advance(page, '2026-07-15T09:00:00');
	await waitStatus(page, 'Ventilar', 'en espera', 25);
	await advance(page, '2026-07-15T12:00:00');
	await waitStatus(page, 'Ventilar', 'pendiente');
});

test('Flow 7: completar en espera, con el último completado de ayer, reinicia el intervalo', async ({ page }) => {
	const T = 'Regar plantas';
	await sessionWithClock(page, '2026-07-15T20:00:00');
	await turnOnCompleted(page);
	await createTask(page, T, '2', 'días');
	await row(page, T).getByRole('checkbox').click();
	await expect(page.getByRole('status')).toContainText('Completaste «Regar plantas»');
	await waitStatus(page, T, 'en espera', 0);
	await advance(page, '2026-07-16T00:00:00');
	await waitStatus(page, T, 'en espera', 8);
	await row(page, T).getByRole('checkbox').click();
	await expect(page.getByRole('status')).toContainText('Completaste «Regar plantas»');
	await waitStatus(page, T, 'en espera', 0);
	await page.getByRole('navigation').getByRole('link', { name: 'Historial' }).click();
	await expect(page.getByRole('heading', { name: 'Historial', level: 1 })).toBeVisible();
	await expect(page.getByRole('listitem').filter({ hasText: 'Regar plantas' })).toHaveCount(2);
	await expect(page.getByRole('heading', { name: 'Hoy' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Ayer' })).toBeVisible();
	await page.getByRole('navigation').getByRole('link', { name: 'Pendientes' }).click();
	await expect(page.getByRole('heading', { name: 'Pendientes', level: 1 })).toBeVisible();
	await advance(page, '2026-07-17T20:00:00');
	await waitStatus(page, T, 'en espera', 92);
	await advance(page, '2026-07-18T00:00:00');
	await waitStatus(page, T, 'pendiente');
});
