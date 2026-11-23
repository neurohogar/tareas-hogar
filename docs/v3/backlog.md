# v3 backlog

Work already decided for v3 that does not come from the research in `docs/research/v3/`. The feature plan has to include it and order it together with the rest.

## Technical

### Migrate to SvelteKit 3

- **Status:** done (branch `chore/sveltekit-3`). Besides the versions, SvelteKit 3 required: moving the config from `svelte.config.js` to the `sveltekit(...)` plugin in `vite.config.ts`; changing `$lib` to `#lib` (a `package.json` subpath import, with extension); replacing `$service-worker` with `$app/manifest`, `$app/env` and `$app/paths`, with the service worker in `src/service-worker/` and its own `tsconfig.json`. Vite 8 minifies strings with backticks, and the QA helper `e2e/versions-support.ts` no longer assumes double quotes. Audit: only the 4 `deepmerge` advisories remain.
- **Why:** `npm audit` reports 6 low advisories that are only fixed in SvelteKit 3:
  - SvelteKit: [GHSA-pfhg-q3qv-9q6r](https://github.com/advisories/GHSA-pfhg-q3qv-9q6r) (redirect with `use:enhance` forms) and [GHSA-27mw-82g8-phjj](https://github.com/advisories/GHSA-27mw-82g8-phjj) (XSS in prerendered pages). It affects `kit`, `adapter-static`, `vite-plugin-svelte` and `vite-plugin-svelte-inspector`.
  - `cookie` < 0.7.0: [GHSA-pxg6-pf52-xh8x](https://github.com/advisories/GHSA-pxg6-pf52-xh8x), which comes through SvelteKit 2.
- **Exposure today:** none known. The app does not use `use:enhance`, has `prerender = false` and is static, with no server that uses `cookie`. The goal is to keep dependencies up to date and the audit clean.
- **What it involves:** SvelteKit 3.2.0 requires Vite 8, TypeScript 6 and `@sveltejs/vite-plugin-svelte` 7 as peers, and `@sveltejs/adapter-static` moves to 4. Vitest and the rest of the tooling (`acceptance/`, `bdd-pipeline`, mutation) have to be checked to work with Vite 8.
- **How:** with `npm install` of concrete versions, never with `npm audit fix --force`, which in this repo downgraded firebase to 9 and `adapter-static` to 0.0.17. Validate with `npm test`, `npm run check`, `npm run check:arch`, `npm run test:props` and the full QA suite.
- **Risk:** high, because it is a change of dependencies and of the build environment.
- **What it does not solve:** `deepmerge` ([GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)) has no fixed version and is still used by `vite-plugin-svelte` 7. It only runs at build time, over the project's own configuration. It is accepted until a fix exists.

Context: `@grpc/grpc-js` is already forced to 1.14.7 with an `override` (commit `9aad1b7`), because no firebase version, not even 13.3.0, asks for a fixed version.
