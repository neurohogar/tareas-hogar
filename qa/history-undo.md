# QA: history and undo

Verifies, through the interface only:

- the navigation between **Pendientes** and **Historial** (the **Historial** item of the **⋮** menu and the **Volver** button);
- the notice with **Deshacer** on completing: it lasts 5 seconds (with the simulated clock), a new one replaces the previous one and it stays visible when changing screen;
- the Historial: order, groups by day with "Hoy", "Ayer" or the date, time, current title and empty text;
- deleting a completion from the Historial, with confirmation, and the recalculated status in Pendientes;
- opening the edit of a task from the Historial;
- the two-device cases: two completions while offline, the deletion of a completion or of the task, orphans and a "future" completion.

Covers spec §4.4, §5.1–§5.4, §6 (navigation), §6.2 (delete a task and edit from the history), §6.3, §7 and §10 criterion 5.

Out of scope: emoji, note and PWA.

## Environment

Same as `qa/edit-delete.md`:

- Firebase Emulator Suite (Auth + Firestore) with clean data at the start of each flow.
- Simulated browser clock (`page.clock`) installed **before** opening the app, at the local time each flow indicates (zone `America/Argentina/Buenos_Aires`).
  - "At X" means advancing the simulated clock to X before the step.
  - "Advance the clock to X" means advancing it to X and waiting for the screen to update by itself (without reloading), unless the step says "reload".
  - The steps that measure seconds of the notice use the stopped clock (`page.clock.pauseAt`) and advance it with `page.clock.runFor` or `fastForward` to the exact time, so that time does not run while QA acts.
- Session started with the account `qa@example.com` of the Auth Emulator (Flow 1 of `qa/recurring-relative.md`).
- At the start of each flow, tap the **Completadas** item of the **⋮** menu to turn it on (on A and on B in the two-device flows): the completed tasks (a one-off with a completion, a recurring task waiting with a completion) are seen struck through at the end of the list, after the non-completed ones (`qa/show-completed.md`). A completed recurring task that is waiting has its checkbox checked: tapping it on the same day as its most recent completion deletes it; on a later day, it completes it again.
- Create a task: tap **+**, type the title, choose the **Se repite** option the step indicates and save, with the controls of `qa/one-off.md` and `qa/recurring-calendar.md`.
- **Two devices** (Flows 11 to 14): two independent browser contexts, A and B, with the same account.
  - "B offline" means putting context B offline (`browserContext.setOffline(true)`).
  - "B gets the connection back" means putting it online again and waiting for the two screens to update by themselves.

Reference week: Monday 2026-07-13, Tuesday 14, Wednesday 15, Thursday 16, Friday 17.

**Switches.** **Mostrar completadas** and **Mostrar pausadas** are the items **Completadas** and **Pausadas** of the **⋮** menu (`qa/menu-toggles.md`), not checks above the list: to turn one on or off, open the **Menú** and tap the item (the menu closes). A completed one-off task never has a row in **Pendientes**, with **Completadas** on or off: it is reached from the **Historial**.

## Observable contract

- **Pendientes row and panel**: the contracts of `qa/recurring-relative.md`, `qa/recurring-calendar.md`, `qa/one-off.md`, `qa/edit-delete.md` and `qa/show-completed.md` (completed or not completed).
- **Navigation**: there is no navigation bar (no `navigation` region, no link **Pendientes** or **Historial**).
  - The **Historial** is opened with the first item of the **Menú** (**⋮**) of **Pendientes**, named **Historial** (role `menuitem`); the menu closes and the address is `/history`.
  - The **Historial** header has a button **Volver** (an arrow) to the left of the heading **Historial**; tapping it shows **Pendientes** at `/`.
  - Opening `/history` directly (or reloading there) shows the Historial.
- **Notice**: a region with role `status`.
  - It appears when tapping the checkbox of a non-completed task (on completing it). Its text includes the task title between angle quotes: `Completaste «Regar»`.
  - It has a **Deshacer** button.
  - There is at most **one** notice on screen.
  - It is seen from when it is completed until 4.999 s later and is not seen from 5 s.
  - **Deshacer** closes the notice.
- **Historial**: the screen has the **Historial** heading.
  - Each day with completions is a group with a level 2 heading. The heading text is **Hoy**, **Ayer** or the date in lowercase ("martes 14 de julio"; with " de 2025" if the year is not the current one).
  - Under each heading there is a list of entries. The groups and the entries go from the most recent to the oldest.
  - Each entry (role `listitem`) shows the current title of the task, the time `HH:MM` in 24 h and a **Borrar** button.
  - Without completions, the text "Todavía no completaste nada" is seen and no group.
- **Confirmation of deleting a completion**: **Borrar** opens a dialog (role `alertdialog`) with the buttons **Borrar** and **Cancelar**.
  - The dialog names the task by its title and the moment with the heading of its day and the time: `¿Borrar «Regar» de Hoy, 09:00?`.
  - **Cancelar** closes the dialog without changes. **Borrar** closes the dialog and removes the entry.
- **Edit from the Historial**: tapping an entry outside **Borrar** (for example, on the title) opens the **Editar tarea** panel of that task, with its values. On saving or closing, the user stays on the Historial.

## Flow 1: navigation and empty history

Precondition: empty list, clock at `2026-07-15T08:00:00`.

1. On **Pendientes** there is no navigation bar. Open the **Menú**: its first item is **Historial**.
2. Tap **Historial**: the menu closes, the URL ends in `/history`, the **Historial** heading, the button **Volver** and the text "Todavía no completaste nada" are seen. There is no navigation bar.
3. Reload: it stays on the empty Historial.
4. Tap **Volver**: it goes back to the list (empty, with **+**), at `/`.
5. Open `/history` directly: the Historial is seen.

## Flow 2: the notice lasts 5 seconds and Deshacer gives the task back

Precondition: empty list, clock stopped at `2026-07-15T08:00:00`.

1. Create `Regar` with **Intervalo** every `4` **horas** and `Pagar la luz` with **No se repite** with no due date. No notice appears.
2. At `08:00:00`, tap the **Regar** checkbox: it becomes `en espera` and the notice `Completaste «Regar»` appears with **Deshacer**.
3. At `08:00:04`, the notice is still visible.
4. At `08:00:05`, the notice is gone. **Regar** is still `en espera`.
5. At `08:01:00`, tap the **Pagar la luz** checkbox: its row disappears (a completed one-off task is never shown in **Pendientes**) and the notice says `Completaste «Pagar la luz»`.
6. At `08:01:03`, tap **Deshacer**: the notice closes and **Pagar la luz** goes back to non-completed, `pendiente`.
7. Tap **Historial**: a single group, **Hoy**, with a single entry: **Regar** `08:00`.
8. Go back to **Pendientes**. At `12:00:00`, **Regar** is `pendiente` again; tap its checkbox: the notice `Completaste «Regar»` appears. At `12:00:02`, tap **Deshacer**.
9. In the Historial a single entry remains, **Regar** `08:00`: Deshacer deleted only the last completion.
10. Reload: the same; in Pendientes, **Regar** and **Pagar la luz** `pendiente`.

## Flow 3: a new notice replaces the previous one

Precondition: empty list, clock stopped at `2026-07-15T08:00:00`.

1. Create `Regar` and `Barrer` with **Intervalo** every `2` **días**, and `Pagar la luz` and `Cambiar foco` with **No se repite** with no due date.
2. At `08:00:00`, complete **Regar**. At `08:00:03`, complete **Barrer**: a single notice is seen and it says `Completaste «Barrer»`.
3. At `08:00:07`, the **Barrer** notice is still visible (its 5 seconds count from its own completion).
4. At `08:00:08`, there is no notice.
5. At `08:10:00`, complete **Pagar la luz**. At `08:10:02`, complete **Cambiar foco**: a single notice, `Completaste «Cambiar foco»`.
6. At `08:10:03`, tap **Deshacer**: **Cambiar foco** goes back to non-completed, `pendiente`; **Pagar la luz** is still completed.
7. In the Historial, group **Hoy**: **Pagar la luz** `08:10`, **Barrer** `08:00`, **Regar** `08:00`. **Barrer** goes before **Regar** because it was completed 3 s later.

## Flow 4: the notice stays visible when changing screen

Precondition: empty list, clock stopped at `2026-07-15T08:00:00`.

1. Create `Regar` with **Intervalo** every `2` **días**.
2. At `08:00:00`, complete **Regar**: the notice appears.
3. At `08:00:01`, open the **Historial** from the menu: the notice is still visible and the Historial shows **Hoy**, **Regar** `08:00`.
4. At `08:00:02`, tap **Deshacer**: the notice closes, the entry disappears and "Todavía no completaste nada" is seen.
5. Tap **Volver**: **Regar** is `pendiente` (never completed).

## Flow 5: order, groups by day and time

Precondition: empty list, clock at `2026-07-13T08:00:00` (Monday).

1. Create:
   - `Regar` with **Intervalo** every `1` **días**;
   - `Sacar la basura` with **Días de la semana** `martes` and `jueves`;
   - `Pagar la luz` with **No se repite** with no due date.
2. At `2026-07-13T09:00:00`, complete **Regar**.
3. At `2026-07-14T21:30:00`, complete **Sacar la basura**.
4. At `2026-07-15T08:05:00`, complete **Regar**.
5. At `2026-07-15T10:00:00`, complete **Pagar la luz**.
6. At `2026-07-15T12:00:00`, open the **Historial** from the menu. The following are seen, in this order:
   - **Hoy**: **Pagar la luz** `10:00`, **Regar** `08:05`;
   - **Ayer**: **Sacar la basura** `21:30`;
   - **lunes 13 de julio**: **Regar** `09:00`.
7. Advance the clock to `2026-07-16T00:00:00` without leaving the Historial. The headings update by themselves:
   - **Ayer**: **Pagar la luz** `10:00`, **Regar** `08:05`;
   - **martes 14 de julio**: **Sacar la basura** `21:30`;
   - **lunes 13 de julio**: **Regar** `09:00`.
8. At `2026-07-16T23:59:59`, go to **Pendientes**, complete **Regar** and go back to the Historial. At the very top there is a **Hoy** group with **Regar** `23:59` (without seconds).
9. Reload: the same as in step 8.

## Flow 6: the year is shown only if it is not the current one

Precondition: empty list, clock at `2025-12-31T21:00:00`.

1. Create `Regar` with **Intervalo** every `1` **días**. At `2025-12-31T22:00:00`, complete it.
2. In the Historial **Hoy**: **Regar** `22:00` is seen.
3. Advance the clock to `2026-01-01T10:00:00`: the group becomes **Ayer**.
4. Advance the clock to `2026-01-02T10:00:00`: the group becomes **miércoles 31 de diciembre de 2025**.

## Flow 7: deleting from the Historial recalculates the status

Precondition: empty list, clock at `2026-07-13T08:00:00` (Monday).

1. Create:
   - `Regar` with **Intervalo** every `4` **horas**;
   - `Sacar la basura` with **Días de la semana** `martes` and `jueves`;
   - `Pagar la luz` with **No se repite** and Fecha límite `2026-07-14`.
2. At `2026-07-14T10:00:00`, complete **Sacar la basura** (it covers Tuesday) and **Pagar la luz**: both become completed.
3. At `2026-07-15T04:00:00`, complete **Regar**. At `2026-07-15T09:00:00` (**Regar** is `pendiente` since `08:00`), complete **Regar** again.
4. Advance the clock to `2026-07-15T11:00:00`. In Pendientes: **Regar** `en espera` with the bar at 50 and **Sacar la basura** `en espera`, both completed.
5. In the Historial, tap **Borrar** on **Regar** `09:00` (group **Hoy**): the dialog `¿Borrar «Regar» de Hoy, 09:00?` appears with **Borrar** and **Cancelar**.
6. Tap **Cancelar**: the dialog closes and the entries stay the same.
7. Tap **Borrar** on **Regar** `09:00` and confirm with **Borrar**: the entry disappears; **Regar** `04:00` remains.
8. In Pendientes, **Regar** is `pendiente`, not completed (the `04:00` completion expired at `08:00`).
9. In the Historial, delete **Regar** `04:00` (with confirmation). **Regar** is still `pendiente` in Pendientes (never completed).
10. In the Historial, delete **Pagar la luz** `10:00` (group **Ayer**): in Pendientes, **Pagar la luz** goes back to non-completed, `atrasada`.
11. At `2026-07-16T10:00:00` (Thursday, **Sacar la basura** is `pendiente`), complete **Sacar la basura** (it covers Thursday): `en espera`, completed, until Tuesday 21.
12. Advance the clock to `2026-07-18T17:00:00`: **Sacar la basura** is `en espera` with the bar at 50 (55 of the 110 hours until Tuesday 21).
13. In the Historial, delete **Sacar la basura** `10:00` of the group **jueves 16 de julio**: in Pendientes, **Sacar la basura** becomes `atrasada`, not completed (it covers only Tuesday again, and Thursday was lost).
14. Reload: the Historial shows only **martes 14 de julio**: **Sacar la basura** `10:00`. Pendientes shows, in this order, **Pagar la luz** (`atrasada`), **Sacar la basura** (`atrasada`) and **Regar** (`pendiente`), none completed.

## Flow 8: deleting a completion that is not the most recent

Precondition: empty list, clock at `2026-07-15T06:00:00`.

1. Create `Regar` with **Intervalo** every `4` **horas** and complete it. At `2026-07-15T10:30:00` (**Regar** is `pendiente` since `10:00`), complete it again.
2. Advance the clock to `2026-07-15T12:30:00`: **Regar** is `en espera`, with the bar at 50.
3. In the Historial, delete **Regar** `06:00` (with confirmation): **Regar** `10:30` remains.
4. In Pendientes, **Regar** is still `en espera`, completed, with the bar at 50.

## Flow 9: the title that is seen is the current one

Precondition: empty list, clock at `2026-07-14T09:00:00`.

1. Create `Regar` with **Intervalo** every `1` **días** and complete it. At `2026-07-15T10:00:00` (**Regar** is `pendiente` since `09:00`), complete it again.
2. In Pendientes, edit the title to `Regar plantas`.
3. In the Historial: **Hoy**: **Regar plantas** `10:00`; **Ayer**: **Regar plantas** `09:00`.

## Flow 10: edit and delete the task from the Historial

Precondition: empty list, clock at `2026-07-15T08:00:00`.

1. Create `Pagar la luz` with **No se repite** with no due date and `Regar` with **Intervalo** every `2` **días**. Complete both: both become completed.
2. At `2026-07-15T10:00:00`, in the Historial, tap the title of the **Pagar la luz** entry. The **Editar tarea** panel opens with Título `Pagar la luz` and **No se repite** with no due date. Tap **Cerrar**: it stays on the Historial, without changes.
3. Tap the **Pagar la luz** entry again, choose **Intervalo** every `4` **horas** and save. The panel closes and it stays on the Historial with the two entries.
4. In Pendientes, **Pagar la luz** is `en espera` with the bar at 50 (completed 2 of 4 hours ago), still completed.
5. In the Historial, tap the **Pagar la luz** entry: the panel shows **Intervalo** every `4` **horas**. Tap **Borrar tarea** and confirm.
6. Its entry disappears from the Historial; **Regar** `08:00` remains. In Pendientes there is no **Pagar la luz**.
7. In Pendientes, delete **Regar** (with confirmation). The Historial ends up with "Todavía no completaste nada".

## Flow 11: two devices complete while offline

Precondition: empty list, clock at `2026-07-15T08:00:00` on A and on B.

1. On A, create `Regar` with **Intervalo** every `2` **días**. B sees it `pendiente`.
2. B offline. On A, complete **Regar** (`08:00`). At `2026-07-15T09:00:00` (on A and on B), complete **Regar** on B, which did not see A's completion and still sees it `pendiente`.
3. B gets the connection back. In the Historial of A and of B: **Hoy**: **Regar** `09:00`, **Regar** `08:00`.
4. On A, delete **Regar** `09:00` from the Historial: on B the entry disappears by itself; **Regar** `08:00` remains.

## Flow 12: Deshacer when another device already deleted the task

Precondition: empty list, clock at `2026-07-15T10:00:00` on A and on B.

1. On A, create `Regar` with **Intervalo** every `2` **días**. Stop A's clock at `10:00:00`.
2. On A, complete **Regar**: the notice appears.
3. On B, delete **Regar** (with confirmation). Wait for the row to disappear on A.
4. With A's clock at `10:00:02`, tap **Deshacer** on A: the notice closes and **Regar** does not reappear.
5. On A and on B, Pendientes is empty and the Historial says "Todavía no completaste nada". Reload both: the same.

## Flow 13: orphan completion

Precondition: empty list, clock at `2026-07-15T08:00:00` on A and on B.

1. On A, create `Barrer` and `Regar` with **Intervalo** every `2` **días**, and complete **Regar**.
2. B offline. On B, complete **Barrer**.
3. On A, delete **Barrer** (with confirmation).
4. B gets the connection back. On A and on B, the Historial shows only **Hoy**: **Regar** `08:00`; **Barrer** does not appear.
5. Reload A and B: the same.

## Flow 14: "future" completion

Precondition: empty list, A's clock at `2026-07-15T12:00:00` (Wednesday) and B's clock at `2026-07-16T09:00:00` (Thursday, ahead).

1. On A, create `Regar` with **Intervalo** every `2` **días**.
2. On B, complete **Regar**.
3. In A's Historial, a single group is seen, **jueves 16 de julio** (not "Mañana"), with **Regar** `09:00`.
4. In A's Pendientes, **Regar** is `en espera` with the bar at 0.
