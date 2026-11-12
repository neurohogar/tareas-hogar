// Oráculo de la pantalla de carga (spec §6.6), escrito desde el spec. NO importa el core
// ni los step handlers. En vez de recorrer la línea de tiempo, despeja el momento: la
// pantalla se va en el mayor entre el mínimo, Auth y lo esperado (con el tope encima de
// lo esperado, porque "la espera de Auth no entra en el tope"). Si no reconoce un paso o
// un valor, devuelve undefined (no se filtra).
import type { FilaOraculo, PasoOraculo } from './oracle';

/** §6.6: mínimo de 0,5 s en todos los casos. */
const MINIMO = 0.5;
/** §6.6: tope de 10 s para los datos y las fuentes, desde el arranque. */
const TOPE = 10;
/** El feature escribe 30 segundos para algo que no llega. */
const NO_LLEGA = 30;

interface Fuente {
	llega?: number;
	falla?: number;
	sinGuardar?: boolean;
}

interface Apertura {
	sesion?: boolean;
	sinConexion?: boolean;
	pierde: number;
	auth?: number;
	datos: number[];
	atkinson: Fuente;
	noto: Fuente;
	recordaba?: boolean;
	versionCambio?: boolean;
}

const conValores = (texto: string, fila: FilaOraculo) => texto.replace(/<([A-Za-z0-9_]+)>/g, (_, columna: string) => fila[columna] ?? '<?>');

function numero(valor: string): number {
	const n = Number(valor);
	if (valor.trim() === '' || !Number.isFinite(n)) throw new RangeError(valor);
	return n;
}

const fuenteDe = (a: Apertura, nombre: string) => (nombre === 'Atkinson' ? a.atkinson : a.noto);

const LECTORES: [RegExp, (a: Apertura, ...capturas: string[]) => void][] = [
	[/^la app arranca (con|sin) sesión$/, (a, sesion) => void (a.sesion = sesion === 'con')],
	[/^no hay conexión$/, (a) => void (a.sinConexion = true)],
	[/^se pierde la conexión a los (.+) segundos$/, (a, s) => void (a.pierde = numero(s))],
	[/^Auth responde enseguida$/, (a) => void (a.auth = 0)],
	[/^Auth responde a los (.+) segundos$/, (a, s) => void (a.auth = numero(s))],
	[/^(?:las tareas|los completados|las etiquetas) responden a los (.+) segundos$/, (a, s) => void a.datos.push(numero(s))],
	[/^los datos responden a los (.+) segundos$/, (a, s) => void a.datos.push(numero(s))],
	[/^(Atkinson|Noto) queda list[ao] a los (.+) segundos$/, (a, nombre, s) => void (fuenteDe(a, nombre).llega = numero(s))],
	[/^(Atkinson|Noto) falla a los (.+) segundos$/, (a, nombre, s) => void (fuenteDe(a, nombre).falla = numero(s))],
	[/^el navegador no puede dibujar Noto a los (.+) segundos$/, (a, s) => void (a.noto.falla = numero(s))],
	[/^(Atkinson|Noto) no está guardad[ao]$/, (a, nombre) => void (fuenteDe(a, nombre).sinGuardar = true)],
	[/^el dispositivo ya recordaba un tope con Noto sin bajar$/, (a) => void (a.recordaba = true)],
	[/^una versión nueva (no )?cambió el juego de emoji$/, (a, no) => void (a.versionCambio = no === undefined)]
];

function leerApertura(entradas: PasoOraculo[], fila: FilaOraculo): Apertura | undefined {
	const apertura: Apertura = { pierde: Infinity, datos: [], atkinson: {}, noto: {} };
	for (const paso of entradas) {
		const texto = conValores(paso.text, fila);
		const lector = LECTORES.find(([patron]) => patron.test(texto));
		if (!lector) return undefined;
		try {
			lector[1](apertura, ...(lector[0].exec(texto) as RegExpExecArray).slice(1));
		} catch (error) {
			if (error instanceof RangeError) return undefined;
			throw error;
		}
	}
	return apertura.sesion === undefined || apertura.auth === undefined ? undefined : apertura;
}

const llegaDe = (fuente: Fuente) => (fuente.llega === undefined || fuente.llega >= NO_LLEGA ? Infinity : fuente.llega);

/**
 * Hasta cuándo se espera una fuente. §6.6: una que falló se deja de esperar en ese momento; sin conexión
 * no se espera nada que solo pueda venir por red, y perder la conexión cuenta igual; una guardada llega
 * desde el dispositivo también sin conexión.
 */
function finDeLaEspera(fuente: Fuente, a: Apertura): number {
	const hastaLaFalla = Math.min(llegaDe(fuente), fuente.falla ?? Infinity);
	if (!a.sinConexion) return Math.min(hastaLaFalla, a.pierde);
	return fuente.llega === undefined || fuente.sinGuardar ? 0 : hastaLaFalla;
}

/** §6.6: una versión nueva que cambia el juego lo trata como no guardado y vuelve a esperarlo una vez. */
const recordabaAlAbrir = (a: Apertura) => Boolean(a.recordaba) && !a.versionCambio;

/** §6.6: con sesión espera datos y las dos fuentes, salvo Noto tras un tope; sin sesión, solo Atkinson. */
function esperas(a: Apertura): number[] {
	const atkinson = finDeLaEspera(a.atkinson, a);
	if (!a.sesion) return [atkinson];
	const noto = recordabaAlAbrir(a) ? [] : [finDeLaEspera(a.noto, a)];
	return [...(a.datos.length > 0 ? a.datos : [Infinity]), atkinson, ...noto];
}

/** §6.6: el mínimo vale siempre; el tope corta lo esperado pero no la espera de Auth. */
const salidaDe = (a: Apertura) => Math.max(MINIMO, a.auth ?? Infinity, Math.min(TOPE, Math.max(...esperas(a))));

/**
 * §6.6: cuenta un tope con Noto sin bajar en una apertura que lo esperaba (con sesión, y sin haberlo dejado de
 * esperar antes del tope); lo recordado se olvida cuando Noto queda guardado.
 */
function recuerda(a: Apertura): boolean {
	const topeNuevo = Boolean(a.sesion) && finDeLaEspera(a.noto, a) > TOPE;
	return (recordabaAlAbrir(a) || topeNuevo) && llegaDe(a.noto) === Infinity;
}

const THEN_DE_SALIDA = /^la pantalla de carga se va a los (.+) segundos$/;
const THEN_DE_RECUERDO = /^el dispositivo (no )?recuerda un tope con Noto sin bajar$/;

export const esEscenarioDePantallaDeCarga = (textos: string[]) => textos.some((texto) => THEN_DE_SALIDA.test(texto) || THEN_DE_RECUERDO.test(texto));

/** Lo que observa y lo que afirma cada Then: undefined si el oráculo no reconoce el escenario. */
export function observarPantallaDeCarga(entradas: PasoOraculo[], thens: PasoOraculo[], fila: FilaOraculo): { observado: string[]; afirmado: string[] } | undefined {
	const apertura = leerApertura(entradas, fila);
	if (!apertura) return undefined;
	const observado: string[] = [];
	const afirmado: string[] = [];
	for (const paso of thens) {
		const texto = conValores(paso.text, fila);
		const seVa = THEN_DE_SALIDA.exec(texto);
		const recuerdo = THEN_DE_RECUERDO.exec(texto);
		if (seVa) {
			observado.push(String(salidaDe(apertura)));
			afirmado.push(String(Number(seVa[1])));
		} else if (recuerdo) {
			observado.push(String(recuerda(apertura)));
			afirmado.push(String(recuerdo[1] === undefined));
		} else {
			return undefined;
		}
	}
	return { observado, afirmado };
}
