import { expect } from 'vitest';
import {
	crearPeriodicaCalendario,
	type DatosPeriodicaCalendario
} from '../../src/lib/core/crear-periodica-calendario';
import type { Completado, OcurrenciaCubierta, Tarea } from '../../src/lib/core/tarea';
import { AHORA, ANTES_DEL_ESCENARIO, TITULO_VALIDO, registrarCreacion } from './crear';
import { P, TITULO, diasMes, diasSemana, fecha, fechaHora, ocurrencia } from './valores';
import { laTarea, laTareaDeTipo, laTareaTitulada, nuevoId, type StepDefinition, type World } from './world';

export type Forma = 'semanal' | 'mensual';

/** Cómo se nombran los días de cada forma: "los martes" o "los días 10". */
const CONECTOR: Record<Forma, string> = { semanal: 'los', mensual: 'los días' };
export const FORMA_Y_DIAS = `(semanal los|mensual los días) ${P}`;
/** "semanal Basura los martes": el título va entre la forma y el conector. */
const FORMA_TITULO_Y_DIAS = `(semanal|mensual) ${TITULO} (los|los días) ${P}`;

export const DIAS_VALIDOS: Record<Forma, Pick<DatosPeriodicaCalendario, 'diasSemana' | 'diasMes'>> = {
	semanal: { diasSemana: ['martes'], diasMes: [] },
	mensual: { diasSemana: [], diasMes: [15] }
};
export const SIN_DIAS = { diasSemana: [], diasMes: [] };

export function diasDe(forma: Forma, dias: string): Pick<DatosPeriodicaCalendario, 'diasSemana' | 'diasMes'> {
	return forma === 'semanal' ? { diasSemana: diasSemana(dias), diasMes: [] } : { diasSemana: [], diasMes: diasMes(dias) };
}

/** "semanal los" o "mensual los días": la forma, validando que el conector le corresponda. */
export function formaDe(formaYConector: string): Forma {
	const [forma] = formaYConector.split(' ') as [Forma];
	if (`${forma} ${CONECTOR[forma]}` !== formaYConector) throw new Error(`Forma inválida: "${formaYConector}"`);
	return forma;
}

function crear(world: World, datos: DatosPeriodicaCalendario, ahora = AHORA): void {
	registrarCreacion(world, (id) => crearPeriodicaCalendario(datos, id, ahora));
}

/** Completado ya guardado (por ejemplo, sincronizado), con su ocurrenciaCubierta tal cual. */
function agregarCompletado(world: World, completadoEn: Date, ocurrenciaCubierta: OcurrenciaCubierta, tarea: Tarea = laTarea(world)): void {
	const completado: Completado = {
		id: nuevoId(world, 'completado'),
		tareaId: tarea.id,
		completadoEn,
		ocurrenciaCubierta
	};
	world.completados = [...world.completados, completado];
}

const UN_DIA_MS = 86_400_000;

function elUltimoCompletado(world: World): Completado {
	const ultimo = world.completados.at(-1);
	if (!ultimo) throw new Error('La tarea no tiene completados');
	return ultimo;
}

export const periodicaCalendarioSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^creo una tarea periódica (semanal|mensual) con título ${P} (los|los días) ${P}$`),
		run: (world, forma, titulo, conector, dias) => {
			const laForma = formaDe(`${forma} ${conector}`);
			crear(world, { titulo, ...diasDe(laForma, dias) });
		}
	},
	{
		pattern: new RegExp(`^creo una tarea periódica (semanal|mensual) con título ${P} y días válidos$`),
		run: (world, forma, titulo) => crear(world, { titulo, ...DIAS_VALIDOS[forma as Forma] })
	},
	{
		pattern: /^creo una tarea periódica (semanal|mensual) con un título de solo espacios y días válidos$/,
		run: (world, forma) => crear(world, { titulo: '   ', ...DIAS_VALIDOS[forma as Forma] })
	},
	{
		pattern: /^creo una tarea periódica (semanal|mensual) con un título válido y sin días$/,
		run: (world) => crear(world, { titulo: TITULO_VALIDO, ...SIN_DIAS })
	},
	{
		pattern: new RegExp(`^creo una tarea periódica mensual con un título válido los días ${P}$`),
		run: (world, dias) => crear(world, { titulo: TITULO_VALIDO, ...diasDe('mensual', dias) })
	},
	{
		pattern:
			/^creo una tarea periódica de calendario con un título válido y días de la semana y del mes a la vez$/,
		run: (world) =>
			crear(world, {
				titulo: TITULO_VALIDO,
				diasSemana: DIAS_VALIDOS.semanal.diasSemana,
				diasMes: DIAS_VALIDOS.mensual.diasMes
			})
	},
	{
		pattern: new RegExp(`^su recurrencia es ${FORMA_Y_DIAS}$`),
		run: (world, formaYConector, dias) => {
			const forma = formaDe(formaYConector);
			const { diasSemana: semana, diasMes: mes } = diasDe(forma, dias);
			const esperada = forma === 'semanal' ? { diasSemana: semana } : { diasMes: mes };
			expect(laTareaDeTipo(world, 'periodica').recurrencia).toStrictEqual({ modo: 'calendario', ...esperada });
		}
	},
	{
		pattern: new RegExp(`^una tarea periódica ${FORMA_Y_DIAS} creada el ${P}$`),
		run: (world, formaYConector, dias, creada) =>
			crear(world, { titulo: 'Tarea', ...diasDe(formaDe(formaYConector), dias) }, fechaHora(creada))
	},
	{
		pattern: new RegExp(`^una tarea periódica ${FORMA_Y_DIAS}$`),
		run: (world, formaYConector, dias) => crear(world, { titulo: 'Tarea', ...diasDe(formaDe(formaYConector), dias) })
	},
	{
		pattern: new RegExp(`^una tarea periódica ${FORMA_TITULO_Y_DIAS}$`),
		run: (world, forma, titulo, conector, dias) =>
			crear(world, { titulo, ...diasDe(formaDe(`${forma} ${conector}`), dias) }, ANTES_DEL_ESCENARIO)
	},
	{
		pattern: new RegExp(`^una tarea periódica ${FORMA_TITULO_Y_DIAS} creada el ${P}$`),
		run: (world, forma, titulo, conector, dias, creada) =>
			crear(world, { titulo, ...diasDe(formaDe(`${forma} ${conector}`), dias) }, fechaHora(creada))
	},
	{
		pattern: new RegExp(`^la tarea ${TITULO} tiene un completado que cubre el ${P}$`),
		run: (world, titulo, cubierta) =>
			agregarCompletado(world, fecha(cubierta), fecha(cubierta), laTareaTitulada(world, titulo))
	},
	{
		pattern: new RegExp(`^la tarea ${TITULO} tiene un completado del ${P} que cubre el ${P}$`),
		run: (world, titulo, completada, cubierta) =>
			agregarCompletado(world, fechaHora(completada), ocurrencia(cubierta), laTareaTitulada(world, titulo))
	},
	{
		pattern: new RegExp(`^la tarea tiene un completado del ${P} que cubre el ${P}$`),
		run: (world, completada, cubierta) => agregarCompletado(world, fechaHora(completada), ocurrencia(cubierta))
	},
	{
		// El momento no influye en el resultado: se usa el inicio del día cubierto.
		pattern: new RegExp(`^la tarea tiene un completado que cubre el ${P}$`),
		run: (world, cubierta) => agregarCompletado(world, fecha(cubierta), fecha(cubierta))
	},
	{
		pattern: /^la tarea tiene otro completado más antiguo que cubre la misma ocurrencia$/,
		run: (world) => {
			const ultimo = elUltimoCompletado(world);
			if (!ultimo.ocurrenciaCubierta) throw new Error('El último completado no cubre ninguna ocurrencia');
			agregarCompletado(world, new Date(ultimo.completadoEn.getTime() - UN_DIA_MS), ultimo.ocurrenciaCubierta);
		}
	},
	{
		pattern: new RegExp(`^se registró un completado que cubre el ${P}$`),
		run: (world, cubierta) => {
			expect(world.nuevoCompletado).toStrictEqual({
				id: expect.any(String),
				tareaId: laTarea(world).id,
				completadoEn: world.momentoDelNuevoCompletado,
				ocurrenciaCubierta: ocurrencia(cubierta)
			});
		}
	}
];
