import { ultimoCompletadoEn } from './completados';
import type { EstadoEnPendientes } from './estado';
import type { MomentosDeEspera } from './estado-con-horario';
import type { Completado, RecurrenciaRelativa } from './tarea';

const MS_POR_HORA = 3_600_000;
const HORAS_POR_UNIDAD = { horas: 1, dias: 24 } as const;

function intervaloEnMs(recurrencia: RecurrenciaRelativa): number {
	return recurrencia.cada * HORAS_POR_UNIDAD[recurrencia.unidad] * MS_POR_HORA;
}

/** Spec §5.2, en ms: U, V = U + intervalo y V + intervalo (desde ahí, atrasada). */
interface Plazos {
	ultimo: number;
	vuelveAPendiente: number;
	atrasadaDesde: number;
}

/** Solo para una relativa con al menos un completado. */
function plazos(recurrencia: RecurrenciaRelativa, completados: readonly Completado[]): Plazos {
	const ultimo = ultimoCompletadoEn(completados);
	const intervalo = intervaloEnMs(recurrencia);
	return { ultimo, vuelveAPendiente: ultimo + intervalo, atrasadaDesde: ultimo + 2 * intervalo };
}

/**
 * Spec §5.2. U = completadoEn más reciente, V = U + intervalo.
 * Nunca completada → pendiente; ahora < V → en espera; V ≤ ahora < V + intervalo
 * → pendiente; ahora ≥ V + intervalo → atrasada.
 */
export function estadoPeriodicaRelativa(
	recurrencia: RecurrenciaRelativa,
	completados: readonly Completado[],
	ahora: Date
): EstadoEnPendientes {
	if (completados.length === 0) return { tipo: 'pendiente' };

	const { ultimo, vuelveAPendiente, atrasadaDesde } = plazos(recurrencia, completados);
	const momento = ahora.getTime();

	if (momento < vuelveAPendiente)
		return { tipo: 'en espera', progreso: Math.max(0, momento - ultimo) / (vuelveAPendiente - ultimo) };
	if (momento < atrasadaDesde) return { tipo: 'pendiente' };
	return { tipo: 'atrasada' };
}

/**
 * Spec §6.1 para una relativa: nunca completada, pendiente desde creadaEn; si
 * no, atrasada desde V + intervalo, y pendiente desde V o en espera hasta V.
 */
export function instanteDeUrgenciaRelativa(
	recurrencia: RecurrenciaRelativa,
	creadaEn: Date,
	completados: readonly Completado[],
	estado: EstadoEnPendientes
): Date {
	if (completados.length === 0) return creadaEn;
	const { vuelveAPendiente, atrasadaDesde } = plazos(recurrencia, completados);
	return new Date(estado.tipo === 'atrasada' ? atrasadaDesde : vuelveAPendiente);
}

/**
 * Spec §5.5 para una relativa: pasaría a pendiente en V (nunca completada,
 * creadaEn), espera desde U (o creadaEn) y, sin horario, se atrasa en V + intervalo.
 */
export function momentosRelativa(
	recurrencia: RecurrenciaRelativa,
	creadaEn: Date,
	completados: readonly Completado[]
): MomentosDeEspera {
	if (completados.length === 0) return { pasaAPendiente: creadaEn.getTime(), inicioDeEspera: creadaEn.getTime() };
	const { ultimo, vuelveAPendiente, atrasadaDesde } = plazos(recurrencia, completados);
	return { pasaAPendiente: vuelveAPendiente, inicioDeEspera: ultimo, atrasadaSinHorario: atrasadaDesde };
}
