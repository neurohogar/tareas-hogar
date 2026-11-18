import {
  expect,
  type Browser,
  type BrowserContext,
  type Page,
  type Locator,
} from "@playwright/test";

const PROJECT = "demo-tareas-hogar";

/** Datos limpios: vacía Auth y Firestore del emulador. */
export async function cleanEmulators(): Promise<void> {
  await fetch(
    `http://127.0.0.1:9099/emulator/v1/projects/${PROJECT}/accounts`,
    { method: "DELETE" },
  );
  await fetch(
    `http://127.0.0.1:8080/emulator/v1/projects/${PROJECT}/databases/(default)/documents`,
    {
      method: "DELETE",
    },
  );
}

/** Flujo 1 pasos 1-4: abre la app sin reloj y entra con qa@example.com. */
export async function enter(page: Page): Promise<void> {
  await page.goto("/");
  await completeEntry(page);
}

/** Flujo 1 pasos 2-4: con la pantalla de entrada a la vista, entra con qa@example.com. */
export async function completeEntry(page: Page): Promise<void> {
  const popup = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Entrar con Google" }).click();
  const emulator = await popup;
  await emulator.waitForLoadState();
  await emulator.getByText("Add new account").click();
  await emulator.getByLabel("Email").fill("qa@example.com");
  await emulator
    .getByRole("button", { name: /Auto-generate/ })
    .click()
    .catch(() => {});
  await emulator.getByRole("button", { name: /Sign in with Google/ }).click();
  await expect(page.getByRole("heading", { name: "Pendientes" })).toBeVisible();
}

/** Instala el reloj simulado después del login (el popup del emulador no tolera el reloj) y recarga. */
export async function setClock(page: Page, hour: string): Promise<void> {
  await page.clock.install({ time: new Date(hour) });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Pendientes" })).toBeVisible();
}

export async function advance(page: Page, hour: string): Promise<void> {
  // fastForward no admite saltos de más de ~24 días: se avanza por tramos de una semana.
  const target = new Date(hour).getTime();
  const WEEK_MS = 7 * 24 * 3600 * 1000;
  for (;;) {
    const now = await page.evaluate(() => Date.now());
    const missing = target - now;
    await page.clock.fastForward(Math.min(missing, WEEK_MS));
    if (missing <= WEEK_MS) return;
  }
}

export async function createTask(
  page: Page,
  title: string,
  every: string,
  unit: "horas" | "días",
): Promise<void> {
  await page.getByRole("button", { name: "+" }).click();
  await page.getByLabel("Título").fill(title);
  await page.getByRole("radio", { name: "Intervalo" }).check();
  await page.getByRole("spinbutton", { name: "Cada" }).fill(every);
  await page.getByLabel("Unidad").selectOption({ label: unit });
  await page.getByRole("button", { name: "Guardar" }).click();
}

export function row(page: Page, title: string): Locator {
  return page.getByRole("listitem").filter({ hasText: title });
}

type Status = "pendiente" | "en espera" | "atrasada";

async function opacity(l: Locator): Promise<number> {
  return Number(await l.evaluate((e) => getComputedStyle(e).opacity));
}

/** Producto de las opacidades computadas del elemento y de sus ancestros. */
export async function opacityEffective(l: Locator): Promise<number> {
  return l.evaluate((e) => {
    let o = 1;
    for (let n: Element | null = e; n; n = n.parentElement)
      o *= Number(getComputedStyle(n).opacity);
    return o;
  });
}

export const rowTitle = (f: Locator) => f.getByRole("button").first();

/**
 * Dimmed row (spec §6: "atenuado"): its title is translucent or drawn in a softer color than the
 * page text. Either way counts, so the test does not pin how the UI dims it.
 */
export async function dimmed(f: Locator): Promise<boolean> {
  return rowTitle(f).evaluate((e) => {
    let o = 1;
    for (let n: Element | null = e; n; n = n.parentElement)
      o *= Number(getComputedStyle(n).opacity);
    return o < 1 || getComputedStyle(e).color !== getComputedStyle(document.body).color;
  });
}

/** Contraste (qa/mostrar-completadas.md): negrita sin tachar, o tachado, peso normal y atenuado. */
async function verifyContrast(f: Locator, completed: boolean) {
  const t = rowTitle(f);
  const weight = Number(await t.evaluate((e) => getComputedStyle(e).fontWeight));
  const line = await t.evaluate((e) => getComputedStyle(e).textDecorationLine);
  if (completed) {
    expect(weight).toBeLessThanOrEqual(400);
    expect(line).toContain("line-through");
    expect(await opacityEffective(t)).toBeLessThan(1);
  } else {
    expect(weight).toBeGreaterThanOrEqual(600);
    expect(line).not.toContain("line-through");
  }
}

/**
 * Estado de la fila. `completada` (por defecto, la de `en espera`: una periódica en espera con
 * completados está completada) fija checkbox marcado y contraste.
 */
export async function waitStatus(
  page: Page,
  title: string,
  status: Status,
  bar?: number,
  completed: boolean = status === "en espera",
  enabled: boolean = true,
): Promise<void> {
  const f = row(page, title);
  const check = f.getByRole("checkbox", { name: new RegExp(title) });
  await expect(check).toBeVisible();
  if (completed) await expect(check).toBeChecked();
  else await expect(check).not.toBeChecked();
  if (enabled) await expect(check).toBeEnabled();
  else await expect(check).toBeDisabled();
  const box = await f.locator("label").first().boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(48);
  expect(box!.height).toBeGreaterThanOrEqual(48);
  await verifyContrast(f, completed);
  const progress = f.getByRole("progressbar");
  const lateness = f.getByText(/^Tocaba /);
  if (status === "en espera") {
    await expect(progress).toHaveCount(1);
    await expect(progress).toHaveAttribute("aria-valuemin", "0");
    await expect(progress).toHaveAttribute("aria-valuemax", "100");
    if (bar !== undefined)
      await expect(progress).toHaveAttribute("aria-valuenow", String(bar));
    await expect(lateness).toHaveCount(0);
    await expect(f.getByText("Atrasada")).toHaveCount(0);
    expect(await dimmed(f)).toBe(true);
  } else {
    await expect(progress).toHaveCount(0);
    expect(await opacity(f)).toBe(1);
    await expect(lateness).toHaveCount(status === "atrasada" ? 1 : 0);
  }
}

export const showCompleted = (page: Page) =>
  page.getByRole("checkbox", { name: "Completadas" });

/** Toca el check Mostrar completadas y verifica que quedó en `encendido`. */
export async function toggleShowCompleted(
  page: Page,
  on: boolean,
): Promise<void> {
  await showCompleted(page).click();
  if (on) await expect(showCompleted(page)).toBeChecked();
  else await expect(showCompleted(page)).not.toBeChecked();
}

/** Enciende Mostrar completadas (apagado por defecto) y verifica que quedó marcado. */
export const turnOnCompleted = (page: Page) =>
  toggleShowCompleted(page, true);

/** La lista (filas de Pendientes) es exactamente `titulos`, de arriba hacia abajo. */
export async function listIs(page: Page, titles: string[]): Promise<void> {
  // Solo las filas de tarea (con checkbox).
  const items = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("checkbox") });
  await expect(items).toHaveCount(titles.length);
  await expect(items).toHaveText(titles.map((t) => new RegExp(t)));
}

/** Retrocede el reloj simulado a `hora` y deja correr un segundo para que la pantalla se refresque sola. */
export async function goBack(page: Page, hour: string): Promise<void> {
  await page.clock.setSystemTime(new Date(hour));
  await page.clock.runFor(1000);
}

/** Como `entrar`, pero para un segundo dispositivo: elige la cuenta que ya existe en el emulador. */
export async function enterAsSecondDevice(page: Page): Promise<void> {
  await page.goto("/");
  const popup = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Entrar con Google" }).click();
  const emulator = await popup;
  await emulator.waitForLoadState();
  await emulator.locator(".js-reuse-account").first().click();
  await expect(page.getByRole("heading", { name: "Pendientes" })).toBeVisible();
}

export const WEEK = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
];

export type Kind =
  "No se repite" | "Intervalo" | "Días de la semana" | "Días del mes";
export interface Definition {
  title?: string;
  kind?: Kind;
  date?: string;
  every?: string;
  unit?: "horas" | "días";
  days?: string[];
  emoji?: string;
  note?: string;
  /** Primer paso: el campo Primer paso del panel (`""` lo vacía). */
  firstStep?: string;
  /** Pasos más: por cada uno, Agregar paso y escribir en el campo Paso N que sigue. */
  steps?: string[];
  /** Versión mínima: el campo Versión mínima del panel (`""` lo vacía). */
  minimalVersion?: string;
  /** Horario: `null` apaga "Solo en un horario"; un objeto lo enciende y escribe Desde/Hasta (`""` vacía el campo). */
  schedule?: { from?: string; to?: string } | null;
  /** Varias ventanas: enciende "Solo en un horario" y, por cada una, usa Agregar horario si hace falta y escribe Desde/Hasta. */
  schedules?: { from: string; to: string }[];
}

/** Campos Desde/Hasta de la fila `i` del panel (la primera conserva los ids field-from/field-to). */
export const fieldFrom = (page: Page, i = 0) =>
  page.getByLabel("Desde", { exact: true }).nth(i);
export const fieldTo = (page: Page, i = 0) =>
  page.getByLabel("Hasta", { exact: true }).nth(i);
export const addSchedule = (page: Page) =>
  page.getByRole("button", { name: "Agregar horario" });
export const removeSchedule = (page: Page) =>
  page.getByRole("button", { name: "Quitar", exact: true });

export async function sessionWithClock(page: Page, hour: string) {
  await enter(page);
  await setClock(page, hour);
}

export async function setDays(page: Page, days: string[]) {
  for (const name of [
    ...WEEK,
    ...Array.from({ length: 31 }, (_, i) => String(i + 1)),
  ]) {
    const button = page.getByRole("button", { name, exact: true });
    if ((await button.count()) === 0) continue;
    const marked = (await button.getAttribute("aria-pressed")) === "true";
    if (marked !== days.includes(name)) await button.click();
  }
}

/** Términos en español con los que se encuentra cada emoji en el buscador del selector. */
const SEARCH: Record<string, string> = {
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
const selectorButton = (page: Page) =>
  page.getByRole("button", { name: /^(Elegir emoji|Cambiar emoji)/ });
export const searchBoxEmoji = (page: Page) =>
  selectorEmoji(page).locator("input.search");
export const selectorEmojis = (page: Page) =>
  selectorEmoji(page).locator(".tabpanel button.emoji");

/** El botón de la grilla cuyo texto es exactamente `emoji` (🔥 no es ❤️‍🔥). */
export const emojiExact = (page: Page, emoji: string) =>
  selectorEmojis(page).filter({ hasText: new RegExp(`^${emoji}$`) });

/** Abre el selector desde el panel y espera a que la librería diferida cargue su grilla. */
export async function openSelector(page: Page) {
  await selectorButton(page).click();
  await expect(selectorEmoji(page)).toBeVisible();
  await expect(selectorEmojis(page).first()).toBeVisible();
}

/** Abre el selector, busca por texto en español y elige el emoji; el selector se cierra. */
export async function chooseEmoji(
  page: Page,
  emoji: string,
  search = SEARCH[emoji],
  tone?: number,
) {
  await openSelector(page);
  if (tone !== undefined) {
    await selectorEmoji(page).locator("#skintone-button").click();
    await selectorEmoji(page)
      .locator("#skintone-list [role=option]")
      .nth(tone)
      .click();
  }
  await searchBoxEmoji(page).fill(search);
  await emojiExact(page, emoji).click();
  await expect(selectorEmoji(page)).toHaveCount(0);
}

/** En el celular el panel tiene pestañas: abre la de la sección; en pantallas anchas no hace nada. */
export async function openTab(page: Page, name: "Tarea" | "Cuándo") {
  const tab = page.getByRole("tab", { name: new RegExp(`^${name}`) });
  if ((await tab.count()) > 0) await tab.click();
}

export async function completePanel(page: Page, d: Definition) {
  await openTab(page, "Tarea");
  if (d.title !== undefined) await page.getByLabel("Título").fill(d.title);
  if (d.emoji !== undefined) await chooseEmoji(page, d.emoji);
  if (d.note !== undefined) await page.getByLabel("Nota").fill(d.note);
  if (d.firstStep !== undefined)
    await page.getByRole("textbox", { name: "Primer paso", exact: true }).fill(d.firstStep);
  for (const text of d.steps ?? []) {
    const n = (await page.getByRole("textbox", { name: /^Paso \d+$/ }).count()) + 2;
    await page.getByRole("button", { name: "Agregar paso", exact: true }).click();
    await page.getByRole("textbox", { name: `Paso ${n}`, exact: true }).fill(text);
  }
  if (d.minimalVersion !== undefined)
    await page.getByRole("textbox", { name: "Versión mínima", exact: true }).fill(d.minimalVersion);
  await openTab(page, "Cuándo");
  if (d.kind) await page.getByRole("radio", { name: d.kind }).check();
  if (d.date !== undefined)
    await page.getByLabel("Fecha límite").fill(d.date);
  if (d.every !== undefined)
    await page.getByRole("spinbutton", { name: "Cada" }).fill(d.every);
  if (d.unit)
    await page.getByLabel("Unidad").selectOption({ label: d.unit });
  if (d.days) await setDays(page, d.days);
  if (d.schedule !== undefined) await completeSchedule(page, d.schedule);
  if (d.schedules) await completeSchedules(page, d.schedules);
}

async function completeSchedules(
  page: Page,
  timeWindows: { from: string; to: string }[],
) {
  await onlyInSchedule(page).check();
  for (const [i, v] of timeWindows.entries()) {
    if ((await page.getByLabel("Desde", { exact: true }).count()) <= i)
      await addSchedule(page).click();
    await fieldFrom(page, i).fill(v.from);
    await fieldTo(page, i).fill(v.to);
  }
}

export const onlyInSchedule = (page: Page) =>
  page.getByRole("checkbox", { name: "Solo en un horario" });

async function completeSchedule(page: Page, h: Definition["schedule"]) {
  const check = onlyInSchedule(page);
  if (h === null) {
    await check.uncheck();
    return;
  }
  await check.check();
  if (h?.from !== undefined) await fieldFrom(page).fill(h.from);
  if (h?.to !== undefined) await fieldTo(page).fill(h.to);
}

export async function create(page: Page, d: Definition & { title: string }) {
  await page.getByRole("button", { name: "+" }).click();
  await expect(
    page.getByRole("heading", { name: "Nueva tarea" }),
  ).toBeVisible();
  await completePanel(page, d);
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

export async function openTask(page: Page, title: string) {
  await row(page, title).getByRole("button", { name: title }).click();
  await expect(
    page.getByRole("heading", { name: "Editar tarea" }),
  ).toBeVisible();
}

export async function edit(page: Page, title: string, d: Definition) {
  await openTask(page, title);
  await completePanel(page, d);
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

export async function close(page: Page) {
  await page.getByRole("button", { name: "Cerrar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

/** Cerrar un panel con cambios: abre el aviso (spec §6.2) y se elige Descartar. */
export async function discard(page: Page) {
  await page.getByRole("button", { name: "Cerrar" }).click();
  await page
    .getByRole("alertdialog", { name: "Tenés cambios sin guardar" })
    .getByRole("button", { name: "Descartar", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
}

export async function remove(page: Page, title: string) {
  await openTask(page, title);
  await page.getByRole("button", { name: "Borrar tarea" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Borrar", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
}

export const complete = (page: Page, title: string) =>
  row(page, title).getByRole("checkbox").click();

export async function verifyDays(
  page: Page,
  group: "Días de la semana" | "Días del mes",
  marked: string[],
  all: string[],
) {
  const g = page.getByRole("group", { name: group });
  for (const d of all)
    await expect(
      g.getByRole("button", { name: d, exact: true }),
    ).toHaveAttribute("aria-pressed", String(marked.includes(d)));
}

/** Deja que lo que A escribió llegue al servidor antes de que B vuelva a tener conexión (la UI no muestra el acuse). */
export const arrivesOnServer = (page: Page) => page.waitForTimeout(2000);

// Dos dispositivos: dos contextos de navegador con la misma cuenta y el mismo reloj.
export async function device(
  browser: Browser,
  hour: string,
  first: boolean,
): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext({
    baseURL: "http://127.0.0.1:4173",
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
  });
  const page = await ctx.newPage();
  if (first) await enter(page);
  else await enterAsSecondDevice(page);
  await setClock(page, hour);
  return { ctx, page };
}

export async function twoDevices(
  browser: Browser,
  hour = "2026-07-13T08:00:00",
) {
  const a = await device(browser, hour, true);
  const b = await device(browser, hour, false);
  return {
    a: a.page,
    b: b.page,
    ctxB: b.ctx,
    close: async () => {
      await a.ctx.close();
      await b.ctx.close();
    },
  };
}

/** Crear y esperar a ver la fila: así la escritura ya llegó a la pantalla antes de detener el reloj. */
export async function createAndView(
  page: Page,
  d: Definition & { title: string },
) {
  await create(page, d);
  await expect(row(page, d.title)).toBeVisible();
}

export type Tab = "Pendientes" | "Historial" | "Anotaciones";

/** Toca una pestaña; el router de SvelteKit necesita que corra el reloj simulado (100 ms). */
export async function goA(page: Page, tab: Tab) {
  await page
    .getByRole("navigation")
    .getByRole("link", { name: tab })
    .click();
  await page.clock.runFor(100);
  await expect(
    page.getByRole("heading", { name: tab, level: 1 }),
  ).toBeVisible();
}

/** Con el reloj detenido (después de crear las tareas): lo para exactamente en `hora`. */
export async function stop(page: Page, hour: string) {
  // Los últimos 200 ms corren detenidos para que lleguen los snapshots y quede exactamente en `hora`.
  await page.clock.pauseAt(new Date(new Date(hour).getTime() - 200));
  await page.clock.runFor(200);
}

/**
 * Con el reloj detenido, deja correr un poco el tiempo simulado mientras la aserción espera
 * (para que lleguen los snapshots, cuyos temporizadores el reloj detenido no dispara).
 */
export async function withClock(
  page: Page,
  assertions: () => Promise<void>,
  ms = 10,
): Promise<void> {
  let end = false;
  const tic = (async () => {
    while (!end) {
      await page.clock.runFor(ms);
      await page.waitForTimeout(50);
    }
  })();
  try {
    await assertions();
  } finally {
    end = true;
    await tic;
  }
}

/** Después de Deshacer (reloj detenido), el borrado tarda unos segundos simulados en volver como snapshot. */
export const settle = (page: Page) => page.clock.runFor(3000);

/** Espera al service worker activo y recarga (con conexión) hasta que la página queda controlada. */
export async function controlled(page: Page) {
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

const EMPTY = "Todavía no completaste nada";

export type Groups = [
  encabezado: string,
  entradas: [titulo: string, hora: string][],
][];

/** Verifica los grupos del Historial, en orden: encabezados de nivel 2 y entradas de cada lista. */
export async function viewHistory(page: Page, groups: Groups) {
  await expect(
    page.getByRole("heading", { name: "Historial", level: 1 }),
  ).toBeVisible();
  if (groups.length === 0) {
    await expect(page.getByText(EMPTY)).toBeVisible();
    await expect(page.getByRole("heading", { level: 2 })).toHaveCount(0);
    await expect(page.getByRole("listitem")).toHaveCount(0);
    return;
  }
  await expect(page.getByText(EMPTY)).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(
    groups.map(([e]) => e),
  );
  await expect(page.getByRole("list")).toHaveCount(groups.length);
  for (const [i, [, entries]] of groups.entries())
    await expect(
      page.getByRole("list").nth(i).getByRole("listitem"),
    ).toHaveText(
      entries.map(([t, h]) => new RegExp(`^${t}\\s*${h}\\s*Borrar$`)),
    );
}
