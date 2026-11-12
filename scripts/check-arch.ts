// npm run check:arch — dirección de dependencias, imports prohibidos y ciclos.
//
// Cada archivo de src/ y acceptance/ pertenece a una capa. REGLAS dice, por
// capa, a qué capas internas puede importar y qué paquetes externos puede usar.
// Es la estructura deseada: si una corrección legítima es una llamada hacia
// adentro que no figura, se agrega acá.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

type Capa = 'core' | 'acceptance-oracle' | 'acceptance-ir' | 'core-test' | 'adapters' | 'adapters-firebase' | 'ui' | 'acceptance' | 'service-worker';

interface Regla {
	capas: Capa[];
	/** Prefijos de paquetes externos permitidos ('firebase/' cubre 'firebase/auth'). */
	paquetes: string[];
}

const REGLAS: Record<Capa, Regla> = {
	// TypeScript puro: ni IO, ni Firebase, ni Svelte, ni SvelteKit.
	core: { capas: ['core'], paquetes: [] },
	'core-test': { capas: ['core'], paquetes: ['vitest', 'fast-check'] },
	// Cáscaras finas: traducen entre el core y Firebase/el navegador.
	adapters: { capas: ['core', 'adapters', 'adapters-firebase'], paquetes: ['firebase/'] },
	'adapters-firebase': { capas: [], paquetes: ['firebase/'] },
	// La UI pregunta al core y usa los adapters por su API pública; nunca a Firebase directo.
	ui: { capas: ['core', 'adapters', 'ui'], paquetes: ['svelte', '$app/', 'emoji-picker-element', 'emoji-picker-element-data/'] },
	// Corre en un worker del navegador: solo el core (puro) y el módulo virtual de SvelteKit; nunca adapters.
	'service-worker': { capas: ['core'], paquetes: ['$service-worker'] },
	// La aceptación ejercita solo el core.
	acceptance: { capas: ['core', 'acceptance', 'acceptance-ir'], paquetes: ['vitest', 'node:'] },
	// Forma del IR: tipos puros.
	'acceptance-ir': { capas: [], paquetes: [] },
	// Oráculo del filtro de equivalentes: reglas del spec reescritas de forma independiente.
	// Nunca importa el core, los step handlers ni el despacho (sería circular).
	'acceptance-oracle': { capas: ['acceptance-oracle', 'acceptance-ir'], paquetes: [] }
};

const RAIZ = resolve(import.meta.dirname, '..');
const LIB = join(RAIZ, 'src/lib');
const EXTENSIONES = ['.ts', '.svelte'];

function capaDe(archivo: string): Capa | null {
	const ruta = relative(RAIZ, archivo);
	if (ruta.startsWith('src/lib/core/')) return ruta.endsWith('.test.ts') ? 'core-test' : 'core';
	if (ruta === 'src/lib/adapters/firebase.ts') return 'adapters-firebase';
	if (ruta.startsWith('src/lib/adapters/')) return 'adapters';
	if (ruta === 'src/service-worker.ts') return 'service-worker';
	if (ruta.startsWith('src/lib/ui/') || ruta.startsWith('src/routes/')) return 'ui';
	if (['acceptance/oracle.ts', 'acceptance/oracle-edicion.ts', 'acceptance/oracle-historial.ts', 'acceptance/oracle-etiquetas.ts', 'acceptance/oracle-panel.ts', 'acceptance/oracle-pantalla-de-carga.ts', 'acceptance/equivalence.ts'].includes(ruta)) return 'acceptance-oracle';
	if (ruta === 'acceptance/ir.ts') return 'acceptance-ir';
	if (ruta.startsWith('acceptance/') && !ruta.startsWith('acceptance/generated/')) return 'acceptance';
	return null;
}

function archivos(dir: string): string[] {
	return readdirSync(dir).flatMap((nombre) => {
		const ruta = join(dir, nombre);
		if (statSync(ruta).isDirectory()) return nombre === 'generated' ? [] : archivos(ruta);
		return EXTENSIONES.some((ext) => nombre.endsWith(ext)) ? [ruta] : [];
	});
}

// Imports y re-exports al comienzo de una línea (no los que aparecen dentro de strings), e import() dinámico.
const IMPORT =
	/^\s*(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/gm;

function especificadores(archivo: string): string[] {
	const fuente = readFileSync(archivo, 'utf8');
	return [...fuente.matchAll(IMPORT)].map((m) => m[1] ?? m[2] ?? m[3]);
}

/** Ruta absoluta de un import interno, o null si es un paquete externo. */
function resolverInterno(desde: string, especificador: string): string | null {
	let base: string;
	if (especificador.startsWith('#lib/')) base = join(LIB, especificador.slice('#lib/'.length));
	else if (especificador.startsWith('.')) base = resolve(dirname(desde), especificador);
	else return null;
	const candidatos = [base, ...EXTENSIONES.map((ext) => base + ext), join(base, 'index.ts')];
	return candidatos.find((c) => existsSync(c) && statSync(c).isFile()) ?? base;
}

/** IO que el core no toca: recibe "ahora" e ids como parámetros (CLAUDE.md, Arquitectura). */
const IO_PROHIBIDO_EN_CORE: [RegExp, string][] = [
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
const DIAS_LOCALES = join(LIB, 'core/dias.ts');
const CALENDARIO_LOCAL: [RegExp, string][] = [
	[/\.(get|set)(FullYear|Month|Date|Day|Hours|Minutes|Seconds|Milliseconds)\(/, 'getters/setters locales de Date'],
	[/\.getTimezoneOffset\(|\.toLocale\w*\(|\bIntl\./, 'zona horaria o formato local'],
	[/\bnew Date\([^()]*,/, 'new Date(año, mes, …) en hora local'],
	[/\bnew Date\(\s*['"`]|\bDate\.parse\(/, 'parseo de fechas en texto']
];

const errores: string[] = [];
const grafo = new Map<string, string[]>();
const todos = [...archivos(join(RAIZ, 'src')), ...archivos(join(RAIZ, 'acceptance'))];

for (const archivo of todos) {
	const capa = capaDe(archivo);
	if (capa === 'core') {
		const sinComentarios = readFileSync(archivo, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
		for (const [patron, que] of IO_PROHIBIDO_EN_CORE)
			if (patron.test(sinComentarios)) errores.push(`${relative(RAIZ, archivo)}: el core no usa ${que}`);
		if (archivo !== DIAS_LOCALES)
			for (const [patron, que] of CALENDARIO_LOCAL)
				if (patron.test(sinComentarios))
					errores.push(`${relative(RAIZ, archivo)}: ${que} solo en ${relative(RAIZ, DIAS_LOCALES)}`);
	}
	const regla = capa && REGLAS[capa];
	const internos: string[] = [];
	for (const especificador of especificadores(archivo)) {
		const destino = resolverInterno(archivo, especificador);
		const donde = `${relative(RAIZ, archivo)} → ${especificador}`;
		if (destino === null) {
			if (regla && !regla.paquetes.some((p) => especificador === p || especificador.startsWith(p)))
				errores.push(`${donde}: la capa ${capa} no puede importar el paquete "${especificador}"`);
			continue;
		}
		if (destino.endsWith('.css')) continue;
		if (!existsSync(destino)) {
			errores.push(`${donde}: no se encuentra el módulo`);
			continue;
		}
		internos.push(destino);
		const capaDestino = capaDe(destino);
		if (regla && capaDestino && capaDestino !== capa && !regla.capas.includes(capaDestino))
			errores.push(`${donde}: la capa ${capa} no puede depender de ${capaDestino}`);
		if (regla && capa !== 'core-test' && capaDestino === 'core-test')
			errores.push(`${donde}: solo los tests importan tests`);
	}
	grafo.set(archivo, internos);
}

// Ciclos: DFS con colores sobre el grafo de imports internos.
const color = new Map<string, 'gris' | 'negro'>();
function visitar(nodo: string, camino: string[]): void {
	color.set(nodo, 'gris');
	for (const vecino of grafo.get(nodo) ?? []) {
		if (color.get(vecino) === 'gris') {
			const ciclo = [...camino.slice(camino.indexOf(vecino)), vecino];
			errores.push(`ciclo de imports: ${ciclo.map((c) => relative(RAIZ, c)).join(' → ')}`);
		} else if (!color.has(vecino)) visitar(vecino, [...camino, vecino]);
	}
	color.set(nodo, 'negro');
}
for (const nodo of grafo.keys()) if (!color.has(nodo)) visitar(nodo, [nodo]);

if (errores.length > 0) {
	console.error(`check:arch: ${errores.length} violación(es)\n${errores.map((e) => `  - ${e}`).join('\n')}`);
	process.exit(1);
}
console.log(`check:arch: OK (${todos.length} archivos, sin violaciones ni ciclos)`);
