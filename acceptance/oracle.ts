// Oráculo independiente del filtro de equivalentes: clasifica una fila con las
// reglas de docs/spec.md (§5.2 estado relativo; §5.3 estado y cobertura en modo
// calendario; §4.1 y §4.2 validez al crear; §5.1 estado de la puntual; §5.5–§5.7
// horario, con una o más ventanas, y el checkbox fuera de ellas, §6.1; §5.8 pausa y reanudación, y el botón
// de pausa del panel, §6.2; §5.9 posponer, y su botón y su texto en el panel, §6.2), leyendo el texto de los pasos del Gherkin. NO importa el core ni los step
// handlers: si lo hiciera, la implementación juzgaría a sus propios tests y
// ningún sobreviviente (ni siquiera uno que revele un bug) sería visible.
// Si no reconoce un paso o un valor, devuelve undefined (no se filtra).

export interface PasoOraculo {
	text: string;
}
export type FilaOraculo = Record<string, string>;
/** Lo que los Then del escenario observan además del tipo de estado. */
export interface Observa {
	progreso: boolean;
	/** Si el checkbox de la fila está habilitado (§6.1, §5.5). */
	checkbox?: boolean;
	/** Si no hay Then sobre el tipo de estado, el progreso ni la aparición: solo el checkbox (§6.1, §5.5). */
	soloCheckbox?: boolean;
	/** Si ningún Then distingue pendiente de atrasada: Pendientes muestra las dos igual (§6.1). */
	soloAparicion?: boolean;
	/** Si un Then afirma la ocurrencia que cubrió el completado nuevo (§5.3), además del estado consultado. */
	cubierta?: boolean;
	/** Si un Then afirma el valor guardado de `pospuesta` (§4.1). */
	pospuesta?: boolean;
	/** Si un Then afirma lo que el panel dice de la posposición (§6.2). */
	textoDelPanel?: boolean;
}

const HORA_MS = 3_600_000;
const FECHA = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/;
const ENTERO_POSITIVO = /^\d+$/;

export function fecha(valor: string): number | undefined {
	const partes = FECHA.exec(valor);
	if (!partes) return undefined;
	const [a, m, d, h, mi, s] = partes.slice(1).map(Number);
	const f = new Date(a, m - 1, d, h, mi, s);
	const exacta = f.getFullYear() === a && f.getMonth() === m - 1 && f.getDate() === d && f.getHours() === h;
	return exacta ? f.getTime() : undefined;
}

/** Spec §4.2: N entero ≥ 1. */
export function intervaloValido(cada: string | undefined): boolean {
	return cada !== undefined && ENTERO_POSITIVO.test(cada) && Number(cada) >= 1;
}

/** "cada N dias" equivale a N × 24 horas (§5). */
export function intervaloMs(cada: string | undefined, unidad: string | undefined): number | undefined {
	if (!intervaloValido(cada)) return undefined;
	if (unidad === 'horas') return Number(cada) * HORA_MS;
	if (unidad === 'dias') return Number(cada) * 24 * HORA_MS;
	return undefined;
}

/** §4.2: una relativa con intervalo inválido no se crea (el escenario falla, no clasifica). */
const intervaloDeclaradoValido = (s: { cada?: string; unidad?: string }) => s.cada === undefined || intervaloMs(s.cada, s.unidad) !== undefined;

/** Recurrencia de calendario (§4.2): días de la semana (nombres) o días del mes. */
export type Calendario = { semanal: string[] } | { mensual: number[] };

export interface Situacion {
	cada?: string;
	unidad?: string;
	completados: number[];
	ahora?: number;
	cualquierMomento: boolean;
	/** Título y motivos de rechazo propios de la forma; sin motivos y con título, se crea. */
	creacion?: { titulo: string; motivos: string[] };
	calendario?: Calendario;
	creada?: Date;
	/** Ocurrencias cubiertas sin hora (días) por los completados registrados, en orden. */
	cubiertas: Date[];
	/** §4.4: ocurrencias cubiertas con hora (con horario), por su inicio. */
	cubiertasConHora?: number[];
	/** Días de los completados hechos antes de ser de calendario (sin ocurrenciaCubierta); §5.3 los suma a P. */
	sinCubierta: Date[];
	/** Ocurrencia que cubrió el completado hecho por "completo la tarea". */
	cubiertaNueva?: Date;
	/** Tarea puntual (§5.1): su fecha límite, si la tiene; `cualquiera` si el escenario dice que no influye. */
	puntual?: { limite?: Date; cualquiera?: boolean };
	/** §4.1 y §5.5: las ventanas diarias en las que se puede completar, ordenadas. */
	horario?: Ventana[];
	/** §5.8: pausada; y el momento de la última reanudación (los completados anteriores ya no cuentan). */
	pausada?: boolean;
	reanudada?: number;
	/** Hay una ocurrencia cubierta declarada sin el momento de su completado: no se sabe si es anterior a reanudar. */
	cubiertaSinMomento?: boolean;
	/** §5.8: un completado posterior a reanudar con un momento anterior a reanudadaEn: reanudadaEn es ahora, así que no puede pasar. */
	anacronico?: boolean;
	/** §6.2: se abrió el panel de edición; se observa el botón de pausa que ofrece. */
	panel?: boolean;
	/** §5.9: la posposición guardada. */
	pospuesta?: Posposicion;
	/** §6.2: el panel se abrió en `ahora`; se observa su botón de posponer. */
	panelDePosponer?: boolean;
}

// ---- Spec §5.9: posponer ----

export interface Posposicion {
	desde: number;
	hasta: number;
}

const HORAS_DE_LA_OPCION = new Map([
	['1 hora', 1],
	['3 horas', 3]
]);

/** §5.9: pospuesta = { desde: ahora, hasta }; "hasta mañana" son las 07:00 del día local siguiente. */
export function posposicionDe(opcion: string, valor: string): Posposicion | undefined {
	const desde = fecha(valor);
	if (desde === undefined) return undefined;
	if (opcion === 'hasta mañana') {
		const manana = sumarDias(new Date(desde), 1);
		return { desde, hasta: new Date(manana.getFullYear(), manana.getMonth(), manana.getDate(), 7).getTime() };
	}
	const horas = HORAS_DE_LA_OPCION.get(opcion);
	return horas === undefined ? undefined : { desde, hasta: desde + horas * HORA_MS };
}

// ---- Spec §4.1, §5.5, §5.6 y §5.7: horario ----

/** Una ventana diaria [desde, hasta), en minutos desde las 00:00 locales. */
export interface Ventana {
	desde: number;
	hasta: number;
}

const HORA_Y_MINUTO = /^(\d{2}):(\d{2})$/;

/** "HH:MM" de 24 h, en minutos; undefined si no es una hora. */
export function minutosDeLaHora(valor: string | undefined): number | undefined {
	const partes = valor === undefined ? null : HORA_Y_MINUTO.exec(valor);
	if (!partes) return undefined;
	const [hora, minuto] = [Number(partes[1]), Number(partes[2])];
	return hora < 24 && minuto < 60 ? hora * 60 + minuto : undefined;
}

/** §4.1: con las dos horas y desde < hasta, la ventana; si no, los motivos de rechazo. */
function leerVentana(desde: string | undefined, hasta: string | undefined): Ventana | string[] {
	const d = minutosDeLaHora(desde);
	const h = minutosDeLaHora(hasta);
	if (d === undefined || h === undefined) return ['horario incompleto'];
	return d < h ? { desde: d, hasta: h } : ['hora de fin no posterior'];
}

/**
 * §4.1: las ventanas escritas, ordenadas por desde, o todos los motivos de rechazo (el spec no dice cuál se
 * muestra si hay varios: con más de uno, la fila no se decide como equivalente a una con uno solo). Dos
 * ventanas se superponen si una empieza antes de que termine la otra; contiguas, no.
 */
export function leerHorario(escritas: [string | undefined, string | undefined][]): Ventana[] | string[] {
	const leidas = escritas.map(([d, h]) => leerVentana(d, h));
	const motivos = [...new Set(leidas.filter((l): l is string[] => Array.isArray(l)).flat())];
	const ventanas = leidas.filter((l): l is Ventana => !Array.isArray(l)).sort((a, b) => a.desde - b.desde);
	if (ventanas.some((v, i) => i > 0 && v.desde < ventanas[i - 1].hasta)) motivos.push('horarios superpuestos');
	return motivos.length > 0 ? motivos : ventanas;
}

/** Un horario de un paso Given: válido, o undefined. */
export function horarioValido(escritas: [string, string][]): Ventana[] | undefined {
	const leido = leerHorario(escritas);
	return leido.every((v) => typeof v !== 'string') ? (leido as Ventana[]) : undefined;
}

/** Una o dos ventanas de un paso: "de D a H" o "de D a H y de D2 a H2". */
export const HORARIO = 'de (\\S+) a (\\S+)(?: y de (\\S+) a (\\S+))?';

/** Las ventanas que nombran las capturas de HORARIO. */
export const escritasDe = ([d, h, d2, h2]: (string | undefined)[]): [string, string][] =>
	(d2 === undefined ? [[d, h]] : [[d, h], [d2, h2]]) as [string, string][];

/** El instante del día `d` a esos minutos, hora local. */
const aLos = (d: Date, minutos: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, minutos).getTime();

/** Una ventana en un día (§5.6: una ocurrencia), en ms. */
export interface Ocurrencia {
	abre: number;
	cierra: number;
}

const ocurrenciasDel = (vs: Ventana[], d: Date): Ocurrencia[] => vs.map((v) => ({ abre: aLos(d, v.desde), cierra: aLos(d, v.hasta) }));

/** Las ventanas de los días del instante, en orden: `desde` días antes hasta `hasta` días después. */
const ventanasAlrededor = (vs: Ventana[], instante: number, desde: number, hasta: number) =>
	Array.from({ length: hasta - desde + 1 }, (_, i) => ocurrenciasDel(vs, sumarDias(inicioDelDia(instante), desde + i))).flat();

/** §5.5: A, el primer instante ≥ t dentro de una ventana, y C, el hasta de esa ventana. */
export function disponibleYCierre(vs: Ventana[], t: number): { a: number; c: number } {
	const ventana = ventanasAlrededor(vs, t, 0, 1).find(({ cierra }) => t < cierra) as Ocurrencia;
	return { a: Math.max(t, ventana.abre), c: ventana.cierra };
}

export const dentroDeVentana = (vs: Ventana[], t: number) => disponibleYCierre(vs, t).a === t;

/** El hasta de la última ventana del día `d`. */
export const cierreDel = (vs: Ventana[], d: Date) => aLos(d, Math.max(...vs.map((v) => v.hasta)));

/** §5.5 en un momento: el estado, el instante que lo ordena (§6.1) y, en espera, del inicio a la vuelta. */
export interface ConHorario {
	grupo: 'atrasada' | 'pendiente' | 'en espera';
	instante?: number;
	espera?: { inicio: number; vuelve: number };
}

/** Atrasada desde el atraso; antes de A, en espera hasta A desde el inicio de espera; si no, pendiente desde A. */
function segunPlazos(a: number, atraso: number, inicio: number, ahora: number): ConHorario {
	if (ahora >= atraso) return { grupo: 'atrasada', instante: atraso };
	if (ahora < a) return { grupo: 'en espera', instante: a, espera: { inicio, vuelve: a } };
	return { grupo: 'pendiente', instante: a };
}

/**
 * §5.5, periódica: T (pasaría a pendiente sin horario), el inicio de espera y el atraso sin horario de §5.2. Atrasada
 * desde el primero entre C y ese atraso; antes de A, en espera hasta A; si no, pendiente desde A.
 */
export function periodicaConHorario(vs: Ventana[], t: number, inicio: number, atrasoSinHorario: number | undefined, ahora: number): ConHorario {
	const { a, c } = disponibleYCierre(vs, t);
	return segunPlazos(a, Math.min(c, atrasoSinHorario ?? Infinity), inicio, ahora);
}

/** §5.6 y §5.7: A es el inicio de N y el atraso, su hasta (C). */
export const segunOcurrencia = (n: Ocurrencia, inicio: number, ahora: number) => segunPlazos(n.abre, n.cierra, inicio, ahora);

/**
 * §5.5 y §5.7, puntual: con fecha límite, atrasada desde el hasta de la última ventana de ese día. Si no, antes de A
 * espera desde creadaEn; después, dentro de una ventana está pendiente (ordenada por su fecha límite, §6.1) y fuera
 * espera desde el hasta anterior hasta el desde de la próxima.
 */
export function puntualConHorario(vs: Ventana[], creada: number, limite: Date | undefined, ahora: number): ConHorario {
	const atraso = limite && cierreDel(vs, limite);
	if (atraso !== undefined && ahora >= atraso) return { grupo: 'atrasada', instante: atraso };
	const { a } = disponibleYCierre(vs, creada);
	if (ahora < a) return { grupo: 'en espera', instante: a, espera: { inicio: creada, vuelve: a } };
	if (dentroDeVentana(vs, ahora)) return { grupo: 'pendiente', instante: limite?.getTime() };
	const vuelve = disponibleYCierre(vs, ahora).a;
	const cerro = Math.max(...ventanasAlrededor(vs, ahora, -1, 0).map(({ cierra }) => cierra).filter((cierra) => cierra <= ahora));
	return { grupo: 'en espera', instante: vuelve, espera: { inicio: cerro, vuelve } };
}

/** El último instante del día: cubre cualquier ocurrencia de ese día (§5.6, valores sin hora). */
const finDelDia = (d: Date) => sumarDias(d, 1).getTime() - 1;

/**
 * §5.6, P con horario, en ms: la mayor entre las ocurrencias cubiertas con hora (instantes) y los valores sin hora
 * (días cubiertos y días de completadoEn sin ocurrenciaCubierta), que cubren el día entero; sin ninguno, el día
 * anterior a la creación entero.
 */
export function pConHorario(dias: Date[], inicios: number[], creada: Date | undefined): number | undefined {
	const aportes = [...dias.map(finDelDia), ...inicios];
	if (aportes.length > 0) return Math.max(...aportes);
	return creada && finDelDia(sumarDias(inicioDelDia(creada.getTime()), -1));
}

/**
 * §5.6: N, la primera ocurrencia (día de ocurrencia × ventana) con inicio posterior a P. §5.8: una ocurrencia
 * cuya ventana cerró antes de reanudadaEn (o justo al reanudar: la ventana es [desde, hasta)) no cuenta.
 */
export function proximaDeCalendario(calendario: Calendario, vs: Ventana[], p: number, reanudada = -Infinity): Ocurrencia | undefined {
	return Array.from({ length: 33 }, (_, i) => sumarDias(inicioDelDia(p), i))
		.filter((d) => ocurre(calendario, d))
		.flatMap((d) => ocurrenciasDel(vs, d))
		.find(({ abre, cierra }) => abre > p && cierra > reanudada);
}

/** §5.7: una relativa con más de una ventana y el intervalo en días se completa una vez por ventana. */
export const porVentana = (unidad: string | undefined, vs: Ventana[]) => unidad === 'dias' && vs.length > 1;

/** §5.7, N de una relativa por ventana nunca completada: la primera ventana cuyo hasta es posterior a la creación. */
export const primeraSinCerrar = (vs: Ventana[], creada: number) =>
	ventanasAlrededor(vs, creada, 0, 1).find(({ cierra }) => cierra > creada) as Ocurrencia;

/** §5.7, N de una relativa por ventana: la primera ventana con inicio posterior a P del día de P o de `cada` días después. */
export function proximaPorVentana(vs: Ventana[], cada: number, p: number): Ocurrencia {
	const dias = [0, cada].map((n) => sumarDias(inicioDelDia(p), n));
	return dias.flatMap((d) => ocurrenciasDel(vs, d)).find(({ abre }) => abre > p) as Ocurrencia;
}

/**
 * §5.6 y §5.7: el inicio de la ocurrencia que cubre un completado nuevo: antes del hasta de N, N; si no, la más
 * reciente con inicio ≤ ahora entre los días que cuentan (de calendario, sus días de ocurrencia; relativa, cualquiera).
 */
export function inicioQueCubre(n: Ocurrencia, vs: Ventana[], cuenta: (d: Date) => boolean, ahora: number): number {
	if (ahora < n.cierra) return n.abre;
	const dias: Date[] = [];
	for (let d = inicioDelDia(ahora); d.getTime() >= inicioDelDia(n.abre).getTime(); d = sumarDias(d, -1)) dias.push(d);
	const empezadas = dias.filter(cuenta).flatMap((d) => ocurrenciasDel(vs, d).filter(({ abre }) => abre <= ahora));
	return Math.max(...empezadas.map(({ abre }) => abre));
}

export const DIAS_DE_LA_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const NUMERO = /^-?\d+(\.\d+)?$/;
const SOLO_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

/** ISO-8601 sin hora: el inicio de ese día local. */
export function dia(valor: string): Date | undefined {
	const partes = SOLO_FECHA.exec(valor);
	const momento = partes ? fecha(`${valor}T00:00:00`) : undefined;
	return momento === undefined ? undefined : new Date(momento);
}

export const sumarDias = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const inicioDelDia = (ms: number) => sumarDias(new Date(ms), 0);
const ultimoDiaDelMes = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
export const isoDia = (d: Date) =>
	`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** §4.2: un día del mes que no existe en ese mes cae en su último día. */
export function ocurre(calendario: Calendario, d: Date): boolean {
	if ('semanal' in calendario) return calendario.semanal.includes(DIAS_DE_LA_SEMANA[d.getDay()]);
	return calendario.mensual.some((elegido) => Math.min(elegido, ultimoDiaDelMes(d)) === d.getDate());
}

/** La primera ocurrencia posterior al día `p` (N). */
export function primeraPosterior(calendario: Calendario, p: Date): Date | undefined {
	return Array.from({ length: 31 }, (_, i) => sumarDias(p, i + 1)).find((d) => ocurre(calendario, d));
}

/** §5.3: en (P, hoy] la más reciente; si no hay ninguna, N. */
export function ocurrenciaQueCubre(calendario: Calendario, p: Date, hoy: Date): Date | undefined {
	const entre = [];
	for (let d = hoy; d > p; d = sumarDias(d, -1)) entre.push(d);
	return entre.find((d) => ocurre(calendario, d)) ?? primeraPosterior(calendario, p);
}

/**
 * §5.3, P: la mayor entre las ocurrencias cubiertas y los días de completadoEn de los completados sin
 * ocurrenciaCubierta; si no hay completados, el día anterior a la creación.
 */
export function ultimaCubierta(s: Situacion): Date | undefined {
	// Sin horario, el spec no dice cómo cuenta una ocurrencia cubierta con hora (§5.3 habla de días).
	if ((s.cubiertasConHora ?? []).length > 0) return undefined;
	const aportes = [...s.cubiertas, ...s.sinCubierta];
	if (aportes.length > 0) return new Date(Math.max(...aportes.map((d) => d.getTime())));
	return s.creada && sumarDias(inicioDelDia(s.creada.getTime()), -1);
}

/** Lista separada por comas; undefined si algún elemento está vacío. */
export function elementos(valor: string): string[] | undefined {
	const partes = valor.split(',').map((parte) => parte.trim());
	return partes.some((parte) => parte === '') ? undefined : partes;
}

export function diasSemana(valor: string): Calendario | undefined {
	const lista = elementos(valor);
	return lista?.every((d) => DIAS_DE_LA_SEMANA.includes(d)) ? { semanal: lista } : undefined;
}

export function diasMes(valor: string): Calendario | undefined {
	const lista = elementos(valor);
	return lista?.every((d) => NUMERO.test(d) && esDiaDelMes(Number(d))) ? { mensual: lista.map(Number) } : undefined;
}

const esDiaDelMes = (n: number) => Number.isInteger(n) && n >= 1 && n <= 31;

type Regla = [RegExp, (s: Situacion, c: string[]) => boolean | void];

const MOMENTO = (valor: string) => fecha(valor);

function registrar(s: Situacion, valor: string): boolean {
	const momento = MOMENTO(valor);
	if (momento === undefined) return false;
	// §5.8: reanudadaEn es el momento de reanudar, y un completado posterior no puede tener un momento anterior.
	if (s.reanudada !== undefined && momento < s.reanudada) {
		s.anacronico = true;
		return true;
	}
	if (s.horario && (s.calendario || porVentana(s.unidad, s.horario))) return registrarConHorario(s, s.horario, momento);
	s.completados.push(momento);
	if (!s.calendario) {
		s.sinCubierta.push(inicioDelDia(momento));
		return true;
	}
	const p = ultimaCubierta(s);
	const cubierta = p && ocurrenciaQueCubre(s.calendario, p, inicioDelDia(momento));
	if (!cubierta) return false;
	s.cubiertas.push(cubierta);
	return true;
}

/** §5.6 y §5.7: el completado guarda el inicio de la ocurrencia que cubre. */
function registrarConHorario(s: Situacion, vs: Ventana[], momento: number): boolean {
	const n = proximaConHorario(s, vs);
	if (!n) return false;
	const calendario = s.calendario;
	s.completados.push(momento);
	s.cubiertasConHora = [...(s.cubiertasConHora ?? []), inicioQueCubre(n, vs, (d) => !calendario || ocurre(calendario, d), momento)];
	return true;
}

/** "completo la tarea el <t>": además, es el completado nuevo cuya cobertura se verifica. */
function completar(s: Situacion, valor: string): boolean {
	const antes = s.cubiertas.length;
	if (!registrar(s, valor)) return false;
	s.cubiertaNueva = s.cubiertas.length > antes ? s.cubiertas.at(-1) : undefined;
	return true;
}

/**
 * §5.8: reanudar quita la pausa y desde ahí la tarea se evalúa como recién creada en reanudadaEn: con creadaEn =
 * reanudadaEn y sin los completados anteriores. Si algún completado no es anterior (o no se sabe), no se modela.
 */
function reanudarSituacion(s: Situacion, valor: string): boolean {
	const momento = MOMENTO(valor);
	if (momento === undefined || !s.pausada || !intervaloDeclaradoValido(s)) return false;
	if (s.cubiertaSinMomento || s.completados.some((c) => c >= momento)) return false;
	Object.assign(s, { pausada: false, reanudada: momento, creada: new Date(momento), completados: [], cubiertas: [], sinCubierta: [] });
	if (s.cubiertasConHora) s.cubiertasConHora = [];
	return true;
}

function declarar(s: Situacion, calendario: Calendario | undefined, creada?: string): boolean {
	s.calendario = calendario;
	if (creada !== undefined) s.creada = MOMENTO(creada) === undefined ? undefined : new Date(MOMENTO(creada) as number);
	return calendario !== undefined && (creada === undefined || s.creada !== undefined);
}

/** §4.4: una ocurrencia cubierta es una fecha (sin hora) o el inicio de una ocurrencia (con hora). */
function cubiertaDeclarada(s: Situacion, cubierta: string, momento?: string): boolean {
	const d = dia(cubierta);
	const inicio = MOMENTO(cubierta);
	const completadoEn = momento === undefined ? undefined : MOMENTO(momento);
	if (d) s.cubiertas.push(d);
	if (inicio !== undefined) s.cubiertasConHora = [...(s.cubiertasConHora ?? []), inicio];
	if (completadoEn !== undefined) s.completados.push(completadoEn);
	if (momento === undefined) s.cubiertaSinMomento = true;
	return (d !== undefined || inicio !== undefined) && (momento === undefined || completadoEn !== undefined);
}

/** Creación de calendario: motivos de rechazo de los días y título. */
function crearCalendario(s: Situacion, titulo: string, motivos: string[] | undefined): boolean {
	if (motivos) s.creacion = { titulo, motivos };
	return motivos !== undefined;
}

const motivosSemana = (valor: string) => (diasSemana(valor) ? [] : undefined);
/** §4.2: cada día del mes es un entero entre 1 y 31; si no, se rechaza toda la tarea. */
export function motivosMes(valor: string): string[] | undefined {
	const lista = elementos(valor);
	if (!lista?.every((d) => NUMERO.test(d))) return undefined;
	return lista.every((d) => esDiaDelMes(Number(d))) ? [] : ['día del mes inválido'];
}

/** §4.1: la fecha límite debe ser una fecha AAAA-MM-DD que existe; el pasado se acepta. */
export const motivosFechaLimite = (valor: string) => (dia(valor) ? [] : ['fecha límite inválida']);

/** §4.1: vacío o solo espacios es sin emoji; si no, exactamente un grafema emoji (pictograma, bandera o keycap). */
export function motivosEmoji(valor: string): string[] {
	const escrito = valor.trim();
	const grafemas = [...new Intl.Segmenter('es', { granularity: 'grapheme' }).segment(escrito)].length;
	const esEmoji = /^(?:\p{Extended_Pictographic}|\p{Regional_Indicator}{2}|[0-9#*]\uFE0F?\u20E3)/u.test(escrito);
	const unEmoji = grafemas === 1 && esEmoji;
	return escrito === '' || unEmoji ? [] : ['emoji inválido'];
}

/** Puntual declarada: con fecha límite válida, sin ella, o con una cualquiera. */
function declararPuntual(s: Situacion, limite?: string): boolean {
	const d = limite === undefined ? undefined : dia(limite);
	s.puntual = { limite: d };
	return limite === undefined || d !== undefined;
}

const COMPLETADOS_DE_PUNTUAL: Record<string, number> = { 'un completado': 1, 'dos completados': 2 };

/** Completados ya registrados cuyo momento el escenario dice que no influye (§5.1). */
function tieneCompletados(s: Situacion, cantidad: string): boolean {
	s.completados.push(...Array.from({ length: COMPLETADOS_DE_PUNTUAL[cantidad] }, () => 0));
	return true;
}

/** §4.1: los motivos de rechazo del horario escrito al crear (ninguno si es válido). */
function motivosDeHorario(escritas: [string | undefined, string | undefined][]): string[] {
	const leido = leerHorario(escritas);
	return leido.filter((motivo): motivo is string => typeof motivo === 'string');
}

/** §4.1: una relativa en horas no puede tener más de una ventana. */
const motivosDeRelativa = (cada: string, unidad: string, escritas: unknown[]) => [
	...(intervaloValido(cada) ? [] : ['intervalo inválido']),
	...(unidad === 'horas' && escritas.length > 1 ? ['varios horarios en una relativa en horas'] : [])
];

/** Un horario ya guardado: tiene que ser válido, también para el intervalo de una relativa (§4.1). */
function declararHorario(s: Situacion, escritas: [string, string][]): boolean {
	s.horario = horarioValido(escritas);
	return s.horario !== undefined && !(s.unidad === 'horas' && s.horario.length > 1);
}

function declararCreada(s: Situacion, creada: string): boolean {
	const momento = MOMENTO(creada);
	s.creada = momento === undefined ? undefined : new Date(momento);
	return momento !== undefined;
}

/** Horario (§4.1, §5.5), antes que las reglas generales: sus pasos también terminan en texto libre. */
const REGLAS_DE_HORARIO: Regla[] = [
	[new RegExp(`^la tarea se puede completar ${HORARIO}$`), (s, horas) => declararHorario(s, escritasDe(horas))],
	[/^una tarea puntual sin fecha límite creada el (\S+)$/, (s, [c]) => declararPuntual(s) && declararCreada(s, c)],
	[/^una tarea puntual con fecha límite (\S+) creada el (\S+)$/, (s, [l, c]) => declararPuntual(s, l) && declararCreada(s, c)],
	[
		/^una tarea periódica relativa cada (\S+) (\S+) creada el (\S+)$/,
		(s, [n, u, c]) => (Object.assign(s, { cada: n, unidad: u }), declararCreada(s, c))
	],
	[/^consulto Pendientes el (\S+)$/, (s, [t]) => ((s.ahora = MOMENTO(t)), s.ahora !== undefined)],
	// El check no cambia el estado ni el checkbox de la tarea (§6.1).
	[/^Mostrar completadas está encendido$/, () => true],
	[
		new RegExp(`^creo una tarea puntual con título (.*) y horario ${HORARIO}$`),
		(s, [t, ...horas]) => void (s.creacion = { titulo: t, motivos: motivosDeHorario(escritasDe(horas)) })
	],
	[
		new RegExp(`^creo una tarea puntual con un título válido y horario ${HORARIO}$`),
		(s, horas) => void (s.creacion = { titulo: 'Tarea', motivos: motivosDeHorario(escritasDe(horas)) })
	],
	[
		/^creo una tarea puntual con un título válido y un horario con solo la hora de inicio (\S+)$/,
		(s, [d]) => void (s.creacion = { titulo: 'Tarea', motivos: motivosDeHorario([[d, undefined]]) })
	],
	[
		/^creo una tarea puntual con un título válido y un horario con solo la hora de fin (\S+)$/,
		(s, [h]) => void (s.creacion = { titulo: 'Tarea', motivos: motivosDeHorario([[undefined, h]]) })
	],
	[
		/^creo una tarea puntual con un título válido, horario de (\S+) a (\S+) y otro horario con solo la hora de inicio (\S+)$/,
		(s, [d, h, d2]) => void (s.creacion = { titulo: 'Tarea', motivos: motivosDeHorario([[d, h], [d2, undefined]]) })
	],
	[
		new RegExp(`^creo una tarea periódica relativa con título (.*) cada (\\S+) (\\S+) y horario ${HORARIO}$`),
		(s, [t, c, u, ...horas]) => {
			const escritas = escritasDe(horas);
			// Un error del horario mismo tiene prioridad sobre el de la relativa en horas: con él, el spec no decide cuál se ve.
			const delHorario = motivosDeHorario(escritas);
			const deRelativa = motivosDeRelativa(c, u, escritas);
			if (delHorario.length > 0 && deRelativa.includes('varios horarios en una relativa en horas')) return false;
			s.creacion = { titulo: t, motivos: [...deRelativa, ...delHorario] };
		}
	],
	[
		new RegExp(`^creo una tarea periódica semanal con título (.*) los (.*) y horario ${HORARIO}$`),
		(s, [t, dias, ...horas]) => {
			const motivos = motivosSemana(dias);
			return crearCalendario(s, t, motivos && [...motivos, ...motivosDeHorario(escritasDe(horas))]);
		}
	]
];

const REGLAS: Regla[] = [
	...REGLAS_DE_HORARIO,
	// Puntual (§4.1 y §5.1).
	[/^una tarea puntual sin fecha límite$/, (s) => declararPuntual(s)],
	[/^una tarea puntual con fecha límite (\S+)$/, (s, [l]) => declararPuntual(s, l)],
	[/^una tarea puntual con una fecha límite cualquiera$/, (s) => void (s.puntual = { cualquiera: true })],
	[/^la tarea tiene (un completado|dos completados)$/, (s, [c]) => tieneCompletados(s, c)],
	// Creada con una fecha límite válida y consultada: creadaEn no influye en el estado (§5.1).
	[/^creo el (\S+) una tarea puntual con un título válido y fecha límite (\S+)$/, (s, [, l]) => declararPuntual(s, l)],
	[
		/^creo una tarea puntual con título (.*) y fecha límite (\S+)$/,
		(s, [t, l]) => void (s.creacion = { titulo: t, motivos: motivosFechaLimite(l) })
	],
	[
		/^creo una tarea puntual con título (.*), emoji (.*) y nota (.*)$/,
		(s, [t, e]) => void (s.creacion = { titulo: t, motivos: motivosEmoji(e) })
	],
	[/^creo una tarea puntual con título (.*) y sin fecha límite$/, (s, [t]) => void (s.creacion = { titulo: t, motivos: [] })],
	[
		/^creo una tarea puntual con un título de solo espacios y sin fecha límite$/,
		(s) => void (s.creacion = { titulo: '   ', motivos: [] })
	],
	[
		/^creo una tarea puntual con un título válido y fecha límite (\S+)$/,
		(s, [l]) => void (s.creacion = { titulo: 'Tarea', motivos: motivosFechaLimite(l) })
	],
	[/^una tarea periódica relativa cada (\S+) (\S+)$/, (s, [c, u]) => void Object.assign(s, { cada: c, unidad: u })],
	[/^una tarea periódica relativa nunca completada$/, () => undefined],
	[/^la tarea fue completada el (\S+)$/, (s, [t]) => registrar(s, t)],
	[/^completo la tarea el (\S+)$/, (s, [t]) => completar(s, t)],
	[/^consulto el estado el (\S+)$/, (s, [t]) => ((s.ahora = MOMENTO(t)), s.ahora !== undefined)],
	[/^consulto el estado en cualquier momento$/, (s) => void (s.cualquierMomento = true)],
	[
		/^creo una tarea periódica relativa con título (.*) cada (\S+) (\S+)$/,
		(s, [t, c]) => void (s.creacion = { titulo: t, motivos: intervaloValido(c) ? [] : ['intervalo inválido'] })
	],
	[
		/^creo una tarea periódica relativa con título (.*) y un intervalo válido$/,
		(s, [t]) => void (s.creacion = { titulo: t, motivos: [] })
	],
	[
		/^creo una tarea periódica relativa con un título de solo espacios y un intervalo válido$/,
		(s) => void (s.creacion = { titulo: '   ', motivos: [] })
	],
	[
		/^creo una tarea periódica relativa con un título válido y (\S+) como cantidad del intervalo$/,
		(s, [c]) =>
			void (s.creacion = { titulo: 'Regar plantas', motivos: intervaloValido(c) ? [] : ['intervalo inválido'] })
	],
	// Estado y completado de calendario (§5.3). Con completados, creadaEn no influye.
	[/^una tarea periódica semanal los (.*) creada el (\S+)$/, (s, [d, c]) => declarar(s, diasSemana(d), c)],
	[/^una tarea periódica mensual los días (.*) creada el (\S+)$/, (s, [d, c]) => declarar(s, diasMes(d), c)],
	[/^una tarea periódica semanal los (.*)$/, (s, [d]) => declarar(s, diasSemana(d))],
	[/^una tarea periódica mensual los días (.*)$/, (s, [d]) => declarar(s, diasMes(d))],
	[/^la tarea tiene un completado del (\S+) que cubre el (\S+)$/, (s, [t, c]) => cubiertaDeclarada(s, c, t)],
	[/^la tarea tiene un completado que cubre el (\S+)$/, (s, [c]) => cubiertaDeclarada(s, c)],
	[/^la tarea tiene otro completado más antiguo que cubre la misma ocurrencia$/, () => undefined],
	// §5.8 y §6.2: solo una periódica se pausa (el botón Pausar del panel); Reanudar solo la pausada.
	[/^(?:la tarea fue pausada|pauso la tarea)$/, (s) => !s.puntual && !s.pausada && void (s.pausada = true)],
	[/^reanudo la tarea el (\S+)$/, (s, [t]) => reanudarSituacion(s, t)],
	[/^abro la tarea en el panel de edición$/, (s) => void (s.panel = true)],
	// §5.9 y §6.2: posponer actúa en el momento; quitar borra el campo.
	[/^(?:pospongo la tarea|la tarea fue pospuesta) con la opción (.+) el (\S+)$/, (s, [o, m]) => posponerSituacion(s, o, m)],
	[/^quito la posposición$/, (s) => s.pospuesta !== undefined && void (s.pospuesta = undefined)],
	[/^abro la tarea en el panel de edición el (\S+)$/, (s, [t]) => ((s.panelDePosponer = true), (s.ahora = MOMENTO(t)), s.ahora !== undefined)],
	// Creación de calendario (§4.1 y §4.2).
	[
		/^creo una tarea periódica semanal con título (.*) los (.*)$/,
		(s, [t, d]) => crearCalendario(s, t, motivosSemana(d))
	],
	[
		/^creo una tarea periódica mensual con título (.*) los días (.*)$/,
		(s, [t, d]) => crearCalendario(s, t, motivosMes(d))
	],
	[/^creo una tarea periódica (?:semanal|mensual) con título (.*) y días válidos$/, (s, [t]) => crearCalendario(s, t, [])],
	[
		/^creo una tarea periódica (?:semanal|mensual) con un título de solo espacios y días válidos$/,
		(s) => crearCalendario(s, '   ', [])
	],
	[
		/^creo una tarea periódica (?:semanal|mensual) con un título válido y sin días$/,
		(s) => crearCalendario(s, 'Tarea', ['falta de días'])
	],
	[
		/^creo una tarea periódica mensual con un título válido los días (.*)$/,
		(s, [d]) => crearCalendario(s, 'Tarea', motivosMes(d))
	],
	[
		/^creo una tarea periódica de calendario con un título válido y días de la semana y del mes a la vez$/,
		(s) => crearCalendario(s, 'Tarea', ['semanal y mensual combinados'])
	]
];

/** Sustituye <columna> por su valor en la fila; undefined si falta. */
export function resolver(texto: string, fila: FilaOraculo): string | undefined {
	let faltante = false;
	const resuelto = texto.replace(/<([A-Za-z0-9_]+)>/g, (_, nombre: string) => {
		if (fila[nombre] === undefined) faltante = true;
		return fila[nombre] ?? '';
	});
	return faltante ? undefined : resuelto;
}

function armar(pasos: PasoOraculo[], fila: FilaOraculo): Situacion | undefined {
	const s: Situacion = { completados: [], cualquierMomento: false, cubiertas: [], sinCubierta: [] };
	for (const paso of pasos) {
		const texto = resolver(paso.text, fila);
		if (texto === undefined) return undefined;
		const regla = REGLAS.map(([patron, aplicar]) => ({ coincide: patron.exec(texto), aplicar })).find(
			(r) => r.coincide
		);
		if (!regla?.coincide || regla.aplicar(s, regla.coincide.slice(1)) === false) return undefined;
	}
	return s;
}

function clasificarCreacion(c: { titulo: string; motivos: string[] }): string {
	const motivos = [...(c.titulo.trim() === '' ? ['título vacío'] : []), ...c.motivos];
	return motivos.length === 0 ? 'creada' : `rechazada: ${motivos.join(', ')}`;
}

/** Spec §5.1: con completado, fuera de Pendientes; si no, atrasada desde el inicio del día siguiente al límite. */
function clasificarPuntual(s: Situacion, puntual: NonNullable<Situacion['puntual']>): string | undefined {
	if (s.completados.length > 0) return 'no aparece en Pendientes';
	if (puntual.cualquiera) return undefined;
	if (puntual.limite === undefined) return s.cualquierMomento || s.ahora !== undefined ? 'pendiente' : undefined;
	if (s.ahora === undefined) return undefined;
	return s.ahora >= sumarDias(puntual.limite, 1).getTime() ? 'atrasada' : 'pendiente';
}

/** §5.2 y §5.3: progreso = transcurrido / espera; con ahora < U (relojes desfasados) es 0 por regla del spec. */
function progreso(desde: number, ahora: number, espera: number): string | undefined {
	if (ahora < desde) return '0';
	if (!(espera > 0)) return undefined;
	return String(Math.min(1, (ahora - desde) / espera));
}

/** El "en espera" de la clasificación, con su progreso solo si el escenario lo observa. */
function enEspera(observa: Observa, p: string | undefined): string | undefined {
	if (!observa.progreso) return 'en espera';
	return p === undefined ? undefined : `en espera ${p}`;
}

/** Spec §5.2. */
function clasificarEstado(s: Situacion, observa: Observa): string | undefined {
	if (s.completados.length === 0) return s.cualquierMomento || s.ahora !== undefined ? 'pendiente' : undefined;
	if (s.ahora === undefined) return undefined;
	// Sin intervalo declarado ("el intervalo no influye en este borde"): con ahora ≤ U la tarea está
	// en espera con progreso 0 sea cual sea el intervalo (§5.2: ahora < U → en espera, progreso 0).
	if (s.cada === undefined && s.ahora <= Math.max(...s.completados)) return enEspera(observa, '0');
	const intervalo = intervaloMs(s.cada, s.unidad);
	if (intervalo === undefined) return undefined;
	const vencimiento = Math.max(...s.completados) + intervalo;
	if (s.ahora < vencimiento) return enEspera(observa, progreso(Math.max(...s.completados), s.ahora, intervalo));
	return s.ahora < vencimiento + intervalo ? 'pendiente' : 'atrasada';
}

/** Spec §5.3: hoy < N en espera, hoy = N pendiente, hoy > N atrasada; o la ocurrencia que cubrió el completado nuevo. */
function clasificarCalendario(s: Situacion, calendario: Calendario, observa: Observa): string | undefined {
	if (s.ahora === undefined) return s.cubiertaNueva && `cubre ${isoDia(s.cubiertaNueva)}`;
	const p = ultimaCubierta(s);
	const n = p && primeraPosterior(calendario, p);
	if (!n) return undefined;
	const hoy = inicioDelDia(s.ahora).getTime();
	if (hoy < n.getTime()) {
		const inicio = s.completados.length > 0 ? Math.max(...s.completados) : s.creada?.getTime();
		return enEspera(observa, inicio === undefined ? undefined : progreso(inicio, s.ahora, n.getTime() - inicio));
	}
	return hoy === n.getTime() ? 'pendiente' : 'atrasada';
}

/** §5.8: la fila pide completar después de reanudar con un momento anterior a reanudadaEn: no es un escenario posible. */
export function esCronologiaImposible(pasosDeEntrada: PasoOraculo[], fila: FilaOraculo): boolean {
	return armar(pasosDeEntrada, fila)?.anacronico === true;
}

/** Clasificación de la fila según el spec, o undefined si el oráculo no la reconoce. */
export function clasificarFila(
	pasosDeEntrada: PasoOraculo[],
	fila: FilaOraculo,
	observa: Observa = { progreso: false }
): string | undefined {
	const s = armar(pasosDeEntrada, fila);
	if (!s) return undefined;
	if (s.creacion) return clasificarCreacion(s.creacion);
	return clasificarSituacion(s, observa);
}

/**
 * §5.6 y §5.7: N de una de calendario con horario, o de una relativa por ventana; undefined si no se deduce. Los
 * completados de una relativa sin ocurrencia cubierta (sinCubierta) cubren el día entero de su completadoEn.
 */
function proximaConHorario(s: Situacion, vs: Ventana[]): Ocurrencia | undefined {
	const p = pConHorario([...s.cubiertas, ...s.sinCubierta], s.cubiertasConHora ?? [], s.creada);
	if (s.calendario) return p === undefined ? undefined : proximaDeCalendario(s.calendario, vs, p, s.reanudada);
	if (s.completados.length === 0) return s.creada && primeraSinCerrar(vs, s.creada.getTime());
	return p === undefined || !intervaloValido(s.cada) ? undefined : proximaPorVentana(vs, Number(s.cada), p);
}

/** §5.5–§5.7: el momento con horario de la tarea armada; undefined si falta algo que el spec necesita. */
function conHorarioDe(s: Situacion, vs: Ventana[], ahora: number): ConHorario | undefined {
	if (s.puntual) return s.puntual.cualquiera || !s.creada ? undefined : puntualConHorario(vs, s.creada.getTime(), s.puntual.limite, ahora);
	const ultimo = s.completados.length > 0 ? Math.max(...s.completados) : undefined;
	if (s.calendario || porVentana(s.unidad, vs)) {
		const n = proximaConHorario(s, vs);
		const inicio = ultimo ?? s.creada?.getTime();
		return n && inicio !== undefined ? segunOcurrencia(n, inicio, ahora) : undefined;
	}
	if (ultimo === undefined) return s.creada && periodicaConHorario(vs, s.creada.getTime(), s.creada.getTime(), undefined, ahora);
	const intervalo = intervaloMs(s.cada, s.unidad);
	return intervalo === undefined ? undefined : periodicaConHorario(vs, ultimo + intervalo, ultimo, ultimo + 2 * intervalo, ahora);
}

/** §5.5: como §5.1–§5.3, con los momentos que corre el horario. Una puntual con completados está completada (§5.1). */
function clasificarConHorario(s: Situacion, vs: Ventana[], observa: Observa): string | undefined {
	if (s.puntual && s.completados.length > 0) return 'no aparece en Pendientes';
	if (s.ahora === undefined) return undefined;
	const momento = conHorarioDe(s, vs, s.ahora);
	if (!momento?.espera) return momento?.grupo;
	const { inicio, vuelve } = momento.espera;
	return enEspera(observa, progreso(inicio, s.ahora, vuelve - inicio));
}

/** §5.1–§5.7: el estado por la regla de la tarea, sin la posposición. */
function estadoSegunSuRegla(s: Situacion, observa: Observa): string | undefined {
	if (s.horario) return clasificarConHorario(s, s.horario, observa);
	if (s.puntual) return clasificarPuntual(s, s.puntual);
	return s.calendario ? clasificarCalendario(s, s.calendario, observa) : clasificarEstado(s, observa);
}

const posposicionVigente = ({ pospuesta, ahora }: Situacion) => (pospuesta && ahora !== undefined && ahora < pospuesta.hasta ? pospuesta : undefined);

const SIN_PROGRESO: Observa = { progreso: false };
const pendienteOAtrasada = (estado: string | undefined) => estado === 'pendiente' || estado === 'atrasada';

/** §5.9: está en espera por la posposición: con ahora < hasta, estaría pendiente o atrasada por su regla. */
export function enEsperaPorPosposicion(s: Situacion): boolean {
	return posposicionVigente(s) !== undefined && pendienteOAtrasada(estadoSegunSuRegla(s, SIN_PROGRESO));
}

/** §5.9: progreso = (ahora − desde) / (hasta − desde); con ahora < desde, 0. */
function progresoDePosposicion({ desde, hasta }: Posposicion, ahora: number): string {
	return ahora < desde ? '0' : String((ahora - desde) / (hasta - desde));
}

/** §5.9: si estaría en espera por su propia regla, la posposición no cambia nada. */
function clasificarEstadoDeSituacion(s: Situacion, observa: Observa): string | undefined {
	const vigente = posposicionVigente(s);
	return vigente && enEsperaPorPosposicion(s)
		? enEspera(observa, progresoDePosposicion(vigente, s.ahora as number))
		: estadoSegunSuRegla(s, observa);
}

/**
 * §5.9 y §6.2: con la posposición vigente, Quitar posponer; si no, Posponer solo en una pendiente o atrasada no
 * pausada. undefined si el estado no se deduce.
 */
export function botonDePosponer(s: Situacion): string | undefined {
	if (!intervaloDeclaradoValido(s)) return undefined;
	if (posposicionVigente(s)) return 'Quitar posponer';
	if (s.pausada) return 'ninguno';
	const estado = estadoSegunSuRegla(s, SIN_PROGRESO);
	if (estado === undefined) return undefined;
	return pendienteOAtrasada(estado) ? 'Posponer' : 'ninguno';
}

const dosCifras = (n: number) => String(n).padStart(2, '0');

/** §6.2: "Pospuesta hasta HH:MM", con "mañana" si hasta es del día siguiente a ahora; más lejos, el spec no lo decide. */
function textoDePosposicion(s: Situacion): string | undefined {
	const vigente = posposicionVigente(s);
	if (!vigente) return 'sin texto';
	const hasta = new Date(vigente.hasta);
	const hora = `${dosCifras(hasta.getHours())}:${dosCifras(hasta.getMinutes())}`;
	const hoy = inicioDelDia(s.ahora as number);
	if (inicioDelDia(vigente.hasta).getTime() === hoy.getTime()) return `Pospuesta hasta ${hora}`;
	return inicioDelDia(vigente.hasta).getTime() === sumarDias(hoy, 1).getTime() ? `Pospuesta hasta mañana ${hora}` : undefined;
}

/** §6.2: el botón de posponer del panel y, si un Then lo afirma, lo que dice de la posposición. */
function clasificarPanelDePosponer(s: Situacion, observa: Observa): string | undefined {
	const boton = botonDePosponer(s);
	if (!boton || !observa.textoDelPanel) return boton;
	const texto = textoDePosposicion(s);
	return texto && `${boton}, ${texto}`;
}

/** §6.2: Posponer solo actúa si el panel lo ofrece en ese momento. Sin creadaEn, la tarea se creó antes de todo. */
function posponerSituacion(s: Situacion, opcion: string, valor: string): boolean {
	const pospuesta = posposicionDe(opcion, valor);
	if (!pospuesta) return false;
	if (s.puntual && !s.creada) s.creada = new Date(CREADA_POR_OMISION);
	if (botonDePosponer({ ...s, ahora: pospuesta.desde }) !== 'Posponer') return false;
	s.pospuesta = pospuesta;
	return true;
}

/**
 * §6.1 y §5.5: el checkbox que borraría (puntual completada, o periódica completada cuyo último completado es de hoy
 * o posterior) está habilitado; el que completaría, solo dentro de la ventana del horario.
 */
function checkboxDe(s: Situacion, clasificacion: string): string | undefined {
	if (s.ahora === undefined) return undefined;
	const conCompletados = s.completados.length > 0;
	// §5.9: una pospuesta no está completada.
	const enEsperaPropia = clasificacion.startsWith('en espera') && !enEsperaPorPosposicion(s);
	const completada = clasificacion === 'no aparece en Pendientes' || esCompletada(Boolean(s.puntual), enEsperaPropia, conCompletados);
	const borraria = completada && (Boolean(s.puntual) || Math.max(...s.completados) >= inicioDelDia(s.ahora).getTime());
	return borraria || !s.horario || dentroDeVentana(s.horario, s.ahora) ? 'habilitado' : 'deshabilitado';
}

/** §6.2: el botón de pausa del panel: ninguno en una puntual; Reanudar si está pausada; si no, Pausar. */
function botonDePausa(s: Situacion): string | undefined {
	if (!intervaloDeclaradoValido(s)) return undefined;
	if (s.puntual) return 'no ofrece pausar';
	return s.pausada ? 'ofrece Reanudar' : 'ofrece Pausar';
}

/** §5.8: una pausada no tiene estado, no está completada y su checkbox está deshabilitado, sea cual sea ahora. */
function clasificarPausada(s: Situacion, observa: Observa): string | undefined {
	if (!intervaloDeclaradoValido(s) || (s.ahora === undefined && !s.cualquierMomento)) return undefined;
	if (!observa.checkbox) return 'pausada';
	return observa.soloCheckbox ? 'checkbox deshabilitado' : 'pausada, checkbox deshabilitado';
}

/** §5.3: con el estado consultado, la ocurrencia que cubrió el completado nuevo, si un Then la afirma. */
function conCubierta(s: Situacion, observa: Observa, clasificacion: string): string | undefined {
	if (!observa.cubierta || s.ahora === undefined) return clasificacion;
	return s.cubiertaNueva && `${clasificacion}, cubre ${isoDia(s.cubiertaNueva)}`;
}

/**
 * Clasificación de una tarea ya armada: puntual (§5.1), relativa (§5.2), de calendario (§5.3), con horario (§5.5),
 * pausada (§5.8), pospuesta (§5.9); o, con el panel abierto, su botón de pausa o de posponer (§6.2); o el valor
 * guardado de `pospuesta` (§4.1), si es lo que un Then afirma.
 */
export function clasificarSituacion(s: Situacion, observa: Observa): string | undefined {
	if (observa.pospuesta) return s.pospuesta && `pospuesta ${s.pospuesta.desde} ${s.pospuesta.hasta}`;
	if (s.panelDePosponer) return clasificarPanelDePosponer(s, observa);
	if (s.panel) return botonDePausa(s);
	if (s.pausada) return clasificarPausada(s, observa);
	const estado = clasificarEstadoDeSituacion(s, observa);
	const clasificacion = estado === undefined ? undefined : conCubierta(s, observa, estado);
	if (clasificacion === undefined) return undefined;
	const visible = observa.soloAparicion && (clasificacion === 'pendiente' || clasificacion === 'atrasada') ? 'aparece en Pendientes' : clasificacion;
	if (!observa.checkbox) return visible;
	const checkbox = checkboxDe(s, clasificacion);
	if (!checkbox) return undefined;
	return observa.soloCheckbox ? `checkbox ${checkbox}` : `${visible}, checkbox ${checkbox}`;
}

// ---- Spec §6.1: orden de la lista Pendientes ----

export interface TareaDelOrden {
	titulo: string;
	creada: number;
	/** Puntual: su fecha límite (día), si la tiene. */
	limite?: Date;
	puntual: boolean;
	/** Relativa: intervalo y completados; calendario: recurrencia y ocurrencias cubiertas. */
	intervalo?: number;
	completados: number[];
	calendario?: Calendario;
	cubiertas: Date[];
	/** §4.4: ocurrencias cubiertas con hora, por su inicio. */
	cubiertasConHora?: number[];
	/** Tiene completados cuyo momento el escenario dice que no influye ("la tarea X tiene un completado"). */
	conCompletadoSinMomento?: boolean;
	/** §5.5: sus ventanas diarias, ordenadas, si tiene horario. */
	horario?: Ventana[];
	/** §4.1: rapida, media o larga; sin el campo, sin estimar. */
	esfuerzo?: string;
	/** §5.8: pausada; y el momento de la última reanudación. */
	pausada?: boolean;
	reanudada?: number;
	/** §4.2: el intervalo escrito no es válido (la tarea no se crea); solo lo miran las reglas de la pausa. */
	intervaloInvalido?: boolean;
	/** §5.9: la posposición guardada. */
	pospuesta?: Posposicion;
}

/** Antes de cualquier otra fecha de los escenarios: "se crearon en el mismo instante, anterior a todo". */
const CREADA_POR_OMISION = 0;

/** Instante y grupo (0 atrasada, 1 pendiente, 2 en espera) de una tarea, según la tabla de §6.1. */
interface Urgencia {
	grupo: number;
	instante?: number;
	/** §5.9: está en espera por la posposición: no cuenta como completada. */
	porPosposicion?: boolean;
}

function urgenciaPuntual(t: TareaDelOrden, ahora: number): Urgencia | undefined {
	if (!t.limite) return { grupo: 1 };
	const siguiente = sumarDias(t.limite, 1).getTime();
	return ahora >= siguiente ? { grupo: 0, instante: siguiente } : { grupo: 1, instante: t.limite.getTime() };
}

function urgenciaRelativa(t: TareaDelOrden, ahora: number): Urgencia | undefined {
	if (t.completados.length === 0) return { grupo: 1, instante: t.creada };
	const u = Math.max(...t.completados);
	// Sin intervalo declarado: §4.2 lo hace de al menos 1 hora, así que hasta U + 1 h está en espera (V no se deduce).
	if (t.intervalo === undefined) return ahora < u + HORA_MS ? { grupo: 2 } : undefined;
	const v = u + t.intervalo;
	if (ahora < v) return { grupo: 2, instante: v };
	return ahora < v + t.intervalo ? { grupo: 1, instante: v } : { grupo: 0, instante: v + t.intervalo };
}

function urgenciaCalendario(t: TareaDelOrden, calendario: Calendario, ahora: number): Urgencia | undefined {
	// Sin horario, el spec no dice cómo cuenta una ocurrencia cubierta con hora (§5.3 habla de días).
	if ((t.cubiertasConHora ?? []).length > 0) return undefined;
	const p =
		t.cubiertas.length > 0 ? new Date(Math.max(...t.cubiertas.map((d) => d.getTime()))) : sumarDias(inicioDelDia(t.creada), -1);
	const n = primeraPosterior(calendario, p);
	if (!n) return undefined;
	const hoy = inicioDelDia(ahora).getTime();
	if (hoy < n.getTime()) return { grupo: 2, instante: n.getTime() };
	return hoy === n.getTime() ? { grupo: 1, instante: n.getTime() } : { grupo: 0, instante: sumarDias(n, 1).getTime() };
}

const GRUPO_DE: Record<ConHorario['grupo'], number> = { atrasada: 0, pendiente: 1, 'en espera': 2 };

/** §5.5: T, el inicio de espera y el atraso sin horario de una relativa del orden; undefined si no se deducen. */
function momentosDelOrden(t: TareaDelOrden): [number, number, number | undefined] | undefined {
	const ultimo = t.completados.length > 0 ? Math.max(...t.completados) : undefined;
	if (ultimo === undefined) return [t.creada, t.creada, undefined];
	return t.intervalo === undefined ? undefined : [ultimo + t.intervalo, ultimo, ultimo + 2 * t.intervalo];
}

/**
 * §5.5–§5.6: una periódica del orden con horario. De calendario, según N (§5.6; el inicio de espera solo da el
 * progreso: no ordena). Una relativa con varias ventanas (§5.7) no se modela en el orden.
 */
function periodicaDelOrden(t: TareaDelOrden, vs: Ventana[], ahora: number): ConHorario | undefined {
	if (t.calendario) {
		const p = pConHorario(t.cubiertas, t.cubiertasConHora ?? [], new Date(t.creada)) as number;
		const n = proximaDeCalendario(t.calendario, vs, p, t.reanudada);
		return n && segunOcurrencia(n, t.completados.length > 0 ? Math.max(...t.completados) : t.creada, ahora);
	}
	const momentos = vs.length > 1 ? undefined : momentosDelOrden(t);
	return momentos && periodicaConHorario(vs, ...momentos, ahora);
}

/** §5.5 y §6.1: con horario, el grupo y el instante que lo ordena. */
function urgenciaConHorario(t: TareaDelOrden, vs: Ventana[], ahora: number): Urgencia | undefined {
	const conHorario = t.puntual ? puntualConHorario(vs, t.creada, t.limite, ahora) : periodicaDelOrden(t, vs, ahora);
	return conHorario && { grupo: GRUPO_DE[conHorario.grupo], instante: conHorario.instante };
}

function urgenciaSegunSuRegla(t: TareaDelOrden, ahora: number): Urgencia | undefined {
	if (t.horario) return urgenciaConHorario(t, t.horario, ahora);
	if (t.puntual) return urgenciaPuntual(t, ahora);
	return t.calendario ? urgenciaCalendario(t, t.calendario, ahora) : urgenciaRelativa(t, ahora);
}

/** §5.9 y §6.1: la pospuesta que estaría pendiente o atrasada va en espera, y su clave de orden es hasta. */
function urgenciaDe(t: TareaDelOrden, ahora: number): Urgencia | undefined {
	const propia = urgenciaSegunSuRegla(t, ahora);
	if (!propia || propia.grupo === 2 || !t.pospuesta || ahora >= t.pospuesta.hasta) return propia;
	return { grupo: 2, instante: t.pospuesta.hasta, porPosposicion: true };
}

/** §6.2: Posponer solo actúa si el panel lo ofrece en ese momento: pendiente o atrasada, no pausada ni pospuesta. */
function posponerDelOrden(t: TareaDelOrden, pospuesta: Posposicion): boolean {
	if (t.pausada || t.intervaloInvalido || (t.puntual && conCompletados(t))) return false;
	const evaluable = evaluada(t);
	const urgencia = evaluable && urgenciaDe(evaluable, pospuesta.desde);
	if (!urgencia || urgencia.grupo === 2) return false;
	t.pospuesta = pospuesta;
	return true;
}

export const COLACION = new Intl.Collator('es', { sensitivity: 'base' });

type ReglaDeOrden = [RegExp, (tareas: TareaDelOrden[], c: string[]) => boolean];

const ahoraDe = (valor: string | undefined) => (valor === undefined ? undefined : MOMENTO(valor));

function nueva(titulo: string, creada: string | undefined, resto: Partial<TareaDelOrden>): TareaDelOrden | undefined {
	const momento = creada === undefined ? CREADA_POR_OMISION : MOMENTO(creada);
	if (momento === undefined) return undefined;
	return { titulo, creada: momento, puntual: false, completados: [], cubiertas: [], ...resto };
}

function agregar(tareas: TareaDelOrden[], t: TareaDelOrden | undefined): boolean {
	if (t) tareas.push(t);
	return t !== undefined;
}

function conTitulo(tareas: TareaDelOrden[], titulo: string): TareaDelOrden | undefined {
	return tareas.find((t) => t.titulo === titulo);
}

/** §4.1: los niveles de esfuerzo; "sin estimar" es sin el campo. */
const NIVELES_DE_ESFUERZO = ['rapida', 'media', 'larga'];

/** El esfuerzo que da un paso: `{}` es sin estimar; undefined, un valor que §4.1 no admite. */
export function esfuerzoEscrito(valor: string): { esfuerzo?: string } | undefined {
	if (valor === 'sin estimar') return {};
	return NIVELES_DE_ESFUERZO.includes(valor) ? { esfuerzo: valor } : undefined;
}

/** §6.1 Solo rápidas: encendido, quedan solo las tareas con esfuerzo rapida, en el mismo orden. */
export const soloLasRapidas = (tareas: TareaDelOrden[]) => tareas.filter((t) => t.esfuerzo === 'rapida');

export const REGLAS_DEL_ORDEN: ReglaDeOrden[] = [
	[
		/^la tarea (\S+) tiene esfuerzo (.+)$/,
		(ts, [t, e]) => {
			const tarea = conTitulo(ts, t);
			const escrito = esfuerzoEscrito(e);
			if (tarea && escrito) tarea.esfuerzo = escrito.esfuerzo;
			return tarea !== undefined && escrito !== undefined;
		}
	],
	[
		/^la tarea (\S+) fue pospuesta con la opción (.+) el (\S+)$/,
		(ts, [t, o, m]) => {
			const tarea = conTitulo(ts, t);
			const pospuesta = posposicionDe(o, m);
			return tarea !== undefined && pospuesta !== undefined && posponerDelOrden(tarea, pospuesta);
		}
	],
	// §5.8: solo una periódica se pausa; Reanudar solo la pausada.
	[
		/^(?:la tarea (\S+) fue pausada|pauso la tarea (\S+))$/,
		(ts, [fue, pauso]) => {
			const tarea = conTitulo(ts, fue ?? pauso);
			if (!tarea || tarea.puntual || tarea.pausada || tarea.intervaloInvalido) return false;
			tarea.pausada = true;
			return true;
		}
	],
	[
		/^reanudo la tarea (\S+) el (\S+)$/,
		(ts, [t, m]) => {
			const tarea = conTitulo(ts, t);
			const momento = MOMENTO(m);
			if (!tarea?.pausada || tarea.intervaloInvalido || momento === undefined) return false;
			Object.assign(tarea, { pausada: false, reanudada: momento });
			return true;
		}
	],
	[
		new RegExp(`^la tarea (\\S+) se puede completar ${HORARIO}$`),
		(ts, [t, ...horas]) => {
			const tarea = conTitulo(ts, t);
			const horario = horarioValido(escritasDe(horas));
			if (tarea) tarea.horario = horario;
			return tarea !== undefined && horario !== undefined;
		}
	],
	[
		/^una tarea puntual (\S+) con fecha límite (\S+?)(?: creada el (\S+))?$/,
		(ts, [t, l, c]) => dia(l) !== undefined && agregar(ts, nueva(t, c, { puntual: true, limite: dia(l) }))
	],
	[/^una tarea puntual (\S+) sin fecha límite(?: creada el (\S+))?$/, (ts, [t, c]) => agregar(ts, nueva(t, c, { puntual: true }))],
	[
		/^una tarea periódica relativa (\S+) cada (\S+) (\S+)(?: creada el (\S+))?$/,
		(ts, [t, n, u, c]) =>
			agregar(ts, nueva(t, c, { intervalo: intervaloMs(n, u), ...(intervaloMs(n, u) === undefined && { intervaloInvalido: true }) }))
	],
	[/^una tarea periódica relativa (\S+) nunca completada(?: creada el (\S+))?$/, (ts, [t, c]) => agregar(ts, nueva(t, c, {}))],
	[
		/^una tarea periódica semanal (\S+) los (.*?)(?: creada el (\S+))?$/,
		(ts, [t, d, c]) => diasSemana(d) !== undefined && agregar(ts, nueva(t, c, { calendario: diasSemana(d) }))
	],
	[
		/^una tarea periódica mensual (\S+) los días (.*?)(?: creada el (\S+))?$/,
		(ts, [t, d, c]) => diasMes(d) !== undefined && agregar(ts, nueva(t, c, { calendario: diasMes(d) }))
	],
	// De calendario, el oráculo del orden no calcula la ocurrencia que cubre (§5.3): no lo modela.
	[
		/^(?:la tarea (\S+) fue completada|completo la tarea (\S+)) el (\S+)$/,
		(ts, [fue, completo, m]) => {
			const momento = MOMENTO(m);
			const tarea = conTitulo(ts, fue ?? completo);
			if (!tarea || tarea.calendario || momento === undefined) return false;
			tarea.completados.push(momento);
			return true;
		}
	],
	[
		/^la tarea (\S+) tiene un completado que cubre el (\S+)$/,
		(ts, [t, c]) => {
			const cubierta = dia(c);
			const tarea = conTitulo(ts, t);
			if (!tarea || !cubierta) return false;
			tarea.cubiertas.push(cubierta);
			tarea.conCompletadoSinMomento = true;
			return true;
		}
	],
	[
		/^la tarea (\S+) tiene un completado del (\S+) que cubre el (\S+)$/,
		(ts, [t, m, c]) => {
			const cubierta = dia(c);
			const inicio = MOMENTO(c);
			const momento = MOMENTO(m);
			const tarea = conTitulo(ts, t);
			if (!tarea || (!cubierta && inicio === undefined) || momento === undefined) return false;
			if (cubierta) tarea.cubiertas.push(cubierta);
			if (inicio !== undefined) tarea.cubiertasConHora = [...(tarea.cubiertasConHora ?? []), inicio];
			tarea.completados.push(momento);
			return true;
		}
	],
	[
		/^la tarea (\S+) tiene (?:un completado|dos completados)$/,
		(ts, [t]) => {
			const tarea = conTitulo(ts, t);
			if (!tarea?.puntual) return false;
			tarea.conCompletadoSinMomento = true;
			return true;
		}
	]
];

/** Pendientes como se ve: los títulos de arriba hacia abajo y, de ellos, los que se ven completados y pausados. */
export interface VistaDePendientes {
	orden: string;
	completadas: string;
	pausadas: string;
}

/**
 * §6.1: Pendientes, con los títulos separados por ", ". Solo se modela la consulta en un momento dado (el
 * estado de cada tarea depende de "ahora"), o en cualquier momento cuando todas las tareas son puntuales sin
 * fecha límite. undefined si el oráculo no reconoce el escenario.
 */
export function ordenDePendientes(pasos: PasoOraculo[], fila: FilaOraculo): VistaDePendientes | undefined {
	const tareas: TareaDelOrden[] = [];
	let ahora: number | undefined;
	let cualquierMomento = false;
	let mostrarCompletadas = false;
	let mostrarPausadas = false;
	let soloRapidas = false;
	for (const paso of pasos) {
		const texto = resolver(paso.text, fila);
		if (texto === undefined) return undefined;
		const consulta = /^consulto Pendientes el (\S+)$/.exec(texto);
		if (consulta) ahora = ahoraDe(consulta[1]);
		else if (texto === 'consulto Pendientes en cualquier momento') cualquierMomento = true;
		else if (texto === MOSTRAR_COMPLETADAS) mostrarCompletadas = true;
		else if (texto === MOSTRAR_PAUSADAS) mostrarPausadas = true;
		else if (SOLO_RAPIDAS.test(texto)) soloRapidas = texto.endsWith('encendido');
		else {
			const regla = REGLAS_DEL_ORDEN.map(([patron, aplicar]) => ({ c: patron.exec(texto), aplicar })).find((r) => r.c);
			if (!regla?.c || !regla.aplicar(tareas, regla.c.slice(1))) return undefined;
		}
	}
	const visibles = soloRapidas ? soloLasRapidas(tareas) : tareas;
	// Una pausada no depende de ahora: va al final, por título (§6.1).
	if (cualquierMomento && visibles.some((t) => !t.pausada && (!t.puntual || t.limite))) return undefined;
	if (!cualquierMomento && ahora === undefined) return undefined;
	return vistaDePendientes(visibles, ahora, mostrarCompletadas, mostrarPausadas);
}

/** El paso que enciende el check "Mostrar completadas" (§6.1); sin él, está apagado. */
export const MOSTRAR_COMPLETADAS = 'Mostrar completadas está encendido';

/** El paso que da el estado del botón "Solo rápidas" (§6.1); sin él, está apagado. */
const SOLO_RAPIDAS = /^Solo rápidas está (?:encendido|apagado)$/;

/** El paso que enciende el check "Mostrar pausadas" (§6.1); sin él, está apagado. */
export const MOSTRAR_PAUSADAS = 'Mostrar pausadas está encendido';

/**
 * §5.8: una reanudada se evalúa como recién creada en reanudadaEn (creadaEn = reanudadaEn, sin los completados
 * anteriores); el desempate de §6.1 sigue con el creadaEn real. undefined si tiene ocurrencias cubiertas: el
 * oráculo no sabe cuáles son anteriores.
 */
function evaluada(t: TareaDelOrden): TareaDelOrden | undefined {
	const desde = t.reanudada;
	if (desde === undefined) return t;
	if (t.conCompletadoSinMomento || t.cubiertas.length > 0 || (t.cubiertasConHora ?? []).length > 0) return undefined;
	return { ...t, creada: desde, completados: t.completados.filter((c) => c >= desde) };
}

/** §6.1: las pausadas por título en español; undefined si dos empatan (el id no es observable). */
function pausadasPorTitulo(pausadas: TareaDelOrden[]): TareaDelOrden[] | undefined {
	const ordenadas = [...pausadas].sort((a, b) => COLACION.compare(a.titulo, b.titulo));
	return ordenadas.some((t, i) => i > 0 && COLACION.compare(ordenadas[i - 1].titulo, t.titulo) === 0) ? undefined : ordenadas;
}

const conCompletados = (t: TareaDelOrden) => t.completados.length > 0 || t.cubiertas.length > 0 || t.conCompletadoSinMomento === true;

/** §6.1: completada es una puntual con al menos un completado, o una periódica en espera con al menos uno. */
export function esCompletada(puntual: boolean, enEspera: boolean, completados: boolean): boolean {
	return completados && (puntual || enEspera);
}

/** El desempate de §6.1: creadaEn más antigua, después título en español (el id no es observable). */
const desempate = (a: TareaDelOrden, b: TareaDelOrden) => a.creada - b.creada || COLACION.compare(a.titulo, b.titulo);

/** Las no completadas por urgencia (§6.1); undefined si alguna urgencia no se deduce. */
function noCompletadasPorUrgencia(tareas: TareaDelOrden[], ahora: number): TareaDelOrden[] | undefined {
	const urgencias = tareas.map((t) => ({ t, u: urgenciaDe(evaluada(t) as TareaDelOrden, ahora) }));
	if (urgencias.some(({ u }) => u === undefined)) return undefined;
	const sinInstante = Number.MAX_SAFE_INTEGER;
	return urgencias
		.sort(
			(a, b) =>
				(a.u?.grupo ?? 0) - (b.u?.grupo ?? 0) ||
				(a.u?.instante ?? sinInstante) - (b.u?.instante ?? sinInstante) ||
				desempate(a.t, b.t)
		)
		.map(({ t }) => t);
}

/** Las completadas, de completadoEn más reciente a más antiguo (§6.1); undefined si hay que ordenar alguna sin momento. */
function completadasPorRecientes(completadas: TareaDelOrden[]): TareaDelOrden[] | undefined {
	if (completadas.length > 1 && completadas.some((t) => t.completados.length === 0 || t.conCompletadoSinMomento)) return undefined;
	const ultimo = (t: TareaDelOrden) => Math.max(...t.completados);
	return [...completadas].sort((a, b) => ultimo(b) - ultimo(a) || desempate(a, b));
}

/**
 * §6.1 con "ahora" (o, sin él, en un momento cualquiera): primero las no completadas por urgencia; las
 * completadas, solo con Mostrar completadas encendido; al final las pausadas (§5.8), solo con Mostrar pausadas
 * encendido. undefined si algo no se deduce.
 */
export function vistaDePendientes(
	tareas: TareaDelOrden[],
	ahora: number | undefined,
	mostrarCompletadas: boolean,
	mostrarPausadas = false
): VistaDePendientes | undefined {
	const momento = ahora ?? 0;
	const activas = tareas.filter((t) => !t.pausada);
	if (activas.some((t) => evaluada(t) === undefined)) return undefined;
	const completada = (t: TareaDelOrden) => {
		const e = evaluada(t) as TareaDelOrden;
		const urgencia = urgenciaDe(e, momento);
		return esCompletada(e.puntual, !e.puntual && urgencia?.grupo === 2 && !urgencia.porPosposicion, conCompletados(e));
	};
	const noCompletadas = noCompletadasPorUrgencia(activas.filter((t) => !completada(t)), momento);
	const completadas = mostrarCompletadas ? completadasPorRecientes(activas.filter(completada)) : [];
	const pausadas = mostrarPausadas ? pausadasPorTitulo(tareas.filter((t) => t.pausada)) : [];
	if (!noCompletadas || !completadas || !pausadas) return undefined;
	const titulos = (ts: TareaDelOrden[]) => ts.map((t) => t.titulo).join(', ');
	return { orden: titulos([...noCompletadas, ...completadas, ...pausadas]), completadas: titulos(completadas), pausadas: titulos(pausadas) };
}

/** Los títulos de Pendientes en el orden de §6.1; undefined si algo no se deduce. */
export function ordenarPendientes(
	tareas: TareaDelOrden[],
	ahora: number | undefined,
	mostrarCompletadas = false,
	mostrarPausadas = false
): string | undefined {
	return vistaDePendientes(tareas, ahora, mostrarCompletadas, mostrarPausadas)?.orden;
}

// ---- §6, "Qué se dibuja con qué" ----

const ATKINSON = 'Atkinson Hyperlegible Next';
const NOTO = 'Noto Color Emoji';
const SISTEMA = 'la fuente del sistema';
const DISPOSITIVO = 'el emoji del dispositivo';

/**
 * Lo que §6 asegura que Atkinson tiene: español, cifras, `#`, `*`, `©`, `®`, `™`, y los signos de un título.
 * El resto del latín no lo decide el spec: es indeciso, no se filtra.
 */
const LO_QUE_TIENE_ATKINSON = /^[a-zñáéíóúüA-ZÑÁÉÍÓÚÜ0-9#*©®™ ,.;:¿?¡!()'"/-]$/u;
/** §6: "otro alfabeto en un título": alfabetos que una fuente latina no trae. */
const OTRO_ALFABETO = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Devanagari}\p{Script=Thai}]$/u;
/** Lo que compone un emoji sin ser uno (§4.1): marca de emoji, ZWJ, keycap y etiquetas de subdivisión. */
const COMPOSICION = /[️‍⃣\u{E0020}-\u{E007F}]/gu;

/**
 * La fila de la tabla para un grafema. Sin marca, lo que Atkinson tiene va primero (cifras y `©` también
 * existen como emoji). Noto tiene todo emoji asignado (también `❤`, sin marca, que Atkinson no tiene); un
 * pictograma todavía sin asignar es de una versión de Unicode más nueva y Noto no lo tiene.
 */
function fuenteDelGrafema(grafema: string): string | undefined {
	if (LO_QUE_TIENE_ATKINSON.test(grafema)) return ATKINSON;
	if (OTRO_ALFABETO.test(grafema)) return SISTEMA;
	const partes = [...grafema.replace(COMPOSICION, '')];
	if (partes.length === 0) return undefined;
	if (partes.every((parte) => /^\p{Emoji}$/u.test(parte))) return NOTO;
	return partes.every((parte) => /^\p{Extended_Pictographic}$/u.test(parte)) ? DISPOSITIVO : undefined;
}

/** Las fuentes distintas de un texto, en orden de aparición; undefined si algún grafema es indeciso o no hay ninguno. */
function fuentesDe(texto: string): string[] | undefined {
	const grafemas = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(texto)].map(({ segment }) => segment);
	const fuentes = grafemas.map(fuenteDelGrafema);
	if (fuentes.length === 0 || fuentes.includes(undefined)) return undefined;
	return [...new Set(fuentes as string[])];
}

export const esEscenarioDeFuente = (textos: string[]) => textos.some((texto) => /^el texto se dibuja con /.test(texto));

/** Lo que observa y lo que afirma "el texto se dibuja con": undefined si el oráculo no reconoce el escenario. */
export function observarFuente(entradas: PasoOraculo[], thens: PasoOraculo[], fila: FilaOraculo): { observado: string[]; afirmado: string[] } | undefined {
	if (entradas.length !== 1 || thens.length !== 1) return undefined;
	const texto = /^el texto (.*)$/su.exec(resolver(entradas[0].text, fila) ?? '')?.[1];
	const fuente = /^el texto se dibuja con (.*)$/su.exec(resolver(thens[0].text, fila) ?? '')?.[1];
	const observado = texto === undefined ? undefined : fuentesDe(texto);
	return observado === undefined || fuente === undefined ? undefined : { observado, afirmado: [fuente] };
}
