// Oráculo del texto de fecha de la fila de Pendientes («Tocaba …», «Vuelve …») y del regreso del aviso de
// completar (spec §6.1 «Fecha y distancia», §5.4), escrito desde el spec. NO importa el core ni los step
// handlers: es una segunda implementación, así que la implementación no juzga a sus propios tests. Lo que el
// spec no decide devuelve undefined: no se filtra.
import {
	armar,
	conHorarioDe,
	DIAS_DE_LA_SEMANA,
	disponibleYCierre,
	elementos,
	enEsperaPorPosposicion,
	estadoSegunSuRegla,
	fecha,
	inicioDelDia,
	intervaloMs,
	ordenDePendientes,
	porVentana,
	posposicionVigente,
	primeraPosterior,
	proximaConHorario,
	resolver,
	SIN_PROGRESO,
	ultimaCubierta,
	type FilaOraculo,
	type PasoOraculo,
	type Situacion
} from './oracle';
import { avisoSeVe } from './oracle-historial';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MS_DE_MINUTO = 60_000;
const MS_DE_HORA = 3_600_000;
const MINUTOS_POR_HORA = 60;
const MS_DE_DIA = 86_400_000;

/** Lo que se observa cuando la fila (o el aviso) no lleva texto. */
export const SIN_TEXTO = 'sin texto';

const dosCifras = (n: number) => String(n).padStart(2, '0');
const plural = (n: number, unidad: string) => `${n} ${unidad}${n === 1 ? '' : 's'}`;

/** Días locales de `instante` respecto de `ahora` (negativo: pasado). */
const diasLocalesDesde = (instante: number, ahora: number) =>
	Math.round((inicioDelDia(instante).getTime() - inicioDelDia(ahora).getTime()) / MS_DE_DIA);

/** §6.1 Fecha: «hoy»/«ayer»/«mañana» o «el martes 10 [de <mes>][ de <año>]», con la hora si no son las 00:00. */
function fechaDe(instante: number, ahora: number): string | undefined {
	const d = new Date(instante);
	const n = new Date(ahora);
	const dias = diasLocalesDesde(instante, ahora);
	const palabra = { [-1]: 'ayer', 0: 'hoy', 1: 'mañana' }[dias];
	// El spec no dice qué pasa con otro año y el mismo mes: no se decide.
	if (palabra === undefined && d.getFullYear() !== n.getFullYear() && d.getMonth() === n.getMonth()) return undefined;
	const mes = d.getMonth() === n.getMonth() ? '' : ` de ${MESES[d.getMonth()]}`;
	const anio = d.getFullYear() === n.getFullYear() ? '' : ` de ${d.getFullYear()}`;
	const dia = palabra ?? `el ${DIAS_DE_LA_SEMANA[d.getDay()]} ${d.getDate()}${mes}${anio}`;
	const conHora = d.getHours() !== 0 || d.getMinutes() !== 0;
	return conHora ? `${dia} ${dosCifras(d.getHours())}:${dosCifras(d.getMinutes())}` : dia;
}

/** §6.1 Distancia en horas o minutos (fecha de hoy, ayer o mañana con hora): pasado hacia abajo, futuro hacia arriba. */
function distanciaCorta(instante: number, ahora: number): string | undefined {
	const diferencia = instante - ahora;
	if (diferencia >= 0) {
		// Lo futuro se redondea hacia arriba a minutos enteros primero: 60 minutos ya no son «menos de una hora».
		const minutos = Math.ceil(diferencia / MS_DE_MINUTO);
		return minutos < MINUTOS_POR_HORA ? `en ${plural(minutos, 'minuto')}` : `en ${plural(Math.ceil(diferencia / MS_DE_HORA), 'hora')}`;
	}
	const pasado = -diferencia;
	if (pasado >= MS_DE_HORA) return `hace ${plural(Math.floor(pasado / MS_DE_HORA), 'hora')}`;
	// Con menos de un minuto de pasado el spec no dice nada («hace 0 minutos» no se nombra).
	return pasado >= MS_DE_MINUTO ? `hace ${plural(Math.floor(pasado / MS_DE_MINUTO), 'minuto')}` : undefined;
}

/** §6.1 Frase: «<Tocaba|Vuelve> <fecha>[ · <distancia>]». */
export function fraseDeFecha(palabra: 'Tocaba' | 'Vuelve', instante: number, ahora: number): string | undefined {
	const fechaEscrita = fechaDe(instante, ahora);
	if (fechaEscrita === undefined) return undefined;
	const dias = diasLocalesDesde(instante, ahora);
	if (Math.abs(dias) >= 2) return `${palabra} ${fechaEscrita} · ${dias < 0 ? `hace ${-dias} días` : `en ${dias} días`}`;
	const conHora = fechaEscrita.includes(':');
	if (!conHora) return `${palabra} ${fechaEscrita}`;
	const distancia = distanciaCorta(instante, ahora);
	return distancia && `${palabra} ${fechaEscrita} · ${distancia}`;
}

/** V: cuándo vuelve una relativa sin horario, el último completado más su intervalo. */
function vencimientoRelativo(s: Situacion): number | undefined {
	const intervalo = intervaloMs(s.cada, s.unidad);
	return intervalo === undefined || s.completados.length === 0 ? undefined : Math.max(...s.completados) + intervalo;
}

/** El 00:00 de N, la ocurrencia de calendario sin horario (§5.3). */
function inicioDeN(s: Situacion): number | undefined {
	const p = ultimaCubierta(s);
	return p && s.calendario && primeraPosterior(s.calendario, p)?.getTime();
}

/** §6.1 Instante de «Vuelve» por la regla propia de la tarea (§5.2, §5.3, §5.5). */
function vuelveDeSuRegla(s: Situacion, ahora: number): number | undefined {
	if (s.horario) return conHorarioDe(s, s.horario, ahora)?.espera?.vuelve;
	return s.calendario ? inicioDeN(s) : vencimientoRelativo(s);
}

/** §6.1 Instante de «Vuelve»: el de su regla y, con posposición vigente, el más tarde de las dos causas (§5.9). */
function vuelve(s: Situacion, ahora: number): number | undefined {
	const hasta = posposicionVigente(s)?.hasta;
	const propia = estadoSegunSuRegla(s, SIN_PROGRESO) === 'en espera' ? vuelveDeSuRegla(s, ahora) : undefined;
	if (hasta !== undefined && enEsperaPorPosposicion(s)) return hasta;
	if (hasta !== undefined) return propia === undefined ? undefined : Math.max(propia, hasta);
	return propia;
}

/** §6.1 Instante de «Tocaba» de una periódica con horario (§5.5, §5.6, §5.7): A, el inicio de N, o V si A no llegó. */
function tocabaConHorario(s: Situacion, ahora: number): number | undefined {
	const vs = s.horario;
	if (!vs) return undefined;
	if (s.calendario || porVentana(s.unidad, vs)) return proximaConHorario(s, vs)?.abre;
	const t = s.completados.length > 0 ? vencimientoRelativo(s) : s.creada?.getTime();
	if (t === undefined) return undefined;
	const a = disponibleYCierre(vs, t).a;
	return ahora >= a ? a : t;
}

/** §6.1 Instante de «Tocaba», por tipo; nunca es un instante futuro. */
function tocaba(s: Situacion, ahora: number): number | undefined {
	if (s.puntual) return s.puntual.limite?.getTime();
	if (s.horario) return tocabaConHorario(s, ahora);
	return s.calendario ? inicioDeN(s) : vencimientoRelativo(s);
}

/** El texto de fecha de la fila (§6.1) de la tarea armada a `ahora`; SIN_TEXTO si no lleva; undefined si no se decide. */
export function textoDeLaFila(s: Situacion): string | undefined {
	const ahora = s.ahora;
	if (ahora === undefined || s.puntual?.cualquiera) return undefined;
	if (s.pausada) return SIN_TEXTO;
	const posposicion = posposicionVigente(s) !== undefined && enEsperaPorPosposicion(s);
	const estado = posposicion ? 'en espera' : estadoSegunSuRegla(s, SIN_PROGRESO);
	if (estado === 'atrasada') {
		const instante = tocaba(s, ahora);
		return instante === undefined ? undefined : fraseDeFecha('Tocaba', instante, ahora);
	}
	if (estado === 'en espera') {
		const instante = vuelve(s, ahora);
		return instante === undefined ? undefined : fraseDeFecha('Vuelve', instante, ahora);
	}
	return estado === 'pendiente' || estado === 'no aparece en Pendientes' ? SIN_TEXTO : undefined;
}

/** §5.4 y §6.1: el regreso del aviso consultado a `ahora`: el «Vuelve …» de una periódica, nada en una puntual. */
export function regresoDelAvisoDe(s: Situacion, ahora: number): string | undefined {
	if (s.puntual) return s.puntual.cualquiera ? undefined : SIN_TEXTO;
	const instante = vuelve({ ...s, ahora }, ahora);
	return instante === undefined ? undefined : fraseDeFecha('Vuelve', instante, ahora);
}

const THEN_DE_FILA = /^la fila de la tarea (?:muestra el texto (.*)|no muestra texto de fecha)$/su;
const THEN_DE_FILA_DE_TITULO = /^la fila de ([A-ZÁÉÍÓÚÑ]\w*) muestra el texto (.*)$/su;
const THEN_DE_ORDEN = /^Pendientes muestra en orden (.*)$/su;
const THEN_DE_AVISO = /^el aviso del completado (?:muestra el regreso (.*)|no muestra regreso)$/su;
const CONSULTA_DEL_AVISO = /^consulto el aviso el (\S+)$/;
const DECLARA_UNA_TAREA = /^una tarea /;
const TITULO_EN_EL_PASO = /\b(tarea(?: puntual| periódica (?:relativa|semanal|mensual))?) ([A-ZÁÉÍÓÚÑ]\w*)\b/u;
const tituloDelPaso = (texto: string) => TITULO_EN_EL_PASO.exec(texto)?.[2];

export const esEscenarioDeTextoDeFecha = (textos: string[]) =>
	textos.some((texto) => THEN_DE_FILA.test(texto) || THEN_DE_FILA_DE_TITULO.test(texto) || THEN_DE_AVISO.test(texto));

/**
 * Los pasos de la tarea `titulo`: los que la nombran y los que no nombran a ninguna (la consulta, los checks). Con una
 * sola tarea el título no decide nada y se lo quita; con más de una hace falta saber de cuál se habla.
 */
function pasosDeLaTarea(textos: string[], titulo: string | undefined): PasoOraculo[] | undefined {
	const titulos = new Set(textos.filter((texto) => DECLARA_UNA_TAREA.test(texto)).map(tituloDelPaso));
	if (titulos.size > 1 && (titulo === undefined || !titulos.has(titulo))) return undefined;
	return textos
		.filter((texto) => titulos.size <= 1 || tituloDelPaso(texto) === undefined || tituloDelPaso(texto) === titulo)
		.map((texto) => ({ text: texto.replace(TITULO_EN_EL_PASO, '$1') }));
}

/** La tarea `titulo` armada con los pasos de entrada, y el momento en que se consulta el aviso, si lo hay. */
function situacionDe(entradas: PasoOraculo[], fila: FilaOraculo, titulo?: string): { s: Situacion; ahoraDelAviso?: number } | undefined {
	const resueltos = entradas.map(({ text }) => resolver(text, fila));
	if (resueltos.includes(undefined)) return undefined;
	const pasos = pasosDeLaTarea(resueltos as string[], titulo);
	if (!pasos) return undefined;
	const textos = pasos.map(({ text }) => text);
	const consulta = textos.map((texto) => CONSULTA_DEL_AVISO.exec(texto)?.[1]).find((m) => m !== undefined);
	const restantes = textos.filter((texto) => !CONSULTA_DEL_AVISO.test(texto) && texto !== 'Mostrar pausadas está encendido');
	const s = armar(restantes.map((text) => ({ text })), {});
	const ahoraDelAviso = consulta === undefined ? undefined : fecha(consulta);
	return s && (consulta === undefined || ahoraDelAviso !== undefined) ? { s, ahoraDelAviso } : undefined;
}

/** El aviso se ve entre el completado y 5 s después (§5.4); fuera, no hay aviso que consultar. */
function regresoVisible(s: Situacion, ahora: number | undefined): string | undefined {
	if (ahora === undefined || s.completados.length === 0) return undefined;
	return avisoSeVe(Math.max(...s.completados), ahora) ? regresoDelAvisoDe(s, ahora) : 'sin aviso';
}

/** §6.1: lo que el oráculo observa en un Then de la lista o del aviso, con lo que el Then afirma; undefined si no se decide. */
function observarThen(entradas: PasoOraculo[], texto: string, fila: FilaOraculo): { visto: string | undefined; escrito: string } {
	const orden = THEN_DE_ORDEN.exec(texto);
	if (orden) return { visto: ordenDePendientes(entradas, fila)?.orden, escrito: elementos(orden[1])?.join(', ') ?? orden[1] };
	const deTitulo = THEN_DE_FILA_DE_TITULO.exec(texto);
	const deFila = deTitulo ?? THEN_DE_FILA.exec(texto);
	const deAviso = THEN_DE_AVISO.exec(texto);
	const situacion = situacionDe(entradas, fila, deTitulo?.[1]);
	const escrito = (deTitulo ? deTitulo[2] : (deFila ?? deAviso)?.[1]) ?? SIN_TEXTO;
	if (!situacion) return { visto: undefined, escrito };
	const visto = deFila ? textoDeLaFila(situacion.s) : deAviso ? regresoVisible(situacion.s, situacion.ahoraDelAviso) : undefined;
	return { visto, escrito };
}

/** Lo que el oráculo observa y lo que cada Then afirma; undefined si algo no se reconoce o no se decide. */
export function observarTextoDeFecha(entradas: PasoOraculo[], thens: PasoOraculo[], fila: FilaOraculo): { observado: string[]; afirmado: string[] } | undefined {
	if (thens.length === 0) return undefined;
	const observado: string[] = [];
	const afirmado: string[] = [];
	for (const paso of thens) {
		const texto = resolver(paso.text, fila);
		if (texto === undefined) return undefined;
		const { visto, escrito } = observarThen(entradas, texto, fila);
		if (visto === undefined) return undefined;
		observado.push(visto);
		afirmado.push(escrito);
	}
	return { observado, afirmado };
}
