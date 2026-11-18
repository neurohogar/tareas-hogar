// Oracle for the loading screen (spec §6.6), written from the spec. It does NOT import the core
// or the step handlers. Instead of walking the timeline, it solves for the moment: the
// screen leaves at the max of the minimum, Auth and what is awaited (with the cap on top of
// what is awaited, because "the Auth wait does not count toward the cap"). If it does not recognize a step or
// a value, it returns undefined (not filtered).
import type { RowOracle, StepOracle } from './oracle';

/** §6.6: minimum of 0.5 s in all cases. */
const MINIMUM = 0.5;
/** §6.6: cap of 10 s for the data and the fonts, from startup. */
const CAP = 10;
/** The feature writes 30 seconds for something that never arrives. */
const DOES_NOT_ARRIVE = 30;

interface Font {
	arrives?: number;
	failure?: number;
	withoutSave?: boolean;
}

interface Opening {
	session?: boolean;
	withoutConnection?: boolean;
	loses: number;
	auth?: number;
	data: number[];
	atkinson: Font;
	noto: Font;
	remembered?: boolean;
	versionChange?: boolean;
}

const withValues = (text: string, row: RowOracle) => text.replace(/<([A-Za-z0-9_]+)>/g, (_, column: string) => row[column] ?? '<?>');

function numeric(value: string): number {
	const n = Number(value);
	if (value.trim() === '' || !Number.isFinite(n)) throw new RangeError(value);
	return n;
}

const fontOf = (a: Opening, name: string) => (name === 'Atkinson' ? a.atkinson : a.noto);

const READERS: [RegExp, (a: Opening, ...captures: string[]) => void][] = [
	[/^la app arranca (con|sin) sesión$/, (a, session) => void (a.session = session === 'con')],
	[/^no hay conexión$/, (a) => void (a.withoutConnection = true)],
	[/^se pierde la conexión a los (.+) segundos$/, (a, s) => void (a.loses = numeric(s))],
	[/^Auth responde enseguida$/, (a) => void (a.auth = 0)],
	[/^Auth responde a los (.+) segundos$/, (a, s) => void (a.auth = numeric(s))],
	[/^(?:las tareas|los completados) responden a los (.+) segundos$/, (a, s) => void a.data.push(numeric(s))],
	[/^los datos responden a los (.+) segundos$/, (a, s) => void a.data.push(numeric(s))],
	[/^(Atkinson|Noto) queda list[ao] a los (.+) segundos$/, (a, name, s) => void (fontOf(a, name).arrives = numeric(s))],
	[/^(Atkinson|Noto) falla a los (.+) segundos$/, (a, name, s) => void (fontOf(a, name).failure = numeric(s))],
	[/^el navegador no puede dibujar Noto a los (.+) segundos$/, (a, s) => void (a.noto.failure = numeric(s))],
	[/^(Atkinson|Noto) no está guardad[ao]$/, (a, name) => void (fontOf(a, name).withoutSave = true)],
	[/^el dispositivo ya recordaba un tope con Noto sin bajar$/, (a) => void (a.remembered = true)],
	[/^una versión nueva (no )?cambió el juego de emoji$/, (a, no) => void (a.versionChange = no === undefined)]
];

function readOpening(entries: StepOracle[], row: RowOracle): Opening | undefined {
	const opening: Opening = { loses: Infinity, data: [], atkinson: {}, noto: {} };
	for (const step of entries) {
		const text = withValues(step.text, row);
		const reader = READERS.find(([pattern]) => pattern.test(text));
		if (!reader) return undefined;
		try {
			reader[1](opening, ...(reader[0].exec(text) as RegExpExecArray).slice(1));
		} catch (error) {
			if (error instanceof RangeError) return undefined;
			throw error;
		}
	}
	return opening.session === undefined || opening.auth === undefined ? undefined : opening;
}

const arrivesOf = (font: Font) => (font.arrives === undefined || font.arrives >= DOES_NOT_ARRIVE ? Infinity : font.arrives);

/**
 * Until when a font is awaited. §6.6: one that failed stops being awaited at that moment; offline
 * nothing that can only come over the network is awaited, and losing the connection counts the same; a stored one arrives
 * from the device even offline.
 */
function waitEnd(font: Font, a: Opening): number {
	const toFailure = Math.min(arrivesOf(font), font.failure ?? Infinity);
	if (!a.withoutConnection) return Math.min(toFailure, a.loses);
	return font.arrives === undefined || font.withoutSave ? 0 : toFailure;
}

/** §6.6: a new version that changes the font set treats it as not stored and waits for it again once. */
const rememberedOnOpen = (a: Opening) => Boolean(a.remembered) && !a.versionChange;

/** §6.6: with a session it awaits the data and both fonts, except Noto after a cap; without a session, only Atkinson. */
function waits(a: Opening): number[] {
	const atkinson = waitEnd(a.atkinson, a);
	if (!a.session) return [atkinson];
	const noto = rememberedOnOpen(a) ? [] : [waitEnd(a.noto, a)];
	return [...(a.data.length > 0 ? a.data : [Infinity]), atkinson, ...noto];
}

/** §6.6: the minimum always applies; the cap cuts what is awaited but not the Auth wait. */
const outputOf = (a: Opening) => Math.max(MINIMUM, a.auth ?? Infinity, Math.min(CAP, Math.max(...waits(a))));

/**
 * §6.6: counts a cap with Noto not downloaded on an opening that awaited it (with a session, and without having stopped
 * awaiting it before the cap); what is remembered is forgotten once Noto is stored.
 */
function remembers(a: Opening): boolean {
	const capNew = Boolean(a.session) && waitEnd(a.noto, a) > CAP;
	return (rememberedOnOpen(a) || capNew) && arrivesOf(a.noto) === Infinity;
}

const OUTPUT_THEN = /^la pantalla de carga se va a los (.+) segundos$/;
const MEMORY_THEN = /^el dispositivo (no )?recuerda un tope con Noto sin bajar$/;

export const isScenarioOfScreenOfLoading = (texts: string[]) => texts.some((text) => OUTPUT_THEN.test(text) || MEMORY_THEN.test(text));

/** What each Then observes and what it asserts: undefined if the oracle does not recognize the scenario. */
export function observeScreenOfLoading(entries: StepOracle[], thens: StepOracle[], row: RowOracle): { observed: string[]; asserted: string[] } | undefined {
	const opening = readOpening(entries, row);
	if (!opening) return undefined;
	const observed: string[] = [];
	const asserted: string[] = [];
	for (const step of thens) {
		const text = withValues(step.text, row);
		const goes = OUTPUT_THEN.exec(text);
		const memory = MEMORY_THEN.exec(text);
		if (goes) {
			observed.push(String(outputOf(opening)));
			asserted.push(String(Number(goes[1])));
		} else if (memory) {
			observed.push(String(remembers(opening)));
			asserted.push(String(memory[1] === undefined));
		} else {
			return undefined;
		}
	}
	return { observed, asserted };
}
