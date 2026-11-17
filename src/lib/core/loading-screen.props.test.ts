import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
	SCREEN_MINIMUM_IN_SECONDS,
	SCREEN_LIMIT_IN_SECONDS,
	loadingScreenLeaves,
	nextScreenLimit,
	rememberedOnStart,
	notoLimitMemory,
	fontsSummary,
	type FontStatus,
	type WaitStatus
} from './loading-screen';

const font = fc.constantFrom<FontStatus>('lista', 'guardada', 'sin-guardar', 'fallida');
const wait = fc.record<WaitStatus>({
	secondsSinceStart: fc.double({ min: 0, max: 30, noNaN: true }),
	auth: fc.constantFrom('esperando', 'con-sesion', 'sin-sesion'),
	tasksResponded: fc.boolean(),
	completionsResponded: fc.boolean(),
	atkinson: font,
	noto: font,
	online: fc.boolean(),
	remembersNotoLimit: fc.boolean()
});

describe('pantallaDeCargaSeVa', () => {
	it('nunca se va sin Auth ni antes del mínimo', () => {
		fc.assert(
			fc.property(wait, (e) => {
				if (e.auth === 'esperando' || e.secondsSinceStart < SCREEN_MINIMUM_IN_SECONDS) {
					expect(loadingScreenLeaves(e)).toBe(false);
				}
			})
		);
	});

	it('con Auth respondido, se va siempre al llegar al tope', () => {
		fc.assert(
			fc.property(wait, fc.double({ min: SCREEN_LIMIT_IN_SECONDS, max: 1000, noNaN: true }), (e, t) => {
				if (e.auth !== 'esperando') expect(loadingScreenLeaves({ ...e, secondsSinceStart: t })).toBe(true);
			})
		);
	});

	it('es monótona en el tiempo: si se fue, sigue yéndose más tarde', () => {
		fc.assert(
			fc.property(wait, fc.double({ min: 0, max: 30, noNaN: true }), (e, extra) => {
				if (loadingScreenLeaves(e)) {
					expect(loadingScreenLeaves({ ...e, secondsSinceStart: e.secondsSinceStart + extra })).toBe(true);
				}
			})
		);
	});
});

describe('recuerdo de Noto', () => {
	it('con Noto listo no se recuerda nada', () => {
		fc.assert(
			fc.property(wait, (e) => {
				expect(notoLimitMemory({ ...e, noto: 'lista' })).toBe(false);
			})
		);
	});

	it('una versión que cambia el juego borra lo recordado; sin cambio se conserva', () => {
		fc.assert(
			fc.property(fc.boolean(), (remembered) => {
				expect(rememberedOnStart(remembered, true)).toBe(false);
				expect(rememberedOnStart(remembered, false)).toBe(remembered);
			})
		);
	});
});

describe('proximoLimiteDeLaPantalla', () => {
	it('es el primer límite todavía por venir', () => {
		fc.assert(
			fc.property(fc.double({ min: 0, max: 30, noNaN: true }), (s) => {
				const limit = nextScreenLimit(s);
				if (limit === undefined) expect(s).toBeGreaterThanOrEqual(SCREEN_LIMIT_IN_SECONDS);
				else {
					expect(limit).toBeGreaterThan(s);
					expect([SCREEN_MINIMUM_IN_SECONDS, SCREEN_LIMIT_IN_SECONDS]).toContain(limit);
				}
			})
		);
	});
});

describe('resumenDeFuentes', () => {
	it('no depende del orden y el peor estado manda', () => {
		fc.assert(
			fc.property(fc.array(fc.constantFrom<FontStatus>('guardada', 'sin-guardar', 'fallida'), { minLength: 1 }), (statuses) => {
				const summary = fontsSummary(statuses);
				expect(fontsSummary([...statuses].reverse())).toBe(summary);
				if (statuses.includes('fallida')) expect(summary).toBe('fallida');
				else if (statuses.includes('sin-guardar')) expect(summary).toBe('sin-guardar');
				else expect(summary).toBe('guardada');
			})
		);
	});
});
