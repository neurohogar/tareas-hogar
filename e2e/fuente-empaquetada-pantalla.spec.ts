import { expect, test, type Page } from "@playwright/test";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  completarEntrada,
  conReloj,
  crearYVer,
  entrar,
  fila,
  limpiarEmuladores,
  sesionConReloj,
} from "./apoyo";
import { conAtkinson, esNoto, esOtra, glifos, plataforma, reparto, repartoEs } from "./fuente-apoyo";
import {
  abrirDetenida,
  Apertura,
  ATKINSON_ARCHIVOS,
  AUTH,
  DATOS,
  fallaDeRed,
  NOTO_ARCHIVO,
  olvidarFuentes,
  otroDispositivoConSesion,
  pantalla,
  recargarDetenida,
  retener,
  sinAvisos,
  textoVisible,
  todoLoDelUsuario,
  uidDeLaCuenta,
  vigilarPantalla,
} from "./pantalla-apoyo";
import { ORIGEN_VERSIONES, servir, versionConOtroJuego } from "./versiones-apoyo";

// Flujo 9 de qa/fuente-empaquetada.md. Lo que necesita el service worker o una versión instalada
// (pasos 5, 15, 16 y 24) está en fuente-empaquetada-sin-conexion.spec.ts.

const HORA = "2026-07-15T08:00:00";
const PENDIENTES = { name: "Pendientes", level: 1 } as const;

test.beforeEach(async () => {
  await limpiarEmuladores();
});

const titulo = (page: Page) => fila(page, "Regar").getByRole("button").first();
const entrarConGoogle = (page: Page) =>
  page.getByRole("button", { name: "Entrar con Google" });

/** Con sesión, la tarea «Regar» con 🌱, y la fuente y el juego ya guardados. */
async function sesionConTarea(page: Page) {
  await sesionConReloj(page, HORA);
  await crearYVer(page, {
    titulo: "Regar",
    tipo: "Intervalo",
    cada: "2",
    unidad: "días",
    emoji: "🌱",
  });
  await repartoEs(page, titulo(page), ([a, n, o]) => a >= 5 && n === 1 && o === 0);
}

const enAtkinsonYNoto = (page: Page) =>
  repartoEs(page, titulo(page), ([a, n, o]) => a >= 5 && n === 1 && o === 0);

/** Con el emoji del dispositivo, no en blanco. */
async function conEmojiDelDispositivo(page: Page) {
  await expect
    .poll(async () => {
      const fs = await plataforma(page, titulo(page));
      return glifos(fs, esNoto) === 0 && glifos(fs, esOtra) >= 1;
    })
    .toBe(true);
  expect((await titulo(page).boundingBox())!.width).toBeGreaterThan(30);
}

// ---------------------------------------------------------------------------
// Qué se ve
// ---------------------------------------------------------------------------

test("Flujo 9 pasos 1 y 2: desde lo primero que dibuja, el ícono con pulso y sin texto; tocarla no hace nada", async ({
  page,
}) => {
  const codigo = await retener(page, /\/_app\//);
  await page.clock.install({ time: new Date(HORA) });
  await page.clock.pauseAt(new Date("2026-07-15T08:00:01"));
  // Paso 1: el código de la app no llegó y la pantalla ya se ve.
  await page.goto("/", { waitUntil: "commit" });
  await expect(pantalla(page)).toBeVisible();
  expect(codigo.pedidos()).toBeGreaterThan(0);
  expect(await textoVisible(page)).toBe("");

  // Paso 2: pulso, sin giro ni indicador de progreso.
  const animaciones = await pantalla(page).evaluate((e) =>
    e.getAnimations().map((a) => ({
      estado: a.playState,
      cuadros: a.effect instanceof KeyframeEffect ? JSON.stringify(a.effect.getKeyframes()) : "",
      dura: a.effect?.getComputedTiming().duration,
    })),
  );
  expect(animaciones).toHaveLength(1);
  expect(animaciones[0].estado).toBe("running");
  expect(animaciones[0].cuadros).toContain("scale");
  expect(animaciones[0].cuadros).not.toContain("rotate");
  expect(animaciones[0].dura).toBeGreaterThanOrEqual(1000);
  await expect(page.getByRole("progressbar")).toHaveCount(0);

  codigo.liberar();
  const a = new Apertura(page);
  await a.hastaMontar(page.getByText("Entrar con Google"));
  await a.sigueA(0.4);

  // Tocar donde quedará el botón de entrada, detrás de la pantalla: no hace nada.
  let popups = 0;
  page.on("popup", () => popups++);
  const donde = await page.getByText("Entrar con Google").boundingBox();
  await page.mouse.click(donde!.x + donde!.width / 2, donde!.y + donde!.height / 2);
  await page.mouse.click(10, 10);
  await expect(pantalla(page)).toBeVisible();
  expect(popups).toBe(0);
  expect(page.url()).toBe("http://127.0.0.1:4173/");

  await a.seVaA(0.5);
  await expect(entrarConGoogle(page)).toBeVisible();
});

test("Flujo 9 paso 3: con movimiento reducido el ícono se ve quieto", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const a = await abrirDetenida(page, HORA);
  await expect(pantalla(page)).toBeVisible();
  expect(await pantalla(page).evaluate((e) => e.getAnimations().length)).toBe(0);
  await a.hastaMontar(page.getByText("Entrar con Google"));
  await a.sigueA(0.4);
  await a.seVaA(0.5);
});

const COMBINACIONES = [
  { nombre: "Celular claro", ancho: 360, alto: 640, tema: "light", fondo: "rgb(247, 245, 240)" },
  { nombre: "Celular oscuro", ancho: 360, alto: 640, tema: "dark", fondo: "rgb(22, 25, 23)" },
  { nombre: "Ancho claro", ancho: 1024, alto: 768, tema: "light", fondo: "rgb(247, 245, 240)" },
  { nombre: "Ancho oscuro", ancho: 1024, alto: 768, tema: "dark", fondo: "rgb(22, 25, 23)" },
] as const;

for (const c of COMBINACIONES) {
  test(`Flujo 9 paso 4: sigue el tema del sistema, sin destello al irse (${c.nombre})`, async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      baseURL: "http://127.0.0.1:4173",
      viewport: { width: c.ancho, height: c.alto },
      hasTouch: c.ancho === 360,
      colorScheme: c.tema,
    });
    const page = await ctx.newPage();
    const a = await abrirDetenida(page, HORA);
    await expect(pantalla(page)).toBeVisible();
    const fondo = (selector: string) =>
      page.evaluate((s) => getComputedStyle(document.querySelector(s)!).backgroundColor, selector);
    expect(await fondo("#pantalla-de-carga")).toBe(c.fondo);
    expect(await fondo("html")).toBe(c.fondo);
    const caja = (await pantalla(page).boundingBox())!;
    expect(Math.abs(caja.x + caja.width / 2 - c.ancho / 2)).toBeLessThan(2);
    expect(Math.abs(caja.y + caja.height / 2 - c.alto / 2)).toBeLessThan(2);

    await a.hastaMontar(page.getByText("Entrar con Google"));
    await a.sigueA(0.4);
    await a.seVaA(0.5);
    await expect(entrarConGoogle(page)).toBeVisible();
    // Lo que queda atrás al irse es el mismo color: no hay destello.
    expect(await fondo("html")).toBe(c.fondo);
    expect(await fondo("body")).toBe(c.fondo);
    await ctx.close();
  });
}

// ---------------------------------------------------------------------------
// Cuándo aparece
// ---------------------------------------------------------------------------

test("Flujo 9 paso 5: al abrir y al recargar, en las tres pantallas de destino", async ({ page }) => {
  await sesionConTarea(page);
  const destinos = [
    { ruta: "/", encabezado: "Pendientes" },
    { ruta: "/historial", encabezado: "Historial" },
    { ruta: "/etiquetas", encabezado: "Etiquetas" },
  ];
  for (const { ruta, encabezado } of destinos) {
    await page.clock.pauseAt(new Date(Date.parse(HORA) + 3_600_000 * (destinos.findIndex((d) => d.ruta === ruta) + 1)));
    await page.goto(ruta);
    for (const abrirla of ["abrir", "recargar"]) {
      if (abrirla === "recargar") await page.reload();
      const a = new Apertura(page);
      await a.sigueA(0.4);
      await a.seVaA(0.5);
      await expect(page.getByRole("heading", { name: encabezado, level: 1 })).toBeVisible();
    }
  }
});

test("Flujo 9 paso 6: volver de segundo plano no la muestra", async ({ page }) => {
  await sesionConTarea(page);
  const vista = await vigilarPantalla(page);
  const otra = await page.context().newPage();
  await otra.bringToFront();
  await page.bringToFront();
  await otra.close();
  await page.evaluate(() => {
    for (const estado of ["hidden", "visible"]) {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => estado });
      document.dispatchEvent(new Event("visibilitychange"));
    }
  });
  await page.waitForTimeout(500);
  await expect(pantalla(page)).toHaveCount(0);
  expect(await vista()).toBe(0);
  await expect(fila(page, "Regar")).toBeVisible();
});

test("Flujo 9 paso 7: tocar Entrar con Google y completar la entrada no la muestra", async ({ page }) => {
  await page.goto("/");
  await expect(entrarConGoogle(page)).toBeVisible();
  const vista = await vigilarPantalla(page);
  await completarEntrada(page);
  await expect(pantalla(page)).toHaveCount(0);
  expect(await vista()).toBe(0);
});

// ---------------------------------------------------------------------------
// Qué espera con sesión
// ---------------------------------------------------------------------------

test("Flujo 9 paso 8: con todo disponible, a los 0,4 s sigue y a los 0,5 s se va, con la lista completa", async ({
  page,
}) => {
  await sesionConTarea(page);
  const a = await recargarDetenida(page);
  await a.hastaMontar(page.getByText("Regar"));
  await a.sigueA(0.4);
  await a.hasta(0.499, 1);
  await expect(pantalla(page)).toBeVisible();
  await a.seVaA(0.5);
  await expect(fila(page, "Regar")).toBeVisible();
  await enAtkinsonYNoto(page);
});

test("Flujo 9 paso 9: con Auth demorado, más allá de los 10 s, sigue hasta que Auth responde", async ({
  page,
}) => {
  await sesionConTarea(page);
  const auth = await retener(page, AUTH);
  const a = await recargarDetenida(page);
  await a.sigueA(12);
  expect(auth.pedidos()).toBeGreaterThan(0);
  auth.liberar();
  await a.seVaEnseguida();
  await conReloj(page, () => expect(fila(page, "Regar")).toBeVisible());
});

test("Flujo 9 paso 10: con los datos demorados 3 s, sigue hasta los 3 s y se va cuando responden", async ({
  page,
  browser,
}) => {
  await sesionConTarea(page);
  const b = await otroDispositivoConSesion(browser, page);
  // Las tres colecciones van en un solo pedido, que es lo que se puede demorar por la red: la espera
  // de cada una por separado la decide features/pantalla-de-carga.feature.
  const datos = await retener(b.page, DATOS);
  const a = await abrirDetenida(b.page, HORA);
  await a.sigueA(2.9);
  expect(datos.pedidos()).toBeGreaterThan(0);
  await a.hasta(3);
  await expect(pantalla(b.page)).toBeVisible();
  datos.liberar();
  await a.seVaEnseguida();
  await conReloj(b.page, () => expect(fila(b.page, "Regar")).toBeVisible());
  await b.ctx.close();
});

for (const { nombre, patron } of [
  { nombre: "Atkinson", patron: ATKINSON_ARCHIVOS },
  { nombre: "Noto", patron: NOTO_ARCHIVO },
]) {
  test(`Flujo 9 paso 11: con ${nombre} demorado 6 s, sigue hasta los 6 s y entra sin haber mostrado un respaldo`, async ({
    page,
    browser,
  }) => {
    await sesionConTarea(page);
    const b = await otroDispositivoConSesion(browser, page);
    const fuente = await retener(b.page, patron);
    const a = await abrirDetenida(b.page, HORA);
    await a.sigueA(5.9);
    expect(fuente.pedidos()).toBeGreaterThan(0);
    await a.hasta(6);
    await expect(pantalla(b.page)).toBeVisible();
    fuente.liberar();
    await a.seVaEnseguida();
    // Apenas se va, ya está todo con la fuente y el juego.
    await conReloj(b.page, () => expect(fila(b.page, "Regar")).toBeVisible());
    const [atkinson, noto, otras] = await reparto(b.page, titulo(b.page));
    expect(atkinson).toBeGreaterThanOrEqual(5);
    expect([noto, otras]).toEqual([1, 0]);
    await b.ctx.close();
  });
}

test("Flujo 9 paso 12: con los datos demorados más de 10 s, se va a los 10 s, sin aviso, y la lista se completa sola", async ({
  page,
  browser,
}) => {
  await sesionConTarea(page);
  const b = await otroDispositivoConSesion(browser, page);
  const datos = await retener(b.page, DATOS);
  const a = await abrirDetenida(b.page, HORA);
  await a.sigueA(9.9);
  await a.seVaA(10);
  await expect(b.page.getByRole("heading", PENDIENTES)).toBeVisible();
  await expect(fila(b.page, "Regar")).toHaveCount(0);
  await sinAvisos(b.page);
  datos.liberar();
  await conReloj(b.page, () => expect(fila(b.page, "Regar")).toBeVisible());
  await sinAvisos(b.page);
  await b.ctx.close();
});

// ---------------------------------------------------------------------------
// Sin sesión
// ---------------------------------------------------------------------------

test("Flujo 9 paso 13: sin sesión, con Atkinson demorada, sigue hasta que llega y da paso a la entrada", async ({
  page,
}) => {
  const fuente = await retener(page, ATKINSON_ARCHIVOS);
  const a = await abrirDetenida(page, HORA);
  await a.sigueA(9.9);
  expect(fuente.pedidos()).toBeGreaterThan(0);
  fuente.liberar();
  await a.seVaEnseguida();
  await expect(page.getByRole("heading", { name: "Tareas Hogar" })).toBeVisible();
  await conAtkinson(page, entrarConGoogle(page));
});

test("Flujo 9 paso 14: sin sesión no espera a Noto, se va a los 0,5 s y Noto sigue bajando", async ({ page }) => {
  const noto = await retener(page, NOTO_ARCHIVO);
  const a = await abrirDetenida(page, HORA);
  await a.hastaMontar(page.getByText("Entrar con Google"));
  await a.sigueA(0.4);
  await a.seVaA(0.5);
  await expect(entrarConGoogle(page)).toBeVisible();
  await conAtkinson(page, entrarConGoogle(page));
  expect(noto.pedidos()).toBe(1);
  noto.liberar();
});

test("Flujo 9 paso 14: si se entra antes de que llegue Noto, emoji del dispositivo y cambian solos", async ({ page }) => {
  const noto = await retener(page, NOTO_ARCHIVO);
  await entrar(page);
  await crearYVer(page, {
    titulo: "Regar",
    tipo: "Intervalo",
    cada: "2",
    unidad: "días",
    emoji: "🌱",
  });
  // La pantalla de entrada ya pidió Noto; entrar no recarga, así que la descarga es la misma.
  await conEmojiDelDispositivo(page);
  await sinAvisos(page);
  noto.liberar();
  await enAtkinsonYNoto(page);
  await sinAvisos(page);
});

// ---------------------------------------------------------------------------
// Lo que no va a llegar
// ---------------------------------------------------------------------------

test("Flujo 9 paso 17: con Noto demorado, perder la conexión a los 2 s la cierra en ese momento", async ({
  page,
}) => {
  await sesionConTarea(page);
  await olvidarFuentes(page);
  await retener(page, NOTO_ARCHIVO);
  const a = await recargarDetenida(page);
  await a.sigueA(2);
  await page.context().setOffline(true);
  await a.seVaEnseguida();
  await page.context().setOffline(false);
});

test("Flujo 9 paso 18: con falla de Noto a los 2 s y los datos demorados 5 s, se va a los 5 s", async ({
  page,
  browser,
}) => {
  await sesionConTarea(page);
  const b = await otroDispositivoConSesion(browser, page);
  const noto = await retener(b.page, NOTO_ARCHIVO);
  const datos = await retener(b.page, DATOS);
  const a = await abrirDetenida(b.page, HORA);
  await a.sigueA(2);
  noto.cortar();
  await a.sigueA(4.9);
  await a.hasta(5);
  await expect(pantalla(b.page)).toBeVisible();
  datos.liberar();
  await a.seVaEnseguida();
  await b.ctx.close();
});

test("Flujo 9 paso 19: con falla de Noto y todo lo demás listo, el mínimo vale igual", async ({ page }) => {
  await sesionConTarea(page);
  await olvidarFuentes(page);
  const noto = await fallaDeRed(page, NOTO_ARCHIVO);
  const a = await recargarDetenida(page);
  await a.hastaMontar(page.getByText("Regar"));
  await expect.poll(noto.pedidos).toBeGreaterThan(0);
  await a.sigueA(0.4);
  await a.hasta(0.499, 1);
  await expect(pantalla(page)).toBeVisible();
  await a.seVaA(0.5);
  await conEmojiDelDispositivo(page);
  await sinAvisos(page);
});

// ---------------------------------------------------------------------------
// Tope de Noto recordado por dispositivo
// ---------------------------------------------------------------------------

test("Flujo 9 pasos 20 a 22: el tope con Noto sin bajar lo recuerda solo ese dispositivo, hasta que Noto queda guardado o cambia el juego", async ({
  browser,
}) => {
  test.setTimeout(240_000);
  const raiz = join(process.cwd(), "tmp", "fuente-tope");
  const v1 = join(raiz, "v1");
  const v2 = join(raiz, "v2");
  rmSync(raiz, { recursive: true, force: true });
  mkdirSync(raiz, { recursive: true });
  cpSync(join(process.cwd(), "build"), v1, { recursive: true });
  versionConOtroJuego(v1, v2);
  const estado = { dir: v1 };
  const servidor = await servir(estado);
  const ctx = await browser.newContext({
    baseURL: ORIGEN_VERSIONES,
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
  });
  try {
    const page = await ctx.newPage();
    await sesionConTarea(page);
    await olvidarFuentes(page);

    // Paso 20: llega al tope con Noto demorado y entra con el emoji del dispositivo.
    const noto = await retener(page, NOTO_ARCHIVO);
    let a = await recargarDetenida(page);
    await a.sigueA(9.9);
    await a.seVaA(10);
    await conEmojiDelDispositivo(page);
    await sinAvisos(page);

    // Sin que Noto haya llegado, recargar: se va a los 0,5 s, y Noto se sigue pidiendo detrás.
    const antes = noto.pedidos();
    a = await recargarDetenida(page);
    await a.hastaMontar(page.getByText("Regar"));
    await a.sigueA(0.4);
    await a.seVaA(0.5);
    await conEmojiDelDispositivo(page);
    await expect.poll(noto.pedidos).toBeGreaterThan(antes);

    // Paso 21: un dispositivo B con la misma cuenta sí lo espera, y Firestore no ganó nada.
    const uid = await uidDeLaCuenta();
    const enFirestore = await todoLoDelUsuario(uid);
    const b = await otroDispositivoConSesion(browser, page);
    await retener(b.page, NOTO_ARCHIVO);
    const enB = await abrirDetenida(b.page, HORA);
    await enB.sigueA(9.9);
    await enB.seVaA(10);
    await b.ctx.close();
    expect(await todoLoDelUsuario(uid)).toBe(enFirestore);
    expect(enFirestore).not.toMatch(/tope/i);

    // Paso 22: se libera Noto hasta que queda guardado.
    noto.liberar();
    await conReloj(page, () => enAtkinsonYNoto(page));
    await page.waitForTimeout(500);

    // Versión que cambia el juego, demorado: la próxima apertura vuelve a esperarlo, hasta el tope.
    estado.dir = v2;
    await page.unrouteAll({ behavior: "ignoreErrors" });
    await retener(page, NOTO_ARCHIVO);
    a = await recargarDetenida(page);
    await a.sigueA(9.9);
    await a.seVaA(10);
    await conEmojiDelDispositivo(page);
    // Llegó al tope: la siguiente ya no lo espera.
    a = await recargarDetenida(page);
    await a.hastaMontar(page.getByText("Regar"));
    await a.sigueA(0.4);
    await a.seVaA(0.5);
    await conEmojiDelDispositivo(page);
  } finally {
    await ctx.close();
    servidor.close();
  }
});

test("Flujo 9 paso 23: el tiempo sin sesión no cuenta como tope con Noto", async ({ page }) => {
  await retener(page, NOTO_ARCHIVO);
  await page.goto("/");
  await expect(entrarConGoogle(page)).toBeVisible();
  // Sin reloj simulado, porque el popup de la entrada no lo tolera: pasan de verdad los 10 s.
  await page.waitForTimeout(10_500);
  await completarEntrada(page);
  await page.clock.install({ time: new Date(HORA) });
  const a = await recargarDetenida(page);
  await a.sigueA(9.9);
  await a.seVaA(10);
});
