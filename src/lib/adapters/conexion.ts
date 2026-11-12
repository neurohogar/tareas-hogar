/** Avisa si el navegador tiene red ahora y cada vez que cambia. Devuelve cómo dejar de avisar. */
export function observarConexion(alCambiar: (enLinea: boolean) => void): () => void {
	const avisar = () => alCambiar(navigator.onLine);
	avisar();
	window.addEventListener('online', avisar);
	window.addEventListener('offline', avisar);
	return () => {
		window.removeEventListener('online', avisar);
		window.removeEventListener('offline', avisar);
	};
}
