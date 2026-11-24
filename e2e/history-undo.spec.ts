import { expect, test, type Browser, type Page } from '@playwright/test';
import {
	openTask,
	advance,
	settle,
	remove,
	close,
	complete,
	completePanel,
	withClock,
	create,
	createAndView,
	stop,
	device,
	twoDevices,
	edit,
	turnOnCompleted,
	waitStatus,
	row,
	goA,
	openHistory,
	cleanEmulators,
	arrivesOnServer,
	sessionWithClock,
	type Groups,
	viewHistory
} from './support';

const TODAY = '2026-07-15T08:00:00';

test.beforeEach(async () => {
	await cleanEmulators();
});

/** Session with a clock and Mostrar completadas on (completed tasks show struck through at the end). */
async function session(page: Page, hour: string) {
	await sessionWithClock(page, hour);
	await turnOnCompleted(page);
}

/** Opens the session with the clock running 10 minutes before `hora` and stops it exactly at `hora`. */
async function sessionStopped(page: Page, hour: string) {
	await session(page, new Date(new Date(hour).getTime() - 600_000).toISOString());
	return hour;
}

/** Two devices with Mostrar completadas on in A and in B. */
async function twoWithCompleted(browser: Browser, hour: string) {
	const d = await twoDevices(browser, hour);
	await turnOnCompleted(d.a);
	await turnOnCompleted(d.b);
	return d;
}

/** Advances the simulated clock to `hora`, firing the intermediate timers (clock stopped). */
async function a(page: Page, hour: string) {
	const missing = new Date(hour).getTime() - (await page.evaluate(() => Date.now()));
	if (missing <= 10_000) await page.clock.runFor(missing);
	else await advance(page, hour);
}

const notice = (page: Page) => page.getByRole('status');

async function viewNotice(page: Page, title: string) {
	await expect(notice(page)).toHaveCount(1);
	await expect(notice(page)).toContainText(`Completaste «${title}»`);
	await expect(notice(page).getByRole('button', { name: 'Deshacer' })).toBeVisible();
}

const undo = (page: Page) => notice(page).getByRole('button', { name: 'Deshacer' }).click();

/** The entry with that title and time; with `encabezado`, only the one in that day's group. */
const entry = (page: Page, title: string, hour: string, heading?: string) =>
	(heading
		? page.locator(`xpath=//h2[normalize-space()="${heading}"]/following-sibling::ul[1]`).getByRole('listitem')
		: page.getByRole('listitem')
	).filter({ hasText: new RegExp(`^${title}\\s*${hour}`) });

async function deleteEntry(page: Page, title: string, hour: string, heading: string) {
	await entry(page, title, hour, heading).getByRole('button', { name: 'Borrar', exact: true }).click();
	const dialog = page.getByRole('alertdialog');
	await expect(dialog).toHaveText(new RegExp(`¿Borrar «${title}» de ${heading}, ${hour}\\?`));
	await dialog.getByRole('button', { name: 'Borrar', exact: true }).click();
	await expect(dialog).toHaveCount(0);
}

const order = (page: Page, titles: string[]) =>
	expect(page.getByRole('listitem')).toHaveText(titles.map((t) => new RegExp(`^\\s*${t}\\s`)));

/** No navigation bar: no region and no links named after the screens. */
const noBar = async (page: Page) => {
	await expect(page.getByRole('navigation')).toHaveCount(0);
	await expect(page.getByRole('link', { name: /^(Pendientes|Historial)$/ })).toHaveCount(0);
};

test('Flow 1: navegación e historial vacío', async ({ page }) => {
	await session(page, TODAY);
	await noBar(page);
	await openHistory(page);
	await expect(page).toHaveURL(/\/history$/);
	await viewHistory(page, []);
	await noBar(page);
	await expect(page.getByRole('button', { name: 'Volver', exact: true })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Menú' })).toHaveCount(0);
	await page.reload();
	await viewHistory(page, []);
	await page.getByRole('button', { name: 'Volver', exact: true }).click();
	await expect(page.getByRole('heading', { name: 'Pendientes', level: 1 })).toBeVisible();
	await expect(page.getByRole('listitem')).toHaveCount(0);
	await expect(page.getByRole('button', { name: '+' })).toBeVisible();
	await page.goto('/history');
	await viewHistory(page, []);
});

test('Flow 2: el aviso dura 5 segundos y Deshacer devuelve la tarea', async ({ page }) => {
	await sessionStopped(page, TODAY);
	await createAndView(page, { title: 'Regar', kind: 'Intervalo', every: '4', unit: 'horas' });
	await createAndView(page, { title: 'Pagar la luz', kind: 'No se repite' });
	await expect(notice(page)).toHaveCount(0);
	await stop(page, '2026-07-15T08:00:00');

	await complete(page, 'Regar');
	await withClock(page, () => waitStatus(page, 'Regar', 'en espera'));
	await viewNotice(page, 'Regar');
	await a(page, '2026-07-15T08:00:04');
	await expect(notice(page)).toHaveCount(1);
	await a(page, '2026-07-15T08:00:05');
	await expect(notice(page)).toHaveCount(0);
	await waitStatus(page, 'Regar', 'en espera');

	await a(page, '2026-07-15T08:01:00');
	await complete(page, 'Pagar la luz');
	await withClock(page, () => expect(row(page, 'Pagar la luz')).toHaveCount(0));
	await order(page, ['Regar']);
	await viewNotice(page, 'Pagar la luz');
	await a(page, '2026-07-15T08:01:03');
	await undo(page);
	await expect(notice(page)).toHaveCount(0);
	await settle(page);
	await withClock(page, () => waitStatus(page, 'Pagar la luz', 'pendiente'));

	await goA(page, 'Historial');
	await viewHistory(page, [['Hoy', [['Regar', '08:00']]]]);
	await goA(page, 'Pendientes');
	await a(page, '2026-07-15T12:00:00');
	await withClock(page, () => waitStatus(page, 'Regar', 'pendiente'));
	await complete(page, 'Regar');
	await viewNotice(page, 'Regar');
	await a(page, '2026-07-15T12:00:02');
	await undo(page);
	await expect(notice(page)).toHaveCount(0);
	await settle(page);
	await goA(page, 'Historial');
	await withClock(page, () => viewHistory(page, [['Hoy', [['Regar', '08:00']]]]));

	await page.reload();
	await withClock(page, () => viewHistory(page, [['Hoy', [['Regar', '08:00']]]]));
	await goA(page, 'Pendientes');
	await withClock(page, async () => {
		await waitStatus(page, 'Regar', 'pendiente');
		await waitStatus(page, 'Pagar la luz', 'pendiente');
	});
});

test('Flow 3: un aviso nuevo reemplaza al anterior', async ({ page }) => {
	await sessionStopped(page, TODAY);
	await createAndView(page, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await createAndView(page, { title: 'Barrer', kind: 'Intervalo', every: '2', unit: 'días' });
	await createAndView(page, { title: 'Pagar la luz', kind: 'No se repite' });
	await createAndView(page, { title: 'Cambiar foco', kind: 'No se repite' });
	await stop(page, '2026-07-15T08:00:00');

	await complete(page, 'Regar');
	await a(page, '2026-07-15T08:00:03');
	await complete(page, 'Barrer');
	await viewNotice(page, 'Barrer');
	await a(page, '2026-07-15T08:00:07');
	await viewNotice(page, 'Barrer');
	await a(page, '2026-07-15T08:00:08');
	await expect(notice(page)).toHaveCount(0);

	await a(page, '2026-07-15T08:10:00');
	await complete(page, 'Pagar la luz');
	await a(page, '2026-07-15T08:10:02');
	await complete(page, 'Cambiar foco');
	await viewNotice(page, 'Cambiar foco');
	await a(page, '2026-07-15T08:10:03');
	await undo(page);
	await expect(notice(page)).toHaveCount(0);
	await settle(page);
	await withClock(page, () => waitStatus(page, 'Cambiar foco', 'pendiente'));
	await expect(row(page, 'Pagar la luz')).toHaveCount(0);

	await goA(page, 'Historial');
	await viewHistory(page, [
		['Hoy', [['Pagar la luz', '08:10'], ['Barrer', '08:00'], ['Regar', '08:00']]]
	]);
});

test('Flow 4: el aviso sigue visible al cambiar de pantalla', async ({ page }) => {
	await sessionStopped(page, TODAY);
	await createAndView(page, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await stop(page, '2026-07-15T08:00:00');
	await complete(page, 'Regar');
	await viewNotice(page, 'Regar');
	await a(page, '2026-07-15T08:00:01');
	await goA(page, 'Historial');
	await viewNotice(page, 'Regar');
	await viewHistory(page, [['Hoy', [['Regar', '08:00']]]]);
	await a(page, '2026-07-15T08:00:02');
	await undo(page);
	await expect(notice(page)).toHaveCount(0);
	await settle(page);
	await withClock(page, () => viewHistory(page, []));
	await goA(page, 'Pendientes');
	await withClock(page, () => waitStatus(page, 'Regar', 'pendiente'));
});

test('Flow 5: orden, grupos por día y hora', async ({ page }) => {
	await session(page, '2026-07-13T08:00:00');
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '1', unit: 'días' });
	await create(page, { title: 'Sacar la basura', kind: 'Días de la semana', days: ['martes', 'jueves'] });
	await create(page, { title: 'Pagar la luz', kind: 'No se repite' });
	await advance(page, '2026-07-13T09:00:00');
	await complete(page, 'Regar');
	await advance(page, '2026-07-14T21:30:00');
	await complete(page, 'Sacar la basura');
	await advance(page, '2026-07-15T08:05:00');
	await complete(page, 'Regar');
	await advance(page, '2026-07-15T10:00:00');
	await complete(page, 'Pagar la luz');
	await advance(page, '2026-07-15T12:00:00');
	await goA(page, 'Historial');
	await viewHistory(page, [
		['Hoy', [['Pagar la luz', '10:00'], ['Regar', '08:05']]],
		['Ayer', [['Sacar la basura', '21:30']]],
		['lunes 13 de julio', [['Regar', '09:00']]]
	]);

	await advance(page, '2026-07-16T00:00:00');
	await viewHistory(page, [
		['Ayer', [['Pagar la luz', '10:00'], ['Regar', '08:05']]],
		['martes 14 de julio', [['Sacar la basura', '21:30']]],
		['lunes 13 de julio', [['Regar', '09:00']]]
	]);

	await stop(page, '2026-07-16T23:59:59');
	await goA(page, 'Pendientes');
	await complete(page, 'Regar');
	await goA(page, 'Historial');
	const final: Groups = [
		['Hoy', [['Regar', '23:59']]],
		['Ayer', [['Pagar la luz', '10:00'], ['Regar', '08:05']]],
		['martes 14 de julio', [['Sacar la basura', '21:30']]],
		['lunes 13 de julio', [['Regar', '09:00']]]
	];
	await viewHistory(page, final);
	await page.reload();
	await withClock(page, () => viewHistory(page, final));
});

test('Flow 6: el año se muestra solo si no es el actual', async ({ page }) => {
	await session(page, '2025-12-31T21:00:00');
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '1', unit: 'días' });
	await advance(page, '2025-12-31T22:00:00');
	await complete(page, 'Regar');
	await goA(page, 'Historial');
	await viewHistory(page, [['Hoy', [['Regar', '22:00']]]]);
	await advance(page, '2026-01-01T10:00:00');
	await viewHistory(page, [['Ayer', [['Regar', '22:00']]]]);
	await advance(page, '2026-01-02T10:00:00');
	await viewHistory(page, [['miércoles 31 de diciembre de 2025', [['Regar', '22:00']]]]);
});

test('Flow 7: borrar desde el Historial recalcula el estado', async ({ page }) => {
	await session(page, '2026-07-13T08:00:00');
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '4', unit: 'horas' });
	await create(page, { title: 'Sacar la basura', kind: 'Días de la semana', days: ['martes', 'jueves'] });
	await create(page, { title: 'Pagar la luz', kind: 'No se repite', date: '2026-07-14' });
	await advance(page, '2026-07-14T10:00:00');
	await complete(page, 'Sacar la basura');
	await complete(page, 'Pagar la luz');
	await waitStatus(page, 'Sacar la basura', 'en espera');
	await expect(row(page, 'Pagar la luz')).toHaveCount(0);
	await advance(page, '2026-07-15T04:00:00');
	await complete(page, 'Regar');
	await advance(page, '2026-07-15T09:00:00');
	await waitStatus(page, 'Regar', 'pendiente');
	await complete(page, 'Regar');
	await advance(page, '2026-07-15T11:00:00');
	await waitStatus(page, 'Regar', 'en espera', 50);
	await waitStatus(page, 'Sacar la basura', 'en espera');

	await goA(page, 'Historial');
	await entry(page, 'Regar', '09:00').getByRole('button', { name: 'Borrar', exact: true }).click();
	const dialog = page.getByRole('alertdialog');
	await expect(dialog).toHaveText(/¿Borrar «Regar» de Hoy, 09:00\?/);
	await expect(dialog.getByRole('button', { name: 'Borrar', exact: true })).toBeVisible();
	await dialog.getByRole('button', { name: 'Cancelar' }).click();
	await expect(dialog).toHaveCount(0);
	await expect(entry(page, 'Regar', '09:00')).toHaveCount(1);
	await expect(entry(page, 'Regar', '04:00')).toHaveCount(1);

	await deleteEntry(page, 'Regar', '09:00', 'Hoy');
	await expect(entry(page, 'Regar', '09:00')).toHaveCount(0);
	await expect(entry(page, 'Regar', '04:00')).toHaveCount(1);
	await goA(page, 'Pendientes');
	await waitStatus(page, 'Regar', 'pendiente');

	await goA(page, 'Historial');
	await deleteEntry(page, 'Regar', '04:00', 'Hoy');
	await goA(page, 'Pendientes');
	await waitStatus(page, 'Regar', 'pendiente');

	await goA(page, 'Historial');
	await deleteEntry(page, 'Pagar la luz', '10:00', 'Ayer');
	await goA(page, 'Pendientes');
	await waitStatus(page, 'Pagar la luz', 'atrasada');

	await advance(page, '2026-07-16T10:00:00');
	await waitStatus(page, 'Sacar la basura', 'pendiente');
	await complete(page, 'Sacar la basura');
	await waitStatus(page, 'Sacar la basura', 'en espera');
	await advance(page, '2026-07-18T17:00:00');
	await waitStatus(page, 'Sacar la basura', 'en espera', 50);
	await goA(page, 'Historial');
	await deleteEntry(page, 'Sacar la basura', '10:00', 'jueves 16 de julio');
	await goA(page, 'Pendientes');
	await waitStatus(page, 'Sacar la basura', 'atrasada');

	await goA(page, 'Historial');
	await page.reload();
	await viewHistory(page, [['martes 14 de julio', [['Sacar la basura', '10:00']]]]);
	await goA(page, 'Pendientes');
	await order(page, ['Pagar la luz', 'Sacar la basura', 'Regar']);
	await waitStatus(page, 'Pagar la luz', 'atrasada');
	await waitStatus(page, 'Sacar la basura', 'atrasada');
	await waitStatus(page, 'Regar', 'pendiente');
});

test('Flow 8: borrar un completado que no es el más reciente', async ({ page }) => {
	await session(page, '2026-07-15T06:00:00');
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '4', unit: 'horas' });
	await complete(page, 'Regar');
	await advance(page, '2026-07-15T10:30:00');
	await waitStatus(page, 'Regar', 'pendiente');
	await complete(page, 'Regar');
	await advance(page, '2026-07-15T12:30:00');
	await waitStatus(page, 'Regar', 'en espera', 50);
	await goA(page, 'Historial');
	await deleteEntry(page, 'Regar', '06:00', 'Hoy');
	await viewHistory(page, [['Hoy', [['Regar', '10:30']]]]);
	await goA(page, 'Pendientes');
	await waitStatus(page, 'Regar', 'en espera', 50);
});

test('Flow 9: el título que se ve es el actual', async ({ page }) => {
	await session(page, '2026-07-14T09:00:00');
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '1', unit: 'días' });
	await complete(page, 'Regar');
	await advance(page, '2026-07-15T10:00:00');
	await waitStatus(page, 'Regar', 'pendiente');
	await complete(page, 'Regar');
	await edit(page, 'Regar', { title: 'Regar plantas' });
	await goA(page, 'Historial');
	await viewHistory(page, [
		['Hoy', [['Regar plantas', '10:00']]],
		['Ayer', [['Regar plantas', '09:00']]]
	]);
});

test('Flow 10: editar y borrar la tarea desde el Historial', async ({ page }) => {
	await session(page, TODAY);
	await create(page, { title: 'Pagar la luz', kind: 'No se repite' });
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await complete(page, 'Pagar la luz');
	await complete(page, 'Regar');
	await expect(row(page, 'Pagar la luz')).toHaveCount(0);
	await waitStatus(page, 'Regar', 'en espera');
	await advance(page, '2026-07-15T10:00:00');
	await goA(page, 'Historial');

	await openTask(page, 'Pagar la luz');
	await expect(page.getByLabel('Título')).toHaveValue('Pagar la luz');
	await expect(page.getByRole('radio', { name: 'No se repite' })).toBeChecked();
	await expect(page.getByLabel('Fecha límite')).toHaveValue('');
	await close(page);
	await expect(page.getByRole('heading', { name: 'Historial', level: 1 })).toBeVisible();
	await expect(page.getByRole('listitem')).toHaveCount(2);

	await openTask(page, 'Pagar la luz');
	await completePanel(page, { kind: 'Intervalo', every: '4', unit: 'horas' });
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(page.getByRole('listitem')).toHaveCount(2);
	await goA(page, 'Pendientes');
	await waitStatus(page, 'Pagar la luz', 'en espera', 50);

	await goA(page, 'Historial');
	await openTask(page, 'Pagar la luz');
	await expect(page.getByRole('radio', { name: 'Intervalo' })).toBeChecked();
	await expect(page.getByRole('spinbutton', { name: 'Cada' })).toHaveValue('4');
	await expect(page.getByLabel('Unidad').locator('option:checked')).toHaveText('horas');
	await page.getByRole('button', { name: 'Borrar tarea' }).click();
	await page.getByRole('alertdialog').getByRole('button', { name: 'Borrar', exact: true }).click();
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
	await viewHistory(page, [['Hoy', [['Regar', '08:00']]]]);
	await goA(page, 'Pendientes');
	await expect(row(page, 'Pagar la luz')).toHaveCount(0);

	await remove(page, 'Regar');
	await goA(page, 'Historial');
	await viewHistory(page, []);
});

test('Flow 11: dos dispositivos completan sin conexión', async ({ browser }) => {
	const { a: A, b: B, ctxB, close: end } = await twoWithCompleted(browser, TODAY);
	await create(A, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await waitStatus(B, 'Regar', 'pendiente');
	await ctxB.setOffline(true);
	await complete(A, 'Regar');
	await waitStatus(A, 'Regar', 'en espera');
	await arrivesOnServer(A);
	await advance(A, '2026-07-15T09:00:00');
	await advance(B, '2026-07-15T09:00:00');
	await waitStatus(B, 'Regar', 'pendiente');
	await complete(B, 'Regar');
	await ctxB.setOffline(false);
	await arrivesOnServer(B);
	const both: Groups = [['Hoy', [['Regar', '09:00'], ['Regar', '08:00']]]];
	for (const p of [A, B]) {
		await goA(p, 'Historial');
		await viewHistory(p, both);
	}
	await deleteEntry(A, 'Regar', '09:00', 'Hoy');
	await viewHistory(B, [['Hoy', [['Regar', '08:00']]]]);
	await viewHistory(A, [['Hoy', [['Regar', '08:00']]]]);
	await end();
});

test('Flow 12: Deshacer cuando otro dispositivo ya borró la tarea', async ({ browser }) => {
	const { a: A, b: B, close: end } = await twoWithCompleted(browser, '2026-07-15T09:50:00');
	await create(A, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await waitStatus(B, 'Regar', 'pendiente');
	await stop(A, '2026-07-15T10:00:00');
	await complete(A, 'Regar');
	await viewNotice(A, 'Regar');
	await remove(B, 'Regar');
	await withClock(A, () => expect(row(A, 'Regar')).toHaveCount(0));
	await a(A, '2026-07-15T10:00:02');
	await undo(A);
	await expect(notice(A)).toHaveCount(0);
	await withClock(A, () => expect(row(A, 'Regar')).toHaveCount(0));
	await expect(A.getByRole('listitem')).toHaveCount(0);
	await expect(B.getByRole('listitem')).toHaveCount(0);
	await goA(A, 'Historial');
	await goA(B, 'Historial');
	await viewHistory(A, []);
	await viewHistory(B, []);
	for (const p of [A, B]) await p.reload();
	await withClock(A, () => viewHistory(A, []));
	await viewHistory(B, []);
	await end();
});

test('Flow 13: completado huérfano', async ({ browser }) => {
	const { a: A, b: B, ctxB, close: end } = await twoWithCompleted(browser, TODAY);
	await create(A, { title: 'Barrer', kind: 'Intervalo', every: '2', unit: 'días' });
	await create(A, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await complete(A, 'Regar');
	await waitStatus(B, 'Barrer', 'pendiente');
	await waitStatus(B, 'Regar', 'en espera');
	await ctxB.setOffline(true);
	await complete(B, 'Barrer');
	await remove(A, 'Barrer');
	await arrivesOnServer(A);
	await ctxB.setOffline(false);
	await arrivesOnServer(B);
	for (const p of [A, B]) {
		await goA(p, 'Historial');
		await viewHistory(p, [['Hoy', [['Regar', '08:00']]]]);
	}
	for (const p of [A, B]) {
		await p.reload();
		await viewHistory(p, [['Hoy', [['Regar', '08:00']]]]);
	}
	await end();
});

test('Flow 14: completado "del futuro"', async ({ browser }) => {
	const deviceA = await device(browser, '2026-07-15T12:00:00', true);
	const deviceB = await device(browser, '2026-07-16T09:00:00', false);
	const [A, B] = [deviceA.page, deviceB.page];
	await turnOnCompleted(A);
	await turnOnCompleted(B);
	await create(A, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await waitStatus(B, 'Regar', 'pendiente');
	await complete(B, 'Regar');
	await goA(A, 'Historial');
	await viewHistory(A, [['jueves 16 de julio', [['Regar', '09:00']]]]);
	await goA(A, 'Pendientes');
	await waitStatus(A, 'Regar', 'en espera', 0);
	await deviceA.ctx.close();
	await deviceB.ctx.close();
});
