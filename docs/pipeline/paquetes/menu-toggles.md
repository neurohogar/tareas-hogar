# Package: menu-toggles

The **Completadas** and **Pausadas** checks leave the top of **Pendientes** and become on/off items of the **⋮** menu, with the same texts, in the order Modo mínimo, Completadas, Pausadas, Reprogramar vencidas, and with no indicator outside the menu. A completed one-off task is never shown in **Pendientes** (with **Mostrar completadas** on or off): **Mostrar completadas** shows only the completed recurring tasks, and after the undo notice closes the **Historial** is the only way to open or un-complete a completed one-off task.

## Specs

## Decisions

- D1 (2026-11-23, analyst): the two new menu items behave like **Modo mínimo**: each one shows a check mark when on, tapping it acts at that moment without confirmation, turns the value on or off and closes the menu. Because **Modo mínimo** is already a switch item of the same menu and §6.1 has no other switch pattern.
- D2 (2026-11-23, analyst): both values stay preferences **of that device** (not synced, not in Firestore), survive reloading the app and keep the value already saved on each device (whoever had «Completadas» on still has it on after the change), with off as the initial value. Because the request moves where they are tapped, not what they are (§6.1 «The value is saved on that device»).
- D3 (2026-11-23, analyst): the two items are always enabled, also with the minimal mode on and with nothing to show; the menu always looks the same. Because §6.1 already demands «the menu always looks the same» for **Reprogramar vencidas** and the effect of the checks with the mode on is already defined (Which rows are in view with the mode on).
- D4 (2026-11-23, analyst): with **Mostrar completadas** on, the completed recurring tasks keep their current rule (order by most recent `completadoEn`, struck through, «Vuelve …», after the uncompleted ones and before the paused ones). Because the request only removes the one-off ones.
- D5 (2026-11-23, analyst): the undo notice of §5.4 (with **Deshacer**) and the **Historial** (§6.3: entries, **Borrar** with its confirmation, opening the panel) keep their behaviour for a completed one-off task; after the notice closes they are the only way to reach it: tapping its entry opens **Editar tarea**, and **Borrar** is the only way to un-complete it. Because D7 removes its row (and with it its checkbox) from **Pendientes**, and the user accepted the Historial as the only way in D7.
- D6 (2026-11-23, analyst): a recurring task with completions that becomes one-off on editing (§6.2) is a completed one-off task, so on saving it leaves **Pendientes** with **Mostrar completadas** on or off and is reached only from the **Historial**. Because D7 applies to every completed one-off task, whatever its origin.

- D7 (2026-11-23, user, Q1 completed one-off tasks): «Nunca se muestra en Pendientes (Recomendada)» (translation: «It is never shown in Pendientes (Recommended)»). Option description: neither with the option on nor off; after the Deshacer notice closes, the only way to open it or un-complete it is the Historial (tap the entry, or Borrar); it can no longer be un-completed by tapping its checkbox in the list.
- D8 (2026-11-23, user, Q2 order in the ⋮ menu): «Junto a Modo mínimo» (translation: «Next to Modo mínimo»). Option description: Modo mínimo, Completadas, Pausadas, Reprogramar vencidas; the three on/off items sit together and Reprogramar vencidas moves from second to last.
- D9 (2026-11-23, user, Q3 menu texts): ««Completadas» y «Pausadas»» (translation: «"Completadas" and "Pausadas"»). Option description: the same words as today; a bare «Completadas» in a menu can be read as an action or as a screen.
- D10 (2026-11-23, user, Q4 indicator outside the menu): «No, solo el menú (Recomendada)» (translation: «No, only the menu (Recommended)»). Option description: the menu shows it with its check mark; the list stays as clean as today; the completed rows (struck through) and paused rows («Pausada») already show what they are; the user only finds out by opening the menu.

- D11 (2026-11-23, analyst): the definition of **completed** of §6.1 does not change (a one-off task with at least one completion is still completed: it is not in view with **Mostrar completadas** off, and the status rules of §5 do not change); D7 only removes it from the rows that **Mostrar completadas** on adds. Because the request filters which completed rows are shown, not what a completed task is.
- D12 (2026-11-23, analyst): the rules about a completed one-off row in **Pendientes** (tapping its checkbox deletes its most recent completion, its row has no date text, it goes struck through at the end) are removed from the spec, not kept as unreachable rules; the checkbox of a completed recurring task keeps its rules (§5.4, §5.5, §6.1). Because with D7 that row no longer exists and the spec only describes what can happen.
- D13 (2026-11-23, analyst): the Completadas and Pausadas items keep the internal names **Mostrar completadas** and **Mostrar pausadas** in the spec; only their place and their row in the menu change. Because D9 keeps the texts shown, and the rules of §5 and §6 already refer to them by those names.

## Artifacts

- Files that assume the current location of the checks (above the list, `getByRole("checkbox", { name: "Completadas" | "Pausadas" })`) or the current menu of two items, and must be updated:
  - e2e: `e2e/support.ts` (helpers of Mostrar completadas), `e2e/show-completed.spec.ts`, `e2e/minimal-mode.spec.ts` (Flow 2 counts one `menuitemcheckbox` and expects the checks outside the menu), `e2e/block-reschedule.spec.ts`, `e2e/edit-delete.spec.ts`, `e2e/first-step.spec.ts`, `e2e/guilt-free-status.spec.ts`, `e2e/last-time.spec.ts`, `e2e/minimal-version.spec.ts`, `e2e/one-off.spec.ts`, `e2e/one-step-at-a-time.spec.ts`, `e2e/panel-mobile.spec.ts`, `e2e/pause.spec.ts`, `e2e/postpone.spec.ts`, `e2e/schedule.spec.ts`, `e2e/unsaved-changes.spec.ts`.
  - qa: `qa/show-completed.md`, `qa/minimal-mode.md` (Menu button: «The check boxes … stay where they are»; Flow 2 step 3), `qa/block-reschedule.md`, `qa/edit-delete.md`, `qa/first-step.md`, `qa/guilt-free-status.md`, `qa/history-undo.md`, `qa/last-time.md`, `qa/minimal-version.md`, `qa/one-step-at-a-time.md`, `qa/panel-mobile.md`, `qa/pause.md`, `qa/postpone.md`, `qa/one-off.md`, `qa/pending-order.md`.
  - Steps that rely on a completed one-off row in view (they break with the second part): `qa/first-step.md` (step 5, «Cambiar foco»), `qa/minimal-version.md` (step 10, «Cambiar foco»), `qa/last-time.md`, `qa/edit-delete.md`, `qa/history-undo.md`, `qa/minimal-mode.md` (the star flow, step 4, «Pagar la luz»), `qa/show-completed.md`.
  - Features whose rules mention the completed one-off row: `features/show-completed.feature`, `features/tap-checkbox.feature` (tapping the checkbox of a completed one-off task), `features/row-without-date-text.feature`, `features/show-paused.feature`, `features/pending-order.feature`.

- Spec rules that assume a completed one-off row in **Pendientes**, or the checks above the list, to rewrite (D7 to D12):
  - §3 Glossary, **One-off task**: already says «it leaves the list»; stays, now without exception.
  - §5.1 table, «Has at least one completion»: drop «(with **Mostrar completadas**, §6.1, it is shown struck through at the end)».
  - §5.4: «A completion of the minimal version is deleted like any other (notice, **Historial** or the checkbox of the completed task)»: the checkbox only for a recurring task; a one-off task, notice or **Historial**.
  - §5.5: «Deleting a completion (checkbox of a completed task, notice, **Historial**) is possible at any hour»: same qualification.
  - §6.1 **Menu and minimal mode**: four items in the order of D8, «"Completadas" and "Pausadas" stay where they are» goes away; **Reprogramar vencidas** «the second item» becomes the last one.
  - §6.1 **Mostrar pausadas** («a check next to "Completadas"») and **Mostrar completadas** («a check above the list»): they become items of the menu (D1, D8, D9), and «On:» adds only the completed recurring tasks.
  - §6.1 «Contrast»: the struck-through completed row is only a recurring one.
  - §6.1 row rules: «`pending` rows, the paused ones and the completed one-off tasks do not show date or distance text»: drop the completed one-off tasks.
  - §6.1 checkbox: «Tapping the checkbox of a completed task: One-off: deletes its most recent completion …» goes away; the recurring branch says «like a one-off task», which needs its own wording (D12).
  - §6.2 kind change: «A recurring task with completions that becomes one-off … on, it is shown struck through with the completed ones» and «A completed one-off task has no row in **Pendientes** with **Mostrar completadas** off (on, it is shown struck through at the end, §6.1)»: no row in either case (D6, D7).
  - §6.3: «also for a completed one-off task, which with **Mostrar completadas** off has no row in **Pendientes**»: it never has one; the **Historial** is the only way to it after the notice (D5).
  - §6.1 **Which rows are in view with the mode on** and §5.8: no wording change needed (they already hide non-essential tasks with either check).

## core

## acceptance

## ui

## cleaner · architect · hardener · qa

## Log

- L1 (2026-11-23): «quiero q los checkbox de completadas y pausadas los pases al menu de los 3 puntos. y q al mostrar las completadas no se muestren las puntuales completadas, q se muestren solo las q tengan repeticion» (translation: «I want you to move the Completadas and Pausadas checkboxes to the three-dots menu. And when showing the completed ones, the completed one-off tasks should not be shown, only the ones that repeat»)
