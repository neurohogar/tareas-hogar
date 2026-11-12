import { expect, test, type Browser, type Page } from '@playwright/test';
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import {
	borrar,
	completar,
	crear,
	dispositivo,
	editar,
	encenderCompletadas,
	entrar,
	esperarEstado,
	fila,
	irA,
	limpiarEmuladores,
	llegaAlServidor
} from './apoyo';
import { cachesDe, hayVersionEsperando, ORIGEN_VERSIONES, servir, versionDe } from './versiones-apoyo';

// Esta suite habla del service worker: lo permite (las demás lo bloquean).
test.use({ serviceWorkers: 'allow' });

const HORA = '2026-07-15T08:00:00';
const VACIO_HISTORIAL = 'Todavía no completaste nada';
const VACIO_ETIQUETAS = 'Todavía no hay etiquetas';

test.beforeEach(async () => {
	await limpiarEmuladores();
});

const pendientes = (page: Page) => page.getByRole('heading', { name: 'Pendientes', level: 1 });
const sinConexion = (page: Page) => page.getByText('Sin conexión', { exact: true });

/** Espera al service worker activo y recarga (con conexión) hasta que la página queda controlada. */
async function controlada(page: Page) {
	await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
	await expect(async () => {
		if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) await page.reload();
		expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
	}).toPass();
}

const puntual = (page: Page, titulo: string, fecha?: string) =>
	crear(page, { titulo, tipo: 'No se repite', fecha });

/** Una sesión (A) con el reloj en HORA y el service worker controlando la página. */
async function sesionPwa(browser: Browser, primero = true) {
	const d = await dispositivo(browser, HORA, primero);
	await controlada(d.page);
	await expect(pendientes(d.page)).toBeVisible();
	return d;
}

async function recargar(page: Page) {
	await page.reload();
	await expect(pendientes(page)).toBeVisible();
}

async function historialVacioEn(page: Page) {
	await irA(page, 'Historial');
	await expect(page.getByText(VACIO_HISTORIAL)).toBeVisible();
}

test('Flujo 1: PWA instalable', async ({ page, context }) => {
	await page.addInitScript(() => {
		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			(window as unknown as { __instalar: unknown }).__instalar = e;
		});
	});
	await page.goto('/');
	await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));

	// Manifest.
	const href = await page.locator('link[rel="manifest"]').getAttribute('href');
	expect(href).toBeTruthy();
	const respuesta = await page.request.get(new URL(href!, page.url()).toString());
	expect(respuesta.ok()).toBe(true);
	const manifest = await respuesta.json();
	expect(manifest.name).toBe('Tareas Hogar');
	expect(manifest.short_name).toBe('Tareas');
	expect(manifest.display).toBe('standalone');
	const inicio = new URL(manifest.start_url, new URL(href!, page.url()));
	const alcance = new URL(manifest.scope ?? './', new URL(href!, page.url()));
	expect(inicio.origin).toBe(alcance.origin);
	expect(inicio.pathname.startsWith(alcance.pathname)).toBe(true);
	for (const lado of ['192x192', '512x512']) {
		const icono = manifest.icons.find((i: { sizes: string }) => i.sizes.split(' ').includes(lado));
		expect(icono, `ícono ${lado}`).toBeTruthy();
		const img = await page.request.get(new URL(icono.src, new URL(href!, page.url())).toString());
		expect(img.ok()).toBe(true);
		expect(img.headers()['content-type']).toMatch(/^image\//);
	}

	// Service worker activo con alcance sobre la raíz.
	const registro = await page.evaluate(async () => {
		const r = await navigator.serviceWorker.getRegistration();
		return { estado: r?.active?.state, alcance: r?.scope };
	});
	expect(registro.estado).toBe('activated');
	expect(new URL(page.url()).href.startsWith(registro.alcance!)).toBe(true);

	// Recargar: la página queda controlada.
	await page.reload();
	await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

	// Instalable según el navegador.
	const cdp = await context.newCDPSession(page);
	await cdp.send('Page.enable');
	await expect(async () => {
		const { installabilityErrors } = (await cdp.send('Page.getInstallabilityErrors')) as {
			installabilityErrors: unknown[];
		};
		expect(installabilityErrors).toEqual([]);
	}).toPass();
});

test('Flujo 2: abrir sin conexión tras el primer login', async ({ browser }) => {
	const { ctx, page } = await sesionPwa(browser);
	await puntual(page, 'Regar');
	await expect(fila(page, 'Regar')).toBeVisible();
	await controlada(page);

	await ctx.setOffline(true);
	await page.reload();
	await expect(pendientes(page)).toBeVisible();
	await expect(page.getByRole('button', { name: 'Entrar con Google' })).toHaveCount(0);
	await expect(fila(page, 'Regar')).toBeVisible();

	await page.goto('/historial');
	await expect(page.getByRole('heading', { name: 'Historial', level: 1 })).toBeVisible();
	await expect(page.getByText(VACIO_HISTORIAL)).toBeVisible();
	await page.reload();
	await expect(page.getByText(VACIO_HISTORIAL)).toBeVisible();
	await page.goto('/etiquetas');
	await expect(page.getByRole('heading', { name: 'Etiquetas', level: 1 })).toBeVisible();
	await page.reload();
	await expect(page.getByText(VACIO_ETIQUETAS)).toBeVisible();

	await page.close();
	const nueva = await ctx.newPage();
	await nueva.goto('/');
	await expect(pendientes(nueva)).toBeVisible();
	await expect(fila(nueva, 'Regar')).toBeVisible();

	await ctx.setOffline(false);
	await expect(sinConexion(nueva)).toHaveCount(0);
	await expect(nueva.getByRole('button', { name: 'Entrar con Google' })).toHaveCount(0);
	await expect(pendientes(nueva)).toBeVisible();
	await expect(fila(nueva, 'Regar')).toBeVisible();
	await ctx.close();
});

test('Flujo 3: completar sin conexión y sincronizar', async ({ browser }) => {
	const a = await sesionPwa(browser, true);
	const b = await sesionPwa(browser, false);
	await encenderCompletadas(a.page);
	await encenderCompletadas(b.page);
	await crear(a.page, { titulo: 'Regar', tipo: 'Intervalo', cada: '1', unidad: 'días' });
	await esperarEstado(a.page, 'Regar', 'pendiente');
	await esperarEstado(b.page, 'Regar', 'pendiente');

	await a.ctx.setOffline(true);
	await completar(a.page, 'Regar');
	await esperarEstado(a.page, 'Regar', 'en espera');
	await esperarEstado(b.page, 'Regar', 'pendiente');

	await irA(a.page, 'Historial');
	await expect(fila(a.page, 'Regar')).toHaveCount(1);
	await expect(a.page.getByRole('heading', { name: 'Hoy' })).toBeVisible();
	await expect(fila(a.page, 'Regar')).toContainText(/\d\d:\d\d/);

	await a.page.reload();
	await expect(a.page.getByRole('heading', { name: 'Historial', level: 1 })).toBeVisible();
	await expect(fila(a.page, 'Regar')).toHaveCount(1);
	await irA(a.page, 'Pendientes');
	await esperarEstado(a.page, 'Regar', 'en espera');

	await a.ctx.setOffline(false);
	await esperarEstado(b.page, 'Regar', 'en espera');
	await irA(b.page, 'Historial');
	await expect(fila(b.page, 'Regar')).toHaveCount(1);
	await expect(fila(b.page, 'Regar')).toContainText(/\d\d:\d\d/);
	await a.ctx.close();
	await b.ctx.close();
});

test('Flujo 4: crear, editar y borrar sin conexión', async ({ browser }) => {
	const a = await sesionPwa(browser, true);
	const b = await sesionPwa(browser, false);
	await a.ctx.setOffline(true);

	await puntual(a.page, 'Barrer');
	await puntual(a.page, 'Pagar', '2026-07-20');
	await expect(fila(a.page, 'Barrer')).toBeVisible();
	await expect(fila(a.page, 'Pagar')).toBeVisible();
	await expect(fila(b.page, 'Barrer')).toHaveCount(0);
	await expect(fila(b.page, 'Pagar')).toHaveCount(0);

	await editar(a.page, 'Barrer', { titulo: 'Barrer patio' });
	await expect(fila(a.page, 'Barrer patio')).toBeVisible();

	await completar(a.page, 'Pagar');
	await expect(fila(a.page, 'Pagar')).toHaveCount(0);
	await a.page.getByRole('status').getByRole('button', { name: 'Deshacer' }).click();
	await expect(fila(a.page, 'Pagar')).toBeVisible();

	await borrar(a.page, 'Pagar');
	await expect(fila(a.page, 'Pagar')).toHaveCount(0);

	await recargar(a.page);
	await expect(fila(a.page, 'Barrer patio')).toBeVisible();
	await expect(fila(a.page, 'Pagar')).toHaveCount(0);
	await expect(a.page.getByRole('listitem')).toHaveCount(1);
	await historialVacioEn(a.page);

	await a.ctx.setOffline(false);
	await expect(fila(b.page, 'Barrer patio')).toBeVisible();
	await expect(fila(b.page, 'Pagar')).toHaveCount(0);
	await historialVacioEn(b.page);
	await a.ctx.close();
	await b.ctx.close();
});

test('Flujo 5: la escritura pendiente sobrevive a una recarga', async ({ browser }) => {
	const a = await sesionPwa(browser, true);
	const b = await sesionPwa(browser, false);
	await a.ctx.setOffline(true);

	await puntual(a.page, 'Comprar pan');
	await expect(fila(a.page, 'Comprar pan')).toBeVisible();
	await recargar(a.page);
	await expect(fila(a.page, 'Comprar pan')).toBeVisible();

	await completar(a.page, 'Comprar pan');
	await expect(fila(a.page, 'Comprar pan')).toHaveCount(0);
	await recargar(a.page);
	await expect(fila(a.page, 'Comprar pan')).toHaveCount(0);
	await irA(a.page, 'Historial');
	await expect(fila(a.page, 'Comprar pan')).toHaveCount(1);

	await a.page.close();
	const nueva = await a.ctx.newPage();
	await nueva.goto('/');
	await expect(pendientes(nueva)).toBeVisible();
	await expect(fila(nueva, 'Comprar pan')).toHaveCount(0);
	await irA(nueva, 'Historial');
	await expect(fila(nueva, 'Comprar pan')).toHaveCount(1);

	await a.ctx.setOffline(false);
	await irA(b.page, 'Historial');
	await expect(fila(b.page, 'Comprar pan')).toHaveCount(1);
	await llegaAlServidor(b.page);
	await expect(fila(b.page, 'Comprar pan')).toHaveCount(1);

	// Variante con conexión.
	await irA(nueva, 'Pendientes');
	await puntual(nueva, 'Lavar');
	await expect(fila(nueva, 'Lavar')).toBeVisible();
	await recargar(nueva);
	await expect(fila(nueva, 'Lavar')).toBeVisible();
	await irA(b.page, 'Pendientes');
	await expect(fila(b.page, 'Lavar')).toBeVisible();
	await completar(nueva, 'Lavar');
	await expect(fila(nueva, 'Lavar')).toHaveCount(0);
	await recargar(nueva);
	await expect(fila(nueva, 'Lavar')).toHaveCount(0);
	await expect(fila(b.page, 'Lavar')).toHaveCount(0);
	await irA(b.page, 'Historial');
	await expect(fila(b.page, 'Lavar')).toHaveCount(1);
	await a.ctx.close();
	await b.ctx.close();
});

test('Flujo 6: varias pestañas del mismo dispositivo', async ({ browser }) => {
	const a = await sesionPwa(browser, true);
	const p1 = a.page;
	const p2 = await a.ctx.newPage();
	await p2.goto('/');
	await expect(pendientes(p2)).toBeVisible();
	await expect(pendientes(p1)).toBeVisible();
	await expect(p1.getByText(/otra pestaña/i)).toHaveCount(0);
	await expect(p2.getByText(/otra pestaña/i)).toHaveCount(0);

	await puntual(p1, 'Regar');
	await expect(fila(p2, 'Regar')).toBeVisible();

	await a.ctx.setOffline(true);
	await puntual(p1, 'Barrer');
	await expect(fila(p2, 'Barrer')).toBeVisible();

	await a.ctx.setOffline(false);
	const b = await dispositivo(browser, HORA, false);
	await expect(fila(b.page, 'Regar')).toBeVisible();
	await expect(fila(b.page, 'Barrer')).toBeVisible();
	await a.ctx.close();
	await b.ctx.close();
});

test('Flujo 7: ida y vuelta de conexión', async ({ browser }) => {
	const a = await sesionPwa(browser, true);
	const b = await sesionPwa(browser, false);
	await puntual(a.page, 'Regar');
	await puntual(a.page, 'Barrer');
	await expect(fila(b.page, 'Regar')).toBeVisible();
	await expect(fila(b.page, 'Barrer')).toBeVisible();

	await a.ctx.setOffline(true);
	await completar(b.page, 'Regar');
	await expect(fila(b.page, 'Regar')).toHaveCount(0);
	await llegaAlServidor(b.page);
	await expect(fila(a.page, 'Regar')).toBeVisible();
	await a.ctx.setOffline(false);
	await expect(fila(a.page, 'Regar')).toHaveCount(0);

	await a.ctx.setOffline(true);
	await completar(a.page, 'Barrer');
	await expect(fila(a.page, 'Barrer')).toHaveCount(0);
	await a.page.waitForTimeout(2000);
	await a.ctx.setOffline(false);
	await expect(fila(b.page, 'Barrer')).toHaveCount(0);

	for (const titulo of ['Uno', 'Dos']) {
		await a.ctx.setOffline(true);
		await puntual(a.page, titulo);
		await expect(fila(a.page, titulo)).toBeVisible();
		await a.page.waitForTimeout(1000);
		await a.ctx.setOffline(false);
		await expect(fila(b.page, titulo)).toBeVisible();
	}
	await expect(a.page.getByRole('alert')).toHaveCount(0);
	await expect(b.page.getByRole('alert')).toHaveCount(0);
	await irA(b.page, 'Historial');
	await expect(b.page.getByRole('listitem')).toHaveCount(2);
	await a.ctx.close();
	await b.ctx.close();
});

test('Flujo 8: aviso "Sin conexión"', async ({ browser }) => {
	const { ctx, page } = await sesionPwa(browser);
	await expect(sinConexion(page)).toHaveCount(0);

	await ctx.setOffline(true);
	await expect(sinConexion(page)).toBeVisible();

	await puntual(page, 'Regar');
	await expect(fila(page, 'Regar')).toBeVisible();
	await expect(page.getByText(/cambios pendientes|por sincronizar|sincroniz|\d+ pendiente/i)).toHaveCount(0);
	await expect(page.getByRole('status')).toHaveText('Sin conexión');

	await recargar(page);
	await expect(fila(page, 'Regar')).toBeVisible();
	await expect(sinConexion(page)).toBeVisible();

	await ctx.setOffline(false);
	await expect(sinConexion(page)).toHaveCount(0);
	await ctx.close();
});

test('Flujo 9: abrir sin conexión sin haber iniciado sesión nunca', async ({ browser }) => {
	const ctx = await browser.newContext({ baseURL: 'http://127.0.0.1:4173', locale: 'es-AR' });
	const page = await ctx.newPage();
	await page.goto('/');
	const entrarBtn = page.getByRole('button', { name: 'Entrar con Google' });
	await expect(entrarBtn).toBeEnabled();
	await controlada(page);
	await expect(entrarBtn).toBeVisible();

	await ctx.setOffline(true);
	await page.reload();
	await expect(entrarBtn).toBeVisible();
	await expect(entrarBtn).toBeDisabled();
	await expect(page.getByText('Necesitás conexión para entrar la primera vez')).toBeVisible();

	await ctx.setOffline(false);
	await expect(page.getByText('Necesitás conexión para entrar la primera vez')).toHaveCount(0);
	await expect(entrarBtn).toBeEnabled();
	await ctx.close();
});

// --- Flujo 10: dos builds servidos en el mismo origen (e2e/versiones-apoyo.ts) ---

test('Flujo 10: versión nueva del service worker', async ({ browser }) => {
	test.setTimeout(240_000);
	const raiz = join(process.cwd(), 'tmp', 'pwa-versiones');
	const v1 = join(raiz, 'v1');
	const v2 = join(raiz, 'v2');
	rmSync(raiz, { recursive: true, force: true });
	mkdirSync(raiz, { recursive: true });
	cpSync(join(process.cwd(), 'build'), v1, { recursive: true });
	// El segundo build reemplaza build/ (versión nueva por marca de tiempo); el preview sirve ese mismo build.
	await new Promise((r) => setTimeout(r, 1100));
	execSync('npm run build:qa', { stdio: 'ignore', cwd: process.cwd() });
	cpSync(join(process.cwd(), 'build'), v2, { recursive: true });
	expect(versionDe(v2)).not.toBe(versionDe(v1));

	const estado = { dir: v1 };
	const servidor = await servir(estado);
	const ctx = await browser.newContext({ baseURL: ORIGEN_VERSIONES, locale: 'es-AR' });
	try {
		let page = await ctx.newPage();
		await entrar(page);
		await puntual(page, 'Regar');
		await expect(fila(page, 'Regar')).toBeVisible();
		await controlada(page);
		expect(await cachesDe(page)).toEqual([`tareas-hogar-${versionDe(v1)}`]);

		// Se publica el build nuevo; la app se vuelve a abrir (la página anterior sigue abierta).
		estado.dir = v2;
		const otra = await ctx.newPage();
		await otra.goto('/');
		await expect(pendientes(otra)).toBeVisible();
		await expect(async () => {
			expect(await hayVersionEsperando(otra)).toBe(true);
		}).toPass();
		for (const p of [page, otra]) {
			await expect(p.getByText(/actualiz|nueva versión|recargar/i)).toHaveCount(0);
			await expect(p.getByRole('alertdialog')).toHaveCount(0);
		}
		await otra.close();

		// Con la anterior abierta y la nueva instalada: sin conexión se navega por las tres pestañas.
		await ctx.setOffline(true);
		await page.reload();
		await expect(pendientes(page)).toBeVisible();
		for (const pestana of ['Historial', 'Etiquetas', 'Pendientes'] as const) {
			await irA(page, pestana);
			await page.reload();
			await expect(page.getByRole('heading', { name: pestana, level: 1 })).toBeVisible();
		}
		await expect(page.getByText(/actualiz|nueva versión/i)).toHaveCount(0);
		await ctx.setOffline(false);

		// Se cierran todas las páginas y se abre de nuevo: manda el service worker nuevo.
		await page.close();
		await expect(async () => {
			const nueva = await ctx.newPage();
			try {
				await nueva.goto('/');
				await expect(pendientes(nueva)).toBeVisible();
				expect(await cachesDe(nueva)).toEqual([`tareas-hogar-${versionDe(v2)}`]);
				expect(await nueva.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
				await expect(fila(nueva, 'Regar')).toBeVisible();
				await expect(nueva.getByText(/actualiz|nueva versión/i)).toHaveCount(0);
			} finally {
				await nueva.close();
			}
		}).toPass({ timeout: 30_000 });
		page = await ctx.newPage();
		await page.goto('/');
		await expect(fila(page, 'Regar')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Entrar con Google' })).toHaveCount(0);
	} finally {
		await ctx.close();
		servidor.close();
	}
});

