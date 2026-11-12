// Oráculo del panel (§6.2), reescrito desde el spec. Dos partes:
// - En pestañas: corte de 40rem, secciones por modo, sección de cada campo, orden del primer error
//   y barra de Guardar con el teclado.
// - Cambios sin guardar y Atrás: qué cuenta como cambio, los avisos de cierre y de acción, y qué
//   cierra Atrás (también §5.8, §5.9 y §7, "gana el borrado").
// NO importa el core ni los step handlers.
import { NUMERO, elementos, escritasDe, fecha, horarioValido, intervaloMs, intervaloValido, posposicionDe, resolver, type FilaOraculo, type PasoOraculo, type Posposicion } from './oracle';

/** §6.2: "celular" es una pantalla de hasta 40rem de ancho, inclusive. */
const ANCHO_MAXIMO_DE_CELULAR = 40;
/** §6.2 Errores: la sección de cada campo, en el orden en que se ven los campos (§6.2 Tarea y Cuándo). */
const SECCION_DEL_CAMPO: [string, string][] = [
	['Título', 'Tarea'],
	['Etiquetas', 'Tarea'],
	['fecha límite', 'Cuándo'],
	['Cada', 'Cuándo'],
	['días', 'Cuándo'],
	['horario', 'Cuándo']
];
/** §6.2: al crear no hay Acciones; al editar aparece siempre. */
const SECCIONES_POR_MODO: Record<string, string> = { crear: 'Tarea, Cuándo', editar: 'Tarea, Cuándo, Acciones' };
/** §6.2: un campo enfocado sin teclado en pantalla no oculta la barra: el foco no decide. */
const FOCOS_DEL_PANEL = ['un campo está enfocado', 'ningún campo está enfocado'];

interface MundoDelPanel {
	ancho?: number;
	modo?: string;
	/** Los campos con error, en el orden en que se ven; undefined hasta que un paso los declara. */
	campos?: [string, string][];
	teclado?: string;
}

/** Los campos de la celda en el orden de §6.2; undefined si alguno no es un campo del panel. */
function camposDelPanel(valor: string): [string, string][] | undefined {
	if (valor === 'ninguno') return [];
	const nombres = elementos(valor);
	if (!nombres || nombres.some((nombre) => !SECCION_DEL_CAMPO.some(([campo]) => campo === nombre))) return undefined;
	return SECCION_DEL_CAMPO.filter(([campo]) => nombres.includes(campo));
}

const enPestanas = (m: MundoDelPanel) => m.ancho !== undefined && m.ancho <= ANCHO_MAXIMO_DE_CELULAR;

/** Cada Given del panel deja lo suyo en el mundo; devuelve false si el valor no es uno de los que el spec define. */
const ENTRADAS_DEL_PANEL: [RegExp, (m: MundoDelPanel, valor: string) => boolean][] = [
	[
		/^una pantalla de (\S+) rem de ancho$/,
		(m, valor) => {
			m.ancho = Number(valor);
			return NUMERO.test(valor) && m.ancho > 0;
		}
	],
	[
		/^el panel se abre para (.+)$/,
		(m, valor) => {
			m.modo = valor;
			return valor in SECCIONES_POR_MODO;
		}
	],
	[
		/^(?:el panel muestra errores|el guardado falla con errores) en los campos (.+)$/,
		(m, valor) => {
			m.campos = camposDelPanel(valor);
			return m.campos !== undefined;
		}
	],
	[
		/^el teclado en pantalla está (.+)$/,
		(m, valor) => {
			m.teclado = valor;
			return valor === 'abierto' || valor === 'cerrado';
		}
	],
	[/^el foco está (.+)$/, (_m, valor) => FOCOS_DEL_PANEL.includes(valor)]
];

/** Lo que cada Then observa según el spec; undefined si el mundo no alcanza para decidirlo. */
const OBSERVACIONES_DEL_PANEL: [RegExp, (m: MundoDelPanel) => string | undefined][] = [
	[/^el panel se presenta (.+)$/, (m) => (m.ancho === undefined ? undefined : enPestanas(m) ? 'en pestañas' : 'en secciones seguidas')],
	[/^el panel ofrece las secciones (.+)$/, (m) => (m.modo === undefined ? undefined : SECCIONES_POR_MODO[m.modo])],
	// §6.2: siempre abre en Tarea, al crear y al editar.
	[/^la pestaña abierta es (.+)$/, (m) => (m.modo === undefined ? undefined : 'Tarea')],
	[
		/^las secciones marcadas son (.+)$/,
		(m) => (m.campos === undefined ? undefined : [...new Set(m.campos.map(([, seccion]) => seccion))].join(', ') || 'ninguna')
	],
	// §6.2: Tarea antes que Cuándo; en pantallas anchas no hay pestañas.
	[/^el panel salta a la pestaña (.+)$/, (m) => (m.ancho === undefined || !m.campos?.length ? undefined : enPestanas(m) ? m.campos[0][1] : 'ninguna')],
	[/^el contenido se desplaza hasta el campo (.+)$/, (m) => m.campos?.[0]?.[0]],
	// §6.2: la barra se oculta solo mientras el teclado en pantalla está abierto.
	[/^la barra de Guardar está (.+)$/, (m) => (m.teclado === undefined ? undefined : m.teclado === 'abierto' ? 'oculta' : 'visible')]
];

const ES_DEL_PANEL = /^(?:una pantalla de |el panel se abre para |el panel muestra errores |el guardado falla con errores |el teclado en pantalla está )/;

export const esEscenarioDelPanel = (textos: string[]) => textos.some((texto) => ES_DEL_PANEL.test(texto));

function ejecutarEntradaDelPanel(texto: string, m: MundoDelPanel): boolean {
	const regla = ENTRADAS_DEL_PANEL.map(([patron, aplicar]) => ({ coincide: patron.exec(texto), aplicar })).find((r) => r.coincide);
	return regla?.coincide ? regla.aplicar(m, regla.coincide[1]) : false;
}

function observarThenDelPanel(texto: string, m: MundoDelPanel): [string, string] | undefined {
	const regla = OBSERVACIONES_DEL_PANEL.map(([patron, ver]) => ({ coincide: patron.exec(texto), ver })).find((r) => r.coincide);
	const observado = regla?.ver(m);
	return regla?.coincide && observado !== undefined ? [observado, regla.coincide[1]] : undefined;
}

/**
 * Lo que observa y afirma cada Then tras los Given con la fila, o undefined si el oráculo no reconoce
 * algún paso o valor.
 */
export function observarPanel(entradas: PasoOraculo[], thens: PasoOraculo[], fila: FilaOraculo): { observado: string[]; afirmado: string[] } | undefined {
	const m: MundoDelPanel = {};
	for (const paso of entradas) {
		const texto = resolver(paso.text, fila);
		if (texto === undefined || !ejecutarEntradaDelPanel(texto, m)) return undefined;
	}
	const resultados = thens.map((paso) => {
		const texto = resolver(paso.text, fila);
		return texto === undefined ? undefined : observarThenDelPanel(texto, m);
	});
	if (resultados.some((resultado) => resultado === undefined)) return undefined;
	const pares = resultados as [string, string][];
	return { observado: pares.map(([observado]) => observado), afirmado: pares.map(([, afirmado]) => afirmado) };
}

// ---- §6.2: Cambios sin guardar y Atrás ----

class Indeciso extends Error {}
const indeciso = (motivo: string): never => {
	throw new Indeciso(motivo);
};

/** Lo que tiene el formulario del panel: los valores que Guardar normalizaría, sin normalizar. */
interface Formulario {
	titulo: string;
	nota: string;
	repite: string;
	esfuerzo: string;
	/** Las ventanas tal como se escribieron; '' es una fila vacía. */
	horarios: string[];
	emoji: string;
	etiquetas: string[];
	sinConfirmar: string;
}

interface TareaGuardada {
	titulo: string;
	periodica: boolean;
	/** El intervalo en ms; undefined en una puntual. */
	intervalo?: number;
	pausada: boolean;
	pospuesta?: Posposicion;
}

interface MundoDeCambios {
	tarea?: TareaGuardada;
	alAbrir?: Formulario;
	escrito?: Formulario;
	modo?: 'crear' | 'editar';
	/** Lo que está arriba del panel; 'nada' sin nada arriba. */
	encima: string;
	accion?: string;
	ahora?: string;
	teclado: boolean;
	deshacer: boolean;
	tocoAtras: boolean;
	eligioEmoji: boolean;
}

const FORMULARIO_AL_CREAR: Formulario = { titulo: '', nota: '', repite: 'No se repite', esfuerzo: 'Sin estimar', horarios: [], emoji: '', etiquetas: [], sinConfirmar: '' };
const LO_DE_ARRIBA = ['nada', 'el aviso de cierre', 'el aviso de acción', 'la confirmación de Borrar tarea', 'el selector de emoji', 'las sugerencias de Etiquetas'];
/** §6.2 Atrás: lo que no cuenta como algo abierto encima del panel. */
const NO_CUENTA_COMO_ABIERTO = ['nada', 'las sugerencias de Etiquetas'];
const OPCIONES_DEL_ESFUERZO = ['Sin estimar', 'Rápida', 'Media', 'Larga'];
const REPITE_QUE_CONOCE = ['No se repite', 'Intervalo'];
const ACCIONES = ['pausar', 'reanudar', 'quitar posponer', 'posponer 1 hora', 'posponer 3 horas', 'posponer hasta mañana'];
const OPCION_DE_POSPONER = /^posponer (.+)$/;
/** §4.3: el nombre de una etiqueta tiene hasta 30 caracteres. */
const LARGO_MAXIMO_DE_ETIQUETA = 30;
const MENSAJE_DE_CAMBIOS = 'Tenés cambios sin guardar';
/** El momento en que se crean las tareas de estos pasos: anterior a cualquier fecha del escenario (2000-01-01). */
const CREADA_ANTES_DEL_ESCENARIO = new Date(2000, 0, 1).getTime();
const VENTANA_ESCRITA = /^(\d{2}:\d{2})-(\d{2}:\d{2})$/;

const elEscrito = (m: MundoDeCambios): Formulario => m.escrito ?? indeciso('panel cerrado');

const claveDeHorarios = (horarios: string[]) => [...horarios].sort().join(' ');

/** §6.2: Guardar recorta el título y la nota y ordena las ventanas; las etiquetas no dependen del orden. */
const claveDeFormulario = (f: Formulario) =>
	JSON.stringify([f.titulo.trim(), f.nota.trim(), f.repite, f.esfuerzo, claveDeHorarios(f.horarios), f.emoji, [...f.etiquetas].sort()]);

/** §6.2: lo que Guardar cambiaría, más el texto sin confirmar de Etiquetas salvo solo espacios. */
function hayCambios(m: MundoDeCambios): boolean {
	const escrito = elEscrito(m);
	if (!m.alAbrir) return indeciso('panel sin valores al abrir');
	return escrito.sinConfirmar.trim() !== '' || claveDeFormulario(m.alAbrir) !== claveDeFormulario(escrito);
}

/** §4.1–§4.3: lo escrito se puede guardar. Intervalo sin Cada, si la tarea no era de intervalo, no. */
function guardable(m: MundoDeCambios): boolean {
	const f = elEscrito(m);
	const cadaVacio = f.repite === 'Intervalo' && m.tarea?.intervalo === undefined;
	return f.titulo.trim() !== '' && !f.horarios.includes('') && [...f.sinConfirmar.trim()].length <= LARGO_MAXIMO_DE_ETIQUETA && !cadaVacio;
}

/** §5.8: pasar a puntual reanuda. El estado de la tarea se recalcula con la definición nueva (§6.2). */
function comoQuedaria(m: MundoDeCambios, tarea: TareaGuardada): TareaGuardada {
	const f = elEscrito(m);
	const periodica = f.repite !== 'No se repite';
	return { ...tarea, titulo: f.titulo.trim(), periodica, intervalo: periodica ? tarea.intervalo : undefined, pausada: periodica && tarea.pausada };
}

const elAhora = (m: MundoDeCambios): number => (m.ahora === undefined ? undefined : fecha(m.ahora)) ?? indeciso('sin momento');

function vigente({ pospuesta }: TareaGuardada, ahora: number): Posposicion | undefined {
	if (pospuesta && ahora < pospuesta.desde) indeciso('relojes desfasados');
	return pospuesta && ahora < pospuesta.hasta ? pospuesta : undefined;
}

/** §5.1–§5.3: sin completados, una puntual sin fecha límite está pendiente y una relativa, cumplido su intervalo, también. */
function pendienteOAtrasada({ periodica, intervalo }: TareaGuardada, ahora: number): boolean {
	if (!periodica) return true;
	return intervalo !== undefined && ahora - CREADA_ANTES_DEL_ESCENARIO >= intervalo ? true : indeciso('estado de la periódica');
}

/** §5.8, §5.9 y §6.2: las condiciones con que el panel muestra cada acción. */
function seMuestra(accion: string, tarea: TareaGuardada, ahora: number): boolean {
	if (accion === 'pausar') return tarea.periodica && !tarea.pausada;
	if (accion === 'reanudar') return tarea.periodica && tarea.pausada;
	if (accion === 'quitar posponer') return vigente(tarea, ahora) !== undefined;
	return !tarea.pausada && !vigente(tarea, ahora) && pendienteOAtrasada(tarea, ahora);
}

/** §6.2: el aviso de la acción con la tarea y el ahora del momento; undefined si la acción ya no corresponde. */
function avisoDeLaAccion(m: MundoDeCambios): { mensaje: string; botones: string[] } | undefined {
	const accion = m.accion ?? indeciso('aviso sin acción');
	const tarea = m.tarea ?? indeciso('aviso sin tarea');
	const ahora = elAhora(m);
	if (!seMuestra(accion, tarea, ahora)) return undefined;
	const conGuardar = ['Seguir editando', `Descartar y ${accion}`, `Guardar y ${accion}`];
	if (guardable(m) && !seMuestra(accion, comoQuedaria(m, tarea), ahora))
		return { mensaje: `Con estos cambios la tarea ya no se puede ${accion}`, botones: conGuardar.slice(0, 2) };
	return { mensaje: MENSAJE_DE_CAMBIOS, botones: conGuardar };
}

/** §6.2 y §7: lo que hizo otro dispositivo o el tiempo con el panel abierto. */
function alDia(m: MundoDeCambios): void {
	if (m.modo === 'editar' && !m.tarea) cerrarPanel(m);
	if (m.encima === 'el aviso de acción' && m.accion !== undefined && !avisoDeLaAccion(m)) cerrarLoDeArriba(m);
}

function cerrarPanel(m: MundoDeCambios): void {
	m.escrito = undefined;
	m.modo = undefined;
	cerrarLoDeArriba(m);
}

function cerrarLoDeArriba(m: MundoDeCambios): void {
	m.encima = 'nada';
	m.accion = undefined;
}

function cerrarConLaX(m: MundoDeCambios): void {
	if (hayCambios(m)) m.encima = 'el aviso de cierre';
	else cerrarPanel(m);
}

function aplicarAccion(accion: string, tarea: TareaGuardada, momento: string): TareaGuardada {
	if (accion === 'pausar') return { ...tarea, pausada: true };
	if (accion === 'reanudar') return { ...tarea, pausada: false };
	if (accion === 'quitar posponer') return { ...tarea, pospuesta: undefined };
	const opcion = OPCION_DE_POSPONER.exec(accion)?.[1] ?? indeciso(`acción ${accion}`);
	return { ...tarea, pospuesta: posposicionDe(opcion, momento) ?? indeciso('posposición') };
}

function guardarDesdeElCierre(m: MundoDeCambios): void {
	if (!guardable(m)) return cerrarLoDeArriba(m);
	m.tarea = comoQuedaria(m, m.tarea ?? { titulo: '', periodica: false, pausada: false });
	cerrarPanel(m);
}

const momentoDe = (m: MundoDeCambios) => m.ahora ?? indeciso('sin momento');

function tocarEnElAvisoDeAccion(m: MundoDeCambios, boton: string): void {
	const aviso = avisoDeLaAccion(m);
	const accion = m.accion ?? indeciso('aviso sin acción');
	const tarea = m.tarea ?? indeciso('aviso sin tarea');
	if (!aviso) return cerrarLoDeArriba(m);
	if (!aviso.botones.includes(boton)) indeciso(`botón ${boton}`);
	if (boton === 'Seguir editando') return cerrarLoDeArriba(m);
	if (boton === `Descartar y ${accion}`) m.tarea = aplicarAccion(accion, tarea, momentoDe(m));
	else if (!guardable(m)) return cerrarLoDeArriba(m);
	else m.tarea = aplicarAccion(accion, comoQuedaria(m, tarea), momentoDe(m));
	cerrarPanel(m);
}

function tocarEnElAviso(m: MundoDeCambios, boton: string): void {
	if (m.encima === 'el aviso de acción') return tocarEnElAvisoDeAccion(m, boton);
	if (m.encima !== 'el aviso de cierre') indeciso('no hay aviso');
	if (boton === 'Seguir editando') cerrarLoDeArriba(m);
	else if (boton === 'Descartar') cerrarPanel(m);
	else if (boton === 'Guardar') guardarDesdeElCierre(m);
	else indeciso(`botón ${boton}`);
}

/** §6.2: el botón Borrar tarea solo pide su confirmación; las otras acciones, con cambios, abren su aviso; sin cambios, actúan. */
function elegirAccion(m: MundoDeCambios, texto: string, momento: string): void {
	m.ahora = momento;
	const accion = texto.toLowerCase();
	if (texto === 'Borrar tarea') {
		m.encima = 'la confirmación de Borrar tarea';
		return;
	}
	if (!ACCIONES.includes(accion)) indeciso(`acción ${texto}`);
	const tarea = m.tarea ?? indeciso('acción sin tarea');
	if (!seMuestra(accion, tarea, elAhora(m))) indeciso('el panel no ofrece la acción');
	if (hayCambios(m)) {
		m.encima = 'el aviso de acción';
		m.accion = accion;
		return;
	}
	m.tarea = aplicarAccion(accion, tarea, momento);
	cerrarPanel(m);
}

/** §6.2 Atrás: el teclado primero; después solo lo de más arriba; sin nada arriba, como la X. */
function tocarAtras(m: MundoDeCambios): void {
	m.tocoAtras = true;
	if (m.teclado) m.teclado = false;
	else if (NO_CUENTA_COMO_ABIERTO.includes(m.encima)) cerrarConLaX(m);
	else cerrarLoDeArriba(m);
}

/** Crea la puntual del paso (§4.1: título no vacío) y abre el panel con sus valores (§6.2). */
function abrirParaEditar(m: MundoDeCambios, valores: Partial<Formulario> & { titulo: string }): void {
	if (valores.titulo.trim() === '') indeciso('título vacío');
	m.tarea = { titulo: valores.titulo.trim(), periodica: false, pausada: false };
	abrirConLaTarea(m, valores);
}

function abrirConLaTarea(m: MundoDeCambios, valores: Partial<Formulario> & { titulo: string }): void {
	m.modo = 'editar';
	abrirCon(m, { ...FORMULARIO_AL_CREAR, repite: m.tarea?.periodica ? 'Intervalo' : 'No se repite', ...valores });
}

/** El formulario arranca con los valores al abrir; lo que se escribe no cambia esos valores. */
function abrirCon(m: MundoDeCambios, alAbrir: Formulario): void {
	m.alAbrir = alAbrir;
	m.escrito = { ...alAbrir, horarios: [...alAbrir.horarios], etiquetas: [...alAbrir.etiquetas] };
}

function ventanasValidas(primera: string, segunda: string): string[] {
	const partes = [primera, segunda].map((ventana) => VENTANA_ESCRITA.exec(ventana) ?? indeciso(`ventana ${ventana}`));
	if (!horarioValido(escritasDe([partes[0][1], partes[0][2], partes[1][1], partes[1][2]]))) indeciso('horario inválido');
	return [primera, segunda];
}

function escribirEn(m: MundoDeCambios, campo: string, valor: string): void {
	const f = elEscrito(m);
	if (campo === 'Título') f.titulo = valor;
	else if (campo === 'Nota') f.nota = valor;
	else if (campo === 'Etiquetas sin confirmar') f.sinConfirmar = valor;
	else indeciso(`campo ${campo}`);
}

function elegirEn(m: MundoDeCambios, selector: string, valor: string): void {
	const f = elEscrito(m);
	if (selector === 'Se repite' && REPITE_QUE_CONOCE.includes(valor)) f.repite = valor;
	else if (selector === 'Esfuerzo' && OPCIONES_DEL_ESFUERZO.includes(valor)) f.esfuerzo = valor;
	else indeciso(`selector ${selector}: ${valor}`);
}

const laTareaDelOtro = (m: MundoDeCambios) => m.tarea ?? indeciso('otro dispositivo sin tarea');

const PASOS_DE_CAMBIOS: [RegExp, (m: MundoDeCambios, ...grupos: string[]) => void][] = [
	[/^abro el panel para editar la tarea (.+) con nota (.+)$/, (m, titulo, nota) => abrirParaEditar(m, { titulo, nota })],
	[/^abro el panel para editar la tarea (.+) con los horarios (.+) y (.+)$/, (m, titulo, a, b) => abrirParaEditar(m, { titulo, horarios: ventanasValidas(a, b) })],
	[
		/^abro el panel para crear una tarea$/,
		(m) => {
			m.modo = 'crear';
			abrirCon(m, FORMULARIO_AL_CREAR);
		}
	],
	[
		/^el panel está abierto (.+)$/,
		(m, estado) => {
			if (estado !== 'con cambios sin guardar' && estado !== 'sin cambios') indeciso(`estado ${estado}`);
			abrirParaEditar(m, { titulo: 'Pagar' });
			if (estado === 'con cambios sin guardar') elEscrito(m).titulo = 'Pagar luz';
			// El aviso de acción que declara "encima del panel hay" es el de una puntual que se puede posponer.
			m.ahora = '2026-07-15T08:00:00';
		}
	],
	[
		/^encima del panel hay (.+)$/,
		(m, encima) => {
			if (!LO_DE_ARRIBA.includes(encima)) indeciso(`encima ${encima}`);
			m.encima = encima;
			if (encima === 'el aviso de acción') m.accion = 'posponer 1 hora';
		}
	],
	[/^el aviso de deshacer está abierto$/, (m) => void (m.deshacer = true)],
	[/^el teclado en pantalla está abierto$/, (m) => void (m.teclado = true)],
	[
		/^una tarea periódica relativa Regar cada (.+) (.+)$/,
		(m, cada, unidad) => {
			const intervalo = intervaloValido(cada) ? intervaloMs(cada, unidad) : undefined;
			m.tarea = { titulo: 'Regar', periodica: true, intervalo: intervalo ?? indeciso('intervalo'), pausada: false };
		}
	],
	[/^una tarea puntual sin fecha límite$/, (m) => void (m.tarea = { titulo: 'Tarea', periodica: false, pausada: false })],
	[/^la tarea Regar fue pausada$/, (m) => void (laTareaDelOtro(m).pausada = true)],
	[
		/^la tarea fue pospuesta con la opción (.+) el (.+)$/,
		(m, opcion, momento) => {
			const tarea = laTareaDelOtro(m);
			if (tarea.periodica) indeciso('posponer una periódica antes de abrir');
			tarea.pospuesta = posposicionDe(opcion, momento) ?? indeciso('posposición');
		}
	],
	[
		/^abro la tarea en el panel de edición el (.+)$/,
		(m, momento) => {
			m.ahora = momento;
			abrirConLaTarea(m, { titulo: laTareaDelOtro(m).titulo });
		}
	],
	[/^escribo (.+) con espacios alrededor en el campo (.+)$/, (m, valor, campo) => escribirEn(m, campo, `  ${valor}  `)],
	[/^escribo solo espacios en el campo (.+)$/, (m, campo) => escribirEn(m, campo, '   ')],
	[/^vacío el campo (.+)$/, (m, campo) => escribirEn(m, campo, '')],
	[/^escribo (.+) en el campo (.+)$/, (m, valor, campo) => escribirEn(m, campo, valor)],
	[/^elijo la acción (.+) el (.+)$/, (m, accion, momento) => elegirAccion(m, accion, momento)],
	[
		/^elijo un emoji que no estaba entre los recientes$/,
		(m) => {
			elEscrito(m).emoji = 'elegido';
			m.eligioEmoji = true;
		}
	],
	[/^que no hay emojis recientes$/, () => undefined],
	[/^elijo (.+) en (.+)$/, (m, valor, selector) => elegirEn(m, selector, valor)],
	[/^cambio los horarios a (.+) y (.+)$/, (m, a, b) => void (elEscrito(m).horarios = ventanasValidas(a, b))],
	[/^agrego una fila de horario vacía$/, (m) => void elEscrito(m).horarios.push('')],
	[/^agrego la etiqueta (.+)$/, (m, etiqueta) => void elEscrito(m).etiquetas.push(etiqueta)],
	[
		/^quito la etiqueta (.+)$/,
		(m, etiqueta) => {
			const f = elEscrito(m);
			f.etiquetas = f.etiquetas.filter((nombre) => nombre !== etiqueta);
		}
	],
	[/^toco la X del panel$/, cerrarConLaX],
	[/^toco Atrás$/, tocarAtras],
	[/^toco (.+) en el aviso el (.+)$/, (m, boton, momento) => ((m.ahora = momento), tocarEnElAviso(m, boton))],
	[/^toco (.+) en el aviso$/, (m, boton) => tocarEnElAviso(m, boton)],
	[/^pasa el tiempo hasta (.+)$/, (m, momento) => void (m.ahora = momento)],
	[
		/^otro dispositivo, sin ver ese cambio, edita el título a (.+)$/,
		(m, titulo) => {
			if (titulo.trim() === '') indeciso('título vacío');
			laTareaDelOtro(m).titulo = titulo.trim();
		}
	],
	[/^otro dispositivo, sin ver ese cambio, pausa la tarea$/, (m) => void (laTareaDelOtro(m).pausada = true)],
	[/^otro dispositivo, sin ver ese cambio, borra la tarea$/, (m) => void (m.tarea = undefined)]
];

const ABIERTO_ENCIMA: Record<string, string> = {
	'el aviso de cierre': 'el panel con el aviso de cierre',
	'el aviso de acción': 'el panel con el aviso de acción',
	'la confirmación de Borrar tarea': 'el panel con la confirmación de Borrar tarea',
	'el selector de emoji': 'el panel con el selector de emoji'
};

function elAvisoAbierto(m: MundoDeCambios): { mensaje: string; botones: string[] } {
	if (m.encima === 'el aviso de cierre') return { mensaje: MENSAJE_DE_CAMBIOS, botones: ['Seguir editando', 'Descartar', 'Guardar'] };
	return (m.encima === 'el aviso de acción' ? avisoDeLaAccion(m) : undefined) ?? indeciso('no hay aviso');
}

const CAMPO_ESCRITO: Record<string, (f: Formulario) => string> = { Título: (f) => f.titulo, Nota: (f) => f.nota, 'Etiquetas sin confirmar': (f) => f.sinConfirmar };

const siHayTarea = (m: MundoDeCambios, ver: (t: TareaGuardada) => string) => (m.tarea ? ver(m.tarea) : 'sin tarea');
const instante = (valor: string) => String(fecha(valor) ?? indeciso(`fecha ${valor}`));
const laPospuesta = ({ pospuesta }: TareaGuardada) => (pospuesta ? `${pospuesta.desde} ${pospuesta.hasta}` : 'sin posponer');

/** Lo que observa y lo que afirma cada Then. */
const THENS_DE_CAMBIOS: [RegExp, (m: MundoDeCambios, ...grupos: string[]) => [string, string]][] = [
	[/^queda abierto (.+)$/, (m, abierto) => [m.escrito ? (ABIERTO_ENCIMA[m.encima] ?? 'el panel') : 'nada', abierto]],
	[/^el aviso dice (.+)$/, (m, mensaje) => [elAvisoAbierto(m).mensaje, mensaje]],
	[/^el aviso ofrece (.+)$/, (m, botones) => [elAvisoAbierto(m).botones.join(', '), elementos(botones)?.join(', ') ?? indeciso('botones')]],
	[/^el campo (.+) sigue con (.+)$/, (m, campo, valor) => [(CAMPO_ESCRITO[campo] ?? indeciso(`campo ${campo}`))(elEscrito(m)), valor]],
	[/^la tarea tiene título (.+)$/, (m, titulo) => [siHayTarea(m, (t) => t.titulo), titulo]],
	[/^no queda ninguna tarea$/, (m) => [siHayTarea(m, () => 'hay una'), 'sin tarea']],
	[/^se crea una tarea puntual con título (.+)$/, (m, titulo) => [siHayTarea(m, (t) => (t.periodica ? 'periódica' : t.titulo)), titulo]],
	[/^no existe la tarea (.+)$/, (m) => [siHayTarea(m, () => 'existe'), 'sin tarea']],
	[/^la tarea está pausada$/, (m) => [siHayTarea(m, (t) => String(t.pausada)), 'true']],
	[/^la tarea no está pausada$/, (m) => [siHayTarea(m, (t) => String(t.pausada)), 'false']],
	[/^la tarea es periódica$/, (m) => [siHayTarea(m, (t) => String(t.periodica)), 'true']],
	[/^la tarea está pospuesta desde (.+) hasta (.+)$/, (m, desde, hasta) => [siHayTarea(m, laPospuesta), `${instante(desde)} ${instante(hasta)}`]],
	[/^el primero es el que elegí$/, (m) => [String(m.eligioEmoji), 'true']],
	[/^el aviso de deshacer sigue abierto$/, (m) => [String(m.deshacer), 'true']],
	[/^al recargar la app el navegador (.+)$/, (m, respuesta) => [m.escrito && hayCambios(m) ? 'pide confirmación' : 'no pregunta', respuesta]],
	// §6.2: nunca por Atrás con el panel abierto.
	[/^el navegador (.+)$/, (m, respuesta) => [m.tocoAtras ? 'no pregunta' : indeciso('sin Atrás'), respuesta]]
];

const ES_DE_CAMBIOS = /^(?:abro el panel para |el panel está abierto |toco la X del panel$|toco Atrás$|elijo la acción )/;

export const esEscenarioDeCambios = (textos: string[]) => textos.some((texto) => ES_DE_CAMBIOS.test(texto));

function aplicarPrimero<R>(reglas: [RegExp, (m: MundoDeCambios, ...grupos: string[]) => R][], texto: string, m: MundoDeCambios): R {
	for (const [patron, aplicar] of reglas) {
		const coincide = patron.exec(texto);
		if (coincide) return aplicar(m, ...coincide.slice(1));
	}
	return indeciso(`paso ${texto}`);
}

const resuelto = (paso: PasoOraculo, fila: FilaOraculo) => resolver(paso.text, fila) ?? indeciso(`columna en ${paso.text}`);

/**
 * Lo que observa y afirma cada Then tras los pasos con la fila, o undefined si el oráculo no reconoce o no
 * puede decidir algún paso o valor. Los Then se observan tras todos los pasos de entrada.
 */
export function observarCambios(entradas: PasoOraculo[], thens: PasoOraculo[], fila: FilaOraculo): { observado: string[]; afirmado: string[] } | undefined {
	const m: MundoDeCambios = { encima: 'nada', teclado: false, deshacer: false, tocoAtras: false, eligioEmoji: false };
	try {
		for (const paso of entradas) aplicarPrimero(PASOS_DE_CAMBIOS, resuelto(paso, fila), m);
		alDia(m);
		const pares = thens.map((paso) => aplicarPrimero(THENS_DE_CAMBIOS, resuelto(paso, fila), m));
		return { observado: pares.map(([observado]) => observado), afirmado: pares.map(([, afirmado]) => afirmado) };
	} catch (error) {
		if (error instanceof Indeciso) return undefined;
		throw error;
	}
}
