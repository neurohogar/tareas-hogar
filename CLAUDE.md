# Tareas Hogar v3 — Project constitution

Personal PWA for household tasks (ADHD-friendly). What to build: `docs/spec.md`. Why the process is this way: `docs/research/uncle-bob-workflow.md`.

Language policy: code, Gherkin, the spec, QA procedures and pipeline documents are written in neutral English. Only the text shown in the app is Spanish (see `docs/pipeline/english-migration.md`).

In this project the **10-role pipeline** of this file applies; it replaces the Worker/Reviewer protocol (`.harness_task_*`) of the global `AGENTS.md`. The deterministic gates do the reviewer's job.

## Pipeline

Every feature goes through ten subagents from `.claude/agents/`, in order:

`analyst` ⇄ *(user)* → `spec-writer` → `gherkin-writer` → *(human approval)* → `core` → `acceptance` → `ui` → `cleaner` → `architect` → `hardener` → `qa`

The three specification roles (analyst, spec-writer, gherkin-writer) work in the main checkout; the seven implementation roles run one after another in a single shared worktree, each on top of the previous one's commit. Each role leaves one commit and reports to the orchestrator. **To orchestrate a feature** (create worktrees, launch roles, merges, sync, failures): read `docs/pipeline/orchestration.md`.

A role owns only what its file says it owns; the rest is done by another role later in the chain.

A role with no work in the feature is skipped without launching it (`bdd-pipeline skip <role>`, rules in `roles.skippable` of `bdd-pipeline.config.json`): an empty commit `By <role>.` is left with the reason, and its gate must still pass. The tool decides this, never a role or the orchestrator.

## Architecture

| Layer | Path | Content | Test tools |
|---|---|---|---|
| Core | `src/lib/core/` | Pure TypeScript: the rules of §5 of the spec, ordering, models. Receives "now" as a parameter. | Yes: unit, acceptance, coverage, CRAP, DRY, mutation, property tests |
| Adapters | `src/lib/adapters/` | Firebase (Auth, Firestore), clock, IDs. Thin shells that translate. | No |
| UI | `src/routes/`, `src/lib/ui/` | `.svelte` components. They ask the core and show the result. | No (the QA suite covers them) |

- Dependencies point toward `core/`. `core/` imports only from `core/`.
- The UI and the adapters **ask the core**; each domain rule exists in one place, the core.
- All logic that can live in `core/` lives there; adapters and UI stay as small as possible.

## Scripts contract (`package.json`)

They are created by the roles that need them; all roles use them by name.

| Script | Does |
|---|---|
| `npm test` | Unit + generated acceptance (Vitest). This is the one `mutator` runs. |
| `npm run test:unit` | Unit tests only. |
| `npm run acceptance` | For each `features/*.feature`: parse to IR → generate → run. |
| `npm run acceptance:mutate -- features/<x>.feature [--level hard\|soft\|full]` | `gherkin-mutator` on one feature (full path) with the runner adapter and the project's equivalents filter. |
| `npm run coverage` | Vitest with LCOV coverage. |
| `npm run test:props` | Property tests (fast-check). Separate from `npm test`. |
| `npm run check:arch` | Dependency and forbidden-import checks. |
| `npm run qa` | The QA suite's Playwright scripts against the Firebase Emulator Suite. |

## Quality tools

Cloned next to the repo in `~/Work/`. Use these, with these invocations; a gate only counts if the official tool measured it.

| Gate | Command (from the worktree root) | Passes when |
|---|---|---|
| CRAP | `~/Work/bdd-pipeline/bdd-pipeline gate cleaner` (runs crapper with the coverage of the implemented features) | exit 0 (worst CRAP ≤ 10) |
| DRY | `~/Work/vendor/dryer/dryer src/lib/core` | no new candidates left unjustified |
| Mutation (scan) | `~/Work/vendor/mutator/mutator --scan <file>` | — (hint for a module with more than one job) |
| Mutation | `~/Work/vendor/mutator/mutator --max-workers 4 <file>` | exit 0 (no mutant survives) |
| Gherkin parse | `bb --config ~/Work/vendor/Acceptance-Pipeline-Specification/bb.edn gherkin-parser <feature> ./tmp/<stem>.json` | exit 0 |
| Gherkin DRY | `bb --config ~/Work/vendor/Acceptance-Pipeline-Specification/bb.edn gherkin-ir-dry-checker <ir> ./tmp/<stem>.dry.json` | report reviewed |
| Gherkin mutation | `npm run acceptance:mutate -- features/<x>.feature --level soft` | exit 0 |

Gherkin equivalents filter: `acceptance/oracle.ts` is an oracle rewritten from `docs/spec.md`, independent of the core and of the step handlers (`check:arch` enforces this). Each new spec rule that enters a classification Then is added to the oracle; a filtered case is justified by the spec rule that makes it equivalent, never by what the implementation returns.

APS specifications (Gherkin format, IR, generator, runner adapter): `~/Work/vendor/Acceptance-Pipeline-Specification/*.md`.

Usage rules:

- One tool at a time, in sequence.
- Mutation: one file at a time, always differential (the default). The snapshots in `.metrics/` are the manifest: they are committed and only the tools modify them. Gherkin mutation keeps its manifest inside the `.feature` itself: that file is committed after mutating it. The hardener gate fails if a feature of the package still had mutations to run, because that means the manifest is not committed or is stale.
- The hardener gate reuses a core file that already passed mutation earlier in the same feature, while the file, the command, the config, the feature base and the gate are unchanged (`reuse` in `bdd-pipeline.config.json`; passes in `tmp/gate-pasos-hardener.json`). After a failure, the next gate run repeats only the failed and the changed files. Deleting that file forces every file to run.
- Workers: `--max-workers 4` / `--workers 4`.
- **CRAP**: a single `switch` that answers one question may stay above 10. Nested or dual-purpose functions above 10 are split, and each extracted function owns its inputs (do not pass booleans the caller already knew).
- Gherkin mutation: `--level soft` decides what to re-mutate only by the content of the `.feature`. If step handlers, the `acceptance/` runtime or the equivalents filter change, use `--level full` only on the features with at least one step served by a changed handler, or with a Then that goes through a changed oracle rule; the rest stay on `--level soft`. The acceptance role lists in its report which handlers and oracle rules it changed. The hardener mutates the package's new features (soft) and settles their oracle rules before the `--level full` runs, so those run only once.
- A module with more than one job is split before mutating it. A module with a single job stays whole even if it has many mutation sites.

## Gherkin (APS format)

- Keywords in English (`Feature`, `Background`, `Scenario Outline`, `Examples`, `Given/When/Then/And`); step text in English.
- No tags, `Rule`, doc strings or data tables in steps.
- Every value that can vary goes as a `<parameter>` in an `Examples` table: only those values are mutated.
- Dates and times in ISO-8601 (`2026-07-15T08:00:00`), so the mutator shifts them forward and back in time.

## Git

- Integration branch: `v3`. Shared implementation worktree: `~/Work/tareas-hogar-worktrees/pipeline` on branch `wt/pipeline`.
- Work only in the worktree assigned in the prompt; merge only what the prompt says (core merges `v3`; the other roles do not merge).
- Commit format:

  ```
  <summary in imperative>

  By <role>.

  Co-Authored-By: Claude <Model> <noreply@anthropic.com>
  (or Co-Authored-By: Google Gemini <Model> <noreply@google.com> in roles run with Gemini)
  ```

  The trailer is for tracking what the AI did in this project: it always goes in, even if another general rule forbids attribution in commits. `<Model>` is the model the role runs with (`Opus 5.5`, `Sonnet 5.5`, `Haiku 5.5`, `3.8 Flash`); the launch prompt carries the exact line under `Firma:`.

- After a merge that brings changes in `package-lock.json`, or in a worktree without `node_modules`: `npm ci`.
- Temporary files go in the worktree's `./tmp/` (ignored by git).
- Before reporting, every role runs `~/Work/bdd-pipeline/bdd-pipeline gate <role>` and leaves it at `OK`. Do not use a bare `npm run acceptance` or `npm run coverage` as the criterion: they also run the features in `pendientes.txt`, which fail until they are implemented.

## Role gate

`~/Work/bdd-pipeline/bdd-pipeline gate <role>` (from the worktree) runs exactly what the role has to leave green: clean tree, last commit with `By <role>.`, core, acceptance and ui touching only the files their section of the package allows (`docs/pipeline/paquetes/<feature>.md`), and the role's own checks. The specification roles have no tests: their gate verifies the package (L1 in the log; each `S#` quoted verbatim from `docs/spec.md`; for gherkin-writer, also each `S#` covered by a `.feature` that parses and is listed in `pendientes.txt`, and the core, acceptance and ui surfaces). Run it before reporting `DONE`. When a role finishes, the `SubagentStop` hook runs it automatically; if it fails, the error goes back to the role to fix. If the gate already passed on that commit, it does not repeat its steps; deleting `tmp/gate-verde-<role>` forces it.

`docs/pipeline/pendientes.txt` lists the features already specified that are not implemented yet: the gate does not count them in acceptance. The gherkin-writer adds its own there; the acceptance role removes those of the feature it connects.

## Report to the orchestrator

Every role ends with a short message:

```
STATUS: DONE | BLOCKED | QUESTION
COMMIT: <sha>
GATES: <gate>=<result>, ...
NOTES: <one to three lines; if BLOCKED/QUESTION, what is needed>
LEARNINGS: <optional: one line per trap you found that the next role would step on>
```

Write that same text to `tmp/reporte-<role>.txt` of the directory where you work, with an absolute path, before finishing: if you are interrupted, it is what the orchestrator reads. In a subagent `cd` does not persist between calls, and with a relative path the file would go to the main checkout.

Nothing more: the detail of the work goes in the commit message, not in the report. The data the next role needs (exported signatures, new steps) goes in `NOTES`.

## Learnings

The traps each role already stepped on live in **Engram** (project `tareas-hogar`), one memory per role with `topic_key` `pipeline/aprendizajes/<role>`. The orchestrator brings yours in the launch prompt, under «Aprendizajes del rol» (the tool still prints that Spanish heading): read it before starting. There is no need to search for it.

Roles **do not write** to Engram: they report their traps in `LEARNINGS` and the orchestrator adds them. If the prompt does not bring them, continue without them and say so in `NOTES`.
