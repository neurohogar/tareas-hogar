<script lang="ts">
	import { entrarConGoogle } from '#lib/adapters/auth.ts';
	import { pantallaDeEntrada } from '#lib/core/conexion.ts';
	import { enLineaReactivo } from './en-linea.svelte';

	let error = $state('');
	const enLinea = enLineaReactivo();
	const entrada = $derived(pantallaDeEntrada(enLinea.valor));

	async function entrar() {
		error = '';
		try {
			await entrarConGoogle();
		} catch {
			error = 'No se pudo iniciar sesión. Probá de nuevo.';
		}
	}
</script>

<section class="login">
	<h1>Tareas Hogar</h1>
	<button type="button" onclick={entrar} disabled={!entrada.botonHabilitado}>Entrar con Google</button>
	{#if entrada.mensaje}<p>{entrada.mensaje}</p>{/if}
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
		border: 1px solid var(--borde);
		border-radius: 0.5rem;
		background: var(--superficie);
		color: var(--texto);
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
