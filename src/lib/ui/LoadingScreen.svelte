<script lang="ts" module>
	export interface CollectionsResponded {
		tasks: boolean;
		completions: boolean;
	}
</script>

<script lang="ts">
	// Spec §6.6: the screen is drawn in src/app.html, before JavaScript runs. This
	// component tells the core how the wait is going and removes it when the core says it leaves.
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

	/** Until it is known whether they are on the device, they are awaited as if they were. */
	let fonts = $state<FontsStatus>({ atkinson: 'saved', noto: 'saved' });
	let online = $state(true);
	let hasLeft = $state(false);
	/** Spec §6.6: holds for the whole launch, even if Noto ends up stored meanwhile. */
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

	/** Each change of the wait is asked about in the effect; the passing of time, on reaching the minimum and the cap. */
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

	// Spec §6.6: what is remembered is forgotten when Noto ends up stored, also after the screen has gone.
	$effect(() => {
		if (hasLeft && fonts.noto === 'ready') saveNotoLimitMemory(notoLimitMemory(waitStatus()));
	});
</script>
