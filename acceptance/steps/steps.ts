// Pasos de la tarea (spec §4.1 Pasos, §4.4, §6.1, §6.2, §7): el primer paso es el paso 1 y `pasos` guarda los
// demás; `pasoActual` es el paso en que va la tarea. Nunca inválidos; «Hecho» y «Paso anterior» mueven el avance.
import { expect } from 'vitest';
import { latestCompletion, completionsOfTask, complete } from '../../src/lib/core/completions';
import { createOneOff, type OneOffData } from '../../src/lib/core/create-one-off';
import { createRecurringCalendar } from '../../src/lib/core/create-recurring-calendar';
import { taskData } from '../../src/lib/core/task-data';
import { applyChange, type TaskChange } from '../../src/lib/core/task-document';
import { doneAction, changeOnComplete, previousStepChange, type StepButtons } from '../../src/lib/core/current-step';
import { stepItIsOn, taskSteps } from '../../src/lib/core/steps';
import type { Task } from '../../src/lib/core/task';
import { AHORA, crearEnWorld, registrarCreacion } from './create';
import { editaElOtro, editoYo } from './editing';
import { diasDe, formaDe } from './recurring-calendar';
import { completoYo, registrarCompletado } from './recurring-relative';
import { P, TITULO, fechaHora, lista, numero } from './values';
import { OTRO, elDocumento, laTarea, laTareaTitulada, loQueVioElOtro, nuevoId, recordarAntesDeMiCambio, type StepDefinition, type World } from './world';

/** Un número de paso: escrito en el paso o como `<placeholder>`. */
const N = '(\\d+|<[A-Za-z0-9_]+>)';

const SOLO_ESPACIOS = '   ';

/** Un número de paso es un entero desde 1 (§4.1): un valor malformado falla el escenario. */
function numeroDePaso(valor: string): number {
	if (!/^[1-9]\d*$/.test(valor)) throw new Error(`Paso inválido: "${valor}"`);
	return Number(valor);
}

/** Un guardado con pasos es aceptado: nunca rechaza (§4.1). */
function sinRechazo(world: World): void {
	expect(world.errors).toBeUndefined();
}

/** La lista completa ("A, B, C") como el primer paso y los pasos más. */
function datosDeLista(texto: string, extra: string[] = []) {
	const [primerPaso, ...pasos] = lista(texto);
	return { firstStep: primerPaso, steps: [...pasos, ...extra] };
}

function crearPuntualConPasos(world: World, datos: OneOffData): void {
	registrarCreacion(world, (id) => createOneOff(datos, id, AHORA));
	sinRechazo(world);
}

/** Deja la tarea ya guardada con esos pasos, sin pasar por editar (no es un cambio "de mi lado"). */
function guardadaConPasos(world: World, tarea: Task, texto: string): void {
	const { firstStep: primerPaso, steps: pasos } = datosDeLista(texto);
	world.documentos = world.documentos.map((documento) => {
		if (documento.id !== tarea.id) return documento;
		const { steps: _anteriores, ...resto } = documento;
		return { ...resto, firstStep: primerPaso, ...(pasos.length > 0 && { steps: pasos }) };
	});
}

/** Deja la tarea ya guardada en ese paso; el paso 1 es el que no tiene campo (§4.1). */
function guardadaEnElPaso(world: World, tarea: Task, paso: number): void {
	world.documentos = world.documentos.map((documento) => {
		if (documento.id !== tarea.id) return documento;
		const { currentStep: _anterior, ...resto } = documento;
		return paso === 1 ? resto : { ...resto, currentStep: paso };
	});
}

/** La lista de pasos de la tarea con el paso `numero` cambiado; uno más que la cantidad lo agrega al final. */
function conElPaso(tarea: Task, numero: number, texto: string): string[] {
	const pasos = taskSteps(tarea);
	if (numero < 1 || numero > pasos.length + 1) throw new Error(`No hay un paso ${numero}`);
	return numero === pasos.length + 1 ? [...pasos, texto] : pasos.map((paso, lugar) => (lugar === numero - 1 ? texto : paso));
}

/** Los datos de la tarea con esa lista de pasos escrita; el resto como estaba. */
const conLosPasos = (pasos: readonly string[]) => (tarea: Task) => {
	const [primerPaso = '', ...mas] = pasos;
	return { ...taskData(tarea), firstStep: primerPaso, steps: mas };
};

/** Cada forma de cambio de un paso: "<sujeto> el paso N a ...". */
const CAMBIOS: { text: string; value: (...valores: string[]) => string }[] = [
	{ text: P, value: (paso) => paso },
	{ text: `${P} con espacios al inicio y al final`, value: (paso) => `  ${paso}  ` },
	{ text: 'uno de solo espacios', value: () => SOLO_ESPACIOS },
	{ text: `uno de ${P} caracteres`, value: (largo) => 'x'.repeat(numero(largo)) }
];

const EDITORES = [
	{ sujeto: 'edito', editar: editoYo },
	{ sujeto: `${OTRO} edita`, editar: editaElOtro }
];

const pasosDeEditar: StepDefinition[] = EDITORES.flatMap(({ sujeto, editar }) =>
	CAMBIOS.map(({ text: texto, value: valor }) => ({
		pattern: new RegExp(`^${sujeto} el paso ${N} a ${texto}$`),
		run: (world: World, paso: string, ...valores: string[]) => {
			editar(world, (tarea) => conLosPasos(conElPaso(tarea, numero(paso), valor(...valores)))(tarea));
			sinRechazo(world);
		}
	}))
);

/** Pasar a un paso o completar desde la fila: lo que decide el core, escrito como lo haría ese dispositivo. */
function tocoHecho(world: World, tarea: Task, momento: Date): void {
	world.checkboxTocado = true;
	// Sin una consulta antes, lo que se afirma después es del momento en que se tocó.
	if (world.momentosDelEstado.length === 0) world.momentosDelEstado = [momento];
	const accion = doneAction(tarea, world.completions, momento);
	if (accion.kind === 'completar') return completoYo(world, momento, tarea);
	if (accion.kind === 'avanzar') {
		recordarAntesDeMiCambio(world);
		escribirCambio(world, tarea, accion.change);
	}
}

function escribirCambio(world: World, tarea: Task, cambio: TaskChange): void {
	world.documentos = applyChange(world.documentos, tarea.id, cambio);
}

/** El otro dispositivo decide con lo que veía; su cambio llega a lo guardado. */
function tocaHechoElOtro(world: World, momento: Date): void {
	const visto = loQueVioElOtro(world);
	const tarea = laTarea(visto);
	const accion = doneAction(tarea, visto.completions, momento);
	if (accion.kind === 'avanzar') escribirCambio(world, tarea, accion.change);
	if (accion.kind === 'completar') {
		world.completions = [...world.completions, complete(tarea, visto.completions, nuevoId(world, 'completado'), momento)];
		escribirCambio(world, tarea, changeOnComplete(tarea));
	}
}

const textoDeBotones = ({ previousStep: pasoAnterior }: StepButtons) => (pasoAnterior ? 'Paso anterior y Hecho' : 'Hecho');

/** En cada momento consultado, la lista tiene una sola fila y sus botones de paso son esos. */
function laFilaMuestraLosBotones(world: World, esperado: string | undefined): void {
	expect(world.consultasDePendientes.length).toBeGreaterThan(0);
	for (const filas of world.consultasDePendientes) expect(filas.map(({ stepButtons: botonesDePaso }) => botonesDePaso && textoDeBotones(botonesDePaso))).toEqual([esperado]);
}

const ESTADOS_DEL_BOTON: Record<string, boolean> = { habilitado: true, deshabilitado: false };

export const pasosSteps: StepDefinition[] = [
	...pasosDeEditar,
	{
		pattern: new RegExp(`^creo una tarea puntual con título ${P} y pasos ${P}$`),
		run: (world, titulo, pasos) => crearPuntualConPasos(world, { title: titulo, ...datosDeLista(pasos) })
	},
	{
		pattern: new RegExp(`^creo una tarea puntual con título ${P} y pasos ${P} y un paso más de solo espacios$`),
		run: (world, titulo, pasos) => crearPuntualConPasos(world, { title: titulo, ...datosDeLista(pasos, [SOLO_ESPACIOS]) })
	},
	{
		pattern: new RegExp(`^creo una tarea periódica relativa con título ${P} cada 2 dias y pasos ${P}$`),
		run: (world, titulo, pasos) => {
			crearEnWorld(world, { title: titulo, every: 2, unit: 'dias', ...datosDeLista(pasos) });
			sinRechazo(world);
		}
	},
	{
		pattern: new RegExp(`^creo una tarea periódica semanal con título ${P} los ${P} y pasos ${P}$`),
		run: (world, titulo, dias, pasos) => {
			const datos = { title: titulo, ...datosDeLista(pasos), ...diasDe(formaDe('semanal los'), dias) };
			registrarCreacion(world, (id) => createRecurringCalendar(datos, id, AHORA));
			sinRechazo(world);
		}
	},
	{
		pattern: new RegExp(`^los pasos de la tarea son ${P}$`),
		run: (world, pasos) => guardadaConPasos(world, laTarea(world), pasos)
	},
	{
		pattern: new RegExp(`^los pasos de la tarea ${TITULO} son ${P}$`),
		run: (world, titulo, pasos) => guardadaConPasos(world, laTareaTitulada(world, titulo), pasos)
	},
	{
		pattern: new RegExp(`^el paso actual de la tarea es ${P}$`),
		run: (world, actual) => guardadaEnElPaso(world, laTarea(world), numeroDePaso(actual))
	},
	{
		// Un completado con pasoAlCompletar (§4.4) sin tocar el paso en que va la tarea.
		pattern: new RegExp(`^la tarea fue completada el ${P} en el paso ${P}$`),
		run: (world, momento, paso) => {
			const { id } = registrarCompletado(world, fechaHora(momento));
			world.completions = world.completions.map((completado) => (completado.id === id ? { ...completado, stepAtCompletion: numeroDePaso(paso) } : completado));
		}
	},
	{
		pattern: new RegExp(`^vacío el paso ${N}$`),
		run: (world, paso) => {
			editoYo(world, (tarea) => conLosPasos(conElPaso(tarea, numero(paso), ''))(tarea));
			sinRechazo(world);
		}
	},
	{
		pattern: new RegExp(`^edito la tarea con ${P} pasos$`),
		run: (world, cantidad) => {
			editoYo(world, conLosPasos(Array.from({ length: numero(cantidad) }, (_, lugar) => `Paso ${lugar + 1}`)));
			sinRechazo(world);
		}
	},
	{
		pattern: new RegExp(`^toco Hecho el ${P}$`),
		run: (world, momento) => tocoHecho(world, laTarea(world), fechaHora(momento))
	},
	{
		pattern: new RegExp(`^toco Hecho en la tarea ${TITULO} el ${P}$`),
		run: (world, titulo, momento) => tocoHecho(world, laTareaTitulada(world, titulo), fechaHora(momento))
	},
	{
		pattern: /^toco Paso anterior$/,
		run: (world) => {
			const tarea = laTarea(world);
			recordarAntesDeMiCambio(world);
			escribirCambio(world, tarea, previousStepChange(tarea));
		}
	},
	{
		pattern: new RegExp(`^${OTRO} toca Hecho el ${P}$`),
		run: (world, momento) => tocaHechoElOtro(world, fechaHora(momento))
	},
	{
		pattern: new RegExp(`^la tarea tiene los pasos ${P}$`),
		run: (world, pasos) => expect(taskSteps(laTarea(world))).toEqual(lista(pasos))
	},
	{
		pattern: /^la tarea no tiene más pasos$/,
		run: (world) => expect(elDocumento(world)).not.toHaveProperty('steps')
	},
	{
		pattern: new RegExp(`^la tarea tiene ${P} pasos$`),
		run: (world, cantidad) => expect(taskSteps(laTarea(world))).toHaveLength(numero(cantidad))
	},
	{
		pattern: new RegExp(`^el paso ${N} de la tarea tiene ${P} caracteres$`),
		run: (world, paso, largo) => expect(taskSteps(laTarea(world))[numero(paso) - 1]).toHaveLength(numero(largo))
	},
	{
		pattern: new RegExp(`^la tarea va en el paso ${N}$`),
		run: (world, paso) => expect(stepItIsOn(laTarea(world))).toBe(numero(paso))
	},
	{
		pattern: new RegExp(`^el último completado de la tarea guarda el paso ${P}$`),
		run: (world, paso) => expect(latestCompletion(completionsOfTask(world.completions, laTarea(world).id)).stepAtCompletion).toBe(numero(paso))
	},
	{
		pattern: /^el último completado de la tarea no guarda paso$/,
		run: (world) => {
			const completados = completionsOfTask(world.completions, laTarea(world).id);
			expect(completados.length).toBeGreaterThan(0);
			expect(latestCompletion(completados)).not.toHaveProperty('stepAtCompletion');
		}
	},
	{
		pattern: new RegExp(`^la fila de la tarea muestra el paso ${P}$`),
		run: (world, texto) => {
			expect(world.consultasDePendientes.length).toBeGreaterThan(0);
			for (const filas of world.consultasDePendientes) expect(filas.map(({ firstStepText: textoDePrimerPaso }) => textoDePrimerPaso)).toEqual([texto]);
		}
	},
	{
		pattern: new RegExp(`^la fila de la tarea muestra los botones ${P}$`),
		run: (world, botones) => laFilaMuestraLosBotones(world, botones)
	},
	{
		pattern: /^la fila de la tarea no muestra botones de paso$/,
		run: (world) => laFilaMuestraLosBotones(world, undefined)
	},
	{
		pattern: new RegExp(`^el botón Hecho de la tarea está ${P}$`),
		run: (world, estado) => {
			expect(Object.hasOwn(ESTADOS_DEL_BOTON, estado)).toBe(true);
			expect(world.consultasDePendientes.length).toBeGreaterThan(0);
			for (const filas of world.consultasDePendientes) expect(filas.map(({ stepButtons: botonesDePaso }) => botonesDePaso?.doneEnabled)).toEqual([ESTADOS_DEL_BOTON[estado]]);
		}
	}
];
