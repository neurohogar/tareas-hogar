# QA: show completed and contrast

Verifies, through the interface only:

- the **Completadas** item of the **⋮** menu (**Mostrar completadas**): off at the start, it hides the completed recurring tasks; on, it shows them at the end, from the most recently completed to the oldest. Where the item is, its check mark and the saving on the device are in `qa/menu-toggles.md`; here only its effect on the list;
- what counts as completed: the one-off task with a completion and the recurring task waiting with a completion, but not the weekly task waiting before its first occurrence; a completed one-off task never has a row in **Pendientes**, with the item on or off;
- the contrast: non-completed in bold; completed struck through, in normal weight, dimmed and with the checkbox checked;
- tapping the checkbox of a completed recurring task: if its most recent completion is from today (or later), it deletes it with no new notice; if it is from an earlier day, it completes it again, with a notice;
- that a completed one-off task is reached only from the **Historial** once its notice closes;
- that the value of the item is stored on the device, survives a reload and is not synced with another device.

Covers spec §5.1, §5.2–§5.3 (complete again), §5.4 (undo with the checkbox) and §6.1 (Mostrar completadas, Contrast, row checkbox).

Out of scope: the urgency order of the non-completed tasks (`qa/pending-order.md`), the Historial beyond counting entries (`qa/history-undo.md`).

## Environment

As in `qa/history-undo.md`, except for the **Completadas** item of the **⋮** menu, which each flow handles explicitly (open the **Menú**, tap the item; the menu closes):

- Firebase Emulator Suite (Auth + Firestore) with clean data at the start of each flow.
- Each flow starts from a new browser context (with no data stored on the device), unless it says otherwise.
- Simulated browser clock (`page.clock`) installed **before** opening the app, at the local time each flow indicates (zone `America/Argentina/Buenos_Aires`).
  - "At X" means advancing the simulated clock to X before the step.
  - "Advance the clock to X" means advancing it to X and waiting for the screen to update by itself (without reloading), unless the step says "reload".
  - With "stopped clock" (`page.clock.pauseAt`), the clock is advanced with `page.clock.runFor` or `fastForward` to the exact time, so that time does not run while QA acts.
- Session started with the account `qa@example.com` of the Auth Emulator (Flow 1 of `qa/recurring-relative.md`).
- Create a task: tap **+**, type the title, choose the **Se repite** option the step indicates and save, with the controls of `qa/one-off.md` and `qa/recurring-calendar.md`.
- **Two devices** (Flows 6, 7 and 9): two independent browser contexts, A and B, with the same account and the same simulated clock. "B offline" means `browserContext.setOffline(true)` on B; "B gets the connection back", putting it online again and waiting for the two screens to update by themselves.

Reference week: Monday 2026-07-13, Tuesday 14, Wednesday 15, Thursday 16, Friday 17, Saturday 18.

## Observable contract

- **Completadas item**: an element with role `menuitemcheckbox` and accessible name "Completadas" in the menu of the button «Menú». It is different from the row checkboxes (each row's has a name that includes the task title). Nothing outside the menu shows its value.
  - `aria-checked="true"` and check mark = on; `aria-checked="false"` and no mark = off.
- **List**: "The list is A, B, C" means exactly those rows, from top to bottom. With the item off, a completed task has no row; a completed one-off task has no row either way.
- **Non-completed row**: row checkbox unchecked; the title in **bold** (computed `font-weight` ≥ 600) and not struck through (computed `text-decoration-line` without `line-through`).
- **Completed row**: row checkbox checked; the title struck through (computed `text-decoration-line` with `line-through`), in normal weight (computed `font-weight` ≤ 400) and dimmed (effective opacity of the title, the product of the computed opacities of the title and its ancestors, less than 1 and less than that of the title of a `pendiente` row of the same list).
- An `en espera` row also keeps what is in `qa/recurring-relative.md`: dimmed style and progress bar, whether completed or not.
- **Notice**: the one of `qa/history-undo.md` (role `status`, `Completaste «…»`, **Deshacer**, 5 seconds).
- **Historial**: the one of `qa/history-undo.md`; here only its entries are counted.

## Flow 1: off by default, turn on and off

Precondition: empty list, clock at `2026-07-15T08:00:00` (Wednesday).

1. At `08:00`, create `Cambiar foco` with **No se repite** and no due date. At `08:01`, create `Regar plantas` with **Intervalo** every `2` **días**. At `08:02`, create `Sacar la basura` with **Días de la semana** `sábado`.
   - In the menu, **Completadas** has no check mark (`aria-checked="false"`).
   - The list is **Regar plantas**, **Cambiar foco**, **Sacar la basura**. The three are non-completed: title in bold, checkbox unchecked. **Sacar la basura** is `en espera` (dimmed, with a bar) although it is not completed: its first occurrence has not arrived yet.
2. At `08:05`, tap the **Cambiar foco** checkbox: its row disappears. The list is **Regar plantas**, **Sacar la basura**.
3. At `08:06`, tap the **Regar plantas** checkbox: it becomes `en espera` and, since it is completed, its row disappears. The list is **Sacar la basura**.
4. Open the menu and tap **Completadas**: the menu closes.
   - The list is **Sacar la basura**, **Regar plantas**: first the non-completed one; then the completed recurring one. **Cambiar foco**, a completed one-off task, has no row.
   - **Regar plantas** is seen completed: struck through, in normal weight, dimmed and with the checkbox checked, and it still has its bar, at 0.
   - **Sacar la basura** is seen non-completed: in bold and with the checkbox unchecked.
5. Open the menu and tap **Completadas** again: the menu closes and the list is **Sacar la basura**.
6. Turn **Completadas** on again. Advance the clock to `2026-07-17T08:06:00` (Friday): **Regar plantas** goes back to `pendiente`, stops being completed (in bold, not struck through, checkbox unchecked) and moves up with the non-completed ones.
   - The list is **Regar plantas**, **Sacar la basura**.

## Flow 2: order of the completed ones

Precondition: empty list, clock at `2026-07-15T08:00:00` (Wednesday). Turn **Completadas** on.

1. At `08:00`, create `Pagar la luz` (**No se repite**, no due date). At `08:01`, create `Ventilar` (**Intervalo** every `4` **horas**). At `08:02`, create `Barrer` (**Intervalo** every `2` **días**). At `08:03`, create `Lavar ropa` (**No se repite**, no due date).
2. At `09:00`, complete **Barrer**. At `09:30`, complete **Ventilar**. At `10:00`, complete **Pagar la luz**.
   - The list is **Lavar ropa**, **Ventilar**, **Barrer**: the non-completed one and then the completed recurring ones, from the most recent to the oldest (not by when they were created). **Pagar la luz** has no row.
   - **Lavar ropa** in bold; the other two struck through, with the checkbox checked.
3. Advance the clock to `2026-07-15T13:30:00`: **Ventilar** goes back to `pendiente` and stops being completed.
   - The list is **Ventilar**, **Lavar ropa**, **Barrer**.
4. Reload: **Completadas** is still on (check mark in the menu) and the list is the same.

## Flow 3: tap the checkbox of a completed recurring task

Precondition: empty list, clock stopped at `2026-07-15T08:00:00` (Wednesday). Turn **Completadas** on.

1. Create `Regar` with **Intervalo** every `4` **horas**. The list is **Regar**.
2. At `08:01:00`, tap the **Regar** checkbox: the notice `Completaste «Regar»` appears; **Regar** is `en espera`, completed, with the bar at 0.
3. At `08:01:02`, with the notice still visible, tap the **Regar** checkbox: it goes back to `pendiente` (never completed), non-completed. No new notice appears; the `Completaste «Regar»` one is still visible.
4. At `08:01:03`, tap **Deshacer** on that notice: the notice closes and nothing changes (its completion no longer exists). **Regar** is still `pendiente` and the Historial says "Todavía no completaste nada".
5. At `08:02:00`, tap the **Regar** checkbox (completed, `en espera`). Advance the clock to `2026-07-15T12:02:00`: **Regar** goes back to `pendiente`, non-completed. Tap its checkbox: completed again, bar at 0. The Historial has two **Regar** entries: `12:02` and `08:02`.
6. At `2026-07-15T12:02:10`, tap the **Regar** checkbox: only the `12:02` completion is deleted. **Regar** is `pendiente` (the `08:02` one expired at `12:02`), non-completed. The Historial has a single entry: **Regar** `08:02`.

## Flow 4: a completed one-off task has no row

Precondition: empty list, clock stopped at `2026-07-15T08:00:00` (Wednesday). Turn **Completadas** on.

1. Create `Pagar la luz` with **No se repite** and Fecha límite `2026-07-15`, and `Cambiar foco` with **No se repite** and no due date. The list is **Pagar la luz**, **Cambiar foco**.
2. At `08:00:00`, tap the **Pagar la luz** checkbox: the notice `Completaste «Pagar la luz»` appears and its row disappears (it does not move to the end, struck through). The list is **Cambiar foco**.
3. At `08:00:02`, tap **Deshacer**: the notice closes and **Pagar la luz** is back, `pendiente`, in bold and with the checkbox unchecked. The list is **Pagar la luz**, **Cambiar foco**.
4. At `08:00:10`, tap the **Pagar la luz** checkbox again and advance the clock to `08:00:20` (the notice has expired): the list is **Cambiar foco**, with **Completadas** still on, and there is no way to uncheck **Pagar la luz** from the list. The Historial has one entry: **Pagar la luz** `08:00:10`.
5. In the Historial, tap the **Pagar la luz** entry: the **Editar tarea** panel opens. Close it: the user stays on the Historial.
6. Tap **Borrar** on that entry and confirm with **Borrar**: the entry disappears and the Historial says "Todavía no completaste nada". Go to **Pendientes**: **Pagar la luz** is back, `pendiente`, non-completed. The list is **Pagar la luz**, **Cambiar foco**.
7. Complete **Pagar la luz** again and, after its notice expires, turn **Completadas** off and on: the list is **Cambiar foco** each time.

## Flow 5: the value is stored on the device

Precondition: empty list, clock at `2026-07-15T08:00:00`.

1. Create `Cambiar foco` with **No se repite** and no due date, and `Regar` with **Intervalo** every `2` **días**. Complete **Regar**: the list is **Cambiar foco**.
2. Turn **Completadas** on: the list is **Cambiar foco**, **Regar** (struck through).
3. Reload: the item still has its check mark and the list is the same.
4. Close the tab and open the app again in the same context: it goes straight to **Pendientes** with the item checked and the same list.
5. Turn **Completadas** off. Reload: it is still off and the list is **Cambiar foco**.

## Flow 6: the value is not synced between devices

Precondition: empty list, clock at `2026-07-15T08:00:00` on A and on B.

1. On A, create `Cambiar foco` with **No se repite** and no due date and `Regar` with **Intervalo** every `2` **días**, and complete **Regar**. B sees only **Cambiar foco**.
2. On A, turn **Completadas** on: on A the list is **Cambiar foco**, **Regar**. On B the item is still off and the list is still **Cambiar foco**, also after reloading B.
3. On B, turn **Completadas** on: on B **Regar** is seen struck through. On A, turn it off: on A the list is **Cambiar foco**; on B the item is still on and **Regar** is still seen.

## Flow 7: two completions from two devices

Tapping the checkbox deletes the most recent completion; if another remains, the recurring task is still completed.

Precondition: empty list, clock at `2026-07-15T08:00:00` on A and on B. On A, turn **Completadas** on.

1. On A, create `Regar` with **Intervalo** every `2` **días**. B sees it.
2. B offline. At `08:00`, complete **Regar** on A. At `08:05`, complete **Regar** on B (B did not see A's completion).
3. B gets the connection back. On A, **Regar** is completed and the Historial has two entries: **Regar** `08:05` and `08:00`.
4. On A, tap the **Regar** checkbox: it is still completed (struck through, with the checkbox checked). The Historial has a single entry, **Regar** `08:00`; on B too.
5. On A, tap the checkbox again: **Regar** goes back to `pendiente`, non-completed. The Historial of A and that of B say "Todavía no completaste nada".

## Flow 8: recurring task completed yesterday: the checkbox completes it again

Precondition: empty list, clock stopped at `2026-07-15T20:00:00` (Wednesday). Turn **Completadas** on.

1. Create `Regar` with **Intervalo** every `2` **días**. At `20:00:00`, tap its checkbox: the notice `Completaste «Regar»` appears; **Regar** is `en espera`, completed.
2. At `2026-07-15T23:59:59`, tap its checkbox (the completion is from today): it is deleted. **Regar** goes back to `pendiente`, non-completed; no new notice appears. Tap it again: completed, `en espera`, bar at 0. The Historial has one entry: **Regar** `23:59`.
3. At `2026-07-16T00:00:00` (the next day), tap its checkbox: the last completion is from yesterday, so it completes it again. The notice `Completaste «Regar»` appears; it is still completed, bar at 0. The Historial has two entries: **Hoy** `00:00` and **Ayer** `23:59`.
4. At `2026-07-16T00:00:10`, tap its checkbox: the most recent completion (`00:00`) is from today and is deleted; no new notice appears. **Regar** is still `en espera` and completed (the one from yesterday remains). The Historial has one entry: **Ayer** **Regar** `23:59`.

## Flow 9: "future" completion

A completion later than today (clocks out of step) counts as from today or later: the checkbox deletes it.

Precondition: empty list; A's clock at `2026-07-15T12:00:00` (Wednesday) and B's at `2026-07-16T09:00:00` (Thursday, ahead). On A, turn **Completadas** on.

1. On A, create `Regar` with **Intervalo** every `2` **días**. On B, complete **Regar**.
2. On A, **Regar** is `en espera`, completed, with the bar at 0.
3. On A, tap the **Regar** checkbox: B's completion is deleted. **Regar** goes back to `pendiente`, non-completed, and the Historial of A and that of B say "Todavía no completaste nada".
