<script lang="ts">
	// La pantalla Etiquetas ya no existe (§6 Navegación, S14): quien llega a /etiquetas (un
	// marcador, el historial) va a Pendientes, reemplazando la entrada del historial y sin aviso.
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		void goto('/', { replaceState: true });
	});
</script>
