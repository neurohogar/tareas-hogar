import { expect, test, type Browser, type Locator, type Page } from '@playwright/test';
import {
	abrirPestana,
	adelantar,
	asentar,
	cerrar,
	completarPanel,
	conReloj,
	crear,
	crearYVer,
	detener,
	dosDispositivos,
	elegirEmoji,
	encenderCompletadas,
	esperarEstado,
	irA,
	limpiarEmuladores,
	llegaAlServidor,
	retroceder,
	sesionConReloj,
	verHistorial,
	type Definicion
} from './apoyo';

// qa/primer-paso.md: el campo Primer paso del panel, su línea en la fila, cuándo se ve y cambios sin guardar.

test.beforeEach(async () => {
	await limpiarEmuladores();
});

const VIERNES = '2026-11-13T10:00:00';
const LAVAR = 'Separar la ropa blanca';
const LARGO =
	'Abrir el cajón de abajo, sacar toda la ropa blanca y separarla en dos pilas: la que va con agua caliente y la que no se mezcla con nada de color oscuro ni delicado';

/** La fila de la tarea de título exacto `titulo` (las demás filas pueden contener ese texto). */
const f = (page: Page, titulo: string): Locator =>
	page.getByRole('listitem').filter({ has: page.getByRole('button', { name: titulo, exact: true }) });
const linea = (page: Page, titulo: string) => f(page, titulo).getByText(/^Primer paso: /);
const aviso = (page: Page) => page.getByRole('status').filter({ hasText: 'Completaste' });
const boton = (page: Page, nombre: string) => page.getByRole('button', { name: nombre, exact: true });
const campo = (page: Page) => page.getByRole('textbox', { name: 'Primer paso', exact: true });
const mostrarPausadas = (page: Page) => page.getByRole('checkbox', { name: 'Pausadas' });
const panel = (page: Page) => page.getByRole('dialog');
const avisoDeCambios = (page: Page) => page.getByRole('alertdialog', { name: 'Tenés cambios sin guardar' });

/** La fila dice exactamente `Primer paso: texto`, una sola vez. */
async function dice(page: Page, titulo: string, texto: string) {
	await expect(linea(page, titulo)).toHaveCount(1);
	await expect(linea(page, titulo)).toHaveText(`Primer paso: ${texto}`);
}

/** La fila está a la vista y no contiene `Primer paso`. */
async function sinLinea(page: Page, titulo: string) {
	await expect(f(page, titulo)).toBeVisible();
	await expect(f(page, titulo)).not.toContainText('Primer paso');
}

async function abrirFila(page: Page, titulo: string) {
	await f(page, titulo).getByRole('button', { name: titulo, exact: true }).click();
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await abrirPestana(page, 'Tarea');
}

async function guardar(page: Page) {
	await boton(page, 'Guardar').click();
	await expect(panel(page)).toHaveCount(0);
}

/** Abre la fila, escribe el primer paso (Enter o Guardar) y deja el panel cerrado. */
async function escribir(page: Page, titulo: string, texto: string) {
	await abrirFila(page, titulo);
	await campo(page).fill(texto);
	await guardar(page);
}

/** Abre la fila, verifica el valor del campo y cierra sin cambios. */
async function valeEnPanel(page: Page, titulo: string, valor: string) {
	await abrirFila(page, titulo);
	await expect(campo(page)).toHaveValue(valor);
	await cerrar(page);
}

async function pegar(page: Page, texto: string) {
	await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.evaluate((t) => navigator.clipboard.writeText(t), texto);
	await campo(page).focus();
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
			overflow: s.overflow,
			maxAlto: s.maxHeight
		};
	});

async function pausar(page: Page, titulo: string) {
	await abrirFila(page, titulo);
	await boton(page, 'Pausar').click();
	await expect(panel(page)).toHaveCount(0);
}

async function posponer(page: Page, titulo: string, opcion: '3 horas' | 'Hasta mañana') {
	await abrirFila(page, titulo);
	await boton(page, opcion).click();
	await expect(panel(page)).toHaveCount(0);
}

/** Sesión con el reloj corriendo 10 minutos antes de `hora` (las tareas se crean así). */
async function sesion(page: Page, hora: string, completadas = false) {
	await sesionConReloj(page, new Date(new Date(hora).getTime() - 600_000).toISOString());
	if (completadas) await encenderCompletadas(page);
}

/** Avanza el reloj detenido hasta `hora` y deja correr un segundo para que la pantalla se actualice sola. */
async function ir(page: Page, hora: string) {
	const falta = new Date(hora).getTime() - (await page.evaluate(() => Date.now()));
	if (falta <= 10_000) await page.clock.runFor(falta);
	else await adelantar(page, hora);
	await page.clock.runFor(1000);
}

type Nueva = Definicion & { titulo: string };
const NO_SE_REPITE = 'No se repite' as const;

test('Flujo 1: el campo en el panel y crear con primer paso', async ({ page }) => {
	await sesionConReloj(page, VIERNES);

	// 1
	await boton(page, '+').click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await expect(campo(page)).toBeVisible();
	await expect(campo(page)).toHaveValue('');
	await expect(campo(page)).toHaveJSProperty('placeholder', '');
	const y = async (l: Locator) => (await l.boundingBox())!.y;
	const titulo = page.getByLabel('Título');
	const emoji = page.getByRole('button', { name: /^(Elegir emoji|Cambiar emoji)/ });
	const nota = page.getByLabel('Nota');
	const esfuerzo = page.getByRole('combobox', { name: 'Esfuerzo' });
	const etiquetas = page.getByRole('combobox', { name: 'Etiquetas' });
	await expect(emoji).toBeVisible();
	const ys = [await y(titulo), await y(campo(page)), await y(nota), await y(esfuerzo), await y(etiquetas)];
	expect(ys).toEqual([...ys].sort((a, b) => a - b));
	expect(new Set(ys).size).toBe(5);
	expect(Math.abs((await y(emoji)) - ys[0])).toBeLessThan(ys[1] - ys[0]);

	// 2
	await titulo.fill('Lavar');
	await campo(page).fill(LAVAR);
	await campo(page).press('Enter');
	await expect(panel(page)).toHaveCount(0);
	await dice(page, 'Lavar', LAVAR);
	const caja = async (l: Locator) => (await l.boundingBox())!;
	expect((await caja(linea(page, 'Lavar'))).y).toBeGreaterThan(
		(await caja(f(page, 'Lavar').getByRole('button', { name: 'Lavar', exact: true }))).y +
			(await caja(f(page, 'Lavar').getByRole('button', { name: 'Lavar', exact: true }))).height - 2
	);

	// 3
	await crear(page, { titulo: 'Barrer', tipo: NO_SE_REPITE });
	await sinLinea(page, 'Barrer');

	// 4
	await crear(page, {
		titulo: 'Regar',
		tipo: 'Intervalo',
		cada: '2',
		unidad: 'días',
		primerPaso: 'Llenar la regadera',
		esfuerzo: 'Rápida (≤ 5 min)'
	});
	await dice(page, 'Regar', 'Llenar la regadera');
	await expect(f(page, 'Regar').getByText('Rápida', { exact: true })).toBeVisible();
	await crear(page, {
		titulo: 'Basura',
		tipo: 'Días de la semana',
		dias: ['martes'],
		primerPaso: 'Atar la bolsa llena'
	});
	await crear(page, {
		titulo: 'Lavar los platos',
		tipo: NO_SE_REPITE,
		primerPaso: 'Poner el agua a calentar',
		esfuerzo: 'Sin estimar'
	});
	await dice(page, 'Lavar los platos', 'Poner el agua a calentar');
	await sinLinea(page, 'Basura'); // en espera hasta el martes

	// 5
	await valeEnPanel(page, 'Lavar', LAVAR);
	await valeEnPanel(page, 'Barrer', '');
	await page.reload();
	await dice(page, 'Lavar', LAVAR);
	await sinLinea(page, 'Barrer');
	await dice(page, 'Regar', 'Llenar la regadera');
	await dice(page, 'Lavar los platos', 'Poner el agua a calentar');
});

test('Flujo 2: editar, recortar, vaciar y texto largo', async ({ page }) => {
	await sesionConReloj(page, VIERNES);
	await crear(page, { titulo: 'Lavar', tipo: NO_SE_REPITE, primerPaso: LAVAR });

	// 1
	await escribir(page, 'Lavar', '  Juntar las llaves  ');
	await dice(page, 'Lavar', 'Juntar las llaves');
	await abrirFila(page, 'Lavar');
	await expect(campo(page)).toHaveValue('Juntar las llaves');
	await cerrar(page);

	// 2
	await abrirFila(page, 'Lavar');
	await pegar(page, 'uno\ndos');
	expect(await campo(page).inputValue()).not.toContain('\n');
	await campo(page).press('Enter');
	await expect(panel(page)).toHaveCount(0);
	await expect(linea(page, 'Lavar')).toHaveText(/^Primer paso: uno ?dos$/);
	expect(await linea(page, 'Lavar').innerText()).not.toContain('\n');
	await abrirFila(page, 'Lavar');
	expect(await campo(page).inputValue()).not.toContain('\n');
	await cerrar(page);

	// 3
	await escribir(page, 'Lavar', '');
	await sinLinea(page, 'Lavar');
	await valeEnPanel(page, 'Lavar', '');
	await page.reload();
	await sinLinea(page, 'Lavar');

	// 4
	await escribir(page, 'Lavar', LAVAR);
	await dice(page, 'Lavar', LAVAR);
	await abrirFila(page, 'Lavar');
	await campo(page).fill('   ');
	await boton(page, 'Guardar').click();
	await expect(panel(page)).toHaveCount(0);
	await expect(page.getByRole('alert')).toHaveCount(0);
	await sinLinea(page, 'Lavar');
	await valeEnPanel(page, 'Lavar', '');

	// 5
	await abrirFila(page, 'Lavar');
	await pegar(page, 'a'.repeat(5000));
	await guardar(page);
	await expect(page.getByRole('alert')).toHaveCount(0);
	await expect(linea(page, 'Lavar')).toBeVisible();
	await abrirFila(page, 'Lavar');
	expect((await campo(page).inputValue()).length).toBe(5000);
	await cerrar(page);

	// 6
	await page.setViewportSize({ width: 390, height: 844 });
	await escribir(page, 'Lavar', LARGO);
	await dice(page, 'Lavar', LARGO);
	const l = linea(page, 'Lavar');
	const e = await estilo(l);
	expect(e.recorte).not.toBe('ellipsis');
	expect(e.overflow).not.toBe('hidden');
	expect(e.maxAlto).toBe('none');
	expect(await l.evaluate((n) => n.scrollHeight <= n.clientHeight + 1 && n.scrollWidth <= n.clientWidth + 1)).toBe(true);
	const caja = (await l.boundingBox())!;
	expect(caja.height).toBeGreaterThan(parseFloat(e.tamano) * 2.2);
	expect(caja.x + caja.width).toBeLessThanOrEqual(390);
	expect(await l.innerText()).not.toContain('…');
});

test('Flujo 3: la línea en la fila (posición, estilo, toque)', async ({ page }) => {
	await sesionConReloj(page, VIERNES);
	await crear(page, {
		titulo: 'Pagar la luz',
		tipo: NO_SE_REPITE,
		fecha: '2026-11-10',
		esfuerzo: 'Rápida (≤ 5 min)',
		primerPaso: 'Buscar la factura'
	});
	await crear(page, { titulo: 'Cambiar foco', tipo: NO_SE_REPITE, fecha: '', primerPaso: 'Sacar la escalera' });
	await crear(page, { titulo: 'Barrer', tipo: NO_SE_REPITE, fecha: '' });

	// 1
	await esperarEstado(page, 'Pagar la luz', 'atrasada', undefined, false);
	await esperarEstado(page, 'Cambiar foco', 'pendiente');
	await dice(page, 'Pagar la luz', 'Buscar la factura');
	await dice(page, 'Cambiar foco', 'Sacar la escalera');
	for (const t of ['Pagar la luz', 'Cambiar foco']) {
		const titulo = (await f(page, t).getByRole('button', { name: t, exact: true }).boundingBox())!;
		const l = (await linea(page, t).boundingBox())!;
		expect(l.y).toBeGreaterThanOrEqual(titulo.y + titulo.height - 2);
	}

	// 2
	const l = linea(page, 'Pagar la luz');
	const a = await estilo(l);
	const r = await estilo(f(page, 'Pagar la luz').getByText('Rápida', { exact: true }));
	expect(a.color).toBe(r.color);
	expect(a.tamano).toBe(r.tamano);
	expect(a.peso).toBeLessThan(600);
	expect(a.linea).not.toContain('underline');
	const [rojo, verde, azul] = a.color.match(/\d+/g)!.map(Number);
	expect(rojo > verde && rojo > azul).toBe(false);
	expect((await estilo(f(page, 'Pagar la luz'))).fondo).toBe((await estilo(f(page, 'Barrer'))).fondo);

	// 3
	for (const t of ['Pagar la luz', 'Cambiar foco']) {
		await expect(f(page, t).getByRole('checkbox')).toHaveCount(1);
		await expect(f(page, t).getByRole('button')).toHaveCount(1);
		await expect(f(page, t).getByRole('textbox')).toHaveCount(0);
		await expect(f(page, t).getByRole('progressbar')).toHaveCount(0);
	}

	// 4: tocar la línea es tocar la fila.
	const c = (await linea(page, 'Cambiar foco').boundingBox())!;
	await page.mouse.click(c.x + c.width / 2, c.y + c.height / 2);
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await expect(page.getByLabel('Título')).toHaveValue('Cambiar foco');
	await cerrar(page);

	// 5
	await f(page, 'Cambiar foco').getByRole('checkbox').click();
	await expect(aviso(page)).toContainText('Completaste «Cambiar foco»');
});

test('Flujo 4: dónde se ve y cuándo desaparece y vuelve', async ({ page }) => {
	await sesion(page, VIERNES, true);

	// 1
	await conReloj(page, async () => {
		await crearYVer(page, { titulo: 'Cambiar foco', tipo: NO_SE_REPITE, fecha: '', primerPaso: 'Sacar la escalera' });
		await crearYVer(page, { titulo: 'Pagar', tipo: NO_SE_REPITE, fecha: '2026-11-10', primerPaso: 'Buscar la factura' });
		await crearYVer(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '8', unidad: 'horas', primerPaso: 'Llenar la regadera' });
	});
	await detener(page, VIERNES);

	// 2
	await conReloj(page, async () => {
		await esperarEstado(page, 'Pagar', 'atrasada', undefined, false);
		await esperarEstado(page, 'Cambiar foco', 'pendiente');
		await esperarEstado(page, 'Regar', 'pendiente');
		await dice(page, 'Pagar', 'Buscar la factura');
		await dice(page, 'Cambiar foco', 'Sacar la escalera');
		await dice(page, 'Regar', 'Llenar la regadera');
	});

	// 3
	await f(page, 'Regar').getByRole('checkbox').click();
	await conReloj(page, async () => {
		await expect(f(page, 'Regar').getByRole('checkbox')).toBeChecked();
		await sinLinea(page, 'Regar');
	});
	await ir(page, '2026-11-13T17:59:00');
	await conReloj(page, () => sinLinea(page, 'Regar'));
	await ir(page, '2026-11-13T18:00:00');
	await conReloj(page, async () => {
		await esperarEstado(page, 'Regar', 'pendiente', undefined, false);
		await dice(page, 'Regar', 'Llenar la regadera');
	});

	// 4
	await ir(page, '2026-11-14T02:00:00');
	await conReloj(page, async () => {
		await esperarEstado(page, 'Regar', 'atrasada', undefined, false);
		await dice(page, 'Regar', 'Llenar la regadera');
	});

	// 5
	await f(page, 'Cambiar foco').getByRole('checkbox').click();
	await conReloj(page, async () => {
		await expect(aviso(page)).toContainText('Completaste «Cambiar foco»');
		await expect(aviso(page)).not.toContainText('Primer paso');
		await expect(f(page, 'Cambiar foco').getByRole('checkbox')).toBeChecked();
		await sinLinea(page, 'Cambiar foco');
	});
	await aviso(page).getByRole('button', { name: 'Deshacer' }).click();
	await asentar(page);
	await conReloj(page, async () => {
		await esperarEstado(page, 'Cambiar foco', 'pendiente', undefined, false);
		await dice(page, 'Cambiar foco', 'Sacar la escalera');
	});

	// 6
	await posponer(page, 'Cambiar foco', '3 horas');
	await posponer(page, 'Pagar', 'Hasta mañana');
	await conReloj(page, async () => {
		await sinLinea(page, 'Cambiar foco');
		await sinLinea(page, 'Pagar');
	});
	await ir(page, '2026-11-14T05:01:00');
	await conReloj(page, async () => {
		await dice(page, 'Cambiar foco', 'Sacar la escalera');
		await sinLinea(page, 'Pagar');
	});
	await ir(page, '2026-11-15T07:00:00');
	await conReloj(page, async () => {
		await esperarEstado(page, 'Pagar', 'atrasada', undefined, false);
		await dice(page, 'Pagar', 'Buscar la factura');
	});

	// 7
	await pausar(page, 'Regar');
	await conReloj(page, () => expect(f(page, 'Regar')).toHaveCount(0));
	await mostrarPausadas(page).click();
	await expect(mostrarPausadas(page)).toBeChecked();
	await conReloj(page, async () => {
		await expect(f(page, 'Regar').getByText('Pausada')).toBeVisible();
		await sinLinea(page, 'Regar');
	});
	await abrirFila(page, 'Regar');
	await boton(page, 'Reanudar').click();
	await expect(panel(page)).toHaveCount(0);
	await conReloj(page, async () => {
		await expect(f(page, 'Regar').getByText('Pausada')).toHaveCount(0);
		await esperarEstado(page, 'Regar', 'pendiente', undefined, false);
		await dice(page, 'Regar', 'Llenar la regadera');
	});

	// 8: con el reloj en el viernes.
	await retroceder(page, VIERNES);
	await conReloj(page, () =>
		crearYVer(page, { titulo: 'Basura', tipo: 'Días de la semana', dias: ['martes'], primerPaso: 'Atar la bolsa llena' })
	);
	await conReloj(page, () => sinLinea(page, 'Basura'));
	await ir(page, '2026-11-17T09:00:00');
	await conReloj(page, async () => {
		await esperarEstado(page, 'Basura', 'pendiente', undefined, false);
		await dice(page, 'Basura', 'Atar la bolsa llena');
	});

	// 9
	await conReloj(page, () =>
		crearYVer(page, {
			titulo: 'Llamar',
			tipo: NO_SE_REPITE,
			fecha: '',
			horario: { desde: '08:00', hasta: '09:00' },
			primerPaso: 'Buscar el número'
		})
	);
	await conReloj(page, () => sinLinea(page, 'Llamar'));
	await ir(page, '2026-11-18T08:00:00');
	await conReloj(page, async () => {
		await esperarEstado(page, 'Llamar', 'pendiente', undefined, false);
		await dice(page, 'Llamar', 'Buscar el número');
	});
});

test('Flujo 5: atrasada con el checkbox deshabilitado', async ({ page }) => {
	await sesion(page, '2026-11-09T09:00:00');

	// 1
	await conReloj(page, () =>
		crearYVer(page, {
			titulo: 'Lavar',
			tipo: NO_SE_REPITE,
			fecha: '2026-11-10',
			horario: { desde: '08:00', hasta: '11:00' },
			primerPaso: LAVAR
		})
	);
	await detener(page, '2026-11-09T09:00:00');

	// 2
	await ir(page, '2026-11-11T07:00:00');
	await conReloj(page, async () => {
		await esperarEstado(page, 'Lavar', 'atrasada', undefined, false, false);
		await dice(page, 'Lavar', LAVAR);
	});

	// 3
	await ir(page, '2026-11-11T08:00:00');
	await conReloj(page, async () => {
		await esperarEstado(page, 'Lavar', 'atrasada', undefined, false, true);
		await dice(page, 'Lavar', LAVAR);
	});
});

test('Flujo 6: el primer paso no cambia con las acciones de la tarea', async ({ page }) => {
	await sesionConReloj(page, VIERNES);
	await encenderCompletadas(page);
	await mostrarPausadas(page).click();
	await expect(mostrarPausadas(page)).toBeChecked();
	const REGAR = 'Llenar la regadera';

	// 1
	await crear(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días', primerPaso: REGAR });
	await f(page, 'Regar').getByRole('checkbox').click();
	await expect(f(page, 'Regar').getByRole('checkbox')).toBeChecked();
	await valeEnPanel(page, 'Regar', REGAR);

	// 2
	await pausar(page, 'Regar');
	await expect(f(page, 'Regar').getByText('Pausada')).toBeVisible();
	await valeEnPanel(page, 'Regar', REGAR);
	await abrirFila(page, 'Regar');
	await boton(page, 'Reanudar').click();
	await expect(panel(page)).toHaveCount(0);
	await valeEnPanel(page, 'Regar', REGAR);

	// 3
	await f(page, 'Regar').getByRole('checkbox').click();
	await expect(aviso(page)).toContainText('Completaste «Regar»');
	await aviso(page).getByRole('button', { name: 'Deshacer' }).click();
	await expect(aviso(page)).toHaveCount(0);
	await valeEnPanel(page, 'Regar', REGAR);

	// 4
	await abrirFila(page, 'Regar');
	await completarPanel(page, { tipo: 'Días de la semana', dias: ['martes'] });
	await guardar(page);
	await valeEnPanel(page, 'Regar', REGAR);
	await abrirFila(page, 'Regar');
	await completarPanel(page, { tipo: NO_SE_REPITE });
	await guardar(page);
	await valeEnPanel(page, 'Regar', REGAR);
	await abrirFila(page, 'Regar');
	await completarPanel(page, { tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await guardar(page);
	await valeEnPanel(page, 'Regar', REGAR);

	// 5
	await crear(page, { titulo: 'Cambiar foco', tipo: NO_SE_REPITE, primerPaso: 'Sacar la escalera' });
	await posponer(page, 'Cambiar foco', '3 horas');
	await valeEnPanel(page, 'Cambiar foco', 'Sacar la escalera');

	// 6
	await page.reload();
	await valeEnPanel(page, 'Regar', REGAR);
	await valeEnPanel(page, 'Cambiar foco', 'Sacar la escalera');
	await abrirFila(page, 'Regar');
	await expect(panel(page).getByRole('checkbox', { name: /primer paso|hecho/i })).toHaveCount(0);
	await expect(panel(page).getByRole('button', { name: /primer paso|hecho/i })).toHaveCount(0);
	await cerrar(page);
	await expect(f(page, 'Regar').getByRole('checkbox')).toHaveCount(1);

	// 7
	await crear(page, { titulo: 'Barrer', tipo: NO_SE_REPITE });
	await valeEnPanel(page, 'Barrer', '');
	await sinLinea(page, 'Barrer');
});

test('Flujo 7: lo que no cambia y lo que no lo muestra', async ({ page }) => {
	await sesionConReloj(page, VIERNES);
	const RAPIDA = 'Rápida (≤ 5 min)' as const;
	const filtro = page.getByRole('group', { name: 'Filtrar por etiqueta' });
	const titulos = () =>
		page
			.getByRole('listitem')
			.getByRole('checkbox')
			.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')!.replace('Completar ', '')));
	const textos = async (t: string[]) => Promise.all(t.map((x) => f(page, x).innerText()));

	// 1
	await crear(page, { titulo: 'Barrer', tipo: NO_SE_REPITE, fecha: '', esfuerzo: RAPIDA });
	await crear(page, { titulo: 'Lavar', tipo: NO_SE_REPITE, fecha: '', esfuerzo: RAPIDA });
	await crear(page, { titulo: 'Planchar', tipo: NO_SE_REPITE, fecha: '', esfuerzo: 'Larga', etiquetas: ['Patio', 'Cocina'] });
	const orden = await titulos();
	expect([...orden].sort()).toEqual(['Barrer', 'Lavar', 'Planchar']);
	const antes = await textos(['Barrer', 'Planchar']);

	// 2
	await escribir(page, 'Lavar', LAVAR);
	await dice(page, 'Lavar', LAVAR);
	expect(await titulos()).toEqual(orden);
	expect(await textos(['Barrer', 'Planchar'])).toEqual(antes);
	await escribir(page, 'Barrer', 'Barrer abajo');
	await escribir(page, 'Lavar', '');
	await dice(page, 'Barrer', 'Barrer abajo');
	await sinLinea(page, 'Lavar');
	expect(await titulos()).toEqual(orden);
	await escribir(page, 'Barrer', '');
	await escribir(page, 'Lavar', LAVAR);

	// 3
	const solo = page.getByRole('button', { name: 'Solo rápidas', exact: true });
	await solo.click();
	await expect.poll(titulos).toEqual(orden.filter((t) => t !== 'Planchar'));
	await escribir(page, 'Barrer', 'Barrer abajo');
	await expect.poll(titulos).toEqual(orden.filter((t) => t !== 'Planchar'));
	await escribir(page, 'Barrer', '');
	await solo.click();
	await expect.poll(titulos).toEqual(orden);
	await abrirFila(page, 'Lavar');
	await completarPanel(page, { etiquetas: ['Casa'] });
	await guardar(page);
	await filtro.getByRole('button', { name: 'Casa', exact: true }).click();
	await expect.poll(titulos).toEqual(['Lavar']);
	await dice(page, 'Lavar', LAVAR);
	await filtro.getByRole('button', { name: 'Todas', exact: true }).click();
	await expect.poll(titulos).toEqual(orden);

	// 4
	await abrirFila(page, 'Lavar');
	await elegirEmoji(page, '🧺', 'cesta');
	await guardar(page);
	await expect(f(page, '🧺 Lavar').getByRole('button', { name: '🧺 Lavar', exact: true })).toBeVisible();
	await dice(page, '🧺 Lavar', LAVAR);
	const b = (await f(page, '🧺 Lavar').getByRole('button', { name: '🧺 Lavar', exact: true }).boundingBox())!;
	expect((await linea(page, '🧺 Lavar').boundingBox())!.y).toBeGreaterThanOrEqual(b.y + b.height - 2);

	// 5
	await f(page, '🧺 Lavar').getByRole('checkbox').click();
	await expect(aviso(page)).toContainText('Completaste «🧺 Lavar»');
	await expect(aviso(page)).not.toContainText('Primer paso');
	await irA(page, 'Historial');
	await verHistorial(page, [['Hoy', [['🧺 Lavar', '\\d\\d:\\d\\d']]]]);
	await expect(page.locator('body')).not.toContainText('Primer paso');
	await expect(page.locator('body')).not.toContainText(LAVAR);
	await irA(page, 'Pendientes');

	// 6: Anotar con la tarea en la lista (completada: se ve con Mostrar completadas).
	await encenderCompletadas(page);
	await expect(f(page, '🧺 Lavar')).toBeVisible();
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
	await expect(entrada).not.toContainText('Primer paso');
	await boton(page, 'Copiar').click();
	await expect(page.getByRole('status').filter({ hasText: 'Anotaciones copiadas' })).toBeVisible();
	const copiado = await page.evaluate(() => navigator.clipboard.readText());
	expect(copiado).toContain('salió bien');
	expect(copiado).not.toContain('Primer paso');
	expect(copiado).not.toContain(LAVAR);
});

test('Flujo 8: cambios sin guardar con el campo', async ({ page }) => {
	await sesionConReloj(page, VIERNES);
	await crear(page, { titulo: 'Lavar', tipo: NO_SE_REPITE, primerPaso: LAVAR });
	await crear(page, { titulo: 'Barrer', tipo: NO_SE_REPITE });

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
	await campo(page).fill('Juntar las llaves');
	await pideAvisoYDescarta();
	await dice(page, 'Lavar', LAVAR);

	// 2
	await abrirFila(page, 'Lavar');
	await campo(page).fill('Juntar las llaves');
	await campo(page).fill(LAVAR);
	await cierraDirecto();

	// 3
	await abrirFila(page, 'Lavar');
	await campo(page).fill(`   ${LAVAR}   `);
	await cierraDirecto();

	// 4
	await abrirFila(page, 'Lavar');
	await campo(page).fill('');
	await pideAvisoYDescarta();
	await abrirFila(page, 'Lavar');
	await campo(page).fill('   ');
	await pideAvisoYDescarta();
	await dice(page, 'Lavar', LAVAR);

	// 5
	await abrirFila(page, 'Barrer');
	await campo(page).fill('   ');
	await cierraDirecto();
	await abrirFila(page, 'Barrer');
	await campo(page).fill('Barrer abajo');
	await pideAvisoYDescarta();
	await sinLinea(page, 'Barrer');

	// 6
	await boton(page, '+').click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await cierraDirecto();
	await boton(page, '+').click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await campo(page).fill(LAVAR);
	await pideAvisoYDescarta();
});

async function dispositivos(browser: Browser) {
	const d = await dosDispositivos(browser, VIERNES);
	await encenderCompletadas(d.a);
	await encenderCompletadas(d.b);
	for (const p of [d.a, d.b]) {
		await mostrarPausadas(p).click();
		await expect(mostrarPausadas(p)).toBeChecked();
	}
	return d;
}

test('Flujo 9: dos dispositivos', async ({ browser }) => {
	const { a, b, ctxB, cerrar: fin } = await dispositivos(browser);
	const nota = (p: Page) => p.getByLabel('Nota');

	// 1
	await crear(a, { titulo: 'Lavar', tipo: NO_SE_REPITE, fecha: '' });
	await expect(f(b, 'Lavar')).toBeVisible();

	// 2
	await ctxB.setOffline(true);
	await escribir(b, 'Lavar', LAVAR);
	await abrirFila(a, 'Lavar');
	await a.getByLabel('Título').fill('Lavar a mano');
	await guardar(a);
	await llegaAlServidor(a);

	// 3
	await ctxB.setOffline(false);
	for (const p of [a, b]) {
		await expect(f(p, 'Lavar a mano')).toBeVisible();
		await dice(p, 'Lavar a mano', LAVAR);
	}

	// 4
	await ctxB.setOffline(true);
	await escribir(b, 'Lavar a mano', 'Juntar las llaves');
	await abrirFila(a, 'Lavar a mano');
	await nota(a).fill('Usar guantes');
	await guardar(a);
	await llegaAlServidor(a);
	await ctxB.setOffline(false);
	for (const p of [a, b]) {
		await dice(p, 'Lavar a mano', 'Juntar las llaves');
		await expect(async () => {
			await abrirFila(p, 'Lavar a mano');
			await expect(nota(p)).toHaveValue('Usar guantes', { timeout: 1000 });
			await cerrar(p);
		}).toPass({ timeout: 20_000 });
	}

	// 5
	await ctxB.setOffline(true);
	await escribir(b, 'Lavar a mano', 'Buscar el detergente');
	await escribir(a, 'Lavar a mano', 'Poner el agua a calentar');
	await llegaAlServidor(a);
	await ctxB.setOffline(false);
	for (const p of [a, b]) await dice(p, 'Lavar a mano', 'Buscar el detergente');

	// 6
	await ctxB.setOffline(true);
	await escribir(b, 'Lavar a mano', '');
	await escribir(a, 'Lavar a mano', 'Sacar la escalera');
	await llegaAlServidor(a);
	await ctxB.setOffline(false);
	for (const p of [a, b]) await expect(f(p, 'Lavar a mano')).not.toContainText('Primer paso');

	// 7
	await ctxB.setOffline(true);
	await escribir(b, 'Lavar a mano', 'Barrer abajo');
	await escribir(a, 'Lavar a mano', '');
	await llegaAlServidor(a);
	await ctxB.setOffline(false);
	for (const p of [a, b]) await dice(p, 'Lavar a mano', 'Barrer abajo');

	// 8
	await ctxB.setOffline(true);
	await escribir(b, 'Lavar a mano', LAVAR);
	await abrirFila(a, 'Lavar a mano');
	await guardar(a);
	await llegaAlServidor(a);
	await ctxB.setOffline(false);
	for (const p of [a, b]) await dice(p, 'Lavar a mano', LAVAR);

	await fin();
});
