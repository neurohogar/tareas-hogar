import { expect, test, type Page } from "@playwright/test";
import {
  abrir,
  agregarHorario,
  campoDesde,
  campoHasta,
  quitarHorario,
  adelantar,
  asentar,
  cerrar,
	descartar,
  completar,
  conReloj,
  conmutarMostrarCompletadas,
  crear,
  crearYVer,
  detener,
  dosDispositivos,
  editar,
  encenderCompletadas,
  esperarEstado,
  fila,
  irA,
  limpiarEmuladores,
  listaEs,
  llegaAlServidor,
  sesionConReloj,
  soloEnUnHorario,
  tituloDeFila,
} from "./apoyo";

test.beforeEach(async () => {
  await limpiarEmuladores();
});

const VENTANA = { desde: "08:00", hasta: "11:00" };
const horarioDe = (page: Page, titulo: string) =>
  fila(page, titulo).getByText(/\d\d:\d\d–\d\d:\d\d/);
const aviso = (page: Page) => page.getByRole("status");

async function verHorario(page: Page, titulo: string, texto: string) {
  await expect(horarioDe(page, titulo)).toHaveText(texto);
}

async function sinHorario(page: Page, titulo: string) {
  await expect(fila(page, titulo)).toBeVisible();
  await expect(horarioDe(page, titulo)).toHaveCount(0);
}

async function verAviso(page: Page, titulo: string) {
  await expect(aviso(page)).toHaveCount(1);
  await expect(aviso(page)).toContainText(`Completaste «${titulo}»`);
  await expect(
    aviso(page).getByRole("button", { name: "Deshacer" }),
  ).toBeVisible();
}

/** Avanza el reloj simulado hasta `hora`, disparando los temporizadores intermedios (reloj detenido). */
async function ir(page: Page, hora: string) {
  const falta =
    new Date(hora).getTime() - (await page.evaluate(() => Date.now()));
  if (falta <= 10_000) await page.clock.runFor(falta);
  else await adelantar(page, hora);
}

/** Sesión que termina con el reloj corriendo 10 minutos antes de `hora`. */
const sesionAntes = (page: Page, hora: string) =>
  sesionConReloj(
    page,
    new Date(new Date(hora).getTime() - 600_000).toISOString(),
  );

/** Tocar un checkbox deshabilitado no cambia nada: no hay aviso. */
async function tocarDeshabilitado(page: Page, titulo: string) {
  await fila(page, titulo).getByRole("checkbox").click({ force: true });
  await expect(aviso(page)).toHaveCount(0);
}

const tamano = (l: ReturnType<typeof horarioDe>) =>
  l.evaluate((e) => parseFloat(getComputedStyle(e).fontSize));

async function errorEnPanel(page: Page, texto: string) {
  await expect(page.getByText(texto)).toBeVisible();
  await expect(page.getByRole("dialog")).toBeVisible();
}

test("Flujo 1: crear, cambiar y quitar el horario", async ({ page }) => {
  await sesionConReloj(page, "2026-07-15T06:00:00");
  await page.getByRole("button", { name: "+" }).click();
  await expect(soloEnUnHorario(page)).not.toBeChecked();
  await expect(page.getByLabel("Desde", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Hasta", { exact: true })).toHaveCount(0);
  await page.getByLabel("Título").fill("Regar");
  await page.getByRole("radio", { name: "No se repite" }).check();
  await soloEnUnHorario(page).check();
  await expect(page.getByLabel("Desde", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Hasta", { exact: true })).toBeVisible();
  await page.getByLabel("Desde", { exact: true }).fill("08:00");
  await page.getByLabel("Hasta", { exact: true }).fill("11:00");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await verHorario(page, "Regar", "08:00–11:00");
  expect(await tamano(horarioDe(page, "Regar"))).toBeLessThan(
    await tituloDeFila(fila(page, "Regar")).evaluate((e) =>
      parseFloat(getComputedStyle(e).fontSize),
    ),
  );

  await crear(page, {
    titulo: "Ventilar",
    tipo: "Intervalo",
    cada: "1",
    unidad: "días",
    horario: { desde: "20:00", hasta: "22:30" },
  });
  await verHorario(page, "Ventilar", "20:00–22:30");
  await crear(page, {
    titulo: "Sacar la basura",
    tipo: "Días de la semana",
    dias: ["jueves"],
    horario: { desde: "09:00", hasta: "10:00" },
  });
  await verHorario(page, "Sacar la basura", "09:00–10:00");
  await crear(page, { titulo: "Barrer", tipo: "No se repite" });
  await sinHorario(page, "Barrer");

  await abrir(page, "Regar");
  await expect(soloEnUnHorario(page)).toBeChecked();
  await expect(page.getByLabel("Desde", { exact: true })).toHaveValue("08:00");
  await expect(page.getByLabel("Hasta", { exact: true })).toHaveValue("11:00");
  await page.getByLabel("Desde", { exact: true }).fill("07:30");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await verHorario(page, "Regar", "07:30–11:00");

  await editar(page, "Regar", { tipo: "Intervalo", cada: "2", unidad: "días" });
  await verHorario(page, "Regar", "07:30–11:00");

  await editar(page, "Regar", { horario: null });
  await sinHorario(page, "Regar");

  await page.reload();
  await sinHorario(page, "Regar");
  await verHorario(page, "Ventilar", "20:00–22:30");
  await verHorario(page, "Sacar la basura", "09:00–10:00");
  await sinHorario(page, "Barrer");
});

test("Flujo 2: errores del campo Horario", async ({ page }) => {
  await sesionConReloj(page, "2026-07-15T06:00:00");
  await crear(page, {
    titulo: "Regar",
    tipo: "No se repite",
    horario: VENTANA,
  });
  const FIN = "La hora de fin tiene que ser posterior a la de inicio";
  const DOS = "Completá las dos horas";
  const guardar = () => page.getByRole("button", { name: "Guardar" }).click();

  await page.getByRole("button", { name: "+" }).click();
  await page.getByLabel("Título").fill("Pagar la luz");
  await page.getByRole("radio", { name: "No se repite" }).check();
  await soloEnUnHorario(page).check();
  await page.getByLabel("Desde", { exact: true }).fill("11:00");
  await page.getByLabel("Hasta", { exact: true }).fill("08:00");
  await guardar();
  await errorEnPanel(page, FIN);

  await page.getByLabel("Hasta", { exact: true }).fill("11:00");
  await guardar();
  await errorEnPanel(page, FIN);

  await page.getByLabel("Hasta", { exact: true }).fill("");
  await guardar();
  await errorEnPanel(page, DOS);

  await page.getByLabel("Hasta", { exact: true }).fill("12:00");
  await guardar();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await verHorario(page, "Pagar la luz", "11:00–12:00");

  await abrir(page, "Regar");
  await page.getByLabel("Título").fill("Regar plantas");
  await page.getByLabel("Desde", { exact: true }).fill("11:30");
  await guardar();
  await errorEnPanel(page, FIN);
  await descartar(page);
  await verHorario(page, "Regar", "08:00–11:00");
  await expect(fila(page, "Regar plantas")).toHaveCount(0);

  await abrir(page, "Regar");
  await page.getByLabel("Desde", { exact: true }).fill("");
  await guardar();
  await errorEnPanel(page, DOS);
  await descartar(page);
  await verHorario(page, "Regar", "08:00–11:00");
});

test("Flujo 3: puntual con horario, checkbox y Deshacer", async ({ page }) => {
  await sesionConReloj(page, "2026-07-15T06:00:00");
  await crearYVer(page, {
    titulo: "Regar",
    tipo: "No se repite",
    horario: VENTANA,
  });
  // La barra se mide desde la creación (06:00): se detiene el reloj enseguida.
  await detener(page, "2026-07-15T06:00:30");

  await conReloj(page, () =>
    esperarEstado(page, "Regar", "en espera", undefined, false, false),
  );
  await tocarDeshabilitado(page, "Regar");
  await conReloj(page, () =>
    esperarEstado(page, "Regar", "en espera", undefined, false, false),
  );

  await ir(page, "2026-07-15T07:00:00");
  await conReloj(page, () =>
    esperarEstado(page, "Regar", "en espera", 50, false, false),
  );

  await ir(page, "2026-07-15T08:00:00");
  await conReloj(page, () =>
    esperarEstado(page, "Regar", "pendiente", undefined, false, true),
  );

  await ir(page, "2026-07-15T10:59:58");
  await completar(page, "Regar");
  await verAviso(page, "Regar");
  await conReloj(page, () => listaEs(page, []));

  await ir(page, "2026-07-15T11:00:02");
  await verAviso(page, "Regar");
  await aviso(page).getByRole("button", { name: "Deshacer" }).click();
  await expect(aviso(page)).toHaveCount(0);
  await asentar(page);
  await conReloj(page, () =>
    esperarEstado(page, "Regar", "en espera", 0, false, false),
  );

  await ir(page, "2026-07-15T21:30:00");
  await conReloj(page, () =>
    esperarEstado(page, "Regar", "en espera", 50, false, false),
  );

  await ir(page, "2026-07-16T08:00:00");
  await conReloj(page, () =>
    esperarEstado(page, "Regar", "pendiente", undefined, false, true),
  );
});

test("Flujo 4: puntual con fecha límite", async ({ page }) => {
  await sesionConReloj(page, "2026-07-15T06:00:00");
  await crearYVer(page, {
    titulo: "Pagar la luz",
    tipo: "No se repite",
    fecha: "2026-07-16",
    horario: VENTANA,
  });
  await esperarEstado(
    page,
    "Pagar la luz",
    "en espera",
    undefined,
    false,
    false,
  );

  await adelantar(page, "2026-07-16T10:59:00");
  await esperarEstado(
    page,
    "Pagar la luz",
    "pendiente",
    undefined,
    false,
    true,
  );

  await adelantar(page, "2026-07-16T11:00:00");
  await esperarEstado(
    page,
    "Pagar la luz",
    "atrasada",
    undefined,
    false,
    false,
  );

  await adelantar(page, "2026-07-17T08:00:00");
  await esperarEstado(page, "Pagar la luz", "atrasada", undefined, false, true);
  await completar(page, "Pagar la luz");
  await verAviso(page, "Pagar la luz");
  await listaEs(page, []);

  await adelantar(page, "2026-07-17T12:00:00");
  await crearYVer(page, {
    titulo: "Pagar el gas",
    tipo: "No se repite",
    fecha: "2026-07-17",
    horario: VENTANA,
  });
  await esperarEstado(
    page,
    "Pagar el gas",
    "atrasada",
    undefined,
    false,
    false,
  );
});

test("Flujo 5: relativa con horario", async ({ page }) => {
  await sesionAntes(page, "2026-07-15T09:00:00");
  await encenderCompletadas(page);
  await crearYVer(page, {
    titulo: "Regar",
    tipo: "Intervalo",
    cada: "1",
    unidad: "días",
    horario: VENTANA,
  });
  await detener(page, "2026-07-15T09:00:00");
  await conReloj(page, () =>
    esperarEstado(page, "Regar", "pendiente", undefined, false, true),
  );

  await completar(page, "Regar");
  await conReloj(page, () =>
    esperarEstado(page, "Regar", "en espera", 0, true, true),
  );

  await ir(page, "2026-07-15T15:00:00");
  await conReloj(page, () =>
    esperarEstado(page, "Regar", "en espera", 25, true, true),
  );

  await ir(page, "2026-07-16T09:00:00");
  await conReloj(page, () =>
    esperarEstado(page, "Regar", "pendiente", undefined, false, true),
  );
  await ir(page, "2026-07-16T11:00:00");
  await conReloj(page, () =>
    esperarEstado(page, "Regar", "atrasada", undefined, false, false),
  );
  await ir(page, "2026-07-16T20:00:00");
  await conReloj(page, () =>
    esperarEstado(page, "Regar", "atrasada", undefined, false, false),
  );

  await ir(page, "2026-07-17T08:00:00");
  await conReloj(page, () =>
    esperarEstado(page, "Regar", "atrasada", undefined, false, true),
  );
  await completar(page, "Regar");
  await verAviso(page, "Regar");
  await conReloj(page, () =>
    esperarEstado(page, "Regar", "en espera", undefined, true, true),
  );

  await ir(page, "2026-07-17T20:00:00");
  await conReloj(page, () =>
    esperarEstado(page, "Regar", "en espera", 50, true, true),
  );
});

test("Flujo 6: atraso antes de que abra la ventana", async ({ page }) => {
  await sesionAntes(page, "2026-07-15T10:00:00");
  await crearYVer(page, {
    titulo: "Remedio",
    tipo: "Intervalo",
    cada: "4",
    unidad: "horas",
    horario: VENTANA,
  });
  await detener(page, "2026-07-15T10:00:00");
  await completar(page, "Remedio");
  await conReloj(page, () => listaEs(page, []));
  await conmutarMostrarCompletadas(page, true);

  await ir(page, "2026-07-15T15:30:00");
  await conReloj(page, () =>
    esperarEstado(page, "Remedio", "en espera", 25, true, true),
  );

  await ir(page, "2026-07-15T18:00:00");
  await conReloj(page, () =>
    esperarEstado(page, "Remedio", "atrasada", undefined, false, false),
  );

  await ir(page, "2026-07-16T08:00:00");
  await conReloj(page, () =>
    esperarEstado(page, "Remedio", "atrasada", undefined, false, true),
  );
});

test("Flujo 7: calendario y Mostrar completadas", async ({ page }) => {
  await sesionAntes(page, "2026-07-14T07:00:00");
  await crearYVer(page, {
    titulo: "Sacar la basura",
    tipo: "Días de la semana",
    dias: ["martes", "jueves"],
    horario: VENTANA,
  });
  await detener(page, "2026-07-14T07:00:00");
  await conReloj(page, () =>
    esperarEstado(
      page,
      "Sacar la basura",
      "en espera",
      undefined,
      false,
      false,
    ),
  );

  await ir(page, "2026-07-14T08:00:00");
  await conReloj(page, () =>
    esperarEstado(page, "Sacar la basura", "pendiente", undefined, false, true),
  );
  await completar(page, "Sacar la basura");
  await conReloj(page, () => listaEs(page, []));

  await ir(page, "2026-07-16T07:59:00");
  await conReloj(page, () => listaEs(page, []));

  await conmutarMostrarCompletadas(page, true);
  await conReloj(page, () =>
    esperarEstado(page, "Sacar la basura", "en espera", undefined, true, false),
  );
  await conmutarMostrarCompletadas(page, false);

  await ir(page, "2026-07-16T08:00:00");
  await conReloj(page, () =>
    esperarEstado(page, "Sacar la basura", "pendiente", undefined, false, true),
  );

  await ir(page, "2026-07-16T11:00:00");
  await conReloj(page, () =>
    esperarEstado(page, "Sacar la basura", "atrasada", undefined, false, false),
  );

  await ir(page, "2026-07-17T09:00:00");
  await conReloj(page, () =>
    esperarEstado(page, "Sacar la basura", "atrasada", undefined, false, true),
  );
  await completar(page, "Sacar la basura");
  await conReloj(page, () => listaEs(page, []));
  await irA(page, "Historial");
  const entrada = page
    .getByRole("listitem")
    .filter({ hasText: /^Sacar la basura\s*09:00/ });
  await conReloj(page, () => expect(entrada).toHaveCount(1));

  await ir(page, "2026-07-17T20:00:00");
  await entrada.getByRole("button", { name: "Borrar", exact: true }).click();
  const dialogo = page.getByRole("alertdialog");
  await dialogo.getByRole("button", { name: "Borrar", exact: true }).click();
  await expect(dialogo).toHaveCount(0);
  await conReloj(page, () => expect(entrada).toHaveCount(0));
  await irA(page, "Pendientes");
  await conReloj(page, () =>
    esperarEstado(page, "Sacar la basura", "atrasada", undefined, false, false),
  );
});

test("Flujo 8: orden con horario", async ({ page }) => {
  await sesionConReloj(page, "2026-07-15T08:00:00");
  await crearYVer(page, {
    titulo: "Cambiar sábanas",
    tipo: "Días de la semana",
    dias: ["jueves"],
  });
  await adelantar(page, "2026-07-15T08:01:00");
  await crearYVer(page, {
    titulo: "Sacar la basura",
    tipo: "Días de la semana",
    dias: ["jueves"],
    horario: { desde: "09:00", hasta: "10:00" },
  });
  await adelantar(page, "2026-07-15T12:00:00");
  await crearYVer(page, {
    titulo: "Cambiar foco",
    tipo: "No se repite",
    horario: VENTANA,
  });

  await adelantar(page, "2026-07-15T14:00:00");
  await esperarEstado(
    page,
    "Cambiar sábanas",
    "en espera",
    undefined,
    false,
    true,
  );
  await esperarEstado(
    page,
    "Cambiar foco",
    "en espera",
    undefined,
    false,
    false,
  );
  await esperarEstado(
    page,
    "Sacar la basura",
    "en espera",
    undefined,
    false,
    false,
  );
  await listaEs(page, ["Cambiar sábanas", "Cambiar foco", "Sacar la basura"]);

  await editar(page, "Cambiar foco", {
    horario: { desde: "10:00", hasta: "11:00" },
  });
  await listaEs(page, ["Cambiar sábanas", "Sacar la basura", "Cambiar foco"]);

  await adelantar(page, "2026-07-16T09:30:00");
  await esperarEstado(page, "Cambiar sábanas", "pendiente");
  await esperarEstado(page, "Sacar la basura", "pendiente");
  await esperarEstado(
    page,
    "Cambiar foco",
    "en espera",
    undefined,
    false,
    false,
  );
  await listaEs(page, ["Cambiar sábanas", "Sacar la basura", "Cambiar foco"]);

  await crearYVer(page, {
    titulo: "Pagar la luz",
    tipo: "No se repite",
    fecha: "2026-07-17",
    horario: VENTANA,
  });
  await crearYVer(page, {
    titulo: "Barrer",
    tipo: "No se repite",
    horario: VENTANA,
  });
  await esperarEstado(page, "Pagar la luz", "pendiente");
  await esperarEstado(page, "Barrer", "pendiente");
  await listaEs(page, [
    "Cambiar sábanas",
    "Sacar la basura",
    "Pagar la luz",
    "Barrer",
    "Cambiar foco",
  ]);

  await editar(page, "Pagar la luz", { fecha: "2026-07-16" });
  await listaEs(page, [
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
    cerrar: fin,
  } = await dosDispositivos(browser, "2026-07-15T06:00:00");
  await crear(a, { titulo: "Regar", tipo: "No se repite", horario: VENTANA });
  await verHorario(b, "Regar", "08:00–11:00");

  await ctxB.setOffline(true);
  await editar(a, "Regar", { horario: { desde: "07:00" } });
  await llegaAlServidor(a);
  await editar(b, "Regar", { horario: { hasta: "12:00" } });
  await ctxB.setOffline(false);
  await llegaAlServidor(b);
  await verHorario(a, "Regar", "08:00–12:00");
  await verHorario(b, "Regar", "08:00–12:00");

  await ctxB.setOffline(true);
  await editar(a, "Regar", { horario: null });
  await llegaAlServidor(a);
  await editar(b, "Regar", { titulo: "Regar plantas" });
  await ctxB.setOffline(false);
  await llegaAlServidor(b);
  for (const p of [a, b]) {
    await expect(fila(p, "Regar plantas")).toBeVisible();
    await sinHorario(p, "Regar plantas");
  }
  await fin();
});

test("Flujo 10: sin horario, todo sigue igual", async ({ page }) => {
  await sesionConReloj(page, "2026-07-15T02:50:00");
  await crearYVer(page, { titulo: "Barrer", tipo: "No se repite" });
  await adelantar(page, "2026-07-15T03:00:00");
  await esperarEstado(page, "Barrer", "pendiente", undefined, false, true);
  await sinHorario(page, "Barrer");

  await crearYVer(page, {
    titulo: "Regar",
    tipo: "Intervalo",
    cada: "1",
    unidad: "días",
  });
  await completar(page, "Regar");
  await expect(fila(page, "Regar")).toHaveCount(0);
  await adelantar(page, "2026-07-16T03:00:00");
  await esperarEstado(page, "Regar", "pendiente", undefined, false, true);
  await sinHorario(page, "Regar");
});

const DOS_VENTANAS = [
  { desde: "07:00", hasta: "10:00" },
  { desde: "18:00", hasta: "21:00" },
];
const DOS_TEXTO = "07:00–10:00 · 18:00–21:00";
const SUPERPUESTOS = "Los horarios no se pueden superponer";
const SOLO_DIAS = "Con varios horarios, el intervalo tiene que ser en días";
const guardarPanel = (page: Page) =>
  page.getByRole("button", { name: "Guardar" }).click();

/** Verifica estado y checkbox con el reloj detenido en `hora`. */
async function enHora(
  page: Page,
  hora: string,
  titulo: string,
  estado: "pendiente" | "en espera" | "atrasada",
  barra: number | undefined,
  completada: boolean,
  habilitado: boolean,
) {
  await ir(page, hora);
  await conReloj(page, () =>
    esperarEstado(page, titulo, estado, barra, completada, habilitado),
  );
}

test("Flujo 11: Agregar horario y Quitar", async ({ page }) => {
  await sesionConReloj(page, "2026-07-15T06:00:00");
  const T = "Alimentar a los perros";
  await page.getByRole("button", { name: "+" }).click();
  await page.getByLabel("Título").fill(T);
  await page.getByRole("radio", { name: "No se repite" }).check();
  await soloEnUnHorario(page).check();
  await expect(page.getByLabel("Desde", { exact: true })).toHaveCount(1);
  await expect(page.getByLabel("Hasta", { exact: true })).toHaveCount(1);
  await expect(quitarHorario(page)).toHaveCount(0);
  await expect(agregarHorario(page)).toBeVisible();

  await campoDesde(page, 0).fill("18:00");
  await campoHasta(page, 0).fill("21:00");
  await agregarHorario(page).click();
  await expect(page.getByLabel("Desde", { exact: true })).toHaveCount(2);
  await expect(quitarHorario(page)).toHaveCount(2);
  await expect(campoDesde(page, 1)).toHaveValue("");
  await expect(campoHasta(page, 1)).toHaveValue("");
  await campoDesde(page, 1).fill("07:00");
  await campoHasta(page, 1).fill("10:00");
  await guardarPanel(page);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await verHorario(page, T, DOS_TEXTO);

  await abrir(page, T);
  await expect(soloEnUnHorario(page)).toBeChecked();
  await expect(campoDesde(page, 0)).toHaveValue("07:00");
  await expect(campoHasta(page, 0)).toHaveValue("10:00");
  await expect(campoDesde(page, 1)).toHaveValue("18:00");
  await expect(campoHasta(page, 1)).toHaveValue("21:00");
  await quitarHorario(page).first().click();
  await expect(page.getByLabel("Desde", { exact: true })).toHaveCount(1);
  await guardarPanel(page);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await verHorario(page, T, "18:00–21:00");

  await abrir(page, T);
  await expect(page.getByLabel("Desde", { exact: true })).toHaveCount(1);
  await expect(quitarHorario(page)).toHaveCount(0);
  await agregarHorario(page).click();
  await campoDesde(page, 1).fill("10:00");
  await campoHasta(page, 1).fill("12:00");
  await campoDesde(page, 0).fill("08:00");
  await campoHasta(page, 0).fill("10:00");
  await guardarPanel(page);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await verHorario(page, T, "08:00–10:00 · 10:00–12:00");

  await editar(page, T, { horario: null });
  await sinHorario(page, T);

  await crear(page, {
    titulo: "Remedio",
    tipo: "Intervalo",
    cada: "8",
    unidad: "horas",
    horarios: [{ desde: "08:00", hasta: "20:00" }],
  });
  await verHorario(page, "Remedio", "08:00–20:00");

  await page.reload();
  await expect(fila(page, "Remedio")).toBeVisible();
  await sinHorario(page, T);
  await verHorario(page, "Remedio", "08:00–20:00");
});

test("Flujo 12: errores de varios horarios", async ({ page }) => {
  await sesionConReloj(page, "2026-07-15T06:00:00");
  await crear(page, {
    titulo: "Regar",
    tipo: "No se repite",
    horario: VENTANA,
  });
  await crear(page, {
    titulo: "Remedio",
    tipo: "Intervalo",
    cada: "8",
    unidad: "horas",
    horario: VENTANA,
  });
  const FIN = "La hora de fin tiene que ser posterior a la de inicio";
  const DOS = "Completá las dos horas";

  await page.getByRole("button", { name: "+" }).click();
  await page.getByLabel("Título").fill("Perros");
  await page.getByRole("radio", { name: "No se repite" }).check();
  await soloEnUnHorario(page).check();
  await campoDesde(page, 0).fill("08:00");
  await campoHasta(page, 0).fill("11:00");
  await agregarHorario(page).click();
  await campoDesde(page, 1).fill("10:00");
  await campoHasta(page, 1).fill("12:00");
  await guardarPanel(page);
  await errorEnPanel(page, SUPERPUESTOS);

  await campoDesde(page, 1).fill("08:00");
  await campoHasta(page, 1).fill("11:00");
  await guardarPanel(page);
  await errorEnPanel(page, SUPERPUESTOS);

  await campoDesde(page, 1).fill("09:00");
  await campoHasta(page, 1).fill("10:00");
  await guardarPanel(page);
  await errorEnPanel(page, SUPERPUESTOS);

  await campoHasta(page, 1).fill("");
  await guardarPanel(page);
  await errorEnPanel(page, DOS);

  await campoHasta(page, 1).fill("08:00");
  await guardarPanel(page);
  await errorEnPanel(page, FIN);

  await campoDesde(page, 1).fill("18:00");
  await campoHasta(page, 1).fill("21:00");
  await page.getByRole("radio", { name: "Intervalo" }).check();
  await page.getByRole("spinbutton", { name: "Cada" }).fill("8");
  await page.getByLabel("Unidad").selectOption({ label: "horas" });
  await guardarPanel(page);
  await errorEnPanel(page, SOLO_DIAS);

  await page.getByLabel("Unidad").selectOption({ label: "días" });
  await page.getByRole("spinbutton", { name: "Cada" }).fill("1");
  await guardarPanel(page);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await verHorario(page, "Perros", "08:00–11:00 · 18:00–21:00");

  await abrir(page, "Regar");
  await page.getByLabel("Título").fill("Regar plantas");
  await agregarHorario(page).click();
  await campoDesde(page, 1).fill("10:59");
  await campoHasta(page, 1).fill("12:00");
  await guardarPanel(page);
  await errorEnPanel(page, SUPERPUESTOS);
  await descartar(page);
  await verHorario(page, "Regar", "08:00–11:00");
  await expect(fila(page, "Regar plantas")).toHaveCount(0);

  await abrir(page, "Remedio");
  await agregarHorario(page).click();
  await campoDesde(page, 1).fill("18:00");
  await campoHasta(page, 1).fill("21:00");
  await guardarPanel(page);
  await errorEnPanel(page, SOLO_DIAS);
  await descartar(page);
  await verHorario(page, "Remedio", "08:00–11:00");

  await abrir(page, "Perros");
  await page.getByRole("radio", { name: "Intervalo" }).check();
  await page.getByLabel("Unidad").selectOption({ label: "horas" });
  await guardarPanel(page);
  await errorEnPanel(page, SOLO_DIAS);
  await descartar(page);
  await verHorario(page, "Perros", "08:00–11:00 · 18:00–21:00");
  await abrir(page, "Perros");
  await expect(page.getByRole("spinbutton", { name: "Cada" })).toHaveValue("1");
  await expect(page.getByLabel("Unidad")).toHaveValue(/d/);
  await cerrar(page);
});

test("Flujo 13: calendario con dos ventanas", async ({ page }) => {
  // La barra cuenta desde la creación: se crea segundos antes de las 06:00 para que 06:30 marque 50.
  await sesionConReloj(page, "2026-07-15T05:59:40");
  await crearYVer(page, {
    titulo: "Perros",
    tipo: "Días de la semana",
    dias: ["miércoles", "jueves"],
    horarios: DOS_VENTANAS,
  });
  await verHorario(page, "Perros", DOS_TEXTO);
  await detener(page, "2026-07-15T06:00:00");
  await conReloj(page, () =>
    esperarEstado(page, "Perros", "en espera", undefined, false, false),
  );

  await enHora(
    page,
    "2026-07-15T06:30:00",
    "Perros",
    "en espera",
    50,
    false,
    false,
  );
  await enHora(
    page,
    "2026-07-15T08:00:00",
    "Perros",
    "pendiente",
    undefined,
    false,
    true,
  );
  await completar(page, "Perros");
  await verAviso(page, "Perros");
  await conReloj(page, () => listaEs(page, []));

  await ir(page, "2026-07-15T13:00:00");
  await conReloj(page, () => listaEs(page, []));
  await conmutarMostrarCompletadas(page, true);
  await conReloj(page, () =>
    esperarEstado(page, "Perros", "en espera", 50, true, true),
  );
  await conmutarMostrarCompletadas(page, false);

  await enHora(
    page,
    "2026-07-15T18:00:00",
    "Perros",
    "pendiente",
    undefined,
    false,
    true,
  );
  await completar(page, "Perros");
  await verAviso(page, "Perros");
  await conReloj(page, () => listaEs(page, []));

  await conmutarMostrarCompletadas(page, true);
  await enHora(
    page,
    "2026-07-16T05:00:00",
    "Perros",
    "en espera",
    undefined,
    true,
    false,
  );
  await conmutarMostrarCompletadas(page, false);

  await enHora(
    page,
    "2026-07-16T07:00:00",
    "Perros",
    "pendiente",
    undefined,
    false,
    true,
  );
  await enHora(
    page,
    "2026-07-16T10:00:00",
    "Perros",
    "atrasada",
    undefined,
    false,
    false,
  );
  await enHora(
    page,
    "2026-07-16T12:00:00",
    "Perros",
    "atrasada",
    undefined,
    false,
    false,
  );
  await enHora(
    page,
    "2026-07-16T18:00:00",
    "Perros",
    "atrasada",
    undefined,
    false,
    true,
  );
  await completar(page, "Perros");
  await conReloj(page, () => listaEs(page, []));

  await irA(page, "Historial");
  const entradas = page.getByRole("listitem").filter({ hasText: /^Perros/ });
  await conReloj(page, () => expect(entradas).toHaveCount(3));
  await expect(entradas.filter({ hasText: /08:00/ })).toHaveCount(1);
  await expect(entradas.filter({ hasText: /18:00/ })).toHaveCount(2);
  await irA(page, "Pendientes");

  await ir(page, "2026-07-16T22:00:00");
  await conReloj(page, () => listaEs(page, []));
  await conmutarMostrarCompletadas(page, true);
  await conReloj(page, () =>
    esperarEstado(page, "Perros", "en espera", undefined, true, true),
  );
});

test("Flujo 14: puntual con dos ventanas", async ({ page }) => {
  await sesionAntes(page, "2026-07-15T06:00:00");
  await crearYVer(page, {
    titulo: "Comprar pan",
    tipo: "No se repite",
    horarios: DOS_VENTANAS,
  });
  await crearYVer(page, {
    titulo: "Pagar la luz",
    tipo: "No se repite",
    fecha: "2026-07-15",
    horarios: DOS_VENTANAS,
  });
  await detener(page, "2026-07-15T06:00:00");
  for (const t of ["Comprar pan", "Pagar la luz"])
    await conReloj(page, () =>
      esperarEstado(page, t, "en espera", undefined, false, false),
    );

  await ir(page, "2026-07-15T07:00:00");
  for (const t of ["Comprar pan", "Pagar la luz"])
    await conReloj(page, () =>
      esperarEstado(page, t, "pendiente", undefined, false, true),
    );

  await ir(page, "2026-07-15T10:00:00");
  for (const t of ["Comprar pan", "Pagar la luz"])
    await conReloj(page, () =>
      esperarEstado(page, t, "en espera", undefined, false, false),
    );
  await ir(page, "2026-07-15T14:00:00");
  for (const t of ["Comprar pan", "Pagar la luz"])
    await conReloj(page, () =>
      esperarEstado(page, t, "en espera", 50, false, false),
    );

  await ir(page, "2026-07-15T18:00:00");
  for (const t of ["Comprar pan", "Pagar la luz"])
    await conReloj(page, () =>
      esperarEstado(page, t, "pendiente", undefined, false, true),
    );
  await completar(page, "Comprar pan");
  await verAviso(page, "Comprar pan");
  await conReloj(page, () => listaEs(page, ["Pagar la luz"]));

  await ir(page, "2026-07-15T21:00:00");
  await conReloj(page, () =>
    esperarEstado(page, "Pagar la luz", "atrasada", undefined, false, false),
  );

  await ir(page, "2026-07-16T08:00:00");
  await conReloj(page, () => listaEs(page, ["Pagar la luz"]));
  await conReloj(page, () =>
    esperarEstado(page, "Pagar la luz", "atrasada", undefined, false, true),
  );
});

test("Flujo 15: relativa cada 2 días con dos ventanas", async ({ page }) => {
  await sesionAntes(page, "2026-07-13T06:00:00");
  await encenderCompletadas(page);
  await crearYVer(page, {
    titulo: "Perros",
    tipo: "Intervalo",
    cada: "2",
    unidad: "días",
    horarios: DOS_VENTANAS,
  });
  await detener(page, "2026-07-13T06:00:00");
  await conReloj(page, () =>
    esperarEstado(page, "Perros", "en espera", undefined, false, false),
  );

  await enHora(
    page,
    "2026-07-13T08:00:00",
    "Perros",
    "pendiente",
    undefined,
    false,
    true,
  );
  await completar(page, "Perros");
  await conReloj(page, () =>
    esperarEstado(page, "Perros", "en espera", undefined, true, true),
  );

  await enHora(
    page,
    "2026-07-13T13:00:00",
    "Perros",
    "en espera",
    50,
    true,
    true,
  );
  await enHora(
    page,
    "2026-07-13T18:00:00",
    "Perros",
    "pendiente",
    undefined,
    false,
    true,
  );
  await completar(page, "Perros");
  await conReloj(page, () =>
    esperarEstado(page, "Perros", "en espera", undefined, true, true),
  );

  await enHora(
    page,
    "2026-07-14T12:30:00",
    "Perros",
    "en espera",
    50,
    true,
    false,
  );
  await enHora(
    page,
    "2026-07-14T19:00:00",
    "Perros",
    "en espera",
    undefined,
    true,
    true,
  );

  await enHora(
    page,
    "2026-07-15T07:00:00",
    "Perros",
    "pendiente",
    undefined,
    false,
    true,
  );
  await enHora(
    page,
    "2026-07-15T10:00:00",
    "Perros",
    "atrasada",
    undefined,
    false,
    false,
  );

  await enHora(
    page,
    "2026-07-16T08:00:00",
    "Perros",
    "atrasada",
    undefined,
    false,
    true,
  );
  await completar(page, "Perros");
  await conReloj(page, () =>
    esperarEstado(page, "Perros", "en espera", undefined, true, true),
  );

  await enHora(
    page,
    "2026-07-16T13:00:00",
    "Perros",
    "en espera",
    50,
    true,
    true,
  );
  await enHora(
    page,
    "2026-07-16T18:00:00",
    "Perros",
    "pendiente",
    undefined,
    false,
    true,
  );
});
