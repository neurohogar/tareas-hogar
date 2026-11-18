// Filtro de mutaciones equivalentes del proyecto (mutator-spec.md,
// "Equivalent Mutation Filters"). Determinista.
//
// El oráculo (oracle.ts) clasifica con las reglas del spec, nunca con el core.
//
// Criterio: una mutación de una celda es equivalente cuando el escenario solo
// verifica de qué lado de la regla cae la fila (clasificación: tipo de estado,
// o rechazo/creación) y el valor mutado cae del mismo lado que el original
// según el oráculo.
// En ese caso los tests no pueden distinguirla: pasarían igual.
// Si algún paso Then verifica otra cosa (valores, progreso, el completado
// registrado), la mutación nunca se filtra.
import type { Feature, Scenario } from './ir';
import { classifyRow, elements, isChronologyImpossible, isScenarioOfFont, observeFont, pendingOrder, type RowOracle, type StepOracle, type PendingView } from './oracle';
import { isScenarioOfChanges, isScenarioOfPanel, observeChanges, observePanel } from './oracle-panel';
import { isScenarioOfAnnotations, isScenarioOfCleanups, observeAnnotations, observeCleanups } from './oracle-annotations';
import { isScenarioOfEditing, observeEditing } from './oracle-editing';
import { isScenarioOfTextOfDate, observeTextOfDate } from './oracle-date-text';
import { isScenarioOfScreenOfLoading, observeScreenOfLoading } from './oracle-loading-screen';

/** Pasos Then que solo observan la clasificación de la regla. */
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
	// §5.8 y §6.2: la pausa y el botón de pausa del panel.
	/^la tarea (no )?está pausada$/,
	/^la tarea no tiene estado$/,
	/^el panel de edición ofrece <[A-Za-z0-9_]+>$/,
	/^el panel de edición no ofrece pausar$/,
	// §5.9 y §6.2: la posposición guardada, y el botón y el texto de posponer del panel.
	/^la tarea está pospuesta desde <[A-Za-z0-9_]+> hasta <[A-Za-z0-9_]+>$/,
	/^la tarea no está pospuesta$/,
	/^el botón de posponer del panel es <[A-Za-z0-9_]+>$/,
	/^el panel de edición muestra <[A-Za-z0-9_]+>$/,
	/^el panel de edición no dice que está pospuesta$/,
	/^el checkbox de la tarea está (habilitado|deshabilitado)$/,
	/^se registró un completado que cubre el <[A-Za-z0-9_]+>$/,
	// Invariantes de estructura que no dependen de los momentos: el completado nuevo se agrega
	// al final con id propio, y sin ocurrencia cubierta en las relativas.
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

/** Una columna que un Then nombra es un valor esperado: mutarla cambia lo que se afirma. */
function namesThen(feature: Feature, scenario: Scenario, column: string): boolean {
	return stepsOf(feature, scenario).some(({ step, inThen }) => inThen && step.text.includes(`<${column}>`));
}

/** Los Then de Pendientes (§6.1) y la parte de la vista que cada uno afirma. */
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

/** La lista de títulos de la celda, como la arma el oráculo; undefined si la celda no es una lista. */
const asList = (value: string | undefined) => (value === undefined ? undefined : elements(value)?.join(', '));

/**
 * Escenario cuyos Then son solo lo que muestra Pendientes (§6.1): una mutación es equivalente cuando la vista
 * que el oráculo deduce del spec es la misma con el valor mutado, y coincide con lo que afirma la fila.
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

/** Thens que el oráculo de edición verifica contra el valor que nombran: si ese valor cambia, lo observado cambia. */
const THEN_THAT_VERIFIES_THAT_NAMES = /^la tarea (?:\S+ )?conserva un solo completado, del <[A-Za-z0-9_]+>$/;

/**
 * Una columna que solo nombran Thens verificados y que también da un paso de entrada llega mutada a los dos lados:
 * el oráculo compara el valor del Then con el de la entrada, así que si siguen coincidiendo, nada cambia.
 */
function nameOnlyThenVerifiedAndEntry(steps: ReturnType<typeof stepsOf>, column: string): boolean {
	const name = steps.filter(({ step }) => step.text.includes(`<${column}>`));
	return name.some(({ inThen }) => !inThen) && name.filter(({ inThen }) => inThen).every(({ step }) => THEN_THAT_VERIFIES_THAT_NAMES.test(step.text));
}

/**
 * Escenario que edita, borra o modifica concurrentemente una tarea (§6.2, §7): una mutación es equivalente
 * cuando ningún Then nombra la columna y el oráculo de edición deduce, con el valor mutado, lo mismo que
 * observa cada Then con el valor original.
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
 * Escenario de anotaciones (§4.5, §5.10, §6.7), del panel en pestañas (§6.2), de qué fuente dibuja cada carácter (§6) o de la pantalla de carga (§6.6): una mutación
 * es equivalente cuando ningún Then nombra la columna, el oráculo reproduce lo que el escenario afirma con la
 * fila original (auditoría en línea) y, con el valor mutado, deduce lo mismo que observa cada Then.
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
 * Escenario de anotaciones (§4.5, §5.10, §6.7) o de cambios sin guardar, sus avisos o Atrás (§6.2, §7): una mutación es equivalente cuando el oráculo
 * reproduce lo que el escenario afirma con la fila original y también con el valor mutado. Una columna que un Then
 * nombra y un paso de entrada también da llega mutada a los dos lados: lo que se escribe y un Then repite, o el nombre
 * de una tarea que otro dispositivo borró (§7, gana el borrado), no deciden nada. Si solo la nombra el Then, lo que
 * afirma deja de coincidir con lo observado y no se filtra. Los ids de limpieza (§7) son identificadores opacos:
 * renombrar uno de forma consistente en el dado y en el Then que lo repite no cambia lo observado.
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
	// §5.8: una fila donde se completa después de reanudar con un momento anterior no es un escenario posible.
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
