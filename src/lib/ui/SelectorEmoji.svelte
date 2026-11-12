<script lang="ts">
	import { onMount } from 'svelte';
	// El catálogo en español viaja con el build (nada se pide a un CDN) y el service worker lo precachea.
	import datosEnEspanol from 'emoji-picker-element-data/es/cldr/data.json?url';

	/** La librería busca desde dos caracteres. */
	const MINIMO_DE_BUSQUEDA = 2;

	let {
		recientes,
		alElegir,
		alCerrar
	}: {
		/** Los últimos emojis elegidos en este dispositivo, del más reciente al más viejo. */
		recientes: string[];
		alElegir: (emoji: string) => void;
		alCerrar: () => void;
	} = $props();

	let panel: HTMLDivElement;
	let contenedor: HTMLDivElement;
	let cargando = $state(true);
	let sinResultados = $state(false);

	/** La librería no avisa cuando una búsqueda no encuentra nada: se deduce de su grilla. */
	function vigilarBusqueda(selector: HTMLElement) {
		const raiz = selector.shadowRoot;
		if (!raiz) return;
		const hayBusqueda = () => (raiz.querySelector<HTMLInputElement>('input.search')?.value.trim().length ?? 0) >= MINIMO_DE_BUSQUEDA;
		const hayResultados = () => raiz.querySelector('.tabpanel button.emoji') !== null;
		new MutationObserver(() => (sinResultados = hayBusqueda() && !hayResultados())).observe(raiz, { subtree: true, childList: true });
	}

	// La librería se carga de forma diferida: solo pesa cuando se abre el selector.
	onMount(async () => {
		const [{ Picker }, { default: i18n }] = await Promise.all([
			import('emoji-picker-element'),
			import('emoji-picker-element/i18n/es')
		]);
		const selector = new Picker({ dataSource: datosEnEspanol, locale: 'es', i18n });
		selector.addEventListener('emoji-click', (evento) => alElegir(evento.detail.unicode ?? ''));
		contenedor.append(selector);
		cargando = false;
		vigilarBusqueda(selector);
		// Focus goes to the dialog, not the search field, so the on-screen keyboard stays down until it is tapped (spec §6).
		panel.focus();
	});

	function alTeclear(evento: KeyboardEvent) {
		if (evento.key !== 'Escape') return;
		evento.stopPropagation();
		alCerrar();
	}
</script>

<svelte:window onkeydown={alTeclear} />

<div class="panel" role="dialog" aria-modal="true" aria-label="Elegir emoji" tabindex="-1" bind:this={panel}>
	<div class="caja">
		<div class="encabezado">
			<h2>Elegir emoji</h2>
			<button type="button" class="cerrar" onclick={alCerrar}>Cerrar</button>
		</div>
		{#if recientes.length > 0}
			<section aria-labelledby="titulo-recientes">
				<h3 id="titulo-recientes">Recientes</h3>
				<ul>
					{#each recientes as emoji (emoji)}
						<li><button type="button" aria-label={emoji} onclick={() => alElegir(emoji)}>{emoji}</button></li>
					{/each}
				</ul>
			</section>
		{/if}
		{#if cargando}
			<p class="cargando">Cargando…</p>
		{/if}
		<div class="catalogo" bind:this={contenedor}></div>
		{#if sinResultados}
			<p class="cargando" role="status">No se encontró ningún emoji.</p>
		{/if}
	</div>
</div>

<style>
	.panel {
		position: fixed;
		inset: 0;
		z-index: 10;
		display: grid;
		place-items: end center;
		background: color-mix(in srgb, black 35%, transparent);
	}

	.panel:focus {
		outline: none;
	}

	.caja {
		display: grid;
		gap: 0.5rem;
		width: min(40rem, 100%);
		max-height: 100dvh;
		overflow-y: auto;
		box-sizing: border-box;
		padding: 1rem;
		border-radius: 0.75rem 0.75rem 0 0;
		background: var(--superficie);
	}

	.encabezado {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	h2 {
		margin: 0;
		font-size: 1.1rem;
	}

	h3 {
		margin: 0 0 0.25rem;
		font-size: 0.9rem;
		color: var(--texto-suave);
	}

	.cerrar {
		min-height: 44px;
		padding: 0 1rem;
		border: 1px solid var(--borde);
		border-radius: 0.4rem;
		background: transparent;
		color: var(--texto);
		cursor: pointer;
	}

	ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li button {
		width: 44px;
		height: 44px;
		border: 1px solid var(--borde);
		border-radius: 0.4rem;
		background: transparent;
		font-size: 1.5rem;
		cursor: pointer;
	}

	.cargando {
		margin: 0;
		color: var(--texto-suave);
	}

	.catalogo :global(emoji-picker) {
		width: 100%;
		height: min(24rem, 55dvh);
		--background: var(--superficie);
		--border-color: var(--borde);
		--indicator-color: var(--acento);
		--input-border-color: var(--borde);
		--input-font-color: var(--texto);
		--input-placeholder-color: var(--texto-suave);
		--category-font-color: var(--texto-suave);
		--outline-color: var(--acento);
		/* Spec §6: el selector dibuja con Noto; el del dispositivo solo si Noto no lo tiene. */
		--emoji-font-family: 'Noto Color Emoji', system-ui, sans-serif;
		font-family: 'Atkinson Hyperlegible Next', 'Noto Color Emoji', system-ui, sans-serif;
	}
</style>
