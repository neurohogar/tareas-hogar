/**
 * Atrás del navegador mientras el panel está abierto (spec §6.2): el panel toma una entrada del
 * historial al abrir, así Atrás no sale de la pantalla. Cerrar el panel por otro camino
 * (la X, Guardar, una acción) la consume, sin dejar un Atrás de más.
 */
export interface CapaDeAtras {
	/** El panel se cerró: suelta la entrada si Atrás no la consumió. */
	soltar(): void;
}

const ENTRADA = { panelAbierto: true };

/**
 * `alTocarAtras` decide qué hace Atrás y dice si el panel sigue abierto: si sigue, se vuelve a tomar
 * la entrada para el próximo Atrás; si se cierra, la entrada ya está consumida.
 */
export function tomarAtras(alTocarAtras: () => boolean): CapaDeAtras {
	let consumida = false;
	history.pushState(ENTRADA, '');

	const alRetroceder = () => {
		if (alTocarAtras()) history.pushState(ENTRADA, '');
		else consumida = true;
	};
	addEventListener('popstate', alRetroceder);

	return {
		soltar() {
			removeEventListener('popstate', alRetroceder);
			if (!consumida) history.back();
			consumida = true;
		}
	};
}
