// Spec §6.6: when the loading screen leaves and what the device remembers of
// a limit reached with Noto not downloaded. The core receives the status of each thing at an instant;
// it uses no timers and does not read the device.

/** Spec §6.6: the screen lasts at least this long, even if everything is ready right away. */
export const SCREEN_MINIMUM_IN_SECONDS = 0.5;

/** Spec §6.6: after this, one enters with what there is; the wait for Auth does not count toward the limit. */
export const SCREEN_LIMIT_IN_SECONDS = 10;

/** The Auth response: until it arrives it is not known whether the opening has a session. */
export type AuthResponse = 'waiting' | 'signedIn' | 'signedOut';

/**
 * Each font (Atkinson or Noto): `lista` to draw; `guardada` on the device and
 * still loading; `sin-guardar`, it can only come over the network; `fallida` failed or, for
 * Noto, the browser cannot draw it.
 */
export type FontStatus = 'ready' | 'saved' | 'unsaved' | 'failed';

/** What matters for the loading screen at an instant. */
export interface WaitStatus {
	secondsSinceStart: number;
	auth: AuthResponse;
	tasksResponded: boolean;
	completionsResponded: boolean;
	atkinson: FontStatus;
	noto: FontStatus;
	online: boolean;
	remembersNotoLimit: boolean;
}

/** Spec §6.6, "No espera lo que no va a llegar": a font fails or only arrives over the network. */
function fontMayStillArrive(font: FontStatus, online: boolean): boolean {
	return font === 'saved' || (font === 'unsaved' && online);
}

function dataResponded(status: WaitStatus): boolean {
	return status.tasksResponded && status.completionsResponded;
}

function openingWithSessionReady(status: WaitStatus): boolean {
	return (
		dataResponded(status) &&
		(status.remembersNotoLimit || !fontMayStillArrive(status.noto, status.online))
	);
}

function respondedEverythingExpected(status: WaitStatus): boolean {
	if (fontMayStillArrive(status.atkinson, status.online)) return false;
	return status.auth === 'signedOut' || openingWithSessionReady(status);
}

/**
 * Spec §6.6: the screen leaves with Auth answered and, after the minimum of 0.5 s, when
 * what that opening waits for is ready or on reaching the limit of 10 s.
 */
export function loadingScreenLeaves(status: WaitStatus): boolean {
	if (status.auth === 'waiting') return false;
	if (status.secondsSinceStart < SCREEN_MINIMUM_IN_SECONDS) return false;
	return (
		status.secondsSinceStart >= SCREEN_LIMIT_IN_SECONDS ||
		respondedEverythingExpected(status)
	);
}

function limitWithNotoExpected(status: WaitStatus): boolean {
	return (
		status.secondsSinceStart >= SCREEN_LIMIT_IN_SECONDS &&
		status.auth === 'signedIn' &&
		fontMayStillArrive(status.noto, status.online)
	);
}

/**
 * Spec §6.6: what the device remembers of a limit reached with Noto not downloaded. It is asked
 * at the instant the screen leaves and every time Noto becomes ready afterwards.
 */
export function notoLimitMemory(status: WaitStatus): boolean {
	if (status.noto === 'ready') return false;
	return status.remembersNotoLimit || limitWithNotoExpected(status);
}

/** Spec §6.6: a new version that changes the font set treats it as not stored and waits for it once. */
export function rememberedOnStart(remembered: boolean, gameChangingVersion: boolean): boolean {
	return remembered && !gameChangingVersion;
}

/** Spec §6.6: the next instant (minimum or limit) at which the wait changes by itself, or `undefined` if both have passed. */
export function nextScreenLimit(secondsSinceStart: number): number | undefined {
	return [SCREEN_MINIMUM_IN_SECONDS, SCREEN_LIMIT_IN_SECONDS].find(
		(limit) => secondsSinceStart < limit
	);
}

/** The status of the whole font set according to that of each of its files: the worst one rules. */
export function fontsSummary(statuses: FontStatus[]): FontStatus {
	if (statuses.includes('failed')) return 'failed';
	return statuses.includes('unsaved') ? 'unsaved' : 'saved';
}
