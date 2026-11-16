/** Lo que se sabe del teclado en pantalla: si está abierto y cuánto tapa del borde inferior de la ventana. */
export interface KeyboardState {
	open: boolean;
	/** Píxeles que el teclado tapa debajo del viewport visual (0 si el navegador ya achicó la ventana). */
	overlap: number;
}

/** El teclado achica el viewport visual por lo menos a esta fracción de su alto normal. */
const KEYBOARD_FRACTION = 0.75;
const NON_KEYBOARD_TYPES = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file', 'image', 'date', 'time', 'datetime-local', 'month', 'week']);

/** Un campo donde se escribe con el teclado en pantalla (no los selectores de fecha y hora ni los botones). */
function isTextField(element: Element | null): boolean {
	if (element instanceof HTMLTextAreaElement) return true;
	if (element instanceof HTMLInputElement) return !NON_KEYBOARD_TYPES.has(element.type);
	return element instanceof HTMLElement && element.isContentEditable;
}

/**
 * Avisa si el teclado en pantalla está abierto y cada vez que cambia. Se deduce de que hay un campo de texto
 * enfocado y el viewport visual se achicó respecto de su mayor alto con el ancho actual.
 * Devuelve cómo dejar de avisar.
 */
export function observeKeyboard(onChange: (status: KeyboardState) => void): () => void {
	const visual = window.visualViewport;
	let baseWidth = 0;
	let baseHeight = 0;
	let last: KeyboardState | undefined;

	const notify = () => {
		const width = visual?.width ?? window.innerWidth;
		const height = visual?.height ?? window.innerHeight;
		if (width !== baseWidth) {
			baseWidth = width;
			baseHeight = 0;
		}
		baseHeight = Math.max(baseHeight, height, window.innerHeight);
		const shrunk = height < baseHeight * KEYBOARD_FRACTION;
		const open = shrunk && isTextField(document.activeElement);
		const overlap = open ? Math.max(0, window.innerHeight - height - (visual?.offsetTop ?? 0)) : 0;
		if (last?.open === open && last.overlap === overlap) return;
		last = { open, overlap };
		onChange(last);
	};

	notify();
	visual?.addEventListener('resize', notify);
	window.addEventListener('resize', notify);
	document.addEventListener('focusin', notify);
	document.addEventListener('focusout', notify);
	return () => {
		visual?.removeEventListener('resize', notify);
		window.removeEventListener('resize', notify);
		document.removeEventListener('focusin', notify);
		document.removeEventListener('focusout', notify);
	};
}
