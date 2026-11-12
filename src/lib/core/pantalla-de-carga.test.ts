import { describe, expect, it } from 'vitest';
import {
	MINIMO_DE_LA_PANTALLA_EN_SEGUNDOS,
	TOPE_DE_LA_PANTALLA_EN_SEGUNDOS,
	pantallaDeCargaSeVa,
	recuerdoAlArrancar,
	recuerdoDeTopeDeNoto,
	proximoLimiteDeLaPantalla,
	resumenDeFuentes,
	type EstadoDeLaEspera
} from './pantalla-de-carga';

/** Con sesión, en línea y con todo listo, a los 2 s: se va; cada test cambia lo que prueba. */
function espera(cambios: Partial<EstadoDeLaEspera> = {}): EstadoDeLaEspera {
	return {
		segundosDesdeElArranque: 2,
		auth: 'con-sesion',
		tareasRespondieron: true,
		completadosRespondieron: true,
		etiquetasRespondieron: true,
		atkinson: 'lista',
		noto: 'lista',
		enLinea: true,
		recuerdaTopeDeNoto: false,
		...cambios
	};
}

describe('límites de la pantalla', () => {
	it('el mínimo es de 0,5 s y el tope de 10 s', () => {
		expect(MINIMO_DE_LA_PANTALLA_EN_SEGUNDOS).toBe(0.5);
		expect(TOPE_DE_LA_PANTALLA_EN_SEGUNDOS).toBe(10);
	});
});

describe('pantallaDeCargaSeVa: con sesión', () => {
	it('se va cuando todo lo que espera está listo', () => {
		expect(pantallaDeCargaSeVa(espera())).toBe(true);
	});

	it.each([
		['las tareas', { tareasRespondieron: false }],
		['los completados', { completadosRespondieron: false }],
		['las etiquetas', { etiquetasRespondieron: false }],
		['Atkinson', { atkinson: 'sin-guardar' }],
		['Noto', { noto: 'sin-guardar' }]
	] as const)('espera a %s', (_nombre, cambios) => {
		expect(pantallaDeCargaSeVa(espera(cambios))).toBe(false);
	});
});

describe('pantallaDeCargaSeVa: mínimo de 0,5 s', () => {
	it('con todo listo no se va antes del mínimo', () => {
		expect(pantallaDeCargaSeVa(espera({ segundosDesdeElArranque: 0.4 }))).toBe(false);
	});

	it('se va justo al llegar al mínimo', () => {
		expect(pantallaDeCargaSeVa(espera({ segundosDesdeElArranque: 0.5 }))).toBe(true);
	});

	it('vale también sin sesión, sin conexión y con las fuentes falladas', () => {
		const estado = espera({
			segundosDesdeElArranque: 0.4,
			auth: 'sin-sesion',
			enLinea: false,
			atkinson: 'fallida',
			noto: 'fallida'
		});
		expect(pantallaDeCargaSeVa(estado)).toBe(false);
	});
});

describe('pantallaDeCargaSeVa: tope de 10 s', () => {
	const nadaListo = {
		tareasRespondieron: false,
		completadosRespondieron: false,
		etiquetasRespondieron: false,
		atkinson: 'sin-guardar',
		noto: 'sin-guardar'
	} as const;

	it('antes del tope sigue esperando', () => {
		expect(pantallaDeCargaSeVa(espera({ ...nadaListo, segundosDesdeElArranque: 9.9 }))).toBe(false);
	});

	it('al llegar al tope entra con lo que haya', () => {
		expect(pantallaDeCargaSeVa(espera({ ...nadaListo, segundosDesdeElArranque: 10 }))).toBe(true);
	});

	it('la espera de Auth no entra en el tope', () => {
		expect(pantallaDeCargaSeVa(espera({ auth: 'esperando', segundosDesdeElArranque: 60 }))).toBe(
			false
		);
	});

	it('si Auth responde pasado el tope, se va en ese momento aunque falte lo demás', () => {
		expect(pantallaDeCargaSeVa(espera({ ...nadaListo, segundosDesdeElArranque: 12 }))).toBe(true);
	});
});

describe('pantallaDeCargaSeVa: sin sesión', () => {
	const sinSesion = {
		auth: 'sin-sesion',
		tareasRespondieron: false,
		completadosRespondieron: false,
		etiquetasRespondieron: false
	} as const;

	it('no espera datos ni a Noto', () => {
		expect(pantallaDeCargaSeVa(espera({ ...sinSesion, noto: 'sin-guardar' }))).toBe(true);
	});

	it('espera a Atkinson', () => {
		expect(pantallaDeCargaSeVa(espera({ ...sinSesion, atkinson: 'sin-guardar' }))).toBe(false);
	});
});

describe('pantallaDeCargaSeVa: no espera lo que no va a llegar', () => {
	it.each([
		['Atkinson', { atkinson: 'fallida' }],
		['Noto', { noto: 'fallida' }]
	] as const)('%s fallida se deja de esperar con conexión', (_nombre, cambios) => {
		expect(pantallaDeCargaSeVa(espera(cambios))).toBe(true);
	});

	it('una fuente fallida no libera lo demás pendiente', () => {
		expect(pantallaDeCargaSeVa(espera({ noto: 'fallida', atkinson: 'sin-guardar' }))).toBe(false);
		expect(pantallaDeCargaSeVa(espera({ noto: 'fallida', tareasRespondieron: false }))).toBe(false);
	});

	it.each([
		['Atkinson', { atkinson: 'sin-guardar' }],
		['Noto', { noto: 'sin-guardar' }]
	] as const)('sin conexión no espera a %s sin guardar', (_nombre, cambios) => {
		expect(pantallaDeCargaSeVa(espera({ ...cambios, enLinea: false }))).toBe(true);
	});

	it.each([
		['Atkinson', { atkinson: 'guardada' }],
		['Noto', { noto: 'guardada' }]
	] as const)('sin conexión sigue esperando a %s guardada', (_nombre, cambios) => {
		const estado = espera({ ...cambios, enLinea: false });
		expect(pantallaDeCargaSeVa(estado)).toBe(false);
	});

	it('sin conexión sigue esperando el caché local de los datos', () => {
		expect(pantallaDeCargaSeVa(espera({ enLinea: false, etiquetasRespondieron: false }))).toBe(
			false
		);
	});
});

describe('pantallaDeCargaSeVa: después de un tope con Noto sin bajar', () => {
	it('con sesión no espera a Noto', () => {
		expect(pantallaDeCargaSeVa(espera({ recuerdaTopeDeNoto: true, noto: 'sin-guardar' }))).toBe(
			true
		);
	});

	it('lo demás se sigue esperando', () => {
		const estado = espera({ recuerdaTopeDeNoto: true, noto: 'sin-guardar', atkinson: 'guardada' });
		expect(pantallaDeCargaSeVa(estado)).toBe(false);
	});
});

describe('recuerdoDeTopeDeNoto', () => {
	const alTope = { segundosDesdeElArranque: 10, noto: 'sin-guardar' } as const;

	it('un tope con Noto sin bajar en una apertura que lo esperaba se recuerda', () => {
		expect(recuerdoDeTopeDeNoto(espera(alTope))).toBe(true);
	});

	it('también cuando Noto se estaba leyendo del dispositivo', () => {
		expect(recuerdoDeTopeDeNoto(espera({ ...alTope, noto: 'guardada' }))).toBe(true);
	});

	it('si la pantalla se fue antes del tope no hay nada que recordar', () => {
		expect(recuerdoDeTopeDeNoto(espera({ ...alTope, segundosDesdeElArranque: 9.9 }))).toBe(false);
	});

	it('un Auth tardío también cuenta como tope alcanzado', () => {
		expect(recuerdoDeTopeDeNoto(espera({ ...alTope, segundosDesdeElArranque: 12 }))).toBe(true);
	});

	it('sin sesión no cuenta: no lo esperaba', () => {
		expect(recuerdoDeTopeDeNoto(espera({ ...alTope, auth: 'sin-sesion' }))).toBe(false);
	});

	it('Noto fallido antes del tope no cuenta: ya no se esperaba', () => {
		expect(recuerdoDeTopeDeNoto(espera({ ...alTope, noto: 'fallida' }))).toBe(false);
	});

	it('Noto sin guardar y sin conexión no cuenta: ya no se esperaba', () => {
		expect(recuerdoDeTopeDeNoto(espera({ ...alTope, enLinea: false }))).toBe(false);
	});

	it('Noto guardado y sin conexión cuenta: se seguía esperando', () => {
		expect(recuerdoDeTopeDeNoto(espera({ ...alTope, enLinea: false, noto: 'guardada' }))).toBe(true);
	});

	it('con Noto listo al llegar el tope no se recuerda', () => {
		expect(recuerdoDeTopeDeNoto(espera({ segundosDesdeElArranque: 10 }))).toBe(false);
	});

	it.each([
		['sin sesión', { auth: 'sin-sesion' }],
		['con Noto fallido', { noto: 'fallida' }],
		['sin conexión', { enLinea: false }],
		['antes del tope', { segundosDesdeElArranque: 1 }]
	] as const)('lo ya recordado se conserva %s', (_nombre, cambios) => {
		const estado = espera({ noto: 'sin-guardar', recuerdaTopeDeNoto: true, ...cambios });
		expect(recuerdoDeTopeDeNoto(estado)).toBe(true);
	});

	it('se olvida cuando Noto queda guardado', () => {
		expect(recuerdoDeTopeDeNoto(espera({ recuerdaTopeDeNoto: true, noto: 'lista' }))).toBe(false);
	});

	it('se olvida aunque la apertura no tenga sesión', () => {
		const estado = espera({ recuerdaTopeDeNoto: true, noto: 'lista', auth: 'sin-sesion' });
		expect(recuerdoDeTopeDeNoto(estado)).toBe(false);
	});
});

describe('recuerdoAlArrancar', () => {
	it('sin versión que cambie el juego, lo recordado sigue', () => {
		expect(recuerdoAlArrancar(true, false)).toBe(true);
	});

	it('una versión que cambia el juego vuelve a esperarlo una vez', () => {
		expect(recuerdoAlArrancar(true, true)).toBe(false);
	});

	it('sin nada recordado, no aparece nada que recordar', () => {
		expect(recuerdoAlArrancar(false, false)).toBe(false);
		expect(recuerdoAlArrancar(false, true)).toBe(false);
	});
});

describe('próximo límite', () => {
	it('es el mínimo, luego el tope, y después no hay', () => {
		expect(proximoLimiteDeLaPantalla(0)).toBe(0.5);
		expect(proximoLimiteDeLaPantalla(0.5)).toBe(10);
		expect(proximoLimiteDeLaPantalla(10)).toBeUndefined();
	});
});

describe('resumen de fuentes', () => {
	it('manda la peor: fallida, luego sin guardar, luego guardada', () => {
		expect(resumenDeFuentes(['guardada', 'sin-guardar', 'fallida'])).toBe('fallida');
		expect(resumenDeFuentes(['guardada', 'sin-guardar'])).toBe('sin-guardar');
		expect(resumenDeFuentes(['guardada'])).toBe('guardada');
	});
});
