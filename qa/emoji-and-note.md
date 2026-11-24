# QA: emoji (picker) and task note

Verifies, through the interface only, that the edit panel has the **Emoji**
picker (without a text field) and the **Nota** field, that the picker offers all
emojis by category, searches in Spanish, remembers recents on the
device and works offline, that the emoji is shown next to the title in
Pendientes, in the Historial and in the undo notice, that the note is shown only
in the panel and is normalized, and the conflicts between two devices. Covers spec
§4.1, §6.1, §6.2, §6.3, §5.4 and §7.

Out of scope: statuses and order (they do not depend on these fields);
the rule that rejects an invalid emoji (§4.1), which the UI cannot produce and
the unit tests of the core cover.

## Environment

Same as `qa/edit-delete.md` (Emulator Suite, `page.clock` installed before
opening the app, session `qa@example.com`, creating tasks and the two-device
flow A and B) and `qa/history-undo.md` (stopped clock for the
notice). For "offline", `browserContext.setOffline(true)` is used as in
`qa/pwa-offline.md`, with the app as a production build and the service
worker active. Recents are saved per browser: each flow starts from a
new context (no recents) unless it says otherwise.

**Navigation.** There is no navigation bar (`qa/navigation.md`): to go to **Historial**, open the **Menú** (**⋮**) of **Pendientes** and tap the item **Historial**; to go back to **Pendientes**, tap **Volver** in the header of the **Historial**. Opening `/history` directly still shows the Historial.

## Observable contract

- **Panel**: in addition to what is in `qa/edit-delete.md`, it has the
  **Emoji** section and a multi-line **Nota** field. There is no text field for
  the emoji. Without an emoji, the section shows an **Elegir emoji** button; with an emoji,
  it shows that emoji, a button to change it and a **Quitar emoji** button. It opens
  with the current emoji and note (empty if it has none).
- **Picker**: it opens from the panel. It shows the **Recientes** list
  first (only if there are any), the category navigation, the emoji grid and a
  search field. Choosing an emoji assigns it in the panel and closes the
  picker; the change is saved when the panel is saved. The message
  "Ingresá un solo emoji" does not exist.
- **Recents**: from the most recent to the oldest, without repeats, at most 16.
  Removing the emoji does not change them. They are local to the device.
- **Task name** (Pendientes row, Historial entry, notice):
  with an emoji, `emoji title` (for example `🌱 Regar`); without an emoji, only the
  title and no leading space. The note does not appear in any of the three.

## Flow 1: choose the emoji and see it in the row

Precondition: empty list, clock at `2026-07-13T08:00:00`.

1. Create `Regar` with **Intervalo** every `2` **días**. The row says `Regar`.
2. Tap the row: there is no emoji text field; the **Elegir
   emoji** button is shown and the **Nota** is empty.
3. Tap **Elegir emoji**: the picker opens. Search `planta` and choose `🌱`:
   the picker closes, the panel shows `🌱` and the change and
   **Quitar emoji** buttons. Save: the row says `🌱 Regar`.
4. Reload: it still says `🌱 Regar`. Open the row: the panel shows `🌱`.
5. Change the emoji, from the picker, to `👨‍👩‍👧` and save: the row says
   `👨‍👩‍👧 Regar`. Repeat with `👍🏽`, `❤️` and `🇦🇷`: each is shown as a single
   emoji in the row.
6. Create with **+** `Barrer` (**Intervalo** every `1` **día**, relative to the
   last time it was done), choose `🧹` in the picker and type in **Nota**
   `Debajo de la mesa`: the row says `🧹 Barrer` and does not show the note.
7. When creating a new task, **Elegir emoji** and closing the picker without choosing
   (close or Escape) leaves the panel without an emoji.

## Flow 2: remove the emoji

Precondition: `🌱 Regar` in the list, clock at `2026-07-13T08:00:00`.

1. Open the row, tap **Quitar emoji**: the panel goes back to showing **Elegir
   emoji**. Save: the row says `Regar` (no emoji and no leading space).
2. Reopen: **Elegir emoji** is shown, there is no emoji. Reload: the row still
   says `Regar`.
3. Open the row, choose `🔥`, tap **Quitar emoji** and **Cerrar** without saving
   (and **Descartar** in the notice "Tenés cambios sin guardar"):
   the row still says `Regar`.

## Flow 3: catalog, categories and search in Spanish

Precondition: list with one task `Regar`, clock at `2026-07-13T08:00:00`.

1. Open the row and **Elegir emoji**. The picker shows a category
   navigation (at least: faces, people, animals and nature, food,
   travel, activities, objects, symbols, flags).
2. Tap each category of the navigation: the grid scrolls to that
   category and emojis that belong to it are visible (for example `🐶` in animals,
   `🇦🇷` in flags).
3. Search `planta`: `🌱` appears among the results. Search `escoba`:
   `🧹` appears. Search `perro`: `🐶` appears. Search `PERRO` and `perró` (without
   distinguishing case): `🐶` also appears.
4. Search `zzzzqq`: there are no results and a message that nothing was
   found is shown. Clear the search: the full grid comes back.
5. With the search `escoba`, choose `🧹`: it closes and the panel shows `🧹`.

## Flow 4: recents

Precondition: new context (no recents), list with one task `Regar`,
clock at `2026-07-13T08:00:00`.

1. Open the picker: there is no **Recientes** section. Choose `🌱` and save.
2. Open the picker again: **Recientes** shows `🌱`. Choose `🔥` and
   save.
3. Reopen the picker: **Recientes** shows `🔥`, `🌱` in that order.
4. Choose `🌱` again: after reopening, **Recientes** shows `🌱`, `🔥` (without
   repeating `🌱`).
5. Tap **Quitar emoji**, save and reopen the picker: **Recientes** is still
   `🌱`, `🔥`.
6. Choose 16 more different emojis, one by one: **Recientes** shows
   exactly 16, the last chosen first, and `🔥` and `🌱` are no longer there.
7. Reload the page and open the picker: **Recientes** keeps the same
   16 emojis in the same order.
8. Create a new task with **+** and open the picker: the **Recientes** are
   the same (they belong to the device, not to the task).
9. Open the app in a new context (another device B, same account):
   the picker has no **Recientes**: they are not synced.

## Flow 5: the picker offline

Precondition: production build, signed in, service worker active and
controlling the page, list with one task `Regar`.

1. With a connection, open the picker once and close it (so that any
   deferred data has been loaded). Cut the connection and reload.
2. Open the row and **Elegir emoji**: the picker opens with its grid, its
   categories and its emojis visible, without errors.
3. Search `planta`: `🌱` appears, the same as with a connection. Choose it and save:
   the row says `🌱 Regar`.
4. During the whole flow, the browser did not issue any network request to a
   domain other than the app's or the emulator's (the catalog and the search
   texts are not requested from an external service).
5. Reconnect: the row still says `🌱 Regar`.

## Flow 6: the note, only in the panel

Precondition: empty list, clock at `2026-07-13T08:00:00`.

1. Create `Regar` with **Intervalo** every `2` **días**.
2. Open the row, type in **Nota** `  Usar guantes  ` (with spaces at the
   start and at the end) and save. The row does not show the note.
3. Reopen: **Nota** has exactly `Usar guantes`, without spaces at the
   ends.
4. Type a two-line note (`Usar guantes`, line break,
   `Ventilar`) and save. Reopen: both lines are shown.
5. Paste a note of 5000 characters and save: it is accepted without error; on
   reopening, it has the 5000 characters.
6. Type only spaces in **Nota** and save. Reopen: **Nota** is empty.
7. Reload the page: the note is still empty; the row still does not show a note.

## Flow 7: the emoji in the Historial and in the undo notice

Precondition: empty list, clock stopped at `2026-07-13T08:00:00`.

1. Create `Regar` with **Intervalo** every `4` **horas** and the emoji `🌱` (chosen in the picker), and
   `Barrer` with **Intervalo** every `4` **horas** without an emoji.
2. Tap the checkbox of `🌱 Regar`: the notice `Completaste «🌱 Regar»`
   appears with **Deshacer**. Let it expire (5 seconds).
3. Tap the checkbox of `Barrer`: the notice says `Completaste «Barrer»` (without a
   gap). Let it expire.
4. Go to **Historial**: there are two entries for the day **Hoy**, `🌱 Regar` and
   `Barrer`, each with its time.
5. Tap the entry `🌱 Regar`, choose the emoji `🔥` in the picker and save: the entry
   says `🔥 Regar`. Tap **Quitar emoji** and save: it says `Regar`.
6. Tap **Borrar** on an entry: the confirmation dialog names the
   task by its name (emoji and title, or only the title).

## Flow 8: two devices, emoji and note

Precondition: empty list, clock at `2026-07-13T08:00:00` on A and on B.

1. On A, create `Regar` with **No se repite**. B sees it appear.
2. B offline. On B, choose `🌱` in the emoji picker and save.
3. On A, set **Nota** `Usar guantes` and save.
4. B comes back online: on A and on B the row says `🌱 Regar`, and when opening it
   on each, the panel shows `🌱` and **Nota** `Usar guantes` (both changes were
   kept).
5. B offline. On B, choose the emoji `🔥` and change **Nota** to `Ventilar`. On
   A, choose the emoji `🌿`.
6. B comes back online: on A and on B the row says `🔥 Regar` (B's change
   arrived last), and the note is `Ventilar` on both.
7. B offline. On B, tap **Quitar emoji** and save. On A,
   change **Nota** to `Barrer abajo`. B comes back online: on A and on B the
   row says `Regar` (no emoji) and the note is `Barrer abajo`.
