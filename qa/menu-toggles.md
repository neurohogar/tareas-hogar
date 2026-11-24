# QA: Completadas and Pausadas in the menu

Verifies, through the interface only:

- that the **⋮** menu («Menú») of **Pendientes** has four items, in this order: **Modo mínimo**, **Completadas**, **Pausadas**, **Reprogramar vencidas**, with no other item;
- that **Completadas** (**Mostrar completadas**) and **Pausadas** (**Mostrar pausadas**) are on/off items like **Modo mínimo**: a check mark when on, tapping one acts at that moment, without confirmation, and closes the menu;
- that the three on/off items are always enabled, also with the minimal mode on and with nothing to show, and that the menu always looks the same;
- that nothing outside the menu shows the value of **Completadas** or **Pausadas** (there are no checks above the list);
- that the value is saved on that device, survives a reload and is not synced with another device;
- that with **Completadas** on only the completed recurring tasks are added, and that a completed one-off task never has a row, with the item on or off (it is reached only from the **Historial** once the notice closes).

Covers spec §5.1, §5.4, §5.5 (checkbox and window), §6.1 (Menu and minimal mode, Mostrar pausadas, Mostrar completadas, Contrast, row checkbox), §6.2 (kind change) and §6.3 (Historial).

Out of scope: the order of the rows (`qa/pending-order.md`, `qa/show-completed.md`), the effect of **Pausadas** on the rows themselves (`qa/pause.md`), the effect of the mode on the rows (`qa/minimal-mode.md`), the preview of **Reprogramar vencidas** (`qa/block-reschedule.md`). That a device that already had a check on keeps it on after the checks moved is not verified here: a new context has no earlier value to keep, and the interface alone cannot set one.

## Environment

As in `qa/minimal-mode.md`:

- Firebase Emulator Suite (Auth + Firestore) with clean data at the start of each flow.
- Each flow starts from a new browser context (no data saved on the device), signed in with the Auth Emulator account `qa@example.com` (Flow 1 of `qa/recurring-relative.md`), unless it says otherwise.
- Simulated browser clock (`page.clock`) installed **before** opening the app, at the local time each flow gives (zone `America/Argentina/Buenos_Aires`).
  - "At X" means advancing the simulated clock to X before the step.
  - "Advance the clock to X" means advancing it to X and waiting for the screen to update by itself (without reloading).
  - With a "stopped clock" (`page.clock.pauseAt`), the clock is advanced with `page.clock.runFor` or `fastForward` to the exact time, so that time does not run while QA acts.
- Create a task: tap **+**, type the title, choose the **Se repite** option the step gives, with the controls of `qa/one-off.md`, `qa/recurring-relative.md` and `qa/recurring-calendar.md`; save.
- **Two devices** (Flow 5): two independent browser contexts, A and B, with the same account and the same simulated clock.

Reference week: Monday 2026-07-13, Tuesday 14, Wednesday 15, Thursday 16, Friday 17, Saturday 18, Sunday 19.

## Observable contract

- **Menu button**: in the header of **Pendientes**, a button with accessible name «Menú» (`aria-haspopup`). Tapping it opens the menu; tapping outside it closes it with no change.
- **Menu items**: elements with role `menuitemcheckbox` for **Modo mínimo**, **Completadas** and **Pausadas** (in this order), and an item **Reprogramar vencidas** below them (`qa/block-reschedule.md`).
  - On: a check mark and `aria-checked="true"`. Off: no mark and `aria-checked="false"`.
  - The three on/off items are never disabled (no `disabled`, no `aria-disabled="true"`).
- **Tapping an on/off item**: it turns its value on or off at once, closes the menu, and shows no confirmation, notice, dialog, toast or text.
- **Outside the menu**: no element with role `checkbox` and name "Completadas", "Mostrar completadas", "Pausadas" or "Mostrar pausadas" in **Pendientes**, and no text that says whether either value is on. Only the rows show it.
- **List**: "The list is A, B, C" means exactly those rows, from top to bottom (the line «Modo mínimo» is not a row).
- **Rows**: those of `qa/show-completed.md` (completed: struck through, checkbox checked) and `qa/pause.md` (paused: dimmed, «Pausada», checkbox disabled).

## Flow 1: the menu and its items

Precondition: empty list, clock at `2026-07-15T08:00:00` (Wednesday), mode off.

1. In **Pendientes** there are no check boxes above the list. Tap **Menú**: a menu opens with four items, in this order: **Modo mínimo**, **Completadas**, **Pausadas** and **Reprogramar vencidas**. The first three have no check mark (`aria-checked="false"`) and are enabled. Nothing else is in the menu. Tap outside it: it closes and nothing changed.
2. Create `Cambiar foco` (**No se repite**, no due date), `Regar` (**Intervalo** every `2` **días**) and `Sacar la basura` (**Días de la semana** `sábado`). At `08:05`, tap the **Regar** checkbox: its row disappears.
3. Open the menu and tap **Completadas**: the menu closes at once, with no confirmation or message. The list is **Cambiar foco**, **Sacar la basura**, **Regar** (the completed recurring task, struck through, at the end). Nothing above the list or in the header shows that **Completadas** is on.
4. Open the menu: **Completadas** has the check mark (`aria-checked="true"`); **Modo mínimo** and **Pausadas** do not. Tap **Completadas**: the menu closes and **Regar** has no row again.
5. Open the menu and tap **Pausadas** with nothing paused: the menu closes, the list does not change and nothing appears. Open it: **Pausadas** has the check mark. Tap it again: the check mark is gone.
6. Turn **Completadas** on, tap the **Regar** row and tap **Pausar**: the panel closes and the list is **Cambiar foco**, **Sacar la basura**. Turn **Pausadas** on: the list is **Cambiar foco**, **Sacar la basura**, **Regar** (paused: dimmed, «Pausada», checkbox disabled). Turn both off: the list is **Cambiar foco**, **Sacar la basura**.

## Flow 2: always enabled, also with the mode on and with nothing to show

Precondition: empty list, clock at `2026-07-15T08:00:00`, mode off.

1. With the list empty, open the menu: **Completadas** and **Pausadas** are enabled. Tap **Completadas**: the menu closes and the list is still empty. Open it: the check mark is there. Tap **Completadas** again to turn it off.
2. Create `Foco` (**No se repite**, no due date, essential) and `Regar` (**Intervalo** every `2` **días**, not essential). Tap **Menú** and **Modo mínimo**: the line «Modo mínimo» is above the list `Foco`.
3. Open the menu: **Completadas** and **Pausadas** are enabled (the menu looks the same as with the mode off, apart from the check mark of **Modo mínimo**). Tap **Completadas**, then open the menu and tap **Pausadas**: each closes the menu, shows no message and the line «Modo mínimo» stays. The list is still `Foco`: `Regar` is non-essential and paused by the mode, and never shown.
4. Turn the mode off: the list is `Regar`, `Foco`, and the check marks of **Completadas** and **Pausadas** are still there when the menu is opened.

## Flow 3: the value is saved on the device

Precondition: empty list, clock at `2026-07-15T08:00:00`.

1. Create `Cambiar foco` (**No se repite**, no due date) and `Regar` (**Intervalo** every `2` **días**), complete **Regar**, and pause `Sacar basura` (**Intervalo** every `1` **días**) from its panel. The list is **Cambiar foco**.
2. Turn **Completadas** and **Pausadas** on: the list is **Cambiar foco**, **Regar** (completed), **Sacar basura** (paused, last).
3. Reload: both items still have their check mark and the list is the same.
4. Close the tab and open the app again in the same context: it goes straight to **Pendientes**, both items have the check mark and the list is the same.
5. Turn **Completadas** off: reload: it is still off and **Pausadas** still on. The list is **Cambiar foco**, **Sacar basura**.

## Flow 4: the value is not synced between devices

Precondition: empty list, clock at `2026-07-15T08:00:00` on A and on B.

1. On A, create `Cambiar foco` (**No se repite**, no due date) and `Regar` (**Intervalo** every `2` **días**), and complete **Regar**. B sees only **Cambiar foco**.
2. On A, turn **Completadas** on: the list on A is **Cambiar foco**, **Regar**. On B, **Completadas** is still off (no check mark) and the list is still **Cambiar foco**, also after reloading B.
3. On B, turn **Completadas** on, then on A turn it off: on A the list is **Cambiar foco**; on B the check mark is still there and **Regar** is still seen.

## Flow 5: a completed one-off task never has a row

Precondition: empty list, clock stopped at `2026-07-15T08:00:00`. **Completadas** on.

1. Create `Pagar la luz` (**No se repite**, no due date), `Regar` (**Intervalo** every `2` **días**) and `Cambiar foco` (**No se repite**, no due date).
2. Tap the checkbox of **Pagar la luz** and, at `08:00:02`, that of **Regar**: the notice `Completaste «Regar»` is seen. The list is **Cambiar foco**, **Regar** (struck through). **Pagar la luz** has no row.
3. Tap **Deshacer**: **Regar** is back, non-completed. Complete it again and advance the clock to `08:00:10`: the list is **Cambiar foco**, **Regar**.
4. Turn **Completadas** off and on again: **Pagar la luz** has no row either time; **Regar** appears only with the item on.
5. Open the **Historial** and tap the entry of **Pagar la luz**: **Editar tarea** opens. Close it. Tap **Borrar** on that entry and confirm: **Pagar la luz** is back in **Pendientes**, `pendiente`, in bold, with the checkbox unchecked.
6. Create `Planchar` with **Intervalo** every `2` **días** and complete it (**Completadas** on: it is seen completed). Open its row, change **Se repite** to **No se repite** and save: the row disappears at once (it is now a completed one-off task) and it is not shown with **Completadas** off or on. Open the **Historial** and tap its entry: its panel opens.

## Flow 6: the open menu is opaque over the rows on a phone

Precondition: empty list, clock at `2026-07-15T08:00:00`, phone viewport (`390x844`).

1. Create `Tarea uno`, `Tarea dos` and `Tarea tres` (**No se repite**, no due date), each with the first step `Primero` and one more step `Segundo`. Each row has a **Hecho** button.
2. Tap **Menú**: the menu opens with its four items. For each item, the element seen at a point of the item (at its left, not at its center, which falls to the right of the row buttons) belongs to the menu: no row, and no button of a row (**Hecho**), is painted over the menu and the list is not seen through it.
