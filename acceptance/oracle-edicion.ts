// Oráculo de edición y borrado: simula, con las reglas de docs/spec.md (§5 estado,
// §6.2 editar y borrar, §7 conflictos), los escenarios que editan, borran o
// modifican concurrentemente una tarea, y devuelve lo que cada paso Then observa.
// NO importa el core ni los step handlers: es una segunda implementación escrita
// desde el spec, así que la implementación no juzga a sus propios tests.
//
// Una mutación es equivalente cuando todas las observaciones son las mismas con
// el valor mutado (ver equivalence.ts). Todo lo que el oráculo no reconoce o no
// puede decidir lanza `Indeciso`, y el resultado es undefined (no se filtra).
import {
	HORARIO,
	MOSTRAR_COMPLETADAS,
	NUMERO,
	clasificarSituacion,
	dentroDeVentana,
	escritasDe,
	botonDePosponer,
	dia,
	esfuerzoEscrito,
	diasMes,
	diasSemana,
	elementos,
	esCompletada,
	fecha,
	inicioDelDia,
	intervaloValido,
	enEsperaPorPosposicion,
	inicioQueCubre,
	isoDia,
	leerHorario,
	motivosFechaLimite,
	motivosEmoji,
	motivosMes,
	ocurre,
	ocurrenciaQueCubre,
	ordenarPendientes,
	pConHorario,
	porVentana,
	posposicionDe,
	primeraSinCerrar,
	proximaDeCalendario,
	proximaPorVentana,
	resolver,
	ultimaCubierta,
	type Calendario,
	type FilaOraculo,
	type Ocurrencia,
	type PasoOraculo,
	type Posposicion,
	type Situacion,
	type TareaDelOrden,
	type Ventana
} from './oracle';
import { avisoSeVe, textoDelHistorial, textoDeUltimaVez, type EntradaDelOraculo } from './oracle-historial';

class Indeciso extends Error {}
const indeciso = (motivo: string): never => {
	throw new Indeciso(motivo);
};

type Recurrencia = { relativa: { cada: string; unidad: string } } | Calendario;

/** Lo guardado de una tarea (§4.1): puede tener un campo que no corresponde al tipo (§7). */
interface Documento {
	id: number;
	titulo: string;
	emoji?: string;
	nota?: string;
	/** §4.1: una línea, recortada; sin el campo, sin primer paso. Un campo independiente (§7). */
	primerPaso?: string;
	/** §4.1: rapida, media o larga; sin el campo, sin estimar. Un campo independiente (§7). */
	esfuerzo?: string;
	tipo: 'puntual' | 'periodica';
	limite?: Date;
	recurrencia?: Recurrencia;
	/** §4.1: una o más ventanas, ordenadas; un solo campo (§7). */
	horario?: Ventana[];
	creada?: number;
	/** §5.8: pausada, y el momento de la última reanudación. */
	pausada?: boolean;
	reanudada?: number;
	/** §5.9: la posposición guardada; un solo campo (§7). */
	pospuesta?: Posposicion;
}

interface Completado {
	id: number;
	tareaId: number;
	en: number;
	/** §4.4: la ocurrencia cubierta sin hora (un día) o, con horario, su inicio. */
	cubierta?: Date;
	inicioCubierto?: number;
	/** El id que el escenario le fija ("con id c1"); sirve para desempatar en el Historial. */
	ident?: string;
}

/** El aviso del último completado de este dispositivo (§5.4): nombra la tarea como se llamaba al completarla. */
interface Aviso {
	titulo: string;
	completado: Completado;
}

interface Guardado {
	documentos: Documento[];
	completados: Completado[];
}

interface Mundo extends Guardado {
	siguiente: number;
	/** Lo guardado justo antes de mi último cambio: lo que ve otro dispositivo "sin ver ese cambio". */
	antes?: Guardado;
	rechazo?: string;
	/** Clasificación de la última consulta de estado, con progreso. */
	estado?: string;
	/** El momento consultado; sin consulta, lo que se afirma es del momento en que se tocó el checkbox. */
	consultadoEn?: number;
	tocadoEn?: number;
	orden?: string;
	/** El check "Mostrar completadas" (§6.1); sin él, apagado. */
	mostrarCompletadas?: boolean;
	nuevo?: Completado;
	/** Lo que se borró alguna vez: se puede nombrar aunque ya no exista. */
	borradasDocs: Documento[];
	borradosCompletados: Completado[];
	aviso?: Aviso;
	/** Lo que mostraba el aviso en el último momento consultado. */
	avisoVisto?: string;
	historial?: string;
	/** Lo que mostraba "Última vez" en el último momento consultado (§6.2). */
	ultimaVez?: string;
}

/** Los datos que carga el panel (§6.2). */
interface Datos {
	titulo: string;
	/** Lo que quedaría guardado: ya sin espacios; sin valor, la tarea queda sin el campo (§4.1). */
	emoji?: string;
	nota?: string;
	primerPaso?: string;
	esfuerzo?: string;
	tipo: 'puntual' | 'periodica';
	limite?: Date;
	recurrencia?: Recurrencia;
	horario?: Ventana[];
	/** Cuántas ventanas se escribieron, válidas o no (§4.1: más de una no va en una relativa en horas). */
	ventanasEscritas: number;
	motivos: string[];
}

// ---- Valores ----

/** §4.2 los lista de lunes a domingo. */
const LUNES_A_DOMINGO = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const claveDeDias = (dias: string[]) => [...dias].sort((a, b) => LUNES_A_DOMINGO.indexOf(a) - LUNES_A_DOMINGO.indexOf(b));

function claveDeRecurrencia(r: Recurrencia | undefined): string {
	if (r === undefined) return '-';
	if ('relativa' in r) return `relativa ${Number(r.relativa.cada)} ${r.relativa.unidad}`;
	if ('semanal' in r) return `semanal ${claveDeDias(r.semanal).join(' ')}`;
	return `mensual ${[...r.mensual].sort((a, b) => a - b).join(' ')}`;
}

const claveDeHorario = (h: Ventana[] | undefined) => (h === undefined ? '-' : h.map((v) => `${v.desde}-${v.hasta}`).join(' '));

const claveDeDocumento = (d: Documento) =>
	JSON.stringify([d.id, d.titulo, d.emoji, d.nota, d.primerPaso, d.esfuerzo, d.tipo, d.limite?.getTime(), claveDeRecurrencia(d.recurrencia), claveDeHorario(d.horario), d.creada, d.pausada, d.reanudada, d.pospuesta]);

const momento = (valor: string) => fecha(valor) ?? indeciso(`fecha y hora ${valor}`);
const diaDe = (valor: string) => dia(valor) ?? indeciso(`fecha ${valor}`);
const numero = (valor: string) => (NUMERO.test(valor) ? Number(valor) : indeciso(`número ${valor}`));
const unidadDe = (valor: string) => (valor === 'horas' || valor === 'dias' ? valor : indeciso(`unidad ${valor}`));

// ---- Datos nuevos de una edición y de una creación ----

function recurrenciaRelativa(cada: string, unidad: string): Datos['recurrencia'] {
	numero(cada);
	return { relativa: { cada, unidad: unidadDe(unidad) } };
}

/** Semanal o mensual con días: los nombres o números ilegibles no se deciden; los fuera de rango son rechazo (§4.2). */
function datosDeCalendario(forma: string, valor: string): Pick<Datos, 'recurrencia' | 'motivos'> {
	if (forma === 'semanal') {
		const calendario = diasSemana(valor) ?? indeciso(`días ${valor}`);
		return { recurrencia: calendario, motivos: [] };
	}
	const lista = elementos(valor) ?? indeciso(`días ${valor}`);
	lista.forEach(numero);
	const motivos = motivosMes(valor) ?? indeciso(`días ${valor}`);
	return { recurrencia: motivos.length === 0 ? (diasMes(valor) as Calendario) : undefined, motivos };
}

const sinDias = (): Pick<Datos, 'recurrencia' | 'motivos'> => ({ motivos: ['falta de días'] });

/** Sin horario escrito: el que corresponde lo agrega quien edita o crea. */
type Definicion = [RegExp, (titulo: string, c: string[]) => Omit<Datos, 'ventanasEscritas'>];

const DEFINICIONES: Definicion[] = [
	[
		/^puntual con fecha límite (\S+)$/,
		(titulo, [l]) => ({ titulo, tipo: 'puntual', limite: dia(l), motivos: motivosFechaLimite(l) })
	],
	[/^puntual sin fecha límite$/, (titulo) => ({ titulo, tipo: 'puntual', motivos: [] })],
	[
		/^periódica relativa cada (\S+) (\S+)$/,
		(titulo, [c, u]) => ({
			titulo,
			tipo: 'periodica',
			recurrencia: recurrenciaRelativa(c, u),
			motivos: intervaloValido(c) ? [] : ['intervalo inválido']
		})
	],
	[
		/^periódica (semanal los|mensual los días) (.*)$/,
		(titulo, [f, d]) => ({ titulo, tipo: 'periodica', ...datosDeCalendario(f.split(' ')[0], d) })
	],
	[/^periódica (?:semanal|mensual) sin días$/, (titulo) => ({ titulo, tipo: 'periodica', ...sinDias() })],
	[
		/^periódica de calendario con días de la semana y del mes a la vez$/,
		(titulo) => ({ titulo, tipo: 'periodica', motivos: ['semanal y mensual combinados'] })
	]
];

/** Los campos de texto escritos en el panel (§4.1): emoji, nota y primer paso recortados, vacío es sin campo; un emoji que no es uno solo es inválido; un primer paso nunca es inválido. */
interface Escritos {
	emoji?: string;
	nota?: string;
	primerPaso?: string;
}

function conEscritos(datos: Datos, { emoji, nota, primerPaso }: Escritos): Datos {
	return {
		...datos,
		emoji: emoji?.trim() || undefined,
		nota: nota?.trim() || undefined,
		primerPaso: primerPaso?.trim() || undefined,
		motivos: [...motivosEmoji(emoji ?? ''), ...datos.motivos]
	};
}

/** Spec §4.1: el título no puede ser vacío (solo espacios cuenta como vacío). */
function conValidacion(datos: Datos): Datos {
	return datos.titulo.trim() === '' ? { ...datos, motivos: ['título vacío', ...datos.motivos] } : datos;
}

/** Los campos de texto, el esfuerzo y el horario de la tarea que se edita siguen igual salvo los que la edición escribe. */
const conservando = (base: Documento, datos: Datos, escritos: Escritos = {}): Datos => ({
	...conEscritos(datos, { emoji: base.emoji, nota: base.nota, primerPaso: base.primerPaso, ...escritos }),
	esfuerzo: base.esfuerzo,
	horario: base.horario,
	ventanasEscritas: base.horario?.length ?? 0
});

/** Ventanas escritas en el panel: cada una con sus dos horas, o alguna sin escribir. */
type Escritas = [string | undefined, string | undefined][];

/** §4.1: los datos de la tarea con el horario escrito (sin ventanas, sin horario); uno inválido es un motivo de rechazo. */
function conHorarioEscrito(datos: Datos, escritas: Escritas): Datos {
	if (escritas.length === 0) return { ...datos, horario: undefined, ventanasEscritas: 0 };
	const leido = leerHorario(escritas);
	const motivos = leido.filter((l): l is string => typeof l === 'string');
	const conEscritas = { ...datos, ventanasEscritas: escritas.length };
	return motivos.length > 0 ? { ...conEscritas, motivos: [...datos.motivos, ...motivos] } : { ...conEscritas, horario: leido as Ventana[] };
}

const MOTIVOS_DEL_HORARIO = ['horario incompleto', 'hora de fin no posterior', 'horarios superpuestos'];

/**
 * §4.1: una relativa en horas no puede tener más de una ventana. Si además el horario mismo es inválido, el spec
 * no dice cuál de los dos errores se ve.
 */
function conIntervaloDelHorario(datos: Datos): Datos {
	const r = datos.recurrencia;
	const enHoras = datos.tipo === 'periodica' && r !== undefined && 'relativa' in r && r.relativa.unidad === 'horas';
	if (!enHoras || datos.ventanasEscritas <= 1) return datos;
	if (datos.motivos.some((motivo) => MOTIVOS_DEL_HORARIO.includes(motivo))) return indeciso('dos errores del horario');
	return { ...datos, motivos: [...datos.motivos, 'varios horarios en una relativa en horas'] };
}

function datosDe(texto: string, titulo: string): Datos {
	for (const [patron, armar] of DEFINICIONES) {
		const coincide = patron.exec(texto);
		if (coincide) return conValidacion({ ...armar(titulo, coincide.slice(1)), ventanasEscritas: 0 });
	}
	return indeciso(`definición ${texto}`);
}

/** Los valores actuales de una tarea, como los carga el panel al editar. */
function datosDeDocumento(d: Documento): Datos {
	const campos = { titulo: d.titulo, emoji: d.emoji, nota: d.nota, primerPaso: d.primerPaso, esfuerzo: d.esfuerzo, horario: d.horario, ventanasEscritas: d.horario?.length ?? 0, motivos: [] };
	if (d.tipo === 'puntual') return { ...campos, tipo: 'puntual', limite: d.limite };
	return { ...campos, tipo: 'periodica', recurrencia: d.recurrencia };
}

// ---- Mundo ----

const copiar = (g: Guardado): Guardado => ({ documentos: [...g.documentos], completados: [...g.completados] });

function unica(g: Guardado): Documento {
	return g.documentos.length === 1 ? g.documentos[0] : indeciso('se esperaba una tarea');
}

function conTitulo(g: Guardado, titulo: string): Documento {
	const encontradas = g.documentos.filter((d) => d.titulo === titulo);
	return encontradas.length === 1 ? encontradas[0] : indeciso(`tarea ${titulo}`);
}

/** La tarea con ese título, aunque ya se haya borrado. */
function laQueTuvo(m: Mundo, titulo: string): Documento {
	const encontradas = [...m.documentos, ...m.borradasDocs].filter((d) => d.titulo === titulo);
	return encontradas.length === 1 ? encontradas[0] : indeciso(`tarea ${titulo}`);
}

const todosLosCompletados = (m: Mundo) => [...m.completados, ...m.borradosCompletados];

/** Si todavía no hice ningún cambio, el otro dispositivo vio todo lo guardado. */
const loQueVioElOtro = (m: Mundo): Guardado => m.antes ?? copiar(m);
const completadosDe = (g: Guardado, id: number) => g.completados.filter((c) => c.tareaId === id);
/** §5.8, §6.2: una periódica reanudada se evalúa sin los completados anteriores a reanudadaEn; una puntual ignora reanudadaEn. */
const vigentesDe = (g: Guardado, d: Documento) =>
	completadosDe(g, d.id).filter((c) => d.tipo === 'puntual' || d.reanudada === undefined || c.en >= d.reanudada);
/** §5.8: la tarea se evalúa como recién creada en reanudadaEn. */
const creadaVigente = (d: Documento) => (d.tipo === 'periodica' && d.reanudada !== undefined ? d.reanudada : d.creada);

function crear(m: Mundo, datos: Datos, creada: number | undefined): void {
	if (datos.motivos.length > 0) indeciso('creación inválida');
	m.documentos = [
		...m.documentos,
		{
			id: m.siguiente++,
			titulo: datos.titulo,
			emoji: datos.emoji,
			nota: datos.nota,
			primerPaso: datos.primerPaso,
			esfuerzo: datos.esfuerzo,
			tipo: datos.tipo,
			limite: datos.limite,
			recurrencia: datos.recurrencia,
			horario: datos.horario,
			creada
		}
	];
}

// ---- Editar (§6.2) y conflictos (§7) ----

/** La tarea que describe el documento: el campo que no corresponde al tipo se ignora (§7). */
function derivada(d: Documento): Documento {
	return d.tipo === 'puntual' ? { ...d, recurrencia: undefined, pausada: undefined, reanudada: undefined } : { ...d, limite: undefined };
}

/** Los campos que la edición escribe: solo los que cambiaron; al cambiar de tipo, los dos campos de tipo (§7). */
function cambioDe(base: Documento, nuevo: Datos): Record<string, unknown> {
	const cambio: Record<string, unknown> = {};
	if (base.titulo !== nuevo.titulo) cambio.titulo = nuevo.titulo;
	if (base.emoji !== nuevo.emoji) cambio.emoji = nuevo.emoji ?? null;
	if (base.nota !== nuevo.nota) cambio.nota = nuevo.nota ?? null;
	if (base.primerPaso !== nuevo.primerPaso) cambio.primerPaso = nuevo.primerPaso ?? null;
	if (base.esfuerzo !== nuevo.esfuerzo) cambio.esfuerzo = nuevo.esfuerzo ?? null;
	if (claveDeHorario(base.horario) !== claveDeHorario(nuevo.horario)) cambio.horario = nuevo.horario ?? null;
	if (base.tipo !== nuevo.tipo) {
		return { ...cambio, tipo: nuevo.tipo, limite: nuevo.limite ?? null, recurrencia: nuevo.recurrencia ?? null };
	}
	if (base.limite?.getTime() !== nuevo.limite?.getTime()) cambio.limite = nuevo.limite ?? null;
	if (claveDeRecurrencia(base.recurrencia) !== claveDeRecurrencia(nuevo.recurrencia)) {
		cambio.recurrencia = nuevo.recurrencia ?? null;
	}
	return cambio;
}

function aplicar(documento: Documento, cambio: Record<string, unknown>): Documento {
	const editado: Record<string, unknown> = { ...documento };
	for (const [campo, valor] of Object.entries(cambio)) {
		if (valor === null) delete editado[campo];
		else editado[campo] = valor;
	}
	return editado as unknown as Documento;
}

/** Editar `base` (la tarea como la vio quien edita) con los datos nuevos; el cambio llega a lo guardado hoy. */
function editar(m: Mundo, base: Documento, datos: Datos, en?: number): void {
	const nuevo = conIntervaloDelHorario(datos);
	if (nuevo.motivos.length > 0) {
		m.rechazo = [...nuevo.motivos].sort().join(', ');
		return;
	}
	const cambio = cambioDe(base, nuevo);
	// §5.8: cambiar una periódica pausada a puntual la reanuda (quita la pausa y guarda reanudadaEn).
	if (base.pausada && nuevo.tipo === 'puntual') Object.assign(cambio, { pausada: null, reanudada: en ?? indeciso('sin momento de edición') });
	m.documentos = m.documentos.map((d) => (d.id === base.id ? aplicar(d, cambio) : d));
}

function editoYo(m: Mundo, titulo: string | undefined, armar: (base: Documento) => Datos, en?: number): void {
	m.antes = copiar(m);
	const base = derivada(titulo === undefined ? unica(m) : conTitulo(m, titulo));
	editar(m, base, armar(base), en);
}

function editaElOtro(m: Mundo, armar: (base: Documento) => Datos): void {
	const base = derivada(unica(loQueVioElOtro(m)));
	editar(m, base, armar(base));
}

// ---- Borrar (§6.2, §7) ----

function borrar(m: Mundo, tarea: Documento, conocidos: Completado[]): void {
	const ids = conocidos.filter((c) => c.tareaId === tarea.id).map((c) => c.id);
	m.borradasDocs = [...m.borradasDocs, ...m.documentos.filter((d) => d.id === tarea.id)];
	m.documentos = m.documentos.filter((d) => d.id !== tarea.id);
	borrarCompletados(m, ids);
}

/** Borrar completados que ya no existen no hace nada (§5.4). */
function borrarCompletados(m: Mundo, ids: number[]): void {
	m.borradosCompletados = [...m.borradosCompletados, ...m.completados.filter((c) => ids.includes(c.id))];
	m.completados = m.completados.filter((c) => !ids.includes(c.id));
}

// ---- Completar (§5.3) ----

/** Los valores sin hora (§5.3, §5.6): la fecha cubierta o, sin ocurrencia cubierta, el día de completadoEn. */
function aportes(comps: Completado[]): Date[] {
	return comps.filter((c) => c.inicioCubierto === undefined).map((c) => c.cubierta ?? inicioDelDia(c.en));
}

/** §5.6: las ocurrencias cubiertas con hora, por su inicio. */
const iniciosCubiertos = (comps: Completado[]) => comps.flatMap((c) => (c.inicioCubierto === undefined ? [] : [c.inicioCubierto]));

/** §5.6 y §5.7: N de una de calendario con horario o de una relativa por ventana. */
function proximaConHorario(tarea: Documento, vs: Ventana[], propios: Completado[]): Ocurrencia {
	const recurrencia = tarea.recurrencia ?? indeciso('periódica sin recurrencia');
	const desde = creadaVigente(tarea);
	const creada = desde === undefined ? undefined : new Date(desde);
	const p = pConHorario(aportes(propios), iniciosCubiertos(propios), creada) ?? indeciso('sin P');
	if (!('relativa' in recurrencia)) return proximaDeCalendario(recurrencia, vs, p, tarea.reanudada) ?? indeciso('sin ocurrencia');
	if (propios.length === 0) return primeraSinCerrar(vs, desde ?? indeciso('sin creación'));
	return proximaPorVentana(vs, numero(recurrencia.relativa.cada), p);
}

/** Si la tarea cubre ocurrencias con hora (§5.6, §5.7): de calendario con horario, o relativa por ventana. */
function cubreConHora(tarea: Documento): Ventana[] | undefined {
	const { horario, recurrencia } = tarea;
	if (tarea.tipo !== 'periodica' || !horario || !recurrencia) return undefined;
	return !('relativa' in recurrencia) || porVentana(recurrencia.relativa.unidad, horario) ? horario : undefined;
}

/** La ocurrencia que cubre un completado nuevo: de calendario, un día (§5.3) o, con hora, un inicio (§5.6, §5.7). */
function cubiertaDelNuevo(tarea: Documento, conocidos: Completado[], en: number): Pick<Completado, 'cubierta' | 'inicioCubierto'> {
	const recurrencia = tarea.recurrencia;
	const propios = vigentesDe({ documentos: [], completados: conocidos }, tarea);
	const vs = cubreConHora(tarea);
	if (vs) {
		const cuenta = (d: Date) => !recurrencia || 'relativa' in recurrencia || ocurre(recurrencia, d);
		return { inicioCubierto: inicioQueCubre(proximaConHorario(tarea, vs, propios), vs, cuenta, en) };
	}
	if (tarea.tipo !== 'periodica' || !recurrencia || 'relativa' in recurrencia) return {};
	if (iniciosCubiertos(propios).length > 0) return indeciso('sin horario, una ocurrencia cubierta con hora');
	const p = ultimaCubierta(situacionBase({ cubiertas: aportes(propios), creada: creadaVigente(tarea) }));
	if (!p) return indeciso('sin P');
	return { cubierta: ocurrenciaQueCubre(recurrencia, p, inicioDelDia(en)) ?? indeciso('sin ocurrencia') };
}

function completar(m: Mundo, tarea: Documento, conocidos: Completado[], en: number, ident?: string): Completado {
	const cubierta = cubiertaDelNuevo(tarea, conocidos, en);
	const completado = { id: m.siguiente++, tareaId: tarea.id, en, ...cubierta, ...(ident && { ident }) };
	m.completados = [...m.completados, completado];
	return completado;
}

/** Completo desde este dispositivo: es mi cambio (el otro dispositivo no lo ve) y abre el aviso (§5.4). */
function completoYo(m: Mundo, tarea: Documento, en: number): void {
	m.antes = copiar(m);
	m.nuevo = completar(m, tarea, m.completados, en);
	m.aviso = { titulo: nombreDe(tarea), completado: m.nuevo };
}

/** Spec §4.1: «emoji título», o solo el título sin emoji. */
const nombreDe = (d: Documento) => (d.emoji === undefined ? d.titulo : `${d.emoji} ${d.titulo}`);

// ---- Deshacer (§5.4) ----

/** El completado de ese momento, aunque ya se haya borrado: tiene que ser uno solo. */
function elCompletadoDel(m: Mundo, en: number): Completado {
	const delMomento = todosLosCompletados(m).filter((c) => c.en === en);
	return delMomento.length === 1 ? delMomento[0] : indeciso(`completados del momento ${en}`);
}

/**
 * Deshacer en el aviso: borra solo el completado que nombra el aviso y lo cierra. El botón existe mientras el aviso
 * se ve (§5.4): fuera de esa ventana no hay nada que tocar y no pasa nada.
 */
function tocoDeshacer(m: Mundo, ahora: number): void {
	m.antes = copiar(m);
	if (!m.aviso || !avisoSeVe(m.aviso.completado.en, ahora)) return;
	borrarCompletados(m, [m.aviso.completado.id]);
	m.aviso = undefined;
}

/** Lo que muestra el aviso en ese momento: la tarea y el completado que ofrece deshacer, o ninguno. */
function consultarAviso(m: Mundo, ahora: number): string {
	const visible = m.aviso && avisoSeVe(m.aviso.completado.en, ahora) ? m.aviso : undefined;
	return visible ? JSON.stringify([visible.titulo, visible.completado.en]) : 'sin aviso';
}

// ---- Historial (§6.3) ----

function consultarHistorial(m: Mundo, ahora: number): string {
	const entradas = m.completados.flatMap((c): EntradaDelOraculo[] => {
		const tarea = m.documentos.find((d) => d.id === c.tareaId);
		return tarea ? [{ completadoEn: c.en, id: c.ident, titulo: nombreDe(tarea) }] : [];
	});
	return textoDelHistorial(entradas, ahora) ?? indeciso('empate sin desempate en el Historial');
}

/** §6.2: la última vez de la única tarea, por el completadoEn más reciente de sus completados. */
function consultarUltimaVez(m: Mundo, ahora: number): string {
	const tarea = unica(m);
	return textoDeUltimaVez(m.completados.filter((c) => c.tareaId === tarea.id).map((c) => c.en), ahora);
}

// ---- Estado (§5) ----

function situacionBase(datos: { cubiertas: Date[]; creada?: number }): Situacion {
	return {
		completados: [],
		cualquierMomento: false,
		cubiertas: datos.cubiertas,
		sinCubierta: [],
		creada: datos.creada === undefined ? undefined : new Date(datos.creada)
	};
}

function situacionDe(m: Guardado, tarea: Documento, ahora: number | undefined): Situacion {
	const propios = vigentesDe(m, tarea);
	const s: Situacion = {
		...situacionBase({ cubiertas: [], creada: creadaVigente(tarea) }),
		reanudada: tarea.tipo === 'periodica' ? tarea.reanudada : undefined,
		completados: propios.map((c) => c.en),
		cubiertasConHora: iniciosCubiertos(propios),
		cualquierMomento: ahora === undefined,
		ahora,
		horario: tarea.horario,
		pospuesta: tarea.pospuesta
	};
	const recurrencia = tarea.recurrencia;
	if (tarea.tipo === 'puntual') return { ...s, puntual: { limite: tarea.limite } };
	if (!recurrencia) return indeciso('periódica sin recurrencia');
	if ('relativa' in recurrencia) {
		// §5.7: los completados sin ocurrencia cubierta cubren el día entero de su completadoEn.
		return { ...s, cada: recurrencia.relativa.cada, unidad: recurrencia.relativa.unidad, sinCubierta: aportes(propios) };
	}
	return { ...s, calendario: recurrencia, cubiertas: aportes(propios) };
}

/** Clasificación con progreso; "no aparece en Pendientes" si la puntual está completada. */
function clasificar(m: Mundo, ahora: number | undefined): string {
	const tarea = unica(m);
	if (tarea.tipo === 'periodica' && tarea.pausada) return 'pausada';
	return clasificarSituacion(situacionDe(m, tarea, ahora), { progreso: true }) ?? indeciso('estado');
}

function tareaDelOrden(m: Mundo, d: Documento): TareaDelOrden | undefined {
	const propios = completadosDe(m, d.id);
	const base = {
		titulo: d.titulo,
		creada: d.creada ?? 0,
		completados: propios.map((c) => c.en),
		cubiertas: [] as Date[],
		cubiertasConHora: iniciosCubiertos(propios),
		horario: d.horario,
		pospuesta: d.pospuesta
	};
	if (d.tipo === 'puntual') return { ...base, puntual: true, limite: d.limite };
	const r = d.recurrencia ?? indeciso('periódica sin recurrencia');
	if ('relativa' in r) {
		const ms = (Number(r.relativa.cada) * (r.relativa.unidad === 'horas' ? 1 : 24) * 3_600_000) as number;
		return { ...base, puntual: false, intervalo: ms };
	}
	return { ...base, puntual: false, calendario: r, cubiertas: aportes(propios) };
}

function ordenEn(m: Mundo, ahora: number | undefined): string {
	if (m.documentos.some((d) => d.pausada || d.reanudada !== undefined)) indeciso('Pendientes con pausa o reanudación');
	const tareas = m.documentos.flatMap((d) => tareaDelOrden(m, d) ?? []);
	if (ahora === undefined && tareas.some((t) => !t.puntual || t.limite)) indeciso('Pendientes en cualquier momento');
	return ordenarPendientes(tareas, ahora, m.mostrarCompletadas) ?? indeciso('orden');
}

// ---- El checkbox de la fila (§6.1) ----

/** §6.1: completada en ese momento (puntual con completados, o periódica en espera con completados). */
function completadaEn(m: Mundo, tarea: Documento, en: number): boolean {
	if (tarea.pausada) return false;
	const s = situacionDe(m, tarea, en);
	const clasificacion = clasificarSituacion(s, { progreso: false }) ?? indeciso('estado');
	// §5.9: una pospuesta no está completada.
	return esCompletada(tarea.tipo === 'puntual', clasificacion === 'en espera' && !enEsperaPorPosposicion(s), vigentesDe(m, tarea).length > 0);
}

/** El completado de completadoEn mayor; si dos empatan, el spec no dice cuál. */
function elMasReciente(comps: Completado[]): Completado {
	const ultimo = Math.max(...comps.map((c) => c.en));
	const ultimos = comps.filter((c) => c.en === ultimo);
	return ultimos.length === 1 ? ultimos[0] : indeciso('completados más recientes empatados');
}

/** §5.5: completar fuera de la ventana del horario no es posible: el checkbox está deshabilitado y no hace nada. */
function completoSiSePuede(m: Mundo, tarea: Documento, en: number): void {
	if (!tarea.horario || dentroDeVentana(tarea.horario, en)) completoYo(m, tarea, en);
}

/**
 * §6.1: la no completada se completa. De la completada se borra el completado más reciente si es puntual o
 * si es de hoy o posterior (día local de completadoEn); si es de un día anterior, se completa de nuevo. Borrar se
 * puede a cualquier hora; completar, solo dentro de la ventana (§5.5).
 */
function tocoElCheckbox(m: Mundo, en: number): void {
	const tarea = derivada(unica(m));
	m.tocadoEn ??= en;
	if (tarea.pausada) return;
	if (!completadaEn(m, tarea, en)) return completoSiSePuede(m, tarea, en);
	const masReciente = elMasReciente(completadosDe(m, tarea.id));
	if (tarea.tipo === 'periodica' && masReciente.en < inicioDelDia(en).getTime()) return completoSiSePuede(m, tarea, en);
	m.antes = copiar(m);
	borrarCompletados(m, [masReciente.id]);
}

// ---- Pasos ----

type Paso = [RegExp, (m: Mundo, c: string[]) => void];

const MOMENTO_DE_CREACION = (c: string | undefined) => (c === undefined ? undefined : momento(c));
/** Las tareas con título que no dicen cuándo se crearon: antes de cualquier otra fecha del escenario. */
const ANTES_DEL_ESCENARIO = 0;

const FORMAS = '(?:semanal|mensual)';
const creada = '(?: creada el (\\S+))?';

/** Un horario ya guardado (no es un cambio de este dispositivo); uno inválido no se decide (§4.1). */
function guardarHorario(tarea: Documento, horas: string[]): void {
	const datos = conIntervaloDelHorario(conHorarioEscrito(datosDeDocumento(tarea), escritasDe(horas)));
	tarea.horario = datos.motivos.length > 0 ? indeciso(`horario ${horas.join(' ')}`) : datos.horario;
}

/** §4.1 y §6.2: el esfuerzo elegido en el selector; "sin estimar" deja la tarea sin el campo. */
const esfuerzoDe = (valor: string) => esfuerzoEscrito(valor) ?? indeciso(`esfuerzo ${valor}`);

const CREACIONES: Paso[] = [
	[
		/^una tarea puntual sin fecha límite con esfuerzo (.+)$/,
		(m, [e]) => crear(m, { ...datosDe('puntual sin fecha límite', 'Tarea'), ...esfuerzoDe(e) }, undefined)
	],
	[new RegExp(`^la tarea se puede completar ${HORARIO}$`), (m, horas) => guardarHorario(unica(m), horas)],
	[new RegExp(`^la tarea (\\S+) se puede completar ${HORARIO}$`), (m, [t, ...horas]) => guardarHorario(conTitulo(m, t), horas)],
	[
		/^una tarea puntual con fecha límite (\S+) creada el (\S+)$/,
		(m, [l, c]) => crear(m, datosDe(`puntual con fecha límite ${l}`, 'Tarea'), momento(c))
	],
	[
		/^una tarea puntual sin fecha límite con emoji (.*)$/,
		(m, [e]) => crear(m, conEscritos(datosDe('puntual sin fecha límite', 'Tarea'), { emoji: e }), undefined)
	],
	[
		/^una tarea puntual (\S+) sin fecha límite con emoji (.*)$/,
		(m, [t, e]) => crear(m, conEscritos(datosDe('puntual sin fecha límite', t), { emoji: e }), ANTES_DEL_ESCENARIO)
	],
	[
		/^una tarea puntual sin fecha límite con nota (.*)$/,
		(m, [n]) => crear(m, conEscritos(datosDe('puntual sin fecha límite', 'Tarea'), { nota: n }), undefined)
	],
	// §4.1: un primer paso ya guardado (no es un cambio de este dispositivo); se guarda recortado.
	[/^el primer paso de la tarea es (.*)$/, (m, [p]) => void (unica(m).primerPaso = p.trim() || undefined)],
	[/^el primer paso de la tarea (\S+) es (.*)$/, (m, [t, p]) => void (conTitulo(m, t).primerPaso = p.trim() || undefined)],
	[
		/^una tarea puntual (\S+) sin fecha límite$/,
		(m, [t]) => crear(m, datosDe('puntual sin fecha límite', t), ANTES_DEL_ESCENARIO)
	],
	[
		/^creo una tarea puntual con título (.*), emoji (.*) y nota (.*)$/,
		(m, [t, e, n]) => crear(m, conEscritos(datosDe('puntual sin fecha límite', t), { emoji: e, nota: n }), undefined)
	],
	[new RegExp(`^una tarea puntual sin fecha límite${creada}$`), (m, [c]) => crear(m, datosDe('puntual sin fecha límite', 'Tarea'), MOMENTO_DE_CREACION(c))],
	[/^una tarea puntual con fecha límite (\S+)$/, (m, [l]) => crear(m, datosDe(`puntual con fecha límite ${l}`, 'Tarea'), undefined)],
	[
		/^una tarea puntual (\S+) con fecha límite (\S+)$/,
		(m, [t, l]) => crear(m, datosDe(`puntual con fecha límite ${l}`, t), ANTES_DEL_ESCENARIO)
	],
	[
		new RegExp(`^una tarea periódica relativa cada (\\S+) (\\S+)${creada}$`),
		(m, [n, u, c]) => crear(m, datosDe(`periódica relativa cada ${n} ${u}`, 'Tarea'), MOMENTO_DE_CREACION(c))
	],
	[/^una tarea periódica relativa nunca completada$/, (m) => crear(m, datosDe('periódica relativa cada 1 horas', 'Tarea'), undefined)],
	[
		/^una tarea periódica relativa (?!cada )(\S+) cada (\S+) (\S+)$/,
		(m, [t, n, u]) => crear(m, datosDe(`periódica relativa cada ${n} ${u}`, t), ANTES_DEL_ESCENARIO)
	],
	[
		/^una tarea periódica relativa (\S+) nunca completada creada el (\S+)$/,
		(m, [t, c]) => crear(m, datosDe('periódica relativa cada 1 horas', t), momento(c))
	],
	[
		new RegExp(`^una tarea periódica (semanal los|mensual los días) (.*?)${creada}$`),
		(m, [f, d, c]) => crear(m, datosDe(`periódica ${f} ${d}`, 'Tarea'), MOMENTO_DE_CREACION(c))
	],
	[
		new RegExp(`^una tarea periódica (${FORMAS}) (\\S+) (?:los|los días) (.*?)${creada}$`),
		(m, [f, t, d, c]) =>
			crear(m, datosDe(`periódica ${f === 'semanal' ? 'semanal los' : 'mensual los días'} ${d}`, t), MOMENTO_DE_CREACION(c) ?? ANTES_DEL_ESCENARIO)
	]
];

/** "la tarea tiene un completado ..." ya guardado: su momento es el inicio del día cubierto si el paso no lo da. */
function guardarCompletado(m: Mundo, tarea: Documento, en: number, cubierta: Date): void {
	m.completados = [...m.completados, { id: m.siguiente++, tareaId: tarea.id, en, cubierta }];
}

/** §4.4: una ocurrencia cubierta es una fecha (sin hora) o, con hora, el inicio de una ocurrencia. */
function guardarCompletadoDel(m: Mundo, tarea: Documento, en: number, cubierta: string): void {
	const inicio = fecha(cubierta);
	if (inicio === undefined) return guardarCompletado(m, tarea, en, diaDe(cubierta));
	m.completados = [...m.completados, { id: m.siguiente++, tareaId: tarea.id, en, inicioCubierto: inicio }];
}

const COMPLETADOS: Paso[] = [
	[/^la tarea fue completada el (\S+)$/, (m, [t]) => void completar(m, unica(m), m.completados, momento(t))],
	[/^la tarea (\S+) fue completada el (\S+)$/, (m, [t, e]) => void completar(m, conTitulo(m, t), m.completados, momento(e))],
	[/^completo la tarea el (\S+)$/, (m, [e]) => completoYo(m, unica(m), momento(e))],
	[/^completo la tarea (\S+) el (\S+)$/, (m, [t, e]) => completoYo(m, conTitulo(m, t), momento(e))],
	[
		/^la tarea (\S+) fue completada el (\S+) con id (\S+)$/,
		(m, [t, e, id]) => void completar(m, conTitulo(m, t), m.completados, momento(e), id)
	],
	[
		/^la tarea tiene un completado del (\S+) que cubre el (\S+)$/,
		(m, [e, c]) => guardarCompletadoDel(m, unica(m), momento(e), c)
	],
	[
		/^la tarea tiene un completado que cubre el (\S+)$/,
		(m, [c]) => guardarCompletado(m, unica(m), diaDe(c).getTime(), diaDe(c))
	],
	[
		/^la tarea (\S+) tiene un completado que cubre el (\S+)$/,
		(m, [t, c]) => guardarCompletado(m, conTitulo(m, t), diaDe(c).getTime(), diaDe(c))
	]
];

const OTRO = 'otro dispositivo, sin ver ese cambio,';

const SOLO_ESPACIOS = '   ';

/** Cambios de la nota (§4.1, §6.2): lo escrito en el panel, con el resto de la tarea como está. */
const CAMBIOS_DE_NOTA: [string, (c: string[]) => Escritos][] = [
	['la nota a (.*) con espacios al inicio y al final', ([n]) => ({ nota: `  \n ${n} \n  ` })],
	['la nota a (.*) y (.*) en líneas separadas', ([a, b]) => ({ nota: `${a}\n${b}` })],
	['la nota a una de solo espacios', () => ({ nota: SOLO_ESPACIOS })],
	['la nota a una de (\\S+) caracteres', ([l]) => ({ nota: 'x'.repeat(numero(l)) })],
	['la nota a (.*)', ([n]) => ({ nota: n })]
];

/** Cambios del primer paso (§4.1, §6.2): lo escrito en el campo; quitarlo es vaciarlo. */
const CAMBIOS_DE_PRIMER_PASO: [string, (c: string[]) => Escritos][] = [
	['el primer paso a (.*) con espacios al inicio y al final', ([p]) => ({ primerPaso: `  ${p}  ` })],
	['el primer paso a uno de solo espacios', () => ({ primerPaso: SOLO_ESPACIOS })],
	['el primer paso a uno de (\\S+) caracteres', ([l]) => ({ primerPaso: 'x'.repeat(numero(l)) })],
	['el primer paso a (.*)', ([p]) => ({ primerPaso: p })]
];

const edicionesDePrimerPaso = (): Paso[] => [
	...CAMBIOS_DE_PRIMER_PASO.flatMap(([texto, escritos]): Paso[] => [
		[new RegExp(`^edito ${texto}$`), (m, c) => editoYo(m, undefined, (base) => conservando(base, datosDeDocumento(base), escritos(c)))],
		[new RegExp(`^${OTRO} edita ${texto}$`), (m, c) => editaElOtro(m, (base) => conservando(base, datosDeDocumento(base), escritos(c)))]
	]),
	[/^quito el primer paso$/, (m) => editoYo(m, undefined, (base) => conservando(base, datosDeDocumento(base), { primerPaso: '' }))],
	[new RegExp(`^${OTRO} quita el primer paso$`), (m) => editaElOtro(m, (base) => conservando(base, datosDeDocumento(base), { primerPaso: '' }))]
];

/** Elegir un emoji en el selector o quitarlo (§6.2): quien edita elige o quita; quitar es dejar el campo vacío. */
const CAMBIOS_DE_EMOJI: [RegExp, string, (c: string[]) => Escritos][] = [
	[/^elijo el emoji (.*) y edito la nota a (.*)$/, 'yo', ([e, n]) => ({ emoji: e, nota: n })],
	[/^elijo el emoji (.*)$/, 'yo', ([e]) => ({ emoji: e })],
	[/^quito el emoji$/, 'yo', () => ({ emoji: '' })],
	[new RegExp(`^${OTRO} elige el emoji (.*)$`), 'otro', ([e]) => ({ emoji: e })]
];

function edicionesDeEmojiYNota(): Paso[] {
	const deNota = CAMBIOS_DE_NOTA.flatMap(([texto, escritos]): Paso[] => [
		[
			new RegExp(`^edito ${texto}$`),
			(m, c) => editoYo(m, undefined, (base) => conservando(base, datosDeDocumento(base), escritos(c)))
		],
		[
			new RegExp(`^${OTRO} edita ${texto}$`),
			(m, c) => editaElOtro(m, (base) => conservando(base, datosDeDocumento(base), escritos(c)))
		]
	]);
	const deEmoji = CAMBIOS_DE_EMOJI.map(([patron, quien, escritos]): Paso => [
		patron,
		(m, c) =>
			quien === 'yo'
				? editoYo(m, undefined, (base) => conservando(base, datosDeDocumento(base), escritos(c)))
				: editaElOtro(m, (base) => conservando(base, datosDeDocumento(base), escritos(c)))
	]);
	return [...deNota, ...deEmoji];
}

/** Cambiar el horario (§6.2): quien edita escribe una o más ventanas, ninguna (lo quita) o una con una sola hora. */
const conHorario = (escritas: Escritas) => (base: Documento) => conHorarioEscrito(datosDeDocumento(base), escritas);

const EDICIONES_DE_HORARIO: Paso[] = [
	[new RegExp(`^pongo el horario ${HORARIO}$`), (m, horas) => editoYo(m, undefined, conHorario(escritasDe(horas)))],
	[/^quito el horario$/, (m) => editoYo(m, undefined, conHorario([]))],
	[/^pongo un horario con solo la hora de inicio (\S+)$/, (m, [d]) => editoYo(m, undefined, conHorario([[d, undefined]]))],
	[new RegExp(`^${OTRO} pone el horario ${HORARIO}$`), (m, horas) => editaElOtro(m, conHorario(escritasDe(horas)))],
	[new RegExp(`^${OTRO} quita el horario$`), (m) => editaElOtro(m, conHorario([]))],
	[
		new RegExp(`^edito en una misma edición el título a (.+) y el horario ${HORARIO}$`),
		(m, [t, ...horas]) => editoYo(m, undefined, (base) => conValidacion({ ...conHorario(escritasDe(horas))(base), titulo: t }))
	]
];

/** Elegir en el selector de esfuerzo (§6.2): el resto de la tarea como está; escribe solo si cambió (§7). */
const conEsfuerzo = (valor: string) => (base: Documento) => ({ ...datosDeDocumento(base), esfuerzo: esfuerzoDe(valor).esfuerzo });

const EDICIONES: Paso[] = [
	...EDICIONES_DE_HORARIO,
	[/^elijo el esfuerzo (.+)$/, (m, [e]) => editoYo(m, undefined, conEsfuerzo(e))],
	[new RegExp(`^${OTRO} elige el esfuerzo (.+)$`), (m, [e]) => editaElOtro(m, conEsfuerzo(e))],
	// §5.8: pasar una periódica pausada a puntual la reanuda en ese momento.
	[
		/^edito la tarea a puntual sin fecha límite el (\S+)$/,
		(m, [e]) => editoYo(m, undefined, (base) => conservando(base, datosDe('puntual sin fecha límite', base.titulo)), momento(e))
	],
	[
		/^edito la tarea a (.*)$/,
		(m, [def]) => editoYo(m, undefined, (base) => conservando(base, datosDe(def, base.titulo)))
	],
	[
		/^edito la tarea (\S+) a (.*)$/,
		(m, [t, def]) => editoYo(m, t, (base) => conservando(base, datosDe(def, base.titulo)))
	],
	[new RegExp(`^${OTRO} edita la tarea a (.*)$`), (m, [def]) => editaElOtro(m, (base) => conservando(base, datosDe(def, base.titulo)))],
	[
		/^edito el título a uno de solo espacios$/,
		(m) => editoYo(m, undefined, (base) => conValidacion({ ...datosDeDocumento(base), titulo: '   ' }))
	],
	[
		/^edito el título a (.*)$/,
		(m, [t]) => editoYo(m, undefined, (base) => conValidacion({ ...datosDeDocumento(base), titulo: t }))
	],
	[
		new RegExp(`^${OTRO} edita el título a (.*)$`),
		(m, [t]) => editaElOtro(m, (base) => conValidacion({ ...datosDeDocumento(base), titulo: t }))
	],
	[
		/^edito en una misma edición el título a (.+) y la fecha límite a (\S+)$/,
		(m, [t, l]) => editoYo(m, undefined, (base) => conservando(base, conValidacion(datosDe(`puntual con fecha límite ${l}`, t))))
	],
	[new RegExp(`^${OTRO} guarda la tarea sin cambios$`), (m) => editaElOtro(m, datosDeDocumento)],
	...edicionesDeEmojiYNota(),
	...edicionesDePrimerPaso()
];

/** Pausar y reanudar (§5.8, §6.2): el botón del panel actúa en el momento; solo las periódicas se pausan. */
function pausar(m: Mundo, d: Documento): void {
	if (d.tipo !== 'periodica') indeciso('la tarea no se puede pausar');
	m.documentos = m.documentos.map((x) => (x.id === d.id ? { ...x, pausada: true } : x));
}

function reanudar(m: Mundo, d: Documento, en: number): void {
	if (!d.pausada) indeciso('la tarea no está pausada');
	m.documentos = m.documentos.map((x) => (x.id === d.id ? { ...x, pausada: undefined, reanudada: en } : x));
}

/**
 * §5.9 y §6.2: Posponer solo actúa si el panel, con lo que ve quien pospone, lo ofrece en ese momento. El cambio
 * escribe solo `pospuesta`, entera (§7), y llega a lo guardado hoy.
 */
function posponer(m: Mundo, vista: Guardado, opcion: string, valor: string): void {
	const pospuesta = posposicionDe(opcion, valor) ?? indeciso('opción de posponer');
	const d = derivada(unica(vista));
	if (botonDePosponer({ ...situacionDe(vista, d, pospuesta.desde), pausada: d.pausada }) !== 'Posponer') indeciso('el panel no ofrece Posponer');
	m.documentos = m.documentos.map((x) => (x.id === d.id ? { ...x, pospuesta } : x));
}

const POSPOSICIONES: Paso[] = [
	[/^la tarea fue pospuesta con la opción (.+) el (\S+)$/, (m, [o, e]) => posponer(m, m, o, e)],
	[
		/^pospongo la tarea con la opción (.+) el (\S+)$/,
		(m, [o, e]) => {
			m.antes = copiar(m);
			posponer(m, m, o, e);
		}
	],
	[new RegExp(`^${OTRO} pospone la tarea con la opción (.+) el (\\S+)$`), (m, [o, e]) => posponer(m, loQueVioElOtro(m), o, e)]
];

const PAUSAS: Paso[] = [
	[/^la tarea fue pausada$/, (m) => pausar(m, derivada(unica(m)))],
	[/^la tarea (\S+) fue pausada$/, (m, [t]) => pausar(m, derivada(conTitulo(m, t)))],
	[
		/^pauso la tarea$/,
		(m) => {
			m.antes = copiar(m);
			pausar(m, derivada(unica(m)));
		}
	],
	// §7: pausar escribe solo `pausada`; llega a lo guardado hoy aunque el otro dispositivo no haya visto la reanudación.
	[new RegExp(`^${OTRO} pausa la tarea$`), (m) => pausar(m, derivada(unica(m)))],
	[
		/^reanudo la tarea el (\S+)$/,
		(m, [e]) => {
			m.antes = copiar(m);
			reanudar(m, derivada(unica(m)), momento(e));
		}
	],
	[
		/^reanudo la tarea (\S+) el (\S+)$/,
		(m, [t, e]) => {
			m.antes = copiar(m);
			reanudar(m, derivada(conTitulo(m, t)), momento(e));
		}
	]
];

const BORRADOS: Paso[] = [
	[
		/^borro la tarea$/,
		(m) => {
			m.antes = copiar(m);
			borrar(m, unica(m), m.completados);
		}
	],
	[
		/^borro la tarea (\S+)$/,
		(m, [t]) => {
			m.antes = copiar(m);
			borrar(m, conTitulo(m, t), m.completados);
		}
	],
	[
		new RegExp(`^${OTRO} borra la tarea$`),
		(m) => {
			const visto = loQueVioElOtro(m);
			borrar(m, unica(visto), visto.completados);
		}
	],
	[
		new RegExp(`^${OTRO} completa la tarea (\\S+) el (\\S+)$`),
		(m, [t, e]) => {
			const visto = loQueVioElOtro(m);
			completar(m, conTitulo(visto, t), visto.completados, momento(e));
		}
	]
];

const DESHACERES: Paso[] = [
	[
		/^borro el completado del (\S+)$/,
		(m, [e]) => {
			m.antes = copiar(m);
			borrarCompletados(m, [elCompletadoDel(m, momento(e)).id]);
		}
	],
	[new RegExp(`^${OTRO} borra el completado del (\\S+)$`), (m, [e]) => borrarCompletados(m, [elCompletadoDel(m, momento(e)).id])],
	[/^toco Deshacer en el aviso el (\S+)$/, (m, [e]) => tocoDeshacer(m, momento(e))],
	[/^toco el checkbox de la tarea el (\S+)$/, (m, [e]) => tocoElCheckbox(m, momento(e))]
];

const CONSULTAS: Paso[] = [
	[/^consulto el aviso el (\S+)$/, (m, [t]) => void (m.avisoVisto = consultarAviso(m, momento(t)))],
	[/^consulto el Historial el (\S+)$/, (m, [t]) => void (m.historial = consultarHistorial(m, momento(t)))],
	[/^consulto la última vez el (\S+)$/, (m, [t]) => void (m.ultimaVez = consultarUltimaVez(m, momento(t)))],
	[
		/^consulto el estado el (\S+)$/,
		(m, [t]) => {
			m.consultadoEn = momento(t);
			m.estado = clasificar(m, m.consultadoEn);
		}
	],
	[/^consulto el estado en cualquier momento$/, (m) => void (m.estado = clasificar(m, undefined))],
	[/^consulto Pendientes el (\S+)$/, (m, [t]) => void (m.orden = ordenEn(m, momento(t)))],
	[/^consulto Pendientes en cualquier momento$/, (m) => void (m.orden = ordenEn(m, undefined))],
	[new RegExp(`^${MOSTRAR_COMPLETADAS}$`), (m) => void (m.mostrarCompletadas = true)]
];

const PASOS: Paso[] = [...CREACIONES, ...COMPLETADOS, ...PAUSAS, ...POSPOSICIONES, ...EDICIONES, ...BORRADOS, ...DESHACERES, ...CONSULTAS];

// ---- Lo que cada Then observa ----

const estadoConsultado = (m: Mundo) => m.estado ?? (m.tocadoEn === undefined ? indeciso('sin consulta de estado') : clasificar(m, m.tocadoEn));
const tipoDeEstado = (clasificacion: string) => (clasificacion.startsWith('en espera') ? 'en espera' : clasificacion);
const dia_ = (d: Date | undefined) => (d === undefined ? '-' : isoDia(d));

/** §4.4: la ocurrencia cubierta, con hora si la tiene (formatos distintos). */
const cubiertaEnTexto = (c: Completado) => (c.inicioCubierto === undefined ? dia_(c.cubierta) : `inicio ${c.inicioCubierto}`);
const laTarea = (m: Mundo) => derivada(unica(m));
const laQueTenia = laQueTuvo;
/** §6.1: la tarea consultada está completada (puntual con completados, o periódica en espera con completados). */
const completadaConsultada = (m: Mundo) =>
	!estaPausada(m) && esCompletada(laTarea(m).tipo === 'puntual', tipoDeEstado(estadoConsultado(m)) === 'en espera' && !pospuestaConsultada(m), vigentesDe(m, unica(m)).length > 0);
/** §5.9: en espera por la posposición en el momento consultado: no está completada. */
const pospuestaConsultada = (m: Mundo) => {
	const en = m.consultadoEn ?? m.tocadoEn;
	return en !== undefined && enEsperaPorPosposicion(situacionDe(m, unica(m), en));
};
const claveDePosposicion = (p: Posposicion | undefined) => (p ? `${p.desde} ${p.hasta}` : '-');
/** §5.8: una pausada no tiene estado, no está completada y su checkbox está deshabilitado. */
const estaPausada = (m: Mundo) => laTarea(m).pausada === true;
const elNuevo = (m: Mundo) => m.nuevo ?? indeciso('no se completó');
const unSoloCompletadoDe = (m: Mundo, d: Documento) =>
	JSON.stringify(completadosDe(m, d.id).map((c) => [c.en, c.cubierta !== undefined || c.inicioCubierto !== undefined]));

type Observacion = [RegExp, (m: Mundo, c: string[]) => string];

const OBSERVACIONES: Observacion[] = [
	[/^el estado es (?:pendiente|en espera|atrasada)$/, (m) => tipoDeEstado(estadoConsultado(m))],
	[/^el progreso es (\S+)$/, (m) => estadoConsultado(m)],
	// Con Mostrar completadas apagado, las completadas no tienen fila (§6.1).
	[/^la tarea no aparece en Pendientes$/, (m) => String(!m.mostrarCompletadas && completadaConsultada(m))],
	[/^la tarea está completada$/, (m) => String(completadaConsultada(m))],
	[/^la tarea no está completada$/, (m) => String(!completadaConsultada(m))],
	[/^la tarea está pausada$/, (m) => String(estaPausada(m))],
	[/^la tarea no está pausada$/, (m) => String(!estaPausada(m))],
	[/^la tarea no tiene estado$/, (m) => String(estaPausada(m))],
	[/^la tarea está pospuesta desde (\S+) hasta (\S+)$/, (m) => claveDePosposicion(unica(m).pospuesta)],
	[/^la tarea no está pospuesta$/, (m) => String(unica(m).pospuesta === undefined)],
	[/^la tarea tiene (?:un completado|dos completados)$/, (m) => String(completadosDe(m, unica(m).id).length)],
	[/^el nuevo completado se agrega sin modificar los anteriores$/, (m) => String(m.nuevo !== undefined)],
	[/^se registró un completado sin ocurrencia cubierta$/, (m) => String(elNuevo(m).cubierta === undefined && elNuevo(m).inicioCubierto === undefined)],
	[/^el completado registrado es del (\S+)$/, (m) => String(elNuevo(m).en)],
	[/^Pendientes muestra en orden (.*)$/, (m) => m.orden ?? indeciso('sin consulta de Pendientes')],
	[/^la tarea tiene título (.+)$/, (m) => laTarea(m).titulo],
	[/^la tarea es (?:puntual|periódica)$/, (m) => laTarea(m).tipo],
	[/^su fecha límite es (\S+)$/, (m) => (laTarea(m).tipo === 'puntual' ? dia_(laTarea(m).limite) : indeciso('no es puntual'))],
	[/^la tarea no tiene fecha límite$/, (m) => String(unica(m).limite === undefined)],
	[/^la tarea tiene emoji (.*)$/, (m) => unica(m).emoji ?? '-'],
	[/^la tarea no tiene emoji$/, (m) => String(unica(m).emoji === undefined)],
	[/^la tarea tiene nota (.*)$/, (m) => unica(m).nota ?? '-'],
	[/^la tarea no tiene nota$/, (m) => String(unica(m).nota === undefined)],
	[/^la tarea tiene primer paso (.*)$/, (m) => unica(m).primerPaso ?? '-'],
	[/^la tarea no tiene primer paso$/, (m) => String(unica(m).primerPaso === undefined)],
	[/^la tarea tiene un primer paso de (\S+) caracteres$/, (m) => String(unica(m).primerPaso?.length)],
	[/^su esfuerzo es (.+)$/, (m) => unica(m).esfuerzo ?? 'sin estimar'],
	[/^la nota de la tarea tiene dos líneas: .*$/, (m) => JSON.stringify(unica(m).nota?.split('\n'))],
	[/^la tarea tiene una nota de (\S+) caracteres$/, (m) => String(unica(m).nota?.length)],
	[/^el nombre de la tarea es .*$/, (m) => nombreDe(unica(m))],
	[/^la tarea no tiene recurrencia$/, (m) => String(unica(m).recurrencia === undefined)],
	[
		/^su recurrencia es (?:relativa cada|semanal los|mensual los días) .*$/,
		(m) => (laTarea(m).tipo === 'periodica' ? claveDeRecurrencia(laTarea(m).recurrencia) : indeciso('no es periódica'))
	],
	[/^la tarea sigue creada el (\S+)$/, (m) => String(unica(m).creada)],
	[/^la tarea conserva su id$/, (m) => String(unica(m).id === unica(loQueVioElOtro(m)).id)],
	[/^la tarea conserva un solo completado, del (\S+)$/, (m) => unSoloCompletadoDe(m, unica(m))],
	[/^la tarea (\S+) conserva un solo completado, del (\S+)$/, (m, [t]) => unSoloCompletadoDe(m, conTitulo(m, t))],
	[/^la tarea no tiene completados$/, (m) => String(completadosDe(m, unica(m).id).length === 0)],
	[/^el aviso ofrece deshacer el completado de (\S+) del (\S+)$/, (m) => m.avisoVisto ?? indeciso('sin consulta del aviso')],
	[/^no hay aviso$/, (m) => String((m.avisoVisto ?? indeciso('sin consulta del aviso')) === 'sin aviso')],
	[/^el Historial muestra (.*)$/, (m) => m.historial ?? indeciso('sin consulta del Historial')],
	[/^la última vez muestra (.*)$/, (m) => m.ultimaVez ?? indeciso('sin consulta de la última vez')],
	[/^el Historial está vacío$/, (m) => String((m.historial ?? indeciso('sin consulta del Historial')) === '')],
	[/^la edición se rechaza por .*$/, (m) => m.rechazo ?? indeciso('no hubo rechazo')],
	[/^la edición se rechaza porque la hora de fin no es posterior a la de inicio$/, (m) => m.rechazo ?? indeciso('no hubo rechazo')],
	[new RegExp(`^la tarea tiene horario ${HORARIO}$`), (m) => claveDeHorario(unica(m).horario)],
	[/^la tarea no tiene horario$/, (m) => String(unica(m).horario === undefined)],
	[
		/^la tarea no cambia$/,
		(m) => String(JSON.stringify(m.documentos.map(claveDeDocumento)) === JSON.stringify(loQueVioElOtro(m).documentos.map(claveDeDocumento)))
	],
	[
		/^no existe la tarea (\S+)$/,
		(m, [t]) => {
			const id = laQueTenia(m, t).id;
			return String(!m.documentos.some((d) => d.id === id) && !m.documentos.some((d) => d.titulo === t));
		}
	],
	[/^no queda ningún completado de (\S+)$/, (m, [t]) => String(completadosDe(m, laQueTenia(m, t).id).length === 0)],
	[/^no queda ninguna tarea$/, (m) => String(m.documentos.length === 0)],
	[
		/^los completados huérfanos a limpiar son solo el de (\S+) del (\S+)$/,
		(m, [t]) => {
			const huerfanos = m.completados.filter((c) => !m.documentos.some((d) => d.id === c.tareaId));
			return JSON.stringify([laQueTenia(m, t).id, huerfanos.map((c) => [c.tareaId, c.en])]);
		}
	],
	[
		/^se registró un completado que cubre el (\S+)$/,
		// Que el completado quede en el momento de completar es una invariante; lo que varía es la ocurrencia que cubre.
		(m) => (m.nuevo ? cubiertaEnTexto(m.nuevo) : indeciso('no se completó'))
	]
];

/** Los pasos propios de este oráculo: escenarios que editan, borran o modifican concurrentemente. */
const ES_DE_EDICION =
	/^(?:edito |elijo |quito el emoji$|quito el horario$|quito el primer paso$|el primer paso de la tarea |pongo |borro |toco Deshacer |toco el checkbox |consulto el aviso |consulto el Historial |consulto la última vez |otro dispositivo, sin ver ese cambio,)/;

export const esEscenarioDeEdicion = (textos: string[]) => textos.some((texto) => ES_DE_EDICION.test(texto));

function ejecutar(pasos: PasoOraculo[], fila: FilaOraculo, m: Mundo): void {
	for (const paso of pasos) {
		const texto = resolver(paso.text, fila) ?? indeciso(`columna faltante en ${paso.text}`);
		const regla = PASOS.map(([patron, aplicar]) => ({ coincide: patron.exec(texto), aplicar })).find((r) => r.coincide);
		if (!regla?.coincide) indeciso(`paso ${texto}`);
		else regla.aplicar(m, regla.coincide.slice(1));
	}
}

function observar(entradas: PasoOraculo[], thens: PasoOraculo[], fila: FilaOraculo): string[] {
	const m: Mundo = { documentos: [], completados: [], siguiente: 1, borradasDocs: [], borradosCompletados: [] };
	ejecutar(entradas, fila, m);
	return thens.map((paso) => {
		const texto = resolver(paso.text, fila) ?? indeciso(`columna faltante en ${paso.text}`);
		const regla = OBSERVACIONES.map(([patron, ver]) => ({ coincide: patron.exec(texto), ver })).find((r) => r.coincide);
		return regla?.coincide ? regla.ver(m, regla.coincide.slice(1)) : indeciso(`Then ${texto}`);
	});
}

/**
 * Lo que observa cada Then tras ejecutar los pasos de entrada con la fila, o undefined si el oráculo no
 * reconoce algún paso o el spec no decide el resultado (por ejemplo, la tarea no existe).
 */
export function observarEdicion(entradas: PasoOraculo[], thens: PasoOraculo[], fila: FilaOraculo): string[] | undefined {
	try {
		return observar(entradas, thens, fila);
	} catch (error) {
		if (error instanceof Indeciso) return undefined;
		throw error;
	}
}
