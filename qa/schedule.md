# QA: schedule (daily windows for completing)

Verifies, through the interface only:

- the **Horario** field of the panel ("Solo en un horario", **Desde**, **Hasta**): create, change and remove a schedule on any kind of task, and its two errors;
- the schedule on the row ("08:00–11:00");
- the statuses with a schedule: `waiting` until the window opens, `pending` inside it and `overdue` when the window passes without completing (or earlier, if the overdue point without a schedule comes first), also outside the windows;
- the row checkbox: disabled outside the window when it would complete, always enabled when it would delete; «Deshacer» in the notice at any time;
- «Mostrar completadas»: a recurring task completed and waiting because of its schedule is not shown until the window opens;
- the order by urgency with a schedule;
- the sync of the schedule as a single field;
- that a task without a schedule behaves as always;
- **several schedules** (Flows 11 to 15): **Agregar horario** and **Quitar** in the panel, its two errors, the text "07:00–10:00 · 18:00–21:00" on the row, and the statuses and the checkbox with two windows per day on calendar, one-off and relative-in-days recurrence.

Covers spec §4.1 (schedule and several schedules), §5.5, §5.6, §5.7, §6.1 (schedule on the row, checkbox outside the window, order), §6.2 (Horario field) and §7 (conflicts by field).

Out of scope: the statuses without a schedule (`qa/one-off.md`, `qa/recurring-relative.md`, `qa/recurring-calendar.md`), the «Historial» beyond deleting a completion (`qa/history-undo.md`).

## Environment

- Firebase Emulator Suite (Auth + Firestore) with clean data at the start of each flow.
- Each flow starts from a new browser context (no data saved on the device), signed in with the `qa@example.com` account of the Auth Emulator (Flow 1 of `qa/recurring-relative.md`).
- Simulated browser clock (`page.clock`) installed **before** opening the app, at the local time that each flow indicates (zone `America/Argentina/Buenos_Aires`).
  - "At X" means advancing the simulated clock to X before the step.
  - "Advance the clock to X" means advancing it to X and waiting for the screen to update by itself (without reloading).
  - With a "stopped clock" (`page.clock.pauseAt`), the clock is advanced with `page.clock.runFor` or `fastForward` to the exact time, so that time does not run while QA acts.
- Creating a task: tap **+**, type the title, choose the **Se repite** option that the step indicates, with the controls of `qa/one-off.md`, `qa/recurring-relative.md` and `qa/recurring-calendar.md`; if the step gives a schedule, turn on **Solo en un horario** and type **Desde** and **Hasta**; save.
- **Mostrar completadas** stays off unless the flow says to turn it on (`qa/show-completed.md`).
- **Two devices** (Flow 9): two independent browser contexts, A and B, with the same account and the same simulated clock. "B offline" means `browserContext.setOffline(true)` on B; "B is back online" means setting it online again and waiting for both screens to update by themselves.

Reference week: Monday 2026-07-13, Tuesday 14, Wednesday 15, Thursday 16, Friday 17, Saturday 18.

**Switches.** **Mostrar completadas** and **Mostrar pausadas** are the items **Completadas** and **Pausadas** of the **⋮** menu (`qa/menu-toggles.md`), not checks above the list: to turn one on or off, open the **Menú** and tap the item (the menu closes). A completed one-off task never has a row in **Pendientes**, with **Completadas** on or off: it is reached from the **Historial**.

**Navigation.** There is no navigation bar (`qa/navigation.md`): to go to **Historial**, open the **Menú** (**⋮**) of **Pendientes** and tap the item **Historial**; to go back to **Pendientes**, tap **Volver** in the header of the **Historial**. Opening `/history` directly still shows the Historial.

## Observable contract

- **Horario field of the panel**: a control with role `checkbox` and accessible name "Solo en un horario". When on, it shows two time fields (`input type="time"` or equivalent with an accessible role) with labels **Desde** and **Hasta**; when off, they are not shown.
  - Below the Desde/Hasta rows, a button with accessible name **Agregar horario** that adds another empty Desde/Hasta row. With more than one row, each row has a **Quitar** button that removes it; with a single row, there is no **Quitar**.
  - Errors: the text "La hora de fin tiene que ser posterior a la de inicio", "Completá las dos horas", "Los horarios no se pueden superponer" or "Con varios horarios, el intervalo tiene que ser en días", visible in the panel. With an error, **Guardar** does not close the panel and saves nothing: when closing the panel without saving (with **Descartar** in the notice), the list and the row did not change.
- **Schedule on the row**: the text `HH:MM–HH:MM` (with en dash `–`, U+2013) inside the task row, in smaller type than the title (computed `font-size` smaller). With several windows, ordered by start and separated by ` · ` (space, middle dot U+00B7, space): `07:00–10:00 · 18:00–21:00`. A task without a schedule does not have that text.
- **Row**: the contract of `qa/recurring-relative.md` (checkbox, title, dimmed style, progress bar with `aria-valuenow`, "Atrasada" indicator) and that of `qa/show-completed.md` (completed / not completed). With a schedule, a one-off task can also be `waiting` (dimmed, with a bar, without completions).
- **Disabled checkbox**: the row checkbox has `disabled` or `aria-disabled="true"`; tapping it changes nothing (no notice, the row does not change, the «Historial» gets no entries). **Enabled**: without those attributes.
- **Notice**: the one of `qa/history-undo.md` (role `status`, `Completaste «…»`, **Deshacer**, 5 seconds).
- **List**: "The list is A, B, C" means exactly those rows, from top to bottom.

## Flow 1: create, change and remove the schedule

Precondition: empty list, clock at `2026-07-15T06:00:00` (Wednesday).

1. Tap **+**. The **Solo en un horario** check is shown off and there are no **Desde** or **Hasta** fields.
2. Type the title `Regar`, choose **No se repite**, turn on **Solo en un horario**: **Desde** and **Hasta** appear. Type **Desde** `08:00` and **Hasta** `11:00`. Save.
   - The **Regar** row shows `08:00–11:00`.
3. Create `Ventilar` with **Intervalo** every `1` **días** and schedule `20:00` to `22:30`: its row shows `20:00–22:30`.
4. Create `Sacar la basura` with **Días de la semana** `jueves` and schedule `09:00` to `10:00`: its row shows `09:00–10:00`.
5. Create `Barrer` with **No se repite** and without a schedule: its row shows no schedule.
6. Tap the **Regar** row: the panel shows **Solo en un horario** on, **Desde** `08:00` and **Hasta** `11:00`. Change **Desde** to `07:30` and save: the row shows `07:30–11:00`.
7. Tap the **Regar** row, change **Se repite** to **Intervalo** every `2` **días** and save: the row still shows `07:30–11:00`.
8. Tap the **Regar** row, turn off **Solo en un horario** and save: the row shows no schedule.
9. Reload: **Regar** without a schedule, **Ventilar** `20:00–22:30`, **Sacar la basura** `09:00–10:00`, **Barrer** without a schedule.

## Flow 2: errors of the Horario field

Precondition: empty list, clock at `2026-07-15T06:00:00`. Create `Regar` with **No se repite** and schedule `08:00` to `11:00`.

1. Tap **+**, type `Pagar la luz`, choose **No se repite**, turn on **Solo en un horario**, type **Desde** `11:00` and **Hasta** `08:00` and tap **Guardar**.
   - "La hora de fin tiene que ser posterior a la de inicio" is shown and the panel stays open.
2. Change **Hasta** to `11:00` (equal to **Desde**) and tap **Guardar**: the same error is shown.
3. Clear **Hasta** (empty) and tap **Guardar**: "Completá las dos horas" is shown.
4. Type **Hasta** `12:00` and tap **Guardar**: the panel closes and **Pagar la luz** shows `11:00–12:00` (the error is shown until the next attempt to save, like that of the other fields of the panel).
5. Tap the **Regar** row, change the title to `Regar plantas` and **Desde** to `11:30`, and tap **Guardar**: "La hora de fin tiene que ser posterior a la de inicio" is shown. Close the panel without saving (and **Descartar** in the "Tenés cambios sin guardar" notice): the row is still **Regar** with `08:00–11:00` (the edit is rejected as a whole).
6. Tap the **Regar** row, empty **Desde** and tap **Guardar**: "Completá las dos horas" is shown. Close without saving (and **Descartar** in the "Tenés cambios sin guardar" notice): the row still shows `08:00–11:00`.

## Flow 3: one-off with a schedule, checkbox and «Deshacer»

Precondition: empty list, clock stopped at `2026-07-15T06:00:00` (Wednesday).

1. Create `Regar` with **No se repite**, without a due date, schedule `08:00` to `11:00`.
   - The row is `waiting`: dimmed, with a bar; the title in bold and the checkbox unchecked (it is not completed); without an overdue indicator.
   - The checkbox is **disabled**. Tap it: no notice appears and the row does not change.
2. At `07:00`: the bar shows `50` (1 h of the 2 h until 08:00).
3. At `08:00:00`: the row becomes `pending` (not dimmed, without a bar) and the checkbox is **enabled**.
4. At `10:59:58`, tap the checkbox: `Completaste «Regar»` appears and the row disappears from the list.
5. At `11:00:02` (the window has already closed, the notice is still visible), tap **Deshacer**: the notice closes and **Regar** goes back to the list as `waiting`, with the bar at `0` and the checkbox **disabled** (until 08:00 on Thursday).
6. At `2026-07-15T21:30:00`: the bar shows `50`. Still no overdue indicator (a one-off task without a due date never becomes overdue).
7. At `2026-07-16T08:00:00`: `pending` and checkbox enabled.

## Flow 4: one-off with a due date

Precondition: empty list, clock at `2026-07-15T06:00:00`.

1. Create `Pagar la luz` with **No se repite**, Fecha límite `2026-07-16` and schedule `08:00` to `11:00`. It is `waiting`, checkbox disabled.
2. Advance the clock to `2026-07-16T10:59:00`: `pending`, checkbox enabled.
3. Advance the clock to `2026-07-16T11:00:00`: `overdue` ("Atrasada" indicator, not dimmed, without a bar) and checkbox **disabled**.
4. Advance the clock to `2026-07-17T08:00:00`: still `overdue`, now with the checkbox **enabled**. Tap it: `Completaste «Pagar la luz»` appears and the row disappears.
5. Advance the clock to `2026-07-17T12:00:00`. Create `Pagar el gas` with Fecha límite `2026-07-17` and schedule `08:00` to `11:00`: it appears `overdue` right away (the window of its due day has already closed), with the checkbox disabled.

## Flow 5: relative with a schedule

Precondition: empty list, clock stopped at `2026-07-15T09:00:00` (Wednesday). Tap **Completadas** in the **⋮** menu (it stays checked).

1. Create `Regar` with **Intervalo** every `1` **días** and schedule `08:00` to `11:00`. It is `pending` (never completed, created inside the window), checkbox enabled.
2. Tap the checkbox: the row becomes completed, `waiting`, with the bar at `0`.
3. At `15:00`: the bar shows `25` (it comes back on Thursday at 09:00). The checkbox (which would delete today's completion) is **enabled**.
4. At `2026-07-16T09:00:00`: `pending`. At `2026-07-16T11:00:00`: `overdue`, checkbox **disabled**. At `2026-07-16T20:00:00`: still `overdue` and disabled.
5. At `2026-07-17T08:00:00`: still `overdue`, checkbox **enabled**. Tap it: the notice appears and the row becomes completed, `waiting`.
6. At `2026-07-17T20:00:00`: bar at `50`.

## Flow 6: overdue before the window opens

Precondition: empty list, clock stopped at `2026-07-15T10:00:00`.

1. Create `Remedio` with **Intervalo** every `4` **horas** and schedule `08:00` to `11:00`, and tap its checkbox at `10:00`. Tap **Completadas** in the **⋮** menu.
2. At `15:30`: `waiting`, bar at `25` (it comes back on Thursday at 08:00).
3. At `18:00`: `overdue` (V + interval has passed, even though the window did not open), checkbox **disabled**.
4. At `2026-07-16T08:00:00`: still `overdue`, checkbox **enabled**.

## Flow 7: calendar and «Mostrar completadas»

Precondition: empty list, clock at `2026-07-14T07:00:00` (Tuesday). «Mostrar completadas» off.

1. Create `Sacar la basura` with **Días de la semana** `martes` and `jueves` and schedule `08:00` to `11:00`. It is `waiting` without completions (not completed): it is shown, in bold, checkbox unchecked and **disabled**.
2. At `08:00`: `pending`. Tap the checkbox: the row disappears (completed).
3. Advance the clock to `2026-07-16T07:59:00` (Thursday): the list is still empty (the task is still `waiting` and completed; without a schedule it would already be `pending` since 00:00).
4. Tap **Completadas** in the **⋮** menu: **Sacar la basura** is shown completed, `waiting`. Its checkbox (which would complete it again: the completion is from an earlier day) is **disabled**. Turn off **Mostrar completadas**.
5. Advance the clock to `2026-07-16T08:00:00`: **Sacar la basura** appears `pending`.
6. Advance the clock to `2026-07-16T11:00:00`: `overdue`, checkbox disabled.
7. Advance the clock to `2026-07-17T09:00:00` (Friday): still `overdue`, checkbox enabled. Tap it: completed. In the **Historial**, the new completion appears with the task **Sacar la basura** (§5.3: it covers Thursday; it comes back the following Tuesday).
8. In the **Historial**, at `2026-07-17T20:00:00` (outside the window), delete that completion: it is deleted and the task goes back to the list as `overdue`.

## Flow 8: order with a schedule

Precondition: empty list, clock at `2026-07-15T08:00:00` (Wednesday).

1. At `08:00`, create `Cambiar sábanas` with **Días de la semana** `jueves` (without a schedule) and `Sacar la basura` with **Días de la semana** `jueves` and schedule `09:00` to `10:00`.
2. At `12:00`, create `Cambiar foco` with **No se repite**, without a due date, and schedule `08:00` to `11:00`.
3. At `14:00`: the three are `waiting` and the list is **Cambiar sábanas**, **Cambiar foco**, **Sacar la basura** (they come back on Thursday at 00:00, 08:00 and 09:00).
4. Tap **Cambiar foco**, change the schedule to `10:00` to `11:00` and save: the list is **Cambiar sábanas**, **Sacar la basura**, **Cambiar foco**.
5. Advance the clock to `2026-07-16T09:30:00`: **Cambiar sábanas** and **Sacar la basura** are `pending` and **Cambiar foco** is `waiting`. The list is **Cambiar sábanas**, **Sacar la basura**, **Cambiar foco** (pending since 00:00 and since 09:00).
6. Create `Pagar la luz` with **No se repite**, Fecha límite `2026-07-17` and schedule `08:00` to `11:00`, and `Barrer` with **No se repite**, without a due date and schedule `08:00` to `11:00`. Both are `pending` (inside their window).
   - The list is **Cambiar sábanas**, **Sacar la basura**, **Pagar la luz**, **Barrer**, **Cambiar foco**: a one-off task with a schedule keeps its order key (00:00 of its due date; without a due date, at the end of the group), not the moment its window opened.
7. Tap **Pagar la luz**, change the Fecha límite to `2026-07-16` and save: the list is **Cambiar sábanas**, **Pagar la luz**, **Sacar la basura**, **Barrer**, **Cambiar foco** (00:00 of the 16th ties with **Cambiar sábanas**, which goes first because of its older `creadaEn`; **Pagar la luz** goes before **Sacar la basura**, pending since 09:00).

## Flow 9: two devices

Precondition: empty list, clock at `2026-07-15T06:00:00`. A and B open. On A, create `Regar` with **No se repite** and schedule `08:00` to `11:00`; wait for B to show it with `08:00–11:00`.

1. Put B offline. On A, change **Desde** of **Regar** to `07:00` and save. On B, change **Hasta** of **Regar** to `12:00` and save.
2. B is back online: both screens show `08:00–12:00` (the last change wins as a whole; `07:00–12:00` does not remain).
3. Put B offline. On A, turn off **Solo en un horario** of **Regar** and save. On B, change the title of **Regar** to `Regar plantas` and save.
4. B is back online: both screens show **Regar plantas** without a schedule.

## Flow 10: without a schedule, everything stays the same

Precondition: empty list, clock at `2026-07-15T03:00:00`.

1. Create `Barrer` with **No se repite**, without a due date and without a schedule: `pending`, without schedule text, checkbox **enabled** at 03:00.
2. Create `Regar` with **Intervalo** every `1` **días** without a schedule and tap its checkbox at `03:00`. Advance the clock to `2026-07-16T03:00:00`: **Regar** is `pending` and its checkbox enabled, at any time.

## Flow 11: Agregar horario and Quitar

Precondition: empty list, clock at `2026-07-15T06:00:00` (Wednesday).

1. Tap **+**, type `Alimentar a los perros`, choose **No se repite** and turn on **Solo en un horario**: there is one **Desde**/**Hasta** row, without a **Quitar** button, and an **Agregar horario** button.
2. Type **Desde** `18:00` and **Hasta** `21:00`. Tap **Agregar horario**: a second empty row appears and each row has **Quitar**. Type in it **Desde** `07:00` and **Hasta** `10:00`. Save.
   - The **Alimentar a los perros** row shows `07:00–10:00 · 18:00–21:00` (ordered by start, even though they were entered in reverse).
3. Tap the row: the panel shows **Solo en un horario** on and two rows, in order: `07:00`–`10:00` and `18:00`–`21:00`.
4. Tap **Quitar** on the `07:00`–`10:00` row and save: the task row shows `18:00–21:00`. When opening the panel, there is a single row, without **Quitar**.
5. Tap **Agregar horario**, type `10:00` to `12:00` in the new row and change the other one to `08:00` to `10:00` (contiguous). Save: the row shows `08:00–10:00 · 10:00–12:00`.
6. Tap the row, turn off **Solo en un horario** and save: the row shows no schedule.
7. Create `Remedio` with **Intervalo** every `8` **horas** and a single window `08:00` to `20:00`: it is saved and shows `08:00–20:00`.
8. Reload: **Alimentar a los perros** without a schedule, **Remedio** with `08:00–20:00`.

## Flow 12: errors with several schedules

Precondition: empty list, clock at `2026-07-15T06:00:00`. Create `Regar` with **No se repite** and schedule `08:00` to `11:00`, and `Remedio` with **Intervalo** every `8` **horas** and schedule `08:00` to `11:00`.

1. Tap **+**, type `Perros`, choose **No se repite**, turn on **Solo en un horario**, type `08:00` to `11:00`, tap **Agregar horario** and type `10:00` to `12:00`. Tap **Guardar**: "Los horarios no se pueden superponer" is shown and the panel stays open.
2. Change the second row to `08:00` to `11:00` (equal to the first) and tap **Guardar**: the same error.
3. Change the second row to `09:00` to `10:00` (inside the first) and tap **Guardar**: the same error.
4. Empty **Hasta** of the second row and tap **Guardar**: "Completá las dos horas" is shown.
5. Type **Hasta** `08:00` in the second row (from `09:00`) and tap **Guardar**: "La hora de fin tiene que ser posterior a la de inicio" is shown.
6. Change the second row to `18:00` to `21:00` and choose **Intervalo** every `8` **horas**. Tap **Guardar**: "Con varios horarios, el intervalo tiene que ser en días" is shown.
7. Change the unit to **días** (every `1`) and tap **Guardar**: the panel closes and **Perros** shows `08:00–11:00 · 18:00–21:00`.
8. Tap the **Regar** row, change the title to `Regar plantas`, tap **Agregar horario** and type `10:59` to `12:00`. Tap **Guardar**: "Los horarios no se pueden superponer" is shown. Close without saving (and **Descartar** in the notice): the row is still **Regar** with `08:00–11:00`.
9. Tap the **Remedio** row (every 8 hours), tap **Agregar horario**, type `18:00` to `21:00` and tap **Guardar**: "Con varios horarios, el intervalo tiene que ser en días" is shown. Close without saving (and **Descartar** in the notice): **Remedio** still has `08:00–11:00`.
10. Tap the **Perros** row, change **Se repite** to **Intervalo** every `8` **horas** and tap **Guardar**: the same error is shown. Close without saving (and **Descartar** in the notice): **Perros** is still every 1 day with the two windows.

## Flow 13: calendar with two windows

Precondition: empty list, clock stopped at `2026-07-15T06:00:00` (Wednesday). «Mostrar completadas» off.

1. Create `Perros` with **Días de la semana** `miércoles` and `jueves` and schedules `07:00` to `10:00` and `18:00` to `21:00`. It is `waiting` without completions: it is shown, in bold, checkbox unchecked and **disabled**.
2. At `06:30`: the bar shows `50`.
3. At `08:00`: `pending`, checkbox enabled. Tap it: `Completaste «Perros»` appears and the row disappears (completed).
4. At `13:00`: the list is still empty. Tap **Completadas** in the **⋮** menu: **Perros** is shown completed, `waiting`, with the bar at `50` (it comes back at 18:00) and the checkbox **enabled** (it would delete today's completion). Turn off **Mostrar completadas**.
5. At `18:00`: **Perros** appears `pending`, **not** completed (title in bold, checkbox unchecked), checkbox enabled. Tap it: the notice appears and the row disappears.
6. Tap **Completadas** in the **⋮** menu. At `2026-07-16T05:00:00`: **Perros** completed, `waiting`, with the checkbox **disabled** (it would complete it again and it is outside the windows). Turn off **Mostrar completadas**.
7. At `2026-07-16T07:00:00`: `pending`. Do not complete it. At `2026-07-16T10:00:00`: `overdue` ("Atrasada" indicator), checkbox **disabled**. At `2026-07-16T12:00:00`: still the same.
8. At `2026-07-16T18:00:00`: still `overdue`, checkbox **enabled**. Tap it: the row disappears (it covers the afternoon; the morning is discarded).
9. In the **Historial**: three completions of **Perros** (Wednesday 08:00, Wednesday 18:00 and Thursday 18:00).
10. At `2026-07-16T22:00:00`: the list is empty (the next one is the following Wednesday at 07:00). Tap **Completadas** in the **⋮** menu: **Perros** completed, `waiting`, with the checkbox **enabled** (it would delete today's completion).

## Flow 14: one-off with two windows

Precondition: empty list, clock stopped at `2026-07-15T06:00:00` (Wednesday).

1. Create `Comprar pan` with **No se repite**, without a due date, schedules `07:00` to `10:00` and `18:00` to `21:00`; and `Pagar la luz` with **No se repite**, Fecha límite `2026-07-15`, the same schedules.
   - Both `waiting`, checkbox disabled.
2. At `07:00`: both `pending`, checkbox enabled.
3. At `10:00`: both `waiting` (neither overdue: **Pagar la luz** becomes overdue only when the last window of its due day closes), checkbox disabled. At `14:00`: bar at `50` on both.
4. At `18:00`: both `pending`. Tap the checkbox of **Comprar pan**: the notice appears and the row disappears.
5. At `21:00`: **Pagar la luz** `overdue` (the last window of its due day closed), checkbox disabled.
6. At `2026-07-16T08:00:00`: **Comprar pan** is still not in the list (it is completed only once); **Pagar la luz** is still `overdue`, with the checkbox enabled.

## Flow 15: relative every 2 days with two windows

Precondition: empty list, clock stopped at `2026-07-13T06:00:00` (Monday). Tap **Completadas** in the **⋮** menu (it stays checked).

1. Create `Perros` with **Intervalo** every `2` **días** and schedules `07:00` to `10:00` and `18:00` to `21:00`. It is `waiting` (never completed), checkbox disabled.
2. At `08:00`: `pending`. Tap the checkbox: completed, `waiting`.
3. At `13:00`: bar at `50` (it comes back at 18:00 the same Monday, not on Wednesday). Checkbox enabled (it would delete today's).
4. At `18:00`: `pending`, not completed (checkbox unchecked). Tap it: completed, `waiting`.
5. At `2026-07-14T12:30:00` (Tuesday): bar at `50` (it comes back on Wednesday at 07:00). At `2026-07-14T19:00:00`: still `waiting` (Tuesday is not its day), with the checkbox **enabled** (inside a window, it would complete it again). Do not tap it.
6. At `2026-07-15T07:00:00`: `pending`. Do not complete it. At `2026-07-15T10:00:00`: `overdue`, checkbox disabled.
7. At `2026-07-16T08:00:00` (Thursday): still `overdue`, checkbox enabled. Tap it: completed, `waiting` (the sequence continues from Thursday morning).
8. At `2026-07-16T13:00:00`: bar at `50`. At `2026-07-16T18:00:00`: `pending`.
