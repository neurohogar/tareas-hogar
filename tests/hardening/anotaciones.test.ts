import { expect, it } from 'vitest';
import type { Anotacion } from '../../src/lib/core/anotacion';
import { anotacionesEnPantalla } from '../../src/lib/core/anotaciones';

const anotacion = (id: string, anotadaEn: Date): Anotacion => ({ id, sentido: 'Me sirvió', anotadaEn, pantalla: 'Pendientes' });

it('agrupa junto a la última anotación del grupo, no del primero, cuando hay un día antes', () => {
	const ahora = new Date(2026, 6, 15, 12, 0);
	const grupos = anotacionesEnPantalla([], [anotacion('a1', new Date(2026, 6, 15, 9, 0)), anotacion('a2', new Date(2026, 6, 14, 9, 0)), anotacion('a3', new Date(2026, 6, 14, 8, 0))], ahora);

	expect(grupos.map((g) => [g.encabezado, g.entradas.map((e) => e.anotacion.id)])).toEqual([
		['Hoy', ['a1']],
		['Ayer', ['a2', 'a3']]
	]);
});
