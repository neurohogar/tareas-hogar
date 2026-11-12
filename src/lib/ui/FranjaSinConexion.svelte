<script lang="ts">
	import { franjaDeConexion } from '#lib/core/conexion.ts';
	import { enLineaReactivo } from './en-linea.svelte';

	const enLinea = enLineaReactivo();
	const texto = $derived(franjaDeConexion(enLinea.valor));

	// Mientras se ve, el panel a pantalla completa empieza debajo de ella.
	$effect(() => {
		if (!texto) return;
		document.documentElement.style.setProperty('--alto-franja', '1.5rem');
		return () => document.documentElement.style.removeProperty('--alto-franja');
	});
</script>

{#if texto}<div class="franja" role="status">{texto}</div>{/if}

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
