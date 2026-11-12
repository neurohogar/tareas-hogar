import { describe, expect, it } from 'vitest';
import { encabezadoDelDia, fechaYHoraEnTexto, horaEnTexto } from './fechas-en-texto';

const ahora = new Date(2026, 6, 15, 12, 0, 0);

describe('encabezadoDelDia', () => {
	it('el día de ahora es "Hoy", desde las 00:00 y también más tarde que ahora', () => {
		expect(encabezadoDelDia(new Date(2026, 6, 15, 0, 0, 0), ahora)).toBe('Hoy');
		expect(encabezadoDelDia(new Date(2026, 6, 15, 23, 59, 59), ahora)).toBe('Hoy');
	});

	it('el día anterior es "Ayer", hasta su último segundo y a través del cambio de año', () => {
		expect(encabezadoDelDia(new Date(2026, 6, 14, 23, 59, 59), ahora)).toBe('Ayer');
		expect(encabezadoDelDia(new Date(2026, 6, 14, 0, 0, 0), ahora)).toBe('Ayer');
		expect(encabezadoDelDia(new Date(2025, 11, 31, 22, 0, 0), new Date(2026, 0, 1, 10, 0, 0))).toBe('Ayer');
	});

	it('otro día del año de ahora se nombra con el día de la semana, el número y el mes', () => {
		expect(encabezadoDelDia(new Date(2026, 6, 13, 9, 0, 0), ahora)).toBe('lunes 13 de julio');
		expect(encabezadoDelDia(new Date(2026, 6, 13, 23, 59, 59), ahora)).toBe('lunes 13 de julio');
	});

	it('un día posterior a hoy lleva la fecha, nunca "Mañana"', () => {
		expect(encabezadoDelDia(new Date(2026, 6, 16, 9, 0, 0), ahora)).toBe('jueves 16 de julio');
	});

	it('si el año no es el de ahora, se agrega', () => {
		expect(encabezadoDelDia(new Date(2025, 11, 31, 22, 0, 0), new Date(2026, 0, 2, 10, 0, 0))).toBe(
			'miércoles 31 de diciembre de 2025'
		);
		expect(encabezadoDelDia(new Date(2027, 0, 1, 9, 0, 0), ahora)).toBe('viernes 1 de enero de 2027');
	});

	it('nombra cada mes en minúsculas', () => {
		const meses = [
			'enero',
			'febrero',
			'marzo',
			'abril',
			'mayo',
			'junio',
			'julio',
			'agosto',
			'septiembre',
			'octubre',
			'noviembre',
			'diciembre'
		];
		const desdeDiciembre = new Date(2026, 11, 31, 12, 0, 0);
		const nombrados = meses.map((_, mes) => encabezadoDelDia(new Date(2026, mes, 1, 9, 0, 0), desdeDiciembre));

		expect(nombrados.map((encabezado) => encabezado.split(' de ')[1])).toEqual(meses);
	});
});

describe('horaEnTexto', () => {
	it('es la hora local en 24 h, HH:MM, sin segundos', () => {
		expect(horaEnTexto(new Date(2026, 6, 15, 8, 5, 0))).toBe('08:05');
		expect(horaEnTexto(new Date(2026, 6, 14, 23, 59, 59))).toBe('23:59');
		expect(horaEnTexto(new Date(2026, 6, 15, 0, 0, 0))).toBe('00:00');
	});
});

describe('fechaYHoraEnTexto', () => {
	it('es la fecha y la hora locales, AAAA-MM-DD HH:MM, con ceros a la izquierda y sin segundos', () => {
		expect(fechaYHoraEnTexto(new Date(2026, 6, 15, 8, 5, 0))).toBe('2026-07-15 08:05');
		expect(fechaYHoraEnTexto(new Date(2026, 6, 5, 0, 9, 59))).toBe('2026-07-05 00:09');
		expect(fechaYHoraEnTexto(new Date(2025, 11, 31, 23, 59, 59))).toBe('2025-12-31 23:59');
	});
});
