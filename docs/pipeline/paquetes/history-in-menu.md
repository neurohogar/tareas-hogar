# Package: history-in-menu

The fixed navigation bar goes away, on the phone and on wide screens: the way into the **Historial** becomes the first item of the **⋮** menu of **Pendientes**, and the **Historial** gets a «Volver» button in its header that behaves like **Back**.

## Specs

## Decisions

- D1 (2026-11-24, analyst): the new menu item has the text «Historial», is a plain item (no check mark, it is not an on/off item), is always enabled (also with the minimal mode on and with no completions, where the Historial shows «Todavía no completaste nada») and tapping it closes the menu and opens the **Historial**. Because «Historial» is the name of the screen (§6, §6.3) and §6.1 already demands that the menu always looks the same (D3 of menu-toggles); with no bar (D7) the item is the only way in, so it can never be disabled.
- D2 (2026-11-24, analyst): the route `/history` stays: a bookmark, the browser history or reloading there still opens the **Historial**. Because the request moves only the way in, not the screen, and §6.2 (**Reloading**) already relies on a reload returning to the same screen; D10 defines what «Volver» does in that case.
- D3 (2026-11-24, analyst): the content and behaviour of the list of the **Historial** (§6.3: entries, **Borrar** with its dialog, tapping an entry opens the panel, **Back** with the panel open closes it and stays on the Historial, §6.2) do not change; the only change on that screen is the «Volver» button of D8. Because the request does not touch the list, and D8 adds only the way back.
- D4 (2026-11-24, analyst): with the minimal mode on, the **Historial** is still the only way to open the panel of a non-essential task (§6.2) and of a completed one-off task (§6.1, §6.3); it is now reached only through the «Historial» item of the **⋮** menu, which the mode does not disable. Because D1 keeps the item always enabled and D7 removes the bar, so those rules keep exactly one way in.
- D5 (2026-11-24, analyst): the undo notice of §5.4 that is open when the «Historial» item or «Volver» is tapped stays open on the new screen with its 5 seconds running, and now sits at the bottom edge of the screen (D7). Because §5.4 already says the notice stays visible when changing screens, and neither the menu item nor «Volver» is a way to close it.
- D6 (2026-11-24, analyst): the rest of the menu does not change: **Modo mínimo**, «Completadas» and «Pausadas» stay on/off items next to each other and **Reprogramar vencidas** stays the last item, with its enabling rule and its preview; the menu now has five items (D9). Because the request only adds one item and D9 puts it first, without moving the others.
- D7 (2026-11-24, user, Q1 the bottom bar): «Desaparece del todo (Recomendada)» (translation: «It goes away completely (Recommended)»). Option description: on the phone and on wide screens; Pendientes takes up the whole screen and the + button and the undo notice drop to the bottom edge; the menu becomes the only way into the Historial.
- D8 (2026-11-24, user, Q2 the way back from the Historial): «Botón «Volver» en el encabezado (Recomendada)» (translation: ««Volver» button in the header (Recommended)»). Option description: an arrow with the accessible name «Volver» to the left of the «Historial» title, the same on the phone and on wide screens; the Historial has no ⋮ menu; there is always a visible way back, also in the installed app on the iPhone, which has no Back.
- D9 (2026-11-24, user, Q3 position of «Historial» in the ⋮ menu): «Primero (Recomendada)» (translation: «First (Recommended)»). Option description: Historial, Modo mínimo, Completadas, Pausadas, Reprogramar vencidas; the three on/off items stay together and Reprogramar vencidas stays last, as §6.1 says today.
- D10 (2026-11-24, user, Q4 what «Volver» leaves in the browser history): «Se comporta como Atrás (Recomendada)» (translation: «It behaves like Back (Recommended)»). Option description: it returns to Pendientes and a later Back does not reopen the Historial; if the Historial was opened directly (bookmark, reload or address), «Volver» opens Pendientes and replaces that entry; no extra Back that does nothing, consistent with the panel rule in §6.2.
- D11 (2026-11-24, analyst): opening the **Historial** from the menu item adds one entry to the browser history, so **Back** (Android or the browser gesture) on the **Historial** with nothing open returns to **Pendientes**, exactly like «Volver»; **Forward** after either reopens the **Historial**, as for any screen. Because D10 makes «Volver» equal to **Back**, and §6.2 limits the "no Forward" rule to the panel.
- D12 (2026-11-24, analyst): the header of the **Historial** (the «Volver» arrow and the title «Historial») scrolls with the content, like the header of **Pendientes** with its **⋮**; it is not fixed. With the panel open from the **Historial**, or the **Borrar** dialog open, «Volver» is covered like the rest of the screen and does nothing until they close (**Back** keeps its rules of §6.2). Because neither screen header is fixed today and the panel and the dialogs already block what is below them (§6.2, §6.3).
- D13 (2026-11-24, analyst): with the bar gone, nothing else takes its place: **Pendientes** has no other way into the **Historial** (no counter, link or gesture), and the content, the **+** button, the undo notice and the "Sin conexión" strip keep their rules, now measured from the bottom edge of the screen instead of from the bar, without covering the last row or entry. Because D7 says Pendientes takes up the whole screen and the menu becomes the only way in.
- D14 (2026-11-24, analyst): the old routes `/etiquetas` and `/anotaciones` keep opening **Pendientes** and replacing that entry (§6, **Navigation**). Because the request does not touch them; only the bar part of that paragraph goes away.

## What the spec-writer must rewrite in `docs/spec.md`

- **§6, Navigation** (line «a fixed bar with two tabs…»): remove the bar and the selected tab; say there are two screens, **Pendientes** (`/`) and **Historial** (`/history`), that the **Historial** is opened from the «Historial» item of the **⋮** menu (§6.1) or directly by its address (D2), and how one returns (D8, D10, D11). Keep the sentence about `/etiquetas` and `/anotaciones` (D14).
- **§6.1, Menu and minimal mode**: «a menu with four items» becomes five, in the order of D9, with «Historial» as a plain, always enabled item that closes the menu and opens the **Historial** (D1); «The menu has no other items» stays true with five. The sentence «The three on/off items are always enabled» stays.
- **§6.1, Reprogramar vencidas**: «the last item of the **⋮** menu, below "Pausadas"» stays true (D6, D9); no change, check only.
- **§6.1, + button** and **§5.4** (notice position): if the spec names the bar for their position, say they sit at the bottom edge (D7, D13). Today the spec does not name it; only the implementation does.
- **§6.3 History**: add the header: the «Volver» arrow (accessible name «Volver») to the left of the title «Historial», the same on the phone and on wide screens, no **⋮** menu (D8), its behaviour (D10, D11) and that it scrolls with the content (D12). The sentence «the **Historial** is the only way to open it» stays.
- **§6.2, panel opened from the Historial** (the minimal-mode paragraph «The panel of a non-essential task is opened from the **Historial**…» and **Back**): no change in rule; at most say the Historial is reached from the menu (D4).
- **§6, Orientation** and **§6.6 Loading screen**: they list screens, not the bar; no change (check only). **§6.2, Over the panel** speaks of the panel's own tab bar and **Guardar** bar, not the navigation bar; no change.

## Open questions (for the user)

None: Q1 to Q4 were answered in D7 to D10.

## Previous artifacts that assume the bar or the tabs (for the gherkin-writer)

No `.feature` depends on the bar (`features/history.feature` queries the core; `features/panel-back.feature` only names the Historial screen in a comment). These do:

- **e2e helper**: `e2e/support.ts` (`goA(page, tab)` clicks a link inside the `navigation` region; `Tab = "Pendientes" | "Historial"`). With D7 to D10 it must open **⋮** and tap «Historial» to go to the Historial, and tap «Volver» to go back to Pendientes. Every spec that calls `goA` breaks: `block-reschedule`, `bundled-font`, `emoji-and-note`, `first-step`, `history-undo`, `last-time`, `menu-toggles`, `minimal-mode`, `minimal-version`, `navigation-on-top`, `navigation`, `one-step-at-a-time`, `panel-mobile`, `pause`, `portrait-orientation`, `postpone`, `pwa-offline`, `retry-and-copy-notice`, `schedule`, `show-completed`, `unsaved-changes` (all `e2e/<name>.spec.ts`).
- **Specs about the bar itself**: `e2e/navigation.spec.ts` (two tabs, order, `aria-current`, `/history`), `e2e/navigation-on-top.spec.ts` (rows and entries do not cover the tabs), `e2e/menu-toggles.spec.ts` (the menu has exactly four items), `e2e/block-reschedule.spec.ts` (Reprogramar vencidas stays the last item by D9; check that it does not count or index the items from the top, now that «Historial» is first).
- **Specs that open `/history` by address** (keep working by D2): `e2e/bundled-font-screen.spec.ts`, `e2e/portrait-orientation.spec.ts`, `e2e/pwa-offline.spec.ts`, `e2e/history-undo.spec.ts`, `e2e/navigation.spec.ts`.
- **QA procedures**: `qa/navigation.md` (whole bar: two tabs, selection, no counter), `qa/menu-toggles.md` and `qa/block-reschedule.md` (items and order of the menu), `qa/history-undo.md` (goes to Historial by the tab many times, URL `/history`), `qa/panel-mobile.md` (Back with the panel opened from Historial; layout above the bar), `qa/unsaved-changes.md`, `qa/portrait-orientation.md`, `qa/pwa-offline.md`, `qa/retry-and-copy-notice.md` (undo notice above the bar), `qa/show-completed.md`, `qa/minimal-mode.md`, `qa/last-time.md`, `qa/one-step-at-a-time.md`, `qa/first-step.md`, `qa/minimal-version.md`, `qa/pause.md`, `qa/postpone.md`, `qa/schedule.md`, `qa/guilt-free-status.md`, `qa/bundled-font.md`, `qa/emoji-and-note.md`, `qa/edit-delete.md`, `qa/one-off.md`, `qa/pending-order.md`, `qa/recurring-calendar.md`, `qa/recurring-relative.md`.
- **Layout tied to the bar** (goes away or moves to the bottom edge by D7, D13): `src/lib/ui/Navigation.svelte` and its use in `src/lib/ui/Session.svelte`; `--navigation-height` in `src/lib/ui/styles.css` (bottom padding of the content); the **+** button in `src/lib/ui/Pending.svelte` and the undo notice in `src/lib/ui/UndoNotice.svelte`, which sit above the bar; the z-index comments «Above the navigation bar» in `src/lib/ui/History.svelte` and `src/lib/ui/TaskPanel.svelte`. The «Historial» item goes in the menu of `src/lib/ui/Pending.svelte` and «Volver» in the header of `src/lib/ui/History.svelte`.

## Artifacts

## core

## acceptance

## ui

## cleaner · architect · hardener · qa

## Log

- L1 (2026-11-24): «quiero q pases la opcion de historial al menu de tres puntos» (translation: «I want you to move the Historial option to the three-dots menu»).
