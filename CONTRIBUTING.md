# Contributing

Thanks for looking. Tareas Hogar is a small project with one maintainer, built for people for whom starting a task is the hard part. Contributions that keep it calm, simple and guilt-free are very welcome.

You can write issues and comments in English or Spanish.

## Issues

- **Bugs**: use the *Bug report* template. Say what you did, what you expected and what happened; the device and browser help a lot.
- **Ideas**: use the *Idea* template. Start from the problem in daily life, not from the feature: «I never remember to…» is more useful than «add a button for…».
- **What helps and what gets in the way**: reports from real use are the main way features are judged here (see [`docs/v3/plan.md`](docs/v3/plan.md)). An issue that says «this feature annoys me because…» is a real contribution.

## Pull requests

Open an issue first and agree on the change there. Unagreed pull requests may be closed, even good ones, because every rule of the app lives in [`docs/spec.md`](docs/spec.md) and changes go through it.

Before opening one:

1. `npm ci`, then `npm test`, `npm run test:props` and `npm run check:arch` pass.
2. If the change touches the UI, run the QA suite: `npm run qa` (Firebase emulators, about 35 minutes, one worker).
3. Code, comments, tests and documents are in English. Text shown in the app is in Spanish.
4. Domain rules live in `src/lib/core/` and nowhere else; the UI and the adapters ask the core.

The project is built with a ten-role pipeline and deterministic gates (mutation, CRAP, duplication); see [`CLAUDE.md`](CLAUDE.md). The pipeline tool is not published yet, so contributors are not expected to run the gates. The maintainer runs them when merging.

## Code of conduct

Be kind and specific. Many people who use this app live with ADHD, autism or both; assume good faith and keep a calm tone.
