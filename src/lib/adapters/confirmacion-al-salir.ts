/**
 * Spec §6.2: recargar o cerrar la app con cambios sin guardar muestra la confirmación del navegador.
 * `hayCambios` se consulta en el momento de salir. Devuelve cómo dejar de pedirla.
 */
export function confirmarAlSalir(hayCambios: () => boolean): () => void {
	const alSalir = (evento: BeforeUnloadEvent) => {
		if (!hayCambios()) return;
		evento.preventDefault();
		evento.returnValue = '';
	};
	addEventListener('beforeunload', alSalir);
	return () => removeEventListener('beforeunload', alSalir);
}
