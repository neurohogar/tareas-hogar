/** Ids generados en el cliente (spec §4.4: únicos por dispositivo). */
export function nuevoId(): string {
	return crypto.randomUUID();
}
