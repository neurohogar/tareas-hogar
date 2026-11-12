/** Copia texto al portapapeles del navegador; funciona sin conexión. */
export async function copiarAlPortapapeles(texto: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(texto);
		return true;
	} catch {
		return false;
	}
}
