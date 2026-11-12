import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: false,
	workers: 1,
	timeout: 60_000,
	expect: { timeout: 20_000 },
	reporter: [['list']],
	// El build sirve el service worker (spec §8). Las suites que no hablan de la PWA lo bloquean, así
	// el servidor responde directo y el reloj simulado no espera a la caché; la suite de la PWA lo
	// permite con test.use({ serviceWorkers: 'allow' }).
	use: { serviceWorkers: 'block', baseURL: 'http://127.0.0.1:4173', locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires' },
	// La Flujo 10 de la PWA reconstruye build/ y deja caído el preview de 4173: va en su propio proyecto,
	// que corre después de todos los demás.
	projects: [
		{ name: 'ui', testIgnore: /pwa-sin-conexion|panel-mobile-sin-conexion|fuente-empaquetada-sin-conexion|orientacion-vertical/ },
		{ name: 'pwa', testMatch: /panel-mobile-sin-conexion|pwa-sin-conexion|fuente-empaquetada-sin-conexion|orientacion-vertical/, dependencies: ['ui'] }
	],
	webServer: {
		command: 'npm run build:qa && npx vite preview --mode qa --host 127.0.0.1 --port 4173 --strictPort',
		url: 'http://127.0.0.1:4173',
		reuseExistingServer: false,
		timeout: 120_000
	}
});
