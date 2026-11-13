// Deshacer un completado (spec §5.4): desde el Historial, desde el aviso y
// desde otro dispositivo.
import { expect } from 'vitest';
import { avisoVisible, completadoADeshacer } from '../../src/lib/core/aviso';
import type { Completado } from '../../src/lib/core/tarea';
import { P, TITULO, fechaHora } from './valores';
import {
	OTRO,
	borrarGuardado,
	laTareaTitulada,
	loQueHuboGuardado,
	recordarAntesDeMiCambio,
	type StepDefinition,
	type World
} from './world';

/** El completado con ese completadoEn, aunque ya se haya borrado. */
function elCompletadoDel(world: World, momento: string): Completado {
	const instante = fechaHora(momento).getTime();
	const delMomento = loQueHuboGuardado(world).completados.filter(({ completadoEn }) => completadoEn.getTime() === instante);
	if (delMomento.length !== 1) throw new Error(`Se esperaba un completado del ${momento}, hay ${delMomento.length}`);
	return delMomento[0];
}

/** Como deleteDoc: borrar un completado que ya no existe no hace nada. */
function borrarCompletado(world: World, completado: Completado | undefined): void {
	if (completado) borrarGuardado(world, [], [completado.id]);
}

function elAvisoConsultado(world: World) {
	if (!world.avisoConsultado) throw new Error('No se consultó el aviso');
	return world.avisoConsultado.aviso;
}

export const deshacerSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^borro el completado del ${P}$`),
		run: (world, momento) => {
			recordarAntesDeMiCambio(world);
			borrarCompletado(world, elCompletadoDel(world, momento));
		}
	},
	{
		pattern: new RegExp(`^${OTRO} borra el completado del ${P}$`),
		run: (world, momento) => borrarCompletado(world, elCompletadoDel(world, momento))
	},
	{
		pattern: new RegExp(`^toco Deshacer en el aviso el ${P}$`),
		run: (world, momento) => {
			recordarAntesDeMiCambio(world);
			borrarCompletado(world, completadoADeshacer(world.aviso, fechaHora(momento)));
			world.aviso = undefined;
		}
	},
	{
		pattern: new RegExp(`^consulto el aviso el ${P}$`),
		run: (world, ahora) => {
			const momento = fechaHora(ahora);
			world.avisoConsultado = { aviso: avisoVisible(world.aviso, momento), ahora: momento };
		}
	},
	{
		pattern: new RegExp(`^el aviso ofrece deshacer el completado de ${TITULO} del ${P}$`),
		run: (world, titulo, momento) => {
			const tarea = laTareaTitulada(world, titulo);
			const aviso = elAvisoConsultado(world);
			expect(aviso?.nombre).toBe(titulo);
			expect(aviso?.completado).toStrictEqual({ id: expect.any(String), tareaId: tarea.id, completadoEn: fechaHora(momento) });
			expect(world.completados).toContainEqual(aviso?.completado);
		}
	},
	{
		pattern: /^no hay aviso$/,
		run: (world) => expect(elAvisoConsultado(world)).toBeUndefined()
	}
];
