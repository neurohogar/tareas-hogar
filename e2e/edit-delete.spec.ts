import { expect, test, type Browser } from '@playwright/test';
import {
	WEEK,
	openTask,
	advance,
	remove,
	close,
	discard,
	complete,
	completePanel,
	toggleShowCompleted,
	create,
	twoDevices as dosSinCompletadas,
	listIs,
	edit,
	turnOnCompleted,
	waitStatus,
	row,
	cleanEmulators,
	arrivesOnServer,
	sessionWithClock as sesionSinCompletadas,
	verifyDays
} from './support';

const MONDAY = '2026-07-13T08:00:00';

/** At the start of every flow Mostrar completadas is turned on (on A and on B in the two-device flows). */
async function sessionWithClock(page: Parameters<typeof turnOnCompleted>[0], hour: string) {
	await sesionSinCompletadas(page, hour);
	await turnOnCompleted(page);
}

async function twoDevices(browser: Browser, hour?: string) {
	const d = await dosSinCompletadas(browser, hour);
	await turnOnCompleted(d.a);
	await turnOnCompleted(d.b);
	return d;
}

test.beforeEach(async () => {
	await cleanEmulators();
});

test('Flujo 1: abrir el panel de edición con los valores de la tarea', async ({ page }) => {
	await sessionWithClock(page, MONDAY);
	await page.getByRole('button', { name: '+' }).click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Borrar tarea' })).toHaveCount(0);
	await close(page);

	await create(page, { title: 'Pagar la luz', kind: 'No se repite', date: '2026-07-15' });
	await create(page, { title: 'Cambiar foco', kind: 'No se repite' });
	await create(page, { title: 'Regar plantas', kind: 'Intervalo', every: '2', unit: 'días' });
	await create(page, { title: 'Sacar la basura', kind: 'Días de la semana', days: ['martes', 'jueves'] });
	await create(page, { title: 'Pagar expensas', kind: 'Días del mes', days: ['10', '31'] });

	await openTask(page, 'Pagar la luz');
	await expect(page.getByLabel('Título')).toHaveValue('Pagar la luz');
	await expect(page.getByRole('radio', { name: 'No se repite' })).toBeChecked();
	await expect(page.getByLabel('Fecha límite')).toHaveValue('2026-07-15');
	for (const b of ['Cerrar', 'Guardar', 'Borrar tarea'])
		await expect(page.getByRole('button', { name: b })).toBeVisible();
	await close(page);

	await openTask(page, 'Cambiar foco');
	await expect(page.getByRole('radio', { name: 'No se repite' })).toBeChecked();
	await expect(page.getByLabel('Fecha límite')).toHaveValue('');
	await close(page);

	await openTask(page, 'Regar plantas');
	await expect(page.getByRole('radio', { name: 'Intervalo' })).toBeChecked();
	await expect(page.getByRole('spinbutton', { name: 'Cada' })).toHaveValue('2');
	await expect(page.getByLabel('Unidad')).toHaveValue('dias');
	await expect(page.getByLabel('Unidad').locator('option:checked')).toHaveText('días');
	await close(page);

	await openTask(page, 'Sacar la basura');
	await expect(page.getByRole('radio', { name: 'Días de la semana' })).toBeChecked();
	await verifyDays(page, 'Días de la semana', ['martes', 'jueves'], WEEK);
	await close(page);

	await openTask(page, 'Pagar expensas');
	await expect(page.getByRole('radio', { name: 'Días del mes' })).toBeChecked();
	await verifyDays(page, 'Días del mes', ['10', '31'], Array.from({ length: 31 }, (_, i) => String(i + 1)));
	await close(page);

	await complete(page, 'Regar plantas');
	await waitStatus(page, 'Regar plantas', 'en espera');
	await expect(page.getByRole('dialog')).toHaveCount(0);

	await expect(page.getByRole('listitem')).toHaveCount(5);
	await waitStatus(page, 'Pagar la luz', 'pendiente');
	await waitStatus(page, 'Cambiar foco', 'pendiente');
	await waitStatus(page, 'Sacar la basura', 'en espera', undefined, false);
	await waitStatus(page, 'Pagar expensas', 'en espera', undefined, false);
});

test('Flujo 2: editar el título y cerrar sin guardar', async ({ page }) => {
	await sessionWithClock(page, MONDAY);
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await edit(page, 'Regar', { title: 'Regar plantas' });
	await waitStatus(page, 'Regar plantas', 'pendiente');
	await page.reload();
	await waitStatus(page, 'Regar plantas', 'pendiente');

	await openTask(page, 'Regar plantas');
	await completePanel(page, { title: 'Otra cosa', every: '5' });
	await discard(page);
	await waitStatus(page, 'Regar plantas', 'pendiente');
	await expect(page.getByRole('listitem')).toHaveCount(1);

	await openTask(page, 'Regar plantas');
	await expect(page.getByLabel('Título')).toHaveValue('Regar plantas');
	await expect(page.getByRole('spinbutton', { name: 'Cada' })).toHaveValue('2');
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await waitStatus(page, 'Regar plantas', 'pendiente');
});

test('Flujo 3: validación al editar', async ({ page }) => {
	await sessionWithClock(page, MONDAY);
	await create(page, { title: 'Sacar la basura', kind: 'Días de la semana', days: ['martes', 'jueves'] });
	await openTask(page, 'Sacar la basura');
	const title = page.getByLabel('Título');
	const save = page.getByRole('button', { name: 'Guardar' });
	const opened = () => expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();

	await title.fill('');
	await save.click();
	await expect(title).toHaveAccessibleDescription(/título/i);
	await opened();

	await title.fill('   ');
	await save.click();
	await expect(title).toHaveAccessibleDescription(/título/i);
	await opened();

	await title.fill('Basura');
	await page.getByRole('button', { name: 'martes' }).click();
	await page.getByRole('button', { name: 'jueves' }).click();
	await save.click();
	await expect(page.getByRole('group', { name: 'Días de la semana' })).toHaveAccessibleDescription(/al menos un día/i);
	await opened();

	await page.getByRole('radio', { name: 'Intervalo' }).check();
	await page.getByRole('spinbutton', { name: 'Cada' }).fill('0');
	await save.click();
	await expect(page.getByRole('spinbutton', { name: 'Cada' })).toHaveAccessibleDescription(/entero/i);
	await opened();

	await page.getByRole('radio', { name: 'No se repite' }).check();
	const date = page.getByLabel('Fecha límite');
	await date.click();
	await page.keyboard.type('1507');
	await save.click();
	await expect(date).toHaveAccessibleDescription(/fecha/i);
	await opened();

	await discard(page);
	await waitStatus(page, 'Sacar la basura', 'en espera', undefined, false);
	await openTask(page, 'Sacar la basura');
	await expect(page.getByLabel('Título')).toHaveValue('Sacar la basura');
	await expect(page.getByRole('radio', { name: 'Días de la semana' })).toBeChecked();
	await verifyDays(page, 'Días de la semana', ['martes', 'jueves'], WEEK);
});

test('Flujo 4: editar la fecha límite de una puntual', async ({ page }) => {
	await sessionWithClock(page, '2026-07-15T10:00:00');
	await create(page, { title: 'Pagar la luz', kind: 'No se repite', date: '2026-07-14' });
	await waitStatus(page, 'Pagar la luz', 'atrasada');
	await edit(page, 'Pagar la luz', { date: '2026-07-20' });
	await waitStatus(page, 'Pagar la luz', 'pendiente');
	await edit(page, 'Pagar la luz', { date: '' });
	await waitStatus(page, 'Pagar la luz', 'pendiente');
	await edit(page, 'Pagar la luz', { date: '2026-07-15' });
	await waitStatus(page, 'Pagar la luz', 'pendiente');
	await advance(page, '2026-07-16T00:00:00');
	await waitStatus(page, 'Pagar la luz', 'atrasada');
	await page.reload();
	await waitStatus(page, 'Pagar la luz', 'atrasada');
});

test('Flujo 5: editar el intervalo de una relativa completada', async ({ page }) => {
	await sessionWithClock(page, '2026-07-15T08:00:00');
	await create(page, { title: 'Ventilar', kind: 'Intervalo', every: '4', unit: 'horas' });
	await complete(page, 'Ventilar');
	await waitStatus(page, 'Ventilar', 'en espera', 0);
	await advance(page, '2026-07-15T20:00:00');
	await waitStatus(page, 'Ventilar', 'atrasada');
	await edit(page, 'Ventilar', { every: '2', unit: 'días' });
	await waitStatus(page, 'Ventilar', 'en espera', 25);
	await edit(page, 'Ventilar', { every: '12', unit: 'horas' });
	await waitStatus(page, 'Ventilar', 'pendiente');
	await edit(page, 'Ventilar', { every: '4', unit: 'horas' });
	await waitStatus(page, 'Ventilar', 'atrasada');
});

test('Flujo 6: cambiar los días de una semanal completada', async ({ page }) => {
	const B = 'Sacar la basura';
	await sessionWithClock(page, '2026-07-14T08:00:00');
	await create(page, { title: B, kind: 'Días de la semana', days: ['martes', 'jueves'] });
	await waitStatus(page, B, 'pendiente');
	await advance(page, '2026-07-14T12:00:00');
	await complete(page, B);
	await waitStatus(page, B, 'en espera', 0);
	await advance(page, '2026-07-16T06:00:00');
	await waitStatus(page, B, 'pendiente');
	await edit(page, B, { days: ['sábado'] });
	await waitStatus(page, B, 'en espera', 50);
	await edit(page, B, { days: ['miércoles'] });
	await waitStatus(page, B, 'atrasada');
	await edit(page, B, { kind: 'Días del mes', days: ['16'] });
	await waitStatus(page, B, 'pendiente');
	await page.reload();
	await waitStatus(page, B, 'pendiente');
	await openTask(page, B);
	await expect(page.getByRole('radio', { name: 'Días del mes' })).toBeChecked();
	await verifyDays(page, 'Días del mes', ['16'], Array.from({ length: 31 }, (_, i) => String(i + 1)));
});

test('Flujo 7: cambiar de tipo y de modo', async ({ page }) => {
	await sessionWithClock(page, '2026-07-13T10:00:00');
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '1', unit: 'días' });
	await complete(page, 'Regar');
	await waitStatus(page, 'Regar', 'en espera');
	await create(page, { title: 'Renovar DNI', kind: 'No se repite', date: '2026-07-10' });
	await waitStatus(page, 'Renovar DNI', 'atrasada');
	await create(page, { title: 'Limpiar horno', kind: 'Intervalo', every: '3', unit: 'días' });
	await waitStatus(page, 'Limpiar horno', 'pendiente');
	await create(page, { title: 'Barrer', kind: 'Intervalo', every: '2', unit: 'días' });
	await complete(page, 'Barrer');
	await waitStatus(page, 'Barrer', 'en espera');
	await advance(page, '2026-07-14T09:00:00');
	await waitStatus(page, 'Regar', 'en espera');

	await edit(page, 'Regar', { kind: 'Días de la semana', days: ['martes', 'jueves'] });
	await waitStatus(page, 'Regar', 'pendiente');
	await complete(page, 'Regar');
	await waitStatus(page, 'Regar', 'en espera');
	await edit(page, 'Renovar DNI', { kind: 'Intervalo', every: '2', unit: 'días' });
	await waitStatus(page, 'Renovar DNI', 'pendiente');
	await edit(page, 'Limpiar horno', { kind: 'No se repite', date: '2026-07-13' });
	await waitStatus(page, 'Limpiar horno', 'atrasada');
	await edit(page, 'Barrer', { kind: 'No se repite' });
	await waitStatus(page, 'Barrer', 'pendiente', undefined, true);

	await page.reload();
	await listIs(page, ['Limpiar horno', 'Renovar DNI', 'Regar', 'Barrer']);
	await waitStatus(page, 'Limpiar horno', 'atrasada');
	await waitStatus(page, 'Renovar DNI', 'pendiente');
	await waitStatus(page, 'Regar', 'en espera');
	await waitStatus(page, 'Barrer', 'pendiente', undefined, true);

	await toggleShowCompleted(page, false);
	await listIs(page, ['Limpiar horno', 'Renovar DNI']);
});

test('Flujo 8: editar cambia el orden', async ({ page }) => {
	await sessionWithClock(page, '2026-07-15T06:00:00');
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '4', unit: 'horas' });
	await complete(page, 'Regar');
	await advance(page, '2026-07-15T06:01:00');
	await create(page, { title: 'Pagar', kind: 'No se repite', date: '2026-07-14' });
	await advance(page, '2026-07-15T12:00:00');
	const order = (t: string[]) => expect(page.getByRole('listitem')).toHaveText(t.map((x) => new RegExp(x)));
	await order(['Pagar', 'Regar']);
	await waitStatus(page, 'Pagar', 'atrasada');
	await waitStatus(page, 'Regar', 'pendiente');
	await edit(page, 'Pagar', { date: '2026-07-20' });
	await order(['Regar', 'Pagar']);
	await waitStatus(page, 'Regar', 'pendiente');
	await waitStatus(page, 'Pagar', 'pendiente');
	await edit(page, 'Pagar', { date: '2026-07-14' });
	await order(['Pagar', 'Regar']);
});

test('Flujo 9: borrar una tarea', async ({ page }) => {
	await sessionWithClock(page, MONDAY);
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await complete(page, 'Regar');
	await create(page, { title: 'Pagar la luz', kind: 'No se repite' });

	await openTask(page, 'Regar');
	await page.getByRole('button', { name: 'Borrar tarea' }).click();
	const confirmation = page.getByRole('alertdialog');
	await expect(confirmation).toBeVisible();
	await expect(confirmation).toContainText('Regar');
	await expect(confirmation.getByRole('button', { name: 'Borrar', exact: true })).toBeVisible();
	await expect(confirmation.getByRole('button', { name: 'Cancelar' })).toBeVisible();
	await confirmation.getByRole('button', { name: 'Cancelar' }).click();
	await expect(confirmation).toHaveCount(0);
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await expect(page.getByLabel('Título')).toHaveValue('Regar');
	await close(page);
	await waitStatus(page, 'Regar', 'en espera');

	await remove(page, 'Regar');
	await expect(row(page, 'Regar')).toHaveCount(0);
	await waitStatus(page, 'Pagar la luz', 'pendiente');
	await page.reload();
	await expect(page.getByRole('listitem')).toHaveCount(1);
	await waitStatus(page, 'Pagar la luz', 'pendiente');

	await remove(page, 'Pagar la luz');
	await expect(page.getByRole('listitem')).toHaveCount(0);
	await page.reload();
	await expect(page.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
	await expect(page.getByRole('listitem')).toHaveCount(0);
});

test('Flujo 10: dos dispositivos editan campos distintos', async ({ browser }) => {
	const { a, b, ctxB, close: end } = await twoDevices(browser);
	await create(a, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await waitStatus(b, 'Regar', 'pendiente');
	await ctxB.setOffline(true);
	await edit(b, 'Regar', { kind: 'Días de la semana', days: ['martes', 'jueves'] });
	await edit(a, 'Regar', { title: 'Regar plantas' });
	await arrivesOnServer(a);
	await ctxB.setOffline(false);
	for (const p of [a, b]) await waitStatus(p, 'Regar plantas', 'en espera', undefined, false);
	await openTask(a, 'Regar plantas');
	await expect(a.getByRole('radio', { name: 'Días de la semana' })).toBeChecked();
	await verifyDays(a, 'Días de la semana', ['martes', 'jueves'], WEEK);
	await end();
});

test('Flujo 11: el mismo campo, gana el último en llegar', async ({ browser }) => {
	const { a, b, ctxB, close: end } = await twoDevices(browser);
	await create(a, { title: 'Pagar', kind: 'No se repite' });
	await waitStatus(b, 'Pagar', 'pendiente');
	await ctxB.setOffline(true);
	await edit(b, 'Pagar', { title: 'Pagar el gas' });
	await edit(a, 'Pagar', { title: 'Pagar la luz' });
	await arrivesOnServer(a);
	await ctxB.setOffline(false);
	for (const p of [a, b]) {
		await waitStatus(p, 'Pagar el gas', 'pendiente');
		await expect(p.getByRole('listitem')).toHaveCount(1);
	}
	await end();
});

test('Flujo 12: gana el borrado', async ({ browser }) => {
	const { a, b, ctxB, close: end } = await twoDevices(browser);
	await create(a, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await create(a, { title: 'Barrer', kind: 'Intervalo', every: '1', unit: 'días' });
	await waitStatus(b, 'Regar', 'pendiente');
	await waitStatus(b, 'Barrer', 'pendiente');
	await ctxB.setOffline(true);
	await edit(b, 'Regar', { title: 'Regar plantas' });
	await complete(b, 'Barrer');
	await waitStatus(b, 'Barrer', 'en espera');
	await remove(a, 'Regar');
	await remove(a, 'Barrer');
	await arrivesOnServer(a);
	await ctxB.setOffline(false);
	for (const p of [a, b]) await expect(p.getByRole('listitem')).toHaveCount(0);
	for (const p of [a, b]) {
		await p.reload();
		await expect(p.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
		await expect(p.getByRole('listitem')).toHaveCount(0);
	}
	await end();
});

test('Flujo 13: la tarea se borra mientras está abierta en el otro dispositivo', async ({ browser }) => {
	const { a, b, close: end } = await twoDevices(browser);
	await create(a, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await waitStatus(b, 'Regar', 'pendiente');
	await openTask(b, 'Regar');
	await remove(a, 'Regar');
	await expect(b.getByRole('dialog')).toHaveCount(0);
	await expect(row(b, 'Regar')).toHaveCount(0);
	await end();
});

test('Flujo 14: cambiar de tipo no deja un valor residual de otro dispositivo', async ({ browser }) => {
	const { a, b, ctxB, close: end } = await twoDevices(browser);
	const DNI = 'Renovar DNI';
	await create(a, { title: DNI, kind: 'No se repite', date: '2026-07-20' });
	await waitStatus(a, DNI, 'pendiente');
	await waitStatus(b, DNI, 'pendiente');
	await ctxB.setOffline(true);
	await edit(b, DNI, { date: '2026-07-10' });
	await edit(a, DNI, { kind: 'Intervalo', every: '2', unit: 'días' });
	await arrivesOnServer(a);
	await ctxB.setOffline(false);
	for (const p of [a, b]) await waitStatus(p, DNI, 'pendiente');
	await edit(a, DNI, { kind: 'No se repite', date: '' });
	for (const p of [a, b]) await waitStatus(p, DNI, 'pendiente');
	await openTask(a, DNI);
	await expect(a.getByRole('radio', { name: 'No se repite' })).toBeChecked();
	await expect(a.getByLabel('Fecha límite')).toHaveValue('');
	await close(a);
	for (const p of [a, b]) {
		await p.reload();
		await waitStatus(p, DNI, 'pendiente');
	}

	// Mirror
	await create(a, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await waitStatus(b, 'Regar', 'pendiente');
	await ctxB.setOffline(true);
	await edit(b, 'Regar', { every: '6', unit: 'horas' });
	await edit(a, 'Regar', { kind: 'No se repite', date: '2026-07-20' });
	await arrivesOnServer(a);
	await ctxB.setOffline(false);
	for (const p of [a, b]) await waitStatus(p, 'Regar', 'pendiente');
	await edit(a, 'Regar', { kind: 'Días de la semana', days: ['martes', 'jueves'] });
	for (const p of [a, b]) await waitStatus(p, 'Regar', 'en espera', undefined, false);
	for (const p of [a, b]) {
		await p.reload();
		await expect(row(p, 'Regar')).toHaveCount(1);
	}
	await openTask(b, 'Regar');
	await expect(b.getByRole('radio', { name: 'Días de la semana' })).toBeChecked();
	await verifyDays(b, 'Días de la semana', ['martes', 'jueves'], WEEK);
	await end();
});
