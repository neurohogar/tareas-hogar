import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { crearPeriodicaCalendario } from './crear-periodica-calendario';
import { DIAS_DE_LA_SEMANA, type DiaSemana } from './tarea';

const AHORA = new Date(2026, 6, 15, 8);
const crear = (diasSemana: readonly DiaSemana[], diasMes: readonly number[]) =>
	crearPeriodicaCalendario({ titulo: 'Tarea', diasSemana, diasMes }, 'id', AHORA);

const diasSemana = fc.array(fc.constantFrom(...DIAS_DE_LA_SEMANA), { maxLength: 10 });
/** Incluye valores fuera de 1..31 para ejercitar el rechazo. */
const diasMes = fc.array(fc.integer({ min: -3, max: 35 }), { maxLength: 10 });
const permutacion = <T>(xs: readonly T[]) => fc.shuffledSubarray([...xs], { minLength: xs.length });

describe('crearPeriodicaCalendario (propiedades)', () => {
	it('es válida si y solo si hay días de un solo tipo y los del mes están entre 1 y 31', () => {
		fc.assert(
			fc.property(diasSemana, diasMes, (semana, mes) => {
				const unSoloTipo = (semana.length > 0) !== (mes.length > 0);
				const mesValido = mes.every((d) => Number.isInteger(d) && d >= 1 && d <= 31);
				expect(crear(semana, mes).ok).toBe(unSoloTipo && mesValido);
			})
		);
	});

	it('guarda los días semanales como conjunto: sin repetir, en el orden de la semana', () => {
		const semanaConPermutacion = diasSemana
			.filter((d) => d.length > 0)
			.chain((d) => permutacion(d).map((otra) => [d, otra] as const));
		fc.assert(
			fc.property(semanaConPermutacion, ([semana, otra]) => {
				const resultado = crear(semana, []);
				expect(resultado).toEqual(crear(otra, []));
				expect(resultado.ok && resultado.tarea.recurrencia).toEqual({
					modo: 'calendario',
					diasSemana: DIAS_DE_LA_SEMANA.filter((d) => semana.includes(d))
				});
			})
		);
	});

	it('guarda los días del mes como conjunto: sin repetir, de menor a mayor', () => {
		const mesConPermutacion = fc
			.array(fc.integer({ min: 1, max: 31 }), { minLength: 1, maxLength: 10 })
			.chain((d) => permutacion(d).map((otra) => [d, otra] as const));
		fc.assert(
			fc.property(mesConPermutacion, ([mes, otra]) => {
				const resultado = crear([], mes);
				expect(resultado).toEqual(crear([], otra));
				const guardados = resultado.ok && 'diasMes' in resultado.tarea.recurrencia ? resultado.tarea.recurrencia.diasMes : [];
				expect(new Set(guardados)).toEqual(new Set(mes));
				expect(guardados.every((d, i) => i === 0 || guardados[i - 1] < d)).toBe(true);
			})
		);
	});
});
