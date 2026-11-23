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


function opening(world: World): AppOpening {
	world.opening ??= {
		session: false,
		withoutConnection: false,
		losesConnection: NEVER,
		auth: NEVER,
		tasks: NEVER,
		completions: NEVER,
		minimalMode: 0,
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
	if (instant >= font.arrives) return 'ready';
	if (instant >= font.failure) return 'failed';
	return withoutConnection && font.saved ? 'saved' : 'unsaved';
}

function statusIn(a: AppOpening, instant: number): WaitStatus {
	const sessionAnswered = a.session ? 'signedIn' : 'signedOut';
	return {
		secondsSinceStart: instant,
		auth: instant >= a.auth ? sessionAnswered : 'waiting',
		tasksResponded: instant >= a.tasks,
		completionsResponded: instant >= a.completions,
		minimalModeResponded: instant >= a.minimalMode,
		atkinson: fontStatus(a.atkinson, a.withoutConnection, instant),
		noto: fontStatus(a.noto, a.withoutConnection, instant),
		online: !a.withoutConnection && instant < a.losesConnection,
		remembersNotoLimit: rememberedOnStart(a.remembered, a.versionChangeSet)
	};
}

/** The instants at which the answer can change: startup, the minimum, the cap and each declared event. */
function instants(a: AppOpening): number[] {
	const events = [a.auth, a.tasks, a.completions, a.minimalMode, a.losesConnection, a.atkinson.arrives, a.atkinson.failure, a.noto.arrives, a.noto.failure];
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
		pattern: /^the app starts (with|without) a session$/,
		run: (world, session) => {
			opening(world).session = session === 'with';
		}
	},
	{
		pattern: /^there is no connection$/,
		run: (world) => {
			opening(world).withoutConnection = true;
		}
	},
	{
		pattern: new RegExp(`^the connection is lost at ${P} seconds$`),
		run: (world, lost) => {
			opening(world).losesConnection = seconds(lost);
		}
	},
	{
		pattern: /^Auth responds immediately$/,
		run: (world) => {
			opening(world).auth = 0;
		}
	},
	{
		pattern: new RegExp(`^Auth responds at ${P} seconds$`),
		run: (world, auth) => {
			opening(world).auth = seconds(auth);
		}
	},
	{
		pattern: new RegExp(`^the (tasks|completions) respond at ${P} seconds$`),
		run: (world, collection, moment) => {
			opening(world)[collection as 'tasks' | 'completions'] = seconds(moment);
		}
	},
	{
		pattern: new RegExp(`^the minimal mode responds at ${P} seconds$`),
		run: (world, moment) => {
			opening(world).minimalMode = seconds(moment);
		}
	},
	{
		pattern: new RegExp(`^the data responds at ${P} seconds$`),
		run: (world, moment) => {
			const a = opening(world);
			a.tasks = a.completions = seconds(moment);
		}
	},
	{
		pattern: new RegExp(`^(Atkinson|Noto) is ready at ${P} seconds$`),
		run: (world, name, moment) => {
			const arrives = seconds(moment);
			const font = fontOf(world, name);
			font.saved = true;
			font.arrives = arrives >= VALUE_OF_THAT_NOT_ARRIVES ? NEVER : arrives;
		}
	},
	{
		pattern: new RegExp(`^(Atkinson|Noto) fails at ${P} seconds$`),
		run: (world, name, moment) => {
			fontOf(world, name).failure = seconds(moment);
		}
	},
	{
		// §6: a browser that receives the font set and cannot draw it behaves like a failure.
		pattern: new RegExp(`^the browser cannot draw Noto at ${P} seconds$`),
		run: (world, moment) => {
			opening(world).noto.failure = seconds(moment);
		}
	},
	{
		pattern: /^(Atkinson|Noto) is not saved$/,
		run: (world, name) => {
			fontOf(world, name).saved = false;
		}
	},
	{
		pattern: /^the device already remembered a cap with Noto not downloaded$/,
		run: (world) => {
			opening(world).remembered = true;
		}
	},
	{
		pattern: /^a new version (changed|did not change) the emoji set$/,
		run: (world, change) => {
			opening(world).versionChangeSet = change === 'changed';
		}
	},
	{
		pattern: new RegExp(`^the loading screen goes away at ${P} seconds$`),
		run: (world, expected) => expect(output(opening(world))).toBe(seconds(expected))
	},
	{
		// The memory is queried when the screen goes away and again if Noto becomes ready afterwards.
		pattern: /^the device (does not remember|remembers) a cap with Noto not downloaded$/,
		run: (world, remembers) => {
			const a = opening(world);
			const moment = a.noto.arrives === NEVER ? output(a) : Math.max(output(a), a.noto.arrives);
			expect(notoLimitMemory(statusIn(a, moment))).toBe(remembers === 'remembers');
		}
	}
];
