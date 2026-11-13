// Spec §7 (Limpiezas y reintentos): las cuatro limpiezas se intentan elemento por elemento y se reintentan.

/** Qué quedó limpio y qué quedó por reintentar tras un intento; solo ids, nada para mostrar. */
export interface ResultadoDelIntento {
	limpios: string[];
	pendientes: string[];
}

/** Lo que puede pasar mientras la app está abierta; solo los dos primeros reintentan. */
export type Suceso = 'vuelve la conexión' | 'cambian los datos' | 'pasa el tiempo';

/** §7: cada elemento se intenta por separado; quedan por limpiar solo los que fallaron. */
export function resultadoDelIntento(intentados: readonly string[], fallaron: readonly string[]): ResultadoDelIntento {
	const fallo = new Set(fallaron);
	return {
		limpios: intentados.filter((id) => !fallo.has(id)),
		pendientes: intentados.filter((id) => fallo.has(id))
	};
}

/** §7: se intenta todo elemento por limpiar que no tenga ya un intento en curso (un intento terminado, aunque fallara, deja de contar). */
export function elementosAIntentar(porLimpiar: readonly string[], enCurso: ReadonlySet<string>): string[] {
	return porLimpiar.filter((id) => !enCurso.has(id));
}

/** §7: se reintenta al volver la conexión y cuando cambian los datos, sin temporizadores. */
export function reintentaCon(suceso: Suceso): boolean {
	return suceso !== 'pasa el tiempo';
}
