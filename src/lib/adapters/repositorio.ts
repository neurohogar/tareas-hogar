// Traduce entre el modelo del core y Firestore (spec §7):
// users/{uid}/tareas/{tareaId}, users/{uid}/completados/{completadoId} y
// users/{uid}/etiquetas/{etiquetaId} (las anotaciones, en anotaciones.ts).
// Los documentos tienen su propia forma: ningún tipo de Firestore sale de acá.
import {
	arrayRemove,
	arrayUnion,
	collection,
	deleteDoc,
	deleteField,
	doc,
	FirestoreError,
	getDocFromServer,
	onSnapshot,
	setDoc,
	Timestamp,
	updateDoc,
	writeBatch,
	type DocumentData,
	type QueryDocumentSnapshot,
	type WriteBatch
} from 'firebase/firestore';
import type { Borrado } from '#lib/core/borrado.ts';
import type { BorradoDeEtiqueta } from '#lib/core/borrado-de-etiqueta.ts';
import { camposDeTexto } from '#lib/core/campos-de-texto.ts';
import { diaDesdeIso, diaIso } from '#lib/core/dias.ts';
import { tareaDesdeDocumento, type CambioDeTarea } from '#lib/core/documento-de-tarea.ts';
import type { Color, Etiqueta } from '#lib/core/etiqueta.ts';
import type { FusionDeEtiquetas } from '#lib/core/fusion-de-etiquetas.ts';
import type { CambioDeEtiqueta } from '#lib/core/gestion-de-etiquetas.ts';
import { ocurrenciaDesdeTexto, ocurrenciaEnTexto } from '#lib/core/ocurrencia-en-texto.ts';
import type { CambioDeReferencias } from '#lib/core/referencias-a-etiquetas.ts';
import type { Completado, DiaSemana, Esfuerzo, Horario, Tarea, Unidad, Ventana } from '#lib/core/tarea.ts';
import { db } from './firebase';

type Cancelar = () => void;

type RecurrenciaDoc =
	| { modo: 'relativo'; cada: number; unidad: Unidad }
	| { modo: 'calendario'; diasSemana: DiaSemana[] }
	| { modo: 'calendario'; diasMes: number[] };

/**
 * Tras dos ediciones concurrentes puede quedar un campo que no corresponde al
 * tipo; el core lo ignora (tareaDesdeDocumento).
 */
interface TareaDoc {
	titulo: string;
	/** Sin el campo, la tarea no tiene emoji. */
	emoji?: string;
	/** Sin el campo, la tarea no tiene nota. */
	nota?: string;
	/** Sin el campo, la tarea está sin estimar. */
	esfuerzo?: Esfuerzo;
	tipo: Tarea['tipo'];
	/** Fecha AAAA-MM-DD; sin el campo, la puntual no tiene fecha límite. */
	fechaLimite?: string;
	recurrencia?: RecurrenciaDoc;
	/**
	 * Un solo campo (§7): la lista de ventanas { desde, hasta } en "HH:MM" o, en
	 * el formato anterior, una sola ventana; sin el campo, la tarea no tiene horario.
	 */
	horario?: VentanaDoc[] | VentanaDoc;
	/** Ids de etiqueta; sin el campo, ninguna. */
	etiquetas?: string[];
	creadaEn: Timestamp;
	/** Sin el campo, no está pausada (§5.8). */
	pausada?: boolean;
	/** Última vez que se reanudó (§5.8). */
	reanudadaEn?: Timestamp;
	/** Un solo campo (§7); sin él, no está pospuesta (§5.9). */
	pospuesta?: { desde: Timestamp; hasta: Timestamp };
}

interface VentanaDoc {
	desde: string;
	hasta: string;
}

/** Copia campo por campo: el documento y el core tienen la misma forma de ventana. */
const copiarVentana = ({ desde, hasta }: Ventana | VentanaDoc): VentanaDoc => ({ desde, hasta });

/** Se escribe siempre como lista; el core lee también el formato anterior (§4.1). */
const copiarHorario = (horario: Horario): VentanaDoc[] => horario.map(copiarVentana);

const leerHorarioDoc = (horario: VentanaDoc[] | VentanaDoc) => (Array.isArray(horario) ? horario.map(copiarVentana) : copiarVentana(horario));

interface EtiquetaDoc {
	nombre: string;
	color: Color;
}

interface CompletadoDoc {
	tareaId: string;
	completadoEn: Timestamp;
	/** Fecha AAAA-MM-DD, o fecha y hora AAAA-MM-DDTHH:MM con horario (§4.4). */
	ocurrenciaCubierta?: string;
}

const tareaRef = (uid: string, tareaId: string) => doc(db, 'users', uid, 'tareas', tareaId);
const completadoRef = (uid: string, completadoId: string) => doc(db, 'users', uid, 'completados', completadoId);
const etiquetaRef = (uid: string, etiquetaId: string) => doc(db, 'users', uid, 'etiquetas', etiquetaId);

/** Copia campo por campo: el documento y el core tienen la misma forma de recurrencia. */
function copiarRecurrencia(recurrencia: RecurrenciaDoc): RecurrenciaDoc {
	if (recurrencia.modo === 'relativo') return { modo: 'relativo', cada: recurrencia.cada, unidad: recurrencia.unidad };
	if ('diasSemana' in recurrencia) return { modo: 'calendario', diasSemana: [...recurrencia.diasSemana] };
	return { modo: 'calendario', diasMes: [...recurrencia.diasMes] };
}

function tareaADoc(tarea: Tarea): TareaDoc {
	const creadaEn = Timestamp.fromDate(tarea.creadaEn);
	const comunes = {
		titulo: tarea.titulo,
		...(tarea.emoji !== undefined && { emoji: tarea.emoji }),
		...(tarea.nota !== undefined && { nota: tarea.nota }),
		...(tarea.esfuerzo && { esfuerzo: tarea.esfuerzo }),
		...(tarea.etiquetas && { etiquetas: [...tarea.etiquetas] }),
		...(tarea.horario && { horario: copiarHorario(tarea.horario) }),
		creadaEn
	};
	if (tarea.tipo === 'periodica') return { ...comunes, tipo: 'periodica', recurrencia: copiarRecurrencia(tarea.recurrencia) };
	const documento: TareaDoc = { ...comunes, tipo: 'puntual' };
	if (tarea.fechaLimite) documento.fechaLimite = diaIso(tarea.fechaLimite);
	return documento;
}

function tareaDesde(snapshot: QueryDocumentSnapshot<DocumentData>): Tarea {
	const datos = snapshot.data() as TareaDoc;
	return tareaDesdeDocumento({
		id: snapshot.id,
		titulo: datos.titulo,
		...camposDeTexto(datos),
		...(datos.esfuerzo && { esfuerzo: datos.esfuerzo }),
		tipo: datos.tipo,
		creadaEn: datos.creadaEn.toDate(),
		...(datos.fechaLimite && { fechaLimite: diaDesdeIso(datos.fechaLimite) }),
		...(datos.recurrencia && { recurrencia: copiarRecurrencia(datos.recurrencia) }),
		...(datos.horario && { horario: leerHorarioDoc(datos.horario) }),
		...(datos.etiquetas && { etiquetas: [...datos.etiquetas] }),
		...(datos.pausada && { pausada: datos.pausada }),
		...(datos.reanudadaEn && { reanudadaEn: datos.reanudadaEn.toDate() }),
		...(datos.pospuesta && { pospuesta: { desde: datos.pospuesta.desde.toDate(), hasta: datos.pospuesta.hasta.toDate() } })
	});
}

function etiquetaDesde(snapshot: QueryDocumentSnapshot<DocumentData>): Etiqueta {
	const { nombre, color } = snapshot.data() as EtiquetaDoc;
	return { id: snapshot.id, nombre, color };
}

/** Los campos del cambio como los escribe updateDoc: null quita el campo. */
function camposDelCambio({ titulo, emoji, nota, esfuerzo, tipo, fechaLimite, recurrencia, horario, etiquetas, pausada, reanudadaEn, pospuesta }: CambioDeTarea): DocumentData {
	const campos: DocumentData = {};
	if (etiquetas !== undefined) campos.etiquetas = [...etiquetas];
	if (titulo !== undefined) campos.titulo = titulo;
	if (emoji !== undefined) campos.emoji = emoji === null ? deleteField() : emoji;
	if (nota !== undefined) campos.nota = nota === null ? deleteField() : nota;
	if (esfuerzo !== undefined) campos.esfuerzo = esfuerzo === null ? deleteField() : esfuerzo;
	if (tipo !== undefined) campos.tipo = tipo;
	if (fechaLimite !== undefined) campos.fechaLimite = fechaLimite === null ? deleteField() : diaIso(fechaLimite);
	if (recurrencia !== undefined) campos.recurrencia = recurrencia === null ? deleteField() : copiarRecurrencia(recurrencia);
	// update reemplaza el campo entero: las ventanas se escriben juntas (§7).
	if (horario !== undefined) campos.horario = horario === null ? deleteField() : copiarHorario(horario);
	// pausada y reanudadaEn viajan juntos en el mismo update (§7).
	if (pausada !== undefined) campos.pausada = pausada === null ? deleteField() : pausada;
	if (reanudadaEn !== undefined) campos.reanudadaEn = Timestamp.fromDate(reanudadaEn);
	// pospuesta se escribe entera: desde y hasta juntos (§7).
	if (pospuesta !== undefined) {
		campos.pospuesta = pospuesta === null ? deleteField() : { desde: Timestamp.fromDate(pospuesta.desde), hasta: Timestamp.fromDate(pospuesta.hasta) };
	}
	return campos;
}

function completadoADoc(completado: Completado): CompletadoDoc {
	const documento: CompletadoDoc = {
		tareaId: completado.tareaId,
		completadoEn: Timestamp.fromDate(completado.completadoEn)
	};
	if (completado.ocurrenciaCubierta) documento.ocurrenciaCubierta = ocurrenciaEnTexto(completado.ocurrenciaCubierta);
	return documento;
}

function completadoDesde(snapshot: QueryDocumentSnapshot<DocumentData>): Completado {
	const datos = snapshot.data() as CompletadoDoc;
	const completado: Completado = { id: snapshot.id, tareaId: datos.tareaId, completadoEn: datos.completadoEn.toDate() };
	if (datos.ocurrenciaCubierta) completado.ocurrenciaCubierta = ocurrenciaDesdeTexto(datos.ocurrenciaCubierta);
	return completado;
}

export function observarTareas(uid: string, alCambiar: (tareas: Tarea[]) => void): Cancelar {
	return onSnapshot(collection(db, 'users', uid, 'tareas'), (consulta) =>
		alCambiar(consulta.docs.map(tareaDesde))
	);
}

export function observarCompletados(uid: string, alCambiar: (completados: Completado[]) => void): Cancelar {
	return onSnapshot(collection(db, 'users', uid, 'completados'), (consulta) =>
		alCambiar(consulta.docs.map(completadoDesde))
	);
}

export function observarEtiquetas(uid: string, alCambiar: (etiquetas: Etiqueta[]) => void): Cancelar {
	return onSnapshot(collection(db, 'users', uid, 'etiquetas'), (consulta) => alCambiar(consulta.docs.map(etiquetaDesde)));
}

const etiquetaADoc = ({ nombre, color }: Etiqueta): EtiquetaDoc => ({ nombre, color });

/** Un lote que empieza creando las etiquetas nuevas de un guardado del panel (§4.3). */
function loteConEtiquetas(uid: string, nuevas: readonly Etiqueta[]): WriteBatch {
	const lote = writeBatch(db);
	for (const etiqueta of nuevas) lote.set(etiquetaRef(uid, etiqueta.id), etiquetaADoc(etiqueta));
	return lote;
}

/** Spec §4.3: la tarea nueva y las etiquetas que se crean al guardarla, en un solo writeBatch. */
export async function guardarTarea(uid: string, tarea: Tarea, nuevas: readonly Etiqueta[]): Promise<void> {
	const lote = loteConEtiquetas(uid, nuevas);
	lote.set(tareaRef(uid, tarea.id), tareaADoc(tarea), { merge: true });
	await lote.commit();
}

/** Ignora el rechazo de una escritura sobre un documento que ya no existe: gana el borrado (§7). */
async function salvoBorrado(escritura: Promise<void>): Promise<void> {
	try {
		await escritura;
	} catch (error) {
		if (!(error instanceof FirestoreError && error.code === 'not-found')) throw error;
	}
}

export async function guardarCompletado(uid: string, completado: Completado): Promise<void> {
	await setDoc(completadoRef(uid, completado.id), completadoADoc(completado));
}

/**
 * Spec §7: escribe solo los campos que cambiaron, junto con las etiquetas que
 * se crean al guardar, en un solo writeBatch. update reemplaza cada campo
 * entero (la recurrencia y las etiquetas no se mezclan, como haría set con
 * merge) y falla si la tarea ya no existe: gana el borrado, la edición se
 * descarta y no se crea ninguna etiqueta.
 */
export async function guardarCambio(uid: string, tareaId: string, cambio: CambioDeTarea, nuevas: readonly Etiqueta[]): Promise<void> {
	const campos = camposDelCambio(cambio);
	if (Object.keys(campos).length === 0) return;
	const lote = loteConEtiquetas(uid, nuevas);
	lote.update(tareaRef(uid, tareaId), campos);
	await salvoBorrado(lote.commit());
}

/** Spec §7: nombre y color son campos independientes; un cambio de una etiqueta borrada no la revive. */
export async function cambiarEtiqueta(uid: string, etiquetaId: string, cambio: CambioDeEtiqueta): Promise<void> {
	await salvoBorrado(updateDoc(etiquetaRef(uid, etiquetaId), { ...cambio }));
}

/**
 * Traduce un CambioDeReferencias del core (§4.3, §7): arrayRemove y
 * arrayUnion tocan solo los ids nombrados, sin reemplazar el campo. Los dos en
 * un writeBatch, en el orden del core; una tarea que ya no existe se saltea.
 */
async function cambiarReferencias(uid: string, { tareaId, quitar, poner }: CambioDeReferencias): Promise<void> {
	const lote = writeBatch(db);
	if (quitar.length > 0) lote.update(tareaRef(uid, tareaId), { etiquetas: arrayRemove(...quitar) });
	if (poner.length > 0) lote.update(tareaRef(uid, tareaId), { etiquetas: arrayUnion(...poner) });
	await salvoBorrado(lote.commit());
}

/** Spec §4.3: borra la etiqueta y la quita de las tareas que la tienen. */
export async function borrarEtiqueta(uid: string, { etiquetaId, referencias }: BorradoDeEtiqueta): Promise<void> {
	await deleteDoc(etiquetaRef(uid, etiquetaId));
	await Promise.all(referencias.map((cambio) => cambiarReferencias(uid, cambio)));
}

/** Si la etiqueta no existe en el servidor; sin conexión, getDocFromServer falla con FirestoreError. */
async function borradaEnElServidor(uid: string, etiquetaId: string): Promise<boolean> {
	return !(await getDocFromServer(etiquetaRef(uid, etiquetaId))).exists();
}

/**
 * Spec §7: quita las referencias a etiquetas borradas. Antes confirma con el
 * servidor que cada etiqueta no existe (las colecciones se sincronizan por
 * separado); sin conexión no limpia nada.
 */
export async function limpiarReferencias(uid: string, rotas: readonly CambioDeReferencias[]): Promise<string[]> {
	const fallaron: string[] = [];
	for (const cambio of rotas) {
		try {
			const borradas = await Promise.all(cambio.quitar.map((id) => borradaEnElServidor(uid, id)));
			const quitar = cambio.quitar.filter((_, indice) => borradas[indice]);
			if (quitar.length > 0) await cambiarReferencias(uid, { ...cambio, quitar });
		} catch (error) {
			if (!(error instanceof FirestoreError)) throw error;
			fallaron.push(cambio.tareaId);
		}
	}
	return fallaron;
}

/**
 * Spec §7 (Etiquetas duplicadas): primero las tareas pasan a la sobreviviente,
 * después se borran las otras. Cada una se intenta por separado; una etiqueta
 * cuyas tareas no pasaron no se borra. Devuelve los ids de las que fallaron.
 */
export async function fusionarEtiquetas(uid: string, { borradas, referencias }: FusionDeEtiquetas): Promise<string[]> {
	const sinPasar = new Set<string>();
	for (const cambio of referencias) {
		try {
			await cambiarReferencias(uid, cambio);
		} catch {
			cambio.quitar.forEach((id) => sinPasar.add(id));
		}
	}
	const fallaron = borradas.filter((id) => sinPasar.has(id));
	for (const etiquetaId of borradas.filter((id) => !sinPasar.has(id))) {
		try {
			await deleteDoc(etiquetaRef(uid, etiquetaId));
		} catch {
			fallaron.push(etiquetaId);
		}
	}
	return fallaron;
}

/** Spec §7: la tarea, sus completados y sus anotaciones se borran en un solo writeBatch. */
export async function borrarTarea(uid: string, { tareaId, completadoIds, anotacionIds }: Borrado): Promise<void> {
	const lote = writeBatch(db);
	lote.delete(tareaRef(uid, tareaId));
	for (const completadoId of completadoIds) lote.delete(completadoRef(uid, completadoId));
	for (const anotacionId of anotacionIds) lote.delete(doc(db, 'users', uid, 'anotaciones', anotacionId));
	await lote.commit();
}

/**
 * Spec §7: borra los completados huérfanos. Antes de borrar uno confirma con
 * el servidor que su tarea no existe (las dos colecciones se sincronizan por
 * separado); sin conexión no limpia nada.
 */
export async function limpiarHuerfanos(uid: string, huerfanos: readonly Completado[]): Promise<string[]> {
	const fallaron: string[] = [];
	for (const completado of huerfanos) {
		try {
			const tarea = await getDocFromServer(tareaRef(uid, completado.tareaId));
			if (!tarea.exists()) await deleteDoc(completadoRef(uid, completado.id));
		} catch {
			fallaron.push(completado.id);
		}
	}
	return fallaron;
}

/**
 * Spec §5.4: borra un completado (deshacer). Si ya no existe (otro dispositivo
 * lo borró, o borró su tarea), no hace nada: deleteDoc no falla ni crea nada.
 */
export async function borrarCompletado(uid: string, completadoId: string): Promise<void> {
	await deleteDoc(completadoRef(uid, completadoId));
}
