# QA: postpone a task

Verifies, through the interface only:

- the **Posponer** options of the panel (in **Acciones**, with no intermediate button): they appear only when editing a pending or overdue task that is neither paused nor postponed, and they are **1 hora**, **3 horas** and **Hasta mañana**; choosing one acts immediately (saves and closes the panel without **Guardar**);
- with the task postponed, the panel says "Pospuesta hasta HH:MM" (or "Pospuesta hasta mañana HH:MM") and offers **Quitar posponer**, which also acts immediately;
- that the postponed task looks waiting (dimmed, with the bar towards the end of the postponement), in the waiting group sorted by when it comes back, and that it is visible with **Mostrar completadas** off;
- that it goes back to its state on its own when it expires (overdue right away if its overdue time has arrived), without moving deadlines or due dates;
- that it can be completed while postponed (except outside the schedule) and that completing, undoing or editing do not remove the postponement;
- that a paused task cannot be postponed;
- postponement with two devices, also with clocks out of sync (S12).

Covers spec §4.1 (`pospuesta`), §5.9, §6.1 (order, Mostrar completadas, checkbox), §6.2 (Posponer / Quitar posponer) and §7 (conflicts).

Out of scope: the statuses without postponement (`qa/one-off.md`, `qa/recurring-relative.md`, `qa/recurring-calendar.md`, `qa/schedule.md`), the order of non-postponed tasks (`qa/pending-order.md`) and pausing (`qa/pause.md`).

## Environment

- Firebase Emulator Suite (Auth + Firestore) with clean data at the start of each flow.
- Each flow starts from a new browser context (no data saved on the device), signed in with the Auth Emulator account `qa@example.com` (Flow 1 of `qa/recurring-relative.md`).
- Simulated browser clock (`page.clock`) installed **before** opening the app, at the local time each flow gives (zone `America/Argentina/Buenos_Aires`), with the clock stopped (`page.clock.pauseAt`).
  - "At X" means advancing the simulated clock to X (`page.clock.runFor` or `fastForward`) before the step.
  - "Advance the clock to X" means advancing it to X and waiting for the screen to update by itself (without reloading).
- Create a task: tap **+**, type the title, choose the **Se repite** option the step gives, with the controls of `qa/one-off.md`, `qa/recurring-relative.md` and `qa/recurring-calendar.md`; if the step gives a schedule, enter it as in `qa/schedule.md`; save.
- "Postpone X with option O": tap the row X and choose O among the **Posponer** options (in **Acciones**, in view), without tapping **Guardar**.
- **Mostrar completadas** and **Mostrar pausadas** stay off unless the flow says to turn them on.
- **Two devices** (Flow 7): two independent browser contexts, A and B, with the same account and the same simulated clock. "B offline" means `browserContext.setOffline(true)` on B; "B comes back online" means putting it back online and waiting for both screens to update by themselves.

Reference week: Monday 2026-07-13, Tuesday 14, Wednesday 15, Thursday 16, Friday 17, Saturday 18, Sunday 19.

**Switches.** **Mostrar completadas** and **Mostrar pausadas** are the items **Completadas** and **Pausadas** of the **⋮** menu (`qa/menu-toggles.md`), not checks above the list: to turn one on or off, open the **Menú** and tap the item (the menu closes). A completed one-off task never has a row in **Pendientes**, with **Completadas** on or off: it is reached from the **Historial**.

## Observable contract

- **Posponer options**: in the **Editar tarea** panel, a group with accessible name **Posponer** that shows three buttons with accessible names **1 hora**, **3 horas** and **Hasta mañana** (no intermediate **Posponer** button). Choosing one closes the panel and the change is saved: when the task is opened again, or on reload, it is kept. The **Nueva tarea** panel has no **Posponer**.
- **Postponed in the panel**: the text "Pospuesta hasta HH:MM" (24-hour time, no seconds), with "mañana" before the time if the end of the postponement falls on the day after now; a **Quitar posponer** button and no **Posponer** group. Tapping **Quitar posponer** closes the panel and the change is saved.
- **Not postponed**: the panel has neither the text "Pospuesta" nor the **Quitar posponer** button.
- **Postponed row**: the waiting row of the contract of `qa/recurring-relative.md`, always **not completed**: checkbox unchecked, bold title, dimmed style, progress bar (`aria-valuenow` = percentage of the postponement elapsed, rounded to the integer) and no "Atrasada" indicator.
- **Row**: for non-postponed tasks, the contract of `qa/recurring-relative.md` and that of `qa/show-completed.md`.
- **Disabled checkbox**: `disabled` or `aria-disabled="true"`, and tapping it changes nothing (no notice and no new entry in the Historial).
- **List**: "The list is A, B, C" means exactly those rows, from top to bottom.
- **Notice** and **Historial**: those of `qa/history-undo.md`.

## Flow 1: postpone an overdue task for 1 hour

Precondition: empty list, clock at `2026-07-15T10:00:00` (Wednesday).

1. Create `Cambiar foco` with **No se repite** and no due date, and `Pagar la luz` with **No se repite** and due date `2026-07-14`. Tap **+**: the **Nueva tarea** panel has no **Posponer** options. Close it.
2. The list is **Pagar la luz** (with "Atrasada"), **Cambiar foco**.
3. Tap the **Pagar la luz** row: the panel has the **Posponer** options (**1 hora**, **3 horas** and **Hasta mañana**, in view), has no **Quitar posponer** and no text "Pospuesta". Choose **1 hora**, without tapping **Guardar**: the panel closes.
4. The list is **Cambiar foco**, **Pagar la luz**. **Pagar la luz** looks postponed: dimmed, without "Atrasada", bar at 0, checkbox enabled and unchecked, bold title.
5. Tap the **Pagar la luz** row: the panel says "Pospuesta hasta 11:00", has **Quitar posponer** and does not have the **Posponer** options. Close the panel.
6. Advance the clock to `2026-07-15T10:30:00`: the bar of **Pagar la luz** is at 50.
7. Reload: **Pagar la luz** is still postponed, with the bar at 50.
8. Advance the clock to `2026-07-15T11:00:00`: **Pagar la luz** is overdue (with "Atrasada", without a bar, not dimmed) and the list is **Pagar la luz**, **Cambiar foco**. Tap its row: the panel has the **Posponer** options and does not say "Pospuesta".

## Flow 2: 3 horas and Hasta mañana, past midnight

Precondition: empty list, clock at `2026-07-15T22:00:00` (Wednesday).

1. Create `Cambiar foco`, `Barrer` and `Regar plantas`, all three with **No se repite** and no due date. The list is **Cambiar foco**, **Barrer**, **Regar plantas**.
2. At `2026-07-15T22:30:00`, postpone **Barrer** with the option **Hasta mañana** and **Cambiar foco** with the option **3 horas**.
3. The list is **Regar plantas**, **Cambiar foco**, **Barrer**: the postponed ones waiting, the one that comes back first going first.
4. Tap the **Cambiar foco** row: the panel says "Pospuesta hasta mañana 01:30". Close it. Tap the **Barrer** row: it says "Pospuesta hasta mañana 07:00". Close it.
5. Advance the clock to `2026-07-16T00:00:00`: tap the **Cambiar foco** row: the panel says "Pospuesta hasta 01:30" (now without "mañana"). Close it.
6. Advance the clock to `2026-07-16T01:30:00`: **Cambiar foco** is pending and the list is **Cambiar foco**, **Regar plantas**, **Barrer**.
7. At `2026-07-16T02:00:00`, postpone **Regar plantas** with the option **Hasta mañana**. Tap its row: the panel says "Pospuesta hasta mañana 07:00" (Friday 17, not today). Close it.
8. Advance the clock to `2026-07-16T07:00:00`: **Barrer** is pending and **Regar plantas** is still postponed. The list is **Cambiar foco**, **Barrer**, **Regar plantas**.

## Flow 3: remove the postponement, complete, undo and edit

Precondition: empty list, clock at `2026-07-15T10:00:00` (Wednesday).

1. Create `Pagar la luz` with **No se repite** and due date `2026-07-14`. Postpone it with the option **3 horas**: it is postponed.
2. Tap its row and tap **Quitar posponer**, without tapping **Guardar**: the panel closes and **Pagar la luz** is overdue right away. Tap its row: the panel has the **Posponer** options and does not say "Pospuesta". Close it.
3. At `2026-07-15T10:05:00`, postpone it with the option **3 horas**. At `2026-07-15T10:30:00`, tap its checkbox (it is enabled): the notice `Completaste «Pagar la luz»` appears and the row disappears from the list.
4. Tap **Deshacer** in the notice: **Pagar la luz** is postponed again (dimmed, without "Atrasada"), with the bar at 14. Tap its row: the panel says "Pospuesta hasta 13:05".
5. In the same panel, change the title to `Pagar el gas` and tap **Guardar**. **Pagar el gas** is still postponed; its panel still says "Pospuesta hasta 13:05".
6. Advance the clock to `2026-07-15T13:05:00`: **Pagar el gas** is overdue, with its usual key (overdue since the 15th at 00:00).

## Flow 4: postponed recurring tasks

Precondition: empty list, clock at `2026-07-15T08:00:00` (Wednesday).

1. Create `Regar` and `Barrer`, both with **Intervalo** every `4` **horas**, and complete both: they become waiting, completed, and disappear from the list.
2. Advance the clock to `2026-07-15T12:30:00`: both are pending. Postpone both with the option **3 horas**.
3. The list (with **Mostrar completadas** off) is **Regar**, **Barrer**: they tie on the end of the postponement and the one created first goes first. Both look postponed: not completed, checkbox unchecked, bar at 0.
4. At `2026-07-15T13:00:00`, tap the checkbox of **Regar**: the notice appears and it becomes waiting, completed (it leaves the list). The Historial has two entries of **Regar**, `08:00` and `13:00`.
5. Turn on **Mostrar completadas**. Tap the **Regar** row: the panel still has **Quitar posponer** ("Pospuesta hasta 15:30"). Close it.
6. Advance the clock to `2026-07-15T15:30:00`: **Barrer** is pending. **Regar** is still waiting, completed (it expires at 17:00).
7. Advance the clock to `2026-07-15T16:00:00`: **Barrer** is overdue (the postponement did not move its due time).

## Flow 5: postpone with a schedule

Precondition: empty list, clock at `2026-07-15T07:00:00` (Wednesday).

1. Create `Ventilar` with **No se repite**, no due date and schedule `08:00` to `11:00`. It is waiting until 08:00. Tap its row: the panel does not have the **Posponer** options. Close it.
2. Advance the clock to `2026-07-15T09:00:00`: pending. Postpone it with the option **3 horas**.
3. Advance the clock to `2026-07-15T09:30:00`: it is postponed, with the checkbox enabled.
4. Advance the clock to `2026-07-15T11:30:00`: it is still waiting, with the checkbox disabled (outside the window). Tap it: nothing happens.
5. Advance the clock to `2026-07-15T12:00:00`: it is still waiting because of its schedule (until 08:00 tomorrow); the panel does not say "Pospuesta" and does not have the **Posponer** options.

## Flow 6: pause and postpone

Precondition: empty list, clock at `2026-07-15T10:00:00` (Wednesday).

1. Create `Regar` with **Intervalo** every `2` **días** (pending). Tap its row: the panel has the **Posponer** options and **Pausar**. Tap **Pausar**.
2. Turn on **Mostrar pausadas**. Tap the **Regar** row: the panel says "Pausada", has **Reanudar** and does not have the **Posponer** options. Tap **Reanudar**: pending.
3. Postpone **Regar** with the option **3 horas**. Tap its row: the panel has **Quitar posponer** and **Pausar**. Tap **Pausar**: **Regar** looks paused ("Pausada", without a bar).
4. At `2026-07-15T11:30:00`, resume it: it becomes postponed, with the bar at 50.

## Flow 7: two devices

Precondition: empty list, clock at `2026-07-15T10:00:00` (Wednesday) on A and on B.

1. On A, create `Pagar la luz` with **No se repite** and no due date. B sees it.
2. B offline. On A, postpone **Pagar la luz** with the option **3 horas**. On B (which did not see the postponement), change the title to `Pagar el gas` and save.
3. B comes back online. On A and on B, **Pagar el gas** is postponed and its panel says "Pospuesta hasta 13:00".
4. On A, tap **Quitar posponer**. B sees it pending. B offline. On A, at `2026-07-15T10:10:00`, postpone it with the option **3 horas**. On B, which did not see the postponement, at `2026-07-15T10:15:00`, postpone it with the option **1 hora**.
5. B comes back online. On A and on B, the panel of **Pagar el gas** says "Pospuesta hasta 11:15" (the last whole postponement wins).

## Flow 8: two devices with clocks out of sync

Precondition: empty list, clock at `2026-07-15T08:05:00` (Wednesday) on A and at `2026-07-15T08:00:00` on B (B is five minutes behind); both advance in step.

1. On A, create `Pagar la luz` with **No se repite** and no due date. B sees it pending.
2. On A, postpone **Pagar la luz** with the option **1 hora**. On A, its panel says "Pospuesta hasta 09:05" and the bar is at 0.
3. On B (whose clock reads `08:00:00`, before the start of the postponement), **Pagar la luz** is postponed: dimmed, without "Atrasada", with the bar at 0 (empty, not negative), and its panel says "Pospuesta hasta 09:05".
4. Advance both clocks 30 minutes: on A the bar is at 50; on B (`08:30:00`) the bar is at 42 (the postponement started at 08:05 on A).
