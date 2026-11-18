import { expect, test, type Browser, type Page } from '@playwright/test';
import {
	openTask,
	addSchedule,
	fieldFrom,
	fieldTo,
	complete,
	create,
	twoDevices,
	chooseEmoji,
	turnOnCompleted,
	enterAsSecondDevice,
	setClock,
	row,
	goA,
	cleanEmulators,
	arrivesOnServer,
	selectorEmoji,
	sessionWithClock
} from './support';

// qa/cambios-sin-guardar.md: avisos de cierre y de acción, botón Atrás, recarga y dos dispositivos.
test.use({ viewport: { width: 360, height: 640 }, hasTouch: true });

test.beforeEach(async () => {
	await cleanEmulators();
});

const TODAY = '2026-07-15T08:00:00';
const MESSAGE = 'Tenés cambios sin guardar';

const notice = (page: Page) => page.getByRole('alertdialog', { name: MESSAGE });
const noticeButtons = (page: Page) => notice(page).getByRole('button');
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const tap = (page: Page, name: string) => button(page, name).click();
const tapInNotice = (page: Page, name: string) => notice(page).getByRole('button', { name, exact: true }).click();
const title = (page: Page) => page.getByLabel('Título');
const note = (page: Page) => page.getByLabel('Nota');
const tabNamed = (page: Page, name: string) => page.getByRole('tab', { name: new RegExp(`^${name}`) });
const panelClosed = (page: Page) => expect(page.getByRole('dialog')).toHaveCount(0);
const panelOpen = (page: Page) => expect(page.getByRole('dialog').first()).toBeVisible();
const withoutNotice = (page: Page) => expect(notice(page)).toHaveCount(0);
const showPaused = (page: Page) => page.getByRole('checkbox', { name: 'Pausadas' });
const every = (page: Page) => page.getByRole('spinbutton', { name: 'Cada' });
const width = (page: Page) => page.setViewportSize({ width: 1024, height: 768 });

/** En el celular abre la pestaña; en ancho no hace nada. */
async function goATab(page: Page, name: 'Tarea' | 'Cuándo' | 'Acciones') {
	const tab = tabNamed(page, name);
	if ((await tab.count()) > 0) await tab.click();
}

async function tabOpen(page: Page, name: string) {
	await expect(tabNamed(page, name)).toHaveAttribute('aria-selected', 'true');
}

const WATER = { title: 'Regar', kind: 'Intervalo', every: '2', unit: 'días', note: 'Las del balcón' } as const;

async function createWater(page: Page, extra = {}) {
	await create(page, { ...WATER, ...extra });
	await expect(row(page, 'Regar')).toBeVisible();
}

/** Cerrar con la X y ver el aviso de cierre con sus tres botones. */
async function closeAndViewNotice(page: Page) {
	await tap(page, 'Cerrar');
	await expect(notice(page)).toBeVisible();
	await expect(noticeButtons(page)).toHaveText(['Seguir editando', 'Descartar', 'Guardar']);
}

/** Cerrar cierra directo, sin aviso. */
async function closesDirect(page: Page) {
	await tap(page, 'Cerrar');
	await panelClosed(page);
	await withoutNotice(page);
}

/** Cerrar pide confirmación; se descarta. */
async function asksConfirmation(page: Page) {
	await closeAndViewNotice(page);
	await tapInNotice(page, 'Descartar');
	await panelClosed(page);
	await withoutNotice(page);
}

async function viewNoticeOfAction(page: Page, action: string) {
	await expect(notice(page)).toBeVisible();
	await expect(noticeButtons(page)).toHaveText(['Seguir editando', `Descartar y ${action}`, `Guardar y ${action}`]);
}

// ---------------------------------------------------------------------------------------------

test('Flujo 1: cerrar con cambios al editar', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	await createWater(page);

	// 1
	await openTask(page, 'Regar');
	await closesDirect(page);

	// 2
	await openTask(page, 'Regar');
	await title(page).fill('Regar plantas');
	await closeAndViewNotice(page);
	await expect(page.getByRole('dialog', { name: 'Editar tarea' })).toBeVisible();

	// 3
	await tapInNotice(page, 'Seguir editando');
	await withoutNotice(page);
	await panelOpen(page);
	await tabOpen(page, 'Tarea');
	await expect(title(page)).toHaveValue('Regar plantas');
	await expect(row(page, 'Regar plantas')).toHaveCount(0);
	await expect(row(page, 'Regar')).toBeVisible();

	// 4
	await goATab(page, 'Cuándo');
	await tap(page, 'Cerrar');
	await tapInNotice(page, 'Seguir editando');
	await tabOpen(page, 'Cuándo');

	// 5
	await tap(page, 'Cerrar');
	await tapInNotice(page, 'Descartar');
	await panelClosed(page);
	await expect(row(page, 'Regar')).toBeVisible();
	await expect(row(page, 'Regar plantas')).toHaveCount(0);
	await openTask(page, 'Regar');
	await expect(title(page)).toHaveValue('Regar');

	// 6
	await title(page).fill('Regar plantas');
	await tap(page, 'Cerrar');
	await tapInNotice(page, 'Guardar');
	await panelClosed(page);
	await expect(row(page, 'Regar plantas')).toBeVisible();
	await page.reload();
	await expect(row(page, 'Regar plantas')).toBeVisible();

	// 7
	await openTask(page, 'Regar plantas');
	await title(page).fill('');
	await tap(page, 'Cerrar');
	await expect(notice(page)).toBeVisible();
	await tapInNotice(page, 'Guardar');
	await withoutNotice(page);
	await panelOpen(page);
	await expect(title(page)).toHaveValue('');
	await tabOpen(page, 'Tarea');
	await expect(page.getByText('Escribí un título.')).toBeVisible();
	await expect(row(page, 'Regar plantas')).toBeVisible();
	await tap(page, 'Cerrar');
	await tapInNotice(page, 'Descartar');
	await panelClosed(page);

	// 8
	await width(page);
	await openTask(page, 'Regar plantas');
	await title(page).fill('Regar flores');
	await closeAndViewNotice(page);
	await tapInNotice(page, 'Seguir editando');
	await panelOpen(page);
	await expect(title(page)).toHaveValue('Regar flores');
	await tap(page, 'Cerrar');
	await tapInNotice(page, 'Descartar');
	await panelClosed(page);
	await expect(row(page, 'Regar plantas')).toBeVisible();
});

test('Flujo 2: qué cuenta como cambio', async ({ page, browser }) => {
	await sessionWithClock(page, TODAY);
	await create(page, { title: 'Otra', kind: 'No se repite' });
	await createWater(page, { schedules: [{ from: '08:00', to: '10:00' }, { from: '12:00', to: '14:00' }] });
	const openWater = () => openTask(page, 'Regar');

	// 1
	await openWater();
	await title(page).fill('Regar' + 'Z');
	await title(page).fill('Regar');
	await closesDirect(page);

	// 2
	await openWater();
	await title(page).fill('Regar   ');
	await closesDirect(page);
	await openWater();
	await title(page).fill('  Regar  ');
	await note(page).fill('  Las del balcón  ');
	await closesDirect(page);

	// 3
	await openWater();
	await title(page).fill('Regar plantas');
	await asksConfirmation(page);

	// 4
	await openWater();
	await note(page).fill('');
	await asksConfirmation(page);
	await openWater();
	await note(page).fill('   ');
	await asksConfirmation(page);

	// 5
	await openWater();
	await title(page).fill('');
	await asksConfirmation(page);

	// 6
	await openWater();
	await goATab(page, 'Cuándo');
	await page.getByRole('radio', { name: 'Días de la semana' }).check();
	await page.getByRole('radio', { name: 'Intervalo' }).check();
	await every(page).fill('2');
	await page.getByLabel('Unidad').selectOption({ label: 'días' });
	await closesDirect(page);
	await openWater();
	await goATab(page, 'Cuándo');
	await page.getByRole('radio', { name: 'Días de la semana' }).check();
	await asksConfirmation(page);

	// 7
	await openWater();
	await goATab(page, 'Cuándo');
	await fieldFrom(page, 0).fill('12:00');
	await fieldTo(page, 0).fill('14:00');
	await fieldFrom(page, 1).fill('08:00');
	await fieldTo(page, 1).fill('10:00');
	await closesDirect(page);
	await openWater();
	await goATab(page, 'Cuándo');
	await fieldTo(page, 0).fill('15:00');
	await asksConfirmation(page);

	// 8
	await openWater();
	await goATab(page, 'Cuándo');
	await addSchedule(page).click();
	await asksConfirmation(page);

	// 9
	await openWater();
	await chooseEmoji(page, '🌱');
	await asksConfirmation(page);
	await openWater();
	await chooseEmoji(page, '🌱');
	await tap(page, 'Quitar emoji');
	await closesDirect(page);

	// 10
	await create(page, { title: 'Pagar', kind: 'No se repite' });
	await expect(row(page, 'Pagar')).toBeVisible();
	await openTask(page, 'Pagar');
	await changeTitleInB(browser, 'Pagar', 'Pagar luz');
	await expect(page.getByLabel('Título')).toHaveValue('Pagar');
	await closesDirect(page);
	await expect(row(page, 'Pagar luz')).toBeVisible();
});

/** El dispositivo B (misma cuenta) cambia el título de una tarea por la UI. */
async function changeTitleInB(browser: Browser, setOf: string, a: string) {
	const ctx = await browser.newContext({
		baseURL: 'http://127.0.0.1:4173',
		locale: 'es-AR',
		timezoneId: 'America/Argentina/Buenos_Aires',
		viewport: { width: 360, height: 640 },
		hasTouch: true
	});
	const b = await ctx.newPage();
	await enterAsSecondDevice(b);
	await setClock(b, TODAY);
	await openTask(b, setOf);
	await title(b).fill(a);
	await tap(b, 'Guardar');
	await panelClosed(b);
	await arrivesOnServer(b);
	await ctx.close();
}

test('Flujo 3: crear con cambios sin guardar', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	const fresh = () => tap(page, '+');

	// 1
	await fresh();
	await goATab(page, 'Cuándo');
	await expect(page.getByRole('radio', { name: 'No se repite' })).toBeChecked();
	await closesDirect(page);

	// 2
	await fresh();
	await title(page).fill('   ');
	await closesDirect(page);

	// 3
	await fresh();
	await title(page).fill('Pagar');
	await closeAndViewNotice(page);
	await tapInNotice(page, 'Seguir editando');
	await panelOpen(page);
	await expect(title(page)).toHaveValue('Pagar');
	await tap(page, 'Cerrar');
	await tapInNotice(page, 'Descartar');
	await panelClosed(page);
	await expect(page.getByRole('listitem')).toHaveCount(0);

	// 4
	await fresh();
	await goATab(page, 'Cuándo');
	await page.getByRole('radio', { name: 'Intervalo' }).check();
	await asksConfirmation(page);
	await fresh();
	await goATab(page, 'Cuándo');
	await page.getByRole('radio', { name: 'Intervalo' }).check();
	await page.getByRole('radio', { name: 'No se repite' }).check();
	await closesDirect(page);

	// 5
	await fresh();
	await title(page).fill('Pagar');
	await title(page).fill('');
	await closesDirect(page);

	// 6
	await fresh();
	await title(page).fill('Pagar');
	await tap(page, 'Cerrar');
	await tapInNotice(page, 'Guardar');
	await panelClosed(page);
	await expect(row(page, 'Pagar')).toBeVisible();
});

test('Flujo 4: acciones con cambios', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	await createWater(page);
	const inActions = async () => {
		await goATab(page, 'Acciones');
		await tabOpenWhetherHas(page, 'Acciones');
	};
	await showPaused(page).click();
	await expect(showPaused(page)).toBeChecked();

	// 1
	await openTask(page, 'Regar');
	await inActions();
	await tap(page, 'Pausar');
	await panelClosed(page);
	await withoutNotice(page);
	await expect(row(page, 'Regar').getByText('Pausada')).toBeVisible();
	await showPaused(page).click();
	await expect(row(page, 'Regar')).toHaveCount(0);
	await showPaused(page).click();
	await openTask(page, 'Regar');
	await inActions();
	await tap(page, 'Reanudar');
	await panelClosed(page);
	await withoutNotice(page);
	await expect(row(page, 'Regar').getByText('Pausada')).toHaveCount(0);

	// 2
	await openTask(page, 'Regar');
	await title(page).fill('Regar plantas');
	await inActions();
	await tap(page, 'Pausar');
	await viewNoticeOfAction(page, 'pausar');
	await tabOpenWhetherHas(page, 'Acciones');

	// 3
	await tapInNotice(page, 'Seguir editando');
	await withoutNotice(page);
	await tabOpenWhetherHas(page, 'Acciones');
	await goATab(page, 'Tarea');
	await expect(title(page)).toHaveValue('Regar plantas');
	await expect(row(page, 'Regar').getByText('Pausada')).toHaveCount(0);

	// 4
	await inActions();
	await tap(page, 'Pausar');
	await tapInNotice(page, 'Descartar y pausar');
	await panelClosed(page);
	await expect(row(page, 'Regar').getByText('Pausada')).toBeVisible();
	await expect(row(page, 'Regar plantas')).toHaveCount(0);
	await openTask(page, 'Regar');
	await inActions();
	await tap(page, 'Reanudar');
	await panelClosed(page);

	// 5
	await openTask(page, 'Regar');
	await title(page).fill('Regar plantas');
	await inActions();
	await tap(page, 'Pausar');
	await tapInNotice(page, 'Guardar y pausar');
	await panelClosed(page);
	await expect(row(page, 'Regar plantas').getByText('Pausada')).toBeVisible();

	// 6
	await openTask(page, 'Regar plantas');
	await note(page).fill('Las del patio');
	await inActions();
	await tap(page, 'Reanudar');
	await viewNoticeOfAction(page, 'reanudar');
	await tapInNotice(page, 'Guardar y reanudar');
	await panelClosed(page);
	await expect(row(page, 'Regar plantas').getByText('Pausada')).toHaveCount(0);
	await openTask(page, 'Regar plantas');
	await expect(note(page)).toHaveValue('Las del patio');

	// 7
	await note(page).fill('Otra nota');
	await inActions();
	for (const [option, text] of [
		['1 hora', 'posponer 1 hora'],
		['3 horas', 'posponer 3 horas'],
		['Hasta mañana', 'posponer hasta mañana']
	] as const) {
		await tap(page, option);
		await viewNoticeOfAction(page, text);
		await tapInNotice(page, 'Seguir editando');
		await withoutNotice(page);
	}
	await tap(page, 'Cerrar');
	await tapInNotice(page, 'Descartar');
	await panelClosed(page);

	// 8
	await openTask(page, 'Regar plantas');
	await note(page).fill('Con hora');
	await inActions();
	await tap(page, '1 hora');
	await viewNoticeOfAction(page, 'posponer 1 hora');
	await page.clock.runFor(3 * 60 * 1000);
	await tapInNotice(page, 'Guardar y posponer 1 hora');
	await panelClosed(page);
	await openTask(page, 'Regar plantas');
	await expect(page.getByText('Pospuesta hasta 09:03')).toBeVisible();

	// 9
	await note(page).fill('Cambiada');
	await inActions();
	await tap(page, 'Quitar posponer');
	await viewNoticeOfAction(page, 'quitar posponer');
	await tapInNotice(page, 'Descartar y quitar posponer');
	await panelClosed(page);
	await openTask(page, 'Regar plantas');
	await expect(page.getByText(/Pospuesta hasta/)).toHaveCount(0);
	await tap(page, 'Cerrar');
	await panelClosed(page);

	// 8 (segunda parte): otra tarea con Descartar y posponer 3 horas a las 08:03
	await create(page, { title: 'Pagar', kind: 'No se repite' });
	await openTask(page, 'Pagar');
	await note(page).fill('algo');
	await inActions();
	await tap(page, '3 horas');
	await tapInNotice(page, 'Descartar y posponer 3 horas');
	await panelClosed(page);
	await openTask(page, 'Pagar');
	await expect(page.getByText('Pospuesta hasta 11:03')).toBeVisible();
	await tap(page, 'Cerrar');
	await panelClosed(page);

	// 10
	await openTask(page, 'Regar plantas');
	await goATab(page, 'Cuándo');
	await page.getByRole('radio', { name: 'No se repite' }).check();
	await inActions();
	await tap(page, 'Pausar');
	await expect(notice(page)).toBeVisible();
	await expect(notice(page).getByText('Con estos cambios la tarea ya no se puede pausar')).toBeVisible();
	await expect(noticeButtons(page)).toHaveText(['Seguir editando', 'Descartar y pausar']);
	await tapInNotice(page, 'Descartar y pausar');
	await panelClosed(page);
	await expect(row(page, 'Regar plantas').getByText('Pausada')).toBeVisible();

	// 11
	await openTask(page, 'Regar plantas');
	await goATab(page, 'Cuándo');
	await page.getByRole('radio', { name: 'No se repite' }).check();
	await inActions();
	await tap(page, 'Reanudar');
	await expect(notice(page).getByText('Con estos cambios la tarea ya no se puede reanudar')).toBeVisible();
	await expect(button(page, 'Guardar y reanudar')).toHaveCount(0);
	await tapInNotice(page, 'Seguir editando');
	await tap(page, 'Cerrar');
	await tapInNotice(page, 'Descartar');
	await panelClosed(page);
	await openTask(page, 'Regar plantas');
	await inActions();
	await tap(page, 'Reanudar');
	await panelClosed(page);

	// 12
	await openTask(page, 'Regar plantas');
	await title(page).fill('');
	await inActions();
	await tap(page, 'Pausar');
	await viewNoticeOfAction(page, 'pausar');
	await tapInNotice(page, 'Guardar y pausar');
	await withoutNotice(page);
	await panelOpen(page);
	await expect(title(page)).toHaveValue('');
	await tabOpenWhetherHas(page, 'Tarea');
	await expect(page.getByText('Escribí un título.')).toBeVisible();
	await expect(row(page, 'Regar plantas').getByText('Pausada')).toHaveCount(0);
	await tap(page, 'Cerrar');
	await tapInNotice(page, 'Descartar');
	await panelClosed(page);

	// 13
	await openTask(page, 'Regar plantas');
	await note(page).fill('Cambio');
	await inActions();
	await tap(page, 'Borrar tarea');
	await expect(notice(page)).toHaveCount(0);
	const deleted = page.getByRole('alertdialog');
	await expect(deleted.getByRole('button', { name: 'Borrar', exact: true })).toBeVisible();
	await expect(deleted.getByRole('button', { name: 'Cancelar' })).toBeVisible();
	await deleted.getByRole('button', { name: 'Cancelar' }).click();
	await panelOpen(page);
	await tabOpenWhetherHas(page, 'Acciones');
	await goATab(page, 'Tarea');
	await expect(note(page)).toHaveValue('Cambio');
});

/** En el celular la pestaña `nombre` está abierta; en ancho no hay pestañas. */
async function tabOpenWhetherHas(page: Page, name: string) {
	if ((await tabNamed(page, name).count()) > 0) await tabOpen(page, name);
}

test('Flujo 5: los avisos sobre el panel', async ({ page, context }) => {
	await sessionWithClock(page, TODAY);
	await createWater(page);

	// 1
	await openTask(page, 'Regar');
	await goATab(page, 'Cuándo');
	await every(page).fill('3');
	await tap(page, 'Cerrar');
	await expect(notice(page)).toBeVisible();
	await tabNamed(page, 'Tarea').click({ force: true });
	await expect(notice(page)).toBeVisible();
	await tabOpen(page, 'Cuándo');

	// 2
	await tapInNotice(page, 'Seguir editando');
	await tabOpen(page, 'Cuándo');
	await expect(every(page)).toHaveValue('3');

	// 3
	await goATab(page, 'Acciones');
	await tap(page, 'Pausar');
	await viewNoticeOfAction(page, 'pausar');
	await tapInNotice(page, 'Seguir editando');
	await tabOpen(page, 'Acciones');
	await goATab(page, 'Cuándo');
	await expect(every(page)).toHaveValue('3');

	// 4
	await width(page);
	await tap(page, 'Cerrar');
	const box = await notice(page).boundingBox();
	const heading = await page.getByRole('dialog').first().locator('header').boundingBox();
	expect(box).not.toBeNull();
	expect(heading).not.toBeNull();
	await expect(notice(page)).toBeVisible();
	const covers = await page.evaluate(() => {
		const a = document.querySelector('[role=alertdialog]')!.getBoundingClientRect();
		return { width: a.width >= window.innerWidth - 1, height: a.height >= window.innerHeight - 1 };
	});
	expect(covers.width).toBe(true);
	await tapInNotice(page, 'Seguir editando');
	await expect(every(page)).toHaveValue('3');
	await width(page).then(() => page.setViewportSize({ width: 360, height: 640 }));

	// 5
	await context.setOffline(true);
	await tap(page, 'Cerrar');
	await expect(notice(page)).toBeVisible();
	await expect(page.getByText('Sin conexión').first()).toBeVisible();
	await context.setOffline(false);
	await tapInNotice(page, 'Descartar');
	await panelClosed(page);
});

test('Flujo 6: botón Atrás', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	await createWater(page);
	await complete(page, 'Regar');
	await page.clock.runFor(5000);
	await turnOnCompleted(page);
	const back = async () => {
		await page.goBack();
		await page.clock.runFor(100);
	};
	const inPending = () => expect(page.getByRole('heading', { name: 'Pendientes', level: 1 })).toBeVisible();
	await goA(page, 'Historial');
	await goA(page, 'Pendientes');
	await expect(row(page, 'Regar')).toBeVisible();

	// 1
	await openTask(page, 'Regar');
	await back();
	await panelClosed(page);
	await inPending();

	// 2
	await goA(page, 'Historial');
	await page.getByRole('button', { name: 'Regar' }).first().click();
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await back();
	await panelClosed(page);
	await expect(page.getByRole('heading', { name: 'Historial', level: 1 })).toBeVisible();
	await goA(page, 'Pendientes');

	// 3
	await openTask(page, 'Regar');
	await title(page).fill('Regar plantas');
	await back();
	await expect(notice(page)).toBeVisible();
	await panelOpen(page);
	await back();
	await withoutNotice(page);
	await panelOpen(page);
	await expect(title(page)).toHaveValue('Regar plantas');
	await back();
	await expect(notice(page)).toBeVisible();
	await tapInNotice(page, 'Descartar');
	await panelClosed(page);

	// 4
	await openTask(page, 'Regar');
	await goATab(page, 'Acciones');
	await tap(page, 'Borrar tarea');
	await expect(page.getByRole('alertdialog').getByRole('button', { name: 'Borrar', exact: true })).toBeVisible();
	await back();
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
	await panelOpen(page);
	await tabOpenWhetherHas(page, 'Acciones');
	await back();
	await panelClosed(page);

	// 5
	await openTask(page, 'Regar');
	await goATab(page, 'Tarea');
	await page.getByRole('button', { name: /^(Elegir|Cambiar) emoji/ }).click();
	await expect(selectorEmoji(page)).toBeVisible();
	await back();
	await expect(selectorEmoji(page)).toHaveCount(0);
	await panelOpen(page);
	await expect(page.getByRole('button', { name: 'Elegir emoji' })).toBeVisible();
	await back();
	await panelClosed(page);

	// 6
	await openTask(page, 'Regar');
	await title(page).fill('Regar plantas');
	await goATab(page, 'Acciones');
	await tap(page, 'Pausar');
	await viewNoticeOfAction(page, 'pausar');
	await back();
	await withoutNotice(page);
	await panelOpen(page);
	await goATab(page, 'Tarea');
	await expect(title(page)).toHaveValue('Regar plantas');
	await expect(row(page, 'Regar').getByText('Pausada')).toHaveCount(0);
	await back();
	await expect(notice(page)).toBeVisible();
	await tapInNotice(page, 'Seguir editando');
	await tap(page, 'Cerrar');
	await tapInNotice(page, 'Descartar');
	await panelClosed(page);

	// 7
	await create(page, { title: 'Pagar', kind: 'No se repite' });
	await complete(page, 'Pagar');
	const undo = page.getByRole('status').filter({ hasText: 'Completaste' });
	await expect(undo).toBeVisible();
	await openTask(page, 'Regar');
	await back();
	await panelClosed(page);
	await inPending();
	await expect(undo).toBeVisible();
	await page.clock.runFor(2000);
	await expect(undo).toBeVisible();
	await page.clock.runFor(4000);
	await expect(undo).toHaveCount(0);

	// 8
	await openTask(page, 'Regar');
	await title(page).click();
	await page.setViewportSize({ width: 360, height: 300 });
	await expect(button(page, 'Guardar')).toBeHidden();
	await back();
	await expect(title(page)).not.toBeFocused();
	await panelOpen(page);
	await page.setViewportSize({ width: 360, height: 640 });
	await back();
	await panelClosed(page);
	await openTask(page, 'Regar');
	await title(page).fill('Regar plantas');
	await page.setViewportSize({ width: 360, height: 300 });
	await expect(button(page, 'Guardar')).toBeHidden();
	await back();
	await expect(title(page)).not.toBeFocused();
	await expect(notice(page)).toHaveCount(0);
	await page.setViewportSize({ width: 360, height: 640 });
	await back();
	await expect(notice(page)).toBeVisible();
	await tapInNotice(page, 'Descartar');
	await panelClosed(page);

	// 9
	await goA(page, 'Historial');
	await goA(page, 'Pendientes');
	await create(page, { title: 'Otra', kind: 'No se repite' });
	await goA(page, 'Historial');
	await goA(page, 'Pendientes');
	for (const as of ['X', 'Guardar', 'Acción'] as const) {
		await openTask(page, 'Otra');
		if (as === 'X') await tap(page, 'Cerrar');
		else if (as === 'Guardar') await tap(page, 'Guardar');
		else {
			await goATab(page, 'Acciones');
			await tap(page, '1 hora');
		}
		await panelClosed(page);
		await page.goBack();
		await page.clock.runFor(100);
		await expect(page.getByRole('heading', { name: 'Historial', level: 1 })).toBeVisible();
		await page.goForward();
		await page.clock.runFor(100);
		await panelClosed(page);
		await expect(page.getByRole('heading', { name: 'Pendientes', level: 1 })).toBeVisible();
		if (as === 'Acción') break;
	}

	// 11
	await openTask(page, 'Pagar');
	await title(page).fill('Pagar luz');
	const dialogs: string[] = [];
	page.on('dialog', (d) => {
		dialogs.push(d.type());
		void d.dismiss();
	});
	await back();
	await expect(notice(page)).toBeVisible();
	expect(dialogs).toEqual([]);
});

test('Flujo 6 paso 10: Atrás en ancho', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	await width(page);
	await createWater(page);
	await complete(page, 'Regar');
	await page.clock.runFor(5000);
	await turnOnCompleted(page);
	const back = async () => {
		await page.goBack();
		await page.clock.runFor(100);
	};
	await goA(page, 'Historial');
	await goA(page, 'Pendientes');
	await openTask(page, 'Regar');
	await back();
	await panelClosed(page);
	await expect(page.getByRole('heading', { name: 'Pendientes', level: 1 })).toBeVisible();

	await openTask(page, 'Regar');
	await title(page).fill('Regar plantas');
	await back();
	await expect(notice(page)).toBeVisible();
	await back();
	await withoutNotice(page);
	await panelOpen(page);
	await back();
	await tapInNotice(page, 'Descartar');
	await panelClosed(page);

	await openTask(page, 'Regar');
	await tap(page, 'Borrar tarea');
	await back();
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
	await panelOpen(page);
	await back();
	await panelClosed(page);
});

test('Flujo 7: recargar o cerrar la app', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	await createWater(page);

	const confirmations: string[] = [];
	let accept = true;
	page.on('dialog', (d) => {
		confirmations.push(d.type());
		void (accept ? d.accept() : d.dismiss());
	});
	const reloadWithout = async () => {
		confirmations.length = 0;
		await page.reload();
		expect(confirmations).toEqual([]);
		await expect(page.getByRole('heading', { name: 'Pendientes', level: 1 })).toBeVisible();
	};
	/** Recarga aceptando la confirmación y comprueba que apareció. */
	const reloadWith = async () => {
		confirmations.length = 0;
		accept = true;
		await page.reload();
		expect(confirmations).toEqual(['beforeunload']);
		await expect(page.getByRole('heading', { name: 'Pendientes', level: 1 })).toBeVisible();
	};
	const tapPage = () => page.mouse.click(5, 5);

	// 1
	await openTask(page, 'Regar');
	await title(page).fill('Regar plantas');
	await tapPage();
	confirmations.length = 0;
	accept = false;
	void page.reload().catch(() => {});
	await expect.poll(() => confirmations).toEqual(['beforeunload']);
	await panelOpen(page);
	await expect(title(page)).toHaveValue('Regar plantas');
	await reloadWith();
	await panelClosed(page);
	await expect(row(page, 'Regar')).toBeVisible();
	await expect(row(page, 'Regar plantas')).toHaveCount(0);

	// 2
	await openTask(page, 'Regar');
	await reloadWithout();

	// 4
	await openTask(page, 'Regar');
	await title(page).fill('Regar plantas');
	await goATab(page, 'Acciones');
	await tap(page, 'Pausar');
	await expect(notice(page)).toBeVisible();
	await reloadWith();

	// 5
	await openTask(page, 'Regar');
	await title(page).fill('Regar plantas');
	await tap(page, 'Cerrar');
	await tapInNotice(page, 'Descartar');
	await panelClosed(page);
	await reloadWithout();

	// 6
	await tap(page, '+');
	await reloadWithout();
	await tap(page, '+');
	await title(page).fill('Pagar');
	await reloadWith();

	// 7
	await openTask(page, 'Regar');
	await title(page).fill('Regar plantas');
	confirmations.length = 0;
	await page.goBack();
	await page.clock.runFor(100);
	await expect(notice(page)).toBeVisible();
	expect(confirmations).toEqual([]);
	await tapInNotice(page, 'Descartar');
	await panelClosed(page);

	// 3 (cierra la página)
	await openTask(page, 'Regar');
	await title(page).fill('Regar plantas');
	await tap(page, 'Cerrar');
	await expect(notice(page)).toBeVisible();
	confirmations.length = 0;
	await tapPage();
	const closing = page.close({ runBeforeUnload: true });
	await expect.poll(() => confirmations).toEqual(['beforeunload']);
	await closing;
});

test('Flujo 8: dos dispositivos con el panel abierto', async ({ browser }) => {
	test.setTimeout(240_000);
	const { a, b, close: end } = await twoDevices(browser, TODAY);
	try {
		await a.setViewportSize({ width: 360, height: 640 });
		await createWater(a);
		await expect(row(b, 'Regar')).toBeVisible();
		const renameInB = async (setOf: string, a2: string) => {
			await openTask(b, setOf);
			await title(b).fill(a2);
			await tap(b, 'Guardar');
			await panelClosed(b);
			await arrivesOnServer(b);
		};

		// 1
		await openTask(a, 'Regar');
		await note(a).fill('Las del patio');
		await renameInB('Regar', 'Regar plantas');
		await expect(title(a)).toHaveValue('Regar');
		await tap(a, 'Cerrar');
		await expect(notice(a)).toBeVisible();
		await tapInNotice(a, 'Descartar');
		await panelClosed(a);

		// 2
		await expect(row(a, 'Regar plantas')).toBeVisible();
		await openTask(a, 'Regar plantas');
		await renameInB('Regar plantas', 'Regar flores');
		await tap(a, 'Cerrar');
		await panelClosed(a);
		await withoutNotice(a);

		// 3
		await expect(row(a, 'Regar flores')).toBeVisible();
		await openTask(a, 'Regar flores');
		await note(a).fill('Otra nota');
		await tap(a, 'Cerrar');
		await expect(notice(a)).toBeVisible();
		await deleteInB(b, 'Regar flores');
		await panelClosed(a);
		await withoutNotice(a);
		await expect(row(a, 'Regar flores')).toHaveCount(0);

		// 4
		await create(a, { title: 'Pagar', kind: 'No se repite' });
		await expect(row(b, 'Pagar')).toBeVisible();
		await openTask(a, 'Pagar');
		await note(a).fill('algo');
		await tap(a, 'Cerrar');
		await expect(notice(a)).toBeVisible();
		await deleteInB(b, 'Pagar');
		await panelClosed(a);
		await withoutNotice(a);
		await expect(row(a, 'Pagar')).toHaveCount(0);

		// 5
		await createWater(a);
		await expect(row(b, 'Regar')).toBeVisible();
		await openTask(a, 'Regar');
		await note(a).fill('Las del patio');
		await goATab(a, 'Acciones');
		await tap(a, 'Pausar');
		await viewNoticeOfAction(a, 'pausar');
		await openTask(b, 'Regar');
		await goATab(b, 'Acciones');
		await tap(b, 'Pausar');
		await panelClosed(b);
		await withoutNotice(a);
		await panelOpen(a);
		await tabOpenWhetherHas(a, 'Acciones');
		await expect(button(a, 'Reanudar')).toBeVisible();
		await goATab(a, 'Tarea');
		await expect(note(a)).toHaveValue('Las del patio');

		// 6
		await goATab(a, 'Acciones');
		await tap(a, 'Reanudar');
		await viewNoticeOfAction(a, 'reanudar');
		await showPaused(b).click();
		await expect(showPaused(b)).toBeChecked();
		await openTask(b, 'Regar');
		await goATab(b, 'Acciones');
		await tap(b, 'Reanudar');
		await panelClosed(b);
		await withoutNotice(a);
		await panelOpen(a);
		await goATab(a, 'Tarea');
		await expect(note(a)).toHaveValue('Las del patio');
		await tap(a, 'Cerrar');
		await tapInNotice(a, 'Descartar');
		await panelClosed(a);

		// 8
		await openTask(a, 'Regar');
		await note(a).fill('Otra');
		await goATab(a, 'Acciones');
		await tap(a, 'Pausar');
		await expect(notice(a)).toBeVisible();
		await deleteInB(b, 'Regar');
		await panelClosed(a);
		await withoutNotice(a);
		await expect(row(a, 'Regar')).toHaveCount(0);
	} finally {
		await end();
	}
});

test('Flujo 8 paso 7: el aviso de quitar posponer se cierra solo', async ({ page, browser }) => {
	await sessionWithClock(page, TODAY);
	await createWater(page);
	await openTask(page, 'Regar');
	await goATab(page, 'Acciones');
	await tap(page, '1 hora');
	await panelClosed(page);
	await page.clock.runFor(30 * 60 * 1000);
	await openTask(page, 'Regar');
	await note(page).fill('Otra nota');
	await goATab(page, 'Acciones');
	await tap(page, 'Quitar posponer');
	await viewNoticeOfAction(page, 'quitar posponer');
	await page.clock.runFor(31 * 60 * 1000);
	await withoutNotice(page);
	await panelOpen(page);
	await goATab(page, 'Tarea');
	await expect(note(page)).toHaveValue('Otra nota');
	void browser;
});

/** B borra la tarea desde su panel. */
async function deleteInB(b: Page, name: string) {
	await openTask(b, name);
	await goATab(b, 'Acciones');
	await tap(b, 'Borrar tarea');
	await b.getByRole('alertdialog').getByRole('button', { name: 'Borrar', exact: true }).click();
	await panelClosed(b);
	await arrivesOnServer(b);
}

test('Flujo 9: Descartar no quita un emoji de Recientes', async ({ page }) => {
	await sessionWithClock(page, TODAY);

	// 1
	await tap(page, '+');
	await chooseEmoji(page, '🌱');
	await expect(page.getByRole('button', { name: /^Cambiar emoji/ })).toContainText('🌱');

	// 2
	await tap(page, 'Cerrar');
	await tapInNotice(page, 'Descartar');
	await panelClosed(page);
	await expect(page.getByRole('listitem')).toHaveCount(0);

	// 3
	await tap(page, '+');
	await page.getByRole('button', { name: 'Elegir emoji' }).click();
	await expect(selectorEmoji(page)).toBeVisible();
	const recent = selectorEmoji(page).locator('section[aria-labelledby="title-recents"]').getByRole('button');
	await expect(recent.first()).toHaveText('🌱');
});
