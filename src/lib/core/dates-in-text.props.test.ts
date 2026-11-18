// Spec §6.3: day headers and hours of the Historial.
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

/** A moment `daysBefore` days from the local day of `now`, at the given hour and minute. */
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

describe("timeInText (properties)", () => {
  it("gives 24 h HH:MM with the local hour and minute, for any instant", () => {
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

describe("dayHeader (properties)", () => {
  const now = fc
    .integer({ min: 0, max: 4_000_000_000_000 })
    .map((ms) => new Date(ms));
  const daysBefore = fc.integer({ min: -800, max: 800 });
  const hour = fc.integer({ min: 0, max: 23 });
  const minute = fc.integer({ min: 0, max: 59 });

  it('"Hoy" exactly for the day of now and "Ayer" exactly for the previous one', () => {
    fc.assert(
      fc.property(now, daysBefore, hour, minute, (a, d, h, m) => {
        const text = dayHeader(momentOfDay(a, d, h, m), a);
        expect(text === "Hoy").toBe(d === 0);
        expect(text === "Ayer").toBe(d === 1);
      }),
    );
  });

  it('any other day carries the date, with the year only if it is not the one of now; never "Mañana"', () => {
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

  it("all the moments of the same local day have the same header", () => {
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
