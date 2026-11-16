<script lang="ts">
	import { connectionStrip } from '#lib/core/connection.ts';
	import { onlineState } from './online.svelte';

	const online = onlineState();
	const text = $derived(connectionStrip(online.value));

	// Mientras se ve, el panel a pantalla completa empieza debajo de ella.
	$effect(() => {
		if (!text) return;
		document.documentElement.style.setProperty('--alto-franja', '1.5rem');
		return () => document.documentElement.style.removeProperty('--alto-franja');
	});
</script>

{#if text}<div class="franja" role="status">{text}</div>{/if}

<style>
	.franja {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 30;
		box-sizing: border-box;
		height: 1.5rem;
		padding: 0.25rem 1rem;
		background: var(--texto-suave);
		color: var(--fondo);
		font-size: 0.8rem;
		line-height: 1rem;
		text-align: center;
	}
</style>
