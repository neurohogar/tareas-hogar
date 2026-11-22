# QA: installable PWA and offline operation

Verifies, through the interface only and through what the browser exposes of the PWA,
that the app is installable, that it opens offline after the first login, that
what is done offline (create, edit, complete, undo, delete) is seen
instantly, survives a reload and syncs by itself on reconnecting, and that a
pending write is not lost if the page is reloaded before it reaches the
server. Covers spec §2 (offline and sync), §6.5 (opens directly, also offline),
§7 (persistent multi-tab cache, sync on reconnecting), §8 (PWA:
manifest + service worker) and §10 criteria 1, 4 and 6.

Out of scope: the conflict rules between devices (already covered in
`qa/edit-delete.md`); any visual indicator of "offline" or "pending sync"
(the spec does not define it: QA neither requires nor forbids it); what happens with a new version of the
service worker; opening offline without ever having signed in; the look of the icon, the name and the
colors of the manifest (it is only verified that they exist and are valid); the real
installation on Android (it is verified that the browser considers it
installable).

## Environment

Same as `qa/edit-delete.md`:

- Firebase Emulator Suite (Auth + Firestore) with clean data at the start of
  each flow.
- Simulated clock (`page.clock`) installed **before** opening the app, at
  `2026-07-15T08:00:00` (zone `America/Argentina/Buenos_Aires`).
- Signed in with `qa@example.com` (Flow 1 of `qa/recurring-relative.md`).
- "Offline" means `browserContext.setOffline(true)`; "reconnect" means
  `setOffline(false)` and waiting for the screen to update by itself.
- Two devices: two independent contexts, A and B, with the same account.
- **Mostrar completadas** stays off (its initial value), except in
  Flow 3: a completed task has no row in Pendientes.
- The app is served as a production build (`vite build` + preview), because the
  service worker is only registered there. For the flows with offline reload the
  service worker must already be active and controlling the page before
  cutting the connection (wait for `navigator.serviceWorker.ready` and reload
  once with a connection).

## Observable contract

- **Manifest**: the document links with `<link rel="manifest">` to a manifest
  that downloads and parses as JSON with: `name` = "Tareas Hogar" and `short_name` = "Tareas",
  `start_url` inside the scope of the app, `display` = `standalone`, and
  `icons` with at least one 192×192 icon and one 512×512 icon, each
  downloadable with an image type.
- **Service worker**: `navigator.serviceWorker.getRegistration()` returns a
  registration with a worker in `activated` state whose scope covers the root of the
  app, and the page is controlled by it (`navigator.serviceWorker.controller`
  is not null after the reload).
- **Installable**: the browser fires `beforeinstallprompt` (Chromium) with a valid
  manifest and service worker, or an equivalent if the engine does not expose it.
- **Connection notice**: visible text "Sin conexión" while the context
  is offline; without it when online. There is no pending counter.
- **Row and screens**: the row contract of `qa/recurring-relative.md`, the
  Historial contract of `qa/history-undo.md`.

## Flow 1: installable PWA

1. Open the app with a connection (production build) and wait for the service
   worker to be active.
2. Verify the **Manifest** and **Service worker** contract.
3. Reload and verify that the page is controlled by the service worker.
4. Verify that the browser considers the app installable.

## Flow 2: open offline after the first login

1. With a connection: sign in with Google (`qa@example.com`), create the
   one-off task **Regar** and see its row in **Pendientes**. Wait for the service
   worker to control the page.
2. Put the context offline and reload: the app opens directly on
   **Pendientes**, without a login screen and without a network error, and shows the row
   **Regar**.
3. Open `/history` by direct URL and reload, still offline: the
   Historial is shown (empty: "Todavía no completaste nada").
4. Close the page, open a new tab at the root, still offline:
   it opens directly on **Pendientes** with **Regar**.
5. Reconnect: no login screen appears and nothing visible changes.

## Flow 3: complete offline and sync (criterion 4)

Precondition: A and B signed in, recurring task **Regar** (Cada 1 día) created
from A and visible on B, **Pendientes** on both, with **Mostrar completadas**
on in both (`qa/show-completed.md`).

1. A offline.
2. On A, complete **Regar**: it becomes waiting instantly (dimmed, with
   bar, completed). On B, **Regar** is still pending (not dimmed).
3. On A, open **Historial**: one entry **Regar** `08:00` in **Hoy**.
4. Reload A (still offline): **Regar** is still waiting and the entry
   is still in the Historial.
5. A reconnects: without touching anything, B shows **Regar** waiting and, in its
   Historial, the entry **Regar** `08:00`. A single entry.

## Flow 4: create, edit and delete offline

Precondition: A and B signed in and empty lists.

1. A offline.
2. On A, create **Barrer** (one-off) and **Pagar** (one-off with due date
   `2026-07-20`): both appear instantly on A. B does not see them.
3. On A, edit **Barrer** to title **Barrer patio**; the change is seen
   instantly.
4. On A, complete **Pagar** and then **Deshacer** from the notice: **Pagar**
   goes back to pending.
5. On A, delete **Pagar** (confirming): it disappears.
6. Reload A, still offline: only **Barrer patio**; the Historial empty.
7. A reconnects: B shows **Barrer patio** and not **Pagar**; the Historial of
   B is empty.

## Flow 5: the pending write survives a reload

It is the QA observation of the previous feature: reloading right after
creating must not lose the task.

Precondition: A and B signed in and empty lists.

1. A offline.
2. On A, create **Comprar pan** and, without waiting, reload A (still
   offline): **Comprar pan** is still in **Pendientes**.
3. On A, complete **Comprar pan** and reload immediately, still offline:
   it is still completed (it is not in Pendientes; in the Historial there is one entry).
4. Close A and open it again in a new tab, still offline: same
   state.
5. A reconnects: B shows **Comprar pan** completed in its Historial, a
   single entry, without duplicates.
6. Variant with a connection: on A (with a connection) create **Lavar** and reload
   immediately, without waiting. After reloading, **Lavar** is on A and also
   appears on B. Repeat with complete and reload immediately.

## Flow 6: several tabs of the same device

Precondition: signed in, two tabs (P1 and P2) of the same context.

1. Both open the app without errors or "there is already another tab
   open" screens.
2. With a connection, create **Regar** in P1: it appears in P2 without reloading.
3. Context offline: create **Barrer** in P1: P2 shows it without reloading
   (shared cache).
4. Reconnect and open B (another context): it sees **Regar** and **Barrer**.

## Flow 7: connection round trip

Precondition: A and B signed in, one-off **Regar** and **Barrer** visible on
both.

1. A offline; on B (with a connection) complete **Regar**.
2. A does not see the change. Reconnect A: without reloading, **Regar** becomes completed
   on A and leaves the list (**Mostrar completadas** off).
3. A offline again, complete **Barrer** and reconnect after a few
   seconds: B sees it without reloading. Repeat the cut and the reconnection twice
   more without the app showing errors or losing the changes.

## Flow 8: "Sin conexión" notice

Precondition: signed in, on **Pendientes**.

1. With a connection "Sin conexión" is not shown.
2. Put the context offline: "Sin conexión" appears without reloading.
3. Create **Regar** offline: the notice is still only "Sin conexión"
   (no number or text about pending changes).
4. Reload offline: the notice is still visible.
5. Reconnect: the notice disappears by itself.

## Flow 9: open offline without ever having signed in

Precondition: new context, no previous session. The app is loaded with a
connection once (so that the service worker saves it) without signing in.

1. Put the context offline and reload.
2. The entry screen is shown with the message "Necesitás conexión para
   entrar la primera vez" and the **Entrar con Google** button disabled.
3. Reconnect: the message disappears and the button becomes enabled, without
   reloading.

## Flow 10: new version of the service worker

1. With the app installed and controlled by the service worker, publish a
   new build (different service worker).
2. Open the app again: no update notice or question is shown.
3. After closing and reopening the app, the page is controlled by the new
   service worker (version observable by the build served) and the data
   and the session are intact.
