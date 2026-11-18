<script lang="ts">
	import { onMount } from 'svelte';
	// The Spanish catalog ships with the build (nothing is requested from a CDN) and the service worker precaches it.
	import spanishData from 'emoji-picker-element-data/es/cldr/data.json?url';

	/** The library searches from two characters. */
	const MIN_SEARCH_LENGTH = 2;

	let {
		recents,
		onChoose,
		onClose
	}: {
		/** The last emojis chosen on this device, most recent first. */
		recents: string[];
		onChoose: (emoji: string) => void;
		onClose: () => void;
	} = $props();

	let panel: HTMLDivElement;
	let container: HTMLDivElement;
	let loading = $state(true);
	let noResults = $state(false);

	/** The library does not report when a search finds nothing: it is deduced from its grid. */
	function watchSearch(pickerElement: HTMLElement) {
		const root = pickerElement.shadowRoot;
		if (!root) return;
		const hasSearch = () => (root.querySelector<HTMLInputElement>('input.search')?.value.trim().length ?? 0) >= MIN_SEARCH_LENGTH;
		const hasResults = () => root.querySelector('.tabpanel button.emoji') !== null;
		new MutationObserver(() => (noResults = hasSearch() && !hasResults())).observe(root, { subtree: true, childList: true });
	}

	// The library is loaded lazily: it only weighs when the picker is opened.
	onMount(async () => {
		const [{ Picker }, { default: i18n }] = await Promise.all([
			import('emoji-picker-element'),
			import('emoji-picker-element/i18n/es')
		]);
		const pickerElement = new Picker({ dataSource: spanishData, locale: 'es', i18n });
		pickerElement.addEventListener('emoji-click', (event) => onChoose(event.detail.unicode ?? ''));
		container.append(pickerElement);
		loading = false;
		watchSearch(pickerElement);
		// Focus goes to the dialog, not the search field, so the on-screen keyboard stays down until it is tapped (spec §6).
		panel.focus();
	});

	function onType(event: KeyboardEvent) {
		if (event.key !== 'Escape') return;
		event.stopPropagation();
		onClose();
	}
</script>

<svelte:window onkeydown={onType} />

<div class="panel" role="dialog" aria-modal="true" aria-label="Elegir emoji" tabindex="-1" bind:this={panel}>
	<div class="box">
		<div class="header">
			<h2>Elegir emoji</h2>
			<button type="button" class="close" onclick={onClose}>Cerrar</button>
		</div>
		{#if recents.length > 0}
			<section aria-labelledby="title-recents">
				<h3 id="title-recents">Recientes</h3>
				<ul>
					{#each recents as emoji (emoji)}
						<li><button type="button" aria-label={emoji} onclick={() => onChoose(emoji)}>{emoji}</button></li>
					{/each}
				</ul>
			</section>
		{/if}
		{#if loading}
			<p class="loading">Cargando…</p>
		{/if}
		<div class="catalog" bind:this={container}></div>
		{#if noResults}
			<p class="loading" role="status">No se encontró ningún emoji.</p>
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

	.box {
		display: grid;
		gap: 0.5rem;
		width: min(40rem, 100%);
		max-height: 100dvh;
		overflow-y: auto;
		box-sizing: border-box;
		padding: 1rem;
		border-radius: 0.75rem 0.75rem 0 0;
		background: var(--surface);
	}

	.header {
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
		color: var(--text-muted);
	}

	.close {
		min-height: 44px;
		padding: 0 1rem;
		border: 1px solid var(--border);
		border-radius: 0.4rem;
		background: transparent;
		color: var(--text);
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
		border: 1px solid var(--border);
		border-radius: 0.4rem;
		background: transparent;
		font-size: 1.5rem;
		cursor: pointer;
	}

	.loading {
		margin: 0;
		color: var(--text-muted);
	}

	.catalog :global(emoji-picker) {
		width: 100%;
		height: min(24rem, 55dvh);
		--background: var(--surface);
		--border-color: var(--border);
		--indicator-color: var(--accent);
		--input-border-color: var(--border);
		--input-font-color: var(--text);
		--input-placeholder-color: var(--text-muted);
		--category-font-color: var(--text-muted);
		--outline-color: var(--accent);
		/* Spec §6: the picker draws with Noto; the device's only if Noto does not have it. */
		--emoji-font-family: 'Noto Color Emoji', system-ui, sans-serif;
		font-family: 'Atkinson Hyperlegible Next', 'Noto Color Emoji', system-ui, sans-serif;
	}
</style>
