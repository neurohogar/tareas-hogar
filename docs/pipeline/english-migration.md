# English migration

The project is open source, so everything except the text the person sees in the app moves from Spanish to neutral English. This document records the decisions, the glossary and the order of work. It is the contract the migration agents follow.

## Decisions

- **D1 (2026-11-16, user).** Scope: code, comments, tests, Gherkin, spec, QA procedures and pipeline documents move to neutral English. Only the text visible in the app stays in Spanish.
- **D2 (2026-11-16, user).** Phases: (1) `bdd-pipeline` and the role agents accept English markers; (2) code and comments; (3) Gherkin steps, handlers and oracle, with full re-mutation; (4) spec, QA procedures and packages. The user authorized changing `bdd-pipeline` (done in phase 1: branch `feat/english-markers`).
- **D3 (2026-11-16, user).** The persisted format does not change. Firestore field names, stored values (`'periodica'`, `'rapida'`, ...) and collection names (`tareas`, `completados`, `etiquetas`, `anotaciones`) stay as they are. The adapters translate at the boundary through explicit mappings (`tareaADoc` and `tareaDesde` and their equivalents). The `*Doc` types keep the stored names. Migrating stored data is a separate, later decision.
- **D4 (orchestrator default, to be confirmed).** Public URLs (`/anotaciones`, `/etiquetas`, `/historial`) stay in Spanish because the person sees them.
- **D5.** A literal is app text if the person ends up seeing or hearing it (text nodes, `aria-label`, `placeholder`, `title`, button names, notice and row text) or if a test compares against such text. App text is never translated. Stored values are never translated either. Everything else (identifiers, file names, `describe`/`it` titles, internal errors, comments) is translated. `Intl` collation with locale `es` is behavior and stays.
- **D6.** The Gherkin step text and the handler regexes are phase 3. In phase 2, `acceptance/` only gets its TypeScript imports and identifiers renamed.

## Form rules

`camelCase` for functions and variables, `PascalCase` for types and components, `SCREAMING_SNAKE` for constants, `kebab-case` for file names. No accents or `ñ` in identifiers. One term per concept in the whole repository.

## Glossary

| Spanish | English | Notes |
|---|---|---|
| tarea | task | |
| periódica | recurring | |
| puntual | one-off | |
| pendiente(s) | pending | |
| completada | completed | state |
| completado | completion | the record; the verb `completar` is `complete` |
| deshacer | undo | |
| atrasada | overdue | |
| en espera | waiting | |
| pospuesta / posposición | postponed / postponement | |
| pausada / pausa / reanudar | paused / pause / resume | |
| vigente | active | |
| urgencia | urgency | |
| esfuerzo | effort | values `rapida`/`media`/`larga` are stored as is; internal names `quick`/`medium`/`long` |
| soloRapidas | quickOnly | |
| etiqueta | label | |
| horario | schedule | `ventana` is `window`; `desde`/`hasta` are `from`/`to` |
| recurrencia | recurrence | `relativo` is `relative`, `calendario` is `calendar` |
| ocurrencia | occurrence | |
| plazo | deadline | |
| fecha límite | dueDate | |
| título | title | |
| nota | note | the task field |
| anotación | annotation | the separate entity (screen `/anotaciones`) |
| primer paso | firstStep | |
| pasos / pasoActual | steps / currentStep | |
| versión mínima | minimalVersion | `fueMinima` is `wasMinimal` |
| última vez | lastTime | |
| panel | panel | |
| aviso | notice | |
| cambios sin guardar | unsavedChanges | |
| historial | history | |
| fuente (tipografía) | font | |
| filtro / orden | filter / order | |
| sesión | session | |
| repositorio | repository | |

Doubtful terms (to decide when touched, with the choice recorded here): `limpiezas` (check what it does before naming it), `fecha límite` versus `plazo`, `vigente` (`active` or `current`).

## Core file names

`accion-del-panel` panel-action, `anotacion(es)` annotation(s), `aviso` notice, `borrado` deletion, `cambios-sin-guardar` unsaved-changes, `campos-de-texto` text-fields, `completados` completions, `conexion` connection, `creacion` creation, `crear-periodica-calendario` create-recurring-calendar, `crear-periodica-relativa` create-recurring-relative, `crear-puntual` create-one-off, `datos-de-tarea` task-data, `dias` days, `documento-de-tarea` task-document, `edicion` editing, `esfuerzo` effort, `estado` status, `etiqueta` label, `fechas-en-texto` dates-in-text, `historial` history, `horario` schedule, `nombre-de-tarea` task-name, `ocurrencias` occurrences, `orden-de-pendientes` pending-order, `paso-actual` current-step, `pasos` steps, `pausa` pause, `pendientes` pending, `posposicion` postponement, `primer-paso` first-step, `tarea` task, `texto-de-fecha` date-text, `texto-libre` free-text, `urgencia` urgency, `version-minima` minimal-version. The `.test.ts` and `.props.test.ts` files follow their source. The full list is produced by the rename script from this glossary.

## Order of work (phase 2)

Layers, each with its own gates and commits, leaves of the import graph first so `tsc` stays green:

- **A.** Core and the TypeScript imports of `acceptance/`; `tests/hardening/`.
- **B.** Adapters (with the explicit boundary mapping of D3), UI components and routes.
- **C.** `e2e/`, `scripts/` (`check-arch.ts` paths) and `tests/`.
- **D.** Comments (about 2900 lines), in parallel by directory.

Renaming files or functions invalidates the mutation manifests in `.metrics/` (they are keyed by path and function id), so the core modules are mutated again after layer A. `check-arch` lists oracle files by path and `playwright.config.ts` has a literal e2e file regex: both are updated with the renames. Before starting, freeze a list of the visible literals and compare it at the end, as the defense against translating app text by mistake.
