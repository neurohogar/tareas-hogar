/** Reports whether the browser has a network now and every time it changes. Returns how to stop reporting. */
export function observeConnection(onChange: (online: boolean) => void): () => void {
	const notify = () => onChange(navigator.onLine);
	notify();
	window.addEventListener('online', notify);
	window.addEventListener('offline', notify);
	return () => {
		window.removeEventListener('online', notify);
		window.removeEventListener('offline', notify);
	};
}
