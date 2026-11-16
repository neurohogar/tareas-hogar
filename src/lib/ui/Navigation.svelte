<script lang="ts">
	import { page } from '$app/state';

	const TABS = [
		{ path: '/', name: 'Pendientes' },
		{ path: '/historial', name: 'Historial' },
		{ path: '/etiquetas', name: 'Etiquetas' },
		{ path: '/anotaciones', name: 'Anotaciones' }
	];
</script>

<nav class="navigation" aria-label="Pantallas">
	{#each TABS as { path, name } (path)}
		<a href={path} aria-current={page.url.pathname === path ? 'page' : undefined}>{name}</a>
	{/each}
</nav>

<style>
	.navigation {
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
		height: var(--navigation-height);
		border-top: 1px solid var(--border);
		background: var(--surface);
	}

	a {
		flex: 1;
		display: grid;
		place-items: center;
		color: var(--text-muted);
		text-decoration: none;
	}

	a[aria-current='page'] {
		color: var(--accent);
		font-weight: 600;
		box-shadow: inset 0 3px 0 var(--accent);
	}
</style>
