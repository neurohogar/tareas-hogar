<script lang="ts">
	// The Etiquetas screen no longer exists (§6 Navegación, S8): whoever lands on /etiquetas (a
	// bookmark, the history) goes to Pendientes, replacing the history entry and without a notice.
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		void goto('/', { replaceState: true });
	});
</script>
