import {
  expect,
  test,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  closeMenu,
  openMenu,
  openTab,
  openTask,
  openSelector,
  close,
  complete,
  withClock,
  create,
  createAndView,
  stop,
  twoDevices,
  row,
  goA,
  cleanEmulators,
  arrivesOnServer,
  searchBoxEmoji,
  emojiExact,
  selectorEmojis,
  selectorEmoji,
  sessionWithClock,
} from "./support";
import {
  ATKINSON_FILES,
  docs,
  networkFailure,
  saveDoc,
  NOTO_FILE,
  forgetFonts,
  screenName,
  reloadStopped,
  retain,
  withoutNotices,
  textVisible,
  accountUid,
} from "./screen-support";
import {
  ATKINSON,
  withAtkinson,
  withNoto,
  isNoto,
  isOther,
  glyphs,
  platform,
  distribution,
  distributionIs,
} from "./font-support";

const HOUR = "2026-07-15T08:00:00";
const HAS_NO_NOTO = "\u{1FAFF}";

test.beforeEach(async () => {
  await cleanEmulators();
});

// ---------------------------------------------------------------------------
// Network requests
// ---------------------------------------------------------------------------

const ORIGIN = "http://127.0.0.1:4173";

/** Records every request to an origin that is neither the app nor Firebase Auth / Firestore (emulators or Firebase services). */
function requestsExternal(page: Page): string[] {
  const external: string[] = [];
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (["data:", "blob:", "about:"].includes(u.protocol)) return;
    if (["127.0.0.1", "localhost", "apis.google.com"].includes(u.hostname))
      return; // apis.google.com: the Firebase Auth SDK
    if (/(^|\.)(googleapis|firebaseio|firebaseapp)\.com$/.test(u.hostname))
      return;
    external.push(r.url());
  });
  return external;
}

const blockFont = (ctx: BrowserContext | Page) =>
  ctx.route(ATKINSON_FILES, (r) => r.abort());
const blockEmoji = (ctx: BrowserContext | Page) =>
  ctx.route(NOTO_FILE, (r) => r.abort());

// ---------------------------------------------------------------------------
// Flow 1
// ---------------------------------------------------------------------------

const combinations = [
  {
    name: "Celular claro",
    width: 360,
    height: 640,
    theme: "light",
    touch: true,
  },
  {
    name: "Celular oscuro",
    width: 360,
    height: 640,
    theme: "dark",
    touch: true,
  },
  {
    name: "Ancho claro",
    width: 1024,
    height: 768,
    theme: "light",
    touch: false,
  },
  {
    name: "Ancho oscuro",
    width: 1024,
    height: 768,
    theme: "dark",
    touch: false,
  },
] as const;

for (const c of combinations) {
  test(`Flow 1: toda la app con la fuente (${c.name})`, async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      baseURL: ORIGIN,
      locale: "es-AR",
      timezoneId: "America/Argentina/Buenos_Aires",
      viewport: { width: c.width, height: c.height },
      hasTouch: c.touch,
      isMobile: c.touch,
      colorScheme: c.theme,
    });
    const page = await ctx.newPage();

    // Step 8: the app has no control to sign out; the login screen is seen before signing in.
    await page.goto("/");
    const enter = page.getByRole("button", { name: "Entrar con Google" });
    await expect(enter).toBeVisible();
    await withAtkinson(page, enter);
    await withAtkinson(
      page,
      page.getByRole("heading", { name: "Tareas Hogar" }),
    );

    await sessionWithClock(page, HOUR);

    // Step 1.
    await createAndView(page, {
      title: "Regar",
      kind: "Intervalo",
      every: "2",
      unit: "días",
      emoji: "🌱",
      note: "Año 2026 ✈",
    });

    // Step 2: Pendientes (Pending).
    const f = row(page, "Regar");
    await distributionIs(
      page,
      f.getByRole("button", { name: /Regar$/ }),
      ([a, n, o]) => a >= 5 && n === 1 && o === 0,
    );
    // The Menú button is an icon without text: the font is seen on the items of its menu.
    await openMenu(page);
    for (const name of ["Historial", "Modo mínimo", "Completadas"])
      await withAtkinson(page, page.getByRole("menu").getByText(name, { exact: true }));
    await closeMenu(page);
    await withAtkinson(
      page,
      page.getByRole("heading", { name: "Pendientes", level: 1 }),
    );

    // Step 3: Historial (History).
    await goA(page, "Historial");
    await withAtkinson(
      page,
      page.getByRole("heading", { name: "Historial", level: 1 }),
    );
    // Volver is an arrow icon without text: it is there, to the left of the title.
    await expect(page.getByRole("button", { name: "Volver", exact: true })).toBeVisible();
    await goA(page, "Pendientes");

    // Step 4: the panel.
    await openTask(page, "Regar");
    const dialog = page.getByRole("dialog");
    await withAtkinson(
      page,
      dialog.getByRole("heading", { name: "Editar tarea" }),
    );
    await withAtkinson(page, page.getByLabel("Título"));
    await withAtkinson(page, dialog.getByRole("button", { name: "Guardar" }));
    const actions = dialog.getByRole("tab", { name: /^Acciones/ });
    if ((await actions.count()) > 0) await actions.click();
    await withAtkinson(
      page,
      dialog.getByRole("button", { name: "Borrar tarea" }),
    );
    await withAtkinson(
      page,
      dialog.getByRole("button", { name: /^(Pausar|Posponer)/ }).first(),
    );
    for (const tabName of ["Tarea", "Cuándo", "Acciones"]) {
      const tab = dialog.getByRole("tab", { name: new RegExp(`^${tabName}`) });
      if ((await tab.count()) > 0) await withAtkinson(page, tab);
    }
    const tabTask = dialog.getByRole("tab", { name: /^Tarea/ });
    if ((await tabTask.count()) > 0) await tabTask.click();
    const note = page.getByLabel("Nota");
    await expect(note).toHaveValue("Año 2026 ✈");
    await distributionIs(page, note, ([a, n, o]) => a >= 8 && n === 1 && o === 0);
    await distributionIs(
      page,
      page.getByRole("button", { name: /^Cambiar emoji/ }),
      ([a, n, o]) => a === 0 && n === 1 && o === 0,
    );

    // Step 5: the emoji picker.
    await openSelector(page);
    const sel = selectorEmoji(page);
    // Recents and the next category, emoji by emoji; Flow 6 walks every category.
    for (const i of [0, 1]) {
      await sel.getByRole("tab").nth(i).click();
      await expect(sel.getByRole("tab").nth(i)).toHaveAttribute("aria-selected", "true");
      const emojis = selectorEmojis(page);
      await expect(emojis.first()).toBeVisible();
      const howMany = await emojis.count();
      for (let e = 0; e < howMany; e++) await withNoto(page, emojis.nth(e));
    }
    await withAtkinson(page, sel.locator("input.search"));
    await withAtkinson(page, sel.getByRole("button", { name: "Cerrar" }));
    await withAtkinson(page, sel.getByRole("heading").first());
    await sel.getByRole("button", { name: "Cerrar" }).click();
    await expect(sel).toHaveCount(0);

    // Step 7: the unsaved changes notice.
    await page.getByLabel("Título").fill("Regar mucho");
    await page.getByRole("button", { name: "Cerrar" }).click();
    const notice = page.getByRole("alertdialog", {
      name: "Tenés cambios sin guardar",
    });
    await expect(notice).toBeVisible();
    await withAtkinson(page, notice);
    await withAtkinson(
      page,
      notice.getByRole("button", { name: "Descartar", exact: true }),
    );
    await notice.getByRole("button", { name: "Descartar", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Step 6: the undo notice.
    await complete(page, "Regar");
    const undo = page.getByRole("status");
    await expect(undo).toContainText("Completaste «🌱 Regar»");
    // The notice text lives in its own node (next to the «Vuelve …» line).
    await distributionIs(
      page,
      undo.getByText("Completaste «🌱 Regar»"),
      ([a, n, o]) => a > 10 && n === 1 && o === 0,
    );
    await withAtkinson(page, undo.getByRole("button", { name: "Deshacer" }));

    await ctx.close();
  });
}

// ---------------------------------------------------------------------------
// Flow 2
// ---------------------------------------------------------------------------

test("Flow 2: qué fuente dibuja cada carácter", async ({ page }) => {
  await sessionWithClock(page, HOUR);
  await createAndView(page, {
    title: "Ñandú: camión ❤ 日本語 🌱",
    kind: "Intervalo",
    every: "2",
    unit: "días",
    note: "☀ ☎ © ™ #",
  });

  const title = row(page, "Ñandú").getByRole("button").first();
  // Atkinson: «Ñandú: camión» (12 letters and signs); Noto: ❤ and 🌱; system: 日本語.
  await distributionIs(page, title, ([a, n, o]) => a >= 12 && n === 2 && o >= 1);
  const [, , other] = await distribution(page, title);
  expect(other).toBeGreaterThanOrEqual(1);
  const fs = await platform(page, title);
  expect(fs.filter(isOther).every((x) => x.familyName !== ATKINSON)).toBe(true);

  await openTask(page, "Ñandú");
  const field = page.getByLabel("Título");
  await distributionIs(page, field, ([a, n, o]) => a >= 12 && n === 2 && o >= 1);
  const note = page.getByLabel("Nota");
  // ☀ ☎ with Noto; © ™ # with Atkinson.
  await distributionIs(page, note, ([a, n, o]) => n === 2 && a >= 3 && o === 0);

  // Step 4: emoji with ZWJ, with skin tone and flag, each one a single drawing.
  for (const e of ["👨‍👩‍👧", "👍🏽", "🇦🇷"]) {
    await field.fill(e);
    await distributionIs(page, field, ([a, n, o]) => a === 0 && n === 1 && o === 0);
  }
  await page.getByRole("button", { name: "Cerrar" }).click();
  await page
    .getByRole("alertdialog", { name: "Tenés cambios sin guardar" })
    .getByRole("button", { name: "Descartar", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// Flow 3
// ---------------------------------------------------------------------------

interface Measure {
  box: [number, number];
  size: string;
  weight: string;
}

async function measure(page: Page, l: Locator): Promise<Measure> {
  const box = await l.first().boundingBox();
  const est = await l
    .first()
    .evaluate((e) => [
      getComputedStyle(e).fontSize,
      getComputedStyle(e).fontWeight,
    ]);
  return { box: [box!.width, box!.height], size: est[0], weight: est[1] };
}

/** What step 2 compares: size, weight and highlight, with the panel open to see the note. */
async function hierarchy(page: Page) {
  const style = (l: Locator) =>
    l.first().evaluate((e) => {
      const c = getComputedStyle(e);
      return {
        size: parseFloat(c.fontSize),
        weight: parseFloat(c.fontWeight),
        color: c.color,
        mark: c.borderBottomColor,
      };
    });
  const titleRow = await style(row(page, "Regar").getByRole("button").first());
  // The panel tabs (phone layout): the chosen one is highlighted.
  const initial = page.viewportSize()!;
  await page.setViewportSize({ width: 360, height: 640 });
  await openTask(page, "Regar");
  const panel = page.getByRole("dialog");
  const chosen = await style(panel.getByRole("tab", { name: /^Tarea/ }));
  const other = await style(panel.getByRole("tab", { name: /^Cuándo/ }));
  await expect(panel.getByRole("tab", { name: /^Tarea/ })).toHaveAttribute("aria-selected", "true");
  await expect(panel.getByRole("tab", { name: /^Cuándo/ })).toHaveAttribute("aria-selected", "false");
  await openTab(page, "Tarea");
  const note = await style(page.getByLabel("Nota"));
  const heading = await style(
    page.getByRole("dialog").getByRole("heading", { name: "Editar tarea" }),
  );
  await close(page);
  await page.setViewportSize(initial);
  return { titleRow, note, heading, chosen, other };
}

/** Step 2: when creating and editing, in Celular and Ancho, the Título field is 20px and the Nota 16px. */
async function panelMeasures(page: Page) {
  const size = (l: Locator) =>
    l.evaluate((e) => getComputedStyle(e).fontSize);
  const initial = page.viewportSize()!;
  for (const [width, height] of [
    [360, 640],
    [1024, 768],
  ]) {
    await page.setViewportSize({ width, height });
    await page.getByRole("button", { name: "+" }).click();
    expect(await size(page.getByLabel("Título"))).toBe("20px");
    expect(await size(page.getByLabel("Nota"))).toBe("16px");
    await close(page);
    await openTask(page, "Regar");
    expect(await size(page.getByLabel("Título"))).toBe("20px");
    expect(await size(page.getByLabel("Nota"))).toBe("16px");
    await close(page);
  }
  await page.setViewportSize(initial);
}

function hierarchyKeeps(j: Awaited<ReturnType<typeof hierarchy>>) {
  // The row title is told apart from the note by weight (the size is the same).
  expect(j.titleRow.size).toBe(j.note.size);
  expect(j.titleRow.weight).toBeGreaterThan(j.note.weight);
  expect(j.heading.size).toBeGreaterThan(j.note.size);
  // The selected tab is highlighted with weight, color and a mark the others do not have.
  expect(j.chosen.weight).toBeGreaterThan(j.other.weight);
  expect(j.chosen.color).not.toBe(j.other.color);
  expect(j.chosen.mark).not.toBe(j.other.mark);
  expect(j.other.mark).toBe("rgba(0, 0, 0, 0)");
}

test("Flow 3: sin cambios de diseño y horas de ancho fijo", async ({
  page,
}) => {
  await blockFont(page);
  await sessionWithClock(page, HOUR);
  await createAndView(page, {
    title: "Regar",
    kind: "Intervalo",
    every: "2",
    unit: "días",
    note: "x",
  });
  const probes = (p: Page) => ({
    title: row(p, "Regar").getByRole("button").first(),
    button: p.getByRole("button", { name: "+" }),
    menuButton: p.getByRole("button", { name: "Menú" }),
  });
  // With the font blocked: system.
  const before: Record<string, Measure> = {};
  for (const [k, l] of Object.entries(probes(page)))
    before[k] = await measure(page, l);
  const hierarchyBefore = await hierarchy(page);
  hierarchyKeeps(hierarchyBefore);
  await expect
    .poll(async () => (await distribution(page, probes(page).title))[0])
    .toBe(0);
  await panelMeasures(page);

  await page.unroute(ATKINSON_FILES);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Pendientes" })).toBeVisible();
  await withAtkinson(page, probes(page).title);
  for (const [k, l] of Object.entries(probes(page))) {
    const d = await measure(page, l);
    expect(d.size, k).toBe(before[k].size);
    expect(d.weight, k).toBe(before[k].weight);
  }
  // Step 2: the hierarchy is kept, the same as before.
  const hierarchyAfter = await hierarchy(page);
  hierarchyKeeps(hierarchyAfter);
  expect(hierarchyAfter).toEqual(hierarchyBefore);
  await panelMeasures(page);

  // Fixed-width times in the Historial.
  await create(page, {
    title: "Uno",
    kind: "Intervalo",
    every: "1",
    unit: "días",
  });
  await create(page, {
    title: "Dos",
    kind: "Intervalo",
    every: "1",
    unit: "días",
  });
  await expect(row(page, "Dos")).toBeVisible();
  await stop(page, "2026-07-15T08:05:00");
  await complete(page, "Uno");
  await page.clock.runFor(1000);
  await page.clock.setFixedTime(new Date("2026-07-15T11:11:00"));
  await page.clock.runFor(1000);
  await complete(page, "Dos");
  await withClock(page, async () => {
    await goA(page, "Historial");
    await expect(page.getByText(/\b08:05\b/).first()).toBeVisible();
    await expect(page.getByText(/\b11:11\b/).first()).toBeVisible();
  });
  const h1 = await page
    .getByText(/\b08:05\b/)
    .first()
    .boundingBox();
  const h2 = await page
    .getByText(/\b11:11\b/)
    .first()
    .boundingBox();
  expect(Math.abs(h1!.width - h2!.width)).toBeLessThan(0.5);
  const hour = page.getByText(/\b08:05\b/).first();
  await withAtkinson(page, hour);
  const tnum = await hour.evaluate(
    (e) => getComputedStyle(e).fontVariantNumeric,
  );
  expect(tnum).toContain("tabular-nums");
});

// ---------------------------------------------------------------------------
// Flow 4 (online part; the offline part lives in
// bundled-font-offline.spec.ts, which needs the service worker)
// ---------------------------------------------------------------------------

test("Flow 4: ningún pedido a un servicio externo", async ({ page }) => {
  const external = requestsExternal(page);
  await sessionWithClock(page, HOUR);
  await createAndView(page, {
    title: "Regar",
    kind: "Intervalo",
    every: "2",
    unit: "días",
    emoji: "🌱",
  });
  await goA(page, "Historial");
  await goA(page, "Pendientes");
  await openTask(page, "Regar");
  await openSelector(page);
  await expect(page.locator("body")).toBeVisible();
  expect(external).toEqual([]);
});

// ---------------------------------------------------------------------------
// Flow 5
// ---------------------------------------------------------------------------

async function taskWithEmoji(page: Page) {
  await createAndView(page, {
    title: "Regar",
    kind: "Intervalo",
    every: "2",
    unit: "días",
    emoji: "🌱",
  });
  await distributionIs(
    page,
    titleRow(page),
    ([a, n, o]) => a >= 5 && n === 1 && o === 0,
  );
}

const titleRow = (page: Page) =>
  row(page, "Regar").getByRole("button").first();

const inAtkinsonAndNoto = (page: Page) =>
  distributionIs(
    page,
    titleRow(page),
    ([a, n, o]) => a >= 5 && n === 1 && o === 0,
  );

/** Emoji with the device's own: Noto draws nothing, and the emoji is not left blank. */
async function withEmojiOfDevice(page: Page) {
  await expect
    .poll(async () => {
      const fs = await platform(page, titleRow(page));
      return glyphs(fs, isNoto) === 0 && glyphs(fs, isOther) >= 1;
    })
    .toBe(true);
  expect((await titleRow(page).boundingBox())!.width).toBeGreaterThan(30);
}

/** What was saved works even if the network is blocked: for it to be missing, each step starts by forgetting it. */
test("Flow 5 pasos 1 y 2: sin la fuente, la pantalla no la espera, todo con la del sistema y sin aviso", async ({
  page,
}) => {
  await sessionWithClock(page, HOUR);
  await taskWithEmoji(page);
  await createAndView(page, {
    title: "Año 2026 12:30 # * ©",
    kind: "Intervalo",
    every: "2",
    unit: "días",
  });
  await forgetFonts(page);
  await blockFont(page);

  // Step 1: the screen is shown without fallback text and goes away after 0.5 s, without waiting for what failed.
  const opening = await reloadStopped(page);
  await expect(screenName(page)).toBeVisible();
  expect(await textVisible(page)).toBe("");
  await opening.toMount(page.getByText("Regar"));
  await opening.staysA(0.4);
  await opening.goesA(0.5);
  await expect(titleRow(page)).toBeVisible();
  await expect
    .poll(async () => {
      const [a, , o] = await distribution(page, titleRow(page));
      return a === 0 && o > 0;
    })
    .toBe(true);
  // All the text, including digits, signs and spaces, even if the emoji set is already there: Noto has them too.
  await distributionIs(
    page,
    row(page, "Año").getByRole("button").first(),
    ([a, n, o]) => a === 0 && n === 0 && o > 0,
  );
  await withoutNotices(page);

  // Step 2: remove the block and reload.
  await page.unroute(ATKINSON_FILES);
  await (await reloadStopped(page)).goesA(0.5);
  await inAtkinsonAndNoto(page);
});

test("Flow 5 pasos 3 y 4: sin el juego, la pantalla no lo espera y los emoji son los del dispositivo", async ({
  page,
}) => {
  await sessionWithClock(page, HOUR);
  await taskWithEmoji(page);
  await forgetFonts(page);
  await blockEmoji(page);

  // Step 3.
  const opening = await reloadStopped(page);
  await opening.toMount(page.getByText("Regar"));
  await opening.staysA(0.4);
  await opening.goesA(0.5);
  await withEmojiOfDevice(page);
  await withoutNotices(page);

  // Step 4.
  await page.unroute(NOTO_FILE);
  await (await reloadStopped(page)).goesA(0.5);
  await inAtkinsonAndNoto(page);
});

test("Flow 5 paso 5: con el pedido demorado sigue hasta el tope; al liberarlo, Noto sin recargar ni segundo pedido", async ({
  page,
}) => {
  await sessionWithClock(page, HOUR);
  await taskWithEmoji(page);
  await forgetFonts(page);
  const fontSet = await retain(page, NOTO_FILE);
  const opening = await reloadStopped(page);
  await opening.staysA(9.9);
  await opening.goesA(10);
  await withEmojiOfDevice(page);
  await withoutNotices(page);
  expect(fontSet.requests()).toBe(1);

  fontSet.release();
  await inAtkinsonAndNoto(page);
  await withoutNotices(page);
  expect(fontSet.requests()).toBe(1);
});

test("Flow 5 paso 6: con la descarga abortada no llega al tope; al volver la red se pide otra vez, sin recargar", async ({
  page,
}) => {
  await sessionWithClock(page, HOUR);
  await taskWithEmoji(page);
  await forgetFonts(page);
  const fontSet = await networkFailure(page, NOTO_FILE);
  const opening = await reloadStopped(page);
  await opening.toMount(page.getByText("Regar"));
  await expect.poll(fontSet.requests).toBeGreaterThan(0);
  await opening.staysA(0.4);
  await opening.goesA(0.5);
  await withEmojiOfDevice(page);
  await withoutNotices(page);

  // Offline, remove the failure and come back online: there is a new request.
  const context = page.context();
  await context.setOffline(true);
  await expect(page.getByText("Sin conexión")).toBeVisible();
  fontSet.remove();
  const before = fontSet.requests();
  await context.setOffline(false);
  await expect.poll(fontSet.requests).toBeGreaterThan(before);
  await inAtkinsonAndNoto(page);
  await withoutNotices(page);
});

// ---------------------------------------------------------------------------
// Flow 6
// ---------------------------------------------------------------------------

test("Flow 6: un emoji que el juego no tiene se guarda y se muestra igual", async ({
  browser,
}) => {
  const { a, b, close: closeTwo } = await twoDevices(browser, HOUR);
  try {
    await createAndView(a, {
      title: `Prueba ${HAS_NO_NOTO}`,
      kind: "Intervalo",
      every: "2",
      unit: "días",
    });
    const fa = row(a, "Prueba").getByRole("button").first();
    await expect(fa).toContainText(HAS_NO_NOTO);
    await expect
      .poll(async () => {
        const fs = await platform(a, fa);
        return glyphs(fs, isNoto) === 0;
      })
      .toBe(true);
    expect((await fa.boundingBox())!.width).toBeGreaterThan(30);
    await expect(a.getByRole("alert")).toHaveCount(0);

    await openTask(a, "Prueba");
    await expect(a.getByLabel("Título")).toHaveValue(`Prueba ${HAS_NO_NOTO}`);
    await close(a);

    await arrivesOnServer(a);
    await expect(row(b, "Prueba").getByRole("button").first()).toContainText(
      HAS_NO_NOTO,
    );
  } finally {
    await closeTwo();
  }
});

// The catalog that ships with the app: the source independent of the picker and of the font that draws it.
const CATALOG = JSON.parse(
  readFileSync("node_modules/emoji-picker-element-data/es/cldr/data.json", "utf8"),
) as {
  emoji: string;
  group: number;
  skins?: { tone: number | number[]; emoji: string }[];
}[];
/** Group 2 holds the components (loose skin tones and hair): they are not chosen as emoji, and were never offered. */
const ELIGIBLE = CATALOG.filter((e) => e.group !== 2);
const TONES = [1, 2, 3, 4, 5];

/** For a skin tone, each emoji with that variant (two-tone ones are not offered) or the emoji without variants. */
const catalogWithTone = (tone: number) =>
  ELIGIBLE.map(
    (e) => e.skins?.find((s) => s.tone === tone)?.emoji ?? e.emoji,
  );

/** Everything the picker offers, walking its category tabs like a user. */
async function thatOffers(page: Page): Promise<string[]> {
  const tabs = selectorEmoji(page).getByRole("tab");
  const offered: string[] = [];
  let previous = "";
  for (let i = 0; i < (await tabs.count()); i++) {
    await tabs.nth(i).click();
    await expect(tabs.nth(i)).toHaveAttribute("aria-selected", "true");
    let read: string[] = [];
    let previousOne = previous;
    await expect
      .poll(
        async () => {
          read = await selectorEmojis(page).allTextContents();
          const reading = read.join();
          const firm = reading !== previous && reading === previousOne;
          previousOne = reading;
          return firm;
        },
        { intervals: [200] },
      )
      .toBe(true);
    previous = read.join();
    offered.push(...read);
  }
  return offered;
}

function isSameCatalog(offered: string[], expected: string[]) {
  const setOf = (list: string[]) => new Set(list);
  expect(offered.length, "sin repetidos").toBe(setOf(offered).size);
  expect(
    expected.filter((e) => !setOf(offered).has(e)),
    "falta",
  ).toEqual([]);
  expect(
    offered.filter((e) => !setOf(expected).has(e)),
    "sobra",
  ).toEqual([]);
}

test("Flow 6 paso 5: el selector ofrece los mismos emoji, ni falta ni sobra", async ({
  page,
}) => {
  test.setTimeout(240_000);
  await sessionWithClock(page, HOUR);
  await create(page, {
    title: "Prueba",
    kind: "Intervalo",
    every: "2",
    unit: "días",
  });

  // Without the emoji set: what was offered before bundling it.
  await forgetFonts(page);
  await blockEmoji(page);
  await page.reload();
  await openTask(page, "Prueba");
  await openSelector(page);
  await expect
    .poll(async () =>
      glyphs(await platform(page, selectorEmojis(page).first()), isNoto),
    )
    .toBe(0);
  // The catalog source is independent of the picker: 1914 base and 9 components that are not offered.
  expect(ELIGIBLE).toHaveLength(1914);
  expect(CATALOG.length - ELIGIBLE.length).toBe(9);
  const withoutNoto = await thatOffers(page);
  isSameCatalog(withoutNoto, catalogWithTone(0));

  // With Noto: the same ones, against the catalog and against what was just seen.
  await page.unroute(NOTO_FILE);
  await page.reload();
  await openTask(page, "Prueba");
  await openSelector(page);
  const withSet = await thatOffers(page);
  await withNoto(page, selectorEmojis(page).first());
  isSameCatalog(withSet, catalogWithTone(0));
  expect(withSet).toEqual(withoutNoto);

  // And each skin-tone variant, choosing the tone in the picker.
  for (const tone of TONES) {
    await selectorEmoji(page).locator("#skintone-button").click();
    await selectorEmoji(page)
      .locator("#skintone-list [role=option]")
      .nth(tone)
      .click();
    isSameCatalog(await thatOffers(page), catalogWithTone(tone));
  }
});

test("Flow 6 paso 5: buscar da resultados y elegir uno lo asigna y cierra el selector", async ({
  page,
}) => {
  await sessionWithClock(page, HOUR);
  await createAndView(page, {
    title: "Prueba",
    kind: "Intervalo",
    every: "2",
    unit: "días",
  });
  for (const [search, emoji] of [
    ["planta", "🌱"],
    ["escoba", "🧹"],
    ["perro", "🐶"],
  ]) {
    await openTask(page, "Prueba");
    await openSelector(page);
    await searchBoxEmoji(page).fill(search);
    await expect(emojiExact(page, emoji)).toHaveCount(1);
    await emojiExact(page, emoji).click();
    await expect(selectorEmoji(page)).toHaveCount(0);
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(row(page, "Prueba").getByRole("button").first()).toContainText(emoji);
  }
});

test("Flow 6 paso 6: un cabello suelto o dos tonos llegados por otra vía se muestran y se conservan al guardar", async ({
  page,
}) => {
  await sessionWithClock(page, HOUR);
  await createAndView(page, {
    title: "Molde",
    kind: "Intervalo",
    every: "2",
    unit: "días",
  });
  await arrivesOnServer(page);
  const uid = await accountUid();
  const [template] = await docs(uid, "tareas");
  const arrived = ["🦰", "🦱", "🦳", "🦲", "🧑🏻‍🤝‍🧑🏿"];
  for (const [i, emoji] of arrived.entries())
    await saveDoc(uid, "tareas", `llegada${i}`, {
      ...template.fields,
      titulo: { stringValue: `Llegada ${i}` },
      emoji: { stringValue: emoji },
    });

  for (const [i, emoji] of arrived.entries()) {
    const title = `Llegada ${i}`;
    const button = row(page, title).getByRole("button").first();
    await expect(button).toContainText(emoji);
    await openTask(page, title);
    await page.getByLabel("Nota").fill("Cambiada");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await withoutNotices(page);
    await expect(button).toContainText(emoji);
    await arrivesOnServer(page);
    const saved = (await docs(uid, "tareas")).find((d) =>
      d.name.endsWith(`/llegada${i}`),
    );
    expect(saved?.fields.emoji).toEqual({ stringValue: emoji });
    expect(saved?.fields.nota).toEqual({ stringValue: "Cambiada" });
  }
});
