// Anotar (spec §4.5, §5.10), la pantalla Anotaciones, Copiar, Editar texto y Borrar (§6.7), y las
// anotaciones de una tarea borrada (§6.2, §7). Una anotación se nombra en los pasos por el
// instante en que se anotó.
import { expect } from 'vitest';
import { annotate, editText, type Annotation, type AnnotateContext, type CurrentScreen, type Sense } from '../../src/lib/core/annotation';
import { annotationsOnScreen, type AnnotationsGroup } from '../../src/lib/core/annotations';
import { annotationsText } from '../../src/lib/core/copied-annotations';
import { orphanAnnotations } from '../../src/lib/core/deletion';
import { noticeOnComplete } from '../../src/lib/core/notice';
import { hasChanges } from '../../src/lib/core/unsaved-changes';
import { DATA_ON_CREATE } from '../../src/lib/core/task-data';
import { OTHER, deleteSaved, changesOnCreate, changesOnEdit, theTaskTitled, thatWasSaved, newId, tasksOf, type StepDefinition, type World } from './world';
import { P, TITLE, dateHour, numeric } from './values';

const DIRECTIONS = ['Me sirvió', 'Me molestó'];
const SCREENS_CURRENT = ['Pendientes', 'Historial', 'Anotaciones'];
/** Las pantallas que puede tener una anotación guardada: «Etiquetas» solo existe como valor guardado (§4.5, D20), ya no se anota ahí. */
const SCREENS = [...SCREENS_CURRENT, 'Etiquetas', 'Panel de edición'];

/** Un sentido o una pantalla, escritos en el paso o como `<placeholder>`. */
const DIRECTION = `(<[A-Za-z0-9_]+>|${DIRECTIONS.join('|')})`;
const SCREEN = `(<[A-Za-z0-9_]+>|${SCREENS.join('|')})`;

function direction(value: string): Sense {
	if (!DIRECTIONS.includes(value)) throw new Error(`Sentido inválido: "${value}"`);
	return value as Sense;
}

function screenCurrent(value: string): CurrentScreen {
	if (!SCREENS_CURRENT.includes(value)) throw new Error(`Pantalla inválida: "${value}"`);
	return value as CurrentScreen;
}

/** Lo que se ve de la persona al anotar: dónde está, el panel abierto y el aviso de deshacer. */
function contextOf(world: World): AnnotateContext {
	if (!world.screenCurrent) throw new Error('No se dijo en qué pantalla está la persona');
	return {
		screen: world.screenCurrent,
		...(world.annotatePanel && { panel: world.annotatePanel.taskId === undefined ? {} : { taskId: world.annotatePanel.taskId } }),
		notice: world.notice
	};
}

/** «Etiquetas» ya no es una pantalla actual: la anotación guardada la conserva como valor viejo (§4.5, D20); se arma en Pendientes y se le pone ese valor. */
const screenForBuild = (screenName: string): string => (screenName === 'Etiquetas' ? 'Pendientes' : screenName);

const withScreenSaved = (annotation: Annotation, screenName: string): Annotation => (screenName === 'Etiquetas' ? { ...annotation, screen: 'Etiquetas' } : annotation);

function save(world: World, annotation: Annotation): void {
	world.annotations = [...world.annotations, annotation];
	world.lastAnnotationId = annotation.id;
}

function annotateMe(world: World, directionChosen: string, now: string, text = ''): void {
	save(world, annotate(newId(world, 'anotacion'), direction(directionChosen), dateHour(now), contextOf(world), text));
	// Un valor que el core no rechaza en silencio: la anotación se guardó con el texto que se escribió.
	expect(world.errors).toBeUndefined();
}

/** Otro dispositivo en la pantalla dada, sin panel; sobre una tarea solo por un aviso de deshacer a la vista. */
function annotatesOther(world: World, directionChosen: string, screenName: string, now: string, title?: string): void {
	const moment = dateHour(now);
	const notice =
		title === undefined
			? undefined
			: noticeOnComplete(theTaskTitled(thatWasSaved(world), title), { id: newId(world, 'completado'), taskId: theTaskTitled(thatWasSaved(world), title).id, completedAt: moment });
	save(world, withScreenSaved(annotate(newId(world, 'anotacion'), direction(directionChosen), moment, { screen: screenCurrent(screenForBuild(screenName)), notice }), screenName));
}

/** Declara una anotación guardada, con el contexto que dice el paso. */
function declare(world: World, directionChosen: string, screenName: string, annotated: string): void {
	const onOpenPanel = screenName === 'Panel de edición';
	if (!SCREENS.includes(screenName)) throw new Error(`Pantalla inválida: "${screenName}"`);
	const context: AnnotateContext = { screen: onOpenPanel ? 'Pendientes' : screenCurrent(screenForBuild(screenName)), ...(onOpenPanel && { panel: {} }) };
	save(world, withScreenSaved(annotate(newId(world, 'anotacion'), direction(directionChosen), dateHour(annotated), context), screenName));
}

const all = (world: World): Annotation[] => [...world.annotations, ...world.annotationsDeleted];

/** La única anotación de ese instante, aunque ya se haya borrado. */
function momentThe(world: World, annotated: string): Annotation {
	const instant = dateHour(annotated).getTime();
	const ofMoment = all(world).filter(({ annotatedAt }) => annotatedAt.getTime() === instant);
	if (ofMoment.length !== 1) throw new Error(`Se esperaba una anotación del ${annotated}, hay ${ofMoment.length}`);
	return ofMoment[0];
}

function theActive(world: World, annotated: string): Annotation {
	const { id } = momentThe(world, annotated);
	const active = world.annotations.find((annotation) => annotation.id === id);
	if (!active) throw new Error(`La anotación del ${annotated} ya no existe`);
	return active;
}

function theLast(world: World): Annotation {
	const last = world.annotations.find(({ id }) => id === world.lastAnnotationId);
	if (!last) throw new Error('No se declaró ninguna anotación');
	return last;
}

/** Cambia la última anotación declarada. */
function changeLast(world: World, change: (annotation: Annotation) => Annotation): void {
	const last = theLast(world);
	world.annotations = world.annotations.map((annotation) => (annotation === last ? change(annotation) : annotation));
	world.lastAnnotationId = change(last).id;
}

const spaces = (count: string) => ' '.repeat(numeric(count));

/** Como setDoc de un campo: editar el texto de una anotación ya borrada no la revive. */
function editTheText(world: World, annotated: string, text: string): void {
	world.annotations = editText(world.annotations, momentThe(world, annotated).id, text);
}

/** Como deleteDoc: borrar una anotación que ya no existe no hace nada. */
function deleteAnnotation(world: World, annotated: string): void {
	deleteSaved(world, [], [], [momentThe(world, annotated).id]);
}

/** "Hoy: 09:10 · Me molestó · Historial, 08:05 · ...; Ayer: ...": grupos con "; ", anotaciones con ", ", partes con " · ". */
function inText(groups: AnnotationsGroup[]): string {
	const entry = ({ hour, annotation, taskName }: AnnotationsGroup['entries'][number]) =>
		[hour, annotation.sense, annotation.screen, taskName, annotation.text].filter((part) => part !== undefined).join(' · ');
	return groups.map(({ header: heading, entries }) => `${heading}: ${entries.map(entry).join(', ')}`).join('; ');
}

function theQueried(world: World): AnnotationsGroup[] {
	if (!world.annotationsQueried) throw new Error('No se consultó Anotaciones');
	return world.annotationsQueried;
}

function thePanelOpen(world: World) {
	if (!world.annotatePanel) throw new Error('El panel de edición no está abierto');
	return world.annotatePanel;
}

export const annotationSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^estoy en ${SCREEN}$`),
		run: (world, screenName) => void (world.screenCurrent = screenCurrent(screenName))
	},
	{
		pattern: new RegExp(`^el panel de edición está abierto al editar la tarea ${TITLE}$`),
		run: (world, title) => {
			const task = theTaskTitled(world, title);
			world.annotatePanel = { taskId: task.id, changes: changesOnEdit(task), docsOnOpen: structuredClone(world.docs) };
		}
	},
	{
		pattern: /^el panel de edición está abierto al crear una tarea$/,
		run: (world) => {
			world.annotatePanel = { changes: changesOnCreate(DATA_ON_CREATE), docsOnOpen: structuredClone(world.docs) };
		}
	},
	{
		pattern: new RegExp(`^anoto ${DIRECTION} el ${P}$`),
		run: (world, chosen, now) => annotateMe(world, chosen, now)
	},
	{
		pattern: new RegExp(`^anoto ${DIRECTION} el ${P} con el texto ${P}$`),
		run: (world, chosen, now, text) => annotateMe(world, chosen, now, text)
	},
	{
		pattern: new RegExp(`^anoto ${DIRECTION} el ${P} con el texto ${P} entre ${P} espacios$`),
		run: (world, chosen, now, text, count) => annotateMe(world, chosen, now, `${spaces(count)}${text}${spaces(count)}`)
	},
	{
		pattern: new RegExp(`^anoto ${DIRECTION} el ${P} con ${P} espacios como texto$`),
		run: (world, chosen, now, count) => annotateMe(world, chosen, now, spaces(count))
	},
	{
		pattern: new RegExp(`^anoto ${DIRECTION} el ${P} con un texto de ${P} caracteres$`),
		run: (world, chosen, now, length) => annotateMe(world, chosen, now, 'a'.repeat(numeric(length)))
	},
	{
		pattern: new RegExp(`^${OTHER} anota ${DIRECTION} en ${SCREEN} el ${P}$`),
		run: (world, chosen, screenName, now) => annotatesOther(world, chosen, screenName, now)
	},
	{
		pattern: new RegExp(`^${OTHER} anota ${DIRECTION} en ${SCREEN} el ${P} sobre la tarea ${TITLE}$`),
		run: (world, chosen, screenName, now, title) => annotatesOther(world, chosen, screenName, now, title)
	},
	{
		pattern: new RegExp(`^una anotación ${DIRECTION} en ${SCREEN} del ${P}$`),
		run: (world, chosen, screenName, annotated) => declare(world, chosen, screenName, annotated)
	},
	{
		pattern: new RegExp(`^la anotación se refiere a la tarea ${TITLE}$`),
		run: (world, title) => changeLast(world, (annotation) => ({ ...annotation, taskId: theTaskTitled(world, title).id }))
	},
	{
		pattern: new RegExp(`^la anotación dice ${P}$`),
		run: (world, text) => {
			const { id } = theLast(world);
			world.annotations = editText(world.annotations, id, text);
		}
	},
	{
		pattern: new RegExp(`^la anotación se registró con id ${P}$`),
		run: (world, id) => changeLast(world, (annotation) => ({ ...annotation, id }))
	},
	{
		pattern: /^queda una sola anotación$/,
		run: (world) => expect(world.annotations).toHaveLength(1)
	},
	{
		pattern: new RegExp(`^quedan ${P} anotaciones$`),
		run: (world, count) => expect(world.annotations).toHaveLength(numeric(count))
	},
	{
		pattern: /^no queda ninguna anotación$/,
		run: (world) => expect(world.annotations).toEqual([])
	},
	{
		pattern: new RegExp(`^no existe la anotación del ${P}$`),
		run: (world, annotated) => {
			const { id } = momentThe(world, annotated);
			expect(world.annotations.map((annotation) => annotation.id)).not.toContain(id);
		}
	},
	{
		pattern: new RegExp(`^la anotación del ${P} tiene sentido ${DIRECTION} en ${SCREEN}$`),
		run: (world, annotated, chosen, screenName) => {
			const annotation = theActive(world, annotated);
			expect(annotation.sense).toBe(chosen);
			expect(annotation.screen).toBe(screenName);
		}
	},
	{
		pattern: new RegExp(`^la anotación del ${P} es de la tarea ${TITLE}$`),
		run: (world, annotated, title) =>
			expect(theActive(world, annotated).taskId).toBe(theTaskTitled(thatWasSaved(world), title).id)
	},
	{
		pattern: new RegExp(`^la anotación del ${P} no es de ninguna tarea$`),
		run: (world, annotated) => expect(theActive(world, annotated)).not.toHaveProperty('taskId')
	},
	{
		pattern: new RegExp(`^la anotación del ${P} dice ${P}$`),
		run: (world, annotated, text) => expect(theActive(world, annotated).text).toBe(text)
	},
	{
		pattern: new RegExp(`^la anotación del ${P} dice un texto de ${P} caracteres$`),
		run: (world, annotated, length) => expect(theActive(world, annotated).text).toBe('a'.repeat(numeric(length)))
	},
	{
		pattern: new RegExp(`^la anotación del ${P} no tiene texto$`),
		run: (world, annotated) => expect(theActive(world, annotated)).not.toHaveProperty('text')
	},
	{
		// §5.10: anotar no toca la tarea ni el panel; no cierra el panel ni abre un aviso de acción.
		pattern: /^el panel sigue abierto sin cambios sin guardar$/,
		run: (world) => {
			const { changes, docsOnOpen } = thePanelOpen(world);
			expect(world.annotations).toHaveLength(1);
			expect(hasChanges(changes.onOpen, changes.form)).toBe(false);
			expect(changes.top).toBe('nada');
			expect(world.docs).toStrictEqual(docsOnOpen);
		}
	},
	{
		pattern: new RegExp(`^consulto Anotaciones el ${P}$`),
		run: (world, now) => {
			world.annotationsQueried = annotationsOnScreen(tasksOf(world), world.annotations, dateHour(now));
		}
	},
	{
		pattern: new RegExp(`^Anotaciones muestra ${P}$`),
		run: (world, expected) => expect(inText(theQueried(world))).toBe(expected)
	},
	{
		pattern: /^Anotaciones está vacía$/,
		run: (world) => expect(theQueried(world)).toEqual([])
	},
	{
		pattern: /^copio las anotaciones$/,
		run: (world) => {
			world.copied = { text: annotationsText(tasksOf(world), world.annotations) };
		}
	},
	{
		pattern: new RegExp(`^el texto copiado tiene las líneas ${P}$`),
		run: (world, lines) => {
			if (!world.copied) throw new Error('No se copió');
			expect(world.copied.text?.split('\n')).toEqual(lines.split('; '));
		}
	},
	{
		pattern: /^no hay nada para copiar$/,
		run: (world) => {
			if (!world.copied) throw new Error('No se copió');
			expect(world.copied.text).toBeUndefined();
		}
	},
	{
		pattern: new RegExp(`^edito el texto de la anotación del ${P} a ${P}$`),
		run: (world, annotated, text) => editTheText(world, annotated, text)
	},
	{
		pattern: new RegExp(`^edito el texto de la anotación del ${P} a ${P} entre ${P} espacios$`),
		run: (world, annotated, text, count) => editTheText(world, annotated, `${spaces(count)}${text}${spaces(count)}`)
	},
	{
		pattern: new RegExp(`^edito el texto de la anotación del ${P} a ${P} espacios$`),
		run: (world, annotated, count) => editTheText(world, annotated, spaces(count))
	},
	{
		pattern: new RegExp(`^${OTHER} edita el texto de la anotación del ${P} a ${P}$`),
		run: (world, annotated, text) => editTheText(world, annotated, text)
	},
	{
		pattern: new RegExp(`^borro la anotación del ${P}$`),
		run: (world, annotated) => deleteAnnotation(world, annotated)
	},
	{
		pattern: new RegExp(`^${OTHER} borra la anotación del ${P}$`),
		run: (world, annotated) => deleteAnnotation(world, annotated)
	},
	{
		pattern: new RegExp(`^las anotaciones huérfanas a limpiar son solo la del ${P}$`),
		run: (world, annotated) =>
			expect(orphanAnnotations(tasksOf(world), world.annotations).map(({ id }) => id)).toEqual([momentThe(world, annotated).id])
	}
];
