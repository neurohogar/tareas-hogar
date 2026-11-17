<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { page } from '$app/state';
	import {
		deleteAnnotation,
		changeAnnotationText,
		saveAnnotation,
		cleanOrphanAnnotations,
		observeAnnotations
	} from '#lib/adapters/annotations.ts';
	import { newId } from '#lib/adapters/ids.ts';
	import { now as currentTime, observeClock } from '#lib/adapters/clock.ts';
	import {
		deleteCompletion,
		deleteTask,
		saveChange,
		saveCompletion,
		saveTask,
		cleanOrphanCompletions,
		observeCompletions,
		observeTasks
	} from '#lib/adapters/repository.ts';
	import { noticeOnComplete, visibleNotice, completionToUndo, msUntilDue, noticeReturn, noticeText, type Notice } from '#lib/core/notice.ts';
	import { annotate, editText, type Annotation, type CurrentScreen, type Sense } from '#lib/core/annotation.ts';
	import { orphanAnnotations, deletion, orphanCompletions, taskExists } from '#lib/core/deletion.ts';
	import { checkboxAction } from '#lib/core/checkbox.ts';
	import { complete } from '#lib/core/completions.ts';
	import { doTheMinimal as doTheMinimalFromCore } from '#lib/core/minimal-version.ts';
	import { doneAction, changeOnDeleteCompletion, changeOnComplete, previousStepChange } from '#lib/core/current-step.ts';
	import { pauseAction } from '#lib/core/pause.ts';
	import { postponeAction, postponementText } from '#lib/core/postponement-in-panel.ts';
	import { taskData } from '#lib/core/task-data.ts';
	import type { PanelForm } from '#lib/core/unsaved-changes.ts';
	import { createFromPanel, editFromPanel } from '#lib/core/unsaved-changes-saved.ts';
	import { itemsToAttempt, retriesWith, attemptResult } from '#lib/core/cleanups.ts';
	import type { TaskChange } from '#lib/core/task-document.ts';
	import type { Completion, Task } from '#lib/core/task.ts';
	import { lastTime } from '#lib/core/last-time.ts';
	import { onlineState } from './online.svelte.ts';
	import UndoNotice from './UndoNotice.svelte';
	import NoConnectionStrip from './NoConnectionStrip.svelte';
	import Annotate from './Annotate.svelte';
	import Navigation from './Navigation.svelte';
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
	let annotations = $state<Annotation[]>([]);
	let annotationsLoaded = $state(false);
	/** El recuadro de Anotar (§5.10) y el panel de edición abierto, si lo hay (con su tarea al editar). */
	let annotating = $state(false);
	let panel = $state.raw<{ taskId?: string } | undefined>(undefined);
	const annotationsBeingCleaned = new Set<string>();
	/** Hasta que las colecciones respondieron, faltar una tarea no significa que se borró. */
	let tasksLoaded = $state(false);
	let completionsLoaded = $state(false);
	let now = $state(currentTime());
	/** El aviso del último completado de este dispositivo; sigue al cambiar de pantalla. */
	let notice = $state.raw<Notice | undefined>(undefined);
	const displayedNotice = $derived(visibleNotice(notice, now));
	/**
	 * La tarea abierta en el panel de edición, como estaba al abrirlo: la edición
	 * se compara con ella, así solo se escriben los campos que cambié.
	 */
	let edited = $state.raw<Task | undefined>(undefined);
	/** Si la tarea se borra (por ejemplo, en otro dispositivo) el panel se cierra solo. */
	const editedExists = $derived(edited !== undefined && taskExists(tasks, edited.id));
	/** Huérfanos que ya se mandaron a limpiar, para no repetirlos en cada snapshot. */
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
			observeAnnotations(uid, (currentItems) => {
				annotations = currentItems;
				annotationsLoaded = true;
			}),
			observeClock((current) => (now = current))
		];
		return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
	});

	// Spec §6.6: la pantalla de carga espera la primera respuesta de cada colección.
	$effect(() => {
		onCollectionsResponded({ tasks: tasksLoaded, completions: completionsLoaded });
	});

	/** Cambia al volver la conexión: los efectos de limpieza la leen para reintentar. */
	const connection = onlineState();

	/** Sube cuando un intento termina habiendo cambiado los datos (o la conexión) durante él: los efectos de limpieza la leen y se reevalúan. */
	let reevaluate = $state(0);
	/** Conjuntos `…EnLimpieza` cuyo efecto corrió mientras había un intento en curso, saltando elementos. */
	const skipped = new WeakSet<Set<string>>();

	/**
	 * §7: intenta los elementos sin intento en curso; al terminar (falle o no) los saca
	 * del conjunto, así el efecto los reintenta al cambiar los datos o volver la conexión.
	 * Si el efecto corrió durante el intento (cambiaron los datos) y saltó elementos, al terminar
	 * se reevalúa una vez; un fallo sin cambio de datos ni de conexión no reintenta (sin bucle).
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
				if (skipped.delete(inProgress) && retriesWith('cambian los datos')) reevaluate++;
			});
	}

	$effect(() => {
		if (!tasksLoaded || !completionsLoaded) return;
		void [connection.value, reevaluate];
		cleanUp(orphanCompletions(tasks, completions), ({ id }) => id, orphansBeingCleaned, (batch) => cleanOrphanCompletions(uid, batch));
	});

	// Spec §7: las anotaciones huérfanas se ignoran y se limpian.
	$effect(() => {
		if (!tasksLoaded || !annotationsLoaded) return;
		void [connection.value, reevaluate];
		cleanUp(orphanAnnotations(tasks, annotations), ({ id }) => id, annotationsBeingCleaned, (batch) => cleanOrphanAnnotations(uid, batch));
	});

	// El aviso desaparece justo a los 5 segundos, sin esperar al próximo tic del reloj.
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

	/** «Hice la mínima» (§6.1): lo que dice el core, con el mismo aviso y el mismo reinicio de paso que el checkbox. */
	function doTheMinimal(task: Task) {
		now = currentTime();
		const completion = doTheMinimalFromCore(task, completions, newId(), now);
		if (completion) completeTask(task, completion);
	}

	/** Borra el completado y devuelve el paso de la tarea que dice el core (§5.4, Pasos: Deshacer). */
	function deleteAndRestoreStep(completion: Completion) {
		const task = tasks.find(({ id }) => id === completion.taskId);
		void deleteCompletion(uid, completion.id);
		// La tarea que se ve puede no reflejar todavía el reinicio al paso 1 de completarla (esa escritura
		// sigue en camino): se la toma sin paso guardado conocido (0 no es ningún paso), así el core
		// siempre da el paso a escribir en lugar de creer que la tarea ya está en él.
		if (task) void saveChange(uid, task.id, changeOnDeleteCompletion({ ...task, currentStep: 0 }, completions, completion));
	}

	/** «Hecho» de la fila (§6.1): pasa al paso siguiente o, en el último, completa como el checkbox. */
	function tapDone(task: Task) {
		const action = doneAction(task, completions, currentTime());
		if (action.kind === 'avanzar') void saveChange(uid, task.id, action.change);
		else if (action.kind === 'completar') completeTask(task);
	}

	/** Sin aviso al borrar: el checkbox ya deshace (§6.1). */
	function tapCheckbox(task: Task) {
		const action = checkboxAction(task, completions, currentTime());
		if (action.kind === 'completar') completeTask(task);
		else if (action.kind === 'borrar') deleteAndRestoreStep(action.completion);
	}

	function undo() {
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
		const result = editFromPanel(task, form, currentTime());
		if (!result.ok) return result.errors;
		edited = undefined;
		void saveChange(uid, task.id, result.change);
	}

	/** Spec §6.2: pausar, reanudar, posponer y quitar posponer actúan y cierran el panel. */
	function act(task: Task, change: TaskChange) {
		edited = undefined;
		void saveChange(uid, task.id, change);
	}

	function deleteEdited(task: Task) {
		edited = undefined;
		void deleteTask(uid, deletion(task.id, completions, annotations));
	}

	const SCREENS: Record<string, CurrentScreen> = { '/historial': 'Historial', '/anotaciones': 'Anotaciones' };

	/** Segundo toque (§5.10): el core toma el contexto de la pantalla, el panel y el aviso. */
	function annotateNow(sense: Sense, text: string) {
		now = currentTime();
		const screen = SCREENS[page.url.pathname] ?? 'Pendientes';
		const annotation = annotate(newId(), sense, now, { screen, ...(panel && { panel: { ...(panel.taskId !== undefined && { taskId: panel.taskId }) } }), ...(notice && { notice }) }, text);
		annotating = false;
		void saveAnnotation(uid, annotation);
	}

	/** Editar texto (§6.7): el core decide cómo queda el texto; la anotación que ya no está no se revive. */
	function editAnnotationText(annotation: Annotation, text: string) {
		const edited = editText(annotations, annotation.id, text).find(({ id }) => id === annotation.id);
		if (edited) void changeAnnotationText(uid, edited.id, edited.text);
	}

	function panelOpened(taskId: string | undefined) {
		const thisPanel = taskId === undefined ? {} : { taskId };
		panel = thisPanel;
		return () => {
			if (panel === thisPanel) panel = undefined;
		};
	}

	shareSession({
		get annotations() {
			return annotations;
		},
		get hasPanel() {
			return panel !== undefined;
		},
		get annotating() {
			return annotating;
		},
		openAnnotate: () => (annotating = true),
		closeAnnotate: () => (annotating = false),
		annotate: annotateNow,
		panelOpened,
		editAnnotationText,
		deleteAnnotation: (annotation) => void deleteAnnotation(uid, annotation.id),
		get tasks() {
			return tasks;
		},
		get completions() {
			return completions;
		},
		get now() {
			return now;
		},
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
<Navigation />
<Annotate />

{@render children()}

{#if displayedNotice}
	<UndoNotice text={noticeText(displayedNotice)} returnText={noticeReturn(displayedNotice, now)} onUndo={undo} />
{/if}

{#if edited && editedExists}
	{@const openedTask = edited}
	<!-- Las acciones se deciden con la tarea de ahora: si otro dispositivo la cambia, el panel las actualiza (§6.2). -->
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
			pause={pauseAction(active)}
			postpone={postponeAction(active, completions, now)}
			postponedText={postponementText(active, now)}
		/>
	{/key}
{/if}
