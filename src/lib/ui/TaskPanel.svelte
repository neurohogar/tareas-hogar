<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import type { CreationErrors } from '#lib/core/creation.ts';
	import { DATA_ON_CREATE, type TaskData } from '#lib/core/task-data.ts';
	import { actionNotice, discardAndAct, saveAndAct, type NoticeAction } from '#lib/core/action-notice.ts';
	import { changeOfAction, whatTheActionDoes, type PanelAction } from '#lib/core/panel-action.ts';
	import { whatBackDoes, type OnTop } from '#lib/core/panel-back.ts';
	import { hasChanges, type PanelForm, type PanelValues } from '#lib/core/unsaved-changes.ts';
	import { onClosePanel, CLOSE_NOTICE, type NoticeButton } from '#lib/core/unsaved-changes-notice.ts';
	import type { TaskChange } from '#lib/core/task-document.ts';
	import type { Label } from '#lib/core/label.ts';
	import { taskName } from '#lib/core/task-name.ts';
	import type { Weekday, Effort, Task, Unit } from '#lib/core/task.ts';
	import { tomarAtras } from '#lib/adapters/back.ts';
	import { confirmarAlSalir } from '#lib/adapters/confirm-on-leave.ts';
	import { nuevoId } from '#lib/adapters/ids.ts';
	import { leerRecientes, recordarReciente } from '#lib/adapters/recents.ts';
	import { ahora as horaActual } from '#lib/adapters/clock.ts';
	import AvisoDeCambios from './UnsavedChangesNotice.svelte';
	import BarraDePestanas from './TabBar.svelte';
	import { MENSAJES_DE_NOMBRE } from './label-messages';
	import SeccionAcciones from './ActionsSection.svelte';
	import SeccionCuando, { type Ventana } from './WhenSection.svelte';
	import SeccionTarea from './TaskSection.svelte';
	import SelectorEmoji from './EmojiPicker.svelte';
	import Icono from './icons/Icon.svelte';
	import { laSesion } from './session';
	import { observarTeclado, type EstadoDelTeclado } from '#lib/adapters/keyboard.ts';
	import {
		saveBarVisible,
		fieldsWithError,
		destinationOnSaveFailure,
		TAB_ON_OPEN,
		panelPresentation,
		repetitionOnOpen,
		panelSections,
		markedSections,
		type ErrorDestination,
		type RepetitionOption,
		type PanelSection
	} from '#lib/core/panel-tabs.ts';

	let {
		encabezado,
		inicial,
		tarea,
		etiquetasIniciales = [],
		ultimaVez,
		alGuardar,
		alCerrar,
		alBorrar,
		alActuar,
		pausa,
		posponer,
		textoPospuesta
	}: {
		encabezado: string;
		/** Los valores actuales de la tarea que se edita; sin ellos, el panel arranca vacío (crear). */
		inicial?: TaskData;
		/** Solo al editar: la tarea como estaba al abrir el panel. */
		tarea?: Task;
		/** Los nombres de las etiquetas que tiene la tarea que se edita. */
		etiquetasIniciales?: string[];
		/** Solo al editar: el texto de "Última vez" que calcula el core (§6.2). */
		ultimaVez?: string;
		/** Guarda el formulario; si algo es inválido devuelve los errores y el panel sigue abierto. */
		alGuardar: (formulario: PanelForm) => CreationErrors | undefined;
		alCerrar: () => void;
		/** Solo al editar: borra la tarea, ya confirmado. */
		alBorrar?: () => void;
		/** Solo al editar: ejecuta una acción (con lo guardado, si pasó por el aviso) y cierra el panel. */
		alActuar?: (cambio: TaskChange, nuevas: Label[]) => void;
		/** Solo al editar una periódica (§6.2): el botón que ofrece el core. */
		pausa?: 'pausar' | 'reanudar';
		/** Solo al editar (§6.2): el botón que ofrece el core. */
		posponer?: 'posponer' | 'quitar';
		/** "Pospuesta hasta HH:MM" que arma el core, si la tarea está pospuesta. */
		textoPospuesta?: string;
	} = $props();

	// Los valores con que abre el panel: se toman una vez, aunque la tarea cambie mientras está abierto.
	// Cada control arranca con el valor de la tarea solo si es de su forma: los de las otras opciones
	// de "Se repite" empiezan como al crear.
	const valores = untrack(() => inicial);
	const nombre = valores && taskName(valores);
	const fechaLimiteInicial = valores?.shape === 'puntual' ? (valores.dueDate ?? '') : '';
	const cadaInicial = valores?.shape === 'relativa' ? String(valores.every) : '';
	const unidadInicial: Unit = valores?.shape === 'relativa' ? valores.unit : 'horas';

	let repeticion = $state<RepetitionOption>(repetitionOnOpen(valores));
	let diasSemana = $state<Weekday[]>(valores?.shape === 'calendario' ? [...valores.weekdays] : []);
	let diasMes = $state<number[]>(valores?.shape === 'calendario' ? [...valores.monthDays] : []);
	let etiquetas = $state<string[]>(untrack(() => [...etiquetasIniciales]));
	let errorDeEtiquetas = $state<string | undefined>(undefined);
	/** El texto de Etiquetas que todavía no se confirmó. */
	let sinConfirmar = $state('');
	let errores = $state<CreationErrors>({});
	let confirmandoBorrado = $state(false);
	let emoji = $state(untrack(() => inicial?.emoji ?? ''));
	let esfuerzo = $state<Effort | ''>(untrack(() => inicial?.effort ?? ''));
	/** "Solo en un horario": apagado, la tarea no tiene horario (§6.2). */
	let conHorario = $state(valores?.schedule !== undefined);
	/** Los pasos más (2, 3…), uno por campo; Agregar paso suma uno vacío (§6.2). */
	let pasos = $state<string[]>(untrack(() => [...(inicial?.steps ?? [])]));
	/** Las filas Desde/Hasta: al menos una; Agregar horario suma una vacía (§6.2). */
	let ventanas = $state<Ventana[]>(valores?.schedule?.map(({ from: desde = '', to: hasta = '' }) => ({ desde, hasta })) ?? [{ desde: '', hasta: '' }]);

	/** Los recientes del selector mientras está abierto; sin selector abierto, undefined. */
	let recientes = $state<string[] | undefined>(undefined);

	function abrirSelector() {
		recientes = leerRecientes();
	}

	function elegirEmoji(elegido: string) {
		emoji = elegido;
		recordarReciente(elegido);
		recientes = undefined;
	}

	/**
	 * Un campo de fecha vacío es "sin fecha límite"; uno incompleto (badInput)
	 * también tiene valor vacío, pero se le pasa al core para que lo rechace.
	 */
	function fechaLimiteDe(campo: HTMLInputElement): string | undefined {
		return campo.value === '' && !campo.validity.badInput ? undefined : campo.value;
	}

	/** Solo cuentan los campos de la opción elegida en "Se repite". */
	function datosDelFormulario(formulario: HTMLFormElement): TaskData {
		const campos = new FormData(formulario);
		// La nota se lee del control, no de FormData, que cambia los saltos de línea por CRLF.
		const nota = (formulario.elements.namedItem('nota') as HTMLTextAreaElement).value;
		const primerPaso = String(campos.get('primerPaso') ?? '');
		const versionMinima = String(campos.get('versionMinima') ?? '');
		const horario = conHorario ? ventanas.map(({ desde, hasta }) => ({ from: desde, to: hasta })) : undefined;
		const comunes = { title: String(campos.get('titulo') ?? ''), emoji, note: nota, firstStep: primerPaso, minimalVersion: versionMinima, steps: [...pasos], schedule: horario, ...(esfuerzo && { effort: esfuerzo }) };
		if (repeticion === 'puntual') {
			const campoFecha = formulario.elements.namedItem('fechaLimite') as HTMLInputElement;
			return { shape: 'puntual', ...comunes, dueDate: fechaLimiteDe(campoFecha) };
		}
		if (repeticion === 'relativo') {
			const cada = Number(campos.get('cada') || Number.NaN);
			return { shape: 'relativa', ...comunes, every: cada, unit: campos.get('unidad') as Unit };
		}
		const dias = repeticion === 'semanal' ? { weekdays: diasSemana, monthDays: [] } : { weekdays: [], monthDays: diasMes };
		return { shape: 'calendario', ...comunes, ...dias };
	}

	let anchoDeVentana = $state(window.innerWidth);
	const remEnPx = () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
	const presentacion = $derived(panelPresentation(anchoDeVentana / remEnPx()));
	const secciones = $derived(panelSections(alBorrar ? 'editar' : 'crear'));
	let abierta = $state<PanelSection>(TAB_ON_OPEN);
	let contenido: HTMLDivElement;

	const conError = $derived(fieldsWithError(errores, repeticion, errorDeEtiquetas !== undefined));
	const marcadas = $derived(markedSections(conError));

	let teclado = $state<EstadoDelTeclado>({ abierto: false, solape: 0 });
	const barraVisible = $derived(saveBarVisible(teclado.abierto));
	onMount(() => observarTeclado((estado) => (teclado = estado)));

	// El aviso de deshacer se ve sobre la barra de Guardar o, sin barra, sobre el teclado.
	$effect(() => {
		const raiz = document.documentElement.style;
		raiz.setProperty('--base-aviso', teclado.abierto ? `calc(${teclado.solape}px + 1rem)` : '5.5rem');
		return () => raiz.removeProperty('--base-aviso');
	});

	async function elegirPestana(seccion: PanelSection) {
		abierta = seccion;
		await tick();
		contenido.scrollTop = 0;
	}

	async function irAlCampo({ tab: pestana, field: campo }: ErrorDestination) {
		if (pestana) abierta = pestana;
		await tick();
		contenido.querySelector(`[data-campo="${campo}"]`)?.scrollIntoView({ block: 'center' });
	}

	/** El error de un campo dura lo que dura su mensaje: al corregirlo se va. */
	function limpiar(campo: keyof CreationErrors) {
		const { [campo]: _quitado, ...resto } = errores;
		errores = resto;
	}

	const sesion = laSesion();
	let formulario: HTMLFormElement;
	/** Los valores con que se abrió el panel; al crear, el formulario como se abre (§6.2). */
	const alAbrir: PanelValues = { data: valores ?? DATA_ON_CREATE, labels: untrack(() => [...etiquetasIniciales]) };
	let avisoDeCierre = $state(false);
	/** La acción cuyo aviso está abierto, con lo escrito al elegirla. */
	let accionAbierta = $state.raw<{ accion: PanelAction; formulario: PanelForm } | undefined>(undefined);

	function formularioActual(): PanelForm {
		return { data: datosDelFormulario(formulario), labels: [...etiquetas], unconfirmed: sinConfirmar };
	}
	const hayCambiosAhora = () => hasChanges(alAbrir, formularioActual());

	/** Lo que el core necesita para evaluar el aviso de una acción con la tarea y el ahora de este momento. */
	function enAviso({ accion, formulario }: NonNullable<typeof accionAbierta>, ahora: Date): NoticeAction {
		const alAbrirElPanel = untrack(() => tarea!);
		return {
			action: accion,
			taskOnOpen: alAbrirElPanel,
			task: sesion.tareas.find(({ id }) => id === alAbrirElPanel.id) ?? alAbrirElPanel,
			completions: sesion.completados,
			now: ahora,
			form: formulario,
			existings: sesion.etiquetas
		};
	}
	const avisoDeLaAccion = $derived(accionAbierta ? actionNotice(enAviso(accionAbierta, sesion.ahora)) : undefined);
	// Si la acción ya no corresponde (otro dispositivo, o pasó el tiempo), el aviso se cierra y queda el panel con lo escrito.
	$effect(() => {
		if (accionAbierta && !avisoDeLaAccion) accionAbierta = undefined;
	});

	function mostrarErrores(nuevos: CreationErrors | undefined) {
		errores = nuevos ?? {};
		if (errores.labels) errorDeEtiquetas = MENSAJES_DE_NOMBRE[errores.labels];
		const destino = destinationOnSaveFailure(conError, presentacion);
		if (destino) void irAlCampo(destino);
	}

	function guardar(evento: SubmitEvent) {
		evento.preventDefault();
		mostrarErrores(alGuardar(formularioActual()));
	}

	function cerrar() {
		if (onClosePanel(hayCambiosAhora()) === 'cierra el panel') alCerrar();
		else avisoDeCierre = true;
	}

	function elegirEnAvisoDeCierre(efecto: NoticeButton['effect']) {
		avisoDeCierre = false;
		if (efecto === 'descartar') alCerrar();
		else if (efecto === 'guardar') mostrarErrores(alGuardar(formularioActual()));
	}

	function elegirAccion(accion: PanelAction) {
		const escrito = formularioActual();
		if (whatTheActionDoes(accion, hasChanges(alAbrir, escrito)) === 'actúa') alActuar?.(changeOfAction(accion, horaActual()), []);
		else accionAbierta = { accion, formulario: escrito };
	}

	function elegirEnAvisoDeAccion(efecto: NoticeButton['effect']) {
		const abierta = accionAbierta;
		if (!abierta || efecto === 'seguir editando') {
			accionAbierta = undefined;
			return;
		}
		const contexto = enAviso(abierta, horaActual());
		if (efecto === 'descartar') {
			accionAbierta = undefined;
			const cambio = discardAndAct(contexto);
			if (cambio) alActuar?.(cambio, []);
			return;
		}
		const resultado = saveAndAct(contexto, nuevoId);
		if (resultado.result === 'guardado') alActuar?.(resultado.change, resultado.newLabels);
		else if (resultado.result === 'rechazado') {
			accionAbierta = undefined;
			mostrarErrores(resultado.errors);
		} else if (resultado.result === 'aviso cerrado') accionAbierta = undefined;
	}

	function loDeArriba(): OnTop {
		if (sesion.anotando) return 'recuadro de Anotar';
		if (avisoDeCierre) return 'aviso de cierre';
		if (accionAbierta) return 'aviso de acción';
		if (confirmandoBorrado) return 'confirmación de Borrar tarea';
		return recientes ? 'selector de emoji' : 'nada';
	}

	/** Atrás con el panel abierto (§6.2); devuelve si el panel sigue abierto. */
	function alTocarAtras(): boolean {
		const efecto = whatBackDoes({ top: loDeArriba(), hasChanges: hayCambiosAhora(), keyboardOpen: teclado.abierto });
		if (efecto === 'cierra el teclado') (document.activeElement as HTMLElement | null)?.blur();
		else if (efecto === 'cierra lo de arriba' && sesion.anotando) sesion.cerrarAnotar();
		else if (efecto === 'cierra lo de arriba') {
			avisoDeCierre = false;
			accionAbierta = undefined;
			confirmandoBorrado = false;
			recientes = undefined;
		} else if (efecto === 'abre el aviso de cierre') avisoDeCierre = true;
		else {
			alCerrar();
			return false;
		}
		return true;
	}

	onMount(() => {
		const capa = tomarAtras(alTocarAtras);
		const dejarDePedir = confirmarAlSalir(hayCambiosAhora);
		const soltarPanel = sesion.panelAbierto(tarea?.id);
		return () => {
			soltarPanel();
			capa.soltar();
			dejarDePedir();
		};
	});
</script>

<svelte:window bind:innerWidth={anchoDeVentana} />

<div class="panel panel-principal" inert={avisoDeCierre || accionAbierta !== undefined || confirmandoBorrado} style:bottom={teclado.solape > 0 ? `${teclado.solape}px` : undefined} role="dialog" aria-modal="true" aria-labelledby="titulo-panel">
	<form class="hoja" bind:this={formulario} class:completa={presentacion === 'pestanas'} novalidate onsubmit={guardar}>
		<header>
			<h2 id="titulo-panel">{encabezado}</h2>
			<button type="button" class="cerrar" aria-label="Cerrar" onclick={cerrar}><Icono nombre="cerrar" /></button>
		</header>
		{#if presentacion === 'pestanas'}
			<BarraDePestanas {secciones} {abierta} {marcadas} alElegir={elegirPestana} />
		{/if}

		<div class="contenido" bind:this={contenido}>
			<SeccionTarea
				{presentacion}
				{abierta}
				{valores}
				{pausa}
				{textoPospuesta}
				{ultimaVez}
				{errores}
				{limpiar}
				bind:emoji
				bind:esfuerzo
				bind:pasos
				bind:etiquetas
				bind:errorDeEtiquetas
				bind:sinConfirmar
				alAbrirSelector={abrirSelector}
			/>
			<SeccionCuando
				{presentacion}
				{abierta}
				{errores}
				{limpiar}
				bind:repeticion
				bind:diasSemana
				bind:diasMes
				bind:conHorario
				bind:ventanas
				{fechaLimiteInicial}
				{cadaInicial}
				{unidadInicial}
			/>
			{#if secciones.includes('Acciones')}
				<SeccionAcciones {presentacion} {abierta} {posponer} {pausa} alElegir={elegirAccion} alPedirBorrado={() => (confirmandoBorrado = true)} />
			{/if}
		</div>

		<div class="barra-guardar" hidden={!barraVisible}>
			<button type="submit" class="principal-boton">Guardar</button>
		</div>
	</form>
</div>

{#if recientes}
	<SelectorEmoji {recientes} alElegir={elegirEmoji} alCerrar={() => (recientes = undefined)} />
{/if}

{#if avisoDeCierre}
	<AvisoDeCambios aviso={CLOSE_NOTICE} alElegir={elegirEnAvisoDeCierre} />
{/if}

{#if avisoDeLaAccion}
	<AvisoDeCambios aviso={avisoDeLaAccion} alElegir={elegirEnAvisoDeAccion} />
{/if}

{#if alBorrar && confirmandoBorrado}
	<div class="panel confirmacion" role="alertdialog" aria-modal="true" aria-labelledby="titulo-confirmacion">
		<div class="caja">
			<p id="titulo-confirmacion">¿Borrar «{nombre}»? También se borra su historial.</p>
			<div class="acciones confirmar">
				<button type="button" onclick={() => (confirmandoBorrado = false)}>Cancelar</button>
				<button type="button" class="principal" onclick={alBorrar}>Borrar</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.panel {
		position: fixed;
		inset: 0;
		/* Above the navigation bar (z-index 1), whatever the DOM order. */
		z-index: 2;
		display: grid;
		place-items: end center;
		background: color-mix(in srgb, black 35%, transparent);
	}

	.panel-principal {
		top: var(--alto-franja, 0px);
	}

	.hoja {
		display: flex;
		flex-direction: column;
		width: min(40rem, 100%);
		max-height: 100%;
		box-sizing: border-box;
		overflow: hidden;
		border-radius: 0.75rem 0.75rem 0 0;
		background: var(--superficie);
	}

	.hoja.completa {
		width: 100%;
		height: 100%;
		border-radius: 0;
	}

	header {
		display: flex;
		flex: none;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.5rem 0.5rem 0.5rem 1rem;
		border-bottom: 1px solid var(--borde);
	}

	h2 {
		margin: 0;
		font-size: 1.1rem;
	}

	.cerrar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 44px;
		min-height: 44px;
		padding: 0;
		border: 1px solid transparent;
		border-radius: 0.4rem;
		background: transparent;
		color: var(--texto);
		cursor: pointer;
	}

	.contenido {
		display: grid;
		flex: 1;
		align-content: start;
		gap: 1.25rem;
		min-height: 0;
		overflow-y: auto;
		padding: 1rem;
	}

	.barra-guardar[hidden] {
		display: none;
	}

	.barra-guardar {
		display: flex;
		flex: none;
		padding: 0.75rem 1rem;
		border-top: 1px solid var(--borde);
		background: var(--superficie);
	}

	.principal-boton {
		flex: 1;
		min-height: 44px;
		border: 1px solid var(--acento);
		border-radius: 0.4rem;
		background: var(--acento);
		color: var(--superficie);
		font-weight: 600;
		cursor: pointer;
	}

	.confirmacion {
		place-items: center;
	}

	.caja {
		width: min(24rem, calc(100% - 2rem));
		box-sizing: border-box;
		padding: 1rem;
		border-radius: 0.75rem;
		background: var(--superficie);
	}

	.caja p {
		margin: 0;
	}

	.acciones {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.acciones button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 44px;
		padding: 0 1rem;
		border: 1px solid var(--borde);
		border-radius: 0.4rem;
		background: transparent;
		color: var(--texto);
		cursor: pointer;
	}

	.acciones .principal {
		border-color: var(--acento);
		background: var(--acento);
		color: var(--superficie);
	}
</style>
