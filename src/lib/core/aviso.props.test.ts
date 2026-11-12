// Spec §5.4: el aviso con Deshacer.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  avisoAlCompletar,
  avisoVisible,
  completadoADeshacer,
  DURACION_DEL_AVISO_MS,
  msHastaQueVence,
} from "./aviso";
import { completar } from "./completados";
import { estadoDeTarea } from "./estado-de-tarea";
import {
  DIAS_DE_LA_SEMANA,
  type Completado,
  type Recurrencia,
  type Tarea,
} from "./tarea";

const HORA_MS = 3_600_000;
const instante = fc.integer({ min: 0, max: 4_000_000_000_000 });
const tareaSimple: Tarea = {
  id: "t",
  titulo: "Regar",
  tipo: "puntual",
  creadaEn: new Date(0),
};
const avisoEn = (ms: number) =>
  avisoAlCompletar(tareaSimple, {
    id: "c",
    tareaId: "t",
    completadoEn: new Date(ms),
  });
/** Desde completadoEn hasta ahora: alrededor de la ventana y lejos de ella. */
const desplazamiento = fc.oneof(
  fc.integer({
    min: -2 * DURACION_DEL_AVISO_MS,
    max: 2 * DURACION_DEL_AVISO_MS,
  }),
  fc.integer({ min: -1e10, max: 1e10 }),
);
const enVentana = (d: number) => d >= 0 && d < DURACION_DEL_AVISO_MS;

describe("aviso (propiedades)", () => {
  it("se ve, y ofrece deshacer su completado, exactamente en [completadoEn, completadoEn + 5 s)", () => {
    fc.assert(
      fc.property(instante, desplazamiento, (t, d) => {
        const aviso = avisoEn(t);
        const ahora = new Date(t + d);
        expect(avisoVisible(aviso, ahora)).toBe(
          enVentana(d) ? aviso : undefined,
        );
        expect(completadoADeshacer(aviso, ahora)).toBe(
          enVentana(d) ? aviso.completado : undefined,
        );
      }),
    );
  });

  it("sin aviso no hay nada que ver ni deshacer", () => {
    fc.assert(
      fc.property(instante, (t) => {
        expect(avisoVisible(undefined, new Date(t))).toBeUndefined();
        expect(completadoADeshacer(undefined, new Date(t))).toBeUndefined();
      }),
    );
  });

  it("mientras se ve, vence justo cuando dejan de pasar msHastaQueVence", () => {
    fc.assert(
      fc.property(
        instante,
        fc.integer({ min: 0, max: DURACION_DEL_AVISO_MS - 1 }),
        (t, d) => {
          const aviso = avisoEn(t);
          const falta = msHastaQueVence(aviso, new Date(t + d));
          expect(falta).toBeGreaterThan(0);
          expect(falta).toBeLessThanOrEqual(DURACION_DEL_AVISO_MS);
          expect(avisoVisible(aviso, new Date(t + d + falta - 1))).toBe(aviso);
          expect(avisoVisible(aviso, new Date(t + d + falta))).toBeUndefined();
        },
      ),
    );
  });

  it("nombra la tarea y el completado al completar; uno nuevo reemplaza al anterior", () => {
    fc.assert(
      fc.property(
        instante,
        fc.integer({ min: 0, max: 10 * DURACION_DEL_AVISO_MS }),
        desplazamiento,
        (t, entre, d) => {
          const primero = avisoEn(t);
          const otraTarea: Tarea = { ...tareaSimple, id: "u", titulo: "Pagar" };
          const nuevo: Completado = {
            id: "d",
            tareaId: "u",
            completadoEn: new Date(t + entre),
          };
          const segundo = avisoAlCompletar(otraTarea, nuevo);
          expect(segundo).toEqual({ nombre: "Pagar", completado: nuevo });
          const deshecho = completadoADeshacer(
            segundo,
            new Date(t + entre + d),
          );
          expect(deshecho).not.toBe(primero.completado);
          expect(deshecho).toBe(enVentana(d) ? nuevo : undefined);
        },
      ),
    );
  });
});

// Tareas de los tres tipos, con un historial armado con `completar` en orden.
const DIAS_MES = fc
  .uniqueArray(fc.integer({ min: 1, max: 31 }), { minLength: 1, maxLength: 6 })
  .map((d) => d.sort((a, b) => a - b));
const recurrencia: fc.Arbitrary<Recurrencia> = fc.oneof(
  fc
    .record({
      cada: fc.integer({ min: 1, max: 500 }),
      unidad: fc.constantFrom("horas" as const, "dias" as const),
    })
    .map((r) => ({ modo: "relativo" as const, ...r })),
  fc
    .subarray([...DIAS_DE_LA_SEMANA], { minLength: 1 })
    .map((d) => ({ modo: "calendario" as const, diasSemana: d })),
  DIAS_MES.map((d) => ({ modo: "calendario" as const, diasMes: d })),
);
const creadaEn = fc
  .tuple(fc.integer({ min: 0, max: 20_000 }), fc.integer({ min: 0, max: 23 }))
  .map(([dia, hora]) => new Date(1990, 0, 1 + dia, hora));
const tarea: fc.Arbitrary<Tarea> = fc.oneof(
  fc
    .tuple(recurrencia, creadaEn)
    .map(([r, c]): Tarea => ({
      id: "t",
      titulo: "T",
      tipo: "periodica",
      recurrencia: r,
      creadaEn: c,
    })),
  fc
    .tuple(
      creadaEn,
      fc.option(fc.integer({ min: 0, max: 400 }), { nil: undefined }),
    )
    .map(([c, dias]): Tarea => ({
      id: "t",
      titulo: "T",
      tipo: "puntual",
      creadaEn: c,
      ...(dias !== undefined && {
        fechaLimite: new Date(
          c.getFullYear(),
          c.getMonth(),
          c.getDate() + dias,
        ),
      }),
    })),
);
const escenario = fc.record({
  tarea,
  /** Horas desde creadaEn de los completados previos (en orden) y del último. */
  horas: fc
    .array(fc.integer({ min: 0, max: 2_000 }), { maxLength: 8 })
    .map((hs) => hs.sort((a, b) => a - b)),
  despuesDelUltimo: fc.integer({ min: 0, max: 500 }),
  deshacerTras: fc.integer({ min: 0, max: DURACION_DEL_AVISO_MS - 1 }),
  consultaTras: fc.integer({ min: 0, max: 3_000 }),
});

describe("deshacer el último completado (propiedades)", () => {
  it("borra solo ese completado: el estado y el próximo completado quedan como si no se hubiera completado", () => {
    fc.assert(
      fc.property(
        escenario,
        ({ tarea: t, horas, despuesDelUltimo, deshacerTras, consultaTras }) => {
          const en = (h: number) =>
            new Date(t.creadaEn.getTime() + h * HORA_MS);
          const previos = horas.reduce<Completado[]>(
            (cs, h) => [...cs, completar(t, cs, `c${cs.length}`, en(h))],
            [],
          );
          const momento = (horas.at(-1) ?? 0) + despuesDelUltimo;
          const ultimo = completar(t, previos, "ultimo", en(momento));
          const aviso = avisoAlCompletar(t, ultimo);

          const deshecho = completadoADeshacer(
            aviso,
            new Date(en(momento).getTime() + deshacerTras),
          );
          expect(deshecho).toBe(ultimo);
          const quedan = [...previos, ultimo].filter(
            ({ id }) => id !== deshecho?.id,
          );
          expect(quedan).toEqual(previos);

          const consulta = en(momento + consultaTras);
          expect(estadoDeTarea(t, quedan, consulta)).toEqual(
            estadoDeTarea(t, previos, consulta),
          );
          expect(completar(t, quedan, "otra", consulta)).toEqual(
            completar(t, previos, "otra", consulta),
          );
        },
      ),
    );
  });
});
