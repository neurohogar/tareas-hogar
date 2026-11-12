// Spec §6.3: encabezados de día y horas del Historial.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { encabezadoDelDia, horaEnTexto } from "./fechas-en-texto";

const instante = fc
  .integer({ min: -2_000_000_000_000, max: 8_000_000_000_000 })
  .map((ms) => new Date(ms));
const DIAS = "(lunes|martes|miércoles|jueves|viernes|sábado|domingo)";
const MESES =
  "(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)";
const FECHA = new RegExp(
  `^${DIAS} ([1-9]|[12]\\d|3[01]) de ${MESES}( de -?\\d+)?$`,
);

/** Un momento a `diasAntes` días del día local de `ahora`, a la hora y minuto dados. */
function momentoDelDia(
  ahora: Date,
  diasAntes: number,
  hora: number,
  minuto: number,
): Date {
  return new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate() - diasAntes,
    hora,
    minuto,
  );
}

describe("horaEnTexto (propiedades)", () => {
  it("da HH:MM de 24 h con la hora y el minuto locales, para cualquier instante", () => {
    fc.assert(
      fc.property(instante, (momento) => {
        const texto = horaEnTexto(momento);
        expect(texto).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
        const [hora, minuto] = texto.split(":").map(Number);
        expect([hora, minuto]).toEqual([
          momento.getHours(),
          momento.getMinutes(),
        ]);
      }),
    );
  });
});

describe("encabezadoDelDia (propiedades)", () => {
  const ahora = fc
    .integer({ min: 0, max: 4_000_000_000_000 })
    .map((ms) => new Date(ms));
  const diasAntes = fc.integer({ min: -800, max: 800 });
  const hora = fc.integer({ min: 0, max: 23 });
  const minuto = fc.integer({ min: 0, max: 59 });

  it('"Hoy" exactamente para el día de ahora y "Ayer" exactamente para el anterior', () => {
    fc.assert(
      fc.property(ahora, diasAntes, hora, minuto, (a, d, h, m) => {
        const texto = encabezadoDelDia(momentoDelDia(a, d, h, m), a);
        expect(texto === "Hoy").toBe(d === 0);
        expect(texto === "Ayer").toBe(d === 1);
      }),
    );
  });

  it('cualquier otro día lleva la fecha, con el año solo si no es el de ahora; nunca "Mañana"', () => {
    fc.assert(
      fc.property(ahora, diasAntes, hora, minuto, (a, d, h, m) => {
        fc.pre(d !== 0 && d !== 1);
        const dia = momentoDelDia(a, d, h, m);
        const texto = encabezadoDelDia(dia, a);
        expect(texto).toMatch(FECHA);
        expect(
          texto.startsWith(
            `${["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][dia.getDay()]} ${dia.getDate()} de `,
          ),
        ).toBe(true);
        expect(texto.endsWith(` de ${dia.getFullYear()}`)).toBe(
          dia.getFullYear() !== a.getFullYear(),
        );
      }),
    );
  });

  it("todos los momentos del mismo día local tienen el mismo encabezado", () => {
    fc.assert(
      fc.property(
        ahora,
        diasAntes,
        hora,
        minuto,
        hora,
        minuto,
        (a, d, h1, m1, h2, m2) => {
          expect(encabezadoDelDia(momentoDelDia(a, d, h1, m1), a)).toBe(
            encabezadoDelDia(momentoDelDia(a, d, h2, m2), a),
          );
        },
      ),
    );
  });
});
