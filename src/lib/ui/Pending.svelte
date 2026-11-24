<script lang="ts">
	import { goto } from '$app/navigation';
	import { saveShowCompleted, readShowCompleted } from '#lib/adapters/show-completed.ts';
	import { saveShowPaused, readShowPaused } from '#lib/adapters/show-paused.ts';
	import { checkboxEnabled } from '#lib/core/checkbox.ts';
	import type { PanelForm } from '#lib/core/unsaved-changes.ts';
	import { pendingRows } from '#lib/core/pending.ts';
	import { rescheduleEnabled } from '#lib/core/block-reschedule.ts';
	import { dataOnCreate } from '#lib/core/task-data.ts';
	import Icon from './icons/Icon.svelte';
	import TaskRow from './TaskRow.svelte';
	import TaskPanel from './TaskPanel.svelte';
	import ReschedulePreview from './ReschedulePreview.svelte';
	import { markOpenedFromApp, useSession } from './session';

	const session = useSession();
	let creating = $state(false);
	let menuOpen = $state(false);
	let previewing = $state(false);
	let showCompleted = $state(readShowCompleted());
	let showPaused = $state(readShowPaused());
	const rows = $derived(pendingRows(session.tasks, session.completions, session.now, showCompleted, showPaused, session.minimalMode));

	const canReschedule = $derived(rescheduleEnabled(session.tasks, session.completions, session.now, session.minimalMode));

	/** Disabled: it does nothing and the menu stays open (§6.1). */
	function openPreview() {
		if (!canReschedule) return;
		menuOpen = false;
		previewing = true;
	}

	function openHistory() {
		menuOpen = false;
		markOpenedFromApp();
		void goto('/history');
	}

	function toggleMinimalMode() {
		menuOpen = false;
		session.toggleMinimalMode();
	}

	function toggleShowCompleted() {
		menuOpen = false;
		showCompleted = !showCompleted;
		saveShowCompleted(showCompleted);
	}

	function toggleShowPaused() {
		menuOpen = false;
		showPaused = !showPaused;
		saveShowPaused(showPaused);
	}

	/** Escape or a tap outside closes the menu without changing anything. */
	function closeOnOutside(event: Event) {
		if (menuOpen && !(event.target as Element).closest('.menu')) menuOpen = false;
	}

	function saveNew(form: PanelForm) {
		const errors = session.create(form);
		if (!errors) creating = false;
		return errors;
	}
</script>

<svelte:window onpointerdown={closeOnOutside} onkeydown={(event) => event.key === 'Escape' && (menuOpen = false)} />

<section>
	<header class="header">
		<h1>Pendientes</h1>
		<div class="menu">
			<button type="button" class="menu-button" aria-label="Menú" aria-haspopup="menu" aria-expanded={menuOpen} onclick={() => (menuOpen = !menuOpen)}>
				<Icon name="more" />
			</button>
			{#if menuOpen}
				<div class="menu-list" role="menu">
					<button type="button" role="menuitem" class="menu-item" onclick={openHistory}>
						<span class="check" aria-hidden="true"></span>Historial
					</button>
					<button type="button" role="menuitemcheckbox" aria-checked={session.minimalMode} class="menu-item" onclick={toggleMinimalMode}>
						<span class="check" aria-hidden="true">{session.minimalMode ? '✓' : ''}</span>Modo mínimo
					</button>
					<button type="button" role="menuitemcheckbox" aria-checked={showCompleted} class="menu-item" onclick={toggleShowCompleted}>
						<span class="check" aria-hidden="true">{showCompleted ? '✓' : ''}</span>Completadas
					</button>
					<button type="button" role="menuitemcheckbox" aria-checked={showPaused} class="menu-item" onclick={toggleShowPaused}>
						<span class="check" aria-hidden="true">{showPaused ? '✓' : ''}</span>Pausadas
					</button>
					<button type="button" role="menuitem" class="menu-item" class:disabled={!canReschedule} aria-disabled={!canReschedule ? 'true' : undefined} onclick={openPreview}>
						<span class="check" aria-hidden="true"></span>Reprogramar vencidas
					</button>
				</div>
			{/if}
		</div>
	</header>
	{#if session.minimalMode}
		<p class="mode-line">Modo mínimo</p>
	{/if}
	<ul class="list">
		{#each rows as { task, status, completed, dateText, firstStepText, stepButtons, minimal } (task.id)}
			<TaskRow
				{task}
				{status}
				{completed}
				{dateText}
				{firstStepText}
				{stepButtons}
				{minimal}
				enabled={checkboxEnabled(task, session.completions, session.now)}
				onCheckboxTap={() => session.tapCheckbox(task)}
				onMinimal={() => session.doTheMinimal(task)}
				onDone={() => session.tapDone(task)}
				onPreviousStep={() => session.previousStep(task)}
				onOpen={() => session.openTask(task)}
			/>
		{/each}
	</ul>
	<button type="button" class="new" title="Nueva tarea" onclick={() => (creating = true)}>+</button>
</section>

{#if previewing}
	<ReschedulePreview onClose={() => (previewing = false)} />
{/if}

{#if creating}
	<TaskPanel header="Nueva tarea" initial={dataOnCreate(session.minimalMode)} onSave={saveNew} onClose={() => (creating = false)} />
{/if}

<style>
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 0.5rem 0 1rem;
	}

	h1 {
		font-size: 1.4rem;
		margin: 0;
	}

	.menu {
		position: relative;
	}

	.menu-button {
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

	.menu-list {
		position: absolute;
		right: 0;
		z-index: 1;
		min-width: 12rem;
		border: 1px solid var(--border);
		border-radius: 0.4rem;
		background: var(--surface);
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		min-height: 48px;
		padding: 0 1rem;
		border: 0;
		background: transparent;
		color: var(--text);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.menu-item.disabled {
		opacity: 0.5;
		cursor: default;
	}

	.check {
		display: inline-block;
		width: 1rem;
	}

	.mode-line {
		margin: 0 0 0.5rem;
		color: var(--text-muted);
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.new {
		position: fixed;
		right: 1.25rem;
		bottom: 1.25rem;
		width: 56px;
		height: 56px;
		border: 0;
		border-radius: 50%;
		background: var(--accent);
		color: var(--surface);
		font-size: 1.75rem;
		line-height: 1;
		cursor: pointer;
	}

	@media (min-width: 42.5rem) {
		.new {
			right: calc(50% - 20rem + 1.25rem);
		}
	}
</style>
