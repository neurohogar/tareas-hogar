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
	import { noticeOnComplete, visibleNotice, completionToUndo, msUntilDue, noticeReturn, noticeText, type Notice } from '#lib/core/notice.ts';
	import { annotate, editText, type Annotation, type CurrentScreen, type Sense } from '#lib/core/annotation.ts';
	import { orphanAnnotations, deletion, orphanCompletions, taskExists } from '#lib/core/deletion.ts';
	import { labelDeletion, brokenReferences } from '#lib/core/label-deletion.ts';
	import { checkboxAction } from '#lib/core/checkbox.ts';
	import { complete } from '#lib/core/completions.ts';
	import { doTheMinimal as hacerLaMinimaDelCore } from '#lib/core/minimal-version.ts';
	import { doneAction, changeOnDeleteCompletion, changeOnComplete, previousStepChange } from '#lib/core/current-step.ts';
	import { pauseAction } from '#lib/core/pause.ts';
	import { postponeAction, postponementText } from '#lib/core/postponement-in-panel.ts';
	import { taskData } from '#lib/core/task-data.ts';
	import type { PanelForm } from '#lib/core/unsaved-changes.ts';
	import { createFromPanel, editFromPanel } from '#lib/core/unsaved-changes-saved.ts';
	import type { Label } from '#lib/core/label.ts';
	import { taskLabels } from '#lib/core/task-labels.ts';
	import { itemsToAttempt, retriesWith, attemptResult } from '#lib/core/cleanups.ts';
	import { mergeOfDuplicates } from '#lib/core/label-merge.ts';
	import { rename } from '#lib/core/label-management.ts';
	import type { TaskChange } from '#lib/core/task-document.ts';
	import type { Completion, Task } from '#lib/core/task.ts';
	import { lastTime } from '#lib/core/last-time.ts';
	import { enLineaReactivo } from './en-linea.svelte.ts';
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

	let tareas = $state<Task[]>([]);
	let completados = $state<Completion[]>([]);
	let etiquetas = $state<Label[]>([]);
	let anotaciones = $state<Annotation[]>([]);
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
	let aviso = $state.raw<Notice | undefined>(undefined);
	const avisoQueSeVe = $derived(visibleNotice(aviso, ahora));
	/**
	 * La tarea abierta en el panel de edición, como estaba al abrirlo: la edición
	 * se compara con ella, así solo se escriben los campos que cambié.
	 */
	let editada = $state.raw<Task | undefined>(undefined);
	/** Si la tarea se borra (por ejemplo, en otro dispositivo) el panel se cierra solo. */
	const editadaExiste = $derived(editada !== undefined && taskExists(tareas, editada.id));
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
			observarAnotaciones(uid, (actuales) => {
				anotaciones = actuales;
				anotacionesCargadas = true;
			}),
			observarReloj((actual) => (ahora = actual))
		];
		return () => cancelar.forEach((cancelarUno) => cancelarUno());
	});

	// Spec §6.6: la pantalla de carga espera la primera respuesta de cada colección.
	$effect(() => {
		alResponderDatos({ tareas: tareasCargadas, completados: completadosCargados, etiquetas: etiquetasCargadas });
	});

	/** Cambia al volver la conexión: los efectos de limpieza la leen para reintentar. */
	const conexion = enLineaReactivo();

	/** Sube cuando un intento termina habiendo cambiado los datos (o la conexión) durante él: los efectos de limpieza la leen y se reevalúan. */
	let reevaluar = $state(0);
	/** Conjuntos `…EnLimpieza` cuyo efecto corrió mientras había un intento en curso, saltando elementos. */
	const saltearon = new WeakSet<Set<string>>();

	/**
	 * §7: intenta los elementos sin intento en curso; al terminar (falle o no) los saca
	 * del conjunto, así el efecto los reintenta al cambiar los datos o volver la conexión.
	 * Si el efecto corrió durante el intento (cambiaron los datos) y saltó elementos, al terminar
	 * se reevalúa una vez; un fallo sin cambio de datos ni de conexión no reintenta (sin bucle).
	 */
	function limpiar<T>(elementos: T[], clave: (elemento: T) => string, enCurso: Set<string>, intentar: (lote: T[]) => Promise<readonly string[]>) {
		const ids = new Set(itemsToAttempt(elementos.map(clave), enCurso));
		const lote = elementos.filter((elemento) => ids.has(clave(elemento)));
		if (lote.length < elementos.length) saltearon.add(enCurso);
		if (lote.length === 0) return;
		ids.forEach((id) => enCurso.add(id));
		const intentados = [...ids];
		void intentar(lote)
			.catch(() => intentados)
			.then((fallaron) => {
				const { cleaned: limpios, pendings: pendientes } = attemptResult(intentados, fallaron);
				[...limpios, ...pendientes].forEach((id) => enCurso.delete(id));
				if (saltearon.delete(enCurso) && retriesWith('cambian los datos')) reevaluar++;
			});
	}

	$effect(() => {
		if (!tareasCargadas || !completadosCargados) return;
		void [conexion.valor, reevaluar];
		limpiar(orphanCompletions(tareas, completados), ({ id }) => id, huerfanosEnLimpieza, (lote) => limpiarHuerfanos(uid, lote));
	});

	// Spec §7: las anotaciones huérfanas se ignoran y se limpian.
	$effect(() => {
		if (!tareasCargadas || !anotacionesCargadas) return;
		void [conexion.valor, reevaluar];
		limpiar(orphanAnnotations(tareas, anotaciones), ({ id }) => id, anotacionesEnLimpieza, (lote) => limpiarAnotacionesHuerfanas(uid, lote));
	});

	// Spec §7: las referencias a etiquetas borradas se ignoran y se limpian.
	$effect(() => {
		if (!tareasCargadas || !etiquetasCargadas) return;
		void [conexion.valor, reevaluar];
		limpiar(brokenReferences(tareas, etiquetas), ({ taskId: tareaId }) => tareaId, referenciasEnLimpieza, (lote) => limpiarReferencias(uid, lote));
	});

	// Spec §7: las etiquetas duplicadas se fusionan al detectarlas.
	$effect(() => {
		if (!tareasCargadas || !etiquetasCargadas) return;
		void [conexion.valor, reevaluar];
		const fusion = mergeOfDuplicates(etiquetas, tareas);
		limpiar(fusion.deletedItems, (id) => id, etiquetasEnFusion, (borradas) =>
			fusionarEtiquetas(uid, { deletedItems: borradas, references: fusion.references.filter(({ remove: quitar }) => quitar.some((id) => borradas.includes(id))) })
		);
	});

	// El aviso desaparece justo a los 5 segundos, sin esperar al próximo tic del reloj.
	$effect(() => {
		if (!avisoQueSeVe) return;
		const vencimiento = setTimeout(() => (ahora = horaActual()), msUntilDue(avisoQueSeVe, ahora));
		return () => clearTimeout(vencimiento);
	});

	function completarTarea(tarea: Task, completadoDe?: Completion) {
		if (!completadoDe) ahora = horaActual();
		const completado = completadoDe ?? complete(tarea, completados, nuevoId(), ahora);
		aviso = noticeOnComplete(tarea, completado, completados);
		void guardarCompletado(uid, completado);
		void guardarCambio(uid, tarea.id, changeOnComplete(tarea), []);
	}

	/** «Hice la mínima» (§6.1): lo que dice el core, con el mismo aviso y el mismo reinicio de paso que el checkbox. */
	function hacerLaMinima(tarea: Task) {
		ahora = horaActual();
		const completado = hacerLaMinimaDelCore(tarea, completados, nuevoId(), ahora);
		if (completado) completarTarea(tarea, completado);
	}

	/** Borra el completado y devuelve el paso de la tarea que dice el core (§5.4, Pasos: Deshacer). */
	function borrarYDevolverPaso(completado: Completion) {
		const tarea = tareas.find(({ id }) => id === completado.taskId);
		void borrarCompletado(uid, completado.id);
		// La tarea que se ve puede no reflejar todavía el reinicio al paso 1 de completarla (esa escritura
		// sigue en camino): se la toma sin paso guardado conocido (0 no es ningún paso), así el core
		// siempre da el paso a escribir en lugar de creer que la tarea ya está en él.
		if (tarea) void guardarCambio(uid, tarea.id, changeOnDeleteCompletion({ ...tarea, currentStep: 0 }, completados, completado), []);
	}

	/** «Hecho» de la fila (§6.1): pasa al paso siguiente o, en el último, completa como el checkbox. */
	function tocarHecho(tarea: Task) {
		const accion = doneAction(tarea, completados, horaActual());
		if (accion.kind === 'avanzar') void guardarCambio(uid, tarea.id, accion.change, []);
		else if (accion.kind === 'completar') completarTarea(tarea);
	}

	/** Sin aviso al borrar: el checkbox ya deshace (§6.1). */
	function tocarCheckbox(tarea: Task) {
		const accion = checkboxAction(tarea, completados, horaActual());
		if (accion.kind === 'completar') completarTarea(tarea);
		else if (accion.kind === 'borrar') borrarYDevolverPaso(accion.completion);
	}

	function deshacer() {
		const completado = completionToUndo(aviso, horaActual());
		aviso = undefined;
		if (completado) borrarYDevolverPaso(completado);
	}

	/** Las etiquetas de ahora y cómo nombrar las nuevas, para guardar el panel. */
	const etiquetasAlGuardar = () => ({ existings: etiquetas, newId: nuevoId });

	function crear(formulario: PanelForm) {
		const resultado = createFromPanel(formulario, nuevoId(), horaActual(), etiquetasAlGuardar());
		if (!resultado.ok) return resultado.errors;
		void guardarTarea(uid, resultado.task, resultado.newLabels);
	}

	function guardarEdicion(tarea: Task, formulario: PanelForm) {
		const resultado = editFromPanel(tarea, formulario, etiquetasAlGuardar(), horaActual());
		if (!resultado.ok) return resultado.errors;
		editada = undefined;
		void guardarCambio(uid, tarea.id, resultado.change, resultado.newLabels);
	}

	/** Spec §6.2: pausar, reanudar, posponer y quitar posponer actúan y cierran el panel. */
	function actuar(tarea: Task, cambio: TaskChange, nuevas: Label[]) {
		editada = undefined;
		void guardarCambio(uid, tarea.id, cambio, nuevas);
	}

	function renombrarEtiqueta(etiqueta: Label, escrito: string) {
		const resultado = rename(etiqueta, escrito, etiquetas);
		if (!resultado.ok) return resultado.error;
		void cambiarEtiqueta(uid, etiqueta.id, resultado.change);
	}

	function borrarEditada(tarea: Task) {
		editada = undefined;
		void borrarTarea(uid, deletion(tarea.id, completados, anotaciones));
	}

	const PANTALLAS: Record<string, CurrentScreen> = { '/historial': 'Historial', '/etiquetas': 'Etiquetas', '/anotaciones': 'Anotaciones' };

	/** Segundo toque (§5.10): el core toma el contexto de la pantalla, el panel y el aviso. */
	function anotarAhora(sentido: Sense, texto: string) {
		ahora = horaActual();
		const pantalla = PANTALLAS[page.url.pathname] ?? 'Pendientes';
		const anotacion = annotate(nuevoId(), sentido, ahora, { screen: pantalla, ...(panel && { panel: { ...(panel.tareaId !== undefined && { taskId: panel.tareaId }) } }), ...(aviso && { notice: aviso }) }, texto);
		anotando = false;
		void guardarAnotacion(uid, anotacion);
	}

	/** Editar texto (§6.7): el core decide cómo queda el texto; la anotación que ya no está no se revive. */
	function editarTextoDeAnotacion(anotacion: Annotation, texto: string) {
		const editada = editText(anotaciones, anotacion.id, texto).find(({ id }) => id === anotacion.id);
		if (editada) void cambiarTextoDeAnotacion(uid, editada.id, editada.text);
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
		editarTextoDeAnotacion,
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
		borrarEtiqueta: (etiqueta) => void borrarEtiqueta(uid, labelDeletion(etiqueta.id, tareas)),
		tocarCheckbox,
		tocarHecho,
		hacerLaMinima,
		pasoAnterior: (tarea) => void guardarCambio(uid, tarea.id, previousStepChange(tarea), []),
		crear,
		abrir: (tarea) => (editada = tarea),
		borrarCompletado: borrarYDevolverPaso
	});
</script>

<FranjaSinConexion />
<Navegacion />
<Anotar />

{@render children()}

{#if avisoQueSeVe}
	<AvisoDeshacer texto={noticeText(avisoQueSeVe)} regreso={noticeReturn(avisoQueSeVe, ahora)} alDeshacer={deshacer} />
{/if}

{#if editada && editadaExiste}
	{@const abierta = editada}
	<!-- Las acciones se deciden con la tarea de ahora: si otro dispositivo la cambia, el panel las actualiza (§6.2). -->
	{@const vigente = tareas.find(({ id }) => id === abierta.id) ?? abierta}
	{#key abierta}
		<PanelTarea
			encabezado="Editar tarea"
			inicial={taskData(abierta)}
			etiquetasIniciales={taskLabels(abierta, etiquetas).map(({ name: nombre }) => nombre)}
			ultimaVez={lastTime(abierta.id, completados, ahora)}
			tarea={abierta}
			alGuardar={(formulario) => guardarEdicion(abierta, formulario)}
			alCerrar={() => (editada = undefined)}
			alBorrar={() => borrarEditada(abierta)}
			alActuar={(cambio, nuevas) => actuar(abierta, cambio, nuevas)}
			pausa={pauseAction(vigente)}
			posponer={postponeAction(vigente, completados, ahora)}
			textoPospuesta={postponementText(vigente, ahora)}
		/>
	{/key}
{/if}
