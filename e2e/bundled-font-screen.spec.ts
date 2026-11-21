import { expect, test, type Page } from "@playwright/test";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  completeEntry,
  withClock,
  createAndView,
  enter,
  row,
  cleanEmulators,
  sessionWithClock,
} from "./support";
import { withAtkinson, isNoto, isOther, glyphs, platform, distribution, distributionIs } from "./font-support";
import {
  openStopped,
  Opening,
  ATKINSON_FILES,
  AUTH,
  DATA,
  networkFailure,
  NOTO_FILE,
  forgetFonts,
  otherDeviceWithSession,
  screenName,
  reloadStopped,
  retain,
  withoutNotices,
  textVisible,
  userAll,
  accountUid,
  watchScreen,
} from "./screen-support";
import { ORIGIN_VERSIONS, serve, versionWithOtherSet } from "./versions-support";

// Flow 9 of qa/bundled-font.md. What needs the service worker or an installed version
// (steps 5, 15, 16 and 24) is in bundled-font-offline.spec.ts.

const HOUR = "2026-07-15T08:00:00";
const PENDING = { name: "Pendientes", level: 1 } as const;

test.beforeEach(async () => {
  await cleanEmulators();
});

const title = (page: Page) => row(page, "Regar").getByRole("button").first();
const enterWithGoogle = (page: Page) =>
  page.getByRole("button", { name: "Entrar con Google" });

/** With a session, the task «Regar» with 🌱, and the font and the emoji set already stored. */
async function sessionWithTask(page: Page) {
  await sessionWithClock(page, HOUR);
  await createAndView(page, {
    title: "Regar",
    kind: "Intervalo",
    every: "2",
    unit: "días",
    emoji: "🌱",
  });
  await distributionIs(page, title(page), ([a, n, o]) => a >= 5 && n === 1 && o === 0);
}

const inAtkinsonAndNoto = (page: Page) =>
  distributionIs(page, title(page), ([a, n, o]) => a >= 5 && n === 1 && o === 0);

/** With the device emoji, not blank. */
async function withEmojiOfDevice(page: Page) {
  await expect
    .poll(async () => {
      const fs = await platform(page, title(page));
      return glyphs(fs, isNoto) === 0 && glyphs(fs, isOther) >= 1;
    })
    .toBe(true);
  expect((await title(page).boundingBox())!.width).toBeGreaterThan(30);
}

// ---------------------------------------------------------------------------
// What is shown
// ---------------------------------------------------------------------------

test("Flow 9 pasos 1 y 2: desde lo primero que dibuja, el ícono con pulso y sin texto; tocarla no hace nada", async ({
  page,
}) => {
  const code = await retain(page, /\/_app\//);
  await page.clock.install({ time: new Date(HOUR) });
  await page.clock.pauseAt(new Date("2026-07-15T08:00:01"));
  // Step 1: the app code has not arrived and the screen is already shown.
  await page.goto("/", { waitUntil: "commit" });
  await expect(screenName(page)).toBeVisible();
  expect(code.requests()).toBeGreaterThan(0);
  expect(await textVisible(page)).toBe("");

  // Step 2: pulse, no spinner or progress indicator.
  const animations = await screenName(page).evaluate((e) =>
    e.getAnimations().map((a) => ({
      status: a.playState,
      frames: a.effect instanceof KeyframeEffect ? JSON.stringify(a.effect.getKeyframes()) : "",
      lasts: a.effect?.getComputedTiming().duration,
    })),
  );
  expect(animations).toHaveLength(1);
  expect(animations[0].status).toBe("running");
  expect(animations[0].frames).toContain("scale");
  expect(animations[0].frames).not.toContain("rotate");
  expect(animations[0].lasts).toBeGreaterThanOrEqual(1000);
  await expect(page.getByRole("progressbar")).toHaveCount(0);

  code.release();
  const a = new Opening(page);
  await a.toMount(page.getByText("Entrar con Google"));
  await a.staysA(0.4);

  // Tapping where the sign-in button will be, behind the screen: does nothing.
  let popups = 0;
  page.on("popup", () => popups++);
  const where = await page.getByText("Entrar con Google").boundingBox();
  await page.mouse.click(where!.x + where!.width / 2, where!.y + where!.height / 2);
  await page.mouse.click(10, 10);
  await expect(screenName(page)).toBeVisible();
  expect(popups).toBe(0);
  expect(page.url()).toBe("http://127.0.0.1:4173/");

  await a.goesA(0.5);
  await expect(enterWithGoogle(page)).toBeVisible();
});

test("Flow 9 paso 3: con movimiento reducido el ícono se ve quieto", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const a = await openStopped(page, HOUR);
  await expect(screenName(page)).toBeVisible();
  expect(await screenName(page).evaluate((e) => e.getAnimations().length)).toBe(0);
  await a.toMount(page.getByText("Entrar con Google"));
  await a.staysA(0.4);
  await a.goesA(0.5);
});

const COMBINATIONS = [
  { name: "Celular claro", width: 360, height: 640, theme: "light", background: "rgb(247, 245, 240)" },
  { name: "Celular oscuro", width: 360, height: 640, theme: "dark", background: "rgb(22, 25, 23)" },
  { name: "Ancho claro", width: 1024, height: 768, theme: "light", background: "rgb(247, 245, 240)" },
  { name: "Ancho oscuro", width: 1024, height: 768, theme: "dark", background: "rgb(22, 25, 23)" },
] as const;

for (const c of COMBINATIONS) {
  test(`Flow 9 paso 4: sigue el tema del sistema, sin destello al irse (${c.name})`, async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      baseURL: "http://127.0.0.1:4173",
      viewport: { width: c.width, height: c.height },
      hasTouch: c.width === 360,
      colorScheme: c.theme,
    });
    const page = await ctx.newPage();
    const a = await openStopped(page, HOUR);
    await expect(screenName(page)).toBeVisible();
    const background = (selector: string) =>
      page.evaluate((s) => getComputedStyle(document.querySelector(s)!).backgroundColor, selector);
    expect(await background("#loading-screen")).toBe(c.background);
    expect(await background("html")).toBe(c.background);
    const box = (await screenName(page).boundingBox())!;
    expect(Math.abs(box.x + box.width / 2 - c.width / 2)).toBeLessThan(2);
    expect(Math.abs(box.y + box.height / 2 - c.height / 2)).toBeLessThan(2);

    await a.toMount(page.getByText("Entrar con Google"));
    await a.staysA(0.4);
    await a.goesA(0.5);
    await expect(enterWithGoogle(page)).toBeVisible();
    // What is left behind when it goes away is the same color: no flash.
    expect(await background("html")).toBe(c.background);
    expect(await background("body")).toBe(c.background);
    await ctx.close();
  });
}

// ---------------------------------------------------------------------------
// When it appears
// ---------------------------------------------------------------------------

test("Flow 9 paso 5: al abrir y al recargar, en las dos pantallas de destino", async ({ page }) => {
  await sessionWithTask(page);
  const targets = [
    { path: "/", heading: "Pendientes" },
    { path: "/historial", heading: "Historial" },
  ];
  for (const { path, heading } of targets) {
    await page.clock.pauseAt(new Date(Date.parse(HOUR) + 3_600_000 * (targets.findIndex((d) => d.path === path) + 1)));
    await page.goto(path);
    for (const openIt of ["abrir", "recargar"]) {
      if (openIt === "recargar") await page.reload();
      const a = new Opening(page);
      await a.staysA(0.4);
      await a.goesA(0.5);
      await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
    }
  }
});

test("Flow 9 paso 6: volver de segundo plano no la muestra", async ({ page }) => {
  await sessionWithTask(page);
  const view = await watchScreen(page);
  const other = await page.context().newPage();
  await other.bringToFront();
  await page.bringToFront();
  await other.close();
  await page.evaluate(() => {
    for (const status of ["hidden", "visible"]) {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => status });
      document.dispatchEvent(new Event("visibilitychange"));
    }
  });
  await page.waitForTimeout(500);
  await expect(screenName(page)).toHaveCount(0);
  expect(await view()).toBe(0);
  await expect(row(page, "Regar")).toBeVisible();
});

test("Flow 9 paso 7: tocar Entrar con Google y completar la entrada no la muestra", async ({ page }) => {
  await page.goto("/");
  await expect(enterWithGoogle(page)).toBeVisible();
  const view = await watchScreen(page);
  await completeEntry(page);
  await expect(screenName(page)).toHaveCount(0);
  expect(await view()).toBe(0);
});

// ---------------------------------------------------------------------------
// What it waits for with a session
// ---------------------------------------------------------------------------

test("Flow 9 paso 8: con todo disponible, a los 0,4 s sigue y a los 0,5 s se va, con la lista completa", async ({
  page,
}) => {
  await sessionWithTask(page);
  const a = await reloadStopped(page);
  await a.toMount(page.getByText("Regar"));
  await a.staysA(0.4);
  await a.to(0.499, 1);
  await expect(screenName(page)).toBeVisible();
  await a.goesA(0.5);
  await expect(row(page, "Regar")).toBeVisible();
  await inAtkinsonAndNoto(page);
});

test("Flow 9 paso 9: con Auth demorado, más allá de los 10 s, sigue hasta que Auth responde", async ({
  page,
}) => {
  await sessionWithTask(page);
  const auth = await retain(page, AUTH);
  const a = await reloadStopped(page);
  await a.staysA(12);
  expect(auth.requests()).toBeGreaterThan(0);
  auth.release();
  await a.goesRightAway();
  await withClock(page, () => expect(row(page, "Regar")).toBeVisible());
});

test("Flow 9 paso 10: con los datos demorados 3 s, sigue hasta los 3 s y se va cuando responden", async ({
  page,
  browser,
}) => {
  await sessionWithTask(page);
  const b = await otherDeviceWithSession(browser, page);
  // The collections go in a single request, which is what the network can delay: the wait
  // for each one separately is decided by features/loading-screen.feature.
  const data = await retain(b.page, DATA);
  const a = await openStopped(b.page, HOUR);
  await a.staysA(2.9);
  expect(data.requests()).toBeGreaterThan(0);
  await a.to(3);
  await expect(screenName(b.page)).toBeVisible();
  data.release();
  await a.goesRightAway();
  await withClock(b.page, () => expect(row(b.page, "Regar")).toBeVisible());
  await b.ctx.close();
});

for (const { name, pattern } of [
  { name: "Atkinson", pattern: ATKINSON_FILES },
  { name: "Noto", pattern: NOTO_FILE },
]) {
  test(`Flow 9 paso 11: con ${name} demorado 6 s, sigue hasta los 6 s y entra sin haber mostrado un respaldo`, async ({
    page,
    browser,
  }) => {
    await sessionWithTask(page);
    const b = await otherDeviceWithSession(browser, page);
    const font = await retain(b.page, pattern);
    const a = await openStopped(b.page, HOUR);
    await a.staysA(5.9);
    expect(font.requests()).toBeGreaterThan(0);
    await a.to(6);
    await expect(screenName(b.page)).toBeVisible();
    font.release();
    await a.goesRightAway();
    // As soon as it goes away, everything already has the font and the emoji set.
    await withClock(b.page, () => expect(row(b.page, "Regar")).toBeVisible());
    const [atkinson, noto, other] = await distribution(b.page, title(b.page));
    expect(atkinson).toBeGreaterThanOrEqual(5);
    expect([noto, other]).toEqual([1, 0]);
    await b.ctx.close();
  });
}

test("Flow 9 paso 12: con los datos demorados más de 10 s, se va a los 10 s, sin aviso, y la lista se completa sola", async ({
  page,
  browser,
}) => {
  await sessionWithTask(page);
  const b = await otherDeviceWithSession(browser, page);
  const data = await retain(b.page, DATA);
  const a = await openStopped(b.page, HOUR);
  await a.staysA(9.9);
  await a.goesA(10);
  await expect(b.page.getByRole("heading", PENDING)).toBeVisible();
  await expect(row(b.page, "Regar")).toHaveCount(0);
  await withoutNotices(b.page);
  data.release();
  await withClock(b.page, () => expect(row(b.page, "Regar")).toBeVisible());
  await withoutNotices(b.page);
  await b.ctx.close();
});

// ---------------------------------------------------------------------------
// Without a session
// ---------------------------------------------------------------------------

test("Flow 9 paso 13: sin sesión, con Atkinson demorada, sigue hasta que llega y da paso a la entrada", async ({
  page,
}) => {
  const font = await retain(page, ATKINSON_FILES);
  const a = await openStopped(page, HOUR);
  await a.staysA(9.9);
  expect(font.requests()).toBeGreaterThan(0);
  font.release();
  await a.goesRightAway();
  await expect(page.getByRole("heading", { name: "Tareas Hogar" })).toBeVisible();
  await withAtkinson(page, enterWithGoogle(page));
});

test("Flow 9 paso 14: sin sesión no espera a Noto, se va a los 0,5 s y Noto sigue bajando", async ({ page }) => {
  const noto = await retain(page, NOTO_FILE);
  const a = await openStopped(page, HOUR);
  await a.toMount(page.getByText("Entrar con Google"));
  await a.staysA(0.4);
  await a.goesA(0.5);
  await expect(enterWithGoogle(page)).toBeVisible();
  await withAtkinson(page, enterWithGoogle(page));
  expect(noto.requests()).toBe(1);
  noto.release();
});

test("Flow 9 paso 14: si se entra antes de que llegue Noto, emoji del dispositivo y cambian solos", async ({ page }) => {
  const noto = await retain(page, NOTO_FILE);
  await enter(page);
  await createAndView(page, {
    title: "Regar",
    kind: "Intervalo",
    every: "2",
    unit: "días",
    emoji: "🌱",
  });
  // The sign-in screen already requested Noto; signing in does not reload, so the download is the same.
  await withEmojiOfDevice(page);
  await withoutNotices(page);
  noto.release();
  await inAtkinsonAndNoto(page);
  await withoutNotices(page);
});

// ---------------------------------------------------------------------------
// What will never arrive
// ---------------------------------------------------------------------------

test("Flow 9 paso 17: con Noto demorado, perder la conexión a los 2 s la cierra en ese momento", async ({
  page,
}) => {
  await sessionWithTask(page);
  await forgetFonts(page);
  await retain(page, NOTO_FILE);
  const a = await reloadStopped(page);
  await a.staysA(2);
  await page.context().setOffline(true);
  await a.goesRightAway();
  await page.context().setOffline(false);
});

test("Flow 9 paso 18: con falla de Noto a los 2 s y los datos demorados 5 s, se va a los 5 s", async ({
  page,
  browser,
}) => {
  await sessionWithTask(page);
  const b = await otherDeviceWithSession(browser, page);
  const noto = await retain(b.page, NOTO_FILE);
  const data = await retain(b.page, DATA);
  const a = await openStopped(b.page, HOUR);
  await a.staysA(2);
  noto.cut();
  await a.staysA(4.9);
  await a.to(5);
  await expect(screenName(b.page)).toBeVisible();
  data.release();
  await a.goesRightAway();
  await b.ctx.close();
});

test("Flow 9 paso 19: con falla de Noto y todo lo demás listo, el mínimo vale igual", async ({ page }) => {
  await sessionWithTask(page);
  await forgetFonts(page);
  const noto = await networkFailure(page, NOTO_FILE);
  const a = await reloadStopped(page);
  await a.toMount(page.getByText("Regar"));
  await expect.poll(noto.requests).toBeGreaterThan(0);
  await a.staysA(0.4);
  await a.to(0.499, 1);
  await expect(screenName(page)).toBeVisible();
  await a.goesA(0.5);
  await withEmojiOfDevice(page);
  await withoutNotices(page);
});

// ---------------------------------------------------------------------------
// Noto cap remembered per device
// ---------------------------------------------------------------------------

test("Flow 9 pasos 20 a 22: el tope con Noto sin bajar lo recuerda solo ese dispositivo, hasta que Noto queda guardado o cambia el juego", async ({
  browser,
}) => {
  test.setTimeout(240_000);
  const root = join(process.cwd(), "tmp", "fuente-tope");
  const v1 = join(root, "v1");
  const v2 = join(root, "v2");
  rmSync(root, { recursive: true, force: true });
  mkdirSync(root, { recursive: true });
  cpSync(join(process.cwd(), "build"), v1, { recursive: true });
  versionWithOtherSet(v1, v2);
  const status = { dir: v1 };
  const server = await serve(status);
  const ctx = await browser.newContext({
    baseURL: ORIGIN_VERSIONS,
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
  });
  try {
    const page = await ctx.newPage();
    await sessionWithTask(page);
    await forgetFonts(page);

    // Step 20: it reaches the cap with Noto delayed and enters with the device emoji.
    const noto = await retain(page, NOTO_FILE);
    let a = await reloadStopped(page);
    await a.staysA(9.9);
    await a.goesA(10);
    await withEmojiOfDevice(page);
    await withoutNotices(page);

    // Without Noto having arrived, reload: it goes away at 0.5 s, and Noto keeps being requested behind it.
    const before = noto.requests();
    a = await reloadStopped(page);
    await a.toMount(page.getByText("Regar"));
    await a.staysA(0.4);
    await a.goesA(0.5);
    await withEmojiOfDevice(page);
    await expect.poll(noto.requests).toBeGreaterThan(before);

    // Step 21: a device B with the same account does wait for it, and Firestore gained nothing.
    const uid = await accountUid();
    const inFirestore = await userAll(uid);
    const b = await otherDeviceWithSession(browser, page);
    await retain(b.page, NOTO_FILE);
    const inB = await openStopped(b.page, HOUR);
    await inB.staysA(9.9);
    await inB.goesA(10);
    await b.ctx.close();
    expect(await userAll(uid)).toBe(inFirestore);
    expect(inFirestore).not.toMatch(/tope/i);

    // Step 22: Noto is released until it is stored.
    noto.release();
    await withClock(page, () => inAtkinsonAndNoto(page));
    await page.waitForTimeout(500);

    // A version that changes the emoji set, delayed: the next opening waits for it again, up to the cap.
    status.dir = v2;
    await page.unrouteAll({ behavior: "ignoreErrors" });
    await retain(page, NOTO_FILE);
    a = await reloadStopped(page);
    await a.staysA(9.9);
    await a.goesA(10);
    await withEmojiOfDevice(page);
    // It reached the cap: the next one no longer waits for it.
    a = await reloadStopped(page);
    await a.toMount(page.getByText("Regar"));
    await a.staysA(0.4);
    await a.goesA(0.5);
    await withEmojiOfDevice(page);
  } finally {
    await ctx.close();
    server.close();
  }
});

test("Flow 9 paso 23: el tiempo sin sesión no cuenta como tope con Noto", async ({ page }) => {
  await retain(page, NOTO_FILE);
  await page.goto("/");
  await expect(enterWithGoogle(page)).toBeVisible();
  // No simulated clock, because the sign-in popup does not tolerate it: the 10 s really pass.
  await page.waitForTimeout(10_500);
  await completeEntry(page);
  await page.clock.install({ time: new Date(HOUR) });
  const a = await reloadStopped(page);
  await a.staysA(9.9);
  await a.goesA(10);
});
