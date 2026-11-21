import { expect, test, type Browser, type Locator, type Page } from '@playwright/test';
import {
	openTab,
	advance,
	settle,
	close,
	completePanel,
	withClock,
	create,
	createAndView,
	stop,
	twoDevices,
	chooseEmoji,
	turnOnCompleted,
	waitStatus,
	goA,
	cleanEmulators,
	arrivesOnServer,
	goBack,
	sessionWithClock,
	viewHistory,
	type Definition
} from './support';

// qa/first-step.md: the panel's Primer paso field, its line in the row, when it is shown and unsaved changes.

test.beforeEach(async () => {
	await cleanEmulators();
});

const FRIDAY = '2026-11-13T10:00:00';
const WASH = 'Separar la ropa blanca';
const LENGTH =
	'Abrir el cajón de abajo, sacar toda la ropa blanca y separarla en dos pilas: la que va con agua caliente y la que no se mezcla con nada de color oscuro ni delicado';

/** The row of the task whose title is exactly `titulo` (other rows may contain that text). */
const f = (page: Page, title: string): Locator =>
	page.getByRole('listitem').filter({ has: page.getByRole('button', { name: title, exact: true }) });
const line = (page: Page, title: string) => f(page, title).getByText(/^Primer paso: /);
const notice = (page: Page) => page.getByRole('status').filter({ hasText: 'Completaste' });
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const field = (page: Page) => page.getByRole('textbox', { name: 'Primer paso', exact: true });
const showPaused = (page: Page) => page.getByRole('checkbox', { name: 'Pausadas' });
const panel = (page: Page) => page.getByRole('dialog');
const unsavedChangesNotice = (page: Page) => page.getByRole('alertdialog', { name: 'Tenés cambios sin guardar' });

/** The row says exactly `Primer paso: texto`, once. */
async function says(page: Page, title: string, text: string) {
	await expect(line(page, title)).toHaveCount(1);
	await expect(line(page, title)).toHaveText(`Primer paso: ${text}`);
}

/** The row is in view and does not contain `Primer paso`. */
async function withoutLine(page: Page, title: string) {
	await expect(f(page, title)).toBeVisible();
	await expect(f(page, title)).not.toContainText('Primer paso');
}

async function openRow(page: Page, title: string) {
	await f(page, title).getByRole('button', { name: title, exact: true }).click();
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await openTab(page, 'Tarea');
}

async function save(page: Page) {
	await button(page, 'Guardar').click();
	await expect(panel(page)).toHaveCount(0);
}

/** Opens the row, types the first step (Enter or Guardar) and leaves the panel closed. */
async function write(page: Page, title: string, text: string) {
	await openRow(page, title);
	await field(page).fill(text);
	await save(page);
}

/** Opens the row, checks the field value and closes without changes. */
async function holdsInPanel(page: Page, title: string, value: string) {
	await openRow(page, title);
	await expect(field(page)).toHaveValue(value);
	await close(page);
}

async function paste(page: Page, text: string) {
	await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.evaluate((t) => navigator.clipboard.writeText(t), text);
	await field(page).focus();
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
			overflow: s.overflow,
			maxHeight: s.maxHeight
		};
	});

async function pause(page: Page, title: string) {
	await openRow(page, title);
	await button(page, 'Pausar').click();
	await expect(panel(page)).toHaveCount(0);
}

async function postpone(page: Page, title: string, option: '3 horas' | 'Hasta mañana') {
	await openRow(page, title);
	await button(page, option).click();
	await expect(panel(page)).toHaveCount(0);
}

/** Session with the clock running 10 minutes before `hora` (tasks are created that way). */
async function session(page: Page, hour: string, completedList = false) {
	await sessionWithClock(page, new Date(new Date(hour).getTime() - 600_000).toISOString());
	if (completedList) await turnOnCompleted(page);
}

/** Advances the stopped clock to `hora` and lets one second run so the screen updates by itself. */
async function go(page: Page, hour: string) {
	const missing = new Date(hour).getTime() - (await page.evaluate(() => Date.now()));
	if (missing <= 10_000) await page.clock.runFor(missing);
	else await advance(page, hour);
	await page.clock.runFor(1000);
}

type New = Definition & { title: string };
const DOES_NOT_REPEAT = 'No se repite' as const;

test('Flujo 1: el campo en el panel y crear con primer paso', async ({ page }) => {
	await sessionWithClock(page, FRIDAY);

	// 1
	await button(page, '+').click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await expect(field(page)).toBeVisible();
	await expect(field(page)).toHaveValue('');
	await expect(field(page)).toHaveJSProperty('placeholder', '');
	const y = async (l: Locator) => (await l.boundingBox())!.y;
	const title = page.getByLabel('Título');
	const emoji = page.getByRole('button', { name: /^(Elegir emoji|Cambiar emoji)/ });
	const note = page.getByLabel('Nota');
	await expect(emoji).toBeVisible();
	const ys = [await y(title), await y(field(page)), await y(note)];
	expect(ys).toEqual([...ys].sort((a, b) => a - b));
	expect(new Set(ys).size).toBe(3);
	expect(Math.abs((await y(emoji)) - ys[0])).toBeLessThan(ys[1] - ys[0]);

	// 2
	await title.fill('Lavar');
	await field(page).fill(WASH);
	await field(page).press('Enter');
	await expect(panel(page)).toHaveCount(0);
	await says(page, 'Lavar', WASH);
	const box = async (l: Locator) => (await l.boundingBox())!;
	expect((await box(line(page, 'Lavar'))).y).toBeGreaterThan(
		(await box(f(page, 'Lavar').getByRole('button', { name: 'Lavar', exact: true }))).y +
			(await box(f(page, 'Lavar').getByRole('button', { name: 'Lavar', exact: true }))).height - 2
	);

	// 3
	await create(page, { title: 'Barrer', kind: DOES_NOT_REPEAT });
	await withoutLine(page, 'Barrer');

	// 4
	await create(page, {
		title: 'Regar',
		kind: 'Intervalo',
		every: '2',
		unit: 'días',
		firstStep: 'Llenar la regadera'
	});
	await says(page, 'Regar', 'Llenar la regadera');
	await create(page, {
		title: 'Basura',
		kind: 'Días de la semana',
		days: ['martes'],
		firstStep: 'Atar la bolsa llena'
	});
	await withoutLine(page, 'Basura'); // waiting until Tuesday

	// 5
	await holdsInPanel(page, 'Lavar', WASH);
	await holdsInPanel(page, 'Barrer', '');
	await page.reload();
	await says(page, 'Lavar', WASH);
	await withoutLine(page, 'Barrer');
	await says(page, 'Regar', 'Llenar la regadera');
});

test('Flujo 2: editar, recortar, vaciar y texto largo', async ({ page }) => {
	await sessionWithClock(page, FRIDAY);
	await create(page, { title: 'Lavar', kind: DOES_NOT_REPEAT, firstStep: WASH });

	// 1
	await write(page, 'Lavar', '  Juntar las llaves  ');
	await says(page, 'Lavar', 'Juntar las llaves');
	await openRow(page, 'Lavar');
	await expect(field(page)).toHaveValue('Juntar las llaves');
	await close(page);

	// 2
	await openRow(page, 'Lavar');
	await paste(page, 'uno\ndos');
	expect(await field(page).inputValue()).not.toContain('\n');
	await field(page).press('Enter');
	await expect(panel(page)).toHaveCount(0);
	await expect(line(page, 'Lavar')).toHaveText(/^Primer paso: uno ?dos$/);
	expect(await line(page, 'Lavar').innerText()).not.toContain('\n');
	await openRow(page, 'Lavar');
	expect(await field(page).inputValue()).not.toContain('\n');
	await close(page);

	// 3
	await write(page, 'Lavar', '');
	await withoutLine(page, 'Lavar');
	await holdsInPanel(page, 'Lavar', '');
	await page.reload();
	await withoutLine(page, 'Lavar');

	// 4
	await write(page, 'Lavar', WASH);
	await says(page, 'Lavar', WASH);
	await openRow(page, 'Lavar');
	await field(page).fill('   ');
	await button(page, 'Guardar').click();
	await expect(panel(page)).toHaveCount(0);
	await expect(page.getByRole('alert')).toHaveCount(0);
	await withoutLine(page, 'Lavar');
	await holdsInPanel(page, 'Lavar', '');

	// 5
	await openRow(page, 'Lavar');
	await paste(page, 'a'.repeat(5000));
	await save(page);
	await expect(page.getByRole('alert')).toHaveCount(0);
	await expect(line(page, 'Lavar')).toBeVisible();
	await openRow(page, 'Lavar');
	expect((await field(page).inputValue()).length).toBe(5000);
	await close(page);

	// 6
	await page.setViewportSize({ width: 390, height: 844 });
	await write(page, 'Lavar', LENGTH);
	await says(page, 'Lavar', LENGTH);
	const l = line(page, 'Lavar');
	const e = await style(l);
	expect(e.trim).not.toBe('ellipsis');
	expect(e.overflow).not.toBe('hidden');
	expect(e.maxHeight).toBe('none');
	expect(await l.evaluate((n) => n.scrollHeight <= n.clientHeight + 1 && n.scrollWidth <= n.clientWidth + 1)).toBe(true);
	const box = (await l.boundingBox())!;
	expect(box.height).toBeGreaterThan(parseFloat(e.size) * 2.2);
	expect(box.x + box.width).toBeLessThanOrEqual(390);
	expect(await l.innerText()).not.toContain('…');
});

test('Flujo 3: la línea en la fila (posición, estilo, toque)', async ({ page }) => {
	await sessionWithClock(page, FRIDAY);
	await create(page, {
		title: 'Pagar la luz',
		kind: DOES_NOT_REPEAT,
		date: '2026-11-10',
		firstStep: 'Buscar la factura'
	});
	await create(page, {
		title: 'Cambiar foco',
		kind: DOES_NOT_REPEAT,
		date: '',
		schedule: { from: '08:00', to: '12:00' },
		firstStep: 'Sacar la escalera'
	});
	await create(page, { title: 'Barrer', kind: DOES_NOT_REPEAT, date: '' });

	// 1
	await waitStatus(page, 'Pagar la luz', 'atrasada', undefined, false);
	await waitStatus(page, 'Cambiar foco', 'pendiente');
	await says(page, 'Pagar la luz', 'Buscar la factura');
	await says(page, 'Cambiar foco', 'Sacar la escalera');
	for (const t of ['Pagar la luz', 'Cambiar foco']) {
		const title = (await f(page, t).getByRole('button', { name: t, exact: true }).boundingBox())!;
		const l = (await line(page, t).boundingBox())!;
		expect(l.y).toBeGreaterThanOrEqual(title.y + title.height - 2);
	}

	// 2
	const l = line(page, 'Pagar la luz');
	const a = await style(l);
	const r = await style(f(page, 'Cambiar foco').getByText(/\d\d:\d\d–\d\d:\d\d/));
	expect(a.color).toBe(r.color);
	expect(a.size).toBe(r.size);
	expect(a.weight).toBeLessThan(600);
	expect(a.line).not.toContain('underline');
	const [red, green, blue] = a.color.match(/\d+/g)!.map(Number);
	expect(red > green && red > blue).toBe(false);
	expect((await style(f(page, 'Pagar la luz'))).background).toBe((await style(f(page, 'Barrer'))).background);

	// 3
	for (const t of ['Pagar la luz', 'Cambiar foco']) {
		await expect(f(page, t).getByRole('checkbox')).toHaveCount(1);
		await expect(f(page, t).getByRole('button')).toHaveCount(1);
		await expect(f(page, t).getByRole('textbox')).toHaveCount(0);
		await expect(f(page, t).getByRole('progressbar')).toHaveCount(0);
	}

	// 4: tapping the line is tapping the row.
	const c = (await line(page, 'Cambiar foco').boundingBox())!;
	await page.mouse.click(c.x + c.width / 2, c.y + c.height / 2);
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await expect(page.getByLabel('Título')).toHaveValue('Cambiar foco');
	await close(page);

	// 5
	await f(page, 'Cambiar foco').getByRole('checkbox').click();
	await expect(notice(page)).toContainText('Completaste «Cambiar foco»');
});

test('Flujo 4: dónde se ve y cuándo desaparece y vuelve', async ({ page }) => {
	await session(page, FRIDAY, true);

	// 1
	await withClock(page, async () => {
		await createAndView(page, { title: 'Cambiar foco', kind: DOES_NOT_REPEAT, date: '', firstStep: 'Sacar la escalera' });
		await createAndView(page, { title: 'Pagar', kind: DOES_NOT_REPEAT, date: '2026-11-10', firstStep: 'Buscar la factura' });
		await createAndView(page, { title: 'Regar', kind: 'Intervalo', every: '8', unit: 'horas', firstStep: 'Llenar la regadera' });
	});
	await stop(page, FRIDAY);

	// 2
	await withClock(page, async () => {
		await waitStatus(page, 'Pagar', 'atrasada', undefined, false);
		await waitStatus(page, 'Cambiar foco', 'pendiente');
		await waitStatus(page, 'Regar', 'pendiente');
		await says(page, 'Pagar', 'Buscar la factura');
		await says(page, 'Cambiar foco', 'Sacar la escalera');
		await says(page, 'Regar', 'Llenar la regadera');
	});

	// 3
	await f(page, 'Regar').getByRole('checkbox').click();
	await withClock(page, async () => {
		await expect(f(page, 'Regar').getByRole('checkbox')).toBeChecked();
		await withoutLine(page, 'Regar');
	});
	await go(page, '2026-11-13T17:59:00');
	await withClock(page, () => withoutLine(page, 'Regar'));
	await go(page, '2026-11-13T18:00:00');
	await withClock(page, async () => {
		await waitStatus(page, 'Regar', 'pendiente', undefined, false);
		await says(page, 'Regar', 'Llenar la regadera');
	});

	// 4
	await go(page, '2026-11-14T02:00:00');
	await withClock(page, async () => {
		await waitStatus(page, 'Regar', 'atrasada', undefined, false);
		await says(page, 'Regar', 'Llenar la regadera');
	});

	// 5
	await f(page, 'Cambiar foco').getByRole('checkbox').click();
	await withClock(page, async () => {
		await expect(notice(page)).toContainText('Completaste «Cambiar foco»');
		await expect(notice(page)).not.toContainText('Primer paso');
		await expect(f(page, 'Cambiar foco').getByRole('checkbox')).toBeChecked();
		await withoutLine(page, 'Cambiar foco');
	});
	await notice(page).getByRole('button', { name: 'Deshacer' }).click();
	await settle(page);
	await withClock(page, async () => {
		await waitStatus(page, 'Cambiar foco', 'pendiente', undefined, false);
		await says(page, 'Cambiar foco', 'Sacar la escalera');
	});

	// 6
	await postpone(page, 'Cambiar foco', '3 horas');
	await postpone(page, 'Pagar', 'Hasta mañana');
	await withClock(page, async () => {
		await withoutLine(page, 'Cambiar foco');
		await withoutLine(page, 'Pagar');
	});
	await go(page, '2026-11-14T05:01:00');
	await withClock(page, async () => {
		await says(page, 'Cambiar foco', 'Sacar la escalera');
		await withoutLine(page, 'Pagar');
	});
	await go(page, '2026-11-15T07:00:00');
	await withClock(page, async () => {
		await waitStatus(page, 'Pagar', 'atrasada', undefined, false);
		await says(page, 'Pagar', 'Buscar la factura');
	});

	// 7
	await pause(page, 'Regar');
	await withClock(page, () => expect(f(page, 'Regar')).toHaveCount(0));
	await showPaused(page).click();
	await expect(showPaused(page)).toBeChecked();
	await withClock(page, async () => {
		await expect(f(page, 'Regar').getByText('Pausada')).toBeVisible();
		await withoutLine(page, 'Regar');
	});
	await openRow(page, 'Regar');
	await button(page, 'Reanudar').click();
	await expect(panel(page)).toHaveCount(0);
	await withClock(page, async () => {
		await expect(f(page, 'Regar').getByText('Pausada')).toHaveCount(0);
		await waitStatus(page, 'Regar', 'pendiente', undefined, false);
		await says(page, 'Regar', 'Llenar la regadera');
	});

	// 8: with the clock on Friday.
	await goBack(page, FRIDAY);
	await withClock(page, () =>
		createAndView(page, { title: 'Basura', kind: 'Días de la semana', days: ['martes'], firstStep: 'Atar la bolsa llena' })
	);
	await withClock(page, () => withoutLine(page, 'Basura'));
	await go(page, '2026-11-17T09:00:00');
	await withClock(page, async () => {
		await waitStatus(page, 'Basura', 'pendiente', undefined, false);
		await says(page, 'Basura', 'Atar la bolsa llena');
	});

	// 9
	await withClock(page, () =>
		createAndView(page, {
			title: 'Llamar',
			kind: DOES_NOT_REPEAT,
			date: '',
			schedule: { from: '08:00', to: '09:00' },
			firstStep: 'Buscar el número'
		})
	);
	await withClock(page, () => withoutLine(page, 'Llamar'));
	await go(page, '2026-11-18T08:00:00');
	await withClock(page, async () => {
		await waitStatus(page, 'Llamar', 'pendiente', undefined, false);
		await says(page, 'Llamar', 'Buscar el número');
	});
});

test('Flujo 5: atrasada con el checkbox deshabilitado', async ({ page }) => {
	await session(page, '2026-11-09T09:00:00');

	// 1
	await withClock(page, () =>
		createAndView(page, {
			title: 'Lavar',
			kind: DOES_NOT_REPEAT,
			date: '2026-11-10',
			schedule: { from: '08:00', to: '11:00' },
			firstStep: WASH
		})
	);
	await stop(page, '2026-11-09T09:00:00');

	// 2
	await go(page, '2026-11-11T07:00:00');
	await withClock(page, async () => {
		await waitStatus(page, 'Lavar', 'atrasada', undefined, false, false);
		await says(page, 'Lavar', WASH);
	});

	// 3
	await go(page, '2026-11-11T08:00:00');
	await withClock(page, async () => {
		await waitStatus(page, 'Lavar', 'atrasada', undefined, false, true);
		await says(page, 'Lavar', WASH);
	});
});

test('Flujo 6: el primer paso no cambia con las acciones de la tarea', async ({ page }) => {
	await sessionWithClock(page, FRIDAY);
	await turnOnCompleted(page);
	await showPaused(page).click();
	await expect(showPaused(page)).toBeChecked();
	const WATER = 'Llenar la regadera';

	// 1
	await create(page, { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días', firstStep: WATER });
	await f(page, 'Regar').getByRole('checkbox').click();
	await expect(f(page, 'Regar').getByRole('checkbox')).toBeChecked();
	await holdsInPanel(page, 'Regar', WATER);

	// 2
	await pause(page, 'Regar');
	await expect(f(page, 'Regar').getByText('Pausada')).toBeVisible();
	await holdsInPanel(page, 'Regar', WATER);
	await openRow(page, 'Regar');
	await button(page, 'Reanudar').click();
	await expect(panel(page)).toHaveCount(0);
	await holdsInPanel(page, 'Regar', WATER);

	// 3
	await f(page, 'Regar').getByRole('checkbox').click();
	await expect(notice(page)).toContainText('Completaste «Regar»');
	await notice(page).getByRole('button', { name: 'Deshacer' }).click();
	await expect(notice(page)).toHaveCount(0);
	await holdsInPanel(page, 'Regar', WATER);

	// 4
	await openRow(page, 'Regar');
	await completePanel(page, { kind: 'Días de la semana', days: ['martes'] });
	await save(page);
	await holdsInPanel(page, 'Regar', WATER);
	await openRow(page, 'Regar');
	await completePanel(page, { kind: DOES_NOT_REPEAT });
	await save(page);
	await holdsInPanel(page, 'Regar', WATER);
	await openRow(page, 'Regar');
	await completePanel(page, { kind: 'Intervalo', every: '2', unit: 'días' });
	await save(page);
	await holdsInPanel(page, 'Regar', WATER);

	// 5
	await create(page, { title: 'Cambiar foco', kind: DOES_NOT_REPEAT, firstStep: 'Sacar la escalera' });
	await postpone(page, 'Cambiar foco', '3 horas');
	await holdsInPanel(page, 'Cambiar foco', 'Sacar la escalera');

	// 6
	await page.reload();
	await holdsInPanel(page, 'Regar', WATER);
	await holdsInPanel(page, 'Cambiar foco', 'Sacar la escalera');
	await openRow(page, 'Regar');
	await expect(panel(page).getByRole('checkbox', { name: /primer paso|hecho/i })).toHaveCount(0);
	await expect(panel(page).getByRole('button', { name: /primer paso|hecho/i })).toHaveCount(0);
	await close(page);
	await expect(f(page, 'Regar').getByRole('checkbox')).toHaveCount(1);

	// 7
	await create(page, { title: 'Barrer', kind: DOES_NOT_REPEAT });
	await holdsInPanel(page, 'Barrer', '');
	await withoutLine(page, 'Barrer');
});

test('Flujo 7: lo que no cambia y lo que no lo muestra', async ({ page }) => {
	await sessionWithClock(page, FRIDAY);
	const titles = () =>
		page
			.getByRole('listitem')
			.getByRole('checkbox')
			.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')!.replace('Completar ', '')));
	const texts = async (t: string[]) => Promise.all(t.map((x) => f(page, x).innerText()));

	// 1
	await create(page, { title: 'Barrer', kind: DOES_NOT_REPEAT, date: '' });
	await create(page, { title: 'Lavar', kind: DOES_NOT_REPEAT, date: '' });
	await create(page, { title: 'Planchar', kind: DOES_NOT_REPEAT, date: '' });
	const order = await titles();
	expect([...order].sort()).toEqual(['Barrer', 'Lavar', 'Planchar']);
	const before = await texts(['Barrer', 'Planchar']);

	// 2
	await write(page, 'Lavar', WASH);
	await says(page, 'Lavar', WASH);
	expect(await titles()).toEqual(order);
	expect(await texts(['Barrer', 'Planchar'])).toEqual(before);
	await write(page, 'Barrer', 'Barrer abajo');
	await write(page, 'Lavar', '');
	await says(page, 'Barrer', 'Barrer abajo');
	await withoutLine(page, 'Lavar');
	expect(await titles()).toEqual(order);
	await write(page, 'Barrer', '');
	await write(page, 'Lavar', WASH);

	// 3
	await openRow(page, 'Lavar');
	await chooseEmoji(page, '🧺', 'cesta');
	await save(page);
	await expect(f(page, '🧺 Lavar').getByRole('button', { name: '🧺 Lavar', exact: true })).toBeVisible();
	await says(page, '🧺 Lavar', WASH);
	const b = (await f(page, '🧺 Lavar').getByRole('button', { name: '🧺 Lavar', exact: true }).boundingBox())!;
	expect((await line(page, '🧺 Lavar').boundingBox())!.y).toBeGreaterThanOrEqual(b.y + b.height - 2);

	// 4
	await f(page, '🧺 Lavar').getByRole('checkbox').click();
	await expect(notice(page)).toContainText('Completaste «🧺 Lavar»');
	await expect(notice(page)).not.toContainText('Primer paso');
	await goA(page, 'Historial');
	await viewHistory(page, [['Hoy', [['🧺 Lavar', '\\d\\d:\\d\\d']]]]);
	await expect(page.locator('body')).not.toContainText('Primer paso');
	await expect(page.locator('body')).not.toContainText(WASH);
	await goA(page, 'Pendientes');
});

test('Flujo 8: cambios sin guardar con el campo', async ({ page }) => {
	await sessionWithClock(page, FRIDAY);
	await create(page, { title: 'Lavar', kind: DOES_NOT_REPEAT, firstStep: WASH });
	await create(page, { title: 'Barrer', kind: DOES_NOT_REPEAT });

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
	await field(page).fill('Juntar las llaves');
	await asksNoticeAndDiscards();
	await says(page, 'Lavar', WASH);

	// 2
	await openRow(page, 'Lavar');
	await field(page).fill('Juntar las llaves');
	await field(page).fill(WASH);
	await closesDirect();

	// 3
	await openRow(page, 'Lavar');
	await field(page).fill(`   ${WASH}   `);
	await closesDirect();

	// 4
	await openRow(page, 'Lavar');
	await field(page).fill('');
	await asksNoticeAndDiscards();
	await openRow(page, 'Lavar');
	await field(page).fill('   ');
	await asksNoticeAndDiscards();
	await says(page, 'Lavar', WASH);

	// 5
	await openRow(page, 'Barrer');
	await field(page).fill('   ');
	await closesDirect();
	await openRow(page, 'Barrer');
	await field(page).fill('Barrer abajo');
	await asksNoticeAndDiscards();
	await withoutLine(page, 'Barrer');

	// 6
	await button(page, '+').click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await closesDirect();
	await button(page, '+').click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await field(page).fill(WASH);
	await asksNoticeAndDiscards();
});

async function devices(browser: Browser) {
	const d = await twoDevices(browser, FRIDAY);
	await turnOnCompleted(d.a);
	await turnOnCompleted(d.b);
	for (const p of [d.a, d.b]) {
		await showPaused(p).click();
		await expect(showPaused(p)).toBeChecked();
	}
	return d;
}

test('Flujo 9: dos dispositivos', async ({ browser }) => {
	const { a, b, ctxB, close: end } = await devices(browser);
	const note = (p: Page) => p.getByLabel('Nota');

	// 1
	await create(a, { title: 'Lavar', kind: DOES_NOT_REPEAT, date: '' });
	await expect(f(b, 'Lavar')).toBeVisible();

	// 2
	await ctxB.setOffline(true);
	await write(b, 'Lavar', WASH);
	await openRow(a, 'Lavar');
	await a.getByLabel('Título').fill('Lavar a mano');
	await save(a);
	await arrivesOnServer(a);

	// 3
	await ctxB.setOffline(false);
	for (const p of [a, b]) {
		await expect(f(p, 'Lavar a mano')).toBeVisible();
		await says(p, 'Lavar a mano', WASH);
	}

	// 4
	await ctxB.setOffline(true);
	await write(b, 'Lavar a mano', 'Juntar las llaves');
	await openRow(a, 'Lavar a mano');
	await note(a).fill('Usar guantes');
	await save(a);
	await arrivesOnServer(a);
	await ctxB.setOffline(false);
	for (const p of [a, b]) {
		await says(p, 'Lavar a mano', 'Juntar las llaves');
		await expect(async () => {
			await openRow(p, 'Lavar a mano');
			await expect(note(p)).toHaveValue('Usar guantes', { timeout: 1000 });
			await close(p);
		}).toPass({ timeout: 20_000 });
	}

	// 5
	await ctxB.setOffline(true);
	await write(b, 'Lavar a mano', 'Buscar el detergente');
	await write(a, 'Lavar a mano', 'Poner el agua a calentar');
	await arrivesOnServer(a);
	await ctxB.setOffline(false);
	for (const p of [a, b]) await says(p, 'Lavar a mano', 'Buscar el detergente');

	// 6
	await ctxB.setOffline(true);
	await write(b, 'Lavar a mano', '');
	await write(a, 'Lavar a mano', 'Sacar la escalera');
	await arrivesOnServer(a);
	await ctxB.setOffline(false);
	for (const p of [a, b]) await expect(f(p, 'Lavar a mano')).not.toContainText('Primer paso');

	// 7
	await ctxB.setOffline(true);
	await write(b, 'Lavar a mano', 'Barrer abajo');
	await write(a, 'Lavar a mano', '');
	await arrivesOnServer(a);
	await ctxB.setOffline(false);
	for (const p of [a, b]) await says(p, 'Lavar a mano', 'Barrer abajo');

	// 8
	await ctxB.setOffline(true);
	await write(b, 'Lavar a mano', WASH);
	await openRow(a, 'Lavar a mano');
	await save(a);
	await arrivesOnServer(a);
	await ctxB.setOffline(false);
	for (const p of [a, b]) await says(p, 'Lavar a mano', WASH);

	await end();
});
