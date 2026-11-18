// Deshacer un completado (spec §5.4): desde el Historial, desde el aviso y
// desde otro dispositivo.
import { expect } from 'vitest';
import { visibleNotice, completionToUndo } from '../../src/lib/core/notice';
import { applyChange } from '../../src/lib/core/task-document';
import { changeOnDeleteCompletion } from '../../src/lib/core/current-step';
import type { Completion } from '../../src/lib/core/task';
import { P, TITULO, fechaHora } from './values';
import {
	OTRO,
	borrarGuardado,
	laTareaTitulada,
	loQueHuboGuardado,
	recordarAntesDeMiCambio,
	tareasDe,
	type StepDefinition,
	type World
} from './world';

/** El completado con ese completadoEn, aunque ya se haya borrado. */
function elCompletadoDel(world: World, momento: string): Completion {
	const instante = fechaHora(momento).getTime();
	const delMomento = loQueHuboGuardado(world).completions.filter(({ completedAt: completadoEn }) => completadoEn.getTime() === instante);
	if (delMomento.length !== 1) throw new Error(`Se esperaba un completado del ${momento}, hay ${delMomento.length}`);
	return delMomento[0];
}

/**
 * Como deleteDoc: borrar un completado que ya no existe no hace nada. Si era el más reciente de una
 * tarea de dos pasos o más, la tarea vuelve al paso en que iba al completarla (§4.1, Pasos: Deshacer).
 */
export function borrarCompletado(world: World, completado: Completion | undefined): void {
	if (!completado) return;
	const tarea = tareasDe(world).find(({ id }) => id === completado.taskId);
	if (tarea) world.documentos = applyChange(world.documentos, tarea.id, changeOnDeleteCompletion(tarea, world.completions, completado));
	borrarGuardado(world, [], [completado.id]);
}

function elAvisoConsultado(world: World) {
	if (!world.avisoConsultado) throw new Error('No se consultó el aviso');
	return world.avisoConsultado.notice;
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
			borrarCompletado(world, completionToUndo(world.notice, fechaHora(momento)));
			world.notice = undefined;
		}
	},
	{
		pattern: new RegExp(`^consulto el aviso el ${P}$`),
		run: (world, ahora) => {
			const momento = fechaHora(ahora);
			world.avisoConsultado = { notice: visibleNotice(world.notice, momento), now: momento };
		}
	},
	{
		pattern: new RegExp(`^el aviso ofrece deshacer el completado de ${TITULO} del ${P}$`),
		run: (world, titulo, momento) => {
			const tarea = laTareaTitulada(world, titulo);
			const aviso = elAvisoConsultado(world);
			expect(aviso?.name).toBe(titulo);
			// El paso en que iba la tarea (§4.4) lo afirman los pasos de los pasos; acá, ningún otro campo.
			const { stepAtCompletion: pasoAlCompletar, wasMinimal: fueMinima, ...resto } = aviso?.completion ?? {};
			expect(resto).toStrictEqual({ id: expect.any(String), taskId: tarea.id, completedAt: fechaHora(momento) });
			if (pasoAlCompletar !== undefined) expect(pasoAlCompletar).toBeGreaterThanOrEqual(1);
			// Que fue la mínima (§4.4) lo afirman los pasos de la mínima; solo se escribe en true.
			if (fueMinima !== undefined) expect(fueMinima).toBe(true);
			expect(world.completions).toContainEqual(aviso?.completion);
		}
	},
	{
		pattern: /^no hay aviso$/,
		run: (world) => expect(elAvisoConsultado(world)).toBeUndefined()
	}
];
