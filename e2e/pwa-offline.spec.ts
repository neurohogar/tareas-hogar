import { expect, test, type Browser, type Page } from '@playwright/test';
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import {
	remove,
	complete,
	create,
	device,
	edit,
	turnOnCompleted,
	enter,
	waitStatus,
	row,
	goA,
	cleanEmulators,
	arrivesOnServer
} from './support';
import { cachesOf, hasVersionWaiting, ORIGIN_VERSIONS, serve, versionOf } from './versions-support';

// This suite exercises the service worker, so it allows it (the others block it).
test.use({ serviceWorkers: 'allow' });

const HOUR = '2026-07-15T08:00:00';
const EMPTY_HISTORY = 'Todavía no completaste nada';

test.beforeEach(async () => {
	await cleanEmulators();
});

const pending = (page: Page) => page.getByRole('heading', { name: 'Pendientes', level: 1 });
const withoutConnection = (page: Page) => page.getByText('Sin conexión', { exact: true });

/** Waits for the active service worker and reloads (online) until the page is controlled. */
async function controlled(page: Page) {
	await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
	await expect(async () => {
		if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) await page.reload();
		expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
	}).toPass();
}

const oneOff = (page: Page, title: string, date?: string) =>
	create(page, { title, kind: 'No se repite', date });

/** A session (A) with the clock at HORA and the service worker controlling the page. */
async function sessionPwa(browser: Browser, first = true) {
	const d = await device(browser, HOUR, first);
	await controlled(d.page);
	await expect(pending(d.page)).toBeVisible();
	return d;
}

async function reload(page: Page) {
	await page.reload();
	await expect(pending(page)).toBeVisible();
}

async function historyEmptyIn(page: Page) {
	await goA(page, 'Historial');
	await expect(page.getByText(EMPTY_HISTORY)).toBeVisible();
}

test('Flow 1: PWA instalable', async ({ page, context }) => {
	await page.addInitScript(() => {
		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			(window as unknown as { __install: unknown }).__install = e;
		});
	});
	await page.goto('/');
	await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));

	// Manifest.
	const href = await page.locator('link[rel="manifest"]').getAttribute('href');
	expect(href).toBeTruthy();
	const response = await page.request.get(new URL(href!, page.url()).toString());
	expect(response.ok()).toBe(true);
	const manifest = await response.json();
	expect(manifest.name).toBe('Tareas Hogar');
	expect(manifest.short_name).toBe('Tareas');
	expect(manifest.display).toBe('standalone');
	const start = new URL(manifest.start_url, new URL(href!, page.url()));
	const scope = new URL(manifest.scope ?? './', new URL(href!, page.url()));
	expect(start.origin).toBe(scope.origin);
	expect(start.pathname.startsWith(scope.pathname)).toBe(true);
	for (const side of ['192x192', '512x512']) {
		const icon = manifest.icons.find((i: { sizes: string }) => i.sizes.split(' ').includes(side));
		expect(icon, `ícono ${side}`).toBeTruthy();
		const img = await page.request.get(new URL(icon.src, new URL(href!, page.url())).toString());
		expect(img.ok()).toBe(true);
		expect(img.headers()['content-type']).toMatch(/^image\//);
	}

	// Active service worker scoped to the root.
	const record = await page.evaluate(async () => {
		const r = await navigator.serviceWorker.getRegistration();
		return { status: r?.active?.state, scope: r?.scope };
	});
	expect(record.status).toBe('activated');
	expect(new URL(page.url()).href.startsWith(record.scope!)).toBe(true);

	// Reload: the page is controlled.
	await page.reload();
	await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

	// Installable according to the browser.
	const cdp = await context.newCDPSession(page);
	await cdp.send('Page.enable');
	await expect(async () => {
		const { installabilityErrors } = (await cdp.send('Page.getInstallabilityErrors')) as {
			installabilityErrors: unknown[];
		};
		expect(installabilityErrors).toEqual([]);
	}).toPass();
});

test('Flow 2: abrir sin conexión tras el primer login', async ({ browser }) => {
	const { ctx, page } = await sessionPwa(browser);
	await oneOff(page, 'Regar');
	await expect(row(page, 'Regar')).toBeVisible();
	await controlled(page);

	await ctx.setOffline(true);
	await page.reload();
	await expect(pending(page)).toBeVisible();
	await expect(page.getByRole('button', { name: 'Entrar con Google' })).toHaveCount(0);
	await expect(row(page, 'Regar')).toBeVisible();

	await page.goto('/history');
	await expect(page.getByRole('heading', { name: 'Historial', level: 1 })).toBeVisible();
	await expect(page.getByText(EMPTY_HISTORY)).toBeVisible();
	await page.reload();
	await expect(page.getByText(EMPTY_HISTORY)).toBeVisible();

	await page.close();
	const fresh = await ctx.newPage();
	await fresh.goto('/');
	await expect(pending(fresh)).toBeVisible();
	await expect(row(fresh, 'Regar')).toBeVisible();

	await ctx.setOffline(false);
	await expect(withoutConnection(fresh)).toHaveCount(0);
	await expect(fresh.getByRole('button', { name: 'Entrar con Google' })).toHaveCount(0);
	await expect(pending(fresh)).toBeVisible();
	await expect(row(fresh, 'Regar')).toBeVisible();
	await ctx.close();
});

test('Flow 3: completar sin conexión y sincronizar', async ({ browser }) => {
	const a = await sessionPwa(browser, true);
	const b = await sessionPwa(browser, false);
	await turnOnCompleted(a.page);
	await turnOnCompleted(b.page);
	await create(a.page, { title: 'Regar', kind: 'Intervalo', every: '1', unit: 'días' });
	await waitStatus(a.page, 'Regar', 'pendiente');
	await waitStatus(b.page, 'Regar', 'pendiente');

	await a.ctx.setOffline(true);
	await complete(a.page, 'Regar');
	await waitStatus(a.page, 'Regar', 'en espera');
	await waitStatus(b.page, 'Regar', 'pendiente');

	await goA(a.page, 'Historial');
	await expect(row(a.page, 'Regar')).toHaveCount(1);
	await expect(a.page.getByRole('heading', { name: 'Hoy' })).toBeVisible();
	await expect(row(a.page, 'Regar')).toContainText(/\d\d:\d\d/);

	await a.page.reload();
	await expect(a.page.getByRole('heading', { name: 'Historial', level: 1 })).toBeVisible();
	await expect(row(a.page, 'Regar')).toHaveCount(1);
	await goA(a.page, 'Pendientes');
	await waitStatus(a.page, 'Regar', 'en espera');

	await a.ctx.setOffline(false);
	await waitStatus(b.page, 'Regar', 'en espera');
	await goA(b.page, 'Historial');
	await expect(row(b.page, 'Regar')).toHaveCount(1);
	await expect(row(b.page, 'Regar')).toContainText(/\d\d:\d\d/);
	await a.ctx.close();
	await b.ctx.close();
});

test('Flow 4: crear, editar y borrar sin conexión', async ({ browser }) => {
	const a = await sessionPwa(browser, true);
	const b = await sessionPwa(browser, false);
	await a.ctx.setOffline(true);

	await oneOff(a.page, 'Barrer');
	await oneOff(a.page, 'Pagar', '2026-07-20');
	await expect(row(a.page, 'Barrer')).toBeVisible();
	await expect(row(a.page, 'Pagar')).toBeVisible();
	await expect(row(b.page, 'Barrer')).toHaveCount(0);
	await expect(row(b.page, 'Pagar')).toHaveCount(0);

	await edit(a.page, 'Barrer', { title: 'Barrer patio' });
	await expect(row(a.page, 'Barrer patio')).toBeVisible();

	await complete(a.page, 'Pagar');
	await expect(row(a.page, 'Pagar')).toHaveCount(0);
	await a.page.getByRole('status').getByRole('button', { name: 'Deshacer' }).click();
	await expect(row(a.page, 'Pagar')).toBeVisible();

	await remove(a.page, 'Pagar');
	await expect(row(a.page, 'Pagar')).toHaveCount(0);

	await reload(a.page);
	await expect(row(a.page, 'Barrer patio')).toBeVisible();
	await expect(row(a.page, 'Pagar')).toHaveCount(0);
	await expect(a.page.getByRole('listitem')).toHaveCount(1);
	await historyEmptyIn(a.page);

	await a.ctx.setOffline(false);
	await expect(row(b.page, 'Barrer patio')).toBeVisible();
	await expect(row(b.page, 'Pagar')).toHaveCount(0);
	await historyEmptyIn(b.page);
	await a.ctx.close();
	await b.ctx.close();
});

test('Flow 5: la escritura pendiente sobrevive a una recarga', async ({ browser }) => {
	const a = await sessionPwa(browser, true);
	const b = await sessionPwa(browser, false);
	await a.ctx.setOffline(true);

	await oneOff(a.page, 'Comprar pan');
	await expect(row(a.page, 'Comprar pan')).toBeVisible();
	await reload(a.page);
	await expect(row(a.page, 'Comprar pan')).toBeVisible();

	await complete(a.page, 'Comprar pan');
	await expect(row(a.page, 'Comprar pan')).toHaveCount(0);
	await reload(a.page);
	await expect(row(a.page, 'Comprar pan')).toHaveCount(0);
	await goA(a.page, 'Historial');
	await expect(row(a.page, 'Comprar pan')).toHaveCount(1);

	await a.page.close();
	const fresh = await a.ctx.newPage();
	await fresh.goto('/');
	await expect(pending(fresh)).toBeVisible();
	await expect(row(fresh, 'Comprar pan')).toHaveCount(0);
	await goA(fresh, 'Historial');
	await expect(row(fresh, 'Comprar pan')).toHaveCount(1);

	await a.ctx.setOffline(false);
	await goA(b.page, 'Historial');
	await expect(row(b.page, 'Comprar pan')).toHaveCount(1);
	await arrivesOnServer(b.page);
	await expect(row(b.page, 'Comprar pan')).toHaveCount(1);

	// Online variant.
	await goA(fresh, 'Pendientes');
	await oneOff(fresh, 'Lavar');
	await expect(row(fresh, 'Lavar')).toBeVisible();
	await reload(fresh);
	await expect(row(fresh, 'Lavar')).toBeVisible();
	await goA(b.page, 'Pendientes');
	await expect(row(b.page, 'Lavar')).toBeVisible();
	await complete(fresh, 'Lavar');
	await expect(row(fresh, 'Lavar')).toHaveCount(0);
	await reload(fresh);
	await expect(row(fresh, 'Lavar')).toHaveCount(0);
	await expect(row(b.page, 'Lavar')).toHaveCount(0);
	await goA(b.page, 'Historial');
	await expect(row(b.page, 'Lavar')).toHaveCount(1);
	await a.ctx.close();
	await b.ctx.close();
});

test('Flow 6: varias pestañas del mismo dispositivo', async ({ browser }) => {
	const a = await sessionPwa(browser, true);
	const p1 = a.page;
	const p2 = await a.ctx.newPage();
	await p2.goto('/');
	await expect(pending(p2)).toBeVisible();
	await expect(pending(p1)).toBeVisible();
	await expect(p1.getByText(/otra pestaña/i)).toHaveCount(0);
	await expect(p2.getByText(/otra pestaña/i)).toHaveCount(0);

	await oneOff(p1, 'Regar');
	await expect(row(p2, 'Regar')).toBeVisible();

	await a.ctx.setOffline(true);
	await oneOff(p1, 'Barrer');
	await expect(row(p2, 'Barrer')).toBeVisible();

	await a.ctx.setOffline(false);
	const b = await device(browser, HOUR, false);
	await expect(row(b.page, 'Regar')).toBeVisible();
	await expect(row(b.page, 'Barrer')).toBeVisible();
	await a.ctx.close();
	await b.ctx.close();
});

test('Flow 7: ida y vuelta de conexión', async ({ browser }) => {
	const a = await sessionPwa(browser, true);
	const b = await sessionPwa(browser, false);
	await oneOff(a.page, 'Regar');
	await oneOff(a.page, 'Barrer');
	await expect(row(b.page, 'Regar')).toBeVisible();
	await expect(row(b.page, 'Barrer')).toBeVisible();

	await a.ctx.setOffline(true);
	await complete(b.page, 'Regar');
	await expect(row(b.page, 'Regar')).toHaveCount(0);
	await arrivesOnServer(b.page);
	await expect(row(a.page, 'Regar')).toBeVisible();
	await a.ctx.setOffline(false);
	await expect(row(a.page, 'Regar')).toHaveCount(0);

	await a.ctx.setOffline(true);
	await complete(a.page, 'Barrer');
	await expect(row(a.page, 'Barrer')).toHaveCount(0);
	await a.page.waitForTimeout(2000);
	await a.ctx.setOffline(false);
	await expect(row(b.page, 'Barrer')).toHaveCount(0);

	for (const title of ['Uno', 'Dos']) {
		await a.ctx.setOffline(true);
		await oneOff(a.page, title);
		await expect(row(a.page, title)).toBeVisible();
		await a.page.waitForTimeout(1000);
		await a.ctx.setOffline(false);
		await expect(row(b.page, title)).toBeVisible();
	}
	await expect(a.page.getByRole('alert')).toHaveCount(0);
	await expect(b.page.getByRole('alert')).toHaveCount(0);
	await goA(b.page, 'Historial');
	await expect(b.page.getByRole('listitem')).toHaveCount(2);
	await a.ctx.close();
	await b.ctx.close();
});

test('Flow 8: aviso "Sin conexión"', async ({ browser }) => {
	const { ctx, page } = await sessionPwa(browser);
	await expect(withoutConnection(page)).toHaveCount(0);

	await ctx.setOffline(true);
	await expect(withoutConnection(page)).toBeVisible();

	await oneOff(page, 'Regar');
	await expect(row(page, 'Regar')).toBeVisible();
	await expect(page.getByText(/cambios pendientes|por sincronizar|sincroniz|\d+ pendiente/i)).toHaveCount(0);
	await expect(page.getByRole('status')).toHaveText('Sin conexión');

	await reload(page);
	await expect(row(page, 'Regar')).toBeVisible();
	await expect(withoutConnection(page)).toBeVisible();

	await ctx.setOffline(false);
	await expect(withoutConnection(page)).toHaveCount(0);
	await ctx.close();
});

test('Flow 9: abrir sin conexión sin haber iniciado sesión nunca', async ({ browser }) => {
	const ctx = await browser.newContext({ baseURL: 'http://127.0.0.1:4173', locale: 'es-AR' });
	const page = await ctx.newPage();
	await page.goto('/');
	const enterBtn = page.getByRole('button', { name: 'Entrar con Google' });
	await expect(enterBtn).toBeEnabled();
	await controlled(page);
	await expect(enterBtn).toBeVisible();

	await ctx.setOffline(true);
	await page.reload();
	await expect(enterBtn).toBeVisible();
	await expect(enterBtn).toBeDisabled();
	await expect(page.getByText('Necesitás conexión para entrar la primera vez')).toBeVisible();

	await ctx.setOffline(false);
	await expect(page.getByText('Necesitás conexión para entrar la primera vez')).toHaveCount(0);
	await expect(enterBtn).toBeEnabled();
	await ctx.close();
});

// --- Flow 10: two builds served from the same origin (e2e/versions-support.ts) ---

test('Flow 10: versión nueva del service worker', async ({ browser }) => {
	test.setTimeout(240_000);
	const root = join(process.cwd(), 'tmp', 'pwa-versiones');
	const v1 = join(root, 'v1');
	const v2 = join(root, 'v2');
	rmSync(root, { recursive: true, force: true });
	mkdirSync(root, { recursive: true });
	cpSync(join(process.cwd(), 'build'), v1, { recursive: true });
	// The second build replaces build/ (new version by timestamp); the preview serves that same build.
	await new Promise((r) => setTimeout(r, 1100));
	execSync('npm run build:qa', { stdio: 'ignore', cwd: process.cwd() });
	cpSync(join(process.cwd(), 'build'), v2, { recursive: true });
	expect(versionOf(v2)).not.toBe(versionOf(v1));

	const status = { dir: v1 };
	const server = await serve(status);
	const ctx = await browser.newContext({ baseURL: ORIGIN_VERSIONS, locale: 'es-AR' });
	try {
		let page = await ctx.newPage();
		await enter(page);
		await oneOff(page, 'Regar');
		await expect(row(page, 'Regar')).toBeVisible();
		await controlled(page);
		expect(await cachesOf(page)).toEqual([`tareas-hogar-${versionOf(v1)}`]);

		// The new build is published; the app is opened again (the previous page stays open).
		status.dir = v2;
		const other = await ctx.newPage();
		await other.goto('/');
		await expect(pending(other)).toBeVisible();
		await expect(async () => {
			expect(await hasVersionWaiting(other)).toBe(true);
		}).toPass();
		for (const p of [page, other]) {
			await expect(p.getByText(/actualiz|nueva versión|recargar/i)).toHaveCount(0);
			await expect(p.getByRole('alertdialog')).toHaveCount(0);
		}
		await other.close();

		// With the previous one open and the new one installed: offline, the two tabs can be navigated.
		await ctx.setOffline(true);
		await page.reload();
		await expect(pending(page)).toBeVisible();
		for (const tab of ['Historial', 'Pendientes'] as const) {
			await goA(page, tab);
			await page.reload();
			await expect(page.getByRole('heading', { name: tab, level: 1 })).toBeVisible();
		}
		await expect(page.getByText(/actualiz|nueva versión/i)).toHaveCount(0);
		await ctx.setOffline(false);

		// All pages are closed and it is opened again: the new service worker takes over.
		await page.close();
		await expect(async () => {
			const fresh = await ctx.newPage();
			try {
				await fresh.goto('/');
				await expect(pending(fresh)).toBeVisible();
				expect(await cachesOf(fresh)).toEqual([`tareas-hogar-${versionOf(v2)}`]);
				expect(await fresh.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
				await expect(row(fresh, 'Regar')).toBeVisible();
				await expect(fresh.getByText(/actualiz|nueva versión/i)).toHaveCount(0);
			} finally {
				await fresh.close();
			}
		}).toPass({ timeout: 30_000 });
		page = await ctx.newPage();
		await page.goto('/');
		await expect(row(page, 'Regar')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Entrar con Google' })).toHaveCount(0);
	} finally {
		await ctx.close();
		server.close();
	}
});

