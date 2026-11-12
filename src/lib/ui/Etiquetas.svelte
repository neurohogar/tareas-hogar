<script lang="ts">
	import { PALETA, type Color, type Etiqueta } from '$lib/core/etiqueta';
	import { ordenarEtiquetas } from '$lib/core/orden-de-etiquetas';
	import ChipEtiqueta from './ChipEtiqueta.svelte';
	import { MENSAJES_DE_NOMBRE } from './mensajes-de-etiqueta';
	import { laSesion } from './sesion';

	// Spec §6.4: renombrar, cambiar el color y borrar. No se crean etiquetas desde acá.
	const sesion = laSesion();
	const etiquetas = $derived(ordenarEtiquetas(sesion.etiquetas));


	type Dialogo =
		| { tipo: 'renombrar'; etiqueta: Etiqueta; nombre: string; error?: string }
		| { tipo: 'color'; etiqueta: Etiqueta; color: Color }
		| { tipo: 'borrar'; etiqueta: Etiqueta };

	let dialogo = $state<Dialogo | undefined>(undefined);

	function guardarNombre(evento: SubmitEvent) {
		evento.preventDefault();
		if (dialogo?.tipo !== 'renombrar') return;
		const error = sesion.renombrarEtiqueta(dialogo.etiqueta, dialogo.nombre);
		if (error) dialogo.error = MENSAJES_DE_NOMBRE[error];
		else dialogo = undefined;
	}

	function guardarColor(evento: SubmitEvent) {
		evento.preventDefault();
		if (dialogo?.tipo !== 'color') return;
		sesion.recolorearEtiqueta(dialogo.etiqueta, dialogo.color);
		dialogo = undefined;
	}

	function borrar(etiqueta: Etiqueta) {
		dialogo = undefined;
		sesion.borrarEtiqueta(etiqueta);
	}
</script>

<section>
	<h1>Etiquetas</h1>
	{#if etiquetas.length === 0}
		<p class="vacio">Todavía no hay etiquetas</p>
	{:else}
		<ul class="lista">
			{#each etiquetas as etiqueta (etiqueta.id)}
				<ChipEtiqueta {etiqueta}>
					{#snippet acciones()}
						<span class="acciones">
							<button type="button" onclick={() => (dialogo = { tipo: 'renombrar', etiqueta, nombre: etiqueta.nombre })}>Renombrar</button>
							<button type="button" onclick={() => (dialogo = { tipo: 'color', etiqueta, color: etiqueta.color })}>Cambiar color</button>
							<button type="button" class="peligro" onclick={() => (dialogo = { tipo: 'borrar', etiqueta })}>Borrar</button>
						</span>
					{/snippet}
				</ChipEtiqueta>
			{/each}
		</ul>
	{/if}
</section>

{#if dialogo?.tipo === 'renombrar'}
	<div class="fondo" role="dialog" aria-modal="true" aria-labelledby="titulo-renombrar">
		<form class="caja" novalidate onsubmit={guardarNombre}>
			<h2 id="titulo-renombrar">Renombrar etiqueta</h2>
			<label for="campo-nombre">Nombre</label>
			<input
				id="campo-nombre"
				autocomplete="off"
				bind:value={dialogo.nombre}
				aria-invalid={dialogo.error ? 'true' : undefined}
				aria-describedby={dialogo.error ? 'error-nombre' : undefined}
			/>
			{#if dialogo.error}
				<p id="error-nombre" class="error">{dialogo.error}</p>
			{/if}
			<div class="botones">
				<button type="button" onclick={() => (dialogo = undefined)}>Cancelar</button>
				<button type="submit" class="principal">Guardar</button>
			</div>
		</form>
	</div>
{:else if dialogo?.tipo === 'color'}
	<div class="fondo" role="dialog" aria-modal="true" aria-labelledby="titulo-color">
		<form class="caja" onsubmit={guardarColor}>
			<h2 id="titulo-color">Color de «{dialogo.etiqueta.nombre}»</h2>
			<div class="colores" role="radiogroup" aria-label="Color">
				{#each PALETA as color (color)}
					<label class="color" style:--color-chip={`var(--etiqueta-${color})`}>
						<input type="radio" name="color" value={color} bind:group={dialogo.color} />
						{color}
					</label>
				{/each}
			</div>
			<div class="botones">
				<button type="button" onclick={() => (dialogo = undefined)}>Cancelar</button>
				<button type="submit" class="principal">Guardar</button>
			</div>
		</form>
	</div>
{:else if dialogo?.tipo === 'borrar'}
	{@const etiqueta = dialogo.etiqueta}
	<div class="fondo" role="alertdialog" aria-modal="true" aria-labelledby="titulo-borrar" aria-describedby="aclaracion-borrar">
		<div class="caja">
			<p id="titulo-borrar">¿Borrar la etiqueta «{etiqueta.nombre}»?</p>
			<p id="aclaracion-borrar" class="aclaracion">Las tareas no se borran.</p>
			<div class="botones">
				<button type="button" onclick={() => (dialogo = undefined)}>Cancelar</button>
				<button type="button" class="principal" onclick={() => borrar(etiqueta)}>Borrar</button>
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
		margin: 0 0 0.5rem;
		font-size: 1.1rem;
	}

	.lista {
		display: grid;
		gap: 0;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.lista :global(.elemento) {
		justify-content: space-between;
		flex-wrap: wrap;
		min-height: 48px;
		border-bottom: 1px solid var(--borde);
	}

	.acciones {
		display: flex;
		gap: 0.25rem;
	}

	.acciones button {
		min-height: 44px;
		padding: 0 0.6rem;
		border: 0;
		background: transparent;
		color: var(--acento);
		cursor: pointer;
	}

	.acciones .peligro {
		color: var(--error);
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
		display: grid;
		gap: 0.5rem;
		width: min(24rem, calc(100% - 2rem));
		box-sizing: border-box;
		padding: 1rem;
		border-radius: 0.75rem;
		background: var(--superficie);
	}

	.caja p {
		margin: 0;
	}

	.aclaracion {
		color: var(--texto-suave);
	}

	input:not([type='radio']) {
		min-height: 44px;
		font: inherit;
		padding: 0 0.5rem;
		border: 1px solid var(--borde);
		border-radius: 0.4rem;
		background: var(--fondo);
		color: var(--texto);
	}

	.colores {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.35rem;
	}

	.color {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		min-height: 44px;
		padding: 0 0.6rem;
		border-radius: 0.4rem;
		background: var(--color-chip);
		cursor: pointer;
	}

	.error {
		color: var(--error);
		font-size: 0.9rem;
	}

	.botones {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.botones button {
		min-height: 44px;
		padding: 0 1rem;
		border: 1px solid var(--borde);
		border-radius: 0.4rem;
		background: transparent;
		color: var(--texto);
		cursor: pointer;
	}

	.botones .principal {
		border-color: var(--acento);
		background: var(--acento);
		color: var(--superficie);
	}
</style>
