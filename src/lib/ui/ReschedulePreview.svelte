<script lang="ts">
	import { onMount } from 'svelte';
	import { tasksToReschedule, rescheduleEnabled } from '#lib/core/block-reschedule.ts';
	import { useSession } from './session';

	// Spec §6.1: the preview of «Reprogramar vencidas». It follows the data and the clock; the core says which tasks go in.
	let { onClose }: { onClose: () => void } = $props();

	const session = useSession();
	const rows = $derived(tasksToReschedule(session.tasks, session.completions, session.now, session.minimalMode));
	const enabled = $derived(rescheduleEnabled(session.tasks, session.completions, session.now, session.minimalMode));

	let box: HTMLDivElement;
	onMount(() => box.querySelector('button')?.focus());

	function confirm() {
		session.reschedule();
		onClose();
	}
</script>

<svelte:window onkeydown={(event) => event.key === 'Escape' && onClose()} />

<div class="panel">
	<div class="box" role="dialog" aria-modal="true" aria-labelledby="reschedule-title" bind:this={box}>
		<h2 id="reschedule-title">Reprogramar vencidas</h2>
		<p>Vuelven como recién creadas, desde ahora.</p>
		<ul>
			{#each rows as task (task.id)}
				<li>{task.emoji ? `${task.emoji} ` : ''}{task.title}</li>
			{/each}
		</ul>
		<div class="actions">
			<button type="button" onclick={onClose}>Cancelar</button>
			<button type="button" class="primary" disabled={!enabled} onclick={confirm}>Reprogramar</button>
		</div>
	</div>
</div>

<style>
	.panel {
		position: fixed;
		inset: 0;
		top: var(--strip-height, 0px);
		z-index: 10;
		display: grid;
		place-items: center;
		background: color-mix(in srgb, black 35%, transparent);
	}

	.box {
		width: min(24rem, calc(100% - 2rem));
		max-height: calc(100% - 2rem);
		overflow-y: auto;
		box-sizing: border-box;
		padding: 1rem;
		border-radius: 0.75rem;
		background: var(--surface);
	}

	h2 {
		margin: 0 0 0.5rem;
		font-size: 1.2rem;
	}

	p {
		margin: 0;
		color: var(--text-muted);
	}

	ul {
		margin: 0.75rem 0 0;
		padding: 0;
		list-style: none;
	}

	li {
		padding: 0.5rem 0;
		overflow-wrap: anywhere;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		padding: 0 1rem;
		border: 1px solid var(--border);
		border-radius: 0.4rem;
		background: transparent;
		color: var(--text);
		cursor: pointer;
	}

	button.primary {
		border-color: var(--accent);
		background: var(--accent);
		color: var(--surface);
	}

	button:disabled {
		opacity: 0.5;
		cursor: default;
	}
</style>
