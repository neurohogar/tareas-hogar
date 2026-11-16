// Spec §6.3: encabezados de día y horas del Historial.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { dayHeader, timeInText } from "./dates-in-text";

const instant = fc
  .integer({ min: -2_000_000_000_000, max: 8_000_000_000_000 })
  .map((ms) => new Date(ms));
const DAYS = "(lunes|martes|miércoles|jueves|viernes|sábado|domingo)";
const MONTHS =
  "(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)";
const DATE_RE = new RegExp(
  `^${DAYS} ([1-9]|[12]\\d|3[01]) de ${MONTHS}( de -?\\d+)?$`,
);

/** Un momento a `diasAntes` días del día local de `ahora`, a la hora y minuto dados. */
function momentOfDay(
  now: Date,
  daysBefore: number,
  hour: number,
  minute: number,
): Date {
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - daysBefore,
    hour,
    minute,
  );
}

describe("horaEnTexto (propiedades)", () => {
  it("da HH:MM de 24 h con la hora y el minuto locales, para cualquier instante", () => {
    fc.assert(
      fc.property(instant, (moment) => {
        const text = timeInText(moment);
        expect(text).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
        const [hour, minute] = text.split(":").map(Number);
        expect([hour, minute]).toEqual([
          moment.getHours(),
          moment.getMinutes(),
        ]);
      }),
    );
  });
});

describe("encabezadoDelDia (propiedades)", () => {
  const now = fc
    .integer({ min: 0, max: 4_000_000_000_000 })
    .map((ms) => new Date(ms));
  const daysBefore = fc.integer({ min: -800, max: 800 });
  const hour = fc.integer({ min: 0, max: 23 });
  const minute = fc.integer({ min: 0, max: 59 });

  it('"Hoy" exactamente para el día de ahora y "Ayer" exactamente para el anterior', () => {
    fc.assert(
      fc.property(now, daysBefore, hour, minute, (a, d, h, m) => {
        const text = dayHeader(momentOfDay(a, d, h, m), a);
        expect(text === "Hoy").toBe(d === 0);
        expect(text === "Ayer").toBe(d === 1);
      }),
    );
  });

  it('cualquier otro día lleva la fecha, con el año solo si no es el de ahora; nunca "Mañana"', () => {
    fc.assert(
      fc.property(now, daysBefore, hour, minute, (a, d, h, m) => {
        fc.pre(d !== 0 && d !== 1);
        const day = momentOfDay(a, d, h, m);
        const text = dayHeader(day, a);
        expect(text).toMatch(DATE_RE);
        expect(
          text.startsWith(
            `${["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][day.getDay()]} ${day.getDate()} de `,
          ),
        ).toBe(true);
        expect(text.endsWith(` de ${day.getFullYear()}`)).toBe(
          day.getFullYear() !== a.getFullYear(),
        );
      }),
    );
  });

  it("todos los momentos del mismo día local tienen el mismo encabezado", () => {
    fc.assert(
      fc.property(
        now,
        daysBefore,
        hour,
        minute,
        hour,
        minute,
        (a, d, h1, m1, h2, m2) => {
          expect(dayHeader(momentOfDay(a, d, h1, m1), a)).toBe(
            dayHeader(momentOfDay(a, d, h2, m2), a),
          );
        },
      ),
    );
  });
});
