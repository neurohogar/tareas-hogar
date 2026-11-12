import { describe, expect, it } from 'vitest';
import type { Anotacion, PantallaDeAnotacion, Sentido } from './anotacion';
import { anotacionesEnPantalla, type GrupoDeAnotaciones } from './anotaciones';
import type { Tarea } from './tarea';

const tarea = (id: string, emoji?: string): Tarea => ({ id, titulo: id, tipo: 'puntual', creadaEn: new Date(2026, 0, 1), ...(emoji ? { emoji } : {}) });

function anotacion(id: string, anotadaEn: Date, extra: Partial<Anotacion> = {}): Anotacion {
	const sentido: Sentido = 'Me sirvió';
	const pantalla: PantallaDeAnotacion = 'Pendientes';
	return { id, sentido, anotadaEn, pantalla, ...extra };
}

const ahora = new Date(2026, 6, 15, 12, 0, 0);

/** "Hoy: a2 09:10 Regar, a1 08:05; Ayer: ..." */
function enTexto(grupos: GrupoDeAnotaciones[]): string {
	return grupos
		.map(({ encabezado, entradas }) => `${encabezado}: ${entradas.map(({ anotacion, hora, nombreDeTarea }) => [anotacion.id, hora, nombreDeTarea].filter(Boolean).join(' ')).join(', ')}`)
		.join('; ');
}

describe('anotacionesEnPantalla (spec §6.7)', () => {
	it('sin anotaciones no tiene grupos', () => {
		expect(anotacionesEnPantalla([tarea('regar')], [], ahora)).toEqual([]);
	});

	it('va de la más reciente a la más antigua y agrupa por día local, aunque se hayan anotado en otro orden', () => {
		const anotaciones = [
			anotacion('a1', new Date(2026, 6, 15, 8, 5)),
			anotacion('a2', new Date(2026, 6, 15, 9, 10)),
			anotacion('a3', new Date(2026, 6, 14, 21, 30)),
			anotacion('a4', new Date(2026, 6, 13, 7, 0))
		];

		expect(enTexto(anotacionesEnPantalla([], anotaciones, ahora))).toBe('Hoy: a2 09:10, a1 08:05; Ayer: a3 21:30; lunes 13 de julio: a4 07:00');
	});

	it('si dos tienen el mismo instante va primero la de id menor', () => {
		const momento = new Date(2026, 6, 15, 10, 0);

		expect(enTexto(anotacionesEnPantalla([], [anotacion('a2', momento), anotacion('a1', momento)], ahora))).toBe('Hoy: a1 10:00, a2 10:00');
		expect(enTexto(anotacionesEnPantalla([], [anotacion('a1', momento), anotacion('a2', momento)], ahora))).toBe('Hoy: a1 10:00, a2 10:00');
	});

	it('muestra el nombre actual de la tarea, con su emoji si lo tiene', () => {
		const anotaciones = [anotacion('a1', new Date(2026, 6, 15, 8, 0), { tareaId: 'regar' }), anotacion('a2', new Date(2026, 6, 15, 9, 0), { tareaId: 'pagar' })];

		expect(enTexto(anotacionesEnPantalla([tarea('regar', '🌱'), tarea('pagar')], anotaciones, ahora))).toBe('Hoy: a2 09:00 pagar, a1 08:00 🌱 regar');
	});

	it('no muestra las anotaciones de una tarea que ya no existe, y sí las sin tarea', () => {
		const anotaciones = [anotacion('a1', new Date(2026, 6, 15, 8, 0), { tareaId: 'borrada' }), anotacion('a2', new Date(2026, 6, 15, 9, 0))];

		expect(enTexto(anotacionesEnPantalla([tarea('regar')], anotaciones, ahora))).toBe('Hoy: a2 09:00');
	});
});
