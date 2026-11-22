import type { PanelAction } from '../../src/lib/core/panel-action';
import type { OnTop } from '../../src/lib/core/panel-back';
import type { Notice } from '../../src/lib/core/notice';
import type { PanelForm } from '../../src/lib/core/unsaved-changes';
import type { CreationErrors } from '../../src/lib/core/creation';
import { taskFromDocument, type TaskDocument } from '../../src/lib/core/task-document';
import type { Status } from '../../src/lib/core/status';
import type { StepButtons } from '../../src/lib/core/current-step';
import type { MinimalLine } from '../../src/lib/core/minimal-version';
import type { HistoryGroup } from '../../src/lib/core/history';
import { taskData } from '../../src/lib/core/task-data';
import { minimalModeOn, type MinimalModeDocument } from '../../src/lib/core/minimal-mode';
import type { Completion, Task } from '../../src/lib/core/task';

/** What is stored: the task documents, and the completions. */
export interface Saved {
	docs: TaskDocument[];
	completions: Completion[];
}

/** State of a scenario run: an in-memory repository. */
export interface World extends Saved {
	nextId: number;
	/** The text whose drawing font is being asked about (§6). */
	text?: string;
	/** Rejection of the last creation or edit. */
	errors?: CreationErrors;
	/** What was stored just before my last change: what another device "without seeing that change" sees. */
	beforeMyChange?: Saved;
	completionsPrevious?: Completion[];
	newCompletion?: Completion;
	momentOfNewCompletion?: Date;
	statuses: Status[];
	/** The moments at which the status was queried (in the order of `statuses`) or Pendientes. */
	statusMoments: Date[];
	/** The rows of Pendientes, from top to bottom, at each queried moment. */
	pendingQueries: RowQueried[][];
	/** The "Mostrar completadas" check of this device; without it, at its initial value. */
	showCompleted?: boolean;
	/** The "Mostrar pausadas" check of this device (§6.1); without it, at its initial value. */
	showPaused?: boolean;
	/** The state of the minimal mode (§5.8, §7), a single value synced between devices; without the document, the mode is off. */
	minimalMode?: MinimalModeDocument;
	/** The open edit panel (§6.2): the pause button it offers, the pause text it says and, if it was opened at a given moment, what it says about the postponement. */
	panel?: { pause: 'pausar' | 'reanudar' | undefined; pauseText?: string; postponement?: { button: 'posponer' | 'quitar' | undefined; text: string | undefined }; changes: PanelChanges };
	/** The undo notice (§5.4) is in view: it does not depend on the panel, it stays open even if the panel closes. */
	noticeOfUndoOpen?: boolean;
	/** Back was already tapped with the panel open (§6.2). */
	tapBack?: boolean;
	/** The checkbox was already tapped: "the task has N completions" verifies instead of declaring. */
	checkboxTouched?: boolean;
	/** What was deleted (tasks and completions), to name it after deletion. */
	deleted: Saved;
	/** The notice of this device's last completion. */
	notice?: Notice;
	/** The notice that was in view at the last queried moment (notice: undefined if there was none). */
	noticeQueried?: { notice?: Notice; now: Date };
	/** The History at the last queried moment. */
	history?: HistoryGroup[];
	/** The text of "Última vez" at the last queried moment. */
	lastTime?: string;
	/** The recent emojis of the picker on this device; without them, they have not been declared yet. */
	recent?: string[];
	/** There was already an action on the recents: the steps "the recent emojis are" and "there are N" verify instead of declaring. */
	wasActionOnRecent?: boolean;
	/** The emoji that was chosen without naming it in the step, and the oldest of the previous recents. */
	emojiChosen?: string;
	emojiMoreOld?: string;
	recentBefore?: string[];
	/** When each thing arrives in this opening of the app (§6.6). */
	opening?: AppOpening;
}

/** A font at opening: at which second it becomes ready or fails, and whether it could come from the device offline. */
export interface OpeningFont {
	arrives: number;
	failure: number;
	saved: boolean;
}

/** What the loading-screen steps declare, in seconds since startup (§6.6). */
export interface AppOpening {
	session: boolean;
	withoutConnection: boolean;
	losesConnection: number;
	auth: number;
	tasks: number;
	completions: number;
	/** When the first response of the state of the minimal mode arrives (§6.6); by default, at once. */
	minimalMode: number;
	atkinson: OpeningFont;
	noto: OpeningFont;
	remembered: boolean;
	versionChangeSet: boolean;
}

/** What was written in the panel and what it has on top (§6.2, Cambios sin guardar y Atrás). */
export interface PanelChanges {
	/** The task it was opened with; without it, the panel was opened to create. */
	taskOnOpen?: Task;
	onOpen: PanelForm;
	form: PanelForm;
	top: OnTop;
	/** The action of the open action notice. */
	action?: PanelAction;
	/** The last known moment, if a step gave it. */
	now?: Date;
	keyboardOpen: boolean;
}

/** What is seen of a Pendientes row: the title, whether it looks completed or paused, and the date text. */
export interface RowQueried {
	title: string;
	completed: boolean;
	paused: boolean;
	/** The date and distance text («Tocaba …», «Vuelve …», §6.1); without it, the row does not show it. */
	dateText: string | undefined;
	/** The step line of the row, «Primer paso: …» or «Paso: …» (§6.1); without it, the row does not show it. */
	firstStepText: string | undefined;
	/** The «Paso anterior» and «Hecho» buttons of the step line (§6.1); without them, the row does not show them. */
	stepButtons: StepButtons | undefined;
	/** The «Mínima: …» line of the row and whether «Hice la mínima» is enabled (§6.1); without it, the row does not show it. */
	minimal: MinimalLine | undefined;
}

/** Whether the minimal mode is on in this scenario. */
export const minimalOn = (world: World): boolean => minimalModeOn(world.minimalMode);

/** The subject of the other-device steps: it acts on what was stored before my last change. */
export const OTHER = 'another device, without seeing that change,';

function changesOnOpen(onOpen: PanelForm, taskOnOpen?: Task, now?: Date): PanelChanges {
	return { taskOnOpen, onOpen, form: onOpen, top: 'nothing', now, keyboardOpen: false };
}

/** Spec §6.2: when editing, the panel opens with the current values of the task. */
export function changesOnEdit(task: Task, now?: Date): PanelChanges {
	return changesOnOpen({ data: taskData(task) }, task, now);
}

/** Spec §6.2: when creating, the panel opens with the values of `data`. */
export function changesOnCreate(data: PanelForm['data']): PanelChanges {
	return changesOnOpen({ data });
}

/** A supported step: the runtime dispatches it with the captures already resolved. */
export interface StepDefinition {
	pattern: RegExp;
	run: (world: World, ...values: string[]) => void;
}

export function createWorld(): World {
	return {
		docs: [],
		completions: [],
		nextId: 1,
		statuses: [],
		statusMoments: [],
		pendingQueries: [],
		deleted: { docs: [], completions: [] }
	};
}

export function newId(world: World, prefix: string): string {
	return `${prefix}-${world.nextId++}`;
}

/** Only what is stored, without the rest of the scenario state. */
export const copyOf = ({ docs, completions }: Saved): Saved => ({ docs, completions });

/** The tasks described by the stored documents. */
export function tasksOf(saved: Saved): Task[] {
	return saved.docs.map(taskFromDocument);
}

/** The only stored task. */
export function theTask(saved: Saved): Task {
	const tasks = tasksOf(saved);
	if (tasks.length !== 1) throw new Error(`Expected one task, found ${tasks.length}`);
	return tasks[0];
}

/** The document of the only task, with whatever fields it has even if they do not match its kind. */
export function theDoc(world: World): TaskDocument {
	return world.docs.find(({ id }) => id === theTask(world).id) as TaskDocument;
}

export function theTaskOfKind<T extends Task['kind']>(world: World, kind: T): Extract<Task, { kind: T }> {
	const task = theTask(world);
	if (task.kind !== kind) throw new Error(`Expected one ${kind} task, it is ${task.kind}`);
	return task as Extract<Task, { kind: T }>;
}

/** The only stored task with that title. */
export function theTaskTitled(saved: Saved, title: string): Task {
	const withThatTitle = tasksOf(saved).filter((task) => task.title === title);
	if (withThatTitle.length !== 1) throw new Error(`Expected one task "${title}", found ${withThatTitle.length}`);
	return withThatTitle[0];
}

/**
 * What another device saw: what was stored before my last change. If
 * I have not made any change yet, it saw everything stored.
 */
export function thatSawOther(world: World): Saved {
	return world.beforeMyChange ?? copyOf(world);
}

export function rememberBeforeOfMyChange(world: World): void {
	world.beforeMyChange = copyOf(world);
}

/**
 * A change from the other device reaches what is stored and also what
 * it sees: its following changes take it into account.
 */
export function otherRecord(world: World, apply: (saved: Saved) => Saved): void {
	Object.assign(world, apply(copyOf(world)));
	if (world.beforeMyChange) world.beforeMyChange = apply(world.beforeMyChange);
}

/** Removes from storage the documents and completions with those ids, and remembers what was deleted. */
export function deleteSaved(world: World, docIds: readonly string[], completionIds: readonly string[]): void {
	const deletes = ({ id }: { id: string }, ids: readonly string[]) => ids.includes(id);
	world.deleted = {
		docs: [...world.deleted.docs, ...world.docs.filter((d) => deletes(d, docIds))],
		completions: [...world.deleted.completions, ...world.completions.filter((c) => deletes(c, completionIds))]
	};
	world.docs = world.docs.filter((d) => !deletes(d, docIds));
	world.completions = world.completions.filter((c) => !deletes(c, completionIds));
}

/** Everything that was stored at some point: what exists and what was deleted. */
export function thatWasSaved(world: World): Saved {
	return {
		docs: [...world.docs, ...world.deleted.docs],
		completions: [...world.completions, ...world.deleted.completions]
	};
}
