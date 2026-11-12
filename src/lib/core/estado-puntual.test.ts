import { describe, expect, it } from 'vitest';
import { estadoPuntual } from './estado-puntual';
import type { Completado } from './tarea';

const LIMITE = new Date(2026, 6, 15);
const UN_COMPLETADO: Completado[] = [{ id: 'c1', tareaId: 't1', completadoEn: new Date(2026, 6, 10, 9, 0, 0) }];

describe('estadoPuntual (spec §5.1)', () => {
	it('sin completado ni fecha límite está pendiente', () => {
		expect(estadoPuntual(undefined, [], new Date(2099, 0, 1))).toEqual({ tipo: 'pendiente' });
	});

	it.each([new Date(2026, 6, 14, 23, 59, 59), new Date(2026, 6, 15, 0, 0, 0), new Date(2026, 6, 15, 23, 59, 59)])(
		'hasta el último segundo del día límite está pendiente (%s)',
		(ahora) => {
			expect(estadoPuntual(LIMITE, [], ahora)).toEqual({ tipo: 'pendiente' });
		}
	);

	it.each([new Date(2026, 6, 16, 0, 0, 0), new Date(2026, 8, 1, 8, 0, 0)])(
		'desde el día siguiente al límite está atrasada (%s)',
		(ahora) => {
			expect(estadoPuntual(LIMITE, [], ahora)).toEqual({ tipo: 'atrasada' });
		}
	);

	it.each([undefined, LIMITE])('con un completado está completada, con o sin fecha límite (%s)', (fechaLimite) => {
		expect(estadoPuntual(fechaLimite, UN_COMPLETADO, new Date(2026, 8, 1))).toEqual({ tipo: 'completada' });
	});
});
