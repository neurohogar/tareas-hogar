<script lang="ts">
	import { onMount } from 'svelte';
	import '$lib/ui/estilos.css';
	import { observarUsuario, type Usuario } from '$lib/adapters/auth';
	import type { RespuestaDeAuth } from '$lib/core/pantalla-de-carga';
	import Login from '$lib/ui/Login.svelte';
	import PantallaDeCarga, { type DatosRespondieron } from '$lib/ui/PantallaDeCarga.svelte';
	import Sesion from '$lib/ui/Sesion.svelte';

	let { children } = $props();

	/** undefined mientras Auth todavía no respondió. */
	let usuario = $state<Usuario | null | undefined>(undefined);
	const auth = $derived<RespuestaDeAuth>(usuario === undefined ? 'esperando' : usuario ? 'con-sesion' : 'sin-sesion');
	let datos = $state.raw<DatosRespondieron>({ tareas: false, completados: false, etiquetas: false });
	/** Spec §6.6: una sola vez por arranque; entrar con Google no la vuelve a mostrar. */
	let cargando = $state(true);

	onMount(() => observarUsuario((actual) => (usuario = actual)));
</script>

<PantallaDeCarga {auth} {datos} alIrse={() => (cargando = false)} />

<!-- Lo que se monta detrás de la pantalla de carga no se ve ni se puede tocar hasta que se va. -->
<main style:visibility={cargando ? 'hidden' : undefined}>
	{#if usuario === null}
		<Login />
	{:else if usuario}
		<!-- La sesión vive en el layout: los datos y el aviso siguen al cambiar de pantalla. -->
		{#key usuario.uid}
			<Sesion uid={usuario.uid} alResponderDatos={(respondieron) => (datos = respondieron)}>{@render children()}</Sesion>
		{/key}
	{/if}
</main>
