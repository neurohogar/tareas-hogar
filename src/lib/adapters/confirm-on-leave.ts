/**
 * Spec §6.2: reloading or closing the app with unsaved changes shows the browser's confirmation.
 * `hasChanges` is queried at the moment of leaving. Returns how to stop asking for it.
 */
export function confirmOnLeave(hasChanges: () => boolean): () => void {
	const onUnload = (event: BeforeUnloadEvent) => {
		if (!hasChanges()) return;
		event.preventDefault();
		event.returnValue = '';
	};
	addEventListener('beforeunload', onUnload);
	return () => removeEventListener('beforeunload', onUnload);
}
