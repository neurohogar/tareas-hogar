// Spec §6.2 (Última vez): cuándo se completó la tarea por última vez, según
// su completadoEn más reciente y el día local.
import { latestCompletion, completionsOfTask } from './completions';
import { daysBetween } from './days';
import { dayHeader, timeInText } from './dates-in-text';
import type { Completion } from './task';

/** "hoy 08:05", "ayer 19:30", "hace N días", la fecha y la hora de un día posterior a hoy, o "nunca". */
export function lastTime(taskId: string, completions: readonly Completion[], now: Date): string {
	const owns = completionsOfTask(completions, taskId);
	if (owns.length === 0) return 'nunca';
	return momentInText(latestCompletion(owns).completedAt, now);
}

function momentInText(moment: Date, now: Date): string {
	const daysAgo = daysBetween(moment, now);
	if (daysAgo >= 2) return `hace ${daysAgo} días`;
	if (daysAgo === 1) return `ayer ${timeInText(moment)}`;
	if (daysAgo === 0) return `hoy ${timeInText(moment)}`;
	return `${dayHeader(moment, now)} ${timeInText(moment)}`;
}
