<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { PresentacionDelPanel, SeccionDelPanel } from '#lib/core/panel-en-pestanas.ts';

	/** El contenedor de una sección del panel: tabpanel en pestañas, bloque con título en secciones seguidas. */
	let {
		nombre,
		presentacion,
		abierta,
		children
	}: { nombre: SeccionDelPanel; presentacion: PresentacionDelPanel; abierta: SeccionDelPanel; children: Snippet } = $props();

	const enPestanas = $derived(presentacion === 'pestanas');
</script>

<section
	class="seccion"
	id="seccion-{nombre}"
	role={enPestanas ? 'tabpanel' : undefined}
	aria-labelledby={enPestanas ? `pestana-${nombre}` : `titulo-${nombre}`}
	hidden={enPestanas && abierta !== nombre}
>
	{#if !enPestanas}<h3 id="titulo-{nombre}">{nombre}</h3>{/if}
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
