import { expect, test, type Browser, type Page } from "@playwright/test";
import {
  abrir,
  abrirSelector,
  buscadorEmoji,
  cerrar,
  controlada,
  completar,
  conReloj,
  crear,
  crearYVer,
  detener,
  dispositivo,
  dosDispositivos,
  editar,
  elegirEmoji,
  emojiExacto,
  emojisDelSelector,
  esperarEstado,
  fila,
  irA,
  limpiarEmuladores,
  llegaAlServidor,
  selectorEmoji,
  sesionConReloj,
} from "./apoyo";

const LUNES = "2026-07-13T08:00:00";
const SIN_RESULTADOS = "No se encontró ningún emoji.";

test.beforeEach(async () => {
  await limpiarEmuladores();
});

/** El nombre visible de la tarea en su fila (botón que abre el panel). */
const nombre = (page: Page, texto: string) =>
  fila(page, "Regar").getByRole("button", { name: texto, exact: true });

async function guardar(page: Page) {
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

/** El botón de la fila de Regar, con o sin el emoji que el último guardado haya llegado a poner en el nombre. */
const abrirRegar = (page: Page) =>
  fila(page, "Regar").getByRole("button", { name: /Regar$/ });

const botonElegir = (page: Page) =>
  page.getByRole("button", { name: "Elegir emoji" });
const botonQuitar = (page: Page) =>
  page.getByRole("button", { name: "Quitar emoji" });
const botonCambiar = (page: Page, emoji: string) =>
  page.getByRole("button", { name: `Cambiar emoji ${emoji}` });

async function verPanel(page: Page, emoji: string, nota: string) {
  if (emoji === "") {
    await expect(botonElegir(page)).toBeVisible();
    await expect(botonQuitar(page)).toHaveCount(0);
  } else {
    await expect(botonCambiar(page, emoji)).toBeVisible();
    await expect(botonQuitar(page)).toBeVisible();
    await expect(botonElegir(page)).toHaveCount(0);
  }
  await expect(page.getByLabel("Nota")).toHaveValue(nota);
}

/** Los recientes que muestra el selector, en orden; abre el selector y lo cierra con Cerrar. */
async function recientes(page: Page): Promise<string[]> {
  await abrirSelector(page);
  const botones = selectorEmoji(page)
    .locator('section[aria-labelledby="titulo-recientes"]')
    .getByRole("button");
  const lista =
    (await botones.count()) === 0
      ? []
      : await botones.evaluateAll((l) =>
          l.map((b) => b.getAttribute("aria-label") ?? ""),
        );
  await selectorEmoji(page).getByRole("button", { name: "Cerrar" }).click();
  await expect(selectorEmoji(page)).toHaveCount(0);
  return lista;
}

const seccionRecientes = (page: Page) =>
  selectorEmoji(page).getByRole("heading", { name: "Recientes" });

test("Flujo 1: elegir el emoji y verlo en la fila", async ({ page }) => {
  await sesionConReloj(page, LUNES);
  await crear(page, {
    titulo: "Regar",
    tipo: "Intervalo",
    cada: "2",
    unidad: "días",
  });
  await expect(nombre(page, "Regar")).toBeVisible();

  await abrir(page, "Regar");
  await expect(page.getByRole("textbox", { name: "Emoji" })).toHaveCount(0);
  await verPanel(page, "", "");
  await abrirSelector(page);
  await buscadorEmoji(page).fill("planta");
  await expect(emojiExacto(page, "🌱")).toHaveCount(1);
  await emojiExacto(page, "🌱").click();
  await expect(selectorEmoji(page)).toHaveCount(0);
  await verPanel(page, "🌱", "");
  await guardar(page);
  await expect(nombre(page, "🌱 Regar")).toBeVisible();

  await page.reload();
  await expect(nombre(page, "🌱 Regar")).toBeVisible();
  await abrir(page, "Regar");
  await verPanel(page, "🌱", "");
  await cerrar(page);

  const variantes: [string, string, number?][] = [
    ["👨‍👩‍👧", "familia"],
    ["👍🏽", "pulgar", 3],
    ["❤️", "corazón rojo"],
    ["🇦🇷", "argentina"],
  ];
  for (const [e, busqueda, tono] of variantes) {
    await abrir(page, "Regar");
    await botonQuitar(page).waitFor();
    await elegirEmoji(page, e, busqueda, tono);
    await verPanel(page, e, "");
    await guardar(page);
    await expect(nombre(page, `${e} Regar`)).toBeVisible();
  }

  await crear(page, {
    titulo: "Barrer",
    tipo: "Intervalo",
    cada: "1",
    unidad: "días",
    emoji: "🧹",
    nota: "Debajo de la mesa",
  });
  await expect(
    fila(page, "Barrer").getByRole("button", {
      name: "🧹 Barrer",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText("Debajo de la mesa")).toHaveCount(0);

  // Cerrar el selector sin elegir deja el panel sin emoji, con "Cerrar" y con Escape.
  await page.getByRole("button", { name: "+" }).click();
  await expect(
    page.getByRole("heading", { name: "Nueva tarea" }),
  ).toBeVisible();
  await abrirSelector(page);
  // Opening the selector focuses the dialog, not the search field: the on-screen keyboard stays down.
  await expect(selectorEmoji(page)).toBeFocused();
  await expect(buscadorEmoji(page)).not.toBeFocused();
  await selectorEmoji(page).getByRole("button", { name: "Cerrar" }).click();
  await expect(selectorEmoji(page)).toHaveCount(0);
  await verPanel(page, "", "");
  await abrirSelector(page);
  await page.keyboard.press("Escape");
  await expect(selectorEmoji(page)).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Nueva tarea" }),
  ).toBeVisible();
  await verPanel(page, "", "");
});

test("Flujo 2: quitar el emoji", async ({ page }) => {
  await sesionConReloj(page, LUNES);
  await crear(page, {
    titulo: "Regar",
    tipo: "Intervalo",
    cada: "2",
    unidad: "días",
    emoji: "🌱",
  });
  await expect(nombre(page, "🌱 Regar")).toBeVisible();

  await abrir(page, "Regar");
  await botonQuitar(page).click();
  await verPanel(page, "", "");
  await guardar(page);
  await expect(nombre(page, "Regar")).toBeVisible();

  await abrir(page, "Regar");
  await verPanel(page, "", "");
  await cerrar(page);
  await page.reload();
  await expect(nombre(page, "Regar")).toBeVisible();

  await abrir(page, "Regar");
  await elegirEmoji(page, "🔥");
  await botonQuitar(page).click();
  await cerrar(page);
  await expect(nombre(page, "Regar")).toBeVisible();
});

test("Flujo 3: catálogo, categorías y búsqueda en español", async ({
  page,
}) => {
  await sesionConReloj(page, LUNES);
  await crear(page, {
    titulo: "Regar",
    tipo: "Intervalo",
    cada: "2",
    unidad: "días",
  });
  await abrir(page, "Regar");
  await abrirSelector(page);

  const categorias = selectorEmoji(page).getByRole("tab");
  await expect(categorias).toHaveCount(9);
  const nombres = await categorias.evaluateAll((l) =>
    l.map((t) => t.getAttribute("aria-label") ?? ""),
  );
  for (const esperado of [
    /emoticones|caras/i,
    /Personas/,
    /Animales y naturaleza/,
    /Comida/,
    /Viajes/,
    /Actividades/,
    /Objetos/,
    /Símbolos/,
    /Banderas/,
  ])
    expect(nombres.some((n) => esperado.test(n))).toBe(true);

  const propios: Record<string, string> = {
    "Animales y naturaleza": "🐶",
    Banderas: "🇦🇷",
  };
  for (const n of nombres) {
    const tab = selectorEmoji(page).getByRole("tab", { name: n, exact: true });
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    await expect(emojisDelSelector(page).first()).toBeVisible();
    if (propios[n])
      await expect(emojiExacto(page, propios[n]).first()).toBeVisible();
  }

  const buscar = async (texto: string, emoji: string) => {
    await buscadorEmoji(page).fill(texto);
    await expect(emojiExacto(page, emoji).first()).toBeVisible();
  };
  await buscar("planta", "🌱");
  await buscar("escoba", "🧹");
  await buscar("perro", "🐶");
  await buscar("PERRO", "🐶");
  await buscar("perró", "🐶");

  await buscadorEmoji(page).fill("zzzzqq");
  await expect(emojisDelSelector(page)).toHaveCount(0);
  await expect(selectorEmoji(page).getByText(SIN_RESULTADOS)).toBeVisible();
  await buscadorEmoji(page).fill("");
  await expect(selectorEmoji(page).getByText(SIN_RESULTADOS)).toHaveCount(0);
  await expect(emojisDelSelector(page).first()).toBeVisible();
  expect(await emojisDelSelector(page).count()).toBeGreaterThan(20);

  await buscar("escoba", "🧹");
  await emojiExacto(page, "🧹").first().click();
  await expect(selectorEmoji(page)).toHaveCount(0);
  await verPanel(page, "🧹", "");
});

test("Flujo 4: recientes", async ({ browser }) => {
  const { a, b, cerrar: fin } = await dosDispositivos(browser, LUNES);
  await crear(a, {
    titulo: "Regar",
    tipo: "Intervalo",
    cada: "2",
    unidad: "días",
  });
  await expect(nombre(a, "Regar")).toBeVisible();

  await abrir(a, "Regar");
  await abrirSelector(a);
  await expect(seccionRecientes(a)).toHaveCount(0);
  await selectorEmoji(a).getByRole("button", { name: "Cerrar" }).click();
  await elegirEmoji(a, "🌱");
  await guardar(a);

  await abrir(a, "Regar");
  expect(await recientes(a)).toEqual(["🌱"]);
  await elegirEmoji(a, "🔥");
  await guardar(a);

  await abrir(a, "Regar");
  expect(await recientes(a)).toEqual(["🔥", "🌱"]);
  await elegirEmoji(a, "🌱");
  await guardar(a);

  await abrir(a, "Regar");
  expect(await recientes(a)).toEqual(["🌱", "🔥"]);
  await botonQuitar(a).click();
  await guardar(a);
  await abrir(a, "Regar");
  expect(await recientes(a)).toEqual(["🌱", "🔥"]);

  // 16 emojis distintos más: los primeros 16 de la grilla (ninguno es 🔥 ni 🌱).
  const elegidos: string[] = [];
  for (let i = 0; i < 16; i++) {
    await abrirSelector(a);
    const e = emojisDelSelector(a).nth(i);
    elegidos.push((await e.textContent()) ?? "");
    await e.click();
    await expect(selectorEmoji(a)).toHaveCount(0);
  }
  expect(new Set(elegidos).size).toBe(16);
  const esperados = [...elegidos].reverse();
  expect(await recientes(a)).toEqual(esperados);
  await guardar(a);

  await a.reload();
  await expect(abrirRegar(a)).toBeVisible();
  await abrirRegar(a).click();
  await expect(a.getByRole("heading", { name: "Editar tarea" })).toBeVisible();
  expect(await recientes(a)).toEqual(esperados);
  await cerrar(a);

  await a.getByRole("button", { name: "+" }).click();
  await expect(a.getByRole("heading", { name: "Nueva tarea" })).toBeVisible();
  expect(await recientes(a)).toEqual(esperados);
  await cerrar(a);

  // B (otro dispositivo, misma cuenta) no recibe los recientes de A.
  await expect(abrirRegar(b)).toBeVisible();
  await abrirRegar(b).click();
  await expect(b.getByRole("heading", { name: "Editar tarea" })).toBeVisible();
  await abrirSelector(b);
  await expect(seccionRecientes(b)).toHaveCount(0);
  await expect(
    selectorEmoji(b).locator('section[aria-labelledby="titulo-recientes"]'),
  ).toHaveCount(0);
  await fin();
});

test.describe("sin conexión", () => {
  test.use({ serviceWorkers: "allow" });
  const HORA = "2026-07-15T08:00:00";

  async function sesionPwa(browser: Browser) {
    const d = await dispositivo(browser, HORA, true);
    await controlada(d.page);
    await expect(
      d.page.getByRole("heading", { name: "Pendientes", level: 1 }),
    ).toBeVisible();
    return d;
  }

  test("Flujo 5: el selector sin conexión", async ({ browser }) => {
    const { ctx, page } = await sesionPwa(browser);
    const externas: string[] = [];
    ctx.on("request", (r) => {
      const u = new URL(r.url());
      // cleardot.gif es el sondeo de red de Firestore (WebChannel), no del selector.
      const esFirestore =
        u.hostname === "www.google.com" &&
        u.pathname === "/images/cleardot.gif";
      if (
        !["127.0.0.1", "localhost"].includes(u.hostname) &&
        u.protocol.startsWith("http") &&
        !esFirestore
      )
        externas.push(r.url());
    });
    await crear(page, { titulo: "Regar", tipo: "No se repite" });
    await expect(nombre(page, "Regar")).toBeVisible();

    // Con conexión: abrir el selector una vez y cerrarlo.
    await abrir(page, "Regar");
    await abrirSelector(page);
    await selectorEmoji(page).getByRole("button", { name: "Cerrar" }).click();
    await cerrar(page);
    await llegaAlServidor(page);

    await ctx.setOffline(true);
    await page.reload();
    await expect(nombre(page, "Regar")).toBeVisible();
    await abrir(page, "Regar");
    await abrirSelector(page);
    await expect(selectorEmoji(page).getByRole("tab")).toHaveCount(9);
    expect(await emojisDelSelector(page).count()).toBeGreaterThan(20);
    await expect(selectorEmoji(page).getByText("Cargando…")).toHaveCount(0);

    await buscadorEmoji(page).fill("planta");
    await expect(emojiExacto(page, "🌱").first()).toBeVisible();
    await emojiExacto(page, "🌱").first().click();
    await expect(selectorEmoji(page)).toHaveCount(0);
    await guardar(page);
    await expect(nombre(page, "🌱 Regar")).toBeVisible();

    expect(externas).toEqual([]);
    await ctx.setOffline(false);
    await expect(nombre(page, "🌱 Regar")).toBeVisible();
    expect(externas).toEqual([]);
    await ctx.close();
  });
});

test("Flujo 6: la nota, solo en el panel", async ({ page }) => {
  await sesionConReloj(page, LUNES);
  await crear(page, {
    titulo: "Regar",
    tipo: "Intervalo",
    cada: "2",
    unidad: "días",
  });

  await editar(page, "Regar", { nota: "  Usar guantes  " });
  await expect(page.getByText("Usar guantes")).toHaveCount(0);
  await abrir(page, "Regar");
  await expect(page.getByLabel("Nota")).toHaveValue("Usar guantes");
  await cerrar(page);

  await editar(page, "Regar", { nota: "Usar guantes\nVentilar" });
  await abrir(page, "Regar");
  await expect(page.getByLabel("Nota")).toHaveValue("Usar guantes\nVentilar");
  await cerrar(page);

  const larga = "x".repeat(5000);
  await editar(page, "Regar", { nota: larga });
  await abrir(page, "Regar");
  expect(await page.getByLabel("Nota").inputValue()).toBe(larga);
  await cerrar(page);

  await editar(page, "Regar", { nota: "   \n  " });
  await abrir(page, "Regar");
  await expect(page.getByLabel("Nota")).toHaveValue("");
  await cerrar(page);

  await page.reload();
  await expect(nombre(page, "Regar")).toBeVisible();
  await abrir(page, "Regar");
  await expect(page.getByLabel("Nota")).toHaveValue("");
  await cerrar(page);
  await expect(fila(page, "Regar")).not.toContainText("guantes");
});

// --- Flujo 7: reloj detenido para el aviso ---
const aviso = (page: Page) => page.getByRole("status");

const entrada = (page: Page, texto: string) =>
  page
    .getByRole("listitem")
    .filter({ hasText: new RegExp(`^${texto}\\s*\\d\\d:\\d\\d`) });

test("Flujo 7: el emoji en Historial y en el aviso de deshacer", async ({
  page,
}) => {
  await sesionConReloj(page, "2026-07-13T07:50:00");
  await crearYVer(page, {
    titulo: "Regar",
    tipo: "Intervalo",
    cada: "4",
    unidad: "horas",
    emoji: "🌱",
  });
  await crearYVer(page, {
    titulo: "Barrer",
    tipo: "Intervalo",
    cada: "4",
    unidad: "horas",
  });
  await detener(page, LUNES);

  await completar(page, "🌱 Regar");
  await conReloj(page, () =>
    expect(aviso(page)).toContainText("Completaste «🌱 Regar»"),
  );
  await expect(
    aviso(page).getByRole("button", { name: "Deshacer" }),
  ).toBeVisible();
  await page.clock.runFor(5100);
  await expect(aviso(page)).toHaveCount(0);

  await completar(page, "Barrer");
  await conReloj(page, () =>
    expect(aviso(page)).toHaveText(/^Completaste «Barrer»/),
  );
  await page.clock.runFor(5100);
  await expect(aviso(page)).toHaveCount(0);

  await irA(page, "Historial");
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(["Hoy"]);
  await expect(page.getByRole("listitem")).toHaveCount(2);
  await expect(entrada(page, "🌱 Regar")).toHaveCount(1);
  await expect(entrada(page, "Barrer")).toHaveCount(1);

  await page.clock.resume();
  await abrir(page, "🌱 Regar");
  await elegirEmoji(page, "🔥");
  await guardar(page);
  await expect(entrada(page, "🔥 Regar")).toHaveCount(1);
  await abrir(page, "Regar");
  await botonQuitar(page).click();
  await guardar(page);
  await expect(entrada(page, "Regar")).toHaveCount(1);
  await expect(page.getByText("🔥")).toHaveCount(0);

  await entrada(page, "Barrer")
    .getByRole("button", { name: "Borrar", exact: true })
    .click();
  await expect(page.getByRole("alertdialog")).toHaveText(
    /¿Borrar «Barrer» de Hoy, \d\d:\d\d\?/,
  );
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Cancelar" })
    .click();

  await abrir(page, "Regar");
  await elegirEmoji(page, "🌿");
  await guardar(page);
  await entrada(page, "🌿 Regar")
    .getByRole("button", { name: "Borrar", exact: true })
    .click();
  await expect(page.getByRole("alertdialog")).toHaveText(
    /¿Borrar «🌿 Regar» de Hoy, \d\d:\d\d\?/,
  );
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Cancelar" })
    .click();
});

async function abrirEn(page: Page, emoji: string, nota: string) {
  await abrir(page, "Regar");
  await verPanel(page, emoji, nota);
  await cerrar(page);
}

// Con el service worker activo en B, el selector (carga diferida) está en su caché cuando B pierde la conexión.
test.describe("dos dispositivos", () => {
  test.use({ serviceWorkers: "allow" });

  test("Flujo 8: dos dispositivos, emoji y nota", async ({ browser }) => {
    const { a, b, ctxB, cerrar: fin } = await dosDispositivos(browser);
    await crear(a, { titulo: "Regar", tipo: "No se repite" });
    await esperarEstado(b, "Regar", "pendiente");
    // B ya tiene el service worker activo: el selector (carga diferida) está en su caché antes de cortar la red.
    await controlada(b);

    await ctxB.setOffline(true);
    await editar(b, "Regar", { emoji: "🌱" });
    await editar(a, "Regar", { nota: "Usar guantes" });
    await llegaAlServidor(a);
    await ctxB.setOffline(false);
    for (const p of [a, b]) {
      await expect(
        p.getByRole("button", { name: "🌱 Regar", exact: true }),
      ).toBeVisible();
      await abrirEn(p, "🌱", "Usar guantes");
    }

    await ctxB.setOffline(true);
    await editar(b, "Regar", { emoji: "🔥", nota: "Ventilar" });
    await editar(a, "Regar", { emoji: "🌿" });
    await llegaAlServidor(a);
    await ctxB.setOffline(false);
    for (const p of [a, b]) {
      await expect(
        p.getByRole("button", { name: "🔥 Regar", exact: true }),
      ).toBeVisible();
      await abrirEn(p, "🔥", "Ventilar");
    }

    await ctxB.setOffline(true);
    await abrir(b, "Regar");
    await botonQuitar(b).click();
    await guardar(b);
    await editar(a, "Regar", { nota: "Barrer abajo" });
    await llegaAlServidor(a);
    await ctxB.setOffline(false);
    for (const p of [a, b]) {
      await expect(
        p.getByRole("button", { name: "Regar", exact: true }),
      ).toBeVisible();
      await abrirEn(p, "", "Barrer abajo");
    }
    await fin();
  });
});
