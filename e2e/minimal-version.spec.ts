import { expect, test, type Browser, type Locator, type Page } from '@playwright/test';
import {
	abrirPestana,
	adelantar,
	cerrar,
	completarPanel,
	crear,
	dispositivo,
	dosDispositivos,
	elegirEmoji,
	encenderCompletadas,
	esperarEstado,
	irA,
	limpiarEmuladores,
	llegaAlServidor,
	sesionConReloj,
	type Definicion
} from './support';

// qa/version-minima.md: el campo del panel, la línea y el botón «Hice la mínima» de la fila, completar con la mínima,
// con pasos, Historial y Borrar, lo que no cambia y lo que no lo muestra, Cambios sin guardar y dos dispositivos.

test.beforeEach(async () => {
	await limpiarEmuladores();
});

const VIERNES = '2026-11-13T10:00:00';
const NO_SE_REPITE = 'No se repite' as const;
const P1 = 'Separar la ropa blanca';
const P2 = 'Poner el lavarropas';
const P3 = 'Tender la ropa';
const LARGO =
	'Abrir el cajón de abajo y sacar toda la ropa blanca y separarla en dos pilas: la que va con agua caliente y la que no se mezcla con nada de color oscuro ni delicado';

/** La fila de la tarea de título exacto `t` (las demás filas pueden contener ese texto). */
const f = (page: Page, t: string): Locator =>
	page.getByRole('listitem').filter({ has: page.getByRole('button', { name: t, exact: true }) });
const linea = (page: Page, t: string) => f(page, t).getByText(/^Mínima: /);
const hice = (page: Page, t: string) => f(page, t).getByRole('button', { name: 'Hice la mínima', exact: true });
const lineaDePaso = (page: Page, t: string) => f(page, t).getByText(/^(Primer paso|Paso): /);
const hecho = (page: Page, t: string) => f(page, t).getByRole('button', { name: 'Hecho', exact: true });
const anterior = (page: Page, t: string) => f(page, t).getByRole('button', { name: 'Paso anterior', exact: true });
const check = (page: Page, t: string) => f(page, t).getByRole('checkbox');
const aviso = (page: Page) => page.getByRole('status').filter({ hasText: 'Completaste' });
const deshacer = (page: Page) => aviso(page).getByRole('button', { name: 'Deshacer' });
const boton = (page: Page, nombre: string) => page.getByRole('button', { name: nombre, exact: true });
const minima = (page: Page) => page.getByRole('textbox', { name: 'Versión mínima', exact: true });
const mostrarPausadas = (page: Page) => page.getByRole('checkbox', { name: 'Pausadas' });
const panel = (page: Page) => page.getByRole('dialog');
const avisoDeCambios = (page: Page) => page.getByRole('alertdialog', { name: 'Tenés cambios sin guardar' });
const titulos = (page: Page) =>
	page
		.getByRole('listitem')
		.getByRole('checkbox')
		.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')!.replace('Completar ', '')));

/** La fila dice exactamente `Mínima: m`, una sola vez, y tiene Hice la mínima. */
async function dice(page: Page, t: string, m: string) {
	await expect(linea(page, t)).toHaveCount(1);
	await expect(linea(page, t)).toHaveText(`Mínima: ${m}`);
	await expect(hice(page, t)).toHaveCount(1);
}

/** La fila está a la vista y no tiene la línea ni el botón. */
async function sinMinima(page: Page, t: string) {
	await expect(f(page, t)).toBeVisible();
	await expect(f(page, t)).not.toContainText('Mínima');
	await expect(hice(page, t)).toHaveCount(0);
}

async function abrirFila(page: Page, t: string) {
	await f(page, t).getByRole('button', { name: t, exact: true }).click();
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await abrirPestana(page, 'Tarea');
}

async function guardar(page: Page) {
	await boton(page, 'Guardar').click();
	await expect(panel(page)).toHaveCount(0);
}

/** Abre la fila, escribe la versión mínima `m` (o la deja vacía) y guarda. */
async function escribirMinima(page: Page, t: string, m: string) {
	await abrirFila(page, t);
	await minima(page).fill(m);
	await guardar(page);
}

/** Abre la fila y verifica el valor de Versión mínima; cierra sin cambios. */
async function panelTiene(page: Page, t: string, m: string) {
	await abrirFila(page, t);
	await expect(minima(page)).toHaveValue(m);
	await cerrar(page);
}

async function pegar(page: Page, campo: Locator, texto: string) {
	await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.evaluate((x) => navigator.clipboard.writeText(x), texto);
	await campo.focus();
	await page.keyboard.press('ControlOrMeta+A');
	await page.keyboard.press('ControlOrMeta+V');
}

const estilo = (l: Locator) =>
	l.evaluate((e) => {
		const s = getComputedStyle(e);
		return {
			color: s.color,
			tamano: s.fontSize,
			peso: Number(s.fontWeight),
			linea: s.textDecorationLine,
			fondo: s.backgroundColor,
			recorte: s.textOverflow,
			maxAlto: s.maxHeight,
			clamp: s.getPropertyValue('-webkit-line-clamp')
		};
	});

async function pausar(page: Page, t: string) {
	await abrirFila(page, t);
	await boton(page, 'Pausar').click();
	await expect(panel(page)).toHaveCount(0);
}

async function reanudar(page: Page, t: string) {
	await abrirFila(page, t);
	await boton(page, 'Reanudar').click();
	await expect(panel(page)).toHaveCount(0);
}

async function posponer(page: Page, t: string, opcion: '3 horas' | 'Hasta mañana') {
	await abrirFila(page, t);
	await boton(page, opcion).click();
	await expect(panel(page)).toHaveCount(0);
}

/** Sesión con el reloj corriendo en `hora`; con `completadas`, Mostrar completadas encendido. */
async function sesion(page: Page, hora: string, completadas = false) {
	await sesionConReloj(page, hora);
	if (completadas) await encenderCompletadas(page);
}

/** Avanza el reloj hasta `hora` y deja correr un segundo para que la pantalla se actualice sola. */
async function ir(page: Page, hora: string) {
	const falta = new Date(hora).getTime() - (await page.evaluate(() => Date.now()));
	if (falta <= 10_000) await page.clock.runFor(falta);
	else await adelantar(page, hora);
	await page.clock.runFor(1000);
}

/** Fija la hora justo antes del gesto que cuenta (el reloj de la prueba avanza unos ms por cada espera). */
const fijar = (page: Page, hora: string) => page.clock.setSystemTime(new Date(hora));

/** Deja pasar los 5 segundos del aviso. */
async function pasaElAviso(page: Page) {
	await page.clock.runFor(6000);
	await expect(aviso(page)).toHaveCount(0);
}

async function borrarDelHistorial(page: Page, t: string) {
	await page
		.getByRole('listitem')
		.filter({ hasText: new RegExp(`^${t}\\s*\\d\\d:\\d\\d`) })
		.getByRole('button', { name: 'Borrar', exact: true })
		.click();
	const dialogo = page.getByRole('alertdialog');
	await dialogo.getByRole('button', { name: 'Borrar', exact: true }).click();
	await expect(dialogo).toHaveCount(0);
}

test('Flujo 1: el campo en el panel, crear y editar', async ({ page }) => {
	await sesionConReloj(page, VIERNES);
	const y = async (l: Locator) => (await l.boundingBox())!.y;
	const ascendente = (ys: number[]) => {
		expect(ys).toEqual([...ys].sort((a, b) => a - b));
		expect(new Set(ys).size).toBe(ys.length);
	};

	// 1
	await boton(page, '+').click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await expect(minima(page)).toBeVisible();
	await expect(minima(page)).toHaveValue('');
	await expect(minima(page)).toHaveJSProperty('placeholder', '');
	const titulo = page.getByLabel('Título');
	const emoji = page.getByRole('button', { name: /^(Elegir emoji|Cambiar emoji)/ });
	const primero = page.getByRole('textbox', { name: 'Primer paso', exact: true });
	const nota = page.getByLabel('Nota');
	await expect(emoji).toBeVisible();
	ascendente([
		await y(titulo),
		await y(primero),
		await y(boton(page, 'Agregar paso')),
		await y(minima(page)),
		await y(nota)
	]);
	expect(Math.abs((await y(emoji)) - (await y(titulo)))).toBeLessThan((await y(primero)) - (await y(titulo)));
	await boton(page, 'Agregar paso').click();
	const paso2 = page.getByRole('textbox', { name: 'Paso 2', exact: true });
	await expect(paso2).toBeVisible();
	expect(await y(paso2)).toBeLessThan(await y(minima(page)));

	// 2
	await titulo.fill('Limpiar baño');
	await minima(page).fill('Solo el inodoro');
	await minima(page).press('Enter');
	await expect(panel(page)).toHaveCount(0);
	await dice(page, 'Limpiar baño', 'Solo el inodoro');

	// 3
	await abrirFila(page, 'Limpiar baño');
	await expect(minima(page)).toHaveValue('Solo el inodoro');
	await cerrar(page);
	await page.reload();
	await panelTiene(page, 'Limpiar baño', 'Solo el inodoro');

	// 4
	await escribirMinima(page, 'Limpiar baño', '  Solo el lavabo  ');
	await panelTiene(page, 'Limpiar baño', 'Solo el lavabo');
	await dice(page, 'Limpiar baño', 'Solo el lavabo');

	// 5
	await abrirFila(page, 'Limpiar baño');
	await pegar(page, minima(page), 'uno\ndos');
	expect(await minima(page).inputValue()).not.toContain('\n');
	await minima(page).press('Enter');
	await expect(panel(page)).toHaveCount(0);
	await abrirFila(page, 'Limpiar baño');
	expect(await minima(page).inputValue()).not.toContain('\n');
	expect(await minima(page).inputValue()).toMatch(/^uno ?dos$/);
	await cerrar(page);

	// 6
	await escribirMinima(page, 'Limpiar baño', '');
	await sinMinima(page, 'Limpiar baño');
	await panelTiene(page, 'Limpiar baño', '');
	await escribirMinima(page, 'Limpiar baño', 'Solo el inodoro');
	await dice(page, 'Limpiar baño', 'Solo el inodoro');
	await abrirFila(page, 'Limpiar baño');
	await minima(page).fill('   ');
	await boton(page, 'Guardar').click();
	await expect(panel(page)).toHaveCount(0);
	await expect(page.getByRole('alert')).toHaveCount(0);
	await expect(page.getByText(/no se pudo|rechaz|error|inválid/i)).toHaveCount(0);
	await sinMinima(page, 'Limpiar baño');
	await panelTiene(page, 'Limpiar baño', '');

	// 7
	const largo5000 = 'abcdefghij'.repeat(500);
	await abrirFila(page, 'Limpiar baño');
	await pegar(page, minima(page), largo5000);
	await boton(page, 'Guardar').click();
	await expect(panel(page)).toHaveCount(0);
	await expect(page.getByRole('alert')).toHaveCount(0);
	await abrirFila(page, 'Limpiar baño');
	expect((await minima(page).inputValue()).length).toBe(5000);
	await cerrar(page);

	// 8
	await crear(page, { titulo: 'Barrer', tipo: NO_SE_REPITE, fecha: '', versionMinima: '   ' });
	await sinMinima(page, 'Barrer');
	await expect(page.getByRole('alert')).toHaveCount(0);
	await crear(page, { titulo: 'Planchar', tipo: NO_SE_REPITE, fecha: '' });
	await sinMinima(page, 'Planchar');

	// 9
	await crear(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días', versionMinima: 'Solo los helechos' });
	await crear(page, { titulo: 'Basura', tipo: 'Días de la semana', dias: ['martes'], versionMinima: 'Solo la de la cocina' });
	await panelTiene(page, 'Regar', 'Solo los helechos');
	await panelTiene(page, 'Basura', 'Solo la de la cocina');
	await abrirFila(page, 'Regar');
	await abrirPestana(page, 'Tarea');
	await page.getByRole('radio', { name: NO_SE_REPITE }).check();
	await page.getByRole('radio', { name: 'Intervalo' }).check();
	await guardar(page);
	await panelTiene(page, 'Regar', 'Solo los helechos');

	// 10
	await escribirMinima(page, 'Limpiar baño', LARGO);
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(linea(page, 'Limpiar baño')).toHaveText(`Mínima: ${LARGO}`);
	await expect(linea(page, 'Limpiar baño')).toBeVisible();
	const caja = (await linea(page, 'Limpiar baño').boundingBox())!;
	expect(caja.x + caja.width).toBeLessThanOrEqual(390);
	const ln = await linea(page, 'Limpiar baño').evaluate((e) => {
		const lh = parseFloat(getComputedStyle(e).lineHeight) || parseFloat(getComputedStyle(e).fontSize) * 1.2;
		return { alto: e.getBoundingClientRect().height, lh, sobra: e.scrollWidth > e.clientWidth || e.scrollHeight > e.clientHeight };
	});
	expect(ln.alto).toBeGreaterThan(ln.lh * 1.5);
	expect(ln.sobra).toBe(false);
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
	const e10 = await estilo(linea(page, 'Limpiar baño'));
	expect(e10.recorte).not.toBe('ellipsis');
	expect(e10.maxAlto).toBe('none');
	expect(e10.clamp === '' || e10.clamp === 'none').toBe(true);
});

test('Flujo 2: la línea y el botón en la fila', async ({ page }) => {
	await sesion(page, VIERNES, false);
	await crear(page, { titulo: 'Lavar', tipo: NO_SE_REPITE, fecha: '', primerPaso: 'Separar la ropa blanca', versionMinima: 'Solo el inodoro' });
	await crear(page, { titulo: 'Barrer', tipo: NO_SE_REPITE, fecha: '', versionMinima: 'Solo el pasillo' });

	// 1
	await expect(lineaDePaso(page, 'Lavar')).toHaveText('Primer paso: Separar la ropa blanca');
	await dice(page, 'Lavar', 'Solo el inodoro');
	const yP = (await lineaDePaso(page, 'Lavar').boundingBox())!;
	const yM = (await linea(page, 'Lavar').boundingBox())!;
	expect(yM.y).toBeGreaterThanOrEqual(yP.y + yP.height - 2);
	await dice(page, 'Barrer', 'Solo el pasillo');
	await expect(lineaDePaso(page, 'Barrer')).toHaveCount(0);

	// 2
	const l = await estilo(linea(page, 'Lavar'));
	const p = await estilo(lineaDePaso(page, 'Lavar'));
	expect(l.color).toBe(p.color);
	expect(l.tamano).toBe(p.tamano);
	expect(l.peso).toBeLessThan(600);
	expect(l.linea).not.toContain('underline');
	const b = await estilo(hice(page, 'Lavar'));
	expect(b.color).toBe(l.color);
	expect(b.peso).toBeLessThan(600);
	expect(b.linea).not.toContain('underline');
	expect(b.fondo).toBe('rgba(0, 0, 0, 0)');
	const fondoB = (await estilo(f(page, 'Barrer'))).fondo;
	expect((await estilo(f(page, 'Lavar'))).fondo).toBe(fondoB);
	await expect(f(page, 'Barrer')).not.toContainText(/\d+ (vez|veces)|racha|contador|¿Probás|probá|probar/i);

	// 3
	const c = (await linea(page, 'Barrer').boundingBox())!;
	await page.mouse.click(c.x + 4, c.y + c.height / 2);
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await expect(page.getByLabel('Título')).toHaveValue('Barrer');
	await cerrar(page);
	await expect(avisoDeCambios(page)).toHaveCount(0);

	// 4
	await hice(page, 'Barrer').click();
	await expect(aviso(page)).toContainText('Completaste «Barrer» · mínima');
	await expect(panel(page)).toHaveCount(0);
	await expect(avisoDeCambios(page)).toHaveCount(0);
	await deshacer(page).click();
	await expect(check(page, 'Barrer')).not.toBeChecked();
	await dice(page, 'Barrer', 'Solo el pasillo');

	// 5
	await abrirFila(page, 'Lavar');
	await page.getByRole('button', { name: 'Agregar paso', exact: true }).click();
	await page.getByRole('textbox', { name: 'Paso 2', exact: true }).fill(P2);
	await page.getByRole('button', { name: 'Agregar paso', exact: true }).click();
	await page.getByRole('textbox', { name: 'Paso 3', exact: true }).fill(P3);
	await guardar(page);
	await expect(lineaDePaso(page, 'Lavar')).toHaveText('Primer paso: Separar la ropa blanca');
	await dice(page, 'Lavar', 'Solo el inodoro');
	await expect(hecho(page, 'Lavar')).toBeVisible();
	await hecho(page, 'Lavar').click();
	await expect(lineaDePaso(page, 'Lavar')).toHaveText(`Paso: ${P2}`);
	await dice(page, 'Lavar', 'Solo el inodoro');
	const yP2 = (await lineaDePaso(page, 'Lavar').boundingBox())!;
	expect((await linea(page, 'Lavar').boundingBox())!.y).toBeGreaterThanOrEqual(yP2.y + yP2.height - 2);
	await hecho(page, 'Lavar').click();
	await expect(lineaDePaso(page, 'Lavar')).toHaveText(`Paso: ${P3}`);
	await dice(page, 'Lavar', 'Solo el inodoro');

	// 6
	await encenderCompletadas(page);
	await mostrarPausadas(page).click();
	await expect(mostrarPausadas(page)).toBeChecked();
	await crear(page, { titulo: 'Cambiar foco', tipo: NO_SE_REPITE, fecha: '', versionMinima: 'Solo la lámpara' });
	await crear(page, { titulo: 'Pagar', tipo: NO_SE_REPITE, fecha: '2026-11-10', versionMinima: 'Solo la luz' });
	await crear(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '8', unidad: 'horas', versionMinima: 'Solo los helechos' });
	await esperarEstado(page, 'Pagar', 'atrasada', undefined, false);
	await dice(page, 'Pagar', 'Solo la luz');
	await expect(hice(page, 'Pagar')).toBeEnabled();
	await dice(page, 'Cambiar foco', 'Solo la lámpara');
	await expect(hice(page, 'Cambiar foco')).toBeEnabled();
	await dice(page, 'Regar', 'Solo los helechos');
	await expect(hice(page, 'Regar')).toBeEnabled();

	// 7
	await posponer(page, 'Cambiar foco', '3 horas');
	await sinMinima(page, 'Cambiar foco');
	await expect(check(page, 'Cambiar foco')).toBeEnabled();
	await posponer(page, 'Pagar', 'Hasta mañana');
	await sinMinima(page, 'Pagar');
	await check(page, 'Regar').click();
	await expect(check(page, 'Regar')).toBeChecked();
	await sinMinima(page, 'Regar');

	// 8
	await ir(page, '2026-11-13T13:01:00');
	await dice(page, 'Cambiar foco', 'Solo la lámpara');
	await sinMinima(page, 'Regar');
	await ir(page, '2026-11-13T18:01:00');
	await dice(page, 'Regar', 'Solo los helechos');

	// 9
	await pausar(page, 'Regar');
	await sinMinima(page, 'Regar');
	await expect(f(page, 'Regar').getByText('Pausada', { exact: true })).toBeVisible();
	await reanudar(page, 'Regar');
	await dice(page, 'Regar', 'Solo los helechos');

	// 10
	await check(page, 'Cambiar foco').click();
	await expect(check(page, 'Cambiar foco')).toBeChecked();
	await sinMinima(page, 'Cambiar foco');
	await check(page, 'Cambiar foco').click();
	await expect(check(page, 'Cambiar foco')).not.toBeChecked();
	await dice(page, 'Cambiar foco', 'Solo la lámpara');

	// 11
	await crear(page, { titulo: 'Basura', tipo: 'Días de la semana', dias: ['martes'], versionMinima: 'Solo la de la cocina' });
	await esperarEstado(page, 'Basura', 'en espera', undefined, false);
	await sinMinima(page, 'Basura');
	await ir(page, '2026-11-17T09:00:00');
	await dice(page, 'Basura', 'Solo la de la cocina');
	await expect(hice(page, 'Basura')).toBeEnabled();

	// 12
	await ir(page, '2026-11-17T09:30:00');
	await crear(page, { titulo: 'Llamar', tipo: NO_SE_REPITE, fecha: '', horario: { desde: '08:00', hasta: '09:00' }, versionMinima: 'Solo a mamá' });
	await esperarEstado(page, 'Llamar', 'en espera', undefined, false, false);
	await sinMinima(page, 'Llamar');
	await ir(page, '2026-11-18T08:30:00');
	await dice(page, 'Llamar', 'Solo a mamá');
	await expect(hice(page, 'Llamar')).toBeEnabled();

	// 13
	await crear(page, {
		titulo: 'Lavar la ropa',
		tipo: NO_SE_REPITE,
		fecha: '2026-11-10',
		horario: { desde: '08:00', hasta: '11:00' },
		versionMinima: 'Solo lo blanco'
	});
	await ir(page, '2026-11-19T07:00:00');
	await esperarEstado(page, 'Lavar la ropa', 'atrasada', undefined, false, false);
	await dice(page, 'Lavar la ropa', 'Solo lo blanco');
	await expect(hice(page, 'Lavar la ropa')).toBeDisabled();
	await hice(page, 'Lavar la ropa').click({ force: true });
	await expect(aviso(page)).toHaveCount(0);
	await expect(check(page, 'Lavar la ropa')).not.toBeChecked();
	await ir(page, '2026-11-19T08:30:00');
	await expect(check(page, 'Lavar la ropa')).toBeEnabled();
	await expect(hice(page, 'Lavar la ropa')).toBeEnabled();

	// 14
	const contadores = /\d+ (vez|veces)|racha|contador|×|probá|probar/i;
	const antes = await estilo(linea(page, 'Regar'));
	for (let i = 0; i < 2; i++) {
		await expect(hice(page, 'Regar')).toBeEnabled();
		await hice(page, 'Regar').click();
		await expect(aviso(page)).toContainText('Completaste «Regar» · mínima');
		await pasaElAviso(page);
		await expect(f(page, 'Regar')).not.toContainText('Mínima');
		await ir(page, new Date((await page.evaluate(() => Date.now())) + 9 * 3600_000 + 60_000).toISOString());
	}
	await dice(page, 'Regar', 'Solo los helechos');
	await expect(f(page, 'Regar')).not.toContainText(contadores);
	expect(await estilo(linea(page, 'Regar'))).toEqual(antes);
	await expect(f(page, 'Regar').getByRole('button')).toHaveText(['Regar', 'Hice la mínima']);
});

test('Flujo 3: hacer la mínima, aviso, regreso y deshacer', async ({ page, browser }) => {
	await sesion(page, '2026-11-13T09:00:00', true);
	await crear(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '8', unidad: 'horas', emoji: '🌱', versionMinima: 'Solo los helechos' });
	await crear(page, { titulo: 'Limpiar', tipo: NO_SE_REPITE, fecha: '', versionMinima: 'Solo el inodoro' });
	const R = '🌱 Regar';

	// 1
	await fijar(page, '2026-11-13T09:00:00');
	await hice(page, R).click();
	await expect(aviso(page)).toContainText('Completaste «🌱 Regar» · mínima');
	await expect(deshacer(page)).toBeVisible();
	await expect(aviso(page)).toContainText('Vuelve hoy 17:00 · en 8 horas');
	await expect(aviso(page)).not.toContainText('Solo los helechos');
	await esperarEstado(page, R, 'en espera');
	await sinMinima(page, R);

	// 2
	await deshacer(page).click();
	await expect(aviso(page)).toHaveCount(0);
	await esperarEstado(page, R, 'pendiente');
	await dice(page, R, 'Solo los helechos');

	// 3
	await fijar(page, '2026-11-13T09:00:00');
	await check(page, R).click();
	await expect(aviso(page)).toContainText('Completaste «🌱 Regar»');
	await expect(aviso(page)).not.toContainText('mínima');
	await expect(aviso(page)).toContainText('Vuelve hoy 17:00 · en 8 horas');
	await deshacer(page).click();
	await expect(aviso(page)).toHaveCount(0);
	await esperarEstado(page, R, 'pendiente');

	// 4
	await hice(page, 'Limpiar').click();
	await expect(aviso(page)).toContainText('Completaste «Limpiar» · mínima');
	await expect(aviso(page)).not.toContainText('Vuelve');
	await pasaElAviso(page);
	await expect(check(page, 'Limpiar')).toBeChecked();
	expect(await f(page, 'Limpiar').getByRole('button', { name: 'Limpiar', exact: true }).evaluate((e) => getComputedStyle(e).textDecorationLine)).toContain('line-through');
	expect((await titulos(page)).at(-1)).toBe('Limpiar');

	// 5
	await check(page, 'Limpiar').click();
	await expect(check(page, 'Limpiar')).not.toBeChecked();
	await expect(aviso(page)).toHaveCount(0);
	await dice(page, 'Limpiar', 'Solo el inodoro');

	// 6
	await fijar(page, '2026-11-13T09:00:00');
	await check(page, 'Limpiar').click();
	await expect(aviso(page)).toContainText('Completaste «Limpiar»');
	await fijar(page, '2026-11-13T09:00:00');
	await hice(page, R).click();
	await expect(aviso(page)).toHaveCount(1);
	await expect(aviso(page)).toContainText('Completaste «🌱 Regar» · mínima');
	await expect(aviso(page)).not.toContainText('Limpiar');

	// 7
	await esperarEstado(page, R, 'en espera');
	const barra = f(page, R).getByRole('progressbar');
	const antes = Number(await barra.getAttribute('aria-valuenow'));
	await ir(page, '2026-11-13T15:00:00');
	await esperarEstado(page, R, 'en espera');
	await expect.poll(async () => Number(await barra.getAttribute('aria-valuenow'))).toBeGreaterThan(antes);
	await ir(page, '2026-11-13T17:01:00');
	await esperarEstado(page, R, 'pendiente');
	await dice(page, R, 'Solo los helechos');

	// 8
	await fijar(page, '2026-11-13T09:30:00');
	await page.clock.runFor(1000);
	await esperarEstado(page, R, 'en espera');
	await expect(check(page, 'Limpiar')).toBeChecked();
	await check(page, 'Limpiar').click();
	await expect(check(page, 'Limpiar')).not.toBeChecked();
	await fijar(page, '2026-11-13T09:30:00');
	await check(page, 'Limpiar').click();
	await expect(check(page, 'Limpiar')).toBeChecked();
	await expect.poll(() => titulos(page)).toEqual(['Limpiar', R]);
	for (const t of ['Limpiar', R]) {
		const titulo = f(page, t).getByRole('button', { name: t, exact: true });
		expect(await titulo.evaluate((e) => getComputedStyle(e).textDecorationLine)).toContain('line-through');
	}

	// 9
	await abrirFila(page, R);
	await expect(page.getByText(/^Última vez/)).toHaveText('Última vez: hoy 09:00');
	await cerrar(page);

	// 10
	await limpiarEmuladores();
	const d = await dispositivo(browser, '2026-11-09T08:00:00', true);
	const p = d.page;
	await encenderCompletadas(p);
	await crear(p, { titulo: 'Basura', tipo: 'Días de la semana', dias: ['martes'], versionMinima: 'Solo la de la cocina' });
	await ir(p, '2026-11-10T09:00:00');
	await esperarEstado(p, 'Basura', 'pendiente');
	await dice(p, 'Basura', 'Solo la de la cocina');
	await fijar(p, '2026-11-10T09:00:00');
	await hice(p, 'Basura').click();
	await expect(aviso(p)).toContainText('Completaste «Basura» · mínima');
	await expect(aviso(p)).toContainText('Vuelve el martes 17');
	await esperarEstado(p, 'Basura', 'en espera');

	// 11
	await pasaElAviso(p);
	await ir(p, '2026-11-13T09:30:00');
	await crear(p, { titulo: 'Riego', tipo: 'Intervalo', cada: '2', unidad: 'días', versionMinima: 'Solo las macetas' });
	await hice(p, 'Riego').click();
	await expect(aviso(p)).toContainText('Completaste «Riego» · mínima');
	await pasaElAviso(p);
	await ir(p, '2026-11-14T10:00:00');
	await esperarEstado(p, 'Riego', 'en espera');
	await check(p, 'Riego').click();
	await expect(aviso(p)).toContainText('Completaste «Riego»');
	await expect(aviso(p)).not.toContainText('mínima');
	await d.ctx.close();
});

test('Flujo 4: con pasos, en cualquier paso', async ({ page }) => {
	await sesion(page, VIERNES, true);
	await crear(page, { titulo: 'Lavar', tipo: NO_SE_REPITE, fecha: '', primerPaso: P1, pasos: [P2, P3], versionMinima: 'Solo lo blanco' });
	const paso = (t: string) => expect(lineaDePaso(page, 'Lavar')).toHaveText(t);
	const sinLineas = async () => {
		await expect(f(page, 'Lavar')).toBeVisible();
		await expect(f(page, 'Lavar')).not.toContainText(/Paso|Mínima/);
		await expect(hecho(page, 'Lavar')).toHaveCount(0);
		await expect(anterior(page, 'Lavar')).toHaveCount(0);
		await expect(hice(page, 'Lavar')).toHaveCount(0);
	};

	// 1
	await paso(`Primer paso: ${P1}`);
	await hice(page, 'Lavar').click();
	await expect(aviso(page)).toContainText('Completaste «Lavar» · mínima');
	await sinLineas();
	await deshacer(page).click();
	await expect(check(page, 'Lavar')).not.toBeChecked();
	await paso(`Primer paso: ${P1}`);
	await dice(page, 'Lavar', 'Solo lo blanco');

	// 2
	await hecho(page, 'Lavar').click();
	await paso(`Paso: ${P2}`);
	await fijar(page, VIERNES);
	await hice(page, 'Lavar').click();
	await expect(aviso(page)).toContainText('Completaste «Lavar» · mínima');
	await deshacer(page).click();
	await expect(check(page, 'Lavar')).not.toBeChecked();
	await paso(`Paso: ${P2}`);

	// 3
	await hice(page, 'Lavar').click();
	await expect(aviso(page)).toContainText('Completaste «Lavar» · mínima');
	await pasaElAviso(page);
	await check(page, 'Lavar').click();
	await expect(check(page, 'Lavar')).not.toBeChecked();
	await paso(`Paso: ${P2}`);

	// 4
	await hecho(page, 'Lavar').click();
	await paso(`Paso: ${P3}`);
	await hice(page, 'Lavar').click();
	await expect(aviso(page)).toContainText('Completaste «Lavar» · mínima');
	await deshacer(page).click();
	await expect(check(page, 'Lavar')).not.toBeChecked();
	await paso(`Paso: ${P3}`);
	await hice(page, 'Lavar').click();
	await expect(aviso(page)).toContainText('Completaste «Lavar» · mínima');
	await pasaElAviso(page);
	await irA(page, 'Historial');
	await borrarDelHistorial(page, 'Lavar');
	await irA(page, 'Pendientes');
	await expect(check(page, 'Lavar')).not.toBeChecked();
	await paso(`Paso: ${P3}`);

	// 5
	await hice(page, 'Lavar').click();
	await expect(aviso(page)).toContainText('Completaste «Lavar» · mínima');
	await pasaElAviso(page);
	await expect(check(page, 'Lavar')).toBeChecked();
	await check(page, 'Lavar').click();
	await expect(check(page, 'Lavar')).not.toBeChecked();
	await paso(`Paso: ${P3}`);

	// 6
	await crear(page, {
		titulo: 'Regar',
		tipo: 'Intervalo',
		cada: '2',
		unidad: 'días',
		primerPaso: 'Llenar la regadera',
		pasos: ['Regar los helechos'],
		versionMinima: 'Solo los helechos'
	});
	await hecho(page, 'Regar').click();
	await expect(lineaDePaso(page, 'Regar')).toHaveText('Paso: Regar los helechos');
	await fijar(page, VIERNES);
	await hice(page, 'Regar').click();
	await expect(aviso(page)).toContainText('Completaste «Regar» · mínima');
	await ir(page, '2026-11-15T10:30:00');
	await esperarEstado(page, 'Regar', 'pendiente');
	await expect(lineaDePaso(page, 'Regar')).toHaveText('Primer paso: Llenar la regadera');
	await expect(hecho(page, 'Regar')).toHaveCount(1);
	await expect(anterior(page, 'Regar')).toHaveCount(0);

	// 7
	await crear(page, { titulo: 'Barrer', tipo: NO_SE_REPITE, fecha: '', primerPaso: 'Juntar la basura', versionMinima: 'Solo el pasillo' });
	await expect(lineaDePaso(page, 'Barrer')).toHaveText('Primer paso: Juntar la basura');
	await expect(hecho(page, 'Barrer')).toHaveCount(0);
	await hice(page, 'Barrer').click();
	await expect(aviso(page)).toContainText('Completaste «Barrer» · mínima');
	await deshacer(page).click();
	await expect(check(page, 'Barrer')).not.toBeChecked();
	await expect(lineaDePaso(page, 'Barrer')).toHaveText('Primer paso: Juntar la basura');
	await dice(page, 'Barrer', 'Solo el pasillo');
	await expect(hecho(page, 'Barrer')).toHaveCount(0);
	await expect(anterior(page, 'Barrer')).toHaveCount(0);
});

test('Flujo 5: Historial y Borrar', async ({ page }) => {
	await sesion(page, '2026-11-13T08:05:00', false);
	await crear(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días', versionMinima: 'Solo los helechos' });
	await crear(page, { titulo: 'Pagar', tipo: NO_SE_REPITE, fecha: '' });
	const entrada = (t: string) => page.getByRole('listitem').filter({ hasText: new RegExp(`^${t}\\s*\\d\\d:\\d\\d`) });
	const sinVersiones = async (l: Locator) => {
		await expect(l).not.toContainText('Solo');
	};

	// 1
	await fijar(page, '2026-11-13T08:05:00');
	await hice(page, 'Regar').click();
	await expect(aviso(page)).toContainText('Completaste «Regar» · mínima');
	await irA(page, 'Historial');
	await expect(page.getByRole('heading', { name: 'Hoy', level: 2 })).toBeVisible();
	await expect(entrada('Regar')).toHaveText(/^Regar\s*08:05\s*Mínima\s*Borrar$/);
	await sinVersiones(entrada('Regar'));
	const hora = await estilo(entrada('Regar').getByText('08:05'));
	const palabra = await estilo(entrada('Regar').getByText('Mínima'));
	expect(palabra.color).toBe(hora.color);
	expect(palabra.tamano).toBe(hora.tamano);
	expect(palabra.peso).toBe(hora.peso);
	await expect(entrada('Regar').locator('svg, img')).toHaveCount(0);

	// 2
	await irA(page, 'Pendientes');
	await encenderCompletadas(page);
	await ir(page, '2026-11-13T10:00:00');
	await fijar(page, '2026-11-13T10:00:00');
	await check(page, 'Pagar').click();
	await expect(aviso(page)).toContainText('Completaste «Pagar»');
	await irA(page, 'Historial');
	const items = page.getByRole('list').getByRole('listitem');
	await expect(items).toHaveText([/^Pagar\s*10:\d\d\s*Borrar$/, /^Regar\s*08:05\s*Mínima\s*Borrar$/]);

	// 3
	const dialogo = page.getByRole('alertdialog');
	await entrada('Regar').getByRole('button', { name: 'Borrar', exact: true }).click();
	await expect(dialogo).toContainText('Regar');
	await expect(dialogo).toContainText('Hoy, 08:05');
	await expect(dialogo).toContainText('Mínima');
	await expect(dialogo.getByRole('button', { name: 'Borrar', exact: true })).toBeVisible();
	await dialogo.getByRole('button', { name: 'Cancelar', exact: true }).click();
	await expect(dialogo).toHaveCount(0);
	await expect(entrada('Regar')).toHaveCount(1);
	await entrada('Pagar').getByRole('button', { name: 'Borrar', exact: true }).click();
	await expect(dialogo).toContainText('Pagar');
	await expect(dialogo).not.toContainText('Mínima');
	await dialogo.getByRole('button', { name: 'Cancelar', exact: true }).click();
	await entrada('Regar').getByRole('button', { name: 'Borrar', exact: true }).click();
	await dialogo.getByRole('button', { name: 'Borrar', exact: true }).click();
	await expect(dialogo).toHaveCount(0);
	await expect(entrada('Regar')).toHaveCount(0);
	await irA(page, 'Pendientes');
	await esperarEstado(page, 'Regar', 'pendiente');

	// 4
	await hice(page, 'Regar').click();
	await expect(aviso(page)).toContainText('Completaste «Regar» · mínima');
	await escribirMinima(page, 'Regar', 'Solo el brote');
	await irA(page, 'Historial');
	await expect(entrada('Regar')).toHaveText(/^Regar\s*\d\d:\d\d\s*Mínima\s*Borrar$/);
	await expect(entrada('Regar')).not.toContainText('Solo');
	await irA(page, 'Pendientes');
	await escribirMinima(page, 'Regar', '');
	await irA(page, 'Historial');
	await expect(entrada('Regar')).toHaveText(/^Regar\s*\d\d:\d\d\s*Mínima\s*Borrar$/);
	await irA(page, 'Pendientes');
	await abrirFila(page, 'Regar');
	await page.getByLabel('Título').fill('Plantas');
	await guardar(page);
	await irA(page, 'Historial');
	await expect(entrada('Plantas')).toHaveText(/^Plantas\s*\d\d:\d\d\s*Mínima\s*Borrar$/);

	// 5
	await irA(page, 'Pendientes');
	await escribirMinima(page, 'Pagar', 'Solo el brote');
	await irA(page, 'Historial');
	await expect(entrada('Pagar')).toHaveText(/^Pagar\s*10:\d\d\s*Borrar$/);
});

test('Flujo 6: lo que no cambia y lo que no lo muestra', async ({ page }) => {
	await sesion(page, VIERNES, true);
	const textos = async (t: string[]) => Promise.all(t.map((x) => f(page, x).innerText()));

	// 1
	await crear(page, { titulo: 'Barrer', tipo: NO_SE_REPITE, fecha: '' });
	await crear(page, { titulo: 'Lavar', tipo: NO_SE_REPITE, fecha: '' });
	await crear(page, { titulo: 'Planchar', tipo: NO_SE_REPITE, fecha: '' });
	const orden = await titulos(page);
	expect([...orden].sort()).toEqual(['Barrer', 'Lavar', 'Planchar']);
	const antes = await textos(['Barrer', 'Planchar']);

	// 2
	await escribirMinima(page, 'Lavar', 'Solo el inodoro');
	await dice(page, 'Lavar', 'Solo el inodoro');
	expect(await titulos(page)).toEqual(orden);
	expect(await textos(['Barrer', 'Planchar'])).toEqual(antes);
	await escribirMinima(page, 'Barrer', 'Solo el pasillo');
	await dice(page, 'Barrer', 'Solo el pasillo');
	expect(await titulos(page)).toEqual(orden);

	// 3
	await abrirFila(page, 'Lavar');
	await elegirEmoji(page, '🧺', 'cesta');
	await guardar(page);
	const tit = f(page, '🧺 Lavar').getByRole('button', { name: '🧺 Lavar', exact: true });
	await expect(tit).toBeVisible();
	await dice(page, '🧺 Lavar', 'Solo el inodoro');
	const bt = (await tit.boundingBox())!;
	expect((await linea(page, '🧺 Lavar').boundingBox())!.y).toBeGreaterThanOrEqual(bt.y + bt.height - 2);
	await expect(tit).not.toContainText('Solo el inodoro');
	await expect(tit).not.toContainText('Mínima');

	// 4
	await hice(page, '🧺 Lavar').click();
	await expect(aviso(page)).toContainText('Completaste «🧺 Lavar» · mínima');
	await expect(aviso(page)).not.toContainText('Solo el inodoro');
	// Con el aviso a la vista, Anotar toma esa tarea (§5.10).
	await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
	await boton(page, 'Anotar').click();
	const recuadro = page.getByRole('dialog', { name: 'Anotar', exact: true });
	await recuadro.getByRole('textbox', { name: 'Texto' }).fill('salió bien');
	await recuadro.getByRole('button', { name: 'Me sirvió' }).click();
	await expect(recuadro).toHaveCount(0);
	await page.getByRole('navigation').getByRole('link', { name: 'Anotaciones', exact: true }).click();
	await page.clock.runFor(100);
	await expect(page.getByRole('heading', { name: 'Anotaciones', level: 1 })).toBeVisible();
	const entrada = page.getByRole('listitem').filter({ has: page.getByRole('button', { name: 'Editar texto' }) });
	await expect(entrada).toHaveCount(1);
	await expect(entrada).toContainText('🧺 Lavar');
	await expect(entrada).toContainText('salió bien');
	await expect(entrada).not.toContainText(/Solo el inodoro|Mínima/);
	await boton(page, 'Copiar').click();
	await expect(page.getByRole('status').filter({ hasText: 'Anotaciones copiadas' })).toBeVisible();
	const copiado = await page.evaluate(() => navigator.clipboard.readText());
	expect(copiado).toContain('salió bien');
	expect(copiado).not.toContain('Solo el inodoro');
	expect(copiado).not.toContain('Mínima');
	await irA(page, 'Pendientes');

	// 5
	const c = (await linea(page, 'Barrer').boundingBox())!;
	await page.mouse.click(c.x + 4, c.y + c.height / 2);
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await expect(page.getByLabel('Título')).toHaveValue('Barrer');
	await cerrar(page);
});

test('Flujo 7: Cambios sin guardar', async ({ page }) => {
	await sesionConReloj(page, VIERNES);
	await crear(page, { titulo: 'Lavar', tipo: NO_SE_REPITE, fecha: '', versionMinima: 'Solo el inodoro' });
	await crear(page, { titulo: 'Planchar', tipo: NO_SE_REPITE, fecha: '' });
	const cierraDirecto = async () => {
		await boton(page, 'Cerrar').click();
		await expect(panel(page)).toHaveCount(0);
		await expect(avisoDeCambios(page)).toHaveCount(0);
	};
	const pideAvisoYDescarta = async () => {
		await boton(page, 'Cerrar').click();
		await expect(avisoDeCambios(page)).toBeVisible();
		await avisoDeCambios(page).getByRole('button', { name: 'Descartar', exact: true }).click();
		await expect(panel(page)).toHaveCount(0);
		await expect(avisoDeCambios(page)).toHaveCount(0);
	};

	// 1
	await abrirFila(page, 'Lavar');
	await minima(page).fill('Solo el lavabo');
	await pideAvisoYDescarta();
	await dice(page, 'Lavar', 'Solo el inodoro');

	// 2
	await abrirFila(page, 'Lavar');
	await minima(page).fill('Solo el lavabo');
	await minima(page).fill('Solo el inodoro');
	await cierraDirecto();
	await abrirFila(page, 'Lavar');
	await minima(page).fill('  Solo el inodoro  ');
	await cierraDirecto();

	// 3
	await abrirFila(page, 'Lavar');
	await minima(page).fill('');
	await pideAvisoYDescarta();
	await abrirFila(page, 'Lavar');
	await minima(page).fill('   ');
	await pideAvisoYDescarta();
	await dice(page, 'Lavar', 'Solo el inodoro');

	// 4
	await abrirFila(page, 'Planchar');
	await minima(page).fill('   ');
	await cierraDirecto();
	await abrirFila(page, 'Planchar');
	await minima(page).fill('Solo el inodoro');
	await pideAvisoYDescarta();

	// 5
	await boton(page, '+').click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await minima(page).fill('   ');
	await cierraDirecto();
	await boton(page, '+').click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await minima(page).fill('Solo el inodoro');
	await pideAvisoYDescarta();

	// 6
	await hice(page, 'Lavar').click();
	await expect(aviso(page)).toContainText('Completaste «Lavar» · mínima');
	await expect(panel(page)).toHaveCount(0);
	await expect(avisoDeCambios(page)).toHaveCount(0);
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
});

async function dispositivos(browser: Browser) {
	const d = await dosDispositivos(browser, VIERNES);
	for (const p of [d.a, d.b]) {
		await encenderCompletadas(p);
		await mostrarPausadas(p).click();
		await expect(mostrarPausadas(p)).toBeChecked();
	}
	return d;
}

test('Flujo 8: dos dispositivos', async ({ browser }) => {
	test.setTimeout(400_000);
	const { a, b, ctxB, cerrar: fin } = await dispositivos(browser);
	const ambos = [a, b];
	const sincronizar = async () => {
		await llegaAlServidor(a);
		await ctxB.setOffline(false);
		await a.waitForTimeout(10_000); // B reconecta y sus escrituras pendientes llegan; las dos pantallas se actualizan solas
	};
	const dicen = async (t: string, m: string) => {
		for (const p of ambos) {
			await expect(linea(p, t)).toHaveText(`Mínima: ${m}`, { timeout: 60_000 });
			await expect(hice(p, t)).toHaveCount(1);
		}
	};
	const sinLineaAmbos = async (t: string) => {
		for (const p of ambos) {
			await expect(f(p, t)).toBeVisible({ timeout: 60_000 });
			await expect(f(p, t)).not.toContainText('Mínima', { timeout: 60_000 });
			await expect(hice(p, t)).toHaveCount(0);
		}
	};

	// 1
	await crear(a, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días', versionMinima: 'Solo los helechos' });
	await expect(f(b, 'Regar')).toBeVisible();
	await dicen('Regar', 'Solo los helechos');

	// 2
	await ctxB.setOffline(true);
	await abrirFila(b, 'Regar');
	await b.getByLabel('Título').fill('Regar plantas');
	await guardar(b);
	await escribirMinima(a, 'Regar', 'Solo el brote');
	await sincronizar();
	await dicen('Regar plantas', 'Solo el brote');
	for (const p of ambos) await expect(f(p, 'Regar plantas').getByRole('button', { name: 'Regar plantas', exact: true })).toBeVisible();

	// 3
	await ctxB.setOffline(true);
	await escribirMinima(b, 'Regar plantas', 'Solo los esquejes');
	await abrirFila(a, 'Regar plantas');
	await a.getByLabel('Nota').fill('Usar la regadera chica');
	await guardar(a);
	await sincronizar();
	await dicen('Regar plantas', 'Solo los esquejes');
	for (const p of ambos)
		await expect(async () => {
			await abrirFila(p, 'Regar plantas');
			await expect(p.getByLabel('Nota')).toHaveValue('Usar la regadera chica', { timeout: 1000 });
			await cerrar(p);
		}).toPass({ timeout: 60_000 });

	// 4
	await ctxB.setOffline(true);
	await escribirMinima(b, 'Regar plantas', 'Solo la maceta');
	await escribirMinima(a, 'Regar plantas', 'Solo la planta grande');
	await sincronizar();
	await dicen('Regar plantas', 'Solo la maceta');

	// 5
	await ctxB.setOffline(true);
	await escribirMinima(b, 'Regar plantas', '');
	await escribirMinima(a, 'Regar plantas', 'Solo el tronco');
	await sincronizar();
	await sinLineaAmbos('Regar plantas');
	await escribirMinima(a, 'Regar plantas', 'Solo el tronco');
	await dicen('Regar plantas', 'Solo el tronco');

	// 6
	await ctxB.setOffline(true);
	await escribirMinima(b, 'Regar plantas', 'Solo la maceta');
	await escribirMinima(a, 'Regar plantas', '');
	await sincronizar();
	await dicen('Regar plantas', 'Solo la maceta');

	// 7
	await ctxB.setOffline(true);
	await escribirMinima(b, 'Regar plantas', 'Solo el brote');
	await abrirFila(a, 'Regar plantas');
	await guardar(a);
	await sincronizar();
	await dicen('Regar plantas', 'Solo el brote');

	// 8
	await ctxB.setOffline(true);
	await check(b, 'Regar plantas').click();
	await hice(a, 'Regar plantas').click();
	await sincronizar();
	for (const p of ambos) {
		await irA(p, 'Historial');
		const entradas = p.getByRole('list').getByRole('listitem').filter({ hasText: /^Regar plantas/ });
		await expect(entradas).toHaveCount(2, { timeout: 60_000 });
		await expect(entradas.filter({ hasText: /Mínima/ })).toHaveCount(1);
		await expect(entradas.filter({ hasNotText: /Mínima/ })).toHaveCount(1);
	}

	await fin();
});
