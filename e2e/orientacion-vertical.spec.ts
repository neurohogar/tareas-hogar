import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	abrir,
	cerrar,
	controlada,
	crear,
	entrar,
	fijarReloj,
	fila,
	irA,
	limpiarEmuladores
} from './apoyo';
import { abrirDetenida, pantalla, sinAvisos, textoVisible } from './pantalla-apoyo';
import { cachesDe, hayVersionEsperando, ORIGEN_VERSIONES, servir, versionConLasMismasFuentes, versionDe } from './versiones-apoyo';

// qa/orientacion-vertical.md. Esta suite habla del service worker (Flujo 5) y de la PWA: lo permite
// (las demás lo bloquean). Celular: 360x640 con emulación táctil.
test.use({ serviceWorkers: 'allow', viewport: { width: 360, height: 640 }, hasTouch: true });

const HORA = '2026-07-15T08:00:00';
const CELULAR_VERTICAL = { width: 360, height: 640 };
const CELULAR_HORIZONTAL = { width: 740, height: 360 };
const COMPU = { width: 1280, height: 800 };

test.beforeEach(async () => {
	await limpiarEmuladores();
});

const pendientes = (page: Page) => page.getByRole('heading', { name: 'Pendientes', level: 1 });
const regar = (page: Page) => crear(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días' });
const barraDePestanas = (page: Page) => page.getByRole('tablist');

// ---------------------------------------------------------------------------
// Espía de orientación y contrato de «Sin bloqueo propio»
// ---------------------------------------------------------------------------

/**
 * Antes de abrir la app envuelve `screen.orientation.lock` y `unlock` para anotar cada llamada, y
 * registra los eventos de giro, sin cambiar lo que hacen. Las anotaciones viven en el contexto, no
 * en la página: sobreviven a las recargas y valen para cualquier pestaña.
 */
async function espiar(ctx: BrowserContext): Promise<string[]> {
	const anotaciones: string[] = [];
	await ctx.exposeBinding('qaOrientacion', (_fuente, texto: string) => {
		anotaciones.push(texto);
	});
	await ctx.addInitScript(() => {
		const anotar = (texto: string) => (window as unknown as Record<string, (t: string) => void>).qaOrientacion(texto);
		const orientacion = screen.orientation;
		for (const metodo of ['lock', 'unlock'] as const) {
			const original = orientacion[metodo] as (...argumentos: unknown[]) => unknown;
			(orientacion as unknown as Record<string, unknown>)[metodo] = function (this: unknown, ...argumentos: unknown[]) {
				anotar(metodo);
				return original.apply(orientacion, argumentos);
			};
		}
		window.addEventListener('orientationchange', () => anotar('orientationchange'));
		orientacion.addEventListener('change', () => anotar('change'));
	});
	return anotaciones;
}

/** Sin bloqueo propio: ninguna llamada a lock ni unlock, y nada gira el contenido. */
async function sinBloqueoPropio(page: Page, anotaciones: string[]) {
	expect(anotaciones.filter((a) => a === 'lock' || a === 'unlock')).toEqual([]);
	const transformaciones = await page.evaluate(() => [document.documentElement, document.body].map((e) => getComputedStyle(e).transform));
	expect(transformaciones).toEqual(['none', 'none']);
}

/** Sin pedido de girar el teléfono ni mención de la orientación. */
async function sinPedidoDeGirar(page: Page) {
	await sinAvisos(page);
	expect(await textoVisible(page)).not.toMatch(/gir(á|a|ar|e)\b|orientaci|vertical|horizontal/i);
}

/** Entera: sin desplazamiento horizontal en la página. */
async function sinDesbordeHorizontal(page: Page) {
	const [ancho, visible] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
	expect(ancho).toBeLessThanOrEqual(visible);
}

/** Abre la app en un contexto nuevo con el espía puesto, la sesión iniciada y el service worker activo. */
async function sesion(browser: Browser, opciones: { viewport?: { width: number; height: number }; hasTouch?: boolean } = {}) {
	const ctx = await browser.newContext({
		baseURL: 'http://127.0.0.1:4173',
		locale: 'es-AR',
		timezoneId: 'America/Argentina/Buenos_Aires',
		...opciones
	});
	const anotaciones = await espiar(ctx);
	const page = await ctx.newPage();
	await entrar(page);
	await fijarReloj(page, HORA);
	await controlada(page);
	await expect(pendientes(page)).toBeVisible();
	return { ctx, page, anotaciones };
}

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

/** Contrato de «Manifest»: se descarga desde la página (por el service worker, si controla) y se parsea. */
async function verificarManifest(page: Page) {
	const href = await page.locator('link[rel="manifest"]').getAttribute('href');
	expect(href).toBeTruthy();
	const manifest = await page.evaluate((h) => fetch(h).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))), href!);
	expect(manifest.name).toBe('Tareas Hogar');
	expect(manifest.short_name).toBe('Tareas');
	expect(manifest.display).toBe('standalone');
	// `portrait`: ni `portrait-primary` ni `portrait-secondary` (fijarían un sentido), ni `landscape`, `any` ni ausente.
	expect(manifest.orientation).toBe('portrait');
	return manifest;
}

test('Flujo 1: el manifest declara la orientación vertical', async ({ browser }) => {
	const { ctx, page } = await sesion(browser);
	const mismo = await verificarManifest(page);

	// Desde Historial y Etiquetas: es el mismo documento.
	for (const ruta of ['/historial', '/etiquetas']) {
		await page.goto(ruta);
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		expect(await verificarManifest(page)).toEqual(mismo);
	}

	// Sin sesión, en la pantalla de entrada.
	const sinSesion = await browser.newContext({ baseURL: 'http://127.0.0.1:4173', locale: 'es-AR' });
	const entrada = await sinSesion.newPage();
	await entrada.goto('/');
	await expect(entrada.getByRole('button', { name: 'Entrar con Google' })).toBeVisible();
	expect(await verificarManifest(entrada)).toEqual(mismo);
	await sinSesion.close();
	await ctx.close();
});

// ---------------------------------------------------------------------------
// Flujo 2: ninguna pantalla fija la orientación por su cuenta
// ---------------------------------------------------------------------------

test('Flujo 2: ninguna pantalla fija la orientación por su cuenta', async ({ browser }) => {
	const { ctx, page, anotaciones } = await sesion(browser);
	await regar(page);
	await expect(fila(page, 'Regar')).toBeVisible();

	// La pantalla de carga, al abrir.
	const apertura = await abrirDetenida(page, HORA);
	await apertura.sigueA(0.4);
	await sinBloqueoPropio(page, anotaciones);
	await apertura.seVaA(0.5);
	await expect(pendientes(page)).toBeVisible();
	await page.clock.resume();

	// Pendientes, Historial, Etiquetas.
	await sinBloqueoPropio(page, anotaciones);
	await irA(page, 'Historial');
	await sinBloqueoPropio(page, anotaciones);
	await irA(page, 'Etiquetas');
	await sinBloqueoPropio(page, anotaciones);
	await irA(page, 'Pendientes');

	// El panel de una tarea nueva.
	await page.getByRole('button', { name: '+' }).click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await sinBloqueoPropio(page, anotaciones);
	await cerrar(page);

	// El de una existente, en sus tres pestañas.
	await abrir(page, 'Regar');
	await expect(page.getByRole('tab')).toHaveCount(3);
	for (const nombre of ['Tarea', 'Cuándo', 'Acciones']) {
		await page.getByRole('tab', { name: new RegExp(`^${nombre}`) }).click();
		await sinBloqueoPropio(page, anotaciones);
	}

	// Un aviso del panel: cerrar con cambios sin guardar.
	await page.getByRole('tab', { name: /^Tarea/ }).click();
	await page.getByLabel('Título').fill('Regar mucho');
	await page.getByRole('button', { name: 'Cerrar' }).click();
	const aviso = page.getByRole('alertdialog', { name: 'Tenés cambios sin guardar' });
	await expect(aviso).toBeVisible();
	await sinBloqueoPropio(page, anotaciones);
	await aviso.getByRole('button', { name: 'Descartar', exact: true }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);

	// Sin sesión, la pantalla de entrada.
	const sinSesion = await browser.newContext({ baseURL: 'http://127.0.0.1:4173', locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires' });
	const anotacionesDeEntrada = await espiar(sinSesion);
	const entrada = await sinSesion.newPage();
	await entrada.goto('/');
	await expect(entrada.getByRole('button', { name: 'Entrar con Google' })).toBeVisible();
	await sinBloqueoPropio(entrada, anotacionesDeEntrada);
	await sinSesion.close();
	await ctx.close();
});

// ---------------------------------------------------------------------------
// Flujo 3: en una pestaña del navegador sigue girando
// ---------------------------------------------------------------------------

test('Flujo 3: en una pestaña del navegador sigue girando con el diseño ancho en horizontal', async ({ browser }) => {
	const { ctx, page, anotaciones } = await sesion(browser);
	await regar(page);

	// 1: en vertical, el panel tiene barra de pestañas.
	await expect(fila(page, 'Regar')).toBeVisible();
	await abrir(page, 'Regar');
	await expect(barraDePestanas(page)).toBeVisible();

	// 2: se gira sin recargar.
	await page.setViewportSize(CELULAR_HORIZONTAL);
	await expect.poll(() => page.evaluate(() => screen.orientation.type)).toMatch(/^landscape/);
	await expect.poll(() => page.evaluate(() => document.documentElement.clientWidth)).toBe(CELULAR_HORIZONTAL.width);
	await expect(barraDePestanas(page)).toHaveCount(0);
	await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Tarea', 'Cuándo', 'Acciones']);
	const ys: number[] = [];
	for (const nombre of ['Tarea', 'Cuándo', 'Acciones'])
		ys.push((await page.getByRole('heading', { name: nombre, level: 3 }).boundingBox())!.y);
	expect(ys[0]).toBeLessThan(ys[1]);
	expect(ys[1]).toBeLessThan(ys[2]);
	await sinPedidoDeGirar(page);

	// 3: sin el panel, Historial y Etiquetas se ven enteras.
	await cerrar(page);
	for (const pestana of ['Pendientes', 'Historial', 'Etiquetas'] as const) {
		await irA(page, pestana);
		await expect(page.getByRole('navigation')).toBeVisible();
		await sinDesbordeHorizontal(page);
		await sinPedidoDeGirar(page);
	}
	await irA(page, 'Pendientes');

	// 4: de vuelta en vertical, el panel vuelve al diseño de celular.
	await page.setViewportSize(CELULAR_VERTICAL);
	await expect.poll(() => page.evaluate(() => document.documentElement.clientWidth)).toBe(CELULAR_VERTICAL.width);
	await abrir(page, 'Regar');
	await expect(barraDePestanas(page)).toBeVisible();

	// 5
	await sinBloqueoPropio(page, anotaciones);
	await ctx.close();
});

// ---------------------------------------------------------------------------
// Flujo 4: en la compu no cambia nada
// ---------------------------------------------------------------------------

test('Flujo 4: en la compu no cambia nada', async ({ browser }) => {
	const { ctx, page, anotaciones } = await sesion(browser, { viewport: COMPU, hasTouch: false });
	await regar(page);
	await expect(fila(page, 'Regar')).toBeVisible();
	await sinPedidoDeGirar(page);

	await irA(page, 'Historial');
	await sinPedidoDeGirar(page);
	await irA(page, 'Etiquetas');
	await sinPedidoDeGirar(page);
	await irA(page, 'Pendientes');

	await abrir(page, 'Regar');
	await expect(barraDePestanas(page)).toHaveCount(0);
	await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Tarea', 'Cuándo', 'Acciones']);
	await sinPedidoDeGirar(page);
	await sinBloqueoPropio(page, anotaciones);
	await ctx.close();
});

// ---------------------------------------------------------------------------
// Flujo 5: versión nueva (dos builds en el mismo origen, e2e/versiones-apoyo.ts)
// ---------------------------------------------------------------------------

const AVISO = /actualiz|nueva versi[oó]n|recarg|reinici|instal/i;

/** El build actual (`nueva`) y una copia suya con otra versión y el manifest sin `orientation` (`anterior`). */
function dosBuilds() {
	const raiz = join(process.cwd(), 'tmp', 'orientacion-versiones');
	const nueva = join(raiz, 'nueva');
	const anterior = join(raiz, 'anterior');
	rmSync(raiz, { recursive: true, force: true });
	mkdirSync(raiz, { recursive: true });
	cpSync(join(process.cwd(), 'build'), nueva, { recursive: true });
	versionConLasMismasFuentes(nueva, anterior);
	const archivo = join(anterior, 'manifest.webmanifest');
	const { orientation, ...sinOrientacion } = JSON.parse(readFileSync(archivo, 'utf8'));
	expect(orientation).toBe('portrait');
	writeFileSync(archivo, JSON.stringify(sinOrientacion));
	return { nueva, anterior };
}

test('Flujo 5: la versión con la orientación vertical llega sola, sin avisos ni preguntas', async ({ browser }) => {
	test.setTimeout(180_000);
	const { nueva, anterior } = dosBuilds();
	const estado = { dir: anterior };
	const servidor = await servir(estado);
	const ctx = await browser.newContext({ baseURL: ORIGEN_VERSIONES, locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires' });
	const vistos: string[] = [];
	ctx.on('dialog', (d) => {
		vistos.push(`dialog: ${d.message()}`);
		void d.dismiss();
	});
	try {
		// Paso 1: la app instalada, controlada por el build anterior (sin orientación).
		let page = await ctx.newPage();
		await entrar(page);
		await regar(page);
		await expect(fila(page, 'Regar')).toBeVisible();
		await controlada(page);
		expect(await cachesDe(page)).toEqual([`tareas-hogar-${versionDe(anterior)}`]);
		const href = await page.locator('link[rel="manifest"]').getAttribute('href');
		const antes = await page.evaluate((h) => fetch(h).then((r) => r.json()), href!);
		expect(antes.orientation).toBeUndefined();

		// Se publica el build actual y se abre la app de nuevo: sin aviso ni pregunta.
		estado.dir = nueva;
		const otra = await ctx.newPage();
		await otra.goto('/');
		await expect(pendientes(otra)).toBeVisible();
		await expect(async () => {
			expect(await hayVersionEsperando(otra)).toBe(true);
		}).toPass();
		for (const p of [page, otra]) {
			await expect(p.getByText(AVISO)).toHaveCount(0);
			await expect(p.getByRole('alert')).toHaveCount(0);
			await expect(p.getByRole('alertdialog')).toHaveCount(0);
			await expect(p.getByRole('dialog')).toHaveCount(0);
		}
		await otra.close();

		// Paso 3: se cierra la app y se vuelve a abrir; manda el service worker nuevo con el manifest nuevo.
		await page.close();
		await expect(async () => {
			const intento = await ctx.newPage();
			try {
				await intento.goto('/');
				await expect(pendientes(intento)).toBeVisible();
				expect(await cachesDe(intento)).toEqual([`tareas-hogar-${versionDe(nueva)}`]);
				expect(await intento.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
				await verificarManifest(intento);
			} finally {
				await intento.close();
			}
		}).toPass({ timeout: 30_000 });

		// Los datos y la sesión siguen intactos, y no hubo avisos ni preguntas.
		page = await ctx.newPage();
		await page.goto('/');
		await expect(fila(page, 'Regar')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Entrar con Google' })).toHaveCount(0);
		await expect(page.getByText(AVISO)).toHaveCount(0);
		expect(vistos).toEqual([]);
	} finally {
		await ctx.close();
		servidor.close();
	}
});
