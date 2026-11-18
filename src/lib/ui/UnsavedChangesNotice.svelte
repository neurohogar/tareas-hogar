<script lang="ts">
	import { onMount } from 'svelte';
	import { CHANGES_MESSAGE, type ChangesNotice, type NoticeButton } from '#lib/core/unsaved-changes-notice.ts';

	// Spec §6.2: the notice for closing or for an action, over the panel. The text and the buttons are decided by the core.
	let { notice, onChoose }: { notice: ChangesNotice; onChoose: (effect: NoticeButton['effect']) => void } = $props();

	let box: HTMLDivElement;
	onMount(() => box.querySelector('button')?.focus());
</script>

<div class="panel" role="alertdialog" aria-modal="true" aria-label={CHANGES_MESSAGE} aria-describedby="changes-message">
	<div class="box" bind:this={box}>
		<p id="changes-message">{notice.message}</p>
		<div class="actions">
			{#each notice.buttons as button, index (button.text)}
				<button type="button" class:primary={index === notice.buttons.length - 1 && button.effect === 'guardar'} onclick={() => onChoose(button.effect)}>{button.text}</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.panel {
		position: fixed;
		inset: 0;
		top: var(--strip-height, 0px);
		z-index: 10;
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

	p {
		margin: 0;
	}

	.actions {
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
		border: 1px solid var(--border);
		border-radius: 0.4rem;
		background: transparent;
		color: var(--text);
		cursor: pointer;
	}

	button.primary {
		border-color: var(--accent);
		background: var(--accent);
		color: var(--surface);
	}
</style>
