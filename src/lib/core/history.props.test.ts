// Spec §6.3 (Historial).
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { dayHeader, timeInText } from "./dates-in-text";
import { history, type HistoryEntry } from "./history";
import type { Completion, Task } from "./task";

const IDS = ["t1", "t2", "t3", "t4"];
const tasks = fc
  .subarray(IDS)
  .map((ids) =>
    ids.map((id): Task => ({
      id,
      title: id,
      kind: "puntual",
      createdAt: new Date(0),
    })),
  );
/** Pocos instantes posibles, para que haya empates de completadoEn y varios en el mismo día. */
const DAY_MS = 86_400_000;
const moment = fc.oneof(
  fc
    .integer({ min: 0, max: 20 })
    .map((i) => 1_700_000_000_000 + i * 3 * 3_600_000),
  fc.integer({ min: 0, max: 4_000_000_000_000 }),
);
const completions = fc
  .uniqueArray(
    fc.record({
      id: fc.string({ minLength: 1, maxLength: 4 }),
      taskId: fc.constantFrom(...IDS),
      ms: moment,
    }),
    {
      maxLength: 20,
      selector: ({ id }) => id,
    },
  )
  .map((cs) =>
    cs.map(({ id, taskId, ms }): Completion => ({
      id,
      taskId,
      completedAt: new Date(ms),
    })),
  );
const now = fc.oneof(
  fc
    .integer({ min: 0, max: 22 })
    .map((i) => new Date(1_700_000_000_000 + (i * DAY_MS) / 4)),
  fc.integer({ min: 0, max: 4_000_000_000_000 }).map((ms) => new Date(ms)),
);

const entries = (
  groups: ReturnType<typeof history>,
): HistoryEntry[] => groups.flatMap((g) => g.entries);
const exists = (ts: readonly Task[], c: Completion) =>
  ts.some(({ id }) => id === c.taskId);

describe("historial (propiedades)", () => {
  it("muestra cada completado de una tarea que existe exactamente una vez, con su tarea, y ningún otro", () => {
    fc.assert(
      fc.property(tasks, completions, now, (ts, cs, a) => {
        const shown = entries(history(ts, cs, a));
        const expectedItems = cs.filter((c) => exists(ts, c));
        expect(shown.map((e) => e.completion.id).sort()).toEqual(
          expectedItems.map((c) => c.id).sort(),
        );
        for (const { completion, task } of shown)
          expect(task.id).toBe(completion.taskId);
      }),
    );
  });

  it("va estrictamente del más reciente al más antiguo; si empatan, primero el id menor", () => {
    fc.assert(
      fc.property(tasks, completions, now, (ts, cs, a) => {
        const shown = entries(history(ts, cs, a)).map(
          (e) => e.completion,
        );
        for (let i = 1; i < shown.length; i++) {
          const [before, after] = [shown[i - 1], shown[i]];
          const difference =
            before.completedAt.getTime() - after.completedAt.getTime();
          expect(
            difference > 0 || (difference === 0 && before.id < after.id),
          ).toBe(true);
        }
      }),
    );
  });

  it("no depende del orden en que llegan las tareas ni los completados", () => {
    fc.assert(
      fc.property(
        tasks,
        completions,
        now,
        fc.nat(),
        fc.nat(),
        (ts, cs, a, s1, s2) => {
          const rotate = <T>(xs: readonly T[], n: number) =>
            xs.map((_, i) => xs[(i + n) % xs.length]);
          const shuffled = rotate([...cs].reverse(), s1);
          expect(history(rotate(ts, s2), shuffled, a)).toEqual(
            history(ts, cs, a),
          );
        },
      ),
    );
  });

  it("cada entrada cae bajo el encabezado de su día, con su hora; no hay grupos vacíos ni encabezados repetidos", () => {
    fc.assert(
      fc.property(tasks, completions, now, (ts, cs, a) => {
        const groups = history(ts, cs, a);
        for (const { header, entries: ofGroup } of groups) {
          expect(ofGroup.length).toBeGreaterThan(0);
          for (const { completion, hour } of ofGroup) {
            expect(dayHeader(completion.completedAt, a)).toBe(
              header,
            );
            expect(hour).toBe(timeInText(completion.completedAt));
          }
        }
        const headers = groups.map((g) => g.header);
        expect(new Set(headers).size).toBe(headers.length);
      }),
    );
  });
});
