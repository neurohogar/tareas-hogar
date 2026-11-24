# QA: edit panel in tabs (phone)

Verifies, through the interface only, the **Nueva tarea** / **Editar tarea** panel on the phone (up to 40rem wide, inclusive) and on wide screens:

- the **Tarea**, **Cuándo** and **Acciones** tabs, their content and their order; that it always opens on **Tarea**; that **Acciones** does not appear when creating;
- the full-screen panel, with a fixed header (title and **X**), tab bar and **Guardar** bar, and the content scrolling from the top in each tab;
- that nothing is lost when changing tabs or width, and that **Guardar** considers all the sections;
- the error marks on the tabs, the jump to the first tab with an error and the scroll to the first field with an error;
- the on-screen keyboard: it does not open by itself, it hides the **Guardar** bar while it is open and it does not change how the form is submitted;
- the tab and action icons, and the accessible names of the **X** and of the button to choose an emoji;
- what is seen over the panel: emoji picker, **Borrar tarea** confirmation, "Sin conexión" strip and undo notice;
- the panel on wide screens: sections one after another, with no tabs.

Covers spec §6.2 (Panel presentation) and the field and action rules of §6.2, §5.8, §5.9, §5.4 and §7 as far as where they are seen.

Out of scope: the rules of each field and action (`qa/one-off.md`, `qa/recurring-relative.md`, `qa/recurring-calendar.md`, `qa/schedule.md`, `qa/emoji-and-note.md`, `qa/postpone.md`, `qa/pause.md`, `qa/edit-delete.md`), the unsaved-changes notice and the Android Back button (`qa/unsaved-changes.md`), and portrait orientation.

## Environment

- Firebase Emulator Suite (Auth + Firestore) with clean data at the start of each flow.
- Each flow starts from a new browser context, with a session started with the account `qa@example.com` of the Auth Emulator (Flow 1 of `qa/recurring-relative.md`).
- Simulated browser clock (`page.clock`) installed **before** opening the app, stopped (`page.clock.pauseAt`), in the `America/Argentina/Buenos_Aires` zone. "Advance the clock to X" moves it forward to X and waits for the screen to update by itself.
- **Phone**: viewport of 360x640 px (22.5rem) with touch emulation. **Wide**: 1024x768 px (64rem). The 40rem breakpoints are 640 px (phone) and 641 px (wide); the root font is 16 px.
- **On-screen keyboard open**: emulated by reducing the height of the visual viewport (for example, to 640x300 px after tapping a text field on the phone); "closing it" is going back to the original height. It is the only way to see it in the test browser.
- Create a task: tap **+**, type the title, choose the **Se repite** option, save.
- Two devices (Flow 8): two contexts A and B with the same account and the same clock.
- **Mostrar completadas** and **Mostrar pausadas** stay off.

Reference week: Monday 2026-07-13, Tuesday 14, Wednesday 15, Thursday 16, Friday 17, Saturday 18, Sunday 19.

**Switches.** **Mostrar completadas** and **Mostrar pausadas** are the items **Completadas** and **Pausadas** of the **⋮** menu (`qa/menu-toggles.md`), not checks above the list: to turn one on or off, open the **Menú** and tap the item (the menu closes). A completed one-off task never has a row in **Pendientes**, with **Completadas** on or off: it is reached from the **Historial**.

**Navigation.** There is no navigation bar (`qa/navigation.md`): to go to **Historial**, open the **Menú** (**⋮**) of **Pendientes** and tap the item **Historial**; to go back to **Pendientes**, tap **Volver** in the header of the **Historial**. Opening `/history` directly still shows the Historial.

## Observable contract

- **Panel**: the dialog with accessible name **Nueva tarea** or **Editar tarea**. On the phone it takes the whole viewport (its box matches the viewport).
- **Header**: contains the panel title and a button with accessible name **Cerrar** (the **X**, with no visible text). It stays fixed: its position does not change when the content scrolls.
- **Tab bar** (phone only): a `tablist` with one tab (`role=tab`) per section, named **Tarea**, **Cuándo** and **Acciones**, in that order; the chosen one has `aria-selected="true"`. It stays fixed under the header. Each tab carries an icon (SVG) next to its text.
- **Error mark of a tab**: an indicator distinct from the icon, inside the tab, present while any field of that section shows an error and absent when there is none (accessible name: "con errores").
- **Content**: what is under the bar; on the phone the content of the chosen tab is seen and scrolls inside the panel. When a tab is chosen, the content starts at the top (scroll 0).
- **Guardar bar**: a bar attached to the bottom edge of the panel with the **Guardar** button (text only, no icon). Visible in all tabs and on wide screens.
- **Tarea section**, from top to bottom: "Pausada" (if applicable), "Pospuesta hasta HH:MM" or "Pospuesta hasta mañana HH:MM" (if applicable), "Última vez: …" (only when editing); the **Título** field with the emoji button beside it (accessible name **Elegir emoji** if there is no emoji, with no visible text; if there is one, the emoji) and **Quitar emoji** below; **Nota**.
- **Cuándo section**: **Se repite** with its four options (**No se repite**, **Intervalo**, **Días de la semana**, **Días del mes**) in a grid of 2 columns by 2 rows, and the fields of the chosen option (due date, **Cada**, days); then **Solo en un horario** with its windows, **Agregar horario** and **Quitar**.
- **Acciones section** (only when editing): the postpone options **1 hora**, **3 horas** and **Hasta mañana** visible, without a **Posponer** button (or, if postponed, **Quitar posponer**); **Pausar** or **Reanudar** (only a recurring task); and at the end, separated from the rest and in the error color, **Borrar tarea**. Each one carries an icon next to its text.
- **Wide screens**: no `tablist`; the three sections one after another, each with its name (**Tarea**, **Cuándo**, **Acciones**) as a title with no icon; **Acciones** only when editing. The panel measures what it always did (it does not take the whole viewport).
- **No icon**: **Guardar**, **Agregar horario**, **Quitar**, **Quitar emoji**, the section titles on wide screens and the dialogs.
- **Visible** is inside the viewport, without being covered by another element.
- **Notice** and **Historial**: those of `qa/history-undo.md`. **"Sin conexión" strip**: the one of `qa/pwa-offline.md`.

## Flow 1: create on the phone

Precondition: empty list, clock at `2026-07-15T10:00:00`, phone viewport.

1. Tap **+**: the **Nueva tarea** panel takes the whole viewport. No field has focus and the keyboard is not open.
2. The tab bar has **Tarea** and **Cuándo**, in that order, and does not have **Acciones**. The **Tarea** tab is chosen and the title, the emoji and the note are seen; nothing of **Cuándo** is seen. **Guardar** is visible at the bottom.
3. Tap **Cuándo**: **Se repite** is seen with the four options in 2 rows of 2, **No se repite** chosen (the option the panel opens with when creating), with **Fecha límite** empty and no **Cada**, and **Solo en un horario**. **Guardar** is still visible. Tap **Tarea** again.
4. Swiping the content horizontally does not change tab.
5. Type `Regar` in the title, tap **Cuándo**, choose **Intervalo** (**Cada** and the unit are seen) with **Cada** `2` **días**, and tap **Guardar**: the panel closes and the list has **Regar**.
6. Tap **+** and then **Cerrar** (the **X**): the panel closes without creating anything.

## Flow 2: edit and the three tabs

Precondition: empty list, clock at `2026-07-15T10:00:00`, phone viewport. Create `Regar` with **Intervalo** every `2` **horas**, emoji 🌱, note `Las del balcón`, and complete it at `2026-07-15T08:00:00` (for "Última vez"; at 10:00 it is pending again, so it offers to postpone).

1. Tap the **Regar** row: the **Editar tarea** panel opens on **Tarea** (even if it was previously closed while on another tab). The bar has **Tarea**, **Cuándo** and **Acciones**.
2. In **Tarea**, from top to bottom: "Última vez: hoy 08:00"; the title `Regar` with the emoji 🌱 beside it and **Quitar emoji** below; the note. There is no "Pausada" or "Pospuesta".
3. Tap **Cuándo**: **Intervalo** chosen (the task's, not the initial one of creating), **Cada** `2` **horas**, and then **Solo en un horario** off.
4. Tap **Acciones**: the options **1 hora**, **3 horas** and **Hasta mañana** visible (without **Posponer**), **Pausar**, and at the end, separated and in the error color, **Borrar tarea**. Each with its icon; there is no **Quitar posponer** or **Reanudar**.
5. Tap **1 hora**: the panel closes and **Regar** is seen postponed. Open it again: it opens on **Tarea** and at the top it says "Pospuesta hasta 11:00"; in **Acciones** there is **Quitar posponer** (instead of the three options) and **Pausar**.
6. Tap **Quitar posponer**: the panel closes and the task is no longer postponed.
7. Open it, go to **Acciones** and tap **Pausar**: the panel closes. Open it (with **Mostrar pausadas** on): above **Tarea** it says "Pausada"; **Acciones** has **Reanudar** and does not have the postpone options.
8. Create `Pagar` with **No se repite**: its panel, in **Acciones**, has neither **Pausar** nor **Reanudar** but does have the postpone options and **Borrar tarea**. A completed task or one outside its schedule keeps at least **Borrar tarea** in **Acciones** (a completed one-off task has no row: open it from the **Historial**).

## Flow 3: full screen and fixed bars

Precondition: empty list, phone viewport. Create a task and open it for editing.

1. The panel takes the whole viewport. Note the position of the header, the tab bar and **Guardar**.
2. In **Tarea**, type a 30-line note, until the content does not fit. Scroll the content to the bottom: the header, the tab bar and **Guardar** are in the same position as in step 1 and none is covered by the content.
3. Tap **Cuándo** and go back to **Tarea**: the content starts at the top (scroll 0) in each tab, even if it had been scrolled before.
4. In **Cuándo**, choose **Días de la semana** with several schedule windows (**Agregar horario** up to 4) until it does not fit: the same, the three bars are fixed and the content scrolls. No control is left outside the width (no horizontal scroll: `scrollWidth` = `clientWidth`), at 360 px and also at 320 px.

## Flow 4: nothing is lost

Precondition: empty list, phone viewport, **Nueva tarea** panel.

1. Type `Barrer` in the title and the note `Con cuidado`; tap **Cuándo**, choose **Días de la semana** with Monday and Thursday and a schedule from `08:00` to `10:00`.
2. Tap **Tarea**: the title says `Barrer`, the note `Con cuidado`. Tap **Cuándo**: Monday and Thursday and the schedule are still there.
3. Change the viewport width to 1024 px: the three sections are seen one after another with everything typed. Go back to 360 px: the panel goes back to tabs with the same content.
4. While on **Cuándo**, tap **Guardar**: `Barrer` is created weekly with Monday and Thursday, schedule `08:00`-`10:00`, note `Con cuidado`. It is a single save with everything from the two tabs.
5. Open `Barrer`, change the title to `Barrer más` and tap **Cerrar** and **Descartar** in the notice: the list still has `Barrer`. Open it, change the title and tap **Pausar** in **Acciones** (a weekly task outside its day does not offer to postpone) and **Descartar y pausar** in the notice: the task is paused and the title change was not saved.

## Flow 5: errors

Precondition: empty list, phone viewport.

1. Tap **+**. With the title empty, tap **Cuándo**, choose **Intervalo**, leave **Cada** empty and turn on **Solo en un horario** with `Desde` `10:00` and `Hasta` `09:00`. Tap **Guardar**: the panel stays open, jumps to **Tarea** (the first tab with an error) and the content is at the **Título** field, with its error in view. **Tarea** and **Cuándo** have the error mark, distinct from the icon.
2. Type `Regar` in the title: the **Tarea** mark disappears at once (the Título error goes away); the **Cuándo** one stays.
3. Tap **Guardar**: it jumps to **Cuándo** and the content is at the first field with an error (**Cada**). Fix **Cada** with `2` **días**: the **Cuándo** mark stays because of the schedule; fix the schedule (`Hasta` `11:00`): the mark goes away. Save: it is created.
4. With 1024 px of width, open **+**, leave the title empty and put `Hasta` before `Desde`; tap **Guardar**: there are no tabs or marks, the panel stays open and the content scrolls to the **Título** field with its error in view (even though the schedule also fails).
5. With 1024 px, open again and leave only the invalid schedule: it scrolls to the schedule field.

## Flow 6: on-screen keyboard

Precondition: empty list, phone viewport with touch emulation.

1. Tap **+**: the panel opens with no focus on any field and the **Guardar** bar is visible. Tap the title and type `Regar`: with the keyboard emulated as open, the **Guardar** bar is not seen; the header and the tab bar stay fixed.
2. With the keyboard "open", tap **Cuándo** (tapping the tab removes the focus from the field and the keyboard; it is emulated by tapping a text field again, **Cada**, with the viewport shrunk): the **Guardar** bar stays hidden (in any tab). Close the keyboard (viewport at the original height) with the field still focused: the **Guardar** bar comes back.
3. Tap **Cuándo**, turn on **Solo en un horario**, and tap the **Desde** field (time picker): the **Guardar** bar is still visible.
4. With the 1024 px viewport (computer), tap the title: the **Guardar** bar is still visible with the field focused.
5. Phone, on **Tarea**: keyboard open, leave the title empty and press Enter in the title: it tries to save, fails and jumps to **Tarea** with the error in **Título**; the **Guardar** bar stays hidden while the keyboard is open. With the title `Regar`, Enter in the title saves and creates the task.
6. In **Nota**, Enter adds a line and does not save.

## Flow 7: icons and accessible names

Precondition: empty list, clock at `2026-07-15T10:00:00`. Repeat on phone and on wide. Create `Regar` with **Intervalo** every `2` **días**.

1. Tap **+**: on the phone, **Tarea** and **Cuándo** have an icon next to their text. The emoji button (without an emoji) has accessible name **Elegir emoji** and has no visible text; the close one has name **Cerrar** and has no visible text. **Guardar** has no icon. On wide, the **Tarea** and **Cuándo** titles have no icon.
2. Open `Regar`: **Acciones** (phone) with icon; **1 hora**, **3 horas**, **Hasta mañana**, **Pausar** and **Borrar tarea** with icon, each next to its text (on phone and on wide). **Agregar horario** (with **Solo en un horario** on) and **Quitar** have no icon.
3. Choose an emoji: the button shows the emoji and **Quitar emoji** (no icon) appears below.
4. Put the browser offline (`setOffline(true)`), reload and open `Regar`: the same icons are seen (they travel with the app).

## Flow 8: two devices with the panel open

Precondition: empty list, clock at `2026-07-15T10:00:00` on A and B; A on phone. Create `Regar` with **Intervalo** every `2` **días** on A.

1. On A, open `Regar` and tap **Acciones**: the postpone options and **Pausar** are seen.
2. On B, pause `Regar`. On A, without closing the panel, the **Acciones** section changes to show **Reanudar** and stops showing the postpone options; the panel stays on **Acciones**. In **Tarea**, at the top, it says "Pausada".
3. On B, resume it and postpone it 3 hours. On A, **Acciones** shows **Quitar posponer** and **Pausar**, and **Tarea** says "Pospuesta hasta 13:00".

## Flow 9: over the panel

Precondition: empty list, clock at `2026-07-15T10:00:00`, phone viewport. Create `Regar` with **Intervalo** every `2` **días**.

1. Open `Regar`, go to **Cuándo** and tap the emoji button in **Tarea** (go back to **Tarea**): the emoji picker opens over the panel, with the search in view. Choose 🌱: it closes and the panel stays on **Tarea** with 🌱.
2. Go to **Acciones** and tap **Borrar tarea**: the confirmation appears over the panel. Cancel: the confirmation closes and the panel stays on **Acciones**, the task intact.
3. With the browser offline (`setOffline(true)`), the "Sin conexión" strip is seen without covering the header, the tab bar or **Guardar**. Get the connection back: the strip disappears.
4. With a connection, complete `Regar` from the list (checkbox) and open its panel with the notice still in view, or complete another task with the `Regar` panel open from another device: the notice `Completaste «…»` is seen over the **Guardar** bar without covering the header or the tabs. With the keyboard "open" (Flow 6) the **Guardar** bar is not there and the notice is seen over the keyboard.
5. After 5 seconds the notice disappears.

## Flow 10: the 40rem breakpoint and wide screens

Precondition: empty list. Create `Regar` with **Intervalo** every `2` **días**.

1. 640 px viewport: open `Regar`; there is a tab bar and the panel takes the whole viewport.
2. 641 px viewport: there is no tab bar; the panel does not take the whole viewport (it has its usual width and position).
3. 1024 px viewport: the sections are seen one after another, with the titles **Tarea**, **Cuándo** and **Acciones** in that order, the content and order of Flow 2 in each, and **Acciones** at the end before **Guardar**; **Guardar** in the fixed bar at the bottom and **Cerrar** (the **X**) in the fixed header. Scroll the panel: the header and **Guardar** do not move.
4. Create a task at 1024 px: the panel does not have the **Acciones** title. Open `Regar`: it has it, with **Borrar tarea** at the end in the error color.
5. Tap **Guardar** with no changes on `Regar`: nothing changes and the panel closes.
