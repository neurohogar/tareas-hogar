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

Decisions taken in layer A (2026-11-16):

- `limpiezas` is `cleanups`: the module (`cleanups.ts`) decides which orphan completions, orphan annotations and broken label references are cleaned and retried, so it is a set of cleanups, not cleaning in general.
- `fecha límite` is `dueDate` (the optional day of a one-off task); `plazos` is `deadlines` (the instants at which a recurring task with a schedule becomes available, overdue or waiting). They are different concepts, so they keep different words.
- `vigente` is `active` (`activePostponement`, `activeFilter`).
- `ventana` is `timeWindow` and `Ventana` is `TimeWindow`, not `window`: `check:arch` forbids the `window` global in the core and matches the bare word. `documento` is `doc` for the same reason (`document`).
- `tipo` is `kind`, `forma` is `shape`, `modo` is `mode`, `cada` is `every`, `unidad` is `unit`, `diasSemana` is `weekdays`, `diasMes` is `monthDays`. Their stored values (`'periodica'`, `'relativo'`, `'dias'`, `'lunes'`, ...) stay Spanish.
- Property keys that act as string literals (`'x' in value`, `toHaveProperty('x')`, `Pick<T, 'x'>`, `keyof` positions and the field lists in `editing`) follow the renamed property. They are the only literal differences besides test titles.
- `describe`/`it` titles and internal error messages are still Spanish after layer A; they are translated with the comments in layer D.

Decisions taken in layer B (2026-11-16):

- `huella` is `fingerprint` (`notoFingerprint`, `__FONT_FINGERPRINTS__`); `juego` (a font and its files) is `FontSet`; `ventana` in the panel's Desde/Hasta rows is `WindowRow` / `windowRows`, while the core's `TimeWindow` keeps its name; `Cuándo` (panel section) is `WhenSection`.
- Handlers that start with `al` are `on...` (`alElegir` is `onChoose`, `alIrse` is `onLeave`); `tocar` is `tap` (`tapCheckbox`, `onBackTap`); `abrir` of a task is `openTask`; `observar...` is `observe...`; `guardar...` is `save...`; `leer...` is `read...`; `limpiar...` is `clean...`.
- `Sesion` is `Session` (`useSession` replaces `laSesion`); the component that warns about unsaved changes is `UnsavedChangesNotice` (not `ChangesNotice`, which is the core type); the four screens are `Pending`, `History`, `Annotations` and `Labels`.
- The `*Doc` types and the mapping keys in `repository.ts` and `annotations.ts` keep the stored Spanish names (D3). Their functions are `taskToDoc` / `taskFromSnapshot`, `completionToDoc` / `completionFromSnapshot`, `labelToDoc` / `labelFromSnapshot`, `annotationToDoc` / `annotationFromSnapshot`, `recurrenceToDoc` / `recurrenceFromDoc` and `timeWindowToDoc` / `timeWindowFromDoc`. A persistence harness (a throwaway vitest file that mocks `firebase/firestore` and compares every read and write against a snapshot taken from the pre-migration code) proved the stored format is unchanged.
- Internal DOM names are English: CSS classes (`fila` is `row`, `caja` is `box`, `fondo` is `backdrop`, `hoja` is `sheet`, `oculto` is `visually-hidden`), element ids (`campo-titulo` is `field-title`, `error-horario` is `error-schedule`, `pantalla-de-carga` is `loading-screen`), CSS custom properties (`--fondo` is `--page-background`, `--texto` is `--text`, `--etiqueta-gris` is `--label-gris`: the color suffix is a stored value), form control names (`titulo` is `title`, `fechaLimite` is `dueDate`), the `data-campo` attribute (now `data-field`) and the panel icon names (`reloj` is `clock`, `manana` is `tomorrow`). The e2e selectors that read them were updated in the same commit.
- Stay Spanish on purpose: string values that discriminate internal unions or come from the core (`'renombrar'`, `'pestanas'`, `'guardar'`, `'en espera'`, the keys of `NAME_MESSAGES` and of the section and screen records), the `data-field` values (visible field names), the `static/fuentes` folder (a public path), localStorage keys, the cache name and the route directories.

Decisions taken in layer C (2026-11-18):

- Identifiers in `e2e/`, `tests/`, `scripts/check-arch.ts` and the `acceptance/` infrastructure (oracle, step handlers, world) follow the same glossary as layers A and B. Words that do not appear in the glossary take the plain English word (`pantalla` is `screen` in e2e helpers but `screenName` where it names a screen, `proceso` is `child`, `tope` is `cap`, `sembrar` is `seed`, `regar` is `water`, `caso` is `testCase`). Words that would collide with a reserved word or a browser global get a qualified name (`borrar` is `remove`, `nueva` is `fresh`, `paquete` is `pkg`, `suceso` is `incident`, `historia` is `historyView`).
- File names: `e2e/` (`anotacion.spec.ts` is `annotation.spec.ts`, `apoyo.ts` is `support.ts`, `fuente-apoyo.ts` is `font-support.ts`, `pantalla-apoyo.ts` is `screen-support.ts`, `versiones-apoyo.ts` is `versions-support.ts`, `pasos-de-a-uno` is `one-step-at-a-time`, `estado-sin-culpa` is `guilt-free-status`, `navegacion-encima` is `navigation-on-top`, and the rest by glossary), `tests/` (`captura` is `capture`, `escenas` is `scenes`, `progreso` is `progress`), `acceptance/oracle-*` (`anotaciones` annotations, `edicion` editing, `historial` history, `pantalla-de-carga` loading-screen, `texto-de-fecha` date-text) and `acceptance/steps/*` (by glossary; `pasos.ts` is `steps.ts`, `limpiezas.ts` is `cleanups.ts`, `texto-de-fila.ts` is `row-text.ts`, `valores.ts` is `values.ts`). `acceptance/steps/index.ts`, `world.ts`, `checkbox.ts`, `equivalence.ts` and `ir.ts` keep their names. The Gherkin feature files and `acceptance/generated/` keep their Spanish names (phase 3).
- `playwright.config.ts` keeps matching the offline suites by their new names (`pwa-offline`, `panel-mobile-offline`, `bundled-font-offline`, `portrait-orientation`).
- Stay Spanish on purpose: (No longer Spanish: the export `bdd-pipeline` loads through `acceptance.equivalenceModule` is now `isEquivalent`, and the tool falls back to `esEquivalente`; the tracking-file keys that `tests/scripts/progress.test.ts` writes are `start` and `lastUpdate`, and the tool still reads the legacy `inicio` and `ultimaNovedad`.) Firestore field and collection names read or written through the emulator REST API in `e2e/`; record keys and union members that are stored values (`'puntual'`, `'periodica'`, `'semanal'`, `'mensual'`) or visible button and field names (`Título`, `Nota`, `Pausar`, `Reanudar`, `Posponer`, `Banderas`, `Intervalo`); and the oracle's own `tipo`, `limite` and `recurrencia` doc keys that mirror the stored shape.
- `tests/scripts/*` already fail on the base commit (they call `scripts/gate.ts`, which no longer exists); they are not part of any gate and were left as they are.

Decisions taken after layer D (2026-11-18): internal string-union values that the person never sees or hears:

- `ActionEffect`: `'acts'`, `'opensActionNotice'`, `'asksDeleteConfirmation'`.
- `OnTop`: `'nothing'`, `'closeNotice'`, `'actionNotice'`, `'deleteConfirmation'`, `'emojiPicker'`, `'annotateBox'`, `'undoNotice'`. `BackEffect`: `'closesKeyboard'`, `'closesTopLayer'`. `CloseEffect`: `'closesPanel'`, `'opensCloseNotice'`.
- `ScheduleError`: `'incomplete'`, `'endNotAfterStart'`, `'overlapping'`, `'severalInHours'` (the keys of `SCHEDULE_ERRORS` in `WhenSection` follow; their messages are app text).
- `CharacterFont`: `'systemFont'`, `'deviceEmoji'` (the two font names stay as they are).
- `PanelPresentation`: `'tabs'`, `'sections'`. `PanelMode`: `'create'`, `'edit'`.
- `AuthResponse`: `'waiting'`, `'signedIn'`, `'signedOut'`. `FontStatus`: `'ready'`, `'saved'`, `'unsaved'`, `'failed'`.
- `AppEvent`: `'connectionBack'`, `'dataChanged'`, `'timePasses'`.
- `CheckboxAction` and `DoneAction` kinds: `'complete'`, `'remove'`, `'none'`, `'advance'`.
- The step handlers that read Gherkin text (`cleanups`, `font`, `panel-tabs`, `unsaved-changes`, `create`, `loading-screen`) map the unchanged step text to the new values; the oracle keeps its own vocabulary, which mirrors the step text.
- Kept Spanish on purpose: `Status` kinds (`'pendiente'`, `'atrasada'`, `'en espera'`, `'completada'`, `'pausada'`, shown as status text and compared by tests), `Unit`, `PostponeOption`, `PanelAction` and the `'borrar tarea'` action name (names on visible buttons), `RepetitionOption` and `kind`/`mode` task values (stored), `Sense`, `CurrentScreen`, `AnnotationScreen`, `DateVerb`, `PanelSection` and `FieldWithError` (visible names or text), `DAYS_ERRORS` keys such as `faltan` (not touched here).

## Phase 4 rules (2026-11-20): prose documents

Applies to `docs/spec.md`, `qa/*.md`, `docs/pipeline/paquetes/*.md`, `.claude/agents/*.md`, `CLAUDE.md`, `README.md` and `docs/pipeline/*.md`. `docs/research/` and `docs/v3/` are the author's working notes and stay as they are (to be decided later).

- **Renames done.** Features, QA procedures and packages already have English file names (commit `1717af2`); every `features/…`, `qa/…` and `paquetes/…` path reference was updated mechanically. Prose still has to name them by the new names.
- **Keep what the person sees, in Spanish and exactly as is.** Button, tab, screen, field and section names, notices, placeholders, error messages and any other text rendered by the app stay in Spanish, inside quotes or `«»`, character for character (`«Pendientes»`, `«Mostrar completadas»`, `«Pausar»`). Write the sentence around them in English (`the «Pendientes» screen`, `the «Deshacer» button`). The in-app text is found in `src/` and `e2e/`: when unsure, grep it there.
- **Keep stored values and names.** Firestore collection, field and stored-value names (`tareas`, `completados`, `periodica`, `rapida`, `'en espera'`, ...) stay as they are, in code font.
- **Terminology.** Use the glossary above, one term per concept. Status names that the person sees (`pendiente`, `atrasada`, `en espera`, `completada`, `pausada`) stay Spanish in quotes when they are the visible text; in running prose use `pending`, `overdue`, `waiting`, `completed`, `paused`.
- **Structure does not change.** Same headings in the same order (translated), same numbering (`§4.1`, `S1`, `D3`, `Flow 2`), same lists and tables. Do not add, drop, merge or reword rules; this is a translation, not an edit. Section references such as `§5.3` keep working because numbers do not move.
- **Pipeline markers.** In packages use the English markers `## Specs`, `## Decisions`, `## Artifacts`, `## Log`, `**Allowed edits**` (the tool accepts both; see `src/marcadores.ts` in `bdd-pipeline`). `L1` stays `L1`. Role names and the `By <role>.` commit line do not change.
- **Verbatim user words.** Entries that quote what the user said (`L1`, decisions marked as the user's) keep the user's original Spanish inside `«»`, followed by ` (translation: «…»)`.
- **QA procedures.** `Flujo N` is `Flow N`. The e2e spec for each procedure (same base name under `e2e/`) renames its `Flujo N` titles to `Flow N` in the same pass; titles inside `describe`/`test` that mention the procedure follow. Nothing else in the e2e specs changes.
- **Spec quotes in packages.** Every `S#` in a package quotes `docs/spec.md` verbatim between `«»`. Packages are translated after the spec and copy the quote from the translated spec, never retranslate it.
- **Neutral English.** No slang, no Rioplatense forms, plain short sentences. Keep the author's meaning, including hedges and "out of scope" lists.

## Adapter and UI file names

Adapters: `anotaciones` annotations, `atras` back, `conexion` connection, `confirmacion-al-salir` confirm-on-leave, `fuentes` fonts, `mostrar-completadas` show-completed, `mostrar-pausadas` show-paused, `pantalla-de-carga` loading-screen, `portapapeles` clipboard, `recientes` recents, `reloj` clock, `repositorio` repository, `teclado` keyboard (`auth`, `firebase` and `ids` keep their names).

UI: `AnotarConfirmacion` AnnotateConfirmation, `Anotar` Annotate, `Anotaciones` Annotations, `AvisoDeCambios` UnsavedChangesNotice, `AvisoDeshacer` UndoNotice, `BarraDePestanas` TabBar, `CampoEtiquetas` LabelsField, `ChipEtiqueta` LabelChip, `Etiquetas` Labels, `FilaTarea` TaskRow, `FranjaSinConexion` NoConnectionStrip, `Historial` History, `iconos/Icono` icons/Icon, `MarcoDeSeccion` SectionFrame, `Navegacion` Navigation, `PanelTarea` TaskPanel, `PantallaDeCarga` LoadingScreen, `Pendientes` Pending, `SeccionAcciones` ActionsSection, `SeccionCuando` WhenSection, `SeccionTarea` TaskSection, `SelectorEmoji` EmojiPicker, `Sesion` Session, `sesion.ts` session.ts, `en-linea.svelte.ts` online.svelte.ts, `mensajes-de-etiqueta.ts` label-messages.ts, `estilos.css` styles.css (`Login` keeps its name).

## Core file names

`accion-del-panel` panel-action, `anotacion(es)` annotation(s), `aviso` notice, `borrado` deletion, `cambios-sin-guardar` unsaved-changes, `campos-de-texto` text-fields, `completados` completions, `conexion` connection, `creacion` creation, `crear-periodica-calendario` create-recurring-calendar, `crear-periodica-relativa` create-recurring-relative, `crear-puntual` create-one-off, `datos-de-tarea` task-data, `dias` days, `documento-de-tarea` task-document, `edicion` editing, `esfuerzo` effort, `estado` status, `etiqueta` label, `fechas-en-texto` dates-in-text, `historial` history, `horario` schedule, `nombre-de-tarea` task-name, `ocurrencias` occurrences, `orden-de-pendientes` pending-order, `paso-actual` current-step, `pasos` steps, `pausa` pause, `pendientes` pending, `posposicion` postponement, `primer-paso` first-step, `tarea` task, `texto-de-fecha` date-text, `texto-libre` free-text, `urgencia` urgency, `version-minima` minimal-version. The `.test.ts` and `.props.test.ts` files follow their source. The full list is produced by the rename script from this glossary.

## Order of work (phase 2)

Layers, each with its own gates and commits, leaves of the import graph first so `tsc` stays green:

- **A.** Core and the TypeScript imports of `acceptance/`; `tests/hardening/`.
- **B.** Adapters (with the explicit boundary mapping of D3), UI components and routes.
- **C.** `e2e/`, `scripts/` (`check-arch.ts` paths) and `tests/`.
- **D.** Comments (about 2900 lines), in parallel by directory.

Renaming files or functions invalidates the mutation manifests in `.metrics/` (they are keyed by path and function id), so the core modules are mutated again after layer A. `check-arch` lists oracle files by path and `playwright.config.ts` has a literal e2e file regex: both are updated with the renames. Before starting, freeze a list of the visible literals and compare it at the end, as the defense against translating app text by mistake.
