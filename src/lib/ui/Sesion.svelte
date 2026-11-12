<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { page } from '$app/state';
	import {
		borrarAnotacion,
		cambiarTextoDeAnotacion,
		guardarAnotacion,
		limpiarAnotacionesHuerfanas,
		observarAnotaciones
	} from '#lib/adapters/anotaciones.ts';
	import { nuevoId } from '#lib/adapters/ids.ts';
	import { ahora as horaActual, observarReloj } from '#lib/adapters/reloj.ts';
	import {
		borrarCompletado,
		borrarEtiqueta,
		borrarTarea,
		cambiarEtiqueta,
		fusionarEtiquetas,
		guardarCambio,
		guardarCompletado,
		guardarTarea,
		limpiarHuerfanos,
		limpiarReferencias,
		observarCompletados,
		observarEtiquetas,
		observarTareas
	} from '#lib/adapters/repositorio.ts';
	import { avisoAlCompletar, avisoVisible, completadoADeshacer, msHastaQueVence, type Aviso } from '#lib/core/aviso.ts';
	import { anotar, type Anotacion, type PantallaActual, type Sentido } from '#lib/core/anotacion.ts';
	import { anotacionesHuerfanas, borrado, completadosHuerfanos, existeTarea } from '#lib/core/borrado.ts';
	import { borradoDeEtiqueta, referenciasRotas } from '#lib/core/borrado-de-etiqueta.ts';
	import { accionDelCheckbox } from '#lib/core/checkbox.ts';
	import { completar } from '#lib/core/completados.ts';
	import { accionDePausa } from '#lib/core/pausa.ts';
	import { accionDePosponer, textoDePosposicion } from '#lib/core/posposicion-en-panel.ts';
	import { datosDeTarea } from '#lib/core/datos-de-tarea.ts';
	import type { FormularioDelPanel } from '#lib/core/cambios-sin-guardar.ts';
	import { crearDesdePanel, editarDesdePanel } from '#lib/core/cambios-sin-guardar-guardado.ts';
	import type { Etiqueta } from '#lib/core/etiqueta.ts';
	import { etiquetasDeTarea } from '#lib/core/etiquetas-de-tarea.ts';
	import { fusionDeDuplicadas } from '#lib/core/fusion-de-etiquetas.ts';
	import { renombrar } from '#lib/core/gestion-de-etiquetas.ts';
	import type { CambioDeTarea } from '#lib/core/documento-de-tarea.ts';
	import type { Completado, Tarea } from '#lib/core/tarea.ts';
	import { ultimaVez } from '#lib/core/ultima-vez.ts';
	import AvisoDeshacer from './AvisoDeshacer.svelte';
	import FranjaSinConexion from './FranjaSinConexion.svelte';
	import Anotar from './Anotar.svelte';
	import Navegacion from './Navegacion.svelte';
	import PanelTarea from './PanelTarea.svelte';
	import type { DatosRespondieron } from './PantallaDeCarga.svelte';
	import { compartirSesion } from './sesion';

	let {
		uid,
		alResponderDatos,
		children
	}: { uid: string; alResponderDatos: (respondieron: DatosRespondieron) => void; children: Snippet } = $props();

	let tareas = $state<Tarea[]>([]);
	let completados = $state<Completado[]>([]);
	let etiquetas = $state<Etiqueta[]>([]);
	let anotaciones = $state<Anotacion[]>([]);
	let anotacionesCargadas = $state(false);
	/** El recuadro de Anotar (§5.10) y el panel de edición abierto, si lo hay (con su tarea al editar). */
	let anotando = $state(false);
	let panel = $state.raw<{ tareaId?: string } | undefined>(undefined);
	const anotacionesEnLimpieza = new Set<string>();
	/** Hasta que las colecciones respondieron, faltar una tarea o una etiqueta no significa que se borró. */
	let tareasCargadas = $state(false);
	let completadosCargados = $state(false);
	let etiquetasCargadas = $state(false);
	/** El filtro de Pendientes (id de etiqueta; sin él, "Todas"): sigue al cambiar de pantalla, no al recargar. */
	let filtro = $state<string | undefined>(undefined);
	let soloRapidas = $state(false);
	let ahora = $state(horaActual());
	/** El aviso del último completado de este dispositivo; sigue al cambiar de pantalla. */
	let aviso = $state.raw<Aviso | undefined>(undefined);
	const avisoQueSeVe = $derived(avisoVisible(aviso, ahora));
	/**
	 * La tarea abierta en el panel de edición, como estaba al abrirlo: la edición
	 * se compara con ella, así solo se escriben los campos que cambié.
	 */
	let editada = $state.raw<Tarea | undefined>(undefined);
	/** Si la tarea se borra (por ejemplo, en otro dispositivo) el panel se cierra solo. */
	const editadaExiste = $derived(editada !== undefined && existeTarea(tareas, editada.id));
	/** Huérfanos que ya se mandaron a limpiar, para no repetirlos en cada snapshot. */
	const huerfanosEnLimpieza = new Set<string>();
	/** Referencias rotas y etiquetas duplicadas que ya se mandaron a resolver. */
	const referenciasEnLimpieza = new Set<string>();
	const etiquetasEnFusion = new Set<string>();

	onMount(() => {
		const cancelar = [
			observarTareas(uid, (actuales) => {
				tareas = actuales;
				tareasCargadas = true;
			}),
			observarCompletados(uid, (actuales) => {
				completados = actuales;
				completadosCargados = true;
			}),
			observarEtiquetas(uid, (actuales) => {
				etiquetas = actuales;
				etiquetasCargadas = true;
			}),
			observarReloj((actual) => (ahora = actual))
		];
		return () => cancelar.forEach((cancelarUno) => cancelarUno());
	});

	// Spec §6.6: la pantalla de carga espera la primera respuesta de cada colección.
	$effect(() => {
		alResponderDatos({ tareas: tareasCargadas, completados: completadosCargados, etiquetas: etiquetasCargadas });
	});

	$effect(() => {
		if (!tareasCargadas || !completadosCargados) return;
		const nuevos = completadosHuerfanos(tareas, completados).filter(({ id }) => !huerfanosEnLimpieza.has(id));
		if (nuevos.length === 0) return;
		nuevos.forEach(({ id }) => huerfanosEnLimpieza.add(id));
		void limpiarHuerfanos(uid, nuevos);
	});

	// Spec §7: las anotaciones huérfanas se ignoran y se limpian.
	$effect(() => {
		if (!tareasCargadas || !anotacionesCargadas) return;
		const nuevas = anotacionesHuerfanas(tareas, anotaciones).filter(({ id }) => !anotacionesEnLimpieza.has(id));
		if (nuevas.length === 0) return;
		nuevas.forEach(({ id }) => anotacionesEnLimpieza.add(id));
		void limpiarAnotacionesHuerfanas(uid, nuevas);
	});

	// Spec §7: las referencias a etiquetas borradas se ignoran y se limpian.
	$effect(() => {
		if (!tareasCargadas || !etiquetasCargadas) return;
		const clave = (tareaId: string, etiquetaId: string) => `${tareaId}/${etiquetaId}`;
		const nuevas = referenciasRotas(tareas, etiquetas).filter(({ tareaId, quitar }) =>
			quitar.some((id) => !referenciasEnLimpieza.has(clave(tareaId, id)))
		);
		if (nuevas.length === 0) return;
		nuevas.forEach(({ tareaId, quitar }) => quitar.forEach((id) => referenciasEnLimpieza.add(clave(tareaId, id))));
		void limpiarReferencias(uid, nuevas);
	});

	// Spec §7: las etiquetas duplicadas se fusionan al detectarlas.
	$effect(() => {
		if (!tareasCargadas || !etiquetasCargadas) return;
		const fusion = fusionDeDuplicadas(etiquetas, tareas);
		if (fusion.borradas.every((id) => etiquetasEnFusion.has(id))) return;
		fusion.borradas.forEach((id) => etiquetasEnFusion.add(id));
		void fusionarEtiquetas(uid, fusion);
	});

	// El aviso desaparece justo a los 5 segundos, sin esperar al próximo tic del reloj.
	$effect(() => {
		if (!avisoQueSeVe) return;
		const vencimiento = setTimeout(() => (ahora = horaActual()), msHastaQueVence(avisoQueSeVe, ahora));
		return () => clearTimeout(vencimiento);
	});

	function completarTarea(tarea: Tarea) {
		ahora = horaActual();
		const completado = completar(tarea, completados, nuevoId(), ahora);
		aviso = avisoAlCompletar(tarea, completado);
		void guardarCompletado(uid, completado);
	}

	/** Sin aviso al borrar: el checkbox ya deshace (§6.1). */
	function tocarCheckbox(tarea: Tarea) {
		const accion = accionDelCheckbox(tarea, completados, horaActual());
		if (accion.tipo === 'completar') completarTarea(tarea);
		else if (accion.tipo === 'borrar') void borrarCompletado(uid, accion.completado.id);
	}

	function deshacer() {
		const completado = completadoADeshacer(aviso, horaActual());
		aviso = undefined;
		if (completado) void borrarCompletado(uid, completado.id);
	}

	/** Las etiquetas de ahora y cómo nombrar las nuevas, para guardar el panel. */
	const etiquetasAlGuardar = () => ({ existentes: etiquetas, nuevoId });

	function crear(formulario: FormularioDelPanel) {
		const resultado = crearDesdePanel(formulario, nuevoId(), horaActual(), etiquetasAlGuardar());
		if (!resultado.ok) return resultado.errores;
		void guardarTarea(uid, resultado.tarea, resultado.nuevas);
	}

	function guardarEdicion(tarea: Tarea, formulario: FormularioDelPanel) {
		const resultado = editarDesdePanel(tarea, formulario, etiquetasAlGuardar(), horaActual());
		if (!resultado.ok) return resultado.errores;
		editada = undefined;
		void guardarCambio(uid, tarea.id, resultado.cambio, resultado.nuevas);
	}

	/** Spec §6.2: pausar, reanudar, posponer y quitar posponer actúan y cierran el panel. */
	function actuar(tarea: Tarea, cambio: CambioDeTarea, nuevas: Etiqueta[]) {
		editada = undefined;
		void guardarCambio(uid, tarea.id, cambio, nuevas);
	}

	function renombrarEtiqueta(etiqueta: Etiqueta, escrito: string) {
		const resultado = renombrar(etiqueta, escrito, etiquetas);
		if (!resultado.ok) return resultado.error;
		void cambiarEtiqueta(uid, etiqueta.id, resultado.cambio);
	}

	function borrarEditada(tarea: Tarea) {
		editada = undefined;
		void borrarTarea(uid, borrado(tarea.id, completados, anotaciones));
	}

	const PANTALLAS: Record<string, PantallaActual> = { '/historial': 'Historial', '/etiquetas': 'Etiquetas', '/anotaciones': 'Anotaciones' };

	/** Segundo toque (§5.10): el core toma el contexto de la pantalla, el panel y el aviso. */
	function anotarAhora(sentido: Sentido, texto: string) {
		ahora = horaActual();
		const pantalla = PANTALLAS[page.url.pathname] ?? 'Pendientes';
		const anotacion = anotar(nuevoId(), sentido, ahora, { pantalla, ...(panel && { panel }), ...(aviso && { aviso }) }, texto);
		anotando = false;
		void guardarAnotacion(uid, anotacion);
	}

	function panelAbierto(tareaId: string | undefined) {
		const este = tareaId === undefined ? {} : { tareaId };
		panel = este;
		return () => {
			if (panel === este) panel = undefined;
		};
	}

	compartirSesion({
		get anotaciones() {
			return anotaciones;
		},
		get hayPanel() {
			return panel !== undefined;
		},
		get anotando() {
			return anotando;
		},
		abrirAnotar: () => (anotando = true),
		cerrarAnotar: () => (anotando = false),
		anotar: anotarAhora,
		panelAbierto,
		editarTextoDeAnotacion: (anotacion, texto) => void cambiarTextoDeAnotacion(uid, anotacion.id, texto),
		borrarAnotacion: (anotacion) => void borrarAnotacion(uid, anotacion.id),
		get tareas() {
			return tareas;
		},
		get completados() {
			return completados;
		},
		get ahora() {
			return ahora;
		},
		get etiquetas() {
			return etiquetas;
		},
		get filtro() {
			return filtro;
		},
		elegirFiltro: (etiquetaId) => (filtro = etiquetaId),
		get soloRapidas() {
			return soloRapidas;
		},
		alternarSoloRapidas: () => (soloRapidas = !soloRapidas),
		renombrarEtiqueta,
		recolorearEtiqueta: (etiqueta, color) => void cambiarEtiqueta(uid, etiqueta.id, { color }),
		borrarEtiqueta: (etiqueta) => void borrarEtiqueta(uid, borradoDeEtiqueta(etiqueta.id, tareas)),
		tocarCheckbox,
		crear,
		abrir: (tarea) => (editada = tarea),
		borrarCompletado: (completado) => void borrarCompletado(uid, completado.id)
	});
</script>

<FranjaSinConexion />
<Navegacion />
<Anotar />

{@render children()}

{#if avisoQueSeVe}
	<AvisoDeshacer nombre={avisoQueSeVe.nombre} alDeshacer={deshacer} />
{/if}

{#if editada && editadaExiste}
	{@const abierta = editada}
	<!-- Las acciones se deciden con la tarea de ahora: si otro dispositivo la cambia, el panel las actualiza (§6.2). -->
	{@const vigente = tareas.find(({ id }) => id === abierta.id) ?? abierta}
	{#key abierta}
		<PanelTarea
			encabezado="Editar tarea"
			inicial={datosDeTarea(abierta)}
			etiquetasIniciales={etiquetasDeTarea(abierta, etiquetas).map(({ nombre }) => nombre)}
			ultimaVez={ultimaVez(abierta.id, completados, ahora)}
			tarea={abierta}
			alGuardar={(formulario) => guardarEdicion(abierta, formulario)}
			alCerrar={() => (editada = undefined)}
			alBorrar={() => borrarEditada(abierta)}
			alActuar={(cambio, nuevas) => actuar(abierta, cambio, nuevas)}
			pausa={accionDePausa(vigente)}
			posponer={accionDePosponer(vigente, completados, ahora)}
			textoPospuesta={textoDePosposicion(vigente, ahora)}
		/>
	{/key}
{/if}
