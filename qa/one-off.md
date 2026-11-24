# QA: one-off task with optional due date (feature 3)

Verifies, through the interface only, creating one-off tasks with and without a due date,
the validation of the panel, the change from pending to overdue at the end of the due
day (with the simulated clock), that completing a one-off task removes it from
Pendientes, persistence, and that creating recurring tasks still works with the
new selector. Covers spec §4.1, §4.4, §5.1, §6.1 (subset), §6.2
(subset) and §7.

Out of scope: order between tasks, history, undo (notice and from the
history), going back to the list, editing, deletion, emoji and note.

## Environment

Same as `qa/recurring-calendar.md`:

- Firebase Emulator Suite (Auth + Firestore) with clean data at the start of
  each flow.
- Simulated browser clock (`page.clock`) installed **before** opening the
  app, at the local time each flow gives (zone
  `America/Argentina/Buenos_Aires`). "Advance the clock to X" means
  advancing the simulated clock to X and waiting for the screen to update
  by itself (without reloading), unless the step says "reload".
- Signed in with the Auth Emulator account `qa@example.com` (Flow 1 of
  `qa/recurring-relative.md`).
- **Mostrar completadas** stays off (its initial value) in all flows.

Reference week: Monday 2026-07-13, Tuesday 14, Wednesday 15, Thursday 16,
Friday 17.

**Switches.** **Mostrar completadas** and **Mostrar pausadas** are the items **Completadas** and **Pausadas** of the **⋮** menu (`qa/menu-toggles.md`), not checks above the list: to turn one on or off, open the **Menú** and tap the item (the menu closes). A completed one-off task never has a row in **Pendientes**, with **Completadas** on or off: it is reached from the **Historial**.

**Navigation.** There is no navigation bar (`qa/navigation.md`): to go to **Historial**, open the **Menú** (**⋮**) of **Pendientes** and tap the item **Historial**; to go back to **Pendientes**, tap **Volver** in the header of the **Historial**. Opening `/history` directly still shows the Historial.

## Observable contract of the Pendientes row

The same as `qa/recurring-relative.md`. A one-off task is never waiting:

| Status | Checkbox | Dimmed style | Progress bar | Overdue indicator |
|---|---|---|---|---|
| pending | visible, unchecked | no | no | no |
| overdue | visible, unchecked | no | no | yes ("Atrasada") |
| completed | — the row is not in Pendientes — | | | |

Throughout this document **Mostrar completadas** stays off (its initial
value); with the item on, a completed one-off task is still not shown: it has no
row in **Pendientes** (`qa/show-completed.md`).

The row of a one-off task does not show the due date: QA verifies it through the
status it takes as time passes.

## Observable contract of the panel

Tapping **+** opens the panel with:

- **Título**.
- **Se repite** group with four mutually exclusive options (radio): **No se
  repite** (one-off task), **Intervalo** (as in
  features 1 and 2), **Días de la semana** and **Días del mes**. The controls of
  Intervalo, Días de la semana and Días del mes are those of
  `qa/recurring-calendar.md`.
- With **No se repite**: a date field **Fecha límite** (date without time,
  optional, empty by default), with that accessible name, unique in the panel.
  **Cada**, the unit and the day grids are not shown.
- The **Fecha límite** field is only shown with **No se repite**.
- **Cerrar** and **Guardar** buttons.

## Flow 1: kind selector in the panel

Precondition: empty list, clock at `2026-07-13T08:00:00` (Monday).

1. Tap **+**: the **Se repite** group offers **No se repite**, **Intervalo**,
   **Días de la semana** and **Días del mes**; **No se repite** is selected (the
   option the panel opens with when creating). **Fecha límite** is shown, empty;
   **Cada**, the unit and the day grids are not shown.
2. Choose **Intervalo**: **Fecha límite** is not shown; **Cada** and the
   unit are shown.
3. Choose **Días de la semana**: **Fecha límite** is not shown; the seven
   days are shown.
4. Choose **No se repite** again: **Fecha límite** is shown.
5. Close the panel without saving: the list is still empty.

## Flow 2: create with and without a due date

Precondition: empty list, clock at `2026-07-13T08:00:00` (Monday).

1. Tap **+**, type title `Pagar la luz`, choose **No se repite**,
   enter Fecha límite `2026-07-15` and save.
   - The panel closes.
   - The row **Pagar la luz** appears pending: not dimmed, no bar, no
     overdue indicator.
2. Tap **+**, type `Cambiar foco`, choose **No se repite**, leave Fecha
   límite empty and save: **Cambiar foco** appears pending.
3. Tap **+**, type `Devolver libro`, choose **No se repite**, enter
   Fecha límite `2026-07-13` (today) and save: **Devolver libro** appears
   pending (the due date counts as the whole day).
4. Tap **+**, type `Renovar DNI`, choose **No se repite**, enter
   Fecha límite `2026-07-10` (in the past) and save: it is accepted and
   **Renovar DNI** appears overdue right away, with the "Atrasada" indicator.
5. Reload the page: the four rows are still there with the same statuses
   (persistence in Firestore).

## Flow 3: panel validation

Precondition: empty list, clock at `2026-07-13T08:00:00`.

1. Tap **+**, choose **No se repite**, leave the title empty and Fecha límite
   empty, and save.
   - An error message associated with the Título field is shown.
   - The panel stays open; no row appears.
2. Type title `   ` (only spaces) and save: same result as
   step 1.
3. Leave the title empty, enter Fecha límite `2026-07-15` and save: same
   result as step 1.
4. Type title `Pagar la luz` and leave in Fecha límite an
   incomplete date, entered by keyboard (only day and month, no year), and save.
   - An error message associated with the Fecha límite field is shown.
   - The panel stays open; no row appears (an incomplete date is not
     saved as "no due date").
5. Close the panel without saving (and **Descartar** in the notice): the list is still empty.

## Flow 4: from pending to overdue at the end of the due day

Precondition: empty list, clock at `2026-07-13T08:00:00` (Monday).

1. Create `Pagar la luz` with **No se repite** and Fecha límite `2026-07-15`:
   pending.
2. Create `Cambiar foco` with **No se repite** and no due date: pending.
3. Advance the clock to `2026-07-15T00:00:00` (due day): **Pagar la luz**
   is still pending.
4. Advance the clock to `2026-07-15T23:59:59`: still pending.
5. Advance the clock to `2026-07-16T00:00:00`: **Pagar la luz** becomes
   overdue: it shows "Atrasada", not dimmed, no bar.
6. Reload the page: **Pagar la luz** is still overdue.
7. Advance the clock to `2026-09-01T08:00:00`: **Pagar la luz** is still
   overdue; **Cambiar foco** is still pending throughout the flow (without a due
   date it never becomes overdue).

## Flow 5: completing removes the task from Pendientes

Precondition: empty list, clock at `2026-07-13T08:00:00` (Monday).

1. Create `Pagar la luz` with Fecha límite `2026-07-15` and `Cambiar foco` without a
   due date: both pending.
2. Tap the checkbox of **Cambiar foco** (pending): the row **Cambiar foco**
   disappears from Pendientes. **Pagar la luz** is still pending.
3. Advance the clock to `2026-07-16T10:00:00`: **Pagar la luz** becomes
   overdue.
4. Tap the checkbox of **Pagar la luz** (overdue): the row disappears. The
   list is left empty.
5. Reload the page: the list is still empty (the completion was saved).
6. Advance the clock to `2026-08-01T00:00:00`: the list is still empty.

## Flow 6: persistence between sessions

Precondition: Flow 4 up to step 2 (two pending rows, clock at
`2026-07-13T08:00:00`).

1. Close the tab and open the app again with the clock at
   `2026-07-16T00:00:00`.
2. It goes straight to **Pendientes** (no login): **Pagar la luz** is
   overdue (the due date was saved) and **Cambiar foco** pending.
3. Tap the checkbox of **Pagar la luz**: the row disappears.
4. Close the tab and open the app again with the same clock: only
   **Cambiar foco** is shown, pending.

## Flow 7: recurring tasks can still be created with the new selector

Precondition: empty list, clock at `2026-07-13T08:00:00` (Monday).

1. Tap **+**, type `Ventilar`, choose **Intervalo** (the panel opens with
   **No se repite**), set Cada = `4`, unit **horas**, and save: **Ventilar**
   appears pending (never completed).
2. Tap the checkbox of **Ventilar**: it becomes waiting, completed, and its
   row disappears.
3. Tap **+**, type `Sacar la basura`, choose **No se repite**, enter
   Fecha límite `2026-07-14`, switch to **Días de la semana**, tap `martes`
   and `jueves` and save: **Sacar la basura** appears waiting, bar at 0
   (the recurring task was saved; the due date does not apply).
4. Advance the clock to `2026-07-14T00:00:00` (Tuesday): **Sacar la basura** becomes
   pending; **Ventilar** becomes pending from
   `2026-07-13T12:00:00` and overdue from `2026-07-13T16:00:00`, so
   it now goes back to the list, overdue.
5. Advance the clock to `2026-07-15T00:00:00`: **Sacar la basura** becomes
   overdue, like any weekly task with Tuesday uncovered.
6. Tap **+**, type `Pagar expensas`, choose **Días del mes**, tap `20`
   and save: **Pagar expensas** appears waiting.
7. Reload the page: the three rows are still there with the same statuses.
