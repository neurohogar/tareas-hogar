// Spec §5.9 (Posponer): los comandos de posponer y quitar posponer, y sus opciones.
// Qué queda vigente y cómo cambia el estado lo decide posposicion-vigente.ts.
import { atTheMinute, addDays } from './days';
import type { TaskChange } from './task-document';

export type PostponeOption = '1 hora' | '3 horas' | 'hasta mañana';

/** Spec §5.9: las opciones de Posponer, con su texto en el panel. */
export const POSTPONE_OPTIONS: readonly { option: PostponeOption; label: string }[] = [
	{ option: '1 hora', label: '1 hora' },
	{ option: '3 horas', label: '3 horas' },
	{ option: 'hasta mañana', label: 'Hasta mañana' }
];

const MS_PER_HOUR = 60 * 60 * 1000;
const SEVEN_O_CLOCK = 7 * 60;

const inHours = (now: Date, hours: number) => new Date(now.getTime() + hours * MS_PER_HOUR);

function toByOption(option: PostponeOption, now: Date): Date {
	if (option === '1 hora') return inHours(now, 1);
	if (option === '3 horas') return inHours(now, 3);
	return atTheMinute(addDays(now, 1), SEVEN_O_CLOCK);
}

/** Spec §5.9 y §7: guarda pospuesta = { desde: ahora, hasta }, como un solo campo. */
export function postpone(option: PostponeOption, now: Date): TaskChange {
	return { postponed: { from: now, to: toByOption(option, now) } };
}

/** Spec §5.9: Quitar posponer borra pospuesta. */
export function removePostpone(): TaskChange {
	return { postponed: null };
}
