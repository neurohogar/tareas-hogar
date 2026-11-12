import { expect, test, type Page } from '@playwright/test';
import { adelantar, esperarEstado, fila, limpiarEmuladores, listaEs, sesionConReloj } from './apoyo';

test.beforeEach(async () => {
	await limpiarEmuladores();
});

type Tipo = { puntual?: string | null } | { cada: string; unidad: 'horas' | 'días' } | { dias: string[]; mes?: boolean };

async function crear(page: Page, titulo: string, tipo: Tipo) {
	await page.getByRole('button', { name: '+' }).click();
	await page.getByLabel('Título').fill(titulo);
	if ('cada' in tipo) {
		await page.getByRole('radio', { name: 'Intervalo' }).check();
		await page.getByRole('spinbutton', { name: 'Cada' }).fill(tipo.cada);
		await page.getByLabel('Unidad').selectOption({ label: tipo.unidad });
	} else if ('dias' in tipo) {
		await page.getByRole('radio', { name: tipo.mes ? 'Días del mes' : 'Días de la semana' }).check();
		for (const d of tipo.dias) await page.getByRole('button', { name: d, exact: true }).click();
	} else {
		await page.getByRole('radio', { name: 'No se repite' }).check();
		if (tipo.puntual) await page.getByLabel('Fecha límite').fill(tipo.puntual);
	}
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
}

const sinFecha: Tipo = { puntual: null };
const completar = (page: Page, titulo: string) => fila(page, titulo).getByRole('checkbox').click();

test('Flujo 1: tres grupos y orden en vivo', async ({ page }) => {
	await sesionConReloj(page, '2026-07-13T08:00:00');
	await crear(page, 'Regar plantas', { cada: '4', unidad: 'horas' });
	await adelantar(page, '2026-07-13T08:01:00');
	await crear(page, 'Pagar la luz', { puntual: '2026-07-14' });
	await adelantar(page, '2026-07-13T08:02:00');
	await crear(page, 'Sacar la basura', { dias: ['martes', 'jueves'] });
	await adelantar(page, '2026-07-13T08:03:00');
	await crear(page, 'Cambiar foco', sinFecha);
	await listaEs(page, ['Regar plantas', 'Pagar la luz', 'Cambiar foco', 'Sacar la basura']);
	for (const t of ['Regar plantas', 'Pagar la luz', 'Cambiar foco']) await esperarEstado(page, t, 'pendiente');
	await esperarEstado(page, 'Sacar la basura', 'en espera', 0, false);

	await adelantar(page, '2026-07-13T08:04:00');
	await completar(page, 'Regar plantas');
	await listaEs(page, ['Pagar la luz', 'Cambiar foco', 'Sacar la basura']);

	await adelantar(page, '2026-07-13T12:04:00');
	await esperarEstado(page, 'Regar plantas', 'pendiente');
	await listaEs(page, ['Regar plantas', 'Pagar la luz', 'Cambiar foco', 'Sacar la basura']);

	await adelantar(page, '2026-07-14T00:00:00');
	await esperarEstado(page, 'Regar plantas', 'atrasada');
	await esperarEstado(page, 'Pagar la luz', 'pendiente');
	await esperarEstado(page, 'Sacar la basura', 'pendiente');
	await listaEs(page, ['Regar plantas', 'Pagar la luz', 'Sacar la basura', 'Cambiar foco']);

	await adelantar(page, '2026-07-15T00:00:00');
	await esperarEstado(page, 'Pagar la luz', 'atrasada');
	await esperarEstado(page, 'Sacar la basura', 'atrasada');
	await listaEs(page, ['Regar plantas', 'Pagar la luz', 'Sacar la basura', 'Cambiar foco']);

	await page.reload();
	await listaEs(page, ['Regar plantas', 'Pagar la luz', 'Sacar la basura', 'Cambiar foco']);
	await esperarEstado(page, 'Regar plantas', 'atrasada');
	await esperarEstado(page, 'Pagar la luz', 'atrasada');
	await esperarEstado(page, 'Sacar la basura', 'atrasada');
	await esperarEstado(page, 'Cambiar foco', 'pendiente');
});

test('Flujo 2: atrasadas por el tiempo que llevan atrasadas', async ({ page }) => {
	await sesionConReloj(page, '2026-07-13T08:00:00');
	await crear(page, 'Regar plantas', { cada: '1', unidad: 'días' });
	await completar(page, 'Regar plantas');
	await adelantar(page, '2026-07-13T08:01:00');
	await crear(page, 'Pagar la luz', { puntual: '2026-07-14' });
	await adelantar(page, '2026-07-13T08:02:00');
	await crear(page, 'Sacar la basura', { dias: ['lunes'] });
	await adelantar(page, '2026-07-16T12:00:00');
	for (const t of ['Sacar la basura', 'Pagar la luz', 'Regar plantas']) await esperarEstado(page, t, 'atrasada');
	await listaEs(page, ['Sacar la basura', 'Pagar la luz', 'Regar plantas']);
	await page.reload();
	await listaEs(page, ['Sacar la basura', 'Pagar la luz', 'Regar plantas']);
});

test('Flujo 3: pendientes por el momento desde el que están pendientes', async ({ page }) => {
	await sesionConReloj(page, '2026-07-15T08:00:00');
	await crear(page, 'Cambiar foco', sinFecha);
	await adelantar(page, '2026-07-15T08:01:00');
	await crear(page, 'Llamar plomero', sinFecha);
	await adelantar(page, '2026-07-15T08:02:00');
	await crear(page, 'Comprar regalo', { puntual: '2026-07-16' });
	await adelantar(page, '2026-07-15T08:03:00');
	await crear(page, 'Ventilar', { cada: '4', unidad: 'horas' });
	await adelantar(page, '2026-07-15T08:04:00');
	await crear(page, 'Pagar la luz', { puntual: '2026-07-15' });
	for (const t of ['Pagar la luz', 'Ventilar', 'Comprar regalo', 'Cambiar foco', 'Llamar plomero'])
		await esperarEstado(page, t, 'pendiente');
	await listaEs(page, ['Pagar la luz', 'Ventilar', 'Comprar regalo', 'Cambiar foco', 'Llamar plomero']);

	await adelantar(page, '2026-07-15T08:05:00');
	await completar(page, 'Ventilar');
	await listaEs(page, ['Pagar la luz', 'Comprar regalo', 'Cambiar foco', 'Llamar plomero']);

	await adelantar(page, '2026-07-15T12:05:00');
	await esperarEstado(page, 'Ventilar', 'pendiente');
	await listaEs(page, ['Pagar la luz', 'Ventilar', 'Comprar regalo', 'Cambiar foco', 'Llamar plomero']);
});

test('Flujo 4: en espera por cuándo vuelven', async ({ page }) => {
	await sesionConReloj(page, '2026-07-15T08:00:00');
	await crear(page, 'Cambiar sábanas', { dias: ['sábado'] });
	await adelantar(page, '2026-07-15T08:01:00');
	await crear(page, 'Limpiar heladera', { dias: ['17'], mes: true });
	await adelantar(page, '2026-07-15T08:02:00');
	await crear(page, 'Sacar la basura', { dias: ['martes', 'jueves'] });
	await adelantar(page, '2026-07-15T08:03:00');
	await crear(page, 'Cambiar foco', sinFecha);
	for (const t of ['Sacar la basura', 'Limpiar heladera', 'Cambiar sábanas']) await esperarEstado(page, t, 'en espera', undefined, false);
	await esperarEstado(page, 'Cambiar foco', 'pendiente');
	await listaEs(page, ['Cambiar foco', 'Sacar la basura', 'Limpiar heladera', 'Cambiar sábanas']);

	await adelantar(page, '2026-07-16T00:00:00');
	await esperarEstado(page, 'Sacar la basura', 'pendiente');
	await listaEs(page, ['Sacar la basura', 'Cambiar foco', 'Limpiar heladera', 'Cambiar sábanas']);

	await adelantar(page, '2026-07-16T08:00:00');
	await completar(page, 'Sacar la basura');
	await listaEs(page, ['Cambiar foco', 'Limpiar heladera', 'Cambiar sábanas']);
	await page.reload();
	await listaEs(page, ['Cambiar foco', 'Limpiar heladera', 'Cambiar sábanas']);
});

test('Flujo 5: desempate por título', async ({ page }) => {
	await sesionConReloj(page, '2026-07-15T08:00:00');
	await page.clock.setFixedTime(new Date('2026-07-15T08:00:00'));
	for (const t of ['Zapallo', 'Ñoquis', 'Barrer', 'Nueces', 'Árbol', 'acelga']) await crear(page, t, sinFecha);
	const orden = ['acelga', 'Árbol', 'Barrer', 'Nueces', 'Ñoquis', 'Zapallo'];
	for (const t of orden) await esperarEstado(page, t, 'pendiente');
	await listaEs(page, orden);
	await page.reload();
	await listaEs(page, orden);
});
