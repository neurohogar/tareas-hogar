<script lang="ts">
	import { page } from '$app/state';

	const PESTANAS = [
		{ ruta: '/', nombre: 'Pendientes' },
		{ ruta: '/historial', nombre: 'Historial' },
		{ ruta: '/etiquetas', nombre: 'Etiquetas' }
	];
</script>

<nav class="navegacion" aria-label="Pantallas">
	{#each PESTANAS as { ruta, nombre } (ruta)}
		<a href={ruta} aria-current={page.url.pathname === ruta ? 'page' : undefined}>{nombre}</a>
	{/each}
</nav>

<style>
	.navegacion {
		position: fixed;
		/* Above the content rows, which are positioned and come later in the DOM. */
		z-index: 1;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		max-width: 40rem;
		margin: 0 auto;
		width: 100%;
		height: var(--alto-navegacion);
		border-top: 1px solid var(--borde);
		background: var(--superficie);
	}

	a {
		flex: 1;
		display: grid;
		place-items: center;
		color: var(--texto-suave);
		text-decoration: none;
	}

	a[aria-current='page'] {
		color: var(--acento);
		font-weight: 600;
		box-shadow: inset 0 3px 0 var(--acento);
	}
</style>
