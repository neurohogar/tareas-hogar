// Spec §6.1: orden alfabético en español, sin distinguir mayúsculas ni acentos,
// con la ñ después de la n. Determinista: no depende del locale del sistema.

const DIACRITIC_MARKS = /[̀-ͯ]/g;
const ENIE_RE = /ñ/g;
/** Marca temporal de la ñ mientras se quitan los acentos (NFD la separaría en n + tilde). */
const PROTECTED_ENIE = '\u0000';
const PROTECTED_ENIES = /\u0000/g;
/** La ñ se compara como una n seguida de un carácter mayor que cualquier letra: va después de nz y antes de o. */
const COMPARABLE_ENIE = 'n￿';

function alphabeticKey(title: string): string {
	return title
		.normalize('NFC')
		.toLowerCase()
		.replace(ENIE_RE, PROTECTED_ENIE)
		.normalize('NFD')
		.replace(DIACRITIC_MARKS, '')
		.replace(PROTECTED_ENIES, COMPARABLE_ENIE);
}

export function compareTitles(a: string, b: string): number {
	const keyA = alphabeticKey(a);
	const keyB = alphabeticKey(b);
	if (keyA < keyB) return -1;
	return keyA > keyB ? 1 : 0;
}
