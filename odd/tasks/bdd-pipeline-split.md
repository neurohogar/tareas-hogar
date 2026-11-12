Objective: move the BDD pipeline workflow out of tareas-hogar into its own reusable repository, `~/Work/bdd-pipeline`, invoked as a CLI with per-project config.
Branch: tareas-hogar `split-bdd-pipeline` (from `v2`); new repo `~/Work/bdd-pipeline` on `main`. Delivery: local commits per work unit; no push or PR (user decision required).
Test runner: Vitest (`tests/` in bdd-pipeline; `npm run test:scripts` today), `bb` for the Clojure mutation extension.

## Specs

- S1: The workflow lives in its own repository (user choice: «Workflow en su repo»): «El pipeline pasa a un repo propio en ~/Work, reutilizable en otros proyectos, y tareas-hogar lo usa desde ahí. Quedan en la app solo sus features, su spec, sus paquetes y su configuración.»
- S2: Distribution (user choice: «CLI con config»): «El repo vive en ~/Work y se invoca por ruta, como mutator y crapper. tareas-hogar tiene un archivo de config con rutas, ramas y los pasos de cada rol, y un comando instala los agentes en `.claude/agents/` y conecta el hook.»
- S3: Name (user choice: «bdd-pipeline»): the repository is `~/Work/bdd-pipeline`.
- S4: What stays in tareas-hogar (from the question text the user answered): «sus reglas: step handlers, oráculo, features, paquetes, `check-arch` y los datos de su stack.»
- S5: Behavior preserved (assumption, not a user string): every role gate, `pipeline.ts`, `progreso.ts`, the SubagentStop hook, acceptance generation and Gherkin mutation give the same results on tareas-hogar before and after the split.

## Tasks

| ID | S# | Task | Route | Status | Commit |
|---|---|---|---|---|---|
| T1 | S1, S3, S5 | Create `~/Work/bdd-pipeline` with its git history start, the config loader, and the generic engine moved from `scripts/` (gate, pipeline, progreso, hook, runner worker, mutation extension) with their tests, reading every tareas-hogar fact from config | delegated (context backstop) | done | bdd-pipeline 158b1c8..29fb589 |
| T2 | S1, S5 | Injection seams: acceptance runtime/generator take the project steps module by config; mutation filter takes the project equivalence module by config | delegated (context backstop) | done | bdd-pipeline 121ccdb, b43c3c7 |
| T3 | S2 | Agent templates and `bdd-pipeline install`: writes `.claude/agents/*.md` from templates plus project overlay, and wires the SubagentStop hook | delegated (context backstop) | done | bdd-pipeline 2faa93b |
| T4 | S1, S4 | Docs: orchestration and the generic CLAUDE.md sections move to bdd-pipeline; tareas-hogar CLAUDE.md keeps the project parts and points to the repo | delegated (context backstop) | done | bdd-pipeline c6bb265 |
| T5 | S2, S4, S5 | tareas-hogar cutover: `bdd-pipeline.config.json`, package.json scripts call the CLI, moved files removed, worktree synced; differential check of every gate against the pre-split commit | delegated (context backstop) | done | tareas-hogar 360322b |
| T6 | S5 | Independent verification of the whole split (Risk items 3 and 5) | delegated (verification trigger) | done | tareas-hogar and bdd-pipeline 100% pass |

Route evidence: the parent session is past the long-session context backstop, so each unit goes to one bounded writer, in sequence (each depends on the previous). Risk: item 3 (gate and hook are contracts the role agents consume) and item 5 (developer tooling and environment).

## Log

- L1 (2026-11-05, user): «quiero separar el proyecto de las tareas del workflow tipo pipeline bdd»
- L2 (2026-11-05, user, AskUserQuestion «Separar»): «Workflow en su repo (Recommended)».
- L3 (2026-11-05, user, AskUserQuestion «Distribución»): «CLI con config (Recommended)».
- L4 (2026-11-05, user, AskUserQuestion «Nombre»): «bdd-pipeline».
- L5 (2026-11-05, parent): state before the split: v2, wt/pipeline and wt/ui-ux at d34ef81; no feature in flight (orientacion-vertical and fuente-empaquetada closed). Read-only map done: generic engine with hard-coded tareas-hogar facts in gate.ts, gate-hook.sh, pipeline.ts, progreso.ts, acceptance-mutate.ts, acceptance/build.ts, agents, orchestration.md and CLAUDE.md; seams needed in acceptance runtime (`./steps`) and mutation-equivalence (project oracle).
- L6 (2026-11-05, T1): bdd-pipeline created, 6 commits, CLI `bdd-pipeline` with gate/next/follow/hook/acceptance-mutate, config `bdd-pipeline.config.json` (example in examples/tareas-hogar.config.json). Tests: bb 8 tests, Vitest 76 passed; parent spot check re-ran `npm test`. Differential vs old scripts: 37 cases, 1 difference (hook with non-JSON input no longer prints jq errors on stderr; exit code same). Open for T5/T6: real `acceptance-mutate` run end to end; the bdd-pipeline path must have no spaces (APS splits --runner-worker on whitespace); `commands.*` in config still name `node scripts/...` for byte-identical output, T5 switches them.
- L7 (2026-11-05, T2): generic acceptance runtime and `generate` command in bdd-pipeline; seams `acceptance.stepsModule` and `acceptance.equivalenceModule` (replaces `equivalenceEntry`). End to end on a clone: 1153 acceptance tests pass old and new; acceptance-mutate --level full gives the same verdicts (orientacion-vertical 8 killed; crear-periodica-relativa 22 killed, 1 equivalent). Parent decision: keep `acceptance/ir.ts` as a one-line re-export from bdd-pipeline. Open: the generated entrypoint header still names `acceptance/generator.ts`; the bdd-pipeline tests leave `/tmp/bdd-pipeline-tests-*` directories; a fresh clone needs `npx svelte-kit sync` before Vitest.
- L8 (2026-11-05, T3): Agent templates in templates/agents/, overlay in examples/tareas-hogar/bdd-pipeline/agents/, config section `agents` in examples/tareas-hogar.config.json. Command `bdd-pipeline install` generates exact agents, handles idempotency, slot validation, and wires SubagentStop hook in `.claude/settings.json`. Vitest suite: 8 files passed, 101 tests passed.
- L9 (2026-11-05, T4): Generic orchestration guide moved to bdd-pipeline (docs/orchestration.md). Documentation of workflow topology, feature lifecycle, and runner contracts separated from project facts.
- L10 (2026-11-05, T5): Cutover completed in tareas-hogar. `bdd-pipeline.config.json` configured with project facts; agents installed with `bdd-pipeline install`; legacy scripts deleted (scripts/gate.ts, scripts/pipeline.ts, scripts/progreso.ts, etc.); package.json scripts call CLI; `acceptance:mutate` full kills 8/8 mutants; 1153 acceptance tests pass; check:arch passes clean.
- L11 (2026-11-05, T6): Independent verification complete. All suites passing:
  * bdd-pipeline: Vitest (8 files, 101 tests passed), Babashka date mutation tests passed.
  * tareas-hogar: npm test (120 files, 2025 unit & acceptance tests passed), npm run test:props (51 files, 264 property tests passed), npm run check:arch (260 files without violations or cycles), svelte-check (0 errors, 0 warnings).
  * acceptance:mutate full killed 8/8 mutants on orientacion-vertical; equivalence filters working identical.
- Next step: merge split-bdd-pipeline to v2 upon user approval.
