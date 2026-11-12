<script module lang="ts">
	/** Una fila Desde/Hasta de "Solo en un horario". */
	export interface Ventana {
		desde: string;
		hasta: string;
	}
</script>

<script lang="ts">
	import type { ErroresDeCreacion } from '#lib/core/creacion.ts';
	import type { OpcionDeRepeticion, PresentacionDelPanel, SeccionDelPanel } from '#lib/core/panel-en-pestanas.ts';
	import { DIAS_DE_LA_SEMANA, DIAS_DEL_MES, type DiaSemana, type Unidad } from '#lib/core/tarea.ts';
	import MarcoDeSeccion from './MarcoDeSeccion.svelte';

	let {
		presentacion,
		abierta,
		errores,
		limpiar,
		repeticion = $bindable(),
		diasSemana = $bindable(),
		diasMes = $bindable(),
		conHorario = $bindable(),
		ventanas = $bindable(),
		fechaLimiteInicial,
		cadaInicial,
		unidadInicial
	}: {
		presentacion: PresentacionDelPanel;
		abierta: SeccionDelPanel;
		errores: ErroresDeCreacion;
		/** El error de un campo dura lo que dura su mensaje: al corregirlo se va. */
		limpiar: (campo: keyof ErroresDeCreacion) => void;
		repeticion: OpcionDeRepeticion;
		diasSemana: DiaSemana[];
		diasMes: number[];
		/** "Solo en un horario": apagado, la tarea no tiene horario (§6.2). */
		conHorario: boolean;
		/** Las filas Desde/Hasta: al menos una; Agregar horario suma una vacía (§6.2). */
		ventanas: Ventana[];
		fechaLimiteInicial: string;
		cadaInicial: string;
		unidadInicial: Unidad;
	} = $props();

	const REPETICIONES: { valor: OpcionDeRepeticion; nombre: string }[] = [
		{ valor: 'puntual', nombre: 'No se repite' },
		{ valor: 'relativo', nombre: 'Intervalo' },
		{ valor: 'semanal', nombre: 'Días de la semana' },
		{ valor: 'mensual', nombre: 'Días del mes' }
	];
	const ERRORES_DE_HORARIO: Record<NonNullable<ErroresDeCreacion['horario']>, string> = {
		finNoPosterior: 'La hora de fin tiene que ser posterior a la de inicio',
		incompleto: 'Completá las dos horas',
		superpuestos: 'Los horarios no se pueden superponer',
		variasEnHoras: 'Con varios horarios, el intervalo tiene que ser en días'
	};
	const ERRORES_DE_DIAS: Record<NonNullable<ErroresDeCreacion['dias']>, string> = {
		faltan: 'Elegí al menos un día.',
		diaDelMesInvalido: 'Los días del mes van del 1 al 31.',
		combinados: 'Elegí días de la semana o días del mes, no los dos.'
	};

	function agregarVentana() {
		ventanas = [...ventanas, { desde: '', hasta: '' }];
		limpiar('horario');
	}

	function quitarVentana(indice: number) {
		ventanas = ventanas.filter((_, i) => i !== indice);
		limpiar('horario');
	}

	/** La primera fila conserva los ids de siempre; las demás llevan su número. */
	const idDeCampo = (campo: 'desde' | 'hasta', indice: number) => (indice === 0 ? `campo-${campo}` : `campo-${campo}-${indice + 1}`);

	function alternar<T>(elegidos: T[], valor: T): T[] {
		return elegidos.includes(valor) ? elegidos.filter((elegido) => elegido !== valor) : [...elegidos, valor];
	}
</script>

<MarcoDeSeccion nombre="Cuándo" {presentacion} {abierta}>
	<fieldset>
		<legend>Se repite</legend>
		<div class="opciones">
			{#each REPETICIONES as opcion (opcion.valor)}
				<label class="opcion">
					<input type="radio" name="repeticion" value={opcion.valor} bind:group={repeticion} />
					{opcion.nombre}
				</label>
			{/each}
		</div>

		{#if repeticion === 'puntual'}
			<div class="campo-formulario" data-campo="fecha límite">
				<label for="campo-fecha-limite">Fecha límite</label>
				<input
					id="campo-fecha-limite"
					name="fechaLimite"
					type="date"
					value={fechaLimiteInicial}
					oninput={() => limpiar('fechaLimite')}
					aria-invalid={errores.fechaLimite ? 'true' : undefined}
					aria-describedby={errores.fechaLimite ? 'error-fecha-limite' : undefined}
				/>
				{#if errores.fechaLimite}
					<p id="error-fecha-limite" class="error">Ingresá una fecha completa y que exista, o dejala vacía.</p>
				{/if}
			</div>
		{:else if repeticion === 'relativo'}
			<div class="relativo" data-campo="Cada">
				<label for="campo-cada">Cada</label>
				<input
					id="campo-cada"
					name="cada"
					type="number"
					inputmode="numeric"
					min="1"
					step="1"
					value={cadaInicial}
					oninput={() => limpiar('cada')}
					aria-invalid={errores.cada ? 'true' : undefined}
					aria-describedby={errores.cada ? 'error-cada' : undefined}
				/>
				<label for="campo-unidad" class="oculto">Unidad</label>
				<select id="campo-unidad" name="unidad" value={unidadInicial}>
					<option value="horas">horas</option>
					<option value="dias">días</option>
				</select>
				{#if errores.cada}
					<p id="error-cada" class="error">Cada tiene que ser un número entero, 1 o más.</p>
				{/if}
			</div>
		{:else}
			<div data-campo="días">
				<div
					class="dias"
					class:semana={repeticion === 'semanal'}
					role="group"
					aria-label={repeticion === 'semanal' ? 'Días de la semana' : 'Días del mes'}
					aria-describedby={errores.dias ? 'error-dias' : undefined}
				>
					{#if repeticion === 'semanal'}
						{#each DIAS_DE_LA_SEMANA as dia (dia)}
							<button
								type="button"
								aria-pressed={diasSemana.includes(dia)}
								onclick={() => {
									diasSemana = alternar(diasSemana, dia);
									limpiar('dias');
								}}>{dia}</button
							>
						{/each}
					{:else}
						{#each DIAS_DEL_MES as dia (dia)}
							<button
								type="button"
								aria-pressed={diasMes.includes(dia)}
								onclick={() => {
									diasMes = alternar(diasMes, dia);
									limpiar('dias');
								}}>{dia}</button
							>
						{/each}
					{/if}
				</div>
				{#if errores.dias}
					<p id="error-dias" class="error">{ERRORES_DE_DIAS[errores.dias]}</p>
				{/if}
			</div>
		{/if}
	</fieldset>

	<div class="horario" data-campo="horario" role="group" aria-label="Horario" aria-describedby={errores.horario ? 'error-horario' : undefined}>
		<label class="opcion">
			<input type="checkbox" bind:checked={conHorario} />
			Solo en un horario
		</label>
		{#if conHorario}
			{#each ventanas as ventana, indice (indice)}
				<div class="horas">
					<label for={idDeCampo('desde', indice)}>Desde</label>
					<input
						id={idDeCampo('desde', indice)}
						type="time"
						bind:value={ventana.desde}
						oninput={() => limpiar('horario')}
						aria-invalid={errores.horario ? 'true' : undefined}
					/>
					<label for={idDeCampo('hasta', indice)}>Hasta</label>
					<input
						id={idDeCampo('hasta', indice)}
						type="time"
						bind:value={ventana.hasta}
						oninput={() => limpiar('horario')}
						aria-invalid={errores.horario ? 'true' : undefined}
					/>
					{#if ventanas.length > 1}
						<button type="button" class="texto" onclick={() => quitarVentana(indice)}>Quitar</button>
					{/if}
				</div>
			{/each}
			<button type="button" class="texto" onclick={agregarVentana}>Agregar horario</button>
		{/if}
		{#if errores.horario}
			<p id="error-horario" class="error">{ERRORES_DE_HORARIO[errores.horario]}</p>
		{/if}
	</div>
</MarcoDeSeccion>

<style>
	fieldset {
		display: grid;
		gap: 0.75rem;
		margin: 0;
		padding: 0;
		border: 0;
		min-width: 0;
	}

	legend {
		margin-bottom: 0.5rem;
		padding: 0;
		color: var(--texto-suave);
	}

	.horario {
		display: grid;
		gap: 0.5rem;
	}

	.horas {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.opciones {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.25rem 0.75rem;
	}

	.relativo {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1rem;
	}

	.opcion {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		min-height: 44px;
		cursor: pointer;
	}

	.opcion input {
		width: 1.2rem;
		height: 1.2rem;
		min-height: 0;
		margin: 0;
		accent-color: var(--acento);
	}

	.dias {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 0.25rem;
	}

	.dias.semana {
		grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
	}

	.dias button {
		min-height: 44px;
		padding: 0 0.25rem;
		border: 1px solid var(--borde);
		border-radius: 0.4rem;
		background: transparent;
		color: var(--texto);
		cursor: pointer;
	}

	.dias button[aria-pressed='true'] {
		border-color: var(--acento);
		background: var(--acento);
		color: var(--superficie);
	}

	#campo-cada {
		width: 5rem;
	}
</style>
