<script lang="ts">
	import type { Etiqueta } from '$lib/core/etiqueta';
	import { elegirEtiquetas, type EtiquetaElegida } from '$lib/core/etiquetas-escritas';
	import { agregarEscrita, quitarElegida, sugerencias } from '$lib/core/panel-de-etiquetas';
	import ChipEtiqueta from './ChipEtiqueta.svelte';
	import { MENSAJES_DE_NOMBRE } from './mensajes-de-etiqueta';

	// Spec §6.2: el campo Etiquetas del panel. Guarda los nombres elegidos; las nuevas se crean al guardar la tarea.
	let {
		nombres = $bindable(),
		existentes,
		error = $bindable(),
		escrito = $bindable('')
	}: { nombres: string[]; existentes: Etiqueta[]; error: string | undefined; escrito?: string } = $props();

	const opciones = $derived(sugerencias(escrito, existentes, nombres));
	const abierta = $derived(escrito.trim() !== '');
	/** Los chips, con el color que tendrán las nuevas al guardar. */
	const elegidas = $derived.by((): EtiquetaElegida[] => {
		const eleccion = elegirEtiquetas(nombres, existentes);
		return eleccion.ok ? eleccion.elegidas : [];
	});

	function agregar(nombre: string) {
		const resultado = agregarEscrita(nombre, existentes, nombres);
		if (!resultado.ok) {
			error = MENSAJES_DE_NOMBRE[resultado.error];
			return;
		}
		nombres = resultado.nombres;
		escrito = '';
		error = undefined;
	}

	function alTeclear(evento: KeyboardEvent) {
		if (evento.key !== 'Enter') return;
		evento.preventDefault();
		agregar(escrito);
	}
</script>

<div class="campo">
	<label for="campo-etiquetas">Etiquetas</label>
	{#if elegidas.length > 0}
		<ul class="chips" aria-label="Etiquetas de la tarea">
			{#each elegidas as etiqueta (etiqueta.nombre)}
				<ChipEtiqueta {etiqueta}>
					<button
						type="button"
						class="quitar"
						aria-label={`Quitar «${etiqueta.nombre}»`}
						onclick={() => (nombres = quitarElegida(etiqueta.nombre, nombres))}>×</button
					>
				</ChipEtiqueta>
			{/each}
		</ul>
	{/if}
	<input
		id="campo-etiquetas"
		role="combobox"
		autocomplete="off"
		aria-autocomplete="list"
		aria-expanded={abierta}
		aria-controls="sugerencias-etiquetas"
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={error ? 'error-etiquetas' : undefined}
		bind:value={escrito}
		oninput={() => (error = undefined)}
		onkeydown={alTeclear}
	/>
	{#if abierta}
		<ul id="sugerencias-etiquetas" class="sugerencias" role="listbox" aria-label="Sugerencias de etiquetas">
			{#each opciones.etiquetas as etiqueta (etiqueta.id)}
				<!-- svelte-ignore a11y_click_events_have_key_events: Enter en el campo elige con el teclado -->
				<li role="option" aria-selected="false" tabindex="-1" onclick={() => agregar(etiqueta.nombre)}>{etiqueta.nombre}</li>
			{/each}
			{#if opciones.crear !== undefined}
				{@const crear = opciones.crear}
				<!-- svelte-ignore a11y_click_events_have_key_events: Enter en el campo elige con el teclado -->
				<li role="option" aria-selected="false" tabindex="-1" onclick={() => agregar(crear)}>Crear «{crear}»</li>
			{/if}
		</ul>
	{/if}
	{#if error}
		<p id="error-etiquetas" class="error">{error}</p>
	{/if}
</div>

<style>
	.campo {
		display: grid;
		gap: 0.5rem;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.quitar {
		min-width: 28px;
		min-height: 28px;
		padding: 0;
		border: 0;
		background: transparent;
		color: inherit;
		cursor: pointer;
	}

	input {
		min-height: 44px;
		font: inherit;
		padding: 0 0.5rem;
		border: 1px solid var(--borde);
		border-radius: 0.4rem;
		background: var(--fondo);
		color: var(--texto);
	}

	.sugerencias {
		margin: 0;
		padding: 0.25rem 0;
		list-style: none;
		border: 1px solid var(--borde);
		border-radius: 0.4rem;
		background: var(--superficie);
		max-height: 12rem;
		overflow-y: auto;
	}

	.sugerencias li {
		display: flex;
		align-items: center;
		min-height: 44px;
		padding: 0 0.75rem;
		cursor: pointer;
	}

	.sugerencias li:hover {
		background: var(--fondo);
	}

	.error {
		margin: 0;
		color: var(--error);
		font-size: 0.9rem;
	}
</style>
