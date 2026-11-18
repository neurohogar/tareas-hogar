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

/** Init script: `writeText` rejects with NotAllowedError while the tab's flag asks for it; otherwise it works. */
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

/** Pauses the app clock at a fixed time and lets the data already be on screen. */
const stopIn = (page: Page, hour: string) =>
  page.clock.pauseAt(new Date(hour));

// ---------------------------------------------------------------------------
// Auxiliary emulator read (Firestore REST): the interface does not show the orphans.
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
  if (!uid) throw new Error("the Auth emulator has no user");
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
// Flows 1 to 3: the rejected-copy notice
// ---------------------------------------------------------------------------

/** Regar and an annotation from today 08:05 with the text `quedó lindo`, in Anotaciones with the clipboard rejecting. */
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

  // Step 2 (with the clock stopped to measure step 4).
  await stopIn(page, "2026-07-15T08:30:00");
  await copy(page).click();
  await expect(doNotCopy(page)).toBeVisible();
  await expect(doNotCopy(page)).toHaveText("No se pudo copiar");
  await expect(doNotCopy(page).getByRole("button")).toHaveCount(0);
  await expect(copiedNotice(page)).toHaveCount(0);

  // Step 3.
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

  // Step 4: with the clock stopped, at 4 s it is still there; at 5 s it goes away by itself.
  await page.clock.runFor(4000);
  await expect(doNotCopy(page)).toBeVisible();
  await page.clock.runFor(1000);
  await expect(doNotCopy(page)).toHaveCount(0);
  expect(await clipboard(page)).toBe("previo");
});

test("Flujo 2: volver a tocar Copiar", async ({ page }) => {
  await withAnnotation(page);

  // Steps 1 and 2.
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

  // Step 4: the app does not copy by itself, even if minutes pass.
  await page.clock.runFor(10 * 60_000);
  expect(await clipboard(page)).toBe("previo");
  await expect(doNotCopy(page)).toHaveCount(0);

  // Step 3: reload with the clipboard working.
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
  // With the rejection again, while "Anotaciones copiadas" is shown: only the new text.
  await rejects(page, true);
  await copy(page).click();
  await expect(doNotCopy(page)).toHaveCount(1);
  await expect(copiedNotice(page)).toHaveCount(0);
  // And the other way round: with "No se pudo copiar" visible, a Copiar that works leaves only "Anotaciones copiadas".
  await rejects(page, false);
  await copy(page).click();
  await expect(copiedNotice(page)).toHaveCount(1);
  await expect(doNotCopy(page)).toHaveCount(0);
  await expect(
    page.getByRole("status").filter({ hasText: /copiar|copiadas/ }),
  ).toHaveCount(1);
});

/** Completes Pagar at 08:00 and at 08:00:02 opens Anotaciones with the undo notice in view. */
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
  // The Deshacer button can be tapped: it is what is at its center.
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

  // Step 2.
  await copy(page).click();
  await expect(doNotCopy(page)).toBeVisible();
  await expect(undoNotice(page)).toBeVisible();
  await withoutOverlap(page);

  // Step 3: Deshacer while the text is shown.
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
// Flows 4 to 7: the cleanups are retried
// ---------------------------------------------------------------------------

const TODAY = "2026-07-15T08:00:00";

type Two = Awaited<ReturnType<typeof twoDevices>>;

/** With B loading all the screens (without a service worker it could not open them offline), it ends on Pendientes. */
async function loadScreens(page: Page) {
  for (const screenName of [
    "Historial",
    "Anotaciones",
    "Pendientes",
  ] as const)
    await go(page, screenName);
}

/** No text, counter or pending indicator: only the "Sin conexión" strip and the usual undo notice. */
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
 * B gets its connection back with a delayed network (CDP, 3 s latency); when `llego` says the orphan data
 * is already where B sees it, B goes offline again, before the attempt to clean it finishes.
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
  throw new Error("the condition was not met in time");
}

/** Stays true for `ms` (the emulator state does not change by itself). */
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
 * Leaves an orphan annotation: B (with `queda`, a loose annotation) goes offline, A deletes `Regar` with its
 * annotation `sana` and leaves, and B, which still sees `Regar`, annotates `huérfana` on it. B ends on Anotaciones, offline.
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

/** B's attempt is cut off: the orphan is on the server, B does not see it and cleaned nothing. */
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
    // Steps 2 and 3.
    await cutAttempt(d);
    await expect(d.b.getByText("huérfana")).toHaveCount(0);
    await silence(d.b);

    // Step 4: B gets its connection back and touches nothing.
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
// Flow 5: one failure does not prevent cleaning the others
// ---------------------------------------------------------------------------

const TASKS = ["Regar", "Pagar", "Limpiar"];

const orphanedInServer = async () =>
  (await annotationsTexts()).filter((t) => t?.startsWith("h"));

/** Three tasks deleted by A while B, offline, annotates `h1`, `h2` and `h3` on them (and `queda`, loose). */
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
// Flow 6: no timers
// ---------------------------------------------------------------------------

test("Flujo 6: sin temporizadores, solo al cambiar los datos", async ({
  browser,
}) => {
  test.setTimeout(300_000);
  const d = await withOrphanByClean(browser);
  try {
    await cutAttempt(d);

    // Step 1: B online, but with the server unreachable the attempt when the connection comes back also fails.
    await d.b
      .context()
      .route(/127\.0\.0\.1:8080/, (path) => path.abort("connectionfailed"));
    await d.ctxB.setOffline(false);
    await d.b.waitForTimeout(15_000);
    expect(await orphanInServer()).toBe(true);
    // The server is reachable again; the person changes nothing and 1 simulated hour passes.
    await d.b.context().unroute(/127\.0\.0\.1:8080/);
    await d.b.clock.pauseAt(new Date("2026-07-15T08:30:00"));
    await d.b.clock.runFor(60 * 60_000);
    await d.b.clock.resume();
    await d.b.waitForTimeout(15_000);
    expect(await orphanInServer()).toBe(true);
    await expect(entries(d.b)).toHaveCount(1);
    await silence(d.b);

    // Step 2: the data changes.
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
// Flow 7: data that is no longer used (`etiquetas` and `esfuerzo` fields, `etiquetas` collection)
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

  // Step 1: two tasks, the old fields written through the emulator REST and the old collection.
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

  // Step 2: the app looks the same as without that data.
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

  // Step 3: the panel does not have the fields; saving the title does not touch the old fields.
  await openTask(page, "Regar");
  await expect(page.getByRole("combobox", { name: "Etiquetas" })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Esfuerzo" })).toHaveCount(0);
  await close(page);
  await edit(page, "Regar", { title: "Regar plantas" });
  await waitA(async () => !!(await taskInServer("Regar plantas")));
  let doc = (await taskInServer("Regar plantas"))!;
  expect(labelsViejas(doc.fields)).toEqual(["x"]);
  expect(text(doc.fields, "esfuerzo")).toBe("media");

  // Step 4: changing the recurrence removes its fields and leaves the old ones.
  await edit(page, "Regar plantas", { kind: "No se repite" });
  await waitA(async () => (await taskInServer("Regar plantas"))!.fields.recurrencia === undefined);
  doc = (await taskInServer("Regar plantas"))!;
  expect(doc.fields.recurrencia).toBeUndefined();
  expect(labelsViejas(doc.fields)).toEqual(["x"]);
  expect(text(doc.fields, "esfuerzo")).toBe("media");

  // Step 5: the old collection and the annotations do not change; deleting the task does not touch the old collection.
  expect((await docs("etiquetas")).map((d) => d.fields)).toEqual([casa]);
  expect(await docs("anotaciones")).toEqual(annotationsBefore);
  await remove(page, "Regar plantas");
  await waitA(async () => !(await taskInServer("Regar plantas")));
  expect((await docs("etiquetas")).map((d) => d.fields)).toEqual([casa]);
  await silence(page);
});
