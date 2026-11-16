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
		<p class="empty">Todavía no hay etiquetas</p>
	{:else}
		<ul class="list">
			{#each labels as label (label.id)}
				<LabelChip {label}>
					{#snippet actions()}
						<span class="actions">
							<button type="button" onclick={() => (dialog = { kind: 'renombrar', label, name: label.name })}>Renombrar</button>
							<button type="button" onclick={() => (dialog = { kind: 'color', label, color: label.color })}>Cambiar color</button>
							<button type="button" class="danger" onclick={() => (dialog = { kind: 'borrar', label })}>Borrar</button>
						</span>
					{/snippet}
				</LabelChip>
			{/each}
		</ul>
	{/if}
</section>

{#if dialog?.kind === 'renombrar'}
	<div class="backdrop" role="dialog" aria-modal="true" aria-labelledby="title-rename">
		<form class="box" novalidate onsubmit={saveName}>
			<h2 id="title-rename">Renombrar etiqueta</h2>
			<label for="field-name">Nombre</label>
			<input
				id="field-name"
				autocomplete="off"
				bind:value={dialog.name}
				aria-invalid={dialog.error ? 'true' : undefined}
				aria-describedby={dialog.error ? 'error-name' : undefined}
			/>
			{#if dialog.error}
				<p id="error-name" class="error">{dialog.error}</p>
			{/if}
			<div class="buttons">
				<button type="button" onclick={() => (dialog = undefined)}>Cancelar</button>
				<button type="submit" class="primary">Guardar</button>
			</div>
		</form>
	</div>
{:else if dialog?.kind === 'color'}
	<div class="backdrop" role="dialog" aria-modal="true" aria-labelledby="title-color">
		<form class="box" onsubmit={saveColor}>
			<h2 id="title-color">Color de «{dialog.label.name}»</h2>
			<div class="colors" role="radiogroup" aria-label="Color">
				{#each PALETTE as color (color)}
					<label class="color" style:--color-chip={`var(--label-${color})`}>
						<input type="radio" name="color" value={color} bind:group={dialog.color} />
						{color}
					</label>
				{/each}
			</div>
			<div class="buttons">
				<button type="button" onclick={() => (dialog = undefined)}>Cancelar</button>
				<button type="submit" class="primary">Guardar</button>
			</div>
		</form>
	</div>
{:else if dialog?.kind === 'borrar'}
	{@const label = dialog.label}
	<div class="backdrop" role="alertdialog" aria-modal="true" aria-labelledby="title-delete" aria-describedby="delete-clarification">
		<div class="box">
			<p id="title-delete">¿Borrar la etiqueta «{label.name}»?</p>
			<p id="delete-clarification" class="clarification">Las tareas no se borran.</p>
			<div class="buttons">
				<button type="button" onclick={() => (dialog = undefined)}>Cancelar</button>
				<button type="button" class="primary" onclick={() => deleteLabel(label)}>Borrar</button>
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

	.list {
		display: grid;
		gap: 0;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.list :global(.item) {
		justify-content: space-between;
		flex-wrap: wrap;
		min-height: 48px;
		border-bottom: 1px solid var(--border);
	}

	.actions {
		display: flex;
		gap: 0.25rem;
	}

	.actions button {
		min-height: 44px;
		padding: 0 0.6rem;
		border: 0;
		background: transparent;
		color: var(--accent);
		cursor: pointer;
	}

	.actions .danger {
		color: var(--error);
	}

	.empty {
		color: var(--text-muted);
	}

	.backdrop {
		position: fixed;
		inset: 0;
		/* Above the navigation bar (z-index 1), whatever the DOM order. */
		z-index: 2;
		display: grid;
		place-items: center;
		background: color-mix(in srgb, black 35%, transparent);
	}

	.box {
		display: grid;
		gap: 0.5rem;
		width: min(24rem, calc(100% - 2rem));
		box-sizing: border-box;
		padding: 1rem;
		border-radius: 0.75rem;
		background: var(--surface);
	}

	.box p {
		margin: 0;
	}

	.clarification {
		color: var(--text-muted);
	}

	input:not([type='radio']) {
		min-height: 44px;
		font: inherit;
		padding: 0 0.5rem;
		border: 1px solid var(--border);
		border-radius: 0.4rem;
		background: var(--page-background);
		color: var(--text);
	}

	.colors {
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

	.buttons {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.buttons button {
		min-height: 44px;
		padding: 0 1rem;
		border: 1px solid var(--border);
		border-radius: 0.4rem;
		background: transparent;
		color: var(--text);
		cursor: pointer;
	}

	.buttons .primary {
		border-color: var(--accent);
		background: var(--accent);
		color: var(--surface);
	}
</style>
