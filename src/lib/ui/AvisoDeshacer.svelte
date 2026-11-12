<script lang="ts">
	let { nombre, alDeshacer }: { nombre: string; alDeshacer: () => void } = $props();
</script>

<div class="aviso" role="status">
	<span>Completaste «{nombre}»</span>
	<button type="button" onclick={alDeshacer}>Deshacer</button>
</div>

<style>
	.aviso {
		position: fixed;
		left: 1rem;
		right: calc(56px + 2.5rem);
		bottom: var(--base-aviso, calc(var(--alto-navegacion) + 1.25rem));
		z-index: 20;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		max-width: 28rem;
		padding: 0.5rem 0.5rem 0.5rem 1rem;
		border-radius: 8px;
		background: var(--texto);
		color: var(--fondo);
	}

	button {
		min-height: 44px;
		padding: 0 0.75rem;
		border: 0;
		background: transparent;
		color: inherit;
		font-weight: 600;
		cursor: pointer;
	}
</style>
