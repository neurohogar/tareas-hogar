# Pipeline orchestration

It is run by the orchestrator: the `orchestrator` agent in `.claude/agents/`, on Sonnet. The roles are in the same folder; the constitution is in `CLAUDE.md`.

To orchestrate, open the session with `claude --agent orchestrator`: this way the whole conversation runs on the orchestrator's model. From a session opened with another model, launch the `orchestrator` as a subagent; in that case it cannot talk to the user and returns each question as `STATUS: QUESTION`.

The roles do not load the global `CLAUDE.md` or the project's (`omitClaudeMd`): each one reads the project's at the start. They have only the tools their file lists.

## Topology

| Role | Where it works | Branch |
|---|---|---|
| analyst, spec-writer, gherkin-writer | main checkout (`~/Work/tareas-hogar`) | `v3` |
| core, acceptance, ui, cleaner, architect, hardener, qa | shared worktree `~/Work/tareas-hogar-worktrees/pipeline` | `wt/pipeline` |

The seven implementation roles run one after another in the same worktree: each starts where the previous one's commit left off, with no merges between roles. The specifier stays apart so the next feature can be specified while the current feature's chain runs.

## Setup (once)

1. `git worktree add ~/Work/tareas-hogar-worktrees/pipeline -b wt/pipeline v3`.
2. `gentle-ai codegraph init --cwd ~/Work/tareas-hogar-worktrees/pipeline` (its own index).

Done when `git worktree list` shows the `pipeline` worktree on `wt/pipeline`.

## One feature

1. **analyst** — write the package path (`docs/pipeline/paquetes/<feature>.md`) in `tmp/paquete-actual` of the main checkout, with a clean tree (the gate of the specification roles requires its own commit and a clean tree), and launch it with the user's request verbatim. If it reports `QUESTION`, ask the user each question in `NOTES`, **one at a time**, with the selection interface and the options as they are; write each answer verbatim in `## Decisions` of the package (`Dn (date, user): «…»`) and relaunch the analyst. Repeat until `DONE`.
2. **spec-writer** — launch it with the package. If it reports `QUESTION`, same as above and relaunch it.
3. **gherkin-writer** — launch it with the package. If it reports `QUESTION`, same as above; if the answer changes a rule, it goes back to the spec-writer.
4. **Approval** — show the user the new `.feature` files and the QA procedure (paths + scenario summary). If they ask for changes to rules, it goes back to the spec-writer; if only to scenarios, to the gherkin-writer. Continue only with explicit approval.

Different features can be specified in parallel if their spec-writers touch different sections of `docs/spec.md` (the orchestrator checks this with the sections each package names); if they overlap, they go in sequence.

5. **core → acceptance → ui → cleaner → architect → hardener → qa** — the next role and its prompt are given by `node scripts/pipeline.ts` (launch it with that prompt as is, plus the learnings section of the template and no other context); before launching core, write the package path in `~/Work/tareas-hogar-worktrees/pipeline/tmp/paquete-actual` (the gate uses it to verify each role's surface); `node scripts/pipeline.ts` records in `tmp/base-de-feature` of the worktree the `v3` the feature starts from (a rework advances `v3` without moving that base); core starts with `git merge --no-edit v3` in the shared worktree; the others, with no merge; launch each one in sequence with the template and the procedure below, waiting for its report before the next. If `node scripts/pipeline.ts` prints a line `SALTEAR: <role>`, run the command it carries instead of launching the role: if it returns 0, the role is done with an empty commit `By <role>.` and the next one is requested; if it returns 1, launch the role as usual. Only `core` and `ui` (when their section of the package lists no files) and `cleaner` and `architect` (when the feature did not touch `src/lib/core/` and their gate passes) are skipped; `acceptance`, `hardener` and `qa` always run. Move on only with a **verified** `STATUS: DONE`: the report's commit is `HEAD` of the shared worktree and `node scripts/gate.ts <role>` gives `OK` (the `SubagentStop` hook already ran it; the orchestrator runs it again only if the hook did not or the report does not match). A `DONE` whose gate fails is a `BLOCKED`.
6. **Sync** — at qa's `DONE`:
   - In the main checkout: `git merge --ff-only wt/pipeline` (if `v3` advanced with other commits, `git merge --no-edit wt/pipeline`).
   - In the shared worktree: `git merge --ff-only v3`.
7. **Close** — report to the user: scenarios covered, final gates (from the qa and hardener reports), commits. Ask about the next feature.

A feature is finished when `v3` contains qa's commit and the shared worktree is at the same commit as `v3`.

## Launch template

```
Rol: <role>. Feature: <name>.
Worktree: ~/Work/tareas-hogar-worktrees/pipeline. Antes de empezar: cd a esa ruta<; solo core: y `git merge --no-edit v3`>.
<For analyst: the user's request, verbatim, and the feature name (the package is named after it).>
<For the others: Paquete: docs/pipeline/paquetes/<feature>.md. Nada más: todo lo que el rol necesita está en el paquete.>
<On retries: feedback from the previous attempt, verbatim.>

Aprendizajes del rol (leelos antes de empezar):
<the complete list from the role's memory>
```

The template lines above are the Spanish text that `bdd-pipeline` prints; they are quoted as is, and the translations in `<...>` stand for the content the orchestrator fills in.

The learnings always go in the prompt, in every role and retry: leaving it to the role does not work, because several do not look for them. To get them: `mem_search` with `query: "Aprendizajes del rol <role>"`, `project: "tareas-hogar"`, `type: "learning"`, `limit: 20`; pick the result whose `topic_key` is `pipeline/aprendizajes/<role>` (the first may belong to another role) and read it whole with `mem_get_observation`. If Engram does not respond, launch anyway and say in the prompt that there are no learnings.

## Launching and following a role

The user must see progress without asking. While a role runs in the foreground, the orchestrator cannot write in the chat: that is why every role is launched in the background.

1. **Announce** in one line the role, its number in the chain and the `ESTIMADO:` from `node scripts/pipeline.ts`.
2. **Follow**: launch a `Monitor` with the `SEGUIR:` line from `pipeline.ts` and `timeout_ms: 1800000`. If it expires, re-arm it with the same line plus `--continuar`, which keeps the role's time and what was noted meanwhile.
3. **Launch** the role with `Agent` and `run_in_background: true` (or `delegate_task` if it runs on a different provider from the orchestrator's in T3 Code). The `SubagentStop` hook works the same: it returns the gate errors to the role.
4. **Notify**: for each `Monitor` event, one short line to the user with the phase and the time against the estimate. If a summary says there has been no news for 15 minutes or more, investigate (processes and `tmp/progreso.log`) and say so.
5. **Close**: when the role's notification arrives, verify the `DONE` first and only then stop the `Monitor` with `TaskStop`; say how long it took against the estimate. While the gate has not given `OK` or `FALLA` for the role's commit, the `Monitor` stays armed: it is the only thing that reports a gate that keeps running after the role stopped.

The analyst does not go through `pipeline.ts`: its `SEGUIR` is `node scripts/progreso.ts analyst`, and its prompt carries the line `Progreso:` with `~/Work/tareas-hogar/tmp/progreso.log`.

Meanwhile, the orchestrator ends its turn and does not wait with `sleep`: events wake it up.

If the role is interrupted before its report arrives, read `tmp/reporte-<role>.txt` from where it works. It counts only if its `COMMIT` is `HEAD`; only then run the gate.

A role that stops (interrupted, killed or out of retries) can leave its gate or a long run still going in the background, and that run notifies nobody when it ends. Before deciding what comes next, check with `pgrep -fa "[b]dd-pipeline gate"` whether one is alive. If it is, keep the `Monitor` armed until `tmp/progreso.log` shows `gate: OK` or a failure, and read the result in the log the run writes (for example `tmp/gate.log`); never wait for a notification that will not come.

## Spec rework in the middle of the chain

When a later role needs a change in `features/` or `qa/` (they belong to the gherkin-writer; if a rule changes, to the spec-writer):

1. In the main checkout: `git merge --ff-only wt/pipeline`. This way the gherkin-writer edits on top of the mutation manifests and that role's changes, without conflicts.
2. Launch (or continue) the gherkin-writer (or the spec-writer, if a rule changes) with the change, verbatim.
3. If the change only touches `features/`/`qa/` and the existing step handlers cover it, relaunch the role that asked for it with `git merge --no-edit v3`. If it requires changing step handlers or code, the work re-enters through core (or through acceptance, if only handlers change) and goes through the chain from there.

## Failures

- `BLOCKED` or a gate that does not pass — relaunch the same role with the `NOTES` (or the gate output) as feedback. The first retry uses the role's model with one more level of `effort` in the launch (`low` → `medium` → `high`); the second, `model: opus` in the launch, even if the role is a cheaper one, with the prompt from `node scripts/pipeline.ts --opus` (signed as Opus). After 2 retries without `DONE`, stop and present the blocker to the user.
- A design doubt that is not a product matter and that neither the package nor the spec resolves — launch the `consultor` agent (Fable) with the closed question, the options and the paths to read. It is the only use of Fable in the pipeline.
- `LEARNINGS` in a report — add each line to the memory of the role that would step on it (`mem_save` with `topic_key: pipeline/aprendizajes/<role>`, rewriting the complete list), if it is not there already. One line per trap, no history.
- `QUESTION` from an implementation role (a gap in the spec) — ask the user the question in `NOTES`, as is, and write the answer verbatim in `## Decisions` of the package. If it changes or adds a rule: spec-writer → gherkin-writer (with their gates), and then relaunch the role that asked. If it only clarifies, relaunch it directly.
- qa reports a contradiction between the QA suite and the Gherkin or the unit tests — always to the user; the answer goes back to the spec-writer or the gherkin-writer.
- An environment failure (missing tool, broken dependency) repeated 2 times — stop and ask the user to step in; do not repair the operating system.

## State in Engram

The orchestrator maintains `pipeline/estado` (project `tareas-hogar`): which feature is in which phase, the current package and what is waiting for a user decision. It rewrites it at every phase change and when closing a feature. At the start of a session, or after a compaction, it reads it first (`mem_search` «Estado del pipeline», then `mem_get_observation`) and reconciles it with `git log` and `git worktree list` before continuing.
