<script lang="ts">
	import type { CreationErrors } from '#lib/core/creation.ts';
	import type { TaskData } from '#lib/core/task-data.ts';
	import { EFFORT_OPTIONS } from '#lib/core/effort.ts';
	import type { PanelPresentation, PanelSection } from '#lib/core/panel-tabs.ts';
	import type { Effort } from '#lib/core/task.ts';
	import { tick } from 'svelte';
	import LabelsField from './LabelsField.svelte';
	import Icon from './icons/Icon.svelte';
	import SectionFrame from './SectionFrame.svelte';
	import { useSession } from './session';

	let {
		presentation,
		openSection,
		values,
		pause,
		postponedText,
		lastTime,
		errors,
		clearError,
		emoji = $bindable(),
		effort = $bindable(),
		steps = $bindable(),
		labels = $bindable(),
		labelsError = $bindable(),
		unconfirmed = $bindable(),
		onOpenPicker
	}: {
		presentation: PanelPresentation;
		openSection: PanelSection;
		/** Los valores con que abrió el panel; sin ellos, arranca vacío. */
		values?: TaskData;
		pause?: 'pausar' | 'reanudar';
		postponedText?: string;
		lastTime?: string;
		errors: CreationErrors;
		/** El error de un campo dura lo que dura su mensaje: al corregirlo se va. */
		clearError: (field: keyof CreationErrors) => void;
		emoji: string;
		effort: Effort | '';
		/** Los pasos más (2, 3…), uno por campo (§6.2). */
		steps: string[];
		labels: string[];
		labelsError: string | undefined;
		/** El texto escrito en Etiquetas que todavía no se confirmó. */
		unconfirmed: string;
		onOpenPicker: () => void;
	} = $props();

	const session = useSession();

	async function addStep() {
		steps = [...steps, ''];
		await tick();
		document.getElementById(`field-step-${steps.length + 1}`)?.focus();
	}
</script>

<SectionFrame name="Tarea" {presentation} {openSection}>
	{#if pause === 'reanudar'}
		<p class="paused">Pausada</p>
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

	<div class="form-field">
		<label for="field-effort">Esfuerzo</label>
		<select id="field-effort" bind:value={effort}>
			{#each EFFORT_OPTIONS as option (option.text)}
				<option value={option.value ?? ''}>{option.text}</option>
			{/each}
		</select>
	</div>

	<div data-field="Etiquetas">
		<LabelsField bind:names={labels} bind:error={labelsError} bind:typed={unconfirmed} existing={session.labels} />
	</div>
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

	.paused {
		margin: 0;
		font-weight: 600;
	}

	.last-time {
		margin: 0;
		color: var(--text-muted);
	}
</style>
