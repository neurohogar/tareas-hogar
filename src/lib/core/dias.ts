// Días del calendario local (spec §5: hora local del dispositivo). Un día es su
// inicio, a las 00:00 locales. Es el único módulo del core que lee o arma fechas
// según la zona horaria del proceso (check:arch lo exige): el resto compara
// instantes con getTime() o le pregunta a este módulo.
import { DIAS_DE_LA_SEMANA, type DiaSemana } from './tarea';

/**
 * El inicio del día local (anio, mes 0..11, dia), con desborde normalizado como
 * en Date. A diferencia de new Date(a, m, d), no lleva los años 0..99 a 1900..1999.
 */
function dia(anio: number, mes: number, numero: number): Date {
	// El constructor da las 00:00 locales; setFullYear corrige los años 0..99 sin tocar la hora.
	const fecha = new Date(anio, mes, numero);
	fecha.setFullYear(anio, mes, numero);
	return fecha;
}

export function inicioDelDia(momento: Date): Date {
	return dia(momento.getFullYear(), momento.getMonth(), momento.getDate());
}

/** El inicio del día que está `cantidad` días después (o antes, si es negativa). */
export function sumarDias(desde: Date, cantidad: number): Date {
	return dia(desde.getFullYear(), desde.getMonth(), desde.getDate() + cantidad);
}

/**
 * Cuántos días locales van del día de `desde` al de `hasta` (negativo si
 * `hasta` es un día anterior). Redondea: un día con cambio de horario no dura 24 h.
 */
export function diasEntre(desde: Date, hasta: Date): number {
	const MS_POR_DIA = 24 * 60 * 60 * 1000;
	return Math.round((inicioDelDia(hasta).getTime() - inicioDelDia(desde).getTime()) / MS_POR_DIA);
}

/** getDay() cuenta desde el domingo (0); la semana del dominio empieza el lunes. */
export function diaDeLaSemana(dia: Date): DiaSemana {
	return DIAS_DE_LA_SEMANA[(dia.getDay() + 6) % 7];
}

/** El número del día dentro de su mes (1..31). */
export function diaDelMes(dia: Date): number {
	return dia.getDate();
}

/** El mes del día local, de 1 (enero) a 12 (diciembre). */
export function mesDe(dia: Date): number {
	return dia.getMonth() + 1;
}

export function anioDe(dia: Date): number {
	return dia.getFullYear();
}

/** El instante local del día a esa cantidad de minutos desde sus 00:00 (0..1439). */
export function enElMinuto(delDia: Date, minutos: number): Date {
	const fecha = inicioDelDia(delDia);
	fecha.setHours(0, minutos, 0, 0);
	return fecha;
}

/** La hora (0..23) y el minuto locales del momento; los segundos no cuentan. */
export function horaYMinuto(momento: Date): { hora: number; minuto: number } {
	return { hora: momento.getHours(), minuto: momento.getMinutes() };
}

export function ultimoDiaDelMes(delMes: Date): number {
	return dia(delMes.getFullYear(), delMes.getMonth() + 1, 0).getDate();
}

/** Un número de fecha u hora con dos dígitos ("08"). */
export const dosDigitos = (numero: number) => String(numero).padStart(2, '0');

/** El día local como fecha ISO-8601 sin hora (AAAA-MM-DD). */
export function diaIso(dia: Date): string {
	return `${String(dia.getFullYear()).padStart(4, '0')}-${dosDigitos(dia.getMonth() + 1)}-${dosDigitos(dia.getDate())}`;
}

/**
 * Lee una fecha AAAA-MM-DD como el inicio de ese día local, o undefined si no
 * tiene esa forma o no existe en el calendario (2026-02-29, 2026-13-01).
 */
export function leerDiaIso(texto: string): Date | undefined {
	const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
	if (!partes) return undefined;
	const [anio, mes, numero] = partes.slice(1).map(Number);
	const fecha = dia(anio, mes - 1, numero);
	return diaIso(fecha) === texto ? fecha : undefined;
}

/** Como leerDiaIso, para fechas ya guardadas: una inválida es un error. */
export function diaDesdeIso(texto: string): Date {
	const fecha = leerDiaIso(texto);
	if (!fecha) throw new Error(`Fecha inválida: "${texto}"`);
	return fecha;
}
