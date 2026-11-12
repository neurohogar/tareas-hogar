import { expect, test, type Browser, type Page } from '@playwright/test';
import {
	abrir,
	agregarEtiqueta,
	agregarHorario,
	campoDesde,
	campoEtiquetas,
	campoHasta,
	completar,
	crear,
	dosDispositivos,
	elegirEmoji,
	encenderCompletadas,
	entrarComoSegundoDispositivo,
	fijarReloj,
	fila,
	irA,
	limpiarEmuladores,
	llegaAlServidor,
	selectorEmoji,
	sesionConReloj
} from './apoyo';

// qa/cambios-sin-guardar.md: avisos de cierre y de acción, botón Atrás, recarga y dos dispositivos.
test.use({ viewport: { width: 360, height: 640 }, hasTouch: true });

test.beforeEach(async () => {
	await limpiarEmuladores();
});

const HOY = '2026-07-15T08:00:00';
const MENSAJE = 'Tenés cambios sin guardar';

const aviso = (page: Page) => page.getByRole('alertdialog', { name: MENSAJE });
const botonesDelAviso = (page: Page) => aviso(page).getByRole('button');
const boton = (page: Page, nombre: string) => page.getByRole('button', { name: nombre, exact: true });
const tocar = (page: Page, nombre: string) => boton(page, nombre).click();
const tocarEnAviso = (page: Page, nombre: string) => aviso(page).getByRole('button', { name: nombre, exact: true }).click();
const titulo = (page: Page) => page.getByLabel('Título');
const nota = (page: Page) => page.getByLabel('Nota');
const pestana = (page: Page, nombre: string) => page.getByRole('tab', { name: new RegExp(`^${nombre}`) });
const panelCerrado = (page: Page) => expect(page.getByRole('dialog')).toHaveCount(0);
const panelAbierto = (page: Page) => expect(page.getByRole('dialog').first()).toBeVisible();
const sinAviso = (page: Page) => expect(aviso(page)).toHaveCount(0);
const mostrarPausadas = (page: Page) => page.getByRole('checkbox', { name: 'Pausadas' });
const cada = (page: Page) => page.getByRole('spinbutton', { name: 'Cada' });
const ancho = (page: Page) => page.setViewportSize({ width: 1024, height: 768 });

/** En el celular abre la pestaña; en ancho no hace nada. */
async function irAPestana(page: Page, nombre: 'Tarea' | 'Cuándo' | 'Acciones') {
	const tab = pestana(page, nombre);
	if ((await tab.count()) > 0) await tab.click();
}

async function pestanaAbierta(page: Page, nombre: string) {
	await expect(pestana(page, nombre)).toHaveAttribute('aria-selected', 'true');
}

const REGAR = { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días', nota: 'Las del balcón' } as const;

async function crearRegar(page: Page, extra = {}) {
	await crear(page, { ...REGAR, ...extra });
	await expect(fila(page, 'Regar')).toBeVisible();
}

/** Cerrar con la X y ver el aviso de cierre con sus tres botones. */
async function cerrarYVerAviso(page: Page) {
	await tocar(page, 'Cerrar');
	await expect(aviso(page)).toBeVisible();
	await expect(botonesDelAviso(page)).toHaveText(['Seguir editando', 'Descartar', 'Guardar']);
}

/** Cerrar cierra directo, sin aviso. */
async function cierraDirecto(page: Page) {
	await tocar(page, 'Cerrar');
	await panelCerrado(page);
	await sinAviso(page);
}

/** Cerrar pide confirmación; se descarta. */
async function pideConfirmacion(page: Page) {
	await cerrarYVerAviso(page);
	await tocarEnAviso(page, 'Descartar');
	await panelCerrado(page);
	await sinAviso(page);
}

async function verAvisoDeAccion(page: Page, accion: string) {
	await expect(aviso(page)).toBeVisible();
	await expect(botonesDelAviso(page)).toHaveText(['Seguir editando', `Descartar y ${accion}`, `Guardar y ${accion}`]);
}

// ---------------------------------------------------------------------------------------------

test('Flujo 1: cerrar con cambios al editar', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await crearRegar(page);

	// 1
	await abrir(page, 'Regar');
	await cierraDirecto(page);

	// 2
	await abrir(page, 'Regar');
	await titulo(page).fill('Regar plantas');
	await cerrarYVerAviso(page);
	await expect(page.getByRole('dialog', { name: 'Editar tarea' })).toBeVisible();

	// 3
	await tocarEnAviso(page, 'Seguir editando');
	await sinAviso(page);
	await panelAbierto(page);
	await pestanaAbierta(page, 'Tarea');
	await expect(titulo(page)).toHaveValue('Regar plantas');
	await expect(fila(page, 'Regar plantas')).toHaveCount(0);
	await expect(fila(page, 'Regar')).toBeVisible();

	// 4
	await irAPestana(page, 'Cuándo');
	await tocar(page, 'Cerrar');
	await tocarEnAviso(page, 'Seguir editando');
	await pestanaAbierta(page, 'Cuándo');

	// 5
	await tocar(page, 'Cerrar');
	await tocarEnAviso(page, 'Descartar');
	await panelCerrado(page);
	await expect(fila(page, 'Regar')).toBeVisible();
	await expect(fila(page, 'Regar plantas')).toHaveCount(0);
	await abrir(page, 'Regar');
	await expect(titulo(page)).toHaveValue('Regar');

	// 6
	await titulo(page).fill('Regar plantas');
	await tocar(page, 'Cerrar');
	await tocarEnAviso(page, 'Guardar');
	await panelCerrado(page);
	await expect(fila(page, 'Regar plantas')).toBeVisible();
	await page.reload();
	await expect(fila(page, 'Regar plantas')).toBeVisible();

	// 7
	await abrir(page, 'Regar plantas');
	await titulo(page).fill('');
	await tocar(page, 'Cerrar');
	await expect(aviso(page)).toBeVisible();
	await tocarEnAviso(page, 'Guardar');
	await sinAviso(page);
	await panelAbierto(page);
	await expect(titulo(page)).toHaveValue('');
	await pestanaAbierta(page, 'Tarea');
	await expect(page.getByText('Escribí un título.')).toBeVisible();
	await expect(fila(page, 'Regar plantas')).toBeVisible();
	await tocar(page, 'Cerrar');
	await tocarEnAviso(page, 'Descartar');
	await panelCerrado(page);

	// 8
	await abrir(page, 'Regar plantas');
	await campoEtiquetas(page).fill('x'.repeat(31));
	await tocar(page, 'Cerrar');
	await tocarEnAviso(page, 'Guardar');
	await sinAviso(page);
	await panelAbierto(page);
	await expect(page.getByRole('img', { name: 'con errores' })).toBeVisible();
	await expect(page.getByText(/30 caracteres|demasiado larg|máximo/i).first()).toBeVisible();
	await tocar(page, 'Cerrar');
	await tocarEnAviso(page, 'Descartar');
	await panelCerrado(page);
	await expect(fila(page, 'Regar plantas')).toBeVisible();

	// 9
	await ancho(page);
	await abrir(page, 'Regar plantas');
	await titulo(page).fill('Regar flores');
	await cerrarYVerAviso(page);
	await tocarEnAviso(page, 'Seguir editando');
	await panelAbierto(page);
	await expect(titulo(page)).toHaveValue('Regar flores');
	await tocar(page, 'Cerrar');
	await tocarEnAviso(page, 'Descartar');
	await panelCerrado(page);
	await expect(fila(page, 'Regar plantas')).toBeVisible();
});

test('Flujo 2: qué cuenta como cambio', async ({ page, browser }) => {
	await sesionConReloj(page, HOY);
	await crear(page, { titulo: 'Otra', tipo: 'No se repite', etiquetas: ['casa'] });
	await crearRegar(page, { horarios: [{ desde: '08:00', hasta: '10:00' }, { desde: '12:00', hasta: '14:00' }] });
	const abrirRegar = () => abrir(page, 'Regar');

	// 1
	await abrirRegar();
	await titulo(page).fill('Regar' + 'Z');
	await titulo(page).fill('Regar');
	await cierraDirecto(page);

	// 2
	await abrirRegar();
	await titulo(page).fill('Regar   ');
	await cierraDirecto(page);
	await abrirRegar();
	await titulo(page).fill('  Regar  ');
	await nota(page).fill('  Las del balcón  ');
	await cierraDirecto(page);

	// 3
	await abrirRegar();
	await titulo(page).fill('Regar plantas');
	await pideConfirmacion(page);

	// 4
	await abrirRegar();
	await nota(page).fill('');
	await pideConfirmacion(page);
	await abrirRegar();
	await nota(page).fill('   ');
	await pideConfirmacion(page);

	// 5
	await abrirRegar();
	await titulo(page).fill('');
	await pideConfirmacion(page);

	// 6
	await abrirRegar();
	await campoEtiquetas(page).fill('   ');
	await cierraDirecto(page);

	// 7
	await abrirRegar();
	await campoEtiquetas(page).fill('ca');
	await pideConfirmacion(page);
	await abrirRegar();
	await campoEtiquetas(page).fill('  ca  ');
	await cerrarYVerAviso(page);
	await tocarEnAviso(page, 'Guardar');
	await panelCerrado(page);
	await irA(page, 'Etiquetas');
	await expect(page.getByText('ca', { exact: true })).toHaveCount(0);
	await irA(page, 'Pendientes');

	// 8
	await abrirRegar();
	await agregarEtiqueta(page, 'casa');
	await page.getByRole('button', { name: 'Quitar «casa»' }).click();
	await cierraDirecto(page);
	await abrirRegar();
	await agregarEtiqueta(page, 'casa');
	await expect(page.getByRole('button', { name: 'Quitar «casa»' })).toBeVisible();
	await pideConfirmacion(page);

	// 9
	await abrirRegar();
	await irAPestana(page, 'Cuándo');
	await page.getByRole('radio', { name: 'Días de la semana' }).check();
	await page.getByRole('radio', { name: 'Intervalo' }).check();
	await cada(page).fill('2');
	await page.getByLabel('Unidad').selectOption({ label: 'días' });
	await cierraDirecto(page);
	await abrirRegar();
	await irAPestana(page, 'Cuándo');
	await page.getByRole('radio', { name: 'Días de la semana' }).check();
	await pideConfirmacion(page);

	// 10
	await abrirRegar();
	await page.getByRole('combobox', { name: 'Esfuerzo' }).selectOption({ label: 'Media (≈ 15 min)' });
	await page.getByRole('combobox', { name: 'Esfuerzo' }).selectOption({ label: 'Sin estimar' });
	await cierraDirecto(page);
	await abrirRegar();
	await page.getByRole('combobox', { name: 'Esfuerzo' }).selectOption({ label: 'Media (≈ 15 min)' });
	await pideConfirmacion(page);

	// 11
	await abrirRegar();
	await irAPestana(page, 'Cuándo');
	await campoDesde(page, 0).fill('12:00');
	await campoHasta(page, 0).fill('14:00');
	await campoDesde(page, 1).fill('08:00');
	await campoHasta(page, 1).fill('10:00');
	await cierraDirecto(page);
	await abrirRegar();
	await irAPestana(page, 'Cuándo');
	await campoHasta(page, 0).fill('15:00');
	await pideConfirmacion(page);

	// 12
	await abrirRegar();
	await irAPestana(page, 'Cuándo');
	await agregarHorario(page).click();
	await pideConfirmacion(page);

	// 13
	await abrirRegar();
	await elegirEmoji(page, '🌱');
	await pideConfirmacion(page);
	await abrirRegar();
	await elegirEmoji(page, '🌱');
	await tocar(page, 'Quitar emoji');
	await cierraDirecto(page);

	// 14
	await crear(page, { titulo: 'Pagar', tipo: 'No se repite' });
	await expect(fila(page, 'Pagar')).toBeVisible();
	await abrir(page, 'Pagar');
	await cambiarTituloEnB(browser, 'Pagar', 'Pagar luz');
	await expect(page.getByLabel('Título')).toHaveValue('Pagar');
	await cierraDirecto(page);
	await expect(fila(page, 'Pagar luz')).toBeVisible();
});

/** El dispositivo B (misma cuenta) cambia el título de una tarea por la UI. */
async function cambiarTituloEnB(browser: Browser, de: string, a: string) {
	const ctx = await browser.newContext({
		baseURL: 'http://127.0.0.1:4173',
		locale: 'es-AR',
		timezoneId: 'America/Argentina/Buenos_Aires',
		viewport: { width: 360, height: 640 },
		hasTouch: true
	});
	const b = await ctx.newPage();
	await entrarComoSegundoDispositivo(b);
	await fijarReloj(b, HOY);
	await abrir(b, de);
	await titulo(b).fill(a);
	await tocar(b, 'Guardar');
	await panelCerrado(b);
	await llegaAlServidor(b);
	await ctx.close();
}

test('Flujo 3: crear con cambios sin guardar', async ({ page }) => {
	await sesionConReloj(page, HOY);
	const nueva = () => tocar(page, '+');

	// 1
	await nueva();
	await irAPestana(page, 'Cuándo');
	await expect(page.getByRole('radio', { name: 'No se repite' })).toBeChecked();
	await cierraDirecto(page);

	// 2
	await nueva();
	await titulo(page).fill('   ');
	await cierraDirecto(page);

	// 3
	await nueva();
	await titulo(page).fill('Pagar');
	await cerrarYVerAviso(page);
	await tocarEnAviso(page, 'Seguir editando');
	await panelAbierto(page);
	await expect(titulo(page)).toHaveValue('Pagar');
	await tocar(page, 'Cerrar');
	await tocarEnAviso(page, 'Descartar');
	await panelCerrado(page);
	await expect(page.getByRole('listitem')).toHaveCount(0);

	// 4
	await nueva();
	await irAPestana(page, 'Cuándo');
	await page.getByRole('radio', { name: 'Intervalo' }).check();
	await pideConfirmacion(page);
	await nueva();
	await irAPestana(page, 'Cuándo');
	await page.getByRole('radio', { name: 'Intervalo' }).check();
	await page.getByRole('radio', { name: 'No se repite' }).check();
	await cierraDirecto(page);

	// 5
	await nueva();
	await page.getByRole('combobox', { name: 'Esfuerzo' }).selectOption({ label: 'Media (≈ 15 min)' });
	await pideConfirmacion(page);

	// 6
	await nueva();
	await titulo(page).fill('Pagar');
	await titulo(page).fill('');
	await cierraDirecto(page);

	// 7
	await nueva();
	await titulo(page).fill('Pagar');
	await tocar(page, 'Cerrar');
	await tocarEnAviso(page, 'Guardar');
	await panelCerrado(page);
	await expect(fila(page, 'Pagar')).toBeVisible();
});

test('Flujo 4: acciones con cambios', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await crearRegar(page);
	const enAcciones = async () => {
		await irAPestana(page, 'Acciones');
		await pestanaAbiertaSiHay(page, 'Acciones');
	};
	await mostrarPausadas(page).click();
	await expect(mostrarPausadas(page)).toBeChecked();

	// 1
	await abrir(page, 'Regar');
	await enAcciones();
	await tocar(page, 'Pausar');
	await panelCerrado(page);
	await sinAviso(page);
	await expect(fila(page, 'Regar').getByText('Pausada')).toBeVisible();
	await mostrarPausadas(page).click();
	await expect(fila(page, 'Regar')).toHaveCount(0);
	await mostrarPausadas(page).click();
	await abrir(page, 'Regar');
	await enAcciones();
	await tocar(page, 'Reanudar');
	await panelCerrado(page);
	await sinAviso(page);
	await expect(fila(page, 'Regar').getByText('Pausada')).toHaveCount(0);

	// 2
	await abrir(page, 'Regar');
	await titulo(page).fill('Regar plantas');
	await enAcciones();
	await tocar(page, 'Pausar');
	await verAvisoDeAccion(page, 'pausar');
	await pestanaAbiertaSiHay(page, 'Acciones');

	// 3
	await tocarEnAviso(page, 'Seguir editando');
	await sinAviso(page);
	await pestanaAbiertaSiHay(page, 'Acciones');
	await irAPestana(page, 'Tarea');
	await expect(titulo(page)).toHaveValue('Regar plantas');
	await expect(fila(page, 'Regar').getByText('Pausada')).toHaveCount(0);

	// 4
	await enAcciones();
	await tocar(page, 'Pausar');
	await tocarEnAviso(page, 'Descartar y pausar');
	await panelCerrado(page);
	await expect(fila(page, 'Regar').getByText('Pausada')).toBeVisible();
	await expect(fila(page, 'Regar plantas')).toHaveCount(0);
	await abrir(page, 'Regar');
	await enAcciones();
	await tocar(page, 'Reanudar');
	await panelCerrado(page);

	// 5
	await abrir(page, 'Regar');
	await titulo(page).fill('Regar plantas');
	await enAcciones();
	await tocar(page, 'Pausar');
	await tocarEnAviso(page, 'Guardar y pausar');
	await panelCerrado(page);
	await expect(fila(page, 'Regar plantas').getByText('Pausada')).toBeVisible();

	// 6
	await abrir(page, 'Regar plantas');
	await nota(page).fill('Las del patio');
	await enAcciones();
	await tocar(page, 'Reanudar');
	await verAvisoDeAccion(page, 'reanudar');
	await tocarEnAviso(page, 'Guardar y reanudar');
	await panelCerrado(page);
	await expect(fila(page, 'Regar plantas').getByText('Pausada')).toHaveCount(0);
	await abrir(page, 'Regar plantas');
	await expect(nota(page)).toHaveValue('Las del patio');

	// 7
	await nota(page).fill('Otra nota');
	await enAcciones();
	for (const [opcion, texto] of [
		['1 hora', 'posponer 1 hora'],
		['3 horas', 'posponer 3 horas'],
		['Hasta mañana', 'posponer hasta mañana']
	] as const) {
		await tocar(page, opcion);
		await verAvisoDeAccion(page, texto);
		await tocarEnAviso(page, 'Seguir editando');
		await sinAviso(page);
	}
	await tocar(page, 'Cerrar');
	await tocarEnAviso(page, 'Descartar');
	await panelCerrado(page);

	// 8
	await abrir(page, 'Regar plantas');
	await nota(page).fill('Con hora');
	await enAcciones();
	await tocar(page, '1 hora');
	await verAvisoDeAccion(page, 'posponer 1 hora');
	await page.clock.runFor(3 * 60 * 1000);
	await tocarEnAviso(page, 'Guardar y posponer 1 hora');
	await panelCerrado(page);
	await abrir(page, 'Regar plantas');
	await expect(page.getByText('Pospuesta hasta 09:03')).toBeVisible();

	// 9
	await nota(page).fill('Cambiada');
	await enAcciones();
	await tocar(page, 'Quitar posponer');
	await verAvisoDeAccion(page, 'quitar posponer');
	await tocarEnAviso(page, 'Descartar y quitar posponer');
	await panelCerrado(page);
	await abrir(page, 'Regar plantas');
	await expect(page.getByText(/Pospuesta hasta/)).toHaveCount(0);
	await tocar(page, 'Cerrar');
	await panelCerrado(page);

	// 8 (segunda parte): otra tarea con Descartar y posponer 3 horas a las 08:03
	await crear(page, { titulo: 'Pagar', tipo: 'No se repite' });
	await abrir(page, 'Pagar');
	await nota(page).fill('algo');
	await enAcciones();
	await tocar(page, '3 horas');
	await tocarEnAviso(page, 'Descartar y posponer 3 horas');
	await panelCerrado(page);
	await abrir(page, 'Pagar');
	await expect(page.getByText('Pospuesta hasta 11:03')).toBeVisible();
	await tocar(page, 'Cerrar');
	await panelCerrado(page);

	// 10
	await abrir(page, 'Regar plantas');
	await irAPestana(page, 'Cuándo');
	await page.getByRole('radio', { name: 'No se repite' }).check();
	await enAcciones();
	await tocar(page, 'Pausar');
	await expect(aviso(page)).toBeVisible();
	await expect(aviso(page).getByText('Con estos cambios la tarea ya no se puede pausar')).toBeVisible();
	await expect(botonesDelAviso(page)).toHaveText(['Seguir editando', 'Descartar y pausar']);
	await tocarEnAviso(page, 'Descartar y pausar');
	await panelCerrado(page);
	await expect(fila(page, 'Regar plantas').getByText('Pausada')).toBeVisible();

	// 11
	await abrir(page, 'Regar plantas');
	await irAPestana(page, 'Cuándo');
	await page.getByRole('radio', { name: 'No se repite' }).check();
	await enAcciones();
	await tocar(page, 'Reanudar');
	await expect(aviso(page).getByText('Con estos cambios la tarea ya no se puede reanudar')).toBeVisible();
	await expect(boton(page, 'Guardar y reanudar')).toHaveCount(0);
	await tocarEnAviso(page, 'Seguir editando');
	await tocar(page, 'Cerrar');
	await tocarEnAviso(page, 'Descartar');
	await panelCerrado(page);
	await abrir(page, 'Regar plantas');
	await enAcciones();
	await tocar(page, 'Reanudar');
	await panelCerrado(page);

	// 12
	await abrir(page, 'Regar plantas');
	await titulo(page).fill('');
	await enAcciones();
	await tocar(page, 'Pausar');
	await verAvisoDeAccion(page, 'pausar');
	await tocarEnAviso(page, 'Guardar y pausar');
	await sinAviso(page);
	await panelAbierto(page);
	await expect(titulo(page)).toHaveValue('');
	await pestanaAbiertaSiHay(page, 'Tarea');
	await expect(page.getByText('Escribí un título.')).toBeVisible();
	await expect(fila(page, 'Regar plantas').getByText('Pausada')).toHaveCount(0);
	await tocar(page, 'Cerrar');
	await tocarEnAviso(page, 'Descartar');
	await panelCerrado(page);

	// 13
	await abrir(page, 'Regar plantas');
	await nota(page).fill('Cambio');
	await enAcciones();
	await tocar(page, 'Borrar tarea');
	await expect(aviso(page)).toHaveCount(0);
	const borrado = page.getByRole('alertdialog');
	await expect(borrado.getByRole('button', { name: 'Borrar', exact: true })).toBeVisible();
	await expect(borrado.getByRole('button', { name: 'Cancelar' })).toBeVisible();
	await borrado.getByRole('button', { name: 'Cancelar' }).click();
	await panelAbierto(page);
	await pestanaAbiertaSiHay(page, 'Acciones');
	await irAPestana(page, 'Tarea');
	await expect(nota(page)).toHaveValue('Cambio');
});

/** En el celular la pestaña `nombre` está abierta; en ancho no hay pestañas. */
async function pestanaAbiertaSiHay(page: Page, nombre: string) {
	if ((await pestana(page, nombre).count()) > 0) await pestanaAbierta(page, nombre);
}

test('Flujo 5: los avisos sobre el panel', async ({ page, context }) => {
	await sesionConReloj(page, HOY);
	await crearRegar(page);

	// 1
	await abrir(page, 'Regar');
	await irAPestana(page, 'Cuándo');
	await cada(page).fill('3');
	await tocar(page, 'Cerrar');
	await expect(aviso(page)).toBeVisible();
	await pestana(page, 'Tarea').click({ force: true });
	await expect(aviso(page)).toBeVisible();
	await pestanaAbierta(page, 'Cuándo');

	// 2
	await tocarEnAviso(page, 'Seguir editando');
	await pestanaAbierta(page, 'Cuándo');
	await expect(cada(page)).toHaveValue('3');

	// 3
	await irAPestana(page, 'Acciones');
	await tocar(page, 'Pausar');
	await verAvisoDeAccion(page, 'pausar');
	await tocarEnAviso(page, 'Seguir editando');
	await pestanaAbierta(page, 'Acciones');
	await irAPestana(page, 'Cuándo');
	await expect(cada(page)).toHaveValue('3');

	// 4
	await ancho(page);
	await tocar(page, 'Cerrar');
	const caja = await aviso(page).boundingBox();
	const encabezado = await page.getByRole('dialog').first().locator('header').boundingBox();
	expect(caja).not.toBeNull();
	expect(encabezado).not.toBeNull();
	await expect(aviso(page)).toBeVisible();
	const cubre = await page.evaluate(() => {
		const a = document.querySelector('[role=alertdialog]')!.getBoundingClientRect();
		return { ancho: a.width >= window.innerWidth - 1, alto: a.height >= window.innerHeight - 1 };
	});
	expect(cubre.ancho).toBe(true);
	await tocarEnAviso(page, 'Seguir editando');
	await expect(cada(page)).toHaveValue('3');
	await ancho(page).then(() => page.setViewportSize({ width: 360, height: 640 }));

	// 5
	await context.setOffline(true);
	await tocar(page, 'Cerrar');
	await expect(aviso(page)).toBeVisible();
	await expect(page.getByText('Sin conexión').first()).toBeVisible();
	await context.setOffline(false);
	await tocarEnAviso(page, 'Descartar');
	await panelCerrado(page);
});

test('Flujo 6: botón Atrás', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await crearRegar(page);
	await completar(page, 'Regar');
	await page.clock.runFor(5000);
	await encenderCompletadas(page);
	const atras = async () => {
		await page.goBack();
		await page.clock.runFor(100);
	};
	const enPendientes = () => expect(page.getByRole('heading', { name: 'Pendientes', level: 1 })).toBeVisible();
	await irA(page, 'Historial');
	await irA(page, 'Pendientes');
	await expect(fila(page, 'Regar')).toBeVisible();

	// 1
	await abrir(page, 'Regar');
	await atras();
	await panelCerrado(page);
	await enPendientes();

	// 2
	await irA(page, 'Historial');
	await page.getByRole('button', { name: 'Regar' }).first().click();
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await atras();
	await panelCerrado(page);
	await expect(page.getByRole('heading', { name: 'Historial', level: 1 })).toBeVisible();
	await irA(page, 'Pendientes');

	// 3
	await abrir(page, 'Regar');
	await titulo(page).fill('Regar plantas');
	await atras();
	await expect(aviso(page)).toBeVisible();
	await panelAbierto(page);
	await atras();
	await sinAviso(page);
	await panelAbierto(page);
	await expect(titulo(page)).toHaveValue('Regar plantas');
	await atras();
	await expect(aviso(page)).toBeVisible();
	await tocarEnAviso(page, 'Descartar');
	await panelCerrado(page);

	// 4
	await abrir(page, 'Regar');
	await irAPestana(page, 'Acciones');
	await tocar(page, 'Borrar tarea');
	await expect(page.getByRole('alertdialog').getByRole('button', { name: 'Borrar', exact: true })).toBeVisible();
	await atras();
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
	await panelAbierto(page);
	await pestanaAbiertaSiHay(page, 'Acciones');
	await atras();
	await panelCerrado(page);

	// 5
	await abrir(page, 'Regar');
	await irAPestana(page, 'Tarea');
	await page.getByRole('button', { name: /^(Elegir|Cambiar) emoji/ }).click();
	await expect(selectorEmoji(page)).toBeVisible();
	await atras();
	await expect(selectorEmoji(page)).toHaveCount(0);
	await panelAbierto(page);
	await expect(page.getByRole('button', { name: 'Elegir emoji' })).toBeVisible();
	await atras();
	await panelCerrado(page);

	// 6
	await abrir(page, 'Regar');
	await titulo(page).fill('Regar plantas');
	await irAPestana(page, 'Acciones');
	await tocar(page, 'Pausar');
	await verAvisoDeAccion(page, 'pausar');
	await atras();
	await sinAviso(page);
	await panelAbierto(page);
	await irAPestana(page, 'Tarea');
	await expect(titulo(page)).toHaveValue('Regar plantas');
	await expect(fila(page, 'Regar').getByText('Pausada')).toHaveCount(0);
	await atras();
	await expect(aviso(page)).toBeVisible();
	await tocarEnAviso(page, 'Seguir editando');
	await tocar(page, 'Cerrar');
	await tocarEnAviso(page, 'Descartar');
	await panelCerrado(page);

	// 7
	await abrir(page, 'Regar');
	await campoEtiquetas(page).fill('ca');
	await atras();
	await expect(aviso(page)).toBeVisible();
	await tocarEnAviso(page, 'Descartar');
	await panelCerrado(page);

	// 8
	await crear(page, { titulo: 'Pagar', tipo: 'No se repite' });
	await completar(page, 'Pagar');
	const deshacer = page.getByRole('status').filter({ hasText: 'Completaste' });
	await expect(deshacer).toBeVisible();
	await abrir(page, 'Regar');
	await atras();
	await panelCerrado(page);
	await enPendientes();
	await expect(deshacer).toBeVisible();
	await page.clock.runFor(2000);
	await expect(deshacer).toBeVisible();
	await page.clock.runFor(4000);
	await expect(deshacer).toHaveCount(0);

	// 9
	await abrir(page, 'Regar');
	await titulo(page).click();
	await page.setViewportSize({ width: 360, height: 300 });
	await expect(boton(page, 'Guardar')).toBeHidden();
	await atras();
	await expect(titulo(page)).not.toBeFocused();
	await panelAbierto(page);
	await page.setViewportSize({ width: 360, height: 640 });
	await atras();
	await panelCerrado(page);
	await abrir(page, 'Regar');
	await titulo(page).fill('Regar plantas');
	await page.setViewportSize({ width: 360, height: 300 });
	await expect(boton(page, 'Guardar')).toBeHidden();
	await atras();
	await expect(titulo(page)).not.toBeFocused();
	await expect(aviso(page)).toHaveCount(0);
	await page.setViewportSize({ width: 360, height: 640 });
	await atras();
	await expect(aviso(page)).toBeVisible();
	await tocarEnAviso(page, 'Descartar');
	await panelCerrado(page);

	// 10
	await irA(page, 'Historial');
	await irA(page, 'Pendientes');
	await crear(page, { titulo: 'Otra', tipo: 'No se repite' });
	await irA(page, 'Historial');
	await irA(page, 'Pendientes');
	for (const como of ['X', 'Guardar', 'Acción'] as const) {
		await abrir(page, 'Otra');
		if (como === 'X') await tocar(page, 'Cerrar');
		else if (como === 'Guardar') await tocar(page, 'Guardar');
		else {
			await irAPestana(page, 'Acciones');
			await tocar(page, '1 hora');
		}
		await panelCerrado(page);
		await page.goBack();
		await page.clock.runFor(100);
		await expect(page.getByRole('heading', { name: 'Historial', level: 1 })).toBeVisible();
		await page.goForward();
		await page.clock.runFor(100);
		await panelCerrado(page);
		await expect(page.getByRole('heading', { name: 'Pendientes', level: 1 })).toBeVisible();
		if (como === 'Acción') break;
	}

	// 12
	await abrir(page, 'Pagar');
	await titulo(page).fill('Pagar luz');
	const dialogos: string[] = [];
	page.on('dialog', (d) => {
		dialogos.push(d.type());
		void d.dismiss();
	});
	await atras();
	await expect(aviso(page)).toBeVisible();
	expect(dialogos).toEqual([]);
});

test('Flujo 6 paso 11: Atrás en ancho', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await ancho(page);
	await crearRegar(page);
	await completar(page, 'Regar');
	await page.clock.runFor(5000);
	await encenderCompletadas(page);
	const atras = async () => {
		await page.goBack();
		await page.clock.runFor(100);
	};
	await irA(page, 'Historial');
	await irA(page, 'Pendientes');
	await abrir(page, 'Regar');
	await atras();
	await panelCerrado(page);
	await expect(page.getByRole('heading', { name: 'Pendientes', level: 1 })).toBeVisible();

	await abrir(page, 'Regar');
	await titulo(page).fill('Regar plantas');
	await atras();
	await expect(aviso(page)).toBeVisible();
	await atras();
	await sinAviso(page);
	await panelAbierto(page);
	await atras();
	await tocarEnAviso(page, 'Descartar');
	await panelCerrado(page);

	await abrir(page, 'Regar');
	await tocar(page, 'Borrar tarea');
	await atras();
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
	await panelAbierto(page);
	await atras();
	await panelCerrado(page);
});

test('Flujo 7: recargar o cerrar la app', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await crearRegar(page);

	const confirmaciones: string[] = [];
	let aceptar = true;
	page.on('dialog', (d) => {
		confirmaciones.push(d.type());
		void (aceptar ? d.accept() : d.dismiss());
	});
	const recargarSin = async () => {
		confirmaciones.length = 0;
		await page.reload();
		expect(confirmaciones).toEqual([]);
		await expect(page.getByRole('heading', { name: 'Pendientes', level: 1 })).toBeVisible();
	};
	/** Recarga aceptando la confirmación y comprueba que apareció. */
	const recargarCon = async () => {
		confirmaciones.length = 0;
		aceptar = true;
		await page.reload();
		expect(confirmaciones).toEqual(['beforeunload']);
		await expect(page.getByRole('heading', { name: 'Pendientes', level: 1 })).toBeVisible();
	};
	const tocarPagina = () => page.mouse.click(5, 5);

	// 1
	await abrir(page, 'Regar');
	await titulo(page).fill('Regar plantas');
	await tocarPagina();
	confirmaciones.length = 0;
	aceptar = false;
	void page.reload().catch(() => {});
	await expect.poll(() => confirmaciones).toEqual(['beforeunload']);
	await panelAbierto(page);
	await expect(titulo(page)).toHaveValue('Regar plantas');
	await recargarCon();
	await panelCerrado(page);
	await expect(fila(page, 'Regar')).toBeVisible();
	await expect(fila(page, 'Regar plantas')).toHaveCount(0);

	// 2
	await abrir(page, 'Regar');
	await recargarSin();

	// 3
	await abrir(page, 'Regar');
	await campoEtiquetas(page).fill('ca');
	await recargarCon();
	await abrir(page, 'Regar');
	await campoEtiquetas(page).fill('   ');
	await recargarSin();

	// 5
	await abrir(page, 'Regar');
	await titulo(page).fill('Regar plantas');
	await irAPestana(page, 'Acciones');
	await tocar(page, 'Pausar');
	await expect(aviso(page)).toBeVisible();
	await recargarCon();

	// 6
	await abrir(page, 'Regar');
	await titulo(page).fill('Regar plantas');
	await tocar(page, 'Cerrar');
	await tocarEnAviso(page, 'Descartar');
	await panelCerrado(page);
	await recargarSin();

	// 7
	await tocar(page, '+');
	await recargarSin();
	await tocar(page, '+');
	await titulo(page).fill('Pagar');
	await recargarCon();

	// 8
	await abrir(page, 'Regar');
	await titulo(page).fill('Regar plantas');
	confirmaciones.length = 0;
	await page.goBack();
	await page.clock.runFor(100);
	await expect(aviso(page)).toBeVisible();
	expect(confirmaciones).toEqual([]);
	await tocarEnAviso(page, 'Descartar');
	await panelCerrado(page);

	// 4 (cierra la página)
	await abrir(page, 'Regar');
	await titulo(page).fill('Regar plantas');
	await tocar(page, 'Cerrar');
	await expect(aviso(page)).toBeVisible();
	confirmaciones.length = 0;
	await tocarPagina();
	const cierre = page.close({ runBeforeUnload: true });
	await expect.poll(() => confirmaciones).toEqual(['beforeunload']);
	await cierre;
});

test('Flujo 8: dos dispositivos con el panel abierto', async ({ browser }) => {
	test.setTimeout(240_000);
	const { a, b, cerrar: fin } = await dosDispositivos(browser, HOY);
	try {
		await a.setViewportSize({ width: 360, height: 640 });
		await crearRegar(a);
		await expect(fila(b, 'Regar')).toBeVisible();
		const renombrarEnB = async (de: string, a2: string) => {
			await abrir(b, de);
			await titulo(b).fill(a2);
			await tocar(b, 'Guardar');
			await panelCerrado(b);
			await llegaAlServidor(b);
		};

		// 1
		await abrir(a, 'Regar');
		await nota(a).fill('Las del patio');
		await renombrarEnB('Regar', 'Regar plantas');
		await expect(titulo(a)).toHaveValue('Regar');
		await tocar(a, 'Cerrar');
		await expect(aviso(a)).toBeVisible();
		await tocarEnAviso(a, 'Descartar');
		await panelCerrado(a);

		// 2
		await expect(fila(a, 'Regar plantas')).toBeVisible();
		await abrir(a, 'Regar plantas');
		await renombrarEnB('Regar plantas', 'Regar flores');
		await tocar(a, 'Cerrar');
		await panelCerrado(a);
		await sinAviso(a);

		// 3
		await expect(fila(a, 'Regar flores')).toBeVisible();
		await abrir(a, 'Regar flores');
		await nota(a).fill('Otra nota');
		await tocar(a, 'Cerrar');
		await expect(aviso(a)).toBeVisible();
		await borrarEnB(b, 'Regar flores');
		await panelCerrado(a);
		await sinAviso(a);
		await expect(fila(a, 'Regar flores')).toHaveCount(0);

		// 4
		await crear(a, { titulo: 'Pagar', tipo: 'No se repite' });
		await expect(fila(b, 'Pagar')).toBeVisible();
		await abrir(a, 'Pagar');
		await nota(a).fill('algo');
		await tocar(a, 'Cerrar');
		await expect(aviso(a)).toBeVisible();
		await borrarEnB(b, 'Pagar');
		await panelCerrado(a);
		await sinAviso(a);
		await expect(fila(a, 'Pagar')).toHaveCount(0);

		// 5
		await crearRegar(a);
		await expect(fila(b, 'Regar')).toBeVisible();
		await abrir(a, 'Regar');
		await nota(a).fill('Las del patio');
		await irAPestana(a, 'Acciones');
		await tocar(a, 'Pausar');
		await verAvisoDeAccion(a, 'pausar');
		await abrir(b, 'Regar');
		await irAPestana(b, 'Acciones');
		await tocar(b, 'Pausar');
		await panelCerrado(b);
		await sinAviso(a);
		await panelAbierto(a);
		await pestanaAbiertaSiHay(a, 'Acciones');
		await expect(boton(a, 'Reanudar')).toBeVisible();
		await irAPestana(a, 'Tarea');
		await expect(nota(a)).toHaveValue('Las del patio');

		// 6
		await irAPestana(a, 'Acciones');
		await tocar(a, 'Reanudar');
		await verAvisoDeAccion(a, 'reanudar');
		await mostrarPausadas(b).click();
		await expect(mostrarPausadas(b)).toBeChecked();
		await abrir(b, 'Regar');
		await irAPestana(b, 'Acciones');
		await tocar(b, 'Reanudar');
		await panelCerrado(b);
		await sinAviso(a);
		await panelAbierto(a);
		await irAPestana(a, 'Tarea');
		await expect(nota(a)).toHaveValue('Las del patio');
		await tocar(a, 'Cerrar');
		await tocarEnAviso(a, 'Descartar');
		await panelCerrado(a);

		// 8
		await abrir(a, 'Regar');
		await nota(a).fill('Otra');
		await irAPestana(a, 'Acciones');
		await tocar(a, 'Pausar');
		await expect(aviso(a)).toBeVisible();
		await borrarEnB(b, 'Regar');
		await panelCerrado(a);
		await sinAviso(a);
		await expect(fila(a, 'Regar')).toHaveCount(0);
	} finally {
		await fin();
	}
});

test('Flujo 8 paso 7: el aviso de quitar posponer se cierra solo', async ({ page, browser }) => {
	await sesionConReloj(page, HOY);
	await crearRegar(page);
	await abrir(page, 'Regar');
	await irAPestana(page, 'Acciones');
	await tocar(page, '1 hora');
	await panelCerrado(page);
	await page.clock.runFor(30 * 60 * 1000);
	await abrir(page, 'Regar');
	await nota(page).fill('Otra nota');
	await irAPestana(page, 'Acciones');
	await tocar(page, 'Quitar posponer');
	await verAvisoDeAccion(page, 'quitar posponer');
	await page.clock.runFor(31 * 60 * 1000);
	await sinAviso(page);
	await panelAbierto(page);
	await irAPestana(page, 'Tarea');
	await expect(nota(page)).toHaveValue('Otra nota');
	void browser;
});

/** B borra la tarea desde su panel. */
async function borrarEnB(b: Page, nombre: string) {
	await abrir(b, nombre);
	await irAPestana(b, 'Acciones');
	await tocar(b, 'Borrar tarea');
	await b.getByRole('alertdialog').getByRole('button', { name: 'Borrar', exact: true }).click();
	await panelCerrado(b);
	await llegaAlServidor(b);
}

test('Flujo 9: Descartar no quita un emoji de Recientes', async ({ page }) => {
	await sesionConReloj(page, HOY);

	// 1
	await tocar(page, '+');
	await elegirEmoji(page, '🌱');
	await expect(page.getByRole('button', { name: /^Cambiar emoji/ })).toContainText('🌱');

	// 2
	await tocar(page, 'Cerrar');
	await tocarEnAviso(page, 'Descartar');
	await panelCerrado(page);
	await expect(page.getByRole('listitem')).toHaveCount(0);

	// 3
	await tocar(page, '+');
	await page.getByRole('button', { name: 'Elegir emoji' }).click();
	await expect(selectorEmoji(page)).toBeVisible();
	const recientes = selectorEmoji(page).locator('section[aria-labelledby="titulo-recientes"]').getByRole('button');
	await expect(recientes.first()).toHaveText('🌱');
});
