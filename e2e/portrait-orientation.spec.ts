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

// qa/portrait-orientation.md. This suite exercises the service worker (Flow 5) and the PWA, so it allows it
// (the others block it). Celular: 360x640 with touch emulation.
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
// Orientation spy and the «Sin bloqueo propio» contract
// ---------------------------------------------------------------------------

/**
 * Before opening the app it wraps `screen.orientation.lock` and `unlock` to record each call, and
 * records the rotation events, without changing what they do. The records live in the context, not
 * in the page: they survive reloads and apply to any tab.
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

/** No lock of its own: no call to lock or unlock, and nothing rotates the content. */
async function withoutLockOwn(page: Page, annotations: string[]) {
	expect(annotations.filter((a) => a === 'lock' || a === 'unlock')).toEqual([]);
	const transformations = await page.evaluate(() => [document.documentElement, document.body].map((e) => getComputedStyle(e).transform));
	expect(transformations).toEqual(['none', 'none']);
}

/** No request to rotate the phone and no mention of orientation. */
async function withoutRequestOfRotate(page: Page) {
	await withoutNotices(page);
	expect(await textVisible(page)).not.toMatch(/gir(á|a|ar|e)\b|orientaci|vertical|horizontal/i);
}

/** Whole: no horizontal scrolling on the page. */
async function withoutOverflowHorizontal(page: Page) {
	const [width, visible] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
	expect(width).toBeLessThanOrEqual(visible);
}

/** Opens the app in a new context with the spy in place, the session started and the service worker active. */
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

/** The «Manifest» contract: it is downloaded from the page (through the service worker, if it controls) and parsed. */
async function verifyManifest(page: Page) {
	const href = await page.locator('link[rel="manifest"]').getAttribute('href');
	expect(href).toBeTruthy();
	const manifest = await page.evaluate((h) => fetch(h).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))), href!);
	expect(manifest.name).toBe('Tareas Hogar');
	expect(manifest.short_name).toBe('Tareas');
	expect(manifest.display).toBe('standalone');
	// `portrait`: neither `portrait-primary` nor `portrait-secondary` (they would fix a direction), nor `landscape`, `any` or absent.
	expect(manifest.orientation).toBe('portrait');
	return manifest;
}

test('Flow 1: el manifest declara la orientación vertical', async ({ browser }) => {
	const { ctx, page } = await session(browser);
	const same = await verifyManifest(page);

	// From Historial: it is the same document.
	await page.goto('/history');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	expect(await verifyManifest(page)).toEqual(same);

	// Without a session, on the login screen.
	const withoutSession = await browser.newContext({ baseURL: 'http://127.0.0.1:4173', locale: 'es-AR' });
	const entry = await withoutSession.newPage();
	await entry.goto('/');
	await expect(entry.getByRole('button', { name: 'Entrar con Google' })).toBeVisible();
	expect(await verifyManifest(entry)).toEqual(same);
	await withoutSession.close();
	await ctx.close();
});

// ---------------------------------------------------------------------------
// Flow 2: no screen fixes the orientation on its own
// ---------------------------------------------------------------------------

test('Flow 2: ninguna pantalla fija la orientación por su cuenta', async ({ browser }) => {
	const { ctx, page, annotations } = await session(browser);
	await water(page);
	await expect(row(page, 'Regar')).toBeVisible();

	// The loading screen, on opening.
	const opening = await openStopped(page, HOUR);
	await opening.staysA(0.4);
	await withoutLockOwn(page, annotations);
	await opening.goesA(0.5);
	await expect(pending(page)).toBeVisible();
	await page.clock.resume();

	// Pendientes, Historial.
	await withoutLockOwn(page, annotations);
	await goA(page, 'Historial');
	await withoutLockOwn(page, annotations);
	await goA(page, 'Pendientes');

	// The panel of a new task.
	await page.getByRole('button', { name: '+' }).click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await withoutLockOwn(page, annotations);
	await close(page);

	// That of an existing one, in its three tabs.
	await openTask(page, 'Regar');
	await expect(page.getByRole('tab')).toHaveCount(3);
	for (const name of ['Tarea', 'Cuándo', 'Acciones']) {
		await page.getByRole('tab', { name: new RegExp(`^${name}`) }).click();
		await withoutLockOwn(page, annotations);
	}

	// A panel notice: closing with unsaved changes.
	await page.getByRole('tab', { name: /^Tarea/ }).click();
	await page.getByLabel('Título').fill('Regar mucho');
	await page.getByRole('button', { name: 'Cerrar' }).click();
	const notice = page.getByRole('alertdialog', { name: 'Tenés cambios sin guardar' });
	await expect(notice).toBeVisible();
	await withoutLockOwn(page, annotations);
	await notice.getByRole('button', { name: 'Descartar', exact: true }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);

	// Without a session, the login screen.
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
// Flow 3: in a browser tab it keeps rotating
// ---------------------------------------------------------------------------

test('Flow 3: en una pestaña del navegador sigue girando con el diseño ancho en horizontal', async ({ browser }) => {
	const { ctx, page, annotations } = await session(browser);
	await water(page);

	// 1: in portrait, the panel has a tab bar.
	await expect(row(page, 'Regar')).toBeVisible();
	await openTask(page, 'Regar');
	await expect(tabsBar(page)).toBeVisible();

	// 2: it is rotated without reloading.
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

	// 3: without the panel, Historial is seen whole.
	await close(page);
	for (const tab of ['Pendientes', 'Historial'] as const) {
		await goA(page, tab);
		await expect(page.getByRole('navigation')).toHaveCount(0);
		await withoutOverflowHorizontal(page);
		await withoutRequestOfRotate(page);
	}
	await goA(page, 'Pendientes');

	// 4: back in portrait, the panel returns to the phone layout.
	await page.setViewportSize(PHONE_VERTICAL);
	await expect.poll(() => page.evaluate(() => document.documentElement.clientWidth)).toBe(PHONE_VERTICAL.width);
	await openTask(page, 'Regar');
	await expect(tabsBar(page)).toBeVisible();

	// 5
	await withoutLockOwn(page, annotations);
	await ctx.close();
});

// ---------------------------------------------------------------------------
// Flow 4: on the desktop nothing changes
// ---------------------------------------------------------------------------

test('Flow 4: en la compu no cambia nada', async ({ browser }) => {
	const { ctx, page, annotations } = await session(browser, { viewport: COMPUTER, hasTouch: false });
	await water(page);
	await expect(row(page, 'Regar')).toBeVisible();
	await withoutRequestOfRotate(page);

	await goA(page, 'Historial');
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
// Flow 5: new version (two builds on the same origin, e2e/versions-support.ts)
// ---------------------------------------------------------------------------

const NOTICE = /actualiz|nueva versi[oó]n|recarg|reinici|instal/i;

/** The current build (`fresh`) and a copy of it with another version and the manifest without `orientation` (`previous`). */
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

test('Flow 5: la versión con la orientación vertical llega sola, sin avisos ni preguntas', async ({ browser }) => {
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
		// Step 1: the app installed, controlled by the previous build (without orientation).
		let page = await ctx.newPage();
		await enter(page);
		await water(page);
		await expect(row(page, 'Regar')).toBeVisible();
		await controlled(page);
		expect(await cachesOf(page)).toEqual([`tareas-hogar-${versionOf(previous)}`]);
		const href = await page.locator('link[rel="manifest"]').getAttribute('href');
		const before = await page.evaluate((h) => fetch(h).then((r) => r.json()), href!);
		expect(before.orientation).toBeUndefined();

		// The current build is published and the app is opened again: no notice or prompt.
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

		// Step 3: the app is closed and reopened; the new service worker takes over with the new manifest.
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

		// The data and the session are intact, and there were no notices or prompts.
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
