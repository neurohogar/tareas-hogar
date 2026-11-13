import {
  expect,
  type Browser,
  type BrowserContext,
  type Page,
  type Locator,
} from "@playwright/test";

const PROYECTO = "demo-tareas-hogar";

/** Datos limpios: vacía Auth y Firestore del emulador. */
export async function limpiarEmuladores(): Promise<void> {
  await fetch(
    `http://127.0.0.1:9099/emulator/v1/projects/${PROYECTO}/accounts`,
    { method: "DELETE" },
  );
  await fetch(
    `http://127.0.0.1:8080/emulator/v1/projects/${PROYECTO}/databases/(default)/documents`,
    {
      method: "DELETE",
    },
  );
}

/** Flujo 1 pasos 1-4: abre la app sin reloj y entra con qa@example.com. */
export async function entrar(page: Page): Promise<void> {
  await page.goto("/");
  await completarEntrada(page);
}

/** Flujo 1 pasos 2-4: con la pantalla de entrada a la vista, entra con qa@example.com. */
export async function completarEntrada(page: Page): Promise<void> {
  const popup = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Entrar con Google" }).click();
  const emulador = await popup;
  await emulador.waitForLoadState();
  await emulador.getByText("Add new account").click();
  await emulador.getByLabel("Email").fill("qa@example.com");
  await emulador
    .getByRole("button", { name: /Auto-generate/ })
    .click()
    .catch(() => {});
  await emulador.getByRole("button", { name: /Sign in with Google/ }).click();
  await expect(page.getByRole("heading", { name: "Pendientes" })).toBeVisible();
}

/** Instala el reloj simulado después del login (el popup del emulador no tolera el reloj) y recarga. */
export async function fijarReloj(page: Page, hora: string): Promise<void> {
  await page.clock.install({ time: new Date(hora) });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Pendientes" })).toBeVisible();
}

export async function adelantar(page: Page, hora: string): Promise<void> {
  // fastForward no admite saltos de más de ~24 días: se avanza por tramos de una semana.
  const destino = new Date(hora).getTime();
  const SEMANA_MS = 7 * 24 * 3600 * 1000;
  for (;;) {
    const ahora = await page.evaluate(() => Date.now());
    const falta = destino - ahora;
    await page.clock.fastForward(Math.min(falta, SEMANA_MS));
    if (falta <= SEMANA_MS) return;
  }
}

export async function crearTarea(
  page: Page,
  titulo: string,
  cada: string,
  unidad: "horas" | "días",
): Promise<void> {
  await page.getByRole("button", { name: "+" }).click();
  await page.getByLabel("Título").fill(titulo);
  await page.getByRole("radio", { name: "Intervalo" }).check();
  await page.getByRole("spinbutton", { name: "Cada" }).fill(cada);
  await page.getByLabel("Unidad").selectOption({ label: unidad });
  await page.getByRole("button", { name: "Guardar" }).click();
}

export function fila(page: Page, titulo: string): Locator {
  return page.getByRole("listitem").filter({ hasText: titulo });
}

type Estado = "pendiente" | "en espera" | "atrasada";

async function opacidad(l: Locator): Promise<number> {
  return Number(await l.evaluate((e) => getComputedStyle(e).opacity));
}

/** Producto de las opacidades computadas del elemento y de sus ancestros. */
export async function opacidadEfectiva(l: Locator): Promise<number> {
  return l.evaluate((e) => {
    let o = 1;
    for (let n: Element | null = e; n; n = n.parentElement)
      o *= Number(getComputedStyle(n).opacity);
    return o;
  });
}

export const tituloDeFila = (f: Locator) => f.getByRole("button").first();

/**
 * Dimmed row (spec §6: "atenuado"): its title is translucent or drawn in a softer color than the
 * page text. Either way counts, so the test does not pin how the UI dims it.
 */
export async function atenuada(f: Locator): Promise<boolean> {
  return tituloDeFila(f).evaluate((e) => {
    let o = 1;
    for (let n: Element | null = e; n; n = n.parentElement)
      o *= Number(getComputedStyle(n).opacity);
    return o < 1 || getComputedStyle(e).color !== getComputedStyle(document.body).color;
  });
}

/** Contraste (qa/mostrar-completadas.md): negrita sin tachar, o tachado, peso normal y atenuado. */
async function verificarContraste(f: Locator, completada: boolean) {
  const t = tituloDeFila(f);
  const peso = Number(await t.evaluate((e) => getComputedStyle(e).fontWeight));
  const linea = await t.evaluate((e) => getComputedStyle(e).textDecorationLine);
  if (completada) {
    expect(peso).toBeLessThanOrEqual(400);
    expect(linea).toContain("line-through");
    expect(await opacidadEfectiva(t)).toBeLessThan(1);
  } else {
    expect(peso).toBeGreaterThanOrEqual(600);
    expect(linea).not.toContain("line-through");
  }
}

/**
 * Estado de la fila. `completada` (por defecto, la de `en espera`: una periódica en espera con
 * completados está completada) fija checkbox marcado y contraste.
 */
export async function esperarEstado(
  page: Page,
  titulo: string,
  estado: Estado,
  barra?: number,
  completada: boolean = estado === "en espera",
  habilitado: boolean = true,
): Promise<void> {
  const f = fila(page, titulo);
  const check = f.getByRole("checkbox", { name: new RegExp(titulo) });
  await expect(check).toBeVisible();
  if (completada) await expect(check).toBeChecked();
  else await expect(check).not.toBeChecked();
  if (habilitado) await expect(check).toBeEnabled();
  else await expect(check).toBeDisabled();
  const caja = await f.locator("label").first().boundingBox();
  expect(caja!.width).toBeGreaterThanOrEqual(48);
  expect(caja!.height).toBeGreaterThanOrEqual(48);
  await verificarContraste(f, completada);
  const progreso = f.getByRole("progressbar");
  const atraso = f.getByText(/^Tocaba /);
  if (estado === "en espera") {
    await expect(progreso).toHaveCount(1);
    await expect(progreso).toHaveAttribute("aria-valuemin", "0");
    await expect(progreso).toHaveAttribute("aria-valuemax", "100");
    if (barra !== undefined)
      await expect(progreso).toHaveAttribute("aria-valuenow", String(barra));
    await expect(atraso).toHaveCount(0);
    await expect(f.getByText("Atrasada")).toHaveCount(0);
    expect(await atenuada(f)).toBe(true);
  } else {
    await expect(progreso).toHaveCount(0);
    expect(await opacidad(f)).toBe(1);
    await expect(atraso).toHaveCount(estado === "atrasada" ? 1 : 0);
  }
}

export const mostrarCompletadas = (page: Page) =>
  page.getByRole("checkbox", { name: "Completadas" });

/** Toca el check Mostrar completadas y verifica que quedó en `encendido`. */
export async function conmutarMostrarCompletadas(
  page: Page,
  encendido: boolean,
): Promise<void> {
  await mostrarCompletadas(page).click();
  if (encendido) await expect(mostrarCompletadas(page)).toBeChecked();
  else await expect(mostrarCompletadas(page)).not.toBeChecked();
}

/** Enciende Mostrar completadas (apagado por defecto) y verifica que quedó marcado. */
export const encenderCompletadas = (page: Page) =>
  conmutarMostrarCompletadas(page, true);

/** La lista (filas de Pendientes) es exactamente `titulos`, de arriba hacia abajo. */
export async function listaEs(page: Page, titulos: string[]): Promise<void> {
  // Solo las filas de tarea (con checkbox): los chips de etiqueta también son listitem.
  const items = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("checkbox") });
  await expect(items).toHaveCount(titulos.length);
  await expect(items).toHaveText(titulos.map((t) => new RegExp(t)));
}

/** Retrocede el reloj simulado a `hora` y deja correr un segundo para que la pantalla se refresque sola. */
export async function retroceder(page: Page, hora: string): Promise<void> {
  await page.clock.setSystemTime(new Date(hora));
  await page.clock.runFor(1000);
}

/** Como `entrar`, pero para un segundo dispositivo: elige la cuenta que ya existe en el emulador. */
export async function entrarComoSegundoDispositivo(page: Page): Promise<void> {
  await page.goto("/");
  const popup = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Entrar con Google" }).click();
  const emulador = await popup;
  await emulador.waitForLoadState();
  await emulador.locator(".js-reuse-account").first().click();
  await expect(page.getByRole("heading", { name: "Pendientes" })).toBeVisible();
}

export const SEMANA = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
];

export type Tipo =
  "No se repite" | "Intervalo" | "Días de la semana" | "Días del mes";
export interface Definicion {
  titulo?: string;
  tipo?: Tipo;
  fecha?: string;
  cada?: string;
  unidad?: "horas" | "días";
  dias?: string[];
  emoji?: string;
  nota?: string;
  /** Primer paso: el campo Primer paso del panel (`""` lo vacía). */
  primerPaso?: string;
  /** Esfuerzo: la opción del selector Esfuerzo, por su texto completo. */
  esfuerzo?: "Sin estimar" | "Rápida (≤ 5 min)" | "Media (≈ 15 min)" | "Larga";
  /** Etiquetas por agregar en el campo Etiquetas, en este orden (cada una: escribir y Enter). */
  etiquetas?: string[];
  /** Horario: `null` apaga "Solo en un horario"; un objeto lo enciende y escribe Desde/Hasta (`""` vacía el campo). */
  horario?: { desde?: string; hasta?: string } | null;
  /** Varias ventanas: enciende "Solo en un horario" y, por cada una, usa Agregar horario si hace falta y escribe Desde/Hasta. */
  horarios?: { desde: string; hasta: string }[];
}

/** Campos Desde/Hasta de la fila `i` del panel (la primera conserva los ids campo-desde/campo-hasta). */
export const campoDesde = (page: Page, i = 0) =>
  page.getByLabel("Desde", { exact: true }).nth(i);
export const campoHasta = (page: Page, i = 0) =>
  page.getByLabel("Hasta", { exact: true }).nth(i);
export const agregarHorario = (page: Page) =>
  page.getByRole("button", { name: "Agregar horario" });
export const quitarHorario = (page: Page) =>
  page.getByRole("button", { name: "Quitar", exact: true });

export async function sesionConReloj(page: Page, hora: string) {
  await entrar(page);
  await fijarReloj(page, hora);
}

export async function fijarDias(page: Page, dias: string[]) {
  for (const nombre of [
    ...SEMANA,
    ...Array.from({ length: 31 }, (_, i) => String(i + 1)),
  ]) {
    const boton = page.getByRole("button", { name: nombre, exact: true });
    if ((await boton.count()) === 0) continue;
    const marcado = (await boton.getAttribute("aria-pressed")) === "true";
    if (marcado !== dias.includes(nombre)) await boton.click();
  }
}

export const campoEtiquetas = (page: Page) =>
  page.getByRole("combobox", { name: "Etiquetas" });

/** Agregar una etiqueta en el panel: escribir el nombre y apretar Enter. */
export async function agregarEtiqueta(page: Page, nombre: string) {
  await campoEtiquetas(page).fill(nombre);
  await campoEtiquetas(page).press("Enter");
}

/** Términos en español con los que se encuentra cada emoji en el buscador del selector. */
const BUSQUEDA: Record<string, string> = {
  "🌱": "planta",
  "🔥": "fuego",
  "🧹": "escoba",
  "🌿": "hierba",
  "🐶": "perro",
  "👨‍👩‍👧": "familia",
  "👍🏽": "pulgar",
  "❤️": "corazón rojo",
  "🇦🇷": "argentina",
};

export const selectorEmoji = (page: Page) =>
  page.getByRole("dialog", { name: "Elegir emoji" });
const botonDelSelector = (page: Page) =>
  page.getByRole("button", { name: /^(Elegir emoji|Cambiar emoji)/ });
export const buscadorEmoji = (page: Page) =>
  selectorEmoji(page).locator("input.search");
export const emojisDelSelector = (page: Page) =>
  selectorEmoji(page).locator(".tabpanel button.emoji");

/** El botón de la grilla cuyo texto es exactamente `emoji` (🔥 no es ❤️‍🔥). */
export const emojiExacto = (page: Page, emoji: string) =>
  emojisDelSelector(page).filter({ hasText: new RegExp(`^${emoji}$`) });

/** Abre el selector desde el panel y espera a que la librería diferida cargue su grilla. */
export async function abrirSelector(page: Page) {
  await botonDelSelector(page).click();
  await expect(selectorEmoji(page)).toBeVisible();
  await expect(emojisDelSelector(page).first()).toBeVisible();
}

/** Abre el selector, busca por texto en español y elige el emoji; el selector se cierra. */
export async function elegirEmoji(
  page: Page,
  emoji: string,
  busqueda = BUSQUEDA[emoji],
  tono?: number,
) {
  await abrirSelector(page);
  if (tono !== undefined) {
    await selectorEmoji(page).locator("#skintone-button").click();
    await selectorEmoji(page)
      .locator("#skintone-list [role=option]")
      .nth(tono)
      .click();
  }
  await buscadorEmoji(page).fill(busqueda);
  await emojiExacto(page, emoji).click();
  await expect(selectorEmoji(page)).toHaveCount(0);
}

/** En el celular el panel tiene pestañas: abre la de la sección; en pantallas anchas no hace nada. */
export async function abrirPestana(page: Page, nombre: "Tarea" | "Cuándo") {
  const tab = page.getByRole("tab", { name: new RegExp(`^${nombre}`) });
  if ((await tab.count()) > 0) await tab.click();
}

export async function completarPanel(page: Page, d: Definicion) {
  await abrirPestana(page, "Tarea");
  if (d.titulo !== undefined) await page.getByLabel("Título").fill(d.titulo);
  for (const e of d.etiquetas ?? []) await agregarEtiqueta(page, e);
  if (d.esfuerzo !== undefined)
    await page.getByRole("combobox", { name: "Esfuerzo" }).selectOption({ label: d.esfuerzo });
  if (d.emoji !== undefined) await elegirEmoji(page, d.emoji);
  if (d.nota !== undefined) await page.getByLabel("Nota").fill(d.nota);
  if (d.primerPaso !== undefined)
    await page.getByRole("textbox", { name: "Primer paso", exact: true }).fill(d.primerPaso);
  await abrirPestana(page, "Cuándo");
  if (d.tipo) await page.getByRole("radio", { name: d.tipo }).check();
  if (d.fecha !== undefined)
    await page.getByLabel("Fecha límite").fill(d.fecha);
  if (d.cada !== undefined)
    await page.getByRole("spinbutton", { name: "Cada" }).fill(d.cada);
  if (d.unidad)
    await page.getByLabel("Unidad").selectOption({ label: d.unidad });
  if (d.dias) await fijarDias(page, d.dias);
  if (d.horario !== undefined) await completarHorario(page, d.horario);
  if (d.horarios) await completarHorarios(page, d.horarios);
}

async function completarHorarios(
  page: Page,
  ventanas: { desde: string; hasta: string }[],
) {
  await soloEnUnHorario(page).check();
  for (const [i, v] of ventanas.entries()) {
    if ((await page.getByLabel("Desde", { exact: true }).count()) <= i)
      await agregarHorario(page).click();
    await campoDesde(page, i).fill(v.desde);
    await campoHasta(page, i).fill(v.hasta);
  }
}

export const soloEnUnHorario = (page: Page) =>
  page.getByRole("checkbox", { name: "Solo en un horario" });

async function completarHorario(page: Page, h: Definicion["horario"]) {
  const check = soloEnUnHorario(page);
  if (h === null) {
    await check.uncheck();
    return;
  }
  await check.check();
  if (h?.desde !== undefined) await campoDesde(page).fill(h.desde);
  if (h?.hasta !== undefined) await campoHasta(page).fill(h.hasta);
}

export async function crear(page: Page, d: Definicion & { titulo: string }) {
  await page.getByRole("button", { name: "+" }).click();
  await expect(
    page.getByRole("heading", { name: "Nueva tarea" }),
  ).toBeVisible();
  await completarPanel(page, d);
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

export async function abrir(page: Page, titulo: string) {
  await fila(page, titulo).getByRole("button", { name: titulo }).click();
  await expect(
    page.getByRole("heading", { name: "Editar tarea" }),
  ).toBeVisible();
}

export async function editar(page: Page, titulo: string, d: Definicion) {
  await abrir(page, titulo);
  await completarPanel(page, d);
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

export async function cerrar(page: Page) {
  await page.getByRole("button", { name: "Cerrar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

/** Cerrar un panel con cambios: abre el aviso (spec §6.2) y se elige Descartar. */
export async function descartar(page: Page) {
  await page.getByRole("button", { name: "Cerrar" }).click();
  await page
    .getByRole("alertdialog", { name: "Tenés cambios sin guardar" })
    .getByRole("button", { name: "Descartar", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
}

export async function borrar(page: Page, titulo: string) {
  await abrir(page, titulo);
  await page.getByRole("button", { name: "Borrar tarea" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Borrar", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
}

export const completar = (page: Page, titulo: string) =>
  fila(page, titulo).getByRole("checkbox").click();

export async function verificarDias(
  page: Page,
  grupo: "Días de la semana" | "Días del mes",
  marcados: string[],
  todos: string[],
) {
  const g = page.getByRole("group", { name: grupo });
  for (const d of todos)
    await expect(
      g.getByRole("button", { name: d, exact: true }),
    ).toHaveAttribute("aria-pressed", String(marcados.includes(d)));
}

/** Deja que lo que A escribió llegue al servidor antes de que B vuelva a tener conexión (la UI no muestra el acuse). */
export const llegaAlServidor = (page: Page) => page.waitForTimeout(2000);

// Dos dispositivos: dos contextos de navegador con la misma cuenta y el mismo reloj.
export async function dispositivo(
  browser: Browser,
  hora: string,
  primero: boolean,
): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext({
    baseURL: "http://127.0.0.1:4173",
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
  });
  const page = await ctx.newPage();
  if (primero) await entrar(page);
  else await entrarComoSegundoDispositivo(page);
  await fijarReloj(page, hora);
  return { ctx, page };
}

export async function dosDispositivos(
  browser: Browser,
  hora = "2026-07-13T08:00:00",
) {
  const a = await dispositivo(browser, hora, true);
  const b = await dispositivo(browser, hora, false);
  return {
    a: a.page,
    b: b.page,
    ctxB: b.ctx,
    cerrar: async () => {
      await a.ctx.close();
      await b.ctx.close();
    },
  };
}

/** Crear y esperar a ver la fila: así la escritura ya llegó a la pantalla antes de detener el reloj. */
export async function crearYVer(
  page: Page,
  d: Definicion & { titulo: string },
) {
  await crear(page, d);
  await expect(fila(page, d.titulo)).toBeVisible();
}

export type Pestana = "Pendientes" | "Historial" | "Etiquetas";

/** Toca una pestaña; el router de SvelteKit necesita que corra el reloj simulado (100 ms). */
export async function irA(page: Page, pestana: Pestana) {
  await page
    .getByRole("navigation")
    .getByRole("link", { name: pestana })
    .click();
  await page.clock.runFor(100);
  await expect(
    page.getByRole("heading", { name: pestana, level: 1 }),
  ).toBeVisible();
}

/** Con el reloj detenido (después de crear las tareas): lo para exactamente en `hora`. */
export async function detener(page: Page, hora: string) {
  // Los últimos 200 ms corren detenidos para que lleguen los snapshots y quede exactamente en `hora`.
  await page.clock.pauseAt(new Date(new Date(hora).getTime() - 200));
  await page.clock.runFor(200);
}

/**
 * Con el reloj detenido, deja correr un poco el tiempo simulado mientras la aserción espera
 * (para que lleguen los snapshots, cuyos temporizadores el reloj detenido no dispara).
 */
export async function conReloj(
  page: Page,
  aserciones: () => Promise<void>,
  ms = 10,
): Promise<void> {
  let fin = false;
  const tic = (async () => {
    while (!fin) {
      await page.clock.runFor(ms);
      await page.waitForTimeout(50);
    }
  })();
  try {
    await aserciones();
  } finally {
    fin = true;
    await tic;
  }
}

/** Después de Deshacer (reloj detenido), el borrado tarda unos segundos simulados en volver como snapshot. */
export const asentar = (page: Page) => page.clock.runFor(3000);

/** Espera al service worker activo y recarga (con conexión) hasta que la página queda controlada. */
export async function controlada(page: Page) {
  await page.evaluate(() =>
    navigator.serviceWorker.ready.then(() => undefined),
  );
  await expect(async () => {
    if (!(await page.evaluate(() => !!navigator.serviceWorker.controller)))
      await page.reload();
    expect(
      await page.evaluate(() => !!navigator.serviceWorker.controller),
    ).toBe(true);
  }).toPass({ timeout: 8000 });
}

const VACIO = "Todavía no completaste nada";

export type Grupos = [
  encabezado: string,
  entradas: [titulo: string, hora: string][],
][];

/** Verifica los grupos del Historial, en orden: encabezados de nivel 2 y entradas de cada lista. */
export async function verHistorial(page: Page, grupos: Grupos) {
  await expect(
    page.getByRole("heading", { name: "Historial", level: 1 }),
  ).toBeVisible();
  if (grupos.length === 0) {
    await expect(page.getByText(VACIO)).toBeVisible();
    await expect(page.getByRole("heading", { level: 2 })).toHaveCount(0);
    await expect(page.getByRole("listitem")).toHaveCount(0);
    return;
  }
  await expect(page.getByText(VACIO)).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(
    grupos.map(([e]) => e),
  );
  await expect(page.getByRole("list")).toHaveCount(grupos.length);
  for (const [i, [, entradas]] of grupos.entries())
    await expect(
      page.getByRole("list").nth(i).getByRole("listitem"),
    ).toHaveText(
      entradas.map(([t, h]) => new RegExp(`^${t}\\s*${h}\\s*Borrar$`)),
    );
}
