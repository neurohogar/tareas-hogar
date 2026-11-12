import { spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { directorioTemporal, FIRMA, git, repoNuevo } from './apoyo';

const GATE = resolve('scripts/gate.ts');

let raiz: string;
let repo: string;

/** npm falso: anota cada llamada, falla si existe `falla` y escribe `salida`. */
function npmFalso(bin: string): void {
	const ruta = join(bin, 'npm');
	writeFileSync(ruta, `#!/bin/bash\necho "npm $*" >> "${raiz}/llamadas"\ncat "${raiz}/salida" 2>/dev/null\n[ ! -f "${raiz}/falla" ]\n`);
	chmodSync(ruta, 0o755);
}

/**
 * npx falso: como emulators:exec, ejecuta de verdad el comando que recibe. Como Playwright,
 * `--list` falla con «No tests found» en un proyecto anotado en `sin-specs`, o con lo que diga `error-de-carga`
 * más «No tests found», igual que Playwright con un spec que no carga.
 */
function npxFalso(bin: string): void {
	const ruta = join(bin, 'npx');
	writeFileSync(
		ruta,
		`#!/bin/bash
echo "npx $*" >> "${raiz}/llamadas"
if [ "$1" = firebase ]; then bash -c "\${@: -1}"; exit $?; fi
if [ "$1" = playwright ]; then
	proyecto=$(grep -o -- '--project=[a-z]*' <<<"$*")
	if [ -f "${raiz}/error-de-carga" ]; then cat "${raiz}/error-de-carga"; [[ "$*" == *--list* ]] && printf 'Error: No tests found.\\nTotal: 0 tests in 0 files\\n'; exit 1; fi
	if [[ "$*" == *--list* ]]; then
		if grep -qx -- "$proyecto" "${raiz}/sin-specs" 2>/dev/null; then printf 'Error: No tests found.\\nListing tests:\\nTotal: 0 tests in 0 files\\n'; exit 1; fi
		cat "${raiz}/listado" 2>/dev/null
		exit 0
	fi
	cat "${raiz}/salida" 2>/dev/null
	[ ! -f "${raiz}/falla-playwright" ]
	exit $?
fi
cat "${raiz}/salida" 2>/dev/null
[ ! -f "${raiz}/falla" ]
`
	);
	chmodSync(ruta, 0o755);
}

/** Las corridas reales de Playwright, sin los --list. */
function corridasDePlaywright(): string[] {
	return llamadas().filter((l) => l.startsWith('npx playwright') && !l.includes('--list'));
}

function correrGate(guion = GATE) {
	const bin = join(raiz, 'bin');
	const r = spawnSync(process.execPath, [guion, 'qa'], { cwd: repo, encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}` } });
	return { codigo: r.status, salida: `${r.stdout}${r.stderr}` };
}

function llamadas(): string[] {
	const ruta = join(raiz, 'llamadas');
	return existsSync(ruta) ? readFileSync(ruta, 'utf8').trim().split('\n') : [];
}

function commitDeQa(archivo = 'cambio.txt'): void {
	mkdirSync(join(repo, archivo, '..'), { recursive: true });
	writeFileSync(join(repo, archivo), `${Date.now()}${Math.random()}\n`);
	git(repo, 'add', '-A');
	git(repo, 'commit', '-q', '-m', `un cambio\n\nBy qa.\n\n${FIRMA}`);
}

beforeEach(() => {
	raiz = directorioTemporal();
	repo = join(raiz, 'repo');
	mkdirSync(join(raiz, 'bin'));
	mkdirSync(repo);
	repoNuevo(repo);
	git(repo, 'checkout', '-q', '-b', 'wt');
	npmFalso(join(raiz, 'bin'));
	npxFalso(join(raiz, 'bin'));
	commitDeQa();
});

describe('el gate no repite lo que ya pasó', () => {
	it('en el mismo commit da OK sin correr ningún paso', () => {
		expect(correrGate().codigo).toBe(0);
		const antes = llamadas().length;
		expect(antes).toBeGreaterThan(0);
		const segundo = correrGate();
		expect(segundo.codigo).toBe(0);
		expect(segundo.salida).toContain('GATE qa: OK (ya pasó en este commit)');
		expect(llamadas()).toHaveLength(antes);
	});

	it('con un commit nuevo vuelve a correr los pasos', () => {
		correrGate();
		commitDeQa();
		const antes = llamadas().length;
		const segundo = correrGate();
		expect(segundo.salida).not.toContain('ya pasó');
		expect(llamadas().length).toBeGreaterThan(antes);
	});

	it.each(['paquete-actual', 'base-de-feature'])('si cambia tmp/%s vuelve a correr los pasos', (anotado) => {
		correrGate();
		writeFileSync(join(repo, 'tmp', anotado), 'otro\n');
		const antes = llamadas().length;
		expect(correrGate().salida).not.toContain('ya pasó');
		expect(llamadas().length).toBeGreaterThan(antes);
	});

	it('si cambia el propio gate vuelve a correr los pasos', () => {
		correrGate();
		const copia = join(raiz, 'gate-copia.ts');
		copyFileSync(GATE, copia);
		writeFileSync(copia, `${readFileSync(copia, 'utf8')}\n// otra versión\n`);
		const antes = llamadas().length;
		expect(correrGate(copia).salida).not.toContain('ya pasó');
		expect(llamadas().length).toBeGreaterThan(antes);
	});

	it('sin base anotada, si cambia lo que se compara contra v2 vuelve a correr los pasos', () => {
		correrGate();
		git(repo, 'branch', '-f', 'v2', 'HEAD');
		const antes = llamadas().length;
		expect(correrGate().salida).not.toContain('ya pasó');
		expect(llamadas().length).toBeGreaterThan(antes);
	});

	it('borrar la marca fuerza una corrida nueva', () => {
		correrGate();
		rmSync(join(repo, 'tmp/gate-verde-qa'));
		const antes = llamadas().length;
		expect(correrGate().salida).not.toContain('ya pasó');
		expect(llamadas().length).toBeGreaterThan(antes);
	});

	it('una falla no queda guardada como verde', () => {
		writeFileSync(join(raiz, 'falla'), '');
		const fallida = correrGate();
		expect(fallida.codigo).toBe(1);
		expect(fallida.salida).toContain('GATE qa: FALLA en test:unit');
		rmSync(join(raiz, 'falla'));
		const siguiente = correrGate();
		expect(siguiente.codigo).toBe(0);
		expect(siguiente.salida).not.toContain('ya pasó');
	});

	it('con el árbol sucio falla aunque ya hubiera pasado', () => {
		correrGate();
		writeFileSync(join(repo, 'cambio.txt'), 'sin commitear\n');
		const r = correrGate();
		expect(r.codigo).toBe(1);
		expect(r.salida).toContain('hay cambios sin commitear');
	});
});

describe('la suite de los specs cambiados', () => {
	const SPEC = 'e2e/nuevo.spec.ts';

	it('corre ui y después pwa sin arrastrar dependencias', () => {
		commitDeQa(SPEC);
		writeFileSync(join(raiz, 'salida'), `  ✓  1 [ui] › ${SPEC}:3:1 › un flujo (1.0s)\n`);
		expect(correrGate().codigo).toBe(0);
		const corridas = corridasDePlaywright();
		expect(corridas).toHaveLength(2);
		expect(corridas[0]).toContain('--project=ui');
		expect(corridas[1]).toContain('--project=pwa --no-deps');
	});

	it('no levanta un proyecto que no tiene ninguno de los specs', () => {
		commitDeQa(SPEC);
		writeFileSync(join(raiz, 'sin-specs'), '--project=pwa\n');
		writeFileSync(join(raiz, 'salida'), `  ✓  1 [ui] › ${SPEC}:3:1 › un flujo (1.0s)\n`);
		expect(correrGate().codigo).toBe(0);
		const corridas = corridasDePlaywright();
		expect(corridas).toHaveLength(1);
		expect(corridas[0]).toContain('--project=ui');
	});

	it('un test cuyo título menciona «No tests found» no hace saltear su proyecto', () => {
		commitDeQa(SPEC);
		writeFileSync(join(raiz, 'listado'), `  [ui] › ${SPEC}:3:1 › avisa No tests found\nTotal: 1 test in 1 file\n`);
		writeFileSync(join(raiz, 'salida'), `  ✓  1 [ui] › ${SPEC}:3:1 › avisa No tests found (1.0s)\n`);
		expect(correrGate().codigo).toBe(0);
		expect(corridasDePlaywright()[0]).toContain('--project=ui');
	});

	it('si falla un test, el gate falla aunque el otro proyecto no tenga specs', () => {
		commitDeQa(SPEC);
		writeFileSync(join(raiz, 'sin-specs'), '--project=pwa\n');
		writeFileSync(join(raiz, 'salida'), `  ✓  1 [ui] › ${SPEC}:3:1 › un flujo (1.0s)\n`);
		writeFileSync(join(raiz, 'falla-playwright'), '');
		const r = correrGate();
		expect(r.codigo).toBe(1);
		expect(existsSync(join(repo, 'tmp/gate-verde-qa'))).toBe(false);
	});

	it.each(['SyntaxError: e2e/nuevo.spec.ts: Unexpected token (3:1)', "Error: Cannot find module 'e2e/no-existe'"])('un spec que no carga muestra su error real: %s', (error) => {
		commitDeQa(SPEC);
		const ruidoDelServidor = Array.from({ length: 40 }, (_, i) => `[WebServer] línea ${i}`).join('\n');
		writeFileSync(join(raiz, 'error-de-carga'), `${error}\n${ruidoDelServidor}\n`);
		const r = correrGate();
		expect(r.codigo).toBe(1);
		expect(r.salida).toContain(error);
		expect(existsSync(join(repo, 'tmp/gate-verde-qa'))).toBe(false);
	});

	it('falla si un spec cambiado no corrió ningún test, y no lo guarda como verde', () => {
		commitDeQa(SPEC);
		const r = correrGate();
		expect(r.codigo).toBe(1);
		expect(r.salida).toContain(`no corrió ningún test: ${SPEC}`);
		expect(existsSync(join(repo, 'tmp/gate-verde-qa'))).toBe(false);
	});

	it('un spec con todos sus tests salteados tampoco cuenta como corrido', () => {
		commitDeQa(SPEC);
		writeFileSync(join(raiz, 'salida'), `  -  1 [ui] › ${SPEC}:3:1 › un flujo\n`);
		expect(correrGate().codigo).toBe(1);
	});
});
