import { describe, expect, it } from 'vitest';
import { historial, type GrupoDelHistorial } from './historial';
import type { Completado, Tarea } from './tarea';

const tarea = (id: string, titulo = id): Tarea => ({ id, titulo, tipo: 'puntual', creadaEn: new Date(2026, 0, 1) });
const completado = (id: string, tareaId: string, completadoEn: Date): Completado => ({ id, tareaId, completadoEn });

const ahora = new Date(2026, 6, 15, 12, 0, 0);

/** "Hoy: Pagar 10:00, Regar 08:05; Ayer: ..." */
function enTexto(grupos: GrupoDelHistorial[]): string {
	return grupos
		.map(({ encabezado, entradas }) => `${encabezado}: ${entradas.map(({ tarea, hora }) => `${tarea.titulo} ${hora}`).join(', ')}`)
		.join('; ');
}

describe('historial', () => {
	it('sin completados no tiene grupos', () => {
		expect(historial([tarea('regar')], [], ahora)).toEqual([]);
	});

	it('va del más reciente al más antiguo y agrupa por día local, aunque se hayan completado en otro orden', () => {
		const completados = [
			completado('c1', 'regar', new Date(2026, 6, 15, 8, 5)),
			completado('c2', 'pagar', new Date(2026, 6, 15, 10, 0)),
			completado('c3', 'regar', new Date(2026, 6, 13, 9, 0)),
			completado('c4', 'basura', new Date(2026, 6, 14, 21, 30))
		];

		expect(enTexto(historial([tarea('regar'), tarea('basura'), tarea('pagar')], completados, ahora))).toBe(
			'Hoy: pagar 10:00, regar 08:05; Ayer: basura 21:30; lunes 13 de julio: regar 09:00'
		);
	});

	it('con el mismo completadoEn va primero el de id menor', () => {
		const momento = new Date(2026, 6, 15, 10, 0);
		const tareas = [tarea('regar'), tarea('pagar')];

		expect(enTexto(historial(tareas, [completado('c2', 'regar', momento), completado('c1', 'pagar', momento)], ahora))).toBe(
			'Hoy: pagar 10:00, regar 10:00'
		);
		expect(enTexto(historial(tareas, [completado('c1', 'regar', momento), completado('c2', 'pagar', momento)], ahora))).toBe(
			'Hoy: regar 10:00, pagar 10:00'
		);
	});

	it('cada entrada lleva su completado y la tarea actual (con su título actual)', () => {
		const regada = completado('c1', 'regar', new Date(2026, 6, 15, 8, 0));
		const renombrada = tarea('regar', 'Plantas');

		expect(historial([renombrada], [regada], ahora)).toStrictEqual([
			{ encabezado: 'Hoy', entradas: [{ completado: regada, tarea: renombrada, hora: '08:00' }] }
		]);
	});

	it('no muestra los completados de tareas que no existen (borradas o huérfanos)', () => {
		const completados = [
			completado('c1', 'borrada', new Date(2026, 6, 15, 9, 0)),
			completado('c2', 'pagar', new Date(2026, 6, 15, 8, 0))
		];

		expect(enTexto(historial([tarea('pagar')], completados, ahora))).toBe('Hoy: pagar 08:00');
	});

	it('los encabezados dependen de ahora: el mismo día pasa de "Hoy" a "Ayer" y después a la fecha', () => {
		const completados = [completado('c1', 'regar', new Date(2026, 6, 14, 23, 59, 59))];
		const tareas = [tarea('regar')];

		expect(enTexto(historial(tareas, completados, new Date(2026, 6, 14, 23, 59, 59)))).toBe('Hoy: regar 23:59');
		expect(enTexto(historial(tareas, completados, ahora))).toBe('Ayer: regar 23:59');
		expect(enTexto(historial(tareas, completados, new Date(2026, 6, 16)))).toBe('martes 14 de julio: regar 23:59');
	});
});
