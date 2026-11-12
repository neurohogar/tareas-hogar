// Spec §5.9 (Posponer): los comandos de posponer y quitar posponer, y sus opciones.
// Qué queda vigente y cómo cambia el estado lo decide posposicion-vigente.ts.
import { enElMinuto, sumarDias } from './dias';
import type { CambioDeTarea } from './documento-de-tarea';

export type OpcionDePosponer = '1 hora' | '3 horas' | 'hasta mañana';

/** Spec §5.9: las opciones de Posponer, con su texto en el panel. */
export const OPCIONES_DE_POSPONER: readonly { opcion: OpcionDePosponer; etiqueta: string }[] = [
	{ opcion: '1 hora', etiqueta: '1 hora' },
	{ opcion: '3 horas', etiqueta: '3 horas' },
	{ opcion: 'hasta mañana', etiqueta: 'Hasta mañana' }
];

const MS_POR_HORA = 60 * 60 * 1000;
const LAS_SIETE = 7 * 60;

const enHoras = (ahora: Date, horas: number) => new Date(ahora.getTime() + horas * MS_POR_HORA);

function hastaSegunOpcion(opcion: OpcionDePosponer, ahora: Date): Date {
	if (opcion === '1 hora') return enHoras(ahora, 1);
	if (opcion === '3 horas') return enHoras(ahora, 3);
	return enElMinuto(sumarDias(ahora, 1), LAS_SIETE);
}

/** Spec §5.9 y §7: guarda pospuesta = { desde: ahora, hasta }, como un solo campo. */
export function posponer(opcion: OpcionDePosponer, ahora: Date): CambioDeTarea {
	return { pospuesta: { desde: ahora, hasta: hastaSegunOpcion(opcion, ahora) } };
}

/** Spec §5.9: Quitar posponer borra pospuesta. */
export function quitarPosponer(): CambioDeTarea {
	return { pospuesta: null };
}
