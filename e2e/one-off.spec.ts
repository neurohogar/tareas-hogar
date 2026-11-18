import { expect, test, type Page } from '@playwright/test';
import { advance, complete, createTask, discard, waitStatus, row, cleanEmulators, showCompleted, sessionWithClock } from './support';

const MONDAY = '2026-07-13T08:00:00';
const LIGHT = 'Pagar la luz';
const FOCUS = 'Cambiar foco';

test.beforeEach(async () => {
	await cleanEmulators();
});

async function createOneOff(page: Page, title: string, date?: string) {
	await page.getByRole('button', { name: '+' }).click();
	await page.getByLabel('Título').fill(title);
	await page.getByRole('radio', { name: 'No se repite' }).check();
	if (date) await page.getByLabel('Fecha límite').fill(date);
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
}

test('Flujo 1: selector de tipo en el panel', async ({ page }) => {
	await sessionWithClock(page, MONDAY);
	await page.getByRole('button', { name: '+' }).click();
	const group = page.getByRole('group', { name: 'Se repite' });
	const date = page.getByLabel('Fecha límite');
	const every = page.getByRole('spinbutton', { name: 'Cada' });
	await expect(group.getByRole('radio')).toHaveCount(4);
	for (const n of ['No se repite', 'Intervalo', 'Días de la semana', 'Días del mes'])
		await expect(group.getByRole('radio', { name: n })).toBeVisible();
	await expect(group.getByRole('radio', { name: 'No se repite' })).toBeChecked();
	await group.getByRole('radio', { name: 'Intervalo' }).check();
	await expect(every).toBeVisible();
	await expect(page.getByLabel('Unidad')).toBeVisible();
	await expect(date).toHaveCount(0);

	await group.getByRole('radio', { name: 'No se repite' }).check();
	await expect(date).toBeVisible();
	await expect(date).toHaveValue('');
	await expect(every).toHaveCount(0);
	await expect(page.getByLabel('Unidad')).toHaveCount(0);
	await expect(page.getByRole('group', { name: 'Días de la semana' })).toHaveCount(0);
	await expect(page.getByRole('group', { name: 'Días del mes' })).toHaveCount(0);

	await group.getByRole('radio', { name: 'Días de la semana' }).check();
	await expect(date).toHaveCount(0);
	await expect(page.getByRole('group', { name: 'Días de la semana' }).getByRole('button')).toHaveCount(7);

	await group.getByRole('radio', { name: 'No se repite' }).check();
	await expect(date).toBeVisible();

	await page.getByRole('button', { name: 'Cerrar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(page.getByRole('listitem')).toHaveCount(0);
});

test('Flujo 2: crear con y sin fecha límite', async ({ page }) => {
	await sessionWithClock(page, MONDAY);
	await createOneOff(page, LIGHT, '2026-07-15');
	await waitStatus(page, LIGHT, 'pendiente');
	await createOneOff(page, FOCUS);
	await waitStatus(page, FOCUS, 'pendiente');
	await createOneOff(page, 'Devolver libro', '2026-07-13');
	await waitStatus(page, 'Devolver libro', 'pendiente');
	await createOneOff(page, 'Renovar DNI', '2026-07-10');
	await waitStatus(page, 'Renovar DNI', 'atrasada');
	await page.reload();
	await expect(page.getByRole('listitem')).toHaveCount(4);
	await waitStatus(page, LIGHT, 'pendiente');
	await waitStatus(page, FOCUS, 'pendiente');
	await waitStatus(page, 'Devolver libro', 'pendiente');
	await waitStatus(page, 'Renovar DNI', 'atrasada');
});

test('Flujo 3: validación del panel', async ({ page }) => {
	await sessionWithClock(page, MONDAY);
	const panel = page.getByRole('dialog');
	const title = page.getByLabel('Título');
	const date = page.getByLabel('Fecha límite');
	const save = page.getByRole('button', { name: 'Guardar' });
	const rejected = async () => {
		await expect(title).toHaveAccessibleDescription(/título/i);
		await expect(panel).toBeVisible();
		await expect(page.getByRole('listitem')).toHaveCount(0);
	};
	await page.getByRole('button', { name: '+' }).click();
	await page.getByRole('radio', { name: 'No se repite' }).check();
	await save.click();
	await rejected();
	await title.fill('   ');
	await save.click();
	await rejected();
	await title.fill('');
	await date.fill('2026-07-15');
	await save.click();
	await rejected();

	await title.fill(LIGHT);
	await date.fill('');
	await date.click();
	await page.keyboard.type('1507');
	await save.click();
	await expect(date).toHaveAccessibleDescription(/fecha/i);
	await expect(panel).toBeVisible();
	await expect(page.getByRole('listitem')).toHaveCount(0);

	await discard(page);
	await expect(panel).toHaveCount(0);
	await expect(page.getByRole('listitem')).toHaveCount(0);
});

test('Flujo 4: de pendiente a atrasada al terminar el día límite', async ({ page }) => {
	await sessionWithClock(page, MONDAY);
	await createOneOff(page, LIGHT, '2026-07-15');
	await waitStatus(page, LIGHT, 'pendiente');
	await createOneOff(page, FOCUS);
	await waitStatus(page, FOCUS, 'pendiente');
	await advance(page, '2026-07-15T00:00:00');
	await waitStatus(page, LIGHT, 'pendiente');
	await advance(page, '2026-07-15T23:59:59');
	await waitStatus(page, LIGHT, 'pendiente');
	await advance(page, '2026-07-16T00:00:00');
	await waitStatus(page, LIGHT, 'atrasada');
	await page.reload();
	await waitStatus(page, LIGHT, 'atrasada');
	await advance(page, '2026-09-01T08:00:00');
	await waitStatus(page, LIGHT, 'atrasada');
	await waitStatus(page, FOCUS, 'pendiente');
});

test('Flujo 5: completar saca la tarea de Pendientes', async ({ page }) => {
	await sessionWithClock(page, MONDAY);
	await createOneOff(page, LIGHT, '2026-07-15');
	await createOneOff(page, FOCUS);
	await waitStatus(page, LIGHT, 'pendiente');
	await waitStatus(page, FOCUS, 'pendiente');
	await complete(page, FOCUS);
	await expect(row(page, FOCUS)).toHaveCount(0);
	await waitStatus(page, LIGHT, 'pendiente');
	await advance(page, '2026-07-16T10:00:00');
	await waitStatus(page, LIGHT, 'atrasada');
	await complete(page, LIGHT);
	await expect(page.getByRole('listitem')).toHaveCount(0);
	await page.reload();
	await expect(page.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
	await expect(page.getByRole('listitem')).toHaveCount(0);
	await advance(page, '2026-08-01T00:00:00');
	await expect(page.getByRole('listitem')).toHaveCount(0);
});

test('Flujo 6: persistencia entre sesiones', async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await sessionWithClock(page, MONDAY);
	await createOneOff(page, LIGHT, '2026-07-15');
	await createOneOff(page, FOCUS);
	await waitStatus(page, LIGHT, 'pendiente');
	await waitStatus(page, FOCUS, 'pendiente');

	const openTask = async (p: Page) => {
		await p.clock.install({ time: new Date('2026-07-16T00:00:00') });
		await p.goto('/');
		await expect(p.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
		await expect(p.getByRole('button', { name: 'Entrar con Google' })).toHaveCount(0);
	};
	await page.close();
	const second = await context.newPage();
	await openTask(second);
	await waitStatus(second, LIGHT, 'atrasada');
	await waitStatus(second, FOCUS, 'pendiente');
	await complete(second, LIGHT);
	await expect(row(second, LIGHT)).toHaveCount(0);

	await second.close();
	const third = await context.newPage();
	await openTask(third);
	await expect(third.getByRole('listitem')).toHaveCount(1);
	await waitStatus(third, FOCUS, 'pendiente');
	await context.close();
});

test('Flujo 7: las periódicas se siguen creando con el nuevo selector', async ({ page }) => {
	await sessionWithClock(page, MONDAY);
	await createTask(page, 'Ventilar', '4', 'horas');
	await waitStatus(page, 'Ventilar', 'pendiente');
	await complete(page, 'Ventilar');
	await expect(showCompleted(page)).not.toBeChecked();
	await expect(row(page, 'Ventilar')).toHaveCount(0);

	const junk = 'Sacar la basura';
	await page.getByRole('button', { name: '+' }).click();
	await page.getByLabel('Título').fill(junk);
	await page.getByRole('radio', { name: 'No se repite' }).check();
	await page.getByLabel('Fecha límite').fill('2026-07-14');
	await page.getByRole('radio', { name: 'Días de la semana' }).check();
	await page.getByRole('button', { name: 'martes' }).click();
	await page.getByRole('button', { name: 'jueves' }).click();
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await waitStatus(page, junk, 'en espera', 0, false);

	await advance(page, '2026-07-14T00:00:00');
	await waitStatus(page, junk, 'pendiente');
	await waitStatus(page, 'Ventilar', 'atrasada');
	await advance(page, '2026-07-15T00:00:00');
	await waitStatus(page, junk, 'atrasada');

	await page.getByRole('button', { name: '+' }).click();
	await page.getByLabel('Título').fill('Pagar expensas');
	await page.getByRole('radio', { name: 'Días del mes' }).check();
	await page.getByRole('button', { name: '20', exact: true }).click();
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await waitStatus(page, 'Pagar expensas', 'en espera', 0, false);

	await page.reload();
	await waitStatus(page, junk, 'atrasada');
	await waitStatus(page, 'Ventilar', 'atrasada');
	await waitStatus(page, 'Pagar expensas', 'en espera', 0, false);
});
