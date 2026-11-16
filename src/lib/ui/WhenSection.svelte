<script module lang="ts">
	/** Una fila Desde/Hasta de "Solo en un horario". */
	export interface WindowRow {
		from: string;
		to: string;
	}
</script>

<script lang="ts">
	import type { CreationErrors } from '#lib/core/creation.ts';
	import type { RepetitionOption, PanelPresentation, PanelSection } from '#lib/core/panel-tabs.ts';
	import { WEEKDAYS, MONTH_DAYS, type Weekday, type Unit } from '#lib/core/task.ts';
	import SectionFrame from './SectionFrame.svelte';

	let {
		presentation,
		openSection,
		errors,
		clearError,
		repetition = $bindable(),
		weekdays = $bindable(),
		monthDays = $bindable(),
		withSchedule = $bindable(),
		windowRows = $bindable(),
		initialDueDate,
		initialEvery,
		initialUnit
	}: {
		presentation: PanelPresentation;
		openSection: PanelSection;
		errors: CreationErrors;
		/** El error de un campo dura lo que dura su mensaje: al corregirlo se va. */
		clearError: (field: keyof CreationErrors) => void;
		repetition: RepetitionOption;
		weekdays: Weekday[];
		monthDays: number[];
		/** "Solo en un horario": apagado, la tarea no tiene horario (§6.2). */
		withSchedule: boolean;
		/** Las filas Desde/Hasta: al menos una; Agregar horario suma una vacía (§6.2). */
		windowRows: WindowRow[];
		initialDueDate: string;
		initialEvery: string;
		initialUnit: Unit;
	} = $props();

	const REPETITIONS: { value: RepetitionOption; name: string }[] = [
		{ value: 'puntual', name: 'No se repite' },
		{ value: 'relativo', name: 'Intervalo' },
		{ value: 'semanal', name: 'Días de la semana' },
		{ value: 'mensual', name: 'Días del mes' }
	];
	const SCHEDULE_ERRORS: Record<NonNullable<CreationErrors['schedule']>, string> = {
		finNoPosterior: 'La hora de fin tiene que ser posterior a la de inicio',
		incompleto: 'Completá las dos horas',
		superpuestos: 'Los horarios no se pueden superponer',
		variasEnHoras: 'Con varios horarios, el intervalo tiene que ser en días'
	};
	const DAYS_ERRORS: Record<NonNullable<CreationErrors['days']>, string> = {
		faltan: 'Elegí al menos un día.',
		diaDelMesInvalido: 'Los días del mes van del 1 al 31.',
		combinados: 'Elegí días de la semana o días del mes, no los dos.'
	};

	function addWindowRow() {
		windowRows = [...windowRows, { from: '', to: '' }];
		clearError('schedule');
	}

	function removeWindowRow(index: number) {
		windowRows = windowRows.filter((_, i) => i !== index);
		clearError('schedule');
	}

	/** La primera fila conserva los ids de siempre; las demás llevan su número. */
	const fieldId = (field: 'desde' | 'hasta', index: number) => (index === 0 ? `campo-${field}` : `campo-${field}-${index + 1}`);

	function toggle<T>(selectedItems: T[], value: T): T[] {
		return selectedItems.includes(value) ? selectedItems.filter((chosen) => chosen !== value) : [...selectedItems, value];
	}
</script>

<SectionFrame name="Cuándo" {presentation} {openSection}>
	<fieldset>
		<legend>Se repite</legend>
		<div class="opciones">
			{#each REPETITIONS as option (option.value)}
				<label class="opcion">
					<input type="radio" name="repeticion" value={option.value} bind:group={repetition} />
					{option.name}
				</label>
			{/each}
		</div>

		{#if repetition === 'puntual'}
			<div class="campo-formulario" data-campo="fecha límite">
				<label for="campo-fecha-limite">Fecha límite</label>
				<input
					id="campo-fecha-limite"
					name="fechaLimite"
					type="date"
					value={initialDueDate}
					oninput={() => clearError('dueDate')}
					aria-invalid={errors.dueDate ? 'true' : undefined}
					aria-describedby={errors.dueDate ? 'error-fecha-limite' : undefined}
				/>
				{#if errors.dueDate}
					<p id="error-fecha-limite" class="error">Ingresá una fecha completa y que exista, o dejala vacía.</p>
				{/if}
			</div>
		{:else if repetition === 'relativo'}
			<div class="relativo" data-campo="Cada">
				<label for="campo-cada">Cada</label>
				<input
					id="campo-cada"
					name="cada"
					type="number"
					inputmode="numeric"
					min="1"
					step="1"
					value={initialEvery}
					oninput={() => clearError('every')}
					aria-invalid={errors.every ? 'true' : undefined}
					aria-describedby={errors.every ? 'error-cada' : undefined}
				/>
				<label for="campo-unidad" class="oculto">Unidad</label>
				<select id="campo-unidad" name="unidad" value={initialUnit}>
					<option value="horas">horas</option>
					<option value="dias">días</option>
				</select>
				{#if errors.every}
					<p id="error-cada" class="error">Cada tiene que ser un número entero, 1 o más.</p>
				{/if}
			</div>
		{:else}
			<div data-campo="días">
				<div
					class="dias"
					class:semana={repetition === 'semanal'}
					role="group"
					aria-label={repetition === 'semanal' ? 'Días de la semana' : 'Días del mes'}
					aria-describedby={errors.days ? 'error-dias' : undefined}
				>
					{#if repetition === 'semanal'}
						{#each WEEKDAYS as day (day)}
							<button
								type="button"
								aria-pressed={weekdays.includes(day)}
								onclick={() => {
									weekdays = toggle(weekdays, day);
									clearError('days');
								}}>{day}</button
							>
						{/each}
					{:else}
						{#each MONTH_DAYS as day (day)}
							<button
								type="button"
								aria-pressed={monthDays.includes(day)}
								onclick={() => {
									monthDays = toggle(monthDays, day);
									clearError('days');
								}}>{day}</button
							>
						{/each}
					{/if}
				</div>
				{#if errors.days}
					<p id="error-dias" class="error">{DAYS_ERRORS[errors.days]}</p>
				{/if}
			</div>
		{/if}
	</fieldset>

	<div class="horario" data-campo="horario" role="group" aria-label="Horario" aria-describedby={errors.schedule ? 'error-horario' : undefined}>
		<label class="opcion">
			<input type="checkbox" bind:checked={withSchedule} />
			Solo en un horario
		</label>
		{#if withSchedule}
			{#each windowRows as windowRow, index (index)}
				<div class="horas">
					<label for={fieldId('desde', index)}>Desde</label>
					<input
						id={fieldId('desde', index)}
						type="time"
						bind:value={windowRow.from}
						oninput={() => clearError('schedule')}
						aria-invalid={errors.schedule ? 'true' : undefined}
					/>
					<label for={fieldId('hasta', index)}>Hasta</label>
					<input
						id={fieldId('hasta', index)}
						type="time"
						bind:value={windowRow.to}
						oninput={() => clearError('schedule')}
						aria-invalid={errors.schedule ? 'true' : undefined}
					/>
					{#if windowRows.length > 1}
						<button type="button" class="texto" onclick={() => removeWindowRow(index)}>Quitar</button>
					{/if}
				</div>
			{/each}
			<button type="button" class="texto" onclick={addWindowRow}>Agregar horario</button>
		{/if}
		{#if errors.schedule}
			<p id="error-horario" class="error">{SCHEDULE_ERRORS[errors.schedule]}</p>
		{/if}
	</div>
</SectionFrame>

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
