// Oráculo de las anotaciones (spec §4.5, §5.10, §6.7, §6.2, §7), escrito desde el spec. NO importa el
// core ni los step handlers: es una segunda implementación, así que la implementación no juzga a sus
// propios tests. Simula el escenario (lo guardado, dónde está la persona, el panel y el aviso de
// deshacer) y devuelve lo que cada paso Then observa. Todo lo que no reconoce o no puede decidir
// (por ejemplo dos anotaciones del mismo instante sin ids) lanza `Indeciso`: el resultado es
// undefined y la mutación no se filtra.
import { date, type RowOracle, type StepOracle } from './oracle';
import { noticeSees, dayHeading } from './oracle-history';

class Undecided extends Error {}
const undecided = (reason: string): never => {
	throw new Undecided(reason);
};

interface Task {
	/** Como se llamó al declararla: así la nombran los pasos. */
	name: string;
	title: string;
	emoji?: string;
	deleted: boolean;
}

interface Annotation {
	id: string;
	at: number;
	direction: string;
	screenName: string;
	task?: Task;
	text?: string;
	deleted: boolean;
}

interface OracleWorld {
	tasks: Task[];
	completions: { task: Task; at: number }[];
	annotations: Annotation[];
	screenName?: string;
	/** El panel de edición abierto: la tarea, si se abrió para editar. */
	panel?: { task?: Task };
	/** El aviso del último completado de este dispositivo (§5.4). */
	notice?: { task: Task; at: number };
	next: number;
	last?: Annotation;
	/** Las anotaciones que mostró la última consulta de Anotaciones y el texto de la última copia. */
	view?: string;
	copy?: string[];
}

const DIRECTIONS = ['Me sirvió', 'Me molestó'];
const SCREENS_CURRENT = ['Pendientes', 'Historial', 'Anotaciones'];
/** §4.5: «Etiquetas» ya no es una pantalla donde anotar; las anotaciones guardadas con ella la conservan como valor opaco. */
const SCREENS = [...SCREENS_CURRENT, 'Etiquetas', 'Panel de edición'];

const withValues = (text: string, row: RowOracle) => text.replace(/<([A-Za-z0-9_]+)>/g, (_, column: string) => row[column] ?? '<?>');

const moment = (value: string) => date(value) ?? undecided(`fecha ${value}`);
const directionOf = (value: string) => (DIRECTIONS.includes(value) ? value : undecided(`sentido ${value}`));
const screenOf = (value: string) => (SCREENS.includes(value) ? value : undecided(`pantalla ${value}`));

function spaces(value: string): string {
	const n = Number(value);
	if (value.trim() === '' || !Number.isInteger(n) || n < 0 || n > 100_000) return undecided(`espacios ${value}`);
	return ' '.repeat(n);
}

/** §4.5: se recortan los espacios del inicio y del final; vacío es sin texto. */
const trimmed = (text: string): string | undefined => text.trim() || undefined;

const twoDigits = (n: number) => String(n).padStart(2, '0');
const hourOf = (at: number) => `${twoDigits(new Date(at).getHours())}:${twoDigits(new Date(at).getMinutes())}`;
const dateAndHourOf = (at: number) => {
	const d = new Date(at);
	return `${d.getFullYear()}-${twoDigits(d.getMonth() + 1)}-${twoDigits(d.getDate())} ${hourOf(at)}`;
};

function theTask(world: OracleWorld, name: string): Task {
	return world.tasks.find((task) => task.name === name) ?? undecided(`tarea ${name}`);
}

function theAnnotation(world: OracleWorld, annotated: string): Annotation {
	const at = moment(annotated);
	const ofMoment = world.annotations.filter((annotation) => annotation.at === at);
	return ofMoment.length === 1 ? ofMoment[0] : undecided(`anotación del ${annotated}`);
}

function fresh(world: OracleWorld, direction: string, screenName: string, at: number, task?: Task, text?: string): Annotation {
	const annotation: Annotation = { id: `~${String(world.next++).padStart(6, '0')}`, at, direction, screenName, task, text, deleted: false };
	world.annotations.push(annotation);
	world.last = annotation;
	return annotation;
}

/** §5.10: el panel manda sobre el aviso de deshacer; con el panel cerrado, el aviso solo si se ve. */
function annotateMe(world: OracleWorld, direction: string, now: string, text = ''): void {
	const at = moment(now);
	if (world.screenName === undefined) undecided('sin pantalla');
	const task = world.panel ? world.panel.task : world.notice && noticeSees(world.notice.at, at) ? world.notice.task : undefined;
	fresh(world, directionOf(direction), world.panel ? 'Panel de edición' : (world.screenName as string), at, task, trimmed(text));
}

/** Otro dispositivo, sin panel; sobre una tarea solo con su aviso de deshacer a la vista. */
function annotatesOther(world: OracleWorld, direction: string, screenName: string, now: string, title?: string): void {
	if (![...SCREENS_CURRENT, 'Etiquetas'].includes(screenName)) undecided(`pantalla ${screenName}`);
	fresh(world, directionOf(direction), screenName, moment(now), title === undefined ? undefined : theTask(world, title));
}

/** §7: borrar gana sobre editar; una edición de una anotación borrada no la revive. */
function doEditText(world: OracleWorld, annotated: string, text: string): void {
	const annotation = theAnnotation(world, annotated);
	if (!annotation.deleted) annotation.text = trimmed(text);
}

function deleteAnnotation(world: OracleWorld, annotated: string): void {
	theAnnotation(world, annotated).deleted = true;
}

/** §6.2, §7: se borran la tarea, sus completados y sus anotaciones, y solo las suyas. */
function deleteTask(world: OracleWorld, name: string): void {
	const task = theTask(world, name);
	task.deleted = true;
	world.completions = world.completions.filter((completion) => completion.task !== task);
	for (const annotation of world.annotations) if (annotation.task === task) annotation.deleted = true;
}

const nameOf = ({ title, emoji }: Task) => (emoji ? `${emoji} ${title}` : title);

/** §6.7: las de tarea existente o sin tarea; las huérfanas y las de tareas borradas no se muestran. */
const visible = (world: OracleWorld) => world.annotations.filter((annotation) => !annotation.deleted && !annotation.task?.deleted);

/** §6.7: con el mismo instante, primero la de id menor; sin ids que desempaten no se decide. */
function sorted(world: OracleWorld, moreRecentFirst: boolean): Annotation[] {
	const list = visible(world);
	const withoutTiebreak = list.some((a, i) => list.some((b, j) => i < j && a.at === b.at && (a.id.startsWith('~') || b.id.startsWith('~') || a.id === b.id)));
	if (withoutTiebreak) undecided('empate sin ids');
	return [...list].sort((a, b) => (moreRecentFirst ? b.at - a.at : a.at - b.at) || (a.id < b.id ? -1 : 1));
}

const parts = (annotation: Annotation, front: string) =>
	[front, annotation.direction, annotation.screenName, annotation.task && nameOf(annotation.task), annotation.text].filter((part) => part !== undefined).join(' · ');

/** §6.7: grupos "<encabezado>: <anotaciones>" con "; ", anotaciones con ", ". */
function annotationsScreen(world: OracleWorld, now: number): string {
	const groups: { heading: string; texts: string[] }[] = [];
	for (const annotation of sorted(world, true)) {
		const heading = dayHeading(annotation.at, now);
		const text = parts(annotation, hourOf(annotation.at));
		const last = groups.at(-1);
		if (last?.heading === heading) last.texts.push(text);
		else groups.push({ heading, texts: [text] });
	}
	return groups.map(({ heading, texts }) => `${heading}: ${texts.join(', ')}`).join('; ');
}

/** §6.7: una línea por anotación que la pantalla muestra, de la más antigua a la más reciente. */
const linesCopied = (world: OracleWorld) => sorted(world, false).map((annotation) => parts(annotation, dateAndHourOf(annotation.at)));

type Reader = [RegExp, (world: OracleWorld, ...captures: string[]) => void];

const DIRECTION = '(Me sirvió|Me molestó)';
const SCREEN = `(${SCREENS.join('|')})`;
const OTHER = 'otro dispositivo, sin ver ese cambio,';

const READERS: Reader[] = [
	[
		/^una tarea puntual (\S+) (?:sin|con) fecha límite(?: (?:\d{4}-\d{2}-\d{2}))?(?: con emoji (\S+))?$/,
		(world, name, emoji) => void world.tasks.push({ name, title: name, emoji, deleted: false })
	],
	[/^estoy en (\S+)$/, (world, screenName) => void (world.screenName = SCREENS_CURRENT.includes(screenName) ? screenName : undecided(screenName))],
	[/^el panel de edición está abierto al editar la tarea (\S+)$/, (world, name) => void (world.panel = { task: theTask(world, name) })],
	[/^el panel de edición está abierto al crear una tarea$/, (world) => void (world.panel = {})],
	[
		/^completo la tarea (\S+) el (\S+)$/,
		(world, name, at) => {
			const task = theTask(world, name);
			world.completions.push({ task, at: moment(at) });
			world.notice = { task, at: moment(at) };
		}
	],
	[/^la tarea (\S+) fue completada el (\S+)$/, (world, name, at) => void world.completions.push({ task: theTask(world, name), at: moment(at) })],
	[
		/^edito el título a (\S+)$/,
		(world, title) => {
			const live = world.tasks.filter(({ deleted }) => !deleted);
			if (live.length !== 1) undecided('título de varias tareas');
			live[0].title = title;
		}
	],
	[new RegExp(`^anoto ${DIRECTION} el (\\S+)$`), (world, direction, now) => annotateMe(world, direction, now)],
	[
		new RegExp(`^anoto ${DIRECTION} el (\\S+) con el texto (.+?) entre (\\S+) espacios$`),
		(world, direction, now, text, n) => annotateMe(world, direction, now, `${spaces(n)}${text}${spaces(n)}`)
	],
	[new RegExp(`^anoto ${DIRECTION} el (\\S+) con el texto (.+)$`), (world, direction, now, text) => annotateMe(world, direction, now, text)],
	[new RegExp(`^anoto ${DIRECTION} el (\\S+) con (\\S+) espacios como texto$`), (world, direction, now, n) => annotateMe(world, direction, now, spaces(n))],
	[
		new RegExp(`^anoto ${DIRECTION} el (\\S+) con un texto de (\\S+) caracteres$`),
		(world, direction, now, length) => annotateMe(world, direction, now, 'a'.repeat(Number(length) >= 0 && Number(length) <= 100_000 ? Number(length) : undecided(length)))
	],
	[new RegExp(`^${OTHER} anota ${DIRECTION} en ${SCREEN} el (\\S+)$`), (world, direction, screenName, now) => annotatesOther(world, direction, screenName, now)],
	[
		new RegExp(`^${OTHER} anota ${DIRECTION} en ${SCREEN} el (\\S+) sobre la tarea (\\S+)$`),
		(world, direction, screenName, now, title) => annotatesOther(world, direction, screenName, now, title)
	],
	[
		new RegExp(`^una anotación ${DIRECTION} en ${SCREEN} del (\\S+)$`),
		(world, direction, screenName, annotated) => void fresh(world, direction, screenOf(screenName), moment(annotated))
	],
	[
		/^la anotación se refiere a la tarea (\S+)$/,
		(world, name) => void ((world.last ?? undecided('sin anotación')).task = theTask(world, name))
	],
	[/^la anotación dice (.+)$/, (world, text) => void ((world.last ?? undecided('sin anotación')).text = trimmed(text))],
	[/^la anotación se registró con id (\S+)$/, (world, id) => void ((world.last ?? undecided('sin anotación')).id = id)],
	[/^consulto Anotaciones el (\S+)$/, (world, now) => void (world.view = annotationsScreen(world, moment(now)))],
	[/^copio las anotaciones$/, (world) => void (world.copy = linesCopied(world))],
	[
		/^edito el texto de la anotación del (\S+) a (.+?) entre (\S+) espacios$/,
		(world, annotated, text, n) => doEditText(world, annotated, `${spaces(n)}${text}${spaces(n)}`)
	],
	[/^edito el texto de la anotación del (\S+) a (\S+) espacios$/, (world, annotated, n) => doEditText(world, annotated, spaces(n))],
	[/^edito el texto de la anotación del (\S+) a (.+)$/, (world, annotated, text) => doEditText(world, annotated, text)],
	[new RegExp(`^${OTHER} edita el texto de la anotación del (\\S+) a (.+)$`), (world, annotated, text) => doEditText(world, annotated, text)],
	[/^borro la anotación del (\S+)$/, (world, annotated) => deleteAnnotation(world, annotated)],
	[new RegExp(`^${OTHER} borra la anotación del (\\S+)$`), (world, annotated) => deleteAnnotation(world, annotated)],
	[/^borro la tarea (\S+)$/, (world, name) => deleteTask(world, name)]
];

const saved = (world: OracleWorld) => world.annotations.filter(({ deleted }) => !deleted);
const withoutDefine = (text: string | undefined) => text ?? '<sin texto>';

/** Cada Then: lo que el oráculo observa y lo que el paso afirma. */
type Observer = [RegExp, (world: OracleWorld, ...captures: string[]) => [observado: string, afirmado: string]];

const OBSERVERS: Observer[] = [
	[/^queda una sola anotación$/, (world) => [String(saved(world).length), '1']],
	[/^quedan (\S+) anotaciones$/, (world, n) => [String(saved(world).length), n]],
	[/^no queda ninguna anotación$/, (world) => [String(saved(world).length), '0']],
	[/^no existe la anotación del (\S+)$/, (world, annotated) => [String(!theAnnotation(world, annotated).deleted), 'false']],
	[
		/^la anotación del (\S+) tiene sentido (Me sirvió|Me molestó) en (.+)$/,
		(world, annotated, direction, screenName) => {
			const annotation = theAnnotation(world, annotated);
			return [`${annotation.direction}|${annotation.screenName}`, `${direction}|${screenName}`];
		}
	],
	[/^la anotación del (\S+) es de la tarea (\S+)$/, (world, annotated, name) => [theAnnotation(world, annotated).task?.name ?? '<sin tarea>', name]],
	[/^la anotación del (\S+) no es de ninguna tarea$/, (world, annotated) => [String(theAnnotation(world, annotated).task === undefined), 'true']],
	[/^la anotación del (\S+) dice un texto de (\S+) caracteres$/, (world, annotated, length) => [String(theAnnotation(world, annotated).text?.length), length]],
	[/^la anotación del (\S+) dice (.+)$/, (world, annotated, text) => [withoutDefine(theAnnotation(world, annotated).text), text]],
	[/^la anotación del (\S+) no tiene texto$/, (world, annotated) => [String(theAnnotation(world, annotated).text === undefined), 'true']],
	[/^el panel sigue abierto sin cambios sin guardar$/, (world) => [String(world.panel !== undefined && saved(world).length > 0), 'true']],
	[/^Anotaciones muestra (.+)$/, (world, expected) => [world.view ?? undecided('sin consulta'), expected]],
	[/^Anotaciones está vacía$/, (world) => [world.view ?? undecided('sin consulta'), '']],
	[/^el texto copiado tiene las líneas (.+)$/, (world, lines) => [(world.copy ?? undecided('sin copia')).join('; '), lines]],
	[/^no hay nada para copiar$/, (world) => [String((world.copy ?? undecided('sin copia')).length), '0']],
	[
		/^las anotaciones huérfanas a limpiar son solo la del (\S+)$/,
		(world, annotated) => [
			// §7: una anotación de una tarea que ya no existe, que nadie borró con ella.
			world.annotations
				.filter((annotation) => !annotation.deleted && annotation.task?.deleted)
				.map(({ at }) => at)
				.join(','),
			String(moment(annotated))
		]
	],
	[/^no existe la tarea (\S+)$/, (world, name) => [String(!theTask(world, name).deleted), 'false']],
	[/^no queda ningún completado de (\S+)$/, (world, name) => [String(world.completions.filter(({ task }) => task === theTask(world, name)).length), '0']],
	[
		/^la tarea (\S+) conserva un solo completado, del (\S+)$/,
		(world, name, completed) => [world.completions.filter(({ task }) => task === theTask(world, name)).map(({ at }) => at).join(','), String(moment(completed))]
	]
];

const SCENARIO_PATTERNS = [
	/^anoto /,
	/^una anotación /,
	/^consulto Anotaciones el /,
	/^copio las anotaciones$/,
	/^edito el texto de la anotación /,
	/^borro la anotación /,
	/ (?:anota|edita el texto de la anotación|borra la anotación) /
];

export const isScenarioOfAnnotations = (texts: string[]) => texts.some((text) => SCENARIO_PATTERNS.some((pattern) => pattern.test(text)));

/** Lo que observa y lo que afirma cada Then: undefined si el oráculo no reconoce o no decide el escenario. */
export function observeAnnotations(entries: StepOracle[], thens: StepOracle[], row: RowOracle): { observed: string[]; asserted: string[] } | undefined {
	const world: OracleWorld = { tasks: [], completions: [], annotations: [], next: 1 };
	try {
		for (const step of entries) {
			const text = withValues(step.text, row);
			const reader = READERS.find(([pattern]) => pattern.test(text));
			if (!reader) return undefined;
			reader[1](world, ...(reader[0].exec(text) as RegExpExecArray).slice(1));
		}
		const observed: string[] = [];
		const asserted: string[] = [];
		for (const step of thens) {
			const text = withValues(step.text, row);
			const observer = OBSERVERS.find(([pattern]) => pattern.test(text));
			if (!observer) return undefined;
			const [seen, said] = observer[1](world, ...(observer[0].exec(text) as RegExpExecArray).slice(1));
			observed.push(seen);
			asserted.push(said);
		}
		return { observed, asserted };
	} catch (error) {
		if (error instanceof Undecided) return undefined;
		throw error;
	}
}

// Limpiezas y reintentos (spec §7), escrito desde el spec. Las cuatro limpiezas se intentan elemento por
// elemento: se limpia todo elemento cuyo intento no falla y quedan por limpiar solo los que fallaron. Se
// reintenta al volver la conexión y cuando cambian los datos; el tiempo no cuenta (sin temporizadores).

const CLEANUPS = ['completados huérfanos', 'anotaciones huérfanas'];
const EVENTS_THAT_RETRY = ['vuelve la conexión', 'cambian los datos'];

interface CleanupWorld {
	original: string[];
	fail: Set<string>;
	clean: Set<string>;
	pending: string[];
}

export const isScenarioOfCleanups = (texts: string[]) => texts.some((text) => /^(?:hay por limpiar |la app intent(?:a|ó) las limpiezas$)/.test(text));

/** Lista de ids separada por ", "; "ninguno" es la lista vacía. */
function idsOf(value: string): string[] {
	if (value === 'ninguno') return [];
	const parts = value.split(', ');
	return parts.some((part) => part === '' || part !== part.trim()) ? undecided(`lista ${value}`) : parts;
}

function attemptCleanups(m: CleanupWorld): void {
	for (const id of m.pending) if (!m.fail.has(id)) m.clean.add(id);
	m.pending = m.pending.filter((id) => m.fail.has(id));
}

function cleanupStep(m: CleanupWorld, text: string): void {
	let c: RegExpExecArray | null;
	if ((c = /^hay por limpiar (.+) de (.+)$/.exec(text))) {
		if (!CLEANUPS.includes(c[2])) undecided(`limpieza ${c[2]}`);
		m.original = idsOf(c[1]);
		m.pending = [...m.original];
	} else if ((c = /^falla el intento de limpiar (.+)$/.exec(text))) {
		for (const id of idsOf(c[1])) m.fail.add(id);
	} else if ((c = /^deja de fallar el intento de limpiar (.+)$/.exec(text))) {
		for (const id of idsOf(c[1])) m.fail.delete(id);
	} else if (/^la app intent(?:a|ó) las limpiezas$/.test(text)) {
		attemptCleanups(m);
	} else if ((c = /^sucede que (.+)$/.exec(text))) {
		if (!EVENTS_THAT_RETRY.includes(c[1])) undecided(`suceso ${c[1]}`);
		attemptCleanups(m);
	} else if ((c = /^pasan (.+) minutos sin que suceda nada más$/.exec(text))) {
		if (!/^\d+$/.test(c[1])) undecided(`minutos ${c[1]}`);
	} else undecided(`paso ${text}`);
}

export function observeCleanups(entries: StepOracle[], thens: StepOracle[], row: RowOracle): { observed: string[]; asserted: string[] } | undefined {
	try {
		const m: CleanupWorld = { original: [], fail: new Set(), clean: new Set(), pending: [] };
		for (const step of entries) cleanupStep(m, withValues(step.text, row));
		const list = (ids: string[]) => (ids.length === 0 ? 'ninguno' : ids.join(', '));
		const observed: string[] = [];
		const asserted: string[] = [];
		for (const step of thens) {
			const text = withValues(step.text, row);
			const c = /^quedan (limpios|por limpiar) (.+)$/.exec(text) ?? undecided(`then ${text}`);
			observed.push(list(c[1] === 'limpios' ? m.original.filter((id) => m.clean.has(id)) : m.original.filter((id) => m.pending.includes(id))));
			asserted.push(list(idsOf(c[2])));
		}
		return { observed, asserted };
	} catch (error) {
		if (error instanceof Undecided) return undefined;
		throw error;
	}
}
