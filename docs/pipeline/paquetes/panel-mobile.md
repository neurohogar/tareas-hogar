# Package: panel-mobile

The edit panel fits on the phone screen: it is organized in tabs (Tarea, Cuándo and Acciones), takes the whole screen and keeps Guardar and Cerrar always in view. On wide screens it shows the same sections one after the other.

## Specs

- **S1** (§6.2): «Kind, chosen in **Se repite** with four options: **No se repite** (one-off: optional due date), **Intervalo** (recurring in relative mode: N + hours/days), **Días de la semana** and **Días del mes** (recurring in calendar mode).»
- **S2** (§6.2): «**Postpone** (only when editing a `pending` or `overdue` task that is not paused): the options **1 hora**, **3 horas** and **Hasta mañana** are shown directly in the panel, without an intermediate **Posponer** button (§6.2, Presentation); choosing one acts at that moment and closes the panel. If the task is postponed, the panel shows "Pospuesta hasta HH:MM" (or "hasta mañana HH:MM") and a **Quitar posponer** button, which also acts at that moment.»
- **S3** (§6.2): «**Panel presentation**: the content of the fields and actions above is organized into three sections, **Tarea**, **Cuándo** and **Acciones**. "Phone" means a screen up to **40rem** wide (inclusive); above that, wide screens. The rules of each field do not change, only where they are shown.»
- **S4** (§6.2): «**Content and order of the sections** (the same on phone and on wide screens):»
- **S5** (§6.2): «**Tarea**: at the top, "Pausada" (if applicable), "Pospuesta hasta HH:MM" (or "hasta mañana HH:MM") and **Última vez**; then the title with the emoji beside it (the emoji button next to the Título field, with **Quitar emoji** below); the note; the effort; the labels.»
- **S6** (§6.2): «**Cuándo**: first **Se repite**, with its four options in a 2x2 grid and the fields of the chosen option (due date, Cada, days); then **Solo en un horario** with its windows (**Agregar horario**, **Quitar**).»
- **S7** (§6.2): «**Acciones**: **Posponer** (the options **1 hora**, **3 horas**, **Hasta mañana** in view) or **Quitar posponer**; **Pausar** or **Reanudar**; and at the end, separated from the rest and in the error color, **Borrar tarea**. Each action appears with the conditions of §5.8, §5.9 and this section, and is updated if another device changes the task with the panel open.»
- **S8** (§6.2): «The panel takes the **whole screen**.»
- **S9** (§6.2): «The sections are **tabs** with a tab bar: Tarea, Cuándo and Acciones. It always opens on **Tarea**, when creating and when editing. Tabs are changed only by tapping them, without swiping.»
- **S10** (§6.2): «The header (with the title of the panel and the **X** to close) and the tab bar stay fixed; only the content scrolls, and each tab opens from the top.»
- **S11** (§6.2): «**Guardar** is in a fixed bar at the bottom, visible on all tabs. **Cerrar** is the **X** of the header.»
- **S12** (§6.2): «When creating a task the **Acciones** tab does not appear (there are no actions available). When editing it always appears, because **Borrar tarea** is available in every edit.»
- **S13** (§6.2): «**Wide screens** (more than 40rem): the panel has the usual width and location, without a tab bar; the three sections are shown one after the other, each with its name as a title (**Tarea**, **Cuándo**, **Acciones**) and the actions as one more section before the footer, which carries **Guardar** (fixed bar at the bottom) and the **X** of **Cerrar** in the fixed header.»
- **S14** (§6.2): «**Nothing is lost**: changing tabs or width does not lose anything of what was written, including the unconfirmed text of the Etiquetas field. **Guardar** considers all the sections (it is a single form) and only **Cerrar** discards the changes; the actions and **Cerrar** still discard the unsaved changes.»
- **S15** (§6.2): «**Errors**: a tab is marked while any of its fields shows an error, whatever its origin (on saving, or the live error of Etiquetas); the mark lasts as long as the message and is distinguished from the icon of the tab. The errors of Título and Etiquetas belong to **Tarea**; those of due date, Cada, days and schedule, to **Cuándo**.»
- **S16** (§6.2): «If **Guardar** fails, the panel jumps to the first tab with an error (**Tarea** before **Cuándo**) and the content scrolls to the first field with an error. The same holds on wide screens, where there are no tabs: it only scrolls to the first field with an error.»
- **S17** (§6.2): «**On-screen keyboard**: opening the panel does not focus any field, so the phone keyboard does not appear until one is tapped. The **Guardar** bar is hidden **only while the on-screen keyboard is open** (on any tab and width) and comes back when it closes, even if the field stays focused; a focused field without an on-screen keyboard (on the computer, or in the date and time pickers) does not hide it. The header and the tabs stay fixed. The keyboard does not change how the form is submitted: Enter in a one-line field saves, Enter in Nota adds a line and Enter in Etiquetas chooses the suggestion; if that save fails, the rules of Errors apply.»
- **S18** (§6.2): «**Icons**: the tabs **Tarea**, **Cuándo** and **Acciones** and the actions **1 hora**/**3 horas**/**Hasta mañana** (Postpone), **Quitar posponer**, **Pausar**/**Reanudar** and **Borrar tarea** carry an icon, always next to their text, at all widths. Only the **X** to close and the button to choose an emoji when there is no emoji carry an icon without visible text, and keep the accessible names «Cerrar» and «Elegir emoji». **Guardar**, **Agregar horario**, **Quitar**, **Quitar emoji**, the section titles of wide screens and the dialogs are left with text only. The icons travel with the app (§2, §7): they work offline.»
- **S19** (§6.2): «**Over the panel**: the emoji picker and the confirmation of **Borrar tarea** open over the panel, as always; on closing them it returns to the same tab. In full screen, the "Sin conexión" strip (§7) and the undo notice (§5.4, above the **Guardar** bar; with the bar hidden by the keyboard, above the keyboard) stay visible without covering the header, the tabs or **Guardar**. The notice can pass over the content during its 5 seconds.»

## Decisions

- D1 (2026-11-03, user): «Pestañas» (translation: «Tabs») (organization of the panel on the phone). Tarea, Cuándo and Acciones.
- D2 (2026-11-03, user): tabs only up to 40rem; on wider screens, all the sections one after the other without a tab bar.
- D3 (2026-11-03, user): Tarea contains Pausada, Pospuesta hasta and Última vez at the top; emoji beside the title, with Quitar emoji below; note; effort; labels. Cuándo contains Se repite first, with its options in a 2x2 grid and its fields, and then Solo en un horario and its windows. Acciones contains Posponer, or Quitar posponer; Pausar/Reanudar; and at the end, separated and in the error color, Borrar tarea.
- D4 (2026-11-03, user): in the Acciones tab, the options of Posponer (1 hora, 3 horas, Hasta mañana) go «a la vista» (translation: «in view»), without an intermediate Posponer button. Also on wide screens.
- D5 (2026-11-03, user): Guardar in a fixed bar at the bottom, visible on all tabs; Cerrar is an X in the fixed header. Also on wide screens, with the actions as one more section before the footer.
- D6 (2026-11-03, user): on the phone, the panel takes the whole screen.
- D7 (2026-11-03, user): it always opens on the Tarea tab, when creating and when editing.
- D8 (2026-11-03, user): if Guardar fails, the panel jumps to the first tab with an error (Tarea before Cuándo) and marks the tabs with an error.
- D9 (2026-11-03, user): icons always go with text, except the X and the button to choose an emoji when there is no emoji.
- D10 (2026-11-03, user): without available actions, for example when creating, the Acciones tab does not appear.
- D11 (2026-11-03, orchestrator): out of scope, they are later features already decided: unsaved changes notices, Android Back button and portrait orientation. Until then, the actions and Cerrar still discard unsaved changes as today.
- D12 (2026-11-03, analyst): «celular» (translation: «phone») is the same cut as D2: up to 40rem inclusive there are tabs and full screen; above that, sections one after the other and the panel with the width and location of today. Because D2 and D6 describe the same case and a second cut would create combinations that nobody asked for.
- D13 (2026-11-03, analyst): on wide screens each section carries as its title the name of its tab (Tarea, Cuándo, Acciones), with the same content and order as D3, including the grid of Se repite. Because D5 calls them sections and so the two presentations are the same panel.
- D14 (2026-11-03, analyst): the header and the tab bar stay fixed; only the content scrolls, and each tab opens from the top. Tabs are changed only by tapping them, without swiping. Because D5 already fixes the header, and swiping was not asked for and would compete with the scrolling of the content.
- D15 (2026-11-03, analyst): changing tabs or width does not lose anything of what was written, including the unconfirmed text of the Etiquetas field, and Guardar considers all the tabs. Because §6.2 defines a single form and only Cerrar discards changes.
- D16 (2026-11-03, analyst): a tab is marked while any of its fields shows an error, whatever its origin (on saving or the live error of Etiquetas); the mark lasts as long as the message. The errors of Título and Etiquetas belong to Tarea; those of due date, Cada, days and schedule, to Cuándo. Because D3 places those fields and the mark only points to what §6.2 already shows.
- D17 (2026-11-03, analyst): if Guardar fails, besides what D8 says, the content scrolls to the first field with an error, also on wide screens, where there are no tabs. Because D5 leaves Guardar always in view, so the error can be off screen, and §6.2 asks the panel to show it.
- D18 (2026-11-03, analyst): when editing, the Acciones tab always appears, because Borrar tarea is available in every edit (§6.2); D10 only removes it when creating. Inside it, each action follows the conditions of §5.8, §5.9 and §6.2, and is updated if another device changes the task with the panel open.
- D19 (2026-11-03, analyst): the emoji picker and the confirmation of Borrar tarea still open over the panel as today; on closing them it returns to the same tab. Because the request is about the panel and §6.2 already defines those two flows.
- D20 (2026-11-03, analyst): with full screen, the "Sin conexión" strip (§7, it is seen while there is no network) and the undo notice (§5.4, it is seen until it expires, above the Guardar bar) stay visible without covering controls. Because those rules have no exception for the panel.
- D21 (2026-11-03, analyst): opening the panel does not focus any field, so the phone keyboard does not appear until one is tapped. It is today's behavior and D7 does not ask to change it.
- D22 (2026-11-03, analyst): the X and the button to choose an emoji without visible text (D9) keep the accessible names «Cerrar» and «Elegir emoji». Because §6.2 names those buttons that way and the change is only visual.
- D23 (2026-11-03, user): question about the open keyboard and the Guardar bar: «Se oculta mientras se escribe» (translation: «It is hidden while typing»).
- D24 (2026-11-03, user): question about which elements carry an icon besides the X and the button to choose an emoji: «Pestañas y acciones» (translation: «Tabs and actions»).
- D25 (2026-11-03, analyst): D23 is the only exception to «visible» of D5: the Guardar bar is hidden only while the on-screen keyboard is open, on any tab and width, and comes back when it closes even if the field stays focused. It depends on the keyboard and not on the focus, because D23 answers the lack of room: a focused field without an on-screen keyboard, as on the computer or in the date and time pickers, does not hide the bar. The header and the tabs stay fixed (D14).
- D26 (2026-11-03, analyst): the keyboard does not change how the form is submitted: Enter in a one-line field still saves as today, Enter in Nota adds a line (§6.2) and Enter in Etiquetas chooses the suggestion. If that Guardar fails, D8 and D17 apply. Because D23 hides the bar, not the act of saving, and nobody asked to change the physical keyboard or the phone one.
- D27 (2026-11-03, analyst): it refines D20 with D23: with the bar hidden, the undo notice is seen above the keyboard, because §5.4 has no exception. «Sin tapar controles» (translation: «Without covering controls») holds for the header, the tabs and Guardar: the notice can pass over the content, which can be scrolled, during its 5 seconds, just as today it passes over the Pendientes list. The "Sin conexión" strip does not change.
- D28 (2026-11-03, analyst): D24 reaches exactly the tabs Tarea, Cuándo and Acciones and the options of Posponer, Quitar posponer, Pausar/Reanudar and Borrar tarea, what is listed in the question. Guardar, Agregar horario, Quitar, Quitar emoji, the section titles of wide screens (D13) and the dialogs are left with text only. The actions carry an icon at all widths, because D3, D4 and D5 treat them as the same controls. The error mark of D16 is distinguished from the icon of the tab. The icons travel with the app, because §2 and §7 require it to work offline.

## Artifacts

- Gherkin: `features/panel-tabs.feature` (S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19)
- QA: `qa/panel-mobile.md`

Only the rules that decide what is shown go to Gherkin (the 40rem cut, the tabs of create and edit, the error mark per section, the destination when Guardar fails, the Guardar bar with the keyboard). Layout, field order, icons, fixed bars, full screen, "nothing is lost", S1/S2/S4-S8/S10/S11/S14/S18/S19 and the rest of the presentation are verified in `qa/panel-mobile.md`; there is no possible Gherkin without inventing rules.

## core

- **Allowed edits**: `src/lib/core/panel-en-pestanas.ts`, `src/lib/core/panel-en-pestanas*.test.ts`
- **Rules**: S3, S9, S12, S13, S15, S16, S17
- **Reuses**: no existing function; the field of each error is already known by `src/lib/core/nombre-de-tarea.ts`, `etiquetas-escritas.ts` and `horario.ts` (which say which field fails), but the core of this feature only receives the field names as data: `Título`, `Etiquetas`, `fecha límite`, `Cada`, `días`, `horario`.
- **Exports (suggested)**: `presentacionDelPanel(anchoRem)` (tabs up to 40rem inclusive), `seccionesDelPanel(modo)`, `seccionesMarcadas(camposConError)`, `destinoAlFallarGuardar(camposConError, presentacion)` (tab and first field, in the order Título, Etiquetas, fecha límite, Cada, días, horario) and `barraDeGuardarVisible(tecladoAbierto)`.
- **Gate**: `node scripts/gate.ts core`

## acceptance

- **Allowed edits**: `acceptance/steps/panel-pestanas.ts`, `acceptance/steps/index.ts`, `acceptance/oracle*.ts`, `acceptance/equivalence.ts`, `docs/pipeline/pendientes.txt`
- **Features to connect**: `features/panel-tabs.feature`
- **New steps**:
  - `una pantalla de <ancho> rem de ancho`
  - `el panel se presenta <presentacion>`
  - `el panel se abre para <modo>`
  - `el panel ofrece las secciones <secciones>`
  - `la pestaña abierta es <abierta>`
  - `el panel muestra errores en los campos <campos>`
  - `las secciones marcadas son <marcadas>`
  - `el guardado falla con errores en los campos <campos>`
  - `el panel salta a la pestaña <pestana>`
  - `el contenido se desplaza hasta el campo <campo>`
  - `el teclado en pantalla está <teclado>`
  - `el foco está <foco>`
  - `la barra de Guardar está <barra>`
- **Oracle**: new spec rules in classification Thens: the 40rem cut, sections per mode, section of each field, field order for the first error and bar hidden only with the keyboard open.
- **Gate**: `node scripts/gate.ts acceptance`

## ui

- **Allowed edits**: `src/lib/ui/PanelTarea.svelte`, `src/lib/ui/CampoEtiquetas.svelte`, `src/lib/ui/SelectorEmoji.svelte`, `src/lib/ui/AvisoDeshacer.svelte`, `src/lib/ui/FranjaSinConexion.svelte`, `src/lib/ui/Pendientes.svelte`, `src/lib/ui/estilos.css`, `src/lib/ui/iconos/*.svelte`, `src/lib/adapters/teclado.ts`, `src/routes/+layout.svelte`, `src/routes/+page.svelte`
- **Visible behavior**: `qa/panel-mobile.md`
- **Gate**: `node scripts/gate.ts ui`

## cleaner · architect · hardener · qa

## Log

- L1 (2026-11-03): «en algunas tareas el modal no entra en la pantalla del celular, hagamos un rediseño para mobile q permita mostrar mejor todas las opciones, podemos emplear iconos si hace falta» (translation: «in some tasks the modal does not fit on the phone screen, let's do a redesign for mobile that shows all the options better, we can use icons if needed»)
- L2 (2026-11-03, orchestrator): evidence measured at 360x640 on a pending recurring task: the form has scrollWidth 502 with clientWidth 360, Guardar ends at x=486 off screen and the Título field stretches to x=486. The cause is `.acciones` without `flex-wrap` in `src/lib/ui/PanelTarea.svelte`.
