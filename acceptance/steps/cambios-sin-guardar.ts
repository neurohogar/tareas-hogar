// Cambios sin guardar y Atrás (spec §6.2, §7): lo que hay escrito en el panel, los avisos que abre
// cerrarlo o usar una acción, y qué cierra Atrás. El panel es el de world.panel; lo que escribe y lo
// que tiene encima, world.panel.cambios. Con el panel cerrado, world.panel no existe.
import { expect } from 'vitest';
import { queHaceAtras, type LoDeArriba } from '../../src/lib/core/atras-del-panel';
import { accionDeLaOpcion, cambioDeAccion, queHaceLaAccion, type AccionDelPanel } from '../../src/lib/core/accion-del-panel';
import { avisoDeAccion, descartarYActuar, guardarYActuar, type AccionEnAviso } from '../../src/lib/core/aviso-de-accion';
import { AVISO_DE_CIERRE, alCerrarElPanel, type AvisoDeCambios, type BotonDelAviso } from '../../src/lib/core/cambios-sin-guardar-aviso';
import { crearDesdePanel, editarDesdePanel } from '../../src/lib/core/cambios-sin-guardar-guardado';
import { hayCambios, type FormularioDelPanel } from '../../src/lib/core/cambios-sin-guardar';
import type { DatosComunes } from '../../src/lib/core/creacion';
import { crearPuntual } from '../../src/lib/core/crear-puntual';
import { DATOS_AL_CREAR, type DatosDeTarea } from '../../src/lib/core/datos-de-tarea';
import { aplicarCambio, type CambioDeTarea } from '../../src/lib/core/documento-de-tarea';
import { OPCIONES_DE_ESFUERZO } from '../../src/lib/core/esfuerzo';
import type { HorarioEscrito } from '../../src/lib/core/horario';
import { OPCIONES_DE_POSPONER } from '../../src/lib/core/posposicion';
import type { Tarea } from '../../src/lib/core/tarea';
import { AHORA, ANTES_DEL_ESCENARIO, registrarCreacion } from './crear';
import { P, fechaHora, lista } from './valores';
import {
	cambiosAlCrear,
	cambiosAlEditar,
	laTarea,
	nuevoId,
	nuevoIdDeEtiqueta,
	recordarAntesDeMiCambio,
	tareasDe,
	type CambiosDelPanel,
	type StepDefinition,
	type World
} from './world';

const elMomento = ({ ahora }: CambiosDelPanel) => ahora ?? AHORA;

/** Un valor malformado falla el escenario: nada se interpreta por parecido. */
function deLaTabla<T>(tabla: Record<string, T>, valor: string, que: string): T {
	if (!Object.hasOwn(tabla, valor)) throw new Error(`${que} inválido: "${valor}"`);
	return tabla[valor];
}

function abroParaEditar(world: World, datos: DatosComunes): void {
	registrarCreacion(world, (id) => crearPuntual(datos, id, ANTES_DEL_ESCENARIO));
	expect(world.errores).toBeUndefined();
	const tarea = laTarea(world);
	world.panel = { pausa: undefined, cambios: cambiosAlEditar(world, tarea) };
}

/** La ventana "HH:MM-HH:MM" de un paso. */
function ventana(valor: string): HorarioEscrito[number] {
	const partes = /^(\d{2}:\d{2})-(\d{2}:\d{2})$/.exec(valor);
	if (!partes) throw new Error(`Ventana inválida: "${valor}"`);
	return { desde: partes[1], hasta: partes[2] };
}

function contextoDeLaAccion(world: World, cambios: CambiosDelPanel, tareaAlAbrir: Tarea, accion: AccionDelPanel): AccionEnAviso {
	const tarea = tareasDe(world).find(({ id }) => id === tareaAlAbrir.id);
	if (!tarea) throw new Error('La tarea del panel ya no existe');
	return { accion, tareaAlAbrir, tarea, completados: world.completados, ahora: elMomento(cambios), formulario: cambios.formulario, existentes: world.etiquetas };
}

/** Lo que hizo otro dispositivo o el paso del tiempo mientras el panel estaba abierto (§6.2, §7). */
function panelAlDia(world: World): CambiosDelPanel | undefined {
	const cambios = world.panel?.cambios;
	if (!cambios) return undefined;
	const { tareaAlAbrir, accion } = cambios;
	if (tareaAlAbrir && !tareasDe(world).some(({ id }) => id === tareaAlAbrir.id)) {
		world.panel = undefined;
		return undefined;
	}
	if (cambios.encima === 'aviso de acción' && tareaAlAbrir && accion && !avisoDeAccion(contextoDeLaAccion(world, cambios, tareaAlAbrir, accion))) cierroLoDeArriba(cambios);
	return cambios;
}

function elPanelAbierto(world: World): CambiosDelPanel {
	const cambios = panelAlDia(world);
	if (!cambios) throw new Error('El panel no está abierto');
	return cambios;
}

function cierroLoDeArriba(cambios: CambiosDelPanel): void {
	cambios.encima = 'nada';
	cambios.accion = undefined;
}

const conCambios = ({ alAbrir, formulario }: CambiosDelPanel) => hayCambios(alAbrir, formulario);

const NOMBRES_DE_ENCIMA: Record<string, LoDeArriba> = {
	nada: 'nada',
	'el aviso de cierre': 'aviso de cierre',
	'el aviso de acción': 'aviso de acción',
	'la confirmación de Borrar tarea': 'confirmación de Borrar tarea',
	'el selector de emoji': 'selector de emoji',
	'las sugerencias de Etiquetas': 'sugerencias de Etiquetas'
};

const LO_ABIERTO: Partial<Record<LoDeArriba, string>> = {
	'aviso de cierre': 'el panel con el aviso de cierre',
	'aviso de acción': 'el panel con el aviso de acción',
	'confirmación de Borrar tarea': 'el panel con la confirmación de Borrar tarea',
	'selector de emoji': 'el panel con el selector de emoji'
};

// ---- Lo que se escribe ----

const CAMPOS: Record<string, { lee: (f: FormularioDelPanel) => string | undefined; escribe: (f: FormularioDelPanel, valor: string) => FormularioDelPanel }> = {
	Título: { lee: (f) => f.datos.titulo, escribe: (f, titulo) => ({ ...f, datos: { ...f.datos, titulo } }) },
	Nota: { lee: (f) => f.datos.nota, escribe: (f, nota) => ({ ...f, datos: { ...f.datos, nota } }) },
	'Etiquetas sin confirmar': { lee: (f) => f.sinConfirmar, escribe: (f, sinConfirmar) => ({ ...f, sinConfirmar }) }
};

function escribo(world: World, campo: string, valor: string): void {
	const cambios = elPanelAbierto(world);
	cambios.formulario = deLaTabla(CAMPOS, campo, 'Campo').escribe(cambios.formulario, valor);
}

const comunesDe = ({ titulo, emoji, nota, horario, esfuerzo }: DatosDeTarea): DatosComunes => ({ titulo, emoji, nota, horario, esfuerzo });

/** Los campos de cada opción de "Se repite": los de la tarea si es de esa forma; si no, como al crear (§6.2). */
const SE_REPITE: Record<string, { forma: DatosDeTarea['forma']; vacios: Partial<DatosDeTarea> }> = {
	'No se repite': { forma: 'puntual', vacios: {} },
	Intervalo: { forma: 'relativa', vacios: { cada: Number.NaN, unidad: 'horas' } }
};

const SELECTORES: Record<string, (cambios: CambiosDelPanel, valor: string) => DatosDeTarea> = {
	'Se repite': ({ alAbrir, formulario }, valor) => {
		const { forma, vacios } = deLaTabla(SE_REPITE, valor, 'Opción de Se repite');
		const base = alAbrir.datos.forma === forma ? alAbrir.datos : { forma, ...vacios };
		return { ...base, ...comunesDe(formulario.datos) } as DatosDeTarea;
	},
	Esfuerzo: ({ formulario }, valor) => {
		// El paso nombra la opción sin la duración que la acompaña en pantalla: "Media", no "Media (≈ 15 min)".
		const opcion = OPCIONES_DE_ESFUERZO.find(({ texto }) => texto === valor || texto.startsWith(`${valor} (`));
		if (!opcion) throw new Error(`Esfuerzo inválido: "${valor}"`);
		return { ...formulario.datos, esfuerzo: opcion.valor };
	}
};

function cambioElHorario(world: World, horario: HorarioEscrito): void {
	const cambios = elPanelAbierto(world);
	cambios.formulario = { ...cambios.formulario, datos: { ...cambios.formulario.datos, horario } };
}

function cambioLasEtiquetas(world: World, cambiar: (etiquetas: readonly string[]) => string[]): void {
	const cambios = elPanelAbierto(world);
	cambios.formulario = { ...cambios.formulario, etiquetas: cambiar(cambios.formulario.etiquetas) };
}

// ---- Los avisos ----

const ACCIONES_FIJAS: Record<string, AccionDelPanel | 'borrar tarea'> = { Pausar: 'pausar', Reanudar: 'reanudar', 'Quitar posponer': 'quitar posponer', 'Borrar tarea': 'borrar tarea' };

function accionDe(texto: string): AccionDelPanel | 'borrar tarea' {
	const opcion = OPCIONES_DE_POSPONER.find(({ opcion }) => texto === `Posponer ${opcion}`);
	return opcion ? accionDeLaOpcion(opcion.opcion) : deLaTabla(ACCIONES_FIJAS, texto, 'Acción');
}

function elAviso(world: World, cambios: CambiosDelPanel): AvisoDeCambios {
	if (cambios.encima === 'aviso de cierre') return AVISO_DE_CIERRE;
	const { tareaAlAbrir, accion } = cambios;
	const aviso = cambios.encima === 'aviso de acción' && tareaAlAbrir && accion && avisoDeAccion(contextoDeLaAccion(world, cambios, tareaAlAbrir, accion));
	if (!aviso) throw new Error('No hay un aviso abierto');
	return aviso;
}

function cierroElPanel(world: World): void {
	world.panel = undefined;
}

function actuo(world: World, tarea: Tarea, cambio: CambioDeTarea): void {
	recordarAntesDeMiCambio(world);
	world.documentos = aplicarCambio(world.documentos, tarea.id, cambio);
	cierroElPanel(world);
}

/** Elegir la acción: el panel, con la tarea de ahora, tiene que ofrecerla (§6.2). */
function elijoLaAccion(world: World, texto: string, momento: string): void {
	const cambios = elPanelAbierto(world);
	cambios.ahora = fechaHora(momento);
	const accion = accionDe(texto);
	const tarea = cambios.tareaAlAbrir;
	if (!tarea) throw new Error('Las acciones son solo al editar');
	const efecto = queHaceLaAccion(accion, conCambios(cambios));
	if (accion === 'borrar tarea' || efecto === 'pide confirmar el borrado') {
		cambios.encima = 'confirmación de Borrar tarea';
		return;
	}
	const contexto = contextoDeLaAccion(world, cambios, tarea, accion);
	if (efecto === 'abre el aviso de acción') {
		expect(avisoDeAccion(contexto)).toBeDefined();
		cambios.encima = 'aviso de acción';
		cambios.accion = accion;
	} else {
		expect(descartarYActuar(contexto)).toBeDefined();
		actuo(world, contexto.tarea, cambioDeAccion(accion, contexto.ahora));
	}
}

/** Si Guardar falla (§6.2): no se ejecuta nada, el aviso se cierra y el panel sigue con lo escrito. */
function fallaGuardar(world: World, cambios: CambiosDelPanel, errores: World['errores']): void {
	world.errores = errores;
	cierroLoDeArriba(cambios);
}

const alGuardar = (world: World) => ({ existentes: world.etiquetas, nuevoId: () => nuevoIdDeEtiqueta(world) });

function guardoDesdeElCierre(world: World, cambios: CambiosDelPanel): void {
	const { tareaAlAbrir, formulario } = cambios;
	const actual = tareaAlAbrir && tareasDe(world).find(({ id }) => id === tareaAlAbrir.id);
	if (actual) {
		const edicion = editarDesdePanel(actual, formulario, alGuardar(world), elMomento(cambios));
		if (!edicion.ok) return fallaGuardar(world, cambios, edicion.errores);
		world.etiquetas = [...world.etiquetas, ...edicion.nuevas];
		return actuo(world, actual, edicion.cambio);
	}
	const creacion = crearDesdePanel(formulario, nuevoId(world, 'tarea'), elMomento(cambios), alGuardar(world));
	if (!creacion.ok) return fallaGuardar(world, cambios, creacion.errores);
	world.etiquetas = [...world.etiquetas, ...creacion.nuevas];
	world.documentos = [...world.documentos, creacion.tarea];
	cierroElPanel(world);
}

function guardoYActuo(world: World, cambios: CambiosDelPanel, contexto: AccionEnAviso): void {
	const resultado = guardarYActuar(contexto, () => nuevoIdDeEtiqueta(world));
	if (resultado.resultado === 'rechazado') return fallaGuardar(world, cambios, resultado.errores);
	if (resultado.resultado === 'aviso cerrado') return cierroLoDeArriba(cambios);
	if (resultado.resultado === 'aviso actualizado') return;
	world.etiquetas = [...world.etiquetas, ...resultado.nuevas];
	actuo(world, contexto.tarea, resultado.cambio);
}

function descartoYActuo(world: World, cambios: CambiosDelPanel, contexto: AccionEnAviso): void {
	const cambio = descartarYActuar(contexto);
	if (cambio) actuo(world, contexto.tarea, cambio);
	else cierroLoDeArriba(cambios);
}

function tocoElBoton(world: World, cambios: CambiosDelPanel, { efecto }: BotonDelAviso): void {
	if (efecto === 'seguir editando') return cierroLoDeArriba(cambios);
	const { tareaAlAbrir, accion } = cambios;
	if (cambios.encima === 'aviso de acción' && tareaAlAbrir && accion) {
		const contexto = contextoDeLaAccion(world, cambios, tareaAlAbrir, accion);
		return efecto === 'guardar' ? guardoYActuo(world, cambios, contexto) : descartoYActuo(world, cambios, contexto);
	}
	if (efecto === 'guardar') return guardoDesdeElCierre(world, cambios);
	cierroElPanel(world);
}

function tocoEnElAviso(world: World, texto: string, momento?: string): void {
	const cambios = elPanelAbierto(world);
	if (momento !== undefined) cambios.ahora = fechaHora(momento);
	const boton = elAviso(world, cambios).botones.find((candidato) => candidato.texto === texto);
	if (!boton) throw new Error(`El aviso no ofrece "${texto}"`);
	tocoElBoton(world, cambios, boton);
}

function cierroElPanelDesde(world: World, cambios: CambiosDelPanel, efecto: 'cierra el panel' | 'abre el aviso de cierre'): void {
	if (efecto === 'cierra el panel') cierroElPanel(world);
	else cambios.encima = 'aviso de cierre';
}

function tocoAtras(world: World): void {
	const cambios = elPanelAbierto(world);
	world.tocoAtras = true;
	const deshacerArriba = cambios.encima === 'nada' && world.avisoDeDeshacerAbierto === true;
	const efecto = queHaceAtras({ encima: deshacerArriba ? 'aviso de deshacer' : cambios.encima, hayCambios: conCambios(cambios), tecladoAbierto: cambios.tecladoAbierto });
	if (efecto === 'cierra el teclado') cambios.tecladoAbierto = false;
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
		run: (world, titulo, nota) => abroParaEditar(world, { titulo, nota })
	},
	{
		pattern: new RegExp(`^abro el panel para editar la tarea ${P} con los horarios ${P} y ${P}$`),
		run: (world, titulo, primero, segundo) => abroParaEditar(world, { titulo, horario: [ventana(primero), ventana(segundo)] })
	},
	{
		pattern: /^abro el panel para crear una tarea$/,
		run: (world) => {
			world.panel = { pausa: undefined, cambios: cambiosAlCrear(DATOS_AL_CREAR) };
		}
	},
	{
		pattern: new RegExp(`^el panel está abierto ${P}$`),
		run: (world, estado) => {
			const escrito = deLaTabla(ESTADOS_DEL_PANEL, estado, 'Estado del panel');
			abroParaEditar(world, { titulo: TITULO_AL_ABRIR });
			if (escrito) escribo(world, 'Título', escrito);
		}
	},
	{
		pattern: new RegExp(`^encima del panel hay ${P}$`),
		run: (world, encima) => {
			const cambios = elPanelAbierto(world);
			cambios.encima = deLaTabla(NOMBRES_DE_ENCIMA, encima, 'Lo de arriba');
			// Una tarea puntual sin posponer ofrece Posponer: su aviso de acción puede estar abierto (§5.9).
			if (cambios.encima === 'aviso de acción') cambios.accion = accionDeLaOpcion('1 hora');
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
			elPanelAbierto(world).tecladoAbierto = true;
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
			cambios.formulario = { ...cambios.formulario, datos: deLaTabla(SELECTORES, selector, 'Selector')(cambios, valor) };
		}
	},
	{
		pattern: new RegExp(`^cambio los horarios a ${P} y ${P}$`),
		run: (world, primero, segundo) => cambioElHorario(world, [ventana(primero), ventana(segundo)])
	},
	{
		pattern: /^agrego una fila de horario vacía$/,
		run: (world) => cambioElHorario(world, [...(elPanelAbierto(world).formulario.datos.horario ?? []), { desde: '', hasta: '' }])
	},
	{
		pattern: new RegExp(`^agrego la etiqueta ${P}$`),
		run: (world, etiqueta) => cambioLasEtiquetas(world, (etiquetas) => [...etiquetas, etiqueta])
	},
	{
		pattern: new RegExp(`^quito la etiqueta ${P}$`),
		run: (world, etiqueta) => cambioLasEtiquetas(world, (etiquetas) => etiquetas.filter((nombre) => nombre !== etiqueta))
	},
	{
		pattern: /^toco la X del panel$/,
		run: (world) => {
			const cambios = elPanelAbierto(world);
			cierroElPanelDesde(world, cambios, alCerrarElPanel(conCambios(cambios)));
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
			elPanelAbierto(world).ahora = fechaHora(momento);
		}
	},
	{
		pattern: new RegExp(`^queda abierto ${P}$`),
		run: (world, abierto) => {
			const cambios = panelAlDia(world);
			expect(cambios ? (LO_ABIERTO[cambios.encima] ?? 'el panel') : 'nada').toBe(abierto);
		}
	},
	{
		pattern: new RegExp(`^el aviso dice ${P}$`),
		run: (world, mensaje) => expect(elAviso(world, elPanelAbierto(world)).mensaje).toBe(mensaje)
	},
	{
		pattern: new RegExp(`^el aviso ofrece ${P}$`),
		run: (world, botones) => expect(elAviso(world, elPanelAbierto(world)).botones.map(({ texto }) => texto)).toEqual(lista(botones))
	},
	{
		pattern: new RegExp(`^el campo ${P} sigue con ${P}$`),
		run: (world, campo, valor) => expect(deLaTabla(CAMPOS, campo, 'Campo').lee(elPanelAbierto(world).formulario)).toBe(valor)
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
