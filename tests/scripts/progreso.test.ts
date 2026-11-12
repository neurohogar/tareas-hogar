import { spawn, spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { directorioTemporal } from './apoyo';

const PROGRESO = resolve('scripts/progreso.ts');
const MINUTO_MS = 60_000;

let home: string;
let tmp: string;
let log: string;

/** Corre el seguimiento hasta que su salida cumple `listo` (o pasa el plazo), y lo termina como lo termina un Monitor. */
function seguir(args: string[], listo: (salida: string) => boolean): Promise<string> {
	return new Promise((resolver) => {
		const proceso = spawn(process.execPath, [PROGRESO, ...args], { env: { ...process.env, HOME: home } });
		let salida = '';
		const terminar = () => proceso.kill();
		const plazo = setTimeout(terminar, 4000);
		proceso.stdout.on('data', (trozo) => {
			salida += String(trozo);
			if (listo(salida)) terminar();
		});
		proceso.on('close', () => {
			clearTimeout(plazo);
			resolver(salida);
		});
	});
}

/** Arranca un seguimiento nuevo, hasta que dejó anotado desde dónde sigue. */
function arrancar(): Promise<void> {
	const estado = join(tmp, 'seguimiento-qa.json');
	rmSync(estado, { force: true });
	return new Promise((resolver) => {
		const proceso = spawn(process.execPath, [PROGRESO, 'qa', '27'], { env: { ...process.env, HOME: home } });
		const espera = setInterval(() => {
			if (!existsSync(estado)) return;
			clearInterval(espera);
			proceso.kill();
		}, 20);
		proceso.on('close', () => resolver());
	});
}

const anotado = () => JSON.parse(readFileSync(join(tmp, 'seguimiento-qa.json'), 'utf8'));

beforeEach(() => {
	home = directorioTemporal();
	tmp = join(home, 'Work/tareas-hogar-worktrees/pipeline/tmp');
	mkdirSync(tmp, { recursive: true });
	log = join(tmp, 'progreso.log');
	writeFileSync(log, '10:00 qa: viejo\n');
});

describe('rearmar el seguimiento con --continuar', () => {
	it('muestra lo que se anotó mientras no había seguimiento, y no lo anterior', async () => {
		await arrancar();
		appendFileSync(log, '10:30 qa: en el medio\n');
		const salida = await seguir(['qa', '27', '--continuar'], (s) => s.includes('en el medio'));
		expect(salida).toContain('10:30 qa: en el medio');
		expect(salida).not.toContain('viejo');
	});

	it('conserva cuánto lleva el rol y cuándo hubo la última novedad', async () => {
		await arrancar();
		const estado = anotado();
		const ahora = Date.now();
		writeFileSync(join(tmp, 'seguimiento-qa.json'), JSON.stringify({ ...estado, inicio: ahora - 50 * MINUTO_MS, ultimaNovedad: ahora - 20 * MINUTO_MS }));
		const salida = await seguir(['qa', '27', '--continuar'], (s) => s.includes('lleva'));
		expect(salida).toContain('qa: lleva 50 min (estimado 27); última novedad hace 20 min');
	});

	it('si el log se truncó lo lee desde el principio, sin fragmentos', async () => {
		appendFileSync(log, `10:01 qa: ${'relleno '.repeat(20)}\n`);
		await arrancar();
		writeFileSync(log, '11:00 qa: log nuevo\n');
		const salida = await seguir(['qa', '27', '--continuar'], (s) => s.includes('log nuevo'));
		expect(salida).toContain('11:00 qa: log nuevo\n');
		expect(salida.split('\n')[0]).toBe('11:00 qa: log nuevo');
	});

	it('con lo anotado dañado arranca de cero en vez de cortarse', async () => {
		await arrancar();
		writeFileSync(join(tmp, 'seguimiento-qa.json'), '{"inicio":17');
		const salida = await seguir(['qa', '27', '--continuar'], (s) => s.includes('lleva'));
		expect(salida).toContain('qa: lleva 0 min (estimado 27)');
	});

	it('sin un seguimiento anterior arranca de cero', async () => {
		const salida = await seguir(['qa', '27', '--continuar'], (s) => s.includes('lleva'));
		expect(salida).toContain('qa: lleva 0 min (estimado 27); última novedad hace 0 min');
		expect(salida).not.toContain('viejo');
	});
});

describe('un seguimiento nuevo', () => {
	it('no hereda el tiempo del rol anterior', async () => {
		await arrancar();
		writeFileSync(join(tmp, 'seguimiento-qa.json'), JSON.stringify({ ...anotado(), inicio: Date.now() - 50 * MINUTO_MS }));
		await arrancar();
		const salida = await seguir(['qa', '27', '--continuar'], (s) => s.includes('lleva'));
		expect(salida).toContain('qa: lleva 0 min');
	});

	it('borra el temporal de un seguimiento muerto y respeta el de uno vivo', async () => {
		const muerto = join(tmp, `seguimiento-qa.json.${spawnSync('true').pid}`);
		const vivo = join(tmp, `seguimiento-qa.json.${process.pid}`);
		const deOtroRol = join(tmp, `seguimiento-hardener.json.${spawnSync('true').pid}`);
		for (const temporal of [muerto, vivo, deOtroRol]) writeFileSync(temporal, '{}');
		await arrancar();
		expect(existsSync(muerto)).toBe(false);
		expect(existsSync(vivo)).toBe(true);
		expect(existsSync(deOtroRol)).toBe(true);
	});

	it('funciona sin que el log exista todavía', async () => {
		rmSync(log);
		await arrancar();
		const salida = await seguir(['qa', '--continuar'], (s) => s.includes('lleva'));
		expect(salida).toContain('qa: lleva 0 min; última novedad hace 0 min');
	});
});
