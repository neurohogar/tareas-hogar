# Package: update-screen

When the app opens and there is a new version, an update screen shows the progress of the download with a visible «Continuar sin actualizar» button that sends the download to the background; if the download finishes on that screen, the app starts in the new version. The app also shows information about the current and the latest version.

## Specs

## Decisions

- D1 (2026-11-24, analyst): when the download of the new version finishes while the update screen is open, the app restarts by itself in the new version, without asking; that restart is a start like any other, so the loading screen (§6.6) appears and waits for what it waits for today (including a font or emoji set that the new version changed). Because the request says so literally («en caso q la actualizacion se descargue por completo al app arranca en la ultima version») and, at that moment, nothing has been typed yet: the panel cannot be open on a start screen, so §6.2 (**Unsaved changes**) cannot lose anything.
- D2 (2026-11-24, analyst): «Continuar sin actualizar» enters the app with the version it already has, under the usual rules of §6.6: if the data or the fonts of that opening are not ready yet, the screen keeps waiting for them like the loading screen (same 0.5 s minimum, same 10 s cap counted from the start), without the button and without the progress. The download continues in the background. Because the button only gives up waiting for the update; §6.6 still decides when the app has enough to be shown.
- D3 (2026-11-24, analyst): the first time the app is opened on a device (there is no installed version yet) there is no update screen: the app already runs the latest version and installs in the background as today (§8). Because there is no «current version» to update from and nothing to skip.
- D4 (2026-11-24, analyst): offline there is no update screen: the app cannot learn whether there is a new version, so it opens with the loading screen as today (§6.6, «It does not wait for what is not going to arrive»). Because §6.6 already says the start does not wait for what can only come over the network.
- D5 (2026-11-24, analyst): the update screen also applies without a session (before the sign-in screen, §6.5): the version of the app does not depend on the session. Because the service worker and the build are the same for both kinds of opening, and §6.6 already covers both.
- D6 (2026-11-24, analyst): the update screen follows the rest of the start screen: the system's light or dark theme (§6), the bundled font with the same fallback (§6), portrait in the installed app (§6, **Orientation**) and, on the phone (390 px wide) and on wide screens, the «Continuar sin actualizar» button is always in view without scrolling and is not covered by the bottom edge of the screen or the "Sin conexión" strip (§7). The text of the button is exactly «Continuar sin actualizar». Because the request asks for a «visible» button with that text, and §6 and §6.6 already define the theme, font and orientation of the start screens.
- D7 (2026-11-24, analyst): with the system's reduced-motion preference, the icon of the update screen is shown still, as in §6.6; the progress keeps advancing (it is information, not decoration). Because §6.6 already applies that preference to the icon and says «the rest does not change».
- D8 (2026-11-24, analyst): other windows or tabs of the app that are already open (on the computer) are not reloaded when a window installs the new version: each one keeps its version until it is reloaded or opened again. Because reloading a window by itself can lose what is being typed in its panel (§6.2, **Unsaved changes**).
- D9 (2026-11-24, analyst): the version data is local to each device and is not written to Firestore or synced (§7): each device shows its own current version. Because the version is a property of what each device has installed, not user data.

## Notes for the spec-writer and the gherkin-writer

**What exists today (verified in the code)**:

- The build version is the SvelteKit default: `version.name` is not configured in `vite.config.ts`, so `$app/env` `version` is the build timestamp in milliseconds (today `1795500533463`, published in `build/_app/version.json`). It can be shown to a person as the **date and time of the build**. `package.json` has `"version": "2.0.0"`, which is never bumped and is not used by the app. There is no sequential number per deploy (the README timeline has one row per day of change, not per deploy).
- `build/_app/version.json` is served by Hosting and is not in the service worker's precache (`immutable` and `assets` do not include it), so the page can read it from the network without reloading to learn the latest version.
- The precache is about 1.4 MB in 33 files without the fonts; the fonts (`static/fuentes/`) add about 5.6 MB, are downloaded by the page (`src/lib/adapters/fonts.ts`) into their own cache, not by the service worker.
- `cache.addAll` exposes no progress: a measurable progress needs the files to be downloaded one by one.

**Rules the request contradicts** (they are user questions Q1-Q7; whatever is answered, the spec-writer rewrites them):

- §6.6, **What is seen**: «without flicker, spin or progress indicator, and **without visible text**».
- §6.6, **It goes away by itself**: «nothing is tapped on it and it does not announce anything technical (neither fonts, nor downloads, nor sync)».
- §6.6, **When it appears** and the **10-second cap** (whether the cap applies to the update, Q5).
- §8: «A new version of the service worker is applied by itself the next time the app is opened, without asking or notifying.»
- §6, **Bundled font and emoji** («Whoever already has the app receives them with the next version, without asking or notifying (§8)») and §6, **Orientation** («receives the change by itself, without reinstalling, asking or notifying, like any new version (§8)»).
- §7, **Local preferences** (if a version datum is stored on the device, D9).
- §2, **Includes**: «Loading screen when the app starts (§6.6).»
- If the version information goes in the **⋮** menu (Q8): §6.1, **Menu and minimal mode** («a menu with five items, in this order…», «The menu has no other items»).

**Clash with history-in-menu**: that feature rewrote §6 (Navigation), §6.1 (the **⋮** menu), §6.3 and §5.4, and is in the qa phase in the shared worktree. This feature touches §6 (the Bundled font and Orientation paragraphs, not Navigation) and, if Q8 is answered with the menu, §6.1 **Menu and minimal mode** and the menu component: then it cannot run in parallel with history-in-menu; it has to start after history-in-menu is merged into `v3`. If Q8 keeps the information out of the menu, the only shared section is §6 (different paragraphs).

**Existing tests that assume the current loading screen or service worker** (the gherkin-writer reviews them; several will break):

- Features: `features/loading-screen.feature`, `features/minimal-mode-loading.feature`, `features/bundled-font.feature`, `features/portrait-orientation.feature`.
- QA procedures: `qa/pwa-offline.md` (Flow 10: new version of the service worker), `qa/bundled-font.md` (Flow 7: new version; the loading screen flows), `qa/portrait-orientation.md` (Flow 5: new version), `qa/minimal-mode.md`, `qa/navigation.md`, `qa/emoji-and-note.md`.
- e2e: `e2e/versions-support.ts` (two builds on port 4174 to simulate publishing a version; `hasVersionWaiting` asserts the new version waits), `e2e/pwa-offline.spec.ts`, `e2e/bundled-font.spec.ts`, `e2e/bundled-font-screen.spec.ts`, `e2e/bundled-font-offline.spec.ts`, `e2e/portrait-orientation.spec.ts`, `e2e/screen-support.ts` (the «Cargando» icon), `e2e/support.ts` (waits for the service worker controller), `e2e/panel-mobile-offline.spec.ts`, `e2e/navigation.spec.ts`, `e2e/retry-and-copy-notice.spec.ts`, `e2e/emoji-and-note.spec.ts`, `e2e/minimal-mode.spec.ts`.

## Artifacts

## core

## acceptance

## ui

## cleaner · architect · hardener · qa

## Log

- L1 (2026-11-24): «implementemos una pantalla de carga q muetre el progreso y tenga un boton visible q diga continuar sin actualizar y ponga la actualizacion en segundo plano. en caso q la actualizacion se descargue por completo al app arranca en la ultima version. agregar informacion acerca de la version actual, ultima version, etc» (translation: «let's implement a loading screen that shows the progress and has a visible button that says continue without updating and puts the update in the background. if the update downloads completely, the app starts in the latest version. add information about the current version, the latest version, etc.»)
