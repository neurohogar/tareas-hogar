// Spec §4.4: ocurrenciaCubierta guardada como texto. Una fecha (2026-07-14) y
// una fecha y hora (2026-07-14T07:00) tienen formatos distintos, así una
// ventana que empieza a las 00:00 no se confunde con una fecha.
import { diaDesdeIso, diaIso, dosDigitos, enElMinuto, horaYMinuto } from './dias';
import type { OcurrenciaCubierta } from './tarea';

const FECHA_Y_HORA = /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):([0-5]\d)$/;

export function ocurrenciaEnTexto(ocurrencia: OcurrenciaCubierta): string {
	if (ocurrencia instanceof Date) return diaIso(ocurrencia);
	const { hora, minuto } = horaYMinuto(ocurrencia.inicio);
	return `${diaIso(ocurrencia.inicio)}T${dosDigitos(hora)}:${dosDigitos(minuto)}`;
}

/** Para valores ya guardados: uno inválido es un error. */
export function ocurrenciaDesdeTexto(texto: string): OcurrenciaCubierta {
	const partes = FECHA_Y_HORA.exec(texto);
	if (!partes) return diaDesdeIso(texto);
	const [, fecha, hora, minuto] = partes;
	return { inicio: enElMinuto(diaDesdeIso(fecha), Number(hora) * 60 + Number(minuto)) };
}
