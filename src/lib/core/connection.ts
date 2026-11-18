// Spec §6.5 and §7: what is shown depending on whether there is a network.

/** The text of the notice strip; without a network it is "Sin conexión", with a network there is no strip. */
export function connectionStrip(online: boolean): string | undefined {
	return online ? undefined : 'Sin conexión';
}

export interface EntryScreen {
	/** What explains why one cannot sign in; without it, there is nothing to explain. */
	message: string | undefined;
	buttonEnabled: boolean;
}

/** The entry screen (without a previous session): without a network one cannot sign in. */
export function entryScreen(online: boolean): EntryScreen {
	return {
		message: online ? undefined : 'Necesitás conexión para entrar la primera vez',
		buttonEnabled: online
	};
}
