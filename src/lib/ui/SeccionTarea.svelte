<script lang="ts">
	import type { CreationErrors } from '#lib/core/creation.ts';
	import type { TaskData } from '#lib/core/task-data.ts';
	import { EFFORT_OPTIONS } from '#lib/core/effort.ts';
	import type { PanelPresentation, PanelSection } from '#lib/core/panel-tabs.ts';
	import type { Effort } from '#lib/core/task.ts';
	import { tick } from 'svelte';
	import CampoEtiquetas from './CampoEtiquetas.svelte';
	import Icono from './iconos/Icono.svelte';
	import MarcoDeSeccion from './MarcoDeSeccion.svelte';
	import { laSesion } from './sesion';

	let {
		presentacion,
		abierta,
		valores,
		pausa,
		textoPospuesta,
		ultimaVez,
		errores,
		limpiar,
		emoji = $bindable(),
		esfuerzo = $bindable(),
		pasos = $bindable(),
		etiquetas = $bindable(),
		errorDeEtiquetas = $bindable(),
		sinConfirmar = $bindable(),
		alAbrirSelector
	}: {
		presentacion: PanelPresentation;
		abierta: PanelSection;
		/** Los valores con que abrió el panel; sin ellos, arranca vacío. */
		valores?: TaskData;
		pausa?: 'pausar' | 'reanudar';
		textoPospuesta?: string;
		ultimaVez?: string;
		errores: CreationErrors;
		/** El error de un campo dura lo que dura su mensaje: al corregirlo se va. */
		limpiar: (campo: keyof CreationErrors) => void;
		emoji: string;
		esfuerzo: Effort | '';
		/** Los pasos más (2, 3…), uno por campo (§6.2). */
		pasos: string[];
		etiquetas: string[];
		errorDeEtiquetas: string | undefined;
		/** El texto escrito en Etiquetas que todavía no se confirmó. */
		sinConfirmar: string;
		alAbrirSelector: () => void;
	} = $props();

	const sesion = laSesion();

	async function agregarPaso() {
		pasos = [...pasos, ''];
		await tick();
		document.getElementById(`campo-paso-${pasos.length + 1}`)?.focus();
	}
</script>

<MarcoDeSeccion nombre="Tarea" {presentacion} {abierta}>
	{#if pausa === 'reanudar'}
		<p class="pausada">Pausada</p>
	{/if}
	{#if textoPospuesta}
		<p class="pausada">{textoPospuesta}</p>
	{/if}
	{#if ultimaVez !== undefined}
		<p class="ultima-vez">Última vez: {ultimaVez}</p>
	{/if}

	<div class="campo-formulario" data-campo="Título">
		<label for="campo-titulo">Título</label>
		<div class="titulo">
			<input
				id="campo-titulo"
				name="titulo"
				autocomplete="off"
				value={valores?.title ?? ''}
				oninput={() => limpiar('title')}
				aria-invalid={errores.title ? 'true' : undefined}
				aria-describedby={errores.title ? 'error-titulo' : undefined}
			/>
			{#if emoji}
				<button type="button" class="emoji-boton elegido" aria-label="Cambiar emoji {emoji}" onclick={alAbrirSelector}>{emoji}</button>
			{:else}
				<button type="button" class="emoji-boton" aria-label="Elegir emoji" onclick={alAbrirSelector}><Icono nombre="emoji" /></button>
			{/if}
		</div>
		{#if errores.title}
			<p id="error-titulo" class="error">Escribí un título.</p>
		{/if}
		{#if emoji}
			<button type="button" class="texto" onclick={() => (emoji = '')}>Quitar emoji</button>
		{/if}
	</div>

	<div class="campo-formulario">
		<label for="campo-primer-paso">Primer paso</label>
		<input id="campo-primer-paso" name="primerPaso" autocomplete="off" value={valores?.firstStep ?? ''} />
	</div>

	{#each pasos as _paso, indice (indice)}
		<div class="campo-formulario">
			<label for={`campo-paso-${indice + 2}`}>Paso {indice + 2}</label>
			<div class="paso">
				<input id={`campo-paso-${indice + 2}`} autocomplete="off" bind:value={pasos[indice]} />
				<button type="button" class="texto" onclick={() => (pasos = pasos.filter((_, i) => i !== indice))}>Quitar</button>
			</div>
		</div>
	{/each}
	<button type="button" class="texto" onclick={agregarPaso}>Agregar paso</button>

	<div class="campo-formulario">
		<label for="campo-version-minima">Versión mínima</label>
		<input id="campo-version-minima" name="versionMinima" autocomplete="off" value={valores?.minimalVersion ?? ''} />
	</div>

	<div class="campo-formulario">
		<label for="campo-nota">Nota</label>
		<textarea id="campo-nota" name="nota" rows="2" value={valores?.note ?? ''}></textarea>
	</div>

	<div class="campo-formulario">
		<label for="campo-esfuerzo">Esfuerzo</label>
		<select id="campo-esfuerzo" bind:value={esfuerzo}>
			{#each EFFORT_OPTIONS as opcion (opcion.text)}
				<option value={opcion.value ?? ''}>{opcion.text}</option>
			{/each}
		</select>
	</div>

	<div data-campo="Etiquetas">
		<CampoEtiquetas bind:nombres={etiquetas} bind:error={errorDeEtiquetas} bind:escrito={sinConfirmar} existentes={sesion.etiquetas} />
	</div>
</MarcoDeSeccion>

<style>
	.titulo {
		display: flex;
		gap: 0.5rem;
	}

	.titulo input {
		flex: 1;
		min-width: 0;
		font-size: 1.25rem;
	}

	.paso {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.paso input {
		flex: 1;
		min-width: 0;
	}

	.emoji-boton {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 44px;
		min-height: 44px;
		padding: 0;
		border: 1px solid var(--borde);
		border-radius: 0.4rem;
		background: transparent;
		color: var(--texto);
		cursor: pointer;
	}

	.emoji-boton.elegido {
		padding: 0 0.5rem;
		font-size: 1.5rem;
	}

	.pausada {
		margin: 0;
		font-weight: 600;
	}

	.ultima-vez {
		margin: 0;
		color: var(--texto-suave);
	}
</style>
