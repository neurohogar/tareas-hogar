# Package: history-in-menu

The way into the **Historial** moves from the fixed navigation bar to the **⋮** menu of **Pendientes**.

## Specs

## Decisions

- D1 (2026-11-24, analyst): the new menu item has the text «Historial», is a plain item (no check mark, it is not an on/off item), is always enabled (also with the minimal mode on and with no completions, where the Historial shows «Todavía no completaste nada») and tapping it closes the menu and opens the **Historial**. Because «Historial» is the name of the screen (§6, §6.3) and §6.1 already demands that the menu always looks the same (D3 of menu-toggles).
- D2 (2026-11-24, analyst): the route `/history` stays: a bookmark, the browser history or reloading there still opens the **Historial**. Because the request moves only the way in, not the screen, and §6.2 (**Reloading**) already relies on a reload returning to the same screen.
- D3 (2026-11-24, analyst): the content and behaviour of the **Historial** (§6.3: entries, **Borrar** with its dialog, tapping an entry opens the panel, **Back** with the panel open closes it and stays on the Historial, §6.2) do not change. Because the request does not touch them.
- D4 (2026-11-24, analyst): with the minimal mode on, the **Historial** is still the only way to open the panel of a non-essential task (§6.2) and of a completed one-off task (§6.1, §6.3); it is now reached through the menu item. Because D1 keeps the item always enabled, so those rules keep their way in.
- D5 (2026-11-24, analyst): the undo notice of §5.4 that is open when the item is tapped stays open on the **Historial** with its 5 seconds running, as today when changing tab. Because the request does not touch the notice.
- D6 (2026-11-24, analyst): the rest of the menu does not change: **Modo mínimo**, «Completadas» and «Pausadas» stay on/off items next to each other and **Reprogramar vencidas** keeps its enabling rule and its preview. Because the request only adds one item.

## Open questions (for the user)

- Q1 (navigation bar): with Historial in the menu, what happens to the bottom bar?
- Q2 (way back from the Historial): how does the person go back from the Historial to Pendientes?
- Q3 (place in the menu): where does «Historial» go among the four current items?
- Q4 (only if Q2 = button «Volver»): what does that button leave behind in the browser history?

## Previous artifacts that assume the bar or the tabs (for the gherkin-writer)

No `.feature` depends on the bar (`features/history.feature` queries the core; `features/panel-back.feature` only names the Historial screen in a comment). These do:

- **e2e helper**: `e2e/support.ts` (`goA(page, tab)` clicks a link inside the `navigation` region; `Tab = "Pendientes" | "Historial"`). Every spec that calls `goA` breaks: `block-reschedule`, `bundled-font`, `emoji-and-note`, `first-step`, `history-undo`, `last-time`, `menu-toggles`, `minimal-mode`, `minimal-version`, `navigation-on-top`, `navigation`, `one-step-at-a-time`, `panel-mobile`, `pause`, `portrait-orientation`, `postpone`, `pwa-offline`, `retry-and-copy-notice`, `schedule`, `show-completed`, `unsaved-changes` (all `e2e/<name>.spec.ts`).
- **Specs about the bar itself**: `e2e/navigation.spec.ts` (two tabs, order, `aria-current`, `/history`), `e2e/navigation-on-top.spec.ts` (rows and entries do not cover the tabs), `e2e/menu-toggles.spec.ts` (the menu has exactly four items), `e2e/block-reschedule.spec.ts` (Reprogramar vencidas is the last item, if Q3 moves it).
- **Specs that open `/history` by address** (keep working by D2): `e2e/bundled-font-screen.spec.ts`, `e2e/portrait-orientation.spec.ts`, `e2e/pwa-offline.spec.ts`, `e2e/history-undo.spec.ts`, `e2e/navigation.spec.ts`.
- **QA procedures**: `qa/navigation.md` (whole bar: two tabs, selection, no counter), `qa/menu-toggles.md` and `qa/block-reschedule.md` (items and order of the menu), `qa/history-undo.md` (goes to Historial by the tab many times, URL `/history`), `qa/panel-mobile.md` (Back with the panel opened from Historial; layout above the bar), `qa/unsaved-changes.md`, `qa/portrait-orientation.md`, `qa/pwa-offline.md`, `qa/retry-and-copy-notice.md` (undo notice above the bar), `qa/show-completed.md`, `qa/minimal-mode.md`, `qa/last-time.md`, `qa/one-step-at-a-time.md`, `qa/first-step.md`, `qa/minimal-version.md`, `qa/pause.md`, `qa/postpone.md`, `qa/schedule.md`, `qa/guilt-free-status.md`, `qa/bundled-font.md`, `qa/emoji-and-note.md`, `qa/edit-delete.md`, `qa/one-off.md`, `qa/pending-order.md`, `qa/recurring-calendar.md`, `qa/recurring-relative.md`.
- **Layout tied to the bar**: `--navigation-height` in `src/lib/ui/styles.css` (bottom padding of the content), the **+** button in `src/lib/ui/Pending.svelte` and the undo notice in `src/lib/ui/UndoNotice.svelte` sit above the bar.

## Artifacts

## core

## acceptance

## ui

## cleaner · architect · hardener · qa

## Log

- L1 (2026-11-24): «quiero q pases la opcion de historial al menu de tres puntos» (translation: «I want you to move the Historial option to the three-dots menu»).
