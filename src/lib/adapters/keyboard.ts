/** What is known about the on-screen keyboard: whether it is open and how much of the bottom edge of the window it covers. */
export interface KeyboardState {
	open: boolean;
	/** Pixels the keyboard covers below the visual viewport (0 if the browser already shrank the window). */
	overlap: number;
}

/** The keyboard shrinks the visual viewport to at least this fraction of its normal height. */
const KEYBOARD_FRACTION = 0.75;
const NON_KEYBOARD_TYPES = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file', 'image', 'date', 'time', 'datetime-local', 'month', 'week']);

/** A field typed into with the on-screen keyboard (not the date and time pickers or the buttons). */
function isTextField(element: Element | null): boolean {
	if (element instanceof HTMLTextAreaElement) return true;
	if (element instanceof HTMLInputElement) return !NON_KEYBOARD_TYPES.has(element.type);
	return element instanceof HTMLElement && element.isContentEditable;
}

/**
 * Reports whether the on-screen keyboard is open and every time it changes. It is inferred from a text field
 * being focused and the visual viewport having shrunk relative to its largest height at the current width.
 * Returns how to stop reporting.
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
