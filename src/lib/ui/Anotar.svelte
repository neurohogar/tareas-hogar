<script lang="ts">
	import { tick } from 'svelte';
	import { tomarAtras } from '#lib/adapters/atras.ts';
	import type { Sentido } from '#lib/core/anotacion.ts';
	import AnotarConfirmacion from './AnotarConfirmacion.svelte';
	import { laSesion } from './sesion';

	// Spec §5.10: un botón chico, siempre arriba en el mismo lugar, y el recuadro de los dos toques.
	const sesion = laSesion();
	let texto = $state('');
	let campo = $state<HTMLInputElement>();
	/** Cuántas veces se guardó: cada una muestra su confirmación. */
	let guardadas = $state(0);
	let confirmando = $state(false);

	function abrir() {
		texto = '';
		sesion.abrirAnotar();
		void tick().then(() => campo?.focus());
	}

	function elegir(sentido: Sentido) {
		sesion.anotar(sentido, texto);
		confirmando = true;
		guardadas++;
	}

	// Con el panel abierto, Atrás lo maneja el panel; si no, el recuadro toma su propia entrada (§6.2).
	$effect(() => {
		if (!sesion.anotando || sesion.hayPanel) return;
		const capa = tomarAtras(() => {
			sesion.cerrarAnotar();
			return false;
		});
		return () => capa.soltar();
	});
</script>

<svelte:window onkeydown={(evento) => evento.key === 'Escape' && sesion.anotando && sesion.cerrarAnotar()} />

<button type="button" class="anotar" onclick={abrir}>Anotar</button>

{#if sesion.anotando}
	<div class="fondo">
		<div class="caja" role="dialog" aria-modal="true" aria-label="Anotar">
			<label class="campo">
				Texto
				<input type="text" bind:this={campo} bind:value={texto} onkeydown={(evento) => evento.key === 'Enter' && evento.preventDefault()} />
			</label>
			<div class="acciones">
				<button type="button" onclick={() => elegir('Me sirvió')}>Me sirvió</button>
				<button type="button" onclick={() => elegir('Me molestó')}>Me molestó</button>
			</div>
		</div>
	</div>
{/if}

{#key guardadas}
	{#if confirmando}
		<AnotarConfirmacion texto="Anotación guardada" alIrse={() => (confirmando = false)} />
	{/if}
{/key}

<style>
	.anotar {
		position: fixed;
		/* Al lado de la X del panel (que está a 0.5rem del borde): mismas coordenadas en todas las pantallas. */
		top: calc(var(--alto-franja, 0px) + 0.5rem);
		right: calc(max(0px, 50% - 20rem) + 4rem);
		/* Above the panel (z-index 2), under its notices. */
		z-index: 3;
		min-height: 44px;
		padding: 0 0.85rem;
		border: 1px solid var(--borde-control);
		border-radius: 999px;
		background: var(--superficie);
		color: var(--texto);
		cursor: pointer;
	}

	.fondo {
		position: fixed;
		inset: 0;
		z-index: 15;
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

	.campo {
		display: grid;
		gap: 0.35rem;
	}

	input {
		min-height: 44px;
		box-sizing: border-box;
		padding: 0 0.5rem;
		border: 1px solid var(--borde);
		border-radius: 0.4rem;
		background: var(--fondo);
		color: var(--texto);
		font: inherit;
	}

	.acciones {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.acciones button {
		min-height: 44px;
		padding: 0 1rem;
		border: 1px solid var(--borde);
		border-radius: 0.4rem;
		background: transparent;
		color: var(--texto);
		cursor: pointer;
	}
</style>
