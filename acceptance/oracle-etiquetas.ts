// Oráculo de etiquetas y del filtro por etiqueta: simula, con las reglas de docs/spec.md
// (§4.3 etiqueta, color y orden; §6.1 filtro; §6.2 etiquetas en el panel; §6.4 pantalla
// Etiquetas; §7 conflictos), los escenarios que crean, editan, renombran, recolorean o
// borran etiquetas, y devuelve lo que cada paso Then observa y lo que afirma.
// NO importa el core ni los step handlers: es una segunda implementación escrita desde
// el spec, así que la implementación no juzga a sus propios tests.
//
// Lo que el spec no decide o el oráculo no reconoce lanza `Indeciso`, y el resultado es
// undefined (no se filtra). Un nombre que un paso busca "exacto" y no existe también es
// indeciso: ese escenario falla al correr, y es una mutación que debe matarse.
import { COLACION, MOSTRAR_COMPLETADAS, MOSTRAR_PAUSADAS, REGLAS_DEL_ORDEN, dia, fecha, ordenarPendientes, resolver, soloLasRapidas, type FilaOraculo, type PasoOraculo, type TareaDelOrden } from './oracle';

class Indeciso extends Error {}
const indeciso = (motivo: string): never => {
	throw new Indeciso(motivo);
};

/** §4.3: la paleta, en orden. */
const PALETA = ['gris', 'rojo', 'naranja', 'amarillo', 'verde', 'celeste', 'azul', 'violeta'];
/** §4.3: el nombre tiene de 1 a 30 caracteres. */
const LARGO_MAXIMO = 30;

interface Etiqueta {
	id: number;
	nombre: string;
	color: string;
}

/** Una tarea guardada: su documento tiene los ids de sus etiquetas (§4.1). */
interface Documento {
	id: number;
	t: TareaDelOrden;
	etiquetas: number[];
}

interface Guardado {
	etiquetas: Etiqueta[];
	docs: Documento[];
}

interface Mundo {
	guardado: Guardado;
	/** Lo guardado justo antes de mi último cambio: lo que ve el otro dispositivo (§7). */
	antes?: Guardado;
	siguienteEtiqueta: number;
	siguienteDocumento: number;
	/** Rechazo de la última creación o edición, y del último renombrado. */
	rechazo?: string;
	rechazoDeRenombrado?: string;
	/** La etiqueta elegida en el filtro de Pendientes; sin ella, "Todas". */
	filtro?: number;
	/** El check "Mostrar completadas" (§6.1); sin él, apagado. */
	mostrarCompletadas?: boolean;
	mostrarPausadas?: boolean;
	/** El botón "Solo rápidas" (§6.1); sin él, apagado. */
	soloRapidas?: boolean;
	orden?: string;
}

/** Cómo queda lo guardado con un cambio ya calculado. */
type Efecto = (guardado: Guardado) => void;

const copiar = (guardado: Guardado): Guardado => structuredClone(guardado);

// ---- Reglas de §4.3 ----

/** Dos nombres son el mismo sin distinguir mayúsculas; los acentos sí cuentan. */
const mismoNombre = (a: string, b: string) => a.normalize('NFC').toLowerCase() === b.normalize('NFC').toLowerCase();

type Nombre = { nombre: string } | { error: string };

/** Sin los espacios de los extremos, de 1 a 30 caracteres. */
function validarNombre(escrito: string): Nombre {
	const nombre = escrito.trim();
	if (nombre === '') return { error: 'vacío' };
	return [...nombre].length > LARGO_MAXIMO ? { error: 'demasiado largo' } : { nombre };
}

/** El color de la paleta que menos etiquetas tienen; si empatan, el primero de la paleta. */
function colorMenosUsado(usados: string[]): string {
	const veces = (color: string) => usados.filter((usado) => usado === color).length;
	let elegido = PALETA[0];
	for (const color of PALETA) if (veces(color) < veces(elegido)) elegido = color;
	return elegido;
}

/** Alfabético en español (sin mayúsculas ni acentos, ñ después de la n); si empatan, por id. */
const ordenadas = (etiquetas: Etiqueta[]) => [...etiquetas].sort((a, b) => COLACION.compare(a.nombre, b.nombre) || a.id - b.id);

// ---- Valores de los pasos ----

const PLACEHOLDER = /^<([A-Za-z0-9_]+)>$/;
const P = '(<[A-Za-z0-9_]+>)';
const TITULO = '(\\S+)';

function lista(valor: string): string[] {
	const elementos = valor.split(',').map((elemento) => elemento.trim());
	return elementos.some((elemento) => elemento === '') ? indeciso(`lista ${valor}`) : elementos;
}

const normalizada = (valor: string) => lista(valor).join(', ');

function color(valor: string): string {
	return PALETA.includes(valor) ? valor : indeciso(`color ${valor}`);
}

/** En los pasos que nombran una etiqueta, el nombre es exacto y la identifica. */
function laLlamada(guardado: Guardado, nombre: string): Etiqueta {
	const llamadas = guardado.etiquetas.filter((etiqueta) => etiqueta.nombre === nombre);
	return llamadas.length === 1 ? llamadas[0] : indeciso(`etiqueta ${nombre}`);
}

function laTitulada(guardado: Guardado, titulo: string): Documento {
	const tituladas = guardado.docs.filter((doc) => doc.t.titulo === titulo);
	return tituladas.length === 1 ? tituladas[0] : indeciso(`tarea ${titulo}`);
}

const sinExtremos = (valor: string) => valor.trim();

// ---- Elegir las etiquetas escritas en el panel (§4.3 Creación, §6.2) ----

interface Elegidas {
	/** Los ids de las etiquetas de la tarea, en el orden escrito. */
	ids: number[];
	nuevas: Etiqueta[];
}

/** Un nombre inválido rechaza todo; si hay dos motivos distintos, el spec no dice cuál se informa. */
function motivoDeRechazo(motivos: string[]): string | undefined {
	const distintos = [...new Set(motivos)];
	return distintos.length > 1 ? indeciso(`dos motivos ${distintos.join(' y ')}`) : distintos[0];
}

function elegir(m: Mundo, escritas: string[], existentes: Etiqueta[]): Elegidas | { error: string } {
	const validados = escritas.map(validarNombre);
	const error = motivoDeRechazo(validados.flatMap((v) => ('error' in v ? [`nombre de etiqueta ${v.error}`] : [])));
	if (error) return { error };
	const ids: number[] = [];
	const nuevas: Etiqueta[] = [];
	for (const validado of validados) {
		const { nombre } = validado as { nombre: string };
		const elegidas = [...existentes, ...nuevas].filter((etiqueta) => ids.includes(etiqueta.id));
		if (elegidas.some((etiqueta) => mismoNombre(etiqueta.nombre, nombre))) continue;
		const existente = existentes.find((etiqueta) => mismoNombre(etiqueta.nombre, nombre));
		if (existente) {
			ids.push(existente.id);
			continue;
		}
		const usados = [...existentes, ...nuevas].map(({ color }) => color);
		const nueva = { id: m.siguienteEtiqueta++, nombre, color: colorMenosUsado(usados) };
		nuevas.push(nueva);
		ids.push(nueva.id);
	}
	return { ids, nuevas };
}

// ---- Cambios (los calcula quien los hace con lo que ve; después llegan a lo guardado) ----

type Calcular = (m: Mundo, vista: Guardado, ...valores: string[]) => Efecto | undefined;

const mismosIds = (a: number[], b: number[]) => a.length === b.length && a.every((id) => b.includes(id));

interface Panel {
	titulo?: string;
	escritas?: string[];
	limite?: string;
}

/** Guardar el panel de una tarea (§6.2): la edición se rechaza entera si algo es inválido, y escribe solo lo que cambió (§7). */
function guardarPanel(m: Mundo, vista: Guardado, tituloActual: string, panel: Panel): Efecto | undefined {
	const doc = laTitulada(vista, tituloActual);
	const motivos: string[] = [];
	if (panel.titulo !== undefined && sinExtremos(panel.titulo) === '') motivos.push('título vacío');
	if (panel.limite !== undefined && !dia(panel.limite)) indeciso(`fecha ${panel.limite}`);
	const elegidas = panel.escritas === undefined ? undefined : elegir(m, panel.escritas, vista.etiquetas);
	if (elegidas && 'error' in elegidas) motivos.push(elegidas.error);
	const rechazo = motivoDeRechazo(motivos);
	if (rechazo) {
		m.rechazo = rechazo;
		return undefined;
	}
	const nuevoLimite = panel.limite === undefined ? undefined : dia(panel.limite);
	const ids = elegidas && 'ids' in elegidas ? elegidas : undefined;
	return (guardado) => {
		guardado.etiquetas.push(...(ids?.nuevas ?? []));
		const tarea = guardado.docs.find(({ id }) => id === doc.id);
		if (!tarea) return;
		if (panel.titulo !== undefined && sinExtremos(panel.titulo) !== doc.t.titulo) tarea.t.titulo = sinExtremos(panel.titulo);
		if (nuevoLimite && nuevoLimite.getTime() !== doc.t.limite?.getTime()) tarea.t.limite = nuevoLimite;
		if (ids && !mismosIds(doc.etiquetas, ids.ids)) tarea.etiquetas = ids.ids;
	};
}

/** §6.4 Renombrar: valida como al crear y se rechaza si otra etiqueta tiene ese nombre. */
function renombrar(m: Mundo, vista: Guardado, nombre: string, escrito: string): Efecto | undefined {
	const etiqueta = laLlamada(vista, nombre);
	const validado = validarNombre(escrito);
	const repetido = 'nombre' in validado && vista.etiquetas.some((otra) => otra.id !== etiqueta.id && mismoNombre(otra.nombre, validado.nombre));
	const error = 'error' in validado ? `nombre ${validado.error}` : repetido ? 'nombre repetido' : undefined;
	if (error) {
		m.rechazoDeRenombrado = error;
		return undefined;
	}
	const nuevo = (validado as { nombre: string }).nombre;
	return (guardado) => {
		const actual = guardado.etiquetas.find(({ id }) => id === etiqueta.id);
		if (actual) actual.nombre = nuevo;
	};
}

/** §7: nombre y color son campos independientes; si la etiqueta ya no existe, el cambio se descarta. */
function recolorear(_: Mundo, vista: Guardado, nombre: string, nuevo: string): Efecto {
	const { id } = laLlamada(vista, nombre);
	const elegido = color(nuevo);
	return (guardado) => {
		const actual = guardado.etiquetas.find((etiqueta) => etiqueta.id === id);
		if (actual) actual.color = elegido;
	};
}

/** §4.3: borrar la etiqueta la quita de las tareas; las que la tienen y quien borra no ve quedan con una referencia rota (§7). */
function borrar(_: Mundo, vista: Guardado, nombre: string): Efecto {
	const { id } = laLlamada(vista, nombre);
	const loSabia = (docId: number) => vista.docs.find((doc) => doc.id === docId)?.etiquetas.includes(id) ?? false;
	return (guardado) => {
		if (guardado.docs.some((doc) => doc.etiquetas.includes(id) && !loSabia(doc.id))) indeciso('referencia que quien borra no ve');
		guardado.etiquetas = guardado.etiquetas.filter((etiqueta) => etiqueta.id !== id);
		for (const doc of guardado.docs) doc.etiquetas = doc.etiquetas.filter((otra) => otra !== id);
	};
}

/** §7 Etiquetas duplicadas: sobrevive la de id menor; las tareas de la otra pasan a la sobreviviente, sin repetirla. */
function fusionar(m: Mundo): void {
	const { etiquetas, docs } = m.guardado;
	const sobreviviente = (etiqueta: Etiqueta) =>
		Math.min(...etiquetas.filter((otra) => mismoNombre(otra.nombre, etiqueta.nombre)).map(({ id }) => id));
	const destino = new Map(etiquetas.map((etiqueta) => [etiqueta.id, sobreviviente(etiqueta)]));
	for (const doc of docs) doc.etiquetas = [...new Set(doc.etiquetas.map((id) => destino.get(id) ?? id))];
	m.guardado.etiquetas = etiquetas.filter((etiqueta) => destino.get(etiqueta.id) === etiqueta.id);
}

// ---- Quién hace el cambio ----

type Actor = 'yo' | 'otro';

function actuar(m: Mundo, actor: Actor, calcular: (vista: Guardado) => Efecto | undefined): void {
	if (actor === 'yo') {
		m.antes = copiar(m.guardado);
		calcular(m.guardado)?.(m.guardado);
		return;
	}
	const efecto = calcular(m.antes ?? copiar(m.guardado));
	if (!efecto) return;
	efecto(m.guardado);
	if (m.antes) efecto(m.antes);
}

// ---- Pasos ----

type Paso = [RegExp, (m: Mundo, c: string[], fila: FilaOraculo) => void];

const OTRO = 'otro dispositivo, sin ver ese cambio,';
const SUJETOS: [Actor, string][] = [
	['yo', ''],
	['otro', `${OTRO} `]
];

/** El valor de una captura: un `<parametro>` se reemplaza por el de la fila; el resto es literal. */
function valorDe(captura: string, fila: FilaOraculo): string {
	const placeholder = PLACEHOLDER.exec(captura);
	if (!placeholder) return captura;
	return fila[placeholder[1]] ?? indeciso(`columna ${captura}`);
}

/** Un paso que actúa: "<verbo yo>/<verbo otro> <resto>" para quien lo hace. */
function conActor(verbos: { yo: string; otro: string }, resto: string, calcular: Calcular): Paso[] {
	return SUJETOS.map(([actor, prefijo]) => [
		new RegExp(`^${prefijo}${verbos[actor]} ${resto}$`),
		(m, c, fila) =>
			actuar(m, actor, (vista) =>
				calcular(
					m,
					vista,
					...c.map((captura) => valorDe(captura, fila))
				)
			)
	]);
}

function declararEtiqueta(valor: string): Omit<Etiqueta, 'id'> {
	const separador = valor.lastIndexOf(':');
	return separador <= 0 ? indeciso(`etiqueta ${valor}`) : { nombre: valor.slice(0, separador), color: color(valor.slice(separador + 1)) };
}

function crearConEtiquetas(m: Mundo, titulo: string, escritas: string[]): void {
	m.antes = copiar(m.guardado);
	const motivos = sinExtremos(titulo) === '' ? ['título vacío'] : [];
	const elegidas = elegir(m, escritas, m.guardado.etiquetas);
	if ('error' in elegidas) motivos.push(elegidas.error);
	const rechazo = motivoDeRechazo(motivos);
	if (rechazo || 'error' in elegidas) {
		m.rechazo = rechazo;
		return;
	}
	m.guardado.etiquetas.push(...elegidas.nuevas);
	const t: TareaDelOrden = { titulo: sinExtremos(titulo), creada: 0, puntual: true, completados: [], cubiertas: [] };
	m.guardado.docs.push({ id: m.siguienteDocumento++, t, etiquetas: elegidas.ids });
}

const PASOS_DE_ETIQUETAS: Paso[] = [
	[
		new RegExp(`^existen las etiquetas ${P}$`),
		(m, [declaradas], fila) => {
			for (const valor of lista(valorDe(declaradas, fila))) m.guardado.etiquetas.push({ id: m.siguienteEtiqueta++, ...declararEtiqueta(valor) });
		}
	],
	[
		new RegExp(`^la tarea ${TITULO} tiene las etiquetas ${P}$`),
		(m, [titulo, declaradas], fila) => {
			const doc = laTitulada(m.guardado, valorDe(titulo, fila));
			doc.etiquetas = lista(valorDe(declaradas, fila)).map((nombre) => laLlamada(m.guardado, nombre).id);
		}
	],
	[
		new RegExp(`^elegí el filtro ${P}$`),
		(m, [filtro], fila) => {
			const nombre = valorDe(filtro, fila);
			m.filtro = nombre === 'Todas' ? undefined : laLlamada(m.guardado, nombre).id;
		}
	],
	[
		new RegExp(`^creo una tarea puntual con título ${P}, sin fecha límite y con las etiquetas ${P}$`),
		(m, [titulo, escritas], fila) => crearConEtiquetas(m, valorDe(titulo, fila), lista(valorDe(escritas, fila)))
	],
	[/^la app fusiona las etiquetas duplicadas$/, (m) => fusionar(m)],
	[
		new RegExp(`^edito la tarea ${TITULO} para quitarle todas las etiquetas$`),
		(m, [titulo], fila) => actuar(m, 'yo', (vista) => guardarPanel(m, vista, valorDe(titulo, fila), { escritas: [] }))
	],
	[
		new RegExp(`^edito en una misma edición el título a ${P} y las etiquetas a ${P}$`),
		(m, [titulo, escritas], fila) => {
			if (m.guardado.docs.length === 0) indeciso('sin tareas');
			actuar(m, 'yo', (vista) =>
				guardarPanel(m, vista, vista.docs[0].t.titulo, { titulo: valorDe(titulo, fila), escritas: lista(valorDe(escritas, fila)) })
			);
		}
	],
	[
		new RegExp(`^edito la tarea ${TITULO} a puntual con fecha límite ${P}$`),
		(m, [titulo, limite], fila) =>
			actuar(m, 'yo', (vista) => guardarPanel(m, vista, valorDe(titulo, fila), { limite: valorDe(limite, fila) }))
	],
	[
		new RegExp(`^edito las etiquetas de la tarea ${TITULO} a una de solo espacios$`),
		(m, [titulo], fila) => actuar(m, 'yo', (vista) => guardarPanel(m, vista, valorDe(titulo, fila), { escritas: ['   '] }))
	],
	[
		new RegExp(`^edito las etiquetas de la tarea ${TITULO} a ${P} con espacios al principio y al final$`),
		(m, [titulo, escrita], fila) =>
			actuar(m, 'yo', (vista) => guardarPanel(m, vista, valorDe(titulo, fila), { escritas: [`  ${valorDe(escrita, fila)}  `] }))
	],
	[
		new RegExp(`^renombro la etiqueta ${P} a uno de solo espacios$`),
		(m, [nombre], fila) => actuar(m, 'yo', (vista) => renombrar(m, vista, valorDe(nombre, fila), '   '))
	],
	[
		new RegExp(`^renombro la etiqueta ${P} a ${P} con espacios al principio y al final$`),
		(m, [nombre, nuevo], fila) => actuar(m, 'yo', (vista) => renombrar(m, vista, valorDe(nombre, fila), `  ${valorDe(nuevo, fila)}  `))
	],
	[
		new RegExp(`^${OTRO} edita el título de la tarea ${TITULO} a ${TITULO}$`),
		(m, [titulo, nuevo], fila) =>
			actuar(m, 'otro', (vista) => guardarPanel(m, vista, valorDe(titulo, fila), { titulo: valorDe(nuevo, fila) }))
	],
	...conActor({ yo: 'edito', otro: 'edita' }, `las etiquetas de la tarea ${TITULO} a ${P}`, (m, vista, titulo, escritas) =>
		guardarPanel(m, vista, titulo, { escritas: lista(escritas) })
	),
	...conActor({ yo: 'renombro', otro: 'renombra' }, `la etiqueta ${P} a ${P}`, renombrar),
	...conActor({ yo: 'cambio', otro: 'cambia' }, `el color de la etiqueta ${P} a ${P}`, recolorear),
	...conActor({ yo: 'borro', otro: 'borra' }, `la etiqueta ${P}`, borrar)
];

// ---- Pendientes con el filtro (§6.1) ----

/**
 * Una puntual completada lo está siempre (§5.1); sin completar, depende de ahora solo con fecha límite. Una
 * pausada no depende de ahora (§5.8).
 */
const dependeDeAhora = (t: TareaDelOrden) =>
	t.pausada ? false : t.puntual ? t.limite !== undefined && t.completados.length === 0 && !t.conCompletadoSinMomento : t.completados.length > 0 || t.calendario !== undefined;

const etiquetaVigente = (m: Mundo) => m.guardado.etiquetas.find(({ id }) => id === m.filtro)?.id;

/** Los títulos de Pendientes con el filtro vigente (la etiqueta elegida, si todavía existe) y Solo rápidas; sin "ahora", la lista no depende de él. */
function pendientes(m: Mundo, ahora: number | undefined): string {
	const vigente = etiquetaVigente(m);
	const visibles = m.guardado.docs.filter((doc) => vigente === undefined || doc.etiquetas.includes(vigente));
	const conEtiqueta = visibles.map(({ t }) => t);
	const tareas = m.soloRapidas ? soloLasRapidas(conEtiqueta) : conEtiqueta;
	if (ahora === undefined && tareas.some(dependeDeAhora)) indeciso('el orden depende de ahora');
	return ordenarPendientes(tareas, ahora, m.mostrarCompletadas, m.mostrarPausadas) ?? indeciso('orden');
}

const PASOS_DE_PENDIENTES: Paso[] = [
	[
		new RegExp(`^consulto Pendientes el ${P}$`),
		(m, [ahora], fila) => void (m.orden = pendientes(m, fecha(valorDe(ahora, fila)) ?? indeciso('ahora')))
	],
	[/^consulto Pendientes en cualquier momento$/, (m) => void (m.orden = pendientes(m, undefined))],
	[new RegExp(`^${MOSTRAR_COMPLETADAS}$`), (m) => void (m.mostrarCompletadas = true)],
	[new RegExp(`^${MOSTRAR_PAUSADAS}$`), (m) => void (m.mostrarPausadas = true)],
	[
		new RegExp(`^Solo rápidas está ${P}$`),
		(m, [estado], fila) => {
			const valor = valorDe(estado, fila);
			if (valor !== 'encendido' && valor !== 'apagado') indeciso(`estado ${valor}`);
			m.soloRapidas = valor === 'encendido';
		}
	]
];

/** Las tareas y sus completados, con las reglas de §5 y §6.1 que ya modela el oráculo del orden. */
function pasoDeTarea(m: Mundo, texto: string): void {
	const tareas = m.guardado.docs.map(({ t }) => t);
	// Una relativa que nunca se completó, creada antes de cualquier otra fecha del escenario: el instante de creación no influye.
	const sinCompletar = /^una tarea periódica relativa (\S+) nunca completada$/.exec(texto);
	if (sinCompletar) tareas.push({ titulo: sinCompletar[1], creada: 0, puntual: false, completados: [], cubiertas: [] });
	else aplicarRegla(tareas, texto);
	for (const t of tareas.slice(m.guardado.docs.length)) m.guardado.docs.push({ id: m.siguienteDocumento++, t, etiquetas: [] });
}

function aplicarRegla(tareas: TareaDelOrden[], texto: string): void {
	const regla = REGLAS_DEL_ORDEN.map(([patron, aplicar]) => ({ coincide: patron.exec(texto), aplicar })).find((r) => r.coincide);
	if (!regla?.coincide || !regla.aplicar(tareas, regla.coincide.slice(1))) indeciso(`paso ${texto}`);
}

function ejecutar(entradas: PasoOraculo[], fila: FilaOraculo, m: Mundo): void {
	for (const entrada of entradas) {
		const regla = [...PASOS_DE_ETIQUETAS, ...PASOS_DE_PENDIENTES]
			.map(([patron, aplicar]) => ({ coincide: patron.exec(entrada.text), aplicar }))
			.find((r) => r.coincide);
		if (regla?.coincide) regla.aplicar(m, regla.coincide.slice(1), fila);
		else pasoDeTarea(m, resolver(entrada.text, fila) ?? indeciso(`columna faltante en ${entrada.text}`));
	}
}

// ---- Lo que cada Then observa y lo que afirma ----

/** Lo que el Then observa en el mundo, y el valor que el Then afirma (con el que debe coincidir). */
type Observacion = [RegExp, (m: Mundo, c: string[]) => [observado: string, afirmado: string]];

const nombres = (etiquetas: Etiqueta[]) => etiquetas.map(({ nombre }) => nombre).join(', ');
const chipsDe = (m: Mundo, doc: Documento) =>
	nombres(ordenadas(m.guardado.etiquetas.filter(({ id }) => doc.etiquetas.includes(id))));
const comoTexto = ({ nombre, color }: Etiqueta) => `${nombre}:${color}`;
const verdadero = (condicion: boolean): [string, string] => [String(condicion), 'true'];

/** El filtro ofrece "Todas" y una por etiqueta; sin etiquetas, la fila no se muestra. */
function chipsDelFiltro(m: Mundo): string {
	const etiquetas = ordenadas(m.guardado.etiquetas);
	return etiquetas.length === 0 ? '' : `Todas, ${nombres(etiquetas)}`;
}

const sinCambiar = (m: Mundo) => JSON.stringify(m.guardado.docs) === JSON.stringify((m.antes ?? indeciso('sin cambio mío')).docs);

const agregadas = <T extends { id: number }>(ahora: T[], antes: T[]) => ahora.filter(({ id }) => !antes.some((previa) => previa.id === id));

function laTareaQueSeCreo(m: Mundo): Documento {
	const nuevas = agregadas(m.guardado.docs, (m.antes ?? indeciso('sin cambio mío')).docs);
	return nuevas.length === 1 ? nuevas[0] : indeciso('no hay una tarea nueva');
}

/** §6.1: el texto de la lista vacía: con una etiqueta elegida, el del filtro; si no, con Solo rápidas encendido, el suyo. */
function textoDeListaVacia(m: Mundo): string {
	if (m.orden !== '') return indeciso('la lista no está vacía');
	if (etiquetaVigente(m) !== undefined) return 'No hay tareas con esta etiqueta';
	return m.soloRapidas ? 'No hay tareas rápidas' : indeciso('lista vacía sin filtros');
}

const OBSERVACIONES: Observacion[] = [
	[
		new RegExp(`^la tarea que se creó muestra las etiquetas (.*)$`),
		(m, [chips]) => [chipsDe(m, laTareaQueSeCreo(m)), normalizada(chips)]
	],
	[/^la tarea (\S+) muestra las etiquetas (.*)$/, (m, [titulo, chips]) => [chipsDe(m, laTitulada(m.guardado, titulo)), normalizada(chips)]],
	[/^la tarea (\S+) no muestra etiquetas$/, (m, [titulo]) => [chipsDe(m, laTitulada(m.guardado, titulo)), '']],
	[/^la pantalla Etiquetas muestra (.*)$/, (m, [etiquetas]) => [ordenadas(m.guardado.etiquetas).map(comoTexto).join(', '), normalizada(etiquetas)]],
	[/^la pantalla Etiquetas no muestra ninguna etiqueta$/, (m) => verdadero(m.guardado.etiquetas.length === 0)],
	[
		/^la etiqueta nueva tiene color (\S+)$/,
		(m, [esperado]) => [
			JSON.stringify(agregadas(m.guardado.etiquetas, (m.antes ?? indeciso('sin cambio mío')).etiquetas).map(({ color }) => color)),
			JSON.stringify([color(esperado)])
		]
	],
	[/^el filtro ofrece (.*)$/, (m, [chips]) => [chipsDelFiltro(m), normalizada(chips)]],
	[/^el filtro no se muestra$/, (m) => verdadero(chipsDelFiltro(m) === '')],
	[
		/^el filtro elegido es (.*)$/,
		(m, [esperado]) => [m.guardado.etiquetas.find(({ id }) => id === m.filtro)?.nombre ?? 'Todas', esperado]
	],
	[
		/^las tareas con etiquetas borradas a limpiar son solo (.*)$/,
		(m, [titulos]) => {
			const rotas = m.guardado.docs.filter((doc) => doc.etiquetas.some((id) => !m.guardado.etiquetas.some((e) => e.id === id)));
			return [rotas.map(({ t }) => t.titulo).join(', '), normalizada(titulos)];
		}
	],
	[/^el renombrado se rechaza por (.*)$/, (m, [motivo]) => [m.rechazoDeRenombrado ?? indeciso('no hubo rechazo'), motivo]],
	[/^la (?:creación|edición) se rechaza por (.*)$/, (m, [motivo]) => [m.rechazo ?? indeciso('no hubo rechazo'), motivo]],
	[/^la tarea no cambia$/, (m) => verdadero(sinCambiar(m))],
	[
		/^no se crea ninguna tarea nueva$/,
		(m) => verdadero(agregadas(m.guardado.docs, (m.antes ?? indeciso('sin cambio mío')).docs).length === 0)
	],
	[/^Pendientes muestra en orden (.*)$/, (m, [orden]) => [m.orden ?? indeciso('sin consulta'), normalizada(orden)]],
	[/^Pendientes no muestra ninguna tarea$/, (m) => [m.orden ?? indeciso('sin consulta'), '']],
	[/^Pendientes muestra el texto (.*)$/, (m, [texto]) => [textoDeListaVacia(m), texto]]
];

/** Los pasos de etiquetas y del filtro: estos escenarios se simulan con este oráculo. */
const ES_DE_ETIQUETAS = /etiqueta|elegí el filtro/;

export const esEscenarioDeEtiquetas = (textos: string[]) => textos.some((texto) => ES_DE_ETIQUETAS.test(texto));

export interface ObservacionesDeEtiquetas {
	/** Lo que cada Then observa tras ejecutar los pasos con la fila. */
	observado: string[];
	/** Lo que cada Then afirma con los valores de la fila. */
	afirmado: string[];
}

function observar(entradas: PasoOraculo[], thens: PasoOraculo[], fila: FilaOraculo): ObservacionesDeEtiquetas {
	const m: Mundo = { guardado: { etiquetas: [], docs: [] }, siguienteEtiqueta: 1, siguienteDocumento: 1 };
	ejecutar(entradas, fila, m);
	const resultados = thens.map((paso) => {
		const texto = resolver(paso.text, fila) ?? indeciso(`columna faltante en ${paso.text}`);
		const regla = OBSERVACIONES.map(([patron, ver]) => ({ coincide: patron.exec(texto), ver })).find((r) => r.coincide);
		return regla?.coincide ? regla.ver(m, regla.coincide.slice(1)) : indeciso(`Then ${texto}`);
	});
	return { observado: resultados.map(([observado]) => observado), afirmado: resultados.map(([, afirmado]) => afirmado) };
}

/**
 * Lo que observa y afirma cada Then tras ejecutar los pasos de entrada con la fila, o undefined si el oráculo
 * no reconoce algún paso o el spec no decide el resultado.
 */
export function observarEtiquetas(entradas: PasoOraculo[], thens: PasoOraculo[], fila: FilaOraculo): ObservacionesDeEtiquetas | undefined {
	try {
		return observar(entradas, thens, fila);
	} catch (error) {
		if (error instanceof Indeciso) return undefined;
		throw error;
	}
}
