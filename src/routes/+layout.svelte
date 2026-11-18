<script lang="ts">
	import { onMount } from 'svelte';
	import '#lib/ui/styles.css';
	import { observeUser, type User } from '#lib/adapters/auth.ts';
	import type { AuthResponse } from '#lib/core/loading-screen.ts';
	import Login from '#lib/ui/Login.svelte';
	import LoadingScreen, { type CollectionsResponded } from '#lib/ui/LoadingScreen.svelte';
	import Session from '#lib/ui/Session.svelte';

	let { children } = $props();

	/** undefined while Auth has not answered yet. */
	let user = $state<User | null | undefined>(undefined);
	const auth = $derived<AuthResponse>(user === undefined ? 'waiting' : user ? 'signedIn' : 'signedOut');
	let data = $state.raw<CollectionsResponded>({ tasks: false, completions: false });
	/** Spec §6.6: once per launch; signing in with Google does not show it again. */
	let loading = $state(true);

	onMount(() => observeUser((current) => (user = current)));
</script>

<LoadingScreen {auth} {data} onLeave={() => (loading = false)} />

<!-- What is mounted behind the loading screen cannot be seen or touched until it leaves. -->
<main style:visibility={loading ? 'hidden' : undefined}>
	{#if user === null}
		<Login />
	{:else if user}
		<!-- The session lives in the layout: the data and the notice follow the change of screen. -->
		{#key user.uid}
			<Session uid={user.uid} onCollectionsResponded={(responded) => (data = responded)}>{@render children()}</Session>
		{/key}
	{/if}
</main>
