import { crearPeriodica, type DatosComunes, type ErroresDeRecurrencia, type ResultadoDeCreacion } from './creacion';
import type { TareaPeriodica, Unidad } from './tarea';

export interface DatosPeriodicaRelativa extends DatosComunes {
	cada: number;
	unidad: Unidad;
}

/** Spec §4.1: con más de una ventana, el intervalo tiene que ser en días. */
const variasVentanasEnHoras = ({ unidad, horario = [] }: DatosPeriodicaRelativa) => unidad === 'horas' && horario.length > 1;

/** Spec §4.1 y §4.2: título no vacío (sin contar espacios), cada entero ≥ 1 y, en horas, una sola ventana. */
export function crearPeriodicaRelativa(datos: DatosPeriodicaRelativa, id: string, ahora: Date): ResultadoDeCreacion<TareaPeriodica> {
	const { cada, unidad, ...comunes } = datos;
	const errores: ErroresDeRecurrencia = {
		...(!(Number.isInteger(cada) && cada >= 1) && { cada: 'invalido' as const }),
		...(variasVentanasEnHoras(datos) && { horario: 'variasEnHoras' as const })
	};
	return crearPeriodica({ ...comunes, id, ahora }, errores, () => ({ modo: 'relativo', cada, unidad }));
}
