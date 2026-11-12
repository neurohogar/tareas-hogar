import { onMount } from 'svelte';
import { observarConexion } from '#lib/adapters/conexion.ts';

/** Estado reactivo "hay red": llamar durante la inicialización de un componente. */
export function enLineaReactivo(): { readonly valor: boolean } {
	let valor = $state(true);
	onMount(() => observarConexion((actual) => (valor = actual)));
	return {
		get valor() {
			return valor;
		}
	};
}
