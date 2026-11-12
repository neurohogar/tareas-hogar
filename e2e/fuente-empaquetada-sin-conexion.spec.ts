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
  abrir,
  abrirSelector,
  buscadorEmoji,
  completarEntrada,
  controlada,
  crear,
  dispositivo,
  emojiExacto,
  entrar,
  fila,
  limpiarEmuladores,
  selectorEmoji,
} from "./apoyo";
import { conAtkinson, conNoto, repartoEs } from "./fuente-apoyo";
import {
  Apertura,
  ATKINSON_ARCHIVOS,
  fallaDeRed,
  NOTO_ARCHIVO,
  olvidarFuentes,
  pantalla,
  recargarDetenida,
  sinAvisos,
  textoVisible,
  UN_ARCHIVO_DE_ATKINSON,
} from "./pantalla-apoyo";
import {
  cachesDe,
  hayVersionEsperando,
  ORIGEN_VERSIONES,
  servir,
  versionConLasMismasFuentes,
  versionDe,
  versionSinFuentes,
} from "./versiones-apoyo";

// Esta suite habla del service worker: lo permite (las demás lo bloquean).
test.use({ serviceWorkers: "allow" });

const HORA = "2026-07-15T08:00:00";
const ANTES_DEL_TOPE = { timeout: 9_000 };

test.beforeEach(async () => {
  await limpiarEmuladores();
});

const pendientes = (page: Page) =>
  page.getByRole("heading", { name: "Pendientes", level: 1 });

async function sesion(browser: Browser) {
  const d = await dispositivo(browser, HORA, true);
  await controlada(d.page);
  await expect(pendientes(d.page)).toBeVisible();
  return d;
}

const tituloDe = (page: Page, t: string) =>
  fila(page, t).getByRole("button").first();

test("Flujo 4 pasos 2 a 4: sin conexión, con Atkinson y Noto, también un emoji nunca visto", async ({
  browser,
}) => {
  const { ctx, page } = await sesion(browser);
  await crear(page, {
    titulo: "Regar",
    tipo: "Intervalo",
    cada: "2",
    unidad: "días",
    emoji: "🌱",
  });
  await expect(fila(page, "Regar")).toBeVisible();
  await controlada(page);

  // Paso 2: sin conexión y recargando, abre con Atkinson y Noto.
  await ctx.setOffline(true);
  await page.reload();
  await expect(pendientes(page)).toBeVisible();
  const titulo = tituloDe(page, "Regar");
  await repartoEs(page, titulo, ([a, n, o]) => a >= 5 && n === 1 && o === 0);
  await conAtkinson(page, pendientes(page));

  // Paso 3: un emoji que no se usó en este dispositivo, desde el selector.
  await abrir(page, "Regar");
  await abrirSelector(page);
  await buscadorEmoji(page).fill("medusa");
  const medusa = emojiExacto(page, "🪼");
  await expect(medusa).toHaveCount(1);
  await conNoto(page, medusa);
  await selectorEmoji(page).getByRole("button", { name: "Cerrar" }).click();
  await page.getByRole("button", { name: "Cerrar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Paso 4: escrito en el título de una tarea nueva.
  await page.getByRole("button", { name: "+" }).click();
  await page.getByLabel("Título").fill("Medusa 🪼");
  await repartoEs(
    page,
    page.getByLabel("Título"),
    ([a, n, o]) => a >= 6 && n === 1 && o === 0,
  );
  await ctx.close();
});

// ---------------------------------------------------------------------------
// Flujo 7: dos versiones servidas en el mismo origen (e2e/versiones-apoyo.ts)
// ---------------------------------------------------------------------------

const AVISO = /actualiz|nueva versi[oó]n|recarg|reinici/i;

/** Registra toda pregunta o aviso que aparezca en cualquier página del contexto, en cualquier momento. */
async function vigilarAvisos(ctx: BrowserContext): Promise<string[]> {
  const vistos: string[] = [];
  ctx.on("dialog", (d) => {
    vistos.push(`dialog: ${d.message()}`);
    void d.dismiss();
  });
  await ctx.exposeBinding("qaAvisoVisto", (_fuente, texto: string) => {
    vistos.push(texto);
  });
  await ctx.addInitScript((patron) => {
    const aviso = new RegExp(patron, "i");
    const avisar = (n: Element) =>
      // La franja "Sin conexión" (§7) es de la app, no un aviso de la versión ni de la fuente.
      n.textContent?.trim() !== "Sin conexión" &&
      (window as unknown as Record<string, (t: string) => void>).qaAvisoVisto(
        `${n.getAttribute("role") ?? n.tagName}: ${n.textContent}`,
      );
    new MutationObserver((cambios) => {
      for (const c of cambios)
        for (const n of c.addedNodes) {
          if (!(n instanceof Element)) continue;
          const roles =
            "[role=alert],[role=alertdialog],[role=dialog],[role=status],dialog";
          const encontrados = [
            ...(n.matches(roles) ? [n] : []),
            ...n.querySelectorAll(roles),
          ];
          encontrados.forEach(avisar);
          if (aviso.test(n.textContent ?? "")) avisar(n);
        }
    }).observe(document, { subtree: true, childList: true });
  }, AVISO.source);
  return vistos;
}

/** Una carpeta limpia con el build actual (`nueva`) y `derivar` aplicado sobre él (`otra`). */
function dosVersiones(
  nombre: string,
  derivar: (origen: string, destino: string) => void,
) {
  const raiz = join(process.cwd(), "tmp", nombre);
  const nueva = join(raiz, "nueva");
  const otra = join(raiz, "otra");
  rmSync(raiz, { recursive: true, force: true });
  mkdirSync(raiz, { recursive: true });
  cpSync(join(process.cwd(), "build"), nueva, { recursive: true });
  derivar(nueva, otra);
  return { nueva, otra };
}

const contextoDeVersiones = (browser: Browser) =>
  browser.newContext({
    baseURL: ORIGEN_VERSIONES,
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
  });

/** Publica `dir` con la app abierta: la versión nueva se instala sola y espera. */
async function publicar(
  ctx: BrowserContext,
  estado: { dir: string },
  dir: string,
) {
  estado.dir = dir;
  const otra = await ctx.newPage();
  await otra.goto("/");
  await expect(pendientes(otra)).toBeVisible();
  await expect(async () => {
    expect(await hayVersionEsperando(otra)).toBe(true);
  }).toPass();
  await otra.close();
}

/** Cierra `page` y abre la app hasta que se aplicó la versión de `dir`. */
async function reabrirConVersion(ctx: BrowserContext, page: Page, dir: string) {
  await page.close();
  await expect(async () => {
    const intento = await ctx.newPage();
    try {
      await intento.goto("/");
      await expect(pendientes(intento)).toBeVisible();
      expect(await cachesDe(intento)).toEqual([`tareas-hogar-${versionDe(dir)}`]);
    } finally {
      await intento.close();
    }
  }).toPass({ timeout: 30_000 });
  const reabierta = await ctx.newPage();
  await reabierta.goto("/");
  await expect(pantalla(reabierta)).toHaveCount(0, ANTES_DEL_TOPE);
  await expect(pendientes(reabierta)).toBeVisible();
  return reabierta;
}

test("Flujo 7: la versión con la fuente llega sola a quien tenía la anterior, sin preguntas ni avisos", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const { nueva, otra: anterior } = dosVersiones(
    "fuente-versiones",
    versionSinFuentes,
  );
  const estado = { dir: anterior };
  const servidor = await servir(estado);
  const ctx = await contextoDeVersiones(browser);
  try {
    // Paso 1: la app abierta con la versión anterior, sin fuentes propias.
    const page = await ctx.newPage();
    await entrar(page);
    await crear(page, { titulo: "Regar", tipo: "No se repite", emoji: "🌱" });
    await expect(fila(page, "Regar")).toBeVisible();
    await controlada(page);
    await expect(fila(page, "Regar")).toBeVisible();
    await repartoEs(
      page,
      tituloDe(page, "Regar"),
      ([a, n, o]) => a === 0 && n === 0 && o > 0,
    );
    const vistos = await vigilarAvisos(ctx);
    await page.reload();
    await expect(fila(page, "Regar")).toBeVisible();

    // Se publica la versión con la fuente y el juego: se instala sola y espera, con la app abierta.
    await publicar(ctx, estado, nueva);
    await expect(fila(page, "Regar")).toBeVisible();

    // Paso 2: se cierra la app y se abre de nuevo.
    const reabierta = await reabrirConVersion(ctx, page, nueva);
    await repartoEs(
      reabierta,
      tituloDe(reabierta, "Regar"),
      ([a, n, o]) => a >= 5 && n === 1 && o === 0,
    );
    await conAtkinson(reabierta, pendientes(reabierta));
    expect(vistos).toEqual([]);

    // Quedaron guardados: también sin conexión.
    await ctx.setOffline(true);
    await reabierta.reload();
    await repartoEs(
      reabierta,
      tituloDe(reabierta, "Regar"),
      ([a, n, o]) => a >= 5 && n === 1 && o === 0,
    );
  } finally {
    await ctx.close();
    servidor.close();
  }
});

// ---------------------------------------------------------------------------
// Flujo 8: la instalación no depende de la fuente ni del juego
// ---------------------------------------------------------------------------

/** Recarga y comprueba que la pantalla se va antes del tope de 10 s, en tiempo real. */
async function recargarAntesDelTope(page: Page) {
  await page.reload();
  await expect(pantalla(page)).toHaveCount(0, ANTES_DEL_TOPE);
  await expect(pendientes(page)).toBeVisible();
  await sinAvisos(page);
}

const crearRegar = (page: Page) =>
  crear(page, { titulo: "Regar", tipo: "Intervalo", cada: "2", unidad: "días", emoji: "🌱" });

const REGAR_ATKINSON_NOTO = ([a, n, o]: [number, number, number]) =>
  a >= 5 && n === 1 && o === 0;
const REGAR_ATKINSON_DISPOSITIVO = ([a, n, o]: [number, number, number]) =>
  a >= 5 && n === 0 && o >= 1;
const REGAR_SISTEMA_NOTO = ([a, n, o]: [number, number, number]) =>
  a === 0 && n === 1 && o >= 5;

/** Primera instalación: un contexto nuevo con la falla, entra, crea «Regar» y queda instalada. */
async function instalarConFalla(browser: Browser, patron: RegExp) {
  const d = await browser.newContext({
    baseURL: "http://127.0.0.1:4173",
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
  });
  const falla = await fallaDeRed(d, patron);
  const page = await d.newPage();
  await page.goto("/");
  await expect(pantalla(page)).toHaveCount(0, ANTES_DEL_TOPE);
  await completarEntrada(page);
  await crearRegar(page);
  await expect(fila(page, "Regar")).toBeVisible();
  await controlada(page);
  await expect(pantalla(page)).toHaveCount(0, ANTES_DEL_TOPE);
  await expect(fila(page, "Regar")).toBeVisible();
  return { ctx: d, page, falla };
}

test("Flujo 8 pasos 1 a 3: se instala con falla en el juego y, al quitarla, Noto queda también sin conexión", async ({
  browser,
}) => {
  const { ctx, page, falla } = await instalarConFalla(browser, NOTO_ARCHIVO);

  // Paso 2.
  await ctx.setOffline(true);
  await recargarAntesDelTope(page);
  await repartoEs(page, tituloDe(page, "Regar"), REGAR_ATKINSON_DISPOSITIVO);
  await sinAvisos(page);

  // Paso 3: sin cerrar la app alcanza, porque se vuelve a pedir al volver la red.
  falla.quitar();
  await ctx.setOffline(false);
  await repartoEs(page, tituloDe(page, "Regar"), REGAR_ATKINSON_NOTO);
  await sinAvisos(page);
  await ctx.setOffline(true);
  await recargarAntesDelTope(page);
  await repartoEs(page, tituloDe(page, "Regar"), REGAR_ATKINSON_NOTO);
  await page.getByRole("button", { name: "+" }).click();
  await page.getByLabel("Título").fill("Medusa 🪼");
  await repartoEs(page, page.getByLabel("Título"), ([a, n, o]) => a >= 6 && n === 1 && o === 0);
  await ctx.close();
});

test("Flujo 8 pasos 4 a 6: se instala con falla en un archivo de fuente y, al quitarla, Atkinson queda también sin conexión", async ({
  browser,
}) => {
  const { ctx, page, falla } = await instalarConFalla(browser, UN_ARCHIVO_DE_ATKINSON);

  // Paso 5: el juego de Atkinson se registra entero o nada, así que todo el texto va con la del sistema.
  await ctx.setOffline(true);
  await recargarAntesDelTope(page);
  await repartoEs(page, tituloDe(page, "Regar"), REGAR_SISTEMA_NOTO);
  await sinAvisos(page);

  // Paso 6.
  falla.quitar();
  await ctx.setOffline(false);
  await repartoEs(page, tituloDe(page, "Regar"), REGAR_ATKINSON_NOTO);
  await ctx.setOffline(true);
  await recargarAntesDelTope(page);
  await repartoEs(page, tituloDe(page, "Regar"), REGAR_ATKINSON_NOTO);
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
  const pedidos = new Map<string, number>();
  await ctx.route(/\/fuentes\/.*\.woff2/, async (route) => {
    const url = route.request().url();
    const n = (pedidos.get(url) ?? 0) + 1;
    pedidos.set(url, n);
    await (n === 1 ? route.abort("connectionfailed") : route.continue());
  });
  const page = await ctx.newPage();
  await entrar(page);
  await crearRegar(page);
  await expect(fila(page, "Regar")).toBeVisible();
  await repartoEs(page, tituloDe(page, "Regar"), REGAR_ATKINSON_NOTO);
  const archivos = [...pedidos.keys()];
  expect(archivos.filter((u) => ATKINSON_ARCHIVOS.test(u))).toHaveLength(6);
  expect(archivos.filter((u) => NOTO_ARCHIVO.test(u))).toHaveLength(1);
  for (const n of pedidos.values()) expect(n).toBeGreaterThan(1);

  await controlada(page);
  await ctx.setOffline(true);
  await recargarAntesDelTope(page);
  await repartoEs(page, tituloDe(page, "Regar"), REGAR_ATKINSON_NOTO);
  await ctx.close();
});

for (const caso of [
  {
    nombre: "el juego de emoji",
    pasos: "pasos 8 a 10",
    patron: NOTO_ARCHIVO,
    conFalla: REGAR_ATKINSON_DISPOSITIVO,
  },
  {
    nombre: "un archivo de fuente",
    pasos: "paso 11",
    patron: UN_ARCHIVO_DE_ATKINSON,
    conFalla: REGAR_SISTEMA_NOTO,
  },
]) {
  test(`Flujo 8 ${caso.pasos}: la versión nueva se aplica con falla en ${caso.nombre}`, async ({
    browser,
  }) => {
    test.setTimeout(180_000);
    const { nueva, otra: anterior } = dosVersiones(
      "fuente-actualizacion",
      versionSinFuentes,
    );
    const estado = { dir: anterior };
    const servidor = await servir(estado);
    const ctx = await contextoDeVersiones(browser);
    try {
      // Versión anterior instalada.
      const page = await ctx.newPage();
      await entrar(page);
      await crearRegar(page);
      await expect(fila(page, "Regar")).toBeVisible();
      await controlada(page);
      await expect(fila(page, "Regar")).toBeVisible();
      const vistos = await vigilarAvisos(ctx);

      // Paso 8: se publica con la falla; cerrar y abrir aplica la versión nueva.
      const falla = await fallaDeRed(ctx, caso.patron);
      await publicar(ctx, estado, nueva);
      const reabierta = await reabrirConVersion(ctx, page, nueva);
      await repartoEs(reabierta, tituloDe(reabierta, "Regar"), caso.conFalla);
      await expect(pantalla(reabierta)).toHaveCount(0);
      expect(vistos).toEqual([]);

      // Paso 9: sin conexión abre igual.
      await ctx.setOffline(true);
      await recargarAntesDelTope(reabierta);
      await repartoEs(reabierta, tituloDe(reabierta, "Regar"), caso.conFalla);

      // Paso 10: al quitar la falla y volver la red, pasan solos y quedan también sin conexión.
      falla.quitar();
      await ctx.setOffline(false);
      await repartoEs(reabierta, tituloDe(reabierta, "Regar"), REGAR_ATKINSON_NOTO);
      await ctx.setOffline(true);
      await recargarAntesDelTope(reabierta);
      await repartoEs(reabierta, tituloDe(reabierta, "Regar"), REGAR_ATKINSON_NOTO);
      expect(vistos).toEqual([]);
    } finally {
      await ctx.close();
      servidor.close();
    }
  });
}

// ---------------------------------------------------------------------------
// Flujo 9: lo que necesita el service worker
// ---------------------------------------------------------------------------

test("Flujo 9 paso 15: sin conexión y sin Atkinson guardada, se va a los 0,5 s y da paso a la entrada con su mensaje", async ({
  page,
}) => {
  await page.clock.install({ time: new Date(HORA) });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Entrar con Google" })).toBeVisible();
  await controlada(page);
  await olvidarFuentes(page);
  await page.context().setOffline(true);

  const a = await recargarDetenida(page);
  await a.hastaMontar(page.getByText("Entrar con Google"));
  await a.sigueA(0.4);
  await a.seVaA(0.5);
  await expect(page.getByRole("heading", { name: "Tareas Hogar" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar con Google" })).toBeDisabled();
  await expect(page.getByText("Necesitás conexión para entrar la primera vez")).toBeVisible();
});

test("Flujo 9 paso 16: con sesión, sin conexión y sin el juego guardado, se va a los 0,5 s; la franja se ve recién al entrar", async ({
  browser,
}) => {
  const { ctx, page } = await sesion(browser);
  await crearRegar(page);
  await expect(fila(page, "Regar")).toBeVisible();
  await olvidarFuentes(page);
  await ctx.setOffline(true);

  const a = await recargarDetenida(page);
  await expect(pantalla(page)).toBeVisible();
  expect(await textoVisible(page)).toBe("");
  await a.hastaMontar(page.getByText("Regar"));
  await a.sigueA(0.4);
  await a.seVaA(0.5);
  await expect(page.getByText("Sin conexión")).toBeVisible();
  await expect(fila(page, "Regar")).toBeVisible();
  await ctx.close();
});

test("Flujo 9 pasos 5 y 24: al abrir una versión nueva que no cambia las fuentes, aparece, no las vuelve a pedir y se va a los 0,5 s", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const { nueva, otra: siguiente } = dosVersiones(
    "fuente-misma-version",
    versionConLasMismasFuentes,
  );
  const estado = { dir: nueva };
  const servidor = await servir(estado);
  const ctx = await contextoDeVersiones(browser);
  try {
    const page = await ctx.newPage();
    await entrar(page);
    await crearRegar(page);
    await expect(fila(page, "Regar")).toBeVisible();
    await repartoEs(page, tituloDe(page, "Regar"), REGAR_ATKINSON_NOTO);
    await controlada(page);
    await repartoEs(page, tituloDe(page, "Regar"), REGAR_ATKINSON_NOTO);

    const pedidos: string[] = [];
    ctx.on("request", (r) => {
      if (/\/fuentes\/.*\.woff2/.test(r.url())) pedidos.push(r.url());
    });
    await publicar(ctx, estado, siguiente);

    // Cerrar la app; cada apertura se mide con el reloj detenido hasta que abre la versión nueva.
    await page.close();
    await ctx.clock.install({ time: new Date(HORA) });
    await ctx.clock.pauseAt(new Date("2026-07-15T08:00:01"));
    await expect(async () => {
      const intento = await ctx.newPage();
      try {
        await intento.goto("/");
        const a = new Apertura(intento);
        await a.hastaMontar(intento.getByText("Regar"));
        await a.sigueA(0.4);
        await a.seVaA(0.5);
        expect(await cachesDe(intento)).toEqual([
          `tareas-hogar-${versionDe(siguiente)}`,
        ]);
        await repartoEs(intento, tituloDe(intento, "Regar"), REGAR_ATKINSON_NOTO);
      } finally {
        await intento.close();
      }
    }).toPass({ timeout: 60_000 });
    expect(pedidos).toEqual([]);
  } finally {
    await ctx.close();
    servidor.close();
  }
});
