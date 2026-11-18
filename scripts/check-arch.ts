// npm run check:arch — dirección de dependencias, imports prohibidos y ciclos.
//
// Cada archivo de src/ y acceptance/ pertenece a una capa. REGLAS dice, por
// capa, a qué capas internas puede importar y qué paquetes externos puede usar.
// Es la estructura deseada: si una corrección legítima es una llamada hacia
// adentro que no figura, se agrega acá.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

type Layer = 'core' | 'acceptance-oracle' | 'acceptance-ir' | 'core-test' | 'adapters' | 'adapters-firebase' | 'ui' | 'acceptance' | 'service-worker';

interface Rule {
	layers: Layer[];
	/** Prefijos de paquetes externos permitidos ('firebase/' cubre 'firebase/auth'). */
	packages: string[];
}

const RULES: Record<Layer, Rule> = {
	// TypeScript puro: ni IO, ni Firebase, ni Svelte, ni SvelteKit.
	core: { layers: ['core'], packages: [] },
	'core-test': { layers: ['core'], packages: ['vitest', 'fast-check'] },
	// Cáscaras finas: traducen entre el core y Firebase/el navegador.
	adapters: { layers: ['core', 'adapters', 'adapters-firebase'], packages: ['firebase/'] },
	'adapters-firebase': { layers: [], packages: ['firebase/'] },
	// La UI pregunta al core y usa los adapters por su API pública; nunca a Firebase directo.
	ui: { layers: ['core', 'adapters', 'ui'], packages: ['svelte', '$app/', 'emoji-picker-element', 'emoji-picker-element-data/'] },
	// Corre en un worker del navegador: solo el core (puro) y el módulo virtual de SvelteKit; nunca adapters.
	'service-worker': { layers: ['core'], packages: ['$service-worker'] },
	// La aceptación ejercita solo el core.
	acceptance: { layers: ['core', 'acceptance', 'acceptance-ir'], packages: ['vitest', 'node:'] },
	// Forma del IR: tipos puros.
	'acceptance-ir': { layers: [], packages: [] },
	// Oráculo del filtro de equivalentes: reglas del spec reescritas de forma independiente.
	// Nunca importa el core, los step handlers ni el despacho (sería circular).
	'acceptance-oracle': { layers: ['acceptance-oracle', 'acceptance-ir'], packages: [] }
};

const ROOT = resolve(import.meta.dirname, '..');
const LIB = join(ROOT, 'src/lib');
const EXTENSIONS = ['.ts', '.svelte'];

function layerOf(file: string): Layer | null {
	const path = relative(ROOT, file);
	if (path.startsWith('src/lib/core/')) return path.endsWith('.test.ts') ? 'core-test' : 'core';
	if (path === 'src/lib/adapters/firebase.ts') return 'adapters-firebase';
	if (path.startsWith('src/lib/adapters/')) return 'adapters';
	if (path === 'src/service-worker.ts') return 'service-worker';
	if (path.startsWith('src/lib/ui/') || path.startsWith('src/routes/')) return 'ui';
	if (['acceptance/oracle.ts', 'acceptance/oracle-editing.ts', 'acceptance/oracle-history.ts', 'acceptance/oracle-annotations.ts', 'acceptance/oracle-panel.ts', 'acceptance/oracle-loading-screen.ts', 'acceptance/oracle-date-text.ts', 'acceptance/equivalence.ts'].includes(path)) return 'acceptance-oracle';
	if (path === 'acceptance/ir.ts') return 'acceptance-ir';
	if (path.startsWith('acceptance/') && !path.startsWith('acceptance/generated/')) return 'acceptance';
	return null;
}

function files(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) return name === 'generated' ? [] : files(path);
		return EXTENSIONS.some((ext) => name.endsWith(ext)) ? [path] : [];
	});
}

// Imports y re-exports al comienzo de una línea (no los que aparecen dentro de strings), e import() dinámico.
const IMPORT =
	/^\s*(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/gm;

function specifiers(file: string): string[] {
	const font = readFileSync(file, 'utf8');
	return [...font.matchAll(IMPORT)].map((m) => m[1] ?? m[2] ?? m[3]);
}

/** Ruta absoluta de un import interno, o null si es un paquete externo. */
function resolveInternal(from: string, specifier: string): string | null {
	let base: string;
	if (specifier.startsWith('#lib/')) base = join(LIB, specifier.slice('#lib/'.length));
	else if (specifier.startsWith('.')) base = resolve(dirname(from), specifier);
	else return null;
	const candidates = [base, ...EXTENSIONS.map((ext) => base + ext), join(base, 'index.ts')];
	return candidates.find((c) => existsSync(c) && statSync(c).isFile()) ?? base;
}

/** IO que el core no toca: recibe "ahora" e ids como parámetros (CLAUDE.md, Arquitectura). */
const IO_FORBIDDEN_IN_CORE: [RegExp, string][] = [
	[/\bnew Date\(\s*\)/, 'new Date() sin argumentos (leer el reloj)'],
	[/\bDate\.now\(/, 'Date.now()'],
	[/\bMath\.random\(/, 'Math.random()'],
	[/\bcrypto\./, 'crypto'],
	[/\b(setTimeout|setInterval|queueMicrotask)\(/, 'timers'],
	[/\b(fetch|localStorage|sessionStorage|indexedDB|window|document|navigator|process)\b/, 'APIs del entorno'],
	[/\bconsole\./, 'console']
];

/**
 * Calendario local (spec §5: hora local del dispositivo): leer o armar fechas
 * según la zona horaria del proceso. En el core vive solo en DIAS_LOCALES; el
 * resto compara instantes (getTime) o le pregunta a ese módulo.
 */
const DAYS_LOCAL = join(LIB, 'core/days.ts');
const CALENDAR_LOCAL: [RegExp, string][] = [
	[/\.(get|set)(FullYear|Month|Date|Day|Hours|Minutes|Seconds|Milliseconds)\(/, 'getters/setters locales de Date'],
	[/\.getTimezoneOffset\(|\.toLocale\w*\(|\bIntl\./, 'zona horaria o formato local'],
	[/\bnew Date\([^()]*,/, 'new Date(año, mes, …) en hora local'],
	[/\bnew Date\(\s*['"`]|\bDate\.parse\(/, 'parseo de fechas en texto']
];

const errors: string[] = [];
const graph = new Map<string, string[]>();
const all = [...files(join(ROOT, 'src')), ...files(join(ROOT, 'acceptance'))];

for (const file of all) {
	const layer = layerOf(file);
	if (layer === 'core') {
		const withoutComments = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '').replace(/\bfrom\s*'[^'\n]*'/g, "from ''");
		for (const [pattern, that] of IO_FORBIDDEN_IN_CORE)
			if (pattern.test(withoutComments)) errors.push(`${relative(ROOT, file)}: el core no usa ${that}`);
		if (file !== DAYS_LOCAL)
			for (const [pattern, that] of CALENDAR_LOCAL)
				if (pattern.test(withoutComments))
					errors.push(`${relative(ROOT, file)}: ${that} solo en ${relative(ROOT, DAYS_LOCAL)}`);
	}
	const rule = layer && RULES[layer];
	const internal: string[] = [];
	for (const specifier of specifiers(file)) {
		const target = resolveInternal(file, specifier);
		const where = `${relative(ROOT, file)} → ${specifier}`;
		if (target === null) {
			if (rule && !rule.packages.some((p) => specifier === p || specifier.startsWith(p)))
				errors.push(`${where}: la capa ${layer} no puede importar el paquete "${specifier}"`);
			continue;
		}
		if (target.endsWith('.css')) continue;
		if (!existsSync(target)) {
			errors.push(`${where}: no se encuentra el módulo`);
			continue;
		}
		internal.push(target);
		const layerTarget = layerOf(target);
		if (rule && layerTarget && layerTarget !== layer && !rule.layers.includes(layerTarget))
			errors.push(`${where}: la capa ${layer} no puede depender de ${layerTarget}`);
		if (rule && layer !== 'core-test' && layerTarget === 'core-test')
			errors.push(`${where}: solo los tests importan tests`);
	}
	graph.set(file, internal);
}

// Ciclos: DFS con colores sobre el grafo de imports internos.
const color = new Map<string, 'gris' | 'negro'>();
function visit(node: string, path: string[]): void {
	color.set(node, 'gris');
	for (const neighbor of graph.get(node) ?? []) {
		if (color.get(neighbor) === 'gris') {
			const cycle = [...path.slice(path.indexOf(neighbor)), neighbor];
			errors.push(`ciclo de imports: ${cycle.map((c) => relative(ROOT, c)).join(' → ')}`);
		} else if (!color.has(neighbor)) visit(neighbor, [...path, neighbor]);
	}
	color.set(node, 'negro');
}
for (const node of graph.keys()) if (!color.has(node)) visit(node, [node]);

if (errors.length > 0) {
	console.error(`check:arch: ${errors.length} violación(es)\n${errors.map((e) => `  - ${e}`).join('\n')}`);
	process.exit(1);
}
console.log(`check:arch: OK (${all.length} archivos, sin violaciones ni ciclos)`);
