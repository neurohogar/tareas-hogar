# Backlog de la v3

Trabajo ya decidido para la v3 que no sale de la investigación de `docs/research/v3/`. El plan de funcionalidades lo tiene que incluir y ordenar junto con lo demás.

## Técnico

### Migrar a SvelteKit 3

- **Estado:** hecha (rama `chore/sveltekit-3`). Además de las versiones, SvelteKit 3 obligó a: pasar la config de `svelte.config.js` al plugin `sveltekit(...)` de `vite.config.ts`; cambiar `$lib` por `#lib` (subpath import de `package.json`, con extensión); reemplazar `$service-worker` por `$app/manifest`, `$app/env` y `$app/paths`, con el service worker en `src/service-worker/` y su propio `tsconfig.json`. Vite 8 minifica los strings con backticks, y el helper de QA `e2e/versiones-apoyo.ts` ya no asume comillas dobles. Audit: quedan solo los 4 avisos de `deepmerge`.
- **Por qué:** `npm audit` reporta 6 avisos bajos que solo se corrigen en SvelteKit 3:
  - SvelteKit: [GHSA-pfhg-q3qv-9q6r](https://github.com/advisories/GHSA-pfhg-q3qv-9q6r) (redirección con formularios `use:enhance`) y [GHSA-27mw-82g8-phjj](https://github.com/advisories/GHSA-27mw-82g8-phjj) (XSS en páginas prerenderizadas). Afecta a `kit`, `adapter-static`, `vite-plugin-svelte` y `vite-plugin-svelte-inspector`.
  - `cookie` < 0.7.0: [GHSA-pxg6-pf52-xh8x](https://github.com/advisories/GHSA-pxg6-pf52-xh8x), que llega a través de SvelteKit 2.
- **Exposición hoy:** ninguna conocida. La app no usa `use:enhance`, tiene `prerender = false` y es estática, sin servidor que use `cookie`. El objetivo es dejar las dependencias al día y el audit limpio.
- **Qué implica:** SvelteKit 3.2.0 exige como peers Vite 8, TypeScript 6 y `@sveltejs/vite-plugin-svelte` 7, y `@sveltejs/adapter-static` pasa a la 4. Hay que verificar que Vitest y el resto del tooling (`acceptance/`, `bdd-pipeline`, mutación) funcionen con Vite 8.
- **Cómo:** con `npm install` de versiones concretas, nunca con `npm audit fix --force`, que en este repo bajó firebase a la 9 y `adapter-static` a la 0.0.17. Validar con `npm test`, `npm run check`, `npm run check:arch`, `npm run test:props` y la suite QA completa.
- **Riesgo:** alto, por ser un cambio de dependencias y de entorno de build.
- **Lo que no resuelve:** `deepmerge` ([GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)) no tiene versión corregida y lo sigue usando `vite-plugin-svelte` 7. Se ejecuta solo al compilar, sobre la configuración del propio proyecto. Queda aceptado hasta que exista un arreglo.

Contexto: `@grpc/grpc-js` ya está forzado a 1.14.7 con un `override` (commit `9aad1b7`), porque ninguna versión de firebase, ni la 13.3.0, pide una versión corregida.
