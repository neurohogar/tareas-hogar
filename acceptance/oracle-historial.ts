// Oráculo del Historial (spec §6.3), de la Última vez (§6.2) y del aviso de deshacer (§5.4), escrito desde el spec.
// NO importa el core ni los step handlers: es una segunda implementación, así que la
// implementación no juzga a sus propios tests. Lo que el spec no decide (dos entradas
// con el mismo completadoEn sin ids explícitos) devuelve undefined: no se filtra.
import { DIAS_DE_LA_SEMANA, inicioDelDia, sumarDias } from './oracle';

/** §5.4: el aviso dura 5 segundos. */
const DURACION_DEL_AVISO_MS = 5_000;

/** §5.4: el aviso se ve mientras completadoEn ≤ ahora < completadoEn + 5 s. */
export const avisoSeVe = (completadoEn: number, ahora: number) =>
	completadoEn <= ahora && ahora < completadoEn + DURACION_DEL_AVISO_MS;

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const dosDigitos = (n: number) => String(n).padStart(2, '0');
const mismoDia = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** §6.3: "Hoy", "Ayer" o "martes 14 de julio" (con " de 2025" si el año no es el de ahora). */
export function encabezadoDeDia(en: number, ahora: number): string {
	const dia = new Date(en);
	const hoy = new Date(ahora);
	if (mismoDia(dia, hoy)) return 'Hoy';
	if (mismoDia(dia, sumarDias(hoy, -1))) return 'Ayer';
	const texto = `${DIAS_DE_LA_SEMANA[dia.getDay()]} ${dia.getDate()} de ${MESES[dia.getMonth()]}`;
	return dia.getFullYear() === hoy.getFullYear() ? texto : `${texto} de ${dia.getFullYear()}`;
}

const horaDe = (en: number) => `${dosDigitos(new Date(en).getHours())}:${dosDigitos(new Date(en).getMinutes())}`;

/**
 * §6.2: lo que sigue a "Última vez: " según el completadoEn más reciente de la tarea y el día local:
 * "hoy HH:MM", "ayer HH:MM", "hace N días" (N ≥ 2), la fecha del Historial y la hora si es de un día
 * posterior a hoy, o "nunca" sin completados.
 */
export function textoDeUltimaVez(completadoEns: number[], ahora: number): string {
	if (completadoEns.length === 0) return 'nunca';
	const ultimo = Math.max(...completadoEns);
	const dias = Math.round((inicioDelDia(ahora).getTime() - inicioDelDia(ultimo).getTime()) / 86_400_000);
	if (dias < 0) return `${encabezadoDeDia(ultimo, ahora)} ${horaDe(ultimo)}`;
	if (dias >= 2) return `hace ${dias} días`;
	return `${dias === 0 ? 'hoy' : 'ayer'} ${horaDe(ultimo)}`;
}

export interface EntradaDelOraculo {
	completadoEn: number;
	/** Solo cuando el escenario lo fija ("con id c1"). */
	id?: string;
	/** El título actual de la tarea. */
	titulo: string;
}

/** §6.3: del más reciente al más antiguo; con el mismo completadoEn, el de id menor. */
function ordenadas(entradas: EntradaDelOraculo[]): EntradaDelOraculo[] | undefined {
	const hayEmpateSinDesempate = entradas.some((a, i) =>
		entradas.some((b, j) => i < j && a.completadoEn === b.completadoEn && (a.id === undefined || b.id === undefined || a.id === b.id))
	);
	if (hayEmpateSinDesempate) return undefined;
	const idMenor = (a: EntradaDelOraculo, b: EntradaDelOraculo) => ((a.id ?? '') < (b.id ?? '') ? -1 : 1);
	return [...entradas].sort((a, b) => b.completadoEn - a.completadoEn || idMenor(a, b));
}

/**
 * El texto que el Historial muestra: grupos "<encabezado>: <entradas>" separados por "; ",
 * entradas "<título> <HH:MM>" separadas por ", ". Vacío si no hay entradas.
 */
export function textoDelHistorial(entradas: EntradaDelOraculo[], ahora: number): string | undefined {
	const orden = ordenadas(entradas);
	if (!orden) return undefined;
	const grupos: { encabezado: string; textos: string[] }[] = [];
	for (const { completadoEn, titulo } of orden) {
		const encabezado = encabezadoDeDia(completadoEn, ahora);
		const texto = `${titulo} ${horaDe(completadoEn)}`;
		const ultimo = grupos.at(-1);
		if (ultimo?.encabezado === encabezado) ultimo.textos.push(texto);
		else grupos.push({ encabezado, textos: [texto] });
	}
	return grupos.map(({ encabezado, textos }) => `${encabezado}: ${textos.join(', ')}`).join('; ');
}
