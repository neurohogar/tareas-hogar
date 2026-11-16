<script lang="ts">
	import { signInWithGoogle } from '#lib/adapters/auth.ts';
	import { entryScreen } from '#lib/core/connection.ts';
	import { onlineState } from './online.svelte';

	let error = $state('');
	const online = onlineState();
	const entry = $derived(entryScreen(online.value));

	async function signIn() {
		error = '';
		try {
			await signInWithGoogle();
		} catch {
			error = 'No se pudo iniciar sesión. Probá de nuevo.';
		}
	}
</script>

<section class="login">
	<h1>Tareas Hogar</h1>
	<button type="button" onclick={signIn} disabled={!entry.buttonEnabled}>Entrar con Google</button>
	{#if entry.message}<p>{entry.message}</p>{/if}
	{#if error}<p role="alert">{error}</p>{/if}
</section>

<style>
	.login {
		display: grid;
		justify-items: center;
		gap: 1.5rem;
		padding-top: 20vh;
	}

	button {
		min-height: 48px;
		padding: 0 1.5rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background: var(--surface);
		color: var(--text);
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
