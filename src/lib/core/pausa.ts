// Spec §5.8 (Pausar): solo las periódicas se pueden pausar. Una pausada no
// tiene estado; al reanudarla, se evalúa como recién creada en reanudadaEn.
import type { CambioDeTarea } from './documento-de-tarea';
import type { Completado, Tarea } from './tarea';

/** Spec §5.8: solo una periódica puede estar pausada. */
export function estaPausada(tarea: Tarea): boolean {
	return tarea.tipo === 'periodica' && tarea.pausada === true;
}

/** Spec §6.2: el botón de pausa al editar una periódica; una puntual no tiene. */
export function accionDePausa(tarea: Tarea): 'pausar' | 'reanudar' | undefined {
	if (tarea.tipo === 'puntual') return undefined;
	return estaPausada(tarea) ? 'reanudar' : 'pausar';
}

/** Spec §5.8 y §7: pausar escribe pausada. */
export function pausar(): CambioDeTarea {
	return { pausada: true };
}

/** Spec §5.8 y §7: reanudar quita pausada y guarda reanudadaEn = ahora, en un solo cambio. */
export function reanudar(ahora: Date): CambioDeTarea {
	return { pausada: null, reanudadaEn: ahora };
}

/**
 * Spec §5.8: una periódica reanudada se evalúa como recién creada en
 * reanudadaEn: con creadaEn = reanudadaEn y sin los completados (de la tarea)
 * con completadoEn anterior a reanudadaEn. Las demás, tal cual.
 */
export function comoRecienCreada(tarea: Tarea, propios: readonly Completado[]): { tarea: Tarea; propios: Completado[] } {
	if (tarea.tipo === 'puntual' || !tarea.reanudadaEn) return { tarea, propios: [...propios] };
	const desde = tarea.reanudadaEn.getTime();
	return {
		tarea: { ...tarea, creadaEn: tarea.reanudadaEn },
		propios: propios.filter(({ completadoEn }) => completadoEn.getTime() >= desde)
	};
}
