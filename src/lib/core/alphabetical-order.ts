// Spec §6.1: alphabetical order in Spanish, ignoring case and accents,
// with ñ after n. Deterministic: does not depend on the system locale.

const DIACRITIC_MARKS = /[̀-ͯ]/g;
const ENIE_RE = /ñ/g;
/** Temporary mark for ñ while accents are removed (NFD would split it into n + tilde). */
const PROTECTED_ENIE = '\u0000';
const PROTECTED_ENIES = /\u0000/g;
/** ñ is compared as an n followed by a character greater than any letter: it goes after nz and before o. */
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
