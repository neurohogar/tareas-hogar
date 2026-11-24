import { expect, test, type Browser, type Page } from "@playwright/test";
import {
  openTask,
  turnOnCompleted,
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
  workerUids, goA
} from "./support";

const PROJECT = "demo-tareas-hogar";

test.beforeEach(async () => {
  await cleanEmulators();
});

type ScreenName = "Pendientes" | "Historial";

async function go(page: Page, screenName: ScreenName) {
  await page
    .getByRole("navigation")
    .getByRole("link", { name: screenName, exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: screenName, level: 1 }),
  ).toBeVisible();
}

// ---------------------------------------------------------------------------
// Auxiliary emulator read (Firestore REST): the interface does not show the orphans.
// ---------------------------------------------------------------------------

const ROOT = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
const AUTHORIZED = { Authorization: "Bearer owner" };

async function emulatorUid(): Promise<string> {
  const [uid] = await workerUids();
  if (!uid) throw new Error("this worker has no user in the Auth emulator");
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

// ---------------------------------------------------------------------------
// Flows 1 to 3: the cleanups of orphan completions are retried
// ---------------------------------------------------------------------------

const TODAY = "2026-07-15T08:00:00";

type Two = Awaited<ReturnType<typeof twoDevices>>;

/** With B loading both screens (without a service worker it could not open them offline), it ends on Pendientes. */
async function loadScreens(page: Page) {
  for (const screenName of ["Historial", "Pendientes"] as const)
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
 * B gets its connection back with a delayed network (CDP, 3 s latency); when `arrive` says the orphan data
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

/** The completions in the server whose task is not in the server. */
async function orphansInServer(): Promise<Doc[]> {
  const ids = new Set((await docs("tareas")).map((t) => t.id));
  return (await docs("completados")).filter(
    (c) => !ids.has(text(c.fields, "tareaId") ?? ""),
  );
}
const orphanCount = async () => (await orphansInServer()).length;
const completionsCount = async () => (await docs("completados")).length;
const historyIsEmpty = (page: Page) =>
  expect(page.getByText("Todavía no completaste nada")).toBeVisible();

/**
 * A and B with `titles` (the first one every day, the others one-off); B opens the app and loads the screens.
 * B goes offline and completes the first `completed` of them; A deletes the first `deleted` and leaves.
 * B ends on Historial, offline.
 */
async function withOrphans(
  browser: Browser,
  titles: string[],
  completed: number,
  deleted: number,
): Promise<Two> {
  const d = await twoDevices(browser, TODAY);
  for (const [i, title] of titles.entries()) {
    await createAndView(
      d.a,
      i === 0
        ? { title, kind: "Intervalo", every: "1", unit: "días" }
        : { title, kind: "No se repite" },
    );
    await expect(row(d.b, title)).toBeVisible();
  }
  await loadScreens(d.b);
  await d.ctxB.setOffline(true);
  for (const title of titles.slice(0, completed)) await complete(d.b, title);
  for (const title of titles.slice(0, deleted)) await remove(d.a, title);
  await arrivesOnServer(d.a);
  await d.a.context().close();
  await go(d.b, "Historial");
  await expect(d.b.getByRole("listitem")).toHaveCount(completed);
  return d;
}

/** B's attempt is cut off: the orphan is on the server, B does not show it and cleaned nothing. */
async function cutAttempt(d: Two, remaining = 1) {
  await reconnectAndCut(
    d,
    async () =>
      (await orphanCount()) === remaining &&
      (await d.b.getByRole("listitem").count()) === 0,
  );
  await historyIsEmpty(d.b);
  await staysDuring(6000, async () => (await orphanCount()) === remaining);
}

test("Flow 1: retry of an orphan on reconnect", async ({ browser }) => {
  test.setTimeout(240_000);
  const d = await withOrphans(browser, ["Regar", "Pagar"], 1, 1);
  try {
    // Steps 2 and 3.
    await cutAttempt(d);
    await silence(d.b);

    // Step 4: B gets its connection back and touches nothing.
    await d.ctxB.setOffline(false);
    await waitA(async () => (await orphanCount()) === 0);
    await historyIsEmpty(d.b);
    await silence(d.b);
  } finally {
    await d.b.context().close();
  }
});

test("Flow 1 (step 5): a data change offline does not clean; the connection back does", async ({
  browser,
}) => {
  test.setTimeout(240_000);
  const d = await withOrphans(browser, ["Regar", "Pagar"], 1, 1);
  try {
    await cutAttempt(d);
    await go(d.b, "Pendientes");
    await complete(d.b, "Pagar");
    await staysDuring(6000, async () => (await orphanCount()) === 1);
    await silence(d.b);
    await d.ctxB.setOffline(false);
    await waitA(async () => (await orphanCount()) === 0);
    await waitA(async () => (await completionsCount()) === 1);
    await silence(d.b);
  } finally {
    await d.b.context().close();
  }
});

// ---------------------------------------------------------------------------
// Flow 2: one failure does not stop the others
// ---------------------------------------------------------------------------

for (const remaining of [3, 2]) {
  test(`Flow 2: one failure does not stop the others (the attempt is cut with ${remaining} on the server)`, async ({
    browser,
  }) => {
    test.setTimeout(240_000);
    const d = await withOrphans(browser, ["Regar", "Pagar", "Limpiar"], 3, 3);
    try {
      await cutAttempt(d, remaining);
      await silence(d.b);
      await d.ctxB.setOffline(false);
      await waitA(async () => (await completionsCount()) === 0);
      await historyIsEmpty(d.b);
      await silence(d.b);
    } finally {
      await d.b.context().close();
    }
  });
}

// ---------------------------------------------------------------------------
// Flow 3: no timers
// ---------------------------------------------------------------------------

test("Flow 3: no timers", async ({ browser }) => {
  test.setTimeout(300_000);
  const d = await withOrphans(browser, ["Regar", "Pagar"], 1, 1);
  try {
    await cutAttempt(d);

    // Step 1: B has connection, but with the server unreachable the attempt on reconnect also fails.
    await d.b
      .context()
      .route(/127\.0\.0\.1:8080/, (path) => path.abort("connectionfailed"));
    await d.ctxB.setOffline(false);
    await d.b.waitForTimeout(15_000);
    expect(await orphanCount()).toBe(1);
    // The server is reachable again; the person changes nothing and 1 simulated hour passes.
    await d.b.context().unroute(/127\.0\.0\.1:8080/);
    await d.b.clock.pauseAt(new Date("2026-07-15T08:30:00"));
    await d.b.clock.runFor(60 * 60_000);
    await d.b.clock.resume();
    await d.b.waitForTimeout(15_000);
    expect(await orphanCount()).toBe(1);
    await historyIsEmpty(d.b);
    await silence(d.b);

    // Step 2: the data changes (a second device would clean the orphan itself, so B is the one that changes it).
    await go(d.b, "Pendientes");
    await complete(d.b, "Pagar");
    await waitA(async () => (await orphanCount()) === 0);
    await silence(d.b);
  } finally {
    await d.b.context().close();
  }
});

// ---------------------------------------------------------------------------
// Flow 4: data that is no longer used
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

const oldLabels = (fields: Record<string, any>) =>
  (fields.etiquetas?.arrayValue?.values ?? []).map(
    (v: { stringValue: string }) => v.stringValue,
  );

const byId = (a: Doc, b: Doc) => a.id.localeCompare(b.id);

test("Flow 4: data that is no longer used", async ({ page }) => {
  test.setTimeout(120_000);
  await sessionWithClock(page, TODAY);
  const uid = await emulatorUid();

  // Step 1: two tasks, the old fields, the old collections and two annotations written through the emulator REST.
  await createAndView(page, {
    title: "Regar",
    kind: "Intervalo",
    every: "2",
    unit: "días",
  });
  await createAndView(page, { title: "Pagar", kind: "No se repite" });
  const water = (await taskInServer("Regar"))!;
  await writeInEmulator(
    `users/${uid}/tareas/${water.id}`,
    {
      etiquetas: { arrayValue: { values: [{ stringValue: "x" }] } },
      esfuerzo: { stringValue: "media" },
    },
    ["etiquetas", "esfuerzo"],
  );
  const casa = { nombre: { stringValue: "Casa" }, color: { stringValue: "rojo" } };
  await writeInEmulator(`users/${uid}/etiquetas?documentId=casa`, casa, [], "POST");
  const annotation = {
    texto: { stringValue: "quedó lindo" },
    sentido: { stringValue: "me sirvió" },
    pantalla: { stringValue: "Pendientes" },
  };
  await writeInEmulator(
    `users/${uid}/anotaciones?documentId=con-tarea`,
    { ...annotation, tareaId: { stringValue: water.id } },
    [],
    "POST",
  );
  await writeInEmulator(`users/${uid}/anotaciones?documentId=suelta`, annotation, [], "POST");
  const annotationsBefore = (await docs("anotaciones")).sort(byId);
  expect(annotationsBefore).toHaveLength(2);
  await page.reload();
  await expect(row(page, "Regar")).toBeVisible();

  // Step 2: the app looks the same as without that data.
  await expect(row(page, "Regar").getByRole("listitem")).toHaveCount(0);
  await expect(row(page, "Regar")).not.toContainText(/Rápida|Media|Larga|Sin estimar|quedó lindo/);
  await expect(page.getByRole("group", { name: "Filtrar por etiqueta" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Solo rápidas" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Anotar" })).toHaveCount(0);
  await expect(page.getByRole("navigation").getByRole("link")).toHaveText([
    "Pendientes",
    "Historial",
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
  expect(oldLabels(doc.fields)).toEqual(["x"]);
  expect(text(doc.fields, "esfuerzo")).toBe("media");

  // Step 4: changing the recurrence removes its fields and leaves the old ones.
  await edit(page, "Regar plantas", { kind: "No se repite" });
  await waitA(async () => (await taskInServer("Regar plantas"))!.fields.recurrencia === undefined);
  doc = (await taskInServer("Regar plantas"))!;
  expect(doc.fields.recurrencia).toBeUndefined();
  expect(oldLabels(doc.fields)).toEqual(["x"]);
  expect(text(doc.fields, "esfuerzo")).toBe("media");

  // Step 5: the old collections do not change after the edits.
  expect((await docs("etiquetas")).map((d) => d.fields)).toEqual([casa]);
  expect((await docs("anotaciones")).sort(byId)).toEqual(annotationsBefore);

  // Step 6: complete it and delete it from its panel; the old collections are not touched.
  await turnOnCompleted(page);
  await complete(page, "Regar plantas");
  await waitA(async () => (await completionsCount()) === 1);
  await goA(page, "Historial");
  await remove(page, "Regar plantas");
  await waitA(async () => !(await taskInServer("Regar plantas")));
  await waitA(async () => (await completionsCount()) === 0);
  expect((await docs("etiquetas")).map((d) => d.fields)).toEqual([casa]);
  expect((await docs("anotaciones")).sort(byId)).toEqual(annotationsBefore);
  await silence(page);
});
