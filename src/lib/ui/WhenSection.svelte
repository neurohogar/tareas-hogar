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
	const fieldId = (field: 'from' | 'to', index: number) => (index === 0 ? `field-${field}` : `field-${field}-${index + 1}`);

	function toggle<T>(selectedItems: T[], value: T): T[] {
		return selectedItems.includes(value) ? selectedItems.filter((chosen) => chosen !== value) : [...selectedItems, value];
	}
</script>

<SectionFrame name="Cuándo" {presentation} {openSection}>
	<fieldset>
		<legend>Se repite</legend>
		<div class="options">
			{#each REPETITIONS as option (option.value)}
				<label class="option">
					<input type="radio" name="repetition" value={option.value} bind:group={repetition} />
					{option.name}
				</label>
			{/each}
		</div>

		{#if repetition === 'puntual'}
			<div class="form-field" data-field="fecha límite">
				<label for="field-due-date">Fecha límite</label>
				<input
					id="field-due-date"
					name="dueDate"
					type="date"
					value={initialDueDate}
					oninput={() => clearError('dueDate')}
					aria-invalid={errors.dueDate ? 'true' : undefined}
					aria-describedby={errors.dueDate ? 'error-due-date' : undefined}
				/>
				{#if errors.dueDate}
					<p id="error-due-date" class="error">Ingresá una fecha completa y que exista, o dejala vacía.</p>
				{/if}
			</div>
		{:else if repetition === 'relativo'}
			<div class="relative" data-field="Cada">
				<label for="field-every">Cada</label>
				<input
					id="field-every"
					name="every"
					type="number"
					inputmode="numeric"
					min="1"
					step="1"
					value={initialEvery}
					oninput={() => clearError('every')}
					aria-invalid={errors.every ? 'true' : undefined}
					aria-describedby={errors.every ? 'error-every' : undefined}
				/>
				<label for="field-unit" class="visually-hidden">Unidad</label>
				<select id="field-unit" name="unit" value={initialUnit}>
					<option value="horas">horas</option>
					<option value="dias">días</option>
				</select>
				{#if errors.every}
					<p id="error-every" class="error">Cada tiene que ser un número entero, 1 o más.</p>
				{/if}
			</div>
		{:else}
			<div data-field="días">
				<div
					class="days"
					class:week={repetition === 'semanal'}
					role="group"
					aria-label={repetition === 'semanal' ? 'Días de la semana' : 'Días del mes'}
					aria-describedby={errors.days ? 'error-days' : undefined}
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
					<p id="error-days" class="error">{DAYS_ERRORS[errors.days]}</p>
				{/if}
			</div>
		{/if}
	</fieldset>

	<div class="schedule" data-field="horario" role="group" aria-label="Horario" aria-describedby={errors.schedule ? 'error-schedule' : undefined}>
		<label class="option">
			<input type="checkbox" bind:checked={withSchedule} />
			Solo en un horario
		</label>
		{#if withSchedule}
			{#each windowRows as windowRow, index (index)}
				<div class="hours">
					<label for={fieldId('from', index)}>Desde</label>
					<input
						id={fieldId('from', index)}
						type="time"
						bind:value={windowRow.from}
						oninput={() => clearError('schedule')}
						aria-invalid={errors.schedule ? 'true' : undefined}
					/>
					<label for={fieldId('to', index)}>Hasta</label>
					<input
						id={fieldId('to', index)}
						type="time"
						bind:value={windowRow.to}
						oninput={() => clearError('schedule')}
						aria-invalid={errors.schedule ? 'true' : undefined}
					/>
					{#if windowRows.length > 1}
						<button type="button" class="text" onclick={() => removeWindowRow(index)}>Quitar</button>
					{/if}
				</div>
			{/each}
			<button type="button" class="text" onclick={addWindowRow}>Agregar horario</button>
		{/if}
		{#if errors.schedule}
			<p id="error-schedule" class="error">{SCHEDULE_ERRORS[errors.schedule]}</p>
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
		color: var(--text-muted);
	}

	.schedule {
		display: grid;
		gap: 0.5rem;
	}

	.hours {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.options {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.25rem 0.75rem;
	}

	.relative {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1rem;
	}

	.option {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		min-height: 44px;
		cursor: pointer;
	}

	.option input {
		width: 1.2rem;
		height: 1.2rem;
		min-height: 0;
		margin: 0;
		accent-color: var(--accent);
	}

	.days {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 0.25rem;
	}

	.days.week {
		grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
	}

	.days button {
		min-height: 44px;
		padding: 0 0.25rem;
		border: 1px solid var(--border);
		border-radius: 0.4rem;
		background: transparent;
		color: var(--text);
		cursor: pointer;
	}

	.days button[aria-pressed='true'] {
		border-color: var(--accent);
		background: var(--accent);
		color: var(--surface);
	}

	#field-every {
		width: 5rem;
	}
</style>
