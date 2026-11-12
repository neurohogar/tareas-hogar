import type { AccionDelPanel } from '../../src/lib/core/accion-del-panel';
import type { LoDeArriba } from '../../src/lib/core/atras-del-panel';
import type { Anotacion, PantallaActual } from '../../src/lib/core/anotacion';
import type { GrupoDeAnotaciones } from '../../src/lib/core/anotaciones';
import type { Aviso } from '../../src/lib/core/aviso';
import type { FormularioDelPanel, ValoresDelPanel } from '../../src/lib/core/cambios-sin-guardar';
import type { ErroresDeCreacion } from '../../src/lib/core/creacion';
import { tareaDesdeDocumento, type DocumentoDeTarea } from '../../src/lib/core/documento-de-tarea';
import type { Estado } from '../../src/lib/core/estado';
import type { Etiqueta } from '../../src/lib/core/etiqueta';
import type { ErrorDeRenombrado } from '../../src/lib/core/gestion-de-etiquetas';
import type { GrupoDelHistorial } from '../../src/lib/core/historial';
import { datosDeTarea } from '../../src/lib/core/datos-de-tarea';
import { etiquetasDeTarea } from '../../src/lib/core/etiquetas-de-tarea';
import type { Completado, Tarea } from '../../src/lib/core/tarea';

/** Lo que hay guardado: los documentos de las tareas, los completados y las etiquetas. */
export interface Guardado {
	documentos: DocumentoDeTarea[];
	completados: Completado[];
	etiquetas: Etiqueta[];
}

/** Estado de una ejecución de escenario: un repositorio en memoria. */
export interface World extends Guardado {
	siguienteId: number;
	/** El texto del que se pregunta con qué fuente se dibuja (§6). */
	texto?: string;
	/** Rechazo de la última creación o edición. */
	errores?: ErroresDeCreacion;
	/** Lo guardado justo antes de mi último cambio: lo que ve otro dispositivo "sin ver ese cambio". */
	antesDeMiCambio?: Guardado;
	completadosAnteriores?: Completado[];
	nuevoCompletado?: Completado;
	momentoDelNuevoCompletado?: Date;
	estados: Estado[];
	/** Los momentos en que se consultó el estado (en el orden de `estados`) o Pendientes. */
	momentosDelEstado: Date[];
	/** Las filas de Pendientes, de arriba hacia abajo, en cada momento consultado. */
	consultasDePendientes: FilaConsultada[][];
	/** El check "Mostrar completadas" de este dispositivo; sin él, en su valor inicial. */
	mostrarCompletadas?: boolean;
	/** El check "Mostrar pausadas" de este dispositivo (§6.1); sin él, en su valor inicial. */
	mostrarPausadas?: boolean;
	/** El botón "Solo rápidas" de este dispositivo (§6.1); sin él, apagado. */
	soloRapidas?: boolean;
	/** El panel de edición abierto (§6.2): el botón de pausa que ofrece y, si se abrió en un momento dado, lo que dice de la posposición. */
	panel?: { pausa: 'pausar' | 'reanudar' | undefined; posposicion?: { boton: 'posponer' | 'quitar' | undefined; texto: string | undefined }; cambios: CambiosDelPanel };
	/** El aviso de deshacer (§5.4) está a la vista: no depende del panel, sigue abierto aunque el panel se cierre. */
	avisoDeDeshacerAbierto?: boolean;
	/** Ya se tocó Atrás con el panel abierto (§6.2). */
	tocoAtras?: boolean;
	/** Ya se tocó el checkbox: "la tarea tiene N completados" verifica en vez de declarar. */
	checkboxTocado?: boolean;
	/** Lo que se borró (tareas y completados), para nombrarlo después de borrado. */
	borrado: Guardado;
	/** El aviso del último completado de este dispositivo. */
	aviso?: Aviso;
	/** El aviso que se veía en el último momento consultado (aviso: undefined si no había). */
	avisoConsultado?: { aviso?: Aviso };
	/** El Historial en el último momento consultado. */
	historial?: GrupoDelHistorial[];
	/** El texto de "Última vez" en el último momento consultado. */
	ultimaVez?: string;
	/** El id de la etiqueta elegida en el filtro de Pendientes; sin él, "Todas". */
	filtro?: string;
	/** Rechazo del último renombrado de etiqueta. */
	errorDeRenombrado?: ErrorDeRenombrado;
	/** Los emojis recientes del selector en este dispositivo; sin ellos, todavía no se declararon. */
	recientes?: string[];
	/** Ya hubo una acción sobre los recientes: los pasos "los emojis recientes son" y "hay N" verifican en vez de declarar. */
	huboAccionSobreRecientes?: boolean;
	/** El emoji que se eligió sin nombrarlo en el paso, y el más viejo de los recientes de antes. */
	emojiElegido?: string;
	emojiMasViejo?: string;
	/** Cuándo llega cada cosa en esta apertura de la app (§6.6). */
	apertura?: AperturaDeLaApp;
	/** Las anotaciones guardadas (§4.5, §7) y las que se borraron, para nombrarlas después. */
	anotaciones: Anotacion[];
	anotacionesBorradas: Anotacion[];
	/** La pantalla donde está la persona (§5.10). */
	pantallaActual?: PantallaActual;
	/** El panel de edición abierto desde la mirada de Anotar (§5.10): su tarea, si la hay, y lo que tenía al abrirse. */
	panelDeAnotar?: { tareaId?: string; cambios: CambiosDelPanel; documentosAlAbrir: DocumentoDeTarea[] };
	/** La última anotación declarada: los pasos "la anotación ..." la describen. */
	ultimaAnotacionId?: string;
	/** La pantalla Anotaciones en el último momento consultado. */
	anotacionesConsultadas?: GrupoDeAnotaciones[];
	/** Ya se copió: el texto (o nada para copiar). */
	copiado?: { texto: string | undefined };
}

/** Una fuente en la apertura: en qué segundo queda lista o falla, y si podría venir del dispositivo sin conexión. */
export interface FuenteDeLaApertura {
	llega: number;
	falla: number;
	guardada: boolean;
}

/** Lo que los pasos de la pantalla de carga declaran, en segundos desde el arranque (§6.6). */
export interface AperturaDeLaApp {
	sesion: boolean;
	sinConexion: boolean;
	pierdeLaConexion: number;
	auth: number;
	tareas: number;
	completados: number;
	etiquetas: number;
	atkinson: FuenteDeLaApertura;
	noto: FuenteDeLaApertura;
	recordaba: boolean;
	versionCambioElJuego: boolean;
}

/** Lo que se escribió en el panel y lo que tiene encima (§6.2, Cambios sin guardar y Atrás). */
export interface CambiosDelPanel {
	/** La tarea con que se abrió; sin ella, el panel se abrió para crear. */
	tareaAlAbrir?: Tarea;
	alAbrir: ValoresDelPanel;
	formulario: FormularioDelPanel;
	encima: LoDeArriba;
	/** La acción del aviso de acción abierto. */
	accion?: AccionDelPanel;
	/** El último momento conocido, si un paso lo dio. */
	ahora?: Date;
	tecladoAbierto: boolean;
}

/** Lo que se ve de una fila de Pendientes: el título, si se ve completada o pausada, y el texto del esfuerzo. */
export interface FilaConsultada {
	titulo: string;
	completada: boolean;
	pausada: boolean;
	esfuerzo: string | undefined;
}

/** El sujeto de los pasos del otro dispositivo: actúa sobre lo guardado antes de mi último cambio. */
export const OTRO = 'otro dispositivo, sin ver ese cambio,';

function cambiosAlAbrir(alAbrir: ValoresDelPanel, tareaAlAbrir?: Tarea, ahora?: Date): CambiosDelPanel {
	return { tareaAlAbrir, alAbrir, formulario: { ...alAbrir, sinConfirmar: '' }, encima: 'nada', ahora, tecladoAbierto: false };
}

/** Spec §6.2: al editar, el panel se abre con los valores actuales de la tarea. */
export function cambiosAlEditar(world: World, tarea: Tarea, ahora?: Date): CambiosDelPanel {
	return cambiosAlAbrir({ datos: datosDeTarea(tarea), etiquetas: etiquetasDeTarea(tarea, world.etiquetas).map(({ nombre }) => nombre) }, tarea, ahora);
}

/** Spec §6.2: al crear, el panel se abre con los valores de `datos`. */
export function cambiosAlCrear(datos: ValoresDelPanel['datos']): CambiosDelPanel {
	return cambiosAlAbrir({ datos, etiquetas: [] });
}

/** Un paso soportado: el runtime lo despacha con las capturas ya resueltas. */
export interface StepDefinition {
	pattern: RegExp;
	run: (world: World, ...values: string[]) => void;
}

export function createWorld(): World {
	return {
		documentos: [],
		completados: [],
		etiquetas: [],
		siguienteId: 1,
		anotaciones: [],
		anotacionesBorradas: [],
		estados: [],
		momentosDelEstado: [],
		consultasDePendientes: [],
		borrado: { documentos: [], completados: [], etiquetas: [] }
	};
}

export function nuevoId(world: World, prefijo: string): string {
	return `${prefijo}-${world.siguienteId++}`;
}

/** Con ceros a la izquierda: los ids de etiqueta crecen en el orden en que se crean, también comparados como texto. */
export function nuevoIdDeEtiqueta(world: World): string {
	return `etiqueta-${String(world.siguienteId++).padStart(6, '0')}`;
}

/** Solo lo guardado, sin el resto del estado del escenario. */
export const copiaDe = ({ documentos, completados, etiquetas }: Guardado): Guardado => ({ documentos, completados, etiquetas });

/** Las tareas que describen los documentos guardados. */
export function tareasDe(guardado: Guardado): Tarea[] {
	return guardado.documentos.map(tareaDesdeDocumento);
}

/** La única tarea guardada. */
export function laTarea(guardado: Guardado): Tarea {
	const tareas = tareasDe(guardado);
	if (tareas.length !== 1) throw new Error(`Se esperaba una tarea, hay ${tareas.length}`);
	return tareas[0];
}

/** El documento de la única tarea, con los campos que tenga aunque no correspondan a su tipo. */
export function elDocumento(world: World): DocumentoDeTarea {
	return world.documentos.find(({ id }) => id === laTarea(world).id) as DocumentoDeTarea;
}

export function laTareaDeTipo<T extends Tarea['tipo']>(world: World, tipo: T): Extract<Tarea, { tipo: T }> {
	const tarea = laTarea(world);
	if (tarea.tipo !== tipo) throw new Error(`Se esperaba una tarea ${tipo}, es ${tarea.tipo}`);
	return tarea as Extract<Tarea, { tipo: T }>;
}

/** La única tarea guardada con ese título. */
export function laTareaTitulada(guardado: Guardado, titulo: string): Tarea {
	const conEseTitulo = tareasDe(guardado).filter((tarea) => tarea.titulo === titulo);
	if (conEseTitulo.length !== 1) throw new Error(`Se esperaba una tarea "${titulo}", hay ${conEseTitulo.length}`);
	return conEseTitulo[0];
}

/**
 * Lo que vio otro dispositivo: lo guardado antes de mi último cambio. Si
 * todavía no hice ningún cambio, vio todo lo guardado.
 */
export function loQueVioElOtro(world: World): Guardado {
	return world.antesDeMiCambio ?? copiaDe(world);
}

export function recordarAntesDeMiCambio(world: World): void {
	world.antesDeMiCambio = copiaDe(world);
}

/**
 * Un cambio del otro dispositivo llega a lo guardado y también a lo que ve
 * él: sus cambios siguientes los tienen en cuenta.
 */
export function registrarDelOtro(world: World, aplicar: (guardado: Guardado) => Guardado): void {
	Object.assign(world, aplicar(copiaDe(world)));
	if (world.antesDeMiCambio) world.antesDeMiCambio = aplicar(world.antesDeMiCambio);
}

/** Saca de lo guardado los documentos, completados y anotaciones con esos ids, y recuerda lo que se borró. */
export function borrarGuardado(world: World, documentoIds: readonly string[], completadoIds: readonly string[], anotacionIds: readonly string[] = []): void {
	world.anotacionesBorradas = [...world.anotacionesBorradas, ...world.anotaciones.filter(({ id }) => anotacionIds.includes(id))];
	world.anotaciones = world.anotaciones.filter(({ id }) => !anotacionIds.includes(id));
	const seBorra = ({ id }: { id: string }, ids: readonly string[]) => ids.includes(id);
	world.borrado = {
		documentos: [...world.borrado.documentos, ...world.documentos.filter((d) => seBorra(d, documentoIds))],
		completados: [...world.borrado.completados, ...world.completados.filter((c) => seBorra(c, completadoIds))],
		etiquetas: world.borrado.etiquetas
	};
	world.documentos = world.documentos.filter((d) => !seBorra(d, documentoIds));
	world.completados = world.completados.filter((c) => !seBorra(c, completadoIds));
}

/** Todo lo que estuvo guardado en algún momento: lo que hay y lo que se borró. */
export function loQueHuboGuardado(world: World): Guardado {
	return {
		documentos: [...world.documentos, ...world.borrado.documentos],
		completados: [...world.completados, ...world.borrado.completados],
		etiquetas: [...world.etiquetas, ...world.borrado.etiquetas]
	};
}
