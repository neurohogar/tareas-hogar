import { onMount } from 'svelte';
import { observeConnection } from '#lib/adapters/connection.ts';

/** Reactive "there is a network" state: call during component initialization. */
export function onlineState(): { readonly value: boolean } {
	let value = $state(true);
	onMount(() => observeConnection((current) => (value = current)));
	return {
		get value() {
			return value;
		}
	};
}
