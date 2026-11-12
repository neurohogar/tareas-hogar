// Spec §6: qué caracteres trae cada fuente empaquetada. Es un dato medido, no una regla.
// Medido con fc-query (charset) sobre los archivos de estas versiones; si la app empaqueta
// otros archivos, esta tabla se vuelve a medir:
// - Atkinson: @fontsource/atkinson-hyperlegible-next 5.3.0, subconjuntos latin y latin-ext.
// - Noto: @fontsource/noto-color-emoji 5.3.2 (Noto Color Emoji 2.057), todos sus subconjuntos.

/** Los puntos de código que una fuente puede dibujar. */
export type Cobertura = ReadonlySet<number>;

/** Lee rangos en hexadecimal ("20-7e 102"): cada uno es un punto de código o un intervalo cerrado. */
function coberturaDe(lineas: string[]): Cobertura {
	const cobertura = new Set<number>();
	for (const rango of lineas.join(' ').split(' ')) {
		const [desde, hasta = desde] = rango.split('-').map((hexa) => Number.parseInt(hexa, 16));
		for (let punto = desde; punto <= hasta; punto++) cobertura.add(punto);
	}
	return cobertura;
}

export const COBERTURA_DE_ATKINSON: Cobertura = coberturaDe([
	'20-7e a0-ac ae-b4 b6-107 10a-113 116-11b 11e-123 126-127 12a-12b 12e-133 136-137 139-13e',
	'141-148 150-155 158-15b 15e-165 16a-16b 16e-17e 192 218-21b 237 2c6-2c7 2c9 2da 2dc-2dd',
	'300-301 303-304 308 1e80-1e85 1e9e 1ef2-1ef3 2009 2013-2014 2018-201a 201c-201e 2020 2022',
	'2026 2039-203a 2044 20ac 20b9 2113 2122 2212 2215'
]);

export const COBERTURA_DE_NOTO: Cobertura = coberturaDe([
	'20 23 2a 30-39 a9 ae 200d 203c 2049 20e3 2122 2139 2194-2199 21a9-21aa 231a-231b 2328 23cf',
	'23e9-23f3 23f8-23fa 24c2 25aa-25ab 25b6 25c0 25fb-25fe 2600-2604 260e 2611 2614-2615 2618',
	'261d 2620 2622-2623 2626 262a 262e-262f 2638-263a 2640 2642 2648-2653 265f-2660 2663',
	'2665-2666 2668 267b 267e-267f 2692-2697 2699 269b-269c 26a0-26a1 26a7 26aa-26ab 26b0-26b1',
	'26bd-26be 26c4-26c5 26c8 26ce-26cf 26d1 26d3-26d4 26e9-26ea 26f0-26f5 26f7-26fa 26fd 2702',
	'2705 2708-270d 270f 2712 2714 2716 271d 2721 2728 2733-2734 2744 2747 274c 274e 2753-2755',
	'2757 2763-2764 2795-2797 27a1 27b0 27bf 2934-2935 2b05-2b07 2b1b-2b1c 2b50 2b55 3030 303d',
	'3297 3299 1f004 1f0cf 1f170-1f171 1f17e-1f17f 1f18e 1f191-1f19a 1f1e6-1f1ff 1f201-1f202',
	'1f21a 1f22f 1f232-1f23a 1f250-1f251 1f300-1f321 1f324-1f393 1f396-1f397 1f399-1f39b',
	'1f39e-1f3f0 1f3f3-1f3f5 1f3f7-1f4fd 1f4ff-1f53d 1f549-1f54e 1f550-1f567 1f56f-1f570',
	'1f573-1f57a 1f587 1f58a-1f58d 1f590 1f595-1f596 1f5a4-1f5a5 1f5a8 1f5b1-1f5b2 1f5bc',
	'1f5c2-1f5c4 1f5d1-1f5d3 1f5dc-1f5de 1f5e1 1f5e3 1f5e8 1f5ef 1f5f3 1f5fa-1f64f 1f680-1f6c5',
	'1f6cb-1f6d2 1f6d5-1f6d9 1f6dc-1f6e5 1f6e9 1f6eb-1f6ec 1f6f0 1f6f3-1f6fc 1f7e0-1f7eb 1f7f0',
	'1f90c-1f93a 1f93c-1f945 1f947-1f9ff 1fa70-1fa7c 1fa80-1fac6 1fac8 1facc-1fadd 1fadf-1faeb',
	'1faef-1fafa e0062-e0063 e0065 e0067 e006c e006e e0073-e0074 e0077 e007f'
]);
