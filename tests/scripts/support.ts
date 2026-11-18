import { spawnSync, type SpawnSyncOptions } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const SIGNATURE = 'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>';

export function directoryTemporary(): string {
	return mkdtempSync(join(tmpdir(), 'tareas-scripts-'));
}

export function git(repo: string, ...args: string[]): string {
	return gitWithDate(repo, undefined, ...args);
}

/** `date` in seconds since the epoch, for the durations derived from the commits. */
export function gitWithDate(repo: string, date: number | undefined, ...args: string[]): string {
	const moment = date === undefined ? {} : { GIT_COMMITTER_DATE: `${date} +0000`, GIT_AUTHOR_DATE: `${date} +0000` };
	const options: SpawnSyncOptions = {
		cwd: repo,
		encoding: 'utf8',
		maxBuffer: 64 * 1024 * 1024,
		env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t', ...moment }
	};
	const r = spawnSync('git', args, options);
	if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
	return String(r.stdout).trim();
}

/** A repo with a v2 branch, one commit and tmp/ ignored. */
export function repoNew(repo: string, date?: number): void {
	mkdirSync(join(repo, 'tmp'), { recursive: true });
	mkdirSync(join(repo, 'features'), { recursive: true });
	writeFileSync(join(repo, '.gitignore'), 'tmp/\n');
	writeFileSync(join(repo, 'features', '.gitkeep'), '');
	git(repo, 'init', '-q', '-b', 'v2');
	git(repo, 'add', '-A');
	gitWithDate(repo, date, 'commit', '-q', '-m', 'inicio');
}
