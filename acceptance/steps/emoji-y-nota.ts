// Emoji y nota de la tarea (spec §4.1), su edición (§6.2), el nombre de la
// tarea y los conflictos entre dispositivos (§7).
import { expect } from 'vitest';
import { crearPuntual, type DatosPuntual } from '../../src/lib/core/crear-puntual';
import { datosDeTarea, type DatosDeTarea } from '../../src/lib/core/datos-de-tarea';
import { nombreDeTarea } from '../../src/lib/core/nombre-de-tarea';
import type { Tarea } from '../../src/lib/core/tarea';
import { AHORA, ANTES_DEL_ESCENARIO, registrarCreacion } from './crear';
import { editaElOtro, editoYo } from './edicion';
import { registrarEleccion } from './emojis-recientes';
import { P, TITULO, numero } from './valores';
import { OTRO, elDocumento, laTarea, type StepDefinition, type World } from './world';

const SOLO_ESPACIOS = '   ';

/** Lo que el panel escribe en los campos que cambian; el resto queda como estaba. */
type Campos = Partial<Pick<DatosDeTarea, 'titulo' | 'emoji' | 'nota'>>;
const conCampos = (campos: Campos) => (tarea: Tarea) => ({ ...datosDeTarea(tarea), ...campos });

/** Una nota escrita con espacios y saltos de línea de más al inicio y al final. */
const conMargenes = (nota: string) => `  \n ${nota} \n  `;

const crear = (world: World, datos: DatosPuntual, ahora = ANTES_DEL_ESCENARIO) =>
	registrarCreacion(world, (id) => crearPuntual(datos, id, ahora));

/** Quién edita la nota: yo, o el otro dispositivo sin ver mi último cambio. */
const EDITORES = [
	{ sujeto: 'edito', editar: editoYo },
	{ sujeto: `${OTRO} edita`, editar: editaElOtro }
];

/** Elegir un emoji en el selector: se asigna a la tarea que se edita, si hay una, y pasa a los recientes. */
function elijo(world: World, emoji: string, campos: Campos = {}): void {
	registrarEleccion(world, emoji);
	if (world.documentos.length > 0) editoYo(world, conCampos({ emoji, ...campos }));
}

/** Cada forma de cambio de la nota: "<sujeto> la nota a ...". */
const CAMBIOS: { texto: string; campos: (...valores: string[]) => Campos }[] = [
	{ texto: `la nota a ${P}`, campos: (nota) => ({ nota }) },
	{ texto: `la nota a ${P} con espacios al inicio y al final`, campos: (nota) => ({ nota: conMargenes(nota) }) },
	{ texto: `la nota a ${P} y ${P} en líneas separadas`, campos: (primera, segunda) => ({ nota: `${primera}\n${segunda}` }) },
	{ texto: 'la nota a una de solo espacios', campos: () => ({ nota: SOLO_ESPACIOS }) },
	{ texto: `la nota a una de ${P} caracteres`, campos: (largo) => ({ nota: 'x'.repeat(numero(largo)) }) }
];

const pasosDeEditar: StepDefinition[] = EDITORES.flatMap(({ sujeto, editar }) =>
	CAMBIOS.map(({ texto, campos }) => ({
		pattern: new RegExp(`^${sujeto} ${texto}$`),
		run: (world: World, ...valores: string[]) => editar(world, conCampos(campos(...valores)))
	}))
);

export const emojiYNotaSteps: StepDefinition[] = [
	...pasosDeEditar,
	{
		pattern: new RegExp(`^elijo el emoji ${P}$`),
		run: (world, emoji) => elijo(world, emoji)
	},
	{
		pattern: new RegExp(`^elijo el emoji ${P} y edito la nota a ${P}$`),
		run: (world, emoji, nota) => elijo(world, emoji, { nota })
	},
	{
		pattern: new RegExp(`^${OTRO} elige el emoji ${P}$`),
		run: (world, emoji) => editaElOtro(world, conCampos({ emoji }))
	},
	{
		// Quitar es dejar la tarea sin emoji; no pasa por los recientes.
		pattern: /^quito el emoji$/,
		run: (world) => editoYo(world, conCampos({ emoji: '' }))
	},
	{
		pattern: new RegExp(`^una tarea puntual sin fecha límite con emoji ${P}$`),
		run: (world, emoji) => crear(world, { titulo: 'Tarea', emoji }, AHORA)
	},
	{
		pattern: new RegExp(`^una tarea puntual ${TITULO} sin fecha límite con emoji ${P}$`),
		run: (world, titulo, emoji) => crear(world, { titulo, emoji })
	},
	{
		pattern: new RegExp(`^una tarea puntual sin fecha límite con nota ${P}$`),
		run: (world, nota) => crear(world, { titulo: 'Tarea', nota }, AHORA)
	},
	{
		pattern: new RegExp(`^creo una tarea puntual con título ${P}, emoji ${P} y nota ${P}$`),
		run: (world, titulo, emoji, nota) => crear(world, { titulo, emoji, nota }, AHORA)
	},
	{
		pattern: new RegExp(`^la tarea tiene emoji ${P}$`),
		run: (world, emoji) => expect(laTarea(world).emoji).toBe(emoji)
	},
	{
		pattern: /^la tarea no tiene emoji$/,
		run: (world) => expect(elDocumento(world)).not.toHaveProperty('emoji')
	},
	{
		pattern: new RegExp(`^la tarea tiene nota ${P}$`),
		run: (world, nota) => expect(laTarea(world).nota).toBe(nota)
	},
	{
		pattern: new RegExp(`^la nota de la tarea tiene dos líneas: ${P} y ${P}$`),
		run: (world, primera, segunda) => expect(laTarea(world).nota?.split('\n')).toEqual([primera, segunda])
	},
	{
		pattern: /^la tarea no tiene nota$/,
		run: (world) => expect(elDocumento(world)).not.toHaveProperty('nota')
	},
	{
		pattern: new RegExp(`^la tarea tiene una nota de ${P} caracteres$`),
		run: (world, largo) => expect(laTarea(world).nota).toHaveLength(numero(largo))
	},
	{
		pattern: new RegExp(`^el nombre de la tarea es ${P}$`),
		run: (world, nombre) => expect(nombreDeTarea(laTarea(world))).toBe(nombre)
	}
];
