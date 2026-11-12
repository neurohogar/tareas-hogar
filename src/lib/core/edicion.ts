// Spec §6.2 (Editar) y §7 (Conflictos): editar valida como crear y produce
// un cambio parcial, solo con los campos que cambiaron.
import type { ErroresDeCreacion } from './creacion';
import { crearSegunDatos, type DatosDeTarea } from './datos-de-tarea';
import type { CambioDeTarea } from './documento-de-tarea';
import { estaPausada, reanudar } from './pausa';
import type { Horario, Recurrencia, Tarea } from './tarea';

export type ResultadoDeEdicion = { ok: true; cambio: CambioDeTarea } | { ok: false; errores: ErroresDeCreacion };

/** Una clave que identifica la recurrencia: dos recurrencias son la misma si tienen la misma clave. */
function claveDeRecurrencia(recurrencia: Recurrencia): string {
	if (recurrencia.modo === 'relativo') return `relativo ${recurrencia.cada} ${recurrencia.unidad}`;
	if ('diasSemana' in recurrencia) return `semanal ${recurrencia.diasSemana.join(' ')}`;
	return `mensual ${recurrencia.diasMes.join(' ')}`;
}

const claveDeHorario = (horario: Horario) => horario.map(({ desde, hasta }) => `${desde}-${hasta}`).join(' ');

const recurrenciaDe = (tarea: Tarea) => (tarea.tipo === 'periodica' ? tarea.recurrencia : undefined);
const fechaLimiteDe = (tarea: Tarea) => (tarea.tipo === 'puntual' ? tarea.fechaLimite : undefined);

/** Quitar el campo se escribe como null; undefined es "sin el campo". */
const nuloSiFalta = <T>(valor: T | undefined): T | null => (valor === undefined ? null : valor);

/** El campo cambió de valor: undefined es "sin el campo" y se escribe como null (quitarlo). */
function cambioDeCampo<T>(antes: T | undefined, despues: T | undefined, clave: (valor: T) => string | number) {
	const igual = antes === undefined || despues === undefined ? antes === despues : clave(antes) === clave(despues);
	return igual ? {} : { valor: nuloSiFalta(despues) };
}

/**
 * Al cambiar de tipo se escriben los dos campos de tipo: el que deja de
 * corresponder se quita aunque el documento no lo tenga, y el nuevo se escribe
 * aunque quede vacío (una puntual sin fecha límite), así no reaparece un valor
 * que dejó una edición concurrente cuando ese campo no correspondía (§7).
 */
function cambioDeTipo(despues: Tarea): CambioDeTarea {
	return { tipo: despues.tipo, fechaLimite: nuloSiFalta(fechaLimiteDe(despues)), recurrencia: nuloSiFalta(recurrenciaDe(despues)) };
}

/** Del mismo tipo, los campos de tipo que cambiaron de valor. */
function cambioDeCampos(antes: Tarea, despues: Tarea): CambioDeTarea {
	const cambio: CambioDeTarea = {};
	const fechaLimite = cambioDeCampo(fechaLimiteDe(antes), fechaLimiteDe(despues), (dia) => dia.getTime());
	if ('valor' in fechaLimite) cambio.fechaLimite = fechaLimite.valor;
	const recurrencia = cambioDeCampo(recurrenciaDe(antes), recurrenciaDe(despues), claveDeRecurrencia);
	if ('valor' in recurrencia) cambio.recurrencia = recurrencia.valor;
	return cambio;
}

/** Emoji, nota y esfuerzo: si cambiaron, el valor nuevo, o null si la tarea quedó sin el campo. */
function cambioDeValor(campo: 'emoji' | 'nota' | 'esfuerzo', antes: string | undefined, despues: string | undefined) {
	return antes === despues ? {} : { [campo]: nuloSiFalta(despues) };
}

/** El horario es un solo campo: si cambió, se escribe entero, o null si la tarea quedó sin horario (§7). */
function cambioDeHorario(antes: Tarea, despues: Tarea): CambioDeTarea {
	const horario = cambioDeCampo(antes.horario, despues.horario, claveDeHorario);
	return 'valor' in horario ? { horario: horario.valor } : {};
}

/** Los campos en que difieren las dos tareas. */
function cambioEntre(antes: Tarea, despues: Tarea): CambioDeTarea {
	return {
		...cambioDeHorario(antes, despues),
		...(antes.titulo !== despues.titulo && { titulo: despues.titulo }),
		...cambioDeValor('emoji', antes.emoji, despues.emoji),
		...cambioDeValor('nota', antes.nota, despues.nota),
		...cambioDeValor('esfuerzo', antes.esfuerzo, despues.esfuerzo),
		...(antes.tipo === despues.tipo ? cambioDeCampos(antes, despues) : cambioDeTipo(despues))
	};
}

/**
 * Spec §6.2: las mismas validaciones que al crear; si algún campo es
 * inválido, se rechaza entera. Nunca cambia id ni creadaEn.
 *
 * `tarea` es la tarea como estaba al abrir el panel (la que dio los datos
 * iniciales con datosDeTarea), no la que hay guardada al guardar: así un campo
 * que cambió otro dispositivo mientras el panel estaba abierto, y que yo no
 * toqué, no se pisa (§7, gana el último cambio por campo).
 *
 * Spec §5.8: pasar a puntual una periódica pausada la reanuda en `ahora` (el
 * momento de guardar); sin `ahora`, no la reanuda. Lo demás la deja pausada.
 */
export function editar(tarea: Tarea, datos: DatosDeTarea, ahora?: Date): ResultadoDeEdicion {
	const resultado = crearSegunDatos(datos, tarea.id, tarea.creadaEn);
	if (!resultado.ok) return resultado;
	const cambio = cambioEntre(tarea, resultado.tarea);
	const seReanuda = ahora && estaPausada(tarea) && resultado.tarea.tipo === 'puntual';
	return { ok: true, cambio: seReanuda ? { ...cambio, ...reanudar(ahora) } : cambio };
}
