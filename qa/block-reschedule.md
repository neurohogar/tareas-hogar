# QA: block rescheduling of overdue recurring tasks

Verifies, through the interface only:

- the last item **Reprogramar vencidas** of the **⋮** menu of **Pendientes**: its place below **Modo mínimo**, **Completadas** and **Pausadas**, that it is disabled (dimmed, tapping does nothing and the menu stays open) when there is no overdue recurring task in view, and that the menu always looks the same;
- the preview (title, line, rows with only emoji and title, **Reprogramar** and **Cancelar**), the tasks it lists and the order, and that it follows the data and the clock while it is open;
- confirming: the overdue recurring tasks come back as newly created, their «Tocaba …» goes away and does not come back, and the one-off, waiting, pending, postponed and paused tasks are not touched;
- that the **Historial** and «Última vez» do not change;
- the notice «Tareas reprogramadas» with **Deshacer**: 5 seconds, replaced by the completion notice and the other way round, visible across screens, and what **Deshacer** gives back;
- the minimal mode on, the two devices and the offline use;
- that nothing is offered by itself and that no count, summary or congratulation is ever shown.

Covers spec §5.4 (the notice of a block rescheduling), §5.11, §6.1 (Menu and minimal mode, Reprogramar vencidas), §7 (Block rescheduling) and §4.4.

Out of scope: the statuses, the texts and the order of the rows (`qa/recurring-relative.md`, `qa/recurring-calendar.md`, `qa/pending-order.md`), the minimal mode itself (`qa/minimal-mode.md`), the pause (`qa/pause.md`), the completion notice alone (`qa/history-undo.md`). The edges that cannot be reached from the interface (the single `writeBatch`, a delay of under one minute) are verified in the core unit tests.

## Environment

- Firebase Emulator Suite (Auth + Firestore) with clean data at the start of each flow.
- Each flow starts from a new browser context (no data saved on the device), signed in with the Auth Emulator account `qa@example.com` (Flow 1 of `qa/recurring-relative.md`).
- Simulated browser clock (`page.clock`) installed **before** opening the app, at the local time each flow gives (zone `America/Argentina/Buenos_Aires`), stopped (`page.clock.pauseAt`) and moved with `page.clock.runFor` or `fastForward` to the exact time, so that time does not run while QA acts.
  - "At X" means moving the simulated clock to X before the step.
  - "Advance the clock to X" means moving it to X and waiting for the screen to update by itself (without reloading).
- Create a task: tap **+**, type the title, choose the **Se repite** option the step gives, with the controls of `qa/one-off.md`, `qa/recurring-relative.md` and `qa/recurring-calendar.md`; save. "Complete" a task means tapping its checkbox. "Essential" means checking **Esencial** before saving.
- **Mostrar pausadas** stays off unless the flow says to turn it on. **Mostrar completadas** is turned on at the start of every flow, so that the completed `en espera` recurring tasks are in view (§6.1).
- **Two devices** (Flows 5 and 6): two independent browser contexts, A and B, with the same account and the same simulated clock. "B offline" means `browserContext.setOffline(true)` on B; "B comes back online" means putting it back online and waiting for both screens to update by themselves.

Reference dates: Wednesday 2026-07-08, Thursday 9, Friday 10, Tuesday 14, Wednesday 15, Thursday 16, Friday 17.

**Switches.** **Mostrar completadas** and **Mostrar pausadas** are the items **Completadas** and **Pausadas** of the **⋮** menu (`qa/menu-toggles.md`), not checks above the list: to turn one on or off, open the **Menú** and tap the item (the menu closes). A completed one-off task never has a row in **Pendientes**, with **Completadas** on or off: it is reached from the **Historial**.

**Navigation.** There is no navigation bar (`qa/navigation.md`): to go to **Historial**, open the **Menú** (**⋮**) of **Pendientes** and tap the item **Historial**; to go back to **Pendientes**, tap **Volver** in the header of the **Historial**. Opening `/history` directly still shows the Historial.

## Observable contract

- **Menu**: the **Menú** button of `qa/minimal-mode.md`. The menu has five items, in this order: **Historial** (role `menuitem`, always enabled, `qa/history-undo.md`), **Modo mínimo**, **Completadas** and **Pausadas** (role `menuitemcheckbox`, always enabled, `qa/menu-toggles.md`) and **Reprogramar vencidas** (role `menuitem`, the last one). It has no other item. The menu looks the same whatever the tasks are.
- **Disabled item**: **Reprogramar vencidas** is disabled when there is no overdue recurring task in view: `aria-disabled="true"` (or the `disabled` attribute) and shown dimmed (computed `opacity` lower than that of **Modo mínimo**). Tapping it does nothing: the menu stays open and no preview opens. Enabled, it has no `aria-disabled` and the same look as **Modo mínimo**.
- **Preview**: a dialog (role `dialog`) with accessible name «Reprogramar vencidas», opened by tapping the enabled item (the menu closes first). It has, in this order: the title «Reprogramar vencidas», the line «Vuelven como recién creadas, desde ahora.», a list (role `list`) with one row (role `listitem`) per task and the buttons **Reprogramar** and **Cancelar**. A row shows only the emoji (if the task has one) and the title: no «Tocaba …», no date, no checkbox, no star, no count and no other text. The rows are in the order of **Pendientes**. The preview has no count anywhere (no «3 tareas», no number of tasks). **Reprogramar** is disabled (`aria-disabled="true"` or `disabled`) while the list has no row; **Cancelar** is always enabled.
- **Notice**: the region with role `status` of `qa/history-undo.md` (at most one on screen), with the text «Tareas reprogramadas» and a **Deshacer** button, and no other text: no count, no names, no «Completaste …», no congratulation. It is seen from the moment of **Reprogramar** until 4.999 s later and is not seen from 5 s; it stays when changing between **Pendientes** and **Historial**. **Deshacer** closes it.
- **Rows, statuses, «Tocaba …», «Última vez», Historial**: those of `qa/recurring-relative.md`, `qa/recurring-calendar.md`, `qa/one-off.md`, `qa/last-time.md` and `qa/history-undo.md`. A pending row is the bold one, with no «Atrasada» and no «Tocaba …».

## Flow 1: the menu item and when it is disabled

Precondition: empty list, clock stopped at `2026-07-08T09:00:00` (Wednesday), mode off.

1. Tap **Menú**: a menu with five items, **Historial**, **Modo mínimo**, **Completadas**, **Pausadas** and, last, **Reprogramar vencidas**, dimmed (no task); the first three are enabled. Tap **Reprogramar vencidas**: nothing happens, the menu stays open and no preview opens. Tap outside: the menu closes. Open it again: it looks exactly the same.
2. Create `Pagar` (**No se repite**, due date `2026-07-10`). Advance the clock to `2026-07-11T10:00:00`: `Pagar` is overdue with its «Tocaba …». Open the menu: **Reprogramar vencidas** is still dimmed (the only overdue task is a one-off); tap it: nothing happens and the menu stays open.
3. Create `Regar` (**Intervalo** every `2` **días**) and complete it. Advance to `2026-07-12T10:00:00`: `Regar` is `en espera`; the item is dimmed. Advance to `2026-07-15T10:00:00` (the overdue time of a relative task is a whole interval after it comes back, §5.2): `Regar` is overdue with its «Tocaba …». Open the menu: **Reprogramar vencidas** is enabled, with the same look as **Modo mínimo**. Tap outside to close.
4. Pause `Regar` (row, **Pausar**): open the menu, the item is dimmed again. Tap **Reanudar** on `Regar`: it is pending, not overdue, and the item stays dimmed.
5. Create `Basura` (**Días de la semana** `miércoles`) at `2026-07-15T10:00:00`: it is pending. Advance to `2026-07-15T23:59:59` and open the menu: the item is dimmed. Advance the clock to `2026-07-16T00:00:00` without reloading: `Basura` becomes overdue and the item becomes enabled by itself, with the menu still open.

## Flow 2: preview, confirming and what is left untouched

Precondition: empty list, clock stopped at `2026-07-08T09:00:00`, mode off.

1. Create `Regar` (**Intervalo** every `2` **días**, emoji 💧) and complete it. Create `Basura` (**Días de la semana** `martes` and `jueves`). Create `Pagar` (**No se repite**, due date `2026-07-10`). Create `Dormida` (**Intervalo** every `2` **días**), complete it and pause it. Create `Luego` (**Intervalo** every `2` **días**) and complete it. Create `Barrer` (**Intervalo** every `7` **días**).
2. Advance the clock to `2026-07-16T09:00:00` (Thursday) and complete `Barrer`: it is `en espera`. At `2026-07-16T09:30:00` postpone `Luego` **3 horas**: it is `en espera`.
3. At `2026-07-16T10:00:00` the list shows `Basura`, `Regar` and `Pagar` overdue, each with its «Tocaba …». Note the exact text of every row. No notice and no preview appeared by themselves, also after reloading.
4. Open the menu and tap **Reprogramar vencidas**: the menu closes and the preview opens with the title «Reprogramar vencidas», the line «Vuelven como recién creadas, desde ahora.», the rows `Basura` and `💧 Regar` in that order (the oldest overdue first), and the buttons **Reprogramar** and **Cancelar**. The rows have no «Tocaba …», no date and no checkbox, and the preview shows no count. `Pagar`, `Barrer`, `Dormida` and `Luego` are not in it.
5. Tap **Cancelar**: the preview closes, no notice appears, and the list and every «Tocaba …» are exactly as in step 3. Open the preview again.
6. Tap **Reprogramar**: the preview closes and the notice «Tareas reprogramadas» with **Deshacer** appears, with no count and no other text. The list: `Basura` is pending (today is Thursday, one of its days) and `Regar` is pending, both with no «Atrasada» and no «Tocaba …»; `Pagar` is still overdue with the same «Tocaba …» of step 3; `Barrer` is still `en espera`; `Luego` is still `en espera`; `Dormida` is not in the list. Turn on **Mostrar pausadas**: `Dormida` is there, paused, as before. Turn it off.
7. Open the panel of `Regar`: **Última vez** says «hace 8 días» (the completion of the 8th). The **Historial** has the same entries as before, none added or removed. The panel of `Basura` says «nunca». Close the panels.
8. Open the menu: **Reprogramar vencidas** is dimmed (the only overdue task is the one-off `Pagar`).
9. At `2026-07-16T10:00:06` the notice is gone. Reload: the list is as in step 6, with no notice.
10. Advance the clock to `2026-07-17T00:00:00`: `Basura` (not completed on Thursday 16) is overdue again, with a «Tocaba …» of Thursday 16 and not of the earlier days; `Regar` is still pending, never overdue because of the days before the rescheduling.

## Flow 3: the notice and Deshacer

Precondition: empty list, clock stopped at `2026-07-08T09:00:00`; `Regar` (**Intervalo** every `2` **días**) created and completed; `Cena` (**No se repite**, no due date) created. Advance to `2026-07-16T10:00:00`: `Regar` is overdue. Each step starts again from this precondition (a new context).

1. Open the menu, **Reprogramar vencidas**, **Reprogramar** at `2026-07-16T10:00:00`: the notice «Tareas reprogramadas» appears. At `2026-07-16T10:00:04` it is still there. At `2026-07-16T10:00:05` it is gone, and `Regar` is still pending.
2. **Reprogramar** at `2026-07-16T10:00:00` and tap **Deshacer** at `2026-07-16T10:00:03`: the notice closes at once, with no message, and `Regar` is overdue again with the same «Tocaba …» as before.
3. **Reprogramar** at `2026-07-16T10:00:00`; at `2026-07-16T10:00:02` tap the checkbox of `Cena`: a single notice, `Completaste «Cena»`, with **Deshacer**; the rescheduling notice is gone. At `2026-07-16T10:00:03` tap **Deshacer**: `Cena` is pending and not completed (the completion is undone) and `Regar` is still pending (the rescheduling can no longer be undone).
4. Complete `Cena` at `2026-07-16T09:59:58` and tap **Reprogramar** at `2026-07-16T10:00:00`: the notice is «Tareas reprogramadas», not «Completaste …». At `2026-07-16T10:00:02` tap **Deshacer**: `Regar` is overdue again and `Cena` stays completed (it has no row).
5. **Reprogramar** at `2026-07-16T10:00:00`, then open the **Historial** from the menu at `2026-07-16T10:00:01`: the notice is still on screen. Tap **Volver** at `2026-07-16T10:00:03`: it is still there. At `2026-07-16T10:00:05` it is gone.

## Flow 4: the minimal mode

Precondition: empty list, clock stopped at `2026-07-08T09:00:00`, mode off.

1. Create `Regar` (**Intervalo** every `2` **días**, essential) and `Basura` (**Intervalo** every `2` **días**) and complete both. Advance to `2026-07-16T10:00:00`: both are overdue.
2. Turn on the mode: the list is `Regar` with the line «Modo mínimo». Open the menu: **Reprogramar vencidas** is enabled. Tap it: the preview lists only `Regar`, not `Basura`.
3. **Reprogramar**: `Regar` is pending. Open the menu: the item is dimmed (no overdue essential task is left). Turn the mode off: `Basura` comes back pending, with no «Tocaba …» (by the rule of the mode, not of the rescheduling).
4. New context at the same precondition: create only `Basura` (not essential) and complete it, advance to `2026-07-16T10:00:00` and turn the mode on: the list is empty with the line «Modo mínimo» and **Reprogramar vencidas** is dimmed (the only overdue task is not in view). Turn the mode off: `Basura` is pending.

## Flow 5: the preview follows the data and the clock

Precondition: two devices, A and B, empty list, clock stopped at `2026-07-08T09:00:00`. Create `Regar` and `Basura` (both **Intervalo** every `2` **días**) and complete both. Advance to `2026-07-14T09:00:00` and create `Mesa` (**Días de la semana** `jueves`). Advance to `2026-07-16T10:00:00`: `Regar` and `Basura` are overdue and `Mesa` is pending.

1. On A open the preview: `Basura`, `Regar` (the oldest overdue first: complete `Basura` before `Regar` in the precondition so that the order does not depend on the milliseconds of the simulated clock).
2. On B complete `Basura`: on A, without reloading, `Basura` leaves the preview and **Reprogramar** stays enabled. On B delete `Regar` (its panel, **Borrar tarea**, confirming): on A `Regar` leaves the preview and the list is empty: **Reprogramar** is dimmed and tapping it does nothing; only **Cancelar** closes it.
3. Tap **Cancelar** on A. Undo the completion of `Basura` on B (**Historial**, **Borrar**): `Basura` is overdue again. Open the preview on A: it lists `Basura`. Leave it open and advance the clock of A and B to `2026-07-16T23:59:59`, then to `2026-07-17T00:00:00` without reloading: `Mesa` (its Thursday passed) enters the open preview by itself.
4. Tap **Reprogramar** on A: it acts on every task in the preview at that moment (`Basura` and `Mesa`), with no further question, and the notice appears. `Basura` is pending and `Mesa` (a calendar task whose day is not today, Friday 17) is `en espera`, both with no «Tocaba …».

## Flow 6: two devices and offline

Precondition: two devices, A and B, empty list, clock at `2026-07-08T09:00:00`; `Regar` (**Intervalo** every `2` **días**) created and completed on A, B sees it. Advance both to `2026-07-16T10:00:00`: `Regar` is overdue on both.

1. A offline. On A, **Reprogramar vencidas**, **Reprogramar**: `Regar` is pending on A and the notice appears, without any error or message about the connection. B (online, it has not received it) still shows `Regar` overdue. A comes back online: on B, without reloading, `Regar` is pending, with no «Tocaba …».
2. Repeat from the precondition (a new context). B offline. On A, **Reprogramar** at `2026-07-16T10:00:00`. On B (offline, it has not seen it) complete `Regar` at `2026-07-16T10:00:02`. On A tap **Deshacer** at `2026-07-16T10:00:03`. B comes back online: on A and on B `Regar` is `en espera` (the completion stays) and not overdue.
3. Repeat from the precondition. B offline. On A, **Reprogramar** at `2026-07-16T10:00:00`. On B (offline) delete `Regar`. B comes back online. On A tap **Deshacer** at `2026-07-16T10:00:03`: `Regar` is not revived; the list is empty on A and on B.
4. Repeat from the precondition. A offline: **Reprogramar** at `2026-07-16T10:00:00` and **Deshacer** at `2026-07-16T10:00:03`, still offline: `Regar` is overdue again on A, with no message. A comes back online: `Regar` is overdue on B as well.

## Flow 7: nothing is offered and no summary

Precondition: empty list, clock stopped at `2026-07-08T09:00:00`; `Regar` and `Basura` (both **Intervalo** every `2` **días**) created and completed; `Pagar` (**No se repite**, due date `2026-07-10`) created.

1. Advance the clock to `2026-08-20T10:00:00` (a long absence; no reload, because with the simulated clock six weeks ahead the sign-in token refresh never ends): the three are overdue. No preview, notice, banner, badge or text offering to reschedule, and no text about what piled up or how many tasks are overdue, appears anywhere (**Pendientes**, **Historial**, the menu). The only way to the rescheduling is the **⋮** menu.
2. Open the menu and tap **Reprogramar vencidas**: the preview lists `Basura` and `Regar` and shows no count. Tap **Reprogramar**: the notice says only «Tareas reprogramadas» (no number, no names, no congratulation); the list has no message either.
3. Tap **Deshacer**: the notice closes with no message. At no moment is a count or a summary shown.
