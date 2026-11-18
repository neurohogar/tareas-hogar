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
	showCompleted,
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

/** Avanza el reloj simulado hasta `hora`, disparando los temporizadores intermedios (reloj detenido). */
async function go(page: Page, hour: string) {
	const missing = new Date(hour).getTime() - (await page.evaluate(() => Date.now()));
	if (missing <= 10_000) await page.clock.runFor(missing);
	else await advance(page, hour);
}

/** Sesión que termina con el reloj corriendo 10 minutos antes de `hora`, con Mostrar completadas encendido. */
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

test('Flujo 1: apagado por defecto, encender y apagar', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	await create(page, { title: 'Cambiar foco', kind: 'No se repite' });
	await advance(page, '2026-07-15T08:01:00');
	await create(page, { title: 'Regar plantas', kind: 'Intervalo', every: '2', unit: 'días' });
	await advance(page, '2026-07-15T08:02:00');
	await create(page, { title: 'Sacar la basura', kind: 'Días de la semana', days: ['sábado'] });
	await expect(showCompleted(page)).not.toBeChecked();
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
	await listIs(page, ['Sacar la basura', 'Regar plantas', 'Cambiar foco']);
	await waitStatus(page, 'Regar plantas', 'en espera', 0);
	await waitStatus(page, 'Cambiar foco', 'pendiente', undefined, true);
	await waitStatus(page, 'Sacar la basura', 'en espera', undefined, false);

	await toggleShowCompleted(page, false);
	await listIs(page, ['Sacar la basura']);

	await toggleShowCompleted(page, true);
	await advance(page, '2026-07-17T08:06:00');
	await waitStatus(page, 'Regar plantas', 'pendiente');
	await listIs(page, ['Regar plantas', 'Sacar la basura', 'Cambiar foco']);
	await waitStatus(page, 'Cambiar foco', 'pendiente', undefined, true);
	const opWater = await opacityEffective(rowTitle(row(page, 'Regar plantas')));
	const opFocus = await opacityEffective(rowTitle(row(page, 'Cambiar foco')));
	expect(opFocus).toBeLessThan(opWater);
});

test('Flujo 2: orden de las completadas', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	await turnOnCompleted(page);
	await create(page, { title: 'Pagar la luz', kind: 'No se repite' });
	await advance(page, '2026-07-15T08:01:00');
	await create(page, { title: 'Ventilar', kind: 'Intervalo', every: '4', unit: 'horas' });
	await advance(page, '2026-07-15T08:02:00');
	await create(page, { title: 'Barrer', kind: 'No se repite' });
	await advance(page, '2026-07-15T08:03:00');
	await create(page, { title: 'Lavar ropa', kind: 'No se repite' });

	await advance(page, '2026-07-15T09:00:00');
	await complete(page, 'Barrer');
	await advance(page, '2026-07-15T09:30:00');
	await complete(page, 'Ventilar');
	await advance(page, '2026-07-15T10:00:00');
	await complete(page, 'Pagar la luz');
	await listIs(page, ['Lavar ropa', 'Pagar la luz', 'Ventilar', 'Barrer']);
	await waitStatus(page, 'Lavar ropa', 'pendiente');
	await waitStatus(page, 'Pagar la luz', 'pendiente', undefined, true);
	await waitStatus(page, 'Ventilar', 'en espera');
	await waitStatus(page, 'Barrer', 'pendiente', undefined, true);

	await advance(page, '2026-07-15T13:30:00');
	await waitStatus(page, 'Ventilar', 'pendiente');
	await listIs(page, ['Ventilar', 'Lavar ropa', 'Pagar la luz', 'Barrer']);

	await page.reload();
	await expect(showCompleted(page)).toBeChecked();
	await listIs(page, ['Ventilar', 'Lavar ropa', 'Pagar la luz', 'Barrer']);
});

test('Flujo 3: tocar el checkbox de una completada', async ({ page }) => {
	await sessionStopped(page, TODAY);
	await createAndView(page, { title: 'Pagar la luz', kind: 'No se repite', date: '2026-07-15' });
	await createAndView(page, { title: 'Regar', kind: 'Intervalo', every: '4', unit: 'horas' });
	await listIs(page, ['Pagar la luz', 'Regar']);
	await stop(page, TODAY);

	await complete(page, 'Pagar la luz');
	await viewNotice(page, 'Pagar la luz');
	await withClock(page, () => listIs(page, ['Regar', 'Pagar la luz']));
	await waitStatus(page, 'Pagar la luz', 'pendiente', undefined, true);

	await go(page, '2026-07-15T08:00:10');
	await expect(notice(page)).toHaveCount(0);
	await complete(page, 'Pagar la luz');
	await withClock(page, async () => {
		await listIs(page, ['Pagar la luz', 'Regar']);
		await waitStatus(page, 'Pagar la luz', 'pendiente');
	});
	await expect(notice(page)).toHaveCount(0);
	await goA(page, 'Historial');
	await withClock(page, () => viewHistory(page, []));
	await goA(page, 'Pendientes');

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

	await go(page, '2026-07-16T00:00:00');
	await withClock(page, async () => {
		await waitStatus(page, 'Pagar la luz', 'atrasada');
		await waitStatus(page, 'Regar', 'atrasada');
	});
	await complete(page, 'Pagar la luz');
	await withClock(page, () => waitStatus(page, 'Pagar la luz', 'pendiente', undefined, true));
	await complete(page, 'Pagar la luz');
	await withClock(page, () => waitStatus(page, 'Pagar la luz', 'atrasada'));

	await page.reload();
	await withClock(page, async () => {
		await listIs(page, ['Regar', 'Pagar la luz']);
		await waitStatus(page, 'Regar', 'atrasada');
		await waitStatus(page, 'Pagar la luz', 'atrasada');
	});
});

test('Flujo 4: el valor se guarda en el dispositivo', async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await sessionWithClock(page, TODAY);
	await create(page, { title: 'Cambiar foco', kind: 'No se repite' });
	await create(page, { title: 'Pagar la luz', kind: 'No se repite' });
	await complete(page, 'Cambiar foco');
	await listIs(page, ['Pagar la luz']);

	await toggleShowCompleted(page, true);
	await listIs(page, ['Pagar la luz', 'Cambiar foco']);
	await waitStatus(page, 'Cambiar foco', 'pendiente', undefined, true);

	await page.reload();
	await expect(showCompleted(page)).toBeChecked();
	await listIs(page, ['Pagar la luz', 'Cambiar foco']);

	await page.close();
	const fresh = await context.newPage();
	await fresh.clock.install({ time: new Date(TODAY) });
	await fresh.goto('/');
	await expect(fresh.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
	await expect(fresh.getByRole('button', { name: 'Entrar con Google' })).toHaveCount(0);
	await expect(showCompleted(fresh)).toBeChecked();
	await listIs(fresh, ['Pagar la luz', 'Cambiar foco']);

	await toggleShowCompleted(fresh, false);
	await fresh.reload();
	await expect(showCompleted(fresh)).not.toBeChecked();
	await listIs(fresh, ['Pagar la luz']);
	await context.close();
});

test('Flujo 5: el valor no se sincroniza entre dispositivos', async ({ browser }) => {
	const { a, b, close: end } = await twoDevices(browser, TODAY);
	await create(a, { title: 'Cambiar foco', kind: 'No se repite' });
	await create(a, { title: 'Pagar la luz', kind: 'No se repite' });
	await complete(a, 'Cambiar foco');
	await listIs(b, ['Pagar la luz']);

	await toggleShowCompleted(a, true);
	await listIs(a, ['Pagar la luz', 'Cambiar foco']);
	await expect(showCompleted(b)).not.toBeChecked();
	await listIs(b, ['Pagar la luz']);
	await b.reload();
	await expect(showCompleted(b)).not.toBeChecked();
	await listIs(b, ['Pagar la luz']);

	await toggleShowCompleted(b, true);
	await listIs(b, ['Pagar la luz', 'Cambiar foco']);
	await waitStatus(b, 'Cambiar foco', 'pendiente', undefined, true);
	await toggleShowCompleted(a, false);
	await listIs(a, ['Pagar la luz']);
	await expect(showCompleted(b)).toBeChecked();
	await listIs(b, ['Pagar la luz', 'Cambiar foco']);
	await end();
});

test('Flujo 6: dos completados de dos dispositivos', async ({ browser }) => {
	const { a, b, ctxB, close: end } = await twoDevices(browser, TODAY);
	await turnOnCompleted(a);
	await create(a, { title: 'Pagar la luz', kind: 'No se repite' });
	await expect(row(b, 'Pagar la luz')).toBeVisible();

	await ctxB.setOffline(true);
	await complete(a, 'Pagar la luz');
	await waitStatus(a, 'Pagar la luz', 'pendiente', undefined, true);
	await arrivesOnServer(a);
	await advance(a, '2026-07-15T08:05:00');
	await advance(b, '2026-07-15T08:05:00');
	await complete(b, 'Pagar la luz');
	await expect(row(b, 'Pagar la luz')).toHaveCount(0);
	await ctxB.setOffline(false);
	await arrivesOnServer(b);

	await goA(a, 'Historial');
	await viewHistory(a, [['Hoy', [['Pagar la luz', '08:05'], ['Pagar la luz', '08:00']]]]);
	await goA(a, 'Pendientes');
	await waitStatus(a, 'Pagar la luz', 'pendiente', undefined, true);

	await complete(a, 'Pagar la luz');
	await waitStatus(a, 'Pagar la luz', 'pendiente', undefined, true);
	await goA(a, 'Historial');
	await viewHistory(a, [['Hoy', [['Pagar la luz', '08:00']]]]);
	await goA(b, 'Historial');
	await viewHistory(b, [['Hoy', [['Pagar la luz', '08:00']]]]);

	await goA(a, 'Pendientes');
	await complete(a, 'Pagar la luz');
	await waitStatus(a, 'Pagar la luz', 'pendiente');
	await goA(a, 'Historial');
	await viewHistory(a, []);
	await viewHistory(b, []);
	await end();
});

test('Flujo 7: periódica completada ayer: el checkbox la completa de nuevo', async ({ page }) => {
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

test('Flujo 8: completado "del futuro"', async ({ browser }) => {
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
