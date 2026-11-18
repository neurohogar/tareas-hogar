import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { directoryTemporary, SIGNATURE, gitWithDate, repoNew } from './support';

const PIPELINE = resolve('scripts/pipeline.ts');
const PROGRESS = resolve('scripts/progreso.ts');
const READING_MS = 15_000;
const START = 1_700_000_000;
const PACKAGE = 'docs/pipeline/paquetes/una.md';
const WITHOUT_SPECIFY = '# una\n\n## Specs\n\n## Artefactos\n';
const WITHOUT_GHERKIN = '# una\n\n## Specs\n\n- **S1** (§1): «regla»\n\n## Artefactos\n';
const SPECIFIED = `${WITHOUT_GHERKIN}\n- \`features/una.feature\`\n`;

let home: string;
let main: string;
let worktree: string;

/** Un commit del rol, `minutos` después del anterior. */
function historyView(durations: [string, number][]): void {
	let moment = START;
	for (const [role, minutes] of durations) {
		moment += minutes * 60;
		gitWithDate(worktree, moment, 'commit', '-q', '--allow-empty', '-m', `algo\n\nBy ${role}.\n\n${SIGNATURE}`);
	}
}

function runPipeline(pkg: string): string {
	writeFileSync(join(main, PACKAGE), pkg);
	const r = spawnSync(process.execPath, [PIPELINE], { encoding: 'utf8', env: { ...process.env, HOME: home } });
	expect(r.status).toBe(0);
	return r.stdout;
}

beforeEach(() => {
	home = directoryTemporary();
	main = join(home, 'Work/tareas-hogar');
	worktree = join(home, 'Work/tareas-hogar-worktrees/pipeline');
	mkdirSync(join(main, 'docs/pipeline/paquetes'), { recursive: true });
	mkdirSync(worktree, { recursive: true });
	repoNew(worktree, START);
	writeFileSync(join(worktree, 'tmp/paquete-actual'), `${PACKAGE}\n`);
});

const STRING: [string, number][] = [
	['core', 10],
	['acceptance', 20],
	['ui', 30],
	['cleaner', 5],
	['architect', 5],
	['hardener', 40],
	['qa', 50]
];

/** Sigue al rol con la línea SEGUIR, lo hace anotar con la línea Progreso de su prompt y devuelve lo que avisó el seguimiento. */
function roleNotice(output: string, directory: string): Promise<string> {
	const [role, ...rest] = /SEGUIR: node scripts\/progreso\.ts (.+)/.exec(output)![1].split(' ');
	const annotate = /Progreso: .*`(.+)`/.exec(output)![1].replace('<paso>', 'probando el aviso');
	const tracking = join(directory, `tmp/seguimiento-${role}.json`);
	return new Promise((resolve) => {
		const child = spawn(process.execPath, [PROGRESS, role, ...rest], { env: { ...process.env, HOME: home } });
		let notices = '';
		const deadline = setTimeout(() => child.kill(), READING_MS + 5000);
		const wait = setInterval(() => {
			if (!existsSync(tracking)) return;
			clearInterval(wait);
			spawnSync('bash', ['-c', annotate]);
		}, 20);
		child.stdout.on('data', (piece) => {
			notices += String(piece);
			if (notices.includes('probando el aviso')) child.kill();
		});
		child.on('close', () => {
			clearInterval(wait);
			clearTimeout(deadline);
			resolve(notices);
		});
	});
}

describe('el circuito de avisos', () => {
	it('lo que un rol de implementación anota según su prompt lo avisa el seguimiento de su línea SEGUIR', async () => {
		historyView(STRING);
		const notices = await roleNotice(runPipeline(SPECIFIED), worktree);
		expect(notices).toMatch(/^\d\d:\d\d core: probando el aviso$/m);
	}, READING_MS + 10_000);
});

describe('la estimación de cada rol', () => {
	it('un rol de implementación suma él y los que le siguen', () => {
		historyView(STRING);
		const output = runPipeline(SPECIFIED);
		expect(output).toContain('ESTIMADO: core unos 10 min (hasta 10). Lo que falta de la cadena: unos 160 min');
		expect(output).toContain('SEGUIR: node scripts/progreso.ts core 10');
	});

	it('spec-writer suma también gherkin-writer y toda la implementación', () => {
		historyView([['spec-writer', 3], ['gherkin-writer', 7], ...STRING]);
		expect(runPipeline(WITHOUT_SPECIFY)).toContain('ESTIMADO: spec-writer unos 3 min (hasta 3). Lo que falta de la cadena: unos 170 min');
	});

	it('gherkin-writer suma toda la implementación', () => {
		historyView([['spec-writer', 3], ['gherkin-writer', 7], ...STRING]);
		expect(runPipeline(WITHOUT_GHERKIN)).toContain('ESTIMADO: gherkin-writer unos 7 min (hasta 7). Lo que falta de la cadena: unos 167 min');
	});

	it('un rol sin historia no inventa un número', () => {
		historyView([['qa', 50]]);
		const output = runPipeline(SPECIFIED);
		expect(output).toContain('ESTIMADO: core sin historial. Lo que falta de la cadena: al menos 50 min');
		expect(output).toMatch(/^SEGUIR: node scripts\/progreso\.ts core$/m);
		expect(output).not.toContain('0 min (hasta');
	});

	it('sin historia de ningún rol tampoco da una hora de fin', () => {
		const output = runPipeline(SPECIFIED);
		expect(output).toMatch(/^ESTIMADO: core sin historial\.$/m);
	});

	it('los mensajes de commit largos no rompen la estimación', () => {
		historyView(STRING);
		const message = join(home, 'mensaje-largo');
		writeFileSync(message, `largo\n\n${'x'.repeat(700_000)}\n`);
		gitWithDate(worktree, START + 90_000, 'commit', '-q', '--allow-empty', '-F', message);
		gitWithDate(worktree, START + 90_060, 'commit', '-q', '--allow-empty', '-F', message);
		expect(runPipeline(SPECIFIED)).toContain('ESTIMADO: core unos 10 min');
	});
});

describe('el prompt del rol', () => {
	it('lleva la línea de progreso con ruta absoluta al directorio donde trabaja', () => {
		historyView(STRING);
		expect(runPipeline(SPECIFIED)).toContain(`>> ${worktree}/tmp/progreso.log`);
		expect(runPipeline(WITHOUT_SPECIFY)).toContain(`>> ${main}/tmp/progreso.log`);
	});
});
