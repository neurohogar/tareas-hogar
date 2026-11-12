import { expect, test, type Page } from '@playwright/test';
import {
	abrir,
	adelantar,
	cerrar,
	completar,
	crear,
	dosDispositivos,
	editar,
	encenderCompletadas,
	esperarEstado,
	fila,
	irA,
	limpiarEmuladores,
	listaEs,
	llegaAlServidor,
	sesionConReloj
} from './apoyo';

test.beforeEach(async () => {
	await limpiarEmuladores();
});

const aviso = (page: Page) => page.getByRole('status').filter({ hasText: 'Completaste' });
const boton = (page: Page, nombre: string) => page.getByRole('button', { name: nombre, exact: true });
/** Las opciones de Posponer, a la vista en el panel (sin botón intermedio). */
const botonPosponer = (page: Page) => page.getByRole('group', { name: 'Posponer' });
const botonQuitar = (page: Page) => boton(page, 'Quitar posponer');
const mostrarPausadas = (page: Page) => page.getByRole('checkbox', { name: 'Pausadas' });
const panel = (page: Page) => page.getByRole('dialog');

type Opcion = '1 hora' | '3 horas' | 'Hasta mañana';

/** Abre la tarea, toca Posponer y elige la opción: el panel se cierra solo, sin Guardar. */
async function posponer(page: Page, titulo: string, opcion: Opcion) {
	await abrir(page, titulo);
	await expect(boton(page, '1 hora')).toBeVisible();
	await expect(boton(page, '3 horas')).toBeVisible();
	await expect(boton(page, 'Hasta mañana')).toBeVisible();
	await boton(page, opcion).click();
	await expect(panel(page)).toHaveCount(0);
}

/** Abre la tarea pospuesta y toca Quitar posponer: el panel se cierra solo, sin Guardar. */
async function quitar(page: Page, titulo: string) {
	await abrir(page, titulo);
	await botonQuitar(page).click();
	await expect(panel(page)).toHaveCount(0);
}

/** Panel de una tarea sin posponer: Posponer sí, Quitar posponer y "Pospuesta" no. */
async function panelSinPosponer(page: Page, titulo: string) {
	await abrir(page, titulo);
	await expect(botonPosponer(page)).toBeVisible();
	await expect(botonQuitar(page)).toHaveCount(0);
	await expect(panel(page).getByText(/Pospuesta/)).toHaveCount(0);
	await cerrar(page);
}

/** Panel de una pospuesta: dice el texto, ofrece Quitar posponer y no Posponer. */
async function panelPospuesta(page: Page, titulo: string, texto: string) {
	await abrir(page, titulo);
	await expect(panel(page).getByText(texto, { exact: true })).toBeVisible();
	await expect(botonQuitar(page)).toBeVisible();
	await expect(botonPosponer(page)).toHaveCount(0);
	await cerrar(page);
}

/** Fila pospuesta: en espera, no completada, sin "Atrasada", con la barra en `barra`. */
const verPospuesta = (page: Page, titulo: string, barra: number, habilitado = true) =>
	esperarEstado(page, titulo, 'en espera', barra, false, habilitado);

test('Flujo 1: posponer una atrasada 1 hora', async ({ page }) => {
	await sesionConReloj(page, '2026-07-15T10:00:00');
	await crear(page, { titulo: 'Cambiar foco', tipo: 'No se repite' });
	await crear(page, { titulo: 'Pagar la luz', tipo: 'No se repite', fecha: '2026-07-14' });
	await page.getByRole('button', { name: '+' }).click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await expect(botonPosponer(page)).toHaveCount(0);
	await cerrar(page);
	await listaEs(page, ['Pagar la luz', 'Cambiar foco']);
	await esperarEstado(page, 'Pagar la luz', 'atrasada', undefined, false);

	await abrir(page, 'Pagar la luz');
	await expect(botonPosponer(page)).toBeVisible();
	await expect(botonQuitar(page)).toHaveCount(0);
	await expect(panel(page).getByText(/Pospuesta/)).toHaveCount(0);
	await expect(boton(page, '1 hora')).toBeVisible();
	await expect(boton(page, '3 horas')).toBeVisible();
	await expect(boton(page, 'Hasta mañana')).toBeVisible();
	await boton(page, '1 hora').click();
	await expect(panel(page)).toHaveCount(0);

	await listaEs(page, ['Cambiar foco', 'Pagar la luz']);
	await verPospuesta(page, 'Pagar la luz', 0);
	await panelPospuesta(page, 'Pagar la luz', 'Pospuesta hasta 11:00');

	await adelantar(page, '2026-07-15T10:30:00');
	await verPospuesta(page, 'Pagar la luz', 50);
	await page.reload();
	await verPospuesta(page, 'Pagar la luz', 50);

	await adelantar(page, '2026-07-15T11:00:00');
	await esperarEstado(page, 'Pagar la luz', 'atrasada', undefined, false);
	await listaEs(page, ['Pagar la luz', 'Cambiar foco']);
	await panelSinPosponer(page, 'Pagar la luz');
});

test('Flujo 2: 3 horas y Hasta mañana, pasando la medianoche', async ({ page }) => {
	await sesionConReloj(page, '2026-07-15T22:00:00');
	for (const titulo of ['Cambiar foco', 'Barrer', 'Regar plantas'])
		await crear(page, { titulo, tipo: 'No se repite' });
	await listaEs(page, ['Cambiar foco', 'Barrer', 'Regar plantas']);

	await adelantar(page, '2026-07-15T22:30:00');
	await posponer(page, 'Barrer', 'Hasta mañana');
	await posponer(page, 'Cambiar foco', '3 horas');
	await listaEs(page, ['Regar plantas', 'Cambiar foco', 'Barrer']);

	await panelPospuesta(page, 'Cambiar foco', 'Pospuesta hasta mañana 01:30');
	await panelPospuesta(page, 'Barrer', 'Pospuesta hasta mañana 07:00');

	await adelantar(page, '2026-07-16T00:00:00');
	await panelPospuesta(page, 'Cambiar foco', 'Pospuesta hasta 01:30');

	await adelantar(page, '2026-07-16T01:30:00');
	await esperarEstado(page, 'Cambiar foco', 'pendiente', undefined, false);
	await listaEs(page, ['Cambiar foco', 'Regar plantas', 'Barrer']);

	await adelantar(page, '2026-07-16T02:00:00');
	await posponer(page, 'Regar plantas', 'Hasta mañana');
	await panelPospuesta(page, 'Regar plantas', 'Pospuesta hasta mañana 07:00');

	await adelantar(page, '2026-07-16T07:00:00');
	await esperarEstado(page, 'Barrer', 'pendiente', undefined, false);
	await verPospuesta(page, 'Regar plantas', 17);
	await listaEs(page, ['Cambiar foco', 'Barrer', 'Regar plantas']);
});

test('Flujo 3: quitar posponer, completar, deshacer y editar', async ({ page }) => {
	await sesionConReloj(page, '2026-07-15T10:00:00');
	await crear(page, { titulo: 'Pagar la luz', tipo: 'No se repite', fecha: '2026-07-14' });
	await posponer(page, 'Pagar la luz', '3 horas');
	await verPospuesta(page, 'Pagar la luz', 0);

	await quitar(page, 'Pagar la luz');
	await esperarEstado(page, 'Pagar la luz', 'atrasada', undefined, false);
	await panelSinPosponer(page, 'Pagar la luz');

	await adelantar(page, '2026-07-15T10:05:00');
	await posponer(page, 'Pagar la luz', '3 horas');
	await adelantar(page, '2026-07-15T10:30:00');
	await completar(page, 'Pagar la luz');
	await expect(aviso(page)).toContainText('Completaste «Pagar la luz»');
	await expect(fila(page, 'Pagar la luz')).toHaveCount(0);

	await aviso(page).getByRole('button', { name: 'Deshacer' }).click();
	await verPospuesta(page, 'Pagar la luz', 14);
	await abrir(page, 'Pagar la luz');
	await expect(panel(page).getByText('Pospuesta hasta 13:05', { exact: true })).toBeVisible();

	await page.getByLabel('Título').fill('Pagar el gas');
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(panel(page)).toHaveCount(0);
	await verPospuesta(page, 'Pagar el gas', 14);
	await panelPospuesta(page, 'Pagar el gas', 'Pospuesta hasta 13:05');

	await adelantar(page, '2026-07-15T13:05:00');
	await esperarEstado(page, 'Pagar el gas', 'atrasada', undefined, false);
});

test('Flujo 4: periódicas pospuestas', async ({ page }) => {
	await sesionConReloj(page, '2026-07-15T08:00:00');
	await crear(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '4', unidad: 'horas' });
	await crear(page, { titulo: 'Barrer', tipo: 'Intervalo', cada: '4', unidad: 'horas' });
	await completar(page, 'Regar');
	await completar(page, 'Barrer');
	await listaEs(page, []);

	await adelantar(page, '2026-07-15T12:30:00');
	await esperarEstado(page, 'Regar', 'pendiente', undefined, false);
	await esperarEstado(page, 'Barrer', 'pendiente', undefined, false);
	await posponer(page, 'Regar', '3 horas');
	await posponer(page, 'Barrer', '3 horas');
	await listaEs(page, ['Regar', 'Barrer']);
	await verPospuesta(page, 'Regar', 0);
	await verPospuesta(page, 'Barrer', 0);

	await adelantar(page, '2026-07-15T13:00:00');
	await completar(page, 'Regar');
	await expect(aviso(page)).toContainText('Completaste «Regar»');
	await expect(fila(page, 'Regar')).toHaveCount(0);
	await irA(page, 'Historial');
	await expect(page.getByRole('listitem').filter({ hasText: /^Regar\s*08:00/ })).toHaveCount(1);
	await expect(page.getByRole('listitem').filter({ hasText: /^Regar\s*13:00/ })).toHaveCount(1);
	await irA(page, 'Pendientes');

	await encenderCompletadas(page);
	await esperarEstado(page, 'Regar', 'en espera');
	await panelPospuesta(page, 'Regar', 'Pospuesta hasta 15:30');

	await adelantar(page, '2026-07-15T15:30:00');
	await esperarEstado(page, 'Barrer', 'pendiente', undefined, false);
	await esperarEstado(page, 'Regar', 'en espera');

	await adelantar(page, '2026-07-15T16:00:00');
	await esperarEstado(page, 'Barrer', 'atrasada', undefined, false);
});

test('Flujo 5: posponer con horario', async ({ page }) => {
	await sesionConReloj(page, '2026-07-15T07:00:00');
	await crear(page, {
		titulo: 'Ventilar',
		tipo: 'No se repite',
		horario: { desde: '08:00', hasta: '11:00' }
	});
	await esperarEstado(page, 'Ventilar', 'en espera', undefined, false, false);
	await abrir(page, 'Ventilar');
	await expect(botonPosponer(page)).toHaveCount(0);
	await cerrar(page);

	await adelantar(page, '2026-07-15T09:00:00');
	await esperarEstado(page, 'Ventilar', 'pendiente', undefined, false);
	await posponer(page, 'Ventilar', '3 horas');

	await adelantar(page, '2026-07-15T09:30:00');
	await verPospuesta(page, 'Ventilar', 17);

	await adelantar(page, '2026-07-15T11:30:00');
	await esperarEstado(page, 'Ventilar', 'en espera', undefined, false, false);
	await fila(page, 'Ventilar').getByRole('checkbox').click({ force: true });
	await expect(aviso(page)).toHaveCount(0);

	await adelantar(page, '2026-07-15T12:00:00');
	await esperarEstado(page, 'Ventilar', 'en espera', undefined, false, false);
	await abrir(page, 'Ventilar');
	await expect(panel(page).getByText(/Pospuesta/)).toHaveCount(0);
	await expect(botonPosponer(page)).toHaveCount(0);
	await cerrar(page);
});

test('Flujo 6: pausar y posponer', async ({ page }) => {
	await sesionConReloj(page, '2026-07-15T10:00:00');
	await crear(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await abrir(page, 'Regar');
	await expect(botonPosponer(page)).toBeVisible();
	await expect(boton(page, 'Pausar')).toBeVisible();
	await boton(page, 'Pausar').click();
	await expect(panel(page)).toHaveCount(0);

	await mostrarPausadas(page).click();
	await expect(mostrarPausadas(page)).toBeChecked();
	await abrir(page, 'Regar');
	await expect(panel(page).getByText('Pausada')).toBeVisible();
	await expect(botonPosponer(page)).toHaveCount(0);
	await boton(page, 'Reanudar').click();
	await expect(panel(page)).toHaveCount(0);
	await esperarEstado(page, 'Regar', 'pendiente', undefined, false);

	await posponer(page, 'Regar', '3 horas');
	await abrir(page, 'Regar');
	await expect(botonQuitar(page)).toBeVisible();
	await expect(boton(page, 'Pausar')).toBeVisible();
	await boton(page, 'Pausar').click();
	await expect(panel(page)).toHaveCount(0);
	await expect(fila(page, 'Regar').getByText('Pausada')).toHaveCount(1);
	await expect(fila(page, 'Regar').getByRole('progressbar')).toHaveCount(0);

	await adelantar(page, '2026-07-15T11:30:00');
	await abrir(page, 'Regar');
	await boton(page, 'Reanudar').click();
	await expect(panel(page)).toHaveCount(0);
	await verPospuesta(page, 'Regar', 50);
});

test('Flujo 7: dos dispositivos', async ({ browser }) => {
	const { a, b, ctxB, cerrar: fin } = await dosDispositivos(browser, '2026-07-15T10:00:00');
	await crear(a, { titulo: 'Pagar la luz', tipo: 'No se repite' });
	await expect(fila(b, 'Pagar la luz')).toBeVisible();

	await ctxB.setOffline(true);
	await posponer(a, 'Pagar la luz', '3 horas');
	await llegaAlServidor(a);
	await editar(b, 'Pagar la luz', { titulo: 'Pagar el gas' });
	await ctxB.setOffline(false);
	await llegaAlServidor(b);
	await panelPospuesta(a, 'Pagar el gas', 'Pospuesta hasta 13:00');
	await panelPospuesta(b, 'Pagar el gas', 'Pospuesta hasta 13:00');

	await quitar(a, 'Pagar el gas');
	await llegaAlServidor(a);
	await esperarEstado(b, 'Pagar el gas', 'pendiente', undefined, false);
	await ctxB.setOffline(true);
	await adelantar(a, '2026-07-15T10:10:00');
	await posponer(a, 'Pagar el gas', '3 horas');
	await llegaAlServidor(a);
	await adelantar(b, '2026-07-15T10:15:00');
	await posponer(b, 'Pagar el gas', '1 hora');
	await ctxB.setOffline(false);
	await llegaAlServidor(b);
	await panelPospuesta(a, 'Pagar el gas', 'Pospuesta hasta 11:15');
	await panelPospuesta(b, 'Pagar el gas', 'Pospuesta hasta 11:15');
	await fin();
});

test('Flujo 8: dos dispositivos con relojes desfasados', async ({ browser }) => {
	const { a, b, cerrar: fin } = await dosDispositivos(browser, '2026-07-15T08:00:00');
	await adelantar(a, '2026-07-15T08:05:00');
	await crear(a, { titulo: 'Pagar la luz', tipo: 'No se repite' });
	await expect(fila(b, 'Pagar la luz')).toBeVisible();
	await esperarEstado(b, 'Pagar la luz', 'pendiente', undefined, false);

	await posponer(a, 'Pagar la luz', '1 hora');
	await panelPospuesta(a, 'Pagar la luz', 'Pospuesta hasta 09:05');
	await verPospuesta(a, 'Pagar la luz', 0);

	await llegaAlServidor(b);
	await verPospuesta(b, 'Pagar la luz', 0);
	await panelPospuesta(b, 'Pagar la luz', 'Pospuesta hasta 09:05');

	await adelantar(a, '2026-07-15T08:35:00');
	await adelantar(b, '2026-07-15T08:30:00');
	await verPospuesta(a, 'Pagar la luz', 50);
	await verPospuesta(b, 'Pagar la luz', 42);
	await fin();
});
