// Spec §6.6: cuándo se va la pantalla de carga y qué recuerda el dispositivo de
// un tope con Noto sin bajar. El core recibe el estado de cada cosa en un instante;
// no usa temporizadores ni lee el dispositivo.

/** Spec §6.6: la pantalla dura al menos esto, aunque esté todo listo enseguida. */
export const SCREEN_MINIMUM_IN_SECONDS = 0.5;

/** Spec §6.6: pasado esto se entra con lo que haya; la espera de Auth no entra en el tope. */
export const SCREEN_LIMIT_IN_SECONDS = 10;

/** La respuesta de Auth: hasta que llega no se sabe si la apertura tiene sesión. */
export type AuthResponse = 'esperando' | 'con-sesion' | 'sin-sesion';

/**
 * Cada fuente (Atkinson o Noto): `lista` para dibujar; `guardada` en el dispositivo y
 * todavía cargando; `sin-guardar`, solo puede venir por red; `fallida` falló o, en
 * Noto, el navegador no puede dibujarla.
 */
export type FontStatus = 'lista' | 'guardada' | 'sin-guardar' | 'fallida';

/** Lo que importa para la pantalla de carga en un instante. */
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

/** Spec §6.6, "No espera lo que no va a llegar": una fuente falla o solo llega por red. */
function fontMayStillArrive(font: FontStatus, online: boolean): boolean {
	return font === 'guardada' || (font === 'sin-guardar' && online);
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
	return status.auth === 'sin-sesion' || openingWithSessionReady(status);
}

/**
 * Spec §6.6: la pantalla se va con Auth respondido y, pasado el mínimo de 0,5 s, cuando
 * está lo que espera esa apertura o al llegar al tope de 10 s.
 */
export function loadingScreenLeaves(status: WaitStatus): boolean {
	if (status.auth === 'esperando') return false;
	if (status.secondsSinceStart < SCREEN_MINIMUM_IN_SECONDS) return false;
	return (
		status.secondsSinceStart >= SCREEN_LIMIT_IN_SECONDS ||
		respondedEverythingExpected(status)
	);
}

function limitWithNotoExpected(status: WaitStatus): boolean {
	return (
		status.secondsSinceStart >= SCREEN_LIMIT_IN_SECONDS &&
		status.auth === 'con-sesion' &&
		fontMayStillArrive(status.noto, status.online)
	);
}

/**
 * Spec §6.6: lo que el dispositivo recuerda de un tope con Noto sin bajar. Se pregunta
 * en el instante en que la pantalla se va y cada vez que Noto queda listo después.
 */
export function notoLimitMemory(status: WaitStatus): boolean {
	if (status.noto === 'lista') return false;
	return status.remembersNotoLimit || limitWithNotoExpected(status);
}

/** Spec §6.6: una versión nueva que cambia el juego lo trata como no guardado y lo espera una vez. */
export function rememberedOnStart(remembered: boolean, gameChangingVersion: boolean): boolean {
	return remembered && !gameChangingVersion;
}

/** Spec §6.6: el próximo instante (mínimo o tope) en que la espera cambia sola, o `undefined` si ya pasaron los dos. */
export function nextScreenLimit(secondsSinceStart: number): number | undefined {
	return [SCREEN_MINIMUM_IN_SECONDS, SCREEN_LIMIT_IN_SECONDS].find(
		(limit) => secondsSinceStart < limit
	);
}

/** El estado del juego entero según el de cada uno de sus archivos: el peor manda. */
export function fontsSummary(statuses: FontStatus[]): FontStatus {
	if (statuses.includes('fallida')) return 'fallida';
	return statuses.includes('sin-guardar') ? 'sin-guardar' : 'guardada';
}
