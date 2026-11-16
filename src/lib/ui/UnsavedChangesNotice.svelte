<script lang="ts">
	import { onMount } from 'svelte';
	import { CHANGES_MESSAGE, type ChangesNotice, type NoticeButton } from '#lib/core/unsaved-changes-notice.ts';

	// Spec §6.2: el aviso de cierre o de una acción, sobre el panel. El texto y los botones los decide el core.
	let { notice, onChoose }: { notice: ChangesNotice; onChoose: (effect: NoticeButton['effect']) => void } = $props();

	let box: HTMLDivElement;
	onMount(() => box.querySelector('button')?.focus());
</script>

<div class="panel" role="alertdialog" aria-modal="true" aria-label={CHANGES_MESSAGE} aria-describedby="mensaje-de-cambios">
	<div class="caja" bind:this={box}>
		<p id="mensaje-de-cambios">{notice.message}</p>
		<div class="acciones">
			{#each notice.buttons as button, index (button.text)}
				<button type="button" class:principal={index === notice.buttons.length - 1 && button.effect === 'guardar'} onclick={() => onChoose(button.effect)}>{button.text}</button>
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
