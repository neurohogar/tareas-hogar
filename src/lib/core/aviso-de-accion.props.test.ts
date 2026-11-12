// Spec §6.2 (Aviso de acción): qué ofrece el aviso y cuándo una acción pide confirmación.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { cambioDeAccion, queHaceLaAccion, type AccionDelPanel } from './accion-del-panel';
import { avisoDeAccion, descartarYActuar, guardarYActuar, type AccionEnAviso } from './aviso-de-accion';
import { MENSAJE_DE_CAMBIOS, SEGUIR_EDITANDO } from './cambios-sin-guardar-aviso';
import type { DatosDeTarea } from './datos-de-tarea';
import type { TareaPeriodica } from './tarea';

const ACCIONES: AccionDelPanel[] = ['pausar', 'reanudar', 'posponer 1 hora', 'posponer 3 horas', 'posponer hasta mañana', 'quitar posponer'];
const ahora = fc.date({ min: new Date(2000, 0, 1), max: new Date(2100, 0, 1), noInvalidDate: true });
const titulo = fc.stringMatching(/^[a-z]{1,8}$/);
const RELATIVA: TareaPeriodica = { id: 't', titulo: 'Regar', tipo: 'periodica', recurrencia: { modo: 'relativo', cada: 2, unidad: 'dias' }, creadaEn: new Date(2026, 0, 1) };

/** Pausar una periódica activa con lo escrito en el formulario. */
const pausando = (datos: DatosDeTarea, momento: Date): AccionEnAviso => ({
	accion: 'pausar',
	tareaAlAbrir: RELATIVA,
	tarea: RELATIVA,
	completados: [],
	ahora: momento,
	formulario: { datos, etiquetas: [], sinConfirmar: '' },
	existentes: []
});
const sigueRelativa = (t: string): DatosDeTarea => ({ forma: 'relativa', titulo: t, cada: 2, unidad: 'dias' });
const pasaAPuntual = (t: string): DatosDeTarea => ({ forma: 'puntual', titulo: t });

describe('queHaceLaAccion: propiedades (spec §6.2)', () => {
	it('con cambios abre su aviso y sin cambios actúa', () => {
		fc.assert(fc.property(fc.constantFrom(...ACCIONES), fc.boolean(), (accion, cambios) => {
			expect(queHaceLaAccion(accion, cambios)).toBe(cambios ? 'abre el aviso de acción' : 'actúa');
		}));
	});

	it('Borrar tarea solo pide su confirmación, con o sin cambios', () => {
		fc.assert(fc.property(fc.boolean(), (cambios) => {
			expect(queHaceLaAccion('borrar tarea', cambios)).toBe('pide confirmar el borrado');
		}));
	});
});

describe('cambioDeAccion: propiedades (spec §5.8, §5.9)', () => {
	it('es una función del ahora: el mismo momento da el mismo cambio, y reanudar lo guarda', () => {
		fc.assert(
			fc.property(fc.constantFrom(...ACCIONES), ahora, (accion, momento) => {
				expect(cambioDeAccion(accion, momento)).toStrictEqual(cambioDeAccion(accion, new Date(momento.getTime())));
			})
		);
		fc.assert(fc.property(ahora, (momento) => {
			expect(cambioDeAccion('reanudar', momento).reanudadaEn).toEqual(momento);
		}));
	});
});

describe('avisoDeAccion: propiedades (spec §6.2)', () => {
	it('siempre ofrece Seguir editando primero y Descartar y <acción> después', () => {
		fc.assert(
			fc.property(titulo, fc.boolean(), ahora, (t, sigue, momento) => {
				const aviso = avisoDeAccion(pausando(sigue ? sigueRelativa(t) : pasaAPuntual(t), momento));
				expect(aviso?.botones.slice(0, 2)).toEqual([SEGUIR_EDITANDO, { texto: 'Descartar y pausar', efecto: 'descartar' }]);
			})
		);
	});

	it('ofrece Guardar y <acción> exactamente cuando lo guardado deja la acción con sentido', () => {
		fc.assert(
			fc.property(titulo, fc.boolean(), ahora, (t, sigue, momento) => {
				const aviso = avisoDeAccion(pausando(sigue ? sigueRelativa(t) : pasaAPuntual(t), momento));
				expect(aviso?.botones.some(({ efecto }) => efecto === 'guardar')).toBe(sigue);
				expect(aviso?.mensaje).toBe(sigue ? MENSAJE_DE_CAMBIOS : 'Con estos cambios la tarea ya no se puede pausar');
			})
		);
	});

	it('si la acción ya no corresponde, no hay aviso y ningún botón actúa', () => {
		fc.assert(
			fc.property(titulo, ahora, (t, momento) => {
				const contexto = { ...pausando(sigueRelativa(t), momento), accion: 'reanudar' as const };
				expect(avisoDeAccion(contexto)).toBeUndefined();
				expect(descartarYActuar(contexto)).toBeUndefined();
				expect(guardarYActuar(contexto, () => 'x')).toEqual({ resultado: 'aviso cerrado' });
			})
		);
	});

	it('Descartar y actuar escribe solo la acción, sin lo escrito en el formulario', () => {
		fc.assert(fc.property(titulo, ahora, (t, momento) => {
			expect(descartarYActuar(pausando(sigueRelativa(t), momento))).toEqual(cambioDeAccion('pausar', momento));
		}));
	});

	it('Guardar y actuar guarda lo escrito y la acción en un solo cambio', () => {
		fc.assert(
			fc.property(titulo, ahora, (t, momento) => {
				const resultado = guardarYActuar(pausando(sigueRelativa(t), momento), () => 'x');
				expect(resultado.resultado).toBe('guardado');
				if (resultado.resultado === 'guardado') expect(resultado.cambio).toMatchObject({ pausada: true });
			})
		);
	});

	it('si lo guardado deja la acción sin sentido, Guardar y actuar no guarda nada', () => {
		fc.assert(
			fc.property(titulo, ahora, (t, momento) => {
				const resultado = guardarYActuar(pausando(pasaAPuntual(t), momento), () => 'x');
				expect(resultado.resultado).toBe('aviso actualizado');
			})
		);
	});
});
