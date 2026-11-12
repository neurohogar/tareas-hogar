// Spec §4.1, §6.1 y §6.2: el esfuerzo estimado de una tarea; sin el campo, sin estimar.
import type { Esfuerzo } from './tarea';

const TEXTOS: Record<Esfuerzo, string> = { rapida: 'Rápida', media: 'Media', larga: 'Larga' };

/** Spec §4.1: el campo esfuerzo solo si la tarea lo tiene; sin esfuerzo, sin el campo. */
export const camposDeEsfuerzo = (esfuerzo: Esfuerzo | undefined): { esfuerzo?: Esfuerzo } => (esfuerzo ? { esfuerzo } : {});

/** Spec §6.1: el nivel en texto chico de la fila; sin esfuerzo, nada. */
export const textoDeEsfuerzo = (esfuerzo: Esfuerzo | undefined): string | undefined => (esfuerzo ? TEXTOS[esfuerzo] : undefined);

/** Spec §6.2: las opciones del selector, en orden; "Sin estimar" (el valor inicial) es sin el campo. */
export const OPCIONES_DE_ESFUERZO: readonly { valor: Esfuerzo | undefined; texto: string }[] = [
	{ valor: undefined, texto: 'Sin estimar' },
	{ valor: 'rapida', texto: 'Rápida (≤ 5 min)' },
	{ valor: 'media', texto: 'Media (≈ 15 min)' },
	{ valor: 'larga', texto: 'Larga' }
];
