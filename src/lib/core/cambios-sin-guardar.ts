// Spec §6.2 (Cambios sin guardar): qué cuenta como "hay cambios". Es la única
// definición: vale para cerrar, para crear, para las acciones y para la
// confirmación del navegador. Se apoya en las normalizaciones de Guardar.
import { crearSegunDatos, type DatosDeTarea } from './datos-de-tarea';
import { leerEmoji } from './emoji';
import { mismoNombre } from './etiqueta';
import { leerHorario, type HorarioEscrito } from './horario';
import { normalizarNota } from './nota';

/** Lo que Guardar considera del panel: los datos y los nombres de las etiquetas elegidas. */
export interface ValoresDelPanel {
	datos: DatosDeTarea;
	etiquetas: readonly string[];
}

/** El panel tal como está: además, el texto sin confirmar del campo Etiquetas. */
export interface FormularioDelPanel extends ValoresDelPanel {
	sinConfirmar: string;
}

/** Con qué se prueba lo de "Se repite" por separado: su validez no depende de estos valores. */
const ID_DE_PRUEBA = '';
const TITULO_DE_PRUEBA = '-';
const MOMENTO_DE_PRUEBA = new Date(0);

/** Lo de "Se repite" como lo guardaría Guardar; si es inválido, tal como se escribió. */
function claveDeRepeticion(datos: DatosDeTarea) {
	const soloRepeticion = { ...datos, titulo: TITULO_DE_PRUEBA, emoji: undefined, nota: undefined, primerPaso: undefined, horario: undefined, esfuerzo: undefined };
	const creada = crearSegunDatos(soloRepeticion, ID_DE_PRUEBA, MOMENTO_DE_PRUEBA);
	return creada.ok ? creada.tarea : soloRepeticion;
}

/** Las ventanas como las guardaría Guardar; si son inválidas, tal como se escribieron. */
function claveDeHorario(horario: HorarioEscrito | undefined) {
	const lectura = leerHorario(horario);
	return lectura.ok ? lectura.horario : horario;
}

/** Sin el campo y vacío son lo mismo, para la nota y para el primer paso (§4.1). */
function claveDeTexto(texto = '') {
	return normalizarNota(texto);
}

function claveDeEmoji(emoji = '') {
	const lectura = leerEmoji(emoji);
	return lectura.ok ? lectura.emoji : emoji;
}

/** Dos datos con la misma clave son los mismos para Guardar. */
function claveDeDatos(datos: DatosDeTarea): string {
	return JSON.stringify([datos.titulo.trim(), claveDeEmoji(datos.emoji), claveDeTexto(datos.nota), claveDeTexto(datos.primerPaso), datos.esfuerzo, claveDeHorario(datos.horario), claveDeRepeticion(datos)]);
}

/** Las etiquetas son un conjunto de nombres, sin distinguir mayúsculas (§4.3). */
function mismasEtiquetas(a: readonly string[], b: readonly string[]): boolean {
	const incluidas = (unas: readonly string[], otras: readonly string[]) => unas.every((nombre) => otras.some((otro) => mismoNombre(nombre, otro)));
	return incluidas(a, b) && incluidas(b, a);
}

/**
 * Spec §6.2: Guardar cambiaría algo respecto de los valores al abrir el panel
 * (no los de otro dispositivo), o hay texto sin confirmar en Etiquetas, salvo
 * solo espacios. Al crear, `alAbrir` es el formulario como se abrió.
 */
export function hayCambios(alAbrir: ValoresDelPanel, actual: FormularioDelPanel): boolean {
	if (actual.sinConfirmar.trim() !== '') return true;
	return claveDeDatos(alAbrir.datos) !== claveDeDatos(actual.datos) || !mismasEtiquetas(alAbrir.etiquetas, actual.etiquetas);
}
