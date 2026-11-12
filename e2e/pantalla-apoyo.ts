import {
  expect,
  type Browser,
  type BrowserContext,
  type Locator,
  type Page,
  type Route,
} from "@playwright/test";

// Ayudantes del procedimiento qa/fuente-empaquetada.md (pantalla de carga, Flujos 5, 8 y 9).

export const ATKINSON_ARCHIVOS = /\/fuentes\/atkinson-.*\.woff2/;
export const UN_ARCHIVO_DE_ATKINSON =
  /\/fuentes\/atkinson-hyperlegible-next-latin-400-normal\.woff2/;
export const NOTO_ARCHIVO = /\/fuentes\/noto-color-emoji.*\.woff2/;
/** Tareas, completados y etiquetas viajan juntos: el SDK manda las tres consultas en un solo pedido. */
export const DATOS = /\/google\.firestore\.v1\.Firestore\/Listen\/channel/;
export const AUTH = /127\.0\.0\.1:9099\//;

export const pantalla = (page: Page) =>
  page.getByRole("img", { name: "Cargando" });

export const textoVisible = (page: Page) => page.locator("body").innerText();

/** Sin aviso de ningún tipo a la vista. La franja "Sin conexión" (§7) no es un aviso de la fuente. */
export async function sinAvisos(page: Page) {
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(
    page.getByRole("status").filter({ hasNotText: "Sin conexión" }),
  ).toHaveCount(0);
}

// ---------------------------------------------------------------------------
// Pedidos
// ---------------------------------------------------------------------------

export interface Retenido {
  /** Cuántos pedidos pasaron por acá. */
  pedidos: () => number;
  /** Deja seguir los retenidos y los que vengan. */
  liberar: () => void;
  /** Corta los retenidos con un error de red; los que vengan siguen. */
  cortar: () => void;
}

/** **Pedido demorado**: los pedidos quedan retenidos, sin respuesta, hasta que se los libera. */
export async function retener(
  objetivo: Page | BrowserContext,
  patron: RegExp,
): Promise<Retenido> {
  let n = 0;
  let decidir: (d: "seguir" | "cortar") => void = () => {};
  const decision = new Promise<"seguir" | "cortar">((r) => (decidir = r));
  await objetivo.route(patron, async (route: Route) => {
    n++;
    const d = await decision;
    // La página pudo haberse ido mientras tanto.
    await (d === "seguir" ? route.continue() : route.abort("connectionfailed")).catch(
      () => {},
    );
  });
  return {
    pedidos: () => n,
    liberar: () => decidir("seguir"),
    cortar: () => decidir("cortar"),
  };
}

/** **Falla de red**: los pedidos se cortan con un error de red hasta `quitar`. Cuenta los pedidos. */
export async function fallaDeRed(objetivo: Page | BrowserContext, patron: RegExp) {
  let n = 0;
  let activa = true;
  await objetivo.route(patron, async (route: Route) => {
    n++;
    await (activa ? route.abort("connectionfailed") : route.continue()).catch(
      () => {},
    );
  });
  return {
    pedidos: () => n,
    quitar: () => {
      activa = false;
    },
  };
}

// ---------------------------------------------------------------------------
// Aperturas con el reloj detenido
// ---------------------------------------------------------------------------

const PASO_MS = 50;
const PAUSA_REAL_MS = 15;

/**
 * Una apertura con el reloj simulado detenido: el tiempo de la pantalla es el que deja pasar el script.
 * Avanza por tramos cortos y da tiempo real entre ellos, para que lleguen las respuestas de red y
 * corran los temporizadores que las procesan.
 */
export class Apertura {
  private ms = 0;
  constructor(readonly page: Page) {}

  async hasta(segundos: number, paso = PASO_MS) {
    const destino = Math.round(segundos * 1000);
    while (this.ms < destino) {
      const tramo = Math.min(paso, destino - this.ms);
      await this.page.clock.runFor(tramo);
      this.ms += tramo;
      await this.page.waitForTimeout(PAUSA_REAL_MS);
    }
  }

  /** De a 1 ms hasta que `detras` está montado detrás de la pantalla: lo que espera ya respondió. */
  async hastaMontar(detras: Locator) {
    for (let i = 0; i < 350; i++) {
      if ((await detras.count()) > 0) return;
      await this.hasta(this.ms / 1000 + 0.001, 1);
    }
    throw new Error("no se montó detrás de la pantalla de carga antes de los 0,35 s");
  }

  /** A los `segundos`, sigue abierta y sin ningún texto a la vista. */
  async sigueA(segundos: number) {
    await this.hasta(segundos);
    await expect(pantalla(this.page)).toBeVisible();
    expect(await textoVisible(this.page)).toBe("");
  }

  /** Al llegar a los `segundos`, se va. */
  async seVaA(segundos: number) {
    await this.hasta(segundos);
    await expect(pantalla(this.page)).toHaveCount(0, { timeout: 5_000 });
  }

  /** Se va sin que el script tenga que dejar pasar más que unas décimas: lo que esperaba ya llegó. */
  async seVaEnseguida() {
    const tope = this.ms / 1000 + 0.3;
    await expect(async () => {
      if (this.ms / 1000 < tope) await this.hasta(this.ms / 1000 + 0.005, 5);
      await expect(pantalla(this.page)).toHaveCount(0, { timeout: 100 });
    }).toPass({ intervals: [10] });
  }
}

/** Para el reloj (ya instalado) un segundo después de ahora. */
export async function detenerReloj(page: Page) {
  const ahora = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(new Date(ahora + 1000));
}

export async function recargarDetenida(page: Page): Promise<Apertura> {
  await detenerReloj(page);
  await page.reload();
  return new Apertura(page);
}

/** Instala el reloj detenido antes de abrir y abre la app sin esperar a que cargue. */
export async function abrirDetenida(
  page: Page,
  hora: string,
  ruta = "/",
): Promise<Apertura> {
  await page.clock.install({ time: new Date(hora) });
  await page.clock.pauseAt(new Date(new Date(hora).getTime() + 1000));
  await page.goto(ruta);
  return new Apertura(page);
}

// ---------------------------------------------------------------------------
// Dispositivos y datos guardados
// ---------------------------------------------------------------------------

/** Vacía las fuentes guardadas: lo guardado sirve aunque se bloquee la red. Es preparación, no un paso del usuario. */
export const olvidarFuentes = (page: Page) =>
  page.evaluate(() => caches.delete("tareas-hogar-fuentes"));

const BASE_DE_AUTH = "firebaseLocalStorageDb";

/**
 * Otro dispositivo con la misma cuenta: la sesión ya iniciada y nada más guardado, ni datos, ni
 * fuentes, ni lo que recuerda el dispositivo. El popup del emulador no tolera el reloj detenido.
 */
export async function otroDispositivoConSesion(
  browser: Browser,
  page: Page,
): Promise<{ ctx: BrowserContext; page: Page }> {
  const origen = new URL(page.url()).origin;
  const estado = await page.context().storageState({ indexedDB: true });
  const ctx = await browser.newContext({
    baseURL: origen,
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
    storageState: {
      cookies: [],
      origins: estado.origins
        .filter((o) => o.origin === origen)
        .map((o) => ({
          ...o,
          localStorage: [],
          indexedDB: (o.indexedDB ?? []).filter((d) => d.name === BASE_DE_AUTH),
        })),
    },
  });
  return { ctx, page: await ctx.newPage() };
}

/** Registra cada vez que la pantalla de carga aparece en una página ya abierta. */
export async function vigilarPantalla(page: Page): Promise<() => Promise<number>> {
  await page.evaluate(() => {
    const w = window as unknown as { qaPantallaVista: number };
    w.qaPantallaVista = 0;
    new MutationObserver((cambios) => {
      for (const c of cambios)
        for (const n of c.addedNodes)
          if (n instanceof Element && n.querySelector('[aria-label="Cargando"]'))
            w.qaPantallaVista++;
    }).observe(document, { subtree: true, childList: true });
  });
  return () =>
    page.evaluate(
      () => (window as unknown as { qaPantallaVista: number }).qaPantallaVista,
    );
}

// ---------------------------------------------------------------------------
// Firestore Emulator: lo que no se puede producir ni leer por la interfaz
// ---------------------------------------------------------------------------

const PROYECTO = "demo-tareas-hogar";
const DOCUMENTOS = `http://127.0.0.1:8080/v1/projects/${PROYECTO}/databases/(default)/documents`;
const COMO_ADMIN = { Authorization: "Bearer owner", "Content-Type": "application/json" };

/** El uid de la única cuenta del Auth Emulator. */
export async function uidDeLaCuenta(): Promise<string> {
  const r = await fetch(
    `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/${PROYECTO}/accounts:query`,
    { method: "POST", headers: COMO_ADMIN, body: "{}" },
  );
  const respuesta = await r.text();
  const { userInfo } = JSON.parse(respuesta) as { userInfo?: { localId: string }[] };
  if (userInfo === undefined) throw new Error(`sin cuentas: ${respuesta}`);
  return userInfo[0].localId;
}

export interface DocumentoRest {
  name: string;
  fields: Record<string, unknown>;
}

export async function documentos(uid: string, coleccion: string): Promise<DocumentoRest[]> {
  const r = await fetch(`${DOCUMENTOS}/users/${uid}/${coleccion}`, { headers: COMO_ADMIN });
  return ((await r.json()) as { documents?: DocumentoRest[] }).documents ?? [];
}

export async function guardarDocumento(
  uid: string,
  coleccion: string,
  id: string,
  fields: Record<string, unknown>,
) {
  const r = await fetch(`${DOCUMENTOS}/users/${uid}/${coleccion}/${id}`, {
    method: "PATCH",
    headers: COMO_ADMIN,
    body: JSON.stringify({ fields }),
  });
  expect(r.ok).toBe(true);
}

/** Todo lo que hay en Firestore bajo el usuario, para comparar que no apareció nada. */
export async function todoLoDelUsuario(uid: string): Promise<string> {
  const r = await fetch(`${DOCUMENTOS}/users/${uid}:listCollectionIds`, {
    method: "POST",
    headers: COMO_ADMIN,
    body: "{}",
  });
  const { collectionIds = [] } = (await r.json()) as { collectionIds?: string[] };
  const partes = await Promise.all(
    [...collectionIds].sort().map(async (c) => [c, await documentos(uid, c)]),
  );
  return JSON.stringify(partes);
}
