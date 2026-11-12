// Spec §6.7 (Copiar): el texto que copia el botón Copiar de la pantalla Anotaciones.
import type { Anotacion } from './anotacion';
import { anotacionesVisibles, type AnotacionVisible } from './anotaciones';
import { fechaYHoraEnTexto } from './fechas-en-texto';
import type { Tarea } from './tarea';

const SEPARADOR = ' · ';

const masAntiguaPrimero = (a: Date, b: Date) => a.getTime() - b.getTime();

/** Fecha y hora, sentido, pantalla, y el nombre de la tarea y el texto solo si los hay. */
function lineaDeAnotacion({ anotacion, nombreDeTarea }: AnotacionVisible): string {
	const { anotadaEn, sentido, pantalla, texto } = anotacion;
	return [fechaYHoraEnTexto(anotadaEn), sentido, pantalla, nombreDeTarea, texto].filter((parte) => parte !== undefined).join(SEPARADOR);
}

/**
 * Spec §6.7: una línea por anotación que la pantalla muestra, de la más antigua
 * a la más reciente (si empatan, primero la de id menor); undefined si no hay
 * nada para copiar.
 */
export function textoDeAnotaciones(tareas: readonly Tarea[], anotaciones: readonly Anotacion[]): string | undefined {
	const lineas = anotacionesVisibles(tareas, anotaciones, masAntiguaPrimero).map(lineaDeAnotacion);
	return lineas.length === 0 ? undefined : lineas.join('\n');
}
