// Spec §6.6: cuándo se va la pantalla de carga y qué recuerda el dispositivo de
// un tope con Noto sin bajar. El core recibe el estado de cada cosa en un instante;
// no usa temporizadores ni lee el dispositivo.

/** Spec §6.6: la pantalla dura al menos esto, aunque esté todo listo enseguida. */
export const MINIMO_DE_LA_PANTALLA_EN_SEGUNDOS = 0.5;

/** Spec §6.6: pasado esto se entra con lo que haya; la espera de Auth no entra en el tope. */
export const TOPE_DE_LA_PANTALLA_EN_SEGUNDOS = 10;

/** La respuesta de Auth: hasta que llega no se sabe si la apertura tiene sesión. */
export type RespuestaDeAuth = 'esperando' | 'con-sesion' | 'sin-sesion';

/**
 * Cada fuente (Atkinson o Noto): `lista` para dibujar; `guardada` en el dispositivo y
 * todavía cargando; `sin-guardar`, solo puede venir por red; `fallida` falló o, en
 * Noto, el navegador no puede dibujarla.
 */
export type EstadoDeFuente = 'lista' | 'guardada' | 'sin-guardar' | 'fallida';

/** Lo que importa para la pantalla de carga en un instante. */
export interface EstadoDeLaEspera {
	segundosDesdeElArranque: number;
	auth: RespuestaDeAuth;
	tareasRespondieron: boolean;
	completadosRespondieron: boolean;
	etiquetasRespondieron: boolean;
	atkinson: EstadoDeFuente;
	noto: EstadoDeFuente;
	enLinea: boolean;
	recuerdaTopeDeNoto: boolean;
}

/** Spec §6.6, "No espera lo que no va a llegar": una fuente falla o solo llega por red. */
function fuenteTodaviaPuedeLlegar(fuente: EstadoDeFuente, enLinea: boolean): boolean {
	return fuente === 'guardada' || (fuente === 'sin-guardar' && enLinea);
}

function datosRespondieron(estado: EstadoDeLaEspera): boolean {
	return (
		estado.tareasRespondieron && estado.completadosRespondieron && estado.etiquetasRespondieron
	);
}

function aperturaConSesionLista(estado: EstadoDeLaEspera): boolean {
	return (
		datosRespondieron(estado) &&
		(estado.recuerdaTopeDeNoto || !fuenteTodaviaPuedeLlegar(estado.noto, estado.enLinea))
	);
}

function respondioTodoLoQueEspera(estado: EstadoDeLaEspera): boolean {
	if (fuenteTodaviaPuedeLlegar(estado.atkinson, estado.enLinea)) return false;
	return estado.auth === 'sin-sesion' || aperturaConSesionLista(estado);
}

/**
 * Spec §6.6: la pantalla se va con Auth respondido y, pasado el mínimo de 0,5 s, cuando
 * está lo que espera esa apertura o al llegar al tope de 10 s.
 */
export function pantallaDeCargaSeVa(estado: EstadoDeLaEspera): boolean {
	if (estado.auth === 'esperando') return false;
	if (estado.segundosDesdeElArranque < MINIMO_DE_LA_PANTALLA_EN_SEGUNDOS) return false;
	return (
		estado.segundosDesdeElArranque >= TOPE_DE_LA_PANTALLA_EN_SEGUNDOS ||
		respondioTodoLoQueEspera(estado)
	);
}

function topeConNotoEsperado(estado: EstadoDeLaEspera): boolean {
	return (
		estado.segundosDesdeElArranque >= TOPE_DE_LA_PANTALLA_EN_SEGUNDOS &&
		estado.auth === 'con-sesion' &&
		fuenteTodaviaPuedeLlegar(estado.noto, estado.enLinea)
	);
}

/**
 * Spec §6.6: lo que el dispositivo recuerda de un tope con Noto sin bajar. Se pregunta
 * en el instante en que la pantalla se va y cada vez que Noto queda listo después.
 */
export function recuerdoDeTopeDeNoto(estado: EstadoDeLaEspera): boolean {
	if (estado.noto === 'lista') return false;
	return estado.recuerdaTopeDeNoto || topeConNotoEsperado(estado);
}

/** Spec §6.6: una versión nueva que cambia el juego lo trata como no guardado y lo espera una vez. */
export function recuerdoAlArrancar(recordaba: boolean, versionCambioElJuego: boolean): boolean {
	return recordaba && !versionCambioElJuego;
}

/** Spec §6.6: el próximo instante (mínimo o tope) en que la espera cambia sola, o `undefined` si ya pasaron los dos. */
export function proximoLimiteDeLaPantalla(segundosDesdeElArranque: number): number | undefined {
	return [MINIMO_DE_LA_PANTALLA_EN_SEGUNDOS, TOPE_DE_LA_PANTALLA_EN_SEGUNDOS].find(
		(limite) => segundosDesdeElArranque < limite
	);
}

/** El estado del juego entero según el de cada uno de sus archivos: el peor manda. */
export function resumenDeFuentes(estados: EstadoDeFuente[]): EstadoDeFuente {
	if (estados.includes('fallida')) return 'fallida';
	return estados.includes('sin-guardar') ? 'sin-guardar' : 'guardada';
}
