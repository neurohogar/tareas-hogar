import { describe, expect, it } from 'vitest';
import { accionDePosponer, textoDePosposicion } from './posposicion-en-panel';
import type { Completado, Tarea } from './tarea';

const CREADA = new Date(2026, 6, 1, 8, 0, 0);
const PUNTUAL: Tarea = { id: 'p', titulo: 'Pagar', tipo: 'puntual', creadaEn: CREADA };
const RELATIVA: Tarea = { id: 'r', titulo: 'Regar', tipo: 'periodica', recurrencia: { modo: 'relativo', cada: 2, unidad: 'dias' }, creadaEn: CREADA };
const completado = (tareaId: string, completadoEn: Date): Completado => ({ id: `c-${tareaId}`, tareaId, completadoEn });
const pospuesta = (tarea: Tarea, desde: Date, hasta: Date): Tarea => ({ ...tarea, pospuesta: { desde, hasta } });

describe('accionDePosponer (spec §6.2)', () => {
	const AHORA = new Date(2026, 6, 15, 10, 0, 0);

	it('una pendiente ofrece posponer', () => {
		expect(accionDePosponer(PUNTUAL, [], AHORA)).toBe('posponer');
	});

	it('una atrasada ofrece posponer', () => {
		expect(accionDePosponer({ ...PUNTUAL, fechaLimite: new Date(2026, 6, 14) }, [], AHORA)).toBe('posponer');
	});

	it('una en espera por su propia regla no ofrece nada', () => {
		expect(accionDePosponer(RELATIVA, [completado('r', new Date(2026, 6, 15, 9, 0, 0))], AHORA)).toBeUndefined();
	});

	it('una puntual completada no ofrece nada', () => {
		expect(accionDePosponer(PUNTUAL, [completado('p', new Date(2026, 6, 15, 9, 0, 0))], AHORA)).toBeUndefined();
	});

	it('una pausada no se puede posponer (spec §5.9)', () => {
		expect(accionDePosponer({ ...RELATIVA, pausada: true }, [], AHORA)).toBeUndefined();
	});

	it('una pospuesta ofrece quitar posponer', () => {
		expect(accionDePosponer(pospuesta(PUNTUAL, AHORA, new Date(2026, 6, 15, 11, 0, 0)), [], AHORA)).toBe('quitar');
	});

	it('una pospuesta y después completada sigue ofreciendo quitar posponer', () => {
		const tarea = pospuesta(RELATIVA, new Date(2026, 6, 15, 9, 0, 0), new Date(2026, 6, 15, 12, 0, 0));

		expect(accionDePosponer(tarea, [completado('r', new Date(2026, 6, 15, 9, 30, 0))], AHORA)).toBe('quitar');
	});

	it('una pospuesta y después pausada sigue ofreciendo quitar posponer', () => {
		const tarea = pospuesta({ ...RELATIVA, pausada: true }, new Date(2026, 6, 15, 9, 0, 0), new Date(2026, 6, 15, 12, 0, 0));

		expect(accionDePosponer(tarea, [], AHORA)).toBe('quitar');
	});

	it('desde hasta, vuelve a ofrecer posponer', () => {
		expect(accionDePosponer(pospuesta(PUNTUAL, new Date(2026, 6, 15, 9, 0, 0), AHORA), [], AHORA)).toBe('posponer');
	});
});

describe('textoDePosposicion (spec §6.2)', () => {
	const DESDE = new Date(2026, 6, 15, 10, 15, 30);

	it('si hasta es de hoy, la hora sin segundos', () => {
		const tarea = pospuesta(PUNTUAL, DESDE, new Date(2026, 6, 15, 11, 15, 30));

		expect(textoDePosposicion(tarea, new Date(2026, 6, 15, 10, 30, 0))).toBe('Pospuesta hasta 11:15');
	});

	it('si hasta es de mañana, lo dice', () => {
		const tarea = pospuesta(PUNTUAL, DESDE, new Date(2026, 6, 16, 1, 5, 0));

		expect(textoDePosposicion(tarea, new Date(2026, 6, 15, 23, 59, 59))).toBe('Pospuesta hasta mañana 01:05');
	});

	it('pasada la medianoche, ese mismo hasta ya es de hoy', () => {
		const tarea = pospuesta(PUNTUAL, DESDE, new Date(2026, 6, 16, 1, 5, 0));

		expect(textoDePosposicion(tarea, new Date(2026, 6, 16, 0, 0, 0))).toBe('Pospuesta hasta 01:05');
	});

	it('hasta mañana cruzando de mes', () => {
		const tarea = pospuesta(PUNTUAL, DESDE, new Date(2026, 7, 1, 7, 0, 0));

		expect(textoDePosposicion(tarea, new Date(2026, 6, 31, 20, 0, 0))).toBe('Pospuesta hasta mañana 07:00');
	});

	it('sin posposición vigente, no hay texto', () => {
		const hasta = new Date(2026, 6, 15, 11, 0, 0);

		expect(textoDePosposicion(PUNTUAL, DESDE)).toBeUndefined();
		expect(textoDePosposicion(pospuesta(PUNTUAL, DESDE, hasta), hasta)).toBeUndefined();
	});
});
