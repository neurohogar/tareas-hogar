import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
	MINIMO_DE_LA_PANTALLA_EN_SEGUNDOS,
	TOPE_DE_LA_PANTALLA_EN_SEGUNDOS,
	pantallaDeCargaSeVa,
	proximoLimiteDeLaPantalla,
	recuerdoAlArrancar,
	recuerdoDeTopeDeNoto,
	resumenDeFuentes,
	type EstadoDeFuente,
	type EstadoDeLaEspera
} from './pantalla-de-carga';

const fuente = fc.constantFrom<EstadoDeFuente>('lista', 'guardada', 'sin-guardar', 'fallida');
const espera = fc.record<EstadoDeLaEspera>({
	segundosDesdeElArranque: fc.double({ min: 0, max: 30, noNaN: true }),
	auth: fc.constantFrom('esperando', 'con-sesion', 'sin-sesion'),
	tareasRespondieron: fc.boolean(),
	completadosRespondieron: fc.boolean(),
	etiquetasRespondieron: fc.boolean(),
	atkinson: fuente,
	noto: fuente,
	enLinea: fc.boolean(),
	recuerdaTopeDeNoto: fc.boolean()
});

describe('pantallaDeCargaSeVa', () => {
	it('nunca se va sin Auth ni antes del mínimo', () => {
		fc.assert(
			fc.property(espera, (e) => {
				if (e.auth === 'esperando' || e.segundosDesdeElArranque < MINIMO_DE_LA_PANTALLA_EN_SEGUNDOS) {
					expect(pantallaDeCargaSeVa(e)).toBe(false);
				}
			})
		);
	});

	it('con Auth respondido, se va siempre al llegar al tope', () => {
		fc.assert(
			fc.property(espera, fc.double({ min: TOPE_DE_LA_PANTALLA_EN_SEGUNDOS, max: 1000, noNaN: true }), (e, t) => {
				if (e.auth !== 'esperando') expect(pantallaDeCargaSeVa({ ...e, segundosDesdeElArranque: t })).toBe(true);
			})
		);
	});

	it('es monótona en el tiempo: si se fue, sigue yéndose más tarde', () => {
		fc.assert(
			fc.property(espera, fc.double({ min: 0, max: 30, noNaN: true }), (e, extra) => {
				if (pantallaDeCargaSeVa(e)) {
					expect(pantallaDeCargaSeVa({ ...e, segundosDesdeElArranque: e.segundosDesdeElArranque + extra })).toBe(true);
				}
			})
		);
	});
});

describe('recuerdo de Noto', () => {
	it('con Noto listo no se recuerda nada', () => {
		fc.assert(
			fc.property(espera, (e) => {
				expect(recuerdoDeTopeDeNoto({ ...e, noto: 'lista' })).toBe(false);
			})
		);
	});

	it('una versión que cambia el juego borra lo recordado; sin cambio se conserva', () => {
		fc.assert(
			fc.property(fc.boolean(), (recordaba) => {
				expect(recuerdoAlArrancar(recordaba, true)).toBe(false);
				expect(recuerdoAlArrancar(recordaba, false)).toBe(recordaba);
			})
		);
	});
});

describe('proximoLimiteDeLaPantalla', () => {
	it('es el primer límite todavía por venir', () => {
		fc.assert(
			fc.property(fc.double({ min: 0, max: 30, noNaN: true }), (s) => {
				const limite = proximoLimiteDeLaPantalla(s);
				if (limite === undefined) expect(s).toBeGreaterThanOrEqual(TOPE_DE_LA_PANTALLA_EN_SEGUNDOS);
				else {
					expect(limite).toBeGreaterThan(s);
					expect([MINIMO_DE_LA_PANTALLA_EN_SEGUNDOS, TOPE_DE_LA_PANTALLA_EN_SEGUNDOS]).toContain(limite);
				}
			})
		);
	});
});

describe('resumenDeFuentes', () => {
	it('no depende del orden y el peor estado manda', () => {
		fc.assert(
			fc.property(fc.array(fc.constantFrom<EstadoDeFuente>('guardada', 'sin-guardar', 'fallida'), { minLength: 1 }), (estados) => {
				const resumen = resumenDeFuentes(estados);
				expect(resumenDeFuentes([...estados].reverse())).toBe(resumen);
				if (estados.includes('fallida')) expect(resumen).toBe('fallida');
				else if (estados.includes('sin-guardar')) expect(resumen).toBe('sin-guardar');
				else expect(resumen).toBe('guardada');
			})
		);
	});
});
