<script lang="ts">
	import { copyToClipboard } from '#lib/adapters/clipboard.ts';
	import type { Annotation } from '#lib/core/annotation.ts';
	import { annotationsOnScreen } from '#lib/core/annotations.ts';
	import { annotationsText } from '#lib/core/copied-annotations.ts';
	import AnnotateConfirmation from './AnnotateConfirmation.svelte';
	import { useSession } from './session';

	// Spec §6.7: releer las anotaciones, corregir su texto, borrarlas y copiarlas.
	const session = useSession();
	const groups = $derived(annotationsOnScreen(session.tasks, session.annotations, session.now));

	let editing = $state<{ annotation: Annotation; text: string } | undefined>(undefined);
	let toDelete = $state.raw<Annotation | undefined>(undefined);
	/** El aviso de la última copia (un solo texto a la vez); cada copia reinicia su cuenta de 5 s. */
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
	<button type="button" class="copiar" onclick={copy}>Copiar</button>
	{#each groups as { header, entries } (header)}
		<h2>{header}</h2>
		<ul class="lista">
			{#each entries as { annotation, hour, taskName } (annotation.id)}
				<li class="entrada">
					<div class="datos">
						<span class="hora">{hour}</span>
						<span class="sentido">{annotation.sense}</span>
						<span class="pantalla">{annotation.screen}</span>
						{#if taskName}<span class="tarea">{taskName}</span>{/if}
						{#if annotation.text}<span class="texto">{annotation.text}</span>{/if}
					</div>
					<div class="acciones-entrada">
						<button type="button" onclick={() => (editing = { annotation, text: annotation.text ?? '' })}>Editar texto</button>
						<button type="button" class="borrar" onclick={() => (toDelete = annotation)}>Borrar</button>
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="vacio">Todavía no hay anotaciones</p>
	{/each}
</section>

{#if editing}
	<div class="fondo">
		<div class="caja" role="dialog" aria-modal="true" aria-label="Editar texto">
			<form onsubmit={saveText}>
				<label class="campo">
					Texto
					<input type="text" bind:value={editing.text} />
				</label>
				<div class="acciones">
					<button type="button" onclick={() => (editing = undefined)}>Cancelar</button>
					<button type="submit" class="principal">Guardar</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if toDelete}
	{@const annotation = toDelete}
	<div class="fondo" role="alertdialog" aria-modal="true" aria-labelledby="titulo-borrar-anotacion">
		<div class="caja">
			<p id="titulo-borrar-anotacion">¿Borrar la anotación «{annotation.sense}»?</p>
			<div class="acciones">
				<button type="button" onclick={() => (toDelete = undefined)}>Cancelar</button>
				<button type="button" class="principal" onclick={() => deleteAnnotation(annotation)}>Borrar</button>
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
