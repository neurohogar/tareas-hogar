# Package: first-step

First feature of epic E3 of `docs/v3/plan.md` («Primer paso a la vista» (translation: «First step in view»)): each task can have an optional «primer paso» (translation: «first step»), a line with the first concrete move («Separar la ropa blanca»), which is written in the panel and shown as «Primer paso: …» below the title, only in `pending` and `overdue` rows. Multiple steps, shown one at a time, are left for a separate feature of the same epic.

## Specs

- **S1** (§4.1): «| `primerPaso` | string | no | One line with the first concrete move (see below). Any kind of task and any effort. |»
- **S2** (§4.1): «**First step**: a single line, with no line breaks and no maximum length. On save, spaces at the start and at the end are trimmed. Empty or only spaces means **no first step** (the field is not saved). A first step is never invalid: it never rejects the creation or the edit. It has no state: completing the task, postponing it, pausing it, resuming it, undoing and changing the kind or the mode do not erase it or change it, and a recurring task that comes back shows the same first step. There is no way to mark it as done and no progress indicator. A task saved without the field has no first step (there is no migration). It does not change the status (§5), the order of the list, the filters or **Solo rápidas**, and the task name (below) is still emoji and title. It is not shown in the Historial, in the undo notice, in Anotaciones or in the copied text.»
- **S3** (§6.1): «If the task is `pending` or `overdue` and has a first step (§4.1), on its own line below the title, «Primer paso: » followed by the text, for example «Primer paso: Separar la ropa blanca». It is shown in full, on several lines if needed, without cutting, in the same size and secondary text color as the effort and the schedule, without emphasis or its own color. It is not shown in `waiting` rows (nor the postponed or completed ones) or in the paused ones. It is decided with the status of each moment: the line disappears when the task becomes `waiting` (on completing it, postponing it or because of its schedule) or is paused, and comes back by itself when it becomes `pending` or `overdue` again. An `overdue` task with the checkbox disabled until its window opens (§5.5) shows it. Tapping it is tapping the row (it opens the panel); it is not edited from the row.»
- **S4** (§6.2): «**First step**: a one-line field with the label «Primer paso», without example text, right below the title (with its emoji) and before the note. Enter in that field saves, as in every one-line field (**On-screen keyboard**, below). On create it starts empty; on edit, with the current value. Empty leaves the task without a first step, and counts for **Unsaved changes** like any field (typing and going back to the original value does not count; emptying an existing first step does).»
- **S5** (§6.2): «then the title with the emoji beside it (the emoji button next to the Título field, with **Quitar emoji** below); the first step; the note;»
- **S6** (§7): «(`emoji`, `nota` and `primerPaso` are independent fields, like `titulo`;»

## Decisions

- D1 (2026-11-13, analyst, scope): this feature covers only the optional «primer paso» field that is seen in the row. The «pasos opcionales para tareas largas, mostrados de a uno» (translation: «optional steps for long tasks, shown one at a time») are left for a separate feature of the same epic (`pasos-de-a-uno`), which decides how they relate to the first step, whether a step is marked as done and what happens to the progress when completing or when a recurring task repeats. Because the plan has the analyst split each epic into features (like E2, D1 of `estado-sin-culpa`), the first step is validated on its own only («cuántas tareas tienen primer paso» (translation: «how many tasks have a first step»)) and the steps bring their own decisions about state that the field does not need.
- D2 (2026-11-13, analyst, model): the task adds the optional field `primerPaso` (string), for any kind of task and any effort. It is a single line, with no line breaks and no maximum length (confirmed by D12); on save, spaces at the start and at the end are trimmed, and empty or only spaces means **no first step** (the field is not saved). It is never invalid, so it never rejects a save or marks a tab with an error. Because it is the rule of the text of an annotation (§4.5) and of the note (§4.1), and the plan asks not to require it or to put obstacles to creating a task.
- D3 (2026-11-13, analyst, where it is edited): in the edit panel (§6.2), **Tarea** section, a one-line field with the label «Primer paso», right below the title (with its emoji) and before the note, without example text. Enter in that field saves, as in every one-line field (§6.2, On-screen keyboard). On create it starts empty; on edit, with the current value. Because configuration goes in the panel (rule 6 of the plan), and the first step is what makes the title concrete.
- D4 (2026-11-13, analyst): the first step counts for **Unsaved changes** like any field: typing and going back to the original value does not count, nor do the spaces that **Guardar** trims; emptying an existing first step does. Because it is the single definition of "there are changes" (§6.2).
- D5 (2026-11-13, analyst): there is no way to mark the first step as done and no progress indicator; completing the task does not erase it or change it, and a recurring task that comes back shows the same first step. Postponing, pausing, resuming, undoing and changing the kind or the mode do not touch it. Because it is part of the definition of the task, like the note, and the plan asks not to treat a half-done task as a failure.
- D6 (2026-11-13, analyst; reconciled with D10–D12): in the rows that show it (D10) it is seen on its own line, below the title, with the prefix «Primer paso: » (D11), in full and on several lines if needed, without cutting (D12), in the size and secondary text color of the effort and the schedule, without emphasis or its own color. Tapping it is tapping the row (it opens the panel), like the chips; it is not edited from the row. Because what is configured goes in the panel (rule 6) and the row does not gain another control.
- D7 (2026-11-13, analyst): the first step is not shown in the Historial (§6.3), in the undo notice (§5.4), in Anotaciones (§6.7) or in the copied text. It does not change the status (§5), the order of the list (§6.1), the filters or «Solo rápidas». Because the plan asks for it «en la fila» (translation: «in the row»), and the name of the task (§4.1) is still emoji and title.
- D8 (2026-11-13, analyst, sync): `primerPaso` is an independent field of §4.1: the last change wins, per field, like `nota` (§7). An edit writes only if it changed. Because it is the conflict rule of the text fields of the task.
- D9 (2026-11-13, analyst, existing tasks): there is no migration. A task saved without the field has no first step, and its row and its panel look as today. Because «sin el campo» (translation: «without the field») already means «sin valor» (translation: «without a value») for the optional fields of §4.1 (emoji, note, effort) and the plan asks that everything new starts calm.
- D10 (2026-11-13, user, in which rows it is seen): P1 «Solo pendiente y atrasada (Recomendada)» (translation: «Only pending and overdue (Recommended)»). Waiting rows (the postponed ones too), paused ones and completed ones do not show the first step.
- D11 (2026-11-13, user, how it reads): P2 «Con prefijo: «Primer paso: …» (Recomendada)» (translation: «With a prefix: «Primer paso: …» (Recommended)»), for example «Primer paso: Separar la ropa blanca», on its own line under the title and in secondary text.
- D12 (2026-11-13, user, long first step): P3 «Sin máximo, se muestra entero (Recomendada)» (translation: «No maximum, shown in full (Recommended)»). The row shows it in full, on several lines if needed; there is no maximum or error on save (D2 stays as it is).
- D13 (2026-11-13, analyst, when it appears and disappears): the rule of D10 is evaluated with the status of each moment (§5, §6.1) and stores nothing: the line disappears when the task becomes `waiting` (on completing it, postponing it or because of its schedule) or is paused, and comes back by itself when the task becomes `pending` or `overdue` again. An `overdue` task with the checkbox disabled until its window opens (§5.5) shows it. Because it is the same status rule that already decides the overdue text and the return text of the row, and it needs no other.

## Artifacts

- Gherkin: `features/first-step.feature` (S1, S2, S6), `features/first-step-in-row.feature` (S2, S3), `features/first-step-unsaved-changes.feature` (S4; S5 is covered only by QA)
- QA: `qa/first-step.md` (S1, S2, S3, S4, S5, S6; S5, the order of the field in the panel, and the part of S2 that says it is not shown in the Historial, the undo notice, Anotaciones or the copied text, are covered only by QA)

## core

- **Allowed edits**: `src/lib/core/tarea.ts`, `src/lib/core/creacion.ts`, `src/lib/core/crear-periodica-calendario.ts`, `src/lib/core/datos-de-tarea.ts`, `src/lib/core/documento-de-tarea.ts`, `src/lib/core/edicion.ts`, `src/lib/core/cambios-sin-guardar.ts`, `src/lib/core/campos-de-texto.ts`, `src/lib/core/pendientes.ts`, `src/lib/core/primer-paso*.ts` (new file), `src/lib/core/*.test.ts` (all core tests: a change to an exported type can touch them)
- **Rules**: S1 (optional field `primerPaso` in `Tarea` and in the document, for every kind and effort), S2 (trim, empty or only spaces means no field, never invalid, no maximum length, it has no state: no action or change of kind or mode touches it; it does not change status or order; an edit writes it only if it changed), S3 (when the row shows it: status `pendiente` or `atrasada`, not `en espera`, not completed, not paused; the prefix «Primer paso: » and the full text), S4 (what counts as a change in **Unsaved changes**: it is compared trimmed, empty equals no field), S6 (independent field: each field travels alone in the change if it changed, and null removes it)
- **Reuses**:
  - `crearTarea` and `DatosComunes` (`creacion.ts`): the first step is a field common to every kind, like emoji, note and effort. `crearPeriodica` for calendar (`crear-periodica-calendario.ts`) is the only creator that does not propagate the common fields with a spread: `primerPaso` has to be passed to it by hand. `crearSegunDatos` and `datosDeTarea` (`datos-de-tarea.ts`) are still inverses.
  - `normalizarNota` (`nota.ts`) and `camposDeTexto` (`campos-de-texto.ts`): the first step follows the same text rule as the note (trim, empty means no field); a module `primer-paso.ts` of its own only if the rule does not fit in the existing one without mixing jobs.
  - `editar` (`edicion.ts`): the field enters the change only if it changed, and null removes it (`cambioDeValor`); changing the kind does not touch it.
  - `filasDePendientes` (`pendientes.ts`) and `clasificarEnPendientes` (`completada.ts`): the status of each row is already decided there; the first step is shown according to that status, without storing anything or reordering.
  - `hayCambios` and `claveDeNota` (`cambios-sin-guardar.ts`): the single definition of "there are changes".
- **Notes**: the exported signatures that `acceptance/` and the UI already use stay compatible (only new optional fields and parameters). `nombreDeTarea` (`nombre-de-tarea.ts`) does not change: the name is still emoji and title.
- **Gate**: `node scripts/gate.ts core`

## acceptance

- **Allowed edits**: `acceptance/steps/primer-paso.ts` (new file), `acceptance/steps/index.ts`, `acceptance/steps/world.ts`, `acceptance/steps/pendientes.ts`, `acceptance/steps/edicion.ts`, `acceptance/steps/cambios-sin-guardar.ts`, `acceptance/oracle*.ts`, `acceptance/equivalence.ts`, `docs/pipeline/pendientes.txt`
- **Features to connect**: `features/first-step.feature`, `features/first-step-in-row.feature`, `features/first-step-unsaved-changes.feature`
- **New steps** (already existing and reused: `una tarea puntual sin fecha límite`, `una tarea puntual con fecha límite <limite>`, those for created on, schedule, complete, pause, resume, postpone, `borro el completado del`, `consulto Pendientes el` and `en cualquier momento`, `consulto el estado el`, `el estado es <estado>`, `Pendientes muestra en orden`, `el checkbox de la tarea está deshabilitado`, `abro el panel para crear/editar`, `escribo ... en el campo`, `vacío el campo`, `toco la X del panel`, `queda abierto`, `otro dispositivo, sin ver ese cambio, edita el título/la nota` and `guarda la tarea sin cambios`):
  - `creo una tarea puntual con título <titulo> y primer paso <primer_paso>`
  - `creo una tarea periódica relativa con título <titulo> cada <cada> <unidad> y primer paso <primer_paso>`
  - `creo una tarea periódica semanal con título <titulo> los <dias> y primer paso <primer_paso>`
  - `creo una tarea puntual con título <titulo> y un primer paso de solo espacios`
  - `el primer paso de la tarea es <primer_paso>` (Given: leaves the task already saved with that first step, without going through "edit"; it does not mark a change "on my side")
  - `el primer paso de la tarea <titulo> es <primer_paso>` (Given, for scenarios with two tasks)
  - `edito el primer paso a <primer_paso>`
  - `edito el primer paso a <primer_paso> con espacios al inicio y al final`
  - `edito el primer paso a uno de solo espacios`
  - `edito el primer paso a uno de <largo> caracteres`
  - `quito el primer paso`
  - `otro dispositivo, sin ver ese cambio, edita el primer paso a <primer_paso>`
  - `otro dispositivo, sin ver ese cambio, quita el primer paso`
  - `la tarea tiene primer paso <primer_paso>`
  - `la tarea no tiene primer paso` (the document does not have the field)
  - `la tarea tiene un primer paso de <largo> caracteres`
  - `la fila de la tarea muestra el primer paso <texto>` (the exact text that is seen, with the prefix «Primer paso: »; the queried list has a single row, as in `la fila de la tarea muestra el esfuerzo`)
  - `la fila de la tarea no muestra primer paso`
  - `abro el panel para editar la tarea <titulo> con primer paso <primer_paso>`
  - the field `Primer paso` in the field tables of `escribo ... en el campo <campo>`, `escribo <valor> con espacios alrededor en el campo <campo>`, `vacío el campo <campo>` and `escribo solo espacios en el campo <campo>`
- **Notes**:
  - Changing the kind in the panel keeps the first step: add `primerPaso` to `camposQueConserva` in `acceptance/steps/edicion.ts` (and to the `Pick` of its return type). It also has to be added to the lists of common fields of `conCampos` and `comunesDe` in the steps that build data (`emoji-y-nota.ts`, `cambios-sin-guardar.ts`) if they do not use a spread.
  - `FilaConsultada` (`world.ts`) gains what the row shows of the first step; `filasEn` (`pendientes.ts`) takes it from the core, and the oracle (`oracle.ts`, `oracle-edicion.ts`, `oracle-panel.ts`) rewrites it from S3 (only `pendiente` and `atrasada`) and S2/S4 without importing the core or the step handlers. Each new rule that enters a Then is added to the oracle. Do not create a new `acceptance/oracle-*.ts`: it clashes with the manual list of `scripts/check-arch.ts`.
  - Tasks declared with a title and without `creada el` are created at the same instant: a tie of urgency is resolved by title (`Primer paso 18`).
  - An `atrasada` task has at least 60 s of delay (the scenarios do not write smaller edges).
- **Gate**: `node scripts/gate.ts acceptance`

## ui

- **Allowed edits**: `src/lib/ui/PanelTarea.svelte`, `src/lib/ui/SeccionTarea.svelte`, `src/lib/ui/FilaTarea.svelte`, `src/lib/ui/Pendientes.svelte`, `src/lib/adapters/repositorio.ts`
- **Visible behavior**: `qa/first-step.md`
- **Notes**:
  - **Primer paso** field in the **Tarea** section of the panel: one line, label «Primer paso», without example text, right below the title (with its emoji and **Quitar emoji**) and before the note; it starts empty on create and with the current value on edit; Enter saves as in **Título**.
  - The row shows «Primer paso: …» on its own line below the title when the core says so (only `pendiente` and `atrasada`), in full and on several lines, with the secondary text color and size of the effort and the schedule, without emphasis or its own color, and without a control of its own: tapping it is tapping the row.
  - `primerPaso` is read and written in `repositorio.ts` as an independent field (like `nota`): an edit writes it only if it changed, and emptying it deletes the field.
  - It is not shown in the Historial, the undo notice, Anotaciones or the copied text (those components do not have to be touched).
- **Gate**: `node scripts/gate.ts ui`

## cleaner · architect · hardener · qa

They work on everything the feature changed (`git diff <feature base>`, recorded in `tmp/base-de-feature`); they need no section of their own unless the gherkin-writer leaves a note for them here.

- **Notes**: the first step repeats the text rule of the note (trim, empty means no field); if the core duplicates it, the cleaner unifies it without changing the behavior. The hardener runs `--level full` only on the features with a step served by a changed handler (e.g. `camposQueConserva`, `FilaConsultada`) or with a Then that goes through a new rule of the oracle.

## Log

- L1 (2026-11-13): the user's original request, verbatim: «Run all remaining features of docs/v3/plan.md through the pipeline in automatic mode», about epic E3 of `docs/v3/plan.md` (the epic text is in Spanish, as in the plan; below it, its translation):

  ### E3. Primer paso a la vista

  - **Problema y persona.** TDAH y TEA. El título de una tarea es abstracto («Ropa»); decidir por dónde empezar es parte del costo de empezar.
  - **Evidencia.** `tdah §1.3A` (moderada e indirecta: ningún ensayo aísla el primer paso); `tea §1` (moderada: no saber cuál es el primer paso paraliza); `tdah §1.2b` (débil: falla formar el plan, no recordarlo); `tdah §2.1` (anecdótica a moderada).
  - **Qué propone.** Un campo opcional «primer paso» que se ve en la fila. Pasos opcionales para tareas largas, mostrados de a uno.
  - **Hipótesis y validación.** Ver el primer movimiento concreto cuesta menos que leer el título. Señal: notas sobre tareas con primer paso, y el campo se sigue llenando después de cuatro semanas. La refuta que escribirlo cueste más de lo que ahorra.
  - **Evitar.** Mostrar la descomposición entera; exigir pasos para crear una tarea; tratar como fallo una tarea con pasos a medio hacer. Demasiadas partes también paralizan (`tea §1`).
  - **Depende de · Tamaño · Riesgos.** Nada · M · La fila gana densidad (la E9 lo compensa).

  (translation)

  ### E3. First step in view

  - **Problem and person.** ADHD and ASD. The title of a task is abstract («Ropa»); deciding where to start is part of the cost of starting.
  - **Evidence.** `tdah §1.3A` (moderate and indirect: no trial isolates the first step); `tea §1` (moderate: not knowing what the first step is paralyzes); `tdah §1.2b` (weak: forming the plan fails, not remembering it); `tdah §2.1` (anecdotal to moderate).
  - **What it proposes.** An optional «primer paso» field that is seen in the row. Optional steps for long tasks, shown one at a time.
  - **Hypothesis and validation.** Seeing the first concrete move costs less than reading the title. Signal: notes about tasks with a first step, and the field is still filled in after four weeks. It is refuted if writing it costs more than it saves.
  - **Avoid.** Showing the whole breakdown; requiring steps to create a task; treating a task with half-done steps as a failure. Too many parts also paralyze (`tea §1`).
  - **Depends on · Size · Risks.** Nothing · M · The row gains density (E9 compensates for it).
