import {
  expect,
  type Browser,
  type BrowserContext,
  type Locator,
  type Page,
  type Route,
} from "@playwright/test";

// Ayudantes del procedimiento qa/fuente-empaquetada.md (pantalla de carga, Flujos 5, 8 y 9).

export const ATKINSON_FILES = /\/fuentes\/atkinson-.*\.woff2/;
export const ATKINSON_FILE =
  /\/fuentes\/atkinson-hyperlegible-next-latin-400-normal\.woff2/;
export const NOTO_FILE = /\/fuentes\/noto-color-emoji.*\.woff2/;
/** Tareas y completados viajan juntos: el SDK manda las consultas en un solo pedido. */
export const DATA = /\/google\.firestore\.v1\.Firestore\/Listen\/channel/;
export const AUTH = /127\.0\.0\.1:9099\//;

export const screenName = (page: Page) =>
  page.getByRole("img", { name: "Cargando" });

export const textVisible = (page: Page) => page.locator("body").innerText();

/** Sin aviso de ningún tipo a la vista. La franja "Sin conexión" (§7) no es un aviso de la fuente. */
export async function withoutNotices(page: Page) {
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(
    page.getByRole("status").filter({ hasNotText: "Sin conexión" }),
  ).toHaveCount(0);
}

// ---------------------------------------------------------------------------
// Pedidos
// ---------------------------------------------------------------------------

export interface Retained {
  /** Cuántos pedidos pasaron por acá. */
  requests: () => number;
  /** Deja seguir los retenidos y los que vengan. */
  release: () => void;
  /** Corta los retenidos con un error de red; los que vengan siguen. */
  cut: () => void;
}

/** **Pedido demorado**: los pedidos quedan retenidos, sin respuesta, hasta que se los libera. */
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
    // La página pudo haberse ido mientras tanto.
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

/** **Falla de red**: los pedidos se cortan con un error de red hasta `quitar`. Cuenta los pedidos. */
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
// Aperturas con el reloj detenido
// ---------------------------------------------------------------------------

const STEP_MS = 50;
const PAUSE_REAL_MS = 15;

/**
 * Una apertura con el reloj simulado detenido: el tiempo de la pantalla es el que deja pasar el script.
 * Avanza por tramos cortos y da tiempo real entre ellos, para que lleguen las respuestas de red y
 * corran los temporizadores que las procesan.
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

  /** De a 1 ms hasta que `detras` está montado detrás de la pantalla: lo que espera ya respondió. */
  async toMount(behind: Locator) {
    for (let i = 0; i < 350; i++) {
      if ((await behind.count()) > 0) return;
      await this.to(this.ms / 1000 + 0.001, 1);
    }
    throw new Error("no se montó detrás de la pantalla de carga antes de los 0,35 s");
  }

  /** A los `segundos`, sigue abierta y sin ningún texto a la vista. */
  async staysA(seconds: number) {
    await this.to(seconds);
    await expect(screenName(this.page)).toBeVisible();
    expect(await textVisible(this.page)).toBe("");
  }

  /** Al llegar a los `segundos`, se va. */
  async goesA(seconds: number) {
    await this.to(seconds);
    await expect(screenName(this.page)).toHaveCount(0, { timeout: 5_000 });
  }

  /** Se va sin que el script tenga que dejar pasar más que unas décimas: lo que esperaba ya llegó. */
  async goesRightAway() {
    const cap = this.ms / 1000 + 0.3;
    await expect(async () => {
      if (this.ms / 1000 < cap) await this.to(this.ms / 1000 + 0.005, 5);
      await expect(screenName(this.page)).toHaveCount(0, { timeout: 100 });
    }).toPass({ intervals: [10] });
  }
}

/** Para el reloj (ya instalado) un segundo después de ahora. */
export async function stopClock(page: Page) {
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(new Date(now + 1000));
}

export async function reloadStopped(page: Page): Promise<Opening> {
  await stopClock(page);
  await page.reload();
  return new Opening(page);
}

/** Instala el reloj detenido antes de abrir y abre la app sin esperar a que cargue. */
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
// Dispositivos y datos guardados
// ---------------------------------------------------------------------------

/** Vacía las fuentes guardadas: lo guardado sirve aunque se bloquee la red. Es preparación, no un paso del usuario. */
export const forgetFonts = (page: Page) =>
  page.evaluate(() => caches.delete("tareas-hogar-fuentes"));

const AUTH_BASE = "firebaseLocalStorageDb";

/**
 * Otro dispositivo con la misma cuenta: la sesión ya iniciada y nada más guardado, ni datos, ni
 * fuentes, ni lo que recuerda el dispositivo. El popup del emulador no tolera el reloj detenido.
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

/** Registra cada vez que la pantalla de carga aparece en una página ya abierta. */
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
// Firestore Emulator: lo que no se puede producir ni leer por la interfaz
// ---------------------------------------------------------------------------

const PROJECT = "demo-tareas-hogar";
const DOCS = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
const AS_ADMIN = { Authorization: "Bearer owner", "Content-Type": "application/json" };

/** El uid de la única cuenta del Auth Emulator. */
export async function accountUid(): Promise<string> {
  const r = await fetch(
    `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:query`,
    { method: "POST", headers: AS_ADMIN, body: "{}" },
  );
  const response = await r.text();
  const { userInfo } = JSON.parse(response) as { userInfo?: { localId: string }[] };
  if (userInfo === undefined) throw new Error(`sin cuentas: ${response}`);
  return userInfo[0].localId;
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

/** Todo lo que hay en Firestore bajo el usuario, para comparar que no apareció nada. */
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
