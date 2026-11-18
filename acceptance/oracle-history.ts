// Oráculo del Historial (spec §6.3), de la Última vez (§6.2) y del aviso de deshacer (§5.4), escrito desde el spec.
// NO importa el core ni los step handlers: es una segunda implementación, así que la
// implementación no juzga a sus propios tests. Lo que el spec no decide (dos entradas
// con el mismo completadoEn sin ids explícitos) devuelve undefined: no se filtra.
import { WEEKDAYS, dayStart, addDays } from './oracle';

/** §5.4: el aviso dura 5 segundos. */
const NOTICE_DURATION_MS = 5_000;

/** §5.4: el aviso se ve mientras completadoEn ≤ ahora < completadoEn + 5 s. */
export const noticeSees = (completedAt: number, now: number) =>
	completedAt <= now && now < completedAt + NOTICE_DURATION_MS;

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const twoDigits = (n: number) => String(n).padStart(2, '0');
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** §6.3: "Hoy", "Ayer" o "martes 14 de julio" (con " de 2025" si el año no es el de ahora). */
export function dayHeading(at: number, now: number): string {
	const day = new Date(at);
	const today = new Date(now);
	if (sameDay(day, today)) return 'Hoy';
	if (sameDay(day, addDays(today, -1))) return 'Ayer';
	const text = `${WEEKDAYS[day.getDay()]} ${day.getDate()} de ${MONTHS[day.getMonth()]}`;
	return day.getFullYear() === today.getFullYear() ? text : `${text} de ${day.getFullYear()}`;
}

const hourOf = (at: number) => `${twoDigits(new Date(at).getHours())}:${twoDigits(new Date(at).getMinutes())}`;

/**
 * §6.2: lo que sigue a "Última vez: " según el completadoEn más reciente de la tarea y el día local:
 * "hoy HH:MM", "ayer HH:MM", "hace N días" (N ≥ 2), la fecha del Historial y la hora si es de un día
 * posterior a hoy, o "nunca" sin completados.
 */
export function textOfLastTime(completedAts: number[], now: number): string {
	if (completedAts.length === 0) return 'nunca';
	const last = Math.max(...completedAts);
	const days = Math.round((dayStart(now).getTime() - dayStart(last).getTime()) / 86_400_000);
	if (days < 0) return `${dayHeading(last, now)} ${hourOf(last)}`;
	if (days >= 2) return `hace ${days} días`;
	return `${days === 0 ? 'hoy' : 'ayer'} ${hourOf(last)}`;
}

export interface OracleEntry {
	completedAt: number;
	/** Solo cuando el escenario lo fija ("con id c1"). */
	id?: string;
	/** El título actual de la tarea. */
	title: string;
	/** §4.4: el completado fue «Hice la mínima». */
	minimal?: boolean;
}

/** §6.3: del más reciente al más antiguo; con el mismo completadoEn, el de id menor. */
function sorted(entries: OracleEntry[]): OracleEntry[] | undefined {
	const hasTieWithoutTiebreak = entries.some((a, i) =>
		entries.some((b, j) => i < j && a.completedAt === b.completedAt && (a.id === undefined || b.id === undefined || a.id === b.id))
	);
	if (hasTieWithoutTiebreak) return undefined;
	const idSmaller = (a: OracleEntry, b: OracleEntry) => ((a.id ?? '') < (b.id ?? '') ? -1 : 1);
	return [...entries].sort((a, b) => b.completedAt - a.completedAt || idSmaller(a, b));
}

/**
 * El texto que el Historial muestra: grupos "<encabezado>: <entradas>" separados por "; ",
 * entradas "<título> <HH:MM>[ Mínima]" separadas por ", ". Vacío si no hay entradas.
 */
export function historyText(entries: OracleEntry[], now: number): string | undefined {
	const order = sorted(entries);
	if (!order) return undefined;
	const groups: { heading: string; texts: string[] }[] = [];
	for (const { completedAt, title, minimal } of order) {
		const heading = dayHeading(completedAt, now);
		// §6.3: la palabra «Mínima» después de la hora si fue la mínima; nunca el texto de la versión mínima.
		const text = `${title} ${hourOf(completedAt)}${minimal ? ' Mínima' : ''}`;
		const last = groups.at(-1);
		if (last?.heading === heading) last.texts.push(text);
		else groups.push({ heading, texts: [text] });
	}
	return groups.map(({ heading, texts }) => `${heading}: ${texts.join(', ')}`).join('; ');
}
