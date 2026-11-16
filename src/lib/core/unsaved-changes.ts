// Spec §6.2 (Cambios sin guardar): qué cuenta como "hay cambios". Es la única
// definición: vale para cerrar, para crear, para las acciones y para la
// confirmación del navegador. Se apoya en las normalizaciones de Guardar.
import { createFromData, type TaskData } from './task-data';
import { readEmoji } from './emoji';
import { sameName } from './label';
import { readSchedule, type TypedSchedule } from './schedule';
import { trimText } from './free-text';
import { normalizeSteps } from './steps';

/** Lo que Guardar considera del panel: los datos y los nombres de las etiquetas elegidas. */
export interface PanelValues {
	data: TaskData;
	labels: readonly string[];
}

/** El panel tal como está: además, el texto sin confirmar del campo Etiquetas. */
export interface PanelForm extends PanelValues {
	unconfirmed: string;
}

/** Con qué se prueba lo de "Se repite" por separado: su validez no depende de estos valores. */
const TEST_ID = '';
const TEST_TITLE = '-';
const TEST_MOMENT = new Date(0);

/** Lo de "Se repite" como lo guardaría Guardar; si es inválido, tal como se escribió. */
function repetitionKey(data: TaskData) {
	const onlyRepetition = { ...data, title: TEST_TITLE, emoji: undefined, note: undefined, firstStep: undefined, steps: undefined, minimalVersion: undefined, schedule: undefined, effort: undefined };
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
	return JSON.stringify([data.title.trim(), emojiKey(data.emoji), freeTextKey(data.note), normalizeSteps(data.firstStep, data.steps), freeTextKey(data.minimalVersion), data.effort, scheduleKey(data.schedule), repetitionKey(data)]);
}

/** Las etiquetas son un conjunto de nombres, sin distinguir mayúsculas (§4.3). */
function sameLabels(a: readonly string[], b: readonly string[]): boolean {
	const included = (ones: readonly string[], otherOnes: readonly string[]) => ones.every((name) => otherOnes.some((another) => sameName(name, another)));
	return included(a, b) && included(b, a);
}

/**
 * Spec §6.2: Guardar cambiaría algo respecto de los valores al abrir el panel
 * (no los de otro dispositivo), o hay texto sin confirmar en Etiquetas, salvo
 * solo espacios. Al crear, `alAbrir` es el formulario como se abrió.
 */
export function hasChanges(onOpen: PanelValues, current: PanelForm): boolean {
	if (current.unconfirmed.trim() !== '') return true;
	return dataKey(onOpen.data) !== dataKey(current.data) || !sameLabels(onOpen.labels, current.labels);
}
