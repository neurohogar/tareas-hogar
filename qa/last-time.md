# QA: last time

Verifies, through the interface only:

- that the **Editar tarea** panel shows, below its heading, when the task was last completed ("hoy", "ayer", "hace N días", the date for a completion "from the future" or "nunca");
- that the creation panel (**+**) does not show it and that the row in Pendientes does not change;
- that the text updates by itself with the panel open: when midnight passes and when another device completes the task or deletes a completion;
- that deleting a completion (from the notice, the checkbox or the Historial) recalculates it.

Covers spec §6.2 (Última vez), with §5.2 (clocks out of sync), §5.4 (undo) and §6.3 (date format and opening the panel from the Historial).

Out of scope: the statuses and the order (`qa/recurring-relative.md`, `qa/pending-order.md`), the content of the Historial (`qa/history-undo.md`), emoji, note and PWA.

## Environment

Same as `qa/history-undo.md`:

- Firebase Emulator Suite (Auth + Firestore) with clean data at the start of each flow.
- Simulated browser clock (`page.clock`) installed **before** opening the app, at the local time each flow gives (zone `America/Argentina/Buenos_Aires`).
  - "At X" means advancing the simulated clock to X before the step.
  - "Advance the clock to X" means advancing it to X and waiting for the screen to update by itself (without reloading), unless the step says "reload".
- Signed in with the Auth Emulator account `qa@example.com` (Flow 1 of `qa/recurring-relative.md`).
- At the start of each flow, tap the **Completadas** item of the **⋮** menu to turn it on (on A and on B in the two-device flows), so that completed recurring tasks have a row; a completed one-off task never has one (`qa/show-completed.md`).
- Create a task: tap **+**, type the title, choose the **Se repite** option the step gives and save, with the controls of `qa/one-off.md` and `qa/recurring-calendar.md`.
- "Open the panel of X" means tapping the row of X in Pendientes outside the checkbox (for example, on the title).
- **Two devices** (Flows 5 and 6): two independent browser contexts, A and B, with the same account. Each has its own simulated clock, with the time the flow gives.

Reference week: Monday 2026-07-13, Tuesday 14, Wednesday 15, Thursday 16, Friday 17.

**Switches.** **Mostrar completadas** and **Mostrar pausadas** are the items **Completadas** and **Pausadas** of the **⋮** menu (`qa/menu-toggles.md`), not checks above the list: to turn one on or off, open the **Menú** and tap the item (the menu closes). A completed one-off task never has a row in **Pendientes**, with **Completadas** on or off: it is reached from the **Historial**.

**Navigation.** There is no navigation bar (`qa/navigation.md`): to go to **Historial**, open the **Menú** (**⋮**) of **Pendientes** and tap the item **Historial**; to go back to **Pendientes**, tap **Volver** in the header of the **Historial**. Opening `/history` directly still shows the Historial.

## Observable contract

- **Edit panel**: that of `qa/edit-delete.md` (heading **Editar tarea**, current values, **Cerrar**, **Guardar**, **Borrar tarea**).
- **Última vez**: in the **Editar tarea** panel, immediately below the heading, a text that starts with `Última vez: `. "The panel says T" means that this text is exactly `Última vez: T`.
  - The time is in 24-hour format, `HH:MM`, without seconds.
  - The creation panel (heading **Nueva tarea**) has no text that starts with `Última vez`.
- **Row in Pendientes**: the contract of `qa/recurring-relative.md`, `qa/one-off.md` and `qa/show-completed.md`, unchanged: no row contains the text `Última vez`.
- **Notice**, **Historial** and **confirmation to delete a completion**: those of `qa/history-undo.md`.

## Flow 1: creating does not show it; without completions, "nunca"

Precondition: empty list, clock at `2026-07-15T08:00:00` (Wednesday).

1. Tap **+**: the **Nueva tarea** panel has no `Última vez` text. Create `Regar` with **Intervalo** every `1` **días**.
2. Open the panel of **Regar**: the panel says `nunca`. Close.
3. No row in Pendientes contains `Última vez`.

## Flow 2: hoy, ayer and hace N días, with the panel open past midnight

Precondition: empty list, clock at `2026-07-13T08:00:00` (Monday).

1. Create `Regar` with **Intervalo** every `10` **días**.
2. At `2026-07-13T08:05:30`, complete **Regar**.
3. Open the panel of **Regar**: the panel says `hoy 08:05`.
4. Without closing the panel, advance the clock to `2026-07-13T23:59:59`: it still says `hoy 08:05`.
5. Advance the clock to `2026-07-14T00:00:00`: the panel says `ayer 08:05`.
6. Advance the clock to `2026-07-15T00:00:00`: the panel says `hace 2 días`.
7. Advance the clock to `2026-07-23T10:00:00`: the panel says `hace 10 días`.
8. Close. The row of **Regar** does not contain `Última vez`. Reload and open the panel of **Regar**: `hace 10 días`.

## Flow 3: deleting completions recalculates it

Precondition: empty list, clock at `2026-07-14T10:00:00` (Tuesday).

1. Create `Regar` with **Intervalo** every `1` **horas** and complete it (`10:00`).
2. At `2026-07-15T09:00:00`, complete **Regar** again (the notice appears) and immediately tap **Deshacer** (within the 5 seconds).
3. Open the panel of **Regar**: the panel says `ayer 10:00`. Close.
4. At `2026-07-15T09:30:00`, complete **Regar** and wait for the notice to disappear. Open the panel: `hoy 09:30`. Close.
5. Tap the checked checkbox of **Regar** (completed today: it deletes that completion, `qa/show-completed.md`). Open the panel: `ayer 10:00`. Close.
6. In the Historial, delete **Regar** `10:00` (group **Ayer**, with confirmation).
7. In Pendientes, open the panel of **Regar**: the panel says `nunca`.

## Flow 4: a completed one-off task, opened from the Historial

Precondition: empty list, clock at `2026-07-15T08:00:00` (Wednesday).

1. Create `Pagar la luz` with **No se repite** and no due date. At `2026-07-15T08:20:00`, complete it.
2. **Pagar la luz** has no row, although **Completadas** is on (a completed one-off task is never shown in **Pendientes**).
3. In the Historial, tap the title of the entry **Pagar la luz**: **Editar tarea** opens and the panel says `hoy 08:20`.
4. Without closing the panel, choose **Intervalo** every `4` **horas** and save. Tap the entry again: the panel still says `hoy 08:20`.

## Flow 5: another device completes and deletes with the panel open

Precondition: empty list, clock at `2026-07-15T08:00:00` on A and on B.

1. On A, create `Regar` with **Intervalo** every `1` **horas** and complete it (`08:00`).
2. On A, open the panel of **Regar**: `hoy 08:00`. Leave it open.
3. At `2026-07-15T09:15:00` on A and on B, complete **Regar** on B. Without touching A, its panel changes to say `hoy 09:15`.
4. On B, in the Historial, delete **Regar** `09:15` (with confirmation). Without touching A, its panel goes back to `hoy 08:00`.
5. On B, delete **Regar** `08:00` from the Historial. The panel of A changes to `nunca`.

## Flow 6: completion "from the future"

Precondition: empty list, clock of A at `2026-12-31T20:00:00` (Thursday) and clock of B at `2027-01-01T08:00:00` (Friday, ahead).

1. On A, create `Regar` with **Intervalo** every `2` **días**. On B, complete **Regar** (`08:00`).
2. On A, open the panel of **Regar**: the panel says `viernes 1 de enero de 2027 08:00` (never "mañana").
3. On A, advance the clock to `2027-01-01T07:00:00` with the panel open: the panel says `hoy 08:00`.
4. Advance the clock of A to `2027-01-02T10:00:00`: the panel says `ayer 08:00`.
5. On B, open the panel of **Regar**: the panel says `hoy 08:00`.
