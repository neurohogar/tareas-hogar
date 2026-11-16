// Etiquetas (spec §4.3, §6.1, §6.2, §6.4) y sus conflictos entre
// dispositivos (§7). Los pasos del otro dispositivo actúan sobre lo que él ve
// (lo guardado antes de mi último cambio, más sus propios cambios); sus
// cambios llegan después de los míos.
import { expect } from 'vitest';
import { labelDeletion, brokenReferences } from '../../src/lib/core/label-deletion';
import { taskData, type TaskData } from '../../src/lib/core/task-data';
import { applyChange, applyReferenceChanges, taskFromDocument } from '../../src/lib/core/task-document';
import { PALETTE, type Color, type Label } from '../../src/lib/core/label';
import { taskLabels } from '../../src/lib/core/task-labels';
import { activeFilter } from '../../src/lib/core/label-filter';
import { mergeOfDuplicates } from '../../src/lib/core/label-merge';
import { applyLabelChange, rename, type RenameError } from '../../src/lib/core/label-management';
import { createWithLabels, editWithLabels } from '../../src/lib/core/save-with-labels';
import { sortLabels } from '../../src/lib/core/label-order';
import type { Task } from '../../src/lib/core/task';
import { AHORA } from './crear';
import { P, TITULO, lista } from './valores';
import {
	OTRO,
	copiaDe,
	laTareaTitulada,
	loQueVioElOtro,
	nuevoId,
	nuevoIdDeEtiqueta,
	recordarAntesDeMiCambio,
	registrarDelOtro,
	tareasDe,
	type Guardado,
	type StepDefinition,
	type World
} from './world';

/** Cómo queda lo guardado con un cambio ya calculado. */
type Aplicar = (guardado: Guardado) => Guardado;

/** Calcula un cambio con lo que ve quien lo hace; undefined si se rechazó. */
type Calcular = (world: World, vista: Guardado, ...valores: string[]) => Aplicar | undefined;

/** Quién hace el cambio: qué ve y cómo llega su cambio a lo guardado. */
interface Actor {
	/** El comienzo del paso, con el verbo conjugado. */
	sujeto: (verbo: Verbo) => string;
	actuar: (world: World, calcular: (vista: Guardado) => Aplicar | undefined) => void;
}

interface Verbo {
	yo: string;
	otro: string;
}

const YO: Actor = {
	sujeto: ({ yo }) => yo,
	actuar: (world, calcular) => {
		recordarAntesDeMiCambio(world);
		const aplicar = calcular(world);
		if (aplicar) Object.assign(world, aplicar(world));
	}
};

const EL_OTRO: Actor = {
	sujeto: ({ otro }) => `${OTRO} ${otro}`,
	actuar: (world, calcular) => {
		const aplicar = calcular(loQueVioElOtro(world));
		if (aplicar) registrarDelOtro(world, aplicar);
	}
};

const lasEtiquetas = (guardado: Guardado, etiquetas: Label[]): Guardado => ({ ...copiaDe(guardado), labels: etiquetas });

/** En los Given y en los pasos que nombran una etiqueta, el nombre es exacto. */
function laEtiquetaLlamada(guardado: Guardado, nombre: string): Label {
	const llamadas = guardado.labels.filter((etiqueta) => etiqueta.name === nombre);
	if (llamadas.length !== 1) throw new Error(`Se esperaba una etiqueta "${nombre}", hay ${llamadas.length}`);
	return llamadas[0];
}

function color(valor: string): Color {
	if (!(PALETTE as readonly string[]).includes(valor)) throw new Error(`Color inválido: "${valor}"`);
	return valor as Color;
}

/** "Nombre:color", como lo escribe "existen las etiquetas". */
function etiquetaDeclarada(valor: string): Omit<Label, 'id'> {
	const separador = valor.lastIndexOf(':');
	if (separador <= 0) throw new Error(`Etiqueta inválida (se espera nombre:color): "${valor}"`);
	return { name: valor.slice(0, separador), color: color(valor.slice(separador + 1)) };
}

const comoTexto = ({ name: nombre, color }: Label) => `${nombre}:${color}`;
const nombres = (etiquetas: Label[]) => etiquetas.map(({ name: nombre }) => nombre);

/** Los datos que carga el panel; por defecto, los de la tarea sin cambios. */
type DatosDelPanel = (tarea: Task) => TaskData;

/** Edita la tarea en el panel con lo que ve: los datos que carga y las etiquetas escritas, y guarda. */
function guardarPanel(world: World, vista: Guardado, titulo: string, escritas: string[], datos: DatosDelPanel = taskData): Aplicar | undefined {
	const tarea = laTareaTitulada(vista, titulo);
	const resultado = editWithLabels(tarea, datos(tarea), escritas, {
		existings: vista.labels,
		newId: () => nuevoIdDeEtiqueta(world)
	});
	if (!resultado.ok) {
		world.errors = resultado.errors;
		return undefined;
	}
	return (guardado) => ({
		...copiaDe(guardado),
		documentos: applyChange(guardado.documentos, tarea.id, resultado.change),
		labels: [...guardado.labels, ...resultado.newLabels]
	});
}

/** Cada operación sobre etiquetas, con el verbo para mí y para el otro dispositivo. */
const OPERACIONES: { verbo: Verbo; resto: string; calcular: Calcular }[] = [
	{
		verbo: { yo: 'edito', otro: 'edita' },
		resto: `las etiquetas de la tarea ${TITULO} a ${P}`,
		calcular: (world, vista, titulo, escritas) => guardarPanel(world, vista, titulo, lista(escritas))
	},
	{
		verbo: { yo: 'renombro', otro: 'renombra' },
		resto: `la etiqueta ${P} a ${P}`,
		calcular: (world, vista, nombre, nuevo) => renombrado(world, vista, nombre, nuevo)
	},
	{
		verbo: { yo: 'cambio', otro: 'cambia' },
		resto: `el color de la etiqueta ${P} a ${P}`,
		calcular: (_, vista, nombre, nuevo) => {
			const { id } = laEtiquetaLlamada(vista, nombre);
			return (guardado) => lasEtiquetas(guardado, applyLabelChange(guardado.labels, id, { color: color(nuevo) }));
		}
	},
	{
		verbo: { yo: 'borro', otro: 'borra' },
		resto: `la etiqueta ${P}`,
		calcular: (_, vista, nombre) => {
			const borrado = labelDeletion(laEtiquetaLlamada(vista, nombre).id, tareasDe(vista));
			return (guardado) => ({
				...lasEtiquetas(guardado, guardado.labels.filter(({ id }) => id !== borrado.labelId)),
				documentos: applyReferenceChanges(guardado.documentos, borrado.references)
			});
		}
	}
];

function renombrado(world: World, vista: Guardado, nombre: string, escrito: string): Aplicar | undefined {
	const etiqueta = laEtiquetaLlamada(vista, nombre);
	const resultado = rename(etiqueta, escrito, vista.labels);
	if (!resultado.ok) {
		world.errorDeRenombrado = resultado.error;
		return undefined;
	}
	return (guardado) => lasEtiquetas(guardado, applyLabelChange(guardado.labels, etiqueta.id, resultado.change));
}

const pasosDeOperaciones: StepDefinition[] = [YO, EL_OTRO].flatMap((actor) =>
	OPERACIONES.map(({ verbo, resto, calcular }) => ({
		pattern: new RegExp(`^${actor.sujeto(verbo)} ${resto}$`),
		run: (world: World, ...valores: string[]) => actor.actuar(world, (vista) => calcular(world, vista, ...valores))
	}))
);

/** Yo edito las etiquetas de la tarea con lo escrito. */
const editoEtiquetas = (world: World, titulo: string, escritas: string[], datos?: DatosDelPanel) =>
	YO.actuar(world, (vista) => guardarPanel(world, vista, titulo, escritas, datos));

function creoConEtiquetas(world: World, titulo: string, escritas: string[]): void {
	recordarAntesDeMiCambio(world);
	const resultado = createWithLabels({ shape: 'puntual', title: titulo }, escritas, nuevoId(world, 'tarea'), AHORA, {
		existings: world.labels,
		newId: () => nuevoIdDeEtiqueta(world)
	});
	if (!resultado.ok) {
		world.errors = resultado.errors;
		return;
	}
	world.documentos = [...world.documentos, resultado.task];
	world.labels = [...world.labels, ...resultado.newLabels];
}

/** La app detecta etiquetas duplicadas y las fusiona (§7). */
function fusionar(world: World): void {
	const { deletedItems: borradas, references: referencias } = mergeOfDuplicates(world.labels, tareasDe(world));
	world.labels = world.labels.filter(({ id }) => !borradas.includes(id));
	world.documentos = applyReferenceChanges(world.documentos, referencias);
}

const RECHAZOS_DE_RENOMBRADO: Record<string, RenameError> = {
	'nombre repetido': 'repetido',
	'nombre demasiado largo': 'largo',
	'nombre vacío': 'vacio'
};

const chipsDe = (world: World, titulo: string) => nombres(taskLabels(laTareaTitulada(world, titulo), world.labels));

/** Lo que mi último cambio agregó a lo guardado: no estaba antes de él. */
function agregadoPorMiCambio<T extends { id: string }>(ahora: T[], antes: T[]): T[] {
	const previos = new Set(antes.map(({ id }) => id));
	return ahora.filter(({ id }) => !previos.has(id));
}

/** La única tarea que creó mi último cambio, nombrada sin su título. */
function laTareaNueva(world: World): Task {
	const nuevas = agregadoPorMiCambio(world.documentos, loQueVioElOtro(world).documentos);
	expect(nuevas).toHaveLength(1);
	return taskFromDocument(nuevas[0]);
}

/** Los chips del filtro: "Todas" y una por etiqueta; sin etiquetas, el filtro no se muestra. */
function chipsDelFiltro(world: World): string[] {
	const etiquetas = sortLabels(world.labels);
	return etiquetas.length === 0 ? [] : ['Todas', ...nombres(etiquetas)];
}

export const etiquetasSteps: StepDefinition[] = [
	...pasosDeOperaciones,
	{
		pattern: new RegExp(`^existen las etiquetas ${P}$`),
		run: (world, declaradas) => {
			const nuevas = lista(declaradas).map((valor) => ({ id: nuevoIdDeEtiqueta(world), ...etiquetaDeclarada(valor) }));
			world.labels = [...world.labels, ...nuevas];
		}
	},
	{
		pattern: new RegExp(`^la tarea ${TITULO} tiene las etiquetas ${P}$`),
		run: (world, titulo, declaradas) => {
			const etiquetas = lista(declaradas).map((nombre) => laEtiquetaLlamada(world, nombre).id);
			world.documentos = applyChange(world.documentos, laTareaTitulada(world, titulo).id, { labels: etiquetas });
		}
	},
	{
		pattern: new RegExp(`^elegí el filtro ${P}$`),
		run: (world, filtro) => {
			world.filtro = filtro === 'Todas' ? undefined : laEtiquetaLlamada(world, filtro).id;
		}
	},
	{
		pattern: new RegExp(`^edito las etiquetas de la tarea ${TITULO} a ${P} con espacios al principio y al final$`),
		run: (world, titulo, escrita) => editoEtiquetas(world, titulo, [`  ${escrita}  `])
	},
	{
		pattern: new RegExp(`^edito las etiquetas de la tarea ${TITULO} a una de solo espacios$`),
		run: (world, titulo) => editoEtiquetas(world, titulo, ['   '])
	},
	{
		pattern: new RegExp(`^edito la tarea ${TITULO} para quitarle todas las etiquetas$`),
		run: (world, titulo) => editoEtiquetas(world, titulo, [])
	},
	{
		pattern: new RegExp(`^edito en una misma edición el título a ${P} y las etiquetas a ${P}$`),
		run: (world, titulo, escritas) => {
			const [tarea] = tareasDe(world);
			editoEtiquetas(world, tarea.title, lista(escritas), (actual) => ({ ...taskData(actual), title: titulo }));
		}
	},
	{
		pattern: new RegExp(`^creo una tarea puntual con título ${P}, sin fecha límite y con las etiquetas ${P}$`),
		run: (world, titulo, escritas) => creoConEtiquetas(world, titulo, lista(escritas))
	},
	{
		pattern: new RegExp(`^renombro la etiqueta ${P} a ${P} con espacios al principio y al final$`),
		run: (world, nombre, nuevo) => YO.actuar(world, (vista) => renombrado(world, vista, nombre, `  ${nuevo}  `))
	},
	{
		pattern: new RegExp(`^renombro la etiqueta ${P} a uno de solo espacios$`),
		run: (world, nombre) => YO.actuar(world, (vista) => renombrado(world, vista, nombre, '   '))
	},
	{
		pattern: /^la app fusiona las etiquetas duplicadas$/,
		run: fusionar
	},
	{
		pattern: new RegExp(`^la tarea ${TITULO} muestra las etiquetas ${P}$`),
		run: (world, titulo, chips) => expect(chipsDe(world, titulo)).toEqual(lista(chips))
	},
	{
		pattern: new RegExp(`^la tarea que se creó muestra las etiquetas ${P}$`),
		run: (world, chips) => expect(chipsDe(world, laTareaNueva(world).title)).toEqual(lista(chips))
	},
	{
		pattern: /^no se crea ninguna tarea nueva$/,
		run: (world) => {
			expect(world.antesDeMiCambio, 'no hubo un cambio mío').toBeDefined();
			expect(agregadoPorMiCambio(world.documentos, loQueVioElOtro(world).documentos)).toEqual([]);
		}
	},
	{
		pattern: new RegExp(`^la tarea ${TITULO} no muestra etiquetas$`),
		run: (world, titulo) => expect(chipsDe(world, titulo)).toEqual([])
	},
	{
		pattern: new RegExp(`^la pantalla Etiquetas muestra ${P}$`),
		run: (world, etiquetas) => expect(sortLabels(world.labels).map(comoTexto)).toEqual(lista(etiquetas))
	},
	{
		pattern: /^la pantalla Etiquetas no muestra ninguna etiqueta$/,
		run: (world) => expect(world.labels).toEqual([])
	},
	{
		pattern: new RegExp(`^la etiqueta nueva tiene color ${P}$`),
		run: (world, esperado) => {
			const nuevas = agregadoPorMiCambio(world.labels, loQueVioElOtro(world).labels);
			expect(nuevas.map(({ color }) => color)).toEqual([color(esperado)]);
		}
	},
	{
		pattern: new RegExp(`^el filtro ofrece ${P}$`),
		run: (world, chips) => expect(chipsDelFiltro(world)).toEqual(lista(chips))
	},
	{
		pattern: /^el filtro no se muestra$/,
		run: (world) => expect(chipsDelFiltro(world)).toEqual([])
	},
	{
		pattern: new RegExp(`^el filtro elegido es ${P}$`),
		run: (world, esperado) => {
			const vigente = activeFilter(world.filtro, world.labels);
			const nombre = world.labels.find(({ id }) => id === vigente)?.name ?? 'Todas';
			expect(nombre).toBe(esperado);
		}
	},
	{
		pattern: new RegExp(`^las tareas con etiquetas borradas a limpiar son solo ${P}$`),
		run: (world, titulos) => {
			const tareas = tareasDe(world);
			const tituloDe = (id: string) => tareas.find((tarea) => tarea.id === id)?.title;
			expect(brokenReferences(tareas, world.labels).map(({ taskId: tareaId }) => tituloDe(tareaId))).toEqual(lista(titulos));
		}
	},
	{
		pattern: new RegExp(`^el renombrado se rechaza por (${Object.keys(RECHAZOS_DE_RENOMBRADO).join('|')})$`),
		run: (world, motivo) => expect(world.errorDeRenombrado).toBe(RECHAZOS_DE_RENOMBRADO[motivo])
	}
];
