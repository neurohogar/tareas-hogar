// Spec §6.1: orden alfabético en español, sin distinguir mayúsculas ni acentos,
// con la ñ después de la n. Determinista: no depende del locale del sistema.

const MARCAS_DIACRITICAS = /[̀-ͯ]/g;
const ENIE = /ñ/g;
/** Marca temporal de la ñ mientras se quitan los acentos (NFD la separaría en n + tilde). */
const ENIE_PROTEGIDA = '\u0000';
const ENIE_PROTEGIDAS = /\u0000/g;
/** La ñ se compara como una n seguida de un carácter mayor que cualquier letra: va después de nz y antes de o. */
const ENIE_COMPARABLE = 'n￿';

function claveAlfabetica(titulo: string): string {
	return titulo
		.normalize('NFC')
		.toLowerCase()
		.replace(ENIE, ENIE_PROTEGIDA)
		.normalize('NFD')
		.replace(MARCAS_DIACRITICAS, '')
		.replace(ENIE_PROTEGIDAS, ENIE_COMPARABLE);
}

export function compararTitulos(a: string, b: string): number {
	const claveA = claveAlfabetica(a);
	const claveB = claveAlfabetica(b);
	if (claveA < claveB) return -1;
	return claveA > claveB ? 1 : 0;
}
