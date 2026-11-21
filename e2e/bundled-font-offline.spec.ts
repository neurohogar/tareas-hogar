import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  openTask,
  openSelector,
  searchBoxEmoji,
  completeEntry,
  controlled,
  create,
  device,
  emojiExact,
  enter,
  row,
  cleanEmulators,
  selectorEmoji,
} from "./support";
import { withAtkinson, withNoto, distributionIs } from "./font-support";
import {
  Opening,
  ATKINSON_FILES,
  networkFailure,
  NOTO_FILE,
  forgetFonts,
  screenName,
  reloadStopped,
  withoutNotices,
  textVisible,
  ATKINSON_FILE,
} from "./screen-support";
import {
  cachesOf,
  hasVersionWaiting,
  ORIGIN_VERSIONS,
  serve,
  versionWithSameFonts,
  versionOf,
  versionWithoutFonts,
} from "./versions-support";

// This suite exercises the service worker, so it allows it (the others block it).
test.use({ serviceWorkers: "allow" });

const HOUR = "2026-07-15T08:00:00";
const BEFORE_CAP = { timeout: 9_000 };

test.beforeEach(async () => {
  await cleanEmulators();
});

const pending = (page: Page) =>
  page.getByRole("heading", { name: "Pendientes", level: 1 });

async function session(browser: Browser) {
  const d = await device(browser, HOUR, true);
  await controlled(d.page);
  await expect(pending(d.page)).toBeVisible();
  return d;
}

const titleOf = (page: Page, t: string) =>
  row(page, t).getByRole("button").first();

test("Flow 4 pasos 2 a 4: sin conexión, con Atkinson y Noto, también un emoji nunca visto", async ({
  browser,
}) => {
  const { ctx, page } = await session(browser);
  await create(page, {
    title: "Regar",
    kind: "Intervalo",
    every: "2",
    unit: "días",
    emoji: "🌱",
  });
  await expect(row(page, "Regar")).toBeVisible();
  await controlled(page);

  // Step 2: offline and reloading, it opens with Atkinson and Noto.
  await ctx.setOffline(true);
  await page.reload();
  await expect(pending(page)).toBeVisible();
  const title = titleOf(page, "Regar");
  await distributionIs(page, title, ([a, n, o]) => a >= 5 && n === 1 && o === 0);
  await withAtkinson(page, pending(page));

  // Step 3: an emoji not used on this device, from the picker.
  await openTask(page, "Regar");
  await openSelector(page);
  await searchBoxEmoji(page).fill("medusa");
  const jellyfish = emojiExact(page, "🪼");
  await expect(jellyfish).toHaveCount(1);
  await withNoto(page, jellyfish);
  await selectorEmoji(page).getByRole("button", { name: "Cerrar" }).click();
  await page.getByRole("button", { name: "Cerrar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Step 4: typed into the title of a new task.
  await page.getByRole("button", { name: "+" }).click();
  await page.getByLabel("Título").fill("Medusa 🪼");
  await distributionIs(
    page,
    page.getByLabel("Título"),
    ([a, n, o]) => a >= 6 && n === 1 && o === 0,
  );
  await ctx.close();
});

// ---------------------------------------------------------------------------
// Flow 7: two versions served from the same origin (e2e/versions-support.ts)
// ---------------------------------------------------------------------------

const NOTICE = /actualiz|nueva versi[oó]n|recarg|reinici/i;

/** Records every prompt or notice that appears on any page of the context, at any time. */
async function watchNotices(ctx: BrowserContext): Promise<string[]> {
  const seen: string[] = [];
  ctx.on("dialog", (d) => {
    seen.push(`dialog: ${d.message()}`);
    void d.dismiss();
  });
  await ctx.exposeBinding("qaAvisoVisto", (_font, text: string) => {
    seen.push(text);
  });
  await ctx.addInitScript((pattern) => {
    const notice = new RegExp(pattern, "i");
    const notify = (n: Element) =>
      // The "Sin conexión" strip (§7) belongs to the app; it is not a version or font notice.
      n.textContent?.trim() !== "Sin conexión" &&
      (window as unknown as Record<string, (t: string) => void>).qaAvisoVisto(
        `${n.getAttribute("role") ?? n.tagName}: ${n.textContent}`,
      );
    new MutationObserver((changes) => {
      for (const c of changes)
        for (const n of c.addedNodes) {
          if (!(n instanceof Element)) continue;
          const roles =
            "[role=alert],[role=alertdialog],[role=dialog],[role=status],dialog";
          const found = [
            ...(n.matches(roles) ? [n] : []),
            ...n.querySelectorAll(roles),
          ];
          found.forEach(notify);
          if (notice.test(n.textContent ?? "")) notify(n);
        }
    }).observe(document, { subtree: true, childList: true });
  }, NOTICE.source);
  return seen;
}

/** A clean folder with the current build (`fresh`) and `derive` applied on top of it (`other`). */
function twoVersions(
  name: string,
  derive: (origin: string, target: string) => void,
) {
  const root = join(process.cwd(), "tmp", name);
  const fresh = join(root, "nueva");
  const other = join(root, "otra");
  rmSync(root, { recursive: true, force: true });
  mkdirSync(root, { recursive: true });
  cpSync(join(process.cwd(), "build"), fresh, { recursive: true });
  derive(fresh, other);
  return { fresh, other };
}

const versionsContext = (browser: Browser) =>
  browser.newContext({
    baseURL: ORIGIN_VERSIONS,
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
  });

/** Publishes `dir` with the app open: the new version installs itself and waits. */
async function publish(
  ctx: BrowserContext,
  status: { dir: string },
  dir: string,
) {
  status.dir = dir;
  const other = await ctx.newPage();
  await other.goto("/");
  await expect(pending(other)).toBeVisible();
  await expect(async () => {
    expect(await hasVersionWaiting(other)).toBe(true);
  }).toPass();
  await other.close();
}

/** Closes `page` and opens the app until the version in `dir` has been applied. */
async function reopenWithVersion(ctx: BrowserContext, page: Page, dir: string) {
  await page.close();
  await expect(async () => {
    const attempt = await ctx.newPage();
    try {
      await attempt.goto("/");
      await expect(pending(attempt)).toBeVisible();
      expect(await cachesOf(attempt)).toEqual([`tareas-hogar-${versionOf(dir)}`]);
    } finally {
      await attempt.close();
    }
  }).toPass({ timeout: 30_000 });
  const reopened = await ctx.newPage();
  await reopened.goto("/");
  await expect(screenName(reopened)).toHaveCount(0, BEFORE_CAP);
  await expect(pending(reopened)).toBeVisible();
  return reopened;
}

test("Flow 7: la versión con la fuente llega sola a quien tenía la anterior, sin preguntas ni avisos", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const { fresh, other: previous } = twoVersions(
    "fuente-versiones",
    versionWithoutFonts,
  );
  const status = { dir: previous };
  const server = await serve(status);
  const ctx = await versionsContext(browser);
  try {
    // Step 1: the app open with the previous version, without its own fonts.
    const page = await ctx.newPage();
    await enter(page);
    await create(page, { title: "Regar", kind: "No se repite", emoji: "🌱" });
    await expect(row(page, "Regar")).toBeVisible();
    await controlled(page);
    await expect(row(page, "Regar")).toBeVisible();
    await distributionIs(
      page,
      titleOf(page, "Regar"),
      ([a, n, o]) => a === 0 && n === 0 && o > 0,
    );
    const seen = await watchNotices(ctx);
    await page.reload();
    await expect(row(page, "Regar")).toBeVisible();

    // The version with the font and its set is published: it installs itself and waits, with the app open.
    await publish(ctx, status, fresh);
    await expect(row(page, "Regar")).toBeVisible();

    // Step 2: the app is closed and opened again.
    const reopened = await reopenWithVersion(ctx, page, fresh);
    await distributionIs(
      reopened,
      titleOf(reopened, "Regar"),
      ([a, n, o]) => a >= 5 && n === 1 && o === 0,
    );
    await withAtkinson(reopened, pending(reopened));
    expect(seen).toEqual([]);

    // They were saved: also offline.
    await ctx.setOffline(true);
    await reopened.reload();
    await distributionIs(
      reopened,
      titleOf(reopened, "Regar"),
      ([a, n, o]) => a >= 5 && n === 1 && o === 0,
    );
  } finally {
    await ctx.close();
    server.close();
  }
});

// ---------------------------------------------------------------------------
// Flow 8: installation does not depend on the font or its set
// ---------------------------------------------------------------------------

/** Reloads and checks that the screen goes away before the 10 s cap, in real time. */
async function reloadBeforeOfCap(page: Page) {
  await page.reload();
  await expect(screenName(page)).toHaveCount(0, BEFORE_CAP);
  await expect(pending(page)).toBeVisible();
  await withoutNotices(page);
}

const createWater = (page: Page) =>
  create(page, { title: "Regar", kind: "Intervalo", every: "2", unit: "días", emoji: "🌱" });

const WATER_ATKINSON_NOTO = ([a, n, o]: [number, number, number]) =>
  a >= 5 && n === 1 && o === 0;
const WATER_ATKINSON_DEVICE = ([a, n, o]: [number, number, number]) =>
  a >= 5 && n === 0 && o >= 1;
const WATER_SYSTEM_NOTO = ([a, n, o]: [number, number, number]) =>
  a === 0 && n === 1 && o >= 5;

/** First install: a new context with the failure, signs in, creates «Regar» and ends up installed. */
async function installWithFailure(browser: Browser, pattern: RegExp) {
  const d = await browser.newContext({
    baseURL: "http://127.0.0.1:4173",
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
  });
  const failure = await networkFailure(d, pattern);
  const page = await d.newPage();
  await page.goto("/");
  await expect(screenName(page)).toHaveCount(0, BEFORE_CAP);
  await completeEntry(page);
  await createWater(page);
  await expect(row(page, "Regar")).toBeVisible();
  await controlled(page);
  await expect(screenName(page)).toHaveCount(0, BEFORE_CAP);
  await expect(row(page, "Regar")).toBeVisible();
  return { ctx: d, page, failure };
}

test("Flow 8 pasos 1 a 3: se instala con falla en el juego y, al quitarla, Noto queda también sin conexión", async ({
  browser,
}) => {
  const { ctx, page, failure } = await installWithFailure(browser, NOTO_FILE);

  // Step 2.
  await ctx.setOffline(true);
  await reloadBeforeOfCap(page);
  await distributionIs(page, titleOf(page, "Regar"), WATER_ATKINSON_DEVICE);
  await withoutNotices(page);

  // Step 3: no need to close the app, because it is requested again when the network returns.
  failure.remove();
  await ctx.setOffline(false);
  await distributionIs(page, titleOf(page, "Regar"), WATER_ATKINSON_NOTO);
  await withoutNotices(page);
  await ctx.setOffline(true);
  await reloadBeforeOfCap(page);
  await distributionIs(page, titleOf(page, "Regar"), WATER_ATKINSON_NOTO);
  await page.getByRole("button", { name: "+" }).click();
  await page.getByLabel("Título").fill("Medusa 🪼");
  await distributionIs(page, page.getByLabel("Título"), ([a, n, o]) => a >= 6 && n === 1 && o === 0);
  await ctx.close();
});

test("Flow 8 pasos 4 a 6: se instala con falla en un archivo de fuente y, al quitarla, Atkinson queda también sin conexión", async ({
  browser,
}) => {
  const { ctx, page, failure } = await installWithFailure(browser, ATKINSON_FILE);

  // Step 5: the Atkinson set is registered whole or not at all, so all the text uses the system font.
  await ctx.setOffline(true);
  await reloadBeforeOfCap(page);
  await distributionIs(page, titleOf(page, "Regar"), WATER_SYSTEM_NOTO);
  await withoutNotices(page);

  // Step 6.
  failure.remove();
  await ctx.setOffline(false);
  await distributionIs(page, titleOf(page, "Regar"), WATER_ATKINSON_NOTO);
  await ctx.setOffline(true);
  await reloadBeforeOfCap(page);
  await distributionIs(page, titleOf(page, "Regar"), WATER_ATKINSON_NOTO);
  await ctx.close();
});

test("Flow 8 paso 7: si solo falla el primer pedido de cada archivo, se reintentan y quedan guardados", async ({
  browser,
}) => {
  const ctx = await browser.newContext({
    baseURL: "http://127.0.0.1:4173",
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
  });
  const requests = new Map<string, number>();
  await ctx.route(/\/fuentes\/.*\.woff2/, async (route) => {
    const url = route.request().url();
    const n = (requests.get(url) ?? 0) + 1;
    requests.set(url, n);
    await (n === 1 ? route.abort("connectionfailed") : route.continue());
  });
  const page = await ctx.newPage();
  await enter(page);
  await createWater(page);
  await expect(row(page, "Regar")).toBeVisible();
  await distributionIs(page, titleOf(page, "Regar"), WATER_ATKINSON_NOTO);
  const files = [...requests.keys()];
  expect(files.filter((u) => ATKINSON_FILES.test(u))).toHaveLength(6);
  expect(files.filter((u) => NOTO_FILE.test(u))).toHaveLength(1);
  for (const n of requests.values()) expect(n).toBeGreaterThan(1);

  await controlled(page);
  await ctx.setOffline(true);
  await reloadBeforeOfCap(page);
  await distributionIs(page, titleOf(page, "Regar"), WATER_ATKINSON_NOTO);
  await ctx.close();
});

for (const testCase of [
  {
    name: "el juego de emoji",
    steps: "pasos 8 a 10",
    pattern: NOTO_FILE,
    withFailure: WATER_ATKINSON_DEVICE,
  },
  {
    name: "un archivo de fuente",
    steps: "paso 11",
    pattern: ATKINSON_FILE,
    withFailure: WATER_SYSTEM_NOTO,
  },
]) {
  test(`Flow 8 ${testCase.steps}: la versión nueva se aplica con falla en ${testCase.name}`, async ({
    browser,
  }) => {
    test.setTimeout(180_000);
    const { fresh, other: previous } = twoVersions(
      "fuente-actualizacion",
      versionWithoutFonts,
    );
    const status = { dir: previous };
    const server = await serve(status);
    const ctx = await versionsContext(browser);
    try {
      // Previous version installed.
      const page = await ctx.newPage();
      await enter(page);
      await createWater(page);
      await expect(row(page, "Regar")).toBeVisible();
      await controlled(page);
      await expect(row(page, "Regar")).toBeVisible();
      const seen = await watchNotices(ctx);

      // Step 8: it is published with the failure; closing and opening applies the new version.
      const failure = await networkFailure(ctx, testCase.pattern);
      await publish(ctx, status, fresh);
      const reopened = await reopenWithVersion(ctx, page, fresh);
      await distributionIs(reopened, titleOf(reopened, "Regar"), testCase.withFailure);
      await expect(screenName(reopened)).toHaveCount(0);
      expect(seen).toEqual([]);

      // Step 9: it opens anyway while offline.
      await ctx.setOffline(true);
      await reloadBeforeOfCap(reopened);
      await distributionIs(reopened, titleOf(reopened, "Regar"), testCase.withFailure);

      // Step 10: when the failure is removed and the network returns, they arrive by themselves and are also available offline.
      failure.remove();
      await ctx.setOffline(false);
      await distributionIs(reopened, titleOf(reopened, "Regar"), WATER_ATKINSON_NOTO);
      await ctx.setOffline(true);
      await reloadBeforeOfCap(reopened);
      await distributionIs(reopened, titleOf(reopened, "Regar"), WATER_ATKINSON_NOTO);
      expect(seen).toEqual([]);
    } finally {
      await ctx.close();
      server.close();
    }
  });
}

// ---------------------------------------------------------------------------
// Flow 9: what the service worker needs
// ---------------------------------------------------------------------------

test("Flow 9 paso 15: sin conexión y sin Atkinson guardada, se va a los 0,5 s y da paso a la entrada con su mensaje", async ({
  page,
}) => {
  await page.clock.install({ time: new Date(HOUR) });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Entrar con Google" })).toBeVisible();
  await controlled(page);
  await forgetFonts(page);
  await page.context().setOffline(true);

  const a = await reloadStopped(page);
  await a.toMount(page.getByText("Entrar con Google"));
  await a.staysA(0.4);
  await a.goesA(0.5);
  await expect(page.getByRole("heading", { name: "Tareas Hogar" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar con Google" })).toBeDisabled();
  await expect(page.getByText("Necesitás conexión para entrar la primera vez")).toBeVisible();
});

test("Flow 9 paso 16: con sesión, sin conexión y sin el juego guardado, se va a los 0,5 s; la franja se ve recién al entrar", async ({
  browser,
}) => {
  const { ctx, page } = await session(browser);
  await createWater(page);
  await expect(row(page, "Regar")).toBeVisible();
  await forgetFonts(page);
  await ctx.setOffline(true);

  const a = await reloadStopped(page);
  await expect(screenName(page)).toBeVisible();
  expect(await textVisible(page)).toBe("");
  await a.toMount(page.getByText("Regar"));
  await a.staysA(0.4);
  await a.goesA(0.5);
  await expect(page.getByText("Sin conexión")).toBeVisible();
  await expect(row(page, "Regar")).toBeVisible();
  await ctx.close();
});

test("Flow 9 pasos 5 y 24: al abrir una versión nueva que no cambia las fuentes, aparece, no las vuelve a pedir y se va a los 0,5 s", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const { fresh, other: next } = twoVersions(
    "fuente-misma-version",
    versionWithSameFonts,
  );
  const status = { dir: fresh };
  const server = await serve(status);
  const ctx = await versionsContext(browser);
  try {
    const page = await ctx.newPage();
    await enter(page);
    await createWater(page);
    await expect(row(page, "Regar")).toBeVisible();
    await distributionIs(page, titleOf(page, "Regar"), WATER_ATKINSON_NOTO);
    await controlled(page);
    await distributionIs(page, titleOf(page, "Regar"), WATER_ATKINSON_NOTO);

    const requests: string[] = [];
    ctx.on("request", (r) => {
      if (/\/fuentes\/.*\.woff2/.test(r.url())) requests.push(r.url());
    });
    await publish(ctx, status, next);

    // Close the app; each opening is measured with the clock stopped until the new version opens.
    await page.close();
    await ctx.clock.install({ time: new Date(HOUR) });
    await ctx.clock.pauseAt(new Date("2026-07-15T08:00:01"));
    await expect(async () => {
      const attempt = await ctx.newPage();
      try {
        await attempt.goto("/");
        const a = new Opening(attempt);
        await a.toMount(attempt.getByText("Regar"));
        await a.staysA(0.4);
        await a.goesA(0.5);
        expect(await cachesOf(attempt)).toEqual([
          `tareas-hogar-${versionOf(next)}`,
        ]);
        await distributionIs(attempt, titleOf(attempt, "Regar"), WATER_ATKINSON_NOTO);
      } finally {
        await attempt.close();
      }
    }).toPass({ timeout: 60_000 });
    expect(requests).toEqual([]);
  } finally {
    await ctx.close();
    server.close();
  }
});
