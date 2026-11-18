import { expect, test, type Browser, type Page } from "@playwright/test";
import {
  openTask,
  openSelector,
  searchBoxEmoji,
  close,
  controlled,
  complete,
  withClock,
  create,
  createAndView,
  stop,
  device,
  twoDevices,
  edit,
  chooseEmoji,
  emojiExact,
  selectorEmojis,
  waitStatus,
  row,
  goA,
  cleanEmulators,
  arrivesOnServer,
  selectorEmoji,
  sessionWithClock,
} from "./support";

const MONDAY = "2026-07-13T08:00:00";
const WITHOUT_RESULTS = "No se encontró ningún emoji.";

test.beforeEach(async () => {
  await cleanEmulators();
});

/** El nombre visible de la tarea en su fila (botón que abre el panel). */
const name = (page: Page, text: string) =>
  row(page, "Regar").getByRole("button", { name: text, exact: true });

async function save(page: Page) {
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

/** El botón de la fila de Regar, con o sin el emoji que el último guardado haya llegado a poner en el nombre. */
const openWater = (page: Page) =>
  row(page, "Regar").getByRole("button", { name: /Regar$/ });

const buttonChoose = (page: Page) =>
  page.getByRole("button", { name: "Elegir emoji" });
const buttonRemove = (page: Page) =>
  page.getByRole("button", { name: "Quitar emoji" });
const buttonChange = (page: Page, emoji: string) =>
  page.getByRole("button", { name: `Cambiar emoji ${emoji}` });

async function viewPanel(page: Page, emoji: string, note: string) {
  if (emoji === "") {
    await expect(buttonChoose(page)).toBeVisible();
    await expect(buttonRemove(page)).toHaveCount(0);
  } else {
    await expect(buttonChange(page, emoji)).toBeVisible();
    await expect(buttonRemove(page)).toBeVisible();
    await expect(buttonChoose(page)).toHaveCount(0);
  }
  await expect(page.getByLabel("Nota")).toHaveValue(note);
}

/** Los recientes que muestra el selector, en orden; abre el selector y lo cierra con Cerrar. */
async function recent(page: Page): Promise<string[]> {
  await openSelector(page);
  const buttons = selectorEmoji(page)
    .locator('section[aria-labelledby="title-recents"]')
    .getByRole("button");
  const list =
    (await buttons.count()) === 0
      ? []
      : await buttons.evaluateAll((l) =>
          l.map((b) => b.getAttribute("aria-label") ?? ""),
        );
  await selectorEmoji(page).getByRole("button", { name: "Cerrar" }).click();
  await expect(selectorEmoji(page)).toHaveCount(0);
  return list;
}

const sectionRecent = (page: Page) =>
  selectorEmoji(page).getByRole("heading", { name: "Recientes" });

test("Flujo 1: elegir el emoji y verlo en la fila", async ({ page }) => {
  await sessionWithClock(page, MONDAY);
  await create(page, {
    title: "Regar",
    kind: "Intervalo",
    every: "2",
    unit: "días",
  });
  await expect(name(page, "Regar")).toBeVisible();

  await openTask(page, "Regar");
  await expect(page.getByRole("textbox", { name: "Emoji" })).toHaveCount(0);
  await viewPanel(page, "", "");
  await openSelector(page);
  await searchBoxEmoji(page).fill("planta");
  await expect(emojiExact(page, "🌱")).toHaveCount(1);
  await emojiExact(page, "🌱").click();
  await expect(selectorEmoji(page)).toHaveCount(0);
  await viewPanel(page, "🌱", "");
  await save(page);
  await expect(name(page, "🌱 Regar")).toBeVisible();

  await page.reload();
  await expect(name(page, "🌱 Regar")).toBeVisible();
  await openTask(page, "Regar");
  await viewPanel(page, "🌱", "");
  await close(page);

  const variants: [string, string, number?][] = [
    ["👨‍👩‍👧", "familia"],
    ["👍🏽", "pulgar", 3],
    ["❤️", "corazón rojo"],
    ["🇦🇷", "argentina"],
  ];
  for (const [e, search, tone] of variants) {
    await openTask(page, "Regar");
    await buttonRemove(page).waitFor();
    await chooseEmoji(page, e, search, tone);
    await viewPanel(page, e, "");
    await save(page);
    await expect(name(page, `${e} Regar`)).toBeVisible();
  }

  await create(page, {
    title: "Barrer",
    kind: "Intervalo",
    every: "1",
    unit: "días",
    emoji: "🧹",
    note: "Debajo de la mesa",
  });
  await expect(
    row(page, "Barrer").getByRole("button", {
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
  await openSelector(page);
  // Opening the selector focuses the dialog, not the search field: the on-screen keyboard stays down.
  await expect(selectorEmoji(page)).toBeFocused();
  await expect(searchBoxEmoji(page)).not.toBeFocused();
  await selectorEmoji(page).getByRole("button", { name: "Cerrar" }).click();
  await expect(selectorEmoji(page)).toHaveCount(0);
  await viewPanel(page, "", "");
  await openSelector(page);
  await page.keyboard.press("Escape");
  await expect(selectorEmoji(page)).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Nueva tarea" }),
  ).toBeVisible();
  await viewPanel(page, "", "");
});

test("Flujo 2: quitar el emoji", async ({ page }) => {
  await sessionWithClock(page, MONDAY);
  await create(page, {
    title: "Regar",
    kind: "Intervalo",
    every: "2",
    unit: "días",
    emoji: "🌱",
  });
  await expect(name(page, "🌱 Regar")).toBeVisible();

  await openTask(page, "Regar");
  await buttonRemove(page).click();
  await viewPanel(page, "", "");
  await save(page);
  await expect(name(page, "Regar")).toBeVisible();

  await openTask(page, "Regar");
  await viewPanel(page, "", "");
  await close(page);
  await page.reload();
  await expect(name(page, "Regar")).toBeVisible();

  await openTask(page, "Regar");
  await chooseEmoji(page, "🔥");
  await buttonRemove(page).click();
  await close(page);
  await expect(name(page, "Regar")).toBeVisible();
});

test("Flujo 3: catálogo, categorías y búsqueda en español", async ({
  page,
}) => {
  await sessionWithClock(page, MONDAY);
  await create(page, {
    title: "Regar",
    kind: "Intervalo",
    every: "2",
    unit: "días",
  });
  await openTask(page, "Regar");
  await openSelector(page);

  const categories = selectorEmoji(page).getByRole("tab");
  await expect(categories).toHaveCount(9);
  const names = await categories.evaluateAll((l) =>
    l.map((t) => t.getAttribute("aria-label") ?? ""),
  );
  for (const expected of [
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
    expect(names.some((n) => expected.test(n))).toBe(true);

  const own: Record<string, string> = {
    "Animales y naturaleza": "🐶",
    Banderas: "🇦🇷",
  };
  for (const n of names) {
    const tab = selectorEmoji(page).getByRole("tab", { name: n, exact: true });
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    await expect(selectorEmojis(page).first()).toBeVisible();
    if (own[n])
      await expect(emojiExact(page, own[n]).first()).toBeVisible();
  }

  const search = async (text: string, emoji: string) => {
    await searchBoxEmoji(page).fill(text);
    await expect(emojiExact(page, emoji).first()).toBeVisible();
  };
  await search("planta", "🌱");
  await search("escoba", "🧹");
  await search("perro", "🐶");
  await search("PERRO", "🐶");
  await search("perró", "🐶");

  await searchBoxEmoji(page).fill("zzzzqq");
  await expect(selectorEmojis(page)).toHaveCount(0);
  await expect(selectorEmoji(page).getByText(WITHOUT_RESULTS)).toBeVisible();
  await searchBoxEmoji(page).fill("");
  await expect(selectorEmoji(page).getByText(WITHOUT_RESULTS)).toHaveCount(0);
  await expect(selectorEmojis(page).first()).toBeVisible();
  expect(await selectorEmojis(page).count()).toBeGreaterThan(20);

  await search("escoba", "🧹");
  await emojiExact(page, "🧹").first().click();
  await expect(selectorEmoji(page)).toHaveCount(0);
  await viewPanel(page, "🧹", "");
});

test("Flujo 4: recientes", async ({ browser }) => {
  const { a, b, close: end } = await twoDevices(browser, MONDAY);
  await create(a, {
    title: "Regar",
    kind: "Intervalo",
    every: "2",
    unit: "días",
  });
  await expect(name(a, "Regar")).toBeVisible();

  await openTask(a, "Regar");
  await openSelector(a);
  await expect(sectionRecent(a)).toHaveCount(0);
  await selectorEmoji(a).getByRole("button", { name: "Cerrar" }).click();
  await chooseEmoji(a, "🌱");
  await save(a);

  await openTask(a, "Regar");
  expect(await recent(a)).toEqual(["🌱"]);
  await chooseEmoji(a, "🔥");
  await save(a);

  await openTask(a, "Regar");
  expect(await recent(a)).toEqual(["🔥", "🌱"]);
  await chooseEmoji(a, "🌱");
  await save(a);

  await openTask(a, "Regar");
  expect(await recent(a)).toEqual(["🌱", "🔥"]);
  await buttonRemove(a).click();
  await save(a);
  await openTask(a, "Regar");
  expect(await recent(a)).toEqual(["🌱", "🔥"]);

  // 16 emojis distintos más: los primeros 16 de la grilla (ninguno es 🔥 ni 🌱).
  const chosen: string[] = [];
  for (let i = 0; i < 16; i++) {
    await openSelector(a);
    const e = selectorEmojis(a).nth(i);
    chosen.push((await e.textContent()) ?? "");
    await e.click();
    await expect(selectorEmoji(a)).toHaveCount(0);
  }
  expect(new Set(chosen).size).toBe(16);
  const expected = [...chosen].reverse();
  expect(await recent(a)).toEqual(expected);
  await save(a);

  await a.reload();
  await expect(openWater(a)).toBeVisible();
  await openWater(a).click();
  await expect(a.getByRole("heading", { name: "Editar tarea" })).toBeVisible();
  expect(await recent(a)).toEqual(expected);
  await close(a);

  await a.getByRole("button", { name: "+" }).click();
  await expect(a.getByRole("heading", { name: "Nueva tarea" })).toBeVisible();
  expect(await recent(a)).toEqual(expected);
  await close(a);

  // B (otro dispositivo, misma cuenta) no recibe los recientes de A.
  await expect(openWater(b)).toBeVisible();
  await openWater(b).click();
  await expect(b.getByRole("heading", { name: "Editar tarea" })).toBeVisible();
  await openSelector(b);
  await expect(sectionRecent(b)).toHaveCount(0);
  await expect(
    selectorEmoji(b).locator('section[aria-labelledby="title-recents"]'),
  ).toHaveCount(0);
  await end();
});

test.describe("sin conexión", () => {
  test.use({ serviceWorkers: "allow" });
  const HOUR = "2026-07-15T08:00:00";

  async function sessionPwa(browser: Browser) {
    const d = await device(browser, HOUR, true);
    await controlled(d.page);
    await expect(
      d.page.getByRole("heading", { name: "Pendientes", level: 1 }),
    ).toBeVisible();
    return d;
  }

  test("Flujo 5: el selector sin conexión", async ({ browser }) => {
    const { ctx, page } = await sessionPwa(browser);
    const external: string[] = [];
    ctx.on("request", (r) => {
      const u = new URL(r.url());
      // cleardot.gif es el sondeo de red de Firestore (WebChannel), no del selector.
      const isFirestore =
        u.hostname === "www.google.com" &&
        u.pathname === "/images/cleardot.gif";
      if (
        !["127.0.0.1", "localhost"].includes(u.hostname) &&
        u.protocol.startsWith("http") &&
        !isFirestore
      )
        external.push(r.url());
    });
    await create(page, { title: "Regar", kind: "No se repite" });
    await expect(name(page, "Regar")).toBeVisible();

    // Con conexión: abrir el selector una vez y cerrarlo.
    await openTask(page, "Regar");
    await openSelector(page);
    await selectorEmoji(page).getByRole("button", { name: "Cerrar" }).click();
    await close(page);
    await arrivesOnServer(page);

    await ctx.setOffline(true);
    await page.reload();
    await expect(name(page, "Regar")).toBeVisible();
    await openTask(page, "Regar");
    await openSelector(page);
    await expect(selectorEmoji(page).getByRole("tab")).toHaveCount(9);
    expect(await selectorEmojis(page).count()).toBeGreaterThan(20);
    await expect(selectorEmoji(page).getByText("Cargando…")).toHaveCount(0);

    await searchBoxEmoji(page).fill("planta");
    await expect(emojiExact(page, "🌱").first()).toBeVisible();
    await emojiExact(page, "🌱").first().click();
    await expect(selectorEmoji(page)).toHaveCount(0);
    await save(page);
    await expect(name(page, "🌱 Regar")).toBeVisible();

    expect(external).toEqual([]);
    await ctx.setOffline(false);
    await expect(name(page, "🌱 Regar")).toBeVisible();
    expect(external).toEqual([]);
    await ctx.close();
  });
});

test("Flujo 6: la nota, solo en el panel", async ({ page }) => {
  await sessionWithClock(page, MONDAY);
  await create(page, {
    title: "Regar",
    kind: "Intervalo",
    every: "2",
    unit: "días",
  });

  await edit(page, "Regar", { note: "  Usar guantes  " });
  await expect(page.getByText("Usar guantes")).toHaveCount(0);
  await openTask(page, "Regar");
  await expect(page.getByLabel("Nota")).toHaveValue("Usar guantes");
  await close(page);

  await edit(page, "Regar", { note: "Usar guantes\nVentilar" });
  await openTask(page, "Regar");
  await expect(page.getByLabel("Nota")).toHaveValue("Usar guantes\nVentilar");
  await close(page);

  const long = "x".repeat(5000);
  await edit(page, "Regar", { note: long });
  await openTask(page, "Regar");
  expect(await page.getByLabel("Nota").inputValue()).toBe(long);
  await close(page);

  await edit(page, "Regar", { note: "   \n  " });
  await openTask(page, "Regar");
  await expect(page.getByLabel("Nota")).toHaveValue("");
  await close(page);

  await page.reload();
  await expect(name(page, "Regar")).toBeVisible();
  await openTask(page, "Regar");
  await expect(page.getByLabel("Nota")).toHaveValue("");
  await close(page);
  await expect(row(page, "Regar")).not.toContainText("guantes");
});

// --- Flujo 7: reloj detenido para el aviso ---
const notice = (page: Page) => page.getByRole("status");

const entry = (page: Page, text: string) =>
  page
    .getByRole("listitem")
    .filter({ hasText: new RegExp(`^${text}\\s*\\d\\d:\\d\\d`) });

test("Flujo 7: el emoji en Historial y en el aviso de deshacer", async ({
  page,
}) => {
  await sessionWithClock(page, "2026-07-13T07:50:00");
  await createAndView(page, {
    title: "Regar",
    kind: "Intervalo",
    every: "4",
    unit: "horas",
    emoji: "🌱",
  });
  await createAndView(page, {
    title: "Barrer",
    kind: "Intervalo",
    every: "4",
    unit: "horas",
  });
  await stop(page, MONDAY);

  await complete(page, "🌱 Regar");
  await withClock(page, () =>
    expect(notice(page)).toContainText("Completaste «🌱 Regar»"),
  );
  await expect(
    notice(page).getByRole("button", { name: "Deshacer" }),
  ).toBeVisible();
  await page.clock.runFor(5100);
  await expect(notice(page)).toHaveCount(0);

  await complete(page, "Barrer");
  await withClock(page, () =>
    expect(notice(page)).toHaveText(/^Completaste «Barrer»/),
  );
  await page.clock.runFor(5100);
  await expect(notice(page)).toHaveCount(0);

  await goA(page, "Historial");
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(["Hoy"]);
  await expect(page.getByRole("listitem")).toHaveCount(2);
  await expect(entry(page, "🌱 Regar")).toHaveCount(1);
  await expect(entry(page, "Barrer")).toHaveCount(1);

  await page.clock.resume();
  await openTask(page, "🌱 Regar");
  await chooseEmoji(page, "🔥");
  await save(page);
  await expect(entry(page, "🔥 Regar")).toHaveCount(1);
  await openTask(page, "Regar");
  await buttonRemove(page).click();
  await save(page);
  await expect(entry(page, "Regar")).toHaveCount(1);
  await expect(page.getByText("🔥")).toHaveCount(0);

  await entry(page, "Barrer")
    .getByRole("button", { name: "Borrar", exact: true })
    .click();
  await expect(page.getByRole("alertdialog")).toHaveText(
    /¿Borrar «Barrer» de Hoy, \d\d:\d\d\?/,
  );
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Cancelar" })
    .click();

  await openTask(page, "Regar");
  await chooseEmoji(page, "🌿");
  await save(page);
  await entry(page, "🌿 Regar")
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

async function openIn(page: Page, emoji: string, note: string) {
  await openTask(page, "Regar");
  await viewPanel(page, emoji, note);
  await close(page);
}

// Con el service worker activo en B, el selector (carga diferida) está en su caché cuando B pierde la conexión.
test.describe("dos dispositivos", () => {
  test.use({ serviceWorkers: "allow" });

  test("Flujo 8: dos dispositivos, emoji y nota", async ({ browser }) => {
    const { a, b, ctxB, close: end } = await twoDevices(browser);
    await create(a, { title: "Regar", kind: "No se repite" });
    await waitStatus(b, "Regar", "pendiente");
    // B ya tiene el service worker activo: el selector (carga diferida) está en su caché antes de cortar la red.
    await controlled(b);

    await ctxB.setOffline(true);
    await edit(b, "Regar", { emoji: "🌱" });
    await edit(a, "Regar", { note: "Usar guantes" });
    await arrivesOnServer(a);
    await ctxB.setOffline(false);
    for (const p of [a, b]) {
      await expect(
        p.getByRole("button", { name: "🌱 Regar", exact: true }),
      ).toBeVisible();
      await openIn(p, "🌱", "Usar guantes");
    }

    await ctxB.setOffline(true);
    await edit(b, "Regar", { emoji: "🔥", note: "Ventilar" });
    await edit(a, "Regar", { emoji: "🌿" });
    await arrivesOnServer(a);
    await ctxB.setOffline(false);
    for (const p of [a, b]) {
      await expect(
        p.getByRole("button", { name: "🔥 Regar", exact: true }),
      ).toBeVisible();
      await openIn(p, "🔥", "Ventilar");
    }

    await ctxB.setOffline(true);
    await openTask(b, "Regar");
    await buttonRemove(b).click();
    await save(b);
    await edit(a, "Regar", { note: "Barrer abajo" });
    await arrivesOnServer(a);
    await ctxB.setOffline(false);
    for (const p of [a, b]) {
      await expect(
        p.getByRole("button", { name: "Regar", exact: true }),
      ).toBeVisible();
      await openIn(p, "", "Barrer abajo");
    }
    await end();
  });
});
