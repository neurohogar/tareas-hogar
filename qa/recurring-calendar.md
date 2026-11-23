# QA: recurring task in calendar mode (feature 2)

Verifies, through the interface only, creating calendar recurring tasks (weekly and
monthly), the validation of the panel and the cycle of statuses with the simulated clock:
waiting until the first occurrence, pending on the day it is due, overdue on the
next day, completing covers the occurrence and goes back to waiting until the
next one. Covers spec §4.2 (Semanal, Mensual), §4.4, §5.3, §6.1 (subset),
§6.2 (subset) and §7.

Out of scope: order between tasks, editing the recurrence, history,
undo, emoji, note and deletion.

## Environment

Same as `qa/recurring-relative.md`:

- Firebase Emulator Suite (Auth + Firestore) with clean data at the start of
  each flow.
- Simulated browser clock (`page.clock`) installed **before** opening the
  app, at the local time each flow gives (zone
  `America/Argentina/Buenos_Aires`). "Advance the clock to X" means
  advancing the simulated clock to X and waiting for the screen to update
  by itself (without reloading), unless the step says "reload".
- Signed in with the Auth Emulator account `qa@example.com` (Flow 1 of
  `qa/recurring-relative.md`).
- At the start of each flow, tap the **Completadas** item of the **⋮** menu to
  turn it on: a waiting recurring task with completions is completed and only
  has a row with the item on (`qa/show-completed.md`).

Reference week: Monday 2026-07-13, Tuesday 14, Wednesday 15, Thursday 16,
Friday 17, Saturday 18, Sunday 19, Monday 20, Tuesday 21.

**Switches.** **Mostrar completadas** and **Mostrar pausadas** are the items **Completadas** and **Pausadas** of the **⋮** menu (`qa/menu-toggles.md`), not checks above the list: to turn one on or off, open the **Menú** and tap the item (the menu closes). A completed one-off task never has a row in **Pendientes**, with **Completadas** on or off: it is reached from the **Historial**.

## Observable contract of the Pendientes row

The same as `qa/recurring-relative.md` (checkbox, title, "Atrasada",
dimmed + bar when waiting). A waiting calendar task without completions (before
its first occurrence) is not completed: checkbox unchecked and bold title;
with completions, it is completed: checkbox checked and struck-through title. The bar is (now − start of wait) /
(start of the next occurrence − start of wait) × 100, rounded to an
integer; the start of wait is the last completion or, if there is none, the moment
of creation.

## Observable contract of the panel

Tapping **+** opens the panel with:

- **Título**.
- **Se repite** group with four mutually exclusive options (radio): **No se
  repite** (one-off task, feature 3; see `qa/one-off.md`), **Intervalo**
  (relative mode of feature 1, with the numeric field
  **Cada** and the unit), **Días de la semana** and **Días del mes**. The radio and
  the numeric field have distinct accessible names. When creating,
  **No se repite** comes selected.
- With **Días de la semana**: seven selection buttons with accessible name
  `lunes`, `martes`, `miércoles`, `jueves`, `viernes`, `sábado`, `domingo`
  (`aria-pressed` reflects whether it is selected). Several can be selected.
- With **Días del mes**: 31 selection buttons with accessible name `1` to
  `31` (`aria-pressed`), and no other. Several can be selected.
- Only the controls of the option selected in **Se repite** are visible.
- **Cerrar** and **Guardar** buttons.

## Flow 1: create a weekly and a monthly task

Precondition: empty list, clock at `2026-07-13T08:00:00` (Monday).

1. Tap **+**, type title `Sacar la basura`, choose **Días de la
   semana**, tap `martes` and `jueves` (they get `aria-pressed=true`) and
   save.
   - The panel closes.
   - The row **Sacar la basura** appears waiting: dimmed, bar at 0,
     no overdue indicator.
2. Tap **+**, type `Pagar expensas`, choose **Días del mes**, tap `10`
   and save: the row **Pagar expensas** appears waiting, bar at 0.
3. Tap **+**, type `Regar plantas`, choose **Días de la semana**, tap
   `lunes` and save: the row **Regar plantas** appears pending (created on
   an occurrence day): not dimmed, no bar, no overdue indicator.
4. Reload the page: the three rows are still there with the same statuses
   (persistence in Firestore).

## Flow 2: panel validation

Precondition: empty list, clock at `2026-07-13T08:00:00`.

1. Tap **+**, leave the title empty, choose **Días de la semana**, tap
   `martes` and save.
   - An error message associated with the Título field is shown.
   - The panel stays open; no row appears.
2. Type title `   ` (only spaces) and save: same result as
   step 1.
3. Type title `Sacar la basura`, untap `martes` (no day selected)
   and save.
   - An error message associated with the days group is shown.
   - No row appears.
4. Choose **Días del mes** without tapping any day and save: same result as
   step 3.
5. Verify that the **Días del mes** grid offers exactly the days `1`
   to `31`.
6. Close the panel without saving (and **Descartar** in the notice "Tenés cambios sin guardar"): the list is still empty.
7. Weekly and monthly are not combined: tap **+**, type `Combinada`, choose
   **Días de la semana**, tap `martes`; switch to **Días del mes**, tap
   `15` and save.
   - A single row **Combinada** appears, waiting.
8. Advance the clock to `2026-07-14T00:00:00` (Tuesday): **Combinada** is still
   waiting (Tuesday was not saved).
9. Advance the clock to `2026-07-15T00:00:00`: **Combinada** becomes
   pending (day 15).

## Flow 3: status cycle of a weekly task

Precondition: empty list, clock at `2026-07-13T08:00:00` (Monday).

1. Create `Sacar la basura` on `martes` and `jueves`: waiting, bar at 0
   (the first occurrence is Tuesday 14 at 00:00).
2. Advance the clock to `2026-07-13T16:00:00`: still waiting, bar at 50.
3. Advance the clock to `2026-07-13T23:00:00`: still waiting, bar at 94.
4. Advance the clock to `2026-07-14T00:00:00` (Tuesday): it becomes pending.
5. Advance the clock to `2026-07-14T23:59:59`: still pending.
6. Advance the clock to `2026-07-15T00:00:00` (Wednesday): it becomes overdue:
   it shows "Atrasada", not dimmed, no bar.
7. Reload the page: it is still overdue.
8. Advance the clock to `2026-07-15T08:00:00` and tap the checkbox (it covers
   Tuesday): it becomes waiting, bar at 0, no overdue indicator.
9. Advance the clock to `2026-07-15T16:00:00`: waiting, bar at 50.
10. Advance the clock to `2026-07-16T00:00:00` (Thursday): pending.
11. Advance the clock to `2026-07-16T12:00:00` and tap the checkbox (it covers
    Thursday): waiting, bar at 0.
12. Advance the clock to `2026-07-18T18:00:00`: waiting, bar at 50.
13. Advance the clock to `2026-07-21T00:00:00` (next Tuesday): pending.

## Flow 4: complete early and missed occurrences

Precondition: empty list, clock at `2026-07-13T08:00:00` (Monday).

1. Create `Sacar la basura` on `martes` and `jueves`: waiting.
2. Tap the checkbox on Monday (early, it covers Tuesday): it is still
   waiting, bar at 0 (it now waits until Thursday 16 at 00:00).
3. Advance the clock to `2026-07-14T00:00:00` (Tuesday): still waiting,
   bar at 25 (Tuesday is already covered).
4. Advance the clock to `2026-07-14T16:00:00`: waiting, bar at 50.
5. Advance the clock to `2026-07-16T00:00:00` (Thursday): pending.
6. Advance the clock to `2026-07-17T10:00:00` (Friday, Thursday was missed):
   overdue, with a single "Atrasada" indicator and a single row.
7. Tap the checkbox (it covers Thursday; nothing is left overdue): waiting,
   bar at 0, no overdue indicator.
8. Advance the clock to `2026-07-19T05:00:00`: waiting, bar at 50.
9. Advance the clock to `2026-07-21T00:00:00` (Tuesday): pending.

## Flow 5: monthly with day 31 in a 30-day month

Precondition: empty list, clock at `2026-06-20T00:00:00`.

1. Create `Revisar filtro` with **Días del mes** `31`: waiting, bar at 0
   (June has 30 days: the occurrence is June 30).
2. Advance the clock to `2026-06-25T00:00:00`: waiting, bar at 50.
3. Advance the clock to `2026-06-30T00:00:00`: pending.
4. Advance the clock to `2026-07-01T00:00:00`: overdue.
5. Advance the clock to `2026-07-01T08:00:00` and tap the checkbox (it covers
   June 30): waiting, bar at 0.
6. Advance the clock to `2026-07-15T04:00:00`: waiting, bar at 47
   (332 h of 712 h: from 2026-07-01T08:00 to 2026-07-31T00:00).
7. Advance the clock to `2026-07-31T00:00:00`: pending.

## Flow 6: the checkbox of a waiting task deletes today's completion

With a completion, a waiting calendar task is completed: if that
completion is from today, tapping its checkbox deletes it (spec §6.1) instead of
covering another occurrence. If it is from an earlier day, it completes it again
(Flow 9).

Precondition: empty list, clock at `2026-07-13T08:00:00` (Monday).

1. Create `Sacar la basura` on `martes` and `jueves`: waiting, not
   completed (checkbox unchecked), bar at 0.
2. Tap the checkbox (early, it covers Tuesday): waiting,
   completed (checkbox checked), bar at 0 (it now waits until Thursday 16
   at 00:00).
3. Advance the clock to `2026-07-13T12:00:00` and tap the checkbox again: the
   completion is deleted. It waits for Tuesday again without completions:
   waiting, not completed, bar at 25 (4 of the 16 hours from creation
   until Tuesday at 00:00).
4. Tap the checkbox: completed again, it covers Tuesday, bar at 0.
5. Advance the clock to `2026-07-16T00:00:00` (Thursday): pending, not
   completed (Tuesday is covered).

## Flow 7: persistence between sessions

Precondition: Flow 4 up to step 4 (waiting row, bar at 50, with
Tuesday covered by Monday's completion).

1. Close the tab and open the app again with the same clock.
2. It goes straight to **Pendientes** (no login) and **Sacar la basura** is still
   waiting with the bar at 50 (the covered occurrence was saved).
3. Advance the clock to `2026-07-16T00:00:00`: pending.

## Flow 8: clocks out of sync (completion "from the future")

Simulates a completion recorded by a device with the clock ahead,
as in Flow 6 of `qa/recurring-relative.md`: "move the clock back to X"
means setting the simulated clock to X (`page.clock.setSystemTime`) and waiting
for the screen to update by itself. Covers the rule of spec §5.3 on a
start of wait later than now.

Precondition: empty list, clock at `2026-07-13T08:00:00` (Monday).

1. Create `Sacar la basura` on `martes` and `jueves`: waiting.
2. Advance the clock to `2026-07-15T20:00:00` (Wednesday): overdue. Tap the
   checkbox (it covers Tuesday): waiting, bar at 0.
3. Move the clock back to `2026-07-15T10:00:00` (ten hours before the
   completion): still waiting, bar at 0, no overdue indicator.
4. Reload the page: still waiting, bar at 0.
5. Advance the clock to `2026-07-15T20:00:00` (the moment of the completion):
   waiting, bar at 0.
6. Advance the clock to `2026-07-15T22:00:00`: waiting, bar at 50 (2 of
   the 4 hours until Thursday).
7. Advance the clock to `2026-07-16T00:00:00` (Thursday): pending.

## Flow 9: complete twice early, on different days

If the most recent completion is from an earlier day, tapping the checkbox of the
waiting calendar task completes it again and covers the next occurrence
(spec §5.3, §6.1).

Precondition: empty list, clock at `2026-07-13T08:00:00` (Monday).

1. Create `Sacar la basura` on `martes` and `jueves` and tap the checkbox (early,
   it covers Tuesday): waiting, completed, bar at 0 (it waits
   until Thursday 16 at 00:00).
2. Advance the clock to `2026-07-14T16:00:00` (Tuesday, already covered): still
   waiting, bar at 50 (32 of 64 hours).
3. Tap the checkbox (the last completion is from yesterday; it covers Thursday):
   the notice `Completaste «Sacar la basura»` appears. Still waiting,
   completed, bar at 0 (it now waits until Tuesday 21 at 00:00).
4. Advance the clock to `2026-07-16T00:00:00` (Thursday): still waiting,
   bar at 21 (32 of 152 hours: Thursday is already covered).
5. Advance the clock to `2026-07-21T00:00:00` (next Tuesday): pending.
