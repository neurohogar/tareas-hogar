// Spec §5.6 y §5.7: con horario, una ocurrencia es un par (día, ventana),
// identificado por su inicio. P, N y la ocurrencia que cubre un completado se
// calculan sobre ocurrencias en lugar de días.
import { inicioDelDia, sumarDias } from './dias';
import { ocurrenciasDelDia, type Ocurrencia } from './horario';
import { ultimaCubierta } from './ocurrencia-cubierta';
import { esOcurrencia, primeraOcurrenciaPosterior } from './ocurrencias';
import type { Completado, Horario, RecurrenciaCalendario, RecurrenciaRelativa } from './tarea';

/** La primera ocurrencia que cumple, recorriendo los días desde `dia` con `siguiente`. */
function primera(horario: Horario, dia: Date, siguiente: (dia: Date) => Date, cumple: (ocurrencia: Ocurrencia) => boolean): Ocurrencia {
	for (; ; dia = siguiente(dia)) {
		const encontrada = ocurrenciasDelDia(horario, dia).find(cumple);
		if (encontrada) return encontrada;
	}
}

/** El primer día de ocurrencia de la recurrencia desde el día de `desde` inclusive. */
function primerDiaDeOcurrencia(recurrencia: RecurrenciaCalendario, desde: Date): Date {
	const dia = inicioDelDia(desde);
	return esOcurrencia(recurrencia, dia) ? dia : primeraOcurrenciaPosterior(recurrencia, dia);
}

/**
 * La ocurrencia que cubre un completado nuevo hecho `ahora`, dada N: antes de
 * su cierre, N; si no, la ocurrencia con el inicio más reciente ≤ ahora entre
 * los días que cuentan (desde el de N).
 */
function queCubre(horario: Horario, n: Ocurrencia, cuenta: (dia: Date) => boolean, ahora: Date): Date {
	const momento = ahora.getTime();
	if (momento < n.cierre) return new Date(n.inicio);
	for (let dia = inicioDelDia(ahora); ; dia = sumarDias(dia, -1)) {
		const empezadas = cuenta(dia) ? ocurrenciasDelDia(horario, dia).filter(({ inicio }) => inicio <= momento) : [];
		const reciente = empezadas.at(-1);
		if (reciente) return new Date(reciente.inicio);
	}
}

/**
 * Spec §5.6: N, la primera ocurrencia con inicio posterior a P. Spec §5.8: de
 * una reanudada, una ocurrencia cuya ventana cerró hasta reanudadaEn no cuenta.
 */
export function proximaOcurrenciaCalendario(
	recurrencia: RecurrenciaCalendario,
	horario: Horario,
	creadaEn: Date,
	completados: readonly Completado[],
	reanudadaEn?: Date
): Ocurrencia {
	const p = ultimaCubierta(creadaEn, completados);
	const cerradas = reanudadaEn?.getTime() ?? Number.NEGATIVE_INFINITY;
	const siguiente = (dia: Date) => primeraOcurrenciaPosterior(recurrencia, dia);
	return primera(horario, primerDiaDeOcurrencia(recurrencia, new Date(p)), siguiente, ({ inicio, cierre }) => inicio > p && cierre > cerradas);
}

/**
 * Spec §5.6: el inicio de la ocurrencia que cubre un completado nuevo: la más
 * reciente sin cubrir con inicio en (P, ahora] o, si no hay, N.
 */
export function ocurrenciaQueCubreCalendario(
	recurrencia: RecurrenciaCalendario,
	horario: Horario,
	creadaEn: Date,
	completados: readonly Completado[],
	ahora: Date,
	reanudadaEn?: Date
): Date {
	const n = proximaOcurrenciaCalendario(recurrencia, horario, creadaEn, completados, reanudadaEn);
	return queCubre(horario, n, (dia) => esOcurrencia(recurrencia, dia), ahora);
}

/** Spec §5.7: una relativa con más de una ventana (y el intervalo en días) se completa una vez por ventana. */
export function seCompletaPorVentana(recurrencia: RecurrenciaRelativa, horario: Horario): boolean {
	return recurrencia.unidad === 'dias' && horario.length > 1;
}

/**
 * Spec §5.7, N de una relativa por ventana: nunca completada, la primera
 * ventana cuyo hasta es posterior a creadaEn; con P, la primera ventana
 * posterior a P del día de P o de uno cada `cada` días desde ahí.
 */
export function proximaOcurrenciaPorVentana(
	recurrencia: RecurrenciaRelativa,
	horario: Horario,
	creadaEn: Date,
	completados: readonly Completado[]
): Ocurrencia {
	if (completados.length === 0) return primera(horario, inicioDelDia(creadaEn), (dia) => sumarDias(dia, 1), ({ cierre }) => cierre > creadaEn.getTime());
	const p = ultimaCubierta(creadaEn, completados);
	return primera(horario, inicioDelDia(new Date(p)), (dia) => sumarDias(dia, recurrencia.cada), ({ inicio }) => inicio > p);
}

/**
 * Spec §5.7: el inicio de la ocurrencia que cubre un completado nuevo de una
 * relativa por ventana: N, o, si está atrasada, la ventana con el inicio más
 * reciente ≤ ahora, de cualquier día.
 */
export function ocurrenciaQueCubrePorVentana(
	recurrencia: RecurrenciaRelativa,
	horario: Horario,
	creadaEn: Date,
	completados: readonly Completado[],
	ahora: Date
): Date {
	const n = proximaOcurrenciaPorVentana(recurrencia, horario, creadaEn, completados);
	return queCubre(horario, n, () => true, ahora);
}
