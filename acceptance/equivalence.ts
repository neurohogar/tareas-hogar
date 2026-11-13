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
import type { Example, Feature, Scenario } from './ir';
import { clasificarFila, elementos, esCronologiaImposible, esEscenarioDeFuente, observarFuente, ordenDePendientes, type FilaOraculo, type PasoOraculo, type VistaDePendientes } from './oracle';
import { esEscenarioDeCambios, esEscenarioDelPanel, observarCambios, observarPanel } from './oracle-panel';
import { esEscenarioDeAnotaciones, esEscenarioDeLimpiezas, observarAnotaciones, observarLimpiezas } from './oracle-anotaciones';
import { esEscenarioDeEdicion, observarEdicion } from './oracle-edicion';
import { esEscenarioDeEtiquetas, observarEtiquetas } from './oracle-etiquetas';
import { esEscenarioDePantallaDeCarga, observarPantallaDeCarga } from './oracle-pantalla-de-carga';

/** Pasos Then que solo observan la clasificación de la regla. */
const THEN_DE_CLASIFICACION = [
	/^el estado es (pendiente|en espera|atrasada)$/,
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

const esThen = (keyword: string, anterior: boolean) => keyword === 'Then' || (keyword === 'And' && anterior);

function pasosDe(feature: Feature, scenario: Scenario) {
	const todos = [...(feature.background ?? []), ...scenario.steps];
	let enThen = false;
	return todos.map((step) => {
		enThen = esThen(step.keyword, enThen);
		return { step, enThen };
	});
}

function soloObservaClasificacion(feature: Feature, scenario: Scenario): boolean {
	return pasosDe(feature, scenario)
		.filter(({ enThen }) => enThen)
		.every(({ step }) => THEN_DE_CLASIFICACION.some((patron) => patron.test(step.text)));
}

export interface Candidata {
	scenario: number;
	example: number;
	key: string;
	mutated: string;
}

/** Una columna que un Then nombra es un valor esperado: mutarla cambia lo que se afirma. */
function loNombraUnThen(feature: Feature, scenario: Scenario, columna: string): boolean {
	return pasosDe(feature, scenario).some(({ step, enThen }) => enThen && step.text.includes(`<${columna}>`));
}

/** Los Then de Pendientes (§6.1) y la parte de la vista que cada uno afirma. */
const THENS_DE_PENDIENTES: [RegExp, keyof VistaDePendientes][] = [
	[/^Pendientes muestra en orden <([A-Za-z0-9_]+)>$/, 'orden'],
	[/^Pendientes muestra como completadas <([A-Za-z0-9_]+)>$/, 'completadas'],
	[/^Pendientes muestra como pausadas <([A-Za-z0-9_]+)>$/, 'pausadas']
];

function thenDePendientes(texto: string): { columna: string; parte: keyof VistaDePendientes } | undefined {
	for (const [patron, parte] of THENS_DE_PENDIENTES) {
		const coincide = patron.exec(texto);
		if (coincide) return { columna: coincide[1], parte };
	}
	return undefined;
}

/** La lista de títulos de la celda, como la arma el oráculo; undefined si la celda no es una lista. */
const comoLista = (valor: string | undefined) => (valor === undefined ? undefined : elementos(valor)?.join(', '));

/**
 * Escenario cuyos Then son solo lo que muestra Pendientes (§6.1): una mutación es equivalente cuando la vista
 * que el oráculo deduce del spec es la misma con el valor mutado, y coincide con lo que afirma la fila.
 */
function esEquivalenteDeOrden(feature: Feature, scenario: Scenario, candidata: Candidata): boolean | undefined {
	const pasos = pasosDe(feature, scenario);
	const thens = pasos.filter(({ enThen }) => enThen).map(({ step }) => thenDePendientes(step.text));
	if (thens.length === 0 || thens.some((then) => then === undefined)) return undefined;
	if (thens.some((then) => then?.columna === candidata.key)) return false;
	const original = scenario.examples[candidata.example];
	const entradas = pasos.filter(({ enThen }) => !enThen).map(({ step }) => step);
	const esperada = ordenDePendientes(entradas, original);
	if (esperada === undefined || thens.some((then) => then && esperada[then.parte] !== comoLista(original[then.columna]))) return false;
	return JSON.stringify(ordenDePendientes(entradas, { ...original, [candidata.key]: candidata.mutated })) === JSON.stringify(esperada);
}

/**
 * Escenario que edita, borra o modifica concurrentemente una tarea (§6.2, §7): una mutación es equivalente
 * cuando ningún Then nombra la columna y el oráculo de edición deduce, con el valor mutado, lo mismo que
 * observa cada Then con el valor original.
 */
function esEquivalenteDeEdicion(feature: Feature, scenario: Scenario, candidata: Candidata): boolean {
	if (loNombraUnThen(feature, scenario, candidata.key)) return false;
	const pasos = pasosDe(feature, scenario);
	const entradas = pasos.filter(({ enThen }) => !enThen).map(({ step }) => step);
	const thens = pasos.filter(({ enThen }) => enThen).map(({ step }) => step);
	const original = scenario.examples[candidata.example];
	const antes = observarEdicion(entradas, thens, original);
	const despues = observarEdicion(entradas, thens, { ...original, [candidata.key]: candidata.mutated });
	return antes !== undefined && JSON.stringify(antes) === JSON.stringify(despues);
}

type Observador = (entradas: PasoOraculo[], thens: PasoOraculo[], fila: FilaOraculo) => { observado: string[]; afirmado: string[] } | undefined;

/**
 * Escenario de anotaciones (§4.5, §5.10, §6.7), de etiquetas o del filtro (§4.3, §6.1, §6.2, §6.4, §7), del panel en pestañas (§6.2), de qué fuente dibuja cada carácter (§6) o de la pantalla de carga (§6.6): una mutación
 * es equivalente cuando ningún Then nombra la columna, el oráculo reproduce lo que el escenario afirma con la
 * fila original (auditoría en línea) y, con el valor mutado, deduce lo mismo que observa cada Then.
 */
function esEquivalenteSegun(observar: Observador, feature: Feature, scenario: Scenario, candidata: Candidata): boolean {
	if (loNombraUnThen(feature, scenario, candidata.key)) return false;
	const pasos = pasosDe(feature, scenario);
	const entradas = pasos.filter(({ enThen }) => !enThen).map(({ step }) => step);
	const thens = pasos.filter(({ enThen }) => enThen).map(({ step }) => step);
	const original = scenario.examples[candidata.example];
	const antes = observar(entradas, thens, original);
	const despues = observar(entradas, thens, { ...original, [candidata.key]: candidata.mutated });
	if (!antes || !despues || JSON.stringify(antes.observado) !== JSON.stringify(antes.afirmado)) return false;
	return JSON.stringify(antes.observado) === JSON.stringify(despues.observado);
}

/**
 * Escenario de anotaciones (§4.5, §5.10, §6.7) o de cambios sin guardar, sus avisos o Atrás (§6.2, §7): una mutación es equivalente cuando el oráculo
 * reproduce lo que el escenario afirma con la fila original y también con el valor mutado. Una columna que un Then
 * nombra y un paso de entrada también da llega mutada a los dos lados: lo que se escribe y un Then repite, o el nombre
 * de una tarea que otro dispositivo borró (§7, gana el borrado), no deciden nada. Si solo la nombra el Then, lo que
 * afirma deja de coincidir con lo observado y no se filtra.
 */
function esEquivalenteSiSigueCumpliendo(observar: Observador, feature: Feature, scenario: Scenario, candidata: Candidata): boolean {
	const pasos = pasosDe(feature, scenario);
	const entradas = pasos.filter(({ enThen }) => !enThen).map(({ step }) => step);
	const thens = pasos.filter(({ enThen }) => enThen).map(({ step }) => step);
	const original = scenario.examples[candidata.example];
	const reproduce = (fila: FilaOraculo) => {
		const observacion = observar(entradas, thens, fila);
		return observacion !== undefined && JSON.stringify(observacion.observado) === JSON.stringify(observacion.afirmado);
	};
	return reproduce(original) && reproduce({ ...original, [candidata.key]: candidata.mutated });
}

export function esEquivalente(feature: Feature, candidata: Candidata): boolean {
	const scenario = feature.scenarios[candidata.scenario];
	if (esEscenarioDeLimpiezas(pasosDe(feature, scenario).map(({ step }) => step.text))) {
		return esEquivalenteSegun(observarLimpiezas, feature, scenario, candidata);
	}
	if (esEscenarioDeAnotaciones(pasosDe(feature, scenario).map(({ step }) => step.text))) {
		return esEquivalenteSiSigueCumpliendo(observarAnotaciones, feature, scenario, candidata);
	}
	if (esEscenarioDeFuente(pasosDe(feature, scenario).map(({ step }) => step.text))) {
		return esEquivalenteSegun(observarFuente, feature, scenario, candidata);
	}
	if (esEscenarioDePantallaDeCarga(pasosDe(feature, scenario).map(({ step }) => step.text))) {
		return esEquivalenteSegun(observarPantallaDeCarga, feature, scenario, candidata);
	}
	if (esEscenarioDeCambios(pasosDe(feature, scenario).map(({ step }) => step.text))) {
		return esEquivalenteSiSigueCumpliendo(observarCambios, feature, scenario, candidata);
	}
	if (esEscenarioDelPanel(pasosDe(feature, scenario).map(({ step }) => step.text))) {
		return esEquivalenteSegun(observarPanel, feature, scenario, candidata);
	}
	if (esEscenarioDeEtiquetas(pasosDe(feature, scenario).map(({ step }) => step.text))) {
		return esEquivalenteSegun(observarEtiquetas, feature, scenario, candidata);
	}
	if (esEscenarioDeEdicion(pasosDe(feature, scenario).map(({ step }) => step.text))) {
		return esEquivalenteDeEdicion(feature, scenario, candidata);
	}
	const deOrden = esEquivalenteDeOrden(feature, scenario, candidata);
	if (deOrden !== undefined) return deOrden;
	if (!soloObservaClasificacion(feature, scenario) || loNombraUnThen(feature, scenario, candidata.key)) return false;
	const original = scenario.examples[candidata.example];
	const mutado = { ...original, [candidata.key]: candidata.mutated };
	const entradas = pasosDe(feature, scenario)
		.filter(({ enThen }) => !enThen)
		.map(({ step }) => step);
	// §5.8: una fila donde se completa después de reanudar con un momento anterior no es un escenario posible.
	if (!esCronologiaImposible(entradas, original) && esCronologiaImposible(entradas, mutado)) return true;
	const observaEnThen = (patron: RegExp) => pasosDe(feature, scenario).some(({ step, enThen }) => enThen && patron.test(step.text));
	const progreso = observaEnThen(/^el progreso es /);
	const estado = observaEnThen(/^el estado es |^la tarea (no )?está completada$|^la tarea no tiene estado$/);
	const aparicion = observaEnThen(/^la tarea (no )?aparece en Pendientes$/);
	const checkbox = observaEnThen(/^el checkbox de la tarea está /);
	const cubierta = observaEnThen(/^se registró un completado que cubre /);
	const pospuesta = observaEnThen(/^la tarea está pospuesta desde /);
	const textoDelPanel = observaEnThen(/^el panel de edición (?:muestra|no dice que está pospuesta)/);
	const observa = { progreso, checkbox, cubierta, pospuesta, textoDelPanel, soloAparicion: !estado && !progreso, soloCheckbox: checkbox && !estado && !progreso && !aparicion };
	const antes = clasificarFila(entradas, original, observa);
	return antes !== undefined && antes === clasificarFila(entradas, mutado, observa);
}
