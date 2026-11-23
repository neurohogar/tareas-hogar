# QA: relative recurring task (vertical slice 1)

Verifies, through the interface only, the end-to-end flow: sign in with Google,
create a relative recurring task, see it pending, complete it, see it waiting
with its progress bar, advance the clock and see it pending and then
overdue. Covers spec §4.2 (Relativa), §4.4, §5.2, §6.1 (subset), §6.2
(subset), §6.5 and §7.

Out of scope: order between tasks, emoji, note,
undo, history, editing and deletion.

## Environment

- Firebase Emulator Suite (Auth + Firestore) with clean data at the start of
  each flow.
- Simulated browser clock (`page.clock`) installed **before** opening the
  app, at local time `2026-07-15T08:00:00`. "Advance the clock X" means
  advancing the simulated clock X and waiting for the screen to update by itself
  (without reloading), unless the step says "reload".
- Auth Emulator account: `qa@example.com`.
- Create a relative task: tap **+**, type the title, choose **Intervalo** in **Se repite** (the creation panel opens with **No se repite**), set **Cada** and the unit, and save.
- From Flow 2, at the start of each flow (after signing in), tap the
  **Completadas** item of the **⋮** menu to turn it on: a waiting recurring task
  with completions is completed and only has a row with the item on
  (`qa/show-completed.md`).

**Switches.** **Mostrar completadas** and **Mostrar pausadas** are the items **Completadas** and **Pausadas** of the **⋮** menu (`qa/menu-toggles.md`), not checks above the list: to turn one on or off, open the **Menú** and tap the item (the menu closes). A completed one-off task never has a row in **Pendientes**, with **Completadas** on or off: it is reached from the **Historial**.

## Observable contract of the Pendientes row

What QA looks at in each task row (identified by its title):

| Status | Checkbox | Title | Dimmed style | Progress bar | Overdue indicator |
|---|---|---|---|---|---|
| pending | visible, unchecked | bold | no | no | no |
| waiting, with completions (completed) | visible, checked | struck through, normal weight | yes | yes | no |
| waiting, without completions (calendar only) | visible, unchecked | bold | yes | yes | no |
| overdue | visible, unchecked | bold | no | no | yes |

A waiting relative task always has completions: it is completed. Bold,
struck-through and normal weight are measured as in `qa/show-completed.md`.

- Checkbox: accessible control with role `checkbox` and a name that includes the
  title; touch area of at least 48×48 px.
- Progress bar: role `progressbar` with `aria-valuemin=0`,
  `aria-valuemax=100` and `aria-valuenow` = progress × 100 (rounded to an integer).
- Dimmed style: the waiting row has computed opacity less than 1 and
  less than that of a pending row; its checkbox is still enabled.
- Overdue indicator: accessible text "Atrasada" inside the row. **Replaced** by the text «Tocaba …» (`qa/guilt-free-status.md`): where an earlier procedure expects "Atrasada", that text is expected.

## Flow 1: sign in with Google

1. Open the app without a session.
2. See the sign-in screen with the **Entrar con Google** button.
   The Pendientes list and the **+** button are not visible.
3. Tap **Entrar con Google** and choose the account `qa@example.com` in the
   Auth Emulator.
4. See the **Pendientes** screen, empty, with the **+** button visible.
5. Reload the page: it is still on **Pendientes** without asking for login.

## Flow 2: validation when creating

Precondition: signed in (Flow 1), empty list.

1. Tap **+**. The panel opens with the **Título** field and the **Se repite** group
   with **No se repite** selected. Choose **Intervalo**: **Cada** (number)
   and unit (**horas** / **días**) are shown.
2. Leave the title empty, set Cada = `2`, unit **días**, and save.
   - An error message associated with the Título field is shown.
   - The panel stays open; no row appears in Pendientes.
3. Type title `   ` (only spaces) and save: same result as
   step 2.
4. Type title `Regar plantas`, set Cada = `0` and save.
   - An error message associated with the Cada field is shown.
   - No row appears.
5. Set Cada = `1.5` and save: same result as step 4.
6. Close the panel without saving (and **Descartar** in the notice "Tenés cambios sin guardar"): the list is still empty.

## Flow 3: status cycle of "Regar plantas" every 2 days

Precondition: signed in, empty list, clock at `2026-07-15T08:00:00`.

1. Tap **+**, type title `Regar plantas`, choose **Intervalo**, Cada = `2`,
   unit **días**, and save.
   - The panel closes.
   - The row **Regar plantas** appears in pending status (never
     completed): not dimmed, no bar, no overdue indicator.
2. Advance the clock 3 days (`2026-07-18T08:00:00`): the row is still pending
   (a task never completed does not become overdue).
3. Return the context to the starting point: clear data, reinstall the clock
   at `2026-07-15T08:00:00`, sign in and create `Regar plantas` every 2
   days again (step 1).
4. Tap the checkbox of **Regar plantas** at `2026-07-15T08:00:00`.
   - The row becomes waiting: dimmed, with the progress bar at 0, no
     overdue indicator. It is completed: the checkbox is checked and
     enabled, and the title struck through.
5. Advance the clock 1 day (`2026-07-16T08:00:00`): still waiting, bar
   at 50.
6. Advance the clock 23 hours (`2026-07-17T07:00:00`): still waiting,
   bar at 98 (47/48).
7. Advance the clock 1 hour (`2026-07-17T08:00:00`, due time): the row
   becomes pending: not dimmed, no bar, no overdue indicator.
8. Advance the clock 1 day 23 hours (`2026-07-19T07:00:00`): still
   pending.
9. Advance the clock 1 hour (`2026-07-19T08:00:00`, a whole cycle was
   missed): the row becomes overdue: it shows the "Atrasada" indicator,
   not dimmed, no bar.
10. Reload the page: the row **Regar plantas** is still overdue
    (persistence in Firestore).
11. Tap the checkbox at `2026-07-19T08:00:00`: the row becomes
    waiting with the bar at 0 (completing restarts the interval).
12. Advance the clock 1 day (`2026-07-20T08:00:00`): waiting, bar at 50.
13. Advance the clock 1 day (`2026-07-21T08:00:00`): pending.

## Flow 4: the checkbox of a waiting task deletes today's completion; completing again restarts the interval (hours)

A waiting relative task is completed: if its most recent completion is from
today, tapping its checkbox deletes it (spec §6.1) instead of completing it again.
If it is from an earlier day, it completes it again (Flow 7).

Precondition: signed in, empty list, clock at `2026-07-15T08:00:00`.

1. Create `Ventilar` every `4` **horas**: pending row.
2. Tap the checkbox: waiting, bar at 0, checkbox checked.
3. Advance the clock 1 hour (`2026-07-15T09:00:00`): bar at 25.
4. Tap the checkbox again: the completion is deleted and the row goes back to
   pending (never completed): not dimmed, no bar, checkbox
   unchecked.
5. Tap the checkbox: waiting, bar at 0 (the interval starts at
   `09:00`).
6. Advance the clock 3 hours (`2026-07-15T12:00:00`, when the first
   completion was due): still waiting, bar at 75.
7. Advance the clock 1 hour (`2026-07-15T13:00:00`): pending.
8. Advance the clock 4 hours (`2026-07-15T17:00:00`): overdue.

## Flow 5: persistence between sessions

Precondition: Flow 3 up to step 5 (waiting row, bar at 50).

1. Close the tab and open the app again with the same clock.
2. It goes straight to **Pendientes** (no login) and **Regar plantas** is still
   waiting with the bar at 50.

## Flow 6: clocks out of sync (completion "from the future")

Simulates a completion recorded by a device with the clock ahead:
it is completed with the simulated clock at one moment and then the clock is moved back.
"Move the clock back to X" means setting the simulated clock to X
(`page.clock.setSystemTime`) and waiting for the screen to update by itself,
without reloading. Covers the row "now < U" of spec §5.2.

Precondition: signed in, empty list, clock at `2026-07-15T08:00:00`.

1. Create `Ventilar` every `4` **horas** and tap its checkbox: waiting,
   bar at 0.
2. Move the clock back to `2026-07-15T07:00:00` (one hour before the
   completion): still waiting, bar at 0, no overdue indicator.
3. Reload the page: still waiting, bar at 0.
4. Advance the clock to `2026-07-15T08:00:00` (the moment of the completion):
   waiting, bar at 0.
5. Advance the clock to `2026-07-15T09:00:00`: waiting, bar at 25.
6. Advance the clock to `2026-07-15T12:00:00`: pending.

## Flow 7: completing while waiting, with the last completion from yesterday, restarts the interval

If the most recent completion is from an earlier day, tapping the checkbox of the
waiting relative task completes it again (spec §5.2, §6.1).

Precondition: signed in, empty list, clock at `2026-07-15T20:00:00`.

1. Create `Regar plantas` every `2` **días** and tap its checkbox: waiting,
   bar at 0, checkbox checked. The notice `Completaste «Regar plantas»` appears.
2. Advance the clock to `2026-07-16T00:00:00` (the next day): still
   waiting, bar at 8 (4 of 48 hours).
3. Tap the checkbox: the notice `Completaste «Regar plantas»` appears. Still
   waiting, completed, with the bar at 0 (the interval starts now).
4. In the Historial there are two entries of **Regar plantas**: **Hoy** `00:00` and
   **Ayer** `20:00`.
5. Advance the clock to `2026-07-17T20:00:00` (when the first
   completion was due): still waiting, bar at 92 (44 of 48 hours).
6. Advance the clock to `2026-07-18T00:00:00`: pending.
