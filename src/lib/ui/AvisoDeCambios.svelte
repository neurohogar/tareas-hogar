<script lang="ts">
	import { onMount } from 'svelte';
	import { MENSAJE_DE_CAMBIOS, type AvisoDeCambios, type BotonDelAviso } from '$lib/core/cambios-sin-guardar-aviso';

	// Spec §6.2: el aviso de cierre o de una acción, sobre el panel. El texto y los botones los decide el core.
	let { aviso, alElegir }: { aviso: AvisoDeCambios; alElegir: (efecto: BotonDelAviso['efecto']) => void } = $props();

	let caja: HTMLDivElement;
	onMount(() => caja.querySelector('button')?.focus());
</script>

<div class="panel" role="alertdialog" aria-modal="true" aria-label={MENSAJE_DE_CAMBIOS} aria-describedby="mensaje-de-cambios">
	<div class="caja" bind:this={caja}>
		<p id="mensaje-de-cambios">{aviso.mensaje}</p>
		<div class="acciones">
			{#each aviso.botones as boton, indice (boton.texto)}
				<button type="button" class:principal={indice === aviso.botones.length - 1 && boton.efecto === 'guardar'} onclick={() => alElegir(boton.efecto)}>{boton.texto}</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.panel {
		position: fixed;
		inset: 0;
		top: var(--alto-franja, 0px);
		z-index: 10;
		display: grid;
		place-items: center;
		background: color-mix(in srgb, black 35%, transparent);
	}

	.caja {
		width: min(24rem, calc(100% - 2rem));
		box-sizing: border-box;
		padding: 1rem;
		border-radius: 0.75rem;
		background: var(--superficie);
	}

	p {
		margin: 0;
	}

	.acciones {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		padding: 0 1rem;
		border: 1px solid var(--borde);
		border-radius: 0.4rem;
		background: transparent;
		color: var(--texto);
		cursor: pointer;
	}

	button.principal {
		border-color: var(--acento);
		background: var(--acento);
		color: var(--superficie);
	}
</style>
