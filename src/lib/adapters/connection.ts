/** Avisa si el navegador tiene red ahora y cada vez que cambia. Devuelve cómo dejar de avisar. */
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
