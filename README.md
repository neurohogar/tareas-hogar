# Tareas Hogar

Installable web app (PWA) for household tasks, designed for adults with ADHD, autism and high abilities, including people who share a home.

The idea is simple: recurring tasks should not be forgotten, and the list should show first what needs doing now, with no noise and no guilt.

## What it does today

- One-off and recurring tasks: every N days or hours, or on certain days of the week or month.
- Clear statuses without guilt: pending, waiting, and for what is late a dated text («Tocaba hoy 10:00») instead of an alarm.
- Schedules in which a task makes sense, postponing and pausing.
- A **first step** and optional **further steps** (shown one at a time), so starting is cheaper than reading the title.
- A **minimal version** of a task and a «Hice la mínima» action that counts as done and is kept in the history.
- History of everything completed, with undo.
- Two screens only (Pendientes and Historial), a mobile panel with tabs, and a warning before losing unsaved changes.
- Works offline and syncs across devices. Sign-in is with Google. The installed app stays in portrait.
- Atkinson Hyperlegible font and emoji are bundled, so everything looks the same everywhere.

The text the person sees is in Spanish; code, tests, Gherkin and documents are in English.

What the app builds and why: [`docs/spec.md`](docs/spec.md).

## Timeline

Dates are when the change was published on `v3`; the history before 2026-11-12 was squashed into a single public release.

| Date | Change |
|---|---|
| Before 2026-11-12 | **Version 2**: one-off and recurring tasks, schedules, postpone and pause, history with undo, offline sync, bundled font and emoji, portrait orientation, mobile panel. |
| 2026-11-12 | Public release (AGPL-3.0). Migration to SvelteKit 3 and Vite 8. The v3 plan is written from the research in `docs/research/v3/`, as ordered epics. |
| 2026-11-13 | **Guilt-free status** (epic E2): late tasks read «Tocaba …» with a date, not «Atrasada»; under a minute reads «ahora». **First step** and **steps one at a time** (E3). |
| 2026-11-15 | **Minimal version** and «Hice la mínima» (E4, first half); it appears in the history. First deploy of v3. |
| 2026-11-16 | Decision: code, tests, Gherkin and documents move to English; only app text stays in Spanish. |
| 2026-11-17 | **Labels and effort removed** (they were not used): spec, code, tests and the stored fields. |
| 2026-11-18 | Deploy; the old label and effort fields are deleted from production data. English migration of code, comments and Gherkin begins. |
| 2026-11-20 | **Annotations removed** (the «me sirvió / me molestó» note): the third tab is gone and `/anotaciones` redirects. Epics are now judged by what people report and by stored data. Deploy; the old data is deleted. |
| 2026-11-20 | English migration finished: features, QA procedures, packages, spec and pipeline documents renamed and translated. |
| 2026-11-22 | The `/historial` route becomes `/history`. Deploy. |

What comes next is in [`docs/v3/plan.md`](docs/v3/plan.md): the second field of the minimal version, choosing a task for me, low-capacity days, and the later epics.

## Evidence-based design

Version 3 is designed from published research, not from hunches. The base is in [`docs/research/v3/`](docs/research/v3/): four documents on ADHD, autism, high abilities and twice-exceptionality, and shared households and existing apps. Each finding states the strength of its evidence and its sources. The [`README`](docs/research/v3/README.md) of that folder explains the method and how to extend it.

Some principles that came out of it:

- **Lower the cost of starting:** a concrete first step, one task at a time.
- **Zero guilt:** no streaks that break and no overdue counters that grow.
- **Invite, do not order:** the person decides what they are notified about and when.
- **Adult tone:** no points, badges or mascots.

## Run it on your computer

Requirements: Node.js 26 and the [Firebase CLI](https://firebase.google.com/docs/cli).

```sh
npm ci
npm run emulators   # local Auth and Firestore, in another terminal
npm run dev
```

The development app uses the Firebase emulators, so no account is needed.

## Publish your own copy

1. Create a project in the [Firebase console](https://console.firebase.google.com/) with Authentication (Google), Firestore and Hosting.
2. Copy `.env.production.example` to `.env.production` and fill it in with your project's web configuration.
3. Copy `.firebaserc.example` to `.firebaserc` and put your project ID in `prod`.
4. `npm run deploy` publishes the app and the Firestore rules.

## How it is developed

Each feature goes through a pipeline of ten roles (analysis, specification, Gherkin, implementation, cleanup, architecture, hardening and QA), with deterministic gates for coverage, complexity (CRAP), duplication and mutation. The detail is in [`CLAUDE.md`](CLAUDE.md) and [`docs/pipeline/`](docs/pipeline/).

| Command | Does |
|---|---|
| `npm test` | Unit tests and acceptance tests generated from `features/*.feature` |
| `npm run test:props` | Property tests |
| `npm run check:arch` | Dependency rules between layers |
| `npm run qa` | Playwright suite against the Firebase emulators |

The quality tools come from [Acceptance Pipeline Specification](https://github.com/unclebob/Acceptance-Pipeline-Specification), [crapper](https://github.com/unclebob/crapper), [dryer](https://github.com/unclebob/dryer) and [mutator](https://github.com/unclebob/mutator). The pipeline orchestrator (`bdd-pipeline`) is not published yet, so for now the gates cannot be run outside the original environment. The tests and the QA suite can.

## License

[AGPL-3.0](LICENSE). You can use it, modify it and host it. If you publish a modified version, also as a web service, you must share its source code under the same license.
