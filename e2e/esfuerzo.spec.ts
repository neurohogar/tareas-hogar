import { expect, test, type Page } from '@playwright/test';
import {
	abrir,
	adelantar,
	cerrar,
	descartar,
	completar,
	crear,
	dosDispositivos,
	editar,
	encenderCompletadas,
	fila,
	irA,
	limpiarEmuladores,
	listaEs,
	llegaAlServidor,
	sesionConReloj,
	type Definicion
} from './apoyo';

test.beforeEach(async () => {
	await limpiarEmuladores();
});

const HOY = '2026-07-15T08:00:00';
const RAPIDA = 'Rápida (≤ 5 min)';
const MEDIA = 'Media (≈ 15 min)';
const NO_SE_REPITE = 'No se repite';

const selector = (page: Page) => page.getByRole('combobox', { name: 'Esfuerzo' });
const solo = (page: Page) => page.getByRole('button', { name: 'Solo rápidas', exact: true });
const grupoFiltro = (page: Page) => page.getByRole('group', { name: 'Filtrar por etiqueta' });
const mostrarPausadas = (page: Page) => page.getByRole('checkbox', { name: 'Pausadas' });
const VACIA_RAPIDAS = 'No hay tareas rápidas';
const VACIA_ETIQUETA = 'No hay tareas con esta etiqueta';

const verSolo = (page: Page, encendido: boolean) => expect(solo(page)).toHaveAttribute('aria-pressed', String(encendido));
const verNivel = async (page: Page, titulo: string, nivel: 'Rápida' | 'Media' | 'Larga' | undefined) => {
	for (const n of ['Rápida', 'Media', 'Larga'])
		await expect(fila(page, titulo).getByText(n, { exact: true })).toHaveCount(n === nivel ? 1 : 0);
};
const verSelector = (page: Page, valor: string) => expect(selector(page).locator('option:checked')).toHaveText(valor);
async function vacia(page: Page, texto: string | undefined) {
	for (const t of [VACIA_RAPIDAS, VACIA_ETIQUETA])
		await expect(page.getByText(t, { exact: true })).toHaveCount(t === texto ? 1 : 0);
}
async function elegir(page: Page, titulo: string, esfuerzo: NonNullable<Definicion['esfuerzo']>) {
	await editar(page, titulo, { esfuerzo });
}
async function pausar(page: Page, titulo: string) {
	await abrir(page, titulo);
	await page.getByRole('button', { name: 'Pausar', exact: true }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
}
async function crearA(page: Page, hora: string, d: Definicion & { titulo: string }) {
	await page.clock.setSystemTime(new Date(hora));
	await page.clock.runFor(1000);
	await crear(page, d);
}

test('Flujo 1: el selector Esfuerzo y el nivel en la fila', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await page.getByRole('button', { name: '+' }).click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await verSelector(page, 'Sin estimar');
	await expect(selector(page).locator('option')).toHaveText(['Sin estimar', RAPIDA, MEDIA, 'Larga']);
	await cerrar(page);

	await crear(page, { titulo: 'Cambiar foco', tipo: NO_SE_REPITE, esfuerzo: RAPIDA });
	await verNivel(page, 'Cambiar foco', 'Rápida');
	const tamano = (l: ReturnType<typeof fila>) => l.evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
	const nivel = fila(page, 'Cambiar foco').getByText('Rápida', { exact: true });
	const titulo = fila(page, 'Cambiar foco').getByRole('button', { name: 'Cambiar foco' });
	expect(await tamano(nivel)).toBeLessThan(await tamano(titulo));

	await crear(page, { titulo: 'Pagar la luz', tipo: NO_SE_REPITE, fecha: '' });
	await verNivel(page, 'Pagar la luz', undefined);

	await abrir(page, 'Cambiar foco');
	await verSelector(page, RAPIDA);
	await page.getByRole('button', { name: 'Cerrar' }).click();
	await elegir(page, 'Cambiar foco', 'Larga');
	await verNivel(page, 'Cambiar foco', 'Larga');

	await abrir(page, 'Pagar la luz');
	await verSelector(page, 'Sin estimar');
	await cerrar(page);
	await elegir(page, 'Pagar la luz', MEDIA);
	await verNivel(page, 'Pagar la luz', 'Media');

	await elegir(page, 'Pagar la luz', 'Sin estimar');
	await verNivel(page, 'Pagar la luz', undefined);
	await abrir(page, 'Pagar la luz');
	await verSelector(page, 'Sin estimar');
	await cerrar(page);

	await abrir(page, 'Cambiar foco');
	await selector(page).selectOption({ label: RAPIDA });
	await descartar(page);
	await verNivel(page, 'Cambiar foco', 'Larga');

	await page.reload();
	await expect(page.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
	await verNivel(page, 'Cambiar foco', 'Larga');
	await verNivel(page, 'Pagar la luz', undefined);
});

test('Flujo 2: esfuerzo en periódicas, con horario y con cambio de tipo', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await crear(page, {
		titulo: 'Regar',
		tipo: 'Intervalo',
		cada: '2',
		unidad: 'días',
		horario: { desde: '08:00', hasta: '11:00' },
		esfuerzo: RAPIDA
	});
	await verNivel(page, 'Regar', 'Rápida');
	await expect(fila(page, 'Regar').getByText('08:00–11:00')).toBeVisible();
	await crear(page, { titulo: 'Sacar la basura', tipo: 'Días de la semana', dias: ['jueves'], esfuerzo: 'Larga' });
	await verNivel(page, 'Sacar la basura', 'Larga');

	await abrir(page, 'Regar');
	await verSelector(page, RAPIDA);
	await page.getByRole('radio', { name: NO_SE_REPITE }).check();
	await page.getByLabel('Fecha límite').fill('');
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await verNivel(page, 'Regar', 'Rápida');
	await abrir(page, 'Regar');
	await verSelector(page, RAPIDA);
	await cerrar(page);
});

test('Flujo 3: Solo rápidas, orden y lista vacía', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await expect(grupoFiltro(page)).toHaveCount(0);
	await expect(solo(page)).toBeVisible();
	await verSolo(page, false);
	await vacia(page, undefined);
	await solo(page).click();
	await verSolo(page, true);
	await vacia(page, VACIA_RAPIDAS);
	await solo(page).click();
	await verSolo(page, false);
	await vacia(page, undefined);

	await crearA(page, '2026-07-15T08:00:00', { titulo: 'Cambiar foco', tipo: NO_SE_REPITE, esfuerzo: RAPIDA });
	await crearA(page, '2026-07-15T08:01:00', { titulo: 'Ventilar', tipo: 'Intervalo', cada: '4', unidad: 'horas', esfuerzo: MEDIA });
	await crearA(page, '2026-07-15T08:02:00', { titulo: 'Pagar la luz', tipo: NO_SE_REPITE, fecha: '2026-07-14', esfuerzo: RAPIDA });
	await crearA(page, '2026-07-15T08:03:00', { titulo: 'Regar', tipo: 'Intervalo', cada: '4', unidad: 'horas', esfuerzo: RAPIDA });
	await crearA(page, '2026-07-15T08:04:00', { titulo: 'Barrer', tipo: NO_SE_REPITE });

	await adelantar(page, '2026-07-15T09:00:00');
	await completar(page, 'Regar');
	await adelantar(page, '2026-07-15T09:30:00');
	await completar(page, 'Ventilar');
	await adelantar(page, '2026-07-15T14:00:00');
	await page.clock.runFor(1000);
	await listaEs(page, ['Pagar la luz', 'Regar', 'Ventilar', 'Cambiar foco', 'Barrer']);

	await solo(page).click();
	await listaEs(page, ['Pagar la luz', 'Regar', 'Cambiar foco']);
	await vacia(page, undefined);

	await completar(page, 'Pagar la luz');
	await listaEs(page, ['Regar', 'Cambiar foco']);
	await elegir(page, 'Regar', MEDIA);
	await listaEs(page, ['Cambiar foco']);
	await elegir(page, 'Cambiar foco', 'Sin estimar');
	await listaEs(page, []);
	await vacia(page, VACIA_RAPIDAS);

	await solo(page).click();
	await verSolo(page, false);
	await listaEs(page, ['Regar', 'Ventilar', 'Cambiar foco', 'Barrer']);
	await vacia(page, undefined);
});

test('Flujo 4: combinación con el filtro por etiqueta', async ({ page }) => {
	await sesionConReloj(page, HOY);
	const base = { tipo: NO_SE_REPITE } as const;
	await crearA(page, '2026-07-15T08:00:00', { ...base, titulo: 'Pagar la luz', etiquetas: ['Casa'], esfuerzo: RAPIDA });
	await crearA(page, '2026-07-15T08:01:00', { ...base, titulo: 'Barrer', etiquetas: ['Casa'], esfuerzo: 'Larga' });
	await crearA(page, '2026-07-15T08:02:00', { ...base, titulo: 'Regar', etiquetas: ['Patio'], esfuerzo: RAPIDA });
	await crearA(page, '2026-07-15T08:03:00', { ...base, titulo: 'Lavar ropa', esfuerzo: RAPIDA });

	const filtro = (n: string) => grupoFiltro(page).getByRole('button', { name: n, exact: true });
	await expect(grupoFiltro(page).getByRole('button')).toHaveText(['Todas', 'Casa', 'Patio']);
	await verSolo(page, false);
	await filtro('Casa').click();
	await listaEs(page, ['Pagar la luz', 'Barrer']);
	await solo(page).click();
	await listaEs(page, ['Pagar la luz']);
	await expect(filtro('Casa')).toHaveAttribute('aria-pressed', 'true');
	await filtro('Patio').click();
	await listaEs(page, ['Regar']);
	await verSolo(page, true);
	await filtro('Todas').click();
	await listaEs(page, ['Pagar la luz', 'Regar', 'Lavar ropa']);

	await filtro('Patio').click();
	await elegir(page, 'Regar', 'Larga');
	await listaEs(page, []);
	await vacia(page, VACIA_ETIQUETA);
	await solo(page).click();
	await verSolo(page, false);
	await listaEs(page, ['Regar']);
	await vacia(page, undefined);
});

test('Flujo 5: completadas y pausadas', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await crearA(page, '2026-07-15T08:00:00', { titulo: 'Cambiar foco', tipo: NO_SE_REPITE, esfuerzo: MEDIA });
	await crearA(page, '2026-07-15T08:01:00', { titulo: 'Pagar la luz', tipo: NO_SE_REPITE, esfuerzo: RAPIDA });
	await crearA(page, '2026-07-15T08:02:00', { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días', esfuerzo: RAPIDA });
	await crearA(page, '2026-07-15T08:03:00', { titulo: 'Sacar la basura', tipo: 'Intervalo', cada: '3', unidad: 'días', esfuerzo: 'Larga' });

	await adelantar(page, '2026-07-15T09:00:00');
	await completar(page, 'Pagar la luz');
	await pausar(page, 'Regar');
	await pausar(page, 'Sacar la basura');
	await listaEs(page, ['Cambiar foco']);

	await solo(page).click();
	await listaEs(page, []);
	await vacia(page, VACIA_RAPIDAS);
	await encenderCompletadas(page);
	await listaEs(page, ['Pagar la luz']);
	await expect(fila(page, 'Pagar la luz').getByRole('checkbox')).toBeChecked();
	await mostrarPausadas(page).click();
	await expect(mostrarPausadas(page)).toBeChecked();
	await listaEs(page, ['Pagar la luz', 'Regar']);
	await expect(fila(page, 'Sacar la basura')).toHaveCount(0);

	await solo(page).click();
	await listaEs(page, ['Cambiar foco', 'Pagar la luz', 'Regar', 'Sacar la basura']);
});

test('Flujo 6: se mantiene entre pantallas y vuelve a apagado al recargar', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await crear(page, { titulo: 'Cambiar foco', tipo: NO_SE_REPITE, etiquetas: ['Casa'], esfuerzo: RAPIDA });
	await crear(page, { titulo: 'Barrer', tipo: NO_SE_REPITE, etiquetas: ['Casa'] });
	const filtro = (n: string) => grupoFiltro(page).getByRole('button', { name: n, exact: true });
	await solo(page).click();
	await filtro('Casa').click();
	await listaEs(page, ['Cambiar foco']);

	for (const otra of ['Historial', 'Etiquetas'] as const) {
		await irA(page, otra);
		await irA(page, 'Pendientes');
		await verSolo(page, true);
		await expect(filtro('Casa')).toHaveAttribute('aria-pressed', 'true');
		await listaEs(page, ['Cambiar foco']);
	}

	await page.reload();
	await expect(page.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
	await verSolo(page, false);
	await expect(filtro('Todas')).toHaveAttribute('aria-pressed', 'true');
	await listaEs(page, ['Cambiar foco', 'Barrer']);

	await solo(page).click();
	await verSolo(page, true);
	const contexto = page.context();
	await page.close();
	const nueva = await contexto.newPage();
	await nueva.goto('/');
	await expect(nueva.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
	await verSolo(nueva, false);
});

test('Flujo 7: el esfuerzo con dos dispositivos', async ({ browser }) => {
	const { a, b, ctxB, cerrar: fin } = await dosDispositivos(browser, HOY);
	await crear(a, { titulo: 'Pagar la luz', tipo: NO_SE_REPITE, esfuerzo: MEDIA });
	await expect(fila(b, 'Pagar la luz')).toBeVisible();
	await verNivel(b, 'Pagar la luz', 'Media');

	await solo(a).click();
	await listaEs(a, []);
	await vacia(a, VACIA_RAPIDAS);
	await verSolo(b, false);
	await listaEs(b, ['Pagar la luz']);

	await elegir(b, 'Pagar la luz', RAPIDA);
	await listaEs(a, ['Pagar la luz']);
	await verNivel(a, 'Pagar la luz', 'Rápida');
	await vacia(a, undefined);

	await ctxB.setOffline(true);
	await editar(a, 'Pagar la luz', { titulo: 'Pagar el gas' });
	await llegaAlServidor(a);
	await elegir(b, 'Pagar la luz', 'Larga');
	await ctxB.setOffline(false);
	await llegaAlServidor(b);
	await listaEs(a, []);
	await vacia(a, VACIA_RAPIDAS);
	await solo(a).click();
	for (const p of [a, b]) {
		await expect(fila(p, 'Pagar el gas')).toBeVisible();
		await verNivel(p, 'Pagar el gas', 'Larga');
	}
	await fin();
});

test('Flujo 8: mismo campo, gana el último cambio', async ({ browser }) => {
	const { a, b, ctxB, cerrar: fin } = await dosDispositivos(browser, HOY);
	await crear(a, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días', esfuerzo: MEDIA });
	await expect(fila(b, 'Regar')).toBeVisible();
	await verNivel(b, 'Regar', 'Media');

	await ctxB.setOffline(true);
	await elegir(a, 'Regar', RAPIDA);
	await llegaAlServidor(a);
	await adelantar(b, '2026-07-15T08:05:00');
	await elegir(b, 'Regar', 'Sin estimar');
	await ctxB.setOffline(false);
	await llegaAlServidor(b);
	for (const p of [a, b]) {
		await verNivel(p, 'Regar', undefined);
		await abrir(p, 'Regar');
		await verSelector(p, 'Sin estimar');
		await cerrar(p);
	}
	await fin();
});
