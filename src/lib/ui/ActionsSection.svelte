<script lang="ts">
	import { optionAction, type PanelAction } from '#lib/core/panel-action.ts';
	import { POSTPONE_OPTIONS } from '#lib/core/postponement.ts';
	import type { PanelPresentation, PanelSection } from '#lib/core/panel-tabs.ts';
	import Icon from './icons/Icon.svelte';
	import SectionFrame from './SectionFrame.svelte';

	const POSTPONE_ICONS = { '1 hora': 'clock', '3 horas': 'clock', 'hasta mañana': 'tomorrow' } as const;

	let {
		presentation,
		openSection,
		postpone,
		pause,
		onChoose,
		onRequestDelete
	}: {
		presentation: PanelPresentation;
		openSection: PanelSection;
		postpone?: 'posponer' | 'quitar';
		pause?: 'pausar' | 'reanudar';
		/** Elige una acción; el panel decide si actúa o pide confirmación (§6.2). */
		onChoose: (action: PanelAction) => void;
		/** Abre la confirmación de Borrar tarea. */
		onRequestDelete: () => void;
	} = $props();
</script>

<SectionFrame name="Acciones" {presentation} {openSection}>
	{#if postpone === 'posponer'}
		<div class="grupo" role="group" aria-label="Posponer">
			{#each POSTPONE_OPTIONS as { option, label } (option)}
				<button type="button" class="accion" onclick={() => onChoose(optionAction(option))}>
					<Icon name={POSTPONE_ICONS[option]} />{label}
				</button>
			{/each}
		</div>
	{:else if postpone === 'quitar'}
		<button type="button" class="accion" onclick={() => onChoose('quitar posponer')}><Icon name="unpostpone" />Quitar posponer</button>
	{/if}
	{#if pause}
		<button type="button" class="accion" onclick={() => onChoose(pause)}>
			<Icon name={pause === 'pausar' ? 'pause' : 'resume'} />{pause === 'pausar' ? 'Pausar' : 'Reanudar'}
		</button>
	{/if}
	<button type="button" class="accion borrar" onclick={onRequestDelete}><Icon name="delete" />Borrar tarea</button>
</SectionFrame>

<style>
	.grupo {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.accion {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		justify-self: start;
		min-height: 44px;
		padding: 0 1rem;
		border: 1px solid var(--borde);
		border-radius: 0.4rem;
		background: transparent;
		color: var(--texto);
		cursor: pointer;
	}

	.accion.borrar {
		margin-top: 1rem;
		border-color: var(--error);
		color: var(--error);
	}
</style>
