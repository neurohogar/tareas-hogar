// Spec §6.2 (Unsaved changes): what counts as "has changes". It is the only
// definition: it applies to closing, to creating, to the actions and to the
// browser confirmation. It relies on the normalizations of Save.
import { createFromData, type TaskData } from './task-data';
import { readEmoji } from './emoji';
import { readSchedule, type TypedSchedule } from './schedule';
import { trimText } from './free-text';
import { normalizeSteps } from './steps';

/** The panel as it is: what Save considers of it, which is the task data. */
export interface PanelForm {
	data: TaskData;
}

/** What is tested of "Se repite" separately: its validity does not depend on these values. */
const TEST_ID = '';
const TEST_TITLE = '-';
const TEST_MOMENT = new Date(0);

/** The "Se repite" part as Save would store it; if invalid, as written. */
function repetitionKey(data: TaskData) {
	const onlyRepetition = { ...data, title: TEST_TITLE, emoji: undefined, note: undefined, firstStep: undefined, steps: undefined, minimalVersion: undefined, essential: undefined, schedule: undefined };
	const created = createFromData(onlyRepetition, TEST_ID, TEST_MOMENT);
	return created.ok ? created.task : onlyRepetition;
}

/** The windows as Save would store them; if invalid, as written. */
function scheduleKey(schedule: TypedSchedule | undefined) {
	const reading = readSchedule(schedule);
	return reading.ok ? reading.schedule : schedule;
}

/** Without the field and empty are the same (note and minimal version, §4.1). */
function freeTextKey(text = '') {
	return trimText(text);
}

function emojiKey(emoji = '') {
	const reading = readEmoji(emoji);
	return reading.ok ? reading.emoji : emoji;
}

/** Two data with the same key are the same for Save. */
function dataKey(data: TaskData): string {
	return JSON.stringify([data.title.trim(), emojiKey(data.emoji), freeTextKey(data.note), normalizeSteps(data.firstStep, data.steps), freeTextKey(data.minimalVersion), data.essential === true, scheduleKey(data.schedule), repetitionKey(data)]);
}

/**
 * Spec §6.2: there are changes if and only if Save would change something compared to the
 * values on opening the panel (not those of another device). When creating, `onOpen`
 * is the form as it was opened.
 */
export function hasChanges(onOpen: PanelForm, current: PanelForm): boolean {
	return dataKey(onOpen.data) !== dataKey(current.data);
}
