// Spec §4.5 (Anotación) y §5.10 (Anotar): qué guarda una anotación, cómo se
// toma su contexto y cómo se corrige su texto (§6.7).
import { avisoVisible, type Aviso } from './aviso';

export type Sentido = 'Me sirvió' | 'Me molestó';

/** Las pantallas donde puede estar la persona con el panel cerrado. */
export type PantallaActual = 'Pendientes' | 'Historial' | 'Etiquetas' | 'Anotaciones';

export type PantallaDeAnotacion = PantallaActual | 'Panel de edición';

export interface Anotacion {
	id: string;
	sentido: Sentido;
	anotadaEn: Date;
	pantalla: PantallaDeAnotacion;
	/** La tarea, si la hay; no se copia su nombre. */
	tareaId?: string;
	/** Una línea recortada; sin texto, el campo no está. */
	texto?: string;
}

/** Dónde está la persona al tocar un sentido. */
export interface ContextoAlAnotar {
	pantalla: PantallaActual;
	/** El panel de edición, si está abierto: con tareaId al editar, sin tareaId al crear. */
	panel?: { tareaId?: string };
	/** El aviso de deshacer del dispositivo, se vea o no. */
	aviso?: Aviso;
}

/**
 * Spec §4.5: una sola línea (sin saltos de línea, como un campo de una línea),
 * sin largo máximo y recortada; vacío o solo espacios es sin texto (undefined).
 */
export function normalizarTextoDeAnotacion(texto: string): string | undefined {
	return texto.replace(/[\r\n]/g, '').trim() || undefined;
}

/** Spec §4.5: el texto va solo si lo hay. */
function conTexto(sinTexto: Omit<Anotacion, 'texto'>, texto: string): Anotacion {
	const normalizado = normalizarTextoDeAnotacion(texto);
	return normalizado === undefined ? sinTexto : { ...sinTexto, texto: normalizado };
}

/**
 * Spec §5.10: con el panel abierto manda el panel (su tarea al editar, ninguna
 * al crear); si no, la tarea del aviso de deshacer si se ve; si no, ninguna.
 */
function tareaDelContexto({ panel, aviso }: ContextoAlAnotar, ahora: Date): string | undefined {
	if (panel) return panel.tareaId;
	return avisoVisible(aviso, ahora)?.completado.tareaId;
}

/**
 * Spec §5.10: la anotación del segundo toque, con el contexto tomado solo: la
 * pantalla es el Panel de edición si el panel está abierto, y si no la actual.
 */
export function anotar(id: string, sentido: Sentido, ahora: Date, contexto: ContextoAlAnotar, texto = ''): Anotacion {
	const pantalla = contexto.panel ? 'Panel de edición' : contexto.pantalla;
	const tareaId = tareaDelContexto(contexto, ahora);
	const sinTexto: Omit<Anotacion, 'texto'> = { id, sentido, anotadaEn: ahora, pantalla, ...(tareaId === undefined ? {} : { tareaId }) };
	return conTexto(sinTexto, texto);
}

/**
 * Spec §6.7 y §7: Editar texto cambia solo el texto de esa anotación (vaciarlo
 * la deja sin texto); si ya no está (se borró), no la revive.
 */
export function editarTexto(anotaciones: readonly Anotacion[], anotacionId: string, texto: string): Anotacion[] {
	return anotaciones.map((anotacion) => {
		if (anotacion.id !== anotacionId) return anotacion;
		const { texto: _anterior, ...sinTexto } = anotacion;
		return conTexto(sinTexto, texto);
	});
}
