// Spec §5.4: the notice with Undo.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  noticeOnComplete,
  visibleNotice,
  completionToUndo,
  NOTICE_DURATION_MS,
  msUntilDue,
} from "./notice";
import { complete } from "./completions";
import { taskStatus } from "./task-status";
import {
  WEEKDAYS,
  type Completion,
  type Recurrence,
  type Task,
} from "./task";

const HOUR_MS = 3_600_000;
const instant = fc.integer({ min: 0, max: 4_000_000_000_000 });
const simpleTask: Task = {
  id: "t",
  title: "Regar",
  kind: "puntual",
  createdAt: new Date(0),
};
const noticeAt = (ms: number) =>
  noticeOnComplete(simpleTask, {
    id: "c",
    taskId: "t",
    completedAt: new Date(ms),
  });
/** From completedAt until now: around the window and far from it. */
const shift = fc.oneof(
  fc.integer({
    min: -2 * NOTICE_DURATION_MS,
    max: 2 * NOTICE_DURATION_MS,
  }),
  fc.integer({ min: -1e10, max: 1e10 }),
);
const inWindow = (d: number) => d >= 0 && d < NOTICE_DURATION_MS;

describe("notice (properties)", () => {
  it("is visible, and offers to undo its completion, exactly in [completedAt, completedAt + 5 s)", () => {
    fc.assert(
      fc.property(instant, shift, (t, d) => {
        const notice = noticeAt(t);
        const now = new Date(t + d);
        expect(visibleNotice(notice, now)).toBe(
          inWindow(d) ? notice : undefined,
        );
        expect(completionToUndo(notice, now)).toBe(
          inWindow(d) ? notice.completion : undefined,
        );
      }),
    );
  });

  it("without a notice there is nothing to see or undo", () => {
    fc.assert(
      fc.property(instant, (t) => {
        expect(visibleNotice(undefined, new Date(t))).toBeUndefined();
        expect(completionToUndo(undefined, new Date(t))).toBeUndefined();
      }),
    );
  });

  it("while visible, it expires right when msUntilDue stops passing", () => {
    fc.assert(
      fc.property(
        instant,
        fc.integer({ min: 0, max: NOTICE_DURATION_MS - 1 }),
        (t, d) => {
          const notice = noticeAt(t);
          const missing = msUntilDue(notice, new Date(t + d));
          expect(missing).toBeGreaterThan(0);
          expect(missing).toBeLessThanOrEqual(NOTICE_DURATION_MS);
          expect(visibleNotice(notice, new Date(t + d + missing - 1))).toBe(notice);
          expect(visibleNotice(notice, new Date(t + d + missing))).toBeUndefined();
        },
      ),
    );
  });

  it("names the task and the completion on completing; a new one replaces the previous one", () => {
    fc.assert(
      fc.property(
        instant,
        fc.integer({ min: 0, max: 10 * NOTICE_DURATION_MS }),
        shift,
        (t, between, d) => {
          const firstOne = noticeAt(t);
          const otherTask: Task = { ...simpleTask, id: "u", title: "Pagar" };
          const newValue: Completion = {
            id: "d",
            taskId: "u",
            completedAt: new Date(t + between),
          };
          const secondOne = noticeOnComplete(otherTask, newValue);
          expect(secondOne).toEqual({ name: "Pagar", completion: newValue });
          const undoneItem = completionToUndo(
            secondOne,
            new Date(t + between + d),
          );
          expect(undoneItem).not.toBe(firstOne.completion);
          expect(undoneItem).toBe(inWindow(d) ? newValue : undefined);
        },
      ),
    );
  });
});

// Tasks of the three kinds, with a history built with `complete` in order.
const MONTH_DAYS_ARBITRARY = fc
  .uniqueArray(fc.integer({ min: 1, max: 31 }), { minLength: 1, maxLength: 6 })
  .map((d) => d.sort((a, b) => a - b));
const recurrence: fc.Arbitrary<Recurrence> = fc.oneof(
  fc
    .record({
      every: fc.integer({ min: 1, max: 500 }),
      unit: fc.constantFrom("horas" as const, "dias" as const),
    })
    .map((r) => ({ mode: "relativo" as const, ...r })),
  fc
    .subarray([...WEEKDAYS], { minLength: 1 })
    .map((d) => ({ mode: "calendario" as const, weekdays: d })),
  MONTH_DAYS_ARBITRARY.map((d) => ({ mode: "calendario" as const, monthDays: d })),
);
const createdAt = fc
  .tuple(fc.integer({ min: 0, max: 20_000 }), fc.integer({ min: 0, max: 23 }))
  .map(([day, hour]) => new Date(1990, 0, 1 + day, hour));
const task: fc.Arbitrary<Task> = fc.oneof(
  fc
    .tuple(recurrence, createdAt)
    .map(([r, c]): Task => ({
      id: "t",
      title: "T",
      kind: "periodica",
      recurrence: r,
      createdAt: c,
    })),
  fc
    .tuple(
      createdAt,
      fc.option(fc.integer({ min: 0, max: 400 }), { nil: undefined }),
    )
    .map(([c, days]): Task => ({
      id: "t",
      title: "T",
      kind: "puntual",
      createdAt: c,
      ...(days !== undefined && {
        dueDate: new Date(
          c.getFullYear(),
          c.getMonth(),
          c.getDate() + days,
        ),
      }),
    })),
);
const scenario = fc.record({
  task,
  /** Hours since createdAt of the previous completions (in order) and of the last one. */
  hours: fc
    .array(fc.integer({ min: 0, max: 2_000 }), { maxLength: 8 })
    .map((hs) => hs.sort((a, b) => a - b)),
  afterLast: fc.integer({ min: 0, max: 500 }),
  undoAfter: fc.integer({ min: 0, max: NOTICE_DURATION_MS - 1 }),
  queryAfter: fc.integer({ min: 0, max: 3_000 }),
});

describe("undoing the last completion (properties)", () => {
  it("deletes only that completion: the status and the next completion stay as if it had not been completed", () => {
    fc.assert(
      fc.property(
        scenario,
        ({ task: t, hours, afterLast, undoAfter, queryAfter }) => {
          const at = (h: number) =>
            new Date(t.createdAt.getTime() + h * HOUR_MS);
          const priorCount = hours.reduce<Completion[]>(
            (cs, h) => [...cs, complete(t, cs, `c${cs.length}`, at(h))],
            [],
          );
          const moment = (hours.at(-1) ?? 0) + afterLast;
          const last = complete(t, priorCount, "ultimo", at(moment));
          const notice = noticeOnComplete(t, last);

          const undoneItem = completionToUndo(
            notice,
            new Date(at(moment).getTime() + undoAfter),
          );
          expect(undoneItem).toBe(last);
          const remain = [...priorCount, last].filter(
            ({ id }) => id !== undoneItem?.id,
          );
          expect(remain).toEqual(priorCount);

          const query = at(moment + queryAfter);
          expect(taskStatus(t, remain, query)).toEqual(
            taskStatus(t, priorCount, query),
          );
          expect(complete(t, remain, "otra", query)).toEqual(
            complete(t, priorCount, "otra", query),
          );
        },
      ),
    );
  });
});
