import { expect, test, type Page } from '@playwright/test';
import { advance, discard, turnOnCompleted, waitStatus, row, cleanEmulators, goBack, sessionWithClock } from './support';

const MONDAY = '2026-07-13T08:00:00';
const WEEK = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const JUNK = 'Sacar la basura';

test.beforeEach(async () => {
	await cleanEmulators();
});

async function openPanel(page: Page, title: string) {
	await page.getByRole('button', { name: '+' }).click();
	await page.getByLabel('Título').fill(title);
}

async function chooseDays(page: Page, mode: 'Días de la semana' | 'Días del mes', days: string[]) {
	await page.getByRole('radio', { name: mode }).check();
	for (const day of days) await page.getByRole('button', { name: day, exact: true }).click();
}

async function createCalendar(page: Page, title: string, mode: 'Días de la semana' | 'Días del mes', days: string[]) {
	await openPanel(page, title);
	await chooseDays(page, mode, days);
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
}

const createJunk = (page: Page) => createCalendar(page, JUNK, 'Días de la semana', ['martes', 'jueves']);
/** Session with a clock and Mostrar completadas on: a calendar task that is waiting with completions only has a row this way. */
async function session(page: Page, hour: string) {
	await sessionWithClock(page, hour);
	await turnOnCompleted(page);
}
const complete = (page: Page, title: string) => row(page, title).getByRole('checkbox').click();

test('Contrato del panel', async ({ page }) => {
	await sessionWithClock(page, MONDAY);
	await page.getByRole('button', { name: '+' }).click();
	const group = page.getByRole('group', { name: 'Se repite' });
	await expect(group.getByRole('radio')).toHaveCount(4);
	await expect(group.getByRole('radio', { name: 'No se repite' })).toBeVisible();
	await expect(group.getByRole('radio', { name: 'No se repite' })).toBeChecked();
	await group.getByRole('radio', { name: 'Intervalo' }).check();
	await expect(page.getByRole('spinbutton', { name: 'Cada' })).toBeVisible();
	await expect(page.getByLabel('Unidad')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Cerrar' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Guardar' })).toBeVisible();

	await page.getByRole('radio', { name: 'Días de la semana' }).check();
	await expect(page.getByRole('spinbutton', { name: 'Cada' })).toHaveCount(0);
	const days = page.getByRole('group', { name: 'Días de la semana' }).getByRole('button');
	await expect(days).toHaveText(WEEK);
	await page.getByRole('button', { name: 'martes' }).click();
	await page.getByRole('button', { name: 'jueves' }).click();
	await expect(page.getByRole('button', { name: 'martes' })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByRole('button', { name: 'jueves' })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByRole('button', { name: 'lunes' })).toHaveAttribute('aria-pressed', 'false');

	await page.getByRole('radio', { name: 'Días del mes' }).check();
	await expect(page.getByRole('button', { name: 'martes' })).toHaveCount(0);
	const month = page.getByRole('group', { name: 'Días del mes' }).getByRole('button');
	await expect(month).toHaveText(Array.from({ length: 31 }, (_, i) => String(i + 1)));
	await page.getByRole('button', { name: '10', exact: true }).click();
	await page.getByRole('button', { name: '20', exact: true }).click();
	await expect(page.getByRole('button', { name: '10', exact: true })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByRole('button', { name: '20', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('Flow 1: crear una semanal y una mensual', async ({ page }) => {
	await session(page, MONDAY);
	await openPanel(page, JUNK);
	await page.getByRole('radio', { name: 'Días de la semana' }).check();
	await page.getByRole('button', { name: 'martes' }).click();
	await page.getByRole('button', { name: 'jueves' }).click();
	await expect(page.getByRole('button', { name: 'martes' })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByRole('button', { name: 'jueves' })).toHaveAttribute('aria-pressed', 'true');
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await waitStatus(page, JUNK, 'en espera', 0, false);

	await createCalendar(page, 'Pagar expensas', 'Días del mes', ['10']);
	await waitStatus(page, 'Pagar expensas', 'en espera', 0, false);

	await createCalendar(page, 'Regar plantas', 'Días de la semana', ['lunes']);
	await waitStatus(page, 'Regar plantas', 'pendiente');

	await page.reload();
	await waitStatus(page, JUNK, 'en espera', 0, false);
	await waitStatus(page, 'Pagar expensas', 'en espera', 0, false);
	await waitStatus(page, 'Regar plantas', 'pendiente');
});

test('Flow 2: validación del panel', async ({ page }) => {
	await session(page, MONDAY);
	const panel = page.getByRole('dialog');
	const save = page.getByRole('button', { name: 'Guardar' });
	const title = page.getByLabel('Título');
	const groupWeek = page.getByRole('group', { name: 'Días de la semana' });
	const withoutRows = async () => {
		await expect(panel).toBeVisible();
		await expect(page.getByRole('listitem')).toHaveCount(0);
	};

	await page.getByRole('button', { name: '+' }).click();
	await chooseDays(page, 'Días de la semana', ['martes']);
	await save.click();
	await expect(title).toHaveAccessibleDescription(/título/i);
	await withoutRows();

	await title.fill('   ');
	await save.click();
	await expect(title).toHaveAccessibleDescription(/título/i);
	await withoutRows();

	await title.fill(JUNK);
	await page.getByRole('button', { name: 'martes' }).click();
	await expect(page.getByRole('button', { name: 'martes' })).toHaveAttribute('aria-pressed', 'false');
	await save.click();
	await expect(groupWeek).toHaveAccessibleDescription(/al menos un día/i);
	await withoutRows();

	await page.getByRole('radio', { name: 'Días del mes' }).check();
	await save.click();
	await expect(page.getByRole('group', { name: 'Días del mes' })).toHaveAccessibleDescription(/al menos un día/i);
	await withoutRows();

	await expect(page.getByRole('group', { name: 'Días del mes' }).getByRole('button')).toHaveCount(31);

	await discard(page);
	await expect(panel).toHaveCount(0);
	await expect(page.getByRole('listitem')).toHaveCount(0);

	await openPanel(page, 'Combinada');
	await chooseDays(page, 'Días de la semana', ['martes']);
	await chooseDays(page, 'Días del mes', ['15']);
	await save.click();
	await expect(panel).toHaveCount(0);
	await expect(page.getByRole('listitem')).toHaveCount(1);
	await waitStatus(page, 'Combinada', 'en espera', 0, false);

	await advance(page, '2026-07-14T00:00:00');
	await waitStatus(page, 'Combinada', 'en espera', 40, false);
	await advance(page, '2026-07-15T00:00:00');
	await waitStatus(page, 'Combinada', 'pendiente');
});

test('Flow 3: ciclo de estados de una semanal', async ({ page }) => {
	await session(page, MONDAY);
	await createJunk(page);
	await waitStatus(page, JUNK, 'en espera', 0, false);
	await advance(page, '2026-07-13T16:00:00');
	await waitStatus(page, JUNK, 'en espera', 50, false);
	await advance(page, '2026-07-13T23:00:00');
	await waitStatus(page, JUNK, 'en espera', 94, false);
	await advance(page, '2026-07-14T00:00:00');
	await waitStatus(page, JUNK, 'pendiente');
	await advance(page, '2026-07-14T23:59:59');
	await waitStatus(page, JUNK, 'pendiente');
	await advance(page, '2026-07-15T00:00:00');
	await waitStatus(page, JUNK, 'atrasada');
	await page.reload();
	await waitStatus(page, JUNK, 'atrasada');
	await advance(page, '2026-07-15T08:00:00');
	await complete(page, JUNK);
	await waitStatus(page, JUNK, 'en espera', 0);
	await advance(page, '2026-07-15T16:00:00');
	await waitStatus(page, JUNK, 'en espera', 50);
	await advance(page, '2026-07-16T00:00:00');
	await waitStatus(page, JUNK, 'pendiente');
	await advance(page, '2026-07-16T12:00:00');
	await complete(page, JUNK);
	await waitStatus(page, JUNK, 'en espera', 0);
	await advance(page, '2026-07-18T18:00:00');
	await waitStatus(page, JUNK, 'en espera', 50);
	await advance(page, '2026-07-21T00:00:00');
	await waitStatus(page, JUNK, 'pendiente');
});

test('Flow 4: completar antes de tiempo y ocurrencias perdidas', async ({ page }) => {
	await session(page, MONDAY);
	await createJunk(page);
	await waitStatus(page, JUNK, 'en espera', 0, false);
	await complete(page, JUNK);
	await waitStatus(page, JUNK, 'en espera', 0);
	await advance(page, '2026-07-14T00:00:00');
	await waitStatus(page, JUNK, 'en espera', 25);
	await advance(page, '2026-07-14T16:00:00');
	await waitStatus(page, JUNK, 'en espera', 50);
	await advance(page, '2026-07-16T00:00:00');
	await waitStatus(page, JUNK, 'pendiente');
	await advance(page, '2026-07-17T10:00:00');
	await waitStatus(page, JUNK, 'atrasada');
	await expect(page.getByRole('listitem')).toHaveCount(1);
	await expect(page.getByText(/^Tocaba /)).toHaveCount(1);
	await complete(page, JUNK);
	await waitStatus(page, JUNK, 'en espera', 0);
	await advance(page, '2026-07-19T05:00:00');
	await waitStatus(page, JUNK, 'en espera', 50);
	await advance(page, '2026-07-21T00:00:00');
	await waitStatus(page, JUNK, 'pendiente');
});

test('Flow 5: mensual con día 31 en un mes de 30 días', async ({ page }) => {
	const T = 'Revisar filtro';
	await session(page, '2026-06-20T00:00:00');
	await createCalendar(page, T, 'Días del mes', ['31']);
	await waitStatus(page, T, 'en espera', 0, false);
	await advance(page, '2026-06-25T00:00:00');
	await waitStatus(page, T, 'en espera', 50, false);
	await advance(page, '2026-06-30T00:00:00');
	await waitStatus(page, T, 'pendiente');
	await advance(page, '2026-07-01T00:00:00');
	await waitStatus(page, T, 'atrasada');
	await advance(page, '2026-07-01T08:00:00');
	await complete(page, T);
	await waitStatus(page, T, 'en espera', 0);
	await advance(page, '2026-07-15T04:00:00');
	await waitStatus(page, T, 'en espera', 47);
	await advance(page, '2026-07-31T00:00:00');
	await waitStatus(page, T, 'pendiente');
});

test('Flow 6: el checkbox en espera borra el completado de hoy', async ({ page }) => {
	await session(page, MONDAY);
	await createJunk(page);
	await waitStatus(page, JUNK, 'en espera', 0, false);
	await complete(page, JUNK);
	await waitStatus(page, JUNK, 'en espera', 0);
	await advance(page, '2026-07-13T12:00:00');
	await complete(page, JUNK);
	await waitStatus(page, JUNK, 'en espera', 25, false);
	await complete(page, JUNK);
	await waitStatus(page, JUNK, 'en espera', 0);
	await advance(page, '2026-07-16T00:00:00');
	await waitStatus(page, JUNK, 'pendiente');
});

test('Flow 7: persistencia entre sesiones', async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await session(page, MONDAY);
	await createJunk(page);
	await complete(page, JUNK);
	await advance(page, '2026-07-14T16:00:00');
	await waitStatus(page, JUNK, 'en espera', 50);

	await page.close();
	const fresh = await context.newPage();
	await fresh.clock.install({ time: new Date('2026-07-14T16:00:00') });
	await fresh.goto('/');
	await expect(fresh.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
	await expect(fresh.getByRole('button', { name: 'Entrar con Google' })).toHaveCount(0);
	await waitStatus(fresh, JUNK, 'en espera', 50);
	await advance(fresh, '2026-07-16T00:00:00');
	await waitStatus(fresh, JUNK, 'pendiente');
	await context.close();
});

test('Flow 8: relojes desfasados (completado del futuro)', async ({ page }) => {
	await session(page, MONDAY);
	await createJunk(page);
	await waitStatus(page, JUNK, 'en espera', 0, false);
	await advance(page, '2026-07-15T20:00:00');
	await waitStatus(page, JUNK, 'atrasada');
	await complete(page, JUNK);
	await waitStatus(page, JUNK, 'en espera', 0);
	await goBack(page, '2026-07-15T10:00:00');
	await waitStatus(page, JUNK, 'en espera', 0);
	await page.reload();
	await waitStatus(page, JUNK, 'en espera', 0);
	await advance(page, '2026-07-15T20:00:00');
	await waitStatus(page, JUNK, 'en espera', 0);
	await advance(page, '2026-07-15T22:00:00');
	await waitStatus(page, JUNK, 'en espera', 50);
	await advance(page, '2026-07-16T00:00:00');
	await waitStatus(page, JUNK, 'pendiente');
});

test('Flow 9: completar dos veces antes de tiempo, en días distintos', async ({ page }) => {
	await session(page, MONDAY);
	await createJunk(page);
	await complete(page, JUNK);
	await waitStatus(page, JUNK, 'en espera', 0);
	await advance(page, '2026-07-14T16:00:00');
	await waitStatus(page, JUNK, 'en espera', 50);
	await complete(page, JUNK);
	await expect(page.getByRole('status')).toContainText('Completaste «Sacar la basura»');
	await waitStatus(page, JUNK, 'en espera', 0);
	await advance(page, '2026-07-16T00:00:00');
	await waitStatus(page, JUNK, 'en espera', 21);
	await advance(page, '2026-07-21T00:00:00');
	await waitStatus(page, JUNK, 'pendiente');
});
