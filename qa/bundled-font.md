# QA: bundled font and emoji, and the loading screen

Verifies, through the interface only, that the app is drawn with the **Atkinson Hyperlegible Next** font and the **Noto Color Emoji** emoji that ship with it, and that on start it shows the loading screen while it waits for them:

- that they apply on every screen, in fields and buttons, and in both themes;
- which font draws each kind of character (the table in §6);
- that sizes, weights and hierarchy do not change, except for the panel's Title field, which is 20px, and that times keep fixed-width digits;
- that nothing is requested from an external service and that everything works offline, including an emoji that was never seen on that device;
- what is shown while the font or the emoji set is not available, and that they switch by themselves, also when the download of the set is aborted by a network failure;
- that the app installs and is available offline even if a font file fails to download, and that the file is downloaded again;
- what the emoji picker offers;
- when the loading screen appears, what is seen on it and what it waits for (what decides when it goes away, with all its times, is also in `features/loading-screen.feature`);
- that an emoji the set does not have is saved and shown anyway.

Covers spec §6 (Bundled font and emoji), §6.2 (the Title field and what the picker offers), §6.6 (Loading screen), §7 (what the app stores to work offline and what lives only on the device) and §8 (the new version arrives by itself; the installation does not depend on the fonts).

Out of scope: the phone keyboard and the native calendars and lists of a field (the system draws them), and the character-by-character classification and the rejection of a lone skin tone (`features/bundled-font.feature`; the interface cannot produce it).

## Environment

- Firebase Emulator Suite (Auth + Firestore) with clean data at the start of each flow; session started with the account `qa@example.com` of the Auth Emulator (Flow 1 of `qa/recurring-relative.md`).
- Simulated browser clock (`page.clock`) installed **before** opening the app, stopped, in the `America/Argentina/Buenos_Aires` zone.
- **Phone**: 360x640 px with touch emulation. **Wide**: 1024x768 px. **Light theme** and **Dark theme**: `page.emulateMedia({ colorScheme })`.
- **Offline**: `browserContext.setOffline(true)` after the app finished loading and downloading the font and the emoji set.
- **Block the font / the emoji set**: `page.route` aborts the requests for the font files or the emoji set files. **Block external services**: `page.route` records every request to an origin other than the app's (except Firebase Auth and Firestore).
- **Delayed request**: the request for the emoji set is held, without a response, until it is released.
- **Network failure on a file**: the request for the file is cut with a network error, whether the page or the service worker makes it, so the cut must also reach the service worker's requests (`page.route` does not see them). QA chooses how: `browserContext.route` if it intercepts them, or the version server of `e2e/versions-support.ts` closing the connection. A font file is any one of the Atkinson files (for example `atkinson-hyperlegible-next-latin-400-normal.woff2`).
- **Installed app**: the service worker is active and controls the page (`navigator.serviceWorker.controller`). It is the only wait that looks inside; what is verified afterwards is seen in the interface.
- **Open the app**: every opening goes through the loading screen. With the clock stopped it does not go away by itself: opening includes advancing the clock until it is gone, except in the steps that measure that time. Flows 1 to 8 start verifying once it is gone.
- **Screen time**: the seconds count from when the app starts and are measured with the simulated clock (`page.clock.runFor`): before the expected moment it stays open and on reaching it, it goes away.
- **Delay data**: the request to Firestore (or to Auth) is held until it is released.
- Create a task: tap **+**, type the title (and choose the emoji with the picker if the step says so), save.

## Observable contract

- **Font that draws a text**: the one the browser reports for the node (CDP `CSS.getPlatformFontsForNode`, family name). Atkinson is "Atkinson Hyperlegible Next"; the emoji set, "Noto Color Emoji"; "the system font" and "the device emoji" are any other.
- **Network requests**: those recorded by Playwright (`page.on("request")`).
- **Size and weight**: the height and width of the element's box (`boundingBox`) and its computed `font-size` and `font-weight`.
- **Loading screen**: the element with accessible name «Cargando» (`getByRole('img', { name: 'Cargando' })`). **Pulse**: the icon's `element.getAnimations()` has an animation running; **still**: it has none.
- **Reference texts**: title «Ñandú: camión 12:30», note «Año 2026 ✈», title with another alphabet «日本語».

## Flow 1: the whole app with the font

1. Create the task «Regar» with emoji 🌱 and note «Año 2026 ✈».
2. On **Pendientes**, the «Regar» row and the **Pendientes** tab are drawn with Atkinson; the 🌱 with Noto.
3. Go to **Historial**: the titles, the buttons, the fields and the tab bar are drawn with Atkinson.
4. Open the «Regar» panel: title, note, buttons (**Guardar**, **Pausar** or **Posponer** as applicable), the tabs and the fields are drawn with Atkinson; the ✈ in the note is drawn with Noto.
5. Open the emoji picker: its Recientes and all the emoji it shows are drawn with Noto; the picker's titles and buttons, with Atkinson.
6. Tap the «Regar» checkbox: the undo notice («Completaste «🌱 Regar»») is drawn with Atkinson and the 🌱 with Noto.
7. Close the panel with unsaved changes: the notice «Tenés cambios sin guardar» and its buttons are drawn with Atkinson.
8. Sign out: the sign-in screen is drawn with Atkinson.
9. Repeat 2 to 8 on **Phone** and on **Wide**, and in **Light theme** and in **Dark theme**: same result.

## Flow 2: which font draws each character

1. Create the task with title «Ñandú: camión ❤ 日本語 🌱», note «☀ ☎ © ™ #».
2. In the row and in the panel: «Ñandú: camión» is drawn with Atkinson; «❤» with Noto; «日本語» with the system font; «🌱» with Noto.
3. In the note: «☀» and «☎» with Noto; «©», «™» and «#» with Atkinson.
4. Paste into the title an emoji with ZWJ (👨‍👩‍👧), one with a tone (👍🏽) and a flag (🇦🇷): all three are drawn with Noto, each as a single image.

## Flow 3: no design changes, and times

1. With the font blocked (Flow 5, step 1) note the box size, `font-size` and `font-weight` of a row title, a button and a tab. Reload without blocking and compare them.
2. `font-size` and `font-weight` are equal; the visual hierarchy is kept: the row title is told apart from the note by weight (the size is the same), the panel heading is larger than the note and the chosen tab is highlighted. When creating and when editing a task, on **Phone** and on **Wide**, the panel's **Título** field is 20px of `font-size` and the **Nota** 16px, with the font available and with the font blocked.
3. Complete a task so that the Historial shows two entries «08:05» and «11:11»: both times take the same width and the digits are aligned in a column.

## Flow 4: offline and without external services

1. Block external services, open the app and go through Pendientes, Historial, the panel and the picker: no request went to an origin other than the app's, Firebase Auth or Firestore.
2. Wait for everything to download, go **Offline** and reload: the app opens with Atkinson and Noto.
3. Offline, open the picker and look for an emoji that was not used on that device (for example 🪼): it is drawn with Noto.
4. Offline, type 🪼 in the title of a new task: it is drawn with Noto.

## Flow 5: while they are not available

1. Block the font files and open the app: the loading screen is shown, with no fallback text in view, and it does not wait for the files that failed. When it goes away, all the text is drawn with the system font, none disappears, there is no notice or message.
2. Remove the block and reload: the text switches to Atkinson without touching anything else.
3. Block the emoji set and open the app: the loading screen does not wait for the set that failed. When it goes away, the emoji are drawn with the device ones, none blank, with no notice.
4. Remove the block and reload: they switch to Noto.
5. **Delayed request**: open the app with the set request delayed: the loading screen stays open until the 10 s cap, with no fallback emoji in view. When it goes away, the emoji are drawn with the device ones, none blank, with no notice. Release the request: the emoji switch to Noto without reloading or notice, and there was no second request.
6. **Aborted download**: open the app with **Network failure on a file** on the emoji set: the loading screen does not wait until the cap. When it goes away, the emoji are drawn with the device ones, none blank, with no notice. Go **Offline**, remove the failure and get the connection back, without reloading: the app requests the set again (a new request is recorded) and the emoji switch to Noto, with no notice.

## Flow 6: emoji the set does not have

Each opening starts with the loading screen (see **Open the app**); when the set is blocked, the screen does not wait for it.

1. Create a task with title «Prueba» and the emoji that Noto does not have (the character U+1FAFF, with no image assigned today, typed in the title).
2. Save: the task is saved; the row shows the character with the device emoji, not blank, with no error or notice.
3. Open the task again in the panel: the title keeps the character.
4. On another device B with the same account, the row shows the same character.
5. The emoji picker, with the set and without it, offers the same: 1914 base emoji grouped by category, with navigation between categories, and each with its variants of one skin tone. It does not offer the 9 emoji of the components group (the 5 skin tones and the 4 hair types alone) or the variants of two skin tones. Searching «planta», «escoba» or «perro» gives results, and choosing one assigns it to the task and closes the picker.
6. Put in the Firestore Emulator, as if they arrived by another route, one task for each lone hair type (🦰, 🦱, 🦳, 🦲) and another with 🧑🏻‍🤝‍🧑🏿 (two tones): the rows show them; when opening each task in the panel, changing the note and saving, it is saved and keeps its emoji, with no error.

## Flow 7: new version

1. With the app open on an earlier version, publish the version with the font and the emoji set.
2. Close the app and open it again: it is drawn with Atkinson and Noto, with no question or notice having appeared at any moment.

## Flow 8: the installation does not depend on the font or the set

In every case the loading screen is shown on opening and does not wait for what failed: it goes away before the 10 s cap, and never prevents installing or using the app.

First installation (each case in a new browser context, with nothing stored):

1. With **Network failure on a file** on the emoji set, open the app, sign in and create the task «Regar» with emoji 🌱. Wait for **Installed app**.
2. Go **Offline** and reload: the app opens, «Regar» is drawn with Atkinson and the 🌱 with the device emoji, not blank, with no notice or message about the font.
3. Remove the failure, get the connection back and, if needed, close the app and open it again once: the 🌱 switches to Noto with no notice. Go **Offline** and reload: the 🌱 stays with Noto, and so does one that was never seen on that device (🪼, typed in a title).
4. In another new context, with **Network failure on a file** on a font file, open the app, sign in and create the task. Wait for **Installed app**.
5. Go **Offline** and reload: the app opens, with no notice; the text that uses that file is drawn with the system font, never invisible. The 🌱 is drawn with Noto.
6. Remove the failure, get the connection back and, if needed, close the app and open it again once. Go **Offline** and reload: the text is drawn with Atkinson.
7. In another new context, make only the first request of each font file and of the set fail; the following ones respond. Open the app (the loading screen stops waiting for them as soon as they fail, even if the retries continue), sign in and, if needed, close it and open it again once: more than one request for those files is recorded. Go **Offline** and reload: Atkinson and Noto.

Update (the earlier version, without the font or the set, as in Flow 7):

8. With the earlier version installed, publish the new version with **Network failure on a file** on the emoji set. Close the app and open it again: the new version is applied, the text is drawn with Atkinson and the emoji with the device ones, with no question or notice at any moment.
9. Go **Offline** and reload: the app opens just the same, with Atkinson and the device emoji.
10. Remove the failure and get the connection back: repeat step 3 (they switch to Noto and stay available offline).
11. Repeat 8 to 10 with **Network failure on a file** on a font file instead of the set: the new version is applied (the emoji are drawn with Noto), the text that uses that file is drawn with the system font, and when the failure is removed it ends up with Atkinson also offline.

## Flow 9: loading screen

What is seen:

1. With the app code delayed, open the app: from the first thing it draws the loading screen is seen, with no blank page or empty content before.
2. The app icon is seen with a pulse, with the accessible name «Cargando», and no visible text, progress indicator or spinner. Tapping it does nothing.
3. With reduced motion (`page.emulateMedia({ reducedMotion: 'reduce' })`): the icon is seen still; everything else is the same.
4. In **Light theme** and in **Dark theme**, and on **Phone** and on **Wide**: it follows the system theme, with no flash of another color when it goes away.

When it appears:

5. It appears on opening, on reloading and on opening with a new version, and on both destination screens (`/`, `/history`).
6. With the app open, send it to the background and come back (open another tab and come back, with `visibilitychange`): it does not appear.
7. Without a session, tap **Entrar con Google** and complete the sign-in: the app goes from the sign-in screen to the app without it appearing.

What it waits for with a session:

8. With the app stored and everything available, reload: at 0.4 s it is still open, at 0.5 s it goes away, and the full list is seen.
9. With Auth delayed, beyond 10 s: it stays open until Auth responds, and then it goes away.
10. With each of the collections (tareas, completados) delayed in turn, 3 s: it stays open until 3 s and goes away when it responds.
11. In a new context, with Atkinson delayed and then with Noto delayed, 6 s: it stays open until 6 s; when it goes away, the text and the emoji are already drawn with Atkinson and with Noto, without having shown a fallback.
12. With the data delayed more than 10 s: it goes away at 10 s, with no notice, and the list completes by itself when they are released.

Without a session:

13. With Atkinson delayed: it stays open until it arrives and then gives way to the sign-in screen, which did not change.
14. With Noto delayed and Atkinson available: it does not wait for it, gives way to the sign-in screen at 0.5 s, and Noto keeps downloading. If the user signs in before it arrives, the emoji are drawn with the device ones and switch by themselves when it is released.
15. **Offline**, without Atkinson stored: it goes away at 0.5 s and gives way to the sign-in screen, with its usual message.

What will not arrive:

16. With a session, **Offline**, and without the set stored: reloading goes away at 0.5 s, without reaching the cap. The «Sin conexión» strip is seen only on entering; no notice appears on the loading screen.
17. With Noto delayed and the screen open, go **Offline** at 2 s: it goes away at that moment, not at 10 s.
18. With **Network failure on a file** on Noto at 2 s and the data delayed 5 s: it goes away at 5 s, when they respond.
19. With **Network failure on a file** on Noto and everything else ready: the minimum still applies: it goes away at 0.5 s, not before.

Noto cap remembered per device:

20. With a session and Noto delayed, reach the 10 s cap and enter the app with the device emoji. Without Noto having arrived, reload: with the data ready it goes away at 0.5 s, without waiting for it, and Noto keeps being requested behind.
21. On a device B with the same account, with Noto delayed: it does wait for it until the cap (what is remembered is not synced). In the Firestore Emulator there is no new document with that data.
22. Back on the first device, release Noto until it is stored. Publish a version that changes the set and delay it: the next opening waits for it again, until the cap. If it reaches the cap, the following one no longer waits for it.
23. In a new context, without a session and with Noto delayed, let more than 10 s pass; sign in and reload: that opening with a session does wait for Noto, because the time without a session does not count.

New version:

24. With Atkinson and Noto stored, publish a version that does not change them and open it: there is no new request for those files and the screen goes away at 0.5 s, with Atkinson and Noto.
