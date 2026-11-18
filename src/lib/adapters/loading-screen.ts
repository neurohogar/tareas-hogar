// Spec §6.6: what the loading screen needs from the browser. It is drawn in src/app.html,
// before JavaScript runs. What is remembered lives only on the device (§7).
import { rememberedOnStart } from '#lib/core/loading-screen.ts';
import { notoFingerprint } from './fonts';

const KEY = 'tareas-hogar:tope-de-noto';

/** The seconds since the app started, marked in src/app.html. */
export function secondsSinceStart(): number {
	const { appStartTime = 0 } = window as unknown as { appStartTime?: number };
	return (performance.now() - appStartTime) / 1000;
}

export function removeLoadingScreen(): void {
	document.getElementById('loading-screen')?.remove();
}

/** What is remembered applies to the font set version at which the cap was reached. Without storage, nothing is remembered. */
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
		// Without storage, the next launch waits for Noto again.
	}
}
