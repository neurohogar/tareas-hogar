import { camposDeEsfuerzo } from './effort';
import { leerEmoji, type LecturaDeEmoji } from './emoji';
import type { ErrorDeNombre } from './label';
import { leerHorario, type ErrorDeHorario, type HorarioEscrito, type LecturaDeHorario } from './schedule';
import { camposDeTexto } from './text-fields';
import { recortarTexto } from './free-text';
import { normalizarPasos } from './steps';
import type { Esfuerzo, Recurrencia, Tarea, TareaPeriodica } from './task';

/** Un motivo de rechazo por regla de validación (spec §4.1 y §4.2). */
export interface ErroresDeCreacion {
	titulo?: 'vacio';
	emoji?: 'invalido';
	cada?: 'invalido';
	dias?: 'faltan' | 'diaDelMesInvalido' | 'combinados';
	fechaLimite?: 'invalida';
	horario?: ErrorDeHorario;
	/** Un nombre de etiqueta escrito en el panel (§4.3). */
	etiquetas?: ErrorDeNombre;
}

/**
 * Los motivos de rechazo propios del tipo de tarea, además del título. El del
 * horario es el que solo depende del tipo (§4.1: varias ventanas en una
 * relativa en horas); uno del horario mismo tiene prioridad.
 */
type ErroresDelTipo = Omit<ErroresDeCreacion, 'titulo' | 'emoji' | 'etiquetas'>;
export type ErroresDeRecurrencia = Omit<ErroresDelTipo, 'fechaLimite'>;

const camposDeEmoji = (lectura: LecturaDeEmoji) => (lectura.ok && lectura.emoji !== undefined ? { emoji: lectura.emoji } : {});

const camposDeHorario = (lectura: LecturaDeHorario) => (lectura.ok && lectura.horario ? { horario: lectura.horario } : {});

/** Spec §4.1: la nota y la versión mínima se recortan; vacías o solo espacios son sin el campo. */
const camposDeTextoLibre = (nota: string, versionMinima: string) => camposDeTexto({ nota: recortarTexto(nota), versionMinima: recortarTexto(versionMinima) });

/** Lo que distingue a un tipo de tarea, sin lo común (id, título, creadaEn). */
type DatosDelTipo<T extends Tarea> = Omit<T, 'id' | 'titulo' | 'emoji' | 'nota' | 'primerPaso' | 'pasos' | 'versionMinima' | 'esfuerzo' | 'horario' | 'creadaEn' | 'etiquetas'>;

export type ResultadoDeCreacion<T extends Tarea = Tarea> =
	| { ok: true; tarea: T }
	| { ok: false; errores: ErroresDeCreacion };

/** Lo que escribe el panel en los campos comunes a todo tipo de tarea. */
export interface DatosComunes {
	titulo: string;
	/** Tal como se escribió: leerEmoji lo valida (§4.1). */
	emoji?: string;
	/** Tal como se escribió: recortarTexto lo recorta (§4.1). */
	nota?: string;
	/** Tal como se escribió: normalizarPasos lo recorta junto con los pasos más (§4.1). */
	primerPaso?: string;
	/** Los pasos 2 en adelante, tal como se escribieron, vacíos incluidos (§4.1, Pasos). */
	pasos?: readonly string[];
	/** Tal como se escribió: recortarTexto lo recorta (§4.1, Versión mínima). */
	versionMinima?: string;
	/** Tal como se escribió; sin él, la tarea no tiene horario. leerHorario lo valida (§4.1). */
	horario?: HorarioEscrito;
	/** Sin él, la tarea queda sin estimar (§4.1). */
	esfuerzo?: Esfuerzo;
}

interface Alta extends DatosComunes {
	id: string;
	ahora: Date;
}

/**
 * Spec §4.1: el título se guarda sin los espacios de los extremos y no puede
 * quedar vacío; el emoji y el horario, si los hay, tienen que ser válidos.
 * Junta esos errores con los del tipo; si no hay ninguno, crea la
 * tarea con lo que arma `datosDelTipo`.
 */
export function crearTarea<T extends Tarea>(
	{ titulo, emoji = '', nota = '', primerPaso, pasos, versionMinima = '', horario, esfuerzo, id, ahora }: Alta,
	erroresDelTipo: ErroresDelTipo,
	datosDelTipo: () => DatosDelTipo<T>
): ResultadoDeCreacion<T> {
	const guardado = titulo.trim();
	const lectura = leerEmoji(emoji);
	const horarioLeido = leerHorario(horario);
	const errores: ErroresDeCreacion = {
		...(guardado === '' && { titulo: 'vacio' as const }),
		...(!lectura.ok && { emoji: 'invalido' as const }),
		...erroresDelTipo,
		...(!horarioLeido.ok && { horario: horarioLeido.error })
	};
	if (Object.keys(errores).length > 0) return { ok: false, errores };
	const campos = { ...camposDeEmoji(lectura), ...camposDeTextoLibre(nota, versionMinima), ...normalizarPasos(primerPaso, pasos), ...camposDeHorario(horarioLeido), ...camposDeEsfuerzo(esfuerzo) };
	// TypeScript no reconstruye T a partir de Omit<T, …> y las claves omitidas.
	return { ok: true, tarea: { id, titulo: guardado, ...campos, ...datosDelTipo(), creadaEn: ahora } as T };
}

export function crearPeriodica(
	alta: Alta,
	erroresDeRecurrencia: ErroresDeRecurrencia,
	recurrencia: () => Recurrencia
): ResultadoDeCreacion<TareaPeriodica> {
	return crearTarea<TareaPeriodica>(alta, erroresDeRecurrencia, () => ({ tipo: 'periodica', recurrencia: recurrencia() }));
}
