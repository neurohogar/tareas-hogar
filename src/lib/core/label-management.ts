// Spec §6.4 (renombrar y cambiar color) y §7 (conflictos de etiquetas).
import { sameName, validateName, type Color, type NameError, type Label } from './label';

/** Un cambio parcial de una etiqueta: nombre y color son campos independientes (§7). */
export interface LabelChange {
	name?: string;
	color?: Color;
}

export type RenameError = NameError | 'repetido';

export type RenameResult = { ok: true; change: LabelChange } | { ok: false; error: RenameError };

/** Valida como al crear; se rechaza si otra etiqueta ya tiene ese nombre (sin distinguir mayúsculas). */
export function rename(label: Label, typedOne: string, labels: readonly Label[]): RenameResult {
	const validated = validateName(typedOne);
	if (!validated.ok) return validated;
	const { name } = validated;
	const repeatedOne = labels.some((other) => other.id !== label.id && sameName(other.name, name));
	return repeatedOne ? { ok: false, error: 'repetido' } : { ok: true, change: { name } };
}

/** Como lo aplica el servidor: gana el último cambio por campo; si la etiqueta ya no existe, se descarta. */
export function applyLabelChange(labels: readonly Label[], labelId: string, change: LabelChange): Label[] {
	return labels.map((label) => (label.id === labelId ? { ...label, ...change } : label));
}
