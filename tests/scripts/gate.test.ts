import { spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { directoryTemporary, SIGNATURE, git, repoNew } from './support';

const GATE = resolve('scripts/gate.ts');

let root: string;
let repo: string;

/** Fake npm: notes each call, fails if `falla` exists and writes `salida`. */
function npmFake(bin: string): void {
	const path = join(bin, 'npm');
	writeFileSync(path, `#!/bin/bash\necho "npm $*" >> "${root}/llamadas"\ncat "${root}/salida" 2>/dev/null\n[ ! -f "${root}/falla" ]\n`);
	chmodSync(path, 0o755);
}

/**
 * Fake npx: like emulators:exec, it actually runs the command it receives. Like Playwright,
 * `--list` fails with «No tests found» in a project noted in `sin-specs`, or with whatever `error-de-carga` says
 * plus «No tests found», like Playwright with a spec that does not load.
 */
function npxFake(bin: string): void {
	const path = join(bin, 'npx');
	writeFileSync(
		path,
		`#!/bin/bash
echo "npx $*" >> "${root}/llamadas"
if [ "$1" = firebase ]; then bash -c "\${@: -1}"; exit $?; fi
if [ "$1" = playwright ]; then
	proyecto=$(grep -o -- '--project=[a-z]*' <<<"$*")
	if [ -f "${root}/error-de-carga" ]; then cat "${root}/error-de-carga"; [[ "$*" == *--list* ]] && printf 'Error: No tests found.\\nTotal: 0 tests in 0 files\\n'; exit 1; fi
	if [[ "$*" == *--list* ]]; then
		if grep -qx -- "$proyecto" "${root}/sin-specs" 2>/dev/null; then printf 'Error: No tests found.\\nListing tests:\\nTotal: 0 tests in 0 files\\n'; exit 1; fi
		cat "${root}/listado" 2>/dev/null
		exit 0
	fi
	cat "${root}/salida" 2>/dev/null
	[ ! -f "${root}/falla-playwright" ]
	exit $?
fi
cat "${root}/salida" 2>/dev/null
[ ! -f "${root}/falla" ]
`
	);
	chmodSync(path, 0o755);
}

/** The real Playwright runs, without the --list ones. */
function playwrightRuns(): string[] {
	return calls().filter((l) => l.startsWith('npx playwright') && !l.includes('--list'));
}

function runGate(script = GATE) {
	const bin = join(root, 'bin');
	const r = spawnSync(process.execPath, [script, 'qa'], { cwd: repo, encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}` } });
	return { code: r.status, output: `${r.stdout}${r.stderr}` };
}

function calls(): string[] {
	const path = join(root, 'llamadas');
	return existsSync(path) ? readFileSync(path, 'utf8').trim().split('\n') : [];
}

function qaCommit(file = 'cambio.txt'): void {
	mkdirSync(join(repo, file, '..'), { recursive: true });
	writeFileSync(join(repo, file), `${Date.now()}${Math.random()}\n`);
	git(repo, 'add', '-A');
	git(repo, 'commit', '-q', '-m', `un cambio\n\nBy qa.\n\n${SIGNATURE}`);
}

beforeEach(() => {
	root = directoryTemporary();
	repo = join(root, 'repo');
	mkdirSync(join(root, 'bin'));
	mkdirSync(repo);
	repoNew(repo);
	git(repo, 'checkout', '-q', '-b', 'wt');
	npmFake(join(root, 'bin'));
	npxFake(join(root, 'bin'));
	qaCommit();
});

describe('the gate does not repeat what already passed', () => {
	it('on the same commit it gives OK without running any step', () => {
		expect(runGate().code).toBe(0);
		const before = calls().length;
		expect(before).toBeGreaterThan(0);
		const second = runGate();
		expect(second.code).toBe(0);
		expect(second.output).toContain('GATE qa: OK (ya pasó en este commit)');
		expect(calls()).toHaveLength(before);
	});

	it('with a new commit it runs the steps again', () => {
		runGate();
		qaCommit();
		const before = calls().length;
		const second = runGate();
		expect(second.output).not.toContain('ya pasó');
		expect(calls().length).toBeGreaterThan(before);
	});

	it.each(['paquete-actual', 'base-de-feature'])('if tmp/%s changes it runs the steps again', (annotated) => {
		runGate();
		writeFileSync(join(repo, 'tmp', annotated), 'otro\n');
		const before = calls().length;
		expect(runGate().output).not.toContain('ya pasó');
		expect(calls().length).toBeGreaterThan(before);
	});

	it('if the gate itself changes it runs the steps again', () => {
		runGate();
		const copy = join(root, 'gate-copia.ts');
		copyFileSync(GATE, copy);
		writeFileSync(copy, `${readFileSync(copy, 'utf8')}\n// another version\n`);
		const before = calls().length;
		expect(runGate(copy).output).not.toContain('ya pasó');
		expect(calls().length).toBeGreaterThan(before);
	});

	it('without a noted base, if what is compared against v2 changes it runs the steps again', () => {
		runGate();
		git(repo, 'branch', '-f', 'v2', 'HEAD');
		const before = calls().length;
		expect(runGate().output).not.toContain('ya pasó');
		expect(calls().length).toBeGreaterThan(before);
	});

	it('deleting the mark forces a new run', () => {
		runGate();
		rmSync(join(repo, 'tmp/gate-verde-qa'));
		const before = calls().length;
		expect(runGate().output).not.toContain('ya pasó');
		expect(calls().length).toBeGreaterThan(before);
	});

	it('a failure is not stored as green', () => {
		writeFileSync(join(root, 'falla'), '');
		const failed = runGate();
		expect(failed.code).toBe(1);
		expect(failed.output).toContain('GATE qa: FALLA en test:unit');
		rmSync(join(root, 'falla'));
		const next = runGate();
		expect(next.code).toBe(0);
		expect(next.output).not.toContain('ya pasó');
	});

	it('with a dirty tree it fails even if it had already passed', () => {
		runGate();
		writeFileSync(join(repo, 'cambio.txt'), 'sin commitear\n');
		const r = runGate();
		expect(r.code).toBe(1);
		expect(r.output).toContain('hay cambios sin commitear');
	});
});

describe('the suite of the changed specs', () => {
	const SPEC = 'e2e/nuevo.spec.ts';

	it('runs ui and then pwa without dragging in dependencies', () => {
		qaCommit(SPEC);
		writeFileSync(join(root, 'salida'), `  ✓  1 [ui] › ${SPEC}:3:1 › un flujo (1.0s)\n`);
		expect(runGate().code).toBe(0);
		const runs = playwrightRuns();
		expect(runs).toHaveLength(2);
		expect(runs[0]).toContain('--project=ui');
		expect(runs[1]).toContain('--project=pwa --no-deps');
	});

	it('does not start a project that has none of the specs', () => {
		qaCommit(SPEC);
		writeFileSync(join(root, 'sin-specs'), '--project=pwa\n');
		writeFileSync(join(root, 'salida'), `  ✓  1 [ui] › ${SPEC}:3:1 › un flujo (1.0s)\n`);
		expect(runGate().code).toBe(0);
		const runs = playwrightRuns();
		expect(runs).toHaveLength(1);
		expect(runs[0]).toContain('--project=ui');
	});

	it('a test whose title mentions «No tests found» does not make its project be skipped', () => {
		qaCommit(SPEC);
		writeFileSync(join(root, 'listado'), `  [ui] › ${SPEC}:3:1 › avisa No tests found\nTotal: 1 test in 1 file\n`);
		writeFileSync(join(root, 'salida'), `  ✓  1 [ui] › ${SPEC}:3:1 › avisa No tests found (1.0s)\n`);
		expect(runGate().code).toBe(0);
		expect(playwrightRuns()[0]).toContain('--project=ui');
	});

	it('if a test fails, the gate fails even if the other project has no specs', () => {
		qaCommit(SPEC);
		writeFileSync(join(root, 'sin-specs'), '--project=pwa\n');
		writeFileSync(join(root, 'salida'), `  ✓  1 [ui] › ${SPEC}:3:1 › un flujo (1.0s)\n`);
		writeFileSync(join(root, 'falla-playwright'), '');
		const r = runGate();
		expect(r.code).toBe(1);
		expect(existsSync(join(repo, 'tmp/gate-verde-qa'))).toBe(false);
	});

	it.each(['SyntaxError: e2e/nuevo.spec.ts: Unexpected token (3:1)', "Error: Cannot find module 'e2e/no-existe'"])('un spec que no carga muestra su error real: %s', (error) => {
		qaCommit(SPEC);
		const serverNoise = Array.from({ length: 40 }, (_, i) => `[WebServer] línea ${i}`).join('\n');
		writeFileSync(join(root, 'error-de-carga'), `${error}\n${serverNoise}\n`);
		const r = runGate();
		expect(r.code).toBe(1);
		expect(r.output).toContain(error);
		expect(existsSync(join(repo, 'tmp/gate-verde-qa'))).toBe(false);
	});

	it('fails if a changed spec ran no test, and does not store it as green', () => {
		qaCommit(SPEC);
		const r = runGate();
		expect(r.code).toBe(1);
		expect(r.output).toContain(`no corrió ningún test: ${SPEC}`);
		expect(existsSync(join(repo, 'tmp/gate-verde-qa'))).toBe(false);
	});

	it('a spec with all its tests skipped does not count as run either', () => {
		qaCommit(SPEC);
		writeFileSync(join(root, 'salida'), `  -  1 [ui] › ${SPEC}:3:1 › un flujo\n`);
		expect(runGate().code).toBe(1);
	});
});
