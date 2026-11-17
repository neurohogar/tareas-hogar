<script lang="ts">
	import { saveShowCompleted, readShowCompleted } from '#lib/adapters/show-completed.ts';
	import { saveShowPaused, readShowPaused } from '#lib/adapters/show-paused.ts';
	import { checkboxEnabled } from '#lib/core/checkbox.ts';
	import type { PanelForm } from '#lib/core/unsaved-changes.ts';
	import { pendingRows } from '#lib/core/pending.ts';
	import TaskRow from './TaskRow.svelte';
	import TaskPanel from './TaskPanel.svelte';
	import { useSession } from './session';

	const session = useSession();
	let creating = $state(false);
	let showCompleted = $state(readShowCompleted());
	let showPaused = $state(readShowPaused());
	const rows = $derived(pendingRows(session.tasks, session.completions, session.now, showCompleted, showPaused));

	function saveNew(form: PanelForm) {
		const errors = session.create(form);
		if (!errors) creating = false;
		return errors;
	}
</script>

<section>
	<h1>Pendientes</h1>
	<div class="controls">
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

{#if creating}
	<TaskPanel header="Nueva tarea" onSave={saveNew} onClose={() => (creating = false)} />
{/if}

<style>
	h1 {
		font-size: 1.4rem;
		margin: 0.5rem 0 1rem;
	}

	.controls {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
		margin-bottom: 0.5rem;
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
