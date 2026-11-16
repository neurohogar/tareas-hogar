/** Lo que se sabe del teclado en pantalla: si está abierto y cuánto tapa del borde inferior de la ventana. */
export interface EstadoDelTeclado {
	abierto: boolean;
	/** Píxeles que el teclado tapa debajo del viewport visual (0 si el navegador ya achicó la ventana). */
	solape: number;
}

/** El teclado achica el viewport visual por lo menos a esta fracción de su alto normal. */
const FRACCION_CON_TECLADO = 0.75;
const TIPOS_SIN_TECLADO = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file', 'image', 'date', 'time', 'datetime-local', 'month', 'week']);

/** Un campo donde se escribe con el teclado en pantalla (no los selectores de fecha y hora ni los botones). */
function esCampoDeTexto(elemento: Element | null): boolean {
	if (elemento instanceof HTMLTextAreaElement) return true;
	if (elemento instanceof HTMLInputElement) return !TIPOS_SIN_TECLADO.has(elemento.type);
	return elemento instanceof HTMLElement && elemento.isContentEditable;
}

/**
 * Avisa si el teclado en pantalla está abierto y cada vez que cambia. Se deduce de que hay un campo de texto
 * enfocado y el viewport visual se achicó respecto de su mayor alto con el ancho actual.
 * Devuelve cómo dejar de avisar.
 */
export function observarTeclado(alCambiar: (estado: EstadoDelTeclado) => void): () => void {
	const visual = window.visualViewport;
	let anchoBase = 0;
	let altoBase = 0;
	let ultimo: EstadoDelTeclado | undefined;

	const avisar = () => {
		const ancho = visual?.width ?? window.innerWidth;
		const alto = visual?.height ?? window.innerHeight;
		if (ancho !== anchoBase) {
			anchoBase = ancho;
			altoBase = 0;
		}
		altoBase = Math.max(altoBase, alto, window.innerHeight);
		const achicado = alto < altoBase * FRACCION_CON_TECLADO;
		const abierto = achicado && esCampoDeTexto(document.activeElement);
		const solape = abierto ? Math.max(0, window.innerHeight - alto - (visual?.offsetTop ?? 0)) : 0;
		if (ultimo?.abierto === abierto && ultimo.solape === solape) return;
		ultimo = { abierto, solape };
		alCambiar(ultimo);
	};

	avisar();
	visual?.addEventListener('resize', avisar);
	window.addEventListener('resize', avisar);
	document.addEventListener('focusin', avisar);
	document.addEventListener('focusout', avisar);
	return () => {
		visual?.removeEventListener('resize', avisar);
		window.removeEventListener('resize', avisar);
		document.removeEventListener('focusin', avisar);
		document.removeEventListener('focusout', avisar);
	};
}
