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

// qa/one-step-at-a-time.md: the panel's step fields, the row's line and buttons, Hecho on the last step,
// when it is shown, what does not change, Cambios sin guardar and two devices.

test.beforeEach(async () => {
	await cleanEmulators();
});

const FRIDAY = '2026-11-13T10:00:00';
const P1 = 'Separar la ropa blanca';
const P2 = 'Poner el lavarropas';
const P3 = 'Tender la ropa';
const LENGTH =
	'Abrir el cajón de abajo y sacar toda la ropa blanca y separarla en dos pilas: la que va con agua caliente y la que no se mezcla con nada de color oscuro ni delicado';
const DOES_NOT_REPEAT = 'No se repite' as const;

/** The row of the task whose title is exactly `t` (other rows may contain that text). */
const f = (page: Page, t: string): Locator =>
	page.getByRole('listitem').filter({ has: page.getByRole('button', { name: t, exact: true }) });
const line = (page: Page, t: string) => f(page, t).getByText(/^(Primer paso|Paso): /);
const done = (page: Page, t: string) => f(page, t).getByRole('button', { name: 'Hecho', exact: true });
const previous = (page: Page, t: string) => f(page, t).getByRole('button', { name: 'Paso anterior', exact: true });
const notice = (page: Page) => page.getByRole('status').filter({ hasText: 'Completaste' });
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const first = (page: Page) => page.getByRole('textbox', { name: 'Primer paso', exact: true });
const step = (page: Page, n: number) => page.getByRole('textbox', { name: `Paso ${n}`, exact: true });
const fieldsStep = (page: Page) => page.getByRole('textbox', { name: /^Paso \d+$/ });
const remove = (page: Page, n: number) =>
	step(page, n).locator('..').getByRole('button', { name: 'Quitar', exact: true });
const showPaused = (page: Page) => page.getByRole('checkbox', { name: 'Pausadas' });
const panel = (page: Page) => page.getByRole('dialog');
const unsavedChangesNotice = (page: Page) => page.getByRole('alertdialog', { name: 'Tenés cambios sin guardar' });
const titles = (page: Page) =>
	page
		.getByRole('listitem')
		.getByRole('checkbox')
		.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')!.replace('Completar ', '')));

/** The row says exactly `Primer paso: texto` (or `Paso: texto`), once. */
async function says(page: Page, t: string, text: string, isFirst = false) {
	await expect(line(page, t)).toHaveCount(1);
	await expect(line(page, t)).toHaveText(`${isFirst ? 'Primer paso' : 'Paso'}: ${text}`);
}

/** With two steps or more: Paso anterior (if on a step other than the first) and Hecho, in that order. */
async function withButtons(page: Page, t: string, withPrevious: boolean) {
	await expect(done(page, t)).toHaveCount(1);
	await expect(previous(page, t)).toHaveCount(withPrevious ? 1 : 0);
	if (withPrevious) {
		const a = (await previous(page, t).boundingBox())!;
		const h = (await done(page, t).boundingBox())!;
		expect(a.x).toBeLessThan(h.x);
	}
}

/** The row is in view and has no line or buttons. */
async function withoutLine(page: Page, t: string) {
	await expect(f(page, t)).toBeVisible();
	await expect(f(page, t)).not.toContainText(/Primer paso|Paso/);
	await expect(done(page, t)).toHaveCount(0);
	await expect(previous(page, t)).toHaveCount(0);
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

async function addStep(page: Page, n: number, text?: string) {
	await button(page, 'Agregar paso').click();
	if (text !== undefined) await step(page, n).fill(text);
}

const stepsValues = (page: Page) => fieldsStep(page).evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));

/** Opens the row and checks Primer paso and the extra steps; closes without changes. */
async function panelHas(page: Page, t: string, isFirst: string, steps: string[]) {
	await openRow(page, t);
	await expect(first(page)).toHaveValue(isFirst);
	await expect.poll(() => stepsValues(page)).toEqual(steps);
	await close(page);
}

async function writeStep(page: Page, t: string, n: number, text: string) {
	await openRow(page, t);
	await step(page, n).fill(text);
	await save(page);
}

async function writeFirst(page: Page, t: string, text: string) {
	await openRow(page, t);
	await first(page).fill(text);
	await save(page);
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
			overflow: s.overflow,
			maxHeight: s.maxHeight,
			clamp: s.getPropertyValue('-webkit-line-clamp')
		};
	});

async function pause(page: Page, t: string) {
	await openRow(page, t);
	await button(page, 'Pausar').click();
	await expect(panel(page)).toHaveCount(0);
}

async function postpone(page: Page, t: string, option: '3 horas' | 'Hasta mañana') {
	await openRow(page, t);
	await button(page, option).click();
	await expect(panel(page)).toHaveCount(0);
}

/** Session with the clock running 10 minutes before `hora` (tasks are created that way). */
async function session(page: Page, hour: string, completedList = false) {
	await sessionWithClock(page, new Date(new Date(hour).getTime() - 600_000).toISOString());
	if (completedList) await turnOnCompleted(page);
}

/** Advances the clock to `hora` and lets one second run so the screen updates by itself. */
async function go(page: Page, hour: string) {
	const missing = new Date(hour).getTime() - (await page.evaluate(() => Date.now()));
	if (missing <= 10_000) await page.clock.runFor(missing);
	else await advance(page, hour);
	await page.clock.runFor(1000);
}

/** Completes with the checkbox right at `hora` (the test clock advances a few ms on every wait, and the round is counted from here). */
async function completeA(page: Page, hour: string, t: string) {
	await page.clock.setSystemTime(new Date(hour));
	await f(page, t).getByRole('checkbox').click();
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

test('Flow 1: los campos de pasos en el panel y crear', async ({ page }) => {
	await sessionWithClock(page, FRIDAY);
	const y = async (l: Locator) => (await l.boundingBox())!.y;
	const ascending = (ys: number[]) => {
		expect(ys).toEqual([...ys].sort((a, b) => a - b));
		expect(new Set(ys).size).toBe(ys.length);
	};

	// 1
	await button(page, '+').click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await expect(first(page)).toBeVisible();
	await expect(button(page, 'Agregar paso')).toBeVisible();
	await expect(fieldsStep(page)).toHaveCount(0);
	const title = page.getByLabel('Título');
	const emoji = page.getByRole('button', { name: /^(Elegir emoji|Cambiar emoji)/ });
	const note = page.getByLabel('Nota');
	await expect(emoji).toBeVisible();
	ascending([
		await y(title),
		await y(first(page)),
		await y(button(page, 'Agregar paso')),
		await y(note)
	]);
	expect(Math.abs((await y(emoji)) - (await y(title)))).toBeLessThan((await y(first(page))) - (await y(title)));

	// 2
	await title.fill('Lavar');
	await first(page).fill(P1);
	await button(page, 'Agregar paso').click();
	await expect(step(page, 2)).toBeVisible();
	await expect(step(page, 2)).toHaveValue('');
	await expect(step(page, 2)).toBeFocused();
	await expect(step(page, 2)).toHaveJSProperty('placeholder', '');
	await expect(remove(page, 2)).toBeVisible();
	expect(Math.abs((await y(remove(page, 2))) - (await y(step(page, 2))))).toBeLessThan(30);
	expect(await y(button(page, 'Agregar paso'))).toBeGreaterThan(await y(step(page, 2)));
	await step(page, 2).fill(P2);
	await button(page, 'Agregar paso').click();
	await expect(step(page, 3)).toBeFocused();
	await step(page, 3).fill(P3);
	ascending([
		await y(first(page)),
		await y(step(page, 2)),
		await y(step(page, 3)),
		await y(button(page, 'Agregar paso')),
		await y(note)
	]);

	// 3
	await step(page, 3).press('Enter');
	await expect(panel(page)).toHaveCount(0);
	await says(page, 'Lavar', P1, true);
	await withButtons(page, 'Lavar', false);
	await expect(f(page, 'Lavar')).not.toContainText(P2);
	await expect(f(page, 'Lavar')).not.toContainText(P3);

	// 4
	await openRow(page, 'Lavar');
	await expect(first(page)).toHaveValue(P1);
	await expect(step(page, 2)).toHaveValue(P2);
	await expect(step(page, 3)).toHaveValue(P3);
	await expect(remove(page, 2)).toBeVisible();
	await expect(remove(page, 3)).toBeVisible();
	await expect(panel(page)).not.toContainText(/en qué paso|paso actual/i);
	await close(page);
	await page.reload();
	await panelHas(page, 'Lavar', P1, [P2, P3]);

	// 5
	await create(page, { title: 'Barrer', kind: DOES_NOT_REPEAT, date: '', firstStep: 'Juntar la basura' });
	await says(page, 'Barrer', 'Juntar la basura', true);
	await expect(done(page, 'Barrer')).toHaveCount(0);
	await expect(previous(page, 'Barrer')).toHaveCount(0);

	// 6
	await create(page, {
		title: 'Regar',
		kind: 'Intervalo',
		every: '2',
		unit: 'días',
		firstStep: 'Llenar la regadera',
		steps: ['Regar los helechos']
	});
	await says(page, 'Regar', 'Llenar la regadera', true);
	await withButtons(page, 'Regar', false);
	await create(page, {
		title: 'Basura',
		kind: 'Días de la semana',
		days: ['martes'],
		firstStep: 'Atar la bolsa llena',
		steps: ['Bajar la basura']
	});
	await withoutLine(page, 'Basura'); // waiting until Tuesday

	// 7
	await create(page, { title: 'Planchar', kind: DOES_NOT_REPEAT, date: '' });
	await withoutLine(page, 'Planchar');
});

test('Flow 2: editar, recortar, descartar, quitar y sin máximos', async ({ page }) => {
	await sessionWithClock(page, FRIDAY);
	await create(page, { title: 'Lavar', kind: DOES_NOT_REPEAT, date: '', firstStep: P1, steps: [P2, P3] });

	// 1
	await writeStep(page, 'Lavar', 2, '  Juntar las llaves  ');
	await panelHas(page, 'Lavar', P1, ['Juntar las llaves', P3]);

	// 2
	await openRow(page, 'Lavar');
	await paste(page, step(page, 2), 'uno\ndos');
	expect(await step(page, 2).inputValue()).not.toContain('\n');
	await step(page, 2).press('Enter');
	await expect(panel(page)).toHaveCount(0);
	await openRow(page, 'Lavar');
	expect(await step(page, 2).inputValue()).not.toContain('\n');
	expect(await step(page, 2).inputValue()).toMatch(/^uno ?dos$/);
	await close(page);

	// 3
	await writeStep(page, 'Lavar', 2, '');
	await panelHas(page, 'Lavar', P1, [P3]);

	// 4
	await openRow(page, 'Lavar');
	await step(page, 2).fill('   ');
	await button(page, 'Guardar').click();
	await expect(panel(page)).toHaveCount(0);
	await expect(page.getByRole('alert')).toHaveCount(0);
	await panelHas(page, 'Lavar', P1, []);
	await openRow(page, 'Lavar');
	await addStep(page, 2, P2);
	await save(page);
	await panelHas(page, 'Lavar', P1, [P2]);

	// 5
	await writeFirst(page, 'Lavar', '');
	await says(page, 'Lavar', P2, true);
	await panelHas(page, 'Lavar', P2, []);

	// 6
	await openRow(page, 'Lavar');
	await addStep(page, 2, 'A');
	await addStep(page, 3, 'B');
	await save(page);
	await panelHas(page, 'Lavar', P2, ['A', 'B']);
	await openRow(page, 'Lavar');
	await remove(page, 2).click();
	await expect(step(page, 2)).toHaveValue('B');
	await expect(step(page, 3)).toHaveCount(0);
	await save(page);
	await panelHas(page, 'Lavar', P2, ['B']);
	await openRow(page, 'Lavar');
	await button(page, 'Agregar paso').click();
	await expect(step(page, 3)).toHaveValue('');
	await save(page);
	await panelHas(page, 'Lavar', P2, ['B']);

	// 7
	await openRow(page, 'Lavar');
	await paste(page, step(page, 2), 'a'.repeat(5000));
	await save(page);
	await expect(page.getByRole('alert')).toHaveCount(0);
	await openRow(page, 'Lavar');
	expect((await step(page, 2).inputValue()).length).toBe(5000);
	await close(page);

	// 8
	await openRow(page, 'Lavar');
	for (let i = 1; i <= 30; i++) await addStep(page, i + 2, `p${i}`);
	await save(page);
	await expect(page.getByRole('alert')).toHaveCount(0);
	await openRow(page, 'Lavar');
	const values = await (async () => {
		await expect(fieldsStep(page)).toHaveCount(31);
		return stepsValues(page);
	})();
	expect(values[0].length).toBe(5000);
	expect(values.slice(1)).toEqual(Array.from({ length: 30 }, (_, i) => `p${i + 1}`));
	await close(page);

	// 9
	await page.setViewportSize({ width: 390, height: 844 });
	await create(page, {
		title: 'Cajón',
		kind: DOES_NOT_REPEAT,
		date: '',
		firstStep: 'Abrir el cajón',
		steps: [LENGTH]
	});
	await done(page, 'Cajón').click();
	await says(page, 'Cajón', LENGTH);
	const l = line(page, 'Cajón');
	const e = await style(l);
	expect(e.trim).not.toBe('ellipsis');
	expect(e.overflow).not.toBe('hidden');
	expect(e.maxHeight).toBe('none');
	expect(e.clamp).not.toMatch(/^\d+$/);
	expect(await l.evaluate((n) => n.scrollHeight <= n.clientHeight + 1 && n.scrollWidth <= n.clientWidth + 1)).toBe(true);
	const box = (await l.boundingBox())!;
	expect(box.height).toBeGreaterThan(parseFloat(e.size) * 2.2);
	expect(box.x + box.width).toBeLessThanOrEqual(390);
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
	expect(await l.innerText()).not.toContain('…');
});

test('Flow 3: avanzar y retroceder desde la fila', async ({ page }) => {
	await sessionWithClock(page, FRIDAY);
	await create(page, { title: 'Barrer', kind: DOES_NOT_REPEAT, date: '', schedule: { from: '08:00', to: '12:00' } });
	await create(page, { title: 'Lavar', kind: DOES_NOT_REPEAT, date: '', firstStep: P1, steps: [P2, P3] });
	const withoutNotices = async () => {
		await expect(page.getByRole('heading', { name: 'Editar tarea' })).toHaveCount(0);
		await expect(panel(page)).toHaveCount(0);
		await expect(unsavedChangesNotice(page)).toHaveCount(0);
		await expect(page.getByRole('alertdialog')).toHaveCount(0);
		await expect(notice(page)).toHaveCount(0);
	};

	// 1
	await says(page, 'Lavar', P1, true);
	await withButtons(page, 'Lavar', false);
	const background = (await style(f(page, 'Lavar'))).background;

	// 2
	await done(page, 'Lavar').click();
	await says(page, 'Lavar', P2);
	await withButtons(page, 'Lavar', true);
	await withoutNotices();
	await expect(f(page, 'Lavar')).not.toContainText(P3);
	await expect(f(page, 'Lavar')).not.toContainText(/\d+ de \d+|[Pp]aso \d/);

	// 3
	await previous(page, 'Lavar').click();
	await says(page, 'Lavar', P1, true);
	await withButtons(page, 'Lavar', false);
	await done(page, 'Lavar').click();
	await says(page, 'Lavar', P2);
	await done(page, 'Lavar').click();
	await says(page, 'Lavar', P3);
	await withoutNotices();

	// 4
	await page.reload();
	await says(page, 'Lavar', P3);
	await withButtons(page, 'Lavar', true);

	// 5
	const c = (await line(page, 'Lavar').boundingBox())!;
	await page.mouse.click(c.x + c.width / 2, c.y + c.height / 2);
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await expect(page.getByLabel('Título')).toHaveValue('Lavar');
	await expect(panel(page)).not.toContainText(/en qué paso|paso actual/i);
	await close(page);
	await expect(unsavedChangesNotice(page)).toHaveCount(0);

	// 6
	const l = await style(line(page, 'Lavar'));
	const r = await style(f(page, 'Barrer').getByText(/\d\d:\d\d–\d\d:\d\d/));
	expect(l.color).toBe(r.color);
	expect(l.size).toBe(r.size);
	expect(l.weight).toBeLessThan(600);
	expect(l.line).not.toContain('underline');
	for (const b of [done(page, 'Lavar'), previous(page, 'Lavar')]) {
		const e = await style(b);
		expect(e.color).toBe(l.color);
		expect(e.weight).toBeLessThan(600);
		expect(e.line).not.toContain('underline');
		expect(e.background).toBe('rgba(0, 0, 0, 0)');
	}
	expect((await style(f(page, 'Lavar'))).background).toBe(background);
	expect((await style(f(page, 'Barrer'))).background).toBe(background);
});

test('Flow 4: «Hecho» en el último paso completa la tarea', async ({ page }) => {
	await session(page, FRIDAY, true);
	await withClock(page, async () => {
		await createAndView(page, {
			title: 'Regar',
			kind: 'Intervalo',
			every: '2',
			unit: 'días',
			firstStep: 'Llenar la regadera',
			steps: ['Regar los helechos']
		});
		await createAndView(page, {
			title: 'Cambiar foco',
			kind: DOES_NOT_REPEAT,
			date: '',
			firstStep: 'Sacar la escalera',
			steps: ['Cambiar el foco']
		});
	});
	await stop(page, FRIDAY);

	// 1
	await done(page, 'Regar').click();
	await withClock(page, () => says(page, 'Regar', 'Regar los helechos'));
	await done(page, 'Regar').click();
	await withClock(page, async () => {
		await expect(notice(page)).toContainText('Completaste «Regar»');
		await expect(notice(page)).toContainText(/Vuelve /);
		await expect(notice(page)).not.toContainText('Paso');
		await expect(notice(page).getByRole('button', { name: 'Deshacer' })).toBeVisible();
		await waitStatus(page, 'Regar', 'en espera');
		await withoutLine(page, 'Regar');
	});

	// 2
	await notice(page).getByRole('button', { name: 'Deshacer' }).click();
	await settle(page);
	await withClock(page, async () => {
		await waitStatus(page, 'Regar', 'pendiente');
		await says(page, 'Regar', 'Regar los helechos');
		await withButtons(page, 'Regar', true);
	});

	// 3
	await previous(page, 'Regar').click();
	await withClock(page, () => says(page, 'Regar', 'Llenar la regadera', true));
	await done(page, 'Regar').click();
	await withClock(page, () => says(page, 'Regar', 'Regar los helechos'));
	await done(page, 'Regar').click();
	await withClock(page, () => expect(notice(page)).toContainText('Completaste «Regar»'));
	await page.clock.runFor(6000);
	await withClock(page, () => expect(notice(page)).toHaveCount(0));
	await goA(page, 'Historial');
	await withClock(page, () => historyDelete(page, 'Regar'));
	await goA(page, 'Pendientes');
	await withClock(page, async () => {
		await waitStatus(page, 'Regar', 'pendiente');
		await says(page, 'Regar', 'Regar los helechos');
	});

	// 4
	await done(page, 'Cambiar foco').click();
	await withClock(page, () => says(page, 'Cambiar foco', 'Cambiar el foco'));
	await done(page, 'Cambiar foco').click();
	await withClock(page, async () => {
		await expect(notice(page)).toContainText('Completaste «Cambiar foco»');
		await expect(f(page, 'Cambiar foco').getByRole('checkbox')).toBeChecked();
		await withoutLine(page, 'Cambiar foco');
	});
	await f(page, 'Cambiar foco').getByRole('checkbox').click();
	await settle(page);
	await withClock(page, async () => {
		await waitStatus(page, 'Cambiar foco', 'pendiente');
		await says(page, 'Cambiar foco', 'Cambiar el foco');
		await withButtons(page, 'Cambiar foco', true);
	});

	// 5
	await previous(page, 'Regar').click();
	await withClock(page, () => says(page, 'Regar', 'Llenar la regadera', true));
	await completeA(page, FRIDAY, 'Regar');
	await withClock(page, async () => {
		await expect(notice(page)).toContainText('Completaste «Regar»');
		await expect(notice(page)).toContainText(/Vuelve /);
		await expect(notice(page)).not.toContainText('Paso');
		await withoutLine(page, 'Regar');
	});
	await go(page, '2026-11-15T10:00:00');
	await withClock(page, async () => {
		await waitStatus(page, 'Regar', 'pendiente');
		await says(page, 'Regar', 'Llenar la regadera', true);
		await withButtons(page, 'Regar', false);
	});
	await done(page, 'Regar').click();
	await withClock(page, () => says(page, 'Regar', 'Regar los helechos'));
	await completeA(page, '2026-11-15T10:00:00', 'Regar');
	await withClock(page, () => withoutLine(page, 'Regar'));
	await go(page, '2026-11-17T10:00:00');
	await withClock(page, async () => {
		await waitStatus(page, 'Regar', 'pendiente');
		await says(page, 'Regar', 'Llenar la regadera', true);
		await withButtons(page, 'Regar', false);
	});

	// 6
	await done(page, 'Regar').click();
	await withClock(page, () => says(page, 'Regar', 'Regar los helechos'));
	await f(page, 'Regar').getByRole('checkbox').click();
	await withClock(page, () => expect(notice(page)).toContainText('Completaste «Regar»'));
	await notice(page).getByRole('button', { name: 'Deshacer' }).click();
	await settle(page);
	await withClock(page, async () => {
		await waitStatus(page, 'Regar', 'pendiente');
		await says(page, 'Regar', 'Regar los helechos');
		await withButtons(page, 'Regar', true);
	});
});

test('Flow 5: dónde se ve y cuándo desaparece y vuelve', async ({ page }) => {
	await session(page, FRIDAY, true);

	// 1
	await withClock(page, async () => {
		await createAndView(page, {
			title: 'Cambiar foco',
			kind: DOES_NOT_REPEAT,
			date: '',
			firstStep: 'Sacar la escalera',
			steps: ['Cambiar el foco']
		});
		await createAndView(page, {
			title: 'Pagar',
			kind: DOES_NOT_REPEAT,
			date: '2026-11-10',
			firstStep: 'Buscar la factura',
			steps: ['Pagar en el banco']
		});
		await createAndView(page, {
			title: 'Regar',
			kind: 'Intervalo',
			every: '8',
			unit: 'horas',
			firstStep: 'Llenar la regadera',
			steps: ['Regar los helechos']
		});
	});
	await stop(page, FRIDAY);
	await withClock(page, async () => {
		await waitStatus(page, 'Pagar', 'atrasada', undefined, false);
		await waitStatus(page, 'Cambiar foco', 'pendiente');
		await waitStatus(page, 'Regar', 'pendiente');
		for (const [t, p] of [
			['Pagar', 'Buscar la factura'],
			['Cambiar foco', 'Sacar la escalera'],
			['Regar', 'Llenar la regadera']
		]) {
			await says(page, t, p, true);
			await withButtons(page, t, false);
		}
	});

	// 2
	const order = await titles(page);
	await done(page, 'Pagar').click();
	await withClock(page, async () => {
		await says(page, 'Pagar', 'Pagar en el banco');
		await withButtons(page, 'Pagar', true);
		await waitStatus(page, 'Pagar', 'atrasada', undefined, false);
	});
	expect(await titles(page)).toEqual(order);

	// 9 (first, with the clock on Friday): the checkbox completes at step 1 and undo reverts it.
	await f(page, 'Cambiar foco').getByRole('checkbox').click();
	await withClock(page, async () => {
		await expect(notice(page)).toContainText('Completaste «Cambiar foco»');
		await withoutLine(page, 'Cambiar foco');
	});
	await notice(page).getByRole('button', { name: 'Deshacer' }).click();
	await settle(page);
	await withClock(page, async () => {
		await waitStatus(page, 'Cambiar foco', 'pendiente');
		await says(page, 'Cambiar foco', 'Sacar la escalera', true);
		await withButtons(page, 'Cambiar foco', false);
	});

	// 3 and 4: it is postponed and completed with the clock on Friday; then it advances.
	await postpone(page, 'Cambiar foco', '3 horas');
	await postpone(page, 'Pagar', 'Hasta mañana');
	await f(page, 'Regar').getByRole('checkbox').click();
	await withClock(page, async () => {
		await withoutLine(page, 'Cambiar foco');
		await withoutLine(page, 'Pagar');
		await expect(f(page, 'Regar').getByRole('checkbox')).toBeChecked();
		await withoutLine(page, 'Regar');
	});
	await go(page, '2026-11-13T13:01:00');
	await withClock(page, async () => {
		await says(page, 'Cambiar foco', 'Sacar la escalera', true);
		await withButtons(page, 'Cambiar foco', false);
		await withoutLine(page, 'Regar');
		await withoutLine(page, 'Pagar');
	});
	await go(page, '2026-11-13T17:59:00');
	await withClock(page, () => withoutLine(page, 'Regar'));
	await go(page, '2026-11-13T18:00:00');
	await withClock(page, async () => {
		await waitStatus(page, 'Regar', 'pendiente', undefined, false);
		await says(page, 'Regar', 'Llenar la regadera', true);
		await withButtons(page, 'Regar', false);
	});
	await go(page, '2026-11-15T07:00:00');
	await withClock(page, async () => {
		await waitStatus(page, 'Pagar', 'atrasada', undefined, false);
		await says(page, 'Pagar', 'Pagar en el banco');
		await withButtons(page, 'Pagar', true);
	});

	// 5
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
		await says(page, 'Regar', 'Llenar la regadera', true);
		await withButtons(page, 'Regar', false);
	});

	// 6: with the clock on Friday.
	await goBack(page, FRIDAY);
	await withClock(page, () =>
		createAndView(page, {
			title: 'Basura',
			kind: 'Días de la semana',
			days: ['martes'],
			firstStep: 'Atar la bolsa llena',
			steps: ['Bajar la basura']
		})
	);
	await withClock(page, () => withoutLine(page, 'Basura'));
	await go(page, '2026-11-17T09:00:00');
	await withClock(page, async () => {
		await waitStatus(page, 'Basura', 'pendiente', undefined, false);
		await says(page, 'Basura', 'Atar la bolsa llena', true);
		await withButtons(page, 'Basura', false);
	});

	// 7
	await withClock(page, () =>
		createAndView(page, {
			title: 'Llamar',
			kind: DOES_NOT_REPEAT,
			date: '',
			schedule: { from: '08:00', to: '09:00' },
			firstStep: 'Buscar el número',
			steps: ['Marcar']
		})
	);
	await withClock(page, () => withoutLine(page, 'Llamar'));
	await go(page, '2026-11-18T08:00:00');
	await withClock(page, async () => {
		await waitStatus(page, 'Llamar', 'pendiente', undefined, false);
		await says(page, 'Llamar', 'Buscar el número', true);
		await withButtons(page, 'Llamar', false);
	});

	// 8: disabled checkbox.
	await goBack(page, '2026-11-13T07:00:00');
	await withClock(page, () =>
		createAndView(page, {
			title: 'Lavar',
			kind: DOES_NOT_REPEAT,
			date: '2026-11-10',
			schedule: { from: '08:00', to: '11:00' },
			firstStep: P1,
			steps: [P2]
		})
	);
	const check = f(page, 'Lavar').getByRole('checkbox');
	await withClock(page, async () => {
		await expect(check).toBeDisabled();
		await expect(check).not.toBeChecked();
		await says(page, 'Lavar', P1, true);
		await expect(done(page, 'Lavar')).toBeEnabled();
	});
	await done(page, 'Lavar').click();
	await withClock(page, async () => {
		await says(page, 'Lavar', P2);
		await expect(done(page, 'Lavar')).toBeDisabled();
		await expect(previous(page, 'Lavar')).toBeEnabled();
	});
	await done(page, 'Lavar').click({ force: true });
	await withClock(page, async () => {
		await says(page, 'Lavar', P2);
		await expect(check).not.toBeChecked();
		await expect(notice(page)).toHaveCount(0);
	});
	await go(page, '2026-11-13T08:00:00');
	await withClock(page, async () => {
		await expect(check).toBeEnabled();
		await expect(done(page, 'Lavar')).toBeEnabled();
	});
});

test('Flow 6: editar los pasos y el avance', async ({ page }) => {
	await sessionWithClock(page, FRIDAY);
	await showPaused(page).click();
	await expect(showPaused(page)).toBeChecked();
	await create(page, { title: 'Lavar', kind: DOES_NOT_REPEAT, date: '', firstStep: P1, steps: [P2, P3] });
	await done(page, 'Lavar').click();
	await says(page, 'Lavar', P2);
	await done(page, 'Lavar').click();
	await says(page, 'Lavar', P3);

	// 1
	await writeStep(page, 'Lavar', 2, 'Cargar el lavarropas');
	await says(page, 'Lavar', P3);

	// 2
	await writeStep(page, 'Lavar', 3, '');
	await says(page, 'Lavar', 'Cargar el lavarropas');
	await withButtons(page, 'Lavar', true);
	await openRow(page, 'Lavar');
	await addStep(page, 3, 'Guardar la ropa');
	await save(page);
	await says(page, 'Lavar', 'Guardar la ropa');

	// 3
	await openRow(page, 'Lavar');
	await step(page, 3).fill('');
	await step(page, 2).fill('');
	await save(page);
	await says(page, 'Lavar', P1, true);
	await expect(done(page, 'Lavar')).toHaveCount(0);
	await expect(previous(page, 'Lavar')).toHaveCount(0);
	await openRow(page, 'Lavar');
	await addStep(page, 2, P2);
	await addStep(page, 3, P3);
	await save(page);
	await says(page, 'Lavar', P3);
	await withButtons(page, 'Lavar', true);

	// 4
	await done(page, 'Lavar').click();
	await expect(notice(page)).toContainText('Completaste «Lavar»');
	await notice(page).getByRole('button', { name: 'Deshacer' }).click();
	await expect(notice(page)).toHaveCount(0);
	await says(page, 'Lavar', P3);

	// 5
	const same = async () => {
		await panelHas(page, 'Lavar', P1, [P2, P3]);
	};
	await openRow(page, 'Lavar');
	await completePanel(page, { kind: 'Intervalo', every: '3', unit: 'días' });
	await save(page);
	await same();
	await says(page, 'Lavar', P3);
	await pause(page, 'Lavar');
	await expect(f(page, 'Lavar').getByText('Pausada')).toBeVisible();
	await same();
	await openRow(page, 'Lavar');
	await button(page, 'Reanudar').click();
	await expect(panel(page)).toHaveCount(0);
	await says(page, 'Lavar', P3);
	await openRow(page, 'Lavar');
	await completePanel(page, { kind: 'Días de la semana', days: ['martes'] });
	await save(page);
	await same();
	await openRow(page, 'Lavar');
	await completePanel(page, { kind: DOES_NOT_REPEAT, date: '' });
	await save(page);
	await same();
	await says(page, 'Lavar', P3);
	await postpone(page, 'Lavar', '3 horas');
	await same();
	await go(page, '2026-11-13T13:01:00');
	await says(page, 'Lavar', P3);

	// 6
	await page.reload();
	await says(page, 'Lavar', P3);
	await same();
	await openRow(page, 'Lavar');
	await expect(panel(page).getByRole('progressbar')).toHaveCount(0);
	await expect(panel(page).getByRole('spinbutton', { name: /paso/i })).toHaveCount(0);
	await expect(panel(page).getByRole('combobox', { name: /paso/i })).toHaveCount(0);
	await close(page);
	await expect(page.locator('body')).not.toContainText(/paso \d+ de \d+|paso actual/i);
	await expect(page.getByRole('progressbar')).toHaveCount(0);
});

test('Flow 7: lo que no cambia, lo que no lo muestra y Cambios sin guardar', async ({ page }) => {
	await sessionWithClock(page, FRIDAY);
	const texts = async (t: string[]) => Promise.all(t.map((x) => f(page, x).innerText()));

	// 1
	await create(page, { title: 'Barrer', kind: DOES_NOT_REPEAT, date: '' });
	await create(page, { title: 'Lavar', kind: DOES_NOT_REPEAT, date: '' });
	await create(page, { title: 'Planchar', kind: DOES_NOT_REPEAT, date: '' });
	const order = await titles(page);
	expect([...order].sort()).toEqual(['Barrer', 'Lavar', 'Planchar']);
	const before = await texts(['Barrer', 'Planchar']);

	// 2
	await openRow(page, 'Lavar');
	await first(page).fill(P1);
	await addStep(page, 2, P2);
	await addStep(page, 3, P3);
	await save(page);
	await done(page, 'Lavar').click();
	await says(page, 'Lavar', P2);
	expect(await titles(page)).toEqual(order);
	expect(await texts(['Barrer', 'Planchar'])).toEqual(before);
	await openRow(page, 'Barrer');
	await first(page).fill('Barrer abajo');
	await addStep(page, 2, 'Juntar');
	await save(page);
	await openRow(page, 'Lavar');
	await first(page).fill('');
	await step(page, 2).fill('');
	await step(page, 3).fill('');
	await save(page);
	await withoutLine(page, 'Lavar');
	expect(await titles(page)).toEqual(order);
	await openRow(page, 'Lavar');
	await first(page).fill(P1);
	await addStep(page, 2, P2);
	await addStep(page, 3, P3);
	await save(page);
	await says(page, 'Lavar', P2); // editing does not change the step it is on
	await previous(page, 'Lavar').click();
	await says(page, 'Lavar', P1, true);

	// Barrer and Lavar show their steps; emptying Barrer's does not touch Planchar.
	await says(page, 'Barrer', 'Barrer abajo', true);
	await says(page, 'Lavar', P1, true);
	await openRow(page, 'Barrer');
	await first(page).fill('');
	await step(page, 2).fill('');
	await save(page);
	await withoutLine(page, 'Barrer');
	expect(await texts(['Planchar'])).toEqual([before[1]]);

	// 3
	await openRow(page, 'Lavar');
	await chooseEmoji(page, '🧺', 'cesta');
	await save(page);
	await expect(f(page, '🧺 Lavar').getByRole('button', { name: '🧺 Lavar', exact: true })).toBeVisible();
	await says(page, '🧺 Lavar', P1, true);
	const b = (await f(page, '🧺 Lavar').getByRole('button', { name: '🧺 Lavar', exact: true }).boundingBox())!;
	expect((await line(page, '🧺 Lavar').boundingBox())!.y).toBeGreaterThanOrEqual(b.y + b.height - 2);
	await expect(f(page, '🧺 Lavar').getByRole('button', { name: '🧺 Lavar', exact: true })).not.toContainText(P1);

	// 4: Lavar on step 1 of 3.
	await done(page, '🧺 Lavar').click();
	await says(page, '🧺 Lavar', P2);
	await done(page, '🧺 Lavar').click();
	await says(page, '🧺 Lavar', P3);
	await done(page, '🧺 Lavar').click();
	await expect(notice(page)).toContainText('Completaste «🧺 Lavar»');
	await expect(notice(page)).not.toContainText(/Paso|Primer/);
	for (const p of [P1, P2, P3]) await expect(notice(page)).not.toContainText(p);
	await goA(page, 'Historial');
	await viewHistory(page, [['Hoy', [['🧺 Lavar', '\\d\\d:\\d\\d']]]]);
	await expect(page.locator('body')).not.toContainText(/Primer paso|Paso:/);
	for (const p of [P1, P2, P3]) await expect(page.locator('body')).not.toContainText(p);
	await goA(page, 'Pendientes');

	// 5 onward: Mostrar completadas on; Lavar with Primer paso and Paso 2 (Paso 3 is removed).
	await turnOnCompleted(page);
	await expect(f(page, '🧺 Lavar')).toBeVisible();
	const L = '🧺 Lavar';
	await openRow(page, L);
	await remove(page, 3).click();
	await save(page);
	await panelHas(page, L, P1, [P2]);
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
	await page.getByRole('navigation').getByRole('link', { name: 'Pendientes' }).waitFor();
	const rowText = await f(page, L).innerText();

	// 5
	await openRow(page, L);
	await step(page, 2).fill('Juntar las llaves');
	await asksNoticeAndDiscards();
	expect(await f(page, L).innerText()).toBe(rowText);
	await panelHas(page, L, P1, [P2]);

	// 6
	await openRow(page, L);
	await step(page, 2).fill('Juntar las llaves');
	await step(page, 2).fill(P2);
	await closesDirect();
	await openRow(page, L);
	await step(page, 2).fill(`   ${P2}   `);
	await closesDirect();

	// 7
	await openRow(page, L);
	await step(page, 2).fill('');
	await asksNoticeAndDiscards();
	await openRow(page, L);
	await step(page, 2).fill('   ');
	await asksNoticeAndDiscards();

	// 8
	await openRow(page, L);
	await button(page, 'Agregar paso').click();
	await closesDirect();
	await openRow(page, L);
	await addStep(page, 3, P3);
	await asksNoticeAndDiscards();
	await openRow(page, L);
	await addStep(page, 3, '   ');
	await closesDirect();

	// 9
	await openRow(page, L);
	await remove(page, 2).click();
	await asksNoticeAndDiscards();
	await openRow(page, L);
	await button(page, 'Agregar paso').click();
	await remove(page, 3).click();
	await closesDirect();
	await panelHas(page, L, P1, [P2]);

	// 10
	await button(page, '+').click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await button(page, 'Agregar paso').click();
	await closesDirect();
	await button(page, '+').click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await addStep(page, 2, P2);
	await asksNoticeAndDiscards();

	// 11: Lavar is unchecked to get its buttons; Hecho and Paso anterior open nothing.
	await f(page, L).getByRole('checkbox').click();
	await expect(done(page, L)).toBeVisible();
	// Decided by the row's line, which waits for it to render; a bare count() could run before Paso anterior shows.
	await expect(line(page, L)).toHaveCount(1);
	if (!(await line(page, L).innerText()).startsWith('Primer paso')) await previous(page, L).click();
	await says(page, L, P1, true);
	await done(page, L).click();
	await says(page, L, P2);
	await previous(page, L).click();
	await says(page, L, P1, true);
	await expect(panel(page)).toHaveCount(0);
	await expect(unsavedChangesNotice(page)).toHaveCount(0);
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
});

async function devices(browser: Browser) {
	const d = await twoDevices(browser, FRIDAY);
	for (const p of [d.a, d.b]) {
		await turnOnCompleted(p);
		await showPaused(p).click();
		await expect(showPaused(p)).toBeChecked();
	}
	return d;
}

test('Flow 8: dos dispositivos', async ({ browser }) => {
	test.setTimeout(300_000);
	const { a, b, ctxB, close: end } = await devices(browser);
	const both = [a, b];
	const sync = async () => {
		await arrivesOnServer(a);
		await ctxB.setOffline(false);
		await a.waitForTimeout(10_000); // B reconnects and its pending writes arrive; both screens update by themselves
	};
	/** The panel shows those values in `p` (with retries while the sync arrives). */
	const panelIs = (p: Page, isFirst: string, steps: string[]) =>
		expect(async () => {
			await openRow(p, 'Lavar');
			await expect(first(p)).toHaveValue(isFirst, { timeout: 1000 });
			expect(await stepsValues(p)).toEqual(steps);
			await close(p);
		}).toPass({ timeout: 60_000 });

	// 1
	await create(a, { title: 'Lavar', kind: DOES_NOT_REPEAT, date: '', firstStep: P1, steps: [P2, P3] });
	await expect(f(b, 'Lavar')).toBeVisible();
	for (const p of both) await says(p, 'Lavar', P1, true);

	// 2
	await ctxB.setOffline(true);
	await done(b, 'Lavar').click();
	await done(a, 'Lavar').click();
	await sync();
	for (const p of both) await says(p, 'Lavar', P2);

	// 3
	await ctxB.setOffline(true);
	await done(b, 'Lavar').click();
	await says(b, 'Lavar', P3);
	await writeStep(a, 'Lavar', 2, 'Juntar las llaves');
	await sync();
	for (const p of both) {
		await says(p, 'Lavar', P3);
		await panelIs(p, P1, ['Juntar las llaves', P3]);
	}

	// 4
	await ctxB.setOffline(true);
	await writeStep(b, 'Lavar', 2, 'Buscar el detergente');
	await previous(a, 'Lavar').click();
	await sync();
	for (const p of both) {
		await says(p, 'Lavar', 'Buscar el detergente');
		await panelIs(p, P1, ['Buscar el detergente', P3]);
	}

	// 5
	await ctxB.setOffline(true);
	await writeStep(b, 'Lavar', 2, 'Buscar la esponja');
	await writeStep(a, 'Lavar', 2, 'Poner el agua a calentar');
	await sync();
	for (const p of both) await says(p, 'Lavar', 'Buscar la esponja');

	// 6
	await ctxB.setOffline(true);
	await writeStep(b, 'Lavar', 2, 'Barrer abajo');
	await writeStep(a, 'Lavar', 3, 'Guardar la ropa');
	await sync();
	for (const p of both) await panelIs(p, P1, ['Barrer abajo', P3]);

	// 7
	await ctxB.setOffline(true);
	await writeFirst(b, 'Lavar', 'Juntar las llaves');
	await writeStep(a, 'Lavar', 2, 'Tender la ropa');
	await sync();
	for (const p of both) await panelIs(p, 'Juntar las llaves', ['Tender la ropa', P3]);

	// 8
	await ctxB.setOffline(true);
	await writeStep(b, 'Lavar', 2, 'Barrer abajo');
	await openRow(a, 'Lavar');
	await save(a);
	await sync();
	for (const p of both) await panelIs(p, 'Juntar las llaves', ['Barrer abajo', P3]);

	await end();
});
