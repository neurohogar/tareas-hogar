// Spec §6.2 (Atrás): qué hace Atrás con el panel abierto.
import { alCerrarElPanel, type EfectoDeCerrar } from './cambios-sin-guardar-aviso';

/** Lo que puede estar abierto sobre el panel; las sugerencias y el aviso de deshacer no cuentan. */
export type LoDeArriba = 'nada' | 'aviso de cierre' | 'aviso de acción' | 'confirmación de Borrar tarea' | 'selector de emoji' | 'sugerencias de Etiquetas' | 'aviso de deshacer';

export type EfectoDeAtras = 'cierra el teclado' | 'cierra lo de arriba' | EfectoDeCerrar;

const QUE_NO_CUENTA: readonly LoDeArriba[] = ['nada', 'sugerencias de Etiquetas', 'aviso de deshacer'];

export interface PanelAlTocarAtras {
	encima: LoDeArriba;
	hayCambios: boolean;
	tecladoAbierto: boolean;
}

/**
 * Spec §6.2: con el teclado abierto lo cierra el sistema y lo demás sigue igual;
 * si no, cierra solo lo de arriba; con el panel solo, es como cerrarlo.
 */
export function queHaceAtras({ encima, hayCambios, tecladoAbierto }: PanelAlTocarAtras): EfectoDeAtras {
	if (tecladoAbierto) return 'cierra el teclado';
	return QUE_NO_CUENTA.includes(encima) ? alCerrarElPanel(hayCambios) : 'cierra lo de arriba';
}
