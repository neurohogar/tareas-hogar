import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: false,
	// Each worker signs in with its own account (e2e/support.ts, QA_EMAIL) and cleans only its data,
	// so spec files run in parallel against the one emulator. QA_WORKERS overrides it.
	workers: Number(process.env.QA_WORKERS ?? 3),
	timeout: 60_000,
	expect: { timeout: 20_000 },
	reporter: [['list']],
	// The build serves the service worker (spec §8). The suites that do not deal with the PWA block it, so
	// the server responds directly and the simulated clock does not wait for the cache; the PWA suite
	// allows it with test.use({ serviceWorkers: 'allow' }).
	use: { serviceWorkers: 'block', baseURL: 'http://127.0.0.1:4173', locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires' },
	// Flujo 10 of the PWA rebuilds build/ and leaves the 4173 preview down: it goes in its own project,
	// which runs after all the others.
	projects: [
		{ name: 'ui', testIgnore: /pwa-offline|panel-mobile-offline|bundled-font-offline|portrait-orientation/ },
		{ name: 'pwa', testMatch: /panel-mobile-offline|pwa-offline|bundled-font-offline|portrait-orientation/, dependencies: ['ui'], workers: 1 }
	],
	webServer: {
		command: 'npm run build:qa && npx vite preview --mode qa --host 127.0.0.1 --port 4173 --strictPort',
		url: 'http://127.0.0.1:4173',
		reuseExistingServer: false,
		timeout: 120_000
	}
});
