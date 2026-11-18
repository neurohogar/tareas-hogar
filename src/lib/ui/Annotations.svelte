<script lang="ts">
	import { copyToClipboard } from '#lib/adapters/clipboard.ts';
	import type { Annotation } from '#lib/core/annotation.ts';
	import { annotationsOnScreen } from '#lib/core/annotations.ts';
	import { annotationsText } from '#lib/core/copied-annotations.ts';
	import AnnotateConfirmation from './AnnotateConfirmation.svelte';
	import { useSession } from './session';

	// Spec §6.7: reread the annotations, correct their text, delete them and copy them.
	const session = useSession();
	const groups = $derived(annotationsOnScreen(session.tasks, session.annotations, session.now));

	let editing = $state<{ annotation: Annotation; text: string } | undefined>(undefined);
	let toDelete = $state.raw<Annotation | undefined>(undefined);
	/** The notice of the last copy (a single text at a time); each copy restarts its 5 s count. */
	let notice = $state<{ text: string; count: number } | undefined>(undefined);
	let copies = 0;

	function saveText(event: SubmitEvent) {
		event.preventDefault();
		if (!editing) return;
		session.editAnnotationText(editing.annotation, editing.text);
		editing = undefined;
	}

	function deleteAnnotation(annotation: Annotation) {
		toDelete = undefined;
		session.deleteAnnotation(annotation);
	}

	async function copy() {
		const text = annotationsText(session.tasks, session.annotations);
		if (text === undefined) return;
		const copied = await copyToClipboard(text);
		notice = { text: copied ? 'Anotaciones copiadas' : 'No se pudo copiar', count: ++copies };
	}
</script>

<section>
	<h1>Anotaciones</h1>
	<button type="button" class="copy" onclick={copy}>Copiar</button>
	{#each groups as { header, entries } (header)}
		<h2>{header}</h2>
		<ul class="list">
			{#each entries as { annotation, hour, taskName } (annotation.id)}
				<li class="entry">
					<div class="data">
						<span class="hour">{hour}</span>
						<span class="sense">{annotation.sense}</span>
						<span class="screen">{annotation.screen}</span>
						{#if taskName}<span class="task">{taskName}</span>{/if}
						{#if annotation.text}<span class="text">{annotation.text}</span>{/if}
					</div>
					<div class="entry-actions">
						<button type="button" onclick={() => (editing = { annotation, text: annotation.text ?? '' })}>Editar texto</button>
						<button type="button" class="delete" onclick={() => (toDelete = annotation)}>Borrar</button>
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="empty">Todavía no hay anotaciones</p>
	{/each}
</section>

{#if editing}
	<div class="backdrop">
		<div class="box" role="dialog" aria-modal="true" aria-label="Editar texto">
			<form onsubmit={saveText}>
				<label class="field">
					Texto
					<input type="text" bind:value={editing.text} />
				</label>
				<div class="actions">
					<button type="button" onclick={() => (editing = undefined)}>Cancelar</button>
					<button type="submit" class="primary">Guardar</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if toDelete}
	{@const annotation = toDelete}
	<div class="backdrop" role="alertdialog" aria-modal="true" aria-labelledby="title-delete-annotation">
		<div class="box">
			<p id="title-delete-annotation">¿Borrar la anotación «{annotation.sense}»?</p>
			<div class="actions">
				<button type="button" onclick={() => (toDelete = undefined)}>Cancelar</button>
				<button type="button" class="primary" onclick={() => deleteAnnotation(annotation)}>Borrar</button>
			</div>
		</div>
	</div>
{/if}

{#if notice}
	{#key notice.count}
		<AnnotateConfirmation text={notice.text} onLeave={() => (notice = undefined)} />
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
		color: var(--text-muted);
	}

	.copy,
	.entry-actions button,
	.actions button {
		min-height: 44px;
		padding: 0 0.75rem;
		border: 1px solid var(--border);
		border-radius: 0.4rem;
		background: transparent;
		color: var(--text);
		cursor: pointer;
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.entry {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		min-height: 48px;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--border);
	}

	.data {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 0.75rem;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.hour {
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}

	.screen {
		color: var(--text-muted);
	}

	.entry-actions {
		display: flex;
		flex: none;
		gap: 0.25rem;
	}

	.entry-actions .delete {
		color: var(--error);
	}

	.empty {
		color: var(--text-muted);
	}

	.backdrop {
		position: fixed;
		inset: 0;
		/* Above the navigation bar (z-index 1) and the Anotar button (z-index 3). */
		z-index: 4;
		display: grid;
		place-items: center;
		background: color-mix(in srgb, black 35%, transparent);
	}

	.box {
		width: min(24rem, calc(100% - 2rem));
		box-sizing: border-box;
		padding: 1rem;
		border-radius: 0.75rem;
		background: var(--surface);
	}

	.box p {
		margin: 0;
	}

	.field {
		display: grid;
		gap: 0.35rem;
	}

	input {
		min-height: 44px;
		box-sizing: border-box;
		padding: 0 0.5rem;
		border: 1px solid var(--border);
		border-radius: 0.4rem;
		background: var(--page-background);
		color: var(--text);
		font: inherit;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.actions .primary {
		border-color: var(--accent);
		background: var(--accent);
		color: var(--surface);
	}
</style>
