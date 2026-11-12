// Spec §6.3: cómo se nombran los días y las horas del Historial. Tablas
// propias en español: no depende del locale del sistema.
import { anioDe, diaDeLaSemana, diaDelMes, diaIso, dosDigitos, horaYMinuto, inicioDelDia, mesDe, sumarDias } from './dias';

const MESES = [
	'enero',
	'febrero',
	'marzo',
	'abril',
	'mayo',
	'junio',
	'julio',
	'agosto',
	'septiembre',
	'octubre',
	'noviembre',
	'diciembre'
] as const;

const mismoDia = (a: Date, b: Date) => inicioDelDia(a).getTime() === inicioDelDia(b).getTime();

/**
 * "Hoy", "Ayer" o "martes 14 de julio" (con " de 2025" si el año no es el de
 * ahora). Un día posterior a hoy lleva la fecha, nunca "Mañana".
 */
export function encabezadoDelDia(dia: Date, ahora: Date): string {
	if (mismoDia(dia, ahora)) return 'Hoy';
	if (mismoDia(dia, sumarDias(ahora, -1))) return 'Ayer';
	const fecha = `${diaDeLaSemana(dia)} ${diaDelMes(dia)} de ${MESES[mesDe(dia) - 1]}`;
	return anioDe(dia) === anioDe(ahora) ? fecha : `${fecha} de ${anioDe(dia)}`;
}

/** La hora local del momento en 24 h, "HH:MM". */
export function horaEnTexto(momento: Date): string {
	const { hora, minuto } = horaYMinuto(momento);
	return `${dosDigitos(hora)}:${dosDigitos(minuto)}`;
}

/** Spec §6.7 (Copiar): la fecha y la hora locales, "AAAA-MM-DD HH:MM". */
export function fechaYHoraEnTexto(momento: Date): string {
	return `${diaIso(momento)} ${horaEnTexto(momento)}`;
}
