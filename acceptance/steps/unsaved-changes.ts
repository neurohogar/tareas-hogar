// Cambios sin guardar y Atrás (spec §6.2, §7): lo que hay escrito en el panel, los avisos que abre
// cerrarlo o usar una acción, y qué cierra Atrás. El panel es el de world.panel; lo que escribe y lo
// que tiene encima, world.panel.cambios. Con el panel cerrado, world.panel no existe.
import { expect } from 'vitest';
import { whatBackDoes, type OnTop } from '../../src/lib/core/panel-back';
import { optionAction, changeOfAction, whatTheActionDoes, type PanelAction } from '../../src/lib/core/panel-action';
import { actionNotice, discardAndAct, saveAndAct, type NoticeAction } from '../../src/lib/core/action-notice';
import { CLOSE_NOTICE, onClosePanel, type ChangesNotice, type NoticeButton } from '../../src/lib/core/unsaved-changes-notice';
import { createFromPanel, editFromPanel } from '../../src/lib/core/unsaved-changes-saved';
import { hasChanges, type PanelForm } from '../../src/lib/core/unsaved-changes';
import type { CommonData } from '../../src/lib/core/creation';
import { createOneOff } from '../../src/lib/core/create-one-off';
import { DATA_ON_CREATE, type TaskData } from '../../src/lib/core/task-data';
import { applyChange, type TaskChange } from '../../src/lib/core/task-document';
import type { TypedSchedule } from '../../src/lib/core/schedule';
import { POSTPONE_OPTIONS } from '../../src/lib/core/postponement';
import type { Task } from '../../src/lib/core/task';
import { AHORA, ANTES_DEL_ESCENARIO, registrarCreacion } from './create';
import { P, fechaHora, lista } from './values';
import {
	cambiosAlCrear,
	cambiosAlEditar,
	laTarea,
	nuevoId,
	recordarAntesDeMiCambio,
	tareasDe,
	type CambiosDelPanel,
	type StepDefinition,
	type World
} from './world';

const elMomento = ({ now: ahora }: CambiosDelPanel) => ahora ?? AHORA;

/** Un valor malformado falla el escenario: nada se interpreta por parecido. */
function deLaTabla<T>(tabla: Record<string, T>, valor: string, que: string): T {
	if (!Object.hasOwn(tabla, valor)) throw new Error(`${que} inválido: "${valor}"`);
	return tabla[valor];
}

function abroParaEditar(world: World, datos: CommonData): void {
	registrarCreacion(world, (id) => createOneOff(datos, id, ANTES_DEL_ESCENARIO));
	expect(world.errors).toBeUndefined();
	const tarea = laTarea(world);
	world.panel = { pausa: undefined, cambios: cambiosAlEditar(tarea) };
}

/** La ventana "HH:MM-HH:MM" de un paso. */
function ventana(valor: string): TypedSchedule[number] {
	const partes = /^(\d{2}:\d{2})-(\d{2}:\d{2})$/.exec(valor);
	if (!partes) throw new Error(`Ventana inválida: "${valor}"`);
	return { from: partes[1], to: partes[2] };
}

function contextoDeLaAccion(world: World, cambios: CambiosDelPanel, tareaAlAbrir: Task, accion: PanelAction): NoticeAction {
	const tarea = tareasDe(world).find(({ id }) => id === tareaAlAbrir.id);
	if (!tarea) throw new Error('La tarea del panel ya no existe');
	return { action: accion, taskOnOpen: tareaAlAbrir, task: tarea, completions: world.completions, now: elMomento(cambios), form: cambios.form };
}

/** Lo que hizo otro dispositivo o el paso del tiempo mientras el panel estaba abierto (§6.2, §7). */
function panelAlDia(world: World): CambiosDelPanel | undefined {
	const cambios = world.panel?.cambios;
	if (!cambios) return undefined;
	const { taskOnOpen: tareaAlAbrir, action: accion } = cambios;
	if (tareaAlAbrir && !tareasDe(world).some(({ id }) => id === tareaAlAbrir.id)) {
		world.panel = undefined;
		return undefined;
	}
	if (cambios.top === 'aviso de acción' && tareaAlAbrir && accion && !actionNotice(contextoDeLaAccion(world, cambios, tareaAlAbrir, accion))) cierroLoDeArriba(cambios);
	return cambios;
}

function elPanelAbierto(world: World): CambiosDelPanel {
	const cambios = panelAlDia(world);
	if (!cambios) throw new Error('El panel no está abierto');
	return cambios;
}

function cierroLoDeArriba(cambios: CambiosDelPanel): void {
	cambios.top = 'nada';
	cambios.action = undefined;
}

const conCambios = ({ alAbrir, form: formulario }: CambiosDelPanel) => hasChanges(alAbrir, formulario);

const NOMBRES_DE_ENCIMA: Record<string, OnTop> = {
	nada: 'nada',
	'el aviso de cierre': 'aviso de cierre',
	'el aviso de acción': 'aviso de acción',
	'la confirmación de Borrar tarea': 'confirmación de Borrar tarea',
	'el selector de emoji': 'selector de emoji'
};

const LO_ABIERTO: Partial<Record<OnTop, string>> = {
	'aviso de cierre': 'el panel con el aviso de cierre',
	'aviso de acción': 'el panel con el aviso de acción',
	'confirmación de Borrar tarea': 'el panel con la confirmación de Borrar tarea',
	'selector de emoji': 'el panel con el selector de emoji'
};

// ---- Lo que se escribe ----

const CAMPOS: Record<string, { lee: (f: PanelForm) => string | undefined; escribe: (f: PanelForm, valor: string) => PanelForm }> = {
	Título: { lee: (f) => f.data.title, escribe: (f, titulo) => ({ ...f, data: { ...f.data, title: titulo } }) },
	Nota: { lee: (f) => f.data.note, escribe: (f, nota) => ({ ...f, data: { ...f.data, note: nota } }) },
	'Primer paso': { lee: (f) => f.data.firstStep, escribe: (f, primerPaso) => ({ ...f, data: { ...f.data, firstStep: primerPaso } }) },
	'Versión mínima': { lee: (f) => f.data.minimalVersion, escribe: (f, versionMinima) => ({ ...f, data: { ...f.data, minimalVersion: versionMinima } }) }
};

/** Los pasos más del panel: el campo «Paso N» (N ≥ 2) es el lugar N - 2 de `pasos` (§6.2). */
const LUGAR_DE_PASO = /^Paso (\d+)$/;

function lugarDelPaso(formulario: PanelForm, campo: string): number {
	const lugar = Number(LUGAR_DE_PASO.exec(campo)?.[1]) - 2;
	if (!(lugar >= 0 && lugar < (formulario.data.steps ?? []).length)) throw new Error(`Campo inválido: "${campo}"`);
	return lugar;
}

function campoDe(campo: string): (typeof CAMPOS)[string] {
	if (!LUGAR_DE_PASO.test(campo)) return deLaTabla(CAMPOS, campo, 'Campo');
	const conPasos = (f: PanelForm, pasos: string[]): PanelForm => ({ ...f, data: { ...f.data, steps: pasos } });
	return {
		lee: (f) => f.data.steps?.[lugarDelPaso(f, campo)],
		escribe: (f, valor) => conPasos(f, (f.data.steps ?? []).map((paso, lugar) => (lugar === lugarDelPaso(f, campo) ? valor : paso)))
	};
}

function escribo(world: World, campo: string, valor: string): void {
	const cambios = elPanelAbierto(world);
	cambios.form = campoDe(campo).escribe(cambios.form, valor);
}

/** «Agregar paso» suma un campo vacío al final; «Quitar» saca el del campo (§6.2). */
function cambioLosPasos(world: World, cambiar: (pasos: readonly string[], formulario: PanelForm) => string[]): void {
	const cambios = elPanelAbierto(world);
	const { form: formulario } = cambios;
	cambios.form = { ...formulario, data: { ...formulario.data, steps: cambiar(formulario.data.steps ?? [], formulario) } };
}

const comunesDe = ({ title: titulo, emoji, note: nota, firstStep: primerPaso, steps: pasos, minimalVersion: versionMinima, schedule: horario }: TaskData): CommonData => ({ title: titulo, emoji, note: nota, firstStep: primerPaso, steps: pasos, minimalVersion: versionMinima, schedule: horario });

/** Los campos de cada opción de "Se repite": los de la tarea si es de esa forma; si no, como al crear (§6.2). */
const SE_REPITE: Record<string, { shape: TaskData['shape']; vacios: Partial<TaskData> }> = {
	'No se repite': { shape: 'puntual', vacios: {} },
	Intervalo: { shape: 'relativa', vacios: { every: Number.NaN, unit: 'horas' } }
};

const SELECTORES: Record<string, (cambios: CambiosDelPanel, valor: string) => TaskData> = {
	'Se repite': ({ alAbrir, form: formulario }, valor) => {
		const { shape: forma, vacios } = deLaTabla(SE_REPITE, valor, 'Opción de Se repite');
		const base = alAbrir.data.shape === forma ? alAbrir.data : { shape: forma, ...vacios };
		return { ...base, ...comunesDe(formulario.data) } as TaskData;
	}
};

function cambioElHorario(world: World, horario: TypedSchedule): void {
	const cambios = elPanelAbierto(world);
	cambios.form = { ...cambios.form, data: { ...cambios.form.data, schedule: horario } };
}

// ---- Los avisos ----

const ACCIONES_FIJAS: Record<string, PanelAction | 'borrar tarea'> = { Pausar: 'pausar', Reanudar: 'reanudar', 'Quitar posponer': 'quitar posponer', 'Borrar tarea': 'borrar tarea' };

function accionDe(texto: string): PanelAction | 'borrar tarea' {
	const opcion = POSTPONE_OPTIONS.find(({ option: opcion }) => texto === `Posponer ${opcion}`);
	return opcion ? optionAction(opcion.option) : deLaTabla(ACCIONES_FIJAS, texto, 'Acción');
}

function elAviso(world: World, cambios: CambiosDelPanel): ChangesNotice {
	if (cambios.top === 'aviso de cierre') return CLOSE_NOTICE;
	const { taskOnOpen: tareaAlAbrir, action: accion } = cambios;
	const aviso = cambios.top === 'aviso de acción' && tareaAlAbrir && accion && actionNotice(contextoDeLaAccion(world, cambios, tareaAlAbrir, accion));
	if (!aviso) throw new Error('No hay un aviso abierto');
	return aviso;
}

function cierroElPanel(world: World): void {
	world.panel = undefined;
}

function actuo(world: World, tarea: Task, cambio: TaskChange): void {
	recordarAntesDeMiCambio(world);
	world.documentos = applyChange(world.documentos, tarea.id, cambio);
	cierroElPanel(world);
}

/** Elegir la acción: el panel, con la tarea de ahora, tiene que ofrecerla (§6.2). */
function elijoLaAccion(world: World, texto: string, momento: string): void {
	const cambios = elPanelAbierto(world);
	cambios.now = fechaHora(momento);
	const accion = accionDe(texto);
	const tarea = cambios.taskOnOpen;
	if (!tarea) throw new Error('Las acciones son solo al editar');
	const efecto = whatTheActionDoes(accion, conCambios(cambios));
	if (accion === 'borrar tarea' || efecto === 'pide confirmar el borrado') {
		cambios.top = 'confirmación de Borrar tarea';
		return;
	}
	const contexto = contextoDeLaAccion(world, cambios, tarea, accion);
	if (efecto === 'abre el aviso de acción') {
		expect(actionNotice(contexto)).toBeDefined();
		cambios.top = 'aviso de acción';
		cambios.action = accion;
	} else {
		expect(discardAndAct(contexto)).toBeDefined();
		actuo(world, contexto.task, changeOfAction(accion, contexto.now));
	}
}

/** Si Guardar falla (§6.2): no se ejecuta nada, el aviso se cierra y el panel sigue con lo escrito. */
function fallaGuardar(world: World, cambios: CambiosDelPanel, errores: World['errors']): void {
	world.errors = errores;
	cierroLoDeArriba(cambios);
}

function guardoDesdeElCierre(world: World, cambios: CambiosDelPanel): void {
	const { taskOnOpen: tareaAlAbrir, form: formulario } = cambios;
	const actual = tareaAlAbrir && tareasDe(world).find(({ id }) => id === tareaAlAbrir.id);
	if (actual) {
		const edicion = editFromPanel(actual, formulario, elMomento(cambios));
		if (!edicion.ok) return fallaGuardar(world, cambios, edicion.errors);
		return actuo(world, actual, edicion.change);
	}
	const creacion = createFromPanel(formulario, nuevoId(world, 'tarea'), elMomento(cambios));
	if (!creacion.ok) return fallaGuardar(world, cambios, creacion.errors);
	world.documentos = [...world.documentos, creacion.task];
	cierroElPanel(world);
}

function guardoYActuo(world: World, cambios: CambiosDelPanel, contexto: NoticeAction): void {
	const resultado = saveAndAct(contexto);
	if (resultado.result === 'rechazado') return fallaGuardar(world, cambios, resultado.errors);
	if (resultado.result === 'aviso cerrado') return cierroLoDeArriba(cambios);
	if (resultado.result === 'aviso actualizado') return;
	actuo(world, contexto.task, resultado.change);
}

function descartoYActuo(world: World, cambios: CambiosDelPanel, contexto: NoticeAction): void {
	const cambio = discardAndAct(contexto);
	if (cambio) actuo(world, contexto.task, cambio);
	else cierroLoDeArriba(cambios);
}

function tocoElBoton(world: World, cambios: CambiosDelPanel, { effect: efecto }: NoticeButton): void {
	if (efecto === 'seguir editando') return cierroLoDeArriba(cambios);
	const { taskOnOpen: tareaAlAbrir, action: accion } = cambios;
	if (cambios.top === 'aviso de acción' && tareaAlAbrir && accion) {
		const contexto = contextoDeLaAccion(world, cambios, tareaAlAbrir, accion);
		return efecto === 'guardar' ? guardoYActuo(world, cambios, contexto) : descartoYActuo(world, cambios, contexto);
	}
	if (efecto === 'guardar') return guardoDesdeElCierre(world, cambios);
	cierroElPanel(world);
}

function tocoEnElAviso(world: World, texto: string, momento?: string): void {
	const cambios = elPanelAbierto(world);
	if (momento !== undefined) cambios.now = fechaHora(momento);
	const boton = elAviso(world, cambios).buttons.find((candidato) => candidato.text === texto);
	if (!boton) throw new Error(`El aviso no ofrece "${texto}"`);
	tocoElBoton(world, cambios, boton);
}

function cierroElPanelDesde(world: World, cambios: CambiosDelPanel, efecto: 'cierra el panel' | 'abre el aviso de cierre'): void {
	if (efecto === 'cierra el panel') cierroElPanel(world);
	else cambios.top = 'aviso de cierre';
}

function tocoAtras(world: World): void {
	const cambios = elPanelAbierto(world);
	world.tocoAtras = true;
	const deshacerArriba = cambios.top === 'nada' && world.avisoDeDeshacerAbierto === true;
	const efecto = whatBackDoes({ top: deshacerArriba ? 'aviso de deshacer' : cambios.top, hasChanges: conCambios(cambios), keyboardOpen: cambios.keyboardOpen });
	if (efecto === 'cierra el teclado') cambios.keyboardOpen = false;
	else if (efecto !== 'cierra lo de arriba') cierroElPanelDesde(world, cambios, efecto);
	else if (deshacerArriba) world.avisoDeDeshacerAbierto = false;
	else cierroLoDeArriba(cambios);
}

/** El título que se escribe en cada estado del paso "el panel está abierto". */
const TITULO_AL_ABRIR = 'Pagar';
const ESTADOS_DEL_PANEL: Record<string, string | undefined> = { 'con cambios sin guardar': 'Pagar luz', 'sin cambios': undefined };

const NO_PREGUNTA = 'no pregunta';
const PIDE_CONFIRMACION = 'pide confirmación';

export const cambiosSinGuardarSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^abro el panel para editar la tarea ${P} con nota ${P}$`),
		run: (world, titulo, nota) => abroParaEditar(world, { title: titulo, note: nota })
	},
	{
		pattern: new RegExp(`^abro el panel para editar la tarea ${P} con versión mínima ${P}$`),
		run: (world, titulo, versionMinima) => abroParaEditar(world, { title: titulo, minimalVersion: versionMinima })
	},
	{
		pattern: new RegExp(`^abro el panel para editar la tarea ${P} con primer paso ${P}$`),
		run: (world, titulo, primerPaso) => abroParaEditar(world, { title: titulo, firstStep: primerPaso })
	},
	{
		pattern: new RegExp(`^abro el panel para editar la tarea ${P} con los pasos ${P}$`),
		run: (world, titulo, pasos) => {
			const [primerPaso, ...mas] = lista(pasos);
			abroParaEditar(world, { title: titulo, firstStep: primerPaso, steps: mas });
		}
	},
	{
		pattern: /^toco Agregar paso$/,
		run: (world) => cambioLosPasos(world, (pasos) => [...pasos, ''])
	},
	{
		pattern: new RegExp(`^toco Quitar en el campo ${P}$`),
		run: (world, campo) => {
			cambioLosPasos(world, (pasos, formulario) => pasos.filter((_, lugar) => lugar !== lugarDelPaso(formulario, campo)));
		}
	},
	{
		pattern: new RegExp(`^abro el panel para editar la tarea ${P} con los horarios ${P} y ${P}$`),
		run: (world, titulo, primero, segundo) => abroParaEditar(world, { title: titulo, schedule: [ventana(primero), ventana(segundo)] })
	},
	{
		pattern: /^abro el panel para crear una tarea$/,
		run: (world) => {
			world.panel = { pausa: undefined, cambios: cambiosAlCrear(DATA_ON_CREATE) };
		}
	},
	{
		pattern: new RegExp(`^el panel está abierto ${P}$`),
		run: (world, estado) => {
			const escrito = deLaTabla(ESTADOS_DEL_PANEL, estado, 'Estado del panel');
			abroParaEditar(world, { title: TITULO_AL_ABRIR });
			if (escrito) escribo(world, 'Título', escrito);
		}
	},
	{
		pattern: new RegExp(`^encima del panel hay ${P}$`),
		run: (world, encima) => {
			const cambios = elPanelAbierto(world);
			cambios.top = deLaTabla(NOMBRES_DE_ENCIMA, encima, 'Lo de arriba');
			// Una tarea puntual sin posponer ofrece Posponer: su aviso de acción puede estar abierto (§5.9).
			if (cambios.top === 'aviso de acción') cambios.action = optionAction('1 hora');
		}
	},
	{
		pattern: /^el aviso de deshacer está abierto$/,
		run: (world) => {
			world.avisoDeDeshacerAbierto = true;
		}
	},
	{
		pattern: /^el aviso de deshacer sigue abierto$/,
		run: (world) => expect(world.avisoDeDeshacerAbierto).toBe(true)
	},
	{
		pattern: /^el teclado en pantalla está abierto$/,
		run: (world) => {
			elPanelAbierto(world).keyboardOpen = true;
		}
	},
	{
		pattern: new RegExp(`^escribo ${P} en el campo ${P}$`),
		run: (world, valor, campo) => escribo(world, campo, valor)
	},
	{
		pattern: new RegExp(`^escribo ${P} con espacios alrededor en el campo ${P}$`),
		run: (world, valor, campo) => escribo(world, campo, `  ${valor}  `)
	},
	{
		pattern: new RegExp(`^escribo solo espacios en el campo ${P}$`),
		run: (world, campo) => escribo(world, campo, '   ')
	},
	{
		pattern: new RegExp(`^vacío el campo ${P}$`),
		run: (world, campo) => escribo(world, campo, '')
	},
	{
		pattern: new RegExp(`^elijo ${P} en ${P}$`),
		run: (world, valor, selector) => {
			const cambios = elPanelAbierto(world);
			cambios.form = { ...cambios.form, data: deLaTabla(SELECTORES, selector, 'Selector')(cambios, valor) };
		}
	},
	{
		pattern: new RegExp(`^cambio los horarios a ${P} y ${P}$`),
		run: (world, primero, segundo) => cambioElHorario(world, [ventana(primero), ventana(segundo)])
	},
	{
		pattern: /^agrego una fila de horario vacía$/,
		run: (world) => cambioElHorario(world, [...(elPanelAbierto(world).form.data.schedule ?? []), { from: '', to: '' }])
	},
	{
		pattern: /^toco la X del panel$/,
		run: (world) => {
			const cambios = elPanelAbierto(world);
			cierroElPanelDesde(world, cambios, onClosePanel(conCambios(cambios)));
		}
	},
	{
		pattern: /^toco Atrás$/,
		run: tocoAtras
	},
	{
		pattern: new RegExp(`^toco ${P} en el aviso$`),
		run: (world, boton) => tocoEnElAviso(world, boton)
	},
	{
		pattern: new RegExp(`^toco ${P} en el aviso el ${P}$`),
		run: (world, boton, momento) => tocoEnElAviso(world, boton, momento)
	},
	{
		pattern: new RegExp(`^elijo la acción ${P} el ${P}$`),
		run: elijoLaAccion
	},
	{
		pattern: new RegExp(`^pasa el tiempo hasta ${P}$`),
		run: (world, momento) => {
			elPanelAbierto(world).now = fechaHora(momento);
		}
	},
	{
		pattern: new RegExp(`^queda abierto ${P}$`),
		run: (world, abierto) => {
			const cambios = panelAlDia(world);
			expect(cambios ? (LO_ABIERTO[cambios.top] ?? 'el panel') : 'nada').toBe(abierto);
		}
	},
	{
		pattern: new RegExp(`^el aviso dice ${P}$`),
		run: (world, mensaje) => expect(elAviso(world, elPanelAbierto(world)).message).toBe(mensaje)
	},
	{
		pattern: new RegExp(`^el aviso ofrece ${P}$`),
		run: (world, botones) => expect(elAviso(world, elPanelAbierto(world)).buttons.map(({ text: texto }) => texto)).toEqual(lista(botones))
	},
	{
		pattern: new RegExp(`^el campo ${P} sigue con ${P}$`),
		run: (world, campo, valor) => expect(campoDe(campo).lee(elPanelAbierto(world).form)).toBe(valor)
	},
	{
		pattern: new RegExp(`^al recargar la app el navegador ${P}$`),
		run: (world, respuesta) => {
			const cambios = panelAlDia(world);
			expect(cambios && conCambios(cambios) ? PIDE_CONFIRMACION : NO_PREGUNTA).toBe(respuesta);
		}
	},
	{
		// §6.2: la confirmación del navegador es de recargar o cerrar la app; Atrás con el panel abierto no sale de la pantalla.
		pattern: new RegExp(`^el navegador ${P}$`),
		run: (world, respuesta) => {
			expect(world.tocoAtras).toBe(true);
			expect(NO_PREGUNTA).toBe(respuesta);
		}
	}
];
