// Primer paso de la tarea (spec §4.1, §6.1, §6.2): se escribe en el panel y la fila lo muestra
// solo en pendiente y atrasada. Una sola línea, recortada; vacío es sin campo; nunca inválido.
import { expect } from 'vitest';
import { createOneOff, type OneOffData } from '../../src/lib/core/create-one-off';
import { createRecurringCalendar } from '../../src/lib/core/create-recurring-calendar';
import { taskData } from '../../src/lib/core/task-data';
import type { Task } from '../../src/lib/core/task';
import { AHORA, crearEnWorld, registrarCreacion } from './crear';
import { editaElOtro, editoYo } from './edicion';
import { diasDe, formaDe } from './periodica-calendario';
import { P, TITULO, numero } from './valores';
import { OTRO, elDocumento, laTarea, laTareaTitulada, type StepDefinition, type World } from './world';

const ESTADOS = ['pendiente', 'en espera', 'atrasada'];
const SOLO_ESPACIOS = '   ';

/** Un primer paso escrito con espacios de más al inicio y al final. */
const conMargenes = (texto: string) => `  ${texto}  `;

/** Los datos de la tarea con el primer paso escrito; el resto como estaba. */
const conPrimerPaso = (primerPaso: string) => (tarea: Task) => ({ ...taskData(tarea), firstStep: primerPaso });

/** Un guardado con primer paso es aceptado: nunca rechaza (§4.1). */
function sinRechazo(world: World): void {
	expect(world.errors).toBeUndefined();
}

function crearPuntualConPrimerPaso(world: World, datos: OneOffData): void {
	registrarCreacion(world, (id) => createOneOff(datos, id, AHORA));
	sinRechazo(world);
}

/** Deja la tarea ya guardada con ese primer paso, sin pasar por editar (no es un cambio "de mi lado"). */
function guardadaConPrimerPaso(world: World, tarea: Task, primerPaso: string): void {
	world.documentos = world.documentos.map((documento) => (documento.id === tarea.id ? { ...documento, firstStep: primerPaso } : documento));
}

/** Cada forma de cambio del primer paso: "<sujeto> el primer paso a ...". */
const CAMBIOS: { text: string; value: (...valores: string[]) => string }[] = [
	{ text: P, value: (primerPaso) => primerPaso },
	{ text: `${P} con espacios al inicio y al final`, value: (primerPaso) => conMargenes(primerPaso) },
	{ text: 'uno de solo espacios', value: () => SOLO_ESPACIOS },
	{ text: `uno de ${P} caracteres`, value: (largo) => 'x'.repeat(numero(largo)) }
];

const EDITORES = [
	{ sujeto: 'edito', editar: editoYo },
	{ sujeto: `${OTRO} edita`, editar: editaElOtro }
];

const pasosDeEditar: StepDefinition[] = EDITORES.flatMap(({ sujeto, editar }) =>
	CAMBIOS.map(({ text: texto, value: valor }) => ({
		pattern: new RegExp(`^${sujeto} el primer paso a ${texto}$`),
		run: (world: World, ...valores: string[]) => {
			editar(world, conPrimerPaso(valor(...valores)));
			sinRechazo(world);
		}
	}))
);

/** En cada momento consultado, la lista tiene una sola fila y muestra ese texto de primer paso. */
function laFilaMuestraElPrimerPaso(world: World, texto: string | undefined): void {
	expect(world.consultasDePendientes.length).toBeGreaterThan(0);
	for (const filas of world.consultasDePendientes) expect(filas.map(({ firstStepText: textoDePrimerPaso }) => textoDePrimerPaso)).toEqual([texto]);
}

export const primerPasoSteps: StepDefinition[] = [
	...pasosDeEditar,
	{
		pattern: new RegExp(`^creo una tarea puntual con título ${P} y primer paso ${P}$`),
		run: (world, titulo, primerPaso) => crearPuntualConPrimerPaso(world, { title: titulo, firstStep: primerPaso })
	},
	{
		pattern: new RegExp(`^creo una tarea periódica relativa con título ${P} cada 2 dias y primer paso ${P}$`),
		run: (world, titulo, primerPaso) => {
			crearEnWorld(world, { title: titulo, every: 2, unit: 'dias', firstStep: primerPaso });
			sinRechazo(world);
		}
	},
	{
		pattern: new RegExp(`^creo una tarea periódica (semanal|mensual) con título ${P} (los|los días) ${P} y primer paso ${P}$`),
		run: (world, forma, titulo, conector, dias, primerPaso) => {
			const datos = { title: titulo, firstStep: primerPaso, ...diasDe(formaDe(`${forma} ${conector}`), dias) };
			registrarCreacion(world, (id) => createRecurringCalendar(datos, id, AHORA));
			sinRechazo(world);
		}
	},
	{
		pattern: new RegExp(`^creo una tarea puntual con título ${P} y un primer paso de solo espacios$`),
		run: (world, titulo) => crearPuntualConPrimerPaso(world, { title: titulo, firstStep: SOLO_ESPACIOS })
	},
	{
		pattern: new RegExp(`^el primer paso de la tarea es ${P}$`),
		run: (world, primerPaso) => guardadaConPrimerPaso(world, laTarea(world), primerPaso)
	},
	{
		pattern: new RegExp(`^el primer paso de la tarea ${TITULO} es ${P}$`),
		run: (world, titulo, primerPaso) => guardadaConPrimerPaso(world, laTareaTitulada(world, titulo), primerPaso)
	},
	{
		// Quitar es vaciar el campo: la tarea queda sin primer paso.
		pattern: /^quito el primer paso$/,
		run: (world) => {
			editoYo(world, conPrimerPaso(''));
			sinRechazo(world);
		}
	},
	{
		pattern: new RegExp(`^${OTRO} quita el primer paso$`),
		run: (world) => {
			editaElOtro(world, conPrimerPaso(''));
			sinRechazo(world);
		}
	},
	{
		pattern: new RegExp(`^la tarea tiene primer paso ${P}$`),
		run: (world, primerPaso) => expect(laTarea(world).firstStep).toBe(primerPaso)
	},
	{
		pattern: /^la tarea no tiene primer paso$/,
		run: (world) => expect(elDocumento(world)).not.toHaveProperty('firstStep')
	},
	{
		pattern: new RegExp(`^la tarea tiene un primer paso de ${P} caracteres$`),
		run: (world, largo) => expect(laTarea(world).firstStep).toHaveLength(numero(largo))
	},
	{
		// El estado esperado llega como valor de la tabla; el del primer paso es el de siempre (§5).
		pattern: new RegExp(`^el estado es ${P}$`),
		run: (world, tipo) => {
			expect(ESTADOS).toContain(tipo);
			expect(world.estados.length).toBeGreaterThan(0);
			for (const estado of world.estados) expect(estado.kind).toBe(tipo);
		}
	},
	{
		pattern: new RegExp(`^la fila de la tarea muestra el primer paso ${P}$`),
		run: (world, texto) => laFilaMuestraElPrimerPaso(world, texto)
	},
	{
		pattern: /^la fila de la tarea no muestra primer paso$/,
		run: (world) => laFilaMuestraElPrimerPaso(world, undefined)
	}
];
