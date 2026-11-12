import { describe, expect, it } from 'vitest';
import { accionDelCheckbox, checkboxHabilitado } from './checkbox';
import type { Completado, Tarea } from './tarea';

const CREADA = new Date(2026, 6, 1);
const puntual: Tarea = { id: 'p', titulo: 'Pagar', tipo: 'puntual', creadaEn: CREADA };
const relativa: Tarea = { id: 'r', titulo: 'Regar', tipo: 'periodica', recurrencia: { modo: 'relativo', cada: 2, unidad: 'dias' }, creadaEn: CREADA };
const semanal: Tarea = {
	id: 's',
	titulo: 'Basura',
	tipo: 'periodica',
	recurrencia: { modo: 'calendario', diasSemana: ['martes', 'jueves'] },
	creadaEn: CREADA
};
const completado = (id: string, tareaId: string, completadoEn: Date, ocurrenciaCubierta?: Date): Completado => ({
	id,
	tareaId,
	completadoEn,
	...(ocurrenciaCubierta && { ocurrenciaCubierta })
});

describe('accionDelCheckbox (spec §6.1)', () => {
	it('una tarea no completada se completa', () => {
		expect(accionDelCheckbox(puntual, [], new Date(2026, 6, 15, 8, 0, 0))).toEqual({ tipo: 'completar' });
	});

	it('una periódica con completados pero pendiente se completa (no borra el anterior)', () => {
		const anterior = completado('c1', 'r', new Date(2026, 6, 10, 8, 0, 0));
		expect(accionDelCheckbox(relativa, [anterior], new Date(2026, 6, 15, 8, 0, 0))).toEqual({ tipo: 'completar' });
	});

	it('una puntual completada borra su completado más reciente, aunque sea de otro día', () => {
		const viejo = completado('c1', 'p', new Date(2026, 6, 10, 9, 0, 0));
		const reciente = completado('c2', 'p', new Date(2026, 6, 12, 9, 0, 0));
		expect(accionDelCheckbox(puntual, [reciente, viejo], new Date(2026, 6, 15, 8, 0, 0))).toEqual({ tipo: 'borrar', completado: reciente });
	});

	it('una periódica completada hoy borra el completado más reciente', () => {
		const ayer = completado('c1', 'r', new Date(2026, 6, 13, 9, 0, 0));
		const hoy = completado('c2', 'r', new Date(2026, 6, 15, 0, 0, 0));
		expect(accionDelCheckbox(relativa, [hoy, ayer], new Date(2026, 6, 15, 23, 59, 59))).toEqual({ tipo: 'borrar', completado: hoy });
	});

	it('una periódica con un completado "del futuro" (relojes desfasados) lo borra', () => {
		const futuro = completado('c1', 'r', new Date(2026, 6, 16, 9, 0, 0));
		expect(accionDelCheckbox(relativa, [futuro], new Date(2026, 6, 15, 12, 0, 0))).toEqual({ tipo: 'borrar', completado: futuro });
	});

	it('una periódica completada un día anterior se completa de nuevo', () => {
		const ayer = completado('c1', 'r', new Date(2026, 6, 14, 23, 59, 59));
		expect(accionDelCheckbox(relativa, [ayer], new Date(2026, 6, 15, 0, 0, 0))).toEqual({ tipo: 'completar' });
	});

	it('una semanal completada un día anterior se completa de nuevo', () => {
		const lunes = completado('c1', 's', new Date(2026, 6, 13, 10, 0, 0), new Date(2026, 6, 14));
		expect(accionDelCheckbox(semanal, [lunes], new Date(2026, 6, 14, 8, 0, 0))).toEqual({ tipo: 'completar' });
	});

	it('solo cuentan los completados de la tarea', () => {
		const deOtra = completado('c1', 'otra', new Date(2026, 6, 15, 9, 0, 0));
		expect(accionDelCheckbox(puntual, [deOtra], new Date(2026, 6, 15, 10, 0, 0))).toEqual({ tipo: 'completar' });
	});
});

describe('checkbox con horario (spec §5.5, §6.1)', () => {
	const horario = [{ desde: '08:00', hasta: '11:00' }];
	const conHorario = <T extends Tarea>(tarea: T): T => ({ ...tarea, horario });

	it.each([new Date(2026, 6, 15, 8, 0, 0), new Date(2026, 6, 15, 10, 59, 59)])('dentro de la ventana completa (%s)', (ahora) => {
		expect(accionDelCheckbox(conHorario(puntual), [], ahora)).toEqual({ tipo: 'completar' });
		expect(checkboxHabilitado(conHorario(puntual), [], ahora)).toBe(true);
	});

	it.each([new Date(2026, 6, 15, 7, 59, 59), new Date(2026, 6, 15, 11, 0, 0), new Date(2026, 6, 16, 3, 0, 0)])(
		'fuera de la ventana, lo que completaría no hace nada y está deshabilitado (%s)',
		(ahora) => {
			expect(accionDelCheckbox(conHorario(puntual), [], ahora)).toEqual({ tipo: 'ninguna' });
			expect(checkboxHabilitado(conHorario(puntual), [], ahora)).toBe(false);
		}
	);

	it('una periódica completada un día anterior, fuera de la ventana, no se completa de nuevo', () => {
		const anterior = completado('c1', 'r', new Date(2026, 6, 14, 9, 0, 0));
		const cadaTresDias = conHorario({ ...relativa, recurrencia: { modo: 'relativo' as const, cada: 3, unidad: 'dias' as const } });
		expect(accionDelCheckbox(cadaTresDias, [anterior], new Date(2026, 6, 15, 12, 0, 0))).toEqual({ tipo: 'ninguna' });
		expect(accionDelCheckbox(cadaTresDias, [anterior], new Date(2026, 6, 15, 9, 0, 0))).toEqual({ tipo: 'completar' });
	});

	it('lo que borraría está habilitado a cualquier hora', () => {
		const hecho = completado('c1', 'p', new Date(2026, 6, 15, 9, 0, 0));
		expect(accionDelCheckbox(conHorario(puntual), [hecho], new Date(2026, 6, 15, 20, 0, 0))).toEqual({ tipo: 'borrar', completado: hecho });
		expect(checkboxHabilitado(conHorario(puntual), [hecho], new Date(2026, 6, 15, 20, 0, 0))).toBe(true);
	});

	it('sin horario, siempre está habilitado', () => {
		expect(checkboxHabilitado(puntual, [], new Date(2026, 6, 16, 3, 0, 0))).toBe(true);
	});
});

describe('checkbox con varias ventanas (spec §5.5, §6.1)', () => {
	const horario = [
		{ desde: '07:00', hasta: '10:00' },
		{ desde: '18:00', hasta: '21:00' }
	];

	it('completa dentro de cualquiera de las ventanas y está deshabilitado entre ellas', () => {
		const tarea = { ...puntual, horario };
		expect(checkboxHabilitado(tarea, [], new Date(2026, 6, 15, 9, 0, 0))).toBe(true);
		expect(checkboxHabilitado(tarea, [], new Date(2026, 6, 15, 12, 0, 0))).toBe(false);
		expect(checkboxHabilitado(tarea, [], new Date(2026, 6, 15, 18, 0, 0))).toBe(true);
	});
});

describe('el checkbox de una pausada o reanudada (spec §5.8)', () => {
	const AHORA = new Date(2026, 6, 15, 12, 0, 0);

	it('de una pausada está deshabilitado, completada o no', () => {
		const deHoy = completado('c1', 'r', new Date(2026, 6, 15, 9, 0, 0));

		expect(accionDelCheckbox({ ...relativa, pausada: true }, [], AHORA)).toEqual({ tipo: 'ninguna' });
		expect(checkboxHabilitado({ ...relativa, pausada: true }, [deHoy], AHORA)).toBe(false);
	});

	it('de una reanudada completada hoy antes de la pausa la completa, en lugar de borrar ese completado', () => {
		const deHoy = completado('c1', 'r', new Date(2026, 6, 15, 9, 0, 0));
		const reanudada = { ...relativa, reanudadaEn: new Date(2026, 6, 15, 11, 0, 0) };

		expect(accionDelCheckbox(reanudada, [deHoy], AHORA)).toEqual({ tipo: 'completar' });
	});

	it('de una de calendario reanudada en espera sin completados desde la reanudación la completa', () => {
		// Miércoles: espera al jueves; el completado de esta mañana es de antes de reanudar.
		const deHoy = completado('c1', 's', new Date(2026, 6, 15, 9, 0, 0), new Date(2026, 6, 14));
		const reanudada = { ...semanal, reanudadaEn: new Date(2026, 6, 15, 11, 0, 0) };

		expect(accionDelCheckbox(reanudada, [deHoy], AHORA)).toEqual({ tipo: 'completar' });
	});

	it('de una reanudada completada después de reanudar borra ese completado', () => {
		const despues = completado('c2', 'r', new Date(2026, 6, 15, 11, 30, 0));
		const reanudada = { ...relativa, reanudadaEn: new Date(2026, 6, 15, 11, 0, 0) };

		expect(accionDelCheckbox(reanudada, [completado('c1', 'r', new Date(2026, 6, 15, 9, 0, 0)), despues], AHORA)).toEqual({
			tipo: 'borrar',
			completado: despues
		});
	});
});

describe('accionDelCheckbox de una pospuesta (spec §5.9)', () => {
	const pospuesta = { desde: new Date(2026, 6, 15, 12, 0, 0), hasta: new Date(2026, 6, 15, 15, 0, 0) };
	const AHORA = new Date(2026, 6, 15, 13, 0, 0);

	it('una periódica pospuesta con un completado de hoy se completa de nuevo', () => {
		const tarea: Tarea = { ...relativa, recurrencia: { modo: 'relativo', cada: 4, unidad: 'horas' }, pospuesta };

		expect(accionDelCheckbox(tarea, [completado('c', 'r', new Date(2026, 6, 15, 8, 0, 0))], AHORA)).toStrictEqual({ tipo: 'completar' });
	});

	it('fuera de la ventana de su horario, el checkbox está deshabilitado', () => {
		const tarea: Tarea = { ...puntual, pospuesta, horario: [{ desde: '08:00', hasta: '11:00' }] };

		expect(checkboxHabilitado(tarea, [], AHORA)).toBe(false);
	});

	it('dentro de la ventana de su horario, está habilitado', () => {
		const tarea: Tarea = { ...puntual, pospuesta, horario: [{ desde: '08:00', hasta: '14:00' }] };

		expect(checkboxHabilitado(tarea, [], AHORA)).toBe(true);
	});
});
