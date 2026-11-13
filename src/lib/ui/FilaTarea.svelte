<script lang="ts">
	import { porcentajeDeProgreso, type Estado } from '#lib/core/estado.ts';
	import type { Etiqueta } from '#lib/core/etiqueta.ts';
	import { textoDeEsfuerzo } from '#lib/core/esfuerzo.ts';
	import { textoDelHorario } from '#lib/core/horario.ts';
	import { nombreDeTarea } from '#lib/core/nombre-de-tarea.ts';
	import type { Tarea } from '#lib/core/tarea.ts';
	import ChipEtiqueta from './ChipEtiqueta.svelte';

	let {
		tarea,
		estado,
		completada,
		textoDeFecha,
		habilitado,
		etiquetas,
		alTocarCheckbox,
		alAbrir
	}: {
		tarea: Tarea;
		estado: Estado;
		/** Spec §6.1 (Contraste): tachada, en peso normal y atenuada, con el checkbox marcado. */
		completada: boolean;
		/** «Tocaba …» o «Vuelve …» (§6.1), ya armado por el core; sin él, la fila no lleva texto de fecha. */
		textoDeFecha?: string;
		/** Spec §6.1 y §5.5: deshabilitado si tocarlo completaría fuera de la ventana del horario. */
		habilitado: boolean;
		/** Las etiquetas de la tarea, ya en orden (§4.3). */
		etiquetas: Etiqueta[];
		alTocarCheckbox: () => void;
		alAbrir: () => void;
	} = $props();

	const nombre = $derived(nombreDeTarea(tarea));
	const nivel = $derived(textoDeEsfuerzo(tarea.esfuerzo));

	function tocar(evento: Event) {
		// Marcado se deriva de los completados: el checkbox vuelve a su valor hasta que llegan.
		(evento.currentTarget as HTMLInputElement).checked = completada;
		alTocarCheckbox();
	}
</script>

<li class="fila" class:en-espera={estado.tipo === 'en espera'} class:pausada={estado.tipo === 'pausada'} class:completada>
	<label class="area-checkbox">
		<input type="checkbox" checked={completada} disabled={!habilitado} aria-label={`Completar ${nombre}`} onchange={tocar} />
	</label>
	<div class="contenido">
		<!-- El botón cubre toda la fila fuera del checkbox: tocarla abre la edición. -->
		<button type="button" class="titulo" onclick={alAbrir}>{nombre}</button>
		{#if etiquetas.length > 0}
			<!-- Debajo del botón de la fila: tocar un chip es tocar la fila, no filtra. -->
			<ul class="chips" aria-label="Etiquetas">
				{#each etiquetas as etiqueta (etiqueta.id)}
					<ChipEtiqueta {etiqueta} />
				{/each}
			</ul>
		{/if}
		{#if nivel}
			<span class="esfuerzo">{nivel}</span>
		{/if}
		{#if tarea.horario}
			<span class="horario">{textoDelHorario(tarea.horario)}</span>
		{/if}
		{#if estado.tipo === 'pausada'}
			<span class="estado-pausada">Pausada</span>
		{/if}
		{#if textoDeFecha}
			<span class="texto-de-fecha">{textoDeFecha}</span>
		{/if}
		{#if estado.tipo === 'en espera'}
			{@const porcentaje = porcentajeDeProgreso(estado.progreso)}
			<div
				class="barra"
				role="progressbar"
				aria-label={`Tiempo hasta que vuelve ${nombre}`}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={porcentaje}
			>
				<div class="relleno" style:width={`${porcentaje}%`}></div>
			</div>
		{/if}
	</div>
</li>

<style>
	.fila {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem 0.25rem 0;
		border-bottom: 1px solid var(--borde);
		opacity: 1;
	}



	.esfuerzo {
		font-size: 0.8rem;
		color: var(--texto-suave);
	}

	.estado-pausada {
		font-size: 0.8rem;
		color: var(--texto-suave);
	}

	.area-checkbox {
		display: grid;
		place-items: center;
		min-width: 48px;
		min-height: 48px;
		cursor: pointer;
	}

	.area-checkbox input {
		width: 1.4rem;
		height: 1.4rem;
		margin: 0;
		accent-color: var(--acento);
		cursor: pointer;
	}

	.contenido {
		position: relative;
		flex: 1;
		min-height: 48px;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 0.75rem;
	}

	.titulo {
		padding: 0;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		font-weight: 700;
		text-align: left;
		cursor: pointer;
	}

	.completada .titulo {
		font-weight: 400;
		text-decoration-line: line-through;
		opacity: 0.6;
	}

	.en-espera .titulo,
	.pausada .titulo {
		color: var(--texto-suave);
	}

	.titulo::after {
		content: '';
		position: absolute;
		inset: 0;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.area-checkbox:has(input:disabled),
	.area-checkbox input:disabled {
		cursor: not-allowed;
	}

	.area-checkbox input:disabled {
		opacity: 0.4;
	}

	.horario {
		font-size: 0.8rem;
		color: var(--texto-suave);
		opacity: 1;
		font-variant-numeric: tabular-nums;
	}

	.texto-de-fecha {
		font-size: 0.8rem;
		color: var(--texto-suave);
		font-variant-numeric: tabular-nums;
	}

	/* Fuera del flujo, en el padding inferior de la fila: no corre el título respecto del checkbox. */
	.barra {
		position: absolute;
		left: 0;
		right: 0;
		bottom: -0.2rem;
		height: 3px;
		border-radius: 2px;
		background: var(--borde);
		overflow: hidden;
	}

	.relleno {
		height: 100%;
		background: var(--acento);
	}
</style>
