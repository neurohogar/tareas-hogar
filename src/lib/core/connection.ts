// Spec §6.5 y §7: qué se ve según haya o no red.

/** El texto de la franja de aviso; sin red es "Sin conexión", con red no hay franja. */
export function franjaDeConexion(enLinea: boolean): string | undefined {
	return enLinea ? undefined : 'Sin conexión';
}

export interface PantallaDeEntrada {
	/** Lo que explica por qué no se puede entrar; sin él, no hay nada que explicar. */
	mensaje: string | undefined;
	botonHabilitado: boolean;
}

/** La pantalla de entrada (sin sesión previa): sin red no se puede entrar. */
export function pantallaDeEntrada(enLinea: boolean): PantallaDeEntrada {
	return {
		mensaje: enLinea ? undefined : 'Necesitás conexión para entrar la primera vez',
		botonHabilitado: enLinea
	};
}
