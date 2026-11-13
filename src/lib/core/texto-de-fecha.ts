// Spec §6.1 (Fecha y distancia): la frase «Tocaba …» o «Vuelve …» que nombra un
// instante respecto de ahora, con la fecha exacta y la distancia relativa.
import { anioDe, diaDeLaSemana, diaDelMes, diasEntre, inicioDelDia, mesDe } from './dias';
import { horaEnTexto, nombreDelMes } from './fechas-en-texto';

/** «Tocaba» en una atrasada; «Vuelve» en una en espera. */
export type VerboDeFecha = 'Tocaba' | 'Vuelve';

const MS_POR_MINUTO = 60_000;
const MINUTOS_POR_HORA = 60;

/** Los días locales que se nombran con una palabra, por su distancia a hoy. */
const PALABRA_DEL_DIA = new Map([
	[-1, 'ayer'],
	[0, 'hoy'],
	[1, 'mañana']
]);

/**
 * Spec §6.1: «<verbo> <fecha>[ · <distancia>]». «el» va solo delante de la fecha
 * con día de la semana; con «hoy», «ayer» o «mañana» no, y sin hora esas
 * palabras ya son la distancia. Ej.: «Tocaba el martes 10 · hace 3 días»,
 * «Vuelve hoy 18:00 · en 8 horas», «Vuelve mañana».
 */
export function fraseDeFecha(verbo: VerboDeFecha, instante: Date, ahora: Date): string {
	const dias = diasEntre(ahora, instante);
	const conHora = instante.getTime() !== inicioDelDia(instante).getTime();
	const hora = conHora ? ` ${horaEnTexto(instante)}` : '';
	const palabra = PALABRA_DEL_DIA.get(dias);
	if (palabra === undefined) return `${verbo} el ${diaConNumero(instante, ahora)}${hora} · ${distanciaEnDias(dias)}`;
	return conHora ? `${verbo} ${palabra}${hora} · ${distanciaEnHorasOMinutos(instante, ahora)}` : `${verbo} ${palabra}`;
}

/** «martes 10», con « de <mes>» si el mes no es el de ahora y « de <año>» si el año no es el de ahora. */
function diaConNumero(dia: Date, ahora: Date): string {
	const delMes = `${diaDeLaSemana(dia)} ${diaDelMes(dia)}`;
	if (anioDe(dia) !== anioDe(ahora)) return `${delMes} de ${nombreDelMes(dia)} de ${anioDe(dia)}`;
	return mesDe(dia) === mesDe(ahora) ? delMes : `${delMes} de ${nombreDelMes(dia)}`;
}

/** A 2 o más días locales: «hace N días» / «en N días». */
const distanciaEnDias = (dias: number) => (dias < 0 ? `hace ${-dias} días` : `en ${dias} días`);

const contar = (cantidad: number, singular: string, plural: string) => `${cantidad} ${cantidad === 1 ? singular : plural}`;

/**
 * Desde ahora, aunque cruce la medianoche: en horas o, a menos de una hora, en
 * minutos. Lo pasado se redondea hacia abajo y lo futuro hacia arriba.
 */
function distanciaEnHorasOMinutos(instante: Date, ahora: Date): string {
	const ms = instante.getTime() - ahora.getTime();
	const futuro = ms > 0;
	const redondear = futuro ? Math.ceil : Math.floor;
	const minutos = redondear(Math.abs(ms) / MS_POR_MINUTO);
	const cantidad =
		minutos < MINUTOS_POR_HORA ? contar(minutos, 'minuto', 'minutos') : contar(redondear(minutos / MINUTOS_POR_HORA), 'hora', 'horas');
	return futuro ? `en ${cantidad}` : `hace ${cantidad}`;
}
