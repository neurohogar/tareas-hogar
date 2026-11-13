// Spec §7 (Limpiezas y reintentos): propiedades de las reglas de limpiezas.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { elementosAIntentar, reintentaCon, resultadoDelIntento, type Suceso } from './limpiezas';

const ids = fc.uniqueArray(fc.constantFrom<string[]>('a1', 'a2', 'a3', 'a4', 'a5', 'a6'), { maxLength: 6 });
const fallos = fc.array(fc.constantFrom<string[]>('a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'z9'), { maxLength: 8 });
const sucesos = fc.constantFrom<Suceso>('vuelve la conexión', 'cambian los datos', 'pasa el tiempo');

describe('resultadoDelIntento (propiedades)', () => {
	it('limpios y pendientes particionan lo intentado, conservando el orden', () => {
		fc.assert(
			fc.property(ids, fallos, (intentados, fallaron) => {
				const { limpios, pendientes } = resultadoDelIntento(intentados, fallaron);
				expect([...limpios, ...pendientes].sort()).toEqual([...intentados].sort());
				expect(limpios.filter((id) => pendientes.includes(id))).toEqual([]);
				expect(intentados.filter((id) => limpios.includes(id))).toEqual(limpios);
				expect(intentados.filter((id) => pendientes.includes(id))).toEqual(pendientes);
			})
		);
	});
	it('quedan por limpiar exactamente los intentados que fallaron', () => {
		fc.assert(
			fc.property(ids, fallos, (intentados, fallaron) => {
				expect(resultadoDelIntento(intentados, fallaron).pendientes).toEqual(intentados.filter((id) => fallaron.includes(id)));
			})
		);
	});
	it('sin conexión (fallan todos) no se limpia ninguno, y si nada falla se limpian todos', () => {
		fc.assert(
			fc.property(ids, (intentados) => {
				expect(resultadoDelIntento(intentados, intentados).limpios).toEqual([]);
				expect(resultadoDelIntento(intentados, []).pendientes).toEqual([]);
			})
		);
	});
});

describe('elementosAIntentar (propiedades)', () => {
	it('es lo detectado sin intento en curso, en el mismo orden', () => {
		fc.assert(
			fc.property(ids, ids, (porLimpiar, enCurso) => {
				const a = elementosAIntentar(porLimpiar, new Set<string>(enCurso));
				expect(a).toEqual(porLimpiar.filter((id) => !enCurso.includes(id)));
			})
		);
	});
	it('nunca devuelve un elemento en curso y, sin nada en curso, devuelve todo', () => {
		fc.assert(
			fc.property(ids, ids, (porLimpiar, enCurso) => {
				expect(elementosAIntentar(porLimpiar, new Set<string>(enCurso)).some((id) => enCurso.includes(id))).toBe(false);
				expect(elementosAIntentar(porLimpiar, new Set<string>())).toEqual(porLimpiar);
			})
		);
	});
	it('es idempotente: lo que ya se mandó a intentar no se manda de nuevo', () => {
		fc.assert(
			fc.property(ids, ids, (porLimpiar, enCurso) => {
				const primero = elementosAIntentar(porLimpiar, new Set<string>(enCurso));
				expect(elementosAIntentar(porLimpiar, new Set<string>([...enCurso, ...primero]))).toEqual([]);
			})
		);
	});
});

describe('reintentaCon (propiedades)', () => {
	it('reintenta con todo suceso salvo el paso del tiempo', () => {
		fc.assert(
			fc.property(sucesos, (suceso) => {
				expect(reintentaCon(suceso)).toBe(suceso !== 'pasa el tiempo');
			})
		);
	});
});
