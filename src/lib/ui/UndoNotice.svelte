<script lang="ts">
	let { text, returnText, onUndo }: { text: string; returnText?: string; onUndo: () => void } = $props();
</script>

<div class="aviso" role="status">
	<div class="textos">
		<span>{text}</span>
		{#if returnText}
			<span class="regreso">{returnText}</span>
		{/if}
	</div>
	<button type="button" onclick={onUndo}>Deshacer</button>
</div>

<style>
	.aviso {
		position: fixed;
		left: 1rem;
		right: calc(56px + 2.5rem);
		bottom: var(--base-aviso, calc(var(--alto-navegacion) + 1.25rem));
		z-index: 20;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		max-width: 28rem;
		padding: 0.5rem 0.5rem 0.5rem 1rem;
		border-radius: 8px;
		background: var(--texto);
		color: var(--fondo);
	}

	.textos {
		display: flex;
		flex-direction: column;
	}

	.regreso {
		font-size: 0.8rem;
		font-variant-numeric: tabular-nums;
	}

	button {
		min-height: 44px;
		padding: 0 0.75rem;
		border: 0;
		background: transparent;
		color: inherit;
		font-weight: 600;
		cursor: pointer;
	}
</style>
