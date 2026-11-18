// Oracle for History (spec §6.3), Last time (§6.2) and the undo notice (§5.4), written from the spec.
// It does NOT import the core or the step handlers: it is a second implementation, so the
// implementation does not judge its own tests. What the spec does not decide (two entries
// with the same completadoEn and no explicit ids) returns undefined: not filtered.
import { WEEKDAYS, dayStart, addDays } from './oracle';

/** §5.4: the notice lasts 5 seconds. */
const NOTICE_DURATION_MS = 5_000;

/** §5.4: the notice is shown while completadoEn ≤ now < completadoEn + 5 s. */
export const noticeSees = (completedAt: number, now: number) =>
	completedAt <= now && now < completedAt + NOTICE_DURATION_MS;

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const twoDigits = (n: number) => String(n).padStart(2, '0');
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** §6.3: "Hoy", "Ayer" or "martes 14 de julio" (with " de 2025" if the year is not the current one). */
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
 * §6.2: what follows "Última vez: " given the task's most recent completadoEn and the local day:
 * "hoy HH:MM", "ayer HH:MM", "hace N días" (N ≥ 2), the History date and the time if it is a day
   * after today, or "nunca" with no completions.
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
	/** Only when the scenario fixes it ("con id c1"). */
	id?: string;
	/** The task's current title. */
	title: string;
	/** §4.4: the completion was «Hice la mínima». */
	minimal?: boolean;
}

/** §6.3: from most recent to oldest; with the same completadoEn, the lower id first. */
function sorted(entries: OracleEntry[]): OracleEntry[] | undefined {
	const hasTieWithoutTiebreak = entries.some((a, i) =>
		entries.some((b, j) => i < j && a.completedAt === b.completedAt && (a.id === undefined || b.id === undefined || a.id === b.id))
	);
	if (hasTieWithoutTiebreak) return undefined;
	const idSmaller = (a: OracleEntry, b: OracleEntry) => ((a.id ?? '') < (b.id ?? '') ? -1 : 1);
	return [...entries].sort((a, b) => b.completedAt - a.completedAt || idSmaller(a, b));
}

/**
 * The text History shows: groups "<heading>: <entries>" separated by "; ",
 * entries "<title> <HH:MM>[ Mínima]" separated by ", ". Empty if there are no entries.
 */
export function historyText(entries: OracleEntry[], now: number): string | undefined {
	const order = sorted(entries);
	if (!order) return undefined;
	const groups: { heading: string; texts: string[] }[] = [];
	for (const { completedAt, title, minimal } of order) {
		const heading = dayHeading(completedAt, now);
		// §6.3: the word «Mínima» after the time if it was the minimal one; never the minimal version's text.
		const text = `${title} ${hourOf(completedAt)}${minimal ? ' Mínima' : ''}`;
		const last = groups.at(-1);
		if (last?.heading === heading) last.texts.push(text);
		else groups.push({ heading, texts: [text] });
	}
	return groups.map(({ heading, texts }) => `${heading}: ${texts.join(', ')}`).join('; ');
}
