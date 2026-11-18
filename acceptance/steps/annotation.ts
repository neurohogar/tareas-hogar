// Annotate (spec §4.5, §5.10), the Annotations screen, Copy, Edit text and Delete (§6.7), and the
// annotations of a deleted task (§6.2, §7). Steps name an annotation by the
// moment it was made.
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
/** The screens a saved annotation can have: «Etiquetas» only exists as a stored value (§4.5, D20), annotations are no longer made there. */
const SCREENS = [...SCREENS_CURRENT, 'Etiquetas', 'Panel de edición'];

/** A direction or a screen, written in the step or as `<placeholder>`. */
const DIRECTION = `(<[A-Za-z0-9_]+>|${DIRECTIONS.join('|')})`;
const SCREEN = `(<[A-Za-z0-9_]+>|${SCREENS.join('|')})`;

function direction(value: string): Sense {
	if (!DIRECTIONS.includes(value)) throw new Error(`Invalid direction: "${value}"`);
	return value as Sense;
}

function screenCurrent(value: string): CurrentScreen {
	if (!SCREENS_CURRENT.includes(value)) throw new Error(`Invalid screen: "${value}"`);
	return value as CurrentScreen;
}

/** What the person sees when annotating: where they are, the open panel and the undo notice. */
function contextOf(world: World): AnnotateContext {
	if (!world.screenCurrent) throw new Error('The screen where the person is was not stated');
	return {
		screen: world.screenCurrent,
		...(world.annotatePanel && { panel: world.annotatePanel.taskId === undefined ? {} : { taskId: world.annotatePanel.taskId } }),
		notice: world.notice
	};
}

/** «Etiquetas» is no longer a current screen: the saved annotation keeps it as an old value (§4.5, D20); it is built in Pendientes and given that value. */
const screenForBuild = (screenName: string): string => (screenName === 'Etiquetas' ? 'Pendientes' : screenName);

const withScreenSaved = (annotation: Annotation, screenName: string): Annotation => (screenName === 'Etiquetas' ? { ...annotation, screen: 'Etiquetas' } : annotation);

function save(world: World, annotation: Annotation): void {
	world.annotations = [...world.annotations, annotation];
	world.lastAnnotationId = annotation.id;
}

function annotateMe(world: World, directionChosen: string, now: string, text = ''): void {
	save(world, annotate(newId(world, 'anotacion'), direction(directionChosen), dateHour(now), contextOf(world), text));
	// A value the core does not silently reject: the annotation was saved with the text that was written.
	expect(world.errors).toBeUndefined();
}

/** Another device on the given screen, without a panel; over a task only through an undo notice in view. */
function annotatesOther(world: World, directionChosen: string, screenName: string, now: string, title?: string): void {
	const moment = dateHour(now);
	const notice =
		title === undefined
			? undefined
			: noticeOnComplete(theTaskTitled(thatWasSaved(world), title), { id: newId(world, 'completado'), taskId: theTaskTitled(thatWasSaved(world), title).id, completedAt: moment });
	save(world, withScreenSaved(annotate(newId(world, 'anotacion'), direction(directionChosen), moment, { screen: screenCurrent(screenForBuild(screenName)), notice }), screenName));
}

/** Declares a saved annotation, with the context the step gives. */
function declare(world: World, directionChosen: string, screenName: string, annotated: string): void {
	const onOpenPanel = screenName === 'Panel de edición';
	if (!SCREENS.includes(screenName)) throw new Error(`Invalid screen: "${screenName}"`);
	const context: AnnotateContext = { screen: onOpenPanel ? 'Pendientes' : screenCurrent(screenForBuild(screenName)), ...(onOpenPanel && { panel: {} }) };
	save(world, withScreenSaved(annotate(newId(world, 'anotacion'), direction(directionChosen), dateHour(annotated), context), screenName));
}

const all = (world: World): Annotation[] => [...world.annotations, ...world.annotationsDeleted];

/** The only annotation of that moment, even if it has been deleted. */
function momentThe(world: World, annotated: string): Annotation {
	const instant = dateHour(annotated).getTime();
	const ofMoment = all(world).filter(({ annotatedAt }) => annotatedAt.getTime() === instant);
	if (ofMoment.length !== 1) throw new Error(`Expected one annotation of ${annotated}, found ${ofMoment.length}`);
	return ofMoment[0];
}

function theActive(world: World, annotated: string): Annotation {
	const { id } = momentThe(world, annotated);
	const active = world.annotations.find((annotation) => annotation.id === id);
	if (!active) throw new Error(`The annotation of ${annotated} no longer exists`);
	return active;
}

function theLast(world: World): Annotation {
	const last = world.annotations.find(({ id }) => id === world.lastAnnotationId);
	if (!last) throw new Error('No annotation was declared');
	return last;
}

/** Changes the last declared annotation. */
function changeLast(world: World, change: (annotation: Annotation) => Annotation): void {
	const last = theLast(world);
	world.annotations = world.annotations.map((annotation) => (annotation === last ? change(annotation) : annotation));
	world.lastAnnotationId = change(last).id;
}

const spaces = (count: string) => ' '.repeat(numeric(count));

/** Like setDoc on a field: editing the text of an already deleted annotation does not revive it. */
function editTheText(world: World, annotated: string, text: string): void {
	world.annotations = editText(world.annotations, momentThe(world, annotated).id, text);
}

/** Like deleteDoc: deleting an annotation that no longer exists does nothing. */
function deleteAnnotation(world: World, annotated: string): void {
	deleteSaved(world, [], [], [momentThe(world, annotated).id]);
}

/** "Hoy: 09:10 · Me molestó · Historial, 08:05 · ...; Ayer: ...": groups joined with "; ", annotations with ", ", parts with " · ". */
function inText(groups: AnnotationsGroup[]): string {
	const entry = ({ hour, annotation, taskName }: AnnotationsGroup['entries'][number]) =>
		[hour, annotation.sense, annotation.screen, taskName, annotation.text].filter((part) => part !== undefined).join(' · ');
	return groups.map(({ header: heading, entries }) => `${heading}: ${entries.map(entry).join(', ')}`).join('; ');
}

function theQueried(world: World): AnnotationsGroup[] {
	if (!world.annotationsQueried) throw new Error('Annotations was not queried');
	return world.annotationsQueried;
}

function thePanelOpen(world: World) {
	if (!world.annotatePanel) throw new Error('The edit panel is not open');
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
		// §5.10: annotating does not touch the task or the panel; it does not close the panel or open an action notice.
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
			if (!world.copied) throw new Error('Nothing was copied');
			expect(world.copied.text?.split('\n')).toEqual(lines.split('; '));
		}
	},
	{
		pattern: /^no hay nada para copiar$/,
		run: (world) => {
			if (!world.copied) throw new Error('Nothing was copied');
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
