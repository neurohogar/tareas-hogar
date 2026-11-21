# QA: guilt-free status (overdue text, return text and closing on completion)

Verifies, through the interface only:

- that the row of an overdue task says since when it was due, as a fact with a date and a distance («Tocaba el martes 10 · hace 3 días»), in the same color and size as the schedule, and that it no longer says «Atrasada»;
- that the row of a waiting task (a recurring task completed with **Mostrar completadas**, a calendar task before its occurrence, one with a schedule outside the window, a postponed one) says when it comes back («Vuelve el jueves 19 · en 6 días») in addition to its progress bar, without naming the postponement;
- that pending rows, paused rows and completed one-off rows show no date or distance text;
- that the texts update by themselves as time passes (midnight, hour, minute) and that the status and the order of the list do not change;
- that the completion notice says, below «Completaste …», when the task comes back (a recurring task), and that a one-off task shows only «Completaste …».

Covers spec §6.1 (overdue text, return text, **Fecha y distancia**, **Se actualiza solo**, rows without text, **Mostrar pausadas**) and §5.4 (undo notice), with §5.1–§5.9 as status rules, which do not change.

This procedure replaces the «Atrasada» indicator of the contracts of the earlier `qa/*.md`: where those documents expect the accessible text «Atrasada» inside the row, the overdue text «Tocaba …» of this contract is now expected (and «Atrasada» no longer appears in any row).

Out of scope: the statuses and the order (`qa/one-off.md`, `qa/recurring-relative.md`, `qa/recurring-calendar.md`, `qa/schedule.md`, `qa/pending-order.md`), the content of the edit panel (`qa/postpone.md`, `qa/pause.md`) and the Historial (`qa/history-undo.md`).

## Environment

- Firebase Emulator Suite (Auth + Firestore) with clean data at the start of each flow.
- Each flow starts from a new browser context (no data saved on the device), signed in with the Auth Emulator account `qa@example.com` (Flow 1 of `qa/recurring-relative.md`).
- Simulated browser clock (`page.clock`) installed **before** opening the app, at the local time each flow gives (zone `America/Argentina/Buenos_Aires`), with the clock stopped (`page.clock.pauseAt`).
  - "At X" means advancing the simulated clock to X (`page.clock.runFor` or `fastForward`) before the step.
  - "Advance the clock to X" means advancing it to X and waiting for the screen to update by itself (without reloading).
- Create a task: tap **+**, type the title, choose the **Se repite** option the step gives, with the controls of `qa/one-off.md`, `qa/recurring-relative.md` and `qa/recurring-calendar.md`; if the step gives a schedule, enter it as in `qa/schedule.md`; save.
- "Postpone X with option O": tap the row X and choose O among the **Posponer** options, without tapping **Guardar** (`qa/postpone.md`).
- **Mostrar completadas** and **Mostrar pausadas** stay off unless the flow says to turn them on.

Reference week: Monday 2026-11-09, Tuesday 10, Wednesday 11, Thursday 12, Friday 13, Saturday 14, Sunday 15.

## Observable contract

- **Row text**: inside the task row, a text that starts with `Tocaba ` (overdue) or `Vuelve ` (waiting). "The row says T" means that the row text is exactly T (with the middle dot `·`, U+00B7, surrounded by spaces, and without other words). A row without date text does not contain `Tocaba`, `Vuelve`, nor `hace`/`en` followed by a quantity.
  - No row contains the text `Atrasada`.
  - The time is in 24-hour format, `HH:MM`, without seconds.
- **Style of the overdue text**: the same computed `color` and `font-size` as the schedule text of the same row or of another row; it is not reddish (the red channel does not dominate: it is not the former alarm color `--atraso`), it is not bold (`font-weight` normal) or underlined, and the overdue row does not change its background.
- **Waiting row**: the contract of `qa/recurring-relative.md` (dimmed style, progress bar with `aria-valuenow`), with the text «Vuelve …» in addition to the bar. The bar does not change.
- **Overdue row**: not dimmed, without a bar, with the text «Tocaba …».
- **Paused row** (with **Mostrar pausadas** on): it says «Pausada» and no `Tocaba` or `Vuelve`.
- **Notice**: that of `qa/history-undo.md` (role `status`, `Completaste «…»`, **Deshacer**, 5 seconds). "The notice says T" means that, below `Completaste «…»`, there is a text exactly T; "the notice says nothing else" means that there is no text other than `Completaste «…»` and **Deshacer**.
- **List**: "The list is A, B, C" means exactly those rows, from top to bottom.

## Flow 1: overdue with date and distance, without an alarm color

Precondition: empty list, clock at `2026-11-13T10:00:00` (Friday).

1. Create `Pagar la luz` with **No se repite**, due date `2026-11-10`; `Pagar agua` with **No se repite** and due date `2026-11-12`; `Cambiar foco` with **No se repite** and no due date; and `Barrer` with **Días de la semana** and **viernes**.
2. The list is **Pagar la luz**, **Pagar agua**, **Barrer**, **Cambiar foco** (the first two overdue; the others, pending). The row of **Pagar la luz** says `Tocaba el martes 10 · hace 3 días`; that of **Pagar agua**, `Tocaba ayer`. No row contains `Atrasada`. **Cambiar foco** and **Barrer** show no date text.
3. Create `Lavar` with **No se repite**, due date `2026-11-13` and schedule **Desde** `08:00` **Hasta** `11:00`. Advance the clock to `2026-11-13T10:59:00`: **Lavar** is pending and shows no date text. The overdue text of **Pagar la luz** has the same `color` and `font-size` as the schedule text of **Lavar**, is not bold and is not reddish. Advance to `2026-11-13T11:00:00`: its row says `Tocaba hoy`, with no time or distance.
4. Create `Regar` with **Intervalo** every `1` **horas** and tap its checkbox. Advance the clock to `2026-11-13T13:00:00`: **Regar** is overdue and its row says `Tocaba hoy 12:00 · hace 1 hora`. Advance to `2026-11-13T14:30:00`: it says `Tocaba hoy 12:00 · hace 2 horas`.
5. Advance the clock to `2026-11-14T00:00:00` (Saturday): **Barrer** is overdue and says `Tocaba ayer` (no time); **Regar** says `Tocaba ayer 12:00 · hace 12 horas`.
6. Advance the clock to `2026-11-15T10:00:00` (Sunday): **Barrer** says `Tocaba el viernes 13 · hace 2 días` and **Pagar la luz**, `Tocaba el martes 10 · hace 5 días`.

## Flow 2: «Vuelve …» on waiting rows

Precondition: empty list, clock at `2026-11-13T10:00:00` (Friday). Turn on **Mostrar completadas**.

1. Create `Regar` with **Intervalo** every `8` **horas** and tap its checkbox. Its row (completed, dimmed, with the bar at 0) says `Vuelve hoy 18:00 · en 8 horas`.
2. Create `Sacar la basura` with **Días de la semana** and **jueves**: its row (dimmed, with the bar, not completed) says `Vuelve el jueves 19 · en 6 días`. Create `Barrer` with **Días de la semana** and **sábado**: it says `Vuelve mañana`.
3. Create `Dormir` with **Intervalo** every `6` **días** and tap its checkbox: its row says `Vuelve el jueves 19 10:00 · en 6 días`.
4. Create `Llamar` with **No se repite**, no due date and schedule **Desde** `08:00` **Hasta** `09:00` (it is now outside the window): its row says `Vuelve mañana 08:00 · en 22 horas`.
5. Create `Cambiar foco` with **No se repite** and no due date, and postpone it with the option **3 horas**: its row (dimmed, with the bar at 0, not completed) says `Vuelve hoy 13:00 · en 3 horas` and does not contain `Pospuesta`. Tap its row: the panel still says `Pospuesta hasta 13:00`. Close it.
6. Create `Pagar la luz` with **No se repite** and due date `2026-11-10` (overdue) and postpone it with the option **Hasta mañana**: its row says `Vuelve mañana 07:00 · en 21 horas`, not `Tocaba`.
7. No row contains `Atrasada`. The bar of each waiting row is still visible.

## Flow 3: rows without date text

Precondition: empty list, clock at `2026-11-13T10:00:00` (Friday).

1. Create `Barrer` with **No se repite** and no due date, `Pagar` with **No se repite** and due date `2026-11-13`, and `Regar` with **Intervalo** every `2` **días** (without completing it). All three are pending: none of their rows contains `Tocaba`, `Vuelve` or a distance.
2. Advance the clock to `2026-12-13T10:00:00`: **Barrer** and **Regar** are still pending, with no date text (they never become overdue); **Pagar** became overdue and says `Tocaba el viernes 13 de noviembre · hace 30 días`.
3. Turn on **Mostrar completadas** and tap the checkbox of **Barrer**: its row becomes completed (struck through, checkbox checked) and shows no date or distance text.
4. Tap the row of **Regar** (a recurring task) and choose **Pausar** (`qa/pause.md`; a one-off task such as **Pagar** does not offer **Pausar**). Turn on **Mostrar pausadas**: the row of **Regar** says «Pausada» and does not contain `Tocaba` or `Vuelve`. **Pagar** is still overdue and its row says `Tocaba el viernes 13 de noviembre · hace 30 días`.
5. Turn off **Mostrar pausadas**: **Regar** disappears; **Pagar** stays in the list with its `Tocaba …` text.

## Flow 4: it updates by itself and does not change the order

Precondition: empty list, clock at `2026-11-12T20:00:00` (Thursday). Turn on **Mostrar completadas**.

1. Create `Pagar` with **No se repite** and due date `2026-11-10`, `Barrer` with **Días de la semana** and **sábado**, and `Regar` with **Intervalo** every `1` **horas**; tap the checkbox of **Regar**.
2. Advance the clock to `2026-11-12T20:30:00`: **Regar** (completed, waiting) says `Vuelve hoy 21:00 · en 30 minutos`. Without reloading, advance to `2026-11-12T20:31:00`: it says `Vuelve hoy 21:00 · en 29 minutos`. The list is **Pagar**, **Barrer**, **Regar**.
3. Advance the clock to `2026-11-12T21:00:00`: **Regar** is pending and shows no date text.
4. Advance the clock to `2026-11-12T22:00:00`: **Regar** is overdue and says `Tocaba hoy 21:00 · hace 1 hora`. Without reloading, at `2026-11-12T23:59:00` it says `Tocaba hoy 21:00 · hace 2 horas`, and at `2026-11-13T00:00:00` it says `Tocaba ayer 21:00 · hace 3 horas` (the change from «hoy» to «ayer» happens by itself, when midnight passes).
5. Advance the clock to `2026-11-14T00:00:00`: **Regar** says `Tocaba el jueves 12 21:00 · hace 2 días`; **Barrer** (pending that day) shows no date text.
6. In steps 4 and 5 the list is **Pagar**, **Regar**, **Barrer** (the overdue ones by since when they have been overdue, and then the pending one): the change of text does not change the order. Reloading the page does not change the text that corresponds to that time.

## Flow 5: the closing on completion

Precondition: empty list, clock at `2026-11-02T10:00:00` (Monday). Turn on **Mostrar completadas**.

1. Create `Regar` with **Intervalo** every `8` **horas**, `Sacar la basura` with **Días de la semana** and **jueves**, `Barrer` with **Días de la semana** and **sábado**, `Pagar la luz` with **No se repite** and no due date, and `Comprar pan` with **No se repite** and due date `2026-11-05`.
2. Advance the clock to `2026-11-13T10:00:00` (Friday). Tap the checkbox of **Regar**: the notice `Completaste «Regar»` appears with **Deshacer** and, below, `Vuelve hoy 18:00 · en 8 horas`. No congratulations or other words. Wait 5 seconds: the whole notice disappears, and the row of **Regar** says `Vuelve hoy 18:00 · en 8 horas`, the same text.
3. Tap the checkbox of **Sacar la basura**: the notice says, below `Completaste «Sacar la basura»`, the text `Vuelve el jueves 19 · en 6 días`. Tap the checkbox of **Barrer**: it replaces the previous notice and says `Vuelve mañana`.
4. Tap the checkbox of **Pagar la luz**: the notice says only `Completaste «Pagar la luz»` and **Deshacer**, with no other text below. Tap the checkbox of **Comprar pan** (overdue): the same, only `Completaste «Comprar pan»`.
5. Advance the clock to `2026-11-13T18:00:00` and tap the checkbox of **Regar** (now pending): the notice says `Vuelve mañana 02:00 · en 8 horas`. Tap **Deshacer**: the notice closes and **Regar** is pending again, with no date text.
