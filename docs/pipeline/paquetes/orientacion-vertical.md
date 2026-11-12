# Paquete: orientacion-vertical

La app instalada se usa en orientación vertical en el celular: abierta desde su ícono, girar el teléfono no la pasa a horizontal (D5).

## Specs

- **S1** (§6): «la app instalada se usa en vertical. Abierta desde su ícono en el celular, no gira nunca: girar el teléfono no la pasa a horizontal.»
- **S2** (§6): «rige en todas las pantallas de la app instalada (Pendientes, Historial, Etiquetas, el panel y sus avisos, la pantalla de entrada y la pantalla de carga, §6.6), sin excepciones.»
- **S3** (§6): «cualquiera de los dos sentidos verticales que el sistema permita; la app no fija uno.»
- **S4** (§6): «abierta en una pestaña del navegador sigue girando como hoy y, en horizontal, se ve el diseño ancho de siempre (§6.2, Pantallas anchas). En la compu no cambia nada: en una pantalla de escritorio la orientación no la elige la app, tampoco instalada.»
- **S5** (§6): «quien ya tiene la app instalada recibe el cambio solo, sin reinstalar, preguntar ni avisar, como toda versión nueva (§8); el sistema puede tardar algunas aperturas en aplicarlo.»
- **S6** (§8): «Manifest: `name` "Tareas Hogar", `short_name` "Tareas"; ícono y colores con la paleta de la app; orientación vertical (§6).»

## Decisiones

- D1 (2026-11-05, analyst): en la app instalada (D5), rige en todas sus pantallas (Pendientes, Historial, Etiquetas, el panel, la pantalla de entrada y la de carga), sin excepciones: el pedido no nombra ninguna y la §6 trata las reglas de presentación como globales.
- D2 (2026-11-05, analyst): en la compu no cambia nada: la §1 la ubica en el celular "en el momento, por la casa", y en una pantalla de escritorio la orientación no la elige la app, tampoco instalada.
- D3 (2026-11-05, analyst): "vertical" es cualquiera de los dos sentidos verticales que el sistema permita; no se pide fijar uno.
- D4 (2026-11-05, analyst): quien ya tiene la app instalada recibe el cambio solo, sin reinstalar, preguntar ni avisar, como toda versión nueva (§8), aunque el sistema puede tardar algunas aperturas en aplicarlo.
- D5 (2026-11-05, usuario): «Fijar vertical en la app instalada: abierta desde su ícono no gira nunca. En una pestaña del navegador sigue girando como hoy y, en horizontal, se ve el diseño ancho de siempre.»

## Artefactos

- Gherkin: `features/orientacion-vertical.feature` (S1, S2, S3, S4, S5, S6; el Gherkin verifica lo que declara el manifest publicado (S1, S3, S6, y el `display` que hace que la orientación rija solo en la app instalada, S4); S2, S4, S5 los verifica `qa/orientacion-vertical.md`)
- QA: `qa/orientacion-vertical.md` (S1–S6)

## core

- **Puede editar**: nada. La feature no tiene reglas de dominio: la orientación la declara el manifest y la aplica el sistema.
- **Reglas**: ninguna.
- **Reusa**: nada.
- **Notas**: el commit `By core.` va vacío (`git commit --allow-empty`).
- **Gate**: `node scripts/gate.ts core`

## acceptance

- **Puede editar**: `acceptance/steps/orientacion-vertical.ts`, `acceptance/steps/index.ts`, `acceptance/steps/world.ts`, `static/manifest.webmanifest`, `docs/pipeline/pendientes.txt`
- **Features a conectar**: `features/orientacion-vertical.feature`
- **Pasos nuevos** (todos en `features/orientacion-vertical.feature`):
  - `el manifest que publica la app`
  - `el campo <campo> del manifest es <valor>`
- **Notas**:
  - Los pasos leen `static/manifest.webmanifest`, el archivo que la app enlaza (`src/app.html`, `<link rel="manifest">`) y que el service worker precachea; no hay core que preguntar. `acceptance` puede importar `node:` (`scripts/check-arch.ts`).
  - El cambio de la feature es una línea del manifest, `"orientation": "portrait"` (no `portrait-primary`: S3), y va en este rol porque es lo que deja la aceptación en verde. Ver el escenario en rojo antes de agregarla.
  - El Then compara un campo con un literal: no pasa por ninguna regla del oráculo ni necesita filtro de equivalentes.
- **Gate**: `node scripts/gate.ts acceptance`

## ui

- **Puede editar**: nada. El manifest ya lo cambió acceptance, y ninguna pantalla fija la orientación por su cuenta: así en una pestaña del navegador sigue girando (S2, S4).
- **Comportamiento visible**: `qa/orientacion-vertical.md`
- **Notas**: verificar que nada en `src/` llama a `screen.orientation` ni gira el contenido en horizontal; si algo lo hace, `STATUS: BLOCKED`. El commit `By ui.` va vacío (`git commit --allow-empty`).
- **Gate**: `node scripts/gate.ts ui`

## cleaner · architect · hardener · qa

Trabajan sobre todo lo que cambió la feature (`git diff <base de la feature>`, anotada en `tmp/base-de-feature`); no necesitan sección propia salvo que el gherkin-writer anote algo para ellos acá.

- **qa**: `e2e/pwa-sin-conexion.spec.ts` ya verifica el manifest (`name`, `short_name`, `display`): sumar `orientation` ahí o en el spec nuevo, sin duplicar. El navegador de pruebas no instala la app ni gira la pantalla: el giro en pestaña se simula cambiando el viewport (Flujo 3).

## Log

- L1 (2026-11-05): orientacion vertical
