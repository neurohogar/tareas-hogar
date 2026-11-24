# QA: portrait orientation of the installed app

Verifies, through the interface only and through what the browser exposes of
the PWA, that the installed app is used in portrait in either direction, on all
its screens, because the manifest declares it; that opened in a browser tab it
still rotates with the usual wide layout; that on the computer nothing changes,
and that someone who already has it installed receives the change with a new
version, without a notice or a question. Covers spec §6 (Orientation) and §8
(Manifest).

Out of scope: the real rotation of a phone with the installed app (the test
browser does not install the app or rotate the screen: what is verified is what
the app declares and that it does not fix the orientation in any other way); how
many openings the system takes to apply the new manifest (spec §6: "el sistema
puede tardar algunas aperturas").

## Environment

- Firebase Emulator Suite (Auth + Firestore) with clean data at the start of
  each flow.
- The app is served as a production build (`vite build` + preview), as in
  `qa/pwa-offline.md`.
- Simulated clock (`page.clock`) installed **before** opening the app, at
  `2026-07-15T08:00:00` (zone `America/Argentina/Buenos_Aires`); when opening,
  it is advanced until the loading screen goes away (`qa/bundled-font.md`,
  Flow 9).
- Signed in with `qa@example.com` (Flow 1 of `qa/recurring-relative.md`),
  except where the sign-in screen is requested.
- **Portrait phone**: viewport of 360x640 px with touch emulation.
  **Landscape phone**: the same context with a viewport of 740x360 px (more than
  40rem wide). **Computer**: 1280x800 px without touch emulation.
- **Orientation spy**: before opening the app (`addInitScript`), wrap
  `screen.orientation.lock` and `screen.orientation.unlock` to record each
  call, and register the `orientationchange` listeners and the
  `screen.orientation` `change` listeners, without changing what they do.

**Navigation.** There is no navigation bar (`qa/navigation.md`): to go to **Historial**, open the **Menú** (**⋮**) of **Pendientes** and tap the item **Historial**; to go back to **Pendientes**, tap **Volver** in the header of the **Historial**. Opening `/history` directly still shows the Historial.

## Observable contract

- **Manifest**: the document links with `<link rel="manifest">` to a manifest
  that is downloaded and parsed as JSON with `name` = "Tareas Hogar",
  `short_name` = "Tareas", `display` = `standalone` and `orientation` =
  `portrait` (not `portrait-primary` or `portrait-secondary`, which would fix a
  direction; nor `landscape`, `any` or absent).
- **No lock of its own**: the spy records no call to
  `screen.orientation.lock` or `unlock`, and no style rule rotates the
  content: `transform` of `html` and `body` is `none` in portrait and in
  landscape.
- **Wide layout**: that of `qa/panel-mobile.md`, Flow 10, step 3 (without a tab
  bar; sections **Tarea**, **Cuándo** and **Acciones** one after another).

## Flow 1: the manifest declares portrait orientation

1. Open the app on **Portrait phone** and wait for the service worker to be
   active.
2. Verify the **Manifest** contract.
3. Open the same manifest from `/history`, and from the
   sign-in screen without a session: it is the same document, with the same
   `orientation`.

## Flow 2: no screen fixes the orientation on its own

1. With the **Orientation spy**, on **Portrait phone**, go through:
   the loading screen when opening, «Pendientes», «Historial», the panel
   of a new task and that of an existing one (the three tabs), a panel
   notice (closing with unsaved changes) and, without a session, the
   sign-in screen.
2. On each one, verify **No lock of its own**.

## Flow 3: in a browser tab it still rotates

Precondition: create `Regar` with **Intervalo** every `2` **días**.

1. On **Portrait phone**, open «Pendientes»: `Regar` is shown; open `Regar`:
   there is a tab bar (phone layout).
2. Switch to **Landscape phone** without reloading: the page follows the new
   orientation (`screen.orientation.type` starts with `landscape` and the
   visible width is 740 px), the `Regar` panel shows the **Wide layout**, and
   no notice or request to rotate the phone appears.
3. Close the panel and open «Historial» on **Landscape phone**: it is
   shown whole, without rotating or cropping.
4. Go back to **Portrait phone**: the panel goes back to the phone layout.
5. Verify **No lock of its own** throughout the flow.

## Flow 4: on the computer nothing changes

1. On **Computer**, open «Pendientes», «Historial» and the `Regar` panel:
   they look as today, with the **Wide layout** in the panel.
2. Verify **No lock of its own** and that no notice about the
   orientation appears.

## Flow 5: new version

1. With the app installed and controlled by an earlier build, a copy of the
   current one with the manifest without `orientation` (two builds on the same
   origin, as `e2e/versions-support.ts` serves them), publish the current build.
2. Open the app again: no notice or question is shown.
3. After closing and reopening, the page is controlled by the new service
   worker and the manifest it links meets the **Manifest** contract;
   the data and the session are still intact.
