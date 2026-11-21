# QA: show completed and contrast

Verifies, through the interface only:

- the **Mostrar completadas** check: off at the start, it hides the completed tasks; on, it shows them at the end, from the most recently completed to the oldest;
- what counts as completed: the one-off task with a completion and the recurring task waiting with a completion, but not the weekly task waiting before its first occurrence;
- the contrast: non-completed in bold; completed struck through, in normal weight, dimmed and with the checkbox checked;
- tapping the checkbox of a completed task: on a one-off task, or on a recurring task whose most recent completion is from today (or later), it deletes it with no new notice; on a recurring task whose most recent completion is from an earlier day, it completes it again, with a notice;
- that the value of the check is stored on the device, survives a reload and is not synced with another device.

Covers spec §5.1, §5.2–§5.3 (complete again), §5.4 (undo with the checkbox) and §6.1 (Mostrar completadas, Contrast, row checkbox).

Out of scope: the urgency order of the non-completed tasks (`qa/pending-order.md`), the Historial beyond counting entries (`qa/history-undo.md`).

## Environment

As in `qa/history-undo.md`, except for the **Mostrar completadas** check, which each flow handles explicitly:

- Firebase Emulator Suite (Auth + Firestore) with clean data at the start of each flow.
- Each flow starts from a new browser context (with no data stored on the device), unless it says otherwise.
- Simulated browser clock (`page.clock`) installed **before** opening the app, at the local time each flow indicates (zone `America/Argentina/Buenos_Aires`).
  - "At X" means advancing the simulated clock to X before the step.
  - "Advance the clock to X" means advancing it to X and waiting for the screen to update by itself (without reloading), unless the step says "reload".
  - With "stopped clock" (`page.clock.pauseAt`), the clock is advanced with `page.clock.runFor` or `fastForward` to the exact time, so that time does not run while QA acts.
- Session started with the account `qa@example.com` of the Auth Emulator (Flow 1 of `qa/recurring-relative.md`).
- Create a task: tap **+**, type the title, choose the **Se repite** option the step indicates and save, with the controls of `qa/one-off.md` and `qa/recurring-calendar.md`.
- **Two devices** (Flows 5, 6 and 8): two independent browser contexts, A and B, with the same account and the same simulated clock. "B offline" means `browserContext.setOffline(true)` on B; "B gets the connection back", putting it online again and waiting for the two screens to update by themselves.

Reference week: Monday 2026-07-13, Tuesday 14, Wednesday 15, Thursday 16, Friday 17, Saturday 18.

## Observable contract

- **Mostrar completadas check**: a control with role `checkbox` and accessible name "Mostrar completadas", above the Pendientes list. It is different from the row checkboxes (each row's has a name that includes the task title).
  - Checked = on; unchecked = off.
- **List**: "The list is A, B, C" means exactly those rows, from top to bottom. With the check off, a completed task has no row.
- **Non-completed row**: row checkbox unchecked; the title in **bold** (computed `font-weight` ≥ 600) and not struck through (computed `text-decoration-line` without `line-through`).
- **Completed row**: row checkbox checked; the title struck through (computed `text-decoration-line` with `line-through`), in normal weight (computed `font-weight` ≤ 400) and dimmed (effective opacity of the title, the product of the computed opacities of the title and its ancestors, less than 1 and less than that of the title of a `pendiente` row of the same list).
- An `en espera` row also keeps what is in `qa/recurring-relative.md`: dimmed style and progress bar, whether completed or not.
- **Notice**: the one of `qa/history-undo.md` (role `status`, `Completaste «…»`, **Deshacer**, 5 seconds).
- **Historial**: the one of `qa/history-undo.md`; here only its entries are counted.

## Flow 1: off by default, turn on and off

Precondition: empty list, clock at `2026-07-15T08:00:00` (Wednesday).

1. At `08:00`, create `Cambiar foco` with **No se repite** and no due date. At `08:01`, create `Regar plantas` with **Intervalo** every `2` **días**. At `08:02`, create `Sacar la basura` with **Días de la semana** `sábado`.
   - The **Mostrar completadas** check is seen unchecked.
   - The list is **Regar plantas**, **Cambiar foco**, **Sacar la basura**. The three are non-completed: title in bold, checkbox unchecked. **Sacar la basura** is `en espera` (dimmed, with a bar) although it is not completed: its first occurrence has not arrived yet.
2. At `08:05`, tap the **Cambiar foco** checkbox: its row disappears. The list is **Regar plantas**, **Sacar la basura**.
3. At `08:06`, tap the **Regar plantas** checkbox: it becomes `en espera` and, since it is completed, its row disappears. The list is **Sacar la basura**.
4. Tap the **Mostrar completadas** check: it ends up checked.
   - The list is **Sacar la basura**, **Regar plantas**, **Cambiar foco**: first the non-completed one; then the completed ones, from the most recently completed (08:06) to the oldest (08:05).
   - **Regar plantas** and **Cambiar foco** are seen completed: struck through, in normal weight, dimmed and with the checkbox checked. **Regar plantas** still has its bar, at 0.
   - **Sacar la basura** is seen non-completed: in bold and with the checkbox unchecked.
5. Tap the check again: it ends up unchecked and the list is **Sacar la basura**.
6. Tap the check: it ends up checked. Advance the clock to `2026-07-17T08:06:00` (Friday): **Regar plantas** goes back to `pendiente`, stops being completed (in bold, not struck through, checkbox unchecked) and moves up with the non-completed ones.
   - The list is **Regar plantas**, **Sacar la basura**, **Cambiar foco**.
   - The effective opacity of the **Cambiar foco** title is less than that of **Regar plantas**.

## Flow 2: order of the completed ones

Precondition: empty list, clock at `2026-07-15T08:00:00` (Wednesday). Tap the **Mostrar completadas** check (it ends up checked).

1. At `08:00`, create `Pagar la luz` (**No se repite**, no due date). At `08:01`, create `Ventilar` (**Intervalo** every `4` **horas**). At `08:02`, create `Barrer` (**No se repite**, no due date). At `08:03`, create `Lavar ropa` (**No se repite**, no due date).
2. At `09:00`, complete **Barrer**. At `09:30`, complete **Ventilar**. At `10:00`, complete **Pagar la luz**.
   - The list is **Lavar ropa**, **Pagar la luz**, **Ventilar**, **Barrer**: the non-completed one and then the completed ones, from the most recent to the oldest (not by when they were created).
   - **Lavar ropa** in bold; the other three struck through, with the checkbox checked.
3. Advance the clock to `2026-07-15T13:30:00`: **Ventilar** goes back to `pendiente` and stops being completed.
   - The list is **Ventilar**, **Lavar ropa**, **Pagar la luz**, **Barrer**.
4. Reload: the check is still checked and the list is the same.

## Flow 3: tap the checkbox of a completed task

Precondition: empty list, clock stopped at `2026-07-15T08:00:00` (Wednesday). Tap the **Mostrar completadas** check (it ends up checked).

1. Create `Pagar la luz` with **No se repite** and Fecha límite `2026-07-15`, and `Regar` with **Intervalo** every `4` **horas**. The list is **Pagar la luz**, **Regar**.
2. At `08:00:00`, tap the **Pagar la luz** checkbox: the notice `Completaste «Pagar la luz»` appears and the row moves to the end, completed. The list is **Regar**, **Pagar la luz**.
3. At `08:00:10` (the notice has already expired), tap the **Pagar la luz** checkbox: it goes back to non-completed, `pendiente`, in bold and with the checkbox unchecked. **No** notice appears. The list is **Pagar la luz**, **Regar**. The Historial says "Todavía no completaste nada".
4. At `08:01:00`, tap the **Regar** checkbox: the notice `Completaste «Regar»` appears; **Regar** is `en espera`, completed, with the bar at 0.
5. At `08:01:02`, with the notice still visible, tap the **Regar** checkbox: it goes back to `pendiente` (never completed), non-completed. No new notice appears; the `Completaste «Regar»` one is still visible.
6. At `08:01:03`, tap **Deshacer** on that notice: the notice closes and nothing changes (its completion no longer exists). **Regar** is still `pendiente` and the Historial says "Todavía no completaste nada".
7. At `08:02:00`, tap the **Regar** checkbox (completed, `en espera`). Advance the clock to `2026-07-15T12:02:00`: **Regar** goes back to `pendiente`, non-completed. Tap its checkbox: completed again, bar at 0. The Historial has two **Regar** entries: `12:02` and `08:02`.
8. At `2026-07-15T12:02:10`, tap the **Regar** checkbox: only the `12:02` completion is deleted. **Regar** is `pendiente` (the `08:02` one expired at `12:02`), non-completed. The Historial has a single entry: **Regar** `08:02`.
9. Advance the clock to `2026-07-16T00:00:00` (Thursday): **Pagar la luz** is `atrasada` (and so is **Regar**, since `16:02` yesterday). Tap the **Pagar la luz** checkbox: completed. Tap it again: it goes back to `atrasada` (shows "Atrasada"), in bold and with the checkbox unchecked.
10. Reload: the list is **Regar**, **Pagar la luz**, both `atrasada` and non-completed.

## Flow 4: the value is stored on the device

Precondition: empty list, clock at `2026-07-15T08:00:00`.

1. Create `Cambiar foco` and `Pagar la luz` with **No se repite** and no due date. Complete **Cambiar foco**: the list is **Pagar la luz**.
2. Tap the **Mostrar completadas** check: the list is **Pagar la luz**, **Cambiar foco** (struck through).
3. Reload: the check is still checked and the list is the same.
4. Close the tab and open the app again in the same context: it goes straight to **Pendientes** with the check checked and the same list.
5. Tap the check: it ends up unchecked. Reload: it is still unchecked and the list is **Pagar la luz**.

## Flow 5: the value is not synced between devices

Precondition: empty list, clock at `2026-07-15T08:00:00` on A and on B.

1. On A, create `Cambiar foco` and `Pagar la luz` with **No se repite** and no due date, and complete **Cambiar foco**. B sees only **Pagar la luz**.
2. On A, tap the **Mostrar completadas** check: on A the list is **Pagar la luz**, **Cambiar foco**. On B the check is still unchecked and the list is still **Pagar la luz**, also after reloading B.
3. On B, tap the check: on B **Cambiar foco** is seen struck through. On A, turn the check off: on A the list is **Pagar la luz**; on B the check is still checked and **Cambiar foco** is still seen.

## Flow 6: two completions from two devices

Tapping the checkbox deletes the most recent completion; if another remains, the one-off task is still completed.

Precondition: empty list, clock at `2026-07-15T08:00:00` on A and on B. On A, tap the **Mostrar completadas** check (it ends up checked).

1. On A, create `Pagar la luz` with **No se repite** and no due date. B sees it.
2. B offline. At `08:00`, complete **Pagar la luz** on A. At `08:05`, complete **Pagar la luz** on B (B did not see A's completion).
3. B gets the connection back. On A, **Pagar la luz** is completed and the Historial has two entries: **Pagar la luz** `08:05` and `08:00`.
4. On A, tap the **Pagar la luz** checkbox: it is still completed (struck through, with the checkbox checked). The Historial has a single entry, **Pagar la luz** `08:00`; on B too.
5. On A, tap the checkbox again: **Pagar la luz** goes back to `pendiente`, non-completed. The Historial of A and that of B say "Todavía no completaste nada".

## Flow 7: recurring task completed yesterday: the checkbox completes it again

Precondition: empty list, clock stopped at `2026-07-15T20:00:00` (Wednesday). Tap the **Mostrar completadas** check (it ends up checked).

1. Create `Regar` with **Intervalo** every `2` **días**. At `20:00:00`, tap its checkbox: the notice `Completaste «Regar»` appears; **Regar** is `en espera`, completed.
2. At `2026-07-15T23:59:59`, tap its checkbox (the completion is from today): it is deleted. **Regar** goes back to `pendiente`, non-completed; no new notice appears. Tap it again: completed, `en espera`, bar at 0. The Historial has one entry: **Regar** `23:59`.
3. At `2026-07-16T00:00:00` (the next day), tap its checkbox: the last completion is from yesterday, so it completes it again. The notice `Completaste «Regar»` appears; it is still completed, bar at 0. The Historial has two entries: **Hoy** `00:00` and **Ayer** `23:59`.
4. At `2026-07-16T00:00:10`, tap its checkbox: the most recent completion (`00:00`) is from today and is deleted; no new notice appears. **Regar** is still `en espera` and completed (the one from yesterday remains). The Historial has one entry: **Ayer** **Regar** `23:59`.

## Flow 8: "future" completion

A completion later than today (clocks out of step) counts as from today or later: the checkbox deletes it.

Precondition: empty list; A's clock at `2026-07-15T12:00:00` (Wednesday) and B's at `2026-07-16T09:00:00` (Thursday, ahead). On A, tap the **Mostrar completadas** check.

1. On A, create `Regar` with **Intervalo** every `2` **días**. On B, complete **Regar**.
2. On A, **Regar** is `en espera`, completed, with the bar at 0.
3. On A, tap the **Regar** checkbox: B's completion is deleted. **Regar** goes back to `pendiente`, non-completed, and the Historial of A and that of B say "Todavía no completaste nada".
