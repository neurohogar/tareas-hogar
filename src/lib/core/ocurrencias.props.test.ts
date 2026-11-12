import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { diaDelMes, inicioDelDia, sumarDias, ultimoDiaDelMes } from './dias';
import { esOcurrencia, primeraOcurrenciaPosterior, ultimaOcurrenciaEntre } from './ocurrencias';
import { DIAS_DE_LA_SEMANA, type RecurrenciaCalendario } from './tarea';

const dia = fc.integer({ min: 0, max: 47_000 }).map((n) => new Date(1970, 0, 1 + n));
const momento = fc
	.tuple(dia, fc.integer({ min: 0, max: 23 }), fc.integer({ min: 0, max: 59 }))
	.map(([d, hora, minuto]) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), hora, minuto));
const diasSemana = fc.subarray([...DIAS_DE_LA_SEMANA], { minLength: 1 });
const diasMes = fc
	.uniqueArray(fc.integer({ min: 1, max: 31 }), { minLength: 1, maxLength: 6 })
	.map((dias) => dias.sort((a, b) => a - b));
const recurrencia: fc.Arbitrary<RecurrenciaCalendario> = fc.oneof(
	diasSemana.map((d) => ({ modo: 'calendario' as const, diasSemana: d })),
	diasMes.map((d) => ({ modo: 'calendario' as const, diasMes: d }))
);

/** Los inicios de día en (desde, hasta]. */
function diasEntre(desde: Date, hasta: Date): Date[] {
	const dias: Date[] = [];
	for (let d = sumarDias(desde, 1); d <= hasta; d = sumarDias(d, 1)) dias.push(d);
	return dias;
}

describe('ocurrencias (propiedades)', () => {
	it('la primera ocurrencia posterior es un inicio de día, ocurre, y no hay otra antes (a lo sumo 31 días)', () => {
		fc.assert(
			fc.property(recurrencia, momento, (r, m) => {
				const n = primeraOcurrenciaPosterior(r, m);
				const desde = inicioDelDia(m);
				expect(inicioDelDia(n)).toEqual(n);
				expect(n > desde).toBe(true);
				expect(n <= sumarDias(desde, 31)).toBe(true);
				expect(esOcurrencia(r, n)).toBe(true);
				expect(diasEntre(desde, sumarDias(n, -1)).some((d) => esOcurrencia(r, d))).toBe(false);
			})
		);
	});

	it('la última ocurrencia entre (desde, hasta] es la más reciente, o no hay ninguna', () => {
		fc.assert(
			fc.property(recurrencia, dia, fc.integer({ min: -3, max: 70 }), fc.integer({ min: 0, max: 23 }), (r, desde, n, hora) => {
				const hasta = new Date(sumarDias(desde, n).getTime() + hora * 3_600_000);
				const ocurrencias = diasEntre(desde, inicioDelDia(hasta)).filter((d) => esOcurrencia(r, d));
				expect(ultimaOcurrenciaEntre(r, desde, hasta)).toEqual(ocurrencias.at(-1));
			})
		);
	});

	it('en cada mes, cada día elegido ocurre exactamente una vez; uno que no existe cae en el último día', () => {
		fc.assert(
			fc.property(dia, fc.integer({ min: 1, max: 31 }), (d, elegido) => {
				const ultimo = ultimoDiaDelMes(d);
				const delMes = diasEntre(sumarDias(d, -diaDelMes(d)), sumarDias(d, ultimo - diaDelMes(d)));
				const ocurrencias = delMes.filter((x) => esOcurrencia({ modo: 'calendario', diasMes: [elegido] }, x));
				expect(ocurrencias.map(diaDelMes)).toEqual([Math.min(elegido, ultimo)]);
			})
		);
	});

	it('en cualquier semana corrida hay tantas ocurrencias como días de la semana elegidos', () => {
		fc.assert(
			fc.property(diasSemana, dia, (elegidos, d) => {
				const semana = diasEntre(sumarDias(d, -1), sumarDias(d, 6));
				const r: RecurrenciaCalendario = { modo: 'calendario', diasSemana: elegidos };
				expect(semana.filter((x) => esOcurrencia(r, x))).toHaveLength(elegidos.length);
			})
		);
	});

	it('el orden y las repeticiones de los días no cambian qué días ocurren', () => {
		const conOtroOrden = recurrencia.chain((r) => {
			const dias: readonly (string | number)[] = 'diasSemana' in r ? r.diasSemana : r.diasMes;
			const repetidos = [...dias, ...dias];
			return fc
				.shuffledSubarray(repetidos, { minLength: repetidos.length })
				.map((otros) => [r, { ...r, ['diasSemana' in r ? 'diasSemana' : 'diasMes']: otros } as RecurrenciaCalendario] as const);
		});
		fc.assert(
			fc.property(conOtroOrden, dia, ([r, otra], d) => {
				expect(esOcurrencia(otra, d)).toBe(esOcurrencia(r, d));
			})
		);
	});
});
