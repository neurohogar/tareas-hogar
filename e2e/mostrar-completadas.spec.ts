import { expect, test, type Page } from '@playwright/test';
import {
	adelantar,
	asentar,
	completar,
	conReloj,
	conmutarMostrarCompletadas,
	crear,
	crearYVer,
	detener,
	dispositivo,
	dosDispositivos,
	encenderCompletadas,
	esperarEstado,
	irA,
	limpiarEmuladores,
	listaEs,
	llegaAlServidor,
	mostrarCompletadas,
	opacidadEfectiva,
	sesionConReloj,
	tituloDeFila,
	fila,
	verHistorial
} from './apoyo';

const HOY = '2026-07-15T08:00:00';

test.beforeEach(async () => {
	await limpiarEmuladores();
});

/** Avanza el reloj simulado hasta `hora`, disparando los temporizadores intermedios (reloj detenido). */
async function ir(page: Page, hora: string) {
	const falta = new Date(hora).getTime() - (await page.evaluate(() => Date.now()));
	if (falta <= 10_000) await page.clock.runFor(falta);
	else await adelantar(page, hora);
}

/** Sesión que termina con el reloj corriendo 10 minutos antes de `hora`, con Mostrar completadas encendido. */
async function sesionDetenida(page: Page, hora: string) {
	await sesionConReloj(page, new Date(new Date(hora).getTime() - 600_000).toISOString());
	await encenderCompletadas(page);
}

const aviso = (page: Page) => page.getByRole('status');

async function verAviso(page: Page, titulo: string) {
	await expect(aviso(page)).toHaveCount(1);
	await expect(aviso(page)).toContainText(`Completaste «${titulo}»`);
	await expect(aviso(page).getByRole('button', { name: 'Deshacer' })).toBeVisible();
}

const filtro = (page: Page, nombre: string) =>
	page.getByRole('group', { name: 'Filtrar por etiqueta' }).getByRole('button', { name: nombre, exact: true });

test('Flujo 1: apagado por defecto, encender y apagar', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await crear(page, { titulo: 'Cambiar foco', tipo: 'No se repite' });
	await adelantar(page, '2026-07-15T08:01:00');
	await crear(page, { titulo: 'Regar plantas', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await adelantar(page, '2026-07-15T08:02:00');
	await crear(page, { titulo: 'Sacar la basura', tipo: 'Días de la semana', dias: ['sábado'] });
	await expect(mostrarCompletadas(page)).not.toBeChecked();
	await listaEs(page, ['Regar plantas', 'Cambiar foco', 'Sacar la basura']);
	await esperarEstado(page, 'Regar plantas', 'pendiente');
	await esperarEstado(page, 'Cambiar foco', 'pendiente');
	await esperarEstado(page, 'Sacar la basura', 'en espera', undefined, false);

	await adelantar(page, '2026-07-15T08:05:00');
	await completar(page, 'Cambiar foco');
	await listaEs(page, ['Regar plantas', 'Sacar la basura']);

	await adelantar(page, '2026-07-15T08:06:00');
	await completar(page, 'Regar plantas');
	await listaEs(page, ['Sacar la basura']);

	await conmutarMostrarCompletadas(page, true);
	await listaEs(page, ['Sacar la basura', 'Regar plantas', 'Cambiar foco']);
	await esperarEstado(page, 'Regar plantas', 'en espera', 0);
	await esperarEstado(page, 'Cambiar foco', 'pendiente', undefined, true);
	await esperarEstado(page, 'Sacar la basura', 'en espera', undefined, false);

	await conmutarMostrarCompletadas(page, false);
	await listaEs(page, ['Sacar la basura']);

	await conmutarMostrarCompletadas(page, true);
	await adelantar(page, '2026-07-17T08:06:00');
	await esperarEstado(page, 'Regar plantas', 'pendiente');
	await listaEs(page, ['Regar plantas', 'Sacar la basura', 'Cambiar foco']);
	await esperarEstado(page, 'Cambiar foco', 'pendiente', undefined, true);
	const opRegar = await opacidadEfectiva(tituloDeFila(fila(page, 'Regar plantas')));
	const opFoco = await opacidadEfectiva(tituloDeFila(fila(page, 'Cambiar foco')));
	expect(opFoco).toBeLessThan(opRegar);
});

test('Flujo 2: orden de las completadas y filtro por etiqueta', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await encenderCompletadas(page);
	await crear(page, { titulo: 'Pagar la luz', tipo: 'No se repite', etiquetas: ['Casa'] });
	await adelantar(page, '2026-07-15T08:01:00');
	await crear(page, { titulo: 'Ventilar', tipo: 'Intervalo', cada: '4', unidad: 'horas', etiquetas: ['Patio'] });
	await adelantar(page, '2026-07-15T08:02:00');
	await crear(page, { titulo: 'Barrer', tipo: 'No se repite', etiquetas: ['Casa'] });
	await adelantar(page, '2026-07-15T08:03:00');
	await crear(page, { titulo: 'Lavar ropa', tipo: 'No se repite' });

	await adelantar(page, '2026-07-15T09:00:00');
	await completar(page, 'Barrer');
	await adelantar(page, '2026-07-15T09:30:00');
	await completar(page, 'Ventilar');
	await adelantar(page, '2026-07-15T10:00:00');
	await completar(page, 'Pagar la luz');
	await listaEs(page, ['Lavar ropa', 'Pagar la luz', 'Ventilar', 'Barrer']);
	await esperarEstado(page, 'Lavar ropa', 'pendiente');
	await esperarEstado(page, 'Pagar la luz', 'pendiente', undefined, true);
	await esperarEstado(page, 'Ventilar', 'en espera');
	await esperarEstado(page, 'Barrer', 'pendiente', undefined, true);

	await filtro(page, 'Casa').click();
	await listaEs(page, ['Pagar la luz', 'Barrer']);
	await filtro(page, 'Patio').click();
	await listaEs(page, ['Ventilar']);
	await esperarEstado(page, 'Ventilar', 'en espera');

	await filtro(page, 'Todas').click();
	await adelantar(page, '2026-07-15T13:30:00');
	await esperarEstado(page, 'Ventilar', 'pendiente');
	await listaEs(page, ['Ventilar', 'Lavar ropa', 'Pagar la luz', 'Barrer']);

	await page.reload();
	await expect(mostrarCompletadas(page)).toBeChecked();
	await expect(filtro(page, 'Todas')).toHaveAttribute('aria-pressed', 'true');
	await listaEs(page, ['Ventilar', 'Lavar ropa', 'Pagar la luz', 'Barrer']);
});

test('Flujo 3: tocar el checkbox de una completada', async ({ page }) => {
	await sesionDetenida(page, HOY);
	await crearYVer(page, { titulo: 'Pagar la luz', tipo: 'No se repite', fecha: '2026-07-15' });
	await crearYVer(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '4', unidad: 'horas' });
	await listaEs(page, ['Pagar la luz', 'Regar']);
	await detener(page, HOY);

	await completar(page, 'Pagar la luz');
	await verAviso(page, 'Pagar la luz');
	await conReloj(page, () => listaEs(page, ['Regar', 'Pagar la luz']));
	await esperarEstado(page, 'Pagar la luz', 'pendiente', undefined, true);

	await ir(page, '2026-07-15T08:00:10');
	await expect(aviso(page)).toHaveCount(0);
	await completar(page, 'Pagar la luz');
	await conReloj(page, async () => {
		await listaEs(page, ['Pagar la luz', 'Regar']);
		await esperarEstado(page, 'Pagar la luz', 'pendiente');
	});
	await expect(aviso(page)).toHaveCount(0);
	await irA(page, 'Historial');
	await conReloj(page, () => verHistorial(page, []));
	await irA(page, 'Pendientes');

	await ir(page, '2026-07-15T08:01:00');
	await completar(page, 'Regar');
	await verAviso(page, 'Regar');
	await conReloj(page, () => esperarEstado(page, 'Regar', 'en espera', 0));

	await ir(page, '2026-07-15T08:01:02');
	await completar(page, 'Regar');
	await conReloj(page, () => esperarEstado(page, 'Regar', 'pendiente'));
	await verAviso(page, 'Regar');

	await ir(page, '2026-07-15T08:01:03');
	await aviso(page).getByRole('button', { name: 'Deshacer' }).click();
	await expect(aviso(page)).toHaveCount(0);
	await asentar(page);
	await conReloj(page, () => esperarEstado(page, 'Regar', 'pendiente'));
	await irA(page, 'Historial');
	await conReloj(page, () => verHistorial(page, []));
	await irA(page, 'Pendientes');

	await ir(page, '2026-07-15T08:02:00');
	await completar(page, 'Regar');
	await conReloj(page, () => esperarEstado(page, 'Regar', 'en espera', 0));
	await ir(page, '2026-07-15T12:02:00');
	await conReloj(page, () => esperarEstado(page, 'Regar', 'pendiente'));
	await completar(page, 'Regar');
	await conReloj(page, () => esperarEstado(page, 'Regar', 'en espera', 0));
	await irA(page, 'Historial');
	await conReloj(page, () => verHistorial(page, [['Hoy', [['Regar', '12:02'], ['Regar', '08:02']]]]));
	await irA(page, 'Pendientes');

	await ir(page, '2026-07-15T12:02:10');
	await completar(page, 'Regar');
	await conReloj(page, () => esperarEstado(page, 'Regar', 'pendiente'));
	await irA(page, 'Historial');
	await conReloj(page, () => verHistorial(page, [['Hoy', [['Regar', '08:02']]]]));
	await irA(page, 'Pendientes');

	await ir(page, '2026-07-16T00:00:00');
	await conReloj(page, async () => {
		await esperarEstado(page, 'Pagar la luz', 'atrasada');
		await esperarEstado(page, 'Regar', 'atrasada');
	});
	await completar(page, 'Pagar la luz');
	await conReloj(page, () => esperarEstado(page, 'Pagar la luz', 'pendiente', undefined, true));
	await completar(page, 'Pagar la luz');
	await conReloj(page, () => esperarEstado(page, 'Pagar la luz', 'atrasada'));

	await page.reload();
	await conReloj(page, async () => {
		await listaEs(page, ['Regar', 'Pagar la luz']);
		await esperarEstado(page, 'Regar', 'atrasada');
		await esperarEstado(page, 'Pagar la luz', 'atrasada');
	});
});

test('Flujo 4: el valor se guarda en el dispositivo', async ({ browser }) => {
	const contexto = await browser.newContext();
	const page = await contexto.newPage();
	await sesionConReloj(page, HOY);
	await crear(page, { titulo: 'Cambiar foco', tipo: 'No se repite' });
	await crear(page, { titulo: 'Pagar la luz', tipo: 'No se repite' });
	await completar(page, 'Cambiar foco');
	await listaEs(page, ['Pagar la luz']);

	await conmutarMostrarCompletadas(page, true);
	await listaEs(page, ['Pagar la luz', 'Cambiar foco']);
	await esperarEstado(page, 'Cambiar foco', 'pendiente', undefined, true);

	await page.reload();
	await expect(mostrarCompletadas(page)).toBeChecked();
	await listaEs(page, ['Pagar la luz', 'Cambiar foco']);

	await page.close();
	const nueva = await contexto.newPage();
	await nueva.clock.install({ time: new Date(HOY) });
	await nueva.goto('/');
	await expect(nueva.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
	await expect(nueva.getByRole('button', { name: 'Entrar con Google' })).toHaveCount(0);
	await expect(mostrarCompletadas(nueva)).toBeChecked();
	await listaEs(nueva, ['Pagar la luz', 'Cambiar foco']);

	await conmutarMostrarCompletadas(nueva, false);
	await nueva.reload();
	await expect(mostrarCompletadas(nueva)).not.toBeChecked();
	await listaEs(nueva, ['Pagar la luz']);
	await contexto.close();
});

test('Flujo 5: el valor no se sincroniza entre dispositivos', async ({ browser }) => {
	const { a, b, cerrar: fin } = await dosDispositivos(browser, HOY);
	await crear(a, { titulo: 'Cambiar foco', tipo: 'No se repite' });
	await crear(a, { titulo: 'Pagar la luz', tipo: 'No se repite' });
	await completar(a, 'Cambiar foco');
	await listaEs(b, ['Pagar la luz']);

	await conmutarMostrarCompletadas(a, true);
	await listaEs(a, ['Pagar la luz', 'Cambiar foco']);
	await expect(mostrarCompletadas(b)).not.toBeChecked();
	await listaEs(b, ['Pagar la luz']);
	await b.reload();
	await expect(mostrarCompletadas(b)).not.toBeChecked();
	await listaEs(b, ['Pagar la luz']);

	await conmutarMostrarCompletadas(b, true);
	await listaEs(b, ['Pagar la luz', 'Cambiar foco']);
	await esperarEstado(b, 'Cambiar foco', 'pendiente', undefined, true);
	await conmutarMostrarCompletadas(a, false);
	await listaEs(a, ['Pagar la luz']);
	await expect(mostrarCompletadas(b)).toBeChecked();
	await listaEs(b, ['Pagar la luz', 'Cambiar foco']);
	await fin();
});

test('Flujo 6: dos completados de dos dispositivos', async ({ browser }) => {
	const { a, b, ctxB, cerrar: fin } = await dosDispositivos(browser, HOY);
	await encenderCompletadas(a);
	await crear(a, { titulo: 'Pagar la luz', tipo: 'No se repite' });
	await expect(fila(b, 'Pagar la luz')).toBeVisible();

	await ctxB.setOffline(true);
	await completar(a, 'Pagar la luz');
	await esperarEstado(a, 'Pagar la luz', 'pendiente', undefined, true);
	await llegaAlServidor(a);
	await adelantar(a, '2026-07-15T08:05:00');
	await adelantar(b, '2026-07-15T08:05:00');
	await completar(b, 'Pagar la luz');
	await expect(fila(b, 'Pagar la luz')).toHaveCount(0);
	await ctxB.setOffline(false);
	await llegaAlServidor(b);

	await irA(a, 'Historial');
	await verHistorial(a, [['Hoy', [['Pagar la luz', '08:05'], ['Pagar la luz', '08:00']]]]);
	await irA(a, 'Pendientes');
	await esperarEstado(a, 'Pagar la luz', 'pendiente', undefined, true);

	await completar(a, 'Pagar la luz');
	await esperarEstado(a, 'Pagar la luz', 'pendiente', undefined, true);
	await irA(a, 'Historial');
	await verHistorial(a, [['Hoy', [['Pagar la luz', '08:00']]]]);
	await irA(b, 'Historial');
	await verHistorial(b, [['Hoy', [['Pagar la luz', '08:00']]]]);

	await irA(a, 'Pendientes');
	await completar(a, 'Pagar la luz');
	await esperarEstado(a, 'Pagar la luz', 'pendiente');
	await irA(a, 'Historial');
	await verHistorial(a, []);
	await verHistorial(b, []);
	await fin();
});

test('Flujo 7: periódica completada ayer: el checkbox la completa de nuevo', async ({ page }) => {
	await sesionDetenida(page, '2026-07-15T20:00:00');
	await crearYVer(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await detener(page, '2026-07-15T20:00:00');

	await completar(page, 'Regar');
	await verAviso(page, 'Regar');
	await conReloj(page, () => esperarEstado(page, 'Regar', 'en espera'));

	await ir(page, '2026-07-15T23:59:59');
	await expect(aviso(page)).toHaveCount(0);
	await completar(page, 'Regar');
	await conReloj(page, () => esperarEstado(page, 'Regar', 'pendiente'));
	await expect(aviso(page)).toHaveCount(0);
	await completar(page, 'Regar');
	await conReloj(page, () => esperarEstado(page, 'Regar', 'en espera', 0));
	await irA(page, 'Historial');
	await conReloj(page, () => verHistorial(page, [['Hoy', [['Regar', '23:59']]]]));
	await irA(page, 'Pendientes');

	await ir(page, '2026-07-16T00:00:00');
	await completar(page, 'Regar');
	await verAviso(page, 'Regar');
	await conReloj(page, () => esperarEstado(page, 'Regar', 'en espera', 0));
	await irA(page, 'Historial');
	await conReloj(page, () => verHistorial(page, [['Hoy', [['Regar', '00:00']]], ['Ayer', [['Regar', '23:59']]]]));
	await irA(page, 'Pendientes');

	await ir(page, '2026-07-16T00:00:10');
	await expect(aviso(page)).toHaveCount(0);
	await completar(page, 'Regar');
	await expect(aviso(page)).toHaveCount(0);
	await conReloj(page, () => esperarEstado(page, 'Regar', 'en espera'));
	await irA(page, 'Historial');
	await conReloj(page, () => verHistorial(page, [['Ayer', [['Regar', '23:59']]]]));
});

test('Flujo 8: completado "del futuro"', async ({ browser }) => {
	const dispA = await dispositivo(browser, '2026-07-15T12:00:00', true);
	const dispB = await dispositivo(browser, '2026-07-16T09:00:00', false);
	const [A, B] = [dispA.page, dispB.page];
	await encenderCompletadas(A);
	await crear(A, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await esperarEstado(B, 'Regar', 'pendiente');
	await completar(B, 'Regar');
	await esperarEstado(A, 'Regar', 'en espera', 0);

	await completar(A, 'Regar');
	await esperarEstado(A, 'Regar', 'pendiente');
	for (const p of [A, B]) {
		await irA(p, 'Historial');
		await verHistorial(p, []);
	}
	await dispA.ctx.close();
	await dispB.ctx.close();
});
