// Endurecimiento: bordes exactos de la ocurrencia que cubre un completado (spec §5.6 y §5.7).
import { describe, expect, it } from 'vitest';
import { ocurrenciaQueCubrePorVentana } from '../../src/lib/core/ocurrencias-con-horario';
import type { Horario, RecurrenciaRelativa } from '../../src/lib/core/tarea';

const CADA_DIA: RecurrenciaRelativa = { modo: 'relativo', cada: 1, unidad: 'dias' };
const en = (hora: number, minuto = 0) => new Date(2026, 6, 15, hora, minuto);

describe('ocurrenciaQueCubrePorVentana: bordes exactos', () => {
	it('al cierre exacto de N, ya no es N: la cubre la ventana más reciente empezada (contigua)', () => {
		const contiguas: Horario = [
			{ desde: '07:00', hasta: '10:00' },
			{ desde: '10:00', hasta: '12:00' }
		];
		expect(ocurrenciaQueCubrePorVentana(CADA_DIA, contiguas, en(6), [], en(10))).toStrictEqual(en(10));
	});

	it('justo al inicio de una ventana posterior, esa ventana ya empezó y es la que cubre', () => {
		const dos: Horario = [
			{ desde: '07:00', hasta: '10:00' },
			{ desde: '18:00', hasta: '21:00' }
		];
		expect(ocurrenciaQueCubrePorVentana(CADA_DIA, dos, en(6), [], en(18))).toStrictEqual(en(18));
	});
});
