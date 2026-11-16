// Spec §4.3 (Creación) y §6.2: los nombres de etiqueta que se escriben en el
// panel, resueltos a etiquetas existentes o nuevas. Las nuevas se crean al
// guardar la tarea.
import { leastUsedColor } from './label-color';
import { sameName, validateName, type NameError, type Label, type NewLabel } from './label';

/** Una existente (con id) o una que se crea al guardar (sin id). */
export type ChosenLabel = Label | NewLabel;

export type LabelChoice = { ok: true; chosenItems: ChosenLabel[] } | { ok: false; error: NameError };

const isNew = (chosen: ChosenLabel): chosen is NewLabel => chosen.id === undefined;

/**
 * En el orden escrito: un nombre que ya existe (sin distinguir mayúsculas) usa
 * esa etiqueta; uno repetido queda una sola vez, con el primero escrito; uno
 * nuevo toma el color menos usado contando las existentes y las nuevas
 * anteriores. Un nombre inválido rechaza todo.
 */
export function chooseLabels(typedItems: readonly string[], existings: readonly Label[]): LabelChoice {
	const chosenItems: ChosenLabel[] = [];
	for (const typed of typedItems) {
		const validated = validateName(typed);
		if (!validated.ok) return validated;
		const { name } = validated;
		if (chosenItems.some((chosen) => sameName(chosen.name, name))) continue;
		const colors = [...existings, ...chosenItems.filter(isNew)].map(({ color }) => color);
		const newLabel = { name, color: leastUsedColor(colors) };
		// La nueva coincide siempre: queda al final, así que gana la existente si la hay.
		chosenItems.push([...existings, newLabel].find((label) => sameName(label.name, name))!);
	}
	return { ok: true, chosenItems };
}

/** Las elegidas al guardar: las nuevas reciben id. */
export function saveChosen(chosenItems: readonly ChosenLabel[], newId: () => string): { ids: string[]; newLabels: Label[] } {
	const newLabels: Label[] = [];
	const ids = chosenItems.map((chosen) => {
		if (!isNew(chosen)) return chosen.id;
		const newLabel = { ...chosen, id: newId() };
		newLabels.push(newLabel);
		return newLabel.id;
	});
	return { ids, newLabels };
}
