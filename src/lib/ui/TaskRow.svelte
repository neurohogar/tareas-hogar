<script lang="ts">
	import { progressPercentage, type Status } from '#lib/core/status.ts';
	import type { Label } from '#lib/core/label.ts';
	import { effortText } from '#lib/core/effort.ts';
	import { scheduleText } from '#lib/core/schedule.ts';
	import { taskName } from '#lib/core/task-name.ts';
	import type { StepButtons } from '#lib/core/current-step.ts';
	import type { MinimalLine } from '#lib/core/minimal-version.ts';
	import type { Task } from '#lib/core/task.ts';
	import LabelChip from './LabelChip.svelte';

	let {
		task,
		status,
		completed,
		dateText,
		firstStepText,
		stepButtons,
		minimal,
		enabled,
		labels,
		onCheckboxTap,
		onMinimal,
		onDone,
		onPreviousStep,
		onOpen
	}: {
		task: Task;
		status: Status;
		/** Spec §6.1 (Contraste): tachada, en peso normal y atenuada, con el checkbox marcado. */
		completed: boolean;
		/** «Tocaba …» o «Vuelve …» (§6.1), ya armado por el core; sin él, la fila no lleva texto de fecha. */
		dateText?: string;
		/** «Primer paso: …» (§6.1), ya armado por el core; sin él, la fila no lleva esa línea. */
		firstStepText?: string;
		/** «Paso anterior» y «Hecho» (§6.1), según el core; sin ellos, la línea no lleva botones. */
		stepButtons?: StepButtons;
		/** «Mínima: …» y si «Hice la mínima» está habilitado (§6.1), según el core; sin ella, la fila no lleva esa línea. */
		minimal?: MinimalLine;
		/** Spec §6.1 y §5.5: deshabilitado si tocarlo completaría fuera de la ventana del horario. */
		enabled: boolean;
		/** Las etiquetas de la tarea, ya en orden (§4.3). */
		labels: Label[];
		onCheckboxTap: () => void;
		onMinimal: () => void;
		onDone: () => void;
		onPreviousStep: () => void;
		onOpen: () => void;
	} = $props();

	const name = $derived(taskName(task));
	const level = $derived(effortText(task.effort));

	function tap(event: Event) {
		// Marcado se deriva de los completados: el checkbox vuelve a su valor hasta que llegan.
		(event.currentTarget as HTMLInputElement).checked = completed;
		onCheckboxTap();
	}
</script>

<li class="fila" class:en-espera={status.kind === 'en espera'} class:pausada={status.kind === 'pausada'} class:completed>
	<label class="area-checkbox">
		<input type="checkbox" checked={completed} disabled={!enabled} aria-label={`Completar ${name}`} onchange={tap} />
	</label>
	<div class="contenido">
		<!-- El botón cubre toda la fila fuera del checkbox: tocarla abre la edición. -->
		<button type="button" class="titulo" onclick={onOpen}>{name}</button>
		{#if firstStepText}
			<div class="linea-paso">
				<p class="primer-paso">{firstStepText}</p>
				{#if stepButtons}
					{#if stepButtons.previousStep}
						<button type="button" class="boton-paso" onclick={onPreviousStep}>Paso anterior</button>
					{/if}
					<button type="button" class="boton-paso" disabled={!stepButtons.doneEnabled} onclick={onDone}>Hecho</button>
				{/if}
			</div>
		{/if}
		{#if minimal}
			<div class="linea-paso">
				<p class="primer-paso">{minimal.text}</p>
				<button type="button" class="boton-paso" disabled={!minimal.enabled} onclick={onMinimal}>Hice la mínima</button>
			</div>
		{/if}
		{#if labels.length > 0}
			<!-- Debajo del botón de la fila: tocar un chip es tocar la fila, no filtra. -->
			<ul class="chips" aria-label="Etiquetas">
				{#each labels as label (label.id)}
					<LabelChip {label} />
				{/each}
			</ul>
		{/if}
		{#if level}
			<span class="esfuerzo">{level}</span>
		{/if}
		{#if task.schedule}
			<span class="horario">{scheduleText(task.schedule)}</span>
		{/if}
		{#if status.kind === 'pausada'}
			<span class="estado-pausada">Pausada</span>
		{/if}
		{#if dateText}
			<span class="texto-de-fecha">{dateText}</span>
		{/if}
		{#if status.kind === 'en espera'}
			{@const percentage = progressPercentage(status.progress)}
			<div
				class="barra"
				role="progressbar"
				aria-label={`Tiempo hasta que vuelve ${name}`}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={percentage}
			>
				<div class="relleno" style:width={`${percentage}%`}></div>
			</div>
		{/if}
	</div>
</li>

<style>
	.fila {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem 0.25rem 0;
		border-bottom: 1px solid var(--borde);
		opacity: 1;
	}



	/* Línea propia, entera y en varias líneas si hace falta; no intercepta el toque de la fila. */
	.linea-paso {
		flex-basis: 100%;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 0.75rem;
		font-size: 0.8rem;
		color: var(--texto-suave);
	}

	.primer-paso {
		margin: 0;
		font-size: 0.8rem;
		color: var(--texto-suave);
		overflow-wrap: anywhere;
	}

	/* Por encima del ::after del título, que cubre la fila: los botones no abren el panel. */
	.boton-paso {
		position: relative;
		z-index: 1;
		min-height: 36px;
		padding: 0 0.6rem;
		border: 1px solid var(--borde-control);
		border-radius: 0.4rem;
		background: transparent;
		color: inherit;
		font: inherit;
		font-weight: 400;
		text-decoration: none;
		cursor: pointer;
	}

	.boton-paso:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.esfuerzo {
		font-size: 0.8rem;
		color: var(--texto-suave);
	}

	.estado-pausada {
		font-size: 0.8rem;
		color: var(--texto-suave);
	}

	.area-checkbox {
		display: grid;
		place-items: center;
		min-width: 48px;
		min-height: 48px;
		cursor: pointer;
	}

	.area-checkbox input {
		width: 1.4rem;
		height: 1.4rem;
		margin: 0;
		accent-color: var(--acento);
		cursor: pointer;
	}

	.contenido {
		position: relative;
		flex: 1;
		min-height: 48px;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 0.75rem;
	}

	.titulo {
		padding: 0;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		font-weight: 700;
		text-align: left;
		cursor: pointer;
	}

	.completed .titulo {
		font-weight: 400;
		text-decoration-line: line-through;
		opacity: 0.6;
	}

	.en-espera .titulo,
	.pausada .titulo {
		color: var(--texto-suave);
	}

	.titulo::after {
		content: '';
		position: absolute;
		inset: 0;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.area-checkbox:has(input:disabled),
	.area-checkbox input:disabled {
		cursor: not-allowed;
	}

	.area-checkbox input:disabled {
		opacity: 0.4;
	}

	.horario {
		font-size: 0.8rem;
		color: var(--texto-suave);
		opacity: 1;
		font-variant-numeric: tabular-nums;
	}

	.texto-de-fecha {
		font-size: 0.8rem;
		color: var(--texto-suave);
		font-variant-numeric: tabular-nums;
	}

	/* Fuera del flujo, en el padding inferior de la fila: no corre el título respecto del checkbox. */
	.barra {
		position: absolute;
		left: 0;
		right: 0;
		bottom: -0.2rem;
		height: 3px;
		border-radius: 2px;
		background: var(--borde);
		overflow: hidden;
	}

	.relleno {
		height: 100%;
		background: var(--acento);
	}
</style>
