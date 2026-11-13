import { expect, test, type Page } from '@playwright/test';
import { adelantar, descartar, encenderCompletadas, esperarEstado, fila, limpiarEmuladores, retroceder, sesionConReloj } from './apoyo';

const LUNES = '2026-07-13T08:00:00';
const SEMANA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const BASURA = 'Sacar la basura';

test.beforeEach(async () => {
	await limpiarEmuladores();
});

async function abrirPanel(page: Page, titulo: string) {
	await page.getByRole('button', { name: '+' }).click();
	await page.getByLabel('Título').fill(titulo);
}

async function elegirDias(page: Page, modo: 'Días de la semana' | 'Días del mes', dias: string[]) {
	await page.getByRole('radio', { name: modo }).check();
	for (const dia of dias) await page.getByRole('button', { name: dia, exact: true }).click();
}

async function crearCalendario(page: Page, titulo: string, modo: 'Días de la semana' | 'Días del mes', dias: string[]) {
	await abrirPanel(page, titulo);
	await elegirDias(page, modo, dias);
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
}

const crearBasura = (page: Page) => crearCalendario(page, BASURA, 'Días de la semana', ['martes', 'jueves']);
/** Sesión con reloj y Mostrar completadas encendido: una calendario en espera con completados solo tiene fila así. */
async function sesion(page: Page, hora: string) {
	await sesionConReloj(page, hora);
	await encenderCompletadas(page);
}
const completar = (page: Page, titulo: string) => fila(page, titulo).getByRole('checkbox').click();

test('Contrato del panel', async ({ page }) => {
	await sesionConReloj(page, LUNES);
	await page.getByRole('button', { name: '+' }).click();
	const grupo = page.getByRole('group', { name: 'Se repite' });
	await expect(grupo.getByRole('radio')).toHaveCount(4);
	await expect(grupo.getByRole('radio', { name: 'No se repite' })).toBeVisible();
	await expect(grupo.getByRole('radio', { name: 'No se repite' })).toBeChecked();
	await grupo.getByRole('radio', { name: 'Intervalo' }).check();
	await expect(page.getByRole('spinbutton', { name: 'Cada' })).toBeVisible();
	await expect(page.getByLabel('Unidad')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Cerrar' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Guardar' })).toBeVisible();

	await page.getByRole('radio', { name: 'Días de la semana' }).check();
	await expect(page.getByRole('spinbutton', { name: 'Cada' })).toHaveCount(0);
	const dias = page.getByRole('group', { name: 'Días de la semana' }).getByRole('button');
	await expect(dias).toHaveText(SEMANA);
	await page.getByRole('button', { name: 'martes' }).click();
	await page.getByRole('button', { name: 'jueves' }).click();
	await expect(page.getByRole('button', { name: 'martes' })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByRole('button', { name: 'jueves' })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByRole('button', { name: 'lunes' })).toHaveAttribute('aria-pressed', 'false');

	await page.getByRole('radio', { name: 'Días del mes' }).check();
	await expect(page.getByRole('button', { name: 'martes' })).toHaveCount(0);
	const mes = page.getByRole('group', { name: 'Días del mes' }).getByRole('button');
	await expect(mes).toHaveText(Array.from({ length: 31 }, (_, i) => String(i + 1)));
	await page.getByRole('button', { name: '10', exact: true }).click();
	await page.getByRole('button', { name: '20', exact: true }).click();
	await expect(page.getByRole('button', { name: '10', exact: true })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByRole('button', { name: '20', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('Flujo 1: crear una semanal y una mensual', async ({ page }) => {
	await sesion(page, LUNES);
	await abrirPanel(page, BASURA);
	await page.getByRole('radio', { name: 'Días de la semana' }).check();
	await page.getByRole('button', { name: 'martes' }).click();
	await page.getByRole('button', { name: 'jueves' }).click();
	await expect(page.getByRole('button', { name: 'martes' })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByRole('button', { name: 'jueves' })).toHaveAttribute('aria-pressed', 'true');
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await esperarEstado(page, BASURA, 'en espera', 0, false);

	await crearCalendario(page, 'Pagar expensas', 'Días del mes', ['10']);
	await esperarEstado(page, 'Pagar expensas', 'en espera', 0, false);

	await crearCalendario(page, 'Regar plantas', 'Días de la semana', ['lunes']);
	await esperarEstado(page, 'Regar plantas', 'pendiente');

	await page.reload();
	await esperarEstado(page, BASURA, 'en espera', 0, false);
	await esperarEstado(page, 'Pagar expensas', 'en espera', 0, false);
	await esperarEstado(page, 'Regar plantas', 'pendiente');
});

test('Flujo 2: validación del panel', async ({ page }) => {
	await sesion(page, LUNES);
	const panel = page.getByRole('dialog');
	const guardar = page.getByRole('button', { name: 'Guardar' });
	const titulo = page.getByLabel('Título');
	const grupoSemana = page.getByRole('group', { name: 'Días de la semana' });
	const sinFilas = async () => {
		await expect(panel).toBeVisible();
		await expect(page.getByRole('listitem')).toHaveCount(0);
	};

	await page.getByRole('button', { name: '+' }).click();
	await elegirDias(page, 'Días de la semana', ['martes']);
	await guardar.click();
	await expect(titulo).toHaveAccessibleDescription(/título/i);
	await sinFilas();

	await titulo.fill('   ');
	await guardar.click();
	await expect(titulo).toHaveAccessibleDescription(/título/i);
	await sinFilas();

	await titulo.fill(BASURA);
	await page.getByRole('button', { name: 'martes' }).click();
	await expect(page.getByRole('button', { name: 'martes' })).toHaveAttribute('aria-pressed', 'false');
	await guardar.click();
	await expect(grupoSemana).toHaveAccessibleDescription(/al menos un día/i);
	await sinFilas();

	await page.getByRole('radio', { name: 'Días del mes' }).check();
	await guardar.click();
	await expect(page.getByRole('group', { name: 'Días del mes' })).toHaveAccessibleDescription(/al menos un día/i);
	await sinFilas();

	await expect(page.getByRole('group', { name: 'Días del mes' }).getByRole('button')).toHaveCount(31);

	await descartar(page);
	await expect(panel).toHaveCount(0);
	await expect(page.getByRole('listitem')).toHaveCount(0);

	await abrirPanel(page, 'Combinada');
	await elegirDias(page, 'Días de la semana', ['martes']);
	await elegirDias(page, 'Días del mes', ['15']);
	await guardar.click();
	await expect(panel).toHaveCount(0);
	await expect(page.getByRole('listitem')).toHaveCount(1);
	await esperarEstado(page, 'Combinada', 'en espera', 0, false);

	await adelantar(page, '2026-07-14T00:00:00');
	await esperarEstado(page, 'Combinada', 'en espera', 40, false);
	await adelantar(page, '2026-07-15T00:00:00');
	await esperarEstado(page, 'Combinada', 'pendiente');
});

test('Flujo 3: ciclo de estados de una semanal', async ({ page }) => {
	await sesion(page, LUNES);
	await crearBasura(page);
	await esperarEstado(page, BASURA, 'en espera', 0, false);
	await adelantar(page, '2026-07-13T16:00:00');
	await esperarEstado(page, BASURA, 'en espera', 50, false);
	await adelantar(page, '2026-07-13T23:00:00');
	await esperarEstado(page, BASURA, 'en espera', 94, false);
	await adelantar(page, '2026-07-14T00:00:00');
	await esperarEstado(page, BASURA, 'pendiente');
	await adelantar(page, '2026-07-14T23:59:59');
	await esperarEstado(page, BASURA, 'pendiente');
	await adelantar(page, '2026-07-15T00:00:00');
	await esperarEstado(page, BASURA, 'atrasada');
	await page.reload();
	await esperarEstado(page, BASURA, 'atrasada');
	await adelantar(page, '2026-07-15T08:00:00');
	await completar(page, BASURA);
	await esperarEstado(page, BASURA, 'en espera', 0);
	await adelantar(page, '2026-07-15T16:00:00');
	await esperarEstado(page, BASURA, 'en espera', 50);
	await adelantar(page, '2026-07-16T00:00:00');
	await esperarEstado(page, BASURA, 'pendiente');
	await adelantar(page, '2026-07-16T12:00:00');
	await completar(page, BASURA);
	await esperarEstado(page, BASURA, 'en espera', 0);
	await adelantar(page, '2026-07-18T18:00:00');
	await esperarEstado(page, BASURA, 'en espera', 50);
	await adelantar(page, '2026-07-21T00:00:00');
	await esperarEstado(page, BASURA, 'pendiente');
});

test('Flujo 4: completar antes de tiempo y ocurrencias perdidas', async ({ page }) => {
	await sesion(page, LUNES);
	await crearBasura(page);
	await esperarEstado(page, BASURA, 'en espera', 0, false);
	await completar(page, BASURA);
	await esperarEstado(page, BASURA, 'en espera', 0);
	await adelantar(page, '2026-07-14T00:00:00');
	await esperarEstado(page, BASURA, 'en espera', 25);
	await adelantar(page, '2026-07-14T16:00:00');
	await esperarEstado(page, BASURA, 'en espera', 50);
	await adelantar(page, '2026-07-16T00:00:00');
	await esperarEstado(page, BASURA, 'pendiente');
	await adelantar(page, '2026-07-17T10:00:00');
	await esperarEstado(page, BASURA, 'atrasada');
	await expect(page.getByRole('listitem')).toHaveCount(1);
	await expect(page.getByText(/^Tocaba /)).toHaveCount(1);
	await completar(page, BASURA);
	await esperarEstado(page, BASURA, 'en espera', 0);
	await adelantar(page, '2026-07-19T05:00:00');
	await esperarEstado(page, BASURA, 'en espera', 50);
	await adelantar(page, '2026-07-21T00:00:00');
	await esperarEstado(page, BASURA, 'pendiente');
});

test('Flujo 5: mensual con día 31 en un mes de 30 días', async ({ page }) => {
	const T = 'Revisar filtro';
	await sesion(page, '2026-06-20T00:00:00');
	await crearCalendario(page, T, 'Días del mes', ['31']);
	await esperarEstado(page, T, 'en espera', 0, false);
	await adelantar(page, '2026-06-25T00:00:00');
	await esperarEstado(page, T, 'en espera', 50, false);
	await adelantar(page, '2026-06-30T00:00:00');
	await esperarEstado(page, T, 'pendiente');
	await adelantar(page, '2026-07-01T00:00:00');
	await esperarEstado(page, T, 'atrasada');
	await adelantar(page, '2026-07-01T08:00:00');
	await completar(page, T);
	await esperarEstado(page, T, 'en espera', 0);
	await adelantar(page, '2026-07-15T04:00:00');
	await esperarEstado(page, T, 'en espera', 47);
	await adelantar(page, '2026-07-31T00:00:00');
	await esperarEstado(page, T, 'pendiente');
});

test('Flujo 6: el checkbox en espera borra el completado de hoy', async ({ page }) => {
	await sesion(page, LUNES);
	await crearBasura(page);
	await esperarEstado(page, BASURA, 'en espera', 0, false);
	await completar(page, BASURA);
	await esperarEstado(page, BASURA, 'en espera', 0);
	await adelantar(page, '2026-07-13T12:00:00');
	await completar(page, BASURA);
	await esperarEstado(page, BASURA, 'en espera', 25, false);
	await completar(page, BASURA);
	await esperarEstado(page, BASURA, 'en espera', 0);
	await adelantar(page, '2026-07-16T00:00:00');
	await esperarEstado(page, BASURA, 'pendiente');
});

test('Flujo 7: persistencia entre sesiones', async ({ browser }) => {
	const contexto = await browser.newContext();
	const page = await contexto.newPage();
	await sesion(page, LUNES);
	await crearBasura(page);
	await completar(page, BASURA);
	await adelantar(page, '2026-07-14T16:00:00');
	await esperarEstado(page, BASURA, 'en espera', 50);

	await page.close();
	const nueva = await contexto.newPage();
	await nueva.clock.install({ time: new Date('2026-07-14T16:00:00') });
	await nueva.goto('/');
	await expect(nueva.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
	await expect(nueva.getByRole('button', { name: 'Entrar con Google' })).toHaveCount(0);
	await esperarEstado(nueva, BASURA, 'en espera', 50);
	await adelantar(nueva, '2026-07-16T00:00:00');
	await esperarEstado(nueva, BASURA, 'pendiente');
	await contexto.close();
});

test('Flujo 8: relojes desfasados (completado del futuro)', async ({ page }) => {
	await sesion(page, LUNES);
	await crearBasura(page);
	await esperarEstado(page, BASURA, 'en espera', 0, false);
	await adelantar(page, '2026-07-15T20:00:00');
	await esperarEstado(page, BASURA, 'atrasada');
	await completar(page, BASURA);
	await esperarEstado(page, BASURA, 'en espera', 0);
	await retroceder(page, '2026-07-15T10:00:00');
	await esperarEstado(page, BASURA, 'en espera', 0);
	await page.reload();
	await esperarEstado(page, BASURA, 'en espera', 0);
	await adelantar(page, '2026-07-15T20:00:00');
	await esperarEstado(page, BASURA, 'en espera', 0);
	await adelantar(page, '2026-07-15T22:00:00');
	await esperarEstado(page, BASURA, 'en espera', 50);
	await adelantar(page, '2026-07-16T00:00:00');
	await esperarEstado(page, BASURA, 'pendiente');
});

test('Flujo 9: completar dos veces antes de tiempo, en días distintos', async ({ page }) => {
	await sesion(page, LUNES);
	await crearBasura(page);
	await completar(page, BASURA);
	await esperarEstado(page, BASURA, 'en espera', 0);
	await adelantar(page, '2026-07-14T16:00:00');
	await esperarEstado(page, BASURA, 'en espera', 50);
	await completar(page, BASURA);
	await expect(page.getByRole('status')).toContainText('Completaste «Sacar la basura»');
	await esperarEstado(page, BASURA, 'en espera', 0);
	await adelantar(page, '2026-07-16T00:00:00');
	await esperarEstado(page, BASURA, 'en espera', 21);
	await adelantar(page, '2026-07-21T00:00:00');
	await esperarEstado(page, BASURA, 'pendiente');
});
