// Spec §4.1 y §5.5: el horario de una tarea, una o más ventanas diarias
// [desde, hasta) en las que se puede completar. Horas locales "HH:MM" de 24 h,
// desde < hasta, ordenadas por desde y sin superponerse.
import { enElMinuto, sumarDias } from './dias';
import type { Horario, Ventana } from './tarea';

/** Lo que escribe el panel en una fila Desde/Hasta: cada hora puede faltar o venir vacía. */
export interface VentanaEscrita {
	desde?: string;
	hasta?: string;
}

/** Las filas Desde/Hasta del panel, en el orden en que se escribieron. */
export type HorarioEscrito = VentanaEscrita[];

/** variasEnHoras: más de una ventana en una relativa en horas (§4.1); lo detecta la relativa. */
export type ErrorDeHorario = 'incompleto' | 'finNoPosterior' | 'superpuestos' | 'variasEnHoras';

export type LecturaDeHorario = { ok: true; horario?: Horario } | { ok: false; error: ErrorDeHorario };

const HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Minutos desde las 00:00, o undefined si no es una hora HH:MM. */
function minutosDe(hora: string | undefined): number | undefined {
	const partes = hora === undefined ? null : HORA.exec(hora);
	return partes ? Number(partes[1]) * 60 + Number(partes[2]) : undefined;
}

const completa = ({ desde, hasta }: VentanaEscrita) => minutosDe(desde) !== undefined && minutosDe(hasta) !== undefined;

/** Un horario guardado siempre es válido. */
const minutos = (hora: string) => minutosDe(hora) as number;

const finPosterior = ({ desde, hasta }: Ventana) => minutos(desde) < minutos(hasta);

/** Ya ordenadas por desde: se superponen si una empieza antes de que termine la anterior. */
const superpuestas = (ordenadas: Horario) => ordenadas.some((ventana, i) => i > 0 && minutos(ventana.desde) < minutos(ordenadas[i - 1].hasta));

/**
 * Spec §4.1: sin ventanas escritas, la tarea no tiene horario. Con una hora
 * que falta (o que no es HH:MM), está incompleto; con desde ≥ hasta, la hora
 * de fin no es posterior a la de inicio; con ventanas que se pisan, se
 * superponen. Si es válido, las ventanas quedan ordenadas por desde.
 */
export function leerHorario(escrito: HorarioEscrito | undefined): LecturaDeHorario {
	if (escrito === undefined || escrito.length === 0) return { ok: true };
	if (!escrito.every(completa)) return { ok: false, error: 'incompleto' };
	const ventanas = (escrito as Horario).map(({ desde, hasta }) => ({ desde, hasta }));
	if (!ventanas.every(finPosterior)) return { ok: false, error: 'finNoPosterior' };
	const ordenadas = ventanas.sort((a, b) => minutos(a.desde) - minutos(b.desde));
	if (superpuestas(ordenadas)) return { ok: false, error: 'superpuestos' };
	return { ok: true, horario: ordenadas };
}

/** Spec §4.1: un documento con una sola ventana (el formato anterior) se lee como una lista de una. */
export function horarioGuardado(guardado: Ventana | Horario): Horario {
	return Array.isArray(guardado) ? guardado : [guardado];
}

/** Una ventana en un día dado (§5.6: una ocurrencia), en ms: [inicio, cierre). */
export interface Ocurrencia {
	inicio: number;
	cierre: number;
}

/** Las ventanas del día, en orden, en ms. */
export function ocurrenciasDelDia(horario: Horario, dia: Date): Ocurrencia[] {
	return horario.map(({ desde, hasta }) => ({
		inicio: enElMinuto(dia, minutos(desde)).getTime(),
		cierre: enElMinuto(dia, minutos(hasta)).getTime()
	}));
}

/** Las ventanas de ayer, hoy y mañana respecto de `momento`, en orden. */
const ventanasAlrededor = (horario: Horario, momento: Date) =>
	[-1, 0, 1].flatMap((dias) => ocurrenciasDelDia(horario, sumarDias(momento, dias)));

/** Spec §5.5: A (el primer instante ≥ desde que cae en una ventana) y C (el hasta de esa ventana), en ms. */
export function ventanaDisponible(horario: Horario, desde: Date): { disponible: number; cierre: number } {
	const momento = desde.getTime();
	const { inicio, cierre } = ventanasAlrededor(horario, desde).find((ventana) => momento < ventana.cierre) as Ocurrencia;
	return { disponible: Math.max(momento, inicio), cierre };
}

export function dentroDelHorario(horario: Horario, ahora: Date): boolean {
	return ventanaDisponible(horario, ahora).disponible === ahora.getTime();
}

/** El hasta de la última ventana del día, en ms. */
export function cierreDelDia(horario: Horario, dia: Date): number {
	return (ocurrenciasDelDia(horario, dia).at(-1) as Ocurrencia).cierre;
}

/** El hasta de la última ventana que cerró hasta ahora (inclusive), en ms. */
export function ultimoCierre(horario: Horario, ahora: Date): number {
	const cerradas = ventanasAlrededor(horario, ahora).filter(({ cierre }) => cierre <= ahora.getTime());
	return (cerradas.at(-1) as Ocurrencia).cierre;
}

/** Spec §6.1: el horario en la fila, "08:00–11:00"; con varias ventanas, separadas por " · ". */
export function textoDelHorario(horario: Horario): string {
	return horario.map(({ desde, hasta }) => `${desde}–${hasta}`).join(' · ');
}
