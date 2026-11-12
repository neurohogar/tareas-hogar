// Spec §5.3 y §5.6: qué ocurrencias cubren los completados de una periódica de
// calendario (o relativa por ventana). Este módulo es el único que interpreta
// ocurrenciaCubierta.
import { inicioDelDia, sumarDias } from './dias';
import { primeraOcurrenciaPosterior, ultimaOcurrenciaEntre } from './ocurrencias';
import type { Completado, RecurrenciaCalendario } from './tarea';

/** El último instante del día: cualquier ocurrencia de ese día empieza antes o en él. */
const finDelDia = (dia: Date) => sumarDias(dia, 1).getTime() - 1;

/**
 * Hasta dónde cubre un completado: una ocurrencia con hora, su inicio; una
 * fecha sola, el día entero; sin ocurrenciaCubierta (se hizo cuando la tarea
 * era relativa o puntual), el día entero de su completadoEn.
 */
function cubiertoHasta({ ocurrenciaCubierta, completadoEn }: Completado): number {
	if (ocurrenciaCubierta === undefined) return finDelDia(completadoEn);
	if (ocurrenciaCubierta instanceof Date) return finDelDia(ocurrenciaCubierta);
	return ocurrenciaCubierta.inicio.getTime();
}

/**
 * Spec §5.6, P en ms: la mayor ocurrencia cubierta. Los valores sin hora
 * (fecha sola, completado sin ocurrenciaCubierta y, sin completados, el día
 * anterior a creadaEn) cubren el día entero.
 */
export function ultimaCubierta(creadaEn: Date, completados: readonly Completado[]): number {
	if (completados.length === 0) return finDelDia(sumarDias(creadaEn, -1));
	return Math.max(...completados.map(cubiertoHasta));
}

/** Spec §5.3, P sin horario: el día de la última ocurrencia cubierta. */
export function ultimaOcurrenciaCubierta(creadaEn: Date, completados: readonly Completado[]): Date {
	return inicioDelDia(new Date(ultimaCubierta(creadaEn, completados)));
}

/**
 * La ocurrencia que cubre un completado nuevo hecho `ahora`, dado P: la más
 * reciente sin cubrir en (P, hoy] o, si no hay, N (la primera posterior a P).
 */
export function ocurrenciaQueCubre(recurrencia: RecurrenciaCalendario, p: Date, ahora: Date): Date {
	const reciente = ultimaOcurrenciaEntre(recurrencia, p, ahora);
	return reciente === undefined ? primeraOcurrenciaPosterior(recurrencia, p) : reciente;
}
