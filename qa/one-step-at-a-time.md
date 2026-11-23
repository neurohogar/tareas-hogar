# QA: one step at a time

Verifies, through the interface only:

- the step fields of the edit panel: below **Primer paso**, a one-line field for each additional step, with the label **Paso 2**, **Paso 3**…, a **Quitar** button on each and at the end **Agregar paso**; Enter in those fields saves; spaces are trimmed; empty or only-space steps are discarded without an error and the ones below move up; no maximum length or number; the order of the **Tarea** section;
- that the row of a `pending` or `overdue` task shows a single step, on its own line below the title (`Primer paso: ` at step 1, `Paso: ` at another, without a number or total and without the whole list), and that with two steps or more that line has the text buttons **Paso anterior** (not at step 1) and **Hecho**; with a single step, no buttons;
- **Hecho** and **Paso anterior**: move the step one at a time, do not open the panel, do not go through **Cambios sin guardar** and do not open a notice; **Hecho** at the last step completes the task like the checkbox (same notice with **Deshacer**, disabled the same as the checkbox) and the task goes back to step 1;
- that undo (notice, Historial or checkbox) gives back the step the task was on;
- that the line and the buttons disappear and come back by themselves with the status of each moment, and that the steps and their progress do not change with any other action, neither the status nor the order;
- that they are not shown in the Historial or in the undo notice;
- **Cambios sin guardar** with the steps and the two-devices case.

Covers spec §4.1 (**Pasos**, `pasos`, `pasoActual`), §4.4 (`pasoAlCompletar`), §5.4 (undo), §6.1 (row and buttons), §6.2 (step fields, section order, **Cambios sin guardar**) and §7 (conflicts by field).

Out of scope: the status and order rules themselves (`qa/one-off.md`, `qa/recurring-relative.md`, `qa/recurring-calendar.md`, `qa/schedule.md`, `qa/pending-order.md`) and the **Primer paso** field alone (`qa/first-step.md`).

## Environment

- Firebase Emulator Suite (Auth + Firestore) with clean data at the start of each flow.
- Each flow starts from a new browser context, signed in with the `qa@example.com` account of the Auth Emulator (Flow 1 of `qa/recurring-relative.md`).
- Simulated browser clock (`page.clock`) installed **before** opening the app, at the local time that each flow indicates (zone `America/Argentina/Buenos_Aires`), stopped (`page.clock.pauseAt`).
  - "At X" and "Advance the clock to X" mean advancing it to X (`page.clock.runFor` or `fastForward`) and waiting for the screen to update by itself, without reloading.
- Creating a task: tap **+**, type the title, choose the **Se repite** option that the step indicates (controls of `qa/one-off.md`, `qa/recurring-relative.md` and `qa/recurring-calendar.md`), schedule as in `qa/schedule.md`, type **Primer paso** and the steps that the step indicates (**Agregar paso** and type in **Paso 2**, **Paso 3**…) and save.
- "Postpone X with option O": tap row X and choose O among the **Posponer** options (`qa/postpone.md`). "Pause X" and "Resume X": tap row X and the **Pausar** or **Reanudar** button of the panel (`qa/pause.md`); only recurring tasks are paused.
- **Mostrar completadas** and **Mostrar pausadas** stay off unless the flow says to turn them on.
- **Two devices** (Flow 8): two contexts A and B with the same account and the same simulated clock. "B offline" is `browserContext.setOffline(true)`; "B is back online" means setting it online again and waiting for both screens to update by themselves, and in addition ~10 s idle before looking.

Reference week: Monday 2026-11-09, Tuesday 10, Wednesday 11, Thursday 12, Friday 13, Saturday 14, Sunday 15.

**Switches.** **Mostrar completadas** and **Mostrar pausadas** are the items **Completadas** and **Pausadas** of the **⋮** menu (`qa/menu-toggles.md`), not checks above the list: to turn one on or off, open the **Menú** and tap the item (the menu closes). A completed one-off task never has a row in **Pendientes**, with **Completadas** on or off: it is reached from the **Historial**.

## Observable contract

- **Panel fields**: in the **Tarea** section (**Nueva tarea** and **Editar tarea**), from top to bottom: the title with the emoji button (and **Quitar emoji** below), **Primer paso**, a one-line text field (role `textbox`, without `placeholder`) for each additional step, with the label **Paso 2**, **Paso 3**… and its **Quitar** button, the **Agregar paso** button, the **Nota**. **Agregar paso** adds an empty field at the end (with the label of the next number) and gives it the focus. **Quitar** removes that field and the ones below renumber their labels. The panel does not show or choose the step the task is on.
- **Row line**: a text on its own line below the title: `Primer paso: ` followed by the text if the task is at step 1, `Paso: ` followed by the text if it is at another. "The row says P" means that this text is exactly `Primer paso: P` (or `Paso: P`). It never contains the whole list, or a step number, or a total. A row without a first step, or that does not show it, does not contain `Primer paso` or `Paso:`.
- **Row buttons**: inside that same line, only if the task has two steps or more: **Paso anterior** (not shown at step 1) and **Hecho**, in that order, both small text buttons (role `button`). A one-step task has neither.
- **Style**: the line has the same computed `color` and `font-size` as the schedule text; normal `font-weight`, no underline or own color on the text or on the buttons; the row does not change its background. No truncation (no `text-overflow: ellipsis`, no `-webkit-line-clamp`, no `max-height`): a long text is shown in full on several lines.
- **Tap**: tapping the step text (outside the buttons) is tapping the row: it opens **Editar tarea**. Tapping **Hecho** or **Paso anterior** does not open the panel, does not open **Cambios sin guardar** and does not open a notice, except **Hecho** at the last step (completion notice).
- **Notice, Historial**: those of `qa/history-undo.md`; neither contains the text of a step, `Primer paso` or `Paso:`.
- **List**: "The list is A, B, C" means exactly those rows, from top to bottom.

## Flow 1: the step fields in the panel, and creating

Precondition: empty list, clock at `2026-11-13T10:00:00` (Friday).

1. Tap **+**. In **Nueva tarea** there are **Primer paso** and **Agregar paso**, and no **Paso 2** field. The vertical order of the section is: **Título** (with the emoji button), **Primer paso**, **Agregar paso**, **Nota**.
2. Type `Lavar` in **Título** and `Separar la ropa blanca` in **Primer paso**. Tap **Agregar paso**: the empty **Paso 2** field appears, with the focus, a **Quitar** button next to it, and **Agregar paso** stays below it. Type `Poner el lavarropas`. Tap **Agregar paso** again: **Paso 3** appears; type `Tender la ropa`. The order is: **Primer paso**, **Paso 2**, **Paso 3**, **Agregar paso**, **Nota**.
3. With the focus in **Paso 3**, press Enter: the panel saves and closes. The row of `Lavar` says `Primer paso: Separar la ropa blanca` and has the **Hecho** button (without **Paso anterior**). The row does not contain `Poner el lavarropas` or `Tender la ropa`.
4. Tap the `Lavar` row: **Editar tarea** shows **Primer paso** `Separar la ropa blanca`, **Paso 2** `Poner el lavarropas` and **Paso 3** `Tender la ropa`, each with its **Quitar**. There is no control or text that says which step the task is on. Reload: it stays the same.
5. Create `Barrer` with **No se repite**, without a due date and only **Primer paso** `Juntar la basura`: the row says `Primer paso: Juntar la basura` and has no buttons.
6. Create `Regar` with **Intervalo** every `2` **días**, **Primer paso** `Llenar la regadera` and **Paso 2** `Regar los helechos`, and another `Basura` with **Días de la semana** and **martes**, **Primer paso** `Atar la bolsa llena` and **Paso 2** `Bajar la basura`: `Regar` (pending) says `Primer paso: Llenar la regadera` and has **Hecho**; `Basura` is `waiting` until Tuesday and shows no line or buttons (the line is not shown when `waiting`; Flow 5).
7. Create `Planchar` without touching **Primer paso** or the steps: the row contains no `Paso` or buttons, as before steps existed.

## Flow 2: edit, trim, discard, remove and no maximums

Precondition: `Lavar` (**No se repite**, without a due date) with `Separar la ropa blanca`, `Poner el lavarropas` and `Tender la ropa`, clock at `2026-11-13T10:00:00`.

1. Open the row, type in **Paso 2** `  Juntar las llaves  ` (with spaces at the start and at the end) and save. Reopen: **Paso 2** has exactly `Juntar las llaves`.
2. Paste into **Paso 2** a two-line text (`uno`, line break, `dos`): the field stays on a single line, and Enter saves instead of typing a line break. Save and reopen: the text has no line break.
3. Empty **Paso 2** and save: reopening shows **Primer paso** the same, **Paso 2** with `Tender la ropa` (the one below moved up) and no **Paso 3**.
4. Type only spaces in **Paso 2** and save: there is no error or rejection message; reopening shows `Separar la ropa blanca` and no **Paso 2**. Add `Poner el lavarropas` again with **Agregar paso** and save.
5. Empty **Primer paso** and save: the row says `Primer paso: Poner el lavarropas` and reopening shows **Primer paso** `Poner el lavarropas` (step 2 moved up to first step) and the rest of the steps shifted one place up.
6. Open, add two steps with **Agregar paso** (`Tender la ropa` and `Guardar la ropa`) and save. Open, tap **Quitar** next to **Paso 2** and save: the step disappears and the ones below move up; the field names stay **Paso 2**, **Paso 3** without number gaps. Tap **Agregar paso** and save without typing: reopening does not show the empty field that was added.
7. Paste into a step a text of 5000 characters and save: it is accepted without an error or warning. Reopen: it has all 5000.
8. Add 30 steps with **Agregar paso** (typing `p1` … `p30`) and save: it is accepted without an error or warning; reopening shows the 30 in order.
9. Type as a step a long text with spaces of about 160 characters (`Abrir el cajón de abajo y sacar toda la ropa blanca y separarla en dos pilas: la que va con agua caliente y la que no se mezcla con nada de color oscuro ni delicado`) and, on a phone (390 × 844), take the task to that step (Flow 3): the row shows it in full, on several lines, without cutting or horizontal scroll.

## Flow 3: advance and go back from the row

Precondition: empty list, clock stopped at `2026-11-13T10:00:00`. Create `Lavar` (**No se repite**, without a due date) with `Separar la ropa blanca`, `Poner el lavarropas`, `Tender la ropa`; and `Barrer` (**No se repite**, without a due date, without steps) with schedule **Desde** `08:00` **Hasta** `12:00`.

1. The row says `Primer paso: Separar la ropa blanca` and has **Hecho**, without **Paso anterior**.
2. Tap **Hecho**: the row says `Paso: Poner el lavarropas` and has **Paso anterior** and **Hecho** (in that order). The panel did not open and no notice appeared. The row does not contain `Tender la ropa` or a step number.
3. Tap **Paso anterior**: the row says `Primer paso: Separar la ropa blanca`, without **Paso anterior**. Tap **Hecho** twice: the row says `Paso: Tender la ropa`.
4. Reload the page: the row still says `Paso: Tender la ropa` (the step was saved).
5. Tap the text `Paso: Tender la ropa` (not a button): **Editar tarea** of `Lavar` opens, without any control for the current step. Close it without changes (it closes directly). Tapping **Hecho** or **Paso anterior** does not go through **Cambios sin guardar** (see Flow 7).
6. **Style**: the text of the line has the same `color` and `font-size` as the schedule text of the `Barrer` row; the buttons have no own color or highlighted background; the row does not change its background.
7. Tap **Hecho** on `Paso: Tender la ropa` (last step): see Flow 4.

## Flow 4: «Hecho» at the last step completes the task

Precondition: clock at `2026-11-13T10:00:00`, **Mostrar completadas** turned on. `Regar` with **Intervalo** every `2` **días**, `Llenar la regadera` and `Regar los helechos`; `Cambiar foco` with **No se repite**, without a due date, and the steps `Sacar la escalera`, `Cambiar el foco`.

1. On `Regar`, tap **Hecho**: the row says `Paso: Regar los helechos`. Tap **Hecho** again: the notice `Completaste «Regar»` appears with **Deshacer** and the «Vuelve …» line (the same as when tapping its checkbox). The row becomes `waiting` (completed), without a step line or buttons. The notice does not contain `Paso`.
2. Tap **Deshacer** within the 5 seconds: `Regar` goes back to `pending` at the last step: it says `Paso: Regar los helechos` with **Paso anterior** and **Hecho**.
3. Tap **Paso anterior**, tap **Hecho** again and **Hecho** once more (completes): wait for the notice to pass. Go to **Historial** and delete the completion: `Regar` goes back to `pending` and says `Paso: Regar los helechos`.
4. On `Cambiar foco`, tap **Hecho** and **Hecho** (completes): its row disappears (a completed one-off task has no row). Wait for the notice to pass, go to **Historial** and delete the completion (confirming): the row goes back to `pending` at the last step.
5. Set the time to `2026-11-13T10:00:00` right before tapping the checkbox (with the clock paused, time runs a few ms per assertion, and if it is not set, advancing to `2026-11-15T10:00:00` does not make the interval expire). Tap the checkbox of `Regar` while at step 1 (without using **Hecho**): it completes anyway, with the same notice. Advance the clock to `2026-11-15T10:00:00`: `Regar` goes back to `pending` and says `Primer paso: Llenar la regadera` with **Hecho** and without **Paso anterior** (the task that comes back starts from step 1). Repeat: tap **Hecho** (step 2), set the time to `2026-11-15T10:00:00` right before tapping the checkbox, complete with it and advance to `2026-11-17T10:00:00`: when it comes back, it also starts from step 1.
6. Tap **Deshacer** in the notice of a completion made with the checkbox at step 2 of `Regar`: `Regar` goes back to saying `Paso: Regar los helechos` (the step it was on).
7. «Hecho» at the last step with the checkbox disabled: see Flow 5.

## Flow 5: where it is shown and when it disappears and comes back

Precondition: empty list, clock stopped at `2026-11-13T10:00:00` (Friday). Turn on **Mostrar completadas**.

1. Create `Cambiar foco` (**No se repite**, without a due date) with `Sacar la escalera` and `Cambiar el foco`; `Pagar` (**No se repite**, due date `2026-11-10`) with `Buscar la factura` and `Pagar en el banco`; `Regar` (**Intervalo** every `8` **horas**) with `Llenar la regadera` and `Regar los helechos`. The three (`Pagar` overdue, the others pending) show `Primer paso: …` and **Hecho**.
2. Tap **Hecho** on `Pagar`: it says `Paso: Pagar en el banco`, with **Paso anterior** and **Hecho**. It stays `overdue` and in the same place in the list.
3. Tap the checkbox of `Cambiar foco` (at step 1): it completes and the row stops showing the line and buttons. Undo: it comes back at step 1.
4. With the clock still at `2026-11-13T10:00:00`: postpone `Cambiar foco` with the option **3 horas**: it becomes `waiting` and the row does not contain `Primer paso`, `Paso:` or buttons. Postpone `Pagar` with **Hasta mañana**: neither. Tap the checkbox of `Regar`: `waiting`, without a line or buttons.
5. Advance the clock to `2026-11-13T13:01:00`: `Cambiar foco` goes back to `pending` with the line and the buttons, at step 1; `Regar` and `Pagar` still have no line. Advance to `2026-11-13T17:59:00`: `Regar` still has no line. At `2026-11-13T18:00:00`: `Regar` goes back to `pending` and says `Primer paso: Llenar la regadera` with **Hecho**.
6. Tap the `Regar` row and **Pausar**; turn on **Mostrar pausadas**: `Regar` is shown paused (it says «Pausada»), without a step line or buttons. Open, **Reanudar**: it comes back `pending` with its line and buttons.
7. Create `Basura` with **Días de la semana** and **martes** with `Atar la bolsa llena` and `Bajar la basura`, with the clock on Friday: it is `waiting` until Tuesday and shows no line or buttons. Advance to `2026-11-17T09:00:00`: `pending`, with `Primer paso: Atar la bolsa llena` and **Hecho**.
8. Create `Llamar` (**No se repite**, without a due date, schedule **Desde** `08:00` **Hasta** `09:00`) with `Buscar el número` and `Marcar`: with the clock at `2026-11-17T09:00:00` it is outside its window: without a line or buttons. Advance to `2026-11-18T08:00:00`: `pending`, with its line and buttons.
9. **Disabled checkbox**: create `Lavar` (**No se repite**, due date `2026-11-10`, schedule **Desde** `08:00` **Hasta** `11:00`) with `Separar la ropa blanca` and `Poner el lavarropas`. With the clock at `2026-11-13T07:00:00`: `overdue`, checkbox disabled, it says `Primer paso: Separar la ropa blanca`, and **Hecho** is enabled (it is not the last step): tapping it leads to `Paso: Poner el lavarropas`. Now **Hecho** is disabled (it is the last step, like the checkbox) and completes nothing when tapped; **Paso anterior** stays enabled. Advance to `2026-11-13T08:00:00`: checkbox and **Hecho** become enabled.

## Flow 6: editing the steps and the progress

Precondition: `Lavar` with `Separar la ropa blanca`, `Poner el lavarropas`, `Tender la ropa`, already at step 3 (Flow 3), clock at `2026-11-13T10:00:00`.

1. Open, change the text of **Paso 2** and save: the row still says `Paso: Tender la ropa` (editing does not change the step the task is on).
2. Open, empty **Paso 3** and save: now the task has two steps and the row says `Paso: <the text of Paso 2>` (it is at the last), with **Paso anterior** and **Hecho**. Open, **Agregar paso** and type `Guardar la ropa` in **Paso 3**, save: the row goes back to `Paso: Guardar la ropa` (the number was kept).
3. With the task at step 3, open, empty **Paso 3** and **Paso 2** and save: a single step remains; the row says `Primer paso: Separar la ropa blanca` without buttons. Open, add two steps again and save: the row shows `Paso: ` followed by the last one, at step 3 again.
4. With the task at step 3 and two steps, tap **Hecho**: it completes the task (notice). Undo.
5. Change the kind (**Intervalo** every `3` **días**, **Días de la semana** and **martes**, **No se repite**), saving in each one: reopen; the steps are the same and the row stays at the same step. Postponing, pausing and resuming do not change the steps or the step the task is on either.
6. Reload: everything is kept. There is no control on any screen that shows the number of the current step or the total.

## Flow 7: what does not change and what does not show it; Cambios sin guardar

Precondition: empty list, clock stopped at `2026-11-13T10:00:00`.

1. Create `Barrer`, `Lavar` and `Planchar`, all with **No se repite** and without a due date. Note the order and the text of each row.
2. Type in `Lavar` a **Primer paso** and two more steps and save; tap **Hecho** on the row. The order of the list is the same as the one noted; the rows of **Barrer** and **Planchar** are identical to before. Repeat with `Barrer` and remove them from `Lavar`: the order does not change.
3. Give `Lavar` the emoji `🧺`: the title says `🧺 Lavar` and the step line goes on its own line below. The title does not include any step.
4. Tap **Hecho** until `Lavar` is completed: the notice says `Completaste «🧺 Lavar»` without any step. In **Historial** the entry says `🧺 Lavar` with its time, without any step.
5. **Cambios sin guardar**: open `Lavar` (completed) from the **Historial** and remove **Paso 3** from it so that it has **Primer paso** and **Paso 2**; save (`Lavar` with **Primer paso** `Separar la ropa blanca` and **Paso 2** `Poner el lavarropas`): open, change **Paso 2** to `Juntar las llaves` and tap the X: the notice «Tenés cambios sin guardar» appears; **Descartar**: nothing changed.
6. Open, change **Paso 2** and type `Poner el lavarropas` again, and tap the X: it closes directly. Type it with spaces at the start and at the end: it closes directly.
7. Open, empty **Paso 2**: notice; **Descartar**. Repeat with only spaces: notice; **Descartar**.
8. Open, tap **Agregar paso** and tap the X without typing: it closes directly. Repeat typing `Tender la ropa`: notice; **Descartar**. Repeat typing only spaces: it closes directly.
9. Open, tap **Quitar** on **Paso 2**: notice; **Descartar**. Tap **Agregar paso** and **Quitar** of the field just added: it closes directly.
10. Tap **+**, tap **Agregar paso** and the X: it closes directly. Tap **+**, **Agregar paso**, type `Poner el lavarropas` and the X: notice; **Descartar**.
11. Delete the `Lavar` entry from the **Historial** (confirming): it goes back to `pending` at the last step. With the panel of `Lavar` closed, tap **Hecho** and **Paso anterior** on the row: **Cambios sin guardar** does not appear and the panel does not open.

## Flow 8: two devices

Precondition: empty list, clock at `2026-11-13T10:00:00` on A and on B.

1. On A, create `Lavar` with **No se repite**, without a due date, `Separar la ropa blanca`, `Poner el lavarropas` and `Tender la ropa`. B sees it appear.
2. B offline. On B, tap **Hecho**. On A, tap **Hecho**. B is back online: on A and on B the row says `Paso: Poner el lavarropas` (not `Tender la ropa`: two **Hecho** at the same step leave the task at the next step).
3. B offline. On B, tap **Hecho** (it stays at step 3). On A, open the panel, change **Paso 2** to `Juntar las llaves` and save. B is back online: on A and on B the task is at step 3 and the panel shows **Paso 2** `Juntar las llaves` (the progress and the edit were kept).
4. B offline. On B, change **Paso 2** to `Buscar el detergente` and save. On A, tap **Paso anterior**. B is back online: the row says the same step on A and on B (that of A's progress, now at step 2) and the panel shows `Buscar el detergente`.
5. B offline. On B, change **Paso 2** to `Buscar la esponja` and save. On A, change **Paso 2** to `Poner el agua a calentar` and save. B is back online: on A and on B **Paso 2** says `Buscar la esponja` (the last change to arrive is that of B).
6. B offline. On B, change **Paso 2** to `Barrer abajo` and save. On A, change **Paso 3** to `Guardar la ropa` and save. B is back online: on A and on B the list of steps is that of the last change to arrive as a whole (that of B), without mixing a step from each.
7. B offline. On B, change **Primer paso** to `Juntar las llaves` and save. On A, change **Paso 2** to `Tender la ropa` and save. B is back online: on A and on B, **Primer paso** says `Juntar las llaves` and **Paso 2** `Tender la ropa` (different fields, both changes were kept).
8. B offline. On B, change **Paso 2** to `Barrer abajo` and save. On A, open the row and save without changing anything. B is back online: on A and on B **Paso 2** says `Barrer abajo` (saving without changes did not overwrite the change of B).
