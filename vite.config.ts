import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

const FONTS_DIR = 'static/fuentes';

/** Spec §6.6: each font file is identified by its content; a version that does not change it is not downloaded again. */
const fontFingerprints = Object.fromEntries(
	readdirSync(FONTS_DIR)
		.filter((name) => name.endsWith('.woff2'))
		.map((name) => [name, createHash('sha256').update(readFileSync(`${FONTS_DIR}/${name}`)).digest('hex').slice(0, 16)])
);

export default defineConfig({
	plugins: [sveltekit({ preprocess: vitePreprocess(), adapter: adapter({ fallback: 'index.html' }) })],
	define: { __FONT_FINGERPRINTS__: JSON.stringify(fontFingerprints) }
});
