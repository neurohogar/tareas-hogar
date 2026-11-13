// Lo que se carga en el panel de una tarea (spec §6.2), el mismo al crear y
// al editar: el título y los campos de la forma elegida en "Se repite".
import { camposDeTexto } from './campos-de-texto';
import type { ResultadoDeCreacion } from './creacion';
import { crearPeriodicaCalendario, type DatosPeriodicaCalendario } from './crear-periodica-calendario';
import { crearPeriodicaRelativa, type DatosPeriodicaRelativa } from './crear-periodica-relativa';
import { crearPuntual, type DatosPuntual } from './crear-puntual';
import { camposDeEsfuerzo } from './esfuerzo';
import { diaIso } from './dias';
import type { Tarea } from './tarea';

export type DatosDeTarea =
	| ({ forma: 'puntual' } & DatosPuntual)
	| ({ forma: 'relativa' } & DatosPeriodicaRelativa)
	| ({ forma: 'calendario' } & DatosPeriodicaCalendario);

/** Spec §6.2: los valores con que abre el panel al crear; "Se repite" viene en No se repite (puntual). */
export const DATOS_AL_CREAR: DatosDeTarea = { forma: 'puntual', titulo: '' };

/** Valida los datos con las reglas de su forma (§4.1–§4.2) y, si son válidos, arma la tarea. */
export function crearSegunDatos(datos: DatosDeTarea, id: string, ahora: Date): ResultadoDeCreacion {
	if (datos.forma === 'puntual') return crearPuntual(datos, id, ahora);
	if (datos.forma === 'relativa') return crearPeriodicaRelativa(datos, id, ahora);
	return crearPeriodicaCalendario(datos, id, ahora);
}

/** Los valores actuales de la tarea, como los carga el panel al editar: la inversa de crearSegunDatos. */
export function datosDeTarea(tarea: Tarea): DatosDeTarea {
	const { titulo, emoji, nota, primerPaso, horario, esfuerzo } = tarea;
	const comunes = { titulo, ...camposDeTexto({ emoji, nota, primerPaso }), ...(horario && { horario: horario.map((ventana) => ({ ...ventana })) }), ...camposDeEsfuerzo(esfuerzo) };
	if (tarea.tipo === 'puntual')
		return { forma: 'puntual', ...comunes, ...(tarea.fechaLimite && { fechaLimite: diaIso(tarea.fechaLimite) }) };
	const { recurrencia } = tarea;
	if (recurrencia.modo === 'relativo') return { forma: 'relativa', ...comunes, cada: recurrencia.cada, unidad: recurrencia.unidad };
	if ('diasSemana' in recurrencia) return { forma: 'calendario', ...comunes, diasSemana: [...recurrencia.diasSemana], diasMes: [] };
	return { forma: 'calendario', ...comunes, diasSemana: [], diasMes: [...recurrencia.diasMes] };
}
