<script lang="ts">
	import type { Label } from '#lib/core/label.ts';
	import { chooseLabels, type ChosenLabel } from '#lib/core/typed-labels.ts';
	import { addTyped, removeChosen, suggestions } from '#lib/core/label-panel.ts';
	import LabelChip from './LabelChip.svelte';
	import { NAME_MESSAGES } from './label-messages';

	// Spec §6.2: el campo Etiquetas del panel. Guarda los nombres elegidos; las nuevas se crean al guardar la tarea.
	let {
		names = $bindable(),
		existing,
		error = $bindable(),
		typed = $bindable('')
	}: { names: string[]; existing: Label[]; error: string | undefined; typed?: string } = $props();

	const options = $derived(suggestions(typed, existing, names));
	const listOpen = $derived(typed.trim() !== '');
	/** Los chips, con el color que tendrán las nuevas al guardar. */
	const chosenLabels = $derived.by((): ChosenLabel[] => {
		const choice = chooseLabels(names, existing);
		return choice.ok ? choice.chosenItems : [];
	});

	function add(name: string) {
		const result = addTyped(name, existing, names);
		if (!result.ok) {
			error = NAME_MESSAGES[result.error];
			return;
		}
		names = result.names;
		typed = '';
		error = undefined;
	}

	function onType(event: KeyboardEvent) {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		add(typed);
	}
</script>

<div class="field">
	<label for="field-labels">Etiquetas</label>
	{#if chosenLabels.length > 0}
		<ul class="chips" aria-label="Etiquetas de la tarea">
			{#each chosenLabels as label (label.name)}
				<LabelChip {label}>
					<button
						type="button"
						class="remove"
						aria-label={`Quitar «${label.name}»`}
						onclick={() => (names = removeChosen(label.name, names))}>×</button
					>
				</LabelChip>
			{/each}
		</ul>
	{/if}
	<input
		id="field-labels"
		role="combobox"
		autocomplete="off"
		aria-autocomplete="list"
		aria-expanded={listOpen}
		aria-controls="label-suggestions"
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={error ? 'error-labels' : undefined}
		bind:value={typed}
		oninput={() => (error = undefined)}
		onkeydown={onType}
	/>
	{#if listOpen}
		<ul id="label-suggestions" class="suggestions" role="listbox" aria-label="Sugerencias de etiquetas">
			{#each options.labels as label (label.id)}
				<!-- svelte-ignore a11y_click_events_have_key_events: Enter en el campo elige con el teclado -->
				<li role="option" aria-selected="false" tabindex="-1" onclick={() => add(label.name)}>{label.name}</li>
			{/each}
			{#if options.create !== undefined}
				{@const create = options.create}
				<!-- svelte-ignore a11y_click_events_have_key_events: Enter en el campo elige con el teclado -->
				<li role="option" aria-selected="false" tabindex="-1" onclick={() => add(create)}>Crear «{create}»</li>
			{/if}
		</ul>
	{/if}
	{#if error}
		<p id="error-labels" class="error">{error}</p>
	{/if}
</div>

<style>
	.field {
		display: grid;
		gap: 0.5rem;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.remove {
		min-width: 28px;
		min-height: 28px;
		padding: 0;
		border: 0;
		background: transparent;
		color: inherit;
		cursor: pointer;
	}

	input {
		min-height: 44px;
		font: inherit;
		padding: 0 0.5rem;
		border: 1px solid var(--border);
		border-radius: 0.4rem;
		background: var(--page-background);
		color: var(--text);
	}

	.suggestions {
		margin: 0;
		padding: 0.25rem 0;
		list-style: none;
		border: 1px solid var(--border);
		border-radius: 0.4rem;
		background: var(--surface);
		max-height: 12rem;
		overflow-y: auto;
	}

	.suggestions li {
		display: flex;
		align-items: center;
		min-height: 44px;
		padding: 0 0.75rem;
		cursor: pointer;
	}

	.suggestions li:hover {
		background: var(--page-background);
	}

	.error {
		margin: 0;
		color: var(--error);
		font-size: 0.9rem;
	}
</style>
