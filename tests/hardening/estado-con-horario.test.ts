import { describe, expect, it } from 'vitest';
import { estadoPeriodicaConHorario, plazosDesdeMomentos } from '../../src/lib/core/estado-con-horario';

const horario = [{ desde: '08:00', hasta: '11:00' }];

describe('estadoPeriodicaConHorario: atraso sin horario en el instante 0', () => {
	it('un atraso sin horario en el instante 0 cuenta como atraso (no como ausente)', () => {
		const momentos = { pasaAPendiente: new Date(1970, 0, 1, 9, 0).getTime(), inicioDeEspera: 0, atrasadaSinHorario: 0 };
		expect(estadoPeriodicaConHorario(plazosDesdeMomentos(horario, momentos), new Date(1970, 0, 1, 9, 30))).toEqual({ tipo: 'atrasada' });
	});
});
