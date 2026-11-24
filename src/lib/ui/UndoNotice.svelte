<script lang="ts">
	let { text, returnText, onUndo }: { text: string; returnText?: string; onUndo: () => void } = $props();
	let el: HTMLElement | undefined = $state();

	// Expose the real height so the content reserves space below its last row.
	$effect(() => {
		if (!el) return;
		const root = document.documentElement.style;
		const observer = new ResizeObserver(() => root.setProperty('--notice-height', `${el!.offsetHeight}px`));
		observer.observe(el);
		root.setProperty('--notice-height', `${el.offsetHeight}px`);
		return () => {
			observer.disconnect();
			root.removeProperty('--notice-height');
		};
	});
</script>

<div class="notice" role="status" bind:this={el}>
	<div class="texts">
		<span>{text}</span>
		{#if returnText}
			<span class="return-text">{returnText}</span>
		{/if}
	</div>
	<button type="button" onclick={onUndo}>Deshacer</button>
</div>

<style>
	.notice {
		position: fixed;
		left: 1rem;
		right: calc(56px + 2.5rem);
		bottom: var(--notice-base, 1.25rem);
		z-index: 20;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		max-width: 28rem;
		padding: 0.5rem 0.5rem 0.5rem 1rem;
		border-radius: 8px;
		background: var(--text);
		color: var(--page-background);
	}

	.texts {
		display: flex;
		flex-direction: column;
	}

	.return-text {
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
