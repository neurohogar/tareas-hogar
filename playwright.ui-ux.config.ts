import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/ui-ux',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 20_000 },
  reporter: [['list']],
  use: {
    serviceWorkers: 'block',
    baseURL: 'http://127.0.0.1:4173',
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
  },
  webServer: {
    command: 'npm run build:qa && npx vite preview --mode qa --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
