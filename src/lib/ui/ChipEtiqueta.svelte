<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { EtiquetaNueva } from '#lib/core/etiqueta.ts';

	// Un chip es un elemento de lista: su nombre accesible es el de la etiqueta y su descripción, el color
	// (title: el texto del chip queda solo con el nombre).
	let {
		etiqueta,
		children,
		acciones
	}: {
		etiqueta: Pick<EtiquetaNueva, 'nombre' | 'color'>;
		/** Dentro del chip, después del nombre. */
		children?: Snippet;
		/** Al lado del chip. */
		acciones?: Snippet;
	} = $props();
</script>

<li class="elemento" aria-label={etiqueta.nombre} title={etiqueta.color}>
	<span class="chip" style:--color-chip={`var(--etiqueta-${etiqueta.color})`}>
		<span class="nombre">{etiqueta.nombre}</span>
		{@render children?.()}
	</span>
	{@render acciones?.()}
</li>

<style>
	.elemento {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		min-width: 0;
		max-width: 100%;
		padding: 0.1rem 0.6rem;
		border-radius: 999px;
		background: var(--color-chip);
		color: var(--texto);
		font-size: 0.8rem;
		line-height: 1.5;
	}

	.nombre {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
