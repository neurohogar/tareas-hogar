# QA: essential tasks and the minimal mode

Verifies, through the interface only:

- the **Esencial** check of the panel (in **Tarea**, after the note, text only), its starting value when creating and editing, and that it counts for unsaved changes;
- the small star of the essential tasks in every kind of row;
- the **⋮** button («Menú») in the header of **Pendientes**, its five items in the order **Historial**, **Modo mínimo**, **Completadas**, **Pausadas**, **Reprogramar vencidas**, the check mark of the three on/off items when on, that each acts at once and without any message (the items **Completadas** and **Pausadas** are in `qa/menu-toggles.md`, the last item, **Reprogramar vencidas**, in `qa/block-reschedule.md`);
- the line «Modo mínimo» above the list, also with an empty list;
- which rows are in view with the mode on (only the essential ones), with **Mostrar completadas** and **Mostrar pausadas**, and that the **Historial** does not change;
- the return without debt when the mode is turned off, and that the mode never turns itself on or off and survives reloading;
- the panel of a non-essential task during the mode (opened from the **Historial**) and changing the **Esencial** mark or the kind with the mode on;
- that the loading screen waits for the state of the mode, and the mode with two devices.

Covers spec §4.1 (`essential`), §5.8 (Minimal mode), §5.9, §6 (Navigation), §6.1 (Menu and minimal mode, Which rows are in view, Mostrar pausadas, star of the row), §6.2 (Esencial, Pause / Resume, Minimal mode in the panel, Unsaved changes), §6.6 (Loading screen) and §7 (Minimal mode).

Out of scope: the statuses, the order and the texts of the rows without the mode (`qa/recurring-relative.md`, `qa/recurring-calendar.md`, `qa/pending-order.md`), the pause by hand (`qa/pause.md`), the **Historial** itself (`qa/history-undo.md`) and the fonts of the loading screen (`qa/bundled-font.md`).

## Environment

- Firebase Emulator Suite (Auth + Firestore) with clean data at the start of each flow.
- Each flow starts from a new browser context (no data saved on the device), signed in with the Auth Emulator account `qa@example.com` (Flow 1 of `qa/recurring-relative.md`).
- Simulated browser clock (`page.clock`) installed **before** opening the app, at the local time each flow gives (zone `America/Argentina/Buenos_Aires`).
  - "At X" means advancing the simulated clock to X before the step.
  - "Advance the clock to X" means advancing it to X and waiting for the screen to update by itself (without reloading).
  - With a "stopped clock" (`page.clock.pauseAt`), the clock is advanced with `page.clock.runFor` or `fastForward` to the exact time, so that time does not run while QA acts.
- Create a task: tap **+**, type the title, choose the **Se repite** option the step gives, with the controls of `qa/one-off.md`, `qa/recurring-relative.md` and `qa/recurring-calendar.md`; save. "Essential" in a step means: check **Esencial** before saving.
- **Mostrar completadas** and **Mostrar pausadas** (the items **Completadas** and **Pausadas** of the **⋮** menu) stay off unless the flow says to turn them on. A completed one-off task never has a row in **Pendientes**, with **Completadas** on or off.
- **Two devices** (Flow 8): two independent browser contexts, A and B, with the same account and the same simulated clock. "B offline" means `browserContext.setOffline(true)` on B; "B comes back online" means putting it back online and waiting for both screens to update by themselves.

Reference week: Monday 2026-07-13, Tuesday 14, Wednesday 15, Thursday 16, Friday 17, Saturday 18, Sunday 19, Monday 20.

**Navigation.** There is no navigation bar (`qa/navigation.md`): to go to **Historial**, open the **Menú** (**⋮**) of **Pendientes** and tap the item **Historial**; to go back to **Pendientes**, tap **Volver** in the header of the **Historial**. Opening `/history` directly still shows the Historial.

## Observable contract

- **Esencial check**: in the **Tarea** section of the panel, after the **Nota** field and as the last control of the section, a control with role `checkbox` and accessible name «Esencial», with the visible text «Esencial» and no icon. Checked = essential.
- **Star of the row**: right after the title, on the same line, an element with accessible name «Esencial» (role `img`), drawn as an outlined star with the color of the title text (computed `color` equal to that of the title); it is not a control: tapping it opens the panel like tapping the row. It appears in every kind of row (pending, overdue, waiting, completed, paused) of an essential task, with the mode on or off, and in no row of a non-essential task.
- **Menu button**: in the header of **Pendientes**, a button with accessible name «Menú» (`aria-haspopup`), small, which opens a menu. The menu has five items, in this order: **Historial** (role `menuitem`: a plain item, no check mark, always enabled, also with the mode on; tapping it closes the menu and opens the **Historial**, `qa/history-undo.md`), **Modo mínimo**, **Completadas** and **Pausadas** (the three with role `menuitemcheckbox`: when on they show a check mark and `aria-checked="true"`; off, no mark and `aria-checked="false"`) and **Reprogramar vencidas** (`qa/block-reschedule.md`). Tapping **Modo mínimo** turns the mode on or off at once, with no confirmation, and closes the menu; **Completadas** and **Pausadas** behave the same way for **Mostrar completadas** and **Mostrar pausadas** (`qa/menu-toggles.md`). The menu has no other item. There are no check boxes **Mostrar completadas** and **Mostrar pausadas** outside the menu.
- **Line «Modo mínimo»**: with the mode on and the menu closed, a text «Modo mínimo» above the list, in secondary text (computed `color` different from the title text), with no icon, no number and no role of control; tapping it does nothing. With the mode off, that text is not on the screen (with the menu closed).
- **No message**: turning the mode on or off shows no notice, toast, dialog, count or text about how many tasks were paused or came back, and no congratulation.
- **Rows, notices, panel**: those of `qa/pause.md`. A paused row has the text «Pausada» and a disabled checkbox. In the panel, the pause text at the top of **Tarea** is «Pausada» or «Pausada por el modo mínimo».
- **List**: "The list is A, B, C" means exactly those rows, from top to bottom (the line «Modo mínimo» is not a row).
- **Historial**: the contract of `qa/history-undo.md`; an entry opens the panel of its task.

## Flow 1: the Esencial check and the star

Precondition: empty list, clock at `2026-07-14T09:00:00` (Tuesday), mode off.

1. Tap **+**: the **Nueva tarea** panel has the **Esencial** check, unchecked, after the **Nota** field and with no icon. Type `Pagar la luz` and save with **No se repite** and no due date: the row has no star.
2. Create `Regar` (**Intervalo** every `2` **días**), essential: its row has the star, right after the title, with the accessible name «Esencial». Tap the star: the panel of **Regar** opens, with **Esencial** checked. Close the panel.
3. Tap the **Pagar la luz** row, check **Esencial**, tap the X: the notice of unsaved changes appears. Choose to keep editing, uncheck **Esencial** and tap the X: the panel closes with no notice. Open it again, check **Esencial** and save: the row has the star. The list order is the same as before checking.
4. Create `Basura` with **Días de la semana** `martes` and `jueves`, essential. Turn on **Mostrar completadas**, tap the checkbox of **Basura**: it looks completed (waiting and completed) and keeps the star. Tap the checkbox of **Pagar la luz**: it has no row (a completed one-off task is never in the list). Pause **Regar** (row, **Pausar**) and turn on **Mostrar pausadas**: its paused row keeps the star. Every row with a star is an essential task; no row without one is.
5. Open the **Regar** panel, uncheck **Esencial** and save: its row loses the star.
6. Reload: the stars are in the same rows (`Pagar la luz`, completed one-off, has no row). With the mode off, press **Enter** in the **Título** field of the panel of `Basura` after unchecking **Esencial**: the panel saves and closes, and the star is gone.

## Flow 2: the menu, the mode and the line

Precondition: empty list, clock at `2026-07-14T09:00:00`, mode off.

1. In the header of **Pendientes** there is a **Menú** button. Tap it: a menu opens with five items, in this order: **Historial** (enabled, no check mark), **Modo mínimo**, **Completadas**, **Pausadas** (the three without a check mark) and **Reprogramar vencidas** (`qa/block-reschedule.md`). Nothing else is in the menu. Tap outside it: it closes and nothing changed.
2. With the list empty, open the menu and tap **Modo mínimo**: the menu closes at once, with no confirmation or message, and the line «Modo mínimo» is above the empty list (the mode can be turned on with no essential task). The list has no rows.
3. Tap the line: nothing happens. Open the menu: the item **Modo mínimo** has the check mark. Tap it: the menu closes, the line is gone and nothing else appears (no count, no message). Nothing outside the menu shows the value of **Completadas** or **Pausadas**.
4. Create `Foco` (**No se repite**, no due date), essential. Turn the mode on: the line is shown above the list `Foco`. Reload: the line is still shown and the list is `Foco`. Close the tab and open the app again in the same context: the same.
5. Advance the clock to `2026-07-30T09:00:00`: the mode is still on (no timer, no end date) and the line is still shown. Turn it off: the line is gone.

## Flow 3: which rows are in view

Precondition: empty list, clock stopped at `2026-07-15T09:00:00` (Wednesday), mode off. **Mostrar completadas** and **Mostrar pausadas** off.

1. Create, in this order: `Cena` (**No se repite**, no due date), `Foco` (**No se repite**, no due date, essential), `Pagar` (**No se repite**, due date `2026-07-14`, essential), `Barrer` (**Intervalo** every `2` **días**, essential), `Lavar` (**Intervalo** every `2` **días**), `Basura` (**Días de la semana** `miércoles`, essential), `Planchar` (**Días de la semana** `jueves`), `Regar` (**Intervalo** every `2` **días**, essential) and `Secar` (**Intervalo** every `2` **días**).
2. With **Mostrar completadas** on, complete `Barrer` and `Lavar`; then turn it off. With **Mostrar pausadas** on, pause `Regar` and `Secar` by hand (row, **Pausar**); then turn it off. The list is `Pagar`, `Basura`, `Cena`, `Foco` and `Planchar`, in the order the app gives (call it L0: write it down), with the star on `Pagar`, `Basura` and `Foco`.
3. Turn the mode on: the line «Modo mínimo» is shown and the list is L0 without `Cena` and `Planchar`, in the same relative order. `Cena`, `Planchar` and `Lavar` are in no way in view.
4. Turn on **Mostrar completadas**: the same rows plus `Barrer` (completed, struck through, checkbox checked, with the star); `Lavar` (completed, not essential) is not in the list.
5. Turn on **Mostrar pausadas** too: the list is the non-completed rows, then `Barrer` (completed), then `Regar` (paused by hand and essential: dimmed, «Pausada», disabled checkbox, with the star). `Secar` (paused by hand, not essential), `Lavar`, `Planchar` and `Cena` are not in the list.
6. Turn off **Mostrar completadas** and **Mostrar pausadas**, then open the **Historial**: it has the completions of `Barrer` and `Lavar` (also the non-essential one), as with the mode off. Tap the entry of `Lavar`: its panel opens (Flow 5 describes it). Close it.
7. Turn the mode off: the list is the rows of L0 and `Lavar`, which comes back pending (it is non-essential and recurring: resumed when turning the mode off). `Regar` and `Secar` are still paused by hand: they appear only with **Mostrar pausadas**, with «Pausada».

## Flow 4: return without debt

Precondition: empty list, clock stopped at `2026-07-10T09:00:00` (Friday), mode off.

1. Create `Regar` (**Intervalo** every `2` **días**) and complete it. Create `Barrer` (**Intervalo** every `2` **días**) and `Sacar la basura` (**Días de la semana** `martes` and `jueves`). Create `Foco` (**No se repite**, no due date, essential) and `Pagar` (**No se repite**, due date `2026-07-14`).
2. At `2026-07-14T08:00:00` (Tuesday), turn the mode on: the list is `Foco`. (Without the mode, `Barrer`, `Sacar la basura` and `Pagar` would be overdue in the next days.)
3. Advance the clock to `2026-07-20T10:00:00` (Monday): the list is still only `Foco`, with no overdue indicator, and the line «Modo mínimo» is shown.
4. At `2026-07-20T10:00:00`, turn the mode off: no summary or message appears. `Regar` and `Barrer` are pending (bold, checkbox enabled, no «Atrasada» and no «Tocaba …»: not even `Regar`, completed 10 days before). `Pagar` is overdue as it was (it shows its own overdue text for the 14th). `Sacar la basura` is waiting until Tuesday 21 (today, Monday, is not one of its days), without «Atrasada».
5. Advance the clock to `2026-07-21T00:00:00`: `Sacar la basura` is pending.
6. At `2026-07-23T09:00:00`, complete `Regar` and `Barrer` (both waiting). Turn the mode on. Advance the clock to `2026-07-24T10:00:00` and turn it off: both are pending at once, even though they were completed the day before the mode was turned on.

## Flow 5: panel of a non-essential task during the mode

Precondition: empty list, clock at `2026-07-15T09:00:00`, mode off.

1. Create `Regar`, `Limpiar` (both **Intervalo** every `2` **días**), `Pagar` (**No se repite**, due date `2026-07-14`) and `Basura` (**Días de la semana** `miércoles`); complete all four (with **Mostrar completadas** on to reach the completed recurring rows; `Pagar` has no row once completed). Pause `Limpiar` by hand (its row, **Pausar**). Turn the mode on.
2. Open the **Historial** and tap the entry of `Regar`: the **Editar tarea** panel opens. At the top of **Tarea** it says «Pausada por el modo mínimo», then **Última vez**. **Acciones** has **Borrar tarea** and has no **Pausar**, **Reanudar**, **Posponer** or **Quitar posponer**. **Esencial** is unchecked. Close it.
3. Tap the entry of `Pagar` (one-off): the usual panel, with no text of pause and no **Pausar** or **Reanudar**. Close it.
4. Tap the entry of `Limpiar`: the panel says «Pausada» (not the text of the mode) and has **Reanudar**, with no **Pausar** and no **Posponer**. Tap **Reanudar**: the panel closes. Open it again from the **Historial**: it now says «Pausada por el modo mínimo», without **Pausar** or **Reanudar**.
5. Turn the mode off: `Limpiar` is pending (the manual pause was removed and the mode brought it back).

## Flow 6: changing the Esencial mark or the kind with the mode on

Precondition: empty list, clock stopped at `2026-07-15T09:00:00`, mode off.

1. Create `Foco` (**No se repite**, no due date, essential), `Regar` (**Intervalo** every `2` **días**, essential) and `Cena` (**No se repite**, no due date). Complete `Regar` and `Cena`. Turn the mode on: the list is `Foco`.
2. Tap `Foco`, uncheck **Esencial** and save: `Foco` leaves the list at once (hidden); the list is empty with the line «Modo mínimo».
3. Tap the **Regar** row, uncheck **Esencial** and save: `Regar` leaves the list (paused by the mode). The list is empty.
4. Open the **Historial**, tap the entry of `Regar`: the panel says «Pausada por el modo mínimo». Check **Esencial** and save, at `2026-07-20T10:00:00`: `Regar` is back in the list, pending (bold, no «Atrasada», no «Tocaba …»), even though it was completed on the 15th.
5. Tap the entry of `Cena` in the **Historial**, check **Esencial** and save: `Cena` is still not in the list (it is a completed one-off task).
6. Create `Lavar` (**Intervalo** every `2` **días**, essential): it is in the list. Change **Se repite** to **No se repite** and save: it stays in view (it is essential). Uncheck **Esencial** and save: it leaves the list (hidden).
7. Open the **Historial** and tap the entry of `Regar` (essential, completed on the 15th): change **Se repite** to **No se repite** and save: `Regar` is a completed one-off task and it is not in the list, although it is essential. From the **Historial** open it again, change **Se repite** to **Intervalo** every `2` **días** and save: it is in the list, pending. Uncheck **Esencial** and save: it is paused by the mode (not in the list; the panel says «Pausada por el modo mínimo»).
8. Tap **+**: the **Esencial** check is checked and the form is as it was opened: tap the X and the panel closes with no notice. Open **+** again, uncheck **Esencial**, tap the X: the notice of unsaved changes appears. Keep editing, type `Barrer` with **Intervalo** every `2` **días** and save unchecked: `Barrer` is not in the list (paused by the mode). Tap **+**, type `Foco 2`, **No se repite**, save with the check as it starts: `Foco 2` is in the list with the star.

## Flow 7: the loading screen

Precondition: signed in, `Foco` essential, `Cena` not essential, both created with the mode on (clock at `2026-07-15T09:00:00`).

1. Reload the app with the network responses delayed by 3 seconds (for example with `page.route`): the loading screen stays until the tasks, the completions and the mode arrive; the first thing shown after it is the list `Foco` with the line «Modo mínimo», never a list with `Cena`, and never the list without the line.
2. With the mode off, reload with the same delay: the first thing shown is the full list with no line.
3. Without a session (signed out), reload: the loading screen does not wait for the mode.

## Flow 8: two devices

Precondition: empty list, clock at `2026-07-14T08:00:00` (Tuesday) on A and on B.

1. On A, create `Foco` (**No se repite**, no due date, essential) and `Regar` (**Intervalo** every `2` **días**). B sees both.
2. On A, turn the mode on: B, without reloading, shows the line «Modo mínimo» and the list `Foco`, and its menu item has the check mark.
3. B offline. On A, at `2026-07-20T10:00:00`, turn the mode off: `Regar` is pending on A. On B (offline, did not see it) the mode is still on and the list is `Foco`.
4. B comes back online: on A and on B the mode is off, `Regar` is pending and the line is gone.
5. B offline. On A, turn the mode on. On B (which did not see it), turn the mode on and then turn it off. B comes back online: the last change wins, so on A and on B the mode is off.
6. On A, check **Esencial** on `Regar` while B, offline, changes its title to `Regar plantas`. B comes back online: on A and on B the task is called **Regar plantas** and has the star.
7. On A, tap **+** with the mode on: the **Esencial** check starts checked. On B, turn the mode off while A's panel is open: the check stays checked on A and tapping the X closes the panel with no notice.
8. On B, turn the mode on and reload A: the mode is on on A.
