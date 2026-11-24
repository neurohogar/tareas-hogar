import { expect, test, type Browser, type Locator, type Page } from '@playwright/test';
import {
	openTab,
	advance,
	close,
	completePanel,
	create,
	device,
	twoDevices,
	chooseEmoji,
	turnOnCompleted,
	waitStatus,
	goA,
	cleanEmulators,
	arrivesOnServer,
	sessionWithClock,
	type Definition, toggleShowPaused
} from './support';

// qa/minimal-version.md: the panel field, the line and the «Hice la mínima» button of the row, completing with the minimal version,
// with steps, Historial and Borrar, what does not change and what does not show it, Cambios sin guardar and two devices.

test.beforeEach(async () => {
	await cleanEmulators();
});

const FRIDAY = '2026-11-13T10:00:00';
const DOES_NOT_REPEAT = 'No se repite' as const;
const P1 = 'Separar la ropa blanca';
const P2 = 'Poner el lavarropas';
const P3 = 'Tender la ropa';
const LENGTH =
	'Abrir el cajón de abajo y sacar toda la ropa blanca y separarla en dos pilas: la que va con agua caliente y la que no se mezcla con nada de color oscuro ni delicado';

/** The row of the task with exact title `t` (other rows may contain that text). */
const f = (page: Page, t: string): Locator =>
	page.getByRole('listitem').filter({ has: page.getByRole('button', { name: t, exact: true }) });
const line = (page: Page, t: string) => f(page, t).getByText(/^Mínima: /);
const did = (page: Page, t: string) => f(page, t).getByRole('button', { name: 'Hice la mínima', exact: true });
const stepLine = (page: Page, t: string) => f(page, t).getByText(/^(Primer paso|Paso): /);
const done = (page: Page, t: string) => f(page, t).getByRole('button', { name: 'Hecho', exact: true });
const previous = (page: Page, t: string) => f(page, t).getByRole('button', { name: 'Paso anterior', exact: true });
const check = (page: Page, t: string) => f(page, t).getByRole('checkbox');
const notice = (page: Page) => page.getByRole('status').filter({ hasText: 'Completaste' });
const undo = (page: Page) => notice(page).getByRole('button', { name: 'Deshacer' });
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const minimal = (page: Page) => page.getByRole('textbox', { name: 'Versión mínima', exact: true });
const panel = (page: Page) => page.getByRole('dialog');
const unsavedChangesNotice = (page: Page) => page.getByRole('alertdialog', { name: 'Tenés cambios sin guardar' });
const titles = (page: Page) =>
	page
		.getByRole('listitem')
		.getByRole('checkbox')
		.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')!.replace('Completar ', '')));

/** The row says exactly `Mínima: m`, only once, and has Hice la mínima. */
async function says(page: Page, t: string, m: string) {
	await expect(line(page, t)).toHaveCount(1);
	await expect(line(page, t)).toHaveText(`Mínima: ${m}`);
	await expect(did(page, t)).toHaveCount(1);
}

/** The row is visible and has neither the line nor the button. */
async function withoutMinimal(page: Page, t: string) {
	await expect(f(page, t)).toBeVisible();
	await expect(f(page, t)).not.toContainText('Mínima');
	await expect(did(page, t)).toHaveCount(0);
}

async function openRow(page: Page, t: string) {
	await f(page, t).getByRole('button', { name: t, exact: true }).click();
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await openTab(page, 'Tarea');
}

async function save(page: Page) {
	await button(page, 'Guardar').click();
	await expect(panel(page)).toHaveCount(0);
}

/** Opens the row, types the minimal version `m` (or leaves it empty) and saves. */
async function writeMinimal(page: Page, t: string, m: string) {
	await openRow(page, t);
	await minimal(page).fill(m);
	await save(page);
}

/** Opens the row and checks the Versión mínima value; closes without changes. */
async function panelHas(page: Page, t: string, m: string) {
	await openRow(page, t);
	await expect(minimal(page)).toHaveValue(m);
	await close(page);
}

async function paste(page: Page, field: Locator, text: string) {
	await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.evaluate((x) => navigator.clipboard.writeText(x), text);
	await field.focus();
	await page.keyboard.press('ControlOrMeta+A');
	await page.keyboard.press('ControlOrMeta+V');
}

const style = (l: Locator) =>
	l.evaluate((e) => {
		const s = getComputedStyle(e);
		return {
			color: s.color,
			size: s.fontSize,
			weight: Number(s.fontWeight),
			line: s.textDecorationLine,
			background: s.backgroundColor,
			trim: s.textOverflow,
			maxHeight: s.maxHeight,
			clamp: s.getPropertyValue('-webkit-line-clamp')
		};
	});

async function pause(page: Page, t: string) {
	await openRow(page, t);
	await button(page, 'Pausar').click();
	await expect(panel(page)).toHaveCount(0);
}

async function resume(page: Page, t: string) {
	await openRow(page, t);
	await button(page, 'Reanudar').click();
	await expect(panel(page)).toHaveCount(0);
}

async function postpone(page: Page, t: string, option: '3 horas' | 'Hasta mañana') {
	await openRow(page, t);
	await button(page, option).click();
	await expect(panel(page)).toHaveCount(0);
}

/** Session with the clock running at `hora`; with `completadas`, Mostrar completadas on. */
async function session(page: Page, hour: string, completedList = false) {
	await sessionWithClock(page, hour);
	if (completedList) await turnOnCompleted(page);
}

/** Advances the clock to `hora` and lets one second run so the screen updates by itself. */
async function go(page: Page, hour: string) {
	const missing = new Date(hour).getTime() - (await page.evaluate(() => Date.now()));
	if (missing <= 10_000) await page.clock.runFor(missing);
	else await advance(page, hour);
	await page.clock.runFor(1000);
}

/** Sets the time right before the gesture that counts (the test clock advances a few ms on each wait). */
const setTime = (page: Page, hour: string) => page.clock.setSystemTime(new Date(hour));

/** Lets the notice's 5 seconds pass. */
async function passesNotice(page: Page) {
	await page.clock.runFor(6000);
	await expect(notice(page)).toHaveCount(0);
}

async function historyDelete(page: Page, t: string) {
	await page
		.getByRole('listitem')
		.filter({ hasText: new RegExp(`^${t}\\s*\\d\\d:\\d\\d`) })
		.getByRole('button', { name: 'Borrar', exact: true })
		.click();
	const dialog = page.getByRole('alertdialog');
	await dialog.getByRole('button', { name: 'Borrar', exact: true }).click();
	await expect(dialog).toHaveCount(0);
}

test('Flow 1: el campo en el panel, crear y editar', async ({ page }) => {
	await sessionWithClock(page, FRIDAY);
	const y = async (l: Locator) => (await l.boundingBox())!.y;
	const ascending = (ys: number[]) => {
		expect(ys).toEqual([...ys].sort((a, b) => a - b));
		expect(new Set(ys).size).toBe(ys.length);
	};

	// 1
	await button(page, '+').click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await expect(minimal(page)).toBeVisible();
	await expect(minimal(page)).toHaveValue('');
	await expect(minimal(page)).toHaveJSProperty('placeholder', '');
	const title = page.getByLabel('Título');
	const emoji = page.getByRole('button', { name: /^(Elegir emoji|Cambiar emoji)/ });
	const first = page.getByRole('textbox', { name: 'Primer paso', exact: true });
	const note = page.getByLabel('Nota');
	await expect(emoji).toBeVisible();
	ascending([
		await y(title),
		await y(first),
		await y(button(page, 'Agregar paso')),
		await y(minimal(page)),
		await y(note)
	]);
	expect(Math.abs((await y(emoji)) - (await y(title)))).toBeLessThan((await y(first)) - (await y(title)));
	await button(page, 'Agregar paso').click();
	const step2 = page.getByRole('textbox', { name: 'Paso 2', exact: true });
	await expect(step2).toBeVisible();
	expect(await y(step2)).toBeLessThan(await y(minimal(page)));

	// 2
	await title.fill('Limpiar baño');
	await minimal(page).fill('Solo el inodoro');
	await minimal(page).press('Enter');
	await expect(panel(page)).toHaveCount(0);
	await says(page, 'Limpiar baño', 'Solo el inodoro');

	// 3
	await openRow(page, 'Limpiar baño');
	await expect(minimal(page)).toHaveValue('Solo el inodoro');
	await close(page);
	await page.reload();
	await panelHas(page, 'Limpiar baño', 'Solo el inodoro');

	// 4
	await writeMinimal(page, 'Limpiar baño', '  Solo el lavabo  ');
	await panelHas(page, 'Limpiar baño', 'Solo el lavabo');
	await says(page, 'Limpiar baño', 'Solo el lavabo');

	// 5
	await openRow(page, 'Limpiar baño');
	await paste(page, minimal(page), 'uno\ndos');
	expect(await minimal(page).inputValue()).not.toContain('\n');
	await minimal(page).press('Enter');
	await expect(panel(page)).toHaveCount(0);
	await openRow(page, 'Limpiar baño');
	expect(await minimal(page).inputValue()).not.toContain('\n');
	expect(await minimal(page).inputValue()).toMatch(/^uno ?dos$/);
	await close(page);

	// 6
	await writeMinimal(page, 'Limpiar baño', '');
	await withoutMinimal(page, 'Limpiar baño');
	await panelHas(page, 'Limpiar baño', '');
	await writeMinimal(page, 'Limpiar baño', 'Solo el inodoro');
	await says(page, 'Limpiar baño', 'Solo el inodoro');
	await openRow(page, 'Limpiar baño');
	await minimal(page).fill('   ');
	await button(page, 'Guardar').click();
	await expect(panel(page)).toHaveCount(0);
	await expect(page.getByRole('alert')).toHaveCount(0);
	await expect(page.getByText(/no se pudo|rechaz|error|inválid/i)).toHaveCount(0);
	await withoutMinimal(page, 'Limpiar baño');
	await panelHas(page, 'Limpiar baño', '');

	// 7
	const length5000 = 'abcdefghij'.repeat(500);
	await openRow(page, 'Limpiar baño');
	await paste(page, minimal(page), length5000);
	await button(page, 'Guardar').click();
	await expect(panel(page)).toHaveCount(0);
	await expect(page.getByRole('alert')).toHaveCount(0);
	await openRow(page, 'Limpiar baño');
	expect((await minimal(page).inputValue()).length).toBe(5000);
	await close(page);

	// 8
	await create(page, { title: 'Barrer', kind: DOES_NOT_REPEAT, date: '', minimalVersion: '   ' });
	await withoutMinimal(page, 'Barrer');
	await expect(page.getByRole('alert')).toHaveCount(0);
	await create(page, { title: 'Planchar', kind: DOES_NOT_REPEAT, date: '' });
	await withoutMinimal(page, 'Planchar');

	// 9
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días', minimalVersion: 'Solo los helechos' });
	await create(page, { title: 'Basura', kind: 'Días de la semana', days: ['martes'], minimalVersion: 'Solo la de la cocina' });
	await panelHas(page, 'Regar', 'Solo los helechos');
	await panelHas(page, 'Basura', 'Solo la de la cocina');
	await openRow(page, 'Regar');
	await openTab(page, 'Tarea');
	await page.getByRole('radio', { name: DOES_NOT_REPEAT }).check();
	await page.getByRole('radio', { name: 'Intervalo' }).check();
	await save(page);
	await panelHas(page, 'Regar', 'Solo los helechos');

	// 10
	await writeMinimal(page, 'Limpiar baño', LENGTH);
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(line(page, 'Limpiar baño')).toHaveText(`Mínima: ${LENGTH}`);
	await expect(line(page, 'Limpiar baño')).toBeVisible();
	const box = (await line(page, 'Limpiar baño').boundingBox())!;
	expect(box.x + box.width).toBeLessThanOrEqual(390);
	const ln = await line(page, 'Limpiar baño').evaluate((e) => {
		const lh = parseFloat(getComputedStyle(e).lineHeight) || parseFloat(getComputedStyle(e).fontSize) * 1.2;
		return { height: e.getBoundingClientRect().height, lh, extra: e.scrollWidth > e.clientWidth || e.scrollHeight > e.clientHeight };
	});
	expect(ln.height).toBeGreaterThan(ln.lh * 1.5);
	expect(ln.extra).toBe(false);
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
	const e10 = await style(line(page, 'Limpiar baño'));
	expect(e10.trim).not.toBe('ellipsis');
	expect(e10.maxHeight).toBe('none');
	expect(e10.clamp === '' || e10.clamp === 'none').toBe(true);
});

test('Flow 2: la línea y el botón en la fila', async ({ page }) => {
	await session(page, FRIDAY, false);
	await create(page, { title: 'Lavar', kind: DOES_NOT_REPEAT, date: '', firstStep: 'Separar la ropa blanca', minimalVersion: 'Solo el inodoro' });
	await create(page, { title: 'Barrer', kind: DOES_NOT_REPEAT, date: '', minimalVersion: 'Solo el pasillo' });

	// 1
	await expect(stepLine(page, 'Lavar')).toHaveText('Primer paso: Separar la ropa blanca');
	await says(page, 'Lavar', 'Solo el inodoro');
	const andP = (await stepLine(page, 'Lavar').boundingBox())!;
	const andM = (await line(page, 'Lavar').boundingBox())!;
	expect(andM.y).toBeGreaterThanOrEqual(andP.y + andP.height - 2);
	await says(page, 'Barrer', 'Solo el pasillo');
	await expect(stepLine(page, 'Barrer')).toHaveCount(0);

	// 2
	const l = await style(line(page, 'Lavar'));
	const p = await style(stepLine(page, 'Lavar'));
	expect(l.color).toBe(p.color);
	expect(l.size).toBe(p.size);
	expect(l.weight).toBeLessThan(600);
	expect(l.line).not.toContain('underline');
	const b = await style(did(page, 'Lavar'));
	expect(b.color).toBe(l.color);
	expect(b.weight).toBeLessThan(600);
	expect(b.line).not.toContain('underline');
	expect(b.background).toBe('rgba(0, 0, 0, 0)');
	const backgroundB = (await style(f(page, 'Barrer'))).background;
	expect((await style(f(page, 'Lavar'))).background).toBe(backgroundB);
	await expect(f(page, 'Barrer')).not.toContainText(/\d+ (vez|veces)|racha|contador|¿Probás|probá|probar/i);

	// 3
	const c = (await line(page, 'Barrer').boundingBox())!;
	await page.mouse.click(c.x + 4, c.y + c.height / 2);
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await expect(page.getByLabel('Título')).toHaveValue('Barrer');
	await close(page);
	await expect(unsavedChangesNotice(page)).toHaveCount(0);

	// 4
	await did(page, 'Barrer').click();
	await expect(notice(page)).toContainText('Completaste «Barrer» · mínima');
	await expect(panel(page)).toHaveCount(0);
	await expect(unsavedChangesNotice(page)).toHaveCount(0);
	await undo(page).click();
	await expect(check(page, 'Barrer')).not.toBeChecked();
	await says(page, 'Barrer', 'Solo el pasillo');

	// 5
	await openRow(page, 'Lavar');
	await page.getByRole('button', { name: 'Agregar paso', exact: true }).click();
	await page.getByRole('textbox', { name: 'Paso 2', exact: true }).fill(P2);
	await page.getByRole('button', { name: 'Agregar paso', exact: true }).click();
	await page.getByRole('textbox', { name: 'Paso 3', exact: true }).fill(P3);
	await save(page);
	await expect(stepLine(page, 'Lavar')).toHaveText('Primer paso: Separar la ropa blanca');
	await says(page, 'Lavar', 'Solo el inodoro');
	await expect(done(page, 'Lavar')).toBeVisible();
	await done(page, 'Lavar').click();
	await expect(stepLine(page, 'Lavar')).toHaveText(`Paso: ${P2}`);
	await says(page, 'Lavar', 'Solo el inodoro');
	const andP2 = (await stepLine(page, 'Lavar').boundingBox())!;
	expect((await line(page, 'Lavar').boundingBox())!.y).toBeGreaterThanOrEqual(andP2.y + andP2.height - 2);
	await done(page, 'Lavar').click();
	await expect(stepLine(page, 'Lavar')).toHaveText(`Paso: ${P3}`);
	await says(page, 'Lavar', 'Solo el inodoro');

	// 6
	await turnOnCompleted(page);
	await toggleShowPaused(page, true);
	await create(page, { title: 'Cambiar foco', kind: DOES_NOT_REPEAT, date: '', minimalVersion: 'Solo la lámpara' });
	await create(page, { title: 'Pagar', kind: DOES_NOT_REPEAT, date: '2026-11-10', minimalVersion: 'Solo la luz' });
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '8', unit: 'horas', minimalVersion: 'Solo los helechos' });
	await waitStatus(page, 'Pagar', 'atrasada', undefined, false);
	await says(page, 'Pagar', 'Solo la luz');
	await expect(did(page, 'Pagar')).toBeEnabled();
	await says(page, 'Cambiar foco', 'Solo la lámpara');
	await expect(did(page, 'Cambiar foco')).toBeEnabled();
	await says(page, 'Regar', 'Solo los helechos');
	await expect(did(page, 'Regar')).toBeEnabled();

	// 7
	await postpone(page, 'Cambiar foco', '3 horas');
	await withoutMinimal(page, 'Cambiar foco');
	await expect(check(page, 'Cambiar foco')).toBeEnabled();
	await postpone(page, 'Pagar', 'Hasta mañana');
	await withoutMinimal(page, 'Pagar');
	await check(page, 'Regar').click();
	await expect(check(page, 'Regar')).toBeChecked();
	await withoutMinimal(page, 'Regar');

	// 8
	await go(page, '2026-11-13T13:01:00');
	await says(page, 'Cambiar foco', 'Solo la lámpara');
	await withoutMinimal(page, 'Regar');
	await go(page, '2026-11-13T18:01:00');
	await says(page, 'Regar', 'Solo los helechos');

	// 9
	await pause(page, 'Regar');
	await withoutMinimal(page, 'Regar');
	await expect(f(page, 'Regar').getByText('Pausada', { exact: true })).toBeVisible();
	await resume(page, 'Regar');
	await says(page, 'Regar', 'Solo los helechos');

	// 10
	await check(page, 'Cambiar foco').click();
	await expect(notice(page)).toContainText('Completaste «Cambiar foco»');
	await expect(f(page, 'Cambiar foco')).toHaveCount(0);
	await undo(page).click();
	await expect(notice(page)).toHaveCount(0);
	await expect(check(page, 'Cambiar foco')).not.toBeChecked();
	await says(page, 'Cambiar foco', 'Solo la lámpara');

	// 11
	await create(page, { title: 'Basura', kind: 'Días de la semana', days: ['martes'], minimalVersion: 'Solo la de la cocina' });
	await waitStatus(page, 'Basura', 'en espera', undefined, false);
	await withoutMinimal(page, 'Basura');
	await go(page, '2026-11-17T09:00:00');
	await says(page, 'Basura', 'Solo la de la cocina');
	await expect(did(page, 'Basura')).toBeEnabled();

	// 12
	await go(page, '2026-11-17T09:30:00');
	await create(page, { title: 'Llamar', kind: DOES_NOT_REPEAT, date: '', schedule: { from: '08:00', to: '09:00' }, minimalVersion: 'Solo a mamá' });
	await waitStatus(page, 'Llamar', 'en espera', undefined, false, false);
	await withoutMinimal(page, 'Llamar');
	await go(page, '2026-11-18T08:30:00');
	await says(page, 'Llamar', 'Solo a mamá');
	await expect(did(page, 'Llamar')).toBeEnabled();

	// 13
	await create(page, {
		title: 'Lavar la ropa',
		kind: DOES_NOT_REPEAT,
		date: '2026-11-10',
		schedule: { from: '08:00', to: '11:00' },
		minimalVersion: 'Solo lo blanco'
	});
	await go(page, '2026-11-19T07:00:00');
	await waitStatus(page, 'Lavar la ropa', 'atrasada', undefined, false, false);
	await says(page, 'Lavar la ropa', 'Solo lo blanco');
	await expect(did(page, 'Lavar la ropa')).toBeDisabled();
	await did(page, 'Lavar la ropa').click({ force: true });
	await expect(notice(page)).toHaveCount(0);
	await expect(check(page, 'Lavar la ropa')).not.toBeChecked();
	await go(page, '2026-11-19T08:30:00');
	await expect(check(page, 'Lavar la ropa')).toBeEnabled();
	await expect(did(page, 'Lavar la ropa')).toBeEnabled();

	// 14
	const counters = /\d+ (vez|veces)|racha|contador|×|probá|probar/i;
	const before = await style(line(page, 'Regar'));
	for (let i = 0; i < 2; i++) {
		await expect(did(page, 'Regar')).toBeEnabled();
		await did(page, 'Regar').click();
		await expect(notice(page)).toContainText('Completaste «Regar» · mínima');
		await passesNotice(page);
		await expect(f(page, 'Regar')).not.toContainText('Mínima');
		await go(page, new Date((await page.evaluate(() => Date.now())) + 9 * 3600_000 + 60_000).toISOString());
	}
	await says(page, 'Regar', 'Solo los helechos');
	await expect(f(page, 'Regar')).not.toContainText(counters);
	expect(await style(line(page, 'Regar'))).toEqual(before);
	await expect(f(page, 'Regar').getByRole('button')).toHaveText(['Regar', 'Hice la mínima']);
});

test('Flow 3: hacer la mínima, aviso, regreso y deshacer', async ({ page, browser }) => {
	await session(page, '2026-11-13T09:00:00', true);
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '8', unit: 'horas', emoji: '🌱', minimalVersion: 'Solo los helechos' });
	await create(page, { title: 'Limpiar', kind: DOES_NOT_REPEAT, date: '', minimalVersion: 'Solo el inodoro' });
	const R = '🌱 Regar';

	// 1
	await setTime(page, '2026-11-13T09:00:00');
	await did(page, R).click();
	await expect(notice(page)).toContainText('Completaste «🌱 Regar» · mínima');
	await expect(undo(page)).toBeVisible();
	await expect(notice(page)).toContainText('Vuelve hoy 17:00 · en 8 horas');
	await expect(notice(page)).not.toContainText('Solo los helechos');
	await waitStatus(page, R, 'en espera');
	await withoutMinimal(page, R);

	// 2
	await undo(page).click();
	await expect(notice(page)).toHaveCount(0);
	await waitStatus(page, R, 'pendiente');
	await says(page, R, 'Solo los helechos');

	// 3
	await setTime(page, '2026-11-13T09:00:00');
	await check(page, R).click();
	await expect(notice(page)).toContainText('Completaste «🌱 Regar»');
	await expect(notice(page)).not.toContainText('mínima');
	await expect(notice(page)).toContainText('Vuelve hoy 17:00 · en 8 horas');
	await undo(page).click();
	await expect(notice(page)).toHaveCount(0);
	await waitStatus(page, R, 'pendiente');

	// 4
	await did(page, 'Limpiar').click();
	await expect(notice(page)).toContainText('Completaste «Limpiar» · mínima');
	await expect(notice(page)).not.toContainText('Vuelve');
	await passesNotice(page);
	await expect(f(page, 'Limpiar')).toHaveCount(0);

	// 5
	await goA(page, 'Historial');
	await historyDelete(page, 'Limpiar');
	await goA(page, 'Pendientes');
	await expect(check(page, 'Limpiar')).not.toBeChecked();
	await expect(notice(page)).toHaveCount(0);
	await says(page, 'Limpiar', 'Solo el inodoro');

	// 6
	await setTime(page, '2026-11-13T09:00:00');
	await check(page, 'Limpiar').click();
	await expect(notice(page)).toContainText('Completaste «Limpiar»');
	await setTime(page, '2026-11-13T09:00:00');
	await did(page, R).click();
	await expect(notice(page)).toHaveCount(1);
	await expect(notice(page)).toContainText('Completaste «🌱 Regar» · mínima');
	await expect(notice(page)).not.toContainText('Limpiar');

	// 7
	await waitStatus(page, R, 'en espera');
	const bar = f(page, R).getByRole('progressbar');
	const before = Number(await bar.getAttribute('aria-valuenow'));
	await go(page, '2026-11-13T15:00:00');
	await waitStatus(page, R, 'en espera');
	await expect.poll(async () => Number(await bar.getAttribute('aria-valuenow'))).toBeGreaterThan(before);
	await go(page, '2026-11-13T17:01:00');
	await waitStatus(page, R, 'pendiente');
	await says(page, R, 'Solo los helechos');

	// 8
	await setTime(page, '2026-11-13T09:30:00');
	await page.clock.runFor(1000);
	await waitStatus(page, R, 'en espera');
	await expect(f(page, 'Limpiar')).toHaveCount(0);
	await goA(page, 'Historial');
	await historyDelete(page, 'Limpiar');
	await goA(page, 'Pendientes');
	await expect(check(page, 'Limpiar')).not.toBeChecked();
	await setTime(page, '2026-11-13T09:30:00');
	await check(page, 'Limpiar').click();
	await expect(f(page, 'Limpiar')).toHaveCount(0);
	await expect.poll(() => titles(page)).toEqual([R]);
	for (const t of [R]) {
		const title = f(page, t).getByRole('button', { name: t, exact: true });
		expect(await title.evaluate((e) => getComputedStyle(e).textDecorationLine)).toContain('line-through');
	}

	// 9
	await openRow(page, R);
	await expect(page.getByText(/^Última vez/)).toHaveText('Última vez: hoy 09:00');
	await close(page);

	// 10
	await cleanEmulators();
	const d = await device(browser, '2026-11-09T08:00:00', true);
	const p = d.page;
	await turnOnCompleted(p);
	await create(p, { title: 'Basura', kind: 'Días de la semana', days: ['martes'], minimalVersion: 'Solo la de la cocina' });
	await go(p, '2026-11-10T09:00:00');
	await waitStatus(p, 'Basura', 'pendiente');
	await says(p, 'Basura', 'Solo la de la cocina');
	await setTime(p, '2026-11-10T09:00:00');
	await did(p, 'Basura').click();
	await expect(notice(p)).toContainText('Completaste «Basura» · mínima');
	await expect(notice(p)).toContainText('Vuelve el martes 17');
	await waitStatus(p, 'Basura', 'en espera');

	// 11
	await passesNotice(p);
	await go(p, '2026-11-13T09:30:00');
	await create(p, { title: 'Riego', kind: 'Intervalo', every: '2', unit: 'días', minimalVersion: 'Solo las macetas' });
	await did(p, 'Riego').click();
	await expect(notice(p)).toContainText('Completaste «Riego» · mínima');
	await passesNotice(p);
	await go(p, '2026-11-14T10:00:00');
	await waitStatus(p, 'Riego', 'en espera');
	await check(p, 'Riego').click();
	await expect(notice(p)).toContainText('Completaste «Riego»');
	await expect(notice(p)).not.toContainText('mínima');
	await d.ctx.close();
});

test('Flow 4: con pasos, en cualquier paso', async ({ page }) => {
	await session(page, FRIDAY, true);
	await create(page, { title: 'Lavar', kind: 'Intervalo', every: '2', unit: 'días', firstStep: P1, steps: [P2, P3], minimalVersion: 'Solo lo blanco' });
	const step = (t: string) => expect(stepLine(page, 'Lavar')).toHaveText(t);
	const withoutLines = async () => {
		await expect(f(page, 'Lavar')).toBeVisible();
		await expect(f(page, 'Lavar')).not.toContainText(/Paso|Mínima/);
		await expect(done(page, 'Lavar')).toHaveCount(0);
		await expect(previous(page, 'Lavar')).toHaveCount(0);
		await expect(did(page, 'Lavar')).toHaveCount(0);
	};

	// 1
	await step(`Primer paso: ${P1}`);
	await did(page, 'Lavar').click();
	await expect(notice(page)).toContainText('Completaste «Lavar» · mínima');
	await withoutLines();
	await undo(page).click();
	await expect(check(page, 'Lavar')).not.toBeChecked();
	await step(`Primer paso: ${P1}`);
	await says(page, 'Lavar', 'Solo lo blanco');

	// 2
	await done(page, 'Lavar').click();
	await step(`Paso: ${P2}`);
	await setTime(page, FRIDAY);
	await did(page, 'Lavar').click();
	await expect(notice(page)).toContainText('Completaste «Lavar» · mínima');
	await undo(page).click();
	await expect(check(page, 'Lavar')).not.toBeChecked();
	await step(`Paso: ${P2}`);

	// 3
	await did(page, 'Lavar').click();
	await expect(notice(page)).toContainText('Completaste «Lavar» · mínima');
	await passesNotice(page);
	await check(page, 'Lavar').click();
	await expect(check(page, 'Lavar')).not.toBeChecked();
	await step(`Paso: ${P2}`);

	// 4
	await done(page, 'Lavar').click();
	await step(`Paso: ${P3}`);
	await did(page, 'Lavar').click();
	await expect(notice(page)).toContainText('Completaste «Lavar» · mínima');
	await undo(page).click();
	await expect(check(page, 'Lavar')).not.toBeChecked();
	await step(`Paso: ${P3}`);
	await did(page, 'Lavar').click();
	await expect(notice(page)).toContainText('Completaste «Lavar» · mínima');
	await passesNotice(page);
	await goA(page, 'Historial');
	await historyDelete(page, 'Lavar');
	await goA(page, 'Pendientes');
	await expect(check(page, 'Lavar')).not.toBeChecked();
	await step(`Paso: ${P3}`);

	// 5
	await did(page, 'Lavar').click();
	await expect(notice(page)).toContainText('Completaste «Lavar» · mínima');
	await passesNotice(page);
	await expect(check(page, 'Lavar')).toBeChecked();
	await check(page, 'Lavar').click();
	await expect(check(page, 'Lavar')).not.toBeChecked();
	await step(`Paso: ${P3}`);

	// 6
	await create(page, {
		title: 'Regar',
		kind: 'Intervalo',
		every: '2',
		unit: 'días',
		firstStep: 'Llenar la regadera',
		steps: ['Regar los helechos'],
		minimalVersion: 'Solo los helechos'
	});
	await done(page, 'Regar').click();
	await expect(stepLine(page, 'Regar')).toHaveText('Paso: Regar los helechos');
	await setTime(page, FRIDAY);
	await did(page, 'Regar').click();
	await expect(notice(page)).toContainText('Completaste «Regar» · mínima');
	await go(page, '2026-11-15T10:30:00');
	await waitStatus(page, 'Regar', 'pendiente');
	await expect(stepLine(page, 'Regar')).toHaveText('Primer paso: Llenar la regadera');
	await expect(done(page, 'Regar')).toHaveCount(1);
	await expect(previous(page, 'Regar')).toHaveCount(0);

	// 7
	await create(page, { title: 'Barrer', kind: DOES_NOT_REPEAT, date: '', firstStep: 'Juntar la basura', minimalVersion: 'Solo el pasillo' });
	await expect(stepLine(page, 'Barrer')).toHaveText('Primer paso: Juntar la basura');
	await expect(done(page, 'Barrer')).toHaveCount(0);
	await did(page, 'Barrer').click();
	await expect(notice(page)).toContainText('Completaste «Barrer» · mínima');
	await undo(page).click();
	await expect(check(page, 'Barrer')).not.toBeChecked();
	await expect(stepLine(page, 'Barrer')).toHaveText('Primer paso: Juntar la basura');
	await says(page, 'Barrer', 'Solo el pasillo');
	await expect(done(page, 'Barrer')).toHaveCount(0);
	await expect(previous(page, 'Barrer')).toHaveCount(0);
});

test('Flow 5: Historial y Borrar', async ({ page }) => {
	await session(page, '2026-11-13T08:05:00', false);
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días', minimalVersion: 'Solo los helechos' });
	await create(page, { title: 'Pagar', kind: DOES_NOT_REPEAT, date: '' });
	const entry = (t: string) => page.getByRole('listitem').filter({ hasText: new RegExp(`^${t}\\s*\\d\\d:\\d\\d`) });
	const withoutVersions = async (l: Locator) => {
		await expect(l).not.toContainText('Solo');
	};

	// 1
	await setTime(page, '2026-11-13T08:05:00');
	await did(page, 'Regar').click();
	await expect(notice(page)).toContainText('Completaste «Regar» · mínima');
	await goA(page, 'Historial');
	await expect(page.getByRole('heading', { name: 'Hoy', level: 2 })).toBeVisible();
	await expect(entry('Regar')).toHaveText(/^Regar\s*08:05\s*Mínima\s*Borrar$/);
	await withoutVersions(entry('Regar'));
	const hour = await style(entry('Regar').getByText('08:05'));
	const word = await style(entry('Regar').getByText('Mínima'));
	expect(word.color).toBe(hour.color);
	expect(word.size).toBe(hour.size);
	expect(word.weight).toBe(hour.weight);
	await expect(entry('Regar').locator('svg, img')).toHaveCount(0);

	// 2
	await goA(page, 'Pendientes');
	await turnOnCompleted(page);
	await go(page, '2026-11-13T10:00:00');
	await setTime(page, '2026-11-13T10:00:00');
	await check(page, 'Pagar').click();
	await expect(notice(page)).toContainText('Completaste «Pagar»');
	await goA(page, 'Historial');
	const items = page.getByRole('list').getByRole('listitem');
	await expect(items).toHaveText([/^Pagar\s*10:\d\d\s*Borrar$/, /^Regar\s*08:05\s*Mínima\s*Borrar$/]);

	// 3
	const dialog = page.getByRole('alertdialog');
	await entry('Regar').getByRole('button', { name: 'Borrar', exact: true }).click();
	await expect(dialog).toContainText('Regar');
	await expect(dialog).toContainText('Hoy, 08:05');
	await expect(dialog).toContainText('Mínima');
	await expect(dialog.getByRole('button', { name: 'Borrar', exact: true })).toBeVisible();
	await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
	await expect(dialog).toHaveCount(0);
	await expect(entry('Regar')).toHaveCount(1);
	await entry('Pagar').getByRole('button', { name: 'Borrar', exact: true }).click();
	await expect(dialog).toContainText('Pagar');
	await expect(dialog).not.toContainText('Mínima');
	await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
	await entry('Regar').getByRole('button', { name: 'Borrar', exact: true }).click();
	await dialog.getByRole('button', { name: 'Borrar', exact: true }).click();
	await expect(dialog).toHaveCount(0);
	await expect(entry('Regar')).toHaveCount(0);
	await goA(page, 'Pendientes');
	await waitStatus(page, 'Regar', 'pendiente');

	// 4
	await did(page, 'Regar').click();
	await expect(notice(page)).toContainText('Completaste «Regar» · mínima');
	await writeMinimal(page, 'Regar', 'Solo el brote');
	await goA(page, 'Historial');
	await expect(entry('Regar')).toHaveText(/^Regar\s*\d\d:\d\d\s*Mínima\s*Borrar$/);
	await expect(entry('Regar')).not.toContainText('Solo');
	await goA(page, 'Pendientes');
	await writeMinimal(page, 'Regar', '');
	await goA(page, 'Historial');
	await expect(entry('Regar')).toHaveText(/^Regar\s*\d\d:\d\d\s*Mínima\s*Borrar$/);
	await goA(page, 'Pendientes');
	await openRow(page, 'Regar');
	await page.getByLabel('Título').fill('Plantas');
	await save(page);
	await goA(page, 'Historial');
	await expect(entry('Plantas')).toHaveText(/^Plantas\s*\d\d:\d\d\s*Mínima\s*Borrar$/);

	// 5
	await goA(page, 'Historial');
	await entry('Pagar').getByRole('button', { name: 'Pagar', exact: true }).click();
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await minimal(page).fill('Solo el brote');
	await save(page);
	await expect(entry('Pagar')).toHaveText(/^Pagar\s*10:\d\d\s*Borrar$/);
});

test('Flow 6: lo que no cambia y lo que no lo muestra', async ({ page }) => {
	await session(page, FRIDAY, true);
	const texts = async (t: string[]) => Promise.all(t.map((x) => f(page, x).innerText()));

	// 1
	await create(page, { title: 'Barrer', kind: DOES_NOT_REPEAT, date: '' });
	await create(page, { title: 'Lavar', kind: DOES_NOT_REPEAT, date: '' });
	await create(page, { title: 'Planchar', kind: DOES_NOT_REPEAT, date: '' });
	const order = await titles(page);
	expect([...order].sort()).toEqual(['Barrer', 'Lavar', 'Planchar']);
	const before = await texts(['Barrer', 'Planchar']);

	// 2
	await writeMinimal(page, 'Lavar', 'Solo el inodoro');
	await says(page, 'Lavar', 'Solo el inodoro');
	expect(await titles(page)).toEqual(order);
	expect(await texts(['Barrer', 'Planchar'])).toEqual(before);
	await writeMinimal(page, 'Barrer', 'Solo el pasillo');
	await says(page, 'Barrer', 'Solo el pasillo');
	expect(await titles(page)).toEqual(order);

	// 3
	await openRow(page, 'Lavar');
	await chooseEmoji(page, '🧺', 'cesta');
	await save(page);
	const title = f(page, '🧺 Lavar').getByRole('button', { name: '🧺 Lavar', exact: true });
	await expect(title).toBeVisible();
	await says(page, '🧺 Lavar', 'Solo el inodoro');
	const bt = (await title.boundingBox())!;
	expect((await line(page, '🧺 Lavar').boundingBox())!.y).toBeGreaterThanOrEqual(bt.y + bt.height - 2);
	await expect(title).not.toContainText('Solo el inodoro');
	await expect(title).not.toContainText('Mínima');

	// 4
	await did(page, '🧺 Lavar').click();
	await expect(notice(page)).toContainText('Completaste «🧺 Lavar» · mínima');
	await expect(notice(page)).not.toContainText('Solo el inodoro');

	// 5
	const c = (await line(page, 'Barrer').boundingBox())!;
	await page.mouse.click(c.x + 4, c.y + c.height / 2);
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await expect(page.getByLabel('Título')).toHaveValue('Barrer');
	await close(page);
});

test('Flow 7: Cambios sin guardar', async ({ page }) => {
	await sessionWithClock(page, FRIDAY);
	await create(page, { title: 'Lavar', kind: DOES_NOT_REPEAT, date: '', minimalVersion: 'Solo el inodoro' });
	await create(page, { title: 'Planchar', kind: DOES_NOT_REPEAT, date: '' });
	const closesDirect = async () => {
		await button(page, 'Cerrar').click();
		await expect(panel(page)).toHaveCount(0);
		await expect(unsavedChangesNotice(page)).toHaveCount(0);
	};
	const asksNoticeAndDiscards = async () => {
		await button(page, 'Cerrar').click();
		await expect(unsavedChangesNotice(page)).toBeVisible();
		await unsavedChangesNotice(page).getByRole('button', { name: 'Descartar', exact: true }).click();
		await expect(panel(page)).toHaveCount(0);
		await expect(unsavedChangesNotice(page)).toHaveCount(0);
	};

	// 1
	await openRow(page, 'Lavar');
	await minimal(page).fill('Solo el lavabo');
	await asksNoticeAndDiscards();
	await says(page, 'Lavar', 'Solo el inodoro');

	// 2
	await openRow(page, 'Lavar');
	await minimal(page).fill('Solo el lavabo');
	await minimal(page).fill('Solo el inodoro');
	await closesDirect();
	await openRow(page, 'Lavar');
	await minimal(page).fill('  Solo el inodoro  ');
	await closesDirect();

	// 3
	await openRow(page, 'Lavar');
	await minimal(page).fill('');
	await asksNoticeAndDiscards();
	await openRow(page, 'Lavar');
	await minimal(page).fill('   ');
	await asksNoticeAndDiscards();
	await says(page, 'Lavar', 'Solo el inodoro');

	// 4
	await openRow(page, 'Planchar');
	await minimal(page).fill('   ');
	await closesDirect();
	await openRow(page, 'Planchar');
	await minimal(page).fill('Solo el inodoro');
	await asksNoticeAndDiscards();

	// 5
	await button(page, '+').click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await minimal(page).fill('   ');
	await closesDirect();
	await button(page, '+').click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await minimal(page).fill('Solo el inodoro');
	await asksNoticeAndDiscards();

	// 6
	await did(page, 'Lavar').click();
	await expect(notice(page)).toContainText('Completaste «Lavar» · mínima');
	await expect(panel(page)).toHaveCount(0);
	await expect(unsavedChangesNotice(page)).toHaveCount(0);
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
});

async function devices(browser: Browser) {
	const d = await twoDevices(browser, FRIDAY);
	for (const p of [d.a, d.b]) {
		await turnOnCompleted(p);
		await toggleShowPaused(p, true);
	}
	return d;
}

test('Flow 8: dos dispositivos', async ({ browser }) => {
	test.setTimeout(400_000);
	const { a, b, ctxB, close: end } = await devices(browser);
	const both = [a, b];
	const sync = async () => {
		await arrivesOnServer(a);
		await ctxB.setOffline(false);
		await a.waitForTimeout(10_000); // B reconnects and its pending writes arrive; both screens update by themselves
	};
	const say = async (t: string, m: string) => {
		for (const p of both) {
			await expect(line(p, t)).toHaveText(`Mínima: ${m}`, { timeout: 60_000 });
			await expect(did(p, t)).toHaveCount(1);
		}
	};
	const withoutLineBoth = async (t: string) => {
		for (const p of both) {
			await expect(f(p, t)).toBeVisible({ timeout: 60_000 });
			await expect(f(p, t)).not.toContainText('Mínima', { timeout: 60_000 });
			await expect(did(p, t)).toHaveCount(0);
		}
	};

	// 1
	await create(a, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días', minimalVersion: 'Solo los helechos' });
	await expect(f(b, 'Regar')).toBeVisible();
	await say('Regar', 'Solo los helechos');

	// 2
	await ctxB.setOffline(true);
	await openRow(b, 'Regar');
	await b.getByLabel('Título').fill('Regar plantas');
	await save(b);
	await writeMinimal(a, 'Regar', 'Solo el brote');
	await sync();
	await say('Regar plantas', 'Solo el brote');
	for (const p of both) await expect(f(p, 'Regar plantas').getByRole('button', { name: 'Regar plantas', exact: true })).toBeVisible();

	// 3
	await ctxB.setOffline(true);
	await writeMinimal(b, 'Regar plantas', 'Solo los esquejes');
	await openRow(a, 'Regar plantas');
	await a.getByLabel('Nota').fill('Usar la regadera chica');
	await save(a);
	await sync();
	await say('Regar plantas', 'Solo los esquejes');
	for (const p of both)
		await expect(async () => {
			await openRow(p, 'Regar plantas');
			await expect(p.getByLabel('Nota')).toHaveValue('Usar la regadera chica', { timeout: 1000 });
			await close(p);
		}).toPass({ timeout: 60_000 });

	// 4
	await ctxB.setOffline(true);
	await writeMinimal(b, 'Regar plantas', 'Solo la maceta');
	await writeMinimal(a, 'Regar plantas', 'Solo la planta grande');
	await sync();
	await say('Regar plantas', 'Solo la maceta');

	// 5
	await ctxB.setOffline(true);
	await writeMinimal(b, 'Regar plantas', '');
	await writeMinimal(a, 'Regar plantas', 'Solo el tronco');
	await sync();
	await withoutLineBoth('Regar plantas');
	await writeMinimal(a, 'Regar plantas', 'Solo el tronco');
	await say('Regar plantas', 'Solo el tronco');

	// 6
	await ctxB.setOffline(true);
	await writeMinimal(b, 'Regar plantas', 'Solo la maceta');
	await writeMinimal(a, 'Regar plantas', '');
	await sync();
	await say('Regar plantas', 'Solo la maceta');

	// 7
	await ctxB.setOffline(true);
	await writeMinimal(b, 'Regar plantas', 'Solo el brote');
	await openRow(a, 'Regar plantas');
	await save(a);
	await sync();
	await say('Regar plantas', 'Solo el brote');

	// 8
	await ctxB.setOffline(true);
	await check(b, 'Regar plantas').click();
	await did(a, 'Regar plantas').click();
	await sync();
	for (const p of both) {
		await goA(p, 'Historial');
		const entries = p.getByRole('list').getByRole('listitem').filter({ hasText: /^Regar plantas/ });
		await expect(entries).toHaveCount(2, { timeout: 60_000 });
		await expect(entries.filter({ hasText: /Mínima/ })).toHaveCount(1);
		await expect(entries.filter({ hasNotText: /Mínima/ })).toHaveCount(1);
	}

	await end();
});
