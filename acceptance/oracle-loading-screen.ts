// Oráculo de la pantalla de carga (spec §6.6), escrito desde el spec. NO importa el core
// ni los step handlers. En vez de recorrer la línea de tiempo, despeja el momento: la
// pantalla se va en el mayor entre el mínimo, Auth y lo esperado (con el tope encima de
// lo esperado, porque "la espera de Auth no entra en el tope"). Si no reconoce un paso o
// un valor, devuelve undefined (no se filtra).
import type { RowOracle, StepOracle } from './oracle';

/** §6.6: mínimo de 0,5 s en todos los casos. */
const MINIMUM = 0.5;
/** §6.6: tope de 10 s para los datos y las fuentes, desde el arranque. */
const CAP = 10;
/** El feature escribe 30 segundos para algo que no llega. */
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
 * Hasta cuándo se espera una fuente. §6.6: una que falló se deja de esperar en ese momento; sin conexión
 * no se espera nada que solo pueda venir por red, y perder la conexión cuenta igual; una guardada llega
 * desde el dispositivo también sin conexión.
 */
function waitEnd(font: Font, a: Opening): number {
	const toFailure = Math.min(arrivesOf(font), font.failure ?? Infinity);
	if (!a.withoutConnection) return Math.min(toFailure, a.loses);
	return font.arrives === undefined || font.withoutSave ? 0 : toFailure;
}

/** §6.6: una versión nueva que cambia el juego lo trata como no guardado y vuelve a esperarlo una vez. */
const rememberedOnOpen = (a: Opening) => Boolean(a.remembered) && !a.versionChange;

/** §6.6: con sesión espera datos y las dos fuentes, salvo Noto tras un tope; sin sesión, solo Atkinson. */
function waits(a: Opening): number[] {
	const atkinson = waitEnd(a.atkinson, a);
	if (!a.session) return [atkinson];
	const noto = rememberedOnOpen(a) ? [] : [waitEnd(a.noto, a)];
	return [...(a.data.length > 0 ? a.data : [Infinity]), atkinson, ...noto];
}

/** §6.6: el mínimo vale siempre; el tope corta lo esperado pero no la espera de Auth. */
const outputOf = (a: Opening) => Math.max(MINIMUM, a.auth ?? Infinity, Math.min(CAP, Math.max(...waits(a))));

/**
 * §6.6: cuenta un tope con Noto sin bajar en una apertura que lo esperaba (con sesión, y sin haberlo dejado de
 * esperar antes del tope); lo recordado se olvida cuando Noto queda guardado.
 */
function remembers(a: Opening): boolean {
	const capNew = Boolean(a.session) && waitEnd(a.noto, a) > CAP;
	return (rememberedOnOpen(a) || capNew) && arrivesOf(a.noto) === Infinity;
}

const OUTPUT_THEN = /^la pantalla de carga se va a los (.+) segundos$/;
const MEMORY_THEN = /^el dispositivo (no )?recuerda un tope con Noto sin bajar$/;

export const isScenarioOfScreenOfLoading = (texts: string[]) => texts.some((text) => OUTPUT_THEN.test(text) || MEMORY_THEN.test(text));

/** Lo que observa y lo que afirma cada Then: undefined si el oráculo no reconoce el escenario. */
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
