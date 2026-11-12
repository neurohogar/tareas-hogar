// Spec §6.2 (Aviso de cierre): qué hace cerrar el panel y qué ofrece su aviso.

/** Spec §6.2: el nombre del aviso, de cierre o de acción. */
export const MENSAJE_DE_CAMBIOS = 'Tenés cambios sin guardar';

export interface BotonDelAviso {
	texto: string;
	efecto: 'seguir editando' | 'descartar' | 'guardar';
}

export interface AvisoDeCambios {
	mensaje: string;
	botones: readonly BotonDelAviso[];
}

/** Spec §6.2: el botón que cierra el aviso y deja el panel como estaba. */
export const SEGUIR_EDITANDO: BotonDelAviso = { texto: 'Seguir editando', efecto: 'seguir editando' };

/** Spec §6.2: el aviso de cierre, con sus tres botones en orden. */
export const AVISO_DE_CIERRE: AvisoDeCambios = {
	mensaje: MENSAJE_DE_CAMBIOS,
	botones: [SEGUIR_EDITANDO, { texto: 'Descartar', efecto: 'descartar' }, { texto: 'Guardar', efecto: 'guardar' }]
};

export type EfectoDeCerrar = 'cierra el panel' | 'abre el aviso de cierre';

/** Spec §6.2: cerrar con cambios pide confirmación; sin cambios cierra directo. */
export function alCerrarElPanel(hayCambios: boolean): EfectoDeCerrar {
	return hayCambios ? 'abre el aviso de cierre' : 'cierra el panel';
}
