// Panel en pestañas (spec §6.2): la presentación según el ancho, las secciones
// según el modo, las pestañas marcadas por error, el destino al fallar Guardar
// y la barra de Guardar con el teclado en pantalla.
import { expect } from 'vitest';
import {
	PESTANA_AL_ABRIR,
	barraDeGuardarVisible,
	destinoAlFallarGuardar,
	presentacionDelPanel,
	seccionesDelPanel,
	seccionesMarcadas,
	type CampoConError,
	type ModoDelPanel,
	type PresentacionDelPanel,
	type SeccionDelPanel
} from '../../src/lib/core/panel-en-pestanas';
import { P, numero } from './valores';
import type { StepDefinition, World } from './world';

/** Lo que el escenario declaró del panel; vive lo que vive su World. */
interface DeclaradoDelPanel {
	anchoRem?: number;
	modo?: ModoDelPanel;
	camposConError?: CampoConError[];
	camposDelGuardado?: CampoConError[];
	tecladoAbierto?: boolean;
}

const declarados = new WeakMap<World, DeclaradoDelPanel>();

function declaradoDe(world: World): DeclaradoDelPanel {
	const declarado = declarados.get(world) ?? {};
	declarados.set(world, declarado);
	return declarado;
}

function declarada<T>(valor: T | undefined, que: string): T {
	if (valor === undefined) throw new Error(`El escenario no declaró ${que}`);
	return valor;
}

/** Un valor malformado falla el escenario: nada se interpreta por parecido. */
function unoDe<T extends string>(permitidos: readonly T[], valor: string, que: string): T {
	const permitido = permitidos.find((p) => p === valor);
	if (permitido === undefined) throw new Error(`${que} inválido: "${valor}"`);
	return permitido;
}

const CAMPOS: readonly CampoConError[] = ['Título', 'Etiquetas', 'fecha límite', 'Cada', 'días', 'horario'];
const SECCIONES: readonly SeccionDelPanel[] = ['Tarea', 'Cuándo', 'Acciones'];
const MODOS: readonly ModoDelPanel[] = ['crear', 'editar'];
const FOCOS = ['un campo está enfocado', 'ningún campo está enfocado'] as const;

const PRESENTACIONES: Record<string, PresentacionDelPanel> = { 'en pestañas': 'pestanas', 'en secciones seguidas': 'secciones' };
const TECLADOS: Record<string, boolean> = { abierto: true, cerrado: false };
const BARRAS: Record<string, boolean> = { visible: true, oculta: false };

function deLaTabla<T>(tabla: Record<string, T>, valor: string, que: string): T {
	return tabla[unoDe(Object.keys(tabla), valor, que)];
}

const lista = (valor: string) => valor.split(',').map((parte) => parte.trim());

function camposDe(valor: string): CampoConError[] {
	return valor === 'ninguno' ? [] : lista(valor).map((campo) => unoDe(CAMPOS, campo, 'Campo'));
}

function seccionesDe(valor: string): SeccionDelPanel[] {
	return lista(valor).map((seccion) => unoDe(SECCIONES, seccion, 'Sección'));
}

function anchoDe(valor: string): number {
	const ancho = numero(valor);
	if (ancho <= 0) throw new Error(`Ancho de pantalla inválido: "${valor}"`);
	return ancho;
}

function destinoDe(world: World) {
	const declarado = declaradoDe(world);
	const presentacion = presentacionDelPanel(declarada(declarado.anchoRem, 'el ancho de la pantalla'));
	const destino = destinoAlFallarGuardar(declarada(declarado.camposDelGuardado, 'el guardado que falla'), presentacion);
	return declarada(destino, 'un guardado con errores');
}

export const panelPestanasSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^una pantalla de ${P} rem de ancho$`),
		run: (world, ancho) => {
			declaradoDe(world).anchoRem = anchoDe(ancho);
		}
	},
	{
		pattern: new RegExp(`^el panel se presenta ${P}$`),
		run: (world, presentacion) => {
			const ancho = declarada(declaradoDe(world).anchoRem, 'el ancho de la pantalla');
			expect(presentacionDelPanel(ancho)).toBe(deLaTabla(PRESENTACIONES, presentacion, 'Presentación'));
		}
	},
	{
		pattern: new RegExp(`^el panel se abre para ${P}$`),
		run: (world, modo) => {
			declaradoDe(world).modo = unoDe(MODOS, modo, 'Modo');
		}
	},
	{
		pattern: new RegExp(`^el panel ofrece las secciones ${P}$`),
		run: (world, secciones) => {
			expect(seccionesDelPanel(declarada(declaradoDe(world).modo, 'el modo del panel'))).toEqual(seccionesDe(secciones));
		}
	},
	{
		pattern: new RegExp(`^la pestaña abierta es ${P}$`),
		run: (world, abierta) => {
			declarada(declaradoDe(world).modo, 'el modo del panel');
			expect(PESTANA_AL_ABRIR).toBe(unoDe(SECCIONES, abierta, 'Sección'));
		}
	},
	{
		pattern: new RegExp(`^el panel muestra errores en los campos ${P}$`),
		run: (world, campos) => {
			declaradoDe(world).camposConError = camposDe(campos);
		}
	},
	{
		pattern: new RegExp(`^las secciones marcadas son ${P}$`),
		run: (world, marcadas) => {
			const esperadas = marcadas === 'ninguna' ? [] : seccionesDe(marcadas);
			expect(seccionesMarcadas(declarada(declaradoDe(world).camposConError, 'los campos con error'))).toEqual(esperadas);
		}
	},
	{
		pattern: new RegExp(`^el guardado falla con errores en los campos ${P}$`),
		run: (world, campos) => {
			declaradoDe(world).camposDelGuardado = camposDe(campos);
		}
	},
	{
		pattern: new RegExp(`^el panel salta a la pestaña ${P}$`),
		run: (world, pestana) => {
			const esperada = pestana === 'ninguna' ? undefined : unoDe(SECCIONES, pestana, 'Sección');
			expect(destinoDe(world).pestana).toBe(esperada);
		}
	},
	{
		pattern: new RegExp(`^el contenido se desplaza hasta el campo ${P}$`),
		run: (world, campo) => {
			expect(destinoDe(world).campo).toBe(unoDe(CAMPOS, campo, 'Campo'));
		}
	},
	{
		pattern: new RegExp(`^el teclado en pantalla está ${P}$`),
		run: (world, teclado) => {
			declaradoDe(world).tecladoAbierto = deLaTabla(TECLADOS, teclado, 'Teclado');
		}
	},
	{
		// §6.2: la barra depende del teclado y no del foco; por eso el foco solo se valida.
		pattern: new RegExp(`^el foco está ${P}$`),
		run: (_world, foco) => {
			unoDe(FOCOS, foco, 'Foco');
		}
	},
	{
		pattern: new RegExp(`^la barra de Guardar está ${P}$`),
		run: (world, barra) => {
			const tecladoAbierto = declarada(declaradoDe(world).tecladoAbierto, 'el teclado en pantalla');
			expect(barraDeGuardarVisible(tecladoAbierto)).toBe(deLaTabla(BARRAS, barra, 'Barra'));
		}
	}
];
