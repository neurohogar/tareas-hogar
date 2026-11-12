// Spec §6.2: "Última vez" del panel de edición.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { diasEntre } from "./dias";
import { encabezadoDelDia, horaEnTexto } from "./fechas-en-texto";
import type { Completado } from "./tarea";
import { ultimaVez } from "./ultima-vez";

const instante = fc
  .integer({ min: 0, max: 4_000_000_000_000 })
  .map((ms) => new Date(ms));
/** Completados de la tarea t1 o de otra, alrededor de ahora (± ~3 años). */
const completados = (ahora: Date) =>
  fc
    .array(
      fc.record({
        tareaId: fc.constantFrom("t1", "t2"),
        delta: fc.integer({ min: -100_000_000_000, max: 5_000_000_000 }),
      }),
      { maxLength: 8 },
    )
    .map((xs): Completado[] =>
      xs.map(({ tareaId, delta }, i) => ({
        id: `c${i}`,
        tareaId,
        completadoEn: new Date(ahora.getTime() + delta),
      })),
    );

const conAhora = instante.chain((ahora) =>
  fc.tuple(fc.constant(ahora), completados(ahora)),
);

describe("ultimaVez (propiedades)", () => {
  it('sin completados de la tarea es "nunca", sin importar los de otras tareas', () => {
    fc.assert(
      fc.property(conAhora, ([ahora, cs]) => {
        const ajenos = cs.filter((c) => c.tareaId !== "t1");
        expect(ultimaVez("t1", ajenos, ahora)).toBe("nunca");
      }),
    );
  });

  it("depende solo del completado más reciente de la tarea, no del orden ni de los ajenos", () => {
    fc.assert(
      fc.property(conAhora, ([ahora, cs]) => {
        const propios = cs.filter((c) => c.tareaId === "t1");
        fc.pre(propios.length > 0);
        const ultimo = propios.reduce((a, b) =>
          b.completadoEn.getTime() > a.completadoEn.getTime() ? b : a,
        );
        const texto = ultimaVez("t1", cs, ahora);
        expect(ultimaVez("t1", [...cs].reverse(), ahora)).toBe(texto);
        expect(ultimaVez("t1", [ultimo], ahora)).toBe(texto);
      }),
    );
  });

  it('hoy y ayer con la hora, "hace N días" desde dos, y la fecha con la hora si es posterior a hoy', () => {
    fc.assert(
      fc.property(
        instante,
        fc.integer({ min: -5_000_000_000, max: 100_000_000_000 }),
        (ahora, atras) => {
          const momento = new Date(ahora.getTime() - atras);
          const texto = ultimaVez(
            "t1",
            [{ id: "c1", tareaId: "t1", completadoEn: momento }],
            ahora,
          );
          const dias = diasEntre(momento, ahora);
          const hora = horaEnTexto(momento);
          if (dias >= 2) expect(texto).toBe(`hace ${dias} días`);
          else if (dias === 1) expect(texto).toBe(`ayer ${hora}`);
          else if (dias === 0) expect(texto).toBe(`hoy ${hora}`);
          else
            expect(texto).toBe(`${encabezadoDelDia(momento, ahora)} ${hora}`);
        },
      ),
    );
  });
});
