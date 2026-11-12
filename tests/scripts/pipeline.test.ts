import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { directorioTemporal, FIRMA, gitConFecha, repoNuevo } from './apoyo';

const PIPELINE = resolve('scripts/pipeline.ts');
const PROGRESO = resolve('scripts/progreso.ts');
const UNA_LECTURA_MS = 15_000;
const INICIO = 1_700_000_000;
const PAQUETE = 'docs/pipeline/paquetes/una.md';
const SIN_ESPECIFICAR = '# una\n\n## Specs\n\n## Artefactos\n';
const SIN_GHERKIN = '# una\n\n## Specs\n\n- **S1** (§1): «regla»\n\n## Artefactos\n';
const ESPECIFICADO = `${SIN_GHERKIN}\n- \`features/una.feature\`\n`;

let home: string;
let principal: string;
let worktree: string;

/** Un commit del rol, `minutos` después del anterior. */
function historia(duraciones: [string, number][]): void {
	let momento = INICIO;
	for (const [rol, minutos] of duraciones) {
		momento += minutos * 60;
		gitConFecha(worktree, momento, 'commit', '-q', '--allow-empty', '-m', `algo\n\nBy ${rol}.\n\n${FIRMA}`);
	}
}

function correrPipeline(paquete: string): string {
	writeFileSync(join(principal, PAQUETE), paquete);
	const r = spawnSync(process.execPath, [PIPELINE], { encoding: 'utf8', env: { ...process.env, HOME: home } });
	expect(r.status).toBe(0);
	return r.stdout;
}

beforeEach(() => {
	home = directorioTemporal();
	principal = join(home, 'Work/tareas-hogar');
	worktree = join(home, 'Work/tareas-hogar-worktrees/pipeline');
	mkdirSync(join(principal, 'docs/pipeline/paquetes'), { recursive: true });
	mkdirSync(worktree, { recursive: true });
	repoNuevo(worktree, INICIO);
	writeFileSync(join(worktree, 'tmp/paquete-actual'), `${PAQUETE}\n`);
});

const CADENA: [string, number][] = [
	['core', 10],
	['acceptance', 20],
	['ui', 30],
	['cleaner', 5],
	['architect', 5],
	['hardener', 40],
	['qa', 50]
];

/** Sigue al rol con la línea SEGUIR, lo hace anotar con la línea Progreso de su prompt y devuelve lo que avisó el seguimiento. */
function avisoDelRol(salida: string, directorio: string): Promise<string> {
	const [rol, ...resto] = /SEGUIR: node scripts\/progreso\.ts (.+)/.exec(salida)![1].split(' ');
	const anotar = /Progreso: .*`(.+)`/.exec(salida)![1].replace('<paso>', 'probando el aviso');
	const seguimiento = join(directorio, `tmp/seguimiento-${rol}.json`);
	return new Promise((resolver) => {
		const proceso = spawn(process.execPath, [PROGRESO, rol, ...resto], { env: { ...process.env, HOME: home } });
		let avisos = '';
		const plazo = setTimeout(() => proceso.kill(), UNA_LECTURA_MS + 5000);
		const espera = setInterval(() => {
			if (!existsSync(seguimiento)) return;
			clearInterval(espera);
			spawnSync('bash', ['-c', anotar]);
		}, 20);
		proceso.stdout.on('data', (trozo) => {
			avisos += String(trozo);
			if (avisos.includes('probando el aviso')) proceso.kill();
		});
		proceso.on('close', () => {
			clearInterval(espera);
			clearTimeout(plazo);
			resolver(avisos);
		});
	});
}

describe('el circuito de avisos', () => {
	it('lo que un rol de implementación anota según su prompt lo avisa el seguimiento de su línea SEGUIR', async () => {
		historia(CADENA);
		const avisos = await avisoDelRol(correrPipeline(ESPECIFICADO), worktree);
		expect(avisos).toMatch(/^\d\d:\d\d core: probando el aviso$/m);
	}, UNA_LECTURA_MS + 10_000);
});

describe('la estimación de cada rol', () => {
	it('un rol de implementación suma él y los que le siguen', () => {
		historia(CADENA);
		const salida = correrPipeline(ESPECIFICADO);
		expect(salida).toContain('ESTIMADO: core unos 10 min (hasta 10). Lo que falta de la cadena: unos 160 min');
		expect(salida).toContain('SEGUIR: node scripts/progreso.ts core 10');
	});

	it('spec-writer suma también gherkin-writer y toda la implementación', () => {
		historia([['spec-writer', 3], ['gherkin-writer', 7], ...CADENA]);
		expect(correrPipeline(SIN_ESPECIFICAR)).toContain('ESTIMADO: spec-writer unos 3 min (hasta 3). Lo que falta de la cadena: unos 170 min');
	});

	it('gherkin-writer suma toda la implementación', () => {
		historia([['spec-writer', 3], ['gherkin-writer', 7], ...CADENA]);
		expect(correrPipeline(SIN_GHERKIN)).toContain('ESTIMADO: gherkin-writer unos 7 min (hasta 7). Lo que falta de la cadena: unos 167 min');
	});

	it('un rol sin historia no inventa un número', () => {
		historia([['qa', 50]]);
		const salida = correrPipeline(ESPECIFICADO);
		expect(salida).toContain('ESTIMADO: core sin historial. Lo que falta de la cadena: al menos 50 min');
		expect(salida).toMatch(/^SEGUIR: node scripts\/progreso\.ts core$/m);
		expect(salida).not.toContain('0 min (hasta');
	});

	it('sin historia de ningún rol tampoco da una hora de fin', () => {
		const salida = correrPipeline(ESPECIFICADO);
		expect(salida).toMatch(/^ESTIMADO: core sin historial\.$/m);
	});

	it('los mensajes de commit largos no rompen la estimación', () => {
		historia(CADENA);
		const mensaje = join(home, 'mensaje-largo');
		writeFileSync(mensaje, `largo\n\n${'x'.repeat(700_000)}\n`);
		gitConFecha(worktree, INICIO + 90_000, 'commit', '-q', '--allow-empty', '-F', mensaje);
		gitConFecha(worktree, INICIO + 90_060, 'commit', '-q', '--allow-empty', '-F', mensaje);
		expect(correrPipeline(ESPECIFICADO)).toContain('ESTIMADO: core unos 10 min');
	});
});

describe('el prompt del rol', () => {
	it('lleva la línea de progreso con ruta absoluta al directorio donde trabaja', () => {
		historia(CADENA);
		expect(correrPipeline(ESPECIFICADO)).toContain(`>> ${worktree}/tmp/progreso.log`);
		expect(correrPipeline(SIN_ESPECIFICAR)).toContain(`>> ${principal}/tmp/progreso.log`);
	});
});
