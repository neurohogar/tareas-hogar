import { crearPeriodica, type DatosComunes, type ErroresDeRecurrencia, type ResultadoDeCreacion } from './creacion';
import { DIAS_DE_LA_SEMANA, DIAS_DEL_MES, type DiaSemana, type RecurrenciaCalendario, type TareaPeriodica } from './tarea';

export interface DatosPeriodicaCalendario extends DatosComunes {
	diasSemana: readonly DiaSemana[];
	diasMes: readonly number[];
}

const esDiaDelMes = (dia: number) => DIAS_DEL_MES.includes(dia);

/** Spec §4.2: semanal o mensual (no las dos), con al menos un día, y días del mes entre 1 y 31. */
function errorDeDias({ diasSemana, diasMes }: DatosPeriodicaCalendario): ErroresDeRecurrencia['dias'] {
	if (diasSemana.length > 0 && diasMes.length > 0) return 'combinados';
	if (diasSemana.length === 0 && diasMes.length === 0) return 'faltan';
	if (!diasMes.every(esDiaDelMes)) return 'diaDelMesInvalido';
	return undefined;
}

/** Los días son un conjunto: se guardan sin repetir y en orden (de la semana, o de menor a mayor). */
function recurrenciaDe({ diasSemana, diasMes }: DatosPeriodicaCalendario): RecurrenciaCalendario {
	if (diasSemana.length > 0)
		return { modo: 'calendario', diasSemana: DIAS_DE_LA_SEMANA.filter((dia) => diasSemana.includes(dia)) };
	return { modo: 'calendario', diasMes: [...new Set(diasMes)].sort((a, b) => a - b) };
}

/** Spec §4.1 y §4.2: crea una periódica de calendario, semanal o mensual. */
export function crearPeriodicaCalendario(
	datos: DatosPeriodicaCalendario,
	id: string,
	ahora: Date
): ResultadoDeCreacion<TareaPeriodica> {
	const dias = errorDeDias(datos);
	const { titulo, emoji, nota, horario, esfuerzo } = datos;
	return crearPeriodica({ titulo, emoji, nota, horario, esfuerzo, id, ahora }, dias ? { dias } : {}, () => recurrenciaDe(datos));
}
