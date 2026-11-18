import { expect, test, type Page } from '@playwright/test';
import {
	openTask,
	advance,
	remove,
	close,
	complete,
	completeEntry,
	create,
	createAndView,
	discard,
	twoDevices,
	edit,
	turnOnCompleted,
	row,
	cleanEmulators,
	arrivesOnServer,
	sessionWithClock
} from './support';
import { AUTH, screenName, retain } from './screen-support';

const TODAY = '2026-07-15T08:00:00';

test.beforeEach(async () => {
	await cleanEmulators();
});

type Direction = 'Me sirvió' | 'Me molestó';

/** Fija la hora que ve la app (los temporizadores siguen corriendo) y deja que su reloj interno la lea. */
async function at(page: Page, hour: string) {
	await page.clock.setFixedTime(new Date(hour));
	await page.waitForTimeout(1200);
}

const buttonAnnotate = (page: Page) => page.getByRole('button', { name: 'Anotar', exact: true });
const box = (page: Page) => page.getByRole('dialog', { name: 'Anotar', exact: true });
const confirmation = (page: Page) => page.getByRole('status').filter({ hasText: 'Anotación guardada' });
const copiedNotice = (page: Page) => page.getByRole('status').filter({ hasText: 'Anotaciones copiadas' });

/** Los dos toques: Anotar, el texto si lo hay y el sentido. */
async function annotate(page: Page, text?: string, direction: Direction = 'Me sirvió') {
	await buttonAnnotate(page).click();
	await expect(box(page)).toBeVisible();
	if (text !== undefined) await box(page).getByRole('textbox', { name: 'Texto' }).fill(text);
	await box(page).getByRole('button', { name: direction }).click();
	await expect(box(page)).toHaveCount(0);
	await expect(confirmation(page)).toBeVisible();
}

type ScreenName = 'Pendientes' | 'Historial' | 'Anotaciones';

async function go(page: Page, screenName: ScreenName) {
	await page.getByRole('navigation').getByRole('link', { name: screenName, exact: true }).click();
	await expect(page.getByRole('heading', { name: screenName, level: 1 })).toBeVisible();
}

const entries = (page: Page) => page.getByRole('listitem').filter({ has: page.getByRole('button', { name: 'Editar texto' }) });

/** El texto completo de una anotación en la lista: hora, sentido, pantalla, tarea y texto, y sus dos botones. */
function textOf(hour: string, direction: Direction, screenName: string, task?: string, text?: string) {
	const parts = [hour, direction, screenName, task, text, 'Editar texto', 'Borrar'].filter((p) => p !== undefined);
	const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return new RegExp(`^\\s*${parts.map((p) => escape(p!)).join('\\s*')}\\s*$`);
}

const entry = (page: Page, hour: string) => entries(page).filter({ hasText: hour });

const clipboard = (page: Page) => page.evaluate(() => navigator.clipboard.readText());

async function withPermissions(page: Page) {
	await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
}

const position = async (page: Page) => {
	const box = await buttonAnnotate(page).boundingBox();
	return { x: Math.round(box!.x), y: Math.round(box!.y) };
};

test('Flujo 1: dónde está el botón', async ({ page }) => {
	// Paso 1: sin sesión no hay botón.
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'Entrar con Google' })).toBeVisible();
	await expect(buttonAnnotate(page)).toHaveCount(0);

	// Paso 2: con la respuesta de Auth demorada se ve la pantalla de carga, sin botón.
	const auth = await retain(page, AUTH);
	await page.reload({ waitUntil: 'commit' });
	await expect(screenName(page)).toBeVisible();
	await expect(buttonAnnotate(page)).toHaveCount(0);
	auth.release();
	await expect(page.getByRole('button', { name: 'Entrar con Google' })).toBeVisible();
	await expect(buttonAnnotate(page)).toHaveCount(0);

	// Paso 3: celular, las cuatro pantallas, mismas coordenadas.
	await page.setViewportSize({ width: 390, height: 844 });
	await completeEntry(page);
	const walk = async () => {
		const positions = [];
		for (const p of ['Pendientes', 'Historial', 'Anotaciones'] as const) {
			await go(page, p);
			await expect(buttonAnnotate(page)).toBeVisible();
			const pos = await position(page);
			expect(pos.y).toBeLessThan(120);
			positions.push(pos);
		}
		for (const pos of positions) expect(pos).toEqual(positions[0]);
		return positions[0];
	};
	const phone = await walk();

	// Paso 4: pantalla ancha.
	await page.setViewportSize({ width: 1280, height: 800 });
	await go(page, 'Pendientes');
	const wide = await walk();
	expect(wide.y).toBe(phone.y);

	// Paso 5: con el panel de creación y con el de edición abierto.
	await go(page, 'Pendientes');
	await page.getByRole('button', { name: '+' }).click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await expect(buttonAnnotate(page)).toBeVisible();
	await buttonAnnotate(page).click();
	await expect(box(page)).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(box(page)).toHaveCount(0);
	await close(page);
	await createAndView(page, { title: 'Regar', kind: 'No se repite' });
	await openTask(page, 'Regar');
	await expect(buttonAnnotate(page)).toBeVisible();
	await buttonAnnotate(page).click();
	await expect(box(page)).toBeVisible();
	await page.keyboard.press('Escape');
	await close(page);

	// Paso 6: no hay opción para ocultarlo.
	for (const p of ['Pendientes', 'Historial', 'Anotaciones'] as const) {
		await go(page, p);
		await expect(page.getByText(/ocultar/i)).toHaveCount(0);
		await expect(page.getByRole('checkbox', { name: /anotar/i })).toHaveCount(0);
		await expect(page.getByRole('switch')).toHaveCount(0);
	}
});

test('Flujo 2: los dos toques', async ({ page }) => {
	await sessionWithClock(page, '2026-07-15T08:04:00');
	await at(page, '2026-07-15T08:05:00');

	// Paso 1: el recuadro, solo con el campo y los dos botones.
	await buttonAnnotate(page).click();
	await expect(box(page)).toBeVisible();
	await expect(box(page).getByRole('textbox', { name: 'Texto' })).toHaveValue('');
	await expect(box(page).getByRole('textbox')).toHaveCount(1);
	await expect(box(page).getByRole('button')).toHaveText(['Me sirvió', 'Me molestó']);
	await expect(box(page).getByRole('combobox')).toHaveCount(0);
	await expect(box(page).getByRole('radio')).toHaveCount(0);
	await expect(box(page).getByRole('checkbox')).toHaveCount(0);
	await page.keyboard.press('Escape');

	// Paso 2: guardar con texto; la confirmación se va sola.
	await annotate(page, 'quedó lindo');
	await expect(confirmation(page).getByRole('button')).toHaveCount(0);
	await expect(confirmation(page)).toHaveCount(0, { timeout: 15_000 });

	// Paso 3: aparece en Hoy.
	await go(page, 'Anotaciones');
	await expect(page.getByRole('heading', { level: 2 })).toHaveText(['Hoy']);
	await expect(entries(page)).toHaveText([textOf('08:05', 'Me sirvió', 'Pendientes', undefined, 'quedó lindo')]);

	// Paso 4: sin texto es válido.
	await at(page, '2026-07-15T08:06:00');
	await go(page, 'Pendientes');
	await annotate(page, undefined, 'Me molestó');
	await go(page, 'Anotaciones');
	await expect(entry(page, '08:06')).toHaveText(textOf('08:06', 'Me molestó', 'Pendientes'));

	// Paso 5: los espacios a los lados se recortan; solo espacios queda sin texto.
	await at(page, '2026-07-15T08:07:00');
	await go(page, 'Pendientes');
	await annotate(page, '   espacios   ', 'Me molestó');
	await at(page, '2026-07-15T08:08:00');
	await annotate(page, '     ', 'Me molestó');
	await go(page, 'Anotaciones');
	await expect(entry(page, '08:07')).toHaveText(textOf('08:07', 'Me molestó', 'Pendientes', undefined, 'espacios'));
	await expect(entry(page, '08:08')).toHaveText(textOf('08:08', 'Me molestó', 'Pendientes'));

	// Paso 6: 300 caracteres, completos y sin error.
	const length = 'abcdefghij'.repeat(30);
	await at(page, '2026-07-15T08:09:00');
	await go(page, 'Pendientes');
	await annotate(page, length);
	await go(page, 'Anotaciones');
	await expect(entry(page, '08:09')).toContainText(length);
	await expect(page.getByRole('alert')).toHaveCount(0);

	// Paso 7: cada pantalla queda registrada.
	let minute = 10;
	for (const p of ['Historial', 'Anotaciones'] as const) {
		const hour = `08:${minute}`;
		await at(page, `2026-07-15T${hour}:00`);
		await go(page, p);
		await annotate(page, `desde ${p}`);
		minute++;
	}
	await go(page, 'Anotaciones');
	await expect(entry(page, '08:10')).toHaveText(textOf('08:10', 'Me sirvió', 'Historial', undefined, 'desde Historial'));
	await expect(entry(page, '08:11')).toHaveText(textOf('08:11', 'Me sirvió', 'Anotaciones', undefined, 'desde Anotaciones'));
});

test('Flujo 3: contexto con el panel y con el aviso', async ({ page }) => {
	await sessionWithClock(page, '2026-07-15T07:59:00');
	await at(page, '2026-07-15T07:59:30');
	await createAndView(page, { title: 'Regar', kind: 'No se repite' });
	await createAndView(page, { title: 'Pagar', kind: 'No se repite' });

	// Paso 1: con el panel de Regar abierto.
	await at(page, '2026-07-15T08:01:00');
	await openTask(page, 'Regar');
	await annotate(page);
	await close(page);

	// Paso 2: panel de creación.
	await at(page, '2026-07-15T08:02:00');
	await page.getByRole('button', { name: '+' }).click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await annotate(page);
	await close(page);

	await go(page, 'Anotaciones');
	await expect(entry(page, '08:01')).toHaveText(textOf('08:01', 'Me sirvió', 'Panel de edición', 'Regar'));
	await expect(entry(page, '08:02')).toHaveText(textOf('08:02', 'Me sirvió', 'Panel de edición'));
});

test('Flujo 3 paso 3: el panel abierto sobre Historial dice Panel de edición', async ({ page }) => {
	await sessionWithClock(page, '2026-07-15T07:59:00');
	await createAndView(page, { title: 'Regar', kind: 'No se repite' });
	await complete(page, 'Regar');
	await at(page, '2026-07-15T08:03:00');
	await go(page, 'Historial');
	// Desde el Historial el título de la entrada abre el panel de esa tarea; el panel cubre la barra.
	await page.getByRole('listitem').filter({ hasText: 'Regar' }).getByRole('button', { name: 'Regar' }).click();
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await annotate(page);
	await close(page);
	await expect(page.getByRole('heading', { name: 'Historial', level: 1 })).toBeVisible();
	await go(page, 'Anotaciones');
	await expect(entry(page, '08:03')).toHaveText(textOf('08:03', 'Me sirvió', 'Panel de edición', 'Regar'));
});

test('Flujo 3 pasos 4 a 6: el aviso de deshacer y el contexto', async ({ page }) => {
	await sessionWithClock(page, '2026-07-15T07:59:00');
	await createAndView(page, { title: 'Regar', kind: 'No se repite' });
	await createAndView(page, { title: 'Pagar', kind: 'No se repite' });
	const notice = page.getByRole('status').filter({ hasText: 'Completaste' });

	// Paso 4: a las 08:00:04 todavía cuenta el aviso; a las 08:00:05 ya no.
	await at(page, '2026-07-15T08:00:00');
	await complete(page, 'Regar');
	await expect(notice).toContainText('Completaste «Regar»');
	await at(page, '2026-07-15T08:00:04');
	await expect(notice).toBeVisible();
	await annotate(page);
	await at(page, '2026-07-15T08:00:05');
	await expect(notice).toHaveCount(0, { timeout: 15_000 });
	await annotate(page);

	// Paso 5: el panel manda sobre el aviso; el panel de creación no tiene tarea.
	await at(page, '2026-07-15T08:10:00');
	await turnOnCompleted(page);
	await complete(page, 'Pagar');
	await expect(notice).toContainText('Completaste «Pagar»');
	await openTask(page, 'Regar');
	await annotate(page);
	await close(page);
	await page.getByRole('button', { name: '+' }).click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await at(page, '2026-07-15T08:10:01');
	await annotate(page);
	await close(page);

	// Paso 6: la confirmación y el aviso se ven a la vez.
	await at(page, '2026-07-15T08:20:00');
	await createAndView(page, { title: 'Barrer', kind: 'No se repite' });
	await complete(page, 'Barrer');
	await expect(notice).toContainText('Completaste «Barrer»');
	await buttonAnnotate(page).click();
	await box(page).getByRole('button', { name: 'Me sirvió' }).click();
	await expect(confirmation(page)).toBeVisible();
	await expect(notice.getByRole('button', { name: 'Deshacer' })).toBeVisible();

	await go(page, 'Anotaciones');
	await expect(entry(page, '08:00')).toHaveCount(2);
	await expect(entry(page, '08:00').filter({ hasText: 'Regar' })).toHaveCount(1);
	await expect(entry(page, '08:10')).toHaveCount(2);
	await expect(entry(page, '08:10').filter({ hasText: 'Regar' })).toHaveCount(1);
	await expect(entry(page, '08:10').filter({ hasText: 'Panel de edición' })).toHaveCount(2);
});

test('Flujo 4: anotar no toca la tarea ni el panel', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	await createAndView(page, { title: 'Regar', kind: 'No se repite' });

	// Pasos 1 y 2: el panel sigue igual y se cierra sin avisar.
	await openTask(page, 'Regar');
	await expect(page.getByLabel('Título')).toHaveValue('Regar');
	await annotate(page, 'algo');
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await expect(page.getByLabel('Título')).toHaveValue('Regar');
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
	await close(page);
	await expect(page.getByRole('alertdialog')).toHaveCount(0);

	// Paso 3: un cambio sin guardar sigue siendo el único cambio.
	await openTask(page, 'Regar');
	await page.getByLabel('Título').fill('Regar mucho');
	await annotate(page);
	await expect(page.getByLabel('Título')).toHaveValue('Regar mucho');
	await page.getByRole('button', { name: 'Cerrar' }).click();
	const notice = page.getByRole('alertdialog', { name: 'Tenés cambios sin guardar' });
	await expect(notice).toBeVisible();
	await notice.getByRole('button', { name: 'Descartar', exact: true }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);

	// Paso 4: no cambia de pantalla ni de pestaña.
	await go(page, 'Historial');
	await annotate(page);
	await expect(page.getByRole('heading', { name: 'Historial', level: 1 })).toBeVisible();
	await go(page, 'Pendientes');
	await openTask(page, 'Regar');
	const when = page.getByRole('tab', { name: /^Cuándo/ });
	if ((await when.count()) > 0) {
		await when.click();
		await annotate(page);
		await expect(when).toHaveAttribute('aria-selected', 'true');
	} else {
		await annotate(page);
		await expect(page.getByRole('radio', { name: 'No se repite' })).toBeChecked();
	}
	await close(page);
});

test('Flujo 5: Atrás y cerrar sin anotar', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	await createAndView(page, { title: 'Regar', kind: 'No se repite' });
	await create(page, { title: 'Pagar', kind: 'No se repite' });
	await complete(page, 'Pagar');

	// Paso 1: Atrás cierra el recuadro sin anotar.
	await buttonAnnotate(page).click();
	await box(page).getByRole('textbox', { name: 'Texto' }).fill('a medias');
	await page.goBack();
	await expect(box(page)).toHaveCount(0);
	await expect(confirmation(page)).toHaveCount(0);
	await expect(page.getByRole('heading', { name: 'Pendientes', level: 1 })).toBeVisible();
	await buttonAnnotate(page).click();
	await expect(box(page).getByRole('textbox', { name: 'Texto' })).toHaveValue('');

	// Paso 2: Escape.
	await box(page).getByRole('textbox', { name: 'Texto' }).fill('con escape');
	await page.keyboard.press('Escape');
	await expect(box(page)).toHaveCount(0);
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
	await expect(confirmation(page)).toHaveCount(0);
	await go(page, 'Anotaciones');
	await expect(page.getByText('Todavía no hay anotaciones')).toBeVisible();
	await go(page, 'Pendientes');

	// Paso 3: con el panel abierto, el primer Atrás cierra el recuadro y el segundo hace lo de siempre.
	await openTask(page, 'Regar');
	await buttonAnnotate(page).click();
	await expect(box(page)).toBeVisible();
	await page.goBack();
	await expect(box(page)).toHaveCount(0);
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await page.goBack();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
	await openTask(page, 'Regar');
	await page.getByLabel('Título').fill('Regar cambiado');
	await buttonAnnotate(page).click();
	await expect(box(page)).toBeVisible();
	await page.goBack();
	await expect(box(page)).toHaveCount(0);
	await expect(page.getByLabel('Título')).toHaveValue('Regar cambiado');
	await page.goBack();
	await expect(page.getByRole('alertdialog', { name: 'Tenés cambios sin guardar' })).toBeVisible();
	await page.getByRole('alertdialog').getByRole('button', { name: 'Descartar', exact: true }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);

	// Paso 4: con el panel cerrado, en cada pantalla la app se queda en ella.
	for (const p of ['Historial', 'Anotaciones'] as const) {
		await go(page, p);
		await buttonAnnotate(page).click();
		await expect(box(page)).toBeVisible();
		await page.goBack();
		await expect(box(page)).toHaveCount(0);
		await expect(page.getByRole('heading', { name: p, level: 1 })).toBeVisible();
	}

	// Paso 5: ningún Atrás de más, y Adelante no reabre nada.
	await go(page, 'Historial');
	for (let i = 0; i < 3; i++) {
		await buttonAnnotate(page).click();
		await expect(box(page)).toBeVisible();
		await page.goBack();
		await expect(box(page)).toHaveCount(0);
	}
	await expect(page).toHaveURL(/\/historial$/);
	await page.goBack();
	await expect(page).toHaveURL(/\/anotaciones$/);
	await page.goForward();
	await expect(page).toHaveURL(/\/historial$/);
	await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('Flujo 5 paso 6: el diálogo de Historial se comporta como antes', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	await createAndView(page, { title: 'Regar', kind: 'No se repite' });
	await complete(page, 'Regar');
	await go(page, 'Historial');
	await expect(page.getByRole('listitem').filter({ hasText: 'Regar' }).getByRole('button', { name: 'Borrar' })).toBeVisible();
	await page.getByRole('listitem').filter({ hasText: 'Regar' }).getByRole('button', { name: 'Borrar' }).click();
	await expect(page.getByRole('alertdialog')).toBeVisible();
	await page.goBack();
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
	await expect(page).toHaveURL(/\/$/);
});

/** Las tres anotaciones del Flujo 6, con el reloj puesto en cada una. */
async function createAnnotationsOfFlow6(page: Page) {
	await sessionWithClock(page, '2026-07-14T21:29:00');
	await annotationsOfFlow6(page);
}

async function annotationsOfFlow6(page: Page) {
	await at(page, '2026-07-14T21:29:30');
	await go(page, 'Pendientes');
	await createAndView(page, { title: 'Regar', emoji: '🌱', kind: 'No se repite' });
	await at(page, '2026-07-14T21:30:00');
	await go(page, 'Historial');
	await annotate(page, 'muy lento');
	await at(page, '2026-07-15T08:05:00');
	await go(page, 'Pendientes');
	await openTask(page, 'Regar');
	await annotate(page, 'quedó lindo');
	await close(page);
	await at(page, '2026-07-15T09:10:00');
	await go(page, 'Historial');
	await annotate(page, undefined, 'Me molestó');
}

test('Flujo 6: la pantalla Anotaciones', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	// Paso 1: sin anotaciones.
	await go(page, 'Anotaciones');
	await expect(page.getByText('Todavía no hay anotaciones')).toBeVisible();
	await expect(page.getByRole('list')).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Copiar' })).toHaveCount(1);
	const before = await page.getByRole('navigation').innerText();

	// Pasos 2 y 3.
	await annotationsOfFlow6(page);
	await go(page, 'Anotaciones');
	await expect(page.getByRole('heading', { level: 2 })).toHaveText(['Hoy', 'Ayer']);
	await expect(entries(page)).toHaveText([
		textOf('09:10', 'Me molestó', 'Historial'),
		textOf('08:05', 'Me sirvió', 'Panel de edición', '🌱 Regar', 'quedó lindo'),
		textOf('21:30', 'Me sirvió', 'Historial', undefined, 'muy lento')
	]);

	// Paso 4: el reloj avanza y los grupos se renombran.
	await at(page, '2026-07-16T00:00:00');
	await expect(page.getByRole('heading', { level: 2 })).toHaveText(['Ayer', 'martes 14 de julio']);
	await at(page, '2027-01-02T10:00:00');
	await expect(page.getByRole('heading', { level: 2 })).toHaveText(['miércoles 15 de julio de 2026', 'martes 14 de julio de 2026']);
	await at(page, '2026-07-15T10:00:00');
	await expect(page.getByRole('heading', { level: 2 })).toHaveText(['Hoy', 'Ayer']);

	// Paso 5: el nombre actual de la tarea.
	await go(page, 'Pendientes');
	await edit(page, 'Regar', { title: 'Plantas' });
	await go(page, 'Anotaciones');
	await expect(entry(page, '08:05')).toHaveText(textOf('08:05', 'Me sirvió', 'Panel de edición', '🌱 Plantas', 'quedó lindo'));

	// Paso 6: nada cambia en la barra por haber anotado.
	expect(await page.getByRole('navigation').innerText()).toBe(before);
	await expect(page.getByRole('navigation').getByRole('link')).toHaveText(['Pendientes', 'Historial', 'Anotaciones']);
});

test('Flujo 7: editar el texto', async ({ page }) => {
	await createAnnotationsOfFlow6(page);
	await go(page, 'Anotaciones');
	const dialog = page.getByRole('dialog', { name: 'Editar texto' });
	const editText = async (hour: string, value: string) => {
		await entry(page, hour).getByRole('button', { name: 'Editar texto' }).click();
		await dialog.getByRole('textbox').fill(value);
		await dialog.getByRole('button', { name: 'Guardar' }).click();
		await expect(dialog).toHaveCount(0);
	};

	// Paso 1.
	await entry(page, '08:05').getByRole('button', { name: 'Editar texto' }).click();
	await expect(dialog.getByRole('textbox')).toHaveValue('quedó lindo');
	await dialog.getByRole('textbox').fill('quedó mal');
	await dialog.getByRole('button', { name: 'Guardar' }).click();
	await expect(entries(page)).toHaveText([
		textOf('09:10', 'Me molestó', 'Historial'),
		textOf('08:05', 'Me sirvió', 'Panel de edición', '🌱 Regar', 'quedó mal'),
		textOf('21:30', 'Me sirvió', 'Historial', undefined, 'muy lento')
	]);
	await expect(page.getByRole('heading', { level: 2 })).toHaveText(['Hoy', 'Ayer']);

	// Paso 2.
	await entry(page, '09:10').getByRole('button', { name: 'Editar texto' }).click();
	await expect(dialog.getByRole('textbox')).toHaveValue('');
	await dialog.getByRole('textbox').fill('  ayer lo vi  ');
	await dialog.getByRole('button', { name: 'Guardar' }).click();
	await expect(entry(page, '09:10')).toHaveText(textOf('09:10', 'Me molestó', 'Historial', undefined, 'ayer lo vi'));

	// Paso 3.
	await editText('08:05', '');
	await expect(entry(page, '08:05')).toHaveText(textOf('08:05', 'Me sirvió', 'Panel de edición', '🌱 Regar'));
	await editText('09:10', '   ');
	await expect(entry(page, '09:10')).toHaveText(textOf('09:10', 'Me molestó', 'Historial'));
	await expect(page.getByRole('alert')).toHaveCount(0);
	await editText('08:05', 'quedó bien');

	// Paso 4: persisten al recargar.
	await arrivesOnServer(page);
	await page.reload();
	await expect(entries(page)).toHaveText([
		textOf('09:10', 'Me molestó', 'Historial'),
		textOf('08:05', 'Me sirvió', 'Panel de edición', '🌱 Regar', 'quedó bien'),
		textOf('21:30', 'Me sirvió', 'Historial', undefined, 'muy lento')
	]);
});

test('Flujo 8: borrar una anotación', async ({ page }) => {
	await createAnnotationsOfFlow6(page);
	await go(page, 'Anotaciones');
	const confirm = page.getByRole('alertdialog');

	// Pasos 1 y 2.
	await entry(page, '08:05').getByRole('button', { name: 'Borrar' }).click();
	await expect(confirm.getByRole('button', { name: 'Borrar' })).toBeVisible();
	await confirm.getByRole('button', { name: 'Cancelar' }).click();
	await expect(confirm).toHaveCount(0);
	await expect(entries(page)).toHaveCount(3);
	await expect(entry(page, '08:05')).toHaveText(textOf('08:05', 'Me sirvió', 'Panel de edición', '🌱 Regar', 'quedó lindo'));

	// Paso 3.
	await entry(page, '08:05').getByRole('button', { name: 'Borrar' }).click();
	await confirm.getByRole('button', { name: 'Borrar' }).click();
	await expect(confirm).toHaveCount(0);
	await expect(entries(page)).toHaveText([
		textOf('09:10', 'Me molestó', 'Historial'),
		textOf('21:30', 'Me sirvió', 'Historial', undefined, 'muy lento')
	]);
	await go(page, 'Pendientes');
	await expect(row(page, 'Regar')).toBeVisible();
	await go(page, 'Anotaciones');

	// Paso 4.
	for (const hour of ['09:10', '21:30']) {
		await entry(page, hour).getByRole('button', { name: 'Borrar' }).click();
		await confirm.getByRole('button', { name: 'Borrar' }).click();
		await expect(confirm).toHaveCount(0);
	}
	await expect(page.getByText('Todavía no hay anotaciones')).toBeVisible();
	await expect(entries(page)).toHaveCount(0);
});

test('Flujo 9: copiar', async ({ page }) => {
	await withPermissions(page);
	await sessionWithClock(page, '2026-07-15T07:59:00');
	await createAndView(page, { title: 'Regar', emoji: '🌱', kind: 'No se repite' });
	await at(page, '2026-07-15T08:05:00');
	await openTask(page, 'Regar');
	await annotate(page, 'quedó lindo');
	await close(page);
	await at(page, '2026-07-15T09:10:00');
	await go(page, 'Historial');
	await annotate(page, undefined, 'Me molestó');
	await go(page, 'Anotaciones');
	await expect(entries(page)).toHaveCount(2);

	// Pasos 1 y 2.
	await page.getByRole('button', { name: 'Copiar' }).click();
	await expect(copiedNotice(page)).toBeVisible();
	await expect(copiedNotice(page).getByRole('button')).toHaveCount(0);
	expect((await clipboard(page)).split('\n')).toEqual([
		'2026-07-15 08:05 · Me sirvió · Panel de edición · 🌱 Regar · quedó lindo',
		'2026-07-15 09:10 · Me molestó · Historial'
	]);
	await expect(copiedNotice(page)).toHaveCount(0, { timeout: 15_000 });

	// Paso 3.
	await go(page, 'Pendientes');
	await edit(page, 'Regar', { title: 'Plantas' });
	await go(page, 'Anotaciones');
	await page.getByRole('button', { name: 'Copiar' }).click();
	await expect(copiedNotice(page)).toBeVisible();
	expect((await clipboard(page)).split('\n')[0]).toContain('🌱 Plantas');
	await expect(copiedNotice(page)).toHaveCount(0, { timeout: 15_000 });

	// Paso 4: sin conexión.
	await page.context().setOffline(true);
	await page.getByRole('button', { name: 'Copiar' }).click();
	await expect(copiedNotice(page)).toBeVisible();
	await page.context().setOffline(false);
	await expect(copiedNotice(page)).toHaveCount(0, { timeout: 15_000 });

	// Paso 5: sin anotaciones no copia nada.
	for (const hour of ['09:10', '08:05']) {
		await entry(page, hour).getByRole('button', { name: 'Borrar' }).click();
		await page.getByRole('alertdialog').getByRole('button', { name: 'Borrar' }).click();
		await expect(page.getByRole('alertdialog')).toHaveCount(0);
	}
	await expect(page.getByText('Todavía no hay anotaciones')).toBeVisible();
	await page.evaluate(() => navigator.clipboard.writeText('previo'));
	await page.getByRole('button', { name: 'Copiar' }).click();
	await page.waitForTimeout(1500);
	await expect(copiedNotice(page)).toHaveCount(0);
	expect(await clipboard(page)).toBe('previo');
});

test('Flujo 10: borrar una tarea borra sus anotaciones', async ({ page }) => {
	await withPermissions(page);
	await sessionWithClock(page, '2026-07-15T07:59:00');
	await turnOnCompleted(page);
	await createAndView(page, { title: 'Regar', kind: 'No se repite' });
	await createAndView(page, { title: 'Pagar', kind: 'No se repite' });
	await at(page, '2026-07-15T08:01:00');
	await openTask(page, 'Regar');
	await annotate(page, 'r1');
	await at(page, '2026-07-15T08:02:00');
	await annotate(page, 'r2');
	await close(page);
	await at(page, '2026-07-15T08:03:00');
	await openTask(page, 'Pagar');
	await annotate(page, 'p1');
	await close(page);
	await at(page, '2026-07-15T08:04:00');
	await annotate(page, 'suelta');
	await complete(page, 'Regar');
	await go(page, 'Anotaciones');
	await expect(entries(page)).toHaveCount(4);

	// Paso 1: pasado el aviso de deshacer.
	await at(page, '2026-07-15T08:10:00');
	await go(page, 'Pendientes');
	await remove(page, 'Regar');

	// Paso 2.
	await go(page, 'Anotaciones');
	await expect(entries(page)).toHaveText([
		textOf('08:04', 'Me sirvió', 'Pendientes', undefined, 'suelta'),
		textOf('08:03', 'Me sirvió', 'Panel de edición', 'Pagar', 'p1')
	]);
	await page.getByRole('button', { name: 'Copiar' }).click();
	await expect(copiedNotice(page)).toBeVisible();
	expect((await clipboard(page)).split('\n')).toEqual([
		'2026-07-15 08:03 · Me sirvió · Panel de edición · Pagar · p1',
		'2026-07-15 08:04 · Me sirvió · Pendientes · suelta'
	]);

	// Paso 3.
	await go(page, 'Historial');
	await expect(page.getByText('Todavía no completaste nada')).toBeVisible();
});

test('Flujo 11: dos dispositivos, anotar sin conexión', async ({ browser }) => {
	const d = await twoDevices(browser, '2026-07-15T08:04:00');
	try {
		// Sin service worker, B tiene que haber cargado sus pantallas antes de quedarse sin conexión.
		await go(d.b, 'Anotaciones');
		await go(d.b, 'Historial');
		await d.ctxB.setOffline(true);
		await at(d.a, '2026-07-15T08:05:00');
		await annotate(d.a, 'desde A', 'Me sirvió');
		await at(d.b, '2026-07-15T08:06:00');
		await annotate(d.b, 'desde B', 'Me molestó');
		await arrivesOnServer(d.a);
		await d.ctxB.setOffline(false);
		for (const p of [d.a, d.b]) {
			await go(p, 'Anotaciones');
			await expect(entries(p)).toHaveText([
				textOf('08:06', 'Me molestó', 'Historial', undefined, 'desde B'),
				textOf('08:05', 'Me sirvió', 'Pendientes', undefined, 'desde A')
			]);
		}
	} finally {
		await d.close();
	}
});

test('Flujo 12: dos dispositivos, edición contra borrado y tarea borrada', async ({ browser }) => {
	const d = await twoDevices(browser, '2026-07-15T08:00:00');
	try {
		await createAndView(d.a, { title: 'Regar', kind: 'No se repite' });
		await expect(row(d.b, 'Regar')).toBeVisible();
		await annotate(d.a, 'quedó lindo');
		await go(d.a, 'Anotaciones');
		await go(d.b, 'Anotaciones');
		await expect(entries(d.b)).toHaveCount(1);
		const dialog = (p: Page) => p.getByRole('dialog', { name: 'Editar texto' });
		const editText = async (p: Page, value: string) => {
			await entries(p).first().getByRole('button', { name: 'Editar texto' }).click();
			await dialog(p).getByRole('textbox').fill(value);
			await dialog(p).getByRole('button', { name: 'Guardar' }).click();
			await expect(dialog(p)).toHaveCount(0);
		};
		const text = (p: Page, t: string) => expect(entries(p)).toHaveText([new RegExp(`${t}\\s*Editar texto\\s*Borrar$`)]);

		// Paso 2: gana el último cambio.
		await d.ctxB.setOffline(true);
		await editText(d.a, 'uno');
		await arrivesOnServer(d.a);
		await editText(d.b, 'dos');
		await d.ctxB.setOffline(false);
		await text(d.a, 'dos');
		await text(d.b, 'dos');

		// Paso 3: borrar gana.
		await arrivesOnServer(d.a);
		await d.ctxB.setOffline(true);
		await entries(d.a).first().getByRole('button', { name: 'Borrar' }).click();
		await d.a.getByRole('alertdialog').getByRole('button', { name: 'Borrar' }).click();
		await expect(entries(d.a)).toHaveCount(0);
		await arrivesOnServer(d.a);
		await editText(d.b, 'tres');
		await d.ctxB.setOffline(false);
		await expect(entries(d.a)).toHaveCount(0);
		await expect(entries(d.b)).toHaveCount(0);
		await arrivesOnServer(d.a);
		await expect(entries(d.b)).toHaveCount(0);

		// Paso 4: anotación sobre una tarea ya borrada.
		await go(d.a, 'Pendientes');
		await go(d.b, 'Pendientes');
		await annotate(d.a, 'queda');
		await expect(row(d.b, 'Regar')).toBeVisible();
		await d.ctxB.setOffline(true);
		await go(d.a, 'Pendientes');
		await remove(d.a, 'Regar');
		await arrivesOnServer(d.a);
		await openTask(d.b, 'Regar');
		await annotate(d.b, 'huérfana');
		await close(d.b);
		await d.ctxB.setOffline(false);
		await expect(row(d.b, 'Regar')).toHaveCount(0);
		await withPermissions(d.a);
		await withPermissions(d.b);
		for (const p of [d.a, d.b]) {
			await go(p, 'Anotaciones');
			await expect(entries(p)).toHaveCount(1, { timeout: 30_000 });
			await expect(p.getByText('huérfana')).toHaveCount(0);
			await expect(entries(p).first()).toContainText('queda');
			await p.getByRole('button', { name: 'Copiar' }).click();
			await expect(copiedNotice(p)).toBeVisible();
			const copied = await clipboard(p);
			expect(copied.split('\n')).toHaveLength(1);
			expect(copied).not.toContain('huérfana');
		}
	} finally {
		await d.close();
	}
});

test('Flujo 13: la app nunca pide una anotación', async ({ page }) => {
	await sessionWithClock(page, TODAY);
	await createAndView(page, { title: 'Regar', kind: 'No se repite' });
	await createAndView(page, { title: 'Pagar', kind: 'No se repite' });

	// Paso 1: una semana sin anotar.
	const withoutNotices = async () => {
		await expect(page.getByRole('alert')).toHaveCount(0);
		await expect(page.getByRole('alertdialog')).toHaveCount(0);
		await expect(page.getByRole('dialog')).toHaveCount(0);
		await expect(page.getByRole('status').filter({ hasNotText: /Completaste/ })).toHaveCount(0);
		await expect(page.getByRole('navigation').getByRole('link')).toHaveText(['Pendientes', 'Historial', 'Anotaciones']);
		await expect(buttonAnnotate(page)).toHaveText('Anotar');
	};
	await complete(page, 'Regar');
	await advance(page, '2026-07-18T08:00:00');
	await withoutNotices();
	await complete(page, 'Pagar').catch(() => {});
	await advance(page, '2026-07-22T08:00:00');
	for (const p of ['Historial', 'Anotaciones', 'Pendientes'] as const) {
		await go(page, p);
		await withoutNotices();
	}

	// Paso 2: el botón se ve idéntico con 20 anotaciones.
	const look = async () => ({
		image: (await buttonAnnotate(page).screenshot()).toString('base64'),
		style: await buttonAnnotate(page).evaluate((e) => {
			const s = getComputedStyle(e);
			return [s.color, s.backgroundColor, s.border, s.fontSize, s.fontWeight, e.textContent].join('|');
		}),
		box: await buttonAnnotate(page).boundingBox()
	});
	const without = await look();
	for (let i = 0; i < 20; i++) await annotate(page, `nota ${i}`);
	await expect(confirmation(page)).toHaveCount(0, { timeout: 15_000 });
	await go(page, 'Anotaciones');
	await expect(entries(page)).toHaveCount(20);
	await go(page, 'Pendientes');
	const lookResult = await look();
	expect(lookResult).toEqual(without);
	await withoutNotices();
	// Quedó sin conexión de red a Auth: nada más que ver.
	void discard;
});

test('Flujo 14: la ruta /etiquetas ya no existe', async ({ page, context }) => {
	await sessionWithClock(page, TODAY);
	await page.setViewportSize({ width: 390, height: 844 });
	const nav = page.getByRole('navigation');
	const withoutNotice = async (p: Page) => {
		await expect(p.getByRole('alert')).toHaveCount(0);
		await expect(p.getByRole('alertdialog')).toHaveCount(0);
		await expect(p.getByText(/no existe|not found|404/i)).toHaveCount(0);
	};

	// Paso 1: ir directo a /etiquetas desde Historial abre Pendientes.
	await go(page, 'Historial');
	await expect(page).toHaveURL(/\/historial$/);
	await page.goto('/etiquetas');
	await expect(page.getByRole('heading', { name: 'Pendientes', level: 1 })).toBeVisible();
	await expect(page).toHaveURL(/\/$/);
	await expect(nav.getByRole('link', { name: 'Pendientes', exact: true })).toHaveAttribute('aria-current', 'page');
	await withoutNotice(page);

	// Paso 2: Atrás vuelve a Historial, sin pantalla vacía.
	await page.goBack();
	await expect(page).toHaveURL(/\/historial$/);
	await expect(page.getByRole('heading', { name: 'Historial', level: 1 })).toBeVisible();

	// Paso 3: como primera dirección de una pestaña nueva.
	const other = await context.newPage();
	await other.goto('/etiquetas');
	await expect(other.getByRole('heading', { name: 'Pendientes', level: 1 })).toBeVisible();
	await expect(other).toHaveURL(/\/$/);
	await withoutNotice(other);
	await other.close();

	// Paso 4: la barra tiene solo tres enlaces.
	await expect(nav.getByRole('link')).toHaveText(['Pendientes', 'Historial', 'Anotaciones']);
	await expect(nav.getByRole('link', { name: 'Etiquetas' })).toHaveCount(0);
});
