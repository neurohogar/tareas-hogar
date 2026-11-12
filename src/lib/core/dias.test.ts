import { describe, expect, it } from 'vitest';
import {
	anioDe,
	diaDeLaSemana,
	diaDelMes,
	diaDesdeIso,
	diaIso,
	diasEntre,
	enElMinuto,
	horaYMinuto,
	inicioDelDia,
	mesDe,
	leerDiaIso,
	sumarDias,
	ultimoDiaDelMes
} from './dias';

describe('días locales', () => {
	it('el inicio del día es las 00:00 locales de ese día', () => {
		expect(inicioDelDia(new Date(2026, 6, 15, 23, 59, 59))).toEqual(new Date(2026, 6, 15));
	});

	it('suma y resta días cruzando meses y años', () => {
		expect(sumarDias(new Date(2026, 11, 31), 1)).toEqual(new Date(2027, 0, 1));
		expect(sumarDias(new Date(2026, 2, 1), -1)).toEqual(new Date(2026, 1, 28));
	});

	it('nombra el día de la semana, empezando el lunes', () => {
		expect(diaDeLaSemana(new Date(2026, 6, 13))).toBe('lunes');
		expect(diaDeLaSemana(new Date(2026, 6, 19, 23, 59))).toBe('domingo');
	});

	it('conoce el mes (1..12) y el año de un día local', () => {
		expect(mesDe(new Date(2026, 0, 31, 23, 59))).toBe(1);
		expect(mesDe(new Date(2025, 11, 1))).toBe(12);
		expect(anioDe(new Date(2025, 11, 31, 23, 59, 59))).toBe(2025);
	});

	it('da la hora y el minuto locales de un momento, sin los segundos', () => {
		expect(horaYMinuto(new Date(2026, 6, 14, 23, 59, 59))).toStrictEqual({ hora: 23, minuto: 59 });
		expect(horaYMinuto(new Date(2026, 6, 15, 0, 0, 0))).toStrictEqual({ hora: 0, minuto: 0 });
	});

	it('arma el instante de un minuto del día, sin importar la hora del momento que nombra el día', () => {
		expect(enElMinuto(new Date(2026, 6, 15, 17, 45, 30), 8 * 60 + 30)).toEqual(new Date(2026, 6, 15, 8, 30, 0));
		expect(enElMinuto(new Date(2026, 6, 15), 23 * 60 + 59)).toEqual(new Date(2026, 6, 15, 23, 59, 0));
	});

	it('cuenta los días locales entre dos momentos, sin mirar la hora', () => {
		expect(diasEntre(new Date(2026, 6, 13, 23, 59, 59), new Date(2026, 6, 15, 0, 0, 0))).toBe(2);
		expect(diasEntre(new Date(2026, 6, 15, 0, 0, 0), new Date(2026, 6, 15, 23, 59, 59))).toBe(0);
		expect(diasEntre(new Date(2025, 11, 30, 22), new Date(2026, 0, 2, 8))).toBe(3);
		expect(diasEntre(new Date(2026, 6, 16, 8), new Date(2026, 6, 15, 12))).toBe(-1);
	});

	it('cuenta días enteros aunque alguno no dure 24 horas (cambio de horario)', () => {
		expect(diasEntre(new Date(2026, 0, 1), new Date(2026, 6, 1))).toBe(181);
		expect(diasEntre(new Date(2026, 6, 1), new Date(2026, 11, 1))).toBe(153);
	});

	it('conoce el número del día dentro del mes', () => {
		expect(diaDelMes(new Date(2026, 6, 31, 12))).toBe(31);
	});

	it('conoce el último día de cada mes, con febrero bisiesto', () => {
		expect(ultimoDiaDelMes(new Date(2026, 5, 10))).toBe(30);
		expect(ultimoDiaDelMes(new Date(2026, 1, 10))).toBe(28);
		expect(ultimoDiaDelMes(new Date(2028, 1, 10))).toBe(29);
	});
});

describe('fecha ISO de un día (spec §4.4: ocurrenciaCubierta es una fecha)', () => {
	it('escribe el día local como AAAA-MM-DD, con ceros a la izquierda', () => {
		expect(diaIso(new Date(2026, 6, 5))).toBe('2026-07-05');
		expect(diaIso(new Date(987, 11, 31))).toBe('0987-12-31');
	});

	it('lee AAAA-MM-DD como las 00:00 locales de ese día', () => {
		expect(diaDesdeIso('2026-07-05')).toEqual(new Date(2026, 6, 5));
	});

	it('ida y vuelta conserva el día', () => {
		const dia = new Date(2028, 1, 29);
		expect(diaDesdeIso(diaIso(dia))).toEqual(dia);
	});

	it.each(['2026-7-5', '2026-02-30', '2026-13-01', 'ayer'])('rechaza lo que no es una fecha válida (%s)', (texto) => {
		expect(() => diaDesdeIso(texto)).toThrow();
	});
});

describe('leerDiaIso (spec §4.1: la fecha límite tiene que existir en el calendario)', () => {
	it('lee una fecha que existe como las 00:00 locales de ese día', () => {
		expect(leerDiaIso('2028-02-29')).toEqual(new Date(2028, 1, 29));
	});

	it('lee los años 0001..0099 como tales, no como 19xx', () => {
		expect(diaIso(leerDiaIso('0026-07-15') as Date)).toBe('0026-07-15');
		expect(diaIso(sumarDias(leerDiaIso('0099-12-31') as Date, 1))).toBe('0100-01-01');
		expect(ultimoDiaDelMes(leerDiaIso('0004-02-10') as Date)).toBe(29);
	});

	it.each(['2026-02-29', '2026-04-31', '2026-13-01', '2026-00-10', '2026-07-00', '2026-7-5', '', 'ayer'])(
		'no lee lo que no es una fecha que existe (%j)',
		(texto) => {
			expect(leerDiaIso(texto)).toBeUndefined();
		}
	);
});
