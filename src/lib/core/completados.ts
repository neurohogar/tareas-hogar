import { ocurrenciaQueCubre, ultimaOcurrenciaCubierta } from './ocurrencia-cubierta';
import { ocurrenciaQueCubreCalendario, ocurrenciaQueCubrePorVentana, seCompletaPorVentana } from './ocurrencias-con-horario';
import { comoRecienCreada } from './pausa';
import type { Completado, OcurrenciaCubierta, Tarea, TareaPeriodica } from './tarea';

/**
 * La ocurrencia que cubre un completado de una periódica, o undefined si no
 * cubre ninguna: de calendario, un día (§5.3) o, con horario, el inicio de una
 * ocurrencia (§5.6); relativa, solo si se completa por ventana (§5.7).
 */
function ocurrenciaDe({ recurrencia, creadaEn, horario, reanudadaEn }: TareaPeriodica, propios: Completado[], ahora: Date): OcurrenciaCubierta | undefined {
	if (recurrencia.modo === 'relativo') {
		if (!horario || !seCompletaPorVentana(recurrencia, horario)) return undefined;
		return { inicio: ocurrenciaQueCubrePorVentana(recurrencia, horario, creadaEn, propios, ahora) };
	}
	if (horario) return { inicio: ocurrenciaQueCubreCalendario(recurrencia, horario, creadaEn, propios, ahora, reanudadaEn) };
	return ocurrenciaQueCubre(recurrencia, ultimaOcurrenciaCubierta(creadaEn, propios), ahora);
}

/**
 * Spec §4.4: completar agrega un registro nuevo; nunca modifica los anteriores.
 * Guarda la ocurrencia que cubre, si cubre una, según lo que ya cubrieron los
 * completados de la tarea (de entre todos los del usuario); de una reanudada,
 * como recién creada en reanudadaEn (§5.8).
 */
export function completar(guardada: Tarea, completados: readonly Completado[], id: string, ahora: Date): Completado {
	const completado: Completado = { id, tareaId: guardada.id, completadoEn: ahora };
	const { tarea, propios } = comoRecienCreada(guardada, completadosDeTarea(completados, guardada.id));
	if (tarea.tipo === 'puntual') return completado;
	const ocurrenciaCubierta = ocurrenciaDe(tarea, propios, ahora);
	return ocurrenciaCubierta ? { ...completado, ocurrenciaCubierta } : completado;
}

/** El de completadoEn mayor (si empatan, el primero); los completados no pueden estar vacíos. */
export function completadoMasReciente(completados: readonly Completado[]): Completado {
	return completados.reduce((masReciente, completado) =>
		completado.completadoEn.getTime() > masReciente.completadoEn.getTime() ? completado : masReciente
	);
}

/** El inicio de espera de una periódica (§5.3, §5.5): el completadoEn más reciente o, sin completados, creadaEn; en ms. */
export function inicioDeEspera(creadaEn: Date, completados: readonly Completado[]): number {
	return completados.length === 0 ? creadaEn.getTime() : ultimoCompletadoEn(completados);
}

/** El completadoEn más reciente, en ms; los completados no pueden estar vacíos. */
export function ultimoCompletadoEn(completados: readonly Completado[]): number {
	return completadoMasReciente(completados).completadoEn.getTime();
}

export function completadosDeTarea(completados: readonly Completado[], tareaId: string): Completado[] {
	return completados.filter((completado) => completado.tareaId === tareaId);
}
