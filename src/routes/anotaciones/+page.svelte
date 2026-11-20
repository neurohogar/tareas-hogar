<script lang="ts">
	// The Anotaciones screen no longer exists (§6 Navegación, S8): whoever lands on /anotaciones (a
	// bookmark, the history) goes to Pendientes, replacing the history entry and without a notice.
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		void goto('/', { replaceState: true });
	});
</script>
