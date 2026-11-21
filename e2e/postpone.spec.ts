import { expect, test, type Page } from '@playwright/test';
import {
	openTask,
	advance,
	close,
	complete,
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
	sessionWithClock
} from './support';

test.beforeEach(async () => {
	await cleanEmulators();
});

const notice = (page: Page) => page.getByRole('status').filter({ hasText: 'Completaste' });
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
/** The Posponer options, in view in the panel (no intermediate button). */
const buttonPostpone = (page: Page) => page.getByRole('group', { name: 'Posponer' });
const buttonRemove = (page: Page) => button(page, 'Quitar posponer');
const showPaused = (page: Page) => page.getByRole('checkbox', { name: 'Pausadas' });
const panel = (page: Page) => page.getByRole('dialog');

type Option = '1 hora' | '3 horas' | 'Hasta mañana';

/** Opens the task, taps Posponer and picks the option: the panel closes by itself, without Guardar. */
async function postpone(page: Page, title: string, option: Option) {
	await openTask(page, title);
	await expect(button(page, '1 hora')).toBeVisible();
	await expect(button(page, '3 horas')).toBeVisible();
	await expect(button(page, 'Hasta mañana')).toBeVisible();
	await button(page, option).click();
	await expect(panel(page)).toHaveCount(0);
}

/** Opens the postponed task and taps Quitar posponer: the panel closes by itself, without Guardar. */
async function remove(page: Page, title: string) {
	await openTask(page, title);
	await buttonRemove(page).click();
	await expect(panel(page)).toHaveCount(0);
}

/** Panel of a task that is not postponed: Posponer yes, Quitar posponer and "Pospuesta" no. */
async function panelWithoutPostpone(page: Page, title: string) {
	await openTask(page, title);
	await expect(buttonPostpone(page)).toBeVisible();
	await expect(buttonRemove(page)).toHaveCount(0);
	await expect(panel(page).getByText(/Pospuesta/)).toHaveCount(0);
	await close(page);
}

/** Panel of a postponed task: shows the text, offers Quitar posponer and not Posponer. */
async function panelPostponed(page: Page, title: string, text: string) {
	await openTask(page, title);
	await expect(panel(page).getByText(text, { exact: true })).toBeVisible();
	await expect(buttonRemove(page)).toBeVisible();
	await expect(buttonPostpone(page)).toHaveCount(0);
	await close(page);
}

/** Postponed row: waiting, not completed, without "Tocaba", with the bar at `barra`. */
const viewPostponed = (page: Page, title: string, bar: number, enabled = true) =>
	waitStatus(page, title, 'en espera', bar, false, enabled);

test('Flow 1: posponer una atrasada 1 hora', async ({ page }) => {
	await sessionWithClock(page, '2026-07-15T10:00:00');
	await create(page, { title: 'Cambiar foco', kind: 'No se repite' });
	await create(page, { title: 'Pagar la luz', kind: 'No se repite', date: '2026-07-14' });
	await page.getByRole('button', { name: '+' }).click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await expect(buttonPostpone(page)).toHaveCount(0);
	await close(page);
	await listIs(page, ['Pagar la luz', 'Cambiar foco']);
	await waitStatus(page, 'Pagar la luz', 'atrasada', undefined, false);

	await openTask(page, 'Pagar la luz');
	await expect(buttonPostpone(page)).toBeVisible();
	await expect(buttonRemove(page)).toHaveCount(0);
	await expect(panel(page).getByText(/Pospuesta/)).toHaveCount(0);
	await expect(button(page, '1 hora')).toBeVisible();
	await expect(button(page, '3 horas')).toBeVisible();
	await expect(button(page, 'Hasta mañana')).toBeVisible();
	await button(page, '1 hora').click();
	await expect(panel(page)).toHaveCount(0);

	await listIs(page, ['Cambiar foco', 'Pagar la luz']);
	await viewPostponed(page, 'Pagar la luz', 0);
	await panelPostponed(page, 'Pagar la luz', 'Pospuesta hasta 11:00');

	await advance(page, '2026-07-15T10:30:00');
	await viewPostponed(page, 'Pagar la luz', 50);
	await page.reload();
	await viewPostponed(page, 'Pagar la luz', 50);

	await advance(page, '2026-07-15T11:00:00');
	await waitStatus(page, 'Pagar la luz', 'atrasada', undefined, false);
	await listIs(page, ['Pagar la luz', 'Cambiar foco']);
	await panelWithoutPostpone(page, 'Pagar la luz');
});

test('Flow 2: 3 horas y Hasta mañana, pasando la medianoche', async ({ page }) => {
	await sessionWithClock(page, '2026-07-15T22:00:00');
	for (const title of ['Cambiar foco', 'Barrer', 'Regar plantas'])
		await create(page, { title, kind: 'No se repite' });
	await listIs(page, ['Cambiar foco', 'Barrer', 'Regar plantas']);

	await advance(page, '2026-07-15T22:30:00');
	await postpone(page, 'Barrer', 'Hasta mañana');
	await postpone(page, 'Cambiar foco', '3 horas');
	await listIs(page, ['Regar plantas', 'Cambiar foco', 'Barrer']);

	await panelPostponed(page, 'Cambiar foco', 'Pospuesta hasta mañana 01:30');
	await panelPostponed(page, 'Barrer', 'Pospuesta hasta mañana 07:00');

	await advance(page, '2026-07-16T00:00:00');
	await panelPostponed(page, 'Cambiar foco', 'Pospuesta hasta 01:30');

	await advance(page, '2026-07-16T01:30:00');
	await waitStatus(page, 'Cambiar foco', 'pendiente', undefined, false);
	await listIs(page, ['Cambiar foco', 'Regar plantas', 'Barrer']);

	await advance(page, '2026-07-16T02:00:00');
	await postpone(page, 'Regar plantas', 'Hasta mañana');
	await panelPostponed(page, 'Regar plantas', 'Pospuesta hasta mañana 07:00');

	await advance(page, '2026-07-16T07:00:00');
	await waitStatus(page, 'Barrer', 'pendiente', undefined, false);
	await viewPostponed(page, 'Regar plantas', 17);
	await listIs(page, ['Cambiar foco', 'Barrer', 'Regar plantas']);
});

test('Flow 3: quitar posponer, completar, deshacer y editar', async ({ page }) => {
	await sessionWithClock(page, '2026-07-15T10:00:00');
	await create(page, { title: 'Pagar la luz', kind: 'No se repite', date: '2026-07-14' });
	await postpone(page, 'Pagar la luz', '3 horas');
	await viewPostponed(page, 'Pagar la luz', 0);

	await remove(page, 'Pagar la luz');
	await waitStatus(page, 'Pagar la luz', 'atrasada', undefined, false);
	await panelWithoutPostpone(page, 'Pagar la luz');

	await advance(page, '2026-07-15T10:05:00');
	await postpone(page, 'Pagar la luz', '3 horas');
	await advance(page, '2026-07-15T10:30:00');
	await complete(page, 'Pagar la luz');
	await expect(notice(page)).toContainText('Completaste «Pagar la luz»');
	await expect(row(page, 'Pagar la luz')).toHaveCount(0);

	await notice(page).getByRole('button', { name: 'Deshacer' }).click();
	await viewPostponed(page, 'Pagar la luz', 14);
	await openTask(page, 'Pagar la luz');
	await expect(panel(page).getByText('Pospuesta hasta 13:05', { exact: true })).toBeVisible();

	await page.getByLabel('Título').fill('Pagar el gas');
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(panel(page)).toHaveCount(0);
	await viewPostponed(page, 'Pagar el gas', 14);
	await panelPostponed(page, 'Pagar el gas', 'Pospuesta hasta 13:05');

	await advance(page, '2026-07-15T13:05:00');
	await waitStatus(page, 'Pagar el gas', 'atrasada', undefined, false);
});

test('Flow 4: periódicas pospuestas', async ({ page }) => {
	await sessionWithClock(page, '2026-07-15T08:00:00');
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '4', unit: 'horas' });
	await create(page, { title: 'Barrer', kind: 'Intervalo', every: '4', unit: 'horas' });
	await complete(page, 'Regar');
	await complete(page, 'Barrer');
	await listIs(page, []);

	await advance(page, '2026-07-15T12:30:00');
	await waitStatus(page, 'Regar', 'pendiente', undefined, false);
	await waitStatus(page, 'Barrer', 'pendiente', undefined, false);
	await postpone(page, 'Regar', '3 horas');
	await postpone(page, 'Barrer', '3 horas');
	await listIs(page, ['Regar', 'Barrer']);
	await viewPostponed(page, 'Regar', 0);
	await viewPostponed(page, 'Barrer', 0);

	await advance(page, '2026-07-15T13:00:00');
	await complete(page, 'Regar');
	await expect(notice(page)).toContainText('Completaste «Regar»');
	await expect(row(page, 'Regar')).toHaveCount(0);
	await goA(page, 'Historial');
	await expect(page.getByRole('listitem').filter({ hasText: /^Regar\s*08:00/ })).toHaveCount(1);
	await expect(page.getByRole('listitem').filter({ hasText: /^Regar\s*13:00/ })).toHaveCount(1);
	await goA(page, 'Pendientes');

	await turnOnCompleted(page);
	await waitStatus(page, 'Regar', 'en espera');
	await panelPostponed(page, 'Regar', 'Pospuesta hasta 15:30');

	await advance(page, '2026-07-15T15:30:00');
	await waitStatus(page, 'Barrer', 'pendiente', undefined, false);
	await waitStatus(page, 'Regar', 'en espera');

	await advance(page, '2026-07-15T16:00:00');
	await waitStatus(page, 'Barrer', 'atrasada', undefined, false);
});

test('Flow 5: posponer con horario', async ({ page }) => {
	await sessionWithClock(page, '2026-07-15T07:00:00');
	await create(page, {
		title: 'Ventilar',
		kind: 'No se repite',
		schedule: { from: '08:00', to: '11:00' }
	});
	await waitStatus(page, 'Ventilar', 'en espera', undefined, false, false);
	await openTask(page, 'Ventilar');
	await expect(buttonPostpone(page)).toHaveCount(0);
	await close(page);

	await advance(page, '2026-07-15T09:00:00');
	await waitStatus(page, 'Ventilar', 'pendiente', undefined, false);
	await postpone(page, 'Ventilar', '3 horas');

	await advance(page, '2026-07-15T09:30:00');
	await viewPostponed(page, 'Ventilar', 17);

	await advance(page, '2026-07-15T11:30:00');
	await waitStatus(page, 'Ventilar', 'en espera', undefined, false, false);
	await row(page, 'Ventilar').getByRole('checkbox').click({ force: true });
	await expect(notice(page)).toHaveCount(0);

	await advance(page, '2026-07-15T12:00:00');
	await waitStatus(page, 'Ventilar', 'en espera', undefined, false, false);
	await openTask(page, 'Ventilar');
	await expect(panel(page).getByText(/Pospuesta/)).toHaveCount(0);
	await expect(buttonPostpone(page)).toHaveCount(0);
	await close(page);
});

test('Flow 6: pausar y posponer', async ({ page }) => {
	await sessionWithClock(page, '2026-07-15T10:00:00');
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await openTask(page, 'Regar');
	await expect(buttonPostpone(page)).toBeVisible();
	await expect(button(page, 'Pausar')).toBeVisible();
	await button(page, 'Pausar').click();
	await expect(panel(page)).toHaveCount(0);

	await showPaused(page).click();
	await expect(showPaused(page)).toBeChecked();
	await openTask(page, 'Regar');
	await expect(panel(page).getByText('Pausada')).toBeVisible();
	await expect(buttonPostpone(page)).toHaveCount(0);
	await button(page, 'Reanudar').click();
	await expect(panel(page)).toHaveCount(0);
	await waitStatus(page, 'Regar', 'pendiente', undefined, false);

	await postpone(page, 'Regar', '3 horas');
	await openTask(page, 'Regar');
	await expect(buttonRemove(page)).toBeVisible();
	await expect(button(page, 'Pausar')).toBeVisible();
	await button(page, 'Pausar').click();
	await expect(panel(page)).toHaveCount(0);
	await expect(row(page, 'Regar').getByText('Pausada')).toHaveCount(1);
	await expect(row(page, 'Regar').getByRole('progressbar')).toHaveCount(0);

	await advance(page, '2026-07-15T11:30:00');
	await openTask(page, 'Regar');
	await button(page, 'Reanudar').click();
	await expect(panel(page)).toHaveCount(0);
	await viewPostponed(page, 'Regar', 50);
});

test('Flow 7: dos dispositivos', async ({ browser }) => {
	const { a, b, ctxB, close: end } = await twoDevices(browser, '2026-07-15T10:00:00');
	await create(a, { title: 'Pagar la luz', kind: 'No se repite' });
	await expect(row(b, 'Pagar la luz')).toBeVisible();

	await ctxB.setOffline(true);
	await postpone(a, 'Pagar la luz', '3 horas');
	await arrivesOnServer(a);
	await edit(b, 'Pagar la luz', { title: 'Pagar el gas' });
	await ctxB.setOffline(false);
	await arrivesOnServer(b);
	await panelPostponed(a, 'Pagar el gas', 'Pospuesta hasta 13:00');
	await panelPostponed(b, 'Pagar el gas', 'Pospuesta hasta 13:00');

	await remove(a, 'Pagar el gas');
	await arrivesOnServer(a);
	await waitStatus(b, 'Pagar el gas', 'pendiente', undefined, false);
	await ctxB.setOffline(true);
	await advance(a, '2026-07-15T10:10:00');
	await postpone(a, 'Pagar el gas', '3 horas');
	await arrivesOnServer(a);
	await advance(b, '2026-07-15T10:15:00');
	await postpone(b, 'Pagar el gas', '1 hora');
	await ctxB.setOffline(false);
	await arrivesOnServer(b);
	await panelPostponed(a, 'Pagar el gas', 'Pospuesta hasta 11:15');
	await panelPostponed(b, 'Pagar el gas', 'Pospuesta hasta 11:15');
	await end();
});

test('Flow 8: dos dispositivos con relojes desfasados', async ({ browser }) => {
	const { a, b, close: end } = await twoDevices(browser, '2026-07-15T08:00:00');
	await advance(a, '2026-07-15T08:05:00');
	await create(a, { title: 'Pagar la luz', kind: 'No se repite' });
	await expect(row(b, 'Pagar la luz')).toBeVisible();
	await waitStatus(b, 'Pagar la luz', 'pendiente', undefined, false);

	await postpone(a, 'Pagar la luz', '1 hora');
	await panelPostponed(a, 'Pagar la luz', 'Pospuesta hasta 09:05');
	await viewPostponed(a, 'Pagar la luz', 0);

	await arrivesOnServer(b);
	await viewPostponed(b, 'Pagar la luz', 0);
	await panelPostponed(b, 'Pagar la luz', 'Pospuesta hasta 09:05');

	await advance(a, '2026-07-15T08:35:00');
	await advance(b, '2026-07-15T08:30:00');
	await viewPostponed(a, 'Pagar la luz', 50);
	await viewPostponed(b, 'Pagar la luz', 42);
	await end();
});
