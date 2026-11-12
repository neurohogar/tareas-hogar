<script lang="ts">
	import { accionDeLaOpcion, type AccionDelPanel } from '$lib/core/accion-del-panel';
	import { OPCIONES_DE_POSPONER } from '$lib/core/posposicion';
	import type { PresentacionDelPanel, SeccionDelPanel } from '$lib/core/panel-en-pestanas';
	import Icono from './iconos/Icono.svelte';
	import MarcoDeSeccion from './MarcoDeSeccion.svelte';

	const ICONOS_DE_POSPONER = { '1 hora': 'reloj', '3 horas': 'reloj', 'hasta mañana': 'manana' } as const;

	let {
		presentacion,
		abierta,
		posponer,
		pausa,
		alElegir,
		alPedirBorrado
	}: {
		presentacion: PresentacionDelPanel;
		abierta: SeccionDelPanel;
		posponer?: 'posponer' | 'quitar';
		pausa?: 'pausar' | 'reanudar';
		/** Elige una acción; el panel decide si actúa o pide confirmación (§6.2). */
		alElegir: (accion: AccionDelPanel) => void;
		/** Abre la confirmación de Borrar tarea. */
		alPedirBorrado: () => void;
	} = $props();
</script>

<MarcoDeSeccion nombre="Acciones" {presentacion} {abierta}>
	{#if posponer === 'posponer'}
		<div class="grupo" role="group" aria-label="Posponer">
			{#each OPCIONES_DE_POSPONER as { opcion, etiqueta } (opcion)}
				<button type="button" class="accion" onclick={() => alElegir(accionDeLaOpcion(opcion))}>
					<Icono nombre={ICONOS_DE_POSPONER[opcion]} />{etiqueta}
				</button>
			{/each}
		</div>
	{:else if posponer === 'quitar'}
		<button type="button" class="accion" onclick={() => alElegir('quitar posponer')}><Icono nombre="quitar-posponer" />Quitar posponer</button>
	{/if}
	{#if pausa}
		<button type="button" class="accion" onclick={() => alElegir(pausa)}>
			<Icono nombre={pausa === 'pausar' ? 'pausar' : 'reanudar'} />{pausa === 'pausar' ? 'Pausar' : 'Reanudar'}
		</button>
	{/if}
	<button type="button" class="accion borrar" onclick={alPedirBorrado}><Icono nombre="borrar" />Borrar tarea</button>
</MarcoDeSeccion>

<style>
	.grupo {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.accion {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		justify-self: start;
		min-height: 44px;
		padding: 0 1rem;
		border: 1px solid var(--borde);
		border-radius: 0.4rem;
		background: transparent;
		color: var(--texto);
		cursor: pointer;
	}

	.accion.borrar {
		margin-top: 1rem;
		border-color: var(--error);
		color: var(--error);
	}
</style>
