# QA: edit and delete tasks

Verifies, through the interface only, that tapping a Pendientes row opens the
edit panel with the task's values, that the title, the kind, the due date and
the recurrence can be edited with the same validations as when creating, that
closing with unsaved changes asks for confirmation (and **Descartar** discards
them), that the status and the order are recalculated with the new definition
(with the simulated clock), that **Borrar tarea** asks for confirmation and
removes the task, and the conflicts between two devices. Covers spec
§4.1–§4.2, §5.1–§5.3, §6.1 (tapping the row), §6.2 and §7 (partial edits,
deletion, edit against deletion, orphan completions).

Out of scope: emoji, note, history and undo, PWA and offline operation beyond
the two-device flows. That the deletion also takes the completions with it is
only seen in the Historial, which does not exist yet; it is covered by
`features/delete-task.feature`.

## Environment

Same as `qa/one-off.md`:

- Firebase Emulator Suite (Auth + Firestore) with clean data at the start of
  each flow.
- Simulated browser clock (`page.clock`) installed **before** opening the
  app, at the local time each flow indicates (zone
  `America/Argentina/Buenos_Aires`). "At X" means advancing the simulated
  clock to X before the step. "Advance the clock to X" means advancing it to X
  and waiting for the screen to update by itself (without reloading), unless
  the step says "reload".
- Session started with the account `qa@example.com` of the Auth Emulator
  (Flow 1 of `qa/recurring-relative.md`).
- Create a task: tap **+**, type the title, choose the **Se repite** option
  the step indicates and save, with the controls of `qa/one-off.md` and
  `qa/recurring-calendar.md`.
- **Two devices** (Flows 10 to 14): two independent browser contexts, A and B,
  with the same account and the same simulated clock. "B offline" means
  putting context B offline (`browserContext.setOffline(true)`), and "B gets
  the connection back", putting it online again and waiting for the two
  screens to update by themselves.
- At the start of each flow, tap the **Mostrar completadas** check to turn it
  on (on A and on B in the two-device flows): the completed tasks are seen
  struck through at the end of the list (`qa/show-completed.md`).

Reference week: Monday 2026-07-13, Tuesday 14, Wednesday 15, Thursday 16,
Friday 17, Saturday 18, Sunday 19, Monday 20.

## Observable contract

- **Row**: the contract of `qa/recurring-relative.md` (checkbox, title,
  "Atrasada", dimmed and waiting bar). The bar of a calendar task is the one
  of `qa/recurring-calendar.md`.
- **Opening the edit**: tapping the row outside the checkbox (for example, on
  the title) opens the edit panel. Tapping the checkbox completes the task or,
  if it is completed, acts according to `qa/show-completed.md` (deletes
  today's completion or, on a recurring task completed on an earlier day,
  completes it again); in no case does it open the panel.
- **Edit panel**: the same panel as creation (`qa/one-off.md`,
  `qa/recurring-calendar.md`), with these differences:
  - Heading **Editar tarea** (when creating it is **Nueva tarea**).
  - It opens with the current values: **Título** with the title, the
    corresponding **Se repite** option chosen and its controls loaded:
    - **No se repite**: **Fecha límite** with the date, or empty if it has
      none.
    - **Intervalo**: **Cada** with N and the chosen unit.
    - **Días de la semana** / **Días del mes**: the task's days with
      `aria-pressed=true` and the rest `false`.
  - When choosing another **Se repite** option, its controls start as when
    creating (no days chosen; Fecha límite empty).
  - Buttons **Cerrar**, **Guardar** and **Borrar tarea**. The creation panel
    (**+**) does not have **Borrar tarea**.
- **Guardar** with valid data closes the panel and the row reflects the edited
  task. With invalid data, the panel stays open, the error associated with the
  field is seen (the same messages as when creating) and the task does not
  change.
- **Cerrar** with changes opens the notice "Tenés cambios sin guardar"
  (`qa/unsaved-changes.md`); **Descartar** discards them and without changes
  it closes directly.
- **Deletion confirmation**: **Borrar tarea** opens a confirmation dialog
  (role `alertdialog`) that names the task by its title, with the buttons
  **Borrar** and **Cancelar**.

## Flow 1: open the edit panel with the task's values

Precondition: empty list, clock at `2026-07-13T08:00:00` (Monday).

1. Tap **+**: the panel says **Nueva tarea** and does not have **Borrar
   tarea**. Close it.
2. Create `Pagar la luz` (**No se repite**, Fecha límite `2026-07-15`),
   `Cambiar foco` (**No se repite**, no due date), `Regar plantas`
   (**Intervalo**, Cada `2` **días**), `Sacar la basura` (**Días de la
   semana** `martes` and `jueves`) and `Pagar expensas` (**Días del mes** `10`
   and `31`).
3. Tap the **Pagar la luz** row: the **Editar tarea** panel opens with Título
   `Pagar la luz`, **No se repite** chosen and Fecha límite `2026-07-15`;
   **Cerrar**, **Guardar** and **Borrar tarea** are seen. Close.
4. Tap **Cambiar foco**: **No se repite**, Fecha límite empty. Close.
5. Tap **Regar plantas**: **Intervalo**, Cada `2`, unit **días**. Close.
6. Tap **Sacar la basura**: **Días de la semana**, `martes` and `jueves` with
   `aria-pressed=true`, the other five `false`. Close.
7. Tap **Pagar expensas**: **Días del mes**, `10` and `31` with
   `aria-pressed=true`, the others `false`. Close.
8. Tap the **Regar plantas** checkbox: it becomes `en espera` and no panel
   opens.
9. No task changed: the five rows still have their titles and statuses.

## Flow 2: edit the title and close without saving

Precondition: empty list, clock at `2026-07-13T08:00:00`.

1. Create `Regar` with **Intervalo** every `2` **días**.
2. Tap the **Regar** row, change the title to `Regar plantas` and save: the
   panel closes and the row says **Regar plantas**, `pendiente`.
3. Reload the page: it still says **Regar plantas** (it was saved in
   Firestore).
4. Tap the row, change the title to `Otra cosa`, put Cada `5` and tap
   **Cerrar** and **Descartar** in the notice: the row still says **Regar
   plantas**.
5. Tap the row again: Título `Regar plantas` and Cada `2` (the changes were
   discarded). Tap **Guardar** without changing anything: the row stays the
   same.

## Flow 3: validation when editing

Precondition: empty list, clock at `2026-07-13T08:00:00`.

1. Create `Sacar la basura` with **Días de la semana** `martes` and `jueves`.
2. Tap the row, delete the title and save: error associated with the Título
   field, the panel stays open.
3. Type title `   ` (only spaces) and save: same result.
4. Type `Basura`, untoggle `martes` and `jueves` (no day chosen) and save:
   days error; the panel stays open.
5. Choose **Intervalo**, put Cada `0` and save: error associated with the Cada
   field.
6. Choose **No se repite**, leave in Fecha límite an incomplete date typed by
   keyboard (only day and month) and save: error associated with the Fecha
   límite field.
7. Tap **Cerrar** and **Descartar** in the notice: the row is still **Sacar la
   basura**, `en espera`. When opening it, it still has **Días de la semana**
   `martes` and `jueves`: no change from the previous steps was saved, not
   even the valid title of step 4.

## Flow 4: edit the due date of a one-off task

Precondition: empty list, clock at `2026-07-15T10:00:00` (Wednesday).

1. Create `Pagar la luz` with **No se repite** and Fecha límite `2026-07-14`:
   `atrasada`.
2. Edit it with Fecha límite `2026-07-20`: it becomes `pendiente`, without
   "Atrasada".
3. Edit it with Fecha límite empty (no due date): it stays `pendiente`.
4. Edit it with Fecha límite `2026-07-15` (today): `pendiente`.
5. Advance the clock to `2026-07-16T00:00:00`: it becomes `atrasada`.
6. Reload: it stays `atrasada` (the last date was saved).

## Flow 5: edit the interval of a completed relative task

Precondition: empty list, clock at `2026-07-15T08:00:00`.

1. Create `Ventilar` with **Intervalo** every `4` **horas** and tap its
   checkbox: `en espera`, bar at 0.
2. Advance the clock to `2026-07-15T20:00:00`: `atrasada` (12 hours passed).
3. Edit it to every `2` **días**: it becomes `en espera`, bar at 25 (12 of 48
   hours since the completion, which was kept).
4. Edit it to every `12` **horas**: it becomes `pendiente`.
5. Edit it to every `4` **horas**: it goes back to `atrasada`.

## Flow 6: change the days of a completed weekly task

Precondition: empty list, clock at `2026-07-14T08:00:00` (Tuesday).

1. Create `Sacar la basura` with **Días de la semana** `martes` and `jueves`:
   `pendiente` (created on an occurrence day).
2. At `2026-07-14T12:00:00`, tap its checkbox: `en espera`, bar at 0 (it
   covered Tuesday).
3. Advance the clock to `2026-07-16T06:00:00` (Thursday): `pendiente`.
4. Edit it to **Días de la semana** `sábado`: it becomes `en espera`, bar at 50
   (42 of 84 hours from the completion to Saturday).
5. Edit it to **Días de la semana** `miércoles`: it becomes `atrasada` (the
   first new occurrence after the covered Tuesday was Wednesday the 15th).
6. Edit it to **Días del mes** `16`: it becomes `pendiente`.
7. Reload: it stays `pendiente`, and when opened it shows **Días del mes**
   `16`.

## Flow 7: change the kind and the mode

Precondition: empty list, clock at `2026-07-13T10:00:00` (Monday).

1. Create `Regar` with **Intervalo** every `1` **días** and tap its checkbox:
   `en espera`.
2. Create `Renovar DNI` with **No se repite** and Fecha límite `2026-07-10`:
   `atrasada`.
3. Create `Limpiar horno` with **Intervalo** every `3` **días** (never
   completed): `pendiente`.
4. Create `Barrer` with **Intervalo** every `2` **días** and tap its checkbox:
   `en espera`.
5. Advance the clock to `2026-07-14T09:00:00` (Tuesday): **Regar** is still
   `en espera`.
6. Edit **Regar** to **Días de la semana** `martes` and `jueves`: it becomes
   `pendiente` (Monday's completion counts as covered until that day; it is
   Tuesday's turn).
7. Tap the **Regar** checkbox: `en espera` until Thursday.
8. Edit **Renovar DNI** to **Intervalo** every `2` **días**: it becomes
   `pendiente` (recurring task never completed).
9. Edit **Limpiar horno** to **No se repite** with Fecha límite `2026-07-13`:
   it becomes `atrasada`.
10. Edit **Barrer** to **No se repite** with no due date: **Barrer** becomes
    completed (it already had a completion), struck through, at the end of the
    list.
11. Reload: the list is **Limpiar horno** (`atrasada`), **Renovar DNI**
    (`pendiente`), **Regar** (`en espera`, completed) and **Barrer**
    (completed): the completed ones at the end, from the most recently
    completed to the oldest.
12. Turn off the **Mostrar completadas** check: the list is **Limpiar horno**,
    **Renovar DNI**.

## Flow 8: editing changes the order

Precondition: empty list, clock at `2026-07-15T06:00:00` (Wednesday).

1. Create `Regar` with **Intervalo** every `4` **horas** and tap its checkbox.
2. At `2026-07-15T06:01:00`, create `Pagar` with **No se repite** and Fecha
   límite `2026-07-14`.
3. Advance the clock to `2026-07-15T12:00:00`: the list is **Pagar**
   (`atrasada`), **Regar** (`pendiente`).
4. Edit **Pagar** with Fecha límite `2026-07-20`: the list is **Regar**,
   **Pagar**, both `pendiente`.
5. Edit **Pagar** with Fecha límite `2026-07-14`: the list goes back to
   **Pagar**, **Regar**.

## Flow 9: delete a task

Precondition: empty list, clock at `2026-07-13T08:00:00`.

1. Create `Regar` (**Intervalo** every `2` **días**) and tap its checkbox;
   create `Pagar la luz` (**No se repite**, no due date).
2. Tap the **Regar** row and tap **Borrar tarea**: the confirmation dialog
   appears with the title `Regar` and the buttons **Borrar** and
   **Cancelar**.
3. Tap **Cancelar**: the dialog closes, the edit panel stays open with
   **Regar**'s data. Close the panel: **Regar** is still in the list,
   `en espera`.
4. Tap the **Regar** row, **Borrar tarea** and **Borrar**: the dialog and the
   panel close and the **Regar** row disappears. **Pagar la luz** is still
   `pendiente`.
5. Reload: only **Pagar la luz** is seen.
6. Delete **Pagar la luz** the same way: the list is left empty. Reload: it is
   still empty.

## Flow 10: two devices edit different fields

Precondition: empty list, clock at `2026-07-13T08:00:00` on A and on B.

1. On A, create `Regar` with **Intervalo** every `2` **días**. B sees it
   appear.
2. B offline. On B, edit **Regar** to **Días de la semana** `martes` and
   `jueves`.
3. On A, edit the title to `Regar plantas`.
4. B gets the connection back.
5. On A and on B, the row is named **Regar plantas** and is `en espera`
   (weekly Tuesday and Thursday, created on Monday). When opened on A:
   **Días de la semana** `martes` and `jueves`.

## Flow 11: the same field, the last to arrive wins

Precondition: empty list, clock at `2026-07-13T08:00:00` on A and on B.

1. On A, create `Pagar` with **No se repite** and no due date.
2. B offline. On B, edit the title to `Pagar el gas`.
3. On A, edit the title to `Pagar la luz`.
4. B gets the connection back: on A and on B the row is named **Pagar el gas**
   (B's change arrived last).

## Flow 12: deletion wins

Precondition: empty list, clock at `2026-07-13T08:00:00` on A and on B.

1. On A, create `Regar` with **Intervalo** every `2` **días** and `Barrer`
   with **Intervalo** every `1` **días**.
2. B offline. On B, edit the title of **Regar** to `Regar plantas` and tap the
   **Barrer** checkbox.
3. On A, delete **Regar** and **Barrer** (with confirmation).
4. B gets the connection back: on A and on B the list is left empty;
   **Regar plantas** and **Barrer** do not reappear.
5. Reload A and B: the list is still empty.

## Flow 13: the task is deleted while open on the other device

Precondition: empty list, clock at `2026-07-13T08:00:00` on A and on B.

1. On A, create `Regar` with **Intervalo** every `2` **días**.
2. On B, tap the **Regar** row: the edit panel is open.
3. On A, delete **Regar** (with confirmation).
4. On B, the edit panel closes by itself and the **Regar** row disappears.

## Flow 14: changing the kind leaves no residual value from another device

Spec §7: when the kind changes, the task keeps only the fields of the kind the
panel shows.

Precondition: empty list, clock at `2026-07-13T08:00:00` on A and on B.

1. On A, create `Renovar DNI` with **No se repite** and Fecha límite
   `2026-07-20`: `pendiente`. B sees it appear.
2. B offline. On B, edit **Renovar DNI** changing only the Fecha límite to
   `2026-07-10`.
3. On A, edit **Renovar DNI** to **Intervalo** every `2` **días**.
4. B gets the connection back: on A and on B, **Renovar DNI** is `pendiente`
   (recurring task never completed; the due date B left does not count).
5. On A, edit **Renovar DNI** to **No se repite** leaving **Fecha límite**
   empty and save.
6. On A and on B, **Renovar DNI** is `pendiente`, not `atrasada` (the date
   `2026-07-10` did not reappear). When opened on A, **No se repite** with
   **Fecha límite** empty. Close.
7. Reload A and B: the same as in step 6.

Mirror, with an empty list and the same clock:

8. On A, create `Regar` with **Intervalo** every `2` **días**.
9. B offline. On B, edit **Regar** changing only **Cada** to `6` **horas**.
10. On A, edit **Regar** to **No se repite** with Fecha límite `2026-07-20`.
11. B gets the connection back: on A and on B, **Regar** is `pendiente`.
12. On A, edit **Regar** to **Días de la semana** `martes` and `jueves`.
13. Reload A and B. When opening **Regar** on B: **Días de la semana** with
    `martes` and `jueves` at `aria-pressed=true` and the rest at `false` (not
    **Intervalo** every `6` **horas**).
