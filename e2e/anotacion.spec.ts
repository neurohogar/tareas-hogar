import { expect, test, type Page } from '@playwright/test';
import {
	abrir,
	adelantar,
	borrar,
	cerrar,
	completar,
	completarEntrada,
	crear,
	crearYVer,
	descartar,
	dosDispositivos,
	editar,
	encenderCompletadas,
	fila,
	limpiarEmuladores,
	llegaAlServidor,
	sesionConReloj
} from './apoyo';
import { AUTH, pantalla, retener } from './pantalla-apoyo';

const HOY = '2026-07-15T08:00:00';

test.beforeEach(async () => {
	await limpiarEmuladores();
});

type Sentido = 'Me sirvió' | 'Me molestó';

/** Fija la hora que ve la app (los temporizadores siguen corriendo) y deja que su reloj interno la lea. */
async function en(page: Page, hora: string) {
	await page.clock.setFixedTime(new Date(hora));
	await page.waitForTimeout(1200);
}

const botonAnotar = (page: Page) => page.getByRole('button', { name: 'Anotar', exact: true });
const recuadro = (page: Page) => page.getByRole('dialog', { name: 'Anotar', exact: true });
const confirmacion = (page: Page) => page.getByRole('status').filter({ hasText: 'Anotación guardada' });
const copiadas = (page: Page) => page.getByRole('status').filter({ hasText: 'Anotaciones copiadas' });

/** Los dos toques: Anotar, el texto si lo hay y el sentido. */
async function anotar(page: Page, texto?: string, sentido: Sentido = 'Me sirvió') {
	await botonAnotar(page).click();
	await expect(recuadro(page)).toBeVisible();
	if (texto !== undefined) await recuadro(page).getByRole('textbox', { name: 'Texto' }).fill(texto);
	await recuadro(page).getByRole('button', { name: sentido }).click();
	await expect(recuadro(page)).toHaveCount(0);
	await expect(confirmacion(page)).toBeVisible();
}

type Pantalla = 'Pendientes' | 'Historial' | 'Etiquetas' | 'Anotaciones';

async function ir(page: Page, pantalla: Pantalla) {
	await page.getByRole('navigation').getByRole('link', { name: pantalla, exact: true }).click();
	await expect(page.getByRole('heading', { name: pantalla, level: 1 })).toBeVisible();
}

const entradas = (page: Page) => page.getByRole('listitem').filter({ has: page.getByRole('button', { name: 'Editar texto' }) });

/** El texto completo de una anotación en la lista: hora, sentido, pantalla, tarea y texto, y sus dos botones. */
function textoDe(hora: string, sentido: Sentido, pantalla: string, tarea?: string, texto?: string) {
	const partes = [hora, sentido, pantalla, tarea, texto, 'Editar texto', 'Borrar'].filter((p) => p !== undefined);
	const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return new RegExp(`^\\s*${partes.map((p) => escapar(p!)).join('\\s*')}\\s*$`);
}

const entrada = (page: Page, hora: string) => entradas(page).filter({ hasText: hora });

const portapapeles = (page: Page) => page.evaluate(() => navigator.clipboard.readText());

async function conPermisos(page: Page) {
	await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
}

const posicion = async (page: Page) => {
	const caja = await botonAnotar(page).boundingBox();
	return { x: Math.round(caja!.x), y: Math.round(caja!.y) };
};

test('Flujo 1: dónde está el botón', async ({ page }) => {
	// Paso 1: sin sesión no hay botón.
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'Entrar con Google' })).toBeVisible();
	await expect(botonAnotar(page)).toHaveCount(0);

	// Paso 2: con la respuesta de Auth demorada se ve la pantalla de carga, sin botón.
	const auth = await retener(page, AUTH);
	await page.reload({ waitUntil: 'commit' });
	await expect(pantalla(page)).toBeVisible();
	await expect(botonAnotar(page)).toHaveCount(0);
	auth.liberar();
	await expect(page.getByRole('button', { name: 'Entrar con Google' })).toBeVisible();
	await expect(botonAnotar(page)).toHaveCount(0);

	// Paso 3: celular, las cuatro pantallas, mismas coordenadas.
	await page.setViewportSize({ width: 390, height: 844 });
	await completarEntrada(page);
	const recorrer = async () => {
		const posiciones = [];
		for (const p of ['Pendientes', 'Historial', 'Etiquetas', 'Anotaciones'] as const) {
			await ir(page, p);
			await expect(botonAnotar(page)).toBeVisible();
			const pos = await posicion(page);
			expect(pos.y).toBeLessThan(120);
			posiciones.push(pos);
		}
		for (const pos of posiciones) expect(pos).toEqual(posiciones[0]);
		return posiciones[0];
	};
	const celular = await recorrer();

	// Paso 4: pantalla ancha.
	await page.setViewportSize({ width: 1280, height: 800 });
	await ir(page, 'Pendientes');
	const ancha = await recorrer();
	expect(ancha.y).toBe(celular.y);

	// Paso 5: con el panel de creación y con el de edición abierto.
	await ir(page, 'Pendientes');
	await page.getByRole('button', { name: '+' }).click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await expect(botonAnotar(page)).toBeVisible();
	await botonAnotar(page).click();
	await expect(recuadro(page)).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(recuadro(page)).toHaveCount(0);
	await cerrar(page);
	await crearYVer(page, { titulo: 'Regar', tipo: 'No se repite' });
	await abrir(page, 'Regar');
	await expect(botonAnotar(page)).toBeVisible();
	await botonAnotar(page).click();
	await expect(recuadro(page)).toBeVisible();
	await page.keyboard.press('Escape');
	await cerrar(page);

	// Paso 6: no hay opción para ocultarlo.
	for (const p of ['Pendientes', 'Historial', 'Etiquetas', 'Anotaciones'] as const) {
		await ir(page, p);
		await expect(page.getByText(/ocultar/i)).toHaveCount(0);
		await expect(page.getByRole('checkbox', { name: /anotar/i })).toHaveCount(0);
		await expect(page.getByRole('switch')).toHaveCount(0);
	}
});

test('Flujo 2: los dos toques', async ({ page }) => {
	await sesionConReloj(page, '2026-07-15T08:04:00');
	await en(page, '2026-07-15T08:05:00');

	// Paso 1: el recuadro, solo con el campo y los dos botones.
	await botonAnotar(page).click();
	await expect(recuadro(page)).toBeVisible();
	await expect(recuadro(page).getByRole('textbox', { name: 'Texto' })).toHaveValue('');
	await expect(recuadro(page).getByRole('textbox')).toHaveCount(1);
	await expect(recuadro(page).getByRole('button')).toHaveText(['Me sirvió', 'Me molestó']);
	await expect(recuadro(page).getByRole('combobox')).toHaveCount(0);
	await expect(recuadro(page).getByRole('radio')).toHaveCount(0);
	await expect(recuadro(page).getByRole('checkbox')).toHaveCount(0);
	await page.keyboard.press('Escape');

	// Paso 2: guardar con texto; la confirmación se va sola.
	await anotar(page, 'quedó lindo');
	await expect(confirmacion(page).getByRole('button')).toHaveCount(0);
	await expect(confirmacion(page)).toHaveCount(0, { timeout: 15_000 });

	// Paso 3: aparece en Hoy.
	await ir(page, 'Anotaciones');
	await expect(page.getByRole('heading', { level: 2 })).toHaveText(['Hoy']);
	await expect(entradas(page)).toHaveText([textoDe('08:05', 'Me sirvió', 'Pendientes', undefined, 'quedó lindo')]);

	// Paso 4: sin texto es válido.
	await en(page, '2026-07-15T08:06:00');
	await ir(page, 'Pendientes');
	await anotar(page, undefined, 'Me molestó');
	await ir(page, 'Anotaciones');
	await expect(entrada(page, '08:06')).toHaveText(textoDe('08:06', 'Me molestó', 'Pendientes'));

	// Paso 5: los espacios a los lados se recortan; solo espacios queda sin texto.
	await en(page, '2026-07-15T08:07:00');
	await ir(page, 'Pendientes');
	await anotar(page, '   espacios   ', 'Me molestó');
	await en(page, '2026-07-15T08:08:00');
	await anotar(page, '     ', 'Me molestó');
	await ir(page, 'Anotaciones');
	await expect(entrada(page, '08:07')).toHaveText(textoDe('08:07', 'Me molestó', 'Pendientes', undefined, 'espacios'));
	await expect(entrada(page, '08:08')).toHaveText(textoDe('08:08', 'Me molestó', 'Pendientes'));

	// Paso 6: 300 caracteres, completos y sin error.
	const largo = 'abcdefghij'.repeat(30);
	await en(page, '2026-07-15T08:09:00');
	await ir(page, 'Pendientes');
	await anotar(page, largo);
	await ir(page, 'Anotaciones');
	await expect(entrada(page, '08:09')).toContainText(largo);
	await expect(page.getByRole('alert')).toHaveCount(0);

	// Paso 7: cada pantalla queda registrada.
	let minuto = 10;
	for (const p of ['Historial', 'Etiquetas', 'Anotaciones'] as const) {
		const hora = `08:${minuto}`;
		await en(page, `2026-07-15T${hora}:00`);
		await ir(page, p);
		await anotar(page, `desde ${p}`);
		minuto++;
	}
	await ir(page, 'Anotaciones');
	await expect(entrada(page, '08:10')).toHaveText(textoDe('08:10', 'Me sirvió', 'Historial', undefined, 'desde Historial'));
	await expect(entrada(page, '08:11')).toHaveText(textoDe('08:11', 'Me sirvió', 'Etiquetas', undefined, 'desde Etiquetas'));
	await expect(entrada(page, '08:12')).toHaveText(textoDe('08:12', 'Me sirvió', 'Anotaciones', undefined, 'desde Anotaciones'));
});

test('Flujo 3: contexto con el panel y con el aviso', async ({ page }) => {
	await sesionConReloj(page, '2026-07-15T07:59:00');
	await en(page, '2026-07-15T07:59:30');
	await crearYVer(page, { titulo: 'Regar', tipo: 'No se repite' });
	await crearYVer(page, { titulo: 'Pagar', tipo: 'No se repite' });

	// Paso 1: con el panel de Regar abierto.
	await en(page, '2026-07-15T08:01:00');
	await abrir(page, 'Regar');
	await anotar(page);
	await cerrar(page);

	// Paso 2: panel de creación.
	await en(page, '2026-07-15T08:02:00');
	await page.getByRole('button', { name: '+' }).click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await anotar(page);
	await cerrar(page);

	await ir(page, 'Anotaciones');
	await expect(entrada(page, '08:01')).toHaveText(textoDe('08:01', 'Me sirvió', 'Panel de edición', 'Regar'));
	await expect(entrada(page, '08:02')).toHaveText(textoDe('08:02', 'Me sirvió', 'Panel de edición'));
});

test('Flujo 3 paso 3: el panel abierto sobre Historial dice Panel de edición', async ({ page }) => {
	await sesionConReloj(page, '2026-07-15T07:59:00');
	await crearYVer(page, { titulo: 'Regar', tipo: 'No se repite' });
	await completar(page, 'Regar');
	await en(page, '2026-07-15T08:03:00');
	await ir(page, 'Historial');
	// Desde el Historial el título de la entrada abre el panel de esa tarea; el panel cubre la barra (no hay forma de abrirlo sobre Etiquetas).
	await page.getByRole('listitem').filter({ hasText: 'Regar' }).getByRole('button', { name: 'Regar' }).click();
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await anotar(page);
	await cerrar(page);
	await expect(page.getByRole('heading', { name: 'Historial', level: 1 })).toBeVisible();
	await ir(page, 'Anotaciones');
	await expect(entrada(page, '08:03')).toHaveText(textoDe('08:03', 'Me sirvió', 'Panel de edición', 'Regar'));
});

test('Flujo 3 pasos 4 a 6: el aviso de deshacer y el contexto', async ({ page }) => {
	await sesionConReloj(page, '2026-07-15T07:59:00');
	await crearYVer(page, { titulo: 'Regar', tipo: 'No se repite' });
	await crearYVer(page, { titulo: 'Pagar', tipo: 'No se repite' });
	const aviso = page.getByRole('status').filter({ hasText: 'Completaste' });

	// Paso 4: a las 08:00:04 todavía cuenta el aviso; a las 08:00:05 ya no.
	await en(page, '2026-07-15T08:00:00');
	await completar(page, 'Regar');
	await expect(aviso).toContainText('Completaste «Regar»');
	await en(page, '2026-07-15T08:00:04');
	await expect(aviso).toBeVisible();
	await anotar(page);
	await en(page, '2026-07-15T08:00:05');
	await expect(aviso).toHaveCount(0, { timeout: 15_000 });
	await anotar(page);

	// Paso 5: el panel manda sobre el aviso; el panel de creación no tiene tarea.
	await en(page, '2026-07-15T08:10:00');
	await encenderCompletadas(page);
	await completar(page, 'Pagar');
	await expect(aviso).toContainText('Completaste «Pagar»');
	await abrir(page, 'Regar');
	await anotar(page);
	await cerrar(page);
	await page.getByRole('button', { name: '+' }).click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await en(page, '2026-07-15T08:10:01');
	await anotar(page);
	await cerrar(page);

	// Paso 6: la confirmación y el aviso se ven a la vez.
	await en(page, '2026-07-15T08:20:00');
	await crearYVer(page, { titulo: 'Barrer', tipo: 'No se repite' });
	await completar(page, 'Barrer');
	await expect(aviso).toContainText('Completaste «Barrer»');
	await botonAnotar(page).click();
	await recuadro(page).getByRole('button', { name: 'Me sirvió' }).click();
	await expect(confirmacion(page)).toBeVisible();
	await expect(aviso.getByRole('button', { name: 'Deshacer' })).toBeVisible();

	await ir(page, 'Anotaciones');
	await expect(entrada(page, '08:00')).toHaveCount(2);
	await expect(entrada(page, '08:00').filter({ hasText: 'Regar' })).toHaveCount(1);
	await expect(entrada(page, '08:10')).toHaveCount(2);
	await expect(entrada(page, '08:10').filter({ hasText: 'Regar' })).toHaveCount(1);
	await expect(entrada(page, '08:10').filter({ hasText: 'Panel de edición' })).toHaveCount(2);
});

test('Flujo 4: anotar no toca la tarea ni el panel', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await crearYVer(page, { titulo: 'Regar', tipo: 'No se repite' });

	// Pasos 1 y 2: el panel sigue igual y se cierra sin avisar.
	await abrir(page, 'Regar');
	await expect(page.getByLabel('Título')).toHaveValue('Regar');
	await anotar(page, 'algo');
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await expect(page.getByLabel('Título')).toHaveValue('Regar');
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
	await cerrar(page);
	await expect(page.getByRole('alertdialog')).toHaveCount(0);

	// Paso 3: un cambio sin guardar sigue siendo el único cambio.
	await abrir(page, 'Regar');
	await page.getByLabel('Título').fill('Regar mucho');
	await anotar(page);
	await expect(page.getByLabel('Título')).toHaveValue('Regar mucho');
	await page.getByRole('button', { name: 'Cerrar' }).click();
	const aviso = page.getByRole('alertdialog', { name: 'Tenés cambios sin guardar' });
	await expect(aviso).toBeVisible();
	await aviso.getByRole('button', { name: 'Descartar', exact: true }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);

	// Paso 4: no cambia de pantalla ni de pestaña.
	await ir(page, 'Historial');
	await anotar(page);
	await expect(page.getByRole('heading', { name: 'Historial', level: 1 })).toBeVisible();
	await ir(page, 'Pendientes');
	await abrir(page, 'Regar');
	const cuando = page.getByRole('tab', { name: /^Cuándo/ });
	if ((await cuando.count()) > 0) {
		await cuando.click();
		await anotar(page);
		await expect(cuando).toHaveAttribute('aria-selected', 'true');
	} else {
		await anotar(page);
		await expect(page.getByRole('radio', { name: 'No se repite' })).toBeChecked();
	}
	await cerrar(page);
});

test('Flujo 5: Atrás y cerrar sin anotar', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await crearYVer(page, { titulo: 'Regar', tipo: 'No se repite' });
	await crear(page, { titulo: 'Pagar', tipo: 'No se repite' });
	await completar(page, 'Pagar');

	// Paso 1: Atrás cierra el recuadro sin anotar.
	await botonAnotar(page).click();
	await recuadro(page).getByRole('textbox', { name: 'Texto' }).fill('a medias');
	await page.goBack();
	await expect(recuadro(page)).toHaveCount(0);
	await expect(confirmacion(page)).toHaveCount(0);
	await expect(page.getByRole('heading', { name: 'Pendientes', level: 1 })).toBeVisible();
	await botonAnotar(page).click();
	await expect(recuadro(page).getByRole('textbox', { name: 'Texto' })).toHaveValue('');

	// Paso 2: Escape.
	await recuadro(page).getByRole('textbox', { name: 'Texto' }).fill('con escape');
	await page.keyboard.press('Escape');
	await expect(recuadro(page)).toHaveCount(0);
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
	await expect(confirmacion(page)).toHaveCount(0);
	await ir(page, 'Anotaciones');
	await expect(page.getByText('Todavía no hay anotaciones')).toBeVisible();
	await ir(page, 'Pendientes');

	// Paso 3: con el panel abierto, el primer Atrás cierra el recuadro y el segundo hace lo de siempre.
	await abrir(page, 'Regar');
	await botonAnotar(page).click();
	await expect(recuadro(page)).toBeVisible();
	await page.goBack();
	await expect(recuadro(page)).toHaveCount(0);
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await page.goBack();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
	await abrir(page, 'Regar');
	await page.getByLabel('Título').fill('Regar cambiado');
	await botonAnotar(page).click();
	await expect(recuadro(page)).toBeVisible();
	await page.goBack();
	await expect(recuadro(page)).toHaveCount(0);
	await expect(page.getByLabel('Título')).toHaveValue('Regar cambiado');
	await page.goBack();
	await expect(page.getByRole('alertdialog', { name: 'Tenés cambios sin guardar' })).toBeVisible();
	await page.getByRole('alertdialog').getByRole('button', { name: 'Descartar', exact: true }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);

	// Paso 4: con el panel cerrado, en cada pantalla la app se queda en ella.
	for (const p of ['Historial', 'Etiquetas', 'Anotaciones'] as const) {
		await ir(page, p);
		await botonAnotar(page).click();
		await expect(recuadro(page)).toBeVisible();
		await page.goBack();
		await expect(recuadro(page)).toHaveCount(0);
		await expect(page.getByRole('heading', { name: p, level: 1 })).toBeVisible();
	}

	// Paso 5: ningún Atrás de más, y Adelante no reabre nada.
	await ir(page, 'Historial');
	for (let i = 0; i < 3; i++) {
		await botonAnotar(page).click();
		await expect(recuadro(page)).toBeVisible();
		await page.goBack();
		await expect(recuadro(page)).toHaveCount(0);
	}
	await expect(page).toHaveURL(/\/historial$/);
	await page.goBack();
	await expect(page).toHaveURL(/\/anotaciones$|\/etiquetas$/);
	await page.goForward();
	await expect(page).toHaveURL(/\/historial$/);
	await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('Flujo 5 paso 6: los diálogos de Historial y Etiquetas se comportan como antes', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await crearYVer(page, { titulo: 'Regar', tipo: 'No se repite', etiquetas: ['Casa'] });
	await completar(page, 'Regar');
	await ir(page, 'Historial');
	await expect(page.getByRole('listitem').filter({ hasText: 'Regar' }).getByRole('button', { name: 'Borrar' })).toBeVisible();
	await page.getByRole('listitem').filter({ hasText: 'Regar' }).getByRole('button', { name: 'Borrar' }).click();
	await expect(page.getByRole('alertdialog')).toBeVisible();
	await page.goBack();
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
	await expect(page).toHaveURL(/\/$/);

	await ir(page, 'Etiquetas');
	await page.getByRole('button', { name: 'Renombrar' }).first().click();
	await expect(page.getByRole('dialog')).toBeVisible();
	await page.goBack();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(page).toHaveURL(/\/$/);

	await ir(page, 'Etiquetas');
	await page.getByRole('button', { name: 'Borrar' }).first().click();
	await expect(page.getByRole('alertdialog')).toBeVisible();
	await page.goBack();
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
	await expect(page).toHaveURL(/\/$/);
});

/** Las tres anotaciones del Flujo 6, con el reloj puesto en cada una. */
async function crearAnotacionesDelFlujo6(page: Page) {
	await sesionConReloj(page, '2026-07-14T21:29:00');
	await anotacionesDelFlujo6(page);
}

async function anotacionesDelFlujo6(page: Page) {
	await en(page, '2026-07-14T21:29:30');
	await ir(page, 'Pendientes');
	await crearYVer(page, { titulo: 'Regar', emoji: '🌱', tipo: 'No se repite' });
	await en(page, '2026-07-14T21:30:00');
	await ir(page, 'Etiquetas');
	await anotar(page, 'muy lento');
	await en(page, '2026-07-15T08:05:00');
	await ir(page, 'Pendientes');
	await abrir(page, 'Regar');
	await anotar(page, 'quedó lindo');
	await cerrar(page);
	await en(page, '2026-07-15T09:10:00');
	await ir(page, 'Historial');
	await anotar(page, undefined, 'Me molestó');
}

test('Flujo 6: la pantalla Anotaciones', async ({ page }) => {
	await sesionConReloj(page, HOY);
	// Paso 1: sin anotaciones.
	await ir(page, 'Anotaciones');
	await expect(page.getByText('Todavía no hay anotaciones')).toBeVisible();
	await expect(page.getByRole('list')).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Copiar' })).toHaveCount(1);
	const antes = await page.getByRole('navigation').innerText();

	// Pasos 2 y 3.
	await anotacionesDelFlujo6(page);
	await ir(page, 'Anotaciones');
	await expect(page.getByRole('heading', { level: 2 })).toHaveText(['Hoy', 'Ayer']);
	await expect(entradas(page)).toHaveText([
		textoDe('09:10', 'Me molestó', 'Historial'),
		textoDe('08:05', 'Me sirvió', 'Panel de edición', '🌱 Regar', 'quedó lindo'),
		textoDe('21:30', 'Me sirvió', 'Etiquetas', undefined, 'muy lento')
	]);

	// Paso 4: el reloj avanza y los grupos se renombran.
	await en(page, '2026-07-16T00:00:00');
	await expect(page.getByRole('heading', { level: 2 })).toHaveText(['Ayer', 'martes 14 de julio']);
	await en(page, '2027-01-02T10:00:00');
	await expect(page.getByRole('heading', { level: 2 })).toHaveText(['miércoles 15 de julio de 2026', 'martes 14 de julio de 2026']);
	await en(page, '2026-07-15T10:00:00');
	await expect(page.getByRole('heading', { level: 2 })).toHaveText(['Hoy', 'Ayer']);

	// Paso 5: el nombre actual de la tarea.
	await ir(page, 'Pendientes');
	await editar(page, 'Regar', { titulo: 'Plantas' });
	await ir(page, 'Anotaciones');
	await expect(entrada(page, '08:05')).toHaveText(textoDe('08:05', 'Me sirvió', 'Panel de edición', '🌱 Plantas', 'quedó lindo'));

	// Paso 6: nada cambia en la barra por haber anotado.
	expect(await page.getByRole('navigation').innerText()).toBe(antes);
	await expect(page.getByRole('navigation').getByRole('link')).toHaveText(['Pendientes', 'Historial', 'Etiquetas', 'Anotaciones']);
});

test('Flujo 7: editar el texto', async ({ page }) => {
	await crearAnotacionesDelFlujo6(page);
	await ir(page, 'Anotaciones');
	const dialogo = page.getByRole('dialog', { name: 'Editar texto' });
	const editarTexto = async (hora: string, valor: string) => {
		await entrada(page, hora).getByRole('button', { name: 'Editar texto' }).click();
		await dialogo.getByRole('textbox').fill(valor);
		await dialogo.getByRole('button', { name: 'Guardar' }).click();
		await expect(dialogo).toHaveCount(0);
	};

	// Paso 1.
	await entrada(page, '08:05').getByRole('button', { name: 'Editar texto' }).click();
	await expect(dialogo.getByRole('textbox')).toHaveValue('quedó lindo');
	await dialogo.getByRole('textbox').fill('quedó mal');
	await dialogo.getByRole('button', { name: 'Guardar' }).click();
	await expect(entradas(page)).toHaveText([
		textoDe('09:10', 'Me molestó', 'Historial'),
		textoDe('08:05', 'Me sirvió', 'Panel de edición', '🌱 Regar', 'quedó mal'),
		textoDe('21:30', 'Me sirvió', 'Etiquetas', undefined, 'muy lento')
	]);
	await expect(page.getByRole('heading', { level: 2 })).toHaveText(['Hoy', 'Ayer']);

	// Paso 2.
	await entrada(page, '09:10').getByRole('button', { name: 'Editar texto' }).click();
	await expect(dialogo.getByRole('textbox')).toHaveValue('');
	await dialogo.getByRole('textbox').fill('  ayer lo vi  ');
	await dialogo.getByRole('button', { name: 'Guardar' }).click();
	await expect(entrada(page, '09:10')).toHaveText(textoDe('09:10', 'Me molestó', 'Historial', undefined, 'ayer lo vi'));

	// Paso 3.
	await editarTexto('08:05', '');
	await expect(entrada(page, '08:05')).toHaveText(textoDe('08:05', 'Me sirvió', 'Panel de edición', '🌱 Regar'));
	await editarTexto('09:10', '   ');
	await expect(entrada(page, '09:10')).toHaveText(textoDe('09:10', 'Me molestó', 'Historial'));
	await expect(page.getByRole('alert')).toHaveCount(0);
	await editarTexto('08:05', 'quedó bien');

	// Paso 4: persisten al recargar.
	await llegaAlServidor(page);
	await page.reload();
	await expect(entradas(page)).toHaveText([
		textoDe('09:10', 'Me molestó', 'Historial'),
		textoDe('08:05', 'Me sirvió', 'Panel de edición', '🌱 Regar', 'quedó bien'),
		textoDe('21:30', 'Me sirvió', 'Etiquetas', undefined, 'muy lento')
	]);
});

test('Flujo 8: borrar una anotación', async ({ page }) => {
	await crearAnotacionesDelFlujo6(page);
	await ir(page, 'Anotaciones');
	const confirmar = page.getByRole('alertdialog');

	// Pasos 1 y 2.
	await entrada(page, '08:05').getByRole('button', { name: 'Borrar' }).click();
	await expect(confirmar.getByRole('button', { name: 'Borrar' })).toBeVisible();
	await confirmar.getByRole('button', { name: 'Cancelar' }).click();
	await expect(confirmar).toHaveCount(0);
	await expect(entradas(page)).toHaveCount(3);
	await expect(entrada(page, '08:05')).toHaveText(textoDe('08:05', 'Me sirvió', 'Panel de edición', '🌱 Regar', 'quedó lindo'));

	// Paso 3.
	await entrada(page, '08:05').getByRole('button', { name: 'Borrar' }).click();
	await confirmar.getByRole('button', { name: 'Borrar' }).click();
	await expect(confirmar).toHaveCount(0);
	await expect(entradas(page)).toHaveText([
		textoDe('09:10', 'Me molestó', 'Historial'),
		textoDe('21:30', 'Me sirvió', 'Etiquetas', undefined, 'muy lento')
	]);
	await ir(page, 'Pendientes');
	await expect(fila(page, 'Regar')).toBeVisible();
	await ir(page, 'Anotaciones');

	// Paso 4.
	for (const hora of ['09:10', '21:30']) {
		await entrada(page, hora).getByRole('button', { name: 'Borrar' }).click();
		await confirmar.getByRole('button', { name: 'Borrar' }).click();
		await expect(confirmar).toHaveCount(0);
	}
	await expect(page.getByText('Todavía no hay anotaciones')).toBeVisible();
	await expect(entradas(page)).toHaveCount(0);
});

test('Flujo 9: copiar', async ({ page }) => {
	await conPermisos(page);
	await sesionConReloj(page, '2026-07-15T07:59:00');
	await crearYVer(page, { titulo: 'Regar', emoji: '🌱', tipo: 'No se repite' });
	await en(page, '2026-07-15T08:05:00');
	await abrir(page, 'Regar');
	await anotar(page, 'quedó lindo');
	await cerrar(page);
	await en(page, '2026-07-15T09:10:00');
	await ir(page, 'Historial');
	await anotar(page, undefined, 'Me molestó');
	await ir(page, 'Anotaciones');
	await expect(entradas(page)).toHaveCount(2);

	// Pasos 1 y 2.
	await page.getByRole('button', { name: 'Copiar' }).click();
	await expect(copiadas(page)).toBeVisible();
	await expect(copiadas(page).getByRole('button')).toHaveCount(0);
	expect((await portapapeles(page)).split('\n')).toEqual([
		'2026-07-15 08:05 · Me sirvió · Panel de edición · 🌱 Regar · quedó lindo',
		'2026-07-15 09:10 · Me molestó · Historial'
	]);
	await expect(copiadas(page)).toHaveCount(0, { timeout: 15_000 });

	// Paso 3.
	await ir(page, 'Pendientes');
	await editar(page, 'Regar', { titulo: 'Plantas' });
	await ir(page, 'Anotaciones');
	await page.getByRole('button', { name: 'Copiar' }).click();
	await expect(copiadas(page)).toBeVisible();
	expect((await portapapeles(page)).split('\n')[0]).toContain('🌱 Plantas');
	await expect(copiadas(page)).toHaveCount(0, { timeout: 15_000 });

	// Paso 4: sin conexión.
	await page.context().setOffline(true);
	await page.getByRole('button', { name: 'Copiar' }).click();
	await expect(copiadas(page)).toBeVisible();
	await page.context().setOffline(false);
	await expect(copiadas(page)).toHaveCount(0, { timeout: 15_000 });

	// Paso 5: sin anotaciones no copia nada.
	for (const hora of ['09:10', '08:05']) {
		await entrada(page, hora).getByRole('button', { name: 'Borrar' }).click();
		await page.getByRole('alertdialog').getByRole('button', { name: 'Borrar' }).click();
		await expect(page.getByRole('alertdialog')).toHaveCount(0);
	}
	await expect(page.getByText('Todavía no hay anotaciones')).toBeVisible();
	await page.evaluate(() => navigator.clipboard.writeText('previo'));
	await page.getByRole('button', { name: 'Copiar' }).click();
	await page.waitForTimeout(1500);
	await expect(copiadas(page)).toHaveCount(0);
	expect(await portapapeles(page)).toBe('previo');
});

test('Flujo 10: borrar una tarea borra sus anotaciones', async ({ page }) => {
	await conPermisos(page);
	await sesionConReloj(page, '2026-07-15T07:59:00');
	await encenderCompletadas(page);
	await crearYVer(page, { titulo: 'Regar', tipo: 'No se repite' });
	await crearYVer(page, { titulo: 'Pagar', tipo: 'No se repite' });
	await en(page, '2026-07-15T08:01:00');
	await abrir(page, 'Regar');
	await anotar(page, 'r1');
	await en(page, '2026-07-15T08:02:00');
	await anotar(page, 'r2');
	await cerrar(page);
	await en(page, '2026-07-15T08:03:00');
	await abrir(page, 'Pagar');
	await anotar(page, 'p1');
	await cerrar(page);
	await en(page, '2026-07-15T08:04:00');
	await anotar(page, 'suelta');
	await completar(page, 'Regar');
	await ir(page, 'Anotaciones');
	await expect(entradas(page)).toHaveCount(4);

	// Paso 1: pasado el aviso de deshacer.
	await en(page, '2026-07-15T08:10:00');
	await ir(page, 'Pendientes');
	await borrar(page, 'Regar');

	// Paso 2.
	await ir(page, 'Anotaciones');
	await expect(entradas(page)).toHaveText([
		textoDe('08:04', 'Me sirvió', 'Pendientes', undefined, 'suelta'),
		textoDe('08:03', 'Me sirvió', 'Panel de edición', 'Pagar', 'p1')
	]);
	await page.getByRole('button', { name: 'Copiar' }).click();
	await expect(copiadas(page)).toBeVisible();
	expect((await portapapeles(page)).split('\n')).toEqual([
		'2026-07-15 08:03 · Me sirvió · Panel de edición · Pagar · p1',
		'2026-07-15 08:04 · Me sirvió · Pendientes · suelta'
	]);

	// Paso 3.
	await ir(page, 'Historial');
	await expect(page.getByText('Todavía no completaste nada')).toBeVisible();
});

test('Flujo 11: dos dispositivos, anotar sin conexión', async ({ browser }) => {
	const d = await dosDispositivos(browser, '2026-07-15T08:04:00');
	try {
		// Sin service worker, B tiene que haber cargado sus pantallas antes de quedarse sin conexión.
		await ir(d.b, 'Anotaciones');
		await ir(d.b, 'Historial');
		await d.ctxB.setOffline(true);
		await en(d.a, '2026-07-15T08:05:00');
		await anotar(d.a, 'desde A', 'Me sirvió');
		await en(d.b, '2026-07-15T08:06:00');
		await anotar(d.b, 'desde B', 'Me molestó');
		await llegaAlServidor(d.a);
		await d.ctxB.setOffline(false);
		for (const p of [d.a, d.b]) {
			await ir(p, 'Anotaciones');
			await expect(entradas(p)).toHaveText([
				textoDe('08:06', 'Me molestó', 'Historial', undefined, 'desde B'),
				textoDe('08:05', 'Me sirvió', 'Pendientes', undefined, 'desde A')
			]);
		}
	} finally {
		await d.cerrar();
	}
});

test('Flujo 12: dos dispositivos, edición contra borrado y tarea borrada', async ({ browser }) => {
	const d = await dosDispositivos(browser, '2026-07-15T08:00:00');
	try {
		await crearYVer(d.a, { titulo: 'Regar', tipo: 'No se repite' });
		await expect(fila(d.b, 'Regar')).toBeVisible();
		await anotar(d.a, 'quedó lindo');
		await ir(d.a, 'Anotaciones');
		await ir(d.b, 'Anotaciones');
		await expect(entradas(d.b)).toHaveCount(1);
		const dialogo = (p: Page) => p.getByRole('dialog', { name: 'Editar texto' });
		const editarTexto = async (p: Page, valor: string) => {
			await entradas(p).first().getByRole('button', { name: 'Editar texto' }).click();
			await dialogo(p).getByRole('textbox').fill(valor);
			await dialogo(p).getByRole('button', { name: 'Guardar' }).click();
			await expect(dialogo(p)).toHaveCount(0);
		};
		const texto = (p: Page, t: string) => expect(entradas(p)).toHaveText([new RegExp(`${t}\\s*Editar texto\\s*Borrar$`)]);

		// Paso 2: gana el último cambio.
		await d.ctxB.setOffline(true);
		await editarTexto(d.a, 'uno');
		await llegaAlServidor(d.a);
		await editarTexto(d.b, 'dos');
		await d.ctxB.setOffline(false);
		await texto(d.a, 'dos');
		await texto(d.b, 'dos');

		// Paso 3: borrar gana.
		await llegaAlServidor(d.a);
		await d.ctxB.setOffline(true);
		await entradas(d.a).first().getByRole('button', { name: 'Borrar' }).click();
		await d.a.getByRole('alertdialog').getByRole('button', { name: 'Borrar' }).click();
		await expect(entradas(d.a)).toHaveCount(0);
		await llegaAlServidor(d.a);
		await editarTexto(d.b, 'tres');
		await d.ctxB.setOffline(false);
		await expect(entradas(d.a)).toHaveCount(0);
		await expect(entradas(d.b)).toHaveCount(0);
		await llegaAlServidor(d.a);
		await expect(entradas(d.b)).toHaveCount(0);

		// Paso 4: anotación sobre una tarea ya borrada.
		await ir(d.a, 'Pendientes');
		await ir(d.b, 'Pendientes');
		await anotar(d.a, 'queda');
		await expect(fila(d.b, 'Regar')).toBeVisible();
		await d.ctxB.setOffline(true);
		await ir(d.a, 'Pendientes');
		await borrar(d.a, 'Regar');
		await llegaAlServidor(d.a);
		await abrir(d.b, 'Regar');
		await anotar(d.b, 'huérfana');
		await cerrar(d.b);
		await d.ctxB.setOffline(false);
		await expect(fila(d.b, 'Regar')).toHaveCount(0);
		await conPermisos(d.a);
		await conPermisos(d.b);
		for (const p of [d.a, d.b]) {
			await ir(p, 'Anotaciones');
			await expect(entradas(p)).toHaveCount(1, { timeout: 30_000 });
			await expect(p.getByText('huérfana')).toHaveCount(0);
			await expect(entradas(p).first()).toContainText('queda');
			await p.getByRole('button', { name: 'Copiar' }).click();
			await expect(copiadas(p)).toBeVisible();
			const copiado = await portapapeles(p);
			expect(copiado.split('\n')).toHaveLength(1);
			expect(copiado).not.toContain('huérfana');
		}
	} finally {
		await d.cerrar();
	}
});

test('Flujo 13: la app nunca pide una anotación', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await crearYVer(page, { titulo: 'Regar', tipo: 'No se repite' });
	await crearYVer(page, { titulo: 'Pagar', tipo: 'No se repite' });

	// Paso 1: una semana sin anotar.
	const sinAvisos = async () => {
		await expect(page.getByRole('alert')).toHaveCount(0);
		await expect(page.getByRole('alertdialog')).toHaveCount(0);
		await expect(page.getByRole('dialog')).toHaveCount(0);
		await expect(page.getByRole('status').filter({ hasNotText: /Completaste/ })).toHaveCount(0);
		await expect(page.getByRole('navigation').getByRole('link')).toHaveText(['Pendientes', 'Historial', 'Etiquetas', 'Anotaciones']);
		await expect(botonAnotar(page)).toHaveText('Anotar');
	};
	await completar(page, 'Regar');
	await adelantar(page, '2026-07-18T08:00:00');
	await sinAvisos();
	await completar(page, 'Pagar').catch(() => {});
	await adelantar(page, '2026-07-22T08:00:00');
	for (const p of ['Historial', 'Etiquetas', 'Anotaciones', 'Pendientes'] as const) {
		await ir(page, p);
		await sinAvisos();
	}

	// Paso 2: el botón se ve idéntico con 20 anotaciones.
	const apariencia = async () => ({
		imagen: (await botonAnotar(page).screenshot()).toString('base64'),
		estilo: await botonAnotar(page).evaluate((e) => {
			const s = getComputedStyle(e);
			return [s.color, s.backgroundColor, s.border, s.fontSize, s.fontWeight, e.textContent].join('|');
		}),
		caja: await botonAnotar(page).boundingBox()
	});
	const sin = await apariencia();
	for (let i = 0; i < 20; i++) await anotar(page, `nota ${i}`);
	await expect(confirmacion(page)).toHaveCount(0, { timeout: 15_000 });
	await ir(page, 'Anotaciones');
	await expect(entradas(page)).toHaveCount(20);
	await ir(page, 'Pendientes');
	const con = await apariencia();
	expect(con).toEqual(sin);
	await sinAvisos();
	// Quedó sin conexión de red a Auth: nada más que ver.
	void descartar;
});
