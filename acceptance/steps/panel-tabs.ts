// Panel en pestañas (spec §6.2): la presentación según el ancho, las secciones
// según el modo, las pestañas marcadas por error, el destino al fallar Guardar
// y la barra de Guardar con el teclado en pantalla.
import { expect } from 'vitest';
import {
	TAB_ON_OPEN,
	saveBarVisible,
	destinationOnSaveFailure,
	panelPresentation,
	panelSections,
	markedSections,
	type FieldWithError,
	type PanelMode,
	type PanelPresentation,
	type PanelSection
} from '../../src/lib/core/panel-tabs';
import { P, numeric } from './values';
import type { StepDefinition, World } from './world';

/** Lo que el escenario declaró del panel; vive lo que vive su World. */
interface PanelDeclared {
	widthRem?: number;
	mode?: PanelMode;
	fieldsWithError?: FieldWithError[];
	savedFields?: FieldWithError[];
	keyboardOpen?: boolean;
}

const declaredByWorld = new WeakMap<World, PanelDeclared>();

function declaredOf(world: World): PanelDeclared {
	const declared = declaredByWorld.get(world) ?? {};
	declaredByWorld.set(world, declared);
	return declared;
}

function requireDeclared<T>(value: T | undefined, that: string): T {
	if (value === undefined) throw new Error(`El escenario no declaró ${that}`);
	return value;
}

/** Un valor malformado falla el escenario: nada se interpreta por parecido. */
function oneOf<T extends string>(allowedValues: readonly T[], value: string, that: string): T {
	const allowedValue = allowedValues.find((p) => p === value);
	if (allowedValue === undefined) throw new Error(`${that} inválido: "${value}"`);
	return allowedValue;
}

const FIELDS: readonly FieldWithError[] = ['Título', 'fecha límite', 'Cada', 'días', 'horario'];
const SECTIONS: readonly PanelSection[] = ['Tarea', 'Cuándo', 'Acciones'];
const MODES: readonly PanelMode[] = ['crear', 'editar'];
const FOCUSES = ['un campo está enfocado', 'ningún campo está enfocado'] as const;

const PRESENTATIONS: Record<string, PanelPresentation> = { 'en pestañas': 'pestanas', 'en secciones seguidas': 'secciones' };
const KEYBOARDS: Record<string, boolean> = { abierto: true, cerrado: false };
const BARS: Record<string, boolean> = { visible: true, oculta: false };

function ofTable<T>(table: Record<string, T>, value: string, that: string): T {
	return table[oneOf(Object.keys(table), value, that)];
}

const list = (value: string) => value.split(',').map((part) => part.trim());

function fieldsOf(value: string): FieldWithError[] {
	return value === 'ninguno' ? [] : list(value).map((field) => oneOf(FIELDS, field, 'Campo'));
}

function sectionsOf(value: string): PanelSection[] {
	return list(value).map((section) => oneOf(SECTIONS, section, 'Sección'));
}

function widthOf(value: string): number {
	const width = numeric(value);
	if (width <= 0) throw new Error(`Ancho de pantalla inválido: "${value}"`);
	return width;
}

function targetOf(world: World) {
	const declared = declaredOf(world);
	const presentation = panelPresentation(requireDeclared(declared.widthRem, 'el ancho de la pantalla'));
	const target = destinationOnSaveFailure(requireDeclared(declared.savedFields, 'el guardado que falla'), presentation);
	return requireDeclared(target, 'un guardado con errores');
}

export const panelTabsSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^una pantalla de ${P} rem de ancho$`),
		run: (world, width) => {
			declaredOf(world).widthRem = widthOf(width);
		}
	},
	{
		pattern: new RegExp(`^el panel se presenta ${P}$`),
		run: (world, presentation) => {
			const width = requireDeclared(declaredOf(world).widthRem, 'el ancho de la pantalla');
			expect(panelPresentation(width)).toBe(ofTable(PRESENTATIONS, presentation, 'Presentación'));
		}
	},
	{
		pattern: new RegExp(`^el panel se abre para ${P}$`),
		run: (world, mode) => {
			declaredOf(world).mode = oneOf(MODES, mode, 'Modo');
		}
	},
	{
		pattern: new RegExp(`^el panel ofrece las secciones ${P}$`),
		run: (world, sections) => {
			expect(panelSections(requireDeclared(declaredOf(world).mode, 'el modo del panel'))).toEqual(sectionsOf(sections));
		}
	},
	{
		pattern: new RegExp(`^la pestaña abierta es ${P}$`),
		run: (world, opened) => {
			requireDeclared(declaredOf(world).mode, 'el modo del panel');
			expect(TAB_ON_OPEN).toBe(oneOf(SECTIONS, opened, 'Sección'));
		}
	},
	{
		pattern: new RegExp(`^el panel muestra errores en los campos ${P}$`),
		run: (world, fields) => {
			declaredOf(world).fieldsWithError = fieldsOf(fields);
		}
	},
	{
		pattern: new RegExp(`^las secciones marcadas son ${P}$`),
		run: (world, marked) => {
			const expected = marked === 'ninguna' ? [] : sectionsOf(marked);
			expect(markedSections(requireDeclared(declaredOf(world).fieldsWithError, 'los campos con error'))).toEqual(expected);
		}
	},
	{
		pattern: new RegExp(`^el guardado falla con errores en los campos ${P}$`),
		run: (world, fields) => {
			declaredOf(world).savedFields = fieldsOf(fields);
		}
	},
	{
		pattern: new RegExp(`^el panel salta a la pestaña ${P}$`),
		run: (world, tab) => {
			const expected = tab === 'ninguna' ? undefined : oneOf(SECTIONS, tab, 'Sección');
			expect(targetOf(world).tab).toBe(expected);
		}
	},
	{
		pattern: new RegExp(`^el contenido se desplaza hasta el campo ${P}$`),
		run: (world, field) => {
			expect(targetOf(world).field).toBe(oneOf(FIELDS, field, 'Campo'));
		}
	},
	{
		pattern: new RegExp(`^el teclado en pantalla está ${P}$`),
		run: (world, keyboard) => {
			declaredOf(world).keyboardOpen = ofTable(KEYBOARDS, keyboard, 'Teclado');
		}
	},
	{
		// §6.2: la barra depende del teclado y no del foco; por eso el foco solo se valida.
		pattern: new RegExp(`^el foco está ${P}$`),
		run: (_world, focus) => {
			oneOf(FOCUSES, focus, 'Foco');
		}
	},
	{
		pattern: new RegExp(`^la barra de Guardar está ${P}$`),
		run: (world, bar) => {
			const keyboardOpen = requireDeclared(declaredOf(world).keyboardOpen, 'el teclado en pantalla');
			expect(saveBarVisible(keyboardOpen)).toBe(ofTable(BARS, bar, 'Barra'));
		}
	}
];
