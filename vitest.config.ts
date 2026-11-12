import { defineConfig } from 'vitest/config';

// Los tests corren contra el core puro: no hace falta el plugin de SvelteKit.
export default defineConfig({
	test: {
		projects: [
			{ test: { name: 'unit', include: ['src/**/*.test.ts', 'tests/hardening/**/*.test.ts'], exclude: ['src/**/*.props.test.ts'] } },
			{ test: { name: 'acceptance', include: ['acceptance/generated/**/*.test.ts'] } },
			{ test: { name: 'props', include: ['src/**/*.props.test.ts'] } },
			{ test: { name: 'scripts', include: ['tests/scripts/**/*.test.ts'] } }
		],
		coverage: {
			provider: 'v8',
			include: ['src/lib/core/**/*.ts'],
			exclude: ['src/lib/core/**/*.test.ts'],
			reporter: ['text-summary', 'lcov']
		}
	}
});
