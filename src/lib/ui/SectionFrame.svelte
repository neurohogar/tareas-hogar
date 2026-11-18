<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { PanelPresentation, PanelSection } from '#lib/core/panel-tabs.ts';

	/** The container of a panel section: tabpanel in tabs, a block with a title in consecutive sections. */
	let {
		name,
		presentation,
		openSection,
		children
	}: { name: PanelSection; presentation: PanelPresentation; openSection: PanelSection; children: Snippet } = $props();

	const inTabs = $derived(presentation === 'pestanas');
</script>

<section
	class="section"
	id="section-{name}"
	role={inTabs ? 'tabpanel' : undefined}
	aria-labelledby={inTabs ? `tab-${name}` : `title-${name}`}
	hidden={inTabs && openSection !== name}
>
	{#if !inTabs}<h3 id="title-{name}">{name}</h3>{/if}
	{@render children()}
</section>

<style>
	.section {
		display: grid;
		gap: 0.75rem;
		min-width: 0;
	}

	.section[hidden] {
		display: none;
	}

	h3 {
		margin: 0;
		font-size: 1rem;
	}
</style>
