# QA: pause and resume recurring tasks

Verifies, through the interface only:

- the **Pausar** / **Reanudar** button in the panel: it appears only when editing a recurring task, acts immediately (saves and closes the panel without **Guardar**) and, with the task paused, the panel says "Pausada";
- that a paused task is not shown in Pendientes with **Mostrar pausadas** off, and that it does not become overdue while paused;
- the **Pausadas** item of the **⋮** menu: paused tasks go last (after the completed ones), by title, dimmed, with "Pausada" in place of the status indicator and the checkbox disabled; the value is saved on the device and is not synced;
- resuming: a relative task becomes pending; a calendar task becomes pending if today is one of its days and, if not, waiting until the next occurrence; with a schedule, a window that already closed when resuming does not leave it overdue;
- that completions from before the pause stay in the Historial and in "Última vez", but do not count for the status after resuming;
- changing a paused recurring task to one-off resumes it;
- pause with two devices.

Covers spec §4.1 (`pausada`, `reanudadaEn`), §5.8, §6.1 (Mostrar pausadas), §6.2 (Pausar / Reanudar, Última vez) and §7 (conflicts).

Out of scope: the urgency order of non-paused tasks (`qa/pending-order.md`), the statuses without pause (`qa/recurring-relative.md`, `qa/recurring-calendar.md`, `qa/schedule.md`) and the format of "Última vez" (`qa/last-time.md`).

## Environment

- Firebase Emulator Suite (Auth + Firestore) with clean data at the start of each flow.
- Each flow starts from a new browser context (no data saved on the device), signed in with the Auth Emulator account `qa@example.com` (Flow 1 of `qa/recurring-relative.md`).
- Simulated browser clock (`page.clock`) installed **before** opening the app, at the local time each flow gives (zone `America/Argentina/Buenos_Aires`).
  - "At X" means advancing the simulated clock to X before the step.
  - "Advance the clock to X" means advancing it to X and waiting for the screen to update by itself (without reloading).
  - With a "stopped clock" (`page.clock.pauseAt`), the clock is advanced with `page.clock.runFor` or `fastForward` to the exact time, so that time does not run while QA acts.
- Create a task: tap **+**, type the title, choose the **Se repite** option the step gives, with the controls of `qa/one-off.md`, `qa/recurring-relative.md` and `qa/recurring-calendar.md`; if the step gives a schedule, enter it as in `qa/schedule.md`; save.
- **Mostrar completadas** and **Mostrar pausadas** stay off unless the flow says to turn them on.
- **Two devices** (Flow 7): two independent browser contexts, A and B, with the same account and the same simulated clock. "B offline" means `browserContext.setOffline(true)` on B; "B comes back online" means putting it back online and waiting for both screens to update by themselves.

Reference week: Monday 2026-07-13, Tuesday 14, Wednesday 15, Thursday 16, Friday 17, Saturday 18, Sunday 19.

**Switches.** **Mostrar completadas** and **Mostrar pausadas** are the items **Completadas** and **Pausadas** of the **⋮** menu (`qa/menu-toggles.md`), not checks above the list: to turn one on or off, open the **Menú** and tap the item (the menu closes). A completed one-off task never has a row in **Pendientes**, with **Completadas** on or off: it is reached from the **Historial**.

## Observable contract

- **Pause button of the panel**: in the **Editar tarea** panel of a recurring task, a button with accessible name **Pausar** or, if the task is paused, **Reanudar**; with **Reanudar**, the panel shows the text "Pausada". Tapping it closes the panel and the change is saved: when the task is opened again, or on reload, it is kept. The **Nueva tarea** panel and the panel of a one-off task have neither button.
- **Pausadas item**: an element with role `menuitemcheckbox` and accessible name "Pausadas" in the menu of the button «Menú», below "Completadas" (`qa/menu-toggles.md`). `aria-checked="true"` and check mark = on. Nothing outside the menu shows its value.
- **Paused row** (only with the item on): the row checkbox disabled (`disabled` or `aria-disabled="true"`, and tapping it changes nothing: no notice and no new entry in the Historial); the row dimmed (effective opacity less than 1 and less than that of a pending row); the text "Pausada" inside the row; no "Atrasada" indicator and no progress bar.
- **Row**: for non-paused tasks, the contract of `qa/recurring-relative.md` (checkbox, title, dimmed style, progress bar with `aria-valuenow`, "Atrasada" indicator) and that of `qa/show-completed.md`.
- **List**: "The list is A, B, C" means exactly those rows, from top to bottom.
- **Última vez** and **Historial**: those of `qa/last-time.md` and `qa/history-undo.md`.

## Flow 1: pause and resume a relative task

Precondition: empty list, clock at `2026-07-14T09:00:00` (Tuesday).

1. Create `Cambiar foco` with **No se repite** and no due date. Tap **+**: the **Nueva tarea** panel has no **Pausar**. Create `Regar` with **Intervalo** every `2` **días**.
2. Tap the checkbox of **Regar**: it becomes waiting, completed, and its row disappears. The list is **Cambiar foco**.
3. Tap the **Cambiar foco** row: the panel has neither **Pausar** nor **Reanudar**. Close it.
4. Turn on **Mostrar completadas**. Tap the **Regar** row: the panel has **Pausar** and says `Última vez: hoy 09:00`. Tap **Pausar**, without tapping **Guardar**: the panel closes. The list is **Cambiar foco**: **Regar** is no longer visible, not even with the completed ones.
5. Tap the **Pausadas** item of the **⋮** menu: the list is **Cambiar foco**, **Regar**. **Regar** looks paused: dimmed, with "Pausada", without a bar and with the checkbox disabled. Tap its checkbox: nothing happens (no notice; the Historial still has a single entry).
6. Tap the **Regar** row: the panel says "Pausada", has **Reanudar** and does not have **Pausar**, and still says `Última vez: hoy 09:00`. Close the panel.
7. Advance the clock to `2026-07-20T10:00:00` (Monday; without the pause, **Regar** would be overdue since the 18th): **Regar** is still paused, without "Atrasada".
8. Reload: **Pausadas** and **Completadas** still have their check mark in the menu; **Regar** is still paused.
9. Tap the **Regar** row and tap **Reanudar**: the panel closes. **Regar** is pending (bold, checkbox enabled and unchecked, without "Atrasada" or "Pausada") and the list is **Regar**, **Cambiar foco**.
10. Tap the **Regar** row: the panel has **Pausar** and says `Última vez: hace 6 días`. Close the panel. The Historial has the entry **Regar** `09:00` of Tuesday 14 July.
11. Advance the clock to `2026-07-25T10:00:00`: **Regar** is still pending, without "Atrasada" (never completed since it was resumed).
12. At `2026-07-25T10:05:00`, tap the checkbox of **Regar**: the notice `Completaste «Regar»` appears and it becomes waiting, completed, with the bar at 0.

## Flow 2: resume a calendar task

Precondition: empty list, clock stopped at `2026-07-07T09:00:00` (Tuesday). **Mostrar completadas** on until both are paused (so they can be opened).

1. At `09:00:00`, create `Sacar la basura` with **Días de la semana** `martes` and `jueves`; at `09:01:00`, create `Cambiar sábanas` with **Días de la semana** `jueves`. Tap the checkbox of both: they become waiting.
2. Pause both (row, **Pausar**). Turn on **Mostrar pausadas**: the list is **Cambiar sábanas**, **Sacar la basura**, both paused.
3. Advance the clock to `2026-07-15T12:00:00` (Wednesday). Resume **Sacar la basura**: it becomes waiting (not "Atrasada"), dimmed, with the bar at 0 and the checkbox unchecked (it is not completed).
4. Advance the clock to `2026-07-15T18:00:00`: the bar of **Sacar la basura** is at 50 (`aria-valuenow`).
5. Advance the clock to `2026-07-16T10:00:00` (Thursday): **Sacar la basura** is pending. Resume **Cambiar sábanas** (today is its day): it becomes pending. The list is **Sacar la basura**, **Cambiar sábanas**, without paused ones: both have been pending since 00:00 today and the real `creadaEn` breaks the tie, not the resume or the title.
6. Tap the checkbox of **Sacar la basura**: it becomes waiting, completed, until Tuesday 21.
7. Advance the clock to `2026-07-17T00:00:00` (Friday): **Cambiar sábanas** is overdue (it missed Thursday after being resumed); **Sacar la basura** is still waiting.

## Flow 3: completing after resuming covers the next occurrence

Precondition: empty list, clock stopped at `2026-07-07T09:00:00` (Tuesday). **Mostrar completadas** on.

1. Create `Sacar la basura` with **Días de la semana** `martes` and `jueves`. Complete it and pause it.
2. At `2026-07-15T10:00:00` (Wednesday), resume it: waiting, not completed.
3. At `2026-07-15T11:00:00`, tap its checkbox: the notice appears and it becomes waiting, completed.
4. Advance the clock to `2026-07-16T10:00:00` (Thursday): it is still waiting, completed (the completion covered Thursday, not the Tuesday missed during the pause).
5. Advance the clock to `2026-07-21T00:00:00` (Tuesday): it is pending.

## Flow 4: resume with a schedule

Precondition: empty list, clock stopped at `2026-07-10T09:00:00` (Friday). **Mostrar completadas** and **Mostrar pausadas** on (to open the completed task and the paused one).

1. Create `Ventilar` with **Días de la semana** `miércoles` and `viernes` and schedule `08:00` to `11:00`. At `09:00`, complete it. Pause it.
2. At `2026-07-15T12:00:00` (Wednesday, today's window already closed), resume it: it becomes waiting, not "Atrasada", with the bar at 0 and the checkbox disabled (outside the window).
3. Advance the clock to `2026-07-15T23:00:00`: still waiting, bar at 25.
4. Advance the clock to `2026-07-17T08:00:00` (Friday): pending, checkbox enabled.
5. Advance the clock to `2026-07-17T11:00:00`: overdue (with the checkbox disabled: the window already closed).
6. Pause it. At `2026-07-22T09:00:00` (Wednesday, inside the window), resume it: pending, checkbox enabled. Advance the clock to `2026-07-22T11:00:00` without completing it: overdue (the window was open when it was resumed).

## Flow 5: Mostrar pausadas and order

Precondition: empty list, clock at `2026-07-15T08:00:00` (Wednesday).

1. Create, in this order: `Ñandú` with **Intervalo** every `1` **días**; `Nube` with **Intervalo** every `1` **días**; `Árbol` with **Días de la semana** `lunes`; `Pagar la luz` with **Intervalo** every `2` **días**; `Cambiar foco` with **No se repite** and no due date.
2. Complete **Pagar la luz**. Pause **Ñandú**, **Nube** and **Árbol**. The list is **Cambiar foco**.
3. Turn on **Mostrar pausadas**: the list is **Cambiar foco**, **Árbol**, **Nube**, **Ñandú** (paused ones last, by title: Á sorts with A, ñ after n; not by when they were created).
4. Turn on **Mostrar completadas**: the list is **Cambiar foco**, **Pagar la luz**, **Árbol**, **Nube**, **Ñandú**: the paused ones after the completed one. **Pagar la luz** looks completed (struck through, checkbox checked); the three paused ones have "Pausada" and the checkbox disabled.
5. Turn off **Mostrar completadas**: the list is **Cambiar foco**, **Árbol**, **Nube**, **Ñandú**.
6. Reload: **Pausadas** still has its check mark and the list is the same. Close the tab and open the app again in the same context: the check mark is still there.
7. Turn off **Pausadas**: the list is **Cambiar foco**. Reload: it is still off.

## Flow 6: change a paused recurring task to one-off

Precondition: empty list, clock at `2026-07-10T09:00:00` (Friday). **Mostrar completadas** on.

1. Create `Regar` with **Intervalo** every `2` **días** and complete it. Pause it: the list is empty.
2. At `2026-07-15T10:00:00`, turn on **Mostrar pausadas**, tap the **Regar** row, change **Se repite** to **No se repite** (no due date) and save.
   - **Regar** has no row: it is now a completed one-off task (it has the completion of the 10th) and a completed one-off task is never shown, so it is not seen paused either.
   - In the **Historial**, tap its entry: the panel has neither **Pausar** nor **Reanudar**.
3. From the **Historial**, change it to **Intervalo** every `2` **días** and save: **Regar** is pending (not "Atrasada"; the completion of the 10th is from before the resume), and the panel has **Pausar**.

## Flow 7: two devices

Precondition: empty list, clock at `2026-07-14T08:00:00` (Tuesday) on A and on B. On A and on B, turn on **Mostrar pausadas**.

1. On A, create `Regar` with **Intervalo** every `2` **días**. B sees it.
2. B offline. On A, pause **Regar**. On B, at `2026-07-14T09:00:00`, complete **Regar** (B did not see the pause).
3. B comes back online. On A and on B, **Regar** is paused (with "Pausada" and the checkbox disabled); the Historial of both has the entry **Regar** `09:00`.
4. B offline. On A, at `2026-07-15T10:00:00`, resume **Regar**: on A it is pending (B's completion does not count, it is from before the resume). On B, which did not see the resume, change the title to `Regar plantas` and save.
5. B comes back online. On A and on B, the task is called **Regar plantas**, is pending and not paused.
6. On A, turn off **Pausadas**: on B it is still on (check mark in its menu), also after reloading B.
7. B offline. On A, pause **Regar plantas**. On B, change the title to `Regar` and save. B comes back online: on A and on B the task is called **Regar** and is paused (A does not show it; B does, with "Pausada").
