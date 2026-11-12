<script lang="ts">
	import type { ErroresDeCreacion } from '#lib/core/creacion.ts';
	import type { DatosDeTarea } from '#lib/core/datos-de-tarea.ts';
	import { OPCIONES_DE_ESFUERZO } from '#lib/core/esfuerzo.ts';
	import type { PresentacionDelPanel, SeccionDelPanel } from '#lib/core/panel-en-pestanas.ts';
	import type { Esfuerzo } from '#lib/core/tarea.ts';
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
		etiquetas = $bindable(),
		errorDeEtiquetas = $bindable(),
		sinConfirmar = $bindable(),
		alAbrirSelector
	}: {
		presentacion: PresentacionDelPanel;
		abierta: SeccionDelPanel;
		/** Los valores con que abrió el panel; sin ellos, arranca vacío. */
		valores?: DatosDeTarea;
		pausa?: 'pausar' | 'reanudar';
		textoPospuesta?: string;
		ultimaVez?: string;
		errores: ErroresDeCreacion;
		/** El error de un campo dura lo que dura su mensaje: al corregirlo se va. */
		limpiar: (campo: keyof ErroresDeCreacion) => void;
		emoji: string;
		esfuerzo: Esfuerzo | '';
		etiquetas: string[];
		errorDeEtiquetas: string | undefined;
		/** El texto escrito en Etiquetas que todavía no se confirmó. */
		sinConfirmar: string;
		alAbrirSelector: () => void;
	} = $props();

	const sesion = laSesion();
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
				value={valores?.titulo ?? ''}
				oninput={() => limpiar('titulo')}
				aria-invalid={errores.titulo ? 'true' : undefined}
				aria-describedby={errores.titulo ? 'error-titulo' : undefined}
			/>
			{#if emoji}
				<button type="button" class="emoji-boton elegido" aria-label="Cambiar emoji {emoji}" onclick={alAbrirSelector}>{emoji}</button>
			{:else}
				<button type="button" class="emoji-boton" aria-label="Elegir emoji" onclick={alAbrirSelector}><Icono nombre="emoji" /></button>
			{/if}
		</div>
		{#if errores.titulo}
			<p id="error-titulo" class="error">Escribí un título.</p>
		{/if}
		{#if emoji}
			<button type="button" class="texto" onclick={() => (emoji = '')}>Quitar emoji</button>
		{/if}
	</div>

	<div class="campo-formulario">
		<label for="campo-nota">Nota</label>
		<textarea id="campo-nota" name="nota" rows="2" value={valores?.nota ?? ''}></textarea>
	</div>

	<div class="campo-formulario">
		<label for="campo-esfuerzo">Esfuerzo</label>
		<select id="campo-esfuerzo" bind:value={esfuerzo}>
			{#each OPCIONES_DE_ESFUERZO as opcion (opcion.texto)}
				<option value={opcion.valor ?? ''}>{opcion.texto}</option>
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
