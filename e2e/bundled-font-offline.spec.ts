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

// Esta suite habla del service worker: lo permite (las demás lo bloquean).
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

test("Flujo 4 pasos 2 a 4: sin conexión, con Atkinson y Noto, también un emoji nunca visto", async ({
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

  // Paso 2: sin conexión y recargando, abre con Atkinson y Noto.
  await ctx.setOffline(true);
  await page.reload();
  await expect(pending(page)).toBeVisible();
  const title = titleOf(page, "Regar");
  await distributionIs(page, title, ([a, n, o]) => a >= 5 && n === 1 && o === 0);
  await withAtkinson(page, pending(page));

  // Paso 3: un emoji que no se usó en este dispositivo, desde el selector.
  await openTask(page, "Regar");
  await openSelector(page);
  await searchBoxEmoji(page).fill("medusa");
  const jellyfish = emojiExact(page, "🪼");
  await expect(jellyfish).toHaveCount(1);
  await withNoto(page, jellyfish);
  await selectorEmoji(page).getByRole("button", { name: "Cerrar" }).click();
  await page.getByRole("button", { name: "Cerrar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Paso 4: escrito en el título de una tarea nueva.
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
// Flujo 7: dos versiones servidas en el mismo origen (e2e/versiones-apoyo.ts)
// ---------------------------------------------------------------------------

const NOTICE = /actualiz|nueva versi[oó]n|recarg|reinici/i;

/** Registra toda pregunta o aviso que aparezca en cualquier página del contexto, en cualquier momento. */
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
      // La franja "Sin conexión" (§7) es de la app, no un aviso de la versión ni de la fuente.
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

/** Una carpeta limpia con el build actual (`nueva`) y `derivar` aplicado sobre él (`otra`). */
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

/** Publica `dir` con la app abierta: la versión nueva se instala sola y espera. */
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

/** Cierra `page` y abre la app hasta que se aplicó la versión de `dir`. */
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

test("Flujo 7: la versión con la fuente llega sola a quien tenía la anterior, sin preguntas ni avisos", async ({
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
    // Paso 1: la app abierta con la versión anterior, sin fuentes propias.
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

    // Se publica la versión con la fuente y el juego: se instala sola y espera, con la app abierta.
    await publish(ctx, status, fresh);
    await expect(row(page, "Regar")).toBeVisible();

    // Paso 2: se cierra la app y se abre de nuevo.
    const reopened = await reopenWithVersion(ctx, page, fresh);
    await distributionIs(
      reopened,
      titleOf(reopened, "Regar"),
      ([a, n, o]) => a >= 5 && n === 1 && o === 0,
    );
    await withAtkinson(reopened, pending(reopened));
    expect(seen).toEqual([]);

    // Quedaron guardados: también sin conexión.
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
// Flujo 8: la instalación no depende de la fuente ni del juego
// ---------------------------------------------------------------------------

/** Recarga y comprueba que la pantalla se va antes del tope de 10 s, en tiempo real. */
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

/** Primera instalación: un contexto nuevo con la falla, entra, crea «Regar» y queda instalada. */
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

test("Flujo 8 pasos 1 a 3: se instala con falla en el juego y, al quitarla, Noto queda también sin conexión", async ({
  browser,
}) => {
  const { ctx, page, failure } = await installWithFailure(browser, NOTO_FILE);

  // Paso 2.
  await ctx.setOffline(true);
  await reloadBeforeOfCap(page);
  await distributionIs(page, titleOf(page, "Regar"), WATER_ATKINSON_DEVICE);
  await withoutNotices(page);

  // Paso 3: sin cerrar la app alcanza, porque se vuelve a pedir al volver la red.
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

test("Flujo 8 pasos 4 a 6: se instala con falla en un archivo de fuente y, al quitarla, Atkinson queda también sin conexión", async ({
  browser,
}) => {
  const { ctx, page, failure } = await installWithFailure(browser, ATKINSON_FILE);

  // Paso 5: el juego de Atkinson se registra entero o nada, así que todo el texto va con la del sistema.
  await ctx.setOffline(true);
  await reloadBeforeOfCap(page);
  await distributionIs(page, titleOf(page, "Regar"), WATER_SYSTEM_NOTO);
  await withoutNotices(page);

  // Paso 6.
  failure.remove();
  await ctx.setOffline(false);
  await distributionIs(page, titleOf(page, "Regar"), WATER_ATKINSON_NOTO);
  await ctx.setOffline(true);
  await reloadBeforeOfCap(page);
  await distributionIs(page, titleOf(page, "Regar"), WATER_ATKINSON_NOTO);
  await ctx.close();
});

test("Flujo 8 paso 7: si solo falla el primer pedido de cada archivo, se reintentan y quedan guardados", async ({
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
  test(`Flujo 8 ${testCase.steps}: la versión nueva se aplica con falla en ${testCase.name}`, async ({
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
      // Versión anterior instalada.
      const page = await ctx.newPage();
      await enter(page);
      await createWater(page);
      await expect(row(page, "Regar")).toBeVisible();
      await controlled(page);
      await expect(row(page, "Regar")).toBeVisible();
      const seen = await watchNotices(ctx);

      // Paso 8: se publica con la falla; cerrar y abrir aplica la versión nueva.
      const failure = await networkFailure(ctx, testCase.pattern);
      await publish(ctx, status, fresh);
      const reopened = await reopenWithVersion(ctx, page, fresh);
      await distributionIs(reopened, titleOf(reopened, "Regar"), testCase.withFailure);
      await expect(screenName(reopened)).toHaveCount(0);
      expect(seen).toEqual([]);

      // Paso 9: sin conexión abre igual.
      await ctx.setOffline(true);
      await reloadBeforeOfCap(reopened);
      await distributionIs(reopened, titleOf(reopened, "Regar"), testCase.withFailure);

      // Paso 10: al quitar la falla y volver la red, pasan solos y quedan también sin conexión.
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
// Flujo 9: lo que necesita el service worker
// ---------------------------------------------------------------------------

test("Flujo 9 paso 15: sin conexión y sin Atkinson guardada, se va a los 0,5 s y da paso a la entrada con su mensaje", async ({
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

test("Flujo 9 paso 16: con sesión, sin conexión y sin el juego guardado, se va a los 0,5 s; la franja se ve recién al entrar", async ({
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

test("Flujo 9 pasos 5 y 24: al abrir una versión nueva que no cambia las fuentes, aparece, no las vuelve a pedir y se va a los 0,5 s", async ({
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

    // Cerrar la app; cada apertura se mide con el reloj detenido hasta que abre la versión nueva.
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
