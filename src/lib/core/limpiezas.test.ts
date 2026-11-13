import { describe, expect, it } from 'vitest';
import { elementosAIntentar, reintentaCon, resultadoDelIntento } from './limpiezas';

describe('resultadoDelIntento', () => {
	it('limpia los que no fallan y deja por limpiar solo los que fallaron', () => {
		expect(resultadoDelIntento(['a1', 'a2', 'a3'], ['a2'])).toEqual({ limpios: ['a1', 'a3'], pendientes: ['a2'] });
	});
	it('sin conexión (fallan todos) no queda nada limpio', () => {
		expect(resultadoDelIntento(['a1', 'a2'], ['a1', 'a2'])).toEqual({ limpios: [], pendientes: ['a1', 'a2'] });
	});
	it('si nada falla, todo queda limpio', () => {
		expect(resultadoDelIntento(['a1', 'a2'], [])).toEqual({ limpios: ['a1', 'a2'], pendientes: [] });
	});
	it('ignora fallas de ids que no se intentaron', () => {
		expect(resultadoDelIntento(['a1'], ['z9'])).toEqual({ limpios: ['a1'], pendientes: [] });
	});
});

describe('elementosAIntentar', () => {
	it('intenta lo detectado que no tiene un intento en curso', () => {
		expect(elementosAIntentar(['a1', 'a2', 'a3'], new Set(['a2']))).toEqual(['a1', 'a3']);
	});
	it('un elemento cuyo intento terminó (falló) se vuelve a intentar', () => {
		expect(elementosAIntentar(['a1', 'a2'], new Set())).toEqual(['a1', 'a2']);
	});
});

describe('reintentaCon', () => {
	it('reintenta al volver la conexión', () => {
		expect(reintentaCon('vuelve la conexión')).toBe(true);
	});
	it('reintenta cuando cambian los datos', () => {
		expect(reintentaCon('cambian los datos')).toBe(true);
	});
	it('no reintenta por el paso del tiempo', () => {
		expect(reintentaCon('pasa el tiempo')).toBe(false);
	});
});
