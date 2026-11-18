// Spec §6.2: "Última vez" of the edit panel.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { daysBetween } from "./days";
import { dayHeader, timeInText } from "./dates-in-text";
import type { Completion } from "./task";
import { lastTime } from "./last-time";

const instant = fc
  .integer({ min: 0, max: 4_000_000_000_000 })
  .map((ms) => new Date(ms));
/** Completions of task t1 or of another, around now (± ~3 years). */
const completions = (now: Date) =>
  fc
    .array(
      fc.record({
        taskId: fc.constantFrom("t1", "t2"),
        delta: fc.integer({ min: -100_000_000_000, max: 5_000_000_000 }),
      }),
      { maxLength: 8 },
    )
    .map((xs): Completion[] =>
      xs.map(({ taskId, delta }, i) => ({
        id: `c${i}`,
        taskId,
        completedAt: new Date(now.getTime() + delta),
      })),
    );

const withNow = instant.chain((now) =>
  fc.tuple(fc.constant(now), completions(now)),
);

describe("lastTime (properties)", () => {
  it('without completions of the task it is "nunca", regardless of those of other tasks', () => {
    fc.assert(
      fc.property(withNow, ([now, cs]) => {
        const foreigns = cs.filter((c) => c.taskId !== "t1");
        expect(lastTime("t1", foreigns, now)).toBe("nunca");
      }),
    );
  });

  it("depends only on the most recent completion of the task, not on the order or the others'", () => {
    fc.assert(
      fc.property(withNow, ([now, cs]) => {
        const owns = cs.filter((c) => c.taskId === "t1");
        fc.pre(owns.length > 0);
        const last = owns.reduce((a, b) =>
          b.completedAt.getTime() > a.completedAt.getTime() ? b : a,
        );
        const text = lastTime("t1", cs, now);
        expect(lastTime("t1", [...cs].reverse(), now)).toBe(text);
        expect(lastTime("t1", [last], now)).toBe(text);
      }),
    );
  });

  it('today and yesterday with the time, "hace N días" from two, and the date with the time if it is after today', () => {
    fc.assert(
      fc.property(
        instant,
        fc.integer({ min: -5_000_000_000, max: 100_000_000_000 }),
        (now, back) => {
          const moment = new Date(now.getTime() - back);
          const text = lastTime(
            "t1",
            [{ id: "c1", taskId: "t1", completedAt: moment }],
            now,
          );
          const days = daysBetween(moment, now);
          const hour = timeInText(moment);
          if (days >= 2) expect(text).toBe(`hace ${days} días`);
          else if (days === 1) expect(text).toBe(`ayer ${hour}`);
          else if (days === 0) expect(text).toBe(`hoy ${hour}`);
          else
            expect(text).toBe(`${dayHeader(moment, now)} ${hour}`);
        },
      ),
    );
  });
});
