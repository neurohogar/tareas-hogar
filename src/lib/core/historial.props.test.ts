// Spec §6.3 (Historial).
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { encabezadoDelDia, horaEnTexto } from "./fechas-en-texto";
import { historial, type EntradaDelHistorial } from "./historial";
import type { Completado, Tarea } from "./tarea";

const IDS = ["t1", "t2", "t3", "t4"];
const tareas = fc
  .subarray(IDS)
  .map((ids) =>
    ids.map((id): Tarea => ({
      id,
      titulo: id,
      tipo: "puntual",
      creadaEn: new Date(0),
    })),
  );
/** Pocos instantes posibles, para que haya empates de completadoEn y varios en el mismo día. */
const DIA_MS = 86_400_000;
const momento = fc.oneof(
  fc
    .integer({ min: 0, max: 20 })
    .map((i) => 1_700_000_000_000 + i * 3 * 3_600_000),
  fc.integer({ min: 0, max: 4_000_000_000_000 }),
);
const completados = fc
  .uniqueArray(
    fc.record({
      id: fc.string({ minLength: 1, maxLength: 4 }),
      tareaId: fc.constantFrom(...IDS),
      ms: momento,
    }),
    {
      maxLength: 20,
      selector: ({ id }) => id,
    },
  )
  .map((cs) =>
    cs.map(({ id, tareaId, ms }): Completado => ({
      id,
      tareaId,
      completadoEn: new Date(ms),
    })),
  );
const ahora = fc.oneof(
  fc
    .integer({ min: 0, max: 22 })
    .map((i) => new Date(1_700_000_000_000 + (i * DIA_MS) / 4)),
  fc.integer({ min: 0, max: 4_000_000_000_000 }).map((ms) => new Date(ms)),
);

const entradas = (
  grupos: ReturnType<typeof historial>,
): EntradaDelHistorial[] => grupos.flatMap((g) => g.entradas);
const existe = (ts: readonly Tarea[], c: Completado) =>
  ts.some(({ id }) => id === c.tareaId);

describe("historial (propiedades)", () => {
  it("muestra cada completado de una tarea que existe exactamente una vez, con su tarea, y ningún otro", () => {
    fc.assert(
      fc.property(tareas, completados, ahora, (ts, cs, a) => {
        const mostradas = entradas(historial(ts, cs, a));
        const esperados = cs.filter((c) => existe(ts, c));
        expect(mostradas.map((e) => e.completado.id).sort()).toEqual(
          esperados.map((c) => c.id).sort(),
        );
        for (const { completado, tarea } of mostradas)
          expect(tarea.id).toBe(completado.tareaId);
      }),
    );
  });

  it("va estrictamente del más reciente al más antiguo; si empatan, primero el id menor", () => {
    fc.assert(
      fc.property(tareas, completados, ahora, (ts, cs, a) => {
        const mostradas = entradas(historial(ts, cs, a)).map(
          (e) => e.completado,
        );
        for (let i = 1; i < mostradas.length; i++) {
          const [antes, despues] = [mostradas[i - 1], mostradas[i]];
          const diferencia =
            antes.completadoEn.getTime() - despues.completadoEn.getTime();
          expect(
            diferencia > 0 || (diferencia === 0 && antes.id < despues.id),
          ).toBe(true);
        }
      }),
    );
  });

  it("no depende del orden en que llegan las tareas ni los completados", () => {
    fc.assert(
      fc.property(
        tareas,
        completados,
        ahora,
        fc.nat(),
        fc.nat(),
        (ts, cs, a, s1, s2) => {
          const rotar = <T>(xs: readonly T[], n: number) =>
            xs.map((_, i) => xs[(i + n) % xs.length]);
          const mezclados = rotar([...cs].reverse(), s1);
          expect(historial(rotar(ts, s2), mezclados, a)).toEqual(
            historial(ts, cs, a),
          );
        },
      ),
    );
  });

  it("cada entrada cae bajo el encabezado de su día, con su hora; no hay grupos vacíos ni encabezados repetidos", () => {
    fc.assert(
      fc.property(tareas, completados, ahora, (ts, cs, a) => {
        const grupos = historial(ts, cs, a);
        for (const { encabezado, entradas: delGrupo } of grupos) {
          expect(delGrupo.length).toBeGreaterThan(0);
          for (const { completado, hora } of delGrupo) {
            expect(encabezadoDelDia(completado.completadoEn, a)).toBe(
              encabezado,
            );
            expect(hora).toBe(horaEnTexto(completado.completadoEn));
          }
        }
        const encabezados = grupos.map((g) => g.encabezado);
        expect(new Set(encabezados).size).toBe(encabezados.length);
      }),
    );
  });
});
