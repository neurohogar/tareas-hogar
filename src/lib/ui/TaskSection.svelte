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
		document.getElementById(`campo-paso-${steps.length + 1}`)?.focus();
	}
</script>

<SectionFrame name="Tarea" {presentation} {openSection}>
	{#if pause === 'reanudar'}
		<p class="pausada">Pausada</p>
	{/if}
	{#if postponedText}
		<p class="pausada">{postponedText}</p>
	{/if}
	{#if lastTime !== undefined}
		<p class="ultima-vez">Última vez: {lastTime}</p>
	{/if}

	<div class="campo-formulario" data-campo="Título">
		<label for="campo-titulo">Título</label>
		<div class="titulo">
			<input
				id="campo-titulo"
				name="titulo"
				autocomplete="off"
				value={values?.title ?? ''}
				oninput={() => clearError('title')}
				aria-invalid={errors.title ? 'true' : undefined}
				aria-describedby={errors.title ? 'error-titulo' : undefined}
			/>
			{#if emoji}
				<button type="button" class="emoji-boton elegido" aria-label="Cambiar emoji {emoji}" onclick={onOpenPicker}>{emoji}</button>
			{:else}
				<button type="button" class="emoji-boton" aria-label="Elegir emoji" onclick={onOpenPicker}><Icon name="emoji" /></button>
			{/if}
		</div>
		{#if errors.title}
			<p id="error-titulo" class="error">Escribí un título.</p>
		{/if}
		{#if emoji}
			<button type="button" class="texto" onclick={() => (emoji = '')}>Quitar emoji</button>
		{/if}
	</div>

	<div class="campo-formulario">
		<label for="campo-primer-paso">Primer paso</label>
		<input id="campo-primer-paso" name="primerPaso" autocomplete="off" value={values?.firstStep ?? ''} />
	</div>

	{#each steps as _step, index (index)}
		<div class="campo-formulario">
			<label for={`campo-paso-${index + 2}`}>Paso {index + 2}</label>
			<div class="paso">
				<input id={`campo-paso-${index + 2}`} autocomplete="off" bind:value={steps[index]} />
				<button type="button" class="texto" onclick={() => (steps = steps.filter((_, i) => i !== index))}>Quitar</button>
			</div>
		</div>
	{/each}
	<button type="button" class="texto" onclick={addStep}>Agregar paso</button>

	<div class="campo-formulario">
		<label for="campo-version-minima">Versión mínima</label>
		<input id="campo-version-minima" name="versionMinima" autocomplete="off" value={values?.minimalVersion ?? ''} />
	</div>

	<div class="campo-formulario">
		<label for="campo-nota">Nota</label>
		<textarea id="campo-nota" name="nota" rows="2" value={values?.note ?? ''}></textarea>
	</div>

	<div class="campo-formulario">
		<label for="campo-esfuerzo">Esfuerzo</label>
		<select id="campo-esfuerzo" bind:value={effort}>
			{#each EFFORT_OPTIONS as option (option.text)}
				<option value={option.value ?? ''}>{option.text}</option>
			{/each}
		</select>
	</div>

	<div data-campo="Etiquetas">
		<LabelsField bind:names={labels} bind:error={labelsError} bind:typed={unconfirmed} existing={session.labels} />
	</div>
</SectionFrame>

<style>
	.titulo {
		display: flex;
		gap: 0.5rem;
	}

	.titulo input {
		flex: 1;
		min-width: 0;
		font-size: 1.25rem;
	}

	.paso {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.paso input {
		flex: 1;
		min-width: 0;
	}

	.emoji-boton {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 44px;
		min-height: 44px;
		padding: 0;
		border: 1px solid var(--borde);
		border-radius: 0.4rem;
		background: transparent;
		color: var(--texto);
		cursor: pointer;
	}

	.emoji-boton.elegido {
		padding: 0 0.5rem;
		font-size: 1.5rem;
	}

	.pausada {
		margin: 0;
		font-weight: 600;
	}

	.ultima-vez {
		margin: 0;
		color: var(--texto-suave);
	}
</style>
