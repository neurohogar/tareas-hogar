import {
  expect,
  test,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  abrir,
  abrirSelector,
  cerrar,
  completar,
  conReloj,
  crear,
  crearYVer,
  detener,
  dosDispositivos,
  fila,
  irA,
  limpiarEmuladores,
  llegaAlServidor,
  buscadorEmoji,
  emojiExacto,
  emojisDelSelector,
  selectorEmoji,
  sesionConReloj,
} from "./apoyo";
import {
  ATKINSON_ARCHIVOS,
  documentos,
  fallaDeRed,
  guardarDocumento,
  NOTO_ARCHIVO,
  olvidarFuentes,
  pantalla,
  recargarDetenida,
  retener,
  sinAvisos,
  textoVisible,
  uidDeLaCuenta,
} from "./pantalla-apoyo";
import {
  ATKINSON,
  conAtkinson,
  conNoto,
  esNoto,
  esOtra,
  glifos,
  plataforma,
  reparto,
  repartoEs,
} from "./fuente-apoyo";

const HORA = "2026-07-15T08:00:00";
const NO_TIENE_NOTO = "\u{1FAFF}";

test.beforeEach(async () => {
  await limpiarEmuladores();
});

// ---------------------------------------------------------------------------
// Pedidos de red
// ---------------------------------------------------------------------------

const ORIGEN = "http://127.0.0.1:4173";

/** Registra todo pedido a un origen que no es la app ni Firebase Auth / Firestore (emuladores o servicios de Firebase). */
function pedidosExternos(page: Page): string[] {
  const externos: string[] = [];
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (["data:", "blob:", "about:"].includes(u.protocol)) return;
    if (["127.0.0.1", "localhost", "apis.google.com"].includes(u.hostname))
      return; // apis.google.com: el SDK de Firebase Auth
    if (/(^|\.)(googleapis|firebaseio|firebaseapp)\.com$/.test(u.hostname))
      return;
    externos.push(r.url());
  });
  return externos;
}

const bloquearFuente = (ctx: BrowserContext | Page) =>
  ctx.route(ATKINSON_ARCHIVOS, (r) => r.abort());
const bloquearEmoji = (ctx: BrowserContext | Page) =>
  ctx.route(NOTO_ARCHIVO, (r) => r.abort());

// ---------------------------------------------------------------------------
// Flujo 1
// ---------------------------------------------------------------------------

const barra = (page: Page) => page.getByRole("navigation");

const combinaciones = [
  {
    nombre: "Celular claro",
    ancho: 360,
    alto: 640,
    tema: "light",
    touch: true,
  },
  {
    nombre: "Celular oscuro",
    ancho: 360,
    alto: 640,
    tema: "dark",
    touch: true,
  },
  {
    nombre: "Ancho claro",
    ancho: 1024,
    alto: 768,
    tema: "light",
    touch: false,
  },
  {
    nombre: "Ancho oscuro",
    ancho: 1024,
    alto: 768,
    tema: "dark",
    touch: false,
  },
] as const;

for (const c of combinaciones) {
  test(`Flujo 1: toda la app con la fuente (${c.nombre})`, async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      baseURL: ORIGEN,
      locale: "es-AR",
      timezoneId: "America/Argentina/Buenos_Aires",
      viewport: { width: c.ancho, height: c.alto },
      hasTouch: c.touch,
      isMobile: c.touch,
      colorScheme: c.tema,
    });
    const page = await ctx.newPage();

    // Paso 8: la app no tiene un control para cerrar sesión; la pantalla de entrada se ve antes de entrar.
    await page.goto("/");
    const entrar = page.getByRole("button", { name: "Entrar con Google" });
    await expect(entrar).toBeVisible();
    await conAtkinson(page, entrar);
    await conAtkinson(
      page,
      page.getByRole("heading", { name: "Tareas Hogar" }),
    );

    await sesionConReloj(page, HORA);

    // Paso 1.
    await crearYVer(page, {
      titulo: "Regar",
      tipo: "Intervalo",
      cada: "2",
      unidad: "días",
      emoji: "🌱",
      etiquetas: ["Cocina"],
      nota: "Año 2026 ✈",
    });

    // Paso 2: Pendientes.
    const f = fila(page, "Regar");
    await repartoEs(
      page,
      f.getByRole("button", { name: /Regar$/ }),
      ([a, n, o]) => a >= 5 && n === 1 && o === 0,
    );
    await conAtkinson(
      page,
      barra(page).getByRole("link", { name: "Pendientes" }),
    );
    await conAtkinson(
      page,
      page.getByRole("heading", { name: "Pendientes", level: 1 }),
    );

    // Paso 3: Historial y Etiquetas.
    await irA(page, "Historial");
    await conAtkinson(
      page,
      page.getByRole("heading", { name: "Historial", level: 1 }),
    );
    await conAtkinson(page, barra(page));
    await irA(page, "Etiquetas");
    await conAtkinson(
      page,
      page.getByRole("heading", { name: "Etiquetas", level: 1 }),
    );
    await conAtkinson(page, page.getByText("Cocina").first());
    await irA(page, "Pendientes");

    // Paso 4: el panel.
    await abrir(page, "Regar");
    const dialogo = page.getByRole("dialog");
    await conAtkinson(
      page,
      dialogo.getByRole("heading", { name: "Editar tarea" }),
    );
    await conAtkinson(page, page.getByLabel("Título"));
    await conAtkinson(page, dialogo.getByRole("button", { name: "Guardar" }));
    const acciones = dialogo.getByRole("tab", { name: /^Acciones/ });
    if ((await acciones.count()) > 0) await acciones.click();
    await conAtkinson(
      page,
      dialogo.getByRole("button", { name: "Borrar tarea" }),
    );
    await conAtkinson(
      page,
      dialogo.getByRole("button", { name: /^(Pausar|Posponer)/ }).first(),
    );
    for (const pestana of ["Tarea", "Cuándo", "Acciones"]) {
      const tab = dialogo.getByRole("tab", { name: new RegExp(`^${pestana}`) });
      if ((await tab.count()) > 0) await conAtkinson(page, tab);
    }
    const tabTarea = dialogo.getByRole("tab", { name: /^Tarea/ });
    if ((await tabTarea.count()) > 0) await tabTarea.click();
    const nota = page.getByLabel("Nota");
    await expect(nota).toHaveValue("Año 2026 ✈");
    await repartoEs(page, nota, ([a, n, o]) => a >= 8 && n === 1 && o === 0);
    await repartoEs(
      page,
      page.getByRole("button", { name: /^Cambiar emoji/ }),
      ([a, n, o]) => a === 0 && n === 1 && o === 0,
    );

    // Paso 5: el selector de emoji.
    await abrirSelector(page);
    const sel = selectorEmoji(page);
    // Recientes y la categoría siguiente, emoji por emoji; todas las categorías las recorre el Flujo 6.
    for (const i of [0, 1]) {
      await sel.getByRole("tab").nth(i).click();
      await expect(sel.getByRole("tab").nth(i)).toHaveAttribute("aria-selected", "true");
      const emojis = emojisDelSelector(page);
      await expect(emojis.first()).toBeVisible();
      const cuantos = await emojis.count();
      for (let e = 0; e < cuantos; e++) await conNoto(page, emojis.nth(e));
    }
    await conAtkinson(page, sel.locator("input.search"));
    await conAtkinson(page, sel.getByRole("button", { name: "Cerrar" }));
    await conAtkinson(page, sel.getByRole("heading").first());
    await sel.getByRole("button", { name: "Cerrar" }).click();
    await expect(sel).toHaveCount(0);

    // Paso 7: el aviso de cambios sin guardar.
    await page.getByLabel("Título").fill("Regar mucho");
    await page.getByRole("button", { name: "Cerrar" }).click();
    const aviso = page.getByRole("alertdialog", {
      name: "Tenés cambios sin guardar",
    });
    await expect(aviso).toBeVisible();
    await conAtkinson(page, aviso);
    await conAtkinson(
      page,
      aviso.getByRole("button", { name: "Descartar", exact: true }),
    );
    await aviso.getByRole("button", { name: "Descartar", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Paso 6: el aviso de deshacer.
    await completar(page, "Regar");
    const deshacer = page.getByRole("status");
    await expect(deshacer).toContainText("Completaste «🌱 Regar»");
    await repartoEs(
      page,
      deshacer,
      ([a, n, o]) => a > 10 && n === 1 && o === 0,
    );
    await conAtkinson(page, deshacer.getByRole("button", { name: "Deshacer" }));

    await ctx.close();
  });
}

// ---------------------------------------------------------------------------
// Flujo 2
// ---------------------------------------------------------------------------

test("Flujo 2: qué fuente dibuja cada carácter", async ({ page }) => {
  await sesionConReloj(page, HORA);
  await crearYVer(page, {
    titulo: "Ñandú: camión ❤ 日本語 🌱",
    tipo: "Intervalo",
    cada: "2",
    unidad: "días",
    nota: "☀ ☎ © ™ #",
  });

  const titulo = fila(page, "Ñandú").getByRole("button").first();
  // Atkinson: «Ñandú: camión» (12 letras y signos); Noto: ❤ y 🌱; sistema: 日本語.
  await repartoEs(page, titulo, ([a, n, o]) => a >= 12 && n === 2 && o >= 1);
  const [, , otras] = await reparto(page, titulo);
  expect(otras).toBeGreaterThanOrEqual(1);
  const fs = await plataforma(page, titulo);
  expect(fs.filter(esOtra).every((x) => x.familyName !== ATKINSON)).toBe(true);

  await abrir(page, "Ñandú");
  const campo = page.getByLabel("Título");
  await repartoEs(page, campo, ([a, n, o]) => a >= 12 && n === 2 && o >= 1);
  const nota = page.getByLabel("Nota");
  // ☀ ☎ con Noto; © ™ # con Atkinson.
  await repartoEs(page, nota, ([a, n, o]) => n === 2 && a >= 3 && o === 0);

  // Paso 4: emoji con ZWJ, con tono y bandera, cada uno un solo dibujo.
  for (const e of ["👨‍👩‍👧", "👍🏽", "🇦🇷"]) {
    await campo.fill(e);
    await repartoEs(page, campo, ([a, n, o]) => a === 0 && n === 1 && o === 0);
  }
  await page.getByRole("button", { name: "Cerrar" }).click();
  await page
    .getByRole("alertdialog", { name: "Tenés cambios sin guardar" })
    .getByRole("button", { name: "Descartar", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// Flujo 3
// ---------------------------------------------------------------------------

interface Medida {
  caja: [number, number];
  tam: string;
  peso: string;
}

async function medir(page: Page, l: Locator): Promise<Medida> {
  const caja = await l.first().boundingBox();
  const est = await l
    .first()
    .evaluate((e) => [
      getComputedStyle(e).fontSize,
      getComputedStyle(e).fontWeight,
    ]);
  return { caja: [caja!.width, caja!.height], tam: est[0], peso: est[1] };
}

/** Lo que el paso 2 compara: tamaño, peso y resaltado, con el panel abierto para ver la nota. */
async function jerarquia(page: Page) {
  const estilo = (l: Locator) =>
    l.first().evaluate((e) => {
      const c = getComputedStyle(e);
      return {
        tam: parseFloat(c.fontSize),
        peso: parseFloat(c.fontWeight),
        color: c.color,
        marca: c.boxShadow,
      };
    });
  const tituloFila = await estilo(fila(page, "Regar").getByRole("button").first());
  const elegida = await estilo(
    barra(page).getByRole("link", { name: "Pendientes" }),
  );
  const otra = await estilo(barra(page).getByRole("link", { name: "Historial" }));
  await expect(
    barra(page).getByRole("link", { name: "Pendientes" }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    barra(page).getByRole("link", { name: "Historial" }),
  ).not.toHaveAttribute("aria-current", "page");
  await abrir(page, "Regar");
  const nota = await estilo(page.getByLabel("Nota"));
  const encabezado = await estilo(
    page.getByRole("dialog").getByRole("heading", { name: "Editar tarea" }),
  );
  await cerrar(page);
  return { tituloFila, nota, encabezado, elegida, otra };
}

/** Paso 2: al crear y al editar, en Celular y en Ancho, el campo Título mide 20px y la Nota 16px. */
async function medidasDelPanel(page: Page) {
  const tam = (l: Locator) =>
    l.evaluate((e) => getComputedStyle(e).fontSize);
  const inicial = page.viewportSize()!;
  for (const [width, height] of [
    [360, 640],
    [1024, 768],
  ]) {
    await page.setViewportSize({ width, height });
    await page.getByRole("button", { name: "+" }).click();
    expect(await tam(page.getByLabel("Título"))).toBe("20px");
    expect(await tam(page.getByLabel("Nota"))).toBe("16px");
    await cerrar(page);
    await abrir(page, "Regar");
    expect(await tam(page.getByLabel("Título"))).toBe("20px");
    expect(await tam(page.getByLabel("Nota"))).toBe("16px");
    await cerrar(page);
  }
  await page.setViewportSize(inicial);
}

function jerarquiaSeMantiene(j: Awaited<ReturnType<typeof jerarquia>>) {
  // El título de la fila se distingue de la nota por el peso (el tamaño es el mismo).
  expect(j.tituloFila.tam).toBe(j.nota.tam);
  expect(j.tituloFila.peso).toBeGreaterThan(j.nota.peso);
  expect(j.encabezado.tam).toBeGreaterThan(j.nota.tam);
  // La pestaña elegida se resalta con peso, color y una marca que las demás no tienen.
  expect(j.elegida.peso).toBeGreaterThan(j.otra.peso);
  expect(j.elegida.color).not.toBe(j.otra.color);
  expect(j.elegida.marca).not.toBe("none");
  expect(j.otra.marca).toBe("none");
}

test("Flujo 3: sin cambios de diseño y horas de ancho fijo", async ({
  page,
}) => {
  await bloquearFuente(page);
  await sesionConReloj(page, HORA);
  await crearYVer(page, {
    titulo: "Regar",
    tipo: "Intervalo",
    cada: "2",
    unidad: "días",
    nota: "x",
  });
  const sondas = (p: Page) => ({
    titulo: fila(p, "Regar").getByRole("button").first(),
    boton: p.getByRole("button", { name: "+" }),
    pestana: barra(p).getByRole("link", { name: "Pendientes" }),
  });
  // Con la fuente bloqueada: sistema.
  const antes: Record<string, Medida> = {};
  for (const [k, l] of Object.entries(sondas(page)))
    antes[k] = await medir(page, l);
  const jerarquiaAntes = await jerarquia(page);
  jerarquiaSeMantiene(jerarquiaAntes);
  await expect
    .poll(async () => (await reparto(page, sondas(page).titulo))[0])
    .toBe(0);
  await medidasDelPanel(page);

  await page.unroute(ATKINSON_ARCHIVOS);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Pendientes" })).toBeVisible();
  await conAtkinson(page, sondas(page).titulo);
  for (const [k, l] of Object.entries(sondas(page))) {
    const d = await medir(page, l);
    expect(d.tam, k).toBe(antes[k].tam);
    expect(d.peso, k).toBe(antes[k].peso);
  }
  // Paso 2: la jerarquía se mantiene, igual a la de antes.
  const jerarquiaDespues = await jerarquia(page);
  jerarquiaSeMantiene(jerarquiaDespues);
  expect(jerarquiaDespues).toEqual(jerarquiaAntes);
  await medidasDelPanel(page);

  // Horas de ancho fijo en el Historial.
  await crear(page, {
    titulo: "Uno",
    tipo: "Intervalo",
    cada: "1",
    unidad: "días",
  });
  await crear(page, {
    titulo: "Dos",
    tipo: "Intervalo",
    cada: "1",
    unidad: "días",
  });
  await expect(fila(page, "Dos")).toBeVisible();
  await detener(page, "2026-07-15T08:05:00");
  await completar(page, "Uno");
  await page.clock.runFor(1000);
  await page.clock.setFixedTime(new Date("2026-07-15T11:11:00"));
  await page.clock.runFor(1000);
  await completar(page, "Dos");
  await conReloj(page, async () => {
    await irA(page, "Historial");
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
  const hora = page.getByText(/\b08:05\b/).first();
  await conAtkinson(page, hora);
  const tnum = await hora.evaluate(
    (e) => getComputedStyle(e).fontVariantNumeric,
  );
  expect(tnum).toContain("tabular-nums");
});

// ---------------------------------------------------------------------------
// Flujo 4 (parte con conexión; la parte sin conexión vive en
// fuente-empaquetada-sin-conexion.spec.ts, que necesita el service worker)
// ---------------------------------------------------------------------------

test("Flujo 4: ningún pedido a un servicio externo", async ({ page }) => {
  const externos = pedidosExternos(page);
  await sesionConReloj(page, HORA);
  await crearYVer(page, {
    titulo: "Regar",
    tipo: "Intervalo",
    cada: "2",
    unidad: "días",
    emoji: "🌱",
  });
  await irA(page, "Historial");
  await irA(page, "Etiquetas");
  await irA(page, "Pendientes");
  await abrir(page, "Regar");
  await abrirSelector(page);
  await expect(page.locator("body")).toBeVisible();
  expect(externos).toEqual([]);
});

// ---------------------------------------------------------------------------
// Flujo 5
// ---------------------------------------------------------------------------

async function tareaConEmoji(page: Page) {
  await crearYVer(page, {
    titulo: "Regar",
    tipo: "Intervalo",
    cada: "2",
    unidad: "días",
    emoji: "🌱",
  });
  await repartoEs(
    page,
    tituloFila(page),
    ([a, n, o]) => a >= 5 && n === 1 && o === 0,
  );
}

const tituloFila = (page: Page) =>
  fila(page, "Regar").getByRole("button").first();

const enAtkinsonYNoto = (page: Page) =>
  repartoEs(
    page,
    tituloFila(page),
    ([a, n, o]) => a >= 5 && n === 1 && o === 0,
  );

/** Los emoji con los del dispositivo: Noto no dibuja nada, y el emoji no queda en blanco. */
async function conEmojiDelDispositivo(page: Page) {
  await expect
    .poll(async () => {
      const fs = await plataforma(page, tituloFila(page));
      return glifos(fs, esNoto) === 0 && glifos(fs, esOtra) >= 1;
    })
    .toBe(true);
  expect((await tituloFila(page).boundingBox())!.width).toBeGreaterThan(30);
}

/** Lo guardado sirve aunque se bloquee la red: para que falte, cada paso empieza olvidándolo. */
test("Flujo 5 pasos 1 y 2: sin la fuente, la pantalla no la espera, todo con la del sistema y sin aviso", async ({
  page,
}) => {
  await sesionConReloj(page, HORA);
  await tareaConEmoji(page);
  await crearYVer(page, {
    titulo: "Año 2026 12:30 # * ©",
    tipo: "Intervalo",
    cada: "2",
    unidad: "días",
  });
  await olvidarFuentes(page);
  await bloquearFuente(page);

  // Paso 1: la pantalla se muestra sin texto de respaldo y se va a los 0,5 s, sin esperar lo que falló.
  const apertura = await recargarDetenida(page);
  await expect(pantalla(page)).toBeVisible();
  expect(await textoVisible(page)).toBe("");
  await apertura.hastaMontar(page.getByText("Regar"));
  await apertura.sigueA(0.4);
  await apertura.seVaA(0.5);
  await expect(tituloFila(page)).toBeVisible();
  await expect
    .poll(async () => {
      const [a, , o] = await reparto(page, tituloFila(page));
      return a === 0 && o > 0;
    })
    .toBe(true);
  // Todo el texto, también cifras, signos y espacios, aunque el juego de emoji ya esté: Noto también los tiene.
  await repartoEs(
    page,
    fila(page, "Año").getByRole("button").first(),
    ([a, n, o]) => a === 0 && n === 0 && o > 0,
  );
  await sinAvisos(page);

  // Paso 2: quitar el bloqueo y recargar.
  await page.unroute(ATKINSON_ARCHIVOS);
  await (await recargarDetenida(page)).seVaA(0.5);
  await enAtkinsonYNoto(page);
});

test("Flujo 5 pasos 3 y 4: sin el juego, la pantalla no lo espera y los emoji son los del dispositivo", async ({
  page,
}) => {
  await sesionConReloj(page, HORA);
  await tareaConEmoji(page);
  await olvidarFuentes(page);
  await bloquearEmoji(page);

  // Paso 3.
  const apertura = await recargarDetenida(page);
  await apertura.hastaMontar(page.getByText("Regar"));
  await apertura.sigueA(0.4);
  await apertura.seVaA(0.5);
  await conEmojiDelDispositivo(page);
  await sinAvisos(page);

  // Paso 4.
  await page.unroute(NOTO_ARCHIVO);
  await (await recargarDetenida(page)).seVaA(0.5);
  await enAtkinsonYNoto(page);
});

test("Flujo 5 paso 5: con el pedido demorado sigue hasta el tope; al liberarlo, Noto sin recargar ni segundo pedido", async ({
  page,
}) => {
  await sesionConReloj(page, HORA);
  await tareaConEmoji(page);
  await olvidarFuentes(page);
  const juego = await retener(page, NOTO_ARCHIVO);
  const apertura = await recargarDetenida(page);
  await apertura.sigueA(9.9);
  await apertura.seVaA(10);
  await conEmojiDelDispositivo(page);
  await sinAvisos(page);
  expect(juego.pedidos()).toBe(1);

  juego.liberar();
  await enAtkinsonYNoto(page);
  await sinAvisos(page);
  expect(juego.pedidos()).toBe(1);
});

test("Flujo 5 paso 6: con la descarga abortada no llega al tope; al volver la red se pide otra vez, sin recargar", async ({
  page,
}) => {
  await sesionConReloj(page, HORA);
  await tareaConEmoji(page);
  await olvidarFuentes(page);
  const juego = await fallaDeRed(page, NOTO_ARCHIVO);
  const apertura = await recargarDetenida(page);
  await apertura.hastaMontar(page.getByText("Regar"));
  await expect.poll(juego.pedidos).toBeGreaterThan(0);
  await apertura.sigueA(0.4);
  await apertura.seVaA(0.5);
  await conEmojiDelDispositivo(page);
  await sinAvisos(page);

  // Sin conexión, quitar la falla y volver a tener conexión: hay un pedido nuevo.
  const contexto = page.context();
  await contexto.setOffline(true);
  await expect(page.getByText("Sin conexión")).toBeVisible();
  juego.quitar();
  const antes = juego.pedidos();
  await contexto.setOffline(false);
  await expect.poll(juego.pedidos).toBeGreaterThan(antes);
  await enAtkinsonYNoto(page);
  await sinAvisos(page);
});

// ---------------------------------------------------------------------------
// Flujo 6
// ---------------------------------------------------------------------------

test("Flujo 6: un emoji que el juego no tiene se guarda y se muestra igual", async ({
  browser,
}) => {
  const { a, b, cerrar: cerrarDos } = await dosDispositivos(browser, HORA);
  try {
    await crearYVer(a, {
      titulo: `Prueba ${NO_TIENE_NOTO}`,
      tipo: "Intervalo",
      cada: "2",
      unidad: "días",
    });
    const fa = fila(a, "Prueba").getByRole("button").first();
    await expect(fa).toContainText(NO_TIENE_NOTO);
    await expect
      .poll(async () => {
        const fs = await plataforma(a, fa);
        return glifos(fs, esNoto) === 0;
      })
      .toBe(true);
    expect((await fa.boundingBox())!.width).toBeGreaterThan(30);
    await expect(a.getByRole("alert")).toHaveCount(0);

    await abrir(a, "Prueba");
    await expect(a.getByLabel("Título")).toHaveValue(`Prueba ${NO_TIENE_NOTO}`);
    await cerrar(a);

    await llegaAlServidor(a);
    await expect(fila(b, "Prueba").getByRole("button").first()).toContainText(
      NO_TIENE_NOTO,
    );
  } finally {
    await cerrarDos();
  }
});

// El catálogo que viaja con la app: la fuente independiente del selector y de la fuente que lo dibuja.
const CATALOGO = JSON.parse(
  readFileSync("node_modules/emoji-picker-element-data/es/cldr/data.json", "utf8"),
) as {
  emoji: string;
  group: number;
  skins?: { tone: number | number[]; emoji: string }[];
}[];
/** El grupo 2 son los componentes (tonos y pelo sueltos): no se eligen como emoji, y nunca se ofrecieron. */
const ELEGIBLES = CATALOGO.filter((e) => e.group !== 2);
const TONOS = [1, 2, 3, 4, 5];

/** Para un tono, cada emoji con esa variante (las de dos tonos no se ofrecen) o el emoji sin variantes. */
const catalogoConTono = (tono: number) =>
  ELEGIBLES.map(
    (e) => e.skins?.find((s) => s.tone === tono)?.emoji ?? e.emoji,
  );

/** Todo lo que el selector ofrece, recorriendo sus pestañas de categoría como un usuario. */
async function loQueOfrece(page: Page): Promise<string[]> {
  const pestanas = selectorEmoji(page).getByRole("tab");
  const ofrecidos: string[] = [];
  let anterior = "";
  for (let i = 0; i < (await pestanas.count()); i++) {
    await pestanas.nth(i).click();
    await expect(pestanas.nth(i)).toHaveAttribute("aria-selected", "true");
    let leidos: string[] = [];
    let previa = anterior;
    await expect
      .poll(
        async () => {
          leidos = await emojisDelSelector(page).allTextContents();
          const lectura = leidos.join();
          const firme = lectura !== anterior && lectura === previa;
          previa = lectura;
          return firme;
        },
        { intervals: [200] },
      )
      .toBe(true);
    anterior = leidos.join();
    ofrecidos.push(...leidos);
  }
  return ofrecidos;
}

function esElMismoCatalogo(ofrecidos: string[], esperados: string[]) {
  const de = (lista: string[]) => new Set(lista);
  expect(ofrecidos.length, "sin repetidos").toBe(de(ofrecidos).size);
  expect(
    esperados.filter((e) => !de(ofrecidos).has(e)),
    "falta",
  ).toEqual([]);
  expect(
    ofrecidos.filter((e) => !de(esperados).has(e)),
    "sobra",
  ).toEqual([]);
}

test("Flujo 6 paso 5: el selector ofrece los mismos emoji, ni falta ni sobra", async ({
  page,
}) => {
  test.setTimeout(240_000);
  await sesionConReloj(page, HORA);
  await crear(page, {
    titulo: "Prueba",
    tipo: "Intervalo",
    cada: "2",
    unidad: "días",
  });

  // Sin el juego de emoji: lo que se ofrecía antes de empaquetarlo.
  await olvidarFuentes(page);
  await bloquearEmoji(page);
  await page.reload();
  await abrir(page, "Prueba");
  await abrirSelector(page);
  await expect
    .poll(async () =>
      glifos(await plataforma(page, emojisDelSelector(page).first()), esNoto),
    )
    .toBe(0);
  // La fuente del catálogo es independiente del selector: 1914 base y 9 componentes que no se ofrecen.
  expect(ELEGIBLES).toHaveLength(1914);
  expect(CATALOGO.length - ELEGIBLES.length).toBe(9);
  const sinNoto = await loQueOfrece(page);
  esElMismoCatalogo(sinNoto, catalogoConTono(0));

  // Con Noto: los mismos, contra el catálogo y contra lo de recién.
  await page.unroute(NOTO_ARCHIVO);
  await page.reload();
  await abrir(page, "Prueba");
  await abrirSelector(page);
  const conJuego = await loQueOfrece(page);
  await conNoto(page, emojisDelSelector(page).first());
  esElMismoCatalogo(conJuego, catalogoConTono(0));
  expect(conJuego).toEqual(sinNoto);

  // Y cada variante de tono, eligiendo el tono en el selector.
  for (const tono of TONOS) {
    await selectorEmoji(page).locator("#skintone-button").click();
    await selectorEmoji(page)
      .locator("#skintone-list [role=option]")
      .nth(tono)
      .click();
    esElMismoCatalogo(await loQueOfrece(page), catalogoConTono(tono));
  }
});

test("Flujo 6 paso 5: buscar da resultados y elegir uno lo asigna y cierra el selector", async ({
  page,
}) => {
  await sesionConReloj(page, HORA);
  await crearYVer(page, {
    titulo: "Prueba",
    tipo: "Intervalo",
    cada: "2",
    unidad: "días",
  });
  for (const [busqueda, emoji] of [
    ["planta", "🌱"],
    ["escoba", "🧹"],
    ["perro", "🐶"],
  ]) {
    await abrir(page, "Prueba");
    await abrirSelector(page);
    await buscadorEmoji(page).fill(busqueda);
    await expect(emojiExacto(page, emoji)).toHaveCount(1);
    await emojiExacto(page, emoji).click();
    await expect(selectorEmoji(page)).toHaveCount(0);
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(fila(page, "Prueba").getByRole("button").first()).toContainText(emoji);
  }
});

test("Flujo 6 paso 6: un cabello suelto o dos tonos llegados por otra vía se muestran y se conservan al guardar", async ({
  page,
}) => {
  await sesionConReloj(page, HORA);
  await crearYVer(page, {
    titulo: "Molde",
    tipo: "Intervalo",
    cada: "2",
    unidad: "días",
  });
  await llegaAlServidor(page);
  const uid = await uidDeLaCuenta();
  const [molde] = await documentos(uid, "tareas");
  const llegados = ["🦰", "🦱", "🦳", "🦲", "🧑🏻‍🤝‍🧑🏿"];
  for (const [i, emoji] of llegados.entries())
    await guardarDocumento(uid, "tareas", `llegada${i}`, {
      ...molde.fields,
      titulo: { stringValue: `Llegada ${i}` },
      emoji: { stringValue: emoji },
    });

  for (const [i, emoji] of llegados.entries()) {
    const titulo = `Llegada ${i}`;
    const boton = fila(page, titulo).getByRole("button").first();
    await expect(boton).toContainText(emoji);
    await abrir(page, titulo);
    await page.getByLabel("Nota").fill("Cambiada");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await sinAvisos(page);
    await expect(boton).toContainText(emoji);
    await llegaAlServidor(page);
    const guardada = (await documentos(uid, "tareas")).find((d) =>
      d.name.endsWith(`/llegada${i}`),
    );
    expect(guardada?.fields.emoji).toEqual({ stringValue: emoji });
    expect(guardada?.fields.nota).toEqual({ stringValue: "Cambiada" });
  }
});
