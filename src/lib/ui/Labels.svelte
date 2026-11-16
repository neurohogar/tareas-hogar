<script lang="ts">
	import { PALETTE, type Color, type Label } from '#lib/core/label.ts';
	import { sortLabels } from '#lib/core/label-order.ts';
	import LabelChip from './LabelChip.svelte';
	import { NAME_MESSAGES } from './label-messages';
	import { useSession } from './session';

	// Spec §6.4: renombrar, cambiar el color y borrar. No se crean etiquetas desde acá.
	const session = useSession();
	const labels = $derived(sortLabels(session.labels));


	type Dialog =
		| { kind: 'renombrar'; label: Label; name: string; error?: string }
		| { kind: 'color'; label: Label; color: Color }
		| { kind: 'borrar'; label: Label };

	let dialog = $state<Dialog | undefined>(undefined);

	function saveName(event: SubmitEvent) {
		event.preventDefault();
		if (dialog?.kind !== 'renombrar') return;
		const error = session.renameLabel(dialog.label, dialog.name);
		if (error) dialog.error = NAME_MESSAGES[error];
		else dialog = undefined;
	}

	function saveColor(event: SubmitEvent) {
		event.preventDefault();
		if (dialog?.kind !== 'color') return;
		session.recolorLabel(dialog.label, dialog.color);
		dialog = undefined;
	}

	function deleteLabel(label: Label) {
		dialog = undefined;
		session.deleteLabel(label);
	}
</script>

<section>
	<h1>Etiquetas</h1>
	{#if labels.length === 0}
		<p class="vacio">Todavía no hay etiquetas</p>
	{:else}
		<ul class="lista">
			{#each labels as label (label.id)}
				<LabelChip {label}>
					{#snippet actions()}
						<span class="acciones">
							<button type="button" onclick={() => (dialog = { kind: 'renombrar', label, name: label.name })}>Renombrar</button>
							<button type="button" onclick={() => (dialog = { kind: 'color', label, color: label.color })}>Cambiar color</button>
							<button type="button" class="peligro" onclick={() => (dialog = { kind: 'borrar', label })}>Borrar</button>
						</span>
					{/snippet}
				</LabelChip>
			{/each}
		</ul>
	{/if}
</section>

{#if dialog?.kind === 'renombrar'}
	<div class="fondo" role="dialog" aria-modal="true" aria-labelledby="titulo-renombrar">
		<form class="caja" novalidate onsubmit={saveName}>
			<h2 id="titulo-renombrar">Renombrar etiqueta</h2>
			<label for="campo-nombre">Nombre</label>
			<input
				id="campo-nombre"
				autocomplete="off"
				bind:value={dialog.name}
				aria-invalid={dialog.error ? 'true' : undefined}
				aria-describedby={dialog.error ? 'error-nombre' : undefined}
			/>
			{#if dialog.error}
				<p id="error-nombre" class="error">{dialog.error}</p>
			{/if}
			<div class="botones">
				<button type="button" onclick={() => (dialog = undefined)}>Cancelar</button>
				<button type="submit" class="principal">Guardar</button>
			</div>
		</form>
	</div>
{:else if dialog?.kind === 'color'}
	<div class="fondo" role="dialog" aria-modal="true" aria-labelledby="titulo-color">
		<form class="caja" onsubmit={saveColor}>
			<h2 id="titulo-color">Color de «{dialog.label.name}»</h2>
			<div class="colores" role="radiogroup" aria-label="Color">
				{#each PALETTE as color (color)}
					<label class="color" style:--color-chip={`var(--etiqueta-${color})`}>
						<input type="radio" name="color" value={color} bind:group={dialog.color} />
						{color}
					</label>
				{/each}
			</div>
			<div class="botones">
				<button type="button" onclick={() => (dialog = undefined)}>Cancelar</button>
				<button type="submit" class="principal">Guardar</button>
			</div>
		</form>
	</div>
{:else if dialog?.kind === 'borrar'}
	{@const label = dialog.label}
	<div class="fondo" role="alertdialog" aria-modal="true" aria-labelledby="titulo-borrar" aria-describedby="aclaracion-borrar">
		<div class="caja">
			<p id="titulo-borrar">¿Borrar la etiqueta «{label.name}»?</p>
			<p id="aclaracion-borrar" class="aclaracion">Las tareas no se borran.</p>
			<div class="botones">
				<button type="button" onclick={() => (dialog = undefined)}>Cancelar</button>
				<button type="button" class="principal" onclick={() => deleteLabel(label)}>Borrar</button>
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
