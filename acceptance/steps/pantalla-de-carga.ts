// Cuándo se va la pantalla de carga y qué recuerda el dispositivo (spec §6.6). Los
// pasos declaran cuándo llega cada cosa en segundos desde el arranque; los Then le
// preguntan al core el estado de cada instante en que algo cambia.
import { expect } from 'vitest';
import {
	MINIMO_DE_LA_PANTALLA_EN_SEGUNDOS,
	TOPE_DE_LA_PANTALLA_EN_SEGUNDOS,
	pantallaDeCargaSeVa,
	recuerdoAlArrancar,
	recuerdoDeTopeDeNoto,
	type EstadoDeFuente,
	type EstadoDeLaEspera
} from '../../src/lib/core/pantalla-de-carga';
import { P } from './valores';
import type { AperturaDeLaApp, FuenteDeLaApertura, StepDefinition, World } from './world';

/** El feature escribe 30 segundos para algo que no llega: no es un evento de la línea de tiempo. */
const VALOR_DE_LO_QUE_NO_LLEGA = 30;

const NUNCA = Number.POSITIVE_INFINITY;

function segundos(valor: string): number {
	const numero = Number(valor);
	if (valor.trim() === '' || !Number.isFinite(numero)) throw new Error(`Segundos inválidos: "${valor}"`);
	return numero;
}

const fuenteNueva = (): FuenteDeLaApertura => ({ llega: NUNCA, falla: NUNCA, guardada: false });

function apertura(world: World): AperturaDeLaApp {
	world.apertura ??= {
		sesion: false,
		sinConexion: false,
		pierdeLaConexion: NUNCA,
		auth: NUNCA,
		tareas: NUNCA,
		completados: NUNCA,
		etiquetas: NUNCA,
		atkinson: fuenteNueva(),
		noto: fuenteNueva(),
		recordaba: false,
		versionCambioElJuego: false
	};
	return world.apertura;
}

const fuenteDe = (world: World, nombre: string) => (nombre === 'Atkinson' ? apertura(world).atkinson : apertura(world).noto);

/** Una fuente guardada queda lista desde el dispositivo: es lo único que llega sin conexión. */
function estadoDeFuente(fuente: FuenteDeLaApertura, sinConexion: boolean, instante: number): EstadoDeFuente {
	if (instante >= fuente.llega) return 'lista';
	if (instante >= fuente.falla) return 'fallida';
	return sinConexion && fuente.guardada ? 'guardada' : 'sin-guardar';
}

function estadoEn(a: AperturaDeLaApp, instante: number): EstadoDeLaEspera {
	const sesionRespondida = a.sesion ? 'con-sesion' : 'sin-sesion';
	return {
		segundosDesdeElArranque: instante,
		auth: instante >= a.auth ? sesionRespondida : 'esperando',
		tareasRespondieron: instante >= a.tareas,
		completadosRespondieron: instante >= a.completados,
		etiquetasRespondieron: instante >= a.etiquetas,
		atkinson: estadoDeFuente(a.atkinson, a.sinConexion, instante),
		noto: estadoDeFuente(a.noto, a.sinConexion, instante),
		enLinea: !a.sinConexion && instante < a.pierdeLaConexion,
		recuerdaTopeDeNoto: recuerdoAlArrancar(a.recordaba, a.versionCambioElJuego)
	};
}

/** Los instantes en que puede cambiar la respuesta: el arranque, el mínimo, el tope y cada evento declarado. */
function instantes(a: AperturaDeLaApp): number[] {
	const eventos = [a.auth, a.tareas, a.completados, a.etiquetas, a.pierdeLaConexion, a.atkinson.llega, a.atkinson.falla, a.noto.llega, a.noto.falla];
	const todos = [0, MINIMO_DE_LA_PANTALLA_EN_SEGUNDOS, TOPE_DE_LA_PANTALLA_EN_SEGUNDOS, ...eventos].filter((t) => t >= 0 && t !== NUNCA);
	return [...new Set(todos)].sort((x, y) => x - y);
}

function salida(a: AperturaDeLaApp): number {
	const momento = instantes(a).find((instante) => pantallaDeCargaSeVa(estadoEn(a, instante)));
	if (momento === undefined) throw new Error('La pantalla de carga no se va nunca');
	return momento;
}

export const pantallaDeCargaSteps: StepDefinition[] = [
	{
		pattern: /^la app arranca (con|sin) sesión$/,
		run: (world, sesion) => {
			apertura(world).sesion = sesion === 'con';
		}
	},
	{
		pattern: /^no hay conexión$/,
		run: (world) => {
			apertura(world).sinConexion = true;
		}
	},
	{
		pattern: new RegExp(`^se pierde la conexión a los ${P} segundos$`),
		run: (world, perdida) => {
			apertura(world).pierdeLaConexion = segundos(perdida);
		}
	},
	{
		pattern: /^Auth responde enseguida$/,
		run: (world) => {
			apertura(world).auth = 0;
		}
	},
	{
		pattern: new RegExp(`^Auth responde a los ${P} segundos$`),
		run: (world, auth) => {
			apertura(world).auth = segundos(auth);
		}
	},
	{
		pattern: new RegExp(`^(?:las|los) (tareas|completados|etiquetas) responden a los ${P} segundos$`),
		run: (world, coleccion, momento) => {
			apertura(world)[coleccion as 'tareas' | 'completados' | 'etiquetas'] = segundos(momento);
		}
	},
	{
		pattern: new RegExp(`^los datos responden a los ${P} segundos$`),
		run: (world, momento) => {
			const a = apertura(world);
			a.tareas = a.completados = a.etiquetas = segundos(momento);
		}
	},
	{
		pattern: new RegExp(`^(Atkinson|Noto) queda list[ao] a los ${P} segundos$`),
		run: (world, nombre, momento) => {
			const llega = segundos(momento);
			const fuente = fuenteDe(world, nombre);
			fuente.guardada = true;
			fuente.llega = llega >= VALOR_DE_LO_QUE_NO_LLEGA ? NUNCA : llega;
		}
	},
	{
		pattern: new RegExp(`^(Atkinson|Noto) falla a los ${P} segundos$`),
		run: (world, nombre, momento) => {
			fuenteDe(world, nombre).falla = segundos(momento);
		}
	},
	{
		// §6: un navegador que recibe el juego y no puede dibujarlo se comporta como una falla.
		pattern: new RegExp(`^el navegador no puede dibujar Noto a los ${P} segundos$`),
		run: (world, momento) => {
			apertura(world).noto.falla = segundos(momento);
		}
	},
	{
		pattern: /^(Atkinson|Noto) no está guardad[ao]$/,
		run: (world, nombre) => {
			fuenteDe(world, nombre).guardada = false;
		}
	},
	{
		pattern: /^el dispositivo ya recordaba un tope con Noto sin bajar$/,
		run: (world) => {
			apertura(world).recordaba = true;
		}
	},
	{
		pattern: /^una versión nueva (no )?cambió el juego de emoji$/,
		run: (world, no) => {
			apertura(world).versionCambioElJuego = no === undefined;
		}
	},
	{
		pattern: new RegExp(`^la pantalla de carga se va a los ${P} segundos$`),
		run: (world, esperado) => expect(salida(apertura(world))).toBe(segundos(esperado))
	},
	{
		// El recuerdo se pregunta al irse la pantalla y otra vez si Noto queda lista después.
		pattern: /^el dispositivo (no )?recuerda un tope con Noto sin bajar$/,
		run: (world, no) => {
			const a = apertura(world);
			const momento = a.noto.llega === NUNCA ? salida(a) : Math.max(salida(a), a.noto.llega);
			expect(recuerdoDeTopeDeNoto(estadoEn(a, momento))).toBe(no === undefined);
		}
	}
];
