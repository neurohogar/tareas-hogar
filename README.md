# Tareas Hogar

Installable web app (PWA) for household tasks, designed for adults with ADHD, autism and high abilities, including people who share a home.

The idea is simple: recurring tasks should not be forgotten, and the list should show first what needs doing now, with no noise and no guilt.

## What it does today

- One-off and recurring tasks: every N days or hours, or on certain days of the week or month.
- Clear statuses: pending, overdue and waiting, with a bar that shows how long until it comes back.
- Schedules in which a task makes sense, postponing and pausing.
- History of everything completed, with undo.
- Works offline and syncs across devices. Sign-in is with Google.
- Atkinson Hyperlegible font and emoji are bundled, so everything looks the same everywhere.

What the app builds and why: [`docs/spec.md`](docs/spec.md).

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
