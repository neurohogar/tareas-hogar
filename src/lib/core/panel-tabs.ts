// Spec §6.2: what the edit panel shows depending on the width, the mode and the errors.
import type { CreationErrors } from './creation';
import { DATA_ON_CREATE, type TaskData } from './task-data';

export type PanelPresentation = 'pestanas' | 'secciones';
export type PanelMode = 'crear' | 'editar';
export type PanelSection = 'Tarea' | 'Cuándo' | 'Acciones';
export type FieldWithError = 'Título' | 'fecha límite' | 'Cada' | 'días' | 'horario';
export type RepetitionOption = 'puntual' | 'relativo' | 'semanal' | 'mensual';
export type ErrorDestination = { tab: PanelSection | undefined; field: FieldWithError };

const MAX_PHONE_WIDTH_IN_REM = 40;
const SECTIONS_ON_CREATE: readonly PanelSection[] = ['Tarea', 'Cuándo'];
const SECTIONS_ON_EDIT: readonly PanelSection[] = ['Tarea', 'Cuándo', 'Acciones'];
const FIELDS_IN_READING_ORDER: readonly FieldWithError[] = ['Título', 'fecha límite', 'Cada', 'días', 'horario'];
const SECTION_OF_FIELD: Readonly<Record<FieldWithError, PanelSection>> = {
	Título: 'Tarea',
	'fecha límite': 'Cuándo',
	Cada: 'Cuándo',
	días: 'Cuándo',
	horario: 'Cuándo'
};

/** Spec §6.2, Tabs: "Siempre abre en Tarea, al crear y al editar". */
export const TAB_ON_OPEN: PanelSection = 'Tarea';

/** Spec §6.2: the "Se repite" option that comes selected: when creating (without data), No se repite; when editing, the task's. */
export function repetitionOnOpen(data: TaskData = DATA_ON_CREATE): RepetitionOption {
	if (data.shape === 'puntual') return 'puntual';
	if (data.shape === 'relativa') return 'relativo';
	return data.weekdays.length > 0 ? 'semanal' : 'mensual';
}

/** Spec §6.2, Panel presentation: up to 40rem inclusive is a phone, in tabs; above that, consecutive sections. */
export function panelPresentation(widthRem: number): PanelPresentation {
	return widthRem <= MAX_PHONE_WIDTH_IN_REM ? 'pestanas' : 'secciones';
}

/** Spec §6.2, Tabs: when creating Acciones does not appear; when editing it always appears. */
export function panelSections(mode: PanelMode): readonly PanelSection[] {
	return mode === 'crear' ? SECTIONS_ON_CREATE : SECTIONS_ON_EDIT;
}

/** Spec §6.2, Errors: the sections with some field showing an error, in tab order. */
export function markedSections(fieldsWithError: readonly FieldWithError[]): readonly PanelSection[] {
	return SECTIONS_ON_EDIT.filter((section) => fieldsWithError.some((field) => SECTION_OF_FIELD[field] === section));
}

/** Spec §6.2, Errors: when Save fails, the first field with an error and, only in tabs, the tab it jumps to. */
export function destinationOnSaveFailure(fieldsWithError: readonly FieldWithError[], presentation: PanelPresentation): ErrorDestination | undefined {
	const field = FIELDS_IN_READING_ORDER.find((candidate) => fieldsWithError.includes(candidate));
	if (!field) return undefined;
	return { tab: presentation === 'pestanas' ? SECTION_OF_FIELD[field] : undefined, field };
}

/** Spec §6.2, On-screen keyboard: the Guardar bar is hidden only while the on-screen keyboard is open. */
export function saveBarVisible(keyboardOpen: boolean): boolean {
	return !keyboardOpen;
}

/**
 * Spec §6.2, Errors: the fields showing an error now, in reading order. Only the
 * fields of the option chosen in "Se repite" count.
 */
export function fieldsWithError(errors: CreationErrors, repetition: RepetitionOption): FieldWithError[] {
	const withError: Record<FieldWithError, boolean> = {
		Título: errors.title !== undefined,
		'fecha límite': errors.dueDate !== undefined && repetition === 'puntual',
		Cada: errors.every !== undefined && repetition === 'relativo',
		días: errors.days !== undefined && (repetition === 'semanal' || repetition === 'mensual'),
		horario: errors.schedule !== undefined
	};
	return FIELDS_IN_READING_ORDER.filter((field) => withError[field]);
}
