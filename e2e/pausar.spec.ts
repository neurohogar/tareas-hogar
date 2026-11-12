import { expect, test, type Page } from '@playwright/test';
import {
	abrir,
	adelantar,
	atenuada,
	cerrar,
	completar,
	conmutarMostrarCompletadas,
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
const botonPausar = (page: Page) => page.getByRole('button', { name: 'Pausar', exact: true });
const botonReanudar = (page: Page) => page.getByRole('button', { name: 'Reanudar', exact: true });
const mostrarPausadas = (page: Page) => page.getByRole('checkbox', { name: 'Pausadas' });

async function conmutarPausadas(page: Page, encendido: boolean) {
	await mostrarPausadas(page).click();
	if (encendido) await expect(mostrarPausadas(page)).toBeChecked();
	else await expect(mostrarPausadas(page)).not.toBeChecked();
}

/** Abre la tarea y toca Pausar: el panel se cierra solo, sin Guardar. */
async function pausar(page: Page, titulo: string) {
	await abrir(page, titulo);
	await expect(botonReanudar(page)).toHaveCount(0);
	await botonPausar(page).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
}

/** Abre la tarea pausada y toca Reanudar: el panel se cierra solo, sin Guardar. */
async function reanudar(page: Page, titulo: string) {
	await abrir(page, titulo);
	await expect(page.getByRole('dialog').getByText('Pausada')).toBeVisible();
	await expect(botonPausar(page)).toHaveCount(0);
	await botonReanudar(page).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
}

/** Fila pausada: atenuada, con "Pausada", sin "Atrasada", sin barra y con el checkbox deshabilitado. */
async function verPausada(page: Page, titulo: string) {
	const f = fila(page, titulo);
	await expect(f).toBeVisible();
	await expect(f.getByText('Pausada')).toHaveCount(1);
	await expect(f.getByText('Atrasada')).toHaveCount(0);
	await expect(f.getByRole('progressbar')).toHaveCount(0);
	const check = f.getByRole('checkbox');
	await expect(check).toBeDisabled();
	expect(await atenuada(f)).toBe(true);
}

async function noPausada(page: Page, titulo: string) {
	await expect(fila(page, titulo).getByText('Pausada')).toHaveCount(0);
}

async function tocarDeshabilitado(page: Page, titulo: string) {
	await fila(page, titulo).getByRole('checkbox').click({ force: true });
	await expect(aviso(page)).toHaveCount(0);
}

async function ultimaVez(page: Page, texto: string) {
	await expect(page.getByText(/^Última vez/)).toHaveText(`Última vez: ${texto}`);
}

async function entradasDelHistorial(page: Page, titulo: string, hora: string, cantidad: number) {
	await irA(page, 'Historial');
	await expect(
		page.getByRole('listitem').filter({ hasText: new RegExp(`^${titulo}\\s*${hora}`) })
	).toHaveCount(cantidad);
	await irA(page, 'Pendientes');
}

test('Flujo 1: pausar y reanudar una relativa', async ({ page }) => {
	await sesionConReloj(page, '2026-07-14T09:00:00');
	await crear(page, { titulo: 'Cambiar foco', tipo: 'No se repite' });
	await page.getByRole('button', { name: '+' }).click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await expect(botonPausar(page)).toHaveCount(0);
	await expect(botonReanudar(page)).toHaveCount(0);
	await cerrar(page);
	await crear(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días' });

	await completar(page, 'Regar');
	await expect(fila(page, 'Regar')).toHaveCount(0);
	await listaEs(page, ['Cambiar foco']);

	await abrir(page, 'Cambiar foco');
	await expect(botonPausar(page)).toHaveCount(0);
	await expect(botonReanudar(page)).toHaveCount(0);
	await cerrar(page);

	await encenderCompletadas(page);
	await abrir(page, 'Regar');
	await expect(botonPausar(page)).toBeVisible();
	await ultimaVez(page, 'hoy 09:00');
	await botonPausar(page).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await listaEs(page, ['Cambiar foco']);

	await conmutarPausadas(page, true);
	await listaEs(page, ['Cambiar foco', 'Regar']);
	await verPausada(page, 'Regar');
	await tocarDeshabilitado(page, 'Regar');
	await entradasDelHistorial(page, 'Regar', '09:00', 1);

	await abrir(page, 'Regar');
	await expect(page.getByRole('dialog').getByText('Pausada')).toBeVisible();
	await expect(botonReanudar(page)).toBeVisible();
	await expect(botonPausar(page)).toHaveCount(0);
	await ultimaVez(page, 'hoy 09:00');
	await cerrar(page);

	await adelantar(page, '2026-07-20T10:00:00');
	await verPausada(page, 'Regar');

	await page.reload();
	await expect(mostrarPausadas(page)).toBeChecked();
	await expect(page.getByRole('checkbox', { name: 'Completadas' })).toBeChecked();
	await verPausada(page, 'Regar');

	await reanudar(page, 'Regar');
	await esperarEstado(page, 'Regar', 'pendiente', undefined, false);
	await noPausada(page, 'Regar');
	await listaEs(page, ['Regar', 'Cambiar foco']);

	await abrir(page, 'Regar');
	await expect(botonPausar(page)).toBeVisible();
	await ultimaVez(page, 'hace 6 días');
	await cerrar(page);
	await entradasDelHistorial(page, 'Regar', '09:00', 1);

	await adelantar(page, '2026-07-25T10:00:00');
	await esperarEstado(page, 'Regar', 'pendiente', undefined, false);

	await adelantar(page, '2026-07-25T10:05:00');
	await completar(page, 'Regar');
	await expect(aviso(page)).toContainText('Completaste «Regar»');
	await esperarEstado(page, 'Regar', 'en espera', 0, true);
});

test('Flujo 2: reanudar una de calendario', async ({ page }) => {
	await sesionConReloj(page, '2026-07-07T09:00:00');
	await crear(page, { titulo: 'Sacar la basura', tipo: 'Días de la semana', dias: ['martes', 'jueves'] });
	await adelantar(page, '2026-07-07T09:01:00');
	await crear(page, { titulo: 'Cambiar sábanas', tipo: 'Días de la semana', dias: ['jueves'] });
	await encenderCompletadas(page);
	await completar(page, 'Sacar la basura');
	await completar(page, 'Cambiar sábanas');
	await esperarEstado(page, 'Sacar la basura', 'en espera');
	await esperarEstado(page, 'Cambiar sábanas', 'en espera');

	await conmutarPausadas(page, true);
	await pausar(page, 'Sacar la basura');
	await pausar(page, 'Cambiar sábanas');
	await conmutarMostrarCompletadas(page, false);
	await listaEs(page, ['Cambiar sábanas', 'Sacar la basura']);
	await verPausada(page, 'Sacar la basura');
	await verPausada(page, 'Cambiar sábanas');

	await adelantar(page, '2026-07-15T12:00:00');
	await reanudar(page, 'Sacar la basura');
	await esperarEstado(page, 'Sacar la basura', 'en espera', 0, false);

	await adelantar(page, '2026-07-15T18:00:00');
	await esperarEstado(page, 'Sacar la basura', 'en espera', 50, false);

	await adelantar(page, '2026-07-16T10:00:00');
	await esperarEstado(page, 'Sacar la basura', 'pendiente', undefined, false);
	await reanudar(page, 'Cambiar sábanas');
	await esperarEstado(page, 'Cambiar sábanas', 'pendiente', undefined, false);
	await conmutarPausadas(page, false);
	await listaEs(page, ['Sacar la basura', 'Cambiar sábanas']);

	await completar(page, 'Sacar la basura');
	await conmutarMostrarCompletadas(page, true);
	await esperarEstado(page, 'Sacar la basura', 'en espera');

	await adelantar(page, '2026-07-17T00:00:00');
	await esperarEstado(page, 'Cambiar sábanas', 'atrasada', undefined, false);
	await esperarEstado(page, 'Sacar la basura', 'en espera');
});

test('Flujo 3: completar después de reanudar cubre la próxima ocurrencia', async ({ page }) => {
	await sesionConReloj(page, '2026-07-07T09:00:00');
	await encenderCompletadas(page);
	await conmutarPausadas(page, true);
	await crear(page, { titulo: 'Sacar la basura', tipo: 'Días de la semana', dias: ['martes', 'jueves'] });
	await completar(page, 'Sacar la basura');
	await pausar(page, 'Sacar la basura');

	await adelantar(page, '2026-07-15T10:00:00');
	await reanudar(page, 'Sacar la basura');
	await esperarEstado(page, 'Sacar la basura', 'en espera', undefined, false);

	await adelantar(page, '2026-07-15T11:00:00');
	await completar(page, 'Sacar la basura');
	await expect(aviso(page)).toContainText('Completaste «Sacar la basura»');
	await esperarEstado(page, 'Sacar la basura', 'en espera');

	await adelantar(page, '2026-07-16T10:00:00');
	await esperarEstado(page, 'Sacar la basura', 'en espera');

	await adelantar(page, '2026-07-21T00:00:00');
	await esperarEstado(page, 'Sacar la basura', 'pendiente', undefined, false);
});

test('Flujo 4: reanudar con horario', async ({ page }) => {
	await sesionConReloj(page, '2026-07-10T09:00:00');
	await encenderCompletadas(page);
	await conmutarPausadas(page, true);
	await crear(page, {
		titulo: 'Ventilar',
		tipo: 'Días de la semana',
		dias: ['miércoles', 'viernes'],
		horario: { desde: '08:00', hasta: '11:00' }
	});
	await completar(page, 'Ventilar');
	await pausar(page, 'Ventilar');

	await adelantar(page, '2026-07-15T12:00:00');
	await reanudar(page, 'Ventilar');
	await esperarEstado(page, 'Ventilar', 'en espera', 0, false, false);

	await adelantar(page, '2026-07-15T23:00:00');
	await esperarEstado(page, 'Ventilar', 'en espera', 25, false, false);

	await adelantar(page, '2026-07-17T08:00:00');
	await esperarEstado(page, 'Ventilar', 'pendiente', undefined, false);

	await adelantar(page, '2026-07-17T11:00:00');
	await esperarEstado(page, 'Ventilar', 'atrasada', undefined, false, false);

	await pausar(page, 'Ventilar');
	await adelantar(page, '2026-07-22T09:00:00');
	await reanudar(page, 'Ventilar');
	await esperarEstado(page, 'Ventilar', 'pendiente', undefined, false);
	await adelantar(page, '2026-07-22T11:00:00');
	await esperarEstado(page, 'Ventilar', 'atrasada', undefined, false, false);
});

test('Flujo 5: Mostrar pausadas, orden y filtro', async ({ page }) => {
	await sesionConReloj(page, '2026-07-15T08:00:00');
	await crear(page, { titulo: 'Ñandú', tipo: 'Intervalo', cada: '1', unidad: 'días', etiquetas: ['Patio'] });
	await crear(page, { titulo: 'Nube', tipo: 'Intervalo', cada: '1', unidad: 'días', etiquetas: ['Casa'] });
	await crear(page, { titulo: 'Árbol', tipo: 'Días de la semana', dias: ['lunes'], etiquetas: ['Patio'] });
	await crear(page, { titulo: 'Pagar la luz', tipo: 'No se repite', etiquetas: ['Casa'] });
	await crear(page, { titulo: 'Cambiar foco', tipo: 'No se repite' });

	await completar(page, 'Pagar la luz');
	await pausar(page, 'Ñandú');
	await pausar(page, 'Nube');
	await pausar(page, 'Árbol');
	await listaEs(page, ['Cambiar foco']);

	await conmutarPausadas(page, true);
	await listaEs(page, ['Cambiar foco', 'Árbol', 'Nube', 'Ñandú']);

	await conmutarMostrarCompletadas(page, true);
	await listaEs(page, ['Cambiar foco', 'Pagar la luz', 'Árbol', 'Nube', 'Ñandú']);
	await esperarEstado(page, 'Pagar la luz', 'pendiente', undefined, true);
	for (const t of ['Árbol', 'Nube', 'Ñandú']) await verPausada(page, t);

	const filtro = (nombre: string) => page.getByRole('button', { name: nombre, exact: true });
	await filtro('Casa').click();
	await listaEs(page, ['Pagar la luz', 'Nube']);
	await filtro('Patio').click();
	await listaEs(page, ['Árbol', 'Ñandú']);
	await filtro('Todas').click();

	await conmutarMostrarCompletadas(page, false);
	await listaEs(page, ['Cambiar foco', 'Árbol', 'Nube', 'Ñandú']);

	await page.reload();
	await expect(mostrarPausadas(page)).toBeChecked();
	await listaEs(page, ['Cambiar foco', 'Árbol', 'Nube', 'Ñandú']);
	const contexto = page.context();
	const otra = await contexto.newPage();
	await otra.goto('/');
	await expect(otra.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
	await expect(mostrarPausadas(otra)).toBeChecked();
	await otra.close();

	await conmutarPausadas(page, false);
	await listaEs(page, ['Cambiar foco']);
	await page.reload();
	await expect(mostrarPausadas(page)).not.toBeChecked();
	await listaEs(page, ['Cambiar foco']);
});

test('Flujo 6: pasar una periódica pausada a puntual', async ({ page }) => {
	await sesionConReloj(page, '2026-07-10T09:00:00');
	await encenderCompletadas(page);
	await crear(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await completar(page, 'Regar');
	await pausar(page, 'Regar');
	await listaEs(page, []);

	await adelantar(page, '2026-07-15T10:00:00');
	await conmutarPausadas(page, true);
	await editar(page, 'Regar', { tipo: 'No se repite' });
	await esperarEstado(page, 'Regar', 'pendiente', undefined, true);
	await noPausada(page, 'Regar');
	await abrir(page, 'Regar');
	await expect(botonPausar(page)).toHaveCount(0);
	await expect(botonReanudar(page)).toHaveCount(0);
	await cerrar(page);

	await editar(page, 'Regar', { tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await esperarEstado(page, 'Regar', 'pendiente', undefined, false);
	await abrir(page, 'Regar');
	await expect(botonPausar(page)).toBeVisible();
	await cerrar(page);
});

test('Flujo 7: dos dispositivos', async ({ browser }) => {
	const { a, b, ctxB, cerrar: fin } = await dosDispositivos(browser, '2026-07-14T08:00:00');
	await conmutarPausadas(a, true);
	await conmutarPausadas(b, true);

	await crear(a, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await expect(fila(b, 'Regar')).toBeVisible();

	await ctxB.setOffline(true);
	await pausar(a, 'Regar');
	await verPausada(a, 'Regar');
	await llegaAlServidor(a);
	await adelantar(a, '2026-07-14T09:00:00');
	await adelantar(b, '2026-07-14T09:00:00');
	await completar(b, 'Regar');
	await expect(aviso(b)).toContainText('Completaste «Regar»');

	await ctxB.setOffline(false);
	await llegaAlServidor(b);
	await verPausada(a, 'Regar');
	await verPausada(b, 'Regar');
	await entradasDelHistorial(a, 'Regar', '09:00', 1);
	await entradasDelHistorial(b, 'Regar', '09:00', 1);

	await ctxB.setOffline(true);
	await adelantar(a, '2026-07-15T10:00:00');
	await adelantar(b, '2026-07-15T10:00:00');
	await reanudar(a, 'Regar');
	await esperarEstado(a, 'Regar', 'pendiente', undefined, false);
	await llegaAlServidor(a);
	await editar(b, 'Regar', { titulo: 'Regar plantas' });
	await ctxB.setOffline(false);
	await llegaAlServidor(b);
	for (const p of [a, b]) {
		await esperarEstado(p, 'Regar plantas', 'pendiente', undefined, false);
		await noPausada(p, 'Regar plantas');
	}

	await conmutarPausadas(a, false);
	await expect(mostrarPausadas(b)).toBeChecked();
	await b.reload();
	await expect(mostrarPausadas(b)).toBeChecked();

	await ctxB.setOffline(true);
	await pausar(a, 'Regar plantas');
	await llegaAlServidor(a);
	await editar(b, 'Regar plantas', { titulo: 'Regar' });
	await ctxB.setOffline(false);
	await llegaAlServidor(b);
	await listaEs(a, []);
	await verPausada(b, 'Regar');
	await listaEs(b, ['Regar']);
	await conmutarPausadas(a, true);
	await verPausada(a, 'Regar');
	await fin();
});
