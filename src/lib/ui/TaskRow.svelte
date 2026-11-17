<script lang="ts">
	import { progressPercentage, type Status } from '#lib/core/status.ts';
	import { scheduleText } from '#lib/core/schedule.ts';
	import { taskName } from '#lib/core/task-name.ts';
	import type { StepButtons } from '#lib/core/current-step.ts';
	import type { MinimalLine } from '#lib/core/minimal-version.ts';
	import type { Task } from '#lib/core/task.ts';

	let {
		task,
		status,
		completed,
		dateText,
		firstStepText,
		stepButtons,
		minimal,
		enabled,
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
		onCheckboxTap: () => void;
		onMinimal: () => void;
		onDone: () => void;
		onPreviousStep: () => void;
		onOpen: () => void;
	} = $props();

	const name = $derived(taskName(task));

	function tap(event: Event) {
		// Marcado se deriva de los completados: el checkbox vuelve a su valor hasta que llegan.
		(event.currentTarget as HTMLInputElement).checked = completed;
		onCheckboxTap();
	}
</script>

<li class="row" class:waiting={status.kind === 'en espera'} class:paused={status.kind === 'pausada'} class:completed>
	<label class="checkbox-area">
		<input type="checkbox" checked={completed} disabled={!enabled} aria-label={`Completar ${name}`} onchange={tap} />
	</label>
	<div class="content">
		<!-- El botón cubre toda la fila fuera del checkbox: tocarla abre la edición. -->
		<button type="button" class="title" onclick={onOpen}>{name}</button>
		{#if firstStepText}
			<div class="step-line">
				<p class="first-step">{firstStepText}</p>
				{#if stepButtons}
					{#if stepButtons.previousStep}
						<button type="button" class="step-button" onclick={onPreviousStep}>Paso anterior</button>
					{/if}
					<button type="button" class="step-button" disabled={!stepButtons.doneEnabled} onclick={onDone}>Hecho</button>
				{/if}
			</div>
		{/if}
		{#if minimal}
			<div class="step-line">
				<p class="first-step">{minimal.text}</p>
				<button type="button" class="step-button" disabled={!minimal.enabled} onclick={onMinimal}>Hice la mínima</button>
			</div>
		{/if}
		{#if task.schedule}
			<span class="schedule">{scheduleText(task.schedule)}</span>
		{/if}
		{#if status.kind === 'pausada'}
			<span class="paused-status">Pausada</span>
		{/if}
		{#if dateText}
			<span class="date-text">{dateText}</span>
		{/if}
		{#if status.kind === 'en espera'}
			{@const percentage = progressPercentage(status.progress)}
			<div
				class="bar"
				role="progressbar"
				aria-label={`Tiempo hasta que vuelve ${name}`}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={percentage}
			>
				<div class="fill" style:width={`${percentage}%`}></div>
			</div>
		{/if}
	</div>
</li>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem 0.25rem 0;
		border-bottom: 1px solid var(--border);
		opacity: 1;
	}



	/* Línea propia, entera y en varias líneas si hace falta; no intercepta el toque de la fila. */
	.step-line {
		flex-basis: 100%;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 0.75rem;
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.first-step {
		margin: 0;
		font-size: 0.8rem;
		color: var(--text-muted);
		overflow-wrap: anywhere;
	}

	/* Por encima del ::after del título, que cubre la fila: los botones no abren el panel. */
	.step-button {
		position: relative;
		z-index: 1;
		min-height: 36px;
		padding: 0 0.6rem;
		border: 1px solid var(--control-border);
		border-radius: 0.4rem;
		background: transparent;
		color: inherit;
		font: inherit;
		font-weight: 400;
		text-decoration: none;
		cursor: pointer;
	}

	.step-button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.paused-status {
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.checkbox-area {
		display: grid;
		place-items: center;
		min-width: 48px;
		min-height: 48px;
		cursor: pointer;
	}

	.checkbox-area input {
		width: 1.4rem;
		height: 1.4rem;
		margin: 0;
		accent-color: var(--accent);
		cursor: pointer;
	}

	.content {
		position: relative;
		flex: 1;
		min-height: 48px;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 0.75rem;
	}

	.title {
		padding: 0;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		font-weight: 700;
		text-align: left;
		cursor: pointer;
	}

	.completed .title {
		font-weight: 400;
		text-decoration-line: line-through;
		opacity: 0.6;
	}

	.waiting .title,
	.paused .title {
		color: var(--text-muted);
	}

	.title::after {
		content: '';
		position: absolute;
		inset: 0;
	}

	.checkbox-area:has(input:disabled),
	.checkbox-area input:disabled {
		cursor: not-allowed;
	}

	.checkbox-area input:disabled {
		opacity: 0.4;
	}

	.schedule {
		font-size: 0.8rem;
		color: var(--text-muted);
		opacity: 1;
		font-variant-numeric: tabular-nums;
	}

	.date-text {
		font-size: 0.8rem;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}

	/* Fuera del flujo, en el padding inferior de la fila: no corre el título respecto del checkbox. */
	.bar {
		position: absolute;
		left: 0;
		right: 0;
		bottom: -0.2rem;
		height: 3px;
		border-radius: 2px;
		background: var(--border);
		overflow: hidden;
	}

	.fill {
		height: 100%;
		background: var(--accent);
	}
</style>
