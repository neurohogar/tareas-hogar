import { expect, test, type Locator, type Page } from '@playwright/test';
import {
	abrir,
	agregarEtiqueta,
	agregarHorario,
	campoDesde,
	campoEtiquetas,
	campoHasta,
	cerrar,
	descartar,
	completar,
	crear,
	dosDispositivos,
	elegirEmoji,
	fila,
	fijarDias,
	limpiarEmuladores,
	llegaAlServidor,
	selectorEmoji,
	sesionConReloj,
	soloEnUnHorario
} from './apoyo';

// qa/panel-mobile.md: el panel de edición en pestañas. Celular: 360x640 con emulación táctil.
test.use({ viewport: { width: 360, height: 640 }, hasTouch: true });

test.beforeEach(async () => {
	await limpiarEmuladores();
});

const HORA = '2026-07-15T10:00:00';

const panel = (page: Page) => page.getByRole('dialog').first();
const pestana = (page: Page, nombre: string) => page.getByRole('tab', { name: new RegExp(`^${nombre}`) });
const marca = (page: Page, nombre: string) => pestana(page, nombre).getByRole('img', { name: 'con errores' });
const guardar = (page: Page) => page.getByRole('button', { name: 'Guardar', exact: true });
const contenido = (page: Page) => panel(page).locator('.contenido');
const encabezado = (page: Page) => panel(page).locator('header');
const titulo = (page: Page) => page.getByLabel('Título');
const nuevaTarea = (page: Page) => page.getByRole('button', { name: '+' }).click();

/** La caja de `l` está entera dentro del viewport actual. */
async function dentro(page: Page, l: Locator) {
	const c = (await l.boundingBox())!;
	const v = page.viewportSize()!;
	expect(c).not.toBeNull();
	expect(c.x).toBeGreaterThanOrEqual(-0.5);
	expect(c.y).toBeGreaterThanOrEqual(-0.5);
	expect(c.x + c.width).toBeLessThanOrEqual(v.width + 0.5);
	expect(c.y + c.height).toBeLessThanOrEqual(v.height + 0.5);
}

/** Visible: dentro del viewport y no tapado por otro elemento (el punto central es de `l` o de un descendiente). */
async function visibleSinTapar(page: Page, l: Locator) {
	await expect(l).toBeVisible();
	await dentro(page, l);
	const libre = await l.evaluate((e) => {
		const r = e.getBoundingClientRect();
		const arriba = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
		return !!arriba && (e === arriba || e.contains(arriba) || arriba.contains(e));
	});
	expect(libre).toBe(true);
}

const caja = async (l: Locator) => (await l.boundingBox())!;
const scroll = (l: Locator) => l.evaluate((e) => e.scrollTop);

/** Sin desplazamiento horizontal en el formulario y en el contenido. */
async function sinDesborde(page: Page) {
	const medidas = await page.evaluate(() => {
		const f = document.querySelector('form')!;
		const c = document.querySelector('.contenido')!;
		return { f: [f.scrollWidth, f.clientWidth], c: [c.scrollWidth, c.clientWidth], d: [document.documentElement.scrollWidth, document.documentElement.clientWidth] };
	});
	expect(medidas.f[0]).toBeLessThanOrEqual(medidas.f[1]);
	expect(medidas.c[0]).toBeLessThanOrEqual(medidas.c[1]);
	expect(medidas.d[0]).toBeLessThanOrEqual(medidas.d[1]);
}

/** Emula el teclado en pantalla abierto: enfoca `campo` y achica el viewport visual. */
async function abrirTeclado(page: Page, campo: Locator) {
	await campo.click();
	await page.setViewportSize({ width: 360, height: 300 });
}
async function cerrarTeclado(page: Page) {
	await page.setViewportSize({ width: 360, height: 640 });
}

async function crearRegar(page: Page) {
	await crear(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await expect(fila(page, 'Regar')).toBeVisible();
}

// ---------------------------------------------------------------------------------------------

test('Flujo 1: crear en el celular', async ({ page }) => {
	await sesionConReloj(page, HORA);
	await nuevaTarea(page);

	// 1: pantalla completa, sin foco, sin teclado.
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	const p = await caja(panel(page));
	expect(p).toMatchObject({ x: 0, width: 360 });
	expect(p.y + p.height).toBeCloseTo(640, 0);
	expect(await page.evaluate(() => /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? ''))).toBe(false);
	await expect(titulo(page)).not.toBeFocused();
	await expect(guardar(page)).toBeVisible();

	// 2: pestañas Tarea y Cuándo, sin Acciones.
	await expect(page.getByRole('tab')).toHaveText([/^\s*Tarea/, /^\s*Cuándo/]);
	await expect(pestana(page, 'Acciones')).toHaveCount(0);
	await expect(pestana(page, 'Tarea')).toHaveAttribute('aria-selected', 'true');
	await expect(titulo(page)).toBeVisible();
	await expect(page.getByRole('button', { name: 'Elegir emoji' })).toBeVisible();
	await expect(page.getByLabel('Nota')).toBeVisible();
	await expect(page.getByRole('combobox', { name: 'Esfuerzo' })).toBeVisible();
	await expect(campoEtiquetas(page)).toBeVisible();
	await expect(page.getByRole('radio', { name: 'Intervalo' })).toBeHidden();
	await expect(soloEnUnHorario(page)).toBeHidden();
	await visibleSinTapar(page, guardar(page));

	// 3: Cuándo.
	await pestana(page, 'Cuándo').click();
	await expect(pestana(page, 'Cuándo')).toHaveAttribute('aria-selected', 'true');
	const radios = ['No se repite', 'Intervalo', 'Días de la semana', 'Días del mes'].map((n) => page.getByRole('radio', { name: n }));
	const cajas = [];
	for (const r of radios) cajas.push(await caja(r.locator('xpath=ancestor::label[1]')));
	expect(Math.abs(cajas[0].y - cajas[1].y)).toBeLessThan(4);
	expect(Math.abs(cajas[2].y - cajas[3].y)).toBeLessThan(4);
	expect(cajas[2].y).toBeGreaterThan(cajas[0].y + 10);
	expect(Math.abs(cajas[0].x - cajas[2].x)).toBeLessThan(4);
	await expect(radios[0]).toBeChecked();
	await expect(soloEnUnHorario(page)).toBeVisible();
	await visibleSinTapar(page, guardar(page));
	await pestana(page, 'Tarea').click();
	await expect(titulo(page)).toBeVisible();

	// 4: deslizar no cambia de pestaña.
	const c = await caja(contenido(page));
	const y = c.y + c.height / 2;
	await page.mouse.move(c.x + c.width - 20, y);
	await page.mouse.down();
	await page.mouse.move(c.x + 20, y, { steps: 8 });
	await page.mouse.up();
	await expect(pestana(page, 'Tarea')).toHaveAttribute('aria-selected', 'true');
	await expect(pestana(page, 'Cuándo')).toHaveAttribute('aria-selected', 'false');

	// 5: crear Regar.
	await titulo(page).fill('Regar');
	await pestana(page, 'Cuándo').click();
	await page.getByRole('radio', { name: 'Intervalo' }).check();
	await page.getByRole('spinbutton', { name: 'Cada' }).fill('2');
	await page.getByLabel('Unidad').selectOption({ label: 'días' });
	await guardar(page).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(fila(page, 'Regar')).toBeVisible();

	// 6: Cerrar descarta.
	await nuevaTarea(page);
	await cerrar(page);
	await expect(page.getByRole('listitem').filter({ has: page.getByRole('checkbox') })).toHaveCount(1);
});

test('Flujo 2: editar y las tres pestañas', async ({ page }) => {
	await sesionConReloj(page, HORA);
	await crear(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'horas', emoji: '🌱', nota: 'Las del balcón', esfuerzo: 'Media (≈ 15 min)', etiquetas: ['casa'] });
	await expect(fila(page, 'Regar')).toBeVisible();
	await page.clock.setSystemTime(new Date('2026-07-15T08:00:00'));
	await completar(page, 'Regar');
	await page.clock.setSystemTime(new Date(HORA));
	await page.getByRole('checkbox', { name: 'Completadas' }).check();

	// 1
	await abrir(page, 'Regar');
	await expect(page.getByRole('tab')).toHaveText([/Tarea/, /Cuándo/, /Acciones/]);
	await pestana(page, 'Acciones').click();
	await cerrar(page);
	await abrir(page, 'Regar');
	await expect(pestana(page, 'Tarea')).toHaveAttribute('aria-selected', 'true');

	// 2: orden en Tarea.
	await expect(page.getByText('Última vez: hoy 08:00')).toBeVisible();
	await expect(panel(page).getByText('Pausada', { exact: true })).toHaveCount(0);
	await expect(panel(page).getByText(/Pospuesta/)).toHaveCount(0);
	const yUltima = (await caja(page.getByText('Última vez: hoy 08:00'))).y;
	const yTitulo = (await caja(titulo(page))).y;
	const yQuitar = (await caja(page.getByRole('button', { name: 'Quitar emoji' }))).y;
	const yNota = (await caja(page.getByLabel('Nota'))).y;
	const yEsfuerzo = (await caja(page.getByRole('combobox', { name: 'Esfuerzo' }))).y;
	const yEtiquetas = (await caja(campoEtiquetas(page))).y;
	expect(yUltima).toBeLessThan(yTitulo);
	expect(yTitulo).toBeLessThan(yQuitar);
	expect(yQuitar).toBeLessThan(yNota);
	expect(yNota).toBeLessThan(yEsfuerzo);
	expect(yEsfuerzo).toBeLessThan(yEtiquetas);
	await expect(titulo(page)).toHaveValue('Regar');
	const boton = page.getByRole('button', { name: /Cambiar emoji/ });
	await expect(boton).toHaveText('🌱');
	const cb = await caja(boton);
	const ct = await caja(titulo(page));
	expect(Math.abs(cb.y + cb.height / 2 - (ct.y + ct.height / 2))).toBeLessThan(ct.height);
	await expect(page.getByLabel('Nota')).toHaveValue('Las del balcón');

	// 3
	await pestana(page, 'Cuándo').click();
	await expect(page.getByRole('radio', { name: 'Intervalo' })).toBeChecked();
	await expect(page.getByRole('spinbutton', { name: 'Cada' })).toHaveValue('2');
	await expect(page.getByLabel('Unidad')).toHaveValue('horas');
	await expect(soloEnUnHorario(page)).not.toBeChecked();

	// 4
	await pestana(page, 'Acciones').click();
	const acciones = ['1 hora', '3 horas', 'Hasta mañana', 'Pausar', 'Borrar tarea'];
	for (const a of acciones) {
		const b = page.getByRole('button', { name: a, exact: true });
		await expect(b).toBeVisible();
		await expect(b.locator('svg')).toHaveCount(1);
	}
	await expect(page.getByRole('button', { name: 'Posponer', exact: true })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Quitar posponer' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Reanudar' })).toHaveCount(0);
	const borrar = page.getByRole('button', { name: 'Borrar tarea' });
	const yPausar = (await caja(page.getByRole('button', { name: 'Pausar', exact: true }))).y;
	const cbo = await caja(borrar);
	expect(cbo.y).toBeGreaterThan(yPausar + 44);
	const colorBorrar = await borrar.evaluate((e) => getComputedStyle(e).color);
	const colorError = await page.evaluate(() => {
		const t = document.createElement('i');
		t.style.color = 'var(--error)';
		document.body.append(t);
		const c = getComputedStyle(t).color;
		t.remove();
		return c;
	});
	expect(colorBorrar).toBe(colorError);

	// 5
	await page.getByRole('button', { name: '1 hora', exact: true }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await abrir(page, 'Regar');
	await expect(pestana(page, 'Tarea')).toHaveAttribute('aria-selected', 'true');
	await expect(panel(page).getByText('Pospuesta hasta 11:00')).toBeVisible();
	await pestana(page, 'Acciones').click();
	await expect(page.getByRole('button', { name: 'Quitar posponer' })).toBeVisible();
	await expect(page.getByRole('button', { name: '1 hora', exact: true })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Pausar', exact: true })).toBeVisible();

	// 6
	await page.getByRole('button', { name: 'Quitar posponer' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await abrir(page, 'Regar');
	await expect(panel(page).getByText(/Pospuesta/)).toHaveCount(0);

	// 7
	await pestana(page, 'Acciones').click();
	await page.getByRole('button', { name: 'Pausar', exact: true }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await page.getByRole('checkbox', { name: 'Pausadas' }).check();
	await abrir(page, 'Regar');
	await expect(panel(page).getByText('Pausada')).toBeVisible();
	await pestana(page, 'Acciones').click();
	await expect(page.getByRole('button', { name: 'Reanudar' })).toBeVisible();
	await expect(page.getByRole('button', { name: '1 hora', exact: true })).toHaveCount(0);
	await cerrar(page);

	// 8
	await crear(page, { titulo: 'Pagar', tipo: 'No se repite' });
	await abrir(page, 'Pagar');
	await pestana(page, 'Acciones').click();
	await expect(page.getByRole('button', { name: 'Pausar', exact: true })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Reanudar' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: '1 hora', exact: true })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Borrar tarea' })).toBeVisible();
	await cerrar(page);
	await completar(page, 'Pagar');
	await abrir(page, 'Pagar');
	await expect(pestana(page, 'Acciones')).toBeVisible();
	await pestana(page, 'Acciones').click();
	await expect(page.getByRole('button', { name: 'Borrar tarea' })).toBeVisible();
});

test('Flujo 3: pantalla completa y barras fijas', async ({ page }) => {
	await sesionConReloj(page, HORA);
	await crearRegar(page);
	await abrir(page, 'Regar');

	// 1
	const pc = await caja(panel(page));
	expect(pc).toMatchObject({ x: 0, y: 0, width: 360, height: 640 });
	const pos = async () => ({
		h: await caja(encabezado(page)),
		t: await caja(page.getByRole('tablist')),
		g: await caja(guardar(page))
	});
	// 2: con lo mucho que se escribe y un viewport bajo, el contenido no entra.
	for (const e of ['casa', 'cocina', 'jardín', 'limpieza', 'compras']) await agregarEtiqueta(page, e);
	await page.getByLabel('Nota').fill(Array.from({ length: 10 }, (_, i) => `línea ${i + 1}`).join('\n'));
	await page.getByRole('heading', { name: 'Editar tarea' }).click();
	await page.setViewportSize({ width: 360, height: 440 });
	const antes = await pos();
	await expect.poll(() => contenido(page).evaluate((e) => e.scrollHeight > e.clientHeight)).toBe(true);
	await contenido(page).hover();
	await page.mouse.wheel(0, 3000);
	await expect.poll(() => scroll(contenido(page))).toBeGreaterThan(0);
	expect(await pos()).toEqual(antes);
	await visibleSinTapar(page, guardar(page));
	await visibleSinTapar(page, page.getByRole('tablist'));
	await visibleSinTapar(page, page.getByRole('button', { name: 'Cerrar' }));

	// 3
	await pestana(page, 'Cuándo').click();
	expect(await scroll(contenido(page))).toBe(0);
	await pestana(page, 'Tarea').click();
	expect(await scroll(contenido(page))).toBe(0);

	// 4
	await pestana(page, 'Cuándo').click();
	await page.getByRole('radio', { name: 'Días de la semana' }).check();
	await soloEnUnHorario(page).check();
	for (let i = 0; i < 3; i++) await agregarHorario(page).click();
	for (let i = 0; i < 4; i++) {
		await campoDesde(page, i).fill('08:00');
		await campoHasta(page, i).fill('09:00');
	}
	await expect.poll(() => contenido(page).evaluate((e) => e.scrollHeight > e.clientHeight)).toBe(true);
	await page.mouse.wheel(0, 3000);
	await expect.poll(() => scroll(contenido(page))).toBeGreaterThan(0);
	expect(await pos()).toEqual(antes);
	await sinDesborde(page);
	await page.setViewportSize({ width: 320, height: 568 });
	await sinDesborde(page);
	await visibleSinTapar(page, guardar(page));
	await page.setViewportSize({ width: 360, height: 640 });
});

test('Problema original: sin desborde lateral ni Guardar fuera de pantalla', async ({ page }) => {
	await sesionConReloj(page, HORA);
	await crear(page, { titulo: 'Periódica', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await crear(page, { titulo: 'Pospuesta', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await crear(page, { titulo: 'Pausada', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await abrir(page, 'Pospuesta');
	await pestana(page, 'Acciones').click();
	await page.getByRole('button', { name: '1 hora', exact: true }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await abrir(page, 'Pausada');
	await pestana(page, 'Acciones').click();
	await page.getByRole('button', { name: 'Pausar', exact: true }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await page.getByRole('checkbox', { name: 'Pausadas' }).check();

	for (const [ancho, alto] of [
		[360, 640],
		[320, 568]
	]) {
		await page.setViewportSize({ width: ancho, height: alto });
		for (const t of ['Periódica', 'Pospuesta', 'Pausada']) {
			await abrir(page, t);
			for (const p of ['Tarea', 'Cuándo', 'Acciones']) {
				await pestana(page, p).click();
				await sinDesborde(page);
				const g = await caja(guardar(page));
				expect(g.x).toBeGreaterThanOrEqual(0);
				expect(g.x + g.width).toBeLessThanOrEqual(ancho);
				await visibleSinTapar(page, guardar(page));
			}
			await cerrar(page);
		}
	}
});

test('Flujo 4: nada se pierde', async ({ page }) => {
	await sesionConReloj(page, HORA);
	await nuevaTarea(page);

	// 1
	await titulo(page).fill('Barrer');
	await page.getByLabel('Nota').fill('Con cuidado');
	await campoEtiquetas(page).fill('cas');
	await pestana(page, 'Cuándo').click();
	await page.getByRole('radio', { name: 'Días de la semana' }).check();
	await fijarDias(page, ['lunes', 'jueves']);
	await soloEnUnHorario(page).check();
	await campoDesde(page).fill('08:00');
	await campoHasta(page).fill('10:00');

	// 2
	await pestana(page, 'Tarea').click();
	await expect(titulo(page)).toHaveValue('Barrer');
	await expect(page.getByLabel('Nota')).toHaveValue('Con cuidado');
	await expect(campoEtiquetas(page)).toHaveValue('cas');
	await pestana(page, 'Cuándo').click();
	const semana = page.getByRole('group', { name: 'Días de la semana' });
	await expect(semana.getByRole('button', { name: 'lunes', exact: true })).toHaveAttribute('aria-pressed', 'true');
	await expect(semana.getByRole('button', { name: 'jueves', exact: true })).toHaveAttribute('aria-pressed', 'true');
	await expect(campoDesde(page)).toHaveValue('08:00');

	// 3
	await page.setViewportSize({ width: 1024, height: 768 });
	await expect(page.getByRole('tablist')).toHaveCount(0);
	await expect(titulo(page)).toHaveValue('Barrer');
	await expect(page.getByLabel('Nota')).toHaveValue('Con cuidado');
	await expect(campoEtiquetas(page)).toHaveValue('cas');
	await expect(campoDesde(page)).toBeVisible();
	await page.setViewportSize({ width: 360, height: 640 });
	await expect(page.getByRole('tablist')).toBeVisible();
	await pestana(page, 'Tarea').click();
	await expect(campoEtiquetas(page)).toHaveValue('cas');
	await expect(titulo(page)).toHaveValue('Barrer');
	await pestana(page, 'Cuándo').click();

	// 4
	await guardar(page).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(fila(page, 'Barrer')).toBeVisible();
	await abrir(page, 'Barrer');
	await expect(page.getByLabel('Nota')).toHaveValue('Con cuidado');
	await expect(page.getByRole('list', { name: 'Etiquetas de la tarea' }).getByRole('listitem')).toHaveCount(0);
	await pestana(page, 'Cuándo').click();
	await expect(page.getByRole('radio', { name: 'Días de la semana' })).toBeChecked();
	await expect(campoDesde(page)).toHaveValue('08:00');
	await expect(campoHasta(page)).toHaveValue('10:00');

	// 5
	await pestana(page, 'Tarea').click();
	await titulo(page).fill('Barrer más');
	await descartar(page);
	await expect(fila(page, 'Barrer')).toBeVisible();
	await expect(page.getByText('Barrer más')).toHaveCount(0);
	await abrir(page, 'Barrer');
	await pestana(page, 'Tarea').click();
	await titulo(page).fill('Barrer más');
	await pestana(page, 'Acciones').click();
	await page.getByRole('button', { name: 'Pausar', exact: true }).click();
	await page.getByRole('alertdialog', { name: 'Tenés cambios sin guardar' }).getByRole('button', { name: 'Descartar y pausar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await page.getByRole('checkbox', { name: 'Pausadas' }).check();
	await expect(page.getByText('Barrer más')).toHaveCount(0);
	await expect(fila(page, 'Barrer')).toBeVisible();
});

test('Flujo 5: errores', async ({ page }) => {
	await sesionConReloj(page, HORA);
	await nuevaTarea(page);

	// 1
	await pestana(page, 'Cuándo').click();
	await page.getByRole('radio', { name: 'Intervalo' }).check();
	await soloEnUnHorario(page).check();
	await campoDesde(page).fill('10:00');
	await campoHasta(page).fill('09:00');
	await guardar(page).click();
	await expect(page.getByRole('dialog')).toHaveCount(1);
	await expect(pestana(page, 'Tarea')).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByText('Escribí un título.')).toBeVisible();
	await expect.poll(async () => {
		const c = await caja(titulo(page));
		const cc = await caja(contenido(page));
		return c.y >= cc.y && c.y + c.height <= cc.y + cc.height;
	}).toBe(true);
	await expect(marca(page, 'Tarea')).toBeVisible();
	await expect(marca(page, 'Cuándo')).toBeVisible();
	await expect(pestana(page, 'Tarea').locator('svg')).toHaveCount(1);

	// 2
	await titulo(page).fill('Regar');
	await expect(marca(page, 'Tarea')).toHaveCount(0);
	await expect(marca(page, 'Cuándo')).toBeVisible();

	// 3
	await campoEtiquetas(page).fill('x'.repeat(31));
	await campoEtiquetas(page).press('Enter');
	await expect(marca(page, 'Tarea')).toBeVisible();
	await expect(page.getByRole('alert').or(page.locator('.error')).first()).toBeVisible();
	await campoEtiquetas(page).fill('x'.repeat(30));
	await expect(marca(page, 'Tarea')).toHaveCount(0);
	await campoEtiquetas(page).fill('');

	// 4
	await guardar(page).click();
	await expect(pestana(page, 'Cuándo')).toHaveAttribute('aria-selected', 'true');
	await expect(page.locator('#error-cada')).toBeVisible();
	const cada = await caja(page.getByRole('spinbutton', { name: 'Cada' }));
	const cc = await caja(contenido(page));
	expect(cada.y).toBeGreaterThanOrEqual(cc.y);
	expect(cada.y + cada.height).toBeLessThanOrEqual(cc.y + cc.height);
	await page.getByRole('spinbutton', { name: 'Cada' }).fill('2');
	await page.getByLabel('Unidad').selectOption({ label: 'días' });
	await expect(marca(page, 'Cuándo')).toBeVisible();
	await campoHasta(page).fill('11:00');
	await expect(marca(page, 'Cuándo')).toHaveCount(0);
	await guardar(page).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(fila(page, 'Regar')).toBeVisible();

	// 5: ancho.
	await page.setViewportSize({ width: 1024, height: 768 });
	await nuevaTarea(page);
	await soloEnUnHorario(page).check();
	await campoDesde(page).fill('10:00');
	await campoHasta(page).fill('09:00');
	await guardar(page).click();
	await expect(page.getByRole('tablist')).toHaveCount(0);
	await expect(page.getByRole('img', { name: 'con errores' })).toHaveCount(0);
	await expect(page.getByRole('dialog')).toHaveCount(1);
	await expect(page.getByText('Escribí un título.')).toBeVisible();
	await expect.poll(async () => {
		const c = await caja(titulo(page));
		const cc = await caja(contenido(page));
		return c.y >= cc.y && c.y + c.height <= cc.y + cc.height;
	}).toBe(true);
	await descartar(page);

	// 6
	await nuevaTarea(page);
	await titulo(page).fill('Otra');
	await soloEnUnHorario(page).check();
	await campoDesde(page).fill('10:00');
	await campoHasta(page).fill('09:00');
	await guardar(page).click();
	await expect(page.locator('#error-horario')).toBeVisible();
	await expect.poll(async () => {
		const c = await caja(campoHasta(page));
		const cc = await caja(contenido(page));
		return c.y >= cc.y && c.y + c.height <= cc.y + cc.height;
	}).toBe(true);
});

test('Flujo 6: teclado en pantalla', async ({ page }) => {
	await sesionConReloj(page, HORA);
	await nuevaTarea(page);

	// 1
	await expect(titulo(page)).not.toBeFocused();
	await expect(guardar(page)).toBeVisible();
	const antes = { h: await caja(encabezado(page)), t: await caja(page.getByRole('tablist')) };
	await abrirTeclado(page, titulo(page));
	await titulo(page).fill('Regar');
	await expect(guardar(page)).toBeHidden();
	expect(await caja(encabezado(page))).toEqual(antes.h);
	expect(await caja(page.getByRole('tablist'))).toEqual(antes.t);

	// 2
	// Tocar la pestaña quita el foco del campo (y con él el teclado); se toca un campo de Cuándo con el viewport achicado.
	await pestana(page, 'Cuándo').click();
	await page.getByRole('radio', { name: 'Intervalo' }).check();
	await page.getByRole('spinbutton', { name: 'Cada' }).click();
	await expect(guardar(page)).toBeHidden();
	await cerrarTeclado(page);
	await expect(page.getByRole('spinbutton', { name: 'Cada' })).toBeFocused();
	await expect(guardar(page)).toBeVisible();

	// 3: selector de hora, sin teclado.
	await soloEnUnHorario(page).check();
	await campoDesde(page).click();
	await expect(guardar(page)).toBeVisible();

	// 4: compu.
	await page.setViewportSize({ width: 1024, height: 768 });
	await titulo(page).click();
	await expect(titulo(page)).toBeFocused();
	await expect(guardar(page)).toBeVisible();
	await page.setViewportSize({ width: 360, height: 640 });
	await descartar(page);

	// 5: Enter guarda con la barra oculta.
	await nuevaTarea(page);
	await pestana(page, 'Cuándo').click();
	await page.getByRole('radio', { name: 'Intervalo' }).check();
	await page.getByRole('spinbutton', { name: 'Cada' }).fill('2');
	await pestana(page, 'Tarea').click();
	await abrirTeclado(page, titulo(page));
	await expect(guardar(page)).toBeHidden();
	await titulo(page).press('Enter');
	await expect(page.getByText('Escribí un título.')).toBeVisible();
	await expect(pestana(page, 'Tarea')).toHaveAttribute('aria-selected', 'true');
	await expect(marca(page, 'Tarea')).toBeVisible();
	await expect(guardar(page)).toBeHidden();
	await titulo(page).fill('Regar');
	await expect(guardar(page)).toBeHidden();
	await titulo(page).press('Enter');
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await cerrarTeclado(page);
	await expect(fila(page, 'Regar')).toBeVisible();

	// 6
	await nuevaTarea(page);
	await titulo(page).fill('Otra');
	await page.getByLabel('Nota').click();
	await page.getByLabel('Nota').fill('uno');
	await page.getByLabel('Nota').press('Enter');
	await page.getByLabel('Nota').pressSequentially('dos');
	await expect(page.getByRole('dialog')).toHaveCount(1);
	await expect(page.getByLabel('Nota')).toHaveValue('uno\ndos');
	await campoEtiquetas(page).fill('cas');
	await campoEtiquetas(page).press('Enter');
	await expect(page.getByRole('dialog')).toHaveCount(1);
	await expect(page.getByRole('list', { name: 'Etiquetas de la tarea' }).getByRole('listitem')).toHaveCount(1);
});

test('Flujo 7: iconos y nombres accesibles', async ({ page }) => {
	await sesionConReloj(page, HORA);
	await crearRegar(page);

	for (const ancho of [360, 1024]) {
		await page.setViewportSize({ width: ancho, height: ancho === 360 ? 640 : 768 });
		const celular = ancho === 360;
		await nuevaTarea(page);
		const emojiBoton = page.getByRole('button', { name: 'Elegir emoji' });
		await expect(emojiBoton).toHaveText('');
		await expect(emojiBoton.locator('svg')).toHaveCount(1);
		const cerrarB = page.getByRole('button', { name: 'Cerrar' });
		await expect(cerrarB).toHaveText('');
		await expect(cerrarB.locator('svg')).toHaveCount(1);
		await expect(guardar(page).locator('svg')).toHaveCount(0);
		if (celular) {
			await expect(pestana(page, 'Tarea').locator('svg')).toHaveCount(1);
			await expect(pestana(page, 'Cuándo').locator('svg')).toHaveCount(1);
		} else {
			await expect(page.getByRole('heading', { name: 'Tarea', level: 3 })).toBeVisible();
			await expect(page.getByRole('heading', { name: 'Cuándo', level: 3 })).toBeVisible();
			await expect(page.getByRole('heading', { level: 3 }).locator('svg')).toHaveCount(0);
		}
		await cerrar(page);

		await abrir(page, 'Regar');
		if (celular) {
			await expect(pestana(page, 'Acciones').locator('svg')).toHaveCount(1);
			await pestana(page, 'Acciones').click();
		}
		for (const a of ['1 hora', '3 horas', 'Hasta mañana', 'Pausar', 'Borrar tarea']) {
			const b = page.getByRole('button', { name: a, exact: true });
			await expect(b.locator('svg')).toHaveCount(1);
			await expect(b).toHaveText(a);
		}
		if (celular) await pestana(page, 'Cuándo').click();
		await soloEnUnHorario(page).check();
		await expect(agregarHorario(page).locator('svg')).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Quitar', exact: true }).locator('svg')).toHaveCount(0);
		if (celular) await pestana(page, 'Tarea').click();
		await expect(page.getByRole('button', { name: 'Quitar emoji' })).toHaveCount(0);
		await elegirEmoji(page, '🌱');
		await expect(page.getByRole('button', { name: /Cambiar emoji/ })).toHaveText('🌱');
		const quitar = page.getByRole('button', { name: 'Quitar emoji' });
		await expect(quitar).toBeVisible();
		await expect(quitar.locator('svg')).toHaveCount(0);
		await descartar(page);
	}
});

test('Flujo 8: dos dispositivos con el panel abierto', async ({ browser }) => {
	const { a, b, cerrar: cerrarDos } = await dosDispositivos(browser, HORA);
	await a.setViewportSize({ width: 360, height: 640 });
	await crearRegar(a);
	await llegaAlServidor(a);
	await expect(fila(b, 'Regar')).toBeVisible();

	// 1
	await abrir(a, 'Regar');
	await pestana(a, 'Acciones').click();
	await expect(a.getByRole('button', { name: '1 hora', exact: true })).toBeVisible();
	await expect(a.getByRole('button', { name: 'Pausar', exact: true })).toBeVisible();

	// 2
	await abrir(b, 'Regar');
	await pestana(b, 'Acciones').click();
	await b.getByRole('button', { name: 'Pausar', exact: true }).click();
	await expect(b.getByRole('dialog')).toHaveCount(0);
	await expect(a.getByRole('button', { name: 'Reanudar' })).toBeVisible();
	await expect(a.getByRole('button', { name: '1 hora', exact: true })).toHaveCount(0);
	await expect(pestana(a, 'Acciones')).toHaveAttribute('aria-selected', 'true');
	await pestana(a, 'Tarea').click();
	await expect(a.getByText('Pausada', { exact: true })).toBeVisible();
	await pestana(a, 'Acciones').click();

	// 3
	await b.getByRole('checkbox', { name: 'Pausadas' }).check();
	await abrir(b, 'Regar');
	await pestana(b, 'Acciones').click();
	await b.getByRole('button', { name: 'Reanudar' }).click();
	await expect(b.getByRole('dialog')).toHaveCount(0);
	await abrir(b, 'Regar');
	await pestana(b, 'Acciones').click();
	await b.getByRole('button', { name: '3 horas', exact: true }).click();
	await expect(b.getByRole('dialog')).toHaveCount(0);
	await expect(a.getByRole('button', { name: 'Quitar posponer' })).toBeVisible();
	await expect(a.getByRole('button', { name: 'Pausar', exact: true })).toBeVisible();
	await pestana(a, 'Tarea').click();
	await expect(a.getByText('Pospuesta hasta 13:00')).toBeVisible();
	await cerrarDos();
});

test('Flujo 9: sobre el panel', async ({ page, context }) => {
	await sesionConReloj(page, HORA);
	await crearRegar(page);
	await abrir(page, 'Regar');

	// 1
	await pestana(page, 'Cuándo').click();
	await pestana(page, 'Tarea').click();
	await page.getByRole('button', { name: 'Elegir emoji' }).click();
	await expect(selectorEmoji(page)).toBeVisible();
	await expect(selectorEmoji(page).locator('input.search')).toBeVisible();
	await expect(selectorEmoji(page).locator('.tabpanel button.emoji').first()).toBeVisible();
	await selectorEmoji(page).locator('input.search').fill('planta');
	await selectorEmoji(page).locator('.tabpanel button.emoji').filter({ hasText: /^🌱$/ }).click();
	await expect(selectorEmoji(page)).toHaveCount(0);
	await expect(pestana(page, 'Tarea')).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByRole('button', { name: /Cambiar emoji/ })).toHaveText('🌱');

	// 2
	await pestana(page, 'Acciones').click();
	await page.getByRole('button', { name: 'Borrar tarea' }).click();
	const alerta = page.getByRole('alertdialog');
	await expect(alerta).toBeVisible();
	await alerta.getByRole('button', { name: 'Cancelar' }).click();
	await expect(alerta).toHaveCount(0);
	await expect(pestana(page, 'Acciones')).toHaveAttribute('aria-selected', 'true');
	await descartar(page);
	await expect(fila(page, 'Regar')).toBeVisible();

	// 3
	await abrir(page, 'Regar');
	await context.setOffline(true);
	const franja = page.getByText('Sin conexión', { exact: true });
	await expect(franja).toBeVisible();
	const fb = await caja(franja);
	const eb = await caja(encabezado(page));
	expect(fb.y + fb.height).toBeLessThanOrEqual(eb.y + 1);
	await visibleSinTapar(page, page.getByRole('button', { name: 'Cerrar' }));
	await visibleSinTapar(page, page.getByRole('tablist'));
	await visibleSinTapar(page, guardar(page));
	await context.setOffline(false);
	await expect(franja).toHaveCount(0);
	await cerrar(page);
});

test('Flujo 9 (aviso): el aviso de deshacer sobre la barra de Guardar y sobre el teclado', async ({ browser }) => {
	const { a, cerrar: cerrarDos } = await dosDispositivos(browser, HORA);
	await a.setViewportSize({ width: 360, height: 640 });
	await crearRegar(a);
	await crear(a, { titulo: 'Otra', tipo: 'No se repite' });
	const aviso = (p: Page) => p.getByRole('status').filter({ hasText: 'Completaste' });
	// El aviso se muestra en el dispositivo que completa: A completa Otra y abre Regar con el aviso a la vista.
	await completar(a, 'Otra');
	await expect(aviso(a)).toBeVisible();
	await abrir(a, 'Regar');
	await expect(aviso(a)).toBeVisible();
	const av = await caja(aviso(a));
	const g = await caja(guardar(a));
	expect(av.y + av.height).toBeLessThanOrEqual(g.y + 1);
	await visibleSinTapar(a, a.getByRole('tablist'));
	await visibleSinTapar(a, a.getByRole('button', { name: 'Cerrar' }));
	await visibleSinTapar(a, guardar(a));
	// Con el teclado abierto: sin barra, el aviso sobre el teclado.
	await abrirTeclado(a, titulo(a));
	await expect(guardar(a)).toBeHidden();
	await expect(aviso(a)).toBeVisible();
	const av2 = await caja(aviso(a));
	expect(av2.y + av2.height).toBeLessThanOrEqual(300 + 1);
	// 5: a los 5 segundos desaparece.
	await expect(aviso(a)).toHaveCount(0, { timeout: 15_000 });
	await cerrarDos();
});

test('Flujo 10: el corte de 40rem y las pantallas anchas', async ({ page }) => {
	await sesionConReloj(page, HORA);
	await crearRegar(page);

	// 1
	await page.setViewportSize({ width: 640, height: 700 });
	await abrir(page, 'Regar');
	await expect(page.getByRole('tablist')).toBeVisible();
	expect(await caja(panel(page))).toMatchObject({ x: 0, y: 0, width: 640, height: 700 });
	await cerrar(page);

	// 2
	await page.setViewportSize({ width: 641, height: 700 });
	await abrir(page, 'Regar');
	await expect(page.getByRole('tablist')).toHaveCount(0);
	const hoja = await caja(panel(page).locator('form'));
	expect(hoja.height).toBeLessThanOrEqual(700);
	expect(hoja.width).toBeLessThanOrEqual(640);
	await cerrar(page);

	// 3
	await page.setViewportSize({ width: 1024, height: 768 });
	await abrir(page, 'Regar');
	await expect(page.getByRole('tablist')).toHaveCount(0);
	await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Tarea', 'Cuándo', 'Acciones']);
	const ys = [];
	for (const n of ['Tarea', 'Cuándo', 'Acciones']) ys.push((await caja(page.getByRole('heading', { name: n, level: 3 }))).y);
	expect(ys[0]).toBeLessThan(ys[1]);
	expect(ys[1]).toBeLessThan(ys[2]);
	await expect(titulo(page)).toBeVisible();
	await expect(page.getByRole('radio', { name: 'Intervalo' })).toBeChecked();
	const borrar = page.getByRole('button', { name: 'Borrar tarea' });
	await borrar.scrollIntoViewIfNeeded();
	expect((await caja(borrar)).y).toBeLessThan((await caja(guardar(page))).y);
	const antes = { h: await caja(encabezado(page)), g: await caja(guardar(page)) };
	await contenido(page).hover();
	await page.mouse.wheel(0, 3000);
	expect(await caja(encabezado(page))).toEqual(antes.h);
	expect(await caja(guardar(page))).toEqual(antes.g);
	await visibleSinTapar(page, page.getByRole('button', { name: 'Cerrar' }));
	await cerrar(page);

	// 4
	await nuevaTarea(page);
	await expect(page.getByRole('heading', { name: 'Acciones', level: 3 })).toHaveCount(0);
	await cerrar(page);
	await abrir(page, 'Regar');
	await expect(page.getByRole('heading', { name: 'Acciones', level: 3 })).toBeVisible();

	// 5
	await guardar(page).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(fila(page, 'Regar')).toBeVisible();
});
