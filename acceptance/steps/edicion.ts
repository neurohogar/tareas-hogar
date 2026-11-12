// Editar y borrar tareas (spec §6.2) y conflictos entre dispositivos (§7).
// "otro dispositivo, sin ver ese cambio, ..." actúa sobre lo guardado antes
// de mi último cambio, y su cambio llega después del mío.
import { expect } from 'vitest';
import { borrado, completadosHuerfanos } from '../../src/lib/core/borrado';
import { completadosDeTarea, completar } from '../../src/lib/core/completados';
import { datosDeTarea, type DatosDeTarea } from '../../src/lib/core/datos-de-tarea';
import { aplicarCambio } from '../../src/lib/core/documento-de-tarea';
import { editar } from '../../src/lib/core/edicion';
import type { Tarea } from '../../src/lib/core/tarea';
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
type DatosNuevos = (tarea: Tarea) => DatosDeTarea;

/** Quién edita y qué tarea elige, según lo que ve. */
interface Editor {
	sujeto: string;
	/** El sujeto nombra la tarea por su título (la primera captura). */
	nombraLaTarea: boolean;
	editar: (world: World, datos: DatosNuevos, titulo?: string) => void;
}

/** `ahora`: el momento de guardar, si el paso lo da (pasar una pausada a puntual la reanuda, §5.8). */
export function editarYGuardar(world: World, tarea: Tarea, datos: DatosNuevos, ahora?: Date): void {
	const resultado = editar(tarea, datos(tarea), ahora);
	if (!resultado.ok) world.errores = resultado.errores;
	else world.documentos = aplicarCambio(world.documentos, tarea.id, resultado.cambio);
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

/** Borra la tarea y los completados suyos que conoce quien borra. */
function borrar(world: World, tarea: Tarea, completadosConocidos: Guardado['completados']): void {
	const { tareaId, completadoIds } = borrado(tarea.id, completadosConocidos);
	borrarGuardado(world, [tareaId], completadoIds);
}

const EDITORES: Editor[] = [
	{ sujeto: 'edito la tarea', nombraLaTarea: false, editar: editoYo },
	{ sujeto: `edito la tarea ${TITULO}`, nombraLaTarea: true, editar: editoYo },
	{ sujeto: `${OTRO} edita la tarea`, nombraLaTarea: false, editar: editaElOtro }
];

/** Cada forma de "... a <definición>": los datos que carga, con el título actual. */
const DEFINICIONES: { texto: string; datos: (titulo: string, ...valores: string[]) => DatosDeTarea }[] = [
	{
		texto: `puntual con fecha límite ${P}`,
		datos: (titulo, fechaLimite) => ({ forma: 'puntual', titulo, fechaLimite })
	},
	{ texto: 'puntual sin fecha límite', datos: (titulo) => ({ forma: 'puntual', titulo }) },
	{
		texto: `periódica relativa cada ${P} ${P}`,
		datos: (titulo, cada, u) => ({ forma: 'relativa', titulo, cada: numero(cada), unidad: unidad(u) })
	},
	{
		texto: `periódica ${FORMA_Y_DIAS}`,
		datos: (titulo, formaYConector, dias) => ({ forma: 'calendario', titulo, ...diasDe(formaDe(formaYConector), dias) })
	},
	{ texto: 'periódica (?:semanal|mensual) sin días', datos: (titulo) => ({ forma: 'calendario', titulo, ...SIN_DIAS }) },
	{
		texto: 'periódica de calendario con días de la semana y del mes a la vez',
		datos: (titulo) => ({
			forma: 'calendario',
			titulo,
			diasSemana: DIAS_VALIDOS.semanal.diasSemana,
			diasMes: DIAS_VALIDOS.mensual.diasMes
		})
	}
];

/** Cambiar el tipo en el panel deja como estaban el emoji, la nota, el esfuerzo y el horario. */
function camposQueConserva(tarea: Tarea): Pick<DatosDeTarea, 'emoji' | 'nota' | 'esfuerzo' | 'horario'> {
	const { emoji, nota, esfuerzo, horario } = datosDeTarea(tarea);
	return { ...(emoji && { emoji }), ...(nota && { nota }), ...(esfuerzo && { esfuerzo }), ...(horario && { horario }) };
}

const pasosDeEditarA: StepDefinition[] = EDITORES.flatMap((editor) =>
	DEFINICIONES.map(({ texto, datos }) => ({
		pattern: new RegExp(`^${editor.sujeto} a ${texto}$`),
		run: (world: World, ...valores: string[]) => {
			const titulo = editor.nombraLaTarea ? valores.shift() : undefined;
			editor.editar(world, (tarea) => ({ ...camposQueConserva(tarea), ...datos(tarea.titulo, ...valores) }), titulo);
		}
	}))
);

const conTitulo = (titulo: string) => (tarea: Tarea) => ({ ...datosDeTarea(tarea), titulo });

/**
 * La tarea tiene un solo completado, de ese momento. Si es de calendario lleva
 * además su ocurrenciaCubierta (§5.3), que este paso no afirma; ningún otro campo.
 */
function elUnicoCompletadoEs(world: World, tarea: Tarea, completada: string): void {
	const completados = completadosDeTarea(world.completados, tarea.id);
	expect(completados).toHaveLength(1);
	const { ocurrenciaCubierta, ...resto } = completados[0];
	expect(resto).toStrictEqual({ id: expect.any(String), tareaId: tarea.id, completadoEn: fechaHora(completada) });
	if (ocurrenciaCubierta !== undefined) expect(ocurrenciaCubierta).toBeInstanceOf(Date);
}

/** La tarea con ese título, aunque ya se haya borrado. */
const laQueTenia = (world: World, titulo: string) => laTareaTitulada(loQueHuboGuardado(world), titulo);

export const edicionSteps: StepDefinition[] = [
	...pasosDeEditarA,
	{
		pattern: new RegExp(`^edito la tarea a puntual sin fecha límite el ${P}$`),
		run: (world, momento) =>
			editoYo(world, (tarea) => ({ ...camposQueConserva(tarea), forma: 'puntual', titulo: tarea.titulo }), undefined, fechaHora(momento))
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
		run: (world, titulo, fechaLimite) => editoYo(world, () => ({ forma: 'puntual', titulo, fechaLimite }))
	},
	{
		pattern: new RegExp(`^${OTRO} edita el título de la tarea ${TITULO} a ${TITULO}$`),
		run: (world, titulo, nuevo) => editarYGuardar(world, laTareaTitulada(loQueVioElOtro(world), titulo), conTitulo(nuevo))
	},
	{
		pattern: new RegExp(`^${OTRO} guarda la tarea sin cambios$`),
		run: (world) => editaElOtro(world, datosDeTarea)
	},
	{
		pattern: /^borro la tarea$/,
		run: (world) => {
			recordarAntesDeMiCambio(world);
			borrar(world, laTarea(world), world.completados);
		}
	},
	{
		pattern: new RegExp(`^borro la tarea ${TITULO}$`),
		run: (world, titulo) => {
			recordarAntesDeMiCambio(world);
			borrar(world, laTareaTitulada(world, titulo), world.completados);
		}
	},
	{
		pattern: new RegExp(`^${OTRO} borra la tarea$`),
		run: (world) => {
			const visto = loQueVioElOtro(world);
			borrar(world, laTarea(visto), visto.completados);
		}
	},
	{
		pattern: new RegExp(`^${OTRO} completa la tarea ${TITULO} el ${P}$`),
		run: (world, titulo, momento) => {
			const visto = loQueVioElOtro(world);
			const tarea = laTareaTitulada(visto, titulo);
			const completado = completar(tarea, visto.completados, nuevoId(world, 'completado'), fechaHora(momento));
			world.completados = [...world.completados, completado];
		}
	},
	{
		pattern: /^la tarea no cambia$/,
		run: (world) => expect(world.documentos).toStrictEqual(loQueVioElOtro(world).documentos)
	},
	{
		pattern: /^la tarea es (puntual|periódica)$/,
		run: (world, tipo) => expect(laTarea(world).tipo).toBe(tipo === 'puntual' ? 'puntual' : 'periodica')
	},
	{
		pattern: /^la tarea no tiene recurrencia$/,
		run: (world) => expect(elDocumento(world)).not.toHaveProperty('recurrencia')
	},
	{
		pattern: new RegExp(`^la tarea tiene título ${P}$`),
		run: (world, titulo) => expect(laTarea(world).titulo).toBe(titulo)
	},
	{
		pattern: new RegExp(`^la tarea sigue creada el ${P}$`),
		run: (world, creada) => expect(laTarea(world).creadaEn).toEqual(fechaHora(creada))
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
			expect(tareasDe(world).map((tarea) => tarea.titulo)).not.toContain(titulo);
		}
	},
	{
		pattern: new RegExp(`^no queda ningún completado de ${TITULO}$`),
		run: (world, titulo) => expect(completadosDeTarea(world.completados, laQueTenia(world, titulo).id)).toEqual([])
	},
	{
		pattern: /^no queda ninguna tarea$/,
		run: (world) => expect(world.documentos).toEqual([])
	},
	{
		pattern: new RegExp(`^los completados huérfanos a limpiar son solo el de ${TITULO} del ${P}$`),
		run: (world, titulo, completada) => {
			expect(completadosHuerfanos(tareasDe(world), world.completados)).toEqual([
				{ id: expect.any(String), tareaId: laQueTenia(world, titulo).id, completadoEn: fechaHora(completada) }
			]);
		}
	}
];
