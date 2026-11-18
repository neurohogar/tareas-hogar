import { spawnSync, type SpawnSyncOptions } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const FIRMA = 'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>';

export function directorioTemporal(): string {
	return mkdtempSync(join(tmpdir(), 'tareas-scripts-'));
}

export function git(repo: string, ...args: string[]): string {
	return gitConFecha(repo, undefined, ...args);
}

/** `fecha` en segundos desde la época, para las duraciones que salen de los commits. */
export function gitConFecha(repo: string, fecha: number | undefined, ...args: string[]): string {
	const momento = fecha === undefined ? {} : { GIT_COMMITTER_DATE: `${fecha} +0000`, GIT_AUTHOR_DATE: `${fecha} +0000` };
	const opciones: SpawnSyncOptions = {
		cwd: repo,
		encoding: 'utf8',
		maxBuffer: 64 * 1024 * 1024,
		env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t', ...momento }
	};
	const r = spawnSync('git', args, opciones);
	if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
	return String(r.stdout).trim();
}

/** Un repo con rama v2, un commit y tmp/ ignorado. */
export function repoNuevo(repo: string, fecha?: number): void {
	mkdirSync(join(repo, 'tmp'), { recursive: true });
	mkdirSync(join(repo, 'features'), { recursive: true });
	writeFileSync(join(repo, '.gitignore'), 'tmp/\n');
	writeFileSync(join(repo, 'features', '.gitkeep'), '');
	git(repo, 'init', '-q', '-b', 'v2');
	git(repo, 'add', '-A');
	gitConFecha(repo, fecha, 'commit', '-q', '-m', 'inicio');
}
