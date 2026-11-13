<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import type { ErroresDeCreacion } from '#lib/core/creacion.ts';
	import { DATOS_AL_CREAR, type DatosDeTarea } from '#lib/core/datos-de-tarea.ts';
	import { avisoDeAccion, descartarYActuar, guardarYActuar, type AccionEnAviso } from '#lib/core/aviso-de-accion.ts';
	import { cambioDeAccion, queHaceLaAccion, type AccionDelPanel } from '#lib/core/accion-del-panel.ts';
	import { queHaceAtras, type LoDeArriba } from '#lib/core/atras-del-panel.ts';
	import { hayCambios, type FormularioDelPanel, type ValoresDelPanel } from '#lib/core/cambios-sin-guardar.ts';
	import { alCerrarElPanel, AVISO_DE_CIERRE, type BotonDelAviso } from '#lib/core/cambios-sin-guardar-aviso.ts';
	import type { CambioDeTarea } from '#lib/core/documento-de-tarea.ts';
	import type { Etiqueta } from '#lib/core/etiqueta.ts';
	import { nombreDeTarea } from '#lib/core/nombre-de-tarea.ts';
	import type { DiaSemana, Esfuerzo, Tarea, Unidad } from '#lib/core/tarea.ts';
	import { tomarAtras } from '#lib/adapters/atras.ts';
	import { confirmarAlSalir } from '#lib/adapters/confirmacion-al-salir.ts';
	import { nuevoId } from '#lib/adapters/ids.ts';
	import { leerRecientes, recordarReciente } from '#lib/adapters/recientes.ts';
	import { ahora as horaActual } from '#lib/adapters/reloj.ts';
	import AvisoDeCambios from './AvisoDeCambios.svelte';
	import BarraDePestanas from './BarraDePestanas.svelte';
	import { MENSAJES_DE_NOMBRE } from './mensajes-de-etiqueta';
	import SeccionAcciones from './SeccionAcciones.svelte';
	import SeccionCuando, { type Ventana } from './SeccionCuando.svelte';
	import SeccionTarea from './SeccionTarea.svelte';
	import SelectorEmoji from './SelectorEmoji.svelte';
	import Icono from './iconos/Icono.svelte';
	import { laSesion } from './sesion';
	import { observarTeclado, type EstadoDelTeclado } from '#lib/adapters/teclado.ts';
	import {
		barraDeGuardarVisible,
		camposConError,
		destinoAlFallarGuardar,
		PESTANA_AL_ABRIR,
		presentacionDelPanel,
		repeticionAlAbrir,
		seccionesDelPanel,
		seccionesMarcadas,
		type DestinoDelError,
		type OpcionDeRepeticion,
		type SeccionDelPanel
	} from '#lib/core/panel-en-pestanas.ts';

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
		inicial?: DatosDeTarea;
		/** Solo al editar: la tarea como estaba al abrir el panel. */
		tarea?: Tarea;
		/** Los nombres de las etiquetas que tiene la tarea que se edita. */
		etiquetasIniciales?: string[];
		/** Solo al editar: el texto de "Última vez" que calcula el core (§6.2). */
		ultimaVez?: string;
		/** Guarda el formulario; si algo es inválido devuelve los errores y el panel sigue abierto. */
		alGuardar: (formulario: FormularioDelPanel) => ErroresDeCreacion | undefined;
		alCerrar: () => void;
		/** Solo al editar: borra la tarea, ya confirmado. */
		alBorrar?: () => void;
		/** Solo al editar: ejecuta una acción (con lo guardado, si pasó por el aviso) y cierra el panel. */
		alActuar?: (cambio: CambioDeTarea, nuevas: Etiqueta[]) => void;
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
	const nombre = valores && nombreDeTarea(valores);
	const fechaLimiteInicial = valores?.forma === 'puntual' ? (valores.fechaLimite ?? '') : '';
	const cadaInicial = valores?.forma === 'relativa' ? String(valores.cada) : '';
	const unidadInicial: Unidad = valores?.forma === 'relativa' ? valores.unidad : 'horas';

	let repeticion = $state<OpcionDeRepeticion>(repeticionAlAbrir(valores));
	let diasSemana = $state<DiaSemana[]>(valores?.forma === 'calendario' ? [...valores.diasSemana] : []);
	let diasMes = $state<number[]>(valores?.forma === 'calendario' ? [...valores.diasMes] : []);
	let etiquetas = $state<string[]>(untrack(() => [...etiquetasIniciales]));
	let errorDeEtiquetas = $state<string | undefined>(undefined);
	/** El texto de Etiquetas que todavía no se confirmó. */
	let sinConfirmar = $state('');
	let errores = $state<ErroresDeCreacion>({});
	let confirmandoBorrado = $state(false);
	let emoji = $state(untrack(() => inicial?.emoji ?? ''));
	let esfuerzo = $state<Esfuerzo | ''>(untrack(() => inicial?.esfuerzo ?? ''));
	/** "Solo en un horario": apagado, la tarea no tiene horario (§6.2). */
	let conHorario = $state(valores?.horario !== undefined);
	/** Las filas Desde/Hasta: al menos una; Agregar horario suma una vacía (§6.2). */
	let ventanas = $state<Ventana[]>(valores?.horario?.map(({ desde = '', hasta = '' }) => ({ desde, hasta })) ?? [{ desde: '', hasta: '' }]);

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
	function datosDelFormulario(formulario: HTMLFormElement): DatosDeTarea {
		const campos = new FormData(formulario);
		// La nota se lee del control, no de FormData, que cambia los saltos de línea por CRLF.
		const nota = (formulario.elements.namedItem('nota') as HTMLTextAreaElement).value;
		const primerPaso = String(campos.get('primerPaso') ?? '');
		const horario = conHorario ? ventanas.map((ventana) => ({ ...ventana })) : undefined;
		const comunes = { titulo: String(campos.get('titulo') ?? ''), emoji, nota, primerPaso, horario, ...(esfuerzo && { esfuerzo }) };
		if (repeticion === 'puntual') {
			const campoFecha = formulario.elements.namedItem('fechaLimite') as HTMLInputElement;
			return { forma: 'puntual', ...comunes, fechaLimite: fechaLimiteDe(campoFecha) };
		}
		if (repeticion === 'relativo') {
			const cada = Number(campos.get('cada') || Number.NaN);
			return { forma: 'relativa', ...comunes, cada, unidad: campos.get('unidad') as Unidad };
		}
		const dias = repeticion === 'semanal' ? { diasSemana, diasMes: [] } : { diasSemana: [], diasMes };
		return { forma: 'calendario', ...comunes, ...dias };
	}

	let anchoDeVentana = $state(window.innerWidth);
	const remEnPx = () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
	const presentacion = $derived(presentacionDelPanel(anchoDeVentana / remEnPx()));
	const secciones = $derived(seccionesDelPanel(alBorrar ? 'editar' : 'crear'));
	let abierta = $state<SeccionDelPanel>(PESTANA_AL_ABRIR);
	let contenido: HTMLDivElement;

	const conError = $derived(camposConError(errores, repeticion, errorDeEtiquetas !== undefined));
	const marcadas = $derived(seccionesMarcadas(conError));

	let teclado = $state<EstadoDelTeclado>({ abierto: false, solape: 0 });
	const barraVisible = $derived(barraDeGuardarVisible(teclado.abierto));
	onMount(() => observarTeclado((estado) => (teclado = estado)));

	// El aviso de deshacer se ve sobre la barra de Guardar o, sin barra, sobre el teclado.
	$effect(() => {
		const raiz = document.documentElement.style;
		raiz.setProperty('--base-aviso', teclado.abierto ? `calc(${teclado.solape}px + 1rem)` : '5.5rem');
		return () => raiz.removeProperty('--base-aviso');
	});

	async function elegirPestana(seccion: SeccionDelPanel) {
		abierta = seccion;
		await tick();
		contenido.scrollTop = 0;
	}

	async function irAlCampo({ pestana, campo }: DestinoDelError) {
		if (pestana) abierta = pestana;
		await tick();
		contenido.querySelector(`[data-campo="${campo}"]`)?.scrollIntoView({ block: 'center' });
	}

	/** El error de un campo dura lo que dura su mensaje: al corregirlo se va. */
	function limpiar(campo: keyof ErroresDeCreacion) {
		const { [campo]: _quitado, ...resto } = errores;
		errores = resto;
	}

	const sesion = laSesion();
	let formulario: HTMLFormElement;
	/** Los valores con que se abrió el panel; al crear, el formulario como se abre (§6.2). */
	const alAbrir: ValoresDelPanel = { datos: valores ?? DATOS_AL_CREAR, etiquetas: untrack(() => [...etiquetasIniciales]) };
	let avisoDeCierre = $state(false);
	/** La acción cuyo aviso está abierto, con lo escrito al elegirla. */
	let accionAbierta = $state.raw<{ accion: AccionDelPanel; formulario: FormularioDelPanel } | undefined>(undefined);

	function formularioActual(): FormularioDelPanel {
		return { datos: datosDelFormulario(formulario), etiquetas: [...etiquetas], sinConfirmar };
	}
	const hayCambiosAhora = () => hayCambios(alAbrir, formularioActual());

	/** Lo que el core necesita para evaluar el aviso de una acción con la tarea y el ahora de este momento. */
	function enAviso({ accion, formulario }: NonNullable<typeof accionAbierta>, ahora: Date): AccionEnAviso {
		const alAbrirElPanel = untrack(() => tarea!);
		return {
			accion,
			tareaAlAbrir: alAbrirElPanel,
			tarea: sesion.tareas.find(({ id }) => id === alAbrirElPanel.id) ?? alAbrirElPanel,
			completados: sesion.completados,
			ahora,
			formulario,
			existentes: sesion.etiquetas
		};
	}
	const avisoDeLaAccion = $derived(accionAbierta ? avisoDeAccion(enAviso(accionAbierta, sesion.ahora)) : undefined);
	// Si la acción ya no corresponde (otro dispositivo, o pasó el tiempo), el aviso se cierra y queda el panel con lo escrito.
	$effect(() => {
		if (accionAbierta && !avisoDeLaAccion) accionAbierta = undefined;
	});

	function mostrarErrores(nuevos: ErroresDeCreacion | undefined) {
		errores = nuevos ?? {};
		if (errores.etiquetas) errorDeEtiquetas = MENSAJES_DE_NOMBRE[errores.etiquetas];
		const destino = destinoAlFallarGuardar(conError, presentacion);
		if (destino) void irAlCampo(destino);
	}

	function guardar(evento: SubmitEvent) {
		evento.preventDefault();
		mostrarErrores(alGuardar(formularioActual()));
	}

	function cerrar() {
		if (alCerrarElPanel(hayCambiosAhora()) === 'cierra el panel') alCerrar();
		else avisoDeCierre = true;
	}

	function elegirEnAvisoDeCierre(efecto: BotonDelAviso['efecto']) {
		avisoDeCierre = false;
		if (efecto === 'descartar') alCerrar();
		else if (efecto === 'guardar') mostrarErrores(alGuardar(formularioActual()));
	}

	function elegirAccion(accion: AccionDelPanel) {
		const escrito = formularioActual();
		if (queHaceLaAccion(accion, hayCambios(alAbrir, escrito)) === 'actúa') alActuar?.(cambioDeAccion(accion, horaActual()), []);
		else accionAbierta = { accion, formulario: escrito };
	}

	function elegirEnAvisoDeAccion(efecto: BotonDelAviso['efecto']) {
		const abierta = accionAbierta;
		if (!abierta || efecto === 'seguir editando') {
			accionAbierta = undefined;
			return;
		}
		const contexto = enAviso(abierta, horaActual());
		if (efecto === 'descartar') {
			accionAbierta = undefined;
			const cambio = descartarYActuar(contexto);
			if (cambio) alActuar?.(cambio, []);
			return;
		}
		const resultado = guardarYActuar(contexto, nuevoId);
		if (resultado.resultado === 'guardado') alActuar?.(resultado.cambio, resultado.nuevas);
		else if (resultado.resultado === 'rechazado') {
			accionAbierta = undefined;
			mostrarErrores(resultado.errores);
		} else if (resultado.resultado === 'aviso cerrado') accionAbierta = undefined;
	}

	function loDeArriba(): LoDeArriba {
		if (sesion.anotando) return 'recuadro de Anotar';
		if (avisoDeCierre) return 'aviso de cierre';
		if (accionAbierta) return 'aviso de acción';
		if (confirmandoBorrado) return 'confirmación de Borrar tarea';
		return recientes ? 'selector de emoji' : 'nada';
	}

	/** Atrás con el panel abierto (§6.2); devuelve si el panel sigue abierto. */
	function alTocarAtras(): boolean {
		const efecto = queHaceAtras({ encima: loDeArriba(), hayCambios: hayCambiosAhora(), tecladoAbierto: teclado.abierto });
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
	<AvisoDeCambios aviso={AVISO_DE_CIERRE} alElegir={elegirEnAvisoDeCierre} />
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
