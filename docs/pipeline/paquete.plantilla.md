# Package: <feature>

<One or two lines: what the feature adds, from the user's point of view.>

## Specs

Each `S#` quotes the rule of `docs/spec.md` **verbatim** (with its section), without summarizing or rewriting. One rule per `S#`.

- **S1** (§x.y): «<exact text of the spec>»
- **S2** (§x.y): «…»

## Decisions

Answers from the user and decisions from the orchestrator that the spec already reflects, **verbatim**, with their date. User words stay in their original language inside `«»`, followed by ` (translation: «…»)`.

- D1 (<date>, user): «<literal answer>»

## Artifacts

- Gherkin: `features/<a>.feature` (S1, S2), `features/<b>.feature` (S3)
- QA: `qa/<feature>.md`

## core

- **Allowed edits**: `src/lib/core/<file>.ts`, `src/lib/core/*.test.ts` (all core tests: a change to an exported type can touch them) (new files: with a narrow glob such as `src/lib/core/<topic>*.ts`, never the whole directory)
- **Rules**: S1, S2, …
- **Reuses**: <existing core functions the feature must use, if any; the gherkin-writer names them when the spec relies on rules already implemented>
- **Gate**: `node scripts/gate.ts core`

## acceptance

- **Allowed edits**: `acceptance/steps/<file>.ts`, `acceptance/oracle*.ts`, `acceptance/equivalence.ts`, `docs/pipeline/pendientes.txt`
- **Features to connect**: `features/<a>.feature`, `features/<b>.feature`
- **New steps**: <text of each new step form>
- **Gate**: `node scripts/gate.ts acceptance`

## ui

- **Allowed edits**: `src/lib/ui/<Component>.svelte`, `src/lib/adapters/<file>.ts`, `src/routes/…`
- **Visible behavior**: `qa/<feature>.md`
- **Gate**: `node scripts/gate.ts ui`

## cleaner · architect · hardener · qa

They work on everything the feature changed (`git diff <feature base>`, recorded in `tmp/base-de-feature`); they need no section of their own unless the gherkin-writer leaves a note for them here.

## Log

- L1 (<date>): the user's original request, verbatim (original words inside `«»` followed by ` (translation: «…»)`).
