import { describe, expect, it } from 'vitest';
import { estadoDeTarea } from './estado-de-tarea';
import type { Completado, Tarea } from './tarea';
import { textoDeFecha } from './texto-de-fecha-de-tarea';

const AHORA = new Date(2026, 10, 13, 10, 0);
const CREADA = new Date(2026, 10, 1, 9, 0);

const puntual = (fechaLimite?: Date): Tarea => ({ id: 't', titulo: 'T', tipo: 'puntual', creadaEn: CREADA, ...(fechaLimite && { fechaLimite }) });
const cadaDosDias: Tarea = { id: 't', titulo: 'T', tipo: 'periodica', recurrencia: { modo: 'relativo', cada: 2, unidad: 'dias' }, creadaEn: CREADA };
const completado = (completadoEn: Date): Completado => ({ id: `c${completadoEn.getTime()}`, tareaId: 't', completadoEn });

/** El texto con el estado que da el core en ese momento. */
const texto = (tarea: Tarea, completados: Completado[] = [], ahora = AHORA) => textoDeFecha(tarea, completados, estadoDeTarea(tarea, completados, ahora), ahora);

describe('textoDeFecha (spec §6.1)', () => {
	it('una atrasada dice desde cuándo toca: «Tocaba …»', () => {
		expect(texto(puntual(new Date(2026, 10, 10)))).toBe('Tocaba el martes 10 · hace 3 días');
		expect(texto(cadaDosDias, [completado(new Date(2026, 10, 8, 9, 0))])).toBe('Tocaba el martes 10 09:00 · hace 3 días');
	});

	it('una en espera dice cuándo vuelve: «Vuelve …»', () => {
		expect(texto(cadaDosDias, [completado(new Date(2026, 10, 13, 8, 0))])).toBe('Vuelve el domingo 15 08:00 · en 2 días');
		const pospuesta: Tarea = { ...puntual(new Date(2026, 10, 10)), pospuesta: { desde: AHORA, hasta: new Date(2026, 10, 13, 13, 0) } };
		expect(texto(pospuesta)).toBe('Vuelve hoy 13:00 · en 3 horas');
	});

	it('una pendiente no lleva texto de fecha', () => {
		expect(texto(puntual(new Date(2026, 10, 13)))).toBeUndefined();
		expect(texto(puntual())).toBeUndefined();
		expect(texto(cadaDosDias, [completado(new Date(2026, 10, 11, 10, 0))])).toBeUndefined();
	});

	it('una puntual completada y una pausada no llevan texto de fecha', () => {
		expect(texto(puntual(new Date(2026, 10, 10)), [completado(new Date(2026, 10, 12, 9, 0))])).toBeUndefined();
		expect(texto({ ...cadaDosDias, pausada: true }, [completado(new Date(2026, 10, 1, 9, 0))])).toBeUndefined();
	});
});
