import { type RowOracle, type StepOracle } from './oracle';

class Undecided extends Error {}
const undecided = (reason: string): never => {
	throw new Undecided(reason);
};

const withValues = (text: string, row: RowOracle) => text.replace(/<([A-Za-z0-9_]+)>/g, (_, column: string) => row[column] ?? '<?>');

// Cleanups and retries (spec §7), written from the spec. The cleanup (orphan completions) is attempted element by
// element: every element whose attempt does not fail is cleaned and only those that failed remain to be cleaned. They are
// retried when the connection returns and when the data changes; time does not count (no timers).

const EVENTS_THAT_RETRY = ['vuelve la conexión', 'cambian los datos'];

interface CleanupWorld {
	original: string[];
	fail: Set<string>;
	clean: Set<string>;
	pending: string[];
}

export const isScenarioOfCleanups = (texts: string[]) => texts.some((text) => /^(?:\S+ of orphan completions are left to clean$|the app attempt(?:s|ed) the cleanups$)/.test(text));

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
	if ((c = /^(.+) of orphan completions are left to clean$/.exec(text))) {
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
