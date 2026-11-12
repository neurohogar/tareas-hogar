import { expect, test, type Browser, type Page } from '@playwright/test';
import {
	abrir,
	adelantar,
	asentar,
	borrar,
	cerrar,
	completar,
	completarPanel,
	conReloj,
	crear,
	crearYVer,
	detener,
	dispositivo,
	dosDispositivos,
	editar,
	encenderCompletadas,
	esperarEstado,
	fila,
	irA,
	limpiarEmuladores,
	llegaAlServidor,
	sesionConReloj,
	type Grupos,
	verHistorial
} from './apoyo';

const HOY = '2026-07-15T08:00:00';

test.beforeEach(async () => {
	await limpiarEmuladores();
});

/** Sesión con reloj y Mostrar completadas encendido (las completadas se ven tachadas al final). */
async function sesion(page: Page, hora: string) {
	await sesionConReloj(page, hora);
	await encenderCompletadas(page);
}

/** Abre la sesión con el reloj corriendo 10 minutos antes de `hora` y lo detiene exactamente en `hora`. */
async function sesionDetenida(page: Page, hora: string) {
	await sesion(page, new Date(new Date(hora).getTime() - 600_000).toISOString());
	return hora;
}

/** Dos dispositivos con Mostrar completadas encendido en A y en B. */
async function dosConCompletadas(browser: Browser, hora: string) {
	const d = await dosDispositivos(browser, hora);
	await encenderCompletadas(d.a);
	await encenderCompletadas(d.b);
	return d;
}

/** Avanza el reloj simulado hasta `hora`, disparando los temporizadores intermedios (reloj detenido). */
async function a(page: Page, hora: string) {
	const falta = new Date(hora).getTime() - (await page.evaluate(() => Date.now()));
	if (falta <= 10_000) await page.clock.runFor(falta);
	else await adelantar(page, hora);
}

const aviso = (page: Page) => page.getByRole('status');

async function verAviso(page: Page, titulo: string) {
	await expect(aviso(page)).toHaveCount(1);
	await expect(aviso(page)).toContainText(`Completaste «${titulo}»`);
	await expect(aviso(page).getByRole('button', { name: 'Deshacer' })).toBeVisible();
}

const deshacer = (page: Page) => aviso(page).getByRole('button', { name: 'Deshacer' }).click();

/** La entrada con ese título y hora; con `encabezado`, solo la del grupo de ese día. */
const entrada = (page: Page, titulo: string, hora: string, encabezado?: string) =>
	(encabezado
		? page.locator(`xpath=//h2[normalize-space()="${encabezado}"]/following-sibling::ul[1]`).getByRole('listitem')
		: page.getByRole('listitem')
	).filter({ hasText: new RegExp(`^${titulo}\\s*${hora}`) });

async function borrarEntrada(page: Page, titulo: string, hora: string, encabezado: string) {
	await entrada(page, titulo, hora, encabezado).getByRole('button', { name: 'Borrar', exact: true }).click();
	const dialogo = page.getByRole('alertdialog');
	await expect(dialogo).toHaveText(new RegExp(`¿Borrar «${titulo}» de ${encabezado}, ${hora}\\?`));
	await dialogo.getByRole('button', { name: 'Borrar', exact: true }).click();
	await expect(dialogo).toHaveCount(0);
}

const orden = (page: Page, titulos: string[]) =>
	expect(page.getByRole('listitem')).toHaveText(titulos.map((t) => new RegExp(`^\\s*${t}\\s`)));

const enlaces = async (page: Page, actual: 'Pendientes' | 'Historial') => {
	await expect(page.getByRole('navigation')).toBeVisible();
	for (const n of ['Pendientes', 'Historial'] as const) {
		const l = page.getByRole('navigation').getByRole('link', { name: n });
		if (n === actual) await expect(l).toHaveAttribute('aria-current', 'page');
		else await expect(l).not.toHaveAttribute('aria-current', /.*/);
	}
};

test('Flujo 1: navegación e historial vacío', async ({ page }) => {
	await sesion(page, HOY);
	await enlaces(page, 'Pendientes');
	await page.getByRole('navigation').getByRole('link', { name: 'Historial' }).click();
	await expect(page).toHaveURL(/\/historial$/);
	await verHistorial(page, []);
	await enlaces(page, 'Historial');
	await page.reload();
	await verHistorial(page, []);
	await page.getByRole('navigation').getByRole('link', { name: 'Pendientes' }).click();
	await expect(page.getByRole('heading', { name: 'Pendientes', level: 1 })).toBeVisible();
	await expect(page.getByRole('listitem')).toHaveCount(0);
	await expect(page.getByRole('button', { name: '+' })).toBeVisible();
	await page.goto('/historial');
	await verHistorial(page, []);
});

test('Flujo 2: el aviso dura 5 segundos y Deshacer devuelve la tarea', async ({ page }) => {
	await sesionDetenida(page, HOY);
	await crearYVer(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '4', unidad: 'horas' });
	await crearYVer(page, { titulo: 'Pagar la luz', tipo: 'No se repite' });
	await expect(aviso(page)).toHaveCount(0);
	await detener(page, '2026-07-15T08:00:00');

	await completar(page, 'Regar');
	await conReloj(page, () => esperarEstado(page, 'Regar', 'en espera'));
	await verAviso(page, 'Regar');
	await a(page, '2026-07-15T08:00:04');
	await expect(aviso(page)).toHaveCount(1);
	await a(page, '2026-07-15T08:00:05');
	await expect(aviso(page)).toHaveCount(0);
	await esperarEstado(page, 'Regar', 'en espera');

	await a(page, '2026-07-15T08:01:00');
	await completar(page, 'Pagar la luz');
	await conReloj(page, () => esperarEstado(page, 'Pagar la luz', 'pendiente', undefined, true));
	await orden(page, ['Pagar la luz', 'Regar']);
	await verAviso(page, 'Pagar la luz');
	await a(page, '2026-07-15T08:01:03');
	await deshacer(page);
	await expect(aviso(page)).toHaveCount(0);
	await asentar(page);
	await conReloj(page, () => esperarEstado(page, 'Pagar la luz', 'pendiente'));

	await irA(page, 'Historial');
	await verHistorial(page, [['Hoy', [['Regar', '08:00']]]]);
	await irA(page, 'Pendientes');
	await a(page, '2026-07-15T12:00:00');
	await conReloj(page, () => esperarEstado(page, 'Regar', 'pendiente'));
	await completar(page, 'Regar');
	await verAviso(page, 'Regar');
	await a(page, '2026-07-15T12:00:02');
	await deshacer(page);
	await expect(aviso(page)).toHaveCount(0);
	await asentar(page);
	await irA(page, 'Historial');
	await conReloj(page, () => verHistorial(page, [['Hoy', [['Regar', '08:00']]]]));

	await page.reload();
	await conReloj(page, () => verHistorial(page, [['Hoy', [['Regar', '08:00']]]]));
	await irA(page, 'Pendientes');
	await conReloj(page, async () => {
		await esperarEstado(page, 'Regar', 'pendiente');
		await esperarEstado(page, 'Pagar la luz', 'pendiente');
	});
});

test('Flujo 3: un aviso nuevo reemplaza al anterior', async ({ page }) => {
	await sesionDetenida(page, HOY);
	await crearYVer(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await crearYVer(page, { titulo: 'Barrer', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await crearYVer(page, { titulo: 'Pagar la luz', tipo: 'No se repite' });
	await crearYVer(page, { titulo: 'Cambiar foco', tipo: 'No se repite' });
	await detener(page, '2026-07-15T08:00:00');

	await completar(page, 'Regar');
	await a(page, '2026-07-15T08:00:03');
	await completar(page, 'Barrer');
	await verAviso(page, 'Barrer');
	await a(page, '2026-07-15T08:00:07');
	await verAviso(page, 'Barrer');
	await a(page, '2026-07-15T08:00:08');
	await expect(aviso(page)).toHaveCount(0);

	await a(page, '2026-07-15T08:10:00');
	await completar(page, 'Pagar la luz');
	await a(page, '2026-07-15T08:10:02');
	await completar(page, 'Cambiar foco');
	await verAviso(page, 'Cambiar foco');
	await a(page, '2026-07-15T08:10:03');
	await deshacer(page);
	await expect(aviso(page)).toHaveCount(0);
	await asentar(page);
	await conReloj(page, () => esperarEstado(page, 'Cambiar foco', 'pendiente'));
	await esperarEstado(page, 'Pagar la luz', 'pendiente', undefined, true);

	await irA(page, 'Historial');
	await verHistorial(page, [
		['Hoy', [['Pagar la luz', '08:10'], ['Barrer', '08:00'], ['Regar', '08:00']]]
	]);
});

test('Flujo 4: el aviso sigue visible al cambiar de pantalla', async ({ page }) => {
	await sesionDetenida(page, HOY);
	await crearYVer(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await detener(page, '2026-07-15T08:00:00');
	await completar(page, 'Regar');
	await verAviso(page, 'Regar');
	await a(page, '2026-07-15T08:00:01');
	await irA(page, 'Historial');
	await verAviso(page, 'Regar');
	await verHistorial(page, [['Hoy', [['Regar', '08:00']]]]);
	await a(page, '2026-07-15T08:00:02');
	await deshacer(page);
	await expect(aviso(page)).toHaveCount(0);
	await asentar(page);
	await conReloj(page, () => verHistorial(page, []));
	await irA(page, 'Pendientes');
	await conReloj(page, () => esperarEstado(page, 'Regar', 'pendiente'));
});

test('Flujo 5: orden, grupos por día y hora', async ({ page }) => {
	await sesion(page, '2026-07-13T08:00:00');
	await crear(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '1', unidad: 'días' });
	await crear(page, { titulo: 'Sacar la basura', tipo: 'Días de la semana', dias: ['martes', 'jueves'] });
	await crear(page, { titulo: 'Pagar la luz', tipo: 'No se repite' });
	await adelantar(page, '2026-07-13T09:00:00');
	await completar(page, 'Regar');
	await adelantar(page, '2026-07-14T21:30:00');
	await completar(page, 'Sacar la basura');
	await adelantar(page, '2026-07-15T08:05:00');
	await completar(page, 'Regar');
	await adelantar(page, '2026-07-15T10:00:00');
	await completar(page, 'Pagar la luz');
	await adelantar(page, '2026-07-15T12:00:00');
	await irA(page, 'Historial');
	await verHistorial(page, [
		['Hoy', [['Pagar la luz', '10:00'], ['Regar', '08:05']]],
		['Ayer', [['Sacar la basura', '21:30']]],
		['lunes 13 de julio', [['Regar', '09:00']]]
	]);

	await adelantar(page, '2026-07-16T00:00:00');
	await verHistorial(page, [
		['Ayer', [['Pagar la luz', '10:00'], ['Regar', '08:05']]],
		['martes 14 de julio', [['Sacar la basura', '21:30']]],
		['lunes 13 de julio', [['Regar', '09:00']]]
	]);

	await detener(page, '2026-07-16T23:59:59');
	await irA(page, 'Pendientes');
	await completar(page, 'Regar');
	await irA(page, 'Historial');
	const final: Grupos = [
		['Hoy', [['Regar', '23:59']]],
		['Ayer', [['Pagar la luz', '10:00'], ['Regar', '08:05']]],
		['martes 14 de julio', [['Sacar la basura', '21:30']]],
		['lunes 13 de julio', [['Regar', '09:00']]]
	];
	await verHistorial(page, final);
	await page.reload();
	await conReloj(page, () => verHistorial(page, final));
});

test('Flujo 6: el año se muestra solo si no es el actual', async ({ page }) => {
	await sesion(page, '2025-12-31T21:00:00');
	await crear(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '1', unidad: 'días' });
	await adelantar(page, '2025-12-31T22:00:00');
	await completar(page, 'Regar');
	await irA(page, 'Historial');
	await verHistorial(page, [['Hoy', [['Regar', '22:00']]]]);
	await adelantar(page, '2026-01-01T10:00:00');
	await verHistorial(page, [['Ayer', [['Regar', '22:00']]]]);
	await adelantar(page, '2026-01-02T10:00:00');
	await verHistorial(page, [['miércoles 31 de diciembre de 2025', [['Regar', '22:00']]]]);
});

test('Flujo 7: borrar desde el Historial recalcula el estado', async ({ page }) => {
	await sesion(page, '2026-07-13T08:00:00');
	await crear(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '4', unidad: 'horas' });
	await crear(page, { titulo: 'Sacar la basura', tipo: 'Días de la semana', dias: ['martes', 'jueves'] });
	await crear(page, { titulo: 'Pagar la luz', tipo: 'No se repite', fecha: '2026-07-14' });
	await adelantar(page, '2026-07-14T10:00:00');
	await completar(page, 'Sacar la basura');
	await completar(page, 'Pagar la luz');
	await esperarEstado(page, 'Sacar la basura', 'en espera');
	await esperarEstado(page, 'Pagar la luz', 'pendiente', undefined, true);
	await adelantar(page, '2026-07-15T04:00:00');
	await completar(page, 'Regar');
	await adelantar(page, '2026-07-15T09:00:00');
	await esperarEstado(page, 'Regar', 'pendiente');
	await completar(page, 'Regar');
	await adelantar(page, '2026-07-15T11:00:00');
	await esperarEstado(page, 'Regar', 'en espera', 50);
	await esperarEstado(page, 'Sacar la basura', 'en espera');

	await irA(page, 'Historial');
	await entrada(page, 'Regar', '09:00').getByRole('button', { name: 'Borrar', exact: true }).click();
	const dialogo = page.getByRole('alertdialog');
	await expect(dialogo).toHaveText(/¿Borrar «Regar» de Hoy, 09:00\?/);
	await expect(dialogo.getByRole('button', { name: 'Borrar', exact: true })).toBeVisible();
	await dialogo.getByRole('button', { name: 'Cancelar' }).click();
	await expect(dialogo).toHaveCount(0);
	await expect(entrada(page, 'Regar', '09:00')).toHaveCount(1);
	await expect(entrada(page, 'Regar', '04:00')).toHaveCount(1);

	await borrarEntrada(page, 'Regar', '09:00', 'Hoy');
	await expect(entrada(page, 'Regar', '09:00')).toHaveCount(0);
	await expect(entrada(page, 'Regar', '04:00')).toHaveCount(1);
	await irA(page, 'Pendientes');
	await esperarEstado(page, 'Regar', 'pendiente');

	await irA(page, 'Historial');
	await borrarEntrada(page, 'Regar', '04:00', 'Hoy');
	await irA(page, 'Pendientes');
	await esperarEstado(page, 'Regar', 'pendiente');

	await irA(page, 'Historial');
	await borrarEntrada(page, 'Pagar la luz', '10:00', 'Ayer');
	await irA(page, 'Pendientes');
	await esperarEstado(page, 'Pagar la luz', 'atrasada');

	await adelantar(page, '2026-07-16T10:00:00');
	await esperarEstado(page, 'Sacar la basura', 'pendiente');
	await completar(page, 'Sacar la basura');
	await esperarEstado(page, 'Sacar la basura', 'en espera');
	await adelantar(page, '2026-07-18T17:00:00');
	await esperarEstado(page, 'Sacar la basura', 'en espera', 50);
	await irA(page, 'Historial');
	await borrarEntrada(page, 'Sacar la basura', '10:00', 'jueves 16 de julio');
	await irA(page, 'Pendientes');
	await esperarEstado(page, 'Sacar la basura', 'atrasada');

	await irA(page, 'Historial');
	await page.reload();
	await verHistorial(page, [['martes 14 de julio', [['Sacar la basura', '10:00']]]]);
	await irA(page, 'Pendientes');
	await orden(page, ['Pagar la luz', 'Sacar la basura', 'Regar']);
	await esperarEstado(page, 'Pagar la luz', 'atrasada');
	await esperarEstado(page, 'Sacar la basura', 'atrasada');
	await esperarEstado(page, 'Regar', 'pendiente');
});

test('Flujo 8: borrar un completado que no es el más reciente', async ({ page }) => {
	await sesion(page, '2026-07-15T06:00:00');
	await crear(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '4', unidad: 'horas' });
	await completar(page, 'Regar');
	await adelantar(page, '2026-07-15T10:30:00');
	await esperarEstado(page, 'Regar', 'pendiente');
	await completar(page, 'Regar');
	await adelantar(page, '2026-07-15T12:30:00');
	await esperarEstado(page, 'Regar', 'en espera', 50);
	await irA(page, 'Historial');
	await borrarEntrada(page, 'Regar', '06:00', 'Hoy');
	await verHistorial(page, [['Hoy', [['Regar', '10:30']]]]);
	await irA(page, 'Pendientes');
	await esperarEstado(page, 'Regar', 'en espera', 50);
});

test('Flujo 9: el título que se ve es el actual', async ({ page }) => {
	await sesion(page, '2026-07-14T09:00:00');
	await crear(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '1', unidad: 'días' });
	await completar(page, 'Regar');
	await adelantar(page, '2026-07-15T10:00:00');
	await esperarEstado(page, 'Regar', 'pendiente');
	await completar(page, 'Regar');
	await editar(page, 'Regar', { titulo: 'Regar plantas' });
	await irA(page, 'Historial');
	await verHistorial(page, [
		['Hoy', [['Regar plantas', '10:00']]],
		['Ayer', [['Regar plantas', '09:00']]]
	]);
});

test('Flujo 10: editar y borrar la tarea desde el Historial', async ({ page }) => {
	await sesion(page, HOY);
	await crear(page, { titulo: 'Pagar la luz', tipo: 'No se repite' });
	await crear(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await completar(page, 'Pagar la luz');
	await completar(page, 'Regar');
	await esperarEstado(page, 'Pagar la luz', 'pendiente', undefined, true);
	await esperarEstado(page, 'Regar', 'en espera');
	await adelantar(page, '2026-07-15T10:00:00');
	await irA(page, 'Historial');

	await abrir(page, 'Pagar la luz');
	await expect(page.getByLabel('Título')).toHaveValue('Pagar la luz');
	await expect(page.getByRole('radio', { name: 'No se repite' })).toBeChecked();
	await expect(page.getByLabel('Fecha límite')).toHaveValue('');
	await cerrar(page);
	await expect(page.getByRole('heading', { name: 'Historial', level: 1 })).toBeVisible();
	await expect(page.getByRole('listitem')).toHaveCount(2);

	await abrir(page, 'Pagar la luz');
	await completarPanel(page, { tipo: 'Intervalo', cada: '4', unidad: 'horas' });
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(page.getByRole('listitem')).toHaveCount(2);
	await irA(page, 'Pendientes');
	await esperarEstado(page, 'Pagar la luz', 'en espera', 50);

	await irA(page, 'Historial');
	await abrir(page, 'Pagar la luz');
	await expect(page.getByRole('radio', { name: 'Intervalo' })).toBeChecked();
	await expect(page.getByRole('spinbutton', { name: 'Cada' })).toHaveValue('4');
	await expect(page.getByLabel('Unidad').locator('option:checked')).toHaveText('horas');
	await page.getByRole('button', { name: 'Borrar tarea' }).click();
	await page.getByRole('alertdialog').getByRole('button', { name: 'Borrar', exact: true }).click();
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
	await verHistorial(page, [['Hoy', [['Regar', '08:00']]]]);
	await irA(page, 'Pendientes');
	await expect(fila(page, 'Pagar la luz')).toHaveCount(0);

	await borrar(page, 'Regar');
	await irA(page, 'Historial');
	await verHistorial(page, []);
});

test('Flujo 11: dos dispositivos completan sin conexión', async ({ browser }) => {
	const { a: A, b: B, ctxB, cerrar: fin } = await dosConCompletadas(browser, HOY);
	await crear(A, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await esperarEstado(B, 'Regar', 'pendiente');
	await ctxB.setOffline(true);
	await completar(A, 'Regar');
	await esperarEstado(A, 'Regar', 'en espera');
	await llegaAlServidor(A);
	await adelantar(A, '2026-07-15T09:00:00');
	await adelantar(B, '2026-07-15T09:00:00');
	await esperarEstado(B, 'Regar', 'pendiente');
	await completar(B, 'Regar');
	await ctxB.setOffline(false);
	await llegaAlServidor(B);
	const ambos: Grupos = [['Hoy', [['Regar', '09:00'], ['Regar', '08:00']]]];
	for (const p of [A, B]) {
		await irA(p, 'Historial');
		await verHistorial(p, ambos);
	}
	await borrarEntrada(A, 'Regar', '09:00', 'Hoy');
	await verHistorial(B, [['Hoy', [['Regar', '08:00']]]]);
	await verHistorial(A, [['Hoy', [['Regar', '08:00']]]]);
	await fin();
});

test('Flujo 12: Deshacer cuando otro dispositivo ya borró la tarea', async ({ browser }) => {
	const { a: A, b: B, cerrar: fin } = await dosConCompletadas(browser, '2026-07-15T09:50:00');
	await crear(A, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await esperarEstado(B, 'Regar', 'pendiente');
	await detener(A, '2026-07-15T10:00:00');
	await completar(A, 'Regar');
	await verAviso(A, 'Regar');
	await borrar(B, 'Regar');
	await conReloj(A, () => expect(fila(A, 'Regar')).toHaveCount(0));
	await a(A, '2026-07-15T10:00:02');
	await deshacer(A);
	await expect(aviso(A)).toHaveCount(0);
	await conReloj(A, () => expect(fila(A, 'Regar')).toHaveCount(0));
	await expect(A.getByRole('listitem')).toHaveCount(0);
	await expect(B.getByRole('listitem')).toHaveCount(0);
	await irA(A, 'Historial');
	await irA(B, 'Historial');
	await verHistorial(A, []);
	await verHistorial(B, []);
	for (const p of [A, B]) await p.reload();
	await conReloj(A, () => verHistorial(A, []));
	await verHistorial(B, []);
	await fin();
});

test('Flujo 13: completado huérfano', async ({ browser }) => {
	const { a: A, b: B, ctxB, cerrar: fin } = await dosConCompletadas(browser, HOY);
	await crear(A, { titulo: 'Barrer', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await crear(A, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await completar(A, 'Regar');
	await esperarEstado(B, 'Barrer', 'pendiente');
	await esperarEstado(B, 'Regar', 'en espera');
	await ctxB.setOffline(true);
	await completar(B, 'Barrer');
	await borrar(A, 'Barrer');
	await llegaAlServidor(A);
	await ctxB.setOffline(false);
	await llegaAlServidor(B);
	for (const p of [A, B]) {
		await irA(p, 'Historial');
		await verHistorial(p, [['Hoy', [['Regar', '08:00']]]]);
	}
	for (const p of [A, B]) {
		await p.reload();
		await verHistorial(p, [['Hoy', [['Regar', '08:00']]]]);
	}
	await fin();
});

test('Flujo 14: completado "del futuro"', async ({ browser }) => {
	const dispA = await dispositivo(browser, '2026-07-15T12:00:00', true);
	const dispB = await dispositivo(browser, '2026-07-16T09:00:00', false);
	const [A, B] = [dispA.page, dispB.page];
	await encenderCompletadas(A);
	await encenderCompletadas(B);
	await crear(A, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await esperarEstado(B, 'Regar', 'pendiente');
	await completar(B, 'Regar');
	await irA(A, 'Historial');
	await verHistorial(A, [['jueves 16 de julio', [['Regar', '09:00']]]]);
	await irA(A, 'Pendientes');
	await esperarEstado(A, 'Regar', 'en espera', 0);
	await dispA.ctx.close();
	await dispB.ctx.close();
});
