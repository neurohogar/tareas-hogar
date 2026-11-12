import { expect, test, type Locator, type Page } from '@playwright/test';
import {
	abrir,
	adelantar,
	agregarEtiqueta,
	campoEtiquetas,
	cerrar,
	descartar,
	completar,
	crear,
	dosDispositivos,
	editar,
	esperarEstado,
	fila,
	irA,
	limpiarEmuladores,
	llegaAlServidor,
	sesionConReloj
} from './apoyo';

const HOY = '2026-07-15T08:00:00';
const SIN_ETIQUETAS = 'Todavía no hay etiquetas';
const LARGO_31 = 'Limpieza profunda del baño 1234';
const LARGO_30 = 'Limpieza profunda del baño 123';
const ERR_LARGO = 'El nombre puede tener hasta 30 caracteres';
const ERR_VACIO = 'El nombre no puede estar vacío';
const ERR_REPETIDO = 'Ya existe una etiqueta con ese nombre';

type Chip = [nombre: string, color: string];

test.beforeEach(async () => {
	await limpiarEmuladores();
});


/** Nombre accesible (aria-label) y descripción (title) de cada chip. */
const leerChips = (chips: Locator): Promise<Chip[]> =>
	chips.evaluateAll((els) => els.map((e) => [e.getAttribute('aria-label')!, e.getAttribute('title')!] as [string, string]));

const verChips = (chips: Locator, esperado: Chip[]) => expect.poll(() => leerChips(chips)).toEqual(esperado);

const chipsDeFila = (page: Page, titulo: string) =>
	fila(page, titulo).getByRole('list', { name: 'Etiquetas', exact: true }).getByRole('listitem');

const verFila = (page: Page, titulo: string, esperado: Chip[]) => verChips(chipsDeFila(page, titulo), esperado);

const chipsDelPanel = (page: Page) => page.getByRole('list', { name: 'Etiquetas de la tarea' }).getByRole('listitem');

/** Pantalla Etiquetas: su única lista de listitems son los chips. */
const chipsDeLaPantalla = (page: Page) => page.getByRole('listitem');

const verPantalla = (page: Page, esperado: Chip[]) => verChips(chipsDeLaPantalla(page), esperado);

const grupoFiltro = (page: Page) => page.getByRole('group', { name: 'Filtrar por etiqueta' });

async function verFiltro(page: Page, botones: string[], elegido: string) {
	await expect(grupoFiltro(page).getByRole('button')).toHaveText(botones);
	for (const b of botones)
		await expect(grupoFiltro(page).getByRole('button', { name: b, exact: true })).toHaveAttribute(
			'aria-pressed',
			String(b === elegido)
		);
}

const elegirFiltro = (page: Page, nombre: string) =>
	grupoFiltro(page).getByRole('button', { name: nombre, exact: true }).click();

const titulosEnOrden = (page: Page) =>
	page.getByRole('listitem').getByRole('checkbox').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')!.replace('Completar ', '')));

const verTitulos = (page: Page, esperado: string[]) => expect.poll(() => titulosEnOrden(page)).toEqual(esperado);

/** Las mismas tareas, sin mirar el orden (que el spec fija solo en el Flujo 9). */
const verTareas = (page: Page, esperado: string[]) =>
	expect.poll(async () => (await titulosEnOrden(page)).sort()).toEqual([...esperado].sort());

const entradaEtiqueta = (page: Page, nombre: string) => page.getByRole('listitem', { name: nombre, exact: true });

const dialogo = (page: Page) => page.getByRole('dialog');

async function renombrar(page: Page, actual: string, nuevo: string) {
	await entradaEtiqueta(page, actual).getByRole('button', { name: 'Renombrar' }).click();
	await dialogo(page).getByLabel('Nombre').fill(nuevo);
	await dialogo(page).getByRole('button', { name: 'Guardar' }).click();
	await expect(dialogo(page)).toHaveCount(0);
}

async function cambiarColor(page: Page, nombre: string, color: string) {
	await entradaEtiqueta(page, nombre).getByRole('button', { name: 'Cambiar color' }).click();
	await dialogo(page).getByRole('radio', { name: color, exact: true }).check();
	await dialogo(page).getByRole('button', { name: 'Guardar' }).click();
	await expect(dialogo(page)).toHaveCount(0);
}

async function borrarEtiqueta(page: Page, nombre: string) {
	await entradaEtiqueta(page, nombre).getByRole('button', { name: 'Borrar' }).click();
	await page.getByRole('alertdialog').getByRole('button', { name: 'Borrar', exact: true }).click();
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
}

/** Agrega etiquetas a una tarea desde el panel y guarda. */
async function etiquetar(page: Page, titulo: string, etiquetas: string[]) {
	await editar(page, titulo, { etiquetas });
}

async function quitar(page: Page, titulo: string, etiqueta: string) {
	await abrir(page, titulo);
	await page.getByRole('button', { name: `Quitar «${etiqueta}»` }).click();
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(dialogo(page)).toHaveCount(0);
}

const LUZ = { titulo: 'Pagar la luz', tipo: 'No se repite' } as const;
const PLANTAS = { titulo: 'Regar plantas', tipo: 'Intervalo', cada: '2', unidad: 'días' } as const;

/** Visita Etiquetas y vuelve, para que el dispositivo ya tenga cargadas las dos pantallas antes de quedar sin conexión. */
async function precalentar(page: Page) {
	await irA(page, 'Etiquetas');
	await irA(page, 'Pendientes');
}

const noHayOpcion = (page: Page, nombre: string | RegExp) => expect(page.getByRole('option', { name: nombre })).toHaveCount(0);

test('Flujo 1: navegación y estado sin etiquetas', async ({ page }) => {
	await sesionConReloj(page, HOY);
	const nav = page.getByRole('navigation');
	await expect(nav.getByRole('link')).toHaveText(['Pendientes', 'Historial', 'Etiquetas']);
	await expect(nav.getByRole('link', { name: 'Pendientes' })).toHaveAttribute('aria-current', 'page');
	await expect(nav.getByRole('link', { name: 'Historial' })).not.toHaveAttribute('aria-current', /.*/);
	await expect(nav.getByRole('link', { name: 'Etiquetas' })).not.toHaveAttribute('aria-current', /.*/);

	await crear(page, LUZ);
	await expect(grupoFiltro(page)).toHaveCount(0);
	await expect(fila(page, 'Pagar la luz')).toBeVisible();
	await expect(fila(page, 'Pagar la luz').getByRole('list')).toHaveCount(0);

	await irA(page, 'Etiquetas');
	await expect(page).toHaveURL(/\/etiquetas$/);
	await expect(page.getByText(SIN_ETIQUETAS)).toBeVisible();
	await expect(nav.getByRole('link', { name: 'Etiquetas' })).toHaveAttribute('aria-current', 'page');
	await expect(nav.getByRole('link', { name: 'Pendientes' })).not.toHaveAttribute('aria-current', /.*/);
	await expect(page.getByRole('button')).toHaveCount(0);

	await page.reload();
	await expect(page.getByRole('heading', { name: 'Etiquetas', level: 1 })).toBeVisible();
	await expect(page.getByText(SIN_ETIQUETAS)).toBeVisible();
});

test('Flujo 2: crear etiquetas desde el panel, con colores de la paleta', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await page.getByRole('button', { name: '+' }).click();
	await page.getByLabel('Título').fill('Pagar la luz');
	await page.getByRole('radio', { name: 'No se repite' }).check();
	await campoEtiquetas(page).fill('Facturas');
	await expect(page.getByRole('listbox').getByRole('option')).toHaveText(['Crear «Facturas»']);
	await page.getByRole('option', { name: 'Crear «Facturas»' }).click();
	await verChips(chipsDelPanel(page), [['Facturas', 'gris']]);
	await expect(campoEtiquetas(page)).toHaveValue('');
	await agregarEtiqueta(page, 'Casa');
	await verChips(chipsDelPanel(page), [
		['Facturas', 'gris'],
		['Casa', 'rojo']
	]);
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(dialogo(page)).toHaveCount(0);
	await verFila(page, 'Pagar la luz', [
		['Casa', 'rojo'],
		['Facturas', 'gris']
	]);

	await irA(page, 'Etiquetas');
	await verPantalla(page, [
		['Casa', 'rojo'],
		['Facturas', 'gris']
	]);

	await irA(page, 'Pendientes');
	await crear(page, { ...PLANTAS, etiquetas: ['Patio'] });
	await verFila(page, 'Regar plantas', [['Patio', 'naranja']]);
	await verFiltro(page, ['Todas', 'Casa', 'Facturas', 'Patio'], 'Todas');
});

test('Flujo 3: autocompletado y etiquetas existentes', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await crear(page, { ...LUZ, etiquetas: ['Baño', 'Cocina', 'Ropa sucia'] });

	await page.getByRole('button', { name: '+' }).click();
	await page.getByLabel('Título').fill('Regar plantas');
	await page.getByRole('radio', { name: 'Intervalo' }).check();
	await page.getByRole('spinbutton', { name: 'Cada' }).fill('2');
	await page.getByLabel('Unidad').selectOption({ label: 'días' });
	const opciones = page.getByRole('listbox').getByRole('option');

	await campoEtiquetas(page).fill('ba');
	await expect(opciones).toHaveText(['Baño', 'Crear «ba»']);
	await campoEtiquetas(page).fill('BANO');
	await expect(opciones).toHaveText(['Baño', 'Crear «BANO»']);
	await campoEtiquetas(page).fill('cocina');
	await expect(opciones).toHaveText(['Cocina']);
	await campoEtiquetas(page).press('Enter');
	await verChips(chipsDelPanel(page), [['Cocina', 'rojo']]);

	await campoEtiquetas(page).fill('co');
	await noHayOpcion(page, 'Cocina');
	await campoEtiquetas(page).fill('COCINA');
	await campoEtiquetas(page).press('Enter');
	await verChips(chipsDelPanel(page), [['Cocina', 'rojo']]);

	await campoEtiquetas(page).fill('  Sucia ');
	await expect(page.getByRole('option', { name: 'Ropa sucia' })).toBeVisible();
	await page.getByRole('option', { name: 'Ropa sucia' }).click();
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(dialogo(page)).toHaveCount(0);

	await verFila(page, 'Regar plantas', [
		['Cocina', 'rojo'],
		['Ropa sucia', 'naranja']
	]);
	await irA(page, 'Etiquetas');
	await verPantalla(page, [
		['Baño', 'gris'],
		['Cocina', 'rojo'],
		['Ropa sucia', 'naranja']
	]);
});

test('Flujo 4: validación del nombre en el panel', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await crear(page, LUZ);
	await abrir(page, 'Pagar la luz');

	await campoEtiquetas(page).fill('   ');
	await expect(page.getByRole('listbox').getByRole('option')).toHaveCount(0);
	await campoEtiquetas(page).press('Enter');
	await expect(chipsDelPanel(page)).toHaveCount(0);

	await agregarEtiqueta(page, LARGO_31);
	await expect(page.getByText(ERR_LARGO)).toBeVisible();
	await expect(campoEtiquetas(page)).toHaveAccessibleDescription(ERR_LARGO);
	await expect(chipsDelPanel(page)).toHaveCount(0);

	await campoEtiquetas(page).fill(LARGO_30);
	await campoEtiquetas(page).press('Enter');
	await expect(chipsDelPanel(page)).toHaveCount(1);
	await expect(page.getByText(ERR_LARGO)).toHaveCount(0);

	await campoEtiquetas(page).fill('  Ropa sucia  ');
	await page.getByRole('option', { name: 'Crear «Ropa sucia»' }).click();
	await expect(chipsDelPanel(page).nth(1)).toHaveAttribute('aria-label', 'Ropa sucia');
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(dialogo(page)).toHaveCount(0);

	await irA(page, 'Etiquetas');
	await verPantalla(page, [
		[LARGO_30, 'gris'],
		['Ropa sucia', 'rojo']
	]);
});

test('Flujo 5: las etiquetas se crean solo al guardar', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await crear(page, LUZ);

	await abrir(page, 'Pagar la luz');
	await agregarEtiqueta(page, 'Cocina');
	await descartar(page);
	await expect(fila(page, 'Pagar la luz').getByRole('list')).toHaveCount(0);
	await irA(page, 'Etiquetas');
	await expect(page.getByText(SIN_ETIQUETAS)).toBeVisible();

	await irA(page, 'Pendientes');
	await abrir(page, 'Pagar la luz');
	await agregarEtiqueta(page, 'Cocina');
	await page.getByLabel('Título').fill('');
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByText('Escribí un título.')).toBeVisible();
	await expect(dialogo(page)).toBeVisible();
	await descartar(page);

	await irA(page, 'Etiquetas');
	await expect(page.getByText(SIN_ETIQUETAS)).toBeVisible();
	await irA(page, 'Pendientes');
	await expect(fila(page, 'Pagar la luz').getByRole('list')).toHaveCount(0);
});

test('Flujo 6: quitar etiquetas de una tarea', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await crear(page, { ...LUZ, etiquetas: ['Baño', 'Cocina'] });

	await abrir(page, 'Pagar la luz');
	await verChips(chipsDelPanel(page), [
		['Baño', 'gris'],
		['Cocina', 'rojo']
	]);
	await page.getByRole('button', { name: 'Quitar «Baño»' }).click();
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(dialogo(page)).toHaveCount(0);
	await verFila(page, 'Pagar la luz', [['Cocina', 'rojo']]);

	await quitar(page, 'Pagar la luz', 'Cocina');
	await expect(fila(page, 'Pagar la luz').getByRole('list')).toHaveCount(0);

	await irA(page, 'Etiquetas');
	await verPantalla(page, [
		['Baño', 'gris'],
		['Cocina', 'rojo']
	]);
	await irA(page, 'Pendientes');
	await verFiltro(page, ['Todas', 'Baño', 'Cocina'], 'Todas');
});

test('Flujo 7: color de una etiqueta nueva, el menos usado', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await crear(page, { ...LUZ, etiquetas: ['A', 'B', 'C'] });
	await verFila(page, 'Pagar la luz', [
		['A', 'gris'],
		['B', 'rojo'],
		['C', 'naranja']
	]);

	await irA(page, 'Etiquetas');
	await cambiarColor(page, 'A', 'rojo');
	await irA(page, 'Pendientes');
	await etiquetar(page, 'Pagar la luz', ['D']);
	await verFila(page, 'Pagar la luz', [
		['A', 'rojo'],
		['B', 'rojo'],
		['C', 'naranja'],
		['D', 'gris']
	]);

	await irA(page, 'Etiquetas');
	await borrarEtiqueta(page, 'B');
	await verPantalla(page, [
		['A', 'rojo'],
		['C', 'naranja'],
		['D', 'gris']
	]);
	await irA(page, 'Pendientes');
	await etiquetar(page, 'Pagar la luz', ['E']);
	await verFila(page, 'Pagar la luz', [
		['A', 'rojo'],
		['C', 'naranja'],
		['D', 'gris'],
		['E', 'amarillo']
	]);

	await etiquetar(page, 'Pagar la luz', ['G', 'F']);
	await verFila(page, 'Pagar la luz', [
		['A', 'rojo'],
		['C', 'naranja'],
		['D', 'gris'],
		['E', 'amarillo'],
		['F', 'celeste'],
		['G', 'verde']
	]);
});

test('Flujo 8: orden alfabético de las etiquetas', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await crear(page, { ...LUZ, etiquetas: ['zapatos', 'Ñoquis', 'árbol', 'Nube', 'baño', 'Bano'] });
	const nombres = ['árbol', 'Bano', 'baño', 'Nube', 'Ñoquis', 'zapatos'];
	await expect.poll(async () => (await leerChips(chipsDeFila(page, 'Pagar la luz'))).map(([n]) => n)).toEqual(nombres);
	await verFiltro(page, ['Todas', ...nombres], 'Todas');
	await irA(page, 'Etiquetas');
	await expect.poll(async () => (await leerChips(chipsDeLaPantalla(page))).map(([n]) => n)).toEqual(nombres);
});

test('Flujo 9: filtrar Pendientes por etiqueta', async ({ page }) => {
	await sesionConReloj(page, '2026-07-13T08:00:00');
	await crear(page, { ...LUZ, fecha: '2026-07-14', etiquetas: ['Casa', 'Facturas'] });
	await crear(page, { titulo: 'Basura', tipo: 'Días de la semana', dias: ['martes', 'jueves'], etiquetas: ['Casa'] });
	await crear(page, { titulo: 'Regar plantas', tipo: 'Intervalo', cada: '4', unidad: 'horas', etiquetas: ['Patio'] });

	await adelantar(page, '2026-07-15T07:00:00');
	await completar(page, 'Regar plantas');
	await adelantar(page, '2026-07-15T12:00:00');
	await page.reload();
	await verTitulos(page, ['Pagar la luz', 'Basura', 'Regar plantas']);
	await esperarEstado(page, 'Pagar la luz', 'atrasada');
	await esperarEstado(page, 'Basura', 'atrasada');
	await esperarEstado(page, 'Regar plantas', 'pendiente');

	await elegirFiltro(page, 'Casa');
	await verFiltro(page, ['Todas', 'Casa', 'Facturas', 'Patio'], 'Casa');
	await verTitulos(page, ['Pagar la luz', 'Basura']);

	await elegirFiltro(page, 'Facturas');
	await verFiltro(page, ['Todas', 'Casa', 'Facturas', 'Patio'], 'Facturas');
	await verTitulos(page, ['Pagar la luz']);

	await elegirFiltro(page, 'Patio');
	await verTitulos(page, ['Regar plantas']);
	await completar(page, 'Regar plantas');
	await expect(page.getByText('No hay tareas con esta etiqueta')).toBeVisible();
	await expect(fila(page, 'Regar plantas')).toHaveCount(0);
	await verFiltro(page, ['Todas', 'Casa', 'Facturas', 'Patio'], 'Patio');
	await adelantar(page, '2026-07-15T16:00:00');
	await verTitulos(page, ['Regar plantas']);
	await esperarEstado(page, 'Regar plantas', 'pendiente');

	await elegirFiltro(page, 'Todas');
	await verTitulos(page, ['Pagar la luz', 'Basura', 'Regar plantas']);
});

test('Flujo 10: lista filtrada vacía, permanencia y recarga', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await crear(page, { ...LUZ, etiquetas: ['Facturas'] });
	await crear(page, { ...PLANTAS, etiquetas: ['Patio'] });

	await elegirFiltro(page, 'Facturas');
	await completar(page, 'Pagar la luz');
	await expect(page.getByText('No hay tareas con esta etiqueta')).toBeVisible();
	await verFiltro(page, ['Todas', 'Facturas', 'Patio'], 'Facturas');

	await irA(page, 'Historial');
	await expect(grupoFiltro(page)).toHaveCount(0);
	await expect(page.getByRole('listitem').filter({ hasText: 'Pagar la luz' })).toHaveCount(1);

	await irA(page, 'Etiquetas');
	await irA(page, 'Pendientes');
	await verFiltro(page, ['Todas', 'Facturas', 'Patio'], 'Facturas');
	await expect(page.getByText('No hay tareas con esta etiqueta')).toBeVisible();

	await page.reload();
	await verFiltro(page, ['Todas', 'Facturas', 'Patio'], 'Todas');
	await expect(fila(page, 'Regar plantas')).toBeVisible();
	await expect(page.getByText('No hay tareas con esta etiqueta')).toHaveCount(0);
});

test('Flujo 11: renombrar y cambiar el color', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await crear(page, { ...LUZ, etiquetas: ['Baño', 'Cocina'] });
	await elegirFiltro(page, 'Cocina');

	await irA(page, 'Etiquetas');
	await entradaEtiqueta(page, 'Cocina').getByRole('button', { name: 'Renombrar' }).click();
	await expect(dialogo(page).getByRole('heading', { name: 'Renombrar etiqueta' })).toBeVisible();
	const nombre = dialogo(page).getByLabel('Nombre');
	await expect(nombre).toHaveValue('Cocina');
	for (const [valor, error] of [
		['baño', ERR_REPETIDO],
		['', ERR_VACIO],
		[LARGO_31, ERR_LARGO]
	]) {
		await nombre.fill(valor);
		await dialogo(page).getByRole('button', { name: 'Guardar' }).click();
		await expect(dialogo(page)).toBeVisible();
		await expect(dialogo(page).getByText(error)).toBeVisible();
		await expect(nombre).toHaveAccessibleDescription(error);
	}
	await dialogo(page).getByRole('button', { name: 'Cancelar' }).click();
	await expect(dialogo(page)).toHaveCount(0);
	await verPantalla(page, [
		['Baño', 'gris'],
		['Cocina', 'rojo']
	]);

	await renombrar(page, 'Cocina', '  Comida  ');
	await verPantalla(page, [
		['Baño', 'gris'],
		['Comida', 'rojo']
	]);
	await renombrar(page, 'Comida', 'COMIDA');
	await verPantalla(page, [
		['Baño', 'gris'],
		['COMIDA', 'rojo']
	]);

	await entradaEtiqueta(page, 'COMIDA').getByRole('button', { name: 'Cambiar color' }).click();
	await expect(dialogo(page).getByRole('heading', { name: 'Color de «COMIDA»' })).toBeVisible();
	const radios = dialogo(page).getByRole('radiogroup', { name: 'Color' }).getByRole('radio');
	await expect(radios).toHaveCount(8);
	expect(
		await radios.evaluateAll((els) => els.map((e) => (e as HTMLInputElement).labels![0].textContent!.trim()))
	).toEqual(['gris', 'rojo', 'naranja', 'amarillo', 'verde', 'celeste', 'azul', 'violeta']);
	await expect(radios.nth(1)).toBeChecked();
	await dialogo(page).getByRole('radio', { name: 'violeta' }).check();
	await dialogo(page).getByRole('button', { name: 'Cancelar' }).click();
	await expect(dialogo(page)).toHaveCount(0);
	await verPantalla(page, [
		['Baño', 'gris'],
		['COMIDA', 'rojo']
	]);
	await cambiarColor(page, 'COMIDA', 'violeta');
	await verPantalla(page, [
		['Baño', 'gris'],
		['COMIDA', 'violeta']
	]);

	await irA(page, 'Pendientes');
	await verFila(page, 'Pagar la luz', [
		['Baño', 'gris'],
		['COMIDA', 'violeta']
	]);
	await verFiltro(page, ['Todas', 'Baño', 'COMIDA'], 'COMIDA');
});

test('Flujo 12: borrar una etiqueta', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await crear(page, { ...LUZ, etiquetas: ['Baño', 'Cocina'] });
	await crear(page, { ...PLANTAS, etiquetas: ['Cocina'] });
	await elegirFiltro(page, 'Cocina');
	await verTareas(page, ['Pagar la luz', 'Regar plantas']);

	await irA(page, 'Etiquetas');
	await entradaEtiqueta(page, 'Cocina').getByRole('button', { name: 'Borrar' }).click();
	const confirmacion = page.getByRole('alertdialog');
	await expect(confirmacion).toContainText('¿Borrar la etiqueta «Cocina»?');
	await expect(confirmacion).toContainText('Las tareas no se borran');
	await confirmacion.getByRole('button', { name: 'Cancelar' }).click();
	await expect(confirmacion).toHaveCount(0);
	await verPantalla(page, [
		['Baño', 'gris'],
		['Cocina', 'rojo']
	]);

	await borrarEtiqueta(page, 'Cocina');
	await verPantalla(page, [['Baño', 'gris']]);

	await irA(page, 'Pendientes');
	await verFiltro(page, ['Todas', 'Baño'], 'Todas');
	await verTareas(page, ['Pagar la luz', 'Regar plantas']);
	await verFila(page, 'Pagar la luz', [['Baño', 'gris']]);
	await expect(fila(page, 'Regar plantas').getByRole('list')).toHaveCount(0);

	await irA(page, 'Etiquetas');
	await borrarEtiqueta(page, 'Baño');
	await expect(page.getByText(SIN_ETIQUETAS)).toBeVisible();
	await irA(page, 'Pendientes');
	await expect(grupoFiltro(page)).toHaveCount(0);
	await verTareas(page, ['Pagar la luz', 'Regar plantas']);
});

test('Flujo 13: las etiquetas persisten', async ({ page }) => {
	await sesionConReloj(page, HOY);
	await crear(page, { ...LUZ, etiquetas: ['Baño', 'Cocina'] });
	await llegaAlServidor(page);
	await page.reload();
	await verFila(page, 'Pagar la luz', [
		['Baño', 'gris'],
		['Cocina', 'rojo']
	]);
	await irA(page, 'Etiquetas');
	await verPantalla(page, [
		['Baño', 'gris'],
		['Cocina', 'rojo']
	]);
	await page.reload();
	await verPantalla(page, [
		['Baño', 'gris'],
		['Cocina', 'rojo']
	]);
});

test('Flujo 14: renombrar y recolorear en dos dispositivos', async ({ browser }) => {
	const { a, b, ctxB, cerrar: fin } = await dosDispositivos(browser, HOY);
	await crear(a, { ...LUZ, etiquetas: ['Cocina'] });
	await verFila(b, 'Pagar la luz', [['Cocina', 'gris']]);
	await precalentar(b);
	await ctxB.setOffline(true);
	await irA(a, 'Etiquetas');
	await renombrar(a, 'Cocina', 'Comida');
	await irA(b, 'Etiquetas');
	await cambiarColor(b, 'Cocina', 'violeta');
	await llegaAlServidor(a);
	await ctxB.setOffline(false);
	for (const p of [a, b]) await verPantalla(p, [['Comida', 'violeta']]);
	for (const p of [a, b]) {
		await irA(p, 'Pendientes');
		await verFila(p, 'Pagar la luz', [['Comida', 'violeta']]);
	}
	await fin();
});

test('Flujo 15: el campo etiquetas de una tarea, gana el último en llegar', async ({ browser }) => {
	const { a, b, ctxB, cerrar: fin } = await dosDispositivos(browser, HOY);
	await crear(a, { ...LUZ, etiquetas: ['Cocina'] });
	await crear(a, { ...PLANTAS, etiquetas: ['Baño', 'Patio'] });
	await verFila(b, 'Regar plantas', [
		['Baño', 'rojo'],
		['Patio', 'naranja']
	]);
	await verFila(b, 'Pagar la luz', [['Cocina', 'gris']]);
	await ctxB.setOffline(true);
	await etiquetar(a, 'Pagar la luz', ['Baño']);
	await verFila(a, 'Pagar la luz', [
		['Baño', 'rojo'],
		['Cocina', 'gris']
	]);
	await etiquetar(b, 'Pagar la luz', ['Patio']);
	await verFila(b, 'Pagar la luz', [
		['Cocina', 'gris'],
		['Patio', 'naranja']
	]);
	await llegaAlServidor(a);
	await ctxB.setOffline(false);
	for (const p of [a, b])
		await verFila(p, 'Pagar la luz', [
			['Cocina', 'gris'],
			['Patio', 'naranja']
		]);
	await fin();
});

test('Flujo 16: borrar una etiqueta que otro dispositivo usa sin conexión', async ({ browser }) => {
	const { a, b, ctxB, cerrar: fin } = await dosDispositivos(browser, HOY);
	await crear(a, { ...LUZ, etiquetas: ['Baño', 'Cocina'] });
	await crear(a, PLANTAS);
	await verFila(b, 'Pagar la luz', [
		['Baño', 'gris'],
		['Cocina', 'rojo']
	]);
	await expect(fila(b, 'Regar plantas')).toBeVisible();
	await precalentar(b);
	await ctxB.setOffline(true);
	await elegirFiltro(b, 'Cocina');
	await irA(a, 'Etiquetas');
	await borrarEtiqueta(a, 'Cocina');
	await llegaAlServidor(a);

	// Con Cocina elegido, Regar plantas (sin etiquetas) no se ve: se vuelve a Todas para editarla y se vuelve a elegir Cocina.
	await elegirFiltro(b, 'Todas');
	await etiquetar(b, 'Regar plantas', ['Cocina', 'Baño']);
	await elegirFiltro(b, 'Cocina');
	await irA(b, 'Etiquetas');
	await renombrar(b, 'Cocina', 'Comida');
	await ctxB.setOffline(false);

	for (const p of [a, b]) await verPantalla(p, [['Baño', 'gris']]);
	for (const p of [a, b]) {
		await irA(p, 'Pendientes');
		await verFila(p, 'Regar plantas', [['Baño', 'gris']]);
		await verFila(p, 'Pagar la luz', [['Baño', 'gris']]);
		await verFiltro(p, ['Todas', 'Baño'], 'Todas');
	}
	await fin();
});

/** Espera a que haya exactamente una etiqueta además de `fija` y devuelve cuál sobrevivió (de las `posibles`). */
async function sobreviviente(page: Page, fijas: Chip[], posibles: Chip[]): Promise<Chip> {
	let elegida: Chip | undefined;
	await expect(async () => {
		const chips = await leerChips(chipsDeLaPantalla(page));
		expect(chips).toHaveLength(fijas.length + 1);
		expect(chips).toEqual(expect.arrayContaining(fijas));
		const otra = chips.filter((c) => !fijas.some((f) => f[0] === c[0] && f[1] === c[1]));
		expect(posibles).toContainEqual(otra[0]);
		elegida = otra[0];
	}).toPass();
	return elegida!;
}

test('Flujo 17: dos dispositivos crean la misma etiqueta sin conexión', async ({ browser }) => {
	const { a, b, ctxB, cerrar: fin } = await dosDispositivos(browser, HOY);
	await crear(a, { ...LUZ, etiquetas: ['Baño'] });
	await crear(a, PLANTAS);
	await verFila(b, 'Pagar la luz', [['Baño', 'gris']]);
	await expect(fila(b, 'Regar plantas')).toBeVisible();
	await precalentar(b);
	await ctxB.setOffline(true);

	await etiquetar(a, 'Pagar la luz', ['Cocina']);
	await verFila(a, 'Pagar la luz', [
		['Baño', 'gris'],
		['Cocina', 'rojo']
	]);
	await llegaAlServidor(a);
	await irA(b, 'Etiquetas');
	await cambiarColor(b, 'Baño', 'rojo');
	await irA(b, 'Pendientes');
	await etiquetar(b, 'Regar plantas', ['cocina']);
	await verFila(b, 'Regar plantas', [['cocina', 'gris']]);
	await ctxB.setOffline(false);
	await llegaAlServidor(b);

	const baño: Chip = ['Baño', 'rojo'];
	const posibles: Chip[] = [
		['Cocina', 'rojo'],
		['cocina', 'gris']
	];
	for (const p of [a, b]) await irA(p, 'Etiquetas');
	const ganadora = await sobreviviente(a, [baño], posibles);
	for (const p of [a, b]) {
		await expect.poll(() => leerChips(chipsDeLaPantalla(p))).toEqual([baño, ganadora]);
		await irA(p, 'Pendientes');
		await verFila(p, 'Pagar la luz', [ganadora, baño].sort((x, y) => x[0].localeCompare(y[0], 'es')) as Chip[]);
	}
	await fin();
});

test('Flujo 18: dos dispositivos renombran al mismo nombre sin conexión', async ({ browser }) => {
	const { a, b, ctxB, cerrar: fin } = await dosDispositivos(browser, HOY);
	await crear(a, { ...LUZ, etiquetas: ['Comida'] });
	await crear(a, { ...PLANTAS, etiquetas: ['Patio'] });
	await verFila(b, 'Pagar la luz', [['Comida', 'gris']]);
	await verFila(b, 'Regar plantas', [['Patio', 'rojo']]);
	await precalentar(b);
	await ctxB.setOffline(true);
	await irA(a, 'Etiquetas');
	await renombrar(a, 'Comida', 'Cocina');
	await llegaAlServidor(a);
	await irA(b, 'Etiquetas');
	await renombrar(b, 'Patio', 'cocina');
	await ctxB.setOffline(false);
	await llegaAlServidor(b);

	let ganadora: Chip | undefined;
	await expect(async () => {
		const chips = await leerChips(chipsDeLaPantalla(a));
		expect(chips).toHaveLength(1);
		expect(['Cocina', 'cocina']).toContain(chips[0][0]);
		ganadora = chips[0];
	}).toPass();
	for (const p of [a, b]) {
		await verPantalla(p, [ganadora!]);
		await irA(p, 'Pendientes');
		await verFila(p, 'Pagar la luz', [ganadora!]);
		await verFila(p, 'Regar plantas', [ganadora!]);
	}
	await fin();
});
