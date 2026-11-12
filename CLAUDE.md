# Tareas Hogar v3 — Constitución del proyecto

PWA personal de tareas del hogar (TDAH-friendly). Qué construir: `docs/spec.md`. Por qué el proceso es así: `docs/research/uncle-bob-workflow.md`.

En este proyecto rige el **pipeline de 10 roles** de este archivo; reemplaza al protocolo Worker/Reviewer (`.harness_task_*`) del `AGENTS.md` global. Los gates deterministas cumplen la función del reviewer.

## Pipeline

Cada feature atraviesa, en orden, diez subagentes de `.claude/agents/`:

`analyst` ⇄ *(usuario)* → `spec-writer` → `gherkin-writer` → *(aprobación humana)* → `core` → `acceptance` → `ui` → `cleaner` → `architect` → `hardener` → `qa`

Los tres roles de especificación (analyst, spec-writer, gherkin-writer) trabajan en el checkout principal; los siete de implementación se suceden en un único worktree compartido, cada uno sobre el commit del anterior. Cada rol deja un commit y reporta al orquestador. **Orquestar una feature** (crear worktrees, lanzar roles, merges, sync, fallas): leer `docs/pipeline/orchestration.md`.

Un rol es dueño solo de lo que su archivo dice que posee; lo demás lo hace otro rol más adelante en la cadena.

## Arquitectura

| Capa | Ruta | Contenido | Herramientas de test |
|---|---|---|---|
| Core | `src/lib/core/` | TypeScript puro: reglas de la §5 del spec, ordenamiento, modelos. Recibe "ahora" como parámetro. | Sí: unit, aceptación, cobertura, CRAP, DRY, mutación, property tests |
| Adapters | `src/lib/adapters/` | Firebase (Auth, Firestore), reloj, IDs. Cáscaras finas que traducen. | No |
| UI | `src/routes/`, `src/lib/ui/` | Componentes `.svelte`. Le preguntan al core y muestran el resultado. | No (los cubre la suite QA) |

- Las dependencias apuntan hacia `core/`. `core/` importa solo de `core/`.
- La UI y los adapters **preguntan al core**; cada regla del dominio existe en un solo lugar, el core.
- Toda lógica que pueda vivir en `core/` vive ahí; los adapters y la UI quedan lo más chicos posible.

## Contrato de scripts (`package.json`)

Los crean los roles que los necesitan; todos los roles los usan por nombre.

| Script | Hace |
|---|---|
| `npm test` | Unit + aceptación generada (Vitest). Es el que corre `mutator`. |
| `npm run test:unit` | Solo unit tests. |
| `npm run acceptance` | Para cada `features/*.feature`: parsear a IR → generar → correr. |
| `npm run acceptance:mutate -- features/<x>.feature [--level hard\|soft\|full]` | `gherkin-mutator` sobre un feature (ruta completa) con el runner adapter y el filtro de equivalentes del proyecto. |
| `npm run coverage` | Vitest con cobertura LCOV. |
| `npm run test:props` | Property tests (fast-check). Separados de `npm test`. |
| `npm run check:arch` | Checks de dependencias e imports prohibidos. |
| `npm run qa` | Scripts Playwright de la suite QA contra Firebase Emulator Suite. |

## Herramientas de calidad

Clonadas junto al repo en `~/Work/`. Usar estas, con estas invocaciones; un gate solo cuenta si lo midió la herramienta oficial.

| Gate | Comando (desde la raíz del worktree) | Pasa cuando |
|---|---|---|
| CRAP | `~/Work/bdd-pipeline/bdd-pipeline gate cleaner` (corre crapper con la cobertura de los features implementados) | exit 0 (peor CRAP ≤ 10) |
| DRY | `~/Work/vendor/dryer/dryer src/lib/core` | sin candidatos nuevos sin justificar |
| Mutación (scan) | `~/Work/vendor/mutator/mutator --scan <archivo>` | — (pista de módulo con más de un trabajo) |
| Mutación | `~/Work/vendor/mutator/mutator --max-workers 4 <archivo>` | exit 0 (ningún mutante sobrevive) |
| Gherkin parse | `bb --config ~/Work/vendor/Acceptance-Pipeline-Specification/bb.edn gherkin-parser <feature> ./tmp/<stem>.json` | exit 0 |
| Gherkin DRY | `bb --config ~/Work/vendor/Acceptance-Pipeline-Specification/bb.edn gherkin-ir-dry-checker <ir> ./tmp/<stem>.dry.json` | reporte revisado |
| Gherkin mutación | `npm run acceptance:mutate -- features/<x>.feature --level soft` | exit 0 |

Filtro de equivalentes de Gherkin: `acceptance/oracle.ts` es un oráculo reescrito desde `docs/spec.md`, independiente del core y de los step handlers (lo hace cumplir `check:arch`). Cada regla nueva del spec que entra en un Then de clasificación se agrega al oráculo; un filtrado se justifica con la regla del spec que lo hace equivalente, nunca con lo que devuelve la implementación.

Especificaciones de APS (formato Gherkin, IR, generador, runner adapter): `~/Work/vendor/Acceptance-Pipeline-Specification/*.md`.

Reglas de uso:

- Una herramienta a la vez, en secuencia.
- Mutación: un archivo por vez, siempre diferencial (el default). Los snapshots en `.metrics/` son el manifest: se commitean y solo los modifican las herramientas.
- Workers: `--max-workers 4` / `--workers 4`.
- **CRAP**: un único `switch` que responde una sola pregunta puede quedar sobre 10. Funciones anidadas o de doble propósito sobre 10 se dividen, y cada función extraída es dueña de sus entradas (nada de pasarle booleanos que el llamador ya conocía).
- Mutación del Gherkin: `--level soft` decide qué remutar solo por el contenido del `.feature`. Si cambian step handlers, el runtime de `acceptance/` o el filtro de equivalentes, se usa `--level full` solo en los features con al menos un paso atendido por un handler cambiado, o con un Then que pasa por una regla cambiada del oráculo; el resto queda en `--level soft`. El rol acceptance lista en su reporte qué handlers y reglas del oráculo cambió.
- Un módulo con más de un trabajo se divide antes de mutarlo. Un módulo de un solo trabajo queda entero aunque tenga muchos sitios de mutación.

## Gherkin (formato APS)

- Keywords en inglés (`Feature`, `Background`, `Scenario Outline`, `Examples`, `Given/When/Then/And`); texto de pasos en español.
- Sin tags, `Rule`, doc strings ni data tables en pasos.
- Todo valor que pueda variar va como `<parametro>` en una tabla `Examples`: solo esos valores se mutan.
- Fechas y horas en ISO-8601 (`2026-07-15T08:00:00`), así el mutador las corre ± en el tiempo.

## Git

- Rama de integración: `v3`. Worktree compartido de implementación: `~/Work/tareas-hogar-worktrees/pipeline` en la rama `wt/pipeline`.
- Trabajar solo en el worktree asignado en el prompt; mergear solo lo que el prompt indica (el core mergea `v3`; los demás roles no mergean).
- Formato de commit:

  ```
  <resumen en imperativo>

  By <rol>.

  Co-Authored-By: Claude <Modelo> <noreply@anthropic.com>
  (o Co-Authored-By: Google Gemini <Modelo> <noreply@google.com> en roles ejecutados con Gemini)
  ```

  El trailer es para tracking de qué hizo la IA en este proyecto: va siempre, aunque otra regla general prohíba la atribución en commits. `<Modelo>` es el modelo con el que corre el rol (`Opus 5.5`, `Sonnet 5.5`, `Haiku 5.5`, `3.8 Flash`); el prompt de lanzamiento trae la línea exacta en `Firma:`.

- Después de un merge que trae cambios en `package-lock.json`, o en un worktree sin `node_modules`: `npm ci`.
- Archivos temporales en `./tmp/` del worktree (ignorado por git).
- Antes de reportar, todos los roles corren `~/Work/bdd-pipeline/bdd-pipeline gate <rol>` y lo dejan en `OK`. No uses `npm run acceptance` ni `npm run coverage` a secas como criterio: corren también los features de `pendientes.txt`, que fallan hasta que se implementan.

## Gate del rol

`~/Work/bdd-pipeline/bdd-pipeline gate <rol>` (desde el worktree) corre exactamente lo que el rol tiene que dejar en verde: árbol limpio, último commit con `By <rol>.`, que core, acceptance y ui solo tocaron los archivos que les permite su sección del paquete (`docs/pipeline/paquetes/<feature>.md`), y los checks de su rol. Los roles de especificación no tienen tests: su gate verifica el paquete (L1 en el log; cada `S#` citado textual de `docs/spec.md`; para gherkin-writer, además, cada `S#` cubierto por un `.feature` que parsea y figura en `pendientes.txt`, y las superficies de core, acceptance y ui). Correrlo antes de reportar `DONE`. Al terminar un rol, el hook `SubagentStop` lo corre solo; si falla, el error vuelve al rol para que lo corrija. Si el gate ya pasó en ese commit, no repite sus pasos; borrar `tmp/gate-verde-<rol>` lo fuerza.

`docs/pipeline/pendientes.txt` lista los features ya especificados que todavía no se implementaron: el gate no los cuenta en la aceptación. El gherkin-writer agrega ahí los suyos; el rol acceptance quita los de la feature que conecta.

## Reporte al orquestador

Cada rol termina con un mensaje corto:

```
STATUS: DONE | BLOCKED | QUESTION
COMMIT: <sha>
GATES: <gate>=<resultado>, ...
NOTES: <una a tres líneas; si BLOCKED/QUESTION, qué hace falta>
LEARNINGS: <opcional: una línea por trampa que encontraste y que el próximo rol pisaría>
```

Escribí ese mismo texto en `tmp/reporte-<rol>.txt` del directorio donde trabajás, con ruta absoluta, antes de terminar: si te interrumpen, es lo que lee el orquestador. En un subagente el `cd` no persiste entre llamadas, y con una ruta relativa el archivo iría al checkout principal.

Nada más: el detalle del trabajo va en el mensaje del commit, no en el reporte. Los datos que el rol siguiente necesita (firmas exportadas, pasos nuevos) van en `NOTES`.

## Aprendizajes

Las trampas que ya pisó cada rol viven en **Engram** (proyecto `tareas-hogar`), una memoria por rol con `topic_key` `pipeline/aprendizajes/<rol>`. El orquestador trae la tuya en el prompt de lanzamiento, bajo «Aprendizajes del rol»: leela antes de empezar. No hace falta buscarla.

Los roles **no escriben** en Engram: reportan sus trampas en `LEARNINGS` y el orquestador las agrega. Si el prompt no los trae, seguí sin ellos y decilo en `NOTES`.
