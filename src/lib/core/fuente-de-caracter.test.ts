import { describe, expect, it } from 'vitest';
import { fuenteDeCaracter, fuentesDelTexto } from './fuente-de-caracter';

const ATKINSON = 'Atkinson Hyperlegible Next';
const NOTO = 'Noto Color Emoji';
const SISTEMA = 'la fuente del sistema';
const DISPOSITIVO = 'el emoji del dispositivo';

describe('fuenteDeCaracter', () => {
	it.each(['a', 'ñ', 'Á', 'é', 'é', '¿', '€', '–', ' ', '0', '9', '#', '*', '©', '®', '™'])(
		'el texto que Atkinson tiene, cifras y signos sin marca de emoji incluidos (%s), va con Atkinson',
		(caracter) => {
			expect(fuenteDeCaracter(caracter)).toBe(ATKINSON);
		}
	);

	it.each(['日', 'я', 'ع', 'א', '→', 'µ'])('el texto que Atkinson no tiene (%s) va con la fuente del sistema', (caracter) => {
		expect(fuenteDeCaracter(caracter)).toBe(SISTEMA);
	});

	it.each(['★', '♔', '★\uFE0F'])('un pictograma sin versión de emoji (%j) es texto, aun con marca: va con la fuente del sistema', (caracter) => {
		expect(fuenteDeCaracter(caracter)).toBe(SISTEMA);
	});

	it.each(['❤', '☀', '☎', '✈', '↔', '\u3030'])('con versión de texto y de emoji, sin marca, que Atkinson no tiene (%s) va con Noto', (caracter) => {
		expect(fuenteDeCaracter(caracter)).toBe(NOTO);
	});

	it.each(['❤︎', '☀︎'])('la marca de texto (%j) no es marca de emoji: sigue la regla sin marca', (caracter) => {
		expect(fuenteDeCaracter(caracter)).toBe(NOTO);
	});

	it.each([
		['sin marca', '🌱'],
		['con marca', '❤\uFE0F'],
		['cifra con marca', '1\uFE0F'],
		['símbolo de Atkinson con marca', '©\uFE0F'],
		['keycap', '#\uFE0F\u20E3'],
		['keycap sin selector', '#\u20E3'],
		['ZWJ', '👨\u200D👩\u200D👧'],
		['ZWJ de pictogramas de texto', '⛹\u200D♂'],
		['tono', '👍🏽'],
		['bandera', '🇦🇷'],
		['bandera de subdivisión', '🏴󠁧󠁢󠁥󠁮󠁧󠁿']
	])('un emoji que Noto tiene (%s) va con Noto', (_, emoji) => {
		expect(fuenteDeCaracter(emoji)).toBe(NOTO);
	});

	it.each([
		['sin asignar todavía', '\u{1FAFF}'],
		['sin asignar, con marca', '\u{1FAFF}\uFE0F'],
		['ZWJ con uno que falta', '👨\u200D\u{1FAFF}']
	])('un emoji que Noto no tiene (%s) va con el emoji del dispositivo', (_, emoji) => {
		expect(fuenteDeCaracter(emoji)).toBe(DISPOSITIVO);
	});

	it('una marca de emoji sobre una letra no la vuelve emoji', () => {
		expect(fuenteDeCaracter('a\uFE0F')).toBe(ATKINSON);
	});

	it('un keycap sobre una letra no la vuelve emoji', () => {
		expect(fuenteDeCaracter('a\u20E3')).toBe(SISTEMA);
	});

	it('un ZWJ tras un pictograma sin otro pictograma no lo vuelve emoji', () => {
		expect(fuenteDeCaracter('©\u200D')).toBe(ATKINSON);
	});

	it('el texto sin versión de emoji que Atkinson no tiene no va con Noto', () => {
		expect(fuenteDeCaracter('\u2003')).toBe(SISTEMA);
	});

	it('los bordes de los rangos de cobertura cuentan: Atkinson tiene el último y no el siguiente', () => {
		expect(fuenteDeCaracter('~')).toBe(ATKINSON); // 7e, fin de 20-7e
		expect(fuenteDeCaracter(' ')).toBe(ATKINSON); // a0, inicio de a0-ac
		expect(fuenteDeCaracter('¬')).toBe(ATKINSON); // ac, fin de a0-ac
		expect(fuenteDeCaracter('Ă')).toBe(ATKINSON); // suelto
		expect(fuenteDeCaracter('ă')).toBe(ATKINSON);
		expect(fuenteDeCaracter('Ĉ')).toBe(SISTEMA); // entre 100-107 y 10a-113
	});
});

describe('fuentesDelTexto', () => {
	it('un texto en español usa solo Atkinson', () => {
		expect(fuentesDelTexto('Atención, camión y niño')).toStrictEqual([ATKINSON]);
	});

	it('da cada fuente una vez, en el orden en que aparece', () => {
		expect(fuentesDelTexto('Regar 🌱 日本 las 🌿 \u{1FAFF} plantas')).toStrictEqual([ATKINSON, NOTO, SISTEMA, DISPOSITIVO]);
	});

	it.each([
		['ZWJ', '👨\u200D👩\u200D👧'],
		['ZWJ con marca', '❤\uFE0F\u200D🔥'],
		['keycap', '#\uFE0F\u20E3'],
		['tono', '👍🏽'],
		['bandera', '🇦🇷'],
		['bandera de subdivisión', '🏴\u{E0067}\u{E0062}\u{E007F}']
	])('una secuencia de emoji (%s) es un solo carácter', (_, emoji) => {
		expect(fuentesDelTexto(emoji)).toStrictEqual([NOTO]);
	});

	it('una secuencia con un emoji que Noto no tiene va entera con el del dispositivo', () => {
		expect(fuentesDelTexto('👨\u200D\u{1FAFF}')).toStrictEqual([DISPOSITIVO]);
	});

	it('una marca combinada es parte de su letra', () => {
		expect(fuentesDelTexto('e\u0301')).toStrictEqual([ATKINSON]);
		expect(fuentesDelTexto('a\u20E3')).toStrictEqual([SISTEMA]);
	});

	it('un carácter suelto de emoji sin secuencia sigue su propia regla', () => {
		expect(fuentesDelTexto('1 ©')).toStrictEqual([ATKINSON]);
		expect(fuentesDelTexto('©❤')).toStrictEqual([ATKINSON, NOTO]);
	});

	it('lo que no se dibuja no pide fuente: saltos de línea, tabuladores y marcas invisibles', () => {
		expect(fuentesDelTexto('uno\ndos\r\ntres\tcuatro')).toStrictEqual([ATKINSON]);
		expect(fuentesDelTexto('\u200D\uFE0F­\n')).toStrictEqual([]);
	});

	it('un texto vacío no pide ninguna fuente', () => {
		expect(fuentesDelTexto('')).toStrictEqual([]);
	});
});
