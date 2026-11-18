<script lang="ts">
	import { connectionStrip } from '#lib/core/connection.ts';
	import { onlineState } from './online.svelte';

	const online = onlineState();
	const text = $derived(connectionStrip(online.value));

	// While it is shown, the full-screen panel starts below it.
	$effect(() => {
		if (!text) return;
		document.documentElement.style.setProperty('--strip-height', '1.5rem');
		return () => document.documentElement.style.removeProperty('--strip-height');
	});
</script>

{#if text}<div class="strip" role="status">{text}</div>{/if}

<style>
	.strip {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 30;
		box-sizing: border-box;
		height: 1.5rem;
		padding: 0.25rem 1rem;
		background: var(--text-muted);
		color: var(--page-background);
		font-size: 0.8rem;
		line-height: 1rem;
		text-align: center;
	}
</style>
