import { expect, test, type Browser } from '@playwright/test';
import {
	SEMANA,
	abrir,
	adelantar,
	borrar,
	cerrar,
	descartar,
	completar,
	completarPanel,
	conmutarMostrarCompletadas,
	crear,
	dosDispositivos as dosSinCompletadas,
	listaEs,
	editar,
	encenderCompletadas,
	esperarEstado,
	fila,
	limpiarEmuladores,
	llegaAlServidor,
	sesionConReloj as sesionSinCompletadas,
	verificarDias
} from './apoyo';

const LUNES = '2026-07-13T08:00:00';

/** Al empezar cada flujo se enciende Mostrar completadas (en A y en B en los de dos dispositivos). */
async function sesionConReloj(page: Parameters<typeof encenderCompletadas>[0], hora: string) {
	await sesionSinCompletadas(page, hora);
	await encenderCompletadas(page);
}

async function dosDispositivos(browser: Browser, hora?: string) {
	const d = await dosSinCompletadas(browser, hora);
	await encenderCompletadas(d.a);
	await encenderCompletadas(d.b);
	return d;
}

test.beforeEach(async () => {
	await limpiarEmuladores();
});

test('Flujo 1: abrir el panel de edición con los valores de la tarea', async ({ page }) => {
	await sesionConReloj(page, LUNES);
	await page.getByRole('button', { name: '+' }).click();
	await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Borrar tarea' })).toHaveCount(0);
	await cerrar(page);

	await crear(page, { titulo: 'Pagar la luz', tipo: 'No se repite', fecha: '2026-07-15' });
	await crear(page, { titulo: 'Cambiar foco', tipo: 'No se repite' });
	await crear(page, { titulo: 'Regar plantas', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await crear(page, { titulo: 'Sacar la basura', tipo: 'Días de la semana', dias: ['martes', 'jueves'] });
	await crear(page, { titulo: 'Pagar expensas', tipo: 'Días del mes', dias: ['10', '31'] });

	await abrir(page, 'Pagar la luz');
	await expect(page.getByLabel('Título')).toHaveValue('Pagar la luz');
	await expect(page.getByRole('radio', { name: 'No se repite' })).toBeChecked();
	await expect(page.getByLabel('Fecha límite')).toHaveValue('2026-07-15');
	for (const b of ['Cerrar', 'Guardar', 'Borrar tarea'])
		await expect(page.getByRole('button', { name: b })).toBeVisible();
	await cerrar(page);

	await abrir(page, 'Cambiar foco');
	await expect(page.getByRole('radio', { name: 'No se repite' })).toBeChecked();
	await expect(page.getByLabel('Fecha límite')).toHaveValue('');
	await cerrar(page);

	await abrir(page, 'Regar plantas');
	await expect(page.getByRole('radio', { name: 'Intervalo' })).toBeChecked();
	await expect(page.getByRole('spinbutton', { name: 'Cada' })).toHaveValue('2');
	await expect(page.getByLabel('Unidad')).toHaveValue('dias');
	await expect(page.getByLabel('Unidad').locator('option:checked')).toHaveText('días');
	await cerrar(page);

	await abrir(page, 'Sacar la basura');
	await expect(page.getByRole('radio', { name: 'Días de la semana' })).toBeChecked();
	await verificarDias(page, 'Días de la semana', ['martes', 'jueves'], SEMANA);
	await cerrar(page);

	await abrir(page, 'Pagar expensas');
	await expect(page.getByRole('radio', { name: 'Días del mes' })).toBeChecked();
	await verificarDias(page, 'Días del mes', ['10', '31'], Array.from({ length: 31 }, (_, i) => String(i + 1)));
	await cerrar(page);

	await completar(page, 'Regar plantas');
	await esperarEstado(page, 'Regar plantas', 'en espera');
	await expect(page.getByRole('dialog')).toHaveCount(0);

	await expect(page.getByRole('listitem')).toHaveCount(5);
	await esperarEstado(page, 'Pagar la luz', 'pendiente');
	await esperarEstado(page, 'Cambiar foco', 'pendiente');
	await esperarEstado(page, 'Sacar la basura', 'en espera', undefined, false);
	await esperarEstado(page, 'Pagar expensas', 'en espera', undefined, false);
});

test('Flujo 2: editar el título y cerrar sin guardar', async ({ page }) => {
	await sesionConReloj(page, LUNES);
	await crear(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await editar(page, 'Regar', { titulo: 'Regar plantas' });
	await esperarEstado(page, 'Regar plantas', 'pendiente');
	await page.reload();
	await esperarEstado(page, 'Regar plantas', 'pendiente');

	await abrir(page, 'Regar plantas');
	await completarPanel(page, { titulo: 'Otra cosa', cada: '5' });
	await descartar(page);
	await esperarEstado(page, 'Regar plantas', 'pendiente');
	await expect(page.getByRole('listitem')).toHaveCount(1);

	await abrir(page, 'Regar plantas');
	await expect(page.getByLabel('Título')).toHaveValue('Regar plantas');
	await expect(page.getByRole('spinbutton', { name: 'Cada' })).toHaveValue('2');
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await esperarEstado(page, 'Regar plantas', 'pendiente');
});

test('Flujo 3: validación al editar', async ({ page }) => {
	await sesionConReloj(page, LUNES);
	await crear(page, { titulo: 'Sacar la basura', tipo: 'Días de la semana', dias: ['martes', 'jueves'] });
	await abrir(page, 'Sacar la basura');
	const titulo = page.getByLabel('Título');
	const guardar = page.getByRole('button', { name: 'Guardar' });
	const abierto = () => expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();

	await titulo.fill('');
	await guardar.click();
	await expect(titulo).toHaveAccessibleDescription(/título/i);
	await abierto();

	await titulo.fill('   ');
	await guardar.click();
	await expect(titulo).toHaveAccessibleDescription(/título/i);
	await abierto();

	await titulo.fill('Basura');
	await page.getByRole('button', { name: 'martes' }).click();
	await page.getByRole('button', { name: 'jueves' }).click();
	await guardar.click();
	await expect(page.getByRole('group', { name: 'Días de la semana' })).toHaveAccessibleDescription(/al menos un día/i);
	await abierto();

	await page.getByRole('radio', { name: 'Intervalo' }).check();
	await page.getByRole('spinbutton', { name: 'Cada' }).fill('0');
	await guardar.click();
	await expect(page.getByRole('spinbutton', { name: 'Cada' })).toHaveAccessibleDescription(/entero/i);
	await abierto();

	await page.getByRole('radio', { name: 'No se repite' }).check();
	const fecha = page.getByLabel('Fecha límite');
	await fecha.click();
	await page.keyboard.type('1507');
	await guardar.click();
	await expect(fecha).toHaveAccessibleDescription(/fecha/i);
	await abierto();

	await descartar(page);
	await esperarEstado(page, 'Sacar la basura', 'en espera', undefined, false);
	await abrir(page, 'Sacar la basura');
	await expect(page.getByLabel('Título')).toHaveValue('Sacar la basura');
	await expect(page.getByRole('radio', { name: 'Días de la semana' })).toBeChecked();
	await verificarDias(page, 'Días de la semana', ['martes', 'jueves'], SEMANA);
});

test('Flujo 4: editar la fecha límite de una puntual', async ({ page }) => {
	await sesionConReloj(page, '2026-07-15T10:00:00');
	await crear(page, { titulo: 'Pagar la luz', tipo: 'No se repite', fecha: '2026-07-14' });
	await esperarEstado(page, 'Pagar la luz', 'atrasada');
	await editar(page, 'Pagar la luz', { fecha: '2026-07-20' });
	await esperarEstado(page, 'Pagar la luz', 'pendiente');
	await editar(page, 'Pagar la luz', { fecha: '' });
	await esperarEstado(page, 'Pagar la luz', 'pendiente');
	await editar(page, 'Pagar la luz', { fecha: '2026-07-15' });
	await esperarEstado(page, 'Pagar la luz', 'pendiente');
	await adelantar(page, '2026-07-16T00:00:00');
	await esperarEstado(page, 'Pagar la luz', 'atrasada');
	await page.reload();
	await esperarEstado(page, 'Pagar la luz', 'atrasada');
});

test('Flujo 5: editar el intervalo de una relativa completada', async ({ page }) => {
	await sesionConReloj(page, '2026-07-15T08:00:00');
	await crear(page, { titulo: 'Ventilar', tipo: 'Intervalo', cada: '4', unidad: 'horas' });
	await completar(page, 'Ventilar');
	await esperarEstado(page, 'Ventilar', 'en espera', 0);
	await adelantar(page, '2026-07-15T20:00:00');
	await esperarEstado(page, 'Ventilar', 'atrasada');
	await editar(page, 'Ventilar', { cada: '2', unidad: 'días' });
	await esperarEstado(page, 'Ventilar', 'en espera', 25);
	await editar(page, 'Ventilar', { cada: '12', unidad: 'horas' });
	await esperarEstado(page, 'Ventilar', 'pendiente');
	await editar(page, 'Ventilar', { cada: '4', unidad: 'horas' });
	await esperarEstado(page, 'Ventilar', 'atrasada');
});

test('Flujo 6: cambiar los días de una semanal completada', async ({ page }) => {
	const B = 'Sacar la basura';
	await sesionConReloj(page, '2026-07-14T08:00:00');
	await crear(page, { titulo: B, tipo: 'Días de la semana', dias: ['martes', 'jueves'] });
	await esperarEstado(page, B, 'pendiente');
	await adelantar(page, '2026-07-14T12:00:00');
	await completar(page, B);
	await esperarEstado(page, B, 'en espera', 0);
	await adelantar(page, '2026-07-16T06:00:00');
	await esperarEstado(page, B, 'pendiente');
	await editar(page, B, { dias: ['sábado'] });
	await esperarEstado(page, B, 'en espera', 50);
	await editar(page, B, { dias: ['miércoles'] });
	await esperarEstado(page, B, 'atrasada');
	await editar(page, B, { tipo: 'Días del mes', dias: ['16'] });
	await esperarEstado(page, B, 'pendiente');
	await page.reload();
	await esperarEstado(page, B, 'pendiente');
	await abrir(page, B);
	await expect(page.getByRole('radio', { name: 'Días del mes' })).toBeChecked();
	await verificarDias(page, 'Días del mes', ['16'], Array.from({ length: 31 }, (_, i) => String(i + 1)));
});

test('Flujo 7: cambiar de tipo y de modo', async ({ page }) => {
	await sesionConReloj(page, '2026-07-13T10:00:00');
	await crear(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '1', unidad: 'días' });
	await completar(page, 'Regar');
	await esperarEstado(page, 'Regar', 'en espera');
	await crear(page, { titulo: 'Renovar DNI', tipo: 'No se repite', fecha: '2026-07-10' });
	await esperarEstado(page, 'Renovar DNI', 'atrasada');
	await crear(page, { titulo: 'Limpiar horno', tipo: 'Intervalo', cada: '3', unidad: 'días' });
	await esperarEstado(page, 'Limpiar horno', 'pendiente');
	await crear(page, { titulo: 'Barrer', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await completar(page, 'Barrer');
	await esperarEstado(page, 'Barrer', 'en espera');
	await adelantar(page, '2026-07-14T09:00:00');
	await esperarEstado(page, 'Regar', 'en espera');

	await editar(page, 'Regar', { tipo: 'Días de la semana', dias: ['martes', 'jueves'] });
	await esperarEstado(page, 'Regar', 'pendiente');
	await completar(page, 'Regar');
	await esperarEstado(page, 'Regar', 'en espera');
	await editar(page, 'Renovar DNI', { tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await esperarEstado(page, 'Renovar DNI', 'pendiente');
	await editar(page, 'Limpiar horno', { tipo: 'No se repite', fecha: '2026-07-13' });
	await esperarEstado(page, 'Limpiar horno', 'atrasada');
	await editar(page, 'Barrer', { tipo: 'No se repite' });
	await esperarEstado(page, 'Barrer', 'pendiente', undefined, true);

	await page.reload();
	await listaEs(page, ['Limpiar horno', 'Renovar DNI', 'Regar', 'Barrer']);
	await esperarEstado(page, 'Limpiar horno', 'atrasada');
	await esperarEstado(page, 'Renovar DNI', 'pendiente');
	await esperarEstado(page, 'Regar', 'en espera');
	await esperarEstado(page, 'Barrer', 'pendiente', undefined, true);

	await conmutarMostrarCompletadas(page, false);
	await listaEs(page, ['Limpiar horno', 'Renovar DNI']);
});

test('Flujo 8: editar cambia el orden', async ({ page }) => {
	await sesionConReloj(page, '2026-07-15T06:00:00');
	await crear(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '4', unidad: 'horas' });
	await completar(page, 'Regar');
	await adelantar(page, '2026-07-15T06:01:00');
	await crear(page, { titulo: 'Pagar', tipo: 'No se repite', fecha: '2026-07-14' });
	await adelantar(page, '2026-07-15T12:00:00');
	const orden = (t: string[]) => expect(page.getByRole('listitem')).toHaveText(t.map((x) => new RegExp(x)));
	await orden(['Pagar', 'Regar']);
	await esperarEstado(page, 'Pagar', 'atrasada');
	await esperarEstado(page, 'Regar', 'pendiente');
	await editar(page, 'Pagar', { fecha: '2026-07-20' });
	await orden(['Regar', 'Pagar']);
	await esperarEstado(page, 'Regar', 'pendiente');
	await esperarEstado(page, 'Pagar', 'pendiente');
	await editar(page, 'Pagar', { fecha: '2026-07-14' });
	await orden(['Pagar', 'Regar']);
});

test('Flujo 9: borrar una tarea', async ({ page }) => {
	await sesionConReloj(page, LUNES);
	await crear(page, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await completar(page, 'Regar');
	await crear(page, { titulo: 'Pagar la luz', tipo: 'No se repite' });

	await abrir(page, 'Regar');
	await page.getByRole('button', { name: 'Borrar tarea' }).click();
	const confirmacion = page.getByRole('alertdialog');
	await expect(confirmacion).toBeVisible();
	await expect(confirmacion).toContainText('Regar');
	await expect(confirmacion.getByRole('button', { name: 'Borrar', exact: true })).toBeVisible();
	await expect(confirmacion.getByRole('button', { name: 'Cancelar' })).toBeVisible();
	await confirmacion.getByRole('button', { name: 'Cancelar' }).click();
	await expect(confirmacion).toHaveCount(0);
	await expect(page.getByRole('heading', { name: 'Editar tarea' })).toBeVisible();
	await expect(page.getByLabel('Título')).toHaveValue('Regar');
	await cerrar(page);
	await esperarEstado(page, 'Regar', 'en espera');

	await borrar(page, 'Regar');
	await expect(fila(page, 'Regar')).toHaveCount(0);
	await esperarEstado(page, 'Pagar la luz', 'pendiente');
	await page.reload();
	await expect(page.getByRole('listitem')).toHaveCount(1);
	await esperarEstado(page, 'Pagar la luz', 'pendiente');

	await borrar(page, 'Pagar la luz');
	await expect(page.getByRole('listitem')).toHaveCount(0);
	await page.reload();
	await expect(page.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
	await expect(page.getByRole('listitem')).toHaveCount(0);
});

test('Flujo 10: dos dispositivos editan campos distintos', async ({ browser }) => {
	const { a, b, ctxB, cerrar: fin } = await dosDispositivos(browser);
	await crear(a, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await esperarEstado(b, 'Regar', 'pendiente');
	await ctxB.setOffline(true);
	await editar(b, 'Regar', { tipo: 'Días de la semana', dias: ['martes', 'jueves'] });
	await editar(a, 'Regar', { titulo: 'Regar plantas' });
	await llegaAlServidor(a);
	await ctxB.setOffline(false);
	for (const p of [a, b]) await esperarEstado(p, 'Regar plantas', 'en espera', undefined, false);
	await abrir(a, 'Regar plantas');
	await expect(a.getByRole('radio', { name: 'Días de la semana' })).toBeChecked();
	await verificarDias(a, 'Días de la semana', ['martes', 'jueves'], SEMANA);
	await fin();
});

test('Flujo 11: el mismo campo, gana el último en llegar', async ({ browser }) => {
	const { a, b, ctxB, cerrar: fin } = await dosDispositivos(browser);
	await crear(a, { titulo: 'Pagar', tipo: 'No se repite' });
	await esperarEstado(b, 'Pagar', 'pendiente');
	await ctxB.setOffline(true);
	await editar(b, 'Pagar', { titulo: 'Pagar el gas' });
	await editar(a, 'Pagar', { titulo: 'Pagar la luz' });
	await llegaAlServidor(a);
	await ctxB.setOffline(false);
	for (const p of [a, b]) {
		await esperarEstado(p, 'Pagar el gas', 'pendiente');
		await expect(p.getByRole('listitem')).toHaveCount(1);
	}
	await fin();
});

test('Flujo 12: gana el borrado', async ({ browser }) => {
	const { a, b, ctxB, cerrar: fin } = await dosDispositivos(browser);
	await crear(a, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await crear(a, { titulo: 'Barrer', tipo: 'Intervalo', cada: '1', unidad: 'días' });
	await esperarEstado(b, 'Regar', 'pendiente');
	await esperarEstado(b, 'Barrer', 'pendiente');
	await ctxB.setOffline(true);
	await editar(b, 'Regar', { titulo: 'Regar plantas' });
	await completar(b, 'Barrer');
	await esperarEstado(b, 'Barrer', 'en espera');
	await borrar(a, 'Regar');
	await borrar(a, 'Barrer');
	await llegaAlServidor(a);
	await ctxB.setOffline(false);
	for (const p of [a, b]) await expect(p.getByRole('listitem')).toHaveCount(0);
	for (const p of [a, b]) {
		await p.reload();
		await expect(p.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
		await expect(p.getByRole('listitem')).toHaveCount(0);
	}
	await fin();
});

test('Flujo 13: la tarea se borra mientras está abierta en el otro dispositivo', async ({ browser }) => {
	const { a, b, cerrar: fin } = await dosDispositivos(browser);
	await crear(a, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await esperarEstado(b, 'Regar', 'pendiente');
	await abrir(b, 'Regar');
	await borrar(a, 'Regar');
	await expect(b.getByRole('dialog')).toHaveCount(0);
	await expect(fila(b, 'Regar')).toHaveCount(0);
	await fin();
});

test('Flujo 14: cambiar de tipo no deja un valor residual de otro dispositivo', async ({ browser }) => {
	const { a, b, ctxB, cerrar: fin } = await dosDispositivos(browser);
	const DNI = 'Renovar DNI';
	await crear(a, { titulo: DNI, tipo: 'No se repite', fecha: '2026-07-20' });
	await esperarEstado(a, DNI, 'pendiente');
	await esperarEstado(b, DNI, 'pendiente');
	await ctxB.setOffline(true);
	await editar(b, DNI, { fecha: '2026-07-10' });
	await editar(a, DNI, { tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await llegaAlServidor(a);
	await ctxB.setOffline(false);
	for (const p of [a, b]) await esperarEstado(p, DNI, 'pendiente');
	await editar(a, DNI, { tipo: 'No se repite', fecha: '' });
	for (const p of [a, b]) await esperarEstado(p, DNI, 'pendiente');
	await abrir(a, DNI);
	await expect(a.getByRole('radio', { name: 'No se repite' })).toBeChecked();
	await expect(a.getByLabel('Fecha límite')).toHaveValue('');
	await cerrar(a);
	for (const p of [a, b]) {
		await p.reload();
		await esperarEstado(p, DNI, 'pendiente');
	}

	// Espejo
	await crear(a, { titulo: 'Regar', tipo: 'Intervalo', cada: '2', unidad: 'días' });
	await esperarEstado(b, 'Regar', 'pendiente');
	await ctxB.setOffline(true);
	await editar(b, 'Regar', { cada: '6', unidad: 'horas' });
	await editar(a, 'Regar', { tipo: 'No se repite', fecha: '2026-07-20' });
	await llegaAlServidor(a);
	await ctxB.setOffline(false);
	for (const p of [a, b]) await esperarEstado(p, 'Regar', 'pendiente');
	await editar(a, 'Regar', { tipo: 'Días de la semana', dias: ['martes', 'jueves'] });
	for (const p of [a, b]) await esperarEstado(p, 'Regar', 'en espera', undefined, false);
	for (const p of [a, b]) {
		await p.reload();
		await expect(fila(p, 'Regar')).toHaveCount(1);
	}
	await abrir(b, 'Regar');
	await expect(b.getByRole('radio', { name: 'Días de la semana' })).toBeChecked();
	await verificarDias(b, 'Días de la semana', ['martes', 'jueves'], SEMANA);
	await fin();
});
