// Spec §6.2: qué muestra el panel de edición según el ancho, el modo y los errores.
import type { CreationErrors } from './creation';
import { DATA_ON_CREATE, type TaskData } from './task-data';

export type PanelPresentation = 'pestanas' | 'secciones';
export type PanelMode = 'crear' | 'editar';
export type PanelSection = 'Tarea' | 'Cuándo' | 'Acciones';
export type FieldWithError = 'Título' | 'Etiquetas' | 'fecha límite' | 'Cada' | 'días' | 'horario';
export type RepetitionOption = 'puntual' | 'relativo' | 'semanal' | 'mensual';
export type ErrorDestination = { tab: PanelSection | undefined; field: FieldWithError };

const MAX_PHONE_WIDTH_IN_REM = 40;
const SECTIONS_ON_CREATE: readonly PanelSection[] = ['Tarea', 'Cuándo'];
const SECTIONS_ON_EDIT: readonly PanelSection[] = ['Tarea', 'Cuándo', 'Acciones'];
const FIELDS_IN_READING_ORDER: readonly FieldWithError[] = ['Título', 'Etiquetas', 'fecha límite', 'Cada', 'días', 'horario'];
const SECTION_OF_FIELD: Readonly<Record<FieldWithError, PanelSection>> = {
	Título: 'Tarea',
	Etiquetas: 'Tarea',
	'fecha límite': 'Cuándo',
	Cada: 'Cuándo',
	días: 'Cuándo',
	horario: 'Cuándo'
};

/** Spec §6.2, Pestañas: "Siempre abre en Tarea, al crear y al editar". */
export const TAB_ON_OPEN: PanelSection = 'Tarea';

/** Spec §6.2: la opción de "Se repite" que viene elegida: al crear (sin datos), No se repite; al editar, la de la tarea. */
export function repetitionOnOpen(data: TaskData = DATA_ON_CREATE): RepetitionOption {
	if (data.shape === 'puntual') return 'puntual';
	if (data.shape === 'relativa') return 'relativo';
	return data.weekdays.length > 0 ? 'semanal' : 'mensual';
}

/** Spec §6.2, Presentación del panel: hasta 40rem inclusive es celular, en pestañas; por encima, secciones seguidas. */
export function panelPresentation(widthRem: number): PanelPresentation {
	return widthRem <= MAX_PHONE_WIDTH_IN_REM ? 'pestanas' : 'secciones';
}

/** Spec §6.2, Pestañas: al crear Acciones no aparece; al editar aparece siempre. */
export function panelSections(mode: PanelMode): readonly PanelSection[] {
	return mode === 'crear' ? SECTIONS_ON_CREATE : SECTIONS_ON_EDIT;
}

/** Spec §6.2, Errores: las secciones con algún campo que muestra un error, en el orden de las pestañas. */
export function markedSections(fieldsWithError: readonly FieldWithError[]): readonly PanelSection[] {
	return SECTIONS_ON_EDIT.filter((section) => fieldsWithError.some((field) => SECTION_OF_FIELD[field] === section));
}

/** Spec §6.2, Errores: al fallar Guardar, el primer campo con error y, solo en pestañas, la pestaña a la que salta. */
export function destinationOnSaveFailure(fieldsWithError: readonly FieldWithError[], presentation: PanelPresentation): ErrorDestination | undefined {
	const field = FIELDS_IN_READING_ORDER.find((candidate) => fieldsWithError.includes(candidate));
	if (!field) return undefined;
	return { tab: presentation === 'pestanas' ? SECTION_OF_FIELD[field] : undefined, field };
}

/** Spec §6.2, Teclado en pantalla: la barra de Guardar se oculta solo mientras el teclado en pantalla está abierto. */
export function saveBarVisible(keyboardOpen: boolean): boolean {
	return !keyboardOpen;
}

/**
 * Spec §6.2, Errores: los campos que muestran un error ahora, en el orden de lectura. Solo cuentan los
 * campos de la opción elegida en "Se repite"; el error de Etiquetas puede venir del guardado o del campo en vivo.
 */
export function fieldsWithError(errors: CreationErrors, repetition: RepetitionOption, labelsError: boolean): FieldWithError[] {
	const withError: Record<FieldWithError, boolean> = {
		Título: errors.title !== undefined,
		Etiquetas: labelsError,
		'fecha límite': errors.dueDate !== undefined && repetition === 'puntual',
		Cada: errors.every !== undefined && repetition === 'relativo',
		días: errors.days !== undefined && (repetition === 'semanal' || repetition === 'mensual'),
		horario: errors.schedule !== undefined
	};
	return FIELDS_IN_READING_ORDER.filter((field) => withError[field]);
}
