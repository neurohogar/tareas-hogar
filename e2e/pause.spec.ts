import { expect, test, type Page } from '@playwright/test';
import {
	openTask,
	advance,
	dimmed,
	close,
	complete,
	toggleShowCompleted,
	create,
	twoDevices,
	edit,
	turnOnCompleted,
	waitStatus,
	row,
	goA,
	cleanEmulators,
	listIs,
	arrivesOnServer,
	sessionWithClock, toggleShowPaused, expectShowPaused, expectShowCompleted, completePanel
} from './support';

test.beforeEach(async () => {
	await cleanEmulators();
});

const notice = (page: Page) => page.getByRole('status').filter({ hasText: 'Completaste' });
const buttonPause = (page: Page) => page.getByRole('button', { name: 'Pausar', exact: true });
const buttonResume = (page: Page) => page.getByRole('button', { name: 'Reanudar', exact: true });

async function togglePaused(page: Page, on: boolean) {
	await toggleShowPaused(page, on);
}

/** Opens the task and taps Pausar: the panel closes by itself, without Guardar. */
async function pause(page: Page, title: string) {
	await openTask(page, title);
	await expect(buttonResume(page)).toHaveCount(0);
	await buttonPause(page).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
}

/** Opens the paused task and taps Reanudar: the panel closes by itself, without Guardar. */
async function resume(page: Page, title: string) {
	await openTask(page, title);
	await expect(page.getByRole('dialog').getByText('Pausada')).toBeVisible();
	await expect(buttonPause(page)).toHaveCount(0);
	await buttonResume(page).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
}

/** Paused row: dimmed, with "Pausada", without "Tocaba", without bar and with the checkbox disabled. */
async function viewPaused(page: Page, title: string) {
	const f = row(page, title);
	await expect(f).toBeVisible();
	await expect(f.getByText('Pausada')).toHaveCount(1);
	await expect(f.getByText(/Tocaba /)).toHaveCount(0);
	await expect(f.getByRole('progressbar')).toHaveCount(0);
	const check = f.getByRole('checkbox');
	await expect(check).toBeDisabled();
	expect(await dimmed(f)).toBe(true);
}

async function notPaused(page: Page, title: string) {
	await expect(row(page, title).getByText('Pausada')).toHaveCount(0);
}

async function tapDisabled(page: Page, title: string) {
	await row(page, title).getByRole('checkbox').click({ force: true });
	await expect(notice(page)).toHaveCount(0);
}

async function lastTime(page: Page, text: string) {
	await expect(page.getByText(/^Última vez/)).toHaveText(`Última vez: ${text}`);
}

async function historyEntries(page: Page, title: string, hour: string, count: number) {
	await goA(page, 'Historial');
	await expect(
		page.getByRole('listitem').filter({ hasText: new RegExp(`^${title}\\s*${hour}`) })
	).toHaveCount(count);
	await goA(page, 'Pendientes');
}

test('Flow 1: pausar y reanudar una relativa', async ({ page }) => {
	await sessionWithClock(page, '2026-07-14T09:00:00');
	await create(page, { title: 'Cambiar foco', kind: 'No se repite' });
	await page.getByRole('button', { name: '+' }).click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await expect(buttonPause(page)).toHaveCount(0);
	await expect(buttonResume(page)).toHaveCount(0);
	await close(page);
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });

	await complete(page, 'Regar');
	await expect(row(page, 'Regar')).toHaveCount(0);
	await listIs(page, ['Cambiar foco']);

	await openTask(page, 'Cambiar foco');
	await expect(buttonPause(page)).toHaveCount(0);
	await expect(buttonResume(page)).toHaveCount(0);
	await close(page);

	await turnOnCompleted(page);
	await openTask(page, 'Regar');
	await expect(buttonPause(page)).toBeVisible();
	await lastTime(page, 'hoy 09:00');
	await buttonPause(page).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await listIs(page, ['Cambiar foco']);

	await togglePaused(page, true);
	await listIs(page, ['Cambiar foco', 'Regar']);
	await viewPaused(page, 'Regar');
	await tapDisabled(page, 'Regar');
	await historyEntries(page, 'Regar', '09:00', 1);

	await openTask(page, 'Regar');
	await expect(page.getByRole('dialog').getByText('Pausada')).toBeVisible();
	await expect(buttonResume(page)).toBeVisible();
	await expect(buttonPause(page)).toHaveCount(0);
	await lastTime(page, 'hoy 09:00');
	await close(page);

	await advance(page, '2026-07-20T10:00:00');
	await viewPaused(page, 'Regar');

	await page.reload();
	await expectShowPaused(page, true);
	await expectShowCompleted(page, true);
	await viewPaused(page, 'Regar');

	await resume(page, 'Regar');
	await waitStatus(page, 'Regar', 'pendiente', undefined, false);
	await notPaused(page, 'Regar');
	await listIs(page, ['Regar', 'Cambiar foco']);

	await openTask(page, 'Regar');
	await expect(buttonPause(page)).toBeVisible();
	await lastTime(page, 'hace 6 días');
	await close(page);
	await historyEntries(page, 'Regar', '09:00', 1);

	await advance(page, '2026-07-25T10:00:00');
	await waitStatus(page, 'Regar', 'pendiente', undefined, false);

	await advance(page, '2026-07-25T10:05:00');
	await complete(page, 'Regar');
	await expect(notice(page)).toContainText('Completaste «Regar»');
	await waitStatus(page, 'Regar', 'en espera', 0, true);
});

test('Flow 2: reanudar una de calendario', async ({ page }) => {
	await sessionWithClock(page, '2026-07-07T09:00:00');
	await create(page, { title: 'Sacar la basura', kind: 'Días de la semana', days: ['martes', 'jueves'] });
	await advance(page, '2026-07-07T09:01:00');
	await create(page, { title: 'Cambiar sábanas', kind: 'Días de la semana', days: ['jueves'] });
	await turnOnCompleted(page);
	await complete(page, 'Sacar la basura');
	await complete(page, 'Cambiar sábanas');
	await waitStatus(page, 'Sacar la basura', 'en espera');
	await waitStatus(page, 'Cambiar sábanas', 'en espera');

	await togglePaused(page, true);
	await pause(page, 'Sacar la basura');
	await pause(page, 'Cambiar sábanas');
	await toggleShowCompleted(page, false);
	await listIs(page, ['Cambiar sábanas', 'Sacar la basura']);
	await viewPaused(page, 'Sacar la basura');
	await viewPaused(page, 'Cambiar sábanas');

	await advance(page, '2026-07-15T12:00:00');
	await resume(page, 'Sacar la basura');
	await waitStatus(page, 'Sacar la basura', 'en espera', 0, false);

	await advance(page, '2026-07-15T18:00:00');
	await waitStatus(page, 'Sacar la basura', 'en espera', 50, false);

	await advance(page, '2026-07-16T10:00:00');
	await waitStatus(page, 'Sacar la basura', 'pendiente', undefined, false);
	await resume(page, 'Cambiar sábanas');
	await waitStatus(page, 'Cambiar sábanas', 'pendiente', undefined, false);
	await togglePaused(page, false);
	await listIs(page, ['Sacar la basura', 'Cambiar sábanas']);

	await complete(page, 'Sacar la basura');
	await toggleShowCompleted(page, true);
	await waitStatus(page, 'Sacar la basura', 'en espera');

	await advance(page, '2026-07-17T00:00:00');
	await waitStatus(page, 'Cambiar sábanas', 'atrasada', undefined, false);
	await waitStatus(page, 'Sacar la basura', 'en espera');
});

test('Flow 3: completar después de reanudar cubre la próxima ocurrencia', async ({ page }) => {
	await sessionWithClock(page, '2026-07-07T09:00:00');
	await turnOnCompleted(page);
	await togglePaused(page, true);
	await create(page, { title: 'Sacar la basura', kind: 'Días de la semana', days: ['martes', 'jueves'] });
	await complete(page, 'Sacar la basura');
	await pause(page, 'Sacar la basura');

	await advance(page, '2026-07-15T10:00:00');
	await resume(page, 'Sacar la basura');
	await waitStatus(page, 'Sacar la basura', 'en espera', undefined, false);

	await advance(page, '2026-07-15T11:00:00');
	await complete(page, 'Sacar la basura');
	await expect(notice(page)).toContainText('Completaste «Sacar la basura»');
	await waitStatus(page, 'Sacar la basura', 'en espera');

	await advance(page, '2026-07-16T10:00:00');
	await waitStatus(page, 'Sacar la basura', 'en espera');

	await advance(page, '2026-07-21T00:00:00');
	await waitStatus(page, 'Sacar la basura', 'pendiente', undefined, false);
});

test('Flow 4: reanudar con horario', async ({ page }) => {
	await sessionWithClock(page, '2026-07-10T09:00:00');
	await turnOnCompleted(page);
	await togglePaused(page, true);
	await create(page, {
		title: 'Ventilar',
		kind: 'Días de la semana',
		days: ['miércoles', 'viernes'],
		schedule: { from: '08:00', to: '11:00' }
	});
	await complete(page, 'Ventilar');
	await pause(page, 'Ventilar');

	await advance(page, '2026-07-15T12:00:00');
	await resume(page, 'Ventilar');
	await waitStatus(page, 'Ventilar', 'en espera', 0, false, false);

	await advance(page, '2026-07-15T23:00:00');
	await waitStatus(page, 'Ventilar', 'en espera', 25, false, false);

	await advance(page, '2026-07-17T08:00:00');
	await waitStatus(page, 'Ventilar', 'pendiente', undefined, false);

	await advance(page, '2026-07-17T11:00:00');
	await waitStatus(page, 'Ventilar', 'atrasada', undefined, false, false);

	await pause(page, 'Ventilar');
	await advance(page, '2026-07-22T09:00:00');
	await resume(page, 'Ventilar');
	await waitStatus(page, 'Ventilar', 'pendiente', undefined, false);
	await advance(page, '2026-07-22T11:00:00');
	await waitStatus(page, 'Ventilar', 'atrasada', undefined, false, false);
});

test('Flow 5: Mostrar pausadas y orden', async ({ page }) => {
	await sessionWithClock(page, '2026-07-15T08:00:00');
	await create(page, { title: 'Ñandú', kind: 'Intervalo', every: '1', unit: 'días' });
	await create(page, { title: 'Nube', kind: 'Intervalo', every: '1', unit: 'días' });
	await create(page, { title: 'Árbol', kind: 'Días de la semana', days: ['lunes'] });
	await create(page, { title: 'Pagar la luz', kind: 'Intervalo', every: '2', unit: 'días' });
	await create(page, { title: 'Cambiar foco', kind: 'No se repite' });

	await complete(page, 'Pagar la luz');
	await pause(page, 'Ñandú');
	await pause(page, 'Nube');
	await pause(page, 'Árbol');
	await listIs(page, ['Cambiar foco']);

	await togglePaused(page, true);
	await listIs(page, ['Cambiar foco', 'Árbol', 'Nube', 'Ñandú']);

	await toggleShowCompleted(page, true);
	await listIs(page, ['Cambiar foco', 'Pagar la luz', 'Árbol', 'Nube', 'Ñandú']);
	await waitStatus(page, 'Pagar la luz', 'en espera');
	for (const t of ['Árbol', 'Nube', 'Ñandú']) await viewPaused(page, t);

	await toggleShowCompleted(page, false);
	await listIs(page, ['Cambiar foco', 'Árbol', 'Nube', 'Ñandú']);

	await page.reload();
	await expectShowPaused(page, true);
	await listIs(page, ['Cambiar foco', 'Árbol', 'Nube', 'Ñandú']);
	const context = page.context();
	const other = await context.newPage();
	await other.goto('/');
	await expect(other.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
	await expectShowPaused(other, true);
	await other.close();

	await togglePaused(page, false);
	await listIs(page, ['Cambiar foco']);
	await page.reload();
	await expectShowPaused(page, false);
	await listIs(page, ['Cambiar foco']);
});

test('Flow 6: pasar una periódica pausada a puntual', async ({ page }) => {
	await sessionWithClock(page, '2026-07-10T09:00:00');
	await turnOnCompleted(page);
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await complete(page, 'Regar');
	await pause(page, 'Regar');
	await listIs(page, []);

	await advance(page, '2026-07-15T10:00:00');
	await togglePaused(page, true);
	await edit(page, 'Regar', { kind: 'No se repite' });
	await expect(row(page, 'Regar')).toHaveCount(0);
	await goA(page, 'Historial');
	await openTask(page, 'Regar');
	await expect(buttonPause(page)).toHaveCount(0);
	await expect(buttonResume(page)).toHaveCount(0);
	await close(page);

	await openTask(page, 'Regar');
	await completePanel(page, { kind: 'Intervalo', every: '2', unit: 'días' });
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await goA(page, 'Pendientes');
	await waitStatus(page, 'Regar', 'pendiente', undefined, false);
	await openTask(page, 'Regar');
	await expect(buttonPause(page)).toBeVisible();
	await close(page);
});

test('Flow 7: dos dispositivos', async ({ browser }) => {
	const { a, b, ctxB, close: end } = await twoDevices(browser, '2026-07-14T08:00:00');
	await togglePaused(a, true);
	await togglePaused(b, true);

	await create(a, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await expect(row(b, 'Regar')).toBeVisible();

	await ctxB.setOffline(true);
	await pause(a, 'Regar');
	await viewPaused(a, 'Regar');
	await arrivesOnServer(a);
	await advance(a, '2026-07-14T09:00:00');
	await advance(b, '2026-07-14T09:00:00');
	await complete(b, 'Regar');
	await expect(notice(b)).toContainText('Completaste «Regar»');

	await ctxB.setOffline(false);
	await arrivesOnServer(b);
	await viewPaused(a, 'Regar');
	await viewPaused(b, 'Regar');
	await historyEntries(a, 'Regar', '09:00', 1);
	await historyEntries(b, 'Regar', '09:00', 1);

	await ctxB.setOffline(true);
	await advance(a, '2026-07-15T10:00:00');
	await advance(b, '2026-07-15T10:00:00');
	await resume(a, 'Regar');
	await waitStatus(a, 'Regar', 'pendiente', undefined, false);
	await arrivesOnServer(a);
	await edit(b, 'Regar', { title: 'Regar plantas' });
	await ctxB.setOffline(false);
	await arrivesOnServer(b);
	for (const p of [a, b]) {
		await waitStatus(p, 'Regar plantas', 'pendiente', undefined, false);
		await notPaused(p, 'Regar plantas');
	}

	await togglePaused(a, false);
	await expectShowPaused(b, true);
	await b.reload();
	await expectShowPaused(b, true);

	await ctxB.setOffline(true);
	await pause(a, 'Regar plantas');
	await arrivesOnServer(a);
	await edit(b, 'Regar plantas', { title: 'Regar' });
	await ctxB.setOffline(false);
	await arrivesOnServer(b);
	await listIs(a, []);
	await viewPaused(b, 'Regar');
	await listIs(b, ['Regar']);
	await togglePaused(a, true);
	await viewPaused(a, 'Regar');
	await end();
});
