// Endurecimiento: bordes exactos de la ocurrencia que cubre un completado (spec §5.6 y §5.7).
import { describe, expect, it } from 'vitest';
import { windowOccurrenceThatCovers } from '../../src/lib/core/occurrences-with-schedule';
import type { Schedule, RelativeRecurrence } from '../../src/lib/core/task';

const EVERY_DAY: RelativeRecurrence = { mode: 'relativo', every: 1, unit: 'dias' };
const at = (hour: number, minute = 0) => new Date(2026, 6, 15, hour, minute);

describe('ocurrenciaQueCubrePorVentana: bordes exactos', () => {
	it('al cierre exacto de N, ya no es N: la cubre la ventana más reciente empezada (contigua)', () => {
		const contiguous: Schedule = [
			{ from: '07:00', to: '10:00' },
			{ from: '10:00', to: '12:00' }
		];
		expect(windowOccurrenceThatCovers(EVERY_DAY, contiguous, at(6), [], at(10))).toStrictEqual(at(10));
	});

	it('justo al inicio de una ventana posterior, esa ventana ya empezó y es la que cubre', () => {
		const two: Schedule = [
			{ from: '07:00', to: '10:00' },
			{ from: '18:00', to: '21:00' }
		];
		expect(windowOccurrenceThatCovers(EVERY_DAY, two, at(6), [], at(18))).toStrictEqual(at(18));
	});
});
