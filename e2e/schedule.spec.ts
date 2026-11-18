import { expect, test, type Page } from "@playwright/test";
import {
  openTask,
  addSchedule,
  fieldFrom,
  fieldTo,
  removeSchedule,
  advance,
  settle,
  close,
	discard,
  complete,
  withClock,
  toggleShowCompleted,
  create,
  createAndView,
  stop,
  twoDevices,
  edit,
  turnOnCompleted,
  waitStatus,
  row,
  goA,
  cleanEmulators,
  listIs,
  arrivesOnServer,
  sessionWithClock,
  onlyInSchedule,
  rowTitle,
} from "./support";

test.beforeEach(async () => {
  await cleanEmulators();
});

const TIME_WINDOW = { from: "08:00", to: "11:00" };
const scheduleOf = (page: Page, title: string) =>
  row(page, title).getByText(/\d\d:\d\d–\d\d:\d\d/);
const notice = (page: Page) => page.getByRole("status");

async function viewSchedule(page: Page, title: string, text: string) {
  await expect(scheduleOf(page, title)).toHaveText(text);
}

async function withoutSchedule(page: Page, title: string) {
  await expect(row(page, title)).toBeVisible();
  await expect(scheduleOf(page, title)).toHaveCount(0);
}

async function viewNotice(page: Page, title: string) {
  await expect(notice(page)).toHaveCount(1);
  await expect(notice(page)).toContainText(`Completaste «${title}»`);
  await expect(
    notice(page).getByRole("button", { name: "Deshacer" }),
  ).toBeVisible();
}

/** Advances the simulated clock to `hora`, firing the intermediate timers (clock stopped). */
async function go(page: Page, hour: string) {
  const missing =
    new Date(hour).getTime() - (await page.evaluate(() => Date.now()));
  if (missing <= 10_000) await page.clock.runFor(missing);
  else await advance(page, hour);
}

/** Session that ends with the clock running 10 minutes before `hora`. */
const sessionBefore = (page: Page, hour: string) =>
  sessionWithClock(
    page,
    new Date(new Date(hour).getTime() - 600_000).toISOString(),
  );

/** Tapping a disabled checkbox changes nothing: there is no notice. */
async function tapDisabled(page: Page, title: string) {
  await row(page, title).getByRole("checkbox").click({ force: true });
  await expect(notice(page)).toHaveCount(0);
}

const size = (l: ReturnType<typeof scheduleOf>) =>
  l.evaluate((e) => parseFloat(getComputedStyle(e).fontSize));

async function errorInPanel(page: Page, text: string) {
  await expect(page.getByText(text)).toBeVisible();
  await expect(page.getByRole("dialog")).toBeVisible();
}

test("Flujo 1: crear, cambiar y quitar el horario", async ({ page }) => {
  await sessionWithClock(page, "2026-07-15T06:00:00");
  await page.getByRole("button", { name: "+" }).click();
  await expect(onlyInSchedule(page)).not.toBeChecked();
  await expect(page.getByLabel("Desde", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Hasta", { exact: true })).toHaveCount(0);
  await page.getByLabel("Título").fill("Regar");
  await page.getByRole("radio", { name: "No se repite" }).check();
  await onlyInSchedule(page).check();
  await expect(page.getByLabel("Desde", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Hasta", { exact: true })).toBeVisible();
  await page.getByLabel("Desde", { exact: true }).fill("08:00");
  await page.getByLabel("Hasta", { exact: true }).fill("11:00");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await viewSchedule(page, "Regar", "08:00–11:00");
  expect(await size(scheduleOf(page, "Regar"))).toBeLessThan(
    await rowTitle(row(page, "Regar")).evaluate((e) =>
      parseFloat(getComputedStyle(e).fontSize),
    ),
  );

  await create(page, {
    title: "Ventilar",
    kind: "Intervalo",
    every: "1",
    unit: "días",
    schedule: { from: "20:00", to: "22:30" },
  });
  await viewSchedule(page, "Ventilar", "20:00–22:30");
  await create(page, {
    title: "Sacar la basura",
    kind: "Días de la semana",
    days: ["jueves"],
    schedule: { from: "09:00", to: "10:00" },
  });
  await viewSchedule(page, "Sacar la basura", "09:00–10:00");
  await create(page, { title: "Barrer", kind: "No se repite" });
  await withoutSchedule(page, "Barrer");

  await openTask(page, "Regar");
  await expect(onlyInSchedule(page)).toBeChecked();
  await expect(page.getByLabel("Desde", { exact: true })).toHaveValue("08:00");
  await expect(page.getByLabel("Hasta", { exact: true })).toHaveValue("11:00");
  await page.getByLabel("Desde", { exact: true }).fill("07:30");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await viewSchedule(page, "Regar", "07:30–11:00");

  await edit(page, "Regar", { kind: "Intervalo", every: "2", unit: "días" });
  await viewSchedule(page, "Regar", "07:30–11:00");

  await edit(page, "Regar", { schedule: null });
  await withoutSchedule(page, "Regar");

  await page.reload();
  await withoutSchedule(page, "Regar");
  await viewSchedule(page, "Ventilar", "20:00–22:30");
  await viewSchedule(page, "Sacar la basura", "09:00–10:00");
  await withoutSchedule(page, "Barrer");
});

test("Flujo 2: errores del campo Horario", async ({ page }) => {
  await sessionWithClock(page, "2026-07-15T06:00:00");
  await create(page, {
    title: "Regar",
    kind: "No se repite",
    schedule: TIME_WINDOW,
  });
  const END = "La hora de fin tiene que ser posterior a la de inicio";
  const TWO = "Completá las dos horas";
  const save = () => page.getByRole("button", { name: "Guardar" }).click();

  await page.getByRole("button", { name: "+" }).click();
  await page.getByLabel("Título").fill("Pagar la luz");
  await page.getByRole("radio", { name: "No se repite" }).check();
  await onlyInSchedule(page).check();
  await page.getByLabel("Desde", { exact: true }).fill("11:00");
  await page.getByLabel("Hasta", { exact: true }).fill("08:00");
  await save();
  await errorInPanel(page, END);

  await page.getByLabel("Hasta", { exact: true }).fill("11:00");
  await save();
  await errorInPanel(page, END);

  await page.getByLabel("Hasta", { exact: true }).fill("");
  await save();
  await errorInPanel(page, TWO);

  await page.getByLabel("Hasta", { exact: true }).fill("12:00");
  await save();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await viewSchedule(page, "Pagar la luz", "11:00–12:00");

  await openTask(page, "Regar");
  await page.getByLabel("Título").fill("Regar plantas");
  await page.getByLabel("Desde", { exact: true }).fill("11:30");
  await save();
  await errorInPanel(page, END);
  await discard(page);
  await viewSchedule(page, "Regar", "08:00–11:00");
  await expect(row(page, "Regar plantas")).toHaveCount(0);

  await openTask(page, "Regar");
  await page.getByLabel("Desde", { exact: true }).fill("");
  await save();
  await errorInPanel(page, TWO);
  await discard(page);
  await viewSchedule(page, "Regar", "08:00–11:00");
});

test("Flujo 3: puntual con horario, checkbox y Deshacer", async ({ page }) => {
  await sessionWithClock(page, "2026-07-15T06:00:00");
  await createAndView(page, {
    title: "Regar",
    kind: "No se repite",
    schedule: TIME_WINDOW,
  });
  // The bar is measured from creation (06:00): the clock is stopped right away.
  await stop(page, "2026-07-15T06:00:30");

  await withClock(page, () =>
    waitStatus(page, "Regar", "en espera", undefined, false, false),
  );
  await tapDisabled(page, "Regar");
  await withClock(page, () =>
    waitStatus(page, "Regar", "en espera", undefined, false, false),
  );

  await go(page, "2026-07-15T07:00:00");
  await withClock(page, () =>
    waitStatus(page, "Regar", "en espera", 50, false, false),
  );

  await go(page, "2026-07-15T08:00:00");
  await withClock(page, () =>
    waitStatus(page, "Regar", "pendiente", undefined, false, true),
  );

  await go(page, "2026-07-15T10:59:58");
  await complete(page, "Regar");
  await viewNotice(page, "Regar");
  await withClock(page, () => listIs(page, []));

  await go(page, "2026-07-15T11:00:02");
  await viewNotice(page, "Regar");
  await notice(page).getByRole("button", { name: "Deshacer" }).click();
  await expect(notice(page)).toHaveCount(0);
  await settle(page);
  await withClock(page, () =>
    waitStatus(page, "Regar", "en espera", 0, false, false),
  );

  await go(page, "2026-07-15T21:30:00");
  await withClock(page, () =>
    waitStatus(page, "Regar", "en espera", 50, false, false),
  );

  await go(page, "2026-07-16T08:00:00");
  await withClock(page, () =>
    waitStatus(page, "Regar", "pendiente", undefined, false, true),
  );
});

test("Flujo 4: puntual con fecha límite", async ({ page }) => {
  await sessionWithClock(page, "2026-07-15T06:00:00");
  await createAndView(page, {
    title: "Pagar la luz",
    kind: "No se repite",
    date: "2026-07-16",
    schedule: TIME_WINDOW,
  });
  await waitStatus(
    page,
    "Pagar la luz",
    "en espera",
    undefined,
    false,
    false,
  );

  await advance(page, "2026-07-16T10:59:00");
  await waitStatus(
    page,
    "Pagar la luz",
    "pendiente",
    undefined,
    false,
    true,
  );

  await advance(page, "2026-07-16T11:00:00");
  await waitStatus(
    page,
    "Pagar la luz",
    "atrasada",
    undefined,
    false,
    false,
  );

  await advance(page, "2026-07-17T08:00:00");
  await waitStatus(page, "Pagar la luz", "atrasada", undefined, false, true);
  await complete(page, "Pagar la luz");
  await viewNotice(page, "Pagar la luz");
  await listIs(page, []);

  await advance(page, "2026-07-17T12:00:00");
  await createAndView(page, {
    title: "Pagar el gas",
    kind: "No se repite",
    date: "2026-07-17",
    schedule: TIME_WINDOW,
  });
  await waitStatus(
    page,
    "Pagar el gas",
    "atrasada",
    undefined,
    false,
    false,
  );
});

test("Flujo 5: relativa con horario", async ({ page }) => {
  await sessionBefore(page, "2026-07-15T09:00:00");
  await turnOnCompleted(page);
  await createAndView(page, {
    title: "Regar",
    kind: "Intervalo",
    every: "1",
    unit: "días",
    schedule: TIME_WINDOW,
  });
  await stop(page, "2026-07-15T09:00:00");
  await withClock(page, () =>
    waitStatus(page, "Regar", "pendiente", undefined, false, true),
  );

  await complete(page, "Regar");
  await withClock(page, () =>
    waitStatus(page, "Regar", "en espera", 0, true, true),
  );

  await go(page, "2026-07-15T15:00:00");
  await withClock(page, () =>
    waitStatus(page, "Regar", "en espera", 25, true, true),
  );

  await go(page, "2026-07-16T09:00:00");
  await withClock(page, () =>
    waitStatus(page, "Regar", "pendiente", undefined, false, true),
  );
  await go(page, "2026-07-16T11:00:00");
  await withClock(page, () =>
    waitStatus(page, "Regar", "atrasada", undefined, false, false),
  );
  await go(page, "2026-07-16T20:00:00");
  await withClock(page, () =>
    waitStatus(page, "Regar", "atrasada", undefined, false, false),
  );

  await go(page, "2026-07-17T08:00:00");
  await withClock(page, () =>
    waitStatus(page, "Regar", "atrasada", undefined, false, true),
  );
  await complete(page, "Regar");
  await viewNotice(page, "Regar");
  await withClock(page, () =>
    waitStatus(page, "Regar", "en espera", undefined, true, true),
  );

  await go(page, "2026-07-17T20:00:00");
  await withClock(page, () =>
    waitStatus(page, "Regar", "en espera", 50, true, true),
  );
});

test("Flujo 6: atraso antes de que abra la ventana", async ({ page }) => {
  await sessionBefore(page, "2026-07-15T10:00:00");
  await createAndView(page, {
    title: "Remedio",
    kind: "Intervalo",
    every: "4",
    unit: "horas",
    schedule: TIME_WINDOW,
  });
  await stop(page, "2026-07-15T10:00:00");
  await complete(page, "Remedio");
  await withClock(page, () => listIs(page, []));
  await toggleShowCompleted(page, true);

  await go(page, "2026-07-15T15:30:00");
  await withClock(page, () =>
    waitStatus(page, "Remedio", "en espera", 25, true, true),
  );

  await go(page, "2026-07-15T18:00:00");
  await withClock(page, () =>
    waitStatus(page, "Remedio", "atrasada", undefined, false, false),
  );

  await go(page, "2026-07-16T08:00:00");
  await withClock(page, () =>
    waitStatus(page, "Remedio", "atrasada", undefined, false, true),
  );
});

test("Flujo 7: calendario y Mostrar completadas", async ({ page }) => {
  await sessionBefore(page, "2026-07-14T07:00:00");
  await createAndView(page, {
    title: "Sacar la basura",
    kind: "Días de la semana",
    days: ["martes", "jueves"],
    schedule: TIME_WINDOW,
  });
  await stop(page, "2026-07-14T07:00:00");
  await withClock(page, () =>
    waitStatus(
      page,
      "Sacar la basura",
      "en espera",
      undefined,
      false,
      false,
    ),
  );

  await go(page, "2026-07-14T08:00:00");
  await withClock(page, () =>
    waitStatus(page, "Sacar la basura", "pendiente", undefined, false, true),
  );
  await complete(page, "Sacar la basura");
  await withClock(page, () => listIs(page, []));

  await go(page, "2026-07-16T07:59:00");
  await withClock(page, () => listIs(page, []));

  await toggleShowCompleted(page, true);
  await withClock(page, () =>
    waitStatus(page, "Sacar la basura", "en espera", undefined, true, false),
  );
  await toggleShowCompleted(page, false);

  await go(page, "2026-07-16T08:00:00");
  await withClock(page, () =>
    waitStatus(page, "Sacar la basura", "pendiente", undefined, false, true),
  );

  await go(page, "2026-07-16T11:00:00");
  await withClock(page, () =>
    waitStatus(page, "Sacar la basura", "atrasada", undefined, false, false),
  );

  await go(page, "2026-07-17T09:00:00");
  await withClock(page, () =>
    waitStatus(page, "Sacar la basura", "atrasada", undefined, false, true),
  );
  await complete(page, "Sacar la basura");
  await withClock(page, () => listIs(page, []));
  await goA(page, "Historial");
  const entry = page
    .getByRole("listitem")
    .filter({ hasText: /^Sacar la basura\s*09:00/ });
  await withClock(page, () => expect(entry).toHaveCount(1));

  await go(page, "2026-07-17T20:00:00");
  await entry.getByRole("button", { name: "Borrar", exact: true }).click();
  const dialog = page.getByRole("alertdialog");
  await dialog.getByRole("button", { name: "Borrar", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await withClock(page, () => expect(entry).toHaveCount(0));
  await goA(page, "Pendientes");
  await withClock(page, () =>
    waitStatus(page, "Sacar la basura", "atrasada", undefined, false, false),
  );
});

test("Flujo 8: orden con horario", async ({ page }) => {
  await sessionWithClock(page, "2026-07-15T08:00:00");
  await createAndView(page, {
    title: "Cambiar sábanas",
    kind: "Días de la semana",
    days: ["jueves"],
  });
  await advance(page, "2026-07-15T08:01:00");
  await createAndView(page, {
    title: "Sacar la basura",
    kind: "Días de la semana",
    days: ["jueves"],
    schedule: { from: "09:00", to: "10:00" },
  });
  await advance(page, "2026-07-15T12:00:00");
  await createAndView(page, {
    title: "Cambiar foco",
    kind: "No se repite",
    schedule: TIME_WINDOW,
  });

  await advance(page, "2026-07-15T14:00:00");
  await waitStatus(
    page,
    "Cambiar sábanas",
    "en espera",
    undefined,
    false,
    true,
  );
  await waitStatus(
    page,
    "Cambiar foco",
    "en espera",
    undefined,
    false,
    false,
  );
  await waitStatus(
    page,
    "Sacar la basura",
    "en espera",
    undefined,
    false,
    false,
  );
  await listIs(page, ["Cambiar sábanas", "Cambiar foco", "Sacar la basura"]);

  await edit(page, "Cambiar foco", {
    schedule: { from: "10:00", to: "11:00" },
  });
  await listIs(page, ["Cambiar sábanas", "Sacar la basura", "Cambiar foco"]);

  await advance(page, "2026-07-16T09:30:00");
  await waitStatus(page, "Cambiar sábanas", "pendiente");
  await waitStatus(page, "Sacar la basura", "pendiente");
  await waitStatus(
    page,
    "Cambiar foco",
    "en espera",
    undefined,
    false,
    false,
  );
  await listIs(page, ["Cambiar sábanas", "Sacar la basura", "Cambiar foco"]);

  await createAndView(page, {
    title: "Pagar la luz",
    kind: "No se repite",
    date: "2026-07-17",
    schedule: TIME_WINDOW,
  });
  await createAndView(page, {
    title: "Barrer",
    kind: "No se repite",
    schedule: TIME_WINDOW,
  });
  await waitStatus(page, "Pagar la luz", "pendiente");
  await waitStatus(page, "Barrer", "pendiente");
  await listIs(page, [
    "Cambiar sábanas",
    "Sacar la basura",
    "Pagar la luz",
    "Barrer",
    "Cambiar foco",
  ]);

  await edit(page, "Pagar la luz", { date: "2026-07-16" });
  await listIs(page, [
    "Cambiar sábanas",
    "Pagar la luz",
    "Sacar la basura",
    "Barrer",
    "Cambiar foco",
  ]);
});

test("Flujo 9: dos dispositivos", async ({ browser }) => {
  const {
    a,
    b,
    ctxB,
    close: end,
  } = await twoDevices(browser, "2026-07-15T06:00:00");
  await create(a, { title: "Regar", kind: "No se repite", schedule: TIME_WINDOW });
  await viewSchedule(b, "Regar", "08:00–11:00");

  await ctxB.setOffline(true);
  await edit(a, "Regar", { schedule: { from: "07:00" } });
  await arrivesOnServer(a);
  await edit(b, "Regar", { schedule: { to: "12:00" } });
  await ctxB.setOffline(false);
  await arrivesOnServer(b);
  await viewSchedule(a, "Regar", "08:00–12:00");
  await viewSchedule(b, "Regar", "08:00–12:00");

  await ctxB.setOffline(true);
  await edit(a, "Regar", { schedule: null });
  await arrivesOnServer(a);
  await edit(b, "Regar", { title: "Regar plantas" });
  await ctxB.setOffline(false);
  await arrivesOnServer(b);
  for (const p of [a, b]) {
    await expect(row(p, "Regar plantas")).toBeVisible();
    await withoutSchedule(p, "Regar plantas");
  }
  await end();
});

test("Flujo 10: sin horario, todo sigue igual", async ({ page }) => {
  await sessionWithClock(page, "2026-07-15T02:50:00");
  await createAndView(page, { title: "Barrer", kind: "No se repite" });
  await advance(page, "2026-07-15T03:00:00");
  await waitStatus(page, "Barrer", "pendiente", undefined, false, true);
  await withoutSchedule(page, "Barrer");

  await createAndView(page, {
    title: "Regar",
    kind: "Intervalo",
    every: "1",
    unit: "días",
  });
  await complete(page, "Regar");
  await expect(row(page, "Regar")).toHaveCount(0);
  await advance(page, "2026-07-16T03:00:00");
  await waitStatus(page, "Regar", "pendiente", undefined, false, true);
  await withoutSchedule(page, "Regar");
});

const TWO_TIME_WINDOWS = [
  { from: "07:00", to: "10:00" },
  { from: "18:00", to: "21:00" },
];
const TWO_TEXT = "07:00–10:00 · 18:00–21:00";
const OVERLAPPING = "Los horarios no se pueden superponer";
const ONLY_DAYS = "Con varios horarios, el intervalo tiene que ser en días";
const savePanel = (page: Page) =>
  page.getByRole("button", { name: "Guardar" }).click();

/** Checks status and checkbox with the clock stopped at `hora`. */
async function inHour(
  page: Page,
  hour: string,
  title: string,
  status: "pendiente" | "en espera" | "atrasada",
  bar: number | undefined,
  completed: boolean,
  enabled: boolean,
) {
  await go(page, hour);
  await withClock(page, () =>
    waitStatus(page, title, status, bar, completed, enabled),
  );
}

test("Flujo 11: Agregar horario y Quitar", async ({ page }) => {
  await sessionWithClock(page, "2026-07-15T06:00:00");
  const T = "Alimentar a los perros";
  await page.getByRole("button", { name: "+" }).click();
  await page.getByLabel("Título").fill(T);
  await page.getByRole("radio", { name: "No se repite" }).check();
  await onlyInSchedule(page).check();
  await expect(page.getByLabel("Desde", { exact: true })).toHaveCount(1);
  await expect(page.getByLabel("Hasta", { exact: true })).toHaveCount(1);
  await expect(removeSchedule(page)).toHaveCount(0);
  await expect(addSchedule(page)).toBeVisible();

  await fieldFrom(page, 0).fill("18:00");
  await fieldTo(page, 0).fill("21:00");
  await addSchedule(page).click();
  await expect(page.getByLabel("Desde", { exact: true })).toHaveCount(2);
  await expect(removeSchedule(page)).toHaveCount(2);
  await expect(fieldFrom(page, 1)).toHaveValue("");
  await expect(fieldTo(page, 1)).toHaveValue("");
  await fieldFrom(page, 1).fill("07:00");
  await fieldTo(page, 1).fill("10:00");
  await savePanel(page);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await viewSchedule(page, T, TWO_TEXT);

  await openTask(page, T);
  await expect(onlyInSchedule(page)).toBeChecked();
  await expect(fieldFrom(page, 0)).toHaveValue("07:00");
  await expect(fieldTo(page, 0)).toHaveValue("10:00");
  await expect(fieldFrom(page, 1)).toHaveValue("18:00");
  await expect(fieldTo(page, 1)).toHaveValue("21:00");
  await removeSchedule(page).first().click();
  await expect(page.getByLabel("Desde", { exact: true })).toHaveCount(1);
  await savePanel(page);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await viewSchedule(page, T, "18:00–21:00");

  await openTask(page, T);
  await expect(page.getByLabel("Desde", { exact: true })).toHaveCount(1);
  await expect(removeSchedule(page)).toHaveCount(0);
  await addSchedule(page).click();
  await fieldFrom(page, 1).fill("10:00");
  await fieldTo(page, 1).fill("12:00");
  await fieldFrom(page, 0).fill("08:00");
  await fieldTo(page, 0).fill("10:00");
  await savePanel(page);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await viewSchedule(page, T, "08:00–10:00 · 10:00–12:00");

  await edit(page, T, { schedule: null });
  await withoutSchedule(page, T);

  await create(page, {
    title: "Remedio",
    kind: "Intervalo",
    every: "8",
    unit: "horas",
    schedules: [{ from: "08:00", to: "20:00" }],
  });
  await viewSchedule(page, "Remedio", "08:00–20:00");

  await page.reload();
  await expect(row(page, "Remedio")).toBeVisible();
  await withoutSchedule(page, T);
  await viewSchedule(page, "Remedio", "08:00–20:00");
});

test("Flujo 12: errores de varios horarios", async ({ page }) => {
  await sessionWithClock(page, "2026-07-15T06:00:00");
  await create(page, {
    title: "Regar",
    kind: "No se repite",
    schedule: TIME_WINDOW,
  });
  await create(page, {
    title: "Remedio",
    kind: "Intervalo",
    every: "8",
    unit: "horas",
    schedule: TIME_WINDOW,
  });
  const END = "La hora de fin tiene que ser posterior a la de inicio";
  const TWO = "Completá las dos horas";

  await page.getByRole("button", { name: "+" }).click();
  await page.getByLabel("Título").fill("Perros");
  await page.getByRole("radio", { name: "No se repite" }).check();
  await onlyInSchedule(page).check();
  await fieldFrom(page, 0).fill("08:00");
  await fieldTo(page, 0).fill("11:00");
  await addSchedule(page).click();
  await fieldFrom(page, 1).fill("10:00");
  await fieldTo(page, 1).fill("12:00");
  await savePanel(page);
  await errorInPanel(page, OVERLAPPING);

  await fieldFrom(page, 1).fill("08:00");
  await fieldTo(page, 1).fill("11:00");
  await savePanel(page);
  await errorInPanel(page, OVERLAPPING);

  await fieldFrom(page, 1).fill("09:00");
  await fieldTo(page, 1).fill("10:00");
  await savePanel(page);
  await errorInPanel(page, OVERLAPPING);

  await fieldTo(page, 1).fill("");
  await savePanel(page);
  await errorInPanel(page, TWO);

  await fieldTo(page, 1).fill("08:00");
  await savePanel(page);
  await errorInPanel(page, END);

  await fieldFrom(page, 1).fill("18:00");
  await fieldTo(page, 1).fill("21:00");
  await page.getByRole("radio", { name: "Intervalo" }).check();
  await page.getByRole("spinbutton", { name: "Cada" }).fill("8");
  await page.getByLabel("Unidad").selectOption({ label: "horas" });
  await savePanel(page);
  await errorInPanel(page, ONLY_DAYS);

  await page.getByLabel("Unidad").selectOption({ label: "días" });
  await page.getByRole("spinbutton", { name: "Cada" }).fill("1");
  await savePanel(page);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await viewSchedule(page, "Perros", "08:00–11:00 · 18:00–21:00");

  await openTask(page, "Regar");
  await page.getByLabel("Título").fill("Regar plantas");
  await addSchedule(page).click();
  await fieldFrom(page, 1).fill("10:59");
  await fieldTo(page, 1).fill("12:00");
  await savePanel(page);
  await errorInPanel(page, OVERLAPPING);
  await discard(page);
  await viewSchedule(page, "Regar", "08:00–11:00");
  await expect(row(page, "Regar plantas")).toHaveCount(0);

  await openTask(page, "Remedio");
  await addSchedule(page).click();
  await fieldFrom(page, 1).fill("18:00");
  await fieldTo(page, 1).fill("21:00");
  await savePanel(page);
  await errorInPanel(page, ONLY_DAYS);
  await discard(page);
  await viewSchedule(page, "Remedio", "08:00–11:00");

  await openTask(page, "Perros");
  await page.getByRole("radio", { name: "Intervalo" }).check();
  await page.getByLabel("Unidad").selectOption({ label: "horas" });
  await savePanel(page);
  await errorInPanel(page, ONLY_DAYS);
  await discard(page);
  await viewSchedule(page, "Perros", "08:00–11:00 · 18:00–21:00");
  await openTask(page, "Perros");
  await expect(page.getByRole("spinbutton", { name: "Cada" })).toHaveValue("1");
  await expect(page.getByLabel("Unidad")).toHaveValue(/d/);
  await close(page);
});

test("Flujo 13: calendario con dos ventanas", async ({ page }) => {
  // The bar counts from creation: it is created seconds before 06:00 so that 06:30 reads 50.
  await sessionWithClock(page, "2026-07-15T05:59:40");
  await createAndView(page, {
    title: "Perros",
    kind: "Días de la semana",
    days: ["miércoles", "jueves"],
    schedules: TWO_TIME_WINDOWS,
  });
  await viewSchedule(page, "Perros", TWO_TEXT);
  await stop(page, "2026-07-15T06:00:00");
  await withClock(page, () =>
    waitStatus(page, "Perros", "en espera", undefined, false, false),
  );

  await inHour(
    page,
    "2026-07-15T06:30:00",
    "Perros",
    "en espera",
    50,
    false,
    false,
  );
  await inHour(
    page,
    "2026-07-15T08:00:00",
    "Perros",
    "pendiente",
    undefined,
    false,
    true,
  );
  await complete(page, "Perros");
  await viewNotice(page, "Perros");
  await withClock(page, () => listIs(page, []));

  await go(page, "2026-07-15T13:00:00");
  await withClock(page, () => listIs(page, []));
  await toggleShowCompleted(page, true);
  await withClock(page, () =>
    waitStatus(page, "Perros", "en espera", 50, true, true),
  );
  await toggleShowCompleted(page, false);

  await inHour(
    page,
    "2026-07-15T18:00:00",
    "Perros",
    "pendiente",
    undefined,
    false,
    true,
  );
  await complete(page, "Perros");
  await viewNotice(page, "Perros");
  await withClock(page, () => listIs(page, []));

  await toggleShowCompleted(page, true);
  await inHour(
    page,
    "2026-07-16T05:00:00",
    "Perros",
    "en espera",
    undefined,
    true,
    false,
  );
  await toggleShowCompleted(page, false);

  await inHour(
    page,
    "2026-07-16T07:00:00",
    "Perros",
    "pendiente",
    undefined,
    false,
    true,
  );
  await inHour(
    page,
    "2026-07-16T10:00:00",
    "Perros",
    "atrasada",
    undefined,
    false,
    false,
  );
  await inHour(
    page,
    "2026-07-16T12:00:00",
    "Perros",
    "atrasada",
    undefined,
    false,
    false,
  );
  await inHour(
    page,
    "2026-07-16T18:00:00",
    "Perros",
    "atrasada",
    undefined,
    false,
    true,
  );
  await complete(page, "Perros");
  await withClock(page, () => listIs(page, []));

  await goA(page, "Historial");
  const entries = page.getByRole("listitem").filter({ hasText: /^Perros/ });
  await withClock(page, () => expect(entries).toHaveCount(3));
  await expect(entries.filter({ hasText: /08:00/ })).toHaveCount(1);
  await expect(entries.filter({ hasText: /18:00/ })).toHaveCount(2);
  await goA(page, "Pendientes");

  await go(page, "2026-07-16T22:00:00");
  await withClock(page, () => listIs(page, []));
  await toggleShowCompleted(page, true);
  await withClock(page, () =>
    waitStatus(page, "Perros", "en espera", undefined, true, true),
  );
});

test("Flujo 14: puntual con dos ventanas", async ({ page }) => {
  await sessionBefore(page, "2026-07-15T06:00:00");
  await createAndView(page, {
    title: "Comprar pan",
    kind: "No se repite",
    schedules: TWO_TIME_WINDOWS,
  });
  await createAndView(page, {
    title: "Pagar la luz",
    kind: "No se repite",
    date: "2026-07-15",
    schedules: TWO_TIME_WINDOWS,
  });
  await stop(page, "2026-07-15T06:00:00");
  for (const t of ["Comprar pan", "Pagar la luz"])
    await withClock(page, () =>
      waitStatus(page, t, "en espera", undefined, false, false),
    );

  await go(page, "2026-07-15T07:00:00");
  for (const t of ["Comprar pan", "Pagar la luz"])
    await withClock(page, () =>
      waitStatus(page, t, "pendiente", undefined, false, true),
    );

  await go(page, "2026-07-15T10:00:00");
  for (const t of ["Comprar pan", "Pagar la luz"])
    await withClock(page, () =>
      waitStatus(page, t, "en espera", undefined, false, false),
    );
  await go(page, "2026-07-15T14:00:00");
  for (const t of ["Comprar pan", "Pagar la luz"])
    await withClock(page, () =>
      waitStatus(page, t, "en espera", 50, false, false),
    );

  await go(page, "2026-07-15T18:00:00");
  for (const t of ["Comprar pan", "Pagar la luz"])
    await withClock(page, () =>
      waitStatus(page, t, "pendiente", undefined, false, true),
    );
  await complete(page, "Comprar pan");
  await viewNotice(page, "Comprar pan");
  await withClock(page, () => listIs(page, ["Pagar la luz"]));

  await go(page, "2026-07-15T21:00:00");
  await withClock(page, () =>
    waitStatus(page, "Pagar la luz", "atrasada", undefined, false, false),
  );

  await go(page, "2026-07-16T08:00:00");
  await withClock(page, () => listIs(page, ["Pagar la luz"]));
  await withClock(page, () =>
    waitStatus(page, "Pagar la luz", "atrasada", undefined, false, true),
  );
});

test("Flujo 15: relativa cada 2 días con dos ventanas", async ({ page }) => {
  await sessionBefore(page, "2026-07-13T06:00:00");
  await turnOnCompleted(page);
  await createAndView(page, {
    title: "Perros",
    kind: "Intervalo",
    every: "2",
    unit: "días",
    schedules: TWO_TIME_WINDOWS,
  });
  await stop(page, "2026-07-13T06:00:00");
  await withClock(page, () =>
    waitStatus(page, "Perros", "en espera", undefined, false, false),
  );

  await inHour(
    page,
    "2026-07-13T08:00:00",
    "Perros",
    "pendiente",
    undefined,
    false,
    true,
  );
  await complete(page, "Perros");
  await withClock(page, () =>
    waitStatus(page, "Perros", "en espera", undefined, true, true),
  );

  await inHour(
    page,
    "2026-07-13T13:00:00",
    "Perros",
    "en espera",
    50,
    true,
    true,
  );
  await inHour(
    page,
    "2026-07-13T18:00:00",
    "Perros",
    "pendiente",
    undefined,
    false,
    true,
  );
  await complete(page, "Perros");
  await withClock(page, () =>
    waitStatus(page, "Perros", "en espera", undefined, true, true),
  );

  await inHour(
    page,
    "2026-07-14T12:30:00",
    "Perros",
    "en espera",
    50,
    true,
    false,
  );
  await inHour(
    page,
    "2026-07-14T19:00:00",
    "Perros",
    "en espera",
    undefined,
    true,
    true,
  );

  await inHour(
    page,
    "2026-07-15T07:00:00",
    "Perros",
    "pendiente",
    undefined,
    false,
    true,
  );
  await inHour(
    page,
    "2026-07-15T10:00:00",
    "Perros",
    "atrasada",
    undefined,
    false,
    false,
  );

  await inHour(
    page,
    "2026-07-16T08:00:00",
    "Perros",
    "atrasada",
    undefined,
    false,
    true,
  );
  await complete(page, "Perros");
  await withClock(page, () =>
    waitStatus(page, "Perros", "en espera", undefined, true, true),
  );

  await inHour(
    page,
    "2026-07-16T13:00:00",
    "Perros",
    "en espera",
    50,
    true,
    true,
  );
  await inHour(
    page,
    "2026-07-16T18:00:00",
    "Perros",
    "pendiente",
    undefined,
    false,
    true,
  );
});
