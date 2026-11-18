import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	openTask,
	close,
	controlled,
	create,
	enter,
	setClock,
	row,
	goA,
	cleanEmulators
} from './support';
import { openStopped, screenName, withoutNotices, textVisible } from './screen-support';
import { cachesOf, hasVersionWaiting, ORIGIN_VERSIONS, serve, versionWithSameFonts, versionOf } from './versions-support';

// qa/orientacion-vertical.md. Esta suite habla del service worker (Flujo 5) y de la PWA: lo permite
// (las demás lo bloquean). Celular: 360x640 con emulación táctil.
test.use({ serviceWorkers: 'allow', viewport: { width: 360, height: 640 }, hasTouch: true });

const HOUR = '2026-07-15T08:00:00';
const PHONE_VERTICAL = { width: 360, height: 640 };
const PHONE_HORIZONTAL = { width: 740, height: 360 };
const COMPUTER = { width: 1280, height: 800 };

test.beforeEach(async () => {
	await cleanEmulators();
});

const pending = (page: Page) => page.getByRole('heading', { name: 'Pendientes', level: 1 });
const water = (page: Page) => create(page, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
const tabsBar = (page: Page) => page.getByRole('tablist');

// ---------------------------------------------------------------------------
// Espía de orientación y contrato de «Sin bloqueo propio»
// ---------------------------------------------------------------------------

/**
 * Antes de abrir la app envuelve `screen.orientation.lock` y `unlock` para anotar cada llamada, y
 * registra los eventos de giro, sin cambiar lo que hacen. Las anotaciones viven en el contexto, no
 * en la página: sobreviven a las recargas y valen para cualquier pestaña.
 */
async function spy(ctx: BrowserContext): Promise<string[]> {
	const annotations: string[] = [];
	await ctx.exposeBinding('qaOrientacion', (_font, text: string) => {
		annotations.push(text);
	});
	await ctx.addInitScript(() => {
		const annotate = (text: string) => (window as unknown as Record<string, (t: string) => void>).qaOrientacion(text);
		const orientationValue = screen.orientation;
		for (const method of ['lock', 'unlock'] as const) {
			const original = orientationValue[method] as (...args: unknown[]) => unknown;
			(orientationValue as unknown as Record<string, unknown>)[method] = function (this: unknown, ...args: unknown[]) {
				annotate(method);
				return original.apply(orientationValue, args);
			};
		}
		window.addEventListener('orientationchange', () => annotate('orientationchange'));
		orientationValue.addEventListener('change', () => annotate('change'));
	});
	return annotations;
}

/** Sin bloqueo propio: ninguna llamada a lock ni unlock, y nada gira el contenido. */
async function withoutLockOwn(page: Page, annotations: string[]) {
	expect(annotations.filter((a) => a === 'lock' || a === 'unlock')).toEqual([]);
	const transformations = await page.evaluate(() => [document.documentElement, document.body].map((e) => getComputedStyle(e).transform));
	expect(transformations).toEqual(['none', 'none']);
}

/** Sin pedido de girar el teléfono ni mención de la orientación. */
async function withoutRequestOfRotate(page: Page) {
	await withoutNotices(page);
	expect(await textVisible(page)).not.toMatch(/gir(á|a|ar|e)\b|orientaci|vertical|horizontal/i);
}

/** Entera: sin desplazamiento horizontal en la página. */
async function withoutOverflowHorizontal(page: Page) {
	const [width, visible] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
	expect(width).toBeLessThanOrEqual(visible);
}

/** Abre la app en un contexto nuevo con el espía puesto, la sesión iniciada y el service worker activo. */
async function session(browser: Browser, options: { viewport?: { width: number; height: number }; hasTouch?: boolean } = {}) {
	const ctx = await browser.newContext({
		baseURL: 'http://127.0.0.1:4173',
		locale: 'es-AR',
		timezoneId: 'America/Argentina/Buenos_Aires',
		...options
	});
	const annotations = await spy(ctx);
	const page = await ctx.newPage();
	await enter(page);
	await setClock(page, HOUR);
	await controlled(page);
	await expect(pending(page)).toBeVisible();
	return { ctx, page, annotations };
}

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

/** Contrato de «Manifest»: se descarga desde la página (por el service worker, si controla) y se parsea. */
async function verifyManifest(page: Page) {
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
	const { ctx, page } = await session(browser);
	const same = await verifyManifest(page);

	// Desde Historial y Anotaciones: es el mismo documento.
	for (const path of ['/historial', '/anotaciones']) {
		await page.goto(path);
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		expect(await verifyManifest(page)).toEqual(same);
	}

	// Sin sesión, en la pantalla de entrada.
	const withoutSession = await browser.newContext({ baseURL: 'http://127.0.0.1:4173', locale: 'es-AR' });
	const entry = await withoutSession.newPage();
	await entry.goto('/');
	await expect(entry.getByRole('button', { name: 'Entrar con Google' })).toBeVisible();
	expect(await verifyManifest(entry)).toEqual(same);
	await withoutSession.close();
	await ctx.close();
});

// ---------------------------------------------------------------------------
// Flujo 2: ninguna pantalla fija la orientación por su cuenta
// ---------------------------------------------------------------------------

test('Flujo 2: ninguna pantalla fija la orientación por su cuenta', async ({ browser }) => {
	const { ctx, page, annotations } = await session(browser);
	await water(page);
	await expect(row(page, 'Regar')).toBeVisible();

	// La pantalla de carga, al abrir.
	const opening = await openStopped(page, HOUR);
	await opening.staysA(0.4);
	await withoutLockOwn(page, annotations);
	await opening.goesA(0.5);
	await expect(pending(page)).toBeVisible();
	await page.clock.resume();

	// Pendientes, Historial, Anotaciones.
	await withoutLockOwn(page, annotations);
	await goA(page, 'Historial');
	await withoutLockOwn(page, annotations);
	await goA(page, 'Anotaciones');
	await withoutLockOwn(page, annotations);
	await goA(page, 'Pendientes');

	// El panel de una tarea nueva.
	await page.getByRole('button', { name: '+' }).click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await withoutLockOwn(page, annotations);
	await close(page);

	// El de una existente, en sus tres pestañas.
	await openTask(page, 'Regar');
	await expect(page.getByRole('tab')).toHaveCount(3);
	for (const name of ['Tarea', 'Cuándo', 'Acciones']) {
		await page.getByRole('tab', { name: new RegExp(`^${name}`) }).click();
		await withoutLockOwn(page, annotations);
	}

	// Un aviso del panel: cerrar con cambios sin guardar.
	await page.getByRole('tab', { name: /^Tarea/ }).click();
	await page.getByLabel('Título').fill('Regar mucho');
	await page.getByRole('button', { name: 'Cerrar' }).click();
	const notice = page.getByRole('alertdialog', { name: 'Tenés cambios sin guardar' });
	await expect(notice).toBeVisible();
	await withoutLockOwn(page, annotations);
	await notice.getByRole('button', { name: 'Descartar', exact: true }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);

	// Sin sesión, la pantalla de entrada.
	const withoutSession = await browser.newContext({ baseURL: 'http://127.0.0.1:4173', locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires' });
	const entryAnnotations = await spy(withoutSession);
	const entry = await withoutSession.newPage();
	await entry.goto('/');
	await expect(entry.getByRole('button', { name: 'Entrar con Google' })).toBeVisible();
	await withoutLockOwn(entry, entryAnnotations);
	await withoutSession.close();
	await ctx.close();
});

// ---------------------------------------------------------------------------
// Flujo 3: en una pestaña del navegador sigue girando
// ---------------------------------------------------------------------------

test('Flujo 3: en una pestaña del navegador sigue girando con el diseño ancho en horizontal', async ({ browser }) => {
	const { ctx, page, annotations } = await session(browser);
	await water(page);

	// 1: en vertical, el panel tiene barra de pestañas.
	await expect(row(page, 'Regar')).toBeVisible();
	await openTask(page, 'Regar');
	await expect(tabsBar(page)).toBeVisible();

	// 2: se gira sin recargar.
	await page.setViewportSize(PHONE_HORIZONTAL);
	await expect.poll(() => page.evaluate(() => screen.orientation.type)).toMatch(/^landscape/);
	await expect.poll(() => page.evaluate(() => document.documentElement.clientWidth)).toBe(PHONE_HORIZONTAL.width);
	await expect(tabsBar(page)).toHaveCount(0);
	await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Tarea', 'Cuándo', 'Acciones']);
	const ys: number[] = [];
	for (const name of ['Tarea', 'Cuándo', 'Acciones'])
		ys.push((await page.getByRole('heading', { name, level: 3 }).boundingBox())!.y);
	expect(ys[0]).toBeLessThan(ys[1]);
	expect(ys[1]).toBeLessThan(ys[2]);
	await withoutRequestOfRotate(page);

	// 3: sin el panel, Historial y Anotaciones se ven enteras.
	await close(page);
	for (const tab of ['Pendientes', 'Historial', 'Anotaciones'] as const) {
		await goA(page, tab);
		await expect(page.getByRole('navigation')).toBeVisible();
		await withoutOverflowHorizontal(page);
		await withoutRequestOfRotate(page);
	}
	await goA(page, 'Pendientes');

	// 4: de vuelta en vertical, el panel vuelve al diseño de celular.
	await page.setViewportSize(PHONE_VERTICAL);
	await expect.poll(() => page.evaluate(() => document.documentElement.clientWidth)).toBe(PHONE_VERTICAL.width);
	await openTask(page, 'Regar');
	await expect(tabsBar(page)).toBeVisible();

	// 5
	await withoutLockOwn(page, annotations);
	await ctx.close();
});

// ---------------------------------------------------------------------------
// Flujo 4: en la compu no cambia nada
// ---------------------------------------------------------------------------

test('Flujo 4: en la compu no cambia nada', async ({ browser }) => {
	const { ctx, page, annotations } = await session(browser, { viewport: COMPUTER, hasTouch: false });
	await water(page);
	await expect(row(page, 'Regar')).toBeVisible();
	await withoutRequestOfRotate(page);

	await goA(page, 'Historial');
	await withoutRequestOfRotate(page);
	await goA(page, 'Anotaciones');
	await withoutRequestOfRotate(page);
	await goA(page, 'Pendientes');

	await openTask(page, 'Regar');
	await expect(tabsBar(page)).toHaveCount(0);
	await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Tarea', 'Cuándo', 'Acciones']);
	await withoutRequestOfRotate(page);
	await withoutLockOwn(page, annotations);
	await ctx.close();
});

// ---------------------------------------------------------------------------
// Flujo 5: versión nueva (dos builds en el mismo origen, e2e/versiones-apoyo.ts)
// ---------------------------------------------------------------------------

const NOTICE = /actualiz|nueva versi[oó]n|recarg|reinici|instal/i;

/** El build actual (`nueva`) y una copia suya con otra versión y el manifest sin `orientation` (`anterior`). */
function twoBuilds() {
	const root = join(process.cwd(), 'tmp', 'orientacion-versiones');
	const fresh = join(root, 'nueva');
	const previous = join(root, 'anterior');
	rmSync(root, { recursive: true, force: true });
	mkdirSync(root, { recursive: true });
	cpSync(join(process.cwd(), 'build'), fresh, { recursive: true });
	versionWithSameFonts(fresh, previous);
	const file = join(previous, 'manifest.webmanifest');
	const { orientation, ...withoutOrientation } = JSON.parse(readFileSync(file, 'utf8'));
	expect(orientation).toBe('portrait');
	writeFileSync(file, JSON.stringify(withoutOrientation));
	return { fresh, previous };
}

test('Flujo 5: la versión con la orientación vertical llega sola, sin avisos ni preguntas', async ({ browser }) => {
	test.setTimeout(180_000);
	const { fresh, previous } = twoBuilds();
	const status = { dir: previous };
	const server = await serve(status);
	const ctx = await browser.newContext({ baseURL: ORIGIN_VERSIONS, locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires' });
	const seen: string[] = [];
	ctx.on('dialog', (d) => {
		seen.push(`dialog: ${d.message()}`);
		void d.dismiss();
	});
	try {
		// Paso 1: la app instalada, controlada por el build anterior (sin orientación).
		let page = await ctx.newPage();
		await enter(page);
		await water(page);
		await expect(row(page, 'Regar')).toBeVisible();
		await controlled(page);
		expect(await cachesOf(page)).toEqual([`tareas-hogar-${versionOf(previous)}`]);
		const href = await page.locator('link[rel="manifest"]').getAttribute('href');
		const before = await page.evaluate((h) => fetch(h).then((r) => r.json()), href!);
		expect(before.orientation).toBeUndefined();

		// Se publica el build actual y se abre la app de nuevo: sin aviso ni pregunta.
		status.dir = fresh;
		const other = await ctx.newPage();
		await other.goto('/');
		await expect(pending(other)).toBeVisible();
		await expect(async () => {
			expect(await hasVersionWaiting(other)).toBe(true);
		}).toPass();
		for (const p of [page, other]) {
			await expect(p.getByText(NOTICE)).toHaveCount(0);
			await expect(p.getByRole('alert')).toHaveCount(0);
			await expect(p.getByRole('alertdialog')).toHaveCount(0);
			await expect(p.getByRole('dialog')).toHaveCount(0);
		}
		await other.close();

		// Paso 3: se cierra la app y se vuelve a abrir; manda el service worker nuevo con el manifest nuevo.
		await page.close();
		await expect(async () => {
			const attempt = await ctx.newPage();
			try {
				await attempt.goto('/');
				await expect(pending(attempt)).toBeVisible();
				expect(await cachesOf(attempt)).toEqual([`tareas-hogar-${versionOf(fresh)}`]);
				expect(await attempt.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
				await verifyManifest(attempt);
			} finally {
				await attempt.close();
			}
		}).toPass({ timeout: 30_000 });

		// Los datos y la sesión siguen intactos, y no hubo avisos ni preguntas.
		page = await ctx.newPage();
		await page.goto('/');
		await expect(row(page, 'Regar')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Entrar con Google' })).toHaveCount(0);
		await expect(page.getByText(NOTICE)).toHaveCount(0);
		expect(seen).toEqual([]);
	} finally {
		await ctx.close();
		server.close();
	}
});
