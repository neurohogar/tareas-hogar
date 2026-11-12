// Spec §5.8, §5.9 y §6.2: las acciones que el panel ofrece sobre una tarea
// (Pausar, Reanudar, Posponer, Quitar posponer), qué hace tocarlas y qué escriben.
import { pausar, reanudar } from './pausa';
import { posponer, quitarPosponer, type OpcionDePosponer } from './posposicion';
import type { CambioDeTarea } from './documento-de-tarea';

/** Spec §6.2: las acciones con aviso, con la opción tocada al posponer; así se nombran en sus botones. */
export type AccionDelPanel = 'pausar' | 'reanudar' | `posponer ${OpcionDePosponer}` | 'quitar posponer';

/** Spec §6.2: la acción de posponer con la opción tocada. */
export function accionDeLaOpcion(opcion: OpcionDePosponer): AccionDelPanel {
	return `posponer ${opcion}`;
}

export type EfectoDeLaAccion = 'actúa' | 'abre el aviso de acción' | 'pide confirmar el borrado';

/** Spec §6.2: con cambios la acción abre su aviso y sin cambios actúa; Borrar tarea solo pide su confirmación. */
export function queHaceLaAccion(accion: AccionDelPanel | 'borrar tarea', hayCambios: boolean): EfectoDeLaAccion {
	if (accion === 'borrar tarea') return 'pide confirmar el borrado';
	return hayCambios ? 'abre el aviso de acción' : 'actúa';
}

const COMANDOS: Readonly<Record<AccionDelPanel, (ahora: Date) => CambioDeTarea>> = {
	pausar: () => pausar(),
	reanudar: (ahora) => reanudar(ahora),
	'posponer 1 hora': (ahora) => posponer('1 hora', ahora),
	'posponer 3 horas': (ahora) => posponer('3 horas', ahora),
	'posponer hasta mañana': (ahora) => posponer('hasta mañana', ahora),
	'quitar posponer': () => quitarPosponer()
};

/** Spec §5.8, §5.9 y §6.2: lo que escribe la acción; `ahora` es el momento de tocar el botón. */
export function cambioDeAccion(accion: AccionDelPanel, ahora: Date): CambioDeTarea {
	return COMANDOS[accion](ahora);
}
