<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import type { CreationErrors } from '#lib/core/creation.ts';
	import { DATA_ON_CREATE, type TaskData } from '#lib/core/task-data.ts';
	import { actionNotice, discardAndAct, saveAndAct, type NoticeAction } from '#lib/core/action-notice.ts';
	import { changeOfAction, whatTheActionDoes, type PanelAction } from '#lib/core/panel-action.ts';
	import { whatBackDoes, type OnTop } from '#lib/core/panel-back.ts';
	import { essentialField } from '#lib/core/essential.ts';
	import { hasChanges, type PanelForm } from '#lib/core/unsaved-changes.ts';
	import { onClosePanel, CLOSE_NOTICE, type NoticeButton } from '#lib/core/unsaved-changes-notice.ts';
	import type { TaskChange } from '#lib/core/task-document.ts';
	import { taskName } from '#lib/core/task-name.ts';
	import type { Weekday, Task, Unit } from '#lib/core/task.ts';
	import { takeBack } from '#lib/adapters/back.ts';
	import { confirmOnLeave } from '#lib/adapters/confirm-on-leave.ts';
	import { readRecents, rememberRecent } from '#lib/adapters/recents.ts';
	import { now as currentTime } from '#lib/adapters/clock.ts';
	import UnsavedChangesNotice from './UnsavedChangesNotice.svelte';
	import TabBar from './TabBar.svelte';
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
		lastTime,
		onSave,
		onClose,
		onDelete,
		onAct,
		pause,
		pauseText,
		postpone,
		postponedText
	}: {
		header: string;
		/** The current values of the task being edited; without them, the panel starts empty (create). */
		initial?: TaskData;
		/** Only when editing: the task as it was when the panel opened. */
		task?: Task;
		/** Only when editing: the "Última vez" text the core computes (§6.2). */
		lastTime?: string;
		/** Saves the form; if something is invalid it returns the errors and the panel stays open. */
		onSave: (form: PanelForm) => CreationErrors | undefined;
		onClose: () => void;
		/** Only when editing: deletes the task, already confirmed. */
		onDelete?: () => void;
		/** Only when editing: runs an action (with what was saved, if it went through the notice) and closes the panel. */
		onAct?: (change: TaskChange) => void;
		/** Only when editing a recurring task (§6.2): the button the core offers. */
		pause?: 'pausar' | 'reanudar';
		/** Only when editing (§6.2): the button the core offers. */
		/** Only when editing a task paused (§6.2): «Pausada» or «Pausada por el modo mínimo», built by the core. */
		pauseText?: string;
		postpone?: 'posponer' | 'quitar';
		/** "Pospuesta hasta HH:MM" built by the core, if the task is postponed. */
		postponedText?: string;
	} = $props();

	// The values the panel opens with: taken once, even if the task changes while it is open.
	// Each control starts with the task's value only if it is of its shape: those of the other options
	// of "Se repite" start as when creating.
	const values = untrack(() => initial);
	const name = values && taskName(values);
	const initialDueDate = values?.shape === 'puntual' ? (values.dueDate ?? '') : '';
	const initialEvery = values?.shape === 'relativa' ? String(values.every) : '';
	const initialUnit: Unit = values?.shape === 'relativa' ? values.unit : 'horas';

	let repetition = $state<RepetitionOption>(repetitionOnOpen(values));
	let weekdays = $state<Weekday[]>(values?.shape === 'calendario' ? [...values.weekdays] : []);
	let monthDays = $state<number[]>(values?.shape === 'calendario' ? [...values.monthDays] : []);
	let errors = $state<CreationErrors>({});
	let confirmingDelete = $state(false);
	/** The Esencial check: starts as the data it opens with (when creating, per the mode at that moment). */
	let essential = $state(values?.essential === true);
	let emoji = $state(untrack(() => initial?.emoji ?? ''));
	/** "Solo en un horario": off, the task has no schedule (§6.2). */
	let withSchedule = $state(values?.schedule !== undefined);
	/** The extra steps (2, 3…), one per field; Agregar paso adds an empty one (§6.2). */
	let steps = $state<string[]>(untrack(() => [...(initial?.steps ?? [])]));
	/** The Desde/Hasta rows: at least one; Agregar horario adds an empty one (§6.2). */
	let windowRows = $state<WindowRow[]>(values?.schedule?.map(({ from = '', to = '' }) => ({ from, to })) ?? [{ from: '', to: '' }]);

	/** The picker's recents while it is open; with no picker open, undefined. */
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
	 * An empty date field is "no due date"; an incomplete one (badInput)
	 * also has an empty value, but it is passed to the core so it rejects it.
	 */
	function dueDateOf(field: HTMLInputElement): string | undefined {
		return field.value === '' && !field.validity.badInput ? undefined : field.value;
	}

	/** Only the fields of the option chosen in "Se repite" count. */
	function taskDataFromForm(form: HTMLFormElement): TaskData {
		const fields = new FormData(form);
		// The note is read from the control, not from FormData, which turns line breaks into CRLF.
		const note = (form.elements.namedItem('note') as HTMLTextAreaElement).value;
		const firstStep = String(fields.get('firstStep') ?? '');
		const minimalVersion = String(fields.get('minimalVersion') ?? '');
		const schedule = withSchedule ? windowRows.map(({ from, to }) => ({ from, to })) : undefined;
		const common = { title: String(fields.get('title') ?? ''), emoji, note, firstStep, minimalVersion, steps: [...steps], schedule, ...essentialField(essential) };
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
	const sections = $derived(panelSections(onDelete ? 'edit' : 'create'));
	let openSection = $state<PanelSection>(TAB_ON_OPEN);
	let content: HTMLDivElement;

	const withError = $derived(fieldsWithError(errors, repetition));
	const marked = $derived(markedSections(withError));

	let keyboard = $state<KeyboardState>({ open: false, overlap: 0 });
	const barVisible = $derived(saveBarVisible(keyboard.open));
	onMount(() => observeKeyboard((status) => (keyboard = status)));

	// The undo notice shows over the Guardar bar or, with no bar, over the keyboard.
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

	/** A field's error lasts as long as its message: correcting it makes it go away. */
	function clearError(field: keyof CreationErrors) {
		const { [field]: _removed, ...rest } = errors;
		errors = rest;
	}

	const session = useSession();
	let form: HTMLFormElement;
	/** The values the panel was opened with; when creating, the form as it opens (§6.2). */
	const onOpen: PanelForm = { data: values ?? DATA_ON_CREATE };
	let closeNoticeOpen = $state(false);
	/** The action whose notice is open, with what was typed when it was chosen. */
	let openAction = $state.raw<{ action: PanelAction; form: PanelForm } | undefined>(undefined);

	function currentForm(): PanelForm {
		return { data: taskDataFromForm(form) };
	}
	const hasChangesNow = () => hasChanges(onOpen, currentForm());

	/** What the core needs to evaluate an action's notice with the task and the now of this moment. */
	function noticeContext({ action, form }: NonNullable<typeof openAction>, now: Date): NoticeAction {
		const taskWhenOpened = untrack(() => task!);
		return {
			action,
			taskOnOpen: taskWhenOpened,
			task: session.tasks.find(({ id }) => id === taskWhenOpened.id) ?? taskWhenOpened,
			completions: session.completions,
			now,
			form
		};
	}
	const shownActionNotice = $derived(openAction ? actionNotice(noticeContext(openAction, session.now)) : undefined);
	// If the action no longer applies (another device, or time passed), the notice closes and the panel stays with what was typed.
	$effect(() => {
		if (openAction && !shownActionNotice) openAction = undefined;
	});

	function showErrors(newErrors: CreationErrors | undefined) {
		errors = newErrors ?? {};
		const destination = destinationOnSaveFailure(withError, presentation);
		if (destination) void goToField(destination);
	}

	function submit(event: SubmitEvent) {
		event.preventDefault();
		showErrors(onSave(currentForm()));
	}

	function close() {
		if (onClosePanel(hasChangesNow()) === 'closesPanel') onClose();
		else closeNoticeOpen = true;
	}

	function chooseInCloseNotice(effect: NoticeButton['effect']) {
		closeNoticeOpen = false;
		if (effect === 'descartar') onClose();
		else if (effect === 'guardar') showErrors(onSave(currentForm()));
	}

	function chooseAction(action: PanelAction) {
		const typed = currentForm();
		if (whatTheActionDoes(action, hasChanges(onOpen, typed)) === 'acts') onAct?.(changeOfAction(action, currentTime()));
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
			if (change) onAct?.(change);
			return;
		}
		const result = saveAndAct(context);
		if (result.result === 'guardado') onAct?.(result.change);
		else if (result.result === 'rechazado') {
			openAction = undefined;
			showErrors(result.errors);
		} else if (result.result === 'aviso cerrado') openAction = undefined;
	}

	function whatIsOnTop(): OnTop {
		if (closeNoticeOpen) return 'closeNotice';
		if (openAction) return 'actionNotice';
		if (confirmingDelete) return 'deleteConfirmation';
		return recents ? 'emojiPicker' : 'nothing';
	}

	/** Back with the panel open (§6.2); returns whether the panel is still open. */
	function onBackTap(): boolean {
		const effect = whatBackDoes({ top: whatIsOnTop(), hasChanges: hasChangesNow(), keyboardOpen: keyboard.open });
		if (effect === 'closesKeyboard') (document.activeElement as HTMLElement | null)?.blur();
		else if (effect === 'closesTopLayer') {
			closeNoticeOpen = false;
			openAction = undefined;
			confirmingDelete = false;
			recents = undefined;
		} else if (effect === 'opensCloseNotice') closeNoticeOpen = true;
		else {
			onClose();
			return false;
		}
		return true;
	}

	onMount(() => {
		const layer = takeBack(onBackTap);
		const stopConfirming = confirmOnLeave(hasChangesNow);
		return () => {
			layer.release();
			stopConfirming();
		};
	});
</script>

<svelte:window bind:innerWidth={windowWidth} />

<div class="panel main-panel" inert={closeNoticeOpen || openAction !== undefined || confirmingDelete} style:bottom={keyboard.overlap > 0 ? `${keyboard.overlap}px` : undefined} role="dialog" aria-modal="true" aria-labelledby="title-panel">
	<form class="sheet" bind:this={form} class:full={presentation === 'tabs'} novalidate onsubmit={submit}>
		<header>
			<h2 id="title-panel">{header}</h2>
			<button type="button" class="close" aria-label="Cerrar" onclick={close}><Icon name="close" /></button>
		</header>
		{#if presentation === 'tabs'}
			<TabBar {sections} {openSection} {marked} onChoose={chooseTab} />
		{/if}

		<div class="content" bind:this={content}>
			<TaskSection
				{presentation}
				{openSection}
				{values}
				{pauseText}
				{postponedText}
				{lastTime}
				{errors}
				{clearError}
				bind:emoji
				bind:essential
				bind:steps
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
