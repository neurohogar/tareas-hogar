// Modelo de dominio (spec §4). Solo lo que usa la rebanada actual.

export type Unidad = 'horas' | 'dias';

/** Spec §4.1: rápida (≤ 5 min), media (≈ 15 min) o larga. */
export type Esfuerzo = 'rapida' | 'media' | 'larga';

export interface RecurrenciaRelativa {
	modo: 'relativo';
	cada: number;
	unidad: Unidad;
}

/** De lunes a domingo, en el orden de la semana. */
export const DIAS_DE_LA_SEMANA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'] as const;

export type DiaSemana = (typeof DIAS_DE_LA_SEMANA)[number];

/** Spec §4.2: al menos un día de la semana, sin repetir, en el orden de la semana. */
export interface RecurrenciaSemanal {
	modo: 'calendario';
	diasSemana: DiaSemana[];
}

/** Los días del mes que se pueden elegir (spec §4.2), de menor a mayor. */
export const DIAS_DEL_MES: readonly number[] = Array.from({ length: 31 }, (_, indice) => indice + 1);

/** Spec §4.2: al menos un día del mes (1..31), sin repetir, de menor a mayor. */
export interface RecurrenciaMensual {
	modo: 'calendario';
	diasMes: number[];
}

export type RecurrenciaCalendario = RecurrenciaSemanal | RecurrenciaMensual;

export type Recurrencia = RecurrenciaRelativa | RecurrenciaCalendario;

/** Spec §4.1: una ventana diaria [desde, hasta) en la que se puede completar; horas locales "HH:MM", desde < hasta. */
export interface Ventana {
	desde: string;
	hasta: string;
}

/** Spec §4.1: una o más ventanas, ordenadas por desde y sin superponerse. */
export type Horario = Ventana[];

/** Spec §4.1 y §5.9: un solo campo; sin él, la tarea no está pospuesta. */
export interface Posposicion {
	desde: Date;
	hasta: Date;
}

export interface TareaPeriodica {
	id: string;
	titulo: string;
	/** Spec §4.1: un solo emoji; sin el campo, la tarea no tiene emoji. */
	emoji?: string;
	/** Spec §4.1: texto libre, ya recortado; sin el campo, la tarea no tiene nota. */
	nota?: string;
	/** Spec §4.1: sin el campo, sin estimar. */
	esfuerzo?: Esfuerzo;
	/** Spec §4.1: ids de etiqueta, sin repetir; sin el campo, ninguna. */
	etiquetas?: string[];
	tipo: 'periodica';
	recurrencia: Recurrencia;
	/** Spec §4.1 y §5.5: sin el campo, se puede completar a cualquier hora. */
	horario?: Horario;
	creadaEn: Date;
	/** Spec §4.1 y §5.8: sin el campo (o en false), no está pausada. */
	pausada?: boolean;
	/** Spec §4.1 y §5.8: la última vez que se reanudó; desde ahí se evalúa como recién creada. */
	reanudadaEn?: Date;
	pospuesta?: Posposicion;
}

/** Spec §4.1: se hace una sola vez; la fecha límite es un día, a las 00:00 locales. */
export interface TareaPuntual {
	id: string;
	titulo: string;
	/** Spec §4.1: un solo emoji; sin el campo, la tarea no tiene emoji. */
	emoji?: string;
	/** Spec §4.1: texto libre, ya recortado; sin el campo, la tarea no tiene nota. */
	nota?: string;
	/** Spec §4.1: sin el campo, sin estimar. */
	esfuerzo?: Esfuerzo;
	/** Spec §4.1: ids de etiqueta, sin repetir; sin el campo, ninguna. */
	etiquetas?: string[];
	tipo: 'puntual';
	fechaLimite?: Date;
	/** Spec §4.1 y §5.5: sin el campo, se puede completar a cualquier hora. */
	horario?: Horario;
	creadaEn: Date;
	pospuesta?: Posposicion;
}

export type Tarea = TareaPeriodica | TareaPuntual;

/** Spec §4.4: una ocurrencia con horario, identificada por su inicio (el día a la hora desde de su ventana). */
export interface InicioDeOcurrencia {
	inicio: Date;
}

/**
 * Spec §4.4: una fecha (a las 00:00 locales; sin horario, o de antes de los
 * varios horarios) o el inicio de una ocurrencia con horario. Son formatos
 * distintos: una ventana que empieza a las 00:00 no se confunde con una fecha.
 */
export type OcurrenciaCubierta = Date | InicioDeOcurrencia;

export interface Completado {
	id: string;
	tareaId: string;
	completadoEn: Date;
	/** En modo calendario (§5.3, §5.6) y en relativas con varias ventanas (§5.7). */
	ocurrenciaCubierta?: OcurrenciaCubierta;
}

/** Spec §4.1: los ids de etiqueta de la tarea; sin el campo, ninguna. */
export const idsDeEtiquetas = ({ etiquetas = [] }: Tarea): readonly string[] => etiquetas;

export const tieneEtiqueta = (tarea: Tarea, etiquetaId: string): boolean => idsDeEtiquetas(tarea).includes(etiquetaId);
