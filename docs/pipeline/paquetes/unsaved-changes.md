# Package: unsaved-changes

Closing the panel or using an action with unsaved changes asks for confirmation instead of losing them, and the Android Back button closes the panel instead of leaving the screen.

## Specs

- **S1** (§6.2): «**Close** (the **X**, or **Back** on Android) with unsaved changes asks for confirmation instead of discarding them (**Unsaved changes**, below); without changes it closes directly.»
- **S2** (§6.2): «There **are changes** when **Guardar** would change something compared to the values the panel was opened with.»
- **S3** (§6.2): «Only exception: the unconfirmed text of the Etiquetas field counts as a change (unless it is only spaces) even if **Guardar** does not change anything because of it;»
- **S4** (§6.2): «It **is measured against the values when the panel was opened**, not against what another device wrote afterwards: a remote change does not make the notice appear.»
- **S5** (§6.2): «**When creating**, "no changes" means the form is still as it was opened.»
- **S6** (§6.2): «**Close notice**: closing with the **X** (or **Back**, see **Back**) with changes opens the notice "Tenés cambios sin guardar" with three buttons:»
- **S7** (§6.2): «**Descartar** does not remove from **Recientes** an emoji chosen in the panel:»
- **S8** (§6.2): «**Action notice**: **Pausar**, **Reanudar**, **Posponer** (**1 hora**, **3 horas**, **Hasta mañana**) and **Quitar posponer** with changes open the notice "Tenés cambios sin guardar" with three buttons:»
- **S9** (§6.2): «"Now" of §5.8 and §5.9 is the moment of tapping the button of the notice, not that of choosing the action.»
- **S10** (§6.2): «Then the notice says "Con estos cambios la tarea ya no se puede <acción>" and offers only **Seguir editando** and **Descartar y <acción>**, without **Guardar y <acción>**.»
- **S11** (§6.2): «**The action notice is kept up to date** while it is open, with the task and the now of the moment, like the actions in view:»
- **S12** (§6.2): «**If Guardar fails** (from the close notice or that of an action) by validation (rules above and §4.1–§4.2): nothing is executed, neither the action nor the closing.»
- **S13** (§6.2): «**The notices open over the panel** with the rules of **Over the panel**:»
- **S14** (§6.2): «**If another device deletes the task** with a notice open, the notice and the panel close without asking for anything (§7, the deletion wins).»
- **S15** (§6.2): «**Borrar tarea** does not add this notice: it keeps only its confirmation.»
- **S16** (§6.2): «**Back** (the Android Back button, or the equivalent browser gesture), with the panel open, closes the panel and does not leave the screen where it is»
- **S17** (§6.2): «A new **Back** closes the panel; if the panel has changes, it opens the close notice, and without changes it closes directly.»
- **S18** (§6.2): «With the on-screen keyboard open, the first **Back** is closed by the system and the panel stays the same; the next one applies these rules.»
- **S19** (§6.2): «With the panel closed, **Back** does what it does today:»
- **S20** (§6.2): «**Reloading or closing the app** with unsaved changes shows the browser confirmation.»
- **S21** (§6.2): «and only **Cerrar** (confirmed with **Descartar**, if there are changes) or **Descartar y <acción>** discard the changes.»
- **S22** (§7): «it closes, also with an **Unsaved changes** notice open and without asking for anything (§6.2).»
- **S23** (§6.2): «When creating a task, the option of **Se repite** that comes selected is **No se repite**.»

## Decisions

- D1 (2026-11-03, user): «Pedir confirmación» (translation: «Ask for confirmation») when closing with the X or with Back while there are unsaved changes. Without changes, it closes directly. This changes the rule of §6.2 «Cerrar sin guardar descarta los cambios» (translation: «Closing without saving discards the changes»).
- D2 (2026-11-03, user): the close notice offers Seguir editando, Descartar and Guardar («También Guardar» (translation: «Also Guardar»)).
- D3 (2026-11-03, user): the same applies when creating: «Sí, igual que al editar» (translation: «Yes, same as when editing»). If something was entered, it asks for confirmation; if it is empty, it closes directly.
- D4 (2026-11-03, user): Posponer, Pausar, Reanudar and Quitar posponer, with unsaved changes, show a notice to save and act, or to discard and act. Without changes, they act at that moment.
- D5 (2026-11-03, user): Borrar tarea does not add this notice: it keeps only its confirmation.
- D6 (2026-11-03, user): if saving from a notice fails by validation, «No se ejecuta» (translation: «It is not executed»): neither the action nor the closing; the panel stays open and jumps to the tab with the error, with the rules of §6.2. It also holds for Guardar in the close notice.
- D7 (2026-11-03, user): Back closes the panel, without leaving the screen, and «Solo lo de arriba» (translation: «Only what is on top»): if an emoji picker, a confirmation or a notice is open, it closes only that and leaves the panel as it was; another Back closes the panel.
- D8 (2026-11-03, orchestrator): out of scope: portrait orientation, which is the next feature.
- D9 (2026-11-03, analyst): there are changes when **Guardar** would change something compared to the values the panel was opened with: typing and going back to the original value does not count, nor do the spaces that **Guardar** trims, nor the order of the windows that **Guardar** sorts; an emptied field or an empty schedule row do count, even if they are invalid. Because §6.2 already says «Guardar sin cambios no cambia nada» (translation: «Saving without changes changes nothing») and a notice with nothing to lose is noise.
- D10 (2026-11-03, analyst): when creating, "if it is empty" means the form is still as it was opened; touching any field with another value (for example, **Se repite** or the effort) is "entering something", and a title of only spaces is not. It is D9 applied to creating.
- D11 (2026-11-03, analyst): the changes are measured against the values when the panel was opened, not against what another device wrote afterwards: a remote change does not make the notice appear. Because the notice protects what this person did in this panel.
- D12 (2026-11-03, analyst): the action notice also offers **Seguir editando**, with the buttons **Seguir editando**, **Descartar y <acción>** and **Guardar y <acción>** (pause, resume, postpone, remove the postponement). Because D7 already allows leaving that notice without acting, D2 and **Borrar tarea** offer that exit in view, and a wrong tap on an action has to be reversible without Back too.
- D13 (2026-11-03, analyst): the two notices open over the panel with the rules of «Sobre el panel» (translation: «Over the panel»): they block what is below and, on closing them, it returns to the same tab without losing anything. Because they are the same as the confirmation of **Borrar tarea**.
- D14 (2026-11-03, analyst): when acting from the notice, "now" is the moment of tapping the button of the notice, not that of choosing the action. Because that is when it is executed, and §5.8 and §5.9 use now.
- D15 (2026-11-03, analyst): if another device deletes the task with a notice open, the notice and the panel close (§7, «gana el borrado» (translation: «the deletion wins»)), without asking for anything. If another device makes the action no longer apply (for example, the pause), the notice of that action closes and the panel stays with what was written. Because §6.2 already updates the actions in view and «Nada se pierde» (translation: «Nothing is lost»).
- D16 (2026-11-03, analyst): **Descartar** does not remove from **Recientes** an emoji chosen in the panel. Because §6.2 updates them on choosing, on that device, without depending on saving.
- D17 (2026-11-03, analyst): Back closes whatever is on top as if its exit were tapped: the notice is equivalent to **Seguir editando**, the confirmation of **Borrar tarea** to cancel and the emoji picker to closing it without choosing. If the panel is left with changes, Back opens the close notice (D1). The «notice» of D7 means those of this feature: the undo notice of §5.4 does not open over anything, Back ignores it and its 5 seconds continue. The suggestions of Etiquetas do not count as something open either.
- D18 (2026-11-03, analyst): with the on-screen keyboard open, the first Back is closed by the system and the panel stays the same; the next one applies D7. Because that tap does not reach the app.
- D19 (2026-11-03, analyst): Back does the same in any browser and width, and in the panel opened from Historial (it stays in Historial). With the panel closed, Back does what it does today: closing the panel with the X, with Guardar or with an action does not leave an extra Back that does nothing, and Forward does not reopen a panel. Outside the panel, the dialogs of Historial and Etiquetas do not change with this feature, because D7 speaks of the open panel.
- D20 (2026-11-03, user): save and act when what is saved leaves the action meaningless: «Sin la opción de guardar» (translation: «Without the option to save»).
- D21 (2026-11-03, user): unconfirmed text in Etiquetas, if it is the only thing that changed and the panel is closed: «Cuenta, salvo solo espacios» (translation: «It counts, except only spaces»).
- D22 (2026-11-03, user): reloading or closing the app with unsaved changes: «Confirmación del navegador» (translation: «Browser confirmation»).
- D23 (2026-11-03, analyst): D21 is the only exception to D9: the unconfirmed text in Etiquetas (except only spaces) counts as a change even if **Guardar** does not change anything because of it. There is a single definition of "there are changes": it holds the same for closing with the X or Back, for creating (D3), for the actions (D4) and for the browser confirmation (D22). **Guardar** in a notice still does not create that label, as the user chose in D21; if the text is a name that makes **Guardar** fail, D6 applies.
- D24 (2026-11-03, analyst): for D20, an action "becomes meaningless" if it does not meet the conditions with which §5.8, §5.9 and §6.2 show it, evaluated on the task as it would be saved. The actions in view are still decided with the task as of now, not with what was written. It includes **Reanudar** with a change to **No se repite** (saving already resumes it, §5.8). The notice says "Con estos cambios la tarea ya no se puede <acción>" and offers only **Seguir editando** and **Descartar y <acción>**. If what was written is invalid there is no way to evaluate it: **Guardar y <acción>** is offered and it fails according to D6. It is what the chosen option described.
- D25 (2026-11-03, analyst): the notice of an action is evaluated with the task and the now of the moment and is updated while it is open, like the actions in view (§6.2): if another device changes the task or time passes, **Guardar y <acción>** can appear or disappear. On tapping it, it is evaluated again; if it no longer applies, nothing is saved or acted on and the notice is left updated. It complements D15.
- D26 (2026-11-03, analyst): the browser confirmation (D22) appears only if there are changes (D23), with a notice open or without one, and never by Back with the panel open, which follows D7. Its text is the browser's and, where the system does not offer it, what was written is lost, as the user already accepted on choosing it. On reload, the panel is not reopened. D19 does not cover the Back that follows a reload: it can return to the same screen without a visible effect.
- D27 (2026-11-03, user): when creating a task, the option of **Se repite** that comes selected: «No se repite» (translation: «It does not repeat»). Today the app opens on Intervalo and the spec did not define it; this changes the app.

## Artifacts

- Gherkin: `features/unsaved-changes.feature` (S1, S2, S3, S4, S5, S20, S23), `features/close-notice.feature` (S1, S6, S7, S12, S13, S14, S21, S22), `features/action-notice.feature` (S8, S9, S10, S11, S12, S14, S15, S21), `features/panel-back.feature` (S16, S17, S18, S19)
- QA: `qa/unsaved-changes.md` (everything, and especially what the Gherkin does not cover: S13 what is seen over the panel, S19 the closed panel and the screen of origin, S20 the browser dialog, S16 not leaving the screen). I also adjusted the flows of other `qa/*.md` where "Cerrar sin guardar" now goes through the notice (**Descartar**). S23 (when creating, **Se repite** opens on **No se repite**): `Cambios sin guardar 12` and `20` of the feature (choosing Intervalo is entering something; going back to No se repite leaves the form as it was opened) and steps 1 and 4 of flow 3 of `qa/unsaved-changes.md`; I corrected the flows that assumed Intervalo when creating in `qa/panel-mobile.md` (flows 1 and 2), `qa/one-off.md` (flows 1 and 7 and the contract), `qa/recurring-calendar.md` (contract) and `qa/recurring-relative.md` (environment and flows 2 and 3).

## core

- **Allowed edits**: `src/lib/core/cambios-sin-guardar*.ts`, `src/lib/core/aviso-de-accion*.ts`, `src/lib/core/atras-del-panel*.ts`, `src/lib/core/panel-en-pestanas.ts`, `src/lib/core/datos-de-tarea.ts`, `src/lib/core/horario.ts`, `src/lib/core/pausa.ts`, `src/lib/core/posposicion*.ts`, `src/lib/core/*.test.ts` (all core tests: a change to an exported type can touch them)
- **Rules**: S23 (when creating, `Se repite` opens on `No se repite`; that value is the reference of S5), S2, S3, S4, S5 (what counts as "there are changes", when editing and when creating, measured against the values at opening), S1 and S6 (with changes the X opens the close notice with its three buttons; without changes it closes directly), S8, S9, S10, S11 (what the notice of each action offers, with the task and the now of the moment, and the text "Con estos cambios la tarea ya no se puede <acción>"), S12 (if Guardar fails nothing is executed), S15, S16, S17, S18 (what Back closes according to what is on top, the on-screen keyboard and the undo notice), S20 (when the browser confirmation appears)
- **Reuses**:
  - `datosDeTarea` (`datos-de-tarea.ts`) gives the values the panel is opened with; "there are changes" is what **Guardar** would change compared to that, so it relies on the same normalizations as Guardar (`editarConEtiquetas` / `crearConEtiquetas` in `guardar-con-etiquetas.ts`, `camposDeTexto` in `campos-de-texto.ts` to trim the note and the emoji, and the window order of `horario.ts`), without reimplementing them.
  - `accionDePausa`, `cambioDePausa` (`pausa.ts`) and `OPCIONES_DE_POSPONER`, `posponer`, `quitarPosponer` (`posposicion.ts`, `posposicion-en-panel.ts`) to decide whether an action applies: "becomes meaningless" is not meeting the conditions with which §5.8, §5.9 and §6.2 show it, evaluated on the task as it would be saved; the actions in view are still decided with the task as of now.
  - `PESTANA_AL_ABRIR` and `destinoAlFallarGuardar` (`panel-en-pestanas.ts`): when Guardar fails from a notice, the destination is the usual one.
  - The unconfirmed text of Etiquetas is a change even if it is not saved (exception of S3): `etiquetas-escritas.ts` defines what counts as text (only spaces does not).
- **Notes**: "now" of §5.8 and §5.9 is the moment of tapping the button of the notice (S9): the functions receive now as a parameter (the core never reads the clock). The names of the buttons (`Descartar y posponer 1 hora`, etc.) and the messages come from the core, not from the UI.
- **Gate**: `node scripts/gate.ts core`

## acceptance

- **Allowed edits**: `acceptance/steps/cambios-sin-guardar.ts`, `acceptance/steps/edicion.ts`, `acceptance/steps/pausar.ts`, `acceptance/steps/posponer.ts`, `acceptance/steps/emojis-recientes.ts`, `acceptance/steps/index.ts`, `acceptance/steps/world.ts`, `acceptance/oracle*.ts`, `acceptance/equivalence.ts`, `docs/pipeline/pendientes.txt`
- **Features to connect**: `features/unsaved-changes.feature`, `features/close-notice.feature`, `features/action-notice.feature`, `features/panel-back.feature`
- **Existing steps reused**: `abro la tarea en el panel de edición el <ahora>`, `la tarea tiene título <titulo>`, `la tarea está pausada` / `no está pausada`, `la tarea está pospuesta desde <desde> hasta <hasta>`, `la tarea es periódica`, `no queda ninguna tarea`, `se crea una tarea puntual con título <titulo>`, `no existe la tarea <titulo>`, `una tarea periódica relativa Regar cada <cada> <unidad>`, `una tarea puntual sin fecha límite`, `la tarea Regar fue pausada`, `la tarea fue pospuesta con la opción <opcion> el <momento>`, `otro dispositivo, sin ver ese cambio, edita el título a <t>` / `pausa la tarea` / `borra la tarea`, `que no hay emojis recientes`, `elijo un emoji que no estaba entre los recientes`, `el primero es el que elegí`.
- **New steps**:
  - `abro el panel para editar la tarea <titulo> con nota <nota>` (one-off, without due date, without effort, without labels, without schedule)
  - `abro el panel para editar la tarea <titulo> con los horarios <primero> y <segundo>` (windows `HH:MM-HH:MM`)
  - `abro el panel para crear una tarea`
  - `el panel está abierto <cambios>` (with unsaved changes | without changes)
  - `encima del panel hay <encima>` (nothing, the close notice, the action notice, the confirmation of Borrar tarea, the emoji picker, the suggestions of Etiquetas)
  - `el aviso de deshacer está abierto` and `el aviso de deshacer sigue abierto`
  - `el teclado en pantalla está abierto`
  - `escribo <valor> en el campo <campo>` (Título, Nota, unconfirmed Etiquetas)
  - `escribo <valor> con espacios alrededor en el campo <campo>`
  - `escribo solo espacios en el campo <campo>`
  - `vacío el campo <campo>`
  - `elijo <valor> en <selector>` (Se repite, Esfuerzo)
  - `cambio los horarios a <nuevo_primero> y <nuevo_segundo>`
  - `agrego una fila de horario vacía`
  - `agrego la etiqueta <etiqueta>` and `quito la etiqueta <etiqueta>`
  - `toco la X del panel`
  - `toco Atrás`
  - `toco <boton> en el aviso` and `toco <boton> en el aviso el <ahora>`
  - `elijo la acción <accion> el <ahora>` (Pausar, Reanudar, Posponer 1 hora, Posponer 3 horas, Posponer hasta mañana, Quitar posponer, Borrar tarea)
  - `pasa el tiempo hasta <ahora>`
  - `queda abierto <abierto>` (nothing, the panel, the panel with the close notice, the panel with the action notice, the panel with the confirmation of Borrar tarea)
  - `el aviso dice <mensaje>` and `el aviso ofrece <botones>` (comma-separated list of buttons, in order)
  - `el campo <campo> sigue con <valor>`
  - `al recargar la app el navegador <respuesta>` and `el navegador <respuesta>` (asks for confirmation | does not ask)
- **Notes**: the panel steps of `edicion.ts`/`pausar.ts`/`posponer.ts` already declare a task open in the panel; the new ones must share that model and not invent another. In `Then queda abierto`, `el aviso dice` and `el aviso ofrece` the oracle of `acceptance/` is rewritten from `docs/spec.md` §6.2 (Unsaved changes, Back), never from the core; each filtering of equivalents is justified with the spec rule.
- **Gate**: `node scripts/gate.ts acceptance`

## ui

- **Allowed edits**: `src/lib/ui/PanelTarea.svelte`, `src/lib/ui/Sesion.svelte`, `src/lib/ui/SeccionAcciones.svelte`, `src/lib/ui/SeccionTarea.svelte`, `src/lib/ui/SeccionCuando.svelte`, `src/lib/ui/CampoEtiquetas.svelte`, `src/lib/ui/SelectorEmoji.svelte`, `src/lib/ui/Pendientes.svelte`, `src/lib/ui/Historial.svelte`, `src/lib/ui/AvisoDeCambios*.svelte`, `src/lib/adapters/teclado.ts`, `src/lib/adapters/atras*.ts`, `src/lib/adapters/confirmacion-al-salir*.ts`
- **Visible behavior**: `qa/unsaved-changes.md` (and the adjustments to the flows of `qa/edit-delete.md`, `qa/schedule.md`, `qa/one-off.md`, `qa/recurring-relative.md`, `qa/recurring-calendar.md`, `qa/esfuerzo.md`, `qa/etiquetas.md`, `qa/emoji-and-note.md` and `qa/panel-mobile.md` where closing with changes now goes through the notice; and the flows of `qa/one-off.md`, `qa/recurring-calendar.md` and `qa/recurring-relative.md` where creating opens with **No se repite**)
- **Notes**: **the initial value of Se repite when creating changes**: today the UI (`PanelTarea.svelte`, and `SeccionCuando.svelte` if it is decided there) opens on Intervalo; it becomes **No se repite** (S23, D27), which is the value "there are changes" is measured against when creating. When editing it still opens with the option of the task. The notice is an `alertdialog` with the accessible name "Tenés cambios sin guardar" and the buttons of the observable Contract of `qa/unsaved-changes.md`. Back relies on the browser history (`popstate`); opening the panel adds an entry and closing it with the X, **Guardar** or an action consumes it without leaving an extra Back. The browser confirmation is `beforeunload`, only with changes (S20). Everything the core decides (there are changes, which buttons, what Back closes) is asked of the core.
- **Gate**: `node scripts/gate.ts ui`

## cleaner · architect · hardener · qa

They work on everything the feature changed (`git diff <feature base>`, recorded in `tmp/base-de-feature`); they need no section of their own unless the gherkin-writer leaves a note for them here.

## Log

- L1 (2026-11-03): when closing the panel with the X or with Back, with unsaved changes, «Pedir confirmación» (translation: «Ask for confirmation»); and the Android Back button with the panel open: «Cierra el panel» (translation: «Closes the panel»).
