<script lang="ts" module>
	export interface CollectionsResponded {
		tasks: boolean;
		completions: boolean;
	}
</script>

<script lang="ts">
	// Spec §6.6: la pantalla se dibuja en src/app.html, antes de que corra el JavaScript. Este
	// componente le cuenta al core cómo va la espera y la quita cuando el core dice que se va.
	import { onMount } from 'svelte';
	import { observeConnection } from '#lib/adapters/connection.ts';
	import { loadFonts, type FontsStatus } from '#lib/adapters/fonts.ts';
	import {
		saveNotoLimitMemory,
		readNotoLimitMemory,
		removeLoadingScreen,
		secondsSinceStart
	} from '#lib/adapters/loading-screen.ts';
	import {
		loadingScreenLeaves,
		nextScreenLimit,
		notoLimitMemory,
		type WaitStatus,
		type AuthResponse
	} from '#lib/core/loading-screen.ts';

	let { auth, data, onLeave }: { auth: AuthResponse; data: CollectionsResponded; onLeave: () => void } = $props();

	/** Hasta saber si están en el dispositivo, se esperan como si estuvieran. */
	let fonts = $state<FontsStatus>({ atkinson: 'guardada', noto: 'guardada' });
	let online = $state(true);
	let hasLeft = $state(false);
	/** Spec §6.6: vale para toda la apertura, aunque Noto quede guardado mientras tanto. */
	const remembersNotoLimit = readNotoLimitMemory();
	let timer: ReturnType<typeof setTimeout> | undefined;

	const waitStatus = (): WaitStatus => ({
		secondsSinceStart: secondsSinceStart(),
		auth,
		tasksResponded: data.tasks,
		completionsResponded: data.completions,
		atkinson: fonts.atkinson,
		noto: fonts.noto,
		online,
		remembersNotoLimit
	});

	function leaveIfDue() {
		if (hasLeft) return;
		const status = waitStatus();
		if (!loadingScreenLeaves(status)) return;
		hasLeft = true;
		saveNotoLimitMemory(notoLimitMemory(status));
		removeLoadingScreen();
		onLeave();
	}

	/** Cada cambio de la espera se pregunta en el efecto; el paso del tiempo, al llegar el mínimo y el tope. */
	function scheduleNextLimit(): ReturnType<typeof setTimeout> | undefined {
		const seconds = secondsSinceStart();
		const limit = nextScreenLimit(seconds);
		if (limit === undefined) return undefined;
		return setTimeout(
			() => {
				leaveIfDue();
				if (!hasLeft) timer = scheduleNextLimit();
			},
			Math.ceil((limit - seconds) * 1000)
		);
	}

	onMount(() => {
		loadFonts((change) => (fonts = { ...fonts, ...change }));
		timer = scheduleNextLimit();
		const stopObserving = observeConnection((current) => (online = current));
		return () => {
			clearTimeout(timer);
			stopObserving();
		};
	});

	$effect(leaveIfDue);

	// Spec §6.6: lo recordado se olvida cuando Noto queda guardado, también después de irse la pantalla.
	$effect(() => {
		if (hasLeft && fonts.noto === 'lista') saveNotoLimitMemory(notoLimitMemory(waitStatus()));
	});
</script>
