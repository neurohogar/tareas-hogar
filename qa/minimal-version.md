# QA: minimal version

Verifies, through the interface only:

- the **Versión mínima** field of the panel (**Nueva tarea** and **Editar tarea**): one line, with the label «Versión mínima», without example text, below the steps (after **Agregar paso**) and before the **Nota**; Enter saves; spaces are trimmed; empty or only spaces leaves the task without a minimal version, without an error; no maximum length; the order of the **Tarea** section;
- that the row of a `pending` or `overdue` task with a minimal version shows on its own line `Mínima: ` followed by the text, in full, with the text button **Hice la mínima**, also without a first step and below the step line if there is one, with the style of the step line; that tapping the text of the line opens the panel and that tapping the button does not open it nor go through **Cambios sin guardar**;
- that the line and the button disappear and come back by themselves with the status of each moment (`waiting`, postponed, completed, paused) and that the button is disabled like the checkbox;
- **Hice la mínima**: completes the task like the checkbox (same status, same order), with the notice `Completaste «…» · mínima`, **Deshacer** and «Vuelve …» if it is recurring; the word «Mínima» in the Historial and in the **Borrar** dialog, never the text of the minimal version; deleting the completion of the minimal version (notice, Historial, checkbox) like any other;
- that with steps, **Hice la mínima** works at any step, the task goes back to step 1 and undo gives back the step it was on;
- that the minimal version does not change the order or the name of the task, and that the undo notice does not show its text; that editing or emptying the minimal version does not touch the completions that were already the minimal version;
- **Cambios sin guardar** with the field and the two-devices case.

Covers spec §4.1 (**Versión mínima**, **Pasos**), §4.4 (`fueMinima`), §5.4 (notice and undo), §5.5 (window), §6.1 (row and button), §6.2 (field, section order, **Cambios sin guardar**), §6.3 (Historial and **Borrar**) and §7 (conflicts by field, completions from two devices).

Out of scope: the status and order rules themselves (`qa/one-off.md`, `qa/recurring-relative.md`, `qa/recurring-calendar.md`, `qa/schedule.md`, `qa/pending-order.md`), the first step and the steps alone (`qa/first-step.md`, `qa/one-step-at-a-time.md`) and the «cuenta como hecha cuando…» field of E4, which is another feature.

## Environment

- Firebase Emulator Suite (Auth + Firestore) with clean data at the start of each flow.
- Each flow starts from a new browser context, signed in with the `qa@example.com` account of the Auth Emulator (Flow 1 of `qa/recurring-relative.md`).
- Simulated browser clock (`page.clock`) installed **before** opening the app, at the local time that each flow indicates (zone `America/Argentina/Buenos_Aires`), stopped (`page.clock.pauseAt`).
  - "At X" and "Advance the clock to X" mean advancing it to X (`page.clock.runFor` or `fastForward`) and waiting for the screen to update by itself, without reloading.
  - "Set the time to X" means moving the clock to X right before the step: with the clock paused, time runs a few ms per assertion, and clock advances are done with slack (several seconds extra, never right at the edge).
- Creating a task: tap **+**, type the title, choose the **Se repite** option that the step indicates (controls of `qa/one-off.md`, `qa/recurring-relative.md` and `qa/recurring-calendar.md`), schedule as in `qa/schedule.md`, type the **Primer paso**, the steps and the **Versión mínima** that the step indicates and save.
- "Postpone X with option O": tap row X and choose O among the **Posponer** options (`qa/postpone.md`). "Pause X" and "Resume X": tap row X and the **Pausar** or **Reanudar** button of the panel (`qa/pause.md`); only recurring tasks are paused.
- **Mostrar completadas** and **Mostrar pausadas** stay off unless the flow says to turn them on.
- **Two devices** (Flow 8): two contexts A and B with the same account and the same simulated clock. "B offline" is `browserContext.setOffline(true)`; "B is back online" means setting it online again and waiting for both screens to update by themselves, and in addition ~10 s idle before looking.

Reference week: Monday 2026-11-09, Tuesday 10, Wednesday 11, Thursday 12, Friday 13, Saturday 14, Sunday 15.

**Switches.** **Mostrar completadas** and **Mostrar pausadas** are the items **Completadas** and **Pausadas** of the **⋮** menu (`qa/menu-toggles.md`), not checks above the list: to turn one on or off, open the **Menú** and tap the item (the menu closes). A completed one-off task never has a row in **Pendientes**, with **Completadas** on or off: it is reached from the **Historial**.

**Navigation.** There is no navigation bar (`qa/navigation.md`): to go to **Historial**, open the **Menú** (**⋮**) of **Pendientes** and tap the item **Historial**; to go back to **Pendientes**, tap **Volver** in the header of the **Historial**. Opening `/history` directly still shows the Historial.

## Observable contract

- **Panel field**: in the **Tarea** section (**Nueva tarea** and **Editar tarea**), a one-line text field (role `textbox`, label **Versión mínima**, without `placeholder`), after **Agregar paso** and before the **Nota**. It starts empty when creating and with the saved value when editing.
- **Row line**: a text on its own line below the title (and below the step line, if there is one): `Mínima: ` followed by the text. "The row says the minimal version M" means that this text is exactly `Mínima: M`. A row without a minimal version, or that does not show it, does not contain `Mínima`.
- **Row button**: **Hice la mínima**, a small text button (role `button`) next to that line. It is enabled or disabled the same as the row checkbox.
- **Style**: the line has the same computed `color` and `font-size` as the step line; normal `font-weight`, no underline or own color on the text or on the button; the row does not change its background. No truncation (no `text-overflow: ellipsis`, no `-webkit-line-clamp`, no `max-height`): a long text is shown in full on several lines.
- **Tap**: tapping the text of the line (outside the button) is tapping the row: it opens **Editar tarea**. Tapping **Hice la mínima** does not open the panel nor **Cambios sin guardar**, and it does open the completion notice.
- **Notice**: the one of `qa/history-undo.md`; with **Hice la mínima**, its text is `Completaste «Regar» · mínima` (with emoji, `Completaste «🌱 Regar» · mínima`); with the checkbox or **Hecho**, without ` · mínima`. It never contains the text of the minimal version.
- **Historial**: each entry of a completion of the minimal version shows, after the time, the word `Mínima` in the same secondary text, without color or icon (`08:05 Mínima`); that of a whole completion, only the time. It never shows the text of the minimal version. The **Borrar** dialog of that completion names the task, the moment and the word `Mínima`.
- **List**: "The list is A, B, C" means exactly those rows, from top to bottom.

## Flow 1: the field in the panel, create and edit

Precondition: empty list, clock at `2026-11-13T10:00:00` (Friday).

1. Tap **+**. In **Nueva tarea** there is **Versión mínima**, empty and without example text. The vertical order of the section is: **Título** (with the emoji button), **Primer paso**, **Agregar paso**, **Versión mínima**, **Nota**. Tap **Agregar paso**: the **Paso 2** field appears before **Versión mínima**.
2. Type `Limpiar baño` in **Título** and `Solo el inodoro` in **Versión mínima**. With the focus in **Versión mínima**, press Enter: the panel saves and closes. The row of `Limpiar baño` says the minimal version `Solo el inodoro` and has **Hice la mínima**.
3. Tap the row: **Editar tarea** shows **Versión mínima** `Solo el inodoro`. Reload: it stays the same.
4. Type in **Versión mínima** `  Solo el lavabo  ` (with spaces at the start and at the end) and save. Reopen: it has exactly `Solo el lavabo`.
5. Paste a two-line text (`uno`, line break, `dos`): the field stays on a single line and Enter saves instead of typing a line break. Save and reopen: the text has no line break.
6. Empty **Versión mínima** and save: the row no longer contains `Mínima` or **Hice la mínima**; reopening shows the empty field. Type `Solo el inodoro` and save. Type only spaces and save: there is no error or rejection message; the row has no line and reopening shows the empty field.
7. Paste into **Versión mínima** a text of 5000 characters and save: it is accepted without an error or warning. Reopen: it has all 5000.
8. Create `Barrer` with **No se repite**, without a due date, with only spaces in **Versión mínima**: it is created without an error and without a line. Create `Planchar` without touching **Versión mínima**: the row looks as before, without `Mínima` or a button.
9. Create with **Versión mínima** a recurring task (`Regar`, **Intervalo** every `2` **días**, `Solo los helechos`), a calendar one (`Basura`, **Días de la semana** and **martes**, `Solo la de la cocina`): they are accepted; reopening shows the value in each. Change the kind on `Regar` (**No se repite** and again **Intervalo**), saving: reopening keeps `Solo los helechos`.
10. Type in **Versión mínima** the text of about 160 characters `Abrir el cajón de abajo y sacar toda la ropa blanca y separarla en dos pilas: la que va con agua caliente y la que no se mezcla con nada de color oscuro ni delicado` and, on a phone (390 × 844), look at the row: the line is shown in full, on several lines, without cutting or horizontal scroll.

## Flow 2: the line and the button on the row

Precondition: empty list, clock at `2026-11-13T10:00:00`. Create `Lavar` (**No se repite**, without a due date) with `Separar la ropa blanca` in **Primer paso** and `Solo el inodoro` in **Versión mínima**, and `Barrer` (**No se repite**, without a due date) with `Solo el pasillo` in **Versión mínima**, without a first step.

1. The row of `Lavar` has two lines below the title, in this order: `Primer paso: Separar la ropa blanca` and `Mínima: Solo el inodoro` (with **Hice la mínima**). The row of `Barrer` has the line `Mínima: Solo el pasillo` and **Hice la mínima** even though it has no first step.
2. **Style**: the line of the minimal version has the same `color` and `font-size` as the step line; the button has no own color or highlighted background; the row does not change its background. The row has no counters, marks or texts that suggest doing the minimal version.
3. Tap the text `Mínima: Solo el pasillo` (outside the button): **Editar tarea** of `Barrer` opens. Close with the X without changes: it closes directly.
4. With the panel closed, tap **Hice la mínima** on `Barrer`: the panel does not open and **Cambios sin guardar** does not appear; the completion notice appears (Flow 3).
5. With steps: open `Lavar`, add `Poner el lavarropas` in **Paso 2** and `Tender la ropa` in **Paso 3** and save. At step 1 the row says `Primer paso: Separar la ropa blanca` and below `Mínima: Solo el inodoro`, with **Hecho** and **Hice la mínima**. Tap **Hecho**: it says `Paso: Poner el lavarropas` and the minimal version stays the same, below the step line. Tap **Hecho** again: the same at step 3.
6. **Where it is not shown** (**Mostrar completadas** and **Mostrar pausadas** turned on from here): create `Cambiar foco` (**No se repite**, without a due date) with `Solo la lámpara` in **Versión mínima**, `Pagar` (**No se repite**, due date `2026-11-10`) with `Solo la luz`, `Regar` (**Intervalo** every `8` **horas**) with `Solo los helechos`. `Pagar` is `overdue` and shows it with **Hice la mínima** enabled; the others too.
7. Postpone `Cambiar foco` with the option **3 horas**: it becomes `waiting` and the row does not contain `Mínima` or **Hice la mínima**; the checkbox stays enabled. Postpone `Pagar` with **Hasta mañana**: neither. Tap the checkbox of `Regar`: `waiting`, without a line or button.
8. Advance the clock to `2026-11-13T13:01:00`: `Cambiar foco` goes back to `pending` with its line and its button. `Regar` still has no line. At `2026-11-13T18:01:00`: `Regar` goes back to `pending` and says `Mínima: Solo los helechos` with **Hice la mínima**.
9. Tap the `Regar` row and **Pausar**: `Regar` is shown paused, without a line or button. Open, **Reanudar**: it comes back with its line and its button.
10. Tap the checkbox of `Cambiar foco` (one-off): its row disappears (a completed one-off task has no row, with **Mostrar completadas** on or off). Tap **Deshacer** within the 5 seconds: it goes back to `pending` with its line and its button.
11. Create `Basura` with **Días de la semana** and **martes** and `Solo la de la cocina` in **Versión mínima**, with the clock on Friday: `waiting` until Tuesday, without a line or button. Advance to `2026-11-17T09:00:00`: `pending`, with `Mínima: Solo la de la cocina` and **Hice la mínima**.
12. Create `Llamar` (**No se repite**, without a due date, schedule **Desde** `08:00` **Hasta** `09:00`) with `Solo a mamá` in **Versión mínima**, with the clock at `2026-11-17T09:30:00`: outside its window, `waiting`, without a line or button. Advance to `2026-11-18T08:30:00`: `pending`, with its line and its button enabled.
13. **Disabled checkbox**: create `Lavar la ropa` (**No se repite**, due date `2026-11-10`, schedule **Desde** `08:00` **Hasta** `11:00`) with `Solo lo blanco` in **Versión mínima**. With the clock at `2026-11-19T07:00:00`: `overdue`, checkbox disabled, the row says `Mínima: Solo lo blanco` and **Hice la mínima** is disabled: tapping it completes nothing and opens no notice. Advance to `2026-11-19T08:30:00`: checkbox and **Hice la mínima** become enabled.
14. **No suggestions**: a recurring task that was already completed twice with **Hice la mínima** (Flow 3) and goes back to `pending` or `overdue` shows the same line and the same button, without any additional text, counter or mark.

## Flow 3: doing the minimal version, notice, return and undo

Precondition: empty list, clock at `2026-11-13T09:00:00`, **Mostrar completadas** turned on. Create `Regar` with **Intervalo** every `8` **horas**, emoji `🌱` and `Solo los helechos`; `Limpiar` (**No se repite**, without a due date) with `Solo el inodoro`.

1. Set the time to `2026-11-13T09:00:00` and tap **Hice la mínima** on `Regar`: the notice appears with the text `Completaste «🌱 Regar» · mínima`, the **Deshacer** button and below `Vuelve hoy 17:00 · en 8 horas`. The notice does not contain `Solo los helechos`. The row becomes `waiting` (completed), without a line or button, as if the checkbox had been tapped.
2. Tap **Deshacer** within the 5 seconds: the notice closes and `Regar` goes back to `pending`, with its line and its button.
3. Set the time to `2026-11-13T09:00:00` and tap the checkbox of `Regar`: the notice says `Completaste «🌱 Regar»`, without ` · mínima`, with the same «Vuelve …» line. Undo.
4. Tap **Hice la mínima** on `Limpiar`: the notice says `Completaste «Limpiar» · mínima` and has no «Vuelve …» line (it does not repeat). Wait 5 s: the notice disappears by itself. `Limpiar` has no row (a completed one-off task is never shown in **Pendientes**).
5. With `Limpiar` completed with the minimal version, open the **Historial**, tap **Borrar** on its entry and confirm: `Limpiar` goes back to `pending` in **Pendientes** (the deletion removes the completion of the minimal version like any other). No notice.
6. Set the time to `2026-11-13T09:00:00`, tap the checkbox of `Limpiar` (whole) and, with the notice open, tap **Hice la mínima** on `Regar`: the notice is now that of `Regar` with ` · mínima` (it replaces the previous one; there is a single notice).
7. **Status**: with `Regar` completed with the minimal version on `2026-11-13T09:00:00`, advance to `2026-11-13T15:00:00`: it is still `waiting` and the progress bar advanced; at `2026-11-13T17:01:00`: `pending`, with its line and its button. It is the same as with a whole completion.
8. **List**: set the time to `2026-11-13T09:30:00` and tap the checkbox of `Limpiar` (whole; if it has a completion, delete it first from the **Historial**). With `Regar` completed with the minimal version at `09:00` and `Limpiar` completed at `09:30`, `Regar` goes at the end, struck through, and `Limpiar` has no row. It is the same as with a whole completion.
9. **Last time**: open `Regar`: **Última vez** says `hoy 09:00` (time of the completion of the minimal version).
10. **Calendar**: in a new context with the clock at `2026-11-09T08:00:00` (Monday), create `Basura` with **Días de la semana** and **martes** and `Solo la de la cocina`. Advance to `2026-11-10T09:00:00`: `pending`. Set the time to `2026-11-10T09:00:00` and tap **Hice la mínima**: notice `Completaste «Basura» · mínima` and below `Vuelve el martes 17` (with its distance); the row becomes `waiting`.
11. **Completed on an earlier day**: with the clock at `2026-11-13T09:30:00`, create `Riego` (**Intervalo** every `2` **días**) with `Solo las macetas`, tap **Hice la mínima** and wait for the notice. Advance to `2026-11-14T10:00:00`: `Riego` is still `waiting` and completed. Tap the checkbox of the row: it completes it again, whole (notice `Completaste «Riego»` without ` · mínima`). On the same day as the completion, the checkbox would have deleted it.

## Flow 4: with steps, at any step

Precondition: empty list, clock at `2026-11-13T10:00:00`, **Mostrar completadas** turned on. Create `Lavar` (**Intervalo** every `2` **días**) with `Separar la ropa blanca`, `Poner el lavarropas`, `Tender la ropa` and `Solo lo blanco`.

1. At step 1 (`Primer paso: Separar la ropa blanca`), tap **Hice la mínima**: notice `Completaste «Lavar» · mínima`. The completed row has no step line or minimal-version line or buttons. Tap **Deshacer**: `Lavar` goes back to `pending` at step 1.
2. Tap **Hecho** (step 2): it says `Paso: Poner el lavarropas`. Set the time to `2026-11-13T10:00:00` and tap **Hice la mínima**: it completes. Tap **Deshacer**: `Lavar` goes back to saying `Paso: Poner el lavarropas` (the step it was on).
3. Tap **Hice la mínima** again (step 2), wait for the notice to pass and uncheck the checkbox of the completed row: it comes back `pending` saying `Paso: Poner el lavarropas`.
4. Tap **Hecho** (step 3, `Paso: Tender la ropa`), tap **Hice la mínima** and **Deshacer**: it says `Paso: Tender la ropa`. Tap **Hice la mínima** and, after the notice, go to the **Historial** and delete that entry (confirming): it goes back to `Paso: Tender la ropa`.
5. Tap **Hice la mínima** (step 3) and do not undo: with the completion of the minimal version and **Mostrar completadas**, tap the checkbox of the completed row: `Lavar` goes back to `pending` at step 3.
6. Create a recurring task `Regar` every `2` **días** with two steps (`Llenar la regadera`, `Regar los helechos`) and `Solo los helechos`, tap **Hecho** (step 2), set the time to `2026-11-13T10:00:00`, tap **Hice la mínima** and advance to `2026-11-15T10:30:00`: `Regar` goes back to `pending` and says `Primer paso: ` with the first step (it starts from step 1), with **Hecho** and without **Paso anterior**.
7. With a single step (only **Primer paso**), **Hice la mínima** and undo leave the task as it was (without step buttons).

## Flow 5: Historial and Borrar

Precondition: empty list, clock at `2026-11-13T08:05:00`. Create `Regar` (**Intervalo** every `2` **días**, `Solo los helechos`) and `Pagar` (**No se repite**, without a due date, without a minimal version).

1. Tap **Hice la mínima** on `Regar`. Go to **Historial**: group **Hoy**, entry `Regar` `08:05` with the word `Mínima` after the time, in the same secondary text as the time, without color or icon. The entry does not contain `Solo los helechos`.
2. Advance the clock to `2026-11-13T10:00:00`, tap the checkbox of `Pagar` (whole): in the Historial, the `Pagar` `10:00` entry has no `Mínima`; the `Regar` `08:05` one does; `Pagar` above `Regar` (most recent first).
3. Tap **Borrar** on the `Regar` entry: the dialog names `Regar`, `Hoy, 08:05` and the word `Mínima`, with **Borrar** and **Cancelar**. **Cancelar**: no changes. **Borrar** and confirm: the entry disappears and `Regar` goes back to `pending` in «Pendientes». The dialog of the `Pagar` entry does not say `Mínima`.
4. Tap **Hice la mínima** on `Regar` again, open the panel and change **Versión mínima** to `Solo el brote`, save: in the Historial, the `Regar` entry still says `Mínima` and does not contain either of the two versions. Open, empty **Versión mínima** and save: the entry still says `Mínima`. Change the title to `Plantas` and save: the entry says `Plantas` and `Mínima`.
5. Type `Solo el brote` in **Versión mínima** of `Pagar` (which has a whole completion) and save: the `Pagar` entry still has no `Mínima` (a whole completion cannot be turned into a minimal one).

## Flow 6: what does not change and what does not show it

Precondition: empty list, clock stopped at `2026-11-13T10:00:00`, **Mostrar completadas** turned on.

1. Create `Barrer`, `Lavar` and `Planchar`, all with **No se repite** and without a due date. Note the order and the text of each row.
2. Type in `Lavar` a **Versión mínima** (`Solo el inodoro`) and save: the order of the list is the same; the rows of `Barrer` and `Planchar` are identical to before. Also type one in `Barrer` and save: the order does not change.
3. Give `Lavar` the emoji `🧺`: the title says `🧺 Lavar`, the `Mínima: …` line goes on its own line below. The title does not include the minimal version.
4. Tap **Hice la mínima** on `Lavar`: the notice says `Completaste «🧺 Lavar» · mínima`, without the text of the minimal version.
5. Tap the `Mínima: …` text of a row (outside the button): it opens the panel of that task.

## Flow 7: Cambios sin guardar

Precondition: empty list, clock stopped at `2026-11-13T10:00:00`. `Lavar` (**No se repite**, without a due date) with **Versión mínima** `Solo el inodoro` and `Planchar` (**No se repite**, without a due date) without a minimal version.

1. Open `Lavar`, change **Versión mínima** to `Solo el lavabo` and tap the X: the notice «Tenés cambios sin guardar» appears; **Descartar**: the row still says `Mínima: Solo el inodoro`.
2. Open, change to `Solo el lavabo` and type `Solo el inodoro` again, and tap the X: it closes directly. Type `  Solo el inodoro  ` (with spaces at the start and at the end): it closes directly.
3. Open, empty **Versión mínima**: notice; **Descartar**. Repeat with only spaces: notice; **Descartar**.
4. Open `Planchar` (without a minimal version), type only spaces in **Versión mínima** and tap the X: it closes directly. Type `Solo el inodoro` and tap the X: notice; **Descartar**.
5. Tap **+**, type only spaces in **Versión mínima** and the X: it closes directly. Type `Solo el inodoro` and the X: notice; **Descartar**.
6. With the panel of `Lavar` closed, tap **Hice la mínima** on the row: **Cambios sin guardar** does not appear and the panel does not open; the completion notice appears.

## Flow 8: two devices

Precondition: empty list, clock at `2026-11-13T10:00:00` on A and on B.

1. On A, create `Regar` with **Intervalo** every `2` **días** and **Versión mínima** `Solo los helechos`. B sees it appear with its line.
2. B offline. On B, change the title to `Regar plantas` and save. On A, change **Versión mínima** to `Solo el brote` and save. B is back online: on A and on B the title says `Regar plantas` and the row says `Mínima: Solo el brote` (different fields, both changes were kept).
3. B offline. On B, change **Versión mínima** to `Solo los esquejes` and save. On A, change the **Nota** to `Usar la regadera chica` and save. B is back online: on A and on B the row says `Mínima: Solo los esquejes` and the note is `Usar la regadera chica`.
4. B offline. On B, change **Versión mínima** to `Solo la maceta` and save. On A, change **Versión mínima** to `Solo la planta grande` and save. B is back online: on A and on B it says `Mínima: Solo la maceta` (the last change to arrive is that of B).
5. B offline. On B, empty **Versión mínima** and save. On A, change **Versión mínima** to `Solo el tronco` and save. B is back online: on A and on B the row has no line or button (the last one to arrive wins, that of B). Then, on A, type `Solo el tronco` and save.
6. B offline. On B, change **Versión mínima** to `Solo la maceta` and save. On A, empty **Versión mínima** and save. B is back online: on A and on B it says `Mínima: Solo la maceta` (the last one to arrive wins, that of B).
7. B offline. On B, change **Versión mínima** to `Solo el brote` and save. On A, open the row and save without changing anything. B is back online: on A and on B it says `Mínima: Solo el brote` (saving without changes did not overwrite the change of B).
8. **Completions**: B offline. On B, tap the checkbox of `Regar plantas` (whole). On A, tap **Hice la mínima**. B is back online: in the **Historial** of A and of B there are two entries of `Regar plantas`, one with `Mínima` after the time and another without it, each with its own.
