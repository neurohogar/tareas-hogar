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
	/** When the first response of the state of the minimal mode arrives (§6.6); without a step, at once. */
	mode: number;
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
	[/^the app starts (with|without) a session$/, (a, session) => void (a.session = session === 'with')],
	[/^there is no connection$/, (a) => void (a.withoutConnection = true)],
	[/^the connection is lost at (.+) seconds$/, (a, s) => void (a.loses = numeric(s))],
	[/^Auth responds immediately$/, (a) => void (a.auth = 0)],
	[/^Auth responds at (.+) seconds$/, (a, s) => void (a.auth = numeric(s))],
	[/^the (?:tasks|completions) respond at (.+) seconds$/, (a, s) => void a.data.push(numeric(s))],
	[/^the minimal mode responds at (.+) seconds$/, (a, s) => void (a.mode = numeric(s))],
	[/^the data responds at (.+) seconds$/, (a, s) => void a.data.push(numeric(s))],
	[/^(Atkinson|Noto) is ready at (.+) seconds$/, (a, name, s) => void (fontOf(a, name).arrives = numeric(s))],
	[/^(Atkinson|Noto) fails at (.+) seconds$/, (a, name, s) => void (fontOf(a, name).failure = numeric(s))],
	[/^the browser cannot draw Noto at (.+) seconds$/, (a, s) => void (a.noto.failure = numeric(s))],
	[/^(Atkinson|Noto) is not saved$/, (a, name) => void (fontOf(a, name).withoutSave = true)],
	[/^the device already remembered a cap with Noto not downloaded$/, (a) => void (a.remembered = true)],
	[/^a new version (changed|did not change) the emoji set$/, (a, change) => void (a.versionChange = change === 'changed')]
];

function readOpening(entries: StepOracle[], row: RowOracle): Opening | undefined {
	const opening: Opening = { loses: Infinity, data: [], mode: 0, atkinson: {}, noto: {} };
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

/** §6.6: with a session it awaits the data, the minimal mode (§7) and both fonts, except Noto after a cap; without a session, only Atkinson. */
function waits(a: Opening): number[] {
	const atkinson = waitEnd(a.atkinson, a);
	if (!a.session) return [atkinson];
	const noto = rememberedOnOpen(a) ? [] : [waitEnd(a.noto, a)];
	return [...(a.data.length > 0 ? a.data : [Infinity]), a.mode, atkinson, ...noto];
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

const OUTPUT_THEN = /^the loading screen goes away at (.+) seconds$/;
const MEMORY_THEN = /^the device (does not remember|remembers) a cap with Noto not downloaded$/;

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
			asserted.push(String(memory[1] === 'remembers'));
		} else {
			return undefined;
		}
	}
	return { observed, asserted };
}
