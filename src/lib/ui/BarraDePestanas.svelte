<script lang="ts">
	import type { SeccionDelPanel } from '$lib/core/panel-en-pestanas';
	import Icono from './iconos/Icono.svelte';

	const ICONOS_DE_SECCION = { Tarea: 'tarea', Cuándo: 'cuando', Acciones: 'acciones' } as const;

	let {
		secciones,
		abierta,
		marcadas,
		alElegir
	}: { secciones: readonly SeccionDelPanel[]; abierta: SeccionDelPanel; marcadas: readonly SeccionDelPanel[]; alElegir: (seccion: SeccionDelPanel) => void } = $props();

	function mover(evento: KeyboardEvent, indice: number) {
		const paso = evento.key === 'ArrowRight' ? 1 : evento.key === 'ArrowLeft' ? -1 : 0;
		if (paso === 0) return;
		evento.preventDefault();
		const siguiente = secciones[(indice + paso + secciones.length) % secciones.length];
		alElegir(siguiente);
		document.getElementById(`pestana-${siguiente}`)?.focus();
	}
</script>

<div class="pestanas" role="tablist" aria-label="Secciones">
	{#each secciones as seccion, indice (seccion)}
		<button
			type="button"
			role="tab"
			id="pestana-{seccion}"
			aria-selected={abierta === seccion}
			aria-controls="seccion-{seccion}"
			tabindex={abierta === seccion ? 0 : -1}
			onclick={() => alElegir(seccion)}
			onkeydown={(evento) => mover(evento, indice)}
		>
			<Icono nombre={ICONOS_DE_SECCION[seccion]} />
			{seccion}
			{#if marcadas.includes(seccion)}<span class="marca" role="img" aria-label="con errores"></span>{/if}
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
