<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { newId } from '#lib/adapters/ids.ts';
	import { now as currentTime, observeClock } from '#lib/adapters/clock.ts';
	import {
		deleteCompletion,
		deleteTask,
		saveChange,
		saveCompletion,
		saveTask,
		saveMinimalMode,
		saveResumes,
		observeMinimalMode,
		cleanOrphanCompletions,
		observeCompletions,
		observeTasks
	} from '#lib/adapters/repository.ts';
	import { noticeOnComplete, visibleNotice, completionToUndo, rescheduleToUndo, msUntilDue, noticeReturn, noticeText, type SlotNotice } from '#lib/core/notice.ts';
	import { confirmReschedule } from '#lib/core/block-reschedule.ts';
	import { deletion, orphanCompletions, taskExists } from '#lib/core/deletion.ts';
	import { checkboxAction } from '#lib/core/checkbox.ts';
	import { complete } from '#lib/core/completions.ts';
	import { doTheMinimal as doTheMinimalFromCore } from '#lib/core/minimal-version.ts';
	import { doneAction, changeOnDeleteCompletion, changeOnComplete, previousStepChange } from '#lib/core/current-step.ts';
	import { pauseAction, pauseText } from '#lib/core/pause.ts';
	import { postponeAction, postponementText } from '#lib/core/postponement-in-panel.ts';
	import { taskData } from '#lib/core/task-data.ts';
	import type { PanelForm } from '#lib/core/unsaved-changes.ts';
	import { createFromPanel, editFromPanel } from '#lib/core/unsaved-changes-saved.ts';
	import { minimalModeOn, resumesOnTurningOff, type MinimalModeDocument } from '#lib/core/minimal-mode.ts';
	import { itemsToAttempt, retriesWith, attemptResult } from '#lib/core/cleanups.ts';
	import type { TaskChange } from '#lib/core/task-document.ts';
	import type { Completion, Task } from '#lib/core/task.ts';
	import { lastTime } from '#lib/core/last-time.ts';
	import { onlineState } from './online.svelte.ts';
	import UndoNotice from './UndoNotice.svelte';
	import NoConnectionStrip from './NoConnectionStrip.svelte';
	import TaskPanel from './TaskPanel.svelte';
	import type { CollectionsResponded } from './LoadingScreen.svelte';
	import { shareSession } from './session';

	let {
		uid,
		onCollectionsResponded,
		children
	}: { uid: string; onCollectionsResponded: (responded: CollectionsResponded) => void; children: Snippet } = $props();

	let tasks = $state<Task[]>([]);
	let completions = $state<Completion[]>([]);
	/** Until the collections have answered, a missing task does not mean it was deleted. */
	let tasksLoaded = $state(false);
	let completionsLoaded = $state(false);
	/** The first response of the mode document (§6.6); without a document, the mode is off. */
	let minimalModeDoc = $state.raw<MinimalModeDocument | undefined>(undefined);
	let minimalModeLoaded = $state(false);
	const minimalMode = $derived(minimalModeOn(minimalModeDoc));
	let now = $state(currentTime());
	/** The notice of this device's last completion; it follows the change of screen. */
	let notice = $state.raw<SlotNotice | undefined>(undefined);
	const displayedNotice = $derived(visibleNotice(notice, now));
	/**
	 * The task open in the edit panel, as it was when opened: the edit
	 * is compared with it, so only the fields I changed are written.
	 */
	let edited = $state.raw<Task | undefined>(undefined);
	/** If the task is deleted (for example, on another device) the panel closes by itself. */
	const editedExists = $derived(edited !== undefined && taskExists(tasks, edited.id));
	/** Orphans already sent to clean up, so they are not repeated on every snapshot. */
	const orphansBeingCleaned = new Set<string>();

	onMount(() => {
		const unsubscribers = [
			observeTasks(uid, (currentItems) => {
				tasks = currentItems;
				tasksLoaded = true;
			}),
			observeCompletions(uid, (currentItems) => {
				completions = currentItems;
				completionsLoaded = true;
			}),
			observeMinimalMode(uid, (state) => {
				minimalModeDoc = state;
				minimalModeLoaded = true;
			}),
			observeClock((current) => (now = current))
		];
		return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
	});

	// Spec §6.6: the loading screen waits for the first response of each collection.
	$effect(() => {
		onCollectionsResponded({ tasks: tasksLoaded, completions: completionsLoaded, minimalMode: minimalModeLoaded });
	});

	/** Changes when the connection returns: the cleanup effects read it to retry. */
	const connection = onlineState();

	/** Goes up when an attempt ends having changed the data (or the connection) during it: the cleanup effects read it and re-evaluate. */
	let reevaluate = $state(0);
	/** Sets `...BeingCleaned` whose effect ran while an attempt was in progress, skipping elements. */
	const skipped = new WeakSet<Set<string>>();

	/**
	 * §7: attempts the elements with no attempt in progress; when finished (whether it fails or not) it removes them
	 * from the set, so the effect retries them when the data changes or the connection returns.
	 * If the effect ran during the attempt (the data changed) and skipped elements, when it finishes
	 * it re-evaluates once; a failure with no change of data or connection does not retry (no loop).
	 */
	function cleanUp<T>(elements: T[], key: (element: T) => string, inProgress: Set<string>, attempt: (batch: T[]) => Promise<readonly string[]>) {
		const ids = new Set(itemsToAttempt(elements.map(key), inProgress));
		const batch = elements.filter((element) => ids.has(key(element)));
		if (batch.length < elements.length) skipped.add(inProgress);
		if (batch.length === 0) return;
		ids.forEach((id) => inProgress.add(id));
		const attempted = [...ids];
		void attempt(batch)
			.catch(() => attempted)
			.then((failed) => {
				const { cleaned, pendings } = attemptResult(attempted, failed);
				[...cleaned, ...pendings].forEach((id) => inProgress.delete(id));
				if (skipped.delete(inProgress) && retriesWith('dataChanged')) reevaluate++;
			});
	}

	$effect(() => {
		if (!tasksLoaded || !completionsLoaded) return;
		void [connection.value, reevaluate];
		cleanUp(orphanCompletions(tasks, completions), ({ id }) => id, orphansBeingCleaned, (batch) => cleanOrphanCompletions(uid, batch));
	});

	// The notice disappears exactly at 5 seconds, without waiting for the next clock tick.
	$effect(() => {
		if (!displayedNotice) return;
		const expiry = setTimeout(() => (now = currentTime()), msUntilDue(displayedNotice, now));
		return () => clearTimeout(expiry);
	});

	function completeTask(task: Task, existingCompletion?: Completion) {
		if (!existingCompletion) now = currentTime();
		const completion = existingCompletion ?? complete(task, completions, newId(), now);
		notice = noticeOnComplete(task, completion, completions);
		void saveCompletion(uid, completion);
		void saveChange(uid, task.id, changeOnComplete(task));
	}

	/** «Hice la mínima» (§6.1): what the core says, with the same notice and the same step reset as the checkbox. */
	function doTheMinimal(task: Task) {
		now = currentTime();
		const completion = doTheMinimalFromCore(task, completions, newId(), now);
		if (completion) completeTask(task, completion);
	}

	/** Deletes the completion and gives back the task step the core says (§5.4, Pasos: Deshacer). */
	function deleteAndRestoreStep(completion: Completion) {
		const task = tasks.find(({ id }) => id === completion.taskId);
		void deleteCompletion(uid, completion.id);
		// The visible task may not yet reflect the reset to step 1 from completing it (that write
		// is still on its way): it is taken with no known saved step (0 is no step), so the core
		// always gives the step to write instead of believing the task is already on it.
		if (task) void saveChange(uid, task.id, changeOnDeleteCompletion({ ...task, currentStep: 0 }, completions, completion));
	}

	/** «Hecho» of the row (§6.1): moves to the next step or, on the last one, completes like the checkbox. */
	function tapDone(task: Task) {
		const action = doneAction(task, completions, currentTime());
		if (action.kind === 'advance') void saveChange(uid, task.id, action.change);
		else if (action.kind === 'complete') completeTask(task);
	}

	/** No notice on deleting: the checkbox already undoes (§6.1). */
	function tapCheckbox(task: Task) {
		const action = checkboxAction(task, completions, currentTime());
		if (action.kind === 'complete') completeTask(task);
		else if (action.kind === 'remove') deleteAndRestoreStep(action.completion);
	}

	function undo() {
		const resumes = rescheduleToUndo(notice, currentTime(), tasks);
		if (resumes) {
			notice = undefined;
			void saveResumes(uid, resumes);
			return;
		}
		const completion = completionToUndo(notice, currentTime());
		notice = undefined;
		if (completion) deleteAndRestoreStep(completion);
	}

	function create(form: PanelForm) {
		const result = createFromPanel(form, newId(), currentTime());
		if (!result.ok) return result.errors;
		void saveTask(uid, result.task);
	}

	function saveEdit(task: Task, form: PanelForm) {
		const result = editFromPanel(task, form, currentTime(), minimalMode);
		if (!result.ok) return result.errors;
		edited = undefined;
		void saveChange(uid, task.id, result.change);
	}

	/** Spec §6.2: pausar, reanudar, posponer and quitar posponer act and close the panel. */
	function act(task: Task, change: TaskChange) {
		edited = undefined;
		void saveChange(uid, task.id, change);
	}

	/** Spec §6.1 and §7: turning it off brings back, in the same batch, what the core says; turning it on writes only the state. */
	function toggleMinimalMode() {
		const turningOff = minimalMode;
		void saveMinimalMode(uid, !turningOff, turningOff ? resumesOnTurningOff(tasks, currentTime()) : []);
	}

	/** Spec §5.11 and §7: reschedules what the core says at this moment, in a single batch, and shows the notice of §5.4. */
	function reschedule() {
		now = currentTime();
		const { changes, notice: rescheduled } = confirmReschedule(tasks, completions, now, minimalMode);
		if (changes.length === 0) return;
		notice = rescheduled;
		void saveResumes(uid, changes);
	}

	function deleteEdited(task: Task) {
		edited = undefined;
		void deleteTask(uid, deletion(task.id, completions));
	}

	shareSession({
		get tasks() {
			return tasks;
		},
		get completions() {
			return completions;
		},
		get now() {
			return now;
		},
		get minimalMode() {
			return minimalMode;
		},
		toggleMinimalMode,
		reschedule,
		tapCheckbox,
		tapDone,
		doTheMinimal,
		previousStep: (task) => void saveChange(uid, task.id, previousStepChange(task)),
		create,
		openTask: (task) => (edited = task),
		deleteCompletion: deleteAndRestoreStep
	});
</script>

<NoConnectionStrip />

{@render children()}

{#if displayedNotice}
	<UndoNotice text={noticeText(displayedNotice)} returnText={noticeReturn(displayedNotice, now)} onUndo={undo} />
{/if}

{#if edited && editedExists}
	{@const openedTask = edited}
	<!-- Actions are decided with the task as of now: if another device changes it, the panel updates them (§6.2). -->
	{@const active = tasks.find(({ id }) => id === openedTask.id) ?? openedTask}
	{#key openedTask}
		<TaskPanel
			header="Editar tarea"
			initial={taskData(openedTask)}
			lastTime={lastTime(openedTask.id, completions, now)}
			task={openedTask}
			onSave={(form) => saveEdit(openedTask, form)}
			onClose={() => (edited = undefined)}
			onDelete={() => deleteEdited(openedTask)}
			onAct={(change) => act(openedTask, change)}
			pause={pauseAction(active, minimalMode)}
			pauseText={pauseText(active, minimalMode)}
			postpone={postponeAction(active, completions, now, minimalMode)}
			postponedText={postponementText(active, now)}
		/>
	{/key}
{/if}
