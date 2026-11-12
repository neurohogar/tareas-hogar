<script lang="ts">
	import { onMount } from 'svelte';

	// Texto breve e informativo, sin botones, que se va solo (§5.10, §6.7).
	let { texto, alIrse }: { texto: string; alIrse: () => void } = $props();

	const DURACION_MS = 5_000;

	onMount(() => {
		const vencimiento = setTimeout(alIrse, DURACION_MS);
		return () => clearTimeout(vencimiento);
	});
</script>

<div class="confirmacion" role="status">{texto}</div>

<style>
	.confirmacion {
		position: fixed;
		top: calc(var(--alto-franja, 0px) + 3.75rem);
		left: 50%;
		transform: translateX(-50%);
		z-index: 25;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		background: var(--texto);
		color: var(--fondo);
		pointer-events: none;
	}
</style>
