# QA: navigation bar and the removed routes

Verifies, through the interface only:

- that the fixed navigation bar has two tabs, **Pendientes** and **Historial**, in this order, and that the tab of the current screen is shown selected (spec §6, **Navegación**);
- that the routes `/etiquetas` and `/anotaciones` no longer exist: opening one of them (a bookmark, the browser history, or reloading a tab that was there) opens Pendientes, replacing that history entry and with no notice, so **Atrás** does not go back to it;
- that there is no **Anotar** button, no **Anotaciones** tab or screen, no «Anotación guardada» confirmation and no **Copiar** with its texts anywhere in the app (§4.5, §5.10 and §6.7 are gone).

Covers spec §6 (**Navegación**), §4.5, §5.10 and §6.7 (removed).

Out of scope: what each screen shows (`qa/history-undo.md`, `qa/pending-order.md`); the data that may still be stored for removed concepts (`qa/retry-and-copy-notice.md`, Flujo 4).

## Entorno

Same as `qa/history-undo.md`:

- Firebase Emulator Suite (Auth + Firestore) with clean data at the start of each flow.
- Simulated browser clock (`page.clock`) installed **before** opening the app, at the local time given by the flow (zone `America/Argentina/Buenos_Aires`).
- Session started with the account `qa@example.com` of the Auth Emulator, except where the flow says otherwise.
- Create a task: tap **+**, type the title and save, with the controls of `qa/one-off.md`.
- **Phone**: 390 x 844; **wide screen**: 1280 x 800.

## Contrato observable

- **Navigation bar**: a `navigation` region, always visible, with exactly two links, in this order: **Pendientes** (`/`) and **Historial** (`/historial`). No counter or mark. The link of the current screen has `aria-current="page"` and the other does not.
- **Removed routes**: `/etiquetas` and `/anotaciones` show Pendientes, the address becomes `/`, no notice or message of a missing page appears, and the history entry of the removed route is replaced.
- **Atrás**: the browser Back button (`page.goBack()`).
- **Nothing of annotations**: no control with the accessible name **Anotar**, **Copiar**, **Editar texto** or **Me sirvió** / **Me molestó**, and no text «Anotación guardada», «Anotaciones copiadas», «No se pudo copiar» or «Todavía no hay anotaciones».

## Flujos

### Flujo 1: two tabs

Precondition: session started, clock at `2026-07-15T08:00:00`.

1. On the phone, open `/`: the bar has **Pendientes** and **Historial** in that order, nothing else; **Pendientes** has `aria-current="page"` and **Historial** does not.
2. Tap **Historial**: the address is `/historial`, **Historial** has `aria-current="page"` and **Pendientes** does not.
3. Tap **Pendientes**: back to `/`, with `aria-current` on **Pendientes**.
4. Repeat 1 to 3 on the wide screen: the same two links in the same order.
5. Create `Regar`, complete it and go back and forth between the tabs: the bar never gets a counter or a mark.

### Flujo 2: /anotaciones opens Pendientes

Precondition: session started, clock at `2026-07-15T08:00:00`, phone.

1. Open `/historial`. Navigate directly to `/anotaciones` (`page.goto`): Pendientes is shown, the address is `/`, **Pendientes** has `aria-current="page"` and no notice or missing-page message appears.
2. Tap **Atrás** (`page.goBack()`): the app goes back to Historial; `/anotaciones` does not reappear, nor an empty screen.
3. In a new tab of the same context (session started), open `/anotaciones` as the first address: Pendientes is shown, the address is `/` and there is no notice.

### Flujo 3: /etiquetas opens Pendientes

Precondition: as in Flujo 2.

1. Open `/historial`. Navigate directly to `/etiquetas`: Pendientes is shown, the address is `/`, **Pendientes** has `aria-current="page"` and no notice or missing-page message appears.
2. Tap **Atrás**: the app goes back to Historial; `/etiquetas` does not reappear, nor an empty screen.
3. In a new tab of the same context, open `/etiquetas` as the first address: Pendientes is shown, the address is `/` and there is no notice.

### Flujo 4: nothing of annotations is left

Precondition: session started, clock at `2026-07-15T08:00:00`, phone and then wide screen.

1. Without a session, open the app: the entry screen has no **Anotar** button. While the loading screen is shown (Auth response of the emulator delayed) there is no **Anotar** button either.
2. With a session, in Pendientes and in Historial: no **Anotar** button and no control from the list of **Nothing of annotations**.
3. Create `Regar`, open its panel (edit) and the creation panel (**+**): no **Anotar** button in either.
4. Complete `Regar`: the undo notice shows `Completaste «Regar»` with **Deshacer**, and no annotation text appears with it.
5. Open the emoji picker from the panel and tap **Atrás**: the picker closes without choosing and the panel stays open. Tap **Atrás** again: the panel closes (no box of any kind opens in between).
6. At no moment, after using the app for a simulated week (advancing the clock, completing and opening screens), does a notice, reminder, counter or mark about annotations appear.
