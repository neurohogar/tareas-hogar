import {
  expect,
  type Browser,
  type BrowserContext,
  type Locator,
  type Page,
  type Route,
} from "@playwright/test";
import { workerUids } from "./support";

// Helpers for the qa/bundled-font.md procedure (loading screen, Flows 5, 8 and 9).

export const ATKINSON_FILES = /\/fuentes\/atkinson-.*\.woff2/;
export const ATKINSON_FILE =
  /\/fuentes\/atkinson-hyperlegible-next-latin-400-normal\.woff2/;
export const NOTO_FILE = /\/fuentes\/noto-color-emoji.*\.woff2/;
/** Tasks and completions travel together: the SDK sends the queries in a single request. */
export const DATA = /\/google\.firestore\.v1\.Firestore\/Listen\/channel/;
export const AUTH = /127\.0\.0\.1:9099\//;

export const screenName = (page: Page) =>
  page.getByRole("img", { name: "Cargando" });

export const textVisible = (page: Page) => page.locator("body").innerText();

/** No notice of any kind in view. The "Sin conexión" strip (§7) is not a font notice. */
export async function withoutNotices(page: Page) {
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(
    page.getByRole("status").filter({ hasNotText: "Sin conexión" }),
  ).toHaveCount(0);
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export interface Retained {
  /** How many requests went through here. */
  requests: () => number;
  /** Lets the held requests and any future ones continue. */
  release: () => void;
  /** Cuts the held requests with a network error; future ones continue. */
  cut: () => void;
}

/** **Delayed request**: requests are held, without a response, until they are released. */
export async function retain(
  target: Page | BrowserContext,
  pattern: RegExp,
): Promise<Retained> {
  let n = 0;
  let decide: (d: "seguir" | "cortar") => void = () => {};
  const decision = new Promise<"seguir" | "cortar">((r) => (decide = r));
  await target.route(pattern, async (route: Route) => {
    n++;
    const d = await decision;
    // The page may have gone away in the meantime.
    await (d === "seguir" ? route.continue() : route.abort("connectionfailed")).catch(
      () => {},
    );
  });
  return {
    requests: () => n,
    release: () => decide("seguir"),
    cut: () => decide("cortar"),
  };
}

/** **Network failure**: requests are cut with a network error until `quitar`. Counts the requests. */
export async function networkFailure(target: Page | BrowserContext, pattern: RegExp) {
  let n = 0;
  let active = true;
  await target.route(pattern, async (route: Route) => {
    n++;
    await (active ? route.abort("connectionfailed") : route.continue()).catch(
      () => {},
    );
  });
  return {
    requests: () => n,
    remove: () => {
      active = false;
    },
  };
}

// ---------------------------------------------------------------------------
// Openings with the stopped clock
// ---------------------------------------------------------------------------

const STEP_MS = 50;
const PAUSE_REAL_MS = 15;

/**
 * An opening with the simulated clock stopped: the screen's time is whatever the script lets pass.
 * It advances in short steps and gives real time in between, so that network responses arrive and
 * the timers that process them run.
 */
export class Opening {
  private ms = 0;
  constructor(readonly page: Page) {}

  async to(seconds: number, step = STEP_MS) {
    const target = Math.round(seconds * 1000);
    while (this.ms < target) {
      const span = Math.min(step, target - this.ms);
      await this.page.clock.runFor(span);
      this.ms += span;
      await this.page.waitForTimeout(PAUSE_REAL_MS);
    }
  }

  /** 1 ms at a time until `detras` is mounted behind the screen: what it waits for has already responded. */
  async toMount(behind: Locator) {
    for (let i = 0; i < 350; i++) {
      if ((await behind.count()) > 0) return;
      await this.to(this.ms / 1000 + 0.001, 1);
    }
    throw new Error("it was not mounted behind the loading screen before 0.35 s");
  }

  /** At `segundos`, it is still open and with no text in view. */
  async staysA(seconds: number) {
    await this.to(seconds);
    await expect(screenName(this.page)).toBeVisible();
    expect(await textVisible(this.page)).toBe("");
  }

  /** On reaching `segundos`, it goes away. */
  async goesA(seconds: number) {
    await this.to(seconds);
    await expect(screenName(this.page)).toHaveCount(0, { timeout: 5_000 });
  }

  /** It goes away without the script having to let more than a few tenths pass: what it was waiting for has already arrived. */
  async goesRightAway() {
    const cap = this.ms / 1000 + 0.3;
    await expect(async () => {
      if (this.ms / 1000 < cap) await this.to(this.ms / 1000 + 0.005, 5);
      await expect(screenName(this.page)).toHaveCount(0, { timeout: 100 });
    }).toPass({ intervals: [10] });
  }
}

/** Stops the (already installed) clock one second after now. */
export async function stopClock(page: Page) {
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(new Date(now + 1000));
}

export async function reloadStopped(page: Page): Promise<Opening> {
  await stopClock(page);
  await page.reload();
  return new Opening(page);
}

/** Installs the stopped clock before opening and opens the app without waiting for it to load. */
export async function openStopped(
  page: Page,
  hour: string,
  path = "/",
): Promise<Opening> {
  await page.clock.install({ time: new Date(hour) });
  await page.clock.pauseAt(new Date(new Date(hour).getTime() + 1000));
  await page.goto(path);
  return new Opening(page);
}

// ---------------------------------------------------------------------------
// Devices and stored data
// ---------------------------------------------------------------------------

/** Empties the stored fonts: what is stored works even if the network is blocked. It is setup, not a user step. */
export const forgetFonts = (page: Page) =>
  page.evaluate(() => caches.delete("tareas-hogar-fuentes"));

const AUTH_BASE = "firebaseLocalStorageDb";

/**
 * Another device with the same account: the session already started and nothing else stored, no data, no
 * fonts, nothing the device remembers. The emulator popup does not tolerate the stopped clock.
 */
export async function otherDeviceWithSession(
  browser: Browser,
  page: Page,
): Promise<{ ctx: BrowserContext; page: Page }> {
  const origin = new URL(page.url()).origin;
  const status = await page.context().storageState({ indexedDB: true });
  const ctx = await browser.newContext({
    baseURL: origin,
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
    storageState: {
      cookies: [],
      origins: status.origins
        .filter((o) => o.origin === origin)
        .map((o) => ({
          ...o,
          localStorage: [],
          indexedDB: (o.indexedDB ?? []).filter((d) => d.name === AUTH_BASE),
        })),
    },
  });
  return { ctx, page: await ctx.newPage() };
}

/** Records every time the loading screen appears on an already open page. */
export async function watchScreen(page: Page): Promise<() => Promise<number>> {
  await page.evaluate(() => {
    const w = window as unknown as { qaScreenView: number };
    w.qaScreenView = 0;
    new MutationObserver((changes) => {
      for (const c of changes)
        for (const n of c.addedNodes)
          if (n instanceof Element && n.querySelector('[aria-label="Cargando"]'))
            w.qaScreenView++;
    }).observe(document, { subtree: true, childList: true });
  });
  return () =>
    page.evaluate(
      () => (window as unknown as { qaScreenView: number }).qaScreenView,
    );
}

// ---------------------------------------------------------------------------
// Firestore Emulator: what cannot be produced or read through the interface
// ---------------------------------------------------------------------------

const PROJECT = "demo-tareas-hogar";
const DOCS = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
const AS_ADMIN = { Authorization: "Bearer owner", "Content-Type": "application/json" };

/** The uid of this worker's account in the Auth Emulator. */
export async function accountUid(): Promise<string> {
  const [uid] = await workerUids();
  if (uid === undefined) throw new Error("this worker has no account in the Auth emulator");
  return uid;
}

export interface DocRest {
  name: string;
  fields: Record<string, unknown>;
}

export async function docs(uid: string, collection: string): Promise<DocRest[]> {
  const r = await fetch(`${DOCS}/users/${uid}/${collection}`, { headers: AS_ADMIN });
  return ((await r.json()) as { documents?: DocRest[] }).documents ?? [];
}

export async function saveDoc(
  uid: string,
  collection: string,
  id: string,
  fields: Record<string, unknown>,
) {
  const r = await fetch(`${DOCS}/users/${uid}/${collection}/${id}`, {
    method: "PATCH",
    headers: AS_ADMIN,
    body: JSON.stringify({ fields }),
  });
  expect(r.ok).toBe(true);
}

/** Everything in Firestore under the user, to check that nothing appeared. */
export async function userAll(uid: string): Promise<string> {
  const r = await fetch(`${DOCS}/users/${uid}:listCollectionIds`, {
    method: "POST",
    headers: AS_ADMIN,
    body: "{}",
  });
  const { collectionIds = [] } = (await r.json()) as { collectionIds?: string[] };
  const parts = await Promise.all(
    [...collectionIds].sort().map(async (c) => [c, await docs(uid, c)]),
  );
  return JSON.stringify(parts);
}
