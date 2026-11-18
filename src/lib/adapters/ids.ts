/** Ids generated on the client (spec §4.4: unique per device). */
export function newId(): string {
	return crypto.randomUUID();
}
