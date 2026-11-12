<script lang="ts">
	import { historial, type EntradaDelHistorial } from '#lib/core/historial.ts';
	import { nombreDeTarea } from '#lib/core/nombre-de-tarea.ts';
	import { laSesion } from './sesion';

	const sesion = laSesion();
	const grupos = $derived(historial(sesion.tareas, sesion.completados, sesion.ahora));

	/** La entrada cuyo Borrar espera confirmación, con el encabezado de su día al tocarlo. */
	let porBorrar = $state.raw<{ entrada: EntradaDelHistorial; encabezado: string } | undefined>(undefined);

	function borrar(entrada: EntradaDelHistorial) {
		porBorrar = undefined;
		sesion.borrarCompletado(entrada.completado);
	}
</script>

<section>
	<h1>Historial</h1>
	{#each grupos as { encabezado, entradas } (encabezado)}
		<h2>{encabezado}</h2>
		<ul class="lista">
			{#each entradas as entrada (entrada.completado.id)}
				<li class="entrada">
					<!-- El botón cubre la entrada fuera de Borrar: tocarla abre la edición de la tarea. -->
					<button type="button" class="titulo" onclick={() => sesion.abrir(entrada.tarea)}>{nombreDeTarea(entrada.tarea)}</button>
					<span class="hora">{entrada.hora}</span>
					<button type="button" class="borrar" onclick={() => (porBorrar = { entrada, encabezado })}>Borrar</button>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="vacio">Todavía no completaste nada</p>
	{/each}
</section>

{#if porBorrar}
	{@const { entrada, encabezado } = porBorrar}
	<div class="fondo" role="alertdialog" aria-modal="true" aria-labelledby="titulo-borrar-completado">
		<div class="caja">
			<p id="titulo-borrar-completado">¿Borrar «{nombreDeTarea(entrada.tarea)}» de {encabezado}, {entrada.hora}?</p>
			<div class="acciones">
				<button type="button" onclick={() => (porBorrar = undefined)}>Cancelar</button>
				<button type="button" class="principal" onclick={() => borrar(entrada)}>Borrar</button>
			</div>
		</div>
	</div>
{/if}

<style>
	h1 {
		font-size: 1.4rem;
		margin: 0.5rem 0 1rem;
	}

	h2 {
		font-size: 1rem;
		margin: 1.25rem 0 0.25rem;
		color: var(--texto-suave);
	}

	.lista {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.entrada {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-height: 48px;
		border-bottom: 1px solid var(--borde);
	}

	.titulo {
		flex: 1;
		padding: 0;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.titulo::after {
		content: '';
		position: absolute;
		inset: 0;
	}

	.hora {
		color: var(--texto-suave);
		font-variant-numeric: tabular-nums;
	}

	.borrar {
		position: relative;
		min-height: 44px;
		padding: 0 0.75rem;
		border: 0;
		background: transparent;
		color: var(--error);
		cursor: pointer;
	}

	.vacio {
		color: var(--texto-suave);
	}

	.fondo {
		position: fixed;
		inset: 0;
		/* Above the navigation bar (z-index 1), whatever the DOM order. */
		z-index: 2;
		display: grid;
		place-items: center;
		background: color-mix(in srgb, black 35%, transparent);
	}

	.caja {
		width: min(24rem, calc(100% - 2rem));
		box-sizing: border-box;
		padding: 1rem;
		border-radius: 0.75rem;
		background: var(--superficie);
	}

	.caja p {
		margin: 0;
	}

	.acciones {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.acciones button {
		min-height: 44px;
		padding: 0 1rem;
		border: 1px solid var(--borde);
		border-radius: 0.4rem;
		background: transparent;
		color: var(--texto);
		cursor: pointer;
	}

	.acciones .principal {
		border-color: var(--acento);
		background: var(--acento);
		color: var(--superficie);
	}
</style>
