import { onMount } from 'svelte';
import { observeConnection } from '#lib/adapters/connection.ts';

/** Estado reactivo "hay red": llamar durante la inicialización de un componente. */
export function onlineState(): { readonly value: boolean } {
	let value = $state(true);
	onMount(() => observeConnection((current) => (value = current)));
	return {
		get value() {
			return value;
		}
	};
}
