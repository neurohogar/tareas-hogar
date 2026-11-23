# Package: menu-toggles

The **Completadas** and **Pausadas** checks leave the top of **Pendientes** and become items of the **⋮** menu; with **Mostrar completadas** on, only the completed recurring tasks are shown, never the completed one-off ones.

## Specs

## Decisions

- D1 (2026-11-23, analyst): the two new menu items behave like **Modo mínimo**: each one shows a check mark when on, tapping it acts at that moment without confirmation, turns the value on or off and closes the menu. Because **Modo mínimo** is already a switch item of the same menu and §6.1 has no other switch pattern.
- D2 (2026-11-23, analyst): both values stay preferences **of that device** (not synced, not in Firestore), survive reloading the app and keep the value already saved on each device (whoever had «Completadas» on still has it on after the change), with off as the initial value. Because the request moves where they are tapped, not what they are (§6.1 «The value is saved on that device»).
- D3 (2026-11-23, analyst): the two items are always enabled, also with the minimal mode on and with nothing to show; the menu always looks the same. Because §6.1 already demands «the menu always looks the same» for **Reprogramar vencidas** and the effect of the checks with the mode on is already defined (Which rows are in view with the mode on).
- D4 (2026-11-23, analyst): with **Mostrar completadas** on, the completed recurring tasks keep their current rule (order by most recent `completadoEn`, struck through, «Vuelve …», after the uncompleted ones and before the paused ones). Because the request only removes the one-off ones.
- D5 (2026-11-23, analyst): the undo notice of §5.4 (with **Deshacer**) and the **Historial** (§6.3: entries, **Borrar**, opening the panel) do not change for a completed one-off task. Because the request is about the list of **Pendientes** only.
- D6 (2026-11-23, analyst): a recurring task with completions that becomes one-off on editing (§6.2) is a completed one-off task, so it leaves **Pendientes** with **Mostrar completadas** on or off (it is reached from the **Historial**). Because it is the same rule as any completed one-off task, whatever Q1 decides about them.

## Artifacts

- Files that assume the current location of the checks (above the list, `getByRole("checkbox", { name: "Completadas" | "Pausadas" })`) or the current menu of two items, and must be updated:
  - e2e: `e2e/support.ts` (helpers of Mostrar completadas), `e2e/show-completed.spec.ts`, `e2e/minimal-mode.spec.ts` (Flow 2 counts one `menuitemcheckbox` and expects the checks outside the menu), `e2e/block-reschedule.spec.ts`, `e2e/edit-delete.spec.ts`, `e2e/first-step.spec.ts`, `e2e/guilt-free-status.spec.ts`, `e2e/last-time.spec.ts`, `e2e/minimal-version.spec.ts`, `e2e/one-off.spec.ts`, `e2e/one-step-at-a-time.spec.ts`, `e2e/panel-mobile.spec.ts`, `e2e/pause.spec.ts`, `e2e/postpone.spec.ts`, `e2e/schedule.spec.ts`, `e2e/unsaved-changes.spec.ts`.
  - qa: `qa/show-completed.md`, `qa/minimal-mode.md` (Menu button: «The check boxes … stay where they are»; Flow 2 step 3), `qa/block-reschedule.md`, `qa/edit-delete.md`, `qa/first-step.md`, `qa/guilt-free-status.md`, `qa/history-undo.md`, `qa/last-time.md`, `qa/minimal-version.md`, `qa/one-step-at-a-time.md`, `qa/panel-mobile.md`, `qa/pause.md`, `qa/postpone.md`, `qa/one-off.md`, `qa/pending-order.md`.
  - Steps that rely on a completed one-off row in view (they break with the second part): `qa/first-step.md` (step 5, «Cambiar foco»), `qa/minimal-version.md` (step 10, «Cambiar foco»), `qa/last-time.md`, `qa/edit-delete.md`, `qa/history-undo.md`, `qa/minimal-mode.md` (the star flow, step 4, «Pagar la luz»), `qa/show-completed.md`.
  - Features whose rules mention the completed one-off row: `features/show-completed.feature`, `features/tap-checkbox.feature` (tapping the checkbox of a completed one-off task), `features/row-without-date-text.feature`, `features/show-paused.feature`, `features/pending-order.feature`.

## core

## acceptance

## ui

## cleaner · architect · hardener · qa

## Log

- L1 (2026-11-23): «quiero q los checkbox de completadas y pausadas los pases al menu de los 3 puntos. y q al mostrar las completadas no se muestren las puntuales completadas, q se muestren solo las q tengan repeticion» (translation: «I want you to move the Completadas and Pausadas checkboxes to the three-dots menu. And when showing the completed ones, the completed one-off tasks should not be shown, only the ones that repeat»)
