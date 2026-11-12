// Spec §6.2: qué muestra el panel de edición según el ancho, el modo y los errores.
import type { ErroresDeCreacion } from './creacion';
import { DATOS_AL_CREAR, type DatosDeTarea } from './datos-de-tarea';

export type PresentacionDelPanel = 'pestanas' | 'secciones';
export type ModoDelPanel = 'crear' | 'editar';
export type SeccionDelPanel = 'Tarea' | 'Cuándo' | 'Acciones';
export type CampoConError = 'Título' | 'Etiquetas' | 'fecha límite' | 'Cada' | 'días' | 'horario';
export type OpcionDeRepeticion = 'puntual' | 'relativo' | 'semanal' | 'mensual';
export type DestinoDelError = { pestana: SeccionDelPanel | undefined; campo: CampoConError };

const ANCHO_MAXIMO_DE_CELULAR_EN_REM = 40;
const SECCIONES_AL_CREAR: readonly SeccionDelPanel[] = ['Tarea', 'Cuándo'];
const SECCIONES_AL_EDITAR: readonly SeccionDelPanel[] = ['Tarea', 'Cuándo', 'Acciones'];
const CAMPOS_EN_ORDEN_DE_LECTURA: readonly CampoConError[] = ['Título', 'Etiquetas', 'fecha límite', 'Cada', 'días', 'horario'];
const SECCION_DEL_CAMPO: Readonly<Record<CampoConError, SeccionDelPanel>> = {
	Título: 'Tarea',
	Etiquetas: 'Tarea',
	'fecha límite': 'Cuándo',
	Cada: 'Cuándo',
	días: 'Cuándo',
	horario: 'Cuándo'
};

/** Spec §6.2, Pestañas: "Siempre abre en Tarea, al crear y al editar". */
export const PESTANA_AL_ABRIR: SeccionDelPanel = 'Tarea';

/** Spec §6.2: la opción de "Se repite" que viene elegida: al crear (sin datos), No se repite; al editar, la de la tarea. */
export function repeticionAlAbrir(datos: DatosDeTarea = DATOS_AL_CREAR): OpcionDeRepeticion {
	if (datos.forma === 'puntual') return 'puntual';
	if (datos.forma === 'relativa') return 'relativo';
	return datos.diasSemana.length > 0 ? 'semanal' : 'mensual';
}

/** Spec §6.2, Presentación del panel: hasta 40rem inclusive es celular, en pestañas; por encima, secciones seguidas. */
export function presentacionDelPanel(anchoRem: number): PresentacionDelPanel {
	return anchoRem <= ANCHO_MAXIMO_DE_CELULAR_EN_REM ? 'pestanas' : 'secciones';
}

/** Spec §6.2, Pestañas: al crear Acciones no aparece; al editar aparece siempre. */
export function seccionesDelPanel(modo: ModoDelPanel): readonly SeccionDelPanel[] {
	return modo === 'crear' ? SECCIONES_AL_CREAR : SECCIONES_AL_EDITAR;
}

/** Spec §6.2, Errores: las secciones con algún campo que muestra un error, en el orden de las pestañas. */
export function seccionesMarcadas(camposConError: readonly CampoConError[]): readonly SeccionDelPanel[] {
	return SECCIONES_AL_EDITAR.filter((seccion) => camposConError.some((campo) => SECCION_DEL_CAMPO[campo] === seccion));
}

/** Spec §6.2, Errores: al fallar Guardar, el primer campo con error y, solo en pestañas, la pestaña a la que salta. */
export function destinoAlFallarGuardar(camposConError: readonly CampoConError[], presentacion: PresentacionDelPanel): DestinoDelError | undefined {
	const campo = CAMPOS_EN_ORDEN_DE_LECTURA.find((candidato) => camposConError.includes(candidato));
	if (!campo) return undefined;
	return { pestana: presentacion === 'pestanas' ? SECCION_DEL_CAMPO[campo] : undefined, campo };
}

/** Spec §6.2, Teclado en pantalla: la barra de Guardar se oculta solo mientras el teclado en pantalla está abierto. */
export function barraDeGuardarVisible(tecladoAbierto: boolean): boolean {
	return !tecladoAbierto;
}

/**
 * Spec §6.2, Errores: los campos que muestran un error ahora, en el orden de lectura. Solo cuentan los
 * campos de la opción elegida en "Se repite"; el error de Etiquetas puede venir del guardado o del campo en vivo.
 */
export function camposConError(errores: ErroresDeCreacion, repeticion: OpcionDeRepeticion, errorDeEtiquetas: boolean): CampoConError[] {
	const conError: Record<CampoConError, boolean> = {
		Título: errores.titulo !== undefined,
		Etiquetas: errorDeEtiquetas,
		'fecha límite': errores.fechaLimite !== undefined && repeticion === 'puntual',
		Cada: errores.cada !== undefined && repeticion === 'relativo',
		días: errores.dias !== undefined && (repeticion === 'semanal' || repeticion === 'mensual'),
		horario: errores.horario !== undefined
	};
	return CAMPOS_EN_ORDEN_DE_LECTURA.filter((campo) => conError[campo]);
}
