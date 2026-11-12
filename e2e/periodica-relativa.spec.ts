import { expect, test } from '@playwright/test';
import { adelantar, crearTarea, descartar, encenderCompletadas, entrar, esperarEstado, fila, limpiarEmuladores, retroceder, sesionConReloj } from './apoyo';

const INICIO = '2026-07-15T08:00:00';

test.beforeEach(async () => {
	await limpiarEmuladores();
});

test('Flujo 1: entrar con Google', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'Entrar con Google' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Pendientes' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: '+' })).toHaveCount(0);
	await entrar(page);
	await expect(page.getByRole('button', { name: '+' })).toBeVisible();
	await expect(page.getByRole('listitem')).toHaveCount(0);
	await page.reload();
	await expect(page.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Entrar con Google' })).toHaveCount(0);
});

test('Flujo 2: validación al crear', async ({ page }) => {
	await sesionConReloj(page, INICIO);
	const panel = page.getByRole('dialog');
	const guardar = page.getByRole('button', { name: 'Guardar' });
	await page.getByRole('button', { name: '+' }).click();
	await expect(panel).toBeVisible();
	await expect(page.getByLabel('Título')).toBeVisible();
	await expect(page.getByRole('radio', { name: 'No se repite' })).toBeChecked();
	await page.getByRole('radio', { name: 'Intervalo' }).check();
	await expect(page.getByRole('spinbutton', { name: 'Cada' })).toBeVisible();
	await expect(page.getByLabel('Unidad')).toBeVisible();
	await expect(page.getByRole('radio', { name: 'Intervalo' })).toBeChecked();

	await page.getByRole('spinbutton', { name: 'Cada' }).fill('2');
	await page.getByLabel('Unidad').selectOption({ label: 'días' });
	await guardar.click();
	await expect(page.getByLabel('Título')).toHaveAccessibleDescription(/título/i);
	await expect(panel).toBeVisible();
	await expect(page.getByRole('listitem')).toHaveCount(0);

	await page.getByLabel('Título').fill('   ');
	await guardar.click();
	await expect(page.getByLabel('Título')).toHaveAccessibleDescription(/título/i);
	await expect(panel).toBeVisible();
	await expect(page.getByRole('listitem')).toHaveCount(0);

	await page.getByLabel('Título').fill('Regar plantas');
	await page.getByRole('spinbutton', { name: 'Cada' }).fill('0');
	await guardar.click();
	await expect(page.getByRole('spinbutton', { name: 'Cada' })).toHaveAccessibleDescription(/Cada/);
	await expect(page.getByRole('listitem')).toHaveCount(0);

	await page.getByRole('spinbutton', { name: 'Cada' }).fill('1.5');
	await guardar.click();
	await expect(page.getByRole('spinbutton', { name: 'Cada' })).toHaveAccessibleDescription(/Cada/);
	await expect(panel).toBeVisible();
	await expect(page.getByRole('listitem')).toHaveCount(0);

	await descartar(page);
	await expect(panel).toHaveCount(0);
	await expect(page.getByRole('listitem')).toHaveCount(0);
});

test('Flujo 3 pasos 1-2: una tarea nunca completada no se atrasa', async ({ page }) => {
	const T = 'Regar plantas';
	await sesionConReloj(page, INICIO);
	await crearTarea(page, T, '2', 'días');
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await esperarEstado(page, T, 'pendiente');
	await adelantar(page, '2026-07-18T08:00:00');
	await esperarEstado(page, T, 'pendiente');
});

test('Flujo 3 pasos 3-13: ciclo de estados de Regar plantas cada 2 días (contexto limpio)', async ({ page }) => {
	const T = 'Regar plantas';
	await sesionConReloj(page, INICIO);
	await encenderCompletadas(page);
	await crearTarea(page, T, '2', 'días');
	await esperarEstado(page, T, 'pendiente');

	await fila(page, T).getByRole('checkbox').click();
	await esperarEstado(page, T, 'en espera', 0);
	await adelantar(page, '2026-07-16T08:00:00');
	await esperarEstado(page, T, 'en espera', 50);
	await adelantar(page, '2026-07-17T07:00:00');
	await esperarEstado(page, T, 'en espera', 98);
	await adelantar(page, '2026-07-17T08:00:00');
	await esperarEstado(page, T, 'pendiente');
	await adelantar(page, '2026-07-19T07:00:00');
	await esperarEstado(page, T, 'pendiente');
	await adelantar(page, '2026-07-19T08:00:00');
	await esperarEstado(page, T, 'atrasada');

	// Paso 10: recargar conserva el estado (el reloj instalado persiste en la página al recargar).
	await page.reload();
	await esperarEstado(page, T, 'atrasada');

	await fila(page, T).getByRole('checkbox').click();
	await esperarEstado(page, T, 'en espera', 0);
	await adelantar(page, '2026-07-20T08:00:00');
	await esperarEstado(page, T, 'en espera', 50);
	await adelantar(page, '2026-07-21T08:00:00');
	await esperarEstado(page, T, 'pendiente');
});

test('Flujo 4: el checkbox en espera borra el completado de hoy; completar de nuevo reinicia el intervalo (horas)', async ({ page }) => {
	const T = 'Ventilar';
	await sesionConReloj(page, INICIO);
	await encenderCompletadas(page);
	await crearTarea(page, T, '4', 'horas');
	await esperarEstado(page, T, 'pendiente');
	await fila(page, T).getByRole('checkbox').click();
	await esperarEstado(page, T, 'en espera', 0);
	await adelantar(page, '2026-07-15T09:00:00');
	await esperarEstado(page, T, 'en espera', 25);
	await fila(page, T).getByRole('checkbox').click();
	await esperarEstado(page, T, 'pendiente');
	await fila(page, T).getByRole('checkbox').click();
	await esperarEstado(page, T, 'en espera', 0);
	await adelantar(page, '2026-07-15T12:00:00');
	await esperarEstado(page, T, 'en espera', 75);
	await adelantar(page, '2026-07-15T13:00:00');
	await esperarEstado(page, T, 'pendiente');
	await adelantar(page, '2026-07-15T17:00:00');
	await esperarEstado(page, T, 'atrasada');
});

test('Flujo 5: persistencia entre sesiones', async ({ browser }) => {
	const T = 'Regar plantas';
	const contexto = await browser.newContext();
	const page = await contexto.newPage();
	await sesionConReloj(page, INICIO);
	await encenderCompletadas(page);
	await crearTarea(page, T, '2', 'días');
	await fila(page, T).getByRole('checkbox').click();
	await esperarEstado(page, T, 'en espera', 0);
	await adelantar(page, '2026-07-16T08:00:00');
	await esperarEstado(page, T, 'en espera', 50);

	// Cerrar la pestaña y abrir la app de nuevo con el mismo reloj, en el mismo perfil.
	await page.close();
	const nueva = await contexto.newPage();
	await nueva.clock.install({ time: new Date('2026-07-16T08:00:00') });
	await nueva.goto('/');
	await expect(nueva.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
	await expect(nueva.getByRole('button', { name: 'Entrar con Google' })).toHaveCount(0);
	await esperarEstado(nueva, T, 'en espera', 50);
	await contexto.close();
});

test('Flujo 6: relojes desfasados (completado del futuro)', async ({ page }) => {
	await sesionConReloj(page, INICIO);
	await encenderCompletadas(page);
	await crearTarea(page, 'Ventilar', '4', 'horas');
	await fila(page, 'Ventilar').getByRole('checkbox').click();
	await esperarEstado(page, 'Ventilar', 'en espera', 0);
	await retroceder(page, '2026-07-15T07:00:00');
	await esperarEstado(page, 'Ventilar', 'en espera', 0);
	await page.reload();
	await esperarEstado(page, 'Ventilar', 'en espera', 0);
	await adelantar(page, '2026-07-15T08:00:00');
	await esperarEstado(page, 'Ventilar', 'en espera', 0);
	await adelantar(page, '2026-07-15T09:00:00');
	await esperarEstado(page, 'Ventilar', 'en espera', 25);
	await adelantar(page, '2026-07-15T12:00:00');
	await esperarEstado(page, 'Ventilar', 'pendiente');
});

test('Flujo 7: completar en espera, con el último completado de ayer, reinicia el intervalo', async ({ page }) => {
	const T = 'Regar plantas';
	await sesionConReloj(page, '2026-07-15T20:00:00');
	await encenderCompletadas(page);
	await crearTarea(page, T, '2', 'días');
	await fila(page, T).getByRole('checkbox').click();
	await expect(page.getByRole('status')).toContainText('Completaste «Regar plantas»');
	await esperarEstado(page, T, 'en espera', 0);
	await adelantar(page, '2026-07-16T00:00:00');
	await esperarEstado(page, T, 'en espera', 8);
	await fila(page, T).getByRole('checkbox').click();
	await expect(page.getByRole('status')).toContainText('Completaste «Regar plantas»');
	await esperarEstado(page, T, 'en espera', 0);
	await page.getByRole('navigation').getByRole('link', { name: 'Historial' }).click();
	await expect(page.getByRole('heading', { name: 'Historial', level: 1 })).toBeVisible();
	await expect(page.getByRole('listitem').filter({ hasText: 'Regar plantas' })).toHaveCount(2);
	await expect(page.getByRole('heading', { name: 'Hoy' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Ayer' })).toBeVisible();
	await page.getByRole('navigation').getByRole('link', { name: 'Pendientes' }).click();
	await expect(page.getByRole('heading', { name: 'Pendientes', level: 1 })).toBeVisible();
	await adelantar(page, '2026-07-17T20:00:00');
	await esperarEstado(page, T, 'en espera', 92);
	await adelantar(page, '2026-07-18T00:00:00');
	await esperarEstado(page, T, 'pendiente');
});
