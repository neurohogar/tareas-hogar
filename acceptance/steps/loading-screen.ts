// When the loading screen goes away and what the device remembers (spec §6.6). The
// steps declare when each thing arrives in seconds since startup; the Thens
// ask the core for the state at each instant where something changes.
import { expect } from 'vitest';
import {
	SCREEN_MINIMUM_IN_SECONDS,
	SCREEN_LIMIT_IN_SECONDS,
	loadingScreenLeaves,
	rememberedOnStart,
	notoLimitMemory,
	type FontStatus,
	type WaitStatus
} from '../../src/lib/core/loading-screen';
import { P } from './values';
import type { AppOpening, OpeningFont, StepDefinition, World } from './world';

/** The feature writes 30 seconds for something that never arrives: it is not a timeline event. */
const VALUE_OF_THAT_NOT_ARRIVES = 30;

const NEVER = Number.POSITIVE_INFINITY;

function seconds(value: string): number {
	const numeric = Number(value);
	if (value.trim() === '' || !Number.isFinite(numeric)) throw new Error(`Invalid seconds: "${value}"`);
	return numeric;
}

const fontNew = (): OpeningFont => ({ arrives: NEVER, failure: NEVER, saved: false });

const COLLECTION = { tareas: 'tasks', completados: 'completions' } as const;

function opening(world: World): AppOpening {
	world.opening ??= {
		session: false,
		withoutConnection: false,
		losesConnection: NEVER,
		auth: NEVER,
		tasks: NEVER,
		completions: NEVER,
		atkinson: fontNew(),
		noto: fontNew(),
		remembered: false,
		versionChangeSet: false
	};
	return world.opening;
}

const fontOf = (world: World, name: string) => (name === 'Atkinson' ? opening(world).atkinson : opening(world).noto);

/** A stored font is ready from the device: it is the only thing that arrives offline. */
function fontStatus(font: OpeningFont, withoutConnection: boolean, instant: number): FontStatus {
	if (instant >= font.arrives) return 'lista';
	if (instant >= font.failure) return 'fallida';
	return withoutConnection && font.saved ? 'guardada' : 'sin-guardar';
}

function statusIn(a: AppOpening, instant: number): WaitStatus {
	const sessionAnswered = a.session ? 'con-sesion' : 'sin-sesion';
	return {
		secondsSinceStart: instant,
		auth: instant >= a.auth ? sessionAnswered : 'esperando',
		tasksResponded: instant >= a.tasks,
		completionsResponded: instant >= a.completions,
		atkinson: fontStatus(a.atkinson, a.withoutConnection, instant),
		noto: fontStatus(a.noto, a.withoutConnection, instant),
		online: !a.withoutConnection && instant < a.losesConnection,
		remembersNotoLimit: rememberedOnStart(a.remembered, a.versionChangeSet)
	};
}

/** The instants at which the answer can change: startup, the minimum, the cap and each declared event. */
function instants(a: AppOpening): number[] {
	const events = [a.auth, a.tasks, a.completions, a.losesConnection, a.atkinson.arrives, a.atkinson.failure, a.noto.arrives, a.noto.failure];
	const all = [0, SCREEN_MINIMUM_IN_SECONDS, SCREEN_LIMIT_IN_SECONDS, ...events].filter((t) => t >= 0 && t !== NEVER);
	return [...new Set(all)].sort((x, y) => x - y);
}

function output(a: AppOpening): number {
	const moment = instants(a).find((instant) => loadingScreenLeaves(statusIn(a, instant)));
	if (moment === undefined) throw new Error('The loading screen never goes away');
	return moment;
}

export const loadingScreenSteps: StepDefinition[] = [
	{
		pattern: /^la app arranca (con|sin) sesión$/,
		run: (world, session) => {
			opening(world).session = session === 'con';
		}
	},
	{
		pattern: /^no hay conexión$/,
		run: (world) => {
			opening(world).withoutConnection = true;
		}
	},
	{
		pattern: new RegExp(`^se pierde la conexión a los ${P} segundos$`),
		run: (world, lost) => {
			opening(world).losesConnection = seconds(lost);
		}
	},
	{
		pattern: /^Auth responde enseguida$/,
		run: (world) => {
			opening(world).auth = 0;
		}
	},
	{
		pattern: new RegExp(`^Auth responde a los ${P} segundos$`),
		run: (world, auth) => {
			opening(world).auth = seconds(auth);
		}
	},
	{
		pattern: new RegExp(`^(?:las|los) (tareas|completados) responden a los ${P} segundos$`),
		run: (world, collection, moment) => {
			opening(world)[COLLECTION[collection as 'tareas' | 'completados']] = seconds(moment);
		}
	},
	{
		pattern: new RegExp(`^los datos responden a los ${P} segundos$`),
		run: (world, moment) => {
			const a = opening(world);
			a.tasks = a.completions = seconds(moment);
		}
	},
	{
		pattern: new RegExp(`^(Atkinson|Noto) queda list[ao] a los ${P} segundos$`),
		run: (world, name, moment) => {
			const arrives = seconds(moment);
			const font = fontOf(world, name);
			font.saved = true;
			font.arrives = arrives >= VALUE_OF_THAT_NOT_ARRIVES ? NEVER : arrives;
		}
	},
	{
		pattern: new RegExp(`^(Atkinson|Noto) falla a los ${P} segundos$`),
		run: (world, name, moment) => {
			fontOf(world, name).failure = seconds(moment);
		}
	},
	{
		// §6: a browser that receives the font set and cannot draw it behaves like a failure.
		pattern: new RegExp(`^el navegador no puede dibujar Noto a los ${P} segundos$`),
		run: (world, moment) => {
			opening(world).noto.failure = seconds(moment);
		}
	},
	{
		pattern: /^(Atkinson|Noto) no está guardad[ao]$/,
		run: (world, name) => {
			fontOf(world, name).saved = false;
		}
	},
	{
		pattern: /^el dispositivo ya recordaba un tope con Noto sin bajar$/,
		run: (world) => {
			opening(world).remembered = true;
		}
	},
	{
		pattern: /^una versión nueva (no )?cambió el juego de emoji$/,
		run: (world, no) => {
			opening(world).versionChangeSet = no === undefined;
		}
	},
	{
		pattern: new RegExp(`^la pantalla de carga se va a los ${P} segundos$`),
		run: (world, expected) => expect(output(opening(world))).toBe(seconds(expected))
	},
	{
		// The memory is queried when the screen goes away and again if Noto becomes ready afterwards.
		pattern: /^el dispositivo (no )?recuerda un tope con Noto sin bajar$/,
		run: (world, no) => {
			const a = opening(world);
			const moment = a.noto.arrives === NEVER ? output(a) : Math.max(output(a), a.noto.arrives);
			expect(notoLimitMemory(statusIn(a, moment))).toBe(no === undefined);
		}
	}
];
