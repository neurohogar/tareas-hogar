import { expect, test, type Page } from '@playwright/test';
import { advance, waitStatus, row, cleanEmulators, listIs, sessionWithClock } from './support';

test.beforeEach(async () => {
	await cleanEmulators();
});

type Kind = { oneOff?: string | null } | { every: string; unit: 'horas' | 'días' } | { days: string[]; month?: boolean };

async function create(page: Page, title: string, kind: Kind) {
	await page.getByRole('button', { name: '+' }).click();
	await page.getByLabel('Título').fill(title);
	if ('every' in kind) {
		await page.getByRole('radio', { name: 'Intervalo' }).check();
		await page.getByRole('spinbutton', { name: 'Cada' }).fill(kind.every);
		await page.getByLabel('Unidad').selectOption({ label: kind.unit });
	} else if ('days' in kind) {
		await page.getByRole('radio', { name: kind.month ? 'Días del mes' : 'Días de la semana' }).check();
		for (const d of kind.days) await page.getByRole('button', { name: d, exact: true }).click();
	} else {
		await page.getByRole('radio', { name: 'No se repite' }).check();
		if (kind.oneOff) await page.getByLabel('Fecha límite').fill(kind.oneOff);
	}
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
}

const withoutDate: Kind = { oneOff: null };
const complete = (page: Page, title: string) => row(page, title).getByRole('checkbox').click();

test('Flujo 1: tres grupos y orden en vivo', async ({ page }) => {
	await sessionWithClock(page, '2026-07-13T08:00:00');
	await create(page, 'Regar plantas', { every: '4', unit: 'horas' });
	await advance(page, '2026-07-13T08:01:00');
	await create(page, 'Pagar la luz', { oneOff: '2026-07-14' });
	await advance(page, '2026-07-13T08:02:00');
	await create(page, 'Sacar la basura', { days: ['martes', 'jueves'] });
	await advance(page, '2026-07-13T08:03:00');
	await create(page, 'Cambiar foco', withoutDate);
	await listIs(page, ['Regar plantas', 'Pagar la luz', 'Cambiar foco', 'Sacar la basura']);
	for (const t of ['Regar plantas', 'Pagar la luz', 'Cambiar foco']) await waitStatus(page, t, 'pendiente');
	await waitStatus(page, 'Sacar la basura', 'en espera', 0, false);

	await advance(page, '2026-07-13T08:04:00');
	await complete(page, 'Regar plantas');
	await listIs(page, ['Pagar la luz', 'Cambiar foco', 'Sacar la basura']);

	await advance(page, '2026-07-13T12:04:00');
	await waitStatus(page, 'Regar plantas', 'pendiente');
	await listIs(page, ['Regar plantas', 'Pagar la luz', 'Cambiar foco', 'Sacar la basura']);

	await advance(page, '2026-07-14T00:00:00');
	await waitStatus(page, 'Regar plantas', 'atrasada');
	await waitStatus(page, 'Pagar la luz', 'pendiente');
	await waitStatus(page, 'Sacar la basura', 'pendiente');
	await listIs(page, ['Regar plantas', 'Pagar la luz', 'Sacar la basura', 'Cambiar foco']);

	await advance(page, '2026-07-15T00:00:00');
	await waitStatus(page, 'Pagar la luz', 'atrasada');
	await waitStatus(page, 'Sacar la basura', 'atrasada');
	await listIs(page, ['Regar plantas', 'Pagar la luz', 'Sacar la basura', 'Cambiar foco']);

	await page.reload();
	await listIs(page, ['Regar plantas', 'Pagar la luz', 'Sacar la basura', 'Cambiar foco']);
	await waitStatus(page, 'Regar plantas', 'atrasada');
	await waitStatus(page, 'Pagar la luz', 'atrasada');
	await waitStatus(page, 'Sacar la basura', 'atrasada');
	await waitStatus(page, 'Cambiar foco', 'pendiente');
});

test('Flujo 2: atrasadas por el tiempo que llevan atrasadas', async ({ page }) => {
	await sessionWithClock(page, '2026-07-13T08:00:00');
	await create(page, 'Regar plantas', { every: '1', unit: 'días' });
	await complete(page, 'Regar plantas');
	await advance(page, '2026-07-13T08:01:00');
	await create(page, 'Pagar la luz', { oneOff: '2026-07-14' });
	await advance(page, '2026-07-13T08:02:00');
	await create(page, 'Sacar la basura', { days: ['lunes'] });
	await advance(page, '2026-07-16T12:00:00');
	for (const t of ['Sacar la basura', 'Pagar la luz', 'Regar plantas']) await waitStatus(page, t, 'atrasada');
	await listIs(page, ['Sacar la basura', 'Pagar la luz', 'Regar plantas']);
	await page.reload();
	await listIs(page, ['Sacar la basura', 'Pagar la luz', 'Regar plantas']);
});

test('Flujo 3: pendientes por el momento desde el que están pendientes', async ({ page }) => {
	await sessionWithClock(page, '2026-07-15T08:00:00');
	await create(page, 'Cambiar foco', withoutDate);
	await advance(page, '2026-07-15T08:01:00');
	await create(page, 'Llamar plomero', withoutDate);
	await advance(page, '2026-07-15T08:02:00');
	await create(page, 'Comprar regalo', { oneOff: '2026-07-16' });
	await advance(page, '2026-07-15T08:03:00');
	await create(page, 'Ventilar', { every: '4', unit: 'horas' });
	await advance(page, '2026-07-15T08:04:00');
	await create(page, 'Pagar la luz', { oneOff: '2026-07-15' });
	for (const t of ['Pagar la luz', 'Ventilar', 'Comprar regalo', 'Cambiar foco', 'Llamar plomero'])
		await waitStatus(page, t, 'pendiente');
	await listIs(page, ['Pagar la luz', 'Ventilar', 'Comprar regalo', 'Cambiar foco', 'Llamar plomero']);

	await advance(page, '2026-07-15T08:05:00');
	await complete(page, 'Ventilar');
	await listIs(page, ['Pagar la luz', 'Comprar regalo', 'Cambiar foco', 'Llamar plomero']);

	await advance(page, '2026-07-15T12:05:00');
	await waitStatus(page, 'Ventilar', 'pendiente');
	await listIs(page, ['Pagar la luz', 'Ventilar', 'Comprar regalo', 'Cambiar foco', 'Llamar plomero']);
});

test('Flujo 4: en espera por cuándo vuelven', async ({ page }) => {
	await sessionWithClock(page, '2026-07-15T08:00:00');
	await create(page, 'Cambiar sábanas', { days: ['sábado'] });
	await advance(page, '2026-07-15T08:01:00');
	await create(page, 'Limpiar heladera', { days: ['17'], month: true });
	await advance(page, '2026-07-15T08:02:00');
	await create(page, 'Sacar la basura', { days: ['martes', 'jueves'] });
	await advance(page, '2026-07-15T08:03:00');
	await create(page, 'Cambiar foco', withoutDate);
	for (const t of ['Sacar la basura', 'Limpiar heladera', 'Cambiar sábanas']) await waitStatus(page, t, 'en espera', undefined, false);
	await waitStatus(page, 'Cambiar foco', 'pendiente');
	await listIs(page, ['Cambiar foco', 'Sacar la basura', 'Limpiar heladera', 'Cambiar sábanas']);

	await advance(page, '2026-07-16T00:00:00');
	await waitStatus(page, 'Sacar la basura', 'pendiente');
	await listIs(page, ['Sacar la basura', 'Cambiar foco', 'Limpiar heladera', 'Cambiar sábanas']);

	await advance(page, '2026-07-16T08:00:00');
	await complete(page, 'Sacar la basura');
	await listIs(page, ['Cambiar foco', 'Limpiar heladera', 'Cambiar sábanas']);
	await page.reload();
	await listIs(page, ['Cambiar foco', 'Limpiar heladera', 'Cambiar sábanas']);
});

test('Flujo 5: desempate por título', async ({ page }) => {
	await sessionWithClock(page, '2026-07-15T08:00:00');
	await page.clock.setFixedTime(new Date('2026-07-15T08:00:00'));
	for (const t of ['Zapallo', 'Ñoquis', 'Barrer', 'Nueces', 'Árbol', 'acelga']) await create(page, t, withoutDate);
	const order = ['acelga', 'Árbol', 'Barrer', 'Nueces', 'Ñoquis', 'Zapallo'];
	for (const t of order) await waitStatus(page, t, 'pendiente');
	await listIs(page, order);
	await page.reload();
	await listIs(page, order);
});
