import { expect, test, type Locator, type Page } from '@playwright/test';
import {
	openTask,
	addSchedule,
	fieldFrom,
	fieldTo,
	close,
	discard,
	complete,
	create,
	twoDevices,
	chooseEmoji,
	row,
	setDays,
	cleanEmulators,
	arrivesOnServer,
	selectorEmoji,
	sessionWithClock,
	onlyInSchedule, toggleShowPaused, toggleShowCompleted, goA
} from './support';

// qa/panel-mobile.md: the edit panel in tabs. Phone: 360x640 with touch emulation.
test.use({ viewport: { width: 360, height: 640 }, hasTouch: true });

test.beforeEach(async () => {
	await cleanEmulators();
});

const HOUR = '2026-07-15T10:00:00';

const panel = (page: Page) => page.getByRole('dialog').first();
const tab = (page: Page, name: string) => page.getByRole('tab', { name: new RegExp(`^${name}`) });
const mark = (page: Page, name: string) => tab(page, name).getByRole('img', { name: 'con errores' });
const save = (page: Page) => page.getByRole('button', { name: 'Guardar', exact: true });
const content = (page: Page) => panel(page).locator('.content');
const heading = (page: Page) => panel(page).locator('header');
const title = (page: Page) => page.getByLabel('Título');
const newTask = (page: Page) => page.getByRole('button', { name: '+' }).click();

/** The box of `l` is entirely inside the current viewport. */
async function inside(page: Page, l: Locator) {
	const c = (await l.boundingBox())!;
	const v = page.viewportSize()!;
	expect(c).not.toBeNull();
	expect(c.x).toBeGreaterThanOrEqual(-0.5);
	expect(c.y).toBeGreaterThanOrEqual(-0.5);
	expect(c.x + c.width).toBeLessThanOrEqual(v.width + 0.5);
	expect(c.y + c.height).toBeLessThanOrEqual(v.height + 0.5);
}

/** Visible: inside the viewport and not covered by another element (the center point belongs to `l` or a descendant). */
async function visibleWithoutCover(page: Page, l: Locator) {
	await expect(l).toBeVisible();
	await inside(page, l);
	const free = await l.evaluate((e) => {
		const r = e.getBoundingClientRect();
		const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
		return !!top && (e === top || e.contains(top) || top.contains(e));
	});
	expect(free).toBe(true);
}

const box = async (l: Locator) => (await l.boundingBox())!;
const scroll = (l: Locator) => l.evaluate((e) => e.scrollTop);

/** No horizontal scroll in the form and in the content. */
async function withoutOverflow(page: Page) {
	const measures = await page.evaluate(() => {
		const f = document.querySelector('form')!;
		const c = document.querySelector('.content')!;
		return { f: [f.scrollWidth, f.clientWidth], c: [c.scrollWidth, c.clientWidth], d: [document.documentElement.scrollWidth, document.documentElement.clientWidth] };
	});
	expect(measures.f[0]).toBeLessThanOrEqual(measures.f[1]);
	expect(measures.c[0]).toBeLessThanOrEqual(measures.c[1]);
	expect(measures.d[0]).toBeLessThanOrEqual(measures.d[1]);
}

/** Emulates the on-screen keyboard being open: focuses `campo` and shrinks the visual viewport. */
async function openKeyboard(page: Page, field: Locator) {
	await field.click();
	await page.setViewportSize({ width: 360, height: 300 });
}
async function closeKeyboard(page: Page) {
	await page.setViewportSize({ width: 360, height: 640 });
}

async function createWater(page: Page) {
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días' });
	await expect(row(page, 'Regar')).toBeVisible();
}

// ---------------------------------------------------------------------------------------------

test('Flow 1: crear en el celular', async ({ page }) => {
	await sessionWithClock(page, HOUR);
	await newTask(page);

	// 1: full screen, no focus, no keyboard.
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	const p = await box(panel(page));
	expect(p).toMatchObject({ x: 0, width: 360 });
	expect(p.y + p.height).toBeCloseTo(640, 0);
	expect(await page.evaluate(() => /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? ''))).toBe(false);
	await expect(title(page)).not.toBeFocused();
	await expect(save(page)).toBeVisible();

	// 2: tabs Tarea and Cuándo, without Acciones.
	await expect(page.getByRole('tab')).toHaveText([/^\s*Tarea/, /^\s*Cuándo/]);
	await expect(tab(page, 'Acciones')).toHaveCount(0);
	await expect(tab(page, 'Tarea')).toHaveAttribute('aria-selected', 'true');
	await expect(title(page)).toBeVisible();
	await expect(page.getByRole('button', { name: 'Elegir emoji' })).toBeVisible();
	await expect(page.getByLabel('Nota')).toBeVisible();
	await expect(page.getByRole('radio', { name: 'Intervalo' })).toBeHidden();
	await expect(onlyInSchedule(page)).toBeHidden();
	await visibleWithoutCover(page, save(page));

	// 3: Cuándo.
	await tab(page, 'Cuándo').click();
	await expect(tab(page, 'Cuándo')).toHaveAttribute('aria-selected', 'true');
	const radios = ['No se repite', 'Intervalo', 'Días de la semana', 'Días del mes'].map((n) => page.getByRole('radio', { name: n }));
	const boxes = [];
	for (const r of radios) boxes.push(await box(r.locator('xpath=ancestor::label[1]')));
	expect(Math.abs(boxes[0].y - boxes[1].y)).toBeLessThan(4);
	expect(Math.abs(boxes[2].y - boxes[3].y)).toBeLessThan(4);
	expect(boxes[2].y).toBeGreaterThan(boxes[0].y + 10);
	expect(Math.abs(boxes[0].x - boxes[2].x)).toBeLessThan(4);
	await expect(radios[0]).toBeChecked();
	await expect(onlyInSchedule(page)).toBeVisible();
	await visibleWithoutCover(page, save(page));
	await tab(page, 'Tarea').click();
	await expect(title(page)).toBeVisible();

	// 4: swiping does not change tabs.
	const c = await box(content(page));
	const y = c.y + c.height / 2;
	await page.mouse.move(c.x + c.width - 20, y);
	await page.mouse.down();
	await page.mouse.move(c.x + 20, y, { steps: 8 });
	await page.mouse.up();
	await expect(tab(page, 'Tarea')).toHaveAttribute('aria-selected', 'true');
	await expect(tab(page, 'Cuándo')).toHaveAttribute('aria-selected', 'false');

	// 5: create Regar.
	await title(page).fill('Regar');
	await tab(page, 'Cuándo').click();
	await page.getByRole('radio', { name: 'Intervalo' }).check();
	await page.getByRole('spinbutton', { name: 'Cada' }).fill('2');
	await page.getByLabel('Unidad').selectOption({ label: 'días' });
	await save(page).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(row(page, 'Regar')).toBeVisible();

	// 6: Cerrar discards.
	await newTask(page);
	await close(page);
	await expect(page.getByRole('listitem').filter({ has: page.getByRole('checkbox') })).toHaveCount(1);
});

test('Flow 2: editar y las tres pestañas', async ({ page }) => {
	await sessionWithClock(page, HOUR);
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'horas', emoji: '🌱', note: 'Las del balcón' });
	await expect(row(page, 'Regar')).toBeVisible();
	await page.clock.setSystemTime(new Date('2026-07-15T08:00:00'));
	await complete(page, 'Regar');
	await page.clock.setSystemTime(new Date(HOUR));
	await toggleShowCompleted(page, true);

	// 1
	await openTask(page, 'Regar');
	await expect(page.getByRole('tab')).toHaveText([/Tarea/, /Cuándo/, /Acciones/]);
	await tab(page, 'Acciones').click();
	await close(page);
	await openTask(page, 'Regar');
	await expect(tab(page, 'Tarea')).toHaveAttribute('aria-selected', 'true');

	// 2: order in Tarea.
	await expect(page.getByText('Última vez: hoy 08:00')).toBeVisible();
	await expect(panel(page).getByText('Pausada', { exact: true })).toHaveCount(0);
	await expect(panel(page).getByText(/Pospuesta/)).toHaveCount(0);
	const andLast = (await box(page.getByText('Última vez: hoy 08:00'))).y;
	const andTitle = (await box(title(page))).y;
	const andRemove = (await box(page.getByRole('button', { name: 'Quitar emoji' }))).y;
	const andNote = (await box(page.getByLabel('Nota'))).y;
	expect(andLast).toBeLessThan(andTitle);
	expect(andTitle).toBeLessThan(andRemove);
	expect(andRemove).toBeLessThan(andNote);
	await expect(title(page)).toHaveValue('Regar');
	const button = page.getByRole('button', { name: /Cambiar emoji/ });
	await expect(button).toHaveText('🌱');
	const cb = await box(button);
	const ct = await box(title(page));
	expect(Math.abs(cb.y + cb.height / 2 - (ct.y + ct.height / 2))).toBeLessThan(ct.height);
	await expect(page.getByLabel('Nota')).toHaveValue('Las del balcón');

	// 3
	await tab(page, 'Cuándo').click();
	await expect(page.getByRole('radio', { name: 'Intervalo' })).toBeChecked();
	await expect(page.getByRole('spinbutton', { name: 'Cada' })).toHaveValue('2');
	await expect(page.getByLabel('Unidad')).toHaveValue('horas');
	await expect(onlyInSchedule(page)).not.toBeChecked();

	// 4
	await tab(page, 'Acciones').click();
	const actions = ['1 hora', '3 horas', 'Hasta mañana', 'Pausar', 'Borrar tarea'];
	for (const a of actions) {
		const b = page.getByRole('button', { name: a, exact: true });
		await expect(b).toBeVisible();
		await expect(b.locator('svg')).toHaveCount(1);
	}
	await expect(page.getByRole('button', { name: 'Posponer', exact: true })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Quitar posponer' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Reanudar' })).toHaveCount(0);
	const remove = page.getByRole('button', { name: 'Borrar tarea' });
	const andPause = (await box(page.getByRole('button', { name: 'Pausar', exact: true }))).y;
	const cbo = await box(remove);
	expect(cbo.y).toBeGreaterThan(andPause + 44);
	const colorDelete = await remove.evaluate((e) => getComputedStyle(e).color);
	const colorError = await page.evaluate(() => {
		const t = document.createElement('i');
		t.style.color = 'var(--error)';
		document.body.append(t);
		const c = getComputedStyle(t).color;
		t.remove();
		return c;
	});
	expect(colorDelete).toBe(colorError);

	// 5
	await page.getByRole('button', { name: '1 hora', exact: true }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await openTask(page, 'Regar');
	await expect(tab(page, 'Tarea')).toHaveAttribute('aria-selected', 'true');
	await expect(panel(page).getByText('Pospuesta hasta 11:00')).toBeVisible();
	await tab(page, 'Acciones').click();
	await expect(page.getByRole('button', { name: 'Quitar posponer' })).toBeVisible();
	await expect(page.getByRole('button', { name: '1 hora', exact: true })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Pausar', exact: true })).toBeVisible();

	// 6
	await page.getByRole('button', { name: 'Quitar posponer' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await openTask(page, 'Regar');
	await expect(panel(page).getByText(/Pospuesta/)).toHaveCount(0);

	// 7
	await tab(page, 'Acciones').click();
	await page.getByRole('button', { name: 'Pausar', exact: true }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await toggleShowPaused(page, true);
	await openTask(page, 'Regar');
	await expect(panel(page).getByText('Pausada')).toBeVisible();
	await tab(page, 'Acciones').click();
	await expect(page.getByRole('button', { name: 'Reanudar' })).toBeVisible();
	await expect(page.getByRole('button', { name: '1 hora', exact: true })).toHaveCount(0);
	await close(page);

	// 8
	await create(page, { title: 'Pagar', kind: 'No se repite' });
	await openTask(page, 'Pagar');
	await tab(page, 'Acciones').click();
	await expect(page.getByRole('button', { name: 'Pausar', exact: true })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Reanudar' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: '1 hora', exact: true })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Borrar tarea' })).toBeVisible();
	await close(page);
	await complete(page, 'Pagar');
	await expect(row(page, 'Pagar')).toHaveCount(0);
	await goA(page, 'Historial');
	await openTask(page, 'Pagar');
	await expect(tab(page, 'Acciones')).toBeVisible();
	await tab(page, 'Acciones').click();
	await expect(page.getByRole('button', { name: 'Borrar tarea' })).toBeVisible();
});

test('Flow 3: pantalla completa y barras fijas', async ({ page }) => {
	await sessionWithClock(page, HOUR);
	await createWater(page);
	await openTask(page, 'Regar');

	// 1
	const pc = await box(panel(page));
	expect(pc).toMatchObject({ x: 0, y: 0, width: 360, height: 640 });
	const pos = async () => ({
		h: await box(heading(page)),
		t: await box(page.getByRole('tablist')),
		g: await box(save(page))
	});
	// 2: with how much is typed and a short viewport, the content does not fit.
	await page.getByLabel('Nota').fill(Array.from({ length: 30 }, (_, i) => `línea ${i + 1}`).join('\n'));
	await page.getByRole('heading', { name: 'Editar tarea' }).click();
	await page.setViewportSize({ width: 360, height: 440 });
	const before = await pos();
	await expect.poll(() => content(page).evaluate((e) => e.scrollHeight > e.clientHeight)).toBe(true);
	await content(page).hover();
	await page.mouse.wheel(0, 3000);
	await expect.poll(() => scroll(content(page))).toBeGreaterThan(0);
	expect(await pos()).toEqual(before);
	await visibleWithoutCover(page, save(page));
	await visibleWithoutCover(page, page.getByRole('tablist'));
	await visibleWithoutCover(page, page.getByRole('button', { name: 'Cerrar' }));

	// 3
	await tab(page, 'Cuándo').click();
	expect(await scroll(content(page))).toBe(0);
	await tab(page, 'Tarea').click();
	expect(await scroll(content(page))).toBe(0);

	// 4
	await tab(page, 'Cuándo').click();
	await page.getByRole('radio', { name: 'Días de la semana' }).check();
	await onlyInSchedule(page).check();
	for (let i = 0; i < 3; i++) await addSchedule(page).click();
	for (let i = 0; i < 4; i++) {
		await fieldFrom(page, i).fill('08:00');
		await fieldTo(page, i).fill('09:00');
	}
	await expect.poll(() => content(page).evaluate((e) => e.scrollHeight > e.clientHeight)).toBe(true);
	await page.mouse.wheel(0, 3000);
	await expect.poll(() => scroll(content(page))).toBeGreaterThan(0);
	expect(await pos()).toEqual(before);
	await withoutOverflow(page);
	await page.setViewportSize({ width: 320, height: 568 });
	await withoutOverflow(page);
	await visibleWithoutCover(page, save(page));
	await page.setViewportSize({ width: 360, height: 640 });
});

test('Problema original: sin desborde lateral ni Guardar fuera de pantalla', async ({ page }) => {
	await sessionWithClock(page, HOUR);
	await create(page, { title: 'Periódica', kind: 'Intervalo', every: '2', unit: 'días' });
	await create(page, { title: 'Pospuesta', kind: 'Intervalo', every: '2', unit: 'días' });
	await create(page, { title: 'Pausada', kind: 'Intervalo', every: '2', unit: 'días' });
	await openTask(page, 'Pospuesta');
	await tab(page, 'Acciones').click();
	await page.getByRole('button', { name: '1 hora', exact: true }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await openTask(page, 'Pausada');
	await tab(page, 'Acciones').click();
	await page.getByRole('button', { name: 'Pausar', exact: true }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await toggleShowPaused(page, true);

	for (const [width, height] of [
		[360, 640],
		[320, 568]
	]) {
		await page.setViewportSize({ width, height });
		for (const t of ['Periódica', 'Pospuesta', 'Pausada']) {
			await openTask(page, t);
			for (const p of ['Tarea', 'Cuándo', 'Acciones']) {
				await tab(page, p).click();
				await withoutOverflow(page);
				const g = await box(save(page));
				expect(g.x).toBeGreaterThanOrEqual(0);
				expect(g.x + g.width).toBeLessThanOrEqual(width);
				await visibleWithoutCover(page, save(page));
			}
			await close(page);
		}
	}
});

test('Flow 4: nada se pierde', async ({ page }) => {
	await sessionWithClock(page, HOUR);
	await newTask(page);

	// 1
	await title(page).fill('Barrer');
	await page.getByLabel('Nota').fill('Con cuidado');
	await tab(page, 'Cuándo').click();
	await page.getByRole('radio', { name: 'Días de la semana' }).check();
	await setDays(page, ['lunes', 'jueves']);
	await onlyInSchedule(page).check();
	await fieldFrom(page).fill('08:00');
	await fieldTo(page).fill('10:00');

	// 2
	await tab(page, 'Tarea').click();
	await expect(title(page)).toHaveValue('Barrer');
	await expect(page.getByLabel('Nota')).toHaveValue('Con cuidado');
	await tab(page, 'Cuándo').click();
	const week = page.getByRole('group', { name: 'Días de la semana' });
	await expect(week.getByRole('button', { name: 'lunes', exact: true })).toHaveAttribute('aria-pressed', 'true');
	await expect(week.getByRole('button', { name: 'jueves', exact: true })).toHaveAttribute('aria-pressed', 'true');
	await expect(fieldFrom(page)).toHaveValue('08:00');

	// 3
	await page.setViewportSize({ width: 1024, height: 768 });
	await expect(page.getByRole('tablist')).toHaveCount(0);
	await expect(title(page)).toHaveValue('Barrer');
	await expect(page.getByLabel('Nota')).toHaveValue('Con cuidado');
	await expect(fieldFrom(page)).toBeVisible();
	await page.setViewportSize({ width: 360, height: 640 });
	await expect(page.getByRole('tablist')).toBeVisible();
	await tab(page, 'Tarea').click();
	await expect(title(page)).toHaveValue('Barrer');
	await tab(page, 'Cuándo').click();

	// 4
	await save(page).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(row(page, 'Barrer')).toBeVisible();
	await openTask(page, 'Barrer');
	await expect(page.getByLabel('Nota')).toHaveValue('Con cuidado');
	await tab(page, 'Cuándo').click();
	await expect(page.getByRole('radio', { name: 'Días de la semana' })).toBeChecked();
	await expect(fieldFrom(page)).toHaveValue('08:00');
	await expect(fieldTo(page)).toHaveValue('10:00');

	// 5
	await tab(page, 'Tarea').click();
	await title(page).fill('Barrer más');
	await discard(page);
	await expect(row(page, 'Barrer')).toBeVisible();
	await expect(page.getByText('Barrer más')).toHaveCount(0);
	await openTask(page, 'Barrer');
	await tab(page, 'Tarea').click();
	await title(page).fill('Barrer más');
	await tab(page, 'Acciones').click();
	await page.getByRole('button', { name: 'Pausar', exact: true }).click();
	await page.getByRole('alertdialog', { name: 'Tenés cambios sin guardar' }).getByRole('button', { name: 'Descartar y pausar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await toggleShowPaused(page, true);
	await expect(page.getByText('Barrer más')).toHaveCount(0);
	await expect(row(page, 'Barrer')).toBeVisible();
});

test('Flow 5: errores', async ({ page }) => {
	await sessionWithClock(page, HOUR);
	await newTask(page);

	// 1
	await tab(page, 'Cuándo').click();
	await page.getByRole('radio', { name: 'Intervalo' }).check();
	await onlyInSchedule(page).check();
	await fieldFrom(page).fill('10:00');
	await fieldTo(page).fill('09:00');
	await save(page).click();
	await expect(page.getByRole('dialog')).toHaveCount(1);
	await expect(tab(page, 'Tarea')).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByText('Escribí un título.')).toBeVisible();
	await expect.poll(async () => {
		const c = await box(title(page));
		const cc = await box(content(page));
		return c.y >= cc.y && c.y + c.height <= cc.y + cc.height;
	}).toBe(true);
	await expect(mark(page, 'Tarea')).toBeVisible();
	await expect(mark(page, 'Cuándo')).toBeVisible();
	await expect(tab(page, 'Tarea').locator('svg')).toHaveCount(1);

	// 2
	await title(page).fill('Regar');
	await expect(mark(page, 'Tarea')).toHaveCount(0);
	await expect(mark(page, 'Cuándo')).toBeVisible();

	// 3
	await save(page).click();
	await expect(tab(page, 'Cuándo')).toHaveAttribute('aria-selected', 'true');
	await expect(page.locator('#error-every')).toBeVisible();
	const every = await box(page.getByRole('spinbutton', { name: 'Cada' }));
	const cc = await box(content(page));
	expect(every.y).toBeGreaterThanOrEqual(cc.y);
	expect(every.y + every.height).toBeLessThanOrEqual(cc.y + cc.height);
	await page.getByRole('spinbutton', { name: 'Cada' }).fill('2');
	await page.getByLabel('Unidad').selectOption({ label: 'días' });
	await expect(mark(page, 'Cuándo')).toBeVisible();
	await fieldTo(page).fill('11:00');
	await expect(mark(page, 'Cuándo')).toHaveCount(0);
	await save(page).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(row(page, 'Regar')).toBeVisible();

	// 4: wide.
	await page.setViewportSize({ width: 1024, height: 768 });
	await newTask(page);
	await onlyInSchedule(page).check();
	await fieldFrom(page).fill('10:00');
	await fieldTo(page).fill('09:00');
	await save(page).click();
	await expect(page.getByRole('tablist')).toHaveCount(0);
	await expect(page.getByRole('img', { name: 'con errores' })).toHaveCount(0);
	await expect(page.getByRole('dialog')).toHaveCount(1);
	await expect(page.getByText('Escribí un título.')).toBeVisible();
	await expect.poll(async () => {
		const c = await box(title(page));
		const cc = await box(content(page));
		return c.y >= cc.y && c.y + c.height <= cc.y + cc.height;
	}).toBe(true);
	await discard(page);

	// 5
	await newTask(page);
	await title(page).fill('Otra');
	await onlyInSchedule(page).check();
	await fieldFrom(page).fill('10:00');
	await fieldTo(page).fill('09:00');
	await save(page).click();
	await expect(page.locator('#error-schedule')).toBeVisible();
	await expect.poll(async () => {
		const c = await box(fieldTo(page));
		const cc = await box(content(page));
		return c.y >= cc.y && c.y + c.height <= cc.y + cc.height;
	}).toBe(true);
});

test('Flow 6: teclado en pantalla', async ({ page }) => {
	await sessionWithClock(page, HOUR);
	await newTask(page);

	// 1
	await expect(title(page)).not.toBeFocused();
	await expect(save(page)).toBeVisible();
	const before = { h: await box(heading(page)), t: await box(page.getByRole('tablist')) };
	await openKeyboard(page, title(page));
	await title(page).fill('Regar');
	await expect(save(page)).toBeHidden();
	expect(await box(heading(page))).toEqual(before.h);
	expect(await box(page.getByRole('tablist'))).toEqual(before.t);

	// 2
	// Tapping the tab removes focus from the field (and with it the keyboard); a Cuándo field is tapped with the viewport shrunk.
	await tab(page, 'Cuándo').click();
	await page.getByRole('radio', { name: 'Intervalo' }).check();
	await page.getByRole('spinbutton', { name: 'Cada' }).click();
	await expect(save(page)).toBeHidden();
	await closeKeyboard(page);
	await expect(page.getByRole('spinbutton', { name: 'Cada' })).toBeFocused();
	await expect(save(page)).toBeVisible();

	// 3: time picker, no keyboard.
	await onlyInSchedule(page).check();
	await fieldFrom(page).click();
	await expect(save(page)).toBeVisible();

	// 4: desktop.
	await page.setViewportSize({ width: 1024, height: 768 });
	await title(page).click();
	await expect(title(page)).toBeFocused();
	await expect(save(page)).toBeVisible();
	await page.setViewportSize({ width: 360, height: 640 });
	await discard(page);

	// 5: Enter saves with the bar hidden.
	await newTask(page);
	await tab(page, 'Cuándo').click();
	await page.getByRole('radio', { name: 'Intervalo' }).check();
	await page.getByRole('spinbutton', { name: 'Cada' }).fill('2');
	await tab(page, 'Tarea').click();
	await openKeyboard(page, title(page));
	await expect(save(page)).toBeHidden();
	await title(page).press('Enter');
	await expect(page.getByText('Escribí un título.')).toBeVisible();
	await expect(tab(page, 'Tarea')).toHaveAttribute('aria-selected', 'true');
	await expect(mark(page, 'Tarea')).toBeVisible();
	await expect(save(page)).toBeHidden();
	await title(page).fill('Regar');
	await expect(save(page)).toBeHidden();
	await title(page).press('Enter');
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await closeKeyboard(page);
	await expect(row(page, 'Regar')).toBeVisible();

	// 6
	await newTask(page);
	await title(page).fill('Otra');
	await page.getByLabel('Nota').click();
	await page.getByLabel('Nota').fill('uno');
	await page.getByLabel('Nota').press('Enter');
	await page.getByLabel('Nota').pressSequentially('dos');
	await expect(page.getByRole('dialog')).toHaveCount(1);
	await expect(page.getByLabel('Nota')).toHaveValue('uno\ndos');
});

test('Flow 7: iconos y nombres accesibles', async ({ page }) => {
	await sessionWithClock(page, HOUR);
	await createWater(page);

	for (const width of [360, 1024]) {
		await page.setViewportSize({ width, height: width === 360 ? 640 : 768 });
		const phone = width === 360;
		await newTask(page);
		const emojiButton = page.getByRole('button', { name: 'Elegir emoji' });
		await expect(emojiButton).toHaveText('');
		await expect(emojiButton.locator('svg')).toHaveCount(1);
		const closeB = page.getByRole('button', { name: 'Cerrar' });
		await expect(closeB).toHaveText('');
		await expect(closeB.locator('svg')).toHaveCount(1);
		await expect(save(page).locator('svg')).toHaveCount(0);
		if (phone) {
			await expect(tab(page, 'Tarea').locator('svg')).toHaveCount(1);
			await expect(tab(page, 'Cuándo').locator('svg')).toHaveCount(1);
		} else {
			await expect(page.getByRole('heading', { name: 'Tarea', level: 3 })).toBeVisible();
			await expect(page.getByRole('heading', { name: 'Cuándo', level: 3 })).toBeVisible();
			await expect(page.getByRole('heading', { level: 3 }).locator('svg')).toHaveCount(0);
		}
		await close(page);

		await openTask(page, 'Regar');
		if (phone) {
			await expect(tab(page, 'Acciones').locator('svg')).toHaveCount(1);
			await tab(page, 'Acciones').click();
		}
		for (const a of ['1 hora', '3 horas', 'Hasta mañana', 'Pausar', 'Borrar tarea']) {
			const b = page.getByRole('button', { name: a, exact: true });
			await expect(b.locator('svg')).toHaveCount(1);
			await expect(b).toHaveText(a);
		}
		if (phone) await tab(page, 'Cuándo').click();
		await onlyInSchedule(page).check();
		await expect(addSchedule(page).locator('svg')).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Quitar', exact: true }).locator('svg')).toHaveCount(0);
		if (phone) await tab(page, 'Tarea').click();
		await expect(page.getByRole('button', { name: 'Quitar emoji' })).toHaveCount(0);
		await chooseEmoji(page, '🌱');
		await expect(page.getByRole('button', { name: /Cambiar emoji/ })).toHaveText('🌱');
		const remove = page.getByRole('button', { name: 'Quitar emoji' });
		await expect(remove).toBeVisible();
		await expect(remove.locator('svg')).toHaveCount(0);
		await discard(page);
	}
});

test('Flow 8: dos dispositivos con el panel abierto', async ({ browser }) => {
	const { a, b, close: closeTwo } = await twoDevices(browser, HOUR);
	await a.setViewportSize({ width: 360, height: 640 });
	await createWater(a);
	await arrivesOnServer(a);
	await expect(row(b, 'Regar')).toBeVisible();

	// 1
	await openTask(a, 'Regar');
	await tab(a, 'Acciones').click();
	await expect(a.getByRole('button', { name: '1 hora', exact: true })).toBeVisible();
	await expect(a.getByRole('button', { name: 'Pausar', exact: true })).toBeVisible();

	// 2
	await openTask(b, 'Regar');
	await tab(b, 'Acciones').click();
	await b.getByRole('button', { name: 'Pausar', exact: true }).click();
	await expect(b.getByRole('dialog')).toHaveCount(0);
	await expect(a.getByRole('button', { name: 'Reanudar' })).toBeVisible();
	await expect(a.getByRole('button', { name: '1 hora', exact: true })).toHaveCount(0);
	await expect(tab(a, 'Acciones')).toHaveAttribute('aria-selected', 'true');
	await tab(a, 'Tarea').click();
	await expect(a.getByText('Pausada', { exact: true })).toBeVisible();
	await tab(a, 'Acciones').click();

	// 3
	await toggleShowPaused(b, true);
	await openTask(b, 'Regar');
	await tab(b, 'Acciones').click();
	await b.getByRole('button', { name: 'Reanudar' }).click();
	await expect(b.getByRole('dialog')).toHaveCount(0);
	await openTask(b, 'Regar');
	await tab(b, 'Acciones').click();
	await b.getByRole('button', { name: '3 horas', exact: true }).click();
	await expect(b.getByRole('dialog')).toHaveCount(0);
	await expect(a.getByRole('button', { name: 'Quitar posponer' })).toBeVisible();
	await expect(a.getByRole('button', { name: 'Pausar', exact: true })).toBeVisible();
	await tab(a, 'Tarea').click();
	await expect(a.getByText('Pospuesta hasta 13:00')).toBeVisible();
	await closeTwo();
});

test('Flow 9: sobre el panel', async ({ page, context }) => {
	await sessionWithClock(page, HOUR);
	await createWater(page);
	await openTask(page, 'Regar');

	// 1
	await tab(page, 'Cuándo').click();
	await tab(page, 'Tarea').click();
	await page.getByRole('button', { name: 'Elegir emoji' }).click();
	await expect(selectorEmoji(page)).toBeVisible();
	await expect(selectorEmoji(page).locator('input.search')).toBeVisible();
	await expect(selectorEmoji(page).locator('.tabpanel button.emoji').first()).toBeVisible();
	await selectorEmoji(page).locator('input.search').fill('planta');
	await selectorEmoji(page).locator('.tabpanel button.emoji').filter({ hasText: /^🌱$/ }).click();
	await expect(selectorEmoji(page)).toHaveCount(0);
	await expect(tab(page, 'Tarea')).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByRole('button', { name: /Cambiar emoji/ })).toHaveText('🌱');

	// 2
	await tab(page, 'Acciones').click();
	await page.getByRole('button', { name: 'Borrar tarea' }).click();
	const alert = page.getByRole('alertdialog');
	await expect(alert).toBeVisible();
	await alert.getByRole('button', { name: 'Cancelar' }).click();
	await expect(alert).toHaveCount(0);
	await expect(tab(page, 'Acciones')).toHaveAttribute('aria-selected', 'true');
	await discard(page);
	await expect(row(page, 'Regar')).toBeVisible();

	// 3
	await openTask(page, 'Regar');
	await context.setOffline(true);
	const strip = page.getByText('Sin conexión', { exact: true });
	await expect(strip).toBeVisible();
	const fb = await box(strip);
	const eb = await box(heading(page));
	expect(fb.y + fb.height).toBeLessThanOrEqual(eb.y + 1);
	await visibleWithoutCover(page, page.getByRole('button', { name: 'Cerrar' }));
	await visibleWithoutCover(page, page.getByRole('tablist'));
	await visibleWithoutCover(page, save(page));
	await context.setOffline(false);
	await expect(strip).toHaveCount(0);
	await close(page);
});

test('Flow 9 (aviso): el aviso de deshacer sobre la barra de Guardar y sobre el teclado', async ({ browser }) => {
	const { a, close: closeTwo } = await twoDevices(browser, HOUR);
	await a.setViewportSize({ width: 360, height: 640 });
	await createWater(a);
	await create(a, { title: 'Otra', kind: 'No se repite' });
	const notice = (p: Page) => p.getByRole('status').filter({ hasText: 'Completaste' });
	// The notice is shown on the device that completes: A completes Otra and opens Regar with the notice in view.
	await complete(a, 'Otra');
	await expect(notice(a)).toBeVisible();
	await openTask(a, 'Regar');
	await expect(notice(a)).toBeVisible();
	const av = await box(notice(a));
	const g = await box(save(a));
	expect(av.y + av.height).toBeLessThanOrEqual(g.y + 1);
	await visibleWithoutCover(a, a.getByRole('tablist'));
	await visibleWithoutCover(a, a.getByRole('button', { name: 'Cerrar' }));
	await visibleWithoutCover(a, save(a));
	// With the keyboard open: no bar, the notice above the keyboard.
	await openKeyboard(a, title(a));
	await expect(save(a)).toBeHidden();
	await expect(notice(a)).toBeVisible();
	const av2 = await box(notice(a));
	expect(av2.y + av2.height).toBeLessThanOrEqual(300 + 1);
	// 5: disappears after 5 seconds.
	await expect(notice(a)).toHaveCount(0, { timeout: 15_000 });
	await closeTwo();
});

test('Flow 10: el corte de 40rem y las pantallas anchas', async ({ page }) => {
	await sessionWithClock(page, HOUR);
	await createWater(page);

	// 1
	await page.setViewportSize({ width: 640, height: 700 });
	await openTask(page, 'Regar');
	await expect(page.getByRole('tablist')).toBeVisible();
	expect(await box(panel(page))).toMatchObject({ x: 0, y: 0, width: 640, height: 700 });
	await close(page);

	// 2
	await page.setViewportSize({ width: 641, height: 700 });
	await openTask(page, 'Regar');
	await expect(page.getByRole('tablist')).toHaveCount(0);
	const sheet = await box(panel(page).locator('form'));
	expect(sheet.height).toBeLessThanOrEqual(700);
	expect(sheet.width).toBeLessThanOrEqual(640);
	await close(page);

	// 3
	await page.setViewportSize({ width: 1024, height: 768 });
	await openTask(page, 'Regar');
	await expect(page.getByRole('tablist')).toHaveCount(0);
	await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Tarea', 'Cuándo', 'Acciones']);
	const ys = [];
	for (const n of ['Tarea', 'Cuándo', 'Acciones']) ys.push((await box(page.getByRole('heading', { name: n, level: 3 }))).y);
	expect(ys[0]).toBeLessThan(ys[1]);
	expect(ys[1]).toBeLessThan(ys[2]);
	await expect(title(page)).toBeVisible();
	await expect(page.getByRole('radio', { name: 'Intervalo' })).toBeChecked();
	const remove = page.getByRole('button', { name: 'Borrar tarea' });
	await remove.scrollIntoViewIfNeeded();
	expect((await box(remove)).y).toBeLessThan((await box(save(page))).y);
	const before = { h: await box(heading(page)), g: await box(save(page)) };
	await content(page).hover();
	await page.mouse.wheel(0, 3000);
	expect(await box(heading(page))).toEqual(before.h);
	expect(await box(save(page))).toEqual(before.g);
	await visibleWithoutCover(page, page.getByRole('button', { name: 'Cerrar' }));
	await close(page);

	// 4
	await newTask(page);
	await expect(page.getByRole('heading', { name: 'Acciones', level: 3 })).toHaveCount(0);
	await close(page);
	await openTask(page, 'Regar');
	await expect(page.getByRole('heading', { name: 'Acciones', level: 3 })).toBeVisible();

	// 5
	await save(page).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(row(page, 'Regar')).toBeVisible();
});
