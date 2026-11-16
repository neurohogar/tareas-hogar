// Spec §7 (Limpiezas y reintentos): propiedades de las reglas de limpiezas.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { itemsToAttempt, retriesWith, attemptResult, type AppEvent } from './cleanups';

const ids = fc.uniqueArray(fc.constantFrom<string[]>('a1', 'a2', 'a3', 'a4', 'a5', 'a6'), { maxLength: 6 });
const failures = fc.array(fc.constantFrom<string[]>('a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'z9'), { maxLength: 8 });
const appEvents = fc.constantFrom<AppEvent>('vuelve la conexión', 'cambian los datos', 'pasa el tiempo');

describe('resultadoDelIntento (propiedades)', () => {
	it('limpios y pendientes particionan lo intentado, conservando el orden', () => {
		fc.assert(
			fc.property(ids, failures, (attempted, failed) => {
				const { cleaned, pendings } = attemptResult(attempted, failed);
				expect([...cleaned, ...pendings].sort()).toEqual([...attempted].sort());
				expect(cleaned.filter((id) => pendings.includes(id))).toEqual([]);
				expect(attempted.filter((id) => cleaned.includes(id))).toEqual(cleaned);
				expect(attempted.filter((id) => pendings.includes(id))).toEqual(pendings);
			})
		);
	});
	it('quedan por limpiar exactamente los intentados que fallaron', () => {
		fc.assert(
			fc.property(ids, failures, (attempted, failed) => {
				expect(attemptResult(attempted, failed).pendings).toEqual(attempted.filter((id) => failed.includes(id)));
			})
		);
	});
	it('sin conexión (fallan todos) no se limpia ninguno, y si nada falla se limpian todos', () => {
		fc.assert(
			fc.property(ids, (attempted) => {
				expect(attemptResult(attempted, attempted).cleaned).toEqual([]);
				expect(attemptResult(attempted, []).pendings).toEqual([]);
			})
		);
	});
});

describe('elementosAIntentar (propiedades)', () => {
	it('es lo detectado sin intento en curso, en el mismo orden', () => {
		fc.assert(
			fc.property(ids, ids, (toClean, inProgress) => {
				const a = itemsToAttempt(toClean, new Set<string>(inProgress));
				expect(a).toEqual(toClean.filter((id) => !inProgress.includes(id)));
			})
		);
	});
	it('nunca devuelve un elemento en curso y, sin nada en curso, devuelve todo', () => {
		fc.assert(
			fc.property(ids, ids, (toClean, inProgress) => {
				expect(itemsToAttempt(toClean, new Set<string>(inProgress)).some((id) => inProgress.includes(id))).toBe(false);
				expect(itemsToAttempt(toClean, new Set<string>())).toEqual(toClean);
			})
		);
	});
	it('es idempotente: lo que ya se mandó a intentar no se manda de nuevo', () => {
		fc.assert(
			fc.property(ids, ids, (toClean, inProgress) => {
				const firstOne = itemsToAttempt(toClean, new Set<string>(inProgress));
				expect(itemsToAttempt(toClean, new Set<string>([...inProgress, ...firstOne]))).toEqual([]);
			})
		);
	});
});

describe('reintentaCon (propiedades)', () => {
	it('reintenta con todo suceso salvo el paso del tiempo', () => {
		fc.assert(
			fc.property(appEvents, (occurrenceEvent) => {
				expect(retriesWith(occurrenceEvent)).toBe(occurrenceEvent !== 'pasa el tiempo');
			})
		);
	});
});
