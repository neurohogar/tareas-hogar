/**
 * Browser Back while the panel is open (spec §6.2): the panel takes a history entry on
 * opening, so Back does not leave the screen. Closing the panel another way
 * (the X, Guardar, an action) consumes it, leaving no extra Back behind.
 */
export interface BackLayer {
	/** The panel closed: releases the entry if Back did not consume it. */
	release(): void;
}

const ENTRY = { panelOpened: true };

/**
 * `onBackTap` decides what Back does and says whether the panel is still open: if it is, the entry
 * is taken again for the next Back; if it closes, the entry is already consumed.
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
