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
import type { Deletion } from '#lib/core/deletion.ts';
import type { LabelDeletion } from '#lib/core/label-deletion.ts';
import { textFields } from '#lib/core/text-fields.ts';
import { dayFromIso, isoDay } from '#lib/core/days.ts';
import { taskFromDocument, type TaskChange } from '#lib/core/task-document.ts';
import type { Color, Label } from '#lib/core/label.ts';
import type { LabelMerge } from '#lib/core/label-merge.ts';
import type { LabelChange } from '#lib/core/label-management.ts';
import { occurrenceFromText, occurrenceInText } from '#lib/core/occurrence-in-text.ts';
import type { ReferencesChange } from '#lib/core/label-references.ts';
import type { Completion, Weekday, Effort, Recurrence, Schedule, Task, Unit, TimeWindow } from '#lib/core/task.ts';
import { db } from './firebase';

type Cancelar = () => void;

type RecurrenciaDoc =
	| { modo: 'relativo'; cada: number; unidad: Unit }
	| { modo: 'calendario'; diasSemana: Weekday[] }
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
	/** Sin el campo, la tarea no tiene primer paso. */
	primerPaso?: string;
	/** Campo independiente (§7); sin él, la tarea no tiene versión mínima. */
	versionMinima?: string;
	/** Un solo campo (§7), los pasos 2 en adelante; sin él, no hay más pasos. */
	pasos?: string[];
	/** Otro campo, independiente de pasos (§7); sin él, la tarea va en el paso 1. */
	pasoActual?: number;
	/** Sin el campo, la tarea está sin estimar. */
	esfuerzo?: Effort;
	tipo: Task['kind'];
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

/** Traduce campo por campo: el documento guarda desde y hasta, el core from y to. */
const ventanaADoc = ({ from, to }: TimeWindow): VentanaDoc => ({ desde: from, hasta: to });

const ventanaDesdeDoc = ({ desde, hasta }: VentanaDoc): TimeWindow => ({ from: desde, to: hasta });

/** Se escribe siempre como lista; el core lee también el formato anterior (§4.1). */
const copiarHorario = (horario: Schedule): VentanaDoc[] => horario.map(ventanaADoc);

const leerHorarioDoc = (horario: VentanaDoc[] | VentanaDoc) => (Array.isArray(horario) ? horario.map(ventanaDesdeDoc) : ventanaDesdeDoc(horario));

interface EtiquetaDoc {
	nombre: string;
	color: Color;
}

interface CompletadoDoc {
	tareaId: string;
	completadoEn: Timestamp;
	/** Fecha AAAA-MM-DD, o fecha y hora AAAA-MM-DDTHH:MM con horario (§4.4). */
	ocurrenciaCubierta?: string;
	/** Paso en que iba la tarea al completarla; solo en tareas de dos pasos o más (§4.4). */
	pasoAlCompletar?: number;
	/** Solo se escribe en true: sin el campo, el completado fue entero (§4.4). */
	fueMinima?: true;
}

const tareaRef = (uid: string, tareaId: string) => doc(db, 'users', uid, 'tareas', tareaId);
const completadoRef = (uid: string, completadoId: string) => doc(db, 'users', uid, 'completados', completadoId);
const etiquetaRef = (uid: string, etiquetaId: string) => doc(db, 'users', uid, 'etiquetas', etiquetaId);

/** Traduce campo por campo: el documento guarda modo, cada, unidad, diasSemana y diasMes. */
function recurrenciaADoc(recurrence: Recurrence): RecurrenciaDoc {
	if (recurrence.mode === 'relativo') return { modo: 'relativo', cada: recurrence.every, unidad: recurrence.unit };
	if ('weekdays' in recurrence) return { modo: 'calendario', diasSemana: [...recurrence.weekdays] };
	return { modo: 'calendario', diasMes: [...recurrence.monthDays] };
}

function recurrenciaDesdeDoc(recurrencia: RecurrenciaDoc): Recurrence {
	if (recurrencia.modo === 'relativo') return { mode: 'relativo', every: recurrencia.cada, unit: recurrencia.unidad };
	if ('diasSemana' in recurrencia) return { mode: 'calendario', weekdays: [...recurrencia.diasSemana] };
	return { mode: 'calendario', monthDays: [...recurrencia.diasMes] };
}

function tareaADoc(tarea: Task): TareaDoc {
	const creadaEn = Timestamp.fromDate(tarea.createdAt);
	const comunes = {
		titulo: tarea.title,
		...(tarea.emoji !== undefined && { emoji: tarea.emoji }),
		...(tarea.note !== undefined && { nota: tarea.note }),
		...(tarea.firstStep !== undefined && { primerPaso: tarea.firstStep }),
		...(tarea.minimalVersion !== undefined && { versionMinima: tarea.minimalVersion }),
		...(tarea.steps && { pasos: [...tarea.steps] }),
		...(tarea.currentStep !== undefined && { pasoActual: tarea.currentStep }),
		...(tarea.effort && { esfuerzo: tarea.effort }),
		...(tarea.labels && { etiquetas: [...tarea.labels] }),
		...(tarea.schedule && { horario: copiarHorario(tarea.schedule) }),
		creadaEn
	};
	if (tarea.kind === 'periodica') return { ...comunes, tipo: 'periodica', recurrencia: recurrenciaADoc(tarea.recurrence) };
	const documento: TareaDoc = { ...comunes, tipo: 'puntual' };
	if (tarea.dueDate) documento.fechaLimite = isoDay(tarea.dueDate);
	return documento;
}

function tareaDesde(snapshot: QueryDocumentSnapshot<DocumentData>): Task {
	const datos = snapshot.data() as TareaDoc;
	return taskFromDocument({
		id: snapshot.id,
		title: datos.titulo,
		...textFields({ emoji: datos.emoji, note: datos.nota, firstStep: datos.primerPaso, minimalVersion: datos.versionMinima }),
		...(datos.pasos && { steps: [...datos.pasos] }),
		...(datos.pasoActual !== undefined && { currentStep: datos.pasoActual }),
		...(datos.esfuerzo && { effort: datos.esfuerzo }),
		kind: datos.tipo,
		createdAt: datos.creadaEn.toDate(),
		...(datos.fechaLimite && { dueDate: dayFromIso(datos.fechaLimite) }),
		...(datos.recurrencia && { recurrence: recurrenciaDesdeDoc(datos.recurrencia) }),
		...(datos.horario && { schedule: leerHorarioDoc(datos.horario) }),
		...(datos.etiquetas && { labels: [...datos.etiquetas] }),
		...(datos.pausada && { paused: datos.pausada }),
		...(datos.reanudadaEn && { resumedAt: datos.reanudadaEn.toDate() }),
		...(datos.pospuesta && { postponed: { from: datos.pospuesta.desde.toDate(), to: datos.pospuesta.hasta.toDate() } })
	});
}

function etiquetaDesde(snapshot: QueryDocumentSnapshot<DocumentData>): Label {
	const { nombre, color } = snapshot.data() as EtiquetaDoc;
	return { id: snapshot.id, name: nombre, color };
}

/** Los campos del cambio como los escribe updateDoc: null quita el campo. */
function camposDelCambio({ title: titulo, emoji, note: nota, firstStep: primerPaso, minimalVersion: versionMinima, steps: pasos, currentStep: pasoActual, effort: esfuerzo, kind: tipo, dueDate: fechaLimite, recurrence: recurrencia, schedule: horario, labels: etiquetas, paused: pausada, resumedAt: reanudadaEn, postponed: pospuesta }: TaskChange): DocumentData {
	const campos: DocumentData = {};
	if (etiquetas !== undefined) campos.etiquetas = [...etiquetas];
	if (titulo !== undefined) campos.titulo = titulo;
	if (emoji !== undefined) campos.emoji = emoji === null ? deleteField() : emoji;
	if (nota !== undefined) campos.nota = nota === null ? deleteField() : nota;
	if (primerPaso !== undefined) campos.primerPaso = primerPaso === null ? deleteField() : primerPaso;
	if (versionMinima !== undefined) campos.versionMinima = versionMinima === null ? deleteField() : versionMinima;
	// pasos se reemplaza entero y pasoActual es otro campo (§7); null quita el campo.
	if (pasos !== undefined) campos.pasos = pasos === null ? deleteField() : [...pasos];
	if (pasoActual !== undefined) campos.pasoActual = pasoActual === null ? deleteField() : pasoActual;
	if (esfuerzo !== undefined) campos.esfuerzo = esfuerzo === null ? deleteField() : esfuerzo;
	if (tipo !== undefined) campos.tipo = tipo;
	if (fechaLimite !== undefined) campos.fechaLimite = fechaLimite === null ? deleteField() : isoDay(fechaLimite);
	if (recurrencia !== undefined) campos.recurrencia = recurrencia === null ? deleteField() : recurrenciaADoc(recurrencia);
	// update reemplaza el campo entero: las ventanas se escriben juntas (§7).
	if (horario !== undefined) campos.horario = horario === null ? deleteField() : copiarHorario(horario);
	// pausada y reanudadaEn viajan juntos en el mismo update (§7).
	if (pausada !== undefined) campos.pausada = pausada === null ? deleteField() : pausada;
	if (reanudadaEn !== undefined) campos.reanudadaEn = Timestamp.fromDate(reanudadaEn);
	// pospuesta se escribe entera: desde y hasta juntos (§7).
	if (pospuesta !== undefined) {
		campos.pospuesta = pospuesta === null ? deleteField() : { desde: Timestamp.fromDate(pospuesta.from), hasta: Timestamp.fromDate(pospuesta.to) };
	}
	return campos;
}

function completadoADoc(completado: Completion): CompletadoDoc {
	const documento: CompletadoDoc = {
		tareaId: completado.taskId,
		completadoEn: Timestamp.fromDate(completado.completedAt)
	};
	if (completado.coveredOccurrence) documento.ocurrenciaCubierta = occurrenceInText(completado.coveredOccurrence);
	if (completado.stepAtCompletion !== undefined) documento.pasoAlCompletar = completado.stepAtCompletion;
	if (completado.wasMinimal) documento.fueMinima = true;
	return documento;
}

function completadoDesde(snapshot: QueryDocumentSnapshot<DocumentData>): Completion {
	const datos = snapshot.data() as CompletadoDoc;
	const completado: Completion = { id: snapshot.id, taskId: datos.tareaId, completedAt: datos.completadoEn.toDate() };
	if (datos.ocurrenciaCubierta) completado.coveredOccurrence = occurrenceFromText(datos.ocurrenciaCubierta);
	if (datos.pasoAlCompletar !== undefined) completado.stepAtCompletion = datos.pasoAlCompletar;
	if (datos.fueMinima === true) completado.wasMinimal = true;
	return completado;
}

export function observarTareas(uid: string, alCambiar: (tareas: Task[]) => void): Cancelar {
	return onSnapshot(collection(db, 'users', uid, 'tareas'), (consulta) =>
		alCambiar(consulta.docs.map(tareaDesde))
	);
}

export function observarCompletados(uid: string, alCambiar: (completados: Completion[]) => void): Cancelar {
	return onSnapshot(collection(db, 'users', uid, 'completados'), (consulta) =>
		alCambiar(consulta.docs.map(completadoDesde))
	);
}

export function observarEtiquetas(uid: string, alCambiar: (etiquetas: Label[]) => void): Cancelar {
	return onSnapshot(collection(db, 'users', uid, 'etiquetas'), (consulta) => alCambiar(consulta.docs.map(etiquetaDesde)));
}

const etiquetaADoc = ({ name: nombre, color }: Label): EtiquetaDoc => ({ nombre, color });

/** Un lote que empieza creando las etiquetas nuevas de un guardado del panel (§4.3). */
function loteConEtiquetas(uid: string, nuevas: readonly Label[]): WriteBatch {
	const lote = writeBatch(db);
	for (const etiqueta of nuevas) lote.set(etiquetaRef(uid, etiqueta.id), etiquetaADoc(etiqueta));
	return lote;
}

/** Spec §4.3: la tarea nueva y las etiquetas que se crean al guardarla, en un solo writeBatch. */
export async function guardarTarea(uid: string, tarea: Task, nuevas: readonly Label[]): Promise<void> {
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

export async function guardarCompletado(uid: string, completado: Completion): Promise<void> {
	await setDoc(completadoRef(uid, completado.id), completadoADoc(completado));
}

/**
 * Spec §7: escribe solo los campos que cambiaron, junto con las etiquetas que
 * se crean al guardar, en un solo writeBatch. update reemplaza cada campo
 * entero (la recurrencia y las etiquetas no se mezclan, como haría set con
 * merge) y falla si la tarea ya no existe: gana el borrado, la edición se
 * descarta y no se crea ninguna etiqueta.
 */
export async function guardarCambio(uid: string, tareaId: string, cambio: TaskChange, nuevas: readonly Label[]): Promise<void> {
	const campos = camposDelCambio(cambio);
	if (Object.keys(campos).length === 0) return;
	const lote = loteConEtiquetas(uid, nuevas);
	lote.update(tareaRef(uid, tareaId), campos);
	await salvoBorrado(lote.commit());
}

/** Spec §7: nombre y color son campos independientes; un cambio de una etiqueta borrada no la revive. */
export async function cambiarEtiqueta(uid: string, etiquetaId: string, cambio: LabelChange): Promise<void> {
	await salvoBorrado(updateDoc(etiquetaRef(uid, etiquetaId), { ...('name' in cambio && { nombre: cambio.name }), ...('color' in cambio && { color: cambio.color }) }));
}

/**
 * Traduce un CambioDeReferencias del core (§4.3, §7): arrayRemove y
 * arrayUnion tocan solo los ids nombrados, sin reemplazar el campo. Los dos en
 * un writeBatch, en el orden del core; una tarea que ya no existe se saltea.
 */
async function cambiarReferencias(uid: string, { taskId: tareaId, remove: quitar, put: poner }: ReferencesChange): Promise<void> {
	const lote = writeBatch(db);
	if (quitar.length > 0) lote.update(tareaRef(uid, tareaId), { etiquetas: arrayRemove(...quitar) });
	if (poner.length > 0) lote.update(tareaRef(uid, tareaId), { etiquetas: arrayUnion(...poner) });
	await salvoBorrado(lote.commit());
}

/** Spec §4.3: borra la etiqueta y la quita de las tareas que la tienen. */
export async function borrarEtiqueta(uid: string, { labelId: etiquetaId, references: referencias }: LabelDeletion): Promise<void> {
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
export async function limpiarReferencias(uid: string, rotas: readonly ReferencesChange[]): Promise<string[]> {
	const fallaron: string[] = [];
	for (const cambio of rotas) {
		try {
			const borradas = await Promise.all(cambio.remove.map((id) => borradaEnElServidor(uid, id)));
			const quitar = cambio.remove.filter((_, indice) => borradas[indice]);
			if (quitar.length > 0) await cambiarReferencias(uid, { ...cambio, remove: quitar });
		} catch (error) {
			if (!(error instanceof FirestoreError)) throw error;
			fallaron.push(cambio.taskId);
		}
	}
	return fallaron;
}

/**
 * Spec §7 (Etiquetas duplicadas): primero las tareas pasan a la sobreviviente,
 * después se borran las otras. Cada una se intenta por separado; una etiqueta
 * cuyas tareas no pasaron no se borra. Devuelve los ids de las que fallaron.
 */
export async function fusionarEtiquetas(uid: string, { deletedItems: borradas, references: referencias }: LabelMerge): Promise<string[]> {
	const sinPasar = new Set<string>();
	for (const cambio of referencias) {
		try {
			await cambiarReferencias(uid, cambio);
		} catch {
			cambio.remove.forEach((id) => sinPasar.add(id));
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
export async function borrarTarea(uid: string, { taskId: tareaId, completionIds: completadoIds, annotationIds: anotacionIds }: Deletion): Promise<void> {
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
export async function limpiarHuerfanos(uid: string, huerfanos: readonly Completion[]): Promise<string[]> {
	const fallaron: string[] = [];
	for (const completado of huerfanos) {
		try {
			const tarea = await getDocFromServer(tareaRef(uid, completado.taskId));
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
