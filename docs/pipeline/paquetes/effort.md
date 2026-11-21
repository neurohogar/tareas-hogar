# Package: effort

Each task can have an estimated effort (quick, medium or long), chosen in the panel and shown in the row; the "Solo rápidas" button of Pendientes shows only the quick ones. It is implemented after Pausar.

## Specs

These passages (S1–S4) no longer exist in `docs/spec.md` (effort was removed from the project); they are translated faithfully from the original spec.

- **S1** (§4.1): «| `esfuerzo` | `rapida` \| `media` \| `larga` | no | Estimated effort: quick (≤ 5 min), medium (≈ 15 min), long. Without the field, not estimated. |»
- **S2** (§6.1): «**Solo rápidas**: a toggle button "Solo rápidas" next to the label chips (it is shown even if there are no labels). When on, the list shows only the tasks with `esfuerzo` = `rapida`, in the same order; it combines with the label filter (both conditions at once) and also applies to completed and paused tasks when they are shown. If it leaves the list empty, "No hay tareas rápidas" is shown (with a label chosen, "No hay tareas con esta etiqueta"). Like the label filter: it is kept when going to another screen and coming back, and it goes back to off on reloading or opening the app.»
- **S3** (§6.1): «If the task has an effort, its level in small text: "Rápida", "Media" or "Larga". Without an effort, nothing.»
- **S4** (§6.2): «**Esfuerzo** (optional, any kind): a selector with "Sin estimar" (the initial value), "Rápida (≤ 5 min)", "Media (≈ 15 min)" and "Larga".»
- **S5** (§7): «The unit of conflict is each field of §4.1.»

## Decisions

- D1 (2026-10-28, user, how effort is estimated and used): «3 niveles + filtro (Recomendado)» (translation: «3 levels + filter (Recommended)»)

## Artifacts

- Gherkin: `features/esfuerzo-de-tarea.feature` (S1, S3, S4, S5), `features/solo-rapidas.feature` (S2)
- QA: `qa/esfuerzo.md`

## core

- **Allowed edits**: `src/lib/core/tarea.ts`, `src/lib/core/creacion.ts`, `src/lib/core/creacion.test.ts`, `src/lib/core/crear-periodica-calendario.ts`, `src/lib/core/datos-de-tarea.ts`, `src/lib/core/edicion.ts`, `src/lib/core/edicion.test.ts`, `src/lib/core/documento-de-tarea.ts`, `src/lib/core/documento-de-tarea.test.ts`, `src/lib/core/esfuerzo*.ts`, `src/lib/core/solo-rapidas*.ts`, `src/lib/core/*.test.ts`
- **Rules**: S1, S2 (which rows remain and the empty-list text; that the button is kept between screens belongs to ui), S3 (the level text), S4 (the value that each option stores; "Sin estimar" means without the field), S5
- **Reuses**:
  - `crearTarea` and `DatosComunes` (`creacion.ts`): the effort is a field common to every kind, like emoji and note; `crearSegunDatos` and `datosDeTarea` (`datos-de-tarea.ts`) remain inverses.
  - `editar` (`edicion.ts`): the effort enters the change only if it changed, and null removes it; changing the kind does not touch it (it is not a kind field).
  - `filasDePendientes` (`pendientes.ts`) and `filtrarPorEtiqueta` (`filtro-por-etiqueta.ts`): Solo rápidas filters those same rows (including the completed and the paused ones that are shown) without changing their order.
- **Notes**: the exported signatures that `acceptance/` and the UI already use remain compatible (only new optional fields and parameters).
- **Gate**: `node scripts/gate.ts core`

## acceptance

- **Allowed edits**: `acceptance/steps/esfuerzo.ts`, `acceptance/steps/index.ts`, `acceptance/steps/world.ts`, `acceptance/steps/pendientes.ts`, `acceptance/steps/edicion.ts`, `acceptance/oracle*.ts`, `acceptance/equivalence.ts`, `docs/pipeline/pendientes.txt`
- **Features to connect**: `features/esfuerzo-de-tarea.feature`, `features/solo-rapidas.feature`
- **New steps** (those of pausing, `Mostrar pausadas está encendido`, `la tarea <titulo> fue pausada` and `Pendientes muestra como pausadas <titulos>`, already exist):
  - `creo una tarea puntual con título <titulo> y esfuerzo <esfuerzo>`
  - `creo una tarea periódica relativa con título <titulo> cada <cada> <unidad> y esfuerzo <esfuerzo>`
  - `creo una tarea periódica semanal con título <titulo> los <dias> y esfuerzo <esfuerzo>`
  - `una tarea puntual sin fecha límite con esfuerzo <esfuerzo>`
  - `la tarea <titulo> tiene esfuerzo <esfuerzo>`
  - `elijo el esfuerzo <esfuerzo>`
  - `otro dispositivo, sin ver ese cambio, elige el esfuerzo <esfuerzo>`
  - `su esfuerzo es <esfuerzo>`
  - `la fila de la tarea muestra el esfuerzo <texto>` and `la fila de la tarea no muestra esfuerzo`
  - `Solo rápidas está <estado>` (on or off)
  - `Pendientes muestra el texto <texto>`
- **Notes**: changing the kind in the panel keeps the effort (`camposQueConserva` in `edicion.ts`).
- **Gate**: `node scripts/gate.ts acceptance`

## ui

- **Allowed edits**: `src/lib/ui/PanelTarea.svelte`, `src/lib/ui/FilaTarea.svelte`, `src/lib/ui/Pendientes.svelte`, `src/lib/ui/sesion.ts`, `src/lib/ui/Sesion.svelte`, `src/lib/adapters/repositorio.ts`
- **Visible behavior**: `qa/esfuerzo.md`
- **Notes**: Solo rápidas lives in the session, like the label filter (it is kept between screens and goes back to off on reload); `esfuerzo` is read and written in `repositorio.ts` as an independent field.
- **Gate**: `node scripts/gate.ts ui`

## cleaner · architect · hardener · qa

They work on everything the feature changed (`git diff $(git merge-base v2 HEAD)`); they need no section of their own unless the specifier leaves a note for them here.

## Log

- L1 (2026-10-28): the user's original request did not reach the specifier; the spec (commit `116db17`, «Especificar esfuerzo estimado y el filtro Solo rápidas» (translation: «Specify the estimated effort and the Solo rápidas filter»)) and decision D1 reflect it. Request from the orchestrator for this package: «docs/pipeline/paquetes/effort.md — §4.1 (esfuerzo), §6.1 (Solo rápidas, texto del nivel), §6.2 (selector Esfuerzo). Gherkin: esfuerzo-de-tarea, solo-rapidas. QA: qa/esfuerzo.md.» (translation: «docs/pipeline/paquetes/effort.md — §4.1 (effort), §6.1 (Solo rápidas, level text), §6.2 (Esfuerzo selector). Gherkin: esfuerzo-de-tarea, solo-rapidas. QA: qa/esfuerzo.md.»)
