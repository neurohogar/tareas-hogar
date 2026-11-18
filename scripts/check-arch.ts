// npm run check:arch — dependency direction, forbidden imports and cycles.
//
// Every file in src/ and acceptance/ belongs to a layer. RULES says, for each
// layer, which internal layers it may import and which external packages it may use.
// It is the desired structure: if a legitimate fix is a call inward
// that is not listed, it is added here.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

type Layer = 'core' | 'acceptance-oracle' | 'acceptance-ir' | 'core-test' | 'adapters' | 'adapters-firebase' | 'ui' | 'acceptance' | 'service-worker';

interface Rule {
	layers: Layer[];
	/** Allowed external package prefixes ('firebase/' covers 'firebase/auth'). */
	packages: string[];
}

const RULES: Record<Layer, Rule> = {
	// Pure TypeScript: no IO, no Firebase, no Svelte, no SvelteKit.
	core: { layers: ['core'], packages: [] },
	'core-test': { layers: ['core'], packages: ['vitest', 'fast-check'] },
	// Thin shells: translate between the core and Firebase/the browser.
	adapters: { layers: ['core', 'adapters', 'adapters-firebase'], packages: ['firebase/'] },
	'adapters-firebase': { layers: [], packages: ['firebase/'] },
	// The UI asks the core and uses the adapters through their public API; never Firebase directly.
	ui: { layers: ['core', 'adapters', 'ui'], packages: ['svelte', '$app/', 'emoji-picker-element', 'emoji-picker-element-data/'] },
	// Runs in a browser worker: only the core (pure) and the SvelteKit virtual module; never adapters.
	'service-worker': { layers: ['core'], packages: ['$service-worker'] },
	// The acceptance exercises only the core.
	acceptance: { layers: ['core', 'acceptance', 'acceptance-ir'], packages: ['vitest', 'node:'] },
	// IR shape: pure types.
	'acceptance-ir': { layers: [], packages: [] },
	// Oracle of the equivalents filter: spec rules rewritten independently.
	// Never imports the core, the step handlers or the dispatch (it would be circular).
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

// Imports and re-exports at the start of a line (not those inside strings), and dynamic import().
const IMPORT =
	/^\s*(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/gm;

function specifiers(file: string): string[] {
	const font = readFileSync(file, 'utf8');
	return [...font.matchAll(IMPORT)].map((m) => m[1] ?? m[2] ?? m[3]);
}

/** Absolute path of an internal import, or null if it is an external package. */
function resolveInternal(from: string, specifier: string): string | null {
	let base: string;
	if (specifier.startsWith('#lib/')) base = join(LIB, specifier.slice('#lib/'.length));
	else if (specifier.startsWith('.')) base = resolve(dirname(from), specifier);
	else return null;
	const candidates = [base, ...EXTENSIONS.map((ext) => base + ext), join(base, 'index.ts')];
	return candidates.find((c) => existsSync(c) && statSync(c).isFile()) ?? base;
}

/** IO the core does not touch: it receives "now" and ids as parameters (CLAUDE.md, Arquitectura). */
const IO_FORBIDDEN_IN_CORE: [RegExp, string][] = [
	[/\bnew Date\(\s*\)/, 'new Date() without arguments (reads the clock)'],
	[/\bDate\.now\(/, 'Date.now()'],
	[/\bMath\.random\(/, 'Math.random()'],
	[/\bcrypto\./, 'crypto'],
	[/\b(setTimeout|setInterval|queueMicrotask)\(/, 'timers'],
	[/\b(fetch|localStorage|sessionStorage|indexedDB|window|document|navigator|process)\b/, 'environment APIs'],
	[/\bconsole\./, 'console']
];

/**
 * Local calendar (spec §5: the device's local time): reading or building dates
 * according to the process time zone. In the core it lives only in DAYS_LOCAL; the
 * rest compare instants (getTime) or ask that module.
 */
const DAYS_LOCAL = join(LIB, 'core/days.ts');
const CALENDAR_LOCAL: [RegExp, string][] = [
	[/\.(get|set)(FullYear|Month|Date|Day|Hours|Minutes|Seconds|Milliseconds)\(/, 'local Date getters/setters'],
	[/\.getTimezoneOffset\(|\.toLocale\w*\(|\bIntl\./, 'time zone or local format'],
	[/\bnew Date\([^()]*,/, 'new Date(year, month, …) in local time'],
	[/\bnew Date\(\s*['"`]|\bDate\.parse\(/, 'parsing dates from text']
];

const errors: string[] = [];
const graph = new Map<string, string[]>();
const all = [...files(join(ROOT, 'src')), ...files(join(ROOT, 'acceptance'))];

for (const file of all) {
	const layer = layerOf(file);
	if (layer === 'core') {
		const withoutComments = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '').replace(/\bfrom\s*'[^'\n]*'/g, "from ''");
		for (const [pattern, that] of IO_FORBIDDEN_IN_CORE)
			if (pattern.test(withoutComments)) errors.push(`${relative(ROOT, file)}: the core does not use ${that}`);
		if (file !== DAYS_LOCAL)
			for (const [pattern, that] of CALENDAR_LOCAL)
				if (pattern.test(withoutComments))
					errors.push(`${relative(ROOT, file)}: ${that} only in ${relative(ROOT, DAYS_LOCAL)}`);
	}
	const rule = layer && RULES[layer];
	const internal: string[] = [];
	for (const specifier of specifiers(file)) {
		const target = resolveInternal(file, specifier);
		const where = `${relative(ROOT, file)} → ${specifier}`;
		if (target === null) {
			if (rule && !rule.packages.some((p) => specifier === p || specifier.startsWith(p)))
				errors.push(`${where}: the ${layer} layer cannot import the package "${specifier}"`);
			continue;
		}
		if (target.endsWith('.css')) continue;
		if (!existsSync(target)) {
			errors.push(`${where}: module not found`);
			continue;
		}
		internal.push(target);
		const layerTarget = layerOf(target);
		if (rule && layerTarget && layerTarget !== layer && !rule.layers.includes(layerTarget))
			errors.push(`${where}: the ${layer} layer cannot depend on ${layerTarget}`);
		if (rule && layer !== 'core-test' && layerTarget === 'core-test')
			errors.push(`${where}: only tests import tests`);
	}
	graph.set(file, internal);
}

// Cycles: DFS with colors over the internal import graph.
const color = new Map<string, 'gray' | 'black'>();
function visit(node: string, path: string[]): void {
	color.set(node, 'gray');
	for (const neighbor of graph.get(node) ?? []) {
		if (color.get(neighbor) === 'gray') {
			const cycle = [...path.slice(path.indexOf(neighbor)), neighbor];
			errors.push(`import cycle: ${cycle.map((c) => relative(ROOT, c)).join(' → ')}`);
		} else if (!color.has(neighbor)) visit(neighbor, [...path, neighbor]);
	}
	color.set(node, 'black');
}
for (const node of graph.keys()) if (!color.has(node)) visit(node, [node]);

if (errors.length > 0) {
	console.error(`check:arch: ${errors.length} violation(s)\n${errors.map((e) => `  - ${e}`).join('\n')}`);
	process.exit(1);
}
console.log(`check:arch: OK (${all.length} files, no violations or cycles)`);
