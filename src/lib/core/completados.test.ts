import { describe, expect, it } from 'vitest';
import { completadosDeTarea, completar } from './completados';
import type { Completado, TareaPeriodica, TareaPuntual } from './tarea';

const TAREA: TareaPeriodica = {
	id: 'tarea-1',
	titulo: 'Ventilar',
	tipo: 'periodica',
	recurrencia: { modo: 'relativo', cada: 4, unidad: 'horas' },
	creadaEn: new Date(2026, 6, 1, 8, 0, 0)
};

const MARTES_Y_JUEVES: TareaPeriodica = {
	id: 'tarea-2',
	titulo: 'Sacar la basura',
	tipo: 'periodica',
	recurrencia: { modo: 'calendario', diasSemana: ['martes', 'jueves'] },
	creadaEn: new Date(2026, 6, 13, 8, 0, 0)
};
const dia = (d: number) => new Date(2026, 6, d);

const PUNTUAL: TareaPuntual = {
	id: 'tarea-3',
	titulo: 'Pagar la luz',
	tipo: 'puntual',
	fechaLimite: new Date(2026, 6, 15),
	creadaEn: new Date(2026, 6, 1, 8, 0, 0)
};

describe('completar', () => {
	it('registra el completado de una puntual en ese momento, sin ocurrencia cubierta', () => {
		const momento = new Date(2026, 6, 16, 10, 0, 0);

		expect(completar(PUNTUAL, [], 'c1', momento)).toStrictEqual({ id: 'c1', tareaId: 'tarea-3', completadoEn: momento });
	});

	it('registra un completado de la tarea en ese momento, sin ocurrencia cubierta', () => {
		const momento = new Date(2026, 6, 15, 9, 30, 0);

		const completado = completar(TAREA, [], 'c1', momento);

		expect(completado).toStrictEqual({ id: 'c1', tareaId: 'tarea-1', completadoEn: momento });
	});

	it('en modo calendario cubre la ocurrencia más reciente sin cubrir hasta hoy', () => {
		const viernes = new Date(2026, 6, 17, 10, 0, 0);

		expect(completar(MARTES_Y_JUEVES, [], 'c1', viernes)).toStrictEqual({
			id: 'c1',
			tareaId: 'tarea-2',
			completadoEn: viernes,
			ocurrenciaCubierta: dia(16)
		});
	});

	it('en modo calendario, sin ocurrencias sin cubrir hasta hoy, cubre la próxima', () => {
		const lunes = new Date(2026, 6, 13, 10, 0, 0);

		expect(completar(MARTES_Y_JUEVES, [], 'c1', lunes).ocurrenciaCubierta).toEqual(dia(14));
	});

	it('parte de lo que cubrieron los completados anteriores de la tarea, no de otras', () => {
		const lunes = new Date(2026, 6, 13, 20, 0, 0);
		const anterior: Completado = {
			id: 'c1',
			tareaId: 'tarea-2',
			completadoEn: new Date(2026, 6, 13, 9),
			ocurrenciaCubierta: dia(14)
		};
		const deOtra: Completado = { ...anterior, id: 'c2', tareaId: 'otra', ocurrenciaCubierta: dia(16) };

		expect(completar(MARTES_Y_JUEVES, [anterior, deOtra], 'c3', lunes).ocurrenciaCubierta).toEqual(dia(16));
		expect(completar(MARTES_Y_JUEVES, [deOtra], 'c3', lunes).ocurrenciaCubierta).toEqual(dia(14));
	});
});

describe('completadosDeTarea', () => {
	const de = (id: string, tareaId: string): Completado => ({ id, tareaId, completadoEn: new Date(2026, 6, 15) });

	it('devuelve solo los completados de la tarea pedida, en su orden', () => {
		const completados = [de('a', 'tarea-1'), de('b', 'tarea-2'), de('c', 'tarea-1')];

		expect(completadosDeTarea(completados, 'tarea-1').map((c) => c.id)).toEqual(['a', 'c']);
	});

	it('devuelve una lista vacía si la tarea no tiene completados', () => {
		expect(completadosDeTarea([de('b', 'tarea-2')], 'tarea-1')).toEqual([]);
	});
});

describe('completar con horario (spec §4.4, §5.6, §5.7)', () => {
	const MANANA_Y_TARDE = [
		{ desde: '07:00', hasta: '10:00' },
		{ desde: '18:00', hasta: '21:00' }
	];
	const en = (d: number, hora: number) => new Date(2026, 6, d, hora, 0, 0);

	it('de calendario con horario, guarda el inicio de la ocurrencia que cubre', () => {
		const tarea: TareaPeriodica = { ...MARTES_Y_JUEVES, horario: MANANA_Y_TARDE };
		expect(completar(tarea, [], 'c', en(14, 19)).ocurrenciaCubierta).toStrictEqual({ inicio: en(14, 18) });
	});

	it('de calendario con una sola ventana, también con hora', () => {
		const tarea: TareaPeriodica = { ...MARTES_Y_JUEVES, horario: [{ desde: '08:00', hasta: '11:00' }] };
		expect(completar(tarea, [], 'c', en(14, 9)).ocurrenciaCubierta).toStrictEqual({ inicio: en(14, 8) });
	});

	it('relativa en días con varias ventanas, guarda el inicio de la ventana que cubre', () => {
		const tarea: TareaPeriodica = { ...TAREA, recurrencia: { modo: 'relativo', cada: 2, unidad: 'dias' }, horario: MANANA_Y_TARDE };
		const anterior: Completado = { id: 'a', tareaId: tarea.id, completadoEn: en(13, 8), ocurrenciaCubierta: { inicio: en(13, 7) } };
		expect(completar(tarea, [anterior], 'c', en(13, 19)).ocurrenciaCubierta).toStrictEqual({ inicio: en(13, 18) });
	});

	it('relativa con una sola ventana, o en horas, no cubre ninguna ocurrencia', () => {
		const enDias: TareaPeriodica = { ...TAREA, recurrencia: { modo: 'relativo', cada: 2, unidad: 'dias' }, horario: [MANANA_Y_TARDE[0]] };
		expect(completar(enDias, [], 'c', en(13, 8))).not.toHaveProperty('ocurrenciaCubierta');
		const enHoras: TareaPeriodica = { ...TAREA, horario: MANANA_Y_TARDE };
		expect(completar(enHoras, [], 'c', en(13, 8))).not.toHaveProperty('ocurrenciaCubierta');
	});
});

describe('completar una reanudada (spec §5.8)', () => {
	const REANUDADA_MIERCOLES = new Date(2026, 6, 15, 10, 0, 0);

	it('de calendario, reanudada un día sin ocurrencia, cubre la próxima, no la perdida en la pausa', () => {
		const tarea = { ...MARTES_Y_JUEVES, reanudadaEn: REANUDADA_MIERCOLES };

		expect(completar(tarea, [], 'c1', new Date(2026, 6, 15, 12, 0, 0)).ocurrenciaCubierta).toEqual(dia(16));
	});

	it('de calendario, ignora los completados de antes de reanudar', () => {
		const cubrioElJueves = { id: 'c0', tareaId: 'tarea-2', completadoEn: new Date(2026, 6, 14, 9, 0, 0), ocurrenciaCubierta: dia(16) };
		const tarea = { ...MARTES_Y_JUEVES, reanudadaEn: REANUDADA_MIERCOLES };

		expect(completar(tarea, [cubrioElJueves], 'c1', new Date(2026, 6, 15, 12, 0, 0)).ocurrenciaCubierta).toEqual(dia(16));
	});

	it('con horario, una ventana que cerró antes de reanudar no se cubre', () => {
		const tarea = { ...MARTES_Y_JUEVES, horario: [{ desde: '08:00', hasta: '09:00' }], reanudadaEn: new Date(2026, 6, 14, 10, 0, 0) };

		expect(completar(tarea, [], 'c1', new Date(2026, 6, 14, 11, 0, 0)).ocurrenciaCubierta).toEqual({ inicio: new Date(2026, 6, 16, 8, 0, 0) });
	});
});
