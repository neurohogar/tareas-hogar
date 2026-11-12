import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { diaDeLaSemana, diaDelMes, diaDesdeIso, diaIso, diasEntre, inicioDelDia, leerDiaIso, sumarDias, ultimoDiaDelMes } from './dias';
import { DIAS_DE_LA_SEMANA } from './tarea';

/** Un día local entre 1970 y ~2100; Date normaliza los días que desbordan el mes. */
const dia = fc.integer({ min: 0, max: 47_000 }).map((n) => new Date(1970, 0, 1 + n));
/** Un momento cualquiera de ese día (o del siguiente, si un cambio de hora lo empuja). */
const momento = fc
	.tuple(dia, fc.integer({ min: 0, max: 23 }), fc.integer({ min: 0, max: 59 }))
	.map(([d, hora, minuto]) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), hora, minuto));
const cantidad = fc.integer({ min: -1_000, max: 1_000 });

describe('días locales (propiedades)', () => {
	it('diasEntre deshace sumarDias, no mira la hora y es antisimétrico', () => {
		fc.assert(
			fc.property(momento, momento, cantidad, (a, b, n) => {
				expect(diasEntre(a, sumarDias(a, n))).toBe(n);
				expect(diasEntre(a, b)).toBe(diasEntre(inicioDelDia(a), inicioDelDia(b)));
				expect(diasEntre(b, a) + diasEntre(a, b) === 0).toBe(true);
			})
		);
	});

	it('diasEntre es aditivo: de a a c pasando por b', () => {
		fc.assert(
			fc.property(momento, momento, momento, (a, b, c) => {
				expect(diasEntre(a, c)).toBe(diasEntre(a, b) + diasEntre(b, c));
			})
		);
	});

	it('inicioDelDia es idempotente, no es posterior al momento y conserva el día', () => {
		fc.assert(
			fc.property(momento, (m) => {
				const inicio = inicioDelDia(m);
				expect(inicioDelDia(inicio)).toEqual(inicio);
				expect(inicio.getTime()).toBeLessThanOrEqual(m.getTime());
				expect(diaIso(inicio)).toBe(diaIso(m));
			})
		);
	});

	it('sumarDias compone: sumar a y después b es sumar a + b, y sumar 0 es el inicio del día', () => {
		fc.assert(
			fc.property(momento, cantidad, cantidad, (m, a, b) => {
				expect(sumarDias(sumarDias(m, a), b)).toEqual(sumarDias(m, a + b));
				expect(sumarDias(m, 0)).toEqual(inicioDelDia(m));
			})
		);
	});

	it('la semana avanza un día por día, de lunes a domingo, y se repite cada 7', () => {
		fc.assert(
			fc.property(dia, cantidad, (d, n) => {
				const indice = DIAS_DE_LA_SEMANA.indexOf(diaDeLaSemana(d));
				const esperado = DIAS_DE_LA_SEMANA[(((indice + n) % 7) + 7) % 7];
				expect(diaDeLaSemana(sumarDias(d, n))).toBe(esperado);
			})
		);
	});

	it('el último día del mes está entre 28 y 31 y el día siguiente es un 1', () => {
		fc.assert(
			fc.property(dia, (d) => {
				const ultimo = ultimoDiaDelMes(d);
				expect(ultimo).toBeGreaterThanOrEqual(28);
				expect(ultimo).toBeLessThanOrEqual(31);
				expect(diaDelMes(sumarDias(d, ultimo - diaDelMes(d) + 1))).toBe(1);
			})
		);
	});

	it('AAAA-MM-DD ida y vuelta: el texto lee el inicio del mismo día y vuelve a escribirse igual', () => {
		fc.assert(
			fc.property(momento, (m) => {
				const texto = diaIso(m);
				expect(diaDesdeIso(texto)).toEqual(inicioDelDia(m));
				expect(diaIso(diaDesdeIso(texto))).toBe(texto);
			})
		);
	});
});

const dosDigitos = (n: number) => String(n).padStart(2, '0');
const anio = fc.integer({ min: 1, max: 9999 });
const mes = fc.integer({ min: 1, max: 12 });
const texto = (a: number, m: number, d: number) => `${String(a).padStart(4, '0')}-${dosDigitos(m)}-${dosDigitos(d)}`;
/** El último día de un mes (1..12) de un año, sin pasar por Date. */
const diasDelMes = (a: number, m: number) => {
	const bisiesto = (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0;
	return [31, bisiesto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
};

describe('leerDiaIso (propiedades, spec §4.1)', () => {
	it('toda fecha que existe, de 0001 a 9999, se lee y vuelve a escribirse igual', () => {
		fc.assert(
			fc.property(
				anio.chain((a) => mes.chain((m) => fc.integer({ min: 1, max: diasDelMes(a, m) }).map((d) => texto(a, m, d)))),
				(fecha) => {
					const leido = leerDiaIso(fecha);
					expect(leido).toBeDefined();
					expect(diaIso(leido as Date)).toBe(fecha);
					expect(inicioDelDia(leido as Date)).toEqual(leido);
				}
			)
		);
	});

	it('una fecha con forma AAAA-MM-DD pero inexistente siempre se rechaza', () => {
		const diaFueraDelMes = anio.chain((a) =>
			mes.chain((m) => fc.integer({ min: diasDelMes(a, m) + 1, max: 99 }).map((d) => texto(a, m, d)))
		);
		const mesInexistente = fc
			.tuple(anio, fc.oneof(fc.constant(0), fc.integer({ min: 13, max: 99 })), fc.integer({ min: 1, max: 28 }))
			.map(([a, m, d]) => texto(a, m, d));
		const diaCero = fc.tuple(anio, mes).map(([a, m]) => texto(a, m, 0));
		fc.assert(
			fc.property(fc.oneof(diaFueraDelMes, mesInexistente, diaCero), (fecha) => {
				expect(leerDiaIso(fecha)).toBeUndefined();
			})
		);
	});

	it('un texto que no tiene la forma AAAA-MM-DD siempre se rechaza', () => {
		fc.assert(
			fc.property(
				fc.string().filter((s) => !/^\d{4}-\d{2}-\d{2}$/.test(s)),
				(s) => {
					expect(leerDiaIso(s)).toBeUndefined();
				}
			)
		);
	});
});
