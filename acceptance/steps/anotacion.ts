// Anotar (spec §4.5, §5.10), la pantalla Anotaciones, Copiar, Editar texto y Borrar (§6.7), y las
// anotaciones de una tarea borrada (§6.2, §7). Una anotación se nombra en los pasos por el
// instante en que se anotó.
import { expect } from 'vitest';
import { anotar, editarTexto, type Anotacion, type ContextoAlAnotar, type PantallaActual, type Sentido } from '../../src/lib/core/anotacion';
import { anotacionesEnPantalla, type GrupoDeAnotaciones } from '../../src/lib/core/anotaciones';
import { textoDeAnotaciones } from '../../src/lib/core/anotaciones-copiadas';
import { anotacionesHuerfanas } from '../../src/lib/core/borrado';
import { avisoAlCompletar } from '../../src/lib/core/aviso';
import { hayCambios } from '../../src/lib/core/cambios-sin-guardar';
import { DATOS_AL_CREAR } from '../../src/lib/core/datos-de-tarea';
import { OTRO, borrarGuardado, cambiosAlCrear, cambiosAlEditar, laTareaTitulada, loQueHuboGuardado, nuevoId, tareasDe, type StepDefinition, type World } from './world';
import { P, TITULO, fechaHora, numero } from './valores';

const SENTIDOS = ['Me sirvió', 'Me molestó'];
const PANTALLAS_ACTUALES = ['Pendientes', 'Historial', 'Etiquetas', 'Anotaciones'];
const PANTALLAS = [...PANTALLAS_ACTUALES, 'Panel de edición'];

/** Un sentido o una pantalla, escritos en el paso o como `<placeholder>`. */
const SENTIDO = `(<[A-Za-z0-9_]+>|${SENTIDOS.join('|')})`;
const PANTALLA = `(<[A-Za-z0-9_]+>|${PANTALLAS.join('|')})`;

function sentido(valor: string): Sentido {
	if (!SENTIDOS.includes(valor)) throw new Error(`Sentido inválido: "${valor}"`);
	return valor as Sentido;
}

function pantallaActual(valor: string): PantallaActual {
	if (!PANTALLAS_ACTUALES.includes(valor)) throw new Error(`Pantalla inválida: "${valor}"`);
	return valor as PantallaActual;
}

/** Lo que se ve de la persona al anotar: dónde está, el panel abierto y el aviso de deshacer. */
function contextoDe(world: World): ContextoAlAnotar {
	if (!world.pantallaActual) throw new Error('No se dijo en qué pantalla está la persona');
	return {
		pantalla: world.pantallaActual,
		...(world.panelDeAnotar && { panel: world.panelDeAnotar.tareaId === undefined ? {} : { tareaId: world.panelDeAnotar.tareaId } }),
		aviso: world.aviso
	};
}

function guardar(world: World, anotacion: Anotacion): void {
	world.anotaciones = [...world.anotaciones, anotacion];
	world.ultimaAnotacionId = anotacion.id;
}

function anotoYo(world: World, sentidoElegido: string, ahora: string, texto = ''): void {
	guardar(world, anotar(nuevoId(world, 'anotacion'), sentido(sentidoElegido), fechaHora(ahora), contextoDe(world), texto));
	// Un valor que el core no rechaza en silencio: la anotación se guardó con el texto que se escribió.
	expect(world.errores).toBeUndefined();
}

/** Otro dispositivo en la pantalla dada, sin panel; sobre una tarea solo por un aviso de deshacer a la vista. */
function anotaElOtro(world: World, sentidoElegido: string, pantalla: string, ahora: string, titulo?: string): void {
	const momento = fechaHora(ahora);
	const aviso =
		titulo === undefined
			? undefined
			: avisoAlCompletar(laTareaTitulada(loQueHuboGuardado(world), titulo), { id: nuevoId(world, 'completado'), tareaId: laTareaTitulada(loQueHuboGuardado(world), titulo).id, completadoEn: momento });
	guardar(world, anotar(nuevoId(world, 'anotacion'), sentido(sentidoElegido), momento, { pantalla: pantallaActual(pantalla), aviso }));
}

/** Declara una anotación guardada, con el contexto que dice el paso. */
function declaro(world: World, sentidoElegido: string, pantalla: string, anotada: string): void {
	const alAbrirPanel = pantalla === 'Panel de edición';
	if (!PANTALLAS.includes(pantalla)) throw new Error(`Pantalla inválida: "${pantalla}"`);
	const contexto: ContextoAlAnotar = { pantalla: alAbrirPanel ? 'Pendientes' : pantallaActual(pantalla), ...(alAbrirPanel && { panel: {} }) };
	guardar(world, anotar(nuevoId(world, 'anotacion'), sentido(sentidoElegido), fechaHora(anotada), contexto));
}

const todas = (world: World): Anotacion[] => [...world.anotaciones, ...world.anotacionesBorradas];

/** La única anotación de ese instante, aunque ya se haya borrado. */
function laDelMomento(world: World, anotada: string): Anotacion {
	const instante = fechaHora(anotada).getTime();
	const delMomento = todas(world).filter(({ anotadaEn }) => anotadaEn.getTime() === instante);
	if (delMomento.length !== 1) throw new Error(`Se esperaba una anotación del ${anotada}, hay ${delMomento.length}`);
	return delMomento[0];
}

function laVigente(world: World, anotada: string): Anotacion {
	const { id } = laDelMomento(world, anotada);
	const vigente = world.anotaciones.find((anotacion) => anotacion.id === id);
	if (!vigente) throw new Error(`La anotación del ${anotada} ya no existe`);
	return vigente;
}

function laUltima(world: World): Anotacion {
	const ultima = world.anotaciones.find(({ id }) => id === world.ultimaAnotacionId);
	if (!ultima) throw new Error('No se declaró ninguna anotación');
	return ultima;
}

/** Cambia la última anotación declarada. */
function cambiarLaUltima(world: World, cambio: (anotacion: Anotacion) => Anotacion): void {
	const ultima = laUltima(world);
	world.anotaciones = world.anotaciones.map((anotacion) => (anotacion === ultima ? cambio(anotacion) : anotacion));
	world.ultimaAnotacionId = cambio(ultima).id;
}

const espacios = (cantidad: string) => ' '.repeat(numero(cantidad));

/** Como setDoc de un campo: editar el texto de una anotación ya borrada no la revive. */
function editarElTexto(world: World, anotada: string, texto: string): void {
	world.anotaciones = editarTexto(world.anotaciones, laDelMomento(world, anotada).id, texto);
}

/** Como deleteDoc: borrar una anotación que ya no existe no hace nada. */
function borrarLaAnotacion(world: World, anotada: string): void {
	borrarGuardado(world, [], [], [laDelMomento(world, anotada).id]);
}

/** "Hoy: 09:10 · Me molestó · Historial, 08:05 · ...; Ayer: ...": grupos con "; ", anotaciones con ", ", partes con " · ". */
function enTexto(grupos: GrupoDeAnotaciones[]): string {
	const entrada = ({ hora, anotacion, nombreDeTarea }: GrupoDeAnotaciones['entradas'][number]) =>
		[hora, anotacion.sentido, anotacion.pantalla, nombreDeTarea, anotacion.texto].filter((parte) => parte !== undefined).join(' · ');
	return grupos.map(({ encabezado, entradas }) => `${encabezado}: ${entradas.map(entrada).join(', ')}`).join('; ');
}

function lasConsultadas(world: World): GrupoDeAnotaciones[] {
	if (!world.anotacionesConsultadas) throw new Error('No se consultó Anotaciones');
	return world.anotacionesConsultadas;
}

function elPanelAbierto(world: World) {
	if (!world.panelDeAnotar) throw new Error('El panel de edición no está abierto');
	return world.panelDeAnotar;
}

export const anotacionSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^estoy en ${PANTALLA}$`),
		run: (world, pantalla) => void (world.pantallaActual = pantallaActual(pantalla))
	},
	{
		pattern: new RegExp(`^el panel de edición está abierto al editar la tarea ${TITULO}$`),
		run: (world, titulo) => {
			const tarea = laTareaTitulada(world, titulo);
			world.panelDeAnotar = { tareaId: tarea.id, cambios: cambiosAlEditar(world, tarea), documentosAlAbrir: structuredClone(world.documentos) };
		}
	},
	{
		pattern: /^el panel de edición está abierto al crear una tarea$/,
		run: (world) => {
			world.panelDeAnotar = { cambios: cambiosAlCrear(DATOS_AL_CREAR), documentosAlAbrir: structuredClone(world.documentos) };
		}
	},
	{
		pattern: new RegExp(`^anoto ${SENTIDO} el ${P}$`),
		run: (world, elegido, ahora) => anotoYo(world, elegido, ahora)
	},
	{
		pattern: new RegExp(`^anoto ${SENTIDO} el ${P} con el texto ${P}$`),
		run: (world, elegido, ahora, texto) => anotoYo(world, elegido, ahora, texto)
	},
	{
		pattern: new RegExp(`^anoto ${SENTIDO} el ${P} con el texto ${P} entre ${P} espacios$`),
		run: (world, elegido, ahora, texto, cantidad) => anotoYo(world, elegido, ahora, `${espacios(cantidad)}${texto}${espacios(cantidad)}`)
	},
	{
		pattern: new RegExp(`^anoto ${SENTIDO} el ${P} con ${P} espacios como texto$`),
		run: (world, elegido, ahora, cantidad) => anotoYo(world, elegido, ahora, espacios(cantidad))
	},
	{
		pattern: new RegExp(`^anoto ${SENTIDO} el ${P} con un texto de ${P} caracteres$`),
		run: (world, elegido, ahora, largo) => anotoYo(world, elegido, ahora, 'a'.repeat(numero(largo)))
	},
	{
		pattern: new RegExp(`^${OTRO} anota ${SENTIDO} en ${PANTALLA} el ${P}$`),
		run: (world, elegido, pantalla, ahora) => anotaElOtro(world, elegido, pantalla, ahora)
	},
	{
		pattern: new RegExp(`^${OTRO} anota ${SENTIDO} en ${PANTALLA} el ${P} sobre la tarea ${TITULO}$`),
		run: (world, elegido, pantalla, ahora, titulo) => anotaElOtro(world, elegido, pantalla, ahora, titulo)
	},
	{
		pattern: new RegExp(`^una anotación ${SENTIDO} en ${PANTALLA} del ${P}$`),
		run: (world, elegido, pantalla, anotada) => declaro(world, elegido, pantalla, anotada)
	},
	{
		pattern: new RegExp(`^la anotación se refiere a la tarea ${TITULO}$`),
		run: (world, titulo) => cambiarLaUltima(world, (anotacion) => ({ ...anotacion, tareaId: laTareaTitulada(world, titulo).id }))
	},
	{
		pattern: new RegExp(`^la anotación dice ${P}$`),
		run: (world, texto) => {
			const { id } = laUltima(world);
			world.anotaciones = editarTexto(world.anotaciones, id, texto);
		}
	},
	{
		pattern: new RegExp(`^la anotación se registró con id ${P}$`),
		run: (world, id) => cambiarLaUltima(world, (anotacion) => ({ ...anotacion, id }))
	},
	{
		pattern: /^queda una sola anotación$/,
		run: (world) => expect(world.anotaciones).toHaveLength(1)
	},
	{
		pattern: new RegExp(`^quedan ${P} anotaciones$`),
		run: (world, cantidad) => expect(world.anotaciones).toHaveLength(numero(cantidad))
	},
	{
		pattern: /^no queda ninguna anotación$/,
		run: (world) => expect(world.anotaciones).toEqual([])
	},
	{
		pattern: new RegExp(`^no existe la anotación del ${P}$`),
		run: (world, anotada) => {
			const { id } = laDelMomento(world, anotada);
			expect(world.anotaciones.map((anotacion) => anotacion.id)).not.toContain(id);
		}
	},
	{
		pattern: new RegExp(`^la anotación del ${P} tiene sentido ${SENTIDO} en ${PANTALLA}$`),
		run: (world, anotada, elegido, pantalla) => {
			const anotacion = laVigente(world, anotada);
			expect(anotacion.sentido).toBe(elegido);
			expect(anotacion.pantalla).toBe(pantalla);
		}
	},
	{
		pattern: new RegExp(`^la anotación del ${P} es de la tarea ${TITULO}$`),
		run: (world, anotada, titulo) =>
			expect(laVigente(world, anotada).tareaId).toBe(laTareaTitulada(loQueHuboGuardado(world), titulo).id)
	},
	{
		pattern: new RegExp(`^la anotación del ${P} no es de ninguna tarea$`),
		run: (world, anotada) => expect(laVigente(world, anotada)).not.toHaveProperty('tareaId')
	},
	{
		pattern: new RegExp(`^la anotación del ${P} dice ${P}$`),
		run: (world, anotada, texto) => expect(laVigente(world, anotada).texto).toBe(texto)
	},
	{
		pattern: new RegExp(`^la anotación del ${P} dice un texto de ${P} caracteres$`),
		run: (world, anotada, largo) => expect(laVigente(world, anotada).texto).toBe('a'.repeat(numero(largo)))
	},
	{
		pattern: new RegExp(`^la anotación del ${P} no tiene texto$`),
		run: (world, anotada) => expect(laVigente(world, anotada)).not.toHaveProperty('texto')
	},
	{
		// §5.10: anotar no toca la tarea ni el panel; no cierra el panel ni abre un aviso de acción.
		pattern: /^el panel sigue abierto sin cambios sin guardar$/,
		run: (world) => {
			const { cambios, documentosAlAbrir } = elPanelAbierto(world);
			expect(world.anotaciones).toHaveLength(1);
			expect(hayCambios(cambios.alAbrir, cambios.formulario)).toBe(false);
			expect(cambios.encima).toBe('nada');
			expect(world.documentos).toStrictEqual(documentosAlAbrir);
		}
	},
	{
		pattern: new RegExp(`^consulto Anotaciones el ${P}$`),
		run: (world, ahora) => {
			world.anotacionesConsultadas = anotacionesEnPantalla(tareasDe(world), world.anotaciones, fechaHora(ahora));
		}
	},
	{
		pattern: new RegExp(`^Anotaciones muestra ${P}$`),
		run: (world, esperado) => expect(enTexto(lasConsultadas(world))).toBe(esperado)
	},
	{
		pattern: /^Anotaciones está vacía$/,
		run: (world) => expect(lasConsultadas(world)).toEqual([])
	},
	{
		pattern: /^copio las anotaciones$/,
		run: (world) => {
			world.copiado = { texto: textoDeAnotaciones(tareasDe(world), world.anotaciones) };
		}
	},
	{
		pattern: new RegExp(`^el texto copiado tiene las líneas ${P}$`),
		run: (world, lineas) => {
			if (!world.copiado) throw new Error('No se copió');
			expect(world.copiado.texto?.split('\n')).toEqual(lineas.split('; '));
		}
	},
	{
		pattern: /^no hay nada para copiar$/,
		run: (world) => {
			if (!world.copiado) throw new Error('No se copió');
			expect(world.copiado.texto).toBeUndefined();
		}
	},
	{
		pattern: new RegExp(`^edito el texto de la anotación del ${P} a ${P}$`),
		run: (world, anotada, texto) => editarElTexto(world, anotada, texto)
	},
	{
		pattern: new RegExp(`^edito el texto de la anotación del ${P} a ${P} entre ${P} espacios$`),
		run: (world, anotada, texto, cantidad) => editarElTexto(world, anotada, `${espacios(cantidad)}${texto}${espacios(cantidad)}`)
	},
	{
		pattern: new RegExp(`^edito el texto de la anotación del ${P} a ${P} espacios$`),
		run: (world, anotada, cantidad) => editarElTexto(world, anotada, espacios(cantidad))
	},
	{
		pattern: new RegExp(`^${OTRO} edita el texto de la anotación del ${P} a ${P}$`),
		run: (world, anotada, texto) => editarElTexto(world, anotada, texto)
	},
	{
		pattern: new RegExp(`^borro la anotación del ${P}$`),
		run: (world, anotada) => borrarLaAnotacion(world, anotada)
	},
	{
		pattern: new RegExp(`^${OTRO} borra la anotación del ${P}$`),
		run: (world, anotada) => borrarLaAnotacion(world, anotada)
	},
	{
		pattern: new RegExp(`^las anotaciones huérfanas a limpiar son solo la del ${P}$`),
		run: (world, anotada) =>
			expect(anotacionesHuerfanas(tareasDe(world), world.anotaciones).map(({ id }) => id)).toEqual([laDelMomento(world, anotada).id])
	}
];
