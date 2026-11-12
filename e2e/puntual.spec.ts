import { expect, test, type Page } from '@playwright/test';
import { adelantar, completar, crearTarea, descartar, esperarEstado, fila, limpiarEmuladores, mostrarCompletadas, sesionConReloj } from './apoyo';

const LUNES = '2026-07-13T08:00:00';
const LUZ = 'Pagar la luz';
const FOCO = 'Cambiar foco';

test.beforeEach(async () => {
	await limpiarEmuladores();
});

async function crearPuntual(page: Page, titulo: string, fecha?: string) {
	await page.getByRole('button', { name: '+' }).click();
	await page.getByLabel('Título').fill(titulo);
	await page.getByRole('radio', { name: 'No se repite' }).check();
	if (fecha) await page.getByLabel('Fecha límite').fill(fecha);
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
}

test('Flujo 1: selector de tipo en el panel', async ({ page }) => {
	await sesionConReloj(page, LUNES);
	await page.getByRole('button', { name: '+' }).click();
	const grupo = page.getByRole('group', { name: 'Se repite' });
	const fecha = page.getByLabel('Fecha límite');
	const cada = page.getByRole('spinbutton', { name: 'Cada' });
	await expect(grupo.getByRole('radio')).toHaveCount(4);
	for (const n of ['No se repite', 'Intervalo', 'Días de la semana', 'Días del mes'])
		await expect(grupo.getByRole('radio', { name: n })).toBeVisible();
	await expect(grupo.getByRole('radio', { name: 'No se repite' })).toBeChecked();
	await grupo.getByRole('radio', { name: 'Intervalo' }).check();
	await expect(cada).toBeVisible();
	await expect(page.getByLabel('Unidad')).toBeVisible();
	await expect(fecha).toHaveCount(0);

	await grupo.getByRole('radio', { name: 'No se repite' }).check();
	await expect(fecha).toBeVisible();
	await expect(fecha).toHaveValue('');
	await expect(cada).toHaveCount(0);
	await expect(page.getByLabel('Unidad')).toHaveCount(0);
	await expect(page.getByRole('group', { name: 'Días de la semana' })).toHaveCount(0);
	await expect(page.getByRole('group', { name: 'Días del mes' })).toHaveCount(0);

	await grupo.getByRole('radio', { name: 'Días de la semana' }).check();
	await expect(fecha).toHaveCount(0);
	await expect(page.getByRole('group', { name: 'Días de la semana' }).getByRole('button')).toHaveCount(7);

	await grupo.getByRole('radio', { name: 'No se repite' }).check();
	await expect(fecha).toBeVisible();

	await page.getByRole('button', { name: 'Cerrar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(page.getByRole('listitem')).toHaveCount(0);
});

test('Flujo 2: crear con y sin fecha límite', async ({ page }) => {
	await sesionConReloj(page, LUNES);
	await crearPuntual(page, LUZ, '2026-07-15');
	await esperarEstado(page, LUZ, 'pendiente');
	await crearPuntual(page, FOCO);
	await esperarEstado(page, FOCO, 'pendiente');
	await crearPuntual(page, 'Devolver libro', '2026-07-13');
	await esperarEstado(page, 'Devolver libro', 'pendiente');
	await crearPuntual(page, 'Renovar DNI', '2026-07-10');
	await esperarEstado(page, 'Renovar DNI', 'atrasada');
	await page.reload();
	await expect(page.getByRole('listitem')).toHaveCount(4);
	await esperarEstado(page, LUZ, 'pendiente');
	await esperarEstado(page, FOCO, 'pendiente');
	await esperarEstado(page, 'Devolver libro', 'pendiente');
	await esperarEstado(page, 'Renovar DNI', 'atrasada');
});

test('Flujo 3: validación del panel', async ({ page }) => {
	await sesionConReloj(page, LUNES);
	const panel = page.getByRole('dialog');
	const titulo = page.getByLabel('Título');
	const fecha = page.getByLabel('Fecha límite');
	const guardar = page.getByRole('button', { name: 'Guardar' });
	const rechazado = async () => {
		await expect(titulo).toHaveAccessibleDescription(/título/i);
		await expect(panel).toBeVisible();
		await expect(page.getByRole('listitem')).toHaveCount(0);
	};
	await page.getByRole('button', { name: '+' }).click();
	await page.getByRole('radio', { name: 'No se repite' }).check();
	await guardar.click();
	await rechazado();
	await titulo.fill('   ');
	await guardar.click();
	await rechazado();
	await titulo.fill('');
	await fecha.fill('2026-07-15');
	await guardar.click();
	await rechazado();

	await titulo.fill(LUZ);
	await fecha.fill('');
	await fecha.click();
	await page.keyboard.type('1507');
	await guardar.click();
	await expect(fecha).toHaveAccessibleDescription(/fecha/i);
	await expect(panel).toBeVisible();
	await expect(page.getByRole('listitem')).toHaveCount(0);

	await descartar(page);
	await expect(panel).toHaveCount(0);
	await expect(page.getByRole('listitem')).toHaveCount(0);
});

test('Flujo 4: de pendiente a atrasada al terminar el día límite', async ({ page }) => {
	await sesionConReloj(page, LUNES);
	await crearPuntual(page, LUZ, '2026-07-15');
	await esperarEstado(page, LUZ, 'pendiente');
	await crearPuntual(page, FOCO);
	await esperarEstado(page, FOCO, 'pendiente');
	await adelantar(page, '2026-07-15T00:00:00');
	await esperarEstado(page, LUZ, 'pendiente');
	await adelantar(page, '2026-07-15T23:59:59');
	await esperarEstado(page, LUZ, 'pendiente');
	await adelantar(page, '2026-07-16T00:00:00');
	await esperarEstado(page, LUZ, 'atrasada');
	await page.reload();
	await esperarEstado(page, LUZ, 'atrasada');
	await adelantar(page, '2026-09-01T08:00:00');
	await esperarEstado(page, LUZ, 'atrasada');
	await esperarEstado(page, FOCO, 'pendiente');
});

test('Flujo 5: completar saca la tarea de Pendientes', async ({ page }) => {
	await sesionConReloj(page, LUNES);
	await crearPuntual(page, LUZ, '2026-07-15');
	await crearPuntual(page, FOCO);
	await esperarEstado(page, LUZ, 'pendiente');
	await esperarEstado(page, FOCO, 'pendiente');
	await completar(page, FOCO);
	await expect(fila(page, FOCO)).toHaveCount(0);
	await esperarEstado(page, LUZ, 'pendiente');
	await adelantar(page, '2026-07-16T10:00:00');
	await esperarEstado(page, LUZ, 'atrasada');
	await completar(page, LUZ);
	await expect(page.getByRole('listitem')).toHaveCount(0);
	await page.reload();
	await expect(page.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
	await expect(page.getByRole('listitem')).toHaveCount(0);
	await adelantar(page, '2026-08-01T00:00:00');
	await expect(page.getByRole('listitem')).toHaveCount(0);
});

test('Flujo 6: persistencia entre sesiones', async ({ browser }) => {
	const contexto = await browser.newContext();
	const page = await contexto.newPage();
	await sesionConReloj(page, LUNES);
	await crearPuntual(page, LUZ, '2026-07-15');
	await crearPuntual(page, FOCO);
	await esperarEstado(page, LUZ, 'pendiente');
	await esperarEstado(page, FOCO, 'pendiente');

	const abrir = async (p: Page) => {
		await p.clock.install({ time: new Date('2026-07-16T00:00:00') });
		await p.goto('/');
		await expect(p.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
		await expect(p.getByRole('button', { name: 'Entrar con Google' })).toHaveCount(0);
	};
	await page.close();
	const segunda = await contexto.newPage();
	await abrir(segunda);
	await esperarEstado(segunda, LUZ, 'atrasada');
	await esperarEstado(segunda, FOCO, 'pendiente');
	await completar(segunda, LUZ);
	await expect(fila(segunda, LUZ)).toHaveCount(0);

	await segunda.close();
	const tercera = await contexto.newPage();
	await abrir(tercera);
	await expect(tercera.getByRole('listitem')).toHaveCount(1);
	await esperarEstado(tercera, FOCO, 'pendiente');
	await contexto.close();
});

test('Flujo 7: las periódicas se siguen creando con el nuevo selector', async ({ page }) => {
	await sesionConReloj(page, LUNES);
	await crearTarea(page, 'Ventilar', '4', 'horas');
	await esperarEstado(page, 'Ventilar', 'pendiente');
	await completar(page, 'Ventilar');
	await expect(mostrarCompletadas(page)).not.toBeChecked();
	await expect(fila(page, 'Ventilar')).toHaveCount(0);

	const basura = 'Sacar la basura';
	await page.getByRole('button', { name: '+' }).click();
	await page.getByLabel('Título').fill(basura);
	await page.getByRole('radio', { name: 'No se repite' }).check();
	await page.getByLabel('Fecha límite').fill('2026-07-14');
	await page.getByRole('radio', { name: 'Días de la semana' }).check();
	await page.getByRole('button', { name: 'martes' }).click();
	await page.getByRole('button', { name: 'jueves' }).click();
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await esperarEstado(page, basura, 'en espera', 0, false);

	await adelantar(page, '2026-07-14T00:00:00');
	await esperarEstado(page, basura, 'pendiente');
	await esperarEstado(page, 'Ventilar', 'atrasada');
	await adelantar(page, '2026-07-15T00:00:00');
	await esperarEstado(page, basura, 'atrasada');

	await page.getByRole('button', { name: '+' }).click();
	await page.getByLabel('Título').fill('Pagar expensas');
	await page.getByRole('radio', { name: 'Días del mes' }).check();
	await page.getByRole('button', { name: '20', exact: true }).click();
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await esperarEstado(page, 'Pagar expensas', 'en espera', 0, false);

	await page.reload();
	await esperarEstado(page, basura, 'atrasada');
	await esperarEstado(page, 'Ventilar', 'atrasada');
	await esperarEstado(page, 'Pagar expensas', 'en espera', 0, false);
});
