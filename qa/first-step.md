# QA: first step of the task

Verifies, through the interface only:

- the **Primer paso** field of the edit panel: one line, without example text, right below the title (with its emoji) and before the note; it starts empty when creating and with the current value when editing; Enter saves; spaces are trimmed; empty or only spaces leaves the task without a first step; it has no maximum length and never rejects a save;
- that the row of a `pending` or `overdue` task with a first step says, on its own line below the title, `Primer paso: ` followed by the text, in full (on several lines if needed), in the same size and color as the schedule and without emphasis; and that tapping it is tapping the row;
- that `waiting` rows (completed, postponed, because of their schedule or calendar ones before their occurrence), completed ones and paused ones do not show the first step, and that the line disappears and comes back by itself with the status of each moment (completing, undoing, postponing, pausing, resuming, the passing of time);
- that the first step has no status: completing, postponing, pausing, resuming, undoing and changing the kind or mode do not delete or change it, a recurring task that comes back shows the same one, and there is no way to mark it as done nor a progress indicator;
- that it does not change the status or the order of the list, and that the name of the task is still emoji and title;
- that it is not shown in the Historial or in the undo notice;
- **Cambios sin guardar** with the field and the two-devices case.

Covers spec §4.1 (`primerPaso`, **Primer paso**), §6.1 (row), §6.2 (**Primer paso** field, order of the sections, **Cambios sin guardar**) and §7 (conflicts by field).

Out of scope: the status and order rules themselves (`qa/one-off.md`, `qa/recurring-relative.md`, `qa/recurring-calendar.md`, `qa/schedule.md`, `qa/pending-order.md`), which the `.feature` files cover; the content of `qa/emoji-and-note.md` beyond its position relative to the field.

## Environment

- Firebase Emulator Suite (Auth + Firestore) with clean data at the start of each flow.
- Each flow starts from a new browser context, signed in with the `qa@example.com` account of the Auth Emulator (Flow 1 of `qa/recurring-relative.md`).
- Simulated browser clock (`page.clock`) installed **before** opening the app, at the local time that each flow indicates (zone `America/Argentina/Buenos_Aires`), stopped (`page.clock.pauseAt`).
  - "At X" and "Advance the clock to X" mean advancing it to X (`page.clock.runFor` or `fastForward`) and waiting for the screen to update by itself, without reloading.
- Creating a task: tap **+**, type the title, choose the **Se repite** option that the step indicates (controls of `qa/one-off.md`, `qa/recurring-relative.md` and `qa/recurring-calendar.md`), schedule as in `qa/schedule.md`, type the **Primer paso** if the step gives it and save.
- "Postpone X with option O": tap row X and choose O among the **Posponer** options (`qa/postpone.md`). "Pause X" and "Resume X": tap row X and the **Pausar** or **Reanudar** button of the panel (`qa/pause.md`); only recurring tasks are paused.
- **Mostrar completadas** and **Mostrar pausadas** stay off unless the flow says to turn them on.
- **Two devices** (Flow 8): two contexts A and B with the same account and the same simulated clock. "B offline" is `browserContext.setOffline(true)`; "B is back online" means setting it online again and waiting for both screens to update by themselves.

Reference week: Monday 2026-11-09, Tuesday 10, Wednesday 11, Thursday 12, Friday 13, Saturday 14, Sunday 15.

**Switches.** **Mostrar completadas** and **Mostrar pausadas** are the items **Completadas** and **Pausadas** of the **⋮** menu (`qa/menu-toggles.md`), not checks above the list: to turn one on or off, open the **Menú** and tap the item (the menu closes). A completed one-off task never has a row in **Pendientes**, with **Completadas** on or off: it is reached from the **Historial**.

## Observable contract

- **Primer paso field**: in the panel (**Nueva tarea** and **Editar tarea**), **Tarea** section, a one-line text field (role `textbox`, label **Primer paso**) without `placeholder`. In the order of the section, from top to bottom: the title with the emoji button, the **Primer paso** field, the **Nota**. When creating it is empty; when editing it shows the saved value. Enter inside the field saves, as in the **Título** field.
- **Row line**: inside the task row, a text that starts with `Primer paso: ` and continues with the saved text, on its own line below the title. "The row says P" means that this text is exactly `Primer paso: P`. A row without a first step, or that does not show it, does not contain `Primer paso`.
- **Line style**: the same computed `color` and the same computed `font-size` as the schedule text of the same row or of another; normal `font-weight`, no underline or own color; the row does not change its background. It has no truncation (no `text-overflow: ellipsis`, no `overflow: hidden` or `max-height` that cut): the full text is visible, on several lines if needed.
- **No controls of its own**: the line has no button, checkbox or field; the only checkbox of the row is that of the task. Tapping the line is tapping the row: it opens the **Editar tarea** panel.
- **Notice, Historial**: those of `qa/history-undo.md`; neither contains `Primer paso` or the text of the first step.
- **List**: "The list is A, B, C" means exactly those rows, from top to bottom.

## Flow 1: the field in the panel and creating with a first step

Precondition: empty list, clock at `2026-11-13T10:00:00` (Friday).

1. Tap **+**. In the **Nueva tarea** panel, the **Primer paso** field exists, is empty and has no example text. In the **Tarea** section, the vertical order is: **Título** (with the emoji button), **Primer paso**, **Nota**.
2. Type `Lavar` in **Título** and `Separar la ropa blanca` in **Primer paso**. With the focus in **Primer paso**, press Enter: the panel saves and closes. The row of `Lavar` says `Primer paso: Separar la ropa blanca`, below the title.
3. Tap **+**, type `Barrer` (**No se repite**, without a due date) and save without touching **Primer paso**: the row of `Barrer` does not contain `Primer paso`.
4. Tap **+**, choose **Intervalo** every `2` **días**, title `Regar`, **Primer paso** `Llenar la regadera`, and save: the row says `Primer paso: Llenar la regadera`. Repeat with **Días de la semana** and **martes** (`Basura`, `Atar la bolsa llena`): each row shows its line.
5. Tap the `Lavar` row: the **Editar tarea** panel shows **Primer paso** with `Separar la ropa blanca`. Tap the `Barrer` row: **Primer paso** is empty. Reload: the rows stay the same.

## Flow 2: edit, trim, empty and long text

Precondition: list with `Lavar` (**No se repite**, without a due date) with **Primer paso** `Separar la ropa blanca`, clock at `2026-11-13T10:00:00`.

1. Open the row, type in **Primer paso** `  Juntar las llaves  ` (with spaces at the start and at the end) and save: the row says `Primer paso: Juntar las llaves`. Reopen: the field has exactly `Juntar las llaves`.
2. Paste into **Primer paso** a two-line text (`uno`, line break, `dos`): the field stays on a single line, without a line break (the browser flattens the paste), and there is no way to type a line break with Enter (Enter saves). Save: the text of the row has no line break between `uno` and `dos`. Reopen: the field is still on one line.
3. Empty the field and save: the row no longer contains `Primer paso`. Reopen: **Primer paso** is empty. Reload: still without a line.
4. Type `Separar la ropa blanca` again and save. Open, type only spaces in **Primer paso** and save: there is no error or rejection message; the row no longer contains `Primer paso` and reopening shows the empty field.
5. Paste into **Primer paso** a text of 5000 characters (for example `a` repeated) and save: it is accepted without a length error or warning. Reopen: it has the 5000 characters.
6. Type in **Primer paso** a long text with spaces, of about 160 characters (`Abrir el cajón de abajo, sacar toda la ropa blanca y separarla en dos pilas: la que va con agua caliente y la que no se mezcla con nada de color oscuro ni delicado`), and save. On a phone (390 × 844): the row shows all the text, on several lines, without `…` or cutting; the visible text of the line is exactly `Primer paso: ` plus that text.

## Flow 3: the line on the row (position, style, tap)

Precondition: empty list, clock at `2026-11-13T10:00:00`. Create `Pagar la luz` with **No se repite**, due date `2026-11-10` and **Primer paso** `Buscar la factura`; and `Cambiar foco` with **No se repite**, without a due date, schedule **Desde** `08:00` **Hasta** `12:00` and **Primer paso** `Sacar la escalera`.

1. **Pagar la luz** is `overdue` and **Cambiar foco** `pending`: the row of **Pagar la luz** says `Primer paso: Buscar la factura`, and that of **Cambiar foco**, `Primer paso: Sacar la escalera`, each on its own line, below the title (the line is lower than the title on the screen).
2. The text of the line of **Pagar la luz** has the same `color` and `font-size` as the schedule text of **Cambiar foco**, is not bold or underlined and is not reddish. The row did not change its background compared with a row without a first step.
3. The rows have no new field or button: the only checkbox of the row is that of the task, and there is no «done» mark or progress indicator for the first step.
4. Tap the line `Primer paso: Sacar la escalera`: the **Editar tarea** panel of **Cambiar foco** opens (the same as tapping the title). Close it without changes.
5. Tap the checkbox of **Cambiar foco**: it completes the task; the line is not marked or changed in any way before disappearing (see Flow 4).

## Flow 4: where it is shown and when it disappears and comes back

Precondition: empty list, clock stopped at `2026-11-13T10:00:00` (Friday). Turn on **Mostrar completadas**.

1. Create `Cambiar foco` with **No se repite**, without a due date and **Primer paso** `Sacar la escalera`; `Pagar` with **No se repite**, due date `2026-11-10` and **Primer paso** `Buscar la factura`; `Regar` with **Intervalo** every `8` **horas** and **Primer paso** `Llenar la regadera`.
2. `Pagar` (overdue) and `Cambiar foco` (pending) show their line; `Regar` (never completed: pending) too.
3. Tap the checkbox of **Regar**: it becomes `waiting`, completed, and its row no longer contains `Primer paso`. Advance the clock to `2026-11-13T17:59:00`: still without a line. Advance to `2026-11-13T18:00:00`: **Regar** goes back to `pending` and its row says `Primer paso: Llenar la regadera`, the same as before.
4. Advance to `2026-11-14T02:00:00`: **Regar** is `overdue` and still says `Primer paso: Llenar la regadera`.
5. Tap the checkbox of **Cambiar foco** (one-off): the notice `Completaste «Cambiar foco»` appears without any `Primer paso`. Its row disappears (a completed one-off task has no row, with **Mostrar completadas** on or off). Tap **Deshacer** within the 5 seconds: the row goes back to `pending` and says `Primer paso: Sacar la escalera`.
6. Postpone **Cambiar foco** with the option **3 horas**: it becomes `waiting` and its row does not contain `Primer paso`. Postpone **Pagar** with the option **Hasta mañana**: neither. Advance the clock until the postponement of **Cambiar foco** expires: the line comes back by itself with its text; **Pagar** (overdue again when it expires) too.
7. Tap the **Regar** row and **Pausar**: the row is no longer shown. Turn on **Mostrar pausadas**: **Regar** is shown paused (it says «Pausada») and does not contain `Primer paso`. Tap the row, **Reanudar**: **Regar** becomes `pending` and the row says `Primer paso: Llenar la regadera`.
8. Create `Basura` with **Días de la semana** and **martes** and **Primer paso** `Atar la bolsa llena`, with the clock on Friday: it is `waiting` until Tuesday 17 and does not contain `Primer paso`. Advance the clock to `2026-11-17T09:00:00`: it is `pending` and says `Primer paso: Atar la bolsa llena`.
9. Create `Llamar` with **No se repite**, without a due date, schedule **Desde** `08:00` **Hasta** `09:00` and **Primer paso** `Buscar el número`: with the clock at `2026-11-17T09:00:00` it is outside its window (`waiting`) and does not contain `Primer paso`. Advance to `2026-11-18T08:00:00`: it is `pending` and says `Primer paso: Buscar el número`.

## Flow 5: overdue with the checkbox disabled

Precondition: empty list, clock stopped at `2026-11-09T09:00:00` (Monday).

1. Create `Lavar` with **No se repite**, due date `2026-11-10`, schedule **Desde** `08:00` **Hasta** `11:00` and **Primer paso** `Separar la ropa blanca`.
2. Advance the clock to `2026-11-11T07:00:00` (the due day has passed and today's window has not opened yet): **Lavar** is `overdue`, with the checkbox disabled, and its row says `Primer paso: Separar la ropa blanca`.
3. Advance to `2026-11-11T08:00:00`: the checkbox becomes enabled and the row still says `Primer paso: Separar la ropa blanca`.

## Flow 6: the first step does not change with the actions of the task

Precondition: empty list, clock at `2026-11-13T10:00:00`. **Mostrar completadas** and **Mostrar pausadas** turned on.

1. Create `Regar` with **Intervalo** every `2` **días** and **Primer paso** `Llenar la regadera`. Tap its checkbox. Open the row: **Primer paso** is still `Llenar la regadera`. Close.
2. Pause **Regar** and open its row: **Primer paso** is `Llenar la regadera`. **Reanudar**: open the row, it is still the same.
3. Tap the checkbox of **Regar** and tap **Deshacer** in the notice: open the row, **Primer paso** is still the same.
4. In the **Regar** panel, change **Se repite** to **Días de la semana** with **martes** and save: reopen, **Primer paso** is still `Llenar la regadera`. Change **Se repite** to **No se repite** and save (it is now a completed one-off task: it has no row, so reopen it from the **Historial**): still the same. Go back to **Intervalo** every `2` **días** and save: still the same.
5. Create `Cambiar foco` with **No se repite** and **Primer paso** `Sacar la escalera`, postpone it with the option **3 horas** and open the row: **Primer paso** is still `Sacar la escalera`.
6. Reload the page: both values are kept. There is no control on any screen to mark the first step as done.
7. Create a task without a first step (`Barrer`) and open its row: **Primer paso** is empty and the row does not contain `Primer paso`, as before the field existed.

## Flow 7: what does not change and what does not show it

Precondition: empty list, clock stopped at `2026-11-13T10:00:00`.

1. Create `Barrer`, `Lavar` and `Planchar`, all with **No se repite** and without a due date. Note the order of the list and the text of each row.
2. Type in `Lavar` the **Primer paso** `Separar la ropa blanca` and save. The order of the list is the same as the one noted; the rows of **Barrer** and **Planchar** are identical to before. Repeat putting the first step on `Barrer` and removing it from `Lavar`: the order of the list is still the same.
3. Give `Lavar` the emoji `🧺` with the picker: the title of the row says `🧺 Lavar` and the first-step line stays on its own line below. The title does not include the first step.
4. Tap the checkbox of **Lavar**: the notice says `Completaste «🧺 Lavar»`, without `Primer paso`. Go to **Historial**: the entry says `🧺 Lavar` with its time, without `Primer paso`.

## Flow 8: unsaved changes with the field

Precondition: `Lavar` with **Primer paso** `Separar la ropa blanca` and `Barrer` without a first step, clock at `2026-11-13T10:00:00`.

1. Open `Lavar`, change **Primer paso** to `Juntar las llaves` and tap the X of the panel: the notice "Tenés cambios sin guardar" appears. Choose **Descartar**: the row still says `Primer paso: Separar la ropa blanca`.
2. Open `Lavar`, change **Primer paso** to `Juntar las llaves`, type `Separar la ropa blanca` again and tap the X: the panel closes directly, without a notice.
3. Open `Lavar`, type `Separar la ropa blanca` with spaces at the start and at the end (the same value) and tap the X: it closes directly, without a notice.
4. Open `Lavar`, empty **Primer paso** and tap the X: the notice appears. **Descartar**. Repeat typing only spaces: the notice appears. **Descartar**.
5. Open `Barrer`, type only spaces in **Primer paso** and tap the X: it closes directly, without a notice. Open `Barrer`, type `Barrer abajo` and tap the X: the notice appears. **Descartar**.
6. Tap **+**, tap the X: it closes directly. Tap **+**, type in **Primer paso** `Separar la ropa blanca` and tap the X: the notice appears. **Descartar**.

## Flow 9: two devices

Precondition: empty list, clock at `2026-11-13T10:00:00` on A and on B.

1. On A, create `Lavar` with **No se repite** and without a due date. B sees it appear.
2. B offline. On B, type **Primer paso** `Separar la ropa blanca` and save. On A, change **Título** to `Lavar a mano` and save.
3. B is back online: on A and on B the row says `Lavar a mano` and `Primer paso: Separar la ropa blanca` (both changes were kept).
4. B offline. On B, change **Primer paso** to `Juntar las llaves`. On A, change **Nota** to `Usar guantes`. B is back online: on A and on B the row says `Primer paso: Juntar las llaves` and the note is `Usar guantes`.
5. B offline. On B, change **Primer paso** to `Buscar el detergente`. On A, change **Primer paso** to `Poner el agua a calentar`. B is back online: on A and on B the row says `Primer paso: Buscar el detergente` (the last change to arrive is that of B).
6. B offline. On B, empty **Primer paso** and save. On A, change **Primer paso** to `Sacar la escalera` and save. B is back online: on A and on B the row does not contain `Primer paso` (the last change to arrive is that of B, which removed it).
7. B offline. On B, type `Barrer abajo` in **Primer paso** and save. On A, empty **Primer paso** and save. B is back online: on A and on B the row says `Primer paso: Barrer abajo` (the last change to arrive is that of B).
8. B offline. On B, type `Separar la ropa blanca` in **Primer paso** and save. On A, open the row and save without changing anything. B is back online: on A and on B the row says `Primer paso: Separar la ropa blanca` (saving without changes did not overwrite the change of B).
