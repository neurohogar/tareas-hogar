import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

const FUENTES = 'static/fuentes';

/** Spec §6.6: cada archivo de fuente se identifica por su contenido; una versión que no lo cambia no lo vuelve a bajar. */
const huellasDeFuentes = Object.fromEntries(
	readdirSync(FUENTES)
		.filter((nombre) => nombre.endsWith('.woff2'))
		.map((nombre) => [nombre, createHash('sha256').update(readFileSync(`${FUENTES}/${nombre}`)).digest('hex').slice(0, 16)])
);

export default defineConfig({
	plugins: [sveltekit({ preprocess: vitePreprocess(), adapter: adapter({ fallback: 'index.html' }) })],
	define: { __HUELLAS_DE_FUENTES__: JSON.stringify(huellasDeFuentes) }
});
