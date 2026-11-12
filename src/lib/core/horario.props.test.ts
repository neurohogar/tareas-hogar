import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { sumarDias } from './dias';
import { cierreDelDia, dentroDelHorario, leerHorario, ocurrenciasDelDia, textoDelHorario, ultimoCierre, ventanaDisponible } from './horario';
import type { Horario } from './tarea';

const hora = (minutos: number) => `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
const minutosDelDia = fc.integer({ min: 0, max: 1439 });
/** Un horario válido (§4.1): de una a cuatro ventanas ordenadas y sin superponerse. */
const horario: fc.Arbitrary<Horario> = fc
	.integer({ min: 1, max: 4 })
	.chain((n) => fc.uniqueArray(minutosDelDia, { minLength: 2 * n, maxLength: 2 * n }))
	.map((minutos) => {
		const orden = [...minutos].sort((a, b) => a - b);
		return orden.flatMap((m, i) => (i % 2 === 0 ? [{ desde: hora(m), hasta: hora(orden[i + 1]) }] : []));
	});
const instante = fc.integer({ min: 0, max: 4_102_444_800_000 }).map((ms) => new Date(ms));
/** Minutos locales desde las 00:00 del momento (solo para comparar con las horas HH:MM). */
const minutoLocal = (momento: Date) => momento.getHours() * 60 + momento.getMinutes();
const minutosDe = (texto: string) => Number(texto.slice(0, 2)) * 60 + Number(texto.slice(3));

describe('leerHorario (propiedades)', () => {
	it('un horario válido se lee tal cual: leer es idempotente sobre lo guardado', () => {
		fc.assert(
			fc.property(horario, (h) => {
				expect(leerHorario(h)).toEqual({ ok: true, horario: h });
			})
		);
	});

	it('dos horas con desde ≥ hasta: la de fin no es posterior', () => {
		fc.assert(
			fc.property(minutosDelDia, minutosDelDia, (a, b) => {
				fc.pre(a >= b);
				expect(leerHorario([{ desde: hora(a), hasta: hora(b) }])).toEqual({
					ok: false,
					error: 'finNoPosterior'
				});
			})
		);
	});

	it('si falta una de las dos horas, está incompleto', () => {
		fc.assert(
			fc.property(minutosDelDia, fc.boolean(), fc.constantFrom(undefined, ''), (m, faltaDesde, falta) => {
				const escrito = faltaDesde ? { desde: falta, hasta: hora(m) } : { desde: hora(m), hasta: falta };
				expect(leerHorario([escrito])).toEqual({
					ok: false,
					error: 'incompleto'
				});
			})
		);
	});

	it('el orden en que se escriben las ventanas no importa: se guardan ordenadas por desde', () => {
		fc.assert(
			fc.property(
				horario.chain((h) => fc.tuple(fc.constant(h), fc.shuffledSubarray(h, { minLength: h.length, maxLength: h.length }))),
				([h, escrito]) => {
					expect(leerHorario(escrito)).toEqual({ ok: true, horario: h });
				}
			)
		);
	});

	it('dos ventanas que se pisan están superpuestas, en cualquier orden', () => {
		fc.assert(
			fc.property(fc.uniqueArray(minutosDelDia, { minLength: 3, maxLength: 3 }), minutosDelDia, fc.boolean(), (tres, extra, invertir) => {
				// a < b < c ≤ max(c, extra): [a, c) y [b, max(c, extra)) comparten [b, c).
				const [a, b, c] = [...tres].sort((x, y) => x - y);
				const ventanas = [
					{ desde: hora(a), hasta: hora(c) },
					{ desde: hora(b), hasta: hora(Math.max(c, extra)) }
				];
				expect(leerHorario(invertir ? ventanas.reverse() : ventanas)).toEqual({ ok: false, error: 'superpuestos' });
			})
		);
	});

	it('el texto de la fila nombra cada ventana, en orden, separadas por " · "', () => {
		fc.assert(
			fc.property(horario, (h) => {
				const partes = textoDelHorario(h).split(' · ');
				expect(partes).toEqual(h.map(({ desde, hasta }) => `${desde}–${hasta}`));
			})
		);
	});
});

describe('ventana del horario (propiedades)', () => {
	it('dentro del horario: el minuto local está en [desde, hasta) de alguna ventana', () => {
		fc.assert(
			fc.property(horario, instante, (h, ahora) => {
				const minuto = minutoLocal(ahora);
				expect(dentroDelHorario(h, ahora)).toBe(h.some(({ desde, hasta }) => minuto >= minutosDe(desde) && minuto < minutosDe(hasta)));
			})
		);
	});

	it('A es el primer instante ≥ desde dentro de una ventana, y C el hasta de esa ventana', () => {
		fc.assert(
			fc.property(horario, instante, (h, desde) => {
				const { disponible, cierre } = ventanaDisponible(h, desde);
				expect(disponible).toBeGreaterThanOrEqual(desde.getTime());
				expect(dentroDelHorario(h, new Date(disponible))).toBe(true);
				// C es el hasta de la ventana del día de A que contiene A.
				const ventana = ocurrenciasDelDia(h, new Date(disponible)).find(({ inicio, cierre }) => inicio <= disponible && disponible < cierre);
				expect(cierre).toBe(ventana?.cierre);
				// Entre desde y A no hay instante dentro de una ventana: A es el primero.
				if (disponible > desde.getTime()) expect(dentroDelHorario(h, new Date(disponible - 1))).toBe(false);
			})
		);
	});

	it('A es idempotente: desde A, la ventana disponible es la misma', () => {
		fc.assert(
			fc.property(horario, instante, (h, desde) => {
				const ventana = ventanaDisponible(h, desde);
				expect(ventanaDisponible(h, new Date(ventana.disponible))).toEqual(ventana);
			})
		);
	});

	it('el último cierre ya pasó y no hay otro cierre entre él y ahora', () => {
		fc.assert(
			fc.property(horario, instante, (h, ahora) => {
				const cierre = ultimoCierre(h, ahora);
				expect(cierre).toBeLessThanOrEqual(ahora.getTime());
				const cierres = [-1, 0, 1].flatMap((d) => ocurrenciasDelDia(h, sumarDias(ahora, d)).map((o) => o.cierre));
				expect(cierres).toContain(cierre);
				expect(cierres.filter((c) => c > cierre && c <= ahora.getTime())).toEqual([]);
			})
		);
	});

	it('el cierre del día es el hasta de su última ventana', () => {
		fc.assert(
			fc.property(horario, instante, (h, dia) => {
				expect(cierreDelDia(h, dia)).toBe(Math.max(...ocurrenciasDelDia(h, dia).map((o) => o.cierre)));
			})
		);
	});
});
