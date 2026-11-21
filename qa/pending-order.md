# QA: Pendientes urgency order

Verifies, through the interface only, that the Pendientes list sorts itself by
urgency, in the three groups (overdue, pending, waiting), with the criterion
of each group and the tie-break, and that the order updates by itself when time
passes or a task is completed. Covers spec §5.1–§5.3, §6.1 (order) and §10
criterion 3.

All flows use **Mostrar completadas** off (its initial value): completed tasks
(one-off tasks with a completion and waiting recurring tasks with a
completion) have no row. So the visible waiting group only has calendar
recurring tasks that have not reached their first occurrence yet. The place of
completed tasks with the check on is verified in `qa/show-completed.md`.

Out of scope: editing, deleting, history and undo.

## Environment

Same as `qa/one-off.md`:

- Firebase Emulator Suite (Auth + Firestore) with clean data at the start of
  each flow.
- Simulated browser clock (`page.clock`) installed **before** opening the
  app, at the local time each flow gives (zone
  `America/Argentina/Buenos_Aires`). "At X" means advancing the simulated
  clock to X before the step. "Advance the clock to X" means advancing it
  to X and waiting for the screen to update by itself (without reloading),
  unless the step says "reload".
- Except for Flow 5, each task is created in a different minute: the clock
  time when saving is its `creadaEn`.
- Signed in with the Auth Emulator account `qa@example.com` (Flow 1 of
  `qa/recurring-relative.md`).
- Create a task: tap **+**, type the title, choose the **Se
  repite** option the step gives (**No se repite** with or without Fecha límite;
  **Intervalo** with Cada and unit; **Días de la semana** or **Días del mes**
  with their days) and save, with the controls of `qa/one-off.md`.
- **Mostrar completadas** stays off (its initial value) in all flows.

Reference week: Monday 2026-07-13, Tuesday 14, Wednesday 15, Thursday 16,
Friday 17.

## Observable contract

- **Order**: the order of the rows from top to bottom in Pendientes (the
  order on screen and that of the row elements in the document is the
  same). "The list is A, B, C" means exactly those rows, in that
  order.
- The status of each row (pending, overdue, waiting) is seen with the row
  contract of `qa/recurring-relative.md`: overdue by the "Atrasada"
  indicator, waiting by the dimmed style and the bar.
- The order cannot be changed by hand: there is no dragging or order control.

## Flow 1: three groups and live order

Precondition: empty list, clock at `2026-07-13T08:00:00` (Monday).

1. At `08:00`, create `Regar plantas` with **Intervalo** every `4` **horas**.
2. At `08:01`, create `Pagar la luz` with **No se repite** and Fecha límite
   `2026-07-14`.
3. At `08:02`, create `Sacar la basura` with **Días de la semana** `martes`
   and `jueves`.
4. At `08:03`, create `Cambiar foco` with **No se repite** and no due date.
   - The list is **Regar plantas**, **Pagar la luz**, **Cambiar foco**,
     **Sacar la basura**: the first three pending (Regar plantas,
     never completed, has been pending since it was created; Cambiar foco, with no
     due date, goes to the end of the group) and Sacar la basura waiting.
5. At `08:04`, tap the checkbox of **Regar plantas**: it becomes waiting
   until `12:04`, completed, and its row disappears.
   - The list is **Pagar la luz**, **Cambiar foco**, **Sacar la basura**.
6. Advance the clock to `2026-07-13T12:04:00`: **Regar plantas** goes back to the
   list, pending, since before the due date of Pagar la luz.
   - The list is **Regar plantas**, **Pagar la luz**, **Cambiar foco**,
     **Sacar la basura**.
7. Advance the clock to `2026-07-14T00:00:00` (Tuesday): **Regar plantas** is
   overdue (since `16:04` on Monday); **Pagar la luz** and **Sacar la
   basura** are pending since the same instant (00:00 today) and
   the one created first breaks the tie.
   - The list is **Regar plantas**, **Pagar la luz**, **Sacar la basura**,
     **Cambiar foco**.
8. Advance the clock to `2026-07-15T00:00:00` (Wednesday): **Pagar la luz** and
   **Sacar la basura** become overdue, both from this instant; Regar
   plantas has been overdue for longer.
   - The list is **Regar plantas**, **Pagar la luz**, **Sacar la basura**,
     **Cambiar foco**.
9. Reload the page: the list and the statuses are the same.

## Flow 2: overdue by how long they have been overdue

Precondition: empty list, clock at `2026-07-13T08:00:00` (Monday).

1. At `08:00`, create `Regar plantas` with **Intervalo** every `1` **días** and
   tap its checkbox: it becomes waiting, completed, and its row disappears
   (it is due on Tuesday at `08:00`, it becomes overdue on Wednesday at `08:00`).
2. At `08:01`, create `Pagar la luz` with **No se repite** and Fecha límite
   `2026-07-14` (it becomes overdue on Wednesday at `00:00`).
3. At `08:02`, create `Sacar la basura` with **Días de la semana** `lunes`:
   pending (it was created on an occurrence day; it becomes overdue on Tuesday at
   `00:00`).
4. Advance the clock to `2026-07-16T12:00:00` (Thursday): all three are
   overdue.
   - The list is **Sacar la basura**, **Pagar la luz**, **Regar plantas**:
     Regar plantas goes last even though its due time (Tuesday 08:00) is the oldest,
     because it only became overdue on Wednesday at 08:00.
5. Reload the page: the list is the same.

## Flow 3: pending by the moment since which they are pending

Precondition: empty list, clock at `2026-07-15T08:00:00` (Wednesday).

1. At `08:00`, create `Cambiar foco` with **No se repite** and no due
   date.
2. At `08:01`, create `Llamar plomero` with **No se repite** and no due
   date.
3. At `08:02`, create `Comprar regalo` with **No se repite** and Fecha límite
   `2026-07-16`.
4. At `08:03`, create `Ventilar` with **Intervalo** every `4` **horas**.
5. At `08:04`, create `Pagar la luz` with **No se repite** and Fecha límite
   `2026-07-15` (today).
   - All pending. The list is **Pagar la luz** (since 00:00 today),
     **Ventilar** (never completed, since 08:03), **Comprar regalo**
     (since 00:00 tomorrow), **Cambiar foco**, **Llamar plomero** (no
     due date, at the end, the one created first going first).
6. At `08:05`, tap the checkbox of **Ventilar**: it becomes waiting,
   completed, and its row disappears.
   - The list is **Pagar la luz**, **Comprar regalo**, **Cambiar foco**,
     **Llamar plomero**.
7. Advance the clock to `2026-07-15T12:05:00`: **Ventilar** goes back to the list,
   pending, since an instant later than 00:00 today and earlier than
   that of tomorrow.
   - The list is **Pagar la luz**, **Ventilar**, **Comprar regalo**,
     **Cambiar foco**, **Llamar plomero**.

## Flow 4: waiting by when they come back

A waiting task without completions can only be a calendar recurring task before
its first occurrence.

Precondition: empty list, clock at `2026-07-15T08:00:00` (Wednesday).

1. At `08:00`, create `Cambiar sábanas` with **Días de la semana** `sábado`:
   waiting (it comes back on Saturday at `00:00`).
2. At `08:01`, create `Limpiar heladera` with **Días del mes** `17`:
   waiting (it comes back on Friday 17 at `00:00`).
3. At `08:02`, create `Sacar la basura` with **Días de la semana** `martes`
   and `jueves`: waiting (it comes back on Thursday at `00:00`).
4. At `08:03`, create `Cambiar foco` with **No se repite** and no due
   date: pending.
   - The three recurring tasks dimmed, with a bar, and not completed (bold,
     with the checkbox unchecked). The list is **Cambiar foco**, **Sacar la
     basura**, **Limpiar heladera**, **Cambiar sábanas**: the pending one
     first and then the waiting ones by when they come back, not by when they
     were created.
5. Advance the clock to `2026-07-16T00:00:00` (Thursday): **Sacar la basura**
   becomes pending since 00:00 today, before **Cambiar foco** (no
   due date, at the end of the group).
   - The list is **Sacar la basura**, **Cambiar foco**, **Limpiar heladera**,
     **Cambiar sábanas**.
6. At `2026-07-16T08:00:00`, tap the checkbox of **Sacar la basura**
   (it covers Thursday): it becomes waiting, completed, and its row disappears.
   - The list is **Cambiar foco**, **Limpiar heladera**, **Cambiar sábanas**.
7. Reload the page: the list is the same.

## Flow 5: tie-break by title

Precondition: empty list, simulated clock **stopped** at
`2026-07-15T08:00:00` (it does not advance by itself), so all tasks have the same
`creadaEn`.

1. Create, in this order, with **No se repite** and no due date: `Zapallo`,
   `Ñoquis`, `Barrer`, `Nueces`, `Árbol`, `acelga`.
   - All pending. The list is **acelga**, **Árbol**, **Barrer**,
     **Nueces**, **Ñoquis**, **Zapallo**: alphabetical order in Spanish, without
     distinguishing case or accents and with ñ after n.
2. Reload the page: the list is the same.
