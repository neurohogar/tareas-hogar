# QA: the Historial in the menu, no navigation bar and the removed routes

Verifies, through the interface only:

- that there is no navigation bar, on the phone or on wide screens: **Pendientes** takes up the whole screen, and the **+** button and the undo notice sit at the bottom edge, without covering the last row (spec §6, **Navigation**; §6.1, **+** button; §5.4);
- that the **Historial** is opened from the item **Historial** of the **⋮** menu of **Pendientes** (the first of five items, a plain item, always enabled, also with the minimal mode on and with no completions), or directly by its address (§6, §6.1);
- that the **Historial** has a **Volver** button in its header that behaves like **Back**, with the history entries that implies, and no **⋮** menu (§6, §6.3);
- that the header of the **Historial** scrolls with the content, that the last entry is not covered by the undo notice, the "Sin conexión" strip or the bottom edge, and that the panel or the **Borrar** dialog cover **Volver** (§6.3, §6.2);
- that the undo notice stays on when opening the **Historial** or tapping **Volver** (§5.4);
- that the routes `/etiquetas` and `/anotaciones` no longer exist: opening one of them (a bookmark, the browser history, or reloading a screen that was there) opens Pendientes, replacing that history entry and with no notice, so **Back** does not go back to it;
- that there is no **Anotar** button, no **Anotaciones** tab or screen, no «Anotación guardada» confirmation and no **Copiar** with its texts anywhere in the app (§4.5, §5.10 and §6.7 are gone).

Covers spec §6 (**Navigation**), §6.1 (Menu and minimal mode, **+** button), §6.2 (minimal mode in the panel), §6.3 (Header, last entry), §5.4 (notice), §4.5, §5.10 and §6.7 (removed).

Out of scope: what each screen shows (`qa/history-undo.md`, `qa/pending-order.md`); the rest of the menu (`qa/menu-toggles.md`, `qa/minimal-mode.md`, `qa/block-reschedule.md`); the data that may still be stored for removed concepts (`qa/retry-and-copy-notice.md`, Flow 4).

## Environment

Same as `qa/history-undo.md`:

- Firebase Emulator Suite (Auth + Firestore) with clean data at the start of each flow.
- Simulated browser clock (`page.clock`) installed **before** opening the app, at the local time given by the flow (zone `America/Argentina/Buenos_Aires`).
- Session started with the account `qa@example.com` of the Auth Emulator, except where the flow says otherwise.
- Create a task: tap **+**, type the title and save, with the controls of `qa/one-off.md`.
- **Phone**: 390 x 844; **wide screen**: 1280 x 800.

## Observable contract

- **No navigation bar**: on both screens there is no `navigation` region and no link named **Pendientes** or **Historial**.
- **Menu item**: the first item of the **Menú** of **Pendientes**, with accessible name **Historial**, role `menuitem` (no `aria-checked`, no check mark), never disabled (no `disabled`, no `aria-disabled="true"`). The menu has five items in this order: **Historial**, **Modo mínimo**, **Completadas**, **Pausadas**, **Reprogramar vencidas**. Tapping **Historial** closes the menu, opens the **Historial** (address `/history`) and shows no message.
- **Volver**: in the header of the **Historial**, a button with accessible name **Volver** (an arrow) to the left of the heading **Historial**, the same on the phone and on the wide screen. The **Historial** has no **Menú** button.
- **Bottom edge**: "at the bottom edge" means the bottom of the **+** button, of the undo notice (role `status`) or of the "Sin conexión" strip is at the bottom of the viewport (`boundingBox`), with nothing between it and the edge; "does not cover" means that, scrolled to the end, the last row or entry is wholly above the top of the element that sits at the bottom edge.
- **Back / Forward**: the browser buttons (`page.goBack()`, `page.goForward()`).
- **Removed routes**: `/etiquetas` and `/anotaciones` show Pendientes, the address becomes `/`, no notice or message of a missing page appears, and the history entry of the removed route is replaced.
- **Nothing of annotations**: no control with the accessible name **Anotar**, **Copiar**, **Editar texto** or **Me sirvió** / **Me molestó**, and no text «Anotación guardada», «Anotaciones copiadas», «No se pudo copiar» or «Todavía no hay anotaciones».

## Flows

### Flow 1: no bar, the menu item and Volver

Precondition: session started, clock at `2026-07-15T08:00:00`.

1. On the phone, open `/`: there is no navigation bar and no link **Pendientes** or **Historial**; the empty list takes up the screen down to the bottom edge, and the **+** button sits at the bottom edge.
2. Tap **Menú**: five items, in this order: **Historial**, **Modo mínimo**, **Completadas**, **Pausadas**, **Reprogramar vencidas**. **Historial** has no check mark and is enabled. Tap outside the menu: it closes and nothing changed.
3. Open the menu and tap **Historial**: the menu closes, the address is `/history`, the heading **Historial** and the text "Todavía no completaste nada" are seen, there is no navigation bar and no **Menú** button.
4. Tap **Volver**: **Pendientes** is shown at `/`. Tap **Forward**: the **Historial** is shown again; tap **Volver** again.
5. Open the menu, tap **Historial** and tap **Back**: **Pendientes** is shown. Tap **Forward**: the **Historial** is shown again.
6. Open the menu, tap **Historial**, tap **Volver** and tap **Forward**: the **Historial** is shown again.
7. Repeat 1 to 6 on the wide screen: the same five items, the same **Volver** to the left of the heading, no bar.
8. Create `Regar` and complete it: the menu has the same five items and **Historial** shows one entry.

### Flow 2: the Historial opened directly

Precondition: session started, clock at `2026-07-15T08:00:00`, phone.

1. Open `/history` as the first address of a new tab: the **Historial** is shown with the **Volver** button, with no bar.
2. Tap **Volver**: **Pendientes** is shown at `/`. Tap **Back**: it does not go to the Historial again (the entry of `/history` was replaced; there is no **Back** that does nothing).
3. Open `/history` again as a first address and reload: the **Historial** is still shown. Tap **Volver**: **Pendientes**.
4. From **Pendientes**, open the **Historial** with the menu, reload there: the **Historial** is still shown.

### Flow 3: minimal mode and the notice

Precondition: session started, clock stopped at `2026-07-15T08:00:00`, phone.

1. Create `Foco` (**No se repite**, essential) and `Regar` (**Intervalo** every `2` **días**, not essential). Complete `Regar` with its checkbox: the notice `Completaste «Regar»` appears at the bottom edge, without covering the last row.
2. At `08:00:01`, open the menu and tap **Historial**: the notice is still on screen at the bottom edge. At `08:00:03`, tap **Volver**: it is still there. At `08:00:05` it is gone.
3. Turn **Modo mínimo** on. Open the menu: **Historial** is enabled. Tap it: the **Historial** shows `Regar` `08:00` (non-essential, it is reached only from here). Tap its entry: the panel of `Regar` opens. While the panel is open, **Volver** is covered by it: tapping where it is does nothing and the panel stays. Close the panel (**Back**): the screen stays on the **Historial**.
4. Tap **Borrar** on the entry: the confirmation dialog opens; **Volver** is covered and does nothing. Cancel the dialog. Tap **Volver**: **Pendientes** with the mode on.
5. Turn the mode off and, with no completions (delete the completion of `Regar` from the **Historial** with its confirmation), open the **Historial** from the menu: it is enabled and shows "Todavía no completaste nada".

### Flow 4: scroll and bottom edge

Precondition: session started, clock at `2026-07-15T08:00:00`, phone.

1. Create 12 tasks `T1` to `T12` (**Intervalo** every `2` **días**). Scroll **Pendientes** to the end: the last row is wholly above the **+** button, which is at the bottom edge.
2. Complete `T1` to `T12` (each with its checkbox, waiting for each notice to pass) and open the **Historial**: scroll down: the header (**Volver** and the title) scrolls away with the content, it is not fixed; scroll to the end: the last entry is wholly visible above the bottom edge.
3. Complete a task from **Pendientes**, tap **Historial** in the menu with the notice open and scroll to the end: the last entry is not covered by the notice. Advance the clock so the notice closes.
4. With the connection cut (the "Sin conexión" strip is shown), scroll the **Historial** and **Pendientes** to the end: the last entry or row is not covered by the strip, and the strip and the **+** button do not overlap each other.
5. Repeat 1 and 2 on the wide screen.

### Flow 5: /anotaciones opens Pendientes

Precondition: session started, clock at `2026-07-15T08:00:00`, phone.

1. Open `/history`. Navigate directly to `/anotaciones` (`page.goto`): Pendientes is shown, the address is `/`, no notice or missing-page message appears.
2. Tap **Back** (`page.goBack()`): the app goes back to Historial; `/anotaciones` does not reappear, nor an empty screen.
3. In a new tab of the same context (session started), open `/anotaciones` as the first address: Pendientes is shown, the address is `/` and there is no notice.

### Flow 6: /etiquetas opens Pendientes

Precondition: as in Flow 5.

1. Open `/history`. Navigate directly to `/etiquetas`: Pendientes is shown, the address is `/`, no notice or missing-page message appears.
2. Tap **Back**: the app goes back to Historial; `/etiquetas` does not reappear, nor an empty screen.
3. In a new tab of the same context, open `/etiquetas` as the first address: Pendientes is shown, the address is `/` and there is no notice.

### Flow 7: nothing of annotations is left

Precondition: session started, clock at `2026-07-15T08:00:00`, phone and then wide screen.

1. Without a session, open the app: the entry screen has no **Anotar** button. While the loading screen is shown (Auth response of the emulator delayed) there is no **Anotar** button either.
2. With a session, in Pendientes and in Historial: no **Anotar** button and no control from the list of **Nothing of annotations**.
3. Create `Regar` (**Intervalo** every `2` **días**: a completed one-off task would have no row to open), open its panel (edit) and the creation panel (**+**): no **Anotar** button in either.
4. Complete `Regar`: the undo notice shows `Completaste «Regar»` with **Deshacer**, and no annotation text appears with it.
5. Open the emoji picker from the panel and tap **Back**: the picker closes without choosing and the panel stays open. Tap **Back** again: the panel closes (no box of any kind opens in between).
6. At no moment, after using the app for a simulated week (advancing the clock, completing and opening screens), does a notice, reminder, counter or mark about annotations appear.
