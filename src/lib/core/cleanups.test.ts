import { describe, expect, it } from 'vitest';
import { itemsToAttempt, retriesWith, attemptResult } from './cleanups';

describe('resultadoDelIntento', () => {
	it('limpia los que no fallan y deja por limpiar solo los que fallaron', () => {
		expect(attemptResult(['a1', 'a2', 'a3'], ['a2'])).toEqual({ cleaned: ['a1', 'a3'], pendings: ['a2'] });
	});
	it('sin conexión (fallan todos) no queda nada limpio', () => {
		expect(attemptResult(['a1', 'a2'], ['a1', 'a2'])).toEqual({ cleaned: [], pendings: ['a1', 'a2'] });
	});
	it('si nada falla, todo queda limpio', () => {
		expect(attemptResult(['a1', 'a2'], [])).toEqual({ cleaned: ['a1', 'a2'], pendings: [] });
	});
	it('ignora fallas de ids que no se intentaron', () => {
		expect(attemptResult(['a1'], ['z9'])).toEqual({ cleaned: ['a1'], pendings: [] });
	});
});

describe('elementosAIntentar', () => {
	it('intenta lo detectado que no tiene un intento en curso', () => {
		expect(itemsToAttempt(['a1', 'a2', 'a3'], new Set(['a2']))).toEqual(['a1', 'a3']);
	});
	it('un elemento cuyo intento terminó (falló) se vuelve a intentar', () => {
		expect(itemsToAttempt(['a1', 'a2'], new Set())).toEqual(['a1', 'a2']);
	});
});

describe('reintentaCon', () => {
	it('reintenta al volver la conexión', () => {
		expect(retriesWith('vuelve la conexión')).toBe(true);
	});
	it('reintenta cuando cambian los datos', () => {
		expect(retriesWith('cambian los datos')).toBe(true);
	});
	it('no reintenta por el paso del tiempo', () => {
		expect(retriesWith('pasa el tiempo')).toBe(false);
	});
});
