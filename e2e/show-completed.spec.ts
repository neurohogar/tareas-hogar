import { expect, test, type Page } from '@playwright/test';
import {
	advance,
	settle,
	complete,
	withClock,
	toggleShowCompleted,
	create,
	createAndView,
	stop,
	device,
	twoDevices,
	turnOnCompleted,
	waitStatus,
	goA,
	cleanEmulators,
	listIs,
	arrivesOnServer,
	expectShowCompleted,
	openTask,
	close,
	opacityEffective,
	sessionWithClock,
	rowTitle,
	row,
	viewHistory
} from './support';

const TODAY = '2026-07-15T08:00:00';

test.beforeEach(async () => {
	await cleanEmulators();
});

/** Advances the simulated clock to `hora`, firing the intermediate timers (clock stopped). */
async function go(page: Page, hour: string) {
	const missing = new Date(hour).getTime() - (await page.evaluate(() => Date.now()));
	if (missing <= 10_000) await page.clock.runFor(missing);
	else await advance(page, hour);
}

/** Session that ends with the clock running 10 minutes before `hora`, with Mostrar completadas on. */
async function sessionStopped(page: Page, hour: string) {
	await sessionWithClock(page, new Date(new Date(hour).getTime() - 600_000).toISOString());
	await turnOnCompleted(page);
}

const notice = (page: Page) => page.getByRole('status');

async function viewNotice(page: Page, title: string) {
	await expect(notice(page)).toHaveCount(1);
	await expect(notice(page)).toContainText(`Completaste «${title}»`);
	await expect(notice(page).getByRole('button', { name: 'Deshacer' })).toBeVisible();
}

test('Flow 1: apagado por defecto, encender y apagar', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	await create(page, { title: 'Cambiar foco', kind: 'No se repite' });
	await advance(page, '2026-07-15T08:01:00');
	await create(page, { title: 'Regar plantas', kind: 'Intervalo', every: '2', unit: 'días' });
	await advance(page, '2026-07-15T08:02:00');
	await create(page, { title: 'Sacar la basura', kind: 'Días de la semana', days: ['sábado'] });
	await expectShowCompleted(page, false);
	await listIs(page, ['Regar plantas', 'Cambiar foco', 'Sacar la basura']);
	await waitStatus(page, 'Regar plantas', 'pendiente');
	await waitStatus(page, 'Cambiar foco', 'pendiente');
	await waitStatus(page, 'Sacar la basura', 'en espera', undefined, false);

	await advance(page, '2026-07-15T08:05:00');
	await complete(page, 'Cambiar foco');
	await listIs(page, ['Regar plantas', 'Sacar la basura']);

	await advance(page, '2026-07-15T08:06:00');
	await complete(page, 'Regar plantas');
	await listIs(page, ['Sacar la basura']);

	await toggleShowCompleted(page, true);
	await listIs(page, ['Sacar la basura', 'Regar plantas']);
	await expect(row(page, 'Cambiar foco')).toHaveCount(0);
	await waitStatus(page, 'Regar plantas', 'en espera', 0);
	await waitStatus(page, 'Sacar la basura', 'en espera', undefined, false);

	await toggleShowCompleted(page, false);
	await listIs(page, ['Sacar la basura']);

	await toggleShowCompleted(page, true);
	await advance(page, '2026-07-17T08:06:00');
	await waitStatus(page, 'Regar plantas', 'pendiente');
	await listIs(page, ['Regar plantas', 'Sacar la basura']);
});

test('Flow 2: orden de las completadas', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	await turnOnCompleted(page);
	await create(page, { title: 'Pagar la luz', kind: 'No se repite' });
	await advance(page, '2026-07-15T08:01:00');
	await create(page, { title: 'Ventilar', kind: 'Intervalo', every: '4', unit: 'horas' });
	await advance(page, '2026-07-15T08:02:00');
	await create(page, { title: 'Barrer', kind: 'Intervalo', every: '2', unit: 'días' });
	await advance(page, '2026-07-15T08:03:00');
	await create(page, { title: 'Lavar ropa', kind: 'No se repite' });

	await advance(page, '2026-07-15T09:00:00');
	await complete(page, 'Barrer');
	await advance(page, '2026-07-15T09:30:00');
	await complete(page, 'Ventilar');
	await advance(page, '2026-07-15T10:00:00');
	await complete(page, 'Pagar la luz');
	await listIs(page, ['Lavar ropa', 'Ventilar', 'Barrer']);
	await expect(row(page, 'Pagar la luz')).toHaveCount(0);
	await waitStatus(page, 'Lavar ropa', 'pendiente');
	await waitStatus(page, 'Ventilar', 'en espera');
	await waitStatus(page, 'Barrer', 'en espera');

	await advance(page, '2026-07-15T13:30:00');
	await waitStatus(page, 'Ventilar', 'pendiente');
	await listIs(page, ['Ventilar', 'Lavar ropa', 'Barrer']);

	await page.reload();
	await expectShowCompleted(page, true);
	await listIs(page, ['Ventilar', 'Lavar ropa', 'Barrer']);
});

test('Flow 3: tocar el checkbox de una periódica completada', async ({ page }) => {
	await sessionStopped(page, TODAY);
	await createAndView(page, { title: 'Regar', kind: 'Intervalo', every: '4', unit: 'horas' });
	await listIs(page, ['Regar']);
	await stop(page, TODAY);

	await go(page, '2026-07-15T08:01:00');
	await complete(page, 'Regar');
	await viewNotice(page, 'Regar');
	await withClock(page, () => waitStatus(page, 'Regar', 'en espera', 0));

	await go(page, '2026-07-15T08:01:02');
	await complete(page, 'Regar');
	await withClock(page, () => waitStatus(page, 'Regar', 'pendiente'));
	await viewNotice(page, 'Regar');

	await go(page, '2026-07-15T08:01:03');
	await notice(page).getByRole('button', { name: 'Deshacer' }).click();
	await expect(notice(page)).toHaveCount(0);
	await settle(page);
	await withClock(page, () => waitStatus(page, 'Regar', 'pendiente'));
	await goA(page, 'Historial');
	await withClock(page, () => viewHistory(page, []));
	await goA(page, 'Pendientes');

	await go(page, '2026-07-15T08:02:00');
	await complete(page, 'Regar');
	await withClock(page, () => waitStatus(page, 'Regar', 'en espera', 0));
	await go(page, '2026-07-15T12:02:00');
	await withClock(page, () => waitStatus(page, 'Regar', 'pendiente'));
	await complete(page, 'Regar');
	await withClock(page, () => waitStatus(page, 'Regar', 'en espera', 0));
	await goA(page, 'Historial');
	await withClock(page, () => viewHistory(page, [['Hoy', [['Regar', '12:02'], ['Regar', '08:02']]]]));
	await goA(page, 'Pendientes');

	await go(page, '2026-07-15T12:02:10');
	await complete(page, 'Regar');
	await withClock(page, () => waitStatus(page, 'Regar', 'pendiente'));
	await goA(page, 'Historial');
	await withClock(page, () => viewHistory(page, [['Hoy', [['Regar', '08:02']]]]));
	await goA(page, 'Pendientes');

});

test('Flow 4: una puntual completada no tiene fila', async ({ page }) => {
	await sessionStopped(page, TODAY);
	await createAndView(page, { title: 'Pagar la luz', kind: 'No se repite', date: '2026-07-15' });
	await createAndView(page, { title: 'Cambiar foco', kind: 'No se repite' });
	await listIs(page, ['Pagar la luz', 'Cambiar foco']);
	await stop(page, TODAY);

	await complete(page, 'Pagar la luz');
	await viewNotice(page, 'Pagar la luz');
	await withClock(page, async () => {
		await listIs(page, ['Cambiar foco']);
		await expect(row(page, 'Pagar la luz')).toHaveCount(0);
	});

	await go(page, '2026-07-15T08:00:02');
	await notice(page).getByRole('button', { name: 'Deshacer' }).click();
	await expect(notice(page)).toHaveCount(0);
	await settle(page);
	await withClock(page, async () => {
		await listIs(page, ['Pagar la luz', 'Cambiar foco']);
		await waitStatus(page, 'Pagar la luz', 'pendiente');
	});

	await go(page, '2026-07-15T08:00:10');
	await complete(page, 'Pagar la luz');
	await go(page, '2026-07-15T08:00:20');
	await expect(notice(page)).toHaveCount(0);
	await withClock(page, async () => {
		await listIs(page, ['Cambiar foco']);
		await expect(row(page, 'Pagar la luz')).toHaveCount(0);
	});
	await expectShowCompleted(page, true);
	await goA(page, 'Historial');
	await withClock(page, () => viewHistory(page, [['Hoy', [['Pagar la luz', '08:00']]]]));

	await openTask(page, 'Pagar la luz');
	await close(page);
	await expect(page.getByRole('heading', { name: 'Historial', level: 1 })).toBeVisible();

	await page.getByRole('listitem').filter({ hasText: 'Pagar la luz' }).getByRole('button', { name: 'Borrar', exact: true }).click();
	await page.getByRole('alertdialog').getByRole('button', { name: 'Borrar', exact: true }).click();
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
	await withClock(page, () => viewHistory(page, []));
	await goA(page, 'Pendientes');
	await withClock(page, async () => {
		await listIs(page, ['Pagar la luz', 'Cambiar foco']);
		await waitStatus(page, 'Pagar la luz', 'pendiente');
	});

	await complete(page, 'Pagar la luz');
	await go(page, '2026-07-15T08:00:30');
	await toggleShowCompleted(page, false);
	await withClock(page, () => listIs(page, ['Cambiar foco']));
	await toggleShowCompleted(page, true);
	await withClock(page, () => listIs(page, ['Cambiar foco']));
});

test('Flow 5: el valor se guarda en el dispositivo', async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await sessionWithClock(page, TODAY);
	await create(page, { title: 'Cambiar foco', kind: 'No se repite' });
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await complete(page, 'Regar');
	await listIs(page, ['Cambiar foco']);

	await toggleShowCompleted(page, true);
	await listIs(page, ['Cambiar foco', 'Regar']);
	await waitStatus(page, 'Regar', 'en espera', 0);

	await page.reload();
	await expectShowCompleted(page, true);
	await listIs(page, ['Cambiar foco', 'Regar']);

	await page.close();
	const fresh = await context.newPage();
	await fresh.clock.install({ time: new Date(TODAY) });
	await fresh.goto('/');
	await expect(fresh.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
	await expect(fresh.getByRole('button', { name: 'Entrar con Google' })).toHaveCount(0);
	await expectShowCompleted(fresh, true);
	await listIs(fresh, ['Cambiar foco', 'Regar']);

	await toggleShowCompleted(fresh, false);
	await fresh.reload();
	await expectShowCompleted(fresh, false);
	await listIs(fresh, ['Cambiar foco']);
	await context.close();
});

test('Flow 6: el valor no se sincroniza entre dispositivos', async ({ browser }) => {
	const { a, b, close: end } = await twoDevices(browser, TODAY);
	await create(a, { title: 'Cambiar foco', kind: 'No se repite' });
	await create(a, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await complete(a, 'Regar');
	await listIs(b, ['Cambiar foco']);

	await toggleShowCompleted(a, true);
	await listIs(a, ['Cambiar foco', 'Regar']);
	await expectShowCompleted(b, false);
	await listIs(b, ['Cambiar foco']);
	await b.reload();
	await expectShowCompleted(b, false);
	await listIs(b, ['Cambiar foco']);

	await toggleShowCompleted(b, true);
	await listIs(b, ['Cambiar foco', 'Regar']);
	await waitStatus(b, 'Regar', 'en espera', 0);
	await toggleShowCompleted(a, false);
	await listIs(a, ['Cambiar foco']);
	await expectShowCompleted(b, true);
	await listIs(b, ['Cambiar foco', 'Regar']);
	await end();
});

test('Flow 7: dos completados de dos dispositivos', async ({ browser }) => {
	const { a, b, ctxB, close: end } = await twoDevices(browser, TODAY);
	await turnOnCompleted(a);
	await create(a, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await expect(row(b, 'Regar')).toBeVisible();

	await ctxB.setOffline(true);
	await complete(a, 'Regar');
	await waitStatus(a, 'Regar', 'en espera');
	await arrivesOnServer(a);
	await advance(a, '2026-07-15T08:05:00');
	await advance(b, '2026-07-15T08:05:00');
	await complete(b, 'Regar');
	await expect(row(b, 'Regar')).toHaveCount(0);
	await ctxB.setOffline(false);
	await arrivesOnServer(b);

	await goA(a, 'Historial');
	await viewHistory(a, [['Hoy', [['Regar', '08:05'], ['Regar', '08:00']]]]);
	await goA(a, 'Pendientes');
	await waitStatus(a, 'Regar', 'en espera');

	await complete(a, 'Regar');
	await waitStatus(a, 'Regar', 'en espera');
	await goA(a, 'Historial');
	await viewHistory(a, [['Hoy', [['Regar', '08:00']]]]);
	await goA(b, 'Historial');
	await viewHistory(b, [['Hoy', [['Regar', '08:00']]]]);

	await goA(a, 'Pendientes');
	await complete(a, 'Regar');
	await waitStatus(a, 'Regar', 'pendiente');
	await goA(a, 'Historial');
	await viewHistory(a, []);
	await viewHistory(b, []);
	await end();
});

test('Flow 8: periódica completada ayer: el checkbox la completa de nuevo', async ({ page }) => {
	await sessionStopped(page, '2026-07-15T20:00:00');
	await createAndView(page, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await stop(page, '2026-07-15T20:00:00');

	await complete(page, 'Regar');
	await viewNotice(page, 'Regar');
	await withClock(page, () => waitStatus(page, 'Regar', 'en espera'));

	await go(page, '2026-07-15T23:59:59');
	await expect(notice(page)).toHaveCount(0);
	await complete(page, 'Regar');
	await withClock(page, () => waitStatus(page, 'Regar', 'pendiente'));
	await expect(notice(page)).toHaveCount(0);
	await complete(page, 'Regar');
	await withClock(page, () => waitStatus(page, 'Regar', 'en espera', 0));
	await goA(page, 'Historial');
	await withClock(page, () => viewHistory(page, [['Hoy', [['Regar', '23:59']]]]));
	await goA(page, 'Pendientes');

	await go(page, '2026-07-16T00:00:00');
	await complete(page, 'Regar');
	await viewNotice(page, 'Regar');
	await withClock(page, () => waitStatus(page, 'Regar', 'en espera', 0));
	await goA(page, 'Historial');
	await withClock(page, () => viewHistory(page, [['Hoy', [['Regar', '00:00']]], ['Ayer', [['Regar', '23:59']]]]));
	await goA(page, 'Pendientes');

	await go(page, '2026-07-16T00:00:10');
	await expect(notice(page)).toHaveCount(0);
	await complete(page, 'Regar');
	await expect(notice(page)).toHaveCount(0);
	await withClock(page, () => waitStatus(page, 'Regar', 'en espera'));
	await goA(page, 'Historial');
	await withClock(page, () => viewHistory(page, [['Ayer', [['Regar', '23:59']]]]));
});

test('Flow 9: completado "del futuro"', async ({ browser }) => {
	const deviceA = await device(browser, '2026-07-15T12:00:00', true);
	const deviceB = await device(browser, '2026-07-16T09:00:00', false);
	const [A, B] = [deviceA.page, deviceB.page];
	await turnOnCompleted(A);
	await create(A, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await waitStatus(B, 'Regar', 'pendiente');
	await complete(B, 'Regar');
	await waitStatus(A, 'Regar', 'en espera', 0);

	await complete(A, 'Regar');
	await waitStatus(A, 'Regar', 'pendiente');
	for (const p of [A, B]) {
		await goA(p, 'Historial');
		await viewHistory(p, []);
	}
	await deviceA.ctx.close();
	await deviceB.ctx.close();
});
