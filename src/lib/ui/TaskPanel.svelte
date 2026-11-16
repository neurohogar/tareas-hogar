<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import type { CreationErrors } from '#lib/core/creation.ts';
	import { DATA_ON_CREATE, type TaskData } from '#lib/core/task-data.ts';
	import { actionNotice, discardAndAct, saveAndAct, type NoticeAction } from '#lib/core/action-notice.ts';
	import { changeOfAction, whatTheActionDoes, type PanelAction } from '#lib/core/panel-action.ts';
	import { whatBackDoes, type OnTop } from '#lib/core/panel-back.ts';
	import { hasChanges, type PanelForm, type PanelValues } from '#lib/core/unsaved-changes.ts';
	import { onClosePanel, CLOSE_NOTICE, type NoticeButton } from '#lib/core/unsaved-changes-notice.ts';
	import type { TaskChange } from '#lib/core/task-document.ts';
	import type { Label } from '#lib/core/label.ts';
	import { taskName } from '#lib/core/task-name.ts';
	import type { Weekday, Effort, Task, Unit } from '#lib/core/task.ts';
	import { takeBack } from '#lib/adapters/back.ts';
	import { confirmOnLeave } from '#lib/adapters/confirm-on-leave.ts';
	import { newId } from '#lib/adapters/ids.ts';
	import { readRecents, rememberRecent } from '#lib/adapters/recents.ts';
	import { now as currentTime } from '#lib/adapters/clock.ts';
	import UnsavedChangesNotice from './UnsavedChangesNotice.svelte';
	import TabBar from './TabBar.svelte';
	import { NAME_MESSAGES } from './label-messages';
	import ActionsSection from './ActionsSection.svelte';
	import WhenSection, { type WindowRow } from './WhenSection.svelte';
	import TaskSection from './TaskSection.svelte';
	import EmojiPicker from './EmojiPicker.svelte';
	import Icon from './icons/Icon.svelte';
	import { useSession } from './session';
	import { observeKeyboard, type KeyboardState } from '#lib/adapters/keyboard.ts';
	import {
		saveBarVisible,
		fieldsWithError,
		destinationOnSaveFailure,
		TAB_ON_OPEN,
		panelPresentation,
		repetitionOnOpen,
		panelSections,
		markedSections,
		type ErrorDestination,
		type RepetitionOption,
		type PanelSection
	} from '#lib/core/panel-tabs.ts';

	let {
		header,
		initial,
		task,
		initialLabels = [],
		lastTime,
		onSave,
		onClose,
		onDelete,
		onAct,
		pause,
		postpone,
		postponedText
	}: {
		header: string;
		/** Los valores actuales de la tarea que se edita; sin ellos, el panel arranca vacío (crear). */
		initial?: TaskData;
		/** Solo al editar: la tarea como estaba al abrir el panel. */
		task?: Task;
		/** Los nombres de las etiquetas que tiene la tarea que se edita. */
		initialLabels?: string[];
		/** Solo al editar: el texto de "Última vez" que calcula el core (§6.2). */
		lastTime?: string;
		/** Guarda el formulario; si algo es inválido devuelve los errores y el panel sigue abierto. */
		onSave: (form: PanelForm) => CreationErrors | undefined;
		onClose: () => void;
		/** Solo al editar: borra la tarea, ya confirmado. */
		onDelete?: () => void;
		/** Solo al editar: ejecuta una acción (con lo guardado, si pasó por el aviso) y cierra el panel. */
		onAct?: (change: TaskChange, newLabels: Label[]) => void;
		/** Solo al editar una periódica (§6.2): el botón que ofrece el core. */
		pause?: 'pausar' | 'reanudar';
		/** Solo al editar (§6.2): el botón que ofrece el core. */
		postpone?: 'posponer' | 'quitar';
		/** "Pospuesta hasta HH:MM" que arma el core, si la tarea está pospuesta. */
		postponedText?: string;
	} = $props();

	// Los valores con que abre el panel: se toman una vez, aunque la tarea cambie mientras está abierto.
	// Cada control arranca con el valor de la tarea solo si es de su forma: los de las otras opciones
	// de "Se repite" empiezan como al crear.
	const values = untrack(() => initial);
	const name = values && taskName(values);
	const initialDueDate = values?.shape === 'puntual' ? (values.dueDate ?? '') : '';
	const initialEvery = values?.shape === 'relativa' ? String(values.every) : '';
	const initialUnit: Unit = values?.shape === 'relativa' ? values.unit : 'horas';

	let repetition = $state<RepetitionOption>(repetitionOnOpen(values));
	let weekdays = $state<Weekday[]>(values?.shape === 'calendario' ? [...values.weekdays] : []);
	let monthDays = $state<number[]>(values?.shape === 'calendario' ? [...values.monthDays] : []);
	let labels = $state<string[]>(untrack(() => [...initialLabels]));
	let labelsError = $state<string | undefined>(undefined);
	/** El texto de Etiquetas que todavía no se confirmó. */
	let unconfirmed = $state('');
	let errors = $state<CreationErrors>({});
	let confirmingDelete = $state(false);
	let emoji = $state(untrack(() => initial?.emoji ?? ''));
	let effort = $state<Effort | ''>(untrack(() => initial?.effort ?? ''));
	/** "Solo en un horario": apagado, la tarea no tiene horario (§6.2). */
	let withSchedule = $state(values?.schedule !== undefined);
	/** Los pasos más (2, 3…), uno por campo; Agregar paso suma uno vacío (§6.2). */
	let steps = $state<string[]>(untrack(() => [...(initial?.steps ?? [])]));
	/** Las filas Desde/Hasta: al menos una; Agregar horario suma una vacía (§6.2). */
	let windowRows = $state<WindowRow[]>(values?.schedule?.map(({ from = '', to = '' }) => ({ from, to })) ?? [{ from: '', to: '' }]);

	/** Los recientes del selector mientras está abierto; sin selector abierto, undefined. */
	let recents = $state<string[] | undefined>(undefined);

	function openPicker() {
		recents = readRecents();
	}

	function chooseEmoji(chosen: string) {
		emoji = chosen;
		rememberRecent(chosen);
		recents = undefined;
	}

	/**
	 * Un campo de fecha vacío es "sin fecha límite"; uno incompleto (badInput)
	 * también tiene valor vacío, pero se le pasa al core para que lo rechace.
	 */
	function dueDateOf(field: HTMLInputElement): string | undefined {
		return field.value === '' && !field.validity.badInput ? undefined : field.value;
	}

	/** Solo cuentan los campos de la opción elegida en "Se repite". */
	function taskDataFromForm(form: HTMLFormElement): TaskData {
		const fields = new FormData(form);
		// La nota se lee del control, no de FormData, que cambia los saltos de línea por CRLF.
		const note = (form.elements.namedItem('note') as HTMLTextAreaElement).value;
		const firstStep = String(fields.get('firstStep') ?? '');
		const minimalVersion = String(fields.get('minimalVersion') ?? '');
		const schedule = withSchedule ? windowRows.map(({ from, to }) => ({ from, to })) : undefined;
		const common = { title: String(fields.get('title') ?? ''), emoji, note, firstStep, minimalVersion, steps: [...steps], schedule, ...(effort && { effort }) };
		if (repetition === 'puntual') {
			const dateField = form.elements.namedItem('dueDate') as HTMLInputElement;
			return { shape: 'puntual', ...common, dueDate: dueDateOf(dateField) };
		}
		if (repetition === 'relativo') {
			const every = Number(fields.get('every') || Number.NaN);
			return { shape: 'relativa', ...common, every, unit: fields.get('unit') as Unit };
		}
		const days = repetition === 'semanal' ? { weekdays, monthDays: [] } : { weekdays: [], monthDays };
		return { shape: 'calendario', ...common, ...days };
	}

	let windowWidth = $state(window.innerWidth);
	const remInPx = () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
	const presentation = $derived(panelPresentation(windowWidth / remInPx()));
	const sections = $derived(panelSections(onDelete ? 'editar' : 'crear'));
	let openSection = $state<PanelSection>(TAB_ON_OPEN);
	let content: HTMLDivElement;

	const withError = $derived(fieldsWithError(errors, repetition, labelsError !== undefined));
	const marked = $derived(markedSections(withError));

	let keyboard = $state<KeyboardState>({ open: false, overlap: 0 });
	const barVisible = $derived(saveBarVisible(keyboard.open));
	onMount(() => observeKeyboard((status) => (keyboard = status)));

	// El aviso de deshacer se ve sobre la barra de Guardar o, sin barra, sobre el teclado.
	$effect(() => {
		const root = document.documentElement.style;
		root.setProperty('--notice-base', keyboard.open ? `calc(${keyboard.overlap}px + 1rem)` : '5.5rem');
		return () => root.removeProperty('--notice-base');
	});

	async function chooseTab(section: PanelSection) {
		openSection = section;
		await tick();
		content.scrollTop = 0;
	}

	async function goToField({ tab, field }: ErrorDestination) {
		if (tab) openSection = tab;
		await tick();
		content.querySelector(`[data-field="${field}"]`)?.scrollIntoView({ block: 'center' });
	}

	/** El error de un campo dura lo que dura su mensaje: al corregirlo se va. */
	function clearError(field: keyof CreationErrors) {
		const { [field]: _removed, ...rest } = errors;
		errors = rest;
	}

	const session = useSession();
	let form: HTMLFormElement;
	/** Los valores con que se abrió el panel; al crear, el formulario como se abre (§6.2). */
	const onOpen: PanelValues = { data: values ?? DATA_ON_CREATE, labels: untrack(() => [...initialLabels]) };
	let closeNoticeOpen = $state(false);
	/** La acción cuyo aviso está abierto, con lo escrito al elegirla. */
	let openAction = $state.raw<{ action: PanelAction; form: PanelForm } | undefined>(undefined);

	function currentForm(): PanelForm {
		return { data: taskDataFromForm(form), labels: [...labels], unconfirmed };
	}
	const hasChangesNow = () => hasChanges(onOpen, currentForm());

	/** Lo que el core necesita para evaluar el aviso de una acción con la tarea y el ahora de este momento. */
	function noticeContext({ action, form }: NonNullable<typeof openAction>, now: Date): NoticeAction {
		const taskWhenOpened = untrack(() => task!);
		return {
			action,
			taskOnOpen: taskWhenOpened,
			task: session.tasks.find(({ id }) => id === taskWhenOpened.id) ?? taskWhenOpened,
			completions: session.completions,
			now,
			form,
			existings: session.labels
		};
	}
	const shownActionNotice = $derived(openAction ? actionNotice(noticeContext(openAction, session.now)) : undefined);
	// Si la acción ya no corresponde (otro dispositivo, o pasó el tiempo), el aviso se cierra y queda el panel con lo escrito.
	$effect(() => {
		if (openAction && !shownActionNotice) openAction = undefined;
	});

	function showErrors(newErrors: CreationErrors | undefined) {
		errors = newErrors ?? {};
		if (errors.labels) labelsError = NAME_MESSAGES[errors.labels];
		const destination = destinationOnSaveFailure(withError, presentation);
		if (destination) void goToField(destination);
	}

	function submit(event: SubmitEvent) {
		event.preventDefault();
		showErrors(onSave(currentForm()));
	}

	function close() {
		if (onClosePanel(hasChangesNow()) === 'cierra el panel') onClose();
		else closeNoticeOpen = true;
	}

	function chooseInCloseNotice(effect: NoticeButton['effect']) {
		closeNoticeOpen = false;
		if (effect === 'descartar') onClose();
		else if (effect === 'guardar') showErrors(onSave(currentForm()));
	}

	function chooseAction(action: PanelAction) {
		const typed = currentForm();
		if (whatTheActionDoes(action, hasChanges(onOpen, typed)) === 'actúa') onAct?.(changeOfAction(action, currentTime()), []);
		else openAction = { action, form: typed };
	}

	function chooseInActionNotice(effect: NoticeButton['effect']) {
		const openSection = openAction;
		if (!openSection || effect === 'seguir editando') {
			openAction = undefined;
			return;
		}
		const context = noticeContext(openSection, currentTime());
		if (effect === 'descartar') {
			openAction = undefined;
			const change = discardAndAct(context);
			if (change) onAct?.(change, []);
			return;
		}
		const result = saveAndAct(context, newId);
		if (result.result === 'guardado') onAct?.(result.change, result.newLabels);
		else if (result.result === 'rechazado') {
			openAction = undefined;
			showErrors(result.errors);
		} else if (result.result === 'aviso cerrado') openAction = undefined;
	}

	function whatIsOnTop(): OnTop {
		if (session.annotating) return 'recuadro de Anotar';
		if (closeNoticeOpen) return 'aviso de cierre';
		if (openAction) return 'aviso de acción';
		if (confirmingDelete) return 'confirmación de Borrar tarea';
		return recents ? 'selector de emoji' : 'nada';
	}

	/** Atrás con el panel abierto (§6.2); devuelve si el panel sigue abierto. */
	function onBackTap(): boolean {
		const effect = whatBackDoes({ top: whatIsOnTop(), hasChanges: hasChangesNow(), keyboardOpen: keyboard.open });
		if (effect === 'cierra el teclado') (document.activeElement as HTMLElement | null)?.blur();
		else if (effect === 'cierra lo de arriba' && session.annotating) session.closeAnnotate();
		else if (effect === 'cierra lo de arriba') {
			closeNoticeOpen = false;
			openAction = undefined;
			confirmingDelete = false;
			recents = undefined;
		} else if (effect === 'abre el aviso de cierre') closeNoticeOpen = true;
		else {
			onClose();
			return false;
		}
		return true;
	}

	onMount(() => {
		const layer = takeBack(onBackTap);
		const stopConfirming = confirmOnLeave(hasChangesNow);
		const releasePanel = session.panelOpened(task?.id);
		return () => {
			releasePanel();
			layer.release();
			stopConfirming();
		};
	});
</script>

<svelte:window bind:innerWidth={windowWidth} />

<div class="panel main-panel" inert={closeNoticeOpen || openAction !== undefined || confirmingDelete} style:bottom={keyboard.overlap > 0 ? `${keyboard.overlap}px` : undefined} role="dialog" aria-modal="true" aria-labelledby="title-panel">
	<form class="sheet" bind:this={form} class:full={presentation === 'pestanas'} novalidate onsubmit={submit}>
		<header>
			<h2 id="title-panel">{header}</h2>
			<button type="button" class="close" aria-label="Cerrar" onclick={close}><Icon name="close" /></button>
		</header>
		{#if presentation === 'pestanas'}
			<TabBar {sections} {openSection} {marked} onChoose={chooseTab} />
		{/if}

		<div class="content" bind:this={content}>
			<TaskSection
				{presentation}
				{openSection}
				{values}
				{pause}
				{postponedText}
				{lastTime}
				{errors}
				{clearError}
				bind:emoji
				bind:effort
				bind:steps
				bind:labels
				bind:labelsError
				bind:unconfirmed
				onOpenPicker={openPicker}
			/>
			<WhenSection
				{presentation}
				{openSection}
				{errors}
				{clearError}
				bind:repetition
				bind:weekdays
				bind:monthDays
				bind:withSchedule
				bind:windowRows
				{initialDueDate}
				{initialEvery}
				{initialUnit}
			/>
			{#if sections.includes('Acciones')}
				<ActionsSection {presentation} {openSection} {postpone} {pause} onChoose={chooseAction} onRequestDelete={() => (confirmingDelete = true)} />
			{/if}
		</div>

		<div class="save-bar" hidden={!barVisible}>
			<button type="submit" class="primary-button">Guardar</button>
		</div>
	</form>
</div>

{#if recents}
	<EmojiPicker {recents} onChoose={chooseEmoji} onClose={() => (recents = undefined)} />
{/if}

{#if closeNoticeOpen}
	<UnsavedChangesNotice notice={CLOSE_NOTICE} onChoose={chooseInCloseNotice} />
{/if}

{#if shownActionNotice}
	<UnsavedChangesNotice notice={shownActionNotice} onChoose={chooseInActionNotice} />
{/if}

{#if onDelete && confirmingDelete}
	<div class="panel confirmation" role="alertdialog" aria-modal="true" aria-labelledby="title-confirmation">
		<div class="box">
			<p id="title-confirmation">¿Borrar «{name}»? También se borra su historial.</p>
			<div class="actions confirm">
				<button type="button" onclick={() => (confirmingDelete = false)}>Cancelar</button>
				<button type="button" class="primary" onclick={onDelete}>Borrar</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.panel {
		position: fixed;
		inset: 0;
		/* Above the navigation bar (z-index 1), whatever the DOM order. */
		z-index: 2;
		display: grid;
		place-items: end center;
		background: color-mix(in srgb, black 35%, transparent);
	}

	.main-panel {
		top: var(--strip-height, 0px);
	}

	.sheet {
		display: flex;
		flex-direction: column;
		width: min(40rem, 100%);
		max-height: 100%;
		box-sizing: border-box;
		overflow: hidden;
		border-radius: 0.75rem 0.75rem 0 0;
		background: var(--surface);
	}

	.sheet.full {
		width: 100%;
		height: 100%;
		border-radius: 0;
	}

	header {
		display: flex;
		flex: none;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.5rem 0.5rem 0.5rem 1rem;
		border-bottom: 1px solid var(--border);
	}

	h2 {
		margin: 0;
		font-size: 1.1rem;
	}

	.close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 44px;
		min-height: 44px;
		padding: 0;
		border: 1px solid transparent;
		border-radius: 0.4rem;
		background: transparent;
		color: var(--text);
		cursor: pointer;
	}

	.content {
		display: grid;
		flex: 1;
		align-content: start;
		gap: 1.25rem;
		min-height: 0;
		overflow-y: auto;
		padding: 1rem;
	}

	.save-bar[hidden] {
		display: none;
	}

	.save-bar {
		display: flex;
		flex: none;
		padding: 0.75rem 1rem;
		border-top: 1px solid var(--border);
		background: var(--surface);
	}

	.primary-button {
		flex: 1;
		min-height: 44px;
		border: 1px solid var(--accent);
		border-radius: 0.4rem;
		background: var(--accent);
		color: var(--surface);
		font-weight: 600;
		cursor: pointer;
	}

	.confirmation {
		place-items: center;
	}

	.box {
		width: min(24rem, calc(100% - 2rem));
		box-sizing: border-box;
		padding: 1rem;
		border-radius: 0.75rem;
		background: var(--surface);
	}

	.box p {
		margin: 0;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.actions button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 44px;
		padding: 0 1rem;
		border: 1px solid var(--border);
		border-radius: 0.4rem;
		background: transparent;
		color: var(--text);
		cursor: pointer;
	}

	.actions .primary {
		border-color: var(--accent);
		background: var(--accent);
		color: var(--surface);
	}
</style>
