# Package: retry-and-copy-notice

Two fixes to the already finished `annotation` feature: the app retries the four cleanups of §7 (orphan completions, orphan annotations, references to deleted labels and duplicate labels) when an attempt fails or there is no connection, and shows a brief, neutral text when the clipboard rejects **Copiar**.

## Specs

- **S1** (§7, D1, D8): «the four cleanups of this section (orphan completions, orphan annotations, references to deleted labels and duplicate labels) are retried if an attempt fails or there is no connection; they do not stay uncleaned until the app is reloaded.»
- **S2** (§7, D9): «It is retried when the connection returns and when the data changes, without timers.»
- **S3** (§7, D3, D8): «Each element is attempted separately: one failing (or there being no connection) does not prevent attempting the others of the batch.»
- **S4** (§7, D4, D9): «The retries are silent: no notice, counter or pending indicator.»
- **S5** (§6.7, D2, D6): «If the clipboard rejects the copy, the same kind of text with «No se pudo copiar», without more words»
- **S6** (§6.7, D5): «without buttons, it goes away by itself, it does not cover the undo notice (§5.4), and only one text is seen at a time (the last one replaces the previous one).»
- **S7** (§6.7, D7): «Nothing is copied and nothing else changes; the app does nothing else by itself and the person can tap **Copiar** again.»

## Decisions

- D1 (2026-11-13, user): «Reintentar en anotaciones y completados» (translation: «Retry in annotations and completions»): a single fix for both that retries the cleanup of orphans, so that «como un completado huérfano» (translation: «like an orphan completion») (§7) keeps holding.
- D2 (2026-11-13, user): «Mostrar un aviso breve» (translation: «Show a brief notice») when the clipboard rejects the write on tapping **Copiar** in Anotaciones: an informative, neutral text, for example «No se pudo copiar», without guilt or alarm.
- D3 (2026-11-13, analyst): each orphan is attempted separately: one failing (or there being no connection) does not prevent attempting the others of the batch. Because today the annotations one stops the whole batch at the first failure, and one bad orphan would leave the good ones uncleaned.
- D4 (2026-11-13, analyst): the cleanup and its retries are silent: no notice, counter or pending indicator. Because §7 («Aviso de conexión» (translation: «Connection notice»)) forbids indicators of pending changes and D6 of `anotacion` forbids counters.
- D5 (2026-11-13, analyst): the «no se pudo copiar» notice is like the «Anotaciones copiadas» one (§6.7): without buttons, it goes away by itself, and only one text at a time (the last one replaces the previous one). It does not cover the undo notice (§5.4). Because it is the same kind of brief, informative text and has to behave the same.
- D6 (2026-11-13, analyst): the exact text is «No se pudo copiar», the user's example in D2, without more words. Because the global rule is no guilt and no alarm, and that text meets it.
- D7 (2026-11-13, analyst): if the clipboard rejects the copy nothing is copied and nothing else changes (the app does nothing else by itself); the person can tap **Copiar** again. Because the app changes nothing by itself (docs/v3/plan.md).
- D8 (2026-11-13, user, scope of the retry): «Sí, las cuatro limpiezas (Recomendada)» (translation: «Yes, the four cleanups (Recommended)»). The retry also reaches the references to deleted labels and the merge of duplicate labels (§7). Reconciled with D3 and D4: what D3 says (each element is attempted separately, one failure does not stop the batch) and what D4 says (silent) hold for the four cleanups, not only for completions and annotations.
- D9 (2026-11-13, user, when it is retried): «Al volver la conexión y al cambiar los datos (Recomendada)» (translation: «When the connection returns and when the data changes (Recommended)»). Without timers. Reconciled with D4: it is not announced or counted when it is retried either.

## Artifacts

- Gherkin: `features/cleanups-retry.feature` (S1, S2, S3, S4, S5, S6, S7); QA-only (in the feature its header says so): S4, S5, S6, S7
- QA: `qa/retry-and-copy-notice.md`

## core

- **Allowed edits**: `src/lib/core/limpiezas*.ts` (new files: which elements of a cleanup are attempted, which were left to retry and when it is retried), `src/lib/core/*.test.ts` (all core tests)
- **Rules**: S1, S2, S3 (S4: the core returns nothing that the UI could show as a notice or a counter of pending items)
- **Reuses**: `completadosHuerfanos` and `anotacionesHuerfanas` (`borrado.ts`), `referenciasRotas` (`borrado-de-etiqueta.ts`) and `fusionDeDuplicadas` (`fusion-de-etiquetas.ts`) are still the ones that detect the elements to clean; their signatures are not modified.
- **Gate**: `~/Work/bdd-pipeline/bdd-pipeline gate core`

## acceptance

- **Allowed edits**: `acceptance/steps/limpiezas*.ts` (new files), `acceptance/steps/index.ts`, `acceptance/steps/world.ts`, `acceptance/oracle*.ts`, `acceptance/equivalence.ts`, `scripts/check-arch.ts` (the manual list of oracles, if one is added), `docs/pipeline/pendientes.txt`
- **Features to connect**: `features/cleanups-retry.feature`
- **New steps**:
  - `hay por limpiar <elementos> de <limpieza>` (`<limpieza>`: completados huérfanos, anotaciones huérfanas, referencias a etiquetas borradas or etiquetas duplicadas; `<elementos>`: ids separated by ", ")
  - `falla el intento de limpiar <fallan>` and `deja de fallar el intento de limpiar <fallan>` (`<fallan>`: ids separated by ", "; all the ids means "no connection")
  - `la app intenta las limpiezas` and `la app intentó las limpiezas`
  - `sucede que <suceso>` (`vuelve la conexión` or `cambian los datos`) and `pasan <minutos> minutos sin que suceda nada más`
  - `quedan limpios <limpios>` and `quedan por limpiar <pendientes>` (`ninguno` is the empty list)
- **Notes**: the oracle of `Then quedan limpios/quedan por limpiar` is written from §7: every element whose attempt does not fail is cleaned, only those that failed are left to clean, and without a new connection or a data change there is no new attempt (time does not count). The steps of the four cleanups share a handler: the cleanup only names which elements are involved.
- **Gate**: `~/Work/bdd-pipeline/bdd-pipeline gate acceptance`

## ui

- **Allowed edits**: `src/lib/ui/Sesion.svelte`, `src/lib/ui/Anotaciones.svelte`, `src/lib/ui/AnotarConfirmacion.svelte`, `src/lib/ui/en-linea.svelte.ts`, `src/lib/adapters/repositorio.ts`, `src/lib/adapters/anotaciones.ts`, `src/lib/adapters/conexion.ts`, `src/lib/adapters/portapapeles.ts`
- **Visible behavior**: `qa/retry-and-copy-notice.md`
- **Notes**: today `Sesion.svelte` adds the ids to `huerfanosEnLimpieza`, `anotacionesEnLimpieza`, `referenciasEnLimpieza` and `etiquetasEnFusion` and never removes them, and the adapters `limpiarHuerfanos`, `limpiarAnotacionesHuerfanas` and `limpiarReferencias` cut the batch (`return`) at the first failure; `copiar()` in `Anotaciones.svelte` returns without showing anything if `copiarAlPortapapeles` returns `false`. «No se pudo copiar» and «Anotaciones copiadas» share the same notice component (a single text at a time).
- **Gate**: `~/Work/bdd-pipeline/bdd-pipeline gate ui`

## cleaner · architect · hardener · qa

They work on everything the feature changed (`git diff <feature base>`, recorded in `tmp/base-de-feature`); they need no section of their own unless the gherkin-writer leaves a note for them here.

## Log

- L1 (2026-11-13): the user's original request, verbatim (the original words are in Spanish; below it, its translation): «1) «Reintentar en anotaciones y completados»: la limpieza de huérfanas (src/lib/ui/Sesion.svelte, efectos de `completadosHuerfanos` y `anotacionesHuerfanas`; adapters `limpiarHuerfanos` y `limpiarAnotacionesHuerfanas`) agrega los ids a un Set `…EnLimpieza` antes de limpiar y nunca los saca; si el intento falla o está sin conexión (el adapter hace `catch { return }`, y en el de anotaciones corta todo el lote al primer fallo) esas huérfanas no se reintentan hasta recargar la app. El usuario quiere un único arreglo para ambos que reintente, de modo que siga valiendo «como un completado huérfano» (§7 de docs/spec.md). 2) «Mostrar un aviso breve» cuando el portapapeles rechaza la escritura al tocar Copiar en Anotaciones (hoy `copiar()` en src/lib/ui/Anotaciones.svelte vuelve sin mostrar nada): un texto informativo y neutro, por ejemplo «No se pudo copiar», sin culpa ni alarma, como el resto de los avisos de la app (reglas globales de docs/v3/plan.md: sin culpa, la app no cambia nada sola).»

  (translation: «1) «Retry in annotations and completions»: the cleanup of orphans (src/lib/ui/Sesion.svelte, effects of `completadosHuerfanos` and `anotacionesHuerfanas`; adapters `limpiarHuerfanos` and `limpiarAnotacionesHuerfanas`) adds the ids to a Set `…EnLimpieza` before cleaning and never removes them; if the attempt fails or there is no connection (the adapter does `catch { return }`, and the annotations one cuts the whole batch at the first failure) those orphans are not retried until the app is reloaded. The user wants a single fix for both that retries, so that «like an orphan completion» (§7 of docs/spec.md) keeps holding. 2) «Show a brief notice» when the clipboard rejects the write on tapping Copiar in Anotaciones (today `copiar()` in src/lib/ui/Anotaciones.svelte returns without showing anything): an informative, neutral text, for example «No se pudo copiar», without guilt or alarm, like the rest of the notices of the app (global rules of docs/v3/plan.md: no guilt, the app changes nothing by itself).»)
