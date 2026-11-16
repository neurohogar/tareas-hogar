/**
 * Atrás del navegador mientras el panel está abierto (spec §6.2): el panel toma una entrada del
 * historial al abrir, así Atrás no sale de la pantalla. Cerrar el panel por otro camino
 * (la X, Guardar, una acción) la consume, sin dejar un Atrás de más.
 */
export interface BackLayer {
	/** El panel se cerró: suelta la entrada si Atrás no la consumió. */
	release(): void;
}

const ENTRY = { panelOpened: true };

/**
 * `alTocarAtras` decide qué hace Atrás y dice si el panel sigue abierto: si sigue, se vuelve a tomar
 * la entrada para el próximo Atrás; si se cierra, la entrada ya está consumida.
 */
export function takeBack(onBackTap: () => boolean): BackLayer {
	let consumed = false;
	history.pushState(ENTRY, '');

	const onGoBack = () => {
		if (onBackTap()) history.pushState(ENTRY, '');
		else consumed = true;
	};
	addEventListener('popstate', onGoBack);

	return {
		release() {
			removeEventListener('popstate', onGoBack);
			if (!consumed) history.back();
			consumed = true;
		}
	};
}
