// Spec §7 (Limpiezas y reintentos): las dos limpiezas se intentan elemento por elemento y se reintentan.

/** Qué quedó limpio y qué quedó por reintentar tras un intento; solo ids, nada para mostrar. */
export interface AttemptResult {
	cleaned: string[];
	pendings: string[];
}

/** Lo que puede pasar mientras la app está abierta; solo los dos primeros reintentan. */
export type AppEvent = 'vuelve la conexión' | 'cambian los datos' | 'pasa el tiempo';

/** §7: cada elemento se intenta por separado; quedan por limpiar solo los que fallaron. */
export function attemptResult(attempted: readonly string[], failed: readonly string[]): AttemptResult {
	const failure = new Set(failed);
	return {
		cleaned: attempted.filter((id) => !failure.has(id)),
		pendings: attempted.filter((id) => failure.has(id))
	};
}

/** §7: se intenta todo elemento por limpiar que no tenga ya un intento en curso (un intento terminado, aunque fallara, deja de contar). */
export function itemsToAttempt(toClean: readonly string[], inProgress: ReadonlySet<string>): string[] {
	return toClean.filter((id) => !inProgress.has(id));
}

/** §7: se reintenta al volver la conexión y cuando cambian los datos, sin temporizadores. */
export function retriesWith(occurrenceEvent: AppEvent): boolean {
	return occurrenceEvent !== 'pasa el tiempo';
}
