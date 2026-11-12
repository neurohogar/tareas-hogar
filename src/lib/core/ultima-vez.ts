// Spec §6.2 (Última vez): cuándo se completó la tarea por última vez, según
// su completadoEn más reciente y el día local.
import { completadoMasReciente, completadosDeTarea } from './completados';
import { diasEntre } from './dias';
import { encabezadoDelDia, horaEnTexto } from './fechas-en-texto';
import type { Completado } from './tarea';

/** "hoy 08:05", "ayer 19:30", "hace N días", la fecha y la hora de un día posterior a hoy, o "nunca". */
export function ultimaVez(tareaId: string, completados: readonly Completado[], ahora: Date): string {
	const propios = completadosDeTarea(completados, tareaId);
	if (propios.length === 0) return 'nunca';
	return momentoEnTexto(completadoMasReciente(propios).completadoEn, ahora);
}

function momentoEnTexto(momento: Date, ahora: Date): string {
	const diasAtras = diasEntre(momento, ahora);
	if (diasAtras >= 2) return `hace ${diasAtras} días`;
	if (diasAtras === 1) return `ayer ${horaEnTexto(momento)}`;
	if (diasAtras === 0) return `hoy ${horaEnTexto(momento)}`;
	return `${encabezadoDelDia(momento, ahora)} ${horaEnTexto(momento)}`;
}
