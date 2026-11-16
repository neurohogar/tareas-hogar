// Spec §6.5 y §7: qué se ve según haya o no red.

/** El texto de la franja de aviso; sin red es "Sin conexión", con red no hay franja. */
export function connectionStrip(online: boolean): string | undefined {
	return online ? undefined : 'Sin conexión';
}

export interface EntryScreen {
	/** Lo que explica por qué no se puede entrar; sin él, no hay nada que explicar. */
	message: string | undefined;
	buttonEnabled: boolean;
}

/** La pantalla de entrada (sin sesión previa): sin red no se puede entrar. */
export function entryScreen(online: boolean): EntryScreen {
	return {
		message: online ? undefined : 'Necesitás conexión para entrar la primera vez',
		buttonEnabled: online
	};
}
