// Días de ocurrencia de una recurrencia de calendario (spec §4.2).
import { diaDeLaSemana, diaDelMes, inicioDelDia, sumarDias, ultimoDiaDelMes } from './dias';
import type { RecurrenciaCalendario } from './tarea';

/** Una recurrencia válida ocurre al menos una vez por mes: nunca hay más de 31 días entre dos ocurrencias. */
const MAXIMO_DE_DIAS_ENTRE_OCURRENCIAS = 31;

/** Un día del mes que no existe en ese mes cae en su último día. */
export function esOcurrencia(recurrencia: RecurrenciaCalendario, dia: Date): boolean {
	if ('diasSemana' in recurrencia) return recurrencia.diasSemana.includes(diaDeLaSemana(dia));
	const ultimo = ultimoDiaDelMes(dia);
	return recurrencia.diasMes.some((elegido) => Math.min(elegido, ultimo) === diaDelMes(dia));
}

/**
 * La primera ocurrencia estrictamente posterior al día de `despuesDe`. Solo
 * lanza si la recurrencia viola §4.2 (por ejemplo, si no tiene días).
 */
export function primeraOcurrenciaPosterior(recurrencia: RecurrenciaCalendario, despuesDe: Date): Date {
	const desde = inicioDelDia(despuesDe);
	for (let pasos = 1; pasos <= MAXIMO_DE_DIAS_ENTRE_OCURRENCIAS; pasos++) {
		const dia = sumarDias(desde, pasos);
		if (esOcurrencia(recurrencia, dia)) return dia;
	}
	throw new Error('La recurrencia no tiene días de ocurrencia');
}

/** La ocurrencia más reciente en (desde, hasta], o undefined si no hay ninguna. */
export function ultimaOcurrenciaEntre(
	recurrencia: RecurrenciaCalendario,
	desde: Date,
	hasta: Date
): Date | undefined {
	for (let dia = inicioDelDia(hasta); dia > desde; dia = sumarDias(dia, -1)) {
		if (esOcurrencia(recurrencia, dia)) return dia;
	}
	return undefined;
}
