import { spawn, spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { directoryTemporary } from './support';

const PROGRESS = resolve('scripts/progreso.ts');
const MINUTE_MS = 60_000;

let home: string;
let tmp: string;
let log: string;

/** Runs the tracking until its output satisfies `ready` (or the deadline passes), and ends it the way a Monitor ends it. */
function follow(args: string[], ready: (output: string) => boolean): Promise<string> {
	return new Promise((resolve) => {
		const child = spawn(process.execPath, [PROGRESS, ...args], { env: { ...process.env, HOME: home } });
		let output = '';
		const finish = () => child.kill();
		const deadline = setTimeout(finish, 4000);
		child.stdout.on('data', (piece) => {
			output += String(piece);
			if (ready(output)) finish();
		});
		child.on('close', () => {
			clearTimeout(deadline);
			resolve(output);
		});
	});
}

/** Starts a new tracking, until it has noted where it continues from. */
function start(): Promise<void> {
	const status = join(tmp, 'seguimiento-qa.json');
	rmSync(status, { force: true });
	return new Promise((resolve) => {
		const child = spawn(process.execPath, [PROGRESS, 'qa', '27'], { env: { ...process.env, HOME: home } });
		const wait = setInterval(() => {
			if (!existsSync(status)) return;
			clearInterval(wait);
			child.kill();
		}, 20);
		child.on('close', () => resolve());
	});
}

const annotated = () => JSON.parse(readFileSync(join(tmp, 'seguimiento-qa.json'), 'utf8'));

beforeEach(() => {
	home = directoryTemporary();
	tmp = join(home, 'Work/tareas-hogar-worktrees/pipeline/tmp');
	mkdirSync(tmp, { recursive: true });
	log = join(tmp, 'progreso.log');
	writeFileSync(log, '10:00 qa: viejo\n');
});

describe('rebuilding the tracking with --continuar', () => {
	it('shows what was noted while there was no tracking, and not what came before', async () => {
		await start();
		appendFileSync(log, '10:30 qa: en el medio\n');
		const output = await follow(['qa', '27', '--continuar'], (s) => s.includes('en el medio'));
		expect(output).toContain('10:30 qa: en el medio');
		expect(output).not.toContain('viejo');
	});

	it('keeps how long the role has been running and when the last update was', async () => {
		await start();
		const status = annotated();
		const now = Date.now();
		writeFileSync(join(tmp, 'seguimiento-qa.json'), JSON.stringify({ ...status, inicio: now - 50 * MINUTE_MS, ultimaNovedad: now - 20 * MINUTE_MS }));
		const output = await follow(['qa', '27', '--continuar'], (s) => s.includes('lleva'));
		expect(output).toContain('qa: lleva 50 min (estimado 27); última novedad hace 20 min');
	});

	it('if the log was truncated it reads it from the start, without fragments', async () => {
		appendFileSync(log, `10:01 qa: ${'relleno '.repeat(20)}\n`);
		await start();
		writeFileSync(log, '11:00 qa: log nuevo\n');
		const output = await follow(['qa', '27', '--continuar'], (s) => s.includes('log nuevo'));
		expect(output).toContain('11:00 qa: log nuevo\n');
		expect(output.split('\n')[0]).toBe('11:00 qa: log nuevo');
	});

	it('with damaged notes it starts from zero instead of breaking', async () => {
		await start();
		writeFileSync(join(tmp, 'seguimiento-qa.json'), '{"inicio":17');
		const output = await follow(['qa', '27', '--continuar'], (s) => s.includes('lleva'));
		expect(output).toContain('qa: lleva 0 min (estimado 27)');
	});

	it('without a previous tracking it starts from zero', async () => {
		const output = await follow(['qa', '27', '--continuar'], (s) => s.includes('lleva'));
		expect(output).toContain('qa: lleva 0 min (estimado 27); última novedad hace 0 min');
		expect(output).not.toContain('viejo');
	});
});

describe('a new tracking', () => {
	it('does not inherit the time of the previous role', async () => {
		await start();
		writeFileSync(join(tmp, 'seguimiento-qa.json'), JSON.stringify({ ...annotated(), inicio: Date.now() - 50 * MINUTE_MS }));
		await start();
		const output = await follow(['qa', '27', '--continuar'], (s) => s.includes('lleva'));
		expect(output).toContain('qa: lleva 0 min');
	});

	it('deletes the temp file of a dead tracking and respects that of a live one', async () => {
		const dead = join(tmp, `seguimiento-qa.json.${spawnSync('true').pid}`);
		const live = join(tmp, `seguimiento-qa.json.${process.pid}`);
		const ofOtherRole = join(tmp, `seguimiento-hardener.json.${spawnSync('true').pid}`);
		for (const temporary of [dead, live, ofOtherRole]) writeFileSync(temporary, '{}');
		await start();
		expect(existsSync(dead)).toBe(false);
		expect(existsSync(live)).toBe(true);
		expect(existsSync(ofOtherRole)).toBe(true);
	});

	it('works without the log existing yet', async () => {
		rmSync(log);
		await start();
		const output = await follow(['qa', '--continuar'], (s) => s.includes('lleva'));
		expect(output).toContain('qa: lleva 0 min; última novedad hace 0 min');
	});
});
