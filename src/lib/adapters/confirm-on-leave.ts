/**
 * Spec §6.2: recargar o cerrar la app con cambios sin guardar muestra la confirmación del navegador.
 * `hayCambios` se consulta en el momento de salir. Devuelve cómo dejar de pedirla.
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
