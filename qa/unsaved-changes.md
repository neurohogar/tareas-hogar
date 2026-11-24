# QA: unsaved changes and the Back button

Verifies, through the interface only, that closing the panel or using an action with unsaved changes asks for confirmation instead of losing them, and that the Back button closes the panel instead of leaving the screen:

- what counts as "there are changes" and what does not (when editing and when creating);
- the close notice (**Seguir editando**, **Descartar**, **Guardar**) on tapping the **X** or **Back**;
- the action notice for **Pausar**, **Reanudar**, **Posponer** and **Quitar posponer**, with the time of the tap, the meaningless action and the save that fails;
- that **Borrar tarea** keeps only its confirmation;
- the notices over the panel, and that they go back to the same tab;
- the Back button: what each layer closes, the on-screen keyboard, the undo notice, the closed panel and the panel's two origin screens;
- the browser confirmation on reloading or closing the app;
- the other devices: a remote change does not make the notice appear, a remote deletion closes everything, and the action notice is kept up to date;
- that **Descartar** does not remove an emoji from **Recientes**.

Covers spec §6.2 (Unsaved changes, Back) and §7 (deletion wins).

Out of scope: portrait orientation and the rules of each field and action (`qa/panel-mobile.md` and the others).

## Environment

That of `qa/panel-mobile.md` (Firebase Emulator Suite, session `qa@example.com`, simulated clock stopped in `America/Argentina/Buenos_Aires`, **Phone** of 360x640 px with touch emulation, **Wide** of 1024x768 px, **On-screen keyboard open** emulated by reducing the height of the visual viewport, two devices A and B with the same account and the same clock, **Mostrar completadas** and **Mostrar pausadas** off).

- **Back**: `page.goBack()`, which is what the Android Back button does. "Forward" is `page.goForward()`.
- **Browser confirmation**: Playwright's `beforeunload` dialog (`page.on("dialog")`, type `beforeunload`); it fires on reloading with `page.reload()` or closing the page with `page.close({ runBeforeUnload: true })`, after having touched the page. "Accepting it" is continuing (reloading or closing); "cancelling it" is staying.

**Switches.** **Mostrar completadas** and **Mostrar pausadas** are the items **Completadas** and **Pausadas** of the **⋮** menu (`qa/menu-toggles.md`), not checks above the list: to turn one on or off, open the **Menú** and tap the item (the menu closes). A completed one-off task never has a row in **Pendientes**, with **Completadas** on or off: it is reached from the **Historial**.

## Observable contract

- **Notice**: a dialog (`alertdialog`) with accessible name **Tenés cambios sin guardar**, over the panel. It has three buttons, in this order. In the close notice: **Seguir editando**, **Descartar**, **Guardar**. In an action notice: **Seguir editando**, **Descartar y <acción>**, **Guardar y <acción>**, with `<acción>` in lowercase: pausar, reanudar, posponer 1 hora, posponer 3 horas, posponer hasta mañana or quitar posponer.
- **Meaningless action notice**: the same dialog with the text "Con estos cambios la tarea ya no se puede <acción>" and only **Seguir editando** and **Descartar y <acción>**.
- **Over the panel**: while a notice is open nothing below it can be touched (the panel, the tabs, the list). When it closes, the panel is on the same tab, with the same content typed.
- **Borrar tarea confirmation**: the one of `qa/edit-delete.md` (`alertdialog`, buttons **Borrar** and **Cancelar**).
- **Emoji picker** and **undo notice**: those of `qa/emoji-and-note.md` and `qa/history-undo.md`.
- **Closed panel** means there is no **Nueva tarea** or **Editar tarea** dialog.
- Reference panel when editing: `Regar` with **Intervalo** every `2` **días**, note `Las del balcón`, no schedule, created at `2026-07-13T08:00:00` (at 08:00 on the 15th it is pending).

## Flow 1: close with changes when editing

Precondition: empty list, clock at `2026-07-15T08:00:00`, phone. Create `Regar` as in the reference panel.

1. Open `Regar` and tap **Cerrar** (the **X**) without touching anything: the panel closes, with no notice.
2. Open `Regar`, change the title to `Regar plantas` and tap **Cerrar**: the **Tenés cambios sin guardar** notice opens with **Seguir editando**, **Descartar** and **Guardar**. The panel stays behind.
3. Tap **Seguir editando**: the notice closes and the panel stays open with the title `Regar plantas`, on the same tab. The list still says `Regar`.
4. With the **Cuándo** tab open, tap **Cerrar** and then **Seguir editando**: the panel stays on **Cuándo**.
5. Tap **Cerrar** and **Descartar**: the panel closes and the list says `Regar`. Open `Regar`: the title is `Regar`.
6. Change the title to `Regar plantas`, tap **Cerrar** and **Guardar**: the panel closes and the list says `Regar plantas`. Reload: it still says `Regar plantas`.
7. Open `Regar plantas`, empty the title, tap **Cerrar** (the notice opens) and **Guardar**: the notice closes, the panel stays open with the title empty, jumps to the **Tarea** tab and the Título error is seen; the list still says `Regar plantas`. Tap **Cerrar** and **Descartar**.
8. On wide (1024 px) repeat steps 2, 3 and 5: the behavior is the same.

## Flow 2: what counts as a change

Precondition: empty list, clock at `2026-07-15T08:00:00`, phone. Create `Regar` as in the reference panel, with schedule `08:00` to `10:00` and a second window `12:00` to `14:00`. Each step starts from `Regar` just opened; "closes directly" means **Cerrar** closes the panel with no notice, and "asks for confirmation" means it opens the notice (then tap **Descartar**).

1. Type `Z` in the title and delete it (back to `Regar`): closes directly.
2. Type spaces at the end of the title: closes directly. The same with spaces at the start and at the end of the note `Las del balcón`.
3. Change the title to `Regar plantas`: asks for confirmation.
4. Empty the note: asks for confirmation. Type only spaces in the note: asks for confirmation (it ends up with no note).
5. Empty the title: asks for confirmation (even though it cannot be saved).
6. In **Cuándo**, change **Se repite** to **Días de la semana** and go back to **Intervalo** with **Cada** `2` **días**: closes directly. Leave it on **Días de la semana**: asks for confirmation.
7. In **Cuándo**, swap the values of the two windows (the first becomes `12:00`-`14:00` and the second `08:00`-`10:00`): closes directly. Change `14:00` to `15:00` in one: asks for confirmation.
8. In **Cuándo**, tap **Agregar horario** (an empty row is left): asks for confirmation.
9. Choose an emoji with the emoji button: asks for confirmation; tap **Quitar emoji** and go back to having no emoji: closes directly.
10. Create `Pagar` with **No se repite**. With the clock at `2026-07-15T08:00:00`, another device (B) changes the title of `Pagar` to `Pagar luz` while A has its panel open without touching anything: on A, **Cerrar** closes directly (a remote change does not make the notice appear).

## Flow 3: create with unsaved changes

Precondition: empty list, phone.

1. Tap **+**: in **Cuándo**, **Se repite** comes with **No se repite** chosen. **Cerrar** without touching anything: closes directly (that initial option does not count as a change).
2. Tap **+**, type only spaces in the title and **Cerrar**: closes directly.
3. Tap **+**, type `Pagar` in the title and **Cerrar**: the notice opens with **Seguir editando**, **Descartar** and **Guardar**. **Seguir editando**: the panel stays with `Pagar`. **Cerrar** and **Descartar**: the list stays empty.
4. Tap **+**, choose **Intervalo** in **Se repite** (without typing anything else) and **Cerrar**: asks for confirmation. **Descartar**. Tap **+**, choose **Intervalo** and go back to **No se repite**, and **Cerrar**: closes directly.
5. Tap **+**, type `Pagar` and delete it, and **Cerrar**: closes directly.
6. Tap **+**, type `Pagar` and **Cerrar**, and **Guardar**: `Pagar` is created and the panel closes.

## Flow 4: actions with changes

Precondition: empty list, clock at `2026-07-15T08:00:00`, phone. Create `Regar` as in the reference panel.

1. Open `Regar` and tap **Pausar** in **Acciones** without changes: the panel closes and `Regar` is paused (with **Mostrar pausadas** off it leaves the list). With **Mostrar pausadas** on, open it and tap **Reanudar**: it acts at once and the task is no longer paused.
2. Open `Regar`, change the title to `Regar plantas` and tap **Pausar**: the notice opens with **Seguir editando**, **Descartar y pausar** and **Guardar y pausar**. The panel stays on **Acciones**.
3. Tap **Seguir editando**: the notice closes, the panel stays on **Acciones** with the title `Regar plantas` typed, and the task is not paused.
4. Tap **Pausar** and **Descartar y pausar**: the panel closes, `Regar` is paused and the title is `Regar` (with **Mostrar pausadas** on). Resume it from the panel.
5. Change the title to `Regar plantas`, tap **Pausar** and **Guardar y pausar**: the panel closes, the task is paused and named `Regar plantas`.
6. With the task paused, open it, change the note and tap **Reanudar**: the notice has **Seguir editando**, **Descartar y reanudar** and **Guardar y reanudar**. **Guardar y reanudar**: the task is resumed and the note is saved.
7. Open `Regar plantas`, change the note and tap **1 hora** in **Acciones**: the notice offers **Descartar y posponer 1 hora** and **Guardar y posponer 1 hora**. Repeat with **3 horas** and **Hasta mañana**: the buttons name the tapped option. **Seguir editando**.
8. Now (time of choosing) `2026-07-15T08:00:00`: tap **1 hora**, leave the notice open, advance the clock to `2026-07-15T08:03:00` and tap **Guardar y posponer 1 hora**. Open the task: it says "Pospuesta hasta 09:03". With **Descartar y posponer 3 horas** at `08:03` (another task): "Pospuesta hasta 11:03".
9. With the task postponed, open it, change the note and tap **Quitar posponer**: the notice offers **Descartar y quitar posponer** and **Guardar y quitar posponer**.
10. On `Regar` (recurring, not paused) change **Se repite** to **No se repite** and tap **Pausar**: the notice says "Con estos cambios la tarea ya no se puede pausar" and has only **Seguir editando** and **Descartar y pausar** (not **Guardar y pausar**). **Descartar y pausar**: the task is paused as recurring.
11. With `Regar` paused, open it, change **Se repite** to **No se repite** and tap **Reanudar**: the notice says "Con estos cambios la tarea ya no se puede reanudar" and does not offer **Guardar y reanudar**.
12. On `Regar`, empty the title and tap **Pausar**: since what is typed is invalid, the notice offers **Guardar y pausar**. Tap it: it is not paused, the notice closes, the panel stays open with the title empty and jumps to **Tarea** with the Título error.
13. Open `Regar`, change the note and tap **Borrar tarea**: only the deletion confirmation appears (not the **Tenés cambios sin guardar** notice). **Cancelar**: the panel stays open with the note typed, on **Acciones**.

## Flow 5: the notices over the panel

Precondition: list with `Regar` as in the reference panel, clock at `2026-07-15T08:00:00`, phone.

1. Open `Regar`, go to **Cuándo**, change **Cada** to `3`, tap **Cerrar**: the notice is over the panel; with the notice open, tapping **Tarea** in the tab bar does nothing (the notice blocks what is below).
2. **Seguir editando**: the panel is on **Cuándo** with `3` in **Cada**.
3. Tap **Acciones** and **Pausar**: action notice; **Seguir editando**: the panel stays on **Acciones**; go to **Cuándo**: **Cada** is still `3`.
4. On wide (1024 px), repeat 1 and 2: the notice covers the whole panel, without covering the panel's fixed header; **Seguir editando** goes back to the same state.
5. With the browser offline (`setOffline(true)`), tap **Cerrar**: the notice opens and the "Sin conexión" strip is still in view. Get the connection back.

## Flow 6: Back button

Precondition: empty list, phone. Create `Regar` (reference panel) and complete it at `2026-07-15T08:00:00` so that it has Historial (clock at `2026-07-15T10:00:00`).

1. On **Pendientes**, open `Regar` and tap Back (`page.goBack()`): the panel closes and the screen stays on **Pendientes** (it does not leave the screen).
2. Go to **Historial**, tap the title of the `Regar` entry: the **Editar tarea** panel opens. Tap Back: the panel closes and the screen stays on **Historial**.
3. Open `Regar`, change the title to `Regar plantas` and tap Back: the close notice opens and the panel stays behind. Tap Back again: the notice closes (equivalent to **Seguir editando**) and the panel stays with `Regar plantas`. Tap Back once more: the close notice opens. **Descartar**.
4. Open `Regar`, tap **Borrar tarea** and then Back: the confirmation closes (equivalent to **Cancelar**) and the panel stays open, on **Acciones**. Tap Back: the panel closes (there are no changes).
5. Open `Regar` on the **Tarea** tab, tap the emoji button and then Back: the picker closes without choosing an emoji and the panel stays. Tap Back again: the panel closes.
6. Open `Regar`, change the title, tap **Pausar** (action notice) and Back: the notice closes without acting and the panel stays with the title typed; the task is not paused. Tap Back: the close notice opens. **Seguir editando**.
7. With the undo notice in view (complete `Regar` from the list, at `2026-07-15T10:00:00`), open another task without changes and tap Back: the panel closes and the undo notice stays in view for its 5 seconds (Back does not touch it).
8. Open `Regar` (without changes), tap the title (on-screen keyboard open, viewport shrunk) and tap Back: the first Back only closes the keyboard (viewport at the original height) and the panel stays exactly the same; the second Back closes the panel. Repeat with the title changed: the first Back only closes the keyboard and the second opens the close notice.
9. With the panel closed: open `Regar` and tap **Cerrar**; tap Back: it leaves the screen (same as before this feature), without an extra Back that does nothing. Do the same closing with **Guardar** and with an action (**1 hora**). After closing the panel, tap Forward (`page.goForward()`): it does not reopen the panel.
10. On wide (1024 px), repeat 1, 3 and 4: Back does the same.
11. With unsaved changes (open `Regar`, change its title), tap Back: the browser does not show its confirmation (no `beforeunload` dialog).

## Flow 7: reload or close the app

Precondition: list with `Regar`, phone.

1. Open `Regar`, change the title and reload (`page.reload()`): the browser shows its confirmation. Cancel it: the panel stays open with the change. Accept it: the app reloads, the panel does not reopen and the list says `Regar`.
2. Open `Regar` without touching anything and reload: there is no confirmation.
3. Open `Regar`, change the title and tap **Cerrar** (close notice open) and close the page with `page.close({ runBeforeUnload: true })`: there is a confirmation.
4. Open `Regar`, change the title, tap **Pausar** (action notice open) and reload: there is a confirmation.
5. Open `Regar`, change the title and **Descartar** from the notice, and reload: there is no confirmation.
6. Tap **+** and reload without touching anything: there is no confirmation; type `Pagar` and reload: there is.
7. Open `Regar`, change the title and tap Back: there is no browser confirmation (only the app's notice).

## Flow 8: two devices with the panel open

Precondition: clock at `2026-07-15T08:00:00` on A and B; A on phone. `Regar` as in the reference panel on A.

1. On A, open `Regar` and change the note to `Las del patio`. On B, change the title to `Regar plantas`. On A, without closing: A's title does not change because of what was typed. Tap **Cerrar** on A: the notice opens because of the note (the remote change neither adds nor removes). **Descartar**.
2. On A, open `Regar plantas` without touching anything. On B, change the title to `Regar flores`. On A, **Cerrar**: closes directly, with no notice.
3. On A, open `Regar flores`, change the note and tap **Cerrar** (close notice open). On B, delete `Regar flores`: on A the notice and the panel close without asking anything, and the list does not have the task.
4. On A, open another task `Pagar`, change the note and tap **Cerrar** (notice open). On B, delete it: on A the notice and the panel close; the list does not have `Pagar`.
5. On A, open `Regar`, change the note and tap **Pausar** (action notice open). On B, pause `Regar`: on A the notice closes and the panel stays with the note typed, on **Acciones**, which now offers **Reanudar**.
6. With `Regar` paused, on A open, change the note and tap **Reanudar** (action notice). On B, resume it: on A the notice closes and the panel stays with the note.
7. On A, with `Regar` postponed 1 hour at `08:00`, open at `08:30`, change the note and tap **Quitar posponer** (notice). Advance the clock to `2026-07-15T09:00:00`: the notice closes by itself and the panel stays with the note typed.
8. On A, open `Regar`, change the note and tap **Pausar** with the notice open; on B, delete it: on A the notice and the panel close.

## Flow 9: Recientes

Precondition: empty list, phone, no recent emoji (new context).

1. Tap **+**, tap the emoji button and choose 🌱: the picker closes and the panel shows 🌱.
2. Tap **Cerrar** and **Descartar**: the panel closes and the list stays empty.
3. Tap **+** and the emoji button: **Recientes** shows 🌱 first (discarding did not remove it).
