<script lang="ts">
	import type { CreationErrors } from '#lib/core/creation.ts';
	import type { TaskData } from '#lib/core/task-data.ts';
	import type { PanelPresentation, PanelSection } from '#lib/core/panel-tabs.ts';
	import { tick } from 'svelte';
	import Icon from './icons/Icon.svelte';
	import SectionFrame from './SectionFrame.svelte';

	let {
		presentation,
		openSection,
		values,
		pauseText,
		postponedText,
		lastTime,
		errors,
		clearError,
		emoji = $bindable(),
		essential = $bindable(),
		steps = $bindable(),
		onOpenPicker
	}: {
		presentation: PanelPresentation;
		openSection: PanelSection;
		/** The values the panel opened with; without them, it starts empty. */
		values?: TaskData;
		pauseText?: string;
		postponedText?: string;
		lastTime?: string;
		errors: CreationErrors;
		/** A field's error lasts as long as its message: correcting it makes it go away. */
		clearError: (field: keyof CreationErrors) => void;
		emoji: string;
		/** The Esencial check (§6.2). */
		essential: boolean;
		/** The extra steps (2, 3…), one per field (§6.2). */
		steps: string[];
		onOpenPicker: () => void;
	} = $props();

	async function addStep() {
		steps = [...steps, ''];
		await tick();
		document.getElementById(`field-step-${steps.length + 1}`)?.focus();
	}
</script>

<SectionFrame name="Tarea" {presentation} {openSection}>
	{#if pauseText}
		<p class="paused">{pauseText}</p>
	{/if}
	{#if postponedText}
		<p class="paused">{postponedText}</p>
	{/if}
	{#if lastTime !== undefined}
		<p class="last-time">Última vez: {lastTime}</p>
	{/if}

	<div class="form-field" data-field="Título">
		<label for="field-title">Título</label>
		<div class="title">
			<input
				id="field-title"
				name="title"
				autocomplete="off"
				value={values?.title ?? ''}
				oninput={() => clearError('title')}
				aria-invalid={errors.title ? 'true' : undefined}
				aria-describedby={errors.title ? 'error-title' : undefined}
			/>
			{#if emoji}
				<button type="button" class="emoji-button chosen" aria-label="Cambiar emoji {emoji}" onclick={onOpenPicker}>{emoji}</button>
			{:else}
				<button type="button" class="emoji-button" aria-label="Elegir emoji" onclick={onOpenPicker}><Icon name="emoji" /></button>
			{/if}
		</div>
		{#if errors.title}
			<p id="error-title" class="error">Escribí un título.</p>
		{/if}
		{#if emoji}
			<button type="button" class="text" onclick={() => (emoji = '')}>Quitar emoji</button>
		{/if}
	</div>

	<div class="form-field">
		<label for="field-first-step">Primer paso</label>
		<input id="field-first-step" name="firstStep" autocomplete="off" value={values?.firstStep ?? ''} />
	</div>

	{#each steps as _step, index (index)}
		<div class="form-field">
			<label for={`field-step-${index + 2}`}>Paso {index + 2}</label>
			<div class="step">
				<input id={`field-step-${index + 2}`} autocomplete="off" bind:value={steps[index]} />
				<button type="button" class="text" onclick={() => (steps = steps.filter((_, i) => i !== index))}>Quitar</button>
			</div>
		</div>
	{/each}
	<button type="button" class="text" onclick={addStep}>Agregar paso</button>

	<div class="form-field">
		<label for="field-minimal-version">Versión mínima</label>
		<input id="field-minimal-version" name="minimalVersion" autocomplete="off" value={values?.minimalVersion ?? ''} />
	</div>

	<div class="form-field">
		<label for="field-note">Nota</label>
		<textarea id="field-note" name="note" rows="2" value={values?.note ?? ''}></textarea>
	</div>

	<label class="essential">
		<input type="checkbox" name="essential" bind:checked={essential} />
		Esencial
	</label>
</SectionFrame>

<style>
	.title {
		display: flex;
		gap: 0.5rem;
	}

	.title input {
		flex: 1;
		min-width: 0;
		font-size: 1.25rem;
	}

	.step {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.step input {
		flex: 1;
		min-width: 0;
	}

	.emoji-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 44px;
		min-height: 44px;
		padding: 0;
		border: 1px solid var(--border);
		border-radius: 0.4rem;
		background: transparent;
		color: var(--text);
		cursor: pointer;
	}

	.emoji-button.chosen {
		padding: 0 0.5rem;
		font-size: 1.5rem;
	}

	.essential {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 44px;
		cursor: pointer;
	}

	.essential input {
		width: 1.2rem;
		height: 1.2rem;
		margin: 0;
		accent-color: var(--accent);
	}

	.paused {
		margin: 0;
		font-weight: 600;
	}

	.last-time {
		margin: 0;
		color: var(--text-muted);
	}
</style>
