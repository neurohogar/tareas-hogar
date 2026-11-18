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
} from './support';

// qa/pasos-de-a-uno.md: los campos de pasos del panel, la línea y los botones de la fila, Hecho en el último paso,
// cuándo se ve, lo que no cambia, Cambios sin guardar y dos dispositivos.

test.beforeEach(async () => {
	await limpiarEmuladores();
});

const VIERNES = '2026-11-13T10:00:00';
const P1 = 'Separar la ropa blanca';
const P2 = 'Poner el lavarropas';
const P3 = 'Tender la ropa';
const LARGO =
	'Abrir el cajón de abajo y sacar toda la ropa blanca y separarla en dos pilas: la que va con agua caliente y la que no se mezcla con nada de color oscuro ni delicado';
const NO_SE_REPITE = 'No se repite' as const;

/** La fila de la tarea de título exacto `t` (las demás filas pueden contener ese texto). */
const f = (page: Page, t: string): Locator =>
	page.getByRole('listitem').filter({ has: page.getByRole('button', { name: t, exact: true }) });
const linea = (page: Page, t: string) => f(page, t).getByText(/^(Primer paso|Paso): /);
const hecho = (page: Page, t: string) => f(page, t).getByRole('button', { name: 'Hecho', exact: true });
const anterior = (page: Page, t: string) => f(page, t).getByRole('button', { name: 'Paso anterior', exact: true });
const aviso = (page: Page) => page.getByRole('status').filter({ hasText: 'Completaste' });
const boton = (page: Page, nombre: string) => page.getByRole('button', { name: nombre, exact: true });
const primero = (page: Page) => page.getByRole('textbox', { name: 'Primer paso', exact: true });
const paso = (page: Page, n: number) => page.getByRole('textbox', { name: `Paso ${n}`, exact: true });
const camposPaso = (page: Page) => page.getByRole('textbox', { name: /^Paso \d+$/ });
const quitar = (page: Page, n: number) =>
	paso(page, n).locator('..').getByRole('button', { name: 'Quitar', exact: true });
const mostrarPausadas = (page: Page) => page.getByRole('checkbox', { name: 'Pausadas' });
const panel = (page: Page) => page.getByRole('dialog');
const avisoDeCambios = (page: Page) => page.getByRole('alertdialog', { name: 'Tenés cambios sin guardar' });
const titulos = (page: Page) =>
	page
		.getByRole('listitem')
		.getByRole('checkbox')
		.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')!.replace('Completar ', '')));

/** La fila dice exactamente `Primer paso: texto` (o `Paso: texto`), una sola vez. */
async function dice(page: Page, t: string, texto: string, esPrimero = false) {
	await expect(linea(page, t)).toHaveCount(1);
	await expect(linea(page, t)).toHaveText(`${esPrimero ? 'Primer paso' : 'Paso'}: ${texto}`);
}

/** Con dos pasos o más: Paso anterior (si va en otro que el primero) y Hecho, en ese orden. */
async function conBotones(page: Page, t: string, conAnterior: boolean) {
	await expect(hecho(page, t)).toHaveCount(1);
	await expect(anterior(page, t)).toHaveCount(conAnterior ? 1 : 0);
	if (conAnterior) {
		const a = (await anterior(page, t).boundingBox())!;
		const h = (await hecho(page, t).boundingBox())!;
		expect(a.x).toBeLessThan(h.x);
	}
}

/** La fila está a la vista y no tiene línea ni botones. */
async function sinLinea(page: Page, t: string) {
	await expect(f(page, t)).toBeVisible();
	await expect(f(page, t)).not.toContainText(/Primer paso|Paso/);
	await expect(hecho(page, t)).toHaveCount(0);
	await expect(anterior(page, t)).toHaveCount(0);
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

async function agregarPaso(page: Page, n: number, texto?: string) {
	await boton(page, 'Agregar paso').click();
	if (texto !== undefined) await paso(page, n).fill(texto);
}

const valoresDePasos = (page: Page) => camposPaso(page).evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));

/** Abre la fila y verifica Primer paso y los pasos más; cierra sin cambios. */
async function panelTiene(page: Page, t: string, esPrimero: string, pasos: string[]) {
	await abrirFila(page, t);
	await expect(primero(page)).toHaveValue(esPrimero);
	await expect.poll(() => valoresDePasos(page)).toEqual(pasos);
	await cerrar(page);
}

async function escribirPaso(page: Page, t: string, n: number, texto: string) {
	await abrirFila(page, t);
	await paso(page, n).fill(texto);
	await guardar(page);
}

async function escribirPrimero(page: Page, t: string, texto: string) {
	await abrirFila(page, t);
	await primero(page).fill(texto);
	await guardar(page);
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
			overflow: s.overflow,
			maxAlto: s.maxHeight,
			clamp: s.getPropertyValue('-webkit-line-clamp')
		};
	});

async function pausar(page: Page, t: string) {
	await abrirFila(page, t);
	await boton(page, 'Pausar').click();
	await expect(panel(page)).toHaveCount(0);
}

async function posponer(page: Page, t: string, opcion: '3 horas' | 'Hasta mañana') {
	await abrirFila(page, t);
	await boton(page, opcion).click();
	await expect(panel(page)).toHaveCount(0);
}

/** Sesión con el reloj corriendo 10 minutos antes de `hora` (las tareas se crean así). */
async function sesion(page: Page, hora: string, completadas = false) {
	await sesionConReloj(page, new Date(new Date(hora).getTime() - 600_000).toISOString());
	if (completadas) await encenderCompletadas(page);
}

/** Avanza el reloj hasta `hora` y deja correr un segundo para que la pantalla se actualice sola. */
async function ir(page: Page, hora: string) {
	const falta = new Date(hora).getTime() - (await page.evaluate(() => Date.now()));
	if (falta <= 10_000) await page.clock.runFor(falta);
	else await adelantar(page, hora);
	await page.clock.runFor(1000);
}

/** Completa con el checkbox justo a `hora` (el reloj de la prueba avanza unos ms por cada espera, y la vuelta se cuenta desde acá). */
async function completarA(page: Page, hora: string, t: string) {
	await page.clock.setSystemTime(new Date(hora));
	await f(page, t).getByRole('checkbox').click();
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

test('Flujo 1: los campos de pasos en el panel y crear', async ({ page }) => {
	await sesionConReloj(page, VIERNES);
	const y = async (l: Locator) => (await l.boundingBox())!.y;
	const ascendente = (ys: number[]) => {
		expect(ys).toEqual([...ys].sort((a, b) => a - b));
		expect(new Set(ys).size).toBe(ys.length);
	};

	// 1
	await boton(page, '+').click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await expect(primero(page)).toBeVisible();
	await expect(boton(page, 'Agregar paso')).toBeVisible();
	await expect(camposPaso(page)).toHaveCount(0);
	const titulo = page.getByLabel('Título');
	const emoji = page.getByRole('button', { name: /^(Elegir emoji|Cambiar emoji)/ });
	const nota = page.getByLabel('Nota');
	await expect(emoji).toBeVisible();
	ascendente([
		await y(titulo),
		await y(primero(page)),
		await y(boton(page, 'Agregar paso')),
		await y(nota)
	]);
	expect(Math.abs((await y(emoji)) - (await y(titulo)))).toBeLessThan((await y(primero(page))) - (await y(titulo)));

	// 2
	await titulo.fill('Lavar');
	await primero(page).fill(P1);
	await boton(page, 'Agregar paso').click();
	await expect(paso(page, 2)).toBeVisible();
	await expect(paso(page, 2)).toHaveValue('');
	await expect(paso(page, 2)).toBeFocused();
	await expect(paso(page, 2)).toHaveJSProperty('placeholder', '');
	await expect(quitar(page, 2)).toBeVisible();
	expect(Math.abs((await y(quitar(page, 2))) - (await y(paso(page, 2))))).toBeLessThan(30);
	expect(await y(boton(page, 'Agregar paso'))).toBeGreaterThan(await y(paso(page, 2)));
	await paso(page, 2).fill(P2);
	await boton(page, 'Agregar paso').click();
	await expect(paso(page, 3)).toBeFocused();
	await paso(page, 3).fill(P3);
	ascendente([
		await y(primero(page)),
		await y(paso(page, 2)),
		await y(paso(page, 3)),
		await y(boton(page, 'Agregar paso')),
		await y(nota)
	]);

	// 3
	await paso(page, 3).press('Enter');
	await expect(panel(page)).toHaveCount(0);
	await dice(page, 'Lavar', P1, true);
	await conBotones(page, 'Lavar', false);
	await expect(f(page, 'Lavar')).not.toContainText(P2);
	await expect(f(page, 'Lavar')).not.toContainText(P3);

	// 4
	await abrirFila(page, 'Lavar');
	await expect(primero(page)).toHaveValue(P1);
	await expect(paso(page, 2)).toHaveValue(P2);
	await expect(paso(page, 3)).toHaveValue(P3);
	await expect(quitar(page, 2)).toBeVisible();
	await expect(quitar(page, 3)).toBeVisible();
	await expect(panel(page)).not.toContainText(/en qué paso|paso actual/i);
	await cerrar(page);
	await page.reload();
	await panelTiene(page, 'Lavar', P1, [P2, P3]);

	// 5
	await crear(page, { titulo: 'Barrer', tipo: NO_SE_REPITE, fecha: '', primerPaso: 'Juntar la basura' });
	await dice(page, 'Barrer', 'Juntar la basura', true);
	await expect(hecho(page, 'Barrer')).toHaveCount(0);
	await expect(anterior(page, 'Barrer')).toHaveCount(0);

	// 6
	await crear(page, {
		titulo: 'Regar',
		tipo: 'Intervalo',
		cada: '2',
		unidad: 'días',
		primerPaso: 'Llenar la regadera',
		pasos: ['Regar los helechos']
	});
	await dice(page, 'Regar', 'Llenar la regadera', true);
	await conBotones(page, 'Regar', false);
	await crear(page, {
		titulo: 'Basura',
		tipo: 'Días de la semana',
		dias: ['martes'],
		primerPaso: 'Atar la bolsa llena',
		pasos: ['Bajar la basura']
	});
	await sinLinea(page, 'Basura'); // en espera hasta el martes

	// 7
	await crear(page, { titulo: 'Planchar', tipo: NO_SE_REPITE, fecha: '' });
	await sinLinea(page, 'Planchar');
});

test('Flujo 2: editar, recortar, descartar, quitar y sin máximos', async ({ page }) => {
	await sesionConReloj(page, VIERNES);
	await crear(page, { titulo: 'Lavar', tipo: NO_SE_REPITE, fecha: '', primerPaso: P1, pasos: [P2, P3] });

	// 1
	await escribirPaso(page, 'Lavar', 2, '  Juntar las llaves  ');
	await panelTiene(page, 'Lavar', P1, ['Juntar las llaves', P3]);

	// 2
	await abrirFila(page, 'Lavar');
	await pegar(page, paso(page, 2), 'uno\ndos');
	expect(await paso(page, 2).inputValue()).not.toContain('\n');
	await paso(page, 2).press('Enter');
	await expect(panel(page)).toHaveCount(0);
	await abrirFila(page, 'Lavar');
	expect(await paso(page, 2).inputValue()).not.toContain('\n');
	expect(await paso(page, 2).inputValue()).toMatch(/^uno ?dos$/);
	await cerrar(page);

	// 3
	await escribirPaso(page, 'Lavar', 2, '');
	await panelTiene(page, 'Lavar', P1, [P3]);

	// 4
	await abrirFila(page, 'Lavar');
	await paso(page, 2).fill('   ');
	await boton(page, 'Guardar').click();
	await expect(panel(page)).toHaveCount(0);
	await expect(page.getByRole('alert')).toHaveCount(0);
	await panelTiene(page, 'Lavar', P1, []);
	await abrirFila(page, 'Lavar');
	await agregarPaso(page, 2, P2);
	await guardar(page);
	await panelTiene(page, 'Lavar', P1, [P2]);

	// 5
	await escribirPrimero(page, 'Lavar', '');
	await dice(page, 'Lavar', P2, true);
	await panelTiene(page, 'Lavar', P2, []);

	// 6
	await abrirFila(page, 'Lavar');
	await agregarPaso(page, 2, 'A');
	await agregarPaso(page, 3, 'B');
	await guardar(page);
	await panelTiene(page, 'Lavar', P2, ['A', 'B']);
	await abrirFila(page, 'Lavar');
	await quitar(page, 2).click();
	await expect(paso(page, 2)).toHaveValue('B');
	await expect(paso(page, 3)).toHaveCount(0);
	await guardar(page);
	await panelTiene(page, 'Lavar', P2, ['B']);
	await abrirFila(page, 'Lavar');
	await boton(page, 'Agregar paso').click();
	await expect(paso(page, 3)).toHaveValue('');
	await guardar(page);
	await panelTiene(page, 'Lavar', P2, ['B']);

	// 7
	await abrirFila(page, 'Lavar');
	await pegar(page, paso(page, 2), 'a'.repeat(5000));
	await guardar(page);
	await expect(page.getByRole('alert')).toHaveCount(0);
	await abrirFila(page, 'Lavar');
	expect((await paso(page, 2).inputValue()).length).toBe(5000);
	await cerrar(page);

	// 8
	await abrirFila(page, 'Lavar');
	for (let i = 1; i <= 30; i++) await agregarPaso(page, i + 2, `p${i}`);
	await guardar(page);
	await expect(page.getByRole('alert')).toHaveCount(0);
	await abrirFila(page, 'Lavar');
	const valores = await (async () => {
		await expect(camposPaso(page)).toHaveCount(31);
		return valoresDePasos(page);
	})();
	expect(valores[0].length).toBe(5000);
	expect(valores.slice(1)).toEqual(Array.from({ length: 30 }, (_, i) => `p${i + 1}`));
	await cerrar(page);

	// 9
	await page.setViewportSize({ width: 390, height: 844 });
	await crear(page, {
		titulo: 'Cajón',
		tipo: NO_SE_REPITE,
		fecha: '',
		primerPaso: 'Abrir el cajón',
		pasos: [LARGO]
	});
	await hecho(page, 'Cajón').click();
	await dice(page, 'Cajón', LARGO);
	const l = linea(page, 'Cajón');
	const e = await estilo(l);
	expect(e.recorte).not.toBe('ellipsis');
	expect(e.overflow).not.toBe('hidden');
	expect(e.maxAlto).toBe('none');
	expect(e.clamp).not.toMatch(/^\d+$/);
	expect(await l.evaluate((n) => n.scrollHeight <= n.clientHeight + 1 && n.scrollWidth <= n.clientWidth + 1)).toBe(true);
	const caja = (await l.boundingBox())!;
	expect(caja.height).toBeGreaterThan(parseFloat(e.tamano) * 2.2);
	expect(caja.x + caja.width).toBeLessThanOrEqual(390);
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
	expect(await l.innerText()).not.toContain('…');
});

test('Flujo 3: avanzar y retroceder desde la fila', async ({ page }) => {
	await sesionConReloj(page, VIERNES);
	await crear(page, { titulo: 'Barrer', tipo: NO_SE_REPITE, fecha: '', horario: { desde: '08:00', hasta: '12:00' } });
	await crear(page, { titulo: 'Lavar', tipo: NO_SE_REPITE, fecha: '', primerPaso: P1, pasos: [P2, P3] });
	const sinAvisos = async () => {
		await expect(page.getByRole('heading', { name: 'Editar tarea' })).toHaveCount(0);
		await expect(panel(page)).toHaveCount(0);
		await expect(avisoDeCambios(page)).toHaveCount(0);
		await expect(page.getByRole('alertdialog')).toHaveCount(0);
		await expect(aviso(page)).toHaveCount(0);
	};

	// 1
	await dice(page, 'Lavar', P1, true);
	await conBotones(page, 'Lavar', false);
	const fondo = (await estilo(f(page, 'Lavar'))).fondo;

	// 2
	await hecho(page, 'Lavar').click();
	await dice(page, 'Lavar', P2);
	await conBotones(page, 'Lavar', true);
	await sinAvisos();
	await expect(f(page, 'Lavar')).not.toContainText(P3);
	await expect(f(page, 'Lavar')).not.toContainText(/\d+ de \d+|[Pp]aso \d/);

	// 3
	await anterior(page, 'Lavar').click();
	await dice(page, 'Lavar', P1, true);
	await conBotones(page, 'Lavar', false);
	await hecho(page, 'Lavar').click();
	await dice(page, 'Lavar', P2);
	await hecho(page, 'Lavar').click();
	await dice(page, 'Lavar', P3);
	await sinAvisos();

	// 4
	await page.reload();
	await dice(page, 'Lavar', P3);
	await conBotones(page, 'Lavar', true);

	// 5
	const c = (await linea(page, 'Lavar').boundingBox())!;
	await page.mouse.click(c.x + c.width / 2, c.y + c.height / 2);
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await expect(page.getByLabel('Título')).toHaveValue('Lavar');
	await expect(panel(page)).not.toContainText(/en qué paso|paso actual/i);
	await cerrar(page);
	await expect(avisoDeCambios(page)).toHaveCount(0);

	// 6
	const l = await estilo(linea(page, 'Lavar'));
	const r = await estilo(f(page, 'Barrer').getByText(/\d\d:\d\d–\d\d:\d\d/));
	expect(l.color).toBe(r.color);
	expect(l.tamano).toBe(r.tamano);
	expect(l.peso).toBeLessThan(600);
	expect(l.linea).not.toContain('underline');
	for (const b of [hecho(page, 'Lavar'), anterior(page, 'Lavar')]) {
		const e = await estilo(b);
		expect(e.color).toBe(l.color);
		expect(e.peso).toBeLessThan(600);
		expect(e.linea).not.toContain('underline');
		expect(e.fondo).toBe('rgba(0, 0, 0, 0)');
	}
	expect((await estilo(f(page, 'Lavar'))).fondo).toBe(fondo);
	expect((await estilo(f(page, 'Barrer'))).fondo).toBe(fondo);
});

test('Flujo 4: «Hecho» en el último paso completa la tarea', async ({ page }) => {
	await sesion(page, VIERNES, true);
	await conReloj(page, async () => {
		await crearYVer(page, {
			titulo: 'Regar',
			tipo: 'Intervalo',
			cada: '2',
			unidad: 'días',
			primerPaso: 'Llenar la regadera',
			pasos: ['Regar los helechos']
		});
		await crearYVer(page, {
			titulo: 'Cambiar foco',
			tipo: NO_SE_REPITE,
			fecha: '',
			primerPaso: 'Sacar la escalera',
			pasos: ['Cambiar el foco']
		});
	});
	await detener(page, VIERNES);

	// 1
	await hecho(page, 'Regar').click();
	await conReloj(page, () => dice(page, 'Regar', 'Regar los helechos'));
	await hecho(page, 'Regar').click();
	await conReloj(page, async () => {
		await expect(aviso(page)).toContainText('Completaste «Regar»');
		await expect(aviso(page)).toContainText(/Vuelve /);
		await expect(aviso(page)).not.toContainText('Paso');
		await expect(aviso(page).getByRole('button', { name: 'Deshacer' })).toBeVisible();
		await esperarEstado(page, 'Regar', 'en espera');
		await sinLinea(page, 'Regar');
	});

	// 2
	await aviso(page).getByRole('button', { name: 'Deshacer' }).click();
	await asentar(page);
	await conReloj(page, async () => {
		await esperarEstado(page, 'Regar', 'pendiente');
		await dice(page, 'Regar', 'Regar los helechos');
		await conBotones(page, 'Regar', true);
	});

	// 3
	await anterior(page, 'Regar').click();
	await conReloj(page, () => dice(page, 'Regar', 'Llenar la regadera', true));
	await hecho(page, 'Regar').click();
	await conReloj(page, () => dice(page, 'Regar', 'Regar los helechos'));
	await hecho(page, 'Regar').click();
	await conReloj(page, () => expect(aviso(page)).toContainText('Completaste «Regar»'));
	await page.clock.runFor(6000);
	await conReloj(page, () => expect(aviso(page)).toHaveCount(0));
	await irA(page, 'Historial');
	await conReloj(page, () => borrarDelHistorial(page, 'Regar'));
	await irA(page, 'Pendientes');
	await conReloj(page, async () => {
		await esperarEstado(page, 'Regar', 'pendiente');
		await dice(page, 'Regar', 'Regar los helechos');
	});

	// 4
	await hecho(page, 'Cambiar foco').click();
	await conReloj(page, () => dice(page, 'Cambiar foco', 'Cambiar el foco'));
	await hecho(page, 'Cambiar foco').click();
	await conReloj(page, async () => {
		await expect(aviso(page)).toContainText('Completaste «Cambiar foco»');
		await expect(f(page, 'Cambiar foco').getByRole('checkbox')).toBeChecked();
		await sinLinea(page, 'Cambiar foco');
	});
	await f(page, 'Cambiar foco').getByRole('checkbox').click();
	await asentar(page);
	await conReloj(page, async () => {
		await esperarEstado(page, 'Cambiar foco', 'pendiente');
		await dice(page, 'Cambiar foco', 'Cambiar el foco');
		await conBotones(page, 'Cambiar foco', true);
	});

	// 5
	await anterior(page, 'Regar').click();
	await conReloj(page, () => dice(page, 'Regar', 'Llenar la regadera', true));
	await completarA(page, VIERNES, 'Regar');
	await conReloj(page, async () => {
		await expect(aviso(page)).toContainText('Completaste «Regar»');
		await expect(aviso(page)).toContainText(/Vuelve /);
		await expect(aviso(page)).not.toContainText('Paso');
		await sinLinea(page, 'Regar');
	});
	await ir(page, '2026-11-15T10:00:00');
	await conReloj(page, async () => {
		await esperarEstado(page, 'Regar', 'pendiente');
		await dice(page, 'Regar', 'Llenar la regadera', true);
		await conBotones(page, 'Regar', false);
	});
	await hecho(page, 'Regar').click();
	await conReloj(page, () => dice(page, 'Regar', 'Regar los helechos'));
	await completarA(page, '2026-11-15T10:00:00', 'Regar');
	await conReloj(page, () => sinLinea(page, 'Regar'));
	await ir(page, '2026-11-17T10:00:00');
	await conReloj(page, async () => {
		await esperarEstado(page, 'Regar', 'pendiente');
		await dice(page, 'Regar', 'Llenar la regadera', true);
		await conBotones(page, 'Regar', false);
	});

	// 6
	await hecho(page, 'Regar').click();
	await conReloj(page, () => dice(page, 'Regar', 'Regar los helechos'));
	await f(page, 'Regar').getByRole('checkbox').click();
	await conReloj(page, () => expect(aviso(page)).toContainText('Completaste «Regar»'));
	await aviso(page).getByRole('button', { name: 'Deshacer' }).click();
	await asentar(page);
	await conReloj(page, async () => {
		await esperarEstado(page, 'Regar', 'pendiente');
		await dice(page, 'Regar', 'Regar los helechos');
		await conBotones(page, 'Regar', true);
	});
});

test('Flujo 5: dónde se ve y cuándo desaparece y vuelve', async ({ page }) => {
	await sesion(page, VIERNES, true);

	// 1
	await conReloj(page, async () => {
		await crearYVer(page, {
			titulo: 'Cambiar foco',
			tipo: NO_SE_REPITE,
			fecha: '',
			primerPaso: 'Sacar la escalera',
			pasos: ['Cambiar el foco']
		});
		await crearYVer(page, {
			titulo: 'Pagar',
			tipo: NO_SE_REPITE,
			fecha: '2026-11-10',
			primerPaso: 'Buscar la factura',
			pasos: ['Pagar en el banco']
		});
		await crearYVer(page, {
			titulo: 'Regar',
			tipo: 'Intervalo',
			cada: '8',
			unidad: 'horas',
			primerPaso: 'Llenar la regadera',
			pasos: ['Regar los helechos']
		});
	});
	await detener(page, VIERNES);
	await conReloj(page, async () => {
		await esperarEstado(page, 'Pagar', 'atrasada', undefined, false);
		await esperarEstado(page, 'Cambiar foco', 'pendiente');
		await esperarEstado(page, 'Regar', 'pendiente');
		for (const [t, p] of [
			['Pagar', 'Buscar la factura'],
			['Cambiar foco', 'Sacar la escalera'],
			['Regar', 'Llenar la regadera']
		]) {
			await dice(page, t, p, true);
			await conBotones(page, t, false);
		}
	});

	// 2
	const orden = await titulos(page);
	await hecho(page, 'Pagar').click();
	await conReloj(page, async () => {
		await dice(page, 'Pagar', 'Pagar en el banco');
		await conBotones(page, 'Pagar', true);
		await esperarEstado(page, 'Pagar', 'atrasada', undefined, false);
	});
	expect(await titulos(page)).toEqual(orden);

	// 9 (primero, con el reloj en el viernes): el checkbox completa en el paso 1 y deshacer lo devuelve.
	await f(page, 'Cambiar foco').getByRole('checkbox').click();
	await conReloj(page, async () => {
		await expect(aviso(page)).toContainText('Completaste «Cambiar foco»');
		await sinLinea(page, 'Cambiar foco');
	});
	await aviso(page).getByRole('button', { name: 'Deshacer' }).click();
	await asentar(page);
	await conReloj(page, async () => {
		await esperarEstado(page, 'Cambiar foco', 'pendiente');
		await dice(page, 'Cambiar foco', 'Sacar la escalera', true);
		await conBotones(page, 'Cambiar foco', false);
	});

	// 3 y 4: se pospone y se completa con el reloj en el viernes; luego se avanza.
	await posponer(page, 'Cambiar foco', '3 horas');
	await posponer(page, 'Pagar', 'Hasta mañana');
	await f(page, 'Regar').getByRole('checkbox').click();
	await conReloj(page, async () => {
		await sinLinea(page, 'Cambiar foco');
		await sinLinea(page, 'Pagar');
		await expect(f(page, 'Regar').getByRole('checkbox')).toBeChecked();
		await sinLinea(page, 'Regar');
	});
	await ir(page, '2026-11-13T13:01:00');
	await conReloj(page, async () => {
		await dice(page, 'Cambiar foco', 'Sacar la escalera', true);
		await conBotones(page, 'Cambiar foco', false);
		await sinLinea(page, 'Regar');
		await sinLinea(page, 'Pagar');
	});
	await ir(page, '2026-11-13T17:59:00');
	await conReloj(page, () => sinLinea(page, 'Regar'));
	await ir(page, '2026-11-13T18:00:00');
	await conReloj(page, async () => {
		await esperarEstado(page, 'Regar', 'pendiente', undefined, false);
		await dice(page, 'Regar', 'Llenar la regadera', true);
		await conBotones(page, 'Regar', false);
	});
	await ir(page, '2026-11-15T07:00:00');
	await conReloj(page, async () => {
		await esperarEstado(page, 'Pagar', 'atrasada', undefined, false);
		await dice(page, 'Pagar', 'Pagar en el banco');
		await conBotones(page, 'Pagar', true);
	});

	// 5
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
		await dice(page, 'Regar', 'Llenar la regadera', true);
		await conBotones(page, 'Regar', false);
	});

	// 6: con el reloj en el viernes.
	await retroceder(page, VIERNES);
	await conReloj(page, () =>
		crearYVer(page, {
			titulo: 'Basura',
			tipo: 'Días de la semana',
			dias: ['martes'],
			primerPaso: 'Atar la bolsa llena',
			pasos: ['Bajar la basura']
		})
	);
	await conReloj(page, () => sinLinea(page, 'Basura'));
	await ir(page, '2026-11-17T09:00:00');
	await conReloj(page, async () => {
		await esperarEstado(page, 'Basura', 'pendiente', undefined, false);
		await dice(page, 'Basura', 'Atar la bolsa llena', true);
		await conBotones(page, 'Basura', false);
	});

	// 7
	await conReloj(page, () =>
		crearYVer(page, {
			titulo: 'Llamar',
			tipo: NO_SE_REPITE,
			fecha: '',
			horario: { desde: '08:00', hasta: '09:00' },
			primerPaso: 'Buscar el número',
			pasos: ['Marcar']
		})
	);
	await conReloj(page, () => sinLinea(page, 'Llamar'));
	await ir(page, '2026-11-18T08:00:00');
	await conReloj(page, async () => {
		await esperarEstado(page, 'Llamar', 'pendiente', undefined, false);
		await dice(page, 'Llamar', 'Buscar el número', true);
		await conBotones(page, 'Llamar', false);
	});

	// 8: checkbox deshabilitado.
	await retroceder(page, '2026-11-13T07:00:00');
	await conReloj(page, () =>
		crearYVer(page, {
			titulo: 'Lavar',
			tipo: NO_SE_REPITE,
			fecha: '2026-11-10',
			horario: { desde: '08:00', hasta: '11:00' },
			primerPaso: P1,
			pasos: [P2]
		})
	);
	const check = f(page, 'Lavar').getByRole('checkbox');
	await conReloj(page, async () => {
		await expect(check).toBeDisabled();
		await expect(check).not.toBeChecked();
		await dice(page, 'Lavar', P1, true);
		await expect(hecho(page, 'Lavar')).toBeEnabled();
	});
	await hecho(page, 'Lavar').click();
	await conReloj(page, async () => {
		await dice(page, 'Lavar', P2);
		await expect(hecho(page, 'Lavar')).toBeDisabled();
		await expect(anterior(page, 'Lavar')).toBeEnabled();
	});
	await hecho(page, 'Lavar').click({ force: true });
	await conReloj(page, async () => {
		await dice(page, 'Lavar', P2);
		await expect(check).not.toBeChecked();
		await expect(aviso(page)).toHaveCount(0);
	});
	await ir(page, '2026-11-13T08:00:00');
	await conReloj(page, async () => {
		await expect(check).toBeEnabled();
		await expect(hecho(page, 'Lavar')).toBeEnabled();
	});
});

test('Flujo 6: editar los pasos y el avance', async ({ page }) => {
	await sesionConReloj(page, VIERNES);
	await mostrarPausadas(page).click();
	await expect(mostrarPausadas(page)).toBeChecked();
	await crear(page, { titulo: 'Lavar', tipo: NO_SE_REPITE, fecha: '', primerPaso: P1, pasos: [P2, P3] });
	await hecho(page, 'Lavar').click();
	await dice(page, 'Lavar', P2);
	await hecho(page, 'Lavar').click();
	await dice(page, 'Lavar', P3);

	// 1
	await escribirPaso(page, 'Lavar', 2, 'Cargar el lavarropas');
	await dice(page, 'Lavar', P3);

	// 2
	await escribirPaso(page, 'Lavar', 3, '');
	await dice(page, 'Lavar', 'Cargar el lavarropas');
	await conBotones(page, 'Lavar', true);
	await abrirFila(page, 'Lavar');
	await agregarPaso(page, 3, 'Guardar la ropa');
	await guardar(page);
	await dice(page, 'Lavar', 'Guardar la ropa');

	// 3
	await abrirFila(page, 'Lavar');
	await paso(page, 3).fill('');
	await paso(page, 2).fill('');
	await guardar(page);
	await dice(page, 'Lavar', P1, true);
	await expect(hecho(page, 'Lavar')).toHaveCount(0);
	await expect(anterior(page, 'Lavar')).toHaveCount(0);
	await abrirFila(page, 'Lavar');
	await agregarPaso(page, 2, P2);
	await agregarPaso(page, 3, P3);
	await guardar(page);
	await dice(page, 'Lavar', P3);
	await conBotones(page, 'Lavar', true);

	// 4
	await hecho(page, 'Lavar').click();
	await expect(aviso(page)).toContainText('Completaste «Lavar»');
	await aviso(page).getByRole('button', { name: 'Deshacer' }).click();
	await expect(aviso(page)).toHaveCount(0);
	await dice(page, 'Lavar', P3);

	// 5
	const mismos = async () => {
		await panelTiene(page, 'Lavar', P1, [P2, P3]);
	};
	await abrirFila(page, 'Lavar');
	await completarPanel(page, { tipo: 'Intervalo', cada: '3', unidad: 'días' });
	await guardar(page);
	await mismos();
	await dice(page, 'Lavar', P3);
	await pausar(page, 'Lavar');
	await expect(f(page, 'Lavar').getByText('Pausada')).toBeVisible();
	await mismos();
	await abrirFila(page, 'Lavar');
	await boton(page, 'Reanudar').click();
	await expect(panel(page)).toHaveCount(0);
	await dice(page, 'Lavar', P3);
	await abrirFila(page, 'Lavar');
	await completarPanel(page, { tipo: 'Días de la semana', dias: ['martes'] });
	await guardar(page);
	await mismos();
	await abrirFila(page, 'Lavar');
	await completarPanel(page, { tipo: NO_SE_REPITE, fecha: '' });
	await guardar(page);
	await mismos();
	await dice(page, 'Lavar', P3);
	await posponer(page, 'Lavar', '3 horas');
	await mismos();
	await ir(page, '2026-11-13T13:01:00');
	await dice(page, 'Lavar', P3);

	// 6
	await page.reload();
	await dice(page, 'Lavar', P3);
	await mismos();
	await abrirFila(page, 'Lavar');
	await expect(panel(page).getByRole('progressbar')).toHaveCount(0);
	await expect(panel(page).getByRole('spinbutton', { name: /paso/i })).toHaveCount(0);
	await expect(panel(page).getByRole('combobox', { name: /paso/i })).toHaveCount(0);
	await cerrar(page);
	await expect(page.locator('body')).not.toContainText(/paso \d+ de \d+|paso actual/i);
	await expect(page.getByRole('progressbar')).toHaveCount(0);
});

test('Flujo 7: lo que no cambia, lo que no lo muestra y Cambios sin guardar', async ({ page }) => {
	await sesionConReloj(page, VIERNES);
	const textos = async (t: string[]) => Promise.all(t.map((x) => f(page, x).innerText()));

	// 1
	await crear(page, { titulo: 'Barrer', tipo: NO_SE_REPITE, fecha: '' });
	await crear(page, { titulo: 'Lavar', tipo: NO_SE_REPITE, fecha: '' });
	await crear(page, { titulo: 'Planchar', tipo: NO_SE_REPITE, fecha: '' });
	const orden = await titulos(page);
	expect([...orden].sort()).toEqual(['Barrer', 'Lavar', 'Planchar']);
	const antes = await textos(['Barrer', 'Planchar']);

	// 2
	await abrirFila(page, 'Lavar');
	await primero(page).fill(P1);
	await agregarPaso(page, 2, P2);
	await agregarPaso(page, 3, P3);
	await guardar(page);
	await hecho(page, 'Lavar').click();
	await dice(page, 'Lavar', P2);
	expect(await titulos(page)).toEqual(orden);
	expect(await textos(['Barrer', 'Planchar'])).toEqual(antes);
	await abrirFila(page, 'Barrer');
	await primero(page).fill('Barrer abajo');
	await agregarPaso(page, 2, 'Juntar');
	await guardar(page);
	await abrirFila(page, 'Lavar');
	await primero(page).fill('');
	await paso(page, 2).fill('');
	await paso(page, 3).fill('');
	await guardar(page);
	await sinLinea(page, 'Lavar');
	expect(await titulos(page)).toEqual(orden);
	await abrirFila(page, 'Lavar');
	await primero(page).fill(P1);
	await agregarPaso(page, 2, P2);
	await agregarPaso(page, 3, P3);
	await guardar(page);
	await dice(page, 'Lavar', P2); // editar no cambia el paso en que va
	await anterior(page, 'Lavar').click();
	await dice(page, 'Lavar', P1, true);

	// Barrer y Lavar muestran sus pasos; vaciar los de Barrer no toca a Planchar.
	await dice(page, 'Barrer', 'Barrer abajo', true);
	await dice(page, 'Lavar', P1, true);
	await abrirFila(page, 'Barrer');
	await primero(page).fill('');
	await paso(page, 2).fill('');
	await guardar(page);
	await sinLinea(page, 'Barrer');
	expect(await textos(['Planchar'])).toEqual([antes[1]]);

	// 3
	await abrirFila(page, 'Lavar');
	await elegirEmoji(page, '🧺', 'cesta');
	await guardar(page);
	await expect(f(page, '🧺 Lavar').getByRole('button', { name: '🧺 Lavar', exact: true })).toBeVisible();
	await dice(page, '🧺 Lavar', P1, true);
	const b = (await f(page, '🧺 Lavar').getByRole('button', { name: '🧺 Lavar', exact: true }).boundingBox())!;
	expect((await linea(page, '🧺 Lavar').boundingBox())!.y).toBeGreaterThanOrEqual(b.y + b.height - 2);
	await expect(f(page, '🧺 Lavar').getByRole('button', { name: '🧺 Lavar', exact: true })).not.toContainText(P1);

	// 4: Lavar en el paso 1 de 3.
	await hecho(page, '🧺 Lavar').click();
	await dice(page, '🧺 Lavar', P2);
	await hecho(page, '🧺 Lavar').click();
	await dice(page, '🧺 Lavar', P3);
	await hecho(page, '🧺 Lavar').click();
	await expect(aviso(page)).toContainText('Completaste «🧺 Lavar»');
	await expect(aviso(page)).not.toContainText(/Paso|Primer/);
	for (const p of [P1, P2, P3]) await expect(aviso(page)).not.toContainText(p);
	await irA(page, 'Historial');
	await verHistorial(page, [['Hoy', [['🧺 Lavar', '\\d\\d:\\d\\d']]]]);
	await expect(page.locator('body')).not.toContainText(/Primer paso|Paso:/);
	for (const p of [P1, P2, P3]) await expect(page.locator('body')).not.toContainText(p);
	await irA(page, 'Pendientes');

	// 5
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
	await expect(entrada).not.toContainText(/Primer paso|Paso:/);
	for (const p of [P1, P2, P3]) await expect(entrada).not.toContainText(p);
	await boton(page, 'Copiar').click();
	await expect(page.getByRole('status').filter({ hasText: 'Anotaciones copiadas' })).toBeVisible();
	const copiado = await page.evaluate(() => navigator.clipboard.readText());
	expect(copiado).toContain('salió bien');
	expect(copiado).not.toMatch(/Primer paso|Paso:/);
	for (const p of [P1, P2, P3]) expect(copiado).not.toContain(p);
	await irA(page, 'Pendientes');

	// 6 en adelante: Lavar con Primer paso y Paso 2 (se le quita el Paso 3).
	const L = '🧺 Lavar';
	await abrirFila(page, L);
	await quitar(page, 3).click();
	await guardar(page);
	await panelTiene(page, L, P1, [P2]);
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
	await page.getByRole('navigation').getByRole('link', { name: 'Pendientes' }).waitFor();
	const textoDeLaFila = await f(page, L).innerText();

	// 6
	await abrirFila(page, L);
	await paso(page, 2).fill('Juntar las llaves');
	await pideAvisoYDescarta();
	expect(await f(page, L).innerText()).toBe(textoDeLaFila);
	await panelTiene(page, L, P1, [P2]);

	// 7
	await abrirFila(page, L);
	await paso(page, 2).fill('Juntar las llaves');
	await paso(page, 2).fill(P2);
	await cierraDirecto();
	await abrirFila(page, L);
	await paso(page, 2).fill(`   ${P2}   `);
	await cierraDirecto();

	// 8
	await abrirFila(page, L);
	await paso(page, 2).fill('');
	await pideAvisoYDescarta();
	await abrirFila(page, L);
	await paso(page, 2).fill('   ');
	await pideAvisoYDescarta();

	// 9
	await abrirFila(page, L);
	await boton(page, 'Agregar paso').click();
	await cierraDirecto();
	await abrirFila(page, L);
	await agregarPaso(page, 3, P3);
	await pideAvisoYDescarta();
	await abrirFila(page, L);
	await agregarPaso(page, 3, '   ');
	await cierraDirecto();

	// 10
	await abrirFila(page, L);
	await quitar(page, 2).click();
	await pideAvisoYDescarta();
	await abrirFila(page, L);
	await boton(page, 'Agregar paso').click();
	await quitar(page, 3).click();
	await cierraDirecto();
	await panelTiene(page, L, P1, [P2]);

	// 11
	await boton(page, '+').click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await boton(page, 'Agregar paso').click();
	await cierraDirecto();
	await boton(page, '+').click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await agregarPaso(page, 2, P2);
	await pideAvisoYDescarta();

	// 12: se desmarca Lavar para tener sus botones; Hecho y Paso anterior no abren nada.
	await f(page, L).getByRole('checkbox').click();
	await expect(hecho(page, L)).toBeVisible();
	if ((await anterior(page, L).count()) > 0) await anterior(page, L).click();
	await dice(page, L, P1, true);
	await hecho(page, L).click();
	await dice(page, L, P2);
	await anterior(page, L).click();
	await dice(page, L, P1, true);
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
	test.setTimeout(300_000);
	const { a, b, ctxB, cerrar: fin } = await dispositivos(browser);
	const ambos = [a, b];
	const sincronizar = async () => {
		await llegaAlServidor(a);
		await ctxB.setOffline(false);
		await a.waitForTimeout(10_000); // B reconecta y sus escrituras pendientes llegan; las dos pantallas se actualizan solas
	};
	/** El panel muestra esos valores en `p` (con reintentos mientras llega la sincronización). */
	const panelEs = (p: Page, esPrimero: string, pasos: string[]) =>
		expect(async () => {
			await abrirFila(p, 'Lavar');
			await expect(primero(p)).toHaveValue(esPrimero, { timeout: 1000 });
			expect(await valoresDePasos(p)).toEqual(pasos);
			await cerrar(p);
		}).toPass({ timeout: 60_000 });

	// 1
	await crear(a, { titulo: 'Lavar', tipo: NO_SE_REPITE, fecha: '', primerPaso: P1, pasos: [P2, P3] });
	await expect(f(b, 'Lavar')).toBeVisible();
	for (const p of ambos) await dice(p, 'Lavar', P1, true);

	// 2
	await ctxB.setOffline(true);
	await hecho(b, 'Lavar').click();
	await hecho(a, 'Lavar').click();
	await sincronizar();
	for (const p of ambos) await dice(p, 'Lavar', P2);

	// 3
	await ctxB.setOffline(true);
	await hecho(b, 'Lavar').click();
	await dice(b, 'Lavar', P3);
	await escribirPaso(a, 'Lavar', 2, 'Juntar las llaves');
	await sincronizar();
	for (const p of ambos) {
		await dice(p, 'Lavar', P3);
		await panelEs(p, P1, ['Juntar las llaves', P3]);
	}

	// 4
	await ctxB.setOffline(true);
	await escribirPaso(b, 'Lavar', 2, 'Buscar el detergente');
	await anterior(a, 'Lavar').click();
	await sincronizar();
	for (const p of ambos) {
		await dice(p, 'Lavar', 'Buscar el detergente');
		await panelEs(p, P1, ['Buscar el detergente', P3]);
	}

	// 5
	await ctxB.setOffline(true);
	await escribirPaso(b, 'Lavar', 2, 'Buscar la esponja');
	await escribirPaso(a, 'Lavar', 2, 'Poner el agua a calentar');
	await sincronizar();
	for (const p of ambos) await dice(p, 'Lavar', 'Buscar la esponja');

	// 6
	await ctxB.setOffline(true);
	await escribirPaso(b, 'Lavar', 2, 'Barrer abajo');
	await escribirPaso(a, 'Lavar', 3, 'Guardar la ropa');
	await sincronizar();
	for (const p of ambos) await panelEs(p, P1, ['Barrer abajo', P3]);

	// 7
	await ctxB.setOffline(true);
	await escribirPrimero(b, 'Lavar', 'Juntar las llaves');
	await escribirPaso(a, 'Lavar', 2, 'Tender la ropa');
	await sincronizar();
	for (const p of ambos) await panelEs(p, 'Juntar las llaves', ['Tender la ropa', P3]);

	// 8
	await ctxB.setOffline(true);
	await escribirPaso(b, 'Lavar', 2, 'Barrer abajo');
	await abrirFila(a, 'Lavar');
	await guardar(a);
	await sincronizar();
	for (const p of ambos) await panelEs(p, 'Juntar las llaves', ['Barrer abajo', P3]);

	await fin();
});
