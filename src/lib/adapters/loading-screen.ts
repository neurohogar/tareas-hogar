// Spec §6.6: lo que la pantalla de carga necesita del navegador. Se dibuja en src/app.html,
// antes de que corra el JavaScript. Lo recordado vive solo en el dispositivo (§7).
import { rememberedOnStart } from '#lib/core/loading-screen.ts';
import { notoFingerprint } from './fonts';

const KEY = 'tareas-hogar:tope-de-noto';

/** Los segundos desde que la app arrancó, marcados en src/app.html. */
export function secondsSinceStart(): number {
	const { appStartTime = 0 } = window as unknown as { appStartTime?: number };
	return (performance.now() - appStartTime) / 1000;
}

export function removeLoadingScreen(): void {
	document.getElementById('loading-screen')?.remove();
}

/** Lo recordado vale para la versión del juego con que se alcanzó el tope. Sin almacenamiento, no se recuerda nada. */
export function readNotoLimitMemory(): boolean {
	try {
		const fingerprint = localStorage.getItem(KEY);
		return rememberedOnStart(fingerprint !== null, fingerprint !== notoFingerprint());
	} catch {
		return false;
	}
}

export function saveNotoLimitMemory(remembers: boolean): void {
	try {
		if (remembers) localStorage.setItem(KEY, notoFingerprint());
		else localStorage.removeItem(KEY);
	} catch {
		// Sin almacenamiento, la próxima apertura vuelve a esperar a Noto.
	}
}
