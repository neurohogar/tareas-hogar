import { inicioDeEspera } from './completions';
import { inicioDelDia } from './days';
import type { EstadoEnPendientes } from './status';
import { ultimaOcurrenciaCubierta } from './covered-occurrence';
import { primeraOcurrenciaPosterior } from './occurrences';
import type { Completado, RecurrenciaCalendario } from './task';

/** Spec §5.3: N, la primera ocurrencia posterior a P (la última ocurrencia cubierta). */
export function proximaOcurrencia(recurrencia: RecurrenciaCalendario, creadaEn: Date, completados: readonly Completado[]): Date {
	return primeraOcurrenciaPosterior(recurrencia, ultimaOcurrenciaCubierta(creadaEn, completados));
}

/**
 * Spec §5.3. P = última ocurrencia cubierta, N = la primera ocurrencia posterior a P.
 * hoy < N → en espera; hoy = N → pendiente; hoy > N → atrasada (una sola vez).
 */
export function estadoPeriodicaCalendario(
	recurrencia: RecurrenciaCalendario,
	creadaEn: Date,
	completados: readonly Completado[],
	ahora: Date
): EstadoEnPendientes {
	const n = proximaOcurrencia(recurrencia, creadaEn, completados).getTime();
	const hoy = inicioDelDia(ahora).getTime();

	if (hoy > n) return { tipo: 'atrasada' };
	if (hoy === n) return { tipo: 'pendiente' };
	// Un inicio de espera posterior a ahora (otro reloj) cuenta como ahora: el progreso queda entre 0 y 1.
	const inicio = Math.min(inicioDeEspera(creadaEn, completados), ahora.getTime());
	return { tipo: 'en espera', progreso: (ahora.getTime() - inicio) / (n - inicio) };
}
