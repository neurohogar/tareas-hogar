import { describe, expect, it } from 'vitest';
import {
	SCREEN_MINIMUM_IN_SECONDS,
	SCREEN_LIMIT_IN_SECONDS,
	loadingScreenLeaves,
	rememberedOnStart,
	notoLimitMemory,
	nextScreenLimit,
	fontsSummary,
	type WaitStatus
} from './loading-screen';

/** Con sesión, en línea y con todo listo, a los 2 s: se va; cada test cambia lo que prueba. */
function wait(changes: Partial<WaitStatus> = {}): WaitStatus {
	return {
		secondsSinceStart: 2,
		auth: 'con-sesion',
		tasksResponded: true,
		completionsResponded: true,
		atkinson: 'lista',
		noto: 'lista',
		online: true,
		remembersNotoLimit: false,
		...changes
	};
}

describe('límites de la pantalla', () => {
	it('el mínimo es de 0,5 s y el tope de 10 s', () => {
		expect(SCREEN_MINIMUM_IN_SECONDS).toBe(0.5);
		expect(SCREEN_LIMIT_IN_SECONDS).toBe(10);
	});
});

describe('pantallaDeCargaSeVa: con sesión', () => {
	it('se va cuando todo lo que espera está listo', () => {
		expect(loadingScreenLeaves(wait())).toBe(true);
	});

	it.each([
		['las tareas', { tasksResponded: false }],
		['los completados', { completionsResponded: false }],
		['Atkinson', { atkinson: 'sin-guardar' }],
		['Noto', { noto: 'sin-guardar' }]
	] as const)('espera a %s', (_name, changes) => {
		expect(loadingScreenLeaves(wait(changes))).toBe(false);
	});
});

describe('pantallaDeCargaSeVa: mínimo de 0,5 s', () => {
	it('con todo listo no se va antes del mínimo', () => {
		expect(loadingScreenLeaves(wait({ secondsSinceStart: 0.4 }))).toBe(false);
	});

	it('se va justo al llegar al mínimo', () => {
		expect(loadingScreenLeaves(wait({ secondsSinceStart: 0.5 }))).toBe(true);
	});

	it('vale también sin sesión, sin conexión y con las fuentes falladas', () => {
		const status = wait({
			secondsSinceStart: 0.4,
			auth: 'sin-sesion',
			online: false,
			atkinson: 'fallida',
			noto: 'fallida'
		});
		expect(loadingScreenLeaves(status)).toBe(false);
	});
});

describe('pantallaDeCargaSeVa: tope de 10 s', () => {
	const nothingReady = {
		tasksResponded: false,
		completionsResponded: false,
		atkinson: 'sin-guardar',
		noto: 'sin-guardar'
	} as const;

	it('antes del tope sigue esperando', () => {
		expect(loadingScreenLeaves(wait({ ...nothingReady, secondsSinceStart: 9.9 }))).toBe(false);
	});

	it('al llegar al tope entra con lo que haya', () => {
		expect(loadingScreenLeaves(wait({ ...nothingReady, secondsSinceStart: 10 }))).toBe(true);
	});

	it('la espera de Auth no entra en el tope', () => {
		expect(loadingScreenLeaves(wait({ auth: 'esperando', secondsSinceStart: 60 }))).toBe(
			false
		);
	});

	it('si Auth responde pasado el tope, se va en ese momento aunque falte lo demás', () => {
		expect(loadingScreenLeaves(wait({ ...nothingReady, secondsSinceStart: 12 }))).toBe(true);
	});
});

describe('pantallaDeCargaSeVa: sin sesión', () => {
	const withoutSession = {
		auth: 'sin-sesion',
		tasksResponded: false,
		completionsResponded: false
	} as const;

	it('no espera datos ni a Noto', () => {
		expect(loadingScreenLeaves(wait({ ...withoutSession, noto: 'sin-guardar' }))).toBe(true);
	});

	it('espera a Atkinson', () => {
		expect(loadingScreenLeaves(wait({ ...withoutSession, atkinson: 'sin-guardar' }))).toBe(false);
	});
});

describe('pantallaDeCargaSeVa: no espera lo que no va a llegar', () => {
	it.each([
		['Atkinson', { atkinson: 'fallida' }],
		['Noto', { noto: 'fallida' }]
	] as const)('%s fallida se deja de esperar con conexión', (_name, changes) => {
		expect(loadingScreenLeaves(wait(changes))).toBe(true);
	});

	it('una fuente fallida no libera lo demás pendiente', () => {
		expect(loadingScreenLeaves(wait({ noto: 'fallida', atkinson: 'sin-guardar' }))).toBe(false);
		expect(loadingScreenLeaves(wait({ noto: 'fallida', tasksResponded: false }))).toBe(false);
	});

	it.each([
		['Atkinson', { atkinson: 'sin-guardar' }],
		['Noto', { noto: 'sin-guardar' }]
	] as const)('sin conexión no espera a %s sin guardar', (_name, changes) => {
		expect(loadingScreenLeaves(wait({ ...changes, online: false }))).toBe(true);
	});

	it.each([
		['Atkinson', { atkinson: 'guardada' }],
		['Noto', { noto: 'guardada' }]
	] as const)('sin conexión sigue esperando a %s guardada', (_name, changes) => {
		const status = wait({ ...changes, online: false });
		expect(loadingScreenLeaves(status)).toBe(false);
	});

	it('sin conexión sigue esperando el caché local de los datos', () => {
		expect(loadingScreenLeaves(wait({ online: false, completionsResponded: false }))).toBe(
			false
		);
	});
});

describe('pantallaDeCargaSeVa: después de un tope con Noto sin bajar', () => {
	it('con sesión no espera a Noto', () => {
		expect(loadingScreenLeaves(wait({ remembersNotoLimit: true, noto: 'sin-guardar' }))).toBe(
			true
		);
	});

	it('lo demás se sigue esperando', () => {
		const status = wait({ remembersNotoLimit: true, noto: 'sin-guardar', atkinson: 'guardada' });
		expect(loadingScreenLeaves(status)).toBe(false);
	});
});

describe('recuerdoDeTopeDeNoto', () => {
	const atLimit = { secondsSinceStart: 10, noto: 'sin-guardar' } as const;

	it('un tope con Noto sin bajar en una apertura que lo esperaba se recuerda', () => {
		expect(notoLimitMemory(wait(atLimit))).toBe(true);
	});

	it('también cuando Noto se estaba leyendo del dispositivo', () => {
		expect(notoLimitMemory(wait({ ...atLimit, noto: 'guardada' }))).toBe(true);
	});

	it('si la pantalla se fue antes del tope no hay nada que recordar', () => {
		expect(notoLimitMemory(wait({ ...atLimit, secondsSinceStart: 9.9 }))).toBe(false);
	});

	it('un Auth tardío también cuenta como tope alcanzado', () => {
		expect(notoLimitMemory(wait({ ...atLimit, secondsSinceStart: 12 }))).toBe(true);
	});

	it('sin sesión no cuenta: no lo esperaba', () => {
		expect(notoLimitMemory(wait({ ...atLimit, auth: 'sin-sesion' }))).toBe(false);
	});

	it('Noto fallido antes del tope no cuenta: ya no se esperaba', () => {
		expect(notoLimitMemory(wait({ ...atLimit, noto: 'fallida' }))).toBe(false);
	});

	it('Noto sin guardar y sin conexión no cuenta: ya no se esperaba', () => {
		expect(notoLimitMemory(wait({ ...atLimit, online: false }))).toBe(false);
	});

	it('Noto guardado y sin conexión cuenta: se seguía esperando', () => {
		expect(notoLimitMemory(wait({ ...atLimit, online: false, noto: 'guardada' }))).toBe(true);
	});

	it('con Noto listo al llegar el tope no se recuerda', () => {
		expect(notoLimitMemory(wait({ secondsSinceStart: 10 }))).toBe(false);
	});

	it.each([
		['sin sesión', { auth: 'sin-sesion' }],
		['con Noto fallido', { noto: 'fallida' }],
		['sin conexión', { online: false }],
		['antes del tope', { secondsSinceStart: 1 }]
	] as const)('lo ya recordado se conserva %s', (_name, changes) => {
		const status = wait({ noto: 'sin-guardar', remembersNotoLimit: true, ...changes });
		expect(notoLimitMemory(status)).toBe(true);
	});

	it('se olvida cuando Noto queda guardado', () => {
		expect(notoLimitMemory(wait({ remembersNotoLimit: true, noto: 'lista' }))).toBe(false);
	});

	it('se olvida aunque la apertura no tenga sesión', () => {
		const status = wait({ remembersNotoLimit: true, noto: 'lista', auth: 'sin-sesion' });
		expect(notoLimitMemory(status)).toBe(false);
	});
});

describe('recuerdoAlArrancar', () => {
	it('sin versión que cambie el juego, lo recordado sigue', () => {
		expect(rememberedOnStart(true, false)).toBe(true);
	});

	it('una versión que cambia el juego vuelve a esperarlo una vez', () => {
		expect(rememberedOnStart(true, true)).toBe(false);
	});

	it('sin nada recordado, no aparece nada que recordar', () => {
		expect(rememberedOnStart(false, false)).toBe(false);
		expect(rememberedOnStart(false, true)).toBe(false);
	});
});

describe('próximo límite', () => {
	it('es el mínimo, luego el tope, y después no hay', () => {
		expect(nextScreenLimit(0)).toBe(0.5);
		expect(nextScreenLimit(0.5)).toBe(10);
		expect(nextScreenLimit(10)).toBeUndefined();
	});
});

describe('resumen de fuentes', () => {
	it('manda la peor: fallida, luego sin guardar, luego guardada', () => {
		expect(fontsSummary(['guardada', 'sin-guardar', 'fallida'])).toBe('fallida');
		expect(fontsSummary(['guardada', 'sin-guardar'])).toBe('sin-guardar');
		expect(fontsSummary(['guardada'])).toBe('guardada');
	});
});
