import { expect, test, type Browser, type Page } from '@playwright/test';
import {
	abrir,
	adelantar,
	cerrar,
	completar,
	completarPanel,
	conmutarMostrarCompletadas,
	crear,
	dispositivo,
	encenderCompletadas,
	fila,
	irA,
	limpiarEmuladores,
	sesionConReloj
} from './apoyo';

test.beforeEach(async () => {
	await limpiarEmuladores();
});

async function sesion(page: Page, hora: string) {
	await sesionConReloj(page, hora);
	await encenderCompletadas(page);
}

async function dos(browser: Browser, horaA: string, horaB: string) {
	const a = await dispositivo(browser, horaA, true);
	const b = await dispositivo(browser, horaB, false);
	await encenderCompletadas(a.page);
	await encenderCompletadas(b.page);
	return {
		a: a.page,
		b: b.page,
		fin: async () => {
			await a.ctx.close();
			await b.ctx.close();
		}
	};
}

const textoUltimaVez = (page: Page) => page.getByText(/^Última vez/);

/** El panel dice `Última vez: T`, inmediatamente debajo del encabezado Editar tarea. */
async function dice(page: Page, t: string) {
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await expect(textoUltimaVez(page)).toHaveCount(1);
	await expect(textoUltimaVez(page)).toHaveText(`Última vez: ${t}`);
}

async function debajoDelEncabezado(page: Page) {
	const h = (await page.getByRole('heading', { name: 'Editar tarea' }).boundingBox())!;
	const u = (await textoUltimaVez(page).boundingBox())!;
	expect(u.y).toBeGreaterThanOrEqual(h.y + h.height - 1);
	const otros = await page
		.getByRole('dialog')
		.locator('label, input, textarea, select')
		.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().y));
	for (const y of otros) expect(y).toBeGreaterThanOrEqual(u.y + u.height - 1);
}

const aviso = (page: Page) => page.getByRole('status');

async function borrarEntrada(page: Page, titulo: string, hora: string, encabezado: string) {
	const lista = page.locator(`xpath=//h2[normalize-space()="${encabezado}"]/following-sibling::ul[1]`);
	await lista
		.getByRole('listitem')
		.filter({ hasText: new RegExp(`^${titulo}\\s*${hora}`) })
		.getByRole('button', { name: 'Borrar', exact: true })
		.click();
	const dialogo = page.getByRole('alertdialog');
	await expect(dialogo).toHaveText(new RegExp(`¿Borrar «${titulo}» de ${encabezado}, ${hora}\\?`));
	await dialogo.getByRole('button', { name: 'Borrar', exact: true }).click();
	await expect(dialogo).toHaveCount(0);
}

test('Flujo 1: crear no la muestra; sin completados, "nunca"', async ({ page }) => {
	await sesion(page, '2026-07-15T08:00:00');
	await page.getByRole('button', { name: '+' }).click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await expect(textoUltimaVez(page)).toHaveCount(0);
	await completarPanel(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '1', unidad: 'días' });
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await abrir(page, 'Regar');
	await dice(page, 'nunca');
	await debajoDelEncabezado(page);
	await cerrar(page);
	await expect(fila(page, 'Regar')).toBeVisible();
	await expect(page.getByText('Última vez')).toHaveCount(0);
});

test('Flujo 2: hoy, ayer y hace N días, con el panel abierto al pasar la medianoche', async ({ page }) => {
	await sesion(page, '2026-07-13T08:00:00');
	await crear(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '10', unidad: 'días' });
	await adelantar(page, '2026-07-13T08:05:30');
	await completar(page, 'Regar');
	await expect(aviso(page)).toHaveCount(1);
	await abrir(page, 'Regar');
	await dice(page, 'hoy 08:05');
	await adelantar(page, '2026-07-13T23:59:59');
	await dice(page, 'hoy 08:05');
	await adelantar(page, '2026-07-14T00:00:00');
	await dice(page, 'ayer 08:05');
	await adelantar(page, '2026-07-15T00:00:00');
	await dice(page, 'hace 2 días');
	await adelantar(page, '2026-07-23T10:00:00');
	await dice(page, 'hace 10 días');
	await cerrar(page);
	await expect(fila(page, 'Regar')).not.toContainText('Última vez');
	await page.reload();
	await abrir(page, 'Regar');
	await dice(page, 'hace 10 días');
});

test('Flujo 3: borrar completados la recalcula', async ({ page }) => {
	await sesion(page, '2026-07-14T10:00:00');
	await crear(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '1', unidad: 'horas' });
	await completar(page, 'Regar');
	await adelantar(page, '2026-07-15T09:00:00');
	await completar(page, 'Regar');
	await expect(aviso(page)).toHaveCount(1);
	await aviso(page).getByRole('button', { name: 'Deshacer' }).click();
	await expect(aviso(page)).toHaveCount(0);
	await abrir(page, 'Regar');
	await dice(page, 'ayer 10:00');
	await cerrar(page);

	await adelantar(page, '2026-07-15T09:30:00');
	await completar(page, 'Regar');
	await expect(aviso(page)).toHaveCount(1);
	await adelantar(page, '2026-07-15T09:30:06');
	await expect(aviso(page)).toHaveCount(0);
	await abrir(page, 'Regar');
	await dice(page, 'hoy 09:30');
	await cerrar(page);

	await fila(page, 'Regar').getByRole('checkbox', { checked: true }).click();
	await expect(fila(page, 'Regar').getByRole('checkbox')).not.toBeChecked();
	await abrir(page, 'Regar');
	await dice(page, 'ayer 10:00');
	await cerrar(page);

	await irA(page, 'Historial');
	await borrarEntrada(page, 'Regar', '10:00', 'Ayer');
	await irA(page, 'Pendientes');
	await abrir(page, 'Regar');
	await dice(page, 'nunca');
});

test('Flujo 4: una puntual completada, abierta desde el Historial', async ({ page }) => {
	await sesion(page, '2026-07-15T08:00:00');
	await crear(page, { titulo: 'Pagar la luz', tipo: 'No se repite' });
	await adelantar(page, '2026-07-15T08:20:00');
	await completar(page, 'Pagar la luz');
	await expect(fila(page, 'Pagar la luz').getByRole('checkbox')).toBeChecked();
	await conmutarMostrarCompletadas(page, false);
	await expect(fila(page, 'Pagar la luz')).toHaveCount(0);

	await irA(page, 'Historial');
	await abrir(page, 'Pagar la luz');
	await dice(page, 'hoy 08:20');
	await completarPanel(page, { tipo: 'Intervalo', cada: '4', unidad: 'horas' });
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await abrir(page, 'Pagar la luz');
	await dice(page, 'hoy 08:20');
});

test('Flujo 5: otro dispositivo completa y borra con el panel abierto', async ({ browser }) => {
	const { a, b, fin } = await dos(browser, '2026-07-15T08:00:00', '2026-07-15T08:00:00');
	await crear(a, { titulo: 'Regar', tipo: 'Intervalo', cada: '1', unidad: 'horas' });
	await completar(a, 'Regar');
	await expect(fila(a, 'Regar').getByRole('checkbox')).toBeChecked();
	await abrir(a, 'Regar');
	await dice(a, 'hoy 08:00');

	await adelantar(a, '2026-07-15T09:15:00');
	await adelantar(b, '2026-07-15T09:15:00');
	await expect(fila(b, 'Regar')).toBeVisible();
	await completar(b, 'Regar');
	await dice(a, 'hoy 09:15');

	await irA(b, 'Historial');
	await borrarEntrada(b, 'Regar', '09:15', 'Hoy');
	await dice(a, 'hoy 08:00');

	await borrarEntrada(b, 'Regar', '08:00', 'Hoy');
	await dice(a, 'nunca');
	await fin();
});

test('Flujo 6: completado "del futuro"', async ({ browser }) => {
	const { a, b, fin } = await dos(browser, '2026-12-31T20:00:00', '2027-01-01T08:00:00');
	await crear(a, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await expect(fila(b, 'Regar')).toBeVisible();
	await completar(b, 'Regar');
	await expect(fila(b, 'Regar').getByRole('checkbox')).toBeChecked();

	await expect(async () => {
		await abrir(a, 'Regar');
		await dice(a, 'viernes 1 de enero de 2027 08:00');
	}).toPass();
	await adelantar(a, '2027-01-01T07:00:00');
	await dice(a, 'hoy 08:00');
	await adelantar(a, '2027-01-02T10:00:00');
	await dice(a, 'ayer 08:00');

	await abrir(b, 'Regar');
	await dice(b, 'hoy 08:00');
	await fin();
});
