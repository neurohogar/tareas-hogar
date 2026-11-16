<script lang="ts">
	import { history, type HistoryEntry } from '#lib/core/history.ts';
	import { taskName } from '#lib/core/task-name.ts';
	import { useSession } from './session';

	const session = useSession();
	const groups = $derived(history(session.tasks, session.completions, session.now));

	/** La entrada cuyo Borrar espera confirmación, con el encabezado de su día al tocarlo. */
	let toDelete = $state.raw<{ entry: HistoryEntry; header: string } | undefined>(undefined);

	function deleteCompletion(entry: HistoryEntry) {
		toDelete = undefined;
		session.deleteCompletion(entry.completion);
	}
</script>

<section>
	<h1>Historial</h1>
	{#each groups as { header, entries } (header)}
		<h2>{header}</h2>
		<ul class="list">
			{#each entries as entry (entry.completion.id)}
				<li class="entry">
					<!-- El botón cubre la entrada fuera de Borrar: tocarla abre la edición de la tarea. -->
					<button type="button" class="title" onclick={() => session.openTask(entry.task)}>{taskName(entry.task)}</button>
					<span class="hour">{entry.timeText}</span>
					<button type="button" class="delete" onclick={() => (toDelete = { entry, header })}>Borrar</button>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="empty">Todavía no completaste nada</p>
	{/each}
</section>

{#if toDelete}
	{@const { entry, header } = toDelete}
	<div class="backdrop" role="alertdialog" aria-modal="true" aria-labelledby="title-delete-completion">
		<div class="box">
			<p id="title-delete-completion">¿Borrar «{taskName(entry.task)}» de {header}, {entry.timeText}?</p>
			<div class="actions">
				<button type="button" onclick={() => (toDelete = undefined)}>Cancelar</button>
				<button type="button" class="primary" onclick={() => deleteCompletion(entry)}>Borrar</button>
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
		color: var(--text-muted);
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.entry {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-height: 48px;
		border-bottom: 1px solid var(--border);
	}

	.title {
		flex: 1;
		padding: 0;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.title::after {
		content: '';
		position: absolute;
		inset: 0;
	}

	.hour {
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}

	.delete {
		position: relative;
		min-height: 44px;
		padding: 0 0.75rem;
		border: 0;
		background: transparent;
		color: var(--error);
		cursor: pointer;
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
		width: min(24rem, calc(100% - 2rem));
		box-sizing: border-box;
		padding: 1rem;
		border-radius: 0.75rem;
		background: var(--surface);
	}

	.box p {
		margin: 0;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.actions button {
		min-height: 44px;
		padding: 0 1rem;
		border: 1px solid var(--border);
		border-radius: 0.4rem;
		background: transparent;
		color: var(--text);
		cursor: pointer;
	}

	.actions .primary {
		border-color: var(--accent);
		background: var(--accent);
		color: var(--surface);
	}
</style>
