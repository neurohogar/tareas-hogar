# Package: portrait-orientation

The installed app is used in portrait orientation on the phone: opened from its icon, turning the phone does not put it in landscape (D5).

## Specs

- **S1** (§6): «the installed app is used in portrait. Opened from its icon on the phone, it never rotates: turning the phone does not put it in landscape.»
- **S2** (§6): «it applies to all the screens of the installed app (**Pendientes**, **Historial**, the panel and its notices, the sign-in screen and the loading screen, §6.6), without exceptions.»
- **S3** (§6): «either of the two portrait directions that the system allows; the app does not fix one.»
- **S4** (§6): «opened in a browser tab it keeps rotating as today and, in landscape, the usual wide layout is shown (§6.2, Wide screens). On the computer nothing changes: on a desktop screen the orientation is not chosen by the app, not even when installed.»
- **S5** (§6): «whoever already has the app installed receives the change by itself, without reinstalling, asking or notifying, like any new version (§8); the system may take a few openings to apply it.»
- **S6** (§8): «Manifest: `name` "Tareas Hogar", `short_name` "Tareas"; icon and colors with the palette of the app; portrait orientation (§6).»

## Decisions

- D1 (2026-11-05, analyst): in the installed app (D5), it applies to all its screens (Pendientes, Historial, Etiquetas, the panel, the sign-in screen and the loading screen), without exceptions: the request does not name any, and §6 treats presentation rules as global.
- D2 (2026-11-05, analyst): on the computer nothing changes: §1 places the phone use "in the moment, around the house", and on a desktop screen the orientation is not chosen by the app, not even when installed.
- D3 (2026-11-05, analyst): "portrait" is either of the two portrait directions that the system allows; fixing one is not requested.
- D4 (2026-11-05, analyst): whoever already has the app installed receives the change by itself, without reinstalling, asking or notifying, like any new version (§8), although the system may take a few openings to apply it.
- D5 (2026-11-05, user): «Fijar vertical en la app instalada: abierta desde su ícono no gira nunca. En una pestaña del navegador sigue girando como hoy y, en horizontal, se ve el diseño ancho de siempre.» (translation: «Lock portrait in the installed app: opened from its icon it never rotates. In a browser tab it keeps rotating as today and, in landscape, the usual wide layout is shown.»)

## Artifacts

- Gherkin: `features/portrait-orientation.feature` (S1, S2, S3, S4, S5, S6; the Gherkin verifies what the published manifest declares (S1, S3, S6, and the `display` that makes the orientation apply only in the installed app, S4); S2, S4, S5 are verified by `qa/portrait-orientation.md`)
- QA: `qa/portrait-orientation.md` (S1–S6)

## core

- **Allowed edits**: nothing. The feature has no domain rules: the orientation is declared by the manifest and applied by the system.
- **Rules**: none.
- **Reuses**: nothing.
- **Notes**: the `By core.` commit is empty (`git commit --allow-empty`).
- **Gate**: `node scripts/gate.ts core`

## acceptance

- **Allowed edits**: `acceptance/steps/orientacion-vertical.ts`, `acceptance/steps/index.ts`, `acceptance/steps/world.ts`, `static/manifest.webmanifest`, `docs/pipeline/pendientes.txt`
- **Features to connect**: `features/portrait-orientation.feature`
- **New steps** (all in `features/portrait-orientation.feature`):
  - `el manifest que publica la app`
  - `el campo <campo> del manifest es <valor>`
- **Notes**:
  - The steps read `static/manifest.webmanifest`, the file that the app links (`src/app.html`, `<link rel="manifest">`) and that the service worker precaches; there is no core to ask. `acceptance` may import `node:` (`scripts/check-arch.ts`).
  - The change of the feature is one line of the manifest, `"orientation": "portrait"` (not `portrait-primary`: S3), and it belongs to this role because it is what turns the acceptance green. See the scenario red before adding it.
  - The Then compares a field with a literal: it does not go through any oracle rule or need an equivalents filter.
- **Gate**: `node scripts/gate.ts acceptance`

## ui

- **Allowed edits**: nothing. The manifest was already changed by acceptance, and no screen fixes the orientation on its own: that way, in a browser tab it keeps rotating (S2, S4).
- **Visible behavior**: `qa/portrait-orientation.md`
- **Notes**: check that nothing in `src/` calls `screen.orientation` or rotates the content in landscape; if something does, `STATUS: BLOCKED`. The `By ui.` commit is empty (`git commit --allow-empty`).
- **Gate**: `node scripts/gate.ts ui`

## cleaner · architect · hardener · qa

They work on everything the feature changed (`git diff <feature base>`, noted in `tmp/base-de-feature`); they need no section of their own unless the gherkin-writer leaves a note for them here.

- **qa**: `e2e/pwa-sin-conexion.spec.ts` already verifies the manifest (`name`, `short_name`, `display`): add `orientation` there or in the new spec, without duplicating. The test browser neither installs the app nor rotates the screen: the rotation in a tab is simulated by changing the viewport (Flow 3).

## Log

- L1 (2026-11-05): «orientacion vertical» (translation: «portrait orientation»)
