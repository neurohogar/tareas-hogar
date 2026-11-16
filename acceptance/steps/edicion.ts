// Editar y borrar tareas (spec §6.2) y conflictos entre dispositivos (§7).
// "otro dispositivo, sin ver ese cambio, ..." actúa sobre lo guardado antes
// de mi último cambio, y su cambio llega después del mío.
import { expect } from 'vitest';
import { deletion, orphanCompletions } from '../../src/lib/core/deletion';
import { completionsOfTask, complete } from '../../src/lib/core/completions';
import { taskData, type TaskData } from '../../src/lib/core/task-data';
import { applyChange } from '../../src/lib/core/task-document';
import { edit } from '../../src/lib/core/editing';
import { changeOnComplete } from '../../src/lib/core/current-step';
import type { Task } from '../../src/lib/core/task';
import { DIAS_VALIDOS, FORMA_Y_DIAS, SIN_DIAS, diasDe, formaDe } from './periodica-calendario';
import { P, TITULO, fechaHora, numero, unidad } from './valores';
import {
	OTRO,
	borrarGuardado,
	elDocumento,
	laTarea,
	laTareaTitulada,
	loQueHuboGuardado,
	loQueVioElOtro,
	nuevoId,
	recordarAntesDeMiCambio,
	tareasDe,
	type Guardado,
	type StepDefinition,
	type World
} from './world';

/** Los datos nuevos que se cargan en el panel, a partir de la tarea que se edita. */
type DatosNuevos = (tarea: Task) => TaskData;

/** Quién edita y qué tarea elige, según lo que ve. */
interface Editor {
	sujeto: string;
	/** El sujeto nombra la tarea por su título (la primera captura). */
	nombraLaTarea: boolean;
	editar: (world: World, datos: DatosNuevos, titulo?: string) => void;
}

/** `ahora`: el momento de guardar, si el paso lo da (pasar una pausada a puntual la reanuda, §5.8). */
export function editarYGuardar(world: World, tarea: Task, datos: DatosNuevos, ahora?: Date): void {
	const resultado = edit(tarea, datos(tarea), ahora);
	if (!resultado.ok) world.errors = resultado.errors;
	else world.documentos = applyChange(world.documentos, tarea.id, resultado.change);
}

const tareaElegida = (guardado: Guardado, titulo?: string) =>
	titulo === undefined ? laTarea(guardado) : laTareaTitulada(guardado, titulo);

export function editoYo(world: World, datos: DatosNuevos, titulo?: string, ahora?: Date): void {
	recordarAntesDeMiCambio(world);
	editarYGuardar(world, tareaElegida(world, titulo), datos, ahora);
}

export function editaElOtro(world: World, datos: DatosNuevos): void {
	editarYGuardar(world, laTarea(loQueVioElOtro(world)), datos);
}

/** Borra la tarea y los completados y anotaciones suyos que conoce quien borra (§6.2, §7). */
function borrar(world: World, tarea: Task, completadosConocidos: Guardado['completions']): void {
	const { taskId: tareaId, completionIds: completadoIds, annotationIds: anotacionIds } = deletion(tarea.id, completadosConocidos, world.anotaciones);
	borrarGuardado(world, [tareaId], completadoIds, anotacionIds);
}

const EDITORES: Editor[] = [
	{ sujeto: 'edito la tarea', nombraLaTarea: false, editar: editoYo },
	{ sujeto: `edito la tarea ${TITULO}`, nombraLaTarea: true, editar: editoYo },
	{ sujeto: `${OTRO} edita la tarea`, nombraLaTarea: false, editar: editaElOtro }
];

/** Cada forma de "... a <definición>": los datos que carga, con el título actual. */
const DEFINICIONES: { text: string; data: (titulo: string, ...valores: string[]) => TaskData }[] = [
	{
		text: `puntual con fecha límite ${P}`,
		data: (titulo, fechaLimite) => ({ shape: 'puntual', title: titulo, dueDate: fechaLimite })
	},
	{ text: 'puntual sin fecha límite', data: (titulo) => ({ shape: 'puntual', title: titulo }) },
	{
		text: `periódica relativa cada ${P} ${P}`,
		data: (titulo, cada, u) => ({ shape: 'relativa', title: titulo, every: numero(cada), unit: unidad(u) })
	},
	{
		text: `periódica ${FORMA_Y_DIAS}`,
		data: (titulo, formaYConector, dias) => ({ shape: 'calendario', title: titulo, ...diasDe(formaDe(formaYConector), dias) })
	},
	{ text: 'periódica (?:semanal|mensual) sin días', data: (titulo) => ({ shape: 'calendario', title: titulo, ...SIN_DIAS }) },
	{
		text: 'periódica de calendario con días de la semana y del mes a la vez',
		data: (titulo) => ({
			shape: 'calendario',
			title: titulo,
			weekdays: DIAS_VALIDOS.semanal.weekdays,
			monthDays: DIAS_VALIDOS.mensual.monthDays
		})
	}
];

/** Cambiar el tipo en el panel deja como estaban el emoji, la nota, los pasos, la versión mínima, el esfuerzo y el horario. */
function camposQueConserva(tarea: Task): Pick<TaskData, 'emoji' | 'note' | 'firstStep' | 'steps' | 'minimalVersion' | 'effort' | 'schedule'> {
	const { emoji, note: nota, firstStep: primerPaso, steps: pasos, minimalVersion: versionMinima, effort: esfuerzo, schedule: horario } = taskData(tarea);
	return { ...(emoji && { emoji }), ...(nota && { note: nota }), ...(primerPaso && { firstStep: primerPaso }), ...(pasos && { steps: pasos }), ...(versionMinima && { minimalVersion: versionMinima }), ...(esfuerzo && { effort: esfuerzo }), ...(horario && { schedule: horario }) };
}

const pasosDeEditarA: StepDefinition[] = EDITORES.flatMap((editor) =>
	DEFINICIONES.map(({ text: texto, data: datos }) => ({
		pattern: new RegExp(`^${editor.sujeto} a ${texto}$`),
		run: (world: World, ...valores: string[]) => {
			const titulo = editor.nombraLaTarea ? valores.shift() : undefined;
			editor.editar(world, (tarea) => ({ ...camposQueConserva(tarea), ...datos(tarea.title, ...valores) }), titulo);
		}
	}))
);

const conTitulo = (titulo: string) => (tarea: Task) => ({ ...taskData(tarea), title: titulo });

/**
 * La tarea tiene un solo completado, de ese momento. Si es de calendario lleva
 * además su ocurrenciaCubierta (§5.3) y, si fue la mínima, su fueMinima (§4.4), que este paso no afirma; ningún otro campo.
 */
function elUnicoCompletadoEs(world: World, tarea: Task, completada: string): void {
	const completados = completionsOfTask(world.completions, tarea.id);
	expect(completados).toHaveLength(1);
	const { coveredOccurrence: ocurrenciaCubierta, wasMinimal: fueMinima, ...resto } = completados[0];
	expect(resto).toStrictEqual({ id: expect.any(String), taskId: tarea.id, completedAt: fechaHora(completada) });
	if (ocurrenciaCubierta !== undefined) expect(ocurrenciaCubierta).toBeInstanceOf(Date);
	// Si fue la mínima (§4.4), lo afirman los pasos de la mínima; solo se escribe en true.
	if (fueMinima !== undefined) expect(fueMinima).toBe(true);
}

/** La tarea con ese título, aunque ya se haya borrado. */
const laQueTenia = (world: World, titulo: string) => laTareaTitulada(loQueHuboGuardado(world), titulo);

export const edicionSteps: StepDefinition[] = [
	...pasosDeEditarA,
	{
		pattern: new RegExp(`^edito la tarea a puntual sin fecha límite el ${P}$`),
		run: (world, momento) =>
			editoYo(world, (tarea) => ({ ...camposQueConserva(tarea), shape: 'puntual', title: tarea.title }), undefined, fechaHora(momento))
	},
	{
		pattern: new RegExp(`^edito el título a ${P}$`),
		run: (world, titulo) => editoYo(world, conTitulo(titulo))
	},
	{
		pattern: /^edito el título a uno de solo espacios$/,
		run: (world) => editoYo(world, conTitulo('   '))
	},
	{
		pattern: new RegExp(`^${OTRO} edita el título a ${P}$`),
		run: (world, titulo) => editaElOtro(world, conTitulo(titulo))
	},
	{
		pattern: new RegExp(`^edito en una misma edición el título a ${P} y la fecha límite a ${P}$`),
		run: (world, titulo, fechaLimite) => editoYo(world, () => ({ shape: 'puntual', title: titulo, dueDate: fechaLimite }))
	},
	{
		pattern: new RegExp(`^${OTRO} edita el título de la tarea ${TITULO} a ${TITULO}$`),
		run: (world, titulo, nuevo) => editarYGuardar(world, laTareaTitulada(loQueVioElOtro(world), titulo), conTitulo(nuevo))
	},
	{
		pattern: new RegExp(`^${OTRO} guarda la tarea sin cambios$`),
		run: (world) => editaElOtro(world, taskData)
	},
	{
		pattern: /^borro la tarea$/,
		run: (world) => {
			recordarAntesDeMiCambio(world);
			borrar(world, laTarea(world), world.completions);
		}
	},
	{
		pattern: new RegExp(`^borro la tarea ${TITULO}$`),
		run: (world, titulo) => {
			recordarAntesDeMiCambio(world);
			borrar(world, laTareaTitulada(world, titulo), world.completions);
		}
	},
	{
		pattern: new RegExp(`^${OTRO} borra la tarea$`),
		run: (world) => {
			const visto = loQueVioElOtro(world);
			borrar(world, laTarea(visto), visto.completions);
		}
	},
	{
		pattern: new RegExp(`^${OTRO} completa la tarea ${TITULO} el ${P}$`),
		run: (world, titulo, momento) => {
			const visto = loQueVioElOtro(world);
			const tarea = laTareaTitulada(visto, titulo);
			const completado = complete(tarea, visto.completions, nuevoId(world, 'completado'), fechaHora(momento));
			world.completions = [...world.completions, completado];
			// Completar, desde cualquier dispositivo, vuelve la tarea al paso 1 (§4.1, Pasos).
			world.documentos = applyChange(world.documentos, tarea.id, changeOnComplete(tarea));
		}
	},
	{
		pattern: /^la tarea no cambia$/,
		run: (world) => expect(world.documentos).toStrictEqual(loQueVioElOtro(world).documentos)
	},
	{
		pattern: /^la tarea es (puntual|periódica)$/,
		run: (world, tipo) => expect(laTarea(world).kind).toBe(tipo === 'puntual' ? 'puntual' : 'periodica')
	},
	{
		pattern: /^la tarea no tiene recurrencia$/,
		run: (world) => expect(elDocumento(world)).not.toHaveProperty('recurrence')
	},
	{
		pattern: new RegExp(`^la tarea tiene título ${P}$`),
		run: (world, titulo) => expect(laTarea(world).title).toBe(titulo)
	},
	{
		pattern: new RegExp(`^la tarea sigue creada el ${P}$`),
		run: (world, creada) => expect(laTarea(world).createdAt).toEqual(fechaHora(creada))
	},
	{
		pattern: /^la tarea conserva su id$/,
		run: (world) => expect(laTarea(world).id).toBe(laTarea(loQueVioElOtro(world)).id)
	},
	{
		pattern: new RegExp(`^la tarea conserva un solo completado, del ${P}$`),
		run: (world, completada) => elUnicoCompletadoEs(world, laTarea(world), completada)
	},
	{
		pattern: new RegExp(`^la tarea ${TITULO} conserva un solo completado, del ${P}$`),
		run: (world, titulo, completada) => elUnicoCompletadoEs(world, laTareaTitulada(world, titulo), completada)
	},
	{
		pattern: new RegExp(`^no existe la tarea ${TITULO}$`),
		run: (world, titulo) => {
			const id = laQueTenia(world, titulo).id;
			expect(world.documentos.map((documento) => documento.id)).not.toContain(id);
			expect(tareasDe(world).map((tarea) => tarea.title)).not.toContain(titulo);
		}
	},
	{
		pattern: new RegExp(`^no queda ningún completado de ${TITULO}$`),
		run: (world, titulo) => expect(completionsOfTask(world.completions, laQueTenia(world, titulo).id)).toEqual([])
	},
	{
		pattern: /^no queda ninguna tarea$/,
		run: (world) => expect(world.documentos).toEqual([])
	},
	{
		pattern: new RegExp(`^los completados huérfanos a limpiar son solo el de ${TITULO} del ${P}$`),
		run: (world, titulo, completada) => {
			expect(orphanCompletions(tareasDe(world), world.completions)).toEqual([
				{ id: expect.any(String), taskId: laQueTenia(world, titulo).id, completedAt: fechaHora(completada) }
			]);
		}
	}
];
