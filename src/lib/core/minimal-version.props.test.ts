// Spec §4.1 (Versión mínima), §5.4, §6.1, §6.3: propiedades de la mínima.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { avisoAlCompletar, textoDelAviso } from './notice';
import { accionDelCheckbox } from './checkbox';
import { clasificarEnPendientes } from './completed';
import { completar } from './completions';
import { datosDeTarea } from './task-data';
import { editar } from './editing';
import { estadoDeTarea } from './task-status';
import { historial } from './history';
import { cambioAlBorrarCompletado, cambioAlCompletar } from './current-step';
import { pasoEnQueVa } from './steps';
import type { Completado, Horario, Tarea } from './task';
import { hacerLaMinima, lineaDeMinima } from './minimal-version';

const instante = fc.integer({ min: 0, max: 4_102_444_800_000 }).map((ms) => new Date(ms));
const dia = fc.integer({ min: 0, max: 47_000 }).map((n) => new Date(1970, 0, 1 + n));
const textoConLetras = fc.stringMatching(/^[a-zA-Z]{1,10}$/);
const ventana = fc.constantFrom<Horario | undefined>([{ desde: '08:00', hasta: '12:00' }], [{ desde: '00:00', hasta: '06:00' }], undefined);
const tareaConMinima = fc
	.record({
		tipo: fc.constantFrom('puntual' as const, 'relativa' as const, 'calendario' as const),
		creadaEn: dia,
		horario: ventana,
		versionMinima: fc.option(textoConLetras, { nil: undefined }),
		pasos: fc.array(textoConLetras, { maxLength: 3 }),
		pasoActual: fc.integer({ min: 2, max: 4 })
	})
	.map(({ tipo, creadaEn, horario, versionMinima, pasos, pasoActual }): Tarea => {
		const comun = { id: 't', titulo: 'T', creadaEn, ...(horario && { horario }), ...(versionMinima && { versionMinima }), ...(pasos.length > 0 && { pasos, pasoActual }) };
		if (tipo === 'puntual') return { ...comun, tipo: 'puntual' };
		const recurrencia = tipo === 'relativa' ? { modo: 'relativo' as const, cada: 2, unidad: 'dias' as const } : { modo: 'calendario' as const, diasMes: [1, 15] };
		return { ...comun, tipo: 'periodica', recurrencia };
	});
const completados = fc
	.array(fc.tuple(fc.constantFrom('t', 'otra'), instante), { maxLength: 4 })
	.map((lista) => lista.map(([tareaId, completadoEn], i): Completado => ({ id: `c${i}`, tareaId, completadoEn })));

describe('versión mínima (propiedades)', () => {
	it('mirar la mínima no cambia la tarea, los completados ni su estado', () => {
		fc.assert(
			fc.property(tareaConMinima, completados, instante, (t, hechos, ahora) => {
				const antes = structuredClone({ t, hechos, estado: estadoDeTarea(t, hechos, ahora) });
				const estado = clasificarEnPendientes(t, hechos, ahora).estado;
				lineaDeMinima(t, estado, hechos, ahora);
				hacerLaMinima(t, hechos, 'n', ahora);
				expect(structuredClone({ t, hechos, estado: estadoDeTarea(t, hechos, ahora) })).toEqual(antes);
			})
		);
	});

	it('hacerLaMinima ofrece algo solo con versión mínima, fila pendiente o atrasada y checkbox habilitado', () => {
		fc.assert(
			fc.property(tareaConMinima, completados, instante, (t, hechos, ahora) => {
				const estado = estadoDeTarea(t, hechos, ahora);
				const hecho = hacerLaMinima(t, hechos, 'n', ahora);
				const debeOfrecer = t.versionMinima !== undefined && (estado.tipo === 'pendiente' || estado.tipo === 'atrasada') && accionDelCheckbox(t, hechos, ahora).tipo === 'completar';
				expect(hecho !== undefined).toBe(debeOfrecer);
			})
		);
	});

	it('la línea de la mínima es «Mínima: » más el texto completo, y solo con versión mínima', () => {
		fc.assert(
			fc.property(tareaConMinima, completados, instante, (t, hechos, ahora) => {
				const { estado } = clasificarEnPendientes(t, hechos, ahora);
				const linea = lineaDeMinima(t, estado, hechos, ahora);
				if (t.versionMinima === undefined) expect(linea).toBeUndefined();
				else if (linea) expect(linea.texto).toBe(`Mínima: ${t.versionMinima}`);
			})
		);
	});

	it('completar con la mínima deja el mismo estado que el checkbox, y solo se distingue por fueMinima', () => {
		fc.assert(
			fc.property(tareaConMinima, completados, instante, (t, hechos, ahora) => {
				const minima = hacerLaMinima(t, hechos, 'n', ahora);
				fc.pre(minima !== undefined);
				const entero = completar(t, hechos, 'n', ahora);
				expect(minima).toEqual({ ...entero, fueMinima: true });
				expect(estadoDeTarea(t, [...hechos, minima!], ahora)).toEqual(estadoDeTarea(t, [...hechos, entero], ahora));
			})
		);
	});

	it('un completado entero nunca lleva fueMinima', () => {
		fc.assert(
			fc.property(tareaConMinima, completados, instante, (t, hechos, ahora) => {
				expect('fueMinima' in completar(t, hechos, 'n', ahora)).toBe(false);
				expect('fueMinima' in completar(t, hechos, 'n', ahora, false)).toBe(false);
				expect(completar(t, hechos, 'n', ahora, true).fueMinima).toBe(true);
			})
		);
	});

	it('completar con la mínima y deshacer devuelve el mismo paso actual', () => {
		fc.assert(
			fc.property(tareaConMinima, instante, (t, ahora) => {
				const minima = hacerLaMinima(t, [], 'n', ahora);
				fc.pre(minima !== undefined);
				const alCompletar = cambioAlCompletar(t);
				const completa: Tarea = { ...t, ...(alCompletar.pasoActual === null ? { pasoActual: undefined } : alCompletar) } as Tarea;
				const deshecho = { ...completa, ...cambioAlBorrarCompletado(completa, [minima!], minima!) } as Tarea;
				expect(pasoEnQueVa(deshecho)).toBe(pasoEnQueVa(t));
			})
		);
	});

	it('el texto del aviso y del Historial termina en «mínima»/«Mínima» solo si fue la mínima', () => {
		fc.assert(
			fc.property(tareaConMinima, instante, fc.boolean(), (t, ahora, fueMinima) => {
				const completado = completar(t, [], 'n', ahora, fueMinima);
				expect(textoDelAviso(avisoAlCompletar(t, completado)).endsWith(' · mínima')).toBe(fueMinima);
				const { textoDeHora, hora } = historial([t], [completado], ahora)[0].entradas[0];
				expect(textoDeHora.endsWith(' Mínima')).toBe(fueMinima);
				expect(textoDeHora).toBe(fueMinima ? `${hora} Mínima` : hora);
			})
		);
	});

	it('editar solo escribe versionMinima si cambió', () => {
		fc.assert(
			fc.property(tareaConMinima, fc.option(textoConLetras, { nil: undefined }), (t, nueva) => {
				const datos = datosDeTarea(t);
				const resultado = editar(t, { ...datos, versionMinima: nueva ?? '' });
				fc.pre(resultado.ok);
				if (!resultado.ok) return;
				expect('versionMinima' in resultado.cambio).toBe(nueva !== t.versionMinima);
				const sinCambio = editar(t, datos);
				if (sinCambio.ok) expect('versionMinima' in sinCambio.cambio).toBe(false);
			})
		);
	});
});
