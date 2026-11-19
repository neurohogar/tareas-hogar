// Oracle for annotations (spec §4.5, §5.10, §6.7, §6.2, §7), written from the spec. It does NOT import the
// core or the step handlers: it is a second implementation, so the implementation does not judge its
// own tests. It simulates the scenario (what is stored, where the person is, the panel and the undo
// notice) and returns what each Then step observes. Anything it does not recognize or cannot decide
// (for example two annotations at the same instant without ids) throws `Indeciso`: the result is
// undefined and the mutation is not filtered.
import { date, type RowOracle, type StepOracle } from './oracle';
import { noticeSees, dayHeading } from './oracle-history';

class Undecided extends Error {}
const undecided = (reason: string): never => {
	throw new Undecided(reason);
};

interface Task {
	/** As it was named when declared: that is how the steps refer to it. */
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
	/** The open edit panel: the task, if it was opened for editing. */
	panel?: { task?: Task };
	/** The notice for this device's last completion (§5.4). */
	notice?: { task: Task; at: number };
	next: number;
	last?: Annotation;
	/** The annotations the last Annotations query showed and the text of the last copy. */
	view?: string;
	copy?: string[];
}

const DIRECTIONS = ['Me sirvió', 'Me molestó'];
const SCREENS_CURRENT = ['Pendientes', 'Historial', 'Anotaciones'];
/** §4.5: «Etiquetas» is no longer a screen to annotate on; annotations stored with it keep it as an opaque value. */
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

/** §4.5: leading and trailing whitespace is trimmed; empty means no text. */
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

/** §5.10: the panel takes precedence over the undo notice; with the panel closed, the notice only if it is visible. */
function annotateMe(world: OracleWorld, direction: string, now: string, text = ''): void {
	const at = moment(now);
	if (world.screenName === undefined) undecided('sin pantalla');
	const task = world.panel ? world.panel.task : world.notice && noticeSees(world.notice.at, at) ? world.notice.task : undefined;
	fresh(world, directionOf(direction), world.panel ? 'Panel de edición' : (world.screenName as string), at, task, trimmed(text));
}

/** Another device, no panel; on a task only with its undo notice in view. */
function annotatesOther(world: OracleWorld, direction: string, screenName: string, now: string, title?: string): void {
	if (![...SCREENS_CURRENT, 'Etiquetas'].includes(screenName)) undecided(`pantalla ${screenName}`);
	fresh(world, directionOf(direction), screenName, moment(now), title === undefined ? undefined : theTask(world, title));
}

/** §7: deletion wins over editing; an edit of a deleted annotation does not revive it. */
function doEditText(world: OracleWorld, annotated: string, text: string): void {
	const annotation = theAnnotation(world, annotated);
	if (!annotation.deleted) annotation.text = trimmed(text);
}

function deleteAnnotation(world: OracleWorld, annotated: string): void {
	theAnnotation(world, annotated).deleted = true;
}

/** §6.2, §7: the task, its completions and its annotations are deleted, and only its own. */
function deleteTask(world: OracleWorld, name: string): void {
	const task = theTask(world, name);
	task.deleted = true;
	world.completions = world.completions.filter((completion) => completion.task !== task);
	for (const annotation of world.annotations) if (annotation.task === task) annotation.deleted = true;
}

const nameOf = ({ title, emoji }: Task) => (emoji ? `${emoji} ${title}` : title);

/** §6.7: those of an existing task or without a task; orphaned ones and those of deleted tasks are not shown. */
const visible = (world: OracleWorld) => world.annotations.filter((annotation) => !annotation.deleted && !annotation.task?.deleted);

/** §6.7: with the same instant, the lower id first; without ids to break the tie nothing is decided. */
function sorted(world: OracleWorld, moreRecentFirst: boolean): Annotation[] {
	const list = visible(world);
	const withoutTiebreak = list.some((a, i) => list.some((b, j) => i < j && a.at === b.at && (a.id.startsWith('~') || b.id.startsWith('~') || a.id === b.id)));
	if (withoutTiebreak) undecided('empate sin ids');
	return [...list].sort((a, b) => (moreRecentFirst ? b.at - a.at : a.at - b.at) || (a.id < b.id ? -1 : 1));
}

const parts = (annotation: Annotation, front: string) =>
	[front, annotation.direction, annotation.screenName, annotation.task && nameOf(annotation.task), annotation.text].filter((part) => part !== undefined).join(' · ');

/** §6.7: groups "<heading>: <annotations>" joined with "; ", annotations with ", ". */
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

/** §6.7: one line per annotation the screen shows, from oldest to most recent. */
const linesCopied = (world: OracleWorld) => sorted(world, false).map((annotation) => parts(annotation, dateAndHourOf(annotation.at)));

type Reader = [RegExp, (world: OracleWorld, ...captures: string[]) => void];

const DIRECTION = '(Me sirvió|Me molestó)';
const SCREEN = `(${SCREENS.join('|')})`;
const OTHER = 'another device, without seeing that change,';

const READERS: Reader[] = [
	[
		/^a one-off task (\S+) (?:without a|with) due date(?: (?:\d{4}-\d{2}-\d{2}))?(?: with emoji (\S+))?$/,
		(world, name, emoji) => void world.tasks.push({ name, title: name, emoji, deleted: false })
	],
	[/^I am on (\S+)$/, (world, screenName) => void (world.screenName = SCREENS_CURRENT.includes(screenName) ? screenName : undecided(screenName))],
	[/^the edit panel is open when editing the task (\S+)$/, (world, name) => void (world.panel = { task: theTask(world, name) })],
	[/^the edit panel is open when creating a task$/, (world) => void (world.panel = {})],
	[
		/^I complete the task (\S+) on (\S+)$/,
		(world, name, at) => {
			const task = theTask(world, name);
			world.completions.push({ task, at: moment(at) });
			world.notice = { task, at: moment(at) };
		}
	],
	[/^the task (\S+) was completed on (\S+)$/, (world, name, at) => void world.completions.push({ task: theTask(world, name), at: moment(at) })],
	[
		/^I edit the title to (\S+)$/,
		(world, title) => {
			const live = world.tasks.filter(({ deleted }) => !deleted);
			if (live.length !== 1) undecided('título de varias tareas');
			live[0].title = title;
		}
	],
	[new RegExp(`^I annotate ${DIRECTION} on (\\S+)$`), (world, direction, now) => annotateMe(world, direction, now)],
	[
		new RegExp(`^I annotate ${DIRECTION} on (\\S+) with the text (.+?) between (\\S+) spaces$`),
		(world, direction, now, text, n) => annotateMe(world, direction, now, `${spaces(n)}${text}${spaces(n)}`)
	],
	[new RegExp(`^I annotate ${DIRECTION} on (\\S+) with the text (.+)$`), (world, direction, now, text) => annotateMe(world, direction, now, text)],
	[new RegExp(`^I annotate ${DIRECTION} on (\\S+) with (\\S+) spaces as text$`), (world, direction, now, n) => annotateMe(world, direction, now, spaces(n))],
	[
		new RegExp(`^I annotate ${DIRECTION} on (\\S+) with a text of (\\S+) characters$`),
		(world, direction, now, length) => annotateMe(world, direction, now, 'a'.repeat(Number(length) >= 0 && Number(length) <= 100_000 ? Number(length) : undecided(length)))
	],
	[new RegExp(`^${OTHER} annotates ${DIRECTION} in ${SCREEN} on (\\S+)$`), (world, direction, screenName, now) => annotatesOther(world, direction, screenName, now)],
	[
		new RegExp(`^${OTHER} annotates ${DIRECTION} in ${SCREEN} on (\\S+) about the task (\\S+)$`),
		(world, direction, screenName, now, title) => annotatesOther(world, direction, screenName, now, title)
	],
	[
		new RegExp(`^an annotation ${DIRECTION} in ${SCREEN} from (\\S+)$`),
		(world, direction, screenName, annotated) => void fresh(world, direction, screenOf(screenName), moment(annotated))
	],
	[
		/^the annotation refers to the task (\S+)$/,
		(world, name) => void ((world.last ?? undecided('sin anotación')).task = theTask(world, name))
	],
	[/^the annotation says (.+)$/, (world, text) => void ((world.last ?? undecided('sin anotación')).text = trimmed(text))],
	[/^the annotation was recorded with id (\S+)$/, (world, id) => void ((world.last ?? undecided('sin anotación')).id = id)],
	[/^I query Anotaciones on (\S+)$/, (world, now) => void (world.view = annotationsScreen(world, moment(now)))],
	[/^I copy the annotations$/, (world) => void (world.copy = linesCopied(world))],
	[
		/^I edit the text of the annotation from (\S+) to (.+?) between (\S+) spaces$/,
		(world, annotated, text, n) => doEditText(world, annotated, `${spaces(n)}${text}${spaces(n)}`)
	],
	[/^I edit the text of the annotation from (\S+) to (\S+) spaces$/, (world, annotated, n) => doEditText(world, annotated, spaces(n))],
	[/^I edit the text of the annotation from (\S+) to (.+)$/, (world, annotated, text) => doEditText(world, annotated, text)],
	[new RegExp(`^${OTHER} edits the text of the annotation from (\\S+) to (.+)$`), (world, annotated, text) => doEditText(world, annotated, text)],
	[/^I delete the annotation from (\S+)$/, (world, annotated) => deleteAnnotation(world, annotated)],
	[new RegExp(`^${OTHER} deletes the annotation from (\\S+)$`), (world, annotated) => deleteAnnotation(world, annotated)],
	[/^I delete the task (\S+)$/, (world, name) => deleteTask(world, name)]
];

const saved = (world: OracleWorld) => world.annotations.filter(({ deleted }) => !deleted);
const withoutDefine = (text: string | undefined) => text ?? '<sin texto>';

/** Each Then: what the oracle observes and what the step asserts. */
type Observer = [RegExp, (world: OracleWorld, ...captures: string[]) => [observado: string, afirmado: string]];

const OBSERVERS: Observer[] = [
	[/^a single annotation remains$/, (world) => [String(saved(world).length), '1']],
	[/^(\S+) annotations remain$/, (world, n) => [String(saved(world).length), n]],
	[/^no annotation remains$/, (world) => [String(saved(world).length), '0']],
	[/^there is no annotation from (\S+)$/, (world, annotated) => [String(!theAnnotation(world, annotated).deleted), 'false']],
	[
		/^the annotation from (\S+) has direction (Me sirvió|Me molestó) in (.+)$/,
		(world, annotated, direction, screenName) => {
			const annotation = theAnnotation(world, annotated);
			return [`${annotation.direction}|${annotation.screenName}`, `${direction}|${screenName}`];
		}
	],
	[/^the annotation from (\S+) is of the task (\S+)$/, (world, annotated, name) => [theAnnotation(world, annotated).task?.name ?? '<sin tarea>', name]],
	[/^the annotation from (\S+) is of no task$/, (world, annotated) => [String(theAnnotation(world, annotated).task === undefined), 'true']],
	[/^the annotation from (\S+) says a text of (\S+) characters$/, (world, annotated, length) => [String(theAnnotation(world, annotated).text?.length), length]],
	[/^the annotation from (\S+) says (.+)$/, (world, annotated, text) => [withoutDefine(theAnnotation(world, annotated).text), text]],
	[/^the annotation from (\S+) has no text$/, (world, annotated) => [String(theAnnotation(world, annotated).text === undefined), 'true']],
	[/^the panel stays open without unsaved changes$/, (world) => [String(world.panel !== undefined && saved(world).length > 0), 'true']],
	[/^Anotaciones shows (.+)$/, (world, expected) => [world.view ?? undecided('sin consulta'), expected]],
	[/^Anotaciones is empty$/, (world) => [world.view ?? undecided('sin consulta'), '']],
	[/^the copied text has the lines (.+)$/, (world, lines) => [(world.copy ?? undecided('sin copia')).join('; '), lines]],
	[/^there is nothing to copy$/, (world) => [String((world.copy ?? undecided('sin copia')).length), '0']],
	[
		/^the orphan annotations to clean are only the one from (\S+)$/,
		(world, annotated) => [
			// §7: an annotation of a task that no longer exists, which nobody deleted along with it.
			world.annotations
				.filter((annotation) => !annotation.deleted && annotation.task?.deleted)
				.map(({ at }) => at)
				.join(','),
			String(moment(annotated))
		]
	],
	[/^there is no task (\S+)$/, (world, name) => [String(!theTask(world, name).deleted), 'false']],
	[/^no completion remains of (\S+)$/, (world, name) => [String(world.completions.filter(({ task }) => task === theTask(world, name)).length), '0']],
	[
		/^the task (\S+) keeps a single completion, from (\S+)$/,
		(world, name, completed) => [world.completions.filter(({ task }) => task === theTask(world, name)).map(({ at }) => at).join(','), String(moment(completed))]
	]
];

const SCENARIO_PATTERNS = [
	/^I annotate /,
	/^an annotation /,
	/^I query Anotaciones on /,
	/^I copy the annotations$/,
	/^I edit the text of the annotation /,
	/^I delete the annotation /,
	/ (?:annotates|edits the text of the annotation|deletes the annotation) /
];

export const isScenarioOfAnnotations = (texts: string[]) => texts.some((text) => SCENARIO_PATTERNS.some((pattern) => pattern.test(text)));

/** What each Then observes and what it asserts: undefined if the oracle does not recognize or cannot decide the scenario. */
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

// Cleanups and retries (spec §7), written from the spec. The four cleanups are attempted element by
// element: every element whose attempt does not fail is cleaned and only those that failed remain to be cleaned. They are
// retried when the connection returns and when the data changes; time does not count (no timers).

const CLEANUPS = ['completados huérfanos', 'anotaciones huérfanas'];
const EVENTS_THAT_RETRY = ['vuelve la conexión', 'cambian los datos'];

interface CleanupWorld {
	original: string[];
	fail: Set<string>;
	clean: Set<string>;
	pending: string[];
}

export const isScenarioOfCleanups = (texts: string[]) => texts.some((text) => /^(?:\S+ of \S+ are left to clean$|the app attempt(?:s|ed) the cleanups$)/.test(text));

/** List of ids separated by ", "; "ninguno" is the empty list. */
function idsOf(value: string): string[] {
	if (value === 'ninguno' || value === 'none') return [];
	const parts = value.split(', ');
	return parts.some((part) => part === '' || part !== part.trim()) ? undecided(`lista ${value}`) : parts;
}

function attemptCleanups(m: CleanupWorld): void {
	for (const id of m.pending) if (!m.fail.has(id)) m.clean.add(id);
	m.pending = m.pending.filter((id) => m.fail.has(id));
}

function cleanupStep(m: CleanupWorld, text: string): void {
	let c: RegExpExecArray | null;
	if ((c = /^(.+) of (.+) are left to clean$/.exec(text))) {
		if (!CLEANUPS.includes(c[2])) undecided(`limpieza ${c[2]}`);
		m.original = idsOf(c[1]);
		m.pending = [...m.original];
	} else if ((c = /^the attempt to clean fails: (.+)$/.exec(text))) {
		for (const id of idsOf(c[1])) m.fail.add(id);
	} else if ((c = /^the attempt to clean stops failing: (.+)$/.exec(text))) {
		for (const id of idsOf(c[1])) m.fail.delete(id);
	} else if (/^the app attempt(?:s|ed) the cleanups$/.test(text)) {
		attemptCleanups(m);
	} else if ((c = /^this happens: (.+)$/.exec(text))) {
		if (!EVENTS_THAT_RETRY.includes(c[1])) undecided(`suceso ${c[1]}`);
		attemptCleanups(m);
	} else if ((c = /^(.+) minutes pass with nothing else happening$/.exec(text))) {
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
			const c = /^the items left (clean|to clean) are (.+)$/.exec(text) ?? undecided(`then ${text}`);
			observed.push(list(c[1] === 'clean' ? m.original.filter((id) => m.clean.has(id)) : m.original.filter((id) => m.pending.includes(id))));
			asserted.push(list(idsOf(c[2])));
		}
		return { observed, asserted };
	} catch (error) {
		if (error instanceof Undecided) return undefined;
		throw error;
	}
}
