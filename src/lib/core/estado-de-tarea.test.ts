import { describe, expect, it } from 'vitest';
import { esperaPorPosposicion, estadoDeTarea } from './estado-de-tarea';
import type { Completado, TareaPeriodica, TareaPuntual } from './tarea';

const TAREA: TareaPeriodica = {
	id: 'tarea-1',
	titulo: 'Ventilar',
	tipo: 'periodica',
	recurrencia: { modo: 'relativo', cada: 4, unidad: 'horas' },
	creadaEn: new Date(2026, 6, 1, 8, 0, 0)
};
const U = new Date(2026, 6, 15, 8, 0, 0);
const DOS_HORAS_DESPUES = new Date(2026, 6, 15, 10, 0, 0);

const completado = (id: string, tareaId: string, completadoEn: Date): Completado => ({ id, tareaId, completadoEn });

describe('estadoDeTarea', () => {
	it('aplica la regla de la periódica relativa a los completados de la tarea', () => {
		expect(estadoDeTarea(TAREA, [completado('c1', 'tarea-1', U)], DOS_HORAS_DESPUES)).toEqual({
			tipo: 'en espera',
			progreso: 0.5
		});
	});

	it('ignora los completados de otras tareas', () => {
		const deOtra = completado('c2', 'tarea-2', DOS_HORAS_DESPUES);

		expect(estadoDeTarea(TAREA, [deOtra], DOS_HORAS_DESPUES)).toEqual({ tipo: 'pendiente' });
	});

	it('aplica la regla de calendario a una semanal, con P desde creadaEn si nunca se completó', () => {
		const semanal: TareaPeriodica = {
			...TAREA,
			recurrencia: { modo: 'calendario', diasSemana: ['martes'] },
			creadaEn: new Date(2026, 6, 13, 8, 0, 0)
		};

		expect(estadoDeTarea(semanal, [], new Date(2026, 6, 13, 16, 0, 0))).toEqual({ tipo: 'en espera', progreso: 0.5 });
		expect(estadoDeTarea(semanal, [], new Date(2026, 6, 14, 9, 0, 0))).toEqual({ tipo: 'pendiente' });
	});

	it('en modo calendario solo cuenta lo que cubren los completados de la tarea', () => {
		const mensual: TareaPeriodica = {
			...TAREA,
			recurrencia: { modo: 'calendario', diasMes: [15] },
			creadaEn: new Date(2026, 6, 1, 8, 0, 0)
		};
		const deOtra: Completado = { ...completado('c3', 'tarea-2', U), ocurrenciaCubierta: new Date(2026, 6, 15) };

		expect(estadoDeTarea(mensual, [deOtra], new Date(2026, 6, 16, 0, 0, 0))).toEqual({ tipo: 'atrasada' });
	});

	it('aplica la regla de la puntual con su fecha límite y solo los completados de la tarea', () => {
		const puntual: TareaPuntual = {
			id: 'tarea-3',
			titulo: 'Pagar la luz',
			tipo: 'puntual',
			fechaLimite: new Date(2026, 6, 15),
			creadaEn: new Date(2026, 6, 1, 8, 0, 0)
		};
		const despuesDelLimite = new Date(2026, 6, 16, 0, 0, 0);

		expect(estadoDeTarea(puntual, [completado('c4', 'tarea-2', U)], despuesDelLimite)).toEqual({ tipo: 'atrasada' });
		expect(estadoDeTarea(puntual, [completado('c5', 'tarea-3', U)], despuesDelLimite)).toEqual({ tipo: 'completada' });
	});
});

describe('estadoDeTarea de una pausada o reanudada (spec §5.8)', () => {
	const REANUDADA = new Date(2026, 6, 15, 10, 0, 0);
	const relativa: TareaPeriodica = { ...TAREA, recurrencia: { modo: 'relativo', cada: 2, unidad: 'dias' } };
	const semanal = (diasSemana: TareaPeriodica['recurrencia'] & { modo: 'calendario' }): TareaPeriodica => ({ ...TAREA, recurrencia: diasSemana });
	const MIERCOLES = semanal({ modo: 'calendario', diasSemana: ['miércoles'] });
	const JUEVES = semanal({ modo: 'calendario', diasSemana: ['jueves'] });

	it('una pausada no tiene estado, aunque estaría atrasada', () => {
		const viejo = completado('c1', 'tarea-1', new Date(2026, 6, 1, 9, 0, 0));

		expect(estadoDeTarea({ ...relativa, pausada: true }, [viejo], REANUDADA)).toEqual({ tipo: 'pausada' });
		expect(estadoDeTarea({ ...MIERCOLES, pausada: true }, [], new Date(2026, 7, 20))).toEqual({ tipo: 'pausada' });
	});

	it('una relativa reanudada queda pendiente: no cuenta el completado de antes de reanudar', () => {
		const deAyer = completado('c1', 'tarea-1', new Date(2026, 6, 14, 9, 0, 0));

		expect(estadoDeTarea({ ...relativa, reanudadaEn: REANUDADA }, [deAyer], REANUDADA)).toEqual({ tipo: 'pendiente' });
		expect(estadoDeTarea({ ...relativa, reanudadaEn: REANUDADA }, [deAyer], new Date(2026, 6, 25))).toEqual({ tipo: 'pendiente' });
	});

	it('un completado en el instante de la reanudación cuenta', () => {
		const enElInstante = completado('c1', 'tarea-1', REANUDADA);

		expect(estadoDeTarea({ ...relativa, reanudadaEn: REANUDADA }, [enElInstante], REANUDADA)).toEqual({ tipo: 'en espera', progreso: 0 });
	});

	it('una de calendario reanudada un día de ocurrencia queda pendiente, aunque la ocurrencia pasada esté sin cubrir', () => {
		expect(estadoDeTarea({ ...MIERCOLES, reanudadaEn: REANUDADA }, [], REANUDADA)).toEqual({ tipo: 'pendiente' });
	});

	it('una de calendario reanudada un día sin ocurrencia queda en espera, con progreso desde reanudadaEn', () => {
		// Jueves 16 a las 00:00: 14 h después de reanudar, de 14 h de espera.
		expect(estadoDeTarea({ ...JUEVES, reanudadaEn: REANUDADA }, [], new Date(2026, 6, 15, 17, 0, 0))).toEqual({
			tipo: 'en espera',
			progreso: 0.5
		});
	});

	it('con horario, una ventana que cerró antes de reanudar no cuenta como perdida', () => {
		const conHorario: TareaPeriodica = { ...MIERCOLES, horario: [{ desde: '08:00', hasta: '10:00' }], reanudadaEn: REANUDADA };
		const masTarde = new Date(2026, 6, 15, 12, 0, 0);

		expect(estadoDeTarea(conHorario, [], masTarde).tipo).toBe('en espera');
		expect(estadoDeTarea({ ...conHorario, reanudadaEn: new Date(2026, 6, 15, 9, 0, 0) }, [], masTarde)).toEqual({ tipo: 'atrasada' });
	});

	it('con horario, la reanudada en la ventana queda pendiente y se atrasa al cerrar', () => {
		const conHorario: TareaPeriodica = { ...MIERCOLES, horario: [{ desde: '08:00', hasta: '12:00' }], reanudadaEn: REANUDADA };

		expect(estadoDeTarea(conHorario, [], new Date(2026, 6, 15, 11, 0, 0))).toEqual({ tipo: 'pendiente' });
		expect(estadoDeTarea(conHorario, [], new Date(2026, 6, 15, 12, 0, 0))).toEqual({ tipo: 'atrasada' });
	});

	it('con varios horarios, en espera hasta la próxima ventana que cierra después de reanudar', () => {
		const conHorario: TareaPeriodica = {
			...MIERCOLES,
			horario: [
				{ desde: '07:00', hasta: '09:00' },
				{ desde: '18:00', hasta: '20:00' }
			],
			reanudadaEn: REANUDADA
		};

		expect(estadoDeTarea(conHorario, [], new Date(2026, 6, 15, 14, 0, 0))).toEqual({ tipo: 'en espera', progreso: 0.5 });
	});
});

describe('estadoDeTarea de una pospuesta (spec §5.9)', () => {
	const DESDE = new Date(2026, 6, 15, 10, 0, 0);
	const HASTA = new Date(2026, 6, 15, 13, 0, 0);
	const pospuesta = { desde: DESDE, hasta: HASTA };
	const A_LA_MITAD = new Date(2026, 6, 15, 11, 30, 0);
	const PUNTUAL: TareaPuntual = { id: 'p', titulo: 'Pagar', tipo: 'puntual', creadaEn: new Date(2026, 6, 1), pospuesta };

	it('una puntual pendiente está en espera hasta el borde de hasta, y después vuelve', () => {
		expect(estadoDeTarea(PUNTUAL, [], A_LA_MITAD)).toStrictEqual({ tipo: 'en espera', progreso: 0.5 });
		expect(estadoDeTarea(PUNTUAL, [], HASTA)).toStrictEqual({ tipo: 'pendiente' });
	});

	it('la posposición no mueve la fecha límite: al vencer, está atrasada en el acto', () => {
		const tarea = { ...PUNTUAL, fechaLimite: new Date(2026, 6, 14) };

		expect(estadoDeTarea(tarea, [], A_LA_MITAD)).toStrictEqual({ tipo: 'en espera', progreso: 0.5 });
		expect(estadoDeTarea(tarea, [], HASTA)).toStrictEqual({ tipo: 'atrasada' });
	});

	it('en espera por su propia regla, vale su progreso', () => {
		const tarea = { ...TAREA, pospuesta };
		const ahora = new Date(2026, 6, 15, 12, 0, 0);

		expect(estadoDeTarea(tarea, [completado('c', 'tarea-1', new Date(2026, 6, 15, 11, 0, 0))], ahora)).toStrictEqual({ tipo: 'en espera', progreso: 0.25 });
	});

	it('una puntual completada sigue completada', () => {
		expect(estadoDeTarea(PUNTUAL, [completado('c', 'p', A_LA_MITAD)], A_LA_MITAD)).toStrictEqual({ tipo: 'completada' });
	});

	it('esperaPorPosposicion distingue la espera por la posposición de la de su propia regla', () => {
		const relativa = { ...TAREA, pospuesta };
		const dePosponer = completado('c', 'tarea-1', new Date(2026, 6, 15, 6, 0, 0));
		const deSuRegla = completado('c', 'tarea-1', new Date(2026, 6, 15, 11, 0, 0));

		expect(esperaPorPosposicion(relativa, [dePosponer], A_LA_MITAD)).toBe(pospuesta);
		expect(esperaPorPosposicion(relativa, [deSuRegla], A_LA_MITAD)).toBeUndefined();
		expect(esperaPorPosposicion(relativa, [dePosponer], HASTA)).toBeUndefined();
		expect(esperaPorPosposicion(TAREA, [], A_LA_MITAD)).toBeUndefined();
	});

	it('una pausada no tiene estado aunque esté pospuesta', () => {
		expect(estadoDeTarea({ ...TAREA, pospuesta, pausada: true }, [], A_LA_MITAD)).toStrictEqual({ tipo: 'pausada' });
	});

	it('una reanudada antes de hasta sigue pospuesta', () => {
		const tarea = { ...TAREA, pospuesta, reanudadaEn: new Date(2026, 6, 15, 11, 0, 0) };

		expect(estadoDeTarea(tarea, [], A_LA_MITAD)).toStrictEqual({ tipo: 'en espera', progreso: 0.5 });
	});
});
