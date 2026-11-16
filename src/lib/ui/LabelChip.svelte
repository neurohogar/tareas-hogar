<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { NewLabel } from '#lib/core/label.ts';

	// Un chip es un elemento de lista: su nombre accesible es el de la etiqueta y su descripción, el color
	// (title: el texto del chip queda solo con el nombre).
	let {
		label,
		children,
		actions
	}: {
		label: Pick<NewLabel, 'name' | 'color'>;
		/** Dentro del chip, después del nombre. */
		children?: Snippet;
		/** Al lado del chip. */
		actions?: Snippet;
	} = $props();
</script>

<li class="elemento" aria-label={label.name} title={label.color}>
	<span class="chip" style:--color-chip={`var(--etiqueta-${label.color})`}>
		<span class="nombre">{label.name}</span>
		{@render children?.()}
	</span>
	{@render actions?.()}
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
