import { expect, test, type Locator, type Page } from '@playwright/test';
import {
	abrir,
	adelantar,
	asentar,
	cerrar,
	completar,
	conReloj,
	crearYVer,
	detener,
	encenderCompletadas,
	esperarEstado,
	fila,
	limpiarEmuladores,
	listaEs,
	sesionConReloj
} from './apoyo';

test.beforeEach(async () => {
	await limpiarEmuladores();
});

const aviso = (page: Page) => page.getByRole('status').filter({ hasText: 'Completaste' });
const mostrarPausadas = (page: Page) => page.getByRole('checkbox', { name: 'Pausadas' });
const boton = (page: Page, nombre: string) => page.getByRole('button', { name: nombre, exact: true });
const textoDe = (page: Page, titulo: string) => fila(page, titulo).getByText(/^(Tocaba|Vuelve) /);

/** Sesión con el reloj corriendo 10 minutos antes de `hora` (las tareas se crean así) y Mostrar completadas si se pide. */
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

/** Con el reloj detenido, lo deja exactamente en `hora` (sin disparar temporizadores) antes de una acción que se fecha. */
const fijar = (page: Page, hora: string) => page.clock.setSystemTime(new Date(hora));

/** La fila de `titulo` dice exactamente `texto` (una sola vez). */
async function dice(page: Page, titulo: string, texto: string) {
	await expect(textoDe(page, titulo)).toHaveCount(1);
	await expect(textoDe(page, titulo)).toHaveText(texto);
}

/** La fila no contiene texto de fecha ni de distancia. */
async function sinTexto(page: Page, titulo: string) {
	const f = fila(page, titulo);
	await expect(f).toBeVisible();
	await expect(f.getByText(/Tocaba|Vuelve/)).toHaveCount(0);
	await expect(f.getByText(/\b(hace|en) \d+/)).toHaveCount(0);
}

const sinAtrasada = (page: Page) => expect(page.getByText('Atrasada')).toHaveCount(0);

const estilo = (l: Locator) =>
	l.evaluate((e) => {
		const s = getComputedStyle(e);
		return { color: s.color, tamano: s.fontSize, peso: Number(s.fontWeight), linea: s.textDecorationLine, fondo: s.backgroundColor };
	});

/** El texto de atraso comparte color y tamaño con `referencia`, no es rojizo, ni negrita, ni subrayado. */
async function estiloDeAtraso(texto: Locator, referencia: Locator) {
	const a = await estilo(texto);
	const r = await estilo(referencia);
	expect(a.color).toBe(r.color);
	expect(a.tamano).toBe(r.tamano);
	const [rojo, verde, azul] = a.color.match(/\d+/g)!.map(Number);
	expect(rojo > verde && rojo > azul).toBe(false);
	expect(a.peso).toBeLessThan(600);
	expect(a.linea).not.toContain('underline');
}

async function pausar(page: Page, titulo: string) {
	await abrir(page, titulo);
	await boton(page, 'Pausar').click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
}

async function posponer(page: Page, titulo: string, opcion: '3 horas' | 'Hasta mañana') {
	await abrir(page, titulo);
	await boton(page, opcion).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
}

test('Flujo 1: atraso con fecha y distancia, sin color de alarma', async ({ page }) => {
	await sesion(page, '2026-11-13T10:00:00');
	await crearYVer(page, { titulo: 'Pagar la luz', tipo: 'No se repite', fecha: '2026-11-10', esfuerzo: 'Rápida (≤ 5 min)' });
	await crearYVer(page, { titulo: 'Pagar agua', tipo: 'No se repite', fecha: '2026-11-12' });
	await crearYVer(page, { titulo: 'Cambiar foco', tipo: 'No se repite' });
	await crearYVer(page, { titulo: 'Barrer', tipo: 'Días de la semana', dias: ['viernes'] });
	await detener(page, '2026-11-13T10:00:00');

	// 2
	await conReloj(page, async () => {
		await listaEs(page, ['Pagar la luz', 'Pagar agua', 'Barrer', 'Cambiar foco']);
		await esperarEstado(page, 'Pagar la luz', 'atrasada', undefined, false);
		await esperarEstado(page, 'Pagar agua', 'atrasada', undefined, false);
		await esperarEstado(page, 'Barrer', 'pendiente');
		await esperarEstado(page, 'Cambiar foco', 'pendiente');
		await dice(page, 'Pagar la luz', 'Tocaba el martes 10 · hace 3 días');
		await dice(page, 'Pagar agua', 'Tocaba ayer');
		await sinAtrasada(page);
		await sinTexto(page, 'Cambiar foco');
		await sinTexto(page, 'Barrer');
	});

	// 3
	await estiloDeAtraso(textoDe(page, 'Pagar la luz'), fila(page, 'Pagar la luz').getByText('Rápida', { exact: true }));
	expect((await estilo(fila(page, 'Pagar la luz'))).fondo).toBe((await estilo(fila(page, 'Cambiar foco'))).fondo);

	// 4
	await conReloj(page, () => crearYVer(page, { titulo: 'Lavar', tipo: 'No se repite', fecha: '2026-11-13', horario: { desde: '08:00', hasta: '11:00' } }));
	await ir(page, '2026-11-13T10:59:00');
	await esperarEstado(page, 'Lavar', 'pendiente');
	await sinTexto(page, 'Lavar');
	await ir(page, '2026-11-13T11:00:00');
	await esperarEstado(page, 'Lavar', 'atrasada', undefined, false, false);
	await dice(page, 'Lavar', 'Tocaba hoy');
	await estiloDeAtraso(textoDe(page, 'Lavar'), fila(page, 'Lavar').getByText(/\d\d:\d\d–\d\d:\d\d/));

	// 5
	await fijar(page, '2026-11-13T10:59:50');
	await conReloj(page, () => crearYVer(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '1', unidad: 'horas' }));
	await fijar(page, '2026-11-13T11:00:00');
	await page.clock.runFor(1000);
	await completar(page, 'Regar');
	await conReloj(page, () => expect(aviso(page)).toHaveText(/^Completaste «Regar»\s*Vuelve hoy 12:00 · en 1 hora\s*Deshacer$/));
	await ir(page, '2026-11-13T13:00:00');
	await esperarEstado(page, 'Regar', 'atrasada', undefined, false);
	await dice(page, 'Regar', 'Tocaba hoy 12:00 · hace 1 hora');
	await ir(page, '2026-11-13T14:30:00');
	await dice(page, 'Regar', 'Tocaba hoy 12:00 · hace 2 horas');

	// 6
	await ir(page, '2026-11-14T00:00:00');
	await esperarEstado(page, 'Barrer', 'atrasada', undefined, false);
	await dice(page, 'Barrer', 'Tocaba ayer');
	await dice(page, 'Regar', 'Tocaba ayer 12:00 · hace 12 horas');

	// 7
	await ir(page, '2026-11-15T10:00:00');
	await dice(page, 'Barrer', 'Tocaba el viernes 13 · hace 2 días');
	await dice(page, 'Pagar la luz', 'Tocaba el martes 10 · hace 5 días');
	await sinAtrasada(page);
});

test('Flujo 2: «Vuelve …» en las filas en espera', async ({ page }) => {
	await sesion(page, '2026-11-13T10:00:00', true);
	await crearYVer(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '8', unidad: 'horas' });
	await crearYVer(page, { titulo: 'Sacar la basura', tipo: 'Días de la semana', dias: ['jueves'] });
	await crearYVer(page, { titulo: 'Barrer', tipo: 'Días de la semana', dias: ['sábado'] });
	await crearYVer(page, { titulo: 'Dormir', tipo: 'Intervalo', cada: '6', unidad: 'días' });
	await crearYVer(page, { titulo: 'Llamar', tipo: 'No se repite', horario: { desde: '08:00', hasta: '09:00' } });
	await crearYVer(page, { titulo: 'Cambiar foco', tipo: 'No se repite' });
	await crearYVer(page, { titulo: 'Pagar la luz', tipo: 'No se repite', fecha: '2026-11-10' });
	await detener(page, '2026-11-13T10:00:00');

	// 1 y 3: completar con el reloj exacto
	await completar(page, 'Regar');
	await completar(page, 'Dormir');
	await conReloj(page, async () => {
		await esperarEstado(page, 'Regar', 'en espera', 0);
		await dice(page, 'Regar', 'Vuelve hoy 18:00 · en 8 horas');
		await esperarEstado(page, 'Dormir', 'en espera', undefined, true);
		await dice(page, 'Dormir', 'Vuelve el jueves 19 10:00 · en 6 días');

		// 2
		await esperarEstado(page, 'Sacar la basura', 'en espera', undefined, false);
		await dice(page, 'Sacar la basura', 'Vuelve el jueves 19 · en 6 días');
		await esperarEstado(page, 'Barrer', 'en espera', undefined, false);
		await dice(page, 'Barrer', 'Vuelve mañana');

		// 4
		await esperarEstado(page, 'Llamar', 'en espera', undefined, false, false);
		await dice(page, 'Llamar', 'Vuelve mañana 08:00 · en 22 horas');
	});

	// 5
	await posponer(page, 'Cambiar foco', '3 horas');
	await conReloj(page, async () => {
		await esperarEstado(page, 'Cambiar foco', 'en espera', 0, false);
		await dice(page, 'Cambiar foco', 'Vuelve hoy 13:00 · en 3 horas');
		await expect(fila(page, 'Cambiar foco').getByText(/Pospuesta/)).toHaveCount(0);
		await abrir(page, 'Cambiar foco');
		await expect(page.getByRole('dialog').getByText('Pospuesta hasta 13:00', { exact: true })).toBeVisible();
		await cerrar(page);
	});

	// 6
	await posponer(page, 'Pagar la luz', 'Hasta mañana');
	await conReloj(page, async () => {
		await esperarEstado(page, 'Pagar la luz', 'en espera', undefined, false);
		await dice(page, 'Pagar la luz', 'Vuelve mañana 07:00 · en 21 horas');
		await expect(fila(page, 'Pagar la luz').getByText(/Tocaba/)).toHaveCount(0);

		// 7
		await sinAtrasada(page);
		for (const t of ['Regar', 'Sacar la basura', 'Barrer', 'Dormir', 'Llamar', 'Cambiar foco', 'Pagar la luz'])
			await expect(fila(page, t).getByRole('progressbar')).toHaveCount(1);
	});
});

test('Flujo 3: filas sin texto de fecha', async ({ page }) => {
	await sesion(page, '2026-11-13T10:00:00');
	await crearYVer(page, { titulo: 'Barrer', tipo: 'No se repite' });
	await crearYVer(page, { titulo: 'Pagar', tipo: 'No se repite', fecha: '2026-11-13' });
	await crearYVer(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await detener(page, '2026-11-13T10:00:00');

	// 1
	await conReloj(page, async () => {
		for (const t of ['Barrer', 'Pagar', 'Regar']) {
			await esperarEstado(page, t, 'pendiente');
			await sinTexto(page, t);
		}
	});

	// 2
	await ir(page, '2026-12-13T10:00:00');
	await esperarEstado(page, 'Barrer', 'pendiente');
	await esperarEstado(page, 'Regar', 'pendiente');
	await sinTexto(page, 'Barrer');
	await sinTexto(page, 'Regar');
	await esperarEstado(page, 'Pagar', 'atrasada', undefined, false);
	await dice(page, 'Pagar', 'Tocaba el viernes 13 de noviembre · hace 30 días');

	// 3
	await conReloj(page, async () => {
		await encenderCompletadas(page);
		await completar(page, 'Barrer');
		await esperarEstado(page, 'Barrer', 'pendiente', undefined, true);
		await sinTexto(page, 'Barrer');
	});

	// 4
	await conReloj(page, async () => {
		await pausar(page, 'Regar');
		await mostrarPausadas(page).click();
		await expect(mostrarPausadas(page)).toBeChecked();
		const f = fila(page, 'Regar');
		await expect(f.getByText('Pausada')).toHaveCount(1);
		await expect(f.getByText(/Tocaba|Vuelve/)).toHaveCount(0);
		await dice(page, 'Pagar', 'Tocaba el viernes 13 de noviembre · hace 30 días');
	});

	// 5
	await mostrarPausadas(page).click();
	await expect(mostrarPausadas(page)).not.toBeChecked();
	await expect(fila(page, 'Regar')).toHaveCount(0);
	await dice(page, 'Pagar', 'Tocaba el viernes 13 de noviembre · hace 30 días');
});

test('Flujo 4: se actualiza solo y no cambia el orden', async ({ page }) => {
	await sesion(page, '2026-11-12T20:00:00', true);
	await crearYVer(page, { titulo: 'Pagar', tipo: 'No se repite', fecha: '2026-11-10' });
	await crearYVer(page, { titulo: 'Barrer', tipo: 'Días de la semana', dias: ['sábado'] });
	await crearYVer(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '1', unidad: 'horas' });
	await detener(page, '2026-11-12T20:00:00');
	await completar(page, 'Regar');
	await conReloj(page, () => esperarEstado(page, 'Regar', 'en espera', 0));

	// 2
	await ir(page, '2026-11-12T20:30:00');
	await dice(page, 'Regar', 'Vuelve hoy 21:00 · en 30 minutos');
	await ir(page, '2026-11-12T20:31:00');
	await dice(page, 'Regar', 'Vuelve hoy 21:00 · en 29 minutos');
	await listaEs(page, ['Pagar', 'Barrer', 'Regar']);

	// 3
	await ir(page, '2026-11-12T21:00:00');
	await esperarEstado(page, 'Regar', 'pendiente');
	await sinTexto(page, 'Regar');

	// 4
	await ir(page, '2026-11-12T22:00:00');
	await esperarEstado(page, 'Regar', 'atrasada', undefined, false);
	await dice(page, 'Regar', 'Tocaba hoy 21:00 · hace 1 hora');
	await listaEs(page, ['Pagar', 'Regar', 'Barrer']);
	await ir(page, '2026-11-12T23:59:00');
	await dice(page, 'Regar', 'Tocaba hoy 21:00 · hace 2 horas');
	await ir(page, '2026-11-13T00:00:00');
	await dice(page, 'Regar', 'Tocaba ayer 21:00 · hace 3 horas');
	await listaEs(page, ['Pagar', 'Regar', 'Barrer']);

	// 5
	await ir(page, '2026-11-14T00:00:00');
	await dice(page, 'Regar', 'Tocaba el jueves 12 21:00 · hace 2 días');
	await esperarEstado(page, 'Barrer', 'pendiente');
	await sinTexto(page, 'Barrer');

	// 6
	await listaEs(page, ['Pagar', 'Regar', 'Barrer']);
	await page.reload();
	await conReloj(page, async () => {
		await expect(page.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
		await listaEs(page, ['Pagar', 'Regar', 'Barrer']);
		await dice(page, 'Regar', 'Tocaba el jueves 12 21:00 · hace 2 días');
		await sinTexto(page, 'Barrer');
	});
});

test('Flujo 5: el cierre al completar', async ({ page }) => {
	await sesion(page, '2026-11-02T10:00:00', true);
	await crearYVer(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '8', unidad: 'horas' });
	await crearYVer(page, { titulo: 'Sacar la basura', tipo: 'Días de la semana', dias: ['jueves'] });
	await crearYVer(page, { titulo: 'Barrer', tipo: 'Días de la semana', dias: ['sábado'] });
	await crearYVer(page, { titulo: 'Pagar la luz', tipo: 'No se repite' });
	await crearYVer(page, { titulo: 'Comprar pan', tipo: 'No se repite', fecha: '2026-11-05' });
	await detener(page, '2026-11-02T10:00:00');

	// 2
	await ir(page, '2026-11-13T10:00:00');
	await fijar(page, '2026-11-13T10:00:00');
	await completar(page, 'Regar');
	await conReloj(page, async () => {
		await expect(aviso(page)).toHaveCount(1);
		await expect(aviso(page)).toHaveText(/^Completaste «Regar»\s*Vuelve hoy 18:00 · en 8 horas\s*Deshacer$/);
		await expect(aviso(page).getByRole('button', { name: 'Deshacer' })).toBeVisible();
	});
	await page.clock.runFor(5000);
	await expect(aviso(page)).toHaveCount(0);
	await dice(page, 'Regar', 'Vuelve hoy 18:00 · en 8 horas');

	// 3
	await completar(page, 'Sacar la basura');
	await conReloj(page, async () => {
		await expect(aviso(page)).toHaveCount(1);
		await expect(aviso(page)).toHaveText(/^Completaste «Sacar la basura»\s*Vuelve el jueves 19 · en 6 días\s*Deshacer$/);
	});
	await completar(page, 'Barrer');
	await conReloj(page, async () => {
		await expect(aviso(page)).toHaveCount(1);
		await expect(aviso(page)).toHaveText(/^Completaste «Barrer»\s*Vuelve mañana\s*Deshacer$/);
	});

	// 4
	await completar(page, 'Pagar la luz');
	await conReloj(page, async () => {
		await expect(aviso(page)).toHaveCount(1);
		await expect(aviso(page)).toHaveText(/^Completaste «Pagar la luz»\s*Deshacer$/);
	});
	await completar(page, 'Comprar pan');
	await conReloj(page, async () => {
		await expect(aviso(page)).toHaveCount(1);
		await expect(aviso(page)).toHaveText(/^Completaste «Comprar pan»\s*Deshacer$/);
	});

	// 5
	await ir(page, '2026-11-13T18:00:00');
	await conReloj(page, () => esperarEstado(page, 'Regar', 'pendiente'));
	await completar(page, 'Regar');
	await conReloj(page, async () => {
		await expect(aviso(page)).toHaveCount(1);
		await expect(aviso(page)).toHaveText(/^Completaste «Regar»\s*Vuelve mañana 02:00 · en 8 horas\s*Deshacer$/);
	});
	await aviso(page).getByRole('button', { name: 'Deshacer' }).click();
	await expect(aviso(page)).toHaveCount(0);
	await asentar(page);
	await conReloj(page, async () => {
		await esperarEstado(page, 'Regar', 'pendiente');
		await sinTexto(page, 'Regar');
	});
});
