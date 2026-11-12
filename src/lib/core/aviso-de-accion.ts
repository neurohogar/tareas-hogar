// Spec §6.2 (Aviso de acción): qué ofrece el aviso de Pausar, Reanudar, Posponer
// y Quitar posponer con cambios sin guardar, y qué ejecuta cada botón.
// El aviso se evalúa con la tarea y el ahora del momento: el core no lee el reloj.
// Las acciones mismas viven en accion-del-panel.ts.
import { cambioDeAccion, type AccionDelPanel } from './accion-del-panel';
import type { FormularioDelPanel } from './cambios-sin-guardar';
import { MENSAJE_DE_CAMBIOS, SEGUIR_EDITANDO, type AvisoDeCambios, type BotonDelAviso } from './cambios-sin-guardar-aviso';
import { editarDesdePanel } from './cambios-sin-guardar-guardado';
import type { ErroresDeCreacion } from './creacion';
import { aplicarCambio, tareaDesdeDocumento, type CambioDeTarea } from './documento-de-tarea';
import type { Etiqueta } from './etiqueta';
import type { EdicionConEtiquetas } from './guardar-con-etiquetas';
import { accionDePausa } from './pausa';
import { accionDePosponer } from './posposicion-en-panel';
import type { Completado, Tarea } from './tarea';

/** Lo que hace falta para evaluar el aviso de una acción. */
export interface AccionEnAviso {
	accion: AccionDelPanel;
	/** La tarea con que se abrió el panel: contra ella se mide lo escrito (§7). */
	tareaAlAbrir: Tarea;
	/** La tarea de ahora, con lo que escribió otro dispositivo. */
	tarea: Tarea;
	completados: readonly Completado[];
	ahora: Date;
	formulario: FormularioDelPanel;
	/** Las etiquetas que existen ahora. */
	existentes: readonly Etiqueta[];
}

type CondicionesDeLaAccion = Pick<AccionEnAviso, 'accion' | 'completados' | 'ahora'>;

/** Spec §5.8, §5.9 y §6.2: la tarea cumple las condiciones con que el panel muestra la acción. */
function seMuestra({ accion, completados, ahora }: CondicionesDeLaAccion, tarea: Tarea): boolean {
	if (accion === 'pausar' || accion === 'reanudar') return accionDePausa(tarea) === accion;
	return accionDePosponer(tarea, completados, ahora) === (accion === 'quitar posponer' ? 'quitar' : 'posponer');
}

/** Lo que haría Guardar con lo escrito, medido contra la tarea al abrir. */
function guardarLoEscrito({ tareaAlAbrir, formulario, existentes, ahora }: AccionEnAviso, nuevoId: () => string): EdicionConEtiquetas {
	return editarDesdePanel(tareaAlAbrir, formulario, { existentes, nuevoId }, ahora);
}

/** La tarea de ahora con el cambio, como la aplicaría el servidor (§7). */
function tareaGuardada(tarea: Tarea, cambio: CambioDeTarea): Tarea {
	return tareaDesdeDocumento(aplicarCambio([tarea], tarea.id, cambio)[0]);
}

/** Evaluar el aviso no crea etiquetas: el id nunca se usa. */
const idNoUsado = () => '';

const descartar = (accion: AccionDelPanel): BotonDelAviso => ({ texto: `Descartar y ${accion}`, efecto: 'descartar' });

/**
 * Spec §6.2: el aviso con la tarea y el ahora de este momento. Si la acción ya
 * no corresponde, ninguno: se cierra y queda el panel con lo escrito. Si lo
 * guardado la deja sin sentido, lo dice y no ofrece Guardar; si lo escrito es
 * inválido no hay cómo evaluarlo, y lo ofrece.
 */
export function avisoDeAccion(contexto: AccionEnAviso): AvisoDeCambios | undefined {
	const { accion, tarea } = contexto;
	if (!seMuestra(contexto, tarea)) return undefined;
	const edicion = guardarLoEscrito(contexto, idNoUsado);
	if (edicion.ok && !seMuestra(contexto, tareaGuardada(tarea, edicion.cambio)))
		return { mensaje: `Con estos cambios la tarea ya no se puede ${accion}`, botones: [SEGUIR_EDITANDO, descartar(accion)] };
	return { mensaje: MENSAJE_DE_CAMBIOS, botones: [SEGUIR_EDITANDO, descartar(accion), { texto: `Guardar y ${accion}`, efecto: 'guardar' }] };
}

/** Spec §6.2: Descartar y <acción> actúa sobre la tarea como está guardada; si la acción ya no corresponde, no actúa. */
export function descartarYActuar(contexto: AccionEnAviso): CambioDeTarea | undefined {
	return seMuestra(contexto, contexto.tarea) ? cambioDeAccion(contexto.accion, contexto.ahora) : undefined;
}

export type ResultadoDeGuardarYActuar =
	| { resultado: 'guardado'; cambio: CambioDeTarea; nuevas: Etiqueta[] }
	| { resultado: 'rechazado'; errores: ErroresDeCreacion }
	| { resultado: 'aviso actualizado'; aviso: AvisoDeCambios }
	| { resultado: 'aviso cerrado' };

/**
 * Spec §6.2: Guardar y <acción> se vuelve a evaluar al tocarlo: si ya no
 * corresponde, no se guarda ni se actúa. Si Guardar falla, no se ejecuta nada.
 * Si no, guarda y actúa en un solo cambio.
 */
export function guardarYActuar(contexto: AccionEnAviso, nuevoId: () => string): ResultadoDeGuardarYActuar {
	const aviso = avisoDeAccion(contexto);
	if (!aviso) return { resultado: 'aviso cerrado' };
	if (!aviso.botones.some(({ efecto }) => efecto === 'guardar')) return { resultado: 'aviso actualizado', aviso };
	const edicion = guardarLoEscrito(contexto, nuevoId);
	if (!edicion.ok) return { resultado: 'rechazado', errores: edicion.errores };
	return { resultado: 'guardado', cambio: { ...edicion.cambio, ...cambioDeAccion(contexto.accion, contexto.ahora) }, nuevas: edicion.nuevas };
}
