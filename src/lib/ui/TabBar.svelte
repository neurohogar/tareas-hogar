<script lang="ts">
	import type { PanelSection } from '#lib/core/panel-tabs.ts';
	import Icon from './icons/Icon.svelte';

	const SECTION_ICONS = { Tarea: 'task', Cuándo: 'when', Acciones: 'actions' } as const;

	let {
		sections,
		openSection,
		marked,
		onChoose
	}: { sections: readonly PanelSection[]; openSection: PanelSection; marked: readonly PanelSection[]; onChoose: (section: PanelSection) => void } = $props();

	function move(event: KeyboardEvent, index: number) {
		const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
		if (step === 0) return;
		event.preventDefault();
		const next = sections[(index + step + sections.length) % sections.length];
		onChoose(next);
		document.getElementById(`pestana-${next}`)?.focus();
	}
</script>

<div class="pestanas" role="tablist" aria-label="Secciones">
	{#each sections as section, index (section)}
		<button
			type="button"
			role="tab"
			id="pestana-{section}"
			aria-selected={openSection === section}
			aria-controls="seccion-{section}"
			tabindex={openSection === section ? 0 : -1}
			onclick={() => onChoose(section)}
			onkeydown={(event) => move(event, index)}
		>
			<Icon name={SECTION_ICONS[section]} />
			{section}
			{#if marked.includes(section)}<span class="marca" role="img" aria-label="con errores"></span>{/if}
		</button>
	{/each}
</div>

<style>
	.pestanas {
		display: flex;
		flex: none;
		border-bottom: 1px solid var(--borde);
	}

	.pestanas button {
		position: relative;
		display: flex;
		flex: 1;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		min-width: 0;
		min-height: 48px;
		padding: 0 0.5rem;
		border: 0;
		border-bottom: 3px solid transparent;
		background: transparent;
		color: var(--texto-suave);
		cursor: pointer;
	}

	.pestanas button[aria-selected='true'] {
		border-bottom-color: var(--acento);
		color: var(--texto);
		font-weight: 600;
	}

	/* La marca de error es un punto, distinto del icono de la pestaña. */
	.marca {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
		background: var(--error);
	}
</style>
