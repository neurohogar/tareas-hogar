<script lang="ts" module>
	export interface DatosRespondieron {
		tareas: boolean;
		completados: boolean;
		etiquetas: boolean;
	}
</script>

<script lang="ts">
	// Spec §6.6: la pantalla se dibuja en src/app.html, antes de que corra el JavaScript. Este
	// componente le cuenta al core cómo va la espera y la quita cuando el core dice que se va.
	import { onMount } from 'svelte';
	import { observarConexion } from '#lib/adapters/connection.ts';
	import { cargarFuentes, type EstadoDeLasFuentes } from '#lib/adapters/fonts.ts';
	import {
		guardarRecuerdoDeTopeDeNoto,
		leerRecuerdoDeTopeDeNoto,
		quitarPantallaDeCarga,
		segundosDesdeElArranque
	} from '#lib/adapters/loading-screen.ts';
	import {
		loadingScreenLeaves,
		nextScreenLimit,
		notoLimitMemory,
		type WaitStatus,
		type AuthResponse
	} from '#lib/core/loading-screen.ts';

	let { auth, datos, alIrse }: { auth: AuthResponse; datos: DatosRespondieron; alIrse: () => void } = $props();

	/** Hasta saber si están en el dispositivo, se esperan como si estuvieran. */
	let fuentes = $state<EstadoDeLasFuentes>({ atkinson: 'guardada', noto: 'guardada' });
	let enLinea = $state(true);
	let seFue = $state(false);
	/** Spec §6.6: vale para toda la apertura, aunque Noto quede guardado mientras tanto. */
	const recuerdaTopeDeNoto = leerRecuerdoDeTopeDeNoto();
	let temporizador: ReturnType<typeof setTimeout> | undefined;

	const estadoDeLaEspera = (): WaitStatus => ({
		secondsSinceStart: segundosDesdeElArranque(),
		auth,
		tasksResponded: datos.tareas,
		completionsResponded: datos.completados,
		labelsResponded: datos.etiquetas,
		atkinson: fuentes.atkinson,
		noto: fuentes.noto,
		online: enLinea,
		remembersNotoLimit: recuerdaTopeDeNoto
	});

	function irseSiCorresponde() {
		if (seFue) return;
		const estado = estadoDeLaEspera();
		if (!loadingScreenLeaves(estado)) return;
		seFue = true;
		guardarRecuerdoDeTopeDeNoto(notoLimitMemory(estado));
		quitarPantallaDeCarga();
		alIrse();
	}

	/** Cada cambio de la espera se pregunta en el efecto; el paso del tiempo, al llegar el mínimo y el tope. */
	function programarProximoLimite(): ReturnType<typeof setTimeout> | undefined {
		const segundos = segundosDesdeElArranque();
		const limite = nextScreenLimit(segundos);
		if (limite === undefined) return undefined;
		return setTimeout(
			() => {
				irseSiCorresponde();
				if (!seFue) temporizador = programarProximoLimite();
			},
			Math.ceil((limite - segundos) * 1000)
		);
	}

	onMount(() => {
		cargarFuentes((cambio) => (fuentes = { ...fuentes, ...cambio }));
		temporizador = programarProximoLimite();
		const dejarDeObservar = observarConexion((actual) => (enLinea = actual));
		return () => {
			clearTimeout(temporizador);
			dejarDeObservar();
		};
	});

	$effect(irseSiCorresponde);

	// Spec §6.6: lo recordado se olvida cuando Noto queda guardado, también después de irse la pantalla.
	$effect(() => {
		if (seFue && fuentes.noto === 'lista') guardarRecuerdoDeTopeDeNoto(notoLimitMemory(estadoDeLaEspera()));
	});
</script>
