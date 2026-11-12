// Spec §7 (Conflictos): una tarea tal como queda guardada. Las ediciones son
// parciales y por campo, así que tras dos ediciones concurrentes el documento
// puede tener un campo que no corresponde a su tipo.
import { camposDeTexto } from './campos-de-texto';
import { aplicarReferencias, type CambioDeReferencias } from './referencias-a-etiquetas';
import { camposDeEsfuerzo } from './esfuerzo';
import { horarioGuardado } from './horario';
import type { Esfuerzo, Horario, Posposicion, Recurrencia, Tarea, Ventana } from './tarea';

/** Los campos de la §4.1 que tiene la rebanada actual, sin exigir que correspondan al tipo. */
export interface DocumentoDeTarea {
	id: string;
	titulo: string;
	emoji?: string;
	nota?: string;
	esfuerzo?: Esfuerzo;
	tipo: Tarea['tipo'];
	creadaEn: Date;
	fechaLimite?: Date;
	recurrencia?: Recurrencia;
	/** Una lista de ventanas o, en el formato anterior, una sola (§4.1). */
	horario?: Horario | Ventana;
	etiquetas?: string[];
	/** Spec §5.8: solo vale para las periódicas. */
	pausada?: boolean;
	/** Spec §5.8: solo vale para las periódicas; una puntual lo ignora. */
	reanudadaEn?: Date;
	pospuesta?: Posposicion;
}

/**
 * Un cambio parcial: solo los campos que cambiaron. Un campo en null se quita
 * del documento. La recurrencia es un campo: se reemplaza entera.
 */
export interface CambioDeTarea {
	titulo?: string;
	emoji?: string | null;
	nota?: string | null;
	esfuerzo?: Esfuerzo | null;
	tipo?: Tarea['tipo'];
	fechaLimite?: Date | null;
	recurrencia?: Recurrencia | null;
	/** Un solo campo: sus ventanas, con desde y hasta, se escriben juntas (§7). */
	horario?: Horario | null;
	/** Se reemplaza entero: gana el último cambio, no se unen los agregados (§7). */
	etiquetas?: string[];
	/** Pausar y reanudar los escriben juntos (§7). */
	pausada?: true | null;
	reanudadaEn?: Date;
	/** Un solo campo: desde y hasta se escriben juntos (§7). */
	pospuesta?: Posposicion | null;
}

/** La tarea que describe el documento: un campo que no corresponde al tipo se ignora. */
export function tareaDesdeDocumento(documento: DocumentoDeTarea): Tarea {
	const { id, titulo, emoji, nota, esfuerzo, tipo, creadaEn, fechaLimite, recurrencia, horario, etiquetas, pospuesta } = documento;
	const comunes = { id, titulo, ...camposDeTexto({ emoji, nota }), ...camposDeEsfuerzo(esfuerzo), ...(etiquetas && { etiquetas }), ...(horario && { horario: horarioGuardado(horario) }), ...(pospuesta && { pospuesta }) };
	if (tipo === 'puntual') return { ...comunes, tipo, ...(fechaLimite && { fechaLimite }), creadaEn };
	if (!recurrencia) throw new Error(`La tarea periódica ${id} no tiene recurrencia`);
	return { ...comunes, tipo, recurrencia, creadaEn, ...camposDePausa(documento) };
}

/** Spec §5.8: pausada y reanudadaEn, solo los que tiene el documento. */
function camposDePausa({ pausada, reanudadaEn }: DocumentoDeTarea) {
	return { ...(pausada && { pausada }), ...(reanudadaEn && { reanudadaEn }) };
}

function aplicarAlDocumento(documento: DocumentoDeTarea, cambio: CambioDeTarea): DocumentoDeTarea {
	const editado: Record<string, unknown> = { ...documento };
	for (const [campo, valor] of Object.entries(cambio)) {
		if (valor === null) delete editado[campo];
		else editado[campo] = valor;
	}
	return editado as unknown as DocumentoDeTarea;
}

/**
 * Aplica un cambio al documento de esa tarea, como lo hace el servidor al
 * recibirlo: gana el último cambio por campo y, si la tarea ya no existe
 * (gana el borrado), el cambio se descarta.
 */
export function aplicarCambio(documentos: readonly DocumentoDeTarea[], tareaId: string, cambio: CambioDeTarea): DocumentoDeTarea[] {
	return documentos.map((documento) => (documento.id === tareaId ? aplicarAlDocumento(documento, cambio) : documento));
}

/**
 * Spec §4.3 y §7: los cambios de la app a las etiquetas de las tareas (borrar,
 * fusionar, limpiar), como los aplica el servidor con arrayRemove y
 * arrayUnion: tocan solo los ids que nombran. Una tarea que ya no existe se
 * saltea.
 */
export function aplicarCambiosDeReferencias(
	documentos: readonly DocumentoDeTarea[],
	cambios: readonly CambioDeReferencias[]
): DocumentoDeTarea[] {
	return cambios.reduce(
		(actuales, cambio) =>
			actuales.map((documento) =>
				documento.id === cambio.tareaId ? { ...documento, etiquetas: aplicarReferencias(documento.etiquetas, cambio) } : documento
			),
		[...documentos]
	);
}
