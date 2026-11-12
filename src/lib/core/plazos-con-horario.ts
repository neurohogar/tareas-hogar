// Spec §5.5–§5.7: A, el atraso y el inicio de espera de una periódica con
// horario, según su recurrencia.
import { inicioDeEspera } from './completados';
import { plazosDesdeMomentos, type PlazosConHorario } from './estado-con-horario';
import { momentosRelativa } from './estado-periodica-relativa';
import type { Ocurrencia } from './horario';
import { proximaOcurrenciaCalendario, proximaOcurrenciaPorVentana, seCompletaPorVentana } from './ocurrencias-con-horario';
import type { Completado, Horario, TareaPeriodica } from './tarea';

/** Spec §5.6 y §5.7: A es el inicio de N y el atraso, su cierre (C). */
const plazosDeOcurrencia = ({ inicio, cierre }: Ocurrencia, desde: number): PlazosConHorario => ({
	disponible: inicio,
	atraso: cierre,
	inicioDeEspera: desde
});

export function plazosConHorario(
	{ recurrencia, creadaEn, reanudadaEn }: TareaPeriodica,
	horario: Horario,
	completadosDeLaTarea: readonly Completado[]
): PlazosConHorario {
	const desde = inicioDeEspera(creadaEn, completadosDeLaTarea);
	if (recurrencia.modo === 'calendario')
		return plazosDeOcurrencia(proximaOcurrenciaCalendario(recurrencia, horario, creadaEn, completadosDeLaTarea, reanudadaEn), desde);
	if (seCompletaPorVentana(recurrencia, horario))
		return plazosDeOcurrencia(proximaOcurrenciaPorVentana(recurrencia, horario, creadaEn, completadosDeLaTarea), desde);
	return plazosDesdeMomentos(horario, momentosRelativa(recurrencia, creadaEn, completadosDeLaTarea));
}
