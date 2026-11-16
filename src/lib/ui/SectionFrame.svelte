<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { PanelPresentation, PanelSection } from '#lib/core/panel-tabs.ts';

	/** El contenedor de una sección del panel: tabpanel en pestañas, bloque con título en secciones seguidas. */
	let {
		name,
		presentation,
		openSection,
		children
	}: { name: PanelSection; presentation: PanelPresentation; openSection: PanelSection; children: Snippet } = $props();

	const inTabs = $derived(presentation === 'pestanas');
</script>

<section
	class="seccion"
	id="seccion-{name}"
	role={inTabs ? 'tabpanel' : undefined}
	aria-labelledby={inTabs ? `pestana-${name}` : `titulo-${name}`}
	hidden={inTabs && openSection !== name}
>
	{#if !inTabs}<h3 id="titulo-{name}">{name}</h3>{/if}
	{@render children()}
</section>

<style>
	.seccion {
		display: grid;
		gap: 0.75rem;
		min-width: 0;
	}

	.seccion[hidden] {
		display: none;
	}

	h3 {
		margin: 0;
		font-size: 1rem;
	}
</style>
