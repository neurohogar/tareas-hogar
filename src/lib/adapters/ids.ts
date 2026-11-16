/** Ids generados en el cliente (spec §4.4: únicos por dispositivo). */
export function newId(): string {
	return crypto.randomUUID();
}
