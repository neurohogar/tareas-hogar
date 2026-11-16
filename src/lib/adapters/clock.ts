export function ahora(): Date {
	return new Date();
}

/** Avisa periódicamente la hora actual, para que los estados se recalculen solos. */
export function observarReloj(alCambiar: (ahora: Date) => void, cadaMs = 1000): () => void {
	const intervalo = setInterval(() => alCambiar(new Date()), cadaMs);
	return () => clearInterval(intervalo);
}
