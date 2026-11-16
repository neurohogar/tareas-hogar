<script lang="ts">
	import { tick } from 'svelte';
	import { takeBack } from '#lib/adapters/back.ts';
	import type { Sense } from '#lib/core/annotation.ts';
	import AnnotateConfirmation from './AnnotateConfirmation.svelte';
	import { useSession } from './session';

	// Spec §5.10: un botón chico, siempre arriba en el mismo lugar, y el recuadro de los dos toques.
	const session = useSession();
	let text = $state('');
	let field = $state<HTMLInputElement>();
	/** Cuántas veces se guardó: cada una muestra su confirmación. */
	let savedCount = $state(0);
	let confirming = $state(false);

	function openBox() {
		text = '';
		session.openAnnotate();
		void tick().then(() => field?.focus());
	}

	function choose(sense: Sense) {
		session.annotate(sense, text);
		confirming = true;
		savedCount++;
	}

	// Con el panel abierto, Atrás lo maneja el panel; si no, el recuadro toma su propia entrada (§6.2).
	$effect(() => {
		if (!session.annotating || session.hasPanel) return;
		const layer = takeBack(() => {
			session.closeAnnotate();
			return false;
		});
		return () => layer.release();
	});
</script>

<svelte:window onkeydown={(event) => event.key === 'Escape' && session.annotating && session.closeAnnotate()} />

<button type="button" class="annotate" onclick={openBox}>Anotar</button>

{#if session.annotating}
	<div class="backdrop">
		<div class="box" role="dialog" aria-modal="true" aria-label="Anotar">
			<label class="field">
				Texto
				<input type="text" bind:this={field} bind:value={text} onkeydown={(event) => event.key === 'Enter' && event.preventDefault()} />
			</label>
			<div class="actions">
				<button type="button" onclick={() => choose('Me sirvió')}>Me sirvió</button>
				<button type="button" onclick={() => choose('Me molestó')}>Me molestó</button>
			</div>
		</div>
	</div>
{/if}

{#key savedCount}
	{#if confirming}
		<AnnotateConfirmation text="Anotación guardada" onLeave={() => (confirming = false)} />
	{/if}
{/key}

<style>
	.annotate {
		position: fixed;
		/* Al lado de la X del panel (que está a 0.5rem del borde): mismas coordenadas en todas las pantallas. */
		top: calc(var(--strip-height, 0px) + 0.5rem);
		right: calc(max(0px, 50% - 20rem) + 4rem);
		/* Above the panel (z-index 2), under its notices. */
		z-index: 3;
		min-height: 44px;
		padding: 0 0.85rem;
		border: 1px solid var(--control-border);
		border-radius: 999px;
		background: var(--surface);
		color: var(--text);
		cursor: pointer;
	}

	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 15;
		display: grid;
		place-items: center;
		background: color-mix(in srgb, black 35%, transparent);
	}

	.box {
		width: min(24rem, calc(100% - 2rem));
		box-sizing: border-box;
		padding: 1rem;
		border-radius: 0.75rem;
		background: var(--surface);
	}

	.field {
		display: grid;
		gap: 0.35rem;
	}

	input {
		min-height: 44px;
		box-sizing: border-box;
		padding: 0 0.5rem;
		border: 1px solid var(--border);
		border-radius: 0.4rem;
		background: var(--page-background);
		color: var(--text);
		font: inherit;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.actions button {
		min-height: 44px;
		padding: 0 1rem;
		border: 1px solid var(--border);
		border-radius: 0.4rem;
		background: transparent;
		color: var(--text);
		cursor: pointer;
	}
</style>
