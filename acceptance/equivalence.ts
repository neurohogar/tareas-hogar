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
import { classifyRow, elements, isChronologyImpossible, isScenarioOfFont, observeFont, pendingOrder, type RowOracle, type StepOracle, type PendingView } from './oracle';
import { isScenarioOfChanges, isScenarioOfPanel, observeChanges, observePanel } from './oracle-panel';
import { isScenarioOfAnnotations, isScenarioOfCleanups, observeAnnotations, observeCleanups } from './oracle-annotations';
import { isScenarioOfEditing, observeEditing } from './oracle-editing';
import { isScenarioOfTextOfDate, observeTextOfDate } from './oracle-date-text';
import { isScenarioOfScreenOfLoading, observeScreenOfLoading } from './oracle-loading-screen';

/** Then steps that only observe the rule's classification. */
const CLASSIFICATION_THEN = [
	/^el estado es (pendiente|en espera|atrasada)$/,
	/^el estado es <[A-Za-z0-9_]+>$/,
	/^la creación se rechaza por (título vacío|intervalo inválido|falta de días|día del mes inválido|semanal y mensual combinados|fecha límite inválida|emoji inválido|horario incompleto|horarios superpuestos|varios horarios en una relativa en horas)$/,
	/^la creación se rechaza porque la hora de fin no es posterior a la de inicio$/,
	/^no se crea ninguna tarea$/,
	/^se crea una tarea puntual$/,
	/^la tarea no aparece en Pendientes$/,
	/^la tarea aparece en Pendientes$/,
	/^la tarea (no )?está completada$/,
	// §5.8 and §6.2: the pause and the panel's pause button.
	/^la tarea (no )?está pausada$/,
	/^la tarea no tiene estado$/,
	/^el panel de edición ofrece <[A-Za-z0-9_]+>$/,
	/^el panel de edición no ofrece pausar$/,
	// §5.9 and §6.2: the stored postponement, and the panel's postpone button and text.
	/^la tarea está pospuesta desde <[A-Za-z0-9_]+> hasta <[A-Za-z0-9_]+>$/,
	/^la tarea no está pospuesta$/,
	/^el botón de posponer del panel es <[A-Za-z0-9_]+>$/,
	/^el panel de edición muestra <[A-Za-z0-9_]+>$/,
	/^el panel de edición no dice que está pospuesta$/,
	/^el checkbox de la tarea está (habilitado|deshabilitado)$/,
	/^se registró un completado que cubre el <[A-Za-z0-9_]+>$/,
	// Structural invariants that do not depend on the moments: the new completion is appended
	// at the end with its own id, and with no covered occurrence in the relative ones.
	/^el nuevo completado se agrega sin modificar los anteriores$/,
	/^se registró un completado sin ocurrencia cubierta$/,
	/^el progreso es <[A-Za-z0-9_]+>$/
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
	[/^Pendientes no muestra ninguna tarea$/, 'order'],
	[/^Pendientes muestra en orden <([A-Za-z0-9_]+)>$/, 'order'],
	[/^Pendientes muestra como completadas <([A-Za-z0-9_]+)>$/, 'completedList'],
	[/^Pendientes muestra como pausadas <([A-Za-z0-9_]+)>$/, 'paused']
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
const THEN_THAT_VERIFIES_THAT_NAMES = /^la tarea (?:\S+ )?conserva un solo completado, del <[A-Za-z0-9_]+>$/;

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
 * Scenario for annotations (§4.5, §5.10, §6.7), the tabbed panel (§6.2), which font draws each character (§6) or the loading screen (§6.6): a mutation
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
 * Scenario for annotations (§4.5, §5.10, §6.7) or unsaved changes, their notices or Back (§6.2, §7): a mutation is equivalent when the oracle
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

export function esEquivalente(feature: Feature, candidate: Candidate): boolean {
	const scenario = feature.scenarios[candidate.scenario];
	if (isScenarioOfCleanups(stepsOf(feature, scenario).map(({ step }) => step.text))) {
		return isEquivalentWhetherStaysFulfilling(observeCleanups, feature, scenario, candidate);
	}
	if (isScenarioOfAnnotations(stepsOf(feature, scenario).map(({ step }) => step.text))) {
		return isEquivalentWhetherStaysFulfilling(observeAnnotations, feature, scenario, candidate);
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
	const progress = observesInThen(/^el progreso es /);
	const status = observesInThen(/^el estado es |^la tarea (no )?está completada$|^la tarea no tiene estado$/);
	const appearance = observesInThen(/^la tarea (no )?aparece en Pendientes$/);
	const checkbox = observesInThen(/^el checkbox de la tarea está /);
	const covered = observesInThen(/^se registró un completado que cubre /);
	const postponed = observesInThen(/^la tarea está pospuesta desde /);
	const panelText = observesInThen(/^el panel de edición (?:muestra|no dice que está pospuesta)/);
	const observes = { progress, checkbox, covered, postponed, panelText, onlyAppearance: !status && !progress, onlyCheckbox: checkbox && !status && !progress && !appearance };
	const before = classifyRow(entries, original, observes);
	return before !== undefined && before === classifyRow(entries, mutated, observes);
}
