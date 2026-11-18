import { expect, test, type Browser, type Page } from "@playwright/test";
import {
  openTask,
  remove,
  close,
  complete,
  createAndView,
  twoDevices,
  edit,
  row,
  cleanEmulators,
  arrivesOnServer,
  sessionWithClock,
} from "./support";

const PROJECT = "demo-tareas-hogar";

test.beforeEach(async () => {
  await cleanEmulators();
});

const buttonAnnotate = (page: Page) =>
  page.getByRole("button", { name: "Anotar", exact: true });
const box = (page: Page) =>
  page.getByRole("dialog", { name: "Anotar", exact: true });
const confirmation = (page: Page) =>
  page.getByRole("status").filter({ hasText: "Anotación guardada" });
const copiedNotice = (page: Page) =>
  page.getByRole("status").filter({ hasText: "Anotaciones copiadas" });
const doNotCopy = (page: Page) =>
  page.getByRole("status").filter({ hasText: "No se pudo copiar" });
const undoNotice = (page: Page) =>
  page.getByRole("status").filter({ hasText: "Completaste" });
const copy = (page: Page) => page.getByRole("button", { name: "Copiar" });
const entries = (page: Page) =>
  page
    .getByRole("listitem")
    .filter({ has: page.getByRole("button", { name: "Editar texto" }) });
const clipboard = (page: Page) =>
  page.evaluate(() => navigator.clipboard.readText());

type ScreenName = "Pendientes" | "Historial" | "Anotaciones";

async function go(page: Page, screenName: ScreenName) {
  await page
    .getByRole("navigation")
    .getByRole("link", { name: screenName, exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: screenName, level: 1 }),
  ).toBeVisible();
}

async function annotate(
  page: Page,
  text: string,
  direction: "Me sirvió" | "Me molestó" = "Me sirvió",
) {
  await buttonAnnotate(page).click();
  await expect(box(page)).toBeVisible();
  await box(page).getByRole("textbox", { name: "Texto" }).fill(text);
  await box(page).getByRole("button", { name: direction }).click();
  await expect(box(page)).toHaveCount(0);
  await expect(confirmation(page)).toBeVisible();
}

/** Script de inicio: `writeText` rechaza con NotAllowedError mientras la bandera de la pestaña lo pida; si no, funciona. */
async function clipboardControlled(page: Page) {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    const original = Clipboard.prototype.writeText;
    Clipboard.prototype.writeText = function (text: string) {
      if (sessionStorage.getItem("qa-rechaza") === "1")
        return Promise.reject(new DOMException("rechazado", "NotAllowedError"));
      return original.call(this, text);
    };
  });
}

const rejects = (page: Page, whether: boolean) =>
  page.evaluate((v) => sessionStorage.setItem("qa-rechaza", v ? "1" : "0"), whether);

/** Pausa el reloj de la app en una hora fija y deja que los datos ya estén en pantalla. */
const stopIn = (page: Page, hour: string) =>
  page.clock.pauseAt(new Date(hour));

// ---------------------------------------------------------------------------
// Lectura auxiliar del emulador (REST de Firestore): la interfaz no muestra las huérfanas.
// ---------------------------------------------------------------------------

const ROOT = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
const AUTHORIZED = { Authorization: "Bearer owner" };

async function emulatorUid(): Promise<string> {
  const response = await fetch(
    `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:query`,
    {
      method: "POST",
      headers: { ...AUTHORIZED, "Content-Type": "application/json" },
      body: "{}",
    },
  );
  const body = (await response.json()) as {
    userInfo?: { localId: string }[];
  };
  const uid = body.userInfo?.[0]?.localId;
  if (!uid) throw new Error("el emulador de Auth no tiene ningún usuario");
  return uid;
}

type Doc = { id: string; fields: Record<string, any> };

async function docs(
  collection: "anotaciones" | "completados" | "tareas" | "etiquetas",
): Promise<Doc[]> {
  const uid = await emulatorUid();
  const response = await fetch(
    `${ROOT}/users/${uid}/${collection}?pageSize=300`,
    { headers: AUTHORIZED },
  );
  const body = (await response.json()) as {
    documents?: { name: string; fields: Record<string, any> }[];
  };
  return (body.documents ?? []).map((d) => ({
    id: d.name.split("/").pop()!,
    fields: d.fields,
  }));
}

const text = (fields: Record<string, any>, field: string) =>
  fields[field]?.stringValue as string | undefined;
const annotationsTexts = async () =>
  (await docs("anotaciones")).map((d) => text(d.fields, "texto")).sort();

// ---------------------------------------------------------------------------
// Flujos 1 a 3: el aviso de copia rechazada
// ---------------------------------------------------------------------------

/** Regar y una anotación de hoy 08:05 con el texto `quedó lindo`, en Anotaciones con el portapapeles rechazando. */
async function withAnnotation(page: Page) {
  await clipboardControlled(page);
  await sessionWithClock(page, "2026-07-15T08:04:30");
  await createAndView(page, { title: "Regar", kind: "No se repite" });
  await page.clock.setFixedTime(new Date("2026-07-15T08:05:00"));
  await page.waitForTimeout(1200);
  await openTask(page, "Regar");
  await annotate(page, "quedó lindo");
  await page.getByRole("button", { name: "Cerrar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await go(page, "Anotaciones");
  await expect(entries(page)).toHaveCount(1);
  await expect(confirmation(page)).toHaveCount(0, { timeout: 15_000 });
  await page.evaluate(() => navigator.clipboard.writeText("previo"));
  await rejects(page, true);
}

test("Flujo 1: el portapapeles rechaza la copia", async ({ page }) => {
  await withAnnotation(page);
  const list = await entries(page).allInnerTexts();

  // Paso 2 (con el reloj detenido para medir el paso 4).
  await stopIn(page, "2026-07-15T08:30:00");
  await copy(page).click();
  await expect(doNotCopy(page)).toBeVisible();
  await expect(doNotCopy(page)).toHaveText("No se pudo copiar");
  await expect(doNotCopy(page).getByRole("button")).toHaveCount(0);
  await expect(copiedNotice(page)).toHaveCount(0);

  // Paso 3.
  expect(await entries(page).allInnerTexts()).toEqual(list);
  await expect(
    page.getByRole("heading", { name: "Anotaciones", level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(
    page
      .getByRole("status")
      .filter({ hasNotText: /No se pudo copiar|Sin conexión/ }),
  ).toHaveCount(0);
  expect(await clipboard(page)).toBe("previo");

  // Paso 4: con el reloj detenido, a los 4 s sigue; a los 5 s se va solo.
  await page.clock.runFor(4000);
  await expect(doNotCopy(page)).toBeVisible();
  await page.clock.runFor(1000);
  await expect(doNotCopy(page)).toHaveCount(0);
  expect(await clipboard(page)).toBe("previo");
});

test("Flujo 2: volver a tocar Copiar", async ({ page }) => {
  await withAnnotation(page);

  // Pasos 1 y 2.
  await stopIn(page, "2026-07-15T08:30:00");
  await copy(page).click();
  await expect(doNotCopy(page)).toHaveCount(1);
  await page.clock.runFor(3000);
  await copy(page).click();
  await expect(doNotCopy(page)).toHaveCount(1);
  await page.clock.runFor(4000);
  await expect(doNotCopy(page)).toHaveCount(1);
  await page.clock.runFor(1000);
  await expect(doNotCopy(page)).toHaveCount(0);

  // Paso 4: la app no copia sola, aunque pasen minutos.
  await page.clock.runFor(10 * 60_000);
  expect(await clipboard(page)).toBe("previo");
  await expect(doNotCopy(page)).toHaveCount(0);

  // Paso 3: recargar con el portapapeles funcionando.
  await page.clock.resume();
  await rejects(page, false);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Anotaciones", level: 1 }),
  ).toBeVisible();
  await expect(entries(page)).toHaveCount(1);
  await copy(page).click();
  await expect(copiedNotice(page)).toHaveCount(1);
  expect(await clipboard(page)).toBe(
    "2026-07-15 08:05 · Me sirvió · Panel de edición · Regar · quedó lindo",
  );
  // Con el rechazo de nuevo, mientras se ve "Anotaciones copiadas": solo el nuevo texto.
  await rejects(page, true);
  await copy(page).click();
  await expect(doNotCopy(page)).toHaveCount(1);
  await expect(copiedNotice(page)).toHaveCount(0);
  // Y al revés: con "No se pudo copiar" visible, un Copiar que funciona deja solo "Anotaciones copiadas".
  await rejects(page, false);
  await copy(page).click();
  await expect(copiedNotice(page)).toHaveCount(1);
  await expect(doNotCopy(page)).toHaveCount(0);
  await expect(
    page.getByRole("status").filter({ hasText: /copiar|copiadas/ }),
  ).toHaveCount(1);
});

/** Completa Pagar a las 08:00 y a las 08:00:02 abre Anotaciones con el aviso de deshacer a la vista. */
async function withNoticeOfUndo(page: Page) {
  await clipboardControlled(page);
  await sessionWithClock(page, "2026-07-15T07:59:00");
  await createAndView(page, { title: "Pagar", kind: "No se repite" });
  await annotate(page, "suelta");
  await expect(confirmation(page)).toHaveCount(0, { timeout: 15_000 });
  await page.clock.setFixedTime(new Date("2026-07-15T08:00:00"));
  await page.waitForTimeout(1200);
  await complete(page, "Pagar");
  await expect(undoNotice(page)).toBeVisible();
  await page.clock.setFixedTime(new Date("2026-07-15T08:00:02"));
  await page.waitForTimeout(1200);
  await go(page, "Anotaciones");
  await expect(undoNotice(page)).toBeVisible();
  await rejects(page, true);
}

async function withoutOverlap(page: Page) {
  const notice = await undoNotice(page).boundingBox();
  const text = await doNotCopy(page).boundingBox();
  expect(notice && text).toBeTruthy();
  const separate =
    notice!.y + notice!.height <= text!.y ||
    text!.y + text!.height <= notice!.y ||
    notice!.x + notice!.width <= text!.x ||
    text!.x + text!.width <= notice!.x;
  expect(separate).toBe(true);
  // El botón Deshacer se puede tocar: es lo que está en su centro.
  const button = (await undoNotice(page)
    .getByRole("button", { name: "Deshacer" })
    .boundingBox())!;
  const onTop = await page.evaluate(
    ({ x, y }) => document.elementFromPoint(x, y)?.textContent?.trim(),
    { x: button.x + button.width / 2, y: button.y + button.height / 2 },
  );
  expect(onTop).toBe("Deshacer");
}

test("Flujo 3: no tapa el aviso de deshacer", async ({ page }) => {
  await withNoticeOfUndo(page);

  // Paso 2.
  await copy(page).click();
  await expect(doNotCopy(page)).toBeVisible();
  await expect(undoNotice(page)).toBeVisible();
  await withoutOverlap(page);

  // Paso 3: Deshacer mientras se ve el texto.
  await undoNotice(page).getByRole("button", { name: "Deshacer" }).click();
  await expect(undoNotice(page)).toHaveCount(0);
  await go(page, "Pendientes");
  await expect(row(page, "Pagar").getByRole("checkbox")).not.toBeChecked();
  await go(page, "Historial");
  await expect(page.getByText("Todavía no completaste nada")).toBeVisible();
});

test("Flujo 3 (celular): no tapa el aviso de deshacer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await withNoticeOfUndo(page);
  await copy(page).click();
  await expect(doNotCopy(page)).toBeVisible();
  await expect(undoNotice(page)).toBeVisible();
  await withoutOverlap(page);
  await undoNotice(page).getByRole("button", { name: "Deshacer" }).click();
  await expect(undoNotice(page)).toHaveCount(0);
  await go(page, "Pendientes");
  await expect(row(page, "Pagar").getByRole("checkbox")).not.toBeChecked();
});

// ---------------------------------------------------------------------------
// Flujos 4 a 7: las limpiezas se reintentan
// ---------------------------------------------------------------------------

const TODAY = "2026-07-15T08:00:00";

type Two = Awaited<ReturnType<typeof twoDevices>>;

/** Con B cargando todas las pantallas (sin service worker no podría abrirlas sin conexión), termina en Pendientes. */
async function loadScreens(page: Page) {
  for (const screenName of [
    "Historial",
    "Anotaciones",
    "Pendientes",
  ] as const)
    await go(page, screenName);
}

/** Ningún texto, contador ni indicador de pendientes: solo la franja "Sin conexión" y el aviso de deshacer de siempre. */
async function silence(page: Page) {
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(
    page.getByRole("status").filter({ hasNotText: /Sin conexión|Completaste/ }),
  ).toHaveCount(0);
  await expect(
    page.getByText(/reintent|limpi|pendientes? de|por limpiar|huérfan/i),
  ).toHaveCount(0);
}

/**
 * B vuelve a tener conexión con la red demorada (CDP, latencia de 3 s); cuando `llego` dice que el dato huérfano
 * ya está donde B lo ve, B vuelve a quedarse sin conexión, antes de que termine el intento de limpiarlo.
 */
async function reconnectAndCut(d: Two, arrive: () => Promise<boolean>) {
  await d.ctxB.setOffline(false);
  const cdp = await d.b.context().newCDPSession(d.b);
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 3000,
    downloadThroughput: -1,
    uploadThroughput: -1,
  });
  await waitA(arrive);
  await d.ctxB.setOffline(true);
}

async function waitA(condition: () => Promise<boolean>, ms = 40_000) {
  const limit = Date.now() + ms;
  while (Date.now() < limit) {
    if (await condition().catch(() => false)) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("la condición no se cumplió a tiempo");
}

/** Sigue verdadero durante `ms` (el estado del emulador no cambia solo). */
async function staysDuring(ms: number, condition: () => Promise<boolean>) {
  const limit = Date.now() + ms;
  do {
    expect(await condition()).toBe(true);
    await new Promise((r) => setTimeout(r, 500));
  } while (Date.now() < limit);
}

const orphanInServer = async () =>
  (await annotationsTexts()).includes("huérfana");
const linesCopied = async (page: Page) => {
  await go(page, "Anotaciones");
  await copy(page).click();
  await expect(copiedNotice(page)).toBeVisible();
  return (await clipboard(page)).split("\n");
};

/**
 * Deja una anotación huérfana: B (con `queda`, una anotación suelta) se queda sin conexión, A borra `Regar` con su
 * anotación `sana` y se va, y B, que todavía ve `Regar`, anota `huérfana` sobre ella. B termina en Anotaciones, sin conexión.
 */
async function withOrphanByClean(browser: Browser): Promise<Two> {
  const d = await twoDevices(browser, TODAY);
  await d.ctxB.grantPermissions(["clipboard-read", "clipboard-write"]);
  await createAndView(d.a, { title: "Regar", kind: "No se repite" });
  await expect(row(d.b, "Regar")).toBeVisible();
  await openTask(d.a, "Regar");
  await annotate(d.a, "sana");
  await close(d.a);
  await annotate(d.b, "queda");
  await loadScreens(d.b);
  await go(d.b, "Anotaciones");
  await expect(entries(d.b)).toHaveCount(2);
  await go(d.b, "Pendientes");
  await d.ctxB.setOffline(true);
  await remove(d.a, "Regar");
  await arrivesOnServer(d.a);
  expect(await annotationsTexts()).toEqual(["queda"]);
  await d.a.context().close();
  await openTask(d.b, "Regar");
  await annotate(d.b, "huérfana");
  await close(d.b);
  await go(d.b, "Anotaciones");
  return d;
}

/** El intento de B se corta: la huérfana está en el servidor, B no la ve y no limpió nada. */
async function cutAttempt(d: Two) {
  await reconnectAndCut(
    d,
    async () =>
      (await orphanInServer()) && (await entries(d.b).count()) === 1,
  );
  await expect(entries(d.b)).toHaveCount(1);
  await expect(entries(d.b).first()).toContainText("queda");
  await staysDuring(6000, orphanInServer);
}

test("Flujo 4: una huérfana se limpia al volver la conexión", async ({
  browser,
}) => {
  test.setTimeout(240_000);
  const d = await withOrphanByClean(browser);
  try {
    // Pasos 2 y 3.
    await cutAttempt(d);
    await expect(d.b.getByText("huérfana")).toHaveCount(0);
    await silence(d.b);

    // Paso 4: B vuelve a tener conexión y no toca nada.
    await d.ctxB.setOffline(false);
    await waitA(async () => !(await orphanInServer()));
    expect(await annotationsTexts()).toEqual(["queda"]);
    await expect(entries(d.b)).toHaveCount(1);
    await silence(d.b);
    expect(await linesCopied(d.b)).toHaveLength(1);
  } finally {
    await d.b.context().close();
  }
});

test("Flujo 4 (paso 5): un cambio de datos sin conexión no limpia; al volver la conexión sí", async ({
  browser,
}) => {
  test.setTimeout(240_000);
  const d = await withOrphanByClean(browser);
  try {
    await cutAttempt(d);
    await go(d.b, "Pendientes");
    await annotate(d.b, "Me sirvió");
    await go(d.b, "Anotaciones");
    await expect(entries(d.b)).toHaveCount(2);
    await staysDuring(6000, orphanInServer);
    await silence(d.b);
    await d.ctxB.setOffline(false);
    await waitA(async () => !(await orphanInServer()));
    expect(await annotationsTexts()).toEqual(["Me sirvió", "queda"]);
    await silence(d.b);
  } finally {
    await d.b.context().close();
  }
});

// ---------------------------------------------------------------------------
// Flujo 5: una falla no impide limpiar las demás
// ---------------------------------------------------------------------------

const TASKS = ["Regar", "Pagar", "Limpiar"];

const orphanedInServer = async () =>
  (await annotationsTexts()).filter((t) => t?.startsWith("h"));

/** Tres tareas borradas por A mientras B, sin conexión, anota `h1`, `h2` y `h3` sobre ellas (y `queda`, suelta). */
async function withThreeOrphaned(browser: Browser): Promise<Two> {
  const d = await twoDevices(browser, TODAY);
  for (const title of TASKS) {
    await createAndView(d.a, { title, kind: "No se repite" });
    await expect(row(d.b, title)).toBeVisible();
  }
  await annotate(d.b, "queda");
  await loadScreens(d.b);
  await d.ctxB.setOffline(true);
  for (const title of TASKS) await remove(d.a, title);
  await arrivesOnServer(d.a);
  await d.a.context().close();
  for (const [i, title] of TASKS.entries()) {
    await openTask(d.b, title);
    await annotate(d.b, `h${i + 1}`);
    await close(d.b);
  }
  await go(d.b, "Anotaciones");
  await expect(entries(d.b)).toHaveCount(4);
  return d;
}

for (const remaining of [3, 2]) {
  test(`Flujo 5: tres anotaciones huérfanas, el intento se corta con ${remaining} por limpiar`, async ({
    browser,
  }) => {
    test.setTimeout(240_000);
    const d = await withThreeOrphaned(browser);
    try {
      await reconnectAndCut(
        d,
        async () =>
          (await orphanedInServer()).length === remaining &&
          (await entries(d.b).count()) === 1,
      );
      await expect(entries(d.b)).toHaveCount(1);
      await staysDuring(
        6000,
        async () => (await orphanedInServer()).length === remaining,
      );
      await silence(d.b);
      await d.ctxB.setOffline(false);
      await waitA(async () => (await orphanedInServer()).length === 0);
      expect(await annotationsTexts()).toEqual(["queda"]);
      await silence(d.b);
    } finally {
      await d.b.context().close();
    }
  });
}

test("Flujo 5: un completado huérfano se limpia y el Historial nunca lo muestra", async ({
  browser,
}) => {
  test.setTimeout(240_000);
  const d = await twoDevices(browser, TODAY);
  try {
    await createAndView(d.a, { title: "Regar", kind: "No se repite" });
    await expect(row(d.b, "Regar")).toBeVisible();
    await loadScreens(d.b);
    await d.ctxB.setOffline(true);
    await remove(d.a, "Regar");
    await arrivesOnServer(d.a);
    await d.a.context().close();
    await complete(d.b, "Regar");
    await go(d.b, "Historial");
    await expect(d.b.getByRole("listitem")).toHaveCount(1);
    const completions = async () => (await docs("completados")).length;
    await reconnectAndCut(
      d,
      async () =>
        (await completions()) === 1 &&
        (await d.b.getByRole("listitem").count()) === 0,
    );
    await expect(d.b.getByText("Todavía no completaste nada")).toBeVisible();
    await staysDuring(6000, async () => (await completions()) === 1);
    await silence(d.b);
    await d.ctxB.setOffline(false);
    await waitA(async () => (await completions()) === 0);
    await expect(d.b.getByText("Todavía no completaste nada")).toBeVisible();
    await expect(d.b.getByRole("listitem")).toHaveCount(0);
    await silence(d.b);
  } finally {
    await d.b.context().close();
  }
});

// ---------------------------------------------------------------------------
// Flujo 6: sin temporizadores
// ---------------------------------------------------------------------------

test("Flujo 6: sin temporizadores, solo al cambiar los datos", async ({
  browser,
}) => {
  test.setTimeout(300_000);
  const d = await withOrphanByClean(browser);
  try {
    await cutAttempt(d);

    // Paso 1: B con conexión, pero con el servidor inalcanzable el intento de la vuelta de la conexión también falla.
    await d.b
      .context()
      .route(/127\.0\.0\.1:8080/, (path) => path.abort("connectionfailed"));
    await d.ctxB.setOffline(false);
    await d.b.waitForTimeout(15_000);
    expect(await orphanInServer()).toBe(true);
    // El servidor vuelve a estar a mano; la persona no cambia nada y pasa 1 hora simulada.
    await d.b.context().unroute(/127\.0\.0\.1:8080/);
    await d.b.clock.pauseAt(new Date("2026-07-15T08:30:00"));
    await d.b.clock.runFor(60 * 60_000);
    await d.b.clock.resume();
    await d.b.waitForTimeout(15_000);
    expect(await orphanInServer()).toBe(true);
    await expect(entries(d.b)).toHaveCount(1);
    await silence(d.b);

    // Paso 2: cambian los datos.
    await go(d.b, "Pendientes");
    await annotate(d.b, "cambio");
    await waitA(async () => !(await orphanInServer()));
    expect(await annotationsTexts()).toEqual(["cambio", "queda"]);
    await silence(d.b);
  } finally {
    await d.b.context().close();
  }
});

// ---------------------------------------------------------------------------
// Flujo 7: datos que ya no se usan (campos `etiquetas` y `esfuerzo`, colección `etiquetas`)
// ---------------------------------------------------------------------------

async function writeInEmulator(
  path: string,
  fields: Record<string, unknown>,
  mascara: string[] = [],
  method: "PATCH" | "POST" = "PATCH",
) {
  const query = mascara.map((m) => `updateMask.fieldPaths=${m}`).join("&");
  const url = `${ROOT}/${path}${path.includes("?") ? "&" : "?"}${query}`;
  const response = await fetch(url, {
    method,
    headers: { ...AUTHORIZED, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!response.ok) throw new Error(`REST ${method} ${path}: ${response.status}`);
}

const taskInServer = async (title: string) =>
  (await docs("tareas")).find((t) => text(t.fields, "titulo") === title);

const labelsViejas = (fields: Record<string, any>) =>
  (fields.etiquetas?.arrayValue?.values ?? []).map(
    (v: { stringValue: string }) => v.stringValue,
  );

test("Flujo 7: los campos viejos etiquetas y esfuerzo quedan intactos al editar", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await sessionWithClock(page, TODAY);
  const uid = await emulatorUid();

  // Paso 1: dos tareas, los campos viejos escritos por el REST del emulador y la colección vieja.
  await createAndView(page, {
    title: "Regar",
    kind: "Intervalo",
    every: "2",
    unit: "días",
  });
  await createAndView(page, { title: "Pagar", kind: "No se repite" });
  await annotate(page, "queda");
  const annotationsBefore = await docs("anotaciones");
  const water = await taskInServer("Regar");
  await writeInEmulator(
    `users/${uid}/tareas/${water!.id}`,
    {
      etiquetas: { arrayValue: { values: [{ stringValue: "x" }] } },
      esfuerzo: { stringValue: "media" },
    },
    ["etiquetas", "esfuerzo"],
  );
  const casa = { nombre: { stringValue: "Casa" }, color: { stringValue: "rojo" } };
  await writeInEmulator(`users/${uid}/etiquetas?documentId=casa`, casa, [], "POST");
  await waitA(async () => labelsViejas((await taskInServer("Regar"))!.fields).length === 1);
  await page.reload();
  await expect(row(page, "Regar")).toBeVisible();

  // Paso 2: la app se ve igual que sin esos datos.
  await expect(row(page, "Regar").getByRole("listitem")).toHaveCount(0);
  await expect(row(page, "Regar")).not.toContainText(/Rápida|Media|Larga|Sin estimar/);
  await expect(page.getByRole("group", { name: "Filtrar por etiqueta" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Solo rápidas" })).toHaveCount(0);
  await expect(page.getByRole("navigation").getByRole("link")).toHaveText([
    "Pendientes",
    "Historial",
    "Anotaciones",
  ]);
  await silence(page);

  // Paso 3: el panel no tiene los campos; guardar el título no toca los campos viejos.
  await openTask(page, "Regar");
  await expect(page.getByRole("combobox", { name: "Etiquetas" })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Esfuerzo" })).toHaveCount(0);
  await close(page);
  await edit(page, "Regar", { title: "Regar plantas" });
  await waitA(async () => !!(await taskInServer("Regar plantas")));
  let doc = (await taskInServer("Regar plantas"))!;
  expect(labelsViejas(doc.fields)).toEqual(["x"]);
  expect(text(doc.fields, "esfuerzo")).toBe("media");

  // Paso 4: cambiar la recurrencia quita sus campos y deja los viejos.
  await edit(page, "Regar plantas", { kind: "No se repite" });
  await waitA(async () => (await taskInServer("Regar plantas"))!.fields.recurrencia === undefined);
  doc = (await taskInServer("Regar plantas"))!;
  expect(doc.fields.recurrencia).toBeUndefined();
  expect(labelsViejas(doc.fields)).toEqual(["x"]);
  expect(text(doc.fields, "esfuerzo")).toBe("media");

  // Paso 5: la colección vieja y las anotaciones no cambian; borrar la tarea no toca la colección vieja.
  expect((await docs("etiquetas")).map((d) => d.fields)).toEqual([casa]);
  expect(await docs("anotaciones")).toEqual(annotationsBefore);
  await remove(page, "Regar plantas");
  await waitA(async () => !(await taskInServer("Regar plantas")));
  expect((await docs("etiquetas")).map((d) => d.fields)).toEqual([casa]);
  await silence(page);
});
