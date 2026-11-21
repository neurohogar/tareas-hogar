# Package: annotation

A two-tap gesture, always in the same place, to note «me sirvió» or «me molestó» with the context taken automatically and an optional line of text; and a fourth tab, **Anotaciones**, to reread one's own annotations, correct their text, delete them and copy them all as text.

## Specs

- **S1** (§2): «Annotations «me sirvió / me molestó» with a two-tap gesture, and a screen to reread them, correct their text, delete them and copy them (§5.10, §6.7).»
- **S2** (§3): «| **Annotation** | Record of «me sirvió» or «me molestó» with its context and an optional line of text (§4.5). It is not the **note** of a task (§4.1). |»
- **S3** (§4.5): «| `sentido` | `Me sirvió` \| `Me molestó` | yes | With that literal text. |»
- **S4** (§4.5): «| `pantalla` | `Pendientes` \| `Historial` \| `Etiquetas` \| `Anotaciones` \| `Panel de edición` | yes | Where the person was (§5.10). |»
- **S5** (§4.5): «| `tareaId` | id | no | Reference to the task, if there is one (§5.10). Its name is not copied: the current name is shown. |»
- **S6** (§4.5): «**Text**: a single line, with no line breaks and no maximum length. On save, spaces at the start and at the end are trimmed. Empty or only spaces means **no text** (the field is not saved). A text is never invalid.»
- **S7** (§4.5): «An annotation does not store the active filters, the tab of the panel or mood scales. Only the text can be changed afterwards (§6.7); the sense, `anotadaEn`, the screen and the task stay fixed.»
- **S8** (§5.10): «**Where**: a small button **Anotar**, at the top, always in the same place, in Pendientes, Historial, Etiquetas, Anotaciones and the edit panel (when creating and when editing), on the phone and on wide screens. With a session started; it is not on the sign-in screen (§6.5) or on the loading screen (§6.6). There is no setting to hide it.»
- **S9** (§5.10): «**The two taps**: the first opens a box with the text field (one line, optional) and the two sense buttons, **Me sirvió** and **Me molestó**; the second, tapping a sense, saves the annotation with the written text (§4.5) and closes the box. The person does not choose or correct the context.»
- **S10** (§5.10): «`pantalla` = the **Panel de edición** if the panel is open (when creating or when editing), over any screen; if not, the screen where it is: Pendientes, Historial, Etiquetas or Anotaciones.»
- **S11** (§5.10): «`tareaId`: if the panel is open when **editing** a task, that task; if not, if the undo notice (§5.4) is visible, the task it names; if not, none. With the panel open when **creating** there is no task, and with the panel open the task of the panel prevails even if there is a visible undo notice.»
- **S12** (§5.10): «**It does not touch the task or the panel**: annotating is not a change for **Unsaved changes** (§6.2), it does not close the panel, it does not change tab and it does not open any action notice.»
- **S13** (§5.10): «**Closing without annotating**: **Back** closes the box (§6.2, Back); closing it without choosing a sense discards the written text without asking, and saves nothing.»
- **S14** (§5.10): «**Confirmation**: when saved, a brief, informative text, «Anotación guardada», without buttons, that goes away by itself and does not cover the undo notice (§5.4).»
- **S15** (§5.10): «**It is never requested**: there are no notices, reminders, counters or «sin anotar» marks, and the gesture does not change its look according to how many annotations there are.»
- **S16** (§5.10): «**Deleting a task** also deletes its annotations, in the same deletion as its completions (§6.2, §7). An annotation whose task no longer exists is not shown or copied and the app cleans it up when it detects it (§7). Annotations without a task are not affected.»
- **S17** (§6): «**Navigation**: a fixed bar with four tabs, in this order: **Pendientes** (route `/`), **Historial** (route `/historial`), **Etiquetas** (route `/etiquetas`) and **Anotaciones** (route `/anotaciones`), with no counter or mark of new annotations. The tab of the current screen is shown as selected.»
- **S18** (§6.2): «When a task is deleted **all its completions are also deleted** (and only its own), so they disappear from the history, and **all its annotations** (and only its own, §5.10), which disappear from the Anotaciones screen.»
- **S19** (§6.2): «the **Anotar** box (§5.10) closes without annotating.»
- **S20** (§6.2): «With the panel closed, **Back** does what it does today: closing the panel with the **X**, with **Guardar** or with an action does not leave an extra **Back** that does nothing, and **Forward** does not reopen a panel. The dialogs of Historial and Etiquetas (§6.3, §6.4) do not change with this feature. With the panel closed and the **Anotar** box open, **Back** closes it and does not leave the screen where it is.»
- **S21** (§6.7): «List of all the annotations with an existing task or without a task, from the most recent to the oldest by `anotadaEn` (if two have the same, the one with the smaller `id` first), grouped by **local day** with the same headers as the Historial (§6.3: **Hoy**, **Ayer**, «martes 14 de julio»).»
- **S22** (§6.7): «Each annotation shows the time `HH:MM`, the sense, the screen, the **current name** of the task if there is one (emoji and title, §4.1; the annotation does not store the name) and the text if there is one.»
- **S23** (§6.7): «It does not show the orphan annotations (§7) or those of deleted tasks (§6.2).»
- **S24** (§6.7): «Without annotations, it shows the text "Todavía no hay anotaciones".»
- **S25** (§6.7): «**Editing text**: each annotation has the action **Editar texto**, which changes only the text with the rules of §4.5 (emptying it leaves it without text). The sense, `anotadaEn`, the screen and the task do not change.»
- **S26** (§6.7): «**Deleting**: each annotation has the action **Borrar**. It asks for confirmation in a dialog with **Borrar** and **Cancelar**; Cancelar changes nothing.»
- **S27** (§6.7): «**Copying**: a single button **Copiar** copies as text all the annotations that the screen shows, and works offline. The text has one line per annotation, from the oldest to the most recent (if they tie, the one with the smaller `id` first), with date and time, sense, screen, current name of the task and text, separated by « · »; the name of the task and the text only if there are any. Example: `2026-07-15 08:05 · Me sirvió · Pendientes · 🌱 Regar · quedó lindo`, and without task or text: `2026-07-15 09:10 · Me molestó · Historial`. Without annotations there is nothing to copy. On copying, a brief, informative text («Anotaciones copiadas»), without buttons, that goes away by itself.»
- **S28** (§7): «`users/{uid}/anotaciones/{anotacionId}`»
- **S29** (§7): «Annotations: they are independent documents with an id generated on the client, so **an annotation is never lost** even if two devices annotate offline. They work offline and sync like the completions. The text is a field like those of a task: if two devices edit it, **the last change wins**. **Deleting wins over editing**: an edit of an already deleted annotation does not revive it.»
- **S30** (§7): «**Annotations of a deleted task**: they are deleted in that same `writeBatch`. If another device, offline, annotates on a task that was already deleted, an orphan annotation remains: the Anotaciones screen and **Copiar** ignore it, and the app cleans it up when it detects it, like an orphan completion.»

## Decisions

- D1 (2026-11-12, analyst): the entity and the screen are called **anotación** / **Anotaciones**, not «nota». Because «nota» is already a field of the task (§4.1, §6.2) and using the same word for two things is confusing in the UI and in the spec.
- D2 (2026-11-12, analyst): an annotation stores the sense (**Me sirvió** or **Me molestó**, with that literal text), the instant (date and time, like `completadoEn`), the screen and, if there is one, the task (as a reference to the task, without copying its name: D18), and the optional text. Nothing else: no active filters, no tab of the panel, no scales. Because the request names exactly that context and avoids mood scales (`tea §6`).
- D3 (2026-11-12, analyst): the context is taken by the app and the person neither chooses nor corrects it when annotating. Because the request says «contexto tomado solo» (translation: «context taken automatically») and choosing it adds taps.
- D4 (2026-11-12, analyst): the text is a single line (no line breaks), with no maximum length; spaces at the start and at the end are trimmed, and empty or only spaces means no text. It is never invalid. Because the request says «una línea de texto opcional» (translation: «an optional line of text») and it is the same trimming rule as the note of the task (§4.1).
- D5 (2026-11-12, analyst): annotations are stored in the account (Firestore, under `users/{uid}`), are synced between devices and work offline, like the completions: each one is an independent document with an id generated on the client, so two offline devices never lose one. Because the request only forbids sending something **outside** the account, and the plan reads «el dato que la función ya guarda en la cuenta» (translation: «the data the feature already stores in the account»).
- D6 (2026-11-12, analyst): the app never asks for an annotation: no notices, reminders, counters or «sin anotar» marks, and the gesture does not change its look according to how many there are. Because the request puts it under «Evitar» (translation: «Avoid») and rules 1 and 2 of the plan forbid counters.
- D7 (2026-11-12, analyst): the gesture has no setting to hide it and is available with a session started on all the screens of the app (Pendientes, Historial, Etiquetas, Anotaciones and the edit panel), on the phone and on wide screens; it is not on the sign-in screen or on the loading screen. Because «siempre en el mismo lugar» (translation: «always in the same place») asks for it to be everywhere, using it is already optional (rule 4) and without a session there is no account to store it in.
- D8 (2026-11-12, analyst): annotating does not touch the task or the panel: it does not count as a change for **Unsaved changes**, it does not close the panel or change tab, and it does not open any action notice. Because an annotation is not a field of the task.
- D9 (2026-11-12, analyst): if the gesture is open (half-annotated), **Back** closes it without annotating, like anything open on top (§6.2, Back), and closing it without choosing a sense discards the written text without asking. Because it is a single line and asking for confirmation for it costs more than rewriting it.
- D10 (2026-11-12, analyst): when saved, the app confirms it with a brief, informative text («Anotación guardada»), without buttons, that goes away by itself and does not cover the undo notice (§5.4). Because rule 5 of the plan asks to describe facts without congratulating, and without confirmation there is no way to know whether the second tap counted.
- D11 (2026-11-12, analyst): «pantalla» takes one of these values: Pendientes, Historial, Etiquetas, Anotaciones, or **Panel de edición** (when creating or when editing) if the panel is open, over any screen. Because they are the screens of §6 and the panel is where a task is being looked at.
- D12 (2026-11-12, analyst): the Anotaciones screen lists the annotations from the most recent to the oldest, grouped by local day with the same headers as the Historial (§6.3: Hoy, Ayer, «martes 14 de julio»); each one shows the time `HH:MM`, the sense, the screen, the current name of the task if there is one (§4.1, D18) and the text if there is one. Without annotations it shows «Todavía no hay anotaciones». Because it is the same way of rereading that the person already knows from the Historial.
- D13 (2026-11-12, analyst): the copied text has one line per annotation, from the oldest to the most recent, with date and time (`2026-07-15 08:05`), sense, screen, current name of the task and text (the last two only if there are any), separated by « · ». Because it is meant to be pasted into a review outside the app, where it is read in chronological order and edited by hand.
- D14 (2026-11-12, user, where the gesture lives): «Botón chico arriba (Recomendado)» (translation: «Small button at the top (Recommended)»)
- D15 (2026-11-12, user, what the two taps are like): «Recuadro con sentido y texto (Recomendado)» (translation: «Box with sense and text (Recommended)»)
- D16 (2026-11-12, user, when there is a task in the context): «Panel abierto o aviso de deshacer (Recomendado)» (translation: «Open panel or undo notice (Recommended)»)
- D17 (2026-11-12, user, how Anotaciones is reached): «Cuarta pestaña» (translation: «Fourth tab»)
- D18 (2026-11-12, user, name of the task and what happens if it is deleted): «Nombre actual, se borra con la tarea» (translation: «Current name, deleted with the task»)
- D19 (2026-11-12, user, delete or edit): «Borrar y editar el texto» (translation: «Delete and edit the text»)
- D20 (2026-11-12, user, what «copiar como texto» copies): «Todas, un solo botón (Recomendado)» (translation: «All of them, a single button (Recommended)»)
- D21 (2026-11-12, analyst): by D17, the navigation bar (§6) becomes four tabs: **Pendientes**, **Historial**, **Etiquetas** and **Anotaciones** (route `/anotaciones`), in that order, with no counter or mark of new annotations. Because the new tab is added at the end without moving the ones already known, and D6 forbids counters.
- D22 (2026-11-12, analyst): by D18, the annotation stores a reference to the task and not its name; deleting a task also deletes its annotations, in the same deletion as its completions (§6.2, §7). An annotation whose task no longer exists (another offline device annotated on an already deleted task) is not shown or copied and the app cleans it up when it detects it, like an orphan completion (§7). Annotations without a task are not affected. Because it is the same rule as the completions, which the user chose as the model.
- D23 (2026-11-12, analyst): by D19, each annotation of the Anotaciones screen has **Editar texto** and **Borrar**. Editing changes only the text, with the rules of D4 (emptying it leaves it without text); the sense, the instant, the screen and the task do not change. Deleting asks for confirmation, with **Borrar** and **Cancelar**, as in the Historial (§6.3). If two devices edit the text, the last change wins, like the fields of a task (§7); deleting wins over editing (§7, the deletion wins). This replaces what was said in question P6 that what is annotated «no se reescribe» (translation: «is not rewritten»): with D19, only the context stays fixed.
- D24 (2026-11-12, analyst): by D20, **Copiar** is on the Anotaciones screen, copies all the annotations that the screen shows with the format of D13 and works offline; without annotations there is nothing to copy. The app confirms the copy with a brief, informative text, like D10. Because it is the only button of the screen and what is copied does not leave the account until the person pastes it.

## Artifacts

- Gherkin: `features/anotar.feature` (S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S19, S20, S28, S29), `features/anotaciones.feature` (S5, S17, S21, S22, S23, S24, S29), `features/copiar-anotaciones.feature` (S27), `features/editar-anotacion.feature` (S6, S7, S25, S29), `features/borrar-anotacion.feature` (S26), `features/anotaciones-de-tarea-borrada.feature` (S16, S18, S23, S30); QA-only (in those features their header says so): S1, S8, S13, S14, S15, S17, S19, S20, S24, S28
- QA: `qa/anotacion.md`

## core

- **Allowed edits**: `src/lib/core/anotacion*.ts` (new files: the annotation, the context when annotating, the grouped list and the copied text), `src/lib/core/*.test.ts` (all core tests), `src/lib/core/borrado.ts`, `src/lib/core/fechas-en-texto.ts`, `src/lib/core/atras-del-panel.ts`
- **Rules**: S2, S3, S4, S5, S6, S7, S9, S10, S11, S16, S18, S21, S22, S23, S25, S27, S29, S30 (S12: annotating is not a change of the panel; S13, S19, S20: `atras-del-panel.ts` adds the Anotar box to what Back closes by itself, without touching the panel)
- **Reuses**:
  - `encabezadoDelDia` and `horaEnTexto` (`fechas-en-texto.ts`) for the headers «Hoy», «Ayer» and the date and the time `HH:MM`, and `compararIds` (`comparar-ids.ts`) for the tie-break by `id`; the copied text also needs the date `AAAA-MM-DD HH:MM`, which is added in `fechas-en-texto.ts`.
  - `nombreDeTarea` (`nombre-de-tarea.ts`) for the current name (emoji and title) of the task.
  - `avisoVisible` (`aviso.ts`) to know whether the undo notice is visible when annotating (`completadoEn <= ahora < completadoEn + 5 s`); the annotation takes `tareaId` from the notice only if it is visible.
  - `normalizarNota` (`nota.ts`) has the same trimming rule; a single line without line breaks and without maximum length.
  - `borrado` and `completadosHuerfanos` (`borrado.ts`) are the model: `Borrado` adds the ids of the annotations of the task, and the orphan annotations are detected with `existeTarea`, like the orphan completions.
  - `historial` (`historial.ts`) is the model for grouping by local day; it is not modified.
- **Notes**: the exported signatures that `acceptance/` and the UI already use (`borrado`, `completadosHuerfanos`, `existeTarea`, `queHaceAtras`, `encabezadoDelDia`, `horaEnTexto`) stay compatible: only new optional fields or parameters, because the core gate runs the already implemented acceptance.
- **Gate**: `~/Work/bdd-pipeline/bdd-pipeline gate core`

## acceptance

- **Allowed edits**: `acceptance/steps/anotacion*.ts` (new files), `acceptance/steps/index.ts`, `acceptance/steps/world.ts`, `acceptance/steps/edicion.ts` (`borro la tarea` has to delete the annotations of the task too), `acceptance/oracle*.ts`, `acceptance/equivalence.ts`, `scripts/check-arch.ts` (the manual list of oracles, if `acceptance/oracle-anotaciones.ts` is added), `docs/pipeline/pendientes.txt`
- **Features to connect**: `features/anotar.feature`, `features/anotaciones.feature`, `features/copiar-anotaciones.feature`, `features/editar-anotacion.feature`, `features/borrar-anotacion.feature`, `features/anotaciones-de-tarea-borrada.feature`
- **New steps**: (the steps that already exist and are reused: `una tarea puntual <titulo> sin fecha límite`, `... con fecha límite <limite>`, `... sin fecha límite con emoji <emoji>`, `completo la tarea <titulo> el <momento>`, `la tarea <titulo> fue completada el <momento>`, `edito el título a <titulo>`, `borro la tarea <titulo>`, `no existe la tarea <titulo>`, `no queda ningún completado de <titulo>`, `la tarea <titulo> conserva un solo completado, del <momento>`)
  - `estoy en <pantalla>` (Pendientes, Historial, Etiquetas or Anotaciones)
  - `el panel de edición está abierto al editar la tarea <titulo>` and `el panel de edición está abierto al crear una tarea`
  - `anoto <sentido> el <ahora>`, `anoto <sentido> el <ahora> con el texto <texto>`, `anoto <sentido> el <ahora> con el texto <texto> entre <espacios> espacios`, `anoto <sentido> el <ahora> con <espacios> espacios como texto` and `anoto <sentido> el <ahora> con un texto de <largo> caracteres` (the core takes the context from where the person is, the panel and the undo notice)
  - `otro dispositivo, sin ver ese cambio, anota <sentido> en <pantalla> el <ahora>` and `otro dispositivo, sin ver ese cambio, anota <sentido> en <pantalla> el <ahora> sobre la tarea <titulo>`
  - `una anotación <sentido> en <pantalla> del <anotada>`, and those that describe the last declared annotation: `la anotación se refiere a la tarea <titulo>`, `la anotación dice <texto>` and `la anotación se registró con id <id>`
  - `queda una sola anotación`, `quedan <cantidad> anotaciones`, `no queda ninguna anotación` and `no existe la anotación del <anotada>`
  - `la anotación del <anotada> tiene sentido <sentido> en <pantalla>`, `la anotación del <anotada> es de la tarea <titulo>`, `la anotación del <anotada> no es de ninguna tarea`, `la anotación del <anotada> dice <texto>`, `la anotación del <anotada> dice un texto de <largo> caracteres` and `la anotación del <anotada> no tiene texto`
  - `el panel sigue abierto sin cambios sin guardar`
  - `consulto Anotaciones el <ahora>`, `Anotaciones muestra <anotaciones>` (groups separated by "; " as `<encabezado>: <anotaciones>`, annotations separated by ", ", parts separated by " · ") and `Anotaciones está vacía`
  - `copio las anotaciones`, `el texto copiado tiene las líneas <lineas>` (lines separated by "; ") and `no hay nada para copiar`
  - `edito el texto de la anotación del <anotada> a <texto>`, `edito el texto de la anotación del <anotada> a <texto> entre <espacios> espacios`, `edito el texto de la anotación del <anotada> a <espacios> espacios` and `otro dispositivo, sin ver ese cambio, edita el texto de la anotación del <anotada> a <texto>`
  - `borro la anotación del <anotada>` and `otro dispositivo, sin ver ese cambio, borra la anotación del <anotada>`
  - `las anotaciones huérfanas a limpiar son solo la del <anotada>`
- **Notes**: an annotation is identified in the steps by the instant `anotadaEn` (different in each annotation of a scenario, except in the tie scenarios, which identify them by `id`); the text of `<espacios>` is `<espacios>` space characters, and `<largo>` characters is a text of that length; the Examples of `Anotaciones muestra` and `el texto copiado` come from the spec (§6.7). A step `borro la tarea` already exists: it has to delete the annotations of that task too, and only its own.
- **Gate**: `~/Work/bdd-pipeline/bdd-pipeline gate acceptance`

## ui

- **Allowed edits**: `src/lib/ui/Anotar*.svelte` and `src/lib/ui/Anotaciones*.svelte` (new files: the button with its box and the screen), `src/routes/anotaciones/+page.svelte` (new), `src/lib/ui/Navegacion.svelte`, `src/lib/ui/Sesion.svelte`, `src/lib/ui/sesion.ts`, `src/lib/ui/PanelTarea.svelte`, `src/lib/ui/Pendientes.svelte`, `src/lib/ui/estilos.css`, `src/lib/adapters/repositorio.ts`, `src/lib/adapters/atras.ts`, `src/lib/adapters/anotaciones*.ts` and `src/lib/adapters/portapapeles*.ts` (new files)
- **Visible behavior**: `qa/anotacion.md`
- **Notes**: the annotations live in `users/{uid}/anotaciones/{anotacionId}` (S28) with an id generated on the client; `firestore.rules` already covers `users/{uid}/**` and does not change. Deleting a task deletes its annotations in the same `writeBatch` (`borrarTarea` in `repositorio.ts`); the orphan annotations are cleaned up like the orphan completions in `Sesion.svelte`. The **Anotar** button is mounted inside the session (it does not exist on the sign-in screen or on the loading screen) and stays in the same place on all the screens.
- **Gate**: `~/Work/bdd-pipeline/bdd-pipeline gate ui`

## cleaner · architect · hardener · qa

They work on everything the feature changed (`git diff <feature base>`, recorded in `tmp/base-de-feature`); they need no section of their own unless the gherkin-writer leaves a note for them here.

## Log

- L1 (2026-11-12): the user's original request, verbatim (the original words are in Spanish; below it, its translation):

  ### E1. Anotación «me sirvió / me molestó»

  - **Problema y persona.** Todas. El plan descansa en inferencias; sin un registro barato de qué funciona, se evalúa de memoria.
  - **Evidencia.** `aacc H1` (fuerte en que la base es escasa); `aacc H12` (moderada: la tecnología para TDAH se diseña sin sus usuarios); `tea`, pregunta abierta 7.
  - **Qué propone.** Un gesto de dos toques, siempre en el mismo lugar: sentido, contexto tomado solo (pantalla y, si la hay, tarea), fecha y una línea de texto opcional. Una pantalla para releer las notas propias y copiarlas como texto.
  - **Hipótesis y validación.** Un gesto así de corto se usa de forma espontánea lo suficiente como para decidir. Cero notas a las cuatro semanas significa que es caro o está escondido.
  - **Evitar.** Que la app pida opinión: es una queja repetida en apps del rubro (`hogar` Parte B, Tiimo; anecdótica). Escalas de ánimo (`tea §6`, moderada). Enviar algo fuera de la cuenta. En la etapa 2, mostrar las notas de una persona a la otra.
  - **Depende de · Tamaño · Riesgos.** La migración · S · El silencio; se compensa con una revisión periódica fuera de la app, con las notas que cada persona decida compartir.

  (translation)

  ### E1. «Me sirvió / me molestó» annotation

  - **Problem and person.** Everyone. The plan rests on inferences; without a cheap record of what works, it is evaluated from memory.
  - **Evidence.** `aacc H1` (strong that the base is scarce); `aacc H12` (moderate: technology for ADHD is designed without its users); `tea`, open question 7.
  - **What it proposes.** A two-tap gesture, always in the same place: sense, context taken automatically (screen and, if there is one, task), date and an optional line of text. A screen to reread one's own notes and copy them as text.
  - **Hypothesis and validation.** A gesture this short is used spontaneously enough to decide. Zero notes at four weeks means it is expensive or hidden.
  - **Avoid.** The app asking for an opinion: it is a repeated complaint in apps of this kind (`hogar` Part B, Tiimo; anecdotal). Mood scales (`tea §6`, moderate). Sending something outside the account. In stage 2, showing one person's notes to the other.
  - **Depends on · Size · Risks.** The migration · S · Silence; it is compensated with a periodic review outside the app, with the notes that each person decides to share.
