import { expect, test, type Browser, type Page } from "@playwright/test";
import {
  abrir,
  borrar,
  cerrar,
  completar,
  crearYVer,
  dosDispositivos,
  editar,
  fila,
  limpiarEmuladores,
  llegaAlServidor,
  sesionConReloj,
} from "./apoyo";

const PROYECTO = "demo-tareas-hogar";

test.beforeEach(async () => {
  await limpiarEmuladores();
});

const botonAnotar = (page: Page) =>
  page.getByRole("button", { name: "Anotar", exact: true });
const recuadro = (page: Page) =>
  page.getByRole("dialog", { name: "Anotar", exact: true });
const confirmacion = (page: Page) =>
  page.getByRole("status").filter({ hasText: "Anotación guardada" });
const copiadas = (page: Page) =>
  page.getByRole("status").filter({ hasText: "Anotaciones copiadas" });
const noCopio = (page: Page) =>
  page.getByRole("status").filter({ hasText: "No se pudo copiar" });
const deshacerAviso = (page: Page) =>
  page.getByRole("status").filter({ hasText: "Completaste" });
const copiar = (page: Page) => page.getByRole("button", { name: "Copiar" });
const entradas = (page: Page) =>
  page
    .getByRole("listitem")
    .filter({ has: page.getByRole("button", { name: "Editar texto" }) });
const portapapeles = (page: Page) =>
  page.evaluate(() => navigator.clipboard.readText());

type Pantalla = "Pendientes" | "Historial" | "Etiquetas" | "Anotaciones";

async function ir(page: Page, pantalla: Pantalla) {
  await page
    .getByRole("navigation")
    .getByRole("link", { name: pantalla, exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: pantalla, level: 1 }),
  ).toBeVisible();
}

async function anotar(
  page: Page,
  texto: string,
  sentido: "Me sirvió" | "Me molestó" = "Me sirvió",
) {
  await botonAnotar(page).click();
  await expect(recuadro(page)).toBeVisible();
  await recuadro(page).getByRole("textbox", { name: "Texto" }).fill(texto);
  await recuadro(page).getByRole("button", { name: sentido }).click();
  await expect(recuadro(page)).toHaveCount(0);
  await expect(confirmacion(page)).toBeVisible();
}

/** Script de inicio: `writeText` rechaza con NotAllowedError mientras la bandera de la pestaña lo pida; si no, funciona. */
async function portapapelesControlado(page: Page) {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    const original = Clipboard.prototype.writeText;
    Clipboard.prototype.writeText = function (texto: string) {
      if (sessionStorage.getItem("qa-rechaza") === "1")
        return Promise.reject(new DOMException("rechazado", "NotAllowedError"));
      return original.call(this, texto);
    };
  });
}

const rechaza = (page: Page, si: boolean) =>
  page.evaluate((v) => sessionStorage.setItem("qa-rechaza", v ? "1" : "0"), si);

/** Pausa el reloj de la app en una hora fija y deja que los datos ya estén en pantalla. */
const detenerEn = (page: Page, hora: string) =>
  page.clock.pauseAt(new Date(hora));

// ---------------------------------------------------------------------------
// Lectura auxiliar del emulador (REST de Firestore): la interfaz no muestra las huérfanas.
// ---------------------------------------------------------------------------

const RAIZ = `http://127.0.0.1:8080/v1/projects/${PROYECTO}/databases/(default)/documents`;
const AUTORIZADO = { Authorization: "Bearer owner" };

async function uidDelEmulador(): Promise<string> {
  const respuesta = await fetch(
    `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/${PROYECTO}/accounts:query`,
    {
      method: "POST",
      headers: { ...AUTORIZADO, "Content-Type": "application/json" },
      body: "{}",
    },
  );
  const cuerpo = (await respuesta.json()) as {
    userInfo?: { localId: string }[];
  };
  const uid = cuerpo.userInfo?.[0]?.localId;
  if (!uid) throw new Error("el emulador de Auth no tiene ningún usuario");
  return uid;
}

type Documento = { id: string; campos: Record<string, any> };

async function documentos(
  coleccion: "anotaciones" | "completados" | "tareas" | "etiquetas",
): Promise<Documento[]> {
  const uid = await uidDelEmulador();
  const respuesta = await fetch(
    `${RAIZ}/users/${uid}/${coleccion}?pageSize=300`,
    { headers: AUTORIZADO },
  );
  const cuerpo = (await respuesta.json()) as {
    documents?: { name: string; fields: Record<string, any> }[];
  };
  return (cuerpo.documents ?? []).map((d) => ({
    id: d.name.split("/").pop()!,
    campos: d.fields,
  }));
}

const texto = (campos: Record<string, any>, campo: string) =>
  campos[campo]?.stringValue as string | undefined;
const textosDeAnotaciones = async () =>
  (await documentos("anotaciones")).map((d) => texto(d.campos, "texto")).sort();

// ---------------------------------------------------------------------------
// Flujos 1 a 3: el aviso de copia rechazada
// ---------------------------------------------------------------------------

/** Regar y una anotación de hoy 08:05 con el texto `quedó lindo`, en Anotaciones con el portapapeles rechazando. */
async function conUnaAnotacion(page: Page) {
  await portapapelesControlado(page);
  await sesionConReloj(page, "2026-07-15T08:04:30");
  await crearYVer(page, { titulo: "Regar", tipo: "No se repite" });
  await page.clock.setFixedTime(new Date("2026-07-15T08:05:00"));
  await page.waitForTimeout(1200);
  await abrir(page, "Regar");
  await anotar(page, "quedó lindo");
  await page.getByRole("button", { name: "Cerrar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await ir(page, "Anotaciones");
  await expect(entradas(page)).toHaveCount(1);
  await expect(confirmacion(page)).toHaveCount(0, { timeout: 15_000 });
  await page.evaluate(() => navigator.clipboard.writeText("previo"));
  await rechaza(page, true);
}

test("Flujo 1: el portapapeles rechaza la copia", async ({ page }) => {
  await conUnaAnotacion(page);
  const lista = await entradas(page).allInnerTexts();

  // Paso 2 (con el reloj detenido para medir el paso 4).
  await detenerEn(page, "2026-07-15T08:30:00");
  await copiar(page).click();
  await expect(noCopio(page)).toBeVisible();
  await expect(noCopio(page)).toHaveText("No se pudo copiar");
  await expect(noCopio(page).getByRole("button")).toHaveCount(0);
  await expect(copiadas(page)).toHaveCount(0);

  // Paso 3.
  expect(await entradas(page).allInnerTexts()).toEqual(lista);
  await expect(
    page.getByRole("heading", { name: "Anotaciones", level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(
    page
      .getByRole("status")
      .filter({ hasNotText: /No se pudo copiar|Sin conexión/ }),
  ).toHaveCount(0);
  expect(await portapapeles(page)).toBe("previo");

  // Paso 4: con el reloj detenido, a los 4 s sigue; a los 5 s se va solo.
  await page.clock.runFor(4000);
  await expect(noCopio(page)).toBeVisible();
  await page.clock.runFor(1000);
  await expect(noCopio(page)).toHaveCount(0);
  expect(await portapapeles(page)).toBe("previo");
});

test("Flujo 2: volver a tocar Copiar", async ({ page }) => {
  await conUnaAnotacion(page);

  // Pasos 1 y 2.
  await detenerEn(page, "2026-07-15T08:30:00");
  await copiar(page).click();
  await expect(noCopio(page)).toHaveCount(1);
  await page.clock.runFor(3000);
  await copiar(page).click();
  await expect(noCopio(page)).toHaveCount(1);
  await page.clock.runFor(4000);
  await expect(noCopio(page)).toHaveCount(1);
  await page.clock.runFor(1000);
  await expect(noCopio(page)).toHaveCount(0);

  // Paso 4: la app no copia sola, aunque pasen minutos.
  await page.clock.runFor(10 * 60_000);
  expect(await portapapeles(page)).toBe("previo");
  await expect(noCopio(page)).toHaveCount(0);

  // Paso 3: recargar con el portapapeles funcionando.
  await page.clock.resume();
  await rechaza(page, false);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Anotaciones", level: 1 }),
  ).toBeVisible();
  await expect(entradas(page)).toHaveCount(1);
  await copiar(page).click();
  await expect(copiadas(page)).toHaveCount(1);
  expect(await portapapeles(page)).toBe(
    "2026-07-15 08:05 · Me sirvió · Panel de edición · Regar · quedó lindo",
  );
  // Con el rechazo de nuevo, mientras se ve "Anotaciones copiadas": solo el nuevo texto.
  await rechaza(page, true);
  await copiar(page).click();
  await expect(noCopio(page)).toHaveCount(1);
  await expect(copiadas(page)).toHaveCount(0);
  // Y al revés: con "No se pudo copiar" visible, un Copiar que funciona deja solo "Anotaciones copiadas".
  await rechaza(page, false);
  await copiar(page).click();
  await expect(copiadas(page)).toHaveCount(1);
  await expect(noCopio(page)).toHaveCount(0);
  await expect(
    page.getByRole("status").filter({ hasText: /copiar|copiadas/ }),
  ).toHaveCount(1);
});

/** Completa Pagar a las 08:00 y a las 08:00:02 abre Anotaciones con el aviso de deshacer a la vista. */
async function conAvisoDeDeshacer(page: Page) {
  await portapapelesControlado(page);
  await sesionConReloj(page, "2026-07-15T07:59:00");
  await crearYVer(page, { titulo: "Pagar", tipo: "No se repite" });
  await anotar(page, "suelta");
  await expect(confirmacion(page)).toHaveCount(0, { timeout: 15_000 });
  await page.clock.setFixedTime(new Date("2026-07-15T08:00:00"));
  await page.waitForTimeout(1200);
  await completar(page, "Pagar");
  await expect(deshacerAviso(page)).toBeVisible();
  await page.clock.setFixedTime(new Date("2026-07-15T08:00:02"));
  await page.waitForTimeout(1200);
  await ir(page, "Anotaciones");
  await expect(deshacerAviso(page)).toBeVisible();
  await rechaza(page, true);
}

async function sinSuperponerse(page: Page) {
  const aviso = await deshacerAviso(page).boundingBox();
  const texto = await noCopio(page).boundingBox();
  expect(aviso && texto).toBeTruthy();
  const separados =
    aviso!.y + aviso!.height <= texto!.y ||
    texto!.y + texto!.height <= aviso!.y ||
    aviso!.x + aviso!.width <= texto!.x ||
    texto!.x + texto!.width <= aviso!.x;
  expect(separados).toBe(true);
  // El botón Deshacer se puede tocar: es lo que está en su centro.
  const boton = (await deshacerAviso(page)
    .getByRole("button", { name: "Deshacer" })
    .boundingBox())!;
  const encima = await page.evaluate(
    ({ x, y }) => document.elementFromPoint(x, y)?.textContent?.trim(),
    { x: boton.x + boton.width / 2, y: boton.y + boton.height / 2 },
  );
  expect(encima).toBe("Deshacer");
}

test("Flujo 3: no tapa el aviso de deshacer", async ({ page }) => {
  await conAvisoDeDeshacer(page);

  // Paso 2.
  await copiar(page).click();
  await expect(noCopio(page)).toBeVisible();
  await expect(deshacerAviso(page)).toBeVisible();
  await sinSuperponerse(page);

  // Paso 3: Deshacer mientras se ve el texto.
  await deshacerAviso(page).getByRole("button", { name: "Deshacer" }).click();
  await expect(deshacerAviso(page)).toHaveCount(0);
  await ir(page, "Pendientes");
  await expect(fila(page, "Pagar").getByRole("checkbox")).not.toBeChecked();
  await ir(page, "Historial");
  await expect(page.getByText("Todavía no completaste nada")).toBeVisible();
});

test("Flujo 3 (celular): no tapa el aviso de deshacer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await conAvisoDeDeshacer(page);
  await copiar(page).click();
  await expect(noCopio(page)).toBeVisible();
  await expect(deshacerAviso(page)).toBeVisible();
  await sinSuperponerse(page);
  await deshacerAviso(page).getByRole("button", { name: "Deshacer" }).click();
  await expect(deshacerAviso(page)).toHaveCount(0);
  await ir(page, "Pendientes");
  await expect(fila(page, "Pagar").getByRole("checkbox")).not.toBeChecked();
});

// ---------------------------------------------------------------------------
// Flujos 4 a 7: las limpiezas se reintentan
// ---------------------------------------------------------------------------

const HOY = "2026-07-15T08:00:00";

type Dos = Awaited<ReturnType<typeof dosDispositivos>>;

/** Con B cargando todas las pantallas (sin service worker no podría abrirlas sin conexión), termina en Pendientes. */
async function cargarPantallas(page: Page) {
  for (const pantalla of [
    "Historial",
    "Etiquetas",
    "Anotaciones",
    "Pendientes",
  ] as const)
    await ir(page, pantalla);
}

/** Ningún texto, contador ni indicador de pendientes: solo la franja "Sin conexión" y el aviso de deshacer de siempre. */
async function silencio(page: Page) {
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
 * B vuelve a tener conexión con la red demorada (CDP, latencia de 3 s); cuando `llego` dice que el dato huérfano
 * ya está donde B lo ve, B vuelve a quedarse sin conexión, antes de que termine el intento de limpiarlo.
 */
async function reconectarYCortar(d: Dos, llego: () => Promise<boolean>) {
  await d.ctxB.setOffline(false);
  const cdp = await d.b.context().newCDPSession(d.b);
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 3000,
    downloadThroughput: -1,
    uploadThroughput: -1,
  });
  await esperarA(llego);
  await d.ctxB.setOffline(true);
}

async function esperarA(condicion: () => Promise<boolean>, ms = 40_000) {
  const limite = Date.now() + ms;
  while (Date.now() < limite) {
    if (await condicion().catch(() => false)) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("la condición no se cumplió a tiempo");
}

/** Sigue verdadero durante `ms` (el estado del emulador no cambia solo). */
async function sigueDurante(ms: number, condicion: () => Promise<boolean>) {
  const limite = Date.now() + ms;
  do {
    expect(await condicion()).toBe(true);
    await new Promise((r) => setTimeout(r, 500));
  } while (Date.now() < limite);
}

const huerfanaEnServidor = async () =>
  (await textosDeAnotaciones()).includes("huérfana");
const lineasCopiadas = async (page: Page) => {
  await ir(page, "Anotaciones");
  await copiar(page).click();
  await expect(copiadas(page)).toBeVisible();
  return (await portapapeles(page)).split("\n");
};

/**
 * Deja una anotación huérfana: B (con `queda`, una anotación suelta) se queda sin conexión, A borra `Regar` con su
 * anotación `sana` y se va, y B, que todavía ve `Regar`, anota `huérfana` sobre ella. B termina en Anotaciones, sin conexión.
 */
async function conHuerfanaPorLimpiar(browser: Browser): Promise<Dos> {
  const d = await dosDispositivos(browser, HOY);
  await d.ctxB.grantPermissions(["clipboard-read", "clipboard-write"]);
  await crearYVer(d.a, { titulo: "Regar", tipo: "No se repite" });
  await expect(fila(d.b, "Regar")).toBeVisible();
  await abrir(d.a, "Regar");
  await anotar(d.a, "sana");
  await cerrar(d.a);
  await anotar(d.b, "queda");
  await cargarPantallas(d.b);
  await ir(d.b, "Anotaciones");
  await expect(entradas(d.b)).toHaveCount(2);
  await ir(d.b, "Pendientes");
  await d.ctxB.setOffline(true);
  await borrar(d.a, "Regar");
  await llegaAlServidor(d.a);
  expect(await textosDeAnotaciones()).toEqual(["queda"]);
  await d.a.context().close();
  await abrir(d.b, "Regar");
  await anotar(d.b, "huérfana");
  await cerrar(d.b);
  await ir(d.b, "Anotaciones");
  return d;
}

/** El intento de B se corta: la huérfana está en el servidor, B no la ve y no limpió nada. */
async function cortarElIntento(d: Dos) {
  await reconectarYCortar(
    d,
    async () =>
      (await huerfanaEnServidor()) && (await entradas(d.b).count()) === 1,
  );
  await expect(entradas(d.b)).toHaveCount(1);
  await expect(entradas(d.b).first()).toContainText("queda");
  await sigueDurante(6000, huerfanaEnServidor);
}

test("Flujo 4: una huérfana se limpia al volver la conexión", async ({
  browser,
}) => {
  test.setTimeout(240_000);
  const d = await conHuerfanaPorLimpiar(browser);
  try {
    // Pasos 2 y 3.
    await cortarElIntento(d);
    await expect(d.b.getByText("huérfana")).toHaveCount(0);
    await silencio(d.b);

    // Paso 4: B vuelve a tener conexión y no toca nada.
    await d.ctxB.setOffline(false);
    await esperarA(async () => !(await huerfanaEnServidor()));
    expect(await textosDeAnotaciones()).toEqual(["queda"]);
    await expect(entradas(d.b)).toHaveCount(1);
    await silencio(d.b);
    expect(await lineasCopiadas(d.b)).toHaveLength(1);
  } finally {
    await d.b.context().close();
  }
});

test("Flujo 4 (paso 5): un cambio de datos sin conexión no limpia; al volver la conexión sí", async ({
  browser,
}) => {
  test.setTimeout(240_000);
  const d = await conHuerfanaPorLimpiar(browser);
  try {
    await cortarElIntento(d);
    await ir(d.b, "Pendientes");
    await anotar(d.b, "Me sirvió");
    await ir(d.b, "Anotaciones");
    await expect(entradas(d.b)).toHaveCount(2);
    await sigueDurante(6000, huerfanaEnServidor);
    await silencio(d.b);
    await d.ctxB.setOffline(false);
    await esperarA(async () => !(await huerfanaEnServidor()));
    expect(await textosDeAnotaciones()).toEqual(["Me sirvió", "queda"]);
    await silencio(d.b);
  } finally {
    await d.b.context().close();
  }
});

// ---------------------------------------------------------------------------
// Flujo 5: una falla no impide limpiar las demás
// ---------------------------------------------------------------------------

const TAREAS = ["Regar", "Pagar", "Limpiar"];

const huerfanasEnServidor = async () =>
  (await textosDeAnotaciones()).filter((t) => t?.startsWith("h"));

/** Tres tareas borradas por A mientras B, sin conexión, anota `h1`, `h2` y `h3` sobre ellas (y `queda`, suelta). */
async function conTresHuerfanas(browser: Browser): Promise<Dos> {
  const d = await dosDispositivos(browser, HOY);
  for (const titulo of TAREAS) {
    await crearYVer(d.a, { titulo, tipo: "No se repite" });
    await expect(fila(d.b, titulo)).toBeVisible();
  }
  await anotar(d.b, "queda");
  await cargarPantallas(d.b);
  await d.ctxB.setOffline(true);
  for (const titulo of TAREAS) await borrar(d.a, titulo);
  await llegaAlServidor(d.a);
  await d.a.context().close();
  for (const [i, titulo] of TAREAS.entries()) {
    await abrir(d.b, titulo);
    await anotar(d.b, `h${i + 1}`);
    await cerrar(d.b);
  }
  await ir(d.b, "Anotaciones");
  await expect(entradas(d.b)).toHaveCount(4);
  return d;
}

for (const restantes of [3, 2]) {
  test(`Flujo 5: tres anotaciones huérfanas, el intento se corta con ${restantes} por limpiar`, async ({
    browser,
  }) => {
    test.setTimeout(240_000);
    const d = await conTresHuerfanas(browser);
    try {
      await reconectarYCortar(
        d,
        async () =>
          (await huerfanasEnServidor()).length === restantes &&
          (await entradas(d.b).count()) === 1,
      );
      await expect(entradas(d.b)).toHaveCount(1);
      await sigueDurante(
        6000,
        async () => (await huerfanasEnServidor()).length === restantes,
      );
      await silencio(d.b);
      await d.ctxB.setOffline(false);
      await esperarA(async () => (await huerfanasEnServidor()).length === 0);
      expect(await textosDeAnotaciones()).toEqual(["queda"]);
      await silencio(d.b);
    } finally {
      await d.b.context().close();
    }
  });
}

test("Flujo 5: un completado huérfano se limpia y el Historial nunca lo muestra", async ({
  browser,
}) => {
  test.setTimeout(240_000);
  const d = await dosDispositivos(browser, HOY);
  try {
    await crearYVer(d.a, { titulo: "Regar", tipo: "No se repite" });
    await expect(fila(d.b, "Regar")).toBeVisible();
    await cargarPantallas(d.b);
    await d.ctxB.setOffline(true);
    await borrar(d.a, "Regar");
    await llegaAlServidor(d.a);
    await d.a.context().close();
    await completar(d.b, "Regar");
    await ir(d.b, "Historial");
    await expect(d.b.getByRole("listitem")).toHaveCount(1);
    const completados = async () => (await documentos("completados")).length;
    await reconectarYCortar(
      d,
      async () =>
        (await completados()) === 1 &&
        (await d.b.getByRole("listitem").count()) === 0,
    );
    await expect(d.b.getByText("Todavía no completaste nada")).toBeVisible();
    await sigueDurante(6000, async () => (await completados()) === 1);
    await silencio(d.b);
    await d.ctxB.setOffline(false);
    await esperarA(async () => (await completados()) === 0);
    await expect(d.b.getByText("Todavía no completaste nada")).toBeVisible();
    await expect(d.b.getByRole("listitem")).toHaveCount(0);
    await silencio(d.b);
  } finally {
    await d.b.context().close();
  }
});

// ---------------------------------------------------------------------------
// Flujo 6: sin temporizadores
// ---------------------------------------------------------------------------

test("Flujo 6: sin temporizadores, solo al cambiar los datos", async ({
  browser,
}) => {
  test.setTimeout(300_000);
  const d = await conHuerfanaPorLimpiar(browser);
  try {
    await cortarElIntento(d);

    // Paso 1: B con conexión, pero con el servidor inalcanzable el intento de la vuelta de la conexión también falla.
    await d.b
      .context()
      .route(/127\.0\.0\.1:8080/, (ruta) => ruta.abort("connectionfailed"));
    await d.ctxB.setOffline(false);
    await d.b.waitForTimeout(15_000);
    expect(await huerfanaEnServidor()).toBe(true);
    // El servidor vuelve a estar a mano; la persona no cambia nada y pasa 1 hora simulada.
    await d.b.context().unroute(/127\.0\.0\.1:8080/);
    await d.b.clock.pauseAt(new Date("2026-07-15T08:30:00"));
    await d.b.clock.runFor(60 * 60_000);
    await d.b.clock.resume();
    await d.b.waitForTimeout(15_000);
    expect(await huerfanaEnServidor()).toBe(true);
    await expect(entradas(d.b)).toHaveCount(1);
    await silencio(d.b);

    // Paso 2: cambian los datos.
    await ir(d.b, "Pendientes");
    await anotar(d.b, "cambio");
    await esperarA(async () => !(await huerfanaEnServidor()));
    expect(await textosDeAnotaciones()).toEqual(["cambio", "queda"]);
    await silencio(d.b);
  } finally {
    await d.b.context().close();
  }
});

// ---------------------------------------------------------------------------
// Flujo 7: etiquetas duplicadas y referencias a etiquetas borradas
// ---------------------------------------------------------------------------

const chipsDeFila = (page: Page, titulo: string) =>
  fila(page, titulo)
    .getByRole("list", { name: "Etiquetas", exact: true })
    .getByRole("listitem");
const chipsDeLaPantalla = (page: Page) => page.getByRole("listitem");
const entradaEtiqueta = (page: Page, nombre: string) =>
  page.getByRole("listitem", { name: nombre, exact: true });

const etiquetasDeTareaEnServidor = async (titulo: string) => {
  const tarea = (await documentos("tareas")).find(
    (t) => texto(t.campos, "titulo") === titulo,
  );
  return (
    (tarea?.campos.etiquetas?.arrayValue?.values ?? []) as {
      stringValue: string;
    }[]
  ).map((v) => v.stringValue);
};

/** A y B ven `Regar`; los dos se quedan sin conexión. */
async function dosSinConexionConRegar(browser: Browser): Promise<Dos> {
  const d = await dosDispositivos(browser, HOY);
  await crearYVer(d.a, { titulo: "Regar", tipo: "No se repite" });
  await expect(fila(d.b, "Regar")).toBeVisible();
  await cargarPantallas(d.a);
  await cargarPantallas(d.b);
  await d.a.context().setOffline(true);
  await d.ctxB.setOffline(true);
  return d;
}

test("Flujo 7: etiquetas duplicadas de dos dispositivos quedan en una sola", async ({
  browser,
}) => {
  test.setTimeout(240_000);
  const d = await dosSinConexionConRegar(browser);
  try {
    // Paso 1.
    await editar(d.a, "Regar", { etiquetas: ["Cocina"] });
    await editar(d.b, "Regar", { etiquetas: ["cocina"] });
    await d.a.context().setOffline(false);
    await llegaAlServidor(d.a);
    await d.ctxB.setOffline(false);
    for (const p of [d.a, d.b]) {
      await ir(p, "Etiquetas");
      await expect(chipsDeLaPantalla(p)).toHaveCount(1, { timeout: 30_000 });
      await silencio(p);
    }
    await esperarA(async () => (await documentos("etiquetas")).length === 1);
    const [unica] = await documentos("etiquetas");
    const nombre = texto(unica.campos, "nombre")!;
    expect(["Cocina", "cocina"]).toContain(nombre);
    for (const p of [d.a, d.b]) {
      await expect(entradaEtiqueta(p, nombre)).toHaveCount(1);
      await ir(p, "Pendientes");
      await expect(chipsDeFila(p, "Regar")).toHaveCount(1);
      await expect(chipsDeFila(p, "Regar")).toHaveAttribute(
        "aria-label",
        nombre,
      );
      await silencio(p);
    }
    expect(await etiquetasDeTareaEnServidor("Regar")).toEqual([unica.id]);
  } finally {
    await d.cerrar();
  }
});

test("Flujo 7: una fusión cortada no se pierde", async ({ browser }) => {
  test.setTimeout(240_000);
  const d = await dosSinConexionConRegar(browser);
  try {
    // Paso 2: A llega primero y se va; B recibe sus datos con la red demorada y se corta justo cuando llegan.
    await editar(d.a, "Regar", { etiquetas: ["Cocina"] });
    await editar(d.b, "Regar", { etiquetas: ["cocina"] });
    await d.a.context().setOffline(false);
    await esperarA(async () => (await documentos("etiquetas")).length === 1);
    await llegaAlServidor(d.a);
    await d.a.context().close();
    await ir(d.b, "Etiquetas");
    await reconectarYCortar(
      d,
      async () => (await documentos("etiquetas")).length === 2,
    );
    await d.b.waitForTimeout(4000);
    await silencio(d.b);
    await d.ctxB.setOffline(false);
    await expect(chipsDeLaPantalla(d.b)).toHaveCount(1, { timeout: 30_000 });
    await esperarA(async () => (await documentos("etiquetas")).length === 1);
    const [unica] = await documentos("etiquetas");
    expect(await etiquetasDeTareaEnServidor("Regar")).toEqual([unica.id]);
    await ir(d.b, "Pendientes");
    await expect(chipsDeFila(d.b, "Regar")).toHaveCount(1);
    await silencio(d.b);
  } finally {
    await d.b.context().close();
  }
});

test("Flujo 7: la referencia a una etiqueta borrada se quita, al volver la conexión o al cambiar los datos", async ({
  browser,
}) => {
  test.setTimeout(300_000);
  const d = await dosDispositivos(browser, HOY);
  try {
    // Paso 3: A borra `Hogar` mientras B, sin conexión, se la asigna a `Pagar`.
    await crearYVer(d.a, {
      titulo: "Regar",
      tipo: "No se repite",
      etiquetas: ["Hogar"],
    });
    await crearYVer(d.a, { titulo: "Pagar", tipo: "No se repite" });
    await expect(chipsDeFila(d.b, "Regar")).toHaveCount(1);
    await expect(fila(d.b, "Pagar")).toBeVisible();
    await cargarPantallas(d.b);
    await d.ctxB.setOffline(true);
    await ir(d.a, "Etiquetas");
    await entradaEtiqueta(d.a, "Hogar")
      .getByRole("button", { name: "Borrar" })
      .click();
    await d.a
      .getByRole("alertdialog")
      .getByRole("button", { name: "Borrar", exact: true })
      .click();
    await expect(d.a.getByText("Todavía no hay etiquetas")).toBeVisible();
    await llegaAlServidor(d.a);
    await d.a.context().close();
    await editar(d.b, "Pagar", { etiquetas: ["Hogar"] });
    await expect(chipsDeFila(d.b, "Pagar")).toHaveCount(1);

    // B vuelve a tener conexión con la red demorada y se corta cuando ya ve que la etiqueta no existe.
    await reconectarYCortar(
      d,
      async () =>
        (await etiquetasDeTareaEnServidor("Pagar")).length === 1 &&
        (await chipsDeFila(d.b, "Pagar").count()) === 0,
    );
    await expect(chipsDeFila(d.b, "Pagar")).toHaveCount(0);
    await expect(d.b.getByText("Hogar", { exact: true })).toHaveCount(0);
    await sigueDurante(
      6000,
      async () => (await etiquetasDeTareaEnServidor("Pagar")).length === 1,
    );
    await silencio(d.b);

    // Con conexión pero sin el servidor a mano, el intento de la vuelta de la conexión también falla; con el servidor de vuelta y 1 hora simulada sin cambios no hay reintento: solo un cambio de datos reintenta.
    await d.b
      .context()
      .route(/127\.0\.0\.1:8080/, (ruta) => ruta.abort("connectionfailed"));
    await d.ctxB.setOffline(false);
    await d.b.waitForTimeout(15_000);
    expect((await etiquetasDeTareaEnServidor("Pagar")).length).toBe(1);
    await d.b.context().unroute(/127\.0\.0\.1:8080/);
    await d.b.clock.pauseAt(new Date("2026-07-15T08:30:00"));
    await d.b.clock.runFor(60 * 60_000);
    await d.b.clock.resume();
    await sigueDurante(
      10_000,
      async () => (await etiquetasDeTareaEnServidor("Pagar")).length === 1,
    );
    await editar(d.b, "Regar", { titulo: "Regar plantas" });
    await esperarA(
      async () => (await etiquetasDeTareaEnServidor("Pagar")).length === 0,
    );
    await expect(chipsDeFila(d.b, "Pagar")).toHaveCount(0);
    await expect(chipsDeFila(d.b, "Regar plantas")).toHaveCount(0);
    await silencio(d.b);
  } finally {
    await d.b.context().close();
  }
});
