<script lang="ts">
	import { saveShowCompleted, readShowCompleted } from '#lib/adapters/show-completed.ts';
	import { saveShowPaused, readShowPaused } from '#lib/adapters/show-paused.ts';
	import { checkboxEnabled } from '#lib/core/checkbox.ts';
	import type { PanelForm } from '#lib/core/unsaved-changes.ts';
	import { taskLabels } from '#lib/core/task-labels.ts';
	import { filterByLabel, activeFilter } from '#lib/core/label-filter.ts';
	import { filterQuickOnly, emptyListText } from '#lib/core/quick-only.ts';
	import { sortLabels } from '#lib/core/label-order.ts';
	import { pendingRows } from '#lib/core/pending.ts';
	import TaskRow from './TaskRow.svelte';
	import TaskPanel from './TaskPanel.svelte';
	import { useSession } from './session';

	const session = useSession();
	let creating = $state(false);
	const labels = $derived(sortLabels(session.labels));
	const filter = $derived(activeFilter(session.filter, session.labels));
	let showCompleted = $state(readShowCompleted());
	let showPaused = $state(readShowPaused());
	const rows = $derived(
		filterQuickOnly(
			filterByLabel(
				pendingRows(session.tasks, session.completions, session.now, showCompleted, showPaused),
				filter
			),
			session.quickOnly
		)
	);
	const emptyText = $derived(rows.length === 0 ? emptyListText(filter, session.quickOnly) : undefined);

	function saveNew(form: PanelForm) {
		const errors = session.create(form);
		if (!errors) creating = false;
		return errors;
	}
</script>

<section>
	<h1>Pendientes</h1>
	{#if labels.length > 0}
		<div class="filter" role="group" aria-label="Filtrar por etiqueta">
			<button type="button" aria-pressed={filter === undefined} onclick={() => session.chooseFilter(undefined)}>Todas</button>
			{#each labels as label (label.id)}
				<button
					type="button"
					aria-pressed={filter === label.id}
					style:--color-chip={`var(--label-${label.color})`}
					onclick={() => session.chooseFilter(label.id)}>{label.name}</button
				>
			{/each}
		</div>
	{/if}
	<div class="controls">
		<button type="button" class="quick-only" aria-pressed={session.quickOnly} onclick={() => session.toggleQuickOnly()}>Solo rápidas</button>
		<label class="show-completed">
			<input type="checkbox" bind:checked={showCompleted} onchange={(event) => saveShowCompleted(event.currentTarget.checked)} />
			Completadas
		</label>
		<label class="show-completed">
			<input type="checkbox" bind:checked={showPaused} onchange={(event) => saveShowPaused(event.currentTarget.checked)} />
			Pausadas
		</label>
	</div>
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
				labels={taskLabels(task, session.labels)}
				onCheckboxTap={() => session.tapCheckbox(task)}
				onMinimal={() => session.doTheMinimal(task)}
				onDone={() => session.tapDone(task)}
				onPreviousStep={() => session.previousStep(task)}
				onOpen={() => session.openTask(task)}
			/>
		{/each}
	</ul>
	{#if emptyText}
		<p class="empty">{emptyText}</p>
	{/if}
	<button type="button" class="new" title="Nueva tarea" onclick={() => (creating = true)}>+</button>
</section>

{#if creating}
	<TaskPanel header="Nueva tarea" onSave={saveNew} onClose={() => (creating = false)} />
{/if}

<style>
	h1 {
		font-size: 1.4rem;
		margin: 0.5rem 0 1rem;
	}

	.filter {
		display: flex;
		gap: 0.4rem;
		margin-bottom: 0.75rem;
		overflow-x: auto;
		padding-bottom: 0.25rem;
	}

	.controls {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
		margin-bottom: 0.5rem;
	}

	.quick-only {
		min-height: 36px;
		padding: 0 0.85rem;
		border: 1px solid var(--control-border);
		border-radius: 999px;
		background: transparent;
		color: var(--text);
		cursor: pointer;
	}

	.filter button {
		flex: none;
		min-height: 36px;
		padding: 0 0.85rem;
		border: 1px solid var(--control-border);
		border-radius: 999px;
		background: var(--color-chip, transparent);
		color: var(--text);
		cursor: pointer;
	}

	.filter button[aria-pressed='true'],
	.quick-only[aria-pressed='true'] {
		border-color: var(--accent);
		box-shadow: inset 0 0 0 2px var(--accent);
		font-weight: 600;
	}

	.show-completed {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 48px;
		color: var(--text-muted);
		cursor: pointer;
	}

	.show-completed input {
		width: 1.2rem;
		height: 1.2rem;
		margin: 0;
		accent-color: var(--accent);
	}

	.empty {
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
		bottom: calc(var(--navigation-height) + 1.25rem);
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
