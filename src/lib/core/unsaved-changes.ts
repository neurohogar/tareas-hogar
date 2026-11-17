// Spec §6.2 (Cambios sin guardar): qué cuenta como "hay cambios". Es la única
// definición: vale para cerrar, para crear, para las acciones y para la
// confirmación del navegador. Se apoya en las normalizaciones de Guardar.
import { createFromData, type TaskData } from './task-data';
import { readEmoji } from './emoji';
import { readSchedule, type TypedSchedule } from './schedule';
import { trimText } from './free-text';
import { normalizeSteps } from './steps';

/** El panel tal como está: lo que Guardar considera de él, que son los datos de la tarea. */
export interface PanelForm {
	data: TaskData;
}

/** Con qué se prueba lo de "Se repite" por separado: su validez no depende de estos valores. */
const TEST_ID = '';
const TEST_TITLE = '-';
const TEST_MOMENT = new Date(0);

/** Lo de "Se repite" como lo guardaría Guardar; si es inválido, tal como se escribió. */
function repetitionKey(data: TaskData) {
	const onlyRepetition = { ...data, title: TEST_TITLE, emoji: undefined, note: undefined, firstStep: undefined, steps: undefined, minimalVersion: undefined, schedule: undefined };
	const created = createFromData(onlyRepetition, TEST_ID, TEST_MOMENT);
	return created.ok ? created.task : onlyRepetition;
}

/** Las ventanas como las guardaría Guardar; si son inválidas, tal como se escribieron. */
function scheduleKey(schedule: TypedSchedule | undefined) {
	const reading = readSchedule(schedule);
	return reading.ok ? reading.schedule : schedule;
}

/** Sin el campo y vacío son lo mismo (nota y versión mínima, §4.1). */
function freeTextKey(text = '') {
	return trimText(text);
}

function emojiKey(emoji = '') {
	const reading = readEmoji(emoji);
	return reading.ok ? reading.emoji : emoji;
}

/** Dos datos con la misma clave son los mismos para Guardar. */
function dataKey(data: TaskData): string {
	return JSON.stringify([data.title.trim(), emojiKey(data.emoji), freeTextKey(data.note), normalizeSteps(data.firstStep, data.steps), freeTextKey(data.minimalVersion), scheduleKey(data.schedule), repetitionKey(data)]);
}

/**
 * Spec §6.2: hay cambios si y solo si Guardar cambiaría algo respecto de los
 * valores al abrir el panel (no los de otro dispositivo). Al crear, `onOpen`
 * es el formulario como se abrió.
 */
export function hasChanges(onOpen: PanelForm, current: PanelForm): boolean {
	return dataKey(onOpen.data) !== dataKey(current.data);
}
