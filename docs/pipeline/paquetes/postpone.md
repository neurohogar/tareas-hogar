# Package: postpone

A `pending` or `overdue` task can be postponed from the edit panel (1 hour, 3 hours or until tomorrow at 07:00): while it lasts, it stays `waiting`, without being completed, and it comes back by itself when it expires. It is implemented after Pausar.

## Specs

- **S1** (§4.1): «| `pospuesta` | `{ desde: timestamp, hasta: timestamp }` | no | Postpone (§5.9). |»
- **S2** (§5.9): «Postponing takes a `pending` or `overdue` task out of urgency for a while, without completing it.»
- **S3** (§5.9): «Options: **1 hora**, **3 horas** and **Hasta mañana** (07:00 of the next local day). It stores `pospuesta = { desde: now, hasta }`.»
- **S4** (§5.9): «While now < `pospuesta.hasta`, a task that according to §5.1–§5.8 would be `pending` or `overdue` is **`waiting`**, with progress = (now − `desde`) / (`hasta` − `desde`); it comes back at `hasta` (order key of §6.1). If it would be `waiting` by its own rule, the postponement changes nothing.»
- **S5** (§5.9): «From `pospuesta.hasta`, the status goes back to that of §5.1–§5.8 (it can be `overdue` right away if its overdue time has already arrived). The postponement does not move due times or due dates.»
- **S6** (§5.9): «A postponed task is not completed (§6.1): it is shown with **Mostrar completadas** off.»
- **S7** (§5.9): «It can be completed while postponed (unless the schedule prevents it, §5.5): the checkbox is enabled.»
- **S8** (§5.9): «**Quitar posponer** deletes `pospuesta`. Completing, undoing or editing do not delete it; it expires by itself.»
- **S9** (§5.9): «A paused task (§5.8) cannot be postponed.»
- **S10** (§6.2): «**Posponer** (only when editing a `pending` or `overdue` task that is not paused): a **Posponer** button that offers **1 hora**, **3 horas** and **Hasta mañana**; choosing one acts at that moment and closes the panel. If the task is postponed, the panel shows "Pospuesta hasta HH:MM" (or "hasta mañana HH:MM") and a **Quitar posponer** button, which also acts at that moment.»
- **S12** (§5.9): «If now < `pospuesta.desde` (clocks of two devices out of sync), the task stays **`waiting`** with progress 0 (empty bar) until the clock reaches `desde`. Example: `pospuesta = { desde: 2026-07-15T08:05:00, hasta: 2026-07-15T09:05:00 }` and now = `2026-07-15T08:00:00`: `waiting`, progress 0; at `08:05:00` it starts to advance.»
- **S11** (§7): «`pospuesta` is a single field»

## Decisions

- D1 (2026-10-28, user, how the end time is chosen): «Opciones fijas (Recomendado)» (translation: «Fixed options (Recommended)») (1 h, 3 h, until tomorrow 07:00).
- D2 (2026-11-02, user): «Barra en 0 (Recomendado)» (translation: «Bar at 0 (Recommended)») — in answer to the question: if the clocks of two devices are out of sync and a task is left postponed «from» a future moment, how is its progress bar shown? Option: «La tarea sigue en espera con la barra vacía hasta que el reloj alcance ese momento.» (translation: «The task stays waiting with the bar empty until the clock reaches that moment.»)

## Artifacts

- Gherkin: `features/postpone-task.feature` (S1, S2, S3, S8, S9, S10, S11), `features/status-postponed.feature` (S4, S5, S7, S8, S9, S12), `features/order-postponed.feature` (S4, S5, S6)
- QA: `qa/postpone.md`

## core

- **Allowed edits**: `src/lib/core/tarea.ts`, `src/lib/core/documento-de-tarea.ts`, `src/lib/core/documento-de-tarea.test.ts`, `src/lib/core/estado-de-tarea.ts`, `src/lib/core/estado-de-tarea.test.ts`, `src/lib/core/completada.ts`, `src/lib/core/completada.test.ts`, `src/lib/core/checkbox.ts`, `src/lib/core/checkbox.test.ts`, `src/lib/core/pendientes.ts`, `src/lib/core/pendientes.test.ts`, `src/lib/core/urgencia.ts`, `src/lib/core/urgencia.test.ts`, `src/lib/core/pospo*.ts`, `src/lib/core/*.test.ts`
- **Rules**: S1–S9, S11, S12, and from S10 which button the panel offers (Posponer, Quitar posponer or none) and the text "Pospuesta hasta HH:MM" / "Pospuesta hasta mañana HH:MM"
- **Reuses**:
  - `estadoDeTarea` (`estado-de-tarea.ts`) remains the single entry point of the status: the postponement is applied on top of the status of §5.1–§5.8 (including the pause of the Pausar feature, which wins: a paused task has no status).
  - What the Pausar feature exported to know whether a task is paused (S9).
  - `sumarDias`, `enElMinuto` and `dosDigitos` (`dias.ts`) for the 07:00 of the next local day and the HH:MM text: `dias.ts` is the only core module that builds dates according to the time zone (`check:arch`).
  - `CambioDeTarea` and `aplicarCambio` (`documento-de-tarea.ts`): postponing and removing the postponement write `pospuesta` as a single field (S11); `editar` does not touch it (S8).
- **Notes**: the exported signatures that `acceptance/` and the UI already use stay compatible (only new optional parameters).
- **Gate**: `node scripts/gate.ts core`

## acceptance

- **Allowed edits**: `acceptance/steps/posponer.ts`, `acceptance/steps/pausar.ts`, `acceptance/steps/checkbox.ts`, `acceptance/steps/puntual.ts`, `acceptance/steps/index.ts`, `acceptance/steps/world.ts`, `acceptance/oracle*.ts`, `acceptance/equivalence.ts`, `docs/pipeline/pendientes.txt`
- **Features to connect**: `features/postpone-task.feature`, `features/status-postponed.feature`, `features/order-postponed.feature`
- **New steps** (those of pausing, `pauso la tarea`, `la tarea fue pausada`, `reanudo la tarea el <momento>` and `la tarea no tiene estado`, already exist):
  - `pospongo la tarea con la opción <opcion> el <momento>`
  - `la tarea fue pospuesta con la opción <opcion> el <momento>` and `la tarea <titulo> fue pospuesta con la opción <opcion> el <momento>`
  - `otro dispositivo, sin ver ese cambio, pospone la tarea con la opción <opcion> el <momento>`
  - `quito la posposición`
  - `la tarea está pospuesta desde <desde> hasta <hasta>` and `la tarea no está pospuesta`
  - `abro la tarea en el panel de edición el <momento>` (the form with a moment of `abro la tarea en el panel de edición`, from pausing)
  - `el botón de posponer del panel es <boton>` (Posponer, Quitar posponer or none)
  - `el panel de edición muestra <texto>` and `el panel de edición no dice que está pospuesta`
- **Gate**: `node scripts/gate.ts acceptance`

## ui

- **Allowed edits**: `src/lib/ui/PanelTarea.svelte`, `src/lib/ui/Sesion.svelte`, `src/lib/adapters/repositorio.ts`
- **Visible behavior**: `qa/postpone.md`
- **Notes**: `pospuesta` is read and written in `repositorio.ts` as a single field (S11); the panel text and button come from the core.
- **Gate**: `node scripts/gate.ts ui`

## cleaner · architect · hardener · qa

They work on everything the feature changed (`git diff $(git merge-base v2 HEAD)`); they need no section of their own unless the specifier leaves a note for them here.

## Log

- L1 (2026-10-28): the user's original request did not reach the specifier; the spec (commit `3263a82`, «Especificar posponer una tarea» (translation: «Specify postponing a task»)) and decision D1 reflect it. Request from the orchestrator for this package: «docs/pipeline/paquetes/postpone.md — §4.1 (pospuesta), §5.9, §6.2 (Posponer / Quitar posponer), §7. Gherkin: postpone-task, status-postponed, order-postponed. QA: qa/postpone.md.»
- L2 (2026-11-02): rework in the middle of the chain: the acceptance role found 4 survivors of scenario 1 of status-postponed with now < desde because §5.9 does not define that progress; the user answered D2.
