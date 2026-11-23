import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  confirmReschedule,
  rescheduleEnabled,
  tasksToReschedule,
} from "./block-reschedule";
import { essentialField } from "./essential";
import { applyChange, type TaskDocument } from "./task-document";
import type { TaskResume } from "./minimal-mode";
import { taskStatus } from "./task-status";
import { pendingRows } from "./pending";
import { rescheduleToUndo, visibleNotice, NOTICE_DURATION_MS } from "./notice";
import type { Completion, Task } from "./task";

const HOUR_MS = 3_600_000;
const BASE = new Date(2026, 0, 1).getTime();
const instant = fc
  .integer({ min: 0, max: 400 * 24 })
  .map((hours) => new Date(BASE + hours * HOUR_MS));
const task = fc
  .record({
    recurring: fc.boolean(),
    every: fc.integer({ min: 1, max: 10 }),
    essential: fc.boolean(),
    paused: fc.boolean(),
    createdAt: instant,
    resumedAt: fc.option(instant, { nil: undefined }),
  })
  .map(
    ({ recurring, every, essential, paused, createdAt, resumedAt }): Task => {
      const common = {
        id: "",
        title: "T",
        createdAt,
        ...essentialField(essential),
      };
      return recurring
        ? {
            ...common,
            kind: "periodica",
            recurrence: { mode: "relativo", every, unit: "dias" },
            ...(paused && { paused }),
            ...(resumedAt && { resumedAt }),
          }
        : ({ ...common, kind: "puntual" } as Task);
    },
  );
const tasks = fc
  .array(task, { maxLength: 8 })
  .map((list) => list.map((t, i) => ({ ...t, id: `t${i}` }) as Task));
const completionsOf = (
  list: readonly Task[],
  dates: readonly Date[],
): Completion[] =>
  dates.flatMap((completedAt, i) =>
    list.length
      ? [{ id: `c${i}`, taskId: list[i % list.length].id, completedAt }]
      : [],
  );
const applyResumes = (
  list: readonly Task[],
  resumes: readonly TaskResume[],
): Task[] =>
  resumes.reduce(
    (docs, { taskId, change }) => applyChange(docs, taskId, change),
    list as unknown as TaskDocument[],
  ) as unknown as Task[];
const dates = fc.array(instant, { maxLength: 8 });

describe("block rescheduling: properties (spec §5.11)", () => {
  it("every selected task is a recurring one that is overdue and in view, in the order of Pendientes", () => {
    fc.assert(
      fc.property(
        tasks,
        dates,
        instant,
        fc.boolean(),
        (list, when, now, mode) => {
          const completions = completionsOf(list, when);
          const selected = tasksToReschedule(list, completions, now, mode);
          for (const t of selected) {
            expect(t.kind).toBe("periodica");
            expect(taskStatus(t, completions, now, mode).kind).toBe("atrasada");
          }
          const order = pendingRows(
            list,
            completions,
            now,
            false,
            false,
            mode,
          ).map(({ task: t }) => t.id);
          expect(selected.map(({ id }) => id)).toEqual(
            order.filter((id) => selected.some((t) => t.id === id)),
          );
        },
      ),
    );
  });

  it("the item is enabled exactly when the selection is not empty", () => {
    fc.assert(
      fc.property(
        tasks,
        dates,
        instant,
        fc.boolean(),
        (list, when, now, mode) => {
          const completions = completionsOf(list, when);
          expect(rescheduleEnabled(list, completions, now, mode)).toBe(
            tasksToReschedule(list, completions, now, mode).length > 0,
          );
        },
      ),
    );
  });

  it("after confirming, no rescheduled task is overdue at that moment", () => {
    fc.assert(
      fc.property(
        tasks,
        dates,
        instant,
        fc.boolean(),
        (list, when, now, mode) => {
          const completions = completionsOf(list, when);
          const { changes } = confirmReschedule(list, completions, now, mode);
          const after = applyResumes(list, changes);
          expect(tasksToReschedule(after, completions, now, mode)).toEqual([]);
        },
      ),
    );
  });

  it("confirming writes only resumedAt = now, for the selected tasks; the undo restores the previous value of each one, and it is not offered after 5 s", () => {
    fc.assert(
      fc.property(
        tasks,
        dates,
        instant,
        fc.boolean(),
        (list, when, now, mode) => {
          const completions = completionsOf(list, when);
          const selected = tasksToReschedule(list, completions, now, mode);
          const { changes, notice } = confirmReschedule(
            list,
            completions,
            now,
            mode,
          );
          expect(changes.map(({ taskId }) => taskId)).toEqual(
            selected.map(({ id }) => id),
          );
          for (const { change } of changes)
            expect(change).toEqual({ resumedAt: now });
          expect(notice.undo.map(({ taskId }) => taskId)).toEqual(
            selected.map(({ id }) => id),
          );
          expect(
            applyResumes(applyResumes(list, changes), notice.undo),
          ).toEqual(list);
          expect(rescheduleToUndo(notice, now, list)).toEqual(notice.undo);
          expect(
            visibleNotice(notice, new Date(now.getTime() + NOTICE_DURATION_MS)),
          ).toBeUndefined();
          expect(
            rescheduleToUndo(
              notice,
              new Date(now.getTime() + NOTICE_DURATION_MS),
              list,
            ),
          ).toBeUndefined();
        },
      ),
    );
  });

  it("the undo skips the tasks that no longer exist", () => {
    fc.assert(
      fc.property(
        tasks,
        dates,
        instant,
        fc.integer({ min: 0, max: 7 }),
        (list, when, now, drop) => {
          const completions = completionsOf(list, when);
          const { notice } = confirmReschedule(list, completions, now, false);
          const remaining = list.filter((_, i) => i !== drop);
          const undo = rescheduleToUndo(notice, now, remaining) ?? [];
          expect(
            undo.every(({ taskId }) =>
              remaining.some(({ id }) => id === taskId),
            ),
          ).toBe(true);
          expect(undo.length).toBe(
            notice.undo.filter(({ taskId }) =>
              remaining.some(({ id }) => id === taskId),
            ).length,
          );
        },
      ),
    );
  });

  it("confirming is idempotent at the same moment: the second time there is nothing left to reschedule", () => {
    fc.assert(
      fc.property(tasks, dates, instant, (list, when, now) => {
        const completions = completionsOf(list, when);
        const once = applyResumes(
          list,
          confirmReschedule(list, completions, now, false).changes,
        );
        expect(confirmReschedule(once, completions, now, false).changes).toEqual([]);
      }),
    );
  });
});
