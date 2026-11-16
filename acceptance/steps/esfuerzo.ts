// Esfuerzo de tarea (spec §4.1), el selector del panel (§6.2) y los conflictos
// entre dispositivos (§7). "sin estimar" es una tarea sin el campo.
import { expect } from 'vitest';
import { createRecurringCalendar } from '../../src/lib/core/create-recurring-calendar';
import { createOneOff } from '../../src/lib/core/create-one-off';
import { taskData } from '../../src/lib/core/task-data';
import { applyChange } from '../../src/lib/core/task-document';
import type { Effort, Task } from '../../src/lib/core/task';
import { AHORA, crearEnWorld, registrarCreacion } from './crear';
import { editaElOtro, editoYo } from './edicion';
import { diasDe } from './periodica-calendario';
import { P, TITULO, numero, unidad } from './valores';
import { OTRO, elDocumento, laTarea, laTareaTitulada, type StepDefinition } from './world';

const SIN_ESTIMAR = 'sin estimar';
const NIVELES: readonly string[] = ['rapida', 'media', 'larga'];

function esfuerzoDe(valor: string): Effort | undefined {
	if (valor === SIN_ESTIMAR) return undefined;
	if (!NIVELES.includes(valor)) throw new Error(`Esfuerzo inválido: "${valor}"`);
	return valor as Effort;
}

/** Elegir en el selector del panel: el resto de la tarea queda como estaba. */
const eligiendo = (valor: string) => (tarea: Task) => ({ ...taskData(tarea), effort: esfuerzoDe(valor) });

export const esfuerzoSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^creo una tarea puntual con título ${P} y esfuerzo ${P}$`),
		run: (world, titulo, esfuerzo) => registrarCreacion(world, (id) => createOneOff({ title: titulo, effort: esfuerzoDe(esfuerzo) }, id, AHORA))
	},
	{
		pattern: new RegExp(`^creo una tarea periódica relativa con título ${P} cada ${P} ${P} y esfuerzo ${P}$`),
		run: (world, titulo, cada, u, esfuerzo) => crearEnWorld(world, { title: titulo, every: numero(cada), unit: unidad(u), effort: esfuerzoDe(esfuerzo) })
	},
	{
		pattern: new RegExp(`^creo una tarea periódica semanal con título ${P} los ${P} y esfuerzo ${P}$`),
		run: (world, titulo, dias, esfuerzo) =>
			registrarCreacion(world, (id) => createRecurringCalendar({ title: titulo, ...diasDe('semanal', dias), effort: esfuerzoDe(esfuerzo) }, id, AHORA))
	},
	{
		pattern: new RegExp(`^una tarea puntual sin fecha límite con esfuerzo ${P}$`),
		run: (world, esfuerzo) => registrarCreacion(world, (id) => createOneOff({ title: 'Tarea', effort: esfuerzoDe(esfuerzo) }, id, AHORA))
	},
	{
		// Ya guardado: no es un cambio de este dispositivo.
		pattern: new RegExp(`^la tarea ${TITULO} tiene esfuerzo ${P}$`),
		run: (world, titulo, esfuerzo) => {
			world.documentos = applyChange(world.documentos, laTareaTitulada(world, titulo).id, { effort: esfuerzoDe(esfuerzo) ?? null });
		}
	},
	{
		pattern: new RegExp(`^elijo el esfuerzo ${P}$`),
		run: (world, esfuerzo) => editoYo(world, eligiendo(esfuerzo))
	},
	{
		pattern: new RegExp(`^${OTRO} elige el esfuerzo ${P}$`),
		run: (world, esfuerzo) => editaElOtro(world, eligiendo(esfuerzo))
	},
	{
		pattern: new RegExp(`^su esfuerzo es ${P}$`),
		run: (world, esfuerzo) => {
			const esperado = esfuerzoDe(esfuerzo);
			if (esperado === undefined) expect(elDocumento(world)).not.toHaveProperty('effort');
			else expect(laTarea(world).effort).toBe(esperado);
		}
	}
];
