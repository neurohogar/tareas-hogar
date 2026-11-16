// Spec §4.1, §6.1 y §6.2: el esfuerzo estimado de una tarea; sin el campo, sin estimar.
import type { Effort } from './task';

const TEXTS: Record<Effort, string> = { rapida: 'Rápida', media: 'Media', larga: 'Larga' };

/** Spec §4.1: el campo esfuerzo solo si la tarea lo tiene; sin esfuerzo, sin el campo. */
export const effortFields = (effort: Effort | undefined): { effort?: Effort } => (effort ? { effort } : {});

/** Spec §6.1: el nivel en texto chico de la fila; sin esfuerzo, nada. */
export const effortText = (effort: Effort | undefined): string | undefined => (effort ? TEXTS[effort] : undefined);

/** Spec §6.2: las opciones del selector, en orden; "Sin estimar" (el valor inicial) es sin el campo. */
export const EFFORT_OPTIONS: readonly { value: Effort | undefined; text: string }[] = [
	{ value: undefined, text: 'Sin estimar' },
	{ value: 'rapida', text: 'Rápida (≤ 5 min)' },
	{ value: 'media', text: 'Media (≈ 15 min)' },
	{ value: 'larga', text: 'Larga' }
];
