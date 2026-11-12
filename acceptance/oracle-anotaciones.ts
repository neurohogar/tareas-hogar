// Oráculo de las anotaciones (spec §4.5, §5.10, §6.7, §6.2, §7), escrito desde el spec. NO importa el
// core ni los step handlers: es una segunda implementación, así que la implementación no juzga a sus
// propios tests. Simula el escenario (lo guardado, dónde está la persona, el panel y el aviso de
// deshacer) y devuelve lo que cada paso Then observa. Todo lo que no reconoce o no puede decidir
// (por ejemplo dos anotaciones del mismo instante sin ids) lanza `Indeciso`: el resultado es
// undefined y la mutación no se filtra.
import { fecha, type FilaOraculo, type PasoOraculo } from './oracle';
import { avisoSeVe, encabezadoDeDia } from './oracle-historial';

class Indeciso extends Error {}
const indeciso = (motivo: string): never => {
	throw new Indeciso(motivo);
};

interface Tarea {
	/** Como se llamó al declararla: así la nombran los pasos. */
	nombre: string;
	titulo: string;
	emoji?: string;
	borrada: boolean;
}

interface Anotacion {
	id: string;
	en: number;
	sentido: string;
	pantalla: string;
	tarea?: Tarea;
	texto?: string;
	borrada: boolean;
}

interface Mundo {
	tareas: Tarea[];
	completados: { tarea: Tarea; en: number }[];
	anotaciones: Anotacion[];
	pantalla?: string;
	/** El panel de edición abierto: la tarea, si se abrió para editar. */
	panel?: { tarea?: Tarea };
	/** El aviso del último completado de este dispositivo (§5.4). */
	aviso?: { tarea: Tarea; en: number };
	siguiente: number;
	ultima?: Anotacion;
	/** Las anotaciones que mostró la última consulta de Anotaciones y el texto de la última copia. */
	vista?: string;
	copia?: string[];
}

const SENTIDOS = ['Me sirvió', 'Me molestó'];
const PANTALLAS_ACTUALES = ['Pendientes', 'Historial', 'Etiquetas', 'Anotaciones'];
const PANTALLAS = [...PANTALLAS_ACTUALES, 'Panel de edición'];

const conValores = (texto: string, fila: FilaOraculo) => texto.replace(/<([A-Za-z0-9_]+)>/g, (_, columna: string) => fila[columna] ?? '<?>');

const momento = (valor: string) => fecha(valor) ?? indeciso(`fecha ${valor}`);
const sentidoDe = (valor: string) => (SENTIDOS.includes(valor) ? valor : indeciso(`sentido ${valor}`));
const pantallaDe = (valor: string) => (PANTALLAS.includes(valor) ? valor : indeciso(`pantalla ${valor}`));

function espacios(valor: string): string {
	const n = Number(valor);
	if (valor.trim() === '' || !Number.isInteger(n) || n < 0 || n > 100_000) return indeciso(`espacios ${valor}`);
	return ' '.repeat(n);
}

/** §4.5: se recortan los espacios del inicio y del final; vacío es sin texto. */
const recortado = (texto: string): string | undefined => texto.trim() || undefined;

const dosDigitos = (n: number) => String(n).padStart(2, '0');
const horaDe = (en: number) => `${dosDigitos(new Date(en).getHours())}:${dosDigitos(new Date(en).getMinutes())}`;
const fechaYHoraDe = (en: number) => {
	const d = new Date(en);
	return `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())} ${horaDe(en)}`;
};

function laTarea(mundo: Mundo, nombre: string): Tarea {
	return mundo.tareas.find((tarea) => tarea.nombre === nombre) ?? indeciso(`tarea ${nombre}`);
}

function laAnotacion(mundo: Mundo, anotada: string): Anotacion {
	const en = momento(anotada);
	const delMomento = mundo.anotaciones.filter((anotacion) => anotacion.en === en);
	return delMomento.length === 1 ? delMomento[0] : indeciso(`anotación del ${anotada}`);
}

function nueva(mundo: Mundo, sentido: string, pantalla: string, en: number, tarea?: Tarea, texto?: string): Anotacion {
	const anotacion: Anotacion = { id: `~${String(mundo.siguiente++).padStart(6, '0')}`, en, sentido, pantalla, tarea, texto, borrada: false };
	mundo.anotaciones.push(anotacion);
	mundo.ultima = anotacion;
	return anotacion;
}

/** §5.10: el panel manda sobre el aviso de deshacer; con el panel cerrado, el aviso solo si se ve. */
function anotoYo(mundo: Mundo, sentido: string, ahora: string, texto = ''): void {
	const en = momento(ahora);
	if (mundo.pantalla === undefined) indeciso('sin pantalla');
	const tarea = mundo.panel ? mundo.panel.tarea : mundo.aviso && avisoSeVe(mundo.aviso.en, en) ? mundo.aviso.tarea : undefined;
	nueva(mundo, sentidoDe(sentido), mundo.panel ? 'Panel de edición' : (mundo.pantalla as string), en, tarea, recortado(texto));
}

/** Otro dispositivo, sin panel; sobre una tarea solo con su aviso de deshacer a la vista. */
function anotaElOtro(mundo: Mundo, sentido: string, pantalla: string, ahora: string, titulo?: string): void {
	if (!PANTALLAS_ACTUALES.includes(pantalla)) indeciso(`pantalla ${pantalla}`);
	nueva(mundo, sentidoDe(sentido), pantalla, momento(ahora), titulo === undefined ? undefined : laTarea(mundo, titulo));
}

/** §7: borrar gana sobre editar; una edición de una anotación borrada no la revive. */
function editoElTexto(mundo: Mundo, anotada: string, texto: string): void {
	const anotacion = laAnotacion(mundo, anotada);
	if (!anotacion.borrada) anotacion.texto = recortado(texto);
}

function borroLaAnotacion(mundo: Mundo, anotada: string): void {
	laAnotacion(mundo, anotada).borrada = true;
}

/** §6.2, §7: se borran la tarea, sus completados y sus anotaciones, y solo las suyas. */
function borroLaTarea(mundo: Mundo, nombre: string): void {
	const tarea = laTarea(mundo, nombre);
	tarea.borrada = true;
	mundo.completados = mundo.completados.filter((completado) => completado.tarea !== tarea);
	for (const anotacion of mundo.anotaciones) if (anotacion.tarea === tarea) anotacion.borrada = true;
}

const nombreDe = ({ titulo, emoji }: Tarea) => (emoji ? `${emoji} ${titulo}` : titulo);

/** §6.7: las de tarea existente o sin tarea; las huérfanas y las de tareas borradas no se muestran. */
const visibles = (mundo: Mundo) => mundo.anotaciones.filter((anotacion) => !anotacion.borrada && !anotacion.tarea?.borrada);

/** §6.7: con el mismo instante, primero la de id menor; sin ids que desempaten no se decide. */
function ordenadas(mundo: Mundo, masRecientePrimero: boolean): Anotacion[] {
	const lista = visibles(mundo);
	const sinDesempate = lista.some((a, i) => lista.some((b, j) => i < j && a.en === b.en && (a.id.startsWith('~') || b.id.startsWith('~') || a.id === b.id)));
	if (sinDesempate) indeciso('empate sin ids');
	return [...lista].sort((a, b) => (masRecientePrimero ? b.en - a.en : a.en - b.en) || (a.id < b.id ? -1 : 1));
}

const partes = (anotacion: Anotacion, delante: string) =>
	[delante, anotacion.sentido, anotacion.pantalla, anotacion.tarea && nombreDe(anotacion.tarea), anotacion.texto].filter((parte) => parte !== undefined).join(' · ');

/** §6.7: grupos "<encabezado>: <anotaciones>" con "; ", anotaciones con ", ". */
function pantallaDeAnotaciones(mundo: Mundo, ahora: number): string {
	const grupos: { encabezado: string; textos: string[] }[] = [];
	for (const anotacion of ordenadas(mundo, true)) {
		const encabezado = encabezadoDeDia(anotacion.en, ahora);
		const texto = partes(anotacion, horaDe(anotacion.en));
		const ultimo = grupos.at(-1);
		if (ultimo?.encabezado === encabezado) ultimo.textos.push(texto);
		else grupos.push({ encabezado, textos: [texto] });
	}
	return grupos.map(({ encabezado, textos }) => `${encabezado}: ${textos.join(', ')}`).join('; ');
}

/** §6.7: una línea por anotación que la pantalla muestra, de la más antigua a la más reciente. */
const lineasCopiadas = (mundo: Mundo) => ordenadas(mundo, false).map((anotacion) => partes(anotacion, fechaYHoraDe(anotacion.en)));

type Lector = [RegExp, (mundo: Mundo, ...capturas: string[]) => void];

const SENTIDO = '(Me sirvió|Me molestó)';
const PANTALLA = `(${PANTALLAS.join('|')})`;
const OTRO = 'otro dispositivo, sin ver ese cambio,';

const LECTORES: Lector[] = [
	[
		/^una tarea puntual (\S+) (?:sin|con) fecha límite(?: (?:\d{4}-\d{2}-\d{2}))?(?: con emoji (\S+))?$/,
		(mundo, nombre, emoji) => void mundo.tareas.push({ nombre, titulo: nombre, emoji, borrada: false })
	],
	[/^estoy en (\S+)$/, (mundo, pantalla) => void (mundo.pantalla = PANTALLAS_ACTUALES.includes(pantalla) ? pantalla : indeciso(pantalla))],
	[/^el panel de edición está abierto al editar la tarea (\S+)$/, (mundo, nombre) => void (mundo.panel = { tarea: laTarea(mundo, nombre) })],
	[/^el panel de edición está abierto al crear una tarea$/, (mundo) => void (mundo.panel = {})],
	[
		/^completo la tarea (\S+) el (\S+)$/,
		(mundo, nombre, en) => {
			const tarea = laTarea(mundo, nombre);
			mundo.completados.push({ tarea, en: momento(en) });
			mundo.aviso = { tarea, en: momento(en) };
		}
	],
	[/^la tarea (\S+) fue completada el (\S+)$/, (mundo, nombre, en) => void mundo.completados.push({ tarea: laTarea(mundo, nombre), en: momento(en) })],
	[
		/^edito el título a (\S+)$/,
		(mundo, titulo) => {
			const vivas = mundo.tareas.filter(({ borrada }) => !borrada);
			if (vivas.length !== 1) indeciso('título de varias tareas');
			vivas[0].titulo = titulo;
		}
	],
	[new RegExp(`^anoto ${SENTIDO} el (\\S+)$`), (mundo, sentido, ahora) => anotoYo(mundo, sentido, ahora)],
	[
		new RegExp(`^anoto ${SENTIDO} el (\\S+) con el texto (.+?) entre (\\S+) espacios$`),
		(mundo, sentido, ahora, texto, n) => anotoYo(mundo, sentido, ahora, `${espacios(n)}${texto}${espacios(n)}`)
	],
	[new RegExp(`^anoto ${SENTIDO} el (\\S+) con el texto (.+)$`), (mundo, sentido, ahora, texto) => anotoYo(mundo, sentido, ahora, texto)],
	[new RegExp(`^anoto ${SENTIDO} el (\\S+) con (\\S+) espacios como texto$`), (mundo, sentido, ahora, n) => anotoYo(mundo, sentido, ahora, espacios(n))],
	[
		new RegExp(`^anoto ${SENTIDO} el (\\S+) con un texto de (\\S+) caracteres$`),
		(mundo, sentido, ahora, largo) => anotoYo(mundo, sentido, ahora, 'a'.repeat(Number(largo) >= 0 && Number(largo) <= 100_000 ? Number(largo) : indeciso(largo)))
	],
	[new RegExp(`^${OTRO} anota ${SENTIDO} en ${PANTALLA} el (\\S+)$`), (mundo, sentido, pantalla, ahora) => anotaElOtro(mundo, sentido, pantalla, ahora)],
	[
		new RegExp(`^${OTRO} anota ${SENTIDO} en ${PANTALLA} el (\\S+) sobre la tarea (\\S+)$`),
		(mundo, sentido, pantalla, ahora, titulo) => anotaElOtro(mundo, sentido, pantalla, ahora, titulo)
	],
	[
		new RegExp(`^una anotación ${SENTIDO} en ${PANTALLA} del (\\S+)$`),
		(mundo, sentido, pantalla, anotada) => void nueva(mundo, sentido, pantallaDe(pantalla), momento(anotada))
	],
	[
		/^la anotación se refiere a la tarea (\S+)$/,
		(mundo, nombre) => void ((mundo.ultima ?? indeciso('sin anotación')).tarea = laTarea(mundo, nombre))
	],
	[/^la anotación dice (.+)$/, (mundo, texto) => void ((mundo.ultima ?? indeciso('sin anotación')).texto = recortado(texto))],
	[/^la anotación se registró con id (\S+)$/, (mundo, id) => void ((mundo.ultima ?? indeciso('sin anotación')).id = id)],
	[/^consulto Anotaciones el (\S+)$/, (mundo, ahora) => void (mundo.vista = pantallaDeAnotaciones(mundo, momento(ahora)))],
	[/^copio las anotaciones$/, (mundo) => void (mundo.copia = lineasCopiadas(mundo))],
	[
		/^edito el texto de la anotación del (\S+) a (.+?) entre (\S+) espacios$/,
		(mundo, anotada, texto, n) => editoElTexto(mundo, anotada, `${espacios(n)}${texto}${espacios(n)}`)
	],
	[/^edito el texto de la anotación del (\S+) a (\S+) espacios$/, (mundo, anotada, n) => editoElTexto(mundo, anotada, espacios(n))],
	[/^edito el texto de la anotación del (\S+) a (.+)$/, (mundo, anotada, texto) => editoElTexto(mundo, anotada, texto)],
	[new RegExp(`^${OTRO} edita el texto de la anotación del (\\S+) a (.+)$`), (mundo, anotada, texto) => editoElTexto(mundo, anotada, texto)],
	[/^borro la anotación del (\S+)$/, (mundo, anotada) => borroLaAnotacion(mundo, anotada)],
	[new RegExp(`^${OTRO} borra la anotación del (\\S+)$`), (mundo, anotada) => borroLaAnotacion(mundo, anotada)],
	[/^borro la tarea (\S+)$/, (mundo, nombre) => borroLaTarea(mundo, nombre)]
];

const guardadas = (mundo: Mundo) => mundo.anotaciones.filter(({ borrada }) => !borrada);
const sinDefinir = (texto: string | undefined) => texto ?? '<sin texto>';

/** Cada Then: lo que el oráculo observa y lo que el paso afirma. */
type Observador = [RegExp, (mundo: Mundo, ...capturas: string[]) => [observado: string, afirmado: string]];

const OBSERVADORES: Observador[] = [
	[/^queda una sola anotación$/, (mundo) => [String(guardadas(mundo).length), '1']],
	[/^quedan (\S+) anotaciones$/, (mundo, n) => [String(guardadas(mundo).length), n]],
	[/^no queda ninguna anotación$/, (mundo) => [String(guardadas(mundo).length), '0']],
	[/^no existe la anotación del (\S+)$/, (mundo, anotada) => [String(!laAnotacion(mundo, anotada).borrada), 'false']],
	[
		/^la anotación del (\S+) tiene sentido (Me sirvió|Me molestó) en (.+)$/,
		(mundo, anotada, sentido, pantalla) => {
			const anotacion = laAnotacion(mundo, anotada);
			return [`${anotacion.sentido}|${anotacion.pantalla}`, `${sentido}|${pantalla}`];
		}
	],
	[/^la anotación del (\S+) es de la tarea (\S+)$/, (mundo, anotada, nombre) => [laAnotacion(mundo, anotada).tarea?.nombre ?? '<sin tarea>', nombre]],
	[/^la anotación del (\S+) no es de ninguna tarea$/, (mundo, anotada) => [String(laAnotacion(mundo, anotada).tarea === undefined), 'true']],
	[/^la anotación del (\S+) dice un texto de (\S+) caracteres$/, (mundo, anotada, largo) => [String(laAnotacion(mundo, anotada).texto?.length), largo]],
	[/^la anotación del (\S+) dice (.+)$/, (mundo, anotada, texto) => [sinDefinir(laAnotacion(mundo, anotada).texto), texto]],
	[/^la anotación del (\S+) no tiene texto$/, (mundo, anotada) => [String(laAnotacion(mundo, anotada).texto === undefined), 'true']],
	[/^el panel sigue abierto sin cambios sin guardar$/, (mundo) => [String(mundo.panel !== undefined && guardadas(mundo).length > 0), 'true']],
	[/^Anotaciones muestra (.+)$/, (mundo, esperado) => [mundo.vista ?? indeciso('sin consulta'), esperado]],
	[/^Anotaciones está vacía$/, (mundo) => [mundo.vista ?? indeciso('sin consulta'), '']],
	[/^el texto copiado tiene las líneas (.+)$/, (mundo, lineas) => [(mundo.copia ?? indeciso('sin copia')).join('; '), lineas]],
	[/^no hay nada para copiar$/, (mundo) => [String((mundo.copia ?? indeciso('sin copia')).length), '0']],
	[
		/^las anotaciones huérfanas a limpiar son solo la del (\S+)$/,
		(mundo, anotada) => [
			// §7: una anotación de una tarea que ya no existe, que nadie borró con ella.
			mundo.anotaciones
				.filter((anotacion) => !anotacion.borrada && anotacion.tarea?.borrada)
				.map(({ en }) => en)
				.join(','),
			String(momento(anotada))
		]
	],
	[/^no existe la tarea (\S+)$/, (mundo, nombre) => [String(!laTarea(mundo, nombre).borrada), 'false']],
	[/^no queda ningún completado de (\S+)$/, (mundo, nombre) => [String(mundo.completados.filter(({ tarea }) => tarea === laTarea(mundo, nombre)).length), '0']],
	[
		/^la tarea (\S+) conserva un solo completado, del (\S+)$/,
		(mundo, nombre, completada) => [mundo.completados.filter(({ tarea }) => tarea === laTarea(mundo, nombre)).map(({ en }) => en).join(','), String(momento(completada))]
	]
];

const PATRONES_DE_ESCENARIO = [
	/^anoto /,
	/^una anotación /,
	/^consulto Anotaciones el /,
	/^copio las anotaciones$/,
	/^edito el texto de la anotación /,
	/^borro la anotación /,
	/ (?:anota|edita el texto de la anotación|borra la anotación) /
];

export const esEscenarioDeAnotaciones = (textos: string[]) => textos.some((texto) => PATRONES_DE_ESCENARIO.some((patron) => patron.test(texto)));

/** Lo que observa y lo que afirma cada Then: undefined si el oráculo no reconoce o no decide el escenario. */
export function observarAnotaciones(entradas: PasoOraculo[], thens: PasoOraculo[], fila: FilaOraculo): { observado: string[]; afirmado: string[] } | undefined {
	const mundo: Mundo = { tareas: [], completados: [], anotaciones: [], siguiente: 1 };
	try {
		for (const paso of entradas) {
			const texto = conValores(paso.text, fila);
			const lector = LECTORES.find(([patron]) => patron.test(texto));
			if (!lector) return undefined;
			lector[1](mundo, ...(lector[0].exec(texto) as RegExpExecArray).slice(1));
		}
		const observado: string[] = [];
		const afirmado: string[] = [];
		for (const paso of thens) {
			const texto = conValores(paso.text, fila);
			const observador = OBSERVADORES.find(([patron]) => patron.test(texto));
			if (!observador) return undefined;
			const [visto, dicho] = observador[1](mundo, ...(observador[0].exec(texto) as RegExpExecArray).slice(1));
			observado.push(visto);
			afirmado.push(dicho);
		}
		return { observado, afirmado };
	} catch (error) {
		if (error instanceof Indeciso) return undefined;
		throw error;
	}
}
