<script lang="ts">
	import { onMount } from 'svelte';

	// Brief informative text, without buttons, that goes away by itself (§5.10, §6.7).
	let { text, onLeave }: { text: string; onLeave: () => void } = $props();

	const DURATION_MS = 5_000;

	onMount(() => {
		const expiry = setTimeout(onLeave, DURATION_MS);
		return () => clearTimeout(expiry);
	});
</script>

<div class="confirmation" role="status">{text}</div>

<style>
	.confirmation {
		position: fixed;
		top: calc(var(--strip-height, 0px) + 3.75rem);
		left: 50%;
		transform: translateX(-50%);
		z-index: 25;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		background: var(--text);
		color: var(--page-background);
		pointer-events: none;
	}
</style>
