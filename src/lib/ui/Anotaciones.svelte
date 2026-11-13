<script lang="ts">
	import { copiarAlPortapapeles } from '#lib/adapters/portapapeles.ts';
	import type { Anotacion } from '#lib/core/anotacion.ts';
	import { anotacionesEnPantalla } from '#lib/core/anotaciones.ts';
	import { textoDeAnotaciones } from '#lib/core/anotaciones-copiadas.ts';
	import AnotarConfirmacion from './AnotarConfirmacion.svelte';
	import { laSesion } from './sesion';

	// Spec §6.7: releer las anotaciones, corregir su texto, borrarlas y copiarlas.
	const sesion = laSesion();
	const grupos = $derived(anotacionesEnPantalla(sesion.tareas, sesion.anotaciones, sesion.ahora));

	let editando = $state<{ anotacion: Anotacion; texto: string } | undefined>(undefined);
	let porBorrar = $state.raw<Anotacion | undefined>(undefined);
	/** El aviso de la última copia (un solo texto a la vez); cada copia reinicia su cuenta de 5 s. */
	let aviso = $state<{ texto: string; numero: number } | undefined>(undefined);
	let copias = 0;

	function guardarTexto(evento: SubmitEvent) {
		evento.preventDefault();
		if (!editando) return;
		sesion.editarTextoDeAnotacion(editando.anotacion, editando.texto);
		editando = undefined;
	}

	function borrar(anotacion: Anotacion) {
		porBorrar = undefined;
		sesion.borrarAnotacion(anotacion);
	}

	async function copiar() {
		const texto = textoDeAnotaciones(sesion.tareas, sesion.anotaciones);
		if (texto === undefined) return;
		const copiado = await copiarAlPortapapeles(texto);
		aviso = { texto: copiado ? 'Anotaciones copiadas' : 'No se pudo copiar', numero: ++copias };
	}
</script>

<section>
	<h1>Anotaciones</h1>
	<button type="button" class="copiar" onclick={copiar}>Copiar</button>
	{#each grupos as { encabezado, entradas } (encabezado)}
		<h2>{encabezado}</h2>
		<ul class="lista">
			{#each entradas as { anotacion, hora, nombreDeTarea } (anotacion.id)}
				<li class="entrada">
					<div class="datos">
						<span class="hora">{hora}</span>
						<span class="sentido">{anotacion.sentido}</span>
						<span class="pantalla">{anotacion.pantalla}</span>
						{#if nombreDeTarea}<span class="tarea">{nombreDeTarea}</span>{/if}
						{#if anotacion.texto}<span class="texto">{anotacion.texto}</span>{/if}
					</div>
					<div class="acciones-entrada">
						<button type="button" onclick={() => (editando = { anotacion, texto: anotacion.texto ?? '' })}>Editar texto</button>
						<button type="button" class="borrar" onclick={() => (porBorrar = anotacion)}>Borrar</button>
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="vacio">Todavía no hay anotaciones</p>
	{/each}
</section>

{#if editando}
	<div class="fondo">
		<div class="caja" role="dialog" aria-modal="true" aria-label="Editar texto">
			<form onsubmit={guardarTexto}>
				<label class="campo">
					Texto
					<input type="text" bind:value={editando.texto} />
				</label>
				<div class="acciones">
					<button type="button" onclick={() => (editando = undefined)}>Cancelar</button>
					<button type="submit" class="principal">Guardar</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if porBorrar}
	{@const anotacion = porBorrar}
	<div class="fondo" role="alertdialog" aria-modal="true" aria-labelledby="titulo-borrar-anotacion">
		<div class="caja">
			<p id="titulo-borrar-anotacion">¿Borrar la anotación «{anotacion.sentido}»?</p>
			<div class="acciones">
				<button type="button" onclick={() => (porBorrar = undefined)}>Cancelar</button>
				<button type="button" class="principal" onclick={() => borrar(anotacion)}>Borrar</button>
			</div>
		</div>
	</div>
{/if}

{#if aviso}
	{#key aviso.numero}
		<AnotarConfirmacion texto={aviso.texto} alIrse={() => (aviso = undefined)} />
	{/key}
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

	.copiar,
	.acciones-entrada button,
	.acciones button {
		min-height: 44px;
		padding: 0 0.75rem;
		border: 1px solid var(--borde);
		border-radius: 0.4rem;
		background: transparent;
		color: var(--texto);
		cursor: pointer;
	}

	.lista {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.entrada {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		min-height: 48px;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--borde);
	}

	.datos {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 0.75rem;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.hora {
		color: var(--texto-suave);
		font-variant-numeric: tabular-nums;
	}

	.pantalla {
		color: var(--texto-suave);
	}

	.acciones-entrada {
		display: flex;
		flex: none;
		gap: 0.25rem;
	}

	.acciones-entrada .borrar {
		color: var(--error);
	}

	.vacio {
		color: var(--texto-suave);
	}

	.fondo {
		position: fixed;
		inset: 0;
		/* Above the navigation bar (z-index 1) and the Anotar button (z-index 3). */
		z-index: 4;
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

	.campo {
		display: grid;
		gap: 0.35rem;
	}

	input {
		min-height: 44px;
		box-sizing: border-box;
		padding: 0 0.5rem;
		border: 1px solid var(--borde);
		border-radius: 0.4rem;
		background: var(--fondo);
		color: var(--texto);
		font: inherit;
	}

	.acciones {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.acciones .principal {
		border-color: var(--acento);
		background: var(--acento);
		color: var(--superficie);
	}
</style>
