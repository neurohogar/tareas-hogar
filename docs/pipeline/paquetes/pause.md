# Package: pause

Recurring tasks can be paused from the edit panel: a paused task has no status, does not become overdue and is not shown in Pendientes except with "Mostrar pausadas". When it is resumed, it is evaluated as newly created at that moment.

## Specs

- **S1** (§4.1): «| `pausada` | boolean | no | Recurring only (§5.8). Without the field, it is not paused. |»
- **S2** (§4.1): «| `reanudadaEn` | timestamp | no | Last time it was resumed (§5.8). |»
- **S3** (§5.8): «Only **recurring** tasks can be paused.»
- **S4** (§5.8): «**Paused**: it has no status (it is not `pending`, `overdue` or `waiting`), it does not become overdue and it is not completed (§6.1). It does not appear in **Pendientes** except with **Mostrar pausadas** (§6.1). Its checkbox is disabled.»
- **S5** (§5.8): «**Resume** (**Reanudar**) stores `reanudadaEn` = now and removes `pausada`. From then on the task is evaluated **as newly created at `reanudadaEn`**: with `creadaEn` = `reanudadaEn` and without the completions with `completadoEn` before `reanudadaEn` (which stay in the **Historial** and in "Última vez"). Thus:
  - Relative: it is `pending` on resume (never completed, §5.2).
  - Calendar: `pending` if today is an occurrence day; if not, `waiting` until the next one (§5.3).
  - With a schedule, §5.5–§5.7 with that `creadaEn`.
  - What happened during the pause does not count as overdue.»
- **S6** (§5.8): «`reanudadaEn` only applies to recurring tasks: a one-off task ignores it (a paused recurring task with completions that becomes one-off stays completed, §6.2). The filter by `reanudadaEn` is permanent: it keeps applying after changes of kind or mode, until the next resume.»
- **S7** (§5.8): «With a schedule, an occurrence whose window closed before `reanudadaEn` does not count as missed: on the day of the resume, if the window has already closed, the task stays `waiting` until the next occurrence (not `overdue`).»
- **S8** (§5.8): «The real `creadaEn` does not change: the tie-break of the order (§6.1) still uses the real `creadaEn`.»
- **S9** (§5.8): «Completions can still be deleted (**Historial**, notice) while the task is paused.»
- **S10** (§5.8): «Changing a paused recurring task to one-off resumes it (removes `pausada` and stores `reanudadaEn`).»
- **S11** (§6.1): «**Mostrar pausadas**: a check next to "Mostrar completadas", with the text "Mostrar pausadas". Off (the initial value), the paused tasks (§5.8) are not shown. On, they go at the end of the list (after the completed ones, if those are shown), by title in the alphabetical order above; each row dimmed, with the text "Pausada" instead of the status indicator and the checkbox disabled. The filter by label also applies to the paused ones. The value is saved on that device, like "Mostrar completadas".»
- **S12** (§6.2): «**Pause / Resume** (only when editing a recurring task): a **Pausar** button; if the task is paused, the panel indicates it ("Pausada") and the button is **Reanudar**. The button acts at that moment (saves and closes the panel), without going through **Guardar**.»
- **S13** (§7): «pausing and resuming write `pausada` and `reanudadaEn` together»

## Decisions

- D1 (2026-10-28, user, how long the pause lasts): «Hasta que la reanude (Recomendado)» (translation: «Until I resume it (Recommended)»)
- D2 (2026-10-28, user, status on resuming): «Pendiente ya (Recomendado)» (translation: «Pending right away (Recommended)»)
- D3 (2026-10-28, orchestrator): only recurring tasks can be paused.
- D4 (2026-10-28, orchestrator): the "Mostrar pausadas" check is saved on the device.
- D5 (2026-10-28, orchestrator): `reanudadaEn` only applies to recurring tasks (option A).
- D6 (2026-10-28, orchestrator): with a schedule, a window that closed before resuming does not count as missed.

## Artifacts

- Gherkin: `features/pause-task.feature` (S1, S3, S4, S9, S12, S13), `features/resume-task.feature` (S2, S5, S6, S7, S8, S10, S13), `features/show-paused.feature` (S4, S11)
- QA: `qa/pause.md`

## core

- **Allowed edits**: `src/lib/core/tarea.ts`, `src/lib/core/documento-de-tarea.ts`, `src/lib/core/documento-de-tarea.test.ts`, `src/lib/core/estado.ts`, `src/lib/core/estado.test.ts`, `src/lib/core/estado-de-tarea.ts`, `src/lib/core/estado-de-tarea.test.ts`, `src/lib/core/completada.ts`, `src/lib/core/completada.test.ts`, `src/lib/core/completados.ts`, `src/lib/core/completados.test.ts`, `src/lib/core/checkbox.ts`, `src/lib/core/checkbox.test.ts`, `src/lib/core/pendientes.ts`, `src/lib/core/pendientes.test.ts`, `src/lib/core/orden-de-pendientes.ts`, `src/lib/core/urgencia.ts`, `src/lib/core/urgencia.test.ts`, `src/lib/core/plazos-con-horario.ts`, `src/lib/core/ocurrencias-con-horario.ts`, `src/lib/core/ocurrencias-con-horario.test.ts`, `src/lib/core/edicion.ts`, `src/lib/core/edicion.test.ts`, `src/lib/core/guardar-con-etiquetas.ts`, `src/lib/core/guardar-con-etiquetas.test.ts`, `src/lib/core/pausa*.ts`, `src/lib/core/*.test.ts`
- **Rules**: S1–S11, S13 (S11: which rows and in what order; saving on the device belongs to the UI)
- **Reuses**:
  - `estadoDeTarea` (`estado-de-tarea.ts`) is still the only entry point of the status: the pause and the filter by `reanudadaEn` enter there, not in each rule of §5.2–§5.7.
  - `completadosDeTarea` and `completar` (`completados.ts`): the new completion of a resumed task covers the occurrence according to the filtered completions and `creadaEn` = `reanudadaEn`.
  - `compararTitulos` (`orden-alfabetico.ts`) for the order of the paused tasks; `desempatar` of `orden-de-pendientes.ts` still uses the real `creadaEn` (S8).
  - `filtrarPorEtiqueta` (`filtro-por-etiqueta.ts`) has to filter the paused rows too, without changes in that module.
  - `CambioDeTarea` and `aplicarCambio` (`documento-de-tarea.ts`) for pausing, resuming and the edit to one-off: a single change with `pausada` and `reanudadaEn` together (S13).
- **Notes**: the exported signatures that `acceptance/` and the UI already use (`estadoDeTarea`, `filasDePendientes`, `checkboxHabilitado`, `accionDelCheckbox`, `editar`, `editarConEtiquetas`, `tareaDesdeDocumento`) stay compatible: only new optional parameters, because the core gate runs the already implemented acceptance.
- **Gate**: `node scripts/gate.ts core`

## acceptance

- **Allowed edits**: `acceptance/steps/pausar.ts`, `acceptance/steps/index.ts`, `acceptance/steps/world.ts`, `acceptance/steps/pendientes.ts`, `acceptance/steps/checkbox.ts`, `acceptance/steps/edicion.ts`, `acceptance/oracle*.ts`, `acceptance/equivalence.ts`, `docs/pipeline/pendientes.txt`
- **Features to connect**: `features/pause-task.feature`, `features/resume-task.feature`, `features/show-paused.feature`
- **New steps**:
  - `pauso la tarea` and `pauso la tarea <titulo>`
  - `la tarea fue pausada` and `la tarea <titulo> fue pausada`
  - `otro dispositivo, sin ver ese cambio, pausa la tarea`
  - `reanudo la tarea el <momento>` and `reanudo la tarea <titulo> el <momento>`
  - `la tarea está pausada` and `la tarea no está pausada`
  - `la tarea no tiene estado`
  - `la tarea no está completada`
  - `abro la tarea en el panel de edición`
  - `el panel de edición ofrece <accion>` (Pausar or Reanudar) and `el panel de edición no ofrece pausar`
  - `edito la tarea a puntual sin fecha límite el <momento>` (the edit with a moment: the one that stores `reanudadaEn`)
  - `Mostrar pausadas está encendido`
  - `Pendientes muestra como pausadas <titulos>`
- **Gate**: `node scripts/gate.ts acceptance`

## ui

- **Allowed edits**: `src/lib/ui/PanelTarea.svelte`, `src/lib/ui/Sesion.svelte`, `src/lib/ui/sesion.ts`, `src/lib/ui/Pendientes.svelte`, `src/lib/ui/FilaTarea.svelte`, `src/lib/adapters/repositorio.ts`, `src/lib/adapters/mostrar-pausadas.ts`
- **Visible behavior**: `qa/pause.md`
- **Notes**: `pausada` and `reanudadaEn` are read and written in `repositorio.ts` (S13: in a single `update`); the "Mostrar pausadas" check lives in local storage, like `mostrar-completadas.ts`.
- **Gate**: `node scripts/gate.ts ui`

## cleaner · architect · hardener · qa

They work on everything the feature changed (`git diff $(git merge-base v2 HEAD)`); they need no section of their own unless the specifier leaves a note for them here.

## Log

- L1 (2026-10-28): the user's original request did not reach the specifier; the spec (commit `3eb56a5`, «Especificar pausar y reanudar tareas periódicas» (translation: «Specify pausing and resuming recurring tasks»)) and the decisions D1–D6 reflect it. Request from the orchestrator for this package: «docs/pipeline/paquetes/pause.md — docs/spec.md §4.1 (pausada, reanudadaEn), §5.8, §6.1 (Mostrar pausadas), §6.2 (Pausar/Reanudar), §7. Gherkin: features/pause-task.feature, reanudar-tarea.feature, mostrar-pausadas.feature. QA: qa/pause.md.»
