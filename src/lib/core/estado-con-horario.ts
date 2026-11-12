// Spec §5.5: con horario, las reglas de §5.1–§5.3 valen igual y el horario
// solo corre los momentos en que la tarea pasa a pendiente y a atrasada.
import type { Estado, EstadoEnPendientes } from './estado';
import { cierreDelDia, dentroDelHorario, ultimoCierre, ventanaDisponible } from './horario';
import type { Completado, Horario } from './tarea';

/** Los momentos de §5.2/§5.3 de una periódica, en ms, que el horario corre. */
export interface MomentosDeEspera {
	/** T: cuándo pasaría a pendiente sin horario. */
	pasaAPendiente: number;
	/** El inicio de espera, para el progreso. */
	inicioDeEspera: number;
	/** El atraso sin horario, si llegara antes que el cierre (relativa: V + intervalo). */
	atrasadaSinHorario?: number;
}

/** Spec §5.5, en ms: A (disponible), desde cuándo está atrasada y el inicio de espera de una periódica. */
export interface PlazosConHorario {
	disponible: number;
	atraso: number;
	inicioDeEspera: number;
}

/** Una espera: del inicio hasta que vuelve, en ms. */
interface Espera {
	inicio: number;
	vuelve: number;
}

/** Progreso entre 0 y 1; con ahora en el inicio o antes (relojes desfasados), 0. */
function enEspera({ inicio, vuelve }: Espera, momento: number): EstadoEnPendientes {
	return { tipo: 'en espera', progreso: Math.max(0, (momento - inicio) / (vuelve - inicio)) };
}

/** A y C a partir de T; el atraso es el primero entre C y el atraso sin horario. */
export function plazosDesdeMomentos(horario: Horario, momentos: MomentosDeEspera): PlazosConHorario {
	const { disponible, cierre } = ventanaDisponible(horario, new Date(momentos.pasaAPendiente));
	const atraso = Math.min(cierre, momentos.atrasadaSinHorario ?? Number.POSITIVE_INFINITY);
	return { disponible, atraso, inicioDeEspera: momentos.inicioDeEspera };
}

/** Spec §5.5, periódica: atrasada desde el atraso; antes de A, en espera; si no, pendiente. */
export function estadoPeriodicaConHorario({ disponible, atraso, inicioDeEspera }: PlazosConHorario, ahora: Date): EstadoEnPendientes {
	const momento = ahora.getTime();
	if (momento >= atraso) return { tipo: 'atrasada' };
	if (momento < disponible) return enEspera({ inicio: inicioDeEspera, vuelve: disponible }, momento);
	return { tipo: 'pendiente' };
}

/** Spec §5.5 y §6.1, periódica: atrasada, desde el atraso; pendiente o en espera, A. */
export function instantePeriodicaConHorario({ disponible, atraso }: PlazosConHorario, estado: EstadoEnPendientes): Date {
	return new Date(estado.tipo === 'atrasada' ? atraso : disponible);
}

/** Lo que usa el horario de una puntual. */
export interface PuntualConHorario {
	horario: Horario;
	creadaEn: Date;
	fechaLimite?: Date;
}

/**
 * Spec §5.5, puntual sin atraso: antes de A, espera desde creadaEn; después,
 * dentro de una ventana está pendiente (undefined) y fuera espera desde el
 * hasta anterior hasta el desde de la próxima.
 */
function esperaDePuntual({ horario, creadaEn }: PuntualConHorario, ahora: Date): Espera | undefined {
	const { disponible } = ventanaDisponible(horario, creadaEn);
	if (ahora.getTime() < disponible) return { inicio: creadaEn.getTime(), vuelve: disponible };
	if (dentroDelHorario(horario, ahora)) return undefined;
	return { inicio: ultimoCierre(horario, ahora), vuelve: ventanaDisponible(horario, ahora).disponible };
}

/** Con fecha límite, atrasada desde el hasta de la última ventana de ese día (§5.7). */
const atrasoDePuntual = ({ horario, fechaLimite }: PuntualConHorario) => fechaLimite && cierreDelDia(horario, fechaLimite);

/** Spec §5.5 con §5.1: completada si tiene completados; atrasada desde el atraso; si no, según la ventana. */
export function estadoPuntualConHorario(tarea: PuntualConHorario, completados: readonly Completado[], ahora: Date): Estado {
	if (completados.length > 0) return { tipo: 'completada' };
	const atraso = atrasoDePuntual(tarea);
	if (atraso !== undefined && ahora.getTime() >= atraso) return { tipo: 'atrasada' };
	const espera = esperaDePuntual(tarea, ahora);
	return espera ? enEspera(espera, ahora.getTime()) : { tipo: 'pendiente' };
}

/**
 * Spec §5.5 y §6.1, puntual: atrasada, desde el atraso; en espera, cuando
 * vuelve; pendiente, la clave de §6.1 (su fecha límite, o ninguna).
 */
export function instantePuntualConHorario(tarea: PuntualConHorario, estado: EstadoEnPendientes, ahora: Date): Date | undefined {
	if (estado.tipo === 'atrasada') return new Date(atrasoDePuntual(tarea) as number);
	const espera = estado.tipo === 'en espera' ? esperaDePuntual(tarea, ahora) : undefined;
	return espera ? new Date(espera.vuelve) : tarea.fechaLimite;
}
