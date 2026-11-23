// Project filter for equivalent mutations (mutator-spec.md,
// "Equivalent Mutation Filters"). Deterministic.
//
// The oracle (oracle.ts) classifies with the spec rules, never with the core.
//
// Criterion: a cell mutation is equivalent when the scenario only
// verifies which side of the rule the row falls on (classification: state kind,
// or rejection/creation) and the mutated value falls on the same side as the original
// according to the oracle.
// In that case the tests cannot tell them apart: they would pass either way.
// If any Then step verifies something else (values, progress, the recorded
// completion), the mutation is never filtered.
import type { Feature, Scenario } from './ir';
import { build, classifyRow, elements, isChronologyImpossible, isScenarioOfFont, observeFont, pendingOrder, type RowOracle, type StepOracle, type PendingView } from './oracle';
import { isScenarioOfChanges, isScenarioOfPanel, observeChanges, observePanel } from './oracle-panel';
import { isScenarioOfCleanups, observeCleanups } from './oracle-cleanups';
import { isScenarioOfEditing, observeEditing } from './oracle-editing';
import { isScenarioOfTextOfDate, observeTextOfDate } from './oracle-date-text';
import { isScenarioOfScreenOfLoading, observeScreenOfLoading } from './oracle-loading-screen';

/** Then steps that only observe the rule's classification. */
const CLASSIFICATION_THEN = [
	/^the status is (pendiente|en espera|atrasada)$/,
	/^the status is <[A-Za-z0-9_]+>$/,
	/^creation is rejected for (empty title|invalid interval|missing days|invalid month day|weekly and monthly combined|invalid due date|invalid emoji|incomplete schedule|overlapping schedules|several schedules in an hourly relative)$/,
	/^creation is rejected because the end time is not after the start time$/,
	/^no task is created$/,
	/^a one-off task is created$/,
	/^the task does not appear in Pendientes$/,
	/^the task appears in Pendientes$/,
	/^the task is (?:not )?completed$/,
	// §5.8 and §6.2: the pause and the panel's pause button.
	/^the task is (?:not )?paused$/,
	/^the task has no status$/,
	// §5.8: the pause by the minimal mode and the stored resume moment.
	/^the task is (?:not )?paused by the minimal mode$/,
	/^the task was resumed at that moment$/,
	/^the task has no resume moment$/,
	// §5.11 and §6.1: the item of the block rescheduling.
	/^the Reprogramar vencidas item is (?:enabled|disabled|<[A-Za-z0-9_]+>)$/,
	/^the edit panel offers <[A-Za-z0-9_]+>$/,
	/^the edit panel does not offer pause$/,
	// §6.2 (Minimal mode in the panel): what the panel says about the pause and its buttons.
	/^the edit panel says (?:<[A-Za-z0-9_]+>|no pause text)$/,
	/^the edit panel offers (?:Reanudar|Pausar|Borrar tarea)$/,
	// §5.9 and §6.2: the stored postponement, and the panel's postpone button and text.
	/^the task is postponed from <[A-Za-z0-9_]+> to <[A-Za-z0-9_]+>$/,
	/^the task is not postponed$/,
	/^the postpone button of the panel is <[A-Za-z0-9_]+>$/,
	/^the edit panel shows <[A-Za-z0-9_]+>$/,
	/^the edit panel does not say it is postponed$/,
	/^the task checkbox is (enabled|disabled)$/,
	/^a completion was recorded that covers <[A-Za-z0-9_]+>$/,
	// Structural invariants that do not depend on the moments: the new completion is appended
	// at the end with its own id, and with no covered occurrence in the relative ones.
	/^the new completion is added without changing the previous ones$/,
	/^a completion without a covered occurrence was recorded$/,
	/^the progress is <[A-Za-z0-9_]+>$/
];

const isThen = (keyword: string, previous: boolean) => keyword === 'Then' || (keyword === 'And' && previous);

function stepsOf(feature: Feature, scenario: Scenario) {
	const all = [...(feature.background ?? []), ...scenario.steps];
	let inThen = false;
	return all.map((step) => {
		inThen = isThen(step.keyword, inThen);
		return { step, inThen };
	});
}

function onlyObservesClassification(feature: Feature, scenario: Scenario): boolean {
	return stepsOf(feature, scenario)
		.filter(({ inThen }) => inThen)
		.every(({ step }) => CLASSIFICATION_THEN.some((pattern) => pattern.test(step.text)));
}

export interface Candidate {
	scenario: number;
	example: number;
	key: string;
	mutated: string;
}

/** A column that a Then names is an expected value: mutating it changes what is asserted. */
function namesThen(feature: Feature, scenario: Scenario, column: string): boolean {
	return stepsOf(feature, scenario).some(({ step, inThen }) => inThen && step.text.includes(`<${column}>`));
}

/** The Pending Thens (§6.1) and the part of the view each one asserts. */
const PENDING_THENS: [RegExp, keyof PendingView][] = [
	[/^Pendientes shows no task$/, 'order'],
	[/^Pendientes shows in order <([A-Za-z0-9_]+)>$/, 'order'],
	[/^Pendientes shows as completed <([A-Za-z0-9_]+)>$/, 'completedList'],
	[/^Pendientes shows as paused <([A-Za-z0-9_]+)>$/, 'paused'],
	[/^the Modo mínimo line is <([A-Za-z0-9_]+)>$/, 'line']
];

function pendingThen(text: string): { column?: string; part: keyof PendingView } | undefined {
	for (const [pattern, part] of PENDING_THENS) {
		const matches = pattern.exec(text);
		if (matches) return { column: matches[1], part };
	}
	return undefined;
}

/** The cell's title list, as the oracle builds it; undefined if the cell is not a list. */
const asList = (value: string | undefined) => (value === undefined ? undefined : elements(value)?.join(', '));

/**
 * Scenario whose Thens are only what Pending shows (§6.1): a mutation is equivalent when the view
 * the oracle deduces from the spec is the same with the mutated value, and matches what the row asserts.
 */
function isEquivalentOfOrder(feature: Feature, scenario: Scenario, candidate: Candidate): boolean | undefined {
	const steps = stepsOf(feature, scenario);
	const thens = steps.filter(({ inThen }) => inThen).map(({ step }) => pendingThen(step.text));
	if (thens.length === 0 || thens.some((then) => then === undefined)) return undefined;
	if (thens.some((then) => then?.column === candidate.key)) return false;
	const original = scenario.examples[candidate.example];
	const entries = steps.filter(({ inThen }) => !inThen).map(({ step }) => step);
	const expected = pendingOrder(entries, original);
	if (expected === undefined || thens.some((then) => then && expected[then.part] !== (then.column === undefined ? '' : asList(original[then.column])))) return false;
	return JSON.stringify(pendingOrder(entries, { ...original, [candidate.key]: candidate.mutated })) === JSON.stringify(expected);
}

/** Thens that the editing oracle verifies against the value they name: if that value changes, what is observed changes. */
const THEN_THAT_VERIFIES_THAT_NAMES = /^the task (?:\S+ )?keeps a single completion, from <[A-Za-z0-9_]+>$/;

/**
 * A column that is only named by verified Thens and that an input step also gives arrives mutated on both sides:
 * the oracle compares the Then's value with the input's, so if they still match, nothing changes.
 */
function nameOnlyThenVerifiedAndEntry(steps: ReturnType<typeof stepsOf>, column: string): boolean {
	const name = steps.filter(({ step }) => step.text.includes(`<${column}>`));
	return name.some(({ inThen }) => !inThen) && name.filter(({ inThen }) => inThen).every(({ step }) => THEN_THAT_VERIFIES_THAT_NAMES.test(step.text));
}

/**
 * Scenario that edits, deletes or concurrently modifies a task (§6.2, §7): a mutation is equivalent
 * when no Then names the column and the editing oracle deduces, with the mutated value, the same as
 * each Then observes with the original value.
 */
function isEquivalentOfEditing(feature: Feature, scenario: Scenario, candidate: Candidate): boolean {
	const steps = stepsOf(feature, scenario);
	if (namesThen(feature, scenario, candidate.key) && !nameOnlyThenVerifiedAndEntry(steps, candidate.key)) return false;
	const entries = steps.filter(({ inThen }) => !inThen).map(({ step }) => step);
	const thens = steps.filter(({ inThen }) => inThen).map(({ step }) => step);
	const original = scenario.examples[candidate.example];
	const before = observeEditing(entries, thens, original);
	const after = observeEditing(entries, thens, { ...original, [candidate.key]: candidate.mutated });
	return before !== undefined && JSON.stringify(before) === JSON.stringify(after);
}

type Observer = (entries: StepOracle[], thens: StepOracle[], row: RowOracle) => { observed: string[]; asserted: string[] } | undefined;

/**
 * Scenario for the tabbed panel (§6.2), which font draws each character (§6) or the loading screen (§6.6): a mutation
 * is equivalent when no Then names the column, the oracle reproduces what the scenario asserts with the
 * original row (online audit) and, with the mutated value, deduces the same as each Then observes.
 */
function isEquivalentPer(observe: Observer, feature: Feature, scenario: Scenario, candidate: Candidate): boolean {
	if (namesThen(feature, scenario, candidate.key)) return false;
	const steps = stepsOf(feature, scenario);
	const entries = steps.filter(({ inThen }) => !inThen).map(({ step }) => step);
	const thens = steps.filter(({ inThen }) => inThen).map(({ step }) => step);
	const original = scenario.examples[candidate.example];
	const before = observe(entries, thens, original);
	const after = observe(entries, thens, { ...original, [candidate.key]: candidate.mutated });
	if (!before || !after || JSON.stringify(before.observed) !== JSON.stringify(before.asserted)) return false;
	return JSON.stringify(before.observed) === JSON.stringify(after.observed);
}

/**
 * Scenario for cleanups (§7) or unsaved changes, their notices or Back (§6.2, §7): a mutation is equivalent when the oracle
 * reproduces what the scenario asserts with the original row and also with the mutated value. A column that a Then
 * names and an input step also gives arrives mutated on both sides: what is typed and a Then repeats, or the name
 * of a task that another device deleted (§7, deletion wins), decide nothing. If only the Then names it, what it
 * asserts stops matching what is observed and it is not filtered. The cleanup ids (§7) are opaque identifiers:
 * renaming one consistently in the given and in the Then that repeats it does not change what is observed.
 */
function isEquivalentWhetherStaysFulfilling(observe: Observer, feature: Feature, scenario: Scenario, candidate: Candidate): boolean {
	const steps = stepsOf(feature, scenario);
	const entries = steps.filter(({ inThen }) => !inThen).map(({ step }) => step);
	const thens = steps.filter(({ inThen }) => inThen).map(({ step }) => step);
	const original = scenario.examples[candidate.example];
	const plays = (row: RowOracle) => {
		const observation = observe(entries, thens, row);
		return observation !== undefined && JSON.stringify(observation.observed) === JSON.stringify(observation.asserted);
	};
	return plays(original) && plays({ ...original, [candidate.key]: candidate.mutated });
}

/** §4.1: the stored essential mark does not depend on the dates of the scenario. */
const STORED_MARK = /^the stored essential mark is (?:true|absent|<[A-Za-z0-9_]+>)$/;

/**
 * A scenario whose only Then is the stored essential mark: a mutation is equivalent when the oracle still builds the
 * situation (the steps stay possible) and no Then names the column; the mark is independent of the dates.
 */
function isEquivalentOfMark(feature: Feature, scenario: Scenario, candidate: Candidate): boolean | undefined {
	const steps = stepsOf(feature, scenario);
	if (!steps.some(({ inThen }) => inThen) || !steps.every(({ step, inThen }) => !inThen || STORED_MARK.test(step.text))) return undefined;
	if (namesThen(feature, scenario, candidate.key)) return false;
	const entries = steps.filter(({ inThen }) => !inThen).map(({ step }) => step);
	const original = scenario.examples[candidate.example];
	return build(entries, original) !== undefined && build(entries, { ...original, [candidate.key]: candidate.mutated }) !== undefined;
}

export function isEquivalent(feature: Feature, candidate: Candidate): boolean {
	const scenario = feature.scenarios[candidate.scenario];
	if (isScenarioOfCleanups(stepsOf(feature, scenario).map(({ step }) => step.text))) {
		return isEquivalentWhetherStaysFulfilling(observeCleanups, feature, scenario, candidate);
	}
	if (isScenarioOfFont(stepsOf(feature, scenario).map(({ step }) => step.text))) {
		return isEquivalentPer(observeFont, feature, scenario, candidate);
	}
	if (isScenarioOfScreenOfLoading(stepsOf(feature, scenario).map(({ step }) => step.text))) {
		return isEquivalentPer(observeScreenOfLoading, feature, scenario, candidate);
	}
	if (isScenarioOfTextOfDate(stepsOf(feature, scenario).map(({ step }) => step.text))) {
		return isEquivalentPer(observeTextOfDate, feature, scenario, candidate);
	}
	if (isScenarioOfChanges(stepsOf(feature, scenario).map(({ step }) => step.text))) {
		return isEquivalentWhetherStaysFulfilling(observeChanges, feature, scenario, candidate);
	}
	if (isScenarioOfPanel(stepsOf(feature, scenario).map(({ step }) => step.text))) {
		return isEquivalentPer(observePanel, feature, scenario, candidate);
	}
	if (isScenarioOfEditing(stepsOf(feature, scenario).map(({ step }) => step.text))) {
		return isEquivalentOfEditing(feature, scenario, candidate);
	}
	const ofMark = isEquivalentOfMark(feature, scenario, candidate);
	if (ofMark !== undefined) return ofMark;
	const ofOrder = isEquivalentOfOrder(feature, scenario, candidate);
	if (ofOrder !== undefined) return ofOrder;
	if (!onlyObservesClassification(feature, scenario) || namesThen(feature, scenario, candidate.key)) return false;
	const original = scenario.examples[candidate.example];
	const mutated = { ...original, [candidate.key]: candidate.mutated };
	const entries = stepsOf(feature, scenario)
		.filter(({ inThen }) => !inThen)
		.map(({ step }) => step);
	// §5.8: a row that completes after resuming with an earlier moment is not a possible scenario.
	if (!isChronologyImpossible(entries, original) && isChronologyImpossible(entries, mutated)) return true;
	const observesInThen = (pattern: RegExp) => stepsOf(feature, scenario).some(({ step, inThen }) => inThen && pattern.test(step.text));
	const progress = observesInThen(/^the progress is /);
	const status = observesInThen(/^the status is |^the task is (?:not )?completed$|^the task has no status$/);
	const appearance = observesInThen(/^the task (?:appears|does not appear) in Pendientes$/);
	const checkbox = observesInThen(/^the task checkbox is /);
	const covered = observesInThen(/^a completion was recorded that covers /);
	const postponed = observesInThen(/^the task is postponed from /);
	const panelText = observesInThen(/^the edit panel (?:shows|does not say it is postponed)/);
	const byMode = observesInThen(/^the task is (?:not )?paused by the minimal mode$/);
	const pausePanel = observesInThen(/^the edit panel says /);
	const resumeStored = observesInThen(/^the task (?:was resumed at that moment|has no resume moment)$/);
	const item = observesInThen(/^the Reprogramar vencidas item is /);
	const observes = { pausePanel, resumeStored, item, byMode, progress, checkbox, covered, postponed, panelText, onlyAppearance: !status && !progress, onlyCheckbox: checkbox && !status && !progress && !appearance };
	const before = classifyRow(entries, original, observes);
	return before !== undefined && before === classifyRow(entries, mutated, observes);
}
