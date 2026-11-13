<script lang="ts">
	import { guardarMostrarCompletadas, leerMostrarCompletadas } from '#lib/adapters/mostrar-completadas.ts';
	import { guardarMostrarPausadas, leerMostrarPausadas } from '#lib/adapters/mostrar-pausadas.ts';
	import { checkboxHabilitado } from '#lib/core/checkbox.ts';
	import type { FormularioDelPanel } from '#lib/core/cambios-sin-guardar.ts';
	import { etiquetasDeTarea } from '#lib/core/etiquetas-de-tarea.ts';
	import { filtrarPorEtiqueta, filtroVigente } from '#lib/core/filtro-por-etiqueta.ts';
	import { filtrarSoloRapidas, textoDeListaVacia } from '#lib/core/solo-rapidas.ts';
	import { ordenarEtiquetas } from '#lib/core/orden-de-etiquetas.ts';
	import { filasDePendientes } from '#lib/core/pendientes.ts';
	import FilaTarea from './FilaTarea.svelte';
	import PanelTarea from './PanelTarea.svelte';
	import { laSesion } from './sesion';

	const sesion = laSesion();
	let creando = $state(false);
	const etiquetas = $derived(ordenarEtiquetas(sesion.etiquetas));
	const filtro = $derived(filtroVigente(sesion.filtro, sesion.etiquetas));
	let mostrarCompletadas = $state(leerMostrarCompletadas());
	let mostrarPausadas = $state(leerMostrarPausadas());
	const filas = $derived(
		filtrarSoloRapidas(
			filtrarPorEtiqueta(
				filasDePendientes(sesion.tareas, sesion.completados, sesion.ahora, mostrarCompletadas, mostrarPausadas),
				filtro
			),
			sesion.soloRapidas
		)
	);
	const textoVacio = $derived(filas.length === 0 ? textoDeListaVacia(filtro, sesion.soloRapidas) : undefined);

	function guardarNueva(formulario: FormularioDelPanel) {
		const errores = sesion.crear(formulario);
		if (!errores) creando = false;
		return errores;
	}
</script>

<section>
	<h1>Pendientes</h1>
	{#if etiquetas.length > 0}
		<div class="filtro" role="group" aria-label="Filtrar por etiqueta">
			<button type="button" aria-pressed={filtro === undefined} onclick={() => sesion.elegirFiltro(undefined)}>Todas</button>
			{#each etiquetas as etiqueta (etiqueta.id)}
				<button
					type="button"
					aria-pressed={filtro === etiqueta.id}
					style:--color-chip={`var(--etiqueta-${etiqueta.color})`}
					onclick={() => sesion.elegirFiltro(etiqueta.id)}>{etiqueta.nombre}</button
				>
			{/each}
		</div>
	{/if}
	<div class="controles">
		<button type="button" class="solo-rapidas" aria-pressed={sesion.soloRapidas} onclick={() => sesion.alternarSoloRapidas()}>Solo rápidas</button>
		<label class="mostrar-completadas">
			<input type="checkbox" bind:checked={mostrarCompletadas} onchange={(evento) => guardarMostrarCompletadas(evento.currentTarget.checked)} />
			Completadas
		</label>
		<label class="mostrar-completadas">
			<input type="checkbox" bind:checked={mostrarPausadas} onchange={(evento) => guardarMostrarPausadas(evento.currentTarget.checked)} />
			Pausadas
		</label>
	</div>
	<ul class="lista">
		{#each filas as { tarea, estado, completada, textoDeFecha, textoDePrimerPaso } (tarea.id)}
			<FilaTarea
				{tarea}
				{estado}
				{completada}
				{textoDeFecha}
				{textoDePrimerPaso}
				habilitado={checkboxHabilitado(tarea, sesion.completados, sesion.ahora)}
				etiquetas={etiquetasDeTarea(tarea, sesion.etiquetas)}
				alTocarCheckbox={() => sesion.tocarCheckbox(tarea)}
				alAbrir={() => sesion.abrir(tarea)}
			/>
		{/each}
	</ul>
	{#if textoVacio}
		<p class="vacio">{textoVacio}</p>
	{/if}
	<button type="button" class="nueva" title="Nueva tarea" onclick={() => (creando = true)}>+</button>
</section>

{#if creando}
	<PanelTarea encabezado="Nueva tarea" alGuardar={guardarNueva} alCerrar={() => (creando = false)} />
{/if}

<style>
	h1 {
		font-size: 1.4rem;
		margin: 0.5rem 0 1rem;
	}

	.filtro {
		display: flex;
		gap: 0.4rem;
		margin-bottom: 0.75rem;
		overflow-x: auto;
		padding-bottom: 0.25rem;
	}

	.controles {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
		margin-bottom: 0.5rem;
	}

	.solo-rapidas {
		min-height: 36px;
		padding: 0 0.85rem;
		border: 1px solid var(--borde-control);
		border-radius: 999px;
		background: transparent;
		color: var(--texto);
		cursor: pointer;
	}

	.filtro button {
		flex: none;
		min-height: 36px;
		padding: 0 0.85rem;
		border: 1px solid var(--borde-control);
		border-radius: 999px;
		background: var(--color-chip, transparent);
		color: var(--texto);
		cursor: pointer;
	}

	.filtro button[aria-pressed='true'],
	.solo-rapidas[aria-pressed='true'] {
		border-color: var(--acento);
		box-shadow: inset 0 0 0 2px var(--acento);
		font-weight: 600;
	}

	.mostrar-completadas {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 48px;
		color: var(--texto-suave);
		cursor: pointer;
	}

	.mostrar-completadas input {
		width: 1.2rem;
		height: 1.2rem;
		margin: 0;
		accent-color: var(--acento);
	}

	.vacio {
		color: var(--texto-suave);
	}

	.lista {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.nueva {
		position: fixed;
		right: 1.25rem;
		bottom: calc(var(--alto-navegacion) + 1.25rem);
		width: 56px;
		height: 56px;
		border: 0;
		border-radius: 50%;
		background: var(--acento);
		color: var(--superficie);
		font-size: 1.75rem;
		line-height: 1;
		cursor: pointer;
	}

	@media (min-width: 42.5rem) {
		.nueva {
			right: calc(50% - 20rem + 1.25rem);
		}
	}
</style>
