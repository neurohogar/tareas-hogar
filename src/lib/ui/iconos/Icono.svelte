<script lang="ts">
	// Iconos en línea (trazos de 24x24): viajan con el build, así funcionan sin conexión (§2, §7).
	const TRAZOS = {
		tarea: ['M9 11l3 3L22 4', 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'],
		cuando: ['M8 2v4M16 2v4M3 10h18', 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'],
		acciones: ['M13 2L3 14h9l-1 8 10-12h-9l1-8z'],
		reloj: ['M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20z', 'M12 6v6l4 2'],
		manana: ['M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z'],
		'quitar-posponer': ['M1 4v6h6', 'M3.5 15a9 9 0 1 0 2.1-9.4L1 10'],
		pausar: ['M6 4h4v16H6zM14 4h4v16h-4z'],
		reanudar: ['M5 3l14 9-14 9z'],
		borrar: ['M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6'],
		cerrar: ['M18 6L6 18M6 6l12 12'],
		emoji: ['M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20z', 'M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01']
	} as const;

	let { nombre }: { nombre: keyof typeof TRAZOS } = $props();
</script>

<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
	{#each TRAZOS[nombre] as trazo (trazo)}
		<path d={trazo} />
	{/each}
</svg>

<style>
	svg {
		flex: none;
	}
</style>
