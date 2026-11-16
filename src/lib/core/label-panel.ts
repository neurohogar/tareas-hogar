// Spec §6.2 (Etiquetas en el panel): autocompletado y agregar lo escrito. El
// panel guarda los nombres elegidos; se resuelven a etiquetas al guardar.
import { sameName, validateName, type Label, type ValidatedName } from './label';
import { sortLabels } from './label-order';

const DIACRITIC_MARKS = /[̀-ͯ]/g;

/** Para buscar: sin mayúsculas ni acentos (la ñ coincide con la n). */
const flat = (text: string) => text.normalize('NFD').replace(DIACRITIC_MARKS, '').toLowerCase();

export interface Suggestions {
	labels: Label[];
	/** «Crear "x"»: lo escrito, si ninguna existente se llama así. */
	create?: string;
}

/**
 * Las existentes cuyo nombre contiene lo escrito (sin distinguir mayúsculas ni
 * acentos), sin las ya elegidas, en el orden de la §4.3; y crear lo escrito si
 * ninguna existente coincide exactamente (sin distinguir mayúsculas).
 */
export function suggestions(typedOne: string, existings: readonly Label[], chosenItems: readonly string[]): Suggestions {
	const text = typedOne.trim();
	if (text === '') return { labels: [] };
	const alreadyChosen = (label: Label) => chosenItems.some((name) => sameName(name, label.name));
	const labels = sortLabels(existings.filter((label) => flat(label.name).includes(flat(text)) && !alreadyChosen(label)));
	const exists = existings.some((label) => sameName(label.name, text));
	return exists ? { labels } : { labels, create: text };
}

export type Added = { ok: true; names: string[] } | Extract<ValidatedName, { ok: false }>;

/**
 * Agregar lo escrito (Enter o elegir una sugerencia): la existente con ese
 * nombre (sin distinguir mayúsculas) o una nueva. Una que ya está no se repite.
 * Vacío o solo espacios no agrega nada ni es un error (no ofrece crear); un
 * nombre de más de 30 caracteres se rechaza.
 */
export function addTyped(typedOne: string, existings: readonly Label[], chosenItems: readonly string[]): Added {
	const validated = validateName(typedOne);
	if (!validated.ok) return validated.error === 'vacio' ? { ok: true, names: [...chosenItems] } : validated;
	const name = existings.find((label) => sameName(label.name, validated.name))?.name ?? validated.name;
	const repeated = chosenItems.some((chosen) => sameName(chosen, name));
	return { ok: true, names: repeated ? [...chosenItems] : [...chosenItems, name] };
}

/** Quitar un chip: el nombre elegido que es esa etiqueta (sin distinguir mayúsculas, como al agregarla). */
export function removeChosen(name: string, chosenItems: readonly string[]): string[] {
	return chosenItems.filter((chosen) => !sameName(chosen, name));
}
