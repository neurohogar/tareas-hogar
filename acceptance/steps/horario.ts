// Horario de la tarea (spec §4.1, §6.1, §6.2) y sus conflictos entre dispositivos (§7).
// "la tarea se puede completar de D a H [y de D2 a H2]" es un horario ya guardado.
import { expect } from 'vitest';
import { crearSegunDatos, datosDeTarea, type DatosDeTarea } from '../../src/lib/core/datos-de-tarea';
import { textoDelHorario, type HorarioEscrito } from '../../src/lib/core/horario';
import type { Tarea } from '../../src/lib/core/tarea';
import { AHORA, TITULO_VALIDO, registrarCreacion } from './crear';
import { editaElOtro, editarYGuardar, editoYo } from './edicion';
import { diasDe } from './periodica-calendario';
import { P, TITULO, numero, unidad } from './valores';
import { OTRO, laTarea, laTareaTitulada, type StepDefinition, type World } from './world';

/** Una o dos ventanas: "de D a H" o "de D a H y de D2 a H2". */
const HORARIO = `de ${P} a ${P}(?: y de ${P} a ${P})?`;

/** Las ventanas del paso; la segunda, si el paso la nombra. */
function horarioDe(desde: string, hasta: string, desde2?: string, hasta2?: string): HorarioEscrito {
	return desde2 === undefined ? [{ desde, hasta }] : [{ desde, hasta }, { desde: desde2, hasta: hasta2 }];
}

/** Lo que carga el panel: los valores de la tarea con otro horario, o sin horario. */
function conHorario(horario: HorarioEscrito | undefined, campos: Partial<DatosDeTarea> = {}) {
	return (tarea: Tarea): DatosDeTarea => {
		const { horario: _, ...sinHorario } = datosDeTarea(tarea);
		return { ...sinHorario, ...campos, ...(horario && { horario }) } as DatosDeTarea;
	};
}

const crear = (world: World, datos: DatosDeTarea) => registrarCreacion(world, (id) => crearSegunDatos(datos, id, AHORA));

/** Quién cambia el horario: yo, o el otro dispositivo sin ver mi último cambio. */
const EDITORES = [
	{ pone: 'pongo', quita: 'quito', editar: editoYo },
	{ pone: `${OTRO} pone`, quita: `${OTRO} quita`, editar: editaElOtro }
];

const pasosDeEditar: StepDefinition[] = EDITORES.flatMap(({ pone, quita, editar }) => [
	{
		pattern: new RegExp(`^${pone} el horario ${HORARIO}$`),
		run: (world: World, desde: string, hasta: string, desde2?: string, hasta2?: string) =>
			editar(world, conHorario(horarioDe(desde, hasta, desde2, hasta2)))
	},
	{
		pattern: new RegExp(`^${quita} el horario$`),
		run: (world: World) => editar(world, conHorario(undefined))
	}
]);

/** Un horario ya guardado: no es un cambio de este dispositivo. */
function guardarHorario(world: World, tarea: Tarea, horario: HorarioEscrito): void {
	editarYGuardar(world, tarea, conHorario(horario));
	expect(world.errores, 'el horario ya guardado debe ser válido').toBeUndefined();
}

export const horarioSteps: StepDefinition[] = [
	...pasosDeEditar,
	{
		pattern: new RegExp(`^la tarea se puede completar ${HORARIO}$`),
		run: (world, desde, hasta, desde2, hasta2) => guardarHorario(world, laTarea(world), horarioDe(desde, hasta, desde2, hasta2))
	},
	{
		pattern: new RegExp(`^la tarea ${TITULO} se puede completar ${HORARIO}$`),
		run: (world, titulo, desde, hasta, desde2, hasta2) =>
			guardarHorario(world, laTareaTitulada(world, titulo), horarioDe(desde, hasta, desde2, hasta2))
	},
	{
		// El documento tal como lo dejaba la versión con una sola ventana: el horario es un objeto.
		pattern: new RegExp(`^una tarea puntual sin fecha límite guardada en el formato anterior con horario de ${P} a ${P}$`),
		run: (world, desde, hasta) => {
			crear(world, { forma: 'puntual', titulo: 'Tarea' });
			world.documentos = world.documentos.map((documento) => ({ ...documento, horario: { desde, hasta } }));
		}
	},
	{
		pattern: new RegExp(`^creo una tarea puntual con título ${P} y horario ${HORARIO}$`),
		run: (world, titulo, desde, hasta, desde2, hasta2) =>
			crear(world, { forma: 'puntual', titulo, horario: horarioDe(desde, hasta, desde2, hasta2) })
	},
	{
		pattern: new RegExp(`^creo una tarea puntual con un título válido y horario ${HORARIO}$`),
		run: (world, desde, hasta, desde2, hasta2) =>
			crear(world, { forma: 'puntual', titulo: TITULO_VALIDO, horario: horarioDe(desde, hasta, desde2, hasta2) })
	},
	{
		pattern: new RegExp(`^creo una tarea puntual con un título válido y un horario con solo la hora de inicio ${P}$`),
		run: (world, desde) => crear(world, { forma: 'puntual', titulo: TITULO_VALIDO, horario: [{ desde }] })
	},
	{
		pattern: new RegExp(`^creo una tarea puntual con un título válido y un horario con solo la hora de fin ${P}$`),
		run: (world, hasta) => crear(world, { forma: 'puntual', titulo: TITULO_VALIDO, horario: [{ hasta }] })
	},
	{
		pattern: new RegExp(`^creo una tarea puntual con un título válido, horario de ${P} a ${P} y otro horario con solo la hora de inicio ${P}$`),
		run: (world, desde, hasta, desde2) =>
			crear(world, { forma: 'puntual', titulo: TITULO_VALIDO, horario: [{ desde, hasta }, { desde: desde2 }] })
	},
	{
		pattern: new RegExp(`^creo una tarea periódica relativa con título ${P} cada ${P} ${P} y horario ${HORARIO}$`),
		run: (world, titulo, cada, u, desde, hasta, desde2, hasta2) =>
			crear(world, { forma: 'relativa', titulo, cada: numero(cada), unidad: unidad(u), horario: horarioDe(desde, hasta, desde2, hasta2) })
	},
	{
		pattern: new RegExp(`^creo una tarea periódica semanal con título ${P} los ${P} y horario ${HORARIO}$`),
		run: (world, titulo, dias, desde, hasta, desde2, hasta2) =>
			crear(world, { forma: 'calendario', titulo, ...diasDe('semanal', dias), horario: horarioDe(desde, hasta, desde2, hasta2) })
	},
	{
		pattern: new RegExp(`^pongo un horario con solo la hora de inicio ${P}$`),
		run: (world, desde) => editoYo(world, conHorario([{ desde }]))
	},
	{
		pattern: new RegExp(`^edito en una misma edición el título a ${P} y el horario ${HORARIO}$`),
		run: (world, titulo, desde, hasta, desde2, hasta2) => editoYo(world, conHorario(horarioDe(desde, hasta, desde2, hasta2), { titulo }))
	},
	{
		pattern: new RegExp(`^la tarea tiene horario ${HORARIO}$`),
		run: (world, desde, hasta, desde2, hasta2) => expect(laTarea(world).horario).toStrictEqual(horarioDe(desde, hasta, desde2, hasta2))
	},
	{
		pattern: /^la tarea no tiene horario$/,
		run: (world) => expect(laTarea(world)).not.toHaveProperty('horario')
	},
	{
		pattern: new RegExp(`^la fila de la tarea muestra el horario ${P}$`),
		run: (world, texto) => expect(textoDelHorario(laTarea(world).horario ?? [])).toBe(texto)
	},
	{
		pattern: /^la (?:creación|edición) se rechaza porque la hora de fin no es posterior a la de inicio$/,
		run: (world) => expect(world.errores).toEqual({ horario: 'finNoPosterior' })
	}
];
