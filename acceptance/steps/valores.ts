// Conversión estricta de valores de Examples a tipos del dominio. Un valor
// malformado falla el escenario (requisito del runtime APS).
import { DIAS_DE_LA_SEMANA, type DiaSemana, type OcurrenciaCubierta, type Unidad } from '../../src/lib/core/tarea';

/** Captura de un `<placeholder>`; el runtime la reemplaza por su valor. */
export const P = '(<[A-Za-z0-9_]+>)';

/** Título de una palabra, escrito en el paso o como `<placeholder>`. */
export const TITULO = '(\\S+)';

const FECHA_HORA_LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/;
const FECHA_LOCAL = /^\d{4}-\d{2}-\d{2}$/;

/** ISO-8601 sin zona: hora local del dispositivo (spec §5). */
export function fechaHora(valor: string): Date {
	const partes = FECHA_HORA_LOCAL.exec(valor);
	if (!partes) throw new Error(`Fecha y hora inválida: "${valor}"`);
	const [anio, mes, dia, hora, minuto, segundo] = partes.slice(1).map(Number);
	const fecha = new Date(anio, mes - 1, dia, hora, minuto, segundo);
	const mismaFecha =
		fecha.getFullYear() === anio &&
		fecha.getMonth() === mes - 1 &&
		fecha.getDate() === dia &&
		fecha.getHours() === hora &&
		fecha.getMinutes() === minuto &&
		fecha.getSeconds() === segundo;
	if (!mismaFecha) throw new Error(`Fecha y hora inexistente: "${valor}"`);
	return fecha;
}

export function numero(valor: string): number {
	if (!/^-?\d+(\.\d+)?$/.test(valor)) throw new Error(`Número inválido: "${valor}"`);
	return Number(valor);
}

export function unidad(valor: string): Unidad {
	if (valor !== 'horas' && valor !== 'dias') throw new Error(`Unidad inválida: "${valor}"`);
	return valor;
}

/** ISO-8601 sin hora: el inicio (00:00 locales) de ese día. */
export function fecha(valor: string): Date {
	if (!FECHA_LOCAL.test(valor)) throw new Error(`Fecha inválida: "${valor}"`);
	return fechaHora(`${valor}T00:00:00`);
}

/**
 * Spec §4.4: una ocurrencia cubierta sin hora (2026-07-14) es un día; con hora
 * (2026-07-14T07:00:00), el inicio de una ocurrencia con horario.
 */
export function ocurrencia(valor: string): OcurrenciaCubierta {
	return FECHA_LOCAL.test(valor) ? fecha(valor) : { inicio: fechaHora(valor) };
}

/** Lista separada por comas ("martes, jueves"), en el orden escrito. */
export function lista(valor: string): string[] {
	const elementos = valor.split(',').map((elemento) => elemento.trim());
	if (elementos.some((elemento) => elemento === '')) throw new Error(`Lista inválida: "${valor}"`);
	return elementos;
}

export function diasSemana(valor: string): DiaSemana[] {
	return lista(valor).map((dia) => {
		if (!(DIAS_DE_LA_SEMANA as readonly string[]).includes(dia)) throw new Error(`Día de la semana inválido: "${dia}"`);
		return dia as DiaSemana;
	});
}

export function diasMes(valor: string): number[] {
	return lista(valor).map(numero);
}
